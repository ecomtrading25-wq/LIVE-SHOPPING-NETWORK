import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Calendar,
} from "lucide-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

/**
 * Analytics Dashboard
 * Visual metrics and charts for business intelligence
 */

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  const { data: metrics } = trpc.analytics.dashboard.useQuery();
  const { data: revenueData } = trpc.analytics.revenue.useQuery({
    days: dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90,
  });

  // Revenue Chart Data
  const revenueChartData = {
    labels: revenueData?.map((d) => d.date) || [],
    datasets: [
      {
        label: "Revenue",
        data: revenueData?.map((d) => parseFloat(d.revenue)) || [],
        borderColor: "rgb(147, 51, 234)",
        backgroundColor: "rgba(147, 51, 234, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Orders Chart Data
  const ordersChartData = {
    labels: revenueData?.map((d) => d.date) || [],
    datasets: [
      {
        label: "Orders",
        data: revenueData?.map((d) => d.orders) || [],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
      },
    ],
  };

  // Status Distribution Data
  const statusData = {
    labels: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    datasets: [
      {
        data: [
          metrics?.ordersByStatus?.pending || 0,
          metrics?.ordersByStatus?.processing || 0,
          metrics?.ordersByStatus?.shipped || 0,
          metrics?.ordersByStatus?.delivered || 0,
          metrics?.ordersByStatus?.cancelled || 0,
        ],
        backgroundColor: [
          "rgba(234, 179, 8, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(147, 51, 234, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#fff",
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#9ca3af" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
      y: {
        ticks: { color: "#9ca3af" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: "#fff",
        },
      },
    },
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">Business intelligence and metrics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={dateRange === "7d" ? "default" : "outline"}
            onClick={() => setDateRange("7d")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            7 Days
          </Button>
          <Button
            variant={dateRange === "30d" ? "default" : "outline"}
            onClick={() => setDateRange("30d")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            30 Days
          </Button>
          <Button
            variant={dateRange === "90d" ? "default" : "outline"}
            onClick={() => setDateRange("90d")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            90 Days
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Revenue</p>
              <p className="text-3xl font-bold text-white mt-2">
                ${parseFloat(metrics?.totalRevenue || "0").toLocaleString()}
              </p>
              <p className="text-sm text-green-400 mt-2 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12.5% from last period
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Orders</p>
              <p className="text-3xl font-bold text-white mt-2">
                {metrics?.totalOrders?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-blue-400 mt-2 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +8.2% from last period
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Products</p>
              <p className="text-3xl font-bold text-white mt-2">
                {metrics?.totalProducts?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-purple-400 mt-2 flex items-center">
                <Package className="w-4 h-4 mr-1" />
                {metrics?.lowStockCount || 0} low stock
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Order Value</p>
              <p className="text-3xl font-bold text-white mt-2">
                $
                {metrics?.totalOrders && metrics?.totalRevenue
                  ? (
                      parseFloat(metrics.totalRevenue) / metrics.totalOrders
                    ).toFixed(2)
                  : "0.00"}
              </p>
              <p className="text-sm text-yellow-400 mt-2 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +5.3% from last period
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Trend */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
          <div className="h-80">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </Card>

        {/* Orders Volume */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Orders Volume</h3>
          <div className="h-80">
            <Bar data={ordersChartData} options={chartOptions} />
          </div>
        </Card>
      </div>

      {/* Order Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white/5 border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">
            Order Status Distribution
          </h3>
          <div className="h-80">
            <Doughnut data={statusData} options={doughnutOptions} />
          </div>
        </Card>

        {/* Top Metrics Summary */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Performance Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Conversion Rate</p>
                <p className="text-2xl font-bold text-white">3.2%</p>
              </div>
              <div className="text-green-400 text-sm">+0.5%</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Fulfillment Rate</p>
                <p className="text-2xl font-bold text-white">94.8%</p>
              </div>
              <div className="text-green-400 text-sm">+2.1%</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Return Rate</p>
                <p className="text-2xl font-bold text-white">2.1%</p>
              </div>
              <div className="text-red-400 text-sm">-0.3%</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Customer Satisfaction</p>
                <p className="text-2xl font-bold text-white">4.7/5.0</p>
              </div>
              <div className="text-green-400 text-sm">+0.2</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
