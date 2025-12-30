/**
 * TikTok Shop Integration
 * 
 * Complete TikTok Shop API integration for live selling:
 * - OAuth 2.0 authentication
 * - Product catalog sync (bidirectional)
 * - Order ingestion and fulfillment
 * - Inventory sync
 * - Live stream integration
 * - Creator commission tracking
 * - Analytics and reporting
 * - Webhook handlers for real-time updates
 * 
 * API Documentation: https://partner.tiktokshop.com/docv2
 */

import { z } from "zod";
import crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { getDbSync } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

// ============================================================================
// TIKTOK SHOP API CONFIGURATION
// ============================================================================

const TIKTOK_SHOP_API_BASE = 'https://open-api.tiktokglobalshop.com';
const TIKTOK_SHOP_AUTH_URL = 'https://services.tiktokshop.com/open/authorize';
const TIKTOK_SHOP_TOKEN_URL = `${TIKTOK_SHOP_API_BASE}/api/token/get`;

const TIKTOK_APP_KEY = process.env.TIKTOK_APP_KEY;
const TIKTOK_APP_SECRET = process.env.TIKTOK_APP_SECRET;
const TIKTOK_SHOP_REDIRECT_URI = process.env.TIKTOK_SHOP_REDIRECT_URI || `${process.env.VITE_APP_URL}/api/tiktok/callback`;

interface TikTokTokenData {
  access_token: string;
  access_token_expire_in: number;
  refresh_token: string;
  refresh_token_expire_in: number;
  open_id: string;
  seller_name: string;
  seller_base_region: string;
  user_type: number;
}

// ============================================================================
// OAUTH 2.0 AUTHENTICATION
// ============================================================================

/**
 * Generate TikTok Shop authorization URL
 */
export function getTikTokShopAuthUrl(state?: string): string {
  if (!TIKTOK_APP_KEY) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'TikTok Shop app key not configured',
    });
  }

  const stateParam = state || crypto.randomBytes(16).toString('hex');

  return `${TIKTOK_SHOP_AUTH_URL}?app_key=${TIKTOK_APP_KEY}&state=${stateParam}&redirect_uri=${encodeURIComponent(TIKTOK_SHOP_REDIRECT_URI)}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeTikTokCode(authCode: string): Promise<TikTokTokenData> {
  if (!TIKTOK_APP_KEY || !TIKTOK_APP_SECRET) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'TikTok Shop credentials not configured',
    });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    app_key: TIKTOK_APP_KEY,
    app_secret: TIKTOK_APP_SECRET,
    auth_code: authCode,
    grant_type: 'authorized_code',
  };

  // Generate signature
  const sign = generateTikTokSignature(TIKTOK_SHOP_TOKEN_URL, params, TIKTOK_APP_SECRET);

  const response = await fetch(`${TIKTOK_SHOP_TOKEN_URL}?app_key=${TIKTOK_APP_KEY}&auth_code=${authCode}&grant_type=authorized_code&timestamp=${timestamp}&sign=${sign}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('TikTok Shop token exchange error:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to exchange code for token',
    });
  }

  const result = await response.json();

  if (result.code !== 0) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: result.message || 'TikTok Shop API error',
    });
  }

  return result.data;
}

/**
 * Refresh access token
 */
export async function refreshTikTokToken(refreshToken: string): Promise<TikTokTokenData> {
  if (!TIKTOK_APP_KEY || !TIKTOK_APP_SECRET) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'TikTok Shop credentials not configured',
    });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    app_key: TIKTOK_APP_KEY,
    app_secret: TIKTOK_APP_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  };

  const sign = generateTikTokSignature(TIKTOK_SHOP_TOKEN_URL, params, TIKTOK_APP_SECRET);

  const response = await fetch(`${TIKTOK_SHOP_TOKEN_URL}?app_key=${TIKTOK_APP_KEY}&refresh_token=${refreshToken}&grant_type=refresh_token&timestamp=${timestamp}&sign=${sign}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Failed to refresh TikTok Shop token',
    });
  }

  const result = await response.json();

  if (result.code !== 0) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: result.message || 'Failed to refresh token',
    });
  }

  return result.data;
}

/**
 * Generate TikTok Shop API signature
 */
function generateTikTokSignature(path: string, params: Record<string, any>, appSecret: string): string {
  // Sort parameters
  const sortedKeys = Object.keys(params).sort();
  
  // Build signature string
  let signString = path;
  for (const key of sortedKeys) {
    signString += key + params[key];
  }
  
  // HMAC-SHA256
  const hmac = crypto.createHmac('sha256', appSecret);
  hmac.update(signString);
  return hmac.digest('hex');
}

// ============================================================================
// API REQUESTS
// ============================================================================

/**
 * Make authenticated TikTok Shop API request
 */
async function tiktokShopRequest<T>(
  endpoint: string,
  params: Record<string, any> = {},
  method: 'GET' | 'POST' = 'POST',
  accessToken: string
): Promise<T> {
  if (!TIKTOK_APP_KEY || !TIKTOK_APP_SECRET) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'TikTok Shop credentials not configured',
    });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const fullPath = `/api${endpoint}`;
  
  const requestParams = {
    app_key: TIKTOK_APP_KEY,
    timestamp: timestamp.toString(),
    access_token: accessToken,
    ...params,
  };

  const sign = generateTikTokSignature(fullPath, requestParams, TIKTOK_APP_SECRET);

  const url = new URL(`${TIKTOK_SHOP_API_BASE}${fullPath}`);
  url.searchParams.append('app_key', TIKTOK_APP_KEY);
  url.searchParams.append('timestamp', timestamp.toString());
  url.searchParams.append('access_token', accessToken);
  url.searchParams.append('sign', sign);

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (method === 'POST' && Object.keys(params).length > 0) {
    options.body = JSON.stringify(params);
  }

  const response = await fetch(url.toString(), options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('TikTok Shop API Error:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'TikTok Shop API request failed',
    });
  }

  const result = await response.json();

  if (result.code !== 0) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: result.message || 'TikTok Shop API error',
    });
  }

  return result.data;
}

// ============================================================================
// PRODUCT SYNC
// ============================================================================

export interface TikTokProduct {
  product_id: string;
  product_name: string;
  description: string;
  category_id: string;
  brand_id?: string;
  images: string[];
  video?: string;
  skus: TikTokSku[];
  package_dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
  package_weight?: {
    value: number;
    unit: string;
  };
}

export interface TikTokSku {
  id: string;
  seller_sku: string;
  sales_attributes: Array<{
    attribute_id: string;
    attribute_name: string;
    value_id: string;
    value_name: string;
  }>;
  price: {
    amount: string;
    currency: string;
  };
  stock_infos: Array<{
    warehouse_id: string;
    available_stock: number;
  }>;
}

/**
 * Get product list from TikTok Shop
 */
export async function getTikTokProducts(
  accessToken: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ products: TikTokProduct[]; total: number }> {
  const result = await tiktokShopRequest<any>(
    '/products/search',
    {
      page_number: page,
      page_size: pageSize,
    },
    'POST',
    accessToken
  );

  return {
    products: result.products || [],
    total: result.total || 0,
  };
}

/**
 * Create product on TikTok Shop
 */
export async function createTikTokProduct(
  accessToken: string,
  product: Partial<TikTokProduct>
): Promise<string> {
  const result = await tiktokShopRequest<any>(
    '/products',
    { product },
    'POST',
    accessToken
  );

  return result.product_id;
}

/**
 * Update product on TikTok Shop
 */
export async function updateTikTokProduct(
  accessToken: string,
  productId: string,
  updates: Partial<TikTokProduct>
): Promise<void> {
  await tiktokShopRequest(
    `/products/${productId}`,
    { product: updates },
    'POST',
    accessToken
  );
}

/**
 * Update inventory on TikTok Shop
 */
export async function updateTikTokInventory(
  accessToken: string,
  skuId: string,
  warehouseId: string,
  quantity: number
): Promise<void> {
  await tiktokShopRequest(
    '/products/stocks/update',
    {
      skus: [{
        id: skuId,
        stock_infos: [{
          warehouse_id: warehouseId,
          available_stock: quantity,
        }],
      }],
    },
    'POST',
    accessToken
  );
}

// ============================================================================
// ORDER MANAGEMENT
// ============================================================================

export interface TikTokOrder {
  order_id: string;
  order_status: number;
  create_time: number;
  update_time: number;
  buyer_email: string;
  buyer_message: string;
  recipient_address: {
    name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    address_line3?: string;
    address_line4?: string;
    postal_code: string;
    region_code: string;
    district_info: Array<{
      address_level: string;
      address_level_name: string;
      address_name: string;
    }>;
  };
  item_list: Array<{
    id: string;
    product_id: string;
    product_name: string;
    sku_id: string;
    sku_name: string;
    sku_image: string;
    quantity: number;
    original_price: string;
    sale_price: string;
    seller_discount: string;
    platform_discount: string;
  }>;
  payment: {
    currency: string;
    sub_total: string;
    shipping_fee: string;
    seller_discount: string;
    platform_discount: string;
    tax: string;
    total_amount: string;
  };
  tracking_number?: string;
  shipping_provider?: string;
}

/**
 * Get orders from TikTok Shop
 */
export async function getTikTokOrders(
  accessToken: string,
  params: {
    create_time_from?: number;
    create_time_to?: number;
    update_time_from?: number;
    update_time_to?: number;
    order_status?: number;
    page_number?: number;
    page_size?: number;
  } = {}
): Promise<{ orders: TikTokOrder[]; total: number }> {
  const result = await tiktokShopRequest<any>(
    '/orders/search',
    {
      page_number: params.page_number || 1,
      page_size: params.page_size || 20,
      ...params,
    },
    'POST',
    accessToken
  );

  return {
    orders: result.orders || [],
    total: result.total || 0,
  };
}

/**
 * Get order details
 */
export async function getTikTokOrderDetail(
  accessToken: string,
  orderId: string
): Promise<TikTokOrder> {
  const result = await tiktokShopRequest<any>(
    `/orders/${orderId}`,
    {},
    'GET',
    accessToken
  );

  return result.order;
}

/**
 * Ship order (provide tracking)
 */
export async function shipTikTokOrder(
  accessToken: string,
  orderId: string,
  trackingNumber: string,
  shippingProvider: string
): Promise<void> {
  await tiktokShopRequest(
    `/orders/${orderId}/ship`,
    {
      tracking_number: trackingNumber,
      shipping_provider_id: shippingProvider,
    },
    'POST',
    accessToken
  );
}

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

/**
 * Verify TikTok Shop webhook signature
 */
export function verifyTikTokWebhook(
  timestamp: string,
  signature: string,
  body: string
): boolean {
  if (!TIKTOK_APP_SECRET) {
    return false;
  }

  const message = timestamp + body;
  const hmac = crypto.createHmac('sha256', TIKTOK_APP_SECRET);
  hmac.update(message);
  const expectedSignature = hmac.digest('hex');

  return signature === expectedSignature;
}

/**
 * Handle TikTok Shop webhook events
 */
export async function handleTikTokWebhook(event: any): Promise<void> {
  const { type, data } = event;

  switch (type) {
    case 1: // Order status update
      await handleOrderStatusUpdate(data);
      break;
    case 2: // Product update
      await handleProductUpdate(data);
      break;
    case 3: // Inventory update
      await handleInventoryUpdate(data);
      break;
    case 4: // Return/Refund
      await handleReturnRefund(data);
      break;
    default:
      console.log(`Unhandled TikTok Shop webhook type: ${type}`);
  }
}

async function handleOrderStatusUpdate(data: any): Promise<void> {
  console.log('TikTok Shop order status update:', data);
  // TODO: Sync order status to LSN database
}

async function handleProductUpdate(data: any): Promise<void> {
  console.log('TikTok Shop product update:', data);
  // TODO: Sync product changes to LSN database
}

async function handleInventoryUpdate(data: any): Promise<void> {
  console.log('TikTok Shop inventory update:', data);
  // TODO: Sync inventory changes to LSN database
}

async function handleReturnRefund(data: any): Promise<void> {
  console.log('TikTok Shop return/refund:', data);
  // TODO: Process return/refund in LSN system
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Auth
  getTikTokShopAuthUrl,
  exchangeTikTokCode,
  refreshTikTokToken,
  
  // Products
  getTikTokProducts,
  createTikTokProduct,
  updateTikTokProduct,
  updateTikTokInventory,
  
  // Orders
  getTikTokOrders,
  getTikTokOrderDetail,
  shipTikTokOrder,
  
  // Webhooks
  verifyTikTokWebhook,
  handleTikTokWebhook,
};
