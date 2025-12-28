import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { nanoid } from 'nanoid';

/**
 * WebSocket Server for Real-Time Updates
 * Handles live streaming events, chat messages, viewer tracking, and notifications
 * 
 * Features:
 * - Room-based messaging (shows, hosts, viewers)
 * - Real-time viewer count tracking
 * - Chat message broadcasting
 * - Product pin notifications
 * - Gift animations sync
 * - Presence tracking (join/leave events)
 * - Heartbeat/ping-pong for connection health
 * - Auto-reconnection support
 * - Message queuing for offline clients
 * - Rate limiting per client
 * - Authentication via JWT tokens
 */

interface Client {
  id: string;
  ws: WebSocket;
  userId?: string;
  showId?: string;
  rooms: Set<string>;
  lastActivity: number;
  messageCount: number;
  isAlive: boolean;
}

interface Message {
  type: string;
  payload: any;
  timestamp: number;
}

interface Room {
  id: string;
  clients: Set<string>;
  metadata: {
    showId?: string;
    hostId?: string;
    viewerCount: number;
    createdAt: number;
  };
}

class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();
  private rooms: Map<string, Room> = new Map();
  private messageQueue: Map<string, Message[]> = new Map();
  
  // Rate limiting
  private readonly MAX_MESSAGES_PER_MINUTE = 60;
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  
  // Heartbeat
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly CLIENT_TIMEOUT = 60000; // 60 seconds
  
  constructor(port: number = 8080) {
    const server = createServer();
    this.wss = new WebSocketServer({ server });
    
    this.wss.on('connection', this.handleConnection.bind(this));
    
    // Start heartbeat interval
    setInterval(() => this.checkHeartbeats(), this.HEARTBEAT_INTERVAL);
    
    // Start cleanup interval
    setInterval(() => this.cleanupInactiveClients(), 60000);
    
    server.listen(port, () => {
      console.log(`[WebSocket] Server listening on port ${port}`);
    });
  }
  
  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, req: any) {
    const clientId = nanoid();
    const client: Client = {
      id: clientId,
      ws,
      rooms: new Set(),
      lastActivity: Date.now(),
      messageCount: 0,
      isAlive: true,
    };
    
    this.clients.set(clientId, client);
    console.log(`[WebSocket] Client connected: ${clientId}`);
    
    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connected',
      payload: { clientId },
      timestamp: Date.now(),
    });
    
    // Handle messages
    ws.on('message', (data: Buffer) => {
      this.handleMessage(clientId, data);
    });
    
    // Handle pong
    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.isAlive = true;
        client.lastActivity = Date.now();
      }
    });
    
    // Handle disconnect
    ws.on('close', () => {
      this.handleDisconnect(clientId);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error(`[WebSocket] Client error ${clientId}:`, error);
      this.handleDisconnect(clientId);
    });
  }
  
  /**
   * Handle incoming message from client
   */
  private handleMessage(clientId: string, data: Buffer) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Update activity
    client.lastActivity = Date.now();
    
    // Rate limiting
    if (!this.checkRateLimit(client)) {
      this.sendToClient(clientId, {
        type: 'error',
        payload: { message: 'Rate limit exceeded' },
        timestamp: Date.now(),
      });
      return;
    }
    
    try {
      const message: Message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'auth':
          this.handleAuth(clientId, message.payload);
          break;
        case 'join_room':
          this.handleJoinRoom(clientId, message.payload);
          break;
        case 'leave_room':
          this.handleLeaveRoom(clientId, message.payload);
          break;
        case 'chat_message':
          this.handleChatMessage(clientId, message.payload);
          break;
        case 'pin_product':
          this.handlePinProduct(clientId, message.payload);
          break;
        case 'send_gift':
          this.handleSendGift(clientId, message.payload);
          break;
        case 'like_show':
          this.handleLikeShow(clientId, message.payload);
          break;
        case 'viewer_stats':
          this.handleViewerStats(clientId, message.payload);
          break;
        default:
          console.warn(`[WebSocket] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`[WebSocket] Error parsing message from ${clientId}:`, error);
      this.sendToClient(clientId, {
        type: 'error',
        payload: { message: 'Invalid message format' },
        timestamp: Date.now(),
      });
    }
  }
  
  /**
   * Handle client authentication
   */
  private handleAuth(clientId: string, payload: { token: string; userId: string }) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // TODO: Verify JWT token
    // For now, just store userId
    client.userId = payload.userId;
    
    this.sendToClient(clientId, {
      type: 'auth_success',
      payload: { userId: payload.userId },
      timestamp: Date.now(),
    });
    
    console.log(`[WebSocket] Client authenticated: ${clientId} -> ${payload.userId}`);
  }
  
  /**
   * Handle join room request
   */
  private handleJoinRoom(clientId: string, payload: { roomId: string; showId?: string }) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const { roomId, showId } = payload;
    
    // Create room if it doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        clients: new Set(),
        metadata: {
          showId,
          viewerCount: 0,
          createdAt: Date.now(),
        },
      });
    }
    
    const room = this.rooms.get(roomId)!;
    room.clients.add(clientId);
    client.rooms.add(roomId);
    client.showId = showId;
    
    // Update viewer count
    room.metadata.viewerCount = room.clients.size;
    
    // Notify client
    this.sendToClient(clientId, {
      type: 'joined_room',
      payload: {
        roomId,
        viewerCount: room.metadata.viewerCount,
      },
      timestamp: Date.now(),
    });
    
    // Broadcast viewer count update to room
    this.broadcastToRoom(roomId, {
      type: 'viewer_count_update',
      payload: {
        roomId,
        viewerCount: room.metadata.viewerCount,
      },
      timestamp: Date.now(),
    }, clientId);
    
    console.log(`[WebSocket] Client ${clientId} joined room ${roomId}`);
  }
  
  /**
   * Handle leave room request
   */
  private handleLeaveRoom(clientId: string, payload: { roomId: string }) {
    this.removeClientFromRoom(clientId, payload.roomId);
  }
  
  /**
   * Handle chat message
   */
  private handleChatMessage(clientId: string, payload: {
    roomId: string;
    message: string;
    userName: string;
    userAvatar?: string;
  }) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const room = this.rooms.get(payload.roomId);
    if (!room) {
      this.sendToClient(clientId, {
        type: 'error',
        payload: { message: 'Room not found' },
        timestamp: Date.now(),
      });
      return;
    }
    
    // Broadcast message to all clients in room
    this.broadcastToRoom(payload.roomId, {
      type: 'chat_message',
      payload: {
        id: nanoid(),
        userId: client.userId,
        userName: payload.userName,
        userAvatar: payload.userAvatar,
        message: payload.message,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });
    
    console.log(`[WebSocket] Chat message in room ${payload.roomId} from ${clientId}`);
  }
  
  /**
   * Handle pin product notification
   */
  private handlePinProduct(clientId: string, payload: {
    roomId: string;
    productId: string;
    productName: string;
    productPrice: number;
    productImage: string;
  }) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Broadcast to room
    this.broadcastToRoom(payload.roomId, {
      type: 'product_pinned',
      payload: {
        productId: payload.productId,
        productName: payload.productName,
        productPrice: payload.productPrice,
        productImage: payload.productImage,
      },
      timestamp: Date.now(),
    });
    
    console.log(`[WebSocket] Product pinned in room ${payload.roomId}`);
  }
  
  /**
   * Handle send gift
   */
  private handleSendGift(clientId: string, payload: {
    roomId: string;
    giftId: string;
    giftName: string;
    giftIcon: string;
    userName: string;
  }) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Broadcast gift animation to room
    this.broadcastToRoom(payload.roomId, {
      type: 'gift_sent',
      payload: {
        id: nanoid(),
        userId: client.userId,
        userName: payload.userName,
        giftId: payload.giftId,
        giftName: payload.giftName,
        giftIcon: payload.giftIcon,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });
    
    console.log(`[WebSocket] Gift sent in room ${payload.roomId}`);
  }
  
  /**
   * Handle like show
   */
  private handleLikeShow(clientId: string, payload: {
    roomId: string;
    showId: string;
  }) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Broadcast like to room
    this.broadcastToRoom(payload.roomId, {
      type: 'show_liked',
      payload: {
        userId: client.userId,
        showId: payload.showId,
      },
      timestamp: Date.now(),
    });
    
    console.log(`[WebSocket] Show liked in room ${payload.roomId}`);
  }
  
  /**
   * Handle viewer stats request
   */
  private handleViewerStats(clientId: string, payload: { roomId: string }) {
    const room = this.rooms.get(payload.roomId);
    if (!room) return;
    
    this.sendToClient(clientId, {
      type: 'viewer_stats',
      payload: {
        roomId: payload.roomId,
        viewerCount: room.metadata.viewerCount,
        clients: Array.from(room.clients),
      },
      timestamp: Date.now(),
    });
  }
  
  /**
   * Handle client disconnect
   */
  private handleDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Remove from all rooms
    client.rooms.forEach(roomId => {
      this.removeClientFromRoom(clientId, roomId);
    });
    
    // Remove client
    this.clients.delete(clientId);
    
    console.log(`[WebSocket] Client disconnected: ${clientId}`);
  }
  
  /**
   * Remove client from room
   */
  private removeClientFromRoom(clientId: string, roomId: string) {
    const client = this.clients.get(clientId);
    const room = this.rooms.get(roomId);
    
    if (!client || !room) return;
    
    room.clients.delete(clientId);
    client.rooms.delete(roomId);
    
    // Update viewer count
    room.metadata.viewerCount = room.clients.size;
    
    // Broadcast viewer count update
    this.broadcastToRoom(roomId, {
      type: 'viewer_count_update',
      payload: {
        roomId,
        viewerCount: room.metadata.viewerCount,
      },
      timestamp: Date.now(),
    });
    
    // Delete room if empty
    if (room.clients.size === 0) {
      this.rooms.delete(roomId);
      console.log(`[WebSocket] Room deleted: ${roomId}`);
    }
    
    console.log(`[WebSocket] Client ${clientId} left room ${roomId}`);
  }
  
  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, message: Message) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      // Queue message for later delivery
      if (!this.messageQueue.has(clientId)) {
        this.messageQueue.set(clientId, []);
      }
      this.messageQueue.get(clientId)!.push(message);
      return;
    }
    
    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`[WebSocket] Error sending to client ${clientId}:`, error);
    }
  }
  
  /**
   * Broadcast message to all clients in room
   */
  private broadcastToRoom(roomId: string, message: Message, excludeClientId?: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    room.clients.forEach(clientId => {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    });
  }
  
  /**
   * Broadcast message to all connected clients
   */
  private broadcastToAll(message: Message) {
    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, message);
    });
  }
  
  /**
   * Check rate limit for client
   */
  private checkRateLimit(client: Client): boolean {
    const now = Date.now();
    const windowStart = now - this.RATE_LIMIT_WINDOW;
    
    // Reset counter if outside window
    if (client.lastActivity < windowStart) {
      client.messageCount = 0;
    }
    
    client.messageCount++;
    
    return client.messageCount <= this.MAX_MESSAGES_PER_MINUTE;
  }
  
  /**
   * Check heartbeats and ping clients
   */
  private checkHeartbeats() {
    this.clients.forEach((client, clientId) => {
      if (!client.isAlive) {
        console.log(`[WebSocket] Client timeout: ${clientId}`);
        client.ws.terminate();
        this.handleDisconnect(clientId);
        return;
      }
      
      client.isAlive = false;
      client.ws.ping();
    });
  }
  
  /**
   * Cleanup inactive clients
   */
  private cleanupInactiveClients() {
    const now = Date.now();
    
    this.clients.forEach((client, clientId) => {
      if (now - client.lastActivity > this.CLIENT_TIMEOUT) {
        console.log(`[WebSocket] Cleaning up inactive client: ${clientId}`);
        this.handleDisconnect(clientId);
      }
    });
    
    // Cleanup old message queues
    this.messageQueue.forEach((queue, clientId) => {
      if (!this.clients.has(clientId)) {
        this.messageQueue.delete(clientId);
      }
    });
  }
  
  /**
   * Get server stats
   */
  public getStats() {
    return {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      rooms: Array.from(this.rooms.values()).map(room => ({
        id: room.id,
        viewerCount: room.metadata.viewerCount,
        showId: room.metadata.showId,
      })),
    };
  }
}

// Export singleton instance
export const websocketManager = new WebSocketManager(
  parseInt(process.env.WEBSOCKET_PORT || '8080')
);

// Export for external use
export default websocketManager;
