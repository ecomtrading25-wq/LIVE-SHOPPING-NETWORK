/**
 * Gift Cards & Vouchers System
 * Purchase, redeem, and manage gift cards
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

export interface GiftCard {
  id: string;
  code: string;
  initialValue: number;
  currentBalance: number;
  currency: string;
  status: "active" | "redeemed" | "expired" | "cancelled";
  purchasedBy: string | null;
  purchasedAt: Date;
  expiresAt: Date | null;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  designTemplate?: string;
}

export interface GiftCardTransaction {
  id: string;
  giftCardId: string;
  type: "purchase" | "redeem" | "refund";
  amount: number;
  orderId?: string;
  userId?: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
}

/**
 * Generate unique gift card code
 */
export function generateGiftCardCode(): string {
  const prefix = "LSN";
  const segments = [];
  
  for (let i = 0; i < 4; i++) {
    const segment = Math.random().toString(36).substring(2, 6).toUpperCase();
    segments.push(segment);
  }
  
  return `${prefix}-${segments.join("-")}`;
}

/**
 * Create a new gift card
 */
export async function createGiftCard(params: {
  value: number;
  purchasedBy?: string;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  designTemplate?: string;
  expiresInDays?: number;
}): Promise<GiftCard> {
  const code = generateGiftCardCode();
  const now = new Date();
  const expiresAt = params.expiresInDays
    ? new Date(now.getTime() + params.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const giftCard: GiftCard = {
    id: `gc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    code,
    initialValue: params.value,
    currentBalance: params.value,
    currency: "USD",
    status: "active",
    purchasedBy: params.purchasedBy || null,
    purchasedAt: now,
    expiresAt,
    recipientEmail: params.recipientEmail,
    recipientName: params.recipientName,
    message: params.message,
    designTemplate: params.designTemplate || "default",
  };

  // In production, save to database
  console.log("[Gift Cards] Created:", giftCard);

  return giftCard;
}

/**
 * Validate and get gift card by code
 */
export async function getGiftCardByCode(code: string): Promise<GiftCard | null> {
  // In production, query from database
  // Mock implementation
  return null;
}

/**
 * Redeem gift card
 */
export async function redeemGiftCard(params: {
  code: string;
  amount: number;
  orderId: string;
  userId?: string;
}): Promise<{
  success: boolean;
  remainingBalance: number;
  error?: string;
}> {
  const giftCard = await getGiftCardByCode(params.code);

  if (!giftCard) {
    return {
      success: false,
      remainingBalance: 0,
      error: "Gift card not found",
    };
  }

  if (giftCard.status !== "active") {
    return {
      success: false,
      remainingBalance: giftCard.currentBalance,
      error: `Gift card is ${giftCard.status}`,
    };
  }

  if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
    return {
      success: false,
      remainingBalance: giftCard.currentBalance,
      error: "Gift card has expired",
    };
  }

  if (giftCard.currentBalance < params.amount) {
    return {
      success: false,
      remainingBalance: giftCard.currentBalance,
      error: `Insufficient balance. Available: $${giftCard.currentBalance.toFixed(2)}`,
    };
  }

  // Deduct amount
  const newBalance = giftCard.currentBalance - params.amount;

  // Record transaction
  const transaction: GiftCardTransaction = {
    id: `gct_${Date.now()}`,
    giftCardId: giftCard.id,
    type: "redeem",
    amount: params.amount,
    orderId: params.orderId,
    userId: params.userId,
    balanceBefore: giftCard.currentBalance,
    balanceAfter: newBalance,
    createdAt: new Date(),
  };

  // Update gift card
  giftCard.currentBalance = newBalance;
  if (newBalance === 0) {
    giftCard.status = "redeemed";
  }

  // In production, save to database
  console.log("[Gift Cards] Redeemed:", transaction);

  return {
    success: true,
    remainingBalance: newBalance,
  };
}

/**
 * Check gift card balance
 */
export async function checkGiftCardBalance(code: string): Promise<{
  balance: number;
  currency: string;
  status: string;
  expiresAt: Date | null;
} | null> {
  const giftCard = await getGiftCardByCode(code);

  if (!giftCard) {
    return null;
  }

  return {
    balance: giftCard.currentBalance,
    currency: giftCard.currency,
    status: giftCard.status,
    expiresAt: giftCard.expiresAt,
  };
}

/**
 * Send gift card email
 */
export async function sendGiftCardEmail(giftCard: GiftCard): Promise<void> {
  if (!giftCard.recipientEmail) {
    return;
  }

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">You've Received a Gift Card!</h1>
      </div>
      
      <div style="padding: 40px; background: #f9fafb;">
        ${giftCard.recipientName ? `<p style="font-size: 18px;">Hi ${giftCard.recipientName},</p>` : ""}
        
        ${giftCard.message ? `<p style="font-size: 16px; font-style: italic; color: #666;">"${giftCard.message}"</p>` : ""}
        
        <div style="background: white; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="color: #666; margin: 0 0 10px 0;">Gift Card Value</p>
          <p style="font-size: 48px; font-weight: bold; color: #667eea; margin: 0;">$${giftCard.initialValue.toFixed(2)}</p>
          
          <div style="margin: 30px 0; padding: 20px; background: #f3f4f6; border-radius: 8px;">
            <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your Gift Card Code</p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #1f2937; margin: 0; font-family: monospace;">${giftCard.code}</p>
          </div>
          
          <a href="https://liveshoppingnetwork.com/redeem?code=${giftCard.code}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Redeem Now
          </a>
        </div>
        
        ${giftCard.expiresAt ? `<p style="text-align: center; color: #666; font-size: 14px;">Expires: ${giftCard.expiresAt.toLocaleDateString()}</p>` : ""}
        
        <p style="color: #666; font-size: 14px;">
          To use your gift card, simply enter the code at checkout or click the button above to redeem it now.
        </p>
      </div>
      
      <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
        <p>Live Shopping Network - Shop Live, Save More</p>
      </div>
    </div>
  `;

  // In production, send via email service
  console.log("[Gift Cards] Email sent to:", giftCard.recipientEmail);
}

/**
 * Get gift card transaction history
 */
export async function getGiftCardTransactions(giftCardId: string): Promise<GiftCardTransaction[]> {
  // In production, query from database
  return [];
}

/**
 * Cancel gift card and issue refund
 */
export async function cancelGiftCard(giftCardId: string, reason: string): Promise<void> {
  // In production, update database and process refund
  console.log("[Gift Cards] Cancelled:", giftCardId, reason);
}

/**
 * Get gift card designs/templates
 */
export function getGiftCardDesigns(): Array<{
  id: string;
  name: string;
  preview: string;
  category: string;
}> {
  return [
    {
      id: "birthday",
      name: "Happy Birthday",
      preview: "/designs/birthday.png",
      category: "celebration",
    },
    {
      id: "holiday",
      name: "Holiday Cheer",
      preview: "/designs/holiday.png",
      category: "seasonal",
    },
    {
      id: "thankyou",
      name: "Thank You",
      preview: "/designs/thankyou.png",
      category: "gratitude",
    },
    {
      id: "congratulations",
      name: "Congratulations",
      preview: "/designs/congrats.png",
      category: "celebration",
    },
    {
      id: "default",
      name: "Classic",
      preview: "/designs/default.png",
      category: "general",
    },
  ];
}

/**
 * Bulk gift card generation (for promotions)
 */
export async function generateBulkGiftCards(params: {
  count: number;
  value: number;
  expiresInDays?: number;
  prefix?: string;
}): Promise<GiftCard[]> {
  const giftCards: GiftCard[] = [];

  for (let i = 0; i < params.count; i++) {
    const giftCard = await createGiftCard({
      value: params.value,
      expiresInDays: params.expiresInDays,
    });
    giftCards.push(giftCard);
  }

  console.log(`[Gift Cards] Generated ${params.count} bulk gift cards`);
  return giftCards;
}
