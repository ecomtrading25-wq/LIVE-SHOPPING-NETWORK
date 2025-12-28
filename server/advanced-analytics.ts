/**
 * Advanced Analytics System
 * Provides deep insights into business performance, customer behavior, and operational efficiency
 */

import { getDb } from "./db"
const db = await getDb();
import {
  orders,
  orderItems,
  products,
  users,
  liveSessions,
  creators,
  fulfillmentTasks,
  disputes,
} from "../drizzle/schema";
import { eq, gte, sql, and, desc, count, sum, avg } from "drizzle-orm";

interface TimeSeriesData {
  date: string;
  value: number;
}

interface CustomerSegment {
  segment: string;
  customerCount: number;
  totalRevenue: number;
  averageOrderValue: number;
  orderFrequency: number;
}

interface ProductPerformance {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
  profit: number;
  conversionRate: number;
  returnRate: number;
  averageRating: number;
}

interface ChannelPerformance {
  channelId: string;
  channelName: string;
  orders: number;
  revenue: number;
  averageOrderValue: number;
  conversionRate: number;
  customerAcquisitionCost: number;
}

/**
 * Get revenue time series data
 */
export async function getRevenueTimeSeries(
  startDate: Date,
  endDate: Date,
  granularity: "day" | "week" | "month" = "day"
): Promise<TimeSeriesData[]> {
  let dateFormat = "%Y-%m-%d";
  if (granularity === "week") dateFormat = "%Y-%W";
  if (granularity === "month") dateFormat = "%Y-%m";

  const data = await db
    .select({
      date: sql<string>`DATE_FORMAT(${orders.createdAt}, ${dateFormat})`.as(
        "date"
      ),
      value: sql<number>`SUM(${orders.totalAmount})`.as("value"),
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startDate),
        sql`${orders.createdAt} <= ${endDate}`,
        sql`${orders.status} IN ('processing', 'shipped', 'delivered')`
      )
    )
    .groupBy(sql`DATE_FORMAT(${orders.createdAt}, ${dateFormat})`)
    .orderBy(sql`DATE_FORMAT(${orders.createdAt}, ${dateFormat})`);

  return data.map((row) => ({
    date: row.date,
    value: Number(row.value) || 0,
  }));
}

/**
 * Get customer segmentation (RFM analysis)
 */
export async function getCustomerSegmentation(): Promise<CustomerSegment[]> {
  // Simplified RFM segmentation
  const segments = [
    {
      segment: "Champions",
      minRecency: 0,
      maxRecency: 30,
      minFrequency: 5,
      minMonetary: 500,
    },
    {
      segment: "Loyal Customers",
      minRecency: 0,
      maxRecency: 60,
      minFrequency: 3,
      minMonetary: 200,
    },
    {
      segment: "Potential Loyalists",
      minRecency: 0,
      maxRecency: 90,
      minFrequency: 2,
      minMonetary: 100,
    },
    {
      segment: "At Risk",
      minRecency: 90,
      maxRecency: 180,
      minFrequency: 2,
      minMonetary: 100,
    },
    {
      segment: "Lost",
      minRecency: 180,
      maxRecency: 999,
      minFrequency: 1,
      minMonetary: 0,
    },
  ];

  const results: CustomerSegment[] = [];

  for (const segment of segments) {
    const data = await db
      .select({
        customerCount: count(sql`DISTINCT ${orders.userId}`).as(
          "customerCount"
        ),
        totalRevenue: sum(orders.totalAmount).as("totalRevenue"),
        totalOrders: count(orders.id).as("totalOrders"),
      })
      .from(orders)
      .where(
        and(
          sql`DATEDIFF(NOW(), ${orders.createdAt}) BETWEEN ${segment.minRecency} AND ${segment.maxRecency}`,
          sql`${orders.totalAmount} >= ${segment.minMonetary}`
        )
      );

    const row = data[0];
    const customerCount = Number(row?.customerCount) || 0;
    const totalRevenue = Number(row?.totalRevenue) || 0;
    const totalOrders = Number(row?.totalOrders) || 0;

    results.push({
      segment: segment.segment,
      customerCount,
      totalRevenue,
      averageOrderValue: customerCount > 0 ? totalRevenue / totalOrders : 0,
      orderFrequency: customerCount > 0 ? totalOrders / customerCount : 0,
    });
  }

  return results;
}

/**
 * Get product performance metrics
 */
export async function getProductPerformance(
  limit: number = 20
): Promise<ProductPerformance[]> {
  const data = await db
    .select({
      productId: products.id,
      productName: products.name,
      unitsSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`.as(
        "unitsSold"
      ),
      revenue: sql<number>`COALESCE(SUM(${orderItems.quantity} * ${orderItems.price}), 0)`.as(
        "revenue"
      ),
    })
    .from(products)
    .leftJoin(orderItems, eq(products.id, orderItems.productId))
    .leftJoin(orders, eq(orderItems.orderId, orders.id))
    .where(sql`${orders.status} IN ('processing', 'shipped', 'delivered')`)
    .groupBy(products.id, products.name)
    .orderBy(desc(sql`SUM(${orderItems.quantity} * ${orderItems.price})`))
    .limit(limit);

  return data.map((row) => ({
    productId: row.productId,
    productName: row.productName,
    unitsSold: Number(row.unitsSold) || 0,
    revenue: Number(row.revenue) || 0,
    profit: Number(row.revenue) * 0.3, // Assume 30% profit margin
    conversionRate: 0.05, // Placeholder
    returnRate: 0.02, // Placeholder
    averageRating: 4.5, // Placeholder
  }));
}

/**
 * Get cohort retention analysis
 */
export async function getCohortRetention(
  cohortMonths: number = 6
): Promise<any[]> {
  // Get customers grouped by their first purchase month
  const cohorts = await db
    .select({
      cohortMonth: sql<string>`DATE_FORMAT(MIN(${orders.createdAt}), '%Y-%m')`.as(
        "cohortMonth"
      ),
      userId: orders.userId,
    })
    .from(orders)
    .where(
      sql`${orders.createdAt} >= DATE_SUB(NOW(), INTERVAL ${cohortMonths} MONTH)`
    )
    .groupBy(orders.userId);

  // Calculate retention for each cohort
  const retentionData: any[] = [];

  for (let i = 0; i < cohortMonths; i++) {
    const cohortDate = new Date();
    cohortDate.setMonth(cohortDate.getMonth() - i);
    const cohortMonth = cohortDate.toISOString().slice(0, 7);

    const cohortUsers = cohorts.filter((c) => c.cohortMonth === cohortMonth);
    const cohortSize = cohortUsers.length;

    if (cohortSize === 0) continue;

    const retention: number[] = [100]; // Month 0 is always 100%

    for (let month = 1; month <= i; month++) {
      const retentionDate = new Date(cohortDate);
      retentionDate.setMonth(retentionDate.getMonth() + month);

      const activeUsers = await db
        .select({ count: count(sql`DISTINCT ${orders.userId}`) })
        .from(orders)
        .where(
          and(
            sql`${orders.userId} IN (${cohortUsers.map((u) => u.userId).join(",")})`,
            sql`DATE_FORMAT(${orders.createdAt}, '%Y-%m') = ${retentionDate.toISOString().slice(0, 7)}`
          )
        );

      const activeCount = Number(activeUsers[0]?.count) || 0;
      retention.push((activeCount / cohortSize) * 100);
    }

    retentionData.push({
      cohortMonth,
      cohortSize,
      retention,
    });
  }

  return retentionData;
}

/**
 * Get funnel conversion metrics
 */
export async function getFunnelMetrics(
  startDate: Date,
  endDate: Date
): Promise<{
  visitors: number;
  productViews: number;
  addToCart: number;
  checkout: number;
  purchase: number;
  conversionRate: number;
}> {
  // Note: This requires tracking events, using placeholder data
  const purchaseCount = await db
    .select({ count: count(orders.id) })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startDate),
        sql`${orders.createdAt} <= ${endDate}`
      )
    );

  const purchases = Number(purchaseCount[0]?.count) || 0;

  // Estimate funnel metrics based on typical e-commerce conversion rates
  const visitors = Math.round(purchases / 0.02); // 2% conversion rate
  const productViews = Math.round(purchases / 0.05); // 5% view-to-purchase
  const addToCart = Math.round(purchases / 0.25); // 25% cart-to-purchase
  const checkout = Math.round(purchases / 0.5); // 50% checkout-to-purchase

  return {
    visitors,
    productViews,
    addToCart,
    checkout,
    purchase: purchases,
    conversionRate: (purchases / visitors) * 100,
  };
}

/**
 * Get live shopping performance metrics
 */
export async function getLiveShoppingMetrics(): Promise<{
  totalSessions: number;
  averageViewers: number;
  totalRevenue: number;
  conversionRate: number;
  topCreators: any[];
}> {
  const sessionCount = await db
    .select({ count: count(liveSessions.id) })
    .from(liveSessions);

  const totalSessions = Number(sessionCount[0]?.count) || 0;

  // Get top creators by revenue
  const topCreators = await db
    .select({
      creatorId: creators.id,
      creatorName: creators.name,
      totalSessions: count(liveSessions.id).as("totalSessions"),
      totalRevenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`.as(
        "totalRevenue"
      ),
    })
    .from(creators)
    .leftJoin(liveSessions, eq(creators.id, liveSessions.creatorId))
    .leftJoin(
      orders,
      sql`${orders.channelId} = ${liveSessions.channelId} AND ${orders.createdAt} BETWEEN ${liveSessions.startTime} AND ${liveSessions.endTime}`
    )
    .groupBy(creators.id, creators.name)
    .orderBy(desc(sql`SUM(${orders.totalAmount})`))
    .limit(10);

  return {
    totalSessions,
    averageViewers: 150, // Placeholder
    totalRevenue: topCreators.reduce(
      (sum, c) => sum + Number(c.totalRevenue),
      0
    ),
    conversionRate: 8.5, // Placeholder
    topCreators: topCreators.map((c) => ({
      creatorId: c.creatorId,
      creatorName: c.creatorName,
      totalSessions: Number(c.totalSessions),
      totalRevenue: Number(c.totalRevenue),
    })),
  };
}

/**
 * Get operational efficiency metrics
 */
export async function getOperationalMetrics(): Promise<{
  averageFulfillmentTime: number;
  pickAccuracy: number;
  onTimeDeliveryRate: number;
  disputeRate: number;
  customerSatisfaction: number;
}> {
  // Average fulfillment time (hours)
  const fulfillmentTimes = await db
    .select({
      avgTime: sql<number>`AVG(TIMESTAMPDIFF(HOUR, ${fulfillmentTasks.createdAt}, ${fulfillmentTasks.completedAt}))`.as(
        "avgTime"
      ),
    })
    .from(fulfillmentTasks)
    .where(eq(fulfillmentTasks.status, "completed"));

  const averageFulfillmentTime = Number(fulfillmentTimes[0]?.avgTime) || 0;

  // Dispute rate
  const totalOrders = await db.select({ count: count(orders.id) }).from(orders);
  const totalDisputes = await db
    .select({ count: count(disputes.id) })
    .from(disputes);

  const disputeRate =
    (Number(totalDisputes[0]?.count) / Number(totalOrders[0]?.count)) * 100 ||
    0;

  return {
    averageFulfillmentTime: Math.round(averageFulfillmentTime),
    pickAccuracy: 98.5, // Placeholder
    onTimeDeliveryRate: 94.2, // Placeholder
    disputeRate: Math.round(disputeRate * 100) / 100,
    customerSatisfaction: 4.6, // Placeholder
  };
}

/**
 * Get comprehensive dashboard metrics
 */
export async function getDashboardMetrics(
  startDate: Date,
  endDate: Date
): Promise<{
  revenue: TimeSeriesData[];
  customerSegments: CustomerSegment[];
  topProducts: ProductPerformance[];
  funnelMetrics: any;
  liveShoppingMetrics: any;
  operationalMetrics: any;
}> {
  const [
    revenue,
    customerSegments,
    topProducts,
    funnelMetrics,
    liveShoppingMetrics,
    operationalMetrics,
  ] = await Promise.all([
    getRevenueTimeSeries(startDate, endDate, "day"),
    getCustomerSegmentation(),
    getProductPerformance(20),
    getFunnelMetrics(startDate, endDate),
    getLiveShoppingMetrics(),
    getOperationalMetrics(),
  ]);

  return {
    revenue,
    customerSegments,
    topProducts,
    funnelMetrics,
    liveShoppingMetrics,
    operationalMetrics,
  };
}
