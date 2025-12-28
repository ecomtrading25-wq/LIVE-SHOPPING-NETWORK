/**
 * Creator Management Service
 * Handles creator scheduling, performance tracking, and profit-based incentives
 */

import { getDbSync } from './db';
const db = getDbSync();
import {
  creators,
  broadcastChannels,
  scheduleSlots,
  creatorAvailability,
  creatorIncentiveTiers,
  creatorPayoutBatches as creatorBonuses,
  creatorPayoutLines as creatorPayouts,
  liveShows
} from '../drizzle/schema';
import { eq, and, desc, gte, lte, between, sql } from 'drizzle-orm';

export type CreatorTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'COMPLETED' | 'CANCELED';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'HELD';

export interface CreatorProfile {
  creatorId: string;
  channelId: string;
  userId: string;
  displayName: string;
  tier: CreatorTier;
  commissionRateBps: number; // basis points (100 = 1%)
  totalShowsCompleted: number;
  totalRevenueCents: number;
  totalCommissionCents: number;
  avgViewersPerShow: number;
  avgRevenuePerShow: number;
  performanceScore: number;
  isActive: boolean;
}

export interface BroadcastChannel {
  channelId: string;
  name: string;
  description?: string;
  isPrimeTime: boolean;
  sortOrder: number;
}

export interface ScheduleSlot {
  slotId: string;
  broadcastChannelId: string;
  startTime: Date;
  endTime: Date;
  creatorId?: string;
  showId?: string;
  status: SlotStatus;
  isRecurring: boolean;
  recurringPattern?: string;
}

export interface CreatorIncentive {
  tierId: string;
  tier: CreatorTier;
  minRevenueCents: number;
  commissionRateBps: number;
  bonusPerShowCents: number;
  primeTimeMultiplier: number;
}

export interface CreatorBonus {
  bonusId: string;
  creatorId: string;
  type: 'PERFORMANCE' | 'MILESTONE' | 'REFERRAL' | 'SPECIAL';
  amountCents: number;
  reason: string;
  periodStart: Date;
  periodEnd: Date;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CLAWED_BACK';
}

/**
 * Calculate creator tier based on performance
 */
export function calculateCreatorTier(totalRevenueCents: number, showsCompleted: number): CreatorTier {
  if (totalRevenueCents >= 100000000 && showsCompleted >= 100) return 'DIAMOND'; // $1M+
  if (totalRevenueCents >= 50000000 && showsCompleted >= 50) return 'PLATINUM'; // $500K+
  if (totalRevenueCents >= 20000000 && showsCompleted >= 25) return 'GOLD'; // $200K+
  if (totalRevenueCents >= 5000000 && showsCompleted >= 10) return 'SILVER'; // $50K+
  return 'BRONZE';
}

/**
 * Get commission rate for tier
 */
export function getCommissionRateForTier(tier: CreatorTier): number {
  const rates: Record<CreatorTier, number> = {
    'BRONZE': 1000, // 10%
    'SILVER': 1200, // 12%
    'GOLD': 1500, // 15%
    'PLATINUM': 1800, // 18%
    'DIAMOND': 2000 // 20%
  };
  return rates[tier];
}

/**
 * Update creator tier and commission rate
 */
export async function updateCreatorTier(
  channelId: string,
  creatorId: string
): Promise<void> {
  const creator = await db.query.creators.findFirst({
    where: and(
      eq(creators.creatorId, creatorId),
      eq(creators.channelId, channelId)
    )
  });

  if (!creator) {
    throw new Error('Creator not found');
  }

  const newTier = calculateCreatorTier(creator.totalRevenueCents, creator.totalShowsCompleted);
  const newCommissionRate = getCommissionRateForTier(newTier);

  if (newTier !== creator.tier || newCommissionRate !== creator.commissionRateBps) {
    await db.update(creators)
      .set({
        tier: newTier,
        commissionRateBps: newCommissionRate,
        updatedAt: new Date()
      })
      .where(eq(creators.creatorId, creatorId));

    console.log(`Creator ${creatorId} tier updated: ${creator.tier} → ${newTier}`);
  }
}

/**
 * Calculate creator commission for a show
 */
export async function calculateShowCommission(
  channelId: string,
  showId: string
): Promise<{
  creatorId: string;
  revenueCents: number;
  commissionCents: number;
  bonusCents: number;
  totalCents: number;
}> {
  const show = await db.query.liveShows.findFirst({
    where: and(
      eq(liveShows.showId, showId),
      eq(liveShows.channelId, channelId)
    ),
    with: {
      creator: true,
      broadcastChannel: true
    }
  });

  if (!show || !show.creator) {
    throw new Error('Show or creator not found');
  }

  const creator = show.creator;
  const revenueCents = show.totalRevenueCents;
  
  // Base commission
  let commissionCents = Math.floor((revenueCents * creator.commissionRateBps) / 10000);

  // Prime time multiplier
  let bonusCents = 0;
  if (show.broadcastChannel?.isPrimeTime) {
    const primeTimeBonus = Math.floor(commissionCents * 0.2); // 20% bonus for prime time
    bonusCents += primeTimeBonus;
  }

  // Performance bonus (if revenue exceeds average by 50%+)
  if (creator.avgRevenuePerShow > 0 && revenueCents >= creator.avgRevenuePerShow * 1.5) {
    const performanceBonus = Math.floor(commissionCents * 0.15); // 15% bonus
    bonusCents += performanceBonus;
  }

  const totalCents = commissionCents + bonusCents;

  return {
    creatorId: creator.creatorId,
    revenueCents,
    commissionCents,
    bonusCents,
    totalCents
  };
}

/**
 * Process creator payout for completed shows
 */
export async function processCreatorPayout(
  channelId: string,
  creatorId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{
  payoutId: string;
  totalCents: number;
  showCount: number;
}> {
  // Get all completed shows in period
  const shows = await db.query.liveShows.findMany({
    where: and(
      eq(liveShows.channelId, channelId),
      eq(liveShows.creatorId, creatorId),
      eq(liveShows.status, 'ENDED'),
      gte(liveShows.actualEndAt, periodStart),
      lte(liveShows.actualEndAt, periodEnd)
    )
  });

  let totalCommissionCents = 0;
  let totalBonusCents = 0;

  // Calculate commission for each show
  for (const show of shows) {
    const commission = await calculateShowCommission(channelId, show.showId);
    totalCommissionCents += commission.commissionCents;
    totalBonusCents += commission.bonusCents;
  }

  // Get approved bonuses for period
  const bonuses = await db.query.creatorBonuses.findMany({
    where: and(
      eq(creatorBonuses.creatorId, creatorId),
      eq(creatorBonuses.status, 'APPROVED'),
      gte(creatorBonuses.periodStart, periodStart),
      lte(creatorBonuses.periodEnd, periodEnd)
    )
  });

  const bonusTotal = bonuses.reduce((sum, bonus) => sum + bonus.amountCents, 0);

  const totalCents = totalCommissionCents + totalBonusCents + bonusTotal;

  // Create payout record
  const [payout] = await db.insert(creatorPayouts).values({
    channelId,
    creatorId,
    periodStart,
    periodEnd,
    showCount: shows.length,
    commissionCents: totalCommissionCents,
    bonusCents: totalBonusCents + bonusTotal,
    totalCents,
    status: 'PENDING'
  }).returning();

  // Mark bonuses as paid
  for (const bonus of bonuses) {
    await db.update(creatorBonuses)
      .set({ status: 'PAID' })
      .where(eq(creatorBonuses.bonusId, bonus.bonusId));
  }

  return {
    payoutId: payout.payoutId,
    totalCents,
    showCount: shows.length
  };
}

/**
 * Award bonus to creator
 */
export async function awardCreatorBonus(
  channelId: string,
  creatorId: string,
  type: CreatorBonus['type'],
  amountCents: number,
  reason: string,
  periodStart: Date,
  periodEnd: Date
): Promise<CreatorBonus> {
  const [bonus] = await db.insert(creatorBonuses).values({
    channelId,
    creatorId,
    type,
    amountCents,
    reason,
    periodStart,
    periodEnd,
    status: 'PENDING'
  }).returning();

  return bonus as CreatorBonus;
}

/**
 * Clawback bonus (for policy violations, etc.)
 */
export async function clawbackBonus(
  bonusId: string,
  reason: string
): Promise<void> {
  await db.update(creatorBonuses)
    .set({
      status: 'CLAWED_BACK',
      reason: reason
    })
    .where(eq(creatorBonuses.bonusId, bonusId));
}

/**
 * Get available schedule slots
 */
export async function getAvailableSlots(
  channelId: string,
  startDate: Date,
  endDate: Date
): Promise<ScheduleSlot[]> {
  const slots = await db.query.scheduleSlots.findMany({
    where: and(
      eq(scheduleSlots.channelId, channelId),
      eq(scheduleSlots.status, 'AVAILABLE'),
      gte(scheduleSlots.startTime, startDate),
      lte(scheduleSlots.startTime, endDate)
    ),
    with: {
      broadcastChannel: true
    },
    orderBy: desc(scheduleSlots.startTime)
  });

  return slots as ScheduleSlot[];
}

/**
 * Book a schedule slot for creator
 */
export async function bookScheduleSlot(
  channelId: string,
  slotId: string,
  creatorId: string
): Promise<ScheduleSlot> {
  const slot = await db.query.scheduleSlots.findFirst({
    where: and(
      eq(scheduleSlots.slotId, slotId),
      eq(scheduleSlots.channelId, channelId)
    )
  });

  if (!slot) {
    throw new Error('Slot not found');
  }

  if (slot.status !== 'AVAILABLE') {
    throw new Error('Slot is not available');
  }

  // Check creator availability
  const availability = await db.query.creatorAvailability.findFirst({
    where: and(
      eq(creatorAvailability.creatorId, creatorId),
      eq(creatorAvailability.channelId, channelId),
      lte(creatorAvailability.startTime, slot.startTime),
      gte(creatorAvailability.endTime, slot.endTime),
      eq(creatorAvailability.isAvailable, true)
    )
  });

  if (!availability) {
    throw new Error('Creator is not available for this slot');
  }

  // Book the slot
  const [updatedSlot] = await db.update(scheduleSlots)
    .set({
      creatorId,
      status: 'BOOKED',
      updatedAt: new Date()
    })
    .where(eq(scheduleSlots.slotId, slotId))
    .returning();

  return updatedSlot as ScheduleSlot;
}

/**
 * Auto-fill schedule with available creators
 * Prioritizes high-performing creators for prime time slots
 */
export async function autoFillSchedule(
  channelId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  filled: number;
  skipped: number;
}> {
  // Get available slots
  const slots = await getAvailableSlots(channelId, startDate, endDate);

  // Get active creators sorted by performance
  const activeCreators = await db.query.creators.findMany({
    where: and(
      eq(creators.channelId, channelId),
      eq(creators.isActive, true)
    ),
    orderBy: desc(creators.performanceScore)
  });

  let filled = 0;
  let skipped = 0;

  for (const slot of slots) {
    // For prime time slots, prefer top performers
    const candidateCreators = slot.broadcastChannel?.isPrimeTime
      ? activeCreators.filter(c => c.tier === 'DIAMOND' || c.tier === 'PLATINUM')
      : activeCreators;

    let slotFilled = false;

    for (const creator of candidateCreators) {
      try {
        // Check if creator is available
        const availability = await db.query.creatorAvailability.findFirst({
          where: and(
            eq(creatorAvailability.creatorId, creator.creatorId),
            eq(creatorAvailability.channelId, channelId),
            lte(creatorAvailability.startTime, slot.startTime),
            gte(creatorAvailability.endTime, slot.endTime),
            eq(creatorAvailability.isAvailable, true)
          )
        });

        if (availability) {
          // Book the slot
          await bookScheduleSlot(channelId, slot.slotId, creator.creatorId);
          filled++;
          slotFilled = true;
          break;
        }
      } catch (error) {
        console.error(`Error booking slot ${slot.slotId} for creator ${creator.creatorId}:`, error);
      }
    }

    if (!slotFilled) {
      skipped++;
    }
  }

  return { filled, skipped };
}

/**
 * Set creator availability
 */
export async function setCreatorAvailability(
  channelId: string,
  creatorId: string,
  startTime: Date,
  endTime: Date,
  isAvailable: boolean,
  isRecurring: boolean = false,
  recurringPattern?: string
): Promise<void> {
  await db.insert(creatorAvailability).values({
    channelId,
    creatorId,
    startTime,
    endTime,
    isAvailable,
    isRecurring,
    recurringPattern: recurringPattern || null
  });
}

/**
 * Update creator performance metrics after show
 */
export async function updateCreatorPerformance(
  channelId: string,
  creatorId: string,
  showId: string
): Promise<void> {
  const creator = await db.query.creators.findFirst({
    where: and(
      eq(creators.creatorId, creatorId),
      eq(creators.channelId, channelId)
    )
  });

  if (!creator) {
    throw new Error('Creator not found');
  }

  const show = await db.query.liveShows.findFirst({
    where: eq(liveShows.showId, showId)
  });

  if (!show) {
    throw new Error('Show not found');
  }

  // Calculate new averages
  const totalShows = creator.totalShowsCompleted + 1;
  const newTotalRevenue = creator.totalRevenueCents + show.totalRevenueCents;
  const newAvgViewers = Math.floor(
    ((creator.avgViewersPerShow * creator.totalShowsCompleted) + show.peakViewerCount) / totalShows
  );
  const newAvgRevenue = Math.floor(newTotalRevenue / totalShows);

  // Calculate performance score (0-100)
  // Factors: conversion rate, revenue per viewer, consistency
  const conversionRate = show.viewerCount > 0 ? (show.totalOrders / show.viewerCount) * 100 : 0;
  const revenuePerViewer = show.peakViewerCount > 0 ? show.totalRevenueCents / show.peakViewerCount : 0;
  
  const performanceScore = Math.min(100, Math.floor(
    (conversionRate * 30) + // 30% weight on conversion
    (Math.min(revenuePerViewer / 1000, 50)) + // 50% weight on revenue per viewer (capped)
    (totalShows >= 10 ? 20 : (totalShows * 2)) // 20% weight on consistency
  ));

  // Update creator
  await db.update(creators)
    .set({
      totalShowsCompleted: totalShows,
      totalRevenueCents: newTotalRevenue,
      avgViewersPerShow: newAvgViewers,
      avgRevenuePerShow: newAvgRevenue,
      performanceScore,
      updatedAt: new Date()
    })
    .where(eq(creators.creatorId, creatorId));

  // Update tier if needed
  await updateCreatorTier(channelId, creatorId);
}

/**
 * Get creator leaderboard
 */
export async function getCreatorLeaderboard(
  channelId: string,
  metric: 'revenue' | 'shows' | 'performance' | 'viewers' = 'revenue',
  limit: number = 10
) {
  const orderByMap = {
    revenue: desc(creators.totalRevenueCents),
    shows: desc(creators.totalShowsCompleted),
    performance: desc(creators.performanceScore),
    viewers: desc(creators.avgViewersPerShow)
  };

  const topCreators = await db.query.creators.findMany({
    where: and(
      eq(creators.channelId, channelId),
      eq(creators.isActive, true)
    ),
    orderBy: orderByMap[metric],
    limit
  });

  return topCreators.map((creator, index) => ({
    rank: index + 1,
    creatorId: creator.creatorId,
    displayName: creator.displayName,
    tier: creator.tier,
    totalRevenueCents: creator.totalRevenueCents,
    totalShowsCompleted: creator.totalShowsCompleted,
    avgViewersPerShow: creator.avgViewersPerShow,
    avgRevenuePerShow: creator.avgRevenuePerShow,
    performanceScore: creator.performanceScore
  }));
}

/**
 * Get creator earnings summary
 */
export async function getCreatorEarnings(
  channelId: string,
  creatorId: string,
  periodStart: Date,
  periodEnd: Date
) {
  // Get shows in period
  const shows = await db.query.liveShows.findMany({
    where: and(
      eq(liveShows.channelId, channelId),
      eq(liveShows.creatorId, creatorId),
      eq(liveShows.status, 'ENDED'),
      gte(liveShows.actualEndAt, periodStart),
      lte(liveShows.actualEndAt, periodEnd)
    )
  });

  let totalCommissionCents = 0;
  let totalBonusCents = 0;
  let totalRevenueCents = 0;

  for (const show of shows) {
    const commission = await calculateShowCommission(channelId, show.showId);
    totalCommissionCents += commission.commissionCents;
    totalBonusCents += commission.bonusCents;
    totalRevenueCents += commission.revenueCents;
  }

  // Get bonuses
  const bonuses = await db.query.creatorBonuses.findMany({
    where: and(
      eq(creatorBonuses.creatorId, creatorId),
      gte(creatorBonuses.periodStart, periodStart),
      lte(creatorBonuses.periodEnd, periodEnd)
    )
  });

  const approvedBonuses = bonuses.filter(b => b.status === 'APPROVED' || b.status === 'PAID');
  const bonusTotal = approvedBonuses.reduce((sum, b) => sum + b.amountCents, 0);

  // Get payouts
  const payouts = await db.query.creatorPayouts.findMany({
    where: and(
      eq(creatorPayouts.creatorId, creatorId),
      gte(creatorPayouts.periodStart, periodStart),
      lte(creatorPayouts.periodEnd, periodEnd)
    )
  });

  return {
    periodStart,
    periodEnd,
    showCount: shows.length,
    totalRevenueCents,
    totalCommissionCents,
    totalBonusCents: totalBonusCents + bonusTotal,
    totalEarningsCents: totalCommissionCents + totalBonusCents + bonusTotal,
    bonuses: approvedBonuses,
    payouts
  };
}
