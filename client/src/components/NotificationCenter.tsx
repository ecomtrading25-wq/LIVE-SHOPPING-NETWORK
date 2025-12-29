import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  Package,
  AlertTriangle,
  DollarSign,
  TrendingDown,
  CheckCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Notification Center
 * Real-time alerts for orders, disputes, inventory, and tasks
 */

type NotificationType = "order" | "dispute" | "inventory" | "task" | "payment";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  
  const { data: notificationsData, refetch } = trpc.notifications.list.useQuery(
    { limit: 20 },
    { refetchInterval: 30000 } // Poll every 30 seconds
  );

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success("All notifications marked as read");
      refetch();
    },
  });

  const deleteNotificationMutation = trpc.notifications.delete?.useMutation?.({
    onSuccess: () => {
      refetch();
    },
  });

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "order":
        return <Package className="w-5 h-5 text-blue-400" />;
      case "dispute":
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case "inventory":
        return <TrendingDown className="w-5 h-5 text-yellow-400" />;
      case "task":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "payment":
        return <DollarSign className="w-5 h-5 text-purple-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate({ notificationId: notification.id });
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotificationMutation.mutate({ id });
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-600 text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-background border-border text-foreground" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <p className="text-sm text-gray-400">
              {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {notifications && notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-border cursor-pointer hover:bg-card/50 transition-colors ${
                  !notification.read ? "bg-card/30" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground text-sm">
                        {notification.title}
                      </p>
                      <button
                        onClick={(e) => handleDelete(notification.id, e)}
                        className="text-gray-400 hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No notifications</p>
            </div>
          )}
        </div>

        {notifications && notifications.length > 0 && (
          <div className="p-3 border-t border-border text-center">
            <Button variant="ghost" size="sm" className="text-xs">
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
