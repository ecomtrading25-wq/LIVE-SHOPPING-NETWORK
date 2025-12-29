/**
 * Stripe Subscription Webhook Handler
 * Processes subscription-related webhook events from Stripe
 */

import Stripe from "stripe";
import { Request, Response } from "express";
import { getDb } from "./db";
import {
  stripeSubscriptions,
  stripeSubscriptionPlans,
  stripeBillingHistory,
  stripePaymentMethods,
  stripeWebhookEvents,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

interface WebhookHandler {
  (event: Stripe.Event): Promise<void>;
}

class SubscriptionWebhookService {
  private handlers: Map<string, WebhookHandler> = new Map();

  constructor() {
    this.registerHandlers();
    console.log("[Subscription Webhooks] Service initialized");
  }

  /**
   * Register all webhook event handlers
   */
  private registerHandlers() {
    // Checkout events
    this.handlers.set(
      "checkout.session.completed",
      this.handleCheckoutCompleted.bind(this)
    );

    // Subscription events
    this.handlers.set(
      "customer.subscription.created",
      this.handleSubscriptionCreated.bind(this)
    );
    this.handlers.set(
      "customer.subscription.updated",
      this.handleSubscriptionUpdated.bind(this)
    );
    this.handlers.set(
      "customer.subscription.deleted",
      this.handleSubscriptionDeleted.bind(this)
    );
    this.handlers.set(
      "customer.subscription.trial_will_end",
      this.handleTrialWillEnd.bind(this)
    );

    // Invoice events
    this.handlers.set(
      "invoice.created",
      this.handleInvoiceCreated.bind(this)
    );
    this.handlers.set("invoice.paid", this.handleInvoicePaid.bind(this));
    this.handlers.set(
      "invoice.payment_failed",
      this.handleInvoicePaymentFailed.bind(this)
    );
    this.handlers.set(
      "invoice.finalized",
      this.handleInvoiceFinalized.bind(this)
    );

    // Payment method events
    this.handlers.set(
      "payment_method.attached",
      this.handlePaymentMethodAttached.bind(this)
    );
    this.handlers.set(
      "payment_method.detached",
      this.handlePaymentMethodDetached.bind(this)
    );
  }

  /**
   * Process incoming webhook from Stripe
   */
  async processWebhook(req: Request, res: Response) {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      console.error("[Subscription Webhooks] Missing signature");
      return res.status(400).send("Missing signature");
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      console.error(
        "[Subscription Webhooks] Signature verification failed:",
        err.message
      );
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(
      `[Subscription Webhooks] Received event: ${event.type} (${event.id})`
    );

    // Record webhook event
    await this.recordWebhookEvent(event);

    // Get handler for this event type
    const handler = this.handlers.get(event.type);
    if (handler) {
      try {
        await handler(event);
        console.log(
          `[Subscription Webhooks] Successfully processed ${event.type}`
        );
        await this.markWebhookProcessed(event.id);
      } catch (error) {
        console.error(
          `[Subscription Webhooks] Error processing ${event.type}:`,
          error
        );
        await this.markWebhookError(event.id, error as Error);
        return res.status(500).send("Webhook processing failed");
      }
    } else {
      console.log(
        `[Subscription Webhooks] No handler for event type: ${event.type}`
      );
    }

    return res.json({ received: true });
  }

  /**
   * Record webhook event in database
   */
  private async recordWebhookEvent(event: Stripe.Event) {
    const db = await getDb();
    if (!db) return;

    await db.insert(stripeWebhookEvents).values({
      id: nanoid(),
      stripeEventId: event.id,
      eventType: event.type,
      processed: false,
      eventData: event.data.object as any,
      createdAt: new Date(),
    });
  }

  /**
   * Mark webhook as successfully processed
   */
  private async markWebhookProcessed(eventId: string) {
    const db = await getDb();
    if (!db) return;

    await db
      .update(stripeWebhookEvents)
      .set({
        processed: true,
        processedAt: new Date(),
      })
      .where(eq(stripeWebhookEvents.stripeEventId, eventId));
  }

  /**
   * Mark webhook as failed with error
   */
  private async markWebhookError(eventId: string, error: Error) {
    const db = await getDb();
    if (!db) return;

    await db
      .update(stripeWebhookEvents)
      .set({
        processed: false,
        error: error.message,
      })
      .where(eq(stripeWebhookEvents.stripeEventId, eventId));
  }

  /**
   * Handle checkout session completed
   */
  private async handleCheckoutCompleted(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log(
      `[Subscription Webhooks] Checkout completed: ${session.id}`
    );

    // Subscription will be handled by customer.subscription.created event
    // This is just for logging
  }

  /**
   * Handle subscription created
   */
  private async handleSubscriptionCreated(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    const db = await getDb();
    if (!db) return;

    console.log(
      `[Subscription Webhooks] Subscription created: ${subscription.id}`
    );

    // Get user ID from metadata
    const userId = subscription.metadata?.userId
      ? parseInt(subscription.metadata.userId)
      : null;

    if (!userId) {
      console.error(
        "[Subscription Webhooks] No user ID in subscription metadata"
      );
      return;
    }

    // Get plan ID from metadata
    const planId = subscription.metadata?.planId;

    if (!planId) {
      console.error(
        "[Subscription Webhooks] No plan ID in subscription metadata"
      );
      return;
    }

    // Create subscription record
    await db.insert(stripeSubscriptions).values({
      id: nanoid(),
      userId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      planId,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
      trialStart: subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : null,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      metadata: subscription.metadata as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(
      `[Subscription Webhooks] Created subscription record for user ${userId}`
    );
  }

  /**
   * Handle subscription updated
   */
  private async handleSubscriptionUpdated(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    const db = await getDb();
    if (!db) return;

    console.log(
      `[Subscription Webhooks] Subscription updated: ${subscription.id}`
    );

    // Update subscription record
    await db
      .update(stripeSubscriptions)
      .set({
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : null,
        trialStart: subscription.trial_start
          ? new Date(subscription.trial_start * 1000)
          : null,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
        updatedAt: new Date(),
      })
      .where(
        eq(stripeSubscriptions.stripeSubscriptionId, subscription.id)
      );

    console.log(
      `[Subscription Webhooks] Updated subscription: ${subscription.id}`
    );
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    const db = await getDb();
    if (!db) return;

    console.log(
      `[Subscription Webhooks] Subscription deleted: ${subscription.id}`
    );

    // Update subscription status to canceled
    await db
      .update(stripeSubscriptions)
      .set({
        status: "canceled",
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        eq(stripeSubscriptions.stripeSubscriptionId, subscription.id)
      );

    console.log(
      `[Subscription Webhooks] Marked subscription as canceled: ${subscription.id}`
    );
  }

  /**
   * Handle trial will end
   */
  private async handleTrialWillEnd(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    console.log(
      `[Subscription Webhooks] Trial will end for subscription: ${subscription.id}`
    );

    // TODO: Send notification to user about trial ending
    // Can use the notifyOwner function or implement user notifications
  }

  /**
   * Handle invoice created
   */
  private async handleInvoiceCreated(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;
    console.log(`[Subscription Webhooks] Invoice created: ${invoice.id}`);

    // Invoice will be recorded when finalized
  }

  /**
   * Handle invoice finalized
   */
  private async handleInvoiceFinalized(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;
    const db = await getDb();
    if (!db) return;

    console.log(`[Subscription Webhooks] Invoice finalized: ${invoice.id}`);

    // Get subscription
    const [subscription] = await db
      .select()
      .from(stripeSubscriptions)
      .where(
        eq(
          stripeSubscriptions.stripeSubscriptionId,
          invoice.subscription as string
        )
      )
      .limit(1);

    if (!subscription) {
      console.error(
        "[Subscription Webhooks] Subscription not found for invoice"
      );
      return;
    }

    // Create billing history record
    await db.insert(stripeBillingHistory).values({
      id: nanoid(),
      userId: subscription.userId,
      subscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: invoice.payment_intent as string | null,
      amount: (invoice.amount_due / 100).toFixed(2),
      currency: invoice.currency.toUpperCase(),
      status: invoice.status as any,
      invoiceDate: new Date(invoice.created * 1000),
      dueDate: invoice.due_date
        ? new Date(invoice.due_date * 1000)
        : null,
      paidAt: null,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      metadata: invoice.metadata as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(
      `[Subscription Webhooks] Created billing history for invoice: ${invoice.id}`
    );
  }

  /**
   * Handle invoice paid
   */
  private async handleInvoicePaid(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;
    const db = await getDb();
    if (!db) return;

    console.log(`[Subscription Webhooks] Invoice paid: ${invoice.id}`);

    // Update billing history
    await db
      .update(stripeBillingHistory)
      .set({
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(stripeBillingHistory.stripeInvoiceId, invoice.id));

    console.log(
      `[Subscription Webhooks] Updated billing history for paid invoice: ${invoice.id}`
    );
  }

  /**
   * Handle invoice payment failed
   */
  private async handleInvoicePaymentFailed(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;
    const db = await getDb();
    if (!db) return;

    console.log(
      `[Subscription Webhooks] Invoice payment failed: ${invoice.id}`
    );

    // Update billing history
    await db
      .update(stripeBillingHistory)
      .set({
        status: "open",
        updatedAt: new Date(),
      })
      .where(eq(stripeBillingHistory.stripeInvoiceId, invoice.id));

    // TODO: Send notification to user about failed payment
    // Can use the notifyOwner function or implement user notifications

    console.log(
      `[Subscription Webhooks] Updated billing history for failed invoice: ${invoice.id}`
    );
  }

  /**
   * Handle payment method attached
   */
  private async handlePaymentMethodAttached(event: Stripe.Event) {
    const paymentMethod = event.data.object as Stripe.PaymentMethod;
    const db = await getDb();
    if (!db) return;

    console.log(
      `[Subscription Webhooks] Payment method attached: ${paymentMethod.id}`
    );

    if (!paymentMethod.customer) return;

    // Get user from customer ID
    const [subscription] = await db
      .select()
      .from(stripeSubscriptions)
      .where(
        eq(
          stripeSubscriptions.stripeCustomerId,
          paymentMethod.customer as string
        )
      )
      .limit(1);

    if (!subscription) return;

    // Create payment method record
    await db.insert(stripePaymentMethods).values({
      id: nanoid(),
      userId: subscription.userId,
      stripeCustomerId: paymentMethod.customer as string,
      stripePaymentMethodId: paymentMethod.id,
      type: paymentMethod.type,
      brand: paymentMethod.card?.brand || null,
      last4: paymentMethod.card?.last4 || null,
      expMonth: paymentMethod.card?.exp_month || null,
      expYear: paymentMethod.card?.exp_year || null,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(
      `[Subscription Webhooks] Created payment method record: ${paymentMethod.id}`
    );
  }

  /**
   * Handle payment method detached
   */
  private async handlePaymentMethodDetached(event: Stripe.Event) {
    const paymentMethod = event.data.object as Stripe.PaymentMethod;
    const db = await getDb();
    if (!db) return;

    console.log(
      `[Subscription Webhooks] Payment method detached: ${paymentMethod.id}`
    );

    // Delete payment method record
    await db
      .delete(stripePaymentMethods)
      .where(
        eq(stripePaymentMethods.stripePaymentMethodId, paymentMethod.id)
      );

    console.log(
      `[Subscription Webhooks] Deleted payment method record: ${paymentMethod.id}`
    );
  }
}

// Singleton instance
let webhookService: SubscriptionWebhookService | null = null;

export function initializeSubscriptionWebhooks() {
  if (!webhookService) {
    webhookService = new SubscriptionWebhookService();
  }
  return webhookService;
}

export function getSubscriptionWebhooks() {
  if (!webhookService) {
    throw new Error(
      "Subscription webhook service not initialized. Call initializeSubscriptionWebhooks() first."
    );
  }
  return webhookService;
}

export { SubscriptionWebhookService };
