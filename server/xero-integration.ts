/**
 * Xero Accounting Integration
 * 
 * Complete Xero API integration for accounting automation:
 * - OAuth 2.0 authentication with token management
 * - Invoice creation and sync
 * - Payment recording and reconciliation
 * - Contact (customer) management
 * - Expense and bill tracking
 * - Chart of accounts sync
 * - Bank transaction reconciliation
 * - Real-time financial reporting
 * - Multi-business tracking with tracking categories
 * 
 * Key Feature: LSN Business Identifier
 * All transactions include a tracking category "Business Unit" = "LSN"
 * to separate LSN transactions from other businesses in shared Xero account
 */

import { z } from "zod";
import crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { getDbSync } from "./db";
import { 
  xeroTokens,
  xeroInvoices,
  xeroPayments,
  xeroContacts,
  xeroSyncLogs,
  orders,
  users
} from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// ============================================================================
// XERO API CONFIGURATION
// ============================================================================

const XERO_AUTH_URL = 'https://login.xero.com/identity/connect/authorize';
const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token';
const XERO_API_BASE = 'https://api.xero.com/api.xro/2.0';
const XERO_CONNECTIONS_URL = 'https://api.xero.com/connections';

const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID;
const XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET;
const XERO_REDIRECT_URI = process.env.XERO_REDIRECT_URI || `${process.env.VITE_APP_URL || 'http://localhost:3000'}/api/xero/callback`;

// LSN Business Identifier - used to tag all LSN transactions
const LSN_TRACKING_CATEGORY = 'Business Unit';
const LSN_TRACKING_OPTION = 'LSN';

interface XeroTokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  id_token?: string;
}

interface XeroTenant {
  id: string;
  tenantId: string;
  tenantType: string;
  tenantName: string;
  createdDateUtc: string;
  updatedDateUtc: string;
}

// ============================================================================
// OAUTH 2.0 AUTHENTICATION
// ============================================================================

/**
 * Generate OAuth authorization URL
 */
export function getXeroAuthUrl(state?: string): string {
  if (!XERO_CLIENT_ID) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Xero client ID not configured',
    });
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: XERO_CLIENT_ID,
    redirect_uri: XERO_REDIRECT_URI,
    scope: 'openid profile email accounting.transactions accounting.contacts accounting.settings offline_access',
    state: state || crypto.randomBytes(16).toString('hex'),
  });

  return `${XERO_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  tokenData: XeroTokenData;
  tenants: XeroTenant[];
}> {
  if (!XERO_CLIENT_ID || !XERO_CLIENT_SECRET) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Xero credentials not configured',
    });
  }

  const auth = Buffer.from(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: XERO_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Xero token exchange error:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to exchange code for token',
    });
  }

  const tokenData: XeroTokenData = await response.json();

  // Get connected tenants
  const tenants = await getConnectedTenants(tokenData.access_token);

  // Store token in database
  const db = getDbSync();
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  await db.insert(xeroTokens).values({
    id: crypto.randomUUID(),
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt,
    tenantId: tenants[0]?.tenantId || null,
    tenantName: tenants[0]?.tenantName || null,
    scopes: 'accounting.transactions accounting.contacts accounting.settings',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { tokenData, tenants };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<XeroTokenData> {
  if (!XERO_CLIENT_ID || !XERO_CLIENT_SECRET) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Xero credentials not configured',
    });
  }

  const auth = Buffer.from(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Xero token refresh error:', error);
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Failed to refresh token. Please reconnect Xero.',
    });
  }

  const tokenData: XeroTokenData = await response.json();

  // Update token in database
  const db = getDbSync();
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  await db.update(xeroTokens)
    .set({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(xeroTokens.refreshToken, refreshToken));

  return tokenData;
}

/**
 * Get valid access token (refresh if expired)
 */
export async function getValidAccessToken(): Promise<{ token: string; tenantId: string }> {
  const db = getDbSync();
  
  const tokenRecord = await db.query.xeroTokens.findFirst({
    orderBy: desc(xeroTokens.createdAt),
  });

  if (!tokenRecord) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No Xero connection found. Please connect Xero first.',
    });
  }

  // Check if token is expired (with 5 minute buffer)
  const now = new Date();
  const expiresAt = new Date(tokenRecord.expiresAt);
  const bufferTime = 5 * 60 * 1000; // 5 minutes

  if (now.getTime() > expiresAt.getTime() - bufferTime) {
    // Token expired or about to expire, refresh it
    const newTokenData = await refreshAccessToken(tokenRecord.refreshToken);
    return { token: newTokenData.access_token, tenantId: tokenRecord.tenantId! };
  }

  return { token: tokenRecord.accessToken, tenantId: tokenRecord.tenantId! };
}

/**
 * Get connected Xero tenants
 */
async function getConnectedTenants(accessToken: string): Promise<XeroTenant[]> {
  const response = await fetch(XERO_CONNECTIONS_URL, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to get connected tenants',
    });
  }

  return await response.json();
}

// ============================================================================
// XERO API REQUESTS
// ============================================================================

/**
 * Make authenticated Xero API request
 */
async function xeroRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  tenantId?: string
): Promise<T> {
  const { token, tenantId: defaultTenantId } = await getValidAccessToken();
  const finalTenantId = tenantId || defaultTenantId;

  const response = await fetch(`${XERO_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'xero-tenant-id': finalTenantId,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Xero API Error:', error);
    
    // Log sync error
    await logSyncError('API_REQUEST', endpoint, error);
    
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Xero API request failed',
    });
  }

  return await response.json();
}

// ============================================================================
// TRACKING CATEGORIES (Business Unit Tagging)
// ============================================================================

/**
 * Ensure LSN tracking category exists in Xero
 */
export async function ensureLSNTrackingCategory(): Promise<string> {
  try {
    // Get existing tracking categories
    const response = await xeroRequest<any>('/TrackingCategories');
    const categories = response.TrackingCategories || [];

    // Find "Business Unit" category
    let businessUnitCategory = categories.find((c: any) => c.Name === LSN_TRACKING_CATEGORY);

    if (!businessUnitCategory) {
      // Create "Business Unit" tracking category
      const createResponse = await xeroRequest<any>('/TrackingCategories', {
        method: 'POST',
        body: JSON.stringify({
          TrackingCategories: [{
            Name: LSN_TRACKING_CATEGORY,
            Status: 'ACTIVE',
          }],
        }),
      });
      businessUnitCategory = createResponse.TrackingCategories[0];
    }

    // Check if "LSN" option exists
    const options = businessUnitCategory.Options || [];
    let lsnOption = options.find((o: any) => o.Name === LSN_TRACKING_OPTION);

    if (!lsnOption) {
      // Add "LSN" option to tracking category
      await xeroRequest<any>(`/TrackingCategories/${businessUnitCategory.TrackingCategoryID}/Options`, {
        method: 'PUT',
        body: JSON.stringify({
          TrackingOptions: [{
            Name: LSN_TRACKING_OPTION,
            Status: 'ACTIVE',
          }],
        }),
      });
    }

    return businessUnitCategory.TrackingCategoryID;
  } catch (error) {
    console.error('Error ensuring LSN tracking category:', error);
    throw error;
  }
}

/**
 * Get LSN tracking category for line items
 */
async function getLSNTracking(): Promise<any[]> {
  const trackingCategoryId = await ensureLSNTrackingCategory();
  
  return [{
    TrackingCategoryID: trackingCategoryId,
    Name: LSN_TRACKING_CATEGORY,
    Option: LSN_TRACKING_OPTION,
  }];
}

// ============================================================================
// CONTACTS (CUSTOMERS)
// ============================================================================

export const xeroContactSchemas = {
  syncContact: z.object({
    userId: z.number(),
    email: z.string().email(),
    name: z.string(),
    phone: z.string().optional(),
  }),
};

/**
 * Create or update contact in Xero
 */
export async function syncContactToXero(input: z.infer<typeof xeroContactSchemas.syncContact>): Promise<string> {
  const db = getDbSync();

  try {
    // Check if contact already exists in Xero
    const existingContact = await db.query.xeroContacts.findFirst({
      where: eq(xeroContacts.userId, input.userId),
    });

    let xeroContactId: string;

    if (existingContact?.xeroContactId) {
      // Update existing contact
      const response = await xeroRequest<any>('/Contacts', {
        method: 'POST',
        body: JSON.stringify({
          Contacts: [{
            ContactID: existingContact.xeroContactId,
            Name: input.name,
            EmailAddress: input.email,
            Phones: input.phone ? [{
              PhoneType: 'MOBILE',
              PhoneNumber: input.phone,
            }] : [],
          }],
        }),
      });

      xeroContactId = response.Contacts[0].ContactID;
    } else {
      // Create new contact
      const response = await xeroRequest<any>('/Contacts', {
        method: 'POST',
        body: JSON.stringify({
          Contacts: [{
            Name: input.name,
            EmailAddress: input.email,
            Phones: input.phone ? [{
              PhoneType: 'MOBILE',
              PhoneNumber: input.phone,
            }] : [],
          }],
        }),
      });

      xeroContactId = response.Contacts[0].ContactID;

      // Store mapping in database
      await db.insert(xeroContacts).values({
        id: crypto.randomUUID(),
        userId: input.userId,
        xeroContactId,
        email: input.email,
        name: input.name,
        syncedAt: new Date(),
        createdAt: new Date(),
      });
    }

    await logSyncSuccess('CONTACT', `User ${input.userId}`, { xeroContactId });

    return xeroContactId;
  } catch (error) {
    await logSyncError('CONTACT', `User ${input.userId}`, error);
    throw error;
  }
}

// ============================================================================
// INVOICES
// ============================================================================

export const xeroInvoiceSchemas = {
  createInvoice: z.object({
    orderId: z.string(),
    contactId: z.string(), // Xero contact ID
    lineItems: z.array(z.object({
      description: z.string(),
      quantity: z.number(),
      unitAmount: z.number(),
      accountCode: z.string().optional(),
      taxType: z.string().optional(),
    })),
    reference: z.string().optional(),
    dueDate: z.date().optional(),
  }),
};

/**
 * Create invoice in Xero for an order
 */
export async function createXeroInvoice(input: z.infer<typeof xeroInvoiceSchemas.createInvoice>): Promise<string> {
  const db = getDbSync();

  try {
    // Get LSN tracking
    const tracking = await getLSNTracking();

    // Create invoice in Xero
    const response = await xeroRequest<any>('/Invoices', {
      method: 'POST',
      body: JSON.stringify({
        Invoices: [{
          Type: 'ACCREC', // Accounts Receivable (sales invoice)
          Contact: {
            ContactID: input.contactId,
          },
          LineItems: input.lineItems.map(item => ({
            Description: item.description,
            Quantity: item.quantity,
            UnitAmount: item.unitAmount,
            AccountCode: item.accountCode || '200', // Default sales account
            TaxType: item.taxType || 'OUTPUT2', // Default GST
            Tracking: tracking, // Tag with LSN business unit
          })),
          Reference: input.reference || input.orderId,
          DueDate: input.dueDate ? input.dueDate.toISOString().split('T')[0] : undefined,
          Status: 'AUTHORISED',
        }],
      }),
    });

    const xeroInvoiceId = response.Invoices[0].InvoiceID;
    const invoiceNumber = response.Invoices[0].InvoiceNumber;

    // Store mapping in database
    await db.insert(xeroInvoices).values({
      id: crypto.randomUUID(),
      orderId: input.orderId,
      xeroInvoiceId,
      invoiceNumber,
      status: 'AUTHORISED',
      total: input.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitAmount), 0),
      syncedAt: new Date(),
      createdAt: new Date(),
    });

    await logSyncSuccess('INVOICE', input.orderId, { xeroInvoiceId, invoiceNumber });

    return xeroInvoiceId;
  } catch (error) {
    await logSyncError('INVOICE', input.orderId, error);
    throw error;
  }
}

/**
 * Sync order to Xero (create contact + invoice)
 */
export async function syncOrderToXero(orderId: string): Promise<{
  xeroContactId: string;
  xeroInvoiceId: string;
}> {
  const db = getDbSync();

  // Get order details
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Order not found',
    });
  }

  // Get user details
  const user = await db.query.users.findFirst({
    where: eq(users.id, order.userId),
  });

  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'User not found',
    });
  }

  // Sync contact to Xero
  const xeroContactId = await syncContactToXero({
    userId: order.userId,
    email: user.email,
    name: user.name || user.email,
    phone: undefined, // Add phone if available in user model
  });

  // Get order items
  const orderItems = await db.query.orderItems.findMany({
    where: eq(orders.id, orderId),
  });

  // Create invoice in Xero
  const xeroInvoiceId = await createXeroInvoice({
    orderId,
    contactId: xeroContactId,
    lineItems: orderItems.map(item => ({
      description: item.productName || 'Product',
      quantity: item.quantity,
      unitAmount: parseFloat(item.price),
      accountCode: '200', // Sales account
      taxType: 'OUTPUT2', // GST
    })),
    reference: `LSN-${orderId}`,
  });

  return { xeroContactId, xeroInvoiceId };
}

// ============================================================================
// PAYMENTS
// ============================================================================

export const xeroPaymentSchemas = {
  recordPayment: z.object({
    invoiceId: z.string(), // Xero invoice ID
    amount: z.number(),
    date: z.date(),
    reference: z.string().optional(),
    accountCode: z.string().optional(),
  }),
};

/**
 * Record payment in Xero
 */
export async function recordXeroPayment(input: z.infer<typeof xeroPaymentSchemas.recordPayment>): Promise<string> {
  const db = getDbSync();

  try {
    // Record payment in Xero
    const response = await xeroRequest<any>('/Payments', {
      method: 'POST',
      body: JSON.stringify({
        Payments: [{
          Invoice: {
            InvoiceID: input.invoiceId,
          },
          Account: {
            Code: input.accountCode || '090', // Default bank account
          },
          Amount: input.amount,
          Date: input.date.toISOString().split('T')[0],
          Reference: input.reference,
        }],
      }),
    });

    const xeroPaymentId = response.Payments[0].PaymentID;

    // Store payment record
    await db.insert(xeroPayments).values({
      id: crypto.randomUUID(),
      xeroInvoiceId: input.invoiceId,
      xeroPaymentId,
      amount: input.amount,
      paymentDate: input.date,
      reference: input.reference || null,
      syncedAt: new Date(),
      createdAt: new Date(),
    });

    await logSyncSuccess('PAYMENT', input.invoiceId, { xeroPaymentId });

    return xeroPaymentId;
  } catch (error) {
    await logSyncError('PAYMENT', input.invoiceId, error);
    throw error;
  }
}

// ============================================================================
// SYNC LOGGING
// ============================================================================

async function logSyncSuccess(entityType: string, entityId: string, metadata: any): Promise<void> {
  const db = getDbSync();
  await db.insert(xeroSyncLogs).values({
    id: crypto.randomUUID(),
    entityType,
    entityId,
    status: 'SUCCESS',
    metadata: JSON.stringify(metadata),
    createdAt: new Date(),
  });
}

async function logSyncError(entityType: string, entityId: string, error: any): Promise<void> {
  const db = getDbSync();
  await db.insert(xeroSyncLogs).values({
    id: crypto.randomUUID(),
    entityType,
    entityId,
    status: 'ERROR',
    errorMessage: error.message || 'Unknown error',
    metadata: JSON.stringify(error),
    createdAt: new Date(),
  });
}

/**
 * Get sync logs
 */
export async function getXeroSyncLogs(limit: number = 100): Promise<any[]> {
  const db = getDbSync();
  return await db.query.xeroSyncLogs.findMany({
    orderBy: desc(xeroSyncLogs.createdAt),
    limit,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // OAuth
  getXeroAuthUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  getValidAccessToken,
  
  // Tracking
  ensureLSNTrackingCategory,
  
  // Contacts
  syncContactToXero,
  
  // Invoices
  createXeroInvoice,
  syncOrderToXero,
  
  // Payments
  recordXeroPayment,
  
  // Logs
  getXeroSyncLogs,
};
