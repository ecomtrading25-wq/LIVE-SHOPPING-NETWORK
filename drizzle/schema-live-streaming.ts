import { mysqlTable, varchar, text, timestamp, int, mysqlEnum, json, boolean, decimal } from 'drizzle-orm/mysql-core';
import { users } from './schema';

/**
 * Live Streaming Module
 * WebRTC-based live shopping with real-time chat, product showcases, and purchases
 */

// ============================================================================
// LIVE SHOWS
// ============================================================================

export const liveShows = mysqlTable("live_shows", {
  id: varchar("id", { length: 64 }).primaryKey(),
  hostId: int("host_id").notNull().references(() => users.id),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  status: mysqlEnum("status", ["scheduled", "live", "ended", "cancelled"]).default("scheduled").notNull(),
  scheduledStartAt: timestamp("scheduled_start_at").notNull(),
  actualStartAt: timestamp("actual_start_at"),
  endedAt: timestamp("ended_at"),
  
  // Stream configuration
  streamKey: varchar("stream_key", { length: 128 }).unique(),
  streamUrl: text("stream_url"),
  playbackUrl: text("playback_url"),
  recordingUrl: text("recording_url"),
  
  // Metrics
  peakViewers: int("peak_viewers").default(0),
  totalViews: int("total_views").default(0),
  totalMessages: int("total_messages").default(0),
  totalSales: decimal("total_sales", { precision: 10, scale: 2 }).default("0"),
  totalOrders: int("total_orders").default(0),
  
  // Settings
  settings: json("settings").$type<{
    allowChat?: boolean;
    allowGifts?: boolean;
    moderationEnabled?: boolean;
    maxViewers?: number;
    recordingEnabled?: boolean;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// LIVE SHOW PRODUCTS
// ============================================================================

export const liveShowProducts = mysqlTable("live_show_products", {
  id: varchar("id", { length: 64 }).primaryKey(),
  showId: varchar("show_id", { length: 64 }).notNull().references(() => liveShows.id),
  productId: varchar("product_id", { length: 64 }).notNull(),
  
  // Display order
  position: int("position").default(0),
  
  // Special pricing for live show
  livePrice: decimal("live_price", { precision: 10, scale: 2 }),
  discount: decimal("discount", { precision: 5, scale: 2 }),
  
  // Showcase timing
  showcasedAt: timestamp("showcased_at"),
  showcaseDuration: int("showcase_duration"), // seconds
  
  // Performance
  views: int("views").default(0),
  clicks: int("clicks").default(0),
  orders: int("orders").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  
  status: mysqlEnum("status", ["pending", "showcased", "sold_out"]).default("pending").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// LIVE VIEWERS
// ============================================================================

export const liveViewers = mysqlTable("live_viewers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  showId: varchar("show_id", { length: 64 }).notNull().references(() => liveShows.id),
  userId: int("user_id").references(() => users.id),
  
  // Anonymous viewers
  sessionId: varchar("session_id", { length: 128 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  
  // Viewing session
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
  watchDuration: int("watch_duration").default(0), // seconds
  
  // Engagement
  messagesSent: int("messages_sent").default(0),
  giftsSent: int("gifts_sent").default(0),
  productClicks: int("product_clicks").default(0),
  ordersPlaced: int("orders_placed").default(0),
  
  // Location
  country: varchar("country", { length: 2 }),
  city: varchar("city", { length: 255 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// LIVE CHAT
// ============================================================================

export const liveChatMessages = mysqlTable("live_chat_messages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  showId: varchar("show_id", { length: 64 }).notNull().references(() => liveShows.id),
  userId: int("user_id").references(() => users.id),
  
  // Message content
  message: text("message").notNull(),
  messageType: mysqlEnum("message_type", ["text", "emoji", "gift", "system"]).default("text").notNull(),
  
  // Moderation
  isModerated: boolean("is_moderated").default(false),
  moderatedBy: int("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at"),
  moderationReason: text("moderation_reason"),
  
  // Engagement
  likes: int("likes").default(0),
  isPinned: boolean("is_pinned").default(false),
  
  // Metadata
  metadata: json("metadata").$type<{
    giftId?: string;
    productId?: string;
    replyToId?: string;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// VIRTUAL GIFTS
// ============================================================================

export const virtualGifts = mysqlTable("virtual_gifts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  iconUrl: text("icon_url").notNull(),
  animationUrl: text("animation_url"),
  
  // Pricing
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  
  // Display
  category: varchar("category", { length: 100 }),
  rarity: mysqlEnum("rarity", ["common", "rare", "epic", "legendary"]).default("common").notNull(),
  position: int("position").default(0),
  
  status: mysqlEnum("status", ["active", "disabled"]).default("active").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const liveGiftTransactions = mysqlTable("live_gift_transactions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  showId: varchar("show_id", { length: 64 }).notNull().references(() => liveShows.id),
  giftId: varchar("gift_id", { length: 64 }).notNull().references(() => virtualGifts.id),
  senderId: int("sender_id").notNull().references(() => users.id),
  recipientId: int("recipient_id").notNull().references(() => users.id),
  
  quantity: int("quantity").default(1).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  
  // Display in chat
  displayedInChat: boolean("displayed_in_chat").default(true),
  chatMessageId: varchar("chat_message_id", { length: 64 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// LIVE SHOW ANALYTICS
// ============================================================================

export const liveShowAnalytics = mysqlTable("live_show_analytics", {
  id: varchar("id", { length: 64 }).primaryKey(),
  showId: varchar("show_id", { length: 64 }).notNull().references(() => liveShows.id),
  
  // Time bucket (for time-series data)
  timestamp: timestamp("timestamp").notNull(),
  
  // Viewer metrics
  concurrentViewers: int("concurrent_viewers").default(0),
  newViewers: int("new_viewers").default(0),
  returningViewers: int("returning_viewers").default(0),
  
  // Engagement metrics
  messagesPerMinute: decimal("messages_per_minute", { precision: 10, scale: 2 }).default("0"),
  giftsPerMinute: decimal("gifts_per_minute", { precision: 10, scale: 2 }).default("0"),
  averageWatchTime: int("average_watch_time").default(0), // seconds
  
  // Commerce metrics
  productViews: int("product_views").default(0),
  addToCartActions: int("add_to_cart_actions").default(0),
  checkoutActions: int("checkout_actions").default(0),
  ordersCompleted: int("orders_completed").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  
  // Technical metrics
  averageBitrate: int("average_bitrate"), // kbps
  bufferingEvents: int("buffering_events").default(0),
  errorCount: int("error_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// LIVE SHOW HIGHLIGHTS
// ============================================================================

export const liveShowHighlights = mysqlTable("live_show_highlights", {
  id: varchar("id", { length: 64 }).primaryKey(),
  showId: varchar("show_id", { length: 64 }).notNull().references(() => liveShows.id),
  
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  
  // Video segment
  startTime: int("start_time").notNull(), // seconds from show start
  endTime: int("end_time").notNull(),
  duration: int("duration").notNull(),
  
  // URLs
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url"),
  
  // Engagement
  views: int("views").default(0),
  likes: int("likes").default(0),
  shares: int("shares").default(0),
  
  // Featured products in this highlight
  featuredProducts: json("featured_products").$type<string[]>(),
  
  status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// STREAM QUALITY LOGS
// ============================================================================

export const streamQualityLogs = mysqlTable("stream_quality_logs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  showId: varchar("show_id", { length: 64 }).notNull().references(() => liveShows.id),
  
  timestamp: timestamp("timestamp").notNull(),
  
  // Video quality
  bitrate: int("bitrate"), // kbps
  resolution: varchar("resolution", { length: 20 }), // e.g., "1920x1080"
  fps: int("fps"),
  
  // Audio quality
  audioBitrate: int("audio_bitrate"), // kbps
  audioSampleRate: int("audio_sample_rate"), // Hz
  
  // Network
  latency: int("latency"), // ms
  packetLoss: decimal("packet_loss", { precision: 5, scale: 2 }), // percentage
  
  // Issues
  bufferingEvents: int("buffering_events").default(0),
  errors: json("errors").$type<Array<{ code: string; message: string }>>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// HOST DASHBOARD
// ============================================================================

export const hostProfiles = mysqlTable("host_profiles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("user_id").notNull().unique().references(() => users.id),
  
  // Profile info
  displayName: varchar("display_name", { length: 255 }).notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  coverImageUrl: text("cover_image_url"),
  
  // Verification
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  
  // Statistics
  totalShows: int("total_shows").default(0),
  totalViewers: int("total_viewers").default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0"),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  
  // Followers
  followerCount: int("follower_count").default(0),
  
  // Settings
  settings: json("settings").$type<{
    notificationsEnabled?: boolean;
    autoRecording?: boolean;
    defaultChatSettings?: any;
  }>(),
  
  status: mysqlEnum("status", ["active", "suspended"]).default("active").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const hostFollowers = mysqlTable("host_followers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  hostId: varchar("host_id", { length: 64 }).notNull().references(() => hostProfiles.id),
  followerId: int("follower_id").notNull().references(() => users.id),
  
  // Notifications
  notificationsEnabled: boolean("notifications_enabled").default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// MODERATION
// ============================================================================

export const moderationActions = mysqlTable("moderation_actions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  showId: varchar("show_id", { length: 64 }).notNull().references(() => liveShows.id),
  moderatorId: int("moderator_id").notNull().references(() => users.id),
  targetUserId: int("target_user_id").references(() => users.id),
  
  actionType: mysqlEnum("action_type", ["timeout", "ban", "delete_message", "warn"]).notNull(),
  reason: text("reason"),
  duration: int("duration"), // seconds, for timeout
  
  // Target content
  messageId: varchar("message_id", { length: 64 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
