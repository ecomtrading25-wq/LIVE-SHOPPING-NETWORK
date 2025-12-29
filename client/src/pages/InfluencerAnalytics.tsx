import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  Link as LinkIcon,
  Copy,
  Download,
  Share2,
  BarChart3,
  Target,
  Award,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Influencer Performance Dashboard
 * Commission earnings, conversion analytics, audience insights, link generation
 */

interface EarningsBreakdown {
  period: string;
  commission: number;
  bonus: number;
  total: number;
  orders: number;
  conversionRate: number;
}

interface ContentPerformance {
  id: string;
  type: "video" | "post" | "story" | "live";
  title: string;
  thumbnail: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  conversionRate: number;
  date: string;
}

interface AudienceDemographic {
  ageGroup: string;
  percentage: number;
  avgSpend: number;
}

interface PromoLink {
  id: string;
  code: string;
  url: string;
  clicks: number;
  conversions: number;
  revenue: number;
  active: boolean;
  expiresAt: string;
}

export default function InfluencerAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const [newLinkCode, setNewLinkCode] = useState("");

  // Mock earnings data
  const totalEarnings = {
    thisMonth: 4856.32,
    lastMonth: 4234.18,
    pending: 1245.67,
    lifetime: 28934.56,
  };

  const earningsBreakdown: EarningsBreakdown[] = [
    { period: "Dec 2025", commission: 4256.32, bonus: 600, total: 4856.32, orders: 142, conversionRate: 3.8 },
    { period: "Nov 2025", commission: 3834.18, bonus: 400, total: 4234.18, orders: 128, conversionRate: 3.5 },
    { period: "Oct 2025", commission: 3456.89, bonus: 350, total: 3806.89, orders: 115, conversionRate: 3.2 },
    { period: "Sep 2025", commission: 3123.45, bonus: 300, total: 3423.45, orders: 98, conversionRate: 2.9 },
  ];

  // Mock content performance
  const contentPerformance: ContentPerformance[] = [
    {
      id: "1",
      type: "video",
      title: "Holiday Gift Guide 2025",
      thumbnail: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=300",
      views: 45230,
      clicks: 2845,
      conversions: 156,
      revenue: 2345.67,
      ctr: 6.3,
      conversionRate: 5.5,
      date: "2025-12-15",
    },
    {
      id: "2",
      type: "live",
      title: "Live Shopping Event - Tech Gadgets",
      thumbnail: "https://images.unsplash.com/photo-1593642532842-98d0fd5ebc1a?w=300",
      views: 12450,
      clicks: 1567,
      conversions: 89,
      revenue: 1567.89,
      ctr: 12.6,
      conversionRate: 5.7,
      date: "2025-12-10",
    },
    {
      id: "3",
      type: "post",
      title: "Best Skincare Products Under $50",
      thumbnail: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300",
      views: 28900,
      clicks: 1234,
      conversions: 67,
      revenue: 1123.45,
      ctr: 4.3,
      conversionRate: 5.4,
      date: "2025-12-05",
    },
    {
      id: "4",
      type: "story",
      title: "Quick Product Review - Wireless Earbuds",
      thumbnail: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300",
      views: 18670,
      clicks: 892,
      conversions: 45,
      revenue: 789.23,
      ctr: 4.8,
      conversionRate: 5.0,
      date: "2025-12-01",
    },
  ];

  // Mock audience demographics
  const audienceDemographics: AudienceDemographic[] = [
    { ageGroup: "18-24", percentage: 28, avgSpend: 45.67 },
    { ageGroup: "25-34", percentage: 42, avgSpend: 78.34 },
    { ageGroup: "35-44", percentage: 18, avgSpend: 92.45 },
    { ageGroup: "45-54", percentage: 8, avgSpend: 67.89 },
    { ageGroup: "55+", percentage: 4, avgSpend: 54.23 },
  ];

  // Mock promo links
  const [promoLinks, setPromoLinks] = useState<PromoLink[]>([
    {
      id: "1",
      code: "INFLUENCER15",
      url: "https://shop.example.com?ref=INFLUENCER15",
      clicks: 3456,
      conversions: 234,
      revenue: 4567.89,
      active: true,
      expiresAt: "2026-01-31",
    },
    {
      id: "2",
      code: "HOLIDAY25",
      url: "https://shop.example.com?ref=HOLIDAY25",
      clicks: 2134,
      conversions: 156,
      revenue: 3234.56,
      active: true,
      expiresAt: "2025-12-31",
    },
    {
      id: "3",
      code: "NEWYEAR20",
      url: "https://shop.example.com?ref=NEWYEAR20",
      clicks: 1876,
      conversions: 98,
      revenue: 1987.34,
      active: false,
      expiresAt: "2025-12-15",
    },
  ]);

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const handleGenerateLink = () => {
    if (!newLinkCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    const newLink: PromoLink = {
      id: Date.now().toString(),
      code: newLinkCode.toUpperCase(),
      url: `https://shop.example.com?ref=${newLinkCode.toUpperCase()}`,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      active: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    };

    setPromoLinks([newLink, ...promoLinks]);
    setNewLinkCode("");
    toast.success("Promo link generated successfully!");
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return "🎥";
      case "live":
        return "📺";
      case "post":
        return "📱";
      case "story":
        return "⚡";
      default:
        return "📄";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Influencer Dashboard</h1>
            <p className="text-muted-foreground text-lg">Track your performance, earnings, and audience insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="12m">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">This Month</p>
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">${totalEarnings.thisMonth.toFixed(2)}</p>
            <p className="text-green-400 text-sm">
              +{(((totalEarnings.thisMonth - totalEarnings.lastMonth) / totalEarnings.lastMonth) * 100).toFixed(1)}% from last month
            </p>
          </Card>

          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Pending</p>
              <Calendar className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">${totalEarnings.pending.toFixed(2)}</p>
            <p className="text-gray-400 text-sm">Payout on Jan 15, 2026</p>
          </Card>

          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Lifetime Earnings</p>
              <Award className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">${totalEarnings.lifetime.toFixed(2)}</p>
            <p className="text-gray-400 text-sm">Since joining</p>
          </Card>

          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Avg Commission</p>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">12.5%</p>
            <p className="text-gray-400 text-sm">Per sale</p>
          </Card>
        </div>

        <Tabs defaultValue="earnings" className="space-y-6">
          <TabsList className="bg-background text-foreground/5 border border-white/10">
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="content">Content Performance</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="links">Promo Links</TabsTrigger>
          </TabsList>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <Card className="p-6 bg-background text-foreground/5 border-white/10">
              <h2 className="text-2xl font-bold text-foreground mb-6">Earnings Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-gray-400 font-medium">Period</th>
                      <th className="text-right p-4 text-gray-400 font-medium">Commission</th>
                      <th className="text-right p-4 text-gray-400 font-medium">Bonus</th>
                      <th className="text-right p-4 text-gray-400 font-medium">Total</th>
                      <th className="text-right p-4 text-gray-400 font-medium">Orders</th>
                      <th className="text-right p-4 text-gray-400 font-medium">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earningsBreakdown.map((earning) => (
                      <tr key={earning.period} className="border-b border-white/5 hover:bg-background text-foreground/5">
                        <td className="p-4 text-foreground font-medium">{earning.period}</td>
                        <td className="p-4 text-right text-foreground">${earning.commission.toFixed(2)}</td>
                        <td className="p-4 text-right text-green-400">${earning.bonus.toFixed(2)}</td>
                        <td className="p-4 text-right text-foreground font-bold">${earning.total.toFixed(2)}</td>
                        <td className="p-4 text-right text-foreground">{earning.orders}</td>
                        <td className="p-4 text-right text-red-400">{earning.conversionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-red-500/20 to-pink-500/20 border-red-500/30">
              <h3 className="text-xl font-bold text-foreground mb-4">Payout History</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-background text-foreground/10 rounded-lg">
                  <div>
                    <p className="text-foreground font-medium">December 2025 Payout</p>
                    <p className="text-gray-400 text-sm">Paid on Dec 15, 2025</p>
                  </div>
                  <p className="text-green-400 font-bold text-lg">$4,234.18</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-background text-foreground/10 rounded-lg">
                  <div>
                    <p className="text-foreground font-medium">November 2025 Payout</p>
                    <p className="text-gray-400 text-sm">Paid on Nov 15, 2025</p>
                  </div>
                  <p className="text-green-400 font-bold text-lg">$3,806.89</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Content Performance Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card className="p-6 bg-background text-foreground/5 border-white/10">
              <h2 className="text-2xl font-bold text-foreground mb-6">Top Performing Content</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contentPerformance.map((content) => (
                  <Card key={content.id} className="p-6 bg-background text-foreground/5 border-white/10">
                    <div className="flex gap-4 mb-4">
                      <img
                        src={content.thumbnail}
                        alt={content.title}
                        className="w-32 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{getContentTypeIcon(content.type)}</span>
                          <Badge className="bg-red-500/20 text-red-400 text-xs">
                            {content.type}
                          </Badge>
                        </div>
                        <h3 className="text-foreground font-semibold mb-1 line-clamp-2">{content.title}</h3>
                        <p className="text-gray-400 text-xs">{new Date(content.date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Views</p>
                        <p className="text-foreground font-bold">{content.views.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Clicks</p>
                        <p className="text-foreground font-bold">{content.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Conversions</p>
                        <p className="text-foreground font-bold">{content.conversions}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Revenue</p>
                        <p className="text-green-400 font-bold">${content.revenue.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-xs">CTR</p>
                        <p className="text-red-400 font-bold">{content.ctr}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Conv. Rate</p>
                        <p className="text-red-400 font-bold">{content.conversionRate}%</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Audience Tab */}
          <TabsContent value="audience" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-background text-foreground/5 border-white/10">
                <h2 className="text-2xl font-bold text-foreground mb-6">Age Demographics</h2>
                <div className="space-y-4">
                  {audienceDemographics.map((demo) => (
                    <div key={demo.ageGroup}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-foreground font-medium">{demo.ageGroup}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-400 text-sm">Avg: ${demo.avgSpend.toFixed(2)}</span>
                          <span className="text-red-400 font-bold">{demo.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-background text-foreground/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full"
                          style={{ width: `${demo.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-background text-foreground/5 border-white/10">
                <h2 className="text-2xl font-bold text-foreground mb-6">Audience Insights</h2>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400">Total Followers</p>
                      <Users className="w-5 h-5 text-red-400" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">124,567</p>
                    <p className="text-green-400 text-sm mt-1">+8.3% this month</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400">Engagement Rate</p>
                      <Target className="w-5 h-5 text-red-400" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">6.8%</p>
                    <p className="text-green-400 text-sm mt-1">Above average</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400">Avg Order Value</p>
                      <DollarSign className="w-5 h-5 text-red-400" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">$68.45</p>
                    <p className="text-gray-400 text-sm mt-1">From your referrals</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Promo Links Tab */}
          <TabsContent value="links" className="space-y-6">
            <Card className="p-6 bg-background text-foreground/5 border-white/10">
              <h2 className="text-2xl font-bold text-foreground mb-6">Generate New Promo Link</h2>
              <div className="flex gap-3">
                <Input
                  value={newLinkCode}
                  onChange={(e) => setNewLinkCode(e.target.value)}
                  placeholder="Enter promo code (e.g., SUMMER25)"
                  className="flex-1 bg-background/10 border-white/20 text-foreground placeholder:text-gray-400"
                />
                <Button onClick={handleGenerateLink} className="bg-gradient-to-r from-red-500 to-orange-500">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Generate Link
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-background text-foreground/5 border-white/10">
              <h2 className="text-2xl font-bold text-foreground mb-6">Your Promo Links</h2>
              <div className="space-y-4">
                {promoLinks.map((link) => (
                  <Card key={link.id} className="p-6 bg-background text-foreground/5 border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-foreground">{link.code}</h3>
                          <Badge
                            className={
                              link.active
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                            }
                          >
                            {link.active ? "Active" : "Expired"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                          <code className="bg-background text-foreground/10 px-2 py-1 rounded">{link.url}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyLink(link.url)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-gray-400 text-sm">Expires: {new Date(link.expiresAt).toLocaleDateString()}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Clicks</p>
                        <p className="text-foreground text-xl font-bold">{link.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Conversions</p>
                        <p className="text-foreground text-xl font-bold">{link.conversions}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Revenue</p>
                        <p className="text-green-400 text-xl font-bold">${link.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
