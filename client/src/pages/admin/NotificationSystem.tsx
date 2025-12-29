import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Send,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Filter,
  Plus,
  Eye,
} from "lucide-react";

/**
 * Real-Time Notification System
 * WebSocket push notifications, order updates, price alerts, back-in-stock notifications
 */

interface Notification {
  id: string;
  type: "order" | "price_drop" | "back_in_stock" | "live_show" | "promotion";
  title: string;
  message: string;
  recipients: number;
  sent: number;
  opened: number;
  clicked: number;
  status: "draft" | "scheduled" | "sending" | "sent";
  scheduledTime?: string;
  sentTime?: string;
  channels: ("push" | "email" | "sms")[];
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  usageCount: number;
}

export default function NotificationSystemPage() {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Mock notifications
  const notifications: Notification[] = [
    {
      id: "NOTIF-001",
      type: "live_show",
      title: "Live Show Starting Now!",
      message: "Join our Holiday Gift Guide live shopping event with exclusive deals!",
      recipients: 12450,
      sent: 12450,
      opened: 8920,
      clicked: 3456,
      status: "sent",
      sentTime: "2025-12-27T20:00:00Z",
      channels: ["push", "email"],
    },
    {
      id: "NOTIF-002",
      type: "price_drop",
      title: "Price Drop Alert: Wireless Headphones Pro",
      message: "Your wishlist item is now 20% off! Limited time offer.",
      recipients: 2340,
      sent: 2340,
      opened: 1890,
      clicked: 892,
      status: "sent",
      sentTime: "2025-12-27T18:00:00Z",
      channels: ["push", "email", "sms"],
    },
    {
      id: "NOTIF-003",
      type: "back_in_stock",
      title: "Back in Stock: Smart Watch Ultra",
      message: "The item you were waiting for is back! Order now before it sells out again.",
      recipients: 890,
      sent: 890,
      opened: 678,
      clicked: 456,
      status: "sent",
      sentTime: "2025-12-27T16:00:00Z",
      channels: ["push", "email"],
    },
    {
      id: "NOTIF-004",
      type: "promotion",
      title: "New Year Sale Preview",
      message: "Get early access to our biggest sale of the year! 50% off selected items.",
      recipients: 12450,
      sent: 0,
      opened: 0,
      clicked: 0,
      status: "scheduled",
      scheduledTime: "2025-12-31T00:00:00Z",
      channels: ["push", "email", "sms"],
    },
  ];

  // Mock templates
  const templates: NotificationTemplate[] = [
    {
      id: "TPL-001",
      name: "Order Shipped",
      type: "order",
      subject: "Your order #{order_id} has shipped!",
      body: "Great news! Your order is on its way. Track your package: {tracking_url}",
      usageCount: 2340,
    },
    {
      id: "TPL-002",
      name: "Price Drop Alert",
      type: "price_drop",
      subject: "Price Drop: {product_name}",
      body: "The item on your wishlist is now {discount}% off! Original: ${original_price}, Now: ${new_price}",
      usageCount: 890,
    },
    {
      id: "TPL-003",
      name: "Back in Stock",
      type: "back_in_stock",
      subject: "{product_name} is back in stock!",
      body: "The item you were waiting for is available again. Order now: {product_url}",
      usageCount: 567,
    },
  ];

  // Mock stats
  const stats = {
    totalSent: 45680,
    totalOpened: 32890,
    totalClicked: 12450,
    activeSubscribers: 12450,
    openRate: 72.0,
    clickRate: 27.3,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-500/20 text-green-400";
      case "sending":
        return "bg-blue-500/20 text-blue-400";
      case "scheduled":
        return "bg-yellow-500/20 text-yellow-400";
      case "draft":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "order":
        return "bg-blue-500/20 text-blue-400";
      case "price_drop":
        return "bg-green-500/20 text-green-400";
      case "back_in_stock":
        return "bg-red-500/20 text-red-400";
      case "live_show":
        return "bg-red-500/20 text-red-400";
      case "promotion":
        return "bg-orange-500/20 text-orange-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Real-Time Notification System</h1>
          <p className="text-muted-foreground">
            Manage push notifications, email alerts, and SMS campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Notification
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Sent</p>
            <Send className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.totalSent.toLocaleString()}</p>
          <p className="text-xs text-green-500">+18.2% from last month</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Opened</p>
            <Eye className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.totalOpened.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{stats.openRate}% open rate</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Clicked</p>
            <TrendingUp className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.totalClicked.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{stats.clickRate}% click rate</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Active Subscribers</p>
            <Users className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.activeSubscribers.toLocaleString()}</p>
          <p className="text-xs text-green-500">+234 this week</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Open Rate</p>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.openRate}%</p>
          <p className="text-xs text-green-500">+2.3% improvement</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Click Rate</p>
            <TrendingUp className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.clickRate}%</p>
          <p className="text-xs text-green-500">+1.8% improvement</p>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <Bell className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Send className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Clock className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="subscribers">
            <Users className="w-4 h-4 mr-2" />
            Subscribers
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Notification Performance</h2>
              <div className="space-y-4">
                {[
                  { type: "Live Show", sent: 12450, opened: 8920, rate: 71.6 },
                  { type: "Price Drop", sent: 2340, opened: 1890, rate: 80.8 },
                  { type: "Back in Stock", sent: 890, opened: 678, rate: 76.2 },
                  { type: "Order Updates", sent: 5680, opened: 4120, rate: 72.5 },
                ].map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.type}</span>
                      <span className="font-bold">
                        {item.opened.toLocaleString()} / {item.sent.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.rate}% open rate</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Channel Performance</h2>
              <div className="space-y-4">
                {[
                  { channel: "Push Notifications", sent: 32450, opened: 24890, rate: 76.7 },
                  { channel: "Email", sent: 28900, opened: 20340, rate: 70.4 },
                  { channel: "SMS", sent: 8920, opened: 7120, rate: 79.8 },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.channel}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.sent.toLocaleString()} sent
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{item.rate}%</p>
                      <p className="text-xs text-muted-foreground">open rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="p-6">
            <div className="space-y-4">
              {notifications.map((notif) => (
                <Card key={notif.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold">{notif.title}</h3>
                        <Badge className={getTypeColor(notif.type)}>
                          {notif.type.replace("_", " ")}
                        </Badge>
                        <Badge className={getStatusColor(notif.status)}>{notif.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{notif.message}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Recipients: {notif.recipients.toLocaleString()}</span>
                        {notif.sent > 0 && (
                          <>
                            <span>•</span>
                            <span>Sent: {notif.sent.toLocaleString()}</span>
                            <span>•</span>
                            <span>Opened: {notif.opened.toLocaleString()} ({((notif.opened / notif.sent) * 100).toFixed(1)}%)</span>
                            <span>•</span>
                            <span>Clicked: {notif.clicked.toLocaleString()} ({((notif.clicked / notif.sent) * 100).toFixed(1)}%)</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {notif.channels.map((channel, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      {notif.sentTime && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Sent: {new Date(notif.sentTime).toLocaleString()}
                        </p>
                      )}
                      {notif.scheduledTime && (
                        <p className="text-sm text-yellow-500 mb-2">
                          Scheduled: {new Date(notif.scheduledTime).toLocaleString()}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {notif.status === "draft" && (
                          <Button size="sm">
                            <Send className="w-4 h-4 mr-2" />
                            Send
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Notification Templates</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </div>

            <div className="space-y-4">
              {templates.map((template) => (
                <Card key={template.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold">{template.name}</h3>
                        <Badge className={getTypeColor(template.type)}>{template.type}</Badge>
                      </div>
                      <p className="text-sm font-medium mb-1">Subject: {template.subject}</p>
                      <p className="text-sm text-muted-foreground mb-2">{template.body}</p>
                      <p className="text-xs text-muted-foreground">
                        Used {template.usageCount.toLocaleString()} times
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        Use
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Subscribers Tab */}
        <TabsContent value="subscribers">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Subscriber Management</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-4">
                <h3 className="font-bold mb-4">Push Notifications</h3>
                <p className="text-3xl font-bold mb-2">10,890</p>
                <p className="text-sm text-muted-foreground">Active subscribers</p>
                <div className="mt-4">
                  <p className="text-xs text-green-500">+234 this week</p>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-bold mb-4">Email</h3>
                <p className="text-3xl font-bold mb-2">12,340</p>
                <p className="text-sm text-muted-foreground">Active subscribers</p>
                <div className="mt-4">
                  <p className="text-xs text-green-500">+189 this week</p>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-bold mb-4">SMS</h3>
                <p className="text-3xl font-bold mb-2">5,670</p>
                <p className="text-sm text-muted-foreground">Active subscribers</p>
                <div className="mt-4">
                  <p className="text-xs text-green-500">+67 this week</p>
                </div>
              </Card>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
