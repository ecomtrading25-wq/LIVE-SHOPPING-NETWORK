import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDbSync } from "./db";
import { eq, and, desc, sql, inArray, gte, lte, like } from "drizzle-orm";
import {
  products,
  productVariants,
  productImages,
  productCategories,
  inventory,
  inventoryReservations,
  inventoryAdjustments,
  inventoryLots,
  skuProfitability,
  skuKillRules,
  priceBooks,
  priceBookEntries,
  promotions,
  bundles,
  suppliers,
  supplierProducts,
} from "../drizzle/schema";
import { randomBytes } from "crypto";

/**
 * LSN Products, Inventory & Pricing Router
 * 
 * Comprehensive product catalog and inventory management:
 * - Product & variant CRUD with multi-image support
 * - Category hierarchy management
 * - Real-time inventory tracking with reservations
 * - Inventory lot tracking with landed costs
 * - SKU profitability engine with auto-kill rules
 * - Dynamic pricing engine with price books
 * - Promotion and bundle management
 * - Supplier product mapping
 */

// ============================================================================
// PRODUCT CATALOG
// ============================================================================

export const lsnProductsRouter = router({
  products: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        categoryId: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        const db = getDbSync();
        
        let query = db
          .select()
          .from(products)
          .where(eq(products.channelId, input.channelId));
        
        if (input.categoryId) {
          query = query.where(eq(products.categoryId, input.categoryId));
        }
        if (input.status) {
          query = query.where(eq(products.status, input.status));
        }
        if (input.search) {
          query = query.where(like(products.name, `%${input.search}%`));
        }
        
        const items = await query
          .orderBy(desc(products.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        
        return items;
      }),
    
    get: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        productId: z.string(),
      }))
      .query(async ({ input }) => {
        const db = getDbSync();
        
        const [product] = await db
          .select()
          .from(products)
          .where(and(
            eq(products.id, input.productId),
            eq(products.channelId, input.channelId)
          ));
        
        if (!product) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        }
        
        // Get variants
        const variants = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.productId, input.productId));
        
        // Get images
        const images = await db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, input.productId))
          .orderBy(productImages.sortOrder);
        
        // Get inventory for each variant
        const variantIds = variants.map(v => v.id);
        let inventoryData: any[] = [];
        if (variantIds.length > 0) {
          inventoryData = await db
            .select()
            .from(inventory)
            .where(inArray(inventory.variantId, variantIds));
        }
        
        const inventoryMap = new Map(inventoryData.map(i => [i.variantId, i]));
        
        const variantsWithInventory = variants.map(v => ({
          ...v,
          inventory: inventoryMap.get(v.id) || null,
        }));
        
        return {
          product,
          variants: variantsWithInventory,
          images,
        };
      }),
    
    create: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        categoryId: z.string().optional(),
        supplierId: z.string().optional(),
        status: z.enum(["active", "draft", "archived"]).default("draft"),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        const productId = randomBytes(16).toString("hex");
        
        await db.insert(products).values({
          id: productId,
          channelId: input.channelId,
          name: input.name,
          description: input.description || null,
          categoryId: input.categoryId || null,
          supplierId: input.supplierId || null,
          status: input.status,
        });
        
        return { id: productId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        productId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        categoryId: z.string().optional(),
        status: z.enum(["active", "draft", "archived"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        const updates: any = {};
        if (input.name) updates.name = input.name;
        if (input.description !== undefined) updates.description = input.description;
        if (input.categoryId !== undefined) updates.categoryId = input.categoryId;
        if (input.status) updates.status = input.status;
        
        await db.update(products)
          .set(updates)
          .where(and(
            eq(products.id, input.productId),
            eq(products.channelId, input.channelId)
          ));
        
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        productId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        await db.update(products)
          .set({ status: "archived" })
          .where(and(
            eq(products.id, input.productId),
            eq(products.channelId, input.channelId)
          ));
        
        return { success: true };
      }),
  }),
  
  // --------------------------------------------------------------------------
  // PRODUCT VARIANTS
  // --------------------------------------------------------------------------
  
  variants: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        productId: z.string(),
      }))
      .query(async ({ input }) => {
        const db = getDbSync();
        
        const items = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.productId, input.productId));
        
        return items;
      }),
    
    create: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        productId: z.string(),
        sku: z.string(),
        name: z.string().optional(),
        priceCents: z.number().min(0),
        comparePriceCents: z.number().min(0).optional(),
        costCents: z.number().min(0).optional(),
        weight: z.number().optional(),
        options: z.record(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        const variantId = randomBytes(16).toString("hex");
        
        await db.insert(productVariants).values({
          id: variantId,
          productId: input.productId,
          sku: input.sku,
          name: input.name || null,
          priceCents: input.priceCents,
          comparePriceCents: input.comparePriceCents || null,
          costCents: input.costCents || null,
          weight: input.weight || null,
          options: input.options || {},
        });
        
        // Initialize inventory record
        await db.insert(inventory).values({
          id: randomBytes(16).toString("hex"),
          channelId: input.channelId,
          variantId,
          quantity: 0,
          reserved: 0,
        });
        
        return { id: variantId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        variantId: z.string(),
        sku: z.string().optional(),
        name: z.string().optional(),
        priceCents: z.number().min(0).optional(),
        comparePriceCents: z.number().min(0).optional(),
        costCents: z.number().min(0).optional(),
        weight: z.number().optional(),
        options: z.record(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        const updates: any = {};
        if (input.sku) updates.sku = input.sku;
        if (input.name !== undefined) updates.name = input.name;
        if (input.priceCents !== undefined) updates.priceCents = input.priceCents;
        if (input.comparePriceCents !== undefined) updates.comparePriceCents = input.comparePriceCents;
        if (input.costCents !== undefined) updates.costCents = input.costCents;
        if (input.weight !== undefined) updates.weight = input.weight;
        if (input.options) updates.options = input.options;
        
        await db.update(productVariants)
          .set(updates)
          .where(eq(productVariants.id, input.variantId));
        
        return { success: true };
      }),
  }),
  
  // --------------------------------------------------------------------------
  // PRODUCT IMAGES
  // --------------------------------------------------------------------------
  
  images: router({
    list: protectedProcedure
      .input(z.object({
        productId: z.string(),
      }))
      .query(async ({ input }) => {
        const db = getDbSync();
        
        const items = await db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, input.productId))
          .orderBy(productImages.sortOrder);
        
        return items;
      }),
    
    add: protectedProcedure
      .input(z.object({
        productId: z.string(),
        imageUrl: z.string().url(),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        const imageId = randomBytes(16).toString("hex");
        
        await db.insert(productImages).values({
          id: imageId,
          productId: input.productId,
          imageUrl: input.imageUrl,
          sortOrder: input.sortOrder,
        });
        
        return { id: imageId };
      }),
    
    reorder: protectedProcedure
      .input(z.object({
        imageId: z.string(),
        sortOrder: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        await db.update(productImages)
          .set({ sortOrder: input.sortOrder })
          .where(eq(productImages.id, input.imageId));
        
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({
        imageId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        await db.delete(productImages)
          .where(eq(productImages.id, input.imageId));
        
        return { success: true };
      }),
  }),
  
  // --------------------------------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------------------------------
  
  categories: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        parentId: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = getDbSync();
        
        let query = db
          .select()
          .from(productCategories)
          .where(eq(productCategories.channelId, input.channelId));
        
        if (input.parentId) {
          query = query.where(eq(productCategories.parentId, input.parentId));
        } else {
          query = query.where(sql`${productCategories.parentId} IS NULL`);
        }
        
        const items = await query.orderBy(productCategories.sortOrder);
        
        return items;
      }),
    
    create: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        parentId: z.string().optional(),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        const categoryId = randomBytes(16).toString("hex");
        
        await db.insert(productCategories).values({
          id: categoryId,
          channelId: input.channelId,
          name: input.name,
          slug: input.slug,
          description: input.description || null,
          parentId: input.parentId || null,
          sortOrder: input.sortOrder,
        });
        
        return { id: categoryId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        categoryId: z.string(),
        name: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        const updates: any = {};
        if (input.name) updates.name = input.name;
        if (input.slug) updates.slug = input.slug;
        if (input.description !== undefined) updates.description = input.description;
        if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;
        
        await db.update(productCategories)
          .set(updates)
          .where(and(
            eq(productCategories.id, input.categoryId),
            eq(productCategories.channelId, input.channelId)
          ));
        
        return { success: true };
      }),
  }),
  
  // --------------------------------------------------------------------------
  // INVENTORY MANAGEMENT
  // --------------------------------------------------------------------------
  
  inventory: router({
    get: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        variantId: z.string(),
      }))
      .query(async ({ input }) => {
        const db = getDbSync();
        
        const [inv] = await db
          .select()
          .from(inventory)
          .where(and(
            eq(inventory.channelId, input.channelId),
            eq(inventory.variantId, input.variantId)
          ));
        
        if (!inv) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Inventory record not found" });
        }
        
        // Get reservations
        const reservations = await db
          .select()
          .from(inventoryReservations)
          .where(eq(inventoryReservations.variantId, input.variantId));
        
        // Get recent adjustments
        const adjustments = await db
          .select()
          .from(inventoryAdjustments)
          .where(eq(inventoryAdjustments.variantId, input.variantId))
          .orderBy(desc(inventoryAdjustments.createdAt))
          .limit(20);
        
        return {
          inventory: inv,
          reservations,
          adjustments,
          available: inv.quantity - inv.reserved,
        };
      }),
    
    adjust: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        variantId: z.string(),
        quantityDelta: z.number(),
        reason: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = getDbSync();
        
        const [inv] = await db
          .select()
          .from(inventory)
          .where(and(
            eq(inventory.channelId, input.channelId),
            eq(inventory.variantId, input.variantId)
          ));
        
        if (!inv) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Inventory record not found" });
        }
        
        const newQuantity = inv.quantity + input.quantityDelta;
        
        if (newQuantity < 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient inventory" });
        }
        
        await db.update(inventory)
          .set({ quantity: newQuantity })
          .where(eq(inventory.id, inv.id));
        
        await db.insert(inventoryAdjustments).values({
          id: randomBytes(16).toString("hex"),
          variantId: input.variantId,
          quantityDelta: input.quantityDelta,
          reason: input.reason,
          notes: input.notes || null,
        });
        
        return { newQuantity, available: newQuantity - inv.reserved };
      }),
    
    reserve: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        variantId: z.string(),
        quantity: z.number().min(1),
        orderId: z.string(),
        expiresAt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        const [inv] = await db
          .select()
          .from(inventory)
          .where(and(
            eq(inventory.channelId, input.channelId),
            eq(inventory.variantId, input.variantId)
          ));
        
        if (!inv) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Inventory record not found" });
        }
        
        const available = inv.quantity - inv.reserved;
        if (available < input.quantity) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient inventory" });
        }
        
        const reservationId = randomBytes(16).toString("hex");
        
        await db.insert(inventoryReservations).values({
          id: reservationId,
          variantId: input.variantId,
          quantity: input.quantity,
          orderId: input.orderId,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        });
        
        await db.update(inventory)
          .set({ reserved: inv.reserved + input.quantity })
          .where(eq(inventory.id, inv.id));
        
        return { id: reservationId };
      }),
    
    release: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        reservationId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        const [reservation] = await db
          .select()
          .from(inventoryReservations)
          .where(eq(inventoryReservations.id, input.reservationId));
        
        if (!reservation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Reservation not found" });
        }
        
        const [inv] = await db
          .select()
          .from(inventory)
          .where(eq(inventory.variantId, reservation.variantId));
        
        if (inv) {
          await db.update(inventory)
            .set({ reserved: Math.max(0, inv.reserved - reservation.quantity) })
            .where(eq(inventory.id, inv.id));
        }
        
        await db.delete(inventoryReservations)
          .where(eq(inventoryReservations.id, input.reservationId));
        
        return { success: true };
      }),
    
    lots: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          variantId: z.string().optional(),
          supplierId: z.string().optional(),
          status: z.string().optional(),
          limit: z.number().min(1).max(200).default(50),
        }))
        .query(async ({ input }) => {
          const db = getDbSync();
          
          let query = db
            .select()
            .from(inventoryLots)
            .where(eq(inventoryLots.channelId, input.channelId));
          
          if (input.variantId) {
            query = query.where(eq(inventoryLots.variantId, input.variantId));
          }
          if (input.supplierId) {
            query = query.where(eq(inventoryLots.supplierId, input.supplierId));
          }
          if (input.status) {
            query = query.where(eq(inventoryLots.status, input.status));
          }
          
          const items = await query
            .orderBy(desc(inventoryLots.receivedAt))
            .limit(input.limit);
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          variantId: z.string(),
          supplierId: z.string(),
          poNumber: z.string().optional(),
          lotNumber: z.string(),
          quantityReceived: z.number().min(1),
          unitCostCents: z.number().min(0),
          shippingCostCents: z.number().min(0).default(0),
          customsCostCents: z.number().min(0).default(0),
          otherCostCents: z.number().min(0).default(0),
          receivedAt: z.string(),
          expiryDate: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = getDbSync();
          
          const lotId = randomBytes(16).toString("hex");
          
          const landedCostCents = input.unitCostCents + 
            Math.floor((input.shippingCostCents + input.customsCostCents + input.otherCostCents) / input.quantityReceived);
          
          await db.insert(inventoryLots).values({
            id: lotId,
            channelId: input.channelId,
            variantId: input.variantId,
            supplierId: input.supplierId,
            poNumber: input.poNumber || null,
            lotNumber: input.lotNumber,
            quantityReceived: input.quantityReceived,
            quantityRemaining: input.quantityReceived,
            unitCostCents: input.unitCostCents,
            shippingCostCents: input.shippingCostCents,
            customsCostCents: input.customsCostCents,
            otherCostCents: input.otherCostCents,
            landedCostCents,
            receivedAt: new Date(input.receivedAt),
            expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
            status: "ACTIVE",
          });
          
          // Update inventory
          const [inv] = await db
            .select()
            .from(inventory)
            .where(and(
              eq(inventory.channelId, input.channelId),
              eq(inventory.variantId, input.variantId)
            ));
          
          if (inv) {
            await db.update(inventory)
              .set({ quantity: inv.quantity + input.quantityReceived })
              .where(eq(inventory.id, inv.id));
          }
          
          return { id: lotId, landedCostCents };
        }),
    }),
  }),
  
  // --------------------------------------------------------------------------
  // SKU PROFITABILITY ENGINE
  // --------------------------------------------------------------------------
  
  skuProfitability: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        minMarginPercent: z.number().optional(),
        maxMarginPercent: z.number().optional(),
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        const db = getDbSync();
        
        let query = db
          .select()
          .from(skuProfitability)
          .where(eq(skuProfitability.channelId, input.channelId));
        
        if (input.minMarginPercent !== undefined) {
          query = query.where(gte(skuProfitability.marginPercent, input.minMarginPercent));
        }
        if (input.maxMarginPercent !== undefined) {
          query = query.where(lte(skuProfitability.marginPercent, input.maxMarginPercent));
        }
        
        const items = await query
          .orderBy(desc(skuProfitability.marginPercent))
          .limit(input.limit)
          .offset(input.offset);
        
        return items;
      }),
    
    calculate: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        variantId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        const [variant] = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.id, input.variantId));
        
        if (!variant) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Variant not found" });
        }
        
        // Get average landed cost from lots
        const [lotStats] = await db
          .select({
            avgLandedCost: sql<number>`AVG(${inventoryLots.landedCostCents})`,
            totalQuantity: sql<number>`SUM(${inventoryLots.quantityRemaining})`,
          })
          .from(inventoryLots)
          .where(and(
            eq(inventoryLots.channelId, input.channelId),
            eq(inventoryLots.variantId, input.variantId),
            eq(inventoryLots.status, "ACTIVE")
          ));
        
        const landedCostCents = lotStats?.avgLandedCost || variant.costCents || 0;
        const sellingPriceCents = variant.priceCents;
        
        // Estimate fees (PayPal ~3.5%)
        const paymentFeeCents = Math.floor(sellingPriceCents * 0.035);
        
        // Estimate shipping cost (simplified)
        const shippingCostCents = 500; // $5 AUD
        
        const totalCostCents = landedCostCents + paymentFeeCents + shippingCostCents;
        const profitCents = sellingPriceCents - totalCostCents;
        const marginPercent = sellingPriceCents > 0 ? (profitCents / sellingPriceCents) * 100 : 0;
        
        // Upsert profitability record
        await db.insert(skuProfitability).values({
          id: randomBytes(16).toString("hex"),
          channelId: input.channelId,
          variantId: input.variantId,
          sku: variant.sku,
          landedCostCents,
          sellingPriceCents,
          paymentFeeCents,
          shippingCostCents,
          totalCostCents,
          profitCents,
          marginPercent,
        }).onDuplicateKeyUpdate({
          set: {
            landedCostCents,
            sellingPriceCents,
            paymentFeeCents,
            shippingCostCents,
            totalCostCents,
            profitCents,
            marginPercent,
          },
        });
        
        return {
          landedCostCents,
          sellingPriceCents,
          profitCents,
          marginPercent,
        };
      }),
    
    killRules: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
        }))
        .query(async ({ input }) => {
          const db = getDbSync();
          
          let query = db
            .select()
            .from(skuKillRules)
            .where(eq(skuKillRules.channelId, input.channelId));
          
          if (input.status) {
            query = query.where(eq(skuKillRules.status, input.status));
          }
          
          const items = await query.orderBy(desc(skuKillRules.createdAt));
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          name: z.string(),
          condition: z.enum(["MARGIN_BELOW", "PROFIT_BELOW", "NO_SALES_DAYS"]),
          thresholdValue: z.number(),
          action: z.enum(["ARCHIVE", "NOTIFY", "REDUCE_PRICE"]),
          autoExecute: z.boolean().default(false),
        }))
        .mutation(async ({ input }) => {
          const db = getDbSync();
          
          const ruleId = randomBytes(16).toString("hex");
          
          await db.insert(skuKillRules).values({
            id: ruleId,
            channelId: input.channelId,
            name: input.name,
            condition: input.condition,
            thresholdValue: input.thresholdValue,
            action: input.action,
            autoExecute: input.autoExecute,
            status: "ACTIVE",
          });
          
          return { id: ruleId };
        }),
      
      execute: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          ruleId: z.string(),
        }))
        .mutation(async ({ input }) => {
          const db = getDbSync();
          
          const [rule] = await db
            .select()
            .from(skuKillRules)
            .where(and(
              eq(skuKillRules.id, input.ruleId),
              eq(skuKillRules.channelId, input.channelId)
            ));
          
          if (!rule) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Rule not found" });
          }
          
          // Find SKUs matching condition
          let affectedSkus: string[] = [];
          
          if (rule.condition === "MARGIN_BELOW") {
            const skus = await db
              .select({ variantId: skuProfitability.variantId })
              .from(skuProfitability)
              .where(and(
                eq(skuProfitability.channelId, input.channelId),
                lte(skuProfitability.marginPercent, rule.thresholdValue)
              ));
            
            affectedSkus = skus.map(s => s.variantId);
          }
          
          // Execute action
          if (rule.action === "ARCHIVE" && affectedSkus.length > 0) {
            await db.update(products)
              .set({ status: "archived" })
              .where(inArray(products.id, affectedSkus));
          }
          
          await db.update(skuKillRules)
            .set({ lastExecutedAt: new Date() })
            .where(eq(skuKillRules.id, input.ruleId));
          
          return { affectedSkus: affectedSkus.length };
        }),
    }),
  }),
  
  // --------------------------------------------------------------------------
  // PRICING ENGINE
  // --------------------------------------------------------------------------
  
  pricing: router({
    priceBooks: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
        }))
        .query(async ({ input }) => {
          const db = getDbSync();
          
          let query = db
            .select()
            .from(priceBooks)
            .where(eq(priceBooks.channelId, input.channelId));
          
          if (input.status) {
            query = query.where(eq(priceBooks.status, input.status));
          }
          
          const items = await query.orderBy(priceBooks.priority);
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          name: z.string(),
          description: z.string().optional(),
          priority: z.number().default(0),
          validFrom: z.string().optional(),
          validUntil: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          const db = getDbSync();
          
          const priceBookId = randomBytes(16).toString("hex");
          
          await db.insert(priceBooks).values({
            id: priceBookId,
            channelId: input.channelId,
            name: input.name,
            description: input.description || null,
            priority: input.priority,
            validFrom: input.validFrom ? new Date(input.validFrom) : null,
            validUntil: input.validUntil ? new Date(input.validUntil) : null,
            status: "ACTIVE",
          });
          
          return { id: priceBookId };
        }),
      
      entries: router({
        list: protectedProcedure
          .input(z.object({
            channelId: z.string(),
            priceBookId: z.string(),
          }))
          .query(async ({ input }) => {
            const db = getDbSync();
            
            const items = await db
              .select()
              .from(priceBookEntries)
              .where(and(
                eq(priceBookEntries.channelId, input.channelId),
                eq(priceBookEntries.priceBookId, input.priceBookId)
              ));
            
            return items;
          }),
        
        add: protectedProcedure
          .input(z.object({
            channelId: z.string(),
            priceBookId: z.string(),
            variantId: z.string(),
            priceCents: z.number().min(0),
            comparePriceCents: z.number().min(0).optional(),
          }))
          .mutation(async ({ input }) => {
            const db = getDbSync();
            
            const entryId = randomBytes(16).toString("hex");
            
            await db.insert(priceBookEntries).values({
              id: entryId,
              channelId: input.channelId,
              priceBookId: input.priceBookId,
              variantId: input.variantId,
              priceCents: input.priceCents,
              comparePriceCents: input.comparePriceCents || null,
            });
            
            return { id: entryId };
          }),
      }),
    }),
    
    promotions: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "ENDED", "PAUSED"]).optional(),
          limit: z.number().min(1).max(100).default(50),
        }))
        .query(async ({ input }) => {
          const db = getDbSync();
          
          let query = db
            .select()
            .from(promotions)
            .where(eq(promotions.channelId, input.channelId));
          
          if (input.status) {
            query = query.where(eq(promotions.status, input.status));
          }
          
          const items = await query
            .orderBy(desc(promotions.startsAt))
            .limit(input.limit);
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          name: z.string(),
          code: z.string().optional(),
          discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]),
          discountValue: z.number().min(0),
          minOrderCents: z.number().min(0).optional(),
          maxUses: z.number().min(1).optional(),
          maxUsesPerCustomer: z.number().min(1).optional(),
          startsAt: z.string(),
          endsAt: z.string(),
          applicableProductIds: z.array(z.string()).optional(),
        }))
        .mutation(async ({ input }) => {
          const db = getDbSync();
          
          const promoId = randomBytes(16).toString("hex");
          
          await db.insert(promotions).values({
            id: promoId,
            channelId: input.channelId,
            name: input.name,
            code: input.code || null,
            discountType: input.discountType,
            discountValue: input.discountValue,
            minOrderCents: input.minOrderCents || null,
            maxUses: input.maxUses || null,
            maxUsesPerCustomer: input.maxUsesPerCustomer || null,
            currentUses: 0,
            startsAt: new Date(input.startsAt),
            endsAt: new Date(input.endsAt),
            applicableProductIds: input.applicableProductIds || [],
            status: "SCHEDULED",
          });
          
          return { id: promoId };
        }),
      
      activate: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          promoId: z.string(),
        }))
        .mutation(async ({ input }) => {
          const db = getDbSync();
          
          await db.update(promotions)
            .set({ status: "ACTIVE" })
            .where(and(
              eq(promotions.id, input.promoId),
              eq(promotions.channelId, input.channelId)
            ));
          
          return { success: true };
        }),
    }),
    
    bundles: router({
      list: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
        }))
        .query(async ({ input }) => {
          const db = getDbSync();
          
          let query = db
            .select()
            .from(bundles)
            .where(eq(bundles.channelId, input.channelId));
          
          if (input.status) {
            query = query.where(eq(bundles.status, input.status));
          }
          
          const items = await query.orderBy(desc(bundles.createdAt));
          
          return items;
        }),
      
      create: protectedProcedure
        .input(z.object({
          channelId: z.string(),
          name: z.string(),
          description: z.string().optional(),
          bundleType: z.enum(["FIXED", "MIX_AND_MATCH", "BOGO"]),
          variantIds: z.array(z.string()),
          bundlePriceCents: z.number().min(0),
          savingsCents: z.number().min(0).optional(),
        }))
        .mutation(async ({ input }) => {
          const db = getDbSync();
          
          const bundleId = randomBytes(16).toString("hex");
          
          await db.insert(bundles).values({
            id: bundleId,
            channelId: input.channelId,
            name: input.name,
            description: input.description || null,
            bundleType: input.bundleType,
            variantIds: input.variantIds,
            bundlePriceCents: input.bundlePriceCents,
            savingsCents: input.savingsCents || null,
            status: "ACTIVE",
          });
          
          return { id: bundleId };
        }),
    }),
  }),
  
  // --------------------------------------------------------------------------
  // SUPPLIER PRODUCTS
  // --------------------------------------------------------------------------
  
  supplierProducts: router({
    list: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        supplierId: z.string(),
      }))
      .query(async ({ input }) => {
        const db = getDbSync();
        
        const items = await db
          .select()
          .from(supplierProducts)
          .where(and(
            eq(supplierProducts.channelId, input.channelId),
            eq(supplierProducts.supplierId, input.supplierId)
          ));
        
        return items;
      }),
    
    link: protectedProcedure
      .input(z.object({
        channelId: z.string(),
        supplierId: z.string(),
        variantId: z.string(),
        supplierSku: z.string(),
        supplierPriceCents: z.number().min(0),
        leadTimeDays: z.number().min(0).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = getDbSync();
        
        const linkId = randomBytes(16).toString("hex");
        
        await db.insert(supplierProducts).values({
          id: linkId,
          channelId: input.channelId,
          supplierId: input.supplierId,
          variantId: input.variantId,
          supplierSku: input.supplierSku,
          supplierPriceCents: input.supplierPriceCents,
          leadTimeDays: input.leadTimeDays || null,
        });
        
        return { id: linkId };
      }),
  }),
});
