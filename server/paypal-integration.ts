/**
 * PayPal Integration Module
 * Complete PayPal API integration for payments, subscriptions, disputes, and payouts
 * 
 * Features:
 * - Order creation and capture
 * - Payment authorization and capture
 * - Refunds and disputes
 * - Subscriptions and billing plans
 * - Payouts and mass payments
 * - Webhooks handling
 * - Invoicing
 * - Payment disputes
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "./db";
import { 
  paypalTransactions, 
  paypalDisputes, 
  paypalSubscriptions,
  paypalPayouts,
  paypalWebhookEvents,
  orders,
  users
} from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// PayPal API Configuration
const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

interface PayPalAccessToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get PayPal OAuth access token with caching
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get PayPal access token',
    });
  }

  const data: PayPalAccessToken = await response.json();
  
  // Cache token with 5 minute buffer before expiry
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return data.access_token;
}

/**
 * Make authenticated PayPal API request
 */
async function paypalRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();
  
  const response = await fetch(`${PAYPAL_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': crypto.randomUUID(), // Idempotency
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('PayPal API Error:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'PayPal API request failed',
    });
  }

  return response.json();
}

// ============================================================================
// ORDER MANAGEMENT
// ============================================================================

export const paypalOrderSchemas = {
  createOrder: z.object({
    orderId: z.string(),
    amount: z.number().positive(),
    currency: z.string().default('USD'),
    description: z.string().optional(),
    returnUrl: z.string().url(),
    cancelUrl: z.string().url(),
  }),
  captureOrder: z.object({
    paypalOrderId: z.string(),
  }),
  authorizeOrder: z.object({
    paypalOrderId: z.string(),
  }),
  captureAuthorization: z.object({
    authorizationId: z.string(),
    amount: z.number().positive().optional(),
  }),
};

export async function createPayPalOrder(input: z.infer<typeof paypalOrderSchemas.createOrder>) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, input.orderId),
  });

  if (!order) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found' });
  }

  const paypalOrder = await paypalRequest<any>('/v2/checkout/orders', {
    method: 'POST',
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: input.orderId,
        description: input.description || `Order ${input.orderId}`,
        amount: {
          currency_code: input.currency,
          value: input.amount.toFixed(2),
        },
      }],
      application_context: {
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
        brand_name: 'Live Shopping Network',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
      },
    }),
  });

  // Store transaction record
  await db.insert(paypalTransactions).values({
    id: crypto.randomUUID(),
    orderId: input.orderId,
    paypalOrderId: paypalOrder.id,
    status: paypalOrder.status,
    amount: input.amount,
    currency: input.currency,
    createdAt: new Date(),
  });

  return {
    orderId: paypalOrder.id,
    status: paypalOrder.status,
    approveLink: paypalOrder.links.find((l: any) => l.rel === 'approve')?.href,
  };
}

export async function capturePayPalOrder(input: z.infer<typeof paypalOrderSchemas.captureOrder>) {
  const capture = await paypalRequest<any>(
    `/v2/checkout/orders/${input.paypalOrderId}/capture`,
    { method: 'POST' }
  );

  // Update transaction record
  await db.update(paypalTransactions)
    .set({
      status: capture.status,
      capturedAt: new Date(),
      paypalTransactionId: capture.purchase_units[0]?.payments?.captures[0]?.id,
    })
    .where(eq(paypalTransactions.paypalOrderId, input.paypalOrderId));

  return {
    status: capture.status,
    captureId: capture.purchase_units[0]?.payments?.captures[0]?.id,
  };
}

export async function authorizePayPalOrder(input: z.infer<typeof paypalOrderSchemas.authorizeOrder>) {
  const authorization = await paypalRequest<any>(
    `/v2/checkout/orders/${input.paypalOrderId}/authorize`,
    { method: 'POST' }
  );

  await db.update(paypalTransactions)
    .set({
      status: 'AUTHORIZED',
      authorizationId: authorization.purchase_units[0]?.payments?.authorizations[0]?.id,
    })
    .where(eq(paypalTransactions.paypalOrderId, input.paypalOrderId));

  return {
    authorizationId: authorization.purchase_units[0]?.payments?.authorizations[0]?.id,
    status: authorization.status,
  };
}

export async function captureAuthorization(input: z.infer<typeof paypalOrderSchemas.captureAuthorization>) {
  const body: any = {};
  if (input.amount) {
    body.amount = {
      currency_code: 'USD',
      value: input.amount.toFixed(2),
    };
  }

  const capture = await paypalRequest<any>(
    `/v2/payments/authorizations/${input.authorizationId}/capture`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );

  return {
    captureId: capture.id,
    status: capture.status,
    amount: parseFloat(capture.amount.value),
  };
}

// ============================================================================
// REFUNDS
// ============================================================================

export const paypalRefundSchemas = {
  createRefund: z.object({
    captureId: z.string(),
    amount: z.number().positive().optional(),
    note: z.string().optional(),
  }),
  getRefund: z.object({
    refundId: z.string(),
  }),
};

export async function createPayPalRefund(input: z.infer<typeof paypalRefundSchemas.createRefund>) {
  const body: any = {};
  
  if (input.amount) {
    body.amount = {
      currency_code: 'USD',
      value: input.amount.toFixed(2),
    };
  }
  
  if (input.note) {
    body.note_to_payer = input.note;
  }

  const refund = await paypalRequest<any>(
    `/v2/payments/captures/${input.captureId}/refund`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );

  return {
    refundId: refund.id,
    status: refund.status,
    amount: parseFloat(refund.amount.value),
  };
}

export async function getPayPalRefund(input: z.infer<typeof paypalRefundSchemas.getRefund>) {
  const refund = await paypalRequest<any>(`/v2/payments/refunds/${input.refundId}`);
  
  return {
    id: refund.id,
    status: refund.status,
    amount: parseFloat(refund.amount.value),
    currency: refund.amount.currency_code,
    createTime: refund.create_time,
    updateTime: refund.update_time,
  };
}

// ============================================================================
// SUBSCRIPTIONS & BILLING PLANS
// ============================================================================

export const paypalSubscriptionSchemas = {
  createPlan: z.object({
    name: z.string(),
    description: z.string(),
    amount: z.number().positive(),
    currency: z.string().default('USD'),
    interval: z.enum(['DAY', 'WEEK', 'MONTH', 'YEAR']),
    intervalCount: z.number().int().positive().default(1),
  }),
  createSubscription: z.object({
    planId: z.string(),
    userId: z.string(),
    returnUrl: z.string().url(),
    cancelUrl: z.string().url(),
  }),
  cancelSubscription: z.object({
    subscriptionId: z.string(),
    reason: z.string().optional(),
  }),
  suspendSubscription: z.object({
    subscriptionId: z.string(),
    reason: z.string(),
  }),
  activateSubscription: z.object({
    subscriptionId: z.string(),
    reason: z.string().optional(),
  }),
};

export async function createBillingPlan(input: z.infer<typeof paypalSubscriptionSchemas.createPlan>) {
  const plan = await paypalRequest<any>('/v1/billing/plans', {
    method: 'POST',
    body: JSON.stringify({
      product_id: 'PROD-XXXX', // Should be created separately
      name: input.name,
      description: input.description,
      billing_cycles: [{
        frequency: {
          interval_unit: input.interval,
          interval_count: input.intervalCount,
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0, // Infinite
        pricing_scheme: {
          fixed_price: {
            value: input.amount.toFixed(2),
            currency_code: input.currency,
          },
        },
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    }),
  });

  return {
    planId: plan.id,
    status: plan.status,
  };
}

export async function createSubscription(input: z.infer<typeof paypalSubscriptionSchemas.createSubscription>) {
  const subscription = await paypalRequest<any>('/v1/billing/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      plan_id: input.planId,
      application_context: {
        brand_name: 'Live Shopping Network',
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
        user_action: 'SUBSCRIBE_NOW',
      },
    }),
  });

  // Store subscription record
  await db.insert(paypalSubscriptions).values({
    id: crypto.randomUUID(),
    userId: input.userId,
    paypalSubscriptionId: subscription.id,
    planId: input.planId,
    status: subscription.status,
    createdAt: new Date(),
  });

  return {
    subscriptionId: subscription.id,
    status: subscription.status,
    approveLink: subscription.links.find((l: any) => l.rel === 'approve')?.href,
  };
}

export async function cancelSubscription(input: z.infer<typeof paypalSubscriptionSchemas.cancelSubscription>) {
  await paypalRequest<any>(
    `/v1/billing/subscriptions/${input.subscriptionId}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({
        reason: input.reason || 'Customer requested cancellation',
      }),
    }
  );

  await db.update(paypalSubscriptions)
    .set({ status: 'CANCELLED', cancelledAt: new Date() })
    .where(eq(paypalSubscriptions.paypalSubscriptionId, input.subscriptionId));

  return { success: true };
}

export async function suspendSubscription(input: z.infer<typeof paypalSubscriptionSchemas.suspendSubscription>) {
  await paypalRequest<any>(
    `/v1/billing/subscriptions/${input.subscriptionId}/suspend`,
    {
      method: 'POST',
      body: JSON.stringify({ reason: input.reason }),
    }
  );

  await db.update(paypalSubscriptions)
    .set({ status: 'SUSPENDED' })
    .where(eq(paypalSubscriptions.paypalSubscriptionId, input.subscriptionId));

  return { success: true };
}

export async function activateSubscription(input: z.infer<typeof paypalSubscriptionSchemas.activateSubscription>) {
  await paypalRequest<any>(
    `/v1/billing/subscriptions/${input.subscriptionId}/activate`,
    {
      method: 'POST',
      body: JSON.stringify({
        reason: input.reason || 'Reactivating subscription',
      }),
    }
  );

  await db.update(paypalSubscriptions)
    .set({ status: 'ACTIVE' })
    .where(eq(paypalSubscriptions.paypalSubscriptionId, input.subscriptionId));

  return { success: true };
}

// ============================================================================
// PAYOUTS & MASS PAYMENTS
// ============================================================================

export const paypalPayoutSchemas = {
  createPayout: z.object({
    recipientEmail: z.string().email(),
    amount: z.number().positive(),
    currency: z.string().default('USD'),
    note: z.string().optional(),
    recipientType: z.enum(['EMAIL', 'PHONE', 'PAYPAL_ID']).default('EMAIL'),
  }),
  createBatchPayout: z.object({
    items: z.array(z.object({
      recipientEmail: z.string().email(),
      amount: z.number().positive(),
      currency: z.string().default('USD'),
      note: z.string().optional(),
    })),
  }),
  getPayoutStatus: z.object({
    payoutBatchId: z.string(),
  }),
};

export async function createPayout(input: z.infer<typeof paypalPayoutSchemas.createPayout>) {
  const payout = await paypalRequest<any>('/v1/payments/payouts', {
    method: 'POST',
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: `batch_${Date.now()}`,
        email_subject: 'You have a payout!',
        email_message: input.note || 'You have received a payout from Live Shopping Network',
      },
      items: [{
        recipient_type: input.recipientType,
        amount: {
          value: input.amount.toFixed(2),
          currency: input.currency,
        },
        receiver: input.recipientEmail,
        note: input.note || 'Payment from Live Shopping Network',
        sender_item_id: `item_${Date.now()}`,
      }],
    }),
  });

  // Store payout record
  await db.insert(paypalPayouts).values({
    id: crypto.randomUUID(),
    paypalBatchId: payout.batch_header.payout_batch_id,
    recipientEmail: input.recipientEmail,
    amount: input.amount,
    currency: input.currency,
    status: payout.batch_header.batch_status,
    createdAt: new Date(),
  });

  return {
    batchId: payout.batch_header.payout_batch_id,
    status: payout.batch_header.batch_status,
  };
}

export async function createBatchPayout(input: z.infer<typeof paypalPayoutSchemas.createBatchPayout>) {
  const batchId = `batch_${Date.now()}`;
  
  const payout = await paypalRequest<any>('/v1/payments/payouts', {
    method: 'POST',
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: batchId,
        email_subject: 'You have a payout!',
      },
      items: input.items.map((item, idx) => ({
        recipient_type: 'EMAIL',
        amount: {
          value: item.amount.toFixed(2),
          currency: item.currency,
        },
        receiver: item.recipientEmail,
        note: item.note || 'Payment from Live Shopping Network',
        sender_item_id: `${batchId}_${idx}`,
      })),
    }),
  });

  // Store payout records
  await Promise.all(
    input.items.map(item =>
      db.insert(paypalPayouts).values({
        id: crypto.randomUUID(),
        paypalBatchId: payout.batch_header.payout_batch_id,
        recipientEmail: item.recipientEmail,
        amount: item.amount,
        currency: item.currency,
        status: 'PENDING',
        createdAt: new Date(),
      })
    )
  );

  return {
    batchId: payout.batch_header.payout_batch_id,
    status: payout.batch_header.batch_status,
    itemCount: input.items.length,
  };
}

export async function getPayoutStatus(input: z.infer<typeof paypalPayoutSchemas.getPayoutStatus>) {
  const payout = await paypalRequest<any>(`/v1/payments/payouts/${input.payoutBatchId}`);
  
  return {
    batchId: payout.batch_header.payout_batch_id,
    status: payout.batch_header.batch_status,
    timeCreated: payout.batch_header.time_created,
    amount: parseFloat(payout.batch_header.amount.value),
    fees: parseFloat(payout.batch_header.fees.value),
    items: payout.items?.map((item: any) => ({
      itemId: item.payout_item_id,
      status: item.transaction_status,
      amount: parseFloat(item.payout_item.amount.value),
      receiver: item.payout_item.receiver,
    })) || [],
  };
}

// ============================================================================
// DISPUTES
// ============================================================================

export const paypalDisputeSchemas = {
  getDispute: z.object({
    disputeId: z.string(),
  }),
  listDisputes: z.object({
    startDate: z.string().optional(),
    disputeState: z.enum(['REQUIRED_ACTION', 'REQUIRED_OTHER_PARTY_ACTION', 'UNDER_REVIEW', 'RESOLVED']).optional(),
  }),
  acceptClaim: z.object({
    disputeId: z.string(),
    note: z.string().optional(),
  }),
  provideEvidence: z.object({
    disputeId: z.string(),
    trackingNumber: z.string().optional(),
    carrierName: z.string().optional(),
    notes: z.string(),
    documents: z.array(z.string()).optional(), // Document IDs
  }),
  makeOffer: z.object({
    disputeId: z.string(),
    offerType: z.enum(['REFUND', 'REPLACEMENT']),
    offerAmount: z.number().positive().optional(),
    note: z.string(),
  }),
};

export async function getDispute(input: z.infer<typeof paypalDisputeSchemas.getDispute>) {
  const dispute = await paypalRequest<any>(`/v1/customer/disputes/${input.disputeId}`);
  
  return {
    id: dispute.dispute_id,
    reason: dispute.reason,
    status: dispute.status,
    amount: parseFloat(dispute.dispute_amount.value),
    currency: dispute.dispute_amount.currency_code,
    createTime: dispute.create_time,
    updateTime: dispute.update_time,
  };
}

export async function listDisputes(input: z.infer<typeof paypalDisputeSchemas.listDisputes>) {
  const params = new URLSearchParams();
  if (input.startDate) params.append('start_time', input.startDate);
  if (input.disputeState) params.append('dispute_state', input.disputeState);
  
  const disputes = await paypalRequest<any>(`/v1/customer/disputes?${params.toString()}`);
  
  return {
    disputes: disputes.items?.map((d: any) => ({
      id: d.dispute_id,
      reason: d.reason,
      status: d.status,
      amount: parseFloat(d.dispute_amount.value),
      createTime: d.create_time,
    })) || [],
  };
}

export async function acceptClaim(input: z.infer<typeof paypalDisputeSchemas.acceptClaim>) {
  await paypalRequest<any>(
    `/v1/customer/disputes/${input.disputeId}/accept-claim`,
    {
      method: 'POST',
      body: JSON.stringify({
        note: input.note || 'Accepting claim',
        accept_claim_type: 'REFUND',
      }),
    }
  );

  await db.update(paypalDisputes)
    .set({ status: 'RESOLVED', resolvedAt: new Date() })
    .where(eq(paypalDisputes.paypalDisputeId, input.disputeId));

  return { success: true };
}

export async function provideEvidence(input: z.infer<typeof paypalDisputeSchemas.provideEvidence>) {
  const evidence: any = { notes: input.notes };
  
  if (input.trackingNumber) {
    evidence.tracking_info = [{
      tracking_number: input.trackingNumber,
      carrier_name: input.carrierName || 'OTHER',
    }];
  }
  
  if (input.documents) {
    evidence.documents = input.documents.map(docId => ({ document_id: docId }));
  }

  await paypalRequest<any>(
    `/v1/customer/disputes/${input.disputeId}/provide-evidence`,
    {
      method: 'POST',
      body: JSON.stringify({ evidences: [evidence] }),
    }
  );

  return { success: true };
}

export async function makeOffer(input: z.infer<typeof paypalDisputeSchemas.makeOffer>) {
  const offer: any = {
    offer_type: input.offerType,
    note: input.note,
  };
  
  if (input.offerAmount) {
    offer.offer_amount = {
      currency_code: 'USD',
      value: input.offerAmount.toFixed(2),
    };
  }

  await paypalRequest<any>(
    `/v1/customer/disputes/${input.disputeId}/make-offer`,
    {
      method: 'POST',
      body: JSON.stringify(offer),
    }
  );

  return { success: true };
}

// ============================================================================
// INVOICING
// ============================================================================

export const paypalInvoiceSchemas = {
  createInvoice: z.object({
    recipientEmail: z.string().email(),
    items: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
    })),
    dueDate: z.string().optional(),
    note: z.string().optional(),
  }),
  sendInvoice: z.object({
    invoiceId: z.string(),
  }),
  cancelInvoice: z.object({
    invoiceId: z.string(),
  }),
};

export async function createInvoice(input: z.infer<typeof paypalInvoiceSchemas.createInvoice>) {
  const invoice = await paypalRequest<any>('/v2/invoicing/invoices', {
    method: 'POST',
    body: JSON.stringify({
      detail: {
        invoice_number: `INV-${Date.now()}`,
        invoice_date: new Date().toISOString().split('T')[0],
        payment_term: {
          due_date: input.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        },
        note: input.note,
      },
      invoicer: {
        name: { given_name: 'Live Shopping Network' },
      },
      primary_recipients: [{
        billing_info: {
          email_address: input.recipientEmail,
        },
      }],
      items: input.items.map(item => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity.toString(),
        unit_amount: {
          currency_code: 'USD',
          value: item.unitPrice.toFixed(2),
        },
      })),
      configuration: {
        allow_tip: false,
        tax_calculated_after_discount: true,
        tax_inclusive: false,
      },
    }),
  });

  return {
    invoiceId: invoice.id,
    href: invoice.href,
  };
}

export async function sendInvoice(input: z.infer<typeof paypalInvoiceSchemas.sendInvoice>) {
  await paypalRequest<any>(
    `/v2/invoicing/invoices/${input.invoiceId}/send`,
    {
      method: 'POST',
      body: JSON.stringify({
        send_to_invoicer: true,
      }),
    }
  );

  return { success: true };
}

export async function cancelInvoice(input: z.infer<typeof paypalInvoiceSchemas.cancelInvoice>) {
  await paypalRequest<any>(
    `/v2/invoicing/invoices/${input.invoiceId}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({
        subject: 'Invoice cancelled',
        note: 'This invoice has been cancelled',
        send_to_invoicer: true,
        send_to_recipient: true,
      }),
    }
  );

  return { success: true };
}

// ============================================================================
// WEBHOOKS
// ============================================================================

export async function handlePayPalWebhook(
  webhookId: string,
  headers: Record<string, string>,
  body: any
) {
  // Verify webhook signature
  const verificationData = {
    auth_algo: headers['paypal-auth-algo'],
    cert_url: headers['paypal-cert-url'],
    transmission_id: headers['paypal-transmission-id'],
    transmission_sig: headers['paypal-transmission-sig'],
    transmission_time: headers['paypal-transmission-time'],
    webhook_id: webhookId,
    webhook_event: body,
  };

  const verification = await paypalRequest<any>('/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    body: JSON.stringify(verificationData),
  });

  if (verification.verification_status !== 'SUCCESS') {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid webhook signature',
    });
  }

  // Store webhook event
  await db.insert(paypalWebhookEvents).values({
    id: crypto.randomUUID(),
    eventType: body.event_type,
    resourceType: body.resource_type,
    resourceId: body.resource?.id,
    payload: body,
    createdAt: new Date(),
  });

  // Handle different event types
  switch (body.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED':
      await handlePaymentCaptured(body.resource);
      break;
    case 'PAYMENT.CAPTURE.DENIED':
      await handlePaymentDenied(body.resource);
      break;
    case 'PAYMENT.CAPTURE.REFUNDED':
      await handlePaymentRefunded(body.resource);
      break;
    case 'BILLING.SUBSCRIPTION.ACTIVATED':
      await handleSubscriptionActivated(body.resource);
      break;
    case 'BILLING.SUBSCRIPTION.CANCELLED':
      await handleSubscriptionCancelled(body.resource);
      break;
    case 'CUSTOMER.DISPUTE.CREATED':
      await handleDisputeCreated(body.resource);
      break;
    case 'CUSTOMER.DISPUTE.RESOLVED':
      await handleDisputeResolved(body.resource);
      break;
  }

  return { success: true };
}

async function handlePaymentCaptured(resource: any) {
  await db.update(paypalTransactions)
    .set({
      status: 'COMPLETED',
      paypalTransactionId: resource.id,
      capturedAt: new Date(),
    })
    .where(eq(paypalTransactions.paypalOrderId, resource.supplementary_data?.related_ids?.order_id));
}

async function handlePaymentDenied(resource: any) {
  await db.update(paypalTransactions)
    .set({ status: 'DENIED' })
    .where(eq(paypalTransactions.paypalOrderId, resource.supplementary_data?.related_ids?.order_id));
}

async function handlePaymentRefunded(resource: any) {
  await db.update(paypalTransactions)
    .set({
      status: 'REFUNDED',
      refundedAt: new Date(),
    })
    .where(eq(paypalTransactions.paypalTransactionId, resource.id));
}

async function handleSubscriptionActivated(resource: any) {
  await db.update(paypalSubscriptions)
    .set({ status: 'ACTIVE' })
    .where(eq(paypalSubscriptions.paypalSubscriptionId, resource.id));
}

async function handleSubscriptionCancelled(resource: any) {
  await db.update(paypalSubscriptions)
    .set({
      status: 'CANCELLED',
      cancelledAt: new Date(),
    })
    .where(eq(paypalSubscriptions.paypalSubscriptionId, resource.id));
}

async function handleDisputeCreated(resource: any) {
  await db.insert(paypalDisputes).values({
    id: crypto.randomUUID(),
    paypalDisputeId: resource.dispute_id,
    reason: resource.reason,
    status: resource.status,
    amount: parseFloat(resource.dispute_amount.value),
    currency: resource.dispute_amount.currency_code,
    createdAt: new Date(resource.create_time),
  });
}

async function handleDisputeResolved(resource: any) {
  await db.update(paypalDisputes)
    .set({
      status: 'RESOLVED',
      outcome: resource.dispute_outcome?.outcome_code,
      resolvedAt: new Date(),
    })
    .where(eq(paypalDisputes.paypalDisputeId, resource.dispute_id));
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

export async function getPayPalAnalytics(startDate: Date, endDate: Date) {
  const transactions = await db.query.paypalTransactions.findMany({
    where: and(
      sql`${paypalTransactions.createdAt} >= ${startDate}`,
      sql`${paypalTransactions.createdAt} <= ${endDate}`
    ),
  });

  const totalRevenue = transactions
    .filter(t => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunded = transactions
    .filter(t => t.status === 'REFUNDED')
    .reduce((sum, t) => sum + t.amount, 0);

  const disputes = await db.query.paypalDisputes.findMany({
    where: and(
      sql`${paypalDisputes.createdAt} >= ${startDate}`,
      sql`${paypalDisputes.createdAt} <= ${endDate}`
    ),
  });

  return {
    totalTransactions: transactions.length,
    totalRevenue,
    totalRefunded,
    netRevenue: totalRevenue - totalRefunded,
    successRate: transactions.filter(t => t.status === 'COMPLETED').length / transactions.length,
    disputeCount: disputes.length,
    disputeRate: disputes.length / transactions.length,
    averageTransactionValue: totalRevenue / transactions.filter(t => t.status === 'COMPLETED').length,
  };
}

export default {
  // Orders
  createPayPalOrder,
  capturePayPalOrder,
  authorizePayPalOrder,
  captureAuthorization,
  
  // Refunds
  createPayPalRefund,
  getPayPalRefund,
  
  // Subscriptions
  createBillingPlan,
  createSubscription,
  cancelSubscription,
  suspendSubscription,
  activateSubscription,
  
  // Payouts
  createPayout,
  createBatchPayout,
  getPayoutStatus,
  
  // Disputes
  getDispute,
  listDisputes,
  acceptClaim,
  provideEvidence,
  makeOffer,
  
  // Invoicing
  createInvoice,
  sendInvoice,
  cancelInvoice,
  
  // Webhooks
  handlePayPalWebhook,
  
  // Analytics
  getPayPalAnalytics,
};
