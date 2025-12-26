/**
 * Subscription Boxes System
 * Recurring product boxes with customization options
 */

export interface SubscriptionBox {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: "monthly" | "quarterly" | "annual";
  category: string;
  features: string[];
  productsPerBox: number;
  customizable: boolean;
  status: "active" | "paused" | "discontinued";
  imageUrl: string;
  createdAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  boxId: string;
  userId: string;
  status: "active" | "paused" | "cancelled";
  billingCycle: "monthly" | "quarterly" | "annual";
  price: number;
  nextBillingDate: Date;
  startDate: Date;
  cancelledAt?: Date;
  preferences: {
    categories?: string[];
    excludedProducts?: string[];
    customNotes?: string;
  };
}

export interface BoxShipment {
  id: string;
  subscriptionPlanId: string;
  boxId: string;
  userId: string;
  products: Array<{
    productId: string;
    productName: string;
    quantity: number;
    value: number;
  }>;
  totalValue: number;
  shippedAt?: Date;
  deliveredAt?: Date;
  trackingNumber?: string;
  status: "preparing" | "shipped" | "delivered";
}

/**
 * Available subscription boxes
 */
export const subscriptionBoxes: SubscriptionBox[] = [
  {
    id: "tech-essentials",
    name: "Tech Essentials Box",
    description: "Monthly curated tech accessories and gadgets",
    price: 49.99,
    billingCycle: "monthly",
    category: "electronics",
    features: [
      "3-5 tech products monthly",
      "Total value $80-$120",
      "Free shipping",
      "Cancel anytime",
    ],
    productsPerBox: 4,
    customizable: true,
    status: "active",
    imageUrl: "/boxes/tech-essentials.jpg",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "fitness-boost",
    name: "Fitness Boost Box",
    description: "Quarterly fitness gear and supplements",
    price: 89.99,
    billingCycle: "quarterly",
    category: "fitness",
    features: [
      "5-7 fitness products",
      "Workout guides included",
      "Nutrition supplements",
      "Total value $150+",
    ],
    productsPerBox: 6,
    customizable: true,
    status: "active",
    imageUrl: "/boxes/fitness-boost.jpg",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "home-living",
    name: "Home & Living Box",
    description: "Monthly home essentials and decor",
    price: 39.99,
    billingCycle: "monthly",
    category: "home",
    features: [
      "4-6 home products",
      "Seasonal themes",
      "Eco-friendly options",
      "Total value $70+",
    ],
    productsPerBox: 5,
    customizable: false,
    status: "active",
    imageUrl: "/boxes/home-living.jpg",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "beauty-essentials",
    name: "Beauty Essentials Box",
    description: "Monthly beauty and skincare products",
    price: 59.99,
    billingCycle: "monthly",
    category: "beauty",
    features: [
      "5-7 beauty products",
      "Full-size and deluxe samples",
      "Cruelty-free brands",
      "Total value $100+",
    ],
    productsPerBox: 6,
    customizable: true,
    status: "active",
    imageUrl: "/boxes/beauty-essentials.jpg",
    createdAt: new Date("2024-01-01"),
  },
];

/**
 * Create subscription plan
 */
export async function createSubscriptionPlan(params: {
  boxId: string;
  userId: string;
  billingCycle: "monthly" | "quarterly" | "annual";
  preferences?: {
    categories?: string[];
    excludedProducts?: string[];
    customNotes?: string;
  };
}): Promise<SubscriptionPlan> {
  const box = subscriptionBoxes.find((b) => b.id === params.boxId);
  if (!box) {
    throw new Error("Subscription box not found");
  }

  const now = new Date();
  const nextBillingDate = new Date(now);
  
  switch (params.billingCycle) {
    case "monthly":
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      break;
    case "quarterly":
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
      break;
    case "annual":
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      break;
  }

  const plan: SubscriptionPlan = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    boxId: params.boxId,
    userId: params.userId,
    status: "active",
    billingCycle: params.billingCycle,
    price: box.price,
    nextBillingDate,
    startDate: now,
    preferences: params.preferences || {},
  };

  // In production, save to database and set up recurring billing
  console.log("[Subscription Boxes] Created plan:", plan);

  return plan;
}

/**
 * Get user's active subscriptions
 */
export async function getUserSubscriptions(userId: string): Promise<SubscriptionPlan[]> {
  // In production, query from database
  return [];
}

/**
 * Pause subscription
 */
export async function pauseSubscription(planId: string): Promise<void> {
  // In production, update database and pause billing
  console.log("[Subscription Boxes] Paused:", planId);
}

/**
 * Resume subscription
 */
export async function resumeSubscription(planId: string): Promise<void> {
  // In production, update database and resume billing
  console.log("[Subscription Boxes] Resumed:", planId);
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(planId: string, reason?: string): Promise<void> {
  // In production, update database and cancel billing
  console.log("[Subscription Boxes] Cancelled:", planId, reason);
}

/**
 * Update subscription preferences
 */
export async function updateSubscriptionPreferences(
  planId: string,
  preferences: {
    categories?: string[];
    excludedProducts?: string[];
    customNotes?: string;
  }
): Promise<void> {
  // In production, update database
  console.log("[Subscription Boxes] Updated preferences:", planId, preferences);
}

/**
 * Curate box for shipment
 */
export async function curateBox(planId: string): Promise<BoxShipment> {
  // In production, use AI/algorithm to select products based on preferences
  const shipment: BoxShipment = {
    id: `ship_${Date.now()}`,
    subscriptionPlanId: planId,
    boxId: "tech-essentials",
    userId: "user_123",
    products: [
      {
        productId: "1",
        productName: "USB-C Cable",
        quantity: 1,
        value: 15.99,
      },
      {
        productId: "2",
        productName: "Phone Stand",
        quantity: 1,
        value: 24.99,
      },
      {
        productId: "3",
        productName: "Wireless Charger",
        quantity: 1,
        value: 39.99,
      },
    ],
    totalValue: 80.97,
    status: "preparing",
  };

  console.log("[Subscription Boxes] Curated box:", shipment);
  return shipment;
}

/**
 * Get subscription analytics
 */
export async function getSubscriptionAnalytics(): Promise<{
  totalSubscribers: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
  averageLifetimeValue: number;
  topBoxes: Array<{
    boxId: string;
    boxName: string;
    subscribers: number;
    revenue: number;
  }>;
}> {
  // In production, calculate from database
  return {
    totalSubscribers: 1250,
    monthlyRecurringRevenue: 62475,
    churnRate: 4.2,
    averageLifetimeValue: 450,
    topBoxes: [
      {
        boxId: "tech-essentials",
        boxName: "Tech Essentials Box",
        subscribers: 520,
        revenue: 25980,
      },
      {
        boxId: "beauty-essentials",
        boxName: "Beauty Essentials Box",
        subscribers: 380,
        revenue: 22792,
      },
      {
        boxId: "fitness-boost",
        boxName: "Fitness Boost Box",
        subscribers: 210,
        revenue: 18898,
      },
      {
        boxId: "home-living",
        boxName: "Home & Living Box",
        subscribers: 140,
        revenue: 5599,
      },
    ],
  };
}

/**
 * Send subscription renewal reminder
 */
export async function sendRenewalReminder(planId: string): Promise<void> {
  // In production, send email notification
  console.log("[Subscription Boxes] Renewal reminder sent:", planId);
}

/**
 * Process subscription billing
 */
export async function processSubscriptionBilling(planId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  // In production, charge payment method and create shipment
  console.log("[Subscription Boxes] Processing billing:", planId);
  
  return {
    success: true,
  };
}
