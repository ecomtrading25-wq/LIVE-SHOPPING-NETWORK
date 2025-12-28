import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDbSync } from "./db";
import { 
  wiseWebhookEvents, 
  wiseTransfers, 
  wiseBalances,
  creatorPayoutBatches,
  creatorPayoutLines
} from "../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

/**
 * Wise (formerly TransferWise) Webhook Handlers
 * Comprehensive webhook processing for Wise transfer events
 * Handles transfer state changes, balance updates, and payout processing
 */

// ============================================================================
// WEBHOOK SIGNATURE VERIFICATION
// ============================================================================

function verifyWiseWebhookSignature(
  headers: Record<string, string>,
  body: string,
  webhookSecret: string
): boolean {
  const signature = headers['x-signature'] || headers['x-wise-signature'];
  
  if (!signature) {
    return false;
  }

  // Wise uses HMAC-SHA256 for webhook signatures
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// ============================================================================
// WEBHOOK DEDUPLICATION
// ============================================================================

async function isWiseWebhookProcessed(eventId: string): Promise<boolean> {
  const db = getDbSync();
  const existing = await db.select()
    .from(wiseWebhookEvents)
    .where(eq(wiseWebhookEvents.id, eventId))
    .limit(1);
  
  return existing.length > 0;
}

async function markWiseWebhookProcessed(
  eventId: string,
  eventType: string,
  resourceType: string,
  resourceId: string,
  payload: any
): Promise<void> {
  const db = getDbSync();
  await db.insert(wiseWebhookEvents).values({
    id: eventId,
    eventType,
    resourceType,
    resourceId,
    payload,
    createdAt: new Date(),
  });
}

// ============================================================================
// TRANSFER EVENT HANDLERS
// ============================================================================

async function handleTransferStateChange(event: any): Promise<void> {
  const data = event.data;
  const transferId = data.resource.id.toString();
  const currentState = data.current_state;
  const previousState = data.previous_state;

  const db = getDbSync();

  console.log(`[Wise] Transfer ${transferId} state changed: ${previousState} → ${currentState}`);

  // Update transfer status in database
  const updateData: any = {
    status: currentState,
    updatedAt: new Date(),
  };

  // Mark as completed if in final state
  if (currentState === 'outgoing_payment_sent') {
    updateData.completedAt = new Date();
  }

  await db.update(wiseTransfers)
    .set(updateData)
    .where(eq(wiseTransfers.wiseTransferId, transferId));

  // Update related payout records if this is a creator payout
  const transfer = await db.select()
    .from(wiseTransfers)
    .where(eq(wiseTransfers.wiseTransferId, transferId))
    .limit(1);

  if (transfer.length > 0 && transfer[0].reference) {
    // Extract payout batch ID from reference
    const payoutBatchId = transfer[0].reference;

    // Update payout line status
    await db.update(creatorPayoutLines)
      .set({
        status: currentState === 'outgoing_payment_sent' ? 'completed' : 
                currentState === 'cancelled' ? 'failed' : 'processing',
        paidAt: currentState === 'outgoing_payment_sent' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(creatorPayoutLines.batchId, payoutBatchId));

    // Check if all payouts in batch are completed
    const batchLines = await db.select()
      .from(creatorPayoutLines)
      .where(eq(creatorPayoutLines.batchId, payoutBatchId));

    const allCompleted = batchLines.every(line => line.status === 'completed');
    const anyFailed = batchLines.some(line => line.status === 'failed');

    if (allCompleted) {
      await db.update(creatorPayoutBatches)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(creatorPayoutBatches.id, payoutBatchId));
    } else if (anyFailed) {
      await db.update(creatorPayoutBatches)
        .set({
          status: 'partially_failed',
          updatedAt: new Date(),
        })
        .where(eq(creatorPayoutBatches.id, payoutBatchId));
    }
  }
}

async function handleTransferActiveCases(event: any): Promise<void> {
  const data = event.data;
  const transferId = data.resource.id.toString();

  console.log(`[Wise] Transfer ${transferId} has active cases requiring attention`);

  const db = getDbSync();

  // Mark transfer as needing manual review
  await db.update(wiseTransfers)
    .set({
      status: 'requires_attention',
      updatedAt: new Date(),
    })
    .where(eq(wiseTransfers.wiseTransferId, transferId));

  // TODO: Create review queue item for operations team
}

async function handleTransferPayout(event: any): Promise<void> {
  const data = event.data;
  const transferId = data.resource.id.toString();

  console.log(`[Wise] Transfer ${transferId} payout initiated`);

  const db = getDbSync();

  await db.update(wiseTransfers)
    .set({
      status: 'processing',
      updatedAt: new Date(),
    })
    .where(eq(wiseTransfers.wiseTransferId, transferId));
}

// ============================================================================
// BALANCE EVENT HANDLERS
// ============================================================================

async function handleBalanceCredit(event: any): Promise<void> {
  const data = event.data;
  const balanceId = data.resource.id.toString();
  const amount = parseFloat(data.amount);
  const currency = data.currency;

  console.log(`[Wise] Balance credited: ${amount} ${currency}`);

  const db = getDbSync();

  // Update balance
  const existingBalance = await db.select()
    .from(wiseBalances)
    .where(eq(wiseBalances.balanceId, balanceId))
    .limit(1);

  if (existingBalance.length > 0) {
    const currentAmount = parseFloat(existingBalance[0].amount.toString());
    await db.update(wiseBalances)
      .set({
        amount: (currentAmount + amount).toString(),
        updatedAt: new Date(),
      })
      .where(eq(wiseBalances.balanceId, balanceId));
  }
}

async function handleBalanceDebit(event: any): Promise<void> {
  const data = event.data;
  const balanceId = data.resource.id.toString();
  const amount = parseFloat(data.amount);
  const currency = data.currency;

  console.log(`[Wise] Balance debited: ${amount} ${currency}`);

  const db = getDbSync();

  // Update balance
  const existingBalance = await db.select()
    .from(wiseBalances)
    .where(eq(wiseBalances.balanceId, balanceId))
    .limit(1);

  if (existingBalance.length > 0) {
    const currentAmount = parseFloat(existingBalance[0].amount.toString());
    await db.update(wiseBalances)
      .set({
        amount: (currentAmount - amount).toString(),
        updatedAt: new Date(),
      })
      .where(eq(wiseBalances.balanceId, balanceId));
  }
}

// ============================================================================
// MAIN WEBHOOK ROUTER
// ============================================================================

export const wiseWebhookRouter = router({
  /**
   * Main Wise webhook endpoint
   * Receives and processes all Wise webhook events
   */
  handleWebhook: publicProcedure
    .input(z.object({
      webhookSecret: z.string(),
      body: z.any(),
      headers: z.record(z.string()),
    }))
    .mutation(async ({ input }) => {
      const { webhookSecret, body, headers } = input;

      // Verify webhook signature
      const bodyString = JSON.stringify(body);
      const isValid = verifyWiseWebhookSignature(headers, bodyString, webhookSecret);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid webhook signature',
        });
      }

      const event = body;
      const eventId = event.subscription_id + '_' + event.event_id;
      const eventType = event.event_type;

      // Check for duplicate
      if (await isWiseWebhookProcessed(eventId)) {
        console.log(`[Wise] Duplicate webhook: ${eventId}`);
        return { success: true, duplicate: true };
      }

      // Extract resource info
      const data = event.data || {};
      const resource = data.resource || {};
      const resourceType = resource.type || 'unknown';
      const resourceId = resource.id?.toString() || 'unknown';

      try {
        // Route to appropriate handler
        switch (eventType) {
          // Transfer events
          case 'transfers#state-change':
            await handleTransferStateChange(event);
            break;
          case 'transfers#active-cases':
            await handleTransferActiveCases(event);
            break;
          case 'transfers#payout':
            await handleTransferPayout(event);
            break;

          // Balance events
          case 'balances#credit':
            await handleBalanceCredit(event);
            break;
          case 'balances#debit':
            await handleBalanceDebit(event);
            break;

          default:
            console.log(`[Wise] Unhandled event type: ${eventType}`);
        }

        // Mark as processed
        await markWiseWebhookProcessed(eventId, eventType, resourceType, resourceId, event);

        return { success: true, eventType, eventId };
      } catch (error) {
        console.error(`[Wise] Error processing webhook:`, error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process webhook',
        });
      }
    }),

  /**
   * Get webhook event history
   */
  getWebhookEvents: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = getDbSync();
      const events = await db.select()
        .from(wiseWebhookEvents)
        .orderBy(wiseWebhookEvents.createdAt)
        .limit(input.limit)
        .offset(input.offset);

      return { events };
    }),

  /**
   * Get transfer status
   */
  getTransferStatus: publicProcedure
    .input(z.object({
      transferId: z.string(),
    }))
    .query(async ({ input }) => {
      const db = getDbSync();
      const transfer = await db.select()
        .from(wiseTransfers)
        .where(eq(wiseTransfers.wiseTransferId, input.transferId))
        .limit(1);

      if (transfer.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Transfer not found',
        });
      }

      return { transfer: transfer[0] };
    }),

  /**
   * Get balance summary
   */
  getBalances: publicProcedure
    .query(async () => {
      const db = getDbSync();
      const balances = await db.select()
        .from(wiseBalances)
        .orderBy(wiseBalances.currency);

      return { balances };
    }),

  /**
   * Sync balances from Wise API
   */
  syncBalances: publicProcedure
    .mutation(async () => {
      // TODO: Implement Wise API balance sync
      return { success: true, message: 'Balance sync not yet implemented' };
    }),
});

/**
 * Export individual handlers for testing
 */
export {
  handleTransferStateChange,
  handleTransferActiveCases,
  handleTransferPayout,
  handleBalanceCredit,
  handleBalanceDebit,
  verifyWiseWebhookSignature,
};
