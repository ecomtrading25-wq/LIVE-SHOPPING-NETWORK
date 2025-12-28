/**
 * AI-Powered Product Recommendation Engine
 * Uses collaborative filtering, content-based filtering, and hybrid approaches
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Recommendation Types
export type RecommendationType =
  | 'personalized' // Based on user behavior
  | 'similar' // Similar to current product
  | 'trending' // Trending products
  | 'frequently_bought_together' // Bundle recommendations
  | 'recently_viewed' // User's recent views
  | 'category_based' // Based on browsing category
  | 'price_based' // Similar price range
  | 'seasonal' // Seasonal recommendations
  | 'new_arrivals' // New products
  | 'best_sellers'; // Top selling products

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory?: string;
  tags: string[];
  images: string[];
  rating: number;
  reviewCount: number;
  sales: number;
  views: number;
  stock: number;
  brand?: string;
  attributes: Record<string, any>;
  createdAt: Date;
}

export interface UserBehavior {
  userId: string;
  viewedProducts: string[];
  purchasedProducts: string[];
  cartItems: string[];
  wishlistItems: string[];
  searchQueries: string[];
  categoryPreferences: Record<string, number>;
  priceRange: { min: number; max: number };
  lastActive: Date;
}

export interface RecommendationScore {
  productId: string;
  score: number;
  reasons: string[];
  confidence: number;
}

export interface RecommendationResult {
  products: Product[];
  scores: RecommendationScore[];
  algorithm: string;
  generatedAt: Date;
}

// Recommendation Store
interface RecommendationStore {
  userBehavior: UserBehavior | null;
  recommendations: Map<RecommendationType, RecommendationResult>;
  viewedProducts: string[];
  
  // Actions
  trackView: (productId: string) => void;
  trackPurchase: (productId: string) => void;
  trackSearch: (query: string) => void;
  trackCartAdd: (productId: string) => void;
  trackWishlistAdd: (productId: string) => void;
  updateCategoryPreference: (category: string, weight: number) => void;
  setRecommendations: (type: RecommendationType, result: RecommendationResult) => void;
  clearRecommendations: () => void;
}

export const useRecommendations = create<RecommendationStore>()(
  persist(
    (set, get) => ({
      userBehavior: null,
      recommendations: new Map(),
      viewedProducts: [],
      
      trackView: (productId: string) => {
        set((state) => {
          const behavior = state.userBehavior || createDefaultBehavior();
          const viewedProducts = [...state.viewedProducts, productId].slice(-50); // Keep last 50
          
          return {
            userBehavior: {
              ...behavior,
              viewedProducts: [...behavior.viewedProducts, productId].slice(-100),
              lastActive: new Date(),
            },
            viewedProducts,
          };
        });
      },
      
      trackPurchase: (productId: string) => {
        set((state) => {
          const behavior = state.userBehavior || createDefaultBehavior();
          
          return {
            userBehavior: {
              ...behavior,
              purchasedProducts: [...behavior.purchasedProducts, productId],
              lastActive: new Date(),
            },
          };
        });
      },
      
      trackSearch: (query: string) => {
        set((state) => {
          const behavior = state.userBehavior || createDefaultBehavior();
          
          return {
            userBehavior: {
              ...behavior,
              searchQueries: [...behavior.searchQueries, query].slice(-50),
              lastActive: new Date(),
            },
          };
        });
      },
      
      trackCartAdd: (productId: string) => {
        set((state) => {
          const behavior = state.userBehavior || createDefaultBehavior();
          
          return {
            userBehavior: {
              ...behavior,
              cartItems: [...behavior.cartItems, productId],
              lastActive: new Date(),
            },
          };
        });
      },
      
      trackWishlistAdd: (productId: string) => {
        set((state) => {
          const behavior = state.userBehavior || createDefaultBehavior();
          
          return {
            userBehavior: {
              ...behavior,
              wishlistItems: [...behavior.wishlistItems, productId],
              lastActive: new Date(),
            },
          };
        });
      },
      
      updateCategoryPreference: (category: string, weight: number) => {
        set((state) => {
          const behavior = state.userBehavior || createDefaultBehavior();
          
          return {
            userBehavior: {
              ...behavior,
              categoryPreferences: {
                ...behavior.categoryPreferences,
                [category]: (behavior.categoryPreferences[category] || 0) + weight,
              },
              lastActive: new Date(),
            },
          };
        });
      },
      
      setRecommendations: (type: RecommendationType, result: RecommendationResult) => {
        set((state) => {
          const newMap = new Map(state.recommendations);
          newMap.set(type, result);
          return { recommendations: newMap };
        });
      },
      
      clearRecommendations: () => {
        set({ recommendations: new Map() });
      },
    }),
    {
      name: 'recommendations-storage',
      partialize: (state) => ({
        userBehavior: state.userBehavior,
        viewedProducts: state.viewedProducts,
      }),
    }
  )
);

function createDefaultBehavior(): UserBehavior {
  return {
    userId: '',
    viewedProducts: [],
    purchasedProducts: [],
    cartItems: [],
    wishlistItems: [],
    searchQueries: [],
    categoryPreferences: {},
    priceRange: { min: 0, max: Infinity },
    lastActive: new Date(),
  };
}

// Recommendation Algorithms

/**
 * Collaborative Filtering
 * Recommends products based on similar users' behavior
 */
export function collaborativeFiltering(
  currentUser: UserBehavior,
  allUsers: UserBehavior[],
  allProducts: Product[]
): RecommendationScore[] {
  const scores: RecommendationScore[] = [];
  
  // Find similar users
  const similarUsers = allUsers
    .filter((user) => user.userId !== currentUser.userId)
    .map((user) => ({
      user,
      similarity: calculateUserSimilarity(currentUser, user),
    }))
    .filter((item) => item.similarity > 0.3)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);
  
  // Aggregate product scores from similar users
  const productScores = new Map<string, { score: number; count: number }>();
  
  similarUsers.forEach(({ user, similarity }) => {
    user.purchasedProducts.forEach((productId) => {
      if (!currentUser.purchasedProducts.includes(productId)) {
        const current = productScores.get(productId) || { score: 0, count: 0 };
        productScores.set(productId, {
          score: current.score + similarity,
          count: current.count + 1,
        });
      }
    });
  });
  
  // Convert to recommendation scores
  productScores.forEach((data, productId) => {
    const product = allProducts.find((p) => p.id === productId);
    if (product) {
      scores.push({
        productId,
        score: data.score / data.count,
        reasons: ['Users like you also purchased this'],
        confidence: Math.min(data.count / 5, 1),
      });
    }
  });
  
  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Content-Based Filtering
 * Recommends products similar to what user has interacted with
 */
export function contentBasedFiltering(
  userBehavior: UserBehavior,
  currentProduct: Product | null,
  allProducts: Product[]
): RecommendationScore[] {
  const scores: RecommendationScore[] = [];
  
  // Get user's preferred products
  const preferredProducts = allProducts.filter((p) =>
    userBehavior.viewedProducts.includes(p.id) ||
    userBehavior.purchasedProducts.includes(p.id) ||
    userBehavior.wishlistItems.includes(p.id)
  );
  
  // If viewing a specific product, use it as reference
  const referenceProducts = currentProduct
    ? [currentProduct]
    : preferredProducts.slice(-5);
  
  if (referenceProducts.length === 0) {
    return scores;
  }
  
  // Calculate similarity for each product
  allProducts.forEach((product) => {
    // Skip if already purchased or current product
    if (
      userBehavior.purchasedProducts.includes(product.id) ||
      product.id === currentProduct?.id
    ) {
      return;
    }
    
    let totalSimilarity = 0;
    const reasons: string[] = [];
    
    referenceProducts.forEach((refProduct) => {
      const similarity = calculateProductSimilarity(refProduct, product);
      totalSimilarity += similarity;
      
      if (refProduct.category === product.category) {
        reasons.push(`Same category: ${product.category}`);
      }
      if (refProduct.brand === product.brand && refProduct.brand) {
        reasons.push(`Same brand: ${product.brand}`);
      }
      if (Math.abs(refProduct.price - product.price) / refProduct.price < 0.2) {
        reasons.push('Similar price range');
      }
    });
    
    const avgSimilarity = totalSimilarity / referenceProducts.length;
    
    if (avgSimilarity > 0.3) {
      scores.push({
        productId: product.id,
        score: avgSimilarity,
        reasons: Array.from(new Set(reasons)).slice(0, 3),
        confidence: avgSimilarity,
      });
    }
  });
  
  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Hybrid Recommendation
 * Combines multiple algorithms for better results
 */
export function hybridRecommendation(
  userBehavior: UserBehavior,
  currentProduct: Product | null,
  allUsers: UserBehavior[],
  allProducts: Product[]
): RecommendationScore[] {
  // Get scores from different algorithms
  const collaborativeScores = collaborativeFiltering(userBehavior, allUsers, allProducts);
  const contentScores = contentBasedFiltering(userBehavior, currentProduct, allProducts);
  const trendingScores = getTrendingProducts(allProducts);
  
  // Combine scores with weights
  const combinedScores = new Map<string, RecommendationScore>();
  
  // Collaborative filtering (40% weight)
  collaborativeScores.forEach((score) => {
    combinedScores.set(score.productId, {
      ...score,
      score: score.score * 0.4,
    });
  });
  
  // Content-based filtering (40% weight)
  contentScores.forEach((score) => {
    const existing = combinedScores.get(score.productId);
    if (existing) {
      existing.score += score.score * 0.4;
      existing.reasons.push(...score.reasons);
      existing.confidence = (existing.confidence + score.confidence) / 2;
    } else {
      combinedScores.set(score.productId, {
        ...score,
        score: score.score * 0.4,
      });
    }
  });
  
  // Trending products (20% weight)
  trendingScores.forEach((score) => {
    const existing = combinedScores.get(score.productId);
    if (existing) {
      existing.score += score.score * 0.2;
      existing.reasons.push(...score.reasons);
    } else {
      combinedScores.set(score.productId, {
        ...score,
        score: score.score * 0.2,
      });
    }
  });
  
  return Array.from(combinedScores.values()).sort((a, b) => b.score - a.score);
}

/**
 * Frequently Bought Together
 * Recommends products often purchased with current product
 */
export function frequentlyBoughtTogether(
  currentProduct: Product,
  allOrders: any[],
  allProducts: Product[]
): RecommendationScore[] {
  const scores: RecommendationScore[] = [];
  const coOccurrence = new Map<string, number>();
  
  // Find orders containing current product
  const relevantOrders = allOrders.filter((order) =>
    order.items.some((item: any) => item.productId === currentProduct.id)
  );
  
  // Count co-occurrences
  relevantOrders.forEach((order) => {
    order.items.forEach((item: any) => {
      if (item.productId !== currentProduct.id) {
        const count = coOccurrence.get(item.productId) || 0;
        coOccurrence.set(item.productId, count + 1);
      }
    });
  });
  
  // Calculate scores
  coOccurrence.forEach((count, productId) => {
    const product = allProducts.find((p) => p.id === productId);
    if (product) {
      const score = count / relevantOrders.length;
      scores.push({
        productId,
        score,
        reasons: [`Bought together ${count} times`],
        confidence: Math.min(count / 10, 1),
      });
    }
  });
  
  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Trending Products
 * Recommends currently trending products
 */
export function getTrendingProducts(allProducts: Product[]): RecommendationScore[] {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  return allProducts
    .map((product) => {
      const daysSinceCreation = (now - new Date(product.createdAt).getTime()) / dayInMs;
      const recencyWeight = Math.exp(-daysSinceCreation / 30); // Decay over 30 days
      
      const trendScore =
        (product.views * 0.3 + product.sales * 0.5 + product.rating * product.reviewCount * 0.2) *
        recencyWeight;
      
      return {
        productId: product.id,
        score: trendScore,
        reasons: ['Trending now', `${product.sales} recent sales`],
        confidence: Math.min(product.reviewCount / 50, 1),
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Category-Based Recommendations
 * Recommends products from user's preferred categories
 */
export function categoryBasedRecommendation(
  userBehavior: UserBehavior,
  allProducts: Product[]
): RecommendationScore[] {
  const scores: RecommendationScore[] = [];
  
  // Get top categories
  const topCategories = Object.entries(userBehavior.categoryPreferences)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category]) => category);
  
  if (topCategories.length === 0) {
    return scores;
  }
  
  allProducts.forEach((product) => {
    if (userBehavior.purchasedProducts.includes(product.id)) {
      return;
    }
    
    const categoryIndex = topCategories.indexOf(product.category);
    if (categoryIndex !== -1) {
      const categoryWeight = 1 - categoryIndex * 0.2;
      const qualityScore = (product.rating / 5) * (product.reviewCount / 100);
      
      scores.push({
        productId: product.id,
        score: categoryWeight * qualityScore,
        reasons: [`From your favorite category: ${product.category}`],
        confidence: categoryWeight,
      });
    }
  });
  
  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Price-Based Recommendations
 * Recommends products in user's price range
 */
export function priceBasedRecommendation(
  userBehavior: UserBehavior,
  allProducts: Product[]
): RecommendationScore[] {
  const scores: RecommendationScore[] = [];
  
  const { min, max } = userBehavior.priceRange;
  const avgPrice = (min + max) / 2;
  
  allProducts.forEach((product) => {
    if (userBehavior.purchasedProducts.includes(product.id)) {
      return;
    }
    
    const priceDiff = Math.abs(product.price - avgPrice);
    const priceScore = Math.max(0, 1 - priceDiff / avgPrice);
    
    if (priceScore > 0.5) {
      scores.push({
        productId: product.id,
        score: priceScore,
        reasons: ['In your price range'],
        confidence: priceScore,
      });
    }
  });
  
  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Seasonal Recommendations
 * Recommends products relevant to current season
 */
export function seasonalRecommendation(
  allProducts: Product[],
  season: 'spring' | 'summer' | 'fall' | 'winter'
): RecommendationScore[] {
  const seasonalTags = {
    spring: ['spring', 'easter', 'garden', 'outdoor'],
    summer: ['summer', 'beach', 'vacation', 'outdoor', 'swimwear'],
    fall: ['fall', 'autumn', 'halloween', 'thanksgiving', 'cozy'],
    winter: ['winter', 'christmas', 'holiday', 'warm', 'gift'],
  };
  
  const relevantTags = seasonalTags[season];
  
  return allProducts
    .map((product) => {
      const matchingTags = product.tags.filter((tag) =>
        relevantTags.some((seasonTag) => tag.toLowerCase().includes(seasonTag))
      );
      
      if (matchingTags.length > 0) {
        return {
          productId: product.id,
          score: matchingTags.length / relevantTags.length,
          reasons: [`Perfect for ${season}`, ...matchingTags.slice(0, 2)],
          confidence: matchingTags.length / product.tags.length,
        };
      }
      
      return null;
    })
    .filter((score): score is RecommendationScore => score !== null)
    .sort((a, b) => b.score - a.score);
}

// Utility Functions

/**
 * Calculate similarity between two users
 */
function calculateUserSimilarity(user1: UserBehavior, user2: UserBehavior): number {
  // Jaccard similarity on purchased products
  const purchases1 = new Set(user1.purchasedProducts);
  const purchases2 = new Set(user2.purchasedProducts);
  
  const intersection = new Set([...purchases1].filter((x) => purchases2.has(x)));
  const union = new Set([...purchases1, ...purchases2]);
  
  const purchaseSimilarity = union.size > 0 ? intersection.size / union.size : 0;
  
  // Category preference similarity
  const categories = new Set([
    ...Object.keys(user1.categoryPreferences),
    ...Object.keys(user2.categoryPreferences),
  ]);
  
  let categoryScore = 0;
  categories.forEach((category) => {
    const pref1 = user1.categoryPreferences[category] || 0;
    const pref2 = user2.categoryPreferences[category] || 0;
    const maxPref = Math.max(pref1, pref2);
    if (maxPref > 0) {
      categoryScore += Math.min(pref1, pref2) / maxPref;
    }
  });
  
  const categorySimilarity = categories.size > 0 ? categoryScore / categories.size : 0;
  
  // Weighted average
  return purchaseSimilarity * 0.7 + categorySimilarity * 0.3;
}

/**
 * Calculate similarity between two products
 */
function calculateProductSimilarity(product1: Product, product2: Product): number {
  let similarity = 0;
  
  // Category match (40%)
  if (product1.category === product2.category) {
    similarity += 0.4;
    
    // Subcategory match (bonus 10%)
    if (product1.subcategory === product2.subcategory && product1.subcategory) {
      similarity += 0.1;
    }
  }
  
  // Brand match (20%)
  if (product1.brand === product2.brand && product1.brand) {
    similarity += 0.2;
  }
  
  // Tag overlap (20%)
  const tags1 = new Set(product1.tags);
  const tags2 = new Set(product2.tags);
  const tagIntersection = new Set([...tags1].filter((x) => tags2.has(x)));
  const tagUnion = new Set([...tags1, ...tags2]);
  
  if (tagUnion.size > 0) {
    similarity += (tagIntersection.size / tagUnion.size) * 0.2;
  }
  
  // Price similarity (10%)
  const priceDiff = Math.abs(product1.price - product2.price);
  const avgPrice = (product1.price + product2.price) / 2;
  const priceSimilarity = Math.max(0, 1 - priceDiff / avgPrice);
  similarity += priceSimilarity * 0.1;
  
  // Rating similarity (10%)
  const ratingDiff = Math.abs(product1.rating - product2.rating);
  const ratingSimilarity = 1 - ratingDiff / 5;
  similarity += ratingSimilarity * 0.1;
  
  return similarity;
}

/**
 * Get current season
 */
export function getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
  const month = new Date().getMonth();
  
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

/**
 * Diversify recommendations to avoid filter bubbles
 */
export function diversifyRecommendations(
  scores: RecommendationScore[],
  allProducts: Product[],
  diversityFactor: number = 0.3
): RecommendationScore[] {
  const diversified: RecommendationScore[] = [];
  const selectedCategories = new Set<string>();
  
  scores.forEach((score) => {
    const product = allProducts.find((p) => p.id === score.productId);
    if (!product) return;
    
    // Apply diversity penalty if category already selected
    const categoryCount = selectedCategories.has(product.category)
      ? Array.from(selectedCategories).filter((c) => c === product.category).length
      : 0;
    
    const diversityPenalty = Math.exp(-categoryCount * diversityFactor);
    
    diversified.push({
      ...score,
      score: score.score * diversityPenalty,
    });
    
    selectedCategories.add(product.category);
  });
  
  return diversified.sort((a, b) => b.score - a.score);
}

/**
 * A/B Testing for recommendation algorithms
 */
export function selectRecommendationAlgorithm(
  userId: string
): 'collaborative' | 'content' | 'hybrid' {
  // Simple hash-based assignment for consistent user experience
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variant = hash % 3;
  
  switch (variant) {
    case 0:
      return 'collaborative';
    case 1:
      return 'content';
    default:
      return 'hybrid';
  }
}

/**
 * Track recommendation performance
 */
export interface RecommendationMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number; // Click-through rate
  cvr: number; // Conversion rate
  revenue: number;
}

export function trackRecommendationClick(
  recommendationType: RecommendationType,
  productId: string
) {
  // Send analytics event
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'recommendation_click', {
      recommendation_type: recommendationType,
      product_id: productId,
    });
  }
}

export function trackRecommendationConversion(
  recommendationType: RecommendationType,
  productId: string,
  revenue: number
) {
  // Send analytics event
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'recommendation_conversion', {
      recommendation_type: recommendationType,
      product_id: productId,
      value: revenue,
    });
  }
}
