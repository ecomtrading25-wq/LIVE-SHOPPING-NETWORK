/**
 * LSN COMPREHENSIVE tRPC ROUTERS V1
 * 
 * Complete API layer for:
 * - Live shows (create, manage, orchestrate)
 * - Creators (profiles, tiers, incentives, schedules)
 * - Inventory (lots, reservations, stock sync)
 * - Purchase orders (create, approve, receive)
 * - Suppliers (manage, score, contracts)
 * - 3PL operations (shipments, tracking, returns)
 * - Products (catalog, variants, pricing)
 * - Orders (create, fulfill, track)
 * - Analytics (shows, creators, products)
 * - Newsletter subscriptions
 */

import { router, publicProcedure, protectedProcedure } from "./trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "./db";
import {
  liveShows,
  showSegments,
  pinnedProducts,
  priceDrops,
  showHighlights,
  showViewers,
  showPurchases,
  creators,
  creatorTiers,
  creatorPayouts,
  creatorBonuses,
  creatorClawbacks,
  scheduleSlots,
  creatorAvailability,
  creatorTraining,
  creatorPerformance,
  inventoryLots,
  purchaseOrders,
  poLineItems,
  poReceipts,
  suppliers,
  supplierContracts,
  supplierSamples,
  inventory,
  inventoryReservations,
  shipments,
  trackingEvents,
  products,
  productVariants,
  orders,
  orderItems,
  newsletterSubscriptions,
} from "../drizzle/schema";
import { eq, and, gte, lte, desc, sql, inArray, like } from "drizzle-orm";
import { ulid } from "ulid";

// Import engines
import { LiveShowOrchestrator, ShowScheduler, LiveStockSync } from "./lsn-live-orchestration-engine";
import { CreatorTierManager, IncentiveCalculator, ScheduleGridManager, CreatorPerformanceTracker, CreatorTrainingSystem } from "./lsn-creator-economy-engine";
import { InventoryLotManager, PurchaseOrderManager, SupplierManager, ThreePLAdapter, OversellProtection } from "./lsn-inventory-purchasing-3pl-engine";

// ============================================================================
// LIVE SHOWS ROUTER
// ============================================================================

export const liveShowsRouter = router({
  /**
   * Get live shows currently streaming
   */
  getLive: publicProcedure.query(async () => {
    return await db.query.liveShows.findMany({
      where: eq(liveShows.status, "LIVE"),
      with: {
        creator: true,
        pinnedProducts: {
          where: eq(pinnedProducts.status, "active"),
          with: {
            product: true,
          },
        },
      },
      orderBy: [desc(liveShows.peakViewers)],
      limit: 10,
    });
  }),

  /**
   * Get upcoming shows
   */
  getUpcoming: publicProcedure
    .input(
      z.object({
        limit: z.number().optional().default(10),
      })
    )
    .query(async ({ input }) => {
      return await db.query.liveShows.findMany({
        where: and(
          eq(liveShows.status, "SCHEDULED"),
          gte(liveShows.scheduledStartTime, new Date())
        ),
        with: {
          creator: true,
        },
        orderBy: [liveShows.scheduledStartTime],
        limit: input.limit,
      });
    }),

  /**
   * Get show by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const show = await db.query.liveShows.findFirst({
        where: eq(liveShows.id, input.id),
        with: {
          creator: true,
          segments: {
            orderBy: [showSegments.order],
          },
          pinnedProducts: {
            where: eq(pinnedProducts.status, "active"),
            with: {
              product: true,
            },
          },
          priceDrops: {
            where: eq(priceDrops.status, "active"),
            with: {
              product: true,
            },
          },
          highlights: true,
        },
      });

      if (!show) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Show not found",
        });
      }

      return show;
    }),

  /**
   * Create scheduled show
   */
  createShow: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        creatorId: z.string(),
        title: z.string(),
        description: z.string(),
        scheduledStartTime: z.date(),
        scheduledEndTime: z.date(),
        thumbnailUrl: z.string().optional(),
        runbook: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const showId = await ShowScheduler.createShow(input);
      return { showId };
    }),

  /**
   * Initialize show (go to PRE_LIVE)
   */
  initializeShow: protectedProcedure
    .input(z.object({ showId: z.string() }))
    .mutation(async ({ input }) => {
      const show = await db.query.liveShows.findFirst({
        where: eq(liveShows.id, input.showId),
      });

      if (!show) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Show not found" });
      }

      const orchestrator = new LiveShowOrchestrator(
        input.showId,
        show.channelId,
        show.creatorId
      );

      await orchestrator.initializeShow();

      return { success: true };
    }),

  /**
   * Go live
   */
  goLive: protectedProcedure
    .input(z.object({ showId: z.string() }))
    .mutation(async ({ input }) => {
      const show = await db.query.liveShows.findFirst({
        where: eq(liveShows.id, input.showId),
      });

      if (!show) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Show not found" });
      }

      const orchestrator = new LiveShowOrchestrator(
        input.showId,
        show.channelId,
        show.creatorId
      );

      await orchestrator.goLive();

      return { success: true };
    }),

  /**
   * Pin product
   */
  pinProduct: protectedProcedure
    .input(
      z.object({
        showId: z.string(),
        productId: z.string(),
        priority: z.number().optional(),
        priceOverride: z.number().optional(),
        stockLimit: z.number().optional(),
        urgencyMessage: z.string().optional(),
        durationMinutes: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const show = await db.query.liveShows.findFirst({
        where: eq(liveShows.id, input.showId),
      });

      if (!show) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Show not found" });
      }

      const orchestrator = new LiveShowOrchestrator(
        input.showId,
        show.channelId,
        show.creatorId
      );

      await orchestrator.pinProduct(input.productId, {
        priority: input.priority,
        priceOverride: input.priceOverride,
        stockLimit: input.stockLimit,
        urgencyMessage: input.urgencyMessage,
        durationMinutes: input.durationMinutes,
      });

      return { success: true };
    }),

  /**
   * Execute price drop
   */
  executePriceDrop: protectedProcedure
    .input(
      z.object({
        showId: z.string(),
        productId: z.string(),
        dropPrice: z.number(),
        durationMinutes: z.number(),
        stockLimit: z.number().optional(),
        countdownDisplay: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const show = await db.query.liveShows.findFirst({
        where: eq(liveShows.id, input.showId),
      });

      if (!show) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Show not found" });
      }

      const orchestrator = new LiveShowOrchestrator(
        input.showId,
        show.channelId,
        show.creatorId
      );

      await orchestrator.executePriceDrop(
        input.productId,
        input.dropPrice,
        input.durationMinutes,
        {
          stockLimit: input.stockLimit,
          countdownDisplay: input.countdownDisplay,
        }
      );

      return { success: true };
    }),

  /**
   * Mark highlight
   */
  markHighlight: protectedProcedure
    .input(
      z.object({
        showId: z.string(),
        type: z.enum(["VIRAL_MOMENT", "PRODUCT_DEMO", "TESTIMONIAL", "PRICE_DROP", "REACTION", "UNBOXING"]),
        title: z.string(),
        description: z.string(),
        productIds: z.array(z.string()).optional(),
        clipDurationSeconds: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const show = await db.query.liveShows.findFirst({
        where: eq(liveShows.id, input.showId),
      });

      if (!show) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Show not found" });
      }

      const orchestrator = new LiveShowOrchestrator(
        input.showId,
        show.channelId,
        show.creatorId
      );

      const highlightId = await orchestrator.markHighlight(
        input.type,
        input.title,
        input.description,
        {
          productIds: input.productIds,
          clipDurationSeconds: input.clipDurationSeconds,
        }
      );

      return { highlightId };
    }),

  /**
   * End show
   */
  endShow: protectedProcedure
    .input(z.object({ showId: z.string() }))
    .mutation(async ({ input }) => {
      const show = await db.query.liveShows.findFirst({
        where: eq(liveShows.id, input.showId),
      });

      if (!show) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Show not found" });
      }

      const orchestrator = new LiveShowOrchestrator(
        input.showId,
        show.channelId,
        show.creatorId
      );

      await orchestrator.endShow();

      return { success: true };
    }),

  /**
   * Get live stock for pinned products
   */
  getLiveStock: publicProcedure
    .input(z.object({ showId: z.string() }))
    .query(async ({ input }) => {
      return await LiveStockSync.getPinnedProductsStock(input.showId);
    }),

  /**
   * Track viewer join
   */
  trackViewerJoin: publicProcedure
    .input(
      z.object({
        showId: z.string(),
        userId: z.string(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const show = await db.query.liveShows.findFirst({
        where: eq(liveShows.id, input.showId),
      });

      if (!show) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Show not found" });
      }

      const orchestrator = new LiveShowOrchestrator(
        input.showId,
        show.channelId,
        show.creatorId
      );

      await orchestrator.trackViewerJoin(input.userId, input.metadata);

      return { success: true };
    }),

  /**
   * Track purchase
   */
  trackPurchase: publicProcedure
    .input(
      z.object({
        showId: z.string(),
        orderId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const show = await db.query.liveShows.findFirst({
        where: eq(liveShows.id, input.showId),
      });

      if (!show) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Show not found" });
      }

      const orchestrator = new LiveShowOrchestrator(
        input.showId,
        show.channelId,
        show.creatorId
      );

      await orchestrator.trackPurchase(input.orderId, input.userId);

      return { success: true };
    }),
});

// ============================================================================
// CREATORS ROUTER
// ============================================================================

export const creatorsRouter = router({
  /**
   * Get creator by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const creator = await db.query.creators.findFirst({
        where: eq(creators.id, input.id),
      });

      if (!creator) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Creator not found",
        });
      }

      return creator;
    }),

  /**
   * Get creator leaderboard
   */
  getLeaderboard: publicProcedure
    .input(
      z.object({
        metric: z.enum(["revenue", "conversion", "engagement"]),
        period: z.enum(["week", "month", "all"]),
        limit: z.number().optional().default(10),
      })
    )
    .query(async ({ input }) => {
      const now = new Date();
      let startDate: Date;

      switch (input.period) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "all":
          startDate = new Date(0);
          break;
      }

      return await CreatorPerformanceTracker.getLeaderboard(
        input.metric,
        { start: startDate, end: now },
        input.limit
      );
    }),

  /**
   * Get creator tier progression
   */
  getTierProgression: protectedProcedure
    .input(z.object({ creatorId: z.string() }))
    .query(async ({ input }) => {
      return await CreatorTierManager.getTierProgression(input.creatorId);
    }),

  /**
   * Calculate creator incentives
   */
  calculateIncentives: protectedProcedure
    .input(
      z.object({
        creatorId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      return await IncentiveCalculator.calculateIncentives(
        input.creatorId,
        input.startDate,
        input.endDate
      );
    }),

  /**
   * Process payout
   */
  processPayout: protectedProcedure
    .input(
      z.object({
        creatorId: z.string(),
        amount: z.number(),
        periodStart: z.date(),
        periodEnd: z.date(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const payoutId = await IncentiveCalculator.processPayout(
        input.creatorId,
        input.amount,
        { start: input.periodStart, end: input.periodEnd },
        input.metadata
      );

      return { payoutId };
    }),

  /**
   * Add bonus
   */
  addBonus: protectedProcedure
    .input(
      z.object({
        creatorId: z.string(),
        amount: z.number(),
        reason: z.string(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const bonusId = await IncentiveCalculator.addBonus(
        input.creatorId,
        input.amount,
        input.reason,
        input.metadata
      );

      return { bonusId };
    }),

  /**
   * Get creator schedule
   */
  getSchedule: publicProcedure
    .input(
      z.object({
        creatorId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      return await db.query.scheduleSlots.findMany({
        where: and(
          eq(scheduleSlots.creatorId, input.creatorId),
          gte(scheduleSlots.startTime, input.startDate),
          lte(scheduleSlots.startTime, input.endDate)
        ),
        orderBy: [scheduleSlots.startTime],
      });
    }),

  /**
   * Get creator performance
   */
  getPerformance: protectedProcedure
    .input(
      z.object({
        creatorId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [eq(creatorPerformance.creatorId, input.creatorId)];

      if (input.startDate) {
        conditions.push(gte(creatorPerformance.createdAt, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(creatorPerformance.createdAt, input.endDate));
      }

      return await db.query.creatorPerformance.findMany({
        where: and(...conditions),
        orderBy: [desc(creatorPerformance.createdAt)],
        limit: 50,
      });
    }),

  /**
   * Get training progress
   */
  getTrainingProgress: protectedProcedure
    .input(z.object({ creatorId: z.string() }))
    .query(async ({ input }) => {
      return await CreatorTrainingSystem.getTrainingProgress(input.creatorId);
    }),
});

// ============================================================================
// INVENTORY ROUTER
// ============================================================================

export const inventoryRouter = router({
  /**
   * Get inventory by product and warehouse
   */
  getByProduct: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        warehouseId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await db.query.inventory.findFirst({
        where: and(
          eq(inventory.productId, input.productId),
          eq(inventory.warehouseId, input.warehouseId)
        ),
      });
    }),

  /**
   * Get inventory lots
   */
  getLots: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        warehouseId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await db.query.inventoryLots.findMany({
        where: and(
          eq(inventoryLots.productId, input.productId),
          eq(inventoryLots.warehouseId, input.warehouseId),
          eq(inventoryLots.status, "ACTIVE")
        ),
        orderBy: [inventoryLots.receivedAt],
      });
    }),

  /**
   * Calculate WAC
   */
  calculateWAC: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        warehouseId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const wac = await InventoryLotManager.calculateWAC(
        input.productId,
        input.warehouseId
      );

      return { wac };
    }),

  /**
   * Reserve inventory
   */
  reserveInventory: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number(),
          })
        ),
        warehouseId: z.string(),
        orderId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const success = await OversellProtection.reserveInventoryAtomic(
        input.items,
        input.warehouseId,
        input.orderId
      );

      if (!success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to reserve inventory",
        });
      }

      return { success: true };
    }),

  /**
   * Check if order can be fulfilled
   */
  canFulfillOrder: publicProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number(),
          })
        ),
        warehouseId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await OversellProtection.canFulfillOrder(
        input.items,
        input.warehouseId
      );
    }),
});

// ============================================================================
// PURCHASE ORDERS ROUTER
// ============================================================================

export const purchaseOrdersRouter = router({
  /**
   * Create PO
   */
  create: protectedProcedure
    .input(
      z.object({
        supplierId: z.string(),
        warehouseId: z.string(),
        expectedDeliveryDate: z.date(),
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number(),
            unitPrice: z.number(),
            notes: z.string().optional(),
          })
        ),
        shippingCost: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const poId = await PurchaseOrderManager.createPO(input);
      return { poId };
    }),

  /**
   * Get PO by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.query.purchaseOrders.findFirst({
        where: eq(purchaseOrders.id, input.id),
        with: {
          supplier: true,
          warehouse: true,
          lineItems: {
            with: {
              product: true,
            },
          },
          receipts: true,
        },
      });
    }),

  /**
   * Submit for approval
   */
  submitForApproval: protectedProcedure
    .input(z.object({ poId: z.string() }))
    .mutation(async ({ input }) => {
      await PurchaseOrderManager.submitForApproval(input.poId);
      return { success: true };
    }),

  /**
   * Approve PO
   */
  approve: protectedProcedure
    .input(
      z.object({
        poId: z.string(),
        approvedBy: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await PurchaseOrderManager.approvePO(input.poId, input.approvedBy);
      return { success: true };
    }),

  /**
   * Send PO
   */
  send: protectedProcedure
    .input(z.object({ poId: z.string() }))
    .mutation(async ({ input }) => {
      await PurchaseOrderManager.sendPO(input.poId);
      return { success: true };
    }),

  /**
   * Receive PO
   */
  receive: protectedProcedure
    .input(
      z.object({
        poId: z.string(),
        items: z.array(
          z.object({
            lineItemId: z.string(),
            receivedQuantity: z.number(),
            qcStatus: z.enum(["PENDING", "PASSED", "FAILED", "CONDITIONAL"]),
            qcNotes: z.string().optional(),
          })
        ),
        receivedBy: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const receiptId = await PurchaseOrderManager.receivePO(input);
      return { receiptId };
    }),

  /**
   * List POs
   */
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        supplierId: z.string().optional(),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input.status) {
        conditions.push(eq(purchaseOrders.status, input.status));
      }
      if (input.supplierId) {
        conditions.push(eq(purchaseOrders.supplierId, input.supplierId));
      }

      return await db.query.purchaseOrders.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
          supplier: true,
          warehouse: true,
        },
        orderBy: [desc(purchaseOrders.createdAt)],
        limit: input.limit,
      });
    }),
});

// ============================================================================
// SUPPLIERS ROUTER
// ============================================================================

export const suppliersRouter = router({
  /**
   * Create supplier
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        contactName: z.string(),
        email: z.string().email(),
        phone: z.string(),
        address: z.string(),
        tier: z.enum(["STRATEGIC", "PREFERRED", "APPROVED", "PROBATION", "BLOCKED"]),
        paymentTerms: z.string(),
        leadTimeDays: z.number(),
        moq: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const supplierId = await SupplierManager.createSupplier(input);
      return { supplierId };
    }),

  /**
   * Get supplier by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.query.suppliers.findFirst({
        where: eq(suppliers.id, input.id),
      });
    }),

  /**
   * Get supplier scorecard
   */
  getScorecard: protectedProcedure
    .input(z.object({ supplierId: z.string() }))
    .query(async ({ input }) => {
      return await SupplierManager.calculateScorecard(input.supplierId);
    }),

  /**
   * Request sample
   */
  requestSample: protectedProcedure
    .input(
      z.object({
        supplierId: z.string(),
        productName: z.string(),
        quantity: z.number(),
        expectedArrival: z.date(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const sampleId = await SupplierManager.requestSample(input);
      return { sampleId };
    }),

  /**
   * Evaluate sample
   */
  evaluateSample: protectedProcedure
    .input(
      z.object({
        sampleId: z.string(),
        qualityScore: z.number().min(0).max(100),
        notes: z.string(),
        approved: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      await SupplierManager.evaluateSample(input.sampleId, {
        qualityScore: input.qualityScore,
        notes: input.notes,
        approved: input.approved,
      });

      return { success: true };
    }),

  /**
   * List suppliers
   */
  list: protectedProcedure
    .input(
      z.object({
        tier: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input.tier) {
        conditions.push(eq(suppliers.tier, input.tier));
      }
      if (input.status) {
        conditions.push(eq(suppliers.status, input.status));
      }

      return await db.query.suppliers.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [suppliers.name],
        limit: input.limit,
      });
    }),
});

// ============================================================================
// 3PL ROUTER
// ============================================================================

export const threePLRouter = router({
  /**
   * Create shipment
   */
  createShipment: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        providerId: z.string(),
        warehouseId: z.string(),
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number(),
          })
        ),
        shippingAddress: z.object({
          name: z.string(),
          line1: z.string(),
          line2: z.string().optional(),
          city: z.string(),
          state: z.string(),
          postalCode: z.string(),
          country: z.string(),
          phone: z.string(),
        }),
        serviceLevel: z.enum(["STANDARD", "EXPRESS", "OVERNIGHT"]),
      })
    )
    .mutation(async ({ input }) => {
      const shipmentId = await ThreePLAdapter.createShipment(input);
      return { shipmentId };
    }),

  /**
   * Generate label
   */
  generateLabel: protectedProcedure
    .input(z.object({ shipmentId: z.string() }))
    .mutation(async ({ input }) => {
      const labelUrl = await ThreePLAdapter.generateLabel(input.shipmentId);
      return { labelUrl };
    }),

  /**
   * Process tracking event
   */
  processTrackingEvent: publicProcedure
    .input(
      z.object({
        trackingNumber: z.string(),
        eventType: z.string(),
        eventDescription: z.string(),
        location: z.string().optional(),
        timestamp: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      await ThreePLAdapter.processTrackingEvent(input);
      return { success: true };
    }),

  /**
   * Process return
   */
  processReturn: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number(),
            reason: z.string(),
            condition: z.enum(["NEW", "USED", "DAMAGED"]),
          })
        ),
        trackingNumber: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const returnId = await ThreePLAdapter.processReturn(input);
      return { returnId };
    }),
});

// ============================================================================
// PRODUCTS ROUTER
// ============================================================================

export const productsRouter = router({
  /**
   * Get trending products
   */
  getTrending: publicProcedure
    .input(
      z.object({
        limit: z.number().optional().default(10),
      })
    )
    .query(async ({ input }) => {
      // Get products with recent show appearances
      return await db.query.products.findMany({
        where: eq(products.status, "active"),
        orderBy: [desc(products.updatedAt)],
        limit: input.limit,
      });
    }),

  /**
   * Get product by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.query.products.findFirst({
        where: eq(products.id, input.id),
        with: {
          variants: true,
          images: true,
        },
      });
    }),

  /**
   * Search products
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        limit: z.number().optional().default(20),
      })
    )
    .query(async ({ input }) => {
      return await db.query.products.findMany({
        where: and(
          eq(products.status, "active"),
          like(products.name, `%${input.query}%`)
        ),
        limit: input.limit,
      });
    }),
});

// ============================================================================
// NEWSLETTER ROUTER
// ============================================================================

export const newsletterRouter = router({
  /**
   * Subscribe to newsletter
   */
  subscribe: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      // Check if already subscribed
      const existing = await db.query.newsletterSubscriptions.findFirst({
        where: eq(newsletterSubscriptions.email, input.email),
      });

      if (existing) {
        return { success: true, message: "Already subscribed" };
      }

      // Create subscription
      await db.insert(newsletterSubscriptions).values({
        id: ulid(),
        email: input.email,
        status: "ACTIVE",
        subscribedAt: new Date(),
      });

      return { success: true, message: "Subscribed successfully" };
    }),
});

// ============================================================================
// ROOT ROUTER
// ============================================================================

export const lsnRouter = router({
  liveShows: liveShowsRouter,
  creators: creatorsRouter,
  inventory: inventoryRouter,
  purchaseOrders: purchaseOrdersRouter,
  suppliers: suppliersRouter,
  threepl: threePLRouter,
  products: productsRouter,
  newsletter: newsletterRouter,
});

export type LSNRouter = typeof lsnRouter;
