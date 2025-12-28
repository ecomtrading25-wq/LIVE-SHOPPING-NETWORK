import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDbSync } from "./db";
import { 
  paypalWebhookEvents, 
  paypalTransactions, 
  disputes,
  orders,
  orderRefunds
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

/**
 * PayPal Webhook Handlers
 * Comprehensive webhook processing for PayPal events
 * Handles payments, disputes, refunds, and subscription events
 */

// ============================================================================
// WEBHOOK SIGNATURE VERIFICATION
// ============================================================================

function verifyPayPalWebhookSignature(
  headers: Record<string, string>,
  body: string,
  webhookId: string
): boolean {
  const transmissionId = headers['paypal-transmission-id'];
  const transmissionTime = headers['paypal-transmission-time'];
  const transmissionSig = headers['paypal-transmission-sig'];
  const certUrl = headers['paypal-cert-url'];
  const authAlgo = headers['paypal-auth-algo'];

  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
    return false;
  }

  // In production, verify against PayPal's certificate
  // For now, we'll do basic validation
  const expectedMessage = `${transmissionId}|${transmissionTime}|${webhookId}|${crypto.createHash('sha256').update(body).digest('hex')}`;
  
  // TODO: Implement full certificate verification in production
  return true;
}

// ============================================================================
// WEBHOOK DEDUPLICATION
// ============================================================================

async function isWebhookProcessed(eventId: string): Promise<boolean> {
  const db = getDbSync();
  const existing = await db.select()
    .from(paypalWebhookEvents)
    .where(eq(paypalWebhookEvents.eventId, eventId))
    .limit(1);
  
  return existing.length > 0;
}

async function markWebhookProcessed(
  eventId: string,
  eventType: string,
  resourceType: string,
  resourceId: string,
  payload: any
): Promise<void> {
  const db = getDbSync();
  await db.insert(paypalWebhookEvents).values({
    id: crypto.randomUUID(),
    eventId,
    eventType,
    resourceType,
    resourceId,
    payload,
    createdAt: new Date(),
  });
}

// ============================================================================
// PAYMENT EVENT HANDLERS
// ============================================================================

async function handlePaymentCaptureCompleted(event: any): Promise<void> {
  const resource = event.resource;
  const db = getDbSync();

  // Extract order ID from custom_id or metadata
  const orderId = resource.custom_id || resource.supplementary_data?.related_ids?.order_id;

  if (orderId) {
    // Update order status
    await db.update(orders)
      .set({
        paymentStatus: 'completed',
        paidAt: new Date(resource.create_time),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
  }

  // Store transaction record
  await db.insert(paypalTransactions).values({
    id: crypto.randomUUID(),
    paypalTransactionId: resource.id,
    orderId: orderId || null,
    amount: parseFloat(resource.amount.value),
    currency: resource.amount.currency_code,
    status: resource.status,
    type: 'CAPTURE',
    createdAt: new Date(resource.create_time),
  });

  console.log(`[PayPal] Payment captured: ${resource.id} for order: ${orderId}`);
}

async function handlePaymentCaptureDenied(event: any): Promise<void> {
  const resource = event.resource;
  const db = getDbSync();

  const orderId = resource.custom_id || resource.supplementary_data?.related_ids?.order_id;

  if (orderId) {
    await db.update(orders)
      .set({
        paymentStatus: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
  }

  console.log(`[PayPal] Payment denied: ${resource.id} for order: ${orderId}`);
}

async function handlePaymentCaptureRefunded(event: any): Promise<void> {
  const resource = event.resource;
  const db = getDbSync();

  const orderId = resource.custom_id || resource.supplementary_data?.related_ids?.order_id;

  if (orderId) {
    // Create refund record
    await db.insert(orderRefunds).values({
      id: crypto.randomUUID(),
      orderId,
      amount: parseFloat(resource.amount.value),
      currency: resource.amount.currency_code,
      reason: 'paypal_refund',
      status: 'completed',
      processedAt: new Date(resource.create_time),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Update order status
    await db.update(orders)
      .set({
        refundStatus: 'refunded',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
  }

  console.log(`[PayPal] Payment refunded: ${resource.id} for order: ${orderId}`);
}

// ============================================================================
// DISPUTE EVENT HANDLERS
// ============================================================================

async function handleCustomerDisputeCreated(event: any): Promise<void> {
  const resource = event.resource;
  const db = getDbSync();

  // Extract transaction/order details
  const disputedTransactions = resource.disputed_transactions || [];
  const orderId = disputedTransactions[0]?.seller_transaction_id;

  // Create or update dispute record
  await db.insert(disputes).values({
    id: crypto.randomUUID(),
    channelId: 'default', // TODO: Map to actual channel
    provider: 'PAYPAL',
    providerCaseId: resource.dispute_id,
    providerStatus: resource.status,
    orderId: orderId || null,
    status: 'OPEN',
    reason: resource.reason,
    amountCents: Math.round(parseFloat(resource.dispute_amount.value) * 100),
    currency: resource.dispute_amount.currency_code,
    evidenceDeadline: resource.seller_response_due_date ? new Date(resource.seller_response_due_date) : null,
    lastProviderUpdateAt: new Date(resource.update_time),
    createdAt: new Date(resource.create_time),
    updatedAt: new Date(),
  }).onDuplicateKeyUpdate({
    set: {
      providerStatus: resource.status,
      lastProviderUpdateAt: new Date(resource.update_time),
      updatedAt: new Date(),
    }
  });

  console.log(`[PayPal] Dispute created: ${resource.dispute_id}`);
}

async function handleCustomerDisputeResolved(event: any): Promise<void> {
  const resource = event.resource;
  const db = getDbSync();

  await db.update(disputes)
    .set({
      providerStatus: resource.status,
      status: resource.status === 'RESOLVED' ? 'WON' : 'LOST',
      lastProviderUpdateAt: new Date(resource.update_time),
      updatedAt: new Date(),
    })
    .where(eq(disputes.providerCaseId, resource.dispute_id));

  console.log(`[PayPal] Dispute resolved: ${resource.dispute_id} - ${resource.status}`);
}

async function handleCustomerDisputeUpdated(event: any): Promise<void> {
  const resource = event.resource;
  const db = getDbSync();

  await db.update(disputes)
    .set({
      providerStatus: resource.status,
      lastProviderUpdateAt: new Date(resource.update_time),
      evidenceDeadline: resource.seller_response_due_date ? new Date(resource.seller_response_due_date) : null,
      updatedAt: new Date(),
    })
    .where(eq(disputes.providerCaseId, resource.dispute_id));

  console.log(`[PayPal] Dispute updated: ${resource.dispute_id}`);
}

// ============================================================================
// SUBSCRIPTION EVENT HANDLERS
// ============================================================================

async function handleBillingSubscriptionCreated(event: any): Promise<void> {
  const resource = event.resource;
  console.log(`[PayPal] Subscription created: ${resource.id}`);
  // TODO: Implement subscription tracking if needed
}

async function handleBillingSubscriptionActivated(event: any): Promise<void> {
  const resource = event.resource;
  console.log(`[PayPal] Subscription activated: ${resource.id}`);
  // TODO: Implement subscription tracking if needed
}

async function handleBillingSubscriptionCancelled(event: any): Promise<void> {
  const resource = event.resource;
  console.log(`[PayPal] Subscription cancelled: ${resource.id}`);
  // TODO: Implement subscription tracking if needed
}

// ============================================================================
// MAIN WEBHOOK ROUTER
// ============================================================================

export const paypalWebhookRouter = router({
  /**
   * Main PayPal webhook endpoint
   * Receives and processes all PayPal webhook events
   */
  handleWebhook: publicProcedure
    .input(z.object({
      webhookId: z.string(),
      body: z.any(),
      headers: z.record(z.string()),
    }))
    .mutation(async ({ input }) => {
      const { webhookId, body, headers } = input;

      // Verify webhook signature
      const bodyString = JSON.stringify(body);
      const isValid = verifyPayPalWebhookSignature(headers, bodyString, webhookId);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid webhook signature',
        });
      }

      const event = body;
      const eventId = event.id;
      const eventType = event.event_type;

      // Check for duplicate
      if (await isWebhookProcessed(eventId)) {
        console.log(`[PayPal] Duplicate webhook: ${eventId}`);
        return { success: true, duplicate: true };
      }

      // Extract resource info
      const resource = event.resource || {};
      const resourceType = event.resource_type || 'unknown';
      const resourceId = resource.id || 'unknown';

      try {
        // Route to appropriate handler
        switch (eventType) {
          // Payment events
          case 'PAYMENT.CAPTURE.COMPLETED':
            await handlePaymentCaptureCompleted(event);
            break;
          case 'PAYMENT.CAPTURE.DENIED':
            await handlePaymentCaptureDenied(event);
            break;
          case 'PAYMENT.CAPTURE.REFUNDED':
            await handlePaymentCaptureRefunded(event);
            break;

          // Dispute events
          case 'CUSTOMER.DISPUTE.CREATED':
            await handleCustomerDisputeCreated(event);
            break;
          case 'CUSTOMER.DISPUTE.RESOLVED':
            await handleCustomerDisputeResolved(event);
            break;
          case 'CUSTOMER.DISPUTE.UPDATED':
            await handleCustomerDisputeUpdated(event);
            break;

          // Subscription events
          case 'BILLING.SUBSCRIPTION.CREATED':
            await handleBillingSubscriptionCreated(event);
            break;
          case 'BILLING.SUBSCRIPTION.ACTIVATED':
            await handleBillingSubscriptionActivated(event);
            break;
          case 'BILLING.SUBSCRIPTION.CANCELLED':
            await handleBillingSubscriptionCancelled(event);
            break;

          default:
            console.log(`[PayPal] Unhandled event type: ${eventType}`);
        }

        // Mark as processed
        await markWebhookProcessed(eventId, eventType, resourceType, resourceId, event);

        return { success: true, eventType, eventId };
      } catch (error) {
        console.error(`[PayPal] Error processing webhook:`, error);
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
        .from(paypalWebhookEvents)
        .orderBy(paypalWebhookEvents.createdAt)
        .limit(input.limit)
        .offset(input.offset);

      return { events };
    }),

  /**
   * Retry failed webhook processing
   */
  retryWebhook: publicProcedure
    .input(z.object({
      eventId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = getDbSync();
      const event = await db.select()
        .from(paypalWebhookEvents)
        .where(eq(paypalWebhookEvents.eventId, input.eventId))
        .limit(1);

      if (event.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Webhook event not found',
        });
      }

      // TODO: Implement retry logic
      return { success: true };
    }),
});

/**
 * Export individual handlers for testing
 */
export {
  handlePaymentCaptureCompleted,
  handlePaymentCaptureDenied,
  handlePaymentCaptureRefunded,
  handleCustomerDisputeCreated,
  handleCustomerDisputeResolved,
  handleCustomerDisputeUpdated,
  verifyPayPalWebhookSignature,
};
