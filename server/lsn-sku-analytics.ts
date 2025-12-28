/**
 * LSN SKU Analytics & Profitability Engine
 * 
 * Advanced analytics system for SKU-level profitability tracking, margin protection,
 * demand forecasting, and inventory optimization recommendations.
 * 
 * Features:
 * - SKU profitability analysis with full cost breakdown
 * - Margin protection alerts with automated actions
 * - Product recommendation engine
 * - Inventory optimization
 * - Demand forecasting per SKU
 * - ROI tracking and reporting
 */

import { getDb } from "./db";
import { products, productVariants, orders, orderItems, inventoryTransactions } from "../drizzle/schema";
import { eq, and, gte, lte, desc, sql, avg, sum, count } from "drizzle-orm";

/**
 * Calculate comprehensive SKU profitability
 */
export async function calculateSKUProfitability(skuId: number, periodStart: Date, periodEnd: Date) {
  const db = getDb();

  // Get SKU details
  const sku = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, skuId),
    with: {
      product: true,
    },
  });

  if (!sku) {
    throw new Error("SKU not found");
  }

  // Get sales data for period
  const salesData = await db
    .select({
      totalRevenue: sum(orderItems.price).mapWith(Number),
      totalQuantity: sum(orderItems.quantity).mapWith(Number),
      orderCount: count(orderItems.id),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orderItems.productVariantId, skuId),
        gte(orders.createdAt, periodStart),
        lte(orders.createdAt, periodEnd),
        eq(orders.status, "delivered")
      )
    );

  const revenue = salesData[0]?.totalRevenue || 0;
  const quantitySold = salesData[0]?.totalQuantity || 0;
  const orderCount = salesData[0]?.orderCount || 0;

  // Calculate costs
  const costOfGoods = quantitySold * (sku.costPrice || 0);
  
  // Shipping costs (estimated at 10% of revenue)
  const shippingCosts = revenue * 0.10;
  
  // Payment processing fees (2.9% + $0.30 per transaction)
  const paymentFees = revenue * 0.029 + orderCount * 0.30;
  
  // Platform fees (5% of revenue)
  const platformFees = revenue * 0.05;
  
  // Marketing costs (estimated at 15% of revenue)
  const marketingCosts = revenue * 0.15;
  
  // Storage costs (estimated at $0.50 per unit per month)
  const daysInPeriod = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
  const storageCosts = quantitySold * 0.50 * (daysInPeriod / 30);
  
  // Returns and refunds (estimated at 5% of revenue)
  const returnsCosts = revenue * 0.05;
  
  // Total costs
  const totalCosts = costOfGoods + shippingCosts + paymentFees + platformFees + marketingCosts + storageCosts + returnsCosts;
  
  // Gross profit
  const grossProfit = revenue - costOfGoods;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  
  // Net profit
  const netProfit = revenue - totalCosts;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  
  // ROI
  const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;
  
  // Contribution margin
  const variableCosts = costOfGoods + shippingCosts + paymentFees + marketingCosts;
  const contributionMargin = revenue - variableCosts;
  const contributionMarginPercent = revenue > 0 ? (contributionMargin / revenue) * 100 : 0;

  return {
    skuId,
    skuName: `${sku.product.name} - ${sku.name}`,
    period: {
      start: periodStart,
      end: periodEnd,
    },
    revenue: {
      total: revenue,
      perUnit: quantitySold > 0 ? revenue / quantitySold : 0,
    },
    costs: {
      costOfGoods,
      shipping: shippingCosts,
      paymentProcessing: paymentFees,
      platform: platformFees,
      marketing: marketingCosts,
      storage: storageCosts,
      returns: returnsCosts,
      total: totalCosts,
      perUnit: quantitySold > 0 ? totalCosts / quantitySold : 0,
    },
    profitability: {
      grossProfit,
      grossMargin,
      netProfit,
      netMargin,
      contributionMargin,
      contributionMarginPercent,
      roi,
    },
    volume: {
      quantitySold,
      orderCount,
      avgOrderSize: orderCount > 0 ? quantitySold / orderCount : 0,
    },
    recommendations: generateProfitabilityRecommendations({
      netMargin,
      roi,
      grossMargin,
      quantitySold,
    }),
  };
}

/**
 * Generate profitability recommendations
 */
function generateProfitabilityRecommendations(metrics: {
  netMargin: number;
  roi: number;
  grossMargin: number;
  quantitySold: number;
}) {
  const recommendations = [];

  if (metrics.netMargin < 10) {
    recommendations.push({
      type: "low_margin",
      severity: "high",
      message: "Net margin below 10% - consider price increase or cost reduction",
      actions: ["Negotiate better supplier pricing", "Increase retail price by 10-15%", "Reduce marketing spend"],
    });
  }

  if (metrics.roi < 20) {
    recommendations.push({
      type: "low_roi",
      severity: "medium",
      message: "ROI below 20% - product may not be worth continued investment",
      actions: ["Evaluate product discontinuation", "Reduce inventory levels", "Focus on higher ROI products"],
    });
  }

  if (metrics.grossMargin < 30) {
    recommendations.push({
      type: "low_gross_margin",
      severity: "high",
      message: "Gross margin below 30% - COGS too high",
      actions: ["Find alternative suppliers", "Negotiate volume discounts", "Consider product redesign"],
    });
  }

  if (metrics.quantitySold < 10) {
    recommendations.push({
      type: "low_volume",
      severity: "low",
      message: "Low sales volume - may not have enough data for accurate analysis",
      actions: ["Increase marketing efforts", "Run promotional campaigns", "Improve product visibility"],
    });
  }

  if (metrics.netMargin > 30 && metrics.roi > 50) {
    recommendations.push({
      type: "high_performer",
      severity: "positive",
      message: "Excellent profitability - consider scaling this product",
      actions: ["Increase inventory levels", "Expand marketing budget", "Introduce related products"],
    });
  }

  return recommendations;
}

/**
 * Batch SKU profitability analysis
 */
export async function batchSKUProfitability(skuIds: number[], periodStart: Date, periodEnd: Date) {
  const results = await Promise.all(
    skuIds.map((skuId) => calculateSKUProfitability(skuId, periodStart, periodEnd))
  );

  // Sort by net profit descending
  results.sort((a, b) => b.profitability.netProfit - a.profitability.netProfit);

  const totalRevenue = results.reduce((sum, r) => sum + r.revenue.total, 0);
  const totalProfit = results.reduce((sum, r) => sum + r.profitability.netProfit, 0);
  const avgMargin = results.length > 0 
    ? results.reduce((sum, r) => sum + r.profitability.netMargin, 0) / results.length 
    : 0;

  return {
    skus: results,
    summary: {
      totalRevenue,
      totalProfit,
      avgMargin,
      profitableSkus: results.filter((r) => r.profitability.netProfit > 0).length,
      unprofitableSkus: results.filter((r) => r.profitability.netProfit <= 0).length,
    },
  };
}

/**
 * Margin protection alerts
 */
export async function checkMarginProtection(skuId: number, targetMargin: number = 20) {
  const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const periodEnd = new Date();

  const profitability = await calculateSKUProfitability(skuId, periodStart, periodEnd);

  const alerts = [];

  if (profitability.profitability.netMargin < targetMargin) {
    alerts.push({
      type: "margin_below_target",
      severity: "high",
      currentMargin: profitability.profitability.netMargin,
      targetMargin,
      gap: targetMargin - profitability.profitability.netMargin,
      message: `Margin ${profitability.profitability.netMargin.toFixed(2)}% is below target ${targetMargin}%`,
      actions: [
        {
          action: "increase_price",
          description: "Increase price to restore margin",
          suggestedPriceIncrease: calculatePriceIncreaseForMargin(profitability, targetMargin),
        },
        {
          action: "reduce_costs",
          description: "Reduce costs to restore margin",
          targetCostReduction: calculateCostReductionForMargin(profitability, targetMargin),
        },
      ],
    });
  }

  if (profitability.profitability.grossMargin < 30) {
    alerts.push({
      type: "low_gross_margin",
      severity: "critical",
      currentMargin: profitability.profitability.grossMargin,
      message: "Gross margin critically low - COGS too high",
      actions: [
        {
          action: "renegotiate_supplier",
          description: "Negotiate better supplier pricing",
        },
        {
          action: "find_alternative_supplier",
          description: "Source from lower-cost supplier",
        },
      ],
    });
  }

  return {
    skuId,
    skuName: profitability.skuName,
    alerts,
    currentMetrics: profitability.profitability,
  };
}

/**
 * Calculate price increase needed to achieve target margin
 */
function calculatePriceIncreaseForMargin(profitability: any, targetMargin: number) {
  const currentRevenue = profitability.revenue.total;
  const totalCosts = profitability.costs.total;
  
  // Target net profit = targetMargin% of new revenue
  // new revenue = totalCosts / (1 - targetMargin/100)
  const targetRevenue = totalCosts / (1 - targetMargin / 100);
  const revenueIncrease = targetRevenue - currentRevenue;
  const percentIncrease = currentRevenue > 0 ? (revenueIncrease / currentRevenue) * 100 : 0;

  return {
    currentPrice: profitability.revenue.perUnit,
    suggestedPrice: profitability.revenue.perUnit * (1 + percentIncrease / 100),
    percentIncrease: percentIncrease.toFixed(2),
    revenueIncrease,
  };
}

/**
 * Calculate cost reduction needed to achieve target margin
 */
function calculateCostReductionForMargin(profitability: any, targetMargin: number) {
  const currentRevenue = profitability.revenue.total;
  
  // Target net profit = targetMargin% of revenue
  const targetNetProfit = currentRevenue * (targetMargin / 100);
  const currentNetProfit = profitability.profitability.netProfit;
  const costReductionNeeded = targetNetProfit - currentNetProfit;

  return {
    currentCosts: profitability.costs.total,
    targetCosts: profitability.costs.total - costReductionNeeded,
    reductionNeeded: costReductionNeeded,
    percentReduction: profitability.costs.total > 0 
      ? (costReductionNeeded / profitability.costs.total) * 100 
      : 0,
  };
}

/**
 * Product recommendation engine
 */
export async function generateProductRecommendations(userId: number) {
  const db = getDb();

  // Get user's purchase history
  const userOrders = await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: {
      items: {
        with: {
          productVariant: {
            with: {
              product: true,
            },
          },
        },
      },
    },
  });

  // Extract purchased product categories
  const purchasedCategories = new Set();
  const purchasedProductIds = new Set();

  userOrders.forEach((order) => {
    order.items.forEach((item) => {
      if (item.productVariant?.product) {
        purchasedProductIds.add(item.productVariant.product.id);
        if (item.productVariant.product.categoryId) {
          purchasedCategories.add(item.productVariant.product.categoryId);
        }
      }
    });
  });

  // Find similar products (same category, not purchased)
  const recommendations = await db.query.products.findMany({
    where: and(
      sql`${products.categoryId} IN (${Array.from(purchasedCategories).join(",")})`,
      sql`${products.id} NOT IN (${Array.from(purchasedProductIds).join(",")})`
    ),
    limit: 10,
    with: {
      variants: true,
    },
  });

  return {
    userId,
    recommendations: recommendations.map((product) => ({
      productId: product.id,
      name: product.name,
      reason: "Based on your purchase history",
      category: product.categoryId,
    })),
  };
}

/**
 * Inventory optimization recommendations
 */
export async function generateInventoryOptimization(skuId: number) {
  const db = getDb();

  // Get sales velocity (last 90 days)
  const periodStart = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const periodEnd = new Date();

  const salesData = await db
    .select({
      totalQuantity: sum(orderItems.quantity).mapWith(Number),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orderItems.productVariantId, skuId),
        gte(orders.createdAt, periodStart),
        lte(orders.createdAt, periodEnd),
        eq(orders.status, "delivered")
      )
    );

  const quantitySold = salesData[0]?.totalQuantity || 0;
  const daysInPeriod = 90;
  const dailyVelocity = quantitySold / daysInPeriod;

  // Get current stock level
  const inventoryData = await db
    .select({
      totalQuantity: sum(inventoryTransactions.quantity).mapWith(Number),
    })
    .from(inventoryTransactions)
    .where(eq(inventoryTransactions.productVariantId, skuId));

  const currentStock = inventoryData[0]?.totalQuantity || 0;

  // Calculate metrics
  const daysOfStock = dailyVelocity > 0 ? currentStock / dailyVelocity : 999;
  const leadTime = 30; // days
  const safetyStock = dailyVelocity * leadTime * 1.5; // 1.5x lead time demand
  const reorderPoint = dailyVelocity * leadTime + safetyStock;
  const optimalOrderQuantity = dailyVelocity * 60; // 60 days supply

  const recommendations = [];

  if (currentStock < reorderPoint) {
    recommendations.push({
      type: "reorder_needed",
      severity: "high",
      message: "Stock below reorder point - order now",
      suggestedOrderQuantity: optimalOrderQuantity,
    });
  }

  if (daysOfStock > 180) {
    recommendations.push({
      type: "overstock",
      severity: "medium",
      message: "Excess inventory - consider promotions",
      daysOfStock,
      suggestedActions: ["Run clearance sale", "Bundle with other products", "Reduce future orders"],
    });
  }

  if (dailyVelocity === 0) {
    recommendations.push({
      type: "no_sales",
      severity: "low",
      message: "No sales in last 90 days - consider discontinuation",
      suggestedActions: ["Discontinue product", "Deep discount clearance", "Donate excess inventory"],
    });
  }

  return {
    skuId,
    currentStock,
    metrics: {
      dailyVelocity: dailyVelocity.toFixed(2),
      daysOfStock: daysOfStock.toFixed(0),
      reorderPoint: reorderPoint.toFixed(0),
      safetyStock: safetyStock.toFixed(0),
      optimalOrderQuantity: optimalOrderQuantity.toFixed(0),
    },
    recommendations,
  };
}

/**
 * Demand forecasting per SKU
 */
export async function forecastDemand(skuId: number, forecastDays: number = 30) {
  const db = getDb();

  // Get historical sales data (last 180 days)
  const historicalPeriod = 180;
  const periodStart = new Date(Date.now() - historicalPeriod * 24 * 60 * 60 * 1000);
  const periodEnd = new Date();

  const salesData = await db
    .select({
      totalQuantity: sum(orderItems.quantity).mapWith(Number),
      orderCount: count(orderItems.id),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orderItems.productVariantId, skuId),
        gte(orders.createdAt, periodStart),
        lte(orders.createdAt, periodEnd),
        eq(orders.status, "delivered")
      )
    );

  const historicalQuantity = salesData[0]?.totalQuantity || 0;
  const historicalOrders = salesData[0]?.orderCount || 0;

  // Simple moving average forecast
  const dailyAverage = historicalQuantity / historicalPeriod;
  const forecastQuantity = dailyAverage * forecastDays;

  // Calculate confidence based on data consistency
  const confidence = historicalOrders > 30 ? "high" : historicalOrders > 10 ? "medium" : "low";

  // Apply seasonal adjustments (simplified)
  const currentMonth = new Date().getMonth();
  const seasonalMultiplier = [1.0, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.3, 1.1, 1.0, 1.2, 1.5][currentMonth];
  const adjustedForecast = forecastQuantity * seasonalMultiplier;

  return {
    skuId,
    forecastPeriod: {
      days: forecastDays,
      startDate: new Date(),
      endDate: new Date(Date.now() + forecastDays * 24 * 60 * 60 * 1000),
    },
    historical: {
      periodDays: historicalPeriod,
      totalQuantity: historicalQuantity,
      dailyAverage: dailyAverage.toFixed(2),
      orderCount: historicalOrders,
    },
    forecast: {
      quantity: Math.round(adjustedForecast),
      dailyAverage: (adjustedForecast / forecastDays).toFixed(2),
      confidence,
      seasonalMultiplier,
    },
    recommendations: [
      {
        type: "inventory_planning",
        message: `Order ${Math.round(adjustedForecast)} units to cover next ${forecastDays} days`,
      },
    ],
  };
}

/**
 * SKU Analytics Dashboard
 */
export async function getSKUAnalyticsDashboard(periodDays: number = 30) {
  const db = getDb();

  const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  const periodEnd = new Date();

  // Get top SKUs by revenue
  const topSKUs = await db
    .select({
      skuId: orderItems.productVariantId,
      revenue: sum(orderItems.price).mapWith(Number),
      quantity: sum(orderItems.quantity).mapWith(Number),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        gte(orders.createdAt, periodStart),
        lte(orders.createdAt, periodEnd),
        eq(orders.status, "delivered")
      )
    )
    .groupBy(orderItems.productVariantId)
    .orderBy(desc(sql`SUM(${orderItems.price})`))
    .limit(10);

  // Calculate profitability for top SKUs
  const profitabilityData = await Promise.all(
    topSKUs.map((sku) => calculateSKUProfitability(sku.skuId, periodStart, periodEnd))
  );

  // Aggregate metrics
  const totalRevenue = profitabilityData.reduce((sum, p) => sum + p.revenue.total, 0);
  const totalProfit = profitabilityData.reduce((sum, p) => sum + p.profitability.netProfit, 0);
  const avgMargin = profitabilityData.length > 0
    ? profitabilityData.reduce((sum, p) => sum + p.profitability.netMargin, 0) / profitabilityData.length
    : 0;

  return {
    period: {
      days: periodDays,
      start: periodStart,
      end: periodEnd,
    },
    summary: {
      totalRevenue,
      totalProfit,
      avgMargin: avgMargin.toFixed(2),
      profitableSkus: profitabilityData.filter((p) => p.profitability.netProfit > 0).length,
      unprofitableSkus: profitabilityData.filter((p) => p.profitability.netProfit <= 0).length,
    },
    topSkus: profitabilityData,
  };
}

export default {
  calculateSKUProfitability,
  batchSKUProfitability,
  checkMarginProtection,
  generateProductRecommendations,
  generateInventoryOptimization,
  forecastDemand,
  getSKUAnalyticsDashboard,
};
