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
import { lsnAuthRouter } from "./routers-lsn-auth";
import { lsnDisputesRouter } from "./routers-lsn-disputes";
import { lsnCreatorsRouter } from "./routers-lsn-creators";
import { lsnProductsRouter } from "./routers-lsn-products";
import { lsnOrdersRouter } from "./routers-lsn-orders";
import { lsnOperationsRouter } from "./routers-lsn-operations";
import { tiktokArbitrageRouter } from "./routers-tiktok-arbitrage";
import { lsnPurchasingRouter, lsnCreatorRouter, lsnFraudRouter, lsnExecutiveRouter } from "./routers-lsn-all";
import { lsnRouter } from "./lsn-routers";
import { lsnUIRouter } from "./routers-lsn-ui";
import { founderIncidentRouter } from "./founder-incident-console";
import { advancedFeaturesRouter } from "./routers-advanced-features";
import { aiAutomationRouter } from "./routers-ai-automation";
import { webhookRouter } from "./webhook-handlers";
import { twilioLiveVideoRouter } from "./twilio-live-video";
import { paypalWebhookRouter } from "./paypal-webhooks";
import { wiseWebhookRouter } from "./wise-webhooks";
import { twilioLiveCompleteRouter } from "./twilio-live-complete";
import { avatarStudioRouter } from "./avatar-studio-router";
import { notificationsRouter } from "./routers-notifications";
import { liveShowsRouter } from "./routers-live-shows";
import { creatorsRouter } from "./routers-creators";
import { subscriptionsRouter } from "./routers-subscriptions";
import { rewardsRouter } from "./routers-rewards";

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
  subscriptions: subscriptionsRouter,
  rewards: rewardsRouter,
  
  // LSN-specific routers - Full enterprise live commerce platform
  lsnAuth: lsnAuthRouter,
  lsnDisputes: lsnDisputesRouter,
  lsnCreators: lsnCreatorsRouter,
  lsnProducts: lsnProductsRouter,
  lsnOrders: lsnOrdersRouter,
  lsnOperations: lsnOperationsRouter,
  
  // LSN Enterprise Systems - Purchasing, Creator Economy, Fraud, Executive BI
  lsnPurchasing: lsnPurchasingRouter,
  lsnCreatorEconomy: lsnCreatorRouter,
  lsnFraud: lsnFraudRouter,
  lsnExecutive: lsnExecutiveRouter,
  
  // TikTok Shop Arbitrage
  tiktokArbitrage: tiktokArbitrageRouter,
  
  // LSN Comprehensive Services (disputes, live shows, creators, inventory, financial, pricing, SKU)
  lsn: lsnRouter,
  
  // LSN UI Integration Services (for new dashboards)
  lsnUI: lsnUIRouter,
  
  // Avatar Influencer Studio
  avatarStudio: avatarStudioRouter,
  
  // Founder Incident Console & Policy Autonomy
  founderIncidents: founderIncidentRouter,
  
  // Notifications
  notifications: notificationsRouter,
  
  // Live Shows
  liveShows: liveShowsRouter,
  
  // Creators
  creators: creatorsRouter,
  
  // Wave 8: Advanced Features (Bulk Ops, Search, Export, Webhooks, Notifications, Jobs, Reporting)
  advancedFeatures: advancedFeaturesRouter,
  
  // Wave 8: AI & Automation (Recommendations, Segmentation, Pricing, Forecasting, Marketing)
  aiAutomation: aiAutomationRouter,
  
  // Webhook Handlers (PayPal, Wise, Twilio)
  webhooks: webhookRouter,
  
  // Twilio Live Video Integration
  twilioVideo: twilioLiveVideoRouter,
  
  // Enhanced Webhook Handlers (Complete implementations)
  paypalWebhooks: paypalWebhookRouter,
  wiseWebhooks: wiseWebhookRouter,
  twilioLiveComplete: twilioLiveCompleteRouter,
  
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
