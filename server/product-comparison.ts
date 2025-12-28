/**
 * Product Comparison Tool
 * Side-by-side comparison of products with detailed attributes
 */

import { getDb } from "./db";
import { products } from "../drizzle/schema";
import { inArray, eq } from "drizzle-orm";

export interface ComparisonAttribute {
  name: string;
  category: "specs" | "pricing" | "ratings" | "availability";
  values: Map<string, string | number | boolean>; // productId -> value
}

export interface ProductComparison {
  products: Array<{
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    rating?: number;
    reviewCount?: number;
  }>;
  attributes: ComparisonAttribute[];
  recommendations: {
    bestValue: string;
    highestRated: string;
    cheapest: string;
    mostPopular: string;
  };
}

/**
 * Compare multiple products side-by-side
 */
export async function compareProducts(productIds: string[]): Promise<ProductComparison> {
  if (productIds.length < 2) {
    throw new Error("At least 2 products required for comparison");
  }

  if (productIds.length > 5) {
    throw new Error("Maximum 5 products can be compared at once");
  }

  const db = await getDb();

  // Fetch products
  const productsData = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));

  // Build comparison attributes
  const attributes: ComparisonAttribute[] = [
    {
      name: "Price",
      category: "pricing",
      values: new Map(productsData.map(p => [p.id, parseFloat(p.price)])),
    },
    {
      name: "Compare At Price",
      category: "pricing",
      values: new Map(
        productsData.map(p => [p.id, p.compareAtPrice ? parseFloat(p.compareAtPrice) : "-"])
      ),
    },
    {
      name: "Cost",
      category: "pricing",
      values: new Map(productsData.map(p => [p.id, p.cost ? parseFloat(p.cost) : "-"])),
    },
    {
      name: "Status",
      category: "availability",
      values: new Map(productsData.map(p => [p.id, p.status])),
    },
  ];

  // Determine recommendations
  const prices = productsData.map(p => ({ id: p.id, price: parseFloat(p.price) }));
  const cheapest = prices.reduce((min, p) => (p.price < min.price ? p : min)).id;

  const comparison: ProductComparison = {
    products: productsData.map(p => ({
      id: p.id,
      name: p.name,
      price: parseFloat(p.price),
      imageUrl: p.imageUrl || undefined,
    })),
    attributes,
    recommendations: {
      bestValue: cheapest, // Simplified - would calculate value score
      highestRated: productsData[0].id, // Mock - would query reviews
      cheapest,
      mostPopular: productsData[0].id, // Mock - would query sales data
    },
  };

  return comparison;
}

/**
 * Get comparison history for a user
 */
export async function getUserComparisonHistory(userId: number): Promise<
  Array<{
    id: string;
    productIds: string[];
    comparedAt: Date;
  }>
> {
  // TODO: Store and retrieve comparison history
  return [];
}

/**
 * Save comparison for later
 */
export async function saveComparison(params: {
  userId: number;
  productIds: string[];
  name?: string;
}): Promise<string> {
  const comparisonId = `comparison_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // TODO: Store in database
  console.log("Comparison saved:", comparisonId, params);

  return comparisonId;
}

/**
 * Get saved comparisons
 */
export async function getSavedComparisons(userId: number): Promise<
  Array<{
    id: string;
    name: string;
    productIds: string[];
    createdAt: Date;
  }>
> {
  // TODO: Query saved comparisons
  return [];
}

/**
 * Delete saved comparison
 */
export async function deleteComparison(params: {
  userId: number;
  comparisonId: string;
}): Promise<void> {
  // TODO: Delete from database
  console.log("Comparison deleted:", params);
}

/**
 * Get comparison suggestions (products frequently compared together)
 */
export async function getComparisonSuggestions(productId: string): Promise<string[]> {
  // TODO: Query products frequently compared with this one
  return [];
}

/**
 * Share comparison (generate shareable link)
 */
export async function shareComparison(productIds: string[]): Promise<string> {
  const shareCode = generateShareCode();

  // TODO: Store comparison with share code
  console.log("Comparison shared:", shareCode, productIds);

  return `https://example.com/compare/${shareCode}`;
}

/**
 * Get shared comparison by code
 */
export async function getSharedComparison(shareCode: string): Promise<ProductComparison | null> {
  // TODO: Query by share code
  return null;
}

/**
 * Generate unique share code
 */
function generateShareCode(): string {
  return Math.random().toString(36).substr(2, 12);
}

/**
 * Export comparison as PDF/CSV
 */
export async function exportComparison(params: {
  productIds: string[];
  format: "pdf" | "csv";
}): Promise<Buffer> {
  const comparison = await compareProducts(params.productIds);

  if (params.format === "csv") {
    return exportAsCSV(comparison);
  } else {
    return exportAsPDF(comparison);
  }
}

/**
 * Export comparison as CSV
 */
function exportAsCSV(comparison: ProductComparison): Buffer {
  let csv = "Attribute,";
  csv += comparison.products.map(p => p.name).join(",") + "\n";

  for (const attr of comparison.attributes) {
    csv += `${attr.name},`;
    csv += comparison.products.map(p => attr.values.get(p.id) || "-").join(",") + "\n";
  }

  return Buffer.from(csv, "utf-8");
}

/**
 * Export comparison as PDF
 */
function exportAsPDF(comparison: ProductComparison): Buffer {
  // TODO: Generate PDF using a library
  return Buffer.from("PDF content placeholder");
}

/**
 * Get comparison analytics
 */
export async function getComparisonAnalytics(params: {
  productIds?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}): Promise<{
  totalComparisons: number;
  mostComparedProducts: Array<{ productId: string; count: number }>;
  conversionRate: number;
}> {
  // TODO: Aggregate comparison analytics
  return {
    totalComparisons: 0,
    mostComparedProducts: [],
    conversionRate: 0,
  };
}
