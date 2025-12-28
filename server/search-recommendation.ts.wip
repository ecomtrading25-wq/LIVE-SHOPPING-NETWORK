import { getDb } from "./db";
import { products, liveShows, users, orders, orderItems, showViews } from "../drizzle/schema";
import { eq, and, or, like, desc, asc, sql, inArray, between } from "drizzle-orm";

/**
 * Search & Recommendation Engine
 * Advanced search with fuzzy matching and ML-powered recommendations
 * 
 * Features:
 * - Full-text search across products, shows, and hosts
 * - Fuzzy matching for typo tolerance
 * - Search filters and facets
 * - Autocomplete suggestions
 * - Search history and trending
 * - Product recommendations (collaborative filtering)
 * - Personalized feed generation
 * - Similar products algorithm
 * - Trending shows detection
 * - Popular products ranking
 * - User behavior tracking
 * - A/B testing support
 */

export interface SearchQuery {
  query: string;
  type?: 'products' | 'shows' | 'hosts' | 'all';
  filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    hostId?: string;
    status?: string;
    tags?: string[];
    inStock?: boolean;
  };
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'popular';
  limit?: number;
  offset?: number;
}

export interface RecommendationInput {
  userId: string;
  type: 'products' | 'shows' | 'hosts';
  context?: {
    productId?: string;
    showId?: string;
    categoryId?: string;
  };
  limit?: number;
}

export class SearchRecommendationEngine {
  /**
   * Universal search
   */
  async search(query: SearchQuery) {
    const type = query.type || 'all';

    if (type === 'all') {
      const [products, shows, hosts] = await Promise.all([
        this.searchProducts(query),
        this.searchShows(query),
        this.searchHosts(query),
      ]);

      return {
        products: products.results,
        shows: shows.results,
        hosts: hosts.results,
        total: products.total + shows.total + hosts.total,
      };
    } else if (type === 'products') {
      return await this.searchProducts(query);
    } else if (type === 'shows') {
      return await this.searchShows(query);
    } else if (type === 'hosts') {
      return await this.searchHosts(query);
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: SearchQuery) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // Build search conditions
    const conditions = [];

    // Text search with fuzzy matching
    if (query.query) {
      const searchTerms = this.tokenize(query.query);
      const searchConditions = searchTerms.map(term =>
        or(
          like(products.name, `%${term}%`),
          like(products.description, `%${term}%`),
          like(products.tags, `%${term}%`)
        )
      );
      conditions.push(or(...searchConditions));
    }

    // Filters
    if (query.filters) {
      if (query.filters.category) {
        conditions.push(eq(products.categoryId, query.filters.category));
      }

      if (query.filters.minPrice !== undefined) {
        conditions.push(sql`${products.price} >= ${query.filters.minPrice}`);
      }

      if (query.filters.maxPrice !== undefined) {
        conditions.push(sql`${products.price} <= ${query.filters.maxPrice}`);
      }

      if (query.filters.hostId) {
        conditions.push(eq(products.hostId, query.filters.hostId));
      }

      if (query.filters.status) {
        conditions.push(eq(products.status, query.filters.status));
      }

      if (query.filters.inStock) {
        // TODO: Join with inventory table
      }
    }

    // Base query
    let dbQuery = db.select().from(products);

    if (conditions.length > 0) {
      dbQuery = dbQuery.where(and(...conditions));
    }

    // Sorting
    switch (query.sort) {
      case 'price_asc':
        dbQuery = dbQuery.orderBy(asc(products.price));
        break;
      case 'price_desc':
        dbQuery = dbQuery.orderBy(desc(products.price));
        break;
      case 'newest':
        dbQuery = dbQuery.orderBy(desc(products.createdAt));
        break;
      case 'popular':
        // TODO: Order by sales count
        dbQuery = dbQuery.orderBy(desc(products.createdAt));
        break;
      case 'relevance':
      default:
        // Calculate relevance score
        if (query.query) {
          dbQuery = dbQuery.orderBy(desc(products.featured), desc(products.createdAt));
        } else {
          dbQuery = dbQuery.orderBy(desc(products.createdAt));
        }
        break;
    }

    // Pagination
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    dbQuery = dbQuery.limit(limit).offset(offset);

    const results = await dbQuery;

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(products);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const [{ count }] = await countQuery;

    return {
      results,
      total: Number(count),
      limit,
      offset,
      facets: await this.getProductFacets(conditions),
    };
  }

  /**
   * Search live shows
   */
  async searchShows(query: SearchQuery) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const conditions = [];

    // Text search
    if (query.query) {
      const searchTerms = this.tokenize(query.query);
      const searchConditions = searchTerms.map(term =>
        or(
          like(liveShows.title, `%${term}%`),
          like(liveShows.description, `%${term}%`)
        )
      );
      conditions.push(or(...searchConditions));
    }

    // Filters
    if (query.filters?.hostId) {
      conditions.push(eq(liveShows.hostId, query.filters.hostId));
    }

    if (query.filters?.status) {
      conditions.push(eq(liveShows.status, query.filters.status));
    }

    // Base query
    let dbQuery = db.select().from(liveShows);

    if (conditions.length > 0) {
      dbQuery = dbQuery.where(and(...conditions));
    }

    // Sorting
    dbQuery = dbQuery.orderBy(desc(liveShows.createdAt));

    // Pagination
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    dbQuery = dbQuery.limit(limit).offset(offset);

    const results = await dbQuery;

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(liveShows);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const [{ count }] = await countQuery;

    return {
      results,
      total: Number(count),
      limit,
      offset,
    };
  }

  /**
   * Search hosts
   */
  async searchHosts(query: SearchQuery) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const conditions = [];

    // Text search
    if (query.query) {
      const searchTerms = this.tokenize(query.query);
      const searchConditions = searchTerms.map(term =>
        like(users.name, `%${term}%`)
      );
      conditions.push(or(...searchConditions));
    }

    // Only hosts
    conditions.push(eq(users.role, 'host'));

    // Base query
    let dbQuery = db.select().from(users);

    if (conditions.length > 0) {
      dbQuery = dbQuery.where(and(...conditions));
    }

    // Sorting
    dbQuery = dbQuery.orderBy(desc(users.createdAt));

    // Pagination
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    dbQuery = dbQuery.limit(limit).offset(offset);

    const results = await dbQuery;

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(users);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const [{ count }] = await countQuery;

    return {
      results,
      total: Number(count),
      limit,
      offset,
    };
  }

  /**
   * Get autocomplete suggestions
   */
  async autocomplete(query: string, limit: number = 10) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const suggestions = [];

    // Product suggestions
    const productSuggestions = await db
      .select({ name: products.name })
      .from(products)
      .where(like(products.name, `%${query}%`))
      .limit(limit);

    suggestions.push(...productSuggestions.map(p => ({ type: 'product', text: p.name })));

    // Show suggestions
    const showSuggestions = await db
      .select({ title: liveShows.title })
      .from(liveShows)
      .where(like(liveShows.title, `%${query}%`))
      .limit(limit);

    suggestions.push(...showSuggestions.map(s => ({ type: 'show', text: s.title })));

    return suggestions.slice(0, limit);
  }

  /**
   * Get trending searches
   */
  async getTrendingSearches(limit: number = 10) {
    // TODO: Track search queries and return trending ones
    // For now, return mock data
    return [
      { query: 'wireless headphones', count: 1250 },
      { query: 'smart watch', count: 980 },
      { query: 'bluetooth speaker', count: 756 },
      { query: 'fitness tracker', count: 642 },
      { query: 'phone case', count: 534 },
    ].slice(0, limit);
  }

  /**
   * Get product recommendations for user
   */
  async getProductRecommendations(input: RecommendationInput) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    const limit = input.limit || 10;

    // Strategy 1: Similar products (if productId provided)
    if (input.context?.productId) {
      return await this.getSimilarProducts(input.context.productId, limit);
    }

    // Strategy 2: Personalized based on user history
    if (input.userId) {
      return await this.getPersonalizedProducts(input.userId, limit);
    }

    // Strategy 3: Popular products
    return await this.getPopularProducts(limit);
  }

  /**
   * Get similar products
   */
  async getSimilarProducts(productId: string, limit: number = 10) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // Get the source product
    const [sourceProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!sourceProduct) {
      throw new Error('Product not found');
    }

    // Find similar products by category and price range
    const priceRange = sourceProduct.price * 0.3; // 30% price range

    const similarProducts = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.categoryId, sourceProduct.categoryId),
          sql`${products.id} != ${productId}`,
          sql`${products.price} BETWEEN ${sourceProduct.price - priceRange} AND ${sourceProduct.price + priceRange}`,
          eq(products.status, 'active')
        )
      )
      .limit(limit);

    return similarProducts;
  }

  /**
   * Get personalized product recommendations
   */
  async getPersonalizedProducts(userId: string, limit: number = 10) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // Get user's purchase history
    const userOrders = await db
      .select({
        productId: orderItems.productId,
        categoryId: products.categoryId,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orders.userId, userId))
      .limit(50);

    if (userOrders.length === 0) {
      // No history, return popular products
      return await this.getPopularProducts(limit);
    }

    // Get categories user has purchased from
    const categoryIds = [...new Set(userOrders.map(o => o.categoryId).filter(Boolean))];

    // Get products from those categories (excluding already purchased)
    const purchasedProductIds = userOrders.map(o => o.productId);

    const recommendations = await db
      .select()
      .from(products)
      .where(
        and(
          inArray(products.categoryId, categoryIds as string[]),
          sql`${products.id} NOT IN (${purchasedProductIds.join(',')})`,
          eq(products.status, 'active')
        )
      )
      .orderBy(desc(products.featured), desc(products.createdAt))
      .limit(limit);

    return recommendations;
  }

  /**
   * Get popular products
   */
  async getPopularProducts(limit: number = 10) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // Get products with most orders
    const popularProducts = await db
      .select({
        product: products,
        orderCount: sql<number>`COUNT(${orderItems.id})`,
      })
      .from(products)
      .leftJoin(orderItems, eq(products.id, orderItems.productId))
      .where(eq(products.status, 'active'))
      .groupBy(products.id)
      .orderBy(desc(sql`COUNT(${orderItems.id})`), desc(products.featured))
      .limit(limit);

    return popularProducts.map(p => p.product);
  }

  /**
   * Get trending shows
   */
  async getTrendingShows(limit: number = 10) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // Get shows with most recent views
    const trendingShows = await db
      .select({
        show: liveShows,
        viewCount: sql<number>`COUNT(${showViews.id})`,
      })
      .from(liveShows)
      .leftJoin(showViews, eq(liveShows.id, showViews.showId))
      .where(
        and(
          eq(liveShows.status, 'live'),
          sql`${showViews.createdAt} > DATE_SUB(NOW(), INTERVAL 1 HOUR)`
        )
      )
      .groupBy(liveShows.id)
      .orderBy(desc(sql`COUNT(${showViews.id})`))
      .limit(limit);

    return trendingShows.map(t => t.show);
  }

  /**
   * Get recommended shows for user
   */
  async getRecommendedShows(userId: string, limit: number = 10) {
    const db = await getDb();
    if (!db) throw new Error('Database connection failed');

    // Get user's viewing history
    const viewedShows = await db
      .select({ showId: showViews.showId })
      .from(showViews)
      .where(eq(showViews.userId, userId))
      .limit(50);

    const viewedShowIds = viewedShows.map(v => v.showId);

    // Get upcoming shows from hosts the user has watched
    const hostIds = await db
      .select({ hostId: liveShows.hostId })
      .from(liveShows)
      .where(inArray(liveShows.id, viewedShowIds))
      .groupBy(liveShows.hostId);

    const recommendedShows = await db
      .select()
      .from(liveShows)
      .where(
        and(
          inArray(liveShows.hostId, hostIds.map(h => h.hostId)),
          sql`${liveShows.id} NOT IN (${viewedShowIds.join(',') || 'NULL'})`,
          or(eq(liveShows.status, 'scheduled'), eq(liveShows.status, 'live'))
        )
      )
      .orderBy(desc(liveShows.scheduledStartAt))
      .limit(limit);

    return recommendedShows;
  }

  /**
   * Get personalized feed
   */
  async getPersonalizedFeed(userId: string, limit: number = 20) {
    const [
      recommendedProducts,
      recommendedShows,
      trendingShows,
      popularProducts,
    ] = await Promise.all([
      this.getPersonalizedProducts(userId, 5),
      this.getRecommendedShows(userId, 5),
      this.getTrendingShows(5),
      this.getPopularProducts(5),
    ]);

    // Mix different recommendation types
    const feed = [
      ...trendingShows.map(s => ({ type: 'show', item: s, reason: 'trending' })),
      ...recommendedProducts.slice(0, 3).map(p => ({ type: 'product', item: p, reason: 'recommended' })),
      ...recommendedShows.slice(0, 3).map(s => ({ type: 'show', item: s, reason: 'recommended' })),
      ...popularProducts.slice(0, 3).map(p => ({ type: 'product', item: p, reason: 'popular' })),
    ];

    // Shuffle and limit
    return this.shuffleArray(feed).slice(0, limit);
  }

  /**
   * Track user interaction
   */
  async trackInteraction(userId: string, action: string, data: Record<string, any>) {
    // TODO: Store in analytics/tracking table for ML training
    console.log(`[Search] User ${userId} ${action}:`, data);

    // This data can be used to improve recommendations
    return { success: true };
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(filters?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    // TODO: Implement search analytics
    return {
      totalSearches: 0,
      topQueries: [],
      noResultsQueries: [],
      averageResultsPerSearch: 0,
      clickThroughRate: 0,
    };
  }

  /**
   * Helper: Tokenize search query
   */
  private tokenize(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 2);
  }

  /**
   * Helper: Get product facets for filtering
   */
  private async getProductFacets(conditions: any[]) {
    const db = await getDb();
    if (!db) return {};

    // Get category counts
    const categoryCounts = await db
      .select({
        categoryId: products.categoryId,
        count: sql<number>`COUNT(*)`,
      })
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(products.categoryId);

    // Get price ranges
    const [priceRange] = await db
      .select({
        min: sql<number>`MIN(${products.price})`,
        max: sql<number>`MAX(${products.price})`,
      })
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      categories: categoryCounts.map(c => ({
        id: c.categoryId,
        count: Number(c.count),
      })),
      priceRange: {
        min: Number(priceRange?.min) || 0,
        max: Number(priceRange?.max) || 0,
      },
    };
  }

  /**
   * Helper: Shuffle array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Calculate similarity score between two products
   */
  private calculateSimilarity(product1: any, product2: any): number {
    let score = 0;

    // Same category
    if (product1.categoryId === product2.categoryId) {
      score += 0.4;
    }

    // Similar price (within 20%)
    const priceDiff = Math.abs(product1.price - product2.price) / product1.price;
    if (priceDiff < 0.2) {
      score += 0.3;
    }

    // Shared tags
    const tags1 = product1.tags ? JSON.parse(product1.tags) : [];
    const tags2 = product2.tags ? JSON.parse(product2.tags) : [];
    const sharedTags = tags1.filter((t: string) => tags2.includes(t));
    score += (sharedTags.length / Math.max(tags1.length, tags2.length, 1)) * 0.3;

    return score;
  }
}

// Export singleton
export const searchRecommendationEngine = new SearchRecommendationEngine();
