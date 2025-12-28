/**
 * WebSocket Real-Time Communication System
 * Handles live updates for inventory, orders, chat, and notifications
 */

import { create } from 'zustand';

// WebSocket Message Types
export type WSMessageType =
  | 'inventory_update'
  | 'order_status_change'
  | 'new_order'
  | 'chat_message'
  | 'notification'
  | 'live_stream_update'
  | 'price_change'
  | 'user_online'
  | 'user_offline'
  | 'typing_indicator'
  | 'wishlist_update'
  | 'review_posted'
  | 'loyalty_points_update';

export interface WSMessage {
  type: WSMessageType;
  payload: any;
  timestamp: number;
  userId?: string;
}

export interface InventoryUpdate {
  productId: string;
  stockLevel: number;
  available: boolean;
  lastUpdated: Date;
}

export interface OrderStatusUpdate {
  orderId: string;
  status: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  message: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: Date;
  roomId: string;
  type: 'text' | 'image' | 'product' | 'system';
  metadata?: any;
}

export interface NotificationMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  timestamp: Date;
}

export interface LiveStreamUpdate {
  streamId: string;
  status: 'live' | 'ended' | 'scheduled';
  viewerCount: number;
  currentProduct?: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  hostMessage?: string;
}

export interface PriceChangeUpdate {
  productId: string;
  oldPrice: number;
  newPrice: number;
  discount: number;
  expiresAt?: Date;
}

export interface UserPresence {
  userId: string;
  userName: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  roomId: string;
  isTyping: boolean;
}

// WebSocket Store
interface WebSocketStore {
  socket: WebSocket | null;
  connected: boolean;
  reconnecting: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  
  // Data stores
  inventoryUpdates: Map<string, InventoryUpdate>;
  orderUpdates: Map<string, OrderStatusUpdate>;
  chatMessages: Map<string, ChatMessage[]>;
  notifications: NotificationMessage[];
  liveStreams: Map<string, LiveStreamUpdate>;
  priceChanges: Map<string, PriceChangeUpdate>;
  userPresence: Map<string, UserPresence>;
  typingIndicators: Map<string, TypingIndicator[]>;
  
  // Subscriptions
  subscribedRooms: Set<string>;
  subscribedProducts: Set<string>;
  subscribedOrders: Set<string>;
  
  // Actions
  connect: (userId: string, token: string) => void;
  disconnect: () => void;
  send: (message: WSMessage) => void;
  subscribe: (type: 'room' | 'product' | 'order', id: string) => void;
  unsubscribe: (type: 'room' | 'product' | 'order', id: string) => void;
  clearNotifications: () => void;
  markNotificationRead: (id: string) => void;
}

export const useWebSocket = create<WebSocketStore>((set, get) => ({
  socket: null,
  connected: false,
  reconnecting: false,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectDelay: 3000,
  
  inventoryUpdates: new Map(),
  orderUpdates: new Map(),
  chatMessages: new Map(),
  notifications: [],
  liveStreams: new Map(),
  priceChanges: new Map(),
  userPresence: new Map(),
  typingIndicators: new Map(),
  
  subscribedRooms: new Set(),
  subscribedProducts: new Set(),
  subscribedOrders: new Set(),
  
  connect: (userId: string, token: string) => {
    const { socket, connected, reconnecting } = get();
    
    // Don't reconnect if already connected or reconnecting
    if (connected || reconnecting) return;
    
    set({ reconnecting: true });
    
    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}&token=${token}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        set({
          socket: ws,
          connected: true,
          reconnecting: false,
          reconnectAttempts: 0,
        });
        
        // Resubscribe to rooms/products/orders
        const { subscribedRooms, subscribedProducts, subscribedOrders } = get();
        
        subscribedRooms.forEach((roomId) => {
          ws.send(JSON.stringify({
            type: 'subscribe',
            payload: { type: 'room', id: roomId },
          }));
        });
        
        subscribedProducts.forEach((productId) => {
          ws.send(JSON.stringify({
            type: 'subscribe',
            payload: { type: 'product', id: productId },
          }));
        });
        
        subscribedOrders.forEach((orderId) => {
          ws.send(JSON.stringify({
            type: 'subscribe',
            payload: { type: 'order', id: orderId },
          }));
        });
      };
      
      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          handleMessage(message, set, get);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };
      
      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        set({ connected: false, socket: null });
        
        // Attempt reconnection
        const { reconnectAttempts, maxReconnectAttempts, reconnectDelay } = get();
        
        if (reconnectAttempts < maxReconnectAttempts) {
          console.log(`[WebSocket] Reconnecting in ${reconnectDelay}ms... (Attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          setTimeout(() => {
            set({ reconnectAttempts: reconnectAttempts + 1 });
            get().connect(userId, token);
          }, reconnectDelay);
        } else {
          console.error('[WebSocket] Max reconnection attempts reached');
          set({ reconnecting: false });
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      set({ reconnecting: false });
    }
  },
  
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
      set({
        socket: null,
        connected: false,
        reconnecting: false,
        reconnectAttempts: 0,
      });
    }
  },
  
  send: (message: WSMessage) => {
    const { socket, connected } = get();
    if (socket && connected) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message: not connected');
    }
  },
  
  subscribe: (type: 'room' | 'product' | 'order', id: string) => {
    const { socket, connected } = get();
    
    if (type === 'room') {
      set((state) => ({
        subscribedRooms: new Set([...state.subscribedRooms, id]),
      }));
    } else if (type === 'product') {
      set((state) => ({
        subscribedProducts: new Set([...state.subscribedProducts, id]),
      }));
    } else if (type === 'order') {
      set((state) => ({
        subscribedOrders: new Set([...state.subscribedOrders, id]),
      }));
    }
    
    if (socket && connected) {
      socket.send(JSON.stringify({
        type: 'subscribe',
        payload: { type, id },
      }));
    }
  },
  
  unsubscribe: (type: 'room' | 'product' | 'order', id: string) => {
    const { socket, connected } = get();
    
    if (type === 'room') {
      set((state) => {
        const newSet = new Set(state.subscribedRooms);
        newSet.delete(id);
        return { subscribedRooms: newSet };
      });
    } else if (type === 'product') {
      set((state) => {
        const newSet = new Set(state.subscribedProducts);
        newSet.delete(id);
        return { subscribedProducts: newSet };
      });
    } else if (type === 'order') {
      set((state) => {
        const newSet = new Set(state.subscribedOrders);
        newSet.delete(id);
        return { subscribedOrders: newSet };
      });
    }
    
    if (socket && connected) {
      socket.send(JSON.stringify({
        type: 'unsubscribe',
        payload: { type, id },
      }));
    }
  },
  
  clearNotifications: () => {
    set({ notifications: [] });
  },
  
  markNotificationRead: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));

// Message Handler
function handleMessage(
  message: WSMessage,
  set: any,
  get: () => WebSocketStore
) {
  const { type, payload } = message;
  
  switch (type) {
    case 'inventory_update':
      handleInventoryUpdate(payload, set, get);
      break;
      
    case 'order_status_change':
      handleOrderStatusChange(payload, set, get);
      break;
      
    case 'new_order':
      handleNewOrder(payload, set, get);
      break;
      
    case 'chat_message':
      handleChatMessage(payload, set, get);
      break;
      
    case 'notification':
      handleNotification(payload, set, get);
      break;
      
    case 'live_stream_update':
      handleLiveStreamUpdate(payload, set, get);
      break;
      
    case 'price_change':
      handlePriceChange(payload, set, get);
      break;
      
    case 'user_online':
    case 'user_offline':
      handleUserPresence(payload, set, get);
      break;
      
    case 'typing_indicator':
      handleTypingIndicator(payload, set, get);
      break;
      
    case 'wishlist_update':
      handleWishlistUpdate(payload, set, get);
      break;
      
    case 'review_posted':
      handleReviewPosted(payload, set, get);
      break;
      
    case 'loyalty_points_update':
      handleLoyaltyPointsUpdate(payload, set, get);
      break;
      
    default:
      console.warn('[WebSocket] Unknown message type:', type);
  }
}

// Individual Message Handlers
function handleInventoryUpdate(
  payload: InventoryUpdate,
  set: any,
  get: () => WebSocketStore
) {
  set((state: WebSocketStore) => {
    const newMap = new Map(state.inventoryUpdates);
    newMap.set(payload.productId, payload);
    return { inventoryUpdates: newMap };
  });
  
  // Trigger browser notification if product is out of stock
  if (!payload.available && 'Notification' in window && Notification.permission === 'granted') {
    new Notification('Product Out of Stock', {
      body: `A product you're watching is now out of stock`,
      icon: '/icon-192.png',
    });
  }
}

function handleOrderStatusChange(
  payload: OrderStatusUpdate,
  set: any,
  get: () => WebSocketStore
) {
  set((state: WebSocketStore) => {
    const newMap = new Map(state.orderUpdates);
    newMap.set(payload.orderId, payload);
    return { orderUpdates: newMap };
  });
  
  // Add notification
  const notification: NotificationMessage = {
    id: `order-${payload.orderId}-${Date.now()}`,
    type: 'info',
    title: 'Order Update',
    message: payload.message,
    actionUrl: `/orders/${payload.orderId}`,
    actionLabel: 'View Order',
    timestamp: new Date(),
  };
  
  set((state: WebSocketStore) => ({
    notifications: [notification, ...state.notifications].slice(0, 50), // Keep last 50
  }));
}

function handleNewOrder(
  payload: any,
  set: any,
  get: () => WebSocketStore
) {
  const notification: NotificationMessage = {
    id: `new-order-${payload.orderId}-${Date.now()}`,
    type: 'success',
    title: 'New Order',
    message: `Order #${payload.orderNumber} received - ${payload.itemCount} items`,
    actionUrl: `/admin/orders/${payload.orderId}`,
    actionLabel: 'View Order',
    timestamp: new Date(),
  };
  
  set((state: WebSocketStore) => ({
    notifications: [notification, ...state.notifications].slice(0, 50),
  }));
  
  // Play sound notification
  if ('Audio' in window) {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  }
}

function handleChatMessage(
  payload: ChatMessage,
  set: any,
  get: () => WebSocketStore
) {
  set((state: WebSocketStore) => {
    const newMap = new Map(state.chatMessages);
    const roomMessages = newMap.get(payload.roomId) || [];
    newMap.set(payload.roomId, [...roomMessages, payload]);
    return { chatMessages: newMap };
  });
}

function handleNotification(
  payload: NotificationMessage,
  set: any,
  get: () => WebSocketStore
) {
  set((state: WebSocketStore) => ({
    notifications: [payload, ...state.notifications].slice(0, 50),
  }));
  
  // Browser notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(payload.title, {
      body: payload.message,
      icon: '/icon-192.png',
    });
  }
}

function handleLiveStreamUpdate(
  payload: LiveStreamUpdate,
  set: any,
  get: () => WebSocketStore
) {
  set((state: WebSocketStore) => {
    const newMap = new Map(state.liveStreams);
    newMap.set(payload.streamId, payload);
    return { liveStreams: newMap };
  });
}

function handlePriceChange(
  payload: PriceChangeUpdate,
  set: any,
  get: () => WebSocketStore
) {
  set((state: WebSocketStore) => {
    const newMap = new Map(state.priceChanges);
    newMap.set(payload.productId, payload);
    return { priceChanges: newMap };
  });
  
  // Notify if price dropped
  if (payload.newPrice < payload.oldPrice) {
    const notification: NotificationMessage = {
      id: `price-drop-${payload.productId}-${Date.now()}`,
      type: 'success',
      title: 'Price Drop Alert!',
      message: `Price dropped by ${payload.discount}%`,
      actionUrl: `/products/${payload.productId}`,
      actionLabel: 'View Product',
      timestamp: new Date(),
    };
    
    set((state: WebSocketStore) => ({
      notifications: [notification, ...state.notifications].slice(0, 50),
    }));
  }
}

function handleUserPresence(
  payload: UserPresence,
  set: any,
  get: () => WebSocketStore
) {
  set((state: WebSocketStore) => {
    const newMap = new Map(state.userPresence);
    newMap.set(payload.userId, payload);
    return { userPresence: newMap };
  });
}

function handleTypingIndicator(
  payload: TypingIndicator,
  set: any,
  get: () => WebSocketStore
) {
  set((state: WebSocketStore) => {
    const newMap = new Map(state.typingIndicators);
    const roomIndicators = newMap.get(payload.roomId) || [];
    
    if (payload.isTyping) {
      // Add or update typing indicator
      const filtered = roomIndicators.filter((i) => i.userId !== payload.userId);
      newMap.set(payload.roomId, [...filtered, payload]);
    } else {
      // Remove typing indicator
      newMap.set(
        payload.roomId,
        roomIndicators.filter((i) => i.userId !== payload.userId)
      );
    }
    
    return { typingIndicators: newMap };
  });
}

function handleWishlistUpdate(
  payload: any,
  set: any,
  get: () => WebSocketStore
) {
  const notification: NotificationMessage = {
    id: `wishlist-${payload.productId}-${Date.now()}`,
    type: 'info',
    title: 'Wishlist Update',
    message: payload.message,
    actionUrl: `/wishlist`,
    actionLabel: 'View Wishlist',
    timestamp: new Date(),
  };
  
  set((state: WebSocketStore) => ({
    notifications: [notification, ...state.notifications].slice(0, 50),
  }));
}

function handleReviewPosted(
  payload: any,
  set: any,
  get: () => WebSocketStore
) {
  const notification: NotificationMessage = {
    id: `review-${payload.productId}-${Date.now()}`,
    type: 'info',
    title: 'New Review',
    message: `New review posted for ${payload.productName}`,
    actionUrl: `/products/${payload.productId}/reviews`,
    actionLabel: 'View Reviews',
    timestamp: new Date(),
  };
  
  set((state: WebSocketStore) => ({
    notifications: [notification, ...state.notifications].slice(0, 50),
  }));
}

function handleLoyaltyPointsUpdate(
  payload: any,
  set: any,
  get: () => WebSocketStore
) {
  const notification: NotificationMessage = {
    id: `loyalty-${Date.now()}`,
    type: 'success',
    title: 'Points Earned!',
    message: `You earned ${payload.points} loyalty points`,
    actionUrl: `/loyalty`,
    actionLabel: 'View Rewards',
    timestamp: new Date(),
  };
  
  set((state: WebSocketStore) => ({
    notifications: [notification, ...state.notifications].slice(0, 50),
  }));
}

// Utility Hooks
export function useInventoryUpdate(productId: string) {
  const subscribe = useWebSocket((state) => state.subscribe);
  const unsubscribe = useWebSocket((state) => state.unsubscribe);
  const update = useWebSocket((state) => state.inventoryUpdates.get(productId));
  
  // Subscribe on mount
  if (typeof window !== 'undefined') {
    subscribe('product', productId);
  }
  
  return update;
}

export function useOrderUpdates(orderId: string) {
  const subscribe = useWebSocket((state) => state.subscribe);
  const unsubscribe = useWebSocket((state) => state.unsubscribe);
  const update = useWebSocket((state) => state.orderUpdates.get(orderId));
  
  // Subscribe on mount
  if (typeof window !== 'undefined') {
    subscribe('order', orderId);
  }
  
  return update;
}

export function useChatRoom(roomId: string) {
  const subscribe = useWebSocket((state) => state.subscribe);
  const unsubscribe = useWebSocket((state) => state.unsubscribe);
  const messages = useWebSocket((state) => state.chatMessages.get(roomId) || []);
  const send = useWebSocket((state) => state.send);
  const typingIndicators = useWebSocket((state) => state.typingIndicators.get(roomId) || []);
  
  // Subscribe on mount
  if (typeof window !== 'undefined') {
    subscribe('room', roomId);
  }
  
  const sendMessage = (message: string) => {
    send({
      type: 'chat_message',
      payload: {
        roomId,
        message,
      },
      timestamp: Date.now(),
    });
  };
  
  const setTyping = (isTyping: boolean) => {
    send({
      type: 'typing_indicator',
      payload: {
        roomId,
        isTyping,
      },
      timestamp: Date.now(),
    });
  };
  
  return {
    messages,
    sendMessage,
    setTyping,
    typingIndicators,
  };
}

export function useLiveStreamUpdates(streamId: string) {
  const subscribe = useWebSocket((state) => state.subscribe);
  const stream = useWebSocket((state) => state.liveStreams.get(streamId));
  
  // Subscribe on mount
  if (typeof window !== 'undefined') {
    subscribe('room', `stream-${streamId}`);
  }
  
  return stream;
}

export function useNotifications() {
  const notifications = useWebSocket((state) => state.notifications);
  const clearNotifications = useWebSocket((state) => state.clearNotifications);
  const markNotificationRead = useWebSocket((state) => state.markNotificationRead);
  
  return {
    notifications,
    clearNotifications,
    markNotificationRead,
  };
}

// Request notification permission
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
