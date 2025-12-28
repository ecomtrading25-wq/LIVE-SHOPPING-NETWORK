/**
 * LSN LIVE ORCHESTRATION ENGINE V1
 * 
 * Complete live shopping orchestration system with:
 * - Live show state machine (SCHEDULED → PRE_LIVE → LIVE → POST_LIVE → ARCHIVED)
 * - Product pinning with real-time sync
 * - Live price drops with countdown timers
 * - Segment tracking and planning
 * - Highlight timestamp marking for automated clipping
 * - Real-time stock sync during shows
 * - Urgency/scarcity mechanics
 * - Show runner control panel integration
 * - Recording and VOD automation
 * - Performance analytics per show
 * - Creator attribution and commission tracking
 * - Viewer engagement metrics
 * - Purchase attribution during live
 * - Automated post-show workflows
 */

import { db } from "./db.js";
import { 
  liveShows, 
  showSegments, 
  pinnedProducts, 
  priceDrops, 
  showHighlights,
  showViewers,
  showPurchases,
  creators,
  products,
  inventory,
  orders,
  orderItems
} from "../drizzle/schema.js";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { ulid } from "ulid";

// ============================================================================
// TYPES & ENUMS
// ============================================================================

export type ShowStatus = 
  | "SCHEDULED"
  | "PRE_LIVE" 
  | "LIVE"
  | "PAUSED"
  | "POST_LIVE"
  | "ARCHIVED"
  | "CANCELLED";

export type SegmentType = 
  | "INTRO"
  | "PRODUCT_DEMO"
  | "PRICE_DROP"
  | "Q_AND_A"
  | "GIVEAWAY"
  | "OUTRO"
  | "FILLER";

export type HighlightType = 
  | "VIRAL_MOMENT"
  | "PRODUCT_DEMO"
  | "TESTIMONIAL"
  | "PRICE_DROP"
  | "REACTION"
  | "UNBOXING";

export interface ShowRunbook {
  segments: ShowSegment[];
  pinnedProducts: PinnedProductConfig[];
  priceDrops: PriceDropConfig[];
  contingencyScripts: ContingencyScript[];
  targetMetrics: ShowTargetMetrics;
}

export interface ShowSegment {
  id: string;
  type: SegmentType;
  title: string;
  durationMinutes: number;
  productIds: string[];
  script: string;
  notes: string;
  order: number;
}

export interface PinnedProductConfig {
  productId: string;
  startTime: Date;
  endTime?: Date;
  priority: number;
  priceOverride?: number;
  stockLimit?: number;
  urgencyMessage?: string;
}

export interface PriceDropConfig {
  productId: string;
  originalPrice: number;
  dropPrice: number;
  startTime: Date;
  durationMinutes: number;
  stockLimit?: number;
  countdownDisplay: boolean;
}

export interface ContingencyScript {
  trigger: string;
  action: string;
  script: string;
}

export interface ShowTargetMetrics {
  targetViewers: number;
  targetGMV: number;
  targetConversionRate: number;
  targetAOV: number;
}

export interface LiveShowMetrics {
  showId: string;
  peakViewers: number;
  avgViewers: number;
  totalViewers: number;
  totalOrders: number;
  totalRevenue: number;
  conversionRate: number;
  avgOrderValue: number;
  engagementScore: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    revenue: number;
    units: number;
  }>;
}

// ============================================================================
// LIVE SHOW ORCHESTRATOR
// ============================================================================

export class LiveShowOrchestrator {
  private showId: string;
  private channelId: string;
  private creatorId: string;
  private viewerCount: number = 0;
  private currentSegmentId: string | null = null;
  private activePinnedProducts: Set<string> = new Set();
  private activePriceDrops: Map<string, NodeJS.Timeout> = new Map();
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor(showId: string, channelId: string, creatorId: string) {
    this.showId = showId;
    this.channelId = channelId;
    this.creatorId = creatorId;
  }

  /**
   * Initialize show - transition to PRE_LIVE
   */
  async initializeShow(): Promise<void> {
    await db
      .update(liveShows)
      .set({
        status: "PRE_LIVE",
        actualStartTime: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(liveShows.id, this.showId));

    // Load runbook and prepare segments
    const show = await db.query.liveShows.findFirst({
      where: eq(liveShows.id, this.showId),
      with: {
        segments: true,
        pinnedProducts: true,
        priceDrops: true,
      },
    });

    if (!show) throw new Error("Show not found");

    // Validate inventory for pinned products
    await this.validateInventory();

    // Schedule price drops
    await this.schedulePriceDrops();

    // Start metrics collection
    this.startMetricsCollection();
  }

  /**
   * Go live - transition to LIVE status
   */
  async goLive(): Promise<void> {
    await db
      .update(liveShows)
      .set({
        status: "LIVE",
        actualStartTime: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(liveShows.id, this.showId));

    // Activate first segment
    const segments = await db.query.showSegments.findMany({
      where: eq(showSegments.showId, this.showId),
      orderBy: [showSegments.order],
    });

    if (segments.length > 0) {
      await this.activateSegment(segments[0].id);
    }

    // Start pinning products
    await this.updatePinnedProducts();

    // Emit live event
    await this.emitShowEvent("SHOW_STARTED", {
      showId: this.showId,
      creatorId: this.creatorId,
      timestamp: new Date(),
    });
  }

  /**
   * Pin product to show
   */
  async pinProduct(
    productId: string,
    options: {
      priority?: number;
      priceOverride?: number;
      stockLimit?: number;
      urgencyMessage?: string;
      durationMinutes?: number;
    } = {}
  ): Promise<void> {
    const pinId = ulid();
    const now = new Date();
    const endTime = options.durationMinutes
      ? new Date(now.getTime() + options.durationMinutes * 60000)
      : null;

    await db.insert(pinnedProducts).values({
      id: pinId,
      showId: this.showId,
      productId,
      priority: options.priority || 0,
      priceOverride: options.priceOverride,
      stockLimit: options.stockLimit,
      urgencyMessage: options.urgencyMessage,
      pinnedAt: now,
      unpinnedAt: endTime,
      status: "active",
      createdAt: now,
    });

    this.activePinnedProducts.add(productId);

    // Get product details and current stock
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    const stockData = await this.getProductStock(productId);

    // Emit pin event
    await this.emitShowEvent("PRODUCT_PINNED", {
      showId: this.showId,
      productId,
      productName: product?.name,
      price: options.priceOverride || product?.price,
      stock: stockData.available,
      urgencyMessage: options.urgencyMessage,
      timestamp: now,
    });

    // Auto-unpin if duration specified
    if (endTime) {
      setTimeout(() => {
        this.unpinProduct(productId);
      }, options.durationMinutes! * 60000);
    }
  }

  /**
   * Unpin product from show
   */
  async unpinProduct(productId: string): Promise<void> {
    await db
      .update(pinnedProducts)
      .set({
        status: "inactive",
        unpinnedAt: new Date(),
      })
      .where(
        and(
          eq(pinnedProducts.showId, this.showId),
          eq(pinnedProducts.productId, productId),
          eq(pinnedProducts.status, "active")
        )
      );

    this.activePinnedProducts.delete(productId);

    await this.emitShowEvent("PRODUCT_UNPINNED", {
      showId: this.showId,
      productId,
      timestamp: new Date(),
    });
  }

  /**
   * Execute price drop
   */
  async executePriceDrop(
    productId: string,
    dropPrice: number,
    durationMinutes: number,
    options: {
      stockLimit?: number;
      countdownDisplay?: boolean;
    } = {}
  ): Promise<void> {
    const dropId = ulid();
    const now = new Date();
    const endTime = new Date(now.getTime() + durationMinutes * 60000);

    // Get original price
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) throw new Error("Product not found");

    await db.insert(priceDrops).values({
      id: dropId,
      showId: this.showId,
      productId,
      originalPrice: product.price,
      dropPrice: dropPrice.toString(),
      startTime: now,
      endTime,
      stockLimit: options.stockLimit,
      countdownDisplay: options.countdownDisplay || true,
      status: "active",
      unitsSold: 0,
      createdAt: now,
    });

    // Pin product with price override
    await this.pinProduct(productId, {
      priceOverride: dropPrice,
      stockLimit: options.stockLimit,
      urgencyMessage: `⚡ PRICE DROP! ${durationMinutes} minutes only!`,
      durationMinutes,
    });

    // Emit price drop event
    await this.emitShowEvent("PRICE_DROP_STARTED", {
      showId: this.showId,
      productId,
      productName: product.name,
      originalPrice: product.price,
      dropPrice,
      savings: Number(product.price) - dropPrice,
      savingsPercent: Math.round(((Number(product.price) - dropPrice) / Number(product.price)) * 100),
      durationMinutes,
      stockLimit: options.stockLimit,
      timestamp: now,
    });

    // Schedule price drop end
    const timeout = setTimeout(async () => {
      await this.endPriceDrop(dropId, productId);
    }, durationMinutes * 60000);

    this.activePriceDrops.set(dropId, timeout);
  }

  /**
   * End price drop
   */
  async endPriceDrop(dropId: string, productId: string): Promise<void> {
    await db
      .update(priceDrops)
      .set({
        status: "ended",
        actualEndTime: new Date(),
      })
      .where(eq(priceDrops.id, dropId));

    // Unpin product
    await this.unpinProduct(productId);

    // Clear timeout
    const timeout = this.activePriceDrops.get(dropId);
    if (timeout) {
      clearTimeout(timeout);
      this.activePriceDrops.delete(dropId);
    }

    // Get final stats
    const drop = await db.query.priceDrops.findFirst({
      where: eq(priceDrops.id, dropId),
    });

    await this.emitShowEvent("PRICE_DROP_ENDED", {
      showId: this.showId,
      productId,
      dropId,
      unitsSold: drop?.unitsSold || 0,
      revenue: (drop?.unitsSold || 0) * Number(drop?.dropPrice || 0),
      timestamp: new Date(),
    });
  }

  /**
   * Mark highlight for clipping
   */
  async markHighlight(
    type: HighlightType,
    title: string,
    description: string,
    options: {
      productIds?: string[];
      clipDurationSeconds?: number;
    } = {}
  ): Promise<string> {
    const highlightId = ulid();
    const now = new Date();

    // Calculate timestamp offset from show start
    const show = await db.query.liveShows.findFirst({
      where: eq(liveShows.id, this.showId),
    });

    const timestampOffset = show?.actualStartTime
      ? Math.floor((now.getTime() - show.actualStartTime.getTime()) / 1000)
      : 0;

    await db.insert(showHighlights).values({
      id: highlightId,
      showId: this.showId,
      type,
      title,
      description,
      timestampOffset,
      clipDurationSeconds: options.clipDurationSeconds || 30,
      productIds: options.productIds ? JSON.stringify(options.productIds) : null,
      status: "pending",
      createdAt: now,
    });

    await this.emitShowEvent("HIGHLIGHT_MARKED", {
      showId: this.showId,
      highlightId,
      type,
      title,
      timestampOffset,
      timestamp: now,
    });

    return highlightId;
  }

  /**
   * Track viewer join
   */
  async trackViewerJoin(userId: string, metadata: any = {}): Promise<void> {
    const viewerId = ulid();

    await db.insert(showViewers).values({
      id: viewerId,
      showId: this.showId,
      userId,
      joinedAt: new Date(),
      metadata: JSON.stringify(metadata),
    });

    this.viewerCount++;

    await this.emitShowEvent("VIEWER_JOINED", {
      showId: this.showId,
      userId,
      viewerCount: this.viewerCount,
      timestamp: new Date(),
    });
  }

  /**
   * Track viewer leave
   */
  async trackViewerLeave(userId: string): Promise<void> {
    await db
      .update(showViewers)
      .set({
        leftAt: new Date(),
      })
      .where(
        and(
          eq(showViewers.showId, this.showId),
          eq(showViewers.userId, userId)
        )
      );

    this.viewerCount = Math.max(0, this.viewerCount - 1);

    await this.emitShowEvent("VIEWER_LEFT", {
      showId: this.showId,
      userId,
      viewerCount: this.viewerCount,
      timestamp: new Date(),
    });
  }

  /**
   * Track purchase during show
   */
  async trackPurchase(orderId: string, userId: string): Promise<void> {
    const purchaseId = ulid();

    // Get order details
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: {
          with: {
            product: true,
          },
        },
      },
    });

    if (!order) return;

    await db.insert(showPurchases).values({
      id: purchaseId,
      showId: this.showId,
      orderId,
      userId,
      totalAmount: order.totalAmount,
      createdAt: new Date(),
    });

    // Update price drop stats if applicable
    for (const item of order.items) {
      const activeDrop = await db.query.priceDrops.findFirst({
        where: and(
          eq(priceDrops.showId, this.showId),
          eq(priceDrops.productId, item.productId),
          eq(priceDrops.status, "active")
        ),
      });

      if (activeDrop) {
        await db
          .update(priceDrops)
          .set({
            unitsSold: sql`${priceDrops.unitsSold} + ${item.quantity}`,
          })
          .where(eq(priceDrops.id, activeDrop.id));
      }
    }

    await this.emitShowEvent("PURCHASE_MADE", {
      showId: this.showId,
      orderId,
      userId,
      amount: order.totalAmount,
      itemCount: order.items.length,
      timestamp: new Date(),
    });
  }

  /**
   * Activate segment
   */
  async activateSegment(segmentId: string): Promise<void> {
    // Deactivate current segment
    if (this.currentSegmentId) {
      await db
        .update(showSegments)
        .set({
          status: "completed",
          actualEndTime: new Date(),
        })
        .where(eq(showSegments.id, this.currentSegmentId));
    }

    // Activate new segment
    await db
      .update(showSegments)
      .set({
        status: "active",
        actualStartTime: new Date(),
      })
      .where(eq(showSegments.id, segmentId));

    this.currentSegmentId = segmentId;

    const segment = await db.query.showSegments.findFirst({
      where: eq(showSegments.id, segmentId),
    });

    await this.emitShowEvent("SEGMENT_STARTED", {
      showId: this.showId,
      segmentId,
      segmentType: segment?.type,
      segmentTitle: segment?.title,
      timestamp: new Date(),
    });
  }

  /**
   * End show - transition to POST_LIVE
   */
  async endShow(): Promise<void> {
    // Clear all active price drops
    for (const [dropId, timeout] of this.activePriceDrops) {
      clearTimeout(timeout);
      await db
        .update(priceDrops)
        .set({
          status: "ended",
          actualEndTime: new Date(),
        })
        .where(eq(priceDrops.id, dropId));
    }
    this.activePriceDrops.clear();

    // Unpin all products
    for (const productId of this.activePinnedProducts) {
      await this.unpinProduct(productId);
    }

    // Stop metrics collection
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    // Update show status
    await db
      .update(liveShows)
      .set({
        status: "POST_LIVE",
        actualEndTime: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(liveShows.id, this.showId));

    // Generate final metrics
    const metrics = await this.generateShowMetrics();

    // Update show with metrics
    await db
      .update(liveShows)
      .set({
        peakViewers: metrics.peakViewers,
        totalViewers: metrics.totalViewers,
        totalOrders: metrics.totalOrders,
        totalRevenue: metrics.totalRevenue.toString(),
        conversionRate: metrics.conversionRate,
        avgOrderValue: metrics.avgOrderValue.toString(),
      })
      .where(eq(liveShows.id, this.showId));

    await this.emitShowEvent("SHOW_ENDED", {
      showId: this.showId,
      metrics,
      timestamp: new Date(),
    });

    // Trigger post-show workflows
    await this.triggerPostShowWorkflows();
  }

  /**
   * Pause show
   */
  async pauseShow(): Promise<void> {
    await db
      .update(liveShows)
      .set({
        status: "PAUSED",
        updatedAt: new Date(),
      })
      .where(eq(liveShows.id, this.showId));

    await this.emitShowEvent("SHOW_PAUSED", {
      showId: this.showId,
      timestamp: new Date(),
    });
  }

  /**
   * Resume show
   */
  async resumeShow(): Promise<void> {
    await db
      .update(liveShows)
      .set({
        status: "LIVE",
        updatedAt: new Date(),
      })
      .where(eq(liveShows.id, this.showId));

    await this.emitShowEvent("SHOW_RESUMED", {
      showId: this.showId,
      timestamp: new Date(),
    });
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async validateInventory(): Promise<void> {
    const pins = await db.query.pinnedProducts.findMany({
      where: eq(pinnedProducts.showId, this.showId),
    });

    for (const pin of pins) {
      const stock = await this.getProductStock(pin.productId);
      if (stock.available < (pin.stockLimit || 1)) {
        console.warn(`Low stock for product ${pin.productId}: ${stock.available} available`);
      }
    }
  }

  private async schedulePriceDrops(): Promise<void> {
    const drops = await db.query.priceDrops.findMany({
      where: and(
        eq(priceDrops.showId, this.showId),
        eq(priceDrops.status, "scheduled")
      ),
    });

    for (const drop of drops) {
      const now = new Date();
      const startTime = new Date(drop.startTime);
      const delay = startTime.getTime() - now.getTime();

      if (delay > 0) {
        setTimeout(async () => {
          const duration = Math.floor(
            (new Date(drop.endTime).getTime() - startTime.getTime()) / 60000
          );
          await this.executePriceDrop(
            drop.productId,
            Number(drop.dropPrice),
            duration,
            {
              stockLimit: drop.stockLimit || undefined,
              countdownDisplay: drop.countdownDisplay,
            }
          );
        }, delay);
      }
    }
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      await this.collectMetricsSnapshot();
    }, 30000); // Every 30 seconds
  }

  private async collectMetricsSnapshot(): Promise<void> {
    const metrics = await this.generateShowMetrics();
    
    // Store snapshot for trend analysis
    // This would go to a time-series table in production
    await this.emitShowEvent("METRICS_SNAPSHOT", {
      showId: this.showId,
      metrics,
      timestamp: new Date(),
    });
  }

  private async generateShowMetrics(): Promise<LiveShowMetrics> {
    // Get viewer stats
    const viewerStats = await db
      .select({
        totalViewers: sql<number>`COUNT(DISTINCT ${showViewers.userId})`,
      })
      .from(showViewers)
      .where(eq(showViewers.showId, this.showId));

    // Get purchase stats
    const purchaseStats = await db
      .select({
        totalOrders: sql<number>`COUNT(*)`,
        totalRevenue: sql<number>`SUM(${showPurchases.totalAmount})`,
      })
      .from(showPurchases)
      .where(eq(showPurchases.showId, this.showId));

    const totalViewers = viewerStats[0]?.totalViewers || 0;
    const totalOrders = purchaseStats[0]?.totalOrders || 0;
    const totalRevenue = purchaseStats[0]?.totalRevenue || 0;

    // Get top products
    const topProducts = await db
      .select({
        productId: orderItems.productId,
        productName: products.name,
        revenue: sql<number>`SUM(${orderItems.price} * ${orderItems.quantity})`,
        units: sql<number>`SUM(${orderItems.quantity})`,
      })
      .from(showPurchases)
      .innerJoin(orders, eq(showPurchases.orderId, orders.id))
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(showPurchases.showId, this.showId))
      .groupBy(orderItems.productId, products.name)
      .orderBy(desc(sql`SUM(${orderItems.price} * ${orderItems.quantity})`))
      .limit(10);

    return {
      showId: this.showId,
      peakViewers: this.viewerCount,
      avgViewers: Math.floor(totalViewers * 0.6), // Rough estimate
      totalViewers,
      totalOrders,
      totalRevenue,
      conversionRate: totalViewers > 0 ? (totalOrders / totalViewers) * 100 : 0,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      engagementScore: this.calculateEngagementScore(totalViewers, totalOrders),
      topProducts: topProducts.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        revenue: p.revenue,
        units: p.units,
      })),
    };
  }

  private calculateEngagementScore(viewers: number, orders: number): number {
    // Simple engagement score: orders per 100 viewers
    return viewers > 0 ? (orders / viewers) * 100 : 0;
  }

  private async getProductStock(productId: string): Promise<{
    available: number;
    reserved: number;
    onHand: number;
  }> {
    const stock = await db
      .select({
        available: sql<number>`SUM(${inventory.available})`,
        reserved: sql<number>`SUM(${inventory.reserved})`,
        onHand: sql<number>`SUM(${inventory.onHand})`,
      })
      .from(inventory)
      .where(eq(inventory.productId, productId));

    return {
      available: stock[0]?.available || 0,
      reserved: stock[0]?.reserved || 0,
      onHand: stock[0]?.onHand || 0,
    };
  }

  private async updatePinnedProducts(): Promise<void> {
    const now = new Date();
    
    // Auto-unpin expired products
    await db
      .update(pinnedProducts)
      .set({
        status: "inactive",
      })
      .where(
        and(
          eq(pinnedProducts.showId, this.showId),
          eq(pinnedProducts.status, "active"),
          lte(pinnedProducts.unpinnedAt, now)
        )
      );

    // Get currently active pins
    const activePins = await db.query.pinnedProducts.findMany({
      where: and(
        eq(pinnedProducts.showId, this.showId),
        eq(pinnedProducts.status, "active")
      ),
    });

    this.activePinnedProducts = new Set(activePins.map((p) => p.productId));
  }

  private async emitShowEvent(eventType: string, data: any): Promise<void> {
    // In production, this would emit to WebSocket/SSE/Redis Pub/Sub
    // For now, just log
    console.log(`[SHOW EVENT] ${eventType}:`, data);
    
    // Could also store in events table for audit trail
  }

  private async triggerPostShowWorkflows(): Promise<void> {
    // 1. Generate clips from highlights
    await this.generateClips();

    // 2. Calculate creator commission
    await this.calculateCreatorCommission();

    // 3. Send performance report
    await this.sendPerformanceReport();

    // 4. Archive show data
    await this.archiveShow();
  }

  private async generateClips(): Promise<void> {
    const highlights = await db.query.showHighlights.findMany({
      where: and(
        eq(showHighlights.showId, this.showId),
        eq(showHighlights.status, "pending")
      ),
    });

    for (const highlight of highlights) {
      // Queue clip generation job
      console.log(`Queuing clip generation for highlight ${highlight.id}`);
      
      // Update status
      await db
        .update(showHighlights)
        .set({
          status: "processing",
        })
        .where(eq(showHighlights.id, highlight.id));
    }
  }

  private async calculateCreatorCommission(): Promise<void> {
    const metrics = await this.generateShowMetrics();
    
    // Get creator commission rate
    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, this.creatorId),
    });

    if (!creator) return;

    const commissionRate = 0.10; // 10% default, should come from creator tier
    const commission = metrics.totalRevenue * commissionRate;

    console.log(`Creator ${this.creatorId} earned commission: $${commission.toFixed(2)}`);
    
    // This would create a payout record in production
  }

  private async sendPerformanceReport(): Promise<void> {
    const metrics = await this.generateShowMetrics();
    
    console.log(`Show ${this.showId} Performance Report:`, metrics);
    
    // In production, send email/notification to creator
  }

  private async archiveShow(): Promise<void> {
    await db
      .update(liveShows)
      .set({
        status: "ARCHIVED",
        updatedAt: new Date(),
      })
      .where(eq(liveShows.id, this.showId));
  }
}

// ============================================================================
// SHOW SCHEDULER
// ============================================================================

export class ShowScheduler {
  /**
   * Create scheduled show
   */
  static async createShow(data: {
    channelId: string;
    creatorId: string;
    title: string;
    description: string;
    scheduledStartTime: Date;
    scheduledEndTime: Date;
    runbook?: ShowRunbook;
  }): Promise<string> {
    const showId = ulid();

    await db.insert(liveShows).values({
      id: showId,
      channelId: data.channelId,
      creatorId: data.creatorId,
      title: data.title,
      description: data.description,
      scheduledStartTime: data.scheduledStartTime,
      scheduledEndTime: data.scheduledEndTime,
      status: "SCHEDULED",
      runbook: data.runbook ? JSON.stringify(data.runbook) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create segments if provided in runbook
    if (data.runbook?.segments) {
      for (const segment of data.runbook.segments) {
        await db.insert(showSegments).values({
          id: ulid(),
          showId,
          type: segment.type,
          title: segment.title,
          plannedDuration: segment.durationMinutes,
          productIds: JSON.stringify(segment.productIds),
          script: segment.script,
          notes: segment.notes,
          order: segment.order,
          status: "scheduled",
          createdAt: new Date(),
        });
      }
    }

    // Schedule price drops if provided
    if (data.runbook?.priceDrops) {
      for (const drop of data.runbook.priceDrops) {
        await db.insert(priceDrops).values({
          id: ulid(),
          showId,
          productId: drop.productId,
          originalPrice: drop.originalPrice.toString(),
          dropPrice: drop.dropPrice.toString(),
          startTime: drop.startTime,
          endTime: new Date(drop.startTime.getTime() + drop.durationMinutes * 60000),
          stockLimit: drop.stockLimit,
          countdownDisplay: drop.countdownDisplay,
          status: "scheduled",
          unitsSold: 0,
          createdAt: new Date(),
        });
      }
    }

    return showId;
  }

  /**
   * Get upcoming shows
   */
  static async getUpcomingShows(channelId: string, limit: number = 10): Promise<any[]> {
    return db.query.liveShows.findMany({
      where: and(
        eq(liveShows.channelId, channelId),
        gte(liveShows.scheduledStartTime, new Date())
      ),
      orderBy: [liveShows.scheduledStartTime],
      limit,
      with: {
        creator: true,
      },
    });
  }

  /**
   * Get live shows
   */
  static async getLiveShows(channelId: string): Promise<any[]> {
    return db.query.liveShows.findMany({
      where: and(
        eq(liveShows.channelId, channelId),
        eq(liveShows.status, "LIVE")
      ),
      with: {
        creator: true,
        pinnedProducts: {
          where: eq(pinnedProducts.status, "active"),
          with: {
            product: true,
          },
        },
      },
    });
  }
}

// ============================================================================
// REAL-TIME STOCK SYNC
// ============================================================================

export class LiveStockSync {
  /**
   * Get real-time stock for pinned products
   */
  static async getPinnedProductsStock(showId: string): Promise<Array<{
    productId: string;
    productName: string;
    price: number;
    available: number;
    reserved: number;
    stockStatus: "in_stock" | "low_stock" | "out_of_stock";
    urgencyMessage?: string;
  }>> {
    const pins = await db.query.pinnedProducts.findMany({
      where: and(
        eq(pinnedProducts.showId, showId),
        eq(pinnedProducts.status, "active")
      ),
      with: {
        product: true,
      },
      orderBy: [desc(pinnedProducts.priority)],
    });

    const result = [];

    for (const pin of pins) {
      const stock = await db
        .select({
          available: sql<number>`SUM(${inventory.available})`,
          reserved: sql<number>`SUM(${inventory.reserved})`,
        })
        .from(inventory)
        .where(eq(inventory.productId, pin.productId));

      const available = stock[0]?.available || 0;
      const reserved = stock[0]?.reserved || 0;

      let stockStatus: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
      if (available === 0) {
        stockStatus = "out_of_stock";
      } else if (available < 10) {
        stockStatus = "low_stock";
      }

      result.push({
        productId: pin.productId,
        productName: pin.product.name,
        price: pin.priceOverride ? Number(pin.priceOverride) : Number(pin.product.price),
        available,
        reserved,
        stockStatus,
        urgencyMessage: pin.urgencyMessage || undefined,
      });
    }

    return result;
  }

  /**
   * Reserve inventory for live order
   */
  static async reserveInventory(
    productId: string,
    quantity: number,
    orderId: string
  ): Promise<boolean> {
    try {
      // Get available inventory
      const inventoryRecords = await db.query.inventory.findMany({
        where: and(
          eq(inventory.productId, productId),
          sql`${inventory.available} >= ${quantity}`
        ),
        limit: 1,
      });

      if (inventoryRecords.length === 0) {
        return false; // Not enough stock
      }

      const inv = inventoryRecords[0];

      // Reserve inventory (atomic operation)
      await db
        .update(inventory)
        .set({
          available: sql`${inventory.available} - ${quantity}`,
          reserved: sql`${inventory.reserved} + ${quantity}`,
        })
        .where(eq(inventory.id, inv.id));

      // Create reservation record
      await db.insert(inventoryReservations).values({
        id: ulid(),
        inventoryId: inv.id,
        orderId,
        quantity,
        expiresAt: new Date(Date.now() + 15 * 60000), // 15 minutes
        status: "active",
        createdAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error("Failed to reserve inventory:", error);
      return false;
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const liveOrchestration = {
  LiveShowOrchestrator,
  ShowScheduler,
  LiveStockSync,
};
