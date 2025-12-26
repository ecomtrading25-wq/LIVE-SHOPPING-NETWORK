import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

interface WebSocketMessage {
  type: string;
  channel: string;
  data: any;
  timestamp: number;
}

interface UseWebSocketOptions {
  url?: string;
  channels?: string[];
  userId?: string;
  role?: string;
  onMessage?: (message: WebSocketMessage) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = `ws://${window.location.host}/ws`,
    channels = [],
    userId,
    role,
    onMessage,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log("[WebSocket] Connected");
        setIsConnected(true);
        setReconnectAttempts(0);

        // Authenticate
        if (userId && role) {
          ws.send(
            JSON.stringify({
              type: "auth",
              userId,
              role,
            })
          );
        }

        // Subscribe to channels
        if (channels.length > 0) {
          ws.send(
            JSON.stringify({
              type: "subscribe",
              channels,
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log("[WebSocket] Message received:", message);

          // Handle system messages
          if (message.channel === "system") {
            if (message.type === "connected") {
              console.log("[WebSocket] Welcome:", message.data.message);
            } else if (message.type === "auth_success") {
              console.log("[WebSocket] Authenticated as:", message.data.role);
            }
          }

          // Call custom message handler
          if (onMessage) {
            onMessage(message);
          }

          // Show toast notifications for important events
          if (message.channel === "orders" && message.type === "new_order") {
            toast.success(
              `New order from ${message.data.customerName} - $${message.data.total}`
            );
          } else if (
            message.channel === "inventory" &&
            message.type === "low_stock"
          ) {
            toast.warning(
              `Low stock alert: ${message.data.productName} (${message.data.currentStock} left)`
            );
          } else if (
            message.channel === "disputes" &&
            message.type === "new_dispute"
          ) {
            toast.error(
              `New dispute: Order #${message.data.orderId} - $${message.data.amount}`
            );
          } else if (
            message.channel === "fulfillment" &&
            message.type === "task_assigned"
          ) {
            toast.info(`New ${message.data.type} task assigned`);
          } else if (
            message.channel === "live" &&
            message.type === "session_started"
          ) {
            toast.success("Live session started!");
          } else if (
            message.channel === "live" &&
            message.type === "product_pinned"
          ) {
            toast.info(`Now showing: ${message.data.productName}`);
          }
        } catch (error) {
          console.error("[WebSocket] Error parsing message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
      };

      ws.onclose = () => {
        console.log("[WebSocket] Disconnected");
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              `[WebSocket] Reconnecting... (${reconnectAttempts + 1}/${maxReconnectAttempts})`
            );
            setReconnectAttempts((prev) => prev + 1);
            connect();
          }, reconnectInterval);
        } else {
          console.error("[WebSocket] Max reconnect attempts reached");
          toast.error("Lost connection to server. Please refresh the page.");
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("[WebSocket] Connection error:", error);
    }
  }, [
    url,
    channels,
    userId,
    role,
    onMessage,
    reconnectInterval,
    maxReconnectAttempts,
    reconnectAttempts,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("[WebSocket] Cannot send message: not connected");
    }
  }, []);

  const subscribe = useCallback(
    (newChannels: string[]) => {
      send({
        type: "subscribe",
        channels: newChannels,
      });
    },
    [send]
  );

  const unsubscribe = useCallback(
    (channelsToRemove: string[]) => {
      send({
        type: "unsubscribe",
        channels: channelsToRemove,
      });
    },
    [send]
  );

  // Connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Ping server every 30 seconds to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      send({ type: "ping" });
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [isConnected, send]);

  return {
    isConnected,
    send,
    subscribe,
    unsubscribe,
    reconnect: connect,
    disconnect,
  };
}

// Hook for admin notifications
export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    // Store notifications for admin dashboard
    if (
      message.channel === "admin" ||
      message.channel === "orders" ||
      message.channel === "inventory" ||
      message.channel === "disputes"
    ) {
      setNotifications((prev) => [message, ...prev].slice(0, 50)); // Keep last 50
    }
  }, []);

  const ws = useWebSocket({
    channels: ["admin", "orders", "inventory", "disputes", "fulfillment"],
    role: "admin",
    onMessage: handleMessage,
  });

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAsRead = useCallback((timestamp: number) => {
    setNotifications((prev) =>
      prev.filter((n) => n.timestamp !== timestamp)
    );
  }, []);

  return {
    ...ws,
    notifications,
    unreadCount: notifications.length,
    clearNotifications,
    markAsRead,
  };
}

// Hook for customer order updates
export function useOrderUpdates(userId: string) {
  const [orderUpdates, setOrderUpdates] = useState<WebSocketMessage[]>([]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.channel === "orders" && message.type === "status_update") {
      setOrderUpdates((prev) => [message, ...prev].slice(0, 10));
    }
  }, []);

  const ws = useWebSocket({
    channels: ["orders"],
    userId,
    role: "user",
    onMessage: handleMessage,
  });

  return {
    ...ws,
    orderUpdates,
  };
}

// Hook for live session updates
export function useLiveSessionUpdates() {
  const [liveUpdates, setLiveUpdates] = useState<WebSocketMessage[]>([]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.channel === "live") {
      setLiveUpdates((prev) => [message, ...prev].slice(0, 20));
    }
  }, []);

  const ws = useWebSocket({
    channels: ["live"],
    onMessage: handleMessage,
  });

  return {
    ...ws,
    liveUpdates,
  };
}
