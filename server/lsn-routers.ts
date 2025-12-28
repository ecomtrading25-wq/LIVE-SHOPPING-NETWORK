/**
 * LSN tRPC Routers
 * Exposes all LSN business logic services via type-safe tRPC procedures
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from './_core/trpc';
import * as disputeService from './dispute-automation';
import * as liveShowService from './live-show-runner';
import * as creatorService from './creator-management';
import * as inventoryService from './inventory-purchasing';
import * as financialService from './financial-operations';
import * as pricingService from './pricing-promotions';
import * as skuService from './sku-profitability';

/**
 * Dispute Management Router
 */
export const disputeRouter = router({
  // Get all disputes with filters
  getDisputes: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      status: z.enum(['OPEN', 'EVIDENCE_REQUIRED', 'EVIDENCE_BUILDING', 'EVIDENCE_READY', 'SUBMITTED', 'WON', 'LOST', 'CLOSED', 'NEEDS_MANUAL', 'DUPLICATE', 'CANCELED']).optional(),
      provider: z.enum(['PAYPAL', 'STRIPE', 'WISE']).optional(),
      needsManual: z.boolean().optional(),
      limit: z.number().optional()
    }))
    .query(async ({ input }) => {
      return await disputeService.getDisputes(input.channelId, {
        status: input.status as any,
        provider: input.provider as any,
        needsManual: input.needsManual,
        limit: input.limit
      });
    }),

  // Get dispute timeline
  getTimeline: protectedProcedure
    .input(z.object({
      disputeId: z.string()
    }))
    .query(async ({ input }) => {
      return await disputeService.getDisputeTimeline(input.disputeId);
    }),

  // Submit evidence manually
  submitEvidence: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      disputeId: z.string()
    }))
    .mutation(async ({ input }) => {
      await disputeService.submitEvidenceToProvider(input.channelId, input.disputeId);
      return { success: true };
    }),

  // Mark as needs manual review
  markNeedsManual: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      disputeId: z.string(),
      reason: z.string()
    }))
    .mutation(async ({ input }) => {
      await disputeService.markDisputeNeedsManual(input.channelId, input.disputeId, input.reason);
      return { success: true };
    }),

  // Resolve manually
  resolveManually: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      disputeId: z.string(),
      outcome: z.enum(['WON', 'LOST']),
      notes: z.string()
    }))
    .mutation(async ({ input }) => {
      await disputeService.resolveDisputeManually(input.channelId, input.disputeId, input.outcome, input.notes);
      return { success: true };
    })
});

/**
 * Live Show Router
 */
export const liveShowRouter = router({
  // Schedule a show
  scheduleShow: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      creatorId: z.string(),
      broadcastChannelId: z.string(),
      title: z.string(),
      scheduledStartAt: z.date(),
      scheduledEndAt: z.date(),
      description: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      return await liveShowService.scheduleShow(
        input.channelId,
        input.creatorId,
        input.broadcastChannelId,
        input.title,
        input.scheduledStartAt,
        input.scheduledEndAt,
        input.description
      );
    }),

  // Start show
  startShow: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      showId: z.string(),
      streamUrl: z.string()
    }))
    .mutation(async ({ input }) => {
      return await liveShowService.startLiveShow(input.channelId, input.showId, input.streamUrl);
    }),

  // End show
  endShow: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      showId: z.string(),
      recordingUrl: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      return await liveShowService.endLiveShow(input.channelId, input.showId, input.recordingUrl);
    }),

  // Pin product
  pinProduct: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      showId: z.string(),
      productId: z.string(),
      displayPriceCents: z.number(),
      sortOrder: z.number().optional()
    }))
    .mutation(async ({ input }) => {
      return await liveShowService.pinProduct(
        input.channelId,
        input.showId,
        input.productId,
        input.displayPriceCents,
        input.sortOrder
      );
    }),

  // Unpin product
  unpinProduct: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      showId: z.string(),
      productId: z.string()
    }))
    .mutation(async ({ input }) => {
      await liveShowService.unpinProduct(input.channelId, input.showId, input.productId);
      return { success: true };
    }),

  // Execute price drop
  executePriceDrop: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      showId: z.string(),
      productId: z.string(),
      dropPriceCents: z.number(),
      durationSeconds: z.number(),
      maxQuantity: z.number().optional(),
      urgencyMessage: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      return await liveShowService.executePriceDrop(
        input.channelId,
        input.showId,
        input.productId,
        input.dropPriceCents,
        input.durationSeconds,
        input.maxQuantity,
        input.urgencyMessage
      );
    }),

  // Get current show state
  getCurrentState: publicProcedure
    .input(z.object({
      showId: z.string()
    }))
    .query(async ({ input }) => {
      return await liveShowService.getCurrentShowState(input.showId);
    }),

  // Get show statistics
  getStatistics: protectedProcedure
    .input(z.object({
      showId: z.string()
    }))
    .query(async ({ input }) => {
      return await liveShowService.getShowStatistics(input.showId);
    }),

  // Mark highlight
  markHighlight: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      showId: z.string(),
      timestampSeconds: z.number(),
      type: z.enum(['VIRAL_MOMENT', 'PRODUCT_DEMO', 'PRICE_DROP', 'CUSTOMER_REACTION', 'OTHER']),
      title: z.string(),
      description: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      return await liveShowService.markHighlight(
        input.channelId,
        input.showId,
        input.timestampSeconds,
        input.type,
        input.title,
        input.description
      );
    })
});

/**
 * Creator Management Router
 */
export const creatorRouter = router({
  // Get available schedule slots
  getAvailableSlots: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      startDate: z.date(),
      endDate: z.date()
    }))
    .query(async ({ input }) => {
      return await creatorService.getAvailableSlots(input.channelId, input.startDate, input.endDate);
    }),

  // Book schedule slot
  bookSlot: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      slotId: z.string(),
      creatorId: z.string()
    }))
    .mutation(async ({ input }) => {
      return await creatorService.bookScheduleSlot(input.channelId, input.slotId, input.creatorId);
    }),

  // Auto-fill schedule
  autoFillSchedule: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      startDate: z.date(),
      endDate: z.date()
    }))
    .mutation(async ({ input }) => {
      return await creatorService.autoFillSchedule(input.channelId, input.startDate, input.endDate);
    }),

  // Get creator leaderboard
  getLeaderboard: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      metric: z.enum(['revenue', 'shows', 'performance', 'viewers']).optional(),
      limit: z.number().optional()
    }))
    .query(async ({ input }) => {
      return await creatorService.getCreatorLeaderboard(input.channelId, input.metric, input.limit);
    }),

  // Get creator earnings
  getEarnings: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      creatorId: z.string(),
      periodStart: z.date(),
      periodEnd: z.date()
    }))
    .query(async ({ input }) => {
      return await creatorService.getCreatorEarnings(
        input.channelId,
        input.creatorId,
        input.periodStart,
        input.periodEnd
      );
    }),

  // Award bonus
  awardBonus: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      creatorId: z.string(),
      type: z.enum(['PERFORMANCE', 'MILESTONE', 'REFERRAL', 'SPECIAL']),
      amountCents: z.number(),
      reason: z.string(),
      periodStart: z.date(),
      periodEnd: z.date()
    }))
    .mutation(async ({ input }) => {
      return await creatorService.awardCreatorBonus(
        input.channelId,
        input.creatorId,
        input.type,
        input.amountCents,
        input.reason,
        input.periodStart,
        input.periodEnd
      );
    }),

  // Process payout
  processPayout: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      creatorId: z.string(),
      periodStart: z.date(),
      periodEnd: z.date()
    }))
    .mutation(async ({ input }) => {
      return await creatorService.processCreatorPayout(
        input.channelId,
        input.creatorId,
        input.periodStart,
        input.periodEnd
      );
    })
});

/**
 * Inventory & Purchasing Router
 */
export const inventoryRouter = router({
  // Create purchase order
  createPO: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      supplierId: z.string(),
      items: z.array(z.object({
        productId: z.string(),
        sku: z.string(),
        quantity: z.number(),
        unitCostCents: z.number()
      })),
      expectedDeliveryDate: z.date().optional(),
      shippingCostCents: z.number().optional(),
      customsDutyCents: z.number().optional(),
      otherFeesCents: z.number().optional(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      return await inventoryService.createPurchaseOrder(
        input.channelId,
        input.supplierId,
        input.items,
        input.expectedDeliveryDate,
        input.shippingCostCents,
        input.customsDutyCents,
        input.otherFeesCents,
        input.notes
      );
    }),

  // Start receiving
  startReceiving: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      poId: z.string(),
      receivedBy: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      return await inventoryService.startReceiving(input.channelId, input.poId, input.receivedBy);
    }),

  // Complete receiving
  completeReceiving: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      receivingId: z.string(),
      receivedItems: z.array(z.object({
        productId: z.string(),
        quantityReceived: z.number(),
        expiryDate: z.date().optional(),
        lotNumber: z.string().optional()
      })),
      qcPassed: z.boolean().optional(),
      qcNotes: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      await inventoryService.completeReceiving(
        input.channelId,
        input.receivingId,
        input.receivedItems,
        input.qcPassed,
        input.qcNotes
      );
      return { success: true };
    }),

  // Get inventory summary
  getSummary: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      productId: z.string()
    }))
    .query(async ({ input }) => {
      return await inventoryService.getInventorySummary(input.channelId, input.productId);
    }),

  // Get low stock products
  getLowStock: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      threshold: z.number().optional()
    }))
    .query(async ({ input }) => {
      return await inventoryService.getLowStockProducts(input.channelId, input.threshold);
    }),

  // Reserve inventory
  reserveInventory: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      orderId: z.string(),
      items: z.array(z.object({
        productId: z.string(),
        quantity: z.number()
      })),
      strategy: z.enum(['FIFO', 'FEFO', 'LIFO']).optional()
    }))
    .mutation(async ({ input }) => {
      await inventoryService.reserveInventory(
        input.channelId,
        input.orderId,
        input.items,
        input.strategy
      );
      return { success: true };
    })
});

/**
 * Financial Operations Router
 */
export const financialRouter = router({
  // Get channel balance
  getBalance: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      currency: z.string().optional()
    }))
    .query(async ({ input }) => {
      return await financialService.calculateChannelBalance(input.channelId, input.currency);
    }),

  // Get unmatched transactions
  getUnmatched: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      provider: z.enum(['PAYPAL', 'WISE', 'STRIPE', 'BANK']).optional()
    }))
    .query(async ({ input }) => {
      return await financialService.getUnmatchedTransactions(input.channelId, input.provider as any);
    }),

  // Get discrepancies
  getDiscrepancies: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      status: z.enum(['MATCHED', 'UNMATCHED', 'DISCREPANCY', 'MANUAL_REVIEW']).optional()
    }))
    .query(async ({ input }) => {
      return await financialService.getDiscrepancies(input.channelId, input.status as any);
    }),

  // Manually reconcile
  manuallyReconcile: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      transactionId: z.string(),
      ledgerEntryId: z.string(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      await financialService.manuallyReconcileTransaction(
        input.channelId,
        input.transactionId,
        input.ledgerEntryId,
        input.notes
      );
      return { success: true };
    }),

  // Get financial summary
  getSummary: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      startDate: z.date(),
      endDate: z.date()
    }))
    .query(async ({ input }) => {
      return await financialService.getFinancialSummary(input.channelId, input.startDate, input.endDate);
    }),

  // Create payout hold
  createHold: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      orderId: z.string(),
      reason: z.string(),
      holdUntil: z.date().optional()
    }))
    .mutation(async ({ input }) => {
      await financialService.createPayoutHold(input.channelId, input.orderId, input.reason, input.holdUntil);
      return { success: true };
    }),

  // Release hold
  releaseHold: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      orderId: z.string()
    }))
    .mutation(async ({ input }) => {
      await financialService.releasePayoutHold(input.channelId, input.orderId);
      return { success: true };
    })
});

/**
 * Pricing & Promotions Router
 */
export const pricingRouter = router({
  // Create price book
  createPriceBook: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      name: z.string(),
      effectiveFrom: z.date(),
      description: z.string().optional(),
      effectiveTo: z.date().optional()
    }))
    .mutation(async ({ input }) => {
      return await pricingService.createPriceBook(
        input.channelId,
        input.name,
        input.effectiveFrom,
        input.description,
        input.effectiveTo
      );
    }),

  // Activate price book
  activatePriceBook: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      priceBookId: z.string()
    }))
    .mutation(async ({ input }) => {
      await pricingService.activatePriceBook(input.channelId, input.priceBookId);
      return { success: true };
    }),

  // Get product price
  getProductPrice: publicProcedure
    .input(z.object({
      channelId: z.string(),
      productId: z.string()
    }))
    .query(async ({ input }) => {
      return await pricingService.getProductPrice(input.channelId, input.productId);
    }),

  // Create promotion
  createPromotion: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      code: z.string(),
      name: z.string(),
      type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'BOGO', 'BUNDLE', 'FREE_SHIPPING']),
      discountValue: z.number(),
      startDate: z.date(),
      endDate: z.date(),
      description: z.string().optional(),
      usageLimit: z.number().optional(),
      minPurchaseCents: z.number().optional(),
      maxDiscountCents: z.number().optional()
    }))
    .mutation(async ({ input }) => {
      return await pricingService.createPromotion(
        input.channelId,
        input.code,
        input.name,
        input.type,
        input.discountValue,
        input.startDate,
        input.endDate,
        {
          description: input.description,
          usageLimit: input.usageLimit,
          minPurchaseCents: input.minPurchaseCents,
          maxDiscountCents: input.maxDiscountCents
        }
      );
    }),

  // Apply promotion
  applyPromotion: publicProcedure
    .input(z.object({
      channelId: z.string(),
      promotionCode: z.string(),
      cartTotalCents: z.number(),
      cartItems: z.array(z.object({
        productId: z.string(),
        quantity: z.number(),
        priceCents: z.number()
      }))
    }))
    .mutation(async ({ input }) => {
      return await pricingService.applyPromotion(
        input.channelId,
        input.promotionCode,
        input.cartTotalCents,
        input.cartItems
      );
    }),

  // Create bundle
  createBundle: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      name: z.string(),
      bundlePriceCents: z.number(),
      items: z.array(z.object({
        productId: z.string(),
        quantity: z.number()
      })),
      description: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }))
    .mutation(async ({ input }) => {
      return await pricingService.createBundle(
        input.channelId,
        input.name,
        input.bundlePriceCents,
        input.items,
        input.description,
        input.startDate,
        input.endDate
      );
    }),

  // Get active bundles
  getActiveBundles: publicProcedure
    .input(z.object({
      channelId: z.string()
    }))
    .query(async ({ input }) => {
      return await pricingService.getActiveBundles(input.channelId);
    })
});

/**
 * SKU Profitability Router
 */
export const skuRouter = router({
  // Calculate profitability
  calculateProfitability: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      productId: z.string(),
      periodStart: z.date(),
      periodEnd: z.date()
    }))
    .mutation(async ({ input }) => {
      return await skuService.calculateSKUProfitability(
        input.channelId,
        input.productId,
        input.periodStart,
        input.periodEnd
      );
    }),

  // Get top performing SKUs
  getTopPerforming: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      metric: z.enum(['profit', 'margin', 'velocity', 'score']).optional(),
      limit: z.number().optional()
    }))
    .query(async ({ input }) => {
      return await skuService.getTopPerformingSKUs(input.channelId, input.metric, input.limit);
    }),

  // Get SKUs at risk
  getAtRisk: protectedProcedure
    .input(z.object({
      channelId: z.string()
    }))
    .query(async ({ input }) => {
      return await skuService.getSKUsAtRisk(input.channelId);
    }),

  // Calculate greenlight score
  calculateGreenlight: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      estimatedDemandUnitsPerMonth: z.number(),
      estimatedPriceCents: z.number(),
      estimatedCostCents: z.number(),
      competitorCount: z.number(),
      supplierRating: z.number().min(1).max(5),
      trendScore: z.number().min(0).max(100)
    }))
    .mutation(async ({ input }) => {
      return await skuService.calculateGreenlightScore(input.channelId, {
        estimatedDemandUnitsPerMonth: input.estimatedDemandUnitsPerMonth,
        estimatedPriceCents: input.estimatedPriceCents,
        estimatedCostCents: input.estimatedCostCents,
        competitorCount: input.competitorCount,
        supplierRating: input.supplierRating,
        trendScore: input.trendScore
      });
    }),

  // Weekly pruning
  weeklyPruning: protectedProcedure
    .input(z.object({
      channelId: z.string()
    }))
    .mutation(async ({ input }) => {
      return await skuService.weeklySkuPruning(input.channelId);
    })
});

/**
 * Main LSN Router - combines all sub-routers
 */
export const lsnRouter = router({
  disputes: disputeRouter,
  liveShows: liveShowRouter,
  creators: creatorRouter,
  inventory: inventoryRouter,
  financial: financialRouter,
  pricing: pricingRouter,
  sku: skuRouter
});

export type LSNRouter = typeof lsnRouter;
