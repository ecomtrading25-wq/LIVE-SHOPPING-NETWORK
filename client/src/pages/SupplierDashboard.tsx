import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Upload,
  Edit,
  Eye,
  BarChart3,
  MessageCircle,
  Settings,
  Plus,
  Download,
} from "lucide-react";

/**
 * Supplier Portal Dashboard
 * Vendor product catalog management, sales analytics, order processing, commission tracking
 */

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  sold: number;
  revenue: number;
  status: "active" | "draft" | "out_of_stock";
  image: string;
}

interface Order {
  id: string;
  productName: string;
  quantity: number;
  total: number;
  commission: number;
  status: "pending" | "processing" | "shipped" | "delivered";
  date: string;
}

interface Commission {
  month: string;
  sales: number;
  commission: number;
  status: "paid" | "pending";
  paidDate?: string;
}

export default function SupplierDashboardPage() {
  const [selectedTab, setSelectedTab] = useState("overview");

  // Mock supplier stats
  const stats = {
    totalRevenue: 156780,
    totalCommission: 23517,
    pendingCommission: 4890,
    activeProducts: 45,
    totalOrders: 892,
    avgRating: 4.7,
  };

  // Mock products
  const products: Product[] = [
    {
      id: "PROD-001",
      name: "Wireless Headphones Pro",
      sku: "WHP-001",
      price: 299.99,
      stock: 45,
      sold: 234,
      revenue: 70197.66,
      status: "active",
      image: "/placeholder-product.jpg",
    },
    {
      id: "PROD-002",
      name: "Smart Watch Ultra",
      sku: "SWU-002",
      price: 399.99,
      stock: 0,
      sold: 189,
      revenue: 75598.11,
      status: "out_of_stock",
      image: "/placeholder-product.jpg",
    },
    {
      id: "PROD-003",
      name: "Portable Charger 20K",
      sku: "PCH-003",
      price: 49.99,
      stock: 156,
      sold: 456,
      revenue: 22795.44,
      status: "active",
      image: "/placeholder-product.jpg",
    },
  ];

  // Mock orders
  const orders: Order[] = [
    {
      id: "ORD-001",
      productName: "Wireless Headphones Pro",
      quantity: 2,
      total: 599.98,
      commission: 89.99,
      status: "delivered",
      date: "2025-12-25T00:00:00Z",
    },
    {
      id: "ORD-002",
      productName: "Smart Watch Ultra",
      quantity: 1,
      total: 399.99,
      commission: 59.99,
      status: "shipped",
      date: "2025-12-26T00:00:00Z",
    },
    {
      id: "ORD-003",
      productName: "Portable Charger 20K",
      quantity: 5,
      total: 249.95,
      commission: 37.49,
      status: "processing",
      date: "2025-12-27T00:00:00Z",
    },
  ];

  // Mock commission history
  const commissions: Commission[] = [
    {
      month: "Dec 2025",
      sales: 45680,
      commission: 6852,
      status: "pending",
    },
    {
      month: "Nov 2025",
      sales: 52340,
      commission: 7851,
      status: "paid",
      paidDate: "2025-12-01",
    },
    {
      month: "Oct 2025",
      sales: 48920,
      commission: 7338,
      status: "paid",
      paidDate: "2025-11-01",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "delivered":
      case "paid":
        return "bg-green-500/20 text-green-400";
      case "processing":
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "shipped":
        return "bg-blue-500/20 text-blue-400";
      case "out_of_stock":
      case "draft":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b bg-card text-card-foreground">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Supplier Portal</h1>
              <p className="text-muted-foreground">
                Manage your products, orders, and commissions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <MessageCircle className="w-4 h-4 mr-2" />
                Messages
              </Button>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold mb-1">${stats.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-green-500">+18.2% from last month</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Commission Earned</p>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold mb-1">${stats.totalCommission.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">15% commission rate</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Pending Payout</p>
              <DollarSign className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold mb-1">${stats.pendingCommission.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Paid on Jan 1</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Active Products</p>
              <Package className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.activeProducts}</p>
            <p className="text-xs text-muted-foreground">3 out of stock</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <ShoppingCart className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.totalOrders}</p>
            <p className="text-xs text-green-500">+24 this week</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Avg Rating</p>
              <BarChart3 className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.avgRating}</p>
            <p className="text-xs text-muted-foreground">From 234 reviews</p>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="w-4 h-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="commissions">
              <DollarSign className="w-4 h-4 mr-2" />
              Commissions
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Sales Performance</h2>
                <div className="space-y-4">
                  {[
                    { month: "Sep", sales: 38500 },
                    { month: "Oct", sales: 48920 },
                    { month: "Nov", sales: 52340 },
                    { month: "Dec", sales: 45680 },
                  ].map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.month} 2025</span>
                        <span className="font-bold">${item.sales.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${(item.sales / 55000) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Top Products</h2>
                <div className="space-y-3">
                  {products.slice(0, 3).map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-secondary rounded-lg" />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.sold} sold</p>
                        </div>
                      </div>
                      <p className="font-bold">${product.revenue.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Product Catalog</h2>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>

              <div className="space-y-4">
                {products.map((product) => (
                  <Card key={product.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-secondary rounded-lg flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{product.name}</h3>
                          <Badge className={getStatusColor(product.status)}>{product.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">SKU: {product.sku}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Price: ${product.price}</span>
                          <span>•</span>
                          <span>Stock: {product.stock}</span>
                          <span>•</span>
                          <span>Sold: {product.sold}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold mb-1">${product.revenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Total Revenue</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Recent Orders</h2>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{order.id}</h3>
                          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{order.productName}</p>
                        <p className="text-sm">
                          Quantity: {order.quantity} • Total: ${order.total}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-500 mb-1">
                          +${order.commission}
                        </p>
                        <p className="text-xs text-muted-foreground">Commission</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(order.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Commission History</h2>

              <div className="space-y-4">
                {commissions.map((comm, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{comm.month}</h3>
                          <Badge className={getStatusColor(comm.status)}>{comm.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Sales: ${comm.sales.toLocaleString()}
                        </p>
                        {comm.paidDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Paid on {new Date(comm.paidDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">${comm.commission.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {((comm.commission / comm.sales) * 100).toFixed(1)}% rate
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="p-4 mt-6 bg-green-500/10 border-green-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-green-500 mb-1">Next Payout</p>
                    <p className="text-sm text-muted-foreground">
                      ${stats.pendingCommission.toLocaleString()} will be paid on January 1, 2026
                    </p>
                  </div>
                  <Button variant="outline">View Details</Button>
                </div>
              </Card>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
