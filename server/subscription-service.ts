/**
 * Subscription Service
 * Handles Stripe subscription management for customer portal
 */

import Stripe from "stripe";
import { getDb } from "./db";
import {
  stripeSubscriptionPlans,
  stripeSubscriptions,
  stripePaymentMethods,
  stripeBillingHistory,
  users,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  amount: string;
  currency: string;
  interval: "month" | "year";
  intervalCount: number;
  features: string[];
  active: boolean;
  stripeProductId: string;
  stripePriceId: string;
}

export interface UserSubscription {
  id: string;
  userId: number;
  planId: string;
  planName: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  amount: string;
  currency: string;
  interval: string;
}

export interface PaymentMethodInfo {
  id: string;
  type: string;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
}

export interface BillingHistoryItem {
  id: string;
  amount: string;
  currency: string;
  status: string;
  invoiceDate: Date;
  paidAt: Date | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

/**
 * Get all active subscription plans
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const plans = await db
    .select()
    .from(stripeSubscriptionPlans)
    .where(eq(stripeSubscriptionPlans.active, true))
    .orderBy(stripeSubscriptionPlans.amount);

  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    amount: plan.amount,
    currency: plan.currency,
    interval: plan.interval,
    intervalCount: plan.intervalCount,
    features: (plan.features as string[]) || [],
    active: plan.active,
    stripeProductId: plan.stripeProductId,
    stripePriceId: plan.stripePriceId,
  }));
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(
  userId: number
): Promise<UserSubscription | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      subscription: stripeSubscriptions,
      plan: stripeSubscriptionPlans,
    })
    .from(stripeSubscriptions)
    .innerJoin(
      stripeSubscriptionPlans,
      eq(stripeSubscriptions.planId, stripeSubscriptionPlans.id)
    )
    .where(
      and(
        eq(stripeSubscriptions.userId, userId),
        eq(stripeSubscriptions.status, "active")
      )
    )
    .limit(1);

  if (result.length === 0) return null;

  const { subscription, plan } = result[0];

  return {
    id: subscription.id,
    userId: subscription.userId,
    planId: subscription.planId,
    planName: plan.name,
    status: subscription.status,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    canceledAt: subscription.canceledAt,
    amount: plan.amount,
    currency: plan.currency,
    interval: plan.interval,
  };
}

/**
 * Create or get Stripe customer for user
 */
async function getOrCreateStripeCustomer(
  userId: number,
  email: string,
  name: string | null
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user already has a subscription with a customer ID
  const existingSubscription = await db
    .select()
    .from(stripeSubscriptions)
    .where(eq(stripeSubscriptions.userId, userId))
    .limit(1);

  if (existingSubscription.length > 0) {
    return existingSubscription[0].stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId: userId.toString(),
    },
  });

  return customer.id;
}

/**
 * Create subscription checkout session
 */
export async function createSubscriptionCheckout(params: {
  userId: number;
  planId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; url: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get plan details
  const [plan] = await db
    .select()
    .from(stripeSubscriptionPlans)
    .where(eq(stripeSubscriptionPlans.id, params.planId))
    .limit(1);

  if (!plan) {
    throw new Error("Subscription plan not found");
  }

  // Get user details
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, params.userId))
    .limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  // Get or create Stripe customer
  const customerId = await getOrCreateStripeCustomer(
    params.userId,
    user.email || "",
    user.name
  );

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      userId: params.userId.toString(),
      planId: params.planId,
    },
  });

  return {
    sessionId: session.id,
    url: session.url || "",
  };
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(params: {
  userId: number;
  subscriptionId: string;
  cancelAtPeriodEnd: boolean;
  reason?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get subscription
  const [subscription] = await db
    .select()
    .from(stripeSubscriptions)
    .where(
      and(
        eq(stripeSubscriptions.id, params.subscriptionId),
        eq(stripeSubscriptions.userId, params.userId)
      )
    )
    .limit(1);

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Cancel in Stripe
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: params.cancelAtPeriodEnd,
  });

  // Update in database
  await db
    .update(stripeSubscriptions)
    .set({
      cancelAtPeriodEnd: params.cancelAtPeriodEnd,
      canceledAt: params.cancelAtPeriodEnd ? null : new Date(),
      cancelReason: params.reason || null,
      updatedAt: new Date(),
    })
    .where(eq(stripeSubscriptions.id, params.subscriptionId));
}

/**
 * Reactivate canceled subscription
 */
export async function reactivateSubscription(params: {
  userId: number;
  subscriptionId: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get subscription
  const [subscription] = await db
    .select()
    .from(stripeSubscriptions)
    .where(
      and(
        eq(stripeSubscriptions.id, params.subscriptionId),
        eq(stripeSubscriptions.userId, params.userId)
      )
    )
    .limit(1);

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Reactivate in Stripe
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  // Update in database
  await db
    .update(stripeSubscriptions)
    .set({
      cancelAtPeriodEnd: false,
      canceledAt: null,
      cancelReason: null,
      updatedAt: new Date(),
    })
    .where(eq(stripeSubscriptions.id, params.subscriptionId));
}

/**
 * Change subscription plan
 */
export async function changeSubscriptionPlan(params: {
  userId: number;
  subscriptionId: string;
  newPlanId: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get subscription
  const [subscription] = await db
    .select()
    .from(stripeSubscriptions)
    .where(
      and(
        eq(stripeSubscriptions.id, params.subscriptionId),
        eq(stripeSubscriptions.userId, params.userId)
      )
    )
    .limit(1);

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Get new plan
  const [newPlan] = await db
    .select()
    .from(stripeSubscriptionPlans)
    .where(eq(stripeSubscriptionPlans.id, params.newPlanId))
    .limit(1);

  if (!newPlan) {
    throw new Error("New plan not found");
  }

  // Update subscription in Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.stripeSubscriptionId
  );

  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    items: [
      {
        id: stripeSubscription.items.data[0].id,
        price: newPlan.stripePriceId,
      },
    ],
    proration_behavior: "create_prorations",
  });

  // Update in database
  await db
    .update(stripeSubscriptions)
    .set({
      planId: params.newPlanId,
      updatedAt: new Date(),
    })
    .where(eq(stripeSubscriptions.id, params.subscriptionId));
}

/**
 * Get user's payment methods
 */
export async function getPaymentMethods(
  userId: number
): Promise<PaymentMethodInfo[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const methods = await db
    .select()
    .from(stripePaymentMethods)
    .where(eq(stripePaymentMethods.userId, userId))
    .orderBy(desc(stripePaymentMethods.isDefault));

  return methods.map((method) => ({
    id: method.id,
    type: method.type,
    brand: method.brand,
    last4: method.last4,
    expMonth: method.expMonth,
    expYear: method.expYear,
    isDefault: method.isDefault,
  }));
}

/**
 * Get billing history
 */
export async function getBillingHistory(
  userId: number,
  limit: number = 12
): Promise<BillingHistoryItem[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const history = await db
    .select()
    .from(stripeBillingHistory)
    .where(eq(stripeBillingHistory.userId, userId))
    .orderBy(desc(stripeBillingHistory.invoiceDate))
    .limit(limit);

  return history.map((item) => ({
    id: item.id,
    amount: item.amount,
    currency: item.currency,
    status: item.status,
    invoiceDate: item.invoiceDate,
    paidAt: item.paidAt,
    hostedInvoiceUrl: item.hostedInvoiceUrl,
    invoicePdf: item.invoicePdf,
  }));
}

/**
 * Create customer portal session
 * Redirects to Stripe's hosted customer portal
 */
export async function createCustomerPortalSession(params: {
  userId: number;
  returnUrl: string;
}): Promise<{ url: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get user's Stripe customer ID
  const [subscription] = await db
    .select()
    .from(stripeSubscriptions)
    .where(eq(stripeSubscriptions.userId, params.userId))
    .limit(1);

  if (!subscription) {
    throw new Error("No subscription found");
  }

  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: params.returnUrl,
  });

  return {
    url: session.url,
  };
}
