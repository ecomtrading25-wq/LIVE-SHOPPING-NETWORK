import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";
import { eq, and, desc, sql, inArray, gte, lte, between } from "drizzle-orm";
import {
  creators,
  creatorTiers,
  creatorPayoutBatches,
  creatorPayoutLines,
  creatorBankAccounts,
  attributionClicks,
  liveSessions,
  pinnedProducts,
  orders,
  orderItems,
} from "../drizzle/schema";
import { randomBytes } from "crypto";

/**
 * LSN Creator Management & Live Show Router
 * 
 * Comprehensive creator economy and live shopping features:
 * - Creator onboarding and profile management
 * - Profit-based incentive tiers and calculations
 * - Payout processing with fraud holds
 * - 24/7 broadcast scheduling grid
 * - Auto-fill scheduling algorithm
 * - Live show session management
 * - Product pinning during live
 * - Price drop execution
 * - Segment tracking and highlights
 * - Performance analytics
 */

// ============================================================================
// CREATOR MANAGEMENT
// ============================================================================

export const lsnCreatorsRouter = router({
  creators: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        status: z.string().optional(),
        tier: z.string().optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        const db = getDb();
        
        let query = db
          .select()
          .from(creators)
          .where(eq(creators.channelId, input.channelId));
        
        if (input.status) {
          query = query.where(eq(creators.status, input.status));
        }
        if (input.tier) {
          query = query.where(eq(creators.tier, input.tier));
        }
        
        const items = await query
          .orderBy(desc(creators.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        
        return items;
      }),
    
    get: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        creatorId: z.string(),
      }))
      .query(async ({ input }) => {
        const db = getDb();
        
        const [creator] = await db
          .select()
          .from(creators)
          .where(and(
            eq(creators.id, input.creatorId),
            eq(creators.channelId, input.channelId)
          ));
        
        if (!creator) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Creator not found" });
        }
        
        // Get bank accounts
        const bankAccounts = await db
          .select()
          .from(creatorBankAccounts)
          .where(eq(creatorBankAccounts.creatorId, input.creatorId));
        
        // Get recent payouts
        const recentPayouts = await db
          .select()
          .from(creatorPayoutLines)
          .where(eq(creatorPayoutLines.creatorId, input.creatorId))
          .orderBy(desc(creatorPayoutLines.createdAt))
          .limit(10);
        
        // Get performance stats
        const [stats] = await db
          .select({
            totalOrders: sql<number>`count(distinct ${orders.id})`,
            totalRevenue: sql<number>`sum(${orders.totalCents})`,
            totalCommission: sql<number>`sum(${creatorPayoutLines.amountCents})`,
          })
          .from(attributionClicks)
          .leftJoin(orders, eq(attributionClicks.orderId, orders.id))
          .leftJoin(creatorPayoutLines, eq(creatorPayoutLines.orderId, orders.id))
          .where(eq(attributionClicks.creatorId, input.creatorId));
        
        return {
          creator,
          bankAccounts,
          recentPayouts,
          stats,
        };
      }),
    
    create: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        tier: z.string(),
        commissionRate: z.number().min(0).max(100),
        status: z.enum(["active", "inactive", "suspended"]).default("active"),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        
        const creatorId = randomBytes(16).toString("hex");
        
        await db.insert(creators).values({
          id: creatorId,
          channelId: input.channelId,
          name: input.name,
          email: input.email,
          phone: input.phone || null,
          tier: input.tier,
          commissionRate: input.commissionRate,
          status: input.status,
        });
        
        return { id: creatorId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        creatorId: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        tier: z.string().optional(),
        commissionRate: z.number().min(0).max(100).optional(),
        status: z.enum(["active", "inactive", "suspended"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        
        const updates: any = {};
        if (input.name) updates.name = input.name;
        if (input.email) updates.email = input.email;
        if (input.phone !== undefined) updates.phone = input.phone;
        if (input.tier) updates.tier = input.tier;
        if (input.commissionRate !== undefined) updates.commissionRate = input.commissionRate;
        if (input.status) updates.status = input.status;
        
        await db.update(creators)
          .set(updates)
          .where(and(
            eq(creators.id, input.creatorId),
            eq(creators.channelId, input.channelId)
          ));
        
        return { success: true };
      }),
    
    performance: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        creatorId: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = getDb();
        
        let query = db
          .select({
            date: sql<string>`DATE(${orders.createdAt})`,
            orders: sql<number>`count(distinct ${orders.id})`,
            revenue: sql<number>`sum(${orders.totalCents})`,
            commission: sql<number>`sum(${creatorPayoutLines.amountCents})`,
          })
          .from(attributionClicks)
          .leftJoin(orders, eq(attributionClicks.orderId, orders.id))
          .leftJoin(creatorPayoutLines, eq(creatorPayoutLines.orderId, orders.id))
          .where(eq(attributionClicks.creatorId, input.creatorId))
          .groupBy(sql`DATE(${orders.createdAt})`);
        
        if (input.startDate) {
          query = query.where(gte(orders.createdAt, new Date(input.startDate)));
        }
        if (input.endDate) {
          query = query.where(lte(orders.createdAt, new Date(input.endDate)));
        }
        
        const daily = await query.orderBy(sql`DATE(${orders.createdAt})`);
        
        return { daily };
      }),
  }),
  
  // --------------------------------------------------------------------------
  // CREATOR TIERS & INCENTIVES
  // --------------------------------------------------------------------------
  
  tiers: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
      }))
      .query(async ({ input }) => {
        const db = getDb();
        
        const items = await db
          .select()
          .from(creatorTiers)
          .where(eq(creatorTiers.channelId, input.channelId))
          .orderBy(creatorTiers.minMonthlyRevenue);
        
        return items;
      }),
    
    create: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        name: z.string(),
        minMonthlyRevenue: z.number().min(0),
        baseCommissionRate: z.number().min(0).max(100),
        bonusRate: z.number().min(0).max(100).optional(),
        perks: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        
        const tierId = randomBytes(16).toString("hex");
        
        await db.insert(creatorTiers).values({
          id: tierId,
          channelId: input.channelId,
          name: input.name,
          minMonthlyRevenue: input.minMonthlyRevenue,
          baseCommissionRate: input.baseCommissionRate,
          bonusRate: input.bonusRate || 0,
          perks: input.perks || [],
        });
        
        return { id: tierId };
      }),
  }),
  
  // --------------------------------------------------------------------------
  // PAYOUTS
  // --------------------------------------------------------------------------
  
  payouts: router({
    batches: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          status: z.string().optional(),
          limit: z.number().min(1).max(100).default(20),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          let query = db
            .select()
            .from(creatorPayoutBatches)
            .where(eq(creatorPayoutBatches.channelId, input.channelId));
          
          if (input.status) {
            query = query.where(eq(creatorPayoutBatches.status, input.status));
          }
          
          const items = await query
            .orderBy(desc(creatorPayoutBatches.createdAt))
            .limit(input.limit);
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          periodStart: z.string(),
          periodEnd: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          
          const batchId = randomBytes(16).toString("hex");
          
          // Get all creators with pending payouts
          const pendingPayouts = await db
            .select({
              creatorId: creators.id,
              creatorName: creators.name,
              totalAmount: sql<number>`sum(${orderItems.priceCents} * ${orderItems.quantity} * ${creators.commissionRate} / 100)`,
            })
            .from(orders)
            .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
            .innerJoin(attributionClicks, eq(orders.id, attributionClicks.orderId))
            .innerJoin(creators, eq(attributionClicks.creatorId, creators.id))
            .where(and(
              eq(orders.channelId, input.channelId),
              between(orders.createdAt, new Date(input.periodStart), new Date(input.periodEnd)),
              eq(orders.status, "completed")
            ))
            .groupBy(creators.id, creators.name);
          
          // Check for holds
          const holds = await db
            .select()
            .from(payoutHolds)
            .where(and(
              eq(payoutHolds.channelId, input.channelId),
              eq(payoutHolds.status, "ACTIVE")
            ));
          
          const holdsByCreator = new Map(holds.map(h => [h.creatorId, h]));
          
          let totalAmount = 0;
          const lines = [];
          
          for (const payout of pendingPayouts) {
            const hold = holdsByCreator.get(payout.creatorId);
            const status = hold ? "HELD" : "PENDING";
            
            const lineId = randomBytes(16).toString("hex");
            lines.push({
              id: lineId,
              batchId,
              creatorId: payout.creatorId,
              amountCents: payout.totalAmount,
              status,
              holdReason: hold?.reason || null,
            });
            
            if (!hold) {
              totalAmount += payout.totalAmount;
            }
          }
          
          await db.insert(creatorPayoutBatches).values({
            id: batchId,
            channelId: input.channelId,
            periodStart: new Date(input.periodStart),
            periodEnd: new Date(input.periodEnd),
            totalAmountCents: totalAmount,
            status: "PENDING",
          });
          
          if (lines.length > 0) {
            await db.insert(creatorPayoutLines).values(lines);
          }
          
          return { id: batchId, linesCreated: lines.length };
        }),
      
      approve: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          batchId: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          
          await db.update(creatorPayoutBatches)
            .set({ status: "APPROVED" })
            .where(and(
              eq(creatorPayoutBatches.id, input.batchId),
              eq(creatorPayoutBatches.channelId, input.channelId)
            ));
          
          return { success: true };
        }),
      
      execute: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          batchId: z.string(),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          const [batch] = await db
            .select()
            .from(creatorPayoutBatches)
            .where(and(
              eq(creatorPayoutBatches.id, input.batchId),
              eq(creatorPayoutBatches.channelId, input.channelId)
            ));
          
          if (!batch || batch.status !== "APPROVED") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Batch not approved" });
          }
          
          const lines = await db
            .select()
            .from(creatorPayoutLines)
            .where(and(
              eq(creatorPayoutLines.batchId, input.batchId),
              eq(creatorPayoutLines.status, "PENDING")
            ));
          
          // TODO: Execute actual payouts via Wise API
          
          for (const line of lines) {
            await db.update(creatorPayoutLines)
              .set({ status: "COMPLETED", paidAt: new Date() })
              .where(eq(creatorPayoutLines.id, line.id));
          }
          
          await db.update(creatorPayoutBatches)
            .set({ status: "COMPLETED" })
            .where(eq(creatorPayoutBatches.id, input.batchId));
          
          return { success: true, linesPaid: lines.length };
        }),
    }),
    
    holds: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          creatorId: z.string().optional(),
          status: z.enum(["ACTIVE", "RELEASED", "FORFEITED"]).optional(),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          let query = db
            .select()
            .from(payoutHolds)
            .where(eq(payoutHolds.channelId, input.channelId));
          
          if (input.creatorId) {
            query = query.where(eq(payoutHolds.creatorId, input.creatorId));
          }
          if (input.status) {
            query = query.where(eq(payoutHolds.status, input.status));
          }
          
          const items = await query.orderBy(desc(payoutHolds.createdAt));
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          creatorId: z.string(),
          orderId: z.string().optional(),
          reason: z.string(),
          holdType: z.enum(["FRAUD", "DISPUTE", "MANUAL", "POLICY"]),
          amountCents: z.number(),
          currency: z.string().default("AUD"),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          const holdId = randomBytes(16).toString("hex");
          
          await db.insert(payoutHolds).values({
            id: holdId,
            channelId: input.channelId,
            creatorId: input.creatorId,
            orderId: input.orderId || null,
            reason: input.reason,
            holdType: input.holdType,
            amountCents: input.amountCents,
            currency: input.currency,
            status: "ACTIVE",
          });
          
          return { id: holdId };
        }),
      
      release: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          holdId: z.string(),
          releaseReason: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          
          await db.update(payoutHolds)
            .set({
              status: "RELEASED",
              releasedAt: new Date(),
              releasedBy: ctx.user?.id || null,
              releaseReason: input.releaseReason,
            })
            .where(and(
              eq(payoutHolds.id, input.holdId),
              eq(payoutHolds.channelId, input.channelId)
            ));
          
          return { success: true };
        }),
    }),
  }),
  
  // --------------------------------------------------------------------------
  // BROADCAST SCHEDULING
  // --------------------------------------------------------------------------
  
  scheduling: router({
    channels: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          status: z.enum(["active", "disabled"]).optional(),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          let query = db
            .select()
            .from(broadcastChannels)
            .where(eq(broadcastChannels.channelId, input.channelId));
          
          if (input.status) {
            query = query.where(eq(broadcastChannels.status, input.status));
          }
          
          const items = await query.orderBy(broadcastChannels.name);
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          name: z.string(),
          slug: z.string(),
          description: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          const bcId = randomBytes(16).toString("hex");
          
          await db.insert(broadcastChannels).values({
            id: bcId,
            channelId: input.channelId,
            name: input.name,
            slug: input.slug,
            description: input.description || null,
            streamKey: randomBytes(32).toString("hex"),
            status: "active",
          });
          
          return { id: bcId };
        }),
    }),
    
    slots: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          broadcastChannelId: z.string().optional(),
          creatorId: z.string().optional(),
          startDate: z.string(),
          endDate: z.string(),
          status: z.enum(["SCHEDULED", "LIVE", "COMPLETED", "CANCELED", "NO_SHOW"]).optional(),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          let query = db
            .select()
            .from(scheduleSlots)
            .where(and(
              eq(scheduleSlots.channelId, input.channelId),
              gte(scheduleSlots.startTime, new Date(input.startDate)),
              lte(scheduleSlots.endTime, new Date(input.endDate))
            ));
          
          if (input.broadcastChannelId) {
            query = query.where(eq(scheduleSlots.broadcastChannelId, input.broadcastChannelId));
          }
          if (input.creatorId) {
            query = query.where(eq(scheduleSlots.creatorId, input.creatorId));
          }
          if (input.status) {
            query = query.where(eq(scheduleSlots.status, input.status));
          }
          
          const items = await query.orderBy(scheduleSlots.startTime);
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          broadcastChannelId: z.string(),
          creatorId: z.string().optional(),
          startTime: z.string(),
          endTime: z.string(),
          isPrimeTime: z.boolean().default(false),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          // Check for conflicts
          const conflicts = await db
            .select()
            .from(scheduleSlots)
            .where(and(
              eq(scheduleSlots.channelId, input.channelId),
              eq(scheduleSlots.broadcastChannelId, input.broadcastChannelId),
              sql`${scheduleSlots.startTime} < ${input.endTime}`,
              sql`${scheduleSlots.endTime} > ${input.startTime}`,
              inArray(scheduleSlots.status, ["SCHEDULED", "LIVE"])
            ));
          
          if (conflicts.length > 0) {
            throw new TRPCError({ code: "CONFLICT", message: "Time slot conflicts with existing schedule" });
          }
          
          const slotId = randomBytes(16).toString("hex");
          
          await db.insert(scheduleSlots).values({
            id: slotId,
            channelId: input.channelId,
            broadcastChannelId: input.broadcastChannelId,
            creatorId: input.creatorId || null,
            startTime: new Date(input.startTime),
            endTime: new Date(input.endTime),
            status: "SCHEDULED",
            isPrimeTime: input.isPrimeTime,
            autoFilled: false,
            notes: input.notes || null,
          });
          
          return { id: slotId };
        }),
      
      update: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          slotId: z.string(),
          creatorId: z.string().optional(),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          status: z.enum(["SCHEDULED", "LIVE", "COMPLETED", "CANCELED", "NO_SHOW"]).optional(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          const updates: any = {};
          if (input.creatorId !== undefined) updates.creatorId = input.creatorId;
          if (input.startTime) updates.startTime = new Date(input.startTime);
          if (input.endTime) updates.endTime = new Date(input.endTime);
          if (input.status) updates.status = input.status;
          if (input.notes !== undefined) updates.notes = input.notes;
          
          await db.update(scheduleSlots)
            .set(updates)
            .where(and(
              eq(scheduleSlots.id, input.slotId),
              eq(scheduleSlots.channelId, input.channelId)
            ));
          
          return { success: true };
        }),
      
      autoFill: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          broadcastChannelId: z.string(),
          startDate: z.string(),
          endDate: z.string(),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          // Get all creators with availability
          const availableCreators = await db
            .select()
            .from(creators)
            .where(and(
              eq(creators.channelId, input.channelId),
              eq(creators.status, "active")
            ));
          
          // Get existing slots
          const existingSlots = await db
            .select()
            .from(scheduleSlots)
            .where(and(
              eq(scheduleSlots.channelId, input.channelId),
              eq(scheduleSlots.broadcastChannelId, input.broadcastChannelId),
              gte(scheduleSlots.startTime, new Date(input.startDate)),
              lte(scheduleSlots.endTime, new Date(input.endDate))
            ));
          
          // Simple auto-fill: assign creators round-robin to empty slots
          const slotsToFill = existingSlots.filter(s => !s.creatorId);
          let creatorIndex = 0;
          
          for (const slot of slotsToFill) {
            const creator = availableCreators[creatorIndex % availableCreators.length];
            
            await db.update(scheduleSlots)
              .set({
                creatorId: creator.id,
                autoFilled: true,
              })
              .where(eq(scheduleSlots.id, slot.id));
            
            creatorIndex++;
          }
          
          return { filled: slotsToFill.length };
        }),
    }),
    
    availability: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          creatorId: z.string(),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          const items = await db
            .select()
            .from(creatorAvailability)
            .where(and(
              eq(creatorAvailability.channelId, input.channelId),
              eq(creatorAvailability.creatorId, input.creatorId)
            ))
            .orderBy(creatorAvailability.dayOfWeek, creatorAvailability.startTime);
          
          return items;
        }),
      
      set: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          creatorId: z.string(),
          dayOfWeek: z.number().min(0).max(6),
          startTime: z.string().regex(/^\d{2}:\d{2}$/),
          endTime: z.string().regex(/^\d{2}:\d{2}$/),
          isAvailable: z.boolean().default(true),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          const availId = randomBytes(16).toString("hex");
          
          await db.insert(creatorAvailability).values({
            id: availId,
            channelId: input.channelId,
            creatorId: input.creatorId,
            dayOfWeek: input.dayOfWeek,
            startTime: input.startTime,
            endTime: input.endTime,
            isRecurring: true,
            isAvailable: input.isAvailable,
          });
          
          return { id: availId };
        }),
    }),
  }),
  
  // --------------------------------------------------------------------------
  // LIVE SHOW RUNNER
  // --------------------------------------------------------------------------
  
  liveShows: router({
    sessions: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          creatorId: z.string().optional(),
          status: z.string().optional(),
          limit: z.number().min(1).max(100).default(20),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          let query = db
            .select()
            .from(liveSessions)
            .where(eq(liveSessions.channelId, input.channelId));
          
          if (input.creatorId) {
            query = query.where(eq(liveSessions.creatorId, input.creatorId));
          }
          if (input.status) {
            query = query.where(eq(liveSessions.status, input.status));
          }
          
          const items = await query
            .orderBy(desc(liveSessions.startedAt))
            .limit(input.limit);
          
          return items;
        }),
      
      start: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          creatorId: z.string(),
          scheduleSlotId: z.string().optional(),
          title: z.string(),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          const sessionId = randomBytes(16).toString("hex");
          
          await db.insert(liveSessions).values({
            id: sessionId,
            channelId: input.channelId,
            creatorId: input.creatorId,
            title: input.title,
            status: "live",
            startedAt: new Date(),
          });
          
          if (input.scheduleSlotId) {
            await db.update(scheduleSlots)
              .set({ status: "LIVE" })
              .where(eq(scheduleSlots.id, input.scheduleSlotId));
          }
          
          return { id: sessionId };
        }),
      
      end: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          sessionId: z.string(),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          await db.update(liveSessions)
            .set({
              status: "ended",
              endedAt: new Date(),
            })
            .where(and(
              eq(liveSessions.id, input.sessionId),
              eq(liveSessions.channelId, input.channelId)
            ));
          
          return { success: true };
        }),
    }),
    
    segments: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          liveSessionId: z.string(),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          const items = await db
            .select()
            .from(liveShowSegments)
            .where(and(
              eq(liveShowSegments.channelId, input.channelId),
              eq(liveShowSegments.liveSessionId, input.liveSessionId)
            ))
            .orderBy(liveShowSegments.startOffsetSeconds);
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          liveSessionId: z.string(),
          segmentType: z.string(),
          title: z.string(),
          description: z.string().optional(),
          startOffsetSeconds: z.number(),
          durationSeconds: z.number().optional(),
          productIds: z.array(z.string()).optional(),
          scriptNotes: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          const segmentId = randomBytes(16).toString("hex");
          
          await db.insert(liveShowSegments).values({
            id: segmentId,
            channelId: input.channelId,
            liveSessionId: input.liveSessionId,
            segmentType: input.segmentType,
            title: input.title,
            description: input.description || null,
            startOffsetSeconds: input.startOffsetSeconds,
            durationSeconds: input.durationSeconds || null,
            productIds: input.productIds || [],
            scriptNotes: input.scriptNotes || null,
          });
          
          return { id: segmentId };
        }),
    }),
    
    priceDrops: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          liveSessionId: z.string(),
          status: z.enum(["SCHEDULED", "ACTIVE", "ENDED", "CANCELED"]).optional(),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          let query = db
            .select()
            .from(livePriceDrops)
            .where(and(
              eq(livePriceDrops.channelId, input.channelId),
              eq(livePriceDrops.liveSessionId, input.liveSessionId)
            ));
          
          if (input.status) {
            query = query.where(eq(livePriceDrops.status, input.status));
          }
          
          const items = await query.orderBy(livePriceDrops.startedAt);
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          liveSessionId: z.string(),
          variantId: z.string(),
          originalPriceCents: z.number(),
          dropPriceCents: z.number(),
          startedAt: z.string(),
          endsAt: z.string(),
          quantityLimit: z.number().optional(),
          urgencyMessage: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          const dropId = randomBytes(16).toString("hex");
          const discountPercent = ((input.originalPriceCents - input.dropPriceCents) / input.originalPriceCents) * 100;
          
          await db.insert(livePriceDrops).values({
            id: dropId,
            channelId: input.channelId,
            liveSessionId: input.liveSessionId,
            variantId: input.variantId,
            originalPriceCents: input.originalPriceCents,
            dropPriceCents: input.dropPriceCents,
            discountPercent,
            startedAt: new Date(input.startedAt),
            endsAt: new Date(input.endsAt),
            quantityLimit: input.quantityLimit || null,
            urgencyMessage: input.urgencyMessage || null,
            status: "SCHEDULED",
          });
          
          return { id: dropId };
        }),
      
      activate: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          dropId: z.string(),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          await db.update(livePriceDrops)
            .set({ status: "ACTIVE" })
            .where(and(
              eq(livePriceDrops.id, input.dropId),
              eq(livePriceDrops.channelId, input.channelId)
            ));
          
          return { success: true };
        }),
    }),
    
    highlights: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          liveSessionId: z.string(),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          const items = await db
            .select()
            .from(liveHighlights)
            .where(and(
              eq(liveHighlights.channelId, input.channelId),
              eq(liveHighlights.liveSessionId, input.liveSessionId)
            ))
            .orderBy(liveHighlights.timestampSeconds);
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          liveSessionId: z.string(),
          timestampSeconds: z.number(),
          type: z.string(),
          title: z.string(),
          description: z.string().optional(),
          productIds: z.array(z.string()).optional(),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          const highlightId = randomBytes(16).toString("hex");
          
          await db.insert(liveHighlights).values({
            id: highlightId,
            channelId: input.channelId,
            liveSessionId: input.liveSessionId,
            timestampSeconds: input.timestampSeconds,
            type: input.type,
            title: input.title,
            description: input.description || null,
            productIds: input.productIds || [],
            clipStatus: "PENDING",
          });
          
          return { id: highlightId };
        }),
    }),
    
    pinnedProducts: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          liveSessionId: z.string(),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          const items = await db
            .select()
            .from(pinnedProducts)
            .where(and(
              eq(pinnedProducts.channelId, input.channelId),
              eq(pinnedProducts.liveSessionId, input.liveSessionId)
            ))
            .orderBy(desc(pinnedProducts.pinnedAt));
          
          return items;
        }),
      
      pin: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          liveSessionId: z.string(),
          productId: z.string(),
          displayOrder: z.number().default(0),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          const pinId = randomBytes(16).toString("hex");
          
          await db.insert(pinnedProducts).values({
            id: pinId,
            channelId: input.channelId,
            liveSessionId: input.liveSessionId,
            productId: input.productId,
            displayOrder: input.displayOrder,
            pinnedAt: new Date(),
          });
          
          return { id: pinId };
        }),
      
      unpin: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          pinId: z.string(),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          await db.update(pinnedProducts)
            .set({ unpinnedAt: new Date() })
            .where(and(
              eq(pinnedProducts.id, input.pinId),
              eq(pinnedProducts.channelId, input.channelId)
            ));
          
          return { success: true };
        }),
    }),
  }),
});
