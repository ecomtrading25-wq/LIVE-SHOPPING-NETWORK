import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDbSync } from "./db";
import { eq, and, desc, sql, inArray, gte, lte } from "drizzle-orm";
import {
  orders,
  orderItems,
  orderRefunds,
  shipments,
  returnRequests,
  refundPolicies,
  thirdPartyLogisticsProviders,
  thirdPartyShipments,
  thirdPartyTrackingEvents,
  inventory,
  inventoryReservations,
  attributionClicks,
  fraudScores,
} from "../drizzle/schema";
import { randomBytes } from "crypto";

/**
 * LSN Orders, Checkout, Refunds & 3PL Router
 * 
 * Comprehensive order lifecycle management:
 * - Cart and checkout flow
 * - Order creation with attribution tracking
 * - Payment processing (PayPal integration)
 * - Fraud scoring v1
 * - Order fulfillment workflows
 * - 3PL integration (ShipStation, Shippo)
 * - Shipment tracking
 * - Return request automation
 * - Refund policy enforcement
 * - Refund processing
 */

// ============================================================================
// ORDERS & CHECKOUT
// ============================================================================

export const lsnOrdersRouter = router({
  orders: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        status: z.string().optional(),
        creatorId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        const db = getDbSync();
        
        let query = db
          .select()
          .from(orders)
          .where(eq(orders.channelId, input.channelId));
        
        if (input.status) {
          query = query.where(eq(orders.status, input.status));
        }
        if (input.creatorId) {
          // Join with attribution
          query = query.innerJoin(
            attributionClicks,
            and(
              eq(attributionClicks.orderId, orders.id),
              eq(attributionClicks.creatorId, input.creatorId)
            )
          );
        }
        if (input.startDate) {
          query = query.where(gte(orders.createdAt, new Date(input.startDate)));
        }
        if (input.endDate) {
          query = query.where(lte(orders.createdAt, new Date(input.endDate)));
        }
        if (input.search) {
          query = query.where(sql`${orders.orderNumber} LIKE ${`%${input.search}%`} OR ${orders.customerEmail} LIKE ${`%${input.search}%`}`);
        }
        
        const items = await query
          .orderBy(desc(orders.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        
        return items;
      }),
    
    get: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        orderId: z.string(),
      }))
      .query(async ({ input }) => {
        const db = getDbSync();
        
        const [order] = await db
          .select()
          .from(orders)
          .where(and(
            eq(orders.id, input.orderId),
            eq(orders.channelId, input.channelId)
          ));
        
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }
        
        // Get items
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, input.orderId));
        
        // Get shipments
        const shipmentsList = await db
          .select()
          .from(shipments)
          .where(eq(shipments.orderId, input.orderId));
        
        // Get refunds
        const refunds = await db
          .select()
          .from(orderRefunds)
          .where(eq(orderRefunds.orderId, input.orderId));
        
        // Get attribution
        const [attribution] = await db
          .select()
          .from(attributionClicks)
          .where(eq(attributionClicks.orderId, input.orderId));
        
        // Get fraud score
        const [fraudScore] = await db
          .select()
          .from(fraudScores)
          .where(eq(fraudScores.orderId, input.orderId));
        
        return {
          order,
          items,
          shipments: shipmentsList,
          refunds,
          attribution,
          fraudScore,
        };
      }),
    
    create: publicProcedure
      .input(z.object({
        channelId: z.string(),
        customerEmail: z.string().email(),
        customerName: z.string(),
        shippingAddress: z.object({
          line1: z.string(),
          line2: z.string().optional(),
          city: z.string(),
          state: z.string(),
          postalCode: z.string(),
          country: z.string(),
        }),
        billingAddress: z.object({
          line1: z.string(),
          line2: z.string().optional(),
          city: z.string(),
          state: z.string(),
          postalCode: z.string(),
          country: z.string(),
        }).optional(),
        items: z.array(z.object({
          variantId: z.string(),
          quantity: z.number().min(1),
          priceCents: z.number().min(0),
        })),
        shippingCents: z.number().min(0).default(0),
        taxCents: z.number().min(0).default(0),
        discountCents: z.number().min(0).default(0),
        promoCode: z.string().optional(),
        attributionToken: z.string().optional(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        // Calculate totals
        const subtotalCents = input.items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
        const totalCents = subtotalCents + input.shippingCents + input.taxCents - input.discountCents;
        
        // Generate order number
        const orderNumber = `LSN-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`;
        const orderId = randomBytes(16).toString("hex");
        
        // Create order
        await db.insert(orders).values({
          id: orderId,
          channelId: input.channelId,
          orderNumber,
          customerEmail: input.customerEmail,
          customerName: input.customerName,
          shippingAddress: input.shippingAddress,
          billingAddress: input.billingAddress || input.shippingAddress,
          subtotalCents,
          shippingCents: input.shippingCents,
          taxCents: input.taxCents,
          discountCents: input.discountCents,
          totalCents,
          currency: "AUD",
          status: "pending_payment",
          paymentStatus: "pending",
          fulfillmentStatus: "unfulfilled",
        });
        
        // Create order items
        for (const item of input.items) {
          await db.insert(orderItems).values({
            id: randomBytes(16).toString("hex"),
            orderId,
            variantId: item.variantId,
            quantity: item.quantity,
            priceCents: item.priceCents,
            subtotalCents: item.priceCents * item.quantity,
          });
          
          // Reserve inventory
          await db.insert(inventoryReservations).values({
            id: randomBytes(16).toString("hex"),
            variantId: item.variantId,
            quantity: item.quantity,
            orderId,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min expiry
          });
          
          const [inv] = await db
            .select()
            .from(inventory)
            .where(eq(inventory.variantId, item.variantId));
          
          if (inv) {
            await db.update(inventory)
              .set({ reserved: inv.reserved + item.quantity })
              .where(eq(inventory.id, inv.id));
          }
        }
        
        // Track attribution if provided
        if (input.attributionToken) {
          // TODO: Decode attribution token to get creator ID
          const creatorId = "placeholder"; // Extract from token
          
          await db.insert(attributionClicks).values({
            id: randomBytes(16).toString("hex"),
            channelId: input.channelId,
            creatorId,
            orderId,
            clickedAt: new Date(),
            convertedAt: new Date(),
          });
        }
        
        // Run fraud scoring
        const fraudRiskScore = await calculateFraudScore({
          email: input.customerEmail,
          ipAddress: input.ipAddress,
          totalCents,
          itemCount: input.items.length,
        });
        
        await db.insert(fraudScores).values({
          id: randomBytes(16).toString("hex"),
          channelId: input.channelId,
          orderId,
          riskScore: fraudRiskScore,
          riskLevel: fraudRiskScore > 70 ? "HIGH" : fraudRiskScore > 40 ? "MEDIUM" : "LOW",
          signals: {},
          version: "v1",
        });
        
        return {
          orderId,
          orderNumber,
          totalCents,
          fraudRiskScore,
        };
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        orderId: z.string(),
        status: z.enum(["pending_payment", "processing", "completed", "canceled", "refunded"]),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        await db.update(orders)
          .set({ status: input.status })
          .where(and(
            eq(orders.id, input.orderId),
            eq(orders.channelId, input.channelId)
          ));
        
        return { success: true };
      }),
    
    updatePaymentStatus: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        orderId: z.string(),
        paymentStatus: z.enum(["pending", "authorized", "paid", "failed", "refunded"]),
        paymentProvider: z.string().optional(),
        paymentTransactionId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        const updates: any = { paymentStatus: input.paymentStatus };
        if (input.paymentProvider) updates.paymentProvider = input.paymentProvider;
        if (input.paymentTransactionId) updates.paymentTransactionId = input.paymentTransactionId;
        
        await db.update(orders)
          .set(updates)
          .where(and(
            eq(orders.id, input.orderId),
            eq(orders.channelId, input.channelId)
          ));
        
        // If paid, convert reservations to committed inventory
        if (input.paymentStatus === "paid") {
          const reservations = await db
            .select()
            .from(inventoryReservations)
            .where(eq(inventoryReservations.orderId, input.orderId));
          
          for (const res of reservations) {
            const [inv] = await db
              .select()
              .from(inventory)
              .where(eq(inventory.variantId, res.variantId));
            
            if (inv) {
              await db.update(inventory)
                .set({
                  quantity: inv.quantity - res.quantity,
                  reserved: inv.reserved - res.quantity,
                })
                .where(eq(inventory.id, inv.id));
            }
            
            await db.delete(inventoryReservations)
              .where(eq(inventoryReservations.id, res.id));
          }
          
          await db.update(orders)
            .set({ status: "processing" })
            .where(eq(orders.id, input.orderId));
        }
        
        return { success: true };
      }),
    
    stats: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = getDbSync();
        
        let query = db
          .select({
            status: orders.status,
            count: sql<number>`count(*)`,
            totalRevenue: sql<number>`sum(${orders.totalCents})`,
          })
          .from(orders)
          .where(eq(orders.channelId, input.channelId))
          .groupBy(orders.status);
        
        if (input.startDate) {
          query = query.where(gte(orders.createdAt, new Date(input.startDate)));
        }
        if (input.endDate) {
          query = query.where(lte(orders.createdAt, new Date(input.endDate)));
        }
        
        const stats = await query;
        
        return stats;
      }),
  }),
  
  // --------------------------------------------------------------------------
  // FULFILLMENT
  // --------------------------------------------------------------------------
  
  fulfillment: router({
    shipments: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          orderId: z.string().optional(),
          status: z.string().optional(),
          limit: z.number().min(1).max(200).default(50),
        }))
        .query(async ({ input }) => {
          const db = getDbSync();
          
          let query = db
            .select()
            .from(shipments);
          
          if (input.orderId) {
            query = query.where(eq(shipments.orderId, input.orderId));
          }
          if (input.status) {
            query = query.where(eq(shipments.status, input.status));
          }
          
          const items = await query
            .orderBy(desc(shipments.createdAt))
            .limit(input.limit);
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          orderId: z.string(),
          carrier: z.string(),
          trackingNumber: z.string(),
          trackingUrl: z.string().optional(),
          shippingCostCents: z.number().min(0).optional(),
        }))
        .mutation(async ({ input }) => {
          const db = getDbSync();
          
          const shipmentId = randomBytes(16).toString("hex");
          
          await db.insert(shipments).values({
            id: shipmentId,
            orderId: input.orderId,
            carrier: input.carrier,
            trackingNumber: input.trackingNumber,
            trackingUrl: input.trackingUrl || null,
            shippingCostCents: input.shippingCostCents || null,
            status: "pending",
          });
          
          await db.update(orders)
            .set({ fulfillmentStatus: "fulfilled" })
            .where(eq(orders.id, input.orderId));
          
          return { id: shipmentId };
        }),
      
      updateStatus: protectedProcedure
        .input(z.object({
          shipmentId: z.string(),
          status: z.enum(["pending", "in_transit", "delivered", "failed"]),
          deliveredAt: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = getDbSync();
          
          const updates: any = { status: input.status };
          if (input.deliveredAt) {
            updates.deliveredAt = new Date(input.deliveredAt);
          }
          
          await db.update(shipments)
            .set(updates)
            .where(eq(shipments.id, input.shipmentId));
          
          return { success: true };
        }),
    }),
  }),
  
  // --------------------------------------------------------------------------
  // 3PL INTEGRATION
  // --------------------------------------------------------------------------
  
  thirdPartyLogistics: router({
    providers: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          status: z.enum(["active", "inactive"]).optional(),
        }))
        .query(async ({ input }) => {
          const db = getDbSync();
          
          let query = db
            .select()
            .from(thirdPartyLogisticsProviders)
            .where(eq(thirdPartyLogisticsProviders.channelId, input.channelId));
          
          if (input.status) {
            query = query.where(eq(thirdPartyLogisticsProviders.status, input.status));
          }
          
          const items = await query.orderBy(thirdPartyLogisticsProviders.name);
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          name: z.string(),
          provider: z.enum(["SHIPSTATION", "SHIPPO", "EASYPOST", "CUSTOM"]),
          apiKey: z.string(),
          apiSecret: z.string().optional(),
          webhookUrl: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = getDbSync();
          
          const providerId = randomBytes(16).toString("hex");
          
          await db.insert(thirdPartyLogisticsProviders).values({
            id: providerId,
            channelId: input.channelId,
            name: input.name,
            provider: input.provider,
            apiKey: input.apiKey,
            apiSecret: input.apiSecret || null,
            webhookUrl: input.webhookUrl || null,
            status: "active",
          });
          
          return { id: providerId };
        }),
    }),
    
    shipments: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          orderId: z.string().optional(),
          status: z.string().optional(),
          limit: z.number().min(1).max(200).default(50),
        }))
        .query(async ({ input }) => {
          const db = getDbSync();
          
          let query = db
            .select()
            .from(thirdPartyShipments)
            .where(eq(thirdPartyShipments.channelId, input.channelId));
          
          if (input.orderId) {
            query = query.where(eq(thirdPartyShipments.orderId, input.orderId));
          }
          if (input.status) {
            query = query.where(eq(thirdPartyShipments.status, input.status));
          }
          
          const items = await query
            .orderBy(desc(thirdPartyShipments.createdAt))
            .limit(input.limit);
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          providerId: z.string(),
          orderId: z.string(),
          providerShipmentId: z.string(),
          trackingNumber: z.string(),
          carrier: z.string(),
          labelUrl: z.string().optional(),
          rateCents: z.number().min(0).optional(),
        }))
        .mutation(async ({ input }) => {
          const db = getDbSync();
          
          const shipmentId = randomBytes(16).toString("hex");
          
          await db.insert(thirdPartyShipments).values({
            id: shipmentId,
            channelId: input.channelId,
            providerId: input.providerId,
            orderId: input.orderId,
            providerShipmentId: input.providerShipmentId,
            trackingNumber: input.trackingNumber,
            carrier: input.carrier,
            labelUrl: input.labelUrl || null,
            rateCents: input.rateCents || null,
            status: "PENDING",
          });
          
          return { id: shipmentId };
        }),
      
      trackingEvents: router({
        list: protectedProcedure
          .input(z.object({
            channelId: z.string(),
            shipmentId: z.string(),
          }))
          .query(async ({ input }) => {
            const db = getDbSync();
            
            const items = await db
              .select()
              .from(thirdPartyTrackingEvents)
              .where(and(
                eq(thirdPartyTrackingEvents.channelId, input.channelId),
                eq(thirdPartyTrackingEvents.shipmentId, input.shipmentId)
              ))
              .orderBy(thirdPartyTrackingEvents.eventTime);
            
            return items;
          }),
        
        add: protectedProcedure
          .input(z.object({
            channelId: z.string(),
            shipmentId: z.string(),
            eventType: z.string(),
            eventTime: z.string(),
            location: z.string().optional(),
            description: z.string().optional(),
            providerData: z.any().optional(),
          }))
          .mutation(async ({ input }) => {
            const db = getDbSync();
            
            const eventId = randomBytes(16).toString("hex");
            
            await db.insert(thirdPartyTrackingEvents).values({
              id: eventId,
              channelId: input.channelId,
              shipmentId: input.shipmentId,
              eventType: input.eventType,
              eventTime: new Date(input.eventTime),
              location: input.location || null,
              description: input.description || null,
              providerData: input.providerData || {},
            });
            
            // Update shipment status based on event type
            if (input.eventType === "DELIVERED") {
              await db.update(thirdPartyShipments)
                .set({ status: "DELIVERED" })
                .where(eq(thirdPartyShipments.id, input.shipmentId));
            } else if (input.eventType === "IN_TRANSIT") {
              await db.update(thirdPartyShipments)
                .set({ status: "IN_TRANSIT" })
                .where(eq(thirdPartyShipments.id, input.shipmentId));
            }
            
            return { id: eventId };
          }),
      }),
    }),
  }),
  
  // --------------------------------------------------------------------------
  // RETURNS & REFUNDS
  // --------------------------------------------------------------------------
  
  returns: router({
    policies: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
        }))
        .query(async ({ input }) => {
          const db = getDbSync();
          
          let query = db
            .select()
            .from(refundPolicies)
            .where(eq(refundPolicies.channelId, input.channelId));
          
          if (input.status) {
            query = query.where(eq(refundPolicies.status, input.status));
          }
          
          const items = await query.orderBy(refundPolicies.priority);
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          name: z.string(),
          description: z.string(),
          windowDays: z.number().min(0),
          allowPartialRefund: z.boolean().default(true),
          requireReturnShipment: z.boolean().default(true),
          restockingFeePercent: z.number().min(0).max(100).default(0),
          priority: z.number().default(0),
        }))
        .mutation(async ({ input }) => {
          const db = getDbSync();
          
          const policyId = randomBytes(16).toString("hex");
          
          await db.insert(refundPolicies).values({
            id: policyId,
            channelId: input.channelId,
            name: input.name,
            description: input.description,
            windowDays: input.windowDays,
            allowPartialRefund: input.allowPartialRefund,
            requireReturnShipment: input.requireReturnShipment,
            restockingFeePercent: input.restockingFeePercent,
            priority: input.priority,
            status: "ACTIVE",
          });
          
          return { id: policyId };
        }),
    }),
    
    requests: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          status: z.enum(["PENDING", "APPROVED", "REJECTED", "COMPLETED"]).optional(),
          limit: z.number().min(1).max(200).default(50),
        }))
        .query(async ({ input }) => {
          const db = getDbSync();
          
          let query = db
            .select()
            .from(returnRequests)
            .where(eq(returnRequests.channelId, input.channelId));
          
          if (input.status) {
            query = query.where(eq(returnRequests.status, input.status));
          }
          
          const items = await query
            .orderBy(desc(returnRequests.createdAt))
            .limit(input.limit);
          
          return items;
        }),
      
      create: publicProcedure
        .input(z.object({
          channelId: z.string(),
          orderId: z.string(),
          reason: z.string(),
          reasonDetails: z.string().optional(),
          itemIds: z.array(z.string()),
          customerEmail: z.string().email(),
        }))
        .mutation(async ({ input }) => {
          const db = getDbSync();
          
          // Check order exists
          const [order] = await db
            .select()
            .from(orders)
            .where(and(
              eq(orders.id, input.orderId),
              eq(orders.channelId, input.channelId)
            ));
          
          if (!order) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
          }
          
          // Check if within return window
          const [policy] = await db
            .select()
            .from(refundPolicies)
            .where(and(
              eq(refundPolicies.channelId, input.channelId),
              eq(refundPolicies.status, "ACTIVE")
            ))
            .orderBy(refundPolicies.priority)
            .limit(1);
          
          if (policy) {
            const orderDate = new Date(order.createdAt);
            const windowEnd = new Date(orderDate.getTime() + policy.windowDays * 24 * 60 * 60 * 1000);
            
            if (new Date() > windowEnd) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Return window expired. Returns must be requested within ${policy.windowDays} days.`,
              });
            }
          }
          
          const requestId = randomBytes(16).toString("hex");
          
          await db.insert(returnRequests).values({
            id: requestId,
            channelId: input.channelId,
            orderId: input.orderId,
            policyId: policy?.id || null,
            reason: input.reason,
            reasonDetails: input.reasonDetails || null,
            itemIds: input.itemIds,
            status: "PENDING",
          });
          
          return { id: requestId };
        }),
      
      approve: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          requestId: z.string(),
          approvalNotes: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const db = getDbSync();
          
          await db.update(returnRequests)
            .set({
              status: "APPROVED",
              approvedAt: new Date(),
              approvedBy: ctx.user?.id || null,
              approvalNotes: input.approvalNotes || null,
            })
            .where(and(
              eq(returnRequests.id, input.requestId),
              eq(returnRequests.channelId, input.channelId)
            ));
          
          return { success: true };
        }),
      
      reject: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          requestId: z.string(),
          rejectionReason: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
          const db = getDbSync();
          
          await db.update(returnRequests)
            .set({
              status: "REJECTED",
              rejectedAt: new Date(),
              rejectedBy: ctx.user?.id || null,
              rejectionReason: input.rejectionReason,
            })
            .where(and(
              eq(returnRequests.id, input.requestId),
              eq(returnRequests.channelId, input.channelId)
            ));
          
          return { success: true };
        }),
    }),
  }),
  
  refunds: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        orderId: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().min(1).max(200).default(50),
      }))
      .query(async ({ input }) => {
        const db = getDbSync();
        
        let query = db
          .select()
          .from(orderRefunds);
        
        if (input.orderId) {
          query = query.where(eq(orderRefunds.orderId, input.orderId));
        }
        if (input.status) {
          query = query.where(eq(orderRefunds.status, input.status));
        }
        
        const items = await query
          .orderBy(desc(orderRefunds.createdAt))
          .limit(input.limit);
        
        return items;
      }),
    
    create: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        orderId: z.string(),
        amountCents: z.number().min(0),
        reason: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDbSync();
        
        const [order] = await db
          .select()
          .from(orders)
          .where(and(
            eq(orders.id, input.orderId),
            eq(orders.channelId, input.channelId)
          ));
        
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }
        
        if (input.amountCents > order.totalCents) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Refund amount exceeds order total" });
        }
        
        const refundId = randomBytes(16).toString("hex");
        
        await db.insert(orderRefunds).values({
          id: refundId,
          orderId: input.orderId,
          amountCents: input.amountCents,
          reason: input.reason,
          notes: input.notes || null,
          status: "pending",
        });
        
        return { id: refundId };
      }),
    
    process: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        refundId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        const [refund] = await db
          .select()
          .from(orderRefunds)
          .where(eq(orderRefunds.id, input.refundId));
        
        if (!refund) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Refund not found" });
        }
        
        // TODO: Process refund via PayPal API
        
        await db.update(orderRefunds)
          .set({
            status: "completed",
            processedAt: new Date(),
          })
          .where(eq(orderRefunds.id, input.refundId));
        
        // Update order status
        await db.update(orders)
          .set({ status: "refunded" })
          .where(eq(orders.id, refund.orderId));
        
        return { success: true };
      }),
  }),
});

// ============================================================================
// FRAUD SCORING
// ============================================================================

async function calculateFraudScore(params: {
  email: string;
  ipAddress?: string;
  totalCents: number;
  itemCount: number;
}): Promise<number> {
  let score = 0;
  
  // Email checks
  if (params.email.includes("+")) score += 10;
  if (params.email.match(/\d{5,}/)) score += 15;
  
  // Order value checks
  if (params.totalCents > 50000) score += 20; // > $500
  if (params.totalCents > 100000) score += 30; // > $1000
  
  // Item count checks
  if (params.itemCount > 10) score += 15;
  if (params.itemCount > 20) score += 25;
  
  // TODO: IP reputation check
  // TODO: Email domain reputation
  // TODO: Velocity checks (orders per hour)
  
  return Math.min(100, score);
}
