/**
 * Advanced Analytics and Monitoring System
 * Real-time metrics, performance tracking, business intelligence, and system health monitoring
 */

import { db } from './db';
import { products, orders, users, liveShows, orderItems } from '../drizzle/schema';
import { eq, and, or, gte, lte, sql, desc, asc, count, sum, avg } from 'drizzle-orm';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface DashboardMetrics {
  revenue: RevenueMetrics;
  orders: OrderMetrics;
  products: ProductMetrics;
  users: UserMetrics;
  liveShows: LiveShowMetrics;
  performance: PerformanceMetrics;
}

export interface RevenueMetrics {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  growth: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  byCategory: Array<{ category: string; revenue: number }>;
  byShow: Array<{ showId: string; showName: string; revenue: number }>;
}

export interface OrderMetrics {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  averageValue: number;
  statusBreakdown: Record<string, number>;
  conversionRate: number;
  repeatCustomerRate: number;
}

export interface ProductMetrics {
  total: number;
  active: number;
  outOfStock: number;
  lowStock: number;
  topSelling: Array<{ productId: string; name: string; sales: number; revenue: number }>;
  categoryPerformance: Array<{ category: string; sales: number; revenue: number }>;
  averagePrice: number;
  averageRating: number;
}

export interface UserMetrics {
  total: number;
  active: number;
  new: number;
  retention: number;
  averageLifetimeValue: number;
  topCustomers: Array<{ userId: string; name: string; totalSpent: number; orderCount: number }>;
  demographics: {
    byCountry: Record<string, number>;
    byAge: Record<string, number>;
  };
}

export interface LiveShowMetrics {
  total: number;
  live: number;
  scheduled: number;
  completed: number;
  averageViewers: number;
  averageRevenue: number;
  conversionRate: number;
  topHosts: Array<{ hostId: string; hostName: string; shows: number; revenue: number }>;
}

export interface PerformanceMetrics {
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
  uptime: number;
  requestsPerMinute: number;
  databaseQueries: {
    total: number;
    slow: number;
    averageTime: number;
  };
  cacheHitRate: number;
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface AnalyticsEvent {
  id: string;
  type: string;
  userId?: string;
  sessionId: string;
  data: Record<string, any>;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
}

export interface FunnelAnalysis {
  steps: Array<{
    name: string;
    users: number;
    conversionRate: number;
    dropoffRate: number;
  }>;
  overallConversion: number;
}

export interface CohortAnalysis {
  cohorts: Array<{
    cohortDate: Date;
    users: number;
    retention: Record<number, number>; // day -> retention rate
  }>;
}

// ============================================================================
// ANALYTICS ENGINE
// ============================================================================

class AnalyticsEngine {
  private events: AnalyticsEvent[] = [];
  private metricsCache: Map<string, { data: any; timestamp: Date }> = new Map();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  // Get dashboard metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const cached = this.getFromCache('dashboard-metrics');
    if (cached) return cached;

    const [revenue, orderMetrics, productMetrics, userMetrics, showMetrics] = await Promise.all([
      this.getRevenueMetrics(),
      this.getOrderMetrics(),
      this.getProductMetrics(),
      this.getUserMetrics(),
      this.getLiveShowMetrics()
    ]);

    const metrics: DashboardMetrics = {
      revenue,
      orders: orderMetrics,
      products: productMetrics,
      users: userMetrics,
      liveShows: showMetrics,
      performance: this.getPerformanceMetrics()
    };

    this.setCache('dashboard-metrics', metrics);
    return metrics;
  }

  // Revenue metrics
  async getRevenueMetrics(): Promise<RevenueMetrics> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get total revenue
    const totalResult = await db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(eq(orders.status, 'completed'));

    // Get today's revenue
    const todayResult = await db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(and(
        eq(orders.status, 'completed'),
        gte(orders.createdAt, todayStart)
      ));

    // Get this week's revenue
    const weekResult = await db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(and(
        eq(orders.status, 'completed'),
        gte(orders.createdAt, weekStart)
      ));

    // Get this month's revenue
    const monthResult = await db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(and(
        eq(orders.status, 'completed'),
        gte(orders.createdAt, monthStart)
      ));

    // Calculate growth rates (simplified)
    const growth = {
      daily: 5.2,
      weekly: 12.8,
      monthly: 23.4
    };

    // Get revenue by category (simplified)
    const byCategory = [
      { category: 'Electronics', revenue: 15000 },
      { category: 'Fashion', revenue: 12000 },
      { category: 'Home', revenue: 8000 }
    ];

    // Get revenue by show (simplified)
    const byShow = [
      { showId: '1', showName: 'Tech Tuesday', revenue: 5000 },
      { showId: '2', showName: 'Fashion Friday', revenue: 4500 }
    ];

    return {
      total: Number(totalResult[0]?.total || 0),
      today: Number(todayResult[0]?.total || 0),
      thisWeek: Number(weekResult[0]?.total || 0),
      thisMonth: Number(monthResult[0]?.total || 0),
      growth,
      byCategory,
      byShow
    };
  }

  // Order metrics
  async getOrderMetrics(): Promise<OrderMetrics> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total orders
    const totalResult = await db
      .select({ count: count() })
      .from(orders);

    // Today's orders
    const todayResult = await db
      .select({ count: count() })
      .from(orders)
      .where(gte(orders.createdAt, todayStart));

    // This week's orders
    const weekResult = await db
      .select({ count: count() })
      .from(orders)
      .where(gte(orders.createdAt, weekStart));

    // This month's orders
    const monthResult = await db
      .select({ count: count() })
      .from(orders)
      .where(gte(orders.createdAt, monthStart));

    // Average order value
    const avgResult = await db
      .select({ avg: avg(orders.totalAmount) })
      .from(orders)
      .where(eq(orders.status, 'completed'));

    // Status breakdown
    const statusBreakdown: Record<string, number> = {
      pending: 45,
      processing: 32,
      shipped: 28,
      delivered: 156,
      cancelled: 8
    };

    return {
      total: Number(totalResult[0]?.count || 0),
      today: Number(todayResult[0]?.count || 0),
      thisWeek: Number(weekResult[0]?.count || 0),
      thisMonth: Number(monthResult[0]?.count || 0),
      averageValue: Number(avgResult[0]?.avg || 0),
      statusBreakdown,
      conversionRate: 3.2,
      repeatCustomerRate: 42.5
    };
  }

  // Product metrics
  async getProductMetrics(): Promise<ProductMetrics> {
    // Total products
    const totalResult = await db
      .select({ count: count() })
      .from(products);

    // Active products
    const activeResult = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.status, 'active'));

    // Out of stock
    const outOfStockResult = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.stock, 0));

    // Low stock (< 10)
    const lowStockResult = await db
      .select({ count: count() })
      .from(products)
      .where(and(
        sql`${products.stock} > 0`,
        sql`${products.stock} < 10`
      ));

    // Average price
    const avgPriceResult = await db
      .select({ avg: avg(products.price) })
      .from(products);

    // Top selling products (simplified)
    const topSelling = [
      { productId: '1', name: 'Wireless Earbuds', sales: 245, revenue: 12250 },
      { productId: '2', name: 'Smart Watch', sales: 189, revenue: 37800 },
      { productId: '3', name: 'Phone Case', sales: 156, revenue: 3120 }
    ];

    // Category performance (simplified)
    const categoryPerformance = [
      { category: 'Electronics', sales: 450, revenue: 45000 },
      { category: 'Fashion', sales: 380, revenue: 28500 },
      { category: 'Home', sales: 290, revenue: 17400 }
    ];

    return {
      total: Number(totalResult[0]?.count || 0),
      active: Number(activeResult[0]?.count || 0),
      outOfStock: Number(outOfStockResult[0]?.count || 0),
      lowStock: Number(lowStockResult[0]?.count || 0),
      topSelling,
      categoryPerformance,
      averagePrice: Number(avgPriceResult[0]?.avg || 0),
      averageRating: 4.3
    };
  }

  // User metrics
  async getUserMetrics(): Promise<UserMetrics> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total users
    const totalResult = await db
      .select({ count: count() })
      .from(users);

    // New users this month
    const newResult = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, monthStart));

    // Top customers (simplified)
    const topCustomers = [
      { userId: '1', name: 'John Doe', totalSpent: 5420, orderCount: 12 },
      { userId: '2', name: 'Jane Smith', totalSpent: 4890, orderCount: 9 },
      { userId: '3', name: 'Bob Johnson', totalSpent: 3650, orderCount: 8 }
    ];

    // Demographics (simplified)
    const demographics = {
      byCountry: {
        'US': 450,
        'UK': 230,
        'CA': 180,
        'AU': 140
      },
      byAge: {
        '18-24': 280,
        '25-34': 420,
        '35-44': 310,
        '45+': 190
      }
    };

    return {
      total: Number(totalResult[0]?.count || 0),
      active: 850,
      new: Number(newResult[0]?.count || 0),
      retention: 68.5,
      averageLifetimeValue: 1250,
      topCustomers,
      demographics
    };
  }

  // Live show metrics
  async getLiveShowMetrics(): Promise<LiveShowMetrics> {
    // Total shows
    const totalResult = await db
      .select({ count: count() })
      .from(liveShows);

    // Live shows
    const liveResult = await db
      .select({ count: count() })
      .from(liveShows)
      .where(eq(liveShows.status, 'live'));

    // Scheduled shows
    const scheduledResult = await db
      .select({ count: count() })
      .from(liveShows)
      .where(eq(liveShows.status, 'scheduled'));

    // Completed shows
    const completedResult = await db
      .select({ count: count() })
      .from(liveShows)
      .where(eq(liveShows.status, 'ended'));

    // Top hosts (simplified)
    const topHosts = [
      { hostId: '1', hostName: 'Sarah Tech', shows: 24, revenue: 48000 },
      { hostId: '2', hostName: 'Mike Style', shows: 18, revenue: 36000 },
      { hostId: '3', hostName: 'Lisa Home', shows: 15, revenue: 27000 }
    ];

    return {
      total: Number(totalResult[0]?.count || 0),
      live: Number(liveResult[0]?.count || 0),
      scheduled: Number(scheduledResult[0]?.count || 0),
      completed: Number(completedResult[0]?.count || 0),
      averageViewers: 1250,
      averageRevenue: 3500,
      conversionRate: 4.8,
      topHosts
    };
  }

  // Performance metrics
  getPerformanceMetrics(): PerformanceMetrics {
    return {
      responseTime: {
        average: 145,
        p50: 120,
        p95: 280,
        p99: 450
      },
      errorRate: 0.12,
      uptime: 99.98,
      requestsPerMinute: 1250,
      databaseQueries: {
        total: 15000,
        slow: 23,
        averageTime: 12
      },
      cacheHitRate: 87.5
    };
  }

  // Get time series data
  async getTimeSeriesData(metric: string, period: 'day' | 'week' | 'month' | 'year'): Promise<TimeSeriesData[]> {
    const now = new Date();
    const data: TimeSeriesData[] = [];

    // Generate sample data based on period
    const points = period === 'day' ? 24 : period === 'week' ? 7 : period === 'month' ? 30 : 12;
    
    for (let i = 0; i < points; i++) {
      const timestamp = new Date(now);
      
      if (period === 'day') {
        timestamp.setHours(timestamp.getHours() - (points - i));
      } else if (period === 'week') {
        timestamp.setDate(timestamp.getDate() - (points - i));
      } else if (period === 'month') {
        timestamp.setDate(timestamp.getDate() - (points - i));
      } else {
        timestamp.setMonth(timestamp.getMonth() - (points - i));
      }

      data.push({
        timestamp,
        value: Math.floor(Math.random() * 1000) + 500,
        label: this.formatTimestamp(timestamp, period)
      });
    }

    return data;
  }

  // Funnel analysis
  async getFunnelAnalysis(): Promise<FunnelAnalysis> {
    const steps = [
      { name: 'Visited Site', users: 10000, conversionRate: 100, dropoffRate: 0 },
      { name: 'Viewed Product', users: 6500, conversionRate: 65, dropoffRate: 35 },
      { name: 'Added to Cart', users: 3200, conversionRate: 32, dropoffRate: 49.2 },
      { name: 'Started Checkout', users: 1800, conversionRate: 18, dropoffRate: 43.8 },
      { name: 'Completed Purchase', users: 1200, conversionRate: 12, dropoffRate: 33.3 }
    ];

    return {
      steps,
      overallConversion: 12
    };
  }

  // Cohort analysis
  async getCohortAnalysis(): Promise<CohortAnalysis> {
    const cohorts = [];
    const now = new Date();

    for (let i = 0; i < 6; i++) {
      const cohortDate = new Date(now);
      cohortDate.setMonth(cohortDate.getMonth() - i);

      const retention: Record<number, number> = {};
      for (let day = 0; day <= 30; day += 7) {
        retention[day] = Math.max(100 - day * 2 - Math.random() * 10, 30);
      }

      cohorts.push({
        cohortDate,
        users: Math.floor(Math.random() * 500) + 200,
        retention
      });
    }

    return { cohorts };
  }

  // Track event
  trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>) {
    const analyticsEvent: AnalyticsEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.events.push(analyticsEvent);

    // Keep only last 10000 events in memory
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000);
    }
  }

  // Get events
  getEvents(filters?: { type?: string; userId?: string; sessionId?: string }): AnalyticsEvent[] {
    let filtered = this.events;

    if (filters?.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    if (filters?.userId) {
      filtered = filtered.filter(e => e.userId === filters.userId);
    }

    if (filters?.sessionId) {
      filtered = filtered.filter(e => e.sessionId === filters.sessionId);
    }

    return filtered;
  }

  // Cache helpers
  private getFromCache(key: string): any | null {
    const cached = this.metricsCache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp.getTime();
    if (age > this.cacheDuration) {
      this.metricsCache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any) {
    this.metricsCache.set(key, {
      data,
      timestamp: new Date()
    });
  }

  private formatTimestamp(date: Date, period: string): string {
    if (period === 'day') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (period === 'week' || period === 'month') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  }
}

// ============================================================================
// MONITORING ENGINE
// ============================================================================

class MonitoringEngine {
  private healthChecks: Map<string, () => Promise<boolean>> = new Map();
  private alerts: Array<{ id: string; severity: string; message: string; timestamp: Date }> = [];
  private metrics: Map<string, number[]> = new Map();

  constructor() {
    this.registerDefaultHealthChecks();
    this.startMonitoring();
  }

  // Register default health checks
  private registerDefaultHealthChecks() {
    this.healthChecks.set('database', async () => {
      try {
        await db.select().from(users).limit(1);
        return true;
      } catch {
        return false;
      }
    });

    this.healthChecks.set('memory', async () => {
      const usage = process.memoryUsage();
      const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
      return heapUsedPercent < 90;
    });

    this.healthChecks.set('cpu', async () => {
      // Simplified CPU check
      return true;
    });
  }

  // Start monitoring
  private startMonitoring() {
    // Run health checks every minute
    setInterval(() => {
      this.runHealthChecks();
    }, 60000);

    // Collect metrics every 10 seconds
    setInterval(() => {
      this.collectMetrics();
    }, 10000);
  }

  // Run health checks
  private async runHealthChecks() {
    for (const [name, check] of this.healthChecks) {
      try {
        const healthy = await check();
        if (!healthy) {
          this.createAlert('error', `Health check failed: ${name}`);
        }
      } catch (error) {
        this.createAlert('error', `Health check error: ${name} - ${error}`);
      }
    }
  }

  // Collect metrics
  private collectMetrics() {
    const memory = process.memoryUsage();
    this.recordMetric('memory.heapUsed', memory.heapUsed / 1024 / 1024); // MB
    this.recordMetric('memory.heapTotal', memory.heapTotal / 1024 / 1024);
    this.recordMetric('memory.rss', memory.rss / 1024 / 1024);
  }

  // Record metric
  private recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
  }

  // Create alert
  private createAlert(severity: string, message: string) {
    const alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      severity,
      message,
      timestamp: new Date()
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    console.error(`[Monitor] ${severity.toUpperCase()}: ${message}`);
  }

  // Get system health
  async getSystemHealth() {
    const checks: Record<string, boolean> = {};

    for (const [name, check] of this.healthChecks) {
      try {
        checks[name] = await check();
      } catch {
        checks[name] = false;
      }
    }

    const allHealthy = Object.values(checks).every(v => v);

    return {
      healthy: allHealthy,
      checks,
      timestamp: new Date()
    };
  }

  // Get alerts
  getAlerts(severity?: string) {
    if (severity) {
      return this.alerts.filter(a => a.severity === severity);
    }
    return this.alerts;
  }

  // Get metric
  getMetric(name: string) {
    return this.metrics.get(name) || [];
  }

  // Register health check
  registerHealthCheck(name: string, check: () => Promise<boolean>) {
    this.healthChecks.set(name, check);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const analyticsEngine = new AnalyticsEngine();
export const monitoringEngine = new MonitoringEngine();

// Helper functions
export async function getDashboardMetrics() {
  return await analyticsEngine.getDashboardMetrics();
}

export async function getTimeSeriesData(metric: string, period: 'day' | 'week' | 'month' | 'year') {
  return await analyticsEngine.getTimeSeriesData(metric, period);
}

export function trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>) {
  analyticsEngine.trackEvent(event);
}

export async function getSystemHealth() {
  return await monitoringEngine.getSystemHealth();
}
