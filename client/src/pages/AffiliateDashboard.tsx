/**
 * AFFILIATE DASHBOARD
 * Complete affiliate program interface with performance metrics,
 * commission tracking, marketing materials, and payout management
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  DollarSign,
  Users,
  MousePointerClick,
  ShoppingCart,
  Award,
  Copy,
  Download,
  ExternalLink,
  BarChart3,
  Gift,
  Share2,
} from 'lucide-react';

export default function AffiliateDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [copiedCode, setCopiedCode] = useState(false);

  // Mock data - would be replaced with actual tRPC queries
  const affiliateData = {
    overview: {
      totalEarnings: 4856.32,
      pendingPayout: 1245.67,
      lifetimeEarnings: 28934.56,
      currentTier: 'GOLD',
      commissionRate: 0.10,
      affiliateCode: 'TECHPRO2024',
      referralLink: 'https://shop.example.com?ref=TECHPRO2024',
    },
    thisMonth: {
      clicks: 3456,
      conversions: 234,
      sales: 35120,
      commission: 3512,
    },
    recentActivity: [
      {
        type: 'conversion',
        description: 'Order #12345 - Wireless Headphones',
        amount: 29.99,
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        type: 'click',
        description: 'Visitor from Instagram',
        timestamp: new Date(Date.now() - 7200000),
      },
      {
        type: 'payout',
        description: 'Monthly payout processed',
        amount: 2450.00,
        timestamp: new Date(Date.now() - 86400000 * 3),
      },
    ],
    topPerformers: [
      {
        productId: 'prod_1',
        productName: 'Wireless Headphones Pro',
        conversions: 89,
        revenue: 26671,
      },
      {
        productId: 'prod_2',
        productName: 'Smart Watch Ultra',
        conversions: 67,
        revenue: 26733,
      },
    ],
    payouts: [
      {
        payoutId: 'payout_1',
        amount: 450.00,
        period: 'Dec 1-15, 2024',
        status: 'completed' as const,
        paidAt: new Date('2024-12-16'),
        method: 'Stripe',
      },
      {
        payoutId: 'payout_2',
        amount: 380.50,
        period: 'Nov 16-30, 2024',
        status: 'completed' as const,
        paidAt: new Date('2024-12-01'),
        method: 'Stripe',
      },
      {
        payoutId: 'payout_3',
        amount: 520.75,
        period: 'Dec 16-31, 2024',
        status: 'pending' as const,
        method: 'Stripe',
      },
    ],
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM': return 'bg-gradient-to-r from-gray-300 to-gray-400';
      case 'GOLD': return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 'SILVER': return 'bg-gradient-to-r from-gray-400 to-gray-500';
      default: return 'bg-gradient-to-r from-orange-400 to-orange-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Affiliate Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your performance, earnings, and grow your affiliate business
          </p>
        </div>

        {/* Tier Badge */}
        <Card className="mb-6 p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-8 h-8" />
                <div>
                  <p className="text-sm opacity-90">Current Tier</p>
                  <h2 className="text-3xl font-bold">{affiliateData.overview.currentTier}</h2>
                </div>
              </div>
              <p className="text-sm opacity-90">
                Commission Rate: {(affiliateData.overview.commissionRate * 100).toFixed(0)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90 mb-1">Your Affiliate Code</p>
              <div className="flex items-center gap-2">
                <code className="text-2xl font-mono font-bold bg-white/20 px-4 py-2 rounded">
                  {affiliateData.overview.affiliateCode}
                </code>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copyToClipboard(affiliateData.overview.affiliateCode)}
                >
                  {copiedCode ? '✓ Copied' : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Earnings</p>
            <p className="text-3xl font-bold">${affiliateData.overview.totalEarnings.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">
              Pending: ${affiliateData.overview.pendingPayout.toLocaleString()}
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <MousePointerClick className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Clicks This Month</p>
            <p className="text-3xl font-bold">{affiliateData.thisMonth.clicks.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">
              Conversion Rate: {((affiliateData.thisMonth.conversions / affiliateData.thisMonth.clicks) * 100).toFixed(1)}%
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Conversions</p>
            <p className="text-3xl font-bold">{affiliateData.thisMonth.conversions}</p>
            <p className="text-xs text-gray-500 mt-2">
              Avg Order: ${(affiliateData.thisMonth.sales / affiliateData.thisMonth.conversions).toFixed(2)}
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Sales</p>
            <p className="text-3xl font-bold">${affiliateData.thisMonth.sales.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">
              Commission: ${affiliateData.thisMonth.commission.toLocaleString()}
            </p>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Referral Link */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Your Referral Link
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={affiliateData.overview.referralLink}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-800 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(affiliateData.overview.referralLink)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" variant="outline">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share on Social
                    </Button>
                    <Button className="flex-1" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      QR Code
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {affiliateData.recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'conversion' ? 'bg-green-500' :
                          activity.type === 'payout' ? 'bg-blue-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {activity.amount && (
                        <span className="text-sm font-semibold text-green-600">
                          +${activity.amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Top Performing Products */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Performing Products</h3>
              <div className="space-y-4">
                {affiliateData.topPerformers.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">{product.productName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {product.conversions} conversions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">${product.revenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Performance Analytics</h3>
                <div className="flex gap-2">
                  {(['week', 'month', 'year', 'all'] as const).map((period) => (
                    <Button
                      key={period}
                      size="sm"
                      variant={selectedPeriod === period ? 'default' : 'outline'}
                      onClick={() => setSelectedPeriod(period)}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500">Performance chart would go here</p>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Click-Through Rate
                </h4>
                <p className="text-3xl font-bold">6.8%</p>
                <p className="text-xs text-green-500 mt-2">↑ 2.3% from last period</p>
              </Card>
              <Card className="p-6">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Average Order Value
                </h4>
                <p className="text-3xl font-bold">$150.09</p>
                <p className="text-xs text-green-500 mt-2">↑ $12.50 from last period</p>
              </Card>
              <Card className="p-6">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  ROI
                </h4>
                <p className="text-3xl font-bold">425%</p>
                <p className="text-xs text-green-500 mt-2">↑ 35% from last period</p>
              </Card>
            </div>
          </TabsContent>

          {/* Marketing Materials Tab */}
          <TabsContent value="marketing" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Marketing Materials</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Download banners, get text links, and access email templates to promote products
              </p>

              <div className="space-y-6">
                {/* Banners */}
                <div>
                  <h4 className="font-medium mb-3">Banner Ads</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['728x90 Leaderboard', '300x250 Medium Rectangle', '160x600 Skyscraper', '300x600 Half Page'].map((size) => (
                      <div key={size} className="p-4 border rounded-lg hover:border-purple-500 transition-colors">
                        <div className="bg-gray-200 dark:bg-gray-700 h-24 rounded mb-3 flex items-center justify-center">
                          <p className="text-sm text-gray-500">{size}</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Text Links */}
                <div>
                  <h4 className="font-medium mb-3">Text Links</h4>
                  <div className="space-y-3">
                    {[
                      'Shop the latest deals',
                      'Exclusive products',
                      'Limited time offer',
                    ].map((text, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <code className="flex-1 text-sm">{text}</code>
                        <Button size="sm" variant="ghost">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Email Templates */}
                <div>
                  <h4 className="font-medium mb-3">Email Templates</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['Product Launch', 'Holiday Sale', 'New Arrivals'].map((template) => (
                      <Card key={template} className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                        <h5 className="font-medium mb-2">{template}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Pre-designed email template ready to send
                        </p>
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Preview & Copy
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Payout History</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Payouts are processed bi-weekly via Stripe
                  </p>
                </div>
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>

              <div className="space-y-3">
                {affiliateData.payouts.map((payout) => (
                  <div
                    key={payout.payoutId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-purple-500 transition-colors"
                  >
                    <div>
                      <p className="font-medium">${payout.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{payout.period}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={payout.status === 'completed' ? 'default' : 'secondary'}
                      >
                        {payout.status}
                      </Badge>
                      {payout.paidAt && (
                        <p className="text-sm text-gray-500">
                          {new Date(payout.paidAt).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">{payout.method}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                  <Gift className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Payout Settings</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Minimum payout threshold: $50.00 • Payment method: Stripe
                  </p>
                  <Button variant="outline" size="sm">
                    Update Payment Method
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Affiliate Settings</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Display Name</label>
                  <input
                    type="text"
                    defaultValue="Tech Review Pro"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://yourwebsite.com"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Social Media Links</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Instagram username"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="TikTok username"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="YouTube channel"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <Button>Save Changes</Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
