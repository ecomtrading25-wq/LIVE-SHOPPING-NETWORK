import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar,
  BarChart3,
  Package,
  RefreshCw,
} from "lucide-react";

export default function OrderAnalyticsPage() {
  const stats = {
    totalSpent: 12456.78,
    totalOrders: 34,
    avgOrderValue: 366.37,
    thisMonth: 1234.56,
    lastMonth: 987.65,
  };

  const monthlySpending = [
    { month: "Jan", amount: 890 },
    { month: "Feb", amount: 1234 },
    { month: "Mar", amount: 756 },
    { month: "Apr", amount: 1456 },
    { month: "May", amount: 1123 },
    { month: "Jun", amount: 1234 },
  ];

  const topCategories = [
    { name: "Electronics", spent: 4567, orders: 12, percentage: 36.7 },
    { name: "Fashion", spent: 3456, orders: 15, percentage: 27.8 },
    { name: "Home & Garden", spent: 2345, orders: 5, percentage: 18.8 },
    { name: "Beauty", spent: 1234, orders: 2, percentage: 9.9 },
  ];

  const reorderSuggestions = [
    {
      id: "PROD-001",
      name: "Coffee Beans Premium Blend",
      lastPurchased: "2025-11-27",
      frequency: 30,
      price: 24.99,
      daysUntilReorder: 3,
    },
    {
      id: "PROD-002",
      name: "Protein Powder Chocolate",
      lastPurchased: "2025-11-15",
      frequency: 45,
      price: 49.99,
      daysUntilReorder: 15,
    },
  ];

  const maxSpending = Math.max(...monthlySpending.map((m) => m.amount));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b bg-card text-card-foreground">
        <div className="container py-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold">Order Analytics</h1>
          </div>
          <p className="text-muted-foreground">
            Insights into your shopping habits and spending patterns
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold mb-1">${stats.totalSpent.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">All time</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <ShoppingBag className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.totalOrders}</p>
            <p className="text-xs text-muted-foreground">Completed orders</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Avg Order Value</p>
              <TrendingUp className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold mb-1">${stats.avgOrderValue}</p>
            <p className="text-xs text-muted-foreground">Per order</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">This Month</p>
              <Calendar className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold mb-1">${stats.thisMonth.toLocaleString()}</p>
            <p className="text-xs text-green-500">
              +{(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100).toFixed(1)}% vs last month
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Monthly Spending Chart */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Monthly Spending Trend</h2>
              <div className="space-y-4">
                {monthlySpending.map((month) => (
                  <div key={month.month}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{month.month}</span>
                      <span className="text-muted-foreground">${month.amount}</span>
                    </div>
                    <div className="h-8 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-red-500"
                        style={{ width: `${(month.amount / maxSpending) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Categories */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Spending by Category</h2>
              <div className="space-y-4">
                {topCategories.map((category) => (
                  <Card key={category.name} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {category.orders} orders
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${category.spent.toLocaleString()}</p>
                        <Badge className="bg-blue-500/20 text-blue-400">
                          {category.percentage}%
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Smart Reorder Suggestions */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-green-500" />
                Smart Reorder
              </h2>
              <div className="space-y-4">
                {reorderSuggestions.map((product) => (
                  <Card key={product.id} className="p-4 bg-green-500/10 border-green-500/20">
                    <div className="mb-3">
                      <h3 className="font-bold mb-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Last purchased: {new Date(product.lastPurchased).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Reorder in {product.daysUntilReorder} days
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold">${product.price}</p>
                      <Button size="sm">
                        <Package className="w-4 h-4 mr-2" />
                        Reorder Now
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Purchase Patterns */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Purchase Patterns</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Most Active Day</p>
                  <p className="font-bold text-lg">Saturday</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Favorite Brand</p>
                  <p className="font-bold text-lg">TechPro</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Avg Time Between Orders</p>
                  <p className="font-bold text-lg">12 days</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
