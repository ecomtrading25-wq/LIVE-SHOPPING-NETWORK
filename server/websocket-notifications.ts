import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';

interface NotificationClient {
  ws: WebSocket;
  userId?: string;
  role?: string;
  channels: Set<string>;
}

interface Notification {
  id: string;
  type: 'order' | 'inventory' | 'dispute' | 'task' | 'live' | 'system';
  title: string;
  message: string;
  data?: any;
  timestamp: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  channels: string[];
  targetUsers?: string[];
  targetRoles?: string[];
}

class WebSocketNotificationServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, NotificationClient> = new Map();
  private channels: Map<string, Set<string>> = new Map(); // channel -> Set of client IDs

  initialize(server: any) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      const clientId = this.generateClientId();
      const params = parse(request.url || '', true).query;
      
      const client: NotificationClient = {
        ws,
        userId: params.userId as string,
        role: params.role as string,
        channels: new Set(['global']), // All clients subscribe to global by default
      };

      this.clients.set(clientId, client);
      this.subscribeToChannel(clientId, 'global');

      console.log(`[WebSocket] Client connected: ${clientId} (User: ${client.userId}, Role: ${client.role})`);

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'system',
        message: 'Connected to notification server',
        timestamp: Date.now(),
      });

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(clientId, message);
        } catch (error) {
          console.error('[WebSocket] Invalid message format:', error);
        }
      });

      ws.on('close', () => {
        console.log(`[WebSocket] Client disconnected: ${clientId}`);
        this.removeClient(clientId);
      });

      ws.on('error', (error) => {
        console.error(`[WebSocket] Client error (${clientId}):`, error);
        this.removeClient(clientId);
      });

      // Ping/pong for keepalive
      const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(interval);
        }
      }, 30000);
    });

    console.log('[WebSocket] Notification server initialized on /ws');
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleClientMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.action) {
      case 'subscribe':
        if (message.channel) {
          this.subscribeToChannel(clientId, message.channel);
          this.sendToClient(clientId, {
            type: 'system',
            message: `Subscribed to channel: ${message.channel}`,
            timestamp: Date.now(),
          });
        }
        break;

      case 'unsubscribe':
        if (message.channel) {
          this.unsubscribeFromChannel(clientId, message.channel);
          this.sendToClient(clientId, {
            type: 'system',
            message: `Unsubscribed from channel: ${message.channel}`,
            timestamp: Date.now(),
          });
        }
        break;

      case 'ping':
        this.sendToClient(clientId, {
          type: 'system',
          message: 'pong',
          timestamp: Date.now(),
        });
        break;

      default:
        console.log(`[WebSocket] Unknown action from ${clientId}:`, message.action);
    }
  }

  private subscribeToChannel(clientId: string, channel: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.channels.add(channel);

    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(clientId);
  }

  private unsubscribeFromChannel(clientId: string, channel: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.channels.delete(channel);

    const channelClients = this.channels.get(channel);
    if (channelClients) {
      channelClients.delete(clientId);
      if (channelClients.size === 0) {
        this.channels.delete(channel);
      }
    }
  }

  private removeClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all channels
    client.channels.forEach(channel => {
      const channelClients = this.channels.get(channel);
      if (channelClients) {
        channelClients.delete(clientId);
        if (channelClients.size === 0) {
          this.channels.delete(channel);
        }
      }
    });

    this.clients.delete(clientId);
  }

  private sendToClient(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;

    try {
      client.ws.send(JSON.stringify(data));
    } catch (error) {
      console.error(`[WebSocket] Failed to send to ${clientId}:`, error);
    }
  }

  // Public API for sending notifications

  /**
   * Broadcast notification to all connected clients
   */
  broadcastToAll(notification: Omit<Notification, 'id' | 'timestamp' | 'channels'>) {
    const fullNotification: Notification = {
      ...notification,
      id: this.generateNotificationId(),
      timestamp: Date.now(),
      channels: ['global'],
    };

    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, fullNotification);
    });

    console.log(`[WebSocket] Broadcast to all: ${notification.title}`);
  }

  /**
   * Send notification to specific channel(s)
   */
  broadcastToChannels(channels: string[], notification: Omit<Notification, 'id' | 'timestamp' | 'channels'>) {
    const fullNotification: Notification = {
      ...notification,
      id: this.generateNotificationId(),
      timestamp: Date.now(),
      channels,
    };

    const targetClients = new Set<string>();

    channels.forEach(channel => {
      const channelClients = this.channels.get(channel);
      if (channelClients) {
        channelClients.forEach(clientId => targetClients.add(clientId));
      }
    });

    targetClients.forEach(clientId => {
      this.sendToClient(clientId, fullNotification);
    });

    console.log(`[WebSocket] Broadcast to channels [${channels.join(', ')}]: ${notification.title}`);
  }

  /**
   * Send notification to specific user(s)
   */
  sendToUsers(userIds: string[], notification: Omit<Notification, 'id' | 'timestamp' | 'channels' | 'targetUsers'>) {
    const fullNotification: Notification = {
      ...notification,
      id: this.generateNotificationId(),
      timestamp: Date.now(),
      channels: [],
      targetUsers: userIds,
    };

    this.clients.forEach((client, clientId) => {
      if (client.userId && userIds.includes(client.userId)) {
        this.sendToClient(clientId, fullNotification);
      }
    });

    console.log(`[WebSocket] Sent to users [${userIds.join(', ')}]: ${notification.title}`);
  }

  /**
   * Send notification to users with specific role(s)
   */
  sendToRoles(roles: string[], notification: Omit<Notification, 'id' | 'timestamp' | 'channels' | 'targetRoles'>) {
    const fullNotification: Notification = {
      ...notification,
      id: this.generateNotificationId(),
      timestamp: Date.now(),
      channels: [],
      targetRoles: roles,
    };

    this.clients.forEach((client, clientId) => {
      if (client.role && roles.includes(client.role)) {
        this.sendToClient(clientId, fullNotification);
      }
    });

    console.log(`[WebSocket] Sent to roles [${roles.join(', ')}]: ${notification.title}`);
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Helper methods for common notification types

  /**
   * Notify about new order
   */
  notifyNewOrder(orderId: string, orderTotal: number, customerName: string) {
    this.sendToRoles(['admin', 'ops'], {
      type: 'order',
      title: 'New Order Received',
      message: `Order #${orderId} from ${customerName} - $${orderTotal.toFixed(2)}`,
      data: { orderId, orderTotal, customerName },
      priority: 'high',
    });
  }

  /**
   * Notify about low stock
   */
  notifyLowStock(productId: string, productName: string, currentStock: number, threshold: number) {
    this.sendToRoles(['admin', 'ops'], {
      type: 'inventory',
      title: 'Low Stock Alert',
      message: `${productName} is running low (${currentStock} left, threshold: ${threshold})`,
      data: { productId, productName, currentStock, threshold },
      priority: 'medium',
    });
  }

  /**
   * Notify about new dispute
   */
  notifyNewDispute(disputeId: string, orderId: string, reason: string) {
    this.sendToRoles(['admin', 'ops'], {
      type: 'dispute',
      title: 'New Dispute Filed',
      message: `Dispute #${disputeId} for Order #${orderId}: ${reason}`,
      data: { disputeId, orderId, reason },
      priority: 'critical',
    });
  }

  /**
   * Notify about new fulfillment task
   */
  notifyNewTask(taskId: string, taskType: string, assignedTo?: string) {
    const targetUsers = assignedTo ? [assignedTo] : [];
    
    if (targetUsers.length > 0) {
      this.sendToUsers(targetUsers, {
        type: 'task',
        title: 'New Task Assigned',
        message: `You have been assigned a new ${taskType} task`,
        data: { taskId, taskType },
        priority: 'high',
      });
    } else {
      this.sendToRoles(['ops'], {
        type: 'task',
        title: 'New Task Available',
        message: `New ${taskType} task needs assignment`,
        data: { taskId, taskType },
        priority: 'medium',
      });
    }
  }

  /**
   * Notify about live session starting
   */
  notifyLiveSessionStart(sessionId: string, title: string, creatorName: string) {
    this.broadcastToChannels(['live', 'global'], {
      type: 'live',
      title: 'Live Show Starting!',
      message: `${creatorName} is going live: ${title}`,
      data: { sessionId, title, creatorName },
      priority: 'high',
    });
  }

  /**
   * Notify about live session ending
   */
  notifyLiveSessionEnd(sessionId: string, title: string) {
    this.broadcastToChannels(['live'], {
      type: 'live',
      title: 'Live Show Ended',
      message: `${title} has ended. Thanks for watching!`,
      data: { sessionId, title },
      priority: 'low',
    });
  }

  /**
   * Notify about product pinned in live session
   */
  notifyProductPinned(sessionId: string, productId: string, productName: string, price: number) {
    this.broadcastToChannels(['live'], {
      type: 'live',
      title: 'Featured Product',
      message: `Now showing: ${productName} - $${price.toFixed(2)}`,
      data: { sessionId, productId, productName, price },
      priority: 'medium',
    });
  }

  /**
   * Notify user about order status change
   */
  notifyOrderStatusChange(userId: string, orderId: string, status: string) {
    this.sendToUsers([userId], {
      type: 'order',
      title: 'Order Update',
      message: `Your order #${orderId} is now ${status}`,
      data: { orderId, status },
      priority: 'medium',
    });
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalClients: this.clients.size,
      totalChannels: this.channels.size,
      channels: Array.from(this.channels.entries()).map(([channel, clients]) => ({
        channel,
        subscribers: clients.size,
      })),
      clientsByRole: this.getClientsByRole(),
    };
  }

  private getClientsByRole() {
    const roleCount: Record<string, number> = {};
    this.clients.forEach(client => {
      if (client.role) {
        roleCount[client.role] = (roleCount[client.role] || 0) + 1;
      }
    });
    return roleCount;
  }
}

// Singleton instance
export const wsNotificationServer = new WebSocketNotificationServer();
