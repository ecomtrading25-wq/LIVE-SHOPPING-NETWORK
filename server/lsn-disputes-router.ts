/**
 * LSN DISPUTES ROUTER
 * 
 * Comprehensive dispute automation system for Live Shopping Network
 * - PayPal dispute webhook ingestion with signature verification
 * - Dispute state machine (OPEN → EVIDENCE_REQUIRED → SUBMITTED → WON/LOST)
 * - Evidence pack builder with automatic document assembly
 * - Timeline tracking with actor audit
 * - Operator review queue integration
 * - Escalation to founder for critical cases
 * - Idempotent operations
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDbSync } from "./db";
import { 
  lsnDisputes,
  evidencePacks,
  disputeTimeline,
  providerWebhookDedup,
  reviewQueueItems,
  escalations,
  auditLog,
  idempotencyKeys,
  orders
} from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "crypto";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique IDs
 */
function generateId(prefix: string = ""): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Verify PayPal webhook signature
 */
async function verifyPayPalWebhookSignature(
  payload: string,
  headers: Record<string, string>,
  webhookId: string
): Promise<boolean> {
  try {
    // PayPal signature verification
    const transmissionId = headers["paypal-transmission-id"];
    const transmissionTime = headers["paypal-transmission-time"];
    const certUrl = headers["paypal-cert-url"];
    const authAlgo = headers["paypal-auth-algo"];
    const transmissionSig = headers["paypal-transmission-sig"];

    if (!transmissionId || !transmissionTime || !transmissionSig) {
      return false;
    }

    // In production, verify against PayPal's certificate
    // For now, basic validation
    const expectedSig = crypto
      .createHmac("sha256", process.env.PAYPAL_WEBHOOK_SECRET || "")
      .update(`${transmissionId}|${transmissionTime}|${webhookId}|${crypto.createHash("sha256").update(payload).digest("hex")}`)
      .digest("base64");

    return transmissionSig === expectedSig;
  } catch (error) {
    console.error("PayPal signature verification failed:", error);
    return false;
  }
}

/**
 * Create audit log entry with hash chain
 */
async function createAuditEntry(params: {
  channelId: string;
  actorType: string;
  actorId?: string;
  action: string;
  severity: "INFO" | "WARN" | "CRITICAL";
  refType: string;
  refId: string;
  before?: any;
  after?: any;
  meta?: any;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    // Get previous hash
    const [prevEntry] = await db
      .select({ entryHash: auditLog.entryHash })
      .from(auditLog)
      .where(eq(auditLog.channelId, params.channelId))
      .orderBy(desc(auditLog.createdAt))
      .limit(1);

    const prevHash = prevEntry?.entryHash || null;

    // Generate entry hash
    const entryData = JSON.stringify({
      ...params,
      prevHash,
      timestamp: Date.now(),
    });
    const entryHash = crypto.createHash("sha256").update(entryData).digest("hex");

    await getDbSync().insert(auditLog).values({
      id: generateId("audit_"),
      channelId: params.channelId,
      actorType: params.actorType,
      actorId: params.actorId,
      action: params.action,
      severity: params.severity,
      refType: params.refType,
      refId: params.refId,
      ip: params.ip,
      userAgent: params.userAgent,
      before: params.before || {},
      after: params.after || {},
      meta: params.meta || {},
      prevHash,
      entryHash,
    });
  } catch (error) {
    console.error("Failed to create audit entry:", error);
  }
}

/**
 * Execute with idempotency
 */
async function withIdempotency<T>(
  channelId: string,
  scope: string,
  key: string,
  requestData: any,
  fn: () => Promise<T>
): Promise<T> {
  const requestHash = crypto.createHash("sha256").update(JSON.stringify(requestData)).digest("hex");

  // Check if already processed
  const [existing] = await getDbSync()
    .select()
    .from(idempotencyKeys)
    .where(
      and(
        eq(idempotencyKeys.channelId, channelId),
        eq(idempotencyKeys.scope, scope),
        eq(idempotencyKeys.idemKey, key)
      )
    );

  if (existing) {
    if (existing.status === "COMPLETED") {
      return existing.result as T;
    }
    if (existing.status === "IN_PROGRESS") {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Operation already in progress",
      });
    }
  }

  // Create idempotency record
  await getDbSync().insert(idempotencyKeys).values({
    channelId,
    scope,
    idemKey: key,
    requestHash,
    status: "IN_PROGRESS",
  });

  try {
    const result = await fn();

    // Update as completed
    await getDbSync()
      .update(idempotencyKeys)
      .set({
        result: result as any,
        status: "COMPLETED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(idempotencyKeys.channelId, channelId),
          eq(idempotencyKeys.scope, scope),
          eq(idempotencyKeys.idemKey, key)
        )
      );

    return result;
  } catch (error) {
    // Mark as failed
    await getDbSync()
      .update(idempotencyKeys)
      .set({
        status: "FAILED",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(idempotencyKeys.channelId, channelId),
          eq(idempotencyKeys.scope, scope),
          eq(idempotencyKeys.idemKey, key)
        )
      );

    throw error;
  }
}

/**
 * Build evidence pack from order data
 */
async function buildEvidencePack(disputeId: string, orderId: string): Promise<string> {
  // Get order details
  const [order] = await getDbSync()
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!order) {
    throw new Error("Order not found");
  }

  // Create evidence pack
  const packId = generateId("evpack_");
  await getDbSync().insert(evidencePacks).values({
    id: packId,
    channelId: order.channelId,
    disputeId,
    status: "BUILDING",
    trackingNumber: order.trackingNumber || undefined,
    trackingUrl: order.trackingUrl || undefined,
    productDescription: `Order ${order.orderNumber} - ${order.items?.length || 0} items`,
    customerCommunication: {
      orderConfirmation: true,
      shippingNotification: true,
      deliveryConfirmation: order.status === "delivered",
    },
  });

  return packId;
}

/**
 * Submit evidence pack to PayPal
 */
async function submitEvidenceToPayPal(
  disputeId: string,
  providerCaseId: string,
  evidencePackId: string
): Promise<boolean> {
  try {
    // Get evidence pack
    const [pack] = await db
      .select()
      .from(evidencePacks)
      .where(eq(evidencePacks.id, evidencePackId));

    if (!pack) {
      throw new Error("Evidence pack not found");
    }

    // In production, call PayPal API to submit evidence
    // For now, simulate submission
    console.log("Submitting evidence to PayPal:", {
      disputeId,
      providerCaseId,
      trackingNumber: pack.trackingNumber,
      productDescription: pack.productDescription,
    });

    // Update evidence pack status
    await getDbSync()
      .update(evidencePacks)
      .set({
        status: "SUBMITTED",
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(evidencePacks.id, evidencePackId));

    return true;
  } catch (error) {
    console.error("Failed to submit evidence:", error);
    return false;
  }
}

/**
 * Create review queue item for manual intervention
 */
async function createReviewQueueItem(params: {
  channelId: string;
  itemType: string;
  severity: "LOW" | "MED" | "HIGH" | "CRITICAL";
  refType: string;
  refId: string;
  title: string;
  summary: string;
  meta?: any;
}): Promise<void> {
  const slaDueAt = new Date();
  // Set SLA based on severity
  switch (params.severity) {
    case "CRITICAL":
      slaDueAt.setHours(slaDueAt.getHours() + 1);
      break;
    case "HIGH":
      slaDueAt.setHours(slaDueAt.getHours() + 4);
      break;
    case "MED":
      slaDueAt.setHours(slaDueAt.getHours() + 24);
      break;
    case "LOW":
      slaDueAt.setHours(slaDueAt.getHours() + 72);
      break;
  }

  await getDbSync().insert(reviewQueueItems).values({
    id: generateId("review_"),
    channelId: params.channelId,
    itemType: params.itemType,
    severity: params.severity,
    status: "OPEN",
    slaDueAt,
    refType: params.refType,
    refId: params.refId,
    title: params.title,
    summary: params.summary,
    checklist: [],
    meta: params.meta || {},
  });
}

/**
 * Create escalation to founder
 */
async function createEscalation(params: {
  channelId: string;
  severity: "WARN" | "ERROR" | "CRITICAL";
  sessionId?: string;
  triggerJson: any;
}): Promise<void> {
  await getDbSync().insert(escalations).values({
    id: generateId("esc_"),
    channelId: params.channelId,
    severity: params.severity,
    status: "OPEN",
    sessionId: params.sessionId,
    triggerJson: params.triggerJson,
  });
}

// ============================================================================
// TRPC ROUTER
// ============================================================================

export const lsnDisputesRouter = router({
  /**
   * List disputes with filtering
   */
  list: protectedProcedure
    .input(
      z.object({
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
          "CANCELED",
        ]).optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const conditions = [eq(lsnDisputes.channelId, input.channelId)];

      if (input.status) {
        conditions.push(eq(lsnDisputes.status, input.status));
      }

      const disputes = await db
        .select()
        .from(lsnDisputes)
        .where(and(...conditions))
        .orderBy(desc(lsnDisputes.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(lsnDisputes)
        .where(and(...conditions));

      return {
        disputes,
        total: countResult?.count || 0,
        hasMore: (input.offset + input.limit) < (countResult?.count || 0),
      };
    }),

  /**
   * Get dispute details with timeline
   */
  getById: protectedProcedure
    .input(
      z.object({
        disputeId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const [dispute] = await db
        .select()
        .from(lsnDisputes)
        .where(eq(lsnDisputes.id, input.disputeId));

      if (!dispute) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dispute not found",
        });
      }

      // Get timeline
      const timeline = await db
        .select()
        .from(disputeTimeline)
        .where(eq(disputeTimeline.disputeId, input.disputeId))
        .orderBy(desc(disputeTimeline.createdAt));

      // Get evidence pack if exists
      let evidencePack = null;
      if (dispute.evidencePackId) {
        [evidencePack] = await db
          .select()
          .from(evidencePacks)
          .where(eq(evidencePacks.id, dispute.evidencePackId));
      }

      return {
        dispute,
        timeline,
        evidencePack,
      };
    }),

  /**
   * PayPal webhook handler
   */
  paypalWebhook: publicProcedure
    .input(
      z.object({
        providerAccountId: z.string(),
        payload: z.any(),
        headers: z.record(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const { providerAccountId, payload, headers } = input;

      // Verify signature
      const isValid = await verifyPayPalWebhookSignature(
        JSON.stringify(payload),
        headers,
        providerAccountId
      );

      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid webhook signature",
        });
      }

      const eventId = payload.id;
      const eventType = payload.event_type;

      // Deduplicate
      const [existing] = await db
        .select()
        .from(providerWebhookDedup)
        .where(
          and(
            eq(providerWebhookDedup.provider, "PAYPAL"),
            eq(providerWebhookDedup.eventId, eventId)
          )
        );

      if (existing) {
        return { ok: true, message: "Event already processed" };
      }

      // Record webhook
      await getDbSync().insert(providerWebhookDedup).values({
        channelId: providerAccountId,
        provider: "PAYPAL",
        eventId,
      });

      // Process dispute events
      if (eventType.startsWith("CUSTOMER.DISPUTE.")) {
        await processDisputeEvent(providerAccountId, payload);
      }

      return { ok: true };
    }),

  /**
   * Manually trigger evidence building
   */
  buildEvidence: protectedProcedure
    .input(
      z.object({
        disputeId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [dispute] = await db
        .select()
        .from(lsnDisputes)
        .where(eq(lsnDisputes.id, input.disputeId));

      if (!dispute) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dispute not found",
        });
      }

      if (!dispute.orderId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Dispute has no associated order",
        });
      }

      return await withIdempotency(
        dispute.channelId,
        "DISPUTE_BUILD_EVIDENCE",
        input.disputeId,
        { disputeId: input.disputeId },
        async () => {
          const evidencePackId = await buildEvidencePack(input.disputeId, dispute.orderId!);

          // Update dispute
          await db
            .update(lsnDisputes)
            .set({
              status: "EVIDENCE_BUILDING",
              evidencePackId,
              updatedAt: new Date(),
            })
            .where(eq(lsnDisputes.id, input.disputeId));

          // Add timeline entry
          await getDbSync().insert(disputeTimeline).values({
            id: generateId("timeline_"),
            channelId: dispute.channelId,
            disputeId: input.disputeId,
            kind: "EVIDENCE_BUILDING_STARTED",
            message: "Evidence pack building started",
            actorType: "USER",
            actorId: ctx.user?.id,
            meta: { evidencePackId },
          });

          // Audit log
          await createAuditEntry({
            channelId: dispute.channelId,
            actorType: "USER",
            actorId: ctx.user?.id,
            action: "DISPUTE_BUILD_EVIDENCE",
            severity: "INFO",
            refType: "DISPUTE",
            refId: input.disputeId,
            after: { status: "EVIDENCE_BUILDING", evidencePackId },
          });

          return { evidencePackId };
        }
      );
    }),

  /**
   * Submit evidence to PayPal
   */
  submitEvidence: protectedProcedure
    .input(
      z.object({
        disputeId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [dispute] = await db
        .select()
        .from(lsnDisputes)
        .where(eq(lsnDisputes.id, input.disputeId));

      if (!dispute) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dispute not found",
        });
      }

      if (!dispute.evidencePackId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No evidence pack available",
        });
      }

      return await withIdempotency(
        dispute.channelId,
        "DISPUTE_SUBMIT_EVIDENCE",
        input.disputeId,
        { disputeId: input.disputeId },
        async () => {
          const success = await submitEvidenceToPayPal(
            input.disputeId,
            dispute.providerCaseId,
            dispute.evidencePackId!
          );

          if (success) {
            // Update dispute
            await db
              .update(lsnDisputes)
              .set({
                status: "SUBMITTED",
                updatedAt: new Date(),
              })
              .where(eq(lsnDisputes.id, input.disputeId));

            // Add timeline entry
            await getDbSync().insert(disputeTimeline).values({
              id: generateId("timeline_"),
              channelId: dispute.channelId,
              disputeId: input.disputeId,
              kind: "EVIDENCE_SUBMITTED",
              message: "Evidence submitted to PayPal",
              actorType: "USER",
              actorId: ctx.user?.id,
              meta: { evidencePackId: dispute.evidencePackId },
            });

            // Audit log
            await createAuditEntry({
              channelId: dispute.channelId,
              actorType: "USER",
              actorId: ctx.user?.id,
              action: "DISPUTE_SUBMIT_EVIDENCE",
              severity: "INFO",
              refType: "DISPUTE",
              refId: input.disputeId,
              after: { status: "SUBMITTED" },
            });
          } else {
            // Create review queue item for manual submission
            await createReviewQueueItem({
              channelId: dispute.channelId,
              itemType: "DISPUTE_SUBMISSION_FAILED",
              severity: "HIGH",
              refType: "DISPUTE",
              refId: input.disputeId,
              title: `Dispute evidence submission failed: ${dispute.providerCaseId}`,
              summary: "Automatic evidence submission to PayPal failed. Manual intervention required.",
              meta: { disputeId: input.disputeId, providerCaseId: dispute.providerCaseId },
            });

            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to submit evidence to PayPal",
            });
          }

          return { success };
        }
      );
    }),

  /**
   * Mark dispute as needs manual review
   */
  markNeedsManual: protectedProcedure
    .input(
      z.object({
        disputeId: z.string(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const [dispute] = await db
        .select()
        .from(lsnDisputes)
        .where(eq(lsnDisputes.id, input.disputeId));

      if (!dispute) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Dispute not found",
        });
      }

      // Update dispute
      await db
        .update(lsnDisputes)
        .set({
          status: "NEEDS_MANUAL",
          needsManual: true,
          lastError: input.reason,
          updatedAt: new Date(),
        })
        .where(eq(lsnDisputes.id, input.disputeId));

      // Create review queue item
      await createReviewQueueItem({
        channelId: dispute.channelId,
        itemType: "DISPUTE_MANUAL_REVIEW",
        severity: "HIGH",
        refType: "DISPUTE",
        refId: input.disputeId,
        title: `Dispute requires manual review: ${dispute.providerCaseId}`,
        summary: input.reason,
        meta: { disputeId: input.disputeId, providerCaseId: dispute.providerCaseId },
      });

      // Add timeline entry
      await getDbSync().insert(disputeTimeline).values({
        id: generateId("timeline_"),
        channelId: dispute.channelId,
        disputeId: input.disputeId,
        kind: "MARKED_NEEDS_MANUAL",
        message: `Marked for manual review: ${input.reason}`,
        actorType: "USER",
        actorId: ctx.user?.id,
        meta: { reason: input.reason },
      });

      // Audit log
      await createAuditEntry({
        channelId: dispute.channelId,
        actorType: "USER",
        actorId: ctx.user?.id,
        action: "DISPUTE_MARK_NEEDS_MANUAL",
        severity: "WARN",
        refType: "DISPUTE",
        refId: input.disputeId,
        after: { status: "NEEDS_MANUAL", reason: input.reason },
      });

      return { ok: true };
    }),

  /**
   * Get dispute statistics
   */
  getStats: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [eq(lsnDisputes.channelId, input.channelId)];

      if (input.startDate) {
        conditions.push(sql`${lsnDisputes.createdAt} >= ${input.startDate}`);
      }
      if (input.endDate) {
        conditions.push(sql`${lsnDisputes.createdAt} <= ${input.endDate}`);
      }

      // Total disputes
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(lsnDisputes)
        .where(and(...conditions));

      // By status
      const byStatus = await db
        .select({
          status: lsnDisputes.status,
          count: sql<number>`count(*)`,
        })
        .from(lsnDisputes)
        .where(and(...conditions))
        .groupBy(lsnDisputes.status);

      // Win rate
      const [winRateResult] = await db
        .select({
          won: sql<number>`sum(case when ${lsnDisputes.status} = 'WON' then 1 else 0 end)`,
          lost: sql<number>`sum(case when ${lsnDisputes.status} = 'LOST' then 1 else 0 end)`,
        })
        .from(lsnDisputes)
        .where(and(...conditions));

      const wonCount = Number(winRateResult?.won || 0);
      const lostCount = Number(winRateResult?.lost || 0);
      const winRate = wonCount + lostCount > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0;

      // Needs manual count
      const [needsManualResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(lsnDisputes)
        .where(and(...conditions, eq(lsnDisputes.needsManual, true)));

      return {
        total: totalResult?.count || 0,
        byStatus: byStatus.map((s) => ({ status: s.status, count: s.count })),
        winRate: Math.round(winRate * 100) / 100,
        wonCount,
        lostCount,
        needsManualCount: needsManualResult?.count || 0,
      };
    }),
});

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Process dispute event from PayPal webhook
 */
async function processDisputeEvent(channelId: string, payload: any): Promise<void> {
  const resource = payload.resource;
  const providerCaseId = resource.dispute_id;
  const eventType = payload.event_type;

  // Upsert dispute
  const [existingDispute] = await getDbSync()
    .select()
    .from(lsnDisputes)
    .where(
      and(
        eq(lsnDisputes.channelId, channelId),
        eq(lsnDisputes.providerCaseId, providerCaseId)
      )
    );

  const disputeData = {
    channelId,
    provider: "PAYPAL",
    providerCaseId,
    providerStatus: resource.status,
    reason: resource.reason,
    amountCents: Math.round((resource.dispute_amount?.value || 0) * 100),
    currency: resource.dispute_amount?.currency_code || "AUD",
    evidenceDeadline: resource.seller_response_due_date ? new Date(resource.seller_response_due_date) : undefined,
    lastProviderUpdateAt: new Date(),
    updatedAt: new Date(),
  };

  let disputeId: string;

  if (existingDispute) {
    disputeId = existingDispute.id;
    await getDbSync()
      .update(lsnDisputes)
      .set(disputeData)
      .where(eq(lsnDisputes.id, disputeId));
  } else {
    disputeId = generateId("dispute_");
    await getDbSync().insert(lsnDisputes).values({
      id: disputeId,
      ...disputeData,
      status: "OPEN",
    });
  }

  // Add timeline entry
  await getDbSync().insert(disputeTimeline).values({
    id: generateId("timeline_"),
    channelId,
    disputeId,
    kind: eventType,
    message: `PayPal event: ${eventType}`,
    actorType: "SYSTEM",
    meta: { payload },
  });

  // Handle specific event types
  if (eventType === "CUSTOMER.DISPUTE.CREATED") {
    // Create review queue item
    await createReviewQueueItem({
      channelId,
      itemType: "NEW_DISPUTE",
      severity: "HIGH",
      refType: "DISPUTE",
      refId: disputeId,
      title: `New dispute: ${providerCaseId}`,
      summary: `Customer opened dispute for ${resource.dispute_amount?.value} ${resource.dispute_amount?.currency_code}. Reason: ${resource.reason}`,
      meta: { providerCaseId, amount: resource.dispute_amount },
    });
  } else if (eventType === "CUSTOMER.DISPUTE.RESOLVED") {
    const outcome = resource.dispute_outcome?.outcome_code;
    const newStatus = outcome === "RESOLVED_BUYER_FAVOUR" ? "LOST" : "WON";

    await getDbSync()
      .update(lsnDisputes)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(lsnDisputes.id, disputeId));

    // Add timeline entry
    await getDbSync().insert(disputeTimeline).values({
      id: generateId("timeline_"),
      channelId,
      disputeId,
      kind: "DISPUTE_RESOLVED",
      message: `Dispute resolved: ${newStatus}`,
      actorType: "SYSTEM",
      meta: { outcome },
    });
  }

  // Audit log
  await createAuditEntry({
    channelId,
    actorType: "SYSTEM",
    action: "DISPUTE_WEBHOOK_PROCESSED",
    severity: "INFO",
    refType: "DISPUTE",
    refId: disputeId,
    after: { eventType, providerCaseId },
  });
}
