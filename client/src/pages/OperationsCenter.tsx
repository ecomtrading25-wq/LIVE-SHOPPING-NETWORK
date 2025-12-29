import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  Mail,
  Star,
  BarChart3,
} from "lucide-react";

interface Alert {
  id: string;
  type: "critical" | "warning" | "info";
  message: string;
  time: string;
}

export default function OperationsCenter() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("today");

  // Redirect non-admin users
  if (!isLoading && (!user || user.role !== "admin")) {
    setLocation("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  const [alerts] = useState<Alert[]>([
    {
      id: "1",
      type: "critical",
      message: "Low stock alert: Wireless Headphones (5 units left)",
      time: "2 min ago",
    },
    {
      id: "2",
      type: "warning",
      message: "Supplier delivery delayed: PO-2024-003",
      time: "15 min ago",
    },
    {
      id: "3",
      type: "info",
      message: "New customer milestone: 10,000 total customers",
      time: "1 hour ago",
    },
  ]);

  const metrics = {
    revenue: {
      current: 45678,
      change: 12.5,
      trend: "up",
    },
    orders: {
      current: 234,
      change: 8.3,
      trend: "up",
    },
    customers: {
      current: 1456,
      change: 5.2,
      trend: "up",
    },
    inventory: {
      current: 8934,
      change: -2.1,
      trend: "down",
    },
  };

  const recentOrders = [
    { id: "#12345", customer: "John Doe", amount: 299.99, status: "processing" },
    { id: "#12344", customer: "Jane Smith", amount: 149.99, status: "shipped" },
    { id: "#12343", customer: "Bob Johnson", amount: 499.99, status: "delivered" },
  ];

  const topProducts = [
    { name: "Wireless Headphones", sales: 89, stock: 5, status: "low" },
    { name: "Smart Watch", sales: 67, stock: 45, status: "good" },
    { name: "Laptop Stand", sales: 54, stock: 0, status: "out" },
  ];

  const getAlertColor = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "warning":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "info":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="w-4 h-4" />;
      case "warning":
        return <Clock className="w-4 h-4" />;
      case "info":
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-500/20 text-green-400";
      case "low":
        return "bg-yellow-500/20 text-yellow-400";
      case "out":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Operations Command Center</h1>
              <p className="text-gray-400 mt-1">Real-time business monitoring and control</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={timeRange === "today" ? "default" : "outline"}
                onClick={() => setTimeRange("today")}
                size="sm"
                className={timeRange === "today" ? "bg-purple-600" : "border-border"}
              >
                Today
              </Button>
              <Button
                variant={timeRange === "week" ? "default" : "outline"}
                onClick={() => setTimeRange("week")}
                size="sm"
                className={timeRange === "week" ? "bg-purple-600" : "border-border"}
              >
                Week
              </Button>
              <Button
                variant={timeRange === "month" ? "default" : "outline"}
                onClick={() => setTimeRange("month")}
                size="sm"
                className={timeRange === "month" ? "bg-purple-600" : "border-border"}
              >
                Month
              </Button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8 space-y-2">
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`p-4 border ${getAlertColor(alert.type)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.type)}
                    <p className="font-medium">{alert.message}</p>
                  </div>
                  <span className="text-sm opacity-70">{alert.time}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              {metrics.revenue.trend === "up" ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
            <p className="text-gray-400 text-sm mb-1">Revenue</p>
            <p className="text-3xl font-bold text-foreground mb-2">
              ${metrics.revenue.current.toLocaleString()}
            </p>
            <Badge
              className={
                metrics.revenue.trend === "up"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }
            >
              {metrics.revenue.trend === "up" ? "+" : ""}
              {metrics.revenue.change}%
            </Badge>
          </Card>

          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-400" />
              </div>
              {metrics.orders.trend === "up" ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
            <p className="text-gray-400 text-sm mb-1">Orders</p>
            <p className="text-3xl font-bold text-foreground mb-2">
              {metrics.orders.current.toLocaleString()}
            </p>
            <Badge
              className={
                metrics.orders.trend === "up"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }
            >
              {metrics.orders.trend === "up" ? "+" : ""}
              {metrics.orders.change}%
            </Badge>
          </Card>

          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              {metrics.customers.trend === "up" ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
            <p className="text-gray-400 text-sm mb-1">Customers</p>
            <p className="text-3xl font-bold text-foreground mb-2">
              {metrics.customers.current.toLocaleString()}
            </p>
            <Badge
              className={
                metrics.customers.trend === "up"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }
            >
              {metrics.customers.trend === "up" ? "+" : ""}
              {metrics.customers.change}%
            </Badge>
          </Card>

          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Package className="w-6 h-6 text-orange-400" />
              </div>
              {metrics.inventory.trend === "up" ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
            <p className="text-gray-400 text-sm mb-1">Inventory</p>
            <p className="text-3xl font-bold text-foreground mb-2">
              {metrics.inventory.current.toLocaleString()}
            </p>
            <Badge
              className={
                metrics.inventory.trend === "up"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }
            >
              {metrics.inventory.trend === "up" ? "+" : ""}
              {metrics.inventory.change}%
            </Badge>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Orders */}
          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Recent Orders</h3>
              <ShoppingCart className="w-5 h-5 text-purple-400" />
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-background text-foreground/5 rounded-lg"
                >
                  <div>
                    <p className="text-foreground font-semibold">{order.id}</p>
                    <p className="text-sm text-gray-400">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-bold">${order.amount}</p>
                    <Badge
                      className={
                        order.status === "delivered"
                          ? "bg-green-500/20 text-green-400"
                          : order.status === "shipped"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Products */}
          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Inventory Status</h3>
              <Package className="w-5 h-5 text-purple-400" />
            </div>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-background text-foreground/5 rounded-lg"
                >
                  <div>
                    <p className="text-foreground font-semibold">{product.name}</p>
                    <p className="text-sm text-gray-400">{product.sales} sales</p>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-bold">{product.stock} units</p>
                    <Badge className={getStockStatusColor(product.status)}>
                      {product.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 bg-background text-foreground/5 border-white/10">
          <h3 className="text-xl font-bold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 border-purple-500/30"
            >
              <BarChart3 className="w-6 h-6 text-purple-400" />
              <span className="text-sm">Analytics</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 border-blue-500/30"
            >
              <Package className="w-6 h-6 text-blue-400" />
              <span className="text-sm">Inventory</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 border-green-500/30"
            >
              <Mail className="w-6 h-6 text-green-400" />
              <span className="text-sm">Campaigns</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4 border-orange-500/30"
            >
              <Truck className="w-6 h-6 text-orange-400" />
              <span className="text-sm">Suppliers</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
