import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "../drizzle/db";
import { 
  liveShows,
  broadcastChannels,
  showSegments,
  pinnedProducts,
  liveShowClips,
  creators,
  products,
  orders,
  channels
} from "../drizzle/schema";
import { eq, and, desc, gte, lte, sql, or } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * LSN Live Shows Router - Complete Live Shopping Platform
 * 
 * Features:
 * - Live show scheduling and management
 * - Real-time product pinning during shows
 * - Dynamic price drops and flash sales
 * - Show segment tracking for highlights
 * - Automated clip generation
 * - Viewer analytics and engagement tracking
 * - Creator performance metrics
 * - Show recording and VOD playback
 * - Real-time inventory sync during live
 * - Revenue tracking per show
 */

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type ShowStatus = "scheduled" | "live" | "ended" | "canceled";
type SegmentType = "intro" | "product_showcase" | "price_drop" | "qa" | "outro" | "custom";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate show revenue from orders
 */
async function calculateShowRevenue(showId: string): Promise<number> {
  const showOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        sql`JSON_EXTRACT(${orders.metadata}, '$.showId') = ${showId}`,
        eq(orders.status, "completed")
      )
    );

  return showOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
}

/**
 * Update show statistics
 */
async function updateShowStats(showId: string) {
  const revenue = await calculateShowRevenue(showId);
  
  await db
    .update(liveShows)
    .set({
      totalRevenue: revenue.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(liveShows.id, showId));
}

/**
 * Generate stream credentials
 */
function generateStreamCredentials(): { streamUrl: string; streamKey: string } {
  const streamKey = nanoid(32);
  const streamUrl = `rtmp://live.liveshoppingnetwork.com/live/${streamKey}`;
  
  return { streamUrl, streamKey };
}

// ============================================================================
// ROUTER DEFINITION
// ============================================================================

export const lsnLiveShowsRouter = router({
  /**
   * List all live shows
   */
  list: publicProcedure
    .input(
      z.object({
        channelId: z.string().optional(),
        status: z.enum(["scheduled", "live", "ended", "canceled"]).optional(),
        creatorId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];
      
      if (input.channelId) {
        conditions.push(eq(liveShows.channelId, input.channelId));
      }
      
      if (input.status) {
        conditions.push(eq(liveShows.status, input.status));
      }
      
      if (input.creatorId) {
        conditions.push(eq(liveShows.creatorId, input.creatorId));
      }
      
      if (input.startDate) {
        conditions.push(gte(liveShows.scheduledStartAt, input.startDate));
      }
      
      if (input.endDate) {
        conditions.push(lte(liveShows.scheduledStartAt, input.endDate));
      }

      const results = await db
        .select()
        .from(liveShows)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(liveShows.scheduledStartAt))
        .limit(input.limit)
        .offset(input.offset);

      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(liveShows)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        shows: results,
        total: total[0]?.count || 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get currently live shows
   */
  getLiveNow: publicProcedure
    .input(z.object({ channelId: z.string().optional() }))
    .query(async ({ input }) => {
      const conditions = [eq(liveShows.status, "live")];
      
      if (input.channelId) {
        conditions.push(eq(liveShows.channelId, input.channelId));
      }

      const shows = await db
        .select()
        .from(liveShows)
        .where(and(...conditions))
        .orderBy(desc(liveShows.viewerCount));

      return { shows };
    }),

  /**
   * Get single show with full details
   */
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [show] = await db
        .select()
        .from(liveShows)
        .where(eq(liveShows.id, input.id))
        .limit(1);

      if (!show) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Show not found",
        });
      }

      // Get creator info
      const [creator] = await db
        .select()
        .from(creators)
        .where(eq(creators.id, show.creatorId))
        .limit(1);

      // Get pinned products
      const pinned = await db
        .select({
          id: pinnedProducts.id,
          productId: pinnedProducts.productId,
          position: pinnedProducts.position,
          priceOverride: pinnedProducts.priceOverride,
          stockDisplay: pinnedProducts.stockDisplay,
          isPinned: pinnedProducts.isPinned,
          product: products,
        })
        .from(pinnedProducts)
        .leftJoin(products, eq(pinnedProducts.productId, products.id))
        .where(
          and(
            eq(pinnedProducts.showId, input.id),
            eq(pinnedProducts.isPinned, true)
          )
        )
        .orderBy(pinnedProducts.position);

      // Get segments
      const segments = await db
        .select()
        .from(showSegments)
        .where(eq(showSegments.showId, input.id))
        .orderBy(showSegments.startTimestamp);

      // Get clips
      const clips = await db
        .select()
        .from(liveShowClips)
        .where(eq(liveShowClips.showId, input.id))
        .orderBy(desc(liveShowClips.createdAt));

      return {
        show,
        creator,
        pinnedProducts: pinned,
        segments,
        clips,
      };
    }),

  /**
   * Create new live show
   */
  create: protectedProcedure
    .input(
      z.object({
        channelId: z.string(),
        broadcastChannelId: z.string(),
        creatorId: z.string(),
        title: z.string().min(1).max(500),
        description: z.string().optional(),
        scheduledStartAt: z.date(),
        scheduledEndAt: z.date().optional(),
        thumbnailUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const showId = nanoid();
      const { streamUrl, streamKey } = generateStreamCredentials();

      await db.insert(liveShows).values({
        id: showId,
        channelId: input.channelId,
        broadcastChannelId: input.broadcastChannelId,
        creatorId: input.creatorId,
        title: input.title,
        description: input.description,
        scheduledStartAt: input.scheduledStartAt,
        scheduledEndAt: input.scheduledEndAt,
        status: "scheduled",
        streamUrl,
        streamKey,
        thumbnailUrl: input.thumbnailUrl,
      });

      return { showId, streamUrl, streamKey };
    }),

  /**
   * Start live show (transition to live)
   */
  start: protectedProcedure
    .input(z.object({ showId: z.string() }))
    .mutation(async ({ input }) => {
      const [show] = await db
        .select()
        .from(liveShows)
        .where(eq(liveShows.id, input.showId))
        .limit(1);

      if (!show) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Show not found",
        });
      }

      if (show.status !== "scheduled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Show must be in scheduled status to start",
        });
      }

      await db
        .update(liveShows)
        .set({
          status: "live",
          actualStartAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(liveShows.id, input.showId));

      return { success: true };
    }),

  /**
   * End live show
   */
  end: protectedProcedure
    .input(z.object({ showId: z.string() }))
    .mutation(async ({ input }) => {
      const [show] = await db
        .select()
        .from(liveShows)
        .where(eq(liveShows.id, input.showId))
        .limit(1);

      if (!show) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Show not found",
        });
      }

      if (show.status !== "live") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Show must be live to end",
        });
      }

      // Update show stats before ending
      await updateShowStats(input.showId);

      await db
        .update(liveShows)
        .set({
          status: "ended",
          actualEndAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(liveShows.id, input.showId));

      return { success: true };
    }),

  /**
   * Pin product to show
   */
  pinProduct: protectedProcedure
    .input(
      z.object({
        showId: z.string(),
        productId: z.string(),
        position: z.number().default(0),
        priceOverride: z.number().optional(),
        stockDisplay: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const pinnedId = nanoid();

      await db.insert(pinnedProducts).values({
        id: pinnedId,
        showId: input.showId,
        productId: input.productId,
        position: input.position,
        priceOverride: input.priceOverride?.toFixed(2),
        stockDisplay: input.stockDisplay,
        isPinned: true,
      });

      return { pinnedId };
    }),

  /**
   * Unpin product from show
   */
  unpinProduct: protectedProcedure
    .input(z.object({ pinnedId: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .update(pinnedProducts)
        .set({
          isPinned: false,
          unpinnedAt: new Date(),
        })
        .where(eq(pinnedProducts.id, input.pinnedId));

      return { success: true };
    }),

  /**
   * Update pinned product (price drop, stock update)
   */
  updatePinnedProduct: protectedProcedure
    .input(
      z.object({
        pinnedId: z.string(),
        priceOverride: z.number().optional(),
        stockDisplay: z.number().optional(),
        position: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updates: any = {};
      
      if (input.priceOverride !== undefined) {
        updates.priceOverride = input.priceOverride.toFixed(2);
      }
      
      if (input.stockDisplay !== undefined) {
        updates.stockDisplay = input.stockDisplay;
      }
      
      if (input.position !== undefined) {
        updates.position = input.position;
      }

      await db
        .update(pinnedProducts)
        .set(updates)
        .where(eq(pinnedProducts.id, input.pinnedId));

      return { success: true };
    }),

  /**
   * Add show segment
   */
  addSegment: protectedProcedure
    .input(
      z.object({
        showId: z.string(),
        segmentType: z.enum(["intro", "product_showcase", "price_drop", "qa", "outro", "custom"]),
        title: z.string(),
        description: z.string().optional(),
        startTimestamp: z.number().optional(),
        endTimestamp: z.number().optional(),
        productIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const segmentId = nanoid();

      await db.insert(showSegments).values({
        id: segmentId,
        showId: input.showId,
        segmentType: input.segmentType,
        title: input.title,
        description: input.description,
        startTimestamp: input.startTimestamp,
        endTimestamp: input.endTimestamp,
        productIds: input.productIds,
      });

      return { segmentId };
    }),

  /**
   * Create clip from show
   */
  createClip: protectedProcedure
    .input(
      z.object({
        showId: z.string(),
        title: z.string(),
        startTimestamp: z.number(),
        endTimestamp: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const clipId = nanoid();

      await db.insert(liveShowClips).values({
        id: clipId,
        showId: input.showId,
        title: input.title,
        startTimestamp: input.startTimestamp,
        endTimestamp: input.endTimestamp,
        status: "processing",
      });

      // TODO: Trigger clip generation job
      // This would call video processing service to extract clip

      return { clipId };
    }),

  /**
   * Update viewer count (called periodically during live show)
   */
  updateViewerCount: protectedProcedure
    .input(
      z.object({
        showId: z.string(),
        viewerCount: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const [show] = await db
        .select()
        .from(liveShows)
        .where(eq(liveShows.id, input.showId))
        .limit(1);

      if (!show) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Show not found",
        });
      }

      const peakViewerCount = Math.max(show.peakViewerCount, input.viewerCount);

      await db
        .update(liveShows)
        .set({
          viewerCount: input.viewerCount,
          peakViewerCount,
          updatedAt: new Date(),
        })
        .where(eq(liveShows.id, input.showId));

      return { success: true };
    }),

  /**
   * Get show analytics
   */
  getAnalytics: protectedProcedure
    .input(z.object({ showId: z.string() }))
    .query(async ({ input }) => {
      const [show] = await db
        .select()
        .from(liveShows)
        .where(eq(liveShows.id, input.showId))
        .limit(1);

      if (!show) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Show not found",
        });
      }

      // Get orders from this show
      const showOrders = await db
        .select()
        .from(orders)
        .where(sql`JSON_EXTRACT(${orders.metadata}, '$.showId') = ${input.showId}`);

      const totalOrders = showOrders.length;
      const completedOrders = showOrders.filter((o) => o.status === "completed").length;
      const totalRevenue = showOrders
        .filter((o) => o.status === "completed")
        .reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

      const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

      // Calculate conversion rate (orders / peak viewers)
      const conversionRate = show.peakViewerCount > 0 
        ? (totalOrders / show.peakViewerCount) * 100 
        : 0;

      // Get product performance
      const pinnedProductsData = await db
        .select({
          productId: pinnedProducts.productId,
          product: products,
        })
        .from(pinnedProducts)
        .leftJoin(products, eq(pinnedProducts.productId, products.id))
        .where(eq(pinnedProducts.showId, input.showId));

      return {
        show,
        metrics: {
          totalOrders,
          completedOrders,
          totalRevenue,
          avgOrderValue,
          conversionRate,
          peakViewers: show.peakViewerCount,
          currentViewers: show.viewerCount,
        },
        products: pinnedProductsData,
      };
    }),

  /**
   * Get upcoming shows schedule
   */
  getSchedule: publicProcedure
    .input(
      z.object({
        channelId: z.string().optional(),
        days: z.number().min(1).max(30).default(7),
      })
    )
    .query(async ({ input }) => {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + input.days);

      const conditions = [
        eq(liveShows.status, "scheduled"),
        gte(liveShows.scheduledStartAt, now),
        lte(liveShows.scheduledStartAt, futureDate),
      ];

      if (input.channelId) {
        conditions.push(eq(liveShows.channelId, input.channelId));
      }

      const shows = await db
        .select({
          show: liveShows,
          creator: creators,
        })
        .from(liveShows)
        .leftJoin(creators, eq(liveShows.creatorId, creators.id))
        .where(and(...conditions))
        .orderBy(liveShows.scheduledStartAt);

      return { shows };
    }),

  /**
   * Search shows
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        channelId: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const conditions = [
        or(
          sql`${liveShows.title} LIKE ${`%${input.query}%`}`,
          sql`${liveShows.description} LIKE ${`%${input.query}%`}`
        ),
      ];

      if (input.channelId) {
        conditions.push(eq(liveShows.channelId, input.channelId));
      }

      const shows = await db
        .select()
        .from(liveShows)
        .where(and(...conditions))
        .orderBy(desc(liveShows.scheduledStartAt))
        .limit(input.limit);

      return { shows };
    }),
});
