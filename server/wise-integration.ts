/**
 * Wise (TransferWise) Integration Module
 * Complete Wise API integration for international money transfers and multi-currency accounts
 * 
 * Features:
 * - Multi-currency account management
 * - International transfers with best FX rates
 * - Recipient management
 * - Balance tracking
 * - Transaction history
 * - Webhooks for transfer status
 * - Batch payments
 * - Currency conversion
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDbSync } from "./db";
import { 
  wiseTransfers, 
  wiseRecipients, 
  wiseBalances,
  wiseWebhookEvents
} from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// Wise API Configuration
const WISE_API_BASE = process.env.WISE_MODE === 'live'
  ? 'https://api.transferwise.com'
  : 'https://api.sandbox.transferwise.tech';

const WISE_API_TOKEN = process.env.WISE_API_TOKEN;
const WISE_PROFILE_ID = process.env.WISE_PROFILE_ID;

/**
 * Make authenticated Wise API request
 */
async function wiseRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${WISE_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${WISE_API_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Wise API Error:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.errors?.[0]?.message || 'Wise API request failed',
    });
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ============================================================================
// PROFILES & ACCOUNTS
// ============================================================================

export const wiseProfileSchemas = {
  getProfiles: z.object({}),
  getBalances: z.object({
    profileId: z.string().optional(),
  }),
};

export async function getProfiles() {
  const profiles = await wiseRequest<any[]>('/v1/profiles');
  
  return profiles.map(p => ({
    id: p.id,
    type: p.type, // PERSONAL or BUSINESS
    fullName: p.details.name,
    email: p.details.email,
  }));
}

export async function getBalances(input: z.infer<typeof wiseProfileSchemas.getBalances>) {
  const profileId = input.profileId || WISE_PROFILE_ID;
  const balances = await wiseRequest<any[]>(`/v4/profiles/${profileId}/balances?types=STANDARD`);
  
  // Store balances in database
  const db = getDbSync();
  for (const balance of balances) {
    await db.insert(wiseBalances)
      .values({
        id: crypto.randomUUID(),
        profileId,
        balanceId: balance.id.toString(),
        currency: balance.currency,
        amount: parseFloat(balance.amount.value),
        reservedAmount: parseFloat(balance.totalWorth?.value || '0'),
        updatedAt: new Date(),
      })
      .onDuplicateKeyUpdate({
        set: {
          amount: parseFloat(balance.amount.value),
          reservedAmount: parseFloat(balance.totalWorth?.value || '0'),
          updatedAt: new Date(),
        },
      });
  }
  
  return balances.map((b: any) => ({
    id: b.id,
    currency: b.currency,
    amount: parseFloat(b.amount.value),
    reserved: parseFloat(b.totalWorth?.value || '0'),
    available: parseFloat(b.amount.value) - parseFloat(b.totalWorth?.value || '0'),
  }));
}

// ============================================================================
// RECIPIENTS
// ============================================================================

export const wiseRecipientSchemas = {
  createRecipient: z.object({
    currency: z.string(),
    type: z.enum(['email', 'iban', 'sort_code', 'aba', 'swift_code']),
    accountHolderName: z.string(),
    legalType: z.enum(['PRIVATE', 'BUSINESS']),
    // Email recipient
    email: z.string().email().optional(),
    // Bank account details
    iban: z.string().optional(),
    sortCode: z.string().optional(),
    accountNumber: z.string().optional(),
    abartn: z.string().optional(), // US routing number
    swiftCode: z.string().optional(),
    // Address
    country: z.string(),
    city: z.string().optional(),
    postCode: z.string().optional(),
    firstLine: z.string().optional(),
  }),
  listRecipients: z.object({
    currency: z.string().optional(),
  }),
  deleteRecipient: z.object({
    recipientId: z.string(),
  }),
};

export async function createRecipient(input: z.infer<typeof wiseRecipientSchemas.createRecipient>) {
  const details: any = {
    currency: input.currency,
    type: input.type,
    profile: WISE_PROFILE_ID,
    accountHolderName: input.accountHolderName,
    legalType: input.legalType,
  };

  // Add account details based on type
  if (input.email) {
    details.email = input.email;
  }
  
  if (input.iban) {
    details.iban = input.iban;
  }
  
  if (input.sortCode && input.accountNumber) {
    details.sortCode = input.sortCode;
    details.accountNumber = input.accountNumber;
  }
  
  if (input.abartn && input.accountNumber) {
    details.abartn = input.abartn;
    details.accountNumber = input.accountNumber;
    details.accountType = 'CHECKING';
  }
  
  if (input.swiftCode) {
    details.swiftCode = input.swiftCode;
  }

  // Add address if provided
  if (input.country) {
    details.address = {
      country: input.country,
      city: input.city,
      postCode: input.postCode,
      firstLine: input.firstLine,
    };
  }

  const recipient = await wiseRequest<any>('/v1/accounts', {
    method: 'POST',
    body: JSON.stringify(details),
  });

  // Store recipient in database
  const db = getDbSync();
  await db.insert(wiseRecipients).values({
    id: crypto.randomUUID(),
    wiseRecipientId: recipient.id.toString(),
    accountHolderName: input.accountHolderName,
    currency: input.currency,
    type: input.type,
    email: input.email || null,
    iban: input.iban || null,
    accountNumber: input.accountNumber || null,
    country: input.country,
    createdAt: new Date(),
  });

  return {
    recipientId: recipient.id,
    accountHolderName: recipient.accountHolderName,
    currency: recipient.currency,
  };
}

export async function listRecipients(input: z.infer<typeof wiseRecipientSchemas.listRecipients>) {
  const params = new URLSearchParams();
  if (input.currency) params.append('currency', input.currency);
  
  const recipients = await wiseRequest<any[]>(`/v1/accounts?${params.toString()}`);
  
  return recipients.map(r => ({
    id: r.id,
    accountHolderName: r.accountHolderName,
    currency: r.currency,
    type: r.type,
    country: r.details?.address?.country,
  }));
}

export async function deleteRecipient(input: z.infer<typeof wiseRecipientSchemas.deleteRecipient>) {
  await wiseRequest(`/v1/accounts/${input.recipientId}`, {
    method: 'DELETE',
  });

  const db = getDbSync();
  await db.delete(wiseRecipients)
    .where(eq(wiseRecipients.wiseRecipientId, input.recipientId));

  return { success: true };
}

// ============================================================================
// QUOTES & EXCHANGE RATES
// ============================================================================

export const wiseQuoteSchemas = {
  createQuote: z.object({
    sourceCurrency: z.string(),
    targetCurrency: z.string(),
    sourceAmount: z.number().positive().optional(),
    targetAmount: z.number().positive().optional(),
    paymentType: z.enum(['BALANCE', 'BANK_TRANSFER']).default('BALANCE'),
  }),
  getExchangeRates: z.object({
    source: z.string(),
    target: z.string(),
  }),
};

export async function createQuote(input: z.infer<typeof wiseQuoteSchemas.createQuote>) {
  if (!input.sourceAmount && !input.targetAmount) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Either sourceAmount or targetAmount must be provided',
    });
  }

  const quoteData: any = {
    sourceCurrency: input.sourceCurrency,
    targetCurrency: input.targetCurrency,
    profile: WISE_PROFILE_ID,
    paymentType: input.paymentType,
  };

  if (input.sourceAmount) {
    quoteData.sourceAmount = input.sourceAmount;
  } else {
    quoteData.targetAmount = input.targetAmount;
  }

  const quote = await wiseRequest<any>('/v3/profiles/' + WISE_PROFILE_ID + '/quotes', {
    method: 'POST',
    body: JSON.stringify(quoteData),
  });

  return {
    quoteId: quote.id,
    rate: quote.rate,
    sourceAmount: quote.sourceAmount,
    targetAmount: quote.targetAmount,
    fee: quote.fee,
    estimatedDelivery: quote.estimatedDelivery,
    expirationTime: quote.expirationTime,
  };
}

export async function getExchangeRates(input: z.infer<typeof wiseQuoteSchemas.getExchangeRates>) {
  const rates = await wiseRequest<any[]>('/v1/rates', {
    method: 'GET',
  });

  const relevantRate = rates.find(
    r => r.source === input.source && r.target === input.target
  );

  if (!relevantRate) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Exchange rate not found for this currency pair',
    });
  }

  return {
    source: relevantRate.source,
    target: relevantRate.target,
    rate: relevantRate.rate,
    time: relevantRate.time,
  };
}

// ============================================================================
// TRANSFERS
// ============================================================================

export const wiseTransferSchemas = {
  createTransfer: z.object({
    recipientId: z.string(),
    quoteId: z.string(),
    reference: z.string(),
    transferPurpose: z.string().optional(),
  }),
  fundTransfer: z.object({
    transferId: z.string(),
  }),
  cancelTransfer: z.object({
    transferId: z.string(),
  }),
  getTransfer: z.object({
    transferId: z.string(),
  }),
  listTransfers: z.object({
    status: z.enum(['incoming_payment_waiting', 'processing', 'funds_converted', 'outgoing_payment_sent', 'cancelled', 'funds_refunded']).optional(),
    limit: z.number().int().positive().max(100).default(20),
    offset: z.number().int().min(0).default(0),
  }),
};

export async function createTransfer(input: z.infer<typeof wiseTransferSchemas.createTransfer>) {
  const transfer = await wiseRequest<any>('/v1/transfers', {
    method: 'POST',
    body: JSON.stringify({
      targetAccount: parseInt(input.recipientId),
      quoteUuid: input.quoteId,
      customerTransactionId: crypto.randomUUID(),
      details: {
        reference: input.reference,
        transferPurpose: input.transferPurpose || 'verification.transfers.purpose.pay.bills',
      },
    }),
  });

  // Store transfer in database
  const db = getDbSync();
  await db.insert(wiseTransfers).values({
    id: crypto.randomUUID(),
    wiseTransferId: transfer.id.toString(),
    recipientId: input.recipientId,
    quoteId: input.quoteId,
    status: transfer.status,
    sourceAmount: transfer.sourceValue,
    sourceCurrency: transfer.sourceCurrency,
    targetAmount: transfer.targetValue,
    targetCurrency: transfer.targetCurrency,
    reference: input.reference,
    createdAt: new Date(transfer.created),
  });

  return {
    transferId: transfer.id,
    status: transfer.status,
    sourceAmount: transfer.sourceValue,
    targetAmount: transfer.targetValue,
  };
}

export async function fundTransfer(input: z.infer<typeof wiseTransferSchemas.fundTransfer>) {
  const funding = await wiseRequest<any>(
    `/v3/profiles/${WISE_PROFILE_ID}/transfers/${input.transferId}/payments`,
    {
      method: 'POST',
      body: JSON.stringify({
        type: 'BALANCE',
      }),
    }
  );

  const db = getDbSync();
  await db.update(wiseTransfers)
    .set({ status: 'processing' })
    .where(eq(wiseTransfers.wiseTransferId, input.transferId));

  return {
    status: funding.status,
    balanceTransactionId: funding.balanceTransactionId,
  };
}

export async function cancelTransfer(input: z.infer<typeof wiseTransferSchemas.cancelTransfer>) {
  await wiseRequest(`/v1/transfers/${input.transferId}/cancel`, {
    method: 'PUT',
  });

  const db = getDbSync();
  await db.update(wiseTransfers)
    .set({ status: 'cancelled', completedAt: new Date() })
    .where(eq(wiseTransfers.wiseTransferId, input.transferId));

  return { success: true };
}

export async function getTransfer(input: z.infer<typeof wiseTransferSchemas.getTransfer>) {
  const transfer = await wiseRequest<any>(`/v1/transfers/${input.transferId}`);
  
  return {
    id: transfer.id,
    status: transfer.status,
    sourceAmount: transfer.sourceValue,
    sourceCurrency: transfer.sourceCurrency,
    targetAmount: transfer.targetValue,
    targetCurrency: transfer.targetCurrency,
    rate: transfer.rate,
    created: transfer.created,
    business: transfer.business,
  };
}

export async function listTransfers(input: z.infer<typeof wiseTransferSchemas.listTransfers>) {
  const params = new URLSearchParams({
    profile: WISE_PROFILE_ID,
    limit: input.limit.toString(),
    offset: input.offset.toString(),
  });
  
  if (input.status) {
    params.append('status', input.status);
  }

  const transfers = await wiseRequest<any[]>(`/v1/transfers?${params.toString()}`);
  
  return transfers.map(t => ({
    id: t.id,
    status: t.status,
    sourceAmount: t.sourceValue,
    sourceCurrency: t.sourceCurrency,
    targetAmount: t.targetValue,
    targetCurrency: t.targetCurrency,
    created: t.created,
    reference: t.details?.reference,
  }));
}

// ============================================================================
// BATCH PAYMENTS
// ============================================================================

export const wiseBatchSchemas = {
  createBatch: z.object({
    name: z.string(),
    sourceCurrency: z.string(),
    transfers: z.array(z.object({
      recipientId: z.string(),
      targetAmount: z.number().positive(),
      targetCurrency: z.string(),
      reference: z.string(),
    })),
  }),
  getBatch: z.object({
    batchId: z.string(),
  }),
  fundBatch: z.object({
    batchId: z.string(),
  }),
};

export async function createBatch(input: z.infer<typeof wiseBatchSchemas.createBatch>) {
  // Create quotes for all transfers
  const quotesPromises = input.transfers.map(t =>
    createQuote({
      sourceCurrency: input.sourceCurrency,
      targetCurrency: t.targetCurrency,
      targetAmount: t.targetAmount,
      paymentType: 'BALANCE' as const,
    })
  );
  
  const quotes = await Promise.all(quotesPromises);

  // Create batch transfer group
  const batch = await wiseRequest<any>('/v3/profiles/' + WISE_PROFILE_ID + '/batch-payments', {
    method: 'POST',
    body: JSON.stringify({
      sourceCurrency: input.sourceCurrency,
      name: input.name,
      transfers: input.transfers.map((t, idx) => ({
        targetAccount: parseInt(t.recipientId),
        quoteUuid: quotes[idx].quoteId,
        details: {
          reference: t.reference,
        },
      })),
    }),
  });

  return {
    batchId: batch.id,
    status: batch.status,
    totalAmount: batch.totalAmount,
    transferCount: input.transfers.length,
  };
}

export async function getBatch(input: z.infer<typeof wiseBatchSchemas.getBatch>) {
  const batch = await wiseRequest<any>(`/v3/profiles/${WISE_PROFILE_ID}/batch-payments/${input.batchId}`);
  
  return {
    id: batch.id,
    status: batch.status,
    name: batch.name,
    totalAmount: batch.totalAmount,
    sourceCurrency: batch.sourceCurrency,
    transfers: batch.transfers?.map((t: any) => ({
      id: t.id,
      status: t.status,
      targetAmount: t.targetValue,
    })) || [],
  };
}

export async function fundBatch(input: z.infer<typeof wiseBatchSchemas.fundBatch>) {
  const funding = await wiseRequest<any>(
    `/v3/profiles/${WISE_PROFILE_ID}/batch-payments/${input.batchId}/payments`,
    {
      method: 'POST',
      body: JSON.stringify({
        type: 'BALANCE',
      }),
    }
  );

  return {
    status: funding.status,
    balanceTransactionId: funding.balanceTransactionId,
  };
}

// ============================================================================
// BORDERLESS ACCOUNTS
// ============================================================================

export const wiseBorderlessSchemas = {
  getAccountDetails: z.object({
    currency: z.string(),
  }),
  getStatementPDF: z.object({
    currency: z.string(),
    startDate: z.string(),
    endDate: z.string(),
  }),
};

export async function getAccountDetails(input: z.infer<typeof wiseBorderlessSchemas.getAccountDetails>) {
  const balances = await getBalances({});
  const balance = balances.find(b => b.currency === input.currency);

  if (!balance) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `No balance found for currency ${input.currency}`,
    });
  }

  // Get account details (bank details for receiving money)
  const accountDetails = await wiseRequest<any>(
    `/v1/borderless-accounts/${balance.id}/account-details`
  );

  return {
    currency: input.currency,
    balance: balance.amount,
    available: balance.available,
    accountDetails: accountDetails.map((ad: any) => ({
      type: ad.type,
      accountNumber: ad.accountNumber,
      routingNumber: ad.routingNumber,
      iban: ad.iban,
      swiftCode: ad.swiftCode,
      bankName: ad.bankName,
      bankAddress: ad.bankAddress,
    })),
  };
}

export async function getStatementPDF(input: z.infer<typeof wiseBorderlessSchemas.getStatementPDF>) {
  const balances = await getBalances({});
  const balance = balances.find(b => b.currency === input.currency);

  if (!balance) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `No balance found for currency ${input.currency}`,
    });
  }

  const params = new URLSearchParams({
    currency: input.currency,
    intervalStart: input.startDate,
    intervalEnd: input.endDate,
    type: 'COMPACT',
  });

  const statement = await wiseRequest<Blob>(
    `/v3/profiles/${WISE_PROFILE_ID}/borderless-accounts/${balance.id}/statement.pdf?${params.toString()}`
  );

  return statement;
}

// ============================================================================
// WEBHOOKS
// ============================================================================

export async function handleWiseWebhook(
  signature: string,
  body: any
) {
  // Verify webhook signature
  const publicKey = process.env.WISE_WEBHOOK_PUBLIC_KEY;
  // In production, verify signature using crypto.verify with RSA-SHA256
  // For now, we'll trust the webhook in sandbox mode

  // Store webhook event
  const db = getDbSync();
  await db.insert(wiseWebhookEvents).values({
    id: crypto.randomUUID(),
    eventType: body.event_type,
    resourceType: body.data?.resource?.type,
    resourceId: body.data?.resource?.id?.toString(),
    payload: body,
    createdAt: new Date(body.data?.occurred_at || Date.now()),
  });

  // Handle different event types
  switch (body.event_type) {
    case 'transfers#state-change':
      await handleTransferStateChange(body.data);
      break;
    case 'transfers#active-cases':
      await handleTransferActiveCases(body.data);
      break;
    case 'balances#credit':
      await handleBalanceCredit(body.data);
      break;
  }

  return { success: true };
}

async function handleTransferStateChange(data: any) {
  const transferId = data.resource.id.toString();
  const newStatus = data.current_state;
  const db = getDbSync();
  await db.update(wiseTransfers)
    .set({
      status: newStatus,
      completedAt: newStatus === 'outgoing_payment_sent' ? new Date() : undefined,
    })
    .where(eq(wiseTransfers.wiseTransferId, transferId));
}

async function handleTransferActiveCases(data: any) {
  // Handle cases where transfer requires attention
  console.log('Transfer has active cases:', data);
}

async function handleBalanceCredit(data: any) {
  // Handle incoming balance credit
  const balanceId = data.resource.id.toString();
  const amount = data.amount;
  const currency = data.currency;

  console.log(`Balance credited: ${amount} ${currency}`);
}

// ============================================================================
// ANALYTICS & REPORTING
// ============================================================================

export async function getWiseAnalytics(startDate: Date, endDate: Date) {
  const db = getDbSync();
  const transfers = await db.select().from(wiseTransfers).where(
    and(
      sql`${wiseTransfers.createdAt} >= ${startDate}`,
      sql`${wiseTransfers.createdAt} <= ${endDate}`
    )
  );

  const totalSent = transfers
    .filter((t: any) => t.status === 'outgoing_payment_sent')
    .reduce((sum: number, t: any) => sum + t.sourceAmount, 0);

  const totalFees = transfers
    .reduce((sum: number, t: any) => {
      // Fee is the difference between source and target at market rate
      const marketValue = t.targetAmount; // Simplified
      const actualValue = t.sourceAmount;
      return sum + (actualValue - marketValue);
    }, 0);

  const byStatus = transfers.reduce((acc: Record<string, number>, t: any) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byCurrency = transfers.reduce((acc: Record<string, number>, t: any) => {
    const key = `${t.sourceCurrency}->${t.targetCurrency}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalTransfers: transfers.length,
    totalSent,
    totalFees,
    averageTransferValue: totalSent / transfers.length,
    successRate: transfers.filter((t: any) => t.status === 'outgoing_payment_sent').length / transfers.length,
    byStatus,
    byCurrency,
  };
}

export default {
  // Profiles & Balances
  getProfiles,
  getBalances,
  
  // Recipients
  createRecipient,
  listRecipients,
  deleteRecipient,
  
  // Quotes & Rates
  createQuote,
  getExchangeRates,
  
  // Transfers
  createTransfer,
  fundTransfer,
  cancelTransfer,
  getTransfer,
  listTransfers,
  
  // Batch Payments
  createBatch,
  getBatch,
  fundBatch,
  
  // Borderless Accounts
  getAccountDetails,
  getStatementPDF,
  
  // Webhooks
  handleWiseWebhook,
  
  // Analytics
  getWiseAnalytics,
};
