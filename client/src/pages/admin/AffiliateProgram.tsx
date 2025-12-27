import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  DollarSign,
  TrendingUp,
  Link as LinkIcon,
  Award,
  BarChart3,
  Copy,
  CheckCircle,
  Clock,
  Target,
} from "lucide-react";

/**
 * Affiliate Program Management
 * Commission tracking, referral links, payout automation, performance analytics
 */

interface Affiliate {
  id: string;
  name: string;
  email: string;
  tier: "standard" | "silver" | "gold";
  commissionRate: number;
  totalSales: number;
  totalCommission: number;
  pendingPayout: number;
  referrals: number;
  conversions: number;
  conversionRate: number;
  joinedDate: string;
  status: "active" | "pending" | "suspended";
}

interface CommissionTier {
  name: string;
  rate: number;
  minMonthlySales: number;
  color: string;
  benefits: string[];
}

interface ReferralLink {
  id: string;
  affiliate: string;
  slug: string;
  url: string;
  clicks: number;
  conversions: number;
  revenue: number;
  createdDate: string;
}

interface Payout {
  id: string;
  affiliate: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed";
  scheduledDate: string;
  completedDate?: string;
  method: "stripe" | "paypal" | "bank_transfer";
}

export default function AffiliateProgramPage() {
  const [selectedTab, setSelectedTab] = useState("affiliates");

  // Mock commission tiers
  const tiers: CommissionTier[] = [
    {
      name: "Standard",
      rate: 5,
      minMonthlySales: 0,
      color: "bg-gray-500/20 text-gray-400",
      benefits: ["5% commission", "Basic analytics", "Email support"],
    },
    {
      name: "Silver",
      rate: 8,
      minMonthlySales: 5000,
      color: "bg-blue-500/20 text-blue-400",
      benefits: ["8% commission", "Advanced analytics", "Priority support", "Promotional materials"],
    },
    {
      name: "Gold",
      rate: 10,
      minMonthlySales: 15000,
      color: "bg-yellow-500/20 text-yellow-400",
      benefits: ["10% commission", "Real-time analytics", "Dedicated manager", "Custom campaigns", "Early product access"],
    },
  ];

  // Mock affiliates
  const affiliates: Affiliate[] = [
    {
      id: "AFF-001",
      name: "Tech Review Pro",
      email: "contact@techreviewpro.com",
      tier: "gold",
      commissionRate: 10,
      totalSales: 45680,
      totalCommission: 4568,
      pendingPayout: 1250,
      referrals: 2340,
      conversions: 234,
      conversionRate: 10,
      joinedDate: "2025-01-15T00:00:00Z",
      status: "active",
    },
    {
      id: "AFF-002",
      name: "Gadget Guru",
      email: "hello@gadgetguru.com",
      tier: "silver",
      commissionRate: 8,
      totalSales: 28900,
      totalCommission: 2312,
      pendingPayout: 890,
      referrals: 1890,
      conversions: 189,
      conversionRate: 10,
      joinedDate: "2025-02-01T00:00:00Z",
      status: "active",
    },
    {
      id: "AFF-003",
      name: "Smart Home Hub",
      email: "info@smarthomehub.com",
      tier: "standard",
      commissionRate: 5,
      totalSales: 12340,
      totalCommission: 617,
      pendingPayout: 340,
      referrals: 890,
      conversions: 67,
      conversionRate: 7.5,
      joinedDate: "2025-03-10T00:00:00Z",
      status: "active",
    },
  ];

  // Mock referral links
  const referralLinks: ReferralLink[] = [
    {
      id: "LINK-001",
      affiliate: "Tech Review Pro",
      slug: "techreview-headphones",
      url: "https://liveshoppingnetwork.com/ref/techreview-headphones",
      clicks: 2340,
      conversions: 234,
      revenue: 45680,
      createdDate: "2025-01-15T00:00:00Z",
    },
    {
      id: "LINK-002",
      affiliate: "Gadget Guru",
      slug: "gadgetguru-smartwatch",
      url: "https://liveshoppingnetwork.com/ref/gadgetguru-smartwatch",
      clicks: 1890,
      conversions: 189,
      revenue: 28900,
      createdDate: "2025-02-01T00:00:00Z",
    },
  ];

  // Mock payouts
  const payouts: Payout[] = [
    {
      id: "PAY-001",
      affiliate: "Tech Review Pro",
      amount: 1250,
      status: "completed",
      scheduledDate: "2025-12-01T00:00:00Z",
      completedDate: "2025-12-01T10:30:00Z",
      method: "stripe",
    },
    {
      id: "PAY-002",
      affiliate: "Gadget Guru",
      amount: 890,
      status: "processing",
      scheduledDate: "2025-12-01T00:00:00Z",
      method: "paypal",
    },
    {
      id: "PAY-003",
      affiliate: "Smart Home Hub",
      amount: 340,
      status: "pending",
      scheduledDate: "2026-01-01T00:00:00Z",
      method: "stripe",
    },
  ];

  const totalAffiliates = affiliates.length;
  const totalCommissionPaid = affiliates.reduce((sum, a) => sum + a.totalCommission, 0);
  const pendingPayouts = affiliates.reduce((sum, a) => sum + a.pendingPayout, 0);
  const avgConversionRate = affiliates.reduce((sum, a) => sum + a.conversionRate, 0) / affiliates.length;

  const getTierColor = (tier: string) => {
    const tierObj = tiers.find((t) => t.name.toLowerCase() === tier);
    return tierObj?.color || "bg-gray-500/20 text-gray-400";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "suspended":
        return "bg-red-500/20 text-red-400";
      case "completed":
        return "bg-green-500/20 text-green-400";
      case "processing":
        return "bg-blue-500/20 text-blue-400";
      case "failed":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Affiliate Program</h1>
          <p className="text-muted-foreground">
            Commission tracking, referral management, and payout automation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Award className="w-4 h-4 mr-2" />
            Tier Settings
          </Button>
          <Button>
            <Users className="w-4 h-4 mr-2" />
            Invite Affiliate
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Affiliates</p>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{totalAffiliates}</p>
          <p className="text-xs text-green-500">+12 this month</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Commission Paid</p>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold mb-1">${totalCommissionPaid.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">All time</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Pending Payouts</p>
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold mb-1">${pendingPayouts.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Next payout: Jan 1</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Avg Conversion</p>
            <Target className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{avgConversionRate.toFixed(1)}%</p>
          <p className="text-xs text-green-500">+1.2% from last month</p>
        </Card>
      </div>

      {/* Commission Tiers */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Commission Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{tier.name}</h3>
                <Badge className={tier.color}>{tier.rate}%</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Min. monthly sales: ${tier.minMonthlySales.toLocaleString()}
              </p>
              <ul className="space-y-2">
                {tier.benefits.map((benefit, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="affiliates">
            <Users className="w-4 h-4 mr-2" />
            Affiliates
          </TabsTrigger>
          <TabsTrigger value="links">
            <LinkIcon className="w-4 h-4 mr-2" />
            Referral Links
          </TabsTrigger>
          <TabsTrigger value="payouts">
            <DollarSign className="w-4 h-4 mr-2" />
            Payouts
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Affiliates Tab */}
        <TabsContent value="affiliates" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Active Affiliates</h2>

            <div className="space-y-4">
              {affiliates.map((affiliate) => (
                <Card key={affiliate.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold">{affiliate.name}</h3>
                        <Badge className={getTierColor(affiliate.tier)}>
                          {affiliate.tier} - {affiliate.commissionRate}%
                        </Badge>
                        <Badge className={getStatusColor(affiliate.status)}>{affiliate.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{affiliate.email}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </div>

                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Sales</p>
                      <p className="text-xl font-bold text-green-500">
                        ${affiliate.totalSales.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Commission Earned</p>
                      <p className="text-xl font-bold">${affiliate.totalCommission.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Pending Payout</p>
                      <p className="text-xl font-bold text-orange-500">
                        ${affiliate.pendingPayout.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Conversions</p>
                      <p className="text-xl font-bold">{affiliate.conversions}</p>
                      <p className="text-xs text-muted-foreground">
                        {affiliate.conversionRate}% rate
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Joined</p>
                      <p className="text-sm">
                        {new Date(affiliate.joinedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Referral Links Tab */}
        <TabsContent value="links">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Referral Links</h2>
              <Button>
                <LinkIcon className="w-4 h-4 mr-2" />
                Generate Link
              </Button>
            </div>

            <div className="space-y-4">
              {referralLinks.map((link) => (
                <Card key={link.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1">{link.affiliate}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <code className="px-3 py-1 bg-secondary rounded text-sm">{link.url}</code>
                        <Button variant="outline" size="sm">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(link.createdDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Clicks</p>
                      <p className="text-2xl font-bold">{link.clicks.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Conversions</p>
                      <p className="text-2xl font-bold text-green-500">{link.conversions}</p>
                      <p className="text-xs text-muted-foreground">
                        {((link.conversions / link.clicks) * 100).toFixed(1)}% rate
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                      <p className="text-2xl font-bold text-blue-500">
                        ${link.revenue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avg Order Value</p>
                      <p className="text-2xl font-bold">
                        ${(link.revenue / link.conversions).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Payout History</h2>

            <div className="space-y-4">
              {payouts.map((payout) => (
                <Card key={payout.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold">{payout.affiliate}</h3>
                        <p className="text-sm text-muted-foreground">
                          Scheduled: {new Date(payout.scheduledDate).toLocaleDateString()}
                          {payout.completedDate &&
                            ` • Completed: ${new Date(payout.completedDate).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-500">
                          ${payout.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{payout.method}</p>
                      </div>
                      <Badge className={getStatusColor(payout.status)}>{payout.status}</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Performance Analytics</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-4">
                <h3 className="font-bold mb-4">Top Performing Affiliates</h3>
                <div className="space-y-3">
                  {affiliates
                    .sort((a, b) => b.totalSales - a.totalSales)
                    .map((affiliate, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{affiliate.name}</p>
                          <p className="text-xs text-muted-foreground">{affiliate.tier}</p>
                        </div>
                        <p className="font-bold text-green-500">
                          ${affiliate.totalSales.toLocaleString()}
                        </p>
                      </div>
                    ))}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-bold mb-4">Conversion Rates</h3>
                <div className="space-y-3">
                  {affiliates
                    .sort((a, b) => b.conversionRate - a.conversionRate)
                    .map((affiliate, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{affiliate.name}</span>
                          <span className="font-bold">{affiliate.conversionRate}%</span>
                        </div>
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${affiliate.conversionRate * 10}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-bold mb-4">Monthly Trends</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-500">$86,920</p>
                    <p className="text-xs text-green-500">+24% from last month</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">New Affiliates</p>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-xs text-green-500">+3 from last month</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Avg Commission</p>
                    <p className="text-2xl font-bold">$2,499</p>
                    <p className="text-xs text-green-500">+18% from last month</p>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
