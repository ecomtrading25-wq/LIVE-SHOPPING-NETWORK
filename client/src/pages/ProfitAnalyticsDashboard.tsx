import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  Eye,
  ShoppingCart,
  Target,
  Shield,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  Download,
  Settings,
  Zap,
  Clock,
  Percent,
} from "lucide-react";

/**
 * Profit Analytics & Protection Dashboard
 * 
 * Complete financial intelligence center:
 * - Revenue & Profit Tracking
 * - Multi-Factor Cost Breakdown
 * - Profit Protection Engine
 * - Launch Performance Analytics
 * - Host Performance & Payouts
 * - Product Profitability Analysis
 * - Margin Optimization
 * - Cost Trend Analysis
 * - ROI Tracking
 * - Financial Forecasting
 */

export default function ProfitAnalyticsDashboard() {
  const [channelId] = useState("default-channel");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("7d");
  
  return (
    <div className="container mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Profit Analytics & Protection</h1>
          <p className="text-muted-foreground mt-2">
            Financial intelligence & margin optimization
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>
      
      {/* Main Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="launches">Launches</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="hosts">Hosts</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="protection">Protection</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <OverviewSection channelId={channelId} timeRange={timeRange} />
        </TabsContent>
        
        <TabsContent value="launches" className="space-y-6">
          <LaunchesSection channelId={channelId} timeRange={timeRange} />
        </TabsContent>
        
        <TabsContent value="products" className="space-y-6">
          <ProductsSection channelId={channelId} timeRange={timeRange} />
        </TabsContent>
        
        <TabsContent value="hosts" className="space-y-6">
          <HostsSection channelId={channelId} timeRange={timeRange} />
        </TabsContent>
        
        <TabsContent value="costs" className="space-y-6">
          <CostsSection channelId={channelId} timeRange={timeRange} />
        </TabsContent>
        
        <TabsContent value="protection" className="space-y-6">
          <ProtectionSection channelId={channelId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// OVERVIEW SECTION
// ============================================================================

function OverviewSection({ channelId, timeRange }: { channelId: string; timeRange: string }) {
  // Mock data - in production, fetch from tRPC
  const stats = {
    totalRevenue: 45678900, // cents
    totalProfit: 18234500, // cents
    totalCosts: 27444400, // cents
    profitMargin: 39.9,
    launches: 23,
    avgRevenuePerLaunch: 1985600, // cents
    avgProfitPerLaunch: 792800, // cents
    topProduct: "Viral Kitchen Gadget",
    topProductRevenue: 8934500, // cents
  };
  
  const costBreakdown = [
    { category: "Product Cost", amount: 15678900, percentage: 57.1 },
    { category: "Platform Fees", amount: 4567890, percentage: 16.6 },
    { category: "Host Payouts", amount: 3234500, percentage: 11.8 },
    { category: "Shipping", amount: 2345600, percentage: 8.5 },
    { category: "Marketing", amount: 1234500, percentage: 4.5 },
    { category: "Other", amount: 383010, percentage: 1.4 },
  ];
  
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats.totalRevenue / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.launches} launches · ${(stats.avgRevenuePerLaunch / 100).toFixed(2)} avg
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(stats.totalProfit / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              ${(stats.avgProfitPerLaunch / 100).toFixed(2)} per launch
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${(stats.totalCosts / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {((stats.totalCosts / stats.totalRevenue) * 100).toFixed(1)}% of revenue
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.profitMargin}%</div>
            <p className="text-xs text-muted-foreground">
              Target: 40% · {stats.profitMargin >= 40 ? "✅ On target" : "⚠️ Below target"}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>Multi-factor cost analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costBreakdown.map((item) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        ${(item.amount / 100).toFixed(2)}
                      </span>
                      <Badge variant="secondary">{item.percentage}%</Badge>
                    </div>
                  </div>
                  <Progress value={item.percentage} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Profit Trend</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <LineChart className="h-12 w-12 mx-auto mb-2" />
                <p>Chart visualization coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{stats.topProduct}</p>
              <p className="text-2xl font-bold text-green-600">
                ${(stats.topProductRevenue / 100).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                {((stats.topProductRevenue / stats.totalRevenue) * 100).toFixed(1)}% of total revenue
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Best Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">Fitness Gear Item</p>
              <p className="text-2xl font-bold text-green-600">52.3%</p>
              <p className="text-sm text-muted-foreground">
                $3,456.78 profit on $6,612.34 revenue
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Host</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">Sarah Chen</p>
              <p className="text-2xl font-bold text-green-600">$12,345.67</p>
              <p className="text-sm text-muted-foreground">
                Revenue generated · 8 shows
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// LAUNCHES SECTION
// ============================================================================

function LaunchesSection({ channelId, timeRange }: { channelId: string; timeRange: string }) {
  const launches = [
    {
      id: "launch-1",
      name: "Viral Kitchen Gadget",
      revenue: 8934500,
      costs: 5123400,
      profit: 3811100,
      margin: 42.7,
      unitsSold: 298,
      avgOrderValue: 2998,
      shows: 5,
      status: "COMPLETED",
    },
    {
      id: "launch-2",
      name: "Beauty Product Demo",
      revenue: 6712300,
      costs: 4234100,
      profit: 2478200,
      margin: 36.9,
      unitsSold: 224,
      avgOrderValue: 2997,
      shows: 4,
      status: "COMPLETED",
    },
    {
      id: "launch-3",
      name: "Fitness Gear Launch",
      revenue: 5423100,
      costs: 2589700,
      profit: 2833400,
      margin: 52.3,
      unitsSold: 182,
      avgOrderValue: 2980,
      shows: 3,
      status: "COMPLETED",
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Launch Performance</h2>
          <p className="text-muted-foreground">Profitability analysis by launch</p>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Launch</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Costs</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>AOV</TableHead>
                <TableHead>Shows</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {launches.map((launch) => (
                <TableRow key={launch.id}>
                  <TableCell>
                    <p className="font-medium">{launch.name}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">${(launch.revenue / 100).toFixed(2)}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-red-600">${(launch.costs / 100).toFixed(2)}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-green-600 font-medium">
                      ${(launch.profit / 100).toFixed(2)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        launch.margin >= 45
                          ? "default"
                          : launch.margin >= 35
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {launch.margin}%
                    </Badge>
                  </TableCell>
                  <TableCell>{launch.unitsSold}</TableCell>
                  <TableCell>${(launch.avgOrderValue / 100).toFixed(2)}</TableCell>
                  <TableCell>{launch.shows}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// PRODUCTS SECTION
// ============================================================================

function ProductsSection({ channelId, timeRange }: { channelId: string; timeRange: string }) {
  const products = [
    {
      id: "prod-1",
      name: "Viral Kitchen Gadget",
      category: "Home & Kitchen",
      revenue: 8934500,
      sourceCost: 1499,
      sellingPrice: 2999,
      unitsSold: 298,
      grossProfit: 4470000,
      grossMargin: 50.0,
      netProfit: 3811100,
      netMargin: 42.7,
    },
    {
      id: "prod-2",
      name: "Beauty Serum",
      category: "Beauty",
      revenue: 6712300,
      sourceCost: 1899,
      sellingPrice: 2997,
      unitsSold: 224,
      grossProfit: 2459520,
      grossMargin: 36.6,
      netProfit: 2478200,
      netMargin: 36.9,
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Profitability</h2>
          <p className="text-muted-foreground">Margin analysis by product</p>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Source Cost</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Units Sold</TableHead>
                <TableHead>Gross Margin</TableHead>
                <TableHead>Net Margin</TableHead>
                <TableHead>Net Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                  </TableCell>
                  <TableCell>${(product.sourceCost / 100).toFixed(2)}</TableCell>
                  <TableCell>${(product.sellingPrice / 100).toFixed(2)}</TableCell>
                  <TableCell>{product.unitsSold}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.grossMargin}%</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.netMargin >= 40
                          ? "default"
                          : product.netMargin >= 30
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {product.netMargin}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-green-600 font-medium">
                      ${(product.netProfit / 100).toFixed(2)}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// HOSTS SECTION
// ============================================================================

function HostsSection({ channelId, timeRange }: { channelId: string; timeRange: string }) {
  const hosts = [
    {
      id: "host-1",
      name: "Sarah Chen",
      tier: "GOLD",
      shows: 8,
      revenue: 12345670,
      profit: 4938268,
      avgConversion: 2.8,
      totalPayout: 1234567,
      payoutRate: 10,
    },
    {
      id: "host-2",
      name: "Mike Rodriguez",
      tier: "SILVER",
      shows: 6,
      revenue: 8923450,
      profit: 3569380,
      avgConversion: 2.4,
      totalPayout: 892345,
      payoutRate: 10,
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Host Performance</h2>
          <p className="text-muted-foreground">Revenue generation & payouts</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hosts.map((host) => (
          <Card key={host.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                    {host.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{host.name}</CardTitle>
                    <CardDescription>
                      <TierBadge tier={host.tier} />
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Shows</p>
                  <p className="text-xl font-bold">{host.shows}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversion</p>
                  <p className="text-xl font-bold">{host.avgConversion}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-xl font-bold text-green-600">
                    ${(host.revenue / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profit</p>
                  <p className="text-xl font-bold text-green-600">
                    ${(host.profit / 100).toFixed(2)}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Payout ({host.payoutRate}%)</span>
                  <span className="text-sm font-medium">
                    ${(host.totalPayout / 100).toFixed(2)}
                  </span>
                </div>
                <Progress
                  value={(host.totalPayout / host.revenue) * 100}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COSTS SECTION
// ============================================================================

function CostsSection({ channelId, timeRange }: { channelId: string; timeRange: string }) {
  const costCategories = [
    {
      category: "Product Cost",
      amount: 15678900,
      percentage: 57.1,
      trend: "+5.2%",
      trendUp: true,
    },
    {
      category: "Platform Fees",
      amount: 4567890,
      percentage: 16.6,
      trend: "+2.1%",
      trendUp: true,
    },
    {
      category: "Host Payouts",
      amount: 3234500,
      percentage: 11.8,
      trend: "-1.3%",
      trendUp: false,
    },
    {
      category: "Shipping",
      amount: 2345600,
      percentage: 8.5,
      trend: "+0.8%",
      trendUp: true,
    },
    {
      category: "Marketing",
      amount: 1234500,
      percentage: 4.5,
      trend: "+3.2%",
      trendUp: true,
    },
    {
      category: "Other",
      amount: 383010,
      percentage: 1.4,
      trend: "-0.5%",
      trendUp: false,
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cost Analysis</h2>
          <p className="text-muted-foreground">Multi-factor cost breakdown & trends</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {costCategories.map((item) => (
          <Card key={item.category}>
            <CardHeader>
              <CardTitle className="text-lg">{item.category}</CardTitle>
              <CardDescription>{item.percentage}% of total costs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  ${(item.amount / 100).toFixed(2)}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {item.trendUp ? (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    item.trendUp ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {item.trend}
                </span>
                <span className="text-sm text-muted-foreground">vs last period</span>
              </div>
              
              <Progress value={item.percentage} />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Cost Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Trend Over Time</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <LineChart className="h-12 w-12 mx-auto mb-2" />
              <p>Chart visualization coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// PROTECTION SECTION
// ============================================================================

function ProtectionSection({ channelId }: { channelId: string }) {
  const protectionRules = [
    {
      id: "rule-1",
      name: "Minimum Margin Threshold",
      description: "Block launches with projected margin <30%",
      enabled: true,
      triggered: 3,
      blocked: 3,
    },
    {
      id: "rule-2",
      name: "Maximum Cost Variance",
      description: "Alert if actual costs exceed projected by >15%",
      enabled: true,
      triggered: 1,
      blocked: 0,
    },
    {
      id: "rule-3",
      name: "Inventory Cost Spike",
      description: "Alert if source cost increases >20%",
      enabled: true,
      triggered: 0,
      blocked: 0,
    },
    {
      id: "rule-4",
      name: "Platform Fee Anomaly",
      description: "Alert if platform fees exceed expected range",
      enabled: false,
      triggered: 0,
      blocked: 0,
    },
  ];
  
  const recentAlerts = [
    {
      id: "alert-1",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      severity: "HIGH",
      rule: "Minimum Margin Threshold",
      launch: "Home Decor Item",
      message: "Projected margin 28% below threshold (30%)",
      action: "Launch blocked",
    },
    {
      id: "alert-2",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      severity: "MEDIUM",
      rule: "Maximum Cost Variance",
      launch: "Beauty Product Demo",
      message: "Actual costs 12% above projected",
      action: "Alert sent",
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profit Protection Engine</h2>
          <p className="text-muted-foreground">Automated margin safeguards</p>
        </div>
        <Button>
          <Shield className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>
      
      {/* Protection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {protectionRules.filter(r => r.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {protectionRules.length} total rules
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Triggers (7d)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {protectionRules.reduce((sum, r) => sum + r.triggered, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {protectionRules.reduce((sum, r) => sum + r.blocked, 0)} launches blocked
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protected Margin</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$4,567.89</div>
            <p className="text-xs text-muted-foreground">
              Estimated losses prevented
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Protection Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Protection Rules</CardTitle>
          <CardDescription>Automated margin safeguards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {protectionRules.map((rule) => (
              <div key={rule.id} className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{rule.name}</p>
                    <Badge variant={rule.enabled ? "default" : "secondary"}>
                      {rule.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rule.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Triggered {rule.triggered} times · Blocked {rule.blocked} launches
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
          <CardDescription>Protection engine activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {alert.severity === "HIGH" && (
                    <div className="rounded-full bg-red-100 p-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                  )}
                  {alert.severity === "MEDIUM" && (
                    <div className="rounded-full bg-yellow-100 p-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{alert.rule}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{alert.launch}</p>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Action: {alert.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    APPLICANT: "bg-gray-100 text-gray-800",
    BRONZE: "bg-orange-100 text-orange-800",
    SILVER: "bg-gray-200 text-gray-800",
    GOLD: "bg-yellow-100 text-yellow-800",
    PLATINUM: "bg-purple-100 text-purple-800",
  };
  
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        colors[tier] || colors.APPLICANT
      }`}
    >
      {tier}
    </span>
  );
}
