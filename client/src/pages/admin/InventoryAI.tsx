import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Brain,
  BarChart3,
  Calendar,
  Package,
  Zap,
  Target,
  Activity,
  Download,
} from "lucide-react";

/**
 * Predictive Inventory AI Dashboard
 * ML demand forecasting, automated reorder triggers, stockout prevention
 */

interface ForecastData {
  productId: string;
  productName: string;
  currentStock: number;
  predicted7Day: number;
  predicted30Day: number;
  reorderPoint: number;
  leadTime: number;
  confidence: number;
  trend: "up" | "down" | "stable";
  risk: "low" | "medium" | "high";
}

interface SeasonalTrend {
  month: string;
  demand: number;
  year: number;
}

interface SKUPerformance {
  sku: string;
  name: string;
  category: string;
  revenue: number;
  units: number;
  turnoverRate: number;
  classification: "A" | "B" | "C";
}

export default function InventoryAIPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<"7d" | "30d" | "90d">("30d");

  // Mock forecast data
  const forecasts: ForecastData[] = [
    {
      productId: "P001",
      productName: "Wireless Earbuds Pro",
      currentStock: 245,
      predicted7Day: 180,
      predicted30Day: 720,
      reorderPoint: 300,
      leadTime: 14,
      confidence: 94.5,
      trend: "up",
      risk: "medium",
    },
    {
      productId: "P002",
      productName: "Smart Watch Series 5",
      currentStock: 89,
      predicted7Day: 95,
      predicted30Day: 380,
      reorderPoint: 150,
      leadTime: 21,
      confidence: 91.2,
      trend: "up",
      risk: "high",
    },
    {
      productId: "P003",
      productName: "Designer Handbag",
      currentStock: 456,
      predicted7Day: 45,
      predicted30Day: 180,
      reorderPoint: 100,
      leadTime: 7,
      confidence: 96.8,
      trend: "stable",
      risk: "low",
    },
    {
      productId: "P004",
      productName: "Running Shoes",
      currentStock: 178,
      predicted7Day: 120,
      predicted30Day: 480,
      reorderPoint: 200,
      leadTime: 10,
      confidence: 89.3,
      trend: "up",
      risk: "medium",
    },
    {
      productId: "P005",
      productName: "Coffee Maker Deluxe",
      currentStock: 67,
      predicted7Day: 85,
      predicted30Day: 340,
      reorderPoint: 120,
      leadTime: 18,
      confidence: 92.7,
      trend: "up",
      risk: "high",
    },
  ];

  // Mock seasonal trends
  const seasonalTrends: SeasonalTrend[] = [
    { month: "Jan", demand: 850, year: 2025 },
    { month: "Feb", demand: 920, year: 2025 },
    { month: "Mar", demand: 1150, year: 2025 },
    { month: "Apr", demand: 1080, year: 2025 },
    { month: "May", demand: 1340, year: 2025 },
    { month: "Jun", demand: 1520, year: 2025 },
    { month: "Jul", demand: 1680, year: 2025 },
    { month: "Aug", demand: 1590, year: 2025 },
    { month: "Sep", demand: 1420, year: 2025 },
    { month: "Oct", demand: 1650, year: 2025 },
    { month: "Nov", demand: 2100, year: 2025 },
    { month: "Dec", demand: 2450, year: 2025 },
  ];

  // Mock SKU performance
  const skuPerformance: SKUPerformance[] = [
    {
      sku: "SKU-001",
      name: "Wireless Earbuds Pro",
      category: "Electronics",
      revenue: 125600,
      units: 1400,
      turnoverRate: 8.5,
      classification: "A",
    },
    {
      sku: "SKU-002",
      name: "Smart Watch Series 5",
      category: "Electronics",
      revenue: 98400,
      units: 328,
      turnoverRate: 6.2,
      classification: "A",
    },
    {
      sku: "SKU-003",
      name: "Designer Handbag",
      category: "Fashion",
      revenue: 67200,
      units: 224,
      turnoverRate: 4.1,
      classification: "B",
    },
    {
      sku: "SKU-004",
      name: "Running Shoes",
      category: "Sports",
      revenue: 45800,
      units: 458,
      turnoverRate: 5.8,
      classification: "B",
    },
    {
      sku: "SKU-005",
      name: "Coffee Maker Deluxe",
      category: "Home",
      revenue: 28900,
      units: 289,
      turnoverRate: 3.2,
      classification: "C",
    },
  ];

  const highRiskItems = forecasts.filter(f => f.risk === "high");
  const mediumRiskItems = forecasts.filter(f => f.risk === "medium");
  const totalRevenue = skuPerformance.reduce((sum, sku) => sum + sku.revenue, 0);
  const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "text-red-400 bg-red-500/20";
      case "medium": return "text-yellow-400 bg-yellow-500/20";
      case "low": return "text-green-400 bg-green-500/20";
      default: return "text-gray-400 bg-gray-500/20";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="w-4 h-4 text-green-400" />;
      case "down": return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-blue-400" />;
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case "A": return "bg-green-500/20 text-green-400";
      case "B": return "bg-blue-500/20 text-blue-400";
      case "C": return "bg-gray-500/20 text-gray-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Predictive Inventory AI</h1>
          <p className="text-muted-foreground">
            ML-powered demand forecasting and automated reorder optimization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Zap className="w-4 h-4 mr-2" />
            Run Forecast
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">High Risk Items</p>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{highRiskItems.length}</p>
          <p className="text-xs text-red-500">Requires immediate attention</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Medium Risk Items</p>
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{mediumRiskItems.length}</p>
          <p className="text-xs text-yellow-500">Monitor closely</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Forecast Confidence</p>
            <Brain className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{avgConfidence.toFixed(1)}%</p>
          <p className="text-xs text-green-500">+2.3% from last month</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <BarChart3 className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold mb-1">${(totalRevenue / 1000).toFixed(0)}K</p>
          <p className="text-xs text-green-500">+18.5% from last month</p>
        </Card>
      </div>

      <Tabs defaultValue="forecasts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="forecasts">
            <Target className="w-4 h-4 mr-2" />
            Demand Forecasts
          </TabsTrigger>
          <TabsTrigger value="seasonal">
            <Calendar className="w-4 h-4 mr-2" />
            Seasonal Trends
          </TabsTrigger>
          <TabsTrigger value="performance">
            <BarChart3 className="w-4 h-4 mr-2" />
            SKU Performance
          </TabsTrigger>
        </TabsList>

        {/* Demand Forecasts */}
        <TabsContent value="forecasts" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">30-Day Demand Forecast</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant={selectedTimeframe === "7d" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe("7d")}
                >
                  7 Days
                </Button>
                <Button
                  variant={selectedTimeframe === "30d" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe("30d")}
                >
                  30 Days
                </Button>
                <Button
                  variant={selectedTimeframe === "90d" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe("90d")}
                >
                  90 Days
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {forecasts.map((forecast) => (
                <Card key={forecast.productId} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold">{forecast.productName}</h3>
                        {getTrendIcon(forecast.trend)}
                        <Badge className={getRiskColor(forecast.risk)}>
                          {forecast.risk} risk
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">SKU: {forecast.productId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">ML Confidence</p>
                      <p className="text-2xl font-bold text-purple-500">{forecast.confidence}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Current Stock</p>
                      <p className="text-xl font-bold">{forecast.currentStock}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">7-Day Forecast</p>
                      <p className="text-xl font-bold text-blue-500">{forecast.predicted7Day}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">30-Day Forecast</p>
                      <p className="text-xl font-bold text-purple-500">{forecast.predicted30Day}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Reorder Point</p>
                      <p className="text-xl font-bold text-yellow-500">{forecast.reorderPoint}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Lead Time</p>
                      <p className="text-xl font-bold">{forecast.leadTime} days</p>
                    </div>
                  </div>

                  {/* Stock Level Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>Stock Level</span>
                      <span>{((forecast.currentStock / forecast.reorderPoint) * 100).toFixed(0)}% of reorder point</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          forecast.currentStock < forecast.reorderPoint
                            ? "bg-red-500"
                            : forecast.currentStock < forecast.reorderPoint * 1.5
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min((forecast.currentStock / (forecast.reorderPoint * 2)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  {forecast.risk === "high" && (
                    <div className="mt-4 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <p className="text-sm text-red-500 flex-1">
                        Stock will run out in {Math.floor(forecast.currentStock / (forecast.predicted30Day / 30))} days. Reorder recommended.
                      </p>
                      <Button size="sm" variant="destructive">
                        <Zap className="w-4 h-4 mr-2" />
                        Auto Reorder
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Seasonal Trends */}
        <TabsContent value="seasonal">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Seasonal Demand Analysis</h2>
            
            {/* Heatmap Visualization */}
            <div className="mb-8">
              <div className="grid grid-cols-12 gap-2">
                {seasonalTrends.map((trend) => (
                  <div key={trend.month} className="text-center">
                    <div
                      className="h-24 rounded-lg mb-2 flex items-end justify-center pb-2 text-foreground font-bold text-sm"
                      style={{
                        backgroundColor: `rgba(168, 85, 247, ${trend.demand / 2500})`,
                      }}
                    >
                      {(trend.demand / 1000).toFixed(1)}K
                    </div>
                    <p className="text-xs text-muted-foreground">{trend.month}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <h3 className="font-bold">Peak Season</h3>
                </div>
                <p className="text-2xl font-bold mb-1">Nov - Dec</p>
                <p className="text-sm text-muted-foreground">2.4K avg daily orders</p>
              </Card>

              <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-bold">Growth Period</h3>
                </div>
                <p className="text-2xl font-bold mb-1">Mar - Jul</p>
                <p className="text-sm text-muted-foreground">+15% month-over-month</p>
              </Card>

              <Card className="p-4 bg-purple-500/10 border-purple-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  <h3 className="font-bold">AI Prediction</h3>
                </div>
                <p className="text-2xl font-bold mb-1">+28% YoY</p>
                <p className="text-sm text-muted-foreground">Expected growth 2026</p>
              </Card>
            </div>
          </Card>
        </TabsContent>

        {/* SKU Performance */}
        <TabsContent value="performance">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">SKU Performance & ABC Classification</h2>
            
            <div className="space-y-4">
              {skuPerformance.map((sku) => (
                <Card key={sku.sku} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Badge className={getClassificationColor(sku.classification)}>
                        Class {sku.classification}
                      </Badge>
                      <div>
                        <h3 className="font-bold text-lg">{sku.name}</h3>
                        <p className="text-sm text-muted-foreground">{sku.sku} • {sku.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${(sku.revenue / 1000).toFixed(1)}K</p>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Units Sold</p>
                      <p className="text-xl font-bold">{sku.units.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Turnover Rate</p>
                      <p className="text-xl font-bold text-green-500">{sku.turnoverRate}x</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avg Price</p>
                      <p className="text-xl font-bold">${(sku.revenue / sku.units).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Performance Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span>Revenue Contribution</span>
                      <span>{((sku.revenue / totalRevenue) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          sku.classification === "A"
                            ? "bg-green-500"
                            : sku.classification === "B"
                            ? "bg-blue-500"
                            : "bg-gray-500"
                        }`}
                        style={{ width: `${(sku.revenue / totalRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* ABC Classification Legend */}
            <Card className="p-4 mt-6 bg-muted/50">
              <h3 className="font-bold mb-3">ABC Classification</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <Badge className="bg-green-500/20 text-green-400 mb-2">Class A</Badge>
                  <p className="text-muted-foreground">High value items (70% revenue, 20% items)</p>
                </div>
                <div>
                  <Badge className="bg-blue-500/20 text-blue-400 mb-2">Class B</Badge>
                  <p className="text-muted-foreground">Medium value items (20% revenue, 30% items)</p>
                </div>
                <div>
                  <Badge className="bg-gray-500/20 text-gray-400 mb-2">Class C</Badge>
                  <p className="text-muted-foreground">Low value items (10% revenue, 50% items)</p>
                </div>
              </div>
            </Card>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
