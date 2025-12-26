/**
 * SEO Optimization System
 * Generate meta tags, Open Graph, Twitter Cards, and structured data
 */

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: "website" | "product" | "article" | "video.other";
  twitterCard?: "summary" | "summary_large_image" | "player";
  structuredData?: any;
}

/**
 * Generate SEO meta tags for a page
 */
export function generateMetaTags(metadata: SEOMetadata): string {
  const {
    title,
    description,
    keywords,
    canonicalUrl,
    ogImage,
    ogType = "website",
    twitterCard = "summary_large_image",
    structuredData,
  } = metadata;

  const tags: string[] = [];

  // Basic meta tags
  tags.push(`<title>${escapeHtml(title)}</title>`);
  tags.push(`<meta name="description" content="${escapeHtml(description)}" />`);
  
  if (keywords && keywords.length > 0) {
    tags.push(`<meta name="keywords" content="${keywords.join(", ")}" />`);
  }

  if (canonicalUrl) {
    tags.push(`<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`);
  }

  // Open Graph tags
  tags.push(`<meta property="og:title" content="${escapeHtml(title)}" />`);
  tags.push(`<meta property="og:description" content="${escapeHtml(description)}" />`);
  tags.push(`<meta property="og:type" content="${ogType}" />`);
  
  if (canonicalUrl) {
    tags.push(`<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`);
  }
  
  if (ogImage) {
    tags.push(`<meta property="og:image" content="${escapeHtml(ogImage)}" />`);
    tags.push(`<meta property="og:image:width" content="1200" />`);
    tags.push(`<meta property="og:image:height" content="630" />`);
  }

  tags.push(`<meta property="og:site_name" content="Live Shopping Network" />`);

  // Twitter Card tags
  tags.push(`<meta name="twitter:card" content="${twitterCard}" />`);
  tags.push(`<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  tags.push(`<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  
  if (ogImage) {
    tags.push(`<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`);
  }

  // Structured data (JSON-LD)
  if (structuredData) {
    tags.push(`<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`);
  }

  return tags.join("\n");
}

/**
 * Generate product structured data
 */
export function generateProductStructuredData(product: {
  id: string;
  name: string;
  description: string;
  price: string;
  compareAtPrice?: string;
  image?: string;
  brand?: string;
  sku?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  rating?: number;
  reviewCount?: number;
}) {
  const structuredData: any = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image || "https://via.placeholder.com/800",
    sku: product.sku || product.id,
    offers: {
      "@type": "Offer",
      url: `https://liveshoppingnetwork.com/products/${product.id}`,
      priceCurrency: "USD",
      price: product.price,
      availability: `https://schema.org/${product.availability || "InStock"}`,
      seller: {
        "@type": "Organization",
        name: "Live Shopping Network",
      },
    },
  };

  if (product.brand) {
    structuredData.brand = {
      "@type": "Brand",
      name: product.brand,
    };
  }

  if (product.rating && product.reviewCount) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    };
  }

  return structuredData;
}

/**
 * Generate organization structured data
 */
export function generateOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Live Shopping Network",
    url: "https://liveshoppingnetwork.com",
    logo: "https://liveshoppingnetwork.com/logo.png",
    description: "Live shopping platform with real-time product showcases and instant purchasing",
    sameAs: [
      "https://facebook.com/liveshoppingnetwork",
      "https://twitter.com/liveshoppingnet",
      "https://instagram.com/liveshoppingnetwork",
      "https://tiktok.com/@liveshoppingnetwork",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-800-LIVE-SHOP",
      contactType: "Customer Service",
      email: "support@liveshoppingnetwork.com",
    },
  };
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/**
 * Generate sitemap XML
 */
export function generateSitemap(urls: Array<{
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}>): string {
  const urlEntries = urls.map(url => {
    const parts = [`    <url>`, `      <loc>${escapeXml(url.loc)}</loc>`];
    
    if (url.lastmod) {
      parts.push(`      <lastmod>${url.lastmod}</lastmod>`);
    }
    
    if (url.changefreq) {
      parts.push(`      <changefreq>${url.changefreq}</changefreq>`);
    }
    
    if (url.priority !== undefined) {
      parts.push(`      <priority>${url.priority}</priority>`);
    }
    
    parts.push(`    </url>`);
    return parts.join("\n");
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Generate robots.txt
 */
export function generateRobotsTxt(options: {
  sitemapUrl: string;
  disallowPaths?: string[];
  allowPaths?: string[];
}): string {
  const lines = ["User-agent: *"];
  
  if (options.disallowPaths && options.disallowPaths.length > 0) {
    options.disallowPaths.forEach(path => {
      lines.push(`Disallow: ${path}`);
    });
  }
  
  if (options.allowPaths && options.allowPaths.length > 0) {
    options.allowPaths.forEach(path => {
      lines.push(`Allow: ${path}`);
    });
  }
  
  lines.push("");
  lines.push(`Sitemap: ${options.sitemapUrl}`);
  
  return lines.join("\n");
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Generate SEO-friendly URL slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Extract keywords from text using TF-IDF
 */
export function extractKeywords(text: string, limit: number = 10): string[] {
  // Simple keyword extraction (in production, use NLP library)
  const stopWords = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
    "has", "he", "in", "is", "it", "its", "of", "on", "that", "the",
    "to", "was", "will", "with", "the", "this", "but", "they", "have",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}
