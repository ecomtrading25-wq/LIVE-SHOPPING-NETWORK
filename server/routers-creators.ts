import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from './_core/trpc';

/**
 * Creators Router
 * Handles creator profiles, leaderboards, and performance metrics
 */

export const creatorsRouter = router({
  getLeaderboard: publicProcedure
    .input(z.object({
      metric: z.enum(['revenue', 'viewers', 'shows']).default('revenue'),
      period: z.enum(['day', 'week', 'month', 'all']).default('month'),
      limit: z.number().default(10)
    }))
    .query(async ({ input }) => {
      // Mock leaderboard data - replace with actual database queries
      const mockLeaderboard = [
        {
          id: '1',
          name: 'Sarah Tech',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
          tier: 'Gold',
          totalShows: 245,
          avgViewers: 5100,
          totalRevenue: 125000,
          rating: 4.9,
          verified: true,
          followers: 15000
        },
        {
          id: '2',
          name: 'Emma Style',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
          tier: 'Silver',
          totalShows: 189,
          avgViewers: 4200,
          totalRevenue: 98000,
          rating: 4.8,
          verified: true,
          followers: 12000
        },
        {
          id: '3',
          name: 'Lisa Home',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
          tier: 'Silver',
          totalShows: 156,
          avgViewers: 3800,
          totalRevenue: 87500,
          rating: 4.7,
          verified: true,
          followers: 9500
        },
        {
          id: '4',
          name: 'Mike Fitness',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
          tier: 'Bronze',
          totalShows: 134,
          avgViewers: 3200,
          totalRevenue: 76000,
          rating: 4.6,
          verified: false,
          followers: 8200
        },
        {
          id: '5',
          name: 'Anna Beauty',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna',
          tier: 'Bronze',
          totalShows: 98,
          avgViewers: 2900,
          totalRevenue: 68500,
          rating: 4.8,
          verified: false,
          followers: 7800
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
