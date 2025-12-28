import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { createCheckoutSession } from "./stripe";
import { aiDashboardsRouter } from "./routers-ai-dashboards";
import { liveStreamingRouter } from "./routers-live-streaming-simple";
import { walletRouter } from "./routers-wallet";
import { moderationRouter } from "./routers-moderation";
import { streamingRouter, paymentsRouter, analyticsRouter, moderationRouter as moderationRouterV2 } from "./routers-streaming";
import { productsRouter, ordersRouter, cartRouter, checkoutRouter } from "./routers-commerce";
// Temporarily commented out - need to fix schema imports
// import { lsnAuthRouter } from "./routers-lsn-auth";
// import { lsnDisputesRouter } from "./routers-lsn-disputes";
// import { lsnCreatorsRouter } from "./routers-lsn-creators";
// import { lsnProductsRouter } from "./routers-lsn-products";
// import { lsnOrdersRouter } from "./routers-lsn-orders";
import { tiktokArbitrageRouter } from "./routers-tiktok-arbitrage";

/**
 * Live Shopping Network - Complete API Router
 * Comprehensive tRPC router covering all platform features
 */

export const appRouter = router({
  system: systemRouter,
  aiDashboards: aiDashboardsRouter,
  liveStreaming: liveStreamingRouter,
  wallet: walletRouter,
  moderation: moderationRouter,
  streaming: streamingRouter,
  payments: paymentsRouter,
  analytics: analyticsRouter,
  
  // Commerce routers
  products: productsRouter,
  orders: ordersRouter,
  cart: cartRouter,
  checkout: checkoutRouter,
  
  // LSN-specific routers (temporarily commented out - need to fix schema imports)
  // lsnAuth: lsnAuthRouter,
  // lsnDisputes: lsnDisputesRouter,
  // lsnCreators: lsnCreatorsRouter,
  // lsnProducts: lsnProductsRouter,
  // lsnOrders: lsnOrdersRouter,
  
  // TikTok Shop Arbitrage
  tiktokArbitrage: tiktokArbitrageRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================================================
  // CHANNELS & MULTI-TENANT
  // ============================================================================
  
  channels: router({
    list: protectedProcedure.query(async () => {
      return await db.getChannels();
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getChannel(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        slug: z.string(),
        name: z.string(),
        settings: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createChannel(input);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string().optional(),
        status: z.enum(["active", "disabled"]).optional(),
        settings: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateChannel(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
