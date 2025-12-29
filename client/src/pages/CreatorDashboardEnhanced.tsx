import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  Heart,
  ShoppingBag,
  Calendar,
  Clock,
  Video,
  Upload,
  Plus,
  BarChart3,
  Wallet,
  Settings,
  Play,
  Edit,
  Trash2,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function CreatorDashboardEnhanced() {
  const [dateRange, setDateRange] = useState("30d");
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  // Fetch creator stats
  const { data: stats } = trpc.creators.getStats.useQuery({ dateRange });

  // Fetch earnings
  const { data: earnings } = trpc.creators.getEarnings.useQuery({ dateRange });

  // Fetch upcoming shows
  const { data: upcomingShows } = trpc.creators.getUpcomingShows.useQuery();

  // Fetch past shows
  const { data: pastShows } = trpc.creators.getPastShows.useQuery({ limit: 10 });

  // Fetch payout history
  const { data: payouts } = trpc.creators.getPayoutHistory.useQuery({ limit: 10 });

  // Mutations
  const scheduleShow = trpc.creators.scheduleShow.useMutation({
    onSuccess: () => {
      toast.success("Show scheduled successfully!");
      setShowScheduleDialog(false);
    },
    onError: (error) => {
      toast.error(`Failed to schedule show: ${error.message}`);
    },
  });

  const cancelShow = trpc.creators.cancelShow.useMutation({
    onSuccess: () => {
      toast.success("Show cancelled");
    },
  });

  const requestPayout = trpc.creators.requestPayout.useMutation({
    onSuccess: () => {
      toast.success("Payout requested! Processing within 3-5 business days.");
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-white/10 bg-background/30 backdrop-blur-xl text-foreground">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Creator Dashboard</h1>
              <p className="text-gray-400">Manage your shows, track earnings, and grow your audience</p>
            </div>

            <div className="flex gap-3">
              <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Show
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-background border-white/10 text-foreground">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Schedule New Live Show</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Plan your next live shopping event
                    </DialogDescription>
                  </DialogHeader>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      scheduleShow.mutate({
                        title: formData.get("title") as string,
                        description: formData.get("description") as string,
                        scheduledFor: new Date(formData.get("scheduledFor") as string),
                        category: formData.get("category") as string,
                        thumbnailUrl: formData.get("thumbnailUrl") as string,
                      });
                    }}
                    className="space-y-4 mt-4"
                  >
                    <div>
                      <label className="text-foreground text-sm font-medium mb-2 block">Show Title</label>
                      <Input
                        name="title"
                        placeholder="e.g., Beauty Essentials Flash Sale"
                        required
                        className="bg-background/5 border-white/10 text-foreground"
                      />
                    </div>

                    <div>
                      <label className="text-foreground text-sm font-medium mb-2 block">Description</label>
                      <Textarea
                        name="description"
                        placeholder="Describe what you'll be featuring..."
                        rows={3}
                        required
                        className="bg-background/5 border-white/10 text-foreground"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-foreground text-sm font-medium mb-2 block">Date & Time</label>
                        <Input
                          name="scheduledFor"
                          type="datetime-local"
                          required
                          className="bg-background/5 border-white/10 text-foreground"
                        />
                      </div>

                      <div>
                        <label className="text-foreground text-sm font-medium mb-2 block">Category</label>
                        <Select name="category" required>
                          <SelectTrigger className="bg-background/5 border-white/10 text-foreground">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Beauty">Beauty</SelectItem>
                            <SelectItem value="Electronics">Electronics</SelectItem>
                            <SelectItem value="Fashion">Fashion</SelectItem>
                            <SelectItem value="Home">Home</SelectItem>
                            <SelectItem value="Fitness">Fitness</SelectItem>
                            <SelectItem value="Kitchen">Kitchen</SelectItem>
                            <SelectItem value="Gaming">Gaming</SelectItem>
                            <SelectItem value="Pets">Pets</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-foreground text-sm font-medium mb-2 block">Thumbnail URL</label>
                      <Input
                        name="thumbnailUrl"
                        type="url"
                        placeholder="https://..."
                        className="bg-background/5 border-white/10 text-foreground"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                        disabled={scheduleShow.isLoading}
                      >
                        {scheduleShow.isLoading ? "Scheduling..." : "Schedule Show"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-white/20 text-foreground hover:bg-background/10"
                        onClick={() => setShowScheduleDialog(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Link href="/live/studio">
                <Button variant="outline" className="border-white/20 text-foreground hover:bg-background/10">
                  <Video className="w-4 h-4 mr-2" />
                  Go Live
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-background text-foreground/5 border border-white/10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="shows" className="data-[state=active]:bg-purple-600">
              <Video className="w-4 h-4 mr-2" />
              My Shows
            </TabsTrigger>
            <TabsTrigger value="earnings" className="data-[state=active]:bg-purple-600">
              <DollarSign className="w-4 h-4 mr-2" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-500/30 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-400 text-sm font-medium">Total Earnings</span>
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  ${((stats?.totalEarningsCents || 0) / 100).toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">
                  +${((stats?.earningsThisMonthCents || 0) / 100).toFixed(2)} this month
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-500/30 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-400 text-sm font-medium">Total Views</span>
                  <Eye className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {(stats?.totalViews || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">
                  {(stats?.avgViewsPerShow || 0).toLocaleString()} avg per show
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-purple-500/30 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-400 text-sm font-medium">Followers</span>
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {(stats?.followerCount || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">
                  +{stats?.newFollowersThisMonth || 0} this month
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-pink-900/30 to-pink-800/30 border-pink-500/30 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-pink-400 text-sm font-medium">Products Sold</span>
                  <ShoppingBag className="w-5 h-5 text-pink-400" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {stats?.totalProductsSold || 0}
                </div>
                <div className="text-xs text-gray-400">
                  ${((stats?.avgOrderValue || 0) / 100).toFixed(2)} avg order
                </div>
              </Card>
            </div>

            {/* Upcoming Shows */}
            <Card className="bg-background text-foreground/5 border-white/10">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-purple-500" />
                  Upcoming Shows
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 ml-2">
                    {upcomingShows?.length || 0}
                  </Badge>
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {upcomingShows && upcomingShows.length > 0 ? (
                  upcomingShows.map((show: any) => (
                    <Card key={show.id} className="bg-background text-foreground/5 border-white/10 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <img
                            src={show.thumbnailUrl || "/placeholder-show.jpg"}
                            alt={show.title}
                            className="w-24 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h3 className="text-foreground font-semibold mb-1">{show.title}</h3>
                            <p className="text-gray-400 text-sm mb-2 line-clamp-1">
                              {show.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(show.scheduledFor).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(show.scheduledFor).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                                {show.category}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-foreground hover:bg-background/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                            onClick={() => cancelShow.mutate({ showId: show.id })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">No upcoming shows scheduled</p>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => setShowScheduleDialog(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Schedule Your First Show
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-background text-foreground/5 border-white/10 p-6 hover:bg-background text-foreground/10 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-purple-400 mb-3" />
                <h3 className="text-foreground font-semibold mb-2">Upload Content</h3>
                <p className="text-gray-400 text-sm">
                  Add product images and videos for your next show
                </p>
              </Card>

              <Card className="bg-background text-foreground/5 border-white/10 p-6 hover:bg-background text-foreground/10 transition-colors cursor-pointer">
                <Users className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="text-foreground font-semibold mb-2">Engage Followers</h3>
                <p className="text-gray-400 text-sm">
                  Send updates and promotions to your audience
                </p>
              </Card>

              <Card className="bg-background text-foreground/5 border-white/10 p-6 hover:bg-background text-foreground/10 transition-colors cursor-pointer">
                <Settings className="w-8 h-8 text-green-400 mb-3" />
                <h3 className="text-foreground font-semibold mb-2">Creator Settings</h3>
                <p className="text-gray-400 text-sm">
                  Manage your profile, payment info, and preferences
                </p>
              </Card>
            </div>
          </TabsContent>

          {/* Shows Tab */}
          <TabsContent value="shows" className="space-y-6">
            <Card className="bg-background text-foreground/5 border-white/10">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-foreground">Past Shows</h2>
              </div>

              <div className="p-6 space-y-4">
                {pastShows && pastShows.length > 0 ? (
                  pastShows.map((show: any) => (
                    <Card key={show.id} className="bg-background text-foreground/5 border-white/10 p-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={show.thumbnailUrl || "/placeholder-show.jpg"}
                          alt={show.title}
                          className="w-32 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-foreground font-semibold mb-1">{show.title}</h3>
                              <p className="text-gray-400 text-sm">
                                {new Date(show.endedAt || show.startedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                              Completed
                            </Badge>
                          </div>

                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Views</span>
                              <p className="text-foreground font-semibold">
                                {show.totalViewers?.toLocaleString() || 0}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-400">Peak Viewers</span>
                              <p className="text-foreground font-semibold">
                                {show.peakViewers?.toLocaleString() || 0}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-400">Products Sold</span>
                              <p className="text-foreground font-semibold">{show.productsSold || 0}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Revenue</span>
                              <p className="text-foreground font-semibold">
                                ${((show.revenueCents || 0) / 100).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-foreground hover:bg-background/10"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Analytics
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No past shows yet</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            {/* Earnings Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-500/30 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-400 text-sm font-medium">Available Balance</span>
                  <Wallet className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-3">
                  ${((earnings?.availableBalanceCents || 0) / 100).toLocaleString()}
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => requestPayout.mutate()}
                  disabled={!earnings?.availableBalanceCents || earnings.availableBalanceCents < 5000}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Request Payout
                </Button>
                {earnings?.availableBalanceCents && earnings.availableBalanceCents < 5000 && (
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Minimum $50 required
                  </p>
                )}
              </Card>

              <Card className="bg-background text-foreground/5 border-white/10 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm font-medium">Pending</span>
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  ${((earnings?.pendingCents || 0) / 100).toLocaleString()}
                </div>
                <p className="text-xs text-gray-400">Processing payouts</p>
              </Card>

              <Card className="bg-background text-foreground/5 border-white/10 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm font-medium">Lifetime Earnings</span>
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  ${((earnings?.lifetimeCents || 0) / 100).toLocaleString()}
                </div>
                <p className="text-xs text-gray-400">All-time total</p>
              </Card>
            </div>

            {/* Payout History */}
            <Card className="bg-background text-foreground/5 border-white/10">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-foreground">Payout History</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-gray-400 font-medium">Date</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Amount</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Method</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                      <th className="text-left p-4 text-gray-400 font-medium">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts && payouts.length > 0 ? (
                      payouts.map((payout: any) => (
                        <tr key={payout.id} className="border-b border-white/10 hover:bg-background text-foreground/5">
                          <td className="p-4 text-foreground">
                            {new Date(payout.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-foreground font-semibold">
                            ${(payout.amountCents / 100).toFixed(2)}
                          </td>
                          <td className="p-4 text-gray-400">{payout.method}</td>
                          <td className="p-4">
                            <Badge
                              className={
                                payout.status === "COMPLETED"
                                  ? "bg-green-500/20 text-green-400 border-green-500/50"
                                  : payout.status === "PENDING"
                                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                                  : "bg-red-500/20 text-red-400 border-red-500/50"
                              }
                            >
                              {payout.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-gray-400 font-mono text-sm">
                            {payout.referenceId || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-gray-400">
                          No payout history yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-background text-foreground/5 border-white/10 p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">Performance Analytics</h2>
              <p className="text-gray-400">
                Detailed analytics and insights coming soon! Track your growth, engagement metrics,
                and audience demographics.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
