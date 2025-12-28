/**
 * LSN CREATOR ECONOMY & SCHEDULING ENGINE V1
 * 
 * Complete creator management system with:
 * - Creator profiles with tier system (Bronze, Silver, Gold, Platinum, Diamond)
 * - Profit-based incentive calculation
 * - Bonus and clawback automation
 * - Creator payout batch processing
 * - 24/7 broadcast schedule grid
 * - Auto-fill scheduling algorithm
 * - Prime time allocation by performance
 * - Creator availability management
 * - Schedule conflict detection
 * - Creator training content system
 * - Performance-based show allocation
 * - Commission tiers and escalation
 * - Creator onboarding workflows
 * - Performance analytics per creator
 * - Creator leaderboards
 */

import { db } from "./db.js";
import {
  creators,
  creatorTiers,
  creatorPayouts,
  creatorBonuses,
  creatorClawbacks,
  broadcastChannels,
  scheduleSlots,
  creatorAvailability,
  creatorTraining,
  creatorPerformance,
  liveShows,
  showPurchases,
  orders,
  orderItems,
} from "../drizzle/schema.js";
import { eq, and, gte, lte, desc, sql, between } from "drizzle-orm";
import { ulid } from "ulid";

// ============================================================================
// TYPES & ENUMS
// ============================================================================

export type CreatorTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";

export type CreatorStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_APPROVAL";

export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "HELD";

export type ScheduleSlotStatus = "AVAILABLE" | "BOOKED" | "BLOCKED" | "COMPLETED";

export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export interface CreatorProfile {
  id: string;
  name: string;
  email: string;
  tier: CreatorTier;
  commissionRate: number;
  bonusRate: number;
  status: CreatorStatus;
  totalShows: number;
  totalRevenue: number;
  avgViewers: number;
  conversionRate: number;
  rating: number;
}

export interface TierConfig {
  tier: CreatorTier;
  minRevenue: number;
  minShows: number;
  minConversionRate: number;
  commissionRate: number;
  bonusRate: number;
  primeTimeSlots: number;
  benefits: string[];
}

export interface IncentiveCalculation {
  creatorId: string;
  period: { start: Date; end: Date };
  baseCommission: number;
  performanceBonus: number;
  tierBonus: number;
  clawbacks: number;
  netPayout: number;
  breakdown: {
    totalRevenue: number;
    totalOrders: number;
    totalShows: number;
    avgConversionRate: number;
    bonusEligible: boolean;
  };
}

export interface ScheduleGridConfig {
  channelId: string;
  startDate: Date;
  endDate: Date;
  slotDurationMinutes: number;
  primeTimeSlots: Array<{
    dayOfWeek: DayOfWeek;
    startHour: number;
    endHour: number;
  }>;
}

export interface CreatorAvailabilitySlot {
  creatorId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:MM format
  endTime: string;
  recurring: boolean;
}

// ============================================================================
// TIER SYSTEM CONFIGURATION
// ============================================================================

export const TIER_CONFIGS: Record<CreatorTier, TierConfig> = {
  BRONZE: {
    tier: "BRONZE",
    minRevenue: 0,
    minShows: 0,
    minConversionRate: 0,
    commissionRate: 0.08, // 8%
    bonusRate: 0.00,
    primeTimeSlots: 1,
    benefits: [
      "Basic training materials",
      "1 prime time slot per week",
      "Standard support",
    ],
  },
  SILVER: {
    tier: "SILVER",
    minRevenue: 10000,
    minShows: 10,
    minConversionRate: 0.02,
    commissionRate: 0.10, // 10%
    bonusRate: 0.02,
    primeTimeSlots: 2,
    benefits: [
      "Advanced training materials",
      "2 prime time slots per week",
      "Priority support",
      "Performance bonuses",
    ],
  },
  GOLD: {
    tier: "GOLD",
    minRevenue: 50000,
    minShows: 30,
    minConversionRate: 0.03,
    commissionRate: 0.12, // 12%
    bonusRate: 0.03,
    primeTimeSlots: 3,
    benefits: [
      "Premium training materials",
      "3 prime time slots per week",
      "Dedicated account manager",
      "Enhanced performance bonuses",
      "Early access to new products",
    ],
  },
  PLATINUM: {
    tier: "PLATINUM",
    minRevenue: 150000,
    minShows: 60,
    minConversionRate: 0.04,
    commissionRate: 0.15, // 15%
    bonusRate: 0.05,
    primeTimeSlots: 5,
    benefits: [
      "VIP training and coaching",
      "5 prime time slots per week",
      "Personal account manager",
      "Maximum performance bonuses",
      "Exclusive product launches",
      "Revenue share opportunities",
    ],
  },
  DIAMOND: {
    tier: "DIAMOND",
    minRevenue: 500000,
    minShows: 120,
    minConversionRate: 0.05,
    commissionRate: 0.20, // 20%
    bonusRate: 0.08,
    primeTimeSlots: 10,
    benefits: [
      "Executive training and mentorship",
      "Unlimited prime time slots",
      "Executive account manager",
      "Elite performance bonuses",
      "Co-branded product lines",
      "Equity participation",
      "Global expansion opportunities",
    ],
  },
};

// ============================================================================
// CREATOR TIER MANAGER
// ============================================================================

export class CreatorTierManager {
  /**
   * Evaluate and update creator tier
   */
  static async evaluateTier(creatorId: string): Promise<CreatorTier> {
    // Get creator performance metrics
    const metrics = await this.getCreatorMetrics(creatorId);

    // Determine tier based on metrics
    let newTier: CreatorTier = "BRONZE";

    if (
      metrics.totalRevenue >= TIER_CONFIGS.DIAMOND.minRevenue &&
      metrics.totalShows >= TIER_CONFIGS.DIAMOND.minShows &&
      metrics.avgConversionRate >= TIER_CONFIGS.DIAMOND.minConversionRate
    ) {
      newTier = "DIAMOND";
    } else if (
      metrics.totalRevenue >= TIER_CONFIGS.PLATINUM.minRevenue &&
      metrics.totalShows >= TIER_CONFIGS.PLATINUM.minShows &&
      metrics.avgConversionRate >= TIER_CONFIGS.PLATINUM.minConversionRate
    ) {
      newTier = "PLATINUM";
    } else if (
      metrics.totalRevenue >= TIER_CONFIGS.GOLD.minRevenue &&
      metrics.totalShows >= TIER_CONFIGS.GOLD.minShows &&
      metrics.avgConversionRate >= TIER_CONFIGS.GOLD.minConversionRate
    ) {
      newTier = "GOLD";
    } else if (
      metrics.totalRevenue >= TIER_CONFIGS.SILVER.minRevenue &&
      metrics.totalShows >= TIER_CONFIGS.SILVER.minShows &&
      metrics.avgConversionRate >= TIER_CONFIGS.SILVER.minConversionRate
    ) {
      newTier = "SILVER";
    }

    // Update creator tier
    await db
      .update(creators)
      .set({
        tier: newTier,
        commissionRate: TIER_CONFIGS[newTier].commissionRate,
        updatedAt: new Date(),
      })
      .where(eq(creators.id, creatorId));

    // Log tier change
    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, creatorId),
    });

    if (creator && creator.tier !== newTier) {
      console.log(`Creator ${creatorId} tier changed: ${creator.tier} → ${newTier}`);
    }

    return newTier;
  }

  /**
   * Get creator performance metrics
   */
  static async getCreatorMetrics(creatorId: string): Promise<{
    totalRevenue: number;
    totalShows: number;
    totalOrders: number;
    totalViewers: number;
    avgConversionRate: number;
    avgOrderValue: number;
    avgViewers: number;
  }> {
    // Get show stats
    const showStats = await db
      .select({
        totalShows: sql<number>`COUNT(*)`,
        totalRevenue: sql<number>`SUM(CAST(${liveShows.totalRevenue} AS DECIMAL(10,2)))`,
        totalOrders: sql<number>`SUM(${liveShows.totalOrders})`,
        totalViewers: sql<number>`SUM(${liveShows.totalViewers})`,
        avgConversionRate: sql<number>`AVG(${liveShows.conversionRate})`,
        avgOrderValue: sql<number>`AVG(CAST(${liveShows.avgOrderValue} AS DECIMAL(10,2)))`,
      })
      .from(liveShows)
      .where(
        and(
          eq(liveShows.creatorId, creatorId),
          eq(liveShows.status, "ARCHIVED")
        )
      );

    const stats = showStats[0] || {};

    return {
      totalRevenue: stats.totalRevenue || 0,
      totalShows: stats.totalShows || 0,
      totalOrders: stats.totalOrders || 0,
      totalViewers: stats.totalViewers || 0,
      avgConversionRate: stats.avgConversionRate || 0,
      avgOrderValue: stats.avgOrderValue || 0,
      avgViewers: stats.totalShows > 0 ? (stats.totalViewers || 0) / stats.totalShows : 0,
    };
  }

  /**
   * Get tier progression for creator
   */
  static async getTierProgression(creatorId: string): Promise<{
    currentTier: CreatorTier;
    nextTier: CreatorTier | null;
    progress: {
      revenue: { current: number; required: number; percentage: number };
      shows: { current: number; required: number; percentage: number };
      conversionRate: { current: number; required: number; percentage: number };
    };
  }> {
    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, creatorId),
    });

    if (!creator) throw new Error("Creator not found");

    const metrics = await this.getCreatorMetrics(creatorId);
    const currentTier = creator.tier as CreatorTier;

    // Determine next tier
    const tierOrder: CreatorTier[] = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"];
    const currentIndex = tierOrder.indexOf(currentTier);
    const nextTier = currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null;

    if (!nextTier) {
      return {
        currentTier,
        nextTier: null,
        progress: {
          revenue: { current: metrics.totalRevenue, required: 0, percentage: 100 },
          shows: { current: metrics.totalShows, required: 0, percentage: 100 },
          conversionRate: { current: metrics.avgConversionRate, required: 0, percentage: 100 },
        },
      };
    }

    const nextTierConfig = TIER_CONFIGS[nextTier];

    return {
      currentTier,
      nextTier,
      progress: {
        revenue: {
          current: metrics.totalRevenue,
          required: nextTierConfig.minRevenue,
          percentage: Math.min(100, (metrics.totalRevenue / nextTierConfig.minRevenue) * 100),
        },
        shows: {
          current: metrics.totalShows,
          required: nextTierConfig.minShows,
          percentage: Math.min(100, (metrics.totalShows / nextTierConfig.minShows) * 100),
        },
        conversionRate: {
          current: metrics.avgConversionRate,
          required: nextTierConfig.minConversionRate,
          percentage: Math.min(100, (metrics.avgConversionRate / nextTierConfig.minConversionRate) * 100),
        },
      },
    };
  }
}

// ============================================================================
// INCENTIVE CALCULATOR
// ============================================================================

export class IncentiveCalculator {
  /**
   * Calculate creator incentives for period
   */
  static async calculateIncentives(
    creatorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IncentiveCalculation> {
    const creator = await db.query.creators.findFirst({
      where: eq(creators.id, creatorId),
    });

    if (!creator) throw new Error("Creator not found");

    // Get shows in period
    const shows = await db.query.liveShows.findMany({
      where: and(
        eq(liveShows.creatorId, creatorId),
        gte(liveShows.actualStartTime, startDate),
        lte(liveShows.actualStartTime, endDate),
        eq(liveShows.status, "ARCHIVED")
      ),
    });

    // Calculate totals
    const totalRevenue = shows.reduce((sum, show) => sum + Number(show.totalRevenue || 0), 0);
    const totalOrders = shows.reduce((sum, show) => sum + (show.totalOrders || 0), 0);
    const totalViewers = shows.reduce((sum, show) => sum + (show.totalViewers || 0), 0);
    const avgConversionRate = shows.length > 0
      ? shows.reduce((sum, show) => sum + (show.conversionRate || 0), 0) / shows.length
      : 0;

    // Base commission
    const commissionRate = creator.commissionRate || TIER_CONFIGS[creator.tier as CreatorTier].commissionRate;
    const baseCommission = totalRevenue * commissionRate;

    // Performance bonus (if conversion rate exceeds tier minimum)
    const tierConfig = TIER_CONFIGS[creator.tier as CreatorTier];
    const bonusEligible = avgConversionRate >= tierConfig.minConversionRate * 1.2; // 20% above minimum
    const performanceBonus = bonusEligible ? totalRevenue * tierConfig.bonusRate : 0;

    // Tier bonus (for high performers)
    let tierBonus = 0;
    if (creator.tier === "PLATINUM" && totalRevenue > 200000) {
      tierBonus = totalRevenue * 0.02; // Extra 2%
    } else if (creator.tier === "DIAMOND" && totalRevenue > 600000) {
      tierBonus = totalRevenue * 0.03; // Extra 3%
    }

    // Get clawbacks
    const clawbackRecords = await db.query.creatorClawbacks.findMany({
      where: and(
        eq(creatorClawbacks.creatorId, creatorId),
        gte(creatorClawbacks.createdAt, startDate),
        lte(creatorClawbacks.createdAt, endDate)
      ),
    });

    const clawbacks = clawbackRecords.reduce(
      (sum, record) => sum + Number(record.amount),
      0
    );

    // Net payout
    const netPayout = baseCommission + performanceBonus + tierBonus - clawbacks;

    return {
      creatorId,
      period: { start: startDate, end: endDate },
      baseCommission,
      performanceBonus,
      tierBonus,
      clawbacks,
      netPayout,
      breakdown: {
        totalRevenue,
        totalOrders,
        totalShows: shows.length,
        avgConversionRate,
        bonusEligible,
      },
    };
  }

  /**
   * Process payout batch
   */
  static async processPayout(
    creatorId: string,
    amount: number,
    period: { start: Date; end: Date },
    metadata: any = {}
  ): Promise<string> {
    const payoutId = ulid();

    await db.insert(creatorPayouts).values({
      id: payoutId,
      creatorId,
      amount: amount.toString(),
      periodStart: period.start,
      periodEnd: period.end,
      status: "PENDING",
      metadata: JSON.stringify(metadata),
      createdAt: new Date(),
    });

    return payoutId;
  }

  /**
   * Add bonus
   */
  static async addBonus(
    creatorId: string,
    amount: number,
    reason: string,
    metadata: any = {}
  ): Promise<string> {
    const bonusId = ulid();

    await db.insert(creatorBonuses).values({
      id: bonusId,
      creatorId,
      amount: amount.toString(),
      reason,
      metadata: JSON.stringify(metadata),
      createdAt: new Date(),
    });

    return bonusId;
  }

  /**
   * Add clawback
   */
  static async addClawback(
    creatorId: string,
    amount: number,
    reason: string,
    metadata: any = {}
  ): Promise<string> {
    const clawbackId = ulid();

    await db.insert(creatorClawbacks).values({
      id: clawbackId,
      creatorId,
      amount: amount.toString(),
      reason,
      metadata: JSON.stringify(metadata),
      createdAt: new Date(),
    });

    return clawbackId;
  }
}

// ============================================================================
// SCHEDULE GRID MANAGER
// ============================================================================

export class ScheduleGridManager {
  /**
   * Generate schedule grid
   */
  static async generateGrid(config: ScheduleGridConfig): Promise<void> {
    const slots: any[] = [];
    const currentDate = new Date(config.startDate);

    while (currentDate <= config.endDate) {
      // Generate slots for each day (24/7 coverage)
      for (let hour = 0; hour < 24; hour++) {
        const slotStart = new Date(currentDate);
        slotStart.setHours(hour, 0, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(config.slotDurationMinutes);

        // Determine if prime time
        const dayOfWeek = this.getDayOfWeek(currentDate);
        const isPrimeTime = config.primeTimeSlots.some(
          (pt) =>
            pt.dayOfWeek === dayOfWeek &&
            hour >= pt.startHour &&
            hour < pt.endHour
        );

        slots.push({
          id: ulid(),
          channelId: config.channelId,
          startTime: slotStart,
          endTime: slotEnd,
          isPrimeTime,
          status: "AVAILABLE",
          createdAt: new Date(),
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Batch insert slots
    if (slots.length > 0) {
      await db.insert(scheduleSlots).values(slots);
    }
  }

  /**
   * Auto-fill schedule with creators
   */
  static async autoFillSchedule(
    channelId: string,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    // Get available slots
    const slots = await db.query.scheduleSlots.findMany({
      where: and(
        eq(scheduleSlots.channelId, channelId),
        gte(scheduleSlots.startTime, startDate),
        lte(scheduleSlots.startTime, endDate),
        eq(scheduleSlots.status, "AVAILABLE")
      ),
      orderBy: [scheduleSlots.startTime],
    });

    // Get active creators sorted by performance
    const creators = await db.query.creators.findMany({
      where: eq(creators.status, "ACTIVE"),
      orderBy: [desc(creators.tier), desc(creators.avgConversionRate)],
    });

    // Allocate prime time slots first
    const primeTimeSlots = slots.filter((s) => s.isPrimeTime);
    const regularSlots = slots.filter((s) => !s.isPrimeTime);

    // Allocate prime time based on tier
    for (const creator of creators) {
      const tierConfig = TIER_CONFIGS[creator.tier as CreatorTier];
      const allocatedSlots = primeTimeSlots.splice(0, tierConfig.primeTimeSlots);

      for (const slot of allocatedSlots) {
        await this.bookSlot(slot.id, creator.id);
      }
    }

    // Fill remaining slots round-robin
    let creatorIndex = 0;
    for (const slot of regularSlots) {
      const creator = creators[creatorIndex % creators.length];
      await this.bookSlot(slot.id, creator.id);
      creatorIndex++;
    }
  }

  /**
   * Book slot for creator
   */
  static async bookSlot(slotId: string, creatorId: string): Promise<void> {
    // Check creator availability
    const slot = await db.query.scheduleSlots.findFirst({
      where: eq(scheduleSlots.id, slotId),
    });

    if (!slot) throw new Error("Slot not found");

    const isAvailable = await this.checkCreatorAvailability(
      creatorId,
      slot.startTime,
      slot.endTime
    );

    if (!isAvailable) {
      throw new Error("Creator not available for this slot");
    }

    // Book slot
    await db
      .update(scheduleSlots)
      .set({
        creatorId,
        status: "BOOKED",
        updatedAt: new Date(),
      })
      .where(eq(scheduleSlots.id, slotId));

    // Create scheduled show
    const showId = ulid();
    await db.insert(liveShows).values({
      id: showId,
      channelId: slot.channelId,
      creatorId,
      title: `Live Show - ${new Date(slot.startTime).toLocaleString()}`,
      scheduledStartTime: slot.startTime,
      scheduledEndTime: slot.endTime,
      status: "SCHEDULED",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Check creator availability
   */
  static async checkCreatorAvailability(
    creatorId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    const dayOfWeek = this.getDayOfWeek(startTime);
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const timeString = `${startHour.toString().padStart(2, "0")}:${startMinute.toString().padStart(2, "0")}`;

    // Check availability records
    const availability = await db.query.creatorAvailability.findMany({
      where: and(
        eq(creatorAvailability.creatorId, creatorId),
        eq(creatorAvailability.dayOfWeek, dayOfWeek)
      ),
    });

    if (availability.length === 0) {
      return false; // No availability set
    }

    // Check if time falls within any availability window
    return availability.some((a) => {
      return timeString >= a.startTime && timeString <= a.endTime;
    });
  }

  /**
   * Detect schedule conflicts
   */
  static async detectConflicts(
    channelId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{
    slotId: string;
    creatorId: string;
    conflictType: string;
    details: string;
  }>> {
    const conflicts: Array<{
      slotId: string;
      creatorId: string;
      conflictType: string;
      details: string;
    }> = [];

    const slots = await db.query.scheduleSlots.findMany({
      where: and(
        eq(scheduleSlots.channelId, channelId),
        gte(scheduleSlots.startTime, startDate),
        lte(scheduleSlots.startTime, endDate),
        eq(scheduleSlots.status, "BOOKED")
      ),
    });

    // Check for double-booking
    const creatorSlots = new Map<string, any[]>();
    for (const slot of slots) {
      if (!slot.creatorId) continue;

      if (!creatorSlots.has(slot.creatorId)) {
        creatorSlots.set(slot.creatorId, []);
      }
      creatorSlots.get(slot.creatorId)!.push(slot);
    }

    for (const [creatorId, creatorSlotList] of creatorSlots) {
      // Sort by start time
      creatorSlotList.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      // Check for overlaps
      for (let i = 0; i < creatorSlotList.length - 1; i++) {
        const current = creatorSlotList[i];
        const next = creatorSlotList[i + 1];

        if (current.endTime > next.startTime) {
          conflicts.push({
            slotId: next.id,
            creatorId,
            conflictType: "DOUBLE_BOOKING",
            details: `Overlaps with slot ${current.id}`,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Get day of week from date
   */
  private static getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    return days[date.getDay()];
  }
}

// ============================================================================
// CREATOR PERFORMANCE TRACKER
// ============================================================================

export class CreatorPerformanceTracker {
  /**
   * Track show performance
   */
  static async trackShowPerformance(showId: string): Promise<void> {
    const show = await db.query.liveShows.findFirst({
      where: eq(liveShows.id, showId),
    });

    if (!show) return;

    const performanceId = ulid();

    await db.insert(creatorPerformance).values({
      id: performanceId,
      creatorId: show.creatorId,
      showId,
      viewers: show.totalViewers || 0,
      orders: show.totalOrders || 0,
      revenue: show.totalRevenue || "0",
      conversionRate: show.conversionRate || 0,
      avgOrderValue: show.avgOrderValue || "0",
      engagementScore: this.calculateEngagementScore(show),
      createdAt: new Date(),
    });

    // Update creator aggregates
    await this.updateCreatorAggregates(show.creatorId);
  }

  /**
   * Get creator leaderboard
   */
  static async getLeaderboard(
    metric: "revenue" | "conversion" | "engagement",
    period: { start: Date; end: Date },
    limit: number = 10
  ): Promise<Array<{
    creatorId: string;
    creatorName: string;
    tier: string;
    value: number;
    rank: number;
  }>> {
    let orderColumn;
    switch (metric) {
      case "revenue":
        orderColumn = desc(sql`SUM(CAST(${creatorPerformance.revenue} AS DECIMAL(10,2)))`);
        break;
      case "conversion":
        orderColumn = desc(sql`AVG(${creatorPerformance.conversionRate})`);
        break;
      case "engagement":
        orderColumn = desc(sql`AVG(${creatorPerformance.engagementScore})`);
        break;
    }

    const results = await db
      .select({
        creatorId: creatorPerformance.creatorId,
        creatorName: creators.name,
        tier: creators.tier,
        value: sql<number>`
          CASE 
            WHEN ${metric} = 'revenue' THEN SUM(CAST(${creatorPerformance.revenue} AS DECIMAL(10,2)))
            WHEN ${metric} = 'conversion' THEN AVG(${creatorPerformance.conversionRate})
            ELSE AVG(${creatorPerformance.engagementScore})
          END
        `,
      })
      .from(creatorPerformance)
      .innerJoin(creators, eq(creatorPerformance.creatorId, creators.id))
      .where(
        between(creatorPerformance.createdAt, period.start, period.end)
      )
      .groupBy(creatorPerformance.creatorId, creators.name, creators.tier)
      .orderBy(orderColumn)
      .limit(limit);

    return results.map((r, index) => ({
      ...r,
      rank: index + 1,
    }));
  }

  /**
   * Calculate engagement score
   */
  private static calculateEngagementScore(show: any): number {
    const viewers = show.totalViewers || 0;
    const orders = show.totalOrders || 0;
    const conversionRate = show.conversionRate || 0;

    // Weighted score: 40% conversion, 30% orders per viewer, 30% absolute orders
    const conversionScore = conversionRate * 40;
    const ordersPerViewerScore = viewers > 0 ? (orders / viewers) * 100 * 30 : 0;
    const absoluteOrdersScore = Math.min(orders / 10, 30); // Cap at 30

    return conversionScore + ordersPerViewerScore + absoluteOrdersScore;
  }

  /**
   * Update creator aggregates
   */
  private static async updateCreatorAggregates(creatorId: string): Promise<void> {
    const metrics = await CreatorTierManager.getCreatorMetrics(creatorId);

    await db
      .update(creators)
      .set({
        totalShows: metrics.totalShows,
        totalRevenue: metrics.totalRevenue.toString(),
        avgViewers: Math.floor(metrics.avgViewers),
        avgConversionRate: metrics.avgConversionRate,
        updatedAt: new Date(),
      })
      .where(eq(creators.id, creatorId));
  }
}

// ============================================================================
// CREATOR TRAINING SYSTEM
// ============================================================================

export class CreatorTrainingSystem {
  /**
   * Assign training module
   */
  static async assignTraining(
    creatorId: string,
    moduleId: string,
    title: string,
    content: string,
    dueDate?: Date
  ): Promise<string> {
    const trainingId = ulid();

    await db.insert(creatorTraining).values({
      id: trainingId,
      creatorId,
      moduleId,
      title,
      content,
      status: "NOT_STARTED",
      dueDate,
      createdAt: new Date(),
    });

    return trainingId;
  }

  /**
   * Complete training module
   */
  static async completeTraining(trainingId: string, score?: number): Promise<void> {
    await db
      .update(creatorTraining)
      .set({
        status: "COMPLETED",
        completedAt: new Date(),
        score,
      })
      .where(eq(creatorTraining.id, trainingId));
  }

  /**
   * Get training progress
   */
  static async getTrainingProgress(creatorId: string): Promise<{
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    completionRate: number;
  }> {
    const training = await db.query.creatorTraining.findMany({
      where: eq(creatorTraining.creatorId, creatorId),
    });

    const total = training.length;
    const completed = training.filter((t) => t.status === "COMPLETED").length;
    const inProgress = training.filter((t) => t.status === "IN_PROGRESS").length;
    const notStarted = training.filter((t) => t.status === "NOT_STARTED").length;

    return {
      total,
      completed,
      inProgress,
      notStarted,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const creatorEconomy = {
  CreatorTierManager,
  IncentiveCalculator,
  ScheduleGridManager,
  CreatorPerformanceTracker,
  CreatorTrainingSystem,
  TIER_CONFIGS,
};
