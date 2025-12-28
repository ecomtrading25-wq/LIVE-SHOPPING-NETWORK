/**
 * Live Show Runner Service
 * Manages live shopping show sessions, product pinning, price drops, segments, and highlights
 */

import { getDbSync } from './db';
const db = getDbSync();
import { 
  liveShows, 
  liveShowSegments, 
  pinnedProducts as livePinnedProducts, 
  livePriceDrops, 
  liveHighlights,
  products,
  inventoryReservations
} from '../drizzle/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

export type ShowStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELED';
export type SegmentType = 'INTRO' | 'PRODUCT_SHOWCASE' | 'PRICE_DROP' | 'QA' | 'OUTRO' | 'BREAK';

export interface LiveShowSession {
  showId: string;
  channelId: string;
  creatorId: string;
  broadcastChannelId: string;
  title: string;
  description?: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  actualStartAt?: Date;
  actualEndAt?: Date;
  status: ShowStatus;
  streamUrl?: string;
  recordingUrl?: string;
  viewerCount: number;
  peakViewerCount: number;
  totalRevenueCents: number;
  totalOrders: number;
}

export interface ShowSegment {
  segmentId: string;
  showId: string;
  type: SegmentType;
  title: string;
  description?: string;
  plannedDurationSeconds: number;
  actualStartOffset?: number;
  actualEndOffset?: number;
  sortOrder: number;
  notes?: string;
}

export interface PinnedProduct {
  pinId: string;
  showId: string;
  productId: string;
  pinnedAt: Date;
  unpinnedAt?: Date;
  displayPriceCents: number;
  originalPriceCents: number;
  stockAvailable: number;
  unitsSold: number;
  revenueCents: number;
  sortOrder: number;
}

export interface PriceDrop {
  dropId: string;
  showId: string;
  productId: string;
  originalPriceCents: number;
  dropPriceCents: number;
  startedAt: Date;
  endsAt: Date;
  maxQuantity?: number;
  quantitySold: number;
  revenueCents: number;
  urgencyMessage?: string;
}

export interface Highlight {
  highlightId: string;
  showId: string;
  timestampSeconds: number;
  type: 'VIRAL_MOMENT' | 'PRODUCT_DEMO' | 'PRICE_DROP' | 'CUSTOMER_REACTION' | 'OTHER';
  title: string;
  description?: string;
  clipUrl?: string;
  thumbnailUrl?: string;
}

/**
 * Start a live show
 */
export async function startLiveShow(
  channelId: string,
  showId: string,
  streamUrl: string
): Promise<LiveShowSession> {
  const show = await db.query.liveShows.findFirst({
    where: and(
      eq(liveShows.showId, showId),
      eq(liveShows.channelId, channelId)
    )
  });

  if (!show) {
    throw new Error('Show not found');
  }

  if (show.status !== 'SCHEDULED') {
    throw new Error(`Cannot start show in status: ${show.status}`);
  }

  // Update show to LIVE status
  const [updatedShow] = await db.update(liveShows)
    .set({
      status: 'LIVE',
      actualStartAt: new Date(),
      streamUrl,
      updatedAt: new Date()
    })
    .where(eq(liveShows.showId, showId))
    .returning();

  return updatedShow as LiveShowSession;
}

/**
 * End a live show
 */
export async function endLiveShow(
  channelId: string,
  showId: string,
  recordingUrl?: string
): Promise<LiveShowSession> {
  const show = await db.query.liveShows.findFirst({
    where: and(
      eq(liveShows.showId, showId),
      eq(liveShows.channelId, channelId)
    )
  });

  if (!show) {
    throw new Error('Show not found');
  }

  if (show.status !== 'LIVE') {
    throw new Error(`Cannot end show in status: ${show.status}`);
  }

  // Unpin all products
  await db.update(livePinnedProducts)
    .set({ unpinnedAt: new Date() })
    .where(and(
      eq(livePinnedProducts.showId, showId),
      eq(livePinnedProducts.unpinnedAt, null as any)
    ));

  // End all active price drops
  await db.update(livePriceDrops)
    .set({ endsAt: new Date() })
    .where(and(
      eq(livePriceDrops.showId, showId),
      gte(livePriceDrops.endsAt, new Date())
    ));

  // Update show to ENDED status
  const [updatedShow] = await db.update(liveShows)
    .set({
      status: 'ENDED',
      actualEndAt: new Date(),
      recordingUrl: recordingUrl || null,
      updatedAt: new Date()
    })
    .where(eq(liveShows.showId, showId))
    .returning();

  return updatedShow as LiveShowSession;
}

/**
 * Update viewer count
 */
export async function updateViewerCount(
  showId: string,
  viewerCount: number
): Promise<void> {
  const show = await db.query.liveShows.findFirst({
    where: eq(liveShows.showId, showId)
  });

  if (!show) return;

  const peakViewerCount = Math.max(show.peakViewerCount || 0, viewerCount);

  await db.update(liveShows)
    .set({
      viewerCount,
      peakViewerCount,
      updatedAt: new Date()
    })
    .where(eq(liveShows.showId, showId));
}

/**
 * Pin a product during live show
 */
export async function pinProduct(
  channelId: string,
  showId: string,
  productId: string,
  displayPriceCents: number,
  sortOrder: number = 0
): Promise<PinnedProduct> {
  // Verify show is live
  const show = await db.query.liveShows.findFirst({
    where: and(
      eq(liveShows.showId, showId),
      eq(liveShows.channelId, channelId)
    )
  });

  if (!show || show.status !== 'LIVE') {
    throw new Error('Show is not live');
  }

  // Get product details
  const product = await db.query.products.findFirst({
    where: and(
      eq(products.productId, productId),
      eq(products.channelId, channelId)
    )
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // Check if already pinned
  const existingPin = await db.query.livePinnedProducts.findFirst({
    where: and(
      eq(livePinnedProducts.showId, showId),
      eq(livePinnedProducts.productId, productId),
      eq(livePinnedProducts.unpinnedAt, null as any)
    )
  });

  if (existingPin) {
    throw new Error('Product is already pinned');
  }

  // Create pin
  const [pin] = await db.insert(livePinnedProducts).values({
    channelId,
    showId,
    productId,
    pinnedAt: new Date(),
    displayPriceCents,
    originalPriceCents: product.priceCents,
    stockAvailable: product.stockQuantity || 0,
    unitsSold: 0,
    revenueCents: 0,
    sortOrder
  }).returning();

  return pin as PinnedProduct;
}

/**
 * Unpin a product
 */
export async function unpinProduct(
  channelId: string,
  showId: string,
  productId: string
): Promise<void> {
  await db.update(livePinnedProducts)
    .set({ unpinnedAt: new Date() })
    .where(and(
      eq(livePinnedProducts.showId, showId),
      eq(livePinnedProducts.productId, productId),
      eq(livePinnedProducts.channelId, channelId),
      eq(livePinnedProducts.unpinnedAt, null as any)
    ));
}

/**
 * Get currently pinned products
 */
export async function getPinnedProducts(showId: string): Promise<PinnedProduct[]> {
  const pins = await db.query.livePinnedProducts.findMany({
    where: and(
      eq(livePinnedProducts.showId, showId),
      eq(livePinnedProducts.unpinnedAt, null as any)
    ),
    with: {
      product: true
    },
    orderBy: desc(livePinnedProducts.sortOrder)
  });

  return pins as PinnedProduct[];
}

/**
 * Execute a price drop
 */
export async function executePriceDrop(
  channelId: string,
  showId: string,
  productId: string,
  dropPriceCents: number,
  durationSeconds: number,
  maxQuantity?: number,
  urgencyMessage?: string
): Promise<PriceDrop> {
  // Verify show is live
  const show = await db.query.liveShows.findFirst({
    where: and(
      eq(liveShows.showId, showId),
      eq(liveShows.channelId, channelId)
    )
  });

  if (!show || show.status !== 'LIVE') {
    throw new Error('Show is not live');
  }

  // Get product
  const product = await db.query.products.findFirst({
    where: and(
      eq(products.productId, productId),
      eq(products.channelId, channelId)
    )
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // Check if product is pinned
  const pin = await db.query.livePinnedProducts.findFirst({
    where: and(
      eq(livePinnedProducts.showId, showId),
      eq(livePinnedProducts.productId, productId),
      eq(livePinnedProducts.unpinnedAt, null as any)
    )
  });

  if (!pin) {
    throw new Error('Product must be pinned before price drop');
  }

  // End any existing price drops for this product
  await db.update(livePriceDrops)
    .set({ endsAt: new Date() })
    .where(and(
      eq(livePriceDrops.showId, showId),
      eq(livePriceDrops.productId, productId),
      gte(livePriceDrops.endsAt, new Date())
    ));

  // Create price drop
  const endsAt = new Date(Date.now() + durationSeconds * 1000);
  
  const [drop] = await db.insert(livePriceDrops).values({
    channelId,
    showId,
    productId,
    originalPriceCents: pin.displayPriceCents,
    dropPriceCents,
    startedAt: new Date(),
    endsAt,
    maxQuantity: maxQuantity || null,
    quantitySold: 0,
    revenueCents: 0,
    urgencyMessage: urgencyMessage || null
  }).returning();

  // Update pinned product price
  await db.update(livePinnedProducts)
    .set({ displayPriceCents: dropPriceCents })
    .where(eq(livePinnedProducts.pinId, pin.pinId));

  return drop as PriceDrop;
}

/**
 * Get active price drops
 */
export async function getActivePriceDrops(showId: string): Promise<PriceDrop[]> {
  const drops = await db.query.livePriceDrops.findMany({
    where: and(
      eq(livePriceDrops.showId, showId),
      gte(livePriceDrops.endsAt, new Date())
    ),
    with: {
      product: true
    }
  });

  return drops as PriceDrop[];
}

/**
 * Record a purchase during price drop
 */
export async function recordPriceDropPurchase(
  showId: string,
  productId: string,
  quantitySold: number,
  revenueCents: number
): Promise<void> {
  // Find active price drop
  const drop = await db.query.livePriceDrops.findFirst({
    where: and(
      eq(livePriceDrops.showId, showId),
      eq(livePriceDrops.productId, productId),
      gte(livePriceDrops.endsAt, new Date())
    )
  });

  if (drop) {
    // Update price drop stats
    await db.update(livePriceDrops)
      .set({
        quantitySold: drop.quantitySold + quantitySold,
        revenueCents: drop.revenueCents + revenueCents
      })
      .where(eq(livePriceDrops.dropId, drop.dropId));

    // Check if max quantity reached
    if (drop.maxQuantity && (drop.quantitySold + quantitySold) >= drop.maxQuantity) {
      // End price drop early
      await db.update(livePriceDrops)
        .set({ endsAt: new Date() })
        .where(eq(livePriceDrops.dropId, drop.dropId));
    }
  }

  // Update pinned product stats
  const pin = await db.query.livePinnedProducts.findFirst({
    where: and(
      eq(livePinnedProducts.showId, showId),
      eq(livePinnedProducts.productId, productId),
      eq(livePinnedProducts.unpinnedAt, null as any)
    )
  });

  if (pin) {
    await db.update(livePinnedProducts)
      .set({
        unitsSold: pin.unitsSold + quantitySold,
        revenueCents: pin.revenueCents + revenueCents
      })
      .where(eq(livePinnedProducts.pinId, pin.pinId));
  }

  // Update show totals
  const show = await db.query.liveShows.findFirst({
    where: eq(liveShows.showId, showId)
  });

  if (show) {
    await db.update(liveShows)
      .set({
        totalRevenueCents: show.totalRevenueCents + revenueCents,
        totalOrders: show.totalOrders + 1
      })
      .where(eq(liveShows.showId, showId));
  }
}

/**
 * Create a show segment
 */
export async function createSegment(
  channelId: string,
  showId: string,
  type: SegmentType,
  title: string,
  plannedDurationSeconds: number,
  sortOrder: number,
  description?: string,
  notes?: string
): Promise<ShowSegment> {
  const [segment] = await db.insert(liveShowSegments).values({
    channelId,
    showId,
    type,
    title,
    description: description || null,
    plannedDurationSeconds,
    sortOrder,
    notes: notes || null
  }).returning();

  return segment as ShowSegment;
}

/**
 * Start a segment (record actual timing)
 */
export async function startSegment(
  segmentId: string,
  offsetSeconds: number
): Promise<void> {
  await db.update(liveShowSegments)
    .set({ actualStartOffset: offsetSeconds })
    .where(eq(liveShowSegments.segmentId, segmentId));
}

/**
 * End a segment
 */
export async function endSegment(
  segmentId: string,
  offsetSeconds: number
): Promise<void> {
  await db.update(liveShowSegments)
    .set({ actualEndOffset: offsetSeconds })
    .where(eq(liveShowSegments.segmentId, segmentId));
}

/**
 * Get show segments
 */
export async function getShowSegments(showId: string): Promise<ShowSegment[]> {
  const segments = await db.query.liveShowSegments.findMany({
    where: eq(liveShowSegments.showId, showId),
    orderBy: desc(liveShowSegments.sortOrder)
  });

  return segments as ShowSegment[];
}

/**
 * Mark a highlight timestamp
 */
export async function markHighlight(
  channelId: string,
  showId: string,
  timestampSeconds: number,
  type: Highlight['type'],
  title: string,
  description?: string
): Promise<Highlight> {
  const [highlight] = await db.insert(liveHighlights).values({
    channelId,
    showId,
    timestampSeconds,
    type,
    title,
    description: description || null
  }).returning();

  return highlight as Highlight;
}

/**
 * Get show highlights
 */
export async function getShowHighlights(showId: string): Promise<Highlight[]> {
  const highlights = await db.query.liveHighlights.findMany({
    where: eq(liveHighlights.showId, showId),
    orderBy: desc(liveHighlights.timestampSeconds)
  });

  return highlights as Highlight[];
}

/**
 * Update highlight with clip URL
 */
export async function updateHighlightClip(
  highlightId: string,
  clipUrl: string,
  thumbnailUrl?: string
): Promise<void> {
  await db.update(liveHighlights)
    .set({
      clipUrl,
      thumbnailUrl: thumbnailUrl || null
    })
    .where(eq(liveHighlights.highlightId, highlightId));
}

/**
 * Get live show statistics
 */
export async function getShowStatistics(showId: string) {
  const show = await db.query.liveShows.findFirst({
    where: eq(liveShows.showId, showId),
    with: {
      pinnedProducts: true,
      priceDrops: true,
      highlights: true,
      segments: true
    }
  });

  if (!show) {
    throw new Error('Show not found');
  }

  const totalPins = show.pinnedProducts.length;
  const totalPriceDrops = show.priceDrops.length;
  const totalHighlights = show.highlights.length;
  
  const avgPriceDropDuration = show.priceDrops.length > 0
    ? show.priceDrops.reduce((sum, drop) => {
        const duration = (drop.endsAt.getTime() - drop.startedAt.getTime()) / 1000;
        return sum + duration;
      }, 0) / show.priceDrops.length
    : 0;

  const totalPriceDropRevenue = show.priceDrops.reduce((sum, drop) => sum + drop.revenueCents, 0);
  const totalPriceDropUnits = show.priceDrops.reduce((sum, drop) => sum + drop.quantitySold, 0);

  return {
    showId: show.showId,
    status: show.status,
    duration: show.actualEndAt && show.actualStartAt
      ? (show.actualEndAt.getTime() - show.actualStartAt.getTime()) / 1000
      : null,
    viewerCount: show.viewerCount,
    peakViewerCount: show.peakViewerCount,
    totalRevenueCents: show.totalRevenueCents,
    totalOrders: show.totalOrders,
    totalPins,
    totalPriceDrops,
    totalHighlights,
    avgPriceDropDuration,
    totalPriceDropRevenue,
    totalPriceDropUnits,
    revenuePerViewer: show.peakViewerCount > 0
      ? show.totalRevenueCents / show.peakViewerCount
      : 0,
    conversionRate: show.viewerCount > 0
      ? (show.totalOrders / show.viewerCount) * 100
      : 0
  };
}

/**
 * Get current show state (for real-time display)
 */
export async function getCurrentShowState(showId: string) {
  const show = await db.query.liveShows.findFirst({
    where: eq(liveShows.showId, showId)
  });

  if (!show) {
    throw new Error('Show not found');
  }

  const pinnedProducts = await getPinnedProducts(showId);
  const activePriceDrops = await getActivePriceDrops(showId);
  const segments = await getShowSegments(showId);
  const highlights = await getShowHighlights(showId);

  return {
    show,
    pinnedProducts,
    activePriceDrops,
    segments,
    highlights,
    isLive: show.status === 'LIVE'
  };
}

/**
 * Schedule a show
 */
export async function scheduleShow(
  channelId: string,
  creatorId: string,
  broadcastChannelId: string,
  title: string,
  scheduledStartAt: Date,
  scheduledEndAt: Date,
  description?: string
): Promise<LiveShowSession> {
  const [show] = await db.insert(liveShows).values({
    channelId,
    creatorId,
    broadcastChannelId,
    title,
    description: description || null,
    scheduledStartAt,
    scheduledEndAt,
    status: 'SCHEDULED',
    viewerCount: 0,
    peakViewerCount: 0,
    totalRevenueCents: 0,
    totalOrders: 0
  }).returning();

  return show as LiveShowSession;
}

/**
 * Cancel a scheduled show
 */
export async function cancelShow(
  channelId: string,
  showId: string,
  reason?: string
): Promise<void> {
  const show = await db.query.liveShows.findFirst({
    where: and(
      eq(liveShows.showId, showId),
      eq(liveShows.channelId, channelId)
    )
  });

  if (!show) {
    throw new Error('Show not found');
  }

  if (show.status !== 'SCHEDULED') {
    throw new Error('Can only cancel scheduled shows');
  }

  await db.update(liveShows)
    .set({
      status: 'CANCELED',
      updatedAt: new Date()
    })
    .where(eq(liveShows.showId, showId));
}
