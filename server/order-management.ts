/**
 * Order Management Service
 * Complete order lifecycle management with Stripe integration
 * Aligned with existing schema (orders, orderItems, fulfillmentTasks)
 */

import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import { orders, orderItems, fulfillmentTasks } from "../drizzle/schema";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover" as any,
});

// ============================================================================
// Order Creation
// ============================================================================

export async function createOrder(data: {
  channelId: string;
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  shippingAddress?: any;
  billingAddress?: any;
  subtotal: string;
  tax?: string;
  shipping?: string;
  total: string;
  currency?: string;
  items: Array<{
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    price: string;
  }>;
  showId?: string;
  hostId?: string;
}) {
  const db = await getDb();
  
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create order
  await db.insert(orders).values({
    id: orderId,
    channelId: data.channelId,
    orderNumber: data.orderNumber,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    shippingAddress: data.shippingAddress,
    billingAddress: data.billingAddress,
    subtotal: data.subtotal,
    tax: data.tax || "0.00",
    shipping: data.shipping || "0.00",
    total: data.total,
    currency: data.currency || "USD",
    status: "pending",
    paymentStatus: "pending",
    fulfillmentStatus: "unfulfilled",
    showId: data.showId,
    hostId: data.hostId,
  });
  
  // Create order items
  for (const item of data.items) {
    const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.insert(orderItems).values({
      id: itemId,
      orderId,
      productId: item.productId,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: (parseFloat(item.price) * item.quantity).toFixed(2),
    });
  }
  
  return { orderId };
}

// ============================================================================
// Stripe Payment Integration
// ============================================================================

export async function createPaymentIntent(orderId: string) {
  const db = await getDb();
  
  const [order] = await db.select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  
  if (!order) {
    throw new Error("Order not found");
  }
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(parseFloat(order.total) * 100),
    currency: order.currency.toLowerCase(),
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
    },
  });
  
  // Update order with payment intent ID
  await db.update(orders)
    .set({
      stripePaymentIntentId: paymentIntent.id,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));
  
  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

export async function confirmPayment(orderId: string) {
  const db = await getDb();
  
  await db.update(orders)
    .set({
      paymentStatus: "paid",
      paidAt: new Date(),
      status: "processing",
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));
  
  return { success: true };
}

// ============================================================================
// Order Management
// ============================================================================

export async function getOrder(orderId: string) {
  const db = await getDb();
  
  const [order] = await db.select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  
  if (!order) {
    throw new Error("Order not found");
  }
  
  const items = await db.select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
  
  return {
    ...order,
    items,
  };
}

export async function listOrders(filters: {
  channelId?: string;
  status?: string;
  paymentStatus?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  
  let query = db.select().from(orders);
  
  const conditions = [];
  
  if (filters.channelId) {
    conditions.push(eq(orders.channelId, filters.channelId));
  }
  
  if (filters.status) {
    conditions.push(eq(orders.status, filters.status as any));
  }
  
  if (filters.paymentStatus) {
    conditions.push(eq(orders.paymentStatus, filters.paymentStatus as any));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  query = query.orderBy(desc(orders.createdAt)) as any;
  
  if (filters.limit) {
    query = query.limit(filters.limit) as any;
  }
  
  if (filters.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  return await query;
}

export async function updateOrderStatus(orderId: string, status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded") {
  const db = await getDb();
  
  await db.update(orders)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));
  
  return { success: true };
}

// ============================================================================
// Refunds
// ============================================================================

export async function processRefund(orderId: string, amount?: number, reason?: string) {
  const db = await getDb();
  
  const [order] = await db.select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  
  if (!order) {
    throw new Error("Order not found");
  }
  
  if (!order.stripePaymentIntentId) {
    throw new Error("No payment intent found for this order");
  }
  
  const refundAmount = amount || Math.round(parseFloat(order.total) * 100);
  
  const refund = await stripe.refunds.create({
    payment_intent: order.stripePaymentIntentId,
    amount: refundAmount,
    reason: reason as any || "requested_by_customer",
  });
  
  await db.update(orders)
    .set({
      status: "refunded",
      paymentStatus: "refunded",
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));
  
  return { refundId: refund.id, amount: refund.amount };
}

// ============================================================================
// Order Analytics
// ============================================================================

export async function getOrderAnalytics(channelId?: string) {
  const db = await getDb();
  
  let query = db.select({
    totalOrders: sql<number>`COUNT(*)`,
    totalRevenue: sql<number>`SUM(${orders.total})`,
    avgOrderValue: sql<number>`AVG(${orders.total})`,
  }).from(orders);
  
  if (channelId) {
    query = query.where(eq(orders.channelId, channelId)) as any;
  }
  
  const [stats] = await query;
  
  return stats;
}
