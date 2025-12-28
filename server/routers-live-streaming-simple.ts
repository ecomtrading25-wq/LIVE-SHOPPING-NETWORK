/**
 * Live Streaming tRPC Procedures (Simplified)
 * Handles live shows, chat, gifts, and real-time interactions
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from './_core/trpc';
import { getDbSync } from './db';
import { 
  liveShows, 
  liveShowProducts, 
  liveViewers, 
  liveChatMessages,
  virtualGifts,
  liveGiftTransactions,
  hostProfiles,
  hostFollowers
} from '../drizzle/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
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
      const db = getDbSync();
      const { status, limit, offset } = input;
      
      let query = db.select().from(liveShows);
      
      if (status) {
        query = query.where(eq(liveShows.status, status)) as any;
      }
      
      const shows = await query
        .orderBy(desc(liveShows.scheduledStartAt))
        .limit(limit)
        .offset(offset);
      
      return shows;
    }),
  
  getShow: publicProcedure
    .input(z.object({ showId: z.string() }))
    .query(async ({ input }) => {
      const db = getDbSync();
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
  
  // ============================================================================
  // HOST: Manage Shows
  // ============================================================================
  
  createShow: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      scheduledStartAt: z.date(),
      settings: z.object({
        allowChat: z.boolean().default(true),
        allowGifts: z.boolean().default(true),
        moderationEnabled: z.boolean().default(false),
        recordingEnabled: z.boolean().default(true),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDbSync();
      const showId = nanoid();
      const streamKey = nanoid(32);
      
      await db.insert(liveShows).values({
        id: showId,
        hostId: ctx.user!.id,
        title: input.title,
        description: input.description,
        scheduledStartAt: input.scheduledStartAt,
        streamKey,
        status: 'scheduled',
        settings: input.settings as any,
      });
      
      return { id: showId, streamKey };
    }),
  
  startShow: protectedProcedure
    .input(z.object({ showId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDbSync();
      
      // Verify ownership
      const show = await db
        .select()
        .from(liveShows)
        .where(eq(liveShows.id, input.showId))
        .limit(1);
      
      if (!show[0] || show[0].hostId !== ctx.user!.id) {
        throw new Error('Unauthorized');
      }
      
      await db
        .update(liveShows)
        .set({
          status: 'live',
          actualStartAt: new Date(),
        })
        .where(eq(liveShows.id, input.showId));
      
      return { success: true };
    }),
  
  endShow: protectedProcedure
    .input(z.object({ showId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDbSync();
      
      // Verify ownership
      const show = await db
        .select()
        .from(liveShows)
        .where(eq(liveShows.id, input.showId))
        .limit(1);
      
      if (!show[0] || show[0].hostId !== ctx.user!.id) {
        throw new Error('Unauthorized');
      }
      
      await db
        .update(liveShows)
        .set({
          status: 'ended',
          actualEndAt: new Date(),
        })
        .where(eq(liveShows.id, input.showId));
      
      return { success: true };
    }),
  
  // ============================================================================
  // VIEWER: Join & Watch
  // ============================================================================
  
  joinShow: protectedProcedure
    .input(z.object({ showId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDbSync();
      const viewerId = nanoid();
      
      await db.insert(liveViewers).values({
        id: viewerId,
        showId: input.showId,
        userId: ctx.user!.id,
        joinedAt: new Date(),
      });
      
      // Update concurrent viewers count
      await db.execute(sql`
        UPDATE live_shows 
        SET peak_viewers = GREATEST(
          peak_viewers,
          (SELECT COUNT(*) FROM live_viewers WHERE show_id = ${input.showId} AND left_at IS NULL)
        )
        WHERE id = ${input.showId}
      `);
      
      return { viewerId };
    }),
  
  leaveShow: protectedProcedure
    .input(z.object({ viewerId: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDbSync();
      
      await db
        .update(liveViewers)
        .set({ leftAt: new Date() })
        .where(eq(liveViewers.id, input.viewerId));
      
      return { success: true };
    }),
  
  // ============================================================================
  // CHAT: Send & Receive Messages
  // ============================================================================
  
  sendMessage: protectedProcedure
    .input(z.object({
      showId: z.string(),
      message: z.string().min(1).max(500),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDbSync();
      const messageId = nanoid();
      
      await db.insert(liveChatMessages).values({
        id: messageId,
        showId: input.showId,
        userId: ctx.user!.id,
        message: input.message,
        messageType: 'text',
      });
      
      // Update message count
      await db.execute(sql`
        UPDATE live_shows 
        SET total_messages = total_messages + 1
        WHERE id = ${input.showId}
      `);
      
      return { id: messageId };
    }),
  
  getMessages: publicProcedure
    .input(z.object({
      showId: z.string(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = getDbSync();
      
      const messages = await db
        .select()
        .from(liveChatMessages)
        .where(
          and(
            eq(liveChatMessages.showId, input.showId),
            eq(liveChatMessages.isDeleted, false)
          )
        )
        .orderBy(desc(liveChatMessages.createdAt))
        .limit(input.limit);
      
      return messages.reverse();
    }),
  
  // ============================================================================
  // GIFTS: Send Virtual Gifts
  // ============================================================================
  
  listGifts: publicProcedure
    .query(async () => {
      const db = getDbSync();
      
      const gifts = await db
        .select()
        .from(virtualGifts)
        .where(eq(virtualGifts.isActive, true))
        .orderBy(virtualGifts.displayOrder);
      
      return gifts;
    }),
  
  sendGift: protectedProcedure
    .input(z.object({
      showId: z.string(),
      giftId: z.string(),
      recipientId: z.number(),
      quantity: z.number().min(1).max(100).default(1),
      message: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDbSync();
      
      // Get gift price
      const gift = await db
        .select()
        .from(virtualGifts)
        .where(eq(virtualGifts.id, input.giftId))
        .limit(1);
      
      if (!gift[0]) {
        throw new Error('Gift not found');
      }
      
      const totalPrice = parseFloat(gift[0].price) * input.quantity;
      const transactionId = nanoid();
      
      await db.insert(liveGiftTransactions).values({
        id: transactionId,
        showId: input.showId,
        giftId: input.giftId,
        senderId: ctx.user!.id,
        recipientId: input.recipientId,
        quantity: input.quantity,
        totalPrice: totalPrice.toString(),
        message: input.message,
      });
      
      // Update show revenue
      await db.execute(sql`
        UPDATE live_shows 
        SET total_gifts = total_gifts + ${input.quantity},
            total_revenue = total_revenue + ${totalPrice}
        WHERE id = ${input.showId}
      `);
      
      return { id: transactionId };
    }),
  
  // ============================================================================
  // HOST PROFILE: Manage Profile & Followers
  // ============================================================================
  
  getHostProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = getDbSync();
      
      const profile = await db
        .select()
        .from(hostProfiles)
        .where(eq(hostProfiles.userId, input.userId))
        .limit(1);
      
      return profile[0] || null;
    }),
  
  followHost: protectedProcedure
    .input(z.object({ hostId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDbSync();
      const followId = nanoid();
      
      await db.insert(hostFollowers).values({
        id: followId,
        hostId: input.hostId,
        followerId: ctx.user!.id,
      });
      
      // Update follower count
      await db.execute(sql`
        UPDATE host_profiles 
        SET total_followers = total_followers + 1
        WHERE id = ${input.hostId}
      `);
      
      return { success: true };
    }),
  
  unfollowHost: protectedProcedure
    .input(z.object({ hostId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDbSync();
      
      await db
        .delete(hostFollowers)
        .where(
          and(
            eq(hostFollowers.hostId, input.hostId),
            eq(hostFollowers.followerId, ctx.user!.id)
          )
        );
      
      // Update follower count
      await db.execute(sql`
        UPDATE host_profiles 
        SET total_followers = GREATEST(0, total_followers - 1)
        WHERE id = ${input.hostId}
      `);
      
      return { success: true };
    }),
});
