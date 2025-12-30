/**
 * Amazon Seller Central Integration
 * 
 * Amazon SP-API (Selling Partner API) integration:
 * - LWA (Login with Amazon) authentication
 * - Product listing management
 * - Order management
 * - Inventory sync with FBA/FBM
 * - Pricing automation
 * - Review monitoring
 * - Multi-marketplace support
 * 
 * API Documentation: https://developer-docs.amazon.com/sp-api/
 */

import { z } from "zod";
import crypto from "crypto";
import { TRPCError } from "@trpc/server";

// ============================================================================
// AMAZON SP-API CONFIGURATION
// ============================================================================

const AMAZON_SP_API_ENDPOINTS: Record<string, string> = {
  'NA': 'https://sellingpartnerapi-na.amazon.com', // North America
  'EU': 'https://sellingpartnerapi-eu.amazon.com', // Europe
  'FE': 'https://sellingpartnerapi-fe.amazon.com', // Far East
};

const AMAZON_LWA_TOKEN_URL = 'https://api.amazon.com/auth/o2/token';

const AMAZON_CLIENT_ID = process.env.AMAZON_CLIENT_ID;
const AMAZON_CLIENT_SECRET = process.env.AMAZON_CLIENT_SECRET;
const AMAZON_REFRESH_TOKEN = process.env.AMAZON_REFRESH_TOKEN;
const AMAZON_REGION = process.env.AMAZON_REGION || 'NA';

interface AmazonTokenData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

// ============================================================================
// LWA AUTHENTICATION
// ============================================================================

/**
 * Get LWA access token
 */
export async function getAmazonAccessToken(): Promise<string> {
  if (!AMAZON_CLIENT_ID || !AMAZON_CLIENT_SECRET || !AMAZON_REFRESH_TOKEN) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Amazon SP-API credentials not configured',
    });
  }

  const response = await fetch(AMAZON_LWA_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: AMAZON_REFRESH_TOKEN,
      client_id: AMAZON_CLIENT_ID,
      client_secret: AMAZON_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Amazon LWA token error:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get Amazon access token',
    });
  }

  const data: AmazonTokenData = await response.json();
  return data.access_token;
}

// ============================================================================
// API REQUESTS
// ============================================================================

/**
 * Make authenticated Amazon SP-API request
 */
async function amazonRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  region: string = AMAZON_REGION
): Promise<T> {
  const accessToken = await getAmazonAccessToken();
  const baseUrl = AMAZON_SP_API_ENDPOINTS[region];

  if (!baseUrl) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Invalid Amazon region: ${region}`,
    });
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'x-amz-access-token': accessToken,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Amazon SP-API Error:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.errors?.[0]?.message || 'Amazon SP-API request failed',
    });
  }

  return await response.json();
}

// ============================================================================
// PRODUCT LISTINGS
// ============================================================================

export interface AmazonProduct {
  sku: string;
  asin?: string;
  productType: string;
  attributes: {
    item_name: Array<{ value: string; marketplace_id: string }>;
    brand: Array<{ value: string; marketplace_id: string }>;
    description: Array<{ value: string; marketplace_id: string }>;
    bullet_point: Array<{ value: string; marketplace_id: string }>;
    main_product_image_locator: Array<{ value: { media_location: string }; marketplace_id: string }>;
  };
}

/**
 * Get product listings from Amazon
 */
export async function getAmazonProducts(
  marketplaceId: string,
  params: {
    sellerId: string;
    pageSize?: number;
    pageToken?: string;
  }
): Promise<{ listings: AmazonProduct[]; nextToken?: string }> {
  const queryParams = new URLSearchParams({
    sellerId: params.sellerId,
    marketplaceIds: marketplaceId,
  });

  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params.pageToken) queryParams.append('pageToken', params.pageToken);

  const result = await amazonRequest<any>(
    `/listings/2021-08-01/items?${queryParams.toString()}`,
    { method: 'GET' }
  );

  return {
    listings: result.listings || [],
    nextToken: result.pagination?.nextToken,
  };
}

/**
 * Create or update product listing on Amazon
 */
export async function upsertAmazonProduct(
  sellerId: string,
  marketplaceId: string,
  sku: string,
  product: Partial<AmazonProduct>
): Promise<void> {
  await amazonRequest(
    `/listings/2021-08-01/items/${sellerId}/${sku}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        productType: product.productType,
        requirements: 'LISTING',
        attributes: product.attributes,
        marketplaceIds: [marketplaceId],
      }),
    }
  );
}

/**
 * Delete product listing from Amazon
 */
export async function deleteAmazonProduct(
  sellerId: string,
  marketplaceId: string,
  sku: string
): Promise<void> {
  await amazonRequest(
    `/listings/2021-08-01/items/${sellerId}/${sku}?marketplaceIds=${marketplaceId}`,
    { method: 'DELETE' }
  );
}

// ============================================================================
// INVENTORY MANAGEMENT
// ============================================================================

export interface AmazonInventory {
  sku: string;
  asin: string;
  fnSku?: string; // FBA SKU
  sellerSku: string;
  condition: string;
  inventoryDetails: {
    fulfillableQuantity: number;
    inboundWorkingQuantity: number;
    inboundShippedQuantity: number;
    inboundReceivingQuantity: number;
  };
}

/**
 * Get inventory from Amazon FBA
 */
export async function getAmazonInventory(
  marketplaceId: string,
  params: {
    granularityType: 'Marketplace';
    granularityId: string;
    startDateTime?: string;
    sellerSkus?: string[];
  }
): Promise<{ inventorySummaries: AmazonInventory[] }> {
  const result = await amazonRequest<any>(
    '/fba/inventory/v1/summaries',
    {
      method: 'GET',
    }
  );

  return {
    inventorySummaries: result.payload?.inventorySummaries || [],
  };
}

// ============================================================================
// ORDER MANAGEMENT
// ============================================================================

export interface AmazonOrder {
  AmazonOrderId: string;
  PurchaseDate: string;
  LastUpdateDate: string;
  OrderStatus: 'Pending' | 'Unshipped' | 'PartiallyShipped' | 'Shipped' | 'Canceled' | 'Unfulfillable';
  FulfillmentChannel: 'MFN' | 'AFN'; // Merchant Fulfilled / Amazon Fulfilled
  SalesChannel: string;
  OrderTotal: {
    CurrencyCode: string;
    Amount: string;
  };
  NumberOfItemsShipped: number;
  NumberOfItemsUnshipped: number;
  PaymentMethod: string;
  MarketplaceId: string;
  BuyerEmail?: string;
  BuyerName?: string;
  ShipmentServiceLevelCategory: string;
  ShippingAddress?: {
    Name: string;
    AddressLine1: string;
    AddressLine2?: string;
    City: string;
    StateOrRegion: string;
    PostalCode: string;
    CountryCode: string;
    Phone?: string;
  };
}

export interface AmazonOrderItem {
  ASIN: string;
  SellerSKU: string;
  OrderItemId: string;
  Title: string;
  QuantityOrdered: number;
  QuantityShipped: number;
  ItemPrice: {
    CurrencyCode: string;
    Amount: string;
  };
  ItemTax: {
    CurrencyCode: string;
    Amount: string;
  };
}

/**
 * Get orders from Amazon
 */
export async function getAmazonOrders(
  marketplaceIds: string[],
  params: {
    CreatedAfter?: string;
    CreatedBefore?: string;
    LastUpdatedAfter?: string;
    OrderStatuses?: string[];
    FulfillmentChannels?: string[];
    MaxResultsPerPage?: number;
    NextToken?: string;
  } = {}
): Promise<{ orders: AmazonOrder[]; nextToken?: string }> {
  const queryParams = new URLSearchParams({
    MarketplaceIds: marketplaceIds.join(','),
  });

  if (params.CreatedAfter) queryParams.append('CreatedAfter', params.CreatedAfter);
  if (params.CreatedBefore) queryParams.append('CreatedBefore', params.CreatedBefore);
  if (params.LastUpdatedAfter) queryParams.append('LastUpdatedAfter', params.LastUpdatedAfter);
  if (params.OrderStatuses) queryParams.append('OrderStatuses', params.OrderStatuses.join(','));
  if (params.FulfillmentChannels) queryParams.append('FulfillmentChannels', params.FulfillmentChannels.join(','));
  if (params.MaxResultsPerPage) queryParams.append('MaxResultsPerPage', params.MaxResultsPerPage.toString());
  if (params.NextToken) queryParams.append('NextToken', params.NextToken);

  const result = await amazonRequest<any>(
    `/orders/v0/orders?${queryParams.toString()}`,
    { method: 'GET' }
  );

  return {
    orders: result.payload?.Orders || [],
    nextToken: result.payload?.NextToken,
  };
}

/**
 * Get order items
 */
export async function getAmazonOrderItems(
  orderId: string
): Promise<{ orderItems: AmazonOrderItem[] }> {
  const result = await amazonRequest<any>(
    `/orders/v0/orders/${orderId}/orderItems`,
    { method: 'GET' }
  );

  return {
    orderItems: result.payload?.OrderItems || [],
  };
}

/**
 * Confirm shipment for Merchant Fulfilled order
 */
export async function confirmAmazonShipment(
  orderId: string,
  shipment: {
    trackingNumber: string;
    carrierCode: string;
    shipDate: string;
  }
): Promise<void> {
  await amazonRequest(
    `/orders/v0/orders/${orderId}/shipment`,
    {
      method: 'POST',
      body: JSON.stringify({
        packageDetail: {
          packageReferenceId: '1',
          carrierCode: shipment.carrierCode,
          trackingNumber: shipment.trackingNumber,
          shipDate: shipment.shipDate,
        },
      }),
    }
  );
}

// ============================================================================
// PRICING
// ============================================================================

/**
 * Get competitive pricing for products
 */
export async function getAmazonCompetitivePricing(
  marketplaceId: string,
  asins: string[]
): Promise<any> {
  const result = await amazonRequest<any>(
    `/products/pricing/v0/competitivePrice?MarketplaceId=${marketplaceId}&Asins=${asins.join(',')}&ItemType=Asin`,
    { method: 'GET' }
  );

  return result.payload;
}

/**
 * Update product pricing
 */
export async function updateAmazonPricing(
  sellerId: string,
  marketplaceId: string,
  sku: string,
  price: number
): Promise<void> {
  // Pricing is updated through listings API
  await amazonRequest(
    `/listings/2021-08-01/items/${sellerId}/${sku}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        productType: 'PRODUCT',
        patches: [{
          op: 'replace',
          path: '/attributes/purchasable_offer',
          value: [{
            marketplace_id: marketplaceId,
            currency: 'USD',
            our_price: [{
              schedule: [{
                value_with_tax: price,
              }],
            }],
          }],
        }],
      }),
    }
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Auth
  getAmazonAccessToken,
  
  // Products
  getAmazonProducts,
  upsertAmazonProduct,
  deleteAmazonProduct,
  
  // Inventory
  getAmazonInventory,
  
  // Orders
  getAmazonOrders,
  getAmazonOrderItems,
  confirmAmazonShipment,
  
  // Pricing
  getAmazonCompetitivePricing,
  updateAmazonPricing,
};
