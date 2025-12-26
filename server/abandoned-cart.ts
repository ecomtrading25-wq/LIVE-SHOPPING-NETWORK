import { db } from "./db";
import { users, orders } from "../drizzle/schema";
import { eq, and, lt, isNull } from "drizzle-orm";
import { sendEmail } from "./email";

/**
 * Abandoned Cart Recovery System
 * Automated email reminders for incomplete checkouts
 */

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface AbandonedCart {
  userId: string;
  email: string;
  items: CartItem[];
  totalValue: number;
  abandonedAt: number;
}

/**
 * Find abandoned carts (items in cart but no order placed in 24 hours)
 */
export async function findAbandonedCarts(): Promise<AbandonedCart[]> {
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  
  // In production, this would query a separate cart_sessions table
  // For now, we'll simulate with a placeholder
  
  const abandonedCarts: AbandonedCart[] = [];
  
  // TODO: Implement actual cart session tracking
  // This would involve:
  // 1. Tracking when users add items to cart (cart_sessions table)
  // 2. Checking if they completed checkout (orders table)
  // 3. Finding carts abandoned > 24 hours ago
  
  return abandonedCarts;
}

/**
 * Send abandoned cart recovery email
 */
export async function sendAbandonedCartEmail(cart: AbandonedCart): Promise<boolean> {
  const discountCode = generateDiscountCode();
  const discountPercent = 10;
  
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); padding: 40px; text-align: center;">
        <h1 style="color: white; margin: 0;">You Left Something Behind!</h1>
      </div>
      
      <div style="padding: 40px; background: #f9fafb;">
        <p style="font-size: 18px; color: #374151; margin-bottom: 20px;">
          Hi there! We noticed you left some items in your cart.
        </p>
        
        <p style="font-size: 16px; color: #6b7280; margin-bottom: 30px;">
          Don't worry, we saved them for you! Complete your purchase now and get <strong>${discountPercent}% off</strong> with code:
        </p>
        
        <div style="background: white; border: 2px dashed #9333ea; padding: 20px; text-align: center; margin-bottom: 30px;">
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 10px 0;">Your Discount Code</p>
          <p style="font-size: 32px; font-weight: bold; color: #9333ea; margin: 0; letter-spacing: 2px;">
            ${discountCode}
          </p>
        </div>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h2 style="font-size: 18px; color: #111827; margin-top: 0;">Your Cart Items:</h2>
          
          ${cart.items.map(item => `
            <div style="display: flex; align-items: center; padding: 15px 0; border-bottom: 1px solid #e5e7eb;">
              ${item.imageUrl ? `
                <img src="${item.imageUrl}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px;" />
              ` : ''}
              <div style="flex: 1;">
                <p style="font-weight: bold; color: #111827; margin: 0 0 5px 0;">${item.name}</p>
                <p style="color: #6b7280; margin: 0;">Quantity: ${item.quantity}</p>
              </div>
              <p style="font-weight: bold; color: #9333ea; margin: 0;">$${item.price.toFixed(2)}</p>
            </div>
          `).join('')}
          
          <div style="padding: 20px 0; text-align: right;">
            <p style="font-size: 14px; color: #6b7280; margin: 0 0 5px 0;">Subtotal:</p>
            <p style="font-size: 24px; font-weight: bold; color: #111827; margin: 0;">
              $${cart.totalValue.toFixed(2)}
            </p>
            <p style="font-size: 14px; color: #16a34a; margin: 5px 0 0 0;">
              Save $${(cart.totalValue * discountPercent / 100).toFixed(2)} with your discount!
            </p>
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="https://liveshoppingnetwork.com/cart" 
             style="display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 16px 48px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
            Complete Your Purchase
          </a>
        </div>
        
        <p style="font-size: 14px; color: #9ca3af; text-align: center; margin-top: 30px;">
          This offer expires in 48 hours. Don't miss out!
        </p>
      </div>
      
      <div style="padding: 20px; text-align: center; background: #111827; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0 0 10px 0;">Live Shopping Network</p>
        <p style="margin: 0;">
          <a href="https://liveshoppingnetwork.com/unsubscribe" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
        </p>
      </div>
    </div>
  `;
  
  return await sendEmail({
    to: cart.email,
    subject: `Don't Forget Your Cart! Get ${discountPercent}% Off 🎁`,
    html: emailContent,
    metadata: {
      type: "abandoned_cart",
      userId: cart.userId,
      discountCode,
      cartValue: cart.totalValue.toString(),
    },
  });
}

/**
 * Generate unique discount code
 */
function generateDiscountCode(): string {
  const prefix = "CART";
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${random}`;
}

/**
 * Process abandoned cart recovery (run as cron job)
 */
export async function processAbandonedCarts(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const carts = await findAbandonedCarts();
  
  let sent = 0;
  let failed = 0;
  
  for (const cart of carts) {
    try {
      const success = await sendAbandonedCartEmail(cart);
      if (success) {
        sent++;
        
        // Mark cart as recovery email sent (to avoid duplicate emails)
        // TODO: Update cart_sessions table with recovery_email_sent_at timestamp
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Failed to send abandoned cart email to ${cart.email}:`, error);
      failed++;
    }
  }
  
  return {
    processed: carts.length,
    sent,
    failed,
  };
}

/**
 * Track cart abandonment (call when user adds items to cart)
 */
export async function trackCartSession(
  userId: string,
  items: CartItem[]
): Promise<void> {
  // TODO: Implement cart session tracking
  // This would involve:
  // 1. Creating/updating cart_sessions table entry
  // 2. Storing items, timestamps, and user info
  // 3. Setting up cron job to check for abandoned carts every hour
  
  console.log(`Tracking cart session for user ${userId} with ${items.length} items`);
}

/**
 * Mark cart as converted (call when order is completed)
 */
export async function markCartConverted(userId: string): Promise<void> {
  // TODO: Update cart_sessions table to mark as converted
  // This prevents sending recovery emails for completed purchases
  
  console.log(`Cart converted for user ${userId}`);
}

/**
 * Get abandoned cart statistics
 */
export async function getAbandonedCartStats(): Promise<{
  totalAbandoned: number;
  totalValue: number;
  recoveryRate: number;
  avgCartValue: number;
}> {
  // TODO: Query cart_sessions and orders tables for statistics
  
  return {
    totalAbandoned: 0,
    totalValue: 0,
    recoveryRate: 0,
    avgCartValue: 0,
  };
}

/**
 * Apply discount code from abandoned cart email
 */
export async function applyAbandonedCartDiscount(
  code: string,
  userId: string
): Promise<{ valid: boolean; discount: number }> {
  // Validate discount code format
  if (!code.startsWith("CART")) {
    return { valid: false, discount: 0 };
  }
  
  // TODO: Check if code is valid and not expired (48 hours)
  // TODO: Check if code hasn't been used already
  // TODO: Verify code belongs to this user
  
  return {
    valid: true,
    discount: 10, // 10% discount
  };
}
