import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Flame,
  Star,
  Gift,
  TrendingUp,
  Calendar,
  Award,
  Zap,
} from "lucide-react";

export default function LoyaltyEnhancedPage() {
  const user = {
    points: 2450,
    tier: "Gold",
    nextTier: "Platinum",
    pointsToNextTier: 550,
    loginStreak: 12,
    totalOrders: 34,
  };

  const achievements = [
    { id: 1, name: "First Purchase", icon: "🎉", unlocked: true, points: 100 },
    { id: 2, name: "10 Orders", icon: "🛍️", unlocked: true, points: 500 },
    { id: 3, name: "Referral Master", icon: "👥", unlocked: true, points: 300 },
    { id: 4, name: "Review Writer", icon: "✍️", unlocked: false, progress: 60 },
    { id: 5, name: "30-Day Streak", icon: "🔥", unlocked: false, progress: 40 },
    { id: 6, name: "Big Spender", icon: "💎", unlocked: false, progress: 75 },
  ];

  const dailyChallenges = [
    { id: 1, task: "Browse 5 products", progress: 3, total: 5, points: 50, completed: false },
    { id: 2, task: "Add item to wishlist", progress: 1, total: 1, points: 25, completed: true },
    { id: 3, task: "Write a review", progress: 0, total: 1, points: 100, completed: false },
  ];

  const flashSales = [
    { id: 1, product: "Wireless Headphones", discount: 30, memberOnly: true, endsIn: "2h 15m" },
    { id: 2, product: "Smart Watch", discount: 25, memberOnly: true, endsIn: "5h 30m" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b bg-gradient-to-r from-yellow-500/20 to-orange-500/20">
        <div className="container py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-10 h-10 text-yellow-500" />
                <h1 className="text-4xl font-bold">Loyalty Rewards</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Earn points, unlock rewards, and level up your status
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Your Points</p>
              <p className="text-5xl font-bold text-yellow-500">{user.points}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tier Progress */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge className="bg-yellow-500/20 text-yellow-400 text-lg px-4 py-2">
                  {user.tier} Member
                </Badge>
                <TrendingUp className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress to {user.nextTier}</span>
                  <span className="font-bold">{user.pointsToNextTier} points needed</span>
                </div>
                <Progress value={(user.points / (user.points + user.pointsToNextTier)) * 100} className="h-3" />
              </div>
              <p className="text-xs text-muted-foreground">
                Unlock exclusive perks and higher rewards at {user.nextTier} tier
              </p>
            </Card>

            {/* Login Streak */}
            <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Flame className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{user.loginStreak} Days</p>
                  <p className="text-sm text-muted-foreground">Login Streak</p>
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded ${
                      i < user.loginStreak % 7 ? "bg-orange-500" : "bg-secondary"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Keep your streak alive! Day 30: 2x points multiplier
              </p>
            </Card>

            {/* Member Flash Sales */}
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Member-Only Flash Sales
              </h3>
              <div className="space-y-3">
                {flashSales.map((sale) => (
                  <Card key={sale.id} className="p-3 bg-yellow-500/10 border-yellow-500/20">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-sm">{sale.product}</p>
                      <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                        {sale.discount}% OFF
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Ends in {sale.endsIn}</p>
                  </Card>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Challenges */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-500" />
                Daily Challenges
              </h2>
              <div className="space-y-4">
                {dailyChallenges.map((challenge) => (
                  <Card key={challenge.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-bold mb-1">{challenge.task}</p>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={(challenge.progress / challenge.total) * 100}
                            className="flex-1 h-2"
                          />
                          <span className="text-sm text-muted-foreground">
                            {challenge.progress}/{challenge.total}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <Badge className="bg-blue-500/20 text-blue-400">
                          +{challenge.points} pts
                        </Badge>
                      </div>
                    </div>
                    {challenge.completed && (
                      <Badge className="bg-green-500/20 text-green-400">
                        ✓ Completed
                      </Badge>
                    )}
                  </Card>
                ))}
              </div>
            </Card>

            {/* Achievements */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-red-500" />
                Achievements
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <Card
                    key={achievement.id}
                    className={`p-4 text-center ${
                      achievement.unlocked
                        ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/20"
                        : "bg-secondary/50"
                    }`}
                  >
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                    <p className="font-bold text-sm mb-1">{achievement.name}</p>
                    {achievement.unlocked ? (
                      <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                        +{achievement.points} pts
                      </Badge>
                    ) : (
                      <div>
                        <Progress value={achievement.progress} className="h-1 mb-1" />
                        <p className="text-xs text-muted-foreground">{achievement.progress}%</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
