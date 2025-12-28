/**
 * Pricing & Promotions Engine
 * Handles price books, versioned pricing, promotions, bundles, and margin guardrails
 */

import { getDbSync } from './db';
const db = getDbSync();
import {
  priceBooks,
  priceBookEntries,
  promotions,
  promotionRules,
  bundles,
  // bundleItems, // TODO: Add to schema
  products
} from '../drizzle/schema';
import { eq, and, desc, gte, lte, isNull, sql } from 'drizzle-orm';

export type PromotionType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BOGO' | 'BUNDLE' | 'FREE_SHIPPING';
export type PromotionStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'PAUSED';
export type PriceBookStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface PriceBook {
  priceBookId: string;
  channelId: string;
  name: string;
  description?: string;
  version: number;
  status: PriceBookStatus;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isDefault: boolean;
}

export interface PriceBookEntry {
  entryId: string;
  priceBookId: string;
  productId: string;
  sku: string;
  basePriceCents: number;
  salePriceCents?: number;
  minPriceCents: number; // Margin guardrail
  costCents: number;
  currency: string;
}

export interface Promotion {
  promotionId: string;
  channelId: string;
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  discountValue: number; // Percentage (e.g., 20 for 20%) or cents
  status: PromotionStatus;
  startDate: Date;
  endDate: Date;
  usageLimit?: number;
  usageCount: number;
  minPurchaseCents?: number;
  maxDiscountCents?: number;
}

export interface Bundle {
  bundleId: string;
  channelId: string;
  name: string;
  description?: string;
  bundlePriceCents: number;
  savingsCents: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Create price book
 */
export async function createPriceBook(
  channelId: string,
  name: string,
  effectiveFrom: Date,
  description?: string,
  effectiveTo?: Date
): Promise<PriceBook> {
  // Get next version number
  const latestPriceBook = await db.query.priceBooks.findFirst({
    where: eq(priceBooks.channelId, channelId),
    orderBy: desc(priceBooks.version)
  });

  const version = (latestPriceBook?.version || 0) + 1;

  const [priceBook] = await db.insert(priceBooks).values({
    channelId,
    name,
    description: description || null,
    version,
    status: 'DRAFT',
    effectiveFrom,
    effectiveTo: effectiveTo || null,
    isDefault: false
  }).returning();

  return priceBook as PriceBook;
}

/**
 * Add entry to price book
 */
export async function addPriceBookEntry(
  priceBookId: string,
  productId: string,
  sku: string,
  basePriceCents: number,
  costCents: number,
  currency: string = 'AUD',
  salePriceCents?: number,
  minMarginPercent: number = 20 // Default 20% minimum margin
): Promise<PriceBookEntry> {
  // Calculate minimum price based on cost and margin
  const minPriceCents = Math.ceil(costCents * (1 + minMarginPercent / 100));

  // Validate base price meets minimum
  if (basePriceCents < minPriceCents) {
    throw new Error(`Base price ${basePriceCents} is below minimum ${minPriceCents} (${minMarginPercent}% margin)`);
  }

  // Validate sale price if provided
  if (salePriceCents && salePriceCents < minPriceCents) {
    throw new Error(`Sale price ${salePriceCents} is below minimum ${minPriceCents} (${minMarginPercent}% margin)`);
  }

  const [entry] = await db.insert(priceBookEntries).values({
    priceBookId,
    productId,
    sku,
    basePriceCents,
    salePriceCents: salePriceCents || null,
    minPriceCents,
    costCents,
    currency
  }).returning();

  return entry as PriceBookEntry;
}

/**
 * Activate price book
 */
export async function activatePriceBook(
  channelId: string,
  priceBookId: string
): Promise<void> {
  const priceBook = await db.query.priceBooks.findFirst({
    where: and(
      eq(priceBooks.priceBookId, priceBookId),
      eq(priceBooks.channelId, channelId)
    )
  });

  if (!priceBook) {
    throw new Error('Price book not found');
  }

  if (priceBook.status !== 'DRAFT') {
    throw new Error('Can only activate draft price books');
  }

  // Deactivate current default if setting as default
  if (priceBook.isDefault) {
    await db.update(priceBooks)
      .set({ isDefault: false })
      .where(and(
        eq(priceBooks.channelId, channelId),
        eq(priceBooks.isDefault, true)
      ));
  }

  // Activate price book
  await db.update(priceBooks)
    .set({
      status: 'ACTIVE',
      updatedAt: new Date()
    })
    .where(eq(priceBooks.priceBookId, priceBookId));

  // Update product prices from price book
  const entries = await db.query.priceBookEntries.findMany({
    where: eq(priceBookEntries.priceBookId, priceBookId)
  });

  for (const entry of entries) {
    await db.update(products)
      .set({
        priceCents: entry.salePriceCents || entry.basePriceCents,
        originalPriceCents: entry.basePriceCents,
        updatedAt: new Date()
      })
      .where(eq(products.productId, entry.productId));
  }
}

/**
 * Get active price for product
 */
export async function getProductPrice(
  channelId: string,
  productId: string
): Promise<{
  basePriceCents: number;
  salePriceCents?: number;
  finalPriceCents: number;
  minPriceCents: number;
  currency: string;
}> {
  // Get active price book
  const activePriceBook = await db.query.priceBooks.findFirst({
    where: and(
      eq(priceBooks.channelId, channelId),
      eq(priceBooks.status, 'ACTIVE'),
      lte(priceBooks.effectiveFrom, new Date()),
      sql`(${priceBooks.effectiveTo} IS NULL OR ${priceBooks.effectiveTo} >= NOW())`
    ),
    orderBy: desc(priceBooks.version)
  });

  if (!activePriceBook) {
    // Fallback to product's own price
    const product = await db.query.products.findFirst({
      where: eq(products.productId, productId)
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return {
      basePriceCents: product.priceCents,
      finalPriceCents: product.priceCents,
      minPriceCents: product.priceCents,
      currency: product.currency || 'AUD'
    };
  }

  // Get price book entry
  const entry = await db.query.priceBookEntries.findFirst({
    where: and(
      eq(priceBookEntries.priceBookId, activePriceBook.priceBookId),
      eq(priceBookEntries.productId, productId)
    )
  });

  if (!entry) {
    throw new Error('Product not found in active price book');
  }

  return {
    basePriceCents: entry.basePriceCents,
    salePriceCents: entry.salePriceCents || undefined,
    finalPriceCents: entry.salePriceCents || entry.basePriceCents,
    minPriceCents: entry.minPriceCents,
    currency: entry.currency
  };
}

/**
 * Create promotion
 */
export async function createPromotion(
  channelId: string,
  code: string,
  name: string,
  type: PromotionType,
  discountValue: number,
  startDate: Date,
  endDate: Date,
  options?: {
    description?: string;
    usageLimit?: number;
    minPurchaseCents?: number;
    maxDiscountCents?: number;
  }
): Promise<Promotion> {
  // Check if code already exists
  const existing = await db.query.promotions.findFirst({
    where: and(
      eq(promotions.channelId, channelId),
      eq(promotions.code, code.toUpperCase())
    )
  });

  if (existing) {
    throw new Error('Promotion code already exists');
  }

  const [promotion] = await db.insert(promotions).values({
    channelId,
    code: code.toUpperCase(),
    name,
    description: options?.description || null,
    type,
    discountValue,
    status: 'DRAFT',
    startDate,
    endDate,
    usageLimit: options?.usageLimit || null,
    usageCount: 0,
    minPurchaseCents: options?.minPurchaseCents || null,
    maxDiscountCents: options?.maxDiscountCents || null
  }).returning();

  return promotion as Promotion;
}

/**
 * Activate promotion
 */
export async function activatePromotion(
  channelId: string,
  promotionId: string
): Promise<void> {
  const promotion = await db.query.promotions.findFirst({
    where: and(
      eq(promotions.promotionId, promotionId),
      eq(promotions.channelId, channelId)
    )
  });

  if (!promotion) {
    throw new Error('Promotion not found');
  }

  const now = new Date();
  const status = now >= promotion.startDate && now <= promotion.endDate
    ? 'ACTIVE'
    : 'SCHEDULED';

  await db.update(promotions)
    .set({
      status,
      updatedAt: new Date()
    })
    .where(eq(promotions.promotionId, promotionId));
}

/**
 * Apply promotion to cart
 */
export async function applyPromotion(
  channelId: string,
  promotionCode: string,
  cartTotalCents: number,
  cartItems: Array<{ productId: string; quantity: number; priceCents: number }>
): Promise<{
  valid: boolean;
  discountCents: number;
  message?: string;
}> {
  const promotion = await db.query.promotions.findFirst({
    where: and(
      eq(promotions.channelId, channelId),
      eq(promotions.code, promotionCode.toUpperCase()),
      eq(promotions.status, 'ACTIVE')
    )
  });

  if (!promotion) {
    return { valid: false, discountCents: 0, message: 'Invalid promotion code' };
  }

  const now = new Date();
  if (now < promotion.startDate || now > promotion.endDate) {
    return { valid: false, discountCents: 0, message: 'Promotion has expired' };
  }

  if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
    return { valid: false, discountCents: 0, message: 'Promotion usage limit reached' };
  }

  if (promotion.minPurchaseCents && cartTotalCents < promotion.minPurchaseCents) {
    return {
      valid: false,
      discountCents: 0,
      message: `Minimum purchase of $${(promotion.minPurchaseCents / 100).toFixed(2)} required`
    };
  }

  let discountCents = 0;

  switch (promotion.type) {
    case 'PERCENTAGE':
      discountCents = Math.floor((cartTotalCents * promotion.discountValue) / 100);
      break;
    case 'FIXED_AMOUNT':
      discountCents = promotion.discountValue;
      break;
    case 'BOGO':
      // Buy one get one - find cheapest item and discount it
      const cheapestItem = cartItems.reduce((min, item) => 
        item.priceCents < min.priceCents ? item : min
      );
      discountCents = cheapestItem.priceCents;
      break;
    case 'FREE_SHIPPING':
      // Shipping discount handled separately
      discountCents = 0;
      break;
  }

  // Apply max discount cap if set
  if (promotion.maxDiscountCents && discountCents > promotion.maxDiscountCents) {
    discountCents = promotion.maxDiscountCents;
  }

  // Don't allow discount to exceed cart total
  if (discountCents > cartTotalCents) {
    discountCents = cartTotalCents;
  }

  return {
    valid: true,
    discountCents,
    message: `${promotion.name} applied`
  };
}

/**
 * Increment promotion usage
 */
export async function incrementPromotionUsage(
  promotionId: string
): Promise<void> {
  const promotion = await db.query.promotions.findFirst({
    where: eq(promotions.promotionId, promotionId)
  });

  if (promotion) {
    await db.update(promotions)
      .set({
        usageCount: promotion.usageCount + 1
      })
      .where(eq(promotions.promotionId, promotionId));
  }
}

/**
 * Create bundle
 */
export async function createBundle(
  channelId: string,
  name: string,
  bundlePriceCents: number,
  items: Array<{
    productId: string;
    quantity: number;
  }>,
  description?: string,
  startDate?: Date,
  endDate?: Date
): Promise<Bundle> {
  // Calculate total value of items
  let totalValueCents = 0;
  for (const item of items) {
    const product = await db.query.products.findFirst({
      where: eq(products.productId, item.productId)
    });
    if (product) {
      totalValueCents += product.priceCents * item.quantity;
    }
  }

  const savingsCents = totalValueCents - bundlePriceCents;

  if (savingsCents < 0) {
    throw new Error('Bundle price cannot exceed total item value');
  }

  // Create bundle
  const [bundle] = await db.insert(bundles).values({
    channelId,
    name,
    description: description || null,
    bundlePriceCents,
    savingsCents,
    isActive: true,
    startDate: startDate || null,
    endDate: endDate || null
  }).returning();

  // TODO: Add bundle items when bundleItems table is added to schema
  // for (const item of items) {
  //   await db.insert(bundleItems).values({
  //     channelId,
  //     bundleId: bundle.bundleId,
  //     productId: item.productId,
  //     quantity: item.quantity
  //   });
  // }

  return bundle as Bundle;
}

/**
 * Get bundle with items
 */
export async function getBundle(bundleId: string) {
  const bundle = await db.query.bundles.findFirst({
    where: eq(bundles.bundleId, bundleId),
    with: {
      items: {
        with: {
          product: true
        }
      }
    }
  });

  if (!bundle) {
    throw new Error('Bundle not found');
  }

  return bundle;
}

/**
 * Get active bundles
 */
export async function getActiveBundles(channelId: string) {
  const now = new Date();
  
  const activeBundles = await db.query.bundles.findMany({
    where: and(
      eq(bundles.channelId, channelId),
      eq(bundles.isActive, true)
    ),
    with: {
      items: {
        with: {
          product: true
        }
      }
    }
  });

  // Filter by date range
  return activeBundles.filter(bundle => {
    if (bundle.startDate && now < bundle.startDate) return false;
    if (bundle.endDate && now > bundle.endDate) return false;
    return true;
  });
}

/**
 * Validate price against margin guardrail
 */
export async function validatePrice(
  productId: string,
  proposedPriceCents: number
): Promise<{
  valid: boolean;
  minPriceCents: number;
  marginPercent: number;
  message?: string;
}> {
  const product = await db.query.products.findFirst({
    where: eq(products.productId, productId)
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // Get cost from latest inventory lot or product cost
  // For simplicity, using a fixed cost here - in production would query inventory lots
  const costCents = Math.floor(product.priceCents * 0.6); // Assume 40% margin
  const minPriceCents = Math.ceil(costCents * 1.2); // 20% minimum margin

  if (proposedPriceCents < minPriceCents) {
    const marginPercent = ((proposedPriceCents - costCents) / costCents) * 100;
    return {
      valid: false,
      minPriceCents,
      marginPercent,
      message: `Price ${proposedPriceCents} is below minimum ${minPriceCents} (${marginPercent.toFixed(1)}% margin, minimum 20% required)`
    };
  }

  const marginPercent = ((proposedPriceCents - costCents) / costCents) * 100;

  return {
    valid: true,
    minPriceCents,
    marginPercent
  };
}

/**
 * Calculate dynamic price based on demand
 */
export async function calculateDynamicPrice(
  productId: string,
  viewerCount: number,
  stockLevel: number,
  baseMultiplier: number = 1.0
): Promise<number> {
  const product = await db.query.products.findFirst({
    where: eq(products.productId, productId)
  });

  if (!product) {
    throw new Error('Product not found');
  }

  let priceCents = product.priceCents;

  // Demand multiplier (more viewers = higher price)
  const demandMultiplier = 1 + (Math.log10(viewerCount + 1) * 0.05);

  // Scarcity multiplier (low stock = higher price)
  const scarcityMultiplier = stockLevel < 10 ? 1.1 : stockLevel < 50 ? 1.05 : 1.0;

  // Apply multipliers
  priceCents = Math.floor(priceCents * baseMultiplier * demandMultiplier * scarcityMultiplier);

  // Validate against minimum price
  const validation = await validatePrice(productId, priceCents);
  if (!validation.valid) {
    priceCents = validation.minPriceCents;
  }

  return priceCents;
}

/**
 * Generate promo code
 */
export function generatePromoCode(prefix: string = 'PROMO'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing characters
  let code = prefix;
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get promotion analytics
 */
export async function getPromotionAnalytics(
  channelId: string,
  promotionId: string
) {
  const promotion = await db.query.promotions.findFirst({
    where: and(
      eq(promotions.promotionId, promotionId),
      eq(promotions.channelId, channelId)
    )
  });

  if (!promotion) {
    throw new Error('Promotion not found');
  }

  // TODO: Query orders that used this promotion
  // For now, return basic stats
  const usageRate = promotion.usageLimit
    ? (promotion.usageCount / promotion.usageLimit) * 100
    : 0;

  return {
    promotionId: promotion.promotionId,
    code: promotion.code,
    name: promotion.name,
    type: promotion.type,
    status: promotion.status,
    usageCount: promotion.usageCount,
    usageLimit: promotion.usageLimit,
    usageRate,
    discountValue: promotion.discountValue,
    startDate: promotion.startDate,
    endDate: promotion.endDate
  };
}
