import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, CheckCircle,
  XCircle, BarChart3, PieChart, Target, Zap, Filter, Search, Download,
  ArrowUpRight, ArrowDownRight, Minus, Eye, ShoppingCart, RefreshCw
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

/**
 * LSN SKU Profitability Dashboard
 * True net profit tracking with kill/scale automation
 * - Real-time profitability calculations
 * - Kill/scale rule automation
 * - Margin protection alerts
 * - Product lifecycle management
 * - Profitability trends
 */

export default function SKUProfitabilityDashboard() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [sortBy, setSortBy] = useState<"profit" | "margin" | "revenue" | "units">("profit");
  const [filterStatus, setFilterStatus] = useState<"all" | "scale" | "monitor" | "kill">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch SKU analytics
  const { data: analytics, refetch } = trpc.lsn.sku.getAnalytics.useQuery({
    timeRange,
    sortBy,
    filterStatus: filterStatus === "all" ? undefined : filterStatus,
    searchQuery: searchQuery || undefined,
  });

  // Fetch profitability summary
  const { data: summary } = trpc.lsn.sku.getProfitabilitySummary.useQuery({
    timeRange,
  });

  // Fetch kill/scale recommendations
  const { data: recommendations } = trpc.lsn.sku.getRecommendations.useQuery();

  // Mutations
  const killSKUMutation = trpc.lsn.sku.killSKU.useMutation({
    onSuccess: () => refetch(),
  });

  const scaleSKUMutation = trpc.lsn.sku.scaleSKU.useMutation({
    onSuccess: () => refetch(),
  });

  const updateMarginGuardrailMutation = trpc.lsn.sku.updateMarginGuardrail.useMutation({
    onSuccess: () => refetch(),
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "scale": return "bg-green-600";
      case "monitor": return "bg-yellow-600";
      case "kill": return "bg-red-600";
      default: return "bg-gray-600";
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (trend < -5) return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">SKU Profitability Dashboard</h1>
              <p className="text-gray-400">True net profit tracking with automated kill/scale decisions</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="border-white/20 text-foreground hover:bg-background/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-foreground hover:bg-background/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-green-500" />
                <Badge className="bg-green-600">
                  {summary?.profitGrowth && summary.profitGrowth > 0 ? "+" : ""}
                  {summary?.profitGrowth?.toFixed(1) || 0}%
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-1">Total Net Profit</p>
              <p className="text-foreground text-2xl font-bold">${summary?.totalProfit?.toLocaleString() || "0"}</p>
            </Card>

            <Card className="p-4 bg-background text-foreground/10 backdrop-blur border-white/20">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 text-blue-500" />
                <Badge variant="secondary">{summary?.totalSKUs || 0}</Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-1">Active SKUs</p>
              <p className="text-foreground text-2xl font-bold">{summary?.profitableSKUs || 0}</p>
              <p className="text-gray-400 text-xs mt-1">profitable</p>
            </Card>

            <Card className="p-4 bg-background text-foreground/10 backdrop-blur border-white/20">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-purple-500" />
                <Badge className="bg-purple-600">{summary?.avgMargin?.toFixed(1) || 0}%</Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-1">Avg Profit Margin</p>
              <p className="text-foreground text-2xl font-bold">{summary?.marginTarget || 20}%</p>
              <p className="text-gray-400 text-xs mt-1">target</p>
            </Card>

            <Card className="p-4 bg-background text-foreground/10 backdrop-blur border-white/20">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
                <Badge variant="destructive">{summary?.killRecommendations || 0}</Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-1">Action Required</p>
              <p className="text-foreground text-2xl font-bold">{summary?.scaleRecommendations || 0}</p>
              <p className="text-gray-400 text-xs mt-1">scale opportunities</p>
            </Card>
          </div>
        </div>

        {/* Filters & Search */}
        <Card className="p-4 bg-background text-foreground/10 backdrop-blur border-white/20 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search SKUs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/5 border-white/20 text-foreground placeholder:text-gray-400"
                />
              </div>
            </div>

            <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
              <SelectTrigger className="w-[140px] bg-background/5 border-white/20 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[160px] bg-background/5 border-white/20 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profit">Sort by Profit</SelectItem>
                <SelectItem value="margin">Sort by Margin</SelectItem>
                <SelectItem value="revenue">Sort by Revenue</SelectItem>
                <SelectItem value="units">Sort by Units</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
              <SelectTrigger className="w-[160px] bg-background/5 border-white/20 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scale">Scale</SelectItem>
                <SelectItem value="monitor">Monitor</SelectItem>
                <SelectItem value="kill">Kill</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="skus" className="space-y-6">
          <TabsList className="bg-background text-foreground/10 backdrop-blur border-white/20">
            <TabsTrigger value="skus" className="data-[state=active]:bg-background text-foreground/20">
              <Package className="w-4 h-4 mr-2" />
              SKUs
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=active]:bg-background text-foreground/20">
              <Zap className="w-4 h-4 mr-2" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-background text-foreground/20">
              <BarChart3 className="w-4 h-4 mr-2" />
              Trends
            </TabsTrigger>
          </TabsList>

          {/* SKUs Tab */}
          <TabsContent value="skus" className="space-y-4">
            {analytics?.skus?.map((sku) => (
              <Card key={sku.id} className="p-6 bg-background text-foreground/10 backdrop-blur border-white/20">
                <div className="flex items-start gap-4">
                  {/* Product Image */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-card flex-shrink-0 text-card-foreground">
                    {sku.imageUrl ? (
                      <img src={sku.imageUrl} alt={sku.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-foreground font-bold text-lg">{sku.name}</h3>
                          <Badge className={getStatusColor(sku.status)}>
                            {sku.status.toUpperCase()}
                          </Badge>
                          {sku.isNewProduct && (
                            <Badge variant="outline" className="text-blue-400 border-blue-400">NEW</Badge>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">SKU: {sku.sku}</p>
                      </div>

                      <div className="flex gap-2">
                        {sku.status === "kill" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => killSKUMutation.mutate({ skuId: sku.id })}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Kill SKU
                          </Button>
                        )}
                        {sku.status === "scale" && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => scaleSKUMutation.mutate({ skuId: sku.id })}
                          >
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Scale Up
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-foreground hover:bg-background/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Net Profit</p>
                        <div className="flex items-center gap-2">
                          <p className={`font-bold text-lg ${sku.netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                            ${sku.netProfit?.toLocaleString()}
                          </p>
                          {getTrendIcon(sku.profitTrend)}
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs mb-1">Margin</p>
                        <p className={`font-bold text-lg ${sku.margin >= 20 ? "text-green-500" : sku.margin >= 10 ? "text-yellow-500" : "text-red-500"}`}>
                          {sku.margin?.toFixed(1)}%
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs mb-1">Revenue</p>
                        <p className="text-foreground font-bold text-lg">${sku.revenue?.toLocaleString()}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs mb-1">Units Sold</p>
                        <p className="text-foreground font-bold text-lg">{sku.unitsSold?.toLocaleString()}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs mb-1">COGS</p>
                        <p className="text-foreground font-bold text-lg">${sku.cogs?.toLocaleString()}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-xs mb-1">Total Costs</p>
                        <p className="text-foreground font-bold text-lg">${sku.totalCosts?.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-background text-foreground/5 rounded-lg">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Shipping</p>
                        <p className="text-muted-foreground text-sm">${sku.shippingCost?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Fees</p>
                        <p className="text-muted-foreground text-sm">${sku.fees?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Returns</p>
                        <p className="text-muted-foreground text-sm">${sku.returnsCost?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Disputes</p>
                        <p className="text-muted-foreground text-sm">${sku.disputesCost?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Other</p>
                        <p className="text-muted-foreground text-sm">${sku.otherCosts?.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Alerts */}
                    {sku.alerts && sku.alerts.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {sku.alerts.map((alert, idx) => (
                          <div key={idx} className={`p-2 rounded-lg flex items-center gap-2 ${
                            alert.severity === "critical" ? "bg-red-500/20 border border-red-500/30" :
                            alert.severity === "warning" ? "bg-yellow-500/20 border border-yellow-500/30" :
                            "bg-blue-500/20 border border-blue-500/30"
                          }`}>
                            <AlertTriangle className={`w-4 h-4 ${
                              alert.severity === "critical" ? "text-red-500" :
                              alert.severity === "warning" ? "text-yellow-500" :
                              "text-blue-500"
                            }`} />
                            <p className="text-foreground text-sm">{alert.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {(!analytics?.skus || analytics.skus.length === 0) && (
              <Card className="p-12 bg-background text-foreground/10 backdrop-blur border-white/20 text-center">
                <Package className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-2xl font-bold text-foreground mb-2">No SKUs Found</h3>
                <p className="text-gray-400">Try adjusting your filters or search query.</p>
              </Card>
            )}
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            {/* Kill Recommendations */}
            {recommendations?.kill && recommendations.kill.length > 0 && (
              <Card className="p-6 bg-red-500/10 border-red-500/30">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <XCircle className="w-6 h-6 text-red-500" />
                  Kill Recommendations ({recommendations.kill.length})
                </h3>
                <div className="space-y-3">
                  {recommendations.kill.map((rec) => (
                    <Card key={rec.skuId} className="p-4 bg-background text-foreground/5 border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-foreground font-semibold mb-1">{rec.skuName}</h4>
                          <p className="text-gray-400 text-sm mb-2">{rec.reason}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-red-500">Loss: ${rec.totalLoss?.toLocaleString()}</span>
                            <span className="text-gray-400">Days unprofitable: {rec.daysUnprofitable}</span>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={() => killSKUMutation.mutate({ skuId: rec.skuId })}
                        >
                          Kill SKU
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {/* Scale Recommendations */}
            {recommendations?.scale && recommendations.scale.length > 0 && (
              <Card className="p-6 bg-green-500/10 border-green-500/30">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                  Scale Recommendations ({recommendations.scale.length})
                </h3>
                <div className="space-y-3">
                  {recommendations.scale.map((rec) => (
                    <Card key={rec.skuId} className="p-4 bg-background text-foreground/5 border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-foreground font-semibold mb-1">{rec.skuName}</h4>
                          <p className="text-gray-400 text-sm mb-2">{rec.reason}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-green-500">Profit: ${rec.totalProfit?.toLocaleString()}</span>
                            <span className="text-gray-400">Margin: {rec.margin?.toFixed(1)}%</span>
                            <span className="text-gray-400">Sell-through: {rec.sellThroughRate?.toFixed(1)}%</span>
                          </div>
                        </div>
                        <Button
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => scaleSKUMutation.mutate({ skuId: rec.skuId })}
                        >
                          Scale Up
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {/* Monitor Recommendations */}
            {recommendations?.monitor && recommendations.monitor.length > 0 && (
              <Card className="p-6 bg-yellow-500/10 border-yellow-500/30">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-yellow-500" />
                  Monitor Closely ({recommendations.monitor.length})
                </h3>
                <div className="space-y-3">
                  {recommendations.monitor.map((rec) => (
                    <Card key={rec.skuId} className="p-4 bg-background text-foreground/5 border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-foreground font-semibold mb-1">{rec.skuName}</h4>
                          <p className="text-gray-400 text-sm mb-2">{rec.reason}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-yellow-500">Margin: {rec.margin?.toFixed(1)}%</span>
                            <span className="text-gray-400">Trend: {rec.trend}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {(!recommendations || (
              (!recommendations.kill || recommendations.kill.length === 0) &&
              (!recommendations.scale || recommendations.scale.length === 0) &&
              (!recommendations.monitor || recommendations.monitor.length === 0)
            )) && (
              <Card className="p-12 bg-background text-foreground/10 backdrop-blur border-white/20 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">All Clear</h3>
                <p className="text-gray-400">No immediate actions required. All SKUs are performing within acceptable ranges.</p>
              </Card>
            )}
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card className="p-6 bg-background text-foreground/10 backdrop-blur border-white/20">
              <h3 className="text-xl font-bold text-foreground mb-4">Profitability Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.profitabilityTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="date" stroke="#ffffff80" />
                  <YAxis stroke="#ffffff80" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#ffffff' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Net Profit ($)" />
                  <Line type="monotone" dataKey="margin" stroke="#8b5cf6" strokeWidth={2} name="Avg Margin (%)" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-background text-foreground/10 backdrop-blur border-white/20">
                <h3 className="text-xl font-bold text-foreground mb-4">Top Profit Contributors</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.topProfitContributors || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="sku" stroke="#ffffff80" />
                    <YAxis stroke="#ffffff80" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#ffffff' }}
                    />
                    <Bar dataKey="profit" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 bg-background text-foreground/10 backdrop-blur border-white/20">
                <h3 className="text-xl font-bold text-foreground mb-4">Margin Distribution</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">High Margin (&gt;30%)</span>
                      <span className="text-green-500 font-bold">{analytics?.marginDistribution?.high || 0} SKUs</span>
                    </div>
                    <div className="h-2 bg-background text-foreground/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500" 
                        style={{ width: `${(analytics?.marginDistribution?.high || 0) / (summary?.totalSKUs || 1) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">Medium Margin (15-30%)</span>
                      <span className="text-blue-500 font-bold">{analytics?.marginDistribution?.medium || 0} SKUs</span>
                    </div>
                    <div className="h-2 bg-background text-foreground/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{ width: `${(analytics?.marginDistribution?.medium || 0) / (summary?.totalSKUs || 1) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">Low Margin (&lt;15%)</span>
                      <span className="text-yellow-500 font-bold">{analytics?.marginDistribution?.low || 0} SKUs</span>
                    </div>
                    <div className="h-2 bg-background text-foreground/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500" 
                        style={{ width: `${(analytics?.marginDistribution?.low || 0) / (summary?.totalSKUs || 1) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">Negative Margin</span>
                      <span className="text-red-500 font-bold">{analytics?.marginDistribution?.negative || 0} SKUs</span>
                    </div>
                    <div className="h-2 bg-background text-foreground/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500" 
                        style={{ width: `${(analytics?.marginDistribution?.negative || 0) / (summary?.totalSKUs || 1) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
