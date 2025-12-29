/**
 * Subscription Management Router
 * tRPC procedures for customer portal subscription features
 */

import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as subscriptionService from "./subscription-service";
import * as subscriptionMiddleware from "./subscription-middleware";

export const subscriptionsRouter = router({
  /**
   * Get all available subscription plans
   */
  getPlans: publicProcedure.query(async () => {
    return await subscriptionService.getSubscriptionPlans();
  }),

  /**
   * Get current user's subscription
   */
  getMySubscription: protectedProcedure.query(async ({ ctx }) => {
    return await subscriptionService.getUserSubscription(ctx.user.id);
  }),

  /**
   * Create subscription checkout session
   */
  createCheckout: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await subscriptionService.createSubscriptionCheckout({
        userId: ctx.user.id,
        planId: input.planId,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
      });
    }),

  /**
   * Cancel subscription
   */
  cancel: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        cancelAtPeriodEnd: z.boolean().default(true),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await subscriptionService.cancelSubscription({
        userId: ctx.user.id,
        subscriptionId: input.subscriptionId,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd,
        reason: input.reason,
      });
      return { success: true };
    }),

  /**
   * Reactivate canceled subscription
   */
  reactivate: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await subscriptionService.reactivateSubscription({
        userId: ctx.user.id,
        subscriptionId: input.subscriptionId,
      });
      return { success: true };
    }),

  /**
   * Change subscription plan (upgrade/downgrade)
   */
  changePlan: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        newPlanId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await subscriptionService.changeSubscriptionPlan({
        userId: ctx.user.id,
        subscriptionId: input.subscriptionId,
        newPlanId: input.newPlanId,
      });
      return { success: true };
    }),

  /**
   * Get payment methods
   */
  getPaymentMethods: protectedProcedure.query(async ({ ctx }) => {
    return await subscriptionService.getPaymentMethods(ctx.user.id);
  }),

  /**
   * Get billing history
   */
  getBillingHistory: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(12),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      return await subscriptionService.getBillingHistory(
        ctx.user.id,
        input?.limit
      );
    }),

  /**
   * Create customer portal session
   * Redirects to Stripe's hosted portal for payment method management
   */
  createPortalSession: protectedProcedure
    .input(
      z.object({
        returnUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await subscriptionService.createCustomerPortalSession({
        userId: ctx.user.id,
        returnUrl: input.returnUrl,
      });
    }),

  /**
   * Get subscription status and features
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    return await subscriptionMiddleware.getUserSubscriptionStatus(ctx.user.id);
  }),
});
