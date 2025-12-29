/**
 * Subscription Access Control Middleware
 * Provides subscription tier gating for protected features
 */

import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { stripeSubscriptions, stripeSubscriptionPlans } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export type SubscriptionTier = "free" | "basic" | "pro" | "enterprise";

export interface SubscriptionFeatures {
  maxProducts: number;
  maxOrders: number;
  maxLiveStreams: number;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  multiChannel: boolean;
}

const TIER_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  free: {
    maxProducts: 10,
    maxOrders: 50,
    maxLiveStreams: 1,
    advancedAnalytics: false,
    prioritySupport: false,
    customBranding: false,
    apiAccess: false,
    multiChannel: false,
  },
  basic: {
    maxProducts: 100,
    maxOrders: 500,
    maxLiveStreams: 5,
    advancedAnalytics: true,
    prioritySupport: false,
    customBranding: false,
    apiAccess: false,
    multiChannel: false,
  },
  pro: {
    maxProducts: 1000,
    maxOrders: 5000,
    maxLiveStreams: 20,
    advancedAnalytics: true,
    prioritySupport: true,
    customBranding: true,
    apiAccess: true,
    multiChannel: true,
  },
  enterprise: {
    maxProducts: -1, // unlimited
    maxOrders: -1, // unlimited
    maxLiveStreams: -1, // unlimited
    advancedAnalytics: true,
    prioritySupport: true,
    customBranding: true,
    apiAccess: true,
    multiChannel: true,
  },
};

/**
 * Get user's subscription tier
 */
export async function getUserSubscriptionTier(
  userId: number
): Promise<SubscriptionTier> {
  const db = await getDb();
  if (!db) return "free";

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

  if (result.length === 0) return "free";

  // Extract tier from plan name or metadata
  const planName = result[0].plan.name.toLowerCase();
  if (planName.includes("enterprise")) return "enterprise";
  if (planName.includes("pro")) return "pro";
  if (planName.includes("basic")) return "basic";

  return "free";
}

/**
 * Get subscription features for a tier
 */
export function getTierFeatures(tier: SubscriptionTier): SubscriptionFeatures {
  return TIER_FEATURES[tier];
}

/**
 * Check if user has access to a feature
 */
export async function hasFeatureAccess(
  userId: number,
  feature: keyof SubscriptionFeatures
): Promise<boolean> {
  const tier = await getUserSubscriptionTier(userId);
  const features = getTierFeatures(tier);

  const value = features[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === -1 || value > 0;

  return false;
}

/**
 * Check if user has reached a limit
 */
export async function hasReachedLimit(
  userId: number,
  feature: keyof SubscriptionFeatures,
  currentCount: number
): Promise<boolean> {
  const tier = await getUserSubscriptionTier(userId);
  const features = getTierFeatures(tier);

  const limit = features[feature];
  if (typeof limit !== "number") return false;
  if (limit === -1) return false; // unlimited

  return currentCount >= limit;
}

/**
 * Require subscription tier middleware
 * Throws TRPCError if user doesn't have required tier
 */
export async function requireSubscriptionTier(
  userId: number,
  requiredTier: SubscriptionTier
) {
  const userTier = await getUserSubscriptionTier(userId);

  const tierHierarchy: SubscriptionTier[] = ["free", "basic", "pro", "enterprise"];
  const userTierIndex = tierHierarchy.indexOf(userTier);
  const requiredTierIndex = tierHierarchy.indexOf(requiredTier);

  if (userTierIndex < requiredTierIndex) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `This feature requires ${requiredTier} subscription or higher. Your current plan is ${userTier}.`,
    });
  }
}

/**
 * Require feature access middleware
 * Throws TRPCError if user doesn't have access to feature
 */
export async function requireFeatureAccess(
  userId: number,
  feature: keyof SubscriptionFeatures,
  featureName?: string
) {
  const hasAccess = await hasFeatureAccess(userId, feature);

  if (!hasAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `${featureName || feature} is not available in your current subscription plan. Please upgrade to access this feature.`,
    });
  }
}

/**
 * Check limit middleware
 * Throws TRPCError if user has reached limit
 */
export async function checkLimit(
  userId: number,
  feature: keyof SubscriptionFeatures,
  currentCount: number,
  featureName?: string
) {
  const reachedLimit = await hasReachedLimit(userId, feature, currentCount);

  if (reachedLimit) {
    const tier = await getUserSubscriptionTier(userId);
    const features = getTierFeatures(tier);
    const limit = features[feature];

    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You have reached the limit of ${limit} ${featureName || feature} for your ${tier} plan. Please upgrade to add more.`,
    });
  }
}

/**
 * Get user's subscription status and features
 */
export async function getUserSubscriptionStatus(userId: number) {
  const tier = await getUserSubscriptionTier(userId);
  const features = getTierFeatures(tier);

  return {
    tier,
    features,
  };
}
