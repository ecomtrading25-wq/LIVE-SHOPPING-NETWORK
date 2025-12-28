/**
 * Payment Processing Service
 * Handles Stripe checkout, PayPal Express, saved payment methods, subscriptions, and multi-currency
 */

import { getDbSync } from './db';
const db = getDbSync();
import {
  orders,
  orderItems,
  paymentMethods as savedPaymentMethods,
  subscriptions,
  invoices,
  paymentRetries,
  transactions
} from '../drizzle/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { createCheckoutSession } from './stripe';

export type PaymentProvider = 'STRIPE' | 'PAYPAL' | 'APPLE_PAY' | 'GOOGLE_PAY';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'DISPUTED';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'PAUSED' | 'TRIALING';
export type PaymentMethodType = 'CARD' | 'BANK_ACCOUNT' | 'PAYPAL' | 'APPLE_PAY' | 'GOOGLE_PAY';

export interface CheckoutSession {
  sessionId: string;
  orderId: string;
  provider: PaymentProvider;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  checkoutUrl: string;
  expiresAt: Date;
}

export interface PaymentMethod {
  paymentMethodId: string;
  userId: string;
  provider: PaymentProvider;
  type: PaymentMethodType;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  providerPaymentMethodId: string;
}

export interface Subscription {
  subscriptionId: string;
  userId: string;
  productId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  priceCents: number;
  currency: string;
  interval: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  providerSubscriptionId: string;
}

export interface Invoice {
  invoiceId: string;
  orderId: string;
  userId: string;
  amountCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE';
  dueDate: Date;
  paidAt?: Date;
  invoiceUrl?: string;
}

/**
 * Create Stripe checkout session
 */
export async function createStripeCheckout(
  channelId: string,
  orderId: string,
  userId: string,
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    priceCents: number;
  }>,
  options?: {
    successUrl?: string;
    cancelUrl?: string;
    currency?: string;
    promotionCode?: string;
    savePaymentMethod?: boolean;
    customerId?: string;
  }
): Promise<CheckoutSession> {
  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.orderId, orderId),
      eq(orders.channelId, channelId)
    )
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Calculate total
  const subtotalCents = items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
  const taxCents = Math.floor(subtotalCents * 0.1); // 10% tax (simplified)
  const totalCents = subtotalCents + taxCents;

  // Create Stripe session using existing helper
  const session = await createCheckoutSession({
    orderId,
    items: items.map(item => ({
      name: item.name,
      amount: item.priceCents,
      quantity: item.quantity
    })),
    successUrl: options?.successUrl || `${process.env.VITE_APP_URL}/checkout/success?order_id=${orderId}`,
    cancelUrl: options?.cancelUrl || `${process.env.VITE_APP_URL}/checkout/cancel`
  });

  // Record checkout session
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  return {
    sessionId: session.id,
    orderId,
    provider: 'STRIPE',
    amountCents: totalCents,
    currency: options?.currency || 'AUD',
    status: 'PENDING',
    checkoutUrl: session.url || '',
    expiresAt
  };
}

/**
 * Create PayPal Express Checkout
 */
export async function createPayPalCheckout(
  channelId: string,
  orderId: string,
  items: Array<{
    name: string;
    quantity: number;
    priceCents: number;
  }>,
  options?: {
    successUrl?: string;
    cancelUrl?: string;
    currency?: string;
  }
): Promise<CheckoutSession> {
  // In production, use PayPal SDK
  // const paypal = require('@paypal/checkout-server-sdk');
  
  const totalCents = items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
  
  // Simulate PayPal order creation
  const paypalOrderId = `PAYPAL_${Date.now()}`;
  const checkoutUrl = `https://www.paypal.com/checkoutnow?token=${paypalOrderId}`;

  return {
    sessionId: paypalOrderId,
    orderId,
    provider: 'PAYPAL',
    amountCents: totalCents,
    currency: options?.currency || 'AUD',
    status: 'PENDING',
    checkoutUrl,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000)
  };
}

/**
 * Process one-click checkout with saved payment method
 */
export async function processOneClickCheckout(
  channelId: string,
  orderId: string,
  userId: string,
  paymentMethodId: string
): Promise<{
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}> {
  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.orderId, orderId),
      eq(orders.channelId, channelId)
    )
  });

  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  const paymentMethod = await db.query.savedPaymentMethods.findFirst({
    where: and(
      eq(savedPaymentMethods.paymentMethodId, paymentMethodId),
      eq(savedPaymentMethods.userId, userId)
    )
  });

  if (!paymentMethod) {
    return { success: false, error: 'Payment method not found' };
  }

  try {
    // In production, use Stripe API to create payment intent
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: order.totalCents,
    //   currency: order.currency,
    //   customer: paymentMethod.providerCustomerId,
    //   payment_method: paymentMethod.providerPaymentMethodId,
    //   confirm: true,
    //   off_session: true
    // });

    // Simulate successful payment
    const paymentIntentId = `pi_${Date.now()}`;

    // Update order status
    await db.update(orders)
      .set({
        status: 'PAID',
        paidAt: new Date(),
        paymentProvider: paymentMethod.provider,
        paymentMethodId: paymentMethod.paymentMethodId,
        updatedAt: new Date()
      })
      .where(eq(orders.orderId, orderId));

    // Create transaction record
    await db.insert(transactions).values({
      channelId,
      orderId,
      userId,
      type: 'PAYMENT',
      amountCents: order.totalCents,
      currency: order.currency,
      provider: paymentMethod.provider,
      providerTransactionId: paymentIntentId,
      status: 'SUCCEEDED'
    });

    return { success: true, paymentIntentId };
  } catch (error) {
    console.error('One-click checkout failed:', error);
    
    // Schedule retry
    await schedulePaymentRetry(orderId, paymentMethodId, 1);

    return { success: false, error: String(error) };
  }
}

/**
 * Save payment method for future use
 */
export async function savePaymentMethod(
  userId: string,
  provider: PaymentProvider,
  providerPaymentMethodId: string,
  details: {
    type: PaymentMethodType;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  },
  setAsDefault: boolean = false
): Promise<PaymentMethod> {
  // If setting as default, unset other defaults
  if (setAsDefault) {
    await db.update(savedPaymentMethods)
      .set({ isDefault: false })
      .where(eq(savedPaymentMethods.userId, userId));
  }

  const [paymentMethod] = await db.insert(savedPaymentMethods).values({
    userId,
    provider,
    type: details.type,
    last4: details.last4 || null,
    brand: details.brand || null,
    expiryMonth: details.expiryMonth || null,
    expiryYear: details.expiryYear || null,
    isDefault: setAsDefault,
    providerPaymentMethodId
  }).returning();

  return paymentMethod as PaymentMethod;
}

/**
 * Get user's saved payment methods
 */
export async function getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  const methods = await db.query.savedPaymentMethods.findMany({
    where: eq(savedPaymentMethods.userId, userId),
    orderBy: desc(savedPaymentMethods.isDefault)
  });

  return methods as PaymentMethod[];
}

/**
 * Delete payment method
 */
export async function deletePaymentMethod(
  userId: string,
  paymentMethodId: string
): Promise<void> {
  const method = await db.query.savedPaymentMethods.findFirst({
    where: and(
      eq(savedPaymentMethods.paymentMethodId, paymentMethodId),
      eq(savedPaymentMethods.userId, userId)
    )
  });

  if (!method) {
    throw new Error('Payment method not found');
  }

  // In production, also delete from Stripe
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // await stripe.paymentMethods.detach(method.providerPaymentMethodId);

  await db.delete(savedPaymentMethods)
    .where(eq(savedPaymentMethods.paymentMethodId, paymentMethodId));
}

/**
 * Create subscription
 */
export async function createSubscription(
  userId: string,
  productId: string,
  priceCents: number,
  interval: Subscription['interval'],
  paymentMethodId: string,
  options?: {
    trialDays?: number;
    currency?: string;
  }
): Promise<Subscription> {
  const paymentMethod = await db.query.savedPaymentMethods.findFirst({
    where: and(
      eq(savedPaymentMethods.paymentMethodId, paymentMethodId),
      eq(savedPaymentMethods.userId, userId)
    )
  });

  if (!paymentMethod) {
    throw new Error('Payment method not found');
  }

  // In production, create Stripe subscription
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const subscription = await stripe.subscriptions.create({
  //   customer: paymentMethod.providerCustomerId,
  //   items: [{ price: stripePriceId }],
  //   default_payment_method: paymentMethod.providerPaymentMethodId,
  //   trial_period_days: options?.trialDays
  // });

  const providerSubscriptionId = `sub_${Date.now()}`;
  const now = new Date();
  const periodEnd = new Date(now);
  
  // Calculate period end based on interval
  switch (interval) {
    case 'DAILY':
      periodEnd.setDate(periodEnd.getDate() + 1);
      break;
    case 'WEEKLY':
      periodEnd.setDate(periodEnd.getDate() + 7);
      break;
    case 'MONTHLY':
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      break;
    case 'YEARLY':
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      break;
  }

  const [sub] = await db.insert(subscriptions).values({
    userId,
    productId,
    status: options?.trialDays ? 'TRIALING' : 'ACTIVE',
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    priceCents,
    currency: options?.currency || 'AUD',
    interval,
    providerSubscriptionId
  }).returning();

  return sub as Subscription;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  userId: string,
  subscriptionId: string,
  immediately: boolean = false
): Promise<void> {
  const subscription = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.subscriptionId, subscriptionId),
      eq(subscriptions.userId, userId)
    )
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // In production, cancel in Stripe
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // await stripe.subscriptions.update(subscription.providerSubscriptionId, {
  //   cancel_at_period_end: !immediately
  // });

  if (immediately) {
    await db.update(subscriptions)
      .set({
        status: 'CANCELED',
        canceledAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(subscriptions.subscriptionId, subscriptionId));
  } else {
    await db.update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.subscriptionId, subscriptionId));
  }
}

/**
 * Pause subscription
 */
export async function pauseSubscription(
  userId: string,
  subscriptionId: string,
  resumeAt?: Date
): Promise<void> {
  const subscription = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.subscriptionId, subscriptionId),
      eq(subscriptions.userId, userId)
    )
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  await db.update(subscriptions)
    .set({
      status: 'PAUSED',
      pausedAt: new Date(),
      resumeAt: resumeAt || null,
      updatedAt: new Date()
    })
    .where(eq(subscriptions.subscriptionId, subscriptionId));
}

/**
 * Process installment payment
 */
export async function createInstallmentPlan(
  orderId: string,
  totalCents: number,
  numberOfInstallments: number,
  paymentMethodId: string
): Promise<{
  planId: string;
  installments: Array<{
    installmentNumber: number;
    amountCents: number;
    dueDate: Date;
  }>;
}> {
  if (numberOfInstallments < 2 || numberOfInstallments > 12) {
    throw new Error('Number of installments must be between 2 and 12');
  }

  const installmentAmount = Math.ceil(totalCents / numberOfInstallments);
  const planId = `installment_${Date.now()}`;

  const installments = [];
  for (let i = 0; i < numberOfInstallments; i++) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i);

    installments.push({
      installmentNumber: i + 1,
      amountCents: i === numberOfInstallments - 1 
        ? totalCents - (installmentAmount * (numberOfInstallments - 1)) // Last installment gets remainder
        : installmentAmount,
      dueDate
    });
  }

  // TODO: Store installment plan in database
  // TODO: Schedule automatic charges

  return { planId, installments };
}

/**
 * Calculate tax using Stripe Tax
 */
export async function calculateTax(
  amountCents: number,
  currency: string,
  shippingAddress: {
    country: string;
    state?: string;
    postalCode?: string;
  }
): Promise<{
  taxCents: number;
  taxRate: number;
  taxBreakdown: Array<{
    name: string;
    amountCents: number;
    rate: number;
  }>;
}> {
  // In production, use Stripe Tax API
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const calculation = await stripe.tax.calculations.create({
  //   currency,
  //   line_items: [{ amount: amountCents, reference: 'order' }],
  //   customer_details: {
  //     address: shippingAddress,
  //     address_source: 'shipping'
  //   }
  // });

  // Simplified tax calculation
  let taxRate = 0.10; // 10% default
  
  if (shippingAddress.country === 'AU') {
    taxRate = 0.10; // GST
  } else if (shippingAddress.country === 'US') {
    taxRate = 0.07; // Average state tax
  } else if (shippingAddress.country === 'GB') {
    taxRate = 0.20; // VAT
  }

  const taxCents = Math.round(amountCents * taxRate);

  return {
    taxCents,
    taxRate,
    taxBreakdown: [{
      name: 'Sales Tax',
      amountCents: taxCents,
      rate: taxRate
    }]
  };
}

/**
 * Generate invoice
 */
export async function generateInvoice(
  orderId: string,
  userId: string
): Promise<Invoice> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.orderId, orderId),
    with: {
      items: {
        with: {
          product: true
        }
      }
    }
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const subtotalCents = order.totalCents;
  const taxCents = Math.floor(subtotalCents * 0.1);
  const totalCents = subtotalCents + taxCents;

  const [invoice] = await db.insert(invoices).values({
    orderId,
    userId,
    amountCents: subtotalCents,
    taxCents,
    totalCents,
    currency: order.currency,
    status: order.status === 'PAID' ? 'PAID' : 'OPEN',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    paidAt: order.paidAt || null
  }).returning();

  // In production, generate PDF invoice
  // const invoiceUrl = await generateInvoicePDF(invoice);

  return invoice as Invoice;
}

/**
 * Schedule payment retry
 */
async function schedulePaymentRetry(
  orderId: string,
  paymentMethodId: string,
  attemptNumber: number
): Promise<void> {
  const maxAttempts = 3;
  
  if (attemptNumber > maxAttempts) {
    // Mark order as failed
    await db.update(orders)
      .set({
        status: 'PAYMENT_FAILED',
        updatedAt: new Date()
      })
      .where(eq(orders.orderId, orderId));
    return;
  }

  // Exponential backoff: 1 hour, 4 hours, 24 hours
  const retryDelays = [3600, 14400, 86400];
  const retryAt = new Date(Date.now() + retryDelays[attemptNumber - 1] * 1000);

  await db.insert(paymentRetries).values({
    orderId,
    paymentMethodId,
    attemptNumber,
    scheduledAt: retryAt,
    status: 'PENDING'
  });
}

/**
 * Process payment retry
 */
export async function processPaymentRetry(retryId: string): Promise<boolean> {
  const retry = await db.query.paymentRetries.findFirst({
    where: eq(paymentRetries.retryId, retryId)
  });

  if (!retry || retry.status !== 'PENDING') {
    return false;
  }

  // Mark as processing
  await db.update(paymentRetries)
    .set({ status: 'PROCESSING' })
    .where(eq(paymentRetries.retryId, retryId));

  // Attempt payment
  const result = await processOneClickCheckout(
    retry.channelId,
    retry.orderId,
    retry.userId,
    retry.paymentMethodId
  );

  if (result.success) {
    await db.update(paymentRetries)
      .set({
        status: 'SUCCEEDED',
        completedAt: new Date()
      })
      .where(eq(paymentRetries.retryId, retryId));
    return true;
  } else {
    await db.update(paymentRetries)
      .set({
        status: 'FAILED',
        error: result.error || null,
        completedAt: new Date()
      })
      .where(eq(paymentRetries.retryId, retryId));

    // Schedule next retry
    await schedulePaymentRetry(retry.orderId, retry.paymentMethodId, retry.attemptNumber + 1);
    return false;
  }
}

/**
 * Handle multi-currency conversion
 */
export async function convertCurrency(
  amountCents: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amountCents;
  }

  // In production, use real-time exchange rates API
  // const rates = await fetch('https://api.exchangerate-api.com/v4/latest/' + fromCurrency);
  // const data = await rates.json();
  // const rate = data.rates[toCurrency];

  // Simplified conversion rates
  const rates: Record<string, Record<string, number>> = {
    'AUD': { 'USD': 0.65, 'EUR': 0.60, 'GBP': 0.52 },
    'USD': { 'AUD': 1.54, 'EUR': 0.92, 'GBP': 0.80 },
    'EUR': { 'AUD': 1.67, 'USD': 1.09, 'GBP': 0.87 },
    'GBP': { 'AUD': 1.92, 'USD': 1.25, 'EUR': 1.15 }
  };

  const rate = rates[fromCurrency]?.[toCurrency] || 1;
  return Math.round(amountCents * rate);
}

/**
 * Validate payment method before charging
 */
export async function validatePaymentMethod(
  paymentMethodId: string
): Promise<{
  valid: boolean;
  reason?: string;
}> {
  const method = await db.query.savedPaymentMethods.findFirst({
    where: eq(savedPaymentMethods.paymentMethodId, paymentMethodId)
  });

  if (!method) {
    return { valid: false, reason: 'Payment method not found' };
  }

  // Check if card is expired
  if (method.type === 'CARD' && method.expiryYear && method.expiryMonth) {
    const now = new Date();
    const expiry = new Date(method.expiryYear, method.expiryMonth - 1);
    
    if (expiry < now) {
      return { valid: false, reason: 'Card has expired' };
    }
  }

  // In production, verify with Stripe
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const pm = await stripe.paymentMethods.retrieve(method.providerPaymentMethodId);
  // if (pm.card?.checks?.cvc_check === 'fail') {
  //   return { valid: false, reason: 'CVC check failed' };
  // }

  return { valid: true };
}
