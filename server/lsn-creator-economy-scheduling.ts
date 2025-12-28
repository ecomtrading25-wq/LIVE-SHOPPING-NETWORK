/**
 * LSN CREATOR ECONOMY & SCHEDULING SYSTEM
 * Complete 24/7 broadcast management and creator incentive platform
 * 
 * Features:
 * - 24/7 broadcast grid scheduler with conflict detection
 * - Creator tier system with performance-based advancement
 * - Automated payout calculation with fraud holds
 * - Performance tracking and analytics
 * - Live show segment management
 * - Commission structure automation
 * - Creator recruitment and onboarding
 */

import { getDbSync } from "./db";
import { 
  creators,
  creatorTiers,
  liveShows,
  products,
  orders
} from "../drizzle/schema";
import { eq, and, gte, lte, desc, sql, between, inArray } from "drizzle-orm";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CreatorOnboardingData {
  userId: number;
  stageName: string;
  bio: string;
  socialMedia: {
    tiktok?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
  };
  niches: string[]; // ["beauty", "tech", "fashion", "home"]
  languages: string[];
  timezone: string;
  availableHours: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
    saturday: string[];
    sunday: string[];
  };
  equipment: {
    camera: string;
    microphone: string;
    lighting: string;
    internet: string; // "fiber", "cable", "5g"
  };
}

export interface BroadcastScheduleData {
  creatorId: number;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  productIds: number[];
  targetRevenue: number;
  isRecurring: boolean;
  recurrencePattern?: "daily" | "weekly" | "biweekly" | "monthly";
}

export interface ShowSegmentData {
  showId: number;
  segmentType: "intro" | "product_demo" | "qa" | "flash_sale" | "outro";
  startTime: string;
  durationMinutes: number;
  productId?: number;
  script?: string;
  specialOffer?: string;
}

export interface PayoutCalculation {
  creatorId: number;
  periodStart: Date;
  periodEnd: Date;
  baseSales: number;
  commission: number;
  bonuses: number;
  penalties: number;
  netPayout: number;
  status: "pending" | "approved" | "paid" | "held";
  holdReason?: string;
}

// ============================================================================
// CREATOR TIER SYSTEM
// ============================================================================

export const CREATOR_TIERS = {
  BRONZE: {
    name: "Bronze",
    minMonthlyRevenue: 0,
    commissionRate: 0.10, // 10%
    bonusThreshold: 5000,
    bonusAmount: 100,
    minShowsPerWeek: 3,
    maxConcurrentProducts: 5,
    prioritySupport: false,
  },
  SILVER: {
    name: "Silver",
    minMonthlyRevenue: 10000,
    commissionRate: 0.12, // 12%
    bonusThreshold: 15000,
    bonusAmount: 300,
    minShowsPerWeek: 4,
    maxConcurrentProducts: 10,
    prioritySupport: false,
  },
  GOLD: {
    name: "Gold",
    minMonthlyRevenue: 30000,
    commissionRate: 0.15, // 15%
    bonusThreshold: 50000,
    bonusAmount: 1000,
    minShowsPerWeek: 5,
    maxConcurrentProducts: 20,
    prioritySupport: true,
  },
  PLATINUM: {
    name: "Platinum",
    minMonthlyRevenue: 100000,
    commissionRate: 0.18, // 18%
    bonusThreshold: 150000,
    bonusAmount: 3000,
    minShowsPerWeek: 5,
    maxConcurrentProducts: 50,
    prioritySupport: true,
  },
  DIAMOND: {
    name: "Diamond",
    minMonthlyRevenue: 250000,
    commissionRate: 0.20, // 20%
    bonusThreshold: 500000,
    bonusAmount: 10000,
    minShowsPerWeek: 5,
    maxConcurrentProducts: 100,
    prioritySupport: true,
  },
};

/**
 * Onboard new creator with initial tier assignment
 */
export async function onboardCreator(data: CreatorOnboardingData) {
  const db = getDbSync();
  
  const [creator] = await db.insert(creators).values({
    userId: data.userId,
    stageName: data.stageName,
    bio: data.bio,
    socialMedia: JSON.stringify(data.socialMedia),
    niches: JSON.stringify(data.niches),
    languages: JSON.stringify(data.languages),
    timezone: data.timezone,
    availableHours: JSON.stringify(data.availableHours),
    equipment: JSON.stringify(data.equipment),
    tier: "bronze",
    status: "pending_approval",
    trustScore: 50, // Start at neutral
    createdAt: new Date(),
  }).returning();
  
  // Initialize performance tracking
  await db.insert(creatorPerformance).values({
    creatorId: creator.id,
    totalShows: 0,
    totalRevenue: 0,
    avgViewers: 0,
    conversionRate: 0,
    avgOrderValue: 0,
    noShowCount: 0,
    lateStartCount: 0,
    qualityScore: 100,
    lastEvaluationDate: new Date(),
  });
  
  return creator;
}

/**
 * Evaluate creator tier based on performance
 */
export async function evaluateCreatorTier(creatorId: number) {
  const db = getDbSync();
  
  // Get last 30 days performance
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const shows = await db
    .select()
    .from(liveShows)
    .where(
      and(
        eq(liveShows.creatorId, creatorId),
        gte(liveShows.startTime, thirtyDaysAgo)
      )
    );
  
  const monthlyRevenue = shows.reduce((sum, show) => sum + Number(show.revenue), 0);
  
  // Determine tier
  let newTier = "bronze";
  if (monthlyRevenue >= CREATOR_TIERS.DIAMOND.minMonthlyRevenue) {
    newTier = "diamond";
  } else if (monthlyRevenue >= CREATOR_TIERS.PLATINUM.minMonthlyRevenue) {
    newTier = "platinum";
  } else if (monthlyRevenue >= CREATOR_TIERS.GOLD.minMonthlyRevenue) {
    newTier = "gold";
  } else if (monthlyRevenue >= CREATOR_TIERS.SILVER.minMonthlyRevenue) {
    newTier = "silver";
  }
  
  await db
    .update(creators)
    .set({ tier: newTier })
    .where(eq(creators.id, creatorId));
  
  return {
    creatorId,
    monthlyRevenue,
    newTier,
    tierDetails: CREATOR_TIERS[newTier.toUpperCase() as keyof typeof CREATOR_TIERS],
  };
}

/**
 * Calculate creator trust score
 */
export async function updateCreatorTrustScore(creatorId: number) {
  const db = getDbSync();
  
  const [performance] = await db
    .select()
    .from(creatorPerformance)
    .where(eq(creatorPerformance.creatorId, creatorId));
  
  if (!performance) return;
  
  let trustScore = 50; // Base
  
  // Reliability (0-30 points)
  const reliabilityScore = 100 - (performance.noShowCount * 10 + performance.lateStartCount * 5);
  trustScore += (Math.max(0, reliabilityScore) / 100) * 30;
  
  // Quality (0-30 points)
  trustScore += (performance.qualityScore / 100) * 30;
  
  // Performance (0-20 points)
  if (performance.conversionRate >= 0.05) trustScore += 20;
  else if (performance.conversionRate >= 0.03) trustScore += 15;
  else if (performance.conversionRate >= 0.01) trustScore += 10;
  
  // Consistency (0-20 points)
  if (performance.totalShows >= 100) trustScore += 20;
  else if (performance.totalShows >= 50) trustScore += 15;
  else if (performance.totalShows >= 20) trustScore += 10;
  else if (performance.totalShows >= 10) trustScore += 5;
  
  trustScore = Math.max(0, Math.min(100, trustScore));
  
  await db
    .update(creators)
    .set({ trustScore })
    .where(eq(creators.id, creatorId));
  
  return trustScore;
}

// ============================================================================
// 24/7 BROADCAST SCHEDULING
// ============================================================================

/**
 * Check for scheduling conflicts
 */
export async function checkScheduleConflicts(
  creatorId: number,
  startTime: Date,
  endTime: Date,
  excludeScheduleId?: number
) {
  const db = getDbSync();
  
  let query = db
    .select()
    .from(broadcastSchedules)
    .where(
      and(
        eq(broadcastSchedules.creatorId, creatorId),
        eq(broadcastSchedules.status, "scheduled"),
        // Check for overlap
        sql`${broadcastSchedules.startTime} < ${endTime} AND ${broadcastSchedules.endTime} > ${startTime}`
      )
    );
  
  const conflicts = await query;
  
  // Filter out the schedule being updated
  const actualConflicts = excludeScheduleId
    ? conflicts.filter(c => c.id !== excludeScheduleId)
    : conflicts;
  
  return actualConflicts;
}

/**
 * Create broadcast schedule with conflict detection
 */
export async function createBroadcastSchedule(data: BroadcastScheduleData) {
  const db = getDbSync();
  
  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);
  
  // Check for conflicts
  const conflicts = await checkScheduleConflicts(data.creatorId, startTime, endTime);
  
  if (conflicts.length > 0) {
    throw new Error(`Schedule conflict detected with ${conflicts.length} existing show(s)`);
  }
  
  // Validate creator availability
  const [creator] = await db
    .select()
    .from(creators)
    .where(eq(creators.id, data.creatorId));
  
  if (!creator) {
    throw new Error("Creator not found");
  }
  
  const dayOfWeek = startTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const availableHours = JSON.parse(creator.availableHours as string);
  
  // Simple availability check (would be more sophisticated in production)
  if (!availableHours[dayOfWeek] || availableHours[dayOfWeek].length === 0) {
    console.warn(`Creator ${data.creatorId} scheduled outside preferred hours`);
  }
  
  const [schedule] = await db.insert(broadcastSchedules).values({
    creatorId: data.creatorId,
    startTime,
    endTime,
    title: data.title,
    description: data.description,
    productIds: JSON.stringify(data.productIds),
    targetRevenue: data.targetRevenue,
    status: "scheduled",
    isRecurring: data.isRecurring,
    recurrencePattern: data.recurrencePattern,
    createdAt: new Date(),
  }).returning();
  
  return schedule;
}

/**
 * Generate optimal broadcast schedule for 24/7 coverage
 */
export async function generateOptimal24x7Schedule(startDate: Date, endDate: Date) {
  const db = getDbSync();
  
  // Get all active creators
  const activeCreators = await db
    .select()
    .from(creators)
    .where(eq(creators.status, "active"));
  
  // Sort by trust score and tier
  const sortedCreators = activeCreators.sort((a, b) => {
    const tierOrder = { diamond: 5, platinum: 4, gold: 3, silver: 2, bronze: 1 };
    const tierA = tierOrder[a.tier as keyof typeof tierOrder] || 0;
    const tierB = tierOrder[b.tier as keyof typeof tierOrder] || 0;
    
    if (tierA !== tierB) return tierB - tierA;
    return b.trustScore - a.trustScore;
  });
  
  const schedules = [];
  let currentTime = new Date(startDate);
  
  // Generate 2-hour blocks
  while (currentTime < endDate) {
    const blockEnd = new Date(currentTime.getTime() + 2 * 60 * 60 * 1000);
    
    // Find best available creator for this time slot
    for (const creator of sortedCreators) {
      const conflicts = await checkScheduleConflicts(creator.id, currentTime, blockEnd);
      
      if (conflicts.length === 0) {
        // Check availability
        const dayOfWeek = currentTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const availableHours = JSON.parse(creator.availableHours as string);
        
        if (availableHours[dayOfWeek] && availableHours[dayOfWeek].length > 0) {
          schedules.push({
            creatorId: creator.id,
            creatorName: creator.stageName,
            startTime: new Date(currentTime),
            endTime: new Date(blockEnd),
            tier: creator.tier,
            trustScore: creator.trustScore,
          });
          break;
        }
      }
    }
    
    currentTime = blockEnd;
  }
  
  return {
    totalSlots: Math.ceil((endDate.getTime() - startDate.getTime()) / (2 * 60 * 60 * 1000)),
    filledSlots: schedules.length,
    coverage: (schedules.length / Math.ceil((endDate.getTime() - startDate.getTime()) / (2 * 60 * 60 * 1000))) * 100,
    schedules,
  };
}

// ============================================================================
// LIVE SHOW MANAGEMENT
// ============================================================================

/**
 * Start live show from scheduled broadcast
 */
export async function startLiveShow(scheduleId: number) {
  const db = getDbSync();
  
  const [schedule] = await db
    .select()
    .from(broadcastSchedules)
    .where(eq(broadcastSchedules.id, scheduleId));
  
  if (!schedule) {
    throw new Error("Schedule not found");
  }
  
  // Check if creator is late
  const now = new Date();
  const scheduledStart = new Date(schedule.startTime);
  const minutesLate = Math.floor((now.getTime() - scheduledStart.getTime()) / (60 * 1000));
  
  if (minutesLate > 5) {
    // Record late start
    await db
      .update(creatorPerformance)
      .set({
        lateStartCount: sql`${creatorPerformance.lateStartCount} + 1`,
      })
      .where(eq(creatorPerformance.creatorId, schedule.creatorId));
  }
  
  const [show] = await db.insert(liveShows).values({
    scheduleId: schedule.id,
    creatorId: schedule.creatorId,
    title: schedule.title,
    startTime: now,
    status: "live",
    currentViewers: 0,
    peakViewers: 0,
    totalOrders: 0,
    revenue: 0,
  }).returning();
  
  // Update schedule status
  await db
    .update(broadcastSchedules)
    .set({ status: "in_progress" })
    .where(eq(broadcastSchedules.id, scheduleId));
  
  return show;
}

/**
 * End live show and calculate metrics
 */
export async function endLiveShow(showId: number) {
  const db = getDbSync();
  
  const [show] = await db
    .select()
    .from(liveShows)
    .where(eq(liveShows.id, showId));
  
  if (!show) {
    throw new Error("Show not found");
  }
  
  const endTime = new Date();
  const durationMinutes = Math.floor((endTime.getTime() - show.startTime.getTime()) / (60 * 1000));
  
  // Get orders during show
  const showOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.showId, showId),
        between(orders.createdAt, show.startTime, endTime)
      )
    );
  
  const totalOrders = showOrders.length;
  const revenue = showOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;
  
  // Update show
  await db
    .update(liveShows)
    .set({
      endTime,
      durationMinutes,
      status: "completed",
      totalOrders,
      revenue,
    })
    .where(eq(liveShows.id, showId));
  
  // Update creator performance
  const [performance] = await db
    .select()
    .from(creatorPerformance)
    .where(eq(creatorPerformance.creatorId, show.creatorId));
  
  if (performance) {
    const newTotalShows = performance.totalShows + 1;
    const newTotalRevenue = Number(performance.totalRevenue) + revenue;
    const newAvgOrderValue = (Number(performance.avgOrderValue) * performance.totalShows + avgOrderValue) / newTotalShows;
    
    await db
      .update(creatorPerformance)
      .set({
        totalShows: newTotalShows,
        totalRevenue: newTotalRevenue,
        avgOrderValue: newAvgOrderValue,
        lastEvaluationDate: new Date(),
      })
      .where(eq(creatorPerformance.creatorId, show.creatorId));
  }
  
  // Update schedule status
  if (show.scheduleId) {
    await db
      .update(broadcastSchedules)
      .set({ status: "completed" })
      .where(eq(broadcastSchedules.id, show.scheduleId));
  }
  
  return {
    showId,
    durationMinutes,
    totalOrders,
    revenue,
    avgOrderValue,
    peakViewers: show.peakViewers,
  };
}

/**
 * Create show segment for structured broadcasting
 */
export async function createShowSegment(data: ShowSegmentData) {
  const db = getDbSync();
  
  const [segment] = await db.insert(showSegments).values({
    showId: data.showId,
    segmentType: data.segmentType,
    startTime: new Date(data.startTime),
    durationMinutes: data.durationMinutes,
    productId: data.productId,
    script: data.script,
    specialOffer: data.specialOffer,
    status: "scheduled",
  }).returning();
  
  return segment;
}

// ============================================================================
// PAYOUT AUTOMATION
// ============================================================================

/**
 * Calculate creator payout for period
 */
export async function calculateCreatorPayout(
  creatorId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<PayoutCalculation> {
  const db = getDbSync();
  
  const [creator] = await db
    .select()
    .from(creators)
    .where(eq(creators.id, creatorId));
  
  if (!creator) {
    throw new Error("Creator not found");
  }
  
  // Get shows in period
  const shows = await db
    .select()
    .from(liveShows)
    .where(
      and(
        eq(liveShows.creatorId, creatorId),
        gte(liveShows.startTime, periodStart),
        lte(liveShows.startTime, periodEnd),
        eq(liveShows.status, "completed")
      )
    );
  
  const baseSales = shows.reduce((sum, show) => sum + Number(show.revenue), 0);
  
  // Get tier details
  const tierKey = creator.tier.toUpperCase() as keyof typeof CREATOR_TIERS;
  const tierDetails = CREATOR_TIERS[tierKey];
  
  // Calculate commission
  const commission = baseSales * tierDetails.commissionRate;
  
  // Calculate bonuses
  let bonuses = 0;
  if (baseSales >= tierDetails.bonusThreshold) {
    bonuses += tierDetails.bonusAmount;
  }
  
  // Performance bonus (5% extra for quality score > 95)
  const [performance] = await db
    .select()
    .from(creatorPerformance)
    .where(eq(creatorPerformance.creatorId, creatorId));
  
  if (performance && performance.qualityScore >= 95) {
    bonuses += commission * 0.05;
  }
  
  // Calculate penalties
  let penalties = 0;
  if (performance) {
    // No-show penalty: $100 per no-show
    penalties += performance.noShowCount * 100;
    
    // Late start penalty: $25 per late start
    penalties += performance.lateStartCount * 25;
  }
  
  const netPayout = commission + bonuses - penalties;
  
  // Check for fraud holds
  let status: "pending" | "approved" | "paid" | "held" = "pending";
  let holdReason: string | undefined;
  
  if (creator.trustScore < 30) {
    status = "held";
    holdReason = "Low trust score - manual review required";
  } else if (performance && performance.noShowCount > 3) {
    status = "held";
    holdReason = "Excessive no-shows - manual review required";
  }
  
  return {
    creatorId,
    periodStart,
    periodEnd,
    baseSales,
    commission,
    bonuses,
    penalties,
    netPayout,
    status,
    holdReason,
  };
}

/**
 * Process all creator payouts for period
 */
export async function processAllCreatorPayouts(periodStart: Date, periodEnd: Date) {
  const db = getDbSync();
  
  const activeCreators = await db
    .select()
    .from(creators)
    .where(eq(creators.status, "active"));
  
  const payouts = [];
  
  for (const creator of activeCreators) {
    const payout = await calculateCreatorPayout(creator.id, periodStart, periodEnd);
    
    // Only create payout if there's revenue
    if (payout.baseSales > 0) {
      const [payoutRecord] = await db.insert(creatorPayouts).values({
        creatorId: creator.id,
        periodStart,
        periodEnd,
        baseSales: payout.baseSales,
        commission: payout.commission,
        bonuses: payout.bonuses,
        penalties: payout.penalties,
        netPayout: payout.netPayout,
        status: payout.status,
        holdReason: payout.holdReason,
        createdAt: new Date(),
      }).returning();
      
      payouts.push(payoutRecord);
    }
  }
  
  return {
    totalCreators: activeCreators.length,
    payoutsGenerated: payouts.length,
    totalPayout: payouts.reduce((sum, p) => sum + Number(p.netPayout), 0),
    heldPayouts: payouts.filter(p => p.status === "held").length,
  };
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

/**
 * Get creator performance dashboard
 */
export async function getCreatorDashboard(creatorId: number, days: number = 30) {
  const db = getDbSync();
  
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const [creator] = await db
    .select()
    .from(creators)
    .where(eq(creators.id, creatorId));
  
  const [performance] = await db
    .select()
    .from(creatorPerformance)
    .where(eq(creatorPerformance.creatorId, creatorId));
  
  const shows = await db
    .select()
    .from(liveShows)
    .where(
      and(
        eq(liveShows.creatorId, creatorId),
        gte(liveShows.startTime, startDate)
      )
    );
  
  const totalRevenue = shows.reduce((sum, show) => sum + Number(show.revenue), 0);
  const totalOrders = shows.reduce((sum, show) => sum + show.totalOrders, 0);
  const avgRevenue = shows.length > 0 ? totalRevenue / shows.length : 0;
  
  // Get tier details
  const tierKey = creator.tier.toUpperCase() as keyof typeof CREATOR_TIERS;
  const tierDetails = CREATOR_TIERS[tierKey];
  
  return {
    creator,
    performance,
    periodStats: {
      shows: shows.length,
      totalRevenue,
      totalOrders,
      avgRevenue,
      avgViewers: shows.reduce((sum, show) => sum + show.peakViewers, 0) / shows.length,
    },
    tier: {
      current: creator.tier,
      details: tierDetails,
      nextTier: getNextTier(creator.tier),
      progressToNext: calculateTierProgress(totalRevenue, creator.tier),
    },
    trustScore: creator.trustScore,
  };
}

function getNextTier(currentTier: string): string | null {
  const tiers = ["bronze", "silver", "gold", "platinum", "diamond"];
  const currentIndex = tiers.indexOf(currentTier);
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
}

function calculateTierProgress(revenue: number, currentTier: string): number {
  const nextTier = getNextTier(currentTier);
  if (!nextTier) return 100;
  
  const nextTierKey = nextTier.toUpperCase() as keyof typeof CREATOR_TIERS;
  const nextTierDetails = CREATOR_TIERS[nextTierKey];
  
  return Math.min(100, (revenue / nextTierDetails.minMonthlyRevenue) * 100);
}

export default {
  onboardCreator,
  evaluateCreatorTier,
  updateCreatorTrustScore,
  createBroadcastSchedule,
  checkScheduleConflicts,
  generateOptimal24x7Schedule,
  startLiveShow,
  endLiveShow,
  createShowSegment,
  calculateCreatorPayout,
  processAllCreatorPayouts,
  getCreatorDashboard,
};
