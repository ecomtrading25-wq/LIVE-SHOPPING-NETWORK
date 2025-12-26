/**
 * Affiliate Program System
 * Affiliate registration, tracking, commissions, and payouts
 */

export interface Affiliate {
  id: string;
  userId: string;
  code: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  commissionRate: number;
  totalSales: number;
  totalCommissions: number;
  pendingCommissions: number;
  status: "active" | "inactive" | "suspended";
}

export interface AffiliateClick {
  id: string;
  affiliateId: string;
  ipAddress: string;
  userAgent: string;
  referrer: string;
  landingPage: string;
  timestamp: Date;
  converted: boolean;
  orderId?: string;
}

export const COMMISSION_TIERS = {
  bronze: 0.05,
  silver: 0.10,
  gold: 0.15,
  platinum: 0.20,
};

export async function generateAffiliateLink(affiliateCode: string, productId?: string): Promise<string> {
  const baseUrl = process.env.VITE_APP_URL || "https://liveshopping.network";
  const path = productId ? `/products/${productId}` : "/";
  return `${baseUrl}${path}?ref=${affiliateCode}`;
}

export async function trackAffiliateClick(affiliateCode: string, metadata: Partial<AffiliateClick>): Promise<void> {
  // Store click in database with 30-day cookie attribution window
  console.log(`Tracked affiliate click for ${affiliateCode}`, metadata);
}

export async function calculateCommission(orderId: string, affiliateId: string): Promise<number> {
  // Mock calculation - in production, fetch order total and affiliate tier
  const orderTotal = 100;
  const commissionRate = 0.10;
  return orderTotal * commissionRate;
}
