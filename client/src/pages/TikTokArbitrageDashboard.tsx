import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import {
  TrendingUp,
  DollarSign,
  Package,
  Rocket,
  PlayCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Video,
  Scissors,
  Download,
  Calendar,
  BarChart3,
  Settings,
  Shield,
  Clock,
  Target,
  Zap,
  Star,
  Eye,
  Heart,
  MessageSquare,
  Share2,
} from "lucide-react";

/**
 * TikTok Shop Arbitrage Dashboard
 * 
 * Complete control center for the trend-to-live pipeline:
 * - Trend Discovery & Product Intelligence
 * - Daily Shortlist Generation (Top 10)
 * - Launch Management
 * - Asset Generation
 * - Test Stream Validation
 * - Go-Live Gating & Readiness
 * - Host Management
 * - Live Show Execution
 * - Post-Live Clip Factory
 * - Profit Tracking
 * - Analytics & Reporting
 */

export default function TikTokArbitrageDashboard() {
  const [channelId] = useState("default-channel"); // In production, get from context
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = trpc.tiktokArbitrage.getDashboardStats.useQuery({
    channelId,
  });
  
  if (statsLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">TikTok Shop Arbitrage</h1>
          <p className="text-muted-foreground mt-2">
            Automated trend-to-live pipeline for profitable live commerce
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Quick Actions
          </Button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trend Products</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.trends?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.trends?.shortlisted || 0} shortlisted · Avg score: {Math.round(stats?.trends?.avgScore || 0)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Launches</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.launches?.live || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.launches?.total || 0} total · {stats?.launches?.completed || 0} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${((stats?.launches?.totalRevenue || 0) / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Profit: ${((stats?.launches?.totalProfit || 0) / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Hosts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.hosts?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.hosts?.total || 0} total · Avg score: {Math.round(stats?.hosts?.avgScore || 0)}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="launches">Launches</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="hosts">Hosts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <OverviewSection channelId={channelId} stats={stats} />
        </TabsContent>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <TrendsSection channelId={channelId} />
        </TabsContent>
        
        {/* Launches Tab */}
        <TabsContent value="launches" className="space-y-6">
          <LaunchesSection channelId={channelId} />
        </TabsContent>
        
        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-6">
          <AssetsSection channelId={channelId} />
        </TabsContent>
        
        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <TestingSection channelId={channelId} />
        </TabsContent>
        
        {/* Hosts Tab */}
        <TabsContent value="hosts" className="space-y-6">
          <HostsSection channelId={channelId} />
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsSection channelId={channelId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// OVERVIEW SECTION
// ============================================================================

function OverviewSection({ channelId, stats }: { channelId: string; stats: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common workflow shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start" variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Ingest New Trend
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Target className="h-4 w-4 mr-2" />
            Generate Daily Shortlist
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Rocket className="h-4 w-4 mr-2" />
            Create Launch
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <PlayCircle className="h-4 w-4 mr-2" />
            Start Live Show
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Pipeline health & automation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Trend Discovery</span>
            <Badge variant="default">Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Asset Generation</span>
            <Badge variant="default">Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Test Streams</span>
            <Badge variant="default">Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Clip Factory</span>
            <Badge variant="default">Active</Badge>
          </div>
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest pipeline events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-green-100 p-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Daily shortlist generated</p>
                <p className="text-xs text-muted-foreground">10 products selected · 2 minutes ago</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-blue-100 p-2">
                <Rocket className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Launch created: "Viral Kitchen Gadget"</p>
                <p className="text-xs text-muted-foreground">Assets generating · 15 minutes ago</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-yellow-100 p-2">
                <PlayCircle className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Test stream completed</p>
                <p className="text-xs text-muted-foreground">Verdict: GO · 1 hour ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// TRENDS SECTION
// ============================================================================

function TrendsSection({ channelId }: { channelId: string }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const utils = trpc.useUtils();
  
  const { data: trends, isLoading } = trpc.tiktokArbitrage.getTrendProducts.useQuery({
    channelId,
    status: statusFilter === "all" ? undefined : statusFilter as any,
    minScore: 50,
    limit: 50,
  });
  
  const ingestMutation = trpc.tiktokArbitrage.ingestTrend.useMutation({
    onSuccess: () => {
      toast.success("Trend ingested successfully");
      utils.tiktokArbitrage.getTrendProducts.invalidate();
    },
  });
  
  const generateShortlistMutation = trpc.tiktokArbitrage.generateDailyShortlist.useMutation({
    onSuccess: (data) => {
      toast.success(`Daily shortlist generated with ${data.productCount} products`);
      utils.tiktokArbitrage.getTrendProducts.invalidate();
    },
  });
  
  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DISCOVERED">Discovered</SelectItem>
              <SelectItem value="ANALYZING">Analyzing</SelectItem>
              <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="LAUNCHED">Launched</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <IngestTrendDialog channelId={channelId} onSubmit={ingestMutation.mutate} />
          <Button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              generateShortlistMutation.mutate({
                channelId,
                shortlistDate: today,
                minScore: 70,
              });
            }}
            disabled={generateShortlistMutation.isPending}
          >
            <Target className="h-4 w-4 mr-2" />
            Generate Top 10
          </Button>
        </div>
      </div>
      
      {/* Trends Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Products</CardTitle>
          <CardDescription>
            Discovered products with virality and profit scoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading trends...</div>
          ) : trends && trends.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Virality</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Overall</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trends.map((trend) => (
                  <TableRow key={trend.id}>
                    <TableCell>
                      {trend.rank ? (
                        <Badge variant="secondary">#{trend.rank}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{trend.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {trend.productCategory || "Uncategorized"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{trend.trendSource}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={trend.viralityScore} className="w-16" />
                        <span className="text-sm">{trend.viralityScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={trend.profitScore} className="w-16" />
                        <span className="text-sm">{trend.profitScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          trend.overallScore >= 80
                            ? "default"
                            : trend.overallScore >= 60
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {trend.overallScore}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={trend.status} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No trends found. Ingest your first trend to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// LAUNCHES SECTION
// ============================================================================

function LaunchesSection({ channelId }: { channelId: string }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: launches, isLoading } = trpc.tiktokArbitrage.getLaunches.useQuery({
    channelId,
    status: statusFilter === "all" ? undefined : statusFilter as any,
    limit: 50,
  });
  
  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PLANNED">Planned</SelectItem>
              <SelectItem value="ASSETS_GENERATING">Assets Generating</SelectItem>
              <SelectItem value="TEST_STREAMING">Test Streaming</SelectItem>
              <SelectItem value="READY">Ready</SelectItem>
              <SelectItem value="LIVE">Live</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button>
          <Rocket className="h-4 w-4 mr-2" />
          Create Launch
        </Button>
      </div>
      
      {/* Launches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8">Loading launches...</div>
        ) : launches && launches.length > 0 ? (
          launches.map((launch) => (
            <Card key={launch.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{launch.launchName}</CardTitle>
                    <CardDescription>
                      {new Date(launch.launchDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <StatusBadge status={launch.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-medium">
                      ${(Number(launch.totalRevenueCents) / 100).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Profit</p>
                    <p className="font-medium">
                      ${(Number(launch.totalProfitCents) / 100).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Units Sold</p>
                    <p className="font-medium">{launch.unitsSold}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conversion</p>
                    <p className="font-medium">{launch.conversionRate}%</p>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1">
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No launches yet. Create your first launch from a shortlisted product.
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ASSETS SECTION
// ============================================================================

function AssetsSection({ channelId }: { channelId: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Asset Generation</CardTitle>
          <CardDescription>
            Manage OBS packs, scripts, and compliance materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Asset management interface coming soon. Generate assets from the Launches tab.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// TESTING SECTION
// ============================================================================

function TestingSection({ channelId }: { channelId: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Streams</CardTitle>
          <CardDescription>
            Monitor test stream performance and verdicts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Test stream dashboard coming soon. Enqueue tests from the Launches tab.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// HOSTS SECTION
// ============================================================================

function HostsSection({ channelId }: { channelId: string }) {
  const { data: hosts, isLoading } = trpc.tiktokArbitrage.getHosts.useQuery({
    channelId,
  });
  
  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Host Management</h2>
          <p className="text-muted-foreground">Creator casting & performance tracking</p>
        </div>
        <Button>
          <Users className="h-4 w-4 mr-2" />
          Add Host
        </Button>
      </div>
      
      {/* Hosts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-8">Loading hosts...</div>
        ) : hosts && hosts.length > 0 ? (
          hosts.map((host) => (
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Overall Score</span>
                    <span className="font-medium">{host.overallScore}/100</span>
                  </div>
                  <Progress value={host.overallScore} />
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Energy</p>
                    <p className="font-medium">{host.energyScore}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Clarity</p>
                    <p className="font-medium">{host.clarityScore}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Authentic</p>
                    <p className="font-medium">{host.authenticityScore}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Shows</p>
                    <p className="font-medium">{host.totalShows}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conversion</p>
                    <p className="font-medium">{host.avgConversionRate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-medium">
                      ${(Number(host.totalRevenueCents) / 100).toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Earned</p>
                    <p className="font-medium">
                      ${(Number(host.totalEarnedCents) / 100).toFixed(0)}
                    </p>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="w-full">
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No hosts yet. Add your first host to start casting.
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ANALYTICS SECTION
// ============================================================================

function AnalyticsSection({ channelId }: { channelId: string }) {
  const { data: stats } = trpc.tiktokArbitrage.getDashboardStats.useQuery({
    channelId,
  });
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>All-time earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${((stats?.launches?.totalRevenue || 0) / 100).toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Profit: ${((stats?.launches?.totalProfit || 0) / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total Shows</CardTitle>
            <CardDescription>Live streams executed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.shows?.total || 0}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats?.shows?.live || 0} currently live
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total Viewers</CardTitle>
            <CardDescription>Cumulative reach</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(stats?.shows?.totalViewers || 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Across all shows
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>Coming soon: Charts and insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Analytics charts will be displayed here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// DIALOGS & FORMS
// ============================================================================

function IngestTrendDialog({
  channelId,
  onSubmit,
}: {
  channelId: string;
  onSubmit: (data: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    trendUrl: "",
    trendTitle: "",
    productName: "",
    productDescription: "",
    sourceUrl: "",
    sourceCostCents: 0,
    suggestedPriceCents: 0,
  });
  
  const handleSubmit = () => {
    onSubmit({
      channelId,
      ...formData,
    });
    setOpen(false);
    setFormData({
      trendUrl: "",
      trendTitle: "",
      productName: "",
      productDescription: "",
      sourceUrl: "",
      sourceCostCents: 0,
      suggestedPriceCents: 0,
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          Ingest Trend
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ingest New Trend</DialogTitle>
          <DialogDescription>
            Add a trending product to analyze for potential launch
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="trendUrl">Trend URL</Label>
            <Input
              id="trendUrl"
              placeholder="https://tiktok.com/@user/video/..."
              value={formData.trendUrl}
              onChange={(e) =>
                setFormData({ ...formData, trendUrl: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="trendTitle">Trend Title</Label>
            <Input
              id="trendTitle"
              placeholder="Viral Kitchen Gadget"
              value={formData.trendTitle}
              onChange={(e) =>
                setFormData({ ...formData, trendTitle: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              placeholder="Multi-Function Vegetable Chopper"
              value={formData.productName}
              onChange={(e) =>
                setFormData({ ...formData, productName: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="productDescription">Product Description</Label>
            <Textarea
              id="productDescription"
              placeholder="Describe the product..."
              value={formData.productDescription}
              onChange={(e) =>
                setFormData({ ...formData, productDescription: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sourceUrl">Source URL (AliExpress, etc.)</Label>
              <Input
                id="sourceUrl"
                placeholder="https://aliexpress.com/..."
                value={formData.sourceUrl}
                onChange={(e) =>
                  setFormData({ ...formData, sourceUrl: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="sourceCost">Source Cost (cents)</Label>
              <Input
                id="sourceCost"
                type="number"
                placeholder="500"
                value={formData.sourceCostCents}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sourceCostCents: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="suggestedPrice">Suggested Price (cents)</Label>
            <Input
              id="suggestedPrice"
              type="number"
              placeholder="2999"
              value={formData.suggestedPriceCents}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  suggestedPriceCents: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Ingest Trend</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: any; label: string }> = {
    DISCOVERED: { variant: "secondary", label: "Discovered" },
    ANALYZING: { variant: "default", label: "Analyzing" },
    SHORTLISTED: { variant: "default", label: "Shortlisted" },
    REJECTED: { variant: "destructive", label: "Rejected" },
    LAUNCHED: { variant: "default", label: "Launched" },
    PLANNED: { variant: "secondary", label: "Planned" },
    ASSETS_GENERATING: { variant: "default", label: "Generating" },
    TEST_STREAMING: { variant: "default", label: "Testing" },
    READY: { variant: "default", label: "Ready" },
    LIVE: { variant: "default", label: "Live" },
    COMPLETED: { variant: "secondary", label: "Completed" },
    CANCELLED: { variant: "destructive", label: "Cancelled" },
  };
  
  const config = variants[status] || { variant: "outline", label: status };
  
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    APPLICANT: "bg-gray-100 text-gray-800",
    BRONZE: "bg-orange-100 text-orange-800",
    SILVER: "bg-gray-200 text-gray-800",
    GOLD: "bg-yellow-100 text-yellow-800",
    PLATINUM: "bg-purple-100 text-purple-800",
    SUSPENDED: "bg-red-100 text-red-800",
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[tier] || colors.APPLICANT}`}>
      {tier}
    </span>
  );
}
