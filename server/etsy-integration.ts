/**
 * Etsy Integration
 * 
 * Complete Etsy Open API v3 integration:
 * - OAuth 2.0 authentication
 * - Shop management
 * - Listing management
 * - Order management
 * - Inventory sync
 * 
 * API Documentation: https://developers.etsy.com/documentation
 */

import { z } from "zod";
import crypto from "crypto";
import { TRPCError } from "@trpc/server";

// ============================================================================
// ETSY API CONFIGURATION
// ============================================================================

const ETSY_API_URL = 'https://openapi.etsy.com/v3';
const ETSY_OAUTH_URL = 'https://www.etsy.com/oauth/connect';
const ETSY_TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token';

const ETSY_CLIENT_ID = process.env.ETSY_CLIENT_ID;
const ETSY_CLIENT_SECRET = process.env.ETSY_CLIENT_SECRET;
const ETSY_REDIRECT_URI = process.env.ETSY_REDIRECT_URI || `${process.env.VITE_APP_URL}/api/etsy/callback`;

const ETSY_SCOPES = [
  'listings_r',
  'listings_w',
  'shops_r',
  'shops_w',
  'transactions_r',
  'transactions_w',
].join(' ');

interface EtsyTokenData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

// ============================================================================
// OAUTH 2.0 AUTHENTICATION (PKCE)
// ============================================================================

/**
 * Generate code verifier and challenge for PKCE
 */
function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

/**
 * Generate Etsy authorization URL
 */
export function getEtsyAuthUrl(state?: string): { url: string; verifier: string } {
  if (!ETSY_CLIENT_ID) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Etsy client ID not configured',
    });
  }

  const stateParam = state || crypto.randomBytes(16).toString('hex');
  const { verifier, challenge } = generatePKCE();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: ETSY_CLIENT_ID,
    redirect_uri: ETSY_REDIRECT_URI,
    scope: ETSY_SCOPES,
    state: stateParam,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  return {
    url: `${ETSY_OAUTH_URL}?${params.toString()}`,
    verifier, // Store this to use in token exchange
  };
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeEtsyCode(code: string, verifier: string): Promise<EtsyTokenData> {
  if (!ETSY_CLIENT_ID) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Etsy client ID not configured',
    });
  }

  const response = await fetch(ETSY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: ETSY_CLIENT_ID,
      redirect_uri: ETSY_REDIRECT_URI,
      code,
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Etsy token exchange error:', error);
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
export async function refreshEtsyToken(refreshToken: string): Promise<EtsyTokenData> {
  if (!ETSY_CLIENT_ID) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Etsy client ID not configured',
    });
  }

  const response = await fetch(ETSY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: ETSY_CLIENT_ID,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Failed to refresh Etsy token',
    });
  }

  return await response.json();
}

// ============================================================================
// API REQUESTS
// ============================================================================

/**
 * Make authenticated Etsy API request
 */
async function etsyRequest<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${ETSY_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'x-api-key': ETSY_CLIENT_ID!,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Etsy API Error:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.error || 'Etsy API request failed',
    });
  }

  return await response.json();
}

// ============================================================================
// SHOP MANAGEMENT
// ============================================================================

export interface EtsyShop {
  shop_id: number;
  shop_name: string;
  title: string;
  announcement: string;
  currency_code: string;
  is_vacation: boolean;
  vacation_message: string;
  sale_message: string;
  digital_sale_message: string;
  url: string;
  image_url_760x100: string;
  num_favorers: number;
  languages: string[];
  icon_url_fullxfull: string;
  is_using_structured_policies: boolean;
  has_onboarded_structured_policies: boolean;
  policy_welcome: string;
  policy_payment: string;
  policy_shipping: string;
  policy_refunds: string;
  policy_additional: string;
  policy_seller_info: string;
  policy_updated_tsz: number;
  policy_has_private_receipt_info: boolean;
  vacation_autoreply: string;
  ga_code: string;
  name: string;
  url_path: string;
  user_id: number;
  create_date: number;
  update_date: number;
}

/**
 * Get shop by shop ID
 */
export async function getEtsyShop(
  accessToken: string,
  shopId: number
): Promise<EtsyShop> {
  const result = await etsyRequest<any>(
    `/application/shops/${shopId}`,
    accessToken,
    { method: 'GET' }
  );

  return result;
}

// ============================================================================
// LISTING MANAGEMENT
// ============================================================================

export interface EtsyListing {
  listing_id: number;
  user_id: number;
  shop_id: number;
  title: string;
  description: string;
  state: 'active' | 'inactive' | 'draft' | 'expired';
  creation_timestamp: number;
  created_timestamp: number;
  ending_timestamp: number;
  original_creation_timestamp: number;
  last_modified_timestamp: number;
  updated_timestamp: number;
  state_timestamp: number;
  quantity: number;
  shop_section_id: number | null;
  featured_rank: number;
  url: string;
  num_favorers: number;
  non_taxable: boolean;
  is_taxable: boolean;
  is_customizable: boolean;
  is_personalizable: boolean;
  personalization_is_required: boolean;
  personalization_char_count_max: number | null;
  personalization_instructions: string | null;
  listing_type: 'physical' | 'download' | 'both';
  tags: string[];
  materials: string[];
  shipping_profile_id: number | null;
  return_policy_id: number | null;
  processing_min: number | null;
  processing_max: number | null;
  who_made: 'i_did' | 'someone_else' | 'collective';
  when_made: string;
  is_supply: boolean;
  item_weight: number | null;
  item_weight_unit: string | null;
  item_length: number | null;
  item_width: number | null;
  item_height: number | null;
  item_dimensions_unit: string | null;
  is_private: boolean;
  style: string[];
  file_data: string;
  has_variations: boolean;
  should_auto_renew: boolean;
  language: string;
  price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  taxonomy_id: number;
}

/**
 * Get shop listings
 */
export async function getEtsyListings(
  accessToken: string,
  shopId: number,
  params: {
    state?: 'active' | 'inactive' | 'draft' | 'expired';
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ results: EtsyListing[]; count: number }> {
  const queryParams = new URLSearchParams();
  if (params.state) queryParams.append('state', params.state);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());

  return await etsyRequest(
    `/application/shops/${shopId}/listings?${queryParams.toString()}`,
    accessToken,
    { method: 'GET' }
  );
}

/**
 * Create listing
 */
export async function createEtsyListing(
  accessToken: string,
  shopId: number,
  listing: Partial<EtsyListing>
): Promise<EtsyListing> {
  return await etsyRequest(
    `/application/shops/${shopId}/listings`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(listing),
    }
  );
}

/**
 * Update listing
 */
export async function updateEtsyListing(
  accessToken: string,
  shopId: number,
  listingId: number,
  updates: Partial<EtsyListing>
): Promise<EtsyListing> {
  return await etsyRequest(
    `/application/shops/${shopId}/listings/${listingId}`,
    accessToken,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }
  );
}

/**
 * Delete listing
 */
export async function deleteEtsyListing(
  accessToken: string,
  listingId: number
): Promise<void> {
  await etsyRequest(
    `/application/listings/${listingId}`,
    accessToken,
    { method: 'DELETE' }
  );
}

/**
 * Update listing inventory
 */
export async function updateEtsyInventory(
  accessToken: string,
  listingId: number,
  quantity: number
): Promise<void> {
  await etsyRequest(
    `/application/listings/${listingId}/inventory`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify({
        products: [{
          offerings: [{
            quantity,
          }],
        }],
      }),
    }
  );
}

// ============================================================================
// ORDER MANAGEMENT (RECEIPTS)
// ============================================================================

export interface EtsyReceipt {
  receipt_id: number;
  receipt_type: number;
  seller_user_id: number;
  seller_email: string;
  buyer_user_id: number;
  buyer_email: string;
  name: string;
  first_line: string;
  second_line: string | null;
  city: string;
  state: string | null;
  zip: string;
  status: string;
  formatted_address: string;
  country_iso: string;
  payment_method: string;
  payment_email: string;
  message_from_seller: string | null;
  message_from_buyer: string | null;
  message_from_payment: string | null;
  is_paid: boolean;
  is_shipped: boolean;
  create_timestamp: number;
  created_timestamp: number;
  update_timestamp: number;
  updated_timestamp: number;
  is_gift: boolean;
  gift_message: string | null;
  grandtotal: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  subtotal: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_shipping_cost: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_tax_cost: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_vat_cost: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  discount_amt: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  gift_wrap_price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  shipments: Array<{
    receipt_shipping_id: number;
    shipment_notification_timestamp: number;
    carrier_name: string;
    tracking_code: string;
  }>;
}

/**
 * Get shop receipts (orders)
 */
export async function getEtsyReceipts(
  accessToken: string,
  shopId: number,
  params: {
    was_paid?: boolean;
    was_shipped?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ results: EtsyReceipt[]; count: number }> {
  const queryParams = new URLSearchParams();
  if (params.was_paid !== undefined) queryParams.append('was_paid', params.was_paid.toString());
  if (params.was_shipped !== undefined) queryParams.append('was_shipped', params.was_shipped.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());

  return await etsyRequest(
    `/application/shops/${shopId}/receipts?${queryParams.toString()}`,
    accessToken,
    { method: 'GET' }
  );
}

/**
 * Create receipt shipment (mark as shipped)
 */
export async function createEtsyShipment(
  accessToken: string,
  shopId: number,
  receiptId: number,
  tracking: {
    tracking_code: string;
    carrier_name: string;
    send_bcc?: boolean;
    note_to_buyer?: string;
  }
): Promise<void> {
  await etsyRequest(
    `/application/shops/${shopId}/receipts/${receiptId}/tracking`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(tracking),
    }
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Auth
  getEtsyAuthUrl,
  exchangeEtsyCode,
  refreshEtsyToken,
  
  // Shop
  getEtsyShop,
  
  // Listings
  getEtsyListings,
  createEtsyListing,
  updateEtsyListing,
  deleteEtsyListing,
  updateEtsyInventory,
  
  // Orders
  getEtsyReceipts,
  createEtsyShipment,
};
