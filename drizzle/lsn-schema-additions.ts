/**
 * LSN-SPECIFIC SCHEMA ADDITIONS
 * Premium Live Shopping Network Tables
 * 
 * This file contains all LSN-specific tables for:
 * - Disputes & Evidence Packs
 * - Inventory Lots & Landed Cost
 * - Creator Scheduling & Incentives
 * - Live Shows & Segments
 * - Financial Reconciliation
 * - Fraud & Risk Management
 * - Refunds & Returns (RMA)
 * - Creative Assets & Content
 * - Supplier Management
 * - 3PL Integration
 * - Audit & Security
 * - Idempotency
 * - Permissions & RBAC
 */

import {
  mysqlTable,
  varchar,
  text,
  int,
  decimal,
  timestamp,
  mysqlEnum,
  json,
  boolean,
  uniqueIndex,
  index,
  bigint,
} from "drizzle-orm/mysql-core";
import { channels, users, products, orders } from "./schema";

// ============================================================================
// DISPUTES & EVIDENCE PACKS
// ============================================================================

export const disputes = mysqlTable("disputes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  provider: varchar("provider", { length: 32 }).notNull().default("PAYPAL"),
  providerCaseId: varchar("provider_case_id", { length: 128 }).notNull(),
  providerStatus: varchar("provider_status", { length: 64 }),
  orderId: varchar("order_id", { length: 64 }).references(() => orders.id),
  creatorId: varchar("creator_id", { length: 64 }),
  status: mysqlEnum("status", [
    "OPEN",
    "EVIDENCE_REQUIRED",
    "EVIDENCE_BUILDING",
    "EVIDENCE_READY",
    "SUBMITTED",
    "WON",
    "LOST",
    "CLOSED",
    "NEEDS_MANUAL",
    "DUPLICATE",
    "CANCELED"
  ]).notNull().default("OPEN"),
  reason: text("reason"),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull().default(0),
  currency: varchar("currency", { length: 3 }).notNull().default("AUD"),
  evidenceDeadline: timestamp("evidence_deadline"),
  lastProviderUpdateAt: timestamp("last_provider_update_at"),
  evidencePackId: varchar("evidence_pack_id", { length: 64 }),
  needsManual: boolean("needs_manual").notNull().default(false),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelProviderCaseIdx: uniqueIndex("channel_provider_case_idx").on(
    table.channelId,
    table.provider,
    table.providerCaseId
  ),
  statusIdx: index("disputes_status_idx").on(table.status),
  orderIdx: index("disputes_order_idx").on(table.orderId),
}));

export const evidencePacks = mysqlTable("evidence_packs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  disputeId: varchar("dispute_id", { length: 64 }).notNull().references(() => disputes.id),
  status: mysqlEnum("status", ["BUILDING", "READY", "SUBMITTED", "FAILED"]).notNull().default("BUILDING"),
  trackingNumber: varchar("tracking_number", { length: 128 }),
  trackingUrl: text("tracking_url"),
  proofOfDelivery: text("proof_of_delivery"),
  productDescription: text("product_description"),
  customerCommunication: json("customer_communication"),
  additionalDocuments: json("additional_documents"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const disputeTimeline = mysqlTable("dispute_timeline", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  disputeId: varchar("dispute_id", { length: 64 }).notNull().references(() => disputes.id),
  kind: varchar("kind", { length: 64 }).notNull(),
  message: text("message").notNull(),
  actorType: varchar("actor_type", { length: 32 }),
  actorId: varchar("actor_id", { length: 64 }),
  meta: json("meta").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  disputeIdx: index("dispute_timeline_dispute_idx").on(table.disputeId),
}));

export const providerWebhookDedup = mysqlTable("provider_webhook_dedup", {
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  provider: varchar("provider", { length: 32 }).notNull(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
}, (table) => ({
  pk: uniqueIndex("webhook_dedup_pk").on(table.channelId, table.provider, table.eventId),
}));

// ============================================================================
// INVENTORY LOTS & LANDED COST
// ============================================================================

export const inventoryLots = mysqlTable("inventory_lots", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  productId: varchar("product_id", { length: 64 }).notNull().references(() => products.id),
  lotNumber: varchar("lot_number", { length: 128 }).notNull(),
  supplierId: varchar("supplier_id", { length: 64 }),
  purchaseOrderId: varchar("purchase_order_id", { length: 64 }),
  receivedDate: timestamp("received_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  quantityReceived: int("quantity_received").notNull(),
  quantityAvailable: int("quantity_available").notNull(),
  quantityReserved: int("quantity_reserved").notNull().default(0),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  shippingCostPerUnit: decimal("shipping_cost_per_unit", { precision: 10, scale: 2 }).default("0.00"),
  dutiesPerUnit: decimal("duties_per_unit", { precision: 10, scale: 2 }).default("0.00"),
  feesPerUnit: decimal("fees_per_unit", { precision: 10, scale: 2 }).default("0.00"),
  landedCostPerUnit: decimal("landed_cost_per_unit", { precision: 10, scale: 2 }).notNull(),
  allocationMethod: mysqlEnum("allocation_method", ["FIFO", "FEFO", "MANUAL"]).notNull().default("FIFO"),
  status: mysqlEnum("status", ["ACTIVE", "DEPLETED", "EXPIRED", "QUARANTINED"]).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelLotIdx: uniqueIndex("channel_lot_idx").on(table.channelId, table.lotNumber),
  productIdx: index("lot_product_idx").on(table.productId),
  statusIdx: index("lot_status_idx").on(table.status),
}));

export const purchaseOrders = mysqlTable("purchase_orders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  poNumber: varchar("po_number", { length: 128 }).notNull(),
  supplierId: varchar("supplier_id", { length: 64 }).notNull(),
  status: mysqlEnum("status", [
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "SENT",
    "PARTIALLY_RECEIVED",
    "RECEIVED",
    "CANCELED"
  ]).notNull().default("DRAFT"),
  orderDate: timestamp("order_date").notNull(),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("AUD"),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0.00"),
  duties: decimal("duties", { precision: 10, scale: 2 }).default("0.00"),
  fees: decimal("fees", { precision: 10, scale: 2 }).default("0.00"),
  notes: text("notes"),
  approvedBy: varchar("approved_by", { length: 64 }),
  approvedAt: timestamp("approved_at"),
  createdBy: varchar("created_by", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelPoIdx: uniqueIndex("channel_po_idx").on(table.channelId, table.poNumber),
  statusIdx: index("po_status_idx").on(table.status),
}));

export const poLineItems = mysqlTable("po_line_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  purchaseOrderId: varchar("purchase_order_id", { length: 64 }).notNull().references(() => purchaseOrders.id),
  productId: varchar("product_id", { length: 64 }).notNull().references(() => products.id),
  quantity: int("quantity").notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull(),
  quantityReceived: int("quantity_received").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  poIdx: index("po_line_po_idx").on(table.purchaseOrderId),
}));

export const receivingEvents = mysqlTable("receiving_events", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  purchaseOrderId: varchar("purchase_order_id", { length: 64 }).notNull().references(() => purchaseOrders.id),
  lotId: varchar("lot_id", { length: 64 }).references(() => inventoryLots.id),
  productId: varchar("product_id", { length: 64 }).notNull().references(() => products.id),
  quantityReceived: int("quantity_received").notNull(),
  qcStatus: mysqlEnum("qc_status", ["PENDING", "PASSED", "FAILED", "PARTIAL"]).notNull().default("PENDING"),
  qcNotes: text("qc_notes"),
  receivedBy: varchar("received_by", { length: 64 }).notNull(),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
}, (table) => ({
  poIdx: index("receiving_po_idx").on(table.purchaseOrderId),
}));

// ============================================================================
// SUPPLIERS
// ============================================================================

export const suppliers = mysqlTable("suppliers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  name: varchar("name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 32 }),
  address: text("address"),
  country: varchar("country", { length: 64 }),
  leadTimeDays: int("lead_time_days"),
  moq: int("moq"),
  hasExclusivity: boolean("has_exclusivity").notNull().default(false),
  exclusivityDetails: text("exclusivity_details"),
  performanceScore: decimal("performance_score", { precision: 5, scale: 2 }).default("0.00"),
  onTimeDeliveryRate: decimal("on_time_delivery_rate", { precision: 5, scale: 2 }).default("0.00"),
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }).default("0.00"),
  defectRate: decimal("defect_rate", { precision: 5, scale: 2 }).default("0.00"),
  status: mysqlEnum("status", ["ACTIVE", "INACTIVE", "BLACKLISTED"]).notNull().default("ACTIVE"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelNameIdx: uniqueIndex("supplier_channel_name_idx").on(table.channelId, table.name),
}));

export const supplierContracts = mysqlTable("supplier_contracts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  supplierId: varchar("supplier_id", { length: 64 }).notNull().references(() => suppliers.id),
  contractType: mysqlEnum("contract_type", ["STANDARD", "EXCLUSIVITY", "PRIORITY", "SAMPLING"]).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  terms: text("terms").notNull(),
  exclusivityClause: text("exclusivity_clause"),
  ipClause: text("ip_clause"),
  defectClause: text("defect_clause"),
  moqClause: text("moq_clause"),
  documentUrl: text("document_url"),
  status: mysqlEnum("status", ["ACTIVE", "EXPIRED", "TERMINATED"]).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// CREATORS & SCHEDULING
// ============================================================================

export const creators = mysqlTable("creators", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  userId: varchar("user_id", { length: 64 }).references(() => users.id),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  tier: mysqlEnum("tier", ["BRONZE", "SILVER", "GOLD", "PLATINUM"]).notNull().default("BRONZE"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull().default("10.00"),
  bonusMultiplier: decimal("bonus_multiplier", { precision: 5, scale: 2 }).notNull().default("1.00"),
  totalGmv: decimal("total_gmv", { precision: 15, scale: 2 }).notNull().default("0.00"),
  totalProfit: decimal("total_profit", { precision: 15, scale: 2 }).notNull().default("0.00"),
  totalCommissionEarned: decimal("total_commission_earned", { precision: 15, scale: 2 }).notNull().default("0.00"),
  totalCommissionPaid: decimal("total_commission_paid", { precision: 15, scale: 2 }).notNull().default("0.00"),
  performanceScore: decimal("performance_score", { precision: 5, scale: 2 }).default("0.00"),
  status: mysqlEnum("status", ["ACTIVE", "INACTIVE", "SUSPENDED"]).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const broadcastChannels = mysqlTable("broadcast_channels", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  isPrimeTime: boolean("is_prime_time").notNull().default(false),
  status: mysqlEnum("status", ["ACTIVE", "INACTIVE"]).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  channelSlugIdx: uniqueIndex("broadcast_channel_slug_idx").on(table.channelId, table.slug),
}));

export const scheduleSlots = mysqlTable("schedule_slots", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  broadcastChannelId: varchar("broadcast_channel_id", { length: 64 }).notNull().references(() => broadcastChannels.id),
  creatorId: varchar("creator_id", { length: 64 }).references(() => creators.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  dayOfWeek: int("day_of_week").notNull(), // 0=Sunday, 6=Saturday
  hourOfDay: int("hour_of_day").notNull(), // 0-23
  isPrimeTime: boolean("is_prime_time").notNull().default(false),
  status: mysqlEnum("status", ["SCHEDULED", "LIVE", "COMPLETED", "CANCELED"]).notNull().default("SCHEDULED"),
  liveShowId: varchar("live_show_id", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  scheduleIdx: index("schedule_slot_time_idx").on(table.startTime, table.endTime),
  creatorIdx: index("schedule_slot_creator_idx").on(table.creatorId),
}));

export const creatorAvailability = mysqlTable("creator_availability", {
  id: varchar("id", { length: 64 }).primaryKey(),
  creatorId: varchar("creator_id", { length: 64 }).notNull().references(() => creators.id),
  dayOfWeek: int("day_of_week").notNull(),
  startHour: int("start_hour").notNull(),
  endHour: int("end_hour").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  creatorDayIdx: index("creator_avail_day_idx").on(table.creatorId, table.dayOfWeek),
}));

export const creatorIncentives = mysqlTable("creator_incentives", {
  id: varchar("id", { length: 64 }).primaryKey(),
  creatorId: varchar("creator_id", { length: 64 }).notNull().references(() => creators.id),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  baseCommission: decimal("base_commission", { precision: 15, scale: 2 }).notNull().default("0.00"),
  bonusAmount: decimal("bonus_amount", { precision: 15, scale: 2 }).notNull().default("0.00"),
  clawbackAmount: decimal("clawback_amount", { precision: 15, scale: 2 }).notNull().default("0.00"),
  netAmount: decimal("net_amount", { precision: 15, scale: 2 }).notNull().default("0.00"),
  reason: text("reason"),
  status: mysqlEnum("status", ["PENDING", "APPROVED", "PAID", "CLAWED_BACK"]).notNull().default("PENDING"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  creatorPeriodIdx: index("incentive_creator_period_idx").on(table.creatorId, table.periodStart),
}));

// ============================================================================
// LIVE SHOWS & SEGMENTS
// ============================================================================

export const liveShows = mysqlTable("live_shows", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  broadcastChannelId: varchar("broadcast_channel_id", { length: 64 }).notNull().references(() => broadcastChannels.id),
  creatorId: varchar("creator_id", { length: 64 }).notNull().references(() => creators.id),
  scheduleSlotId: varchar("schedule_slot_id", { length: 64 }).references(() => scheduleSlots.id),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  streamKey: varchar("stream_key", { length: 128 }),
  streamUrl: text("stream_url"),
  recordingUrl: text("recording_url"),
  status: mysqlEnum("status", [
    "SCHEDULED",
    "LIVE",
    "ENDED",
    "ARCHIVED",
    "CANCELED"
  ]).notNull().default("SCHEDULED"),
  scheduledStartTime: timestamp("scheduled_start_time").notNull(),
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  viewerCount: int("viewer_count").notNull().default(0),
  peakViewerCount: int("peak_viewer_count").notNull().default(0),
  totalOrders: int("total_orders").notNull().default(0),
  totalGmv: decimal("total_gmv", { precision: 15, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusIdx: index("live_show_status_idx").on(table.status),
  creatorIdx: index("live_show_creator_idx").on(table.creatorId),
  scheduleIdx: index("live_show_schedule_idx").on(table.scheduledStartTime),
}));

export const showSegments = mysqlTable("show_segments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  liveShowId: varchar("live_show_id", { length: 64 }).notNull().references(() => liveShows.id),
  segmentType: mysqlEnum("segment_type", [
    "INTRO",
    "PRODUCT_DEMO",
    "QA",
    "PRICE_DROP",
    "OUTRO",
    "HIGHLIGHT"
  ]).notNull(),
  title: varchar("title", { length: 255 }),
  startTimestamp: int("start_timestamp").notNull(), // seconds from show start
  endTimestamp: int("end_timestamp"),
  productId: varchar("product_id", { length: 64 }).references(() => products.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  showIdx: index("segment_show_idx").on(table.liveShowId),
}));

export const pinnedProducts = mysqlTable("pinned_products", {
  id: varchar("id", { length: 64 }).primaryKey(),
  liveShowId: varchar("live_show_id", { length: 64 }).notNull().references(() => liveShows.id),
  productId: varchar("product_id", { length: 64 }).notNull().references(() => products.id),
  priority: int("priority").notNull().default(0),
  isPinned: boolean("is_pinned").notNull().default(true),
  pinnedAt: timestamp("pinned_at").defaultNow().notNull(),
  unpinnedAt: timestamp("unpinned_at"),
}, (table) => ({
  showProductIdx: index("pinned_show_product_idx").on(table.liveShowId, table.productId),
}));

export const priceDrops = mysqlTable("price_drops", {
  id: varchar("id", { length: 64 }).primaryKey(),
  liveShowId: varchar("live_show_id", { length: 64 }).notNull().references(() => liveShows.id),
  productId: varchar("product_id", { length: 64 }).notNull().references(() => products.id),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(),
  dropPrice: decimal("drop_price", { precision: 10, scale: 2 }).notNull(),
  minMarginPercent: decimal("min_margin_percent", { precision: 5, scale: 2 }).notNull(),
  actualMarginPercent: decimal("actual_margin_percent", { precision: 5, scale: 2 }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  quantityLimit: int("quantity_limit"),
  quantitySold: int("quantity_sold").notNull().default(0),
  status: mysqlEnum("status", ["SCHEDULED", "ACTIVE", "ENDED", "CANCELED"]).notNull().default("SCHEDULED"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  showProductIdx: index("price_drop_show_product_idx").on(table.liveShowId, table.productId),
  statusIdx: index("price_drop_status_idx").on(table.status),
}));

// ============================================================================
// REFUNDS & RETURNS (RMA)
// ============================================================================

export const refunds = mysqlTable("refunds", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  orderId: varchar("order_id", { length: 64 }).notNull().references(() => orders.id),
  refundNumber: varchar("refund_number", { length: 128 }).notNull(),
  reason: text("reason").notNull(),
  refundType: mysqlEnum("refund_type", ["FULL", "PARTIAL", "SHIPPING_ONLY"]).notNull(),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("AUD"),
  restockingFeeCents: bigint("restocking_fee_cents", { mode: "number" }).notNull().default(0),
  status: mysqlEnum("status", [
    "PENDING",
    "APPROVED",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "CANCELED"
  ]).notNull().default("PENDING"),
  autoApproved: boolean("auto_approved").notNull().default(false),
  approvedBy: varchar("approved_by", { length: 64 }),
  approvedAt: timestamp("approved_at"),
  processedAt: timestamp("processed_at"),
  providerRefundId: varchar("provider_refund_id", { length: 128 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelRefundIdx: uniqueIndex("channel_refund_idx").on(table.channelId, table.refundNumber),
  orderIdx: index("refund_order_idx").on(table.orderId),
  statusIdx: index("refund_status_idx").on(table.status),
}));

export const returns = mysqlTable("returns", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  orderId: varchar("order_id", { length: 64 }).notNull().references(() => orders.id),
  rmaNumber: varchar("rma_number", { length: 128 }).notNull(),
  reason: text("reason").notNull(),
  status: mysqlEnum("status", [
    "REQUESTED",
    "APPROVED",
    "LABEL_SENT",
    "IN_TRANSIT",
    "RECEIVED",
    "INSPECTING",
    "APPROVED_FOR_REFUND",
    "REJECTED",
    "RESTOCKED"
  ]).notNull().default("REQUESTED"),
  returnLabelUrl: text("return_label_url"),
  trackingNumber: varchar("tracking_number", { length: 128 }),
  receivedAt: timestamp("received_at"),
  inspectedAt: timestamp("inspected_at"),
  inspectionNotes: text("inspection_notes"),
  refundId: varchar("refund_id", { length: 64 }).references(() => refunds.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelRmaIdx: uniqueIndex("channel_rma_idx").on(table.channelId, table.rmaNumber),
  orderIdx: index("return_order_idx").on(table.orderId),
  statusIdx: index("return_status_idx").on(table.status),
}));

export const rmaItems = mysqlTable("rma_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  returnId: varchar("return_id", { length: 64 }).notNull().references(() => returns.id),
  productId: varchar("product_id", { length: 64 }).notNull().references(() => products.id),
  quantity: int("quantity").notNull(),
  condition: mysqlEnum("condition", ["NEW", "LIKE_NEW", "GOOD", "DAMAGED", "DEFECTIVE"]),
  restockable: boolean("restockable"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// FINANCIAL RECONCILIATION
// ============================================================================

export const ledgerEntries = mysqlTable("ledger_entries", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  entryType: varchar("entry_type", { length: 64 }).notNull(),
  refType: varchar("ref_type", { length: 64 }).notNull(),
  refId: varchar("ref_id", { length: 64 }).notNull(),
  debitAccountId: varchar("debit_account_id", { length: 64 }),
  creditAccountId: varchar("credit_account_id", { length: 64 }),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("AUD"),
  description: text("description"),
  meta: json("meta").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  refIdx: index("ledger_ref_idx").on(table.refType, table.refId),
  channelIdx: index("ledger_channel_idx").on(table.channelId),
}));

export const reconciliationItems = mysqlTable("reconciliation_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  provider: varchar("provider", { length: 32 }).notNull(),
  providerTransactionId: varchar("provider_transaction_id", { length: 128 }).notNull(),
  transactionDate: timestamp("transaction_date").notNull(),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  transactionType: varchar("transaction_type", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["UNMATCHED", "MATCHED", "DISCREPANCY", "MANUAL_REVIEW"]).notNull().default("UNMATCHED"),
  matchedOrderId: varchar("matched_order_id", { length: 64 }),
  matchedRefundId: varchar("matched_refund_id", { length: 64 }),
  matchedPayoutId: varchar("matched_payout_id", { length: 64 }),
  discrepancyNotes: text("discrepancy_notes"),
  reviewedBy: varchar("reviewed_by", { length: 64 }),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  providerTxIdx: uniqueIndex("recon_provider_tx_idx").on(table.provider, table.providerTransactionId),
  statusIdx: index("recon_status_idx").on(table.status),
}));

export const payouts = mysqlTable("payouts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  payoutNumber: varchar("payout_number", { length: 128 }).notNull(),
  recipientType: mysqlEnum("recipient_type", ["CREATOR", "SUPPLIER", "AFFILIATE"]).notNull(),
  recipientId: varchar("recipient_id", { length: 64 }).notNull(),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("AUD"),
  status: mysqlEnum("status", [
    "PENDING",
    "ON_HOLD",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "CANCELED"
  ]).notNull().default("PENDING"),
  holdReason: text("hold_reason"),
  provider: varchar("provider", { length: 32 }).notNull().default("WISE"),
  providerPayoutId: varchar("provider_payout_id", { length: 128 }),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelPayoutIdx: uniqueIndex("channel_payout_idx").on(table.channelId, table.payoutNumber),
  statusIdx: index("payout_status_idx").on(table.status),
  recipientIdx: index("payout_recipient_idx").on(table.recipientType, table.recipientId),
}));

// ============================================================================
// FRAUD & RISK MANAGEMENT
// ============================================================================

export const fraudScores = mysqlTable("fraud_scores", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  orderId: varchar("order_id", { length: 64 }).notNull().references(() => orders.id),
  score: int("score").notNull(), // 0-100
  riskLevel: mysqlEnum("risk_level", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).notNull(),
  outcome: mysqlEnum("outcome", ["ALLOW", "REVIEW", "HOLD_PAYOUT", "BLOCK"]).notNull(),
  signals: json("signals").notNull().default("{}"),
  velocityCheckScore: int("velocity_check_score"),
  deviceFingerprintScore: int("device_fingerprint_score"),
  ipReputationScore: int("ip_reputation_score"),
  geolocationScore: int("geolocation_score"),
  addressVerificationScore: int("address_verification_score"),
  paymentMethodScore: int("payment_method_score"),
  accountHistoryScore: int("account_history_score"),
  orderValueScore: int("order_value_score"),
  blacklistScore: int("blacklist_score"),
  reviewedBy: varchar("reviewed_by", { length: 64 }),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  orderIdx: uniqueIndex("fraud_score_order_idx").on(table.orderId),
  outcomeIdx: index("fraud_outcome_idx").on(table.outcome),
}));

export const blockedEntities = mysqlTable("blocked_entities", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  entityType: mysqlEnum("entity_type", ["EMAIL", "IP", "DEVICE", "CARD_BIN", "USER_ID"]).notNull(),
  entityValue: varchar("entity_value", { length: 255 }).notNull(),
  reason: text("reason").notNull(),
  severity: mysqlEnum("severity", ["WARNING", "BLOCK"]).notNull(),
  expiresAt: timestamp("expires_at"),
  createdBy: varchar("created_by", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  entityIdx: uniqueIndex("blocked_entity_idx").on(table.channelId, table.entityType, table.entityValue),
}));

// ============================================================================
// CREATIVE FACTORY & CONTENT
// ============================================================================

export const assetLibrary = mysqlTable("asset_library", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  assetType: mysqlEnum("asset_type", [
    "RAW_FOOTAGE",
    "EDITED_CLIP",
    "THUMBNAIL",
    "PRODUCT_SHOT",
    "TESTIMONIAL",
    "CERTIFICATION"
  ]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileSize: bigint("file_size", { mode: "number" }),
  mimeType: varchar("mime_type", { length: 128 }),
  duration: int("duration"), // seconds for video/audio
  liveShowId: varchar("live_show_id", { length: 64 }).references(() => liveShows.id),
  productId: varchar("product_id", { length: 64 }).references(() => products.id),
  tags: json("tags").notNull().default("[]"),
  performanceMetrics: json("performance_metrics").notNull().default("{}"),
  status: mysqlEnum("status", ["DRAFT", "APPROVED", "ARCHIVED"]).notNull().default("DRAFT"),
  createdBy: varchar("created_by", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  typeIdx: index("asset_type_idx").on(table.assetType),
  showIdx: index("asset_show_idx").on(table.liveShowId),
}));

export const hooksLibrary = mysqlTable("hooks_library", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  hookText: text("hook_text").notNull(),
  hookType: mysqlEnum("hook_type", ["OPENING", "PRODUCT_INTRO", "URGENCY", "SOCIAL_PROOF", "CTA"]).notNull(),
  performanceScore: decimal("performance_score", { precision: 5, scale: 2 }).default("0.00"),
  usageCount: int("usage_count").notNull().default(0),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0.00"),
  status: mysqlEnum("status", ["ACTIVE", "TESTING", "RETIRED"]).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ugcBriefs = mysqlTable("ugc_briefs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  productId: varchar("product_id", { length: 64 }).notNull().references(() => products.id),
  creatorId: varchar("creator_id", { length: 64 }).references(() => creators.id),
  briefTitle: varchar("brief_title", { length: 500 }).notNull(),
  briefDescription: text("brief_description").notNull(),
  guidelines: text("guidelines"),
  dueDate: timestamp("due_date"),
  status: mysqlEnum("status", ["DRAFT", "SENT", "IN_PROGRESS", "SUBMITTED", "APPROVED", "REJECTED"]).notNull().default("DRAFT"),
  submittedAssetId: varchar("submitted_asset_id", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// OPERATIONS & REVIEW QUEUE
// ============================================================================

export const reviewQueueItems = mysqlTable("review_queue_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  itemType: varchar("item_type", { length: 64 }).notNull(),
  severity: mysqlEnum("severity", ["LOW", "MED", "HIGH", "CRITICAL"]).notNull().default("MED"),
  status: mysqlEnum("status", ["OPEN", "IN_PROGRESS", "RESOLVED", "ESCALATED"]).notNull().default("OPEN"),
  slaDueAt: timestamp("sla_due_at"),
  refType: varchar("ref_type", { length: 64 }).notNull(),
  refId: varchar("ref_id", { length: 64 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  summary: text("summary").notNull(),
  checklist: json("checklist").notNull().default("[]"),
  meta: json("meta").notNull().default("{}"),
  assignedTo: varchar("assigned_to", { length: 64 }),
  createdBy: varchar("created_by", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueItemIdx: uniqueIndex("review_queue_unique_idx").on(
    table.channelId,
    table.itemType,
    table.refType,
    table.refId,
    table.title
  ),
  statusIdx: index("review_queue_status_idx").on(table.status),
  severityIdx: index("review_queue_severity_idx").on(table.severity),
}));

export const escalations = mysqlTable("escalations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  severity: mysqlEnum("severity", ["WARN", "ERROR", "CRITICAL"]).notNull(),
  status: mysqlEnum("status", ["OPEN", "ACKED", "CLOSED"]).notNull().default("OPEN"),
  sessionId: varchar("session_id", { length: 128 }),
  triggerJson: json("trigger_json").notNull().default("{}"),
  notes: text("notes"),
  ackByUserId: varchar("ack_by_user_id", { length: 64 }),
  ackTs: timestamp("ack_ts"),
  createdTs: timestamp("created_ts").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("escalation_status_idx").on(table.status),
}));

export const policyIncidents = mysqlTable("policy_incidents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  sessionId: varchar("session_id", { length: 128 }),
  ruleId: varchar("rule_id", { length: 128 }).notNull(),
  severity: mysqlEnum("severity", ["INFO", "WARN", "ERROR"]).notNull(),
  textExcerpt: text("text_excerpt"),
  actionTaken: varchar("action_taken", { length: 128 }),
  ts: timestamp("ts").defaultNow().notNull(),
}, (table) => ({
  sessionIdx: index("policy_incident_session_idx").on(table.sessionId),
}));

// ============================================================================
// AUDIT & SECURITY
// ============================================================================

export const auditLog = mysqlTable("audit_log", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  actorType: varchar("actor_type", { length: 32 }).notNull(),
  actorId: varchar("actor_id", { length: 64 }),
  actorLabel: varchar("actor_label", { length: 255 }),
  action: varchar("action", { length: 128 }).notNull(),
  severity: mysqlEnum("severity", ["INFO", "WARN", "CRITICAL"]).notNull().default("INFO"),
  refType: varchar("ref_type", { length: 64 }).notNull(),
  refId: varchar("ref_id", { length: 64 }).notNull(),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("user_agent"),
  before: json("before").notNull().default("{}"),
  after: json("after").notNull().default("{}"),
  meta: json("meta").notNull().default("{}"),
  prevHash: varchar("prev_hash", { length: 64 }),
  entryHash: varchar("entry_hash", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  channelIdx: index("audit_channel_idx").on(table.channelId),
  actionIdx: index("audit_action_idx").on(table.action),
  refIdx: index("audit_ref_idx").on(table.refType, table.refId),
}));

// ============================================================================
// IDEMPOTENCY
// ============================================================================

export const idempotencyKeys = mysqlTable("idempotency_keys", {
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  scope: varchar("scope", { length: 64 }).notNull(),
  idemKey: varchar("idem_key", { length: 128 }).notNull(),
  requestHash: varchar("request_hash", { length: 64 }).notNull(),
  result: json("result").notNull().default("{}"),
  status: mysqlEnum("status", ["IN_PROGRESS", "COMPLETED", "FAILED"]).notNull().default("IN_PROGRESS"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  pk: uniqueIndex("idem_pk").on(table.channelId, table.scope, table.idemKey),
}));

// ============================================================================
// PERMISSIONS & RBAC
// ============================================================================

export const staffRoles = mysqlTable("staff_roles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  userId: varchar("user_id", { length: 64 }).notNull().references(() => users.id),
  role: mysqlEnum("role", ["ADMIN", "FINANCE", "TRUST_AND_SAFETY", "SUPPORT", "FOUNDER"]).notNull(),
  permissions: json("permissions").notNull().default("[]"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userChannelIdx: uniqueIndex("staff_user_channel_idx").on(table.userId, table.channelId),
}));

// ============================================================================
// SKU PROFITABILITY
// ============================================================================

export const skuProfitability = mysqlTable("sku_profitability", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  productId: varchar("product_id", { length: 64 }).notNull().references(() => products.id),
  date: timestamp("date").notNull(),
  revenue: decimal("revenue", { precision: 15, scale: 2 }).notNull().default("0.00"),
  cogs: decimal("cogs", { precision: 15, scale: 2 }).notNull().default("0.00"),
  shippingCost: decimal("shipping_cost", { precision: 15, scale: 2 }).notNull().default("0.00"),
  fees: decimal("fees", { precision: 15, scale: 2 }).notNull().default("0.00"),
  returnsCost: decimal("returns_cost", { precision: 15, scale: 2 }).notNull().default("0.00"),
  disputesCost: decimal("disputes_cost", { precision: 15, scale: 2 }).notNull().default("0.00"),
  netProfit: decimal("net_profit", { precision: 15, scale: 2 }).notNull().default("0.00"),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }).notNull().default("0.00"),
  unitsSold: int("units_sold").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  productDateIdx: uniqueIndex("sku_profit_product_date_idx").on(table.productId, table.date),
}));

// ============================================================================
// PRICING & PROMOTIONS
// ============================================================================

export const priceBooks = mysqlTable("price_books", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  region: varchar("region", { length: 64 }),
  currency: varchar("currency", { length: 3 }).notNull().default("AUD"),
  isActive: boolean("is_active").notNull().default(true),
  effectiveFrom: timestamp("effective_from").notNull(),
  effectiveTo: timestamp("effective_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const priceBookEntries = mysqlTable("price_book_entries", {
  id: varchar("id", { length: 64 }).primaryKey(),
  priceBookId: varchar("price_book_id", { length: 64 }).notNull().references(() => priceBooks.id),
  productId: varchar("product_id", { length: 64 }).notNull().references(() => products.id),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  minMarginPercent: decimal("min_margin_percent", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  priceBookProductIdx: uniqueIndex("price_book_product_idx").on(table.priceBookId, table.productId),
}));

export const promotions = mysqlTable("promotions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  promoType: mysqlEnum("promo_type", ["PERCENTAGE_OFF", "FIXED_AMOUNT", "BOGO", "BUNDLE"]).notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minPurchaseAmount: decimal("min_purchase_amount", { precision: 10, scale: 2 }),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  usageLimit: int("usage_limit"),
  usageCount: int("usage_count").notNull().default(0),
  status: mysqlEnum("status", ["SCHEDULED", "ACTIVE", "ENDED", "CANCELED"]).notNull().default("SCHEDULED"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("promotion_status_idx").on(table.status),
}));

export const bundles = mysqlTable("bundles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  bundlePrice: decimal("bundle_price", { precision: 10, scale: 2 }).notNull(),
  regularPrice: decimal("regular_price", { precision: 10, scale: 2 }).notNull(),
  savings: decimal("savings", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  status: mysqlEnum("status", ["ACTIVE", "INACTIVE"]).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bundleItems = mysqlTable("bundle_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  bundleId: varchar("bundle_id", { length: 64 }).notNull().references(() => bundles.id),
  productId: varchar("product_id", { length: 64 }).notNull().references(() => products.id),
  quantity: int("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// 3PL INTEGRATION
// ============================================================================

export const thirdPartyLogistics = mysqlTable("third_party_logistics", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  providerName: varchar("provider_name", { length: 255 }).notNull(),
  providerType: varchar("provider_type", { length: 64 }).notNull(),
  apiEndpoint: text("api_endpoint"),
  apiKey: text("api_key"),
  webhookUrl: text("webhook_url"),
  config: json("config").notNull().default("{}"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shipments = mysqlTable("shipments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  orderId: varchar("order_id", { length: 64 }).notNull().references(() => orders.id),
  thirdPartyLogisticsId: varchar("third_party_logistics_id", { length: 64 }).references(() => thirdPartyLogistics.id),
  trackingNumber: varchar("tracking_number", { length: 128 }),
  carrier: varchar("carrier", { length: 128 }),
  shippingLabelUrl: text("shipping_label_url"),
  status: mysqlEnum("status", [
    "PENDING",
    "LABEL_CREATED",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "FAILED",
    "RETURNED"
  ]).notNull().default("PENDING"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orderIdx: index("shipment_order_idx").on(table.orderId),
  trackingIdx: index("shipment_tracking_idx").on(table.trackingNumber),
}));

export const trackingEvents = mysqlTable("tracking_events", {
  id: varchar("id", { length: 64 }).primaryKey(),
  shipmentId: varchar("shipment_id", { length: 64 }).notNull().references(() => shipments.id),
  eventType: varchar("event_type", { length: 128 }).notNull(),
  eventDescription: text("event_description"),
  location: varchar("location", { length: 255 }),
  eventTime: timestamp("event_time").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  shipmentIdx: index("tracking_event_shipment_idx").on(table.shipmentId),
}));
