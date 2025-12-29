/**
 * Digital Twin - Business simulation and "what-if" prediction
 * 
 * Maintains living models of demand, inventory, creators, payouts, and fraud.
 * Predicts impact before actions are executed.
 */

import { db } from "./db-wrapper";
import { simulations, simulationRuns, stateSnapshots } from "../../drizzle/business-os-schema";
import { eq } from "drizzle-orm";

export interface SimulationModel {
  type: "demand" | "inventory" | "creator" | "payout" | "fraud" | "pricing";
  config: Record<string, any>;
  predict: (scenario: Scenario, baseline: BusinessState) => Promise<Prediction>;
}

export interface BusinessState {
  revenue: number;
  orders: number;
  cac: number;
  roas: number;
  refundRate: number;
  latency: number;
  stockCover: number;
  creatorQuality: number;
  disputeRate: number;
  cashPosition: number;
  [key: string]: number;
}

export interface Scenario {
  changes: Record<string, number>;
  duration: number; // days
  description: string;
}

export interface Prediction {
  metrics: BusinessState;
  confidence: number;
  risks: string[];
  opportunities: string[];
}

export class DigitalTwin {
  private models: Map<string, SimulationModel> = new Map();

  /**
   * Register a simulation model
   */
  registerModel(model: SimulationModel) {
    this.models.set(model.type, model);
  }

  /**
   * Run "what-if" simulation
   */
  async simulate(
    orgUnitId: string,
    scenario: Scenario,
    modelTypes?: string[]
  ): Promise<Prediction> {
    // Get current baseline state
    const baseline = await this.getBaselineState(orgUnitId);

    // Run simulations for each model
    const predictions: Prediction[] = [];
    const modelsToRun = modelTypes || Array.from(this.models.keys());

    for (const modelType of modelsToRun) {
      const model = this.models.get(modelType);
      if (!model) continue;

      const prediction = await model.predict(scenario, baseline);
      predictions.push(prediction);
    }

    // Aggregate predictions
    const aggregated = this.aggregatePredictions(predictions, baseline);

    // Store simulation run
    await this.storeSimulationRun(orgUnitId, scenario, aggregated);

    return aggregated;
  }

  /**
   * Get current baseline state
   */
  private async getBaselineState(orgUnitId: string): Promise<BusinessState> {
    const latest = await db.query.stateSnapshots.findFirst({
      where: eq(stateSnapshots.orgUnitId, orgUnitId),
      orderBy: (stateSnapshots, { desc }) => [desc(stateSnapshots.timestamp)],
    });

    if (!latest) {
      // Return default state if no snapshots exist
      return {
        revenue: 0,
        orders: 0,
        cac: 0,
        roas: 0,
        refundRate: 0,
        latency: 0,
        stockCover: 0,
        creatorQuality: 0,
        disputeRate: 0,
        cashPosition: 0,
      };
    }

    return latest.metrics as BusinessState;
  }

  /**
   * Aggregate predictions from multiple models
   */
  private aggregatePredictions(predictions: Prediction[], baseline: BusinessState): Prediction {
    if (predictions.length === 0) {
      return {
        metrics: baseline,
        confidence: 0,
        risks: ["No simulation models available"],
        opportunities: [],
      };
    }

    // Average metrics across predictions
    const metrics: BusinessState = { ...baseline };
    const allRisks: string[] = [];
    const allOpportunities: string[] = [];
    let totalConfidence = 0;

    for (const pred of predictions) {
      for (const [key, value] of Object.entries(pred.metrics)) {
        if (typeof value === "number") {
          metrics[key] = (metrics[key] || 0) + value / predictions.length;
        }
      }
      allRisks.push(...pred.risks);
      allOpportunities.push(...pred.opportunities);
      totalConfidence += pred.confidence;
    }

    return {
      metrics,
      confidence: totalConfidence / predictions.length,
      risks: [...new Set(allRisks)],
      opportunities: [...new Set(allOpportunities)],
    };
  }

  /**
   * Store simulation run
   */
  private async storeSimulationRun(
    orgUnitId: string,
    scenario: Scenario,
    prediction: Prediction
  ) {
    await db.insert(simulationRuns).values({
      id: this.generateId(),
      simulationId: `sim_${orgUnitId}`,
      scenario: scenario as any,
      predictions: prediction.metrics as any,
      confidence: prediction.confidence.toString(),
      runAt: new Date(),
      createdAt: new Date(),
    });
  }

  /**
   * Initialize built-in simulation models
   */
  initializeBuiltInModels() {
    // Demand model
    this.registerModel({
      type: "demand",
      config: {},
      predict: async (scenario, baseline) => {
        const metrics = { ...baseline };
        const risks: string[] = [];
        const opportunities: string[] = [];

        // Simulate price change impact on demand
        if (scenario.changes.priceChange) {
          const priceElasticity = -1.5; // -1.5% demand per 1% price increase
          const demandChange = scenario.changes.priceChange * priceElasticity;
          metrics.orders = baseline.orders * (1 + demandChange / 100);
          metrics.revenue = metrics.orders * (baseline.revenue / baseline.orders) * (1 + scenario.changes.priceChange / 100);

          if (demandChange < -10) {
            risks.push("Significant demand drop expected from price increase");
          }
        }

        // Simulate marketing spend impact
        if (scenario.changes.adSpendChange) {
          const roasMultiplier = Math.log(1 + scenario.changes.adSpendChange / 100) / Math.log(2);
          metrics.orders = baseline.orders * (1 + roasMultiplier * 0.3);
          metrics.revenue = baseline.revenue * (1 + roasMultiplier * 0.3);
          metrics.cac = baseline.cac * (1 + scenario.changes.adSpendChange / 200);

          if (metrics.roas < 2.0) {
            risks.push("ROAS may fall below 2.0 threshold");
          }
        }

        return {
          metrics,
          confidence: 0.7,
          risks,
          opportunities,
        };
      },
    });

    // Creator model
    this.registerModel({
      type: "creator",
      config: {},
      predict: async (scenario, baseline) => {
        const metrics = { ...baseline };
        const risks: string[] = [];
        const opportunities: string[] = [];

        // Simulate stream frequency impact
        if (scenario.changes.streamFrequencyChange) {
          const frequencyMultiplier = 1 + scenario.changes.streamFrequencyChange / 100;
          metrics.orders = baseline.orders * Math.pow(frequencyMultiplier, 0.7);
          metrics.revenue = baseline.revenue * Math.pow(frequencyMultiplier, 0.7);
          
          // Diminishing returns and fatigue
          if (scenario.changes.streamFrequencyChange > 30) {
            metrics.creatorQuality = baseline.creatorQuality * 0.9;
            risks.push("Creator fatigue may reduce content quality");
          }

          if (frequencyMultiplier > 1.2) {
            opportunities.push("Increased stream frequency could boost revenue 15-25%");
          }
        }

        // Simulate creator payout frequency impact
        if (scenario.changes.payoutFrequencyChange) {
          const retentionImpact = scenario.changes.payoutFrequencyChange > 0 ? 1.05 : 0.95;
          metrics.creatorQuality = baseline.creatorQuality * retentionImpact;
          
          if (scenario.changes.payoutFrequencyChange < 0) {
            risks.push("Less frequent payouts may reduce creator retention");
          }
        }

        return {
          metrics,
          confidence: 0.65,
          risks,
          opportunities,
        };
      },
    });

    // Pricing model
    this.registerModel({
      type: "pricing",
      config: {},
      predict: async (scenario, baseline) => {
        const metrics = { ...baseline };
        const risks: string[] = [];
        const opportunities: string[] = [];

        if (scenario.changes.priceChange) {
          const priceMultiplier = 1 + scenario.changes.priceChange / 100;
          const demandElasticity = -1.5;
          const demandMultiplier = 1 + (scenario.changes.priceChange * demandElasticity) / 100;

          metrics.revenue = baseline.revenue * priceMultiplier * demandMultiplier;
          metrics.orders = baseline.orders * demandMultiplier;

          // Calculate margin impact
          const currentMargin = 0.25; // Assume 25% baseline margin
          const newMargin = (currentMargin + scenario.changes.priceChange / 100) / priceMultiplier;

          if (newMargin < 0.15) {
            risks.push("Margin would fall below 15% floor");
          }

          if (priceMultiplier > 1.1) {
            risks.push("Price increase >10% may trigger customer churn");
          }

          if (priceMultiplier < 0.95 && newMargin >= 0.20) {
            opportunities.push("Strategic price reduction could increase volume while maintaining margins");
          }
        }

        return {
          metrics,
          confidence: 0.75,
          risks,
          opportunities,
        };
      },
    });

    // Fraud model
    this.registerModel({
      type: "fraud",
      config: {},
      predict: async (scenario, baseline) => {
        const metrics = { ...baseline };
        const risks: string[] = [];
        const opportunities: string[] = [];

        // Simulate growth impact on fraud
        if (scenario.changes.orderGrowth) {
          const growthRate = scenario.changes.orderGrowth / 100;
          const fraudScaling = Math.pow(1 + growthRate, 1.3); // Fraud scales faster than growth
          metrics.disputeRate = baseline.disputeRate * fraudScaling;

          if (metrics.disputeRate > 0.05) {
            risks.push("Dispute rate may exceed 5% threshold");
          }
        }

        // Simulate refund policy impact
        if (scenario.changes.refundPolicyChange) {
          metrics.refundRate = baseline.refundRate * (1 + scenario.changes.refundPolicyChange / 100);
          
          if (metrics.refundRate > 0.10) {
            risks.push("Refund rate may exceed 10%");
          }
        }

        return {
          metrics,
          confidence: 0.60,
          risks,
          opportunities,
        };
      },
    });

    // Payout model
    this.registerModel({
      type: "payout",
      config: {},
      predict: async (scenario, baseline) => {
        const metrics = { ...baseline };
        const risks: string[] = [];
        const opportunities: string[] = [];

        // Simulate payout frequency impact on cash flow
        if (scenario.changes.payoutFrequencyChange) {
          const frequencyMultiplier = 1 + scenario.changes.payoutFrequencyChange / 100;
          const cashFlowImpact = -scenario.changes.payoutFrequencyChange / 2; // More frequent = worse cash flow
          metrics.cashPosition = baseline.cashPosition * (1 + cashFlowImpact / 100);

          if (metrics.cashPosition < baseline.cashPosition * 0.7) {
            risks.push("Cash position may drop significantly");
          }

          if (scenario.changes.payoutFrequencyChange < 0) {
            opportunities.push("Less frequent payouts could improve cash runway by 10-15 days");
          }
        }

        return {
          metrics,
          confidence: 0.70,
          risks,
          opportunities,
        };
      },
    });

    // Inventory model
    this.registerModel({
      type: "inventory",
      config: {},
      predict: async (scenario, baseline) => {
        const metrics = { ...baseline };
        const risks: string[] = [];
        const opportunities: string[] = [];

        // Simulate demand surge impact on stock
        if (scenario.changes.demandSurge) {
          const surgeMultiplier = 1 + scenario.changes.demandSurge / 100;
          metrics.stockCover = baseline.stockCover / surgeMultiplier;

          if (metrics.stockCover < 7) {
            risks.push("Stock cover may fall below 7 days");
          }

          if (metrics.stockCover < 3) {
            risks.push("CRITICAL: Stockout risk within 3 days");
          }
        }

        return {
          metrics,
          confidence: 0.65,
          risks,
          opportunities,
        };
      },
    });
  }

  private generateId(): string {
    return `simrun_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const digitalTwin = new DigitalTwin();
