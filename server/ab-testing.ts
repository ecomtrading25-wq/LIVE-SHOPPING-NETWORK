/**
 * A/B Testing Framework
 * Run controlled experiments for pricing, UI changes, and feature rollouts
 */

import { getDb } from "./db"
const db = await getDb();
import { sql } from "drizzle-orm";

interface Experiment {
  id: string;
  name: string;
  description: string;
  type: "pricing" | "ui" | "feature";
  status: "draft" | "running" | "paused" | "completed";
  startDate: Date;
  endDate: Date | null;
  variants: ExperimentVariant[];
  targetMetric: string;
  sampleSize: number;
  confidence: number;
}

interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  config: any;
  allocation: number; // Percentage 0-100
  conversions: number;
  revenue: number;
  participants: number;
}

interface ExperimentResult {
  experimentId: string;
  winner: string | null;
  confidence: number;
  variants: VariantPerformance[];
  recommendation: string;
}

interface VariantPerformance {
  variantId: string;
  variantName: string;
  participants: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  averageOrderValue: number;
  lift: number; // Percentage improvement over control
  statisticalSignificance: boolean;
}

/**
 * Create a new A/B test experiment
 */
export async function createExperiment(
  experiment: Omit<Experiment, "id">
): Promise<Experiment> {
  const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // In production, this would save to database
  console.log("[A/B Testing] Experiment created:", {
    id,
    ...experiment,
  });

  return {
    id,
    ...experiment,
  };
}

/**
 * Assign user to experiment variant
 */
export function assignVariant(
  experimentId: string,
  userId: string,
  variants: ExperimentVariant[]
): ExperimentVariant {
  // Deterministic assignment based on user ID hash
  const hash = hashString(`${experimentId}:${userId}`);
  const bucket = hash % 100;

  let cumulativeAllocation = 0;
  for (const variant of variants) {
    cumulativeAllocation += variant.allocation;
    if (bucket < cumulativeAllocation) {
      return variant;
    }
  }

  // Fallback to control (first variant)
  return variants[0];
}

/**
 * Hash string to number (simple hash function)
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Track experiment event (view, conversion, purchase)
 */
export async function trackExperimentEvent(
  experimentId: string,
  variantId: string,
  userId: string,
  eventType: "view" | "conversion" | "purchase",
  eventData?: any
): Promise<void> {
  // In production, this would save to analytics database
  console.log("[A/B Testing] Event tracked:", {
    experimentId,
    variantId,
    userId,
    eventType,
    eventData,
    timestamp: new Date(),
  });
}

/**
 * Calculate experiment results
 */
export async function calculateExperimentResults(
  experimentId: string
): Promise<ExperimentResult> {
  // Mock data - in production, would query from analytics database
  const variants: VariantPerformance[] = [
    {
      variantId: "control",
      variantName: "Control (Current Price)",
      participants: 1000,
      conversions: 50,
      conversionRate: 5.0,
      revenue: 3500,
      averageOrderValue: 70,
      lift: 0,
      statisticalSignificance: true,
    },
    {
      variantId: "variant_a",
      variantName: "Variant A (10% Discount)",
      participants: 1000,
      conversions: 75,
      conversionRate: 7.5,
      revenue: 4725,
      averageOrderValue: 63,
      lift: 50,
      statisticalSignificance: true,
    },
    {
      variantId: "variant_b",
      variantName: "Variant B (5% Discount + Free Shipping)",
      participants: 1000,
      conversions: 68,
      conversionRate: 6.8,
      revenue: 4488,
      averageOrderValue: 66,
      lift: 36,
      statisticalSignificance: true,
    },
  ];

  // Determine winner (highest conversion rate with statistical significance)
  const winner = variants
    .filter((v) => v.statisticalSignificance)
    .sort((a, b) => b.conversionRate - a.conversionRate)[0];

  const confidence = calculateConfidence(variants[0], winner);

  let recommendation = "";
  if (winner.variantId === "control") {
    recommendation =
      "Keep current pricing. No variant showed significant improvement.";
  } else {
    recommendation = `Roll out ${winner.variantName}. Expected ${winner.lift}% lift in conversions with ${confidence}% confidence.`;
  }

  return {
    experimentId,
    winner: winner.variantId,
    confidence,
    variants,
    recommendation,
  };
}

/**
 * Calculate statistical confidence (simplified)
 */
function calculateConfidence(
  control: VariantPerformance,
  variant: VariantPerformance
): number {
  // Simplified z-test calculation
  const p1 = control.conversionRate / 100;
  const p2 = variant.conversionRate / 100;
  const n1 = control.participants;
  const n2 = variant.participants;

  const pooledP = (p1 * n1 + p2 * n2) / (n1 + n2);
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));
  const zScore = Math.abs(p2 - p1) / se;

  // Convert z-score to confidence level
  if (zScore > 2.58) return 99;
  if (zScore > 1.96) return 95;
  if (zScore > 1.65) return 90;
  if (zScore > 1.28) return 80;
  return 70;
}

/**
 * Get active experiments for a user
 */
export async function getActiveExperiments(
  userId: string
): Promise<
  Array<{
    experimentId: string;
    variantId: string;
    config: any;
  }>
> {
  // Mock data - in production, would query from database
  return [
    {
      experimentId: "exp_pricing_001",
      variantId: "variant_a",
      config: {
        discountPercent: 10,
        showBadge: true,
      },
    },
    {
      experimentId: "exp_ui_checkout_001",
      variantId: "control",
      config: {
        layout: "single-page",
      },
    },
  ];
}

/**
 * Pricing experiment helper
 */
export async function createPricingExperiment(
  productId: string,
  basePrice: number,
  variants: Array<{
    name: string;
    priceModifier: number; // Percentage change
    allocation: number;
  }>
): Promise<Experiment> {
  const experimentVariants: ExperimentVariant[] = variants.map((v, index) => ({
    id: `variant_${index}`,
    name: v.name,
    description: `${v.priceModifier > 0 ? "+" : ""}${v.priceModifier}% price change`,
    config: {
      productId,
      price: basePrice * (1 + v.priceModifier / 100),
      priceModifier: v.priceModifier,
    },
    allocation: v.allocation,
    conversions: 0,
    revenue: 0,
    participants: 0,
  }));

  return createExperiment({
    name: `Pricing Test - Product ${productId}`,
    description: `Testing optimal price point for product ${productId}`,
    type: "pricing",
    status: "draft",
    startDate: new Date(),
    endDate: null,
    variants: experimentVariants,
    targetMetric: "revenue",
    sampleSize: 3000,
    confidence: 95,
  });
}

/**
 * Get price for user (considering A/B tests)
 */
export async function getPriceForUser(
  productId: string,
  userId: string,
  basePrice: number
): Promise<{
  price: number;
  experimentId: string | null;
  variantId: string | null;
}> {
  // Check if user is in a pricing experiment
  const activeExperiments = await getActiveExperiments(userId);
  const pricingExperiment = activeExperiments.find(
    (exp) =>
      exp.config.productId === productId &&
      exp.experimentId.includes("pricing")
  );

  if (pricingExperiment) {
    return {
      price: pricingExperiment.config.price,
      experimentId: pricingExperiment.experimentId,
      variantId: pricingExperiment.variantId,
    };
  }

  // No experiment - return base price
  return {
    price: basePrice,
    experimentId: null,
    variantId: null,
  };
}

/**
 * Feature flag helper (for feature rollout experiments)
 */
export async function isFeatureEnabled(
  featureName: string,
  userId: string
): Promise<boolean> {
  const activeExperiments = await getActiveExperiments(userId);
  const featureExperiment = activeExperiments.find(
    (exp) =>
      exp.experimentId.includes(featureName) && exp.variantId !== "control"
  );

  return !!featureExperiment;
}

/**
 * Multi-armed bandit algorithm for dynamic allocation
 */
export class MultiArmedBandit {
  private variants: Map<
    string,
    { conversions: number; trials: number; reward: number }
  >;
  private epsilon: number;

  constructor(variantIds: string[], epsilon: number = 0.1) {
    this.variants = new Map();
    variantIds.forEach((id) => {
      this.variants.set(id, { conversions: 0, trials: 0, reward: 0 });
    });
    this.epsilon = epsilon;
  }

  /**
   * Select variant using epsilon-greedy strategy
   */
  selectVariant(): string {
    // Explore: random selection
    if (Math.random() < this.epsilon) {
      const variants = Array.from(this.variants.keys());
      return variants[Math.floor(Math.random() * variants.length)];
    }

    // Exploit: select best performing variant
    let bestVariant = "";
    let bestRate = -1;

    this.variants.forEach((stats, variantId) => {
      const rate = stats.trials > 0 ? stats.conversions / stats.trials : 0;
      if (rate > bestRate) {
        bestRate = rate;
        bestVariant = variantId;
      }
    });

    return bestVariant;
  }

  /**
   * Update variant performance
   */
  updateVariant(variantId: string, converted: boolean, reward: number = 0) {
    const stats = this.variants.get(variantId);
    if (stats) {
      stats.trials++;
      if (converted) {
        stats.conversions++;
        stats.reward += reward;
      }
    }
  }

  /**
   * Get variant statistics
   */
  getStats(variantId: string) {
    return this.variants.get(variantId);
  }
}

/**
 * Sample size calculator
 */
export function calculateRequiredSampleSize(
  baselineConversionRate: number,
  minimumDetectableEffect: number, // Percentage
  confidence: number = 95,
  power: number = 80
): number {
  // Simplified sample size calculation
  const p1 = baselineConversionRate / 100;
  const p2 = p1 * (1 + minimumDetectableEffect / 100);

  const zAlpha = confidence === 95 ? 1.96 : 2.58; // 95% or 99%
  const zBeta = power === 80 ? 0.84 : 1.28; // 80% or 90%

  const numerator =
    Math.pow(zAlpha + zBeta, 2) * (p1 * (1 - p1) + p2 * (1 - p2));
  const denominator = Math.pow(p2 - p1, 2);

  const sampleSizePerVariant = Math.ceil(numerator / denominator);

  return sampleSizePerVariant * 2; // Total for both variants
}
