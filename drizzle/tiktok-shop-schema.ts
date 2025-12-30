import { mysqlTable, varchar, text, decimal, int, timestamp, json, index, boolean } from "drizzle-orm/mysql-core";

/**
 * TikTok Shop Integration Schema
 * Supports automation workflows for TikTok Shop arbitrage business
 */

// TikTok Shop Orders
export const tiktokOrders = mysqlTable("tiktok_orders", {
  id: int("id").primaryKey().autoincrement(),
  orderId: varchar("order_id", { length: 255 }).notNull().unique(),
  orderStatus: varchar("order_status", { length: 50 }).notNull(), // confirmed, shipped, delivered, cancelled
  buyerEmail: varchar("buyer_email", { length: 255 }),
  buyerName: varchar("buyer_name", { length: 255 }),
  shippingAddress: json("shipping_address"), // Full address object
  items: json("items").notNull(), // Array of order items
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD"),
  paymentStatus: varchar("payment_status", { length: 50 }).notNull(), // paid, pending, failed
  webhookTimestamp: timestamp("webhook_timestamp").notNull(),
  rawData: json("raw_data"), // Full webhook payload
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orderIdIdx: index("order_id_idx").on(table.orderId),
  orderStatusIdx: index("order_status_idx").on(table.orderStatus),
  paymentStatusIdx: index("payment_status_idx").on(table.paymentStatus),
}));

// TikTok Shop Products (synced from TikTok)
export const tiktokProducts = mysqlTable("tiktok_products", {
  id: int("id").primaryKey().autoincrement(),
  productId: varchar("product_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  stockQuantity: int("stock_quantity").notNull().default(0),
  sku: varchar("sku", { length: 255 }),
  images: json("images"), // Array of image URLs
  category: varchar("category", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("active"), // active, inactive, out_of_stock
  supplierUrl: varchar("supplier_url", { length: 1000 }), // AliExpress/Amazon URL
  supplierPrice: decimal("supplier_price", { precision: 10, scale: 2 }),
  supplierName: varchar("supplier_name", { length: 255 }),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }), // Percentage
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  productIdIdx: index("product_id_idx").on(table.productId),
  statusIdx: index("status_idx").on(table.status),
  categoryIdx: index("category_idx").on(table.category),
}));

// Supplier Orders (orders placed with AliExpress, Amazon, etc.)
export const supplierOrders = mysqlTable("supplier_orders", {
  id: int("id").primaryKey().autoincrement(),
  tiktokOrderId: varchar("tiktok_order_id", { length: 255 }).notNull(),
  supplierOrderId: varchar("supplier_order_id", { length: 255 }),
  supplierName: varchar("supplier_name", { length: 255 }).notNull(), // aliexpress, amazon, etc.
  productId: varchar("product_id", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }),
  trackingNumber: varchar("tracking_number", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, ordered, shipped, delivered, failed
  orderUrl: varchar("order_url", { length: 1000 }),
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tiktokOrderIdIdx: index("tiktok_order_id_idx").on(table.tiktokOrderId),
  statusIdx: index("status_idx").on(table.status),
  supplierNameIdx: index("supplier_name_idx").on(table.supplierName),
}));

// Arbitrage Opportunities (discovered profitable products)
export const arbitrageOpportunities = mysqlTable("arbitrage_opportunities", {
  id: int("id").primaryKey().autoincrement(),
  productName: varchar("product_name", { length: 500 }).notNull(),
  supplierUrl: varchar("supplier_url", { length: 1000 }).notNull(),
  supplierName: varchar("supplier_name", { length: 255 }).notNull(),
  supplierPrice: decimal("supplier_price", { precision: 10, scale: 2 }).notNull(),
  suggestedRetailPrice: decimal("suggested_retail_price", { precision: 10, scale: 2 }).notNull(),
  estimatedShipping: decimal("estimated_shipping", { precision: 10, scale: 2 }),
  marketplaceFees: decimal("marketplace_fees", { precision: 10, scale: 2 }),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }).notNull(), // Percentage
  estimatedProfit: decimal("estimated_profit", { precision: 10, scale: 2 }).notNull(),
  competitorCount: int("competitor_count"),
  avgCompetitorPrice: decimal("avg_competitor_price", { precision: 10, scale: 2 }),
  supplierRating: decimal("supplier_rating", { precision: 3, scale: 2 }),
  supplierOrders: int("supplier_orders"), // Number of orders supplier has
  images: json("images"),
  category: varchar("category", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, approved, rejected, listed
  score: int("score"), // Opportunity score 0-100
  notes: text("notes"),
  discoveredAt: timestamp("discovered_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  listedAt: timestamp("listed_at"),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  profitMarginIdx: index("profit_margin_idx").on(table.profitMargin),
  scoreIdx: index("score_idx").on(table.score),
}));

// Price History (track price changes over time)
export const priceHistory = mysqlTable("price_history", {
  id: int("id").primaryKey().autoincrement(),
  productId: varchar("product_id", { length: 255 }).notNull(),
  oldPrice: decimal("old_price", { precision: 10, scale: 2 }).notNull(),
  newPrice: decimal("new_price", { precision: 10, scale: 2 }).notNull(),
  supplierPrice: decimal("supplier_price", { precision: 10, scale: 2 }),
  changeReason: varchar("change_reason", { length: 255 }), // supplier_price_change, competitor_pricing, manual
  changePercentage: decimal("change_percentage", { precision: 5, scale: 2 }),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
}, (table) => ({
  productIdIdx: index("product_id_idx").on(table.productId),
  changedAtIdx: index("changed_at_idx").on(table.changedAt),
}));

// Inventory Alerts
export const inventoryAlerts = mysqlTable("inventory_alerts", {
  id: int("id").primaryKey().autoincrement(),
  productId: varchar("product_id", { length: 255 }).notNull(),
  productName: varchar("product_name", { length: 500 }).notNull(),
  alertType: varchar("alert_type", { length: 50 }).notNull(), // out_of_stock, low_stock, supplier_unavailable
  currentStock: int("current_stock").notNull(),
  supplierStock: int("supplier_stock"),
  message: text("message"),
  severity: varchar("severity", { length: 20 }).notNull(), // low, medium, high, critical
  resolved: boolean("resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  productIdIdx: index("product_id_idx").on(table.productId),
  alertTypeIdx: index("alert_type_idx").on(table.alertType),
  resolvedIdx: index("resolved_idx").on(table.resolved),
}));

// Customer Inquiries (from TikTok Shop)
export const customerInquiries = mysqlTable("customer_inquiries", {
  id: int("id").primaryKey().autoincrement(),
  inquiryId: varchar("inquiry_id", { length: 255 }).notNull().unique(),
  orderId: varchar("order_id", { length: 255 }),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }),
  subject: varchar("subject", { length: 500 }),
  message: text("message").notNull(),
  category: varchar("category", { length: 100 }), // tracking, returns, product_question, complaint
  priority: varchar("priority", { length: 20 }).notNull().default("medium"), // low, medium, high, urgent
  status: varchar("status", { length: 50 }).notNull().default("open"), // open, in_progress, resolved, closed
  assignedTo: varchar("assigned_to", { length: 255 }),
  autoResponded: boolean("auto_responded").notNull().default(false),
  responseCount: int("response_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
}, (table) => ({
  inquiryIdIdx: index("inquiry_id_idx").on(table.inquiryId),
  orderIdIdx: index("order_id_idx").on(table.orderId),
  statusIdx: index("status_idx").on(table.status),
  priorityIdx: index("priority_idx").on(table.priority),
}));

// Customer Responses (automated and manual)
export const customerResponses = mysqlTable("customer_responses", {
  id: int("id").primaryKey().autoincrement(),
  inquiryId: varchar("inquiry_id", { length: 255 }).notNull(),
  responseType: varchar("response_type", { length: 50 }).notNull(), // automated, manual
  message: text("message").notNull(),
  sentBy: varchar("sent_by", { length: 255 }), // system, agent_name
  sentAt: timestamp("sent_at").defaultNow().notNull(),
}, (table) => ({
  inquiryIdIdx: index("inquiry_id_idx").on(table.inquiryId),
}));

// Daily Reports (business analytics)
export const dailyReports = mysqlTable("daily_reports", {
  id: int("id").primaryKey().autoincrement(),
  reportDate: timestamp("report_date").notNull().unique(),
  totalOrders: int("total_orders").notNull().default(0),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).notNull().default("0"),
  totalCosts: decimal("total_costs", { precision: 12, scale: 2 }).notNull().default("0"),
  totalProfit: decimal("total_profit", { precision: 12, scale: 2 }).notNull().default("0"),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }),
  avgOrderValue: decimal("avg_order_value", { precision: 10, scale: 2 }),
  topProducts: json("top_products"), // Array of top selling products
  newOpportunities: int("new_opportunities").notNull().default(0),
  activeAlerts: int("active_alerts").notNull().default(0),
  customerInquiries: int("customer_inquiries").notNull().default(0),
  reportData: json("report_data"), // Full report JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  reportDateIdx: index("report_date_idx").on(table.reportDate),
}));

// Automation Jobs (scheduler for workflows)
export const automationJobs = mysqlTable("automation_jobs", {
  id: int("id").primaryKey().autoincrement(),
  jobName: varchar("job_name", { length: 255 }).notNull().unique(),
  jobType: varchar("job_type", { length: 100 }).notNull(), // product_sync, inventory_sync, price_monitor, etc.
  schedule: varchar("schedule", { length: 100 }).notNull(), // cron expression or interval
  enabled: boolean("enabled").notNull().default(true),
  lastRunAt: timestamp("last_run_at"),
  lastRunStatus: varchar("last_run_status", { length: 50 }), // success, failed, running
  lastRunDuration: int("last_run_duration"), // milliseconds
  lastRunError: text("last_run_error"),
  nextRunAt: timestamp("next_run_at"),
  runCount: int("run_count").notNull().default(0),
  successCount: int("success_count").notNull().default(0),
  failureCount: int("failure_count").notNull().default(0),
  config: json("config"), // Job-specific configuration
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  jobNameIdx: index("job_name_idx").on(table.jobName),
  enabledIdx: index("enabled_idx").on(table.enabled),
  nextRunAtIdx: index("next_run_at_idx").on(table.nextRunAt),
}));

// Job Execution Logs
export const jobExecutionLogs = mysqlTable("job_execution_logs", {
  id: int("id").primaryKey().autoincrement(),
  jobId: int("job_id").notNull(),
  jobName: varchar("job_name", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(), // success, failed, running
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  duration: int("duration"), // milliseconds
  recordsProcessed: int("records_processed"),
  errorMessage: text("error_message"),
  executionData: json("execution_data"), // Job-specific output data
}, (table) => ({
  jobIdIdx: index("job_id_idx").on(table.jobId),
  statusIdx: index("status_idx").on(table.status),
  startedAtIdx: index("started_at_idx").on(table.startedAt),
}));

// TikTok Shop API Credentials
export const tiktokCredentials = mysqlTable("tiktok_credentials", {
  id: int("id").primaryKey().autoincrement(),
  shopId: varchar("shop_id", { length: 255 }).notNull().unique(),
  shopName: varchar("shop_name", { length: 255 }),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  webhookUrl: varchar("webhook_url", { length: 1000 }),
  webhookSecret: varchar("webhook_secret", { length: 255 }),
  apiRegion: varchar("api_region", { length: 50 }).notNull().default("US"), // US, UK, SEA
  isActive: boolean("is_active").notNull().default(true),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
