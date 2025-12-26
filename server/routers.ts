import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { createCheckoutSession } from "./stripe";

/**
 * Live Shopping Network - Complete API Router
 * Comprehensive tRPC router covering all platform features
 */

export const appRouter = router({
  system: systemRouter,
  
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

  // ============================================================================
  // PRODUCTS & INVENTORY
  // ============================================================================
  
  products: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        status: z.enum(["active", "draft", "archived"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return await db.getProducts(input);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getProduct(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        sku: z.string(),
        name: z.string(),
        description: z.string().optional(),
        price: z.string(),
        compareAtPrice: z.string().optional(),
        cost: z.string().optional(),
        imageUrl: z.string().optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createProduct(input);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.string().optional(),
        status: z.enum(["active", "draft", "archived"]).optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateProduct(input);
      }),
    
    inventory: protectedProcedure
      .input(z.object({ productId: z.string() }))
      .query(async ({ input }) => {
        return await db.getProductInventory(input.productId);
      }),
  }),

  // ============================================================================
  // ORDERS & FULFILLMENT
  // ============================================================================
  
  orders: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string().optional(),
        status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]).optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return await db.getOrders(input);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getOrder(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        orderNumber: z.string(),
        platformOrderId: z.string().optional(),
        customerName: z.string().optional(),
        customerEmail: z.string().optional(),
        shippingAddress: z.any(),
        billingAddress: z.any().optional(),
        subtotal: z.string(),
        tax: z.string().optional(),
        shipping: z.string().optional(),
        total: z.string(),
        currency: z.string().default("USD"),
        items: z.array(z.object({
          productId: z.string(),
          sku: z.string(),
          name: z.string(),
          quantity: z.number(),
          price: z.string(),
          total: z.string(),
        })),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createOrder(input);
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.string(),
        status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]),
      }))
      .mutation(async ({ input }) => {
        return await db.updateOrderStatus(input);
      }),
    
    items: protectedProcedure
      .input(z.object({ orderId: z.string() }))
      .query(async ({ input }) => {
        return await db.getOrderItems(input.orderId);
      }),
  }),

  // ============================================================================
  // WAREHOUSE & FULFILLMENT
  // ============================================================================
  
  warehouses: router({
    list: protectedProcedure.query(async () => {
      return await db.getWarehouses();
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getWarehouse(input.id);
      }),
    
    zones: protectedProcedure
      .input(z.object({ warehouseId: z.string() }))
      .query(async ({ input }) => {
        return await db.getZones(input.warehouseId);
      }),
    
    bins: protectedProcedure
      .input(z.object({ zoneId: z.string() }))
      .query(async ({ input }) => {
        return await db.getBins(input.zoneId);
      }),
  }),

  fulfillment: router({
    tasks: protectedProcedure
      .input(z.object({
        warehouseId: z.string().optional(),
        status: z.enum(["pending", "assigned", "in_progress", "completed", "failed"]).optional(),
        taskType: z.enum(["pick", "pack", "ship"]).optional(),
        limit: z.number().default(50),
      }))
      .query(async ({ input }) => {
        return await db.getFulfillmentTasks(input);
      }),
    
    createTask: protectedProcedure
      .input(z.object({
        orderId: z.string(),
        warehouseId: z.string(),
        taskType: z.enum(["pick", "pack", "ship"]),
        priority: z.number().default(1),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createFulfillmentTask(input);
      }),
    
    updateTask: protectedProcedure
      .input(z.object({
        id: z.string(),
        status: z.enum(["pending", "assigned", "in_progress", "completed", "failed"]),
        assignedTo: z.string().optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateFulfillmentTask(input);
      }),
  }),

  // ============================================================================
  // LIVE SHOPPING
  // ============================================================================
  
  live: router({
    sessions: protectedProcedure
      .input(z.object({
        channelId: z.string().optional(),
        status: z.enum(["scheduled", "live", "ended", "cancelled"]).optional(),
      }))
      .query(async ({ input }) => {
        return await db.getLiveSessions(input);
      }),
    
    getSession: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getLiveSession(input.id);
      }),
    
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await db.getLiveSessionBySlug(input.slug);
      }),
    
    createSession: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        slug: z.string(),
        title: z.string(),
        description: z.string().optional(),
        streamUrl: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        scheduledAt: z.date().optional(),
        creatorId: z.string().optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createLiveSession(input);
      }),
    
    updateSession: protectedProcedure
      .input(z.object({
        id: z.string(),
        status: z.enum(["scheduled", "live", "ended", "cancelled"]).optional(),
        viewerCount: z.number().optional(),
        streamUrl: z.string().optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateLiveSession(input);
      }),
    
    pinnedProducts: protectedProcedure
      .input(z.object({ liveSessionId: z.string() }))
      .query(async ({ input }) => {
        return await db.getPinnedProducts(input.liveSessionId);
      }),
    
    pinProduct: protectedProcedure
      .input(z.object({
        liveSessionId: z.string(),
        productId: z.string(),
        livePrice: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.pinProduct(input);
      }),
    
    unpinProduct: protectedProcedure
      .input(z.object({ pinnedProductId: z.string() }))
      .mutation(async ({ input }) => {
        return await db.unpinProduct(input.pinnedProductId);
      }),
    
    currentLive: publicProcedure.query(async () => {
      return await db.getCurrentLiveSession();
    }),
  }),

  // ============================================================================
  // CREATORS & ATTRIBUTION
  // ============================================================================
  
  creators: router({
    list: protectedProcedure
      .input(z.object({
        status: z.enum(["active", "inactive", "suspended"]).optional(),
      }))
      .query(async ({ input }) => {
        return await db.getCreators(input);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getCreator(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        commissionRate: z.string().optional(),
        socialLinks: z.any().optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createCreator(input);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        name: z.string().optional(),
        status: z.enum(["active", "inactive", "suspended"]).optional(),
        commissionRate: z.string().optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateCreator(input);
      }),
    
    payouts: protectedProcedure
      .input(z.object({ creatorId: z.string() }))
      .query(async ({ input }) => {
        return await db.getCreatorPayouts(input.creatorId);
      }),
  }),

  // ============================================================================
  // DISPUTES & PAYMENT
  // ============================================================================
  
  disputes: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string().optional(),
        status: z.enum(["open", "evidence_required", "evidence_building", "evidence_ready", "submitted", "won", "lost", "closed"]).optional(),
      }))
      .query(async ({ input }) => {
        return await db.getDisputes(input);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getDispute(input.id);
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.string(),
        status: z.enum(["open", "evidence_required", "evidence_building", "evidence_ready", "submitted", "won", "lost", "closed"]),
        needsManual: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateDisputeStatus(input);
      }),
  }),

  // ============================================================================
  // OPERATIONS & MONITORING
  // ============================================================================
  
  operations: router({
    reviewQueue: protectedProcedure
      .input(z.object({
        channelId: z.string().optional(),
        status: z.enum(["open", "acknowledged", "resolved", "closed"]).optional(),
        severity: z.enum(["low", "medium", "high", "critical"]).optional(),
      }))
      .query(async ({ input }) => {
        return await db.getReviewQueueItems(input);
      }),
    
    tasks: protectedProcedure
      .input(z.object({
        channelId: z.string().optional(),
        status: z.enum(["todo", "in_progress", "completed", "cancelled"]).optional(),
        assignedTo: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getTasks(input);
      }),
    
    createTask: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        taskType: z.string(),
        title: z.string(),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        assignedTo: z.string().optional(),
        dueAt: z.date().optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createTask(input);
      }),
    
    incidents: protectedProcedure
      .input(z.object({
        channelId: z.string().optional(),
        status: z.enum(["open", "investigating", "paused", "resolved", "closed"]).optional(),
      }))
      .query(async ({ input }) => {
        return await db.getIncidents(input);
      }),
    
    createIncident: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        incidentType: z.string(),
        severity: z.enum(["low", "medium", "high", "critical"]),
        title: z.string(),
        description: z.string().optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createIncident(input);
      }),
    
    dashboard: protectedProcedure.query(async () => {
      return await db.getOperationsDashboard();
    }),
  }),

  // ============================================================================
  // SETTLEMENTS & RECONCILIATION
  // ============================================================================
  
  settlements: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string().optional(),
        status: z.enum(["pending", "reconciled", "discrepancy"]).optional(),
      }))
      .query(async ({ input }) => {
        return await db.getSettlements(input);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getSettlement(input.id);
      }),
    
    import: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        platform: z.string(),
        settlementData: z.any(),
      }))
      .mutation(async ({ input }) => {
        return await db.importSettlement(input);
      }),
  }),

  // ============================================================================
  // SUPPLIERS & PROCUREMENT
  // ============================================================================
  
  suppliers: router({
    list: protectedProcedure
      .input(z.object({
        status: z.enum(["active", "suspended", "inactive"]).optional(),
      }))
      .query(async ({ input }) => {
        return await db.getSuppliers(input);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getSupplier(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        address: z.string().optional(),
        paymentTerms: z.string().optional(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createSupplier(input);
      }),
    
    purchaseOrders: protectedProcedure
      .input(z.object({ supplierId: z.string().optional() }))
      .query(async ({ input }) => {
        return await db.getPurchaseOrders(input);
      }),
  }),

  // ============================================================================
  // CHECKOUT & PAYMENTS
  // ============================================================================
  
  checkout: router({
    createSession: protectedProcedure
      .input(
        z.object({
          items: z.array(
            z.object({
              productId: z.string(),
              quantity: z.number().min(1),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Get product details for the items
        const productIds = input.items.map((item) => item.productId);
        const products = await Promise.all(
          productIds.map((id) => db.getProduct(id))
        );

        // Build items with names and prices
        const items = input.items.map((item) => {
          const product = products.find((p: any) => p?.id === item.productId);
          if (!product) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Product ${item.productId} not found`,
            });
          }
          return {
            productId: item.productId,
            quantity: item.quantity,
            name: product.name,
            price: product.price,
          };
        });

        // Create Stripe checkout session
        const session = await createCheckoutSession({
          items,
          userId: ctx.user.id.toString(),
          userEmail: ctx.user.email || "no-email@example.com",
          userName: ctx.user.name || undefined,
          origin: ctx.req.headers.origin || "http://localhost:3000",
        });

        return session;
      }),
  }),

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================
  
  analytics: router({
    overview: protectedProcedure
      .input(z.object({
        channelId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getAnalyticsOverview(input);
      }),
    
    sales: protectedProcedure
      .input(z.object({
        channelId: z.string().optional(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return await db.getSalesAnalytics(input);
      }),
    
    inventory: protectedProcedure
      .input(z.object({ warehouseId: z.string().optional() }))
      .query(async ({ input }) => {
        return await db.getInventoryAnalytics(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
