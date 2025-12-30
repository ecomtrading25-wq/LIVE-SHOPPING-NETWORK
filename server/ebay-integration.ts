/**
 * eBay Integration
 * 
 * Complete eBay API integration:
 * - OAuth 2.0 authentication
 * - Product listing management
 * - Order management
 * - Inventory sync
 * - Pricing automation
 * - Multi-marketplace support (eBay.com, eBay.co.uk, etc.)
 * 
 * API Documentation: https://developer.ebay.com/
 */

import { z } from "zod";
import crypto from "crypto";
import { TRPCError } from "@trpc/server";

// ============================================================================
// EBAY API CONFIGURATION
// ============================================================================

const EBAY_OAUTH_URL = 'https://auth.ebay.com/oauth2/authorize';
const EBAY_TOKEN_URL = 'https://api.ebay.com/identity/v1/oauth2/token';
const EBAY_API_URL = 'https://api.ebay.com';

const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID;
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET;
const EBAY_REDIRECT_URI = process.env.EBAY_REDIRECT_URI || `${process.env.VITE_APP_URL}/api/ebay/callback`;

const EBAY_SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.marketing.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.marketing',
  'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.account',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
].join(' ');

interface EbayTokenData {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  token_type: string;
}

// ============================================================================
// OAUTH 2.0 AUTHENTICATION
// ============================================================================

/**
 * Generate eBay authorization URL
 */
export function getEbayAuthUrl(state?: string): string {
  if (!EBAY_CLIENT_ID) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'eBay client ID not configured',
    });
  }

  const stateParam = state || crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: EBAY_CLIENT_ID,
    redirect_uri: EBAY_REDIRECT_URI,
    response_type: 'code',
    scope: EBAY_SCOPES,
    state: stateParam,
  });

  return `${EBAY_OAUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeEbayCode(code: string): Promise<EbayTokenData> {
  if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'eBay credentials not configured',
    });
  }

  const auth = Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(EBAY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: EBAY_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('eBay token exchange error:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to exchange code for token',
    });
  }

  return await response.json();
}

/**
 * Refresh access token
 */
export async function refreshEbayToken(refreshToken: string): Promise<EbayTokenData> {
  if (!EBAY_CLIENT_ID || !EBAY_CLIENT_SECRET) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'eBay credentials not configured',
    });
  }

  const auth = Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(EBAY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: EBAY_SCOPES,
    }),
  });

  if (!response.ok) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Failed to refresh eBay token',
    });
  }

  return await response.json();
}

// ============================================================================
// API REQUESTS
// ============================================================================

/**
 * Make authenticated eBay API request
 */
async function ebayRequest<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${EBAY_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('eBay API Error:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.errors?.[0]?.message || 'eBay API request failed',
    });
  }

  return await response.json();
}

// ============================================================================
// INVENTORY MANAGEMENT
// ============================================================================

export interface EbayInventoryItem {
  sku: string;
  product: {
    title: string;
    description: string;
    aspects: Record<string, string[]>;
    brand: string;
    mpn?: string;
    imageUrls: string[];
  };
  condition: 'NEW' | 'LIKE_NEW' | 'USED_EXCELLENT' | 'USED_GOOD' | 'USED_ACCEPTABLE';
  availability: {
    shipToLocationAvailability: {
      quantity: number;
    };
  };
  packageWeightAndSize?: {
    dimensions: {
      height: number;
      length: number;
      width: number;
      unit: 'INCH' | 'CENTIMETER';
    };
    weight: {
      value: number;
      unit: 'POUND' | 'KILOGRAM';
    };
  };
}

/**
 * Get inventory items
 */
export async function getEbayInventory(
  accessToken: string,
  params: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ inventoryItems: EbayInventoryItem[]; total: number }> {
  const queryParams = new URLSearchParams();
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());

  const result = await ebayRequest<any>(
    `/sell/inventory/v1/inventory_item?${queryParams.toString()}`,
    accessToken,
    { method: 'GET' }
  );

  return {
    inventoryItems: result.inventoryItems || [],
    total: result.total || 0,
  };
}

/**
 * Create or update inventory item
 */
export async function upsertEbayInventoryItem(
  accessToken: string,
  sku: string,
  item: Partial<EbayInventoryItem>
): Promise<void> {
  await ebayRequest(
    `/sell/inventory/v1/inventory_item/${sku}`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify(item),
    }
  );
}

/**
 * Delete inventory item
 */
export async function deleteEbayInventoryItem(
  accessToken: string,
  sku: string
): Promise<void> {
  await ebayRequest(
    `/sell/inventory/v1/inventory_item/${sku}`,
    accessToken,
    { method: 'DELETE' }
  );
}

// ============================================================================
// OFFERS & LISTINGS
// ============================================================================

export interface EbayOffer {
  offerId: string;
  sku: string;
  marketplaceId: string;
  format: 'FIXED_PRICE' | 'AUCTION';
  listingDescription: string;
  listingPolicies: {
    fulfillmentPolicyId: string;
    paymentPolicyId: string;
    returnPolicyId: string;
  };
  pricingSummary: {
    price: {
      value: string;
      currency: string;
    };
  };
  quantityLimitPerBuyer?: number;
  categoryId: string;
  status: 'PUBLISHED' | 'UNPUBLISHED';
}

/**
 * Create offer (listing)
 */
export async function createEbayOffer(
  accessToken: string,
  offer: Partial<EbayOffer>
): Promise<{ offerId: string }> {
  return await ebayRequest(
    '/sell/inventory/v1/offer',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(offer),
    }
  );
}

/**
 * Publish offer (make listing live)
 */
export async function publishEbayOffer(
  accessToken: string,
  offerId: string
): Promise<{ listingId: string }> {
  return await ebayRequest(
    `/sell/inventory/v1/offer/${offerId}/publish`,
    accessToken,
    { method: 'POST' }
  );
}

/**
 * Update offer
 */
export async function updateEbayOffer(
  accessToken: string,
  offerId: string,
  updates: Partial<EbayOffer>
): Promise<void> {
  await ebayRequest(
    `/sell/inventory/v1/offer/${offerId}`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify(updates),
    }
  );
}

// ============================================================================
// ORDER MANAGEMENT
// ============================================================================

export interface EbayOrder {
  orderId: string;
  orderFulfillmentStatus: 'FULFILLED' | 'IN_PROGRESS' | 'NOT_STARTED';
  orderPaymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  creationDate: string;
  lastModifiedDate: string;
  pricingSummary: {
    total: {
      value: string;
      currency: string;
    };
  };
  buyer: {
    username: string;
    buyerRegistrationAddress: {
      fullName: string;
      contactAddress: {
        addressLine1: string;
        addressLine2?: string;
        city: string;
        stateOrProvince: string;
        postalCode: string;
        countryCode: string;
      };
    };
  };
  lineItems: Array<{
    lineItemId: string;
    sku: string;
    title: string;
    quantity: number;
    lineItemCost: {
      value: string;
      currency: string;
    };
  }>;
}

/**
 * Get orders
 */
export async function getEbayOrders(
  accessToken: string,
  params: {
    filter?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ orders: EbayOrder[]; total: number }> {
  const queryParams = new URLSearchParams();
  if (params.filter) queryParams.append('filter', params.filter);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());

  const result = await ebayRequest<any>(
    `/sell/fulfillment/v1/order?${queryParams.toString()}`,
    accessToken,
    { method: 'GET' }
  );

  return {
    orders: result.orders || [],
    total: result.total || 0,
  };
}

/**
 * Get order details
 */
export async function getEbayOrderDetails(
  accessToken: string,
  orderId: string
): Promise<EbayOrder> {
  return await ebayRequest(
    `/sell/fulfillment/v1/order/${orderId}`,
    accessToken,
    { method: 'GET' }
  );
}

/**
 * Create shipping fulfillment
 */
export async function createEbayShipment(
  accessToken: string,
  orderId: string,
  shipment: {
    lineItems: Array<{ lineItemId: string; quantity: number }>;
    shippingCarrierCode: string;
    trackingNumber: string;
  }
): Promise<{ fulfillmentId: string }> {
  return await ebayRequest(
    `/sell/fulfillment/v1/order/${orderId}/shipping_fulfillment`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(shipment),
    }
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Auth
  getEbayAuthUrl,
  exchangeEbayCode,
  refreshEbayToken,
  
  // Inventory
  getEbayInventory,
  upsertEbayInventoryItem,
  deleteEbayInventoryItem,
  
  // Offers
  createEbayOffer,
  publishEbayOffer,
  updateEbayOffer,
  
  // Orders
  getEbayOrders,
  getEbayOrderDetails,
  createEbayShipment,
};
