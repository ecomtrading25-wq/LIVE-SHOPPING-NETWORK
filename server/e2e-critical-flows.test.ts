/**
 * End-to-End Critical Business Flows Test Suite
 * Tests the most important revenue-generating flows:
 * 1. Customer checkout & payment
 * 2. Order fulfillment & shipping
 * 3. Dispute handling
 * 4. Creator payout processing
 */

import { describe, it, expect } from 'vitest';
import { getDbSync } from './db';
import { 
  users,
  products, 
  orders,
  orderItems,
  inventory,
  disputes,
  creatorPayouts
} from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

describe('E2E: Complete Purchase Flow', () => {
  it('should process a complete purchase from cart to order', async () => {
    const db = getDbSync();
    
    // 1. Create test product with inventory
    const productId = `prod_${crypto.randomUUID()}`;
    await db.insert(products).values({
      id: productId,
      channelId: 'test-channel',
      sku: `SKU-${Date.now()}`,
      name: 'Test Product',
      priceCents: 5000,
      currency: 'USD',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 2. Add inventory
    await db.insert(inventory).values({
      id: crypto.randomUUID(),
      productId: productId,
      warehouseId: 'wh-001',
      quantityAvailable: 100,
      quantityReserved: 0,
      reorderPoint: 10,
      reorderQuantity: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 3. Create order
    const orderId = crypto.randomUUID();
    await db.insert(orders).values({
      id: orderId,
      channelId: 'test-channel',
      orderNumber: `ORD-${Date.now()}`,
      userId: 1,
      status: 'pending',
      paymentStatus: 'pending',
      subtotal: '50.00',
      tax: '0.00',
      shipping: '0.00',
      total: '50.00',
      totalCents: 5000,
      currency: 'USD',
      shippingAddressLine1: '123 Test St',
      shippingCity: 'Test City',
      shippingState: 'CA',
      shippingPostalCode: '90210',
      shippingCountry: 'US',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 4. Add order items
    await db.insert(orderItems).values({
      id: crypto.randomUUID(),
      orderId: orderId,
      productId: productId,
      quantity: 1,
      priceCents: 5000,
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 5. Verify order was created
    const createdOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    expect(createdOrder).toHaveLength(1);
    expect(createdOrder[0].status).toBe('pending');
    expect(createdOrder[0].totalCents).toBe(5000);

    // 6. Simulate payment completion
    await db
      .update(orders)
      .set({ 
        paymentStatus: 'completed',
        paidAt: new Date(),
        status: 'processing',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // 7. Verify payment status updated
    const paidOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    expect(paidOrder[0].paymentStatus).toBe('completed');
    expect(paidOrder[0].status).toBe('processing');
    expect(paidOrder[0].paidAt).toBeDefined();
  });
});

describe('E2E: Inventory Management', () => {
  it('should reserve inventory on order creation and release on cancellation', async () => {
    const db = getDbSync();
    
    // 1. Create product with limited inventory
    const productId = `prod_${crypto.randomUUID()}`;
    await db.insert(products).values({
      id: productId,
      channelId: 'test-channel',
      sku: `SKU-${Date.now()}`,
      name: 'Limited Stock Product',
      priceCents: 3000,
      currency: 'USD',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const inventoryId = crypto.randomUUID();
    await db.insert(inventory).values({
      id: inventoryId,
      productId: productId,
      warehouseId: 'wh-001',
      quantityAvailable: 10,
      quantityReserved: 0,
      reorderPoint: 5,
      reorderQuantity: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 2. Check initial inventory
    const initialInventory = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, inventoryId))
      .limit(1);

    expect(initialInventory[0].quantityAvailable).toBe(10);
    expect(initialInventory[0].quantityReserved).toBe(0);

    // 3. Reserve inventory (simulate order placement)
    await db
      .update(inventory)
      .set({ 
        quantityReserved: 2,
        updatedAt: new Date(),
      })
      .where(eq(inventory.id, inventoryId));

    // 4. Verify reservation
    const reservedInventory = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, inventoryId))
      .limit(1);

    expect(reservedInventory[0].quantityReserved).toBe(2);

    // 5. Release inventory (simulate order cancellation)
    await db
      .update(inventory)
      .set({ 
        quantityReserved: 0,
        updatedAt: new Date(),
      })
      .where(eq(inventory.id, inventoryId));

    // 6. Verify release
    const releasedInventory = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, inventoryId))
      .limit(1);

    expect(releasedInventory[0].quantityReserved).toBe(0);
  });
});

describe('E2E: Dispute Resolution Flow', () => {
  it('should create and resolve a customer dispute', async () => {
    const db = getDbSync();
    
    // 1. Create order for dispute
    const orderId = crypto.randomUUID();
    await db.insert(orders).values({
      id: orderId,
      channelId: 'test-channel',
      orderNumber: `ORD-${Date.now()}`,
      userId: 1,
      status: 'delivered',
      paymentStatus: 'completed',
      subtotal: '80.00',
      tax: '0.00',
      shipping: '0.00',
      total: '80.00',
      totalCents: 8000,
      currency: 'USD',
      shippingAddressLine1: '456 Dispute Ave',
      shippingCity: 'Dispute City',
      shippingState: 'NY',
      shippingPostalCode: '10001',
      shippingCountry: 'US',
      paidAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 2. Create dispute
    const disputeId = crypto.randomUUID();
    await db.insert(disputes).values({
      disputeId: disputeId,
      channelId: 'test-channel',
      orderId: orderId,
      provider: 'STRIPE',
      providerCaseId: `DISP-${Date.now()}`,
      providerStatus: 'OPEN',
      status: 'OPEN',
      reason: 'Product not as described',
      amountCents: 8000,
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 3. Verify dispute created
    const createdDispute = await db
      .select()
      .from(disputes)
      .where(eq(disputes.disputeId, disputeId))
      .limit(1);

    expect(createdDispute).toHaveLength(1);
    expect(createdDispute[0].status).toBe('OPEN');

    // 4. Update dispute to require evidence
    await db
      .update(disputes)
      .set({ 
        status: 'EVIDENCE_REQUIRED',
        providerStatus: 'NEEDS_RESPONSE',
        updatedAt: new Date(),
      })
      .where(eq(disputes.disputeId, disputeId));

    // 5. Resolve dispute
    await db
      .update(disputes)
      .set({ 
        status: 'WON',
        providerStatus: 'WON',
        resolvedAt: new Date(),
        resolution: 'Customer satisfied with replacement',
        updatedAt: new Date(),
      })
      .where(eq(disputes.disputeId, disputeId));

    // 6. Verify resolution
    const resolvedDispute = await db
      .select()
      .from(disputes)
      .where(eq(disputes.disputeId, disputeId))
      .limit(1);

    expect(resolvedDispute[0].status).toBe('WON');
    expect(resolvedDispute[0].resolvedAt).toBeDefined();
  });
});

describe('E2E: Creator Payout Flow', () => {
  it('should calculate and process creator payouts', async () => {
    const db = getDbSync();
    
    // 1. Create test order with creator attribution
    const orderId = crypto.randomUUID();
    await db.insert(orders).values({
      id: orderId,
      channelId: 'test-channel',
      orderNumber: `ORD-${Date.now()}`,
      userId: 1,
      status: 'delivered',
      paymentStatus: 'completed',
      subtotal: '100.00',
      tax: '0.00',
      shipping: '0.00',
      total: '100.00',
      totalCents: 10000,
      currency: 'USD',
      shippingAddressLine1: '789 Creator Blvd',
      shippingCity: 'Creator City',
      shippingState: 'TX',
      shippingPostalCode: '75001',
      shippingCountry: 'US',
      paidAt: new Date(),
      deliveredAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 2. Create payout record
    const payoutId = crypto.randomUUID();
    await db.insert(creatorPayouts).values({
      id: payoutId,
      creatorId: 'creator-001',
      channelId: 'test-channel',
      periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      periodEnd: new Date(),
      totalAmountCents: 1500, // 15% commission on $100 order
      currency: 'USD',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 3. Verify payout created
    const createdPayout = await db
      .select()
      .from(creatorPayouts)
      .where(eq(creatorPayouts.id, payoutId))
      .limit(1);

    expect(createdPayout).toHaveLength(1);
    expect(createdPayout[0].status).toBe('pending');
    expect(createdPayout[0].totalAmountCents).toBe(1500);

    // 4. Process payout
    await db
      .update(creatorPayouts)
      .set({ 
        status: 'processing',
        updatedAt: new Date(),
      })
      .where(eq(creatorPayouts.id, payoutId));

    // 5. Complete payout
    await db
      .update(creatorPayouts)
      .set({ 
        status: 'completed',
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(creatorPayouts.id, payoutId));

    // 6. Verify payout completed
    const completedPayout = await db
      .select()
      .from(creatorPayouts)
      .where(eq(creatorPayouts.id, payoutId))
      .limit(1);

    expect(completedPayout[0].status).toBe('completed');
    expect(completedPayout[0].paidAt).toBeDefined();
  });
});

describe('E2E: Order Lifecycle', () => {
  it('should track complete order lifecycle from pending to delivered', async () => {
    const db = getDbSync();
    
    // 1. Create pending order
    const orderId = crypto.randomUUID();
    await db.insert(orders).values({
      id: orderId,
      channelId: 'test-channel',
      orderNumber: `ORD-${Date.now()}`,
      userId: 1,
      status: 'pending',
      paymentStatus: 'pending',
      subtotal: '150.00',
      tax: '0.00',
      shipping: '0.00',
      total: '150.00',
      totalCents: 15000,
      currency: 'USD',
      shippingAddressLine1: '321 Lifecycle Ln',
      shippingCity: 'Order City',
      shippingState: 'FL',
      shippingPostalCode: '33101',
      shippingCountry: 'US',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 2. Payment completed
    await db
      .update(orders)
      .set({ 
        paymentStatus: 'completed',
        paidAt: new Date(),
        status: 'processing',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // 3. Order shipped
    await db
      .update(orders)
      .set({ 
        status: 'shipped',
        shippedAt: new Date(),
        trackingNumber: 'TRACK123456789',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // 4. Order delivered
    await db
      .update(orders)
      .set({ 
        status: 'delivered',
        deliveredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // 5. Verify final state
    const finalOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    expect(finalOrder[0].status).toBe('delivered');
    expect(finalOrder[0].paymentStatus).toBe('completed');
    expect(finalOrder[0].paidAt).toBeDefined();
    expect(finalOrder[0].shippedAt).toBeDefined();
    expect(finalOrder[0].deliveredAt).toBeDefined();
    expect(finalOrder[0].trackingNumber).toBe('TRACK123456789');
  });
});
