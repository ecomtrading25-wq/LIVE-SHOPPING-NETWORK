/**
 * Advanced Search Engine
 * Full-text search, filters, facets, autocomplete, search analytics, relevance scoring
 */

import { db } from './db';
import { products, liveShows } from '../drizzle/schema';
import { like, or, and, eq, gte, lte, inArray, desc, sql } from 'drizzle-orm';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface SearchQuery {
  q: string; // Search query
  filters?: SearchFilters;
  sort?: SearchSort;
  page?: number;
  pageSize?: number;
  facets?: string[]; // Facets to return
}

export interface SearchFilters {
  categories?: string[];
  priceMin?: number;
  priceMax?: number;
  brands?: string[];
  ratings?: number[];
  inStock?: boolean;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface SearchSort {
  field: 'relevance' | 'price' | 'rating' | 'date' | 'popularity';
  order: 'asc' | 'desc';
}

export interface SearchResult<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets?: SearchFacets;
  suggestions?: string[];
  took: number; // milliseconds
}

export interface SearchFacets {
  categories?: FacetValue[];
  brands?: FacetValue[];
  priceRanges?: FacetValue[];
  ratings?: FacetValue[];
}

export interface FacetValue {
  value: string;
  count: number;
  selected?: boolean;
}

export interface AutocompleteResult {
  suggestions: string[];
  products?: Array<{
    id: string;
    name: string;
    price: number;
    imageUrl: string;
  }>;
  categories?: string[];
}

export interface SearchAnalytics {
  query: string;
  results: number;
  timestamp: Date;
  userId?: string;
  clicked?: string[]; // IDs of clicked results
  converted?: boolean; // Did search lead to purchase
}

// ============================================================================
// SEARCH INDEX
// ============================================================================

class SearchIndex {
  private index: Map<string, IndexedDocument> = new Map();
  private invertedIndex: Map<string, Set<string>> = new Map();

  // Index a document
  indexDocument(id: string, document: any) {
    const tokens = this.tokenize(document);
    const indexed: IndexedDocument = {
      id,
      tokens,
      document,
      score: 0
    };

    this.index.set(id, indexed);

    // Update inverted index
    for (const token of tokens) {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Set());
      }
      this.invertedIndex.get(token)!.add(id);
    }
  }

  // Remove document from index
  removeDocument(id: string) {
    const indexed = this.index.get(id);
    if (!indexed) return;

    // Remove from inverted index
    for (const token of indexed.tokens) {
      const docs = this.invertedIndex.get(token);
      if (docs) {
        docs.delete(id);
        if (docs.size === 0) {
          this.invertedIndex.delete(token);
        }
      }
    }

    this.index.delete(id);
  }

  // Search documents
  search(query: string, limit: number = 10): IndexedDocument[] {
    const queryTokens = this.tokenize({ text: query });
    const scores = new Map<string, number>();

    // Calculate relevance scores
    for (const token of queryTokens) {
      const docs = this.invertedIndex.get(token);
      if (!docs) continue;

      const idf = Math.log(this.index.size / docs.size);

      for (const docId of docs) {
        const indexed = this.index.get(docId);
        if (!indexed) continue;

        const tf = indexed.tokens.filter(t => t === token).length / indexed.tokens.length;
        const score = tf * idf;

        scores.set(docId, (scores.get(docId) || 0) + score);
      }
    }

    // Sort by score and return top results
    const results = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([docId, score]) => {
        const indexed = this.index.get(docId)!;
        return { ...indexed, score };
      });

    return results;
  }

  // Tokenize document
  private tokenize(document: any): string[] {
    const text = this.extractText(document).toLowerCase();
    
    // Remove punctuation and split
    const tokens = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2); // Remove short tokens

    // Remove stop words
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'or', 'but', 'for', 'with']);
    return tokens.filter(t => !stopWords.has(t));
  }

  // Extract text from document
  private extractText(document: any): string {
    if (typeof document === 'string') {
      return document;
    }

    const parts: string[] = [];
    
    if (document.name) parts.push(document.name);
    if (document.title) parts.push(document.title);
    if (document.description) parts.push(document.description);
    if (document.category) parts.push(document.category);
    if (document.brand) parts.push(document.brand);
    if (document.tags) parts.push(...document.tags);

    return parts.join(' ');
  }

  // Get index size
  size(): number {
    return this.index.size;
  }

  // Clear index
  clear() {
    this.index.clear();
    this.invertedIndex.clear();
  }
}

interface IndexedDocument {
  id: string;
  tokens: string[];
  document: any;
  score: number;
}

// ============================================================================
// SEARCH ENGINE
// ============================================================================

class SearchEngine {
  private productIndex: SearchIndex;
  private showIndex: SearchIndex;
  private searchHistory: SearchAnalytics[] = [];
  private popularQueries: Map<string, number> = new Map();

  constructor() {
    this.productIndex = new SearchIndex();
    this.showIndex = new SearchIndex();
    this.initializeIndexes();
  }

  // Initialize search indexes
  private async initializeIndexes() {
    console.log('[Search] Initializing search indexes...');
    
    try {
      // Index products
      const allProducts = await db.select().from(products);
      for (const product of allProducts) {
        this.productIndex.indexDocument(product.id, product);
      }

      // Index shows
      const shows = await db.select().from(liveShows);
      for (const show of shows) {
        this.showIndex.indexDocument(show.id, show);
      }

      console.log(`[Search] Indexed ${allProducts.length} products and ${shows.length} shows`);
    } catch (error) {
      console.error('[Search] Failed to initialize indexes:', error);
    }
  }

  // Search products
  async searchProducts(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();

    // Use search index for text search
    const indexed = this.productIndex.search(query.q, 1000);
    const productIds = indexed.map(i => i.id);

    // Build database query with filters
    let dbQuery = db.select().from(products);

    // Apply ID filter from text search
    if (productIds.length > 0) {
      dbQuery = dbQuery.where(inArray(products.id, productIds)) as any;
    }

    // Apply additional filters
    if (query.filters) {
      const conditions = [];

      if (query.filters.categories && query.filters.categories.length > 0) {
        conditions.push(inArray(products.category, query.filters.categories));
      }

      if (query.filters.priceMin !== undefined) {
        conditions.push(gte(products.price, query.filters.priceMin));
      }

      if (query.filters.priceMax !== undefined) {
        conditions.push(lte(products.price, query.filters.priceMax));
      }

      if (query.filters.inStock) {
        conditions.push(gte(products.stock, 1));
      }

      if (conditions.length > 0) {
        dbQuery = dbQuery.where(and(...conditions)) as any;
      }
    }

    // Execute query
    const results = await dbQuery;

    // Sort results
    let sorted = results;
    if (query.sort) {
      sorted = this.sortResults(results, query.sort, indexed);
    } else {
      // Sort by relevance (from search index)
      const scoreMap = new Map(indexed.map(i => [i.id, i.score]));
      sorted = results.sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0));
    }

    // Pagination
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const start = (page - 1) * pageSize;
    const paginatedResults = sorted.slice(start, start + pageSize);

    // Generate facets
    const facets = query.facets ? this.generateFacets(results, query.facets) : undefined;

    // Generate suggestions
    const suggestions = this.generateSuggestions(query.q);

    // Record search analytics
    this.recordSearch(query.q, results.length);

    const took = Date.now() - startTime;

    return {
      items: paginatedResults,
      total: sorted.length,
      page,
      pageSize,
      totalPages: Math.ceil(sorted.length / pageSize),
      facets,
      suggestions,
      took
    };
  }

  // Search live shows
  async searchShows(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();

    // Use search index
    const indexed = this.showIndex.search(query.q, 1000);
    const showIds = indexed.map(i => i.id);

    // Build database query
    let dbQuery = db.select().from(liveShows);

    if (showIds.length > 0) {
      dbQuery = dbQuery.where(inArray(liveShows.id, showIds)) as any;
    }

    // Execute query
    const results = await dbQuery;

    // Sort by relevance
    const scoreMap = new Map(indexed.map(i => [i.id, i.score]));
    const sorted = results.sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0));

    // Pagination
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const start = (page - 1) * pageSize;
    const paginatedResults = sorted.slice(start, start + pageSize);

    const took = Date.now() - startTime;

    return {
      items: paginatedResults,
      total: sorted.length,
      page,
      pageSize,
      totalPages: Math.ceil(sorted.length / pageSize),
      took
    };
  }

  // Autocomplete
  async autocomplete(query: string, limit: number = 5): Promise<AutocompleteResult> {
    const suggestions = this.generateSuggestions(query, limit);

    // Get top matching products
    const indexed = this.productIndex.search(query, 5);
    const productIds = indexed.map(i => i.id);

    let topProducts: any[] = [];
    if (productIds.length > 0) {
      topProducts = await db.select().from(products).where(inArray(products.id, productIds));
    }

    // Extract categories
    const categories = [...new Set(topProducts.map(p => p.category))].slice(0, 3);

    return {
      suggestions,
      products: topProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl
      })),
      categories
    };
  }

  // Sort results
  private sortResults(results: any[], sort: SearchSort, indexed: IndexedDocument[]): any[] {
    const scoreMap = new Map(indexed.map(i => [i.id, i.score]));

    return results.sort((a, b) => {
      let aVal, bVal;

      switch (sort.field) {
        case 'relevance':
          aVal = scoreMap.get(a.id) || 0;
          bVal = scoreMap.get(b.id) || 0;
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'rating':
          aVal = a.rating || 0;
          bVal = b.rating || 0;
          break;
        case 'date':
          aVal = a.createdAt.getTime();
          bVal = b.createdAt.getTime();
          break;
        case 'popularity':
          aVal = a.views || 0;
          bVal = b.views || 0;
          break;
        default:
          return 0;
      }

      return sort.order === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }

  // Generate facets
  private generateFacets(results: any[], facetFields: string[]): SearchFacets {
    const facets: SearchFacets = {};

    if (facetFields.includes('categories')) {
      const categoryCount = new Map<string, number>();
      for (const item of results) {
        const count = categoryCount.get(item.category) || 0;
        categoryCount.set(item.category, count + 1);
      }

      facets.categories = Array.from(categoryCount.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
    }

    if (facetFields.includes('brands')) {
      const brandCount = new Map<string, number>();
      for (const item of results) {
        if (item.brand) {
          const count = brandCount.get(item.brand) || 0;
          brandCount.set(item.brand, count + 1);
        }
      }

      facets.brands = Array.from(brandCount.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
    }

    if (facetFields.includes('priceRanges')) {
      const ranges = [
        { label: 'Under $25', min: 0, max: 25 },
        { label: '$25 - $50', min: 25, max: 50 },
        { label: '$50 - $100', min: 50, max: 100 },
        { label: '$100 - $200', min: 100, max: 200 },
        { label: 'Over $200', min: 200, max: Infinity }
      ];

      facets.priceRanges = ranges.map(range => ({
        value: range.label,
        count: results.filter(item => item.price >= range.min && item.price < range.max).length
      }));
    }

    if (facetFields.includes('ratings')) {
      facets.ratings = [5, 4, 3, 2, 1].map(rating => ({
        value: `${rating} stars & up`,
        count: results.filter(item => (item.rating || 0) >= rating).length
      }));
    }

    return facets;
  }

  // Generate search suggestions
  private generateSuggestions(query: string, limit: number = 5): string[] {
    const queryLower = query.toLowerCase();
    const suggestions: Array<{ text: string; score: number }> = [];

    // Get popular queries that match
    for (const [popularQuery, count] of this.popularQueries.entries()) {
      if (popularQuery.toLowerCase().includes(queryLower)) {
        suggestions.push({
          text: popularQuery,
          score: count
        });
      }
    }

    // Sort by popularity and return top results
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.text);
  }

  // Record search
  private recordSearch(query: string, results: number, userId?: string) {
    const analytics: SearchAnalytics = {
      query,
      results,
      timestamp: new Date(),
      userId
    };

    this.searchHistory.push(analytics);

    // Update popular queries
    const count = this.popularQueries.get(query) || 0;
    this.popularQueries.set(query, count + 1);

    // Keep only last 10000 searches
    if (this.searchHistory.length > 10000) {
      this.searchHistory.shift();
    }
  }

  // Get search analytics
  getSearchAnalytics(filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    userId?: string;
  }): {
    totalSearches: number;
    uniqueQueries: number;
    averageResults: number;
    topQueries: Array<{ query: string; count: number }>;
    zeroResultQueries: string[];
  } {
    let filtered = this.searchHistory;

    if (filters?.dateFrom) {
      filtered = filtered.filter(s => s.timestamp >= filters.dateFrom!);
    }

    if (filters?.dateTo) {
      filtered = filtered.filter(s => s.timestamp <= filters.dateTo!);
    }

    if (filters?.userId) {
      filtered = filtered.filter(s => s.userId === filters.userId);
    }

    const uniqueQueries = new Set(filtered.map(s => s.query)).size;
    const averageResults = filtered.reduce((sum, s) => sum + s.results, 0) / filtered.length || 0;

    const topQueries = Array.from(this.popularQueries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    const zeroResultQueries = filtered
      .filter(s => s.results === 0)
      .map(s => s.query)
      .filter((q, i, arr) => arr.indexOf(q) === i)
      .slice(0, 20);

    return {
      totalSearches: filtered.length,
      uniqueQueries,
      averageResults,
      topQueries,
      zeroResultQueries
    };
  }

  // Get popular searches
  getPopularSearches(limit: number = 10): Array<{ query: string; count: number }> {
    return Array.from(this.popularQueries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));
  }

  // Get trending searches
  getTrendingSearches(hours: number = 24, limit: number = 10): Array<{ query: string; count: number }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recent = this.searchHistory.filter(s => s.timestamp >= since);

    const counts = new Map<string, number>();
    for (const search of recent) {
      counts.set(search.query, (counts.get(search.query) || 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));
  }

  // Reindex product
  reindexProduct(product: any) {
    this.productIndex.removeDocument(product.id);
    this.productIndex.indexDocument(product.id, product);
  }

  // Reindex show
  reindexShow(show: any) {
    this.showIndex.removeDocument(show.id);
    this.showIndex.indexDocument(show.id, show);
  }

  // Get index stats
  getIndexStats() {
    return {
      products: this.productIndex.size(),
      shows: this.showIndex.size(),
      totalSearches: this.searchHistory.length,
      uniqueQueries: this.popularQueries.size
    };
  }
}

// ============================================================================
// SEARCH FILTERS BUILDER
// ============================================================================

class SearchFiltersBuilder {
  private filters: SearchFilters = {};

  // Add category filter
  categories(categories: string[]): this {
    this.filters.categories = categories;
    return this;
  }

  // Add price range filter
  priceRange(min?: number, max?: number): this {
    if (min !== undefined) this.filters.priceMin = min;
    if (max !== undefined) this.filters.priceMax = max;
    return this;
  }

  // Add brands filter
  brands(brands: string[]): this {
    this.filters.brands = brands;
    return this;
  }

  // Add ratings filter
  ratings(ratings: number[]): this {
    this.filters.ratings = ratings;
    return this;
  }

  // Add in stock filter
  inStock(inStock: boolean = true): this {
    this.filters.inStock = inStock;
    return this;
  }

  // Add tags filter
  tags(tags: string[]): this {
    this.filters.tags = tags;
    return this;
  }

  // Add date range filter
  dateRange(from?: Date, to?: Date): this {
    if (from) this.filters.dateFrom = from;
    if (to) this.filters.dateTo = to;
    return this;
  }

  // Build filters
  build(): SearchFilters {
    return this.filters;
  }
}

// ============================================================================
// SEARCH QUERY BUILDER
// ============================================================================

class SearchQueryBuilder {
  private query: SearchQuery = { q: '' };

  // Set search query
  search(q: string): this {
    this.query.q = q;
    return this;
  }

  // Set filters
  filters(filters: SearchFilters): this {
    this.query.filters = filters;
    return this;
  }

  // Set sort
  sort(field: SearchSort['field'], order: SearchSort['order'] = 'desc'): this {
    this.query.sort = { field, order };
    return this;
  }

  // Set pagination
  page(page: number, pageSize: number = 20): this {
    this.query.page = page;
    this.query.pageSize = pageSize;
    return this;
  }

  // Set facets
  facets(facets: string[]): this {
    this.query.facets = facets;
    return this;
  }

  // Build query
  build(): SearchQuery {
    return this.query;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const searchEngine = new SearchEngine();

// Helper functions
export async function searchProducts(query: SearchQuery): Promise<SearchResult> {
  return await searchEngine.searchProducts(query);
}

export async function searchShows(query: SearchQuery): Promise<SearchResult> {
  return await searchEngine.searchShows(query);
}

export async function autocomplete(query: string, limit?: number): Promise<AutocompleteResult> {
  return await searchEngine.autocomplete(query, limit);
}

export function createSearchQuery(): SearchQueryBuilder {
  return new SearchQueryBuilder();
}

export function createSearchFilters(): SearchFiltersBuilder {
  return new SearchFiltersBuilder();
}

export function getSearchAnalytics(filters?: any) {
  return searchEngine.getSearchAnalytics(filters);
}

export function getPopularSearches(limit?: number) {
  return searchEngine.getPopularSearches(limit);
}

export function getTrendingSearches(hours?: number, limit?: number) {
  return searchEngine.getTrendingSearches(hours, limit);
}
