import { useState } from "react";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
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
  return (
    <AdminProtectedRoute>
      <AnalyticsDashboardContent />
    </AdminProtectedRoute>
  );
}

function AnalyticsDashboardContent() {
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

  // Chart.js data
  const salesTrendData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Revenue",
        data: [12000, 19000, 15000, 25000, 22000, 30000, 28000, 35000, 32000, 40000, 38000, 45000],
        borderColor: "rgb(168, 85, 247)",
        backgroundColor: "rgba(168, 85, 247, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const topProductsData = {
    labels: topProducts.map((p) => p.name),
    datasets: [
      {
        label: "Revenue",
        data: topProducts.map((p) => p.revenue),
        backgroundColor: [
          "rgba(168, 85, 247, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(251, 146, 60, 0.8)",
        ],
      },
    ],
  };

  const customerSegmentData = {
    labels: customerSegments.map((s) => s.name),
    datasets: [
      {
        data: customerSegments.map((s) => s.percentage),
        backgroundColor: [
          "rgba(168, 85, 247, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(34, 197, 94, 0.8)",
        ],
      },
    ],
  };

  const revenueBreakdownData = {
    labels: ["Products", "Live Sessions", "Subscriptions", "Affiliates"],
    datasets: [
      {
        data: [45, 30, 15, 10],
        backgroundColor: [
          "rgba(168, 85, 247, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(34, 197, 94, 0.8)",
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "rgb(209, 213, 219)",
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "rgb(156, 163, 175)" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
      y: {
        ticks: { color: "rgb(156, 163, 175)" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
    },
  };

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
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-gray-400 mt-1">Real-time business intelligence</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={timeRange === "today" ? "default" : "outline"}
                onClick={() => setTimeRange("today")}
                size="sm"
                className={timeRange === "today" ? "bg-red-600" : "border-border"}
              >
                Today
              </Button>
              <Button
                variant={timeRange === "week" ? "default" : "outline"}
                onClick={() => setTimeRange("week")}
                size="sm"
                className={timeRange === "week" ? "bg-red-600" : "border-border"}
              >
                Week
              </Button>
              <Button
                variant={timeRange === "month" ? "default" : "outline"}
                onClick={() => setTimeRange("month")}
                size="sm"
                className={timeRange === "month" ? "bg-red-600" : "border-border"}
              >
                Month
              </Button>
              <Button
                variant={timeRange === "year" ? "default" : "outline"}
                onClick={() => setTimeRange("year")}
                size="sm"
                className={timeRange === "year" ? "bg-red-600" : "border-border"}
              >
                Year
              </Button>
              <Button variant="outline" size="sm" className="border-border ml-2">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              {getChangeIcon(metrics.revenue.change)}
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-foreground mb-2">
              {formatCurrency(metrics.revenue.current)}
            </p>
            <div className="flex items-center gap-2">
              <Badge className={metrics.revenue.change >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                {metrics.revenue.change >= 0 ? "+" : ""}{metrics.revenue.change}%
              </Badge>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          </Card>

          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-400" />
              </div>
              {getChangeIcon(metrics.orders.change)}
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-foreground mb-2">
              {metrics.orders.current.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <Badge className={metrics.orders.change >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                {metrics.orders.change >= 0 ? "+" : ""}{metrics.orders.change}%
              </Badge>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          </Card>

          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <Users className="w-6 h-6 text-red-400" />
              </div>
              {getChangeIcon(metrics.customers.change)}
            </div>
            <p className="text-gray-400 text-sm mb-1">Total Customers</p>
            <p className="text-3xl font-bold text-foreground mb-2">
              {metrics.customers.current.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <Badge className={metrics.customers.change >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                {metrics.customers.change >= 0 ? "+" : ""}{metrics.customers.change}%
              </Badge>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          </Card>

          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Target className="w-6 h-6 text-orange-400" />
              </div>
              {getChangeIcon(metrics.conversionRate.change)}
            </div>
            <p className="text-gray-400 text-sm mb-1">Conversion Rate</p>
            <p className="text-3xl font-bold text-foreground mb-2">
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
          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Top Products</h3>
              <Package className="w-5 h-5 text-red-400" />
            </div>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-3 bg-background text-foreground/5 rounded-lg"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-red-500/20 rounded-full">
                    <span className="text-sm font-bold text-red-400">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-medium">{product.name}</p>
                    <p className="text-sm text-gray-400">
                      {product.sales} sales
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-bold">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Customer Segments */}
          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Customer Segments</h3>
              <Users className="w-5 h-5 text-red-400" />
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
                            ? "bg-red-500/20 text-red-400"
                            : segment.name === "Regular"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-green-500/20 text-green-400"
                        }
                      >
                        {segment.name}
                      </Badge>
                      <span className="text-foreground font-medium">
                        {segment.count} customers
                      </span>
                    </div>
                    <span className="text-foreground font-bold">
                      {formatCurrency(segment.revenue)}
                    </span>
                  </div>
                  <div className="h-2 bg-card rounded-full overflow-hidden text-card-foreground">
                    <div
                      className={`h-full ${
                        segment.name === "VIP"
                          ? "bg-yellow-500"
                          : segment.name === "Loyal"
                          ? "bg-red-500"
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

        {/* Chart.js Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Sales Trend Line Chart */}
          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Sales Trend</h3>
              <TrendingUp className="w-5 h-5 text-red-400" />
            </div>
            <div className="h-64">
              <Line data={salesTrendData} options={chartOptions} />
            </div>
          </Card>

          {/* Top Products Bar Chart */}
          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Product Performance</h3>
              <Package className="w-5 h-5 text-red-400" />
            </div>
            <div className="h-64">
              <Bar data={topProductsData} options={chartOptions} />
            </div>
          </Card>

          {/* Customer Segment Pie Chart */}
          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Customer Distribution</h3>
              <Users className="w-5 h-5 text-red-400" />
            </div>
            <div className="h-64 flex items-center justify-center">
              <div className="w-64 h-64">
                <Pie data={customerSegmentData} options={{ ...chartOptions, scales: undefined }} />
              </div>
            </div>
          </Card>

          {/* Revenue Breakdown Doughnut Chart */}
          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Revenue Sources</h3>
              <DollarSign className="w-5 h-5 text-red-400" />
            </div>
            <div className="h-64 flex items-center justify-center">
              <div className="w-64 h-64">
                <Doughnut data={revenueBreakdownData} options={{ ...chartOptions, scales: undefined }} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
