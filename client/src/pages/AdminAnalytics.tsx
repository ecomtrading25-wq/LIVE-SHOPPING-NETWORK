/**
 * Admin Analytics Dashboard
 * Comprehensive analytics visualization with Chart.js
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { trpc } from '@/lib/trpc';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart,
  Eye,
  MessageSquare,
  Heart,
  Activity,
  Download,
} from 'lucide-react';

type TimeRange = 'day' | 'week' | 'month' | 'year';
type GroupBy = 'day' | 'week' | 'month';

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [groupBy, setGroupBy] = useState<GroupBy>('day');

  // Calculate date range
  const dateRange = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  }, [timeRange]);

  // Fetch analytics data
  const { data: platformStats, isLoading: platformLoading } = trpc.analytics.getPlatformStats.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: revenueData, isLoading: revenueLoading } = trpc.analytics.getRevenueAnalytics.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    groupBy,
  });

  const { data: topHosts, isLoading: hostsLoading } = trpc.analytics.getTopHosts.useQuery({
    limit: 10,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: topProducts, isLoading: productsLoading } = trpc.analytics.getTopProducts.useQuery({
    limit: 10,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: topShows, isLoading: showsLoading } = trpc.analytics.getTopShows.useQuery({
    limit: 10,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const isLoading = platformLoading || revenueLoading || hostsLoading || productsLoading || showsLoading;

  // Chart colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format number
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Export data
  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Exporting analytics data...');
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into platform performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 24h</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(platformStats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Platform fee: {formatCurrency(platformStats?.platformFee || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(platformStats?.totalOrders || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: {formatCurrency(platformStats?.averageOrderValue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Viewers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(platformStats?.totalViewers || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Conversion: {platformStats?.conversionRate.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Shows</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(platformStats?.totalShows || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Hosts: {formatNumber(platformStats?.totalHosts || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="revenue" className="mb-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="hosts">Top Hosts</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="shows">Top Shows</TabsTrigger>
        </TabsList>

        {/* Revenue Chart */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>
                Revenue trends with platform fee breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={revenueData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="totalRevenue"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    name="Total Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="platformFee"
                    stackId="2"
                    stroke="#10b981"
                    fill="#10b981"
                    name="Platform Fee"
                  />
                  <Area
                    type="monotone"
                    dataKey="hostEarnings"
                    stackId="2"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    name="Host Earnings"
                  />
                </AreaChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Orders</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(revenueData?.reduce((sum, d) => sum + d.orderCount, 0) || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      (revenueData?.reduce((sum, d) => sum + d.averageOrderValue, 0) || 0) /
                        (revenueData?.length || 1)
                    )}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(revenueData?.reduce((sum, d) => sum + d.totalRevenue, 0) || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Hosts Chart */}
        <TabsContent value="hosts">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Hosts</CardTitle>
              <CardDescription>
                Hosts ranked by total revenue generated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topHosts || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="hostName" type="category" width={150} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="totalRevenue" fill="#3b82f6" name="Revenue" />
                  <Bar dataKey="totalOrders" fill="#10b981" name="Orders" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 space-y-4">
                {topHosts?.slice(0, 5).map((host, index) => (
                  <div key={host.hostId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{host.hostName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(host.totalShows)} shows • {formatNumber(host.totalViewers)} viewers
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(host.totalRevenue)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(host.totalOrders)} orders
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Products Chart */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>
                Products ranked by total revenue and order count
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topProducts || []}
                      dataKey="totalRevenue"
                      nameKey="productName"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.productName}: ${formatCurrency(entry.totalRevenue)}`}
                    >
                      {(topProducts || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-3">
                  {topProducts?.map((product, index) => (
                    <div key={product.productId} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium">{product.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(product.totalOrders)} orders • {product.conversionRate.toFixed(2)}% conversion
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(product.totalRevenue)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(product.averagePrice)} avg
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Shows Chart */}
        <TabsContent value="shows">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Shows</CardTitle>
              <CardDescription>
                Shows ranked by engagement and revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topShows || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === 'totalRevenue' ? formatCurrency(value) : formatNumber(value)
                    }
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="totalViewers" fill="#3b82f6" name="Viewers" />
                  <Bar dataKey="totalOrders" fill="#10b981" name="Orders" />
                  <Bar dataKey="totalRevenue" fill="#f59e0b" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {topShows?.map((show) => (
                  <div key={show.showId} className="p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2">{show.title}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Viewers</p>
                        <p className="font-medium">{formatNumber(show.totalViewers)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Orders</p>
                        <p className="font-medium">{formatNumber(show.totalOrders)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Revenue</p>
                        <p className="font-medium">{formatCurrency(show.totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conversion</p>
                        <p className="font-medium">{show.conversionRate.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
