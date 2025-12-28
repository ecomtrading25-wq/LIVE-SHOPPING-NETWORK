import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";
import { eq, and, desc, sql, inArray, gte, lte } from "drizzle-orm";
import {
  suppliers,
  supplierContacts,
  supplierContracts,
  supplierPerformance,
  supplierSamples,
  purchaseOrders,
  purchaseOrderItems,
  receivingWorkflows,
  executiveMetrics,
  topPerformers,
  creativeAssets,
  hooksLibrary,
  ugcBriefs,
  trendSpotting,
  launchChecklists,
  regionConfigs,
  regionalInventory,
} from "../drizzle/schema";
import { randomBytes } from "crypto";

/**
 * LSN Operations Router
 * 
 * Comprehensive operational systems:
 * - Supplier management and performance tracking
 * - Purchase order system
 * - Receiving workflows
 * - Executive dashboard with KPIs
 * - Top performer tracking
 * - Creative factory and asset management
 * - Hooks library for content
 * - UGC brief generation
 * - Trend spotting system
 * - Launch checklists
 * - Global expansion (regional configs)
 */

// ============================================================================
// SUPPLIER MANAGEMENT
// ============================================================================

export const lsnOperationsRouter = router({
  suppliers: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        status: z.enum(["active", "inactive", "suspended"]).optional(),
        limit: z.number().min(1).max(200).default(50),
      }))
      .query(async ({ input }) => {
        const db = getDb();
        
        let query = db
          .select()
          .from(suppliers)
          .where(eq(suppliers.channelId, input.channelId));
        
        if (input.status) {
          query = query.where(eq(suppliers.status, input.status));
        }
        
        const items = await query
          .orderBy(suppliers.name)
          .limit(input.limit);
        
        return items;
      }),
    
    get: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        supplierId: z.string(),
      }))
      .query(async ({ input }) => {
        const db = getDb();
        
        const [supplier] = await db
          .select()
          .from(suppliers)
          .where(and(
            eq(suppliers.id, input.supplierId),
            eq(suppliers.channelId, input.channelId)
          ));
        
        if (!supplier) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Supplier not found" });
        }
        
        // Get contacts
        const contacts = await db
          .select()
          .from(supplierContacts)
          .where(eq(supplierContacts.supplierId, input.supplierId));
        
        // Get contracts
        const contracts = await db
          .select()
          .from(supplierContracts)
          .where(eq(supplierContracts.supplierId, input.supplierId));
        
        // Get performance metrics
        const [performance] = await db
          .select()
          .from(supplierPerformance)
          .where(eq(supplierPerformance.supplierId, input.supplierId))
          .orderBy(desc(supplierPerformance.periodEnd))
          .limit(1);
        
        return {
          supplier,
          contacts,
          contracts,
          performance,
        };
      }),
    
    create: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        name: z.string(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        address: z.object({
          line1: z.string(),
          line2: z.string().optional(),
          city: z.string(),
          state: z.string(),
          postalCode: z.string(),
          country: z.string(),
        }).optional(),
        paymentTerms: z.string().optional(),
        shippingTerms: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        
        const supplierId = randomBytes(16).toString("hex");
        
        await db.insert(suppliers).values({
          id: supplierId,
          channelId: input.channelId,
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          website: input.website || null,
          address: input.address || null,
          paymentTerms: input.paymentTerms || null,
          shippingTerms: input.shippingTerms || null,
          status: "active",
        });
        
        return { id: supplierId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        supplierId: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        status: z.enum(["active", "inactive", "suspended"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        
        const updates: any = {};
        if (input.name) updates.name = input.name;
        if (input.email !== undefined) updates.email = input.email;
        if (input.phone !== undefined) updates.phone = input.phone;
        if (input.website !== undefined) updates.website = input.website;
        if (input.status) updates.status = input.status;
        
        await db.update(suppliers)
          .set(updates)
          .where(and(
            eq(suppliers.id, input.supplierId),
            eq(suppliers.channelId, input.channelId)
          ));
        
        return { success: true };
      }),
    
    contacts: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          supplierId: z.string(),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          const items = await db
            .select()
            .from(supplierContacts)
            .where(and(
              eq(supplierContacts.channelId, input.channelId),
              eq(supplierContacts.supplierId, input.supplierId)
            ));
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          supplierId: z.string(),
          name: z.string(),
          role: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          isPrimary: z.boolean().default(false),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          const contactId = randomBytes(16).toString("hex");
          
          await db.insert(supplierContacts).values({
            id: contactId,
            channelId: input.channelId,
            supplierId: input.supplierId,
            name: input.name,
            role: input.role || null,
            email: input.email || null,
            phone: input.phone || null,
            isPrimary: input.isPrimary,
          });
          
          return { id: contactId };
        }),
    }),
    
    contracts: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          supplierId: z.string(),
          status: z.enum(["DRAFT", "ACTIVE", "EXPIRED", "TERMINATED"]).optional(),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          let query = db
            .select()
            .from(supplierContracts)
            .where(and(
              eq(supplierContracts.channelId, input.channelId),
              eq(supplierContracts.supplierId, input.supplierId)
            ));
          
          if (input.status) {
            query = query.where(eq(supplierContracts.status, input.status));
          }
          
          const items = await query.orderBy(desc(supplierContracts.startDate));
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          supplierId: z.string(),
          contractNumber: z.string(),
          startDate: z.string(),
          endDate: z.string().optional(),
          terms: z.string(),
          minOrderCents: z.number().min(0).optional(),
          paymentTermsDays: z.number().min(0).optional(),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          const contractId = randomBytes(16).toString("hex");
          
          await db.insert(supplierContracts).values({
            id: contractId,
            channelId: input.channelId,
            supplierId: input.supplierId,
            contractNumber: input.contractNumber,
            startDate: new Date(input.startDate),
            endDate: input.endDate ? new Date(input.endDate) : null,
            terms: input.terms,
            minOrderCents: input.minOrderCents || null,
            paymentTermsDays: input.paymentTermsDays || null,
            status: "ACTIVE",
          });
          
          return { id: contractId };
        }),
    }),
    
    performance: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          supplierId: z.string(),
          limit: z.number().min(1).max(50).default(12),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          const items = await db
            .select()
            .from(supplierPerformance)
            .where(and(
              eq(supplierPerformance.channelId, input.channelId),
              eq(supplierPerformance.supplierId, input.supplierId)
            ))
            .orderBy(desc(supplierPerformance.periodEnd))
            .limit(input.limit);
          
          return items;
        }),
      
      calculate: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          supplierId: z.string(),
          periodStart: z.string(),
          periodEnd: z.string(),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          // Calculate metrics from purchase orders
          const [stats] = await db
            .select({
              totalOrders: sql<number>`count(*)`,
              totalSpent: sql<number>`sum(${purchaseOrders.totalCents})`,
              avgLeadTime: sql<number>`avg(DATEDIFF(${purchaseOrders.receivedAt}, ${purchaseOrders.createdAt}))`,
            })
            .from(purchaseOrders)
            .where(and(
              eq(purchaseOrders.channelId, input.channelId),
              eq(purchaseOrders.supplierId, input.supplierId),
              gte(purchaseOrders.createdAt, new Date(input.periodStart)),
              lte(purchaseOrders.createdAt, new Date(input.periodEnd))
            ));
          
          const performanceId = randomBytes(16).toString("hex");
          
          await db.insert(supplierPerformance).values({
            id: performanceId,
            channelId: input.channelId,
            supplierId: input.supplierId,
            periodStart: new Date(input.periodStart),
            periodEnd: new Date(input.periodEnd),
            totalOrders: stats?.totalOrders || 0,
            totalSpentCents: stats?.totalSpent || 0,
            avgLeadTimeDays: stats?.avgLeadTime || 0,
            onTimeDeliveryRate: 0, // TODO: Calculate from actual delivery dates
            qualityScore: 0, // TODO: Calculate from defect rates
          });
          
          return { id: performanceId };
        }),
    }),
    
    samples: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          supplierId: z.string(),
          status: z.enum(["REQUESTED", "SHIPPED", "RECEIVED", "APPROVED", "REJECTED"]).optional(),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          let query = db
            .select()
            .from(supplierSamples)
            .where(and(
              eq(supplierSamples.channelId, input.channelId),
              eq(supplierSamples.supplierId, input.supplierId)
            ));
          
          if (input.status) {
            query = query.where(eq(supplierSamples.status, input.status));
          }
          
          const items = await query.orderBy(desc(supplierSamples.requestedAt));
          
          return items;
        }),
      
      request: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          supplierId: z.string(),
          productName: z.string(),
          quantity: z.number().min(1),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          
          const sampleId = randomBytes(16).toString("hex");
          
          await db.insert(supplierSamples).values({
            id: sampleId,
            channelId: input.channelId,
            supplierId: input.supplierId,
            productName: input.productName,
            quantity: input.quantity,
            requestedBy: ctx.user?.id || null,
            requestedAt: new Date(),
            notes: input.notes || null,
            status: "REQUESTED",
          });
          
          return { id: sampleId };
        }),
      
      updateStatus: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          sampleId: z.string(),
          status: z.enum(["SHIPPED", "RECEIVED", "APPROVED", "REJECTED"]),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          
          const updates: any = { status: input.status };
          
          if (input.status === "APPROVED" || input.status === "REJECTED") {
            updates.reviewedBy = ctx.user?.id || null;
            updates.reviewedAt = new Date();
            updates.reviewNotes = input.notes || null;
          }
          
          await db.update(supplierSamples)
            .set(updates)
            .where(and(
              eq(supplierSamples.id, input.sampleId),
              eq(supplierSamples.channelId, input.channelId)
            ));
          
          return { success: true };
        }),
    }),
  }),
  
  // --------------------------------------------------------------------------
  // PURCHASE ORDERS
  // --------------------------------------------------------------------------
  
  purchaseOrders: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        supplierId: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().min(1).max(200).default(50),
      }))
      .query(async ({ input }) => {
        const db = getDb();
        
        let query = db
          .select()
          .from(purchaseOrders)
          .where(eq(purchaseOrders.channelId, input.channelId));
        
        if (input.supplierId) {
          query = query.where(eq(purchaseOrders.supplierId, input.supplierId));
        }
        if (input.status) {
          query = query.where(eq(purchaseOrders.status, input.status));
        }
        
        const items = await query
          .orderBy(desc(purchaseOrders.createdAt))
          .limit(input.limit);
        
        return items;
      }),
    
    get: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        poId: z.string(),
      }))
      .query(async ({ input }) => {
        const db = getDb();
        
        const [po] = await db
          .select()
          .from(purchaseOrders)
          .where(and(
            eq(purchaseOrders.id, input.poId),
            eq(purchaseOrders.channelId, input.channelId)
          ));
        
        if (!po) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Purchase order not found" });
        }
        
        const items = await db
          .select()
          .from(purchaseOrderItems)
          .where(eq(purchaseOrderItems.poId, input.poId));
        
        return { po, items };
      }),
    
    create: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        supplierId: z.string(),
        items: z.array(z.object({
          variantId: z.string(),
          quantity: z.number().min(1),
          unitCostCents: z.number().min(0),
        })),
        shippingCostCents: z.number().min(0).default(0),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDb();
        
        const totalCents = input.items.reduce((sum, item) => sum + (item.unitCostCents * item.quantity), 0) + input.shippingCostCents;
        
        const poNumber = `PO-${Date.now()}-${randomBytes(4).toString("hex").toUpperCase()}`;
        const poId = randomBytes(16).toString("hex");
        
        await db.insert(purchaseOrders).values({
          id: poId,
          channelId: input.channelId,
          supplierId: input.supplierId,
          poNumber,
          totalCents,
          status: "pending",
          notes: input.notes || null,
        });
        
        for (const item of input.items) {
          await db.insert(purchaseOrderItems).values({
            id: randomBytes(16).toString("hex"),
            poId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitCostCents: item.unitCostCents,
            subtotalCents: item.unitCostCents * item.quantity,
          });
        }
        
        return { id: poId, poNumber };
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        poId: z.string(),
        status: z.enum(["pending", "confirmed", "shipped", "received", "canceled"]),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        
        await db.update(purchaseOrders)
          .set({ status: input.status })
          .where(and(
            eq(purchaseOrders.id, input.poId),
            eq(purchaseOrders.channelId, input.channelId)
          ));
        
        return { success: true };
      }),
  }),
  
  // --------------------------------------------------------------------------
  // RECEIVING WORKFLOWS
  // --------------------------------------------------------------------------
  
  receiving: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "DISCREPANCY"]).optional(),
        limit: z.number().min(1).max(100).default(50),
      }))
      .query(async ({ input }) => {
        const db = getDb();
        
        let query = db
          .select()
          .from(receivingWorkflows)
          .where(eq(receivingWorkflows.channelId, input.channelId));
        
        if (input.status) {
          query = query.where(eq(receivingWorkflows.status, input.status));
        }
        
        const items = await query
          .orderBy(desc(receivingWorkflows.createdAt))
          .limit(input.limit);
        
        return items;
      }),
    
    create: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        poId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDb();
        
        const workflowId = randomBytes(16).toString("hex");
        
        await db.insert(receivingWorkflows).values({
          id: workflowId,
          channelId: input.channelId,
          poId: input.poId,
          status: "PENDING",
          startedBy: ctx.user?.id || null,
        });
        
        return { id: workflowId };
      }),
    
    complete: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        workflowId: z.string(),
        receivedItems: z.array(z.object({
          variantId: z.string(),
          quantityReceived: z.number().min(0),
          quantityDamaged: z.number().min(0).default(0),
        })),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDb();
        
        await db.update(receivingWorkflows)
          .set({
            status: "COMPLETED",
            completedBy: ctx.user?.id || null,
            completedAt: new Date(),
            receivedItems: input.receivedItems,
            notes: input.notes || null,
          })
          .where(and(
            eq(receivingWorkflows.id, input.workflowId),
            eq(receivingWorkflows.channelId, input.channelId)
          ));
        
        return { success: true };
      }),
  }),
  
  // --------------------------------------------------------------------------
  // EXECUTIVE DASHBOARD
  // --------------------------------------------------------------------------
  
  executive: router({
    metrics: router({
      current: protectedProcedure
        .input(z.object({
          channelId: z.string(),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          const [latest] = await db
            .select()
            .from(executiveMetrics)
            .where(eq(executiveMetrics.channelId, input.channelId))
            .orderBy(desc(executiveMetrics.periodEnd))
            .limit(1);
          
          return latest || null;
        }),
      
      history: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          limit: z.number().min(1).max(365).default(30),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          const items = await db
            .select()
            .from(executiveMetrics)
            .where(eq(executiveMetrics.channelId, input.channelId))
            .orderBy(desc(executiveMetrics.periodEnd))
            .limit(input.limit);
          
          return items;
        }),
      
      calculate: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          periodStart: z.string(),
          periodEnd: z.string(),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          // Calculate all KPIs
          const [orderStats] = await db
            .select({
              totalOrders: sql<number>`count(*)`,
              totalRevenue: sql<number>`sum(${sql`total_cents`})`,
              avgOrderValue: sql<number>`avg(${sql`total_cents`})`,
            })
            .from(sql`orders`)
            .where(and(
              sql`channel_id = ${input.channelId}`,
              sql`created_at >= ${input.periodStart}`,
              sql`created_at <= ${input.periodEnd}`
            ));
          
          const metricId = randomBytes(16).toString("hex");
          
          await db.insert(executiveMetrics).values({
            id: metricId,
            channelId: input.channelId,
            periodStart: new Date(input.periodStart),
            periodEnd: new Date(input.periodEnd),
            totalOrders: orderStats?.totalOrders || 0,
            totalRevenueCents: orderStats?.totalRevenue || 0,
            avgOrderValueCents: orderStats?.avgOrderValue || 0,
            conversionRate: 0, // TODO: Calculate from traffic data
            returnRate: 0, // TODO: Calculate from returns
            customerSatisfaction: 0, // TODO: Calculate from surveys
            creatorCount: 0, // TODO: Count active creators
            liveSessionCount: 0, // TODO: Count live sessions
          });
          
          return { id: metricId };
        }),
    }),
    
    topPerformers: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          category: z.enum(["CREATOR", "PRODUCT", "CATEGORY"]),
          periodStart: z.string(),
          periodEnd: z.string(),
          limit: z.number().min(1).max(100).default(10),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          const items = await db
            .select()
            .from(topPerformers)
            .where(and(
              eq(topPerformers.channelId, input.channelId),
              eq(topPerformers.category, input.category),
              gte(topPerformers.periodStart, new Date(input.periodStart)),
              lte(topPerformers.periodEnd, new Date(input.periodEnd))
            ))
            .orderBy(desc(topPerformers.revenueCents))
            .limit(input.limit);
          
          return items;
        }),
      
      calculate: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          category: z.enum(["CREATOR", "PRODUCT", "CATEGORY"]),
          periodStart: z.string(),
          periodEnd: z.string(),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          // TODO: Calculate top performers based on category
          // For now, just create placeholder records
          
          return { success: true };
        }),
    }),
  }),
  
  // --------------------------------------------------------------------------
  // CREATIVE FACTORY
  // --------------------------------------------------------------------------
  
  creative: router({
    assets: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          assetType: z.enum(["VIDEO", "IMAGE", "SCRIPT", "HOOK"]).optional(),
          status: z.enum(["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"]).optional(),
          limit: z.number().min(1).max(200).default(50),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          let query = db
            .select()
            .from(creativeAssets)
            .where(eq(creativeAssets.channelId, input.channelId));
          
          if (input.assetType) {
            query = query.where(eq(creativeAssets.assetType, input.assetType));
          }
          if (input.status) {
            query = query.where(eq(creativeAssets.status, input.status));
          }
          
          const items = await query
            .orderBy(desc(creativeAssets.createdAt))
            .limit(input.limit);
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          assetType: z.enum(["VIDEO", "IMAGE", "SCRIPT", "HOOK"]),
          title: z.string(),
          description: z.string().optional(),
          fileUrl: z.string().optional(),
          content: z.string().optional(),
          tags: z.array(z.string()).optional(),
          productIds: z.array(z.string()).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          
          const assetId = randomBytes(16).toString("hex");
          
          await db.insert(creativeAssets).values({
            id: assetId,
            channelId: input.channelId,
            assetType: input.assetType,
            title: input.title,
            description: input.description || null,
            fileUrl: input.fileUrl || null,
            content: input.content || null,
            tags: input.tags || [],
            productIds: input.productIds || [],
            createdBy: ctx.user?.id || null,
            status: "DRAFT",
          });
          
          return { id: assetId };
        }),
      
      updateStatus: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          assetId: z.string(),
          status: z.enum(["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"]),
        }))
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          
          const updates: any = { status: input.status };
          
          if (input.status === "APPROVED") {
            updates.approvedBy = ctx.user?.id || null;
            updates.approvedAt = new Date();
          } else if (input.status === "PUBLISHED") {
            updates.publishedAt = new Date();
          }
          
          await db.update(creativeAssets)
            .set(updates)
            .where(and(
              eq(creativeAssets.id, input.assetId),
              eq(creativeAssets.channelId, input.channelId)
            ));
          
          return { success: true };
        }),
    }),
    
    hooks: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          category: z.string().optional(),
          limit: z.number().min(1).max(200).default(50),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          let query = db
            .select()
            .from(hooksLibrary)
            .where(eq(hooksLibrary.channelId, input.channelId));
          
          if (input.category) {
            query = query.where(eq(hooksLibrary.category, input.category));
          }
          
          const items = await query
            .orderBy(desc(hooksLibrary.performanceScore))
            .limit(input.limit);
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          hookText: z.string(),
          category: z.string(),
          emotionTrigger: z.string().optional(),
          useCase: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          const hookId = randomBytes(16).toString("hex");
          
          await db.insert(hooksLibrary).values({
            id: hookId,
            channelId: input.channelId,
            hookText: input.hookText,
            category: input.category,
            emotionTrigger: input.emotionTrigger || null,
            useCase: input.useCase || null,
            performanceScore: 0,
            usageCount: 0,
          });
          
          return { id: hookId };
        }),
      
      incrementUsage: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          hookId: z.string(),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          await db.update(hooksLibrary)
            .set({ usageCount: sql`usage_count + 1` })
            .where(and(
              eq(hooksLibrary.id, input.hookId),
              eq(hooksLibrary.channelId, input.channelId)
            ));
          
          return { success: true };
        }),
    }),
    
    ugcBriefs: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          status: z.enum(["DRAFT", "SENT", "ACCEPTED", "IN_PROGRESS", "COMPLETED"]).optional(),
          limit: z.number().min(1).max(100).default(50),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          let query = db
            .select()
            .from(ugcBriefs)
            .where(eq(ugcBriefs.channelId, input.channelId));
          
          if (input.status) {
            query = query.where(eq(ugcBriefs.status, input.status));
          }
          
          const items = await query
            .orderBy(desc(ugcBriefs.createdAt))
            .limit(input.limit);
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          creatorId: z.string(),
          productId: z.string(),
          briefTitle: z.string(),
          briefContent: z.string(),
          deliverables: z.array(z.string()),
          deadlineAt: z.string(),
          budgetCents: z.number().min(0).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const db = getDb();
          
          const briefId = randomBytes(16).toString("hex");
          
          await db.insert(ugcBriefs).values({
            id: briefId,
            channelId: input.channelId,
            creatorId: input.creatorId,
            productId: input.productId,
            briefTitle: input.briefTitle,
            briefContent: input.briefContent,
            deliverables: input.deliverables,
            deadlineAt: new Date(input.deadlineAt),
            budgetCents: input.budgetCents || null,
            createdBy: ctx.user?.id || null,
            status: "DRAFT",
          });
          
          return { id: briefId };
        }),
      
      updateStatus: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          briefId: z.string(),
          status: z.enum(["SENT", "ACCEPTED", "IN_PROGRESS", "COMPLETED"]),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          await db.update(ugcBriefs)
            .set({ status: input.status })
            .where(and(
              eq(ugcBriefs.id, input.briefId),
              eq(ugcBriefs.channelId, input.channelId)
            ));
          
          return { success: true };
        }),
    }),
  }),
  
  // --------------------------------------------------------------------------
  // TREND SPOTTING & LAUNCH
  // --------------------------------------------------------------------------
  
  trends: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        status: z.enum(["SPOTTED", "ANALYZING", "APPROVED", "REJECTED", "LAUNCHED"]).optional(),
        limit: z.number().min(1).max(100).default(50),
      }))
      .query(async ({ input }) => {
        const db = getDb();
        
        let query = db
          .select()
          .from(trendSpotting)
          .where(eq(trendSpotting.channelId, input.channelId));
        
        if (input.status) {
          query = query.where(eq(trendSpotting.status, input.status));
        }
        
        const items = await query
          .orderBy(desc(trendSpotting.trendScore))
          .limit(input.limit);
        
        return items;
      }),
    
    create: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        trendName: z.string(),
        platform: z.string(),
        trendUrl: z.string().optional(),
        trendScore: z.number().min(0).max(100),
        estimatedDemand: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDb();
        
        const trendId = randomBytes(16).toString("hex");
        
        await db.insert(trendSpotting).values({
          id: trendId,
          channelId: input.channelId,
          trendName: input.trendName,
          platform: input.platform,
          trendUrl: input.trendUrl || null,
          trendScore: input.trendScore,
          estimatedDemand: input.estimatedDemand || null,
          notes: input.notes || null,
          spottedBy: ctx.user?.id || null,
          status: "SPOTTED",
        });
        
        return { id: trendId };
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        trendId: z.string(),
        status: z.enum(["ANALYZING", "APPROVED", "REJECTED", "LAUNCHED"]),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        
        await db.update(trendSpotting)
          .set({ status: input.status })
          .where(and(
            eq(trendSpotting.id, input.trendId),
            eq(trendSpotting.channelId, input.channelId)
          ));
        
        return { success: true };
      }),
  }),
  
  launchChecklists: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        productId: z.string().optional(),
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
      }))
      .query(async ({ input }) => {
        const db = getDb();
        
        let query = db
          .select()
          .from(launchChecklists)
          .where(eq(launchChecklists.channelId, input.channelId));
        
        if (input.productId) {
          query = query.where(eq(launchChecklists.productId, input.productId));
        }
        if (input.status) {
          query = query.where(eq(launchChecklists.status, input.status));
        }
        
        const items = await query.orderBy(desc(launchChecklists.createdAt));
        
        return items;
      }),
    
    create: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        productId: z.string(),
        launchDate: z.string(),
        tasks: z.array(z.object({
          task: z.string(),
          completed: z.boolean().default(false),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDb();
        
        const checklistId = randomBytes(16).toString("hex");
        
        await db.insert(launchChecklists).values({
          id: checklistId,
          channelId: input.channelId,
          productId: input.productId,
          launchDate: new Date(input.launchDate),
          tasks: input.tasks,
          createdBy: ctx.user?.id || null,
          status: "PENDING",
        });
        
        return { id: checklistId };
      }),
    
    updateTasks: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        checklistId: z.string(),
        tasks: z.array(z.object({
          task: z.string(),
          completed: z.boolean(),
        })),
      }))
      .mutation(async ({ input }) => {
        const db = getDb();
        
        const allCompleted = input.tasks.every(t => t.completed);
        
        await db.update(launchChecklists)
          .set({
            tasks: input.tasks,
            status: allCompleted ? "COMPLETED" : "IN_PROGRESS",
          })
          .where(and(
            eq(launchChecklists.id, input.checklistId),
            eq(launchChecklists.channelId, input.channelId)
          ));
        
        return { success: true };
      }),
  }),
  
  // --------------------------------------------------------------------------
  // GLOBAL EXPANSION
  // --------------------------------------------------------------------------
  
  regions: router({
    configs: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          let query = db
            .select()
            .from(regionConfigs)
            .where(eq(regionConfigs.channelId, input.channelId));
          
          if (input.status) {
            query = query.where(eq(regionConfigs.status, input.status));
          }
          
          const items = await query.orderBy(regionConfigs.regionCode);
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          regionCode: z.string(),
          regionName: z.string(),
          currency: z.string(),
          taxRate: z.number().min(0).max(100),
          shippingZones: z.array(z.string()).optional(),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          const configId = randomBytes(16).toString("hex");
          
          await db.insert(regionConfigs).values({
            id: configId,
            channelId: input.channelId,
            regionCode: input.regionCode,
            regionName: input.regionName,
            currency: input.currency,
            taxRate: input.taxRate,
            shippingZones: input.shippingZones || [],
            status: "ACTIVE",
          });
          
          return { id: configId };
        }),
    }),
    
    inventory: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          regionCode: z.string(),
        }))
        .query(async ({ input }) => {
          const db = getDb();
          
          const items = await db
            .select()
            .from(regionalInventory)
            .where(and(
              eq(regionalInventory.channelId, input.channelId),
              eq(regionalInventory.regionCode, input.regionCode)
            ));
          
          return items;
        }),
      
      set: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          regionCode: z.string(),
          variantId: z.string(),
          quantity: z.number().min(0),
        }))
        .mutation(async ({ input }) => {
          const db = getDb();
          
          const invId = randomBytes(16).toString("hex");
          
          await db.insert(regionalInventory).values({
            id: invId,
            channelId: input.channelId,
            regionCode: input.regionCode,
            variantId: input.variantId,
            quantity: input.quantity,
          }).onDuplicateKeyUpdate({
            set: { quantity: input.quantity },
          });
          
          return { success: true };
        }),
    }),
  }),
});
