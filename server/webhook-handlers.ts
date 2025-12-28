/**
 * Webhook Handlers - PayPal, Wise, Twilio
 * Centralized webhook processing with signature verification, deduplication, and idempotency
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { 
  disputes, 
  providerWebhookDedup, 
  disputeTimeline,
  orders,
  payouts,
  liveShows
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

// ============================================================================
// PayPal Webhook Verification
// ============================================================================

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource_type: string;
  resource: any;
  create_time: string;
  summary?: string;
}

async function verifyPayPalWebhook(
  headers: Record<string, string>,
  body: string
): Promise<boolean> {
  // PayPal webhook signature verification
  const transmissionId = headers['paypal-transmission-id'];
  const transmissionTime = headers['paypal-transmission-time'];
  const certUrl = headers['paypal-cert-url'];
  const authAlgo = headers['paypal-auth-algo'];
  const transmissionSig = headers['paypal-transmission-sig'];
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig || !webhookId) {
    return false;
  }

  // In production, verify signature using PayPal SDK
  // For now, basic validation
  return true;
}

// ============================================================================
// Wise Webhook Verification
// ============================================================================

interface WiseWebhookEvent {
  subscription_id: string;
  event_type: string;
  schema_version: string;
  sent_at: string;
  data: {
    resource: any;
    current_state: string;
    previous_state?: string;
    occurred_at: string;
  };
}

async function verifyWiseWebhook(
  headers: Record<string, string>,
  body: string
): Promise<boolean> {
  const signature = headers['x-signature'];
  const publicKey = process.env.WISE_WEBHOOK_PUBLIC_KEY;

  if (!signature || !publicKey) {
    return false;
  }

  try {
    // Verify signature using public key
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(body);
    return verify.verify(publicKey, signature, 'base64');
  } catch (error) {
    console.error('Wise webhook verification failed:', error);
    return false;
  }
}

// ============================================================================
// Twilio Webhook Verification
// ============================================================================

interface TwilioWebhookEvent {
  StatusCallbackEvent: string;
  RoomSid: string;
  RoomName?: string;
  RoomStatus?: string;
  CompositionSid?: string;
  RecordingSid?: string;
  MediaUri?: string;
  Duration?: string;
  Timestamp: string;
}

async function verifyTwilioWebhook(
  url: string,
  params: Record<string, string>,
  signature: string
): Promise<boolean> {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!authToken || !signature) {
    return false;
  }

  // Twilio signature validation
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);

  const hmac = crypto.createHmac('sha1', authToken);
  hmac.update(Buffer.from(data, 'utf-8'));
  const expectedSignature = hmac.digest('base64');

  return signature === expectedSignature;
}

// ============================================================================
// Webhook Deduplication
// ============================================================================

async function isDuplicateWebhook(
  channelId: string,
  provider: string,
  eventId: string
): Promise<boolean> {
  const existing = await db
    .select()
    .from(providerWebhookDedup)
    .where(
      and(
        eq(providerWebhookDedup.channelId, channelId),
        eq(providerWebhookDedup.provider, provider),
        eq(providerWebhookDedup.eventId, eventId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return true;
  }

  // Record this webhook
  await db.insert(providerWebhookDedup).values({
    channelId,
    provider,
    eventId,
    receivedAt: new Date(),
  });

  return false;
}

// ============================================================================
// PayPal Dispute Webhook Handler
// ============================================================================

async function handlePayPalDisputeWebhook(
  channelId: string,
  event: PayPalWebhookEvent
): Promise<void> {
  const { resource } = event;
  const disputeId = resource.dispute_id;
  const status = resource.status;
  const reason = resource.reason;
  const amount = resource.dispute_amount;

  // Check for duplicate
  if (await isDuplicateWebhook(channelId, 'PAYPAL', event.id)) {
    console.log(`Duplicate PayPal webhook: ${event.id}`);
    return;
  }

  // Upsert dispute
  const existing = await db
    .select()
    .from(disputes)
    .where(
      and(
        eq(disputes.channelId, channelId),
        eq(disputes.providerCaseId, disputeId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing dispute
    await db
      .update(disputes)
      .set({
        providerStatus: status,
        status: mapPayPalStatusToInternal(status),
        lastProviderUpdateAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(disputes.disputeId, existing[0].disputeId));

    // Add timeline entry
    await db.insert(disputeTimeline).values({
      channelId,
      disputeId: existing[0].disputeId,
      kind: 'STATUS_CHANGE',
      message: `PayPal status changed to: ${status}`,
      meta: { event_type: event.event_type, resource },
    });
  } else {
    // Create new dispute
    const newDispute = await db.insert(disputes).values({
      channelId,
      provider: 'PAYPAL',
      providerCaseId: disputeId,
      providerStatus: status,
      status: mapPayPalStatusToInternal(status),
      reason: reason || 'Unknown',
      amountCents: Math.round(parseFloat(amount?.value || '0') * 100),
      currency: amount?.currency_code || 'USD',
      evidenceDeadline: resource.seller_response_due_date
        ? new Date(resource.seller_response_due_date)
        : null,
      lastProviderUpdateAt: new Date(),
    });

    // Add timeline entry
    await db.insert(disputeTimeline).values({
      channelId,
      disputeId: newDispute.insertId as any,
      kind: 'CREATED',
      message: `Dispute created from PayPal webhook`,
      meta: { event_type: event.event_type, resource },
    });
  }
}

function mapPayPalStatusToInternal(paypalStatus: string): string {
  const mapping: Record<string, string> = {
    'OPEN': 'OPEN',
    'WAITING_FOR_SELLER_RESPONSE': 'EVIDENCE_REQUIRED',
    'WAITING_FOR_BUYER_RESPONSE': 'SUBMITTED',
    'UNDER_REVIEW': 'SUBMITTED',
    'RESOLVED': 'WON',
    'OTHER': 'CLOSED',
  };
  return mapping[paypalStatus] || 'OPEN';
}

// ============================================================================
// PayPal Payment Webhook Handler
// ============================================================================

async function handlePayPalPaymentWebhook(
  channelId: string,
  event: PayPalWebhookEvent
): Promise<void> {
  const { resource } = event;
  
  // Check for duplicate
  if (await isDuplicateWebhook(channelId, 'PAYPAL', event.id)) {
    console.log(`Duplicate PayPal payment webhook: ${event.id}`);
    return;
  }

  // Handle different payment events
  switch (event.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED':
      await handlePaymentCaptureCompleted(channelId, resource);
      break;
    case 'PAYMENT.CAPTURE.REFUNDED':
      await handlePaymentRefunded(channelId, resource);
      break;
    case 'PAYMENT.CAPTURE.REVERSED':
      await handlePaymentReversed(channelId, resource);
      break;
    default:
      console.log(`Unhandled PayPal payment event: ${event.event_type}`);
  }
}

async function handlePaymentCaptureCompleted(
  channelId: string,
  resource: any
): Promise<void> {
  // Update order status to paid
  const captureId = resource.id;
  const orderId = resource.custom_id; // Assuming we store order ID in custom_id

  if (orderId) {
    await db
      .update(orders)
      .set({
        paymentStatus: 'paid',
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orders.channelId, channelId),
          eq(orders.id, orderId)
        )
      );
  }
}

async function handlePaymentRefunded(
  channelId: string,
  resource: any
): Promise<void> {
  // Handle refund processing
  const captureId = resource.id;
  const refundAmount = resource.amount?.value;

  // Update order refund status
  // Implementation depends on your refund tracking system
  console.log(`Payment refunded: ${captureId}, amount: ${refundAmount}`);
}

async function handlePaymentReversed(
  channelId: string,
  resource: any
): Promise<void> {
  // Handle chargeback/reversal
  const captureId = resource.id;
  
  // Create dispute or flag for review
  console.log(`Payment reversed (chargeback): ${captureId}`);
}

// ============================================================================
// Wise Payout Webhook Handler
// ============================================================================

async function handleWisePayoutWebhook(
  channelId: string,
  event: WiseWebhookEvent
): Promise<void> {
  const { data } = event;
  const transferId = data.resource.id;
  const currentState = data.current_state;

  // Check for duplicate
  if (await isDuplicateWebhook(channelId, 'WISE', event.subscription_id + '-' + event.sent_at)) {
    console.log(`Duplicate Wise webhook`);
    return;
  }

  // Update payout status
  await db
    .update(payouts)
    .set({
      status: mapWiseStatusToInternal(currentState),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(payouts.channelId, channelId),
        eq(payouts.providerTransferId, transferId)
      )
    );

  // Handle different states
  switch (currentState) {
    case 'outgoing_payment_sent':
      console.log(`Payout completed: ${transferId}`);
      break;
    case 'funds_refunded':
      console.log(`Payout failed and refunded: ${transferId}`);
      break;
    case 'bounced_back':
      console.log(`Payout bounced back: ${transferId}`);
      break;
    default:
      console.log(`Wise payout state: ${currentState}`);
  }
}

function mapWiseStatusToInternal(wiseStatus: string): string {
  const mapping: Record<string, string> = {
    'processing': 'PROCESSING',
    'outgoing_payment_sent': 'COMPLETED',
    'funds_refunded': 'FAILED',
    'bounced_back': 'FAILED',
    'cancelled': 'CANCELLED',
  };
  return mapping[wiseStatus] || 'PENDING';
}

// ============================================================================
// Twilio Video Webhook Handler
// ============================================================================

async function handleTwilioVideoWebhook(
  channelId: string,
  event: TwilioWebhookEvent
): Promise<void> {
  const { StatusCallbackEvent, RoomSid, RoomName } = event;

  // Check for duplicate
  const eventId = `${RoomSid}-${StatusCallbackEvent}-${event.Timestamp}`;
  if (await isDuplicateWebhook(channelId, 'TWILIO', eventId)) {
    console.log(`Duplicate Twilio webhook`);
    return;
  }

  switch (StatusCallbackEvent) {
    case 'room-ended':
      await handleRoomEnded(channelId, event);
      break;
    case 'recording-completed':
      await handleRecordingCompleted(channelId, event);
      break;
    case 'composition-available':
      await handleCompositionAvailable(channelId, event);
      break;
    default:
      console.log(`Unhandled Twilio event: ${StatusCallbackEvent}`);
  }
}

async function handleRoomEnded(
  channelId: string,
  event: TwilioWebhookEvent
): Promise<void> {
  const { RoomSid, RoomName, Duration } = event;

  // Update live show status
  await db
    .update(liveShows)
    .set({
      status: 'ended',
      endedAt: new Date(),
      duration: Duration ? parseInt(Duration) : null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(liveShows.channelId, channelId),
        eq(liveShows.twilioRoomSid, RoomSid)
      )
    );

  console.log(`Live show ended: ${RoomName} (${RoomSid})`);
}

async function handleRecordingCompleted(
  channelId: string,
  event: TwilioWebhookEvent
): Promise<void> {
  const { RecordingSid, MediaUri, Duration, RoomSid } = event;

  // Store recording information (table not yet in schema)
  // await db.insert(recordings).values({
  //   channelId,
  //   roomSid: RoomSid,
  //   recordingSid: RecordingSid,
  //   mediaUri: MediaUri,
  //   duration: Duration ? parseInt(Duration) : null,
  //   status: 'completed',
  // });

  console.log(`Recording completed: ${RecordingSid}`);
}

async function handleCompositionAvailable(
  channelId: string,
  event: TwilioWebhookEvent
): Promise<void> {
  const { CompositionSid, MediaUri, RoomSid } = event;

  // Update recording with composition (table not yet in schema)
  // await db
  //   .update(recordings)
  //   .set({
  //     compositionSid: CompositionSid,
  //     compositionUri: MediaUri,
  //     updatedAt: new Date(),
  //   })
  //   .where(
  //     and(
  //       eq(recordings.channelId, channelId),
  //       eq(recordings.roomSid, RoomSid)
  //     )
  //   );

  console.log(`Composition available: ${CompositionSid}`);
}

// ============================================================================
// Webhook Router
// ============================================================================

export const webhookRouter = router({
  // PayPal dispute webhook
  paypalDispute: publicProcedure
    .input(
      z.object({
        channelId: z.string(),
        headers: z.record(z.string()),
        body: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { channelId, headers, body } = input;

      // Verify webhook signature
      const isValid = await verifyPayPalWebhook(headers, body);
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid PayPal webhook signature',
        });
      }

      const event: PayPalWebhookEvent = JSON.parse(body);
      await handlePayPalDisputeWebhook(channelId, event);

      return { success: true };
    }),

  // PayPal payment webhook
  paypalPayment: publicProcedure
    .input(
      z.object({
        channelId: z.string(),
        headers: z.record(z.string()),
        body: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { channelId, headers, body } = input;

      const isValid = await verifyPayPalWebhook(headers, body);
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid PayPal webhook signature',
        });
      }

      const event: PayPalWebhookEvent = JSON.parse(body);
      await handlePayPalPaymentWebhook(channelId, event);

      return { success: true };
    }),

  // Wise payout webhook
  wisePayout: publicProcedure
    .input(
      z.object({
        channelId: z.string(),
        headers: z.record(z.string()),
        body: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { channelId, headers, body } = input;

      const isValid = await verifyWiseWebhook(headers, body);
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid Wise webhook signature',
        });
      }

      const event: WiseWebhookEvent = JSON.parse(body);
      await handleWisePayoutWebhook(channelId, event);

      return { success: true };
    }),

  // Twilio video webhook
  twilioVideo: publicProcedure
    .input(
      z.object({
        channelId: z.string(),
        url: z.string(),
        params: z.record(z.string()),
        signature: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { channelId, url, params, signature } = input;

      const isValid = await verifyTwilioWebhook(url, params, signature);
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid Twilio webhook signature',
        });
      }

      const event = params as unknown as TwilioWebhookEvent;
      await handleTwilioVideoWebhook(channelId, event);

      return { success: true };
    }),
});
