/**
 * Xero Integration tRPC Router
 * 
 * Provides API endpoints for Xero accounting integration:
 * - OAuth connection flow
 * - Manual and automatic sync triggers
 * - Sync status monitoring
 * - Integration dashboard
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDbSync } from "./db";
import { 
  xeroTokens,
  xeroInvoices,
  xeroPayments,
  xeroContacts,
  xeroSyncLogs,
  orders
} from "../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import xeroIntegration from "./xero-integration";

export const xeroRouter = router({
  /**
   * Get Xero connection status
   */
  getConnectionStatus: protectedProcedure.query(async () => {
    const db = getDbSync();
    
    const token = await db.query.xeroTokens.findFirst({
      orderBy: desc(xeroTokens.createdAt),
    });

    if (!token) {
      return {
        connected: false,
        tenantName: null,
        connectedAt: null,
      };
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(token.expiresAt);
    const isExpired = now.getTime() > expiresAt.getTime();

    return {
      connected: !isExpired,
      tenantName: token.tenantName,
      tenantId: token.tenantId,
      connectedAt: token.createdAt,
      expiresAt: token.expiresAt,
      isExpired,
    };
  }),

  /**
   * Get Xero authorization URL
   */
  getAuthUrl: protectedProcedure.query(async () => {
    const authUrl = xeroIntegration.getXeroAuthUrl();
    return { authUrl };
  }),

  /**
   * Disconnect Xero
   */
  disconnect: protectedProcedure.mutation(async () => {
    const db = getDbSync();
    
    // Delete all tokens
    await db.delete(xeroTokens);

    return { success: true };
  }),

  /**
   * Sync order to Xero (manual trigger)
   */
  syncOrder: protectedProcedure
    .input(z.object({
      orderId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await xeroIntegration.syncOrderToXero(input.orderId);
        
        return {
          success: true,
          xeroContactId: result.xeroContactId,
          xeroInvoiceId: result.xeroInvoiceId,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to sync order to Xero',
        });
      }
    }),

  /**
   * Sync payment to Xero (manual trigger)
   */
  syncPayment: protectedProcedure
    .input(z.object({
      orderId: z.string(),
      amount: z.number(),
      paymentDate: z.date(),
      reference: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = getDbSync();

      try {
        // Get Xero invoice for this order
        const xeroInvoice = await db.query.xeroInvoices.findFirst({
          where: eq(xeroInvoices.orderId, input.orderId),
        });

        if (!xeroInvoice) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Order not synced to Xero yet. Please sync the order first.',
          });
        }

        const xeroPaymentId = await xeroIntegration.recordXeroPayment({
          invoiceId: xeroInvoice.xeroInvoiceId,
          amount: input.amount,
          date: input.paymentDate,
          reference: input.reference,
        });

        return {
          success: true,
          xeroPaymentId,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to sync payment to Xero',
        });
      }
    }),

  /**
   * Bulk sync orders to Xero
   */
  bulkSyncOrders: protectedProcedure
    .input(z.object({
      orderIds: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const results = {
        success: [] as string[],
        failed: [] as { orderId: string; error: string }[],
      };

      for (const orderId of input.orderIds) {
        try {
          await xeroIntegration.syncOrderToXero(orderId);
          results.success.push(orderId);
        } catch (error: any) {
          results.failed.push({
            orderId,
            error: error.message || 'Unknown error',
          });
        }
      }

      return results;
    }),

  /**
   * Get sync logs
   */
  getSyncLogs: protectedProcedure
    .input(z.object({
      limit: z.number().default(100),
      entityType: z.enum(['CONTACT', 'INVOICE', 'PAYMENT', 'API_REQUEST']).optional(),
      status: z.enum(['SUCCESS', 'ERROR']).optional(),
    }))
    .query(async ({ input }) => {
      const db = getDbSync();

      const conditions = [];
      if (input.entityType) {
        conditions.push(eq(xeroSyncLogs.entityType, input.entityType));
      }
      if (input.status) {
        conditions.push(eq(xeroSyncLogs.status, input.status));
      }

      const logs = await db.query.xeroSyncLogs.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: desc(xeroSyncLogs.createdAt),
        limit: input.limit,
      });

      return logs;
    }),

  /**
   * Get sync statistics
   */
  getSyncStats: protectedProcedure.query(async () => {
    const db = getDbSync();

    // Total synced invoices
    const totalInvoices = await db.select({ count: sql<number>`count(*)` })
      .from(xeroInvoices);

    // Total synced payments
    const totalPayments = await db.select({ count: sql<number>`count(*)` })
      .from(xeroPayments);

    // Total synced contacts
    const totalContacts = await db.select({ count: sql<number>`count(*)` })
      .from(xeroContacts);

    // Recent sync errors
    const recentErrors = await db.select({ count: sql<number>`count(*)` })
      .from(xeroSyncLogs)
      .where(and(
        eq(xeroSyncLogs.status, 'ERROR'),
        sql`${xeroSyncLogs.createdAt} >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
      ));

    // Recent successful syncs
    const recentSuccess = await db.select({ count: sql<number>`count(*)` })
      .from(xeroSyncLogs)
      .where(and(
        eq(xeroSyncLogs.status, 'SUCCESS'),
        sql`${xeroSyncLogs.createdAt} >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
      ));

    return {
      totalInvoices: totalInvoices[0]?.count || 0,
      totalPayments: totalPayments[0]?.count || 0,
      totalContacts: totalContacts[0]?.count || 0,
      recentErrors: recentErrors[0]?.count || 0,
      recentSuccess: recentSuccess[0]?.count || 0,
    };
  }),

  /**
   * Get unsynced orders
   */
  getUnsyncedOrders: protectedProcedure
    .input(z.object({
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = getDbSync();

      // Get orders that don't have a Xero invoice
      const unsyncedOrders = await db.select({
        id: orders.id,
        userId: orders.userId,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(xeroInvoices, eq(orders.id, xeroInvoices.orderId))
      .where(sql`${xeroInvoices.id} IS NULL`)
      .orderBy(desc(orders.createdAt))
      .limit(input.limit);

      return unsyncedOrders;
    }),

  /**
   * Get synced invoice details
   */
  getInvoiceDetails: protectedProcedure
    .input(z.object({
      orderId: z.string(),
    }))
    .query(async ({ input }) => {
      const db = getDbSync();

      const invoiceResults = await db.select()
        .from(xeroInvoices)
        .where(eq(xeroInvoices.orderId, input.orderId))
        .limit(1);

      const invoice = invoiceResults[0];

      if (!invoice) {
        return null;
      }

      // Get associated payments
      const payments = await db.select()
        .from(xeroPayments)
        .where(eq(xeroPayments.xeroInvoiceId, invoice.xeroInvoiceId))
        .orderBy(desc(xeroPayments.paymentDate));

      return {
        invoice,
        payments,
      };
    }),

  /**
   * Ensure LSN tracking category exists
   */
  setupTrackingCategory: protectedProcedure.mutation(async () => {
    try {
      const trackingCategoryId = await xeroIntegration.ensureLSNTrackingCategory();
      
      return {
        success: true,
        trackingCategoryId,
        message: 'LSN tracking category configured successfully',
      };
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to setup tracking category',
      });
    }
  }),

  /**
   * Test Xero connection
   */
  testConnection: protectedProcedure.mutation(async () => {
    try {
      const { token, tenantId } = await xeroIntegration.getValidAccessToken();
      
      // Make a simple API call to test connection
      const response = await fetch('https://api.xero.com/api.xro/2.0/Organisation', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'xero-tenant-id': tenantId,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to connect to Xero API');
      }

      const data = await response.json();
      const org = data.Organisations[0];

      return {
        success: true,
        organisation: {
          name: org.Name,
          legalName: org.LegalName,
          baseCurrency: org.BaseCurrency,
          countryCode: org.CountryCode,
        },
      };
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to test Xero connection',
      });
    }
  }),
});
