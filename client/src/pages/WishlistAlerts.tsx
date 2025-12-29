import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  TrendingDown,
  DollarSign,
  Mail,
  Smartphone,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";

export default function WishlistAlertsPage() {
  const [dailyDigest, setDailyDigest] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);

  const alerts = [
    {
      id: "ALERT-001",
      productName: "Wireless Headphones Pro",
      currentPrice: 249.99,
      originalPrice: 299.99,
      targetPrice: 250,
      priceDropPercent: 16.7,
      inStock: true,
      alertDate: "2025-12-27T08:00:00Z",
    },
    {
      id: "ALERT-002",
      productName: "Smart Watch Ultra",
      currentPrice: 349.99,
      originalPrice: 399.99,
      targetPrice: 350,
      priceDropPercent: 12.5,
      inStock: true,
      alertDate: "2025-12-26T14:30:00Z",
    },
  ];

  const watchedItems = [
    {
      id: "WATCH-001",
      productName: "Bluetooth Speaker",
      currentPrice: 79.99,
      targetPrice: 60,
      alertEnabled: true,
    },
    {
      id: "WATCH-002",
      productName: "Portable Charger 20K",
      currentPrice: 49.99,
      targetPrice: 40,
      alertEnabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b bg-card text-card-foreground">
        <div className="container py-6">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold">Wishlist Price Alerts</h1>
          </div>
          <p className="text-muted-foreground">
            Get notified when your wishlist items go on sale
          </p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Alert Settings */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Alert Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">Email Alerts</span>
                  </div>
                  <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Push Notifications</span>
                  </div>
                  <Switch checked={pushAlerts} onCheckedChange={setPushAlerts} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-red-500" />
                    <span className="font-medium">Daily Digest</span>
                  </div>
                  <Switch checked={dailyDigest} onCheckedChange={setDailyDigest} />
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-500 mb-1">Daily Digest</p>
                    <p className="text-muted-foreground">
                      Receive a summary of all price changes at 9 AM daily
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Alerts */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Recent Price Drops</h2>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <Card key={alert.id} className="p-4 bg-green-500/10 border-green-500/20">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg">{alert.productName}</h3>
                          <Badge className="bg-green-500/20 text-green-400">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            {alert.priceDropPercent}% off
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mb-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Current Price</p>
                            <p className="text-2xl font-bold text-green-500">
                              ${alert.currentPrice}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Original Price</p>
                            <p className="text-lg line-through text-muted-foreground">
                              ${alert.originalPrice}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Your Target</p>
                            <p className="text-lg font-medium">${alert.targetPrice}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Alert sent {new Date(alert.alertDate).toLocaleString()}
                        </p>
                      </div>
                      <Button size="lg" className="flex-shrink-0">
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Buy Now
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Watched Items */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Watched Items</h2>
              <div className="space-y-3">
                {watchedItems.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold mb-1">{item.productName}</h3>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            Current: <span className="font-medium">${item.currentPrice}</span>
                          </span>
                          <span className="text-muted-foreground">
                            Target: <span className="font-medium">${item.targetPrice}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch checked={item.alertEnabled} />
                        <Button variant="outline" size="sm">
                          Edit Target
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
