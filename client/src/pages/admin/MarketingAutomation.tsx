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
  Zap,
  TrendingUp,
  Users,
  Target,
  Play,
  Pause,
  Copy,
  Edit,
  Trash2,
  BarChart3,
  Clock,
  CheckCircle,
} from "lucide-react";

/**
 * Marketing Automation Hub
 * Email/SMS campaigns, trigger-based automation, A/B testing, conversion tracking
 */

interface Campaign {
  id: string;
  name: string;
  type: "email" | "sms" | "push";
  status: "draft" | "active" | "paused" | "completed";
  trigger: string;
  audience: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue: number;
  createdAt: string;
  lastRun?: string;
}

interface ABTest {
  id: string;
  campaignId: string;
  name: string;
  variants: ABVariant[];
  status: "running" | "completed";
  winner?: string;
  startDate: string;
  endDate?: string;
}

interface ABVariant {
  id: string;
  name: string;
  subject: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
}

interface Workflow {
  id: string;
  name: string;
  trigger: string;
  steps: number;
  active: boolean;
  totalRuns: number;
  completionRate: number;
}

export default function MarketingAutomationPage() {
  const [selectedTab, setSelectedTab] = useState("campaigns");

  // Mock campaigns
  const campaigns: Campaign[] = [
    {
      id: "CMP-001",
      name: "Abandoned Cart Recovery",
      type: "email",
      status: "active",
      trigger: "Cart abandoned for 1 hour",
      audience: "All users with items in cart",
      sent: 1250,
      opened: 625,
      clicked: 312,
      converted: 156,
      revenue: 15600,
      createdAt: "2025-12-01T00:00:00Z",
      lastRun: "2025-12-27T14:30:00Z",
    },
    {
      id: "CMP-002",
      name: "Welcome Series",
      type: "email",
      status: "active",
      trigger: "New user registration",
      audience: "New users",
      sent: 890,
      opened: 712,
      clicked: 445,
      converted: 223,
      revenue: 22300,
      createdAt: "2025-12-01T00:00:00Z",
      lastRun: "2025-12-27T16:00:00Z",
    },
    {
      id: "CMP-003",
      name: "Post-Purchase Follow-up",
      type: "email",
      status: "active",
      trigger: "Order delivered",
      audience: "Customers with delivered orders",
      sent: 2340,
      opened: 1872,
      clicked: 936,
      converted: 468,
      revenue: 46800,
      createdAt: "2025-12-01T00:00:00Z",
      lastRun: "2025-12-27T15:45:00Z",
    },
    {
      id: "CMP-004",
      name: "Flash Sale Alert",
      type: "sms",
      status: "paused",
      trigger: "Flash sale starts",
      audience: "VIP customers",
      sent: 450,
      opened: 405,
      clicked: 243,
      converted: 122,
      revenue: 12200,
      createdAt: "2025-12-15T00:00:00Z",
      lastRun: "2025-12-20T10:00:00Z",
    },
    {
      id: "CMP-005",
      name: "Re-engagement Campaign",
      type: "email",
      status: "active",
      trigger: "No purchase in 30 days",
      audience: "Dormant customers",
      sent: 680,
      opened: 272,
      clicked: 136,
      converted: 68,
      revenue: 6800,
      createdAt: "2025-12-10T00:00:00Z",
      lastRun: "2025-12-27T12:00:00Z",
    },
  ];

  // Mock A/B tests
  const abTests: ABTest[] = [
    {
      id: "AB-001",
      campaignId: "CMP-001",
      name: "Subject Line Test",
      variants: [
        {
          id: "A",
          name: "Variant A",
          subject: "You left something behind! 🛒",
          sent: 625,
          opened: 312,
          clicked: 156,
          converted: 78,
        },
        {
          id: "B",
          name: "Variant B",
          subject: "Complete your order and save 10%",
          sent: 625,
          opened: 313,
          clicked: 156,
          converted: 78,
        },
      ],
      status: "running",
      startDate: "2025-12-20T00:00:00Z",
    },
    {
      id: "AB-002",
      campaignId: "CMP-002",
      name: "CTA Button Test",
      variants: [
        {
          id: "A",
          name: "Variant A",
          subject: "Welcome to Live Shopping Network!",
          sent: 445,
          opened: 356,
          clicked: 222,
          converted: 111,
        },
        {
          id: "B",
          name: "Variant B",
          subject: "Welcome to Live Shopping Network!",
          sent: 445,
          opened: 356,
          clicked: 223,
          converted: 112,
        },
      ],
      status: "completed",
      winner: "B",
      startDate: "2025-12-15T00:00:00Z",
      endDate: "2025-12-25T00:00:00Z",
    },
  ];

  // Mock workflows
  const workflows: Workflow[] = [
    {
      id: "WF-001",
      name: "Abandoned Cart Sequence",
      trigger: "Cart abandoned",
      steps: 3,
      active: true,
      totalRuns: 1250,
      completionRate: 68.5,
    },
    {
      id: "WF-002",
      name: "Welcome Journey",
      trigger: "User registration",
      steps: 5,
      active: true,
      totalRuns: 890,
      completionRate: 82.3,
    },
    {
      id: "WF-003",
      name: "Win-Back Campaign",
      trigger: "30 days inactive",
      steps: 4,
      active: true,
      totalRuns: 680,
      completionRate: 45.2,
    },
  ];

  const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const avgOpenRate = (campaigns.reduce((sum, c) => sum + (c.opened / c.sent), 0) / campaigns.length) * 100;
  const avgConversionRate = (campaigns.reduce((sum, c) => sum + (c.converted / c.sent), 0) / campaigns.length) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400";
      case "paused":
        return "bg-yellow-500/20 text-yellow-400";
      case "completed":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "sms":
        return <MessageSquare className="w-4 h-4" />;
      case "push":
        return <Bell className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Marketing Automation</h1>
          <p className="text-muted-foreground">
            Campaign builder, trigger-based workflows, and A/B testing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Copy className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button>
            <Zap className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Sent</p>
            <Mail className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{totalSent.toLocaleString()}</p>
          <p className="text-xs text-green-500">+18% from last month</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Avg Open Rate</p>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{avgOpenRate.toFixed(1)}%</p>
          <p className="text-xs text-green-500">+2.3% from last month</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Conversion Rate</p>
            <Target className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{avgConversionRate.toFixed(1)}%</p>
          <p className="text-xs text-green-500">+1.8% from last month</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Revenue Generated</p>
            <BarChart3 className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold mb-1">${(totalRevenue / 1000).toFixed(1)}K</p>
          <p className="text-xs text-green-500">+25% from last month</p>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns">
            <Mail className="w-4 h-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="workflows">
            <Zap className="w-4 h-4 mr-2" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="abtests">
            <Target className="w-4 h-4 mr-2" />
            A/B Tests
          </TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Active Campaigns</h2>

            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        {getTypeIcon(campaign.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold">{campaign.name}</h3>
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{campaign.trigger}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                      {campaign.status === "active" ? (
                        <Button variant="outline" size="sm">
                          <Pause className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm">
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Sent</p>
                      <p className="text-xl font-bold">{campaign.sent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Opened</p>
                      <p className="text-xl font-bold text-blue-500">
                        {campaign.opened.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {((campaign.opened / campaign.sent) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Clicked</p>
                      <p className="text-xl font-bold text-purple-500">
                        {campaign.clicked.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {((campaign.clicked / campaign.sent) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Converted</p>
                      <p className="text-xl font-bold text-green-500">
                        {campaign.converted.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {((campaign.converted / campaign.sent) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                      <p className="text-xl font-bold text-orange-500">
                        ${(campaign.revenue / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">ROI</p>
                      <p className="text-xl font-bold text-green-500">
                        {((campaign.revenue / (campaign.sent * 0.1)) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
                    <span>Audience: {campaign.audience}</span>
                    {campaign.lastRun && (
                      <span>Last run: {new Date(campaign.lastRun).toLocaleString()}</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Automation Workflows</h2>

            <div className="space-y-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                        <Zap className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold">{workflow.name}</h3>
                          {workflow.active ? (
                            <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-500/20 text-gray-400">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Trigger: {workflow.trigger} • {workflow.steps} steps
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Runs</p>
                      <p className="text-2xl font-bold">{workflow.totalRuns.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Completion Rate</p>
                      <p className="text-2xl font-bold text-green-500">
                        {workflow.completionRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avg Time to Complete</p>
                      <p className="text-2xl font-bold">2.5 days</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* A/B Tests Tab */}
        <TabsContent value="abtests">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">A/B Test Results</h2>

            <div className="space-y-6">
              {abTests.map((test) => (
                <Card key={test.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold">{test.name}</h3>
                        {test.status === "running" ? (
                          <Badge className="bg-blue-500/20 text-blue-400">Running</Badge>
                        ) : (
                          <Badge className="bg-green-500/20 text-green-400">Completed</Badge>
                        )}
                        {test.winner && (
                          <Badge className="bg-yellow-500/20 text-yellow-400">
                            Winner: Variant {test.winner}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Campaign: {test.campaignId} • Started {new Date(test.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {test.variants.map((variant) => (
                      <Card
                        key={variant.id}
                        className={`p-4 ${
                          test.winner === variant.id
                            ? "border-yellow-500 bg-yellow-500/5"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold">{variant.name}</h4>
                          {test.winner === variant.id && (
                            <CheckCircle className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{variant.subject}</p>

                        <div className="grid grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1">Sent</p>
                            <p className="font-bold">{variant.sent}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Open Rate</p>
                            <p className="font-bold text-blue-500">
                              {((variant.opened / variant.sent) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Click Rate</p>
                            <p className="font-bold text-purple-500">
                              {((variant.clicked / variant.sent) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Conv Rate</p>
                            <p className="font-bold text-green-500">
                              {((variant.converted / variant.sent) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
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
