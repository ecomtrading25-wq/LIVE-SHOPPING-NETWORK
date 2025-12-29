import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  Calendar,
  BarChart3,
  Download,
} from "lucide-react";
import { toast } from "sonner";

export default function InventoryForecastingPage() {
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "reorder" | "trending" | "slow"
  >("overview");

  // Placeholder data - would come from tRPC endpoints
  const forecasts = [
    {
      productId: "1",
      productName: "Wireless Headphones Pro",
      currentStock: 45,
      dailyVelocity: 3.2,
      weeklyVelocity: 22.4,
      monthlyVelocity: 96,
      daysUntilStockout: 14,
      suggestedReorderQuantity: 150,
      suggestedReorderDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      confidence: 85,
      trend: "increasing" as const,
    },
    {
      productId: "2",
      productName: "Smart Watch Ultra",
      currentStock: 8,
      dailyVelocity: 2.1,
      weeklyVelocity: 14.7,
      monthlyVelocity: 63,
      daysUntilStockout: 4,
      suggestedReorderQuantity: 100,
      suggestedReorderDate: new Date(),
      confidence: 92,
      trend: "stable" as const,
    },
    {
      productId: "3",
      productName: "Fitness Tracker Band",
      currentStock: 120,
      dailyVelocity: 1.5,
      weeklyVelocity: 10.5,
      monthlyVelocity: 45,
      daysUntilStockout: 80,
      suggestedReorderQuantity: 75,
      suggestedReorderDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      confidence: 78,
      trend: "decreasing" as const,
    },
    {
      productId: "4",
      productName: "Bluetooth Speaker Mini",
      currentStock: 15,
      dailyVelocity: 4.8,
      weeklyVelocity: 33.6,
      monthlyVelocity: 144,
      daysUntilStockout: 3,
      suggestedReorderQuantity: 200,
      suggestedReorderDate: new Date(),
      confidence: 95,
      trend: "increasing" as const,
    },
    {
      productId: "5",
      productName: "USB-C Cable 2m",
      currentStock: 200,
      dailyVelocity: 5.2,
      weeklyVelocity: 36.4,
      monthlyVelocity: 156,
      daysUntilStockout: 38,
      suggestedReorderQuantity: 250,
      suggestedReorderDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
      confidence: 88,
      trend: "stable" as const,
    },
  ];

  const reorderAlerts = forecasts.filter((f) => f.daysUntilStockout <= 14);
  const trendingProducts = forecasts.filter((f) => f.trend === "increasing");
  const slowMoving = forecasts.filter((f) => f.trend === "decreasing");

  const getTrendIcon = (trend: string) => {
    if (trend === "increasing")
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === "decreasing")
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <BarChart3 className="h-4 w-4 text-gray-500" />;
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 3) return "bg-red-500";
    if (days <= 7) return "bg-orange-500";
    if (days <= 14) return "bg-yellow-500";
    return "bg-green-500";
  };

  const exportForecast = () => {
    toast.success("Forecast exported to CSV");
  };

  const createPurchaseOrder = (forecast: any) => {
    toast.success(
      `Purchase order created for ${forecast.suggestedReorderQuantity} units`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Forecasting</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered demand prediction and reorder recommendations
          </p>
        </div>
        <Button onClick={exportForecast} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forecasts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Being tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reorder Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {reorderAlerts.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trending Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {trendingProducts.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Increasing demand
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Slow Moving
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {slowMoving.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Decreasing demand
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={selectedTab === "overview" ? "default" : "ghost"}
          onClick={() => setSelectedTab("overview")}
        >
          Overview
        </Button>
        <Button
          variant={selectedTab === "reorder" ? "default" : "ghost"}
          onClick={() => setSelectedTab("reorder")}
        >
          Reorder Alerts ({reorderAlerts.length})
        </Button>
        <Button
          variant={selectedTab === "trending" ? "default" : "ghost"}
          onClick={() => setSelectedTab("trending")}
        >
          Trending ({trendingProducts.length})
        </Button>
        <Button
          variant={selectedTab === "slow" ? "default" : "ghost"}
          onClick={() => setSelectedTab("slow")}
        >
          Slow Moving ({slowMoving.length})
        </Button>
      </div>

      {/* Forecast Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedTab === "overview" && "All Products"}
            {selectedTab === "reorder" && "Products Needing Reorder"}
            {selectedTab === "trending" && "Trending Products"}
            {selectedTab === "slow" && "Slow Moving Products"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-left p-3 font-medium">Current Stock</th>
                  <th className="text-left p-3 font-medium">Daily Velocity</th>
                  <th className="text-left p-3 font-medium">
                    Days Until Stockout
                  </th>
                  <th className="text-left p-3 font-medium">Trend</th>
                  <th className="text-left p-3 font-medium">
                    Suggested Reorder
                  </th>
                  <th className="text-left p-3 font-medium">Reorder Date</th>
                  <th className="text-left p-3 font-medium">Confidence</th>
                  <th className="text-left p-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {(selectedTab === "overview"
                  ? forecasts
                  : selectedTab === "reorder"
                    ? reorderAlerts
                    : selectedTab === "trending"
                      ? trendingProducts
                      : slowMoving
                ).map((forecast) => (
                  <tr key={forecast.productId} className="border-b">
                    <td className="p-3">
                      <div className="font-medium">{forecast.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {forecast.productId}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {forecast.currentStock}
                      </div>
                    </td>
                    <td className="p-3">
                      <div>{forecast.dailyVelocity.toFixed(1)} / day</div>
                      <div className="text-sm text-muted-foreground">
                        {forecast.monthlyVelocity} / month
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge
                        className={`${getUrgencyColor(forecast.daysUntilStockout)} text-foreground`}
                      >
                        {forecast.daysUntilStockout} days
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(forecast.trend)}
                        <span className="capitalize">{forecast.trend}</span>
                      </div>
                    </td>
                    <td className="p-3 font-medium">
                      {forecast.suggestedReorderQuantity} units
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {forecast.suggestedReorderDate.toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${forecast.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm">{forecast.confidence}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      {forecast.daysUntilStockout <= 14 && (
                        <Button
                          size="sm"
                          onClick={() => createPurchaseOrder(forecast)}
                        >
                          Create PO
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {reorderAlerts.filter((f) => f.daysUntilStockout <= 3).length > 0 && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Critical Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reorderAlerts
                .filter((f) => f.daysUntilStockout <= 3)
                .map((forecast) => (
                  <div
                    key={forecast.productId}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{forecast.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        Only {forecast.currentStock} units left - will run out
                        in {forecast.daysUntilStockout} days
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => createPurchaseOrder(forecast)}
                    >
                      Order Now
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
