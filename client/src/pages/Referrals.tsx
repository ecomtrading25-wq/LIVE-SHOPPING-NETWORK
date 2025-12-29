import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  DollarSign,
  Copy,
  Check,
  Gift,
  TrendingUp,
  Share2,
  Mail,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Referral Program Page
 * Unique referral links, tracking dashboard, commission tracking
 */

export default function ReferralsPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: referralData } = trpc.referrals.getMyReferrals.useQuery();
  const { data: earnings } = trpc.referrals.getEarnings.useQuery();

  const referralLink = `https://liveshoppingnetwork.com/ref/${user?.id || "XXXXX"}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareEmail = () => {
    const subject = "Join Live Shopping Network!";
    const body = `Hey! I've been using Live Shopping Network and thought you might like it too. Use my referral link to get started: ${referralLink}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleShareSMS = () => {
    const message = `Check out Live Shopping Network! Use my link: ${referralLink}`;
    window.location.href = `sms:?&body=${encodeURIComponent(message)}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-zinc-900 to-black py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto p-8 bg-background/50 border-border text-center">
            <Users className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Sign In to Access Referrals
            </h2>
            <p className="text-gray-400 mb-6">
              Create an account to start earning rewards by referring friends!
            </p>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              Sign In
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-zinc-900 to-black py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Refer Friends, Earn Rewards
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Share your unique referral link and earn 10% commission on every purchase
            your friends make!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 bg-background/50 border-border text-foreground">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Referrals</p>
                <p className="text-3xl font-bold text-foreground">
                  {referralData?.totalReferrals || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-background/50 border-border text-foreground">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Earned</p>
                <p className="text-3xl font-bold text-foreground">
                  ${earnings?.totalEarned?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-background/50 border-border text-foreground">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Gift className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Pending Rewards</p>
                <p className="text-3xl font-bold text-foreground">
                  ${earnings?.pendingRewards?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-background/50 border-border text-foreground">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">This Month</p>
                <p className="text-3xl font-bold text-foreground">
                  ${earnings?.thisMonth?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Referral Link Section */}
        <Card className="p-8 bg-gradient-to-r from-purple-600 to-pink-600 border-0 mb-12">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Your Unique Referral Link
            </h2>
            <p className="text-white/90">
              Share this link with friends to start earning rewards
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="flex gap-3 mb-6">
              <Input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 bg-white/20 border-white/30 text-foreground text-lg font-mono"
              />
              <Button
                onClick={handleCopyLink}
                className="bg-white text-purple-600 hover:bg-gray-100 px-8"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={handleShareEmail}
                className="bg-white/20 hover:bg-white/30 text-foreground border border-white/30"
              >
                <Mail className="w-5 h-5 mr-2" />
                Share via Email
              </Button>
              <Button
                onClick={handleShareSMS}
                className="bg-white/20 hover:bg-white/30 text-foreground border border-white/30"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Share via SMS
              </Button>
              <Button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "Join Live Shopping Network",
                      text: "Check out Live Shopping Network!",
                      url: referralLink,
                    });
                  } else {
                    handleCopyLink();
                  }
                }}
                className="bg-white/20 hover:bg-white/30 text-foreground border border-white/30"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </Card>

        {/* How It Works */}
        <Card className="p-8 bg-background/50 border-border mb-12 text-foreground">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-foreground text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Share Your Link</h3>
              <p className="text-gray-400">
                Copy your unique referral link and share it with friends via email,
                social media, or messaging apps.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-foreground text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Friends Sign Up & Shop
              </h3>
              <p className="text-gray-400">
                When your friends use your link to sign up and make a purchase, you
                earn rewards automatically.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-foreground text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Earn 10% Commission</h3>
              <p className="text-gray-400">
                Get 10% commission on every purchase your referrals make. Rewards are
                added to your account instantly!
              </p>
            </div>
          </div>
        </Card>

        {/* Referral History */}
        <Card className="p-8 bg-background/50 border-border text-foreground">
          <h2 className="text-2xl font-bold text-foreground mb-6">Referral History</h2>
          
          {referralData && referralData.referrals && referralData.referrals.length > 0 ? (
            <div className="space-y-3">
              {referralData.referrals.map((referral: any) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 bg-card rounded-lg text-card-foreground"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{referral.name}</p>
                      <p className="text-sm text-gray-400">
                        Joined {new Date(referral.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">
                      ${referral.totalEarned.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-400">
                      {referral.purchaseCount} purchases
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No referrals yet</p>
              <p className="text-gray-500 text-sm">
                Start sharing your link to see your referrals here
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
