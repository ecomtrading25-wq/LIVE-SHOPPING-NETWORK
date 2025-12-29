/**
 * LSN OPERATIONS DASHBOARD V1
 * 
 * Comprehensive admin control center with:
 * - Live show monitoring and control
 * - Real-time metrics and KPIs
 * - Creator performance tracking
 * - Inventory management
 * - Order fulfillment pipeline
 * - Purchase order management
 * - Supplier management
 * - 3PL operations
 * - Fraud detection alerts
 * - Customer support queue
 * - Financial overview
 * - System health monitoring
 */

import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Play,
  Pause,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Truck,
  BarChart3,
  Activity,
  Eye,
  Zap,
  Star,
  Award,
  Target,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

import AdminProtectedRoute from "@/components/AdminProtectedRoute";
export default function LSNOperationsDashboard() {
  return (
    <AdminProtectedRoute>
      <LSNOperationsDashboardContent />
    </AdminProtectedRoute>
  );
}

function LSNOperationsDashboardContent() {
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("today");

  // Fetch live shows
  const { data: liveShows } = trpc.liveShows.getLive.useQuery(undefined, {
    refetchInterval: 5000,
  });

  // Fetch upcoming shows
  const { data: upcomingShows } = trpc.liveShows.getUpcoming.useQuery({
    limit: 10,
  });

  // Fetch top creators
  const { data: topCreators } = trpc.creators.getLeaderboard.useQuery({
    metric: "revenue",
    period: timeRange === "today" ? "week" : timeRange,
    limit: 10,
  });

  // Mock data for demo - in production, fetch from tRPC
  const metrics = {
    liveViewers: liveShows?.reduce((sum: number, show: any) => sum + (show.currentViewers || 0), 0) || 0,
    todayRevenue: 45678.90,
    todayOrders: 234,
    conversionRate: 12.5,
    avgOrderValue: 195.20,
    activeCreators: 45,
    pendingOrders: 67,
    lowStockItems: 23,
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Operations Dashboard</h1>
            <p className="text-gray-400">Real-time platform monitoring and control</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={timeRange === "today" ? "default" : "outline"}
              onClick={() => setTimeRange("today")}
              className={timeRange === "today" ? "bg-red-600" : "border-border"}
            >
              Today
            </Button>
            <Button
              variant={timeRange === "week" ? "default" : "outline"}
              onClick={() => setTimeRange("week")}
              className={timeRange === "week" ? "bg-red-600" : "border-border"}
            >
              Week
            </Button>
            <Button
              variant={timeRange === "month" ? "default" : "outline"}
              onClick={() => setTimeRange("month")}
              className={timeRange === "month" ? "bg-red-600" : "border-border"}
            >
              Month
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Live Viewers"
            value={metrics.liveViewers.toLocaleString()}
            icon={<Eye className="h-5 w-5 text-red-400" />}
            trend={{ value: 15.3, isPositive: true }}
            subtitle={`${liveShows?.length || 0} shows live`}
          />
          <MetricCard
            title="Today's Revenue"
            value={`$${metrics.todayRevenue.toLocaleString()}`}
            icon={<DollarSign className="h-5 w-5 text-green-400" />}
            trend={{ value: 23.1, isPositive: true }}
            subtitle={`${metrics.todayOrders} orders`}
          />
          <MetricCard
            title="Conversion Rate"
            value={`${metrics.conversionRate}%`}
            icon={<TrendingUp className="h-5 w-5 text-blue-400" />}
            trend={{ value: 2.4, isPositive: true }}
            subtitle={`AOV: $${metrics.avgOrderValue}`}
          />
          <MetricCard
            title="Active Creators"
            value={metrics.activeCreators.toString()}
            icon={<Users className="h-5 w-5 text-pink-400" />}
            trend={{ value: 8, isPositive: true }}
            subtitle="Scheduled today"
          />
        </div>

        {/* Alerts */}
        <Card className="border-border bg-background text-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AlertItem
                severity="high"
                message="23 products below minimum stock threshold"
                action="Review Inventory"
                link="/inventory"
              />
              <AlertItem
                severity="medium"
                message="3 purchase orders pending approval"
                action="Review POs"
                link="/purchasing-dashboard"
              />
              <AlertItem
                severity="low"
                message="Creator payout batch ready for processing"
                action="Process Payouts"
                link="/creator-dashboard"
              />
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="live" className="space-y-6">
          <TabsList className="bg-background border border-border text-foreground">
            <TabsTrigger value="live" className="data-[state=active]:bg-red-600">
              Live Shows
            </TabsTrigger>
            <TabsTrigger value="creators" className="data-[state=active]:bg-red-600">
              Creators
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-red-600">
              Orders
            </TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-red-600">
              Inventory
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="data-[state=active]:bg-red-600">
              Suppliers
            </TabsTrigger>
          </TabsList>

          {/* Live Shows Tab */}
          <TabsContent value="live" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Active Shows */}
              <Card className="border-border bg-background text-foreground">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
                    Live Now ({liveShows?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {liveShows?.map((show: any) => (
                        <LiveShowMonitorCard key={show.id} show={show} />
                      ))}
                      {(!liveShows || liveShows.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          No live shows at the moment
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Upcoming Shows */}
              <Card className="border-border bg-background text-foreground">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-red-400" />
                    Upcoming Shows
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {upcomingShows?.slice(0, 5).map((show: any) => (
                        <UpcomingShowCard key={show.id} show={show} />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Show Performance */}
            <Card className="border-border bg-background text-foreground">
              <CardHeader>
                <CardTitle>Show Performance (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Show</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Peak Viewers</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Conv. Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Mock data - in production, fetch from API */}
                    <TableRow className="border-border">
                      <TableCell className="font-medium">Tech Deals Friday</TableCell>
                      <TableCell>Sarah M.</TableCell>
                      <TableCell>2,345</TableCell>
                      <TableCell>2h 15m</TableCell>
                      <TableCell>$12,450</TableCell>
                      <TableCell>87</TableCell>
                      <TableCell>
                        <Badge className="bg-green-600">14.2%</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-border">
                      <TableCell className="font-medium">Beauty Essentials</TableCell>
                      <TableCell>Jessica L.</TableCell>
                      <TableCell>1,892</TableCell>
                      <TableCell>1h 45m</TableCell>
                      <TableCell>$8,920</TableCell>
                      <TableCell>64</TableCell>
                      <TableCell>
                        <Badge className="bg-green-600">11.8%</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Creators Tab */}
          <TabsContent value="creators" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Top Performers */}
              <Card className="border-border bg-background text-foreground">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-400" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {topCreators?.map((creator: any, index: number) => (
                        <CreatorPerformanceCard
                          key={creator.id}
                          creator={creator}
                          rank={index + 1}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Creator Stats */}
              <Card className="border-border bg-background text-foreground">
                <CardHeader>
                  <CardTitle>Creator Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <StatRow
                      label="Total Creators"
                      value="156"
                      change="+12"
                      icon={<Users className="h-4 w-4 text-red-400" />}
                    />
                    <StatRow
                      label="Diamond Tier"
                      value="8"
                      change="+2"
                      icon={<Star className="h-4 w-4 text-yellow-400" />}
                    />
                    <StatRow
                      label="Platinum Tier"
                      value="23"
                      change="+5"
                      icon={<Star className="h-4 w-4 text-gray-400" />}
                    />
                    <StatRow
                      label="Gold Tier"
                      value="45"
                      change="+8"
                      icon={<Star className="h-4 w-4 text-orange-400" />}
                    />
                    <StatRow
                      label="Avg Show Duration"
                      value="1h 52m"
                      change="+15m"
                      icon={<Clock className="h-4 w-4 text-blue-400" />}
                    />
                    <StatRow
                      label="Avg Conversion Rate"
                      value="12.3%"
                      change="+1.2%"
                      icon={<Target className="h-4 w-4 text-green-400" />}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payout Queue */}
            <Card className="border-border bg-background text-foreground">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pending Payouts</span>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    Process Batch
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Creator</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Shows</TableHead>
                      <TableHead>Revenue Generated</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Bonuses</TableHead>
                      <TableHead>Total Payout</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-border">
                      <TableCell className="font-medium">Sarah M.</TableCell>
                      <TableCell>Dec 1-15</TableCell>
                      <TableCell>12</TableCell>
                      <TableCell>$45,230</TableCell>
                      <TableCell>$4,523</TableCell>
                      <TableCell>$500</TableCell>
                      <TableCell className="font-bold text-green-400">$5,023</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="border-border">
                          Approve
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="border-border bg-background text-foreground">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Pending Fulfillment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{metrics.pendingOrders}</div>
                  <Progress value={75} className="h-2" />
                  <p className="text-sm text-gray-500 mt-2">75% within SLA</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-background text-foreground">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-400">
                    In Transit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">234</div>
                  <Progress value={92} className="h-2" />
                  <p className="text-sm text-gray-500 mt-2">92% on-time</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-background text-foreground">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Returns/Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">12</div>
                  <Progress value={30} className="h-2 bg-red-900" />
                  <p className="text-sm text-gray-500 mt-2">3 urgent</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border bg-background text-foreground">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Show</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-border">
                      <TableCell className="font-mono">#ORD-12345</TableCell>
                      <TableCell>John Doe</TableCell>
                      <TableCell>Tech Deals Friday</TableCell>
                      <TableCell>3</TableCell>
                      <TableCell>$234.50</TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-600">Pending</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="border-border">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="border-border bg-background text-foreground">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Low Stock Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2 text-orange-400">
                    {metrics.lowStockItems}
                  </div>
                  <p className="text-sm text-gray-500">Requires immediate attention</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-background text-foreground">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Total SKUs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">1,234</div>
                  <p className="text-sm text-gray-500">Across 3 warehouses</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-background text-foreground">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-400">
                    Inventory Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">$456K</div>
                  <p className="text-sm text-gray-500">At landed cost</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border bg-background text-foreground">
              <CardHeader>
                <CardTitle>Low Stock Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Min Threshold</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Lead Time</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-border">
                      <TableCell className="font-medium">Wireless Earbuds Pro</TableCell>
                      <TableCell className="font-mono">SKU-12345</TableCell>
                      <TableCell className="text-orange-400 font-bold">8</TableCell>
                      <TableCell>20</TableCell>
                      <TableCell>TechSupply Co.</TableCell>
                      <TableCell>14 days</TableCell>
                      <TableCell>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700">
                          Create PO
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6">
            <Card className="border-border bg-background text-foreground">
              <CardHeader>
                <CardTitle>Supplier Scorecards</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Supplier</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Quality Score</TableHead>
                      <TableHead>Delivery Score</TableHead>
                      <TableHead>Total Orders</TableHead>
                      <TableHead>On-Time Rate</TableHead>
                      <TableHead>Defect Rate</TableHead>
                      <TableHead>Overall</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-border">
                      <TableCell className="font-medium">TechSupply Co.</TableCell>
                      <TableCell>
                        <Badge className="bg-red-600">Strategic</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={95} className="h-2 w-16" />
                          <span className="text-sm">95</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={92} className="h-2 w-16" />
                          <span className="text-sm">92</span>
                        </div>
                      </TableCell>
                      <TableCell>87</TableCell>
                      <TableCell>94%</TableCell>
                      <TableCell>1.2%</TableCell>
                      <TableCell>
                        <Badge className="bg-green-600">93</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function MetricCard({
  title,
  value,
  icon,
  trend,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: { value: number; isPositive: boolean };
  subtitle: string;
}) {
  return (
    <Card className="border-border bg-background text-foreground">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 bg-card rounded-lg text-card-foreground">{icon}</div>
          <div
            className={cn(
              "flex items-center gap-1 text-sm",
              trend.isPositive ? "text-green-400" : "text-red-400"
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {trend.value}%
          </div>
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-sm text-gray-400">{title}</div>
        <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
      </CardContent>
    </Card>
  );
}

function AlertItem({
  severity,
  message,
  action,
  link,
}: {
  severity: "high" | "medium" | "low";
  message: string;
  action: string;
  link: string;
}) {
  const colors = {
    high: "bg-red-900/50 border-red-500",
    medium: "bg-yellow-900/50 border-yellow-500",
    low: "bg-blue-900/50 border-blue-500",
  };

  return (
    <div className={cn("flex items-center justify-between p-3 rounded-lg border", colors[severity])}>
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5" />
        <span className="text-sm">{message}</span>
      </div>
      <Link href={link}>
        <Button size="sm" variant="outline" className="border-border">
          {action}
        </Button>
      </Link>
    </div>
  );
}

function LiveShowMonitorCard({ show }: { show: any }) {
  return (
    <Card className="border-border bg-card/50 text-card-foreground">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border-2 border-red-500">
            <AvatarImage src={show.creator?.avatarUrl} />
            <AvatarFallback>{show.creator?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold truncate">{show.title}</h4>
              <Badge className="bg-red-600 animate-pulse">LIVE</Badge>
            </div>
            <p className="text-sm text-gray-400 mb-2">{show.creator?.name}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4 text-red-400" />
                <span>{show.currentViewers?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <ShoppingCart className="h-4 w-4 text-green-400" />
                <span>{show.totalOrders || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-yellow-400" />
                <span>${show.totalRevenue?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
          <Link href={`/live/${show.id}`}>
            <Button size="sm" variant="outline" className="border-border">
              Monitor
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingShowCard({ show }: { show: any }) {
  const startTime = new Date(show.scheduledStartTime);
  const now = new Date();
  const hoursUntil = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60 * 60));

  return (
    <Card className="border-border bg-card/50 text-card-foreground">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 border-2 border-red-500">
            <AvatarImage src={show.creator?.avatarUrl} />
            <AvatarFallback>{show.creator?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate mb-1">{show.title}</h4>
            <p className="text-sm text-gray-400 mb-2">{show.creator?.name}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>
                {hoursUntil < 24 ? `In ${hoursUntil}h` : startTime.toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreatorPerformanceCard({ creator, rank }: { creator: any; rank: number }) {
  return (
    <Card className="border-border bg-card/50 text-card-foreground">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-red-400 w-8">#{rank}</div>
          <Avatar className="h-12 w-12 border-2 border-red-500">
            <AvatarImage src={creator.avatarUrl} />
            <AvatarFallback>{creator.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">{creator.name}</h4>
            <Badge variant="outline" className="border-red-500/50 text-red-400">
              {creator.tier}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-green-400">
              ${creator.totalRevenue?.toLocaleString() || 0}
            </div>
            <div className="text-xs text-gray-500">{creator.totalShows} shows</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatRow({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-card rounded-lg text-card-foreground">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-700 rounded">{icon}</div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="text-right">
        <div className="font-bold">{value}</div>
        <div className="text-xs text-green-400">{change}</div>
      </div>
    </div>
  );
}
