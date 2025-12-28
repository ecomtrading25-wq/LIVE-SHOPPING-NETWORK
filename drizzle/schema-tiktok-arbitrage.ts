import {
  mysqlTable,
  varchar,
  text,
  int,
  bigint,
  boolean,
  timestamp,
  json,
  mysqlEnum,
  decimal,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

/**
 * TikTok Shop Arbitrage Schema
 * 
 * Complete automation system for live commerce arbitrage:
 * - Trend discovery & product intelligence
 * - Profit margin calculation & scoring
 * - Asset generation (thumbnails, scripts, OBS packs)
 * - Test stream automation & validation
 * - Go-live gating & readiness checks
 * - Host handoff & run-of-show generation
 * - Post-live clip factory
 * - Operational data sync (Sheets, Airtable, N8N)
 * - Profit protection engine
 * - Creator casting & performance tracking
 */

// ============================================================================
// TREND DISCOVERY & PRODUCT INTELLIGENCE
// ============================================================================

export const trendProducts = mysqlTable("trend_products", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  
  // Trend Data
  trendSource: varchar("trend_source", { length: 64 }).default("TIKTOK").notNull(), // TIKTOK, YOUTUBE, FACEBOOK
  trendUrl: text("trend_url"),
  trendTitle: text("trend_title"),
  trendHashtags: json("trend_hashtags").$type<string[]>(),
  trendCategory: varchar("trend_category", { length: 128 }),
  
  // Virality Metrics
  viewCount: bigint("view_count", { mode: "number" }).default(0),
  viewsPerHour: decimal("views_per_hour", { precision: 15, scale: 2 }).default("0"),
  likeCount: bigint("like_count", { mode: "number" }).default(0),
  commentCount: bigint("comment_count", { mode: "number" }).default(0),
  shareCount: bigint("share_count", { mode: "number" }).default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).default("0"),
  viralityScore: int("virality_score").default(0), // 0-100
  
  // Product Details
  productName: text("product_name").notNull(),
  productDescription: text("product_description"),
  productCategory: varchar("product_category", { length: 128 }),
  productBrand: varchar("product_brand", { length: 255 }),
  productImages: json("product_images").$type<string[]>(),
  productVideoUrl: text("product_video_url"),
  
  // Sourcing
  sourceUrl: text("source_url"), // AliExpress, 1688, etc.
  sourcePlatform: varchar("source_platform", { length: 64 }), // ALIEXPRESS, 1688, ALIBABA
  supplierName: varchar("supplier_name", { length: 255 }),
  supplierRating: decimal("supplier_rating", { precision: 3, scale: 2 }),
  moq: int("moq").default(1), // Minimum Order Quantity
  
  // Pricing & Costs
  sourceCostCents: bigint("source_cost_cents", { mode: "number" }).default(0),
  shippingCostCents: bigint("shipping_cost_cents", { mode: "number" }).default(0),
  platformFeeCents: bigint("platform_fee_cents", { mode: "number" }).default(0),
  paymentFeeCents: bigint("payment_fee_cents", { mode: "number" }).default(0),
  totalCostCents: bigint("total_cost_cents", { mode: "number" }).default(0),
  suggestedPriceCents: bigint("suggested_price_cents", { mode: "number" }).default(0),
  competitorPriceCents: bigint("competitor_price_cents", { mode: "number" }).default(0),
  profitMarginCents: bigint("profit_margin_cents", { mode: "number" }).default(0),
  profitMarginPercent: decimal("profit_margin_percent", { precision: 5, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  
  // Scoring & Ranking
  profitScore: int("profit_score").default(0), // 0-100
  availabilityScore: int("availability_score").default(0), // 0-100
  trendLifecycleScore: int("trend_lifecycle_score").default(0), // 0-100 (how long trend will last)
  competitionScore: int("competition_score").default(0), // 0-100 (lower = less competition)
  overallScore: int("overall_score").default(0), // 0-100 (weighted composite)
  rank: int("rank"), // Daily ranking (1 = best)
  
  // Status & Workflow
  status: mysqlEnum("status", [
    "DISCOVERED",
    "ANALYZING",
    "SHORTLISTED",
    "REJECTED",
    "LAUNCHED",
    "ARCHIVED"
  ]).default("DISCOVERED").notNull(),
  rejectionReason: text("rejection_reason"),
  
  // Timestamps
  discoveredAt: timestamp("discovered_at").defaultNow().notNull(),
  shortlistedAt: timestamp("shortlisted_at"),
  launchedAt: timestamp("launched_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelStatusIdx: index("channel_status_idx").on(table.channelId, table.status),
  rankIdx: index("rank_idx").on(table.rank),
  scoreIdx: index("overall_score_idx").on(table.overallScore),
  discoveredAtIdx: index("discovered_at_idx").on(table.discoveredAt),
}));

// ============================================================================
// LAUNCHES & 7-DAY SCHEDULES
// ============================================================================

export const launches = mysqlTable("launches", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  trendProductId: varchar("trend_product_id", { length: 64 }).notNull(),
  
  // Launch Details
  launchName: text("launch_name").notNull(),
  launchDate: timestamp("launch_date").notNull(),
  endDate: timestamp("end_date"), // 7 days later typically
  
  // Product Info (snapshot at launch)
  productSnapshot: json("product_snapshot"), // Full product data at launch time
  
  // Status
  status: mysqlEnum("status", [
    "PLANNED",
    "ASSETS_GENERATING",
    "TEST_STREAMING",
    "READY",
    "LIVE",
    "COMPLETED",
    "CANCELLED"
  ]).default("PLANNED").notNull(),
  
  // Performance Tracking
  totalViewers: bigint("total_viewers", { mode: "number" }).default(0),
  totalRevenueCents: bigint("total_revenue_cents", { mode: "number" }).default(0),
  totalCostCents: bigint("total_cost_cents", { mode: "number" }).default(0),
  totalProfitCents: bigint("total_profit_cents", { mode: "number" }).default(0),
  unitsSold: int("units_sold").default(0),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelStatusIdx: index("channel_status_idx").on(table.channelId, table.status),
  launchDateIdx: index("launch_date_idx").on(table.launchDate),
  trendProductIdx: index("trend_product_idx").on(table.trendProductId),
}));

// ============================================================================
// ASSET GENERATION & OBS PACKS
// ============================================================================

export const assetPacks = mysqlTable("asset_packs", {
  id: varchar("id", { length: 64 }).primaryKey(), // pack_id
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  launchId: varchar("launch_id", { length: 64 }).notNull(),
  
  // Platform Config
  platform: varchar("platform", { length: 64 }).notNull(), // TIKTOK, YOUTUBE, FACEBOOK
  platformConfig: json("platform_config"), // Platform-specific settings
  
  // Generated Assets
  thumbnailUrl: text("thumbnail_url"),
  thumbnailVariants: json("thumbnail_variants").$type<Array<{ url: string; variant: string }>>(),
  
  // Scripts
  hostScript: text("host_script"),
  demoScript: text("demo_script"),
  objectionScript: text("objection_script"),
  trustScript: text("trust_script"),
  offerScript: text("offer_script"),
  qaScript: text("qa_script"),
  
  // Moderator Materials
  moderatorPlaybook: text("moderator_playbook"),
  pinnedComments: json("pinned_comments").$type<Array<{ order: number; text: string }>>(),
  moderatorMacros: json("moderator_macros").$type<Array<{ trigger: string; response: string }>>(),
  
  // OBS Scene Pack
  obsPackUrl: text("obs_pack_url"), // ZIP file with OBS scenes
  obsScenes: json("obs_scenes").$type<Array<{ name: string; description: string }>>(),
  
  // Compliance
  disclosureText: text("disclosure_text"),
  safeWords: json("safe_words").$type<string[]>(), // Words to avoid
  complianceChecked: boolean("compliance_checked").default(false),
  complianceNotes: text("compliance_notes"),
  
  // Status
  status: mysqlEnum("status", [
    "GENERATING",
    "READY",
    "FAILED",
    "ARCHIVED"
  ]).default("GENERATING").notNull(),
  generationError: text("generation_error"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  launchPlatformIdx: uniqueIndex("launch_platform_idx").on(table.launchId, table.platform),
  statusIdx: index("status_idx").on(table.status),
}));

// ============================================================================
// TEST STREAMS & VALIDATION
// ============================================================================

export const testStreams = mysqlTable("test_streams", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  launchId: varchar("launch_id", { length: 64 }).notNull(),
  assetPackId: varchar("asset_pack_id", { length: 64 }).notNull(),
  
  // Stream Details
  platform: varchar("platform", { length: 64 }).notNull(),
  streamUrl: text("stream_url"),
  streamKey: text("stream_key"),
  
  // Test Configuration
  testDurationMinutes: int("test_duration_minutes").default(10),
  testAudience: varchar("test_audience", { length: 64 }).default("PRIVATE"), // PRIVATE, UNLISTED, PUBLIC
  
  // Stream Health
  streamStatus: mysqlEnum("stream_status", [
    "QUEUED",
    "STARTING",
    "LIVE",
    "ENDED",
    "FAILED"
  ]).default("QUEUED").notNull(),
  bitrateKbps: int("bitrate_kbps"),
  latencyMs: int("latency_ms"),
  droppedFrames: int("dropped_frames").default(0),
  healthScore: int("health_score").default(0), // 0-100
  
  // Engagement Metrics
  peakViewers: int("peak_viewers").default(0),
  avgViewers: int("avg_viewers").default(0),
  totalViews: int("total_views").default(0),
  likes: int("likes").default(0),
  comments: int("comments").default(0),
  shares: int("shares").default(0),
  engagementScore: int("engagement_score").default(0), // 0-100
  
  // Conversion Tracking
  clickThroughs: int("click_throughs").default(0),
  addToCarts: int("add_to_carts").default(0),
  purchases: int("purchases").default(0),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0"),
  
  // Verdict
  verdict: mysqlEnum("verdict", [
    "PENDING",
    "GO",
    "NO_GO",
    "NEEDS_REVISION"
  ]).default("PENDING"),
  verdictReason: text("verdict_reason"),
  verdictNotes: text("verdict_notes"),
  
  // Timestamps
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  launchPlatformIdx: index("launch_platform_idx").on(table.launchId, table.platform),
  statusIdx: index("stream_status_idx").on(table.streamStatus),
  verdictIdx: index("verdict_idx").on(table.verdict),
}));

// ============================================================================
// GO-LIVE GATING & READINESS
// ============================================================================

export const goLiveReadiness = mysqlTable("go_live_readiness", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  launchId: varchar("launch_id", { length: 64 }).notNull().unique(),
  
  // Guard Status
  guardStatus: mysqlEnum("guard_status", [
    "DISARMED",
    "ARMED",
    "TRIGGERED",
    "OVERRIDDEN"
  ]).default("DISARMED").notNull(),
  
  // Readiness Checks
  testStreamsPass: boolean("test_streams_pass").default(false),
  assetsComplete: boolean("assets_complete").default(false),
  hostHandoffConfirmed: boolean("host_handoff_confirmed").default(false),
  inventoryAvailable: boolean("inventory_available").default(false),
  paymentGatewayHealthy: boolean("payment_gateway_healthy").default(false),
  complianceApproved: boolean("compliance_approved").default(false),
  platformAccountActive: boolean("platform_account_active").default(false),
  
  // Overall Status
  overallReadiness: int("overall_readiness").default(0), // 0-100 percentage
  isReady: boolean("is_ready").default(false),
  
  // Test Stream Validation
  lastTestStreamAt: timestamp("last_test_stream_at"),
  testStreamValidityMinutes: int("test_stream_validity_minutes").default(120), // 2 hours default
  testStreamsExpired: boolean("test_streams_expired").default(true),
  
  // Risk Assessment
  riskLevel: mysqlEnum("risk_level", [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL"
  ]).default("HIGH"),
  riskFactors: json("risk_factors").$type<string[]>(),
  
  // Manual Override
  manualOverride: boolean("manual_override").default(false),
  overrideBy: varchar("override_by", { length: 64 }),
  overrideReason: text("override_reason"),
  overrideAt: timestamp("override_at"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelIdx: index("channel_idx").on(table.channelId),
  guardStatusIdx: index("guard_status_idx").on(table.guardStatus),
  isReadyIdx: index("is_ready_idx").on(table.isReady),
}));

// ============================================================================
// LIVE SHOWS & RUN-OF-SHOW
// ============================================================================

export const liveShows = mysqlTable("live_shows", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  launchId: varchar("launch_id", { length: 64 }).notNull(),
  assetPackId: varchar("asset_pack_id", { length: 64 }).notNull(),
  
  // Show Details
  showTitle: text("show_title").notNull(),
  showDescription: text("show_description"),
  platform: varchar("platform", { length: 64 }).notNull(),
  
  // Host Assignment
  hostId: varchar("host_id", { length: 64 }),
  hostName: varchar("host_name", { length: 255 }),
  moderatorId: varchar("moderator_id", { length: 64 }),
  moderatorName: varchar("moderator_name", { length: 255 }),
  
  // Stream Config
  streamUrl: text("stream_url"),
  streamKey: text("stream_key"),
  recordingUrl: text("recording_url"),
  
  // Run-of-Show Structure (6-8 min loop)
  segmentDurationMinutes: int("segment_duration_minutes").default(7),
  runOfShow: json("run_of_show").$type<Array<{
    segment: string; // DEMO, OBJECTION, TRUST, OFFER, QA
    durationMinutes: number;
    script: string;
    notes: string;
  }>>(),
  
  // Status
  status: mysqlEnum("status", [
    "SCHEDULED",
    "STARTING",
    "LIVE",
    "ENDED",
    "CANCELLED",
    "FAILED"
  ]).default("SCHEDULED").notNull(),
  
  // Live Metrics (real-time)
  currentViewers: int("current_viewers").default(0),
  peakViewers: int("peak_viewers").default(0),
  totalViews: int("total_views").default(0),
  likes: int("likes").default(0),
  comments: int("comments").default(0),
  shares: int("shares").default(0),
  
  // Product Performance
  productPinned: boolean("product_pinned").default(false),
  productClicks: int("product_clicks").default(0),
  addToCarts: int("add_to_carts").default(0),
  purchases: int("purchases").default(0),
  revenueCents: bigint("revenue_cents", { mode: "number" }).default(0),
  
  // Timestamps
  scheduledStartAt: timestamp("scheduled_start_at").notNull(),
  actualStartAt: timestamp("actual_start_at"),
  actualEndAt: timestamp("actual_end_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  launchIdx: index("launch_idx").on(table.launchId),
  hostIdx: index("host_idx").on(table.hostId),
  statusIdx: index("status_idx").on(table.status),
  scheduledStartIdx: index("scheduled_start_idx").on(table.scheduledStartAt),
}));

// ============================================================================
// LIVE SHOW SEGMENTS & TIMESTAMPS
// ============================================================================

export const liveShowTimestamps = mysqlTable("live_show_timestamps", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  liveShowId: varchar("live_show_id", { length: 64 }).notNull(),
  
  // Segment Info
  segmentType: varchar("segment_type", { length: 64 }).notNull(), // DEMO, OBJECTION, TRUST, OFFER, QA
  segmentNumber: int("segment_number").notNull(), // Which iteration (1st loop, 2nd loop, etc.)
  
  // Timing
  startTimestamp: int("start_timestamp").notNull(), // Seconds from show start
  endTimestamp: int("end_timestamp"),
  durationSeconds: int("duration_seconds"),
  
  // Performance
  viewersDuring: int("viewers_during").default(0),
  engagementDuring: int("engagement_during").default(0), // likes + comments during segment
  conversionsDuring: int("conversions_during").default(0),
  
  // Quality Markers
  isHighlight: boolean("is_highlight").default(false),
  highlightReason: text("highlight_reason"),
  clipExtracted: boolean("clip_extracted").default(false),
  clipUrl: text("clip_url"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  liveShowIdx: index("live_show_idx").on(table.liveShowId),
  segmentTypeIdx: index("segment_type_idx").on(table.segmentType),
  isHighlightIdx: index("is_highlight_idx").on(table.isHighlight),
}));

// ============================================================================
// POST-LIVE CLIPS
// ============================================================================

export const postLiveClips = mysqlTable("post_live_clips", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  liveShowId: varchar("live_show_id", { length: 64 }).notNull(),
  timestampId: varchar("timestamp_id", { length: 64 }),
  
  // Clip Details
  clipType: varchar("clip_type", { length: 64 }).notNull(), // PROOF, OBJECTION, TRUST, QA, OFFER
  clipTitle: text("clip_title"),
  clipDescription: text("clip_description"),
  
  // Video
  sourceVideoUrl: text("source_video_url"),
  clipStartSeconds: int("clip_start_seconds").notNull(),
  clipEndSeconds: int("clip_end_seconds").notNull(),
  clipDurationSeconds: int("clip_duration_seconds").notNull(),
  clipUrl: text("clip_url"),
  
  // Optimization
  thumbnailUrl: text("thumbnail_url"),
  captions: text("captions"), // Auto-generated captions
  hashtags: json("hashtags").$type<string[]>(),
  
  // Platform Variants
  tiktokUrl: text("tiktok_url"),
  youtubeUrl: text("youtube_url"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  
  // Publishing
  status: mysqlEnum("status", [
    "EXTRACTING",
    "READY",
    "SCHEDULED",
    "PUBLISHED",
    "FAILED"
  ]).default("EXTRACTING").notNull(),
  publishScheduledAt: timestamp("publish_scheduled_at"),
  publishedAt: timestamp("published_at"),
  
  // Performance
  views: int("views").default(0),
  likes: int("likes").default(0),
  comments: int("comments").default(0),
  shares: int("shares").default(0),
  viralScore: int("viral_score").default(0), // 0-100
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  liveShowIdx: index("live_show_idx").on(table.liveShowId),
  clipTypeIdx: index("clip_type_idx").on(table.clipType),
  statusIdx: index("status_idx").on(table.status),
  publishScheduledIdx: index("publish_scheduled_idx").on(table.publishScheduledAt),
}));

// ============================================================================
// HOSTS & CREATOR CASTING
// ============================================================================

export const hosts = mysqlTable("hosts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  
  // Personal Info
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  profileImageUrl: text("profile_image_url"),
  
  // Tier System
  tier: mysqlEnum("tier", [
    "APPLICANT",
    "BRONZE",
    "SILVER",
    "GOLD",
    "PLATINUM",
    "SUSPENDED"
  ]).default("APPLICANT").notNull(),
  
  // Skills & Ratings
  energyScore: int("energy_score").default(0), // 0-100
  clarityScore: int("clarity_score").default(0), // 0-100
  authenticityScore: int("authenticity_score").default(0), // 0-100
  overallScore: int("overall_score").default(0), // 0-100
  
  // Performance Metrics
  totalShows: int("total_shows").default(0),
  totalViewers: bigint("total_viewers", { mode: "number" }).default(0),
  totalRevenueCents: bigint("total_revenue_cents", { mode: "number" }).default(0),
  avgConversionRate: decimal("avg_conversion_rate", { precision: 5, scale: 2 }).default("0"),
  avgViewerRetention: decimal("avg_viewer_retention", { precision: 5, scale: 2 }).default("0"),
  
  // Commission & Payouts
  commissionPercent: decimal("commission_percent", { precision: 5, scale: 2 }).default("10.00"),
  totalEarnedCents: bigint("total_earned_cents", { mode: "number" }).default(0),
  totalPaidCents: bigint("total_paid_cents", { mode: "number" }).default(0),
  pendingPayoutCents: bigint("pending_payout_cents", { mode: "number" }).default(0),
  
  // Availability
  availabilityCalendar: json("availability_calendar"),
  preferredTimeSlots: json("preferred_time_slots").$type<string[]>(),
  maxShowsPerWeek: int("max_shows_per_week").default(7),
  
  // Status
  status: mysqlEnum("status", [
    "ACTIVE",
    "INACTIVE",
    "SUSPENDED",
    "BANNED"
  ]).default("ACTIVE").notNull(),
  suspensionReason: text("suspension_reason"),
  
  // Timestamps
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  lastShowAt: timestamp("last_show_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelTierIdx: index("channel_tier_idx").on(table.channelId, table.tier),
  statusIdx: index("status_idx").on(table.status),
  overallScoreIdx: index("overall_score_idx").on(table.overallScore),
}));

// ============================================================================
// HOST HANDOFF PACKS
// ============================================================================

export const hostHandoffPacks = mysqlTable("host_handoff_packs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  launchId: varchar("launch_id", { length: 64 }).notNull(),
  liveShowId: varchar("live_show_id", { length: 64 }),
  hostId: varchar("host_id", { length: 64 }).notNull(),
  
  // Pack Contents
  packZipUrl: text("pack_zip_url"), // Complete handoff ZIP
  
  // Included Materials
  runOfShowUrl: text("run_of_show_url"), // PDF/Doc
  hostScriptUrl: text("host_script_url"),
  productInfoUrl: text("product_info_url"),
  obsPackUrl: text("obs_pack_url"),
  checklistUrl: text("checklist_url"),
  emergencyProtocolUrl: text("emergency_protocol_url"),
  
  // Checklists
  preLiveChecklist: json("pre_live_checklist").$type<Array<{ item: string; completed: boolean }>>(),
  duringLiveChecklist: json("during_live_checklist").$type<Array<{ item: string; completed: boolean }>>(),
  postLiveChecklist: json("post_live_checklist").$type<Array<{ item: string; completed: boolean }>>(),
  
  // Confirmation
  hostConfirmed: boolean("host_confirmed").default(false),
  hostConfirmedAt: timestamp("host_confirmed_at"),
  hostNotes: text("host_notes"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  launchIdx: index("launch_idx").on(table.launchId),
  hostIdx: index("host_idx").on(table.hostId),
  confirmedIdx: index("host_confirmed_idx").on(table.hostConfirmed),
}));

// ============================================================================
// PROFIT PROTECTION ENGINE
// ============================================================================

export const profitTracking = mysqlTable("profit_tracking", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  launchId: varchar("launch_id", { length: 64 }).notNull(),
  liveShowId: varchar("live_show_id", { length: 64 }),
  
  // Revenue
  grossRevenueCents: bigint("gross_revenue_cents", { mode: "number" }).default(0),
  refundsCents: bigint("refunds_cents", { mode: "number" }).default(0),
  netRevenueCents: bigint("net_revenue_cents", { mode: "number" }).default(0),
  
  // Costs Breakdown
  productCostCents: bigint("product_cost_cents", { mode: "number" }).default(0),
  shippingCostCents: bigint("shipping_cost_cents", { mode: "number" }).default(0),
  platformFeeCents: bigint("platform_fee_cents", { mode: "number" }).default(0),
  paymentFeeCents: bigint("payment_fee_cents", { mode: "number" }).default(0),
  marketingSpendCents: bigint("marketing_spend_cents", { mode: "number" }).default(0),
  hostCommissionCents: bigint("host_commission_cents", { mode: "number" }).default(0),
  chargebackCostCents: bigint("chargeback_cost_cents", { mode: "number" }).default(0),
  totalCostCents: bigint("total_cost_cents", { mode: "number" }).default(0),
  
  // Profit
  grossProfitCents: bigint("gross_profit_cents", { mode: "number" }).default(0),
  netProfitCents: bigint("net_profit_cents", { mode: "number" }).default(0),
  profitMarginPercent: decimal("profit_margin_percent", { precision: 5, scale: 2 }).default("0"),
  
  // Break-Even Analysis
  breakEvenUnits: int("break_even_units").default(0),
  unitsSold: int("units_sold").default(0),
  isProfitable: boolean("is_profitable").default(false),
  
  // Alerts
  belowThreshold: boolean("below_threshold").default(false),
  thresholdPercent: decimal("threshold_percent", { precision: 5, scale: 2 }).default("20.00"),
  alertTriggered: boolean("alert_triggered").default(false),
  alertTriggeredAt: timestamp("alert_triggered_at"),
  
  // Timestamps
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  launchIdx: index("launch_idx").on(table.launchId),
  liveShowIdx: index("live_show_idx").on(table.liveShowId),
  isProfitableIdx: index("is_profitable_idx").on(table.isProfitable),
  belowThresholdIdx: index("below_threshold_idx").on(table.belowThreshold),
}));

// ============================================================================
// OPERATIONAL DATA SYNC (Sheets, Airtable, N8N)
// ============================================================================

export const operationalSyncLog = mysqlTable("operational_sync_log", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  
  // Sync Target
  syncTarget: varchar("sync_target", { length: 64 }).notNull(), // GOOGLE_SHEETS, AIRTABLE, N8N
  syncTable: varchar("sync_table", { length: 128 }).notNull(), // Which table/sheet
  
  // Sync Details
  operation: varchar("operation", { length: 32 }).notNull(), // CREATE, UPDATE, DELETE, BULK_SYNC
  recordId: varchar("record_id", { length: 64 }),
  recordData: json("record_data"),
  
  // Status
  status: mysqlEnum("status", [
    "PENDING",
    "SUCCESS",
    "FAILED",
    "RETRYING"
  ]).default("PENDING").notNull(),
  errorMessage: text("error_message"),
  retryCount: int("retry_count").default(0),
  maxRetries: int("max_retries").default(3),
  
  // External IDs
  externalId: varchar("external_id", { length: 255 }), // ID in external system
  externalUrl: text("external_url"),
  
  // Timestamps
  syncedAt: timestamp("synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelTargetIdx: index("channel_target_idx").on(table.channelId, table.syncTarget),
  statusIdx: index("status_idx").on(table.status),
  recordIdx: index("record_idx").on(table.recordId),
}));

// ============================================================================
// DAILY SHORTLIST (Top 10)
// ============================================================================

export const dailyShortlists = mysqlTable("daily_shortlists", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  
  // Shortlist Date
  shortlistDate: timestamp("shortlist_date").notNull(),
  
  // Products (Top 10)
  products: json("products").$type<Array<{
    rank: number;
    trendProductId: string;
    productName: string;
    overallScore: number;
    profitMarginCents: number;
  }>>(),
  
  // Bundle Export
  bundleZipUrl: text("bundle_zip_url"), // All packs for top 10
  
  // Status
  status: mysqlEnum("status", [
    "GENERATING",
    "READY",
    "DELIVERED",
    "ARCHIVED"
  ]).default("GENERATING").notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelDateIdx: uniqueIndex("channel_date_idx").on(table.channelId, table.shortlistDate),
  statusIdx: index("status_idx").on(table.status),
}));

// ============================================================================
// AUTOMATION JOB QUEUE
// ============================================================================

export const automationJobs = mysqlTable("automation_jobs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull(),
  
  // Job Details
  jobType: varchar("job_type", { length: 64 }).notNull(), // TREND_DISCOVERY, ASSET_GENERATION, TEST_STREAM, GO_LIVE, CLIP_EXTRACTION
  jobPriority: int("job_priority").default(5), // 1-10, 1 = highest
  
  // Related Records
  launchId: varchar("launch_id", { length: 64 }),
  liveShowId: varchar("live_show_id", { length: 64 }),
  
  // Job Payload
  jobPayload: json("job_payload"),
  
  // Status
  status: mysqlEnum("status", [
    "QUEUED",
    "RUNNING",
    "COMPLETED",
    "FAILED",
    "CANCELLED"
  ]).default("QUEUED").notNull(),
  
  // Execution
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  retryCount: int("retry_count").default(0),
  maxRetries: int("max_retries").default(3),
  
  // Result
  jobResult: json("job_result"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelStatusIdx: index("channel_status_idx").on(table.channelId, table.status),
  jobTypeIdx: index("job_type_idx").on(table.jobType),
  priorityIdx: index("priority_idx").on(table.jobPriority),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

// Type exports
export type TrendProduct = typeof trendProducts.$inferSelect;
export type Launch = typeof launches.$inferSelect;
export type AssetPack = typeof assetPacks.$inferSelect;
export type TestStream = typeof testStreams.$inferSelect;
export type GoLiveReadiness = typeof goLiveReadiness.$inferSelect;
export type LiveShow = typeof liveShows.$inferSelect;
export type LiveShowTimestamp = typeof liveShowTimestamps.$inferSelect;
export type PostLiveClip = typeof postLiveClips.$inferSelect;
export type Host = typeof hosts.$inferSelect;
export type HostHandoffPack = typeof hostHandoffPacks.$inferSelect;
export type ProfitTracking = typeof profitTracking.$inferSelect;
export type OperationalSyncLog = typeof operationalSyncLog.$inferSelect;
export type DailyShortlist = typeof dailyShortlists.$inferSelect;
export type AutomationJob = typeof automationJobs.$inferSelect;
