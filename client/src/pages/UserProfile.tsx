/**
 * USER PROFILE & SOCIAL COMMERCE
 * Complete social shopping experience with user profiles, activity feeds,
 * following system, collections, and social proof
 */

import { useState } from 'react';
import { useParams } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  MapPin,
  Link as LinkIcon,
  Instagram,
  Twitter,
  Youtube,
  ShoppingBag,
  Heart,
  Star,
  Users,
  Grid,
  List,
  Share2,
  MoreHorizontal,
  CheckCircle,
  Award,
  TrendingUp,
  MessageCircle,
} from 'lucide-react';

export default function UserProfile() {
  const { userId } = useParams();
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');

  // Mock user profile data
  const profile = {
    userId: userId || 'user_123',
    username: 'techsavvy_sarah',
    displayName: 'Sarah Mitchell',
    bio: 'Tech enthusiast | Gadget reviewer | Sharing my favorite finds 🛍️✨',
    avatar: '/placeholder-avatar.jpg',
    coverImage: '/placeholder-cover.jpg',
    location: 'San Francisco, CA',
    website: 'https://sarahtech.blog',
    socialLinks: {
      instagram: '@techsavvy_sarah',
      twitter: '@sarahtech',
      youtube: 'SarahTechReviews',
    },
    stats: {
      followers: 12543,
      following: 387,
      totalPurchases: 156,
      totalReviews: 89,
      wishlistItems: 23,
    },
    badges: ['Frequent Buyer', 'Top Reviewer', 'Influencer', 'Early Adopter'],
    joinedAt: new Date('2023-01-15'),
    isVerified: true,
    isInfluencer: true,
  };

  // Mock activity feed
  const activities = [
    {
      id: 'act_1',
      type: 'purchase' as const,
      content: 'Purchased Wireless Headphones Pro',
      metadata: { productId: 'prod_1', amount: 299.99 },
      timestamp: new Date(Date.now() - 3600000),
      likes: 15,
      comments: 3,
    },
    {
      id: 'act_2',
      type: 'review' as const,
      content: 'Reviewed Smart Watch Ultra - "Best purchase this year! The battery life is incredible and the health tracking features are spot on. Highly recommend!" ⭐⭐⭐⭐⭐',
      metadata: { productId: 'prod_2', rating: 5 },
      timestamp: new Date(Date.now() - 7200000),
      likes: 34,
      comments: 8,
    },
    {
      id: 'act_3',
      type: 'wishlist' as const,
      content: 'Added Bluetooth Speaker to wishlist',
      metadata: { productId: 'prod_3' },
      timestamp: new Date(Date.now() - 86400000),
      likes: 7,
      comments: 2,
    },
    {
      id: 'act_4',
      type: 'follow' as const,
      content: 'Started following @gadget_guru',
      metadata: { followingId: 'user_456' },
      timestamp: new Date(Date.now() - 172800000),
      likes: 5,
      comments: 0,
    },
  ];

  // Mock collections
  const collections = [
    {
      collectionId: 'col_1',
      name: 'My Tech Favorites',
      description: 'Best tech products I use daily',
      productCount: 8,
      isPublic: true,
      createdAt: new Date(Date.now() - 86400000 * 7),
      thumbnails: ['/placeholder.jpg', '/placeholder.jpg', '/placeholder.jpg'],
    },
    {
      collectionId: 'col_2',
      name: 'Gift Ideas 2024',
      description: 'Perfect gifts for friends and family',
      productCount: 12,
      isPublic: true,
      createdAt: new Date(Date.now() - 86400000 * 3),
      thumbnails: ['/placeholder.jpg', '/placeholder.jpg', '/placeholder.jpg'],
    },
  ];

  // Mock reviews
  const reviews = [
    {
      id: 'rev_1',
      productName: 'Wireless Headphones Pro',
      rating: 5,
      title: 'Amazing sound quality!',
      content: 'These headphones exceeded my expectations. The noise cancellation is top-notch and the battery lasts all day.',
      timestamp: new Date(Date.now() - 86400000 * 2),
      helpful: 45,
      images: ['/placeholder.jpg'],
    },
    {
      id: 'rev_2',
      productName: 'Smart Watch Ultra',
      rating: 5,
      title: 'Best purchase this year',
      content: 'The health tracking features are incredibly accurate. Love the design and build quality.',
      timestamp: new Date(Date.now() - 86400000 * 5),
      helpful: 67,
      images: [],
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <ShoppingBag className="w-5 h-5 text-green-500" />;
      case 'review': return <Star className="w-5 h-5 text-yellow-500" />;
      case 'wishlist': return <Heart className="w-5 h-5 text-red-500" />;
      case 'follow': return <Users className="w-5 h-5 text-blue-500" />;
      default: return <User className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="container mx-auto px-4">
        {/* Profile Header */}
        <div className="relative -mt-32 mb-8">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 p-1">
                  <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                </div>
                {profile.isVerified && (
                  <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-3xl font-bold">{profile.displayName}</h1>
                      {profile.isInfluencer && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                          <Award className="w-3 h-3 mr-1" />
                          Influencer
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">@{profile.username}</p>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{profile.bio}</p>
                    
                    {/* Location & Links */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {profile.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {profile.location}
                        </div>
                      )}
                      {profile.website && (
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-purple-600">
                          <LinkIcon className="w-4 h-4" />
                          {profile.website.replace('https://', '')}
                        </a>
                      )}
                      <div className="flex items-center gap-3">
                        {profile.socialLinks.instagram && (
                          <Instagram className="w-4 h-4 hover:text-purple-600 cursor-pointer" />
                        )}
                        {profile.socialLinks.twitter && (
                          <Twitter className="w-4 h-4 hover:text-blue-500 cursor-pointer" />
                        )}
                        {profile.socialLinks.youtube && (
                          <Youtube className="w-4 h-4 hover:text-red-500 cursor-pointer" />
                        )}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {profile.badges.map((badge, idx) => (
                        <Badge key={idx} variant="secondary">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant={isFollowing ? 'outline' : 'default'}
                      onClick={() => setIsFollowing(!isFollowing)}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{profile.stats.followers.toLocaleString()}</p>
                    <p className="text-gray-600 dark:text-gray-400">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{profile.stats.following.toLocaleString()}</p>
                    <p className="text-gray-600 dark:text-gray-400">Following</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{profile.stats.totalPurchases}</p>
                    <p className="text-gray-600 dark:text-gray-400">Purchases</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{profile.stats.totalReviews}</p>
                    <p className="text-gray-600 dark:text-gray-400">Reviews</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="activity">
              <List className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <Star className="w-4 h-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="collections">
              <Grid className="w-4 h-4 mr-2" />
              Collections
            </TabsTrigger>
            <TabsTrigger value="wishlist">
              <Heart className="w-4 h-4 mr-2" />
              Wishlist
            </TabsTrigger>
          </TabsList>

          {/* Activity Feed */}
          <TabsContent value="activity" className="space-y-4">
            {activities.map((activity) => (
              <Card key={activity.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-gray-100 mb-2">{activity.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{new Date(activity.timestamp).toLocaleString()}</span>
                      <button className="flex items-center gap-1 hover:text-red-500">
                        <Heart className="w-4 h-4" />
                        {activity.likes}
                      </button>
                      <button className="flex items-center gap-1 hover:text-blue-500">
                        <MessageCircle className="w-4 h-4" />
                        {activity.comments}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews" className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{review.productName}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(review.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <h4 className="font-semibold mb-2">{review.title}</h4>
                <p className="text-gray-700 dark:text-gray-300 mb-4">{review.content}</p>
                {review.images.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {review.images.map((img, idx) => (
                      <div key={idx} className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <button className="flex items-center gap-1 hover:text-green-500">
                    <TrendingUp className="w-4 h-4" />
                    Helpful ({review.helpful})
                  </button>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Collections */}
          <TabsContent value="collections" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Card key={collection.collectionId} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="grid grid-cols-3 gap-1 h-48 bg-gray-200 dark:bg-gray-700">
                    {collection.thumbnails.map((thumb, idx) => (
                      <div key={idx} className="bg-gray-300 dark:bg-gray-600" />
                    ))}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{collection.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {collection.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {collection.productCount} items
                      </span>
                      {collection.isPublic && (
                        <Badge variant="secondary" className="text-xs">Public</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Wishlist */}
          <TabsContent value="wishlist" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, idx) => (
                <Card key={idx} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">Product Name</h3>
                    <p className="text-2xl font-bold text-purple-600 mb-3">$299.99</p>
                    <Button className="w-full">Add to Cart</Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
