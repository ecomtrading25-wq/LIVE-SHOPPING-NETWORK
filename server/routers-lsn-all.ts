/**
 * LSN COMPREHENSIVE tRPC ROUTERS
 * Integrates all LSN systems with existing schema
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import purchasingOps from "./lsn-purchasing-supplier-os";
import creatorOps from "./lsn-creator-economy-scheduling";
import fraudOps from "./lsn-fraud-financial-ops";
import executiveOps from "./lsn-executive-dashboard-bi";

export const lsnPurchasingRouter = router({
  onboardSupplier: protectedProcedure
    .input(z.object({
      name: z.string(),
      contactName: z.string(),
      contactEmail: z.string().email(),
      contactPhone: z.string(),
      address: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      country: z.string(),
      taxId: z.string(),
      paymentTerms: z.string(),
      currency: z.string(),
      leadTimeDays: z.number(),
      minimumOrderValue: z.number(),
      shippingMethods: z.array(z.string()),
      certifications: z.array(z.string()),
      productCategories: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      return await purchasingOps.onboardSupplier(input);
    }),

  getSupplierScorecard: protectedProcedure
    .input(z.object({ supplierId: z.number() }))
    .query(async ({ input }) => {
      return await purchasingOps.getSupplierScorecard(input.supplierId);
    }),

  generatePurchaseOrder: protectedProcedure
    .input(z.object({
      supplierId: z.number(),
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number(),
        unitCost: z.number(),
        expectedDeliveryDate: z.string(),
      })),
      shippingMethod: z.string(),
      shippingCost: z.number(),
      taxAmount: z.number(),
      notes: z.string().optional(),
      urgency: z.enum(["standard", "rush", "critical"]),
    }))
    .mutation(async ({ input }) => {
      return await purchasingOps.generatePurchaseOrder(input);
    }),

  runAutomatedReorder: protectedProcedure
    .mutation(async () => {
      return await purchasingOps.runAutomatedReorderSystem();
    }),

  recordQualityInspection: protectedProcedure
    .input(z.object({
      purchaseOrderId: z.number(),
      inspectorId: z.number(),
      inspectionDate: z.string(),
      passedItems: z.number(),
      failedItems: z.number(),
      defectTypes: z.array(z.string()),
      notes: z.string(),
      photos: z.array(z.string()),
      disposition: z.enum(["accept", "reject", "conditional_accept"]),
    }))
    .mutation(async ({ input }) => {
      return await purchasingOps.recordQualityInspection(input);
    }),

  calculateLandedCost: protectedProcedure
    .input(z.object({
      productCost: z.number(),
      quantity: z.number(),
      shippingCost: z.number(),
      country: z.string(),
      hsCode: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return purchasingOps.calculateLandedCost(
        input.productCost,
        input.quantity,
        input.shippingCost,
        input.country,
        input.hsCode
      );
    }),

  getPurchasingAnalytics: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      return await purchasingOps.getPurchasingAnalytics(
        new Date(input.startDate),
        new Date(input.endDate)
      );
    }),
});

export const lsnCreatorRouter = router({
  onboardCreator: protectedProcedure
    .input(z.object({
      userId: z.number(),
      stageName: z.string(),
      bio: z.string(),
      socialMedia: z.object({
        tiktok: z.string().optional(),
        instagram: z.string().optional(),
        youtube: z.string().optional(),
        twitter: z.string().optional(),
      }),
      niches: z.array(z.string()),
      languages: z.array(z.string()),
      timezone: z.string(),
      availableHours: z.object({
        monday: z.array(z.string()),
        tuesday: z.array(z.string()),
        wednesday: z.array(z.string()),
        thursday: z.array(z.string()),
        friday: z.array(z.string()),
        saturday: z.array(z.string()),
        sunday: z.array(z.string()),
      }),
      equipment: z.object({
        camera: z.string(),
        microphone: z.string(),
        lighting: z.string(),
        internet: z.string(),
      }),
    }))
    .mutation(async ({ input }) => {
      return await creatorOps.onboardCreator(input);
    }),

  createBroadcastSchedule: protectedProcedure
    .input(z.object({
      creatorId: z.number(),
      startTime: z.string(),
      endTime: z.string(),
      title: z.string(),
      description: z.string(),
      productIds: z.array(z.number()),
      targetRevenue: z.number(),
      isRecurring: z.boolean(),
      recurrencePattern: z.enum(["daily", "weekly", "biweekly", "monthly"]).optional(),
    }))
    .mutation(async ({ input }) => {
      return await creatorOps.createBroadcastSchedule(input);
    }),

  generateOptimal24x7Schedule: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await creatorOps.generateOptimal24x7Schedule(
        new Date(input.startDate),
        new Date(input.endDate)
      );
    }),

  startLiveShow: protectedProcedure
    .input(z.object({ scheduleId: z.number() }))
    .mutation(async ({ input }) => {
      return await creatorOps.startLiveShow(input.scheduleId);
    }),

  endLiveShow: protectedProcedure
    .input(z.object({ showId: z.number() }))
    .mutation(async ({ input }) => {
      return await creatorOps.endLiveShow(input.showId);
    }),

  calculateCreatorPayout: protectedProcedure
    .input(z.object({
      creatorId: z.number(),
      periodStart: z.string(),
      periodEnd: z.string(),
    }))
    .query(async ({ input }) => {
      return await creatorOps.calculateCreatorPayout(
        input.creatorId,
        new Date(input.periodStart),
        new Date(input.periodEnd)
      );
    }),

  processAllPayouts: protectedProcedure
    .input(z.object({
      periodStart: z.string(),
      periodEnd: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await creatorOps.processAllCreatorPayouts(
        new Date(input.periodStart),
        new Date(input.periodEnd)
      );
    }),

  getCreatorDashboard: protectedProcedure
    .input(z.object({
      creatorId: z.number(),
      days: z.number().default(30),
    }))
    .query(async ({ input }) => {
      return await creatorOps.getCreatorDashboard(input.creatorId, input.days);
    }),
});

export const lsnFraudRouter = router({
  performFraudCheck: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input }) => {
      return await fraudOps.performFraudCheck(input.orderId);
    }),

  batchFraudCheck: protectedProcedure
    .input(z.object({ orderIds: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      return await fraudOps.batchFraudCheck(input.orderIds);
    }),

  createDispute: protectedProcedure
    .input(z.object({
      transactionId: z.number(),
      disputeType: z.enum(["chargeback", "refund_request", "item_not_received", "not_as_described"]),
      amount: z.number(),
      customerReason: z.string(),
      disputeDate: z.string(),
      deadline: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await fraudOps.createDispute(input);
    }),

  generateEvidencePack: protectedProcedure
    .input(z.object({
      disputeId: z.number(),
      trackingNumber: z.string().optional(),
      deliveryConfirmation: z.string().optional(),
      customerCommunication: z.array(z.string()),
      productDescription: z.string(),
      photos: z.array(z.string()),
      invoices: z.array(z.string()),
      termsAcceptance: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await fraudOps.generateEvidencePack(input);
    }),

  autoRespondToDispute: protectedProcedure
    .input(z.object({ disputeId: z.number() }))
    .mutation(async ({ input }) => {
      return await fraudOps.autoRespondToDispute(input.disputeId);
    }),

  predictChargebackRisk: protectedProcedure
    .input(z.object({ transactionId: z.number() }))
    .query(async ({ input }) => {
      return await fraudOps.predictChargebackRisk(input.transactionId);
    }),

  getFinancialDashboard: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      return await fraudOps.getFinancialDashboard(
        new Date(input.startDate),
        new Date(input.endDate)
      );
    }),
});

export const lsnExecutiveRouter = router({
  getExecutiveKPIs: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      return await executiveOps.getExecutiveKPIs(
        new Date(input.startDate),
        new Date(input.endDate)
      );
    }),
});

