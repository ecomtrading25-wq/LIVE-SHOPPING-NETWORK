/**
 * LSN Executive Dashboard - CEO Command Center
 * 
 * Complete real-time view of business health with:
 * - GMV, revenue, profit tracking
 * - Cash flow and reserves monitoring
 * - Top SKUs and creators leaderboards
 * - Operational health metrics
 * - Trust & safety indicators
 * - Live show performance
 * - Inventory health
 * - Financial forecasting
 * - Alert system
 * - Export capabilities
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";

type TimeRange = "today" | "week" | "month" | "quarter" | "year";
type MetricTrend = "up" | "down" | "flat";

interface KPIMetric {
  label: string;
  value: string | number;
  change: number;
  trend: MetricTrend;
  format: "currency" | "number" | "percent";
  icon: any;
  color: string;
}

interface TopPerformer {
  id: string;
  name: string;
  value: number;
  change: number;
  trend: MetricTrend;
  metadata?: Record<string, any>;
}

interface HealthIndicator {
  category: string;
  status: "healthy" | "warning" | "critical";
  score: number;
  issues: string[];
  recommendations: string[];
}

export default function AdminExecutiveDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch executive metrics
  const { data: metrics, refetch: refetchMetrics } = trpc.lsnExecutive.getExecutiveMetrics.useQuery(
    { timeRange },
    { refetchInterval: autoRefresh ? 30000 : false }
  );

  const { data: topSKUs } = trpc.lsnExecutive.getTopSKUs.useQuery(
    { timeRange, limit: 10 },
    { refetchInterval: autoRefresh ? 60000 : false }
  );

  const { data: topCreators } = trpc.lsnExecutive.getTopCreators.useQuery(
    { timeRange, limit: 10 },
    { refetchInterval: autoRefresh ? 60000 : false }
  );

  const { data: healthIndicators } = trpc.lsnExecutive.getHealthIndicators.useQuery(
    {},
    { refetchInterval: autoRefresh ? 30000 : false }
  );

  const { data: cashFlow } = trpc.lsnExecutive.getCashFlowSummary.useQuery(
    { timeRange },
    { refetchInterval: autoRefresh ? 60000 : false }
  );

  const { data: alerts } = trpc.lsnExecutive.getActiveAlerts.useQuery(
    {},
    { refetchInterval: autoRefresh ? 15000 : false }
  );

  // Manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchMetrics(),
    ]);
    setRefreshing(false);
  };

  // Export data
  const handleExport = () => {
    // TODO: Implement export to CSV/PDF
    console.log("Exporting executive dashboard data...");
  };

  // Calculate KPIs
  const kpis: KPIMetric[] = metrics
    ? [
        {
          label: "GMV",
          value: metrics.gmv,
          change: metrics.gmvChange,
          trend: metrics.gmvChange > 0 ? "up" : metrics.gmvChange < 0 ? "down" : "flat",
          format: "currency",
          icon: DollarSign,
          color: "text-green-500",
        },
        {
          label: "Net Profit",
          value: metrics.netProfit,
          change: metrics.netProfitChange,
          trend: metrics.netProfitChange > 0 ? "up" : metrics.netProfitChange < 0 ? "down" : "flat",
          format: "currency",
          icon: TrendingUp,
          color: "text-blue-500",
        },
        {
          label: "Active Creators",
          value: metrics.activeCreators,
          change: metrics.activeCreatorsChange,
          trend: metrics.activeCreatorsChange > 0 ? "up" : metrics.activeCreatorsChange < 0 ? "down" : "flat",
          format: "number",
          icon: Users,
          color: "text-purple-500",
        },
        {
          label: "Live Shows",
          value: metrics.liveShows,
          change: metrics.liveShowsChange,
          trend: metrics.liveShowsChange > 0 ? "up" : metrics.liveShowsChange < 0 ? "down" : "flat",
          format: "number",
          icon: Activity,
          color: "text-pink-500",
        },
        {
          label: "Orders",
          value: metrics.orders,
          change: metrics.ordersChange,
          trend: metrics.ordersChange > 0 ? "up" : metrics.ordersChange < 0 ? "down" : "flat",
          format: "number",
          icon: Package,
          color: "text-orange-500",
        },
        {
          label: "Avg Order Value",
          value: metrics.avgOrderValue,
          change: metrics.avgOrderValueChange,
          trend: metrics.avgOrderValueChange > 0 ? "up" : metrics.avgOrderValueChange < 0 ? "down" : "flat",
          format: "currency",
          icon: BarChart3,
          color: "text-cyan-500",
        },
        {
          label: "Conversion Rate",
          value: metrics.conversionRate,
          change: metrics.conversionRateChange,
          trend: metrics.conversionRateChange > 0 ? "up" : metrics.conversionRateChange < 0 ? "down" : "flat",
          format: "percent",
          icon: TrendingUp,
          color: "text-emerald-500",
        },
        {
          label: "Cash Balance",
          value: metrics.cashBalance,
          change: metrics.cashBalanceChange,
          trend: metrics.cashBalanceChange > 0 ? "up" : metrics.cashBalanceChange < 0 ? "down" : "flat",
          format: "currency",
          icon: DollarSign,
          color: "text-green-600",
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Executive Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Real-time business intelligence and operational health
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-refresh toggle */}
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <Clock className="w-4 h-4 mr-2" />
              Auto-refresh {autoRefresh ? "ON" : "OFF"}
            </Button>

            {/* Time range selector */}
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>

            {/* Refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            {/* Export button */}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Active Alerts */}
        {alerts && alerts.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  Active Alerts ({alerts.length})
                </h3>
                <div className="space-y-2">
                  {alerts.slice(0, 3).map((alert: any) => (
                    <div key={alert.id} className="flex items-center justify-between">
                      <span className="text-sm text-amber-800 dark:text-amber-200">
                        {alert.message}
                      </span>
                      <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>
                        {alert.severity}
                      </Badge>
                    </div>
                  ))}
                  {alerts.length > 3 && (
                    <Button variant="link" size="sm" className="text-amber-600">
                      View all {alerts.length} alerts →
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
              <div className="flex items-center gap-1">
                {kpi.trend === "up" && <ArrowUp className="w-4 h-4 text-green-500" />}
                {kpi.trend === "down" && <ArrowDown className="w-4 h-4 text-red-500" />}
                {kpi.trend === "flat" && <Minus className="w-4 h-4 text-slate-400" />}
                <span
                  className={`text-sm font-medium ${
                    kpi.trend === "up"
                      ? "text-green-600"
                      : kpi.trend === "down"
                      ? "text-red-600"
                      : "text-slate-500"
                  }`}
                >
                  {kpi.change > 0 ? "+" : ""}
                  {kpi.change.toFixed(1)}%
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{kpi.label}</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {kpi.format === "currency" && "$"}
                {typeof kpi.value === "number"
                  ? kpi.value.toLocaleString(undefined, {
                      minimumFractionDigits: kpi.format === "currency" ? 2 : 0,
                      maximumFractionDigits: kpi.format === "currency" ? 2 : 0,
                    })
                  : kpi.value}
                {kpi.format === "percent" && "%"}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top SKUs */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-500" />
                Top Performing SKUs
              </h3>
              <div className="space-y-3">
                {topSKUs?.map((sku: any, index: number) => (
                  <div
                    key={sku.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-card hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-card-foreground"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-foreground font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {sku.name}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {sku.unitsSold} units sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        ${sku.revenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        ${sku.profit.toLocaleString()} profit
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Creators */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Top Performing Creators
              </h3>
              <div className="space-y-3">
                {topCreators?.map((creator: any, index: number) => (
                  <div
                    key={creator.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-card hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-card-foreground"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-foreground font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {creator.name}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {creator.showsCount} shows • {creator.avgViewers} avg viewers
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        ${creator.gmv.toLocaleString()}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        ${creator.commission.toLocaleString()} earned
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Revenue Chart Placeholder */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              Revenue Trend ({timeRange})
            </h3>
            <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-card rounded-lg text-card-foreground">
              <p className="text-slate-500 dark:text-slate-400">
                Chart visualization (integrate with charting library)
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Cash Inflow
              </h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${cashFlow?.inflow.toLocaleString() || "0"}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                +{cashFlow?.inflowChange || 0}% vs last period
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Cash Outflow
              </h3>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                ${cashFlow?.outflow.toLocaleString() || "0"}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                {cashFlow?.outflowChange || 0}% vs last period
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Net Cash Flow
              </h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                ${cashFlow?.netFlow.toLocaleString() || "0"}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                {cashFlow?.netFlowChange || 0}% vs last period
              </p>
            </Card>
          </div>

          {/* P&L Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Profit & Loss Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Gross Revenue</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  ${metrics?.grossRevenue.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Cost of Goods Sold</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  -${metrics?.cogs.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                <span className="font-medium text-slate-900 dark:text-slate-100">Gross Profit</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  ${metrics?.grossProfit.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Operating Expenses</span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  -${metrics?.opex.toLocaleString() || "0"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 bg-slate-50 dark:bg-card rounded-lg px-4 text-card-foreground">
                <span className="font-bold text-slate-900 dark:text-slate-100">Net Profit</span>
                <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">
                  ${metrics?.netProfit.toLocaleString() || "0"}
                </span>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Pending Orders
              </h3>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {metrics?.pendingOrders || 0}
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Fulfillment Rate
              </h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {metrics?.fulfillmentRate || 0}%
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Avg Fulfillment Time
              </h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {metrics?.avgFulfillmentTime || 0}h
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Low Stock Items
              </h3>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {metrics?.lowStockItems || 0}
              </p>
            </Card>
          </div>

          {/* Operational Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Operational Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                  Customer Service
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Open Tickets</span>
                    <span className="font-semibold">{metrics?.openTickets || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Response Time</span>
                    <span className="font-semibold">{metrics?.avgResponseTime || 0}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">CSAT Score</span>
                    <span className="font-semibold text-green-600">
                      {metrics?.csatScore || 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                  Live Shows
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Shows Today</span>
                    <span className="font-semibold">{metrics?.showsToday || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Viewers</span>
                    <span className="font-semibold">{metrics?.avgViewers || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Conversion Rate</span>
                    <span className="font-semibold text-blue-600">
                      {metrics?.showConversionRate || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {healthIndicators?.map((indicator: HealthIndicator) => (
              <Card key={indicator.category} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {indicator.category}
                  </h3>
                  <Badge
                    variant={
                      indicator.status === "healthy"
                        ? "default"
                        : indicator.status === "warning"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {indicator.status}
                  </Badge>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Health Score
                    </span>
                    <span className="font-semibold">{indicator.score}/100</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        indicator.status === "healthy"
                          ? "bg-green-500"
                          : indicator.status === "warning"
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${indicator.score}%` }}
                    />
                  </div>
                </div>

                {indicator.issues.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Issues
                    </h4>
                    <ul className="space-y-1">
                      {indicator.issues.map((issue, idx) => (
                        <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {indicator.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Recommendations
                    </h4>
                    <ul className="space-y-1">
                      {indicator.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Forecasting Tab */}
        <TabsContent value="forecasting" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Forecast (Next 30 Days)</h3>
            <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-card rounded-lg text-card-foreground">
              <p className="text-slate-500 dark:text-slate-400">
                Forecasting chart (integrate with ML predictions)
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Projected GMV (30d)
              </h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                ${metrics?.projectedGMV30d?.toLocaleString() || "0"}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                ±{metrics?.projectedGMV30dConfidence || 0}% confidence
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Projected Profit (30d)
              </h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                ${metrics?.projectedProfit30d?.toLocaleString() || "0"}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                ±{metrics?.projectedProfit30dConfidence || 0}% confidence
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Projected Orders (30d)
              </h3>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {metrics?.projectedOrders30d?.toLocaleString() || "0"}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                ±{metrics?.projectedOrders30dConfidence || 0}% confidence
              </p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Last updated: {new Date().toLocaleString()} • Auto-refresh:{" "}
        {autoRefresh ? "Enabled" : "Disabled"}
      </div>
    </div>
  );
}
