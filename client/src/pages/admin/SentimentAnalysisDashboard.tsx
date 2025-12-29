import { useState, useEffect, useMemo, useCallback } from 'react';
import { ExportModal } from '@/components/ExportModal';
import { formatPercentage } from '@/lib/exportUtils';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MessageSquare, 
  TrendingUp,
  TrendingDown,
  Smile,
  Frown,
  Meh,
  Star,
  Search,
  Download,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export default function SentimentAnalysisDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [exportOpen, setExportOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useLocalStorage<'off' | '30s' | '1m' | '5m'>('dashboard-autorefresh', 'off');
  const { toast } = useToast();

  // Fetch overview data
  const { data: overview, isLoading: overviewLoading, error: overviewError, refetch: refetchOverview } = 
    trpc.aiDashboards.sentimentAnalysis.overview.useQuery();

  // Fetch reviews data
  const { data: reviews, isLoading: reviewsLoading, error: reviewsError, refetch: refetchReviews } = 
    trpc.aiDashboards.sentimentAnalysis.reviews.useQuery();

  // Fetch distribution data
  const { data: distribution, isLoading: distributionLoading, error: distributionError, refetch: refetchDistribution } = 
    trpc.aiDashboards.sentimentAnalysis.distribution.useQuery();

  const isLoading = overviewLoading || reviewsLoading || distributionLoading;
  const hasError = overviewError || reviewsError || distributionError;

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await Promise.all([refetchOverview(), refetchReviews(), refetchDistribution()]);
      toast({
        title: 'Data Refreshed',
        description: 'Dashboard data has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Error boundary
  if (hasError) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-500/50 bg-red-500/10">
          <div className="p-6">
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Failed to Load Dashboard</h3>
            </div>
            <p className="text-red-400 mb-4">
              {overviewError?.message || reviewsError?.message || distributionError?.message || 'An error occurred while loading the dashboard.'}
            </p>
            <Button onClick={handleRefresh} variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/20">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Filter reviews
  const filteredReviews = (reviews || [])
    .filter((r: any) => {
      const matchesSearch = r.productName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                           r.reviewText.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesSentiment = sentimentFilter === 'all' || r.sentiment === sentimentFilter;
      return matchesSearch && matchesSentiment;
    });

  // Mock data - replace with actual tRPC calls
const mockSentimentData = {
  overallScore: 72,
  totalReviews: 1247,
  distribution: {
    positive: 68,
    neutral: 22,
    negative: 10
  },
  trend: [
    { month: 'Jan', score: 68, reviews: 187 },
    { month: 'Feb', score: 70, reviews: 203 },
    { month: 'Mar', score: 69, reviews: 195 },
    { month: 'Apr', score: 73, reviews: 218 },
    { month: 'May', score: 74, reviews: 225 },
    { month: 'Jun', score: 72, reviews: 219 }
  ],
  themes: [
    { theme: 'Quality', sentiment: 85, count: 342, change: 5 },
    { theme: 'Value', sentiment: 78, count: 289, change: 3 },
    { theme: 'Shipping', sentiment: 62, count: 156, change: -8 },
    { theme: 'Customer Service', sentiment: 88, count: 267, change: 12 },
    { theme: 'Packaging', sentiment: 71, count: 134, change: -2 },
    { theme: 'Product Accuracy', sentiment: 82, count: 198, change: 7 }
  ],
  topProducts: [
    { id: '1', name: 'Wireless Headphones Pro', score: 92, reviews: 156, positive: 88, neutral: 8, negative: 4 },
    { id: '2', name: 'Smart Watch Ultra', score: 88, reviews: 134, positive: 82, neutral: 12, negative: 6 },
    { id: '3', name: 'Portable Charger 20K', score: 85, reviews: 98, positive: 79, neutral: 15, negative: 6 },
    { id: '4', name: 'Bluetooth Speaker Mini', score: 65, reviews: 87, positive: 58, neutral: 20, negative: 22 }
  ],
  recentReviews: [
    {
      id: '1',
      product: 'Wireless Headphones Pro',
      rating: 5,
      sentiment: 'positive' as const,
      text: 'Amazing sound quality! Best headphones I\'ve ever owned. Highly recommend.',
      author: 'Sarah J.',
      date: '2 hours ago',
      themes: ['Quality', 'Value']
    },
    {
      id: '2',
      product: 'Smart Watch Ultra',
      rating: 4,
      sentiment: 'positive' as const,
      text: 'Great features but battery life could be better. Overall very satisfied.',
      author: 'Michael C.',
      date: '5 hours ago',
      themes: ['Quality', 'Product Accuracy']
    },
    {
      id: '3',
      product: 'Bluetooth Speaker Mini',
      rating: 2,
      sentiment: 'negative' as const,
      text: 'Sound quality is disappointing for the price. Expected much better.',
      author: 'Emily R.',
      date: '1 day ago',
      themes: ['Quality', 'Value']
    }
  ],
  aspectAnalysis: [
    { aspect: 'Quality', score: 85 },
    { aspect: 'Value', score: 78 },
    { aspect: 'Features', score: 82 },
    { aspect: 'Design', score: 88 },
    { aspect: 'Durability', score: 76 },
    { aspect: 'Support', score: 88 }
  ]
};

  const sentimentDistribution = distribution || [
    { name: 'Positive', value: 0, color: '#22c55e' },
    { name: 'Neutral', value: 0, color: '#eab308' },
    { name: 'Negative', value: 0, color: '#ef4444' }
  ];

  // filteredReviews already defined above

  const getSentimentIcon = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return <Smile className="w-5 h-5 text-green-500" />;
      case 'neutral':
        return <Meh className="w-5 h-5 text-yellow-500" />;
      case 'negative':
        return <Frown className="w-5 h-5 text-red-500" />;
    }
  };

  const getSentimentColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSentimentBadge = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sentiment Analysis</h1>
            <p className="text-muted-foreground">AI-powered review analysis and customer sentiment tracking</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={autoRefresh} onValueChange={(v: any) => setAutoRefresh(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Auto: Off</SelectItem>
                <SelectItem value="30s">Auto: 30s</SelectItem>
                <SelectItem value="1m">Auto: 1m</SelectItem>
                <SelectItem value="5m">Auto: 5m</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setExportOpen(true)}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Score</span>
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <div className={`text-3xl font-bold ${getSentimentColor(mockSentimentData.overallScore)}`}>
              {mockSentimentData.overallScore}%
            </div>
            <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +4% vs last month
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Reviews</span>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold">{mockSentimentData.totalReviews.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground mt-1">
              All-time reviews
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Positive Rate</span>
              <ThumbsUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-600">
              {mockSentimentData.distribution.positive}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {Math.round(mockSentimentData.totalReviews * mockSentimentData.distribution.positive / 100)} reviews
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Negative Rate</span>
              <ThumbsDown className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-red-600">
              {mockSentimentData.distribution.negative}%
            </div>
            <div className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Needs attention
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sentiment Distribution */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Sentiment Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sentimentDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {sentimentDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Sentiment Trend */}
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">Sentiment Trend</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={mockSentimentData.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} name="Sentiment Score" />
                <Line type="monotone" dataKey="reviews" stroke="#8b5cf6" strokeWidth={2} name="Review Count" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Aspect Analysis */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Aspect Analysis</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={mockSentimentData.aspectAnalysis}>
              <PolarGrid />
              <PolarAngleAxis dataKey="aspect" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar name="Sentiment Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Theme Breakdown */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Theme Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockSentimentData.themes.map((theme) => (
              <Card key={theme.theme} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium">{theme.theme}</div>
                    <div className="text-sm text-muted-foreground">{theme.count} mentions</div>
                  </div>
                  <Badge className={getSentimentBadge(theme.sentiment)}>
                    {theme.sentiment}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {theme.change > 0 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{theme.change}%
                    </span>
                  ) : theme.change < 0 ? (
                    <span className="text-red-600 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      {theme.change}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No change</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Top Products by Sentiment */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Top Products by Sentiment</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-left p-3 font-medium">Score</th>
                  <th className="text-left p-3 font-medium">Reviews</th>
                  <th className="text-left p-3 font-medium">Distribution</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockSentimentData.topProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-accent/50">
                    <td className="p-3">
                      <div className="font-medium">{product.name}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getSentimentBadge(product.score)}>
                          {product.score}%
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{product.reviews}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-600">{product.positive}%</span>
                        <span className="text-yellow-600">{product.neutral}%</span>
                        <span className="text-red-600">{product.negative}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Reviews */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Reviews</h2>
            <div className="flex gap-2">
              <Input
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getSentimentIcon(review.sentiment)}
                    <div>
                      <div className="font-medium">{review.product}</div>
                      <div className="text-sm text-muted-foreground">
                        {review.author} • {review.date}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm mb-2">{review.text}</p>
                <div className="flex gap-2">
                  {review.themes.map((theme) => (
                    <Badge key={theme} variant="outline" className="text-xs">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* AI Insights */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            AI Insights & Recommendations
          </h3>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
              <span>
                <strong>Shipping concerns increasing:</strong> Negative sentiment around shipping has increased by 8% this month. Consider reviewing carrier performance and delivery times.
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
              <span>
                <strong>Customer Service excellence:</strong> Customer service sentiment improved by 12%. This is a key differentiator - highlight in marketing materials.
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
              <span>
                <strong>Product quality praised:</strong> 85% positive sentiment on quality. Use customer quotes in product descriptions to boost conversion.
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Export Modal */}
      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Sentiment Analysis Report"
        data={filteredReviews.map(r => ({
          product: r.product,
          customer: r.customer,
          rating: r.rating,
          sentiment: r.sentiment,
          sentimentScore: r.sentimentScore,
          date: r.date,
          review: r.review
        }))}
        columns={[
          { key: 'product', label: 'Product' },
          { key: 'customer', label: 'Customer' },
          { key: 'rating', label: 'Rating' },
          { key: 'sentiment', label: 'Sentiment' },
          { key: 'sentimentScore', label: 'Sentiment Score', formatter: formatPercentage },
          { key: 'date', label: 'Date' },
          { key: 'review', label: 'Review' }
        ]}
      />
    </div>
  );
}
