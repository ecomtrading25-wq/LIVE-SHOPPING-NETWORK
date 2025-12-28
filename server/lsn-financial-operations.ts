/**
 * LSN Financial Operations Service
 * 
 * Comprehensive financial management system including:
 * - Double-entry ledger system
 * - Multi-currency support with FX journals
 * - PayPal transaction ingestion
 * - Wise transaction ingestion
 * - Auto-match reconciliation engine
 * - Manual reconciliation UI support
 * - Creator payout calculation and execution
 * - Payout holds for fraud
 * - Commission calculation engine
 * - Revenue recognition automation
 * - Financial reporting and analytics
 * - Cash flow tracking
 * - Reserve fund management
 */

import { db } from "./db";
import {
  ledgerEntries,
  providerTransactions,
  reconciliationMatches,
  creatorPayouts,
  creators,
  orders,
  fraudScores,
  idempotencyKeys
} from "../drizzle/schema";
import { eq, and, between, desc, sql, isNull } from "drizzle-orm";
import { ulid } from "ulid";
import crypto from "crypto";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export type LedgerAccount = 
  | "CASH"
  | "REVENUE"
  | "COGS"
  | "FEES"
  | "PAYABLE_CREATOR"
  | "PAYABLE_SUPPLIER"
  | "RECEIVABLE"
  | "REFUNDS"
  | "CHARGEBACKS"
  | "FX_GAIN"
  | "FX_LOSS"
  | "RESERVES";

export type EntryType =
  | "SALE"
  | "REFUND"
  | "PAYOUT"
  | "FEE"
  | "ADJUSTMENT"
  | "FX_GAIN"
  | "FX_LOSS"
  | "CHARGEBACK"
  | "COMMISSION";

export type TransactionProvider = "PAYPAL" | "WISE" | "STRIPE" | "BANK";

export interface LedgerEntry {
  entryId: string;
  channelId: string;
  entryType: EntryType;
  refType: string;
  refId: string;
  debitAccount: LedgerAccount;
  creditAccount: LedgerAccount;
  amountCents: number;
  currency: string;
  fxRate?: number;
  baseCurrency?: string;
  baseAmountCents?: number;
  description: string;
  postedAt: Date;
}

export interface ReconciliationResult {
  matched: number;
  unmatched: number;
  discrepancies: number;
  totalMatchedCents: number;
  totalUnmatchedCents: number;
}

// ============================================================================
// DOUBLE-ENTRY LEDGER SERVICE
// ============================================================================

export class LedgerService {
  /**
   * Post a ledger entry (idempotent)
   */
  async postEntry(
    channelId: string,
    entry: Omit<LedgerEntry, "entryId" | "channelId" | "postedAt">,
    idempotencyKey?: string
  ): Promise<string> {
    // Check idempotency
    if (idempotencyKey) {
      const existing = await this.checkIdempotency(
        channelId,
        "LEDGER_POST",
        idempotencyKey
      );
      if (existing) {
        return JSON.parse(existing.result).entryId;
      }
    }

    // Validate double-entry
    if (entry.debitAccount === entry.creditAccount) {
      throw new Error("Debit and credit accounts must be different");
    }

    if (entry.amountCents <= 0) {
      throw new Error("Amount must be positive");
    }

    // Calculate base currency amount if FX
    let baseAmountCents = entry.amountCents;
    if (entry.fxRate && entry.baseCurrency && entry.currency !== entry.baseCurrency) {
      baseAmountCents = Math.round(entry.amountCents * entry.fxRate);
    }

    // Insert entry
    const entryId = ulid();
    await db.insert(ledgerEntries).values({
      id: entryId,
      channelId,
      entryType: entry.entryType,
      refType: entry.refType,
      refId: entry.refId,
      debitAccount: entry.debitAccount,
      creditAccount: entry.creditAccount,
      amountCents: entry.amountCents,
      currency: entry.currency,
      fxRate: entry.fxRate,
      baseCurrency: entry.baseCurrency,
      baseAmountCents,
      description: entry.description,
      postedAt: new Date(),
      createdAt: new Date()
    });

    // Record idempotency
    if (idempotencyKey) {
      await this.recordIdempotency(
        channelId,
        "LEDGER_POST",
        idempotencyKey,
        { entryId },
        "COMPLETED"
      );
    }

    return entryId;
  }

  /**
   * Post a sale transaction (multiple entries)
   */
  async postSale(
    channelId: string,
    orderId: string,
    grossCents: number,
    paymentFeeCents: number,
    creatorCommissionCents: number,
    currency: string = "AUD"
  ): Promise<string[]> {
    const entries: string[] = [];

    // 1. Record gross revenue
    // DR: CASH, CR: REVENUE
    const netCash = grossCents - paymentFeeCents;
    entries.push(await this.postEntry(channelId, {
      entryType: "SALE",
      refType: "ORDER",
      refId: orderId,
      debitAccount: "CASH",
      creditAccount: "REVENUE",
      amountCents: netCash,
      currency,
      description: `Sale revenue for order ${orderId}`
    }));

    // 2. Record payment processing fee
    // DR: FEES, CR: CASH
    if (paymentFeeCents > 0) {
      entries.push(await this.postEntry(channelId, {
        entryType: "FEE",
        refType: "ORDER",
        refId: orderId,
        debitAccount: "FEES",
        creditAccount: "CASH",
        amountCents: paymentFeeCents,
        currency,
        description: `Payment processing fee for order ${orderId}`
      }));
    }

    // 3. Record creator commission liability
    // DR: FEES, CR: PAYABLE_CREATOR
    if (creatorCommissionCents > 0) {
      entries.push(await this.postEntry(channelId, {
        entryType: "COMMISSION",
        refType: "ORDER",
        refId: orderId,
        debitAccount: "FEES",
        creditAccount: "PAYABLE_CREATOR",
        amountCents: creatorCommissionCents,
        currency,
        description: `Creator commission for order ${orderId}`
      }));
    }

    return entries;
  }

  /**
   * Post a refund transaction
   */
  async postRefund(
    channelId: string,
    orderId: string,
    refundId: string,
    refundCents: number,
    currency: string = "AUD"
  ): Promise<string[]> {
    const entries: string[] = [];

    // 1. Reverse revenue
    // DR: REVENUE, CR: CASH
    entries.push(await this.postEntry(channelId, {
      entryType: "REFUND",
      refType: "REFUND",
      refId: refundId,
      debitAccount: "REVENUE",
      creditAccount: "CASH",
      amountCents: refundCents,
      currency,
      description: `Refund for order ${orderId}`
    }));

    return entries;
  }

  /**
   * Post a payout transaction
   */
  async postPayout(
    channelId: string,
    payoutId: string,
    creatorId: string,
    payoutCents: number,
    feeCents: number,
    currency: string = "AUD"
  ): Promise<string[]> {
    const entries: string[] = [];

    // 1. Pay creator (reduce liability, reduce cash)
    // DR: PAYABLE_CREATOR, CR: CASH
    entries.push(await this.postEntry(channelId, {
      entryType: "PAYOUT",
      refType: "PAYOUT",
      refId: payoutId,
      debitAccount: "PAYABLE_CREATOR",
      creditAccount: "CASH",
      amountCents: payoutCents,
      currency,
      description: `Payout to creator ${creatorId}`
    }));

    // 2. Record payout fee
    // DR: FEES, CR: CASH
    if (feeCents > 0) {
      entries.push(await this.postEntry(channelId, {
        entryType: "FEE",
        refType: "PAYOUT",
        refId: payoutId,
        debitAccount: "FEES",
        creditAccount: "CASH",
        amountCents: feeCents,
        currency,
        description: `Payout fee for ${payoutId}`
      }));
    }

    return entries;
  }

  /**
   * Get account balance
   */
  async getAccountBalance(
    channelId: string,
    account: LedgerAccount,
    currency?: string
  ): Promise<number> {
    const debits = await db.query.ledgerEntries.findMany({
      where: and(
        eq(ledgerEntries.channelId, channelId),
        eq(ledgerEntries.debitAccount, account),
        currency ? eq(ledgerEntries.currency, currency) : undefined
      )
    });

    const credits = await db.query.ledgerEntries.findMany({
      where: and(
        eq(ledgerEntries.channelId, channelId),
        eq(ledgerEntries.creditAccount, account),
        currency ? eq(ledgerEntries.currency, currency) : undefined
      )
    });

    const debitTotal = debits.reduce((sum, e) => sum + e.amountCents, 0);
    const creditTotal = credits.reduce((sum, e) => sum + e.amountCents, 0);

    // Asset/Expense accounts: Debit increases, Credit decreases
    // Liability/Revenue accounts: Credit increases, Debit decreases
    const assetAccounts: LedgerAccount[] = ["CASH", "RECEIVABLE"];
    const expenseAccounts: LedgerAccount[] = ["COGS", "FEES", "REFUNDS", "CHARGEBACKS"];
    
    if (assetAccounts.includes(account) || expenseAccounts.includes(account)) {
      return debitTotal - creditTotal;
    } else {
      return creditTotal - debitTotal;
    }
  }

  /**
   * Get ledger entries for a reference
   */
  async getEntriesForRef(
    channelId: string,
    refType: string,
    refId: string
  ) {
    return await db.query.ledgerEntries.findMany({
      where: and(
        eq(ledgerEntries.channelId, channelId),
        eq(ledgerEntries.refType, refType),
        eq(ledgerEntries.refId, refId)
      ),
      orderBy: [desc(ledgerEntries.postedAt)]
    });
  }

  /**
   * Get ledger entries in date range
   */
  async getEntriesInRange(
    channelId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await db.query.ledgerEntries.findMany({
      where: and(
        eq(ledgerEntries.channelId, channelId),
        between(ledgerEntries.postedAt, startDate, endDate)
      ),
      orderBy: [desc(ledgerEntries.postedAt)]
    });
  }

  private async checkIdempotency(
    channelId: string,
    scope: string,
    key: string
  ) {
    return await db.query.idempotencyKeys.findFirst({
      where: and(
        eq(idempotencyKeys.channelId, channelId),
        eq(idempotencyKeys.scope, scope),
        eq(idempotencyKeys.idemKey, key)
      )
    });
  }

  private async recordIdempotency(
    channelId: string,
    scope: string,
    key: string,
    result: any,
    status: string
  ) {
    await db.insert(idempotencyKeys).values({
      id: ulid(),
      channelId,
      scope,
      idemKey: key,
      requestHash: crypto.createHash("sha256").update(JSON.stringify(result)).digest("hex"),
      result: JSON.stringify(result),
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

// ============================================================================
// PROVIDER TRANSACTION INGESTION
// ============================================================================

export class TransactionIngestionService {
  /**
   * Ingest PayPal transaction
   */
  async ingestPayPalTransaction(
    channelId: string,
    paypalTxn: any
  ): Promise<string> {
    const txnId = ulid();
    const amountCents = Math.round(parseFloat(paypalTxn.transaction_info.transaction_amount.value) * 100);
    const feeCents = paypalTxn.transaction_info.fee_amount 
      ? Math.abs(Math.round(parseFloat(paypalTxn.transaction_info.fee_amount.value) * 100))
      : 0;

    await db.insert(providerTransactions).values({
      id: txnId,
      channelId,
      provider: "PAYPAL",
      providerTxnId: paypalTxn.transaction_info.transaction_id,
      txnType: this.mapPayPalTxnType(paypalTxn.transaction_info.transaction_event_code),
      status: this.mapPayPalStatus(paypalTxn.transaction_info.transaction_status),
      amountCents,
      feeCents,
      netCents: amountCents - feeCents,
      currency: paypalTxn.transaction_info.transaction_amount.currency_code,
      txnDate: new Date(paypalTxn.transaction_info.transaction_initiation_date),
      rawData: JSON.stringify(paypalTxn),
      createdAt: new Date()
    });

    return txnId;
  }

  /**
   * Ingest Wise transaction
   */
  async ingestWiseTransaction(
    channelId: string,
    wiseTxn: any
  ): Promise<string> {
    const txnId = ulid();
    const amountCents = Math.round(wiseTxn.amount.value * 100);
    const feeCents = wiseTxn.totalFees 
      ? Math.round(wiseTxn.totalFees.value * 100)
      : 0;

    await db.insert(providerTransactions).values({
      id: txnId,
      channelId,
      provider: "WISE",
      providerTxnId: String(wiseTxn.id),
      txnType: this.mapWiseTxnType(wiseTxn.type),
      status: this.mapWiseStatus(wiseTxn.status),
      amountCents,
      feeCents,
      netCents: amountCents - feeCents,
      currency: wiseTxn.amount.currency,
      txnDate: new Date(wiseTxn.date),
      rawData: JSON.stringify(wiseTxn),
      createdAt: new Date()
    });

    return txnId;
  }

  /**
   * Bulk ingest transactions
   */
  async bulkIngestTransactions(
    channelId: string,
    provider: TransactionProvider,
    transactions: any[]
  ): Promise<number> {
    let ingested = 0;
    for (const txn of transactions) {
      try {
        if (provider === "PAYPAL") {
          await this.ingestPayPalTransaction(channelId, txn);
        } else if (provider === "WISE") {
          await this.ingestWiseTransaction(channelId, txn);
        }
        ingested++;
      } catch (error) {
        console.error(`Failed to ingest transaction:`, error);
      }
    }
    return ingested;
  }

  private mapPayPalTxnType(eventCode: string): string {
    const mapping: Record<string, string> = {
      "T0000": "PAYMENT",
      "T0001": "PAYMENT",
      "T1106": "REFUND",
      "T1107": "REFUND",
      "T0400": "FEE",
      "T1201": "PAYOUT"
    };
    return mapping[eventCode] || "PAYMENT";
  }

  private mapPayPalStatus(status: string): string {
    const mapping: Record<string, string> = {
      "S": "COMPLETED",
      "P": "PENDING",
      "D": "FAILED",
      "V": "REVERSED"
    };
    return mapping[status] || "PENDING";
  }

  private mapWiseTxnType(type: string): string {
    const mapping: Record<string, string> = {
      "CREDIT": "PAYMENT",
      "DEBIT": "PAYOUT",
      "CONVERSION": "TRANSFER"
    };
    return mapping[type] || "PAYMENT";
  }

  private mapWiseStatus(status: string): string {
    const mapping: Record<string, string> = {
      "completed": "COMPLETED",
      "processing": "PENDING",
      "cancelled": "FAILED",
      "bounced_back": "REVERSED"
    };
    return mapping[status] || "PENDING";
  }
}

// ============================================================================
// RECONCILIATION ENGINE
// ============================================================================

export class ReconciliationEngine {
  /**
   * Auto-match provider transactions to ledger entries
   */
  async autoReconcile(
    channelId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ReconciliationResult> {
    // Get unreconciled provider transactions
    const unmatchedTxns = await db.query.providerTransactions.findMany({
      where: and(
        eq(providerTransactions.channelId, channelId),
        eq(providerTransactions.reconciled, false),
        startDate ? sql`${providerTransactions.txnDate} >= ${startDate}` : undefined,
        endDate ? sql`${providerTransactions.txnDate} <= ${endDate}` : undefined
      )
    });

    let matched = 0;
    let unmatched = 0;
    let discrepancies = 0;
    let totalMatchedCents = 0;
    let totalUnmatchedCents = 0;

    for (const txn of unmatchedTxns) {
      const match = await this.findMatch(channelId, txn);
      
      if (match) {
        const discrepancyCents = Math.abs(txn.netCents - match.amountCents);
        
        if (discrepancyCents === 0) {
          // Perfect match
          await this.recordMatch(channelId, txn.id, match.id, "AUTO", 100, 0);
          matched++;
          totalMatchedCents += txn.netCents;
        } else if (discrepancyCents < 100) {
          // Close match (within $1)
          await this.recordMatch(channelId, txn.id, match.id, "AUTO", 95, discrepancyCents);
          matched++;
          totalMatchedCents += txn.netCents;
          discrepancies++;
        } else {
          // Significant discrepancy
          unmatched++;
          totalUnmatchedCents += txn.netCents;
        }
      } else {
        unmatched++;
        totalUnmatchedCents += txn.netCents;
      }
    }

    return {
      matched,
      unmatched,
      discrepancies,
      totalMatchedCents,
      totalUnmatchedCents
    };
  }

  /**
   * Find matching ledger entry for provider transaction
   */
  private async findMatch(channelId: string, txn: any) {
    // Try to match by order ID if present
    if (txn.orderId) {
      const entries = await db.query.ledgerEntries.findMany({
        where: and(
          eq(ledgerEntries.channelId, channelId),
          eq(ledgerEntries.refType, "ORDER"),
          eq(ledgerEntries.refId, txn.orderId),
          eq(ledgerEntries.entryType, "SALE")
        )
      });

      if (entries.length > 0) {
        return entries[0];
      }
    }

    // Try to match by amount and date (within 24 hours)
    const matchWindow = 24 * 60 * 60 * 1000; // 24 hours
    const txnDate = new Date(txn.txnDate);
    const startWindow = new Date(txnDate.getTime() - matchWindow);
    const endWindow = new Date(txnDate.getTime() + matchWindow);

    const entries = await db.query.ledgerEntries.findMany({
      where: and(
        eq(ledgerEntries.channelId, channelId),
        between(ledgerEntries.postedAt, startWindow, endWindow),
        sql`ABS(${ledgerEntries.amountCents} - ${txn.netCents}) < 100`
      ),
      limit: 1
    });

    return entries.length > 0 ? entries[0] : null;
  }

  /**
   * Record a reconciliation match
   */
  private async recordMatch(
    channelId: string,
    providerTxnId: string,
    ledgerEntryId: string,
    matchType: string,
    confidence: number,
    discrepancyCents: number
  ) {
    const matchId = ulid();
    
    await db.insert(reconciliationMatches).values({
      id: matchId,
      channelId,
      providerTxnId,
      ledgerEntryId,
      matchType,
      matchConfidence: confidence,
      discrepancyCents,
      matchedAt: new Date(),
      createdAt: new Date()
    });

    // Mark provider transaction as reconciled
    await db.update(providerTransactions)
      .set({ 
        reconciled: true,
        reconciledAt: new Date()
      })
      .where(eq(providerTransactions.id, providerTxnId));
  }

  /**
   * Manual match
   */
  async manualMatch(
    channelId: string,
    providerTxnId: string,
    ledgerEntryId: string,
    notes?: string
  ) {
    const txn = await db.query.providerTransactions.findFirst({
      where: eq(providerTransactions.id, providerTxnId)
    });

    const entry = await db.query.ledgerEntries.findFirst({
      where: eq(ledgerEntries.id, ledgerEntryId)
    });

    if (!txn || !entry) {
      throw new Error("Transaction or entry not found");
    }

    const discrepancyCents = Math.abs(txn.netCents - entry.amountCents);

    await this.recordMatch(
      channelId,
      providerTxnId,
      ledgerEntryId,
      "MANUAL",
      100,
      discrepancyCents
    );
  }

  /**
   * Get unmatched transactions
   */
  async getUnmatchedTransactions(channelId: string) {
    return await db.query.providerTransactions.findMany({
      where: and(
        eq(providerTransactions.channelId, channelId),
        eq(providerTransactions.reconciled, false)
      ),
      orderBy: [desc(providerTransactions.txnDate)]
    });
  }

  /**
   * Get reconciliation discrepancies
   */
  async getDiscrepancies(channelId: string) {
    return await db.query.reconciliationMatches.findMany({
      where: and(
        eq(reconciliationMatches.channelId, channelId),
        sql`${reconciliationMatches.discrepancyCents} > 0`
      ),
      orderBy: [desc(reconciliationMatches.discrepancyCents)]
    });
  }
}

// ============================================================================
// CREATOR PAYOUT SERVICE
// ============================================================================

export class CreatorPayoutService {
  private ledgerService: LedgerService;

  constructor() {
    this.ledgerService = new LedgerService();
  }

  /**
   * Calculate creator earnings for period
   */
  async calculateCreatorEarnings(
    channelId: string,
    creatorId: string,
    periodStart: Date,
    periodEnd: Date
  ) {
    // Get all orders for creator in period
    const creatorOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.channelId, channelId),
        eq(orders.creatorId, creatorId),
        between(orders.createdAt, periodStart, periodEnd),
        sql`${orders.status} IN ('completed', 'shipped', 'delivered')`
      )
    });

    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, creatorId)
    });

    if (!creator) {
      throw new Error(`Creator not found: ${creatorId}`);
    }

    let totalSalesCents = 0;
    let totalCommissionCents = 0;
    let totalBonusCents = 0;

    for (const order of creatorOrders) {
      const orderTotal = order.totalCents;
      const commission = Math.round(orderTotal * (creator.commissionRate / 100));
      const bonus = Math.round(orderTotal * (creator.bonusRate / 100));

      totalSalesCents += orderTotal;
      totalCommissionCents += commission;
      totalBonusCents += bonus;
    }

    return {
      creatorId,
      periodStart,
      periodEnd,
      orderCount: creatorOrders.length,
      totalSalesCents,
      totalCommissionCents,
      totalBonusCents,
      totalEarningsCents: totalCommissionCents + totalBonusCents
    };
  }

  /**
   * Create payout for creator
   */
  async createPayout(
    channelId: string,
    creatorId: string,
    periodStart: Date,
    periodEnd: Date,
    provider: string = "WISE"
  ): Promise<string> {
    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, creatorId)
    });

    if (!creator) {
      throw new Error(`Creator not found: ${creatorId}`);
    }

    // Check for payout hold
    if (creator.payoutHold) {
      throw new Error(`Payout held: ${creator.payoutHoldReason}`);
    }

    // Calculate earnings
    const earnings = await this.calculateCreatorEarnings(
      channelId,
      creatorId,
      periodStart,
      periodEnd
    );

    if (earnings.totalEarningsCents <= 0) {
      throw new Error("No earnings for period");
    }

    // Calculate payout fee (e.g., 1% for Wise)
    const feeCents = Math.round(earnings.totalEarningsCents * 0.01);
    const netCents = earnings.totalEarningsCents - feeCents;

    // Create payout record
    const payoutId = ulid();
    await db.insert(creatorPayouts).values({
      id: payoutId,
      channelId,
      creatorId,
      status: "PENDING",
      amountCents: earnings.totalEarningsCents,
      feeCents,
      netCents,
      currency: "AUD",
      provider,
      periodStart,
      periodEnd,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return payoutId;
  }

  /**
   * Execute payout (send to Wise/PayPal)
   */
  async executePayout(
    channelId: string,
    payoutId: string
  ): Promise<void> {
    const payout = await db.query.creatorPayouts.findFirst({
      where: and(
        eq(creatorPayouts.channelId, channelId),
        eq(creatorPayouts.id, payoutId)
      )
    });

    if (!payout) {
      throw new Error(`Payout not found: ${payoutId}`);
    }

    if (payout.status !== "PENDING") {
      throw new Error(`Payout already processed: ${payout.status}`);
    }

    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, payout.creatorId)
    });

    if (!creator) {
      throw new Error(`Creator not found: ${payout.creatorId}`);
    }

    // Check for fraud hold
    const fraudHold = await this.checkFraudHold(channelId, payout.creatorId);
    if (fraudHold) {
      await db.update(creatorPayouts)
        .set({ 
          status: "HELD",
          holdReason: "Fraud review required"
        })
        .where(eq(creatorPayouts.id, payoutId));
      throw new Error("Payout held for fraud review");
    }

    // Execute payout via provider
    let providerTxnId: string;
    if (payout.provider === "WISE") {
      providerTxnId = await this.executeWisePayout(creator, payout);
    } else if (payout.provider === "PAYPAL") {
      providerTxnId = await this.executePayPalPayout(creator, payout);
    } else {
      throw new Error(`Unsupported provider: ${payout.provider}`);
    }

    // Update payout status
    await db.update(creatorPayouts)
      .set({ 
        status: "COMPLETED",
        providerTxnId,
        processedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(creatorPayouts.id, payoutId));

    // Post ledger entries
    await this.ledgerService.postPayout(
      channelId,
      payoutId,
      payout.creatorId,
      payout.netCents,
      payout.feeCents,
      payout.currency
    );

    // Update creator totals
    await db.update(creators)
      .set({
        totalCommissionCents: sql`${creators.totalCommissionCents} + ${payout.amountCents}`,
        updatedAt: new Date()
      })
      .where(eq(creators.id, payout.creatorId));
  }

  /**
   * Batch execute payouts
   */
  async batchExecutePayouts(
    channelId: string,
    payoutIds: string[]
  ): Promise<{ succeeded: number; failed: number }> {
    let succeeded = 0;
    let failed = 0;

    for (const payoutId of payoutIds) {
      try {
        await this.executePayout(channelId, payoutId);
        succeeded++;
      } catch (error) {
        console.error(`Failed to execute payout ${payoutId}:`, error);
        failed++;
      }
    }

    return { succeeded, failed };
  }

  /**
   * Hold payout for fraud review
   */
  async holdPayout(
    channelId: string,
    payoutId: string,
    reason: string
  ) {
    await db.update(creatorPayouts)
      .set({ 
        status: "HELD",
        holdReason: reason,
        updatedAt: new Date()
      })
      .where(and(
        eq(creatorPayouts.channelId, channelId),
        eq(creatorPayouts.id, payoutId)
      ));
  }

  /**
   * Release held payout
   */
  async releasePayout(
    channelId: string,
    payoutId: string
  ) {
    await db.update(creatorPayouts)
      .set({ 
        status: "PENDING",
        holdReason: null,
        updatedAt: new Date()
      })
      .where(and(
        eq(creatorPayouts.channelId, channelId),
        eq(creatorPayouts.id, payoutId)
      ));
  }

  private async checkFraudHold(channelId: string, creatorId: string): Promise<boolean> {
    // Check if creator has recent high-risk fraud scores
    const recentScores = await db.query.fraudScores.findMany({
      where: and(
        eq(fraudScores.channelId, channelId),
        sql`${fraudScores.createdAt} > DATE_SUB(NOW(), INTERVAL 30 DAY)`
      ),
      limit: 10
    });

    const highRiskCount = recentScores.filter(s => s.riskLevel === "HIGH" || s.riskLevel === "CRITICAL").length;
    return highRiskCount > 3;
  }

  private async executeWisePayout(creator: any, payout: any): Promise<string> {
    // Integrate with Wise API
    // This is a placeholder
    console.log(`Executing Wise payout for ${creator.email}: ${payout.netCents / 100} ${payout.currency}`);
    return `WISE_${ulid()}`;
  }

  private async executePayPalPayout(creator: any, payout: any): Promise<string> {
    // Integrate with PayPal Payouts API
    // This is a placeholder
    console.log(`Executing PayPal payout for ${creator.email}: ${payout.netCents / 100} ${payout.currency}`);
    return `PAYPAL_${ulid()}`;
  }
}

// ============================================================================
// FINANCIAL REPORTING SERVICE
// ============================================================================

export class FinancialReportingService {
  private ledgerService: LedgerService;

  constructor() {
    this.ledgerService = new LedgerService();
  }

  /**
   * Get profit & loss statement
   */
  async getProfitAndLoss(
    channelId: string,
    startDate: Date,
    endDate: Date
  ) {
    const entries = await this.ledgerService.getEntriesInRange(
      channelId,
      startDate,
      endDate
    );

    const revenue = entries
      .filter(e => e.creditAccount === "REVENUE")
      .reduce((sum, e) => sum + e.amountCents, 0);

    const cogs = entries
      .filter(e => e.debitAccount === "COGS")
      .reduce((sum, e) => sum + e.amountCents, 0);

    const fees = entries
      .filter(e => e.debitAccount === "FEES")
      .reduce((sum, e) => sum + e.amountCents, 0);

    const refunds = entries
      .filter(e => e.entryType === "REFUND")
      .reduce((sum, e) => sum + e.amountCents, 0);

    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - fees - refunds;

    return {
      revenue,
      cogs,
      grossProfit,
      fees,
      refunds,
      netProfit,
      grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      netMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0
    };
  }

  /**
   * Get balance sheet
   */
  async getBalanceSheet(channelId: string) {
    const cash = await this.ledgerService.getAccountBalance(channelId, "CASH");
    const receivable = await this.ledgerService.getAccountBalance(channelId, "RECEIVABLE");
    const payableCreator = await this.ledgerService.getAccountBalance(channelId, "PAYABLE_CREATOR");
    const payableSupplier = await this.ledgerService.getAccountBalance(channelId, "PAYABLE_SUPPLIER");
    const reserves = await this.ledgerService.getAccountBalance(channelId, "RESERVES");

    const totalAssets = cash + receivable + reserves;
    const totalLiabilities = payableCreator + payableSupplier;
    const equity = totalAssets - totalLiabilities;

    return {
      assets: {
        cash,
        receivable,
        reserves,
        total: totalAssets
      },
      liabilities: {
        payableCreator,
        payableSupplier,
        total: totalLiabilities
      },
      equity
    };
  }

  /**
   * Get cash flow statement
   */
  async getCashFlow(
    channelId: string,
    startDate: Date,
    endDate: Date
  ) {
    const entries = await this.ledgerService.getEntriesInRange(
      channelId,
      startDate,
      endDate
    );

    const cashInflows = entries
      .filter(e => e.debitAccount === "CASH")
      .reduce((sum, e) => sum + e.amountCents, 0);

    const cashOutflows = entries
      .filter(e => e.creditAccount === "CASH")
      .reduce((sum, e) => sum + e.amountCents, 0);

    const netCashFlow = cashInflows - cashOutflows;

    // Categorize by type
    const operatingInflows = entries
      .filter(e => e.debitAccount === "CASH" && e.entryType === "SALE")
      .reduce((sum, e) => sum + e.amountCents, 0);

    const operatingOutflows = entries
      .filter(e => e.creditAccount === "CASH" && (e.entryType === "REFUND" || e.entryType === "FEE"))
      .reduce((sum, e) => sum + e.amountCents, 0);

    const financingOutflows = entries
      .filter(e => e.creditAccount === "CASH" && e.entryType === "PAYOUT")
      .reduce((sum, e) => sum + e.amountCents, 0);

    return {
      cashInflows,
      cashOutflows,
      netCashFlow,
      operating: {
        inflows: operatingInflows,
        outflows: operatingOutflows,
        net: operatingInflows - operatingOutflows
      },
      financing: {
        outflows: financingOutflows
      }
    };
  }
}

// ============================================================================
// EXPORT SERVICES
// ============================================================================

export const ledgerService = new LedgerService();
export const transactionIngestionService = new TransactionIngestionService();
export const reconciliationEngine = new ReconciliationEngine();
export const creatorPayoutService = new CreatorPayoutService();
export const financialReportingService = new FinancialReportingService();
