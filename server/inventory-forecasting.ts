/**
 * Inventory Forecasting System
 * Predicts future demand and suggests reorder quantities using sales velocity analysis
 */

import { db } from "./db";
import { orders, orderItems, inventory, products } from "../drizzle/schema";
import { eq, gte, sql, and, desc } from "drizzle-orm";

interface ForecastResult {
  productId: string;
  productName: string;
  currentStock: number;
  dailyVelocity: number;
  weeklyVelocity: number;
  monthlyVelocity: number;
  daysUntilStockout: number;
  suggestedReorderQuantity: number;
  suggestedReorderDate: Date;
  confidence: number;
  trend: "increasing" | "stable" | "decreasing";
}

interface SalesData {
  date: string;
  quantity: number;
}

/**
 * Calculate sales velocity for a product
 */
export async function calculateSalesVelocity(
  productId: string,
  days: number = 30
): Promise<{
  daily: number;
  weekly: number;
  monthly: number;
  trend: "increasing" | "stable" | "decreasing";
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get sales data for the period
  const salesData = await db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`.as("date"),
      quantity: sql<number>`SUM(${orderItems.quantity})`.as("quantity"),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orderItems.productId, productId),
        gte(orders.createdAt, startDate),
        eq(orders.status, "delivered")
      )
    )
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);

  if (salesData.length === 0) {
    return { daily: 0, weekly: 0, monthly: 0, trend: "stable" };
  }

  // Calculate total quantity sold
  const totalQuantity = salesData.reduce(
    (sum, day) => sum + Number(day.quantity),
    0
  );

  // Calculate velocities
  const daily = totalQuantity / days;
  const weekly = daily * 7;
  const monthly = daily * 30;

  // Calculate trend (compare first half vs second half)
  const midpoint = Math.floor(salesData.length / 2);
  const firstHalf = salesData
    .slice(0, midpoint)
    .reduce((sum, day) => sum + Number(day.quantity), 0);
  const secondHalf = salesData
    .slice(midpoint)
    .reduce((sum, day) => sum + Number(day.quantity), 0);

  let trend: "increasing" | "stable" | "decreasing" = "stable";
  const changePercent = ((secondHalf - firstHalf) / (firstHalf || 1)) * 100;

  if (changePercent > 20) trend = "increasing";
  else if (changePercent < -20) trend = "decreasing";

  return { daily, weekly, monthly, trend };
}

/**
 * Forecast inventory for a single product
 */
export async function forecastProduct(
  productId: string
): Promise<ForecastResult | null> {
  // Get product and current inventory
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) return null;

  const [inventoryRecord] = await db
    .select()
    .from(inventory)
    .where(eq(inventory.productId, productId))
    .limit(1);

  const currentStock = inventoryRecord?.quantityAvailable || 0;

  // Calculate sales velocity
  const velocity = await calculateSalesVelocity(productId, 30);

  // Calculate days until stockout
  const daysUntilStockout =
    velocity.daily > 0 ? Math.floor(currentStock / velocity.daily) : 999;

  // Calculate suggested reorder quantity
  // Formula: (Lead time + Safety stock days) * Daily velocity
  const leadTimeDays = 14; // Assume 2 weeks lead time
  const safetyStockDays = 7; // 1 week safety stock
  const suggestedReorderQuantity = Math.ceil(
    (leadTimeDays + safetyStockDays) * velocity.daily
  );

  // Calculate suggested reorder date
  // Reorder when stock will last only (lead time + safety stock) days
  const reorderThresholdDays = leadTimeDays + safetyStockDays;
  const daysUntilReorder = Math.max(
    0,
    daysUntilStockout - reorderThresholdDays
  );
  const suggestedReorderDate = new Date();
  suggestedReorderDate.setDate(
    suggestedReorderDate.getDate() + daysUntilReorder
  );

  // Calculate confidence based on data availability
  // More sales data = higher confidence
  const confidence = Math.min(100, (velocity.monthly / 10) * 100);

  return {
    productId,
    productName: product.name,
    currentStock,
    dailyVelocity: velocity.daily,
    weeklyVelocity: velocity.weekly,
    monthlyVelocity: velocity.monthly,
    daysUntilStockout,
    suggestedReorderQuantity,
    suggestedReorderDate,
    confidence,
    trend: velocity.trend,
  };
}

/**
 * Generate forecast for all products
 */
export async function forecastAllProducts(): Promise<ForecastResult[]> {
  const allProducts = await db.select({ id: products.id }).from(products);

  const forecasts: ForecastResult[] = [];

  for (const product of allProducts) {
    const forecast = await forecastProduct(product.id);
    if (forecast) {
      forecasts.push(forecast);
    }
  }

  return forecasts;
}

/**
 * Get products that need reordering soon
 */
export async function getReorderAlerts(
  daysThreshold: number = 14
): Promise<ForecastResult[]> {
  const forecasts = await forecastAllProducts();

  return forecasts
    .filter((f) => f.daysUntilStockout <= daysThreshold && f.dailyVelocity > 0)
    .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
}

/**
 * Get trending products (increasing sales velocity)
 */
export async function getTrendingProducts(): Promise<ForecastResult[]> {
  const forecasts = await forecastAllProducts();

  return forecasts
    .filter((f) => f.trend === "increasing" && f.monthlyVelocity > 10)
    .sort((a, b) => b.monthlyVelocity - a.monthlyVelocity)
    .slice(0, 20);
}

/**
 * Get slow-moving products (decreasing sales velocity)
 */
export async function getSlowMovingProducts(): Promise<ForecastResult[]> {
  const forecasts = await forecastAllProducts();

  return forecasts
    .filter((f) => f.trend === "decreasing" || f.monthlyVelocity < 5)
    .sort((a, b) => a.monthlyVelocity - b.monthlyVelocity)
    .slice(0, 20);
}

/**
 * Calculate optimal safety stock level
 */
export function calculateSafetyStock(
  dailyVelocity: number,
  leadTimeDays: number,
  serviceLevel: number = 0.95 // 95% service level
): number {
  // Simplified safety stock calculation
  // Safety Stock = Z-score * sqrt(lead time) * daily velocity
  // Z-score for 95% service level ≈ 1.65

  const zScore = serviceLevel === 0.95 ? 1.65 : 1.96; // 95% or 99%
  const safetyStock = zScore * Math.sqrt(leadTimeDays) * dailyVelocity;

  return Math.ceil(safetyStock);
}

/**
 * Calculate Economic Order Quantity (EOQ)
 */
export function calculateEOQ(
  annualDemand: number,
  orderCost: number,
  holdingCostPerUnit: number
): number {
  // EOQ = sqrt((2 * D * S) / H)
  // D = Annual demand
  // S = Order cost per order
  // H = Holding cost per unit per year

  const eoq = Math.sqrt((2 * annualDemand * orderCost) / holdingCostPerUnit);

  return Math.ceil(eoq);
}

/**
 * Generate comprehensive inventory report
 */
export async function generateInventoryReport(): Promise<{
  totalProducts: number;
  lowStockCount: number;
  overstockCount: number;
  trendingCount: number;
  slowMovingCount: number;
  averageDaysUntilStockout: number;
  totalReorderValue: number;
  forecasts: ForecastResult[];
}> {
  const forecasts = await forecastAllProducts();

  const lowStockCount = forecasts.filter((f) => f.daysUntilStockout <= 14).length;
  const overstockCount = forecasts.filter((f) => f.daysUntilStockout > 90).length;
  const trendingCount = forecasts.filter((f) => f.trend === "increasing").length;
  const slowMovingCount = forecasts.filter(
    (f) => f.trend === "decreasing" || f.monthlyVelocity < 5
  ).length;

  const averageDaysUntilStockout =
    forecasts.reduce((sum, f) => sum + f.daysUntilStockout, 0) /
    forecasts.length;

  // Calculate total reorder value (assuming $10 average cost per unit)
  const totalReorderValue = forecasts
    .filter((f) => f.daysUntilStockout <= 14)
    .reduce((sum, f) => sum + f.suggestedReorderQuantity * 10, 0);

  return {
    totalProducts: forecasts.length,
    lowStockCount,
    overstockCount,
    trendingCount,
    slowMovingCount,
    averageDaysUntilStockout: Math.round(averageDaysUntilStockout),
    totalReorderValue,
    forecasts,
  };
}
