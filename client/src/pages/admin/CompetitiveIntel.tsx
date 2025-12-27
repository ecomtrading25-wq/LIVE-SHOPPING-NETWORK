import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingDown,
  TrendingUp,
  Search,
  Bell,
  Target,
  BarChart3,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Eye,
  RefreshCw,
} from "lucide-react";

/**
 * Competitive Intelligence Dashboard
 * Automated price monitoring, market share analysis, competitor tracking
 */

interface CompetitorProduct {
  id: string;
  ourProduct: string;
  competitor: string;
  competitorPrice: number;
  ourPrice: number;
  priceDiff: number;
  priceDiffPercent: number;
  lastChecked: string;
  priceHistory: PricePoint[];
  inStock: boolean;
  rating: number;
  reviews: number;
}

interface PricePoint {
  date: string;
  price: number;
}

interface Competitor {
  id: string;
  name: string;
  logo: string;
  productsTracked: number;
  avgPriceDiff: number;
  marketShare: number;
  recentChanges: number;
}

interface PriceAlert {
  id: string;
  product: string;
  competitor: string;
  type: "price_drop" | "price_increase" | "out_of_stock" | "new_product";
  oldPrice?: number;
  newPrice?: number;
  change?: number;
  timestamp: string;
}

export default function CompetitiveIntelPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");

  // Mock competitor data
  const competitors: Competitor[] = [
    {
      id: "COMP-001",
      name: "Amazon",
      logo: "🛒",
      productsTracked: 156,
      avgPriceDiff: -8.5,
      marketShare: 38.5,
      recentChanges: 12,
    },
    {
      id: "COMP-002",
      name: "eBay",
      logo: "🏪",
      productsTracked: 89,
      avgPriceDiff: -5.2,
      marketShare: 22.3,
      recentChanges: 8,
    },
    {
      id: "COMP-003",
      name: "Walmart",
      logo: "🏬",
      productsTracked: 134,
      avgPriceDiff: -12.3,
      marketShare: 18.7,
      recentChanges: 15,
    },
    {
      id: "COMP-004",
      name: "Target",
      logo: "🎯",
      productsTracked: 67,
      avgPriceDiff: -3.8,
      marketShare: 12.1,
      recentChanges: 5,
    },
    {
      id: "COMP-005",
      name: "Best Buy",
      logo: "💻",
      productsTracked: 45,
      avgPriceDiff: 2.5,
      marketShare: 8.4,
      recentChanges: 3,
    },
  ];

  // Mock product comparisons
  const products: CompetitorProduct[] = [
    {
      id: "PROD-001",
      ourProduct: "Wireless Headphones Pro",
      competitor: "Amazon",
      competitorPrice: 249.99,
      ourPrice: 299.99,
      priceDiff: 50,
      priceDiffPercent: 20,
      lastChecked: "2025-12-27T16:00:00Z",
      priceHistory: [
        { date: "2025-12-20", price: 279.99 },
        { date: "2025-12-22", price: 269.99 },
        { date: "2025-12-25", price: 249.99 },
      ],
      inStock: true,
      rating: 4.5,
      reviews: 2340,
    },
    {
      id: "PROD-002",
      ourProduct: "Smart Watch Ultra",
      competitor: "Walmart",
      competitorPrice: 389.99,
      ourPrice: 399.99,
      priceDiff: 10,
      priceDiffPercent: 2.6,
      lastChecked: "2025-12-27T15:45:00Z",
      priceHistory: [
        { date: "2025-12-20", price: 399.99 },
        { date: "2025-12-23", price: 389.99 },
      ],
      inStock: true,
      rating: 4.7,
      reviews: 1890,
    },
    {
      id: "PROD-003",
      ourProduct: "Portable Charger 20K",
      competitor: "eBay",
      competitorPrice: 59.99,
      ourPrice: 49.99,
      priceDiff: -10,
      priceDiffPercent: -16.7,
      lastChecked: "2025-12-27T16:15:00Z",
      priceHistory: [
        { date: "2025-12-20", price: 54.99 },
        { date: "2025-12-24", price: 59.99 },
      ],
      inStock: true,
      rating: 4.2,
      reviews: 890,
    },
  ];

  // Mock price alerts
  const alerts: PriceAlert[] = [
    {
      id: "ALERT-001",
      product: "Wireless Headphones Pro",
      competitor: "Amazon",
      type: "price_drop",
      oldPrice: 269.99,
      newPrice: 249.99,
      change: -20,
      timestamp: "2025-12-27T14:30:00Z",
    },
    {
      id: "ALERT-002",
      product: "Smart Watch Ultra",
      competitor: "Walmart",
      type: "price_drop",
      oldPrice: 399.99,
      newPrice: 389.99,
      change: -10,
      timestamp: "2025-12-27T12:00:00Z",
    },
    {
      id: "ALERT-003",
      product: "Gaming Keyboard RGB",
      competitor: "Best Buy",
      type: "out_of_stock",
      timestamp: "2025-12-27T10:15:00Z",
    },
  ];

  const filteredProducts = products.filter(
    (p) =>
      searchQuery === "" ||
      p.ourProduct.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.competitor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTracked = competitors.reduce((sum, c) => sum + c.productsTracked, 0);
  const avgMarketShare = competitors.reduce((sum, c) => sum + c.marketShare, 0) / competitors.length;
  const productsOverpriced = products.filter((p) => p.priceDiff > 0).length;
  const recentAlerts = alerts.length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "price_drop":
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case "price_increase":
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case "out_of_stock":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "new_product":
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Competitive Intelligence</h1>
          <p className="text-muted-foreground">
            Price monitoring, market analysis, and competitor tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Prices
          </Button>
          <Button>
            <Bell className="w-4 h-4 mr-2" />
            Configure Alerts
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Products Tracked</p>
            <Eye className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{totalTracked}</p>
          <p className="text-xs text-muted-foreground">Across {competitors.length} competitors</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Avg Market Share</p>
            <Target className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{avgMarketShare.toFixed(1)}%</p>
          <p className="text-xs text-green-500">+2.3% from last month</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Overpriced Products</p>
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{productsOverpriced}</p>
          <p className="text-xs text-orange-500">Requires price adjustment</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Recent Alerts</p>
            <Bell className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{recentAlerts}</p>
          <p className="text-xs text-muted-foreground">Last 24 hours</p>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="products">
            <DollarSign className="w-4 h-4 mr-2" />
            Price Comparison
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="w-4 h-4 mr-2" />
            Price Alerts
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Competitor Overview</h2>

            <div className="space-y-4">
              {competitors.map((competitor) => (
                <Card key={competitor.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                        {competitor.logo}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{competitor.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {competitor.productsTracked} products tracked
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avg Price Difference</p>
                      <p
                        className={`text-2xl font-bold ${
                          competitor.avgPriceDiff < 0 ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {competitor.avgPriceDiff > 0 ? "+" : ""}
                        {competitor.avgPriceDiff}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Market Share</p>
                      <p className="text-2xl font-bold">{competitor.marketShare}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Recent Changes</p>
                      <p className="text-2xl font-bold text-blue-500">{competitor.recentChanges}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Price Comparison Tab */}
        <TabsContent value="products" className="space-y-6">
          <Card className="p-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products or competitors..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold mb-1">{product.ourProduct}</h3>
                      <p className="text-sm text-muted-foreground">vs {product.competitor}</p>
                    </div>
                    <Badge
                      className={
                        product.priceDiff > 0
                          ? "bg-red-500/20 text-red-400"
                          : "bg-green-500/20 text-green-400"
                      }
                    >
                      {product.priceDiff > 0 ? "Overpriced" : "Competitive"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Our Price</p>
                      <p className="text-2xl font-bold text-blue-500">${product.ourPrice}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Competitor Price</p>
                      <p className="text-2xl font-bold">${product.competitorPrice}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Difference</p>
                      <p
                        className={`text-2xl font-bold ${
                          product.priceDiff > 0 ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {product.priceDiff > 0 ? "+" : ""}${product.priceDiff}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ({product.priceDiffPercent > 0 ? "+" : ""}
                        {product.priceDiffPercent}%)
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Competitor Rating</p>
                      <p className="text-2xl font-bold text-yellow-500">⭐ {product.rating}</p>
                      <p className="text-xs text-muted-foreground">{product.reviews} reviews</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-xs text-muted-foreground">
                      Last checked: {new Date(product.lastChecked).toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View History
                      </Button>
                      {product.priceDiff > 0 && (
                        <Button size="sm">Adjust Our Price</Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Price Alerts Tab */}
        <TabsContent value="alerts">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Price Alerts - Last 24 Hours</h2>

            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card key={alert.id} className="p-4">
                  <div className="flex items-start gap-4">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold">{alert.product}</h3>
                        <Badge variant="outline">{alert.competitor}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.type === "price_drop" &&
                          `Price dropped from $${alert.oldPrice} to $${alert.newPrice} (${alert.change}%)`}
                        {alert.type === "price_increase" &&
                          `Price increased from $${alert.oldPrice} to $${alert.newPrice} (+${alert.change}%)`}
                        {alert.type === "out_of_stock" && "Product is now out of stock"}
                        {alert.type === "new_product" && "New product launched"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Take Action
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
