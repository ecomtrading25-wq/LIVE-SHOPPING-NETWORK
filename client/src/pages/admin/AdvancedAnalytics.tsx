import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingCart,
  Package,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Download,
} from "lucide-react";

/**
 * Advanced Analytics Dashboard
 * Revenue forecasting, customer cohort analysis, and funnel visualization
 */

export default function AdvancedAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const [compareMode, setCompareMode] = useState("previous");

  // Mock analytics data
  const metrics = {
    revenue: {
      current: 487250,
      previous: 423100,
      change: 15.2,
      forecast: 550000,
    },
    orders: {
      current: 3842,
      previous: 3456,
      change: 11.2,
    },
    customers: {
      current: 2156,
      previous: 1987,
      change: 8.5,
      new: 432,
      returning: 1724,
    },
    avgOrderValue: {
      current: 126.85,
      previous: 122.40,
      change: 3.6,
    },
    conversionRate: {
      current: 3.8,
      previous: 3.2,
      change: 18.8,
    },
    customerLifetimeValue: {
      current: 842,
      previous: 798,
      change: 5.5,
    },
  };

  // Revenue by channel
  const channelData = [
    { name: "Live Shopping", revenue: 195000, orders: 1537, percentage: 40 },
    { name: "Direct Sales", revenue: 146175, orders: 1153, percentage: 30 },
    { name: "Marketplace", revenue: 97450, orders: 768, percentage: 20 },
    { name: "Affiliate", revenue: 48725, orders: 384, percentage: 10 },
  ];

  // Customer cohort analysis
  const cohortData = [
    { month: "Sep 2025", customers: 450, retention: [100, 68, 52, 41] },
    { month: "Oct 2025", customers: 523, retention: [100, 72, 56] },
    { month: "Nov 2025", customers: 612, retention: [100, 75] },
    { month: "Dec 2025", customers: 571, retention: [100] },
  ];

  // Sales funnel
  const funnelData = [
    { stage: "Visitors", count: 125000, percentage: 100, dropoff: 0 },
    { stage: "Product Views", count: 87500, percentage: 70, dropoff: 30 },
    { stage: "Add to Cart", count: 31250, percentage: 25, dropoff: 45 },
    { stage: "Checkout Started", count: 12500, percentage: 10, dropoff: 60 },
    { stage: "Orders Completed", count: 4750, percentage: 3.8, dropoff: 62 },
  ];

  // Top products
  const topProducts = [
    { name: "Wireless Earbuds Pro", revenue: 48725, units: 325, growth: 23 },
    { name: "Smart Watch Series 5", revenue: 43852, units: 219, growth: 18 },
    { name: "Portable Bluetooth Speaker", revenue: 38960, units: 487, growth: 15 },
    { name: "Fitness Tracker Band", revenue: 29223, units: 389, growth: 12 },
    { name: "USB-C Hub Adapter", revenue: 24361, units: 609, growth: -5 },
  ];

  // Customer segments
  const segments = [
    { name: "VIP Customers", count: 156, revenue: 131423, avgSpend: 842, color: "red" },
    { name: "Frequent Buyers", count: 487, revenue: 97450, avgSpend: 200, color: "blue" },
    { name: "Occasional Shoppers", count: 892, revenue: 71380, avgSpend: 80, color: "green" },
    { name: "New Customers", count: 621, revenue: 37245, avgSpend: 60, color: "yellow" },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Advanced Analytics</h1>
          <p className="text-gray-400 mt-2">Revenue forecasting, cohort analysis, and funnel insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-background text-foreground/5 border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${metrics.revenue.change >= 0 ? "text-green-400" : "text-red-400"}`}>
              {metrics.revenue.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {formatPercentage(metrics.revenue.change)}
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-foreground mb-1">{formatCurrency(metrics.revenue.current)}</p>
          <p className="text-gray-400 text-xs">Forecast: {formatCurrency(metrics.revenue.forecast)}</p>
        </Card>

        <Card className="p-6 bg-background text-foreground/5 border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${metrics.orders.change >= 0 ? "text-green-400" : "text-red-400"}`}>
              {metrics.orders.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {formatPercentage(metrics.orders.change)}
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-foreground">{metrics.orders.current.toLocaleString()}</p>
        </Card>

        <Card className="p-6 bg-background text-foreground/5 border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <Users className="w-6 h-6 text-red-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${metrics.customers.change >= 0 ? "text-green-400" : "text-red-400"}`}>
              {metrics.customers.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {formatPercentage(metrics.customers.change)}
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Active Customers</p>
          <p className="text-3xl font-bold text-foreground">{metrics.customers.current.toLocaleString()}</p>
          <p className="text-gray-400 text-xs">{metrics.customers.new} new, {metrics.customers.returning} returning</p>
        </Card>

        <Card className="p-6 bg-background text-foreground/5 border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Target className="w-6 h-6 text-yellow-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${metrics.conversionRate.change >= 0 ? "text-green-400" : "text-red-400"}`}>
              {metrics.conversionRate.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {formatPercentage(metrics.conversionRate.change)}
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-1">Conversion Rate</p>
          <p className="text-3xl font-bold text-foreground">{metrics.conversionRate.current}%</p>
        </Card>
      </div>

      {/* Revenue by Channel */}
      <Card className="p-6 bg-background text-foreground/5 border-white/10">
        <h2 className="text-2xl font-bold text-foreground mb-6">Revenue by Channel</h2>
        <div className="space-y-4">
          {channelData.map((channel) => (
            <div key={channel.name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-foreground font-medium">{channel.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-gray-400 text-sm">{channel.orders.toLocaleString()} orders</span>
                  <span className="text-foreground font-bold">{formatCurrency(channel.revenue)}</span>
                  <span className="text-red-400 text-sm w-12 text-right">{channel.percentage}%</span>
                </div>
              </div>
              <div className="w-full bg-background text-foreground/10 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${channel.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Funnel */}
        <Card className="p-6 bg-background text-foreground/5 border-white/10">
          <h2 className="text-2xl font-bold text-foreground mb-6">Sales Funnel</h2>
          <div className="space-y-4">
            {funnelData.map((stage, index) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground font-medium">{stage.stage}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-foreground">{stage.count.toLocaleString()}</span>
                    <span className="text-red-400 text-sm w-12 text-right">{stage.percentage}%</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-full bg-background text-foreground/10 rounded-full h-8 flex items-center px-4">
                    <div
                      className="bg-gradient-to-r from-red-500 to-orange-500 h-8 rounded-full absolute left-0 top-0 flex items-center justify-center"
                      style={{ width: `${stage.percentage * 10}%` }}
                    >
                      {index > 0 && stage.dropoff > 0 && (
                        <span className="text-foreground text-xs font-medium">-{stage.dropoff}%</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Customer Cohort Analysis */}
        <Card className="p-6 bg-background text-foreground/5 border-white/10">
          <h2 className="text-2xl font-bold text-foreground mb-6">Customer Cohort Retention</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-2 text-gray-400 text-sm">Cohort</th>
                  <th className="text-center p-2 text-gray-400 text-sm">Size</th>
                  <th className="text-center p-2 text-gray-400 text-sm">M0</th>
                  <th className="text-center p-2 text-gray-400 text-sm">M1</th>
                  <th className="text-center p-2 text-gray-400 text-sm">M2</th>
                  <th className="text-center p-2 text-gray-400 text-sm">M3</th>
                </tr>
              </thead>
              <tbody>
                {cohortData.map((cohort) => (
                  <tr key={cohort.month} className="border-b border-white/5">
                    <td className="p-2 text-foreground text-sm">{cohort.month}</td>
                    <td className="p-2 text-center text-foreground text-sm">{cohort.customers}</td>
                    {cohort.retention.map((rate, index) => (
                      <td key={index} className="p-2 text-center">
                        <div
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            rate >= 70
                              ? "bg-green-500/20 text-green-400"
                              : rate >= 50
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {rate}%
                        </div>
                      </td>
                    ))}
                    {Array(4 - cohort.retention.length)
                      .fill(null)
                      .map((_, index) => (
                        <td key={`empty-${index}`} className="p-2 text-center text-gray-600">
                          —
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="p-6 bg-background text-foreground/5 border-white/10">
        <h2 className="text-2xl font-bold text-foreground mb-6">Top Products by Revenue</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-gray-400 font-medium">Product</th>
                <th className="text-right p-4 text-gray-400 font-medium">Revenue</th>
                <th className="text-right p-4 text-gray-400 font-medium">Units Sold</th>
                <th className="text-right p-4 text-gray-400 font-medium">Growth</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={product.name} className="border-b border-white/5">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-medium">#{index + 1}</span>
                      <span className="text-foreground font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right text-foreground font-bold">
                    {formatCurrency(product.revenue)}
                  </td>
                  <td className="p-4 text-right text-foreground">{product.units.toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <div
                      className={`inline-flex items-center gap-1 ${
                        product.growth >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {product.growth >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {formatPercentage(product.growth)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Customer Segments */}
      <Card className="p-6 bg-background text-foreground/5 border-white/10">
        <h2 className="text-2xl font-bold text-foreground mb-6">Customer Segments</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {segments.map((segment) => (
            <Card key={segment.name} className="p-6 bg-background text-foreground/5 border-white/10">
              <h3 className={`text-lg font-bold text-${segment.color}-400 mb-3`}>{segment.name}</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-gray-400 text-xs">Customers</p>
                  <p className="text-foreground text-2xl font-bold">{segment.count.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Total Revenue</p>
                  <p className="text-foreground text-lg font-bold">{formatCurrency(segment.revenue)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Avg Spend</p>
                  <p className="text-foreground font-medium">{formatCurrency(segment.avgSpend)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
