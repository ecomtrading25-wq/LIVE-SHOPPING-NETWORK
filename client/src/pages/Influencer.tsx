import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  TrendingUp,
  DollarSign,
  Share2,
  Video,
  BarChart3,
  Link as LinkIcon,
  Copy,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Influencer Marketing Platform
 * Creator onboarding, campaign management, and performance tracking
 */

export default function InfluencerPage() {
  const [copied, setCopied] = useState(false);
  const [referralLink] = useState("https://liveshoppingnetwork.com/ref/INFL12345");

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = {
    followers: 125000,
    totalEarnings: 45230.5,
    thisMonthEarnings: 8945.25,
    conversionRate: 4.2,
    totalSales: 1847,
    avgOrderValue: 89.5,
  };

  const campaigns = [
    {
      id: "1",
      name: "Tech Gadgets Flash Sale",
      status: "active",
      commission: 15,
      clicks: 2341,
      sales: 89,
      earnings: 1245.8,
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: "2",
      name: "Fitness Equipment Promo",
      status: "active",
      commission: 20,
      clicks: 1876,
      sales: 67,
      earnings: 2103.4,
      endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    },
    {
      id: "3",
      name: "Home & Living Collection",
      status: "completed",
      commission: 12,
      clicks: 3421,
      sales: 145,
      earnings: 3876.2,
      endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">Influencer Dashboard</h1>
            <p className="text-xl text-white/90 mb-8">
              Partner with Live Shopping Network and earn up to 30% commission
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary">
                <Video className="w-5 h-5 mr-2" />
                Schedule Live Show
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Share2 className="w-5 h-5 mr-2" />
                Share Products
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-purple-500" />
                <Badge className="bg-purple-600">+12%</Badge>
              </div>
              <p className="text-2xl font-bold">{stats.followers.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Followers</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <Badge className="bg-green-600">+24%</Badge>
              </div>
              <p className="text-2xl font-bold">${stats.totalEarnings.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Total Earnings</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <Badge className="bg-blue-600">This Month</Badge>
              </div>
              <p className="text-2xl font-bold">${stats.thisMonthEarnings.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Monthly Earnings</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold">{stats.conversionRate}%</p>
              <p className="text-sm text-gray-400">Conversion Rate</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-5 h-5 text-pink-500" />
              </div>
              <p className="text-2xl font-bold">{stats.totalSales}</p>
              <p className="text-sm text-gray-400">Total Sales</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold">${stats.avgOrderValue}</p>
              <p className="text-sm text-gray-400">Avg Order Value</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Campaigns */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Active Campaigns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-4 bg-zinc-800 rounded-lg border border-zinc-700"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white mb-1">{campaign.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              campaign.status === "active"
                                ? "bg-green-600"
                                : "bg-gray-600"
                            }
                          >
                            {campaign.status}
                          </Badge>
                          <span className="text-sm text-gray-400">
                            {campaign.commission}% commission
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                      </Button>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-white">{campaign.clicks}</p>
                        <p className="text-xs text-gray-400">Clicks</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{campaign.sales}</p>
                        <p className="text-xs text-gray-400">Sales</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-500">
                          ${campaign.earnings}
                        </p>
                        <p className="text-xs text-gray-400">Earnings</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {Math.ceil(
                            (campaign.endDate.getTime() - Date.now()) /
                              (24 * 60 * 60 * 1000)
                          )}
                          d
                        </p>
                        <p className="text-xs text-gray-400">Remaining</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Performance Chart Placeholder */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-zinc-800 rounded-lg">
                  <p className="text-gray-400">Chart: Earnings & Sales Over Time</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Referral Link */}
            <Card className="bg-gradient-to-br from-purple-600 to-pink-600 border-0">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Your Referral Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-white/10 rounded-lg">
                  <p className="text-sm text-white/90 break-all">{referralLink}</p>
                </div>
                <Button
                  onClick={copyReferralLink}
                  className="w-full bg-white text-purple-600 hover:bg-white/90"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
                <p className="text-xs text-white/80 text-center">
                  Share this link to earn commission on every sale
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Video className="w-4 h-4 mr-2" />
                  Schedule Live Show
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Create Social Post
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Request Payout
                </Button>
              </CardContent>
            </Card>

            {/* Commission Tiers */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Commission Tiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-zinc-800 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Bronze</span>
                    <Badge variant="outline">5-10%</Badge>
                  </div>
                  <p className="text-xs text-gray-400">0 - $5,000 sales</p>
                </div>
                <div className="p-3 bg-zinc-800 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Silver</span>
                    <Badge variant="outline">10-15%</Badge>
                  </div>
                  <p className="text-xs text-gray-400">$5,000 - $20,000 sales</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">Gold (Current)</span>
                    <Badge className="bg-white text-yellow-600">15-20%</Badge>
                  </div>
                  <p className="text-xs text-white/90">$20,000 - $50,000 sales</p>
                </div>
                <div className="p-3 bg-zinc-800 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Platinum</span>
                    <Badge variant="outline">20-30%</Badge>
                  </div>
                  <p className="text-xs text-gray-400">$50,000+ sales</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
