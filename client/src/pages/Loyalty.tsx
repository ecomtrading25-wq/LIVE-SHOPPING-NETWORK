import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Star,
  Gift,
  TrendingUp,
  Users,
  ShoppingBag,
  MessageSquare,
  Calendar,
  Award,
  Zap,
  Target,
  Crown,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Customer Loyalty Dashboard
 * Points tracking, tier progression, achievements, and rewards
 */

interface LoyaltyTier {
  name: string;
  minPoints: number;
  maxPoints: number;
  benefits: string[];
  color: string;
  icon: any;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: any;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  value: number;
  available: boolean;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  points: number;
  date: string;
}

export default function LoyaltyPage() {
  // Mock user loyalty data
  const [userPoints, setUserPoints] = useState(3250);
  const [lifetimePoints, setLifetimePoints] = useState(8500);
  const [referralCount, setReferralCount] = useState(12);

  const tiers: LoyaltyTier[] = [
    {
      name: "Bronze",
      minPoints: 0,
      maxPoints: 999,
      benefits: ["5% off all purchases", "Early sale access", "Birthday bonus"],
      color: "text-amber-600",
      icon: Award,
    },
    {
      name: "Silver",
      minPoints: 1000,
      maxPoints: 2999,
      benefits: ["10% off all purchases", "Free shipping", "Priority support", "Exclusive products"],
      color: "text-gray-400",
      icon: Star,
    },
    {
      name: "Gold",
      minPoints: 3000,
      maxPoints: 6999,
      benefits: ["15% off all purchases", "Free express shipping", "VIP support", "Early product access", "Monthly gift"],
      color: "text-yellow-500",
      icon: Trophy,
    },
    {
      name: "Platinum",
      minPoints: 7000,
      maxPoints: Infinity,
      benefits: ["20% off all purchases", "Free overnight shipping", "Dedicated concierge", "Exclusive events", "Personal shopper", "Luxury gifts"],
      color: "text-purple-500",
      icon: Crown,
    },
  ];

  const getCurrentTier = () => {
    return tiers.find(
      (tier) => userPoints >= tier.minPoints && userPoints <= tier.maxPoints
    ) || tiers[0];
  };

  const getNextTier = () => {
    const currentTier = getCurrentTier();
    const currentIndex = tiers.findIndex((t) => t.name === currentTier.name);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  };

  const getTierProgress = () => {
    const currentTier = getCurrentTier();
    const nextTier = getNextTier();
    if (!nextTier) return 100;

    const pointsInTier = userPoints - currentTier.minPoints;
    const tierRange = nextTier.minPoints - currentTier.minPoints;
    return (pointsInTier / tierRange) * 100;
  };

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const tierProgress = getTierProgress();
  const CurrentTierIcon = currentTier.icon;

  const achievements: Achievement[] = [
    {
      id: "1",
      title: "First Purchase",
      description: "Make your first purchase",
      points: 100,
      icon: ShoppingBag,
      unlocked: true,
      unlockedAt: "2025-11-15",
    },
    {
      id: "2",
      title: "Loyal Customer",
      description: "Make 10 purchases",
      points: 500,
      icon: Star,
      unlocked: true,
      unlockedAt: "2025-12-01",
      progress: 10,
      maxProgress: 10,
    },
    {
      id: "3",
      title: "Super Shopper",
      description: "Make 50 purchases",
      points: 2000,
      icon: Trophy,
      unlocked: false,
      progress: 23,
      maxProgress: 50,
    },
    {
      id: "4",
      title: "Review Master",
      description: "Write 20 product reviews",
      points: 300,
      icon: MessageSquare,
      unlocked: false,
      progress: 8,
      maxProgress: 20,
    },
    {
      id: "5",
      title: "Referral Champion",
      description: "Refer 10 friends",
      points: 1000,
      icon: Users,
      unlocked: true,
      unlockedAt: "2025-12-20",
      progress: 12,
      maxProgress: 10,
    },
    {
      id: "6",
      title: "Live Shopping Fan",
      description: "Attend 5 live shopping sessions",
      points: 250,
      icon: Zap,
      unlocked: false,
      progress: 3,
      maxProgress: 5,
    },
    {
      id: "7",
      title: "Early Bird",
      description: "Shop during flash sales 10 times",
      points: 400,
      icon: Target,
      unlocked: false,
      progress: 6,
      maxProgress: 10,
    },
    {
      id: "8",
      title: "Social Butterfly",
      description: "Share 15 products on social media",
      points: 200,
      icon: Users,
      unlocked: false,
      progress: 4,
      maxProgress: 15,
    },
  ];

  const rewards: Reward[] = [
    {
      id: "1",
      title: "$5 Off Coupon",
      description: "Get $5 off your next purchase",
      pointsCost: 500,
      value: 5,
      available: true,
    },
    {
      id: "2",
      title: "$10 Off Coupon",
      description: "Get $10 off your next purchase",
      pointsCost: 1000,
      value: 10,
      available: true,
    },
    {
      id: "3",
      title: "$25 Off Coupon",
      description: "Get $25 off your next purchase",
      pointsCost: 2500,
      value: 25,
      available: true,
    },
    {
      id: "4",
      title: "Free Shipping",
      description: "Free shipping on your next order",
      pointsCost: 300,
      value: 10,
      available: true,
    },
    {
      id: "5",
      title: "Express Shipping Upgrade",
      description: "Free express shipping upgrade",
      pointsCost: 800,
      value: 20,
      available: true,
    },
    {
      id: "6",
      title: "Mystery Gift",
      description: "Receive a surprise gift with your next order",
      pointsCost: 1500,
      value: 30,
      available: true,
    },
  ];

  const recentActivity: Activity[] = [
    {
      id: "1",
      type: "purchase",
      description: "Purchased Wireless Earbuds Pro",
      points: 150,
      date: "2025-12-26",
    },
    {
      id: "2",
      type: "review",
      description: "Wrote review for Smart Watch",
      points: 25,
      date: "2025-12-25",
    },
    {
      id: "3",
      type: "referral",
      description: "Friend Sarah joined via your referral",
      points: 100,
      date: "2025-12-24",
    },
    {
      id: "4",
      type: "live",
      description: "Attended Tech Tuesday live show",
      points: 50,
      date: "2025-12-23",
    },
    {
      id: "5",
      type: "purchase",
      description: "Purchased Fitness Tracker",
      points: 80,
      date: "2025-12-22",
    },
  ];

  const handleRedeemReward = (reward: Reward) => {
    if (userPoints >= reward.pointsCost) {
      setUserPoints(userPoints - reward.pointsCost);
      toast.success(`Redeemed: ${reward.title}! Check your email for the coupon code.`);
    } else {
      toast.error(`Not enough points. You need ${reward.pointsCost - userPoints} more points.`);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <ShoppingBag className="w-4 h-4" />;
      case "review":
        return <MessageSquare className="w-4 h-4" />;
      case "referral":
        return <Users className="w-4 h-4" />;
      case "live":
        return <Zap className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Loyalty Rewards</h1>
          <p className="text-gray-300 text-lg">Earn points, unlock rewards, and enjoy exclusive benefits</p>
        </div>

        {/* Current Tier & Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-white/5 border-white/10 col-span-1 md:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Current Tier</p>
                <div className="flex items-center gap-3">
                  <CurrentTierIcon className={`w-8 h-8 ${currentTier.color}`} />
                  <h2 className={`text-3xl font-bold ${currentTier.color}`}>{currentTier.name}</h2>
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm mb-1">Available Points</p>
                <p className="text-4xl font-bold text-white">{userPoints.toLocaleString()}</p>
              </div>
            </div>

            {nextTier && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-sm">Progress to {nextTier.name}</p>
                  <p className="text-white text-sm font-medium">
                    {nextTier.minPoints - userPoints} points to go
                  </p>
                </div>
                <Progress value={tierProgress} className="h-3 mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Current Benefits</p>
                    <ul className="space-y-1">
                      {currentTier.benefits.slice(0, 2).map((benefit, index) => (
                        <li key={index} className="text-white text-sm flex items-center gap-2">
                          <Star className="w-3 h-3 text-yellow-400" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Unlock at {nextTier.name}</p>
                    <ul className="space-y-1">
                      {nextTier.benefits.slice(0, 2).map((benefit, index) => (
                        <li key={index} className="text-purple-400 text-sm flex items-center gap-2">
                          <Crown className="w-3 h-3" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Lifetime Points</p>
                <p className="text-2xl font-bold text-white">{lifetimePoints.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Referrals</p>
                <p className="text-2xl font-bold text-white">{referralCount}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Member Since</p>
                <p className="text-white">Nov 2025</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Achievements */}
        <Card className="p-6 bg-white/5 border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((achievement) => {
              const AchievementIcon = achievement.icon;
              return (
                <Card
                  key={achievement.id}
                  className={`p-4 border ${
                    achievement.unlocked
                      ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`p-3 rounded-lg ${
                        achievement.unlocked ? "bg-purple-500/30" : "bg-white/10"
                      }`}
                    >
                      <AchievementIcon
                        className={`w-6 h-6 ${
                          achievement.unlocked ? "text-purple-400" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <Badge
                      className={
                        achievement.unlocked
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }
                    >
                      {achievement.points} pts
                    </Badge>
                  </div>
                  <h3 className="text-white font-bold mb-1">{achievement.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">{achievement.description}</p>
                  {!achievement.unlocked && achievement.progress !== undefined && (
                    <div>
                      <Progress
                        value={(achievement.progress / achievement.maxProgress!) * 100}
                        className="h-2 mb-1"
                      />
                      <p className="text-gray-400 text-xs">
                        {achievement.progress}/{achievement.maxProgress}
                      </p>
                    </div>
                  )}
                  {achievement.unlocked && (
                    <p className="text-green-400 text-xs">
                      Unlocked {achievement.unlockedAt}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </Card>

        {/* Rewards Catalog */}
        <Card className="p-6 bg-white/5 border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Redeem Rewards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <Card key={reward.id} className="p-6 bg-white/5 border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Gift className="w-6 h-6 text-purple-400" />
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-400">
                    {reward.pointsCost} pts
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{reward.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{reward.description}</p>
                <p className="text-green-400 text-sm mb-4">Value: ${reward.value}</p>
                <Button
                  onClick={() => handleRedeemReward(reward)}
                  disabled={userPoints < reward.pointsCost}
                  className="w-full"
                >
                  {userPoints >= reward.pointsCost ? "Redeem" : "Not Enough Points"}
                </Button>
              </Card>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{activity.description}</p>
                    <p className="text-gray-400 text-sm">{activity.date}</p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400">
                  +{activity.points} pts
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* How to Earn Points */}
        <Card className="p-6 bg-white/5 border-white/10 mt-8">
          <h2 className="text-2xl font-bold text-white mb-6">How to Earn Points</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-4 bg-purple-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-white font-bold mb-2">Make Purchases</h3>
              <p className="text-gray-400 text-sm">Earn 1 point for every $1 spent</p>
            </div>
            <div className="text-center">
              <div className="p-4 bg-purple-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-white font-bold mb-2">Write Reviews</h3>
              <p className="text-gray-400 text-sm">Earn 25 points per product review</p>
            </div>
            <div className="text-center">
              <div className="p-4 bg-purple-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-white font-bold mb-2">Refer Friends</h3>
              <p className="text-gray-400 text-sm">Earn 100 points per successful referral</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
