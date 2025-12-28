/**
 * Wallet and Payment tRPC Procedures
 * Handles virtual wallets, transactions, deposits, and withdrawals
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from './_core/trpc';
import * as db from './db';
import { wallets, transactions } from '../drizzle/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import * as paymentService from './payment-service';

export const walletRouter = router({
  // ============================================================================
  // GET WALLET BALANCE
  // ============================================================================
  
  getBalance: protectedProcedure
    .query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) throw new Error('Database not available');
      
      const wallet = await database
        .select()
        .from(wallets)
        .where(eq(wallets.userId, ctx.user.id))
        .limit(1);
      
      if (!wallet[0]) {
        // Create wallet if doesn't exist
        const walletId = nanoid();
        await database.insert(wallets).values({
          id: walletId,
          userId: ctx.user.id,
          balance: '0.00',
          pendingBalance: '0.00',
          lifetimeEarnings: '0.00',
          lifetimeSpending: '0.00',
          currency: 'USD',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        return {
          balance: 0,
          pendingBalance: 0,
          availableForWithdrawal: 0,
        };
      }
      
      const balance = parseFloat(wallet[0].balance);
      const pendingBalance = parseFloat(wallet[0].pendingBalance);
      
      return {
        balance,
        pendingBalance,
        availableForWithdrawal: balance - pendingBalance,
      };
    }),
  
  // ============================================================================
  // GET TRANSACTION HISTORY
  // ============================================================================
  
  getTransactions: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      const database = await db.getDb();
      if (!database) return [];
      
      const txns = await database
        .select()
        .from(transactions)
        .where(eq(transactions.userId, ctx.user.id))
        .orderBy(desc(transactions.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      
      return txns;
    }),
  
  // ============================================================================
  // ADD FUNDS TO WALLET
  // ============================================================================
  
  addFunds: protectedProcedure
    .input(z.object({
      amount: z.number().min(1).max(10000),
      paymentMethodId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // In production, this would process actual payment via Stripe
      // For now, we'll simulate adding funds
      
      const database = await db.getDb();
      if (!database) throw new Error('Database not available');
      
      const wallet = await database
        .select()
        .from(wallets)
        .where(eq(wallets.userId, ctx.user.id))
        .limit(1);
      
      if (!wallet[0]) {
        throw new Error('Wallet not found');
      }
      
      const transactionId = nanoid();
      const newBalance = parseFloat(wallet[0].balance) + input.amount;
      
      // Update wallet balance
      await database
        .update(wallets)
        .set({
          balance: newBalance.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, ctx.user.id));
      
      // Create transaction record
      await database.insert(transactions).values({
        id: transactionId,
        userId: ctx.user.id,
        type: 'deposit',
        amount: input.amount.toFixed(2),
        currency: 'USD',
        status: 'completed',
        metadata: { method: 'stripe' },
        createdAt: new Date(),
      });
      
      return {
        success: true,
        transactionId,
        newBalance,
      };
    }),
  
  // ============================================================================
  // WITHDRAW FUNDS
  // ============================================================================
  
  withdraw: protectedProcedure
    .input(z.object({
      amount: z.number().min(10).max(50000),
      method: z.enum(['bank_account', 'paypal', 'stripe']).default('bank_account'),
    }))
    .mutation(async ({ input, ctx }) => {
      const database = await db.getDb();
      if (!database) throw new Error('Database not available');
      
      const wallet = await database
        .select()
        .from(wallets)
        .where(eq(wallets.userId, ctx.user.id))
        .limit(1);
      
      if (!wallet[0]) {
        throw new Error('Wallet not found');
      }
      
      const balance = parseFloat(wallet[0].balance);
      const pendingBalance = parseFloat(wallet[0].pendingBalance);
      const available = balance - pendingBalance;
      
      if (available < input.amount) {
        throw new Error('Insufficient available balance');
      }
      
      const transactionId = nanoid();
      
      // Update wallet - move to pending
      await database
        .update(wallets)
        .set({
          pendingBalance: (pendingBalance + input.amount).toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, ctx.user.id));
      
      // Create withdrawal transaction
      await database.insert(transactions).values({
        id: transactionId,
        userId: ctx.user.id,
        type: 'withdrawal',
        amount: (-input.amount).toFixed(2),
        currency: 'USD',
        status: 'pending',
        metadata: { method: input.method },
        createdAt: new Date(),
      });
      
      return {
        success: true,
        transactionId,
        estimatedArrival: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      };
    }),
  
  // ============================================================================
  // GET WALLET STATS
  // ============================================================================
  
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const database = await db.getDb();
      if (!database) return {
        lifetimeEarnings: 0,
        lifetimeSpending: 0,
        totalTransactions: 0,
      };
      
      const wallet = await database
        .select()
        .from(wallets)
        .where(eq(wallets.userId, ctx.user.id))
        .limit(1);
      
      if (!wallet[0]) {
        return {
          lifetimeEarnings: 0,
          lifetimeSpending: 0,
          totalTransactions: 0,
        };
      }
      
      const txCount = await database
        .select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(eq(transactions.userId, ctx.user.id));
      
      return {
        lifetimeEarnings: parseFloat(wallet[0].lifetimeEarnings),
        lifetimeSpending: parseFloat(wallet[0].lifetimeSpending),
        totalTransactions: txCount[0]?.count || 0,
      };
    }),
  
  // ============================================================================
  // TRANSFER TO ANOTHER USER (for gifts)
  // ============================================================================
  
  transfer: protectedProcedure
    .input(z.object({
      recipientId: z.number(),
      amount: z.number().min(0.01).max(10000),
      reason: z.string().optional(),
      metadata: z.any().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const database = await db.getDb();
      if (!database) throw new Error('Database not available');
      
      // Get sender wallet
      const senderWallet = await database
        .select()
        .from(wallets)
        .where(eq(wallets.userId, ctx.user.id))
        .limit(1);
      
      if (!senderWallet[0]) {
        throw new Error('Sender wallet not found');
      }
      
      const senderBalance = parseFloat(senderWallet[0].balance);
      
      if (senderBalance < input.amount) {
        throw new Error('Insufficient balance');
      }
      
      // Get recipient wallet
      const recipientWallet = await database
        .select()
        .from(wallets)
        .where(eq(wallets.userId, input.recipientId))
        .limit(1);
      
      if (!recipientWallet[0]) {
        // Create recipient wallet if doesn't exist
        const walletId = nanoid();
        await database.insert(wallets).values({
          id: walletId,
          userId: input.recipientId,
          balance: input.amount.toFixed(2),
          pendingBalance: '0.00',
          lifetimeEarnings: input.amount.toFixed(2),
          lifetimeSpending: '0.00',
          currency: 'USD',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        const recipientBalance = parseFloat(recipientWallet[0].balance);
        const recipientEarnings = parseFloat(recipientWallet[0].lifetimeEarnings);
        
        await database
          .update(wallets)
          .set({
            balance: (recipientBalance + input.amount).toFixed(2),
            lifetimeEarnings: (recipientEarnings + input.amount).toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(wallets.userId, input.recipientId));
      }
      
      // Update sender wallet
      const senderSpending = parseFloat(senderWallet[0].lifetimeSpending);
      await database
        .update(wallets)
        .set({
          balance: (senderBalance - input.amount).toFixed(2),
          lifetimeSpending: (senderSpending + input.amount).toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, ctx.user.id));
      
      // Create transaction records
      const transactionId = nanoid();
      
      await database.insert(transactions).values({
        id: transactionId,
        userId: ctx.user.id,
        type: 'purchase',
        amount: (-input.amount).toFixed(2),
        currency: 'USD',
        status: 'completed',
        metadata: {
          recipientId: input.recipientId,
          reason: input.reason,
          ...input.metadata,
        },
        createdAt: new Date(),
      });
      
      await database.insert(transactions).values({
        id: nanoid(),
        userId: input.recipientId,
        type: 'earning',
        amount: input.amount.toFixed(2),
        currency: 'USD',
        status: 'completed',
        metadata: {
          senderId: ctx.user.id,
          reason: input.reason,
          ...input.metadata,
        },
        createdAt: new Date(),
      });
      
      return {
        success: true,
        transactionId,
      };
    }),
});
