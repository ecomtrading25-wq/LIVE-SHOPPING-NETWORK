/**
 * Payment and Virtual Economy Service
 * Handles Stripe integration, virtual wallets, gift purchases, and payouts
 */

import Stripe from 'stripe';
import { nanoid } from 'nanoid';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' })
  : null;

export interface VirtualWallet {
  userId: number;
  balance: number;
  currency: string;
  pendingBalance: number;
  lifetimeEarnings: number;
  lifetimeSpending: number;
}

export interface Transaction {
  id: string;
  userId: number;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'earning' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface GiftPurchase {
  giftId: string;
  quantity: number;
  recipientId: number;
  showId: string;
  totalAmount: number;
}

/**
 * Create or get virtual wallet for user
 */
export async function getOrCreateWallet(userId: number): Promise<VirtualWallet> {
  // In production, this would query the database
  // For now, return mock wallet
  
  return {
    userId,
    balance: 0,
    currency: 'USD',
    pendingBalance: 0,
    lifetimeEarnings: 0,
    lifetimeSpending: 0,
  };
}

/**
 * Add funds to wallet via Stripe
 */
export async function addFundsToWallet(
  userId: number,
  amount: number,
  paymentMethodId: string
): Promise<{ success: boolean; transactionId: string; error?: string }> {
  if (!stripe) {
    return {
      success: false,
      transactionId: '',
      error: 'Stripe not configured',
    };
  }
  
  try {
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        userId: userId.toString(),
        type: 'wallet_deposit',
      },
    });
    
    if (paymentIntent.status === 'succeeded') {
      const transactionId = nanoid();
      
      // In production, update database wallet balance
      console.log(`[Payment] Added $${amount} to wallet for user ${userId}`);
      
      return {
        success: true,
        transactionId,
      };
    }
    
    return {
      success: false,
      transactionId: '',
      error: 'Payment failed',
    };
  } catch (error: any) {
    console.error('[Payment] Error adding funds:', error);
    return {
      success: false,
      transactionId: '',
      error: error.message || 'Payment processing error',
    };
  }
}

/**
 * Purchase virtual gift
 */
export async function purchaseGift(
  userId: number,
  purchase: GiftPurchase
): Promise<{ success: boolean; transactionId: string; newBalance: number; error?: string }> {
  // In production:
  // 1. Check wallet balance
  // 2. Deduct amount
  // 3. Create transaction record
  // 4. Credit recipient (host)
  // 5. Create gift transaction
  
  const wallet = await getOrCreateWallet(userId);
  
  if (wallet.balance < purchase.totalAmount) {
    return {
      success: false,
      transactionId: '',
      newBalance: wallet.balance,
      error: 'Insufficient balance',
    };
  }
  
  const transactionId = nanoid();
  const newBalance = wallet.balance - purchase.totalAmount;
  
  console.log(`[Payment] User ${userId} purchased gift for $${purchase.totalAmount}`);
  
  // Calculate platform fee (e.g., 30%)
  const platformFee = purchase.totalAmount * 0.30;
  const hostEarnings = purchase.totalAmount - platformFee;
  
  // Credit host wallet
  console.log(`[Payment] Host ${purchase.recipientId} earned $${hostEarnings}`);
  
  return {
    success: true,
    transactionId,
    newBalance,
  };
}

/**
 * Request payout for host
 */
export async function requestPayout(
  userId: number,
  amount: number,
  payoutMethod: 'bank_account' | 'paypal' | 'stripe'
): Promise<{ success: boolean; payoutId: string; estimatedArrival: Date; error?: string }> {
  if (!stripe) {
    return {
      success: false,
      payoutId: '',
      estimatedArrival: new Date(),
      error: 'Stripe not configured',
    };
  }
  
  const wallet = await getOrCreateWallet(userId);
  
  if (wallet.balance < amount) {
    return {
      success: false,
      payoutId: '',
      estimatedArrival: new Date(),
      error: 'Insufficient balance',
    };
  }
  
  // Minimum payout amount
  if (amount < 10) {
    return {
      success: false,
      payoutId: '',
      estimatedArrival: new Date(),
      error: 'Minimum payout amount is $10',
    };
  }
  
  try {
    const payoutId = nanoid();
    
    // In production:
    // 1. Create Stripe payout or transfer
    // 2. Update wallet balance
    // 3. Create payout record
    // 4. Send confirmation email
    
    const estimatedArrival = new Date();
    estimatedArrival.setDate(estimatedArrival.getDate() + 3); // 3 business days
    
    console.log(`[Payment] Payout requested: $${amount} for user ${userId}`);
    
    return {
      success: true,
      payoutId,
      estimatedArrival,
    };
  } catch (error: any) {
    console.error('[Payment] Payout error:', error);
    return {
      success: false,
      payoutId: '',
      estimatedArrival: new Date(),
      error: error.message || 'Payout processing error',
    };
  }
}

/**
 * Get transaction history
 */
export async function getTransactionHistory(
  userId: number,
  limit: number = 50,
  offset: number = 0
): Promise<Transaction[]> {
  // In production, query database
  // For now, return mock data
  
  return [
    {
      id: nanoid(),
      userId,
      type: 'deposit',
      amount: 50.00,
      currency: 'USD',
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      id: nanoid(),
      userId,
      type: 'purchase',
      amount: -10.00,
      currency: 'USD',
      status: 'completed',
      metadata: { giftName: 'Rose' },
      createdAt: new Date(Date.now() - 43200000),
    },
  ];
}

/**
 * Create Stripe customer for user
 */
export async function createStripeCustomer(
  userId: number,
  email: string,
  name: string
): Promise<{ customerId: string; error?: string }> {
  if (!stripe) {
    return { customerId: '', error: 'Stripe not configured' };
  }
  
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId: userId.toString(),
      },
    });
    
    return { customerId: customer.id };
  } catch (error: any) {
    console.error('[Payment] Error creating customer:', error);
    return { customerId: '', error: error.message };
  }
}

/**
 * Create Stripe Connect account for host
 */
export async function createHostStripeAccount(
  userId: number,
  email: string,
  country: string = 'US'
): Promise<{ accountId: string; onboardingUrl: string; error?: string }> {
  if (!stripe) {
    return { accountId: '', onboardingUrl: '', error: 'Stripe not configured' };
  }
  
  try {
    // Create Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        userId: userId.toString(),
      },
    });
    
    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/host/dashboard?refresh=true`,
      return_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/host/dashboard?success=true`,
      type: 'account_onboarding',
    });
    
    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  } catch (error: any) {
    console.error('[Payment] Error creating host account:', error);
    return { accountId: '', onboardingUrl: '', error: error.message };
  }
}

/**
 * Process host earnings from show
 */
export async function processShowEarnings(
  showId: string,
  hostId: number,
  totalRevenue: number
): Promise<{ success: boolean; hostEarnings: number; platformFee: number }> {
  // Platform takes 30% fee
  const platformFeeRate = 0.30;
  const platformFee = totalRevenue * platformFeeRate;
  const hostEarnings = totalRevenue - platformFee;
  
  // In production:
  // 1. Update host wallet
  // 2. Create earnings record
  // 3. Update show analytics
  
  console.log(`[Payment] Show ${showId} earnings: $${hostEarnings} to host, $${platformFee} platform fee`);
  
  return {
    success: true,
    hostEarnings,
    platformFee,
  };
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(userId: number): Promise<{
  balance: number;
  pendingBalance: number;
  availableForWithdrawal: number;
}> {
  const wallet = await getOrCreateWallet(userId);
  
  return {
    balance: wallet.balance,
    pendingBalance: wallet.pendingBalance,
    availableForWithdrawal: wallet.balance - wallet.pendingBalance,
  };
}

/**
 * Refund transaction
 */
export async function refundTransaction(
  transactionId: string,
  amount?: number
): Promise<{ success: boolean; refundId: string; error?: string }> {
  if (!stripe) {
    return { success: false, refundId: '', error: 'Stripe not configured' };
  }
  
  try {
    // In production, look up original payment intent and create refund
    const refundId = nanoid();
    
    console.log(`[Payment] Refund processed for transaction ${transactionId}`);
    
    return {
      success: true,
      refundId,
    };
  } catch (error: any) {
    console.error('[Payment] Refund error:', error);
    return {
      success: false,
      refundId: '',
      error: error.message,
    };
  }
}

/**
 * Get revenue analytics
 */
export async function getRevenueAnalytics(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<{
  totalRevenue: number;
  totalEarnings: number;
  platformFees: number;
  transactionCount: number;
  averageTransactionValue: number;
  topGifts: Array<{ giftId: string; name: string; count: number; revenue: number }>;
}> {
  // In production, query database with date range
  
  return {
    totalRevenue: 1250.00,
    totalEarnings: 875.00,
    platformFees: 375.00,
    transactionCount: 45,
    averageTransactionValue: 27.78,
    topGifts: [
      { giftId: '1', name: 'Rose', count: 20, revenue: 200.00 },
      { giftId: '2', name: 'Diamond', count: 5, revenue: 500.00 },
      { giftId: '3', name: 'Heart', count: 15, revenue: 150.00 },
    ],
  };
}

/**
 * Validate payment method
 */
export async function validatePaymentMethod(paymentMethodId: string): Promise<{
  valid: boolean;
  type: string;
  last4?: string;
  error?: string;
}> {
  if (!stripe) {
    return { valid: false, type: '', error: 'Stripe not configured' };
  }
  
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    return {
      valid: true,
      type: paymentMethod.type,
      last4: paymentMethod.card?.last4,
    };
  } catch (error: any) {
    return {
      valid: false,
      type: '',
      error: error.message,
    };
  }
}
