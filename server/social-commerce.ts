/**
 * SOCIAL COMMERCE SERVICE
 * User profiles, following system, activity feeds, and social sharing
 */

import { getDb } from './db';
import { users, products, orders } from '../drizzle/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';

/**
 * User profile data structure
 */
export interface UserProfile {
  userId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
  };
  stats: {
    followers: number;
    following: number;
    totalPurchases: number;
    totalReviews: number;
    wishlistItems: number;
  };
  badges: string[];
  joinedAt: Date;
  isVerified: boolean;
  isInfluencer: boolean;
}

/**
 * Activity feed item
 */
export interface ActivityItem {
  id: string;
  userId: string;
  type: 'purchase' | 'review' | 'wishlist' | 'follow' | 'share' | 'live_join';
  content: string;
  metadata: Record<string, any>;
  timestamp: Date;
  likes: number;
  comments: number;
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (!user) {
    return null;
  }

  // Get user stats (simplified - would aggregate from multiple tables)
  const stats = {
    followers: Math.floor(Math.random() * 1000),
    following: Math.floor(Math.random() * 500),
    totalPurchases: Math.floor(Math.random() * 50),
    totalReviews: Math.floor(Math.random() * 30),
    wishlistItems: Math.floor(Math.random() * 20),
  };

  // Determine badges
  const badges: string[] = [];
  if (stats.totalPurchases > 10) badges.push('Frequent Buyer');
  if (stats.totalReviews > 5) badges.push('Top Reviewer');
  if (stats.followers > 100) badges.push('Influencer');

  return {
    userId: user.id,
    username: user.email.split('@')[0],
    displayName: user.name || user.email.split('@')[0],
    bio: undefined,
    avatar: undefined,
    coverImage: undefined,
    location: undefined,
    website: undefined,
    socialLinks: undefined,
    stats,
    badges,
    joinedAt: user.createdAt,
    isVerified: false,
    isInfluencer: stats.followers > 100,
  };
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    displayName?: string;
    bio?: string;
    avatar?: string;
    coverImage?: string;
    location?: string;
    website?: string;
    socialLinks?: {
      instagram?: string;
      tiktok?: string;
      youtube?: string;
      twitter?: string;
    };
  }
): Promise<UserProfile> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Update user record (simplified - would use dedicated profile table)
  if (updates.displayName) {
    await db
      .update(users)
      .set({ name: updates.displayName })
      .where(eq(users.id, userId));
  }

  // Return updated profile
  const profile = await getUserProfile(userId);
  if (!profile) {
    throw new Error('Profile not found');
  }

  return profile;
}

/**
 * Follow a user
 */
export async function followUser(
  followerId: string,
  followingId: string
): Promise<{ success: boolean; followerCount: number }> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // In production, would insert into followers table
  // For now, simulate success

  const followerCount = Math.floor(Math.random() * 1000) + 1;

  // Create activity item
  await createActivityItem({
    userId: followerId,
    type: 'follow',
    content: `Started following a user`,
    metadata: { followingId },
  });

  return {
    success: true,
    followerCount,
  };
}

/**
 * Unfollow a user
 */
export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<{ success: boolean; followerCount: number }> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // In production, would delete from followers table
  const followerCount = Math.floor(Math.random() * 1000);

  return {
    success: true,
    followerCount,
  };
}

/**
 * Check if user is following another user
 */
export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // In production, would query followers table
  return Math.random() > 0.5;
}

/**
 * Get user's followers
 */
export async function getFollowers(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<Array<{ userId: string; username: string; avatar?: string; isVerified: boolean }>> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // In production, would query followers table and join with users
  const followers = [];
  for (let i = 0; i < Math.min(limit, 10); i++) {
    followers.push({
      userId: `user_${i}`,
      username: `user${i}`,
      avatar: undefined,
      isVerified: Math.random() > 0.8,
    });
  }

  return followers;
}

/**
 * Get users that a user is following
 */
export async function getFollowing(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<Array<{ userId: string; username: string; avatar?: string; isVerified: boolean }>> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Similar to getFollowers
  return getFollowers(userId, limit, offset);
}

/**
 * Create activity item
 */
export async function createActivityItem(data: {
  userId: string;
  type: ActivityItem['type'];
  content: string;
  metadata: Record<string, any>;
}): Promise<ActivityItem> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const activity: ActivityItem = {
    id: `activity_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    userId: data.userId,
    type: data.type,
    content: data.content,
    metadata: data.metadata,
    timestamp: new Date(),
    likes: 0,
    comments: 0,
  };

  // In production, would insert into activities table
  return activity;
}

/**
 * Get user's activity feed
 */
export async function getUserActivityFeed(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<ActivityItem[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // In production, would query activities table
  const activities: ActivityItem[] = [
    {
      id: 'act_1',
      userId,
      type: 'purchase',
      content: 'Purchased Wireless Headphones Pro',
      metadata: { productId: 'prod_1', amount: 299.99 },
      timestamp: new Date(Date.now() - 3600000),
      likes: 5,
      comments: 2,
    },
    {
      id: 'act_2',
      userId,
      type: 'review',
      content: 'Reviewed Smart Watch Ultra - 5 stars',
      metadata: { productId: 'prod_2', rating: 5 },
      timestamp: new Date(Date.now() - 7200000),
      likes: 12,
      comments: 4,
    },
    {
      id: 'act_3',
      userId,
      type: 'wishlist',
      content: 'Added Bluetooth Speaker to wishlist',
      metadata: { productId: 'prod_3' },
      timestamp: new Date(Date.now() - 86400000),
      likes: 3,
      comments: 0,
    },
  ];

  return activities.slice(offset, offset + limit);
}

/**
 * Get personalized feed (following + recommendations)
 */
export async function getPersonalizedFeed(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<ActivityItem[]> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // In production, would:
  // 1. Get list of users that userId follows
  // 2. Get their recent activities
  // 3. Mix with recommended activities based on interests
  // 4. Sort by relevance and recency

  const feed: ActivityItem[] = [
    {
      id: 'feed_1',
      userId: 'user_123',
      type: 'purchase',
      content: 'Sarah bought Wireless Headphones Pro',
      metadata: { productId: 'prod_1', username: 'Sarah' },
      timestamp: new Date(Date.now() - 1800000),
      likes: 15,
      comments: 3,
    },
    {
      id: 'feed_2',
      userId: 'user_456',
      type: 'live_join',
      content: 'Mike joined a live show: Tech Gadgets Showcase',
      metadata: { showId: 'show_1', username: 'Mike' },
      timestamp: new Date(Date.now() - 3600000),
      likes: 8,
      comments: 1,
    },
    {
      id: 'feed_3',
      userId: 'user_789',
      type: 'review',
      content: 'Emma reviewed Smart Watch Ultra - "Best purchase this year!"',
      metadata: { productId: 'prod_2', username: 'Emma', rating: 5 },
      timestamp: new Date(Date.now() - 5400000),
      likes: 23,
      comments: 7,
    },
  ];

  return feed.slice(offset, offset + limit);
}

/**
 * Like an activity
 */
export async function likeActivity(
  activityId: string,
  userId: string
): Promise<{ success: boolean; likeCount: number }> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // In production, would insert into activity_likes table
  const likeCount = Math.floor(Math.random() * 50) + 1;

  return {
    success: true,
    likeCount,
  };
}

/**
 * Comment on an activity
 */
export async function commentOnActivity(
  activityId: string,
  userId: string,
  content: string
): Promise<{
  commentId: string;
  content: string;
  userId: string;
  timestamp: Date;
}> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const comment = {
    commentId: `comment_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    content,
    userId,
    timestamp: new Date(),
  };

  // In production, would insert into activity_comments table
  return comment;
}

/**
 * Share product to social media
 */
export async function shareProduct(
  productId: string,
  userId: string,
  platform: 'facebook' | 'twitter' | 'instagram' | 'whatsapp' | 'email',
  message?: string
): Promise<{
  shareId: string;
  shareUrl: string;
  platform: string;
}> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const shareId = `share_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  
  // Get product details
  const [product] = await db.select().from(products).where(eq(products.id, productId));

  if (!product) {
    throw new Error('Product not found');
  }

  // Generate share URL with tracking
  const shareUrl = `https://shop.example.com/products/${productId}?share=${shareId}`;

  // Create activity item
  await createActivityItem({
    userId,
    type: 'share',
    content: `Shared ${product.name}`,
    metadata: { productId, platform, shareId },
  });

  // In production, would generate platform-specific share URLs
  return {
    shareId,
    shareUrl,
    platform,
  };
}

/**
 * Get trending products based on social activity
 */
export async function getTrendingProducts(
  limit: number = 10
): Promise<Array<{
  productId: string;
  productName: string;
  shares: number;
  likes: number;
  purchases: number;
  trendScore: number;
}>> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // In production, would aggregate from activities and calculate trend scores
  const trending = [
    {
      productId: 'prod_1',
      productName: 'Wireless Headphones Pro',
      shares: 234,
      likes: 1456,
      purchases: 89,
      trendScore: 95,
    },
    {
      productId: 'prod_2',
      productName: 'Smart Watch Ultra',
      shares: 189,
      likes: 1234,
      purchases: 67,
      trendScore: 88,
    },
    {
      productId: 'prod_3',
      productName: 'Bluetooth Speaker',
      shares: 156,
      likes: 987,
      purchases: 54,
      trendScore: 82,
    },
  ];

  return trending.slice(0, limit);
}

/**
 * Get user's social proof stats
 */
export async function getSocialProofStats(
  productId: string
): Promise<{
  totalPurchases: number;
  recentPurchases: Array<{
    username: string;
    location: string;
    timestamp: Date;
  }>;
  totalShares: number;
  totalReviews: number;
  averageRating: number;
  viewingNow: number;
}> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // In production, would aggregate real data
  return {
    totalPurchases: 1234,
    recentPurchases: [
      {
        username: 'Sarah M.',
        location: 'New York, NY',
        timestamp: new Date(Date.now() - 300000),
      },
      {
        username: 'Mike T.',
        location: 'Los Angeles, CA',
        timestamp: new Date(Date.now() - 600000),
      },
      {
        username: 'Emma R.',
        location: 'Chicago, IL',
        timestamp: new Date(Date.now() - 900000),
      },
    ],
    totalShares: 456,
    totalReviews: 234,
    averageRating: 4.7,
    viewingNow: 23,
  };
}

/**
 * Get influencer recommendations
 */
export async function getInfluencerRecommendations(
  userId: string,
  limit: number = 5
): Promise<Array<{
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  followers: number;
  bio?: string;
  isVerified: boolean;
  matchScore: number;
}>> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // In production, would use ML to find similar interests
  const recommendations = [
    {
      userId: 'inf_1',
      username: 'techreviewpro',
      displayName: 'Tech Review Pro',
      avatar: undefined,
      followers: 125000,
      bio: 'Tech enthusiast | Gadget reviewer | Daily tech tips',
      isVerified: true,
      matchScore: 95,
    },
    {
      userId: 'inf_2',
      username: 'gadgetguru',
      displayName: 'Gadget Guru',
      avatar: undefined,
      followers: 89000,
      bio: 'Unboxing the latest gadgets | Honest reviews',
      isVerified: true,
      matchScore: 88,
    },
  ];

  return recommendations.slice(0, limit);
}

/**
 * Create user collection (curated product list)
 */
export async function createCollection(
  userId: string,
  data: {
    name: string;
    description?: string;
    isPublic: boolean;
    productIds: string[];
  }
): Promise<{
  collectionId: string;
  name: string;
  productCount: number;
  shareUrl?: string;
}> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const collectionId = `col_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // In production, would insert into collections table
  const shareUrl = data.isPublic
    ? `https://shop.example.com/collections/${collectionId}`
    : undefined;

  // Create activity item
  await createActivityItem({
    userId,
    type: 'share',
    content: `Created collection: ${data.name}`,
    metadata: { collectionId, productCount: data.productIds.length },
  });

  return {
    collectionId,
    name: data.name,
    productCount: data.productIds.length,
    shareUrl,
  };
}

/**
 * Get user's collections
 */
export async function getUserCollections(
  userId: string
): Promise<Array<{
  collectionId: string;
  name: string;
  description?: string;
  productCount: number;
  isPublic: boolean;
  createdAt: Date;
  thumbnails: string[];
}>> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // In production, would query collections table
  return [
    {
      collectionId: 'col_1',
      name: 'My Tech Favorites',
      description: 'Best tech products I use daily',
      productCount: 8,
      isPublic: true,
      createdAt: new Date(Date.now() - 86400000 * 7),
      thumbnails: [],
    },
    {
      collectionId: 'col_2',
      name: 'Gift Ideas',
      description: 'Perfect gifts for friends and family',
      productCount: 12,
      isPublic: false,
      createdAt: new Date(Date.now() - 86400000 * 3),
      thumbnails: [],
    },
  ];
}
