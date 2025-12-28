/**
 * Stripe Connect Service
 * Handles host onboarding, account management, and automated payouts
 */

import Stripe from 'stripe';
import { getDb } from './db';
import { hostProfiles, wallets, payouts } from '../drizzle/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

interface OnboardingResult {
  accountId: string;
  onboardingUrl: string;
  requiresAction: boolean;
}

interface PayoutSchedule {
  hostId: string;
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, string>;
}

interface PayoutResult {
  payoutId: string;
  amount: number;
  status: 'pending' | 'in_transit' | 'paid' | 'failed';
  estimatedArrival: Date;
}

class StripeConnectService {
  private stripe: Stripe;

  constructor() {
    this.stripe = stripe;
    console.log('[Stripe Connect] Service initialized');
  }

  /**
   * Create a Stripe Connect account for a host
   */
  async createConnectAccount(hostId: string, email: string, country: string = 'US'): Promise<OnboardingResult> {
    try {
      // Create Stripe Connect account
      const account = await this.stripe.accounts.create({
        type: 'express',
        country,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          hostId,
        },
      });

      // Create account link for onboarding
      const accountLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.VITE_APP_URL}/host/onboarding/refresh`,
        return_url: `${process.env.VITE_APP_URL}/host/onboarding/complete`,
        type: 'account_onboarding',
      });

      // Update host profile with Stripe account ID
      const db = await getDb();
      await db
        .update(hostProfiles)
        .set({
          stripeAccountId: account.id,
          stripeOnboardingComplete: false,
        })
        .where(eq(hostProfiles.id, hostId));

      console.log(`[Stripe Connect] Created account for host ${hostId}: ${account.id}`);

      return {
        accountId: account.id,
        onboardingUrl: accountLink.url,
        requiresAction: true,
      };
    } catch (error) {
      console.error('[Stripe Connect] Failed to create account:', error);
      throw new Error('Failed to create Stripe Connect account');
    }
  }

  /**
   * Check onboarding status
   */
  async checkOnboardingStatus(accountId: string): Promise<{
    complete: boolean;
    requiresAction: boolean;
    actionUrl?: string;
  }> {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);

      const complete = account.details_submitted === true &&
        account.charges_enabled === true &&
        account.payouts_enabled === true;

      if (complete) {
        return { complete: true, requiresAction: false };
      }

      // Create new account link if action required
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.VITE_APP_URL}/host/onboarding/refresh`,
        return_url: `${process.env.VITE_APP_URL}/host/onboarding/complete`,
        type: 'account_onboarding',
      });

      return {
        complete: false,
        requiresAction: true,
        actionUrl: accountLink.url,
      };
    } catch (error) {
      console.error('[Stripe Connect] Failed to check onboarding status:', error);
      throw new Error('Failed to check onboarding status');
    }
  }

  /**
   * Complete onboarding process
   */
  async completeOnboarding(hostId: string, accountId: string): Promise<boolean> {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);

      if (!account.details_submitted || !account.charges_enabled || !account.payouts_enabled) {
        return false;
      }

      // Update host profile
      const db = await getDb();
      await db
        .update(hostProfiles)
        .set({
          stripeOnboardingComplete: true,
        })
        .where(eq(hostProfiles.id, hostId));

      console.log(`[Stripe Connect] Onboarding complete for host ${hostId}`);
      return true;
    } catch (error) {
      console.error('[Stripe Connect] Failed to complete onboarding:', error);
      return false;
    }
  }

  /**
   * Create a payout to host
   */
  async createPayout(schedule: PayoutSchedule): Promise<PayoutResult> {
    try {
      const db = await getDb();

      // Get host's Stripe account
      const [host] = await db
        .select()
        .from(hostProfiles)
        .where(eq(hostProfiles.id, schedule.hostId))
        .limit(1);

      if (!host || !host.stripeAccountId) {
        throw new Error('Host Stripe account not found');
      }

      if (!host.stripeOnboardingComplete) {
        throw new Error('Host onboarding not complete');
      }

      // Check if host has sufficient balance in wallet
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, schedule.hostId))
        .limit(1);

      if (!wallet || wallet.balance < schedule.amount) {
        throw new Error('Insufficient wallet balance');
      }

      // Create transfer to connected account
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(schedule.amount * 100), // Convert to cents
        currency: schedule.currency.toLowerCase(),
        destination: host.stripeAccountId,
        description: schedule.description,
        metadata: schedule.metadata || {},
      });

      // Deduct from wallet
      await db
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} - ${schedule.amount}`,
        })
        .where(eq(wallets.userId, schedule.hostId));

      // Record payout
      const [payout] = await db
        .insert(payouts)
        .values({
          id: `payout_${Date.now()}`,
          hostId: schedule.hostId,
          amount: schedule.amount,
          currency: schedule.currency,
          status: 'pending',
          stripeTransferId: transfer.id,
          description: schedule.description,
          createdAt: new Date(),
        })
        .returning();

      console.log(`[Stripe Connect] Created payout for host ${schedule.hostId}: ${payout.id}`);

      return {
        payoutId: payout.id,
        amount: schedule.amount,
        status: 'pending',
        estimatedArrival: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };
    } catch (error) {
      console.error('[Stripe Connect] Failed to create payout:', error);
      throw new Error('Failed to create payout');
    }
  }

  /**
   * Schedule automated payouts for all eligible hosts
   */
  async scheduleAutomatedPayouts(minimumAmount: number = 50): Promise<number> {
    try {
      const db = await getDb();

      // Get all hosts with sufficient balance
      const eligibleHosts = await db
        .select({
          hostId: hostProfiles.id,
          balance: wallets.balance,
          stripeAccountId: hostProfiles.stripeAccountId,
        })
        .from(hostProfiles)
        .innerJoin(wallets, eq(wallets.userId, hostProfiles.id))
        .where(
          and(
            eq(hostProfiles.stripeOnboardingComplete, true),
            gte(wallets.balance, minimumAmount)
          )
        );

      let processedCount = 0;

      for (const host of eligibleHosts) {
        try {
          await this.createPayout({
            hostId: host.hostId,
            amount: host.balance,
            currency: 'USD',
            description: 'Automated payout',
            metadata: {
              automated: 'true',
              scheduledAt: new Date().toISOString(),
            },
          });
          processedCount++;
        } catch (error) {
          console.error(`[Stripe Connect] Failed to process payout for host ${host.hostId}:`, error);
        }
      }

      console.log(`[Stripe Connect] Processed ${processedCount} automated payouts`);
      return processedCount;
    } catch (error) {
      console.error('[Stripe Connect] Failed to schedule automated payouts:', error);
      return 0;
    }
  }

  /**
   * Get payout status from Stripe
   */
  async getPayoutStatus(transferId: string): Promise<string> {
    try {
      const transfer = await this.stripe.transfers.retrieve(transferId);
      
      if (transfer.reversed) {
        return 'failed';
      }
      
      // Check if transfer has been paid out
      const balance = await this.stripe.balance.retrieve({
        stripeAccount: transfer.destination as string,
      });

      // Simplified status check
      return transfer.amount > 0 ? 'paid' : 'pending';
    } catch (error) {
      console.error('[Stripe Connect] Failed to get payout status:', error);
      return 'unknown';
    }
  }

  /**
   * Update payout statuses
   */
  async updatePayoutStatuses(): Promise<number> {
    try {
      const db = await getDb();

      // Get all pending payouts
      const pendingPayouts = await db
        .select()
        .from(payouts)
        .where(eq(payouts.status, 'pending'));

      let updatedCount = 0;

      for (const payout of pendingPayouts) {
        if (!payout.stripeTransferId) continue;

        try {
          const status = await this.getPayoutStatus(payout.stripeTransferId);
          
          if (status !== 'pending' && status !== 'unknown') {
            await db
              .update(payouts)
              .set({ status: status as any })
              .where(eq(payouts.id, payout.id));
            updatedCount++;
          }
        } catch (error) {
          console.error(`[Stripe Connect] Failed to update payout ${payout.id}:`, error);
        }
      }

      console.log(`[Stripe Connect] Updated ${updatedCount} payout statuses`);
      return updatedCount;
    } catch (error) {
      console.error('[Stripe Connect] Failed to update payout statuses:', error);
      return 0;
    }
  }

  /**
   * Get host earnings summary
   */
  async getHostEarnings(hostId: string, startDate?: Date, endDate?: Date): Promise<{
    totalEarnings: number;
    pendingPayouts: number;
    completedPayouts: number;
    walletBalance: number;
  }> {
    try {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get wallet balance
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, hostId))
        .limit(1);

      // Get payout summary with proper where clause
      const whereConditions = [eq(payouts.hostId, hostId)];
      if (startDate) whereConditions.push(gte(payouts.createdAt, startDate));
      if (endDate) whereConditions.push(lte(payouts.createdAt, endDate));

      const payoutSummary = await db
        .select({
          status: payouts.status,
          total: sql<number>`SUM(${payouts.amount})`,
        })
        .from(payouts)
        .where(sql`${whereConditions.map((c, i) => `${i > 0 ? 'AND ' : ''}${c}`).join(' ')}`)
        .groupBy(payouts.status);

      const pendingPayouts = payoutSummary.find(p => p.status === 'pending')?.total || 0;
      const completedPayouts = payoutSummary.find(p => p.status === 'paid')?.total || 0;
      const totalEarnings = pendingPayouts + completedPayouts;

      return {
        totalEarnings,
        pendingPayouts,
        completedPayouts,
        walletBalance: wallet?.balance ? Number(wallet.balance) : 0,
      };
    } catch (error) {
      console.error('[Stripe Connect] Failed to get host earnings:', error);
      throw new Error('Failed to get host earnings');
    }
  }

  /**
   * Get dashboard URL for host to manage their Stripe account
   */
  async getDashboardUrl(accountId: string): Promise<string> {
    try {
      const loginLink = await this.stripe.accounts.createLoginLink(accountId);
      return loginLink.url;
    } catch (error) {
      console.error('[Stripe Connect] Failed to create dashboard URL:', error);
      throw new Error('Failed to create dashboard URL');
    }
  }
}

// Singleton instance
let connectService: StripeConnectService | null = null;

export function initializeStripeConnect() {
  if (!connectService) {
    connectService = new StripeConnectService();
  }
  return connectService;
}

export function getStripeConnect() {
  if (!connectService) {
    throw new Error('Stripe Connect service not initialized. Call initializeStripeConnect() first.');
  }
  return connectService;
}

export { StripeConnectService, OnboardingResult, PayoutSchedule, PayoutResult };
