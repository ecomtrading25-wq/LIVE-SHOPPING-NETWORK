import { nanoid } from "nanoid";
import { getDb } from "./db";
import {
  settlements,
  settlementLines,
  orders,
  orderRefunds,
  disputes,
  reviewQueueItems,
  auditLog,
} from "../drizzle/schema";
import { eq, and, sql, gte, lte, desc } from "drizzle-orm";

/**
 * Live Shopping Network - Payment Reconciliation Engine
 * Automated settlement matching and discrepancy detection
 */

export interface SettlementImport {
  channelId: string;
  platform: string;
  settlementId: string;
  settlementDate: Date;
  totalAmount: string;
  currency: string;
  lines: SettlementLine[];
  rawData: any;
}

export interface SettlementLine {
  type: "sale" | "refund" | "fee" | "adjustment" | "chargeback";
  orderId?: string;
  platformOrderId?: string;
  amount: string;
  description?: string;
  metadata?: any;
}

export interface ReconciliationResult {
  settlementId: string;
  status: "reconciled" | "discrepancy" | "pending";
  matched: number;
  unmatched: number;
  discrepancies: Discrepancy[];
  summary: {
    expectedAmount: string;
    actualAmount: string;
    difference: string;
  };
}

export interface Discrepancy {
  type: "missing_order" | "amount_mismatch" | "unexpected_charge" | "missing_settlement";
  severity: "low" | "medium" | "high" | "critical";
  orderId?: string;
  expectedAmount?: string;
  actualAmount?: string;
  description: string;
}

/**
 * Reconciliation Service
 */
export class ReconciliationService {
  /**
   * Import settlement from platform
   */
  static async importSettlement(data: SettlementImport): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const settlementId = nanoid();

    // Create settlement record
    await db.insert(settlements).values({
      id: settlementId,
      channelId: data.channelId,
      platform: data.platform,
      settlementId: data.settlementId,
      settlementDate: data.settlementDate,
      totalAmount: data.totalAmount,
      currency: data.currency,
      status: "pending",
      rawData: data.rawData,
    });

    // Create settlement lines
    for (const line of data.lines) {
      await db.insert(settlementLines).values({
        id: nanoid(),
        settlementId,
        lineType: line.type,
        orderId: line.orderId,
        amount: line.amount,
        description: line.description,
        metadata: {
          ...line.metadata,
          platformOrderId: line.platformOrderId,
        },
      });
    }

    // Log import
    await db.insert(auditLog).values({
      id: nanoid(),
      channelId: data.channelId,
      actorType: "system",
      actorId: "reconciliation",
      actorLabel: "Reconciliation Service",
      action: "settlement_imported",
      severity: "info",
      refType: "settlement",
      refId: settlementId,
      entryHash: nanoid(), // Simplified hash for now
      metadata: {
        platform: data.platform,
        totalAmount: data.totalAmount,
        lineCount: data.lines.length,
      },
    });

    return settlementId;
  }

  /**
   * Reconcile settlement against internal records
   */
  static async reconcileSettlement(settlementId: string): Promise<ReconciliationResult> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get settlement
    const [settlement] = await db.select().from(settlements).where(eq(settlements.id, settlementId)).limit(1);

    if (!settlement) {
      throw new Error("Settlement not found");
    }

    // Get settlement lines
    const lines = await db.select().from(settlementLines).where(eq(settlementLines.settlementId, settlementId));

    const discrepancies: Discrepancy[] = [];
    let matched = 0;
    let unmatched = 0;

    // Reconcile each line
    for (const line of lines) {
      try {
        const result = await this.reconcileLine(line);
        if (result.matched) {
          matched++;
        } else {
          unmatched++;
          if (result.discrepancy) {
            discrepancies.push(result.discrepancy);
          }
        }
      } catch (error) {
        unmatched++;
        discrepancies.push({
          type: "unexpected_charge",
          severity: "high",
          description: `Failed to reconcile line: ${error}`,
        });
      }
    }

    // Calculate expected vs actual amounts
    const expectedAmount = await this.calculateExpectedAmount(settlement, lines);
    const actualAmount = parseFloat(settlement.totalAmount);
    const difference = (actualAmount - expectedAmount).toFixed(2);

    // Determine status
    let status: "reconciled" | "discrepancy" | "pending" = "reconciled";
    if (Math.abs(parseFloat(difference)) > 0.01) {
      status = "discrepancy";
      discrepancies.push({
        type: "amount_mismatch",
        severity: "critical",
        expectedAmount: expectedAmount.toFixed(2),
        actualAmount: actualAmount.toFixed(2),
        description: `Settlement total mismatch: expected ${expectedAmount.toFixed(2)}, got ${actualAmount.toFixed(2)}`,
      });
    } else if (unmatched > 0) {
      status = "discrepancy";
    }

    // Update settlement status
    const existingRawData = (settlement.rawData as any) || {};
    await db
      .update(settlements)
      .set({
        status: status === "reconciled" ? "reconciled" : "discrepancy",
        rawData: {
          ...existingRawData,
          reconciliation: {
            matched,
            unmatched,
            discrepancyCount: discrepancies.length,
            reconciledAt: status === "reconciled" ? new Date().toISOString() : undefined,
          },
        },
      })
      .where(eq(settlements.id, settlementId));

    // Create review queue items for discrepancies
    if (discrepancies.length > 0) {
      for (const discrepancy of discrepancies) {
      await db.insert(reviewQueueItems).values({
        id: nanoid(),
        channelId: settlement.channelId,
        type: "settlement_discrepancy",
        severity: discrepancy.severity,
        status: "open",
        refType: "settlement",
        refId: settlementId,
        title: `Settlement Discrepancy: ${discrepancy.type}`,
        summary: discrepancy.description,
        metadata: {
          settlementId,
          discrepancy,
        },
      });
      }
    }

    // Log reconciliation
    await db.insert(auditLog).values({
      id: nanoid(),
      channelId: settlement.channelId,
      actorType: "system",
      actorId: "reconciliation",
      actorLabel: "Reconciliation Service",
      action: "settlement_reconciled",
      severity: status === "reconciled" ? "info" : "warning",
      refType: "settlement",
      refId: settlementId,
      entryHash: nanoid(), // Simplified hash for now
      metadata: {
        status,
        matched,
        unmatched,
        discrepancyCount: discrepancies.length,
      },
    });

    return {
      settlementId,
      status,
      matched,
      unmatched,
      discrepancies,
      summary: {
        expectedAmount: expectedAmount.toFixed(2),
        actualAmount: actualAmount.toFixed(2),
        difference,
      },
    };
  }

  /**
   * Reconcile a single settlement line
   */
  private static async reconcileLine(
    line: any
  ): Promise<{ matched: boolean; discrepancy?: Discrepancy }> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    switch (line.lineType) {
      case "sale": {
        // Find matching order
        if (!line.platformOrderId) {
          return {
            matched: false,
            discrepancy: {
              type: "missing_order",
              severity: "high",
              description: `Sale line without platform order ID`,
            },
          };
        }

        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.platformOrderId, line.platformOrderId))
          .limit(1);

        if (!order) {
          return {
            matched: false,
            discrepancy: {
              type: "missing_order",
              severity: "high",
              description: `Order not found: ${line.platformOrderId}`,
            },
          };
        }

        // Check amount matches
        const expectedAmount = parseFloat(order.total);
        const actualAmount = parseFloat(line.amount);

        if (Math.abs(expectedAmount - actualAmount) > 0.01) {
          return {
            matched: false,
            discrepancy: {
              type: "amount_mismatch",
              severity: "medium",
              orderId: order.id,
              expectedAmount: expectedAmount.toFixed(2),
              actualAmount: actualAmount.toFixed(2),
              description: `Order ${order.orderNumber}: expected ${expectedAmount.toFixed(2)}, got ${actualAmount.toFixed(2)}`,
            },
          };
        }

        return { matched: true };
      }

      case "refund": {
        // Find matching refund
        if (!line.platformOrderId) {
          return {
            matched: false,
            discrepancy: {
              type: "missing_order",
              severity: "medium",
              description: `Refund line without platform order ID`,
            },
          };
        }

        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.platformOrderId, line.platformOrderId))
          .limit(1);

        if (!order) {
          return {
            matched: false,
            discrepancy: {
              type: "missing_order",
              severity: "medium",
              description: `Refund order not found: ${line.platformOrderId}`,
            },
          };
        }

        // Check if refund exists
        const refunds = await db.select().from(orderRefunds).where(eq(orderRefunds.orderId, order.id));

        if (refunds.length === 0) {
          return {
            matched: false,
            discrepancy: {
              type: "unexpected_charge",
              severity: "high",
              orderId: order.id,
              actualAmount: line.amount,
              description: `Unexpected refund for order ${order.orderNumber}`,
            },
          };
        }

        return { matched: true };
      }

      case "chargeback": {
        // Find matching dispute
        if (!line.platformOrderId) {
          return {
            matched: false,
            discrepancy: {
              type: "missing_order",
              severity: "critical",
              description: `Chargeback without platform order ID`,
            },
          };
        }

        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.platformOrderId, line.platformOrderId))
          .limit(1);

        if (!order) {
          return {
            matched: false,
            discrepancy: {
              type: "missing_order",
              severity: "critical",
              description: `Chargeback order not found: ${line.platformOrderId}`,
            },
          };
        }

        // Check if dispute exists
        const disputeRecords = await db.select().from(disputes).where(eq(disputes.orderId, order.id));

        if (disputeRecords.length === 0) {
          return {
            matched: false,
            discrepancy: {
              type: "unexpected_charge",
              severity: "critical",
              orderId: order.id,
              actualAmount: line.amount,
              description: `Unexpected chargeback for order ${order.orderNumber}`,
            },
          };
        }

        return { matched: true };
      }

      case "fee":
      case "adjustment": {
        // Fees and adjustments are expected, just log them
        return { matched: true };
      }

      default: {
        return {
          matched: false,
          discrepancy: {
            type: "unexpected_charge",
            severity: "medium",
            description: `Unknown line type: ${line.lineType}`,
          },
        };
      }
    }
  }

  /**
   * Calculate expected settlement amount from internal records
   */
  private static async calculateExpectedAmount(settlement: any, lines: any[]): Promise<number> {
    let total = 0;

    for (const line of lines) {
      const amount = parseFloat(line.amount);

      switch (line.lineType) {
        case "sale":
          total += amount;
          break;
        case "refund":
        case "chargeback":
        case "fee":
          total -= Math.abs(amount);
          break;
        case "adjustment":
          total += amount; // Can be positive or negative
          break;
      }
    }

    return total;
  }

  /**
   * Get reconciliation dashboard
   */
  static async getReconciliationDashboard(channelId?: string) {
    const db = await getDb();
    if (!db) return null;

    // Count settlements by status
    const reconciledCondition = channelId
      ? and(eq(settlements.status, "reconciled"), eq(settlements.channelId, channelId))
      : eq(settlements.status, "reconciled");

    const discrepancyCondition = channelId
      ? and(eq(settlements.status, "discrepancy"), eq(settlements.channelId, channelId))
      : eq(settlements.status, "discrepancy");

    const pendingCondition = channelId
      ? and(eq(settlements.status, "pending"), eq(settlements.channelId, channelId))
      : eq(settlements.status, "pending");

    const [reconciled] = await db
      .select({ count: sql<number>`count(*)` })
      .from(settlements)
      .where(reconciledCondition);

    const [discrepancy] = await db
      .select({ count: sql<number>`count(*)` })
      .from(settlements)
      .where(discrepancyCondition);

    const [pending] = await db
      .select({ count: sql<number>`count(*)` })
      .from(settlements)
      .where(pendingCondition);

    // Get recent discrepancies
    let discrepanciesQuery = db
      .select()
      .from(reviewQueueItems)
      .where(eq(reviewQueueItems.type, "settlement_discrepancy"))
      .orderBy(desc(reviewQueueItems.createdAt))
      .limit(10);

    if (channelId) {
      // Apply channel filter before orderBy
      discrepanciesQuery = db
        .select()
        .from(reviewQueueItems)
        .where(and(eq(reviewQueueItems.type, "settlement_discrepancy"), eq(reviewQueueItems.channelId, channelId)))
        .orderBy(desc(reviewQueueItems.createdAt))
        .limit(10);
    }

    const recentDiscrepancies = await discrepanciesQuery;

    return {
      reconciled: reconciled?.count || 0,
      discrepancy: discrepancy?.count || 0,
      pending: pending?.count || 0,
      recentDiscrepancies,
    };
  }

  /**
   * Auto-resolve simple discrepancies
   */
  static async autoResolveDiscrepancies(settlementId: string): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    let resolved = 0;

    // Get discrepancies for this settlement
    const discrepancies = await db
      .select()
      .from(reviewQueueItems)
      .where(
        and(
          eq(reviewQueueItems.type, "settlement_discrepancy"),
          eq(reviewQueueItems.status, "open"),
          sql`JSON_EXTRACT(metadata, '$.settlementId') = ${settlementId}`
        )
      );

    for (const item of discrepancies) {
      const metadata = item.metadata as any;
      const discrepancy = metadata?.discrepancy;

      if (!discrepancy) continue;

      // Auto-resolve low severity amount mismatches within tolerance
      if (
        discrepancy.type === "amount_mismatch" &&
        discrepancy.severity === "low" &&
        discrepancy.expectedAmount &&
        discrepancy.actualAmount
      ) {
        const diff = Math.abs(parseFloat(discrepancy.expectedAmount) - parseFloat(discrepancy.actualAmount));

        if (diff < 0.05) {
          // Within 5 cent tolerance
          await db
            .update(reviewQueueItems)
            .set({
              status: "resolved",
              metadata: {
                ...metadata,
                resolution: "Auto-resolved: amount within tolerance",
                resolvedAt: new Date().toISOString(),
              },
            })
            .where(eq(reviewQueueItems.id, item.id));

          resolved++;
        }
      }
    }

    return resolved;
  }
}
