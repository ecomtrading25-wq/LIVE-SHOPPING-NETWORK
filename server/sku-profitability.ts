/**
 * SKU Profitability & Analytics Engine
 * Tracks true net profit per SKU, implements kill/scale rules, and greenlight scoring
 */

import { getDbSync } from './db';
const db = getDbSync();
import {
  skuProfitability,
  skuKillRules,
  products,
  orders,
  orderItems,
  inventoryLots
} from '../drizzle/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';

export type ProfitabilityStatus = 'WINNER' | 'PROFITABLE' | 'BREAK_EVEN' | 'LOSING' | 'KILLED';
export type KillReason = 'LOW_MARGIN' | 'LOW_VELOCITY' | 'HIGH_RETURNS' | 'MANUAL' | 'QUALITY_ISSUES';

export interface SKUProfitabilityMetrics {
  productId: string;
  sku: string;
  periodStart: Date;
  periodEnd: Date;
  
  // Revenue metrics
  unitsSold: number;
  grossRevenueCents: number;
  discountsCents: number;
  netRevenueCents: number;
  
  // Cost metrics
  cogsCents: number; // Cost of goods sold
  shippingCostCents: number;
  paymentFeesCents: number;
  returnsCostCents: number;
  marketingCostCents: number;
  otherCostsCents: number;
  totalCostCents: number;
  
  // Profit metrics
  grossProfitCents: number;
  netProfitCents: number;
  profitMarginPercent: number;
  
  // Performance metrics
  returnRate: number;
  avgOrderValueCents: number;
  avgProfitPerUnitCents: number;
  velocityUnitsPerDay: number;
  
  // Status
  status: ProfitabilityStatus;
  score: number; // 0-100
}

export interface KillRule {
  ruleId: string;
  productId: string;
  reason: KillReason;
  threshold: number;
  actualValue: number;
  triggeredAt: Date;
  executedAt?: Date;
  notes?: string;
}

export interface GreenlightScore {
  productId: string;
  score: number; // 0-100
  factors: {
    marketDemand: number; // 0-25
    profitPotential: number; // 0-25
    competitiveAdvantage: number; // 0-20
    supplierReliability: number; // 0-15
    trendAlignment: number; // 0-15
  };
  recommendation: 'GREENLIGHT' | 'YELLOW_LIGHT' | 'RED_LIGHT';
  notes: string[];
}

/**
 * Calculate SKU profitability for period
 */
export async function calculateSKUProfitability(
  channelId: string,
  productId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<SKUProfitabilityMetrics> {
  const product = await db.query.products.findFirst({
    where: and(
      eq(products.productId, productId),
      eq(products.channelId, channelId)
    )
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // Get all order items for this product in period
  const items = await db.query.orderItems.findMany({
    where: and(
      eq(orderItems.productId, productId),
      eq(orderItems.channelId, channelId)
    ),
    with: {
      order: true
    }
  });

  // Filter by date
  const periodItems = items.filter(item => {
    if (!item.order) return false;
    const orderDate = item.order.createdAt;
    return orderDate >= periodStart && orderDate <= periodEnd;
  });

  // Calculate revenue metrics
  const unitsSold = periodItems.reduce((sum, item) => sum + item.quantity, 0);
  const grossRevenueCents = periodItems.reduce((sum, item) => sum + item.totalCents, 0);
  const discountsCents = periodItems.reduce((sum, item) => sum + (item.discountCents || 0), 0);
  const netRevenueCents = grossRevenueCents - discountsCents;

  // Calculate COGS (from inventory lots)
  let cogsCents = 0;
  const lots = await db.query.inventoryLots.findMany({
    where: and(
      eq(inventoryLots.productId, productId),
      eq(inventoryLots.channelId, channelId)
    )
  });

  if (lots.length > 0) {
    const avgLandedCost = Math.floor(
      lots.reduce((sum, lot) => sum + lot.landedCostPerUnitCents, 0) / lots.length
    );
    cogsCents = unitsSold * avgLandedCost;
  } else {
    // Fallback to estimated COGS (60% of price)
    cogsCents = Math.floor(grossRevenueCents * 0.6);
  }

  // Calculate shipping costs (estimate $5 per unit)
  const shippingCostCents = unitsSold * 500;

  // Calculate payment fees (3% of revenue)
  const paymentFeesCents = Math.floor(grossRevenueCents * 0.03);

  // Calculate returns cost
  const returnedItems = periodItems.filter(item => item.order?.status === 'RETURNED');
  const returnsCostCents = returnedItems.reduce((sum, item) => sum + item.totalCents, 0);

  // Marketing cost (estimate 10% of revenue)
  const marketingCostCents = Math.floor(grossRevenueCents * 0.1);

  // Other costs (estimate 2% of revenue)
  const otherCostsCents = Math.floor(grossRevenueCents * 0.02);

  // Total costs
  const totalCostCents = cogsCents + shippingCostCents + paymentFeesCents + 
                        returnsCostCents + marketingCostCents + otherCostsCents;

  // Profit metrics
  const grossProfitCents = netRevenueCents - cogsCents;
  const netProfitCents = netRevenueCents - totalCostCents;
  const profitMarginPercent = netRevenueCents > 0 
    ? (netProfitCents / netRevenueCents) * 100 
    : 0;

  // Performance metrics
  const returnRate = unitsSold > 0 ? (returnedItems.length / unitsSold) * 100 : 0;
  const avgOrderValueCents = periodItems.length > 0 
    ? Math.floor(grossRevenueCents / periodItems.length) 
    : 0;
  const avgProfitPerUnitCents = unitsSold > 0 
    ? Math.floor(netProfitCents / unitsSold) 
    : 0;
  
  const periodDays = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
  const velocityUnitsPerDay = periodDays > 0 ? unitsSold / periodDays : 0;

  // Determine status
  let status: ProfitabilityStatus;
  if (profitMarginPercent >= 30) status = 'WINNER';
  else if (profitMarginPercent >= 15) status = 'PROFITABLE';
  else if (profitMarginPercent >= 5) status = 'BREAK_EVEN';
  else status = 'LOSING';

  // Calculate score (0-100)
  const score = Math.min(100, Math.max(0,
    (profitMarginPercent * 2) + // 0-60 points from margin
    (Math.min(velocityUnitsPerDay * 5, 30)) + // 0-30 points from velocity
    (Math.max(0, 10 - returnRate)) // 0-10 points from low returns
  ));

  const metrics: SKUProfitabilityMetrics = {
    productId,
    sku: product.sku,
    periodStart,
    periodEnd,
    unitsSold,
    grossRevenueCents,
    discountsCents,
    netRevenueCents,
    cogsCents,
    shippingCostCents,
    paymentFeesCents,
    returnsCostCents,
    marketingCostCents,
    otherCostsCents,
    totalCostCents,
    grossProfitCents,
    netProfitCents,
    profitMarginPercent,
    returnRate,
    avgOrderValueCents,
    avgProfitPerUnitCents,
    velocityUnitsPerDay,
    status,
    score
  };

  // Save to database
  await db.insert(skuProfitability).values({
    channelId,
    productId,
    sku: product.sku,
    periodStart,
    periodEnd,
    unitsSold,
    grossRevenueCents,
    netRevenueCents,
    totalCostCents,
    netProfitCents,
    profitMarginPercent,
    returnRate,
    velocityUnitsPerDay,
    status,
    score
  });

  return metrics;
}

/**
 * Evaluate kill rules for SKU
 */
export async function evaluateKillRules(
  channelId: string,
  productId: string,
  metrics: SKUProfitabilityMetrics
): Promise<KillRule[]> {
  const triggeredRules: KillRule[] = [];

  // Rule 1: Low margin (< 10%)
  if (metrics.profitMarginPercent < 10) {
    const [rule] = await db.insert(skuKillRules).values({
      channelId,
      productId,
      reason: 'LOW_MARGIN',
      threshold: 10,
      actualValue: metrics.profitMarginPercent,
      triggeredAt: new Date(),
      notes: `Profit margin ${metrics.profitMarginPercent.toFixed(2)}% is below 10% threshold`
    }).returning();

    triggeredRules.push(rule as KillRule);
  }

  // Rule 2: Low velocity (< 1 unit per day for 30+ days)
  const periodDays = (metrics.periodEnd.getTime() - metrics.periodStart.getTime()) / (1000 * 60 * 60 * 24);
  if (periodDays >= 30 && metrics.velocityUnitsPerDay < 1) {
    const [rule] = await db.insert(skuKillRules).values({
      channelId,
      productId,
      reason: 'LOW_VELOCITY',
      threshold: 1,
      actualValue: metrics.velocityUnitsPerDay,
      triggeredAt: new Date(),
      notes: `Velocity ${metrics.velocityUnitsPerDay.toFixed(2)} units/day is below 1 unit/day threshold`
    }).returning();

    triggeredRules.push(rule as KillRule);
  }

  // Rule 3: High return rate (> 15%)
  if (metrics.returnRate > 15) {
    const [rule] = await db.insert(skuKillRules).values({
      channelId,
      productId,
      reason: 'HIGH_RETURNS',
      threshold: 15,
      actualValue: metrics.returnRate,
      triggeredAt: new Date(),
      notes: `Return rate ${metrics.returnRate.toFixed(2)}% exceeds 15% threshold`
    }).returning();

    triggeredRules.push(rule as KillRule);
  }

  return triggeredRules;
}

/**
 * Execute kill rule (deactivate product)
 */
export async function executeKillRule(
  channelId: string,
  ruleId: string
): Promise<void> {
  const rule = await db.query.skuKillRules.findFirst({
    where: and(
      eq(skuKillRules.ruleId, ruleId),
      eq(skuKillRules.channelId, channelId)
    )
  });

  if (!rule) {
    throw new Error('Kill rule not found');
  }

  // Deactivate product
  await db.update(products)
    .set({
      isActive: false,
      updatedAt: new Date()
    })
    .where(eq(products.productId, rule.productId));

  // Mark rule as executed
  await db.update(skuKillRules)
    .set({
      executedAt: new Date()
    })
    .where(eq(skuKillRules.ruleId, ruleId));

  // Update profitability status
  await db.update(skuProfitability)
    .set({
      status: 'KILLED'
    })
    .where(and(
      eq(skuProfitability.productId, rule.productId),
      eq(skuProfitability.channelId, channelId)
    ));
}

/**
 * Calculate greenlight score for new product
 */
export async function calculateGreenlightScore(
  channelId: string,
  productData: {
    estimatedDemandUnitsPerMonth: number;
    estimatedPriceCents: number;
    estimatedCostCents: number;
    competitorCount: number;
    supplierRating: number; // 1-5
    trendScore: number; // 0-100
  }
): Promise<GreenlightScore> {
  const factors = {
    marketDemand: 0,
    profitPotential: 0,
    competitiveAdvantage: 0,
    supplierReliability: 0,
    trendAlignment: 0
  };

  const notes: string[] = [];

  // Market demand (0-25 points)
  if (productData.estimatedDemandUnitsPerMonth >= 1000) {
    factors.marketDemand = 25;
    notes.push('High market demand (1000+ units/month)');
  } else if (productData.estimatedDemandUnitsPerMonth >= 500) {
    factors.marketDemand = 20;
    notes.push('Good market demand (500-999 units/month)');
  } else if (productData.estimatedDemandUnitsPerMonth >= 100) {
    factors.marketDemand = 15;
    notes.push('Moderate market demand (100-499 units/month)');
  } else {
    factors.marketDemand = 5;
    notes.push('Low market demand (<100 units/month)');
  }

  // Profit potential (0-25 points)
  const estimatedMargin = ((productData.estimatedPriceCents - productData.estimatedCostCents) / productData.estimatedPriceCents) * 100;
  if (estimatedMargin >= 40) {
    factors.profitPotential = 25;
    notes.push(`Excellent margin (${estimatedMargin.toFixed(1)}%)`);
  } else if (estimatedMargin >= 30) {
    factors.profitPotential = 20;
    notes.push(`Good margin (${estimatedMargin.toFixed(1)}%)`);
  } else if (estimatedMargin >= 20) {
    factors.profitPotential = 15;
    notes.push(`Acceptable margin (${estimatedMargin.toFixed(1)}%)`);
  } else {
    factors.profitPotential = 5;
    notes.push(`Low margin (${estimatedMargin.toFixed(1)}%)`);
  }

  // Competitive advantage (0-20 points)
  if (productData.competitorCount === 0) {
    factors.competitiveAdvantage = 20;
    notes.push('No direct competitors (blue ocean)');
  } else if (productData.competitorCount <= 3) {
    factors.competitiveAdvantage = 15;
    notes.push('Few competitors (1-3)');
  } else if (productData.competitorCount <= 10) {
    factors.competitiveAdvantage = 10;
    notes.push('Moderate competition (4-10)');
  } else {
    factors.competitiveAdvantage = 5;
    notes.push('High competition (10+)');
  }

  // Supplier reliability (0-15 points)
  factors.supplierReliability = Math.floor((productData.supplierRating / 5) * 15);
  notes.push(`Supplier rating: ${productData.supplierRating}/5`);

  // Trend alignment (0-15 points)
  factors.trendAlignment = Math.floor((productData.trendScore / 100) * 15);
  notes.push(`Trend score: ${productData.trendScore}/100`);

  // Calculate total score
  const score = factors.marketDemand + factors.profitPotential + 
                factors.competitiveAdvantage + factors.supplierReliability + 
                factors.trendAlignment;

  // Determine recommendation
  let recommendation: GreenlightScore['recommendation'];
  if (score >= 70) {
    recommendation = 'GREENLIGHT';
    notes.push('✅ RECOMMENDED: Strong potential for success');
  } else if (score >= 50) {
    recommendation = 'YELLOW_LIGHT';
    notes.push('⚠️ CAUTION: Proceed with small test batch');
  } else {
    recommendation = 'RED_LIGHT';
    notes.push('❌ NOT RECOMMENDED: High risk, low potential');
  }

  return {
    productId: '', // Not yet created
    score,
    factors,
    recommendation,
    notes
  };
}

/**
 * Get top performing SKUs
 */
export async function getTopPerformingSKUs(
  channelId: string,
  metric: 'profit' | 'margin' | 'velocity' | 'score' = 'profit',
  limit: number = 10
) {
  const orderByMap = {
    profit: desc(skuProfitability.netProfitCents),
    margin: desc(skuProfitability.profitMarginPercent),
    velocity: desc(skuProfitability.velocityUnitsPerDay),
    score: desc(skuProfitability.score)
  };

  const topSKUs = await db.query.skuProfitability.findMany({
    where: eq(skuProfitability.channelId, channelId),
    orderBy: orderByMap[metric],
    limit,
    with: {
      product: true
    }
  });

  return topSKUs.map((sku, index) => ({
    rank: index + 1,
    productId: sku.productId,
    sku: sku.sku,
    productName: sku.product?.name || 'Unknown',
    unitsSold: sku.unitsSold,
    netRevenueCents: sku.netRevenueCents,
    netProfitCents: sku.netProfitCents,
    profitMarginPercent: sku.profitMarginPercent,
    velocityUnitsPerDay: sku.velocityUnitsPerDay,
    status: sku.status,
    score: sku.score
  }));
}

/**
 * Get SKUs at risk (candidates for killing)
 */
export async function getSKUsAtRisk(channelId: string) {
  const atRiskSKUs = await db.query.skuProfitability.findMany({
    where: and(
      eq(skuProfitability.channelId, channelId),
      sql`${skuProfitability.status} IN ('LOSING', 'BREAK_EVEN')`
    ),
    orderBy: desc(skuProfitability.score),
    with: {
      product: true
    }
  });

  return atRiskSKUs.map(sku => ({
    productId: sku.productId,
    sku: sku.sku,
    productName: sku.product?.name || 'Unknown',
    status: sku.status,
    profitMarginPercent: sku.profitMarginPercent,
    velocityUnitsPerDay: sku.velocityUnitsPerDay,
    returnRate: sku.returnRate,
    score: sku.score,
    issues: [
      sku.profitMarginPercent < 10 && 'Low margin',
      sku.velocityUnitsPerDay < 1 && 'Low velocity',
      sku.returnRate > 15 && 'High returns'
    ].filter(Boolean)
  }));
}

/**
 * Weekly SKU pruning automation
 */
export async function weeklySkuPruning(channelId: string): Promise<{
  evaluated: number;
  killed: number;
  atRisk: number;
}> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now = new Date();

  // Get all active products
  const activeProducts = await db.query.products.findMany({
    where: and(
      eq(products.channelId, channelId),
      eq(products.isActive, true)
    )
  });

  let evaluated = 0;
  let killed = 0;
  let atRisk = 0;

  for (const product of activeProducts) {
    // Calculate profitability
    const metrics = await calculateSKUProfitability(
      channelId,
      product.productId,
      oneWeekAgo,
      now
    );

    evaluated++;

    // Evaluate kill rules
    const triggeredRules = await evaluateKillRules(channelId, product.productId, metrics);

    if (triggeredRules.length > 0) {
      // Auto-execute kill if multiple rules triggered
      if (triggeredRules.length >= 2) {
        for (const rule of triggeredRules) {
          await executeKillRule(channelId, rule.ruleId);
        }
        killed++;
      } else {
        atRisk++;
      }
    }
  }

  return { evaluated, killed, atRisk };
}

/**
 * Calculate contribution margin
 */
export function calculateContributionMargin(
  revenueCents: number,
  variableCostsCents: number
): {
  contributionMarginCents: number;
  contributionMarginPercent: number;
} {
  const contributionMarginCents = revenueCents - variableCostsCents;
  const contributionMarginPercent = revenueCents > 0 
    ? (contributionMarginCents / revenueCents) * 100 
    : 0;

  return {
    contributionMarginCents,
    contributionMarginPercent
  };
}

/**
 * Calculate break-even analysis
 */
export function calculateBreakEven(
  fixedCostsCents: number,
  pricePerUnitCents: number,
  variableCostPerUnitCents: number
): {
  breakEvenUnits: number;
  breakEvenRevenueCents: number;
  contributionPerUnitCents: number;
} {
  const contributionPerUnitCents = pricePerUnitCents - variableCostPerUnitCents;
  const breakEvenUnits = contributionPerUnitCents > 0 
    ? Math.ceil(fixedCostsCents / contributionPerUnitCents) 
    : 0;
  const breakEvenRevenueCents = breakEvenUnits * pricePerUnitCents;

  return {
    breakEvenUnits,
    breakEvenRevenueCents,
    contributionPerUnitCents
  };
}
