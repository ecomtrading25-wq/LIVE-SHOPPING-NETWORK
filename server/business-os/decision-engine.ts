/**
 * Decision Engine - Autonomous decision making with contextual bandits
 * 
 * Proposes actions, simulates impact, chooses via bandits + rules,
 * and learns from outcomes.
 */

import { db } from "./db-wrapper";
import { decisions, experiments, banditArms, banditRewards, stateSnapshots } from "../../drizzle/business-os-schema";
import { eq } from "drizzle-orm";
import { digitalTwin, Scenario } from "./digital-twin";
import { governor } from "./governor";

export interface DecisionType {
  name: string;
  description: string;
  options: DecisionOption[];
  constraints: Record<string, any>;
}

export interface DecisionOption {
  id: string;
  action: Record<string, any>;
  description: string;
}

export interface DecisionContext {
  orgUnitId: string;
  currentState: Record<string, number>;
  constraints: Record<string, any>;
}

export interface DecisionResult {
  selectedOption: DecisionOption;
  reasoning: string;
  predictedImpact: Record<string, number>;
  confidence: number;
  requiresApproval: boolean;
}

export class DecisionEngine {
  private decisionTypes: Map<string, DecisionType> = new Map();
  private epsilon = 0.1; // Exploration rate for epsilon-greedy

  /**
   * Register a decision type
   */
  registerDecisionType(decisionType: DecisionType) {
    this.decisionTypes.set(decisionType.name, decisionType);
  }

  /**
   * Make a decision using contextual bandits
   */
  async makeDecision(
    decisionTypeName: string,
    context: DecisionContext
  ): Promise<DecisionResult> {
    const decisionType = this.decisionTypes.get(decisionTypeName);
    if (!decisionType) {
      throw new Error(`Decision type '${decisionTypeName}' not found`);
    }

    // 1. Get or create experiment
    const experiment = await this.getOrCreateExperiment(decisionTypeName, context.orgUnitId);

    // 2. Get bandit arms (options)
    const arms = await this.getBanditArms(experiment.id);

    // 3. Select option using epsilon-greedy
    const selectedArm = await this.selectArm(arms, context);

    // 4. Simulate impact
    const scenario: Scenario = {
      changes: selectedArm.config as Record<string, number>,
      duration: 7,
      description: selectedArm.name,
    };

    const prediction = await digitalTwin.simulate(context.orgUnitId, scenario);

    // 5. Check policy compliance
    const policyResult = await governor.checkPolicy({
      orgUnitId: context.orgUnitId,
      action: decisionTypeName,
      data: {
        ...selectedArm.config,
        predictedImpact: prediction.metrics,
      },
    });

    // 6. Create decision record
    const decisionId = await this.recordDecision(
      decisionTypeName,
      context.orgUnitId,
      decisionType.options,
      selectedArm.id,
      prediction,
      policyResult.requiresApproval
    );

    return {
      selectedOption: {
        id: selectedArm.id,
        action: selectedArm.config as Record<string, any>,
        description: selectedArm.name,
      },
      reasoning: this.generateReasoning(selectedArm, prediction, context),
      predictedImpact: prediction.metrics,
      confidence: prediction.confidence,
      requiresApproval: policyResult.requiresApproval || !policyResult.allowed,
    };
  }

  /**
   * Record decision outcome (for learning)
   */
  async recordOutcome(
    decisionId: string,
    actualImpact: Record<string, number>,
    reward: number
  ) {
    // Update decision with actual impact
    await db
      .update(decisions)
      .set({
        status: "executed",
        actualImpact: actualImpact as any,
        executedAt: new Date(),
      })
      .where(eq(decisions.id, decisionId));

    // Get decision details
    const decision = await db.query.decisions.findFirst({
      where: eq(decisions.id, decisionId),
    });

    if (!decision || !decision.selectedOption) return;

    // Record reward for bandit learning
    await db.insert(banditRewards).values({
      id: this.generateId("reward"),
      armId: decision.selectedOption,
      experimentId: await this.getExperimentIdForDecision(decision.type),
      context: decision.context as any,
      action: (decision.options as any)[0]?.action || {},
      reward: reward.toString(),
      createdAt: new Date(),
    });

    // Update bandit arm statistics
    await this.updateArmStats(decision.selectedOption, reward);
  }

  /**
   * Get or create experiment for decision type
   */
  private async getOrCreateExperiment(decisionType: string, orgUnitId: string) {
    const existing = await db.query.experiments.findFirst({
      where: eq(experiments.name, `decision_${decisionType}`),
    });

    if (existing) return existing;

    // Create new experiment
    const experimentId = this.generateId("exp");
    await db.insert(experiments).values({
      id: experimentId,
      name: `decision_${decisionType}`,
      description: `Contextual bandit for ${decisionType} decisions`,
      type: "bandit",
      orgUnitId,
      hypothesis: `Learn optimal ${decisionType} strategy`,
      variants: [],
      metrics: ["revenue", "orders", "roas", "margin"],
      status: "running",
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { id: experimentId, name: `decision_${decisionType}` };
  }

  /**
   * Get bandit arms for experiment
   */
  private async getBanditArms(experimentId: string) {
    const arms = await db.query.banditArms.findMany({
      where: eq(banditArms.experimentId, experimentId),
    });

    // If no arms exist, create default arms
    if (arms.length === 0) {
      return await this.createDefaultArms(experimentId);
    }

    return arms;
  }

  /**
   * Create default arms for new experiment
   */
  private async createDefaultArms(experimentId: string) {
    const defaultArms = [
      { name: "conservative", config: { change: -5 } },
      { name: "maintain", config: { change: 0 } },
      { name: "moderate", config: { change: 5 } },
      { name: "aggressive", config: { change: 15 } },
    ];

    const created = [];
    for (const arm of defaultArms) {
      const armId = this.generateId("arm");
      await db.insert(banditArms).values({
        id: armId,
        experimentId,
        name: arm.name,
        config: arm.config as any,
        pulls: 0,
        totalReward: "0",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      created.push({ id: armId, ...arm, pulls: 0, totalReward: "0", avgReward: null });
    }

    return created;
  }

  /**
   * Select arm using epsilon-greedy strategy
   */
  private async selectArm(arms: any[], context: DecisionContext): Promise<any> {
    // Epsilon-greedy: explore with probability epsilon
    if (Math.random() < this.epsilon) {
      // Explore: random selection
      return arms[Math.floor(Math.random() * arms.length)];
    }

    // Exploit: select best arm based on average reward
    const bestArm = arms.reduce((best, arm) => {
      const avgReward = arm.avgReward ? parseFloat(arm.avgReward) : 0;
      const bestAvgReward = best.avgReward ? parseFloat(best.avgReward) : 0;
      return avgReward > bestAvgReward ? arm : best;
    }, arms[0]);

    return bestArm;
  }

  /**
   * Update arm statistics after outcome
   */
  private async updateArmStats(armId: string, reward: number) {
    const arm = await db.query.banditArms.findFirst({
      where: eq(banditArms.id, armId),
    });

    if (!arm) return;

    const pulls = arm.pulls + 1;
    const totalReward = parseFloat(arm.totalReward) + reward;
    const avgReward = totalReward / pulls;

    await db
      .update(banditArms)
      .set({
        pulls,
        totalReward: totalReward.toString(),
        avgReward: avgReward.toString(),
        updatedAt: new Date(),
      })
      .where(eq(banditArms.id, armId));
  }

  /**
   * Record decision
   */
  private async recordDecision(
    type: string,
    orgUnitId: string,
    options: DecisionOption[],
    selectedOptionId: string,
    prediction: any,
    requiresApproval: boolean
  ): Promise<string> {
    const decisionId = this.generateId("dec");

    await db.insert(decisions).values({
      id: decisionId,
      type,
      orgUnitId,
      context: {} as any,
      options: options.map(o => ({
        id: o.id,
        action: o.action,
        predictedImpact: prediction.metrics,
        confidence: prediction.confidence,
      })) as any,
      selectedOption: selectedOptionId,
      reasoning: `Selected based on contextual bandit algorithm`,
      status: requiresApproval ? "proposed" : "approved",
      createdAt: new Date(),
    });

    return decisionId;
  }

  /**
   * Generate reasoning explanation
   */
  private generateReasoning(arm: any, prediction: any, context: DecisionContext): string {
    const parts = [
      `Selected "${arm.name}" option based on historical performance`,
      `Average reward: ${arm.avgReward || "N/A"} (${arm.pulls} trials)`,
      `Predicted impact: ${Object.entries(prediction.metrics).slice(0, 3).map(([k, v]) => `${k}=${v}`).join(", ")}`,
      `Confidence: ${(prediction.confidence * 100).toFixed(0)}%`,
    ];

    if (prediction.risks.length > 0) {
      parts.push(`Risks: ${prediction.risks.slice(0, 2).join("; ")}`);
    }

    return parts.join(". ");
  }

  /**
   * Get experiment ID for decision type
   */
  private async getExperimentIdForDecision(decisionType: string): Promise<string> {
    const experiment = await db.query.experiments.findFirst({
      where: eq(experiments.name, `decision_${decisionType}`),
    });
    return experiment?.id || "";
  }

  /**
   * Initialize built-in decision types
   */
  initializeBuiltInDecisions() {
    // Ad spend decisions
    this.registerDecisionType({
      name: "ad_spend",
      description: "Adjust marketing spend levels",
      options: [
        { id: "decrease_20", action: { adSpendChange: -20 }, description: "Decrease 20%" },
        { id: "decrease_10", action: { adSpendChange: -10 }, description: "Decrease 10%" },
        { id: "maintain", action: { adSpendChange: 0 }, description: "Maintain current" },
        { id: "increase_10", action: { adSpendChange: 10 }, description: "Increase 10%" },
        { id: "increase_20", action: { adSpendChange: 20 }, description: "Increase 20%" },
      ],
      constraints: {
        minRoas: 2.0,
        minCashRunwayDays: 30,
      },
    });

    // Pricing decisions
    this.registerDecisionType({
      name: "pricing",
      description: "Adjust product pricing",
      options: [
        { id: "decrease_5", action: { priceChange: -5 }, description: "Decrease 5%" },
        { id: "decrease_3", action: { priceChange: -3 }, description: "Decrease 3%" },
        { id: "maintain", action: { priceChange: 0 }, description: "Maintain current" },
        { id: "increase_3", action: { priceChange: 3 }, description: "Increase 3%" },
        { id: "increase_5", action: { priceChange: 5 }, description: "Increase 5%" },
      ],
      constraints: {
        minMargin: 0.15,
      },
    });

    // Creator allocation decisions
    this.registerDecisionType({
      name: "creator_allocation",
      description: "Allocate creators to products/streams",
      options: [
        { id: "top_performers", action: { strategy: "top_performers" }, description: "Focus on top 20%" },
        { id: "balanced", action: { strategy: "balanced" }, description: "Balanced allocation" },
        { id: "explore_new", action: { strategy: "explore_new" }, description: "Test new creators" },
      ],
      constraints: {
        minCreatorQuality: 0.6,
      },
    });

    // Stream schedule decisions
    this.registerDecisionType({
      name: "stream_schedule",
      description: "Adjust live stream frequency",
      options: [
        { id: "reduce", action: { streamFrequencyChange: -20 }, description: "Reduce 20%" },
        { id: "maintain", action: { streamFrequencyChange: 0 }, description: "Maintain current" },
        { id: "increase_moderate", action: { streamFrequencyChange: 15 }, description: "Increase 15%" },
        { id: "increase_aggressive", action: { streamFrequencyChange: 30 }, description: "Increase 30%" },
      ],
      constraints: {
        maxCreatorFatigue: 0.3,
      },
    });

    // Payout frequency decisions
    this.registerDecisionType({
      name: "payout_frequency",
      description: "Adjust creator payout frequency",
      options: [
        { id: "daily", action: { payoutFrequencyChange: 100 }, description: "Daily payouts" },
        { id: "weekly", action: { payoutFrequencyChange: 0 }, description: "Weekly payouts (current)" },
        { id: "biweekly", action: { payoutFrequencyChange: -50 }, description: "Bi-weekly payouts" },
      ],
      constraints: {
        minCreatorRetention: 0.8,
      },
    });
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const decisionEngine = new DecisionEngine();
