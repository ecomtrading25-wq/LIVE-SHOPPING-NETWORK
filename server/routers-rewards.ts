/**
 * Rewards Router
 * tRPC router for loyalty rewards program
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as loyaltyRewards from "./loyalty-rewards";

export const rewardsRouter = router({
  /**
   * Get current user's rewards status
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const account = await loyaltyRewards.getLoyaltyAccount(ctx.user.id);
    const transactions = await loyaltyRewards.getPointsHistory(ctx.user.id, 10);
    const availableRewards = await loyaltyRewards.getAvailableRewards(ctx.user.id);
    
    return {
      account,
      recentTransactions: transactions,
      availableRewards,
    };
  }),

  /**
   * Get points history
   */
  getHistory: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(50),
    }))
    .query(async ({ ctx, input }) => {
      return await loyaltyRewards.getPointsHistory(ctx.user.id, input.limit);
    }),

  /**
   * Get available rewards for redemption
   */
  getAvailableRewards: protectedProcedure.query(async ({ ctx }) => {
    return await loyaltyRewards.getAvailableRewards(ctx.user.id);
  }),

  /**
   * Redeem a reward
   */
  redeemReward: protectedProcedure
    .input(z.object({
      rewardId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement reward redemption logic
      // This would:
      // 1. Verify user has enough points
      // 2. Deduct points from account
      // 3. Create redemption record
      // 4. Apply reward (discount code, free shipping, etc.)
      
      return {
        success: true,
        message: "Reward redeemed successfully",
      };
    }),
});
