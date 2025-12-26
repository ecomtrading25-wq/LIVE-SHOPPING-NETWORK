import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import {
  User,
  Package,
  MapPin,
  CreditCard,
  Settings,
  LogOut,
  ShoppingCart,
  Home,
} from "lucide-react";

/**
 * User Account Page
 * Profile information and order history
 */

export default function AccountPage() {
  const { user } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation();

  const { data: orders, isLoading } = trpc.orders.list.useQuery({
    limit: 10,
  });

  const handleLogout = () => {
    logoutMutation.mutate();
    window.location.href = "/";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 bg-white/5 border-white/10 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Sign In Required</h2>
          <p className="text-gray-300 mb-6">
            Please sign in to view your account and order history
          </p>
          <Link href="/">
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              Go to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      {/* Header */}
      <header className="bg-black/30 border-b border-white/10 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="text-2xl font-bold text-white hover:text-purple-400 transition-colors">
                Live Shopping Network
              </a>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/products">
                <Button variant="outline">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Shop
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline">
                  <Home className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">{user.name || "User"}</h2>
                <p className="text-sm text-gray-400">{user.email}</p>
              </div>

              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                  <Package className="w-5 h-5 mr-3" />
                  Orders
                </Button>
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                  <MapPin className="w-5 h-5 mr-3" />
                  Addresses
                </Button>
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                  <CreditCard className="w-5 h-5 mr-3" />
                  Payment Methods
                </Button>
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
                  <Settings className="w-5 h-5 mr-3" />
                  Settings
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-400 hover:bg-red-500/10"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold text-white mb-6">Order History</h1>

            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6 bg-white/5 border-white/10 animate-pulse">
                    <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                  </Card>
                ))}
              </div>
            ) : !orders || orders.length === 0 ? (
              <Card className="p-12 bg-white/5 border-white/10 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Orders Yet</h3>
                <p className="text-gray-400 mb-6">
                  Start shopping to see your orders here
                </p>
                <Link href="/products">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Browse Products
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => (
                  <Card key={order.id} className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          Order #{order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-400">Total</p>
                        <p className="text-lg font-semibold text-white">
                          ${parseFloat(order.total).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Items</p>
                        <p className="text-lg font-semibold text-white">
                          {order.metadata?.itemCount || "—"}
                        </p>
                      </div>
                    </div>

                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
