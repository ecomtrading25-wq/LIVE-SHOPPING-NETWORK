import { mysqlTable, varchar, text, int, decimal, boolean, timestamp, json, mysqlEnum, index, uniqueIndex } from "drizzle-orm/mysql-core";
import { channels } from "./schema";

/**
 * Avatar Influencer Studio - Database Schema
 * Digital creator avatars for live shopping and content generation
 */

// ============================================================================
// AVATAR CREATORS: Digital influencer profiles
// ============================================================================

export const avatarCreators = mysqlTable("avatar_creators", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  slug: varchar("slug", { length: 128 }).notNull(), // elle-hart, aya-park, vera-noir
  displayName: varchar("display_name", { length: 255 }).notNull(),
  age: int("age").notNull(), // All 21+
  category: mysqlEnum("category", ["home", "tech", "beauty", "fashion", "lifestyle"]).notNull(),
  
  // Appearance & Style
  lookDescription: text("look_description"), // "warm neutral, shoulder-length brunette, soft glam"
  wardrobeStyle: text("wardrobe_style"), // "neutral basics; apron occasionally"
  cameraFraming: text("camera_framing"), // "hands + surfaces, above-chest framing"
  
  // Brand & Voice
  personality: text("personality"), // "calm, practical; method > product"
  contentPillars: json("content_pillars").$type<string[]>(), // ["proof wipes", "surface safety", "routines"]
  brandSafety: json("brand_safety").$type<{
    noSuggestive: boolean;
    noLookalike: boolean;
    originalFace: boolean;
    age21Plus: boolean;
  }>().default({ noSuggestive: true, noLookalike: true, originalFace: true, age21Plus: true }),
  
  // Assets
  avatarImageUrl: text("avatar_image_url"),
  coverImageUrl: text("cover_image_url"),
  referenceImagesUrl: json("reference_images_url").$type<string[]>(), // Face reference pack
  voiceProfileUrl: text("voice_profile_url"), // TTS voice or recorded samples
  
  // Performance Metrics
  totalVideos: int("total_videos").default(0),
  totalViews: int("total_views").default(0),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0.00"),
  avgEngagementRate: decimal("avg_engagement_rate", { precision: 5, scale: 2 }).default("0.00"),
  
  // Status
  status: mysqlEnum("status", ["active", "paused", "archived"]).default("active").notNull(),
  isVerified: boolean("is_verified").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelSlugIdx: uniqueIndex("channel_slug_idx").on(table.channelId, table.slug),
  channelIdIdx: index("channel_id_idx").on(table.channelId),
}));

// ============================================================================
// CONTENT CALENDAR: Scheduled content for avatars
// ============================================================================

export const contentCalendar = mysqlTable("content_calendar", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  avatarId: varchar("avatar_id", { length: 64 }).notNull().references(() => avatarCreators.id),
  
  // Scheduling
  scheduledFor: timestamp("scheduled_for").notNull(),
  publishedAt: timestamp("published_at"),
  
  // Content Type
  contentType: mysqlEnum("content_type", ["post", "live", "clip", "story", "reel"]).notNull(),
  platform: mysqlEnum("platform", ["tiktok", "instagram", "youtube", "facebook", "custom"]).notNull(),
  
  // Content Details
  title: varchar("title", { length: 500 }),
  scriptId: varchar("script_id", { length: 64 }), // Reference to script library
  hookAngle: text("hook_angle"), // The specific angle/approach
  productIds: json("product_ids").$type<string[]>(), // Products featured
  
  // Video Generation
  videoJobId: varchar("video_job_id", { length: 255 }), // HeyGen/AI job ID
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  duration: int("duration"), // seconds
  
  // Performance
  views: int("views").default(0),
  likes: int("likes").default(0),
  comments: int("comments").default(0),
  shares: int("shares").default(0),
  conversions: int("conversions").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0.00"),
  
  // Status
  status: mysqlEnum("status", ["draft", "queued", "generating", "ready", "published", "failed"]).default("draft").notNull(),
  publishStatus: mysqlEnum("publish_status", ["pending", "success", "failed"]),
  errorMessage: text("error_message"),
  
  // Metadata
  meta: json("meta"), // Additional platform-specific data
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  avatarScheduledIdx: index("avatar_scheduled_idx").on(table.avatarId, table.scheduledFor),
  channelIdIdx: index("channel_id_idx").on(table.channelId),
  statusIdx: index("status_idx").on(table.status),
}));

// ============================================================================
// SCRIPT LIBRARY: Reusable scripts and cue cards
// ============================================================================

export const scriptLibrary = mysqlTable("script_library", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  avatarId: varchar("avatar_id", { length: 64 }).references(() => avatarCreators.id), // null = universal
  
  // Script Details
  title: varchar("title", { length: 500 }).notNull(),
  scriptType: mysqlEnum("script_type", ["live_intro", "product_demo", "price_drop", "closing", "transition", "full_show"]).notNull(),
  category: varchar("category", { length: 128 }), // home, tech, beauty
  
  // Content
  script: text("script").notNull(), // Full script text
  duration: int("duration"), // estimated seconds
  cueCards: json("cue_cards").$type<Array<{
    timestamp: number;
    text: string;
    action?: string;
  }>>(),
  
  // Hooks & Angles
  hookType: varchar("hook_type", { length: 128 }), // "proof test", "before/after", "comparison"
  angle: text("angle"), // The specific approach/positioning
  
  // Performance
  timesUsed: int("times_used").default(0),
  avgEngagement: decimal("avg_engagement", { precision: 5, scale: 2 }).default("0.00"),
  avgConversion: decimal("avg_conversion", { precision: 5, scale: 2 }).default("0.00"),
  
  // Compliance
  complianceChecked: boolean("compliance_checked").default(false),
  complianceIssues: json("compliance_issues").$type<string[]>(),
  
  // Tags & Search
  tags: json("tags").$type<string[]>(),
  
  status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelIdIdx: index("channel_id_idx").on(table.channelId),
  avatarIdIdx: index("avatar_id_idx").on(table.avatarId),
  scriptTypeIdx: index("script_type_idx").on(table.scriptType),
}));

// ============================================================================
// VIDEO GENERATION JOBS: Track AI video generation
// ============================================================================

export const videoGenerationJobs = mysqlTable("video_generation_jobs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  contentId: varchar("content_id", { length: 64 }).references(() => contentCalendar.id),
  avatarId: varchar("avatar_id", { length: 64 }).notNull().references(() => avatarCreators.id),
  
  // Provider
  provider: mysqlEnum("provider", ["heygen", "synthesia", "d_id", "custom"]).notNull(),
  providerJobId: varchar("provider_job_id", { length: 255 }),
  
  // Input
  scriptId: varchar("script_id", { length: 64 }).references(() => scriptLibrary.id),
  scriptText: text("script_text"),
  audioUrl: text("audio_url"), // Pre-generated audio
  anchorImageUrl: text("anchor_image_url"), // Starting frame
  
  // Configuration
  config: json("config").$type<{
    voice?: string;
    style?: string;
    background?: string;
    resolution?: string;
    aspectRatio?: string;
  }>(),
  
  // Output
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  duration: int("duration"), // seconds
  fileSize: int("file_size"), // bytes
  
  // Status & Progress
  status: mysqlEnum("status", ["queued", "processing", "completed", "failed", "cancelled"]).default("queued").notNull(),
  progress: int("progress").default(0), // 0-100
  errorMessage: text("error_message"),
  
  // Timing
  queuedAt: timestamp("queued_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  processingTime: int("processing_time"), // seconds
  
  // Costs
  creditsCost: decimal("credits_cost", { precision: 10, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelIdIdx: index("channel_id_idx").on(table.channelId),
  avatarIdIdx: index("avatar_id_idx").on(table.avatarId),
  statusIdx: index("status_idx").on(table.status),
  providerJobIdx: index("provider_job_idx").on(table.provider, table.providerJobId),
}));

// ============================================================================
// WINNER DETECTION: Track high-performing content
// ============================================================================

export const contentWinners = mysqlTable("content_winners", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  contentId: varchar("content_id", { length: 64 }).notNull().references(() => contentCalendar.id),
  avatarId: varchar("avatar_id", { length: 64 }).notNull().references(() => avatarCreators.id),
  
  // Detection
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  detectionReason: text("detection_reason"), // Why it was flagged as winner
  
  // Metrics at Detection
  views: int("views").notNull(),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).notNull(),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }),
  revenue: decimal("revenue", { precision: 10, scale: 2 }),
  
  // Variant Generation
  variantsGenerated: int("variants_generated").default(0),
  variantIds: json("variant_ids").$type<string[]>(),
  
  // Analysis
  hookType: varchar("hook_type", { length: 128 }),
  successFactors: json("success_factors").$type<string[]>(), // What made it work
  
  status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelIdIdx: index("channel_id_idx").on(table.channelId),
  contentIdIdx: uniqueIndex("content_id_idx").on(table.contentId),
  avatarIdIdx: index("avatar_id_idx").on(table.avatarId),
}));

// ============================================================================
// SPONSOR PARTNERSHIPS: Brand sponsorship tracking
// ============================================================================

export const sponsorPartnerships = mysqlTable("sponsor_partnerships", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  
  // Sponsor Details
  companyName: varchar("company_name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 320 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  
  // Partnership
  partnershipType: mysqlEnum("partnership_type", ["product_placement", "sponsored_content", "affiliate", "exclusive"]),
  category: varchar("category", { length: 128 }), // home, tech, beauty
  
  // Terms
  dealValue: decimal("deal_value", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("AUD"),
  paymentTerms: text("payment_terms"),
  contentRequirements: json("content_requirements").$type<{
    minVideos?: number;
    minViews?: number;
    exclusivity?: boolean;
    approvalRequired?: boolean;
  }>(),
  
  // Timeline
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  
  // Performance
  contentDelivered: int("content_delivered").default(0),
  totalViews: int("total_views").default(0),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0.00"),
  
  // Status & Outreach
  status: mysqlEnum("status", ["prospect", "contacted", "negotiating", "active", "completed", "declined"]).default("prospect").notNull(),
  outreachStage: int("outreach_stage").default(1), // 1-7 touch sequence
  lastContactedAt: timestamp("last_contacted_at"),
  nextFollowUpAt: timestamp("next_follow_up_at"),
  
  // Documents
  contractUrl: text("contract_url"),
  briefUrl: text("brief_url"),
  
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  channelIdIdx: index("channel_id_idx").on(table.channelId),
  statusIdx: index("status_idx").on(table.status),
  companyNameIdx: index("company_name_idx").on(table.companyName),
}));

// ============================================================================
// QC CHECKS: Quality control for avatar content
// ============================================================================

export const avatarQcChecks = mysqlTable("avatar_qc_checks", {
  id: varchar("id", { length: 64 }).primaryKey(),
  channelId: varchar("channel_id", { length: 64 }).notNull().references(() => channels.id),
  contentId: varchar("content_id", { length: 64 }).references(() => contentCalendar.id),
  videoJobId: varchar("video_job_id", { length: 64 }).references(() => videoGenerationJobs.id),
  
  // Check Type
  checkType: mysqlEnum("check_type", ["uncanny_valley", "suggestive_content", "lookalike_detection", "disclosure_compliance", "brand_safety"]).notNull(),
  
  // Results
  passed: boolean("passed").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }), // 0-100
  issues: json("issues").$type<Array<{
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    timestamp?: number;
  }>>(),
  
  // Automated vs Manual
  checkMethod: mysqlEnum("check_method", ["automated", "manual", "hybrid"]).notNull(),
  reviewerId: varchar("reviewer_id", { length: 64 }), // Admin user who reviewed
  
  // Actions
  actionTaken: mysqlEnum("action_taken", ["approved", "rejected", "flagged", "edited"]),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  contentIdIdx: index("content_id_idx").on(table.contentId),
  videoJobIdIdx: index("video_job_id_idx").on(table.videoJobId),
  checkTypeIdx: index("check_type_idx").on(table.checkType),
}));
