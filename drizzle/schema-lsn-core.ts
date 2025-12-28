import {
  mysqlTable,
  varchar,
  text,
  int,
  bigint,
  boolean,
  timestamp,
  date,
  json,
  mysqlEnum,
  decimal,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

/**
 * LSN Core Schema Extension
 * 
 * Comprehensive schema for Live Shopping Network specific features:
 * - Dispute automation & evidence packs
 * - Idempotency system
 * - Reconciliation engine
 * - Fraud scoring & risk management
 * - Refund/return automation (RMA)
 * - SKU profitability engine
 * - Creator scheduling & incentives
 * - Live show runner
 * - Pricing & promotions engine
 * - 3PL integration
 * - Purchasing & receiving (lots, landed cost)
 * - Supplier management
 * - Creative factory
 * - Executive dashboards
 * - Founder controls
 */

// ============================================================================
// DISPUTES & EVIDENCE AUTOMATION
// ============================================================================

export const lsnDisputes = mysqlTable("lsn_disputes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  provider: varchar("provider", { length: 64 }).default("PAYPAL").notNull(),
  providerCaseId: varchar("provider_case_id", { length: 255 }).notNull(),
  providerStatus: varchar("provider_status", { length: 64 }),
  orderId: varchar("order_id", { length: 64 }),
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
  ]).default("OPEN").notNull(),
  reason: text("reason"),
  amountCents: bigint("amount_cents", { mode: "number" }).default(0).notNull(),
  currency: varchar("currency", { length: 3 }).default("AUD").notNull(),
  evidenceDeadline: timestamp("evidence_deadline"),
  lastProviderUpdateAt: timestamp("last_provider_update_at"),
  evidencePackId: varchar("evidence_pack_id", { length: 64 }),
  needsManual: boolean("needs_manual").default(false).notNull(),
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
  evidenceDeadlineIdx: index("disputes_evidence_deadline_idx").on(table.evidenceDeadline),
}));

export const evidencePacks = mysqlTable("evidence_packs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  disputeId: varchar("dispute_id", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["BUILDING", "READY", "SUBMITTED", "FAILED"]).default("BUILDING").notNull(),
  trackingNumber: varchar("tracking_number", { length: 255 }),
  trackingUrl: text("tracking_url"),
  deliveryProof: json("delivery_proof"),
  productDescription: text("product_description"),
  customerCommunication: json("customer_communication"),
  refundPolicy: text("refund_policy"),
  termsOfService: text("terms_of_service"),
  attachments: json("attachments").$type<Array<{ url: string; type: string; name: string }>>(),
  submittedAt: timestamp("submitted_at"),
  submittedBy: varchar("submitted_by", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const disputeTimeline = mysqlTable("dispute_timeline", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  disputeId: varchar("dispute_id", { length: 64 }).notNull(),
  kind: varchar("kind", { length: 64 }).notNull(),
  message: text("message").notNull(),
  meta: json("meta").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  disputeIdx: index("dispute_timeline_dispute_idx").on(table.disputeId),
}));

export const providerWebhookDedup = mysqlTable("provider_webhook_dedup", {
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  eventId: varchar("event_id", { length: 255 }).notNull(),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
}, (table) => ({
  pk: uniqueIndex("provider_webhook_dedup_pk").on(table.channelId, table.provider, table.eventId),
}));

// ============================================================================
// IDEMPOTENCY SYSTEM
// ============================================================================

export const idempotencyKeys = mysqlTable("idempotency_keys", {
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  scope: varchar("scope", { length: 64 }).notNull(),
  idemKey: varchar("idem_key", { length: 255 }).notNull(),
  requestHash: varchar("request_hash", { length: 255 }).notNull(),
  result: json("result").default({}).notNull(),
  status: mysqlEnum("status", ["IN_PROGRESS", "COMPLETED", "FAILED"]).default("IN_PROGRESS").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  pk: uniqueIndex("idempotency_keys_pk").on(table.channelId, table.scope, table.idemKey),
  statusIdx: index("idempotency_keys_status_idx").on(table.status, table.createdAt),
}));

// ============================================================================
// RECONCILIATION ENGINE
// ============================================================================

export const providerTransactions = mysqlTable("provider_transactions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  providerTxnId: varchar("provider_txn_id", { length: 255 }).notNull(),
  txnType: varchar("txn_type", { length: 64 }).notNull(),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  feeCents: bigint("fee_cents", { mode: "number" }).default(0).notNull(),
  netCents: bigint("net_cents", { mode: "number" }).notNull(),
  status: varchar("status", { length: 64 }).notNull(),
  providerData: json("provider_data"),
  matchedOrderId: varchar("matched_order_id", { length: 64 }),
  matchedPayoutId: varchar("matched_payout_id", { length: 64 }),
  matchStatus: mysqlEnum("match_status", ["UNMATCHED", "AUTO_MATCHED", "MANUAL_MATCHED", "DISCREPANCY"]).default("UNMATCHED").notNull(),
  matchedAt: timestamp("matched_at"),
  matchedBy: varchar("matched_by", { length: 64 }),
  providerCreatedAt: timestamp("provider_created_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  providerTxnIdx: uniqueIndex("provider_txn_idx").on(table.channelId, table.provider, table.providerTxnId),
  matchStatusIdx: index("provider_txn_match_status_idx").on(table.matchStatus),
  providerCreatedIdx: index("provider_txn_created_idx").on(table.providerCreatedAt),
}));

export const reconciliationDiscrepancies = mysqlTable("reconciliation_discrepancies", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  severity: mysqlEnum("severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM").notNull(),
  description: text("description").notNull(),
  providerTxnId: varchar("provider_txn_id", { length: 64 }),
  orderId: varchar("order_id", { length: 64 }),
  expectedCents: bigint("expected_cents", { mode: "number" }),
  actualCents: bigint("actual_cents", { mode: "number" }),
  differenceCents: bigint("difference_cents", { mode: "number" }),
  status: mysqlEnum("status", ["OPEN", "INVESTIGATING", "RESOLVED", "ACCEPTED"]).default("OPEN").notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by", { length: 64 }),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusIdx: index("reconciliation_discrepancies_status_idx").on(table.status),
  severityIdx: index("reconciliation_discrepancies_severity_idx").on(table.severity),
}));

// ============================================================================
// FRAUD SCORING & RISK MANAGEMENT
// ============================================================================

export const fraudScores = mysqlTable("fraud_scores", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  orderId: varchar("order_id", { length: 64 }).notNull(),
  score: int("score").notNull(), // 0-100
  riskLevel: mysqlEnum("risk_level", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).notNull(),
  outcome: mysqlEnum("outcome", ["ALLOW", "REVIEW", "HOLD_PAYOUT", "BLOCK"]).notNull(),
  signals: json("signals").$type<Array<{ type: string; weight: number; value: any }>>(),
  velocityCheck: json("velocity_check"),
  deviceFingerprint: varchar("device_fingerprint", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  ipReputation: int("ip_reputation"),
  geoLocation: json("geo_location"),
  addressMatch: boolean("address_match"),
  accountAge: int("account_age"),
  orderValueAnomaly: boolean("order_value_anomaly"),
  blacklistMatch: boolean("blacklist_match"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  orderIdx: index("fraud_scores_order_idx").on(table.orderId),
  riskLevelIdx: index("fraud_scores_risk_level_idx").on(table.riskLevel),
  outcomeIdx: index("fraud_scores_outcome_idx").on(table.outcome),
}));

export const payoutHolds = mysqlTable("payout_holds", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  creatorId: varchar("creator_id", { length: 64 }).notNull(),
  orderId: varchar("order_id", { length: 64 }),
  reason: varchar("reason", { length: 255 }).notNull(),
  holdType: mysqlEnum("hold_type", ["FRAUD", "DISPUTE", "MANUAL", "POLICY"]).notNull(),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  status: mysqlEnum("status", ["ACTIVE", "RELEASED", "FORFEITED"]).default("ACTIVE").notNull(),
  releasedAt: timestamp("released_at"),
  releasedBy: varchar("released_by", { length: 64 }),
  releaseReason: text("release_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  creatorStatusIdx: index("payout_holds_creator_status_idx").on(table.creatorId, table.status),
}));

// ============================================================================
// REFUND & RETURN AUTOMATION (RMA)
// ============================================================================

export const refundPolicies = mysqlTable("refund_policies", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  rules: json("rules").$type<Array<{ condition: string; action: string; params: any }>>(),
  autoApproveThresholdCents: bigint("auto_approve_threshold_cents", { mode: "number" }),
  requiresRma: boolean("requires_rma").default(false).notNull(),
  restockingFeePercent: decimal("restocking_fee_percent", { precision: 5, scale: 2 }),
  returnWindowDays: int("return_window_days").default(30).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const returnRequests = mysqlTable("return_requests", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  orderId: varchar("order_id", { length: 64 }).notNull(),
  orderItemId: varchar("order_item_id", { length: 64 }).notNull(),
  customerId: int("customer_id").notNull(),
  reason: varchar("reason", { length: 255 }).notNull(),
  reasonDetails: text("reason_details"),
  status: mysqlEnum("status", [
    "REQUESTED",
    "APPROVED",
    "RMA_ISSUED",
    "IN_TRANSIT",
    "RECEIVED",
    "INSPECTING",
    "APPROVED_FOR_REFUND",
    "RESTOCKED",
    "REFUNDED",
    "REJECTED",
    "CANCELED"
  ]).default("REQUESTED").notNull(),
  rmaNumber: varchar("rma_number", { length: 64 }),
  returnLabelUrl: text("return_label_url"),
  trackingNumber: varchar("tracking_number", { length: 255 }),
  receivedAt: timestamp("received_at"),
  inspectedAt: timestamp("inspected_at"),
  inspectedBy: varchar("inspected_by", { length: 64 }),
  inspectionNotes: text("inspection_notes"),
  inspectionResult: mysqlEnum("inspection_result", ["PASS", "FAIL", "PARTIAL"]),
  restockingFeeCents: bigint("restocking_fee_cents", { mode: "number" }).default(0).notNull(),
  refundAmountCents: bigint("refund_amount_cents", { mode: "number" }),
  refundedAt: timestamp("refunded_at"),
  policyId: varchar("policy_id", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orderIdx: index("return_requests_order_idx").on(table.orderId),
  statusIdx: index("return_requests_status_idx").on(table.status),
  rmaIdx: uniqueIndex("return_requests_rma_idx").on(table.rmaNumber),
}));

// ============================================================================
// SKU PROFITABILITY ENGINE
// ============================================================================

export const skuProfitability = mysqlTable("sku_profitability", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  variantId: varchar("variant_id", { length: 64 }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  unitsSold: int("units_sold").default(0).notNull(),
  grossRevenueCents: bigint("gross_revenue_cents", { mode: "number" }).default(0).notNull(),
  cogsCents: bigint("cogs_cents", { mode: "number" }).default(0).notNull(),
  shippingCostCents: bigint("shipping_cost_cents", { mode: "number" }).default(0).notNull(),
  paymentFeesCents: bigint("payment_fees_cents", { mode: "number" }).default(0).notNull(),
  platformFeesCents: bigint("platform_fees_cents", { mode: "number" }).default(0).notNull(),
  returnCostCents: bigint("return_cost_cents", { mode: "number" }).default(0).notNull(),
  marketingCostCents: bigint("marketing_cost_cents", { mode: "number" }).default(0).notNull(),
  creatorCommissionCents: bigint("creator_commission_cents", { mode: "number" }).default(0).notNull(),
  netProfitCents: bigint("net_profit_cents", { mode: "number" }).default(0).notNull(),
  profitMarginPercent: decimal("profit_margin_percent", { precision: 5, scale: 2 }),
  roiPercent: decimal("roi_percent", { precision: 5, scale: 2 }),
  decision: mysqlEnum("decision", ["SCALE", "MAINTAIN", "REVIEW", "KILL"]),
  decisionReason: text("decision_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  variantPeriodIdx: uniqueIndex("sku_profitability_variant_period_idx").on(
    table.variantId,
    table.periodStart
  ),
  decisionIdx: index("sku_profitability_decision_idx").on(table.decision),
}));

export const skuKillRules = mysqlTable("sku_kill_rules", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  condition: json("condition").$type<{ type: string; operator: string; value: any }>(),
  action: varchar("action", { length: 64 }).notNull(),
  priority: int("priority").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// CREATOR SCHEDULING GRID
// ============================================================================

export const broadcastChannels = mysqlTable("broadcast_channels", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull(),
  description: text("description"),
  streamKey: varchar("stream_key", { length: 255 }),
  status: mysqlEnum("status", ["active", "disabled"]).default("active").notNull(),
  settings: json("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  slugIdx: uniqueIndex("broadcast_channels_slug_idx").on(table.channelId, table.slug),
}));

export const scheduleSlots = mysqlTable("schedule_slots", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  broadcastChannelId: varchar("broadcast_channel_id", { length: 64 }).notNull(),
  creatorId: varchar("creator_id", { length: 64 }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: mysqlEnum("status", ["SCHEDULED", "LIVE", "COMPLETED", "CANCELED", "NO_SHOW"]).default("SCHEDULED").notNull(),
  isPrimeTime: boolean("is_prime_time").default(false).notNull(),
  autoFilled: boolean("auto_filled").default(false).notNull(),
  performanceScore: decimal("performance_score", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  broadcastTimeIdx: index("schedule_slots_broadcast_time_idx").on(
    table.broadcastChannelId,
    table.startTime
  ),
  creatorTimeIdx: index("schedule_slots_creator_time_idx").on(table.creatorId, table.startTime),
  statusIdx: index("schedule_slots_status_idx").on(table.status),
}));

export const creatorAvailability = mysqlTable("creator_availability", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  creatorId: varchar("creator_id", { length: 64 }).notNull(),
  dayOfWeek: int("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: varchar("start_time", { length: 5 }).notNull(), // HH:MM format
  endTime: varchar("end_time", { length: 5 }).notNull(),
  isRecurring: boolean("is_recurring").default(true).notNull(),
  specificDate: timestamp("specific_date"),
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  creatorDayIdx: index("creator_availability_creator_day_idx").on(table.creatorId, table.dayOfWeek),
}));

// ============================================================================
// LIVE SHOW RUNNER
// ============================================================================

export const liveShowSegments = mysqlTable("live_show_segments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  liveSessionId: varchar("live_session_id", { length: 64 }).notNull(),
  segmentType: varchar("segment_type", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startOffsetSeconds: int("start_offset_seconds").notNull(),
  durationSeconds: int("duration_seconds"),
  productIds: json("product_ids").$type<string[]>(),
  scriptNotes: text("script_notes"),
  actualStartedAt: timestamp("actual_started_at"),
  actualEndedAt: timestamp("actual_ended_at"),
  performanceMetrics: json("performance_metrics"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sessionIdx: index("live_show_segments_session_idx").on(table.liveSessionId),
}));

export const livePriceDrops = mysqlTable("live_price_drops", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  liveSessionId: varchar("live_session_id", { length: 64 }).notNull(),
  variantId: varchar("variant_id", { length: 64 }).notNull(),
  originalPriceCents: bigint("original_price_cents", { mode: "number" }).notNull(),
  dropPriceCents: bigint("drop_price_cents", { mode: "number" }).notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).notNull(),
  startedAt: timestamp("started_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  quantityLimit: int("quantity_limit"),
  quantitySold: int("quantity_sold").default(0).notNull(),
  status: mysqlEnum("status", ["SCHEDULED", "ACTIVE", "ENDED", "CANCELED"]).default("SCHEDULED").notNull(),
  urgencyMessage: varchar("urgency_message", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sessionStatusIdx: index("live_price_drops_session_status_idx").on(
    table.liveSessionId,
    table.status
  ),
}));

export const liveHighlights = mysqlTable("live_highlights", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  liveSessionId: varchar("live_session_id", { length: 64 }).notNull(),
  timestampSeconds: int("timestamp_seconds").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  clipUrl: text("clip_url"),
  clipStatus: mysqlEnum("clip_status", ["PENDING", "PROCESSING", "READY", "FAILED"]).default("PENDING").notNull(),
  productIds: json("product_ids").$type<string[]>(),
  viewCount: int("view_count").default(0).notNull(),
  shareCount: int("share_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sessionIdx: index("live_highlights_session_idx").on(table.liveSessionId),
  clipStatusIdx: index("live_highlights_clip_status_idx").on(table.clipStatus),
}));

// ============================================================================
// PRICING & PROMOTIONS ENGINE
// ============================================================================

export const priceBooks = mysqlTable("price_books", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  version: int("version").default(1).notNull(),
  status: mysqlEnum("status", ["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT").notNull(),
  effectiveFrom: timestamp("effective_from"),
  effectiveTo: timestamp("effective_to"),
  createdBy: varchar("created_by", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusIdx: index("price_books_status_idx").on(table.status),
}));

export const priceBookEntries = mysqlTable("price_book_entries", {
  id: varchar("id", { length: 64 }).primaryKey(),
  priceBookId: varchar("price_book_id", { length: 64 }).notNull(),
  variantId: varchar("variant_id", { length: 64 }).notNull(),
  priceCents: bigint("price_cents", { mode: "number" }).notNull(),
  comparePriceCents: bigint("compare_price_cents", { mode: "number" }),
  costCents: bigint("cost_cents", { mode: "number" }),
  marginPercent: decimal("margin_percent", { precision: 5, scale: 2 }),
  minPriceCents: bigint("min_price_cents", { mode: "number" }),
  maxPriceCents: bigint("max_price_cents", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  priceBookVariantIdx: uniqueIndex("price_book_entries_book_variant_idx").on(
    table.priceBookId,
    table.variantId
  ),
}));

export const promotions = mysqlTable("promotions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  code: varchar("code", { length: 64 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", [
    "PERCENTAGE",
    "FIXED_AMOUNT",
    "FREE_SHIPPING",
    "BOGO",
    "BUNDLE"
  ]).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  minOrderCents: bigint("min_order_cents", { mode: "number" }),
  maxDiscountCents: bigint("max_discount_cents", { mode: "number" }),
  usageLimit: int("usage_limit"),
  usageCount: int("usage_count").default(0).notNull(),
  perCustomerLimit: int("per_customer_limit"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: mysqlEnum("status", ["DRAFT", "ACTIVE", "PAUSED", "EXPIRED"]).default("DRAFT").notNull(),
  appliesTo: json("applies_to").$type<{ type: string; ids: string[] }>(),
  excludes: json("excludes").$type<{ type: string; ids: string[] }>(),
  stackable: boolean("stackable").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  codeIdx: uniqueIndex("promotions_code_idx").on(table.channelId, table.code),
  statusIdx: index("promotions_status_idx").on(table.status),
  datesIdx: index("promotions_dates_idx").on(table.startDate, table.endDate),
}));

export const bundles = mysqlTable("bundles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  bundleType: mysqlEnum("bundle_type", ["FIXED", "MIX_AND_MATCH"]).notNull(),
  items: json("items").$type<Array<{ variantId: string; quantity: number; optional?: boolean }>>(),
  priceCents: bigint("price_cents", { mode: "number" }).notNull(),
  comparePriceCents: bigint("compare_price_cents", { mode: "number" }),
  savingsPercent: decimal("savings_percent", { precision: 5, scale: 2 }),
  status: mysqlEnum("status", ["ACTIVE", "DISABLED"]).default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// 3PL INTEGRATION
// ============================================================================

export const thirdPartyLogisticsProviders = mysqlTable("third_party_logistics_providers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  providerType: varchar("provider_type", { length: 64 }).notNull(),
  apiEndpoint: text("api_endpoint"),
  apiKeyEnc: text("api_key_enc"),
  webhookSecret: varchar("webhook_secret", { length: 255 }),
  capabilities: json("capabilities").$type<string[]>(),
  status: mysqlEnum("status", ["ACTIVE", "DISABLED", "TESTING"]).default("TESTING").notNull(),
  settings: json("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const thirdPartyShipments = mysqlTable("third_party_shipments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  providerId: varchar("provider_id", { length: 64 }).notNull(),
  orderId: varchar("order_id", { length: 64 }).notNull(),
  providerShipmentId: varchar("provider_shipment_id", { length: 255 }),
  status: mysqlEnum("status", [
    "PENDING",
    "SENT_TO_3PL",
    "ACKNOWLEDGED",
    "PICKING",
    "PACKING",
    "SHIPPED",
    "DELIVERED",
    "FAILED",
    "CANCELED"
  ]).default("PENDING").notNull(),
  trackingNumber: varchar("tracking_number", { length: 255 }),
  trackingUrl: text("tracking_url"),
  labelUrl: text("label_url"),
  carrier: varchar("carrier", { length: 64 }),
  serviceLevel: varchar("service_level", { length: 64 }),
  sentAt: timestamp("sent_at"),
  acknowledgedAt: timestamp("acknowledged_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  lastSyncAt: timestamp("last_sync_at"),
  providerData: json("provider_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  orderIdx: index("third_party_shipments_order_idx").on(table.orderId),
  providerShipmentIdx: uniqueIndex("third_party_shipments_provider_idx").on(
    table.providerId,
    table.providerShipmentId
  ),
  statusIdx: index("third_party_shipments_status_idx").on(table.status),
}));

export const thirdPartyTrackingEvents = mysqlTable("third_party_tracking_events", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  shipmentId: varchar("shipment_id", { length: 64 }).notNull(),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  eventCode: varchar("event_code", { length: 64 }),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  eventTime: timestamp("event_time").notNull(),
  providerData: json("provider_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  shipmentIdx: index("third_party_tracking_events_shipment_idx").on(table.shipmentId),
  eventTimeIdx: index("third_party_tracking_events_time_idx").on(table.eventTime),
}));

// ============================================================================
// PURCHASING & RECEIVING (LOTS, LANDED COST)
// ============================================================================

export const inventoryLots = mysqlTable("inventory_lots", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  variantId: varchar("variant_id", { length: 64 }).notNull(),
  warehouseId: varchar("warehouse_id", { length: 64 }).notNull(),
  lotNumber: varchar("lot_number", { length: 128 }).notNull(),
  purchaseOrderId: varchar("purchase_order_id", { length: 64 }),
  supplierId: varchar("supplier_id", { length: 64 }),
  quantityReceived: int("quantity_received").notNull(),
  quantityAvailable: int("quantity_available").notNull(),
  quantityReserved: int("quantity_reserved").default(0).notNull(),
  quantityAllocated: int("quantity_allocated").default(0).notNull(),
  unitCostCents: bigint("unit_cost_cents", { mode: "number" }).notNull(),
  landedCostCents: bigint("landed_cost_cents", { mode: "number" }).notNull(),
  shippingCostCents: bigint("shipping_cost_cents", { mode: "number" }).default(0).notNull(),
  dutyCostCents: bigint("duty_cost_cents", { mode: "number" }).default(0).notNull(),
  otherCostCents: bigint("other_cost_cents", { mode: "number" }).default(0).notNull(),
  receivedAt: timestamp("received_at").notNull(),
  expiresAt: timestamp("expires_at"),
  status: mysqlEnum("status", ["ACTIVE", "DEPLETED", "EXPIRED", "QUARANTINED"]).default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  lotNumberIdx: uniqueIndex("inventory_lots_lot_number_idx").on(table.channelId, table.lotNumber),
  variantWarehouseIdx: index("inventory_lots_variant_warehouse_idx").on(
    table.variantId,
    table.warehouseId
  ),
  statusIdx: index("inventory_lots_status_idx").on(table.status),
}));

export const receivingWorkflows = mysqlTable("receiving_workflows", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  purchaseOrderId: varchar("purchase_order_id", { length: 64 }).notNull(),
  warehouseId: varchar("warehouse_id", { length: 64 }).notNull(),
  status: mysqlEnum("status", [
    "EXPECTED",
    "ARRIVED",
    "INSPECTING",
    "COMPLETED",
    "DISCREPANCY",
    "REJECTED"
  ]).default("EXPECTED").notNull(),
  expectedAt: timestamp("expected_at"),
  arrivedAt: timestamp("arrived_at"),
  completedAt: timestamp("completed_at"),
  receivedBy: varchar("received_by", { length: 64 }),
  inspectedBy: varchar("inspected_by", { length: 64 }),
  discrepancies: json("discrepancies").$type<Array<{ item: string; expected: number; received: number }>>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  poIdx: index("receiving_workflows_po_idx").on(table.purchaseOrderId),
  statusIdx: index("receiving_workflows_status_idx").on(table.status),
}));

// ============================================================================
// SUPPLIER MANAGEMENT
// ============================================================================

export const supplierContacts = mysqlTable("supplier_contacts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  supplierId: varchar("supplier_id", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 128 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  supplierIdx: index("supplier_contacts_supplier_idx").on(table.supplierId),
}));

export const supplierContracts = mysqlTable("supplier_contracts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  supplierId: varchar("supplier_id", { length: 64 }).notNull(),
  contractNumber: varchar("contract_number", { length: 128 }),
  terms: text("terms"),
  leadTimeDays: int("lead_time_days"),
  moq: int("moq"),
  paymentTerms: varchar("payment_terms", { length: 255 }),
  defectRateThresholdPercent: decimal("defect_rate_threshold_percent", { precision: 5, scale: 2 }),
  exclusivityClause: text("exclusivity_clause"),
  ipOwnership: text("ip_ownership"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  autoRenew: boolean("auto_renew").default(false).notNull(),
  status: mysqlEnum("status", ["DRAFT", "ACTIVE", "EXPIRED", "TERMINATED"]).default("DRAFT").notNull(),
  documentUrl: text("document_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  supplierIdx: index("supplier_contracts_supplier_idx").on(table.supplierId),
  statusIdx: index("supplier_contracts_status_idx").on(table.status),
}));

export const supplierPerformance = mysqlTable("supplier_performance", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  supplierId: varchar("supplier_id", { length: 64 }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  totalOrders: int("total_orders").default(0).notNull(),
  onTimeDeliveries: int("on_time_deliveries").default(0).notNull(),
  onTimePercent: decimal("on_time_percent", { precision: 5, scale: 2 }),
  totalUnitsReceived: int("total_units_received").default(0).notNull(),
  defectiveUnits: int("defective_units").default(0).notNull(),
  defectRatePercent: decimal("defect_rate_percent", { precision: 5, scale: 2 }),
  averageLeadTimeDays: decimal("average_lead_time_days", { precision: 5, scale: 1 }),
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }),
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  supplierPeriodIdx: uniqueIndex("supplier_performance_supplier_period_idx").on(
    table.supplierId,
    table.periodStart
  ),
}));

export const supplierSamples = mysqlTable("supplier_samples", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  supplierId: varchar("supplier_id", { length: 64 }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  requestedAt: timestamp("requested_at").notNull(),
  receivedAt: timestamp("received_at"),
  status: mysqlEnum("status", [
    "REQUESTED",
    "SHIPPED",
    "RECEIVED",
    "TESTING",
    "APPROVED",
    "REJECTED"
  ]).default("REQUESTED").notNull(),
  evaluationNotes: text("evaluation_notes"),
  evaluatedBy: varchar("evaluated_by", { length: 64 }),
  evaluatedAt: timestamp("evaluated_at"),
  approvalDecision: mysqlEnum("approval_decision", ["APPROVED", "REJECTED", "NEEDS_REVISION"]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  supplierIdx: index("supplier_samples_supplier_idx").on(table.supplierId),
  statusIdx: index("supplier_samples_status_idx").on(table.status),
}));

// ============================================================================
// CREATIVE FACTORY
// ============================================================================

export const creativeAssets = mysqlTable("creative_assets", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  assetType: mysqlEnum("asset_type", [
    "VIDEO_CLIP",
    "IMAGE",
    "HOOK",
    "UGC",
    "AD_CREATIVE",
    "THUMBNAIL",
    "CLAIMS_PROOF"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  mimeType: varchar("mime_type", { length: 128 }),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
  durationSeconds: int("duration_seconds"),
  productIds: json("product_ids").$type<string[]>(),
  liveSessionId: varchar("live_session_id", { length: 64 }),
  tags: json("tags").$type<string[]>(),
  performanceMetrics: json("performance_metrics").$type<{
    views?: number;
    clicks?: number;
    conversions?: number;
    ctr?: number;
    conversionRate?: number;
  }>(),
  status: mysqlEnum("status", ["DRAFT", "READY", "PUBLISHED", "ARCHIVED"]).default("DRAFT").notNull(),
  createdBy: varchar("created_by", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  assetTypeIdx: index("creative_assets_type_idx").on(table.assetType),
  liveSessionIdx: index("creative_assets_live_session_idx").on(table.liveSessionId),
  statusIdx: index("creative_assets_status_idx").on(table.status),
}));

export const hooksLibrary = mysqlTable("hooks_library", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  hookText: text("hook_text").notNull(),
  category: varchar("category", { length: 128 }),
  productCategory: varchar("product_category", { length: 128 }),
  performanceScore: decimal("performance_score", { precision: 5, scale: 2 }),
  usageCount: int("usage_count").default(0).notNull(),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const ugcBriefs = mysqlTable("ugc_briefs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  productId: varchar("product_id", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  briefText: text("brief_text").notNull(),
  keyMessages: json("key_messages").$type<string[]>(),
  dosList: json("dos_list").$type<string[]>(),
  dontsList: json("donts_list").$type<string[]>(),
  targetDurationSeconds: int("target_duration_seconds"),
  budget: int("budget"),
  status: mysqlEnum("status", ["DRAFT", "ACTIVE", "COMPLETED", "CANCELED"]).default("DRAFT").notNull(),
  createdBy: varchar("created_by", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// EXECUTIVE DASHBOARDS
// ============================================================================

export const executiveMetrics = mysqlTable("executive_metrics", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  metricDate: timestamp("metric_date").notNull(),
  gmvCents: bigint("gmv_cents", { mode: "number" }).default(0).notNull(),
  netProfitCents: bigint("net_profit_cents", { mode: "number" }).default(0).notNull(),
  cashPositionCents: bigint("cash_position_cents", { mode: "number" }).default(0).notNull(),
  reservesCents: bigint("reserves_cents", { mode: "number" }).default(0).notNull(),
  trustHealthScore: decimal("trust_health_score", { precision: 5, scale: 2 }),
  opsHealthScore: decimal("ops_health_score", { precision: 5, scale: 2 }),
  activeOrders: int("active_orders").default(0).notNull(),
  activeDisputes: int("active_disputes").default(0).notNull(),
  pendingRefunds: int("pending_refunds").default(0).notNull(),
  liveShowsCount: int("live_shows_count").default(0).notNull(),
  activeCreators: int("active_creators").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  channelDateIdx: uniqueIndex("executive_metrics_channel_date_idx").on(
    table.channelId,
    table.metricDate
  ),
}));

export const topPerformers = mysqlTable("top_performers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  performerType: mysqlEnum("performer_type", ["SKU", "CREATOR", "LIVE_SHOW"]).notNull(),
  performerId: varchar("performer_id", { length: 64 }).notNull(),
  performerName: varchar("performer_name", { length: 255 }).notNull(),
  rank: int("rank").notNull(),
  revenueCents: bigint("revenue_cents", { mode: "number" }).default(0).notNull(),
  profitCents: bigint("profit_cents", { mode: "number" }).default(0).notNull(),
  unitsSold: int("units_sold").default(0).notNull(),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  periodTypeIdx: index("top_performers_period_type_idx").on(
    table.periodStart,
    table.performerType
  ),
}));

// ============================================================================
// FOUNDER CONTROLS
// ============================================================================

export const escalations = mysqlTable("escalations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  severity: mysqlEnum("severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM").notNull(),
  status: mysqlEnum("status", ["OPEN", "ACKED", "CLOSED"]).default("OPEN").notNull(),
  sessionId: varchar("session_id", { length: 64 }),
  triggerType: varchar("trigger_type", { length: 128 }).notNull(),
  triggerJson: json("trigger_json"),
  ackByUserId: varchar("ack_by_user_id", { length: 64 }),
  ackTs: timestamp("ack_ts"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusIdx: index("escalations_status_idx").on(table.status),
  severityIdx: index("escalations_severity_idx").on(table.severity),
}));

export const policyIncidents = mysqlTable("policy_incidents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  sessionId: varchar("session_id", { length: 64 }),
  ruleId: varchar("rule_id", { length: 128 }).notNull(),
  severity: mysqlEnum("severity", ["INFO", "WARNING", "ERROR", "CRITICAL"]).default("INFO").notNull(),
  textExcerpt: text("text_excerpt"),
  actionTaken: varchar("action_taken", { length: 255 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sessionIdx: index("policy_incidents_session_idx").on(table.sessionId),
  severityIdx: index("policy_incidents_severity_idx").on(table.severity),
}));

export const regressionSeeds = mysqlTable("regression_seeds", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  sessionId: varchar("session_id", { length: 64 }),
  chatEventId: varchar("chat_event_id", { length: 64 }),
  ruleId: varchar("rule_id", { length: 128 }),
  textExcerpt: text("text_excerpt").notNull(),
  status: mysqlEnum("status", ["OPEN", "APPROVED", "REJECTED"]).default("OPEN").notNull(),
  requestedBy: varchar("requested_by", { length: 64 }),
  decidedBy: varchar("decided_by", { length: 64 }),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("regression_seeds_status_idx").on(table.status),
}));

// ============================================================================
// LAUNCH TEMPLATES & WORKFLOWS
// ============================================================================

export const trendSpotting = mysqlTable("trend_spotting", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  trendName: varchar("trend_name", { length: 255 }).notNull(),
  source: varchar("source", { length: 128 }),
  sourceUrl: text("source_url"),
  category: varchar("category", { length: 128 }),
  trendScore: decimal("trend_score", { precision: 5, scale: 2 }),
  potentialRevenueCents: bigint("potential_revenue_cents", { mode: "number" }),
  status: mysqlEnum("status", [
    "SPOTTED",
    "EVALUATING",
    "SOURCING",
    "APPROVED",
    "IN_PRODUCTION",
    "LAUNCHED",
    "REJECTED"
  ]).default("SPOTTED").notNull(),
  notes: text("notes"),
  spottedBy: varchar("spotted_by", { length: 64 }),
  spottedAt: timestamp("spotted_at").notNull(),
  peakPredictedAt: timestamp("peak_predicted_at"),
  launchedAt: timestamp("launched_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusIdx: index("trend_spotting_status_idx").on(table.status),
  spottedAtIdx: index("trend_spotting_spotted_at_idx").on(table.spottedAt),
}));

export const launchChecklists = mysqlTable("launch_checklists", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  productId: varchar("product_id", { length: 64 }).notNull(),
  trendId: varchar("trend_id", { length: 64 }),
  status: mysqlEnum("status", ["IN_PROGRESS", "COMPLETED", "BLOCKED"]).default("IN_PROGRESS").notNull(),
  targetLaunchDate: timestamp("target_launch_date"),
  actualLaunchDate: timestamp("actual_launch_date"),
  checklistItems: json("checklistItems").$type<Array<{
    id: string;
    task: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
    assignee?: string;
    completedAt?: string;
  }>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  productIdx: index("launch_checklists_product_idx").on(table.productId),
  statusIdx: index("launch_checklists_status_idx").on(table.status),
}));

// ============================================================================
// GLOBAL EXPANSION
// ============================================================================

export const regionConfigs = mysqlTable("region_configs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  regionCode: varchar("region_code", { length: 8 }).notNull(),
  regionName: varchar("region_name", { length: 255 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  language: varchar("language", { length: 8 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }),
  shippingRules: json("shipping_rules"),
  complianceRules: json("compliance_rules"),
  paymentMethods: json("payment_methods").$type<string[]>(),
  status: mysqlEnum("status", ["ACTIVE", "COMING_SOON", "DISABLED"]).default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  regionCodeIdx: uniqueIndex("region_configs_region_code_idx").on(table.channelId, table.regionCode),
}));

export const regionalInventory = mysqlTable("regional_inventory", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  variantId: varchar("variant_id", { length: 64 }).notNull(),
  regionCode: varchar("region_code", { length: 8 }).notNull(),
  warehouseId: varchar("warehouse_id", { length: 64 }).notNull(),
  quantityAvailable: int("quantity_available").default(0).notNull(),
  quantityReserved: int("quantity_reserved").default(0).notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  variantRegionIdx: uniqueIndex("regional_inventory_variant_region_idx").on(
    table.variantId,
    table.regionCode
  ),
}));


// ============================================================================
// FINANCIAL OPERATIONS: Ledger, Payouts, Reconciliation
// ============================================================================

export const ledgerAccounts = mysqlTable("ledger_accounts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["ASSET", "LIABILITY", "INCOME", "EXPENSE", "EQUITY"]).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("AUD"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelCodeIdx: uniqueIndex("channel_code_idx").on(table.channelId, table.code),
}));

export const ledgerEntries = mysqlTable("ledger_entries", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  txnId: varchar("txn_id", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["PENDING", "POSTED", "REVERSED", "VOID"]).notNull().default("POSTED"),
  
  accountId: varchar("account_id", { length: 64 }).notNull(),
  direction: mysqlEnum("direction", ["DEBIT", "CREDIT"]).notNull(),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("AUD"),
  
  // Legacy fields for backward compatibility
  entryType: varchar("entry_type", { length: 64 }),
  refType: varchar("ref_type", { length: 64 }).notNull(),
  refId: varchar("ref_id", { length: 64 }).notNull(),
  debitAccount: varchar("debit_account", { length: 64 }),
  creditAccount: varchar("credit_account", { length: 64 }),
  
  counterpartyType: varchar("counterparty_type", { length: 64 }),
  counterpartyId: varchar("counterparty_id", { length: 64 }),
  description: text("description"),
  memo: text("memo"),
  
  fxRate: decimal("fx_rate", { precision: 10, scale: 6 }),
  baseCurrency: varchar("base_currency", { length: 3 }),
  baseAmountCents: bigint("base_amount_cents", { mode: "number" }),
  
  createdBy: varchar("created_by", { length: 64 }),
  postedAt: timestamp("posted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  metadata: json("metadata").$type<any>(),
}, (table) => ({
  channelPostedIdx: index("channel_posted_idx").on(table.channelId, table.postedAt),
  channelTxnIdx: index("channel_txn_idx").on(table.channelId, table.txnId),
  refIdx: index("ref_idx").on(table.channelId, table.refType, table.refId),
  accountIdx: index("account_idx").on(table.channelId, table.accountId),
}));

export const creatorPayouts = mysqlTable("creator_payouts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  
  creatorId: varchar("creator_id", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PROCESSING", "PAID", "FAILED", "CANCELED", "PENDING", "COMPLETED", "HELD"]).notNull().default("DRAFT"),
  method: mysqlEnum("method", ["BANK_TRANSFER", "PAYPAL", "STRIPE_CONNECT", "MANUAL", "WISE"]).notNull().default("BANK_TRANSFER"),
  
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  
  currency: varchar("currency", { length: 3 }).notNull().default("AUD"),
  grossCents: bigint("gross_cents", { mode: "number" }).notNull().default(0),
  feesCents: bigint("fees_cents", { mode: "number" }).notNull().default(0),
  adjustmentsCents: bigint("adjustments_cents", { mode: "number" }).notNull().default(0),
  netCents: bigint("net_cents", { mode: "number" }).notNull().default(0),
  
  // Legacy fields
  amountCents: bigint("amount_cents", { mode: "number" }),
  feeCents: bigint("fee_cents", { mode: "number" }),
  
  destinationRef: text("destination_ref"),
  payoutProvider: varchar("payout_provider", { length: 64 }),
  provider: varchar("provider", { length: 64 }),
  providerPayoutId: varchar("provider_payout_id", { length: 255 }),
  providerTxnId: varchar("provider_txn_id", { length: 255 }),
  providerStatus: varchar("provider_status", { length: 64 }),
  
  createdBy: varchar("created_by", { length: 64 }),
  approvedBy: varchar("approved_by", { length: 64 }),
  approvedAt: timestamp("approved_at"),
  
  requestedAt: timestamp("requested_at"),
  paidAt: timestamp("paid_at"),
  processedAt: timestamp("processed_at"),
  
  holdReason: text("hold_reason"),
  notes: text("notes"),
  metadata: json("metadata").$type<any>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelCreatorIdx: index("channel_creator_idx").on(table.channelId, table.creatorId, table.createdAt),
  channelStatusIdx: index("channel_status_idx").on(table.channelId, table.status),
  periodIdx: index("period_idx").on(table.channelId, table.periodStart, table.periodEnd),
}));

export const creatorPayoutItems = mysqlTable("creator_payout_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  
  payoutId: varchar("payout_id", { length: 64 }).notNull().references(() => creatorPayouts.id, { onDelete: "cascade" }),
  
  ledgerTxnId: varchar("ledger_txn_id", { length: 64 }),
  ledgerEntryId: varchar("ledger_entry_id", { length: 64 }),
  
  referenceType: varchar("reference_type", { length: 64 }).notNull(),
  referenceId: varchar("reference_id", { length: 64 }).notNull(),
  
  description: text("description"),
  currency: varchar("currency", { length: 3 }).notNull().default("AUD"),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: json("metadata").$type<any>(),
}, (table) => ({
  payoutIdx: index("payout_idx").on(table.payoutId),
  refIdx: index("ref_idx").on(table.channelId, table.referenceType, table.referenceId),
}));

export const externalTransactions = mysqlTable("external_transactions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  
  source: mysqlEnum("source", ["STRIPE", "PAYPAL", "SHOPIFY", "TIKTOK_SHOP", "BANK", "WISE", "OTHER"]).notNull(),
  externalId: varchar("external_id", { length: 255 }).notNull(),
  occurredAt: timestamp("occurred_at").notNull(),
  
  currency: varchar("currency", { length: 3 }).notNull().default("AUD"),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  
  description: text("description"),
  raw: json("raw").$type<any>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  channelSourceExtIdx: uniqueIndex("channel_source_ext_idx").on(table.channelId, table.source, table.externalId),
  channelTimeIdx: index("channel_time_idx").on(table.channelId, table.occurredAt),
  amountIdx: index("amount_idx").on(table.channelId, table.amountCents),
}));

export const reconciliationMatches = mysqlTable("reconciliation_matches", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  
  status: mysqlEnum("status", ["SUGGESTED", "MATCHED", "DISMISSED", "UNMATCHED"]).notNull().default("SUGGESTED"),
  source: mysqlEnum("source", ["STRIPE", "PAYPAL", "SHOPIFY", "TIKTOK_SHOP", "BANK", "WISE", "OTHER"]).notNull(),
  
  externalTransactionId: varchar("external_transaction_id", { length: 64 }).notNull().references(() => externalTransactions.id, { onDelete: "cascade" }),
  
  // Legacy fields for backward compatibility
  providerTxnId: varchar("provider_txn_id", { length: 64 }),
  ledgerEntryId: varchar("ledger_entry_id", { length: 64 }),
  
  ledgerTxnId: varchar("ledger_txn_id", { length: 64 }),
  
  matchReason: text("match_reason"),
  matchType: varchar("match_type", { length: 64 }),
  matchConfidence: decimal("match_confidence", { precision: 5, scale: 2 }).notNull().default("0.00"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  discrepancyCents: bigint("discrepancy_cents", { mode: "number" }).default(0),
  
  matchedBy: varchar("matched_by", { length: 64 }),
  matchedAt: timestamp("matched_at"),
  
  notes: text("notes"),
  metadata: json("metadata").$type<any>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  channelStatusIdx: index("channel_status_idx").on(table.channelId, table.status),
  externalIdx: index("external_idx").on(table.externalTransactionId),
  ledgerTxnIdx: index("ledger_txn_idx").on(table.channelId, table.ledgerTxnId),
}));

// ============================================================================
// CREATOR BONUSES & INCENTIVES
// ============================================================================

export const creatorBonuses = mysqlTable("creator_bonuses", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  creatorId: varchar("creator_id", { length: 64 }).notNull(),
  
  type: mysqlEnum("type", ["MILESTONE", "PERFORMANCE", "REFERRAL", "SEASONAL", "MANUAL"]).notNull(),
  status: mysqlEnum("status", ["PENDING", "APPROVED", "PAID", "CANCELED"]).notNull().default("PENDING"),
  
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("AUD"),
  
  triggerType: varchar("trigger_type", { length: 64 }),
  triggerValue: json("trigger_value").$type<any>(),
  
  earnedAt: timestamp("earned_at"),
  paidAt: timestamp("paid_at"),
  
  payoutId: varchar("payout_id", { length: 64 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelCreatorIdx: index("channel_creator_idx").on(table.channelId, table.creatorId),
  statusIdx: index("status_idx").on(table.channelId, table.status),
}));
