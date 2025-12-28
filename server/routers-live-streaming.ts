/**
 * Live Streaming tRPC Procedures
 * Handles live shows, chat, gifts, and real-time interactions
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from './_core/trpc';
import { db } from './db';
import { 
  liveShows, 
  liveShowProducts, 
  liveViewers, 
  liveChatMessages,
  virtualGifts,
  liveGiftTransactions,
  hostProfiles,
  hostFollowers
} from '../drizzle/schema-live-streaming';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const liveStreamingRouter = router({
  // ============================================================================
  // PUBLIC: Browse Live Shows
  // ============================================================================
  
  listLiveShows: publicProcedure
    .input(z.object({
      status: z.enum(['scheduled', 'live', 'ended']).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const { status, limit, offset } = input;
      
      const shows = await db
        .select({
          id: liveShows.id,
          title: liveShows.title,
          description: liveShows.description,
          thumbnailUrl: liveShows.thumbnailUrl,
          status: liveShows.status,
          scheduledStartAt: liveShows.scheduledStartAt,
          actualStartAt: liveShows.actualStartAt,
          peakViewers: liveShows.peakViewers,
          totalViews: liveShows.totalViews,
          hostId: liveShows.hostId,
        })
        .from(liveShows)
        .where(status ? eq(liveShows.status, status) : undefined)
        .orderBy(desc(liveShows.scheduledStartAt))
        .limit(limit)
        .offset(offset);
      
      return shows;
    }),
  
  getShow: publicProcedure
    .input(z.object({ showId: z.string() }))
    .query(async ({ input }) => {
      const show = await db
        .select()
        .from(liveShows)
        .where(eq(liveShows.id, input.showId))
        .limit(1);
      
      if (!show[0]) {
        throw new Error('Show not found');
      }
      
      return show[0];
    }),
  
  getShowProducts: publicProcedure
    .input(z.object({ showId: z.string() }))
    .query(async ({ input }) => {
      const products = await db
        .select()
        .from(liveShowProducts)
        .where(eq(liveShowProducts.showId, input.showId))
        .orderBy(liveShowProducts.position);
      
      return products;
    }),
  
  // ============================================================================
  // VIEWER: Join & Watch
  // ============================================================================
  
  joinShow: protectedProcedure
    .input(z.object({ showId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const viewerId = nanoid();
      
      await db.insert(liveViewers).values({
        id: viewerId,
        showId: input.showId,
        userId: ctx.user.id,
        joinedAt: new Date(),
      });
      
      // Increment total views
      await db
        .update(liveShows)
        .set({
          totalViews: sql`${liveShows.totalViews} + 1`,
        })
        .where(eq(liveShows.id, input.showId));
      
      return { viewerId };
    }),
  
  leaveShow: protectedProcedure
    .input(z.object({ 
      showId: z.string(),
      viewerId: z.string(),
      watchDuration: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db
        .update(liveViewers)
        .set({
          leftAt: new Date(),
          watchDuration: input.watchDuration,
        })
        .where(eq(liveViewers.id, input.viewerId));
      
      return { success: true };
    }),
  
  // ============================================================================
  // CHAT: Messages
  // ============================================================================
  
  getChatMessages: publicProcedure
    .input(z.object({
      showId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      before: z.string().optional(), // message ID
    }))
    .query(async ({ input }) => {
      const messages = await db
        .select()
        .from(liveChatMessages)
        .where(
          and(
            eq(liveChatMessages.showId, input.showId),
            input.before 
              ? sql`${liveChatMessages.id} < ${input.before}`
              : undefined
          )
        )
        .orderBy(desc(liveChatMessages.createdAt))
        .limit(input.limit);
      
      return messages.reverse();
    }),
  
  sendMessage: protectedProcedure
    .input(z.object({
      showId: z.string(),
      message: z.string().min(1).max(500),
      messageType: z.enum(['text', 'emoji']).default('text'),
    }))
    .mutation(async ({ input, ctx }) => {
      const messageId = nanoid();
      
      await db.insert(liveChatMessages).values({
        id: messageId,
        showId: input.showId,
        userId: ctx.user.id,
        message: input.message,
        messageType: input.messageType,
        createdAt: new Date(),
      });
      
      // Increment message count
      await db
        .update(liveShows)
        .set({
          totalMessages: sql`${liveShows.totalMessages} + 1`,
        })
        .where(eq(liveShows.id, input.showId));
      
      // Update viewer message count
      await db
        .update(liveViewers)
        .set({
          messagesSent: sql`${liveViewers.messagesSent} + 1`,
        })
        .where(
          and(
            eq(liveViewers.showId, input.showId),
            eq(liveViewers.userId, ctx.user.id)
          )
        );
      
      return { messageId };
    }),
  
  deleteMessage: protectedProcedure
    .input(z.object({
      messageId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if user is host or moderator
      await db
        .update(liveChatMessages)
        .set({
          isModerated: true,
          moderatedBy: ctx.user.id,
          moderatedAt: new Date(),
          moderationReason: input.reason,
        })
        .where(eq(liveChatMessages.id, input.messageId));
      
      return { success: true };
    }),
  
  // ============================================================================
  // GIFTS: Virtual Gifts
  // ============================================================================
  
  listGifts: publicProcedure
    .query(async () => {
      const gifts = await db
        .select()
        .from(virtualGifts)
        .where(eq(virtualGifts.status, 'active'))
        .orderBy(virtualGifts.position);
      
      return gifts;
    }),
  
  sendGift: protectedProcedure
    .input(z.object({
      showId: z.string(),
      giftId: z.string(),
      recipientId: z.number(),
      quantity: z.number().min(1).max(100).default(1),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get gift details
      const gift = await db
        .select()
        .from(virtualGifts)
        .where(eq(virtualGifts.id, input.giftId))
        .limit(1);
      
      if (!gift[0]) {
        throw new Error('Gift not found');
      }
      
      const totalAmount = parseFloat(gift[0].price) * input.quantity;
      const transactionId = nanoid();
      
      // Create gift transaction
      await db.insert(liveGiftTransactions).values({
        id: transactionId,
        showId: input.showId,
        giftId: input.giftId,
        senderId: ctx.user.id,
        recipientId: input.recipientId,
        quantity: input.quantity,
        totalAmount: totalAmount.toString(),
        createdAt: new Date(),
      });
      
      // Create chat message for gift
      const messageId = nanoid();
      await db.insert(liveChatMessages).values({
        id: messageId,
        showId: input.showId,
        userId: ctx.user.id,
        message: `Sent ${input.quantity}x ${gift[0].name}`,
        messageType: 'gift',
        metadata: { giftId: input.giftId },
        createdAt: new Date(),
      });
      
      return { transactionId, messageId };
    }),
  
  // ============================================================================
  // HOST: Manage Shows
  // ============================================================================
  
  createShow: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(500),
      description: z.string().optional(),
      scheduledStartAt: z.date(),
      thumbnailUrl: z.string().optional(),
      settings: z.object({
        allowChat: z.boolean().default(true),
        allowGifts: z.boolean().default(true),
        moderationEnabled: z.boolean().default(false),
        recordingEnabled: z.boolean().default(true),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const showId = nanoid();
      const streamKey = nanoid(32);
      
      await db.insert(liveShows).values({
        id: showId,
        hostId: ctx.user.id,
        title: input.title,
        description: input.description,
        scheduledStartAt: input.scheduledStartAt,
        thumbnailUrl: input.thumbnailUrl,
        streamKey,
        status: 'scheduled',
        settings: input.settings,
        createdAt: new Date(),
      });
      
      return { showId, streamKey };
    }),
  
  updateShow: protectedProcedure
    .input(z.object({
      showId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      thumbnailUrl: z.string().optional(),
      settings: z.any().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verify ownership
      const show = await db
        .select()
        .from(liveShows)
        .where(eq(liveShows.id, input.showId))
        .limit(1);
      
      if (!show[0] || show[0].hostId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }
      
      await db
        .update(liveShows)
        .set({
          title: input.title,
          description: input.description,
          thumbnailUrl: input.thumbnailUrl,
          settings: input.settings,
          updatedAt: new Date(),
        })
        .where(eq(liveShows.id, input.showId));
      
      return { success: true };
    }),
  
  startShow: protectedProcedure
    .input(z.object({ showId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await db
        .update(liveShows)
        .set({
          status: 'live',
          actualStartAt: new Date(),
        })
        .where(
          and(
            eq(liveShows.id, input.showId),
            eq(liveShows.hostId, ctx.user.id)
          )
        );
      
      return { success: true };
    }),
  
  endShow: protectedProcedure
    .input(z.object({ showId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await db
        .update(liveShows)
        .set({
          status: 'ended',
          endedAt: new Date(),
        })
        .where(
          and(
            eq(liveShows.id, input.showId),
            eq(liveShows.hostId, ctx.user.id)
          )
        );
      
      return { success: true };
    }),
  
  addProductToShow: protectedProcedure
    .input(z.object({
      showId: z.string(),
      productId: z.string(),
      livePrice: z.number().optional(),
      discount: z.number().optional(),
      position: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const productId = nanoid();
      
      await db.insert(liveShowProducts).values({
        id: productId,
        showId: input.showId,
        productId: input.productId,
        livePrice: input.livePrice?.toString(),
        discount: input.discount?.toString(),
        position: input.position || 0,
        createdAt: new Date(),
      });
      
      return { productId };
    }),
  
  // ============================================================================
  // HOST: Analytics
  // ============================================================================
  
  getShowAnalytics: protectedProcedure
    .input(z.object({ showId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Get show details
      const show = await db
        .select()
        .from(liveShows)
        .where(eq(liveShows.id, input.showId))
        .limit(1);
      
      if (!show[0] || show[0].hostId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }
      
      // Get viewer stats
      const viewerStats = await db
        .select({
          totalViewers: sql<number>`count(distinct ${liveViewers.userId})`,
          averageWatchTime: sql<number>`avg(${liveViewers.watchDuration})`,
        })
        .from(liveViewers)
        .where(eq(liveViewers.showId, input.showId));
      
      // Get engagement stats
      const engagementStats = await db
        .select({
          totalMessages: sql<number>`count(*)`,
        })
        .from(liveChatMessages)
        .where(eq(liveChatMessages.showId, input.showId));
      
      return {
        show: show[0],
        viewers: viewerStats[0],
        engagement: engagementStats[0],
      };
    }),
  
  // ============================================================================
  // HOST PROFILE
  // ============================================================================
  
  getHostProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const profile = await db
        .select()
        .from(hostProfiles)
        .where(eq(hostProfiles.userId, input.userId))
        .limit(1);
      
      return profile[0] || null;
    }),
  
  updateHostProfile: protectedProcedure
    .input(z.object({
      displayName: z.string().optional(),
      bio: z.string().optional(),
      avatarUrl: z.string().optional(),
      coverImageUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if profile exists
      const existing = await db
        .select()
        .from(hostProfiles)
        .where(eq(hostProfiles.userId, ctx.user.id))
        .limit(1);
      
      if (existing[0]) {
        // Update existing
        await db
          .update(hostProfiles)
          .set({
            displayName: input.displayName,
            bio: input.bio,
            avatarUrl: input.avatarUrl,
            coverImageUrl: input.coverImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(hostProfiles.userId, ctx.user.id));
      } else {
        // Create new
        await db.insert(hostProfiles).values({
          id: nanoid(),
          userId: ctx.user.id,
          displayName: input.displayName || ctx.user.name || 'Host',
          bio: input.bio,
          avatarUrl: input.avatarUrl,
          coverImageUrl: input.coverImageUrl,
          createdAt: new Date(),
        });
      }
      
      return { success: true };
    }),
  
  followHost: protectedProcedure
    .input(z.object({ hostId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const followId = nanoid();
      
      await db.insert(hostFollowers).values({
        id: followId,
        hostId: input.hostId,
        followerId: ctx.user.id,
        createdAt: new Date(),
      });
      
      // Increment follower count
      await db
        .update(hostProfiles)
        .set({
          followerCount: sql`${hostProfiles.followerCount} + 1`,
        })
        .where(eq(hostProfiles.id, input.hostId));
      
      return { success: true };
    }),
  
  unfollowHost: protectedProcedure
    .input(z.object({ hostId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await db
        .delete(hostFollowers)
        .where(
          and(
            eq(hostFollowers.hostId, input.hostId),
            eq(hostFollowers.followerId, ctx.user.id)
          )
        );
      
      // Decrement follower count
      await db
        .update(hostProfiles)
        .set({
          followerCount: sql`${hostProfiles.followerCount} - 1`,
        })
        .where(eq(hostProfiles.id, input.hostId));
      
      return { success: true };
    }),
});
