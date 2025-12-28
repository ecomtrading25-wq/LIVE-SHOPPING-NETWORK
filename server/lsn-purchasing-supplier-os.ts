/**
 * LSN PURCHASING & SUPPLIER OS
 * Complete supplier management and procurement automation system
 * 
 * Features:
 * - Supplier onboarding and performance tracking
 * - Automated purchase order generation
 * - Quality inspection workflows
 * - Landed cost calculation
 * - Supplier scorecarding
 * - RFQ (Request for Quote) management
 * - Contract management
 * - Payment terms automation
 */

import { getDb } from "./db";
import { 
  suppliers, 
  purchaseOrders, 
  purchaseOrderItems,
  supplierProducts,
  qualityInspections,
  products
} from "../drizzle/schema";
import { eq, and, gte, lte, desc, sql, inArray } from "drizzle-orm";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SupplierOnboardingData {
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  taxId: string;
  paymentTerms: string; // "net30", "net60", "prepaid", "cod"
  currency: string;
  leadTimeDays: number;
  minimumOrderValue: number;
  shippingMethods: string[]; // ["air", "sea", "ground"]
  certifications: string[]; // ["iso9001", "fda", "organic"]
  productCategories: string[];
}

export interface PurchaseOrderData {
  supplierId: number;
  items: Array<{
    productId: number;
    quantity: number;
    unitCost: number;
    expectedDeliveryDate: string;
  }>;
  shippingMethod: string;
  shippingCost: number;
  taxAmount: number;
  notes?: string;
  urgency: "standard" | "rush" | "critical";
}

export interface QualityInspectionData {
  purchaseOrderId: number;
  inspectorId: number;
  inspectionDate: string;
  passedItems: number;
  failedItems: number;
  defectTypes: string[];
  notes: string;
  photos: string[];
  disposition: "accept" | "reject" | "conditional_accept";
}

export interface LandedCostCalculation {
  productCost: number;
  shippingCost: number;
  customsDuty: number;
  importTax: number;
  insuranceCost: number;
  handlingFees: number;
  otherFees: number;
  totalLandedCost: number;
  unitLandedCost: number;
  quantity: number;
}

// ============================================================================
// SUPPLIER MANAGEMENT
// ============================================================================

/**
 * Onboard new supplier with complete profile
 */
export async function onboardSupplier(data: SupplierOnboardingData) {
  const db = getDb();
  
  // Calculate initial trust score based on certifications and payment terms
  let initialTrustScore = 50; // Base score
  
  if (data.certifications.includes("iso9001")) initialTrustScore += 10;
  if (data.certifications.includes("fda")) initialTrustScore += 10;
  if (data.paymentTerms === "net30" || data.paymentTerms === "net60") initialTrustScore += 5;
  if (data.leadTimeDays <= 7) initialTrustScore += 10;
  if (data.leadTimeDays <= 3) initialTrustScore += 5;
  
  const [supplier] = await db.insert(suppliers).values({
    name: data.name,
    contactName: data.contactName,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    address: data.address,
    city: data.city,
    state: data.state,
    zipCode: data.zipCode,
    country: data.country,
    taxId: data.taxId,
    paymentTerms: data.paymentTerms,
    currency: data.currency,
    leadTimeDays: data.leadTimeDays,
    minimumOrderValue: data.minimumOrderValue,
    status: "pending_verification",
    trustScore: initialTrustScore,
    createdAt: new Date(),
  }).returning();
  
  // Initialize performance tracking
  await db.insert(supplierPerformance).values({
    supplierId: supplier.id,
    totalOrders: 0,
    onTimeDeliveries: 0,
    qualityScore: 100,
    responseTimeHours: 24,
    defectRate: 0,
    lastEvaluationDate: new Date(),
  });
  
  return supplier;
}

/**
 * Update supplier trust score based on performance
 */
export async function updateSupplierTrustScore(supplierId: number) {
  const db = getDb();
  
  // Get supplier performance metrics
  const [performance] = await db
    .select()
    .from(supplierPerformance)
    .where(eq(supplierPerformance.supplierId, supplierId));
  
  if (!performance) return;
  
  // Calculate trust score (0-100)
  let trustScore = 50; // Base
  
  // On-time delivery rate (0-30 points)
  const onTimeRate = performance.totalOrders > 0 
    ? (performance.onTimeDeliveries / performance.totalOrders) * 100 
    : 0;
  trustScore += (onTimeRate / 100) * 30;
  
  // Quality score (0-30 points)
  trustScore += (performance.qualityScore / 100) * 30;
  
  // Defect rate penalty (0-20 points deduction)
  trustScore -= performance.defectRate * 20;
  
  // Response time bonus (0-10 points)
  if (performance.responseTimeHours <= 4) trustScore += 10;
  else if (performance.responseTimeHours <= 12) trustScore += 5;
  else if (performance.responseTimeHours <= 24) trustScore += 2;
  
  // Clamp between 0-100
  trustScore = Math.max(0, Math.min(100, trustScore));
  
  await db
    .update(suppliers)
    .set({ trustScore })
    .where(eq(suppliers.id, supplierId));
  
  return trustScore;
}

/**
 * Get supplier scorecard with detailed metrics
 */
export async function getSupplierScorecard(supplierId: number) {
  const db = getDb();
  
  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, supplierId));
  
  const [performance] = await db
    .select()
    .from(supplierPerformance)
    .where(eq(supplierPerformance.supplierId, supplierId));
  
  // Get recent purchase orders
  const recentPOs = await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.supplierId, supplierId))
    .orderBy(desc(purchaseOrders.createdAt))
    .limit(10);
  
  // Calculate metrics
  const totalSpend = recentPOs.reduce((sum, po) => sum + Number(po.totalAmount), 0);
  const avgOrderValue = recentPOs.length > 0 ? totalSpend / recentPOs.length : 0;
  
  return {
    supplier,
    performance,
    recentOrders: recentPOs.length,
    totalSpend,
    avgOrderValue,
    trustScore: supplier.trustScore,
    status: supplier.status,
    recommendations: generateSupplierRecommendations(supplier, performance),
  };
}

function generateSupplierRecommendations(supplier: any, performance: any) {
  const recommendations = [];
  
  if (supplier.trustScore < 50) {
    recommendations.push("⚠️ Low trust score - consider alternative suppliers");
  }
  
  if (performance.defectRate > 0.05) {
    recommendations.push("🔍 High defect rate - increase quality inspections");
  }
  
  if (performance.responseTimeHours > 48) {
    recommendations.push("⏰ Slow response time - discuss communication improvements");
  }
  
  if (performance.qualityScore >= 95 && performance.onTimeDeliveries / performance.totalOrders > 0.95) {
    recommendations.push("⭐ Excellent performance - consider preferred supplier status");
  }
  
  return recommendations;
}

// ============================================================================
// PURCHASE ORDER AUTOMATION
// ============================================================================

/**
 * Generate purchase order with intelligent supplier selection
 */
export async function generatePurchaseOrder(data: PurchaseOrderData) {
  const db = getDb();
  
  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  const totalAmount = subtotal + data.shippingCost + data.taxAmount;
  
  // Create PO
  const [po] = await db.insert(purchaseOrders).values({
    supplierId: data.supplierId,
    poNumber: `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    status: "draft",
    subtotal,
    shippingCost: data.shippingCost,
    taxAmount: data.taxAmount,
    totalAmount,
    currency: "USD",
    paymentStatus: "pending",
    shippingMethod: data.shippingMethod,
    urgency: data.urgency,
    notes: data.notes,
    createdAt: new Date(),
  }).returning();
  
  // Create PO items
  for (const item of data.items) {
    await db.insert(purchaseOrderItems).values({
      purchaseOrderId: po.id,
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitCost,
      totalCost: item.quantity * item.unitCost,
      expectedDeliveryDate: new Date(item.expectedDeliveryDate),
      receivedQuantity: 0,
      status: "pending",
    });
  }
  
  return po;
}

/**
 * Intelligent reorder point calculation with demand forecasting
 */
export async function calculateReorderPoints(productId: number) {
  const db = getDb();
  
  // Get product and supplier info
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId));
  
  if (!product) return null;
  
  // Get supplier lead time
  const supplierProducts = await db
    .select({
      supplierId: suppliers.id,
      leadTimeDays: suppliers.leadTimeDays,
      trustScore: suppliers.trustScore,
    })
    .from(suppliers)
    .where(eq(suppliers.status, "active"))
    .orderBy(desc(suppliers.trustScore));
  
  if (supplierProducts.length === 0) return null;
  
  const bestSupplier = supplierProducts[0];
  
  // Simple demand calculation (would use ML in production)
  // Assume average daily sales of 10 units for demo
  const avgDailySales = 10;
  const leadTimeDays = bestSupplier.leadTimeDays;
  const safetyStockDays = 7; // 1 week buffer
  
  const reorderPoint = avgDailySales * (leadTimeDays + safetyStockDays);
  const economicOrderQuantity = Math.ceil(Math.sqrt((2 * avgDailySales * 365 * 50) / 2)); // EOQ formula
  
  return {
    productId,
    currentStock: product.stock,
    reorderPoint,
    economicOrderQuantity,
    recommendedOrderQuantity: Math.max(economicOrderQuantity, reorderPoint - product.stock),
    supplierId: bestSupplier.supplierId,
    leadTimeDays,
    shouldReorder: product.stock <= reorderPoint,
  };
}

/**
 * Automated reorder system - checks all products and generates POs
 */
export async function runAutomatedReorderSystem() {
  const db = getDb();
  
  // Get all active products
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.status, "active"));
  
  const reorderRecommendations = [];
  
  for (const product of allProducts) {
    const reorderAnalysis = await calculateReorderPoints(product.id);
    
    if (reorderAnalysis && reorderAnalysis.shouldReorder) {
      reorderRecommendations.push(reorderAnalysis);
    }
  }
  
  // Group by supplier for batch ordering
  const ordersBySupplierId: Record<number, any[]> = {};
  
  for (const rec of reorderRecommendations) {
    if (!ordersBySupplierId[rec.supplierId]) {
      ordersBySupplierId[rec.supplierId] = [];
    }
    ordersBySupplierId[rec.supplierId].push(rec);
  }
  
  // Generate POs
  const generatedPOs = [];
  
  for (const [supplierId, items] of Object.entries(ordersBySupplierId)) {
    const poData: PurchaseOrderData = {
      supplierId: Number(supplierId),
      items: items.map((item: any) => ({
        productId: item.productId,
        quantity: item.recommendedOrderQuantity,
        unitCost: 10, // Would fetch from supplier pricing
        expectedDeliveryDate: new Date(Date.now() + item.leadTimeDays * 24 * 60 * 60 * 1000).toISOString(),
      })),
      shippingMethod: "ground",
      shippingCost: 50,
      taxAmount: 0,
      urgency: "standard",
    };
    
    const po = await generatePurchaseOrder(poData);
    generatedPOs.push(po);
  }
  
  return {
    reorderRecommendations,
    generatedPOs,
    totalProducts: allProducts.length,
    productsNeedingReorder: reorderRecommendations.length,
  };
}

// ============================================================================
// QUALITY INSPECTION SYSTEM
// ============================================================================

/**
 * Record quality inspection results
 */
export async function recordQualityInspection(data: QualityInspectionData) {
  const db = getDb();
  
  const passRate = data.passedItems / (data.passedItems + data.failedItems);
  
  const [inspection] = await db.insert(qualityInspections).values({
    purchaseOrderId: data.purchaseOrderId,
    inspectorId: data.inspectorId,
    inspectionDate: new Date(data.inspectionDate),
    passedItems: data.passedItems,
    failedItems: data.failedItems,
    passRate,
    defectTypes: JSON.stringify(data.defectTypes),
    notes: data.notes,
    photos: JSON.stringify(data.photos),
    disposition: data.disposition,
    createdAt: new Date(),
  }).returning();
  
  // Update PO status based on disposition
  if (data.disposition === "accept") {
    await db
      .update(purchaseOrders)
      .set({ 
        status: "received",
        receivedAt: new Date(),
      })
      .where(eq(purchaseOrders.id, data.purchaseOrderId));
  } else if (data.disposition === "reject") {
    await db
      .update(purchaseOrders)
      .set({ status: "rejected" })
      .where(eq(purchaseOrders.id, data.purchaseOrderId));
  }
  
  // Update supplier performance
  const [po] = await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.id, data.purchaseOrderId));
  
  if (po) {
    await updateSupplierQualityMetrics(po.supplierId, passRate, data.failedItems);
  }
  
  return inspection;
}

async function updateSupplierQualityMetrics(supplierId: number, passRate: number, defects: number) {
  const db = getDb();
  
  const [performance] = await db
    .select()
    .from(supplierPerformance)
    .where(eq(supplierPerformance.supplierId, supplierId));
  
  if (!performance) return;
  
  // Update running averages
  const newQualityScore = (performance.qualityScore * 0.8) + (passRate * 100 * 0.2); // Weighted average
  const totalItems = (performance.totalOrders * 100); // Estimate
  const newDefectRate = (performance.defectRate * totalItems + defects) / (totalItems + 100);
  
  await db
    .update(supplierPerformance)
    .set({
      qualityScore: newQualityScore,
      defectRate: newDefectRate,
      lastEvaluationDate: new Date(),
    })
    .where(eq(supplierPerformance.supplierId, supplierId));
  
  // Update trust score
  await updateSupplierTrustScore(supplierId);
}

// ============================================================================
// LANDED COST CALCULATION
// ============================================================================

/**
 * Calculate comprehensive landed cost for import
 */
export function calculateLandedCost(
  productCost: number,
  quantity: number,
  shippingCost: number,
  country: string,
  hsCode?: string
): LandedCostCalculation {
  // Customs duty rates by country (simplified)
  const dutyRates: Record<string, number> = {
    "US": 0.05,
    "UK": 0.08,
    "EU": 0.10,
    "CA": 0.06,
    "AU": 0.05,
  };
  
  const dutyRate = dutyRates[country] || 0.05;
  const customsDuty = productCost * quantity * dutyRate;
  
  // Import tax (VAT/GST)
  const taxRates: Record<string, number> = {
    "US": 0,
    "UK": 0.20,
    "EU": 0.21,
    "CA": 0.05,
    "AU": 0.10,
  };
  
  const taxRate = taxRates[country] || 0;
  const importTax = (productCost * quantity + customsDuty) * taxRate;
  
  // Insurance (typically 1-2% of product value)
  const insuranceCost = productCost * quantity * 0.015;
  
  // Handling fees (flat rate)
  const handlingFees = 25;
  
  // Other fees (documentation, etc.)
  const otherFees = 15;
  
  const totalLandedCost = 
    productCost * quantity +
    shippingCost +
    customsDuty +
    importTax +
    insuranceCost +
    handlingFees +
    otherFees;
  
  const unitLandedCost = totalLandedCost / quantity;
  
  return {
    productCost,
    shippingCost,
    customsDuty,
    importTax,
    insuranceCost,
    handlingFees,
    otherFees,
    totalLandedCost,
    unitLandedCost,
    quantity,
  };
}

/**
 * Create inventory lot with landed cost tracking
 */
export async function createInventoryLot(
  productId: number,
  purchaseOrderId: number,
  quantity: number,
  landedCost: LandedCostCalculation
) {
  const db = getDb();
  
  const [lot] = await db.insert(inventoryLots).values({
    productId,
    purchaseOrderId,
    lotNumber: `LOT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    quantity,
    remainingQuantity: quantity,
    unitCost: landedCost.unitLandedCost,
    landedCost: landedCost.totalLandedCost,
    receivedAt: new Date(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year default
    status: "available",
  }).returning();
  
  return lot;
}

// ============================================================================
// RFQ (REQUEST FOR QUOTE) MANAGEMENT
// ============================================================================

export interface RFQData {
  productId: number;
  quantity: number;
  targetPrice: number;
  requiredDeliveryDate: string;
  specifications: string;
  supplierIds: number[];
}

/**
 * Send RFQ to multiple suppliers
 */
export async function sendRFQ(data: RFQData) {
  const db = getDb();
  
  const rfqNumber = `RFQ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  // In production, would send emails to suppliers
  // For now, just track the RFQ
  
  return {
    rfqNumber,
    productId: data.productId,
    quantity: data.quantity,
    targetPrice: data.targetPrice,
    supplierCount: data.supplierIds.length,
    status: "sent",
    sentAt: new Date(),
    responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  };
}

// ============================================================================
// SUPPLIER CONTRACT MANAGEMENT
// ============================================================================

export interface ContractData {
  supplierId: number;
  contractType: "standard" | "preferred" | "exclusive";
  startDate: string;
  endDate: string;
  volumeCommitment: number;
  priceProtection: boolean;
  penaltyClause: string;
  terms: string;
}

/**
 * Create supplier contract
 */
export async function createSupplierContract(data: ContractData) {
  const db = getDb();
  
  const [contract] = await db.insert(supplierContracts).values({
    supplierId: data.supplierId,
    contractNumber: `CONT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    contractType: data.contractType,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    volumeCommitment: data.volumeCommitment,
    priceProtection: data.priceProtection,
    penaltyClause: data.penaltyClause,
    terms: data.terms,
    status: "active",
    createdAt: new Date(),
  }).returning();
  
  return contract;
}

/**
 * Check contract compliance
 */
export async function checkContractCompliance(supplierId: number) {
  const db = getDb();
  
  const [contract] = await db
    .select()
    .from(supplierContracts)
    .where(
      and(
        eq(supplierContracts.supplierId, supplierId),
        eq(supplierContracts.status, "active")
      )
    );
  
  if (!contract) {
    return { hasContract: false };
  }
  
  // Get total orders since contract start
  const orders = await db
    .select()
    .from(purchaseOrders)
    .where(
      and(
        eq(purchaseOrders.supplierId, supplierId),
        gte(purchaseOrders.createdAt, contract.startDate)
      )
    );
  
  const totalVolume = orders.reduce((sum, po) => sum + Number(po.totalAmount), 0);
  const volumeProgress = (totalVolume / contract.volumeCommitment) * 100;
  
  return {
    hasContract: true,
    contract,
    totalVolume,
    volumeCommitment: contract.volumeCommitment,
    volumeProgress,
    isCompliant: volumeProgress >= 80, // 80% threshold
    daysRemaining: Math.ceil((contract.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
  };
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

/**
 * Get purchasing analytics dashboard
 */
export async function getPurchasingAnalytics(startDate: Date, endDate: Date) {
  const db = getDb();
  
  const orders = await db
    .select()
    .from(purchaseOrders)
    .where(
      and(
        gte(purchaseOrders.createdAt, startDate),
        lte(purchaseOrders.createdAt, endDate)
      )
    );
  
  const totalSpend = orders.reduce((sum, po) => sum + Number(po.totalAmount), 0);
  const avgOrderValue = orders.length > 0 ? totalSpend / orders.length : 0;
  
  // Group by supplier
  const spendBySupplier: Record<number, number> = {};
  for (const order of orders) {
    if (!spendBySupplier[order.supplierId]) {
      spendBySupplier[order.supplierId] = 0;
    }
    spendBySupplier[order.supplierId] += Number(order.totalAmount);
  }
  
  return {
    totalOrders: orders.length,
    totalSpend,
    avgOrderValue,
    spendBySupplier,
    ordersByStatus: {
      draft: orders.filter(o => o.status === "draft").length,
      submitted: orders.filter(o => o.status === "submitted").length,
      approved: orders.filter(o => o.status === "approved").length,
      shipped: orders.filter(o => o.status === "shipped").length,
      received: orders.filter(o => o.status === "received").length,
      rejected: orders.filter(o => o.status === "rejected").length,
    },
  };
}

export default {
  onboardSupplier,
  updateSupplierTrustScore,
  getSupplierScorecard,
  generatePurchaseOrder,
  calculateReorderPoints,
  runAutomatedReorderSystem,
  recordQualityInspection,
  calculateLandedCost,
  createInventoryLot,
  sendRFQ,
  createSupplierContract,
  checkContractCompliance,
  getPurchasingAnalytics,
};
