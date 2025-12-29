import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Target,
  Flame,
  Star,
  Award,
  TrendingUp,
  Zap,
  Gift,
  Share2,
  Crown,
  Medal,
  CheckCircle,
  Lock,
} from "lucide-react";

/**
 * Gamification Engine
 * Achievements, daily challenges, leaderboards, streak tracking, reward multipliers
 */

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  unlocked: boolean;
  progress: number;
  total: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: "daily" | "weekly" | "special";
  progress: number;
  total: number;
  reward: number;
  expiresAt: string;
  completed: boolean;
}

interface LeaderboardEntry {
  rank: number;
  user: {
    name: string;
    avatar: string;
    tier: string;
  };
  points: number;
  achievements: number;
  streak: number;
}

export default function GamificationPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<"weekly" | "monthly" | "all_time">("weekly");

  // User stats
  const userStats = {
    totalPoints: 8450,
    currentStreak: 12,
    longestStreak: 28,
    achievementsUnlocked: 23,
    totalAchievements: 50,
    currentMultiplier: 1.5,
    nextTierPoints: 10000,
  };

  // Mock achievements
  const achievements: Achievement[] = [
    {
      id: "1",
      name: "First Steps",
      description: "Make your first purchase",
      icon: "🎯",
      category: "Shopping",
      points: 100,
      unlocked: true,
      progress: 1,
      total: 1,
      rarity: "common",
    },
    {
      id: "2",
      name: "Shopping Spree",
      description: "Complete 10 orders",
      icon: "🛍️",
      category: "Shopping",
      points: 500,
      unlocked: true,
      progress: 10,
      total: 10,
      rarity: "rare",
    },
    {
      id: "3",
      name: "Review Master",
      description: "Write 25 product reviews",
      icon: "⭐",
      category: "Community",
      points: 750,
      unlocked: false,
      progress: 18,
      total: 25,
      rarity: "epic",
    },
    {
      id: "4",
      name: "Referral Champion",
      description: "Refer 50 friends",
      icon: "👥",
      category: "Social",
      points: 2000,
      unlocked: false,
      progress: 12,
      total: 50,
      rarity: "legendary",
    },
    {
      id: "5",
      name: "Early Bird",
      description: "Shop during morning hours 30 times",
      icon: "🌅",
      category: "Habits",
      points: 300,
      unlocked: true,
      progress: 30,
      total: 30,
      rarity: "common",
    },
    {
      id: "6",
      name: "Live Shopping Fan",
      description: "Attend 20 live shopping sessions",
      icon: "📺",
      category: "Live",
      points: 600,
      unlocked: false,
      progress: 14,
      total: 20,
      rarity: "rare",
    },
  ];

  // Mock challenges
  const challenges: Challenge[] = [
    {
      id: "1",
      title: "Browse 5 Products",
      description: "View at least 5 different products today",
      type: "daily",
      progress: 3,
      total: 5,
      reward: 50,
      expiresAt: "2025-12-28T00:00:00Z",
      completed: false,
    },
    {
      id: "2",
      title: "Add a Review",
      description: "Write a review for any product you've purchased",
      type: "daily",
      progress: 0,
      total: 1,
      reward: 100,
      expiresAt: "2025-12-28T00:00:00Z",
      completed: false,
    },
    {
      id: "3",
      title: "Share on Social",
      description: "Share a product on social media",
      type: "daily",
      progress: 1,
      total: 1,
      reward: 75,
      expiresAt: "2025-12-28T00:00:00Z",
      completed: true,
    },
    {
      id: "4",
      title: "Complete 3 Orders",
      description: "Place and complete 3 orders this week",
      type: "weekly",
      progress: 1,
      total: 3,
      reward: 500,
      expiresAt: "2025-12-31T23:59:59Z",
      completed: false,
    },
    {
      id: "5",
      title: "Holiday Special",
      description: "Purchase any item from the holiday collection",
      type: "special",
      progress: 0,
      total: 1,
      reward: 1000,
      expiresAt: "2025-12-31T23:59:59Z",
      completed: false,
    },
  ];

  // Mock leaderboard
  const leaderboard: LeaderboardEntry[] = [
    {
      rank: 1,
      user: {
        name: "Alex Thompson",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
        tier: "Platinum",
      },
      points: 15420,
      achievements: 42,
      streak: 45,
    },
    {
      rank: 2,
      user: {
        name: "Sarah Johnson",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
        tier: "Gold",
      },
      points: 12890,
      achievements: 38,
      streak: 32,
    },
    {
      rank: 3,
      user: {
        name: "Michael Chen",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
        tier: "Gold",
      },
      points: 11250,
      achievements: 35,
      streak: 28,
    },
    {
      rank: 4,
      user: {
        name: "You",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
        tier: "Silver",
      },
      points: 8450,
      achievements: 23,
      streak: 12,
    },
    {
      rank: 5,
      user: {
        name: "Emily Rodriguez",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
        tier: "Silver",
      },
      points: 7820,
      achievements: 21,
      streak: 18,
    },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "bg-gradient-to-r from-yellow-500 to-orange-500";
      case "epic":
        return "bg-gradient-to-r from-red-500 to-orange-500";
      case "rare":
        return "bg-gradient-to-r from-blue-500 to-cyan-500";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600";
    }
  };

  const getChallengeTypeColor = (type: string) => {
    switch (type) {
      case "special":
        return "bg-gradient-to-r from-yellow-500 to-orange-500 text-foreground";
      case "weekly":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-blue-500/20 text-blue-400";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
            Gamification Hub
          </h1>
          <p className="text-xl text-gray-400">
            Complete challenges, unlock achievements, and climb the leaderboard!
          </p>
        </div>

        {/* User Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Total Points</p>
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-4xl font-bold text-yellow-400 mb-1">{userStats.totalPoints.toLocaleString()}</p>
            <Progress value={(userStats.totalPoints / userStats.nextTierPoints) * 100} className="h-2" />
            <p className="text-xs text-gray-400 mt-2">{userStats.nextTierPoints - userStats.totalPoints} to next tier</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Current Streak</p>
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-4xl font-bold text-orange-400 mb-1">{userStats.currentStreak} days</p>
            <p className="text-xs text-gray-400">Longest: {userStats.longestStreak} days</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Achievements</p>
              <Trophy className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-4xl font-bold text-red-400 mb-1">{userStats.achievementsUnlocked}/{userStats.totalAchievements}</p>
            <Progress value={(userStats.achievementsUnlocked / userStats.totalAchievements) * 100} className="h-2" />
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Point Multiplier</p>
              <Zap className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-4xl font-bold text-green-400 mb-1">{userStats.currentMultiplier}x</p>
            <p className="text-xs text-gray-400">Active from streak bonus</p>
          </Card>
        </div>

        <Tabs defaultValue="challenges" className="space-y-6">
          <TabsList className="bg-background border border-border text-foreground">
            <TabsTrigger value="challenges">
              <Target className="w-4 h-4 mr-2" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Award className="w-4 h-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-6">
            <Card className="p-6 bg-background border-border text-foreground">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Target className="w-6 h-6 text-blue-500" />
                Daily & Weekly Challenges
              </h2>

              <div className="space-y-4">
                {challenges.map((challenge) => (
                  <Card
                    key={challenge.id}
                    className={`p-4 ${
                      challenge.completed
                        ? "bg-green-500/10 border-green-500/20"
                        : "bg-card border-zinc-700"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold">{challenge.title}</h3>
                          <Badge className={getChallengeTypeColor(challenge.type)}>
                            {challenge.type}
                          </Badge>
                          {challenge.completed && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{challenge.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-yellow-400 font-bold">
                          <Gift className="w-4 h-4" />
                          <span>+{challenge.reward}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Progress</span>
                        <span className="font-bold">
                          {challenge.progress} / {challenge.total}
                        </span>
                      </div>
                      <Progress
                        value={(challenge.progress / challenge.total) * 100}
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500">
                        Expires: {new Date(challenge.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <Card className="p-6 bg-background border-border text-foreground">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-red-500" />
                Achievement Collection
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <Card
                    key={achievement.id}
                    className={`p-4 relative overflow-hidden ${
                      achievement.unlocked
                        ? "bg-gradient-to-br from-zinc-800 to-zinc-900 border-zinc-700"
                        : "bg-background text-foreground/50 border-border opacity-60"
                    }`}
                  >
                    {achievement.unlocked && (
                      <div className={`absolute top-0 right-0 w-24 h-24 ${getRarityColor(achievement.rarity)} opacity-10 blur-2xl`} />
                    )}

                    <div className="relative">
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-4xl">{achievement.unlocked ? achievement.icon : "🔒"}</div>
                        <Badge className={achievement.unlocked ? getRarityColor(achievement.rarity) + " text-foreground" : "bg-gray-500"}>
                          {achievement.rarity}
                        </Badge>
                      </div>

                      <h3 className="text-lg font-bold mb-1">{achievement.name}</h3>
                      <p className="text-sm text-gray-400 mb-3">{achievement.description}</p>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">{achievement.category}</span>
                        <div className="flex items-center gap-1 text-yellow-400 font-bold">
                          <Star className="w-4 h-4" />
                          <span>{achievement.points}</span>
                        </div>
                      </div>

                      {!achievement.unlocked && (
                        <>
                          <Progress value={(achievement.progress / achievement.total) * 100} className="h-2 mb-1" />
                          <p className="text-xs text-gray-500">
                            {achievement.progress} / {achievement.total}
                          </p>
                        </>
                      )}

                      {achievement.unlocked && (
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          <span>Unlocked!</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card className="p-6 bg-background border-border text-foreground">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Leaderboard
                </h2>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={selectedPeriod === "weekly" ? "default" : "outline"}
                    onClick={() => setSelectedPeriod("weekly")}
                  >
                    Weekly
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedPeriod === "monthly" ? "default" : "outline"}
                    onClick={() => setSelectedPeriod("monthly")}
                  >
                    Monthly
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedPeriod === "all_time" ? "default" : "outline"}
                    onClick={() => setSelectedPeriod("all_time")}
                  >
                    All Time
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <Card
                    key={entry.rank}
                    className={`p-4 ${
                      entry.user.name === "You"
                        ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/30"
                        : "bg-card border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12 h-12">
                        {entry.rank === 1 ? (
                          <Crown className="w-8 h-8 text-yellow-400" />
                        ) : entry.rank === 2 ? (
                          <Medal className="w-8 h-8 text-gray-400" />
                        ) : entry.rank === 3 ? (
                          <Medal className="w-8 h-8 text-orange-400" />
                        ) : (
                          <span className="text-2xl font-bold text-gray-500">#{entry.rank}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <img
                        src={entry.user.avatar}
                        alt={entry.user.name}
                        className="w-12 h-12 rounded-full border-2 border-zinc-700"
                      />

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{entry.user.name}</h3>
                          <Badge variant="outline">{entry.user.tier}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            {entry.achievements} achievements
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-4 h-4" />
                            {entry.streak} day streak
                          </span>
                        </div>
                      </div>

                      {/* Points */}
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-yellow-400 font-bold text-xl">
                          <Star className="w-5 h-5" />
                          <span>{entry.points.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mt-6 text-center">
                <Button variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Your Rank
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
