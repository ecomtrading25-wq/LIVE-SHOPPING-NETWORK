import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDbSync } from "./db";
import { eq, and, desc, sql, inArray, gte, lte, isNull } from "drizzle-orm";
import {
  orders,
  orderItems,
  shipments,
  disputes,
} from "../drizzle/schema";
import { randomBytes } from "crypto";

/**
 * LSN Disputes & Reconciliation Router
 * 
 * Comprehensive dispute automation and financial reconciliation:
 * - PayPal dispute webhook handling
 * - Evidence pack builder with auto-submission
 * - Dispute state machine management
 * - Provider transaction ingestion
 * - Auto-match reconciliation
 * - Discrepancy detection and resolution
 * - Idempotency for all critical operations
 */

// ============================================================================
// DISPUTE MANAGEMENT
// ============================================================================

export const lsnDisputesRouter = router({
  disputes: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        status: z.enum([
          "OPEN",
          "EVIDENCE_REQUIRED",
          "EVIDENCE_BUILDING",
          "EVIDENCE_READY",
          "SUBMITTED",
          "WON",
          "LOST",
          "CLOSED",
          "NEEDS_MANUAL",
          "DUPLICATE",
          "CANCELED"
        ]).optional(),
        provider: z.string().optional(),
        needsManual: z.boolean().optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        const db = getDbSync();
        
        let query = db
          .select()
          .from(lsnDisputes)
          .where(eq(lsnDisputes.channelId, input.channelId));
        
        if (input.status) {
          query = query.where(eq(lsnDisputes.status, input.status));
        }
        if (input.provider) {
          query = query.where(eq(lsnDisputes.provider, input.provider));
        }
        if (input.needsManual !== undefined) {
          query = query.where(eq(lsnDisputes.needsManual, input.needsManual));
        }
        
        const items = await query
          .orderBy(desc(lsnDisputes.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        
        return items;
      }),
    
    get: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        disputeId: z.string(),
      }))
      .query(async ({ input }) => {
        const db = getDbSync();
        
        const [dispute] = await db
          .select()
          .from(lsnDisputes)
          .where(and(
            eq(lsnDisputes.id, input.disputeId),
            eq(lsnDisputes.channelId, input.channelId)
          ));
        
        if (!dispute) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dispute not found" });
        }
        
        // Get timeline
        const timeline = await db
          .select()
          .from(disputeTimeline)
          .where(eq(disputeTimeline.disputeId, input.disputeId))
          .orderBy(disputeTimeline.createdAt);
        
        // Get evidence pack if exists
        let evidencePack = null;
        if (dispute.evidencePackId) {
          [evidencePack] = await db
            .select()
            .from(evidencePacks)
            .where(eq(evidencePacks.id, dispute.evidencePackId));
        }
        
        // Get order details
        let order = null;
        if (dispute.orderId) {
          [order] = await db
            .select()
            .from(orders)
            .where(eq(orders.id, dispute.orderId));
        }
        
        return {
          dispute,
          timeline,
          evidencePack,
          order,
        };
      }),
    
    syncCase: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        disputeId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        const [dispute] = await db
          .select()
          .from(lsnDisputes)
          .where(and(
            eq(lsnDisputes.id, input.disputeId),
            eq(lsnDisputes.channelId, input.channelId)
          ));
        
        if (!dispute) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dispute not found" });
        }
        
        // TODO: Call PayPal API to get latest case status
        // For now, just update timestamp
        await db.update(lsnDisputes)
          .set({ lastProviderUpdateAt: new Date() })
          .where(eq(lsnDisputes.id, input.disputeId));
        
        await db.insert(disputeTimeline).values({
          id: randomBytes(16).toString("hex"),
          channelId: input.channelId,
          disputeId: input.disputeId,
          kind: "SYNC",
          message: "Case synced with provider",
          meta: {},
        });
        
        return { success: true };
      }),
    
    buildEvidence: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        disputeId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDbSync();
        
        const [dispute] = await db
          .select()
          .from(lsnDisputes)
          .where(and(
            eq(lsnDisputes.id, input.disputeId),
            eq(lsnlsnDisputes.channelId, input.channelId)
          ));
        
        if (!dispute) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Dispute not found" });
        }
        
        // Get order details
        let order = null;
        let shipment = null;
        if (dispute.orderId) {
          [order] = await db
            .select()
            .from(orders)
            .where(eq(orders.id, dispute.orderId));
          
          if (order) {
            [shipment] = await db
              .select()
              .from(shipments)
              .where(eq(shipments.orderId, order.id))
              .orderBy(desc(shipments.createdAt))
              .limit(1);
          }
        }
        
        // Build evidence pack
        const evidencePackId = randomBytes(16).toString("hex");
        
        await db.insert(evidencePacks).values({
          id: evidencePackId,
          channelId: input.channelId,
          disputeId: input.disputeId,
          status: "BUILDING",
          trackingNumber: shipment?.trackingNumber || null,
          trackingUrl: shipment?.trackingUrl || null,
          deliveryProof: shipment ? {
            carrier: shipment.carrier,
            deliveredAt: shipment.deliveredAt,
          } : null,
          productDescription: order ? `Order #${order.orderNumber}` : null,
          customerCommunication: [],
          refundPolicy: "30-day return policy. Items must be unused and in original packaging.",
          termsOfService: "By placing an order, customer agrees to our Terms of Service.",
          attachments: [],
        });
        
        await db.update(lsnDisputes)
          .set({
            status: "EVIDENCE_BUILDING",
            evidencePackId,
          })
          .where(eq(lsnDisputes.id, input.disputeId));
        
        await db.insert(disputeTimeline).values({
          id: randomBytes(16).toString("hex"),
          channelId: input.channelId,
          disputeId: input.disputeId,
          kind: "EVIDENCE_BUILDING",
          message: "Evidence pack created and building",
          meta: { evidencePackId },
        });
        
        return { evidencePackId };
      }),
    
    submitEvidence: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        disputeId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDbSync();
        
        const [dispute] = await db
          .select()
          .from(lsnDisputes)
          .where(and(
            eq(lsnDisputes.id, input.disputeId),
            eq(lsnDisputes.channelId, input.channelId)
          ));
        
        if (!dispute || !dispute.evidencePackId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Evidence pack not ready" });
        }
        
        const [evidencePack] = await db
          .select()
          .from(evidencePacks)
          .where(eq(evidencePacks.id, dispute.evidencePackId));
        
        if (!evidencePack || evidencePack.status !== "READY") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Evidence pack not ready" });
        }
        
        // TODO: Submit to PayPal API
        
        await db.update(evidencePacks)
          .set({
            status: "SUBMITTED",
            submittedAt: new Date(),
            submittedBy: ctx.user?.id || null,
          })
          .where(eq(evidencePacks.id, dispute.evidencePackId));
        
        await db.update(lsnDisputes)
          .set({ status: "SUBMITTED" })
          .where(eq(lsnDisputes.id, input.disputeId));
        
        await db.insert(disputeTimeline).values({
          id: randomBytes(16).toString("hex"),
          channelId: input.channelId,
          disputeId: input.disputeId,
          kind: "EVIDENCE_SUBMITTED",
          message: "Evidence submitted to provider",
          meta: { submittedBy: ctx.user?.id },
        });
        
        return { success: true };
      }),
    
    markNeedsManual: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        disputeId: z.string(),
        reason: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        await db.update(lsnDisputes)
          .set({
            status: "NEEDS_MANUAL",
            needsManual: true,
            lastError: input.reason,
          })
          .where(and(
            eq(lsnDisputes.id, input.disputeId),
            eq(lsnDisputes.channelId, input.channelId)
          ));
        
        await db.insert(disputeTimeline).values({
          id: randomBytes(16).toString("hex"),
          channelId: input.channelId,
          disputeId: input.disputeId,
          kind: "NEEDS_MANUAL",
          message: input.reason,
          meta: {},
        });
        
        return { success: true };
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        disputeId: z.string(),
        status: z.enum(["WON", "LOST", "CLOSED"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDbSync();
        
        await db.update(lsnDisputes)
          .set({ status: input.status })
          .where(and(
            eq(lsnDisputes.id, input.disputeId),
            eq(lsnDisputes.channelId, input.channelId)
          ));
        
        await db.insert(disputeTimeline).values({
          id: randomBytes(16).toString("hex"),
          channelId: input.channelId,
          disputeId: input.disputeId,
          kind: "STATUS_UPDATE",
          message: `Dispute marked as ${input.status}`,
          meta: { notes: input.notes, updatedBy: ctx.user?.id },
        });
        
        return { success: true };
      }),
    
    stats: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = getDbSync();
        
        let query = db
          .select({
            status: lsnDisputes.status,
            count: sql<number>`count(*)`,
            totalAmount: sql<number>`sum(${lsnDisputes.amountCents})`,
          })
          .from(lsnDisputes)
          .where(eq(lsnDisputes.channelId, input.channelId))
          .groupBy(lsnDisputes.status);
        
        if (input.startDate) {
          query = query.where(sql`${lsnDisputes.createdAt} >= ${input.startDate}`);
        }
        if (input.endDate) {
          query = query.where(sql`${lsnDisputes.createdAt} <= ${input.endDate}`);
        }
        
        const stats = await query;
        
        return stats;
      }),
  }),
  
  // --------------------------------------------------------------------------
  // WEBHOOK HANDLING
  // --------------------------------------------------------------------------
  
  webhooks: router({
    paypal: publicProcedure
      .input(z.object({
        event_id: z.string(),
        event_type: z.string(),
        resource: z.any(),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        // Deduplicate webhook
        const [existing] = await db
          .select()
          .from(providerWebhookDedup)
          .where(and(
            eq(providerWebhookDedup.provider, "PAYPAL"),
            eq(providerWebhookDedup.eventId, input.event_id)
          ));
        
        if (existing) {
          return { success: true, message: "Duplicate webhook ignored" };
        }
        
        await db.insert(providerWebhookDedup).values({
          channelId: "default", // TODO: Get from webhook data
          provider: "PAYPAL",
          eventId: input.event_id,
        });
        
        // Process webhook based on event type
        if (input.event_type.includes("DISPUTE")) {
          const resource = input.resource;
          const disputeId = randomBytes(16).toString("hex");
          
          await db.insert(lsnDisputes).values({
            id: disputeId,
            channelId: "default", // TODO: Get from webhook data
            provider: "PAYPAL",
            providerCaseId: resource.dispute_id || resource.id,
            providerStatus: resource.status,
            orderId: null, // TODO: Match by transaction ID
            creatorId: null,
            status: "OPEN",
            reason: resource.reason || null,
            amountCents: Math.round((resource.dispute_amount?.value || 0) * 100),
            currency: resource.dispute_amount?.currency_code || "USD",
            evidenceDeadline: resource.seller_response_due_date || null,
          });
          
          await db.insert(disputeTimeline).values({
            id: randomBytes(16).toString("hex"),
            channelId: "default",
            disputeId,
            kind: "WEBHOOK",
            message: `Webhook received: ${input.event_type}`,
            meta: { eventId: input.event_id },
          });
        }
        
        return { success: true };
      }),
  }),
  
  // --------------------------------------------------------------------------
  // RECONCILIATION ENGINE
  // --------------------------------------------------------------------------
  
  reconciliation: router({
    transactions: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          provider: z.string().optional(),
          matchStatus: z.enum(["UNMATCHED", "AUTO_MATCHED", "MANUAL_MATCHED", "DISCREPANCY"]).optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          limit: z.number().min(1).max(200).default(50),
          offset: z.number().min(0).default(0),
        }))
        .query(async ({ input }) => {
          const db = getDbSync();
          
          let query = db
            .select()
            .from(providerTransactions)
            .where(eq(providerTransactions.channelId, input.channelId));
          
          if (input.provider) {
            query = query.where(eq(providerTransactions.provider, input.provider));
          }
          if (input.matchStatus) {
            query = query.where(eq(providerTransactions.matchStatus, input.matchStatus));
          }
          if (input.startDate) {
            query = query.where(gte(providerTransactions.providerCreatedAt, new Date(input.startDate)));
          }
          if (input.endDate) {
            query = query.where(lte(providerTransactions.providerCreatedAt, new Date(input.endDate)));
          }
          
          const items = await query
            .orderBy(desc(providerTransactions.providerCreatedAt))
            .limit(input.limit)
            .offset(input.offset);
          
          return items;
        }),
      
      ingest: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          provider: z.string(),
          transactions: z.array(z.object({
            providerTxnId: z.string(),
            txnType: z.string(),
            amountCents: z.number(),
            currency: z.string(),
            feeCents: z.number().default(0),
            netCents: z.number(),
            status: z.string(),
            providerData: z.any().optional(),
            providerCreatedAt: z.string(),
          })),
        }))
        .mutation(async ({ input }) => {
          const db = getDbSync();
          
          const results = {
            ingested: 0,
            duplicates: 0,
            autoMatched: 0,
          };
          
          for (const txn of input.transactions) {
            // Check if already exists
            const [existing] = await db
              .select()
              .from(providerTransactions)
              .where(and(
                eq(providerTransactions.channelId, input.channelId),
                eq(providerTransactions.provider, input.provider),
                eq(providerTransactions.providerTxnId, txn.providerTxnId)
              ));
            
            if (existing) {
              results.duplicates++;
              continue;
            }
            
            const txnId = randomBytes(16).toString("hex");
            
            await db.insert(providerTransactions).values({
              id: txnId,
              channelId: input.channelId,
              provider: input.provider,
              providerTxnId: txn.providerTxnId,
              txnType: txn.txnType,
              amountCents: txn.amountCents,
              currency: txn.currency,
              feeCents: txn.feeCents,
              netCents: txn.netCents,
              status: txn.status,
              providerData: txn.providerData || null,
              matchStatus: "UNMATCHED",
              providerCreatedAt: new Date(txn.providerCreatedAt),
            });
            
            results.ingested++;
            
            // Try auto-match
            // TODO: Implement matching logic based on transaction IDs
          }
          
          return results;
        }),
      
      match: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          transactionId: z.string(),
          orderId: z.string().optional(),
          payoutId: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const db = getDbSync();
          
          await db.update(providerTransactions)
            .set({
              matchedOrderId: input.orderId || null,
              matchedPayoutId: input.payoutId || null,
              matchStatus: "MANUAL_MATCHED",
              matchedAt: new Date(),
              matchedBy: ctx.user?.id || null,
            })
            .where(and(
              eq(providerTransactions.id, input.transactionId),
              eq(providerTransactions.channelId, input.channelId)
            ));
          
          return { success: true };
        }),
      
      autoMatch: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          provider: z.string().optional(),
          limit: z.number().min(1).max(1000).default(100),
        }))
        .mutation(async ({ input }) => {
          const db = getDbSync();
          
          let query = db
            .select()
            .from(providerTransactions)
            .where(and(
              eq(providerTransactions.channelId, input.channelId),
              eq(providerTransactions.matchStatus, "UNMATCHED")
            ))
            .limit(input.limit);
          
          if (input.provider) {
            query = query.where(eq(providerTransactions.provider, input.provider));
          }
          
          const unmatched = await query;
          
          let matched = 0;
          
          for (const txn of unmatched) {
            // Try to match by transaction ID in provider data
            if (txn.providerData && typeof txn.providerData === "object") {
              const data = txn.providerData as any;
              const referenceId = data.reference_id || data.invoice_id || data.custom_id;
              
              if (referenceId) {
                // Try to find order by reference
                const [order] = await db
                  .select()
                  .from(orders)
                  .where(eq(orders.orderNumber, referenceId))
                  .limit(1);
                
                if (order) {
                  await db.update(providerTransactions)
                    .set({
                      matchedOrderId: order.id,
                      matchStatus: "AUTO_MATCHED",
                      matchedAt: new Date(),
                    })
                    .where(eq(providerTransactions.id, txn.id));
                  
                  matched++;
                }
              }
            }
          }
          
          return { matched, total: unmatched.length };
        }),
    }),
    
    discrepancies: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          status: z.enum(["OPEN", "INVESTIGATING", "RESOLVED", "ACCEPTED"]).optional(),
          severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
          limit: z.number().min(1).max(200).default(50),
        }))
        .query(async ({ input }) => {
          const db = getDbSync();
          
          let query = db
            .select()
            .from(reconciliationDiscrepancies)
            .where(eq(reconciliationDiscrepancies.channelId, input.channelId));
          
          if (input.status) {
            query = query.where(eq(reconciliationDiscrepancies.status, input.status));
          }
          if (input.severity) {
            query = query.where(eq(reconciliationDiscrepancies.severity, input.severity));
          }
          
          const items = await query
            .orderBy(desc(reconciliationDiscrepancies.createdAt))
            .limit(input.limit);
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          type: z.string(),
          severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
          description: z.string(),
          providerTxnId: z.string().optional(),
          orderId: z.string().optional(),
          expectedCents: z.number().optional(),
          actualCents: z.number().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = getDbSync();
          
          const discrepancyId = randomBytes(16).toString("hex");
          const differenceCents = (input.actualCents || 0) - (input.expectedCents || 0);
          
          await db.insert(reconciliationDiscrepancies).values({
            id: discrepancyId,
            channelId: input.channelId,
            type: input.type,
            severity: input.severity,
            description: input.description,
            providerTxnId: input.providerTxnId || null,
            orderId: input.orderId || null,
            expectedCents: input.expectedCents || null,
            actualCents: input.actualCents || null,
            differenceCents,
            status: "OPEN",
          });
          
          return { id: discrepancyId };
        }),
      
      resolve: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          discrepancyId: z.string(),
          resolution: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
          const db = getDbSync();
          
          await db.update(reconciliationDiscrepancies)
            .set({
              status: "RESOLVED",
              resolvedAt: new Date(),
              resolvedBy: ctx.user?.id || null,
              resolution: input.resolution,
            })
            .where(and(
              eq(reconciliationDiscrepancies.id, input.discrepancyId),
              eq(reconciliationDiscrepancies.channelId, input.channelId)
            ));
          
          return { success: true };
        }),
    }),
    
    stats: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = getDbSync();
        
        let txnQuery = db
          .select({
            matchStatus: providerTransactions.matchStatus,
            count: sql<number>`count(*)`,
            totalAmount: sql<number>`sum(${providerTransactions.amountCents})`,
          })
          .from(providerTransactions)
          .where(eq(providerTransactions.channelId, input.channelId))
          .groupBy(providerTransactions.matchStatus);
        
        if (input.startDate) {
          txnQuery = txnQuery.where(gte(providerTransactions.providerCreatedAt, new Date(input.startDate)));
        }
        if (input.endDate) {
          txnQuery = txnQuery.where(lte(providerTransactions.providerCreatedAt, new Date(input.endDate)));
        }
        
        const txnStats = await txnQuery;
        
        const [discrepancyStats] = await db
          .select({
            open: sql<number>`sum(case when status = 'OPEN' then 1 else 0 end)`,
            investigating: sql<number>`sum(case when status = 'INVESTIGATING' then 1 else 0 end)`,
            resolved: sql<number>`sum(case when status = 'RESOLVED' then 1 else 0 end)`,
            totalDifference: sql<number>`sum(${reconciliationDiscrepancies.differenceCents})`,
          })
          .from(reconciliationDiscrepancies)
          .where(eq(reconciliationDiscrepancies.channelId, input.channelId));
        
        return {
          transactions: txnStats,
          discrepancies: discrepancyStats,
        };
      }),
  }),
  
  // --------------------------------------------------------------------------
  // IDEMPOTENCY UTILITIES
  // --------------------------------------------------------------------------
  
  idempotency: router({
    check: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        scope: z.string(),
        key: z.string(),
      }))
      .query(async ({ input }) => {
        const db = getDbSync();
        
        const [existing] = await db
          .select()
          .from(idempotencyKeys)
          .where(and(
            eq(idempotencyKeys.channelId, input.channelId),
            eq(idempotencyKeys.scope, input.scope),
            eq(idempotencyKeys.idemKey, input.key)
          ));
        
        return existing || null;
      }),
    
    set: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        scope: z.string(),
        key: z.string(),
        requestHash: z.string(),
        result: z.any().optional(),
        status: z.enum(["IN_PROGRESS", "COMPLETED", "FAILED"]),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        await db.insert(idempotencyKeys).values({
          channelId: input.channelId,
          scope: input.scope,
          idemKey: input.key,
          requestHash: input.requestHash,
          result: input.result || {},
          status: input.status,
        }).onDuplicateKeyUpdate({
          set: {
            result: input.result || {},
            status: input.status,
          },
        });
        
        return { success: true };
      }),
  }),
});
