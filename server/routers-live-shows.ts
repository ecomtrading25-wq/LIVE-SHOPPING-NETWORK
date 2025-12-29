import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from './_core/trpc';

/**
 * Live Shows Router
 * Handles live streaming shows and schedules
 */

export const liveShowsRouter = router({
  getLive: publicProcedure.query(async () => {
    // Mock live shows data - replace with actual database queries
    const mockLiveShows = [
      {
        id: '1',
        title: 'Tech Gadgets Flash Sale',
        creatorName: 'Sarah Tech',
        creatorAvatar: '/avatars/sarah.jpg',
        viewerCount: 1247,
        thumbnail: '/thumbnails/tech-sale.jpg',
        startedAt: Date.now() - 1000 * 60 * 15, // Started 15 minutes ago
        status: 'live' as const,
        category: 'Electronics'
      },
      {
        id: '2',
        title: 'Fashion Friday Deals',
        creatorName: 'Emma Style',
        creatorAvatar: '/avatars/emma.jpg',
        viewerCount: 892,
        thumbnail: '/thumbnails/fashion-friday.jpg',
        startedAt: Date.now() - 1000 * 60 * 30, // Started 30 minutes ago
        status: 'live' as const,
        category: 'Fashion'
      }
    ];

    return mockLiveShows;
  }),

  getUpcoming: publicProcedure
    .input(z.object({
      limit: z.number().default(10)
    }))
    .query(async ({ input }) => {
      // Mock upcoming shows data
      const mockUpcomingShows = [
        {
          id: '3',
          title: 'Home Decor Showcase',
          creatorName: 'Lisa Home',
          creatorAvatar: '/avatars/lisa.jpg',
          scheduledFor: Date.now() + 1000 * 60 * 60, // In 1 hour
          thumbnail: '/thumbnails/home-decor.jpg',
          status: 'scheduled' as const,
          category: 'Home & Garden',
          subscriberCount: 2341
        },
        {
          id: '4',
          title: 'Sports Equipment Sale',
          creatorName: 'Mike Fitness',
          creatorAvatar: '/avatars/mike.jpg',
          scheduledFor: Date.now() + 1000 * 60 * 60 * 3, // In 3 hours
          thumbnail: '/thumbnails/sports.jpg',
          status: 'scheduled' as const,
          category: 'Sports',
          subscriberCount: 1876
        },
        {
          id: '5',
          title: 'Beauty Products Review',
          creatorName: 'Anna Beauty',
          creatorAvatar: '/avatars/anna.jpg',
          scheduledFor: Date.now() + 1000 * 60 * 60 * 6, // In 6 hours
          thumbnail: '/thumbnails/beauty.jpg',
          status: 'scheduled' as const,
          category: 'Beauty',
          subscriberCount: 3102
        }
      ];

      return mockUpcomingShows.slice(0, input.limit);
    }),

  getById: publicProcedure
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ input }) => {
      // Mock show details
      return {
        id: input.id,
        title: 'Tech Gadgets Flash Sale',
        description: 'Amazing deals on the latest tech gadgets!',
        creatorName: 'Sarah Tech',
        creatorAvatar: '/avatars/sarah.jpg',
        viewerCount: 1247,
        thumbnail: '/thumbnails/tech-sale.jpg',
        startedAt: Date.now() - 1000 * 60 * 15,
        status: 'live' as const,
        category: 'Electronics',
        streamUrl: 'https://stream.example.com/live/show-1',
        chatEnabled: true,
        products: [
          { id: '1', name: 'Wireless Earbuds', price: 79.99, stock: 50 },
          { id: '2', name: 'Smart Watch', price: 199.99, stock: 30 }
        ]
      };
    }),
});
