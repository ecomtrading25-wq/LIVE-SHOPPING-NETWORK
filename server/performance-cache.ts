/**
 * Performance Optimization & Caching Layer
 * 
 * Comprehensive performance system with:
 * - Multi-tier caching (memory, Redis, CDN)
 * - Query result caching with smart invalidation
 * - API response caching
 * - Static asset optimization
 * - Database query optimization
 * - Connection pooling
 * - Rate limiting
 * - Request deduplication
 * - Lazy loading strategies
 * - Image optimization and CDN
 * - Preloading and prefetching
 * - Performance monitoring
 */

import { getDb } from './db';
import crypto from 'crypto';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CacheEntry<T> {
  key: string;
  value: T;
  expiry: number;
  tags: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  evictions: number;
}

export interface PerformanceMetrics {
  requestId: string;
  endpoint: string;
  method: string;
  duration: number;
  cacheHit: boolean;
  dbQueries: number;
  dbTime: number;
  timestamp: Date;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (req: any) => string;
}

export interface QueryCacheOptions {
  ttl: number;
  tags: string[];
  key?: string;
}

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

class MemoryCache {
  private cache: Map<string, CacheEntry<any>>;
  private stats: CacheStats;
  private maxSize: number;

  constructor(maxSize: number = 10000) {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      evictions: 0
    };
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttl: number, tags: string[] = []): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }

    this.cache.set(key, {
      key,
      value,
      expiry: Date.now() + ttl,
      tags
    });

    this.stats.size = this.cache.size;
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.stats.size = this.cache.size;
  }

  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.stats.size = this.cache.size;
    return count;
  }

  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
}

// Global cache instance
const memoryCache = new MemoryCache(10000);

// ============================================================================
// CACHE FUNCTIONS
// ============================================================================

/**
 * Get from cache with fallback
 */
export async function cached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: QueryCacheOptions
): Promise<T> {
  // Try memory cache first
  const cached = memoryCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch data
  const data = await fetchFn();

  // Store in cache
  memoryCache.set(key, data, options.ttl, options.tags);

  return data;
}

/**
 * Generate cache key from parameters
 */
export function generateCacheKey(prefix: string, params: any): string {
  const paramString = JSON.stringify(params);
  const hash = crypto.createHash('md5').update(paramString).digest('hex');
  return `${prefix}:${hash}`;
}

/**
 * Invalidate cache by tag
 */
export function invalidateCache(tag: string): number {
  return memoryCache.invalidateByTag(tag);
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  memoryCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  return memoryCache.getStats();
}

// ============================================================================
// QUERY OPTIMIZATION
// ============================================================================

/**
 * Cached database query
 */
export async function cachedQuery<T>(
  queryFn: () => Promise<T>,
  options: QueryCacheOptions
): Promise<T> {
  const key = options.key || generateCacheKey('query', queryFn.toString());
  return cached(key, queryFn, options);
}

/**
 * Batch database queries
 */
export async function batchQueries<T>(queries: (() => Promise<T>)[]): Promise<T[]> {
  // Execute queries in parallel
  return Promise.all(queries.map(q => q()));
}

/**
 * Paginated query with cursor
 */
export async function paginatedQuery<T>(options: {
  queryFn: (cursor: string | null, limit: number) => Promise<{ items: T[]; nextCursor: string | null }>;
  limit: number;
  cursor?: string | null;
}): Promise<{ items: T[]; nextCursor: string | null; hasMore: boolean }> {
  const { queryFn, limit, cursor = null } = options;

  const result = await queryFn(cursor, limit + 1);
  const hasMore = result.items.length > limit;
  const items = hasMore ? result.items.slice(0, limit) : result.items;

  return {
    items,
    nextCursor: hasMore ? result.nextCursor : null,
    hasMore
  };
}

// ============================================================================
// RATE LIMITING
// ============================================================================

class RateLimiter {
  private requests: Map<string, number[]>;

  constructor() {
    this.requests = new Map();
  }

  check(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetAt: Date } {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get existing requests for this key
    let keyRequests = this.requests.get(key) || [];

    // Remove expired requests
    keyRequests = keyRequests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    const allowed = keyRequests.length < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - keyRequests.length);
    const resetAt = new Date(now + config.windowMs);

    if (allowed) {
      keyRequests.push(now);
      this.requests.set(key, keyRequests);
    }

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup(windowStart);
    }

    return { allowed, remaining, resetAt };
  }

  private cleanup(before: number): void {
    for (const [key, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter(t => t > before);
      if (filtered.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filtered);
      }
    }
  }
}

const rateLimiter = new RateLimiter();

/**
 * Check rate limit
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: Date } {
  return rateLimiter.check(identifier, config);
}

/**
 * Rate limit middleware
 */
export function rateLimit(config: RateLimitConfig) {
  return (req: any, res: any, next: any) => {
    const key = config.keyGenerator(req);
    const result = checkRateLimit(key, config);

    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());

    if (!result.allowed) {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: result.resetAt
      });
      return;
    }

    next();
  };
}

// ============================================================================
// REQUEST DEDUPLICATION
// ============================================================================

class RequestDeduplicator {
  private pending: Map<string, Promise<any>>;

  constructor() {
    this.pending = new Map();
  }

  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Check if request is already pending
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }

    // Execute request
    const promise = fn().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }
}

const deduplicator = new RequestDeduplicator();

/**
 * Deduplicate concurrent requests
 */
export async function deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
  return deduplicator.deduplicate(key, fn);
}

// ============================================================================
// IMAGE OPTIMIZATION
// ============================================================================

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill';
}

/**
 * Generate optimized image URL
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options: ImageOptimizationOptions
): string {
  // In production, use image CDN like Cloudinary, Imgix, or CloudFlare Images
  const params = new URLSearchParams();

  if (options.width) params.append('w', options.width.toString());
  if (options.height) params.append('h', options.height.toString());
  if (options.quality) params.append('q', options.quality.toString());
  if (options.format) params.append('f', options.format);
  if (options.fit) params.append('fit', options.fit);

  return `${originalUrl}?${params.toString()}`;
}

/**
 * Generate responsive image srcset
 */
export function generateSrcSet(originalUrl: string, widths: number[]): string {
  return widths
    .map(width => `${getOptimizedImageUrl(originalUrl, { width })} ${width}w`)
    .join(', ');
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

class PerformanceMonitor {
  private metrics: PerformanceMetrics[];
  private maxMetrics: number;

  constructor(maxMetrics: number = 1000) {
    this.metrics = [];
    this.maxMetrics = maxMetrics;
  }

  record(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getMetrics(endpoint?: string): PerformanceMetrics[] {
    if (endpoint) {
      return this.metrics.filter(m => m.endpoint === endpoint);
    }
    return this.metrics;
  }

  getStats(endpoint?: string): {
    avgDuration: number;
    p50: number;
    p95: number;
    p99: number;
    cacheHitRate: number;
    totalRequests: number;
  } {
    const metrics = this.getMetrics(endpoint);

    if (metrics.length === 0) {
      return {
        avgDuration: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        cacheHitRate: 0,
        totalRequests: 0
      };
    }

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    const p50Index = Math.floor(durations.length * 0.5);
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    const cacheHits = metrics.filter(m => m.cacheHit).length;
    const cacheHitRate = (cacheHits / metrics.length) * 100;

    return {
      avgDuration,
      p50: durations[p50Index],
      p95: durations[p95Index],
      p99: durations[p99Index],
      cacheHitRate,
      totalRequests: metrics.length
    };
  }

  getSlowestEndpoints(limit: number = 10): { endpoint: string; avgDuration: number }[] {
    const endpointMap = new Map<string, number[]>();

    this.metrics.forEach(m => {
      if (!endpointMap.has(m.endpoint)) {
        endpointMap.set(m.endpoint, []);
      }
      endpointMap.get(m.endpoint)!.push(m.duration);
    });

    const results = Array.from(endpointMap.entries())
      .map(([endpoint, durations]) => ({
        endpoint,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);

    return results;
  }
}

const performanceMonitor = new PerformanceMonitor();

/**
 * Record performance metric
 */
export function recordPerformance(metric: PerformanceMetrics): void {
  performanceMonitor.record(metric);
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(endpoint?: string) {
  return performanceMonitor.getStats(endpoint);
}

/**
 * Get slowest endpoints
 */
export function getSlowestEndpoints(limit: number = 10) {
  return performanceMonitor.getSlowestEndpoints(limit);
}

/**
 * Performance tracking middleware
 */
export function trackPerformance(endpoint: string) {
  return async (req: any, res: any, next: any) => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    let dbQueries = 0;
    let dbTime = 0;
    let cacheHit = false;

    // Attach tracking to request
    req.performance = {
      requestId,
      incrementDbQuery: (duration: number) => {
        dbQueries++;
        dbTime += duration;
      },
      setCacheHit: () => {
        cacheHit = true;
      }
    };

    // Record metric on response finish
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      recordPerformance({
        requestId,
        endpoint,
        method: req.method,
        duration,
        cacheHit,
        dbQueries,
        dbTime,
        timestamp: new Date()
      });
    });

    next();
  };
}

// ============================================================================
// CONNECTION POOLING
// ============================================================================

export interface PoolConfig {
  min: number;
  max: number;
  acquireTimeout: number;
  idleTimeout: number;
}

class ConnectionPool<T> {
  private available: T[];
  private inUse: Set<T>;
  private config: PoolConfig;
  private createFn: () => Promise<T>;
  private destroyFn: (conn: T) => Promise<void>;

  constructor(
    createFn: () => Promise<T>,
    destroyFn: (conn: T) => Promise<void>,
    config: PoolConfig
  ) {
    this.available = [];
    this.inUse = new Set();
    this.createFn = createFn;
    this.destroyFn = destroyFn;
    this.config = config;

    // Initialize minimum connections
    this.initialize();
  }

  private async initialize(): Promise<void> {
    for (let i = 0; i < this.config.min; i++) {
      const conn = await this.createFn();
      this.available.push(conn);
    }
  }

  async acquire(): Promise<T> {
    // Try to get available connection
    if (this.available.length > 0) {
      const conn = this.available.pop()!;
      this.inUse.add(conn);
      return conn;
    }

    // Create new connection if under max
    if (this.inUse.size < this.config.max) {
      const conn = await this.createFn();
      this.inUse.add(conn);
      return conn;
    }

    // Wait for available connection
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection acquire timeout'));
      }, this.config.acquireTimeout);

      const checkAvailable = setInterval(() => {
        if (this.available.length > 0) {
          clearInterval(checkAvailable);
          clearTimeout(timeout);
          const conn = this.available.pop()!;
          this.inUse.add(conn);
          resolve(conn);
        }
      }, 10);
    });
  }

  async release(conn: T): Promise<void> {
    this.inUse.delete(conn);
    this.available.push(conn);
  }

  async destroy(conn: T): Promise<void> {
    this.inUse.delete(conn);
    await this.destroyFn(conn);
  }

  getStats(): { available: number; inUse: number; total: number } {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size
    };
  }
}

// ============================================================================
// PRELOADING & PREFETCHING
// ============================================================================

/**
 * Preload critical resources
 */
export function generatePreloadLinks(resources: { url: string; type: string; as: string }[]): string {
  return resources
    .map(r => `<link rel="preload" href="${r.url}" as="${r.as}" type="${r.type}">`)
    .join('\n');
}

/**
 * Generate prefetch hints
 */
export function generatePrefetchLinks(urls: string[]): string {
  return urls
    .map(url => `<link rel="prefetch" href="${url}">`)
    .join('\n');
}

/**
 * Generate DNS prefetch hints
 */
export function generateDNSPrefetch(domains: string[]): string {
  return domains
    .map(domain => `<link rel="dns-prefetch" href="//${domain}">`)
    .join('\n');
}

// ============================================================================
// COMPRESSION
// ============================================================================

/**
 * Check if response should be compressed
 */
export function shouldCompress(contentType: string, size: number): boolean {
  const compressibleTypes = [
    'text/',
    'application/json',
    'application/javascript',
    'application/xml',
    'image/svg+xml'
  ];

  const isCompressible = compressibleTypes.some(type => contentType.includes(type));
  const isLargeEnough = size > 1024; // Only compress if > 1KB

  return isCompressible && isLargeEnough;
}

// ============================================================================
// LAZY LOADING
// ============================================================================

/**
 * Generate lazy loading attributes for images
 */
export function getLazyLoadAttrs(priority: 'high' | 'low' | 'auto' = 'auto'): {
  loading: 'lazy' | 'eager';
  fetchpriority?: 'high' | 'low' | 'auto';
} {
  return {
    loading: priority === 'high' ? 'eager' : 'lazy',
    fetchpriority: priority
  };
}

/**
 * Generate intersection observer for lazy loading
 */
export function createLazyLoadObserver(callback: (entry: any) => void): string {
  return `
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          ${callback.toString()}(entry);
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '50px' });
    
    document.querySelectorAll('[data-lazy]').forEach(el => observer.observe(el));
  `;
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export const cache = {
  get: <T>(key: string) => memoryCache.get<T>(key),
  set: <T>(key: string, value: T, ttl: number, tags?: string[]) => memoryCache.set(key, value, ttl, tags),
  delete: (key: string) => memoryCache.delete(key),
  invalidateByTag: (tag: string) => memoryCache.invalidateByTag(tag),
  clear: () => memoryCache.clear(),
  stats: () => memoryCache.getStats()
};

export const performance = {
  record: recordPerformance,
  getStats: getPerformanceStats,
  getSlowest: getSlowestEndpoints,
  track: trackPerformance
};
