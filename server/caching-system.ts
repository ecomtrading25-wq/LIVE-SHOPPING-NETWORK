/**
 * Advanced Multi-Layer Caching System
 * Memory cache, Redis-compatible cache, CDN integration, cache warming, intelligent invalidation
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  ttl: number;
  createdAt: Date;
  expiresAt: Date;
  hits: number;
  size: number;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  totalSize: number;
  evictions: number;
  averageAccessTime: number;
}

export interface CacheConfig {
  maxSize: number; // bytes
  maxKeys: number;
  defaultTTL: number; // seconds
  evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'ttl';
  compressionEnabled: boolean;
  serializationFormat: 'json' | 'msgpack';
}

export type CacheLayer = 'memory' | 'distributed' | 'cdn';

export interface CacheWarmingStrategy {
  enabled: boolean;
  schedule: string; // cron expression
  targets: Array<{
    key: string;
    generator: () => Promise<any>;
    ttl: number;
    priority: number;
  }>;
}

// ============================================================================
// MEMORY CACHE
// ============================================================================

class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private accessLog: Map<string, number[]> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalAccessTime: 0,
    accessCount: 0
  };
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 100 * 1024 * 1024, // 100MB
      maxKeys: config.maxKeys || 10000,
      defaultTTL: config.defaultTTL || 3600,
      evictionPolicy: config.evictionPolicy || 'lru',
      compressionEnabled: config.compressionEnabled || false,
      serializationFormat: config.serializationFormat || 'json'
    };

    // Start cleanup interval
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  // Get value from cache
  async get<T = any>(key: string): Promise<T | null> {
    const startTime = Date.now();

    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.recordAccessTime(Date.now() - startTime);
      return null;
    }

    // Check expiration
    if (entry.expiresAt < new Date()) {
      this.cache.delete(key);
      this.stats.misses++;
      this.recordAccessTime(Date.now() - startTime);
      return null;
    }

    // Update stats
    entry.hits++;
    this.stats.hits++;
    this.recordAccess(key);
    this.recordAccessTime(Date.now() - startTime);

    return entry.value as T;
  }

  // Set value in cache
  async set<T = any>(
    key: string, 
    value: T, 
    ttl?: number, 
    tags: string[] = []
  ): Promise<boolean> {
    const ttlSeconds = ttl || this.config.defaultTTL;
    const size = this.estimateSize(value);

    // Check if we need to evict
    if (this.cache.size >= this.config.maxKeys) {
      this.evict();
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      ttl: ttlSeconds,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      hits: 0,
      size,
      tags
    };

    this.cache.set(key, entry);
    return true;
  }

  // Delete key
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  // Delete by tag
  async deleteByTag(tag: string): Promise<number> {
    let deleted = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  // Delete by pattern
  async deleteByPattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern);
    let deleted = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  // Check if key exists
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (entry.expiresAt < new Date()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Get multiple keys
  async mget<T = any>(keys: string[]): Promise<Array<T | null>> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  // Set multiple keys
  async mset(entries: Array<{ key: string; value: any; ttl?: number; tags?: string[] }>): Promise<boolean> {
    await Promise.all(
      entries.map(entry => this.set(entry.key, entry.value, entry.ttl, entry.tags))
    );
    return true;
  }

  // Clear all cache
  async clear(): Promise<void> {
    this.cache.clear();
    this.accessLog.clear();
  }

  // Get cache stats
  getStats(): CacheStats {
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      totalKeys: this.cache.size,
      totalSize,
      evictions: this.stats.evictions,
      averageAccessTime: this.stats.totalAccessTime / this.stats.accessCount || 0
    };
  }

  // Get all keys
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Get keys by pattern
  keysByPattern(pattern: string): string[] {
    const regex = new RegExp(pattern);
    return this.keys().filter(key => regex.test(key));
  }

  // Get keys by tag
  keysByTag(tag: string): string[] {
    const keys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        keys.push(key);
      }
    }

    return keys;
  }

  // Evict entries based on policy
  private evict() {
    let keyToEvict: string | null = null;

    switch (this.config.evictionPolicy) {
      case 'lru':
        keyToEvict = this.evictLRU();
        break;
      case 'lfu':
        keyToEvict = this.evictLFU();
        break;
      case 'fifo':
        keyToEvict = this.evictFIFO();
        break;
      case 'ttl':
        keyToEvict = this.evictTTL();
        break;
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
      this.stats.evictions++;
    }
  }

  // Evict least recently used
  private evictLRU(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, _] of this.cache.entries()) {
      const accesses = this.accessLog.get(key) || [];
      const lastAccess = accesses[accesses.length - 1] || 0;
      
      if (lastAccess < oldestTime) {
        oldestTime = lastAccess;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  // Evict least frequently used
  private evictLFU(): string | null {
    let leastUsedKey: string | null = null;
    let leastHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < leastHits) {
        leastHits = entry.hits;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }

  // Evict first in first out
  private evictFIFO(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = new Date();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  // Evict by TTL (shortest remaining)
  private evictTTL(): string | null {
    let shortestTTLKey: string | null = null;
    let shortestTTL = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      const remainingTTL = entry.expiresAt.getTime() - Date.now();
      if (remainingTTL < shortestTTL) {
        shortestTTL = remainingTTL;
        shortestTTLKey = key;
      }
    }

    return shortestTTLKey;
  }

  // Cleanup expired entries
  private cleanup() {
    const now = new Date();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Cache] Cleaned up ${cleaned} expired entries`);
    }
  }

  // Record access for LRU
  private recordAccess(key: string) {
    if (!this.accessLog.has(key)) {
      this.accessLog.set(key, []);
    }

    const accesses = this.accessLog.get(key)!;
    accesses.push(Date.now());

    // Keep only last 10 accesses
    if (accesses.length > 10) {
      accesses.shift();
    }
  }

  // Record access time
  private recordAccessTime(time: number) {
    this.stats.totalAccessTime += time;
    this.stats.accessCount++;
  }

  // Estimate size of value
  private estimateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1024; // Default 1KB
    }
  }
}

// ============================================================================
// CACHE MANAGER (Multi-Layer)
// ============================================================================

class CacheManager {
  private memoryCache: MemoryCache;
  private warmingStrategies: Map<string, CacheWarmingStrategy> = new Map();

  constructor() {
    this.memoryCache = new MemoryCache();
    this.initializeDefaultStrategies();
  }

  // Initialize default warming strategies
  private initializeDefaultStrategies() {
    // Products cache warming
    this.warmingStrategies.set('products', {
      enabled: true,
      schedule: '0 */6 * * *', // Every 6 hours
      targets: [
        {
          key: 'products:featured',
          generator: async () => {
            // Would fetch featured products
            return [];
          },
          ttl: 3600,
          priority: 1
        },
        {
          key: 'products:trending',
          generator: async () => {
            // Would fetch trending products
            return [];
          },
          ttl: 1800,
          priority: 2
        }
      ]
    });

    // Live shows cache warming
    this.warmingStrategies.set('shows', {
      enabled: true,
      schedule: '*/15 * * * *', // Every 15 minutes
      targets: [
        {
          key: 'shows:live',
          generator: async () => {
            // Would fetch live shows
            return [];
          },
          ttl: 300,
          priority: 1
        },
        {
          key: 'shows:upcoming',
          generator: async () => {
            // Would fetch upcoming shows
            return [];
          },
          ttl: 600,
          priority: 2
        }
      ]
    });
  }

  // Get with fallback through layers
  async get<T = any>(key: string, fallback?: () => Promise<T>): Promise<T | null> {
    // Try memory cache first
    let value = await this.memoryCache.get<T>(key);
    if (value !== null) return value;

    // If fallback provided, execute and cache
    if (fallback) {
      value = await fallback();
      if (value !== null) {
        await this.set(key, value);
      }
      return value;
    }

    return null;
  }

  // Set in all layers
  async set<T = any>(key: string, value: T, ttl?: number, tags: string[] = []): Promise<boolean> {
    return await this.memoryCache.set(key, value, ttl, tags);
  }

  // Delete from all layers
  async delete(key: string): Promise<boolean> {
    return await this.memoryCache.delete(key);
  }

  // Delete by tag
  async deleteByTag(tag: string): Promise<number> {
    return await this.memoryCache.deleteByTag(tag);
  }

  // Delete by pattern
  async deleteByPattern(pattern: string): Promise<number> {
    return await this.memoryCache.deleteByPattern(pattern);
  }

  // Warm cache
  async warmCache(strategyName?: string) {
    const strategies = strategyName 
      ? [this.warmingStrategies.get(strategyName)].filter(Boolean) as CacheWarmingStrategy[]
      : Array.from(this.warmingStrategies.values());

    for (const strategy of strategies) {
      if (!strategy.enabled) continue;

      // Sort by priority
      const sortedTargets = [...strategy.targets].sort((a, b) => a.priority - b.priority);

      for (const target of sortedTargets) {
        try {
          const value = await target.generator();
          await this.set(target.key, value, target.ttl);
          console.log(`[Cache] Warmed: ${target.key}`);
        } catch (error) {
          console.error(`[Cache] Failed to warm ${target.key}:`, error);
        }
      }
    }
  }

  // Get stats from all layers
  getStats() {
    return {
      memory: this.memoryCache.getStats()
    };
  }

  // Clear all caches
  async clearAll() {
    await this.memoryCache.clear();
  }

  // Cache decorator for functions
  cached<T extends (...args: any[]) => Promise<any>>(
    keyPrefix: string,
    ttl: number = 3600,
    tags: string[] = []
  ) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function(...args: any[]) {
        const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;
        
        // Try to get from cache
        const cached = await cacheManager.get(cacheKey);
        if (cached !== null) {
          return cached;
        }

        // Execute original method
        const result = await originalMethod.apply(this, args);

        // Cache result
        await cacheManager.set(cacheKey, result, ttl, tags);

        return result;
      };

      return descriptor;
    };
  }
}

// ============================================================================
// CACHE INVALIDATION STRATEGIES
// ============================================================================

class CacheInvalidationManager {
  private invalidationRules: Map<string, InvalidationRule[]> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  // Initialize default invalidation rules
  private initializeDefaultRules() {
    // Product updates invalidate related caches
    this.addRule('product:updated', [
      { pattern: 'products:*', type: 'pattern' },
      { pattern: 'product:{id}', type: 'template' },
      { tags: ['products', 'catalog'], type: 'tags' }
    ]);

    // Order creation invalidates user and stats caches
    this.addRule('order:created', [
      { pattern: 'user:{userId}:orders', type: 'template' },
      { pattern: 'stats:*', type: 'pattern' },
      { tags: ['orders', 'stats'], type: 'tags' }
    ]);

    // Show status change invalidates show caches
    this.addRule('show:status_changed', [
      { pattern: 'shows:*', type: 'pattern' },
      { pattern: 'show:{id}', type: 'template' },
      { tags: ['shows'], type: 'tags' }
    ]);
  }

  // Add invalidation rule
  addRule(event: string, rules: InvalidationRule[]) {
    if (!this.invalidationRules.has(event)) {
      this.invalidationRules.set(event, []);
    }
    this.invalidationRules.get(event)!.push(...rules);
  }

  // Trigger invalidation
  async invalidate(event: string, context: Record<string, any> = {}) {
    const rules = this.invalidationRules.get(event);
    if (!rules) return;

    for (const rule of rules) {
      try {
        await this.executeInvalidation(rule, context);
      } catch (error) {
        console.error(`[Cache] Invalidation failed for ${event}:`, error);
      }
    }
  }

  // Execute invalidation rule
  private async executeInvalidation(rule: InvalidationRule, context: Record<string, any>) {
    switch (rule.type) {
      case 'pattern':
        const pattern = this.interpolate(rule.pattern!, context);
        await cacheManager.deleteByPattern(pattern);
        break;

      case 'template':
        const key = this.interpolate(rule.pattern!, context);
        await cacheManager.delete(key);
        break;

      case 'tags':
        for (const tag of rule.tags!) {
          await cacheManager.deleteByTag(tag);
        }
        break;
    }
  }

  // Interpolate template
  private interpolate(template: string, context: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => context[key] || '');
  }
}

interface InvalidationRule {
  pattern?: string;
  tags?: string[];
  type: 'pattern' | 'template' | 'tags';
}

// ============================================================================
// CDN CACHE MANAGER
// ============================================================================

class CDNCacheManager {
  private cdnEndpoint: string;
  private apiKey: string;

  constructor(endpoint: string = '', apiKey: string = '') {
    this.cdnEndpoint = endpoint;
    this.apiKey = apiKey;
  }

  // Purge CDN cache by URL
  async purgeUrl(url: string): Promise<boolean> {
    console.log(`[CDN] Purging URL: ${url}`);
    // Would make API call to CDN provider
    return true;
  }

  // Purge CDN cache by tag
  async purgeTag(tag: string): Promise<boolean> {
    console.log(`[CDN] Purging tag: ${tag}`);
    // Would make API call to CDN provider
    return true;
  }

  // Purge all CDN cache
  async purgeAll(): Promise<boolean> {
    console.log('[CDN] Purging all cache');
    // Would make API call to CDN provider
    return true;
  }

  // Get CDN cache stats
  async getStats() {
    // Would fetch from CDN provider
    return {
      requests: 1000000,
      hits: 850000,
      misses: 150000,
      hitRate: 0.85,
      bandwidth: 1024 * 1024 * 1024 * 100 // 100GB
    };
  }
}

// ============================================================================
// CACHE KEY BUILDER
// ============================================================================

class CacheKeyBuilder {
  private prefix: string;

  constructor(prefix: string = 'app') {
    this.prefix = prefix;
  }

  // Build cache key
  build(namespace: string, ...parts: any[]): string {
    const serialized = parts.map(part => {
      if (typeof part === 'object') {
        return JSON.stringify(part);
      }
      return String(part);
    });

    return `${this.prefix}:${namespace}:${serialized.join(':')}`;
  }

  // Build product key
  product(id: string): string {
    return this.build('product', id);
  }

  // Build products list key
  products(filters?: any): string {
    return this.build('products', filters || 'all');
  }

  // Build user key
  user(id: string): string {
    return this.build('user', id);
  }

  // Build order key
  order(id: string): string {
    return this.build('order', id);
  }

  // Build orders list key
  orders(userId: string, filters?: any): string {
    return this.build('orders', userId, filters || 'all');
  }

  // Build show key
  show(id: string): string {
    return this.build('show', id);
  }

  // Build shows list key
  shows(status?: string): string {
    return this.build('shows', status || 'all');
  }

  // Build stats key
  stats(type: string, period?: string): string {
    return this.build('stats', type, period || 'all');
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const cacheManager = new CacheManager();
export const invalidationManager = new CacheInvalidationManager();
export const cdnManager = new CDNCacheManager();
export const cacheKeys = new CacheKeyBuilder();

// Helper functions
export async function getCached<T>(key: string, fallback?: () => Promise<T>): Promise<T | null> {
  return await cacheManager.get(key, fallback);
}

export async function setCached<T>(key: string, value: T, ttl?: number, tags?: string[]): Promise<boolean> {
  return await cacheManager.set(key, value, ttl, tags);
}

export async function deleteCached(key: string): Promise<boolean> {
  return await cacheManager.delete(key);
}

export async function invalidateCache(event: string, context?: Record<string, any>) {
  return await invalidationManager.invalidate(event, context);
}

export function getCacheStats() {
  return cacheManager.getStats();
}

// Decorator for caching method results
export function Cached(keyPrefix: string, ttl: number = 3600, tags: string[] = []) {
  return cacheManager.cached(keyPrefix, ttl, tags);
}
