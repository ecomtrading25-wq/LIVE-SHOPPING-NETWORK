/**
 * LSN FRAUD DETECTION & FINANCIAL OPERATIONS
 * Complete fraud prevention and financial management system
 * 
 * Features:
 * - Multi-layer fraud scoring engine
 * - Automated dispute management with evidence packs
 * - PayPal/Stripe webhook handlers
 * - Settlement reconciliation
 * - Chargeback prevention
 * - Transaction monitoring
 * - Risk-based holds
 * - Financial reporting
 */

import { getDb } from "./db";
import { 
  orders,
  transactions,
  disputes,
  settlements,
  paymentMethods,
  users,
  products
} from "../drizzle/schema";
import { eq, and, gte, lte, desc, sql, inArray, or } from "drizzle-orm";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FraudCheckResult {
  orderId: number;
  riskScore: number; // 0-100
  riskLevel: "low" | "medium" | "high" | "critical";
  flags: string[];
  shouldHold: boolean;
  shouldReview: boolean;
  shouldReject: boolean;
  reasons: string[];
}

export interface DisputeData {
  transactionId: number;
  disputeType: "chargeback" | "refund_request" | "item_not_received" | "not_as_described";
  amount: number;
  customerReason: string;
  disputeDate: string;
  deadline: string;
}

export interface EvidencePackData {
  disputeId: number;
  trackingNumber?: string;
  deliveryConfirmation?: string;
  customerCommunication: string[];
  productDescription: string;
  photos: string[];
  invoices: string[];
  termsAcceptance: string;
}

export interface SettlementData {
  periodStart: Date;
  periodEnd: Date;
  transactions: number[];
  totalAmount: number;
  fees: number;
  netAmount: number;
  paymentProcessor: "stripe" | "paypal";
}

// ============================================================================
// FRAUD DETECTION ENGINE
// ============================================================================

/**
 * Comprehensive fraud check for order
 */
export async function performFraudCheck(orderId: number): Promise<FraudCheckResult> {
  const db = getDb();
  
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));
  
  if (!order) {
    throw new Error("Order not found");
  }
  
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, order.userId));
  
  let riskScore = 0;
  const flags: string[] = [];
  const reasons: string[] = [];
  
  // ========== LAYER 1: VELOCITY CHECKS ==========
  
  // Check order frequency (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.userId, order.userId),
        gte(orders.createdAt, oneDayAgo)
      )
    );
  
  if (recentOrders.length > 5) {
    riskScore += 20;
    flags.push("HIGH_VELOCITY");
    reasons.push(`${recentOrders.length} orders in 24 hours`);
  } else if (recentOrders.length > 3) {
    riskScore += 10;
    flags.push("MEDIUM_VELOCITY");
  }
  
  // Check order value vs. historical average
  const allUserOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, order.userId));
  
  if (allUserOrders.length > 0) {
    const avgOrderValue = allUserOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0) / allUserOrders.length;
    const currentValue = Number(order.totalAmount);
    
    if (currentValue > avgOrderValue * 3) {
      riskScore += 15;
      flags.push("UNUSUAL_AMOUNT");
      reasons.push(`Order value ${currentValue.toFixed(2)} is 3x average ${avgOrderValue.toFixed(2)}`);
    }
  }
  
  // ========== LAYER 2: PAYMENT METHOD CHECKS ==========
  
  // Check if payment method is new
  if (order.paymentMethodId) {
    const [paymentMethod] = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, order.paymentMethodId));
    
    if (paymentMethod) {
      const methodAge = Date.now() - paymentMethod.createdAt.getTime();
      const hoursOld = methodAge / (60 * 60 * 1000);
      
      if (hoursOld < 1) {
        riskScore += 25;
        flags.push("NEW_PAYMENT_METHOD");
        reasons.push("Payment method added less than 1 hour ago");
      } else if (hoursOld < 24) {
        riskScore += 10;
        flags.push("RECENT_PAYMENT_METHOD");
      }
    }
  }
  
  // ========== LAYER 3: USER ACCOUNT CHECKS ==========
  
  if (user) {
    // New account check
    const accountAge = Date.now() - user.createdAt.getTime();
    const daysOld = accountAge / (24 * 60 * 60 * 1000);
    
    if (daysOld < 1) {
      riskScore += 20;
      flags.push("NEW_ACCOUNT");
      reasons.push("Account created less than 24 hours ago");
    } else if (daysOld < 7) {
      riskScore += 10;
      flags.push("RECENT_ACCOUNT");
    }
    
    // Email verification check
    if (!user.emailVerified) {
      riskScore += 15;
      flags.push("UNVERIFIED_EMAIL");
      reasons.push("Email not verified");
    }
  }
  
  // ========== LAYER 4: BEHAVIORAL CHECKS ==========
  
  // Check for multiple failed orders
  const failedOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.userId, order.userId),
        eq(orders.status, "failed")
      )
    );
  
  if (failedOrders.length > 2) {
    riskScore += 15;
    flags.push("MULTIPLE_FAILURES");
    reasons.push(`${failedOrders.length} failed orders`);
  }
  
  // ========== LAYER 5: SHIPPING ADDRESS CHECKS ==========
  
  // Check for mismatched billing/shipping (would need address data)
  // Placeholder for now
  
  // ========== LAYER 6: PRODUCT-SPECIFIC CHECKS ==========
  
  // Check for high-risk products (electronics, gift cards, etc.)
  const orderItems = JSON.parse(order.items as string || "[]");
  
  for (const item of orderItems) {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, item.productId));
    
    if (product) {
      // High-value items
      if (Number(product.price) > 500) {
        riskScore += 5;
        flags.push("HIGH_VALUE_ITEM");
      }
      
      // Large quantities
      if (item.quantity > 10) {
        riskScore += 10;
        flags.push("LARGE_QUANTITY");
        reasons.push(`Quantity ${item.quantity} for ${product.name}`);
      }
    }
  }
  
  // ========== LAYER 7: HISTORICAL FRAUD CHECKS ==========
  
  // Check previous fraud scores
  const previousFraudScores = await db
    .select()
    .from(fraudScores)
    .where(eq(fraudScores.userId, order.userId))
    .orderBy(desc(fraudScores.createdAt))
    .limit(5);
  
  const avgPreviousScore = previousFraudScores.length > 0
    ? previousFraudScores.reduce((sum, fs) => sum + fs.riskScore, 0) / previousFraudScores.length
    : 0;
  
  if (avgPreviousScore > 60) {
    riskScore += 20;
    flags.push("HISTORICAL_FRAUD");
    reasons.push(`Average previous risk score: ${avgPreviousScore.toFixed(0)}`);
  }
  
  // ========== DETERMINE RISK LEVEL & ACTIONS ==========
  
  let riskLevel: "low" | "medium" | "high" | "critical";
  let shouldHold = false;
  let shouldReview = false;
  let shouldReject = false;
  
  if (riskScore >= 80) {
    riskLevel = "critical";
    shouldReject = true;
    reasons.push("CRITICAL RISK - Auto-reject recommended");
  } else if (riskScore >= 60) {
    riskLevel = "high";
    shouldHold = true;
    shouldReview = true;
    reasons.push("HIGH RISK - Hold for manual review");
  } else if (riskScore >= 40) {
    riskLevel = "medium";
    shouldReview = true;
    reasons.push("MEDIUM RISK - Flag for review");
  } else {
    riskLevel = "low";
  }
  
  // Save fraud score
  await db.insert(fraudScores).values({
    orderId: order.id,
    userId: order.userId,
    riskScore,
    riskLevel,
    flags: JSON.stringify(flags),
    reasons: JSON.stringify(reasons),
    createdAt: new Date(),
  });
  
  return {
    orderId,
    riskScore,
    riskLevel,
    flags,
    shouldHold,
    shouldReview,
    shouldReject,
    reasons,
  };
}

/**
 * Batch fraud check for multiple orders
 */
export async function batchFraudCheck(orderIds: number[]) {
  const results = [];
  
  for (const orderId of orderIds) {
    try {
      const result = await performFraudCheck(orderId);
      results.push(result);
    } catch (error) {
      console.error(`Fraud check failed for order ${orderId}:`, error);
    }
  }
  
  return {
    total: orderIds.length,
    checked: results.length,
    lowRisk: results.filter(r => r.riskLevel === "low").length,
    mediumRisk: results.filter(r => r.riskLevel === "medium").length,
    highRisk: results.filter(r => r.riskLevel === "high").length,
    criticalRisk: results.filter(r => r.riskLevel === "critical").length,
    results,
  };
}

// ============================================================================
// DISPUTE MANAGEMENT
// ============================================================================

/**
 * Create dispute record
 */
export async function createDispute(data: DisputeData) {
  const db = getDb();
  
  const [dispute] = await db.insert(disputes).values({
    transactionId: data.transactionId,
    disputeType: data.disputeType,
    amount: data.amount,
    customerReason: data.customerReason,
    disputeDate: new Date(data.disputeDate),
    deadline: new Date(data.deadline),
    status: "open",
    createdAt: new Date(),
  }).returning();
  
  return dispute;
}

/**
 * Generate comprehensive evidence pack for dispute
 */
export async function generateEvidencePack(data: EvidencePackData) {
  const db = getDb();
  
  const [dispute] = await db
    .select()
    .from(disputes)
    .where(eq(disputes.id, data.disputeId));
  
  if (!dispute) {
    throw new Error("Dispute not found");
  }
  
  // Get transaction details
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, dispute.transactionId));
  
  if (!transaction) {
    throw new Error("Transaction not found");
  }
  
  // Get order details
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, transaction.orderId));
  
  // Build evidence pack
  const evidencePack = {
    // Shipping proof
    trackingNumber: data.trackingNumber,
    deliveryConfirmation: data.deliveryConfirmation,
    shippingDate: order?.shippedAt,
    deliveryDate: order?.deliveredAt,
    
    // Product information
    productDescription: data.productDescription,
    productPhotos: data.photos,
    
    // Customer interaction
    customerCommunication: data.customerCommunication,
    orderDate: order?.createdAt,
    
    // Payment proof
    invoices: data.invoices,
    transactionId: transaction.id,
    paymentDate: transaction.createdAt,
    
    // Terms & conditions
    termsAcceptance: data.termsAcceptance,
    
    // Metadata
    generatedAt: new Date(),
  };
  
  // Save evidence
  const [evidence] = await db.insert(disputeEvidence).values({
    disputeId: data.disputeId,
    evidenceType: "comprehensive_pack",
    evidenceData: JSON.stringify(evidencePack),
    submittedAt: new Date(),
  }).returning();
  
  // Update dispute status
  await db
    .update(disputes)
    .set({ status: "evidence_submitted" })
    .where(eq(disputes.id, data.disputeId));
  
  return {
    dispute,
    evidence,
    evidencePack,
  };
}

/**
 * Auto-respond to dispute based on evidence
 */
export async function autoRespondToDispute(disputeId: number) {
  const db = getDb();
  
  const [dispute] = await db
    .select()
    .from(disputes)
    .where(eq(disputes.id, disputeId));
  
  if (!dispute) {
    throw new Error("Dispute not found");
  }
  
  // Get evidence
  const evidence = await db
    .select()
    .from(disputeEvidence)
    .where(eq(disputeEvidence.disputeId, disputeId));
  
  // Analyze evidence strength
  let evidenceScore = 0;
  let hasTracking = false;
  let hasDeliveryConfirmation = false;
  let hasCommunication = false;
  
  for (const ev of evidence) {
    const data = JSON.parse(ev.evidenceData as string);
    
    if (data.trackingNumber) {
      evidenceScore += 30;
      hasTracking = true;
    }
    
    if (data.deliveryConfirmation) {
      evidenceScore += 30;
      hasDeliveryConfirmation = true;
    }
    
    if (data.customerCommunication && data.customerCommunication.length > 0) {
      evidenceScore += 20;
      hasCommunication = true;
    }
    
    if (data.productPhotos && data.productPhotos.length > 0) {
      evidenceScore += 10;
    }
    
    if (data.invoices && data.invoices.length > 0) {
      evidenceScore += 10;
    }
  }
  
  // Determine response strategy
  let recommendedAction: "accept" | "challenge" | "partial_refund";
  let confidence: "low" | "medium" | "high";
  
  if (evidenceScore >= 70 && hasTracking && hasDeliveryConfirmation) {
    recommendedAction = "challenge";
    confidence = "high";
  } else if (evidenceScore >= 50) {
    recommendedAction = "challenge";
    confidence = "medium";
  } else if (evidenceScore >= 30) {
    recommendedAction = "partial_refund";
    confidence = "medium";
  } else {
    recommendedAction = "accept";
    confidence = "low";
  }
  
  return {
    disputeId,
    evidenceScore,
    hasTracking,
    hasDeliveryConfirmation,
    hasCommunication,
    recommendedAction,
    confidence,
    reasoning: generateDisputeReasoning(evidenceScore, hasTracking, hasDeliveryConfirmation, hasCommunication),
  };
}

function generateDisputeReasoning(
  score: number,
  hasTracking: boolean,
  hasDelivery: boolean,
  hasCommunication: boolean
): string[] {
  const reasoning = [];
  
  if (hasTracking && hasDelivery) {
    reasoning.push("✅ Strong delivery proof with tracking and confirmation");
  } else if (hasTracking) {
    reasoning.push("⚠️ Tracking available but no delivery confirmation");
  } else {
    reasoning.push("❌ No tracking information available");
  }
  
  if (hasCommunication) {
    reasoning.push("✅ Customer communication documented");
  } else {
    reasoning.push("⚠️ Limited customer communication records");
  }
  
  if (score >= 70) {
    reasoning.push("💪 Strong evidence package - high chance of winning dispute");
  } else if (score >= 50) {
    reasoning.push("📊 Moderate evidence - reasonable chance of success");
  } else {
    reasoning.push("⚠️ Weak evidence - consider settlement");
  }
  
  return reasoning;
}

// ============================================================================
// CHARGEBACK PREVENTION
// ============================================================================

/**
 * Predict chargeback risk for transaction
 */
export async function predictChargebackRisk(transactionId: number) {
  const db = getDb();
  
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId));
  
  if (!transaction) {
    throw new Error("Transaction not found");
  }
  
  // Get order
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, transaction.orderId));
  
  if (!order) {
    throw new Error("Order not found");
  }
  
  let riskScore = 0;
  const riskFactors: string[] = [];
  
  // Factor 1: Delivery status
  if (!order.deliveredAt) {
    riskScore += 30;
    riskFactors.push("Order not yet delivered");
  } else {
    const daysSinceDelivery = (Date.now() - order.deliveredAt.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceDelivery < 7) {
      riskScore += 10;
      riskFactors.push("Recent delivery (< 7 days)");
    }
  }
  
  // Factor 2: Order value
  if (Number(order.totalAmount) > 500) {
    riskScore += 20;
    riskFactors.push("High order value");
  }
  
  // Factor 3: Customer history
  const customerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, order.userId));
  
  if (customerOrders.length === 1) {
    riskScore += 25;
    riskFactors.push("First-time customer");
  }
  
  // Factor 4: Previous disputes
  const previousDisputes = await db
    .select()
    .from(disputes)
    .where(eq(disputes.transactionId, transactionId));
  
  if (previousDisputes.length > 0) {
    riskScore += 40;
    riskFactors.push("Previous disputes on this transaction");
  }
  
  // Factor 5: Fraud score
  const [fraudScore] = await db
    .select()
    .from(fraudScores)
    .where(eq(fraudScores.orderId, order.id))
    .orderBy(desc(fraudScores.createdAt))
    .limit(1);
  
  if (fraudScore && fraudScore.riskScore > 50) {
    riskScore += 30;
    riskFactors.push(`High fraud score: ${fraudScore.riskScore}`);
  }
  
  const riskLevel = riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";
  
  return {
    transactionId,
    riskScore,
    riskLevel,
    riskFactors,
    preventionActions: generatePreventionActions(riskScore, riskFactors),
  };
}

function generatePreventionActions(score: number, factors: string[]): string[] {
  const actions = [];
  
  if (score >= 70) {
    actions.push("🚨 Proactive outreach to customer");
    actions.push("📧 Send delivery confirmation email");
    actions.push("📞 Consider phone follow-up");
  }
  
  if (factors.includes("Order not yet delivered")) {
    actions.push("📦 Expedite shipping and provide tracking");
  }
  
  if (factors.includes("First-time customer")) {
    actions.push("👋 Send welcome email with support info");
  }
  
  if (score >= 40) {
    actions.push("📸 Collect delivery photo proof");
    actions.push("✉️ Request signature confirmation");
  }
  
  return actions;
}

// ============================================================================
// SETTLEMENT RECONCILIATION
// ============================================================================

/**
 * Create settlement record
 */
export async function createSettlement(data: SettlementData) {
  const db = getDb();
  
  const [settlement] = await db.insert(settlements).values({
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    transactionIds: JSON.stringify(data.transactions),
    totalAmount: data.totalAmount,
    fees: data.fees,
    netAmount: data.netAmount,
    paymentProcessor: data.paymentProcessor,
    status: "pending",
    createdAt: new Date(),
  }).returning();
  
  return settlement;
}

/**
 * Reconcile settlement with actual transactions
 */
export async function reconcileSettlement(settlementId: number) {
  const db = getDb();
  
  const [settlement] = await db
    .select()
    .from(settlements)
    .where(eq(settlements.id, settlementId));
  
  if (!settlement) {
    throw new Error("Settlement not found");
  }
  
  const transactionIds = JSON.parse(settlement.transactionIds as string);
  
  // Get all transactions
  const txns = await db
    .select()
    .from(transactions)
    .where(inArray(transactions.id, transactionIds));
  
  // Calculate expected amounts
  const expectedTotal = txns.reduce((sum, txn) => sum + Number(txn.amount), 0);
  const actualTotal = Number(settlement.totalAmount);
  const difference = actualTotal - expectedTotal;
  
  // Check for discrepancies
  const discrepancies = [];
  
  if (Math.abs(difference) > 0.01) {
    discrepancies.push({
      type: "amount_mismatch",
      expected: expectedTotal,
      actual: actualTotal,
      difference,
    });
  }
  
  // Check transaction count
  if (txns.length !== transactionIds.length) {
    discrepancies.push({
      type: "transaction_count_mismatch",
      expected: transactionIds.length,
      actual: txns.length,
    });
  }
  
  // Update settlement status
  const status = discrepancies.length === 0 ? "reconciled" : "discrepancy";
  
  await db
    .update(settlements)
    .set({ 
      status,
      reconciledAt: new Date(),
    })
    .where(eq(settlements.id, settlementId));
  
  return {
    settlementId,
    status,
    expectedTotal,
    actualTotal,
    difference,
    discrepancies,
    transactionCount: txns.length,
  };
}

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(event: any) {
  const db = getDb();
  
  switch (event.type) {
    case "charge.succeeded":
      // Update transaction status
      await db
        .update(transactions)
        .set({ 
          status: "completed",
          processedAt: new Date(),
        })
        .where(eq(transactions.externalId, event.data.object.id));
      break;
      
    case "charge.failed":
      await db
        .update(transactions)
        .set({ 
          status: "failed",
          failureReason: event.data.object.failure_message,
        })
        .where(eq(transactions.externalId, event.data.object.id));
      break;
      
    case "charge.dispute.created":
      // Create dispute record
      const charge = event.data.object;
      const [txn] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.externalId, charge.id));
      
      if (txn) {
        await createDispute({
          transactionId: txn.id,
          disputeType: "chargeback",
          amount: charge.amount / 100,
          customerReason: charge.dispute.reason,
          disputeDate: new Date(charge.dispute.created * 1000).toISOString(),
          deadline: new Date((charge.dispute.created + 7 * 24 * 60 * 60) * 1000).toISOString(),
        });
      }
      break;
      
    case "payout.paid":
      // Update settlement
      await db
        .update(settlements)
        .set({ 
          status: "paid",
          paidAt: new Date(),
        })
        .where(eq(settlements.externalId, event.data.object.id));
      break;
  }
  
  return { received: true };
}

/**
 * Handle PayPal webhook events
 */
export async function handlePayPalWebhook(event: any) {
  const db = getDb();
  
  switch (event.event_type) {
    case "PAYMENT.CAPTURE.COMPLETED":
      await db
        .update(transactions)
        .set({ 
          status: "completed",
          processedAt: new Date(),
        })
        .where(eq(transactions.externalId, event.resource.id));
      break;
      
    case "PAYMENT.CAPTURE.DENIED":
      await db
        .update(transactions)
        .set({ 
          status: "failed",
          failureReason: "Payment denied by PayPal",
        })
        .where(eq(transactions.externalId, event.resource.id));
      break;
      
    case "CUSTOMER.DISPUTE.CREATED":
      const dispute = event.resource;
      const [txn] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.externalId, dispute.disputed_transactions[0].seller_transaction_id));
      
      if (txn) {
        await createDispute({
          transactionId: txn.id,
          disputeType: "chargeback",
          amount: parseFloat(dispute.dispute_amount.value),
          customerReason: dispute.reason,
          disputeDate: dispute.create_time,
          deadline: dispute.seller_response_due_date,
        });
      }
      break;
  }
  
  return { received: true };
}

// ============================================================================
// FINANCIAL ANALYTICS
// ============================================================================

/**
 * Get financial operations dashboard
 */
export async function getFinancialDashboard(startDate: Date, endDate: Date) {
  const db = getDb();
  
  // Get all transactions in period
  const txns = await db
    .select()
    .from(transactions)
    .where(
      and(
        gte(transactions.createdAt, startDate),
        lte(transactions.createdAt, endDate)
      )
    );
  
  const totalRevenue = txns
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const failedRevenue = txns
    .filter(t => t.status === "failed")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  // Get disputes
  const allDisputes = await db
    .select()
    .from(disputes)
    .where(
      and(
        gte(disputes.disputeDate, startDate),
        lte(disputes.disputeDate, endDate)
      )
    );
  
  const disputeAmount = allDisputes.reduce((sum, d) => sum + Number(d.amount), 0);
  const disputeRate = totalRevenue > 0 ? (disputeAmount / totalRevenue) * 100 : 0;
  
  // Get fraud scores
  const fraudChecks = await db
    .select()
    .from(fraudScores)
    .where(
      and(
        gte(fraudScores.createdAt, startDate),
        lte(fraudScores.createdAt, endDate)
      )
    );
  
  return {
    revenue: {
      total: totalRevenue,
      failed: failedRevenue,
      successRate: txns.length > 0 ? (txns.filter(t => t.status === "completed").length / txns.length) * 100 : 0,
    },
    disputes: {
      total: allDisputes.length,
      amount: disputeAmount,
      rate: disputeRate,
      byStatus: {
        open: allDisputes.filter(d => d.status === "open").length,
        evidence_submitted: allDisputes.filter(d => d.status === "evidence_submitted").length,
        won: allDisputes.filter(d => d.status === "won").length,
        lost: allDisputes.filter(d => d.status === "lost").length,
      },
    },
    fraud: {
      totalChecks: fraudChecks.length,
      lowRisk: fraudChecks.filter(f => f.riskLevel === "low").length,
      mediumRisk: fraudChecks.filter(f => f.riskLevel === "medium").length,
      highRisk: fraudChecks.filter(f => f.riskLevel === "high").length,
      criticalRisk: fraudChecks.filter(f => f.riskLevel === "critical").length,
      avgRiskScore: fraudChecks.length > 0 
        ? fraudChecks.reduce((sum, f) => sum + f.riskScore, 0) / fraudChecks.length 
        : 0,
    },
  };
}

export default {
  performFraudCheck,
  batchFraudCheck,
  createDispute,
  generateEvidencePack,
  autoRespondToDispute,
  predictChargebackRisk,
  createSettlement,
  reconcileSettlement,
  handleStripeWebhook,
  handlePayPalWebhook,
  getFinancialDashboard,
};
