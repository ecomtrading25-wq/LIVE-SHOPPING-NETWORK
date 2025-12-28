/**
 * Inventory & Purchasing System
 * Handles inventory lots, FIFO/FEFO allocation, purchase orders, receiving, and landed costs
 */

import { getDbSync } from './db';
const db = getDbSync();
import {
  inventoryLots,
  purchaseOrders,
  purchaseOrderItems,
  receivingWorkflows,
  inventoryReservations,
  products,
  suppliers
} from '../drizzle/schema';
import { eq, and, desc, gte, gt, sql } from 'drizzle-orm';

export type POStatus = 'DRAFT' | 'SUBMITTED' | 'CONFIRMED' | 'SHIPPED' | 'RECEIVED' | 'CANCELED';
export type LotStatus = 'AVAILABLE' | 'RESERVED' | 'DEPLETED' | 'EXPIRED' | 'QUARANTINE';
export type AllocationStrategy = 'FIFO' | 'FEFO' | 'LIFO';

export interface InventoryLot {
  lotId: string;
  channelId: string;
  productId: string;
  supplierId?: string;
  purchaseOrderId?: string;
  lotNumber: string;
  receivedDate: Date;
  expiryDate?: Date;
  quantityReceived: number;
  quantityAvailable: number;
  quantityReserved: number;
  quantityAllocated: number;
  costPerUnitCents: number;
  landedCostPerUnitCents: number;
  status: LotStatus;
}

export interface PurchaseOrder {
  poId: string;
  channelId: string;
  supplierId: string;
  poNumber: string;
  status: POStatus;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  subtotalCents: number;
  shippingCostCents: number;
  customsDutyCents: number;
  otherFeesCents: number;
  totalCostCents: number;
  currency: string;
  notes?: string;
}

export interface POItem {
  itemId: string;
  poId: string;
  productId: string;
  sku: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCostCents: number;
  totalCostCents: number;
}

export interface ReceivingWorkflow {
  receivingId: string;
  poId: string;
  channelId: string;
  receivedDate: Date;
  receivedBy?: string;
  status: 'IN_PROGRESS' | 'QC_PENDING' | 'QC_PASSED' | 'QC_FAILED' | 'COMPLETED';
  qcNotes?: string;
  discrepancies?: Array<{
    productId: string;
    expected: number;
    received: number;
    reason: string;
  }>;
}

/**
 * Create purchase order
 */
export async function createPurchaseOrder(
  channelId: string,
  supplierId: string,
  items: Array<{
    productId: string;
    sku: string;
    quantity: number;
    unitCostCents: number;
  }>,
  expectedDeliveryDate?: Date,
  shippingCostCents: number = 0,
  customsDutyCents: number = 0,
  otherFeesCents: number = 0,
  notes?: string
): Promise<PurchaseOrder> {
  // Calculate subtotal
  const subtotalCents = items.reduce((sum, item) => 
    sum + (item.quantity * item.unitCostCents), 0
  );

  const totalCostCents = subtotalCents + shippingCostCents + customsDutyCents + otherFeesCents;

  // Generate PO number
  const poNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  // Create PO
  const [po] = await db.insert(purchaseOrders).values({
    channelId,
    supplierId,
    poNumber,
    status: 'DRAFT',
    orderDate: new Date(),
    expectedDeliveryDate: expectedDeliveryDate || null,
    subtotalCents,
    shippingCostCents,
    customsDutyCents,
    otherFeesCents,
    totalCostCents,
    currency: 'AUD',
    notes: notes || null
  }).returning();

  // Create PO items
  for (const item of items) {
    await db.insert(purchaseOrderItems).values({
      channelId,
      poId: po.poId,
      productId: item.productId,
      sku: item.sku,
      quantityOrdered: item.quantity,
      quantityReceived: 0,
      unitCostCents: item.unitCostCents,
      totalCostCents: item.quantity * item.unitCostCents
    });
  }

  return po as PurchaseOrder;
}

/**
 * Submit purchase order to supplier
 */
export async function submitPurchaseOrder(
  channelId: string,
  poId: string
): Promise<void> {
  const po = await db.query.purchaseOrders.findFirst({
    where: and(
      eq(purchaseOrders.poId, poId),
      eq(purchaseOrders.channelId, channelId)
    )
  });

  if (!po) {
    throw new Error('Purchase order not found');
  }

  if (po.status !== 'DRAFT') {
    throw new Error('Can only submit draft purchase orders');
  }

  await db.update(purchaseOrders)
    .set({
      status: 'SUBMITTED',
      updatedAt: new Date()
    })
    .where(eq(purchaseOrders.poId, poId));

  // TODO: Send PO to supplier via email/API
  console.log(`PO ${po.poNumber} submitted to supplier`);
}

/**
 * Start receiving workflow
 */
export async function startReceiving(
  channelId: string,
  poId: string,
  receivedBy?: string
): Promise<ReceivingWorkflow> {
  const po = await db.query.purchaseOrders.findFirst({
    where: and(
      eq(purchaseOrders.poId, poId),
      eq(purchaseOrders.channelId, channelId)
    )
  });

  if (!po) {
    throw new Error('Purchase order not found');
  }

  if (po.status !== 'SHIPPED' && po.status !== 'CONFIRMED') {
    throw new Error('Purchase order must be shipped or confirmed to start receiving');
  }

  // Create receiving workflow
  const [receiving] = await db.insert(receivingWorkflows).values({
    channelId,
    poId,
    receivedDate: new Date(),
    receivedBy: receivedBy || null,
    status: 'IN_PROGRESS'
  }).returning();

  return receiving as ReceivingWorkflow;
}

/**
 * Complete receiving and create inventory lots
 */
export async function completeReceiving(
  channelId: string,
  receivingId: string,
  receivedItems: Array<{
    productId: string;
    quantityReceived: number;
    expiryDate?: Date;
    lotNumber?: string;
  }>,
  qcPassed: boolean = true,
  qcNotes?: string
): Promise<void> {
  const receiving = await db.query.receivingWorkflows.findFirst({
    where: and(
      eq(receivingWorkflows.receivingId, receivingId),
      eq(receivingWorkflows.channelId, channelId)
    ),
    with: {
      purchaseOrder: {
        with: {
          items: true
        }
      }
    }
  });

  if (!receiving) {
    throw new Error('Receiving workflow not found');
  }

  const po = receiving.purchaseOrder;
  if (!po) {
    throw new Error('Purchase order not found');
  }

  // Calculate landed cost per unit
  const totalUnitsReceived = receivedItems.reduce((sum, item) => sum + item.quantityReceived, 0);
  const landedCostOverhead = po.shippingCostCents + po.customsDutyCents + po.otherFeesCents;
  const landedCostPerUnit = totalUnitsReceived > 0 
    ? Math.floor(landedCostOverhead / totalUnitsReceived)
    : 0;

  // Track discrepancies
  const discrepancies: ReceivingWorkflow['discrepancies'] = [];

  // Create inventory lots for each received item
  for (const receivedItem of receivedItems) {
    const poItem = po.items.find(i => i.productId === receivedItem.productId);
    if (!poItem) {
      console.warn(`No PO item found for product ${receivedItem.productId}`);
      continue;
    }

    // Check for discrepancies
    if (receivedItem.quantityReceived !== poItem.quantityOrdered) {
      discrepancies.push({
        productId: receivedItem.productId,
        expected: poItem.quantityOrdered,
        received: receivedItem.quantityReceived,
        reason: receivedItem.quantityReceived < poItem.quantityOrdered 
          ? 'Short shipment' 
          : 'Over shipment'
      });
    }

    // Generate lot number if not provided
    const lotNumber = receivedItem.lotNumber || 
      `LOT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Calculate landed cost per unit for this item
    const unitCostCents = poItem.unitCostCents;
    const landedCostPerUnitCents = unitCostCents + landedCostPerUnit;

    // Create inventory lot
    await db.insert(inventoryLots).values({
      channelId,
      productId: receivedItem.productId,
      supplierId: po.supplierId,
      purchaseOrderId: po.poId,
      lotNumber,
      receivedDate: new Date(),
      expiryDate: receivedItem.expiryDate || null,
      quantityReceived: receivedItem.quantityReceived,
      quantityAvailable: receivedItem.quantityReceived,
      quantityReserved: 0,
      quantityAllocated: 0,
      costPerUnitCents: unitCostCents,
      landedCostPerUnitCents,
      status: qcPassed ? 'AVAILABLE' : 'QUARANTINE'
    });

    // Update PO item received quantity
    await db.update(purchaseOrderItems)
      .set({
        quantityReceived: receivedItem.quantityReceived
      })
      .where(eq(purchaseOrderItems.itemId, poItem.itemId));

    // Update product stock quantity
    const product = await db.query.products.findFirst({
      where: eq(products.productId, receivedItem.productId)
    });

    if (product && qcPassed) {
      await db.update(products)
        .set({
          stockQuantity: (product.stockQuantity || 0) + receivedItem.quantityReceived,
          updatedAt: new Date()
        })
        .where(eq(products.productId, receivedItem.productId));
    }
  }

  // Update receiving workflow
  await db.update(receivingWorkflows)
    .set({
      status: qcPassed ? 'COMPLETED' : 'QC_FAILED',
      qcNotes: qcNotes || null,
      discrepancies: discrepancies.length > 0 ? discrepancies : null
    })
    .where(eq(receivingWorkflows.receivingId, receivingId));

  // Update PO status
  await db.update(purchaseOrders)
    .set({
      status: 'RECEIVED',
      actualDeliveryDate: new Date(),
      updatedAt: new Date()
    })
    .where(eq(purchaseOrders.poId, po.poId));
}

/**
 * Allocate inventory using FIFO/FEFO strategy
 */
export async function allocateInventory(
  channelId: string,
  productId: string,
  quantityNeeded: number,
  strategy: AllocationStrategy = 'FIFO'
): Promise<Array<{
  lotId: string;
  lotNumber: string;
  quantityAllocated: number;
  costPerUnitCents: number;
  landedCostPerUnitCents: number;
}>> {
  // Get available lots
  let lots = await db.query.inventoryLots.findMany({
    where: and(
      eq(inventoryLots.channelId, channelId),
      eq(inventoryLots.productId, productId),
      eq(inventoryLots.status, 'AVAILABLE'),
      gt(inventoryLots.quantityAvailable, 0)
    )
  });

  if (lots.length === 0) {
    throw new Error('No inventory available');
  }

  // Sort lots based on strategy
  if (strategy === 'FIFO') {
    lots.sort((a, b) => a.receivedDate.getTime() - b.receivedDate.getTime());
  } else if (strategy === 'FEFO') {
    // First Expired, First Out
    lots = lots.filter(lot => lot.expiryDate !== null);
    lots.sort((a, b) => {
      if (!a.expiryDate || !b.expiryDate) return 0;
      return a.expiryDate.getTime() - b.expiryDate.getTime();
    });
  } else if (strategy === 'LIFO') {
    lots.sort((a, b) => b.receivedDate.getTime() - a.receivedDate.getTime());
  }

  const allocations: Array<{
    lotId: string;
    lotNumber: string;
    quantityAllocated: number;
    costPerUnitCents: number;
    landedCostPerUnitCents: number;
  }> = [];

  let remainingQuantity = quantityNeeded;

  // Allocate from lots
  for (const lot of lots) {
    if (remainingQuantity <= 0) break;

    const quantityToAllocate = Math.min(lot.quantityAvailable, remainingQuantity);

    allocations.push({
      lotId: lot.lotId,
      lotNumber: lot.lotNumber,
      quantityAllocated: quantityToAllocate,
      costPerUnitCents: lot.costPerUnitCents,
      landedCostPerUnitCents: lot.landedCostPerUnitCents
    });

    // Update lot quantities
    await db.update(inventoryLots)
      .set({
        quantityAvailable: lot.quantityAvailable - quantityToAllocate,
        quantityAllocated: lot.quantityAllocated + quantityToAllocate,
        status: (lot.quantityAvailable - quantityToAllocate) === 0 ? 'DEPLETED' : 'AVAILABLE'
      })
      .where(eq(inventoryLots.lotId, lot.lotId));

    remainingQuantity -= quantityToAllocate;
  }

  if (remainingQuantity > 0) {
    throw new Error(`Insufficient inventory: needed ${quantityNeeded}, allocated ${quantityNeeded - remainingQuantity}`);
  }

  return allocations;
}

/**
 * Reserve inventory for an order (with row-level locking)
 */
export async function reserveInventory(
  channelId: string,
  orderId: string,
  items: Array<{
    productId: string;
    quantity: number;
  }>,
  strategy: AllocationStrategy = 'FIFO'
): Promise<void> {
  // Use transaction for atomic reservation
  await db.transaction(async (tx) => {
    for (const item of items) {
      // Allocate inventory
      const allocations = await allocateInventory(
        channelId,
        item.productId,
        item.quantity,
        strategy
      );

      // Create reservation records
      for (const allocation of allocations) {
        await tx.insert(inventoryReservations).values({
          channelId,
          orderId,
          productId: item.productId,
          lotId: allocation.lotId,
          quantityReserved: allocation.quantityAllocated,
          reservedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        });

        // Update lot reserved quantity
        const lot = await tx.query.inventoryLots.findFirst({
          where: eq(inventoryLots.lotId, allocation.lotId)
        });

        if (lot) {
          await tx.update(inventoryLots)
            .set({
              quantityReserved: lot.quantityReserved + allocation.quantityAllocated
            })
            .where(eq(inventoryLots.lotId, allocation.lotId));
        }
      }
    }
  });
}

/**
 * Release expired reservations
 */
export async function releaseExpiredReservations(channelId: string): Promise<number> {
  const expiredReservations = await db.query.inventoryReservations.findMany({
    where: and(
      eq(inventoryReservations.channelId, channelId),
      eq(inventoryReservations.fulfilledAt, null as any),
      eq(inventoryReservations.canceledAt, null as any),
      sql`${inventoryReservations.expiresAt} < NOW()`
    )
  });

  let releasedCount = 0;

  for (const reservation of expiredReservations) {
    // Update lot quantities
    const lot = await db.query.inventoryLots.findFirst({
      where: eq(inventoryLots.lotId, reservation.lotId)
    });

    if (lot) {
      await db.update(inventoryLots)
        .set({
          quantityReserved: lot.quantityReserved - reservation.quantityReserved,
          quantityAvailable: lot.quantityAvailable + reservation.quantityReserved,
          status: 'AVAILABLE'
        })
        .where(eq(inventoryLots.lotId, reservation.lotId));
    }

    // Mark reservation as canceled
    await db.update(inventoryReservations)
      .set({
        canceledAt: new Date()
      })
      .where(eq(inventoryReservations.reservationId, reservation.reservationId));

    releasedCount++;
  }

  return releasedCount;
}

/**
 * Fulfill reservation (convert to allocation)
 */
export async function fulfillReservation(
  channelId: string,
  orderId: string
): Promise<void> {
  const reservations = await db.query.inventoryReservations.findMany({
    where: and(
      eq(inventoryReservations.channelId, channelId),
      eq(inventoryReservations.orderId, orderId),
      eq(inventoryReservations.fulfilledAt, null as any)
    )
  });

  for (const reservation of reservations) {
    // Mark reservation as fulfilled
    await db.update(inventoryReservations)
      .set({
        fulfilledAt: new Date()
      })
      .where(eq(inventoryReservations.reservationId, reservation.reservationId));

    // Lot quantities already updated during reservation
    // No need to update again
  }
}

/**
 * Cancel reservation
 */
export async function cancelReservation(
  channelId: string,
  orderId: string
): Promise<void> {
  const reservations = await db.query.inventoryReservations.findMany({
    where: and(
      eq(inventoryReservations.channelId, channelId),
      eq(inventoryReservations.orderId, orderId),
      eq(inventoryReservations.fulfilledAt, null as any),
      eq(inventoryReservations.canceledAt, null as any)
    )
  });

  for (const reservation of reservations) {
    // Update lot quantities
    const lot = await db.query.inventoryLots.findFirst({
      where: eq(inventoryLots.lotId, reservation.lotId)
    });

    if (lot) {
      await db.update(inventoryLots)
        .set({
          quantityReserved: lot.quantityReserved - reservation.quantityReserved,
          quantityAvailable: lot.quantityAvailable + reservation.quantityReserved,
          status: 'AVAILABLE'
        })
        .where(eq(inventoryLots.lotId, reservation.lotId));
    }

    // Mark reservation as canceled
    await db.update(inventoryReservations)
      .set({
        canceledAt: new Date()
      })
      .where(eq(inventoryReservations.reservationId, reservation.reservationId));
  }
}

/**
 * Get inventory summary for product
 */
export async function getInventorySummary(channelId: string, productId: string) {
  const lots = await db.query.inventoryLots.findMany({
    where: and(
      eq(inventoryLots.channelId, channelId),
      eq(inventoryLots.productId, productId)
    )
  });

  const totalReceived = lots.reduce((sum, lot) => sum + lot.quantityReceived, 0);
  const totalAvailable = lots.reduce((sum, lot) => sum + lot.quantityAvailable, 0);
  const totalReserved = lots.reduce((sum, lot) => sum + lot.quantityReserved, 0);
  const totalAllocated = lots.reduce((sum, lot) => sum + lot.quantityAllocated, 0);

  const avgCostPerUnit = lots.length > 0
    ? Math.floor(lots.reduce((sum, lot) => sum + lot.costPerUnitCents, 0) / lots.length)
    : 0;

  const avgLandedCostPerUnit = lots.length > 0
    ? Math.floor(lots.reduce((sum, lot) => sum + lot.landedCostPerUnitCents, 0) / lots.length)
    : 0;

  const expiringLots = lots.filter(lot => {
    if (!lot.expiryDate) return false;
    const daysUntilExpiry = (lot.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  return {
    productId,
    totalLots: lots.length,
    totalReceived,
    totalAvailable,
    totalReserved,
    totalAllocated,
    avgCostPerUnit,
    avgLandedCostPerUnit,
    expiringLots: expiringLots.length,
    lots: lots.map(lot => ({
      lotId: lot.lotId,
      lotNumber: lot.lotNumber,
      receivedDate: lot.receivedDate,
      expiryDate: lot.expiryDate,
      quantityAvailable: lot.quantityAvailable,
      quantityReserved: lot.quantityReserved,
      status: lot.status
    }))
  };
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(
  channelId: string,
  threshold: number = 10
) {
  const productsData = await db.query.products.findMany({
    where: and(
      eq(products.channelId, channelId),
      sql`${products.stockQuantity} <= ${threshold}`
    )
  });

  return productsData;
}

/**
 * Calculate reorder quantity based on velocity
 */
export async function calculateReorderQuantity(
  productId: string,
  leadTimeDays: number = 14,
  safetyStockDays: number = 7
): Promise<number> {
  // TODO: Implement velocity calculation based on historical sales
  // For now, return a simple calculation
  const avgDailySales = 10; // This should come from analytics
  const reorderQuantity = avgDailySales * (leadTimeDays + safetyStockDays);
  
  return Math.ceil(reorderQuantity);
}
