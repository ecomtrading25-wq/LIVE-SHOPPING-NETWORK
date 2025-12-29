/**
 * Subscription Service Tests
 * Tests for subscription management functionality
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as subscriptionService from "./subscription-service";
import * as subscriptionMiddleware from "./subscription-middleware";

describe("Subscription Service", () => {
  describe("getSubscriptionPlans", () => {
    it("should return available subscription plans", async () => {
      const plans = await subscriptionService.getSubscriptionPlans();
      
      expect(Array.isArray(plans)).toBe(true);
      // Plans may be empty if not seeded yet, which is okay for initial test
    });
  });

  describe("getUserSubscription", () => {
    it("should return null for user without subscription", async () => {
      const subscription = await subscriptionService.getUserSubscription(99999);
      
      expect(subscription).toBeNull();
    });
  });
});

describe("Subscription Middleware", () => {
  describe("getUserSubscriptionTier", () => {
    it("should return 'free' tier for user without subscription", async () => {
      const tier = await subscriptionMiddleware.getUserSubscriptionTier(99999);
      
      expect(tier).toBe("free");
    });
  });

  describe("getTierFeatures", () => {
    it("should return correct features for free tier", () => {
      const features = subscriptionMiddleware.getTierFeatures("free");
      
      expect(features).toMatchObject({
        maxProducts: 10,
        maxOrders: 50,
        maxLiveStreams: 1,
        advancedAnalytics: false,
        prioritySupport: false,
        customBranding: false,
        apiAccess: false,
        multiChannel: false,
      });
    });

    it("should return correct features for basic tier", () => {
      const features = subscriptionMiddleware.getTierFeatures("basic");
      
      expect(features).toMatchObject({
        maxProducts: 100,
        maxOrders: 500,
        maxLiveStreams: 5,
        advancedAnalytics: true,
        prioritySupport: false,
      });
    });

    it("should return correct features for pro tier", () => {
      const features = subscriptionMiddleware.getTierFeatures("pro");
      
      expect(features).toMatchObject({
        maxProducts: 1000,
        maxOrders: 5000,
        maxLiveStreams: 20,
        advancedAnalytics: true,
        prioritySupport: true,
        customBranding: true,
        apiAccess: true,
        multiChannel: true,
      });
    });

    it("should return unlimited features for enterprise tier", () => {
      const features = subscriptionMiddleware.getTierFeatures("enterprise");
      
      expect(features).toMatchObject({
        maxProducts: -1,
        maxOrders: -1,
        maxLiveStreams: -1,
        advancedAnalytics: true,
        prioritySupport: true,
        customBranding: true,
        apiAccess: true,
        multiChannel: true,
      });
    });
  });

  describe("hasFeatureAccess", () => {
    it("should allow free tier users to access basic features", async () => {
      const hasAccess = await subscriptionMiddleware.hasFeatureAccess(
        99999,
        "maxProducts"
      );
      
      expect(hasAccess).toBe(true);
    });
  });

  describe("hasReachedLimit", () => {
    it("should detect when free tier user reaches product limit", async () => {
      const reachedLimit = await subscriptionMiddleware.hasReachedLimit(
        99999,
        "maxProducts",
        10
      );
      
      expect(reachedLimit).toBe(true);
    });

    it("should allow free tier user below product limit", async () => {
      const reachedLimit = await subscriptionMiddleware.hasReachedLimit(
        99999,
        "maxProducts",
        5
      );
      
      expect(reachedLimit).toBe(false);
    });
  });

  describe("getUserSubscriptionStatus", () => {
    it("should return subscription status for user", async () => {
      const status = await subscriptionMiddleware.getUserSubscriptionStatus(99999);
      
      expect(status).toHaveProperty("tier");
      expect(status).toHaveProperty("features");
      expect(status.tier).toBe("free");
    });
  });
});

describe("Subscription Tier Hierarchy", () => {
  it("should have correct tier hierarchy", () => {
    const tiers = ["free", "basic", "pro", "enterprise"];
    
    tiers.forEach((tier) => {
      const features = subscriptionMiddleware.getTierFeatures(
        tier as subscriptionMiddleware.SubscriptionTier
      );
      expect(features).toBeDefined();
    });
  });

  it("should have increasing limits across tiers", () => {
    const freeTier = subscriptionMiddleware.getTierFeatures("free");
    const basicTier = subscriptionMiddleware.getTierFeatures("basic");
    const proTier = subscriptionMiddleware.getTierFeatures("pro");
    
    expect(basicTier.maxProducts).toBeGreaterThan(freeTier.maxProducts);
    expect(proTier.maxProducts).toBeGreaterThan(basicTier.maxProducts);
    
    expect(basicTier.maxOrders).toBeGreaterThan(freeTier.maxOrders);
    expect(proTier.maxOrders).toBeGreaterThan(basicTier.maxOrders);
  });
});
