import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Gift,
  TrendingUp,
  Copy,
  Check,
  Share2,
  DollarSign,
  Award,
  Link as LinkIcon,
  Mail,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

import AdminProtectedRoute from "@/components/AdminProtectedRoute";
interface Referral {
  id: string;
  name: string;
  email: string;
  status: "pending" | "signed-up" | "purchased";
  reward: number;
  date: string;
}

export default function ReferralDashboard() {
  return (
    <AdminProtectedRoute>
      <ReferralDashboardContent />
    </AdminProtectedRoute>
  );
}

function ReferralDashboardContent() {
  const [copied, setCopied] = useState(false);
  const referralCode = "LIVE2024XYZ";
  const referralLink = `https://liveshoppingnetwork.com/ref/${referralCode}`;

  const [referrals] = useState<Referral[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah@example.com",
      status: "purchased",
      reward: 25,
      date: "2024-01-20",
    },
    {
      id: "2",
      name: "Mike Chen",
      email: "mike@example.com",
      status: "signed-up",
      reward: 10,
      date: "2024-01-19",
    },
    {
      id: "3",
      name: "Emma Davis",
      email: "emma@example.com",
      status: "pending",
      reward: 0,
      date: "2024-01-18",
    },
  ]);

  const totalReferrals = referrals.length;
  const successfulReferrals = referrals.filter((r) => r.status === "purchased").length;
  const totalEarned = referrals.reduce((sum, r) => sum + r.reward, 0);
  const conversionRate = totalReferrals > 0 
    ? ((successfulReferrals / totalReferrals) * 100).toFixed(1) 
    : "0";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status: Referral["status"]) => {
    switch (status) {
      case "purchased":
        return "bg-green-500/20 text-green-400";
      case "signed-up":
        return "bg-blue-500/20 text-blue-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
    }
  };

  const getStatusText = (status: Referral["status"]) => {
    switch (status) {
      case "purchased":
        return "Purchased";
      case "signed-up":
        return "Signed Up";
      case "pending":
        return "Pending";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Referral Program</h1>
          <p className="text-gray-400">Earn rewards by inviting friends</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-sm text-gray-400">Total Referrals</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalReferrals}</p>
          </Card>

          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-sm text-gray-400">Successful</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{successfulReferrals}</p>
          </Card>

          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Award className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-sm text-gray-400">Conversion Rate</p>
            </div>
            <p className="text-3xl font-bold text-foreground">{conversionRate}%</p>
          </Card>

          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-sm text-gray-400">Total Earned</p>
            </div>
            <p className="text-3xl font-bold text-foreground">${totalEarned}</p>
          </Card>
        </div>

        {/* Referral Link */}
        <Card className="p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">Your Referral Link</h3>
              <p className="text-sm text-muted-foreground">
                Share this link and earn $10 for sign-ups, $25 for purchases
              </p>
            </div>
            <Badge className="bg-purple-600 text-foreground">
              <Gift className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </div>

          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={referralLink}
                readOnly
                className="pl-10 bg-background/10 border-white/20 text-foreground font-mono"
              />
            </div>
            <Button
              onClick={handleCopyLink}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-foreground"
              onClick={() => toast.info("Share via Email feature coming soon!")}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-foreground"
              onClick={() => toast.info("Share via SMS feature coming soon!")}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              SMS
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-foreground"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: "Join Live Shopping Network",
                    text: "Shop exclusive deals during live shows!",
                    url: referralLink,
                  });
                } else {
                  toast.info("Share feature not supported on this device");
                }
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </Card>

        {/* How It Works */}
        <Card className="p-6 bg-background text-foreground/5 border-white/10 mb-8">
          <h3 className="text-xl font-bold text-foreground mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Share2 className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">1. Share Your Link</h4>
              <p className="text-sm text-gray-400">
                Send your unique referral link to friends and family
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">2. They Sign Up</h4>
              <p className="text-sm text-gray-400">
                Your friend creates an account and makes their first purchase
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="w-6 h-6 text-green-400" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">3. Earn Rewards</h4>
              <p className="text-sm text-gray-400">
                Get $10 for sign-ups and $25 when they make a purchase
              </p>
            </div>
          </div>
        </Card>

        {/* Referrals List */}
        <Card className="p-6 bg-background text-foreground/5 border-white/10">
          <h3 className="text-xl font-bold text-foreground mb-4">Your Referrals</h3>
          {referrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No referrals yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Start sharing your link to earn rewards!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 bg-background text-foreground/5 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-foreground font-semibold">{referral.name}</p>
                      <p className="text-sm text-gray-400">{referral.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Joined</p>
                      <p className="text-foreground font-medium">
                        {new Date(referral.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Reward</p>
                      <p className="text-green-400 font-bold">
                        ${referral.reward}
                      </p>
                    </div>
                    <Badge className={getStatusColor(referral.status)}>
                      {getStatusText(referral.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Reward Tiers */}
        <Card className="mt-8 p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
          <h3 className="text-xl font-bold text-foreground mb-4">Reward Tiers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-background text-foreground/5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-bronze-400" />
                <h4 className="font-semibold text-foreground">Bronze</h4>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">$10</p>
              <p className="text-sm text-gray-400">Per sign-up</p>
            </div>
            <div className="p-4 bg-background text-foreground/5 rounded-lg border-2 border-purple-500/50">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-silver-400" />
                <h4 className="font-semibold text-foreground">Silver</h4>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">$25</p>
              <p className="text-sm text-gray-400">Per first purchase</p>
            </div>
            <div className="p-4 bg-background text-foreground/5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-yellow-400" />
                <h4 className="font-semibold text-foreground">Gold</h4>
              </div>
              <p className="text-2xl font-bold text-foreground mb-1">5%</p>
              <p className="text-sm text-gray-400">Lifetime commission</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
