/**
 * SEO and Performance Optimization Engine
 * Handles meta tags, structured data, sitemaps, robots.txt, image optimization, and performance monitoring
 */

import { db } from './db';
import { products, liveShows, users } from '../drizzle/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  robots?: string;
  structuredData?: any;
}

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export interface PerformanceReport {
  score: number;
  metrics: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    ttfb: number; // Time to First Byte
    tti: number; // Time to Interactive
  };
  opportunities: Array<{
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    savings: number; // milliseconds or bytes
  }>;
  diagnostics: Array<{
    title: string;
    description: string;
    severity: 'error' | 'warning' | 'info';
  }>;
}

export interface ImageOptimizationConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'webp' | 'jpeg' | 'png' | 'avif';
  progressive: boolean;
}

// ============================================================================
// SEO ENGINE
// ============================================================================

class SEOEngine {
  private baseUrl: string;
  private siteName: string;
  private defaultImage: string;

  constructor(baseUrl: string = 'https://liveshop.example.com') {
    this.baseUrl = baseUrl;
    this.siteName = 'Live Shopping Network';
    this.defaultImage = `${baseUrl}/og-default.jpg`;
  }

  // Generate meta tags for pages
  generateMetaTags(page: string, data?: any): SEOMetadata {
    switch (page) {
      case 'home':
        return this.getHomeMetadata();
      case 'product':
        return this.getProductMetadata(data);
      case 'show':
        return this.getShowMetadata(data);
      case 'category':
        return this.getCategoryMetadata(data);
      case 'search':
        return this.getSearchMetadata(data);
      default:
        return this.getDefaultMetadata();
    }
  }

  // Home page metadata
  private getHomeMetadata(): SEOMetadata {
    return {
      title: `${this.siteName} - Shop Live, Save Big`,
      description: 'Watch live shopping shows, discover exclusive deals, and shop in real-time with interactive hosts. Join thousands of shoppers finding amazing products daily.',
      keywords: ['live shopping', 'online shopping', 'deals', 'live stream shopping', 'exclusive offers'],
      canonical: this.baseUrl,
      ogTitle: `${this.siteName} - Shop Live, Save Big`,
      ogDescription: 'Watch live shopping shows and discover exclusive deals',
      ogImage: this.defaultImage,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      twitterTitle: `${this.siteName} - Shop Live, Save Big`,
      twitterDescription: 'Watch live shopping shows and discover exclusive deals',
      twitterImage: this.defaultImage,
      robots: 'index, follow',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: this.siteName,
        url: this.baseUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${this.baseUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      }
    };
  }

  // Product page metadata
  private getProductMetadata(product: any): SEOMetadata {
    const title = `${product.name} - ${this.siteName}`;
    const description = product.description.substring(0, 160);
    const url = `${this.baseUrl}/products/${product.id}`;

    return {
      title,
      description,
      keywords: [product.name, product.category, 'buy online', 'shop now'],
      canonical: url,
      ogTitle: title,
      ogDescription: description,
      ogImage: product.imageUrl,
      ogType: 'product',
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: product.imageUrl,
      robots: 'index, follow',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.imageUrl,
        brand: {
          '@type': 'Brand',
          name: product.brand || this.siteName
        },
        offers: {
          '@type': 'Offer',
          url,
          priceCurrency: 'USD',
          price: product.price,
          availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: this.siteName
          }
        },
        aggregateRating: product.rating ? {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.reviewCount || 0
        } : undefined
      }
    };
  }

  // Live show metadata
  private getShowMetadata(show: any): SEOMetadata {
    const title = `${show.title} - Live Show - ${this.siteName}`;
    const description = show.description.substring(0, 160);
    const url = `${this.baseUrl}/shows/${show.id}`;

    return {
      title,
      description,
      keywords: ['live shopping', 'live show', show.title, show.hostName],
      canonical: url,
      ogTitle: title,
      ogDescription: description,
      ogImage: show.thumbnailUrl,
      ogType: 'video.other',
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: show.thumbnailUrl,
      robots: 'index, follow',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: show.title,
        description: show.description,
        thumbnailUrl: show.thumbnailUrl,
        uploadDate: show.scheduledAt,
        contentUrl: url,
        embedUrl: `${url}/embed`,
        duration: show.duration ? `PT${show.duration}M` : undefined
      }
    };
  }

  // Category page metadata
  private getCategoryMetadata(category: any): SEOMetadata {
    const title = `${category.name} - Shop ${category.name} Products - ${this.siteName}`;
    const description = `Browse our collection of ${category.name} products. Find the best deals on ${category.name} items during live shopping shows.`;
    const url = `${this.baseUrl}/categories/${category.slug}`;

    return {
      title,
      description,
      keywords: [category.name, 'shop', 'buy online', 'deals'],
      canonical: url,
      ogTitle: title,
      ogDescription: description,
      ogImage: category.imageUrl || this.defaultImage,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: category.imageUrl || this.defaultImage,
      robots: 'index, follow',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        description,
        url
      }
    };
  }

  // Search results metadata
  private getSearchMetadata(query: string): SEOMetadata {
    const title = `Search Results for "${query}" - ${this.siteName}`;
    const description = `Find products matching "${query}". Browse our collection and discover great deals.`;

    return {
      title,
      description,
      keywords: [query, 'search', 'products'],
      robots: 'noindex, follow',
      ogTitle: title,
      ogDescription: description,
      ogImage: this.defaultImage,
      twitterCard: 'summary',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: this.defaultImage
    };
  }

  // Default metadata
  private getDefaultMetadata(): SEOMetadata {
    return {
      title: this.siteName,
      description: 'Shop live, save big with exclusive deals and live shopping shows',
      keywords: ['live shopping', 'online shopping', 'deals'],
      ogTitle: this.siteName,
      ogDescription: 'Shop live, save big',
      ogImage: this.defaultImage,
      twitterCard: 'summary',
      twitterTitle: this.siteName,
      twitterDescription: 'Shop live, save big',
      twitterImage: this.defaultImage,
      robots: 'index, follow'
    };
  }

  // Generate sitemap
  async generateSitemap(): Promise<SitemapEntry[]> {
    const entries: SitemapEntry[] = [];

    // Homepage
    entries.push({
      url: this.baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0
    });

    // Static pages
    const staticPages = [
      { path: '/products', priority: 0.9, freq: 'daily' as const },
      { path: '/shows', priority: 0.9, freq: 'daily' as const },
      { path: '/about', priority: 0.5, freq: 'monthly' as const },
      { path: '/contact', priority: 0.5, freq: 'monthly' as const },
      { path: '/faq', priority: 0.5, freq: 'monthly' as const }
    ];

    staticPages.forEach(page => {
      entries.push({
        url: `${this.baseUrl}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.freq,
        priority: page.priority
      });
    });

    // Products
    const allProducts = await db.select().from(products).where(eq(products.status, 'active'));
    allProducts.forEach(product => {
      entries.push({
        url: `${this.baseUrl}/products/${product.id}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8
      });
    });

    // Live shows
    const shows = await db.select().from(liveShows).orderBy(desc(liveShows.scheduledAt)).limit(100);
    shows.forEach(show => {
      entries.push({
        url: `${this.baseUrl}/shows/${show.id}`,
        lastModified: show.updatedAt,
        changeFrequency: 'daily',
        priority: 0.7
      });
    });

    return entries;
  }

  // Generate sitemap XML
  async generateSitemapXML(): Promise<string> {
    const entries = await this.generateSitemap();
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    entries.forEach(entry => {
      xml += '  <url>\n';
      xml += `    <loc>${entry.url}</loc>\n`;
      xml += `    <lastmod>${entry.lastModified.toISOString()}</lastmod>\n`;
      xml += `    <changefreq>${entry.changeFrequency}</changefreq>\n`;
      xml += `    <priority>${entry.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';
    return xml;
  }

  // Generate robots.txt
  generateRobotsTxt(): string {
    return `# Live Shopping Network - Robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /cart/
Disallow: /checkout/
Disallow: /account/
Disallow: /search?

# Sitemaps
Sitemap: ${this.baseUrl}/sitemap.xml

# Crawl delay
Crawl-delay: 1

# Specific bots
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /
`;
  }

  // Generate breadcrumb structured data
  generateBreadcrumbs(items: Array<{ name: string; url: string }>): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };
  }

  // Generate FAQ structured data
  generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }

  // Generate organization structured data
  generateOrganizationStructuredData(): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: this.siteName,
      url: this.baseUrl,
      logo: `${this.baseUrl}/logo.png`,
      sameAs: [
        'https://facebook.com/liveshoppingnetwork',
        'https://twitter.com/liveshoppingnet',
        'https://instagram.com/liveshoppingnetwork'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-555-123-4567',
        contactType: 'customer service',
        availableLanguage: ['en']
      }
    };
  }
}

// ============================================================================
// PERFORMANCE ENGINE
// ============================================================================

class PerformanceEngine {
  private metrics: Map<string, number[]> = new Map();
  private resourceTimings: PerformanceResourceTiming[] = [];

  // Record performance metric
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
  }

  // Get metric statistics
  getMetricStats(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) {
      return { count: 0, min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count,
      min: sorted[0],
      max: sorted[count - 1],
      avg: sum / count,
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)]
    };
  }

  // Generate performance report
  generateReport(): PerformanceReport {
    const metrics = {
      fcp: this.getMetricStats('fcp').avg,
      lcp: this.getMetricStats('lcp').avg,
      fid: this.getMetricStats('fid').avg,
      cls: this.getMetricStats('cls').avg,
      ttfb: this.getMetricStats('ttfb').avg,
      tti: this.getMetricStats('tti').avg
    };

    // Calculate score (0-100)
    const score = this.calculatePerformanceScore(metrics);

    // Generate opportunities
    const opportunities = this.generateOpportunities(metrics);

    // Generate diagnostics
    const diagnostics = this.generateDiagnostics(metrics);

    return {
      score,
      metrics,
      opportunities,
      diagnostics
    };
  }

  // Calculate performance score
  private calculatePerformanceScore(metrics: any): number {
    let score = 100;

    // FCP scoring
    if (metrics.fcp > 3000) score -= 20;
    else if (metrics.fcp > 1800) score -= 10;

    // LCP scoring
    if (metrics.lcp > 4000) score -= 20;
    else if (metrics.lcp > 2500) score -= 10;

    // FID scoring
    if (metrics.fid > 300) score -= 20;
    else if (metrics.fid > 100) score -= 10;

    // CLS scoring
    if (metrics.cls > 0.25) score -= 20;
    else if (metrics.cls > 0.1) score -= 10;

    // TTFB scoring
    if (metrics.ttfb > 800) score -= 10;
    else if (metrics.ttfb > 600) score -= 5;

    return Math.max(0, score);
  }

  // Generate optimization opportunities
  private generateOpportunities(metrics: any) {
    const opportunities = [];

    if (metrics.fcp > 1800) {
      opportunities.push({
        title: 'Reduce First Contentful Paint',
        description: 'Optimize critical rendering path and reduce render-blocking resources',
        impact: 'high' as const,
        savings: metrics.fcp - 1800
      });
    }

    if (metrics.lcp > 2500) {
      opportunities.push({
        title: 'Improve Largest Contentful Paint',
        description: 'Optimize images, preload critical resources, and improve server response time',
        impact: 'high' as const,
        savings: metrics.lcp - 2500
      });
    }

    if (metrics.ttfb > 600) {
      opportunities.push({
        title: 'Reduce Server Response Time',
        description: 'Optimize database queries, implement caching, and use CDN',
        impact: 'medium' as const,
        savings: metrics.ttfb - 600
      });
    }

    if (metrics.cls > 0.1) {
      opportunities.push({
        title: 'Minimize Layout Shifts',
        description: 'Add size attributes to images and reserve space for dynamic content',
        impact: 'medium' as const,
        savings: (metrics.cls - 0.1) * 1000
      });
    }

    return opportunities;
  }

  // Generate diagnostics
  private generateDiagnostics(metrics: any) {
    const diagnostics = [];

    if (metrics.fcp > 3000) {
      diagnostics.push({
        title: 'Slow First Contentful Paint',
        description: 'Users are waiting too long to see content',
        severity: 'error' as const
      });
    }

    if (metrics.lcp > 4000) {
      diagnostics.push({
        title: 'Slow Largest Contentful Paint',
        description: 'Main content takes too long to load',
        severity: 'error' as const
      });
    }

    if (metrics.fid > 300) {
      diagnostics.push({
        title: 'High First Input Delay',
        description: 'Page is not responsive to user interactions',
        severity: 'warning' as const
      });
    }

    if (metrics.cls > 0.25) {
      diagnostics.push({
        title: 'High Cumulative Layout Shift',
        description: 'Page elements are shifting during load',
        severity: 'warning' as const
      });
    }

    return diagnostics;
  }

  // Image optimization recommendations
  getImageOptimizationConfig(imageType: 'product' | 'thumbnail' | 'banner' | 'avatar'): ImageOptimizationConfig {
    const configs = {
      product: {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 85,
        format: 'webp' as const,
        progressive: true
      },
      thumbnail: {
        maxWidth: 400,
        maxHeight: 400,
        quality: 80,
        format: 'webp' as const,
        progressive: false
      },
      banner: {
        maxWidth: 1920,
        maxHeight: 600,
        quality: 85,
        format: 'webp' as const,
        progressive: true
      },
      avatar: {
        maxWidth: 200,
        maxHeight: 200,
        quality: 80,
        format: 'webp' as const,
        progressive: false
      }
    };

    return configs[imageType];
  }

  // Generate performance optimization checklist
  getOptimizationChecklist() {
    return [
      {
        category: 'Images',
        items: [
          'Use WebP format for all images',
          'Implement lazy loading for below-fold images',
          'Add width and height attributes to prevent layout shifts',
          'Use responsive images with srcset',
          'Compress images to optimal quality',
          'Use CDN for image delivery'
        ]
      },
      {
        category: 'JavaScript',
        items: [
          'Minimize and bundle JavaScript files',
          'Remove unused code',
          'Implement code splitting',
          'Defer non-critical JavaScript',
          'Use dynamic imports for large libraries',
          'Optimize third-party scripts'
        ]
      },
      {
        category: 'CSS',
        items: [
          'Minimize CSS files',
          'Remove unused CSS',
          'Inline critical CSS',
          'Defer non-critical CSS',
          'Use CSS containment',
          'Optimize font loading'
        ]
      },
      {
        category: 'Caching',
        items: [
          'Implement browser caching',
          'Use service workers for offline support',
          'Cache API responses',
          'Implement CDN caching',
          'Use cache-control headers',
          'Implement stale-while-revalidate'
        ]
      },
      {
        category: 'Server',
        items: [
          'Enable HTTP/2 or HTTP/3',
          'Implement gzip/brotli compression',
          'Optimize database queries',
          'Use connection pooling',
          'Implement rate limiting',
          'Use load balancing'
        ]
      }
    ];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const seoEngine = new SEOEngine();
export const performanceEngine = new PerformanceEngine();

// Helper functions
export function generateMetaTags(page: string, data?: any): SEOMetadata {
  return seoEngine.generateMetaTags(page, data);
}

export async function generateSitemapXML(): Promise<string> {
  return await seoEngine.generateSitemapXML();
}

export function generateRobotsTxt(): string {
  return seoEngine.generateRobotsTxt();
}

export function getPerformanceReport(): PerformanceReport {
  return performanceEngine.generateReport();
}

export function recordPerformanceMetric(name: string, value: number) {
  performanceEngine.recordMetric(name, value);
}
