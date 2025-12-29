/**
 * PayPal Webhook Handlers
 * 
 * Handles PayPal webhooks for:
 * - Disputes (chargebacks, claims)
 * - Settlements
 * - Refunds
 * - Subscription events
 */

import { db } from "./db.js";
import {
  paypalWebhookEvents,
  paypalDisputes,
  paypalTransactions,
  orders,
  disputes,
  reviewQueueItems,
} from "../drizzle/schema.js";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import crypto from "crypto";

// ============================================================================
// Webhook Signature Verification
// ============================================================================

export function verifyPayPalWebhookSignature(
  webhookId: string,
  transmissionId: string,
  transmissionTime: string,
  certUrl: string,
  authAlgo: string,
  transmissionSig: string,
  webhookEvent: any
): boolean {
  // In production, implement full PayPal signature verification
  // https://developer.paypal.com/api/rest/webhooks/rest/#verify-webhook-signature
  
  // For now, return true (MUST implement in production)
  console.warn("PayPal webhook signature verification not fully implemented");
  return true;
}

// ============================================================================
// Webhook Event Handlers
// ============================================================================

export class PayPalWebhookHandler {
  /**
   * Main webhook handler - routes events to specific handlers
   */
  async handleWebhook(payload: any, headers: Record<string, string>): Promise<void> {
    const eventType = payload.event_type;
    const eventId = payload.id;

    // Check for duplicate events
    const existing = await db.query.paypalWebhookEvents.findFirst({
      where: eq(paypalWebhookEvents.eventId, eventId),
    });

    if (existing) {
      console.log(`Duplicate PayPal webhook event: ${eventId}`);
      return;
    }

    // Store webhook event
    await db.insert(paypalWebhookEvents).values({
      eventId,
      eventType,
      payload: payload as any,
      receivedAt: new Date(),
    });

    // Route to specific handler
    switch (eventType) {
      // Dispute events
      case "CUSTOMER.DISPUTE.CREATED":
        await this.handleDisputeCreated(payload);
        break;
      case "CUSTOMER.DISPUTE.RESOLVED":
        await this.handleDisputeResolved(payload);
        break;
      case "CUSTOMER.DISPUTE.UPDATED":
        await this.handleDisputeUpdated(payload);
        break;

      // Payment events
      case "PAYMENT.CAPTURE.COMPLETED":
        await this.handlePaymentCaptured(payload);
        break;
      case "PAYMENT.CAPTURE.REFUNDED":
        await this.handlePaymentRefunded(payload);
        break;

      // Subscription events
      case "BILLING.SUBSCRIPTION.CREATED":
      case "BILLING.SUBSCRIPTION.ACTIVATED":
      case "BILLING.SUBSCRIPTION.UPDATED":
      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.SUSPENDED":
      case "BILLING.SUBSCRIPTION.EXPIRED":
        await this.handleSubscriptionEvent(payload);
        break;

      default:
        console.log(`Unhandled PayPal webhook event type: ${eventType}`);
    }
  }

  /**
   * Handle dispute created event
   */
  private async handleDisputeCreated(payload: any): Promise<void> {
    const resource = payload.resource;
    const disputeId = resource.dispute_id;
    const orderId = resource.disputed_transactions?.[0]?.seller_transaction_id;

    // Find the order in our system
    const order = orderId
      ? await db.query.orders.findFirst({
          where: eq(orders.stripePaymentIntentId, orderId),
        })
      : null;

    // Create dispute record
    const disputeDbId = nanoid();
    await db.insert(paypalDisputes).values({
      id: disputeDbId,
      disputeId,
      orderId: order?.id,
      reason: resource.reason,
      status: resource.status,
      disputeAmount: Math.round(parseFloat(resource.dispute_amount?.value || "0") * 100),
      currency: resource.dispute_amount?.currency_code || "USD",
      disputeLifeCycleStage: resource.dispute_life_cycle_stage,
      disputeChannel: resource.dispute_channel,
      externalReasonCode: resource.external_reason_code,
      buyerResponseDueDate: resource.buyer_response_due_date
        ? new Date(resource.buyer_response_due_date)
        : null,
      sellerResponseDueDate: resource.seller_response_due_date
        ? new Date(resource.seller_response_due_date)
        : null,
      rawPayload: resource as any,
      createdAt: new Date(resource.create_time),
    });

    // Create internal dispute tracking
    await db.insert(disputes).values({
      id: nanoid(),
      orderId: order?.id || null,
      provider: "PAYPAL",
      providerDisputeId: disputeId,
      status: "OPEN",
      reason: resource.reason,
      amount: Math.round(parseFloat(resource.dispute_amount?.value || "0") * 100),
      currency: resource.dispute_amount?.currency_code || "USD",
      evidenceDeadline: resource.seller_response_due_date
        ? new Date(resource.seller_response_due_date)
        : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create review queue item for operator
    await db.insert(reviewQueueItems).values({
      id: nanoid(),
      type: "DISPUTE",
      severity: "HIGH",
      status: "OPEN",
      slaDeadline: resource.seller_response_due_date
        ? new Date(resource.seller_response_due_date)
        : null,
      refType: "DISPUTE",
      refId: disputeDbId,
      title: `PayPal Dispute: ${resource.reason}`,
      summary: `Dispute opened for order ${orderId || "unknown"}. Amount: ${resource.dispute_amount?.value} ${resource.dispute_amount?.currency_code}`,
      metadata: { disputeId, orderId, reason: resource.reason } as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`PayPal dispute created: ${disputeId}`);
  }

  /**
   * Handle dispute resolved event
   */
  private async handleDisputeResolved(payload: any): Promise<void> {
    const resource = payload.resource;
    const disputeId = resource.dispute_id;
    const outcome = resource.dispute_outcome;

    // Update PayPal dispute record
    await db
      .update(paypalDisputes)
      .set({
        status: resource.status,
        disputeOutcome: outcome?.outcome_code,
        resolvedAt: new Date(),
      })
      .where(eq(paypalDisputes.disputeId, disputeId));

    // Update internal dispute record
    const internalStatus =
      outcome?.outcome_code === "RESOLVED_BUYER_FAVOUR" ? "LOST" : "WON";

    await db
      .update(disputes)
      .set({
        status: internalStatus,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(disputes.providerDisputeId, disputeId));

    console.log(`PayPal dispute resolved: ${disputeId} - ${internalStatus}`);
  }

  /**
   * Handle dispute updated event
   */
  private async handleDisputeUpdated(payload: any): Promise<void> {
    const resource = payload.resource;
    const disputeId = resource.dispute_id;

    // Update PayPal dispute record
    await db
      .update(paypalDisputes)
      .set({
        status: resource.status,
        disputeLifeCycleStage: resource.dispute_life_cycle_stage,
        rawPayload: resource as any,
      })
      .where(eq(paypalDisputes.disputeId, disputeId));

    // Update internal dispute record
    await db
      .update(disputes)
      .set({
        lastProviderUpdate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(disputes.providerDisputeId, disputeId));

    console.log(`PayPal dispute updated: ${disputeId}`);
  }

  /**
   * Handle payment captured event
   */
  private async handlePaymentCaptured(payload: any): Promise<void> {
    const resource = payload.resource;
    const captureId = resource.id;
    const amount = parseFloat(resource.amount?.value || "0");
    const currency = resource.amount?.currency_code || "USD";

    // Store transaction record
    await db.insert(paypalTransactions).values({
      id: nanoid(),
      transactionId: captureId,
      transactionType: "CAPTURE",
      amount: Math.round(amount * 100),
      currency,
      status: resource.status,
      rawPayload: resource as any,
      createdAt: new Date(resource.create_time),
    });

    console.log(`PayPal payment captured: ${captureId} - ${amount} ${currency}`);
  }

  /**
   * Handle payment refunded event
   */
  private async handlePaymentRefunded(payload: any): Promise<void> {
    const resource = payload.resource;
    const refundId = resource.id;
    const amount = parseFloat(resource.amount?.value || "0");
    const currency = resource.amount?.currency_code || "USD";

    // Store transaction record
    await db.insert(paypalTransactions).values({
      id: nanoid(),
      transactionId: refundId,
      transactionType: "REFUND",
      amount: Math.round(amount * 100),
      currency,
      status: resource.status,
      rawPayload: resource as any,
      createdAt: new Date(resource.create_time),
    });

    console.log(`PayPal payment refunded: ${refundId} - ${amount} ${currency}`);
  }

  /**
   * Handle subscription events
   */
  private async handleSubscriptionEvent(payload: any): Promise<void> {
    const resource = payload.resource;
    const subscriptionId = resource.id;
    const status = resource.status;

    // Update subscription record
    await db
      .update(paypalSubscriptions)
      .set({
        status,
        rawPayload: resource as any,
      })
      .where(eq(paypalSubscriptions.subscriptionId, subscriptionId));

    console.log(`PayPal subscription ${payload.event_type}: ${subscriptionId}`);
  }
}

// Export singleton instance
export const paypalWebhookHandler = new PayPalWebhookHandler();
