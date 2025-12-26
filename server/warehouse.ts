import { nanoid } from "nanoid";
import { getDb } from "./db";
import {
  fulfillmentTasks,
  fulfillmentEvents,
  packingSessions,
  packingSessionItems,
  inventory,
  inventoryReservations,
  orders,
  orderItems,
  shipments,
  printJobs,
} from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Live Shopping Network - Warehouse Management System
 * Comprehensive WMS with pick/pack/ship workflows
 */

export interface PickTask {
  id: string;
  orderId: string;
  warehouseId: string;
  items: PickItem[];
  priority: number;
  status: "pending" | "assigned" | "in_progress" | "completed" | "failed";
}

export interface PickItem {
  sku: string;
  quantity: number;
  binLocation: string;
  picked: number;
}

export interface PackSession {
  id: string;
  warehouseId: string;
  packerId: string;
  orders: string[];
  status: "active" | "completed";
  startedAt: Date;
  completedAt?: Date;
}

export interface ShipmentRequest {
  orderId: string;
  carrier: string;
  service: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  items: Array<{
    sku: string;
    quantity: number;
  }>;
}

/**
 * Warehouse Management Service
 */
export class WarehouseService {
  /**
   * Create pick tasks for an order
   */
  static async createPickTasks(orderId: string, warehouseId: string): Promise<PickTask> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get order items
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    if (items.length === 0) {
      throw new Error("No items found for order");
    }

    // Create fulfillment task
    const taskId = nanoid();
    await db.insert(fulfillmentTasks).values({
      id: taskId,
      orderId,
      warehouseId,
      taskType: "pick",
      status: "pending",
      priority: 1,
      metadata: {
        items: items.map((item) => ({
          sku: item.sku,
          quantity: item.quantity,
        })),
      },
    });

    // Reserve inventory
    for (const item of items) {
      await this.reserveInventory(item.sku, item.quantity, warehouseId, orderId);
    }

    // Log event
    await db.insert(fulfillmentEvents).values({
      id: nanoid(),
      taskId: taskId,
      eventType: "task_created",
      eventData: { taskType: "pick", orderId },
    });

    return {
      id: taskId,
      orderId,
      warehouseId,
      items: items.map((item) => ({
        sku: item.sku,
        quantity: item.quantity,
        binLocation: "", // Would be fetched from bin mappings
        picked: 0,
      })),
      priority: 1,
      status: "pending",
    };
  }

  /**
   * Reserve inventory for an order
   */
  static async reserveInventory(
    sku: string,
    quantity: number,
    warehouseId: string,
    orderId: string
  ): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Find product by SKU (need to join with products table)
    const { products } = await import("../drizzle/schema");
    const productRecords = await db
      .select()
      .from(products)
      .where(eq(products.sku, sku))
      .limit(1);

    if (productRecords.length === 0) {
      throw new Error(`Product not found: ${sku}`);
    }

    const productRecord = productRecords[0];

    // Find inventory for this product in the warehouse
    const inventoryRecords = await db
      .select()
      .from(inventory)
      .where(and(eq(inventory.productId, productRecord.id), eq(inventory.warehouseId, warehouseId)))
      .limit(1);

    if (inventoryRecords.length === 0) {
      throw new Error(`Inventory not found for product ${sku} in warehouse ${warehouseId}`);
    }

    const product = inventoryRecords[0];

    // Check available inventory
    if (product.available < quantity) {
      throw new Error(`Insufficient inventory for ${sku}: ${product.available} available, ${quantity} requested`);
    }

    // Create reservation
    await db.insert(inventoryReservations).values({
      id: nanoid(),
      inventoryId: product.id,
      orderId,
      quantity,
      status: "active",
    });

    // Update inventory counts
    await db
      .update(inventory)
      .set({
        reserved: sql`${inventory.reserved} + ${quantity}`,
        available: sql`${inventory.available} - ${quantity}`,
      })
      .where(eq(inventory.id, product.id));
  }

  /**
   * Start a picking session
   */
  static async startPickSession(taskId: string, pickerId: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(fulfillmentTasks)
      .set({
        status: "in_progress",
        assignedTo: pickerId,
        startedAt: new Date(),
      })
      .where(eq(fulfillmentTasks.id, taskId));

    await db.insert(fulfillmentEvents).values({
      id: nanoid(),
      taskId: taskId,
      eventType: "pick_started",
      eventData: { pickerId },
    });
  }

  /**
   * Complete a pick task
   */
  static async completePickTask(taskId: string, pickedItems: PickItem[]): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Verify all items were picked
    const allPicked = pickedItems.every((item) => item.picked === item.quantity);

    if (!allPicked) {
      throw new Error("Not all items were picked");
    }

    await db
      .update(fulfillmentTasks)
      .set({
        status: "completed",
        completedAt: new Date(),
        metadata: { pickedItems },
      })
      .where(eq(fulfillmentTasks.id, taskId));

    await db.insert(fulfillmentEvents).values({
      id: nanoid(),
      taskId: taskId,
      eventType: "pick_completed",
      eventData: { pickedItems },
    });

    // Get the order ID and create pack task
    const [task] = await db.select().from(fulfillmentTasks).where(eq(fulfillmentTasks.id, taskId)).limit(1);

    if (task) {
      await this.createPackTask(task.orderId, task.warehouseId);
    }
  }

  /**
   * Create pack task for an order
   */
  static async createPackTask(orderId: string, warehouseId: string): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const taskId = nanoid();
    await db.insert(fulfillmentTasks).values({
      id: taskId,
      orderId,
      warehouseId,
      taskType: "pack",
      status: "pending",
      priority: 1,
    });

    await db.insert(fulfillmentEvents).values({
      id: nanoid(),
      taskId: taskId,
      eventType: "task_created",
      eventData: { taskType: "pack", orderId },
    });

    return taskId;
  }

  /**
   * Start a packing session
   */
  static async startPackSession(warehouseId: string, packerId: string): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const sessionId = nanoid();
    await db.insert(packingSessions).values({
      id: sessionId,
      warehouseId,
      userId: packerId,
      status: "active",
    });

    return sessionId;
  }

  /**
   * Add order to packing session
   */
  static async addOrderToPackSession(sessionId: string, orderId: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get order items
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    // Add items to packing session
    for (const item of items) {
      await db.insert(packingSessionItems).values({
        id: nanoid(),
        sessionId: sessionId,
        orderItemId: item.id,
      });
    }

    // Update pack task status
    const [packTask] = await db
      .select()
      .from(fulfillmentTasks)
      .where(and(eq(fulfillmentTasks.orderId, orderId), eq(fulfillmentTasks.taskType, "pack")))
      .limit(1);

    if (packTask) {
      await db
        .update(fulfillmentTasks)
        .set({
          status: "in_progress",
          startedAt: new Date(),
        })
        .where(eq(fulfillmentTasks.id, packTask.id));
    }
  }

  /**
   * Complete packing session
   */
  static async completePackSession(sessionId: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(packingSessions)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(packingSessions.id, sessionId));

    // Get all orders in this session
    const items = await db.select().from(packingSessionItems).where(eq(packingSessionItems.sessionId, sessionId));

    const orderIds = new Set<string>();
    for (const item of items) {
      const [orderItem] = await db.select().from(orderItems).where(eq(orderItems.id, item.orderItemId)).limit(1);
      if (orderItem) {
        orderIds.add(orderItem.orderId);
      }
    }

    // Complete pack tasks for all orders
    for (const orderId of Array.from(orderIds)) {
      const [packTask] = await db
        .select()
        .from(fulfillmentTasks)
        .where(and(eq(fulfillmentTasks.orderId, orderId), eq(fulfillmentTasks.taskType, "pack")))
        .limit(1);

      if (packTask) {
        await db
          .update(fulfillmentTasks)
          .set({
            status: "completed",
            completedAt: new Date(),
          })
          .where(eq(fulfillmentTasks.id, packTask.id));

        // Create ship task
        const [session] = await db.select().from(packingSessions).where(eq(packingSessions.id, sessionId)).limit(1);

        if (session) {
          await this.createShipTask(orderId, session.warehouseId);
        }
      }
    }
  }

  /**
   * Create ship task for an order
   */
  static async createShipTask(orderId: string, warehouseId: string): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const taskId = nanoid();
    await db.insert(fulfillmentTasks).values({
      id: taskId,
      orderId,
      warehouseId,
      taskType: "ship",
      status: "pending",
      priority: 1,
    });

    await db.insert(fulfillmentEvents).values({
      id: nanoid(),
      taskId: taskId,
      eventType: "task_created",
      eventData: { taskType: "ship", orderId },
    });

    return taskId;
  }

  /**
   * Create shipment and generate label
   */
  static async createShipment(request: ShipmentRequest): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // In production, this would integrate with shipping carriers (Sendle, AusPost, etc.)
    const trackingNumber = `LSN${Date.now()}${Math.random().toString(36).substring(7).toUpperCase()}`;

    const shipmentId = nanoid();
    await db.insert(shipments).values({
      id: shipmentId,
      orderId: request.orderId,
      warehouseId: "", // Would be fetched from order or fulfillment task
      carrier: request.carrier,
      service: request.service,
      trackingNumber,
      status: "pending",
      metadata: {
        weight: request.weight,
        dimensions: request.dimensions,
        items: request.items,
      },
    });

    // Create print job for shipping label
    // Note: Would need to get warehouseId from order or fulfillment task
    // Skipping print job creation for now as it requires warehouse context

    // Update order status
    await db
      .update(orders)
      .set({
        status: "shipped",
        fulfillmentStatus: "fulfilled",
      })
      .where(eq(orders.id, request.orderId));

    // Complete ship task
    const [shipTask] = await db
      .select()
      .from(fulfillmentTasks)
      .where(and(eq(fulfillmentTasks.orderId, request.orderId), eq(fulfillmentTasks.taskType, "ship")))
      .limit(1);

    if (shipTask) {
      await db
        .update(fulfillmentTasks)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(fulfillmentTasks.id, shipTask.id));

      await db.insert(fulfillmentEvents).values({
        id: nanoid(),
        taskId: shipTask.id,
        eventType: "ship_completed",
        eventData: { trackingNumber, carrier: request.carrier },
      });
    }

    // Release inventory reservations
    await this.releaseInventory(request.orderId);

    return trackingNumber;
  }

  /**
   * Release inventory reservations after shipment
   */
  static async releaseInventory(orderId: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all reservations for this order
    const reservations = await db.select().from(inventoryReservations).where(eq(inventoryReservations.orderId, orderId));

    for (const reservation of reservations) {
      // Update inventory counts
      await db
        .update(inventory)
        .set({
          reserved: sql`${inventory.reserved} - ${reservation.quantity}`,
          onHand: sql`${inventory.onHand} - ${reservation.quantity}`,
        })
        .where(eq(inventory.id, reservation.inventoryId));

      // Mark reservation as fulfilled
      await db
        .update(inventoryReservations)
        .set({
          status: "fulfilled",
        })
        .where(eq(inventoryReservations.id, reservation.id));
    }
  }

  /**
   * Get warehouse performance metrics
   */
  static async getWarehouseMetrics(warehouseId: string, startDate: Date, endDate: Date) {
    const db = await getDb();
    if (!db) return null;

    // Count completed tasks by type
    const [pickTasks] = await db
      .select({ count: sql<number>`count(*)` })
      .from(fulfillmentTasks)
      .where(
        and(
          eq(fulfillmentTasks.warehouseId, warehouseId),
          eq(fulfillmentTasks.taskType, "pick"),
          eq(fulfillmentTasks.status, "completed")
        )
      );

    const [packTasks] = await db
      .select({ count: sql<number>`count(*)` })
      .from(fulfillmentTasks)
      .where(
        and(
          eq(fulfillmentTasks.warehouseId, warehouseId),
          eq(fulfillmentTasks.taskType, "pack"),
          eq(fulfillmentTasks.status, "completed")
        )
      );

    const [shipTasks] = await db
      .select({ count: sql<number>`count(*)` })
      .from(fulfillmentTasks)
      .where(
        and(
          eq(fulfillmentTasks.warehouseId, warehouseId),
          eq(fulfillmentTasks.taskType, "ship"),
          eq(fulfillmentTasks.status, "completed")
        )
      );

    return {
      pickTasksCompleted: pickTasks?.count || 0,
      packTasksCompleted: packTasks?.count || 0,
      shipTasksCompleted: shipTasks?.count || 0,
    };
  }
}
