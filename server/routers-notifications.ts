import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from './_core/trpc';

/**
 * Notifications Router
 * Handles user notifications and alerts
 */

export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0)
    }))
    .query(async ({ ctx, input }) => {
      // Mock notifications data - replace with actual database queries
      const mockNotifications = [
        {
          id: '1',
          title: 'New Order Received',
          message: 'You have a new order #12345',
          type: 'order' as const,
          read: false,
          createdAt: Date.now() - 1000 * 60 * 5, // 5 minutes ago
          link: '/admin/orders/12345'
        },
        {
          id: '2',
          title: 'Low Stock Alert',
          message: 'Product "Wireless Headphones" is running low on stock',
          type: 'inventory' as const,
          read: false,
          createdAt: Date.now() - 1000 * 60 * 30, // 30 minutes ago
          link: '/admin/inventory'
        },
        {
          id: '3',
          title: 'Payment Received',
          message: 'Payment of $299.99 has been received',
          type: 'payment' as const,
          read: true,
          createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
          link: '/admin/payments'
        }
      ];

      return {
        notifications: mockNotifications.slice(input.offset, input.offset + input.limit),
        total: mockNotifications.length,
        unreadCount: mockNotifications.filter(n => !n.read).length
      };
    }),

  markAsRead: protectedProcedure
    .input(z.object({
      notificationId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Mock implementation - replace with actual database update
      return { success: true };
    }),

  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Mock implementation - replace with actual database update
      return { success: true };
    }),
});
