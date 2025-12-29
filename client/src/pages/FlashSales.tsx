import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Zap,
  TrendingUp,
  ShoppingCart,
  Bell,
  Flame,
  AlertCircle,
} from "lucide-react";

/**
 * Flash Sale Countdown System
 * Countdown timers, inventory depletion bars, automatic price reversion, notifications
 */

interface FlashSale {
  id: string;
  productName: string;
  productImage: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  stock: number;
  totalStock: number;
  startTime: string;
  endTime: string;
  status: "upcoming" | "active" | "ended";
}

export default function FlashSalesPage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Mock flash sales
  const flashSales: FlashSale[] = [
    {
      id: "FLASH-001",
      productName: "Wireless Headphones Pro",
      productImage: "/placeholder-product.jpg",
      originalPrice: 299.99,
      salePrice: 149.99,
      discount: 50,
      stock: 5,
      totalStock: 100,
      startTime: "2025-12-27T20:00:00Z",
      endTime: "2025-12-27T23:59:59Z",
      status: "active",
    },
    {
      id: "FLASH-002",
      productName: "Smart Watch Ultra",
      productImage: "/placeholder-product.jpg",
      originalPrice: 399.99,
      salePrice: 279.99,
      discount: 30,
      stock: 23,
      totalStock: 50,
      startTime: "2025-12-27T20:00:00Z",
      endTime: "2025-12-27T23:59:59Z",
      status: "active",
    },
    {
      id: "FLASH-003",
      productName: "Portable Charger 20K",
      productImage: "/placeholder-product.jpg",
      originalPrice: 49.99,
      salePrice: 29.99,
      discount: 40,
      stock: 67,
      totalStock: 200,
      startTime: "2025-12-27T20:00:00Z",
      endTime: "2025-12-27T23:59:59Z",
      status: "active",
    },
    {
      id: "FLASH-004",
      productName: "Bluetooth Speaker",
      productImage: "/placeholder-product.jpg",
      originalPrice: 129.99,
      salePrice: 64.99,
      discount: 50,
      stock: 30,
      totalStock: 30,
      startTime: "2025-12-28T00:00:00Z",
      endTime: "2025-12-28T06:00:00Z",
      status: "upcoming",
    },
  ];

  const calculateTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const diff = end.getTime() - currentTime.getTime();

    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, expired: false };
  };

  const calculateTimeUntilStart = (startTime: string) => {
    const start = new Date(startTime);
    const diff = start.getTime() - currentTime.getTime();

    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, started: true };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, started: false };
  };

  const getStockColor = (stock: number, totalStock: number) => {
    const percentage = (stock / totalStock) * 100;
    if (percentage <= 10) return "text-red-500";
    if (percentage <= 30) return "text-orange-500";
    return "text-green-500";
  };

  const getUrgencyLevel = (stock: number, totalStock: number) => {
    const percentage = (stock / totalStock) * 100;
    if (percentage <= 10) return "critical";
    if (percentage <= 30) return "high";
    return "normal";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-red-500/20 to-orange-500/20">
        <div className="container py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-10 h-10 text-yellow-500" />
                <h1 className="text-4xl font-bold">Flash Sales</h1>
                <Flame className="w-10 h-10 text-red-500 animate-pulse" />
              </div>
              <p className="text-muted-foreground text-lg">
                Limited time offers with massive discounts!
              </p>
            </div>
            <Button size="lg">
              <Bell className="w-5 h-5 mr-2" />
              Get Notified
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Active Flash Sales */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-3xl font-bold">Active Now</h2>
            <Badge className="bg-red-500 text-foreground text-lg px-4 py-2 animate-pulse">
              LIVE
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flashSales
              .filter((sale) => sale.status === "active")
              .map((sale) => {
                const timeRemaining = calculateTimeRemaining(sale.endTime);
                const urgency = getUrgencyLevel(sale.stock, sale.totalStock);
                const stockPercentage = (sale.stock / sale.totalStock) * 100;

                return (
                  <Card
                    key={sale.id}
                    className="p-6 border-2 border-red-500/50 hover:border-red-500 transition-colors"
                  >
                    {/* Discount Badge */}
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-red-500 text-foreground text-xl px-4 py-2">
                        -{sale.discount}%
                      </Badge>
                    </div>

                    {/* Product Image */}
                    <div className="w-full h-48 bg-secondary rounded-lg mb-4 flex items-center justify-center">
                      <Zap className="w-16 h-16 text-muted-foreground" />
                    </div>

                    {/* Product Info */}
                    <h3 className="font-bold text-xl mb-2">{sale.productName}</h3>

                    {/* Price */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl font-bold text-red-500">
                        ${sale.salePrice}
                      </span>
                      <span className="text-lg text-muted-foreground line-through">
                        ${sale.originalPrice}
                      </span>
                    </div>

                    {/* Countdown Timer */}
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Ends in:</p>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-red-500/20 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-red-500">
                            {String(timeRemaining.hours).padStart(2, "0")}
                          </p>
                          <p className="text-xs text-muted-foreground">Hours</p>
                        </div>
                        <div className="flex-1 bg-red-500/20 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-red-500">
                            {String(timeRemaining.minutes).padStart(2, "0")}
                          </p>
                          <p className="text-xs text-muted-foreground">Mins</p>
                        </div>
                        <div className="flex-1 bg-red-500/20 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-red-500">
                            {String(timeRemaining.seconds).padStart(2, "0")}
                          </p>
                          <p className="text-xs text-muted-foreground">Secs</p>
                        </div>
                      </div>
                    </div>

                    {/* Stock Indicator */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Stock:</span>
                        <span
                          className={`text-sm font-bold ${getStockColor(
                            sale.stock,
                            sale.totalStock
                          )}`}
                        >
                          {urgency === "critical" && "⚠️ "}
                          Only {sale.stock} left!
                        </span>
                      </div>
                      <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            urgency === "critical"
                              ? "bg-red-500 animate-pulse"
                              : urgency === "high"
                              ? "bg-orange-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${stockPercentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((sale.totalStock - sale.stock) / sale.totalStock * 100).toFixed(0)}% sold
                      </p>
                    </div>

                    {/* Urgency Message */}
                    {urgency === "critical" && (
                      <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                        <div className="flex items-center gap-2 text-red-500">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm font-bold">
                            Almost sold out! Grab yours now!
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Buy Button */}
                    <Button
                      className="w-full bg-red-500 hover:bg-red-600 text-foreground"
                      size="lg"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Buy Now
                    </Button>
                  </Card>
                );
              })}
          </div>
        </div>

        {/* Upcoming Flash Sales */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-3xl font-bold">Coming Soon</h2>
            <Badge className="bg-blue-500 text-foreground text-lg px-4 py-2">
              <Clock className="w-4 h-4 mr-2" />
              Upcoming
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flashSales
              .filter((sale) => sale.status === "upcoming")
              .map((sale) => {
                const timeUntilStart = calculateTimeUntilStart(sale.startTime);

                return (
                  <Card key={sale.id} className="p-6 opacity-75">
                    {/* Discount Badge */}
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-blue-500 text-foreground text-xl px-4 py-2">
                        -{sale.discount}%
                      </Badge>
                    </div>

                    {/* Product Image */}
                    <div className="w-full h-48 bg-secondary rounded-lg mb-4 flex items-center justify-center">
                      <Clock className="w-16 h-16 text-muted-foreground" />
                    </div>

                    {/* Product Info */}
                    <h3 className="font-bold text-xl mb-2">{sale.productName}</h3>

                    {/* Price */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl font-bold text-blue-500">
                        ${sale.salePrice}
                      </span>
                      <span className="text-lg text-muted-foreground line-through">
                        ${sale.originalPrice}
                      </span>
                    </div>

                    {/* Countdown to Start */}
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Starts in:</p>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-blue-500/20 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-blue-500">
                            {String(timeUntilStart.hours).padStart(2, "0")}
                          </p>
                          <p className="text-xs text-muted-foreground">Hours</p>
                        </div>
                        <div className="flex-1 bg-blue-500/20 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-blue-500">
                            {String(timeUntilStart.minutes).padStart(2, "0")}
                          </p>
                          <p className="text-xs text-muted-foreground">Mins</p>
                        </div>
                        <div className="flex-1 bg-blue-500/20 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-blue-500">
                            {String(timeUntilStart.seconds).padStart(2, "0")}
                          </p>
                          <p className="text-xs text-muted-foreground">Secs</p>
                        </div>
                      </div>
                    </div>

                    {/* Notify Me Button */}
                    <Button variant="outline" className="w-full" size="lg">
                      <Bell className="w-5 h-5 mr-2" />
                      Notify Me
                    </Button>
                  </Card>
                );
              })}
          </div>
        </div>

        {/* Info Card */}
        <Card className="p-6 mt-12 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/20">
          <div className="flex items-start gap-3">
                <Flame className="w-6 h-6 text-red-500 mt-0.5" />
            <div>
              <p className="font-bold text-red-500 mb-2">How Flash Sales Work</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Limited time offers with massive discounts (up to 70% off)</li>
                <li>• Limited stock - first come, first served</li>
                <li>• Prices automatically revert when timer expires</li>
                <li>• Get notified 1 hour before sales start</li>
                <li>• New flash sales every day at midnight</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
