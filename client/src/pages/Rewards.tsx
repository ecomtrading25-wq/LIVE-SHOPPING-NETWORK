import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Trophy,
  Star,
  Gift,
  TrendingUp,
  ShoppingBag,
  MessageSquare,
  Users,
  Zap,
} from "lucide-react";

/**
 * Loyalty Rewards Program
 * Earn points, unlock tiers, and redeem rewards
 */

export default function RewardsPage() {
  const { data: rewardsData } = trpc.rewards.getStatus.useQuery();

  const tiers = [
    {
      name: "Bronze",
      minPoints: 0,
      maxPoints: 999,
      benefits: ["5% off purchases", "Birthday bonus", "Early access to sales"],
      color: "from-orange-600 to-orange-800",
      icon: Star,
    },
    {
      name: "Silver",
      minPoints: 1000,
      maxPoints: 4999,
      benefits: [
        "10% off purchases",
        "Free shipping",
        "Priority support",
        "Exclusive products",
      ],
      color: "from-gray-400 to-gray-600",
      icon: Trophy,
    },
    {
      name: "Gold",
      minPoints: 5000,
      maxPoints: 9999,
      benefits: [
        "15% off purchases",
        "Free express shipping",
        "VIP support",
        "Early product launches",
        "Birthday gift",
      ],
      color: "from-yellow-400 to-yellow-600",
      icon: Trophy,
    },
    {
      name: "Platinum",
      minPoints: 10000,
      maxPoints: Infinity,
      benefits: [
        "20% off purchases",
        "Free overnight shipping",
        "Dedicated account manager",
        "Exclusive events",
        "Custom products",
        "Lifetime warranty",
      ],
      color: "from-red-400 to-red-600",
      icon: Zap,
    },
  ];

  const earnMethods = [
    {
      icon: ShoppingBag,
      title: "Make Purchases",
      points: "1 point per $1 spent",
      color: "text-blue-400",
    },
    {
      icon: MessageSquare,
      title: "Write Reviews",
      points: "50 points per review",
      color: "text-green-400",
    },
    {
      icon: Users,
      title: "Refer Friends",
      points: "500 points per referral",
      color: "text-red-400",
    },
    {
      icon: Gift,
      title: "Birthday Bonus",
      points: "200 points annually",
      color: "text-pink-400",
    },
  ];

  const currentTier =
    tiers.find(
      (t) =>
        rewardsData &&
        rewardsData.points >= t.minPoints &&
        rewardsData.points <= t.maxPoints
    ) || tiers[0];

  const nextTier = tiers[tiers.indexOf(currentTier) + 1];

  const progressToNextTier = nextTier
    ? ((rewardsData?.points || 0) - currentTier.minPoints) /
      (nextTier.minPoints - currentTier.minPoints)
    : 1;

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Rewards Program</h1>
          <p className="text-gray-400">Earn points, unlock tiers, get rewards</p>
        </div>

        {/* Current Status */}
        <Card
          className={`p-8 bg-gradient-to-r ${currentTier.color} border-0 mb-8`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-background text-foreground/20 rounded-full flex items-center justify-center">
                <currentTier.icon className="w-8 h-8 text-foreground" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground">
                  {currentTier.name} Member
                </h2>
                <p className="text-white/80 mt-1">
                  {rewardsData?.points || 0} points earned
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/80 mb-1">Available to redeem</p>
              <p className="text-4xl font-bold text-foreground">
                {rewardsData?.availablePoints || 0}
              </p>
            </div>
          </div>

          {nextTier && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/90 font-medium">
                  Progress to {nextTier.name}
                </p>
                <p className="text-white/90 font-medium">
                  {nextTier.minPoints - (rewardsData?.points || 0)} points to go
                </p>
              </div>
              <Progress
                value={progressToNextTier * 100}
                className="h-3 bg-background text-foreground/20"
              />
            </div>
          )}
        </Card>

        {/* Tier Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`p-6 border-2 ${
                tier.name === currentTier.name
                  ? "border-red-500 bg-red-500/10"
                  : "border-border bg-background text-foreground/50"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${tier.color} rounded-full flex items-center justify-center`}
                >
                  <tier.icon className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{tier.name}</h3>
                  <p className="text-sm text-gray-400">
                    {tier.minPoints}+ points
                  </p>
                </div>
              </div>
              <ul className="space-y-2">
                {tier.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Star className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        {/* How to Earn */}
        <Card className="p-8 bg-background/50 border-border mb-8 text-foreground">
          <h2 className="text-2xl font-bold text-foreground mb-6">How to Earn Points</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {earnMethods.map((method) => (
              <div key={method.title} className="text-center">
                <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto mb-4 text-card-foreground">
                  <method.icon className={`w-8 h-8 ${method.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{method.title}</h3>
                <p className="text-sm text-gray-400">{method.points}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Redeem Rewards */}
        <Card className="p-8 bg-background/50 border-border text-foreground">
          <h2 className="text-2xl font-bold text-foreground mb-6">Redeem Rewards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-card border-zinc-700 text-card-foreground">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Gift className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">$5 Off</h3>
                  <p className="text-sm text-gray-400">500 points</p>
                </div>
              </div>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={(rewardsData?.availablePoints || 0) < 500}
              >
                Redeem
              </Button>
            </Card>

            <Card className="p-6 bg-card border-zinc-700 text-card-foreground">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Gift className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">$10 Off</h3>
                  <p className="text-sm text-gray-400">1000 points</p>
                </div>
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={(rewardsData?.availablePoints || 0) < 1000}
              >
                Redeem
              </Button>
            </Card>

            <Card className="p-6 bg-card border-zinc-700 text-card-foreground">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Gift className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">$25 Off</h3>
                  <p className="text-sm text-gray-400">2500 points</p>
                </div>
              </div>
              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={(rewardsData?.availablePoints || 0) < 2500}
              >
                Redeem
              </Button>
            </Card>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-8 bg-background/50 border-border mt-8 text-foreground">
          <h2 className="text-2xl font-bold text-foreground mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {rewardsData?.recentActivity?.map((activity: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-card rounded-lg text-card-foreground"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{activity.description}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-600">+{activity.points} points</Badge>
              </div>
            )) || (
              <p className="text-center text-gray-400 py-8">
                No recent activity. Start earning points today!
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
