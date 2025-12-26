/**
 * Customer Loyalty Gamification System
 * Badges, achievements, leaderboards, and challenges
 */

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  pointsReward: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
  reward: {
    points: number;
    badge?: string;
    discount?: number;
  };
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: "daily" | "weekly" | "monthly";
  startDate: Date;
  endDate: Date;
  progress: number;
  target: number;
  reward: {
    points: number;
    multiplier?: number;
  };
}

/**
 * Badge Definitions
 */
export const BADGES: Record<string, Badge> = {
  first_purchase: {
    id: "first_purchase",
    name: "First Purchase",
    description: "Made your first purchase",
    icon: "🎉",
    rarity: "common",
    pointsReward: 100,
  },
  early_bird: {
    id: "early_bird",
    name: "Early Bird",
    description: "Purchased within first hour of live show",
    icon: "🐦",
    rarity: "rare",
    pointsReward: 250,
  },
  vip_shopper: {
    id: "vip_shopper",
    name: "VIP Shopper",
    description: "Spent over $1,000 total",
    icon: "👑",
    rarity: "epic",
    pointsReward: 500,
  },
  review_master: {
    id: "review_master",
    name: "Review Master",
    description: "Left 50+ product reviews",
    icon: "⭐",
    rarity: "rare",
    pointsReward: 300,
  },
  social_butterfly: {
    id: "social_butterfly",
    name: "Social Butterfly",
    description: "Shared 20+ products on social media",
    icon: "🦋",
    rarity: "rare",
    pointsReward: 200,
  },
  referral_champion: {
    id: "referral_champion",
    name: "Referral Champion",
    description: "Referred 10+ friends who made purchases",
    icon: "🏆",
    rarity: "epic",
    pointsReward: 1000,
  },
  flash_hunter: {
    id: "flash_hunter",
    name: "Flash Hunter",
    description: "Purchased 10+ flash sale items",
    icon: "⚡",
    rarity: "rare",
    pointsReward: 300,
  },
  live_legend: {
    id: "live_legend",
    name: "Live Legend",
    description: "Attended 100+ live shopping sessions",
    icon: "🎥",
    rarity: "legendary",
    pointsReward: 2000,
  },
  collection_complete: {
    id: "collection_complete",
    name: "Collection Complete",
    description: "Purchased all items from a collection",
    icon: "💎",
    rarity: "epic",
    pointsReward: 750,
  },
  streak_master: {
    id: "streak_master",
    name: "Streak Master",
    description: "30-day purchase streak",
    icon: "🔥",
    rarity: "legendary",
    pointsReward: 1500,
  },
};

/**
 * Check and Award Badges
 */
export async function checkAndAwardBadges(
  userId: string,
  action: string,
  metadata?: Record<string, any>
): Promise<Badge[]> {
  const awardedBadges: Badge[] = [];

  // First Purchase
  if (action === "first_purchase") {
    awardedBadges.push(BADGES.first_purchase);
  }

  // Early Bird (purchased within 1 hour of live show start)
  if (action === "purchase" && metadata?.minutesSinceShowStart && metadata.minutesSinceShowStart < 60) {
    awardedBadges.push(BADGES.early_bird);
  }

  // VIP Shopper (total spend > $1000)
  if (action === "purchase" && metadata?.totalSpend && metadata.totalSpend > 1000) {
    awardedBadges.push(BADGES.vip_shopper);
  }

  // Review Master (50+ reviews)
  if (action === "review" && metadata?.totalReviews && metadata.totalReviews >= 50) {
    awardedBadges.push(BADGES.review_master);
  }

  // Social Butterfly (20+ shares)
  if (action === "share" && metadata?.totalShares && metadata.totalShares >= 20) {
    awardedBadges.push(BADGES.social_butterfly);
  }

  // Referral Champion (10+ successful referrals)
  if (action === "referral" && metadata?.successfulReferrals && metadata.successfulReferrals >= 10) {
    awardedBadges.push(BADGES.referral_champion);
  }

  // Flash Hunter (10+ flash sale purchases)
  if (action === "flash_purchase" && metadata?.flashPurchases && metadata.flashPurchases >= 10) {
    awardedBadges.push(BADGES.flash_hunter);
  }

  // Live Legend (100+ live sessions attended)
  if (action === "live_attendance" && metadata?.sessionsAttended && metadata.sessionsAttended >= 100) {
    awardedBadges.push(BADGES.live_legend);
  }

  // Collection Complete
  if (action === "collection_complete") {
    awardedBadges.push(BADGES.collection_complete);
  }

  // Streak Master (30-day streak)
  if (action === "streak" && metadata?.streakDays && metadata.streakDays >= 30) {
    awardedBadges.push(BADGES.streak_master);
  }

  console.log(`[Gamification] Awarded ${awardedBadges.length} badges to user ${userId}`);
  return awardedBadges;
}

/**
 * Get User Achievements
 */
export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  // Mock data - in production, fetch from database
  return [
    {
      id: "spend_1000",
      name: "Big Spender",
      description: "Spend $1,000 total",
      progress: 750,
      target: 1000,
      completed: false,
      reward: { points: 500, badge: "vip_shopper" },
    },
    {
      id: "reviews_50",
      name: "Review Guru",
      description: "Leave 50 product reviews",
      progress: 32,
      target: 50,
      completed: false,
      reward: { points: 300, badge: "review_master" },
    },
    {
      id: "referrals_10",
      name: "Friend Magnet",
      description: "Refer 10 friends",
      progress: 6,
      target: 10,
      completed: false,
      reward: { points: 1000, badge: "referral_champion", discount: 20 },
    },
    {
      id: "live_sessions_100",
      name: "Live Enthusiast",
      description: "Attend 100 live sessions",
      progress: 67,
      target: 100,
      completed: false,
      reward: { points: 2000, badge: "live_legend" },
    },
    {
      id: "first_purchase",
      name: "Welcome Aboard",
      description: "Make your first purchase",
      progress: 1,
      target: 1,
      completed: true,
      reward: { points: 100, badge: "first_purchase" },
    },
  ];
}

/**
 * Get Active Challenges
 */
export async function getActiveChallenges(userId: string): Promise<Challenge[]> {
  const now = new Date();
  
  return [
    {
      id: "daily_login",
      name: "Daily Login",
      description: "Log in today to earn bonus points",
      type: "daily",
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
      progress: 1,
      target: 1,
      reward: { points: 50 },
    },
    {
      id: "weekly_purchase",
      name: "Weekly Shopper",
      description: "Make 3 purchases this week",
      type: "weekly",
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 6, 23, 59, 59),
      progress: 1,
      target: 3,
      reward: { points: 300, multiplier: 1.5 },
    },
    {
      id: "monthly_reviews",
      name: "Review Marathon",
      description: "Leave 10 reviews this month",
      type: "monthly",
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      progress: 4,
      target: 10,
      reward: { points: 1000, multiplier: 2 },
    },
    {
      id: "flash_sale_hunter",
      name: "Flash Sale Hunter",
      description: "Purchase 5 flash sale items this week",
      type: "weekly",
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()),
      endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 6, 23, 59, 59),
      progress: 2,
      target: 5,
      reward: { points: 500 },
    },
  ];
}

/**
 * Get Leaderboard
 */
export async function getLeaderboard(
  type: "points" | "purchases" | "referrals" | "reviews",
  limit: number = 100
) {
  // Mock data - in production, fetch from database
  const leaderboards = {
    points: [
      { rank: 1, userId: "user_1", name: "Sarah Chen", value: 45230, avatar: "👑" },
      { rank: 2, userId: "user_2", name: "Mike Johnson", value: 38950, avatar: "🏆" },
      { rank: 3, userId: "user_3", name: "Emily Davis", value: 34120, avatar: "🥉" },
      { rank: 4, userId: "user_4", name: "Alex Kim", value: 29870, avatar: "⭐" },
      { rank: 5, userId: "user_5", name: "Jessica Lee", value: 27540, avatar: "💎" },
    ],
    purchases: [
      { rank: 1, userId: "user_1", name: "Sarah Chen", value: 234, avatar: "🛍️" },
      { rank: 2, userId: "user_2", name: "Mike Johnson", value: 198, avatar: "🛒" },
      { rank: 3, userId: "user_3", name: "Emily Davis", value: 176, avatar: "💳" },
    ],
    referrals: [
      { rank: 1, userId: "user_1", name: "Sarah Chen", value: 47, avatar: "🎯" },
      { rank: 2, userId: "user_2", name: "Mike Johnson", value: 39, avatar: "🎪" },
      { rank: 3, userId: "user_3", name: "Emily Davis", value: 32, avatar: "🎨" },
    ],
    reviews: [
      { rank: 1, userId: "user_1", name: "Sarah Chen", value: 128, avatar: "✍️" },
      { rank: 2, userId: "user_2", name: "Mike Johnson", value: 94, avatar: "📝" },
      { rank: 3, userId: "user_3", name: "Emily Davis", value: 87, avatar: "⭐" },
    ],
  };

  return leaderboards[type].slice(0, limit);
}

/**
 * Award Points
 */
export async function awardPoints(
  userId: string,
  points: number,
  reason: string,
  multiplier: number = 1
) {
  const finalPoints = Math.floor(points * multiplier);
  
  console.log(`[Gamification] Awarded ${finalPoints} points to user ${userId} for: ${reason}`);
  
  return {
    pointsAwarded: finalPoints,
    newTotal: 5430 + finalPoints, // Mock total
    multiplier,
  };
}

/**
 * Calculate Streak
 */
export async function calculateStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  lastActivity: Date;
}> {
  // Mock data - in production, calculate from database
  return {
    currentStreak: 7,
    longestStreak: 23,
    lastActivity: new Date(),
  };
}

/**
 * Get Points Breakdown
 */
export async function getPointsBreakdown(userId: string) {
  return {
    total: 5430,
    breakdown: [
      { source: "Purchases", points: 3200, percentage: 58.9 },
      { source: "Reviews", points: 980, percentage: 18.0 },
      { source: "Referrals", points: 750, percentage: 13.8 },
      { source: "Social Shares", points: 320, percentage: 5.9 },
      { source: "Daily Login", points: 180, percentage: 3.3 },
    ],
  };
}

/**
 * Redeem Reward
 */
export async function redeemReward(
  userId: string,
  rewardId: string,
  pointsCost: number
) {
  console.log(`[Gamification] User ${userId} redeemed reward ${rewardId} for ${pointsCost} points`);
  
  return {
    success: true,
    newBalance: 5430 - pointsCost,
    reward: {
      id: rewardId,
      type: "discount",
      value: 10,
      code: `REWARD${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  };
}
