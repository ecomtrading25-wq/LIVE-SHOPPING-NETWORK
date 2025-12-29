import { useState } from 'react';
import {
  Store,
  Package,
  DollarSign,
  TrendingUp,
  Users,
  ShoppingBag,
  BarChart3,
  Settings,
  Bell,
  Upload,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  Filter,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  MessageSquare,
  Truck,
  CreditCard,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface VendorStats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  activeProducts: number;
  productsChange: number;
  avgRating: number;
  ratingChange: number;
  pendingOrders: number;
  lowStockProducts: number;
  totalViews: number;
  conversionRate: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
  category: string;
  images: string[];
  status: 'active' | 'draft' | 'archived';
  views: number;
  sales: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  shippingAddress: string;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image: string;
}

export default function VendorDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productFilter, setProductFilter] = useState<'all' | 'active' | 'draft' | 'lowStock'>('all');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'processing' | 'shipped'>('all');

  // Fetch vendor stats
  const { data: stats, refetch: refetchStats } = trpc.vendor.getStats.useQuery({ timeRange });

  // Fetch vendor products
  const { data: products, refetch: refetchProducts } = trpc.vendor.getProducts.useQuery({
    filter: productFilter,
  });

  // Fetch vendor orders
  const { data: orders, refetch: refetchOrders } = trpc.vendor.getOrders.useQuery({
    filter: orderFilter,
  });

  // Fetch revenue data
  const { data: revenueData } = trpc.vendor.getRevenueData.useQuery({ timeRange });

  // Create product mutation
  const createProduct = trpc.vendor.createProduct.useMutation({
    onSuccess: () => {
      toast({ title: 'Product created successfully!' });
      setShowAddProduct(false);
      refetchProducts();
      refetchStats();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update product mutation
  const updateProduct = trpc.vendor.updateProduct.useMutation({
    onSuccess: () => {
      toast({ title: 'Product updated successfully!' });
      setSelectedProduct(null);
      refetchProducts();
    },
  });

  // Delete product mutation
  const deleteProduct = trpc.vendor.deleteProduct.useMutation({
    onSuccess: () => {
      toast({ title: 'Product deleted successfully!' });
      refetchProducts();
      refetchStats();
    },
  });

  // Update order status mutation
  const updateOrderStatus = trpc.vendor.updateOrderStatus.useMutation({
    onSuccess: () => {
      toast({ title: 'Order status updated!' });
      refetchOrders();
    },
  });

  // Bulk upload products mutation
  const bulkUploadProducts = trpc.vendor.bulkUploadProducts.useMutation({
    onSuccess: (result) => {
      toast({
        title: 'Bulk upload complete!',
        description: `${result.success} products uploaded, ${result.failed} failed`,
      });
      refetchProducts();
      refetchStats();
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'delivered':
      case 'paid':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'processing':
      case 'shipped':
        return 'bg-blue-500/20 text-blue-400';
      case 'cancelled':
      case 'refunded':
      case 'archived':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'processing':
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'cancelled':
      case 'refunded':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Vendor Dashboard</h1>
            <p className="text-muted-foreground">Manage your store, products, and orders</p>
          </div>

          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-40 bg-background/10 border-white/20 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>

            <Button onClick={() => setShowAddProduct(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-background text-foreground/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <Badge className={stats?.revenueChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                  {stats?.revenueChange >= 0 ? '+' : ''}{stats?.revenueChange.toFixed(1)}%
                </Badge>
              </div>
              <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(stats?.totalRevenue || 0)}</p>
            </CardContent>
          </Card>

          <Card className="bg-background text-foreground/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-blue-400" />
                </div>
                <Badge className={stats?.ordersChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                  {stats?.ordersChange >= 0 ? '+' : ''}{stats?.ordersChange.toFixed(1)}%
                </Badge>
              </div>
              <p className="text-gray-400 text-sm mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-foreground">{formatNumber(stats?.totalOrders || 0)}</p>
            </CardContent>
          </Card>

          <Card className="bg-background text-foreground/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Package className="w-6 h-6 text-red-400" />
                </div>
                <Badge className={stats?.productsChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                  {stats?.productsChange >= 0 ? '+' : ''}{stats?.productsChange.toFixed(1)}%
                </Badge>
              </div>
              <p className="text-gray-400 text-sm mb-1">Active Products</p>
              <p className="text-3xl font-bold text-foreground">{stats?.activeProducts || 0}</p>
            </CardContent>
          </Card>

          <Card className="bg-background text-foreground/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-400" />
                </div>
                <Badge className={stats?.ratingChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                  {stats?.ratingChange >= 0 ? '+' : ''}{stats?.ratingChange.toFixed(1)}%
                </Badge>
              </div>
              <p className="text-gray-400 text-sm mb-1">Average Rating</p>
              <p className="text-3xl font-bold text-foreground">{(stats?.avgRating || 0).toFixed(1)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-background text-foreground/10 backdrop-blur border-white/20 hover:bg-background text-foreground/20 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.pendingOrders || 0}</p>
                  <p className="text-gray-400 text-sm">Pending Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background text-foreground/10 backdrop-blur border-white/20 hover:bg-background text-foreground/20 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.lowStockProducts || 0}</p>
                  <p className="text-gray-400 text-sm">Low Stock Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background text-foreground/10 backdrop-blur border-white/20 hover:bg-background text-foreground/20 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(stats?.totalViews || 0)}</p>
                  <p className="text-gray-400 text-sm">Total Views</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="bg-background text-foreground/10 backdrop-blur border-white/20">
          <CardHeader>
            <CardTitle className="text-foreground">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-end justify-between gap-2">
              {revenueData?.daily?.map((point: any, index: number) => {
                const maxValue = Math.max(...(revenueData.daily?.map((p: any) => p.value) || [1]));
                const height = (point.value / maxValue) * 100;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gradient-to-t from-red-500 to-orange-500 rounded-t hover:opacity-80 transition-opacity cursor-pointer relative group"
                      style={{ height: `${height}%`, minHeight: '4px' }}
                    >
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-background/80 text-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {formatCurrency(point.value)}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 rotate-45 origin-left">
                      {point.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-background text-foreground/10 backdrop-blur border-white/20">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Search products..."
                  className="w-80 bg-background/10 border-white/20 text-foreground"
                />
                <Select value={productFilter} onValueChange={(value: any) => setProductFilter(value)}>
                  <SelectTrigger className="w-40 bg-background/10 border-white/20 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="lowStock">Low Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload
                </Button>
                <Button onClick={() => setShowAddProduct(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>

            <Card className="bg-background text-foreground/10 backdrop-blur border-white/20">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/20">
                    <TableHead className="text-foreground">Product</TableHead>
                    <TableHead className="text-foreground">SKU</TableHead>
                    <TableHead className="text-foreground">Price</TableHead>
                    <TableHead className="text-foreground">Stock</TableHead>
                    <TableHead className="text-foreground">Sales</TableHead>
                    <TableHead className="text-foreground">Rating</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product: Product) => (
                    <TableRow key={product.id} className="border-white/10">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images[0] || '/placeholder.jpg'}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <p className="text-foreground font-semibold">{product.name}</p>
                            <p className="text-gray-400 text-sm">{product.category}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                      <TableCell className="text-foreground font-semibold">
                        {formatCurrency(product.price)}
                      </TableCell>
                      <TableCell>
                        <span className={product.stock < 10 ? 'text-red-400' : 'text-muted-foreground'}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{product.sales}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-foreground">{product.rating.toFixed(1)}</span>
                          <span className="text-gray-400 text-sm">({product.reviewCount})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(product.status)}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedProduct(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteProduct.mutate({ productId: product.id })}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Search orders..."
                  className="w-80 bg-background/10 border-white/20 text-foreground"
                />
                <Select value={orderFilter} onValueChange={(value: any) => setOrderFilter(value)}>
                  <SelectTrigger className="w-40 bg-background/10 border-white/20 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Orders
              </Button>
            </div>

            <div className="space-y-4">
              {orders?.map((order: Order) => (
                <Card key={order.id} className="bg-background text-foreground/10 backdrop-blur border-white/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-1">
                          Order #{order.orderNumber}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {new Date(order.createdAt).toLocaleDateString()} •{' '}
                          {order.customerName}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-2">{order.status}</span>
                        </Badge>
                        <Badge className={getStatusColor(order.paymentStatus)}>
                          {order.paymentStatus}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-background text-foreground/5 rounded">
                          <img
                            src={item.image || '/placeholder.jpg'}
                            alt={item.productName}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="text-foreground font-semibold text-sm">{item.productName}</p>
                            <p className="text-gray-400 text-xs">
                              Qty: {item.quantity} × {formatCurrency(item.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex gap-4">
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            updateOrderStatus.mutate({ orderId: order.id, status: value })
                          }
                        >
                          <SelectTrigger className="w-40 bg-background/10 border-white/20 text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>

                        {order.trackingNumber && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Truck className="w-4 h-4" />
                            <span>Tracking: {order.trackingNumber}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-gray-400 text-sm">Total Amount</p>
                        <p className="text-2xl font-bold text-foreground">
                          {formatCurrency(order.totalAmount)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-background text-foreground/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-foreground">Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {products?.slice(0, 5).map((product: Product, index: number) => (
                      <div key={product.id} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-foreground font-bold">
                          {index + 1}
                        </div>
                        <img
                          src={product.images[0] || '/placeholder.jpg'}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="text-foreground font-semibold">{product.name}</p>
                          <p className="text-gray-400 text-sm">{product.sales} sales</p>
                        </div>
                        <p className="text-foreground font-bold">
                          {formatCurrency(product.price * product.sales)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background text-foreground/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-foreground">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Conversion Rate</span>
                      <span className="text-foreground font-semibold">
                        {(stats?.conversionRate || 0).toFixed(2)}%
                      </span>
                    </div>
                    <Progress value={stats?.conversionRate || 0} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Customer Satisfaction</span>
                      <span className="text-foreground font-semibold">
                        {((stats?.avgRating || 0) / 5 * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={(stats?.avgRating || 0) / 5 * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Inventory Health</span>
                      <span className="text-foreground font-semibold">
                        {(((stats?.activeProducts || 0) - (stats?.lowStockProducts || 0)) / (stats?.activeProducts || 1) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={((stats?.activeProducts || 0) - (stats?.lowStockProducts || 0)) / (stats?.activeProducts || 1) * 100}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-background text-foreground/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-foreground">Store Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="store-name" className="text-foreground">Store Name</Label>
                  <Input
                    id="store-name"
                    placeholder="Your Store Name"
                    className="bg-background/10 border-white/20 text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="store-description" className="text-foreground">Store Description</Label>
                  <Textarea
                    id="store-description"
                    placeholder="Describe your store..."
                    rows={4}
                    className="bg-background/10 border-white/20 text-foreground"
                  />
                </div>

                <div>
                  <Label htmlFor="store-logo" className="text-foreground">Store Logo</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="w-24 h-24 bg-background text-foreground/10 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button>Save Changes</Button>
                  <Button variant="outline">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showAddProduct || !!selectedProduct} onOpenChange={(open) => {
        if (!open) {
          setShowAddProduct(false);
          setSelectedProduct(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {selectedProduct ? 'Update product details' : 'Create a new product for your store'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="product-name">Product Name</Label>
              <Input id="product-name" placeholder="Enter product name" />
            </div>

            <div>
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                placeholder="Describe your product..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-price">Price</Label>
                <Input id="product-price" type="number" placeholder="0.00" />
              </div>

              <div>
                <Label htmlFor="product-stock">Stock</Label>
                <Input id="product-stock" type="number" placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-sku">SKU</Label>
                <Input id="product-sku" placeholder="PROD-001" />
              </div>

              <div>
                <Label htmlFor="product-category">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="fashion">Fashion</SelectItem>
                    <SelectItem value="home">Home & Garden</SelectItem>
                    <SelectItem value="beauty">Beauty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Product Images</Label>
              <div className="flex gap-4 mt-2">
                <Button variant="outline" asChild>
                  <label className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Images
                    <input type="file" accept="image/*" multiple className="hidden" />
                  </label>
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => {
                // Handle save
                setShowAddProduct(false);
                setSelectedProduct(null);
              }}>
                {selectedProduct ? 'Update Product' : 'Create Product'}
              </Button>
              <Button variant="outline" onClick={() => {
                setShowAddProduct(false);
                setSelectedProduct(null);
              }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
