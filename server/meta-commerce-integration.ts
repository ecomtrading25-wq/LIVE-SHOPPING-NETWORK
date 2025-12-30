/**
 * Meta Commerce Integration (Facebook & Instagram Shopping)
 * 
 * Complete Meta Commerce API integration:
 * - Facebook Login authentication
 * - Product catalog sync
 * - Facebook Shop integration
 * - Instagram Shopping integration
 * - Facebook Live Shopping
 * - Instagram Live Shopping
 * - Order management
 * - Commerce Manager integration
 * 
 * API Documentation: https://developers.facebook.com/docs/commerce-platform
 */

import { z } from "zod";
import crypto from "crypto";
import { TRPCError } from "@trpc/server";

// ============================================================================
// META API CONFIGURATION
// ============================================================================

const META_GRAPH_API_URL = 'https://graph.facebook.com/v18.0';
const META_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token';

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || `${process.env.VITE_APP_URL}/api/meta/callback`;

interface MetaTokenData {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// ============================================================================
// OAUTH AUTHENTICATION
// ============================================================================

/**
 * Generate Meta OAuth authorization URL
 */
export function getMetaAuthUrl(state?: string): string {
  if (!META_APP_ID) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Meta app ID not configured',
    });
  }

  const stateParam = state || crypto.randomBytes(16).toString('hex');
  
  // Commerce permissions
  const scope = [
    'catalog_management',
    'business_management',
    'commerce_account_manage_orders',
    'commerce_account_read_orders',
    'commerce_account_read_reports',
    'pages_manage_metadata',
    'pages_read_engagement',
    'instagram_basic',
    'instagram_shopping_tag_products',
  ].join(',');

  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: META_REDIRECT_URI,
    scope,
    state: stateParam,
    response_type: 'code',
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeMetaCode(code: string): Promise<MetaTokenData> {
  if (!META_APP_ID || !META_APP_SECRET) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Meta credentials not configured',
    });
  }

  const params = new URLSearchParams({
    client_id: META_APP_ID,
    client_secret: META_APP_SECRET,
    redirect_uri: META_REDIRECT_URI,
    code,
  });

  const response = await fetch(`${META_TOKEN_URL}?${params.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Meta token exchange error:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to exchange code for token',
    });
  }

  return await response.json();
}

/**
 * Get long-lived access token
 */
export async function getMetaLongLivedToken(shortLivedToken: string): Promise<MetaTokenData> {
  if (!META_APP_ID || !META_APP_SECRET) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Meta credentials not configured',
    });
  }

  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: META_APP_ID,
    client_secret: META_APP_SECRET,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(`${META_TOKEN_URL}?${params.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get long-lived token',
    });
  }

  return await response.json();
}

// ============================================================================
// API REQUESTS
// ============================================================================

/**
 * Make authenticated Meta Graph API request
 */
async function metaRequest<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${META_GRAPH_API_URL}${endpoint}`;
  const separator = endpoint.includes('?') ? '&' : '?';

  const response = await fetch(`${url}${separator}access_token=${accessToken}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Meta API Error:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.error?.message || 'Meta API request failed',
    });
  }

  return await response.json();
}

// ============================================================================
// PRODUCT CATALOG
// ============================================================================

export interface MetaProduct {
  id: string;
  retailer_id: string;
  name: string;
  description: string;
  availability: 'in stock' | 'out of stock' | 'preorder' | 'available for order' | 'discontinued';
  condition: 'new' | 'refurbished' | 'used';
  price: string; // Format: "19.99 USD"
  sale_price?: string;
  link: string;
  image_url: string;
  brand: string;
  category?: string;
  inventory?: number;
}

/**
 * Get product catalog
 */
export async function getMetaCatalog(
  accessToken: string,
  businessId: string
): Promise<{ data: Array<{ id: string; name: string }> }> {
  return await metaRequest(
    `/${businessId}/owned_product_catalogs`,
    accessToken,
    { method: 'GET' }
  );
}

/**
 * Create product catalog
 */
export async function createMetaCatalog(
  accessToken: string,
  businessId: string,
  name: string
): Promise<{ id: string }> {
  return await metaRequest(
    `/${businessId}/owned_product_catalogs`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({ name }),
    }
  );
}

/**
 * Get products from catalog
 */
export async function getMetaProducts(
  accessToken: string,
  catalogId: string,
  params: {
    limit?: number;
    after?: string;
  } = {}
): Promise<{ data: MetaProduct[]; paging?: { cursors: { after: string } } }> {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.after) queryParams.append('after', params.after);

  return await metaRequest(
    `/${catalogId}/products?${queryParams.toString()}`,
    accessToken,
    { method: 'GET' }
  );
}

/**
 * Create or update product in catalog
 */
export async function upsertMetaProduct(
  accessToken: string,
  catalogId: string,
  product: Partial<MetaProduct>
): Promise<{ id: string }> {
  return await metaRequest(
    `/${catalogId}/products`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        retailer_id: product.retailer_id,
        name: product.name,
        description: product.description,
        availability: product.availability,
        condition: product.condition,
        price: product.price,
        sale_price: product.sale_price,
        link: product.link,
        image_url: product.image_url,
        brand: product.brand,
        category: product.category,
        inventory: product.inventory,
      }),
    }
  );
}

/**
 * Delete product from catalog
 */
export async function deleteMetaProduct(
  accessToken: string,
  productId: string
): Promise<{ success: boolean }> {
  return await metaRequest(
    `/${productId}`,
    accessToken,
    { method: 'DELETE' }
  );
}

/**
 * Batch upload products
 */
export async function batchUploadMetaProducts(
  accessToken: string,
  catalogId: string,
  products: Partial<MetaProduct>[]
): Promise<{ handle: string }> {
  return await metaRequest(
    `/${catalogId}/batch`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        requests: products.map(product => ({
          method: 'UPDATE',
          retailer_id: product.retailer_id,
          data: product,
        })),
      }),
    }
  );
}

// ============================================================================
// ORDER MANAGEMENT
// ============================================================================

export interface MetaOrder {
  id: string;
  order_status: {
    state: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  };
  created: string;
  last_updated: string;
  items: {
    data: Array<{
      id: string;
      product_id: string;
      retailer_id: string;
      quantity: number;
      price_per_unit: string;
      tax_details: {
        estimated_tax: string;
      };
    }>;
  };
  ship_by_date: string;
  shipping_address: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  buyer_details: {
    name: string;
    email: string;
  };
  selected_shipping_option: {
    name: string;
    price: string;
  };
}

/**
 * Get orders from Commerce Manager
 */
export async function getMetaOrders(
  accessToken: string,
  pageId: string,
  params: {
    state?: string;
    limit?: number;
    after?: string;
  } = {}
): Promise<{ data: MetaOrder[]; paging?: { cursors: { after: string } } }> {
  const queryParams = new URLSearchParams({
    fields: 'id,order_status,created,last_updated,items,ship_by_date,shipping_address,buyer_details,selected_shipping_option',
  });
  
  if (params.state) queryParams.append('state', params.state);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.after) queryParams.append('after', params.after);

  return await metaRequest(
    `/${pageId}/commerce_orders?${queryParams.toString()}`,
    accessToken,
    { method: 'GET' }
  );
}

/**
 * Update order status
 */
export async function updateMetaOrderStatus(
  accessToken: string,
  orderId: string,
  status: 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'REFUNDED' | 'CANCELLED'
): Promise<{ success: boolean }> {
  return await metaRequest(
    `/${orderId}/shipments`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        tracking_info: {
          tracking_number: '',
          carrier: '',
          status,
        },
      }),
    }
  );
}

/**
 * Add tracking to order
 */
export async function addMetaOrderTracking(
  accessToken: string,
  orderId: string,
  trackingNumber: string,
  carrier: string
): Promise<{ success: boolean }> {
  return await metaRequest(
    `/${orderId}/shipments`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        tracking_info: {
          tracking_number: trackingNumber,
          carrier,
          status: 'SHIPPED',
        },
      }),
    }
  );
}

// ============================================================================
// FACEBOOK SHOP
// ============================================================================

/**
 * Get Facebook Shop
 */
export async function getMetaShop(
  accessToken: string,
  pageId: string
): Promise<{ id: string; name: string }> {
  return await metaRequest(
    `/${pageId}/commerce_merchant_settings`,
    accessToken,
    { method: 'GET' }
  );
}

/**
 * Link catalog to Facebook Shop
 */
export async function linkCatalogToShop(
  accessToken: string,
  pageId: string,
  catalogId: string
): Promise<{ success: boolean }> {
  return await metaRequest(
    `/${pageId}/commerce_merchant_settings`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        catalog_id: catalogId,
      }),
    }
  );
}

// ============================================================================
// INSTAGRAM SHOPPING
// ============================================================================

/**
 * Get Instagram Business Account
 */
export async function getInstagramAccount(
  accessToken: string,
  pageId: string
): Promise<{ instagram_business_account: { id: string } }> {
  return await metaRequest(
    `/${pageId}?fields=instagram_business_account`,
    accessToken,
    { method: 'GET' }
  );
}

/**
 * Tag products in Instagram post
 */
export async function tagInstagramProducts(
  accessToken: string,
  mediaId: string,
  productTags: Array<{
    product_id: string;
    x: number; // 0.0 to 1.0
    y: number; // 0.0 to 1.0
  }>
): Promise<{ success: boolean }> {
  return await metaRequest(
    `/${mediaId}/product_tags`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        product_tags: productTags,
      }),
    }
  );
}

// ============================================================================
// LIVE SHOPPING
// ============================================================================

/**
 * Create Facebook Live video with shopping
 */
export async function createFacebookLiveShopping(
  accessToken: string,
  pageId: string,
  params: {
    title: string;
    description: string;
    product_ids: string[];
  }
): Promise<{ id: string; stream_url: string; stream_key: string }> {
  return await metaRequest(
    `/${pageId}/live_videos`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        title: params.title,
        description: params.description,
        status: 'LIVE_NOW',
        product_items: params.product_ids,
      }),
    }
  );
}

/**
 * Add products to live video
 */
export async function addProductsToLive(
  accessToken: string,
  liveVideoId: string,
  productIds: string[]
): Promise<{ success: boolean }> {
  return await metaRequest(
    `/${liveVideoId}/product_items`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        product_ids: productIds,
      }),
    }
  );
}

// ============================================================================
// WEBHOOK VERIFICATION
// ============================================================================

/**
 * Verify Meta webhook signature
 */
export function verifyMetaWebhook(signature: string, body: string): boolean {
  if (!META_APP_SECRET) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', META_APP_SECRET)
    .update(body)
    .digest('hex');

  return `sha256=${expectedSignature}` === signature;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Auth
  getMetaAuthUrl,
  exchangeMetaCode,
  getMetaLongLivedToken,
  
  // Catalog
  getMetaCatalog,
  createMetaCatalog,
  getMetaProducts,
  upsertMetaProduct,
  deleteMetaProduct,
  batchUploadMetaProducts,
  
  // Orders
  getMetaOrders,
  updateMetaOrderStatus,
  addMetaOrderTracking,
  
  // Facebook Shop
  getMetaShop,
  linkCatalogToShop,
  
  // Instagram Shopping
  getInstagramAccount,
  tagInstagramProducts,
  
  // Live Shopping
  createFacebookLiveShopping,
  addProductsToLive,
  
  // Webhooks
  verifyMetaWebhook,
};
