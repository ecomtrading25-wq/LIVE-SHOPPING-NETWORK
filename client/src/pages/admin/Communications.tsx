import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  MessageSquare,
  Bell,
  Smartphone,
  Send,
  Users,
  Settings,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
} from "lucide-react";

/**
 * Multi-Channel Communication Hub
 * Unified messaging (email/SMS/push/in-app), preference center, delivery tracking
 */

interface Message {
  id: string;
  title: string;
  channel: "email" | "sms" | "push" | "in_app";
  status: "sent" | "scheduled" | "draft" | "failed";
  recipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  scheduledFor?: string;
  sentAt?: string;
}

interface Template {
  id: string;
  name: string;
  type: "transactional" | "promotional" | "lifecycle";
  channel: string[];
  category: string;
  usage: number;
}

interface ChannelMetrics {
  channel: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export default function CommunicationsPage() {
  const [selectedTab, setSelectedTab] = useState("messages");

  // Mock messages
  const messages: Message[] = [
    {
      id: "MSG-001",
      title: "Flash Sale Alert - 50% Off",
      channel: "email",
      status: "sent",
      recipients: 15420,
      sent: 15420,
      delivered: 15234,
      opened: 7617,
      clicked: 3046,
      bounced: 186,
      complained: 12,
      sentAt: "2025-12-27T14:00:00Z",
    },
    {
      id: "MSG-002",
      title: "Order Shipped Notification",
      channel: "sms",
      status: "sent",
      recipients: 2340,
      sent: 2340,
      delivered: 2338,
      opened: 2338,
      clicked: 890,
      bounced: 2,
      complained: 0,
      sentAt: "2025-12-27T15:30:00Z",
    },
    {
      id: "MSG-003",
      title: "New Product Launch",
      channel: "push",
      status: "scheduled",
      recipients: 8900,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      complained: 0,
      scheduledFor: "2025-12-28T10:00:00Z",
    },
    {
      id: "MSG-004",
      title: "Abandoned Cart Reminder",
      channel: "email",
      status: "sent",
      recipients: 1250,
      sent: 1250,
      delivered: 1235,
      opened: 618,
      clicked: 247,
      bounced: 15,
      complained: 3,
      sentAt: "2025-12-27T12:00:00Z",
    },
    {
      id: "MSG-005",
      title: "Weekly Newsletter",
      channel: "email",
      status: "draft",
      recipients: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      complained: 0,
    },
  ];

  // Mock templates
  const templates: Template[] = [
    {
      id: "TPL-001",
      name: "Order Confirmation",
      type: "transactional",
      channel: ["email", "sms"],
      category: "Orders",
      usage: 8450,
    },
    {
      id: "TPL-002",
      name: "Shipping Update",
      type: "transactional",
      channel: ["email", "sms", "push"],
      category: "Orders",
      usage: 7890,
    },
    {
      id: "TPL-003",
      name: "Welcome Series",
      type: "lifecycle",
      channel: ["email"],
      category: "Onboarding",
      usage: 1250,
    },
    {
      id: "TPL-004",
      name: "Flash Sale Alert",
      type: "promotional",
      channel: ["email", "sms", "push"],
      category: "Marketing",
      usage: 3420,
    },
    {
      id: "TPL-005",
      name: "Abandoned Cart",
      type: "lifecycle",
      channel: ["email", "push"],
      category: "Retention",
      usage: 2100,
    },
  ];

  // Mock channel metrics
  const channelMetrics: ChannelMetrics[] = [
    {
      channel: "Email",
      sent: 45620,
      delivered: 44890,
      opened: 22445,
      clicked: 8978,
      deliveryRate: 98.4,
      openRate: 50.0,
      clickRate: 20.0,
    },
    {
      channel: "SMS",
      sent: 12340,
      delivered: 12298,
      opened: 11890,
      clicked: 4756,
      deliveryRate: 99.7,
      openRate: 96.7,
      clickRate: 38.5,
    },
    {
      channel: "Push",
      sent: 28900,
      delivered: 27456,
      opened: 13728,
      clicked: 5491,
      deliveryRate: 95.0,
      openRate: 50.0,
      clickRate: 19.0,
    },
    {
      channel: "In-App",
      sent: 8900,
      delivered: 8900,
      opened: 7120,
      clicked: 3560,
      deliveryRate: 100.0,
      openRate: 80.0,
      clickRate: 40.0,
    },
  ];

  const totalSent = messages.filter((m) => m.status === "sent").reduce((sum, m) => sum + m.sent, 0);
  const totalDelivered = messages.filter((m) => m.status === "sent").reduce((sum, m) => sum + m.delivered, 0);
  const totalOpened = messages.filter((m) => m.status === "sent").reduce((sum, m) => sum + m.opened, 0);
  const avgDeliveryRate = (totalDelivered / totalSent) * 100;

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "sms":
        return <MessageSquare className="w-4 h-4" />;
      case "push":
        return <Bell className="w-4 h-4" />;
      case "in_app":
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-500/20 text-green-400";
      case "scheduled":
        return "bg-blue-500/20 text-blue-400";
      case "draft":
        return "bg-gray-500/20 text-gray-400";
      case "failed":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "transactional":
        return "bg-blue-500/20 text-blue-400";
      case "promotional":
        return "bg-red-500/20 text-red-400";
      case "lifecycle":
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
          <h1 className="text-3xl font-bold mb-2">Multi-Channel Communications</h1>
          <p className="text-muted-foreground">
            Unified messaging, delivery tracking, and preference management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </Button>
          <Button>
            <Send className="w-4 h-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Sent</p>
            <Send className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{totalSent.toLocaleString()}</p>
          <p className="text-xs text-green-500">+18% from last week</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Delivery Rate</p>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{avgDeliveryRate.toFixed(1)}%</p>
          <p className="text-xs text-green-500">+1.2% from last week</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Open Rate</p>
            <TrendingUp className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{((totalOpened / totalDelivered) * 100).toFixed(1)}%</p>
          <p className="text-xs text-green-500">+3.5% from last week</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Active Templates</p>
            <Mail className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{templates.length}</p>
          <p className="text-xs text-muted-foreground">Across all channels</p>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="messages">
            <Send className="w-4 h-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Mail className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Channel Analytics
          </TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Recent Messages</h2>

            <div className="space-y-4">
              {messages.map((message) => (
                <Card key={message.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        {getChannelIcon(message.channel)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold">{message.title}</h3>
                          <Badge className={getStatusColor(message.status)}>{message.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {message.channel.toUpperCase()} • {message.recipients.toLocaleString()} recipients
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>

                  {message.status === "sent" && (
                    <div className="grid grid-cols-6 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Sent</p>
                        <p className="text-xl font-bold">{message.sent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Delivered</p>
                        <p className="text-xl font-bold text-green-500">{message.delivered.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {((message.delivered / message.sent) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Opened</p>
                        <p className="text-xl font-bold text-blue-500">{message.opened.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {((message.opened / message.delivered) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Clicked</p>
                        <p className="text-xl font-bold text-red-500">{message.clicked.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {((message.clicked / message.opened) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bounced</p>
                        <p className="text-xl font-bold text-red-500">{message.bounced}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Complained</p>
                        <p className="text-xl font-bold text-yellow-500">{message.complained}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
                    {message.sentAt && <span>Sent: {new Date(message.sentAt).toLocaleString()}</span>}
                    {message.scheduledFor && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Scheduled: {new Date(message.scheduledFor).toLocaleString()}
                      </span>
                    )}
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
              <h2 className="text-2xl font-bold">Message Templates</h2>
              <Button>
                <Mail className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold mb-1">{template.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getTypeColor(template.type)}>{template.type}</Badge>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {template.channel.map((ch, index) => (
                      <div key={index} className="flex items-center gap-1 text-sm text-muted-foreground">
                        {getChannelIcon(ch)}
                        <span>{ch}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-sm text-muted-foreground">
                      Used {template.usage.toLocaleString()} times
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button size="sm">Use</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Channel Analytics Tab */}
        <TabsContent value="analytics">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Channel Performance</h2>

            <div className="space-y-4">
              {channelMetrics.map((metric, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        {getChannelIcon(metric.channel.toLowerCase())}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{metric.channel}</h3>
                        <p className="text-sm text-muted-foreground">
                          {metric.sent.toLocaleString()} messages sent
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Delivered</p>
                      <p className="text-2xl font-bold">{metric.delivered.toLocaleString()}</p>
                      <p className="text-xs text-green-500">{metric.deliveryRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Opened</p>
                      <p className="text-2xl font-bold text-blue-500">{metric.opened.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{metric.openRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Clicked</p>
                      <p className="text-2xl font-bold text-red-500">{metric.clicked.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{metric.clickRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Delivery Rate</p>
                      <p className="text-2xl font-bold text-green-500">{metric.deliveryRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Open Rate</p>
                      <p className="text-2xl font-bold text-blue-500">{metric.openRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Click Rate</p>
                      <p className="text-2xl font-bold text-red-500">{metric.clickRate}%</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
