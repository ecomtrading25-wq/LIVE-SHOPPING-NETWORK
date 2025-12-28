/**
 * Flash Sales Engine
 * Time-limited sales with countdown timers and inventory limits
 */

import { getDb } from "./db"
const db = await getDb();
import { sql } from "drizzle-orm";

export interface FlashSale {
  id: string;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  status: "scheduled" | "active" | "ended" | "cancelled";
  products: FlashSaleProduct[];
  maxQuantityPerCustomer?: number;
  requiresAuth: boolean;
  createdAt: Date;
}

export interface FlashSaleProduct {
  productId: string;
  productName: string;
  originalPrice: number;
  flashPrice: number;
  discountPercent: number;
  totalStock: number;
  soldCount: number;
  maxPerCustomer: number;
}

export interface FlashSalePurchase {
  id: string;
  flashSaleId: string;
  productId: string;
  userId: string;
  quantity: number;
  price: number;
  purchasedAt: Date;
}

/**
 * Create a new flash sale
 */
export async function createFlashSale(params: {
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  products: Array<{
    productId: string;
    productName: string;
    originalPrice: number;
    flashPrice: number;
    totalStock: number;
    maxPerCustomer?: number;
  }>;
  maxQuantityPerCustomer?: number;
  requiresAuth?: boolean;
}): Promise<FlashSale> {
  const flashSale: FlashSale = {
    id: `fs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: params.name,
    description: params.description,
    startTime: params.startTime,
    endTime: params.endTime,
    status: new Date() < params.startTime ? "scheduled" : "active",
    products: params.products.map((p) => ({
      ...p,
      discountPercent: Math.round(
        ((p.originalPrice - p.flashPrice) / p.originalPrice) * 100
      ),
      soldCount: 0,
      maxPerCustomer: p.maxPerCustomer || params.maxQuantityPerCustomer || 5,
    })),
    maxQuantityPerCustomer: params.maxQuantityPerCustomer,
    requiresAuth: params.requiresAuth || false,
    createdAt: new Date(),
  };

  // In production, save to database
  console.log("[Flash Sales] Created:", flashSale);

  return flashSale;
}

/**
 * Get active flash sales
 */
export async function getActiveFlashSales(): Promise<FlashSale[]> {
  const now = new Date();

  // In production, query from database
  // Mock data
  return [
    {
      id: "fs_001",
      name: "Black Friday Blitz",
      description: "Massive discounts on top products - Limited time only!",
      startTime: new Date(now.getTime() - 1000 * 60 * 60), // Started 1 hour ago
      endTime: new Date(now.getTime() + 1000 * 60 * 60 * 2), // Ends in 2 hours
      status: "active",
      products: [
        {
          productId: "1",
          productName: "Wireless Headphones Pro",
          originalPrice: 79.99,
          flashPrice: 49.99,
          discountPercent: 38,
          totalStock: 100,
          soldCount: 67,
          maxPerCustomer: 2,
        },
        {
          productId: "2",
          productName: "Smart Watch Ultra",
          originalPrice: 199.99,
          flashPrice: 149.99,
          discountPercent: 25,
          totalStock: 50,
          soldCount: 38,
          maxPerCustomer: 1,
        },
      ],
      maxQuantityPerCustomer: 5,
      requiresAuth: true,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
    },
  ];
}

/**
 * Get flash sale by ID
 */
export async function getFlashSaleById(id: string): Promise<FlashSale | null> {
  // In production, query from database
  const activeSales = await getActiveFlashSales();
  return activeSales.find((sale) => sale.id === id) || null;
}

/**
 * Check if user can purchase from flash sale
 */
export async function canUserPurchase(params: {
  flashSaleId: string;
  productId: string;
  userId: string;
  quantity: number;
}): Promise<{
  canPurchase: boolean;
  reason?: string;
  availableQuantity?: number;
}> {
  const flashSale = await getFlashSaleById(params.flashSaleId);

  if (!flashSale) {
    return {
      canPurchase: false,
      reason: "Flash sale not found",
    };
  }

  if (flashSale.status !== "active") {
    return {
      canPurchase: false,
      reason: `Flash sale is ${flashSale.status}`,
    };
  }

  const now = new Date();
  if (now < flashSale.startTime) {
    return {
      canPurchase: false,
      reason: "Flash sale has not started yet",
    };
  }

  if (now > flashSale.endTime) {
    return {
      canPurchase: false,
      reason: "Flash sale has ended",
    };
  }

  const product = flashSale.products.find((p) => p.productId === params.productId);
  if (!product) {
    return {
      canPurchase: false,
      reason: "Product not in flash sale",
    };
  }

  const availableStock = product.totalStock - product.soldCount;
  if (availableStock <= 0) {
    return {
      canPurchase: false,
      reason: "Product sold out",
      availableQuantity: 0,
    };
  }

  if (params.quantity > availableStock) {
    return {
      canPurchase: false,
      reason: `Only ${availableStock} items available`,
      availableQuantity: availableStock,
    };
  }

  // Check user purchase history
  const userPurchases = await getUserFlashSalePurchases(
    params.flashSaleId,
    params.productId,
    params.userId
  );

  const totalPurchased = userPurchases.reduce((sum, p) => sum + p.quantity, 0);
  const remainingAllowed = product.maxPerCustomer - totalPurchased;

  if (remainingAllowed <= 0) {
    return {
      canPurchase: false,
      reason: `You have reached the maximum purchase limit (${product.maxPerCustomer})`,
      availableQuantity: 0,
    };
  }

  if (params.quantity > remainingAllowed) {
    return {
      canPurchase: false,
      reason: `You can only purchase ${remainingAllowed} more`,
      availableQuantity: remainingAllowed,
    };
  }

  return {
    canPurchase: true,
  };
}

/**
 * Purchase from flash sale
 */
export async function purchaseFlashSale(params: {
  flashSaleId: string;
  productId: string;
  userId: string;
  quantity: number;
}): Promise<{
  success: boolean;
  purchase?: FlashSalePurchase;
  error?: string;
}> {
  const canPurchase = await canUserPurchase(params);

  if (!canPurchase.canPurchase) {
    return {
      success: false,
      error: canPurchase.reason,
    };
  }

  const flashSale = await getFlashSaleById(params.flashSaleId);
  if (!flashSale) {
    return {
      success: false,
      error: "Flash sale not found",
    };
  }

  const product = flashSale.products.find((p) => p.productId === params.productId);
  if (!product) {
    return {
      success: false,
      error: "Product not found",
    };
  }

  // Create purchase record
  const purchase: FlashSalePurchase = {
    id: `fsp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    flashSaleId: params.flashSaleId,
    productId: params.productId,
    userId: params.userId,
    quantity: params.quantity,
    price: product.flashPrice * params.quantity,
    purchasedAt: new Date(),
  };

  // Update sold count
  product.soldCount += params.quantity;

  // In production, save to database with transaction
  console.log("[Flash Sales] Purchase:", purchase);

  return {
    success: true,
    purchase,
  };
}

/**
 * Get user's flash sale purchase history
 */
export async function getUserFlashSalePurchases(
  flashSaleId: string,
  productId: string,
  userId: string
): Promise<FlashSalePurchase[]> {
  // In production, query from database
  return [];
}

/**
 * Get flash sale statistics
 */
export async function getFlashSaleStats(flashSaleId: string): Promise<{
  totalRevenue: number;
  totalOrders: number;
  totalItemsSold: number;
  conversionRate: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    soldCount: number;
    revenue: number;
  }>;
}> {
  const flashSale = await getFlashSaleById(flashSaleId);

  if (!flashSale) {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalItemsSold: 0,
      conversionRate: 0,
      topProducts: [],
    };
  }

  const totalItemsSold = flashSale.products.reduce((sum, p) => sum + p.soldCount, 0);
  const totalRevenue = flashSale.products.reduce(
    (sum, p) => sum + p.soldCount * p.flashPrice,
    0
  );

  const topProducts = flashSale.products
    .map((p) => ({
      productId: p.productId,
      productName: p.productName,
      soldCount: p.soldCount,
      revenue: p.soldCount * p.flashPrice,
    }))
    .sort((a, b) => b.soldCount - a.soldCount);

  return {
    totalRevenue,
    totalOrders: totalItemsSold, // Simplified - in production, count unique orders
    totalItemsSold,
    conversionRate: 0, // Would calculate from views/purchases
    topProducts,
  };
}

/**
 * Schedule flash sale start/end notifications
 */
export async function scheduleFlashSaleNotifications(flashSaleId: string): Promise<void> {
  const flashSale = await getFlashSaleById(flashSaleId);
  if (!flashSale) return;

  // Schedule notifications:
  // - 1 hour before start
  // - At start
  // - 1 hour before end
  // - At end

  console.log("[Flash Sales] Notifications scheduled for:", flashSaleId);
}

/**
 * Auto-update flash sale status
 */
export async function updateFlashSaleStatus(flashSaleId: string): Promise<void> {
  const flashSale = await getFlashSaleById(flashSaleId);
  if (!flashSale) return;

  const now = new Date();

  if (flashSale.status === "scheduled" && now >= flashSale.startTime) {
    flashSale.status = "active";
    console.log("[Flash Sales] Started:", flashSaleId);
  }

  if (flashSale.status === "active" && now >= flashSale.endTime) {
    flashSale.status = "ended";
    console.log("[Flash Sales] Ended:", flashSaleId);
  }

  // Check if all products sold out
  const allSoldOut = flashSale.products.every((p) => p.soldCount >= p.totalStock);
  if (allSoldOut && flashSale.status === "active") {
    flashSale.status = "ended";
    console.log("[Flash Sales] Sold out:", flashSaleId);
  }

  // In production, update database
}

/**
 * Get time remaining for flash sale
 */
export function getTimeRemaining(endTime: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const total = endTime.getTime() - new Date().getTime();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
  };
}
