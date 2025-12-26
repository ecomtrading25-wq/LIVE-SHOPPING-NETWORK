import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart3,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function DynamicPricingPage() {
  const [selectedTab, setSelectedTab] = useState<
    "recommendations" | "history" | "rules"
  >("recommendations");

  // Placeholder data - would come from tRPC endpoints
  const pricingRecommendations = [
    {
      productId: "1",
      productName: "Wireless Headphones Pro",
      currentPrice: 79.99,
      suggestedPrice: 71.99,
      reason: "Low sales velocity detected",
      expectedImpact: "+30% sales volume expected",
      confidence: 85,
      salesLast30Days: 8,
      competitorPrice: 69.99,
      priceChange: -10,
    },
    {
      productId: "2",
      productName: "Smart Watch Ultra",
      currentPrice: 199.99,
      suggestedPrice: 219.99,
      reason: "High demand detected",
      expectedImpact: "Maintain volume while increasing revenue",
      confidence: 92,
      salesLast30Days: 145,
      competitorPrice: 229.99,
      priceChange: 10,
    },
    {
      productId: "3",
      productName: "Bluetooth Speaker Mini",
      currentPrice: 39.99,
      suggestedPrice: 35.99,
      reason: "Competitor pricing pressure",
      expectedImpact: "+25% market share gain",
      confidence: 78,
      salesLast30Days: 45,
      competitorPrice: 34.99,
      priceChange: -10,
    },
    {
      productId: "4",
      productName: "USB-C Cable 2m",
      currentPrice: 12.99,
      suggestedPrice: 14.29,
      reason: "Premium positioning opportunity",
      expectedImpact: "+15% revenue with minimal volume loss",
      confidence: 88,
      salesLast30Days: 234,
      competitorPrice: 15.99,
      priceChange: 10,
    },
  ];

  const priceHistory = [
    {
      date: "2025-01-15",
      productName: "Wireless Headphones Pro",
      oldPrice: 89.99,
      newPrice: 79.99,
      reason: "Seasonal promotion",
      impactRevenue: -8.5,
      impactVolume: 42,
    },
    {
      date: "2025-01-10",
      productName: "Smart Watch Ultra",
      oldPrice: 189.99,
      newPrice: 199.99,
      reason: "High demand adjustment",
      impactRevenue: 12.3,
      impactVolume: -3,
    },
    {
      date: "2025-01-05",
      productName: "Fitness Tracker Band",
      oldPrice: 59.99,
      newPrice: 54.99,
      reason: "Inventory clearance",
      impactRevenue: -15.2,
      impactVolume: 67,
    },
  ];

  const pricingRules = [
    {
      id: "1",
      name: "Competitor Price Match",
      description: "Match competitor prices within 5% when below our price",
      enabled: true,
      priority: 1,
    },
    {
      id: "2",
      name: "Low Stock Premium",
      description: "Increase price by 10% when stock below 20 units",
      enabled: true,
      priority: 2,
    },
    {
      id: "3",
      name: "High Velocity Optimization",
      description: "Increase price by 5-15% for products selling >100/month",
      enabled: true,
      priority: 3,
    },
    {
      id: "4",
      name: "Slow Mover Discount",
      description: "Decrease price by 10-20% for products selling <10/month",
      enabled: false,
      priority: 4,
    },
  ];

  const applyPriceChange = (recommendation: any) => {
    toast.success(
      `Price updated to $${recommendation.suggestedPrice.toFixed(2)}`
    );
  };

  const rejectPriceChange = (recommendation: any) => {
    toast.info("Price recommendation rejected");
  };

  const toggleRule = (ruleId: string) => {
    toast.success("Pricing rule updated");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dynamic Pricing</h1>
        <p className="text-muted-foreground mt-1">
          AI-powered price optimization recommendations
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pricingRecommendations.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Potential Revenue Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">+$2,450</div>
            <p className="text-xs text-muted-foreground mt-1">
              If all applied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Price Changes (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{priceHistory.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Applied changes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pricingRules.filter((r) => r.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of {pricingRules.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={selectedTab === "recommendations" ? "default" : "ghost"}
          onClick={() => setSelectedTab("recommendations")}
        >
          Recommendations ({pricingRecommendations.length})
        </Button>
        <Button
          variant={selectedTab === "history" ? "default" : "ghost"}
          onClick={() => setSelectedTab("history")}
        >
          Price History
        </Button>
        <Button
          variant={selectedTab === "rules" ? "default" : "ghost"}
          onClick={() => setSelectedTab("rules")}
        >
          Pricing Rules
        </Button>
      </div>

      {/* Recommendations Tab */}
      {selectedTab === "recommendations" && (
        <div className="space-y-4">
          {pricingRecommendations.map((rec) => (
            <Card key={rec.productId}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {rec.productName}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rec.reason}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Current Price
                        </div>
                        <div className="text-2xl font-bold">
                          ${rec.currentPrice.toFixed(2)}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">
                          Suggested Price
                        </div>
                        <div
                          className={`text-2xl font-bold ${
                            rec.priceChange > 0
                              ? "text-green-500"
                              : "text-orange-500"
                          }`}
                        >
                          ${rec.suggestedPrice.toFixed(2)}
                          {rec.priceChange > 0 ? (
                            <TrendingUp className="inline h-5 w-5 ml-2" />
                          ) : (
                            <TrendingDown className="inline h-5 w-5 ml-2" />
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">
                          Price Change
                        </div>
                        <div className="text-2xl font-bold">
                          {rec.priceChange > 0 ? "+" : ""}
                          {rec.priceChange}%
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground">
                          Confidence
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${rec.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {rec.confidence}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-muted rounded-lg">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Sales (30 days)
                        </div>
                        <div className="font-medium">
                          {rec.salesLast30Days} units
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Competitor Price
                        </div>
                        <div className="font-medium">
                          ${rec.competitorPrice.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Expected Impact
                        </div>
                        <div className="font-medium">{rec.expectedImpact}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      onClick={() => applyPriceChange(rec)}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Apply
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => rejectPriceChange(rec)}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Price History Tab */}
      {selectedTab === "history" && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Price Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-left p-3 font-medium">Old Price</th>
                    <th className="text-left p-3 font-medium">New Price</th>
                    <th className="text-left p-3 font-medium">Change</th>
                    <th className="text-left p-3 font-medium">Reason</th>
                    <th className="text-left p-3 font-medium">
                      Revenue Impact
                    </th>
                    <th className="text-left p-3 font-medium">
                      Volume Impact
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {priceHistory.map((change, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3">{change.date}</td>
                      <td className="p-3 font-medium">
                        {change.productName}
                      </td>
                      <td className="p-3">${change.oldPrice.toFixed(2)}</td>
                      <td className="p-3 font-bold">
                        ${change.newPrice.toFixed(2)}
                      </td>
                      <td className="p-3">
                        <Badge
                          className={
                            change.newPrice > change.oldPrice
                              ? "bg-green-500"
                              : "bg-orange-500"
                          }
                        >
                          {change.newPrice > change.oldPrice ? "+" : ""}
                          {(
                            ((change.newPrice - change.oldPrice) /
                              change.oldPrice) *
                            100
                          ).toFixed(1)}
                          %
                        </Badge>
                      </td>
                      <td className="p-3">{change.reason}</td>
                      <td className="p-3">
                        <span
                          className={
                            change.impactRevenue > 0
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
                          {change.impactRevenue > 0 ? "+" : ""}
                          {change.impactRevenue.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={
                            change.impactVolume > 0
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
                          {change.impactVolume > 0 ? "+" : ""}
                          {change.impactVolume.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Rules Tab */}
      {selectedTab === "rules" && (
        <div className="space-y-4">
          {pricingRules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{rule.name}</h3>
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.enabled ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">Priority {rule.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {rule.description}
                    </p>
                  </div>
                  <Button
                    variant={rule.enabled ? "destructive" : "default"}
                    onClick={() => toggleRule(rule.id)}
                  >
                    {rule.enabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
