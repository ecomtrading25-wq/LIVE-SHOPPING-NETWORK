import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Eye,
  Heart,
  Star,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: string;
}

interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export default function AdminAnalyticsDashboard() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard metrics
  const { data: metrics, refetch: refetchMetrics } = trpc.analytics.getDashboardMetrics.useQuery({
    timeRange,
  });

  // Fetch revenue data
  const { data: revenueData } = trpc.analytics.getRevenueData.useQuery({ timeRange });

  // Fetch product performance
  const { data: productPerformance } = trpc.analytics.getProductPerformance.useQuery({
    timeRange,
    limit: 10,
  });

  // Fetch customer insights
  const { data: customerInsights } = trpc.analytics.getCustomerInsights.useQuery({ timeRange });

  // Fetch conversion funnel
  const { data: conversionFunnel } = trpc.analytics.getConversionFunnel.useQuery({ timeRange });

  // Fetch live stream analytics
  const { data: liveStreamAnalytics } = trpc.analytics.getLiveStreamAnalytics.useQuery({
    timeRange,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchMetrics();
    toast({ title: 'Dashboard refreshed!' });
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const metricCards: MetricCard[] = [
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics?.totalRevenue || 0),
      change: metrics?.revenueChange || 0,
      trend: (metrics?.revenueChange || 0) >= 0 ? 'up' : 'down',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'text-green-500',
    },
    {
      title: 'Total Orders',
      value: formatNumber(metrics?.totalOrders || 0),
      change: metrics?.ordersChange || 0,
      trend: (metrics?.ordersChange || 0) >= 0 ? 'up' : 'down',
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'text-blue-500',
    },
    {
      title: 'Active Customers',
      value: formatNumber(metrics?.activeCustomers || 0),
      change: metrics?.customersChange || 0,
      trend: (metrics?.customersChange || 0) >= 0 ? 'up' : 'down',
      icon: <Users className="w-6 h-6" />,
      color: 'text-purple-500',
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(metrics?.avgOrderValue || 0),
      change: metrics?.aovChange || 0,
      trend: (metrics?.aovChange || 0) >= 0 ? 'up' : 'down',
      icon: <Package className="w-6 h-6" />,
      color: 'text-orange-500',
    },
    {
      title: 'Conversion Rate',
      value: `${(metrics?.conversionRate || 0).toFixed(2)}%`,
      change: metrics?.conversionChange || 0,
      trend: (metrics?.conversionChange || 0) >= 0 ? 'up' : 'down',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'text-pink-500',
    },
    {
      title: 'Live Stream Views',
      value: formatNumber(metrics?.liveStreamViews || 0),
      change: metrics?.viewsChange || 0,
      trend: (metrics?.viewsChange || 0) >= 0 ? 'up' : 'down',
      icon: <Eye className="w-6 h-6" />,
      color: 'text-red-500',
    },
    {
      title: 'Wishlist Adds',
      value: formatNumber(metrics?.wishlistAdds || 0),
      change: metrics?.wishlistChange || 0,
      trend: (metrics?.wishlistChange || 0) >= 0 ? 'up' : 'down',
      icon: <Heart className="w-6 h-6" />,
      color: 'text-rose-500',
    },
    {
      title: 'Avg Rating',
      value: (metrics?.avgRating || 0).toFixed(1),
      change: metrics?.ratingChange || 0,
      trend: (metrics?.ratingChange || 0) >= 0 ? 'up' : 'down',
      icon: <Star className="w-6 h-6" />,
      color: 'text-yellow-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Analytics Dashboard</h1>
            <p className="text-gray-300">Real-time insights and performance metrics</p>
          </div>

          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((metric, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={metric.color}>{metric.icon}</div>
                  <Badge
                    className={
                      metric.trend === 'up'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }
                  >
                    {metric.trend === 'up' ? (
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                    )}
                    {formatPercentage(metric.change)}
                  </Badge>
                </div>
                <p className="text-gray-400 text-sm mb-1">{metric.title}</p>
                <p className="text-3xl font-bold text-white">{metric.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur border-white/20">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
            <TabsTrigger value="livestream">Live Streams</TabsTrigger>
          </TabsList>

          {/* Revenue Analytics */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Chart */}
              <Card className="lg:col-span-2 bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-end justify-between gap-2">
                    {revenueData?.daily?.map((point: ChartDataPoint, index: number) => {
                      const maxValue = Math.max(...(revenueData.daily?.map((p: ChartDataPoint) => p.value) || [1]));
                      const height = (point.value / maxValue) * 100;

                      return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t hover:opacity-80 transition-opacity cursor-pointer relative group"
                            style={{ height: `${height}%`, minHeight: '4px' }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
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

              {/* Revenue Breakdown */}
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Product Sales</span>
                      <span className="text-white font-semibold">
                        {formatCurrency(revenueData?.breakdown?.products || 0)}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{
                          width: `${((revenueData?.breakdown?.products || 0) / (metrics?.totalRevenue || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Live Stream Sales</span>
                      <span className="text-white font-semibold">
                        {formatCurrency(revenueData?.breakdown?.liveStreams || 0)}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-red-500"
                        style={{
                          width: `${((revenueData?.breakdown?.liveStreams || 0) / (metrics?.totalRevenue || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Subscriptions</span>
                      <span className="text-white font-semibold">
                        {formatCurrency(revenueData?.breakdown?.subscriptions || 0)}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                        style={{
                          width: `${((revenueData?.breakdown?.subscriptions || 0) / (metrics?.totalRevenue || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Affiliate Commission</span>
                      <span className="text-white font-semibold">
                        {formatCurrency(revenueData?.breakdown?.affiliate || 0)}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                        style={{
                          width: `${((revenueData?.breakdown?.affiliate || 0) / (metrics?.totalRevenue || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue by Category */}
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Revenue by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {revenueData?.byCategory?.map((category: any, index: number) => (
                    <div key={index} className="p-4 bg-white/5 rounded-lg">
                      <p className="text-gray-400 text-sm mb-1">{category.name}</p>
                      <p className="text-2xl font-bold text-white mb-1">
                        {formatCurrency(category.revenue)}
                      </p>
                      <p className="text-xs text-gray-500">{category.orders} orders</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Product Performance */}
          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {productPerformance?.topSelling?.map((product: any, index: number) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <img
                          src={product.image || '/placeholder.jpg'}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="text-white font-semibold">{product.name}</p>
                          <p className="text-gray-400 text-sm">{product.unitsSold} units sold</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{formatCurrency(product.revenue)}</p>
                          <Badge className="bg-green-500/20 text-green-400 text-xs">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {product.growthRate}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Trending Products */}
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Trending Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {productPerformance?.trending?.map((product: any, index: number) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                        <img
                          src={product.image || '/placeholder.jpg'}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="text-white font-semibold">{product.name}</p>
                          <p className="text-gray-400 text-sm">{product.views} views</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-pink-500/20 text-pink-400">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {product.trendScore}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{product.wishlistAdds} wishlisted</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Product Metrics */}
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Product Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-white mb-2">
                      {productPerformance?.metrics?.totalProducts || 0}
                    </p>
                    <p className="text-gray-400 text-sm">Total Products</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-white mb-2">
                      {productPerformance?.metrics?.inStock || 0}
                    </p>
                    <p className="text-gray-400 text-sm">In Stock</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-white mb-2">
                      {productPerformance?.metrics?.lowStock || 0}
                    </p>
                    <p className="text-gray-400 text-sm">Low Stock</p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-white mb-2">
                      {(productPerformance?.metrics?.avgRating || 0).toFixed(1)}
                    </p>
                    <p className="text-gray-400 text-sm">Avg Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer Insights */}
          <TabsContent value="customers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Customer Segments */}
              <Card className="lg:col-span-2 bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Customer Segments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {customerInsights?.segments?.map((segment: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-semibold">{segment.name}</span>
                          <span className="text-gray-400">{segment.count} customers</span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${segment.color}`}
                            style={{
                              width: `${(segment.count / (customerInsights?.totalCustomers || 1)) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Avg Order Value: {formatCurrency(segment.avgOrderValue)}</span>
                          <span className="text-gray-500">Lifetime Value: {formatCurrency(segment.lifetimeValue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Customer Stats */}
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Customer Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">New Customers</p>
                    <p className="text-3xl font-bold text-white mb-2">
                      {customerInsights?.newCustomers || 0}
                    </p>
                    <Badge className="bg-green-500/20 text-green-400">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {customerInsights?.newCustomersChange || 0}%
                    </Badge>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm mb-1">Returning Customers</p>
                    <p className="text-3xl font-bold text-white mb-2">
                      {customerInsights?.returningCustomers || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      {((customerInsights?.returningCustomers || 0) / (customerInsights?.totalCustomers || 1) * 100).toFixed(1)}% retention rate
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm mb-1">Avg Lifetime Value</p>
                    <p className="text-3xl font-bold text-white">
                      {formatCurrency(customerInsights?.avgLifetimeValue || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Customers */}
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Top Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customerInsights?.topCustomers?.map((customer: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                        {customer.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{customer.name}</p>
                        <p className="text-gray-400 text-sm">{customer.orders} orders</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{formatCurrency(customer.totalSpent)}</p>
                        <Badge className="bg-purple-500/20 text-purple-400 text-xs mt-1">
                          {customer.tier}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversion Funnel */}
          <TabsContent value="conversion" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {conversionFunnel?.stages?.map((stage: any, index: number) => {
                    const percentage = (stage.count / (conversionFunnel?.stages?.[0]?.count || 1)) * 100;
                    const dropoff = index > 0
                      ? ((conversionFunnel.stages[index - 1].count - stage.count) / conversionFunnel.stages[index - 1].count) * 100
                      : 0;

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <span className="text-white font-semibold">{stage.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-bold">{formatNumber(stage.count)}</span>
                            <span className="text-gray-400 text-sm ml-2">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="h-12 bg-white/5 rounded-lg overflow-hidden relative">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-end px-4"
                            style={{ width: `${percentage}%` }}
                          >
                            {dropoff > 0 && (
                              <Badge className="bg-red-500/20 text-red-400 text-xs">
                                -{dropoff.toFixed(1)}% dropoff
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Conversion Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-400 text-sm mb-2">Overall Conversion Rate</p>
                  <p className="text-4xl font-bold text-white mb-2">
                    {(conversionFunnel?.overallConversionRate || 0).toFixed(2)}%
                  </p>
                  <Badge className="bg-green-500/20 text-green-400">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {conversionFunnel?.conversionRateChange || 0}%
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-400 text-sm mb-2">Cart Abandonment Rate</p>
                  <p className="text-4xl font-bold text-white mb-2">
                    {(conversionFunnel?.cartAbandonmentRate || 0).toFixed(2)}%
                  </p>
                  <Badge className="bg-red-500/20 text-red-400">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    {conversionFunnel?.abandonmentChange || 0}%
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-400 text-sm mb-2">Avg Time to Purchase</p>
                  <p className="text-4xl font-bold text-white mb-2">
                    {conversionFunnel?.avgTimeToPurchase || 0}h
                  </p>
                  <p className="text-xs text-gray-500">From first visit</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Live Stream Analytics */}
          <TabsContent value="livestream" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-6 text-center">
                  <Eye className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm mb-1">Total Views</p>
                  <p className="text-3xl font-bold text-white">
                    {formatNumber(liveStreamAnalytics?.totalViews || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-6 text-center">
                  <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm mb-1">Peak Viewers</p>
                  <p className="text-3xl font-bold text-white">
                    {formatNumber(liveStreamAnalytics?.peakViewers || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-6 text-center">
                  <ShoppingCart className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm mb-1">Live Sales</p>
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(liveStreamAnalytics?.totalSales || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm mb-1">Conversion Rate</p>
                  <p className="text-3xl font-bold text-white">
                    {(liveStreamAnalytics?.conversionRate || 0).toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Live Streams */}
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Recent Live Streams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {liveStreamAnalytics?.recentStreams?.map((stream: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                      <img
                        src={stream.thumbnail || '/placeholder.jpg'}
                        alt={stream.title}
                        className="w-24 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="text-white font-semibold">{stream.title}</p>
                        <p className="text-gray-400 text-sm">{stream.host}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(stream.date).toLocaleDateString()} • {stream.duration} min
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-white font-bold">{formatNumber(stream.views)} views</p>
                        <p className="text-green-400 text-sm">{formatCurrency(stream.revenue)}</p>
                        <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                          {stream.orders} orders
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
