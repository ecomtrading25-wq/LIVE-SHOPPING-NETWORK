/**
 * Marketing Campaign Builder
 * Visual campaign creation with email, SMS, and push notifications
 */

export interface Campaign {
  id: string;
  name: string;
  type: "email" | "sms" | "push" | "multi-channel";
  status: "draft" | "scheduled" | "active" | "completed" | "paused";
  targetSegment: string;
  startDate: Date;
  endDate?: Date;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  category: string;
  subject?: string;
  body: string;
  variables: string[];
}

export const EMAIL_TEMPLATES: CampaignTemplate[] = [
  {
    id: "welcome",
    name: "Welcome Email",
    category: "onboarding",
    subject: "Welcome to {{brand_name}}!",
    body: "Hi {{customer_name}},\n\nWelcome to our community! Here's 10% off your first order: {{discount_code}}",
    variables: ["brand_name", "customer_name", "discount_code"],
  },
  {
    id: "abandoned_cart",
    name: "Abandoned Cart",
    category: "recovery",
    subject: "You left something behind...",
    body: "Hi {{customer_name}},\n\nYour cart is waiting! Complete your purchase and save {{discount_percent}}%: {{cart_url}}",
    variables: ["customer_name", "discount_percent", "cart_url"],
  },
  {
    id: "win_back",
    name: "Win-Back Campaign",
    category: "retention",
    subject: "We miss you, {{customer_name}}!",
    body: "It's been a while! Come back and enjoy {{discount_percent}}% off: {{shop_url}}",
    variables: ["customer_name", "discount_percent", "shop_url"],
  },
];

export async function createCampaign(campaign: Omit<Campaign, "id" | "spent" | "impressions" | "clicks" | "conversions" | "revenue">): Promise<Campaign> {
  return {
    ...campaign,
    id: `campaign_${Date.now()}`,
    spent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
  };
}

export async function getCampaignPerformance(campaignId: string): Promise<{
  roi: number;
  ctr: number;
  conversionRate: number;
  costPerClick: number;
  costPerConversion: number;
  revenuePerClick: number;
}> {
  // Mock data - in production, fetch from database
  return {
    roi: 3.5,
    ctr: 0.12,
    conversionRate: 0.05,
    costPerClick: 0.25,
    costPerConversion: 5.0,
    revenuePerClick: 0.875,
  };
}
