import { useState, useEffect, useMemo, useCallback } from 'react';
import { ExportModal } from '@/components/ExportModal';
import { formatCurrency as formatCurrencyUtil, formatPercentage } from '@/lib/exportUtils';
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
  PieChart as PieChartIcon,
  Users,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Mail,
  Gift,
  AlertCircle,
  Download,
  RefreshCw,
  Search,
  Crown,
  Heart,
  Target,
  UserX
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
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

export default function RFMSegmentationDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'champions' | 'loyal' | 'potential' | 'at_risk' | 'lost'>('all');
  const [exportOpen, setExportOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useLocalStorage<'off' | '30s' | '1m' | '5m'>('dashboard-autorefresh', 'off');
  const { toast } = useToast();

  // Fetch overview data
  const { data: overview, isLoading: overviewLoading, error: overviewError, refetch: refetchOverview } = 
    trpc.aiDashboards.rfmSegmentation.getOverview.useQuery();

  // Fetch customers data
  const { data: customers, isLoading: customersLoading, error: customersError, refetch: refetchCustomers } = 
    trpc.aiDashboards.rfmSegmentation.getCustomers.useQuery({ 
      searchQuery: debouncedSearchQuery,
      segmentFilter: segmentFilter === 'all' ? 'all' : segmentFilter === 'champions' ? 'Champions' : segmentFilter === 'loyal' ? 'Loyal' : segmentFilter === 'potential' ? 'Potential' : segmentFilter === 'at_risk' ? 'At Risk' : 'Lost'
    });

  // Fetch distribution data
  const { data: distribution, isLoading: distributionLoading, error: distributionError, refetch: refetchDistribution } = 
    trpc.aiDashboards.rfmSegmentation.getSegmentDistribution.useQuery();

  const isLoading = overviewLoading || customersLoading || distributionLoading;
  const hasError = overviewError || customersError || distributionError;

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await Promise.all([refetchOverview(), refetchCustomers(), refetchDistribution()]);
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
              {overviewError?.message || customersError?.message || distributionError?.message || 'An error occurred while loading the dashboard.'}
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

  // Filter customers
  const filteredCustomers = (customers || [])
    .filter((c: any) => {
      const matchesSearch = c.customerName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                           c.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesSegment = segmentFilter === 'all' || c.segment === segmentFilter;
      return matchesSearch && matchesSegment;
    });

  // Mock data - replace with actual tRPC calls
const mockRFMData = {
  totalCustomers: 8547,
  avgOrderValue: 127.50,
  avgFrequency: 3.2,
  lastUpdated: '1 hour ago',
  distribution: [
    { segment: 'Champions', count: 1282, percentage: 15, color: '#10b981', icon: Crown },
    { segment: 'Loyal', count: 1709, percentage: 20, color: '#3b82f6', icon: Heart },
    { segment: 'Potential', count: 2564, percentage: 30, color: '#8b5cf6', icon: Target },
    { segment: 'At Risk', count: 1709, percentage: 20, color: '#f59e0b', icon: AlertCircle },
    { segment: 'Lost', count: 1283, percentage: 15, color: '#ef4444', icon: UserX }
  ],
  segmentMetrics: [
    {
      segment: 'Champions',
      customers: 1282,
      avgRFM: { recency: 9.2, frequency: 9.5, monetary: 9.8 },
      avgOrderValue: 285.50,
      totalRevenue: 366000,
      purchaseFrequency: 8.5,
      retentionRate: 95,
      description: 'Best customers who buy frequently and spend the most'
    },
    {
      segment: 'Loyal',
      customers: 1709,
      avgRFM: { recency: 7.8, frequency: 8.2, monetary: 7.5 },
      avgOrderValue: 198.00,
      totalRevenue: 338000,
      purchaseFrequency: 6.2,
      retentionRate: 88,
      description: 'Regular customers with consistent purchase patterns'
    },
    {
      segment: 'Potential',
      customers: 2564,
      avgRFM: { recency: 6.5, frequency: 5.8, monetary: 6.2 },
      avgOrderValue: 142.00,
      totalRevenue: 364000,
      purchaseFrequency: 3.8,
      retentionRate: 72,
      description: 'Recent customers with growth potential'
    },
    {
      segment: 'At Risk',
      customers: 1709,
      avgRFM: { recency: 3.2, frequency: 6.5, monetary: 7.8 },
      avgOrderValue: 215.00,
      totalRevenue: 367000,
      purchaseFrequency: 4.2,
      retentionRate: 45,
      description: 'Previously good customers who haven\'t purchased recently'
    },
    {
      segment: 'Lost',
      customers: 1283,
      avgRFM: { recency: 1.5, frequency: 2.8, monetary: 3.2 },
      avgOrderValue: 98.00,
      totalRevenue: 126000,
      purchaseFrequency: 1.8,
      retentionRate: 12,
      description: 'Inactive customers who need re-engagement'
    }
  ],
  customers: [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      segment: 'Champions',
      rfmScore: { recency: 10, frequency: 9, monetary: 10 },
      totalSpent: 3250,
      orders: 12,
      lastPurchase: '3 days ago',
      avgOrderValue: 270.83
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.c@email.com',
      segment: 'Loyal',
      rfmScore: { recency: 8, frequency: 8, monetary: 7 },
      totalSpent: 1890,
      orders: 9,
      lastPurchase: '12 days ago',
      avgOrderValue: 210.00
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily.r@email.com',
      segment: 'Potential',
      rfmScore: { recency: 7, frequency: 5, monetary: 6 },
      totalSpent: 845,
      orders: 4,
      lastPurchase: '18 days ago',
      avgOrderValue: 211.25
    },
    {
      id: '4',
      name: 'David Kim',
      email: 'david.k@email.com',
      segment: 'At Risk',
      rfmScore: { recency: 3, frequency: 7, monetary: 8 },
      totalSpent: 2150,
      orders: 8,
      lastPurchase: '67 days ago',
      avgOrderValue: 268.75
    },
    {
      id: '5',
      name: 'Lisa Anderson',
      email: 'lisa.a@email.com',
      segment: 'Lost',
      rfmScore: { recency: 1, frequency: 3, monetary: 3 },
      totalSpent: 425,
      orders: 3,
      lastPurchase: '156 days ago',
      avgOrderValue: 141.67
    }
  ],
  recommendations: {
    Champions: [
      { action: 'VIP Program Invitation', description: 'Invite to exclusive loyalty tier with premium benefits' },
      { action: 'Early Access', description: 'Provide early access to new products and sales' },
      { action: 'Referral Incentives', description: 'Encourage referrals with generous rewards' }
    ],
    Loyal: [
      { action: 'Loyalty Rewards', description: 'Send personalized rewards and thank you messages' },
      { action: 'Cross-Sell Campaign', description: 'Recommend complementary products' },
      { action: 'Feedback Request', description: 'Ask for reviews and testimonials' }
    ],
    Potential: [
      { action: 'Engagement Campaign', description: 'Send targeted content and product recommendations' },
      { action: 'First Purchase Discount', description: 'Offer incentive for next purchase' },
      { action: 'Educational Content', description: 'Share product guides and tips' }
    ],
    'At Risk': [
      { action: 'Win-Back Campaign', description: 'Send personalized "We miss you" email with special offer' },
      { action: 'Reactivation Discount', description: 'Offer significant discount to encourage return' },
      { action: 'Survey', description: 'Ask for feedback on why they stopped buying' }
    ],
    Lost: [
      { action: 'Re-Engagement Series', description: 'Multi-touch email campaign to rebuild interest' },
      { action: 'Major Incentive', description: 'Offer substantial discount or free shipping' },
      { action: 'Product Updates', description: 'Showcase new products and improvements' }
    ]
  }
};

  const segmentColors = (distribution || []).map((d: any) => d.color);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const segmentDistribution = distribution || [];

  // filteredCustomers already defined above

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getSegmentColor = (segment: string) => {
    const segmentData = mockRFMData.distribution.find(d => d.segment === segment);
    return segmentData?.color || '#gray';
  };

  const getSegmentIcon = (segment: string) => {
    const segmentData = mockRFMData.distribution.find(d => d.segment === segment);
    const Icon = segmentData?.icon || Users;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">RFM Segmentation</h1>
            <p className="text-muted-foreground">Customer segmentation based on Recency, Frequency, and Monetary value</p>
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
              Export Segments
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
              <span className="text-sm text-muted-foreground">Total Customers</span>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold">
              {mockRFMData.totalCustomers.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Across all segments
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Avg Order Value</span>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(mockRFMData.avgOrderValue)}
            </div>
            <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +8% vs last month
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Avg Frequency</span>
              <ShoppingCart className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {mockRFMData.avgFrequency}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Orders per customer
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Champions</span>
              <Crown className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-yellow-600">
              {mockRFMData.distribution[0].percentage}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Top tier customers
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Segment Distribution */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Segment Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={mockRFMData.distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ segment, percentage }) => `${segment} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {mockRFMData.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {mockRFMData.distribution.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.segment} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <Icon className="w-4 h-4" style={{ color: item.color }} />
                      <span className="text-sm">{item.segment}</span>
                    </div>
                    <span className="text-sm font-medium">{item.count.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Segment Revenue */}
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">Revenue by Segment</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mockRFMData.segmentMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="segment" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="totalRevenue" fill="#8b5cf6" name="Total Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Segment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockRFMData.segmentMetrics.map((segment) => (
            <Card
              key={segment.segment}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedSegment(segment.segment)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${getSegmentColor(segment.segment)}20` }}
                  >
                    <div style={{ color: getSegmentColor(segment.segment) }}>
                      {getSegmentIcon(segment.segment)}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-lg">{segment.segment}</div>
                    <div className="text-sm text-muted-foreground">{segment.customers.toLocaleString()} customers</div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{segment.description}</p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Order Value:</span>
                  <span className="font-medium">{formatCurrency(segment.avgOrderValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Revenue:</span>
                  <span className="font-medium">{formatCurrency(segment.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Frequency:</span>
                  <span className="font-medium">{segment.purchaseFrequency}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Retention Rate:</span>
                  <Badge className={segment.retentionRate >= 80 ? 'bg-green-600' : segment.retentionRate >= 60 ? 'bg-yellow-600' : 'bg-red-600'}>
                    {segment.retentionRate}%
                  </Badge>
                </div>
              </div>

              <div className="mt-4">
                <ResponsiveContainer width="100%" height={100}>
                  <RadarChart data={[
                    { metric: 'R', value: segment.avgRFM.recency },
                    { metric: 'F', value: segment.avgRFM.frequency },
                    { metric: 'M', value: segment.avgRFM.monetary }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis domain={[0, 10]} />
                    <Radar dataKey="value" stroke={getSegmentColor(segment.segment)} fill={getSegmentColor(segment.segment)} fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <Button className="w-full mt-4" style={{ backgroundColor: getSegmentColor(segment.segment) }}>
                <Mail className="w-4 h-4 mr-2" />
                Launch Campaign
              </Button>
            </Card>
          ))}
        </div>

        {/* Customer List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Customer List</h2>
            <div className="flex gap-2">
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Segments</SelectItem>
                  {mockRFMData.distribution.map(d => (
                    <SelectItem key={d.segment} value={d.segment}>{d.segment}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-left p-3 font-medium">Segment</th>
                  <th className="text-left p-3 font-medium">RFM Score</th>
                  <th className="text-left p-3 font-medium">Total Spent</th>
                  <th className="text-left p-3 font-medium">Orders</th>
                  <th className="text-left p-3 font-medium">Last Purchase</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-accent/50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge style={{ backgroundColor: getSegmentColor(customer.segment) }}>
                        {customer.segment}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 text-xs">
                        <Badge variant="outline">R:{customer.rfmScore.recency}</Badge>
                        <Badge variant="outline">F:{customer.rfmScore.frequency}</Badge>
                        <Badge variant="outline">M:{customer.rfmScore.monetary}</Badge>
                      </div>
                    </td>
                    <td className="p-3 font-medium">{formatCurrency(customer.totalSpent)}</td>
                    <td className="p-3">{customer.orders}</td>
                    <td className="p-3 text-sm text-muted-foreground">{customer.lastPurchase}</td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="outline">
                          <Mail className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Gift className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recommended Actions */}
        {selectedSegment && (
          <Card className="p-6 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 border-pink-200 dark:border-pink-800">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" style={{ color: getSegmentColor(selectedSegment) }} />
              Recommended Actions for {selectedSegment}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockRFMData.recommendations[selectedSegment as keyof typeof mockRFMData.recommendations]?.map((rec, index) => (
                <Card key={index} className="p-4">
                  <div className="font-medium mb-2">{rec.action}</div>
                  <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                  <Button size="sm" className="w-full" style={{ backgroundColor: getSegmentColor(selectedSegment) }}>
                    Launch
                  </Button>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* AI Insights */}
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-purple-600" />
            AI Insights & Recommendations
          </h3>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5" />
              <span>
                <strong>Champions retention:</strong> 95% retention rate among Champions - maintain VIP treatment and exclusive benefits to preserve this valuable segment.
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5" />
              <span>
                <strong>At Risk opportunity:</strong> 1,709 customers at risk with $367K revenue potential. Launch win-back campaign with 20% discount to recover this segment.
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-1.5" />
              <span>
                <strong>Potential growth:</strong> 30% of customers in Potential segment - focus on engagement campaigns to convert them into Loyal customers.
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Export Modal */}
      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="RFM Segmentation Report"
        data={filteredCustomers.map(c => ({
          name: c.name,
          email: c.email,
          segment: c.segment,
          recencyScore: c.rfmScores.recency,
          frequencyScore: c.rfmScores.frequency,
          monetaryScore: c.rfmScores.monetary,
          totalSpent: c.totalSpent,
          orderCount: c.orderCount,
          lastPurchase: c.lastPurchase
        }))}
        columns={[
          { key: 'name', label: 'Customer Name' },
          { key: 'email', label: 'Email' },
          { key: 'segment', label: 'Segment' },
          { key: 'recencyScore', label: 'Recency Score' },
          { key: 'frequencyScore', label: 'Frequency Score' },
          { key: 'monetaryScore', label: 'Monetary Score' },
          { key: 'totalSpent', label: 'Total Spent', formatter: formatCurrencyUtil },
          { key: 'orderCount', label: 'Order Count' },
          { key: 'lastPurchase', label: 'Last Purchase' }
        ]}
      />
    </div>
  );
}
