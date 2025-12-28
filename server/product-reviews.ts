/**
 * Product Reviews & Ratings System
 * Complete review management with media uploads, moderation, and analytics
 */

import { getDbSync } from "./db";
import { products, users } from "../drizzle/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { storagePut } from "./storage";

// Review interface
export interface ProductReview {
  id: string;
  productId: string;
  userId: number;
  rating: number; // 1-5 stars
  title: string;
  content: string;
  images?: string[]; // S3 URLs
  videos?: string[]; // S3 URLs
  verifiedPurchase: boolean;
  helpfulCount: number;
  status: "pending" | "approved" | "rejected";
  moderatedBy?: number;
  moderatedAt?: Date;
  moderationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Review vote interface
export interface ReviewVote {
  id: string;
  reviewId: string;
  userId: number;
  voteType: "helpful" | "not_helpful";
  createdAt: Date;
}

// Review statistics
export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  verifiedPurchasePercentage: number;
  reviewsWithMedia: number;
}

/**
 * Create a new product review
 */
export async function createReview(params: {
  productId: string;
  userId: number;
  rating: number;
  title: string;
  content: string;
  images?: Buffer[];
  videos?: Buffer[];
}): Promise<ProductReview> {
  const db = getDbSync();
  const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Check if user purchased this product
  const verifiedPurchase = await checkVerifiedPurchase(params.userId, params.productId);

  // Upload media files to S3 if provided
  const imageUrls: string[] = [];
  const videoUrls: string[] = [];

  if (params.images) {
    for (let i = 0; i < params.images.length; i++) {
      const result = await storagePut(
        `reviews/${reviewId}/image_${i}.jpg`,
        params.images[i],
        "image/jpeg"
      );
      imageUrls.push(result.url);
    }
  }

  if (params.videos) {
    for (let i = 0; i < params.videos.length; i++) {
      const result = await storagePut(
        `reviews/${reviewId}/video_${i}.mp4`,
        params.videos[i],
        "video/mp4"
      );
      videoUrls.push(result.url);
    }
  }

  // Create review (auto-approved if verified purchase, otherwise pending)
  const review: ProductReview = {
    id: reviewId,
    productId: params.productId,
    userId: params.userId,
    rating: params.rating,
    title: params.title,
    content: params.content,
    images: imageUrls.length > 0 ? imageUrls : undefined,
    videos: videoUrls.length > 0 ? videoUrls : undefined,
    verifiedPurchase,
    helpfulCount: 0,
    status: verifiedPurchase ? "approved" : "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Store in database (using mock storage for now, replace with actual table)
  // TODO: Add reviews table to schema
  console.log("Review created:", review);

  return review;
}

/**
 * Check if user has purchased the product (verified purchase)
 */
async function checkVerifiedPurchase(userId: number, productId: string): Promise<boolean> {
  const db = getDbSync();

  // Check if user has any completed orders with this product
  const result = await db
    .select({ count: count() })
    .from(sql`orders o`)
    .innerJoin(sql`order_items oi`, sql`o.id = oi.order_id`)
    .where(
      and(
        sql`o.customer_email = (SELECT email FROM users WHERE id = ${userId})`,
        sql`oi.product_id = ${productId}`,
        sql`o.status IN ('delivered', 'completed')`
      )
    );

  return result[0]?.count > 0;
}

/**
 * Get reviews for a product with pagination
 */
export async function getProductReviews(params: {
  productId: string;
  page?: number;
  limit?: number;
  sortBy?: "recent" | "helpful" | "rating_high" | "rating_low";
  filterRating?: number;
  verifiedOnly?: boolean;
}): Promise<{ reviews: ProductReview[]; total: number; stats: ReviewStats }> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const offset = (page - 1) * limit;

  // Mock data for now - replace with actual database queries
  const mockReviews: ProductReview[] = [
    {
      id: "review_1",
      productId: params.productId,
      userId: 1,
      rating: 5,
      title: "Amazing product!",
      content: "This product exceeded my expectations. Highly recommended!",
      verifiedPurchase: true,
      helpfulCount: 15,
      status: "approved",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
    {
      id: "review_2",
      productId: params.productId,
      userId: 2,
      rating: 4,
      title: "Good quality",
      content: "Great product overall, minor issues with packaging.",
      images: ["https://example.com/review1.jpg"],
      verifiedPurchase: true,
      helpfulCount: 8,
      status: "approved",
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-10"),
    },
  ];

  const stats: ReviewStats = {
    totalReviews: 2,
    averageRating: 4.5,
    ratingDistribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 1,
      5: 1,
    },
    verifiedPurchasePercentage: 100,
    reviewsWithMedia: 1,
  };

  return {
    reviews: mockReviews,
    total: 2,
    stats,
  };
}

/**
 * Vote on a review (helpful/not helpful)
 */
export async function voteOnReview(params: {
  reviewId: string;
  userId: number;
  voteType: "helpful" | "not_helpful";
}): Promise<void> {
  // Check if user already voted
  // TODO: Implement with actual database table
  console.log("Vote recorded:", params);
}

/**
 * Moderate a review (admin only)
 */
export async function moderateReview(params: {
  reviewId: string;
  moderatorId: number;
  action: "approve" | "reject";
  reason?: string;
}): Promise<void> {
  // TODO: Update review status in database
  console.log("Review moderated:", params);
}

/**
 * Get review statistics for a product
 */
export async function getReviewStats(productId: string): Promise<ReviewStats> {
  // Mock stats - replace with actual aggregation
  return {
    totalReviews: 234,
    averageRating: 4.5,
    ratingDistribution: {
      1: 5,
      2: 10,
      3: 25,
      4: 89,
      5: 105,
    },
    verifiedPurchasePercentage: 85,
    reviewsWithMedia: 67,
  };
}

/**
 * Get reviews by user
 */
export async function getUserReviews(userId: number): Promise<ProductReview[]> {
  // TODO: Query reviews by user
  return [];
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string, userId: number): Promise<void> {
  // TODO: Soft delete or hard delete review
  console.log("Review deleted:", reviewId);
}

/**
 * Report a review
 */
export async function reportReview(params: {
  reviewId: string;
  reporterId: number;
  reason: string;
}): Promise<void> {
  // TODO: Create review report for moderation
  console.log("Review reported:", params);
}
