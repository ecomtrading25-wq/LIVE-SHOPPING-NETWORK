/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events for payments, transfers, and account updates
 */

import Stripe from 'stripe';
import { Request, Response } from 'express';
import { getDb } from './db';
import { orders, payouts, hostProfiles, wallets } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

interface WebhookHandler {
  (event: Stripe.Event): Promise<void>;
}

class StripeWebhookService {
  private handlers: Map<string, WebhookHandler> = new Map();

  constructor() {
    this.registerHandlers();
    console.log('[Stripe Webhooks] Service initialized');
  }

  /**
   * Register all webhook event handlers
   */
  private registerHandlers() {
    // Payment intent events
    this.handlers.set('payment_intent.succeeded', this.handlePaymentSucceeded.bind(this));
    this.handlers.set('payment_intent.payment_failed', this.handlePaymentFailed.bind(this));
    this.handlers.set('payment_intent.canceled', this.handlePaymentCanceled.bind(this));

    // Charge events
    this.handlers.set('charge.succeeded', this.handleChargeSucceeded.bind(this));
    this.handlers.set('charge.failed', this.handleChargeFailed.bind(this));
    this.handlers.set('charge.refunded', this.handleChargeRefunded.bind(this));

    // Transfer events
    this.handlers.set('transfer.created', this.handleTransferCreated.bind(this));
    this.handlers.set('transfer.paid', this.handleTransferPaid.bind(this));
    this.handlers.set('transfer.failed', this.handleTransferFailed.bind(this));
    this.handlers.set('transfer.reversed', this.handleTransferReversed.bind(this));

    // Account events
    this.handlers.set('account.updated', this.handleAccountUpdated.bind(this));
    this.handlers.set('account.application.deauthorized', this.handleAccountDeauthorized.bind(this));

    // Payout events
    this.handlers.set('payout.created', this.handlePayoutCreated.bind(this));
    this.handlers.set('payout.paid', this.handlePayoutPaid.bind(this));
    this.handlers.set('payout.failed', this.handlePayoutFailed.bind(this));
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      console.error('[Stripe Webhooks] Missing signature');
      return res.status(400).send('Missing signature');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      console.error('[Stripe Webhooks] Signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[Stripe Webhooks] Received event: ${event.type}`);

    // Get handler for this event type
    const handler = this.handlers.get(event.type);

    if (handler) {
      try {
        await handler(event);
        console.log(`[Stripe Webhooks] Successfully processed ${event.type}`);
      } catch (error) {
        console.error(`[Stripe Webhooks] Error processing ${event.type}:`, error);
        return res.status(500).send('Webhook processing failed');
      }
    } else {
      console.log(`[Stripe Webhooks] No handler for event type: ${event.type}`);
    }

    res.json({ received: true });
  }

  /**
   * Handle successful payment intent
   */
  private async handlePaymentSucceeded(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const db = await getDb();
    if (!db) return;

    // Update order status
    await db
      .update(orders)
      .set({
        paymentStatus: 'paid',
        paidAt: new Date(),
      })
      .where(eq(orders.stripePaymentIntentId, paymentIntent.id));

    console.log(`[Stripe Webhooks] Payment succeeded: ${paymentIntent.id}`);
  }

  /**
   * Handle failed payment intent
   */
  private async handlePaymentFailed(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const db = await getDb();
    if (!db) return;

    // Update order status
    await db
      .update(orders)
      .set({
        paymentStatus: 'failed',
      })
      .where(eq(orders.stripePaymentIntentId, paymentIntent.id));

    console.log(`[Stripe Webhooks] Payment failed: ${paymentIntent.id}`);
  }

  /**
   * Handle canceled payment intent
   */
  private async handlePaymentCanceled(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const db = await getDb();
    if (!db) return;

    // Update order status
    await db
      .update(orders)
      .set({
        status: 'cancelled',
      })
      .where(eq(orders.stripePaymentIntentId, paymentIntent.id));

    console.log(`[Stripe Webhooks] Payment canceled: ${paymentIntent.id}`);
  }

  /**
   * Handle successful charge
   */
  private async handleChargeSucceeded(event: Stripe.Event) {
    const charge = event.data.object as Stripe.Charge;
    const amount = charge.amount / 100; // Convert from cents
    const platformFee = amount * 0.1; // 10% platform fee
    const hostEarnings = amount - platformFee;

    // Get order to find host
    const db = await getDb();
    if (!db) return;
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.stripePaymentIntentId, charge.payment_intent as string))
      .limit(1);

    if (order && order.hostId) {
      // Get host's userId from hostProfile
      const [hostProfile] = await db
        .select()
        .from(hostProfiles)
        .where(eq(hostProfiles.id, order.hostId))
        .limit(1);

      if (hostProfile) {
        // Credit host wallet
        await db
          .update(wallets)
          .set({
            balance: sql`${wallets.balance} + ${hostEarnings}`,
          })
          .where(eq(wallets.userId, hostProfile.userId));

        console.log(`[Stripe Webhooks] Credited ${hostEarnings} to host ${order.hostId}`);
      }
    }
  }

  /**
   * Handle failed charge
   */
  private async handleChargeFailed(event: Stripe.Event) {
    const charge = event.data.object as Stripe.Charge;
    console.log(`[Stripe Webhooks] Charge failed: ${charge.id}`);
  }

  /**
   * Handle refunded charge
   */
  private async handleChargeRefunded(event: Stripe.Event) {
    const charge = event.data.object as Stripe.Charge;
    const db = await getDb();
    if (!db) return;

    // Update order status
    await db
      .update(orders)
      .set({
        paymentStatus: 'refunded',
      })
      .where(eq(orders.stripePaymentIntentId, charge.payment_intent as string));

    // Deduct from host wallet
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.stripePaymentIntentId, charge.payment_intent as string))
      .limit(1);

    if (order && order.hostId) {
      const refundAmount = charge.amount_refunded / 100;
      const platformFee = refundAmount * 0.1;
      const hostDeduction = refundAmount - platformFee;

      // Get host's userId from hostProfile
      const [hostProfile] = await db
        .select()
        .from(hostProfiles)
        .where(eq(hostProfiles.id, order.hostId))
        .limit(1);

      if (hostProfile) {
        await db
          .update(wallets)
          .set({
            balance: sql`${wallets.balance} - ${hostDeduction}`,
          })
          .where(eq(wallets.userId, hostProfile.userId));

        console.log(`[Stripe Webhooks] Deducted ${hostDeduction} from host ${order.hostId}`);
      }
    }

    console.log(`[Stripe Webhooks] Charge refunded: ${charge.id}`);
  }

  /**
   * Handle transfer created
   */
  private async handleTransferCreated(event: Stripe.Event) {
    const transfer = event.data.object as Stripe.Transfer;
    console.log(`[Stripe Webhooks] Transfer created: ${transfer.id}`);
  }

  /**
   * Handle transfer paid
   */
  private async handleTransferPaid(event: Stripe.Event) {
    const transfer = event.data.object as Stripe.Transfer;
    const db = await getDb();
    if (!db) return;

    // Update payout status
    await db
      .update(payouts)
      .set({
        status: 'paid',
      })
      .where(eq(payouts.stripeTransferId, transfer.id));

    console.log(`[Stripe Webhooks] Transfer paid: ${transfer.id}`);
  }

  /**
   * Handle transfer failed
   */
  private async handleTransferFailed(event: Stripe.Event) {
    const transfer = event.data.object as Stripe.Transfer;
    const db = await getDb();
    if (!db) return;

    // Update payout status
    await db
      .update(payouts)
      .set({
        status: 'failed',
      })
      .where(eq(payouts.stripeTransferId, transfer.id));

    // Refund to host wallet
    const [payout] = await db
      .select()
      .from(payouts)
      .where(eq(payouts.stripeTransferId, transfer.id))
      .limit(1);

    if (payout && payout.hostId) {
      // Get host's userId from hostProfile
      const [hostProfile] = await db
        .select()
        .from(hostProfiles)
        .where(eq(hostProfiles.id, payout.hostId))
        .limit(1);

      if (hostProfile) {
        await db
          .update(wallets)
          .set({
            balance: sql`${wallets.balance} + ${payout.amount}`,
          })
          .where(eq(wallets.userId, hostProfile.userId));

        console.log(`[Stripe Webhooks] Refunded ${payout.amount} to host ${payout.hostId}`);
      }
    }

    console.log(`[Stripe Webhooks] Transfer failed: ${transfer.id}`);
  }

  /**
   * Handle transfer reversed
   */
  private async handleTransferReversed(event: Stripe.Event) {
    const transfer = event.data.object as Stripe.Transfer;
    const db = await getDb();
    if (!db) return;

    // Update payout status
    await db
      .update(payouts)
      .set({
        status: 'failed',
      })
      .where(eq(payouts.stripeTransferId, transfer.id));

    console.log(`[Stripe Webhooks] Transfer reversed: ${transfer.id}`);
  }

  /**
   * Handle account updated
   */
  private async handleAccountUpdated(event: Stripe.Event) {
    const account = event.data.object as Stripe.Account;
    const db = await getDb();
    if (!db) return;

    // Update host profile with account status
    const onboardingComplete = account.details_submitted === true &&
      account.charges_enabled === true &&
      account.payouts_enabled === true;

    await db
      .update(hostProfiles)
      .set({
        stripeOnboardingComplete: onboardingComplete,
      })
      .where(eq(hostProfiles.stripeAccountId, account.id));

    console.log(`[Stripe Webhooks] Account updated: ${account.id}`);
  }

  /**
   * Handle account deauthorized
   */
  private async handleAccountDeauthorized(event: Stripe.Event) {
    const account = event.data.object as any;
    const db = await getDb();
    if (!db) return;

    // Remove Stripe account from host profile
    await db
      .update(hostProfiles)
      .set({
        stripeAccountId: null,
        stripeOnboardingComplete: false,
      })
      .where(eq(hostProfiles.stripeAccountId, account.id));

    console.log(`[Stripe Webhooks] Account deauthorized: ${account.id}`);
  }

  /**
   * Handle payout created
   */
  private async handlePayoutCreated(event: Stripe.Event) {
    const payout = event.data.object as Stripe.Payout;
    console.log(`[Stripe Webhooks] Payout created: ${payout.id}`);
  }

  /**
   * Handle payout paid
   */
  private async handlePayoutPaid(event: Stripe.Event) {
    const payout = event.data.object as Stripe.Payout;
    console.log(`[Stripe Webhooks] Payout paid: ${payout.id}`);
  }

  /**
   * Handle payout failed
   */
  private async handlePayoutFailed(event: Stripe.Event) {
    const payout = event.data.object as Stripe.Payout;
    console.log(`[Stripe Webhooks] Payout failed: ${payout.id}`);
  }
}

// Singleton instance
let webhookService: StripeWebhookService | null = null;

export function initializeStripeWebhooks() {
  if (!webhookService) {
    webhookService = new StripeWebhookService();
  }
  return webhookService;
}

export function getStripeWebhooks() {
  if (!webhookService) {
    throw new Error('Stripe webhook service not initialized. Call initializeStripeWebhooks() first.');
  }
  return webhookService;
}

export { StripeWebhookService };
