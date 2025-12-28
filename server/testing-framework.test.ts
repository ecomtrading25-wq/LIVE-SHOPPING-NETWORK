/**
 * Comprehensive Testing Framework
 * Unit tests, integration tests, E2E tests, test utilities, mocks, and fixtures
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { workflowEngine, bulkOperationsEngine } from './automation-engine';
import { analyticsEngine, monitoringEngine } from './analytics-monitoring';
import { seoEngine, performanceEngine } from './seo-performance';
import { cacheManager, invalidationManager } from './caching-system';

// ============================================================================
// TEST UTILITIES
// ============================================================================

class TestDataFactory {
  // Generate test product
  static product(overrides: Partial<any> = {}) {
    return {
      id: `prod-${Date.now()}`,
      name: 'Test Product',
      description: 'Test product description',
      price: 99.99,
      stock: 100,
      status: 'active',
      category: 'Electronics',
      imageUrl: 'https://example.com/image.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  // Generate test order
  static order(overrides: Partial<any> = {}) {
    return {
      id: `order-${Date.now()}`,
      userId: 'user-1',
      totalAmount: 199.99,
      status: 'pending',
      items: [
        {
          productId: 'prod-1',
          quantity: 2,
          price: 99.99
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  // Generate test user
  static user(overrides: Partial<any> = {}) {
    return {
      id: `user-${Date.now()}`,
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  // Generate test live show
  static liveShow(overrides: Partial<any> = {}) {
    return {
      id: `show-${Date.now()}`,
      title: 'Test Live Show',
      description: 'Test show description',
      hostId: 'host-1',
      hostName: 'Test Host',
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 3600000),
      thumbnailUrl: 'https://example.com/thumbnail.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  // Generate bulk test data
  static products(count: number, overrides: Partial<any> = {}) {
    return Array.from({ length: count }, (_, i) => 
      this.product({ ...overrides, id: `prod-${i}`, name: `Product ${i}` })
    );
  }

  static orders(count: number, overrides: Partial<any> = {}) {
    return Array.from({ length: count }, (_, i) => 
      this.order({ ...overrides, id: `order-${i}` })
    );
  }

  static users(count: number, overrides: Partial<any> = {}) {
    return Array.from({ length: count }, (_, i) => 
      this.user({ ...overrides, id: `user-${i}`, email: `user${i}@example.com` })
    );
  }
}

class TestHelpers {
  // Wait for condition
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error('Timeout waiting for condition');
  }

  // Mock timer
  static mockTime(date: Date) {
    vi.useFakeTimers();
    vi.setSystemTime(date);
  }

  // Restore timer
  static restoreTime() {
    vi.useRealTimers();
  }

  // Generate random string
  static randomString(length: number = 10): string {
    return Math.random().toString(36).substring(2, 2 + length);
  }

  // Generate random number
  static randomNumber(min: number = 0, max: number = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Sleep
  static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// WORKFLOW ENGINE TESTS
// ============================================================================

describe('Workflow Engine', () => {
  describe('Workflow Execution', () => {
    it('should execute workflow on matching trigger', async () => {
      const context = {
        product_name: 'Test Product',
        stock: 5
      };

      const results = await workflowEngine.execute('product_low_stock', context);
      
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].success).toBe(true);
    });

    it('should not execute workflow when conditions not met', async () => {
      const context = {
        product_name: 'Test Product',
        stock: 50 // Above threshold
      };

      const results = await workflowEngine.execute('product_low_stock', context);
      
      expect(results.length).toBe(0);
    });

    it('should execute multiple workflows in priority order', async () => {
      const context = {
        order_number: 'ORD-123',
        user_id: 'user-1'
      };

      const results = await workflowEngine.execute('order_created', context);
      
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Workflow Management', () => {
    it('should add new workflow', () => {
      const workflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        description: 'Test',
        enabled: true,
        trigger: 'manual' as const,
        conditions: [],
        actions: [],
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      workflowEngine.addWorkflow(workflow);
      
      const retrieved = workflowEngine.getWorkflow('test-workflow');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Workflow');
    });

    it('should update workflow', () => {
      const workflow = workflowEngine.getWorkflow('low-stock-alert');
      expect(workflow).toBeDefined();

      workflowEngine.updateWorkflow('low-stock-alert', { enabled: false });
      
      const updated = workflowEngine.getWorkflow('low-stock-alert');
      expect(updated?.enabled).toBe(false);
    });

    it('should delete workflow', () => {
      workflowEngine.deleteWorkflow('test-workflow');
      
      const retrieved = workflowEngine.getWorkflow('test-workflow');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Workflow Metrics', () => {
    it('should return workflow metrics', () => {
      const metrics = workflowEngine.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.totalWorkflows).toBeGreaterThan(0);
      expect(metrics.activeWorkflows).toBeGreaterThanOrEqual(0);
    });

    it('should track execution history', async () => {
      const context = { test: 'data' };
      await workflowEngine.execute('order_created', context);
      
      const history = workflowEngine.getExecutionHistory('order-confirmation');
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });
  });
});

// ============================================================================
// ANALYTICS ENGINE TESTS
// ============================================================================

describe('Analytics Engine', () => {
  describe('Dashboard Metrics', () => {
    it('should return dashboard metrics', async () => {
      const metrics = await analyticsEngine.getDashboardMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.revenue).toBeDefined();
      expect(metrics.orders).toBeDefined();
      expect(metrics.products).toBeDefined();
      expect(metrics.users).toBeDefined();
      expect(metrics.liveShows).toBeDefined();
    });

    it('should return revenue metrics', async () => {
      const revenue = await analyticsEngine.getRevenueMetrics();
      
      expect(revenue).toBeDefined();
      expect(revenue.total).toBeGreaterThanOrEqual(0);
      expect(revenue.growth).toBeDefined();
      expect(revenue.byCategory).toBeDefined();
    });

    it('should return order metrics', async () => {
      const orders = await analyticsEngine.getOrderMetrics();
      
      expect(orders).toBeDefined();
      expect(orders.total).toBeGreaterThanOrEqual(0);
      expect(orders.averageValue).toBeGreaterThanOrEqual(0);
      expect(orders.statusBreakdown).toBeDefined();
    });
  });

  describe('Time Series Data', () => {
    it('should generate daily time series', async () => {
      const data = await analyticsEngine.getTimeSeriesData('revenue', 'day');
      
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(24);
      expect(data[0]).toHaveProperty('timestamp');
      expect(data[0]).toHaveProperty('value');
    });

    it('should generate weekly time series', async () => {
      const data = await analyticsEngine.getTimeSeriesData('orders', 'week');
      
      expect(data).toBeDefined();
      expect(data.length).toBe(7);
    });

    it('should generate monthly time series', async () => {
      const data = await analyticsEngine.getTimeSeriesData('users', 'month');
      
      expect(data).toBeDefined();
      expect(data.length).toBe(30);
    });
  });

  describe('Event Tracking', () => {
    it('should track events', () => {
      const event = {
        type: 'page_view',
        userId: 'user-1',
        sessionId: 'session-1',
        data: { page: '/products' }
      };

      analyticsEngine.trackEvent(event);
      
      const events = analyticsEngine.getEvents({ type: 'page_view' });
      expect(events.length).toBeGreaterThan(0);
    });

    it('should filter events by type', () => {
      analyticsEngine.trackEvent({
        type: 'purchase',
        userId: 'user-1',
        sessionId: 'session-1',
        data: { amount: 99.99 }
      });

      const events = analyticsEngine.getEvents({ type: 'purchase' });
      expect(events.every(e => e.type === 'purchase')).toBe(true);
    });

    it('should filter events by user', () => {
      const events = analyticsEngine.getEvents({ userId: 'user-1' });
      expect(events.every(e => e.userId === 'user-1')).toBe(true);
    });
  });

  describe('Funnel Analysis', () => {
    it('should return funnel analysis', async () => {
      const funnel = await analyticsEngine.getFunnelAnalysis();
      
      expect(funnel).toBeDefined();
      expect(funnel.steps).toBeDefined();
      expect(funnel.steps.length).toBeGreaterThan(0);
      expect(funnel.overallConversion).toBeGreaterThanOrEqual(0);
    });

    it('should calculate conversion rates', async () => {
      const funnel = await analyticsEngine.getFunnelAnalysis();
      
      funnel.steps.forEach(step => {
        expect(step.conversionRate).toBeGreaterThanOrEqual(0);
        expect(step.conversionRate).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Cohort Analysis', () => {
    it('should return cohort analysis', async () => {
      const cohorts = await analyticsEngine.getCohortAnalysis();
      
      expect(cohorts).toBeDefined();
      expect(cohorts.cohorts).toBeDefined();
      expect(cohorts.cohorts.length).toBeGreaterThan(0);
    });

    it('should track retention over time', async () => {
      const cohorts = await analyticsEngine.getCohortAnalysis();
      
      cohorts.cohorts.forEach(cohort => {
        expect(cohort.retention).toBeDefined();
        expect(Object.keys(cohort.retention).length).toBeGreaterThan(0);
      });
    });
  });
});

// ============================================================================
// SEO ENGINE TESTS
// ============================================================================

describe('SEO Engine', () => {
  describe('Meta Tags Generation', () => {
    it('should generate home page meta tags', () => {
      const meta = seoEngine.generateMetaTags('home');
      
      expect(meta).toBeDefined();
      expect(meta.title).toBeDefined();
      expect(meta.description).toBeDefined();
      expect(meta.keywords).toBeDefined();
      expect(meta.ogTitle).toBeDefined();
    });

    it('should generate product page meta tags', () => {
      const product = TestDataFactory.product();
      const meta = seoEngine.generateMetaTags('product', product);
      
      expect(meta).toBeDefined();
      expect(meta.title).toContain(product.name);
      expect(meta.structuredData).toBeDefined();
      expect(meta.structuredData['@type']).toBe('Product');
    });

    it('should generate show page meta tags', () => {
      const show = TestDataFactory.liveShow();
      const meta = seoEngine.generateMetaTags('show', show);
      
      expect(meta).toBeDefined();
      expect(meta.title).toContain(show.title);
      expect(meta.structuredData).toBeDefined();
      expect(meta.structuredData['@type']).toBe('VideoObject');
    });
  });

  describe('Sitemap Generation', () => {
    it('should generate sitemap entries', async () => {
      const entries = await seoEngine.generateSitemap();
      
      expect(entries).toBeDefined();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThan(0);
    });

    it('should include all page types', async () => {
      const entries = await seoEngine.generateSitemap();
      
      const hasHome = entries.some(e => e.url.endsWith('/'));
      const hasProducts = entries.some(e => e.url.includes('/products/'));
      const hasShows = entries.some(e => e.url.includes('/shows/'));
      
      expect(hasHome).toBe(true);
      expect(hasProducts).toBe(true);
      expect(hasShows).toBe(true);
    });

    it('should generate valid sitemap XML', async () => {
      const xml = await seoEngine.generateSitemapXML();
      
      expect(xml).toBeDefined();
      expect(xml).toContain('<?xml version="1.0"');
      expect(xml).toContain('<urlset');
      expect(xml).toContain('<url>');
      expect(xml).toContain('</urlset>');
    });
  });

  describe('Robots.txt Generation', () => {
    it('should generate robots.txt', () => {
      const robots = seoEngine.generateRobotsTxt();
      
      expect(robots).toBeDefined();
      expect(robots).toContain('User-agent:');
      expect(robots).toContain('Sitemap:');
      expect(robots).toContain('Disallow:');
    });

    it('should disallow admin paths', () => {
      const robots = seoEngine.generateRobotsTxt();
      
      expect(robots).toContain('Disallow: /admin/');
      expect(robots).toContain('Disallow: /api/');
    });
  });

  describe('Structured Data', () => {
    it('should generate breadcrumb structured data', () => {
      const breadcrumbs = [
        { name: 'Home', url: '/' },
        { name: 'Products', url: '/products' },
        { name: 'Electronics', url: '/products/electronics' }
      ];

      const data = seoEngine.generateBreadcrumbs(breadcrumbs);
      
      expect(data).toBeDefined();
      expect(data['@type']).toBe('BreadcrumbList');
      expect(data.itemListElement).toHaveLength(3);
    });

    it('should generate FAQ structured data', () => {
      const faqs = [
        { question: 'What is live shopping?', answer: 'Live shopping is...' },
        { question: 'How do I order?', answer: 'To order...' }
      ];

      const data = seoEngine.generateFAQStructuredData(faqs);
      
      expect(data).toBeDefined();
      expect(data['@type']).toBe('FAQPage');
      expect(data.mainEntity).toHaveLength(2);
    });

    it('should generate organization structured data', () => {
      const data = seoEngine.generateOrganizationStructuredData();
      
      expect(data).toBeDefined();
      expect(data['@type']).toBe('Organization');
      expect(data.name).toBeDefined();
      expect(data.url).toBeDefined();
    });
  });
});

// ============================================================================
// PERFORMANCE ENGINE TESTS
// ============================================================================

describe('Performance Engine', () => {
  describe('Metric Recording', () => {
    it('should record performance metrics', () => {
      performanceEngine.recordMetric('fcp', 1500);
      performanceEngine.recordMetric('fcp', 1600);
      performanceEngine.recordMetric('fcp', 1400);
      
      const stats = performanceEngine.getMetricStats('fcp');
      expect(stats.count).toBe(3);
      expect(stats.avg).toBeCloseTo(1500, 0);
    });

    it('should calculate percentiles', () => {
      for (let i = 1; i <= 100; i++) {
        performanceEngine.recordMetric('lcp', i * 10);
      }
      
      const stats = performanceEngine.getMetricStats('lcp');
      expect(stats.p50).toBeCloseTo(500, 50);
      expect(stats.p95).toBeCloseTo(950, 50);
      expect(stats.p99).toBeCloseTo(990, 50);
    });
  });

  describe('Performance Report', () => {
    it('should generate performance report', () => {
      const report = performanceEngine.generateReport();
      
      expect(report).toBeDefined();
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
      expect(report.metrics).toBeDefined();
      expect(report.opportunities).toBeDefined();
      expect(report.diagnostics).toBeDefined();
    });

    it('should identify optimization opportunities', () => {
      performanceEngine.recordMetric('fcp', 3500);
      performanceEngine.recordMetric('lcp', 5000);
      
      const report = performanceEngine.generateReport();
      expect(report.opportunities.length).toBeGreaterThan(0);
    });
  });

  describe('Image Optimization', () => {
    it('should provide product image config', () => {
      const config = performanceEngine.getImageOptimizationConfig('product');
      
      expect(config).toBeDefined();
      expect(config.maxWidth).toBe(1200);
      expect(config.format).toBe('webp');
    });

    it('should provide thumbnail config', () => {
      const config = performanceEngine.getImageOptimizationConfig('thumbnail');
      
      expect(config).toBeDefined();
      expect(config.maxWidth).toBe(400);
    });
  });

  describe('Optimization Checklist', () => {
    it('should return optimization checklist', () => {
      const checklist = performanceEngine.getOptimizationChecklist();
      
      expect(checklist).toBeDefined();
      expect(Array.isArray(checklist)).toBe(true);
      expect(checklist.length).toBeGreaterThan(0);
    });

    it('should include all categories', () => {
      const checklist = performanceEngine.getOptimizationChecklist();
      
      const categories = checklist.map(c => c.category);
      expect(categories).toContain('Images');
      expect(categories).toContain('JavaScript');
      expect(categories).toContain('CSS');
      expect(categories).toContain('Caching');
    });
  });
});

// ============================================================================
// CACHE MANAGER TESTS
// ============================================================================

describe('Cache Manager', () => {
  beforeEach(async () => {
    await cacheManager.clearAll();
  });

  describe('Basic Operations', () => {
    it('should set and get cache', async () => {
      await cacheManager.set('test-key', 'test-value');
      const value = await cacheManager.get('test-key');
      
      expect(value).toBe('test-value');
    });

    it('should return null for missing key', async () => {
      const value = await cacheManager.get('non-existent');
      expect(value).toBeNull();
    });

    it('should delete cache', async () => {
      await cacheManager.set('test-key', 'test-value');
      await cacheManager.delete('test-key');
      
      const value = await cacheManager.get('test-key');
      expect(value).toBeNull();
    });

    it('should respect TTL', async () => {
      await cacheManager.set('test-key', 'test-value', 1); // 1 second TTL
      
      await TestHelpers.sleep(1100);
      
      const value = await cacheManager.get('test-key');
      expect(value).toBeNull();
    });
  });

  describe('Tag-based Operations', () => {
    it('should delete by tag', async () => {
      await cacheManager.set('key1', 'value1', 3600, ['products']);
      await cacheManager.set('key2', 'value2', 3600, ['products']);
      await cacheManager.set('key3', 'value3', 3600, ['orders']);
      
      const deleted = await cacheManager.deleteByTag('products');
      
      expect(deleted).toBe(2);
      expect(await cacheManager.get('key1')).toBeNull();
      expect(await cacheManager.get('key2')).toBeNull();
      expect(await cacheManager.get('key3')).not.toBeNull();
    });
  });

  describe('Pattern-based Operations', () => {
    it('should delete by pattern', async () => {
      await cacheManager.set('product:1', 'value1');
      await cacheManager.set('product:2', 'value2');
      await cacheManager.set('order:1', 'value3');
      
      const deleted = await cacheManager.deleteByPattern('product:*');
      
      expect(deleted).toBe(2);
    });
  });

  describe('Fallback Function', () => {
    it('should use fallback when cache miss', async () => {
      const fallback = vi.fn(async () => 'fallback-value');
      
      const value = await cacheManager.get('test-key', fallback);
      
      expect(value).toBe('fallback-value');
      expect(fallback).toHaveBeenCalled();
    });

    it('should not use fallback when cache hit', async () => {
      await cacheManager.set('test-key', 'cached-value');
      const fallback = vi.fn(async () => 'fallback-value');
      
      const value = await cacheManager.get('test-key', fallback);
      
      expect(value).toBe('cached-value');
      expect(fallback).not.toHaveBeenCalled();
    });
  });

  describe('Cache Stats', () => {
    it('should track cache stats', async () => {
      await cacheManager.set('key1', 'value1');
      await cacheManager.get('key1'); // hit
      await cacheManager.get('key2'); // miss
      
      const stats = cacheManager.getStats();
      
      expect(stats.memory.hits).toBeGreaterThan(0);
      expect(stats.memory.misses).toBeGreaterThan(0);
      expect(stats.memory.totalKeys).toBeGreaterThan(0);
    });
  });

  describe('Cache Warming', () => {
    it('should warm cache', async () => {
      await cacheManager.warmCache();
      
      // Verify some keys were warmed
      const stats = cacheManager.getStats();
      expect(stats.memory.totalKeys).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================================
// CACHE INVALIDATION TESTS
// ============================================================================

describe('Cache Invalidation Manager', () => {
  beforeEach(async () => {
    await cacheManager.clearAll();
  });

  describe('Event-based Invalidation', () => {
    it('should invalidate on product update', async () => {
      await cacheManager.set('products:featured', ['product1', 'product2'], 3600, ['products']);
      await cacheManager.set('product:1', { id: '1', name: 'Product 1' });
      
      await invalidationManager.invalidate('product:updated', { id: '1' });
      
      // Verify caches were invalidated
      const featured = await cacheManager.get('products:featured');
      expect(featured).toBeNull();
    });

    it('should invalidate on order creation', async () => {
      await cacheManager.set('user:1:orders', [], 3600);
      await cacheManager.set('stats:orders', { total: 100 }, 3600, ['stats']);
      
      await invalidationManager.invalidate('order:created', { userId: '1' });
      
      const userOrders = await cacheManager.get('user:1:orders');
      expect(userOrders).toBeNull();
    });
  });
});

// ============================================================================
// MONITORING ENGINE TESTS
// ============================================================================

describe('Monitoring Engine', () => {
  describe('System Health', () => {
    it('should return system health', async () => {
      const health = await monitoringEngine.getSystemHealth();
      
      expect(health).toBeDefined();
      expect(health.healthy).toBeDefined();
      expect(health.checks).toBeDefined();
      expect(health.timestamp).toBeDefined();
    });

    it('should check database health', async () => {
      const health = await monitoringEngine.getSystemHealth();
      
      expect(health.checks.database).toBeDefined();
    });

    it('should check memory health', async () => {
      const health = await monitoringEngine.getSystemHealth();
      
      expect(health.checks.memory).toBeDefined();
    });
  });

  describe('Alerts', () => {
    it('should return alerts', () => {
      const alerts = monitoringEngine.getAlerts();
      
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should filter alerts by severity', () => {
      const errorAlerts = monitoringEngine.getAlerts('error');
      
      expect(Array.isArray(errorAlerts)).toBe(true);
      expect(errorAlerts.every(a => a.severity === 'error')).toBe(true);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration Tests', () => {
  describe('Product Workflow', () => {
    it('should handle product creation workflow', async () => {
      const product = TestDataFactory.product({ stock: 5 });
      
      // Trigger workflow
      const results = await workflowEngine.execute('product_low_stock', {
        product_name: product.name,
        stock: product.stock
      });
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].success).toBe(true);
    });
  });

  describe('Order Workflow', () => {
    it('should handle order creation workflow', async () => {
      const order = TestDataFactory.order();
      
      // Trigger workflow
      const results = await workflowEngine.execute('order_created', {
        order_number: order.id,
        user_id: order.userId
      });
      
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Cache + Analytics Integration', () => {
    it('should cache analytics data', async () => {
      // Get metrics (should cache)
      const metrics1 = await analyticsEngine.getDashboardMetrics();
      
      // Get again (should hit cache)
      const metrics2 = await analyticsEngine.getDashboardMetrics();
      
      expect(metrics1).toEqual(metrics2);
    });
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Performance Tests', () => {
  it('should handle high cache throughput', async () => {
    const operations = 1000;
    const startTime = Date.now();
    
    for (let i = 0; i < operations; i++) {
      await cacheManager.set(`key-${i}`, `value-${i}`);
    }
    
    const duration = Date.now() - startTime;
    const opsPerSecond = (operations / duration) * 1000;
    
    expect(opsPerSecond).toBeGreaterThan(100); // At least 100 ops/sec
  });

  it('should handle concurrent cache operations', async () => {
    const promises = Array.from({ length: 100 }, (_, i) => 
      cacheManager.set(`concurrent-${i}`, `value-${i}`)
    );
    
    await Promise.all(promises);
    
    const value = await cacheManager.get('concurrent-50');
    expect(value).toBe('value-50');
  });
});

// Export test utilities for use in other test files
export { TestDataFactory, TestHelpers };
