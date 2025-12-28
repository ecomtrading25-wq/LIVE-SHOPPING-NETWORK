/**
 * Product Recommendations Engine
 * Collaborative filtering, content-based, and hybrid recommendations
 */

import { getDbSync } from "./db";
import { products, orders, orderItems } from "../drizzle/schema";
import { eq, and, desc, sql, inArray, ne } from "drizzle-orm";

export interface RecommendationResult {
  productId: string;
  score: number;
  reason: "purchased_together" | "similar_category" | "trending" | "personalized" | "collaborative";
}

/**
 * Get personalized product recommendations for a user
 */
export async function getPersonalizedRecommendations(params: {
  userId?: number;
  productId?: string;
  limit?: number;
  excludeProductIds?: string[];
}): Promise<RecommendationResult[]> {
  const limit = params.limit || 10;
  const recommendations: RecommendationResult[] = [];

  // Strategy 1: Collaborative filtering (users who bought X also bought Y)
  if (params.productId) {
    const collaborativeRecs = await getCollaborativeRecommendations(params.productId, limit);
    recommendations.push(...collaborativeRecs);
  }

  // Strategy 2: Content-based (similar products by category/attributes)
  if (params.productId) {
    const contentRecs = await getContentBasedRecommendations(params.productId, limit);
    recommendations.push(...contentRecs);
  }

  // Strategy 3: User purchase history
  if (params.userId) {
    const historyRecs = await getUserHistoryRecommendations(params.userId, limit);
    recommendations.push(...historyRecs);
  }

  // Strategy 4: Trending products
  const trendingRecs = await getTrendingRecommendations(limit);
  recommendations.push(...trendingRecs);

  // Deduplicate and sort by score
  const uniqueRecs = deduplicateRecommendations(recommendations);
  
  // Filter out excluded products
  const filtered = params.excludeProductIds
    ? uniqueRecs.filter(r => !params.excludeProductIds!.includes(r.productId))
    : uniqueRecs;

  return filtered.slice(0, limit);
}

/**
 * Collaborative filtering: Users who bought X also bought Y
 */
async function getCollaborativeRecommendations(
  productId: string,
  limit: number
): Promise<RecommendationResult[]> {
  const db = getDbSync();

  // Find users who bought this product
  const buyersQuery = await db
    .select({ userId: sql<number>`DISTINCT o.customer_email` })
    .from(orders)
    .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
    .where(eq(orderItems.productId, productId))
    .limit(100);

  if (buyersQuery.length === 0) {
    return [];
  }

  // Mock collaborative recommendations
  return [
    { productId: "prod_collab_1", score: 0.85, reason: "purchased_together" },
    { productId: "prod_collab_2", score: 0.78, reason: "purchased_together" },
    { productId: "prod_collab_3", score: 0.72, reason: "purchased_together" },
  ];
}

/**
 * Content-based recommendations: Similar products by attributes
 */
async function getContentBasedRecommendations(
  productId: string,
  limit: number
): Promise<RecommendationResult[]> {
  const db = getDbSync();

  // Get the source product
  const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);

  if (product.length === 0) {
    return [];
  }

  // Mock content-based recommendations
  return [
    { productId: "prod_similar_1", score: 0.90, reason: "similar_category" },
    { productId: "prod_similar_2", score: 0.82, reason: "similar_category" },
  ];
}

/**
 * User purchase history recommendations
 */
async function getUserHistoryRecommendations(
  userId: number,
  limit: number
): Promise<RecommendationResult[]> {
  // Mock personalized recommendations based on user history
  return [
    { productId: "prod_personal_1", score: 0.88, reason: "personalized" },
    { productId: "prod_personal_2", score: 0.81, reason: "personalized" },
  ];
}

/**
 * Trending products recommendations
 */
async function getTrendingRecommendations(limit: number): Promise<RecommendationResult[]> {
  const db = getDbSync();

  // Get top selling products in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Mock trending recommendations
  return [
    { productId: "prod_trending_1", score: 0.75, reason: "trending" },
    { productId: "prod_trending_2", score: 0.70, reason: "trending" },
    { productId: "prod_trending_3", score: 0.68, reason: "trending" },
  ];
}

/**
 * Deduplicate recommendations and combine scores
 */
function deduplicateRecommendations(
  recommendations: RecommendationResult[]
): RecommendationResult[] {
  const scoreMap = new Map<string, { score: number; reason: RecommendationResult["reason"] }>();

  for (const rec of recommendations) {
    const existing = scoreMap.get(rec.productId);
    if (existing) {
      // Combine scores (weighted average)
      scoreMap.set(rec.productId, {
        score: (existing.score + rec.score) / 2,
        reason: existing.reason, // Keep first reason
      });
    } else {
      scoreMap.set(rec.productId, { score: rec.score, reason: rec.reason });
    }
  }

  return Array.from(scoreMap.entries())
    .map(([productId, { score, reason }]) => ({ productId, score, reason }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Get "frequently bought together" recommendations
 */
export async function getFrequentlyBoughtTogether(
  productId: string,
  limit: number = 5
): Promise<string[]> {
  const db = getDbSync();

  // Find products that were purchased in the same orders
  // Mock data for now
  return ["prod_bundle_1", "prod_bundle_2", "prod_bundle_3"];
}

/**
 * Get "customers also viewed" recommendations
 */
export async function getCustomersAlsoViewed(
  productId: string,
  limit: number = 10
): Promise<string[]> {
  // Mock data - would track view sessions in production
  return ["prod_viewed_1", "prod_viewed_2", "prod_viewed_3"];
}

/**
 * Track product view for recommendations
 */
export async function trackProductView(params: {
  userId?: number;
  productId: string;
  sessionId: string;
}): Promise<void> {
  // TODO: Store view event for recommendation engine
  console.log("Product view tracked:", params);
}

/**
 * Get category-based recommendations
 */
export async function getCategoryRecommendations(
  categoryId: string,
  limit: number = 10
): Promise<string[]> {
  const db = getDbSync();

  // Get top products in category
  // Mock data for now
  return ["prod_cat_1", "prod_cat_2", "prod_cat_3"];
}

/**
 * Get new arrivals recommendations
 */
export async function getNewArrivals(limit: number = 10): Promise<string[]> {
  const db = getDbSync();

  const newProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.status, "active"))
    .orderBy(desc(products.createdAt))
    .limit(limit);

  return newProducts.map(p => p.id);
}

/**
 * Get best sellers recommendations
 */
export async function getBestSellers(limit: number = 10): Promise<string[]> {
  // Mock data - would aggregate order data in production
  return ["prod_best_1", "prod_best_2", "prod_best_3"];
}
