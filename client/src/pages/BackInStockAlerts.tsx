import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Bell, BellOff, Trash2, Package, Mail, Check } from "lucide-react";

interface Alert {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  email: string;
  createdAt: string;
  notified: boolean;
}

/**
 * Back In Stock Alerts Management Page
 * View and manage all product waitlist subscriptions
 */
export default function BackInStockAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: "alert-1",
      productId: "1",
      productName: "Wireless Headphones Pro",
      productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
      price: 299.99,
      email: "user@example.com",
      createdAt: "2024-01-15",
      notified: false,
    },
    {
      id: "alert-2",
      productId: "2",
      productName: "Smart Watch Ultra",
      productImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
      price: 399.99,
      email: "user@example.com",
      createdAt: "2024-01-10",
      notified: true,
    },
  ]);

  const handleRemoveAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const activeAlerts = alerts.filter(a => !a.notified);
  const notifiedAlerts = alerts.filter(a => a.notified);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Bell className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                Back In Stock Alerts
              </h1>
              <p className="text-gray-400 mt-1">
                Manage your product waitlist subscriptions
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Bell className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{activeAlerts.length}</p>
                  <p className="text-sm text-gray-400">Active Alerts</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{notifiedAlerts.length}</p>
                  <p className="text-sm text-gray-400">Notified</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{alerts.length}</p>
                  <p className="text-sm text-gray-400">Total Subscriptions</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Bell className="w-6 h-6 text-purple-400" />
              Active Alerts
            </h2>
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <Card key={alert.id} className="p-6 bg-white/5 border-white/10">
                  <div className="flex items-start gap-4">
                    <Link href={`/products/${alert.productId}`}>
                      <img
                        src={alert.productImage}
                        alt={alert.productName}
                        className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </Link>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Link href={`/products/${alert.productId}`}>
                            <h3 className="text-lg font-semibold text-white hover:text-purple-400 transition-colors cursor-pointer">
                              {alert.productName}
                            </h3>
                          </Link>
                          <p className="text-2xl font-bold text-purple-400 mt-1">
                            ${alert.price}
                          </p>
                        </div>
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <Bell className="w-3 h-3 mr-1" />
                          Waiting
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          <span>{alert.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          <span>Added {new Date(alert.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleRemoveAlert(alert.id)}
                          variant="outline"
                          size="sm"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove Alert
                        </Button>
                        <Link href={`/products/${alert.productId}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                          >
                            View Product
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Notified Alerts */}
        {notifiedAlerts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Check className="w-6 h-6 text-green-400" />
              Recently Notified
            </h2>
            <div className="space-y-4">
              {notifiedAlerts.map((alert) => (
                <Card key={alert.id} className="p-6 bg-white/5 border-white/10 opacity-60">
                  <div className="flex items-start gap-4">
                    <Link href={`/products/${alert.productId}`}>
                      <img
                        src={alert.productImage}
                        alt={alert.productName}
                        className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    </Link>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Link href={`/products/${alert.productId}`}>
                            <h3 className="text-lg font-semibold text-white hover:text-purple-400 transition-colors cursor-pointer">
                              {alert.productName}
                            </h3>
                          </Link>
                          <p className="text-2xl font-bold text-purple-400 mt-1">
                            ${alert.price}
                          </p>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Check className="w-3 h-3 mr-1" />
                          Notified
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-400 mb-4">
                        ✅ We sent you an email when this product came back in stock
                      </p>

                      <div className="flex items-center gap-2">
                        <Link href={`/products/${alert.productId}`}>
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Shop Now
                          </Button>
                        </Link>
                        <Button
                          onClick={() => handleRemoveAlert(alert.id)}
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-gray-400"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {alerts.length === 0 && (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-6 bg-gray-800 rounded-full">
                <BellOff className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                No Active Alerts
              </h3>
              <p className="text-gray-400 max-w-md">
                You haven't joined any waitlists yet. Browse our products and get notified when out-of-stock items are available again!
              </p>
              <Link href="/products">
                <Button className="bg-purple-600 hover:bg-purple-700 mt-4">
                  <Package className="w-4 h-4 mr-2" />
                  Browse Products
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
