import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';

/**
 * Live Sessions Router
 * Admin management of live shopping sessions
 */

export const liveSessionsRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
      status: z.enum(['scheduled', 'live', 'ended', 'all']).optional(),
    }))
    .query(async ({ input }) => {
      // Mock data for live sessions
      const mockSessions = [
        {
          id: '1',
          title: 'Tech Gadgets Flash Sale',
          description: 'Amazing deals on the latest tech gadgets',
          scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
          status: 'scheduled' as const,
          viewerCount: 0,
          creatorName: 'Sarah Tech',
          thumbnail: '/thumbnails/tech-sale.jpg',
        },
        {
          id: '2',
          title: 'Fashion Friday Deals',
          description: 'Exclusive fashion items at unbeatable prices',
          scheduledAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          status: 'live' as const,
          viewerCount: 892,
          creatorName: 'Emma Style',
          thumbnail: '/thumbnails/fashion-friday.jpg',
        },
        {
          id: '3',
          title: 'Home Decor Showcase',
          description: 'Transform your living space',
          scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          status: 'ended' as const,
          viewerCount: 1543,
          creatorName: 'Lisa Home',
          thumbnail: '/thumbnails/home-decor.jpg',
        },
      ];

      let filtered = mockSessions;
      if (input.status && input.status !== 'all') {
        filtered = mockSessions.filter(s => s.status === input.status);
      }

      return filtered.slice(0, input.limit);
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      scheduledAt: z.string(),
      status: z.enum(['scheduled', 'live', 'ended']).default('scheduled'),
    }))
    .mutation(async ({ input }) => {
      // Mock create - would insert into database
      const newSession = {
        id: Math.random().toString(36).substring(7),
        ...input,
        viewerCount: 0,
        creatorName: 'Current User',
        thumbnail: '/thumbnails/default.jpg',
      };

      return { success: true, session: newSession };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      scheduledAt: z.string().optional(),
      status: z.enum(['scheduled', 'live', 'ended']).optional(),
    }))
    .mutation(async ({ input }) => {
      // Mock update - would update in database
      return { success: true, id: input.id };
    }),

  delete: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Mock delete - would delete from database
      return { success: true, id: input.id };
    }),
});
