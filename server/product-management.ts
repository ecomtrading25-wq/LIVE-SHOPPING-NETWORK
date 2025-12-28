/**
 * Product Management Service
 * Complete CRUD operations for products with S3 image uploads
 * Aligned with existing schema (products, productVariants, inventory, productCategories)
 */

import { eq, and, like, desc, sql, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { products, productVariants, inventory, productCategories } from "../drizzle/schema";
import { storagePut } from "./storage";

// ============================================================================
// Product CRUD Operations
// ============================================================================

export async function createProduct(data: {
  channelId: string;
  sku: string;
  name: string;
  description?: string;
  price: string;
  compareAtPrice?: string;
  cost?: string;
  imageUrl?: string;
  status?: "active" | "draft" | "archived";
  metadata?: any;
}) {
  const db = await getDb();
  
  const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await db.insert(products).values({
    id: productId,
    channelId: data.channelId,
    sku: data.sku,
    name: data.name,
    description: data.description,
    price: data.price,
    compareAtPrice: data.compareAtPrice,
    cost: data.cost,
    imageUrl: data.imageUrl,
    status: data.status || "active",
    metadata: data.metadata,
  });
  
  return { productId };
}

export async function getProduct(productId: string) {
  const db = await getDb();
  
  const [product] = await db.select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  
  if (!product) {
    throw new Error("Product not found");
  }
  
  return product;
}

export async function listProducts(filters: {
  channelId?: string;
  status?: "active" | "draft" | "archived";
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  
  let query = db.select().from(products);
  
  const conditions = [];
  
  if (filters.channelId) {
    conditions.push(eq(products.channelId, filters.channelId));
  }
  
  if (filters.status) {
    conditions.push(eq(products.status, filters.status));
  }
  
  if (filters.search) {
    conditions.push(
      sql`${products.name} LIKE ${`%${filters.search}%`} OR ${products.sku} LIKE ${`%${filters.search}%`}`
    );
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  query = query.orderBy(desc(products.createdAt)) as any;
  
  if (filters.limit) {
    query = query.limit(filters.limit) as any;
  }
  
  if (filters.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  const items = await query;
  
  return items;
}

export async function uploadProductImage(
  productId: string,
  imageBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const extension = mimeType.split("/")[1] || "jpg";
  const filename = `products/${productId}/${Date.now()}.${extension}`;
  
  const { url } = await storagePut(filename, imageBuffer, mimeType);
  
  return url;
}
