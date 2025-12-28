/**
 * Commerce Routers - Products, Orders, Cart, Checkout
 * Complete e-commerce functionality with Stripe integration
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as productService from "./product-management";
import * as orderService from "./order-management";
import { getDb } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { products, orders, orderItems, cartItems } from "../drizzle/schema";

// ============================================================================
// Products Router
// ============================================================================

export const productsRouter = router({
  list: publicProcedure
    .input(z.object({
      channelId: z.string().optional(),
      status: z.enum(["active", "draft", "archived"]).optional(),
      search: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return await productService.listProducts(input);
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await productService.getProduct(input.id);
    }),

  create: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      sku: z.string(),
      name: z.string(),
      description: z.string().optional(),
      price: z.string(),
      compareAtPrice: z.string().optional(),
      cost: z.string().optional(),
      imageUrl: z.string().optional(),
      status: z.enum(["active", "draft", "archived"]).optional(),
      metadata: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      return await productService.createProduct(input);
    }),

  uploadImage: protectedProcedure
    .input(z.object({
      productId: z.string(),
      imageBase64: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.imageBase64, "base64");
      const url = await productService.uploadProductImage(
        input.productId,
        buffer,
        input.mimeType
      );
      return { url };
    }),

  featured: publicProcedure
    .input(z.object({
      limit: z.number().default(8),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      
      const featured = await db.select()
        .from(products)
        .where(eq(products.status, "active"))
        .orderBy(desc(products.createdAt))
        .limit(input.limit);
      
      return featured;
    }),

  trending: publicProcedure
    .input(z.object({
      limit: z.number().default(8),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      
      // Get products with most orders in last 7 days
      const trending = await db.select({
        product: products,
        orderCount: sql<number>`COUNT(DISTINCT ${orderItems.orderId})`,
      })
        .from(products)
        .leftJoin(orderItems, eq(products.id, orderItems.productId))
        .leftJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(products.status, "active"),
            sql`${orders.createdAt} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
          )
        )
        .groupBy(products.id)
        .orderBy(desc(sql`COUNT(DISTINCT ${orderItems.orderId})`))
        .limit(input.limit);
      
      return trending.map(t => t.product);
    }),
});

// ============================================================================
// Orders Router
// ============================================================================

export const ordersRouter = router({
  create: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      orderNumber: z.string(),
      customerName: z.string().optional(),
      customerEmail: z.string().optional(),
      shippingAddress: z.any().optional(),
      billingAddress: z.any().optional(),
      subtotal: z.string(),
      tax: z.string().optional(),
      shipping: z.string().optional(),
      total: z.string(),
      currency: z.string().optional(),
      items: z.array(z.object({
        productId: z.string(),
        sku: z.string(),
        name: z.string(),
        quantity: z.number(),
        price: z.string(),
      })),
      showId: z.string().optional(),
      hostId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await orderService.createOrder(input);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await orderService.getOrder(input.id);
    }),

  list: protectedProcedure
    .input(z.object({
      channelId: z.string().optional(),
      status: z.string().optional(),
      paymentStatus: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return await orderService.listOrders(input);
    }),

  myOrders: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      
      const userOrders = await db.select()
        .from(orders)
        .where(eq(orders.customerEmail, ctx.user.email || ""))
        .orderBy(desc(orders.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      
      return userOrders;
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      orderId: z.string(),
      status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]),
    }))
    .mutation(async ({ input }) => {
      return await orderService.updateOrderStatus(input.orderId, input.status);
    }),

  createPaymentIntent: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ input }) => {
      return await orderService.createPaymentIntent(input.orderId);
    }),

  confirmPayment: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ input }) => {
      return await orderService.confirmPayment(input.orderId);
    }),

  refund: protectedProcedure
    .input(z.object({
      orderId: z.string(),
      amount: z.number().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await orderService.processRefund(
        input.orderId,
        input.amount,
        input.reason
      );
    }),

  analytics: protectedProcedure
    .input(z.object({
      channelId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return await orderService.getOrderAnalytics(input.channelId);
    }),
});

// ============================================================================
// Cart Router
// ============================================================================

export const cartRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    
    const items = await db.select({
      cartItem: cartItems,
      product: products,
    })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, ctx.user.id));
    
    const total = items.reduce((sum, item) => {
      const price = parseFloat(item.product.price);
      const quantity = item.cartItem.quantity;
      return sum + (price * quantity);
    }, 0);
    
    return {
      items,
      total: total.toFixed(2),
      count: items.length,
    };
  }),

  add: protectedProcedure
    .input(z.object({
      productId: z.string(),
      quantity: z.number().default(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      // Check if item already in cart
      const [existing] = await db.select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.userId, ctx.user.id),
            eq(cartItems.productId, input.productId)
          )
        )
        .limit(1);
      
      if (existing) {
        // Update quantity
        await db.update(cartItems)
          .set({
            quantity: existing.quantity + input.quantity,
            updatedAt: new Date(),
          })
          .where(eq(cartItems.id, existing.id));
      } else {
        // Create new cart item
        const cartItemId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.insert(cartItems).values({
          id: cartItemId,
          userId: ctx.user.id,
          productId: input.productId,
          quantity: input.quantity,
        });
      }
      
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      cartItemId: z.string(),
      quantity: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      if (input.quantity <= 0) {
        // Remove item
        await db.delete(cartItems)
          .where(
            and(
              eq(cartItems.id, input.cartItemId),
              eq(cartItems.userId, ctx.user.id)
            )
          );
      } else {
        // Update quantity
        await db.update(cartItems)
          .set({
            quantity: input.quantity,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(cartItems.id, input.cartItemId),
              eq(cartItems.userId, ctx.user.id)
            )
          );
      }
      
      return { success: true };
    }),

  remove: protectedProcedure
    .input(z.object({ cartItemId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      await db.delete(cartItems)
        .where(
          and(
            eq(cartItems.id, input.cartItemId),
            eq(cartItems.userId, ctx.user.id)
          )
        );
      
      return { success: true };
    }),

  clear: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    
    await db.delete(cartItems)
      .where(eq(cartItems.userId, ctx.user.id));
    
    return { success: true };
  }),
});

// ============================================================================
// Checkout Router
// ============================================================================

export const checkoutRouter = router({
  createSession: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      shippingAddress: z.object({
        name: z.string(),
        line1: z.string(),
        line2: z.string().optional(),
        city: z.string(),
        state: z.string(),
        postalCode: z.string(),
        country: z.string(),
      }),
      billingAddress: z.object({
        name: z.string(),
        line1: z.string(),
        line2: z.string().optional(),
        city: z.string(),
        state: z.string(),
        postalCode: z.string(),
        country: z.string(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      // Get cart items
      const items = await db.select({
        cartItem: cartItems,
        product: products,
      })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.userId, ctx.user.id));
      
      if (items.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cart is empty",
        });
      }
      
      // Calculate totals
      const subtotal = items.reduce((sum, item) => {
        const price = parseFloat(item.product.price);
        const quantity = item.cartItem.quantity;
        return sum + (price * quantity);
      }, 0);
      
      const tax = subtotal * 0.1; // 10% tax
      const shipping = 9.99;
      const total = subtotal + tax + shipping;
      
      // Create order
      const orderNumber = `ORD-${Date.now()}`;
      const { orderId } = await orderService.createOrder({
        channelId: input.channelId,
        orderNumber,
        customerName: input.shippingAddress.name,
        customerEmail: ctx.user.email || undefined,
        shippingAddress: input.shippingAddress,
        billingAddress: input.billingAddress || input.shippingAddress,
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        shipping: shipping.toFixed(2),
        total: total.toFixed(2),
        items: items.map(item => ({
          productId: item.product.id,
          sku: item.product.sku,
          name: item.product.name,
          quantity: item.cartItem.quantity,
          price: item.product.price,
        })),
      });
      
      // Create payment intent
      const paymentIntent = await orderService.createPaymentIntent(orderId);
      
      // Clear cart
      await db.delete(cartItems)
        .where(eq(cartItems.userId, ctx.user.id));
      
      return {
        orderId,
        orderNumber,
        ...paymentIntent,
      };
    }),
});
