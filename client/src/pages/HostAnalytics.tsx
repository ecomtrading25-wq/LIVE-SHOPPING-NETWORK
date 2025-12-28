import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  DollarSign,
  Users,
  Eye,
  Heart,
  MessageSquare,
  Gift,
  Calendar,
  Download,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';

export default function HostAnalytics() {
  const [timeRange, setTimeRange] = useState('7d');

  // Fetch analytics data
  const { data: overview } = trpc.analytics.getOverview.useQuery({ range: timeRange });
  const { data: revenue } = trpc.analytics.getRevenue.useQuery({ range: timeRange });
  const { data: engagement } = trpc.analytics.getEngagement.useQuery({ range: timeRange });
  const { data: topShows } = trpc.analytics.getTopShows.useQuery({ range: timeRange, limit: 10 });
  const { data: topGifts } = trpc.analytics.getTopGifts.useQuery({ range: timeRange, limit: 5 });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <BarChart3 className="w-10 h-10 text-blue-600" />
              Host Analytics
            </h1>
            <p className="text-gray-600">Track your performance and earnings</p>
          </div>
          <div className="flex gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Total Revenue</span>
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-3xl font-bold mb-1">
                {formatCurrency(revenue?.total || 0)}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-600">+{revenue?.growth || 0}%</span>
                <span className="text-gray-500">vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Total Views</span>
                <Eye className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-3xl font-bold mb-1">
                {formatNumber(overview?.totalViews || 0)}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-blue-600">{overview?.avgViewDuration || 0}m</span>
                <span className="text-gray-500">avg duration</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Followers</span>
                <Users className="w-6 h-6 text-purple-500" />
              </div>
              <p className="text-3xl font-bold mb-1">
                {formatNumber(overview?.totalFollowers || 0)}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-purple-600">+{overview?.newFollowers || 0}</span>
                <span className="text-gray-500">this period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Engagement Rate</span>
                <Heart className="w-6 h-6 text-pink-500" />
              </div>
              <p className="text-3xl font-bold mb-1">
                {engagement?.rate || 0}%
              </p>
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4 text-pink-500" />
                <span className="text-pink-600">{formatNumber(engagement?.totalMessages || 0)}</span>
                <span className="text-gray-500">messages</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Revenue Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Gift className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Virtual Gifts</span>
                  </div>
                  <span className="font-bold text-green-600">
                    {formatCurrency(revenue?.gifts || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Product Sales</span>
                  </div>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(revenue?.products || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Subscriptions</span>
                  </div>
                  <span className="font-bold text-purple-600">
                    {formatCurrency(revenue?.subscriptions || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Top Gifts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topGifts?.map((gift: any, index: number) => (
                  <div
                    key={gift.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className="w-6 h-6 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{gift.name}</p>
                        <p className="text-sm text-gray-500">{gift.count} sent</p>
                      </div>
                    </div>
                    <span className="font-bold">{formatCurrency(gift.revenue)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Shows */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Top Performing Shows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topShows?.map((show: any) => (
                <div
                  key={show.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{show.title}</h3>
                      <Badge variant="outline">
                        {new Date(show.date).toLocaleDateString()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{formatNumber(show.views)} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{formatNumber(show.messages)} messages</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Gift className="w-4 h-4" />
                        <span>{show.gifts} gifts</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(show.revenue)}
                    </p>
                    <p className="text-sm text-gray-500">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
