/**
 * Financial Operations Service
 * Handles multi-currency ledger, PayPal/Wise transaction ingestion, reconciliation, and payouts
 */

import { getDbSync } from './db';
const db = getDbSync();
import {
  transactions as ledgerEntries,
  providerTransactions,
  reconciliationDiscrepancies,
  payoutHolds,
  settlements,
  orders
} from '../drizzle/schema';
import { eq, and, desc, gte, lte, isNull, sql } from 'drizzle-orm';

export type LedgerEntryType = 
  | 'ORDER_PAYMENT' 
  | 'REFUND' 
  | 'COMMISSION' 
  | 'PAYOUT' 
  | 'FEE' 
  | 'ADJUSTMENT'
  | 'CHARGEBACK'
  | 'SETTLEMENT';

export type TransactionProvider = 'PAYPAL' | 'WISE' | 'STRIPE' | 'BANK';
export type ReconciliationStatus = 'MATCHED' | 'UNMATCHED' | 'DISCREPANCY' | 'MANUAL_REVIEW';

export interface LedgerEntry {
  entryId: string;
  channelId: string;
  type: LedgerEntryType;
  amountCents: number;
  currency: string;
  orderId?: string;
  creatorId?: string;
  userId?: string;
  provider?: TransactionProvider;
  providerTransactionId?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ProviderTransaction {
  transactionId: string;
  channelId: string;
  provider: TransactionProvider;
  providerTxnId: string;
  type: string;
  amountCents: number;
  feeCents: number;
  netCents: number;
  currency: string;
  status: string;
  orderId?: string;
  ledgerEntryId?: string;
  reconciledAt?: Date;
  transactionDate: Date;
  metadata?: Record<string, any>;
}

export interface ReconciliationDiscrepancy {
  discrepancyId: string;
  channelId: string;
  provider: TransactionProvider;
  providerTxnId: string;
  ledgerEntryId?: string;
  discrepancyType: 'MISSING_LEDGER' | 'MISSING_PROVIDER' | 'AMOUNT_MISMATCH' | 'STATUS_MISMATCH';
  expectedAmountCents?: number;
  actualAmountCents?: number;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'ACCEPTED';
  notes?: string;
}

/**
 * Create ledger entry
 */
export async function createLedgerEntry(
  channelId: string,
  type: LedgerEntryType,
  amountCents: number,
  currency: string,
  description: string,
  options?: {
    orderId?: string;
    creatorId?: string;
    userId?: string;
    provider?: TransactionProvider;
    providerTransactionId?: string;
    metadata?: Record<string, any>;
  }
): Promise<LedgerEntry> {
  const [entry] = await db.insert(ledgerEntries).values({
    channelId,
    type,
    amountCents,
    currency,
    orderId: options?.orderId || null,
    creatorId: options?.creatorId || null,
    userId: options?.userId || null,
    provider: options?.provider || null,
    providerTransactionId: options?.providerTransactionId || null,
    description,
    metadata: options?.metadata || null
  }).returning();

  return entry as LedgerEntry;
}

/**
 * Ingest PayPal transaction
 */
export async function ingestPayPalTransaction(
  channelId: string,
  paypalData: {
    transactionId: string;
    type: string;
    amount: number;
    fee: number;
    currency: string;
    status: string;
    orderId?: string;
    transactionDate: Date;
    metadata?: Record<string, any>;
  }
): Promise<ProviderTransaction> {
  // Check if already ingested
  const existing = await db.query.providerTransactions.findFirst({
    where: and(
      eq(providerTransactions.channelId, channelId),
      eq(providerTransactions.provider, 'PAYPAL'),
      eq(providerTransactions.providerTxnId, paypalData.transactionId)
    )
  });

  if (existing) {
    return existing as ProviderTransaction;
  }

  // Create provider transaction
  const amountCents = Math.round(paypalData.amount * 100);
  const feeCents = Math.round(paypalData.fee * 100);
  const netCents = amountCents - feeCents;

  const [transaction] = await db.insert(providerTransactions).values({
    channelId,
    provider: 'PAYPAL',
    providerTxnId: paypalData.transactionId,
    type: paypalData.type,
    amountCents,
    feeCents,
    netCents,
    currency: paypalData.currency,
    status: paypalData.status,
    orderId: paypalData.orderId || null,
    transactionDate: paypalData.transactionDate,
    metadata: paypalData.metadata || null
  }).returning();

  // Attempt auto-reconciliation
  await autoReconcileTransaction(channelId, transaction.transactionId);

  return transaction as ProviderTransaction;
}

/**
 * Ingest Wise transaction
 */
export async function ingestWiseTransaction(
  channelId: string,
  wiseData: {
    transactionId: string;
    type: string;
    amount: number;
    fee: number;
    currency: string;
    status: string;
    creatorId?: string;
    transactionDate: Date;
    metadata?: Record<string, any>;
  }
): Promise<ProviderTransaction> {
  // Check if already ingested
  const existing = await db.query.providerTransactions.findFirst({
    where: and(
      eq(providerTransactions.channelId, channelId),
      eq(providerTransactions.provider, 'WISE'),
      eq(providerTransactions.providerTxnId, wiseData.transactionId)
    )
  });

  if (existing) {
    return existing as ProviderTransaction;
  }

  // Create provider transaction
  const amountCents = Math.round(wiseData.amount * 100);
  const feeCents = Math.round(wiseData.fee * 100);
  const netCents = amountCents - feeCents;

  const [transaction] = await db.insert(providerTransactions).values({
    channelId,
    provider: 'WISE',
    providerTxnId: wiseData.transactionId,
    type: wiseData.type,
    amountCents,
    feeCents,
    netCents,
    currency: wiseData.currency,
    status: wiseData.status,
    transactionDate: wiseData.transactionDate,
    metadata: wiseData.metadata || null
  }).returning();

  // Attempt auto-reconciliation
  await autoReconcileTransaction(channelId, transaction.transactionId);

  return transaction as ProviderTransaction;
}

/**
 * Auto-reconcile transaction with ledger
 */
async function autoReconcileTransaction(
  channelId: string,
  transactionId: string
): Promise<boolean> {
  const transaction = await db.query.providerTransactions.findFirst({
    where: eq(providerTransactions.transactionId, transactionId)
  });

  if (!transaction) return false;

  // Try to match by order ID
  if (transaction.orderId) {
    const ledgerEntry = await db.query.ledgerEntries.findFirst({
      where: and(
        eq(ledgerEntries.channelId, channelId),
        eq(ledgerEntries.orderId, transaction.orderId),
        isNull(ledgerEntries.providerTransactionId)
      )
    });

    if (ledgerEntry) {
      // Check if amounts match (within 1% tolerance for fees)
      const amountDiff = Math.abs(ledgerEntry.amountCents - transaction.amountCents);
      const tolerance = Math.floor(transaction.amountCents * 0.01);

      if (amountDiff <= tolerance) {
        // Match found
        await db.update(ledgerEntries)
          .set({
            providerTransactionId: transaction.providerTxnId,
            provider: transaction.provider
          })
          .where(eq(ledgerEntries.entryId, ledgerEntry.entryId));

        await db.update(providerTransactions)
          .set({
            ledgerEntryId: ledgerEntry.entryId,
            reconciledAt: new Date()
          })
          .where(eq(providerTransactions.transactionId, transactionId));

        return true;
      } else {
        // Amount mismatch - create discrepancy
        await createDiscrepancy(
          channelId,
          transaction.provider,
          transaction.providerTxnId,
          'AMOUNT_MISMATCH',
          ledgerEntry.entryId,
          ledgerEntry.amountCents,
          transaction.amountCents
        );
      }
    } else {
      // No matching ledger entry - create discrepancy
      await createDiscrepancy(
        channelId,
        transaction.provider,
        transaction.providerTxnId,
        'MISSING_LEDGER',
        undefined,
        undefined,
        transaction.amountCents
      );
    }
  }

  return false;
}

/**
 * Create reconciliation discrepancy
 */
async function createDiscrepancy(
  channelId: string,
  provider: TransactionProvider,
  providerTxnId: string,
  discrepancyType: ReconciliationDiscrepancy['discrepancyType'],
  ledgerEntryId?: string,
  expectedAmountCents?: number,
  actualAmountCents?: number
): Promise<void> {
  await db.insert(reconciliationDiscrepancies).values({
    channelId,
    provider,
    providerTxnId,
    ledgerEntryId: ledgerEntryId || null,
    discrepancyType,
    expectedAmountCents: expectedAmountCents || null,
    actualAmountCents: actualAmountCents || null,
    status: 'OPEN'
  });
}

/**
 * Get unmatched transactions
 */
export async function getUnmatchedTransactions(
  channelId: string,
  provider?: TransactionProvider
) {
  let query = db.query.providerTransactions.findMany({
    where: and(
      eq(providerTransactions.channelId, channelId),
      isNull(providerTransactions.reconciledAt)
    ),
    orderBy: desc(providerTransactions.transactionDate),
    limit: 100
  });

  const results = await query;

  if (provider) {
    return results.filter(t => t.provider === provider);
  }

  return results;
}

/**
 * Get reconciliation discrepancies
 */
export async function getDiscrepancies(
  channelId: string,
  status?: ReconciliationDiscrepancy['status']
) {
  const discrepancies = await db.query.reconciliationDiscrepancies.findMany({
    where: eq(reconciliationDiscrepancies.channelId, channelId),
    orderBy: desc(reconciliationDiscrepancies.createdAt),
    limit: 100
  });

  if (status) {
    return discrepancies.filter(d => d.status === status);
  }

  return discrepancies;
}

/**
 * Manually reconcile transaction
 */
export async function manuallyReconcileTransaction(
  channelId: string,
  transactionId: string,
  ledgerEntryId: string,
  notes?: string
): Promise<void> {
  const transaction = await db.query.providerTransactions.findFirst({
    where: and(
      eq(providerTransactions.transactionId, transactionId),
      eq(providerTransactions.channelId, channelId)
    )
  });

  const ledgerEntry = await db.query.ledgerEntries.findFirst({
    where: and(
      eq(ledgerEntries.entryId, ledgerEntryId),
      eq(ledgerEntries.channelId, channelId)
    )
  });

  if (!transaction || !ledgerEntry) {
    throw new Error('Transaction or ledger entry not found');
  }

  // Link them
  await db.update(ledgerEntries)
    .set({
      providerTransactionId: transaction.providerTxnId,
      provider: transaction.provider
    })
    .where(eq(ledgerEntries.entryId, ledgerEntryId));

  await db.update(providerTransactions)
    .set({
      ledgerEntryId,
      reconciledAt: new Date()
    })
    .where(eq(providerTransactions.transactionId, transactionId));

  // Resolve any related discrepancies
  const discrepancy = await db.query.reconciliationDiscrepancies.findFirst({
    where: and(
      eq(reconciliationDiscrepancies.channelId, channelId),
      eq(reconciliationDiscrepancies.providerTxnId, transaction.providerTxnId),
      eq(reconciliationDiscrepancies.status, 'OPEN')
    )
  });

  if (discrepancy) {
    await db.update(reconciliationDiscrepancies)
      .set({
        status: 'RESOLVED',
        notes: notes || 'Manually reconciled'
      })
      .where(eq(reconciliationDiscrepancies.discrepancyId, discrepancy.discrepancyId));
  }
}

/**
 * Calculate channel balance
 */
export async function calculateChannelBalance(
  channelId: string,
  currency: string = 'AUD'
): Promise<{
  totalRevenueCents: number;
  totalRefundsCents: number;
  totalCommissionsCents: number;
  totalPayoutsCents: number;
  totalFeesCents: number;
  netBalanceCents: number;
}> {
  const entries = await db.query.ledgerEntries.findMany({
    where: and(
      eq(ledgerEntries.channelId, channelId),
      eq(ledgerEntries.currency, currency)
    )
  });

  let totalRevenueCents = 0;
  let totalRefundsCents = 0;
  let totalCommissionsCents = 0;
  let totalPayoutsCents = 0;
  let totalFeesCents = 0;

  for (const entry of entries) {
    switch (entry.type) {
      case 'ORDER_PAYMENT':
        totalRevenueCents += entry.amountCents;
        break;
      case 'REFUND':
        totalRefundsCents += Math.abs(entry.amountCents);
        break;
      case 'COMMISSION':
        totalCommissionsCents += Math.abs(entry.amountCents);
        break;
      case 'PAYOUT':
        totalPayoutsCents += Math.abs(entry.amountCents);
        break;
      case 'FEE':
        totalFeesCents += Math.abs(entry.amountCents);
        break;
    }
  }

  const netBalanceCents = totalRevenueCents - totalRefundsCents - totalCommissionsCents - totalPayoutsCents - totalFeesCents;

  return {
    totalRevenueCents,
    totalRefundsCents,
    totalCommissionsCents,
    totalPayoutsCents,
    totalFeesCents,
    netBalanceCents
  };
}

/**
 * Create payout hold
 */
export async function createPayoutHold(
  channelId: string,
  orderId: string,
  reason: string,
  holdUntil?: Date
): Promise<void> {
  await db.insert(payoutHolds).values({
    channelId,
    orderId,
    reason,
    holdUntil: holdUntil || null,
    status: 'ACTIVE'
  });
}

/**
 * Release payout hold
 */
export async function releasePayoutHold(
  channelId: string,
  orderId: string
): Promise<void> {
  await db.update(payoutHolds)
    .set({
      status: 'RELEASED',
      releasedAt: new Date()
    })
    .where(and(
      eq(payoutHolds.channelId, channelId),
      eq(payoutHolds.orderId, orderId),
      eq(payoutHolds.status, 'ACTIVE')
    ));
}

/**
 * Get orders eligible for payout
 */
export async function getEligiblePayoutOrders(
  channelId: string,
  creatorId?: string
): Promise<any[]> {
  // Get completed orders without holds
  const eligibleOrders = await db.query.orders.findMany({
    where: and(
      eq(orders.channelId, channelId),
      eq(orders.status, 'DELIVERED'),
      creatorId ? eq(orders.creatorId, creatorId) : undefined
    ),
    with: {
      holds: true
    }
  });

  // Filter out orders with active holds
  return eligibleOrders.filter(order => {
    const activeHolds = order.holds?.filter(h => h.status === 'ACTIVE') || [];
    return activeHolds.length === 0;
  });
}

/**
 * Process settlement batch
 */
export async function processSettlement(
  channelId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{
  settlementId: string;
  totalCents: number;
  transactionCount: number;
}> {
  // Get all provider transactions in period
  const transactions = await db.query.providerTransactions.findMany({
    where: and(
      eq(providerTransactions.channelId, channelId),
      gte(providerTransactions.transactionDate, periodStart),
      lte(providerTransactions.transactionDate, periodEnd)
    )
  });

  const totalCents = transactions.reduce((sum, txn) => sum + txn.netCents, 0);

  // Create settlement record
  const [settlement] = await db.insert(settlements).values({
    channelId,
    periodStart,
    periodEnd,
    totalCents,
    transactionCount: transactions.length,
    status: 'PENDING',
    currency: 'AUD'
  }).returning();

  return {
    settlementId: settlement.settlementId,
    totalCents,
    transactionCount: transactions.length
  };
}

/**
 * Get financial summary for period
 */
export async function getFinancialSummary(
  channelId: string,
  startDate: Date,
  endDate: Date
) {
  const entries = await db.query.ledgerEntries.findMany({
    where: and(
      eq(ledgerEntries.channelId, channelId),
      gte(ledgerEntries.createdAt, startDate),
      lte(ledgerEntries.createdAt, endDate)
    )
  });

  const summary = {
    revenue: 0,
    refunds: 0,
    commissions: 0,
    payouts: 0,
    fees: 0,
    chargebacks: 0,
    adjustments: 0,
    net: 0
  };

  for (const entry of entries) {
    switch (entry.type) {
      case 'ORDER_PAYMENT':
        summary.revenue += entry.amountCents;
        break;
      case 'REFUND':
        summary.refunds += Math.abs(entry.amountCents);
        break;
      case 'COMMISSION':
        summary.commissions += Math.abs(entry.amountCents);
        break;
      case 'PAYOUT':
        summary.payouts += Math.abs(entry.amountCents);
        break;
      case 'FEE':
        summary.fees += Math.abs(entry.amountCents);
        break;
      case 'CHARGEBACK':
        summary.chargebacks += Math.abs(entry.amountCents);
        break;
      case 'ADJUSTMENT':
        summary.adjustments += entry.amountCents;
        break;
    }
  }

  summary.net = summary.revenue - summary.refunds - summary.commissions - summary.payouts - summary.fees - summary.chargebacks + summary.adjustments;

  return summary;
}
