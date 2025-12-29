import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Calendar,
  DollarSign,
} from "lucide-react";

export default function OrderHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const orders = [
    {
      id: "ORD-12345",
      date: "2024-01-15",
      status: "delivered",
      total: 159.99,
      items: 3,
      trackingNumber: "1Z999AA10123456784",
    },
    {
      id: "ORD-12344",
      date: "2024-01-10",
      status: "shipped",
      total: 89.50,
      items: 2,
      trackingNumber: "1Z999AA10123456783",
    },
    {
      id: "ORD-12343",
      date: "2024-01-05",
      status: "processing",
      total: 249.99,
      items: 5,
      trackingNumber: null,
    },
    {
      id: "ORD-12342",
      date: "2023-12-28",
      status: "cancelled",
      total: 45.00,
      items: 1,
      trackingNumber: null,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "shipped":
        return <Truck className="w-5 h-5 text-blue-500" />;
      case "processing":
        return <Package className="w-5 h-5 text-yellow-500" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      delivered: "bg-green-600",
      shipped: "bg-blue-600",
      processing: "bg-yellow-600",
      cancelled: "bg-red-600",
    };

    return (
      <Badge className={variants[status] || "bg-gray-600"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">Order History</h1>

          {/* Filters */}
          <Card className="p-6 bg-background text-foreground/10 backdrop-blur-xl border-white/20 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by order ID or tracking number..."
                  className="pl-10 bg-background/10 border-white/20 text-foreground placeholder:text-gray-400"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                {["all", "processing", "shipped", "delivered", "cancelled"].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    onClick={() => setStatusFilter(status)}
                    className={
                      statusFilter === status
                        ? "bg-purple-600"
                        : "border-white/20 text-foreground hover:bg-background/10"
                    }
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <Card className="p-12 bg-background text-foreground/10 backdrop-blur-xl border-white/20 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">No Orders Found</h2>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "You haven't placed any orders yet"}
                </p>
                <Link href="/products">
                  <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                    Start Shopping
                  </Button>
                </Link>
              </Card>
            ) : (
              filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  className="p-6 bg-background text-foreground/10 backdrop-blur-xl border-white/20 hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <h3 className="text-xl font-bold text-foreground">{order.id}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-muted-foreground">{order.date}</p>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-foreground font-semibold">${order.total.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-muted-foreground">{order.items} items</span>
                    </div>
                    {order.trackingNumber && (
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <span className="text-muted-foreground text-sm">{order.trackingNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" className="border-white/20 text-foreground hover:bg-background/10">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    {order.status === "delivered" && (
                      <Button
                        variant="outline"
                        className="border-white/20 text-foreground hover:bg-background/10"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reorder
                      </Button>
                    )}
                    {order.trackingNumber && (
                      <Link href={`/orders/${order.id}/track-map`}>
                        <Button
                          variant="outline"
                          className="border-white/20 text-foreground hover:bg-background/10"
                        >
                          <Truck className="w-4 h-4 mr-2" />
                          Track
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="p-6 bg-background text-foreground/10 backdrop-blur-xl border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Orders</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{orders.length}</p>
                </div>
                <Package className="w-12 h-12 text-purple-500" />
              </div>
            </Card>

            <Card className="p-6 bg-background text-foreground/10 backdrop-blur-xl border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Spent</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    ${orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-green-500" />
              </div>
            </Card>

            <Card className="p-6 bg-background text-foreground/10 backdrop-blur-xl border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Items Purchased</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {orders.reduce((sum, order) => sum + order.items, 0)}
                  </p>
                </div>
                <CheckCircle className="w-12 h-12 text-blue-500" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
