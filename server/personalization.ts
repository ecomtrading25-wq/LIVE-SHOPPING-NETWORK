/**
 * Personalization Engine
 * Tracks customer behavior and provides personalized product recommendations
 */

import { getDb } from "./db"
const db = await getDb();
import {
  orders,
  orderItems,
  products,
  users,
  liveSessions,
  pinnedProducts,
} from "../drizzle/schema";
import { eq, sql, and, desc, inArray, not } from "drizzle-orm";

interface ProductRecommendation {
  productId: string;
  productName: string;
  score: number;
  reason: string;
}

interface CustomerProfile {
  userId: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  favoriteCategories: string[];
  lastPurchaseDate: Date | null;
  lifetimeValue: number;
  churnRisk: number;
  preferredPriceRange: { min: number; max: number };
}

/**
 * Get customer profile with behavioral insights
 */
export async function getCustomerProfile(
  userId: string
): Promise<CustomerProfile | null> {
  const customerOrders = await db
    .select({
      totalOrders: sql<number>`COUNT(${orders.id})`.as("totalOrders"),
      totalSpent: sql<number>`SUM(${orders.totalAmount})`.as("totalSpent"),
      lastPurchaseDate: sql<Date>`MAX(${orders.createdAt})`.as(
        "lastPurchaseDate"
      ),
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .groupBy(orders.userId);

  if (customerOrders.length === 0) return null;

  const profile = customerOrders[0];
  const totalOrders = Number(profile.totalOrders) || 0;
  const totalSpent = Number(profile.totalSpent) || 0;
  const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  // Calculate churn risk (days since last purchase)
  const daysSinceLastPurchase = profile.lastPurchaseDate
    ? Math.floor(
        (Date.now() - new Date(profile.lastPurchaseDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 999;

  let churnRisk = 0;
  if (daysSinceLastPurchase > 90) churnRisk = 0.8;
  else if (daysSinceLastPurchase > 60) churnRisk = 0.5;
  else if (daysSinceLastPurchase > 30) churnRisk = 0.2;

  // Get favorite categories (placeholder - would need category tracking)
  const favoriteCategories = ["Electronics", "Fashion"];

  // Get preferred price range
  const priceData = await db
    .select({
      minPrice: sql<number>`MIN(${orderItems.price})`.as("minPrice"),
      maxPrice: sql<number>`MAX(${orderItems.price})`.as("maxPrice"),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(eq(orders.userId, userId));

  const preferredPriceRange = {
    min: Number(priceData[0]?.minPrice) || 0,
    max: Number(priceData[0]?.maxPrice) || 100,
  };

  return {
    userId,
    totalOrders,
    totalSpent,
    averageOrderValue,
    favoriteCategories,
    lastPurchaseDate: profile.lastPurchaseDate,
    lifetimeValue: totalSpent,
    churnRisk,
    preferredPriceRange,
  };
}

/**
 * Get personalized product recommendations
 */
export async function getPersonalizedRecommendations(
  userId: string,
  limit: number = 10
): Promise<ProductRecommendation[]> {
  const recommendations: ProductRecommendation[] = [];

  // 1. Collaborative Filtering - Products bought by similar customers
  const similarCustomerProducts = await db
    .select({
      productId: orderItems.productId,
      productName: products.name,
      frequency: sql<number>`COUNT(*)`.as("frequency"),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(
      and(
        sql`${orders.userId} IN (
          SELECT DISTINCT o2.user_id
          FROM orders o1
          JOIN orders o2 ON o1.user_id != o2.user_id
          WHERE o1.user_id = ${userId}
          AND EXISTS (
            SELECT 1 FROM order_items oi1
            JOIN order_items oi2 ON oi1.product_id = oi2.product_id
            WHERE oi1.order_id = o1.id AND oi2.order_id = o2.id
          )
          LIMIT 50
        )`,
        not(
          sql`${orderItems.productId} IN (
          SELECT product_id FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE o.user_id = ${userId}
        )`
        )
      )
    )
    .groupBy(orderItems.productId, products.name)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(5);

  similarCustomerProducts.forEach((item) => {
    recommendations.push({
      productId: item.productId,
      productName: item.productName,
      score: Number(item.frequency) * 10,
      reason: "Customers like you also bought this",
    });
  });

  // 2. Trending products from live sessions
  const trendingLiveProducts = await db
    .select({
      productId: pinnedProducts.productId,
      productName: products.name,
      pinCount: sql<number>`COUNT(*)`.as("pinCount"),
    })
    .from(pinnedProducts)
    .innerJoin(products, eq(pinnedProducts.productId, products.id))
    .innerJoin(liveSessions, eq(pinnedProducts.sessionId, liveSessions.id))
    .where(sql`${liveSessions.endTime} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`)
    .groupBy(pinnedProducts.productId, products.name)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(3);

  trendingLiveProducts.forEach((item) => {
    recommendations.push({
      productId: item.productId,
      productName: item.productName,
      score: Number(item.pinCount) * 15,
      reason: "Trending in live shows",
    });
  });

  // 3. Best sellers
  const bestSellers = await db
    .select({
      productId: orderItems.productId,
      productName: products.name,
      totalSold: sql<number>`SUM(${orderItems.quantity})`.as("totalSold"),
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        sql`${orders.createdAt} >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        not(
          sql`${orderItems.productId} IN (
          SELECT product_id FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          WHERE o.user_id = ${userId}
        )`
        )
      )
    )
    .groupBy(orderItems.productId, products.name)
    .orderBy(desc(sql`SUM(${orderItems.quantity})`))
    .limit(3);

  bestSellers.forEach((item) => {
    recommendations.push({
      productId: item.productId,
      productName: item.productName,
      score: Number(item.totalSold) * 5,
      reason: "Best seller this month",
    });
  });

  // Sort by score and return top N
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get "Frequently Bought Together" recommendations
 */
export async function getFrequentlyBoughtTogether(
  productId: string,
  limit: number = 5
): Promise<ProductRecommendation[]> {
  const relatedProducts = await db
    .select({
      productId: orderItems.productId,
      productName: products.name,
      frequency: sql<number>`COUNT(*)`.as("frequency"),
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(
      and(
        sql`${orderItems.orderId} IN (
          SELECT order_id FROM order_items
          WHERE product_id = ${productId}
        )`,
        sql`${orderItems.productId} != ${productId}`
      )
    )
    .groupBy(orderItems.productId, products.name)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(limit);

  return relatedProducts.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    score: Number(item.frequency),
    reason: "Frequently bought together",
  }));
}

/**
 * Get personalized email campaign content
 */
export async function getPersonalizedEmailContent(
  userId: string
): Promise<{
  subject: string;
  recommendations: ProductRecommendation[];
  specialOffer?: string;
}> {
  const profile = await getCustomerProfile(userId);
  const recommendations = await getPersonalizedRecommendations(userId, 5);

  let subject = "Discover Products You'll Love";
  let specialOffer: string | undefined;

  if (profile) {
    // High churn risk - send win-back offer
    if (profile.churnRisk > 0.5) {
      subject = "We Miss You! Here's 20% Off Your Next Order";
      specialOffer = "Use code COMEBACK20 for 20% off";
    }
    // High value customer - VIP treatment
    else if (profile.lifetimeValue > 1000) {
      subject = "Exclusive VIP Picks Just for You";
      specialOffer = "Free shipping on all orders this week";
    }
    // New customer - welcome series
    else if (profile.totalOrders <= 1) {
      subject = "Welcome! Here's What's Trending";
      specialOffer = "Get 10% off your first order with code WELCOME10";
    }
  }

  return {
    subject,
    recommendations,
    specialOffer,
  };
}

/**
 * Track product view event (for future ML model training)
 */
export async function trackProductView(
  userId: string | null,
  productId: string,
  sessionId: string
): Promise<void> {
  // In production, this would log to an analytics system
  console.log("[Personalization] Product view:", {
    userId,
    productId,
    sessionId,
    timestamp: new Date(),
  });
}

/**
 * Track add-to-cart event
 */
export async function trackAddToCart(
  userId: string | null,
  productId: string,
  quantity: number
): Promise<void> {
  console.log("[Personalization] Add to cart:", {
    userId,
    productId,
    quantity,
    timestamp: new Date(),
  });
}

/**
 * Get dynamic pricing recommendations
 */
export async function getDynamicPricingRecommendation(
  productId: string
): Promise<{
  currentPrice: number;
  suggestedPrice: number;
  reason: string;
  expectedImpact: string;
}> {
  // Get product current price
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) {
    throw new Error("Product not found");
  }

  const currentPrice = Number(product.price);

  // Get sales velocity
  const salesData = await db
    .select({
      totalSold: sql<number>`SUM(${orderItems.quantity})`.as("totalSold"),
      avgPrice: sql<number>`AVG(${orderItems.price})`.as("avgPrice"),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orderItems.productId, productId),
        sql`${orders.createdAt} >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
      )
    );

  const totalSold = Number(salesData[0]?.totalSold) || 0;

  let suggestedPrice = currentPrice;
  let reason = "Current price is optimal";
  let expectedImpact = "No change expected";

  // Low sales - suggest price reduction
  if (totalSold < 10) {
    suggestedPrice = currentPrice * 0.9; // 10% discount
    reason = "Low sales velocity detected";
    expectedImpact = "+30% sales volume expected";
  }
  // High sales - can increase price
  else if (totalSold > 100) {
    suggestedPrice = currentPrice * 1.1; // 10% increase
    reason = "High demand detected";
    expectedImpact = "Maintain volume while increasing revenue";
  }

  return {
    currentPrice,
    suggestedPrice: Math.round(suggestedPrice * 100) / 100,
    reason,
    expectedImpact,
  };
}
