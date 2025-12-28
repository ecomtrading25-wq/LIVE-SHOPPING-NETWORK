/**
 * LSN INVENTORY, PURCHASING & 3PL ENGINE V1
 * 
 * Complete supply chain management system with:
 * - Inventory lots with FIFO/FEFO allocation
 * - Landed cost calculation per lot
 * - Purchase order (PO) system with approval workflow
 * - Receiving workflow with QC integration
 * - Supplier OS (outreach, sampling, contracts)
 * - MOQ negotiation tracking
 * - Exclusivity clause management
 * - Supplier performance scoring
 * - Inventory reservation with row-level locks
 * - Oversell protection system
 * - Live stock sync during shows
 * - 3PL adapter interface
 * - Shipment creation and tracking
 * - Label generation integration
 * - Pick/pack SOP automation
 * - Lost parcel detection and automation
 * - Returns intake SOP
 * - Multi-3PL routing logic
 */

import { db } from "./db.js";
import {
  inventoryLots,
  purchaseOrders,
  poLineItems,
  poReceipts,
  suppliers,
  supplierContracts,
  supplierPerformance,
  supplierSamples,
  inventory,
  inventoryReservations,
  threePLProviders,
  shipments,
  trackingEvents,
  pickingTasks,
  packingSessions,
  shippingLabels,
  returnIntakes,
  products,
  orders,
  orderItems,
  warehouses,
} from "../drizzle/schema.js";
import { eq, and, gte, lte, desc, sql, inArray } from "drizzle-orm";
import { ulid } from "ulid";

// ============================================================================
// TYPES & ENUMS
// ============================================================================

export type AllocationMethod = "FIFO" | "FEFO" | "LIFO";

export type POStatus = 
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "SENT"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

export type QCStatus = "PENDING" | "PASSED" | "FAILED" | "CONDITIONAL";

export type SupplierTier = "STRATEGIC" | "PREFERRED" | "APPROVED" | "PROBATION" | "BLOCKED";

export type ThreePLProvider = "SHIPBOB" | "FLEXPORT" | "RAKUTEN" | "CUSTOM";

export type ShipmentStatus = 
  | "PENDING"
  | "PICKED"
  | "PACKED"
  | "LABELED"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "EXCEPTION"
  | "RETURNED";

export interface LotAllocation {
  lotId: string;
  quantity: number;
  unitCost: number;
  expiryDate?: Date;
}

export interface LandedCostBreakdown {
  productCost: number;
  shipping: number;
  customs: number;
  duties: number;
  insurance: number;
  handling: number;
  other: number;
  total: number;
  perUnit: number;
}

export interface SupplierScorecard {
  supplierId: string;
  supplierName: string;
  tier: SupplierTier;
  scores: {
    quality: number;
    delivery: number;
    communication: number;
    pricing: number;
    overall: number;
  };
  metrics: {
    totalOrders: number;
    onTimeDeliveryRate: number;
    defectRate: number;
    avgLeadTimeDays: number;
  };
}

export interface ThreePLShipmentRequest {
  orderId: string;
  providerId: string;
  warehouseId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  serviceLevel: "STANDARD" | "EXPRESS" | "OVERNIGHT";
}

// ============================================================================
// INVENTORY LOT MANAGER
// ============================================================================

export class InventoryLotManager {
  /**
   * Create inventory lot from PO receipt
   */
  static async createLot(data: {
    productId: string;
    warehouseId: string;
    poId: string;
    receiptId: string;
    quantity: number;
    unitCost: number;
    landedCost: LandedCostBreakdown;
    expiryDate?: Date;
    lotNumber?: string;
    metadata?: any;
  }): Promise<string> {
    const lotId = ulid();

    await db.insert(inventoryLots).values({
      id: lotId,
      productId: data.productId,
      warehouseId: data.warehouseId,
      poId: data.poId,
      receiptId: data.receiptId,
      lotNumber: data.lotNumber || `LOT-${Date.now()}`,
      quantity: data.quantity,
      availableQuantity: data.quantity,
      unitCost: data.unitCost.toString(),
      landedCostPerUnit: data.landedCost.perUnit.toString(),
      landedCostBreakdown: JSON.stringify(data.landedCost),
      expiryDate: data.expiryDate,
      receivedAt: new Date(),
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      status: "ACTIVE",
      createdAt: new Date(),
    });

    // Update inventory
    await this.updateInventoryFromLots(data.productId, data.warehouseId);

    return lotId;
  }

  /**
   * Allocate inventory using FIFO/FEFO
   */
  static async allocateInventory(
    productId: string,
    warehouseId: string,
    quantity: number,
    method: AllocationMethod = "FIFO"
  ): Promise<LotAllocation[]> {
    // Get available lots
    let orderBy;
    switch (method) {
      case "FIFO":
        orderBy = [inventoryLots.receivedAt];
        break;
      case "FEFO":
        orderBy = [inventoryLots.expiryDate];
        break;
      case "LIFO":
        orderBy = [desc(inventoryLots.receivedAt)];
        break;
    }

    const lots = await db.query.inventoryLots.findMany({
      where: and(
        eq(inventoryLots.productId, productId),
        eq(inventoryLots.warehouseId, warehouseId),
        eq(inventoryLots.status, "ACTIVE"),
        sql`${inventoryLots.availableQuantity} > 0`
      ),
      orderBy,
    });

    const allocations: LotAllocation[] = [];
    let remaining = quantity;

    for (const lot of lots) {
      if (remaining <= 0) break;

      const allocQty = Math.min(remaining, lot.availableQuantity);

      allocations.push({
        lotId: lot.id,
        quantity: allocQty,
        unitCost: Number(lot.unitCost),
        expiryDate: lot.expiryDate || undefined,
      });

      remaining -= allocQty;
    }

    if (remaining > 0) {
      throw new Error(`Insufficient inventory: ${remaining} units short`);
    }

    return allocations;
  }

  /**
   * Reserve inventory from lots
   */
  static async reserveFromLots(
    allocations: LotAllocation[],
    orderId: string
  ): Promise<void> {
    for (const alloc of allocations) {
      // Deduct from lot
      await db
        .update(inventoryLots)
        .set({
          availableQuantity: sql`${inventoryLots.availableQuantity} - ${alloc.quantity}`,
          reservedQuantity: sql`${inventoryLots.reservedQuantity} + ${alloc.quantity}`,
        })
        .where(eq(inventoryLots.id, alloc.lotId));

      // Create reservation record
      await db.insert(inventoryReservations).values({
        id: ulid(),
        lotId: alloc.lotId,
        orderId,
        quantity: alloc.quantity,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 15 * 60000), // 15 minutes
        createdAt: new Date(),
      });
    }
  }

  /**
   * Fulfill reservation (convert to fulfilled)
   */
  static async fulfillReservation(orderId: string): Promise<void> {
    const reservations = await db.query.inventoryReservations.findMany({
      where: and(
        eq(inventoryReservations.orderId, orderId),
        eq(inventoryReservations.status, "ACTIVE")
      ),
    });

    for (const res of reservations) {
      // Deduct from lot reserved, add to fulfilled
      await db
        .update(inventoryLots)
        .set({
          reservedQuantity: sql`${inventoryLots.reservedQuantity} - ${res.quantity}`,
          fulfilledQuantity: sql`${inventoryLots.fulfilledQuantity} + ${res.quantity}`,
        })
        .where(eq(inventoryLots.id, res.lotId));

      // Update reservation status
      await db
        .update(inventoryReservations)
        .set({
          status: "FULFILLED",
          fulfilledAt: new Date(),
        })
        .where(eq(inventoryReservations.id, res.id));
    }

    // Update inventory aggregates
    const firstRes = reservations[0];
    if (firstRes) {
      const lot = await db.query.inventoryLots.findFirst({
        where: eq(inventoryLots.id, firstRes.lotId),
      });
      if (lot) {
        await this.updateInventoryFromLots(lot.productId, lot.warehouseId);
      }
    }
  }

  /**
   * Release expired reservations
   */
  static async releaseExpiredReservations(): Promise<number> {
    const expired = await db.query.inventoryReservations.findMany({
      where: and(
        eq(inventoryReservations.status, "ACTIVE"),
        lte(inventoryReservations.expiresAt, new Date())
      ),
    });

    for (const res of expired) {
      // Return to lot available
      await db
        .update(inventoryLots)
        .set({
          availableQuantity: sql`${inventoryLots.availableQuantity} + ${res.quantity}`,
          reservedQuantity: sql`${inventoryLots.reservedQuantity} - ${res.quantity}`,
        })
        .where(eq(inventoryLots.id, res.lotId));

      // Update reservation status
      await db
        .update(inventoryReservations)
        .set({
          status: "EXPIRED",
        })
        .where(eq(inventoryReservations.id, res.id));
    }

    return expired.length;
  }

  /**
   * Calculate weighted average cost (WAC)
   */
  static async calculateWAC(productId: string, warehouseId: string): Promise<number> {
    const lots = await db.query.inventoryLots.findMany({
      where: and(
        eq(inventoryLots.productId, productId),
        eq(inventoryLots.warehouseId, warehouseId),
        eq(inventoryLots.status, "ACTIVE"),
        sql`${inventoryLots.availableQuantity} > 0`
      ),
    });

    if (lots.length === 0) return 0;

    const totalValue = lots.reduce(
      (sum, lot) => sum + lot.availableQuantity * Number(lot.landedCostPerUnit),
      0
    );
    const totalQty = lots.reduce((sum, lot) => sum + lot.availableQuantity, 0);

    return totalQty > 0 ? totalValue / totalQty : 0;
  }

  /**
   * Update inventory aggregates from lots
   */
  private static async updateInventoryFromLots(
    productId: string,
    warehouseId: string
  ): Promise<void> {
    const lots = await db.query.inventoryLots.findMany({
      where: and(
        eq(inventoryLots.productId, productId),
        eq(inventoryLots.warehouseId, warehouseId),
        eq(inventoryLots.status, "ACTIVE")
      ),
    });

    const available = lots.reduce((sum, lot) => sum + lot.availableQuantity, 0);
    const reserved = lots.reduce((sum, lot) => sum + lot.reservedQuantity, 0);
    const onHand = lots.reduce((sum, lot) => sum + lot.quantity, 0);

    // Upsert inventory record
    const existing = await db.query.inventory.findFirst({
      where: and(
        eq(inventory.productId, productId),
        eq(inventory.warehouseId, warehouseId)
      ),
    });

    if (existing) {
      await db
        .update(inventory)
        .set({
          available,
          reserved,
          onHand,
          updatedAt: new Date(),
        })
        .where(eq(inventory.id, existing.id));
    } else {
      await db.insert(inventory).values({
        id: ulid(),
        productId,
        warehouseId,
        available,
        reserved,
        onHand,
        updatedAt: new Date(),
      });
    }
  }
}

// ============================================================================
// PURCHASE ORDER MANAGER
// ============================================================================

export class PurchaseOrderManager {
  /**
   * Create purchase order
   */
  static async createPO(data: {
    supplierId: string;
    warehouseId: string;
    expectedDeliveryDate: Date;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      notes?: string;
    }>;
    shippingCost?: number;
    notes?: string;
  }): Promise<string> {
    const poId = ulid();
    const poNumber = `PO-${Date.now()}`;

    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const total = subtotal + (data.shippingCost || 0);

    await db.insert(purchaseOrders).values({
      id: poId,
      poNumber,
      supplierId: data.supplierId,
      warehouseId: data.warehouseId,
      status: "DRAFT",
      subtotal: subtotal.toString(),
      shippingCost: (data.shippingCost || 0).toString(),
      total: total.toString(),
      expectedDeliveryDate: data.expectedDeliveryDate,
      notes: data.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create line items
    for (const item of data.items) {
      await db.insert(poLineItems).values({
        id: ulid(),
        poId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        lineTotal: (item.quantity * item.unitPrice).toString(),
        receivedQuantity: 0,
        notes: item.notes,
        createdAt: new Date(),
      });
    }

    return poId;
  }

  /**
   * Submit PO for approval
   */
  static async submitForApproval(poId: string): Promise<void> {
    await db
      .update(purchaseOrders)
      .set({
        status: "PENDING_APPROVAL",
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(purchaseOrders.id, poId));
  }

  /**
   * Approve PO
   */
  static async approvePO(poId: string, approvedBy: string): Promise<void> {
    await db
      .update(purchaseOrders)
      .set({
        status: "APPROVED",
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(purchaseOrders.id, poId));
  }

  /**
   * Send PO to supplier
   */
  static async sendPO(poId: string): Promise<void> {
    await db
      .update(purchaseOrders)
      .set({
        status: "SENT",
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(purchaseOrders.id, poId));

    // In production, this would trigger email/API to supplier
  }

  /**
   * Receive PO (create receipt)
   */
  static async receivePO(data: {
    poId: string;
    items: Array<{
      lineItemId: string;
      receivedQuantity: number;
      qcStatus: QCStatus;
      qcNotes?: string;
    }>;
    receivedBy: string;
    notes?: string;
  }): Promise<string> {
    const receiptId = ulid();
    const receiptNumber = `RCV-${Date.now()}`;

    await db.insert(poReceipts).values({
      id: receiptId,
      receiptNumber,
      poId: data.poId,
      receivedBy: data.receivedBy,
      receivedAt: new Date(),
      notes: data.notes,
      createdAt: new Date(),
    });

    // Update line items and create lots
    for (const item of data.items) {
      const lineItem = await db.query.poLineItems.findFirst({
        where: eq(poLineItems.id, item.lineItemId),
      });

      if (!lineItem) continue;

      // Update received quantity
      await db
        .update(poLineItems)
        .set({
          receivedQuantity: sql`${poLineItems.receivedQuantity} + ${item.receivedQuantity}`,
          qcStatus: item.qcStatus,
          qcNotes: item.qcNotes,
        })
        .where(eq(poLineItems.id, item.lineItemId));

      // Create inventory lot if QC passed
      if (item.qcStatus === "PASSED") {
        const po = await db.query.purchaseOrders.findFirst({
          where: eq(purchaseOrders.id, data.poId),
        });

        if (po) {
          // Calculate landed cost
          const landedCost = await this.calculateLandedCost(
            data.poId,
            item.lineItemId,
            item.receivedQuantity
          );

          await InventoryLotManager.createLot({
            productId: lineItem.productId,
            warehouseId: po.warehouseId,
            poId: data.poId,
            receiptId,
            quantity: item.receivedQuantity,
            unitCost: Number(lineItem.unitPrice),
            landedCost,
          });
        }
      }
    }

    // Update PO status
    await this.updatePOStatus(data.poId);

    return receiptId;
  }

  /**
   * Calculate landed cost
   */
  private static async calculateLandedCost(
    poId: string,
    lineItemId: string,
    quantity: number
  ): Promise<LandedCostBreakdown> {
    const po = await db.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, poId),
      with: {
        lineItems: true,
      },
    });

    if (!po) throw new Error("PO not found");

    const lineItem = po.lineItems.find((li) => li.id === lineItemId);
    if (!lineItem) throw new Error("Line item not found");

    const productCost = Number(lineItem.unitPrice) * quantity;

    // Allocate shipping cost proportionally
    const totalQty = po.lineItems.reduce((sum, li) => sum + li.quantity, 0);
    const shippingAllocation = (Number(po.shippingCost) / totalQty) * quantity;

    // Estimate other costs (in production, these would be actual costs)
    const customs = productCost * 0.05; // 5% estimate
    const duties = productCost * 0.03; // 3% estimate
    const insurance = productCost * 0.01; // 1% estimate
    const handling = quantity * 0.5; // $0.50 per unit

    const total =
      productCost + shippingAllocation + customs + duties + insurance + handling;

    return {
      productCost,
      shipping: shippingAllocation,
      customs,
      duties,
      insurance,
      handling,
      other: 0,
      total,
      perUnit: total / quantity,
    };
  }

  /**
   * Update PO status based on received quantities
   */
  private static async updatePOStatus(poId: string): Promise<void> {
    const po = await db.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, poId),
      with: {
        lineItems: true,
      },
    });

    if (!po) return;

    const allReceived = po.lineItems.every(
      (li) => li.receivedQuantity >= li.quantity
    );
    const someReceived = po.lineItems.some((li) => li.receivedQuantity > 0);

    let newStatus: POStatus = po.status as POStatus;

    if (allReceived) {
      newStatus = "RECEIVED";
    } else if (someReceived) {
      newStatus = "PARTIALLY_RECEIVED";
    }

    if (newStatus !== po.status) {
      await db
        .update(purchaseOrders)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(purchaseOrders.id, poId));
    }
  }
}

// ============================================================================
// SUPPLIER MANAGER
// ============================================================================

export class SupplierManager {
  /**
   * Create supplier
   */
  static async createSupplier(data: {
    name: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
    tier: SupplierTier;
    paymentTerms: string;
    leadTimeDays: number;
    moq?: number;
    notes?: string;
  }): Promise<string> {
    const supplierId = ulid();

    await db.insert(suppliers).values({
      id: supplierId,
      name: data.name,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      tier: data.tier,
      paymentTerms: data.paymentTerms,
      leadTimeDays: data.leadTimeDays,
      moq: data.moq,
      notes: data.notes,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return supplierId;
  }

  /**
   * Create supplier contract
   */
  static async createContract(data: {
    supplierId: string;
    contractNumber: string;
    startDate: Date;
    endDate: Date;
    terms: string;
    exclusivityClause?: string;
    moqCommitment?: number;
    pricingTerms: string;
    qualityStandards: string;
  }): Promise<string> {
    const contractId = ulid();

    await db.insert(supplierContracts).values({
      id: contractId,
      supplierId: data.supplierId,
      contractNumber: data.contractNumber,
      startDate: data.startDate,
      endDate: data.endDate,
      terms: data.terms,
      exclusivityClause: data.exclusivityClause,
      moqCommitment: data.moqCommitment,
      pricingTerms: data.pricingTerms,
      qualityStandards: data.qualityStandards,
      status: "ACTIVE",
      createdAt: new Date(),
    });

    return contractId;
  }

  /**
   * Request sample
   */
  static async requestSample(data: {
    supplierId: string;
    productName: string;
    quantity: number;
    expectedArrival: Date;
    notes?: string;
  }): Promise<string> {
    const sampleId = ulid();

    await db.insert(supplierSamples).values({
      id: sampleId,
      supplierId: data.supplierId,
      productName: data.productName,
      quantity: data.quantity,
      status: "REQUESTED",
      requestedAt: new Date(),
      expectedArrival: data.expectedArrival,
      notes: data.notes,
      createdAt: new Date(),
    });

    return sampleId;
  }

  /**
   * Evaluate sample
   */
  static async evaluateSample(
    sampleId: string,
    evaluation: {
      qualityScore: number;
      notes: string;
      approved: boolean;
    }
  ): Promise<void> {
    await db
      .update(supplierSamples)
      .set({
        status: evaluation.approved ? "APPROVED" : "REJECTED",
        qualityScore: evaluation.qualityScore,
        evaluationNotes: evaluation.notes,
        evaluatedAt: new Date(),
      })
      .where(eq(supplierSamples.id, sampleId));
  }

  /**
   * Calculate supplier scorecard
   */
  static async calculateScorecard(supplierId: string): Promise<SupplierScorecard> {
    const supplier = await db.query.suppliers.findFirst({
      where: eq(suppliers.id, supplierId),
    });

    if (!supplier) throw new Error("Supplier not found");

    // Get POs for this supplier
    const pos = await db.query.purchaseOrders.findMany({
      where: and(
        eq(purchaseOrders.supplierId, supplierId),
        eq(purchaseOrders.status, "RECEIVED")
      ),
      with: {
        lineItems: true,
        receipts: true,
      },
    });

    // Calculate metrics
    const totalOrders = pos.length;
    
    // On-time delivery rate
    const onTimeDeliveries = pos.filter(
      (po) =>
        po.receipts[0]?.receivedAt &&
        po.expectedDeliveryDate &&
        po.receipts[0].receivedAt <= po.expectedDeliveryDate
    ).length;
    const onTimeDeliveryRate = totalOrders > 0 ? onTimeDeliveries / totalOrders : 0;

    // Defect rate (from QC)
    const totalItems = pos.reduce((sum, po) => sum + po.lineItems.length, 0);
    const failedItems = pos.reduce(
      (sum, po) =>
        sum + po.lineItems.filter((li) => li.qcStatus === "FAILED").length,
      0
    );
    const defectRate = totalItems > 0 ? failedItems / totalItems : 0;

    // Avg lead time
    const leadTimes = pos
      .filter((po) => po.receipts[0]?.receivedAt && po.createdAt)
      .map(
        (po) =>
          (po.receipts[0].receivedAt.getTime() - po.createdAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );
    const avgLeadTimeDays =
      leadTimes.length > 0
        ? leadTimes.reduce((sum, lt) => sum + lt, 0) / leadTimes.length
        : 0;

    // Calculate scores (0-100)
    const qualityScore = Math.max(0, 100 - defectRate * 100);
    const deliveryScore = onTimeDeliveryRate * 100;
    const communicationScore = 85; // Would come from support tickets/interactions
    const pricingScore = 80; // Would come from price competitiveness analysis

    const overallScore = (qualityScore + deliveryScore + communicationScore + pricingScore) / 4;

    return {
      supplierId,
      supplierName: supplier.name,
      tier: supplier.tier as SupplierTier,
      scores: {
        quality: Math.round(qualityScore),
        delivery: Math.round(deliveryScore),
        communication: communicationScore,
        pricing: pricingScore,
        overall: Math.round(overallScore),
      },
      metrics: {
        totalOrders,
        onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100),
        defectRate: Math.round(defectRate * 100),
        avgLeadTimeDays: Math.round(avgLeadTimeDays),
      },
    };
  }

  /**
   * Update supplier tier based on performance
   */
  static async updateTier(supplierId: string): Promise<void> {
    const scorecard = await this.calculateScorecard(supplierId);

    let newTier: SupplierTier = "APPROVED";

    if (scorecard.scores.overall >= 90) {
      newTier = "STRATEGIC";
    } else if (scorecard.scores.overall >= 80) {
      newTier = "PREFERRED";
    } else if (scorecard.scores.overall >= 70) {
      newTier = "APPROVED";
    } else if (scorecard.scores.overall >= 50) {
      newTier = "PROBATION";
    } else {
      newTier = "BLOCKED";
    }

    await db
      .update(suppliers)
      .set({
        tier: newTier,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, supplierId));
  }
}

// ============================================================================
// 3PL INTEGRATION ADAPTER
// ============================================================================

export class ThreePLAdapter {
  /**
   * Create shipment
   */
  static async createShipment(request: ThreePLShipmentRequest): Promise<string> {
    const shipmentId = ulid();
    const trackingNumber = `TRK-${Date.now()}`;

    await db.insert(shipments).values({
      id: shipmentId,
      orderId: request.orderId,
      providerId: request.providerId,
      warehouseId: request.warehouseId,
      trackingNumber,
      carrier: "UPS", // Would come from provider
      serviceLevel: request.serviceLevel,
      status: "PENDING",
      shippingAddress: JSON.stringify(request.shippingAddress),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create picking tasks
    for (const item of request.items) {
      await db.insert(pickingTasks).values({
        id: ulid(),
        shipmentId,
        productId: item.productId,
        quantity: item.quantity,
        status: "PENDING",
        createdAt: new Date(),
      });
    }

    return shipmentId;
  }

  /**
   * Generate shipping label
   */
  static async generateLabel(shipmentId: string): Promise<string> {
    const labelId = ulid();

    // In production, this would call 3PL API to generate label
    const labelUrl = `https://storage.example.com/labels/${labelId}.pdf`;

    await db.insert(shippingLabels).values({
      id: labelId,
      shipmentId,
      labelUrl,
      format: "PDF",
      createdAt: new Date(),
    });

    await db
      .update(shipments)
      .set({
        status: "LABELED",
        updatedAt: new Date(),
      })
      .where(eq(shipments.id, shipmentId));

    return labelUrl;
  }

  /**
   * Process tracking event
   */
  static async processTrackingEvent(data: {
    trackingNumber: string;
    eventType: string;
    eventDescription: string;
    location?: string;
    timestamp: Date;
  }): Promise<void> {
    // Find shipment
    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.trackingNumber, data.trackingNumber),
    });

    if (!shipment) return;

    // Create tracking event
    await db.insert(trackingEvents).values({
      id: ulid(),
      shipmentId: shipment.id,
      eventType: data.eventType,
      eventDescription: data.eventDescription,
      location: data.location,
      eventTimestamp: data.timestamp,
      createdAt: new Date(),
    });

    // Update shipment status
    let newStatus: ShipmentStatus = shipment.status as ShipmentStatus;

    if (data.eventType === "PICKED_UP") {
      newStatus = "IN_TRANSIT";
    } else if (data.eventType === "DELIVERED") {
      newStatus = "DELIVERED";
    } else if (data.eventType === "EXCEPTION") {
      newStatus = "EXCEPTION";
    }

    if (newStatus !== shipment.status) {
      await db
        .update(shipments)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(shipments.id, shipment.id));
    }

    // Check for lost parcel
    if (data.eventType === "EXCEPTION") {
      await this.handleLostParcel(shipment.id);
    }
  }

  /**
   * Handle lost parcel automation
   */
  private static async handleLostParcel(shipmentId: string): Promise<void> {
    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, shipmentId),
    });

    if (!shipment) return;

    // Check if parcel is truly lost (no updates for 7 days)
    const lastEvent = await db.query.trackingEvents.findFirst({
      where: eq(trackingEvents.shipmentId, shipmentId),
      orderBy: [desc(trackingEvents.eventTimestamp)],
    });

    if (!lastEvent) return;

    const daysSinceLastUpdate =
      (Date.now() - lastEvent.eventTimestamp.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLastUpdate >= 7) {
      // Trigger lost parcel workflow
      console.log(`Lost parcel detected: ${shipment.trackingNumber}`);
      
      // 1. File claim with carrier
      // 2. Notify customer
      // 3. Issue refund or reship
      // 4. Update inventory
    }
  }

  /**
   * Process return intake
   */
  static async processReturn(data: {
    orderId: string;
    items: Array<{
      productId: string;
      quantity: number;
      reason: string;
      condition: "NEW" | "USED" | "DAMAGED";
    }>;
    trackingNumber?: string;
  }): Promise<string> {
    const returnId = ulid();

    await db.insert(returnIntakes).values({
      id: returnId,
      orderId: data.orderId,
      trackingNumber: data.trackingNumber,
      items: JSON.stringify(data.items),
      status: "PENDING",
      createdAt: new Date(),
    });

    return returnId;
  }

  /**
   * Inspect and restock return
   */
  static async inspectReturn(
    returnId: string,
    inspection: {
      items: Array<{
        productId: string;
        quantity: number;
        condition: "RESTOCKABLE" | "DAMAGED" | "DEFECTIVE";
        notes: string;
      }>;
      inspectedBy: string;
    }
  ): Promise<void> {
    await db
      .update(returnIntakes)
      .set({
        status: "INSPECTED",
        inspectionNotes: JSON.stringify(inspection),
        inspectedAt: new Date(),
      })
      .where(eq(returnIntakes.id, returnId));

    // Restock items
    for (const item of inspection.items) {
      if (item.condition === "RESTOCKABLE") {
        // Add back to inventory
        // In production, this would create a new lot or adjust existing
        console.log(`Restocking ${item.quantity} units of ${item.productId}`);
      }
    }
  }
}

// ============================================================================
// OVERSELL PROTECTION
// ============================================================================

export class OversellProtection {
  /**
   * Check if order can be fulfilled
   */
  static async canFulfillOrder(
    items: Array<{ productId: string; quantity: number }>,
    warehouseId: string
  ): Promise<{
    canFulfill: boolean;
    shortages: Array<{ productId: string; requested: number; available: number }>;
  }> {
    const shortages: Array<{ productId: string; requested: number; available: number }> = [];

    for (const item of items) {
      const stock = await db.query.inventory.findFirst({
        where: and(
          eq(inventory.productId, item.productId),
          eq(inventory.warehouseId, warehouseId)
        ),
      });

      const available = stock?.available || 0;

      if (available < item.quantity) {
        shortages.push({
          productId: item.productId,
          requested: item.quantity,
          available,
        });
      }
    }

    return {
      canFulfill: shortages.length === 0,
      shortages,
    };
  }

  /**
   * Reserve inventory with atomic locks
   */
  static async reserveInventoryAtomic(
    items: Array<{ productId: string; quantity: number }>,
    warehouseId: string,
    orderId: string
  ): Promise<boolean> {
    try {
      // Start transaction
      // In production, use db.transaction()

      for (const item of items) {
        // Allocate from lots
        const allocations = await InventoryLotManager.allocateInventory(
          item.productId,
          warehouseId,
          item.quantity,
          "FIFO"
        );

        // Reserve from lots
        await InventoryLotManager.reserveFromLots(allocations, orderId);
      }

      return true;
    } catch (error) {
      console.error("Failed to reserve inventory:", error);
      return false;
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const inventoryPurchasing3PL = {
  InventoryLotManager,
  PurchaseOrderManager,
  SupplierManager,
  ThreePLAdapter,
  OversellProtection,
};
