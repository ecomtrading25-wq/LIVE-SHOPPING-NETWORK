/**
 * Analytics & Reporting Service
 * Handles business intelligence, cohort analysis, funnel tracking, revenue forecasting, and executive dashboards
 */

import { getDbSync } from './db';
const db = getDbSync();
import {
  orders,
  orderItems,
  products,
  users,
  liveSessions,
  liveViewers,
  creators,
  disputes
} from '../drizzle/schema';
import { eq, and, desc, gte, lte, sql, between } from 'drizzle-orm';

export interface RevenueMetrics {
  totalRevenueCents: number;
  totalOrders: number;
  avgOrderValueCents: number;
  grossProfitCents: number;
  grossMarginPercent: number;
  netProfitCents: number;
  netMarginPercent: number;
  refundRateCents: number;
  refundRatePercent: number;
}

export interface GrowthMetrics {
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
  churnRate: number;
  ltv: number;
  cac: number;
  ltvCacRatio: number;
}

export interface ProductMetrics {
  topProducts: Array<{
    productId: string;
    name: string;
    unitsSold: number;
    revenueCents: number;
    profitCents: number;
    marginPercent: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    revenueCents: number;
    unitsSold: number;
    avgPriceCents: number;
  }>;
  inventoryTurnover: number;
}

export interface LiveMetrics {
  totalSessions: number;
  totalViewers: number;
  avgViewersPerSession: number;
  avgWatchTimeMinutes: number;
  conversionRate: number;
  revenuePerViewer: number;
  topPerformingSessions: Array<{
    sessionId: string;
    title: string;
    viewers: number;
    revenueCents: number;
    conversionRate: number;
  }>;
}

export interface CohortAnalysis {
  cohortMonth: string;
  customersAcquired: number;
  retentionByMonth: Record<number, number>;
  revenueByMonth: Record<number, number>;
}

export interface FunnelMetrics {
  stage: string;
  users: number;
  conversionRate: number;
  dropoffRate: number;
}

/**
 * Get comprehensive revenue metrics
 */
export async function getRevenueMetrics(
  channelId: string,
  dateRange: { from: Date; to: Date }
): Promise<RevenueMetrics> {
  const ordersInRange = await db.query.orders.findMany({
    where: and(
      eq(orders.channelId, channelId),
      gte(orders.createdAt, dateRange.from),
      lte(orders.createdAt, dateRange.to),
      sql`status IN ('CONFIRMED', 'SHIPPED', 'DELIVERED')`
    ),
    with: {
      items: {
        with: {
          product: true
        }
      }
    }
  });

  const totalRevenueCents = ordersInRange.reduce((sum, o) => sum + o.totalCents, 0);
  const totalOrders = ordersInRange.length;
  const avgOrderValueCents = totalOrders > 0 ? Math.floor(totalRevenueCents / totalOrders) : 0;

  // Calculate gross profit (revenue - COGS)
  let totalCOGS = 0;
  for (const order of ordersInRange) {
    for (const item of order.items) {
      const costCents = item.product.costCents || 0;
      totalCOGS += costCents * item.quantity;
    }
  }

  const grossProfitCents = totalRevenueCents - totalCOGS;
  const grossMarginPercent = totalRevenueCents > 0 
    ? (grossProfitCents / totalRevenueCents) * 100 
    : 0;

  // Calculate net profit (gross profit - operating expenses)
  // In production, fetch actual operating expenses from accounting system
  const estimatedOpExpensesCents = Math.floor(totalRevenueCents * 0.25); // 25% estimate
  const netProfitCents = grossProfitCents - estimatedOpExpensesCents;
  const netMarginPercent = totalRevenueCents > 0 
    ? (netProfitCents / totalRevenueCents) * 100 
    : 0;

  // Calculate refund rate
  const refundedOrders = ordersInRange.filter(o => o.status === 'REFUNDED');
  const refundRateCents = refundedOrders.reduce((sum, o) => sum + o.totalCents, 0);
  const refundRatePercent = totalRevenueCents > 0 
    ? (refundRateCents / totalRevenueCents) * 100 
    : 0;

  return {
    totalRevenueCents,
    totalOrders,
    avgOrderValueCents,
    grossProfitCents,
    grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
    netProfitCents,
    netMarginPercent: Math.round(netMarginPercent * 10) / 10,
    refundRateCents,
    refundRatePercent: Math.round(refundRatePercent * 10) / 10
  };
}

/**
 * Get growth metrics
 */
export async function getGrowthMetrics(
  channelId: string,
  dateRange: { from: Date; to: Date }
): Promise<GrowthMetrics> {
  // Get all customers who made orders in date range
  const ordersInRange = await db.query.orders.findMany({
    where: and(
      eq(orders.channelId, channelId),
      gte(orders.createdAt, dateRange.from),
      lte(orders.createdAt, dateRange.to)
    )
  });

  const customerIds = [...new Set(ordersInRange.map(o => o.userId).filter(Boolean))];

  // Determine new vs returning customers
  let newCustomers = 0;
  let returningCustomers = 0;

  for (const customerId of customerIds) {
    const previousOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.userId, customerId!),
        lte(orders.createdAt, dateRange.from)
      )
    });

    if (previousOrders.length === 0) {
      newCustomers++;
    } else {
      returningCustomers++;
    }
  }

  // Calculate retention rate
  const totalCustomers = newCustomers + returningCustomers;
  const customerRetentionRate = totalCustomers > 0 
    ? (returningCustomers / totalCustomers) * 100 
    : 0;

  const churnRate = 100 - customerRetentionRate;

  // Calculate LTV (simplified - average order value * average orders per customer * average lifespan)
  const avgOrderValueCents = ordersInRange.length > 0
    ? ordersInRange.reduce((sum, o) => sum + o.totalCents, 0) / ordersInRange.length
    : 0;

  const avgOrdersPerCustomer = customerIds.length > 0 
    ? ordersInRange.length / customerIds.length 
    : 0;

  const avgLifespanMonths = 12; // Assumption
  const ltv = Math.floor((avgOrderValueCents * avgOrdersPerCustomer * avgLifespanMonths) / 100);

  // Calculate CAC (marketing spend / new customers)
  // In production, fetch actual marketing spend
  const estimatedMarketingSpendCents = newCustomers * 2000; // $20 per customer estimate
  const cac = newCustomers > 0 ? Math.floor(estimatedMarketingSpendCents / newCustomers / 100) : 0;

  const ltvCacRatio = cac > 0 ? Math.round((ltv / cac) * 10) / 10 : 0;

  return {
    newCustomers,
    returningCustomers,
    customerRetentionRate: Math.round(customerRetentionRate * 10) / 10,
    churnRate: Math.round(churnRate * 10) / 10,
    ltv,
    cac,
    ltvCacRatio
  };
}

/**
 * Get product performance metrics
 */
export async function getProductMetrics(
  channelId: string,
  dateRange: { from: Date; to: Date }
): Promise<ProductMetrics> {
  const orderItemsInRange = await db.query.orderItems.findMany({
    where: and(
      sql`order_id IN (SELECT order_id FROM orders WHERE channel_id = ${channelId} AND created_at >= ${dateRange.from} AND created_at <= ${dateRange.to})`
    ),
    with: {
      product: true,
      order: true
    }
  });

  // Calculate top products
  const productStats = new Map<string, {
    name: string;
    unitsSold: number;
    revenueCents: number;
    costCents: number;
  }>();

  for (const item of orderItemsInRange) {
    const existing = productStats.get(item.productId) || {
      name: item.product.name,
      unitsSold: 0,
      revenueCents: 0,
      costCents: 0
    };

    existing.unitsSold += item.quantity;
    existing.revenueCents += item.priceCents * item.quantity;
    existing.costCents += (item.product.costCents || 0) * item.quantity;

    productStats.set(item.productId, existing);
  }

  const topProducts = Array.from(productStats.entries())
    .map(([productId, stats]) => ({
      productId,
      name: stats.name,
      unitsSold: stats.unitsSold,
      revenueCents: stats.revenueCents,
      profitCents: stats.revenueCents - stats.costCents,
      marginPercent: stats.revenueCents > 0 
        ? ((stats.revenueCents - stats.costCents) / stats.revenueCents) * 100 
        : 0
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 10);

  // Calculate category performance
  const categoryStats = new Map<string, {
    revenueCents: number;
    unitsSold: number;
  }>();

  for (const item of orderItemsInRange) {
    const category = item.product.category || 'Uncategorized';
    const existing = categoryStats.get(category) || {
      revenueCents: 0,
      unitsSold: 0
    };

    existing.revenueCents += item.priceCents * item.quantity;
    existing.unitsSold += item.quantity;

    categoryStats.set(category, existing);
  }

  const categoryPerformance = Array.from(categoryStats.entries())
    .map(([category, stats]) => ({
      category,
      revenueCents: stats.revenueCents,
      unitsSold: stats.unitsSold,
      avgPriceCents: stats.unitsSold > 0 
        ? Math.floor(stats.revenueCents / stats.unitsSold) 
        : 0
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents);

  // Calculate inventory turnover (COGS / Average Inventory)
  // Simplified calculation
  const inventoryTurnover = 4.5; // Placeholder

  return {
    topProducts,
    categoryPerformance,
    inventoryTurnover
  };
}

/**
 * Get live shopping metrics
 */
export async function getLiveMetrics(
  channelId: string,
  dateRange: { from: Date; to: Date }
): Promise<LiveMetrics> {
  const sessions = await db.query.liveSessions.findMany({
    where: and(
      eq(liveSessions.channelId, channelId),
      gte(liveSessions.startedAt, dateRange.from),
      lte(liveSessions.startedAt, dateRange.to)
    )
  });

  const totalSessions = sessions.length;

  // Get viewer data
  let totalViewers = 0;
  let totalWatchTimeMinutes = 0;

  for (const session of sessions) {
    const viewers = await db.query.liveViewers.findMany({
      where: eq(liveViewers.sessionId, session.sessionId)
    });

    totalViewers += viewers.length;

    for (const viewer of viewers) {
      if (viewer.joinedAt && viewer.leftAt) {
        const watchTimeMs = viewer.leftAt.getTime() - viewer.joinedAt.getTime();
        totalWatchTimeMinutes += watchTimeMs / 60000;
      }
    }
  }

  const avgViewersPerSession = totalSessions > 0 ? Math.floor(totalViewers / totalSessions) : 0;
  const avgWatchTimeMinutes = totalViewers > 0 ? Math.floor(totalWatchTimeMinutes / totalViewers) : 0;

  // Calculate conversion rate (orders during live sessions / total viewers)
  let totalLiveOrders = 0;
  let totalLiveRevenueCents = 0;

  for (const session of sessions) {
    const sessionOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.channelId, channelId),
        gte(orders.createdAt, session.startedAt),
        lte(orders.createdAt, session.endedAt || new Date())
      )
    });

    totalLiveOrders += sessionOrders.length;
    totalLiveRevenueCents += sessionOrders.reduce((sum, o) => sum + o.totalCents, 0);
  }

  const conversionRate = totalViewers > 0 ? (totalLiveOrders / totalViewers) * 100 : 0;
  const revenuePerViewer = totalViewers > 0 ? totalLiveRevenueCents / totalViewers / 100 : 0;

  // Get top performing sessions
  const topPerformingSessions = sessions
    .map(session => {
      const sessionOrders = totalLiveOrders; // Simplified
      const sessionRevenue = totalLiveRevenueCents; // Simplified
      const sessionViewers = avgViewersPerSession;

      return {
        sessionId: session.sessionId,
        title: session.title,
        viewers: sessionViewers,
        revenueCents: sessionRevenue,
        conversionRate: sessionViewers > 0 ? (sessionOrders / sessionViewers) * 100 : 0
      };
    })
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5);

  return {
    totalSessions,
    totalViewers,
    avgViewersPerSession,
    avgWatchTimeMinutes,
    conversionRate: Math.round(conversionRate * 10) / 10,
    revenuePerViewer: Math.round(revenuePerViewer * 100) / 100,
    topPerformingSessions
  };
}

/**
 * Perform cohort analysis
 */
export async function getCohortAnalysis(
  channelId: string,
  startMonth: Date,
  monthsToAnalyze: number = 12
): Promise<CohortAnalysis[]> {
  const cohorts: CohortAnalysis[] = [];

  for (let i = 0; i < monthsToAnalyze; i++) {
    const cohortStart = new Date(startMonth);
    cohortStart.setMonth(cohortStart.getMonth() + i);
    
    const cohortEnd = new Date(cohortStart);
    cohortEnd.setMonth(cohortEnd.getMonth() + 1);

    // Get customers acquired in this cohort month
    const cohortCustomers = await db.query.orders.findMany({
      where: and(
        eq(orders.channelId, channelId),
        gte(orders.createdAt, cohortStart),
        lte(orders.createdAt, cohortEnd)
      )
    });

    const customerIds = [...new Set(cohortCustomers.map(o => o.userId).filter(Boolean))];
    const customersAcquired = customerIds.length;

    // Calculate retention for each subsequent month
    const retentionByMonth: Record<number, number> = {};
    const revenueByMonth: Record<number, number> = {};

    for (let month = 0; month < 12; month++) {
      const periodStart = new Date(cohortStart);
      periodStart.setMonth(periodStart.getMonth() + month);
      
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      // Count how many cohort customers made orders in this period
      const periodOrders = await db.query.orders.findMany({
        where: and(
          eq(orders.channelId, channelId),
          sql`user_id IN (${sql.join(customerIds.map(id => sql`${id}`), sql`, `)})`,
          gte(orders.createdAt, periodStart),
          lte(orders.createdAt, periodEnd)
        )
      });

      const activeCustomers = [...new Set(periodOrders.map(o => o.userId))].length;
      const retentionRate = customersAcquired > 0 ? (activeCustomers / customersAcquired) * 100 : 0;

      retentionByMonth[month] = Math.round(retentionRate * 10) / 10;
      revenueByMonth[month] = periodOrders.reduce((sum, o) => sum + o.totalCents, 0);
    }

    cohorts.push({
      cohortMonth: cohortStart.toISOString().slice(0, 7),
      customersAcquired,
      retentionByMonth,
      revenueByMonth
    });
  }

  return cohorts;
}

/**
 * Get conversion funnel metrics
 */
export async function getFunnelMetrics(
  channelId: string,
  dateRange: { from: Date; to: Date }
): Promise<FunnelMetrics[]> {
  // Stage 1: Visitors (unique users who viewed products)
  const allUsers = await db.query.users.findMany({
    where: eq(users.channelId, channelId)
  });
  const visitors = allUsers.length;

  // Stage 2: Product Views
  // In production, track with analytics events
  const productViews = Math.floor(visitors * 0.7); // 70% view products

  // Stage 3: Add to Cart
  const addToCart = Math.floor(productViews * 0.3); // 30% add to cart

  // Stage 4: Checkout Started
  const ordersInRange = await db.query.orders.findMany({
    where: and(
      eq(orders.channelId, channelId),
      gte(orders.createdAt, dateRange.from),
      lte(orders.createdAt, dateRange.to)
    )
  });
  const checkoutStarted = ordersInRange.length;

  // Stage 5: Purchase Completed
  const purchaseCompleted = ordersInRange.filter(o => 
    o.status === 'CONFIRMED' || o.status === 'SHIPPED' || o.status === 'DELIVERED'
  ).length;

  const funnel: FunnelMetrics[] = [
    {
      stage: 'Visitors',
      users: visitors,
      conversionRate: 100,
      dropoffRate: 0
    },
    {
      stage: 'Product Views',
      users: productViews,
      conversionRate: visitors > 0 ? (productViews / visitors) * 100 : 0,
      dropoffRate: visitors > 0 ? ((visitors - productViews) / visitors) * 100 : 0
    },
    {
      stage: 'Add to Cart',
      users: addToCart,
      conversionRate: productViews > 0 ? (addToCart / productViews) * 100 : 0,
      dropoffRate: productViews > 0 ? ((productViews - addToCart) / productViews) * 100 : 0
    },
    {
      stage: 'Checkout',
      users: checkoutStarted,
      conversionRate: addToCart > 0 ? (checkoutStarted / addToCart) * 100 : 0,
      dropoffRate: addToCart > 0 ? ((addToCart - checkoutStarted) / addToCart) * 100 : 0
    },
    {
      stage: 'Purchase',
      users: purchaseCompleted,
      conversionRate: checkoutStarted > 0 ? (purchaseCompleted / checkoutStarted) * 100 : 0,
      dropoffRate: checkoutStarted > 0 ? ((checkoutStarted - purchaseCompleted) / checkoutStarted) * 100 : 0
    }
  ];

  return funnel.map(stage => ({
    ...stage,
    conversionRate: Math.round(stage.conversionRate * 10) / 10,
    dropoffRate: Math.round(stage.dropoffRate * 10) / 10
  }));
}

/**
 * Forecast revenue using linear regression
 */
export async function forecastRevenue(
  channelId: string,
  historicalMonths: number = 12,
  forecastMonths: number = 3
): Promise<Array<{
  month: string;
  forecastedRevenueCents: number;
  confidenceIntervalLow: number;
  confidenceIntervalHigh: number;
}>> {
  // Get historical revenue data
  const historicalData: Array<{ month: string; revenueCents: number }> = [];

  for (let i = historicalMonths - 1; i >= 0; i--) {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - i);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const monthOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.channelId, channelId),
        gte(orders.createdAt, monthStart),
        lte(orders.createdAt, monthEnd)
      )
    });

    const revenueCents = monthOrders.reduce((sum, o) => sum + o.totalCents, 0);

    historicalData.push({
      month: monthStart.toISOString().slice(0, 7),
      revenueCents
    });
  }

  // Simple linear regression
  const n = historicalData.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = historicalData.map(d => d.revenueCents);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Generate forecasts
  const forecasts = [];
  for (let i = 1; i <= forecastMonths; i++) {
    const forecastMonth = new Date();
    forecastMonth.setMonth(forecastMonth.getMonth() + i);
    
    const x_forecast = n + i - 1;
    const forecastedRevenueCents = Math.floor(slope * x_forecast + intercept);

    // Calculate confidence interval (simplified - 20% margin)
    const margin = forecastedRevenueCents * 0.2;

    forecasts.push({
      month: forecastMonth.toISOString().slice(0, 7),
      forecastedRevenueCents: Math.max(0, forecastedRevenueCents),
      confidenceIntervalLow: Math.max(0, Math.floor(forecastedRevenueCents - margin)),
      confidenceIntervalHigh: Math.floor(forecastedRevenueCents + margin)
    });
  }

  return forecasts;
}

/**
 * Get creator performance metrics
 */
export async function getCreatorMetrics(
  channelId: string,
  dateRange: { from: Date; to: Date }
): Promise<Array<{
  creatorId: string;
  name: string;
  sessionsHosted: number;
  totalViewers: number;
  totalRevenueCents: number;
  avgViewersPerSession: number;
  conversionRate: number;
  totalCommissionCents: number;
}>> {
  const allCreators = await db.query.creators.findMany({
    where: eq(creators.channelId, channelId)
  });

  const metrics = [];

  for (const creator of allCreators) {
    const sessions = await db.query.liveSessions.findMany({
      where: and(
        eq(liveSessions.creatorId, creator.creatorId),
        gte(liveSessions.startedAt, dateRange.from),
        lte(liveSessions.startedAt, dateRange.to)
      )
    });

    const sessionsHosted = sessions.length;

    let totalViewers = 0;
    let totalRevenueCents = 0;

    for (const session of sessions) {
      const viewers = await db.query.liveViewers.findMany({
        where: eq(liveViewers.sessionId, session.sessionId)
      });

      totalViewers += viewers.length;

      const sessionOrders = await db.query.orders.findMany({
        where: and(
          eq(orders.channelId, channelId),
          gte(orders.createdAt, session.startedAt),
          lte(orders.createdAt, session.endedAt || new Date())
        )
      });

      totalRevenueCents += sessionOrders.reduce((sum, o) => sum + o.totalCents, 0);
    }

    const avgViewersPerSession = sessionsHosted > 0 ? Math.floor(totalViewers / sessionsHosted) : 0;
    const conversionRate = totalViewers > 0 ? (totalRevenueCents / totalViewers) * 100 : 0;
    
    // Calculate commission (10% of revenue)
    const totalCommissionCents = Math.floor(totalRevenueCents * 0.1);

    metrics.push({
      creatorId: creator.creatorId,
      name: creator.name,
      sessionsHosted,
      totalViewers,
      totalRevenueCents,
      avgViewersPerSession,
      conversionRate: Math.round(conversionRate * 10) / 10,
      totalCommissionCents
    });
  }

  return metrics.sort((a, b) => b.totalRevenueCents - a.totalRevenueCents);
}

/**
 * Get executive dashboard summary
 */
export async function getExecutiveDashboard(
  channelId: string,
  dateRange: { from: Date; to: Date }
): Promise<{
  revenue: RevenueMetrics;
  growth: GrowthMetrics;
  products: ProductMetrics;
  live: LiveMetrics;
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    priority: number;
  }>;
}> {
  const [revenue, growth, products, live] = await Promise.all([
    getRevenueMetrics(channelId, dateRange),
    getGrowthMetrics(channelId, dateRange),
    getProductMetrics(channelId, dateRange),
    getLiveMetrics(channelId, dateRange)
  ]);

  // Generate alerts
  const alerts = [];

  if (revenue.refundRatePercent > 5) {
    alerts.push({
      type: 'warning' as const,
      message: `High refund rate: ${revenue.refundRatePercent}%`,
      priority: 2
    });
  }

  if (revenue.netMarginPercent < 10) {
    alerts.push({
      type: 'error' as const,
      message: `Low net margin: ${revenue.netMarginPercent}%`,
      priority: 1
    });
  }

  if (growth.churnRate > 30) {
    alerts.push({
      type: 'warning' as const,
      message: `High churn rate: ${growth.churnRate}%`,
      priority: 2
    });
  }

  if (live.conversionRate < 2) {
    alerts.push({
      type: 'info' as const,
      message: `Low live conversion rate: ${live.conversionRate}%`,
      priority: 3
    });
  }

  return {
    revenue,
    growth,
    products,
    live,
    alerts: alerts.sort((a, b) => a.priority - b.priority)
  };
}

/**
 * Export report to CSV
 */
export async function exportReportCSV(
  reportType: 'revenue' | 'products' | 'customers' | 'live',
  data: any[]
): Promise<string> {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => 
      typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    ).join(',')
  );

  return [headers, ...rows].join('\n');
}
