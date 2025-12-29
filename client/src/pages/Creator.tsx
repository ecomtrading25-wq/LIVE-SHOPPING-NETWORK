import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Video,
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Calendar,
  Clock,
  Eye,
  ShoppingBag,
  Award,
  Settings,
  Play,
  Square,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Creator Dashboard Portal
 * Live session scheduling, analytics, earnings, product selection
 */

export default function CreatorDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: creatorData } = trpc.creators.getProfile.useQuery();
  const { data: upcomingSessions } = trpc.creators.getUpcomingSessions.useQuery();
  const { data: earnings } = trpc.creators.getEarnings.useQuery();
  const { data: analytics } = trpc.creators.getAnalytics.useQuery();

  const startSessionMutation = trpc.creators.startSession.useMutation({
    onSuccess: () => {
      toast.success("Live session started!");
    },
  });

  const endSessionMutation = trpc.creators.endSession.useMutation({
    onSuccess: () => {
      toast.success("Live session ended");
    },
  });

  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "products", label: "Products", icon: Package },
    { id: "earnings", label: "Earnings", icon: DollarSign },
    { id: "analytics", label: "Analytics", icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-background/50 border-b border-border text-foreground">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Creator Dashboard</h1>
              <p className="text-gray-400 mt-1">
                Welcome back, {creatorData?.name || "Creator"}!
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${creatorData?.tier === "platinum" ? "bg-red-600" : creatorData?.tier === "gold" ? "bg-yellow-600" : creatorData?.tier === "silver" ? "bg-gray-400" : "bg-orange-600"}`}>
                {creatorData?.tier?.toUpperCase() || "BRONZE"} Creator
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-background/50 border-border text-foreground">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-sm text-gray-400">Total Views</p>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {analytics?.totalViews?.toLocaleString() || "0"}
            </p>
            <p className="text-sm text-green-400 mt-1">+12% this week</p>
          </Card>

          <Card className="p-6 bg-background/50 border-border text-foreground">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-sm text-gray-400">Total Sales</p>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {analytics?.totalSales?.toLocaleString() || "0"}
            </p>
            <p className="text-sm text-green-400 mt-1">+8% this week</p>
          </Card>

          <Card className="p-6 bg-background/50 border-border text-foreground">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-sm text-gray-400">Total Earnings</p>
            </div>
            <p className="text-3xl font-bold text-foreground">
              ${earnings?.totalEarnings?.toFixed(2) || "0.00"}
            </p>
            <p className="text-sm text-red-400 mt-1">
              ${earnings?.pendingPayout?.toFixed(2) || "0.00"} pending
            </p>
          </Card>

          <Card className="p-6 bg-background/50 border-border text-foreground">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-sm text-gray-400">Commission Rate</p>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {creatorData?.commissionRate || 15}%
            </p>
            <p className="text-sm text-gray-400 mt-1">Based on tier</p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? "bg-red-600" : ""}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Current Live Session */}
            <Card className="p-8 bg-gradient-to-r from-red-600 to-pink-600 border-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-background text-foreground rounded-full animate-pulse"></div>
                    <h2 className="text-2xl font-bold text-foreground">LIVE NOW</h2>
                  </div>
                  <p className="text-white/90 mb-4">
                    {analytics?.currentViewers || 0} viewers watching
                  </p>
                  <div className="flex items-center gap-4">
                    <Button
                      className="bg-background text-foreground text-red-600 hover:bg-gray-100"
                      onClick={() => endSessionMutation.mutate({ sessionId: "current" })}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      End Session
                    </Button>
                    <Button variant="outline" className="border-white text-foreground hover:bg-background/20">
                      <Package className="w-4 h-4 mr-2" />
                      Manage Products
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm mb-1">Session Duration</p>
                  <p className="text-4xl font-bold text-foreground">2:34:15</p>
                  <p className="text-white/80 text-sm mt-3">Revenue Today</p>
                  <p className="text-3xl font-bold text-foreground">
                    ${analytics?.todayRevenue?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Upcoming Sessions */}
            <Card className="p-6 bg-background/50 border-border text-foreground">
              <h3 className="text-xl font-bold text-foreground mb-4">Upcoming Sessions</h3>
              <div className="space-y-3">
                {upcomingSessions && upcomingSessions.length > 0 ? (
                  upcomingSessions.map((session: any) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-card rounded-lg text-card-foreground"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                          <Video className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{session.title}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(session.scheduledAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(session.scheduledAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => startSessionMutation.mutate({ sessionId: session.id })}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-8">
                    No upcoming sessions scheduled
                  </p>
                )}
              </div>
              <Button className="w-full mt-4 bg-red-600 hover:bg-red-700">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule New Session
              </Button>
            </Card>

            {/* Recent Performance */}
            <Card className="p-6 bg-background/50 border-border text-foreground">
              <h3 className="text-xl font-bold text-foreground mb-4">Recent Performance</h3>
              <div className="space-y-3">
                {[
                  { date: "Dec 25", views: 1234, sales: 45, revenue: 2345.67 },
                  { date: "Dec 24", views: 987, sales: 32, revenue: 1876.43 },
                  { date: "Dec 23", views: 1543, sales: 67, revenue: 3421.89 },
                ].map((day) => (
                  <div
                    key={day.date}
                    className="flex items-center justify-between p-4 bg-card rounded-lg text-card-foreground"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{day.date}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <span>{day.views.toLocaleString()} views</span>
                        <span>{day.sales} sales</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">
                        ${day.revenue.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-400">
                        ${(day.revenue * (creatorData?.commissionRate || 15) / 100).toFixed(2)} earned
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === "schedule" && (
          <Card className="p-8 bg-background/50 border-border text-foreground">
            <h2 className="text-2xl font-bold text-foreground mb-6">Schedule Management</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Session Title
                </label>
                <Input
                  placeholder="e.g., Holiday Gift Guide Live"
                  className="bg-card border-zinc-700 text-card-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Date
                  </label>
                  <Input
                    type="date"
                    className="bg-card border-zinc-700 text-card-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Time
                  </label>
                  <Input
                    type="time"
                    className="bg-card border-zinc-700 text-card-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Stream URL
                </label>
                <Input
                  placeholder="https://stream.example.com/live.m3u8"
                  className="bg-card border-zinc-700 text-card-foreground"
                />
              </div>

              <Button className="w-full bg-red-600 hover:bg-red-700">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Session
              </Button>
            </div>
          </Card>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <Card className="p-8 bg-background/50 border-border text-foreground">
            <h2 className="text-2xl font-bold text-foreground mb-6">Product Selection</h2>
            <p className="text-gray-400 text-center py-12">
              Select products to feature in your live sessions
            </p>
          </Card>
        )}

        {/* Earnings Tab */}
        {activeTab === "earnings" && (
          <Card className="p-8 bg-background/50 border-border text-foreground">
            <h2 className="text-2xl font-bold text-foreground mb-6">Earnings & Payouts</h2>
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">Total Earned</p>
                <p className="text-3xl font-bold text-foreground">
                  ${earnings?.totalEarnings?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">Pending Payout</p>
                <p className="text-3xl font-bold text-yellow-400">
                  ${earnings?.pendingPayout?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">Paid Out</p>
                <p className="text-3xl font-bold text-green-400">
                  ${earnings?.paidOut?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-4">Payout History</h3>
            <div className="space-y-3">
              {earnings?.payoutHistory?.map((payout: any) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-4 bg-card rounded-lg text-card-foreground"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {new Date(payout.date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-400">{payout.method}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">
                      ${payout.amount.toFixed(2)}
                    </p>
                    <Badge className="bg-green-600 mt-1">{payout.status}</Badge>
                  </div>
                </div>
              )) || (
                <p className="text-center text-gray-400 py-8">
                  No payout history yet
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <Card className="p-8 bg-background/50 border-border text-foreground">
            <h2 className="text-2xl font-bold text-foreground mb-6">Performance Analytics</h2>
            <p className="text-gray-400 text-center py-12">
              Detailed analytics coming soon
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
