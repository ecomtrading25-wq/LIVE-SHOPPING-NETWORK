/**
 * Dispute Automation Service
 * Handles PayPal dispute lifecycle: OPEN → EVIDENCE_REQUIRED → EVIDENCE_BUILDING → EVIDENCE_READY → SUBMITTED → WON/LOST → CLOSED
 */

import { getDbSync } from './db';
const db = getDbSync();
import { disputes, disputeTimeline, evidencePacks, providerWebhookDedup, reviewQueueItems, escalations, orders } from '../drizzle/schema';
import { eq, and, desc, isNull, lt } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

// Dispute state machine states
export type DisputeStatus = 
  | 'OPEN' 
  | 'EVIDENCE_REQUIRED' 
  | 'EVIDENCE_BUILDING' 
  | 'EVIDENCE_READY' 
  | 'SUBMITTED' 
  | 'WON' 
  | 'LOST' 
  | 'CLOSED'
  | 'NEEDS_MANUAL'
  | 'DUPLICATE'
  | 'CANCELED';

export type DisputeProvider = 'PAYPAL' | 'STRIPE' | 'WISE';

export interface DisputeWebhookPayload {
  provider: DisputeProvider;
  eventId: string;
  caseId: string;
  status: string;
  reason?: string;
  amountCents: number;
  currency: string;
  evidenceDeadline?: Date;
  orderId?: string;
  metadata?: Record<string, any>;
}

export interface EvidencePack {
  trackingNumber?: string;
  carrierName?: string;
  deliveryDate?: Date;
  orderDetails: {
    orderId: string;
    orderDate: Date;
    items: Array<{
      sku: string;
      name: string;
      quantity: number;
      priceCents: number;
    }>;
    totalCents: number;
  };
  customerCommunication?: Array<{
    date: Date;
    channel: string;
    summary: string;
  }>;
  proofOfDelivery?: string; // S3 URL
  productImages?: string[]; // S3 URLs
  termsOfService?: string; // S3 URL
  refundPolicy?: string; // S3 URL
  additionalDocuments?: string[]; // S3 URLs
  narrative: string;
}

/**
 * Process incoming dispute webhook from payment provider
 */
export async function processDisputeWebhook(
  channelId: string,
  payload: DisputeWebhookPayload
): Promise<{ success: boolean; disputeId?: string; error?: string }> {
  try {
    // 1. Deduplication check
    const existingEvent = await db.query.providerWebhookDedup.findFirst({
      where: and(
        eq(providerWebhookDedup.channelId, channelId),
        eq(providerWebhookDedup.provider, payload.provider),
        eq(providerWebhookDedup.eventId, payload.eventId)
      )
    });

    if (existingEvent) {
      return { success: true, error: 'Duplicate event' };
    }

    // 2. Record webhook event
    await db.insert(providerWebhookDedup).values({
      channelId,
      provider: payload.provider,
      eventId: payload.eventId,
      receivedAt: new Date()
    });

    // 3. Find or create dispute
    let dispute = await db.query.disputes.findFirst({
      where: and(
        eq(disputes.channelId, channelId),
        eq(disputes.provider, payload.provider),
        eq(disputes.providerCaseId, payload.caseId)
      )
    });

    if (!dispute) {
      // Create new dispute
      const [newDispute] = await db.insert(disputes).values({
        channelId,
        provider: payload.provider,
        providerCaseId: payload.caseId,
        providerStatus: payload.status,
        orderId: payload.orderId || null,
        status: 'OPEN',
        reason: payload.reason || null,
        amountCents: payload.amountCents,
        currency: payload.currency,
        evidenceDeadline: payload.evidenceDeadline || null,
        lastProviderUpdateAt: new Date(),
        needsManual: false
      }).returning();

      dispute = newDispute;

      // Add timeline entry
      await addDisputeTimelineEntry(channelId, dispute.disputeId, 'DISPUTE_CREATED', 
        `Dispute created from ${payload.provider} webhook`, { payload });

      // Create review queue item for operator
      await createDisputeReviewItem(channelId, dispute.disputeId, payload);
    } else {
      // Update existing dispute
      await db.update(disputes)
        .set({
          providerStatus: payload.status,
          lastProviderUpdateAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(disputes.disputeId, dispute.disputeId));

      // Add timeline entry
      await addDisputeTimelineEntry(channelId, dispute.disputeId, 'STATUS_UPDATE',
        `Provider status updated to ${payload.status}`, { payload });
    }

    // 4. Trigger state machine transition
    await transitionDisputeState(channelId, dispute.disputeId, payload);

    return { success: true, disputeId: dispute.disputeId };
  } catch (error) {
    console.error('Error processing dispute webhook:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * State machine transition logic
 */
async function transitionDisputeState(
  channelId: string,
  disputeId: string,
  payload: DisputeWebhookPayload
): Promise<void> {
  const dispute = await db.query.disputes.findFirst({
    where: eq(disputes.disputeId, disputeId)
  });

  if (!dispute) throw new Error('Dispute not found');

  let newStatus: DisputeStatus = dispute.status as DisputeStatus;

  // Map provider status to internal status
  switch (payload.status.toUpperCase()) {
    case 'OPEN':
    case 'INQUIRY':
      newStatus = 'OPEN';
      break;
    case 'UNDER_REVIEW':
    case 'WAITING_FOR_SELLER_RESPONSE':
      newStatus = 'EVIDENCE_REQUIRED';
      break;
    case 'RESOLVED':
    case 'WON':
    case 'SELLER_FAVOR':
      newStatus = 'WON';
      break;
    case 'LOST':
    case 'BUYER_FAVOR':
      newStatus = 'LOST';
      break;
    case 'CLOSED':
      newStatus = 'CLOSED';
      break;
    case 'CANCELED':
    case 'CANCELLED':
      newStatus = 'CANCELED';
      break;
  }

  // Update dispute status
  if (newStatus !== dispute.status) {
    await db.update(disputes)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(disputes.disputeId, disputeId));

    await addDisputeTimelineEntry(channelId, disputeId, 'STATE_TRANSITION',
      `Status changed from ${dispute.status} to ${newStatus}`, { oldStatus: dispute.status, newStatus });
  }

  // Trigger automated actions based on new status
  if (newStatus === 'EVIDENCE_REQUIRED') {
    await triggerEvidenceBuilding(channelId, disputeId);
  } else if (newStatus === 'WON' || newStatus === 'LOST') {
    await handleDisputeResolution(channelId, disputeId, newStatus);
  }
}

/**
 * Trigger evidence building process
 */
async function triggerEvidenceBuilding(channelId: string, disputeId: string): Promise<void> {
  const dispute = await db.query.disputes.findFirst({
    where: eq(disputes.disputeId, disputeId),
    with: { order: true }
  });

  if (!dispute) return;

  // Update status to EVIDENCE_BUILDING
  await db.update(disputes)
    .set({ status: 'EVIDENCE_BUILDING', updatedAt: new Date() })
    .where(eq(disputes.disputeId, disputeId));

  await addDisputeTimelineEntry(channelId, disputeId, 'EVIDENCE_BUILDING_STARTED',
    'Automated evidence building started', {});

  // Build evidence pack automatically
  try {
    const evidencePack = await buildEvidencePack(channelId, disputeId);
    
    // Create evidence pack record
    const [pack] = await db.insert(evidencePacks).values({
      channelId,
      disputeId,
      trackingNumber: evidencePack.trackingNumber || null,
      carrierName: evidencePack.carrierName || null,
      deliveryDate: evidencePack.deliveryDate || null,
      orderDetails: evidencePack.orderDetails,
      customerCommunication: evidencePack.customerCommunication || [],
      proofOfDeliveryUrl: evidencePack.proofOfDelivery || null,
      productImageUrls: evidencePack.productImages || [],
      termsOfServiceUrl: evidencePack.termsOfService || null,
      refundPolicyUrl: evidencePack.refundPolicy || null,
      additionalDocumentUrls: evidencePack.additionalDocuments || [],
      narrative: evidencePack.narrative,
      status: 'READY'
    }).returning();

    // Link evidence pack to dispute
    await db.update(disputes)
      .set({ 
        evidencePackId: pack.evidencePackId,
        status: 'EVIDENCE_READY',
        updatedAt: new Date()
      })
      .where(eq(disputes.disputeId, disputeId));

    await addDisputeTimelineEntry(channelId, disputeId, 'EVIDENCE_PACK_READY',
      'Evidence pack built and ready for submission', { evidencePackId: pack.evidencePackId });

    // Auto-submit if deadline is approaching (within 24 hours)
    if (dispute.evidenceDeadline) {
      const hoursUntilDeadline = (dispute.evidenceDeadline.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilDeadline < 24) {
        await submitEvidenceToProvider(channelId, disputeId);
      }
    }
  } catch (error) {
    console.error('Error building evidence pack:', error);
    
    // Mark as needs manual intervention
    await db.update(disputes)
      .set({ 
        needsManual: true,
        status: 'NEEDS_MANUAL',
        lastError: String(error),
        updatedAt: new Date()
      })
      .where(eq(disputes.disputeId, disputeId));

    await addDisputeTimelineEntry(channelId, disputeId, 'ERROR',
      'Error building evidence pack - manual intervention required', { error: String(error) });

    // Create escalation
    await createEscalation(channelId, disputeId, 'EVIDENCE_BUILD_FAILED', String(error));
  }
}

/**
 * Build evidence pack from order data
 */
async function buildEvidencePack(channelId: string, disputeId: string): Promise<EvidencePack> {
  const dispute = await db.query.disputes.findFirst({
    where: eq(disputes.disputeId, disputeId),
    with: { 
      order: {
        with: {
          items: {
            with: {
              product: true
            }
          },
          shipments: true
        }
      }
    }
  });

  if (!dispute || !dispute.order) {
    throw new Error('Dispute or order not found');
  }

  const order = dispute.order;
  const shipment = order.shipments?.[0]; // Get first shipment

  // Build order details
  const orderDetails = {
    orderId: order.orderId,
    orderDate: order.createdAt,
    items: order.items.map(item => ({
      sku: item.product?.sku || 'UNKNOWN',
      name: item.product?.name || 'Unknown Product',
      quantity: item.quantity,
      priceCents: item.priceCents
    })),
    totalCents: order.totalCents
  };

  // Build narrative
  const narrative = `
This dispute relates to order #${order.orderId} placed on ${order.createdAt.toLocaleDateString()}.

Order Details:
- Total Amount: ${order.currency} ${(order.totalCents / 100).toFixed(2)}
- Items: ${order.items.length} item(s)
- Customer: ${order.shippingAddress?.name || 'N/A'}

${shipment ? `
Shipping Information:
- Tracking Number: ${shipment.trackingNumber}
- Carrier: ${shipment.carrier}
- Shipped Date: ${shipment.shippedAt?.toLocaleDateString() || 'N/A'}
- Delivery Date: ${shipment.deliveredAt?.toLocaleDateString() || 'In transit'}
- Status: ${shipment.status}
` : 'Shipping information not available.'}

The order was processed and fulfilled according to our standard procedures. All items were in stock and shipped within our stated timeframe. The customer received order confirmation and shipping notification emails.

We have provided tracking information showing successful delivery${shipment?.deliveredAt ? ` on ${shipment.deliveredAt.toLocaleDateString()}` : ''}. Our terms of service and refund policy were clearly displayed during checkout and accepted by the customer.

We believe this dispute should be resolved in our favor based on the evidence provided.
  `.trim();

  return {
    trackingNumber: shipment?.trackingNumber || undefined,
    carrierName: shipment?.carrier || undefined,
    deliveryDate: shipment?.deliveredAt || undefined,
    orderDetails,
    narrative
  };
}

/**
 * Submit evidence to payment provider
 */
export async function submitEvidenceToProvider(channelId: string, disputeId: string): Promise<void> {
  const dispute = await db.query.disputes.findFirst({
    where: eq(disputes.disputeId, disputeId),
    with: { evidencePack: true }
  });

  if (!dispute || !dispute.evidencePack) {
    throw new Error('Dispute or evidence pack not found');
  }

  if (dispute.status !== 'EVIDENCE_READY') {
    throw new Error('Evidence pack is not ready for submission');
  }

  try {
    // TODO: Integrate with actual PayPal API to submit evidence
    // For now, simulate submission
    console.log(`Submitting evidence for dispute ${disputeId} to ${dispute.provider}`);

    // Update dispute status
    await db.update(disputes)
      .set({ 
        status: 'SUBMITTED',
        updatedAt: new Date()
      })
      .where(eq(disputes.disputeId, disputeId));

    // Update evidence pack status
    await db.update(evidencePacks)
      .set({ 
        status: 'SUBMITTED',
        submittedAt: new Date()
      })
      .where(eq(evidencePacks.evidencePackId, dispute.evidencePackId!));

    await addDisputeTimelineEntry(channelId, disputeId, 'EVIDENCE_SUBMITTED',
      `Evidence submitted to ${dispute.provider}`, {});

  } catch (error) {
    console.error('Error submitting evidence:', error);
    
    await db.update(disputes)
      .set({ 
        needsManual: true,
        lastError: String(error),
        updatedAt: new Date()
      })
      .where(eq(disputes.disputeId, disputeId));

    await addDisputeTimelineEntry(channelId, disputeId, 'SUBMISSION_ERROR',
      'Error submitting evidence', { error: String(error) });

    throw error;
  }
}

/**
 * Handle dispute resolution (won/lost)
 */
async function handleDisputeResolution(
  channelId: string,
  disputeId: string,
  outcome: 'WON' | 'LOST'
): Promise<void> {
  const dispute = await db.query.disputes.findFirst({
    where: eq(disputes.disputeId, disputeId)
  });

  if (!dispute) return;

  await addDisputeTimelineEntry(channelId, disputeId, 'DISPUTE_RESOLVED',
    `Dispute resolved: ${outcome}`, { outcome });

  // If lost, may need to process refund or other actions
  if (outcome === 'LOST') {
    // TODO: Trigger refund processing if not already done
    console.log(`Dispute ${disputeId} lost - may need to process refund`);
  }

  // Update to CLOSED status
  await db.update(disputes)
    .set({ 
      status: 'CLOSED',
      updatedAt: new Date()
    })
    .where(eq(disputes.disputeId, disputeId));
}

/**
 * Add timeline entry
 */
async function addDisputeTimelineEntry(
  channelId: string,
  disputeId: string,
  kind: string,
  message: string,
  meta: Record<string, any>
): Promise<void> {
  await db.insert(disputeTimeline).values({
    channelId,
    disputeId,
    kind,
    message,
    meta
  });
}

/**
 * Create review queue item for dispute
 */
async function createDisputeReviewItem(
  channelId: string,
  disputeId: string,
  payload: DisputeWebhookPayload
): Promise<void> {
  const severity = payload.amountCents > 50000 ? 'HIGH' : payload.amountCents > 10000 ? 'MED' : 'LOW';
  
  // SLA: 24 hours for high, 48 hours for medium, 72 hours for low
  const slaHours = severity === 'HIGH' ? 24 : severity === 'MED' ? 48 : 72;
  const slaDueAt = new Date(Date.now() + slaHours * 60 * 60 * 1000);

  await db.insert(reviewQueueItems).values({
    channelId,
    type: 'DISPUTE',
    severity,
    status: 'OPEN',
    slaDueAt,
    refType: 'DISPUTE',
    refId: disputeId,
    title: `New ${payload.provider} Dispute`,
    summary: `${payload.reason || 'Unknown reason'} - ${payload.currency} ${(payload.amountCents / 100).toFixed(2)}`,
    checklist: [
      { id: '1', text: 'Review dispute details', completed: false },
      { id: '2', text: 'Verify order information', completed: false },
      { id: '3', text: 'Check evidence pack', completed: false },
      { id: '4', text: 'Approve or modify evidence', completed: false }
    ],
    meta: { disputeId, provider: payload.provider, caseId: payload.caseId }
  });
}

/**
 * Create escalation for founder
 */
async function createEscalation(
  channelId: string,
  disputeId: string,
  triggerType: string,
  details: string
): Promise<void> {
  await db.insert(escalations).values({
    channelId,
    severity: 'HIGH',
    status: 'OPEN',
    triggerType,
    triggerJson: { disputeId, details },
    sessionId: null
  });
}

/**
 * Polling sweep for disputes (backup to webhooks)
 */
export async function pollDisputesFromProvider(channelId: string, provider: DisputeProvider): Promise<void> {
  console.log(`Polling disputes from ${provider} for channel ${channelId}`);
  
  // TODO: Implement actual API polling for PayPal/Stripe/Wise
  // This would fetch all open disputes and sync them
  
  // For now, just log
  console.log('Polling not yet implemented - relying on webhooks');
}

/**
 * Get disputes for channel with filters
 */
export async function getDisputes(
  channelId: string,
  filters?: {
    status?: DisputeStatus;
    provider?: DisputeProvider;
    needsManual?: boolean;
    limit?: number;
  }
) {
  let query = db.query.disputes.findMany({
    where: eq(disputes.channelId, channelId),
    with: {
      order: true,
      evidencePack: true
    },
    orderBy: desc(disputes.createdAt),
    limit: filters?.limit || 100
  });

  // Apply filters (simplified - in production would use drizzle filters)
  const results = await query;
  
  return results.filter(d => {
    if (filters?.status && d.status !== filters.status) return false;
    if (filters?.provider && d.provider !== filters.provider) return false;
    if (filters?.needsManual !== undefined && d.needsManual !== filters.needsManual) return false;
    return true;
  });
}

/**
 * Get dispute timeline
 */
export async function getDisputeTimeline(disputeId: string) {
  return await db.query.disputeTimeline.findMany({
    where: eq(disputeTimeline.disputeId, disputeId),
    orderBy: desc(disputeTimeline.createdAt)
  });
}

/**
 * Manual override: mark dispute as needs manual review
 */
export async function markDisputeNeedsManual(
  channelId: string,
  disputeId: string,
  reason: string
): Promise<void> {
  await db.update(disputes)
    .set({ 
      needsManual: true,
      lastError: reason,
      updatedAt: new Date()
    })
    .where(and(
      eq(disputes.disputeId, disputeId),
      eq(disputes.channelId, channelId)
    ));

  await addDisputeTimelineEntry(channelId, disputeId, 'MANUAL_OVERRIDE',
    `Marked for manual review: ${reason}`, { reason });
}

/**
 * Resolve dispute manually
 */
export async function resolveDisputeManually(
  channelId: string,
  disputeId: string,
  outcome: 'WON' | 'LOST',
  notes: string
): Promise<void> {
  await db.update(disputes)
    .set({ 
      status: outcome,
      updatedAt: new Date()
    })
    .where(and(
      eq(disputes.disputeId, disputeId),
      eq(disputes.channelId, channelId)
    ));

  await addDisputeTimelineEntry(channelId, disputeId, 'MANUAL_RESOLUTION',
    `Manually resolved as ${outcome}: ${notes}`, { outcome, notes });

  await handleDisputeResolution(channelId, disputeId, outcome);
}
