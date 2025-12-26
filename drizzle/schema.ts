import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, boolean, json, decimal, index, uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Live Shopping Network - Complete Database Schema V4
 * Multi-tenant e-commerce platform with live shopping, warehouse management,
 * multi-channel commerce, AI automation, and competitive moat modules.
 * 
 * Based on 898+ specification files (520,683 lines)
 */

// ============================================================================
// CORE: Users & Authentication
// ============================================================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const adminUsers = mysqlTable("admin_users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: mysqlEnum("role", ["founder", "admin", "ops", "viewer"]).default("viewer").notNull(),
  capabilities: json("capabilities").$type<string[]>(),
  status: mysqlEnum("status", ["active", "disabled"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const staffApiKeys = mysqlTable("staff_api_keys", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull().references(() => adminUsers.id),
  keyHash: text("key_hash").notNull(),
  label: varchar("label", { length: 255 }),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  status: mysqlEnum("status", ["active", "revoked"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// CORE: Channels & Multi-Tenant
// ============================================================================

export const channels = mysqlTable("channels", {
  id: varchar("id", { length: 64 }).primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "disabled"]).default("active").notNull(),
  settings: json("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const channelAccounts = mysqlTable("channel_accounts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  platform: mysqlEnum("platform", ["shopify", "tiktok_shop", "amazon", "ebay", "whatnot", "custom"]).notNull(),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  credentialsEnc: text("credentials_enc"),
  credentialsMask: json("credentials_mask"),
  status: mysqlEnum("status", ["active", "disabled"]).default("active").notNull(),
  settings: json("settings"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelPlatformIdx: uniqueIndex("channel_platform_idx").on(table.channelId, table.platform),
}));

// ============================================================================
// WAREHOUSE: Locations, Zones, Bins
// ============================================================================

export const warehouses = mysqlTable("warehouses", {
  id: varchar("id", { length: 64 }).primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  status: mysqlEnum("status", ["active", "disabled"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const zones = mysqlTable("zones", {
  id: varchar("id", { length: 64 }).primaryKey(),
  warehouseId: varchar("warehouse_id", { length: 64 }).notNull().references(() => warehouses.id),
  code: varchar("code", { length: 32 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  zoneType: mysqlEnum("zone_type", ["pick", "pack", "storage", "receiving"]).notNull(),
  status: mysqlEnum("status", ["active", "disabled"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  warehouseCodeIdx: uniqueIndex("warehouse_code_idx").on(table.warehouseId, table.code),
}));

export const bins = mysqlTable("bins", {
  id: varchar("id", { length: 64 }).primaryKey(),
  zoneId: varchar("zone_id", { length: 64 }).notNull().references(() => zones.id),
  code: varchar("code", { length: 32 }).notNull(),
  name: varchar("name", { length: 255 }),
  row: int("row"),
  col: int("col"),
  level: int("level"),
  status: mysqlEnum("status", ["active", "disabled"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  zoneCodeIdx: uniqueIndex("zone_code_idx").on(table.zoneId, table.code),
}));

// ============================================================================
// PRODUCTS & INVENTORY
// ============================================================================

export const products = mysqlTable("products", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  sku: varchar("sku", { length: 128 }).notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  status: mysqlEnum("status", ["active", "draft", "archived"]).default("active").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelSkuIdx: uniqueIndex("channel_sku_idx").on(table.channelId, table.sku),
}));

export const productVariants = mysqlTable("product_variants", {
  id: varchar("id", { length: 64 }).primaryKey(),
  productId: varchar("product_id", { length: 64 }).notNull().references(() => products.id),
  sku: varchar("sku", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 500 }),
  price: decimal("price", { precision: 10, scale: 2 }),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  options: json("options"),
  status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const productImages = mysqlTable("product_images", {
  id: varchar("id", { length: 64 }).primaryKey(),
  productId: varchar("product_id", { length: 64 }).notNull().references(() => products.id),
  url: text("url").notNull(),
  position: int("position").default(0).notNull(),
  altText: text("alt_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inventory = mysqlTable("inventory", {
  id: varchar("id", { length: 64 }).primaryKey(),
  warehouseId: varchar("warehouse_id", { length: 64 }).notNull().references(() => warehouses.id),
  productId: varchar("product_id", { length: 64 }).notNull().references(() => products.id),
  available: int("available").notNull().default(0),
  reserved: int("reserved").notNull().default(0),
  onHand: int("on_hand").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  warehouseProductIdx: uniqueIndex("warehouse_product_idx").on(table.warehouseId, table.productId),
}));

export const inventoryReservations = mysqlTable("inventory_reservations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  inventoryId: varchar("inventory_id", { length: 64 }).notNull().references(() => inventory.id),
  orderId: varchar("order_id", { length: 64 }).notNull(),
  quantity: int("quantity").notNull(),
  expiresAt: timestamp("expires_at"),
  status: mysqlEnum("status", ["active", "released", "fulfilled"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inventoryAdjustments = mysqlTable("inventory_adjustments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  inventoryId: varchar("inventory_id", { length: 64 }).notNull().references(() => inventory.id),
  adjustmentType: mysqlEnum("adjustment_type", ["recount", "damage", "loss", "found", "correction"]).notNull(),
  quantityChange: int("quantity_change").notNull(),
  reason: text("reason"),
  performedBy: varchar("performed_by", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const variantBinMappings = mysqlTable("variant_bin_mappings", {
  id: varchar("id", { length: 64 }).primaryKey(),
  productId: varchar("product_id", { length: 64 }).notNull().references(() => products.id),
  binId: varchar("bin_id", { length: 64 }).notNull().references(() => bins.id),
  priority: int("priority").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  productBinIdx: uniqueIndex("product_bin_idx").on(table.productId, table.binId),
}));

// ============================================================================
// SUPPLIERS & PROCUREMENT
// ============================================================================

export const suppliers = mysqlTable("suppliers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactEmail: varchar("contact_email", { length: 320 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  address: text("address"),
  creditScore: decimal("credit_score", { precision: 5, scale: 2 }),
  paymentTerms: varchar("payment_terms", { length: 128 }),
  status: mysqlEnum("status", ["active", "suspended", "inactive"]).default("active").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const supplierProducts = mysqlTable("supplier_products", {
  id: varchar("id", { length: 64 }).primaryKey(),
  supplierId: varchar("supplier_id", { length: 64 }).notNull().references(() => suppliers.id),
  productId: varchar("product_id", { length: 64 }).notNull().references(() => products.id),
  supplierSku: varchar("supplier_sku", { length: 128 }),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  leadTimeDays: int("lead_time_days"),
  moq: int("moq").default(1),
  status: mysqlEnum("status", ["active", "discontinued"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  supplierProductIdx: uniqueIndex("supplier_product_idx").on(table.supplierId, table.productId),
}));

export const purchaseOrders = mysqlTable("purchase_orders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  supplierId: varchar("supplier_id", { length: 64 }).notNull().references(() => suppliers.id),
  poNumber: varchar("po_number", { length: 128 }).notNull().unique(),
  status: mysqlEnum("status", ["draft", "submitted", "confirmed", "shipped", "received", "cancelled"]).default("draft").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  receivedAt: timestamp("received_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const purchaseOrderItems = mysqlTable("purchase_order_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  purchaseOrderId: varchar("purchase_order_id", { length: 64 }).notNull().references(() => purchaseOrders.id),
  productId: varchar("product_id", { length: 64 }).notNull().references(() => products.id),
  quantity: int("quantity").notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  receivedQuantity: int("received_quantity").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// ORDERS & FULFILLMENT
// ============================================================================

export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  orderNumber: varchar("order_number", { length: 128 }).notNull(),
  platformOrderId: varchar("platform_order_id", { length: 255 }),
  customerName: varchar("customer_name", { length: 255 }),
  customerEmail: varchar("customer_email", { length: 320 }),
  shippingAddress: json("shipping_address"),
  billingAddress: json("billing_address"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0.00").notNull(),
  shipping: decimal("shipping", { precision: 10, scale: 2 }).default("0.00").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]).default("pending").notNull(),
  paymentStatus: mysqlEnum("payment_status", ["pending", "paid", "refunded", "failed"]).default("pending").notNull(),
  fulfillmentStatus: mysqlEnum("fulfillment_status", ["unfulfilled", "partial", "fulfilled"]).default("unfulfilled").notNull(),
  liveSessionId: varchar("live_session_id", { length: 64 }),
  attributionWindow: int("attribution_window"),
  notes: text("notes"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelOrderNumberIdx: uniqueIndex("channel_order_number_idx").on(table.channelId, table.orderNumber),
  platformOrderIdIdx: index("platform_order_id_idx").on(table.platformOrderId),
}));

export const orderItems = mysqlTable("order_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("order_id", { length: 64 }).notNull().references(() => orders.id),
  productId: varchar("product_id", { length: 64 }).notNull().references(() => products.id),
  sku: varchar("sku", { length: 128 }).notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  quantity: int("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  fulfillmentStatus: mysqlEnum("fulfillment_status", ["unfulfilled", "fulfilled", "cancelled"]).default("unfulfilled").notNull(),
  platformLineId: varchar("platform_line_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderRefunds = mysqlTable("order_refunds", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("order_id", { length: 64 }).notNull().references(() => orders.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "processed", "failed"]).default("pending").notNull(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fulfillmentTasks = mysqlTable("fulfillment_tasks", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("order_id", { length: 64 }).notNull().references(() => orders.id),
  warehouseId: varchar("warehouse_id", { length: 64 }).notNull().references(() => warehouses.id),
  taskType: mysqlEnum("task_type", ["pick", "pack", "ship"]).notNull(),
  status: mysqlEnum("status", ["pending", "assigned", "in_progress", "completed", "failed"]).default("pending").notNull(),
  assignedTo: varchar("assigned_to", { length: 64 }),
  priority: int("priority").default(1).notNull(),
  dueAt: timestamp("due_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orderWarehouseIdx: index("order_warehouse_idx").on(table.orderId, table.warehouseId),
  statusIdx: index("status_idx").on(table.status),
}));

export const fulfillmentEvents = mysqlTable("fulfillment_events", {
  id: varchar("id", { length: 64 }).primaryKey(),
  taskId: varchar("task_id", { length: 64 }).notNull().references(() => fulfillmentTasks.id),
  eventType: varchar("event_type", { length: 128 }).notNull(),
  eventData: json("event_data"),
  performedBy: varchar("performed_by", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const packingSessions = mysqlTable("packing_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  warehouseId: varchar("warehouse_id", { length: 64 }).notNull().references(() => warehouses.id),
  userId: varchar("user_id", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).default("active").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const packingSessionItems = mysqlTable("packing_session_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  sessionId: varchar("session_id", { length: 64 }).notNull().references(() => packingSessions.id),
  orderItemId: varchar("order_item_id", { length: 64 }).notNull().references(() => orderItems.id),
  scannedAt: timestamp("scanned_at").defaultNow().notNull(),
});

export const shipments = mysqlTable("shipments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  orderId: varchar("order_id", { length: 64 }).notNull().references(() => orders.id),
  warehouseId: varchar("warehouse_id", { length: 64 }).notNull().references(() => warehouses.id),
  carrier: varchar("carrier", { length: 128 }),
  service: varchar("service", { length: 128 }),
  trackingNumber: varchar("tracking_number", { length: 255 }),
  trackingUrl: text("tracking_url"),
  labelUrl: text("label_url"),
  status: mysqlEnum("status", ["pending", "label_created", "picked_up", "in_transit", "delivered", "failed"]).default("pending").notNull(),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// SHIPPING PROVIDERS
// ============================================================================

export const shippingProviderAccounts = mysqlTable("shipping_provider_accounts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  warehouseId: varchar("warehouse_id", { length: 64 }).notNull().references(() => warehouses.id),
  provider: mysqlEnum("provider", ["sendle", "auspost", "aramex"]).notNull(),
  label: varchar("label", { length: 255 }),
  credentialsEnc: text("credentials_enc"),
  credentialsMask: json("credentials_mask"),
  settings: json("settings"),
  status: mysqlEnum("status", ["active", "disabled"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  warehouseProviderIdx: uniqueIndex("warehouse_provider_idx").on(table.warehouseId, table.provider),
}));

export const carrierAccounts = mysqlTable("carrier_accounts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  warehouseId: varchar("warehouse_id", { length: 64 }).notNull().references(() => warehouses.id),
  carrier: varchar("carrier", { length: 128 }).notNull(),
  accountNumber: varchar("account_number", { length: 255 }),
  credentialsEnc: text("credentials_enc"),
  settings: json("settings"),
  status: mysqlEnum("status", ["active", "disabled"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// LIVE SHOPPING
// ============================================================================

export const liveSessions = mysqlTable("live_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  streamUrl: text("stream_url"),
  thumbnailUrl: text("thumbnail_url"),
  status: mysqlEnum("status", ["scheduled", "live", "ended", "cancelled"]).default("scheduled").notNull(),
  viewerCount: int("viewer_count").default(0).notNull(),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  creatorId: varchar("creator_id", { length: 64 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const pinnedProducts = mysqlTable("pinned_products", {
  id: varchar("id", { length: 64 }).primaryKey(),
  liveSessionId: varchar("live_session_id", { length: 64 }).notNull().references(() => liveSessions.id),
  productId: varchar("product_id", { length: 64 }).notNull().references(() => products.id),
  livePrice: decimal("live_price", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(false).notNull(),
  pinnedAt: timestamp("pinned_at").defaultNow().notNull(),
  unpinnedAt: timestamp("unpinned_at"),
  salesCount: int("sales_count").default(0).notNull(),
  metadata: json("metadata"),
});

export const liveScripts = mysqlTable("live_scripts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const liveScriptNodes = mysqlTable("live_script_nodes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  scriptId: varchar("script_id", { length: 64 }).notNull().references(() => liveScripts.id),
  nodeType: varchar("node_type", { length: 64 }).notNull(),
  content: text("content"),
  position: int("position").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// CREATORS & ATTRIBUTION
// ============================================================================

export const creators = mysqlTable("creators", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  status: mysqlEnum("status", ["active", "inactive", "suspended"]).default("active").notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
  tierId: varchar("tier_id", { length: 64 }),
  socialLinks: json("social_links"),
  bankAccountId: varchar("bank_account_id", { length: 64 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const creatorAccessTokens = mysqlTable("creator_access_tokens", {
  id: varchar("id", { length: 64 }).primaryKey(),
  creatorId: varchar("creator_id", { length: 64 }).notNull().references(() => creators.id),
  tokenHash: text("token_hash").notNull(),
  label: varchar("label", { length: 255 }),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  status: mysqlEnum("status", ["active", "revoked"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const creatorTiers = mysqlTable("creator_tiers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  minSales: int("min_sales").notNull(),
  maxSales: int("max_sales"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  bonusRate: decimal("bonus_rate", { precision: 5, scale: 2 }),
  perks: json("perks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const attributionClicks = mysqlTable("attribution_clicks", {
  id: varchar("id", { length: 64 }).primaryKey(),
  creatorId: varchar("creator_id", { length: 64 }).notNull().references(() => creators.id),
  productId: varchar("product_id", { length: 64 }).references(() => products.id),
  liveSessionId: varchar("live_session_id", { length: 64 }).references(() => liveSessions.id),
  clickedAt: timestamp("clicked_at").defaultNow().notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: json("metadata"),
});

export const creatorPayoutBatches = mysqlTable("creator_payout_batches", {
  id: varchar("id", { length: 64 }).primaryKey(),
  batchNumber: varchar("batch_number", { length: 128 }).notNull().unique(),
  status: mysqlEnum("status", ["draft", "pending", "processing", "completed", "failed"]).default("draft").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const creatorPayoutLines = mysqlTable("creator_payout_lines", {
  id: varchar("id", { length: 64 }).primaryKey(),
  batchId: varchar("batch_id", { length: 64 }).notNull().references(() => creatorPayoutBatches.id),
  creatorId: varchar("creator_id", { length: 64 }).notNull().references(() => creators.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "failed", "held"]).default("pending").notNull(),
  paidAt: timestamp("paid_at"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const creatorBankAccounts = mysqlTable("creator_bank_accounts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  creatorId: varchar("creator_id", { length: 64 }).notNull().references(() => creators.id),
  accountName: varchar("account_name", { length: 255 }).notNull(),
  accountNumber: varchar("account_number", { length: 255 }).notNull(),
  routingNumber: varchar("routing_number", { length: 255 }),
  bankName: varchar("bank_name", { length: 255 }),
  accountType: mysqlEnum("account_type", ["checking", "savings"]).default("checking").notNull(),
  status: mysqlEnum("status", ["pending", "verified", "failed"]).default("pending").notNull(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// PAYMENT & DISPUTES
// ============================================================================

export const disputes = mysqlTable("disputes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  orderId: varchar("order_id", { length: 64 }).references(() => orders.id),
  provider: mysqlEnum("provider", ["paypal", "stripe"]).default("paypal").notNull(),
  providerCaseId: varchar("provider_case_id", { length: 255 }).notNull(),
  providerStatus: varchar("provider_status", { length: 128 }),
  status: mysqlEnum("status", ["open", "evidence_required", "evidence_building", "evidence_ready", "submitted", "won", "lost", "closed"]).default("open").notNull(),
  reason: text("reason"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  evidenceDeadline: timestamp("evidence_deadline"),
  needsManual: boolean("needs_manual").default(false).notNull(),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelProviderCaseIdx: uniqueIndex("channel_provider_case_idx").on(table.channelId, table.provider, table.providerCaseId),
}));

// ============================================================================
// OPERATIONS & MONITORING
// ============================================================================

export const reviewQueueItems = mysqlTable("review_queue_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  type: varchar("type", { length: 128 }).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "acknowledged", "resolved", "closed"]).default("open").notNull(),
  slaDueAt: timestamp("sla_due_at"),
  refType: varchar("ref_type", { length: 128 }).notNull(),
  refId: varchar("ref_id", { length: 64 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  summary: text("summary").notNull(),
  checklist: json("checklist"),
  metadata: json("metadata"),
  assignedTo: varchar("assigned_to", { length: 64 }),
  createdBy: varchar("created_by", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const tasks = mysqlTable("tasks", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  taskType: varchar("task_type", { length: 128 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["todo", "in_progress", "completed", "cancelled"]).default("todo").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  assignedTo: varchar("assigned_to", { length: 64 }),
  dueAt: timestamp("due_at"),
  completedAt: timestamp("completed_at"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const incidents = mysqlTable("incidents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  incidentType: varchar("incident_type", { length: 128 }).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "investigating", "paused", "resolved", "closed"]).default("open").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  pausedAt: timestamp("paused_at"),
  resumedAt: timestamp("resumed_at"),
  resolvedAt: timestamp("resolved_at"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const auditLog = mysqlTable("audit_log", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  actorType: varchar("actor_type", { length: 64 }).notNull(),
  actorId: varchar("actor_id", { length: 64 }),
  actorLabel: varchar("actor_label", { length: 255 }),
  action: varchar("action", { length: 255 }).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "error", "critical"]).default("info").notNull(),
  refType: varchar("ref_type", { length: 128 }).notNull(),
  refId: varchar("ref_id", { length: 64 }).notNull(),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("user_agent"),
  before: json("before"),
  after: json("after"),
  metadata: json("metadata"),
  prevHash: varchar("prev_hash", { length: 64 }),
  entryHash: varchar("entry_hash", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// PRINT JOBS
// ============================================================================

export const printJobs = mysqlTable("print_jobs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  warehouseId: varchar("warehouse_id", { length: 64 }).notNull().references(() => warehouses.id),
  taskId: varchar("task_id", { length: 64 }),
  printerName: varchar("printer_name", { length: 255 }),
  documentType: mysqlEnum("document_type", ["label", "pick_list", "packing_slip", "invoice"]).notNull(),
  documentUrl: text("document_url"),
  status: mysqlEnum("status", ["pending", "printing", "completed", "failed"]).default("pending").notNull(),
  retryCount: int("retry_count").default(0).notNull(),
  lastError: text("last_error"),
  printedAt: timestamp("printed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// SETTLEMENTS & RECONCILIATION
// ============================================================================

export const settlements = mysqlTable("settlements", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  platform: varchar("platform", { length: 128 }).notNull(),
  settlementId: varchar("settlement_id", { length: 255 }).notNull(),
  settlementDate: timestamp("settlement_date").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: mysqlEnum("status", ["pending", "reconciled", "discrepancy"]).default("pending").notNull(),
  rawData: json("raw_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelSettlementIdx: uniqueIndex("channel_settlement_idx").on(table.channelId, table.settlementId),
}));

export const settlementLines = mysqlTable("settlement_lines", {
  id: varchar("id", { length: 64 }).primaryKey(),
  settlementId: varchar("settlement_id", { length: 64 }).notNull().references(() => settlements.id),
  orderId: varchar("order_id", { length: 64 }).references(() => orders.id),
  lineType: varchar("line_type", { length: 128 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// NOTIFICATIONS & COMMUNICATION
// ============================================================================

export const notificationsOutbox = mysqlTable("notifications_outbox", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  notificationType: varchar("notification_type", { length: 128 }).notNull(),
  recipient: varchar("recipient", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 500 }),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  sentAt: timestamp("sent_at"),
  failureReason: text("failure_reason"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// APP SETTINGS & CONFIGURATION
// ============================================================================

export const appSettings = mysqlTable("app_settings", {
  id: varchar("id", { length: 64 }).primaryKey(),
  settingKey: varchar("setting_key", { length: 255 }).notNull().unique(),
  settingValue: json("setting_value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const secrets = mysqlTable("secrets", {
  id: varchar("id", { length: 64 }).primaryKey(),
  secretKey: varchar("secret_key", { length: 255 }).notNull().unique(),
  secretValueEnc: text("secret_value_enc").notNull(),
  version: int("version").default(1).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// TYPES
// ============================================================================

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type Channel = typeof channels.$inferSelect;
export type ChannelAccount = typeof channelAccounts.$inferSelect;
export type Warehouse = typeof warehouses.$inferSelect;
export type Zone = typeof zones.$inferSelect;
export type Bin = typeof bins.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Inventory = typeof inventory.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type FulfillmentTask = typeof fulfillmentTasks.$inferSelect;
export type Shipment = typeof shipments.$inferSelect;
export type LiveSession = typeof liveSessions.$inferSelect;
export type PinnedProduct = typeof pinnedProducts.$inferSelect;
export type Creator = typeof creators.$inferSelect;
export type Dispute = typeof disputes.$inferSelect;
export type ReviewQueueItem = typeof reviewQueueItems.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Incident = typeof incidents.$inferSelect;
export type PrintJob = typeof printJobs.$inferSelect;
export type Settlement = typeof settlements.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
