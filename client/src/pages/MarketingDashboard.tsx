/**
 * MARKETING AUTOMATION DASHBOARD
 * Complete marketing campaign management with email/SMS/push campaigns,
 * A/B testing, audience segmentation, and analytics
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  MessageSquare,
  Bell,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Calendar,
  Send,
  Play,
  Pause,
  Eye,
  MousePointerClick,
  ShoppingCart,
  DollarSign,
  Plus,
  Edit,
  Copy,
  Trash2,
  Download,
  Filter,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default function MarketingDashboard() {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);

  // Mock dashboard data
  const overview = {
    totalCampaigns: 45,
    activeCampaigns: 8,
    totalSent: 125000,
    totalRevenue: 285000,
    averageRoi: 4.2,
  };

  // Mock campaigns
  const campaigns = [
    {
      id: 'campaign_1',
      name: 'Holiday Sale 2024',
      type: 'email' as const,
      status: 'completed' as const,
      sent: 10000,
      openRate: 0.45,
      clickRate: 0.15,
      conversionRate: 0.08,
      revenue: 45000,
      scheduledDate: new Date('2024-12-20'),
    },
    {
      id: 'campaign_2',
      name: 'New Product Launch',
      type: 'push' as const,
      status: 'active' as const,
      sent: 5000,
      openRate: 0.62,
      clickRate: 0.25,
      conversionRate: 0.12,
      revenue: 28000,
      scheduledDate: new Date('2024-12-28'),
    },
    {
      id: 'campaign_3',
      name: 'Cart Abandonment Recovery',
      type: 'email' as const,
      status: 'active' as const,
      sent: 3500,
      openRate: 0.55,
      clickRate: 0.32,
      conversionRate: 0.18,
      revenue: 15750,
      scheduledDate: new Date('2024-12-27'),
    },
    {
      id: 'campaign_4',
      name: 'Flash Sale Alert',
      type: 'sms' as const,
      status: 'scheduled' as const,
      sent: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      revenue: 0,
      scheduledDate: new Date('2024-12-30'),
    },
  ];

  // Mock audience segments
  const segments = [
    { id: 'all', name: 'All Users', count: 10000, description: 'All registered users' },
    { id: 'new', name: 'New Users', count: 1500, description: 'Registered in last 30 days' },
    { id: 'active', name: 'Active Buyers', count: 3500, description: 'Purchased in last 90 days' },
    { id: 'inactive', name: 'Inactive Users', count: 2000, description: 'No purchase in 90+ days' },
    { id: 'high_value', name: 'High Value', count: 500, description: 'Lifetime value > $1000' },
    { id: 'cart_abandoners', name: 'Cart Abandoners', count: 800, description: 'Items in cart, no recent purchase' },
  ];

  // Mock channel performance
  const channelPerformance = [
    {
      channel: 'email' as const,
      sent: 80000,
      openRate: 0.42,
      clickRate: 0.15,
      conversionRate: 0.06,
      revenue: 180000,
    },
    {
      channel: 'sms' as const,
      sent: 25000,
      openRate: 0.95,
      clickRate: 0.35,
      conversionRate: 0.12,
      revenue: 75000,
    },
    {
      channel: 'push' as const,
      sent: 20000,
      openRate: 0.68,
      clickRate: 0.25,
      conversionRate: 0.08,
      revenue: 30000,
    },
  ];

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'scheduled': return 'bg-yellow-500';
      case 'paused': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'push': return <Bell className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Marketing Automation
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create, manage, and optimize your marketing campaigns
            </p>
          </div>
          <Button size="lg" onClick={() => setShowCampaignBuilder(true)}>
            <Plus className="w-5 h-5 mr-2" />
            New Campaign
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Campaigns</p>
            <p className="text-3xl font-bold">{overview.totalCampaigns}</p>
            <p className="text-xs text-green-500 mt-2">{overview.activeCampaigns} active</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Send className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Sent</p>
            <p className="text-3xl font-bold">{overview.totalSent.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">All channels</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold">${overview.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">From campaigns</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average ROI</p>
            <p className="text-3xl font-bold">{overview.averageRoi.toFixed(1)}x</p>
            <p className="text-xs text-gray-500 mt-2">Return on investment</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-pink-100 dark:bg-pink-900/20 rounded-lg">
                <Users className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-pink-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Audience</p>
            <p className="text-3xl font-bold">10K</p>
            <p className="text-xs text-gray-500 mt-2">Reachable users</p>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
          </TabsList>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            {/* Filters */}
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </Card>

            {/* Campaigns List */}
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        {getCampaignTypeIcon(campaign.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{campaign.name}</h3>
                          <Badge className={getCampaignStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {campaign.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {campaign.scheduledDate.toLocaleDateString()}
                          </div>
                          {campaign.sent > 0 && (
                            <div className="flex items-center gap-1">
                              <Send className="w-4 h-4" />
                              {campaign.sent.toLocaleString()} sent
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {campaign.sent > 0 && (
                    <div className="grid grid-cols-5 gap-4">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {(campaign.openRate * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Open Rate</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {(campaign.clickRate * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Click Rate</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {(campaign.conversionRate * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Conversion</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">
                          ${campaign.revenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Revenue</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-2xl font-bold text-pink-600">
                          {((campaign.revenue / (campaign.sent * 0.1)) * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">ROI</p>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Segments Tab */}
          <TabsContent value="segments" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {segments.map((segment) => (
                <Card key={segment.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <Badge variant="secondary">{segment.count.toLocaleString()}</Badge>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{segment.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {segment.description}
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Create Campaign
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Channel Performance */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Channel Performance</h3>
              <div className="space-y-4">
                {channelPerformance.map((channel) => (
                  <div key={channel.channel} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getCampaignTypeIcon(channel.channel)}
                        <span className="font-semibold capitalize">{channel.channel}</span>
                      </div>
                      <Badge variant="secondary">{channel.sent.toLocaleString()} sent</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 mb-1">Open Rate</p>
                        <p className="text-lg font-bold">{(channel.openRate * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 mb-1">Click Rate</p>
                        <p className="text-lg font-bold">{(channel.clickRate * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 mb-1">Conversion</p>
                        <p className="text-lg font-bold">{(channel.conversionRate * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 mb-1">Revenue</p>
                        <p className="text-lg font-bold">${channel.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Performance Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Campaign Performance Over Time</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500">Performance chart would go here</p>
              </div>
            </Card>
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Automated Workflows</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Set up automated campaigns triggered by user actions
              </p>
              <div className="space-y-4">
                {[
                  { name: 'Welcome Series', trigger: 'User Signup', status: 'active', sent: 1234 },
                  { name: 'Cart Abandonment', trigger: 'Cart Abandoned', status: 'active', sent: 856 },
                  { name: 'Post-Purchase Follow-up', trigger: 'Order Delivered', status: 'active', sent: 2341 },
                  { name: 'Win-Back Campaign', trigger: '90 Days Inactive', status: 'paused', sent: 445 },
                ].map((workflow, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg hover:border-purple-500 transition-colors">
                    <div>
                      <h4 className="font-semibold mb-1">{workflow.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Trigger: {workflow.trigger} • {workflow.sent.toLocaleString()} sent
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={workflow.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                        {workflow.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        {workflow.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
