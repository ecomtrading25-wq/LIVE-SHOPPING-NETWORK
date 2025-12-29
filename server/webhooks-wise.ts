/**
 * Wise (formerly TransferWise) Webhook Handlers
 * 
 * Handles Wise webhooks for:
 * - Transfer status updates
 * - Balance updates
 * - Recipient verification
 * - Payout completions
 */

import { db } from "./db.js";
import {
  wiseWebhookEvents,
  wiseTransfers,
  wiseRecipients,
  wiseBalances,
  creatorPayoutBatches,
  creatorPayoutLines,
} from "../drizzle/schema.js";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import crypto from "crypto";

// ============================================================================
// Webhook Signature Verification
// ============================================================================

export function verifyWiseWebhookSignature(
  payload: string,
  signature: string,
  publicKey: string
): boolean {
  // Wise uses RSA-SHA256 for webhook signatures
  // https://docs.wise.com/api-docs/guides/webhooks/signature-verification
  
  try {
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(payload);
    return verifier.verify(publicKey, signature, "base64");
  } catch (error) {
    console.error("Wise webhook signature verification failed:", error);
    return false;
  }
}

// ============================================================================
// Webhook Event Handlers
// ============================================================================

export class WiseWebhookHandler {
  /**
   * Main webhook handler - routes events to specific handlers
   */
  async handleWebhook(payload: any, signature?: string): Promise<void> {
    const eventType = payload.event_type;
    const eventId = payload.data?.resource?.id || nanoid();

    // Check for duplicate events
    const existing = await db.query.wiseWebhookEvents.findFirst({
      where: eq(wiseWebhookEvents.eventId, eventId),
    });

    if (existing) {
      console.log(`Duplicate Wise webhook event: ${eventId}`);
      return;
    }

    // Store webhook event
    await db.insert(wiseWebhookEvents).values({
      eventId,
      eventType,
      payload: payload as any,
      receivedAt: new Date(),
    });

    // Route to specific handler
    switch (eventType) {
      // Transfer events
      case "transfers#state-change":
        await this.handleTransferStateChange(payload);
        break;
      case "transfers#active-cases":
        await this.handleTransferActiveCases(payload);
        break;

      // Balance events
      case "balances#credit":
      case "balances#update":
        await this.handleBalanceUpdate(payload);
        break;

      default:
        console.log(`Unhandled Wise webhook event type: ${eventType}`);
    }
  }

  /**
   * Handle transfer state change event
   */
  private async handleTransferStateChange(payload: any): Promise<void> {
    const data = payload.data;
    const transferId = data.resource?.id;
    const currentState = data.current_state;
    const previousState = data.previous_state;

    if (!transferId) {
      console.error("Wise transfer state change missing transfer ID");
      return;
    }

    // Find transfer in our database
    const transfer = await db.query.wiseTransfers.findFirst({
      where: eq(wiseTransfers.transferId, transferId.toString()),
    });

    if (!transfer) {
      console.warn(`Wise transfer not found in database: ${transferId}`);
      return;
    }

    // Update transfer status
    await db
      .update(wiseTransfers)
      .set({
        status: this.mapWiseStatusToInternal(currentState),
        wiseStatus: currentState,
      })
      .where(eq(wiseTransfers.id, transfer.id));

    // Handle specific state transitions
    switch (currentState) {
      case "outgoing_payment_sent":
        await this.handleTransferCompleted(transfer);
        break;

      case "funds_refunded":
        await this.handleTransferRefunded(transfer);
        break;

      case "cancelled":
        await this.handleTransferCancelled(transfer);
        break;

      case "bounced_back":
        await this.handleTransferBouncedBack(transfer);
        break;
    }

    console.log(
      `Wise transfer ${transferId} state changed: ${previousState} → ${currentState}`
    );
  }

  /**
   * Handle transfer completed
   */
  private async handleTransferCompleted(transfer: any): Promise<void> {
    // If this transfer is part of a creator payout batch, update the payout line
    if (transfer.payoutLineId) {
      await db
        .update(creatorPayoutLines)
        .set({
          status: "COMPLETED",
          paidAt: new Date(),
        })
        .where(eq(creatorPayoutLines.id, transfer.payoutLineId));

      // Check if all lines in the batch are completed
      const batch = await db.query.creatorPayoutBatches.findFirst({
        where: eq(creatorPayoutBatches.id, transfer.payoutBatchId),
        with: {
          lines: true,
        },
      });

      if (batch) {
        const allCompleted = batch.lines.every(
          (line) => line.status === "COMPLETED" || line.status === "FAILED"
        );

        if (allCompleted) {
          await db
            .update(creatorPayoutBatches)
            .set({
              status: "COMPLETED",
              completedAt: new Date(),
            })
            .where(eq(creatorPayoutBatches.id, batch.id));
        }
      }
    }

    console.log(`Wise transfer completed: ${transfer.transferId}`);
  }

  /**
   * Handle transfer refunded
   */
  private async handleTransferRefunded(transfer: any): Promise<void> {
    // Update payout line if applicable
    if (transfer.payoutLineId) {
      await db
        .update(creatorPayoutLines)
        .set({
          status: "FAILED",
          failureReason: "Transfer refunded by Wise",
        })
        .where(eq(creatorPayoutLines.id, transfer.payoutLineId));
    }

    console.log(`Wise transfer refunded: ${transfer.transferId}`);
  }

  /**
   * Handle transfer cancelled
   */
  private async handleTransferCancelled(transfer: any): Promise<void> {
    // Update payout line if applicable
    if (transfer.payoutLineId) {
      await db
        .update(creatorPayoutLines)
        .set({
          status: "FAILED",
          failureReason: "Transfer cancelled",
        })
        .where(eq(creatorPayoutLines.id, transfer.payoutLineId));
    }

    console.log(`Wise transfer cancelled: ${transfer.transferId}`);
  }

  /**
   * Handle transfer bounced back
   */
  private async handleTransferBouncedBack(transfer: any): Promise<void> {
    // Update payout line if applicable
    if (transfer.payoutLineId) {
      await db
        .update(creatorPayoutLines)
        .set({
          status: "FAILED",
          failureReason: "Transfer bounced back - invalid recipient details",
        })
        .where(eq(creatorPayoutLines.id, transfer.payoutLineId));
    }

    console.log(`Wise transfer bounced back: ${transfer.transferId}`);
  }

  /**
   * Handle transfer active cases (issues requiring attention)
   */
  private async handleTransferActiveCases(payload: any): Promise<void> {
    const data = payload.data;
    const transferId = data.resource?.id;
    const activeCases = data.active_cases;

    if (!transferId || !activeCases || activeCases.length === 0) {
      return;
    }

    // Find transfer in our database
    const transfer = await db.query.wiseTransfers.findFirst({
      where: eq(wiseTransfers.transferId, transferId.toString()),
    });

    if (!transfer) {
      return;
    }

    // Log active cases for operator review
    console.warn(
      `Wise transfer ${transferId} has active cases requiring attention:`,
      activeCases
    );

    // Update transfer with issue flag
    await db
      .update(wiseTransfers)
      .set({
        status: "REQUIRES_ATTENTION",
      })
      .where(eq(wiseTransfers.id, transfer.id));
  }

  /**
   * Handle balance update event
   */
  private async handleBalanceUpdate(payload: any): Promise<void> {
    const data = payload.data;
    const balanceId = data.resource?.id;
    const amount = data.amount?.value;
    const currency = data.amount?.currency;

    if (!balanceId || amount === undefined) {
      return;
    }

    // Update or create balance record
    const existing = await db.query.wiseBalances.findFirst({
      where: eq(wiseBalances.balanceId, balanceId.toString()),
    });

    if (existing) {
      await db
        .update(wiseBalances)
        .set({
          amount: Math.round(amount * 100),
          lastUpdated: new Date(),
        })
        .where(eq(wiseBalances.id, existing.id));
    } else {
      await db.insert(wiseBalances).values({
        id: nanoid(),
        balanceId: balanceId.toString(),
        currency,
        amount: Math.round(amount * 100),
        lastUpdated: new Date(),
      });
    }

    console.log(`Wise balance updated: ${balanceId} - ${amount} ${currency}`);
  }

  /**
   * Map Wise status to internal status
   */
  private mapWiseStatusToInternal(wiseStatus: string): string {
    const statusMap: Record<string, string> = {
      incoming_payment_waiting: "PENDING",
      processing: "PROCESSING",
      funds_converted: "PROCESSING",
      outgoing_payment_sent: "COMPLETED",
      cancelled: "FAILED",
      funds_refunded: "FAILED",
      bounced_back: "FAILED",
      charged_back: "FAILED",
    };

    return statusMap[wiseStatus] || "PENDING";
  }
}

// Export singleton instance
export const wiseWebhookHandler = new WiseWebhookHandler();
