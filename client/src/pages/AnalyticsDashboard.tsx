import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Eye,
  Target,
  Calendar,
  Download,
} from "lucide-react";

/**
 * Analytics Dashboard
 * Real-time business intelligence and sales metrics
 */
export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "year">("month");

  const metrics = {
    revenue: {
      current: 45678.90,
      previous: 38234.50,
      change: 19.5,
    },
    orders: {
      current: 234,
      previous: 198,
      change: 18.2,
    },
    customers: {
      current: 1456,
      previous: 1289,
      change: 13.0,
    },
    conversionRate: {
      current: 3.8,
      previous: 3.2,
      change: 18.8,
    },
  };

  const topProducts = [
    { id: "1", name: "Wireless Headphones", sales: 89, revenue: 26670 },
    { id: "2", name: "Smart Watch", sales: 67, revenue: 26800 },
    { id: "3", name: "Laptop Stand", sales: 54, revenue: 4320 },
    { id: "4", name: "USB-C Cable", sales: 123, revenue: 2460 },
    { id: "5", name: "Phone Case", sales: 98, revenue: 1960 },
  ];

  const customerSegments = [
    { name: "VIP", count: 145, percentage: 10, revenue: 18234 },
    { name: "Loyal", count: 423, percentage: 29, revenue: 15678 },
    { name: "Regular", count: 567, percentage: 39, revenue: 8934 },
    { name: "New", count: 321, percentage: 22, revenue: 2832 },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-400" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-400" />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white">Analytics Dashboard</h1>
              <p className="text-gray-400 mt-1">Real-time business intelligence</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={timeRange === "today" ? "default" : "outline"}
                onClick={() => setTimeRange("today")}
                size="sm"
                className={timeRange === "today" ? "bg-purple-600" : "border-gray-700"}
              >
                Today
              </Button>
              <Button
                variant={timeRange === "week" ? "default" : "outline"}
                onClick={() => setTimeRange("week")}
                size="sm"
                className={timeRange === "week" ? "bg-purple-600" : "border-gray-700"}
              >
                Week
              </Button>
              <Button
                variant={timeRange === "month" ? "default" : "outline"}
                onClick={() => setTimeRange("month")}
                size="sm"
                className={timeRange === "month" ? "bg-purple-600" : "border-gray-700"}
              >
                Month
              </Button>
              <Button
                variant={timeRange === "year" ? "default" : "outline"}
                onClick={() => setTimeRange("year")}
                size="sm"
                className={timeRange === "year" ? "bg-purple-600" : "border-gray-700"}
              >
                Year
              </Button>
              <Button variant="outline" size="sm" className="border-gray-700 ml-2">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              {getChangeIcon(metrics.revenue.change)}
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-white mb-2">
              {formatCurrency(metrics.revenue.current)}
            </p>
            <div className="flex items-center gap-2">
              <Badge className={metrics.revenue.change >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                {metrics.revenue.change >= 0 ? "+" : ""}{metrics.revenue.change}%
              </Badge>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-400" />
              </div>
              {getChangeIcon(metrics.orders.change)}
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-white mb-2">
              {metrics.orders.current.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <Badge className={metrics.orders.change >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                {metrics.orders.change >= 0 ? "+" : ""}{metrics.orders.change}%
              </Badge>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              {getChangeIcon(metrics.customers.change)}
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Customers</p>
            <p className="text-3xl font-bold text-white mb-2">
              {metrics.customers.current.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <Badge className={metrics.customers.change >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                {metrics.customers.change >= 0 ? "+" : ""}{metrics.customers.change}%
              </Badge>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Target className="w-6 h-6 text-orange-400" />
              </div>
              {getChangeIcon(metrics.conversionRate.change)}
            </div>
            <p className="text-gray-400 text-sm mb-1">Conversion Rate</p>
            <p className="text-3xl font-bold text-white mb-2">
              {metrics.conversionRate.current}%
            </p>
            <div className="flex items-center gap-2">
              <Badge className={metrics.conversionRate.change >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                {metrics.conversionRate.change >= 0 ? "+" : ""}{metrics.conversionRate.change}%
              </Badge>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Top Products</h3>
              <Package className="w-5 h-5 text-purple-400" />
            </div>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-500/20 rounded-full">
                    <span className="text-sm font-bold text-purple-400">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{product.name}</p>
                    <p className="text-sm text-gray-400">
                      {product.sales} sales
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Customer Segments */}
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Customer Segments</h3>
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div className="space-y-4">
              {customerSegments.map((segment) => (
                <div key={segment.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge
                        className={
                          segment.name === "VIP"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : segment.name === "Loyal"
                            ? "bg-purple-500/20 text-purple-400"
                            : segment.name === "Regular"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-green-500/20 text-green-400"
                        }
                      >
                        {segment.name}
                      </Badge>
                      <span className="text-white font-medium">
                        {segment.count} customers
                      </span>
                    </div>
                    <span className="text-white font-bold">
                      {formatCurrency(segment.revenue)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        segment.name === "VIP"
                          ? "bg-yellow-500"
                          : segment.name === "Loyal"
                          ? "bg-purple-500"
                          : segment.name === "Regular"
                          ? "bg-blue-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${segment.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
