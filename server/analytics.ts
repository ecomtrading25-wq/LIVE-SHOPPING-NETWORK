/**
 * Analytics Service
 * Real-time analytics aggregation, time-series data processing, and insights generation
 */

import { getDb } from './db';
import {
  shows,
  orders,
  products,
  showViewers,
  chatMessages,
  reactions,
  hostProfiles,
  wallets,
} from '../drizzle/schema';
import { eq, and, gte, lte, sql, desc, count, sum, avg } from 'drizzle-orm';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface ShowAnalytics {
  showId: string;
  title: string;
  totalViewers: number;
  peakViewers: number;
  averageViewTime: number;
  totalOrders: number;
  totalRevenue: number;
  conversionRate: number;
  engagementRate: number;
  chatMessages: number;
  reactions: number;
  productsShown: number;
}

interface HostAnalytics {
  hostId: string;
  hostName: string;
  totalShows: number;
  totalViewers: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  walletBalance: number;
  pendingPayouts: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    orderCount: number;
    revenue: number;
  }>;
}

interface ProductAnalytics {
  productId: string;
  productName: string;
  totalShows: number;
  totalViews: number;
  totalOrders: number;
  totalRevenue: number;
  conversionRate: number;
  averagePrice: number;
  topHosts: Array<{
    hostId: string;
    hostName: string;
    orderCount: number;
    revenue: number;
  }>;
}

interface RevenueAnalytics {
  date: string;
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  platformFee: number;
  hostEarnings: number;
}

interface EngagementMetrics {
  showId: string;
  viewerCount: number;
  chatMessageCount: number;
  reactionCount: number;
  averageViewTime: number;
  engagementScore: number;
}

class AnalyticsService {
  /**
   * Get comprehensive show analytics
   */
  async getShowAnalytics(showId: string): Promise<ShowAnalytics> {
    const db = await getDb();

    // Get show details
    const [show] = await db
      .select()
      .from(shows)
      .where(eq(shows.id, showId))
      .limit(1);

    if (!show) {
      throw new Error('Show not found');
    }

    // Get viewer stats
    const viewerStats = await db
      .select({
        totalViewers: count(),
        averageViewTime: avg(showViewers.viewDuration),
      })
      .from(showViewers)
      .where(eq(showViewers.showId, showId));

    // Get peak viewers
    const peakViewers = await this.getPeakViewers(showId);

    // Get order stats
    const orderStats = await db
      .select({
        totalOrders: count(),
        totalRevenue: sum(orders.totalAmount),
      })
      .from(orders)
      .where(and(
        eq(orders.showId, showId),
        eq(orders.status, 'paid')
      ));

    // Get engagement stats
    const chatCount = await db
      .select({ count: count() })
      .from(chatMessages)
      .where(eq(chatMessages.showId, showId));

    const reactionCount = await db
      .select({ count: count() })
      .from(reactions)
      .where(eq(reactions.showId, showId));

    // Get products shown count
    const productsCount = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${products.id})` })
      .from(products)
      .innerJoin(orders, eq(orders.productId, products.id))
      .where(eq(orders.showId, showId));

    const totalViewers = Number(viewerStats[0]?.totalViewers || 0);
    const totalOrders = Number(orderStats[0]?.totalOrders || 0);
    const totalRevenue = Number(orderStats[0]?.totalRevenue || 0);

    return {
      showId: show.id,
      title: show.title,
      totalViewers,
      peakViewers,
      averageViewTime: Number(viewerStats[0]?.averageViewTime || 0),
      totalOrders,
      totalRevenue,
      conversionRate: totalViewers > 0 ? (totalOrders / totalViewers) * 100 : 0,
      engagementRate: this.calculateEngagementRate(
        totalViewers,
        chatCount[0]?.count || 0,
        reactionCount[0]?.count || 0
      ),
      chatMessages: chatCount[0]?.count || 0,
      reactions: reactionCount[0]?.count || 0,
      productsShown: Number(productsCount[0]?.count || 0),
    };
  }

  /**
   * Get host analytics
   */
  async getHostAnalytics(hostId: string, dateRange?: DateRange): Promise<HostAnalytics> {
    const db = await getDb();

    // Get host details
    const [host] = await db
      .select()
      .from(hostProfiles)
      .where(eq(hostProfiles.id, hostId))
      .limit(1);

    if (!host) {
      throw new Error('Host not found');
    }

    // Build date filter
    let dateFilter = eq(shows.hostId, hostId);
    if (dateRange) {
      dateFilter = and(
        dateFilter,
        gte(shows.scheduledAt, dateRange.startDate),
        lte(shows.scheduledAt, dateRange.endDate)
      ) as any;
    }

    // Get show stats
    const showStats = await db
      .select({
        totalShows: count(),
      })
      .from(shows)
      .where(dateFilter);

    // Get viewer stats
    const viewerStats = await db
      .select({
        totalViewers: count(),
      })
      .from(showViewers)
      .innerJoin(shows, eq(shows.id, showViewers.showId))
      .where(dateFilter);

    // Get order stats
    const orderStats = await db
      .select({
        totalOrders: count(),
        totalRevenue: sum(orders.totalAmount),
        averageOrderValue: avg(orders.totalAmount),
      })
      .from(orders)
      .innerJoin(shows, eq(shows.id, orders.showId))
      .where(and(
        dateFilter,
        eq(orders.status, 'paid')
      ) as any);

    // Get wallet balance
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, hostId))
      .limit(1);

    // Get top products
    const topProducts = await db
      .select({
        productId: products.id,
        productName: products.name,
        orderCount: count(),
        revenue: sum(orders.totalAmount),
      })
      .from(orders)
      .innerJoin(products, eq(products.id, orders.productId))
      .innerJoin(shows, eq(shows.id, orders.showId))
      .where(and(
        dateFilter,
        eq(orders.status, 'paid')
      ) as any)
      .groupBy(products.id, products.name)
      .orderBy(desc(count()))
      .limit(10);

    const totalViewers = Number(viewerStats[0]?.totalViewers || 0);
    const totalOrders = Number(orderStats[0]?.totalOrders || 0);

    return {
      hostId: host.id,
      hostName: host.displayName,
      totalShows: Number(showStats[0]?.totalShows || 0),
      totalViewers,
      totalOrders,
      totalRevenue: Number(orderStats[0]?.totalRevenue || 0),
      averageOrderValue: Number(orderStats[0]?.averageOrderValue || 0),
      conversionRate: totalViewers > 0 ? (totalOrders / totalViewers) * 100 : 0,
      walletBalance: wallet?.balance || 0,
      pendingPayouts: 0, // TODO: Calculate from payouts table
      topProducts: topProducts.map(p => ({
        productId: p.productId,
        productName: p.productName,
        orderCount: Number(p.orderCount),
        revenue: Number(p.revenue || 0),
      })),
    };
  }

  /**
   * Get product analytics
   */
  async getProductAnalytics(productId: string, dateRange?: DateRange): Promise<ProductAnalytics> {
    const db = await getDb();

    // Get product details
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      throw new Error('Product not found');
    }

    // Build date filter
    let dateFilter = eq(orders.productId, productId);
    if (dateRange) {
      dateFilter = and(
        dateFilter,
        gte(orders.createdAt, dateRange.startDate),
        lte(orders.createdAt, dateRange.endDate)
      ) as any;
    }

    // Get show stats
    const showStats = await db
      .select({
        totalShows: sql<number>`COUNT(DISTINCT ${orders.showId})`,
      })
      .from(orders)
      .where(dateFilter);

    // Get order stats
    const orderStats = await db
      .select({
        totalOrders: count(),
        totalRevenue: sum(orders.totalAmount),
        averagePrice: avg(orders.totalAmount),
      })
      .from(orders)
      .where(and(
        dateFilter,
        eq(orders.status, 'paid')
      ) as any);

    // Get top hosts
    const topHosts = await db
      .select({
        hostId: shows.hostId,
        hostName: hostProfiles.displayName,
        orderCount: count(),
        revenue: sum(orders.totalAmount),
      })
      .from(orders)
      .innerJoin(shows, eq(shows.id, orders.showId))
      .innerJoin(hostProfiles, eq(hostProfiles.id, shows.hostId))
      .where(and(
        dateFilter,
        eq(orders.status, 'paid')
      ) as any)
      .groupBy(shows.hostId, hostProfiles.displayName)
      .orderBy(desc(count()))
      .limit(10);

    // Calculate total views (approximate from viewer stats)
    const totalViews = await db
      .select({
        totalViews: count(),
      })
      .from(showViewers)
      .innerJoin(orders, eq(orders.showId, showViewers.showId))
      .where(dateFilter);

    const viewCount = Number(totalViews[0]?.totalViews || 0);
    const orderCount = Number(orderStats[0]?.totalOrders || 0);

    return {
      productId: product.id,
      productName: product.name,
      totalShows: Number(showStats[0]?.totalShows || 0),
      totalViews: viewCount,
      totalOrders: orderCount,
      totalRevenue: Number(orderStats[0]?.totalRevenue || 0),
      conversionRate: viewCount > 0 ? (orderCount / viewCount) * 100 : 0,
      averagePrice: Number(orderStats[0]?.averagePrice || 0),
      topHosts: topHosts.map(h => ({
        hostId: h.hostId,
        hostName: h.hostName,
        orderCount: Number(h.orderCount),
        revenue: Number(h.revenue || 0),
      })),
    };
  }

  /**
   * Get revenue analytics over time
   */
  async getRevenueAnalytics(dateRange: DateRange, groupBy: 'day' | 'week' | 'month' = 'day'): Promise<RevenueAnalytics[]> {
    const db = await getDb();

    // Determine date grouping format
    const dateFormat = {
      day: '%Y-%m-%d',
      week: '%Y-%U',
      month: '%Y-%m',
    }[groupBy];

    const results = await db
      .select({
        date: sql<string>`DATE_FORMAT(${orders.createdAt}, ${dateFormat})`,
        totalRevenue: sum(orders.totalAmount),
        orderCount: count(),
        averageOrderValue: avg(orders.totalAmount),
      })
      .from(orders)
      .where(and(
        eq(orders.status, 'paid'),
        gte(orders.createdAt, dateRange.startDate),
        lte(orders.createdAt, dateRange.endDate)
      ))
      .groupBy(sql`DATE_FORMAT(${orders.createdAt}, ${dateFormat})`)
      .orderBy(sql`DATE_FORMAT(${orders.createdAt}, ${dateFormat})`);

    return results.map(r => {
      const totalRevenue = Number(r.totalRevenue || 0);
      const platformFee = totalRevenue * 0.1; // 10% platform fee
      const hostEarnings = totalRevenue - platformFee;

      return {
        date: r.date,
        totalRevenue,
        orderCount: Number(r.orderCount),
        averageOrderValue: Number(r.averageOrderValue || 0),
        platformFee,
        hostEarnings,
      };
    });
  }

  /**
   * Get engagement metrics for a show
   */
  async getEngagementMetrics(showId: string): Promise<EngagementMetrics> {
    const db = await getDb();

    // Get viewer count
    const viewerCount = await db
      .select({ count: count() })
      .from(showViewers)
      .where(eq(showViewers.showId, showId));

    // Get chat message count
    const chatCount = await db
      .select({ count: count() })
      .from(chatMessages)
      .where(eq(chatMessages.showId, showId));

    // Get reaction count
    const reactionCount = await db
      .select({ count: count() })
      .from(reactions)
      .where(eq(reactions.showId, showId));

    // Get average view time
    const avgViewTime = await db
      .select({
        average: avg(showViewers.viewDuration),
      })
      .from(showViewers)
      .where(eq(showViewers.showId, showId));

    const viewers = Number(viewerCount[0]?.count || 0);
    const chats = Number(chatCount[0]?.count || 0);
    const reactionsNum = Number(reactionCount[0]?.count || 0);
    const avgTime = Number(avgViewTime[0]?.average || 0);

    return {
      showId,
      viewerCount: viewers,
      chatMessageCount: chats,
      reactionCount: reactionsNum,
      averageViewTime: avgTime,
      engagementScore: this.calculateEngagementScore(viewers, chats, reactionsNum, avgTime),
    };
  }

  /**
   * Get platform-wide statistics
   */
  async getPlatformStats(dateRange?: DateRange): Promise<{
    totalShows: number;
    totalHosts: number;
    totalViewers: number;
    totalOrders: number;
    totalRevenue: number;
    platformFee: number;
    hostEarnings: number;
    averageOrderValue: number;
    conversionRate: number;
  }> {
    const db = await getDb();

    // Build date filter
    let dateFilter = sql`1=1`;
    if (dateRange) {
      dateFilter = and(
        gte(shows.scheduledAt, dateRange.startDate),
        lte(shows.scheduledAt, dateRange.endDate)
      ) as any;
    }

    // Get show stats
    const showStats = await db
      .select({
        totalShows: count(),
        totalHosts: sql<number>`COUNT(DISTINCT ${shows.hostId})`,
      })
      .from(shows)
      .where(dateFilter);

    // Get viewer stats
    const viewerStats = await db
      .select({
        totalViewers: count(),
      })
      .from(showViewers)
      .innerJoin(shows, eq(shows.id, showViewers.showId))
      .where(dateFilter);

    // Get order stats
    const orderStats = await db
      .select({
        totalOrders: count(),
        totalRevenue: sum(orders.totalAmount),
        averageOrderValue: avg(orders.totalAmount),
      })
      .from(orders)
      .innerJoin(shows, eq(shows.id, orders.showId))
      .where(and(
        dateFilter,
        eq(orders.status, 'paid')
      ) as any);

    const totalRevenue = Number(orderStats[0]?.totalRevenue || 0);
    const platformFee = totalRevenue * 0.1;
    const hostEarnings = totalRevenue - platformFee;
    const totalViewers = Number(viewerStats[0]?.totalViewers || 0);
    const totalOrders = Number(orderStats[0]?.totalOrders || 0);

    return {
      totalShows: Number(showStats[0]?.totalShows || 0),
      totalHosts: Number(showStats[0]?.totalHosts || 0),
      totalViewers,
      totalOrders,
      totalRevenue,
      platformFee,
      hostEarnings,
      averageOrderValue: Number(orderStats[0]?.averageOrderValue || 0),
      conversionRate: totalViewers > 0 ? (totalOrders / totalViewers) * 100 : 0,
    };
  }

  /**
   * Get peak viewers for a show
   */
  private async getPeakViewers(showId: string): Promise<number> {
    // This would require real-time tracking data
    // For now, return total viewers as approximation
    const db = await getDb();
    const result = await db
      .select({ count: count() })
      .from(showViewers)
      .where(eq(showViewers.showId, showId));

    return Number(result[0]?.count || 0);
  }

  /**
   * Calculate engagement rate
   */
  private calculateEngagementRate(viewers: number, chats: number, reactions: number): number {
    if (viewers === 0) return 0;
    const engagements = chats + reactions;
    return (engagements / viewers) * 100;
  }

  /**
   * Calculate engagement score (0-100)
   */
  private calculateEngagementScore(viewers: number, chats: number, reactions: number, avgViewTime: number): number {
    if (viewers === 0) return 0;

    // Weighted scoring
    const chatScore = Math.min((chats / viewers) * 30, 30);
    const reactionScore = Math.min((reactions / viewers) * 20, 20);
    const viewTimeScore = Math.min((avgViewTime / 3600) * 50, 50); // Max score at 1 hour

    return Math.round(chatScore + reactionScore + viewTimeScore);
  }
}

// Singleton instance
let analyticsService: AnalyticsService | null = null;

export function initializeAnalytics() {
  if (!analyticsService) {
    analyticsService = new AnalyticsService();
  }
  return analyticsService;
}

export function getAnalytics() {
  if (!analyticsService) {
    throw new Error('Analytics service not initialized. Call initializeAnalytics() first.');
  }
  return analyticsService;
}

export {
  AnalyticsService,
  ShowAnalytics,
  HostAnalytics,
  ProductAnalytics,
  RevenueAnalytics,
  EngagementMetrics,
  DateRange,
};
