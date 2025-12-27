import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  ShoppingBag,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Award,
  AlertTriangle,
  Search,
  Target,
  BarChart3,
} from "lucide-react";

/**
 * Customer Data Platform (CDP)
 * Unified 360° profiles, predictive LTV, churn prediction, behavioral segmentation
 */

interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  tier: string;
  joinDate: string;
  location: string;
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderDate: string;
  predictedLTV: number;
  churnRisk: number;
  churnRiskLevel: "low" | "medium" | "high";
  segment: string;
  engagementScore: number;
  favoriteCategories: string[];
  recentActivity: Activity[];
  supportTickets: number;
  loyaltyPoints: number;
}

interface Activity {
  type: "order" | "support" | "review" | "browse";
  description: string;
  timestamp: string;
  value?: number;
}

interface Segment {
  id: string;
  name: string;
  description: string;
  customerCount: number;
  avgLTV: number;
  characteristics: string[];
}

export default function Customer360Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  // Mock customer profiles
  const customers: CustomerProfile[] = [
    {
      id: "CUST-001",
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      phone: "+1 (555) 123-4567",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
      tier: "Platinum",
      joinDate: "2024-01-15T00:00:00Z",
      location: "New York, NY",
      totalOrders: 45,
      totalSpent: 12450,
      avgOrderValue: 276.67,
      lastOrderDate: "2025-12-25T00:00:00Z",
      predictedLTV: 18500,
      churnRisk: 15,
      churnRiskLevel: "low",
      segment: "Champions",
      engagementScore: 92,
      favoriteCategories: ["Electronics", "Fashion", "Home & Garden"],
      recentActivity: [
        {
          type: "order",
          description: "Purchased Premium Headphones",
          timestamp: "2025-12-25T14:30:00Z",
          value: 299.99,
        },
        {
          type: "review",
          description: "Left 5-star review for Wireless Speaker",
          timestamp: "2025-12-24T10:00:00Z",
        },
        {
          type: "browse",
          description: "Viewed 12 products in Electronics",
          timestamp: "2025-12-23T16:45:00Z",
        },
      ],
      supportTickets: 2,
      loyaltyPoints: 8450,
    },
    {
      id: "CUST-002",
      name: "Michael Chen",
      email: "m.chen@example.com",
      phone: "+1 (555) 234-5678",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
      tier: "Gold",
      joinDate: "2024-06-20T00:00:00Z",
      location: "San Francisco, CA",
      totalOrders: 28,
      totalSpent: 6890,
      avgOrderValue: 246.07,
      lastOrderDate: "2025-12-20T00:00:00Z",
      predictedLTV: 9200,
      churnRisk: 42,
      churnRiskLevel: "medium",
      segment: "Loyal Customers",
      engagementScore: 68,
      favoriteCategories: ["Sports", "Tech Gadgets"],
      recentActivity: [
        {
          type: "order",
          description: "Purchased Running Shoes",
          timestamp: "2025-12-20T11:20:00Z",
          value: 149.99,
        },
        {
          type: "support",
          description: "Contacted support about delivery",
          timestamp: "2025-12-18T09:15:00Z",
        },
      ],
      supportTickets: 5,
      loyaltyPoints: 4520,
    },
    {
      id: "CUST-003",
      name: "Emily Rodriguez",
      email: "emily.r@example.com",
      phone: "+1 (555) 345-6789",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
      tier: "Silver",
      joinDate: "2024-09-10T00:00:00Z",
      location: "Austin, TX",
      totalOrders: 8,
      totalSpent: 1250,
      avgOrderValue: 156.25,
      lastOrderDate: "2025-10-15T00:00:00Z",
      predictedLTV: 2100,
      churnRisk: 78,
      churnRiskLevel: "high",
      segment: "At Risk",
      engagementScore: 32,
      favoriteCategories: ["Beauty", "Fashion"],
      recentActivity: [
        {
          type: "browse",
          description: "Viewed 3 products",
          timestamp: "2025-12-10T14:00:00Z",
        },
      ],
      supportTickets: 1,
      loyaltyPoints: 890,
    },
  ];

  // Mock segments
  const segments: Segment[] = [
    {
      id: "SEG-001",
      name: "Champions",
      description: "High-value, highly engaged customers",
      customerCount: 1250,
      avgLTV: 15600,
      characteristics: [
        "Frequent purchases (>20 orders)",
        "High engagement score (>80)",
        "Low churn risk (<20%)",
        "Active in last 30 days",
      ],
    },
    {
      id: "SEG-002",
      name: "Loyal Customers",
      description: "Regular buyers with moderate engagement",
      customerCount: 3420,
      avgLTV: 8900,
      characteristics: [
        "Moderate purchase frequency (10-20 orders)",
        "Medium engagement (60-80)",
        "Medium churn risk (20-50%)",
        "Active in last 60 days",
      ],
    },
    {
      id: "SEG-003",
      name: "At Risk",
      description: "Previously active, now showing signs of churn",
      customerCount: 890,
      avgLTV: 2400,
      characteristics: [
        "Declining purchase frequency",
        "Low engagement (<40)",
        "High churn risk (>60%)",
        "No activity in 60+ days",
      ],
    },
    {
      id: "SEG-004",
      name: "New Customers",
      description: "Recently joined, potential to grow",
      customerCount: 2100,
      avgLTV: 450,
      characteristics: [
        "Account age <90 days",
        "1-3 orders",
        "High engagement potential",
        "Onboarding phase",
      ],
    },
    {
      id: "SEG-005",
      name: "Dormant",
      description: "Inactive for extended period",
      customerCount: 1680,
      avgLTV: 180,
      characteristics: [
        "No purchases in 180+ days",
        "Very low engagement",
        "Win-back opportunity",
        "Potential to reactivate",
      ],
    },
  ];

  const filteredCustomers = customers.filter(
    (c) =>
      searchQuery === "" ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCustomers = customers.length;
  const avgLTV = customers.reduce((sum, c) => sum + c.predictedLTV, 0) / customers.length;
  const highRiskCount = customers.filter((c) => c.churnRiskLevel === "high").length;
  const avgEngagement = customers.reduce((sum, c) => sum + c.engagementScore, 0) / customers.length;

  const getChurnColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-500/20 text-red-400";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400";
      case "low":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="w-4 h-4 text-green-500" />;
      case "support":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "review":
        return <Award className="w-4 h-4 text-yellow-500" />;
      case "browse":
        return <Search className="w-4 h-4 text-purple-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Customer 360° Platform</h1>
          <p className="text-muted-foreground">
            Unified profiles, predictive analytics, and behavioral segmentation
          </p>
        </div>
        <Button>
          <BarChart3 className="w-4 h-4 mr-2" />
          Export Insights
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Customers</p>
            <User className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{totalCustomers.toLocaleString()}</p>
          <p className="text-xs text-green-500">+12% from last month</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Avg Predicted LTV</p>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold mb-1">${(avgLTV / 1000).toFixed(1)}K</p>
          <p className="text-xs text-green-500">+8% from last quarter</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">High Churn Risk</p>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{highRiskCount}</p>
          <p className="text-xs text-red-500">Requires intervention</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Avg Engagement</p>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{avgEngagement.toFixed(0)}/100</p>
          <p className="text-xs text-green-500">+5 points from last month</p>
        </Card>
      </div>

      <Tabs defaultValue="profiles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profiles">
            <User className="w-4 h-4 mr-2" />
            Customer Profiles
          </TabsTrigger>
          <TabsTrigger value="segments">
            <Target className="w-4 h-4 mr-2" />
            Segments
          </TabsTrigger>
        </TabsList>

        {/* Customer Profiles Tab */}
        <TabsContent value="profiles" className="space-y-6">
          <Card className="p-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customers by name or email..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <Card
                  key={customer.id}
                  className="p-4 cursor-pointer hover:border-primary transition-all"
                  onClick={() =>
                    setSelectedCustomer(selectedCustomer?.id === customer.id ? null : customer)
                  }
                >
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={customer.avatar}
                      alt={customer.name}
                      className="w-16 h-16 rounded-full border-2 border-border"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">{customer.name}</h3>
                        <Badge variant="outline">{customer.tier}</Badge>
                        <Badge className={getChurnColor(customer.churnRiskLevel)}>
                          {customer.churnRisk}% churn risk
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {customer.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {customer.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {customer.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Joined {new Date(customer.joinDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
                      <p className="text-2xl font-bold">{customer.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
                      <p className="text-2xl font-bold text-green-500">
                        ${(customer.totalSpent / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avg Order Value</p>
                      <p className="text-2xl font-bold">${customer.avgOrderValue.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Predicted LTV</p>
                      <p className="text-2xl font-bold text-blue-500">
                        ${(customer.predictedLTV / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Engagement</p>
                      <p className="text-2xl font-bold text-purple-500">{customer.engagementScore}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline">{customer.segment}</Badge>
                    {customer.favoriteCategories.map((cat, index) => (
                      <Badge key={index} className="bg-primary/10">
                        {cat}
                      </Badge>
                    ))}
                  </div>

                  {/* Expanded Details */}
                  {selectedCustomer?.id === customer.id && (
                    <div className="pt-4 border-t space-y-4">
                      <div>
                        <h4 className="font-bold mb-3 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-blue-500" />
                          Recent Activity
                        </h4>
                        <div className="space-y-2">
                          {customer.recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                              {getActivityIcon(activity.type)}
                              <div className="flex-1">
                                <p className="font-medium">{activity.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(activity.timestamp).toLocaleString()}
                                </p>
                              </div>
                              {activity.value && (
                                <p className="font-bold text-green-500">${activity.value}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Last Order</p>
                          <p className="font-bold">
                            {new Date(customer.lastOrderDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Support Tickets</p>
                          <p className="font-bold">{customer.supportTickets}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Loyalty Points</p>
                          <p className="font-bold text-yellow-500">{customer.loyaltyPoints}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Behavioral Segments</h2>

            <div className="space-y-4">
              {segments.map((segment) => (
                <Card key={segment.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{segment.name}</h3>
                      <p className="text-sm text-muted-foreground">{segment.description}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Target className="w-4 h-4 mr-2" />
                      Target Campaign
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Customer Count</p>
                      <p className="text-3xl font-bold">{segment.customerCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avg LTV</p>
                      <p className="text-3xl font-bold text-green-500">
                        ${(segment.avgLTV / 1000).toFixed(1)}K
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-2">Characteristics:</p>
                    <div className="flex flex-wrap gap-2">
                      {segment.characteristics.map((char, index) => (
                        <Badge key={index} variant="outline">
                          {char}
                        </Badge>
                      ))}
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
