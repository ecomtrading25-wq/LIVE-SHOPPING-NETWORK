import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail,
  Send,
  Clock,
  Users,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  Play,
  Pause,
  BarChart3,
  ShoppingCart,
  Heart,
  Gift,
  AlertCircle,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  type: "abandoned-cart" | "win-back" | "product-recommendation" | "promotional";
  status: "active" | "paused" | "draft";
  sent: number;
  opened: number;
  clicked: number;
  revenue: number;
  lastSent: string;
}

export default function EmailCampaigns() {
  return (
    <AdminProtectedRoute>
      <EmailCampaignsContent />
    </AdminProtectedRoute>
  );
}

function EmailCampaignsContent() {
  const [campaigns] = useState<Campaign[]>([
    {
      id: "1",
      name: "Abandoned Cart Recovery",
      type: "abandoned-cart",
      status: "active",
      sent: 1234,
      opened: 567,
      clicked: 234,
      revenue: 12450,
      lastSent: "2024-01-20",
    },
    {
      id: "2",
      name: "Win-Back Campaign",
      type: "win-back",
      status: "active",
      sent: 890,
      opened: 345,
      clicked: 123,
      revenue: 8900,
      lastSent: "2024-01-19",
    },
    {
      id: "3",
      name: "Product Recommendations",
      type: "product-recommendation",
      status: "active",
      sent: 2345,
      opened: 1234,
      clicked: 567,
      revenue: 23450,
      lastSent: "2024-01-20",
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const getCampaignIcon = (type: Campaign["type"]) => {
    switch (type) {
      case "abandoned-cart":
        return <ShoppingCart className="w-5 h-5" />;
      case "win-back":
        return <Heart className="w-5 h-5" />;
      case "product-recommendation":
        return <Gift className="w-5 h-5" />;
      case "promotional":
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: Campaign["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400";
      case "paused":
        return "bg-yellow-500/20 text-yellow-400";
      case "draft":
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + c.opened, 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + c.clicked, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);

  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0";
  const clickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Email Campaigns</h1>
              <p className="text-gray-400 mt-1">Automated marketing and customer engagement</p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-background text-foreground/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Send className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalSent.toLocaleString()}</p>
                  <p className="text-sm text-gray-400">Total Sent</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-background text-foreground/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Mail className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{openRate}%</p>
                  <p className="text-sm text-gray-400">Open Rate</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-background text-foreground/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{clickRate}%</p>
                  <p className="text-sm text-gray-400">Click Rate</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-background text-foreground/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    ${totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400">Revenue Generated</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="p-6 bg-background text-foreground/5 border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    {getCampaignIcon(campaign.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-foreground">{campaign.name}</h3>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                      {campaign.type.split("-").map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(" ")}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Last sent: {new Date(campaign.lastSent).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {campaign.sent.toLocaleString()} sent
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="text-purple-400">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {campaign.status === "active" ? (
                    <Button size="sm" variant="ghost" className="text-yellow-400">
                      <Pause className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-green-400">
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Campaign Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-background text-foreground/5 rounded-lg">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Sent</p>
                  <p className="text-xl font-bold text-foreground">
                    {campaign.sent.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Opened</p>
                  <p className="text-xl font-bold text-foreground">
                    {campaign.opened.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {((campaign.opened / campaign.sent) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Clicked</p>
                  <p className="text-xl font-bold text-foreground">
                    {campaign.clicked.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {((campaign.clicked / campaign.opened) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Revenue</p>
                  <p className="text-xl font-bold text-green-400">
                    ${campaign.revenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Campaign Templates */}
        <Card className="mt-8 p-6 bg-background text-foreground/5 border-white/10">
          <h3 className="text-xl font-bold text-foreground mb-4">Campaign Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 bg-background text-foreground/5 hover:bg-background text-foreground/10 rounded-lg border border-white/10 transition-colors text-left">
              <div className="flex items-center gap-3 mb-2">
                <ShoppingCart className="w-5 h-5 text-blue-400" />
                <h4 className="font-semibold text-foreground">Abandoned Cart</h4>
              </div>
              <p className="text-sm text-gray-400">
                Recover lost sales with automated cart reminders
              </p>
            </button>

            <button className="p-4 bg-background text-foreground/5 hover:bg-background text-foreground/10 rounded-lg border border-white/10 transition-colors text-left">
              <div className="flex items-center gap-3 mb-2">
                <Heart className="w-5 h-5 text-pink-400" />
                <h4 className="font-semibold text-foreground">Win-Back</h4>
              </div>
              <p className="text-sm text-gray-400">
                Re-engage inactive customers with special offers
              </p>
            </button>

            <button className="p-4 bg-background text-foreground/5 hover:bg-background text-foreground/10 rounded-lg border border-white/10 transition-colors text-left">
              <div className="flex items-center gap-3 mb-2">
                <Gift className="w-5 h-5 text-purple-400" />
                <h4 className="font-semibold text-foreground">Recommendations</h4>
              </div>
              <p className="text-sm text-gray-400">
                Personalized product suggestions based on behavior
              </p>
            </button>

            <button className="p-4 bg-background text-foreground/5 hover:bg-background text-foreground/10 rounded-lg border border-white/10 transition-colors text-left">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h4 className="font-semibold text-foreground">Promotional</h4>
              </div>
              <p className="text-sm text-gray-400">
                Announce sales, new products, and special events
              </p>
            </button>
          </div>
        </Card>

        {/* Best Practices */}
        <Card className="mt-6 p-6 bg-blue-500/10 border-blue-500/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-400 mb-2">Email Marketing Best Practices</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Personalize subject lines to increase open rates by 26%</li>
                <li>• Send abandoned cart emails within 1 hour for best results</li>
                <li>• Test different send times to find your audience's sweet spot</li>
                <li>• Include clear CTAs and mobile-optimized designs</li>
                <li>• Monitor unsubscribe rates and adjust frequency accordingly</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
