/**
 * Customer Segmentation Engine with RFM Analysis
 * Recency, Frequency, Monetary value analysis for customer targeting
 */

import { getDb } from "./db"
const db = await getDb();
import { orders, users } from "../drizzle/schema";
import { sql, desc, asc, and, gte, lte, eq } from "drizzle-orm";

export interface RFMScore {
  userId: string;
  recencyScore: number; // 1-5 (5 = most recent)
  frequencyScore: number; // 1-5 (5 = most frequent)
  monetaryScore: number; // 1-5 (5 = highest spend)
  rfmScore: string; // e.g., "555", "111"
  segment: string; // e.g., "Champions", "At Risk"
}

export interface CustomerSegment {
  name: string;
  description: string;
  rfmPattern: string[];
  count: number;
  totalRevenue: number;
  avgOrderValue: number;
  recommendedAction: string;
}

/**
 * Calculate RFM Scores for All Customers
 */
export async function calculateRFMScores(): Promise<RFMScore[]> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get customer order statistics
  const customerStats = await db
    .select({
      userId: orders.userId,
      lastOrderDate: sql<Date>`MAX(${orders.createdAt})`,
      orderCount: sql<number>`COUNT(*)`,
      totalSpent: sql<number>`SUM(${orders.total})`,
    })
    .from(orders)
    .where(and(
      gte(orders.createdAt, thirtyDaysAgo),
      eq(orders.status, "delivered")
    ))
    .groupBy(orders.userId);

  if (customerStats.length === 0) {
    return [];
  }

  // Calculate recency, frequency, monetary quintiles
  const recencies = customerStats.map((c) => 
    Math.floor((now.getTime() - new Date(c.lastOrderDate).getTime()) / (24 * 60 * 60 * 1000))
  ).sort((a, b) => a - b);
  
  const frequencies = customerStats.map((c) => c.orderCount).sort((a, b) => a - b);
  const monetaries = customerStats.map((c) => c.totalSpent).sort((a, b) => a - b);

  const recencyQuintiles = calculateQuintiles(recencies);
  const frequencyQuintiles = calculateQuintiles(frequencies);
  const monetaryQuintiles = calculateQuintiles(monetaries);

  // Assign scores
  const rfmScores: RFMScore[] = customerStats.map((customer) => {
    const recency = Math.floor((now.getTime() - new Date(customer.lastOrderDate).getTime()) / (24 * 60 * 60 * 1000));
    const frequency = customer.orderCount;
    const monetary = customer.totalSpent;

    // Lower recency = higher score (more recent is better)
    const recencyScore = 6 - getQuintileScore(recency, recencyQuintiles);
    const frequencyScore = getQuintileScore(frequency, frequencyQuintiles);
    const monetaryScore = getQuintileScore(monetary, monetaryQuintiles);

    const rfmScore = `${recencyScore}${frequencyScore}${monetaryScore}`;
    const segment = assignSegment(recencyScore, frequencyScore, monetaryScore);

    return {
      userId: customer.userId,
      recencyScore,
      frequencyScore,
      monetaryScore,
      rfmScore,
      segment,
    };
  });

  return rfmScores;
}

/**
 * Calculate Quintiles for a Dataset
 */
function calculateQuintiles(data: number[]): number[] {
  const sorted = [...data].sort((a, b) => a - b);
  const quintiles: number[] = [];
  
  for (let i = 1; i <= 4; i++) {
    const index = Math.floor((sorted.length * i) / 5);
    quintiles.push(sorted[index]);
  }
  
  return quintiles;
}

/**
 * Get Quintile Score (1-5) for a Value
 */
function getQuintileScore(value: number, quintiles: number[]): number {
  if (value <= quintiles[0]) return 1;
  if (value <= quintiles[1]) return 2;
  if (value <= quintiles[2]) return 3;
  if (value <= quintiles[3]) return 4;
  return 5;
}

/**
 * Assign Customer Segment Based on RFM Scores
 */
function assignSegment(r: number, f: number, m: number): string {
  // Champions: High R, F, M
  if (r >= 4 && f >= 4 && m >= 4) return "Champions";
  
  // Loyal Customers: High F, M
  if (f >= 4 && m >= 4) return "Loyal Customers";
  
  // Potential Loyalists: High R, low F, M
  if (r >= 4 && f <= 3 && m <= 3) return "Potential Loyalists";
  
  // New Customers: High R, low F, M
  if (r >= 4 && f === 1) return "New Customers";
  
  // Promising: Medium R, F, M
  if (r >= 3 && f >= 2 && m >= 2) return "Promising";
  
  // Need Attention: Medium R, F, M (lower than Promising)
  if (r >= 3 && f >= 2) return "Need Attention";
  
  // About to Sleep: Low R, medium F, M
  if (r <= 2 && f >= 2 && m >= 2) return "About to Sleep";
  
  // At Risk: Low R, high F, M
  if (r <= 2 && f >= 4 && m >= 4) return "At Risk";
  
  // Can't Lose Them: Very low R, high F, M
  if (r === 1 && f >= 4 && m >= 4) return "Can't Lose Them";
  
  // Hibernating: Low R, F, M
  if (r <= 2 && f <= 2) return "Hibernating";
  
  // Lost: Very low R, F, M
  if (r === 1 && f === 1) return "Lost";
  
  return "Others";
}

/**
 * Get Customer Segments with Statistics
 */
export async function getCustomerSegments(): Promise<CustomerSegment[]> {
  const rfmScores = await calculateRFMScores();
  
  const segmentMap = new Map<string, {
    users: string[];
    totalRevenue: number;
    orderCount: number;
  }>();

  // Group by segment
  for (const score of rfmScores) {
    if (!segmentMap.has(score.segment)) {
      segmentMap.set(score.segment, {
        users: [],
        totalRevenue: 0,
        orderCount: 0,
      });
    }
    segmentMap.get(score.segment)!.users.push(score.userId);
  }

  // Calculate statistics for each segment
  const segments: CustomerSegment[] = [];
  
  for (const [segmentName, data] of segmentMap.entries()) {
    // Get revenue and order stats
    const stats = await db
      .select({
        totalRevenue: sql<number>`SUM(${orders.total})`,
        orderCount: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(sql`${orders.userId} IN (${data.users.join(",")})`);

    const totalRevenue = stats[0]?.totalRevenue || 0;
    const orderCount = stats[0]?.orderCount || 0;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    segments.push({
      name: segmentName,
      description: getSegmentDescription(segmentName),
      rfmPattern: getRFMPattern(segmentName),
      count: data.users.length,
      totalRevenue,
      avgOrderValue,
      recommendedAction: getRecommendedAction(segmentName),
    });
  }

  return segments.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

/**
 * Get Segment Description
 */
function getSegmentDescription(segment: string): string {
  const descriptions: Record<string, string> = {
    "Champions": "Your best customers who buy often and spend the most",
    "Loyal Customers": "Consistent customers with high lifetime value",
    "Potential Loyalists": "Recent customers with potential to become loyal",
    "New Customers": "Recently acquired customers",
    "Promising": "Recent shoppers with average frequency and spending",
    "Need Attention": "Above average customers who haven't purchased recently",
    "About to Sleep": "Below average recency, frequency, and monetary scores",
    "At Risk": "Used to purchase frequently but haven't returned recently",
    "Can't Lose Them": "Made big purchases but long time ago",
    "Hibernating": "Last purchase was long ago and low spending",
    "Lost": "Lowest recency, frequency, and monetary scores",
    "Others": "Customers who don't fit other segments",
  };
  
  return descriptions[segment] || "Other customers";
}

/**
 * Get RFM Pattern for Segment
 */
function getRFMPattern(segment: string): string[] {
  const patterns: Record<string, string[]> = {
    "Champions": ["555", "554", "544", "545", "454", "455", "445"],
    "Loyal Customers": ["543", "444", "435", "355", "354", "345", "344", "335"],
    "Potential Loyalists": ["553", "551", "552", "541", "542", "533", "532", "531", "452", "451", "442", "441", "431", "453", "433", "432", "423", "353", "352", "351", "342", "341", "333", "323"],
    "New Customers": ["512", "511", "422", "421", "412", "411", "311"],
    "Promising": ["525", "524", "523", "522", "521", "515", "514", "513", "425", "424", "413", "414", "415", "315", "314", "313"],
    "Need Attention": ["535", "534", "443", "434", "343", "334", "325", "324"],
    "About to Sleep": ["331", "321", "312", "221", "213", "231", "241", "251"],
    "At Risk": ["255", "254", "245", "244", "253", "252", "243", "242", "235", "234", "225", "224", "153", "152", "145", "143", "142", "135", "134", "133", "125", "124"],
    "Can't Lose Them": ["155", "154", "144", "214", "215", "115", "114", "113"],
    "Hibernating": ["332", "322", "231", "241", "251", "233", "232", "223", "222", "132", "123", "122", "212", "211"],
    "Lost": ["111", "112", "121", "131", "141", "151"],
  };
  
  return patterns[segment] || [];
}

/**
 * Get Recommended Action for Segment
 */
function getRecommendedAction(segment: string): string {
  const actions: Record<string, string> = {
    "Champions": "Reward them with VIP perks, early access, and exclusive offers",
    "Loyal Customers": "Upsell higher value products and ask for referrals",
    "Potential Loyalists": "Offer membership programs and recommend products",
    "New Customers": "Provide onboarding support and build relationships",
    "Promising": "Offer free shipping and product recommendations",
    "Need Attention": "Send limited time offers and reactivation campaigns",
    "About to Sleep": "Share valuable resources and win-back offers",
    "At Risk": "Send personalized emails with special discounts",
    "Can't Lose Them": "Win them back with renewals and helpful products",
    "Hibernating": "Offer other relevant products and special discounts",
    "Lost": "Revive interest with brand new products or ignore",
    "Others": "Monitor and move to appropriate segments",
  };
  
  return actions[segment] || "Monitor customer behavior";
}

/**
 * Get Customers in Specific Segment
 */
export async function getCustomersInSegment(segmentName: string): Promise<{
  userId: string;
  email: string;
  name: string;
  rfmScore: string;
  lastOrderDate: Date;
  orderCount: number;
  totalSpent: number;
}[]> {
  const rfmScores = await calculateRFMScores();
  const segmentUsers = rfmScores.filter((score) => score.segment === segmentName);

  if (segmentUsers.length === 0) {
    return [];
  }

  const userIds = segmentUsers.map((u) => u.userId);

  // Get user details with order stats
  const customers = await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      lastOrderDate: sql<Date>`MAX(${orders.createdAt})`,
      orderCount: sql<number>`COUNT(${orders.id})`,
      totalSpent: sql<number>`SUM(${orders.total})`,
    })
    .from(users)
    .leftJoin(orders, eq(users.id, orders.userId))
    .where(sql`${users.id} IN (${userIds.join(",")})`)
    .groupBy(users.id);

  return customers.map((customer) => ({
    ...customer,
    rfmScore: segmentUsers.find((u) => u.userId === customer.userId)?.rfmScore || "000",
  }));
}

/**
 * Predict Customer Churn Risk
 */
export async function predictChurnRisk(): Promise<{
  userId: string;
  email: string;
  name: string;
  churnRisk: "high" | "medium" | "low";
  daysSinceLastOrder: number;
  recommendedAction: string;
}[]> {
  const rfmScores = await calculateRFMScores();
  const now = new Date();

  const churnRisks = [];

  for (const score of rfmScores) {
    let churnRisk: "high" | "medium" | "low" = "low";
    let recommendedAction = "Monitor customer activity";

    // High churn risk: At Risk, Can't Lose Them, Hibernating, Lost
    if (["At Risk", "Can't Lose Them", "Hibernating", "Lost"].includes(score.segment)) {
      churnRisk = "high";
      recommendedAction = "Send win-back campaign with 20% discount immediately";
    }
    // Medium churn risk: About to Sleep, Need Attention
    else if (["About to Sleep", "Need Attention"].includes(score.segment)) {
      churnRisk = "medium";
      recommendedAction = "Send re-engagement email with product recommendations";
    }

    if (churnRisk !== "low") {
      // Get user details
      const user = await db
        .select({
          email: users.email,
          name: users.name,
          lastOrderDate: sql<Date>`MAX(${orders.createdAt})`,
        })
        .from(users)
        .leftJoin(orders, eq(users.id, orders.userId))
        .where(eq(users.id, score.userId))
        .groupBy(users.id)
        .limit(1);

      if (user.length > 0) {
        const daysSinceLastOrder = Math.floor(
          (now.getTime() - new Date(user[0].lastOrderDate).getTime()) / (24 * 60 * 60 * 1000)
        );

        churnRisks.push({
          userId: score.userId,
          email: user[0].email,
          name: user[0].name,
          churnRisk,
          daysSinceLastOrder,
          recommendedAction,
        });
      }
    }
  }

  return churnRisks.sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, low: 2 };
    return riskOrder[a.churnRisk] - riskOrder[b.churnRisk];
  });
}

/**
 * Calculate Customer Lifetime Value (CLV)
 */
export async function calculateCustomerLifetimeValue(userId: string): Promise<{
  historicalCLV: number;
  predictedCLV: number;
  avgOrderValue: number;
  purchaseFrequency: number;
  customerLifespan: number; // in days
}> {
  const customerOrders = await db
    .select({
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(
      eq(orders.userId, userId),
      eq(orders.status, "delivered")
    ))
    .orderBy(asc(orders.createdAt));

  if (customerOrders.length === 0) {
    return {
      historicalCLV: 0,
      predictedCLV: 0,
      avgOrderValue: 0,
      purchaseFrequency: 0,
      customerLifespan: 0,
    };
  }

  // Calculate metrics
  const historicalCLV = customerOrders.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = historicalCLV / customerOrders.length;

  const firstOrderDate = new Date(customerOrders[0].createdAt);
  const lastOrderDate = new Date(customerOrders[customerOrders.length - 1].createdAt);
  const customerLifespan = Math.floor(
    (lastOrderDate.getTime() - firstOrderDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  const purchaseFrequency = customerLifespan > 0 
    ? customerOrders.length / (customerLifespan / 365) 
    : customerOrders.length;

  // Predicted CLV = Avg Order Value × Purchase Frequency × Customer Lifespan (in years)
  const predictedLifespanYears = 3; // Assume 3-year customer lifespan
  const predictedCLV = avgOrderValue * purchaseFrequency * predictedLifespanYears;

  return {
    historicalCLV: Math.round(historicalCLV * 100) / 100,
    predictedCLV: Math.round(predictedCLV * 100) / 100,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    purchaseFrequency: Math.round(purchaseFrequency * 100) / 100,
    customerLifespan,
  };
}

/**
 * Get Top Customers by CLV
 */
export async function getTopCustomersByCLV(limit: number = 100): Promise<{
  userId: string;
  email: string;
  name: string;
  clv: number;
  orderCount: number;
  avgOrderValue: number;
}[]> {
  const allUsers = await db.select({ id: users.id, email: users.email, name: users.name }).from(users);

  const customersWithCLV = await Promise.all(
    allUsers.map(async (user) => {
      const clvData = await calculateCustomerLifetimeValue(user.id);
      const orderCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(orders)
        .where(and(
          eq(orders.userId, user.id),
          eq(orders.status, "delivered")
        ));

      return {
        userId: user.id,
        email: user.email,
        name: user.name,
        clv: clvData.predictedCLV,
        orderCount: orderCount[0]?.count || 0,
        avgOrderValue: clvData.avgOrderValue,
      };
    })
  );

  return customersWithCLV
    .filter((c) => c.clv > 0)
    .sort((a, b) => b.clv - a.clv)
    .slice(0, limit);
}
