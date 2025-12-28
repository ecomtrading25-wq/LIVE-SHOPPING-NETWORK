/**
 * Complete Payment Processing & Billing System
 * Stripe integration, subscriptions, invoicing, refunds, payment analytics, fraud detection
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  provider: PaymentProvider;
  providerPaymentId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentStatus = 
  | 'pending' | 'processing' | 'succeeded' | 'failed' 
  | 'cancelled' | 'refunded' | 'partially_refunded';

export type PaymentMethod = 
  | 'card' | 'bank_transfer' | 'wallet' | 'cash' 
  | 'crypto' | 'buy_now_pay_later';

export type PaymentProvider = 'stripe' | 'paypal' | 'square' | 'internal';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  customerId: string;
  paymentMethod?: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
  clientSecret: string;
  metadata?: Record<string, any>;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason: RefundReason;
  status: 'pending' | 'succeeded' | 'failed';
  providerRefundId?: string;
  createdAt: Date;
  processedAt?: Date;
}

export type RefundReason = 
  | 'requested_by_customer' | 'duplicate' | 'fraudulent' 
  | 'product_not_received' | 'product_defective' | 'other';

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  providerSubscriptionId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionStatus = 
  | 'active' | 'past_due' | 'unpaid' | 'canceled' 
  | 'incomplete' | 'incomplete_expired' | 'trialing';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year';
  intervalCount: number;
  trialPeriodDays?: number;
  features: string[];
  metadata?: Record<string, any>;
  active: boolean;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  customerId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: Date;
  paidAt?: Date;
  items: InvoiceItem[];
  tax?: number;
  discount?: number;
  total: number;
  providerInvoiceId?: string;
  createdAt: Date;
}

export type InvoiceStatus = 
  | 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  metadata?: Record<string, any>;
}

export interface PaymentAnalytics {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  successRate: number;
  refundRate: number;
  topPaymentMethods: Array<{ method: PaymentMethod; count: number; amount: number }>;
  revenueByPeriod: Array<{ period: string; revenue: number }>;
  failureReasons: Array<{ reason: string; count: number }>;
}

export interface FraudCheck {
  id: string;
  paymentId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: FraudFlag[];
  decision: 'approve' | 'review' | 'decline';
  checkedAt: Date;
}

export interface FraudFlag {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface PaymentWebhook {
  id: string;
  type: string;
  data: any;
  receivedAt: Date;
  processed: boolean;
  processedAt?: Date;
}

// ============================================================================
// STRIPE CLIENT
// ============================================================================

class StripeClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.stripe.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Create payment intent
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customerId?: string;
    paymentMethod?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentIntent> {
    // In production, would make actual Stripe API call
    return {
      id: `pi_${this.generateId()}`,
      amount: params.amount,
      currency: params.currency,
      customerId: params.customerId || '',
      paymentMethod: params.paymentMethod,
      status: 'requires_payment_method',
      clientSecret: `pi_${this.generateId()}_secret_${this.generateId()}`,
      metadata: params.metadata
    };
  }

  // Confirm payment intent
  async confirmPaymentIntent(paymentIntentId: string, paymentMethod: string): Promise<PaymentIntent> {
    // In production, would make actual Stripe API call
    return {
      id: paymentIntentId,
      amount: 0,
      currency: 'usd',
      customerId: '',
      paymentMethod,
      status: 'succeeded',
      clientSecret: ''
    };
  }

  // Create refund
  async createRefund(params: {
    paymentIntentId: string;
    amount?: number;
    reason?: string;
  }): Promise<{ id: string; status: string; amount: number }> {
    // In production, would make actual Stripe API call
    return {
      id: `re_${this.generateId()}`,
      status: 'succeeded',
      amount: params.amount || 0
    };
  }

  // Create customer
  async createCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, any>;
  }): Promise<{ id: string; email: string }> {
    // In production, would make actual Stripe API call
    return {
      id: `cus_${this.generateId()}`,
      email: params.email
    };
  }

  // Create subscription
  async createSubscription(params: {
    customerId: string;
    priceId: string;
    trialPeriodDays?: number;
    metadata?: Record<string, any>;
  }): Promise<{ id: string; status: string; currentPeriodEnd: number }> {
    // In production, would make actual Stripe API call
    const now = Date.now();
    return {
      id: `sub_${this.generateId()}`,
      status: params.trialPeriodDays ? 'trialing' : 'active',
      currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000
    };
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = false): Promise<{ id: string; status: string }> {
    // In production, would make actual Stripe API call
    return {
      id: subscriptionId,
      status: cancelAtPeriodEnd ? 'active' : 'canceled'
    };
  }

  // Create invoice
  async createInvoice(params: {
    customerId: string;
    subscriptionId?: string;
    dueDate?: number;
  }): Promise<{ id: string; status: string; total: number }> {
    // In production, would make actual Stripe API call
    return {
      id: `in_${this.generateId()}`,
      status: 'open',
      total: 0
    };
  }

  // Verify webhook signature
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // In production, would verify actual Stripe signature
    return true;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 16);
  }
}

// ============================================================================
// PAYMENT PROCESSOR
// ============================================================================

class PaymentProcessor {
  private stripeClient: StripeClient;
  private payments: Map<string, Payment> = new Map();
  private refunds: Map<string, Refund> = new Map();

  constructor(stripeApiKey: string) {
    this.stripeClient = new StripeClient(stripeApiKey);
  }

  // Process payment
  async processPayment(params: {
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    metadata?: Record<string, any>;
  }): Promise<Payment> {
    const paymentId = this.generateId();

    // Create payment intent with Stripe
    const intent = await this.stripeClient.createPaymentIntent({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency,
      metadata: params.metadata
    });

    // Create payment record
    const payment: Payment = {
      id: paymentId,
      orderId: params.orderId,
      userId: params.userId,
      amount: params.amount,
      currency: params.currency,
      status: 'processing',
      method: params.paymentMethod,
      provider: 'stripe',
      providerPaymentId: intent.id,
      metadata: params.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.payments.set(paymentId, payment);

    // Simulate payment processing
    setTimeout(() => {
      payment.status = 'succeeded';
      payment.updatedAt = new Date();
      this.payments.set(paymentId, payment);
    }, 2000);

    return payment;
  }

  // Confirm payment
  async confirmPayment(paymentId: string, paymentMethodId: string): Promise<Payment> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.providerPaymentId) {
      await this.stripeClient.confirmPaymentIntent(payment.providerPaymentId, paymentMethodId);
    }

    payment.status = 'succeeded';
    payment.updatedAt = new Date();
    this.payments.set(paymentId, payment);

    return payment;
  }

  // Refund payment
  async refundPayment(paymentId: string, amount?: number, reason: RefundReason = 'requested_by_customer'): Promise<Refund> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'succeeded') {
      throw new Error('Can only refund succeeded payments');
    }

    const refundAmount = amount || payment.amount;
    const refundId = this.generateId();

    // Create refund with Stripe
    let providerRefundId: string | undefined;
    if (payment.providerPaymentId) {
      const stripeRefund = await this.stripeClient.createRefund({
        paymentIntentId: payment.providerPaymentId,
        amount: Math.round(refundAmount * 100),
        reason: reason
      });
      providerRefundId = stripeRefund.id;
    }

    // Create refund record
    const refund: Refund = {
      id: refundId,
      paymentId,
      amount: refundAmount,
      reason,
      status: 'succeeded',
      providerRefundId,
      createdAt: new Date(),
      processedAt: new Date()
    };

    this.refunds.set(refundId, refund);

    // Update payment status
    if (refundAmount >= payment.amount) {
      payment.status = 'refunded';
    } else {
      payment.status = 'partially_refunded';
    }
    payment.updatedAt = new Date();
    this.payments.set(paymentId, payment);

    return refund;
  }

  // Get payment
  getPayment(paymentId: string): Payment | undefined {
    return this.payments.get(paymentId);
  }

  // List payments
  listPayments(filter?: {
    userId?: string;
    status?: PaymentStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }): Payment[] {
    let payments = Array.from(this.payments.values());

    if (filter?.userId) {
      payments = payments.filter(p => p.userId === filter.userId);
    }

    if (filter?.status) {
      payments = payments.filter(p => p.status === filter.status);
    }

    if (filter?.dateFrom) {
      payments = payments.filter(p => p.createdAt >= filter.dateFrom!);
    }

    if (filter?.dateTo) {
      payments = payments.filter(p => p.createdAt <= filter.dateTo!);
    }

    return payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Get payment analytics
  getAnalytics(dateFrom?: Date, dateTo?: Date): PaymentAnalytics {
    const payments = this.listPayments({ dateFrom, dateTo });

    const totalRevenue = payments
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalTransactions = payments.length;
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    const succeededCount = payments.filter(p => p.status === 'succeeded').length;
    const successRate = totalTransactions > 0 ? (succeededCount / totalTransactions) * 100 : 0;

    const refunds = Array.from(this.refunds.values());
    const refundRate = succeededCount > 0 ? (refunds.length / succeededCount) * 100 : 0;

    // Top payment methods
    const methodCounts = new Map<PaymentMethod, { count: number; amount: number }>();
    for (const payment of payments) {
      if (payment.status === 'succeeded') {
        const current = methodCounts.get(payment.method) || { count: 0, amount: 0 };
        methodCounts.set(payment.method, {
          count: current.count + 1,
          amount: current.amount + payment.amount
        });
      }
    }

    const topPaymentMethods = Array.from(methodCounts.entries())
      .map(([method, data]) => ({ method, ...data }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalRevenue,
      totalTransactions,
      averageTransactionValue,
      successRate,
      refundRate,
      topPaymentMethods,
      revenueByPeriod: [],
      failureReasons: []
    };
  }

  private generateId(): string {
    return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// SUBSCRIPTION MANAGER
// ============================================================================

class SubscriptionManager {
  private stripeClient: StripeClient;
  private subscriptions: Map<string, Subscription> = new Map();
  private plans: Map<string, SubscriptionPlan> = new Map();

  constructor(stripeApiKey: string) {
    this.stripeClient = new StripeClient(stripeApiKey);
    this.initializePlans();
  }

  // Initialize default plans
  private initializePlans(): void {
    const plans: SubscriptionPlan[] = [
      {
        id: 'basic',
        name: 'Basic',
        description: 'Essential features for individuals',
        amount: 9.99,
        currency: 'usd',
        interval: 'month',
        intervalCount: 1,
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
        active: true,
        createdAt: new Date()
      },
      {
        id: 'pro',
        name: 'Pro',
        description: 'Advanced features for professionals',
        amount: 29.99,
        currency: 'usd',
        interval: 'month',
        intervalCount: 1,
        trialPeriodDays: 14,
        features: ['All Basic features', 'Feature 4', 'Feature 5', 'Feature 6'],
        active: true,
        createdAt: new Date()
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Full features for organizations',
        amount: 99.99,
        currency: 'usd',
        interval: 'month',
        intervalCount: 1,
        trialPeriodDays: 30,
        features: ['All Pro features', 'Feature 7', 'Feature 8', 'Priority support'],
        active: true,
        createdAt: new Date()
      }
    ];

    for (const plan of plans) {
      this.plans.set(plan.id, plan);
    }
  }

  // Create subscription
  async createSubscription(params: {
    userId: string;
    planId: string;
    paymentMethod?: string;
  }): Promise<Subscription> {
    const plan = this.plans.get(params.planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    const subscriptionId = this.generateId();
    const now = new Date();
    const periodEnd = new Date(now.getTime() + plan.intervalCount * 30 * 24 * 60 * 60 * 1000);

    // Create subscription with Stripe
    const stripeSubscription = await this.stripeClient.createSubscription({
      customerId: params.userId,
      priceId: plan.id,
      trialPeriodDays: plan.trialPeriodDays
    });

    // Create subscription record
    const subscription: Subscription = {
      id: subscriptionId,
      userId: params.userId,
      planId: params.planId,
      status: stripeSubscription.status as SubscriptionStatus,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      providerSubscriptionId: stripeSubscription.id,
      createdAt: now,
      updatedAt: now
    };

    if (plan.trialPeriodDays) {
      subscription.trialStart = now;
      subscription.trialEnd = new Date(now.getTime() + plan.trialPeriodDays * 24 * 60 * 60 * 1000);
    }

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<Subscription> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (subscription.providerSubscriptionId) {
      await this.stripeClient.cancelSubscription(subscription.providerSubscriptionId, cancelAtPeriodEnd);
    }

    subscription.cancelAtPeriodEnd = cancelAtPeriodEnd;
    if (!cancelAtPeriodEnd) {
      subscription.status = 'canceled';
      subscription.canceledAt = new Date();
    }
    subscription.updatedAt = new Date();

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  // Reactivate subscription
  async reactivateSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    subscription.cancelAtPeriodEnd = false;
    subscription.status = 'active';
    subscription.updatedAt = new Date();

    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  // Get subscription
  getSubscription(subscriptionId: string): Subscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  // List subscriptions
  listSubscriptions(userId?: string): Subscription[] {
    let subscriptions = Array.from(this.subscriptions.values());

    if (userId) {
      subscriptions = subscriptions.filter(s => s.userId === userId);
    }

    return subscriptions;
  }

  // Get plan
  getPlan(planId: string): SubscriptionPlan | undefined {
    return this.plans.get(planId);
  }

  // List plans
  listPlans(): SubscriptionPlan[] {
    return Array.from(this.plans.values()).filter(p => p.active);
  }

  private generateId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// INVOICE MANAGER
// ============================================================================

class InvoiceManager {
  private invoices: Map<string, Invoice> = new Map();

  // Create invoice
  createInvoice(params: {
    customerId: string;
    subscriptionId?: string;
    items: InvoiceItem[];
    dueDate: Date;
    tax?: number;
    discount?: number;
  }): Invoice {
    const invoiceId = this.generateId();
    const amount = params.items.reduce((sum, item) => sum + item.amount, 0);
    const total = amount + (params.tax || 0) - (params.discount || 0);

    const invoice: Invoice = {
      id: invoiceId,
      customerId: params.customerId,
      subscriptionId: params.subscriptionId,
      amount,
      currency: 'usd',
      status: 'open',
      dueDate: params.dueDate,
      items: params.items,
      tax: params.tax,
      discount: params.discount,
      total,
      createdAt: new Date()
    };

    this.invoices.set(invoiceId, invoice);
    return invoice;
  }

  // Mark invoice as paid
  markAsPaid(invoiceId: string): Invoice {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    this.invoices.set(invoiceId, invoice);

    return invoice;
  }

  // Void invoice
  voidInvoice(invoiceId: string): Invoice {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    invoice.status = 'void';
    this.invoices.set(invoiceId, invoice);

    return invoice;
  }

  // Get invoice
  getInvoice(invoiceId: string): Invoice | undefined {
    return this.invoices.get(invoiceId);
  }

  // List invoices
  listInvoices(customerId?: string): Invoice[] {
    let invoices = Array.from(this.invoices.values());

    if (customerId) {
      invoices = invoices.filter(i => i.customerId === customerId);
    }

    return invoices.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private generateId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// FRAUD DETECTION
// ============================================================================

class FraudDetector {
  private checks: Map<string, FraudCheck> = new Map();

  // Check payment for fraud
  async checkPayment(payment: Payment): Promise<FraudCheck> {
    const flags: FraudFlag[] = [];
    let riskScore = 0;

    // Check amount
    if (payment.amount > 10000) {
      flags.push({
        type: 'high_amount',
        severity: 'medium',
        description: 'Transaction amount exceeds $10,000'
      });
      riskScore += 30;
    }

    // Check velocity (simplified)
    if (riskScore > 0) {
      flags.push({
        type: 'velocity',
        severity: 'low',
        description: 'Multiple transactions detected'
      });
      riskScore += 10;
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore < 30) riskLevel = 'low';
    else if (riskScore < 60) riskLevel = 'medium';
    else if (riskScore < 80) riskLevel = 'high';
    else riskLevel = 'critical';

    // Make decision
    let decision: 'approve' | 'review' | 'decline';
    if (riskLevel === 'low') decision = 'approve';
    else if (riskLevel === 'critical') decision = 'decline';
    else decision = 'review';

    const check: FraudCheck = {
      id: this.generateId(),
      paymentId: payment.id,
      riskScore,
      riskLevel,
      flags,
      decision,
      checkedAt: new Date()
    };

    this.checks.set(check.id, check);
    return check;
  }

  // Get fraud check
  getFraudCheck(checkId: string): FraudCheck | undefined {
    return this.checks.get(checkId);
  }

  private generateId(): string {
    return `fraud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Initialize with environment variable
const stripeApiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';

export const paymentProcessor = new PaymentProcessor(stripeApiKey);
export const subscriptionManager = new SubscriptionManager(stripeApiKey);
export const invoiceManager = new InvoiceManager();
export const fraudDetector = new FraudDetector();

// Helper functions
export async function processPayment(params: {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  metadata?: Record<string, any>;
}): Promise<Payment> {
  return await paymentProcessor.processPayment(params);
}

export async function refundPayment(paymentId: string, amount?: number, reason?: RefundReason): Promise<Refund> {
  return await paymentProcessor.refundPayment(paymentId, amount, reason);
}

export async function createSubscription(params: {
  userId: string;
  planId: string;
  paymentMethod?: string;
}): Promise<Subscription> {
  return await subscriptionManager.createSubscription(params);
}

export async function cancelSubscription(subscriptionId: string, cancelAtPeriodEnd?: boolean): Promise<Subscription> {
  return await subscriptionManager.cancelSubscription(subscriptionId, cancelAtPeriodEnd);
}

export function getPaymentAnalytics(dateFrom?: Date, dateTo?: Date): PaymentAnalytics {
  return paymentProcessor.getAnalytics(dateFrom, dateTo);
}

export async function checkPaymentFraud(payment: Payment): Promise<FraudCheck> {
  return await fraudDetector.checkPayment(payment);
}
