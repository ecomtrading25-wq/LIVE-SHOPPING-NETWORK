import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from './_core/trpc';

/**
 * Creators Router
 * Handles creator profiles, leaderboards, and performance metrics
 */

export const creatorsRouter = router({
  getLeaderboard: publicProcedure
    .input(z.object({
      timeRange: z.enum(['day', 'week', 'month', 'all']).default('week'),
      limit: z.number().default(10)
    }))
    .query(async ({ input }) => {
      // Mock leaderboard data - replace with actual database queries
      const mockLeaderboard = [
        {
          id: '1',
          name: 'Sarah Tech',
          avatar: '/avatars/sarah.jpg',
          rank: 1,
          totalSales: 125000,
          viewerCount: 45230,
          showsCompleted: 28,
          rating: 4.9,
          badge: 'platinum' as const,
          followers: 12450
        },
        {
          id: '2',
          name: 'Emma Style',
          avatar: '/avatars/emma.jpg',
          rank: 2,
          totalSales: 98000,
          viewerCount: 38120,
          showsCompleted: 24,
          rating: 4.8,
          badge: 'gold' as const,
          followers: 9870
        },
        {
          id: '3',
          name: 'Lisa Home',
          avatar: '/avatars/lisa.jpg',
          rank: 3,
          totalSales: 87500,
          viewerCount: 32450,
          showsCompleted: 22,
          rating: 4.7,
          badge: 'gold' as const,
          followers: 8920
        },
        {
          id: '4',
          name: 'Mike Fitness',
          avatar: '/avatars/mike.jpg',
          rank: 4,
          totalSales: 76000,
          viewerCount: 28900,
          showsCompleted: 20,
          rating: 4.6,
          badge: 'silver' as const,
          followers: 7650
        },
        {
          id: '5',
          name: 'Anna Beauty',
          avatar: '/avatars/anna.jpg',
          rank: 5,
          totalSales: 68500,
          viewerCount: 25670,
          showsCompleted: 18,
          rating: 4.7,
          badge: 'silver' as const,
          followers: 7120
        }
      ];

      return mockLeaderboard.slice(0, input.limit);
    }),

  getById: publicProcedure
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ input }) => {
      // Mock creator profile
      return {
        id: input.id,
        name: 'Sarah Tech',
        avatar: '/avatars/sarah.jpg',
        bio: 'Tech enthusiast sharing the latest gadgets and deals',
        rating: 4.9,
        totalSales: 125000,
        followers: 12450,
        showsCompleted: 28,
        badge: 'platinum' as const,
        joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 180, // 6 months ago
        categories: ['Electronics', 'Gadgets', 'Smart Home'],
        socialLinks: {
          instagram: 'https://instagram.com/sarahtech',
          tiktok: 'https://tiktok.com/@sarahtech',
          youtube: 'https://youtube.com/sarahtech'
        }
      };
    }),

  getStats: protectedProcedure
    .input(z.object({
      creatorId: z.string(),
      timeRange: z.enum(['day', 'week', 'month', 'all']).default('month')
    }))
    .query(async ({ input }) => {
      // Mock creator statistics
      return {
        totalRevenue: 125000,
        totalViews: 45230,
        totalShows: 28,
        averageViewers: 1615,
        conversionRate: 8.5,
        topProducts: [
          { id: '1', name: 'Wireless Earbuds', sales: 245, revenue: 19580 },
          { id: '2', name: 'Smart Watch', sales: 187, revenue: 37413 },
          { id: '3', name: 'Phone Case', sales: 412, revenue: 8240 }
        ],
        revenueByDay: [
          { date: '2025-12-22', revenue: 4200 },
          { date: '2025-12-23', revenue: 5100 },
          { date: '2025-12-24', revenue: 3800 },
          { date: '2025-12-25', revenue: 6200 },
          { date: '2025-12-26', revenue: 4900 },
          { date: '2025-12-27', revenue: 5500 },
          { date: '2025-12-28', revenue: 4800 }
        ]
      };
    }),
});
