/**
 * Evaluator - Quality and risk scoring for outcomes
 * 
 * Scores task outputs, detects regressions, and provides
 * feedback for the learning loop.
 */

import { db } from "./db-wrapper";
import { outcomes, tasks, modelRegistry } from "../../drizzle/business-os-schema";
import { eq } from "drizzle-orm";

export interface EvaluationCriteria {
  name: string;
  weight: number;
  scorer: (output: any, context: EvaluationContext) => Promise<number>;
}

export interface EvaluationContext {
  taskId: string;
  taskType: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  expectedOutcome?: Record<string, any>;
  historicalBaseline?: Record<string, number>;
}

export interface EvaluationResult {
  overallScore: number;
  scores: Record<string, number>;
  passed: boolean;
  feedback: string[];
  regressionDetected: boolean;
}

export class Evaluator {
  private criteria: Map<string, EvaluationCriteria[]> = new Map();

  /**
   * Register evaluation criteria for a task type
   */
  registerCriteria(taskType: string, criteria: EvaluationCriteria[]) {
    this.criteria.set(taskType, criteria);
  }

  /**
   * Evaluate task outcome
   */
  async evaluateOutcome(context: EvaluationContext): Promise<EvaluationResult> {
    const criteria = this.criteria.get(context.taskType) || [];
    
    if (criteria.length === 0) {
      // No criteria defined, use default evaluation
      return this.defaultEvaluation(context);
    }

    const scores: Record<string, number> = {};
    const feedback: string[] = [];
    let weightedSum = 0;
    let totalWeight = 0;

    // Evaluate each criterion
    for (const criterion of criteria) {
      try {
        const score = await criterion.scorer(context.outputs, context);
        scores[criterion.name] = score;
        weightedSum += score * criterion.weight;
        totalWeight += criterion.weight;

        if (score < 0.6) {
          feedback.push(`${criterion.name}: Below acceptable threshold (${score.toFixed(2)})`);
        }
      } catch (error: any) {
        feedback.push(`${criterion.name}: Evaluation error - ${error.message}`);
      }
    }

    const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const passed = overallScore >= 0.7;

    // Check for regression
    const regressionDetected = await this.detectRegression(
      context.taskType,
      overallScore,
      context.historicalBaseline
    );

    if (regressionDetected) {
      feedback.push("⚠️ Regression detected: Performance below historical baseline");
    }

    // Store outcome
    await this.storeOutcome(context, overallScore, scores, passed, feedback);

    return {
      overallScore,
      scores,
      passed,
      feedback,
      regressionDetected,
    };
  }

  /**
   * Default evaluation for tasks without specific criteria
   */
  private async defaultEvaluation(context: EvaluationContext): Promise<EvaluationResult> {
    const scores: Record<string, number> = {};
    const feedback: string[] = [];

    // Check if outputs exist
    if (!context.outputs || Object.keys(context.outputs).length === 0) {
      return {
        overallScore: 0,
        scores,
        passed: false,
        feedback: ["No outputs produced"],
        regressionDetected: false,
      };
    }

    // Check for errors
    if (context.outputs.error) {
      return {
        overallScore: 0,
        scores,
        passed: false,
        feedback: [`Error: ${context.outputs.error}`],
        regressionDetected: false,
      };
    }

    // Default to passing if no errors
    return {
      overallScore: 0.8,
      scores: { default: 0.8 },
      passed: true,
      feedback: ["Task completed successfully"],
      regressionDetected: false,
    };
  }

  /**
   * Detect regression compared to historical baseline
   */
  private async detectRegression(
    taskType: string,
    currentScore: number,
    baseline?: Record<string, number>
  ): Promise<boolean> {
    if (!baseline || !baseline.avgScore) {
      return false;
    }

    // Regression if score drops more than 15% below baseline
    const threshold = baseline.avgScore * 0.85;
    return currentScore < threshold;
  }

  /**
   * Store outcome in database
   */
  private async storeOutcome(
    context: EvaluationContext,
    score: number,
    scores: Record<string, number>,
    success: boolean,
    feedback: string[]
  ) {
    await db.insert(outcomes).values({
      id: this.generateId(),
      taskId: context.taskId,
      result: context.outputs,
      rewardScore: score.toString(),
      metrics: scores,
      success,
      feedback: feedback.join("\n"),
      createdAt: new Date(),
    });
  }

  /**
   * Initialize built-in evaluation criteria
   */
  initializeBuiltInCriteria() {
    // Content generation evaluation
    this.registerCriteria("content_generation", [
      {
        name: "completeness",
        weight: 0.3,
        scorer: async (output) => {
          if (!output.content) return 0;
          const wordCount = output.content.split(/\s+/).length;
          return Math.min(wordCount / 100, 1.0); // Expect at least 100 words
        },
      },
      {
        name: "quality",
        weight: 0.4,
        scorer: async (output) => {
          if (!output.content) return 0;
          // Simple heuristics (production would use LLM evaluation)
          const hasTitle = output.title && output.title.length > 0;
          const hasContent = output.content.length > 50;
          const hasStructure = output.content.includes("\n");
          return (hasTitle ? 0.4 : 0) + (hasContent ? 0.4 : 0) + (hasStructure ? 0.2 : 0);
        },
      },
      {
        name: "relevance",
        weight: 0.3,
        scorer: async (output, context) => {
          // Check if output mentions key terms from input
          if (!output.content || !context.inputs.topic) return 0.5;
          const topic = context.inputs.topic.toLowerCase();
          const content = output.content.toLowerCase();
          return content.includes(topic) ? 1.0 : 0.3;
        },
      },
    ]);

    // Pricing decision evaluation
    this.registerCriteria("pricing_decision", [
      {
        name: "margin_safety",
        weight: 0.4,
        scorer: async (output) => {
          if (!output.marginPercent) return 0;
          if (output.marginPercent < 0.15) return 0; // Below floor
          if (output.marginPercent >= 0.30) return 1.0; // Healthy
          return (output.marginPercent - 0.15) / 0.15; // Linear between floor and healthy
        },
      },
      {
        name: "competitiveness",
        weight: 0.3,
        scorer: async (output, context) => {
          if (!output.price || !context.inputs.marketPrice) return 0.5;
          const ratio = output.price / context.inputs.marketPrice;
          if (ratio > 1.2) return 0.3; // Too expensive
          if (ratio < 0.8) return 0.3; // Suspiciously cheap
          return 1.0 - Math.abs(1.0 - ratio); // Closer to market = better
        },
      },
      {
        name: "consistency",
        weight: 0.3,
        scorer: async (output, context) => {
          if (!output.price || !context.historicalBaseline?.avgPrice) return 0.5;
          const change = Math.abs(output.price - context.historicalBaseline.avgPrice) / context.historicalBaseline.avgPrice;
          if (change > 0.3) return 0.3; // Large change
          return 1.0 - change; // Smaller change = more consistent
        },
      },
    ]);

    // Creator allocation evaluation
    this.registerCriteria("creator_allocation", [
      {
        name: "performance_match",
        weight: 0.4,
        scorer: async (output, context) => {
          if (!output.creatorId || !output.performanceScore) return 0;
          return output.performanceScore; // Use creator's historical performance
        },
      },
      {
        name: "availability",
        weight: 0.3,
        scorer: async (output) => {
          return output.available ? 1.0 : 0;
        },
      },
      {
        name: "audience_fit",
        weight: 0.3,
        scorer: async (output, context) => {
          if (!output.audienceMatch) return 0.5;
          return output.audienceMatch; // Audience alignment score
        },
      },
    ]);

    // Payout processing evaluation
    this.registerCriteria("payout_processing", [
      {
        name: "reconciliation",
        weight: 0.5,
        scorer: async (output) => {
          return output.reconciled ? 1.0 : 0;
        },
      },
      {
        name: "risk_score",
        weight: 0.3,
        scorer: async (output) => {
          if (!output.riskScore) return 0.5;
          return 1.0 - output.riskScore; // Lower risk = higher score
        },
      },
      {
        name: "timeliness",
        weight: 0.2,
        scorer: async (output, context) => {
          if (!output.processedAt || !context.inputs.dueDate) return 0.5;
          const processed = new Date(output.processedAt).getTime();
          const due = new Date(context.inputs.dueDate).getTime();
          return processed <= due ? 1.0 : 0.5;
        },
      },
    ]);
  }

  /**
   * Get historical baseline for task type
   */
  async getHistoricalBaseline(taskType: string, orgUnitId?: string): Promise<Record<string, number> | undefined> {
    const recentOutcomes = await db.query.outcomes.findMany({
      where: eq(outcomes.success, true),
      limit: 100,
      orderBy: (outcomes, { desc }) => [desc(outcomes.createdAt)],
    });

    if (recentOutcomes.length === 0) {
      return undefined;
    }

    const scores = recentOutcomes.map(o => parseFloat(o.rewardScore || "0"));
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    return {
      avgScore,
      count: recentOutcomes.length,
    };
  }

  private generateId(): string {
    return `out_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const evaluator = new Evaluator();
