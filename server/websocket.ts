/**
 * WebSocket Server for Real-Time Notifications
 * Handles live updates for orders, inventory, disputes, and fulfillment tasks
 */

import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

interface Client {
  ws: WebSocket;
  userId?: string;
  role?: string;
  subscriptions: Set<string>;
}

interface Notification {
  type: string;
  channel: string;
  data: any;
  timestamp: number;
}

export class NotificationWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, Client> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on("connection", (ws: WebSocket) => {
      console.log("[WebSocket] New client connected");

      const client: Client = {
        ws,
        subscriptions: new Set(),
      };

      this.clients.set(ws, client);

      // Send welcome message
      this.sendToClient(ws, {
        type: "connected",
        channel: "system",
        data: { message: "Connected to Live Shopping Network" },
        timestamp: Date.now(),
      });

      ws.on("message", (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error("[WebSocket] Invalid message:", error);
        }
      });

      ws.on("close", () => {
        console.log("[WebSocket] Client disconnected");
        this.clients.delete(ws);
      });

      ws.on("error", (error) => {
        console.error("[WebSocket] Error:", error);
        this.clients.delete(ws);
      });
    });

    console.log("[WebSocket] Server initialized on /ws");
  }

  private handleClientMessage(ws: WebSocket, data: any) {
    const client = this.clients.get(ws);
    if (!client) return;

    switch (data.type) {
      case "auth":
        // Authenticate client
        client.userId = data.userId;
        client.role = data.role;
        this.sendToClient(ws, {
          type: "auth_success",
          channel: "system",
          data: { userId: data.userId, role: data.role },
          timestamp: Date.now(),
        });
        break;

      case "subscribe":
        // Subscribe to channels
        const channels = Array.isArray(data.channels)
          ? data.channels
          : [data.channels];
        channels.forEach((channel: string) => client.subscriptions.add(channel));
        this.sendToClient(ws, {
          type: "subscribed",
          channel: "system",
          data: { channels },
          timestamp: Date.now(),
        });
        break;

      case "unsubscribe":
        // Unsubscribe from channels
        const unsubChannels = Array.isArray(data.channels)
          ? data.channels
          : [data.channels];
        unsubChannels.forEach((channel: string) =>
          client.subscriptions.delete(channel)
        );
        this.sendToClient(ws, {
          type: "unsubscribed",
          channel: "system",
          data: { channels: unsubChannels },
          timestamp: Date.now(),
        });
        break;

      case "ping":
        this.sendToClient(ws, {
          type: "pong",
          channel: "system",
          data: {},
          timestamp: Date.now(),
        });
        break;

      default:
        console.log("[WebSocket] Unknown message type:", data.type);
    }
  }

  private sendToClient(ws: WebSocket, notification: Notification) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(notification));
    }
  }

  /**
   * Broadcast notification to all subscribed clients
   */
  public broadcast(channel: string, type: string, data: any) {
    const notification: Notification = {
      type,
      channel,
      data,
      timestamp: Date.now(),
    };

    this.clients.forEach((client) => {
      if (client.subscriptions.has(channel) || client.subscriptions.has("*")) {
        this.sendToClient(client.ws, notification);
      }
    });
  }

  /**
   * Send notification to specific user
   */
  public sendToUser(userId: string, channel: string, type: string, data: any) {
    const notification: Notification = {
      type,
      channel,
      data,
      timestamp: Date.now(),
    };

    this.clients.forEach((client) => {
      if (client.userId === userId) {
        this.sendToClient(client.ws, notification);
      }
    });
  }

  /**
   * Send notification to users with specific role
   */
  public sendToRole(role: string, channel: string, type: string, data: any) {
    const notification: Notification = {
      type,
      channel,
      data,
      timestamp: Date.now(),
    };

    this.clients.forEach((client) => {
      if (client.role === role && client.subscriptions.has(channel)) {
        this.sendToClient(client.ws, notification);
      }
    });
  }

  /**
   * Get connected clients count
   */
  public getClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get clients subscribed to a channel
   */
  public getChannelSubscribers(channel: string): number {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.subscriptions.has(channel)) {
        count++;
      }
    });
    return count;
  }
}

// Notification helper functions for common events
export function notifyNewOrder(wss: NotificationWebSocketServer, order: any) {
  wss.broadcast("orders", "new_order", {
    orderId: order.id,
    customerName: order.customerName,
    total: order.totalAmount,
    channel: order.channelName,
  });

  // Notify admins and ops
  wss.sendToRole("admin", "admin", "new_order_alert", {
    orderId: order.id,
    total: order.totalAmount,
  });
}

export function notifyLowStock(
  wss: NotificationWebSocketServer,
  product: any
) {
  wss.broadcast("inventory", "low_stock", {
    productId: product.id,
    productName: product.name,
    currentStock: product.quantity,
    threshold: product.reorderPoint,
  });

  wss.sendToRole("admin", "admin", "low_stock_alert", {
    productId: product.id,
    productName: product.name,
    currentStock: product.quantity,
  });
}

export function notifyDispute(wss: NotificationWebSocketServer, dispute: any) {
  wss.broadcast("disputes", "new_dispute", {
    disputeId: dispute.id,
    orderId: dispute.orderId,
    amount: dispute.amount,
    reason: dispute.reason,
  });

  wss.sendToRole("admin", "admin", "dispute_alert", {
    disputeId: dispute.id,
    amount: dispute.amount,
    severity: dispute.severity,
  });
}

export function notifyFulfillmentTask(
  wss: NotificationWebSocketServer,
  task: any
) {
  wss.broadcast("fulfillment", "new_task", {
    taskId: task.id,
    type: task.type,
    orderId: task.orderId,
    priority: task.priority,
  });

  // Notify warehouse staff
  wss.sendToRole("ops", "fulfillment", "task_assigned", {
    taskId: task.id,
    type: task.type,
  });
}

export function notifyLiveSessionStart(
  wss: NotificationWebSocketServer,
  session: any
) {
  wss.broadcast("live", "session_started", {
    sessionId: session.id,
    channelId: session.channelId,
    streamUrl: session.streamUrl,
  });
}

export function notifyPinnedProduct(
  wss: NotificationWebSocketServer,
  pin: any
) {
  wss.broadcast("live", "product_pinned", {
    sessionId: pin.sessionId,
    productId: pin.productId,
    productName: pin.productName,
    price: pin.price,
  });
}

export function notifyOrderStatusUpdate(
  wss: NotificationWebSocketServer,
  order: any
) {
  // Notify customer
  if (order.userId) {
    wss.sendToUser(order.userId, "orders", "status_update", {
      orderId: order.id,
      status: order.status,
      trackingNumber: order.trackingNumber,
    });
  }

  // Broadcast to admins
  wss.sendToRole("admin", "orders", "order_updated", {
    orderId: order.id,
    status: order.status,
  });
}
