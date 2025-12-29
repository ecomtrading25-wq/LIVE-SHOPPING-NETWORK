import { useState } from 'react';
import { Trophy, Gift, Star, Zap, Crown, TrendingUp, Calendar, Award, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'freeShipping' | 'product' | 'cashback';
  value: number;
  imageUrl?: string;
  expiresAt?: Date;
  available: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  pointsReward: number;
  unlocked: boolean;
}

export default function LoyaltyRewardsPage() {
  const { toast } = useToast();
  const [selectedReward, setSelectedReward] = useState<string | null>(null);

  // Fetch user loyalty data
  const { data: loyaltyData, refetch } = trpc.loyalty.getUserLoyaltyData.useQuery();

  // Fetch available rewards
  const { data: rewards } = trpc.loyalty.getAvailableRewards.useQuery();

  // Fetch achievements
  const { data: achievements } = trpc.loyalty.getUserAchievements.useQuery();

  // Fetch transaction history
  const { data: transactions } = trpc.loyalty.getPointsHistory.useQuery();

  // Redeem reward mutation
  const redeemReward = trpc.loyalty.redeemReward.useMutation({
    onSuccess: () => {
      toast({ title: 'Reward redeemed!', description: 'Check your account for the reward.' });
      refetch();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getTierIcon = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'bronze':
        return <Award className="w-8 h-8 text-orange-600" />;
      case 'silver':
        return <Star className="w-8 h-8 text-gray-400" />;
      case 'gold':
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 'platinum':
        return <Crown className="w-8 h-8 text-red-500" />;
      default:
        return <Star className="w-8 h-8 text-gray-400" />;
    }
  };

  const getTierColor = (tier: string): string => {
    switch (tier?.toLowerCase()) {
      case 'bronze':
        return 'from-orange-600 to-orange-800';
      case 'silver':
        return 'from-gray-400 to-gray-600';
      case 'gold':
        return 'from-yellow-500 to-yellow-700';
      case 'platinum':
        return 'from-red-500 to-red-700';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return <Gift className="w-6 h-6" />;
      case 'freeShipping':
        return <Zap className="w-6 h-6" />;
      case 'product':
        return <Sparkles className="w-6 h-6" />;
      case 'cashback':
        return <TrendingUp className="w-6 h-6" />;
      default:
        return <Gift className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Loyalty Rewards</h1>
          <p className="text-muted-foreground">Earn points, unlock rewards, and level up your shopping experience</p>
        </div>

        {/* Tier Status Card */}
        <Card className={`bg-gradient-to-r ${getTierColor(loyaltyData?.tier || 'bronze')} border-0 mb-8`}>
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {getTierIcon(loyaltyData?.tier || 'bronze')}
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    {loyaltyData?.tier?.toUpperCase() || 'BRONZE'} MEMBER
                  </h2>
                  <p className="text-white/80 text-lg">
                    {loyaltyData?.points?.toLocaleString() || 0} Points Available
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm mb-2">Next Tier Progress</p>
                <Progress
                  value={loyaltyData?.nextTierProgress || 0}
                  className="w-48 h-3 mb-2"
                />
                <p className="text-foreground text-sm">
                  {loyaltyData?.pointsToNextTier || 0} points to {loyaltyData?.nextTier || 'SILVER'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-background text-foreground/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Points Earned</p>
                  <p className="text-3xl font-bold text-foreground">
                    {loyaltyData?.totalPointsEarned?.toLocaleString() || 0}
                  </p>
                </div>
                <Star className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background text-foreground/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Rewards Redeemed</p>
                  <p className="text-3xl font-bold text-foreground">
                    {loyaltyData?.rewardsRedeemed || 0}
                  </p>
                </div>
                <Gift className="w-8 h-8 text-pink-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background text-foreground/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Achievements</p>
                  <p className="text-3xl font-bold text-foreground">
                    {achievements?.filter((a) => a.unlocked).length || 0}/{achievements?.length || 0}
                  </p>
                </div>
                <Trophy className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background text-foreground/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Member Since</p>
                  <p className="text-xl font-bold text-foreground">
                    {loyaltyData?.memberSince
                      ? new Date(loyaltyData.memberSince).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList className="bg-background text-foreground/10 backdrop-blur border-white/20">
            <TabsTrigger value="rewards">Available Rewards</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="history">Points History</TabsTrigger>
            <TabsTrigger value="benefits">Tier Benefits</TabsTrigger>
          </TabsList>

          {/* Available Rewards */}
          <TabsContent value="rewards" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards?.map((reward: Reward) => (
                <Card
                  key={reward.id}
                  className={`bg-background text-foreground/10 backdrop-blur border-white/20 overflow-hidden ${
                    !reward.available ? 'opacity-50' : ''
                  }`}
                >
                  <div className="relative h-48 bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
                    {reward.imageUrl ? (
                      <img src={reward.imageUrl} alt={reward.name} className="w-full h-full object-cover" />
                    ) : (
                      getRewardIcon(reward.type)
                    )}
                    {!reward.available && (
                      <Badge className="absolute top-2 right-2 bg-red-500">Out of Stock</Badge>
                    )}
                  </div>

                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{reward.name}</h3>
                      <p className="text-gray-400 text-sm">{reward.description}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-400" />
                        <span className="text-2xl font-bold text-foreground">
                          {reward.pointsCost.toLocaleString()}
                        </span>
                        <span className="text-gray-400 text-sm">points</span>
                      </div>
                      {reward.type === 'discount' && (
                        <Badge className="bg-green-500/20 text-green-400">
                          {reward.value}% OFF
                        </Badge>
                      )}
                      {reward.type === 'cashback' && (
                        <Badge className="bg-blue-500/20 text-blue-400">
                          ${reward.value} Back
                        </Badge>
                      )}
                    </div>

                    {reward.expiresAt && (
                      <p className="text-xs text-gray-500">
                        Expires: {new Date(reward.expiresAt).toLocaleDateString()}
                      </p>
                    )}

                    <Button
                      className="w-full"
                      disabled={
                        !reward.available ||
                        (loyaltyData?.points || 0) < reward.pointsCost ||
                        redeemReward.isPending
                      }
                      onClick={() => redeemReward.mutate({ rewardId: reward.id })}
                    >
                      {(loyaltyData?.points || 0) < reward.pointsCost
                        ? `Need ${reward.pointsCost - (loyaltyData?.points || 0)} more points`
                        : 'Redeem'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Achievements */}
          <TabsContent value="achievements" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements?.map((achievement: Achievement) => (
                <Card
                  key={achievement.id}
                  className={`bg-background text-foreground/10 backdrop-blur border-white/20 ${
                    achievement.unlocked ? 'border-yellow-500/50' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
                          achievement.unlocked ? 'bg-yellow-500/20' : 'bg-gray-500/20'
                        }`}
                      >
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-foreground">{achievement.name}</h3>
                          {achievement.unlocked && (
                            <Badge className="bg-yellow-500/20 text-yellow-400">
                              <Trophy className="w-3 h-3 mr-1" />
                              Unlocked
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-3">{achievement.description}</p>

                        {!achievement.unlocked && (
                          <>
                            <Progress
                              value={(achievement.progress / achievement.target) * 100}
                              className="mb-2"
                            />
                            <p className="text-xs text-gray-500">
                              {achievement.progress} / {achievement.target}
                            </p>
                          </>
                        )}

                        <div className="flex items-center gap-2 mt-3">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-foreground font-semibold">
                            +{achievement.pointsReward} points
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Points History */}
          <TabsContent value="history" className="space-y-4">
            <Card className="bg-background text-foreground/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-foreground">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions?.map((transaction: any) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-background text-foreground/5 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'earned'
                              ? 'bg-green-500/20'
                              : 'bg-red-500/20'
                          }`}
                        >
                          {transaction.type === 'earned' ? (
                            <TrendingUp className="w-5 h-5 text-green-400" />
                          ) : (
                            <Gift className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-foreground font-semibold">{transaction.description}</p>
                          <p className="text-gray-400 text-sm">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-xl font-bold ${
                            transaction.type === 'earned' ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {transaction.type === 'earned' ? '+' : '-'}
                          {transaction.points}
                        </p>
                        <p className="text-gray-400 text-sm">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tier Benefits */}
          <TabsContent value="benefits" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {['Bronze', 'Silver', 'Gold', 'Platinum'].map((tier) => (
                <Card
                  key={tier}
                  className={`bg-gradient-to-br ${getTierColor(tier)} border-0 ${
                    loyaltyData?.tier?.toLowerCase() === tier.toLowerCase()
                      ? 'ring-4 ring-white/50'
                      : ''
                  }`}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="text-center">
                      {getTierIcon(tier)}
                      <h3 className="text-2xl font-bold text-foreground mt-2">{tier}</h3>
                      {loyaltyData?.tier?.toLowerCase() === tier.toLowerCase() && (
                        <Badge className="mt-2 bg-background/20 text-foreground">Current Tier</Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-white/90 text-sm">
                      <p>✓ {tier === 'Bronze' ? '1x' : tier === 'Silver' ? '1.5x' : tier === 'Gold' ? '2x' : '3x'} Points</p>
                      <p>✓ {tier === 'Bronze' ? 'Standard' : tier === 'Silver' ? 'Priority' : tier === 'Gold' ? 'Express' : 'VIP'} Support</p>
                      {tier !== 'Bronze' && <p>✓ Exclusive Rewards</p>}
                      {(tier === 'Gold' || tier === 'Platinum') && <p>✓ Free Shipping</p>}
                      {tier === 'Platinum' && <p>✓ Early Access</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
