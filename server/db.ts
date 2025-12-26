import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import {
  InsertUser,
  users,
  channels,
  channelAccounts,
  products,
  productVariants,
  productImages,
  inventory,
  inventoryReservations,
  inventoryAdjustments,
  variantBinMappings,
  orders,
  orderItems,
  orderRefunds,
  fulfillmentTasks,
  fulfillmentEvents,
  packingSessions,
  packingSessionItems,
  shipments,
  warehouses,
  zones,
  bins,
  shippingProviderAccounts,
  carrierAccounts,
  liveSessions,
  pinnedProducts,
  liveScripts,
  liveScriptNodes,
  creators,
  creatorAccessTokens,
  creatorTiers,
  creatorBankAccounts,
  attributionClicks,
  creatorPayoutBatches,
  creatorPayoutLines,
  disputes,
  reviewQueueItems,
  tasks,
  incidents,
  auditLog,
  printJobs,
  settlements,
  settlementLines,
  notificationsOutbox,
  appSettings,
  secrets,
  suppliers,
  supplierProducts,
  purchaseOrders,
  purchaseOrderItems,
  adminUsers,
  staffApiKeys,
} from "../drizzle/schema";
import { ENV } from './_core/env';

/**
 * Live Shopping Network - Complete Database Layer
 * Comprehensive database helpers for all platform features
 */

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// CHANNELS & MULTI-TENANT
// ============================================================================

export async function getChannels() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(channels).orderBy(desc(channels.createdAt));
}

export async function getChannel(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(channels).where(eq(channels.id, id)).limit(1);
  return result[0] || null;
}

export async function createChannel(data: { slug: string; name: string; settings?: any }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const id = nanoid();
  await db.insert(channels).values({
    id,
    slug: data.slug,
    name: data.name,
    settings: data.settings,
    status: "active",
  });
  
  return await getChannel(id);
}

export async function updateChannel(data: { id: string; name?: string; status?: "active" | "disabled"; settings?: any }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.status) updateData.status = data.status;
  if (data.settings) updateData.settings = data.settings;
  
  await db.update(channels).set(updateData).where(eq(channels.id, data.id));
  return await getChannel(data.id);
}

// ============================================================================
// PRODUCTS & INVENTORY
// ============================================================================

export async function getProducts(params: { channelId: string; status?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(products).where(eq(products.channelId, params.channelId));
  
  if (params.status) {
    query = query.where(eq(products.status, params.status as any));
  }
  
  return await query.limit(params.limit || 50).offset(params.offset || 0).orderBy(desc(products.createdAt));
}

export async function getProduct(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0] || null;
}

export async function createProduct(data: {
  channelId: string;
  sku: string;
  name: string;
  description?: string;
  price: string;
  compareAtPrice?: string;
  cost?: string;
  imageUrl?: string;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const id = nanoid();
  await db.insert(products).values({
    id,
    ...data,
    status: "active",
  });
  
  return await getProduct(id);
}

export async function updateProduct(data: {
  id: string;
  name?: string;
  description?: string;
  price?: string;
  status?: "active" | "draft" | "archived";
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price) updateData.price = data.price;
  if (data.status) updateData.status = data.status;
  if (data.metadata) updateData.metadata = data.metadata;
  
  await db.update(products).set(updateData).where(eq(products.id, data.id));
  return await getProduct(data.id);
}

export async function getProductInventory(productId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(inventory).where(eq(inventory.productId, productId));
}

// ============================================================================
// ORDERS & FULFILLMENT
// ============================================================================

export async function getOrders(params: { channelId?: string; status?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(orders);
  
  if (params.channelId) {
    query = query.where(eq(orders.channelId, params.channelId));
  }
  
  if (params.status) {
    query = query.where(eq(orders.status, params.status as any));
  }
  
  return await query.limit(params.limit || 50).offset(params.offset || 0).orderBy(desc(orders.createdAt));
}

export async function getOrder(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0] || null;
}

export async function createOrder(data: {
  channelId: string;
  orderNumber: string;
  platformOrderId?: string;
  customerName?: string;
  customerEmail?: string;
  shippingAddress: any;
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
    total: string;
  }>;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const orderId = nanoid();
  
  // Create order
  await db.insert(orders).values({
    id: orderId,
    channelId: data.channelId,
    orderNumber: data.orderNumber,
    platformOrderId: data.platformOrderId,
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
    metadata: data.metadata,
  });
  
  // Create order items
  for (const item of data.items) {
    await db.insert(orderItems).values({
      id: nanoid(),
      orderId,
      productId: item.productId,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
      fulfillmentStatus: "unfulfilled",
    });
  }
  
  return await getOrder(orderId);
}

export async function updateOrderStatus(data: { id: string; status: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(orders).set({ status: data.status as any }).where(eq(orders.id, data.id));
  return await getOrder(data.id);
}

export async function getOrderItems(orderId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

// ============================================================================
// WAREHOUSE & FULFILLMENT
// ============================================================================

export async function getWarehouses() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(warehouses).orderBy(desc(warehouses.createdAt));
}

export async function getWarehouse(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(warehouses).where(eq(warehouses.id, id)).limit(1);
  return result[0] || null;
}

export async function getZones(warehouseId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(zones).where(eq(zones.warehouseId, warehouseId));
}

export async function getBins(zoneId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bins).where(eq(bins.zoneId, zoneId));
}

export async function getFulfillmentTasks(params: { warehouseId?: string; status?: string; taskType?: string; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(fulfillmentTasks);
  
  if (params.warehouseId) {
    query = query.where(eq(fulfillmentTasks.warehouseId, params.warehouseId));
  }
  
  if (params.status) {
    query = query.where(eq(fulfillmentTasks.status, params.status as any));
  }
  
  if (params.taskType) {
    query = query.where(eq(fulfillmentTasks.taskType, params.taskType as any));
  }
  
  return await query.limit(params.limit || 50).orderBy(desc(fulfillmentTasks.createdAt));
}

export async function createFulfillmentTask(data: {
  orderId: string;
  warehouseId: string;
  taskType: "pick" | "pack" | "ship";
  priority?: number;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const id = nanoid();
  await db.insert(fulfillmentTasks).values({
    id,
    orderId: data.orderId,
    warehouseId: data.warehouseId,
    taskType: data.taskType,
    status: "pending",
    priority: data.priority || 1,
    metadata: data.metadata,
  });
  
  const result = await db.select().from(fulfillmentTasks).where(eq(fulfillmentTasks.id, id)).limit(1);
  return result[0];
}

export async function updateFulfillmentTask(data: {
  id: string;
  status: string;
  assignedTo?: string;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status: data.status };
  if (data.assignedTo) updateData.assignedTo = data.assignedTo;
  if (data.metadata) updateData.metadata = data.metadata;
  
  if (data.status === "in_progress" && !data.assignedTo) {
    updateData.startedAt = new Date();
  }
  
  if (data.status === "completed") {
    updateData.completedAt = new Date();
  }
  
  await db.update(fulfillmentTasks).set(updateData).where(eq(fulfillmentTasks.id, data.id));
  
  const result = await db.select().from(fulfillmentTasks).where(eq(fulfillmentTasks.id, data.id)).limit(1);
  return result[0];
}

// ============================================================================
// LIVE SHOPPING
// ============================================================================

export async function getLiveSessions(params: { channelId?: string; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(liveSessions);
  
  if (params.channelId) {
    query = query.where(eq(liveSessions.channelId, params.channelId));
  }
  
  if (params.status) {
    query = query.where(eq(liveSessions.status, params.status as any));
  }
  
  return await query.orderBy(desc(liveSessions.createdAt));
}

export async function getLiveSession(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(liveSessions).where(eq(liveSessions.id, id)).limit(1);
  return result[0] || null;
}

export async function getLiveSessionBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(liveSessions).where(eq(liveSessions.slug, slug)).limit(1);
  return result[0] || null;
}

export async function createLiveSession(data: {
  channelId: string;
  slug: string;
  title: string;
  description?: string;
  streamUrl?: string;
  thumbnailUrl?: string;
  scheduledAt?: Date;
  creatorId?: string;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const id = nanoid();
  await db.insert(liveSessions).values({
    id,
    ...data,
    status: "scheduled",
    viewerCount: 0,
  });
  
  return await getLiveSession(id);
}

export async function updateLiveSession(data: {
  id: string;
  status?: "scheduled" | "live" | "ended" | "cancelled";
  viewerCount?: number;
  streamUrl?: string;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = {};
  if (data.status) {
    updateData.status = data.status;
    if (data.status === "live" && !updateData.startedAt) {
      updateData.startedAt = new Date();
    }
    if (data.status === "ended" && !updateData.endedAt) {
      updateData.endedAt = new Date();
    }
  }
  if (data.viewerCount !== undefined) updateData.viewerCount = data.viewerCount;
  if (data.streamUrl) updateData.streamUrl = data.streamUrl;
  if (data.metadata) updateData.metadata = data.metadata;
  
  await db.update(liveSessions).set(updateData).where(eq(liveSessions.id, data.id));
  return await getLiveSession(data.id);
}

export async function getPinnedProducts(liveSessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(pinnedProducts).where(eq(pinnedProducts.liveSessionId, liveSessionId)).orderBy(desc(pinnedProducts.pinnedAt));
}

export async function pinProduct(data: { liveSessionId: string; productId: string; livePrice?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Unpin all current products
  await db.update(pinnedProducts)
    .set({ isActive: false, unpinnedAt: new Date() })
    .where(and(
      eq(pinnedProducts.liveSessionId, data.liveSessionId),
      eq(pinnedProducts.isActive, true)
    ));
  
  // Pin new product
  const id = nanoid();
  await db.insert(pinnedProducts).values({
    id,
    liveSessionId: data.liveSessionId,
    productId: data.productId,
    livePrice: data.livePrice,
    isActive: true,
    salesCount: 0,
  });
  
  const result = await db.select().from(pinnedProducts).where(eq(pinnedProducts.id, id)).limit(1);
  return result[0];
}

export async function unpinProduct(pinnedProductId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(pinnedProducts)
    .set({ isActive: false, unpinnedAt: new Date() })
    .where(eq(pinnedProducts.id, pinnedProductId));
  
  return { success: true };
}

export async function getCurrentLiveSession() {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(liveSessions)
    .where(eq(liveSessions.status, "live"))
    .orderBy(desc(liveSessions.startedAt))
    .limit(1);
  
  return result[0] || null;
}

// ============================================================================
// CREATORS & ATTRIBUTION
// ============================================================================

export async function getCreators(params: { status?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(creators);
  
  if (params.status) {
    query = query.where(eq(creators.status, params.status as any));
  }
  
  return await query.orderBy(desc(creators.createdAt));
}

export async function getCreator(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(creators).where(eq(creators.id, id)).limit(1);
  return result[0] || null;
}

export async function createCreator(data: {
  name: string;
  email: string;
  phone?: string;
  commissionRate?: string;
  socialLinks?: any;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const id = nanoid();
  await db.insert(creators).values({
    id,
    ...data,
    status: "active",
  });
  
  return await getCreator(id);
}

export async function updateCreator(data: {
  id: string;
  name?: string;
  status?: "active" | "inactive" | "suspended";
  commissionRate?: string;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.status) updateData.status = data.status;
  if (data.commissionRate) updateData.commissionRate = data.commissionRate;
  if (data.metadata) updateData.metadata = data.metadata;
  
  await db.update(creators).set(updateData).where(eq(creators.id, data.id));
  return await getCreator(data.id);
}

export async function getCreatorPayouts(creatorId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(creatorPayoutLines)
    .where(eq(creatorPayoutLines.creatorId, creatorId))
    .orderBy(desc(creatorPayoutLines.createdAt));
}

// ============================================================================
// DISPUTES & PAYMENT
// ============================================================================

export async function getDisputes(params: { channelId?: string; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(disputes);
  
  if (params.channelId) {
    query = query.where(eq(disputes.channelId, params.channelId));
  }
  
  if (params.status) {
    query = query.where(eq(disputes.status, params.status as any));
  }
  
  return await query.orderBy(desc(disputes.createdAt));
}

export async function getDispute(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(disputes).where(eq(disputes.id, id)).limit(1);
  return result[0] || null;
}

export async function updateDisputeStatus(data: { id: string; status: string; needsManual?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status: data.status };
  if (data.needsManual !== undefined) updateData.needsManual = data.needsManual;
  
  await db.update(disputes).set(updateData).where(eq(disputes.id, data.id));
  return await getDispute(data.id);
}

// ============================================================================
// OPERATIONS & MONITORING
// ============================================================================

export async function getReviewQueueItems(params: { channelId?: string; status?: string; severity?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(reviewQueueItems);
  
  if (params.channelId) {
    query = query.where(eq(reviewQueueItems.channelId, params.channelId));
  }
  
  if (params.status) {
    query = query.where(eq(reviewQueueItems.status, params.status as any));
  }
  
  if (params.severity) {
    query = query.where(eq(reviewQueueItems.severity, params.severity as any));
  }
  
  return await query.orderBy(desc(reviewQueueItems.createdAt));
}

export async function getTasks(params: { channelId?: string; status?: string; assignedTo?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(tasks);
  
  if (params.channelId) {
    query = query.where(eq(tasks.channelId, params.channelId));
  }
  
  if (params.status) {
    query = query.where(eq(tasks.status, params.status as any));
  }
  
  if (params.assignedTo) {
    query = query.where(eq(tasks.assignedTo, params.assignedTo));
  }
  
  return await query.orderBy(desc(tasks.createdAt));
}

export async function createTask(data: {
  channelId: string;
  taskType: string;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  assignedTo?: string;
  dueAt?: Date;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const id = nanoid();
  await db.insert(tasks).values({
    id,
    ...data,
    status: "todo",
    priority: data.priority || "medium",
  });
  
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result[0];
}

export async function getIncidents(params: { channelId?: string; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(incidents);
  
  if (params.channelId) {
    query = query.where(eq(incidents.channelId, params.channelId));
  }
  
  if (params.status) {
    query = query.where(eq(incidents.status, params.status as any));
  }
  
  return await query.orderBy(desc(incidents.createdAt));
}

export async function createIncident(data: {
  channelId: string;
  incidentType: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description?: string;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const id = nanoid();
  await db.insert(incidents).values({
    id,
    ...data,
    status: "open",
  });
  
  const result = await db.select().from(incidents).where(eq(incidents.id, id)).limit(1);
  return result[0];
}

export async function getOperationsDashboard() {
  const db = await getDb();
  if (!db) return null;
  
  // Get counts for various operational metrics
  const [openTasks] = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, "todo"));
  const [openIncidents] = await db.select({ count: sql<number>`count(*)` }).from(incidents).where(eq(incidents.status, "open"));
  const [openDisputes] = await db.select({ count: sql<number>`count(*)` }).from(disputes).where(eq(disputes.status, "open"));
  const [pendingOrders] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, "pending"));
  
  return {
    openTasks: openTasks?.count || 0,
    openIncidents: openIncidents?.count || 0,
    openDisputes: openDisputes?.count || 0,
    pendingOrders: pendingOrders?.count || 0,
  };
}

// ============================================================================
// SETTLEMENTS & RECONCILIATION
// ============================================================================

export async function getSettlements(params: { channelId?: string; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(settlements);
  
  if (params.channelId) {
    query = query.where(eq(settlements.channelId, params.channelId));
  }
  
  if (params.status) {
    query = query.where(eq(settlements.status, params.status as any));
  }
  
  return await query.orderBy(desc(settlements.settlementDate));
}

export async function getSettlement(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(settlements).where(eq(settlements.id, id)).limit(1);
  return result[0] || null;
}

export async function importSettlement(data: { channelId: string; platform: string; settlementData: any }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const id = nanoid();
  await db.insert(settlements).values({
    id,
    channelId: data.channelId,
    platform: data.platform,
    settlementId: data.settlementData.settlementId || nanoid(),
    settlementDate: new Date(data.settlementData.settlementDate),
    totalAmount: data.settlementData.totalAmount,
    currency: data.settlementData.currency || "USD",
    status: "pending",
    rawData: data.settlementData,
  });
  
  return await getSettlement(id);
}

// ============================================================================
// SUPPLIERS & PROCUREMENT
// ============================================================================

export async function getSuppliers(params: { status?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(suppliers);
  
  if (params.status) {
    query = query.where(eq(suppliers.status, params.status as any));
  }
  
  return await query.orderBy(desc(suppliers.createdAt));
}

export async function getSupplier(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return result[0] || null;
}

export async function createSupplier(data: {
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  paymentTerms?: string;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const id = nanoid();
  await db.insert(suppliers).values({
    id,
    ...data,
    status: "active",
  });
  
  return await getSupplier(id);
}

export async function getPurchaseOrders(params: { supplierId?: string }) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(purchaseOrders);
  
  if (params.supplierId) {
    query = query.where(eq(purchaseOrders.supplierId, params.supplierId));
  }
  
  return await query.orderBy(desc(purchaseOrders.createdAt));
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

export async function getAnalyticsOverview(params: { channelId?: string; startDate?: Date; endDate?: Date }) {
  const db = await getDb();
  if (!db) return null;
  
  const conditions = [];
  if (params.channelId) conditions.push(eq(orders.channelId, params.channelId));
  if (params.startDate) conditions.push(gte(orders.createdAt, params.startDate));
  if (params.endDate) conditions.push(lte(orders.createdAt, params.endDate));
  
  let query = db.select({
    totalOrders: sql<number>`count(*)`,
    totalRevenue: sql<string>`sum(${orders.total})`,
  }).from(orders);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  const [result] = await query;
  
  return {
    totalOrders: result?.totalOrders || 0,
    totalRevenue: result?.totalRevenue || "0.00",
  };
}

export async function getSalesAnalytics(params: { channelId?: string; startDate: Date; endDate: Date }) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [
    gte(orders.createdAt, params.startDate),
    lte(orders.createdAt, params.endDate)
  ];
  
  if (params.channelId) {
    conditions.push(eq(orders.channelId, params.channelId));
  }
  
  const query = db.select({
    date: sql<string>`DATE(${orders.createdAt})`,
    orders: sql<number>`count(*)`,
    revenue: sql<string>`sum(${orders.total})`,
  })
  .from(orders)
  .where(and(...conditions))
  .groupBy(sql`DATE(${orders.createdAt})`);
  
  return await query;
}

export async function getInventoryAnalytics(params: { warehouseId?: string }) {
  const db = await getDb();
  if (!db) return null;
  
  let query = db.select({
    totalProducts: sql<number>`count(DISTINCT ${inventory.productId})`,
    totalOnHand: sql<number>`sum(${inventory.onHand})`,
    totalAvailable: sql<number>`sum(${inventory.available})`,
    totalReserved: sql<number>`sum(${inventory.reserved})`,
  }).from(inventory);
  
  if (params.warehouseId) {
    query = query.where(eq(inventory.warehouseId, params.warehouseId));
  }
  
  const [result] = await query;
  
  return {
    totalProducts: result?.totalProducts || 0,
    totalOnHand: result?.totalOnHand || 0,
    totalAvailable: result?.totalAvailable || 0,
    totalReserved: result?.totalReserved || 0,
  };
}
