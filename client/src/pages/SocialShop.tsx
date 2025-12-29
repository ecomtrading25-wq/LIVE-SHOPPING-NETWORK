import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Instagram,
  Play,
  Heart,
  MessageCircle,
  Share2,
  ShoppingBag,
  Users,
  TrendingUp,
  Star,
  ExternalLink,
  Filter,
  Search,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Social Commerce Hub
 * Instagram/TikTok shop sync, influencer content, UGC gallery, shoppable tags
 */

interface SocialPost {
  id: string;
  platform: "instagram" | "tiktok";
  author: {
    username: string;
    avatar: string;
    verified: boolean;
    followers: number;
  };
  content: {
    type: "image" | "video";
    url: string;
    thumbnail?: string;
  };
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  products: TaggedProduct[];
  createdAt: string;
}

interface TaggedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  inStock: boolean;
  position: { x: number; y: number };
}

interface Influencer {
  id: string;
  username: string;
  avatar: string;
  verified: boolean;
  followers: number;
  category: string;
  totalSales: number;
  conversionRate: number;
}

export default function SocialShopPage() {
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<"all" | "instagram" | "tiktok">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock social posts
  const socialPosts: SocialPost[] = [
    {
      id: "1",
      platform: "instagram",
      author: {
        username: "fashionista_emma",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
        verified: true,
        followers: 245000,
      },
      content: {
        type: "image",
        url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800",
      },
      caption: "Obsessed with this new collection! 💕 Use code EMMA15 for 15% off #fashion #ootd",
      likes: 12450,
      comments: 342,
      shares: 89,
      products: [
        {
          id: "p1",
          name: "Designer Handbag",
          price: 299.99,
          image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200",
          inStock: true,
          position: { x: 60, y: 40 },
        },
        {
          id: "p2",
          name: "Sunglasses",
          price: 149.99,
          image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200",
          inStock: true,
          position: { x: 30, y: 25 },
        },
      ],
      createdAt: "2025-12-26T10:30:00Z",
    },
    {
      id: "2",
      platform: "tiktok",
      author: {
        username: "tech_reviewer_mike",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
        verified: true,
        followers: 892000,
      },
      content: {
        type: "video",
        url: "https://example.com/video.mp4",
        thumbnail: "https://images.unsplash.com/photo-1593642532842-98d0fd5ebc1a?w=800",
      },
      caption: "This gadget changed my life! 🔥 Link in bio #tech #gadgets #review",
      likes: 45230,
      comments: 1234,
      shares: 567,
      products: [
        {
          id: "p3",
          name: "Wireless Earbuds Pro",
          price: 89.99,
          image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200",
          inStock: true,
          position: { x: 50, y: 50 },
        },
      ],
      createdAt: "2025-12-25T15:45:00Z",
    },
    {
      id: "3",
      platform: "instagram",
      author: {
        username: "home_decor_sarah",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
        verified: false,
        followers: 67000,
      },
      content: {
        type: "image",
        url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800",
      },
      caption: "Transform your living space with these amazing finds! 🏡✨ #homedecor #interior",
      likes: 8920,
      comments: 234,
      shares: 45,
      products: [
        {
          id: "p4",
          name: "Modern Sofa",
          price: 1299.99,
          image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200",
          inStock: true,
          position: { x: 50, y: 60 },
        },
        {
          id: "p5",
          name: "Coffee Table",
          price: 449.99,
          image: "https://images.unsplash.com/photo-1565191999001-551c187427bb?w=200",
          inStock: false,
          position: { x: 50, y: 80 },
        },
      ],
      createdAt: "2025-12-24T12:20:00Z",
    },
  ];

  // Mock influencers
  const topInfluencers: Influencer[] = [
    {
      id: "1",
      username: "fashionista_emma",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
      verified: true,
      followers: 245000,
      category: "Fashion",
      totalSales: 45230,
      conversionRate: 4.8,
    },
    {
      id: "2",
      username: "tech_reviewer_mike",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
      verified: true,
      followers: 892000,
      category: "Tech",
      totalSales: 123450,
      conversionRate: 6.2,
    },
    {
      id: "3",
      username: "home_decor_sarah",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
      verified: false,
      followers: 67000,
      category: "Home & Living",
      totalSales: 28900,
      conversionRate: 3.9,
    },
  ];

  const filteredPosts = socialPosts.filter(post => {
    const matchesPlatform = filterPlatform === "all" || post.platform === filterPlatform;
    const matchesSearch = searchQuery === "" || 
      post.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const handleProductClick = (product: TaggedProduct) => {
    toast.success(`${product.name} added to cart!`);
  };

  const handleBuyFromPost = () => {
    toast.success("Redirecting to one-tap checkout...");
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">Social Shop</h1>
          <p className="text-muted-foreground text-xl mb-8">
            Shop directly from your favorite influencers on Instagram & TikTok
          </p>

          {/* Search & Filter */}
          <div className="max-w-2xl mx-auto flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts, influencers, products..."
                className="pl-10 bg-white/10 border-white/20 text-foreground placeholder:text-gray-400"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Platform Tabs */}
        <Tabs value={filterPlatform} onValueChange={(v) => setFilterPlatform(v as any)} className="mb-8">
          <TabsList className="bg-white/5 border border-white/10 mx-auto">
            <TabsTrigger value="all">All Posts</TabsTrigger>
            <TabsTrigger value="instagram">
              <Instagram className="w-4 h-4 mr-2" />
              Instagram
            </TabsTrigger>
            <TabsTrigger value="tiktok">
              <Play className="w-4 h-4 mr-2" />
              TikTok
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Social Feed */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <Card
                  key={post.id}
                  className="overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
                  onClick={() => setSelectedPost(post)}
                >
                  {/* Post Image/Video */}
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={post.content.type === "video" ? post.content.thumbnail : post.content.url}
                      alt={post.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    
                    {/* Platform Badge */}
                    <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur text-foreground">
                      {post.platform === "instagram" ? (
                        <Instagram className="w-3 h-3 mr-1" />
                      ) : (
                        <Play className="w-3 h-3 mr-1" />
                      )}
                      {post.platform}
                    </Badge>

                    {/* Video Indicator */}
                    {post.content.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-background/60 backdrop-blur rounded-full flex items-center justify-center text-foreground">
                          <Play className="w-8 h-8 text-foreground" />
                        </div>
                      </div>
                    )}

                    {/* Product Tags */}
                    {post.products.map((product) => (
                      <button
                        key={product.id}
                        className="absolute w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        style={{ left: `${product.position.x}%`, top: `${product.position.y}%` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(product);
                        }}
                      >
                        <ShoppingBag className="w-4 h-4 text-purple-600" />
                      </button>
                    ))}

                    {/* Engagement Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-4 text-foreground text-sm">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {formatNumber(post.likes)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {formatNumber(post.comments)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Share2 className="w-4 h-4" />
                          {formatNumber(post.shares)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={post.author.avatar}
                        alt={post.author.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-foreground font-semibold text-sm">@{post.author.username}</p>
                          {post.author.verified && (
                            <Badge className="bg-blue-500/20 text-blue-400 text-xs px-1 py-0">
                              ✓
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs">{formatNumber(post.author.followers)} followers</p>
                      </div>
                    </div>

                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{post.caption}</p>

                    {/* Tagged Products */}
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-400 text-sm font-medium">
                        {post.products.length} {post.products.length === 1 ? "product" : "products"}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyFromPost();
                      }}
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Shop This Post
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Influencers */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                Top Influencers
              </h2>
              <div className="space-y-4">
                {topInfluencers.map((influencer, index) => (
                  <div key={influencer.id} className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={influencer.avatar}
                        alt={influencer.username}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="absolute -top-1 -left-1 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-foreground text-xs font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-foreground font-semibold text-sm">@{influencer.username}</p>
                        {influencer.verified && (
                          <Badge className="bg-blue-500/20 text-blue-400 text-xs px-1 py-0">
                            ✓
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs">{influencer.category}</p>
                      <p className="text-purple-400 text-xs font-medium">
                        ${formatNumber(influencer.totalSales)} sales
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Social Proof */}
            <Card className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
              <h3 className="text-xl font-bold text-foreground mb-4">Social Shopping Stats</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground text-sm">Total Posts</span>
                    <span className="text-foreground font-bold">12,456</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground text-sm">Products Tagged</span>
                    <span className="text-foreground font-bold">34,892</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground text-sm">Total Engagement</span>
                    <span className="text-foreground font-bold">2.4M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Conversion Rate</span>
                    <span className="text-green-400 font-bold">5.2%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Features */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-xl font-bold text-foreground mb-4">Features</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2 text-muted-foreground">
                  <ShoppingBag className="w-4 h-4 text-purple-400 mt-0.5" />
                  <span>One-tap checkout from posts</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Tag className="w-4 h-4 text-purple-400 mt-0.5" />
                  <span>Interactive product tags</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Users className="w-4 h-4 text-purple-400 mt-0.5" />
                  <span>Follow your favorite creators</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Star className="w-4 h-4 text-purple-400 mt-0.5" />
                  <span>Exclusive influencer discounts</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <ExternalLink className="w-4 h-4 text-purple-400 mt-0.5" />
                  <span>Direct Instagram/TikTok sync</span>
                </li>
              </ul>
            </Card>

            {/* Become an Influencer */}
            <Card className="p-6 bg-gradient-to-br from-purple-600 to-pink-600 border-0">
              <h3 className="text-xl font-bold text-foreground mb-3">Become an Influencer</h3>
              <p className="text-white/90 text-sm mb-4">
                Earn commission by sharing products with your followers
              </p>
              <Button className="w-full bg-white text-purple-600 hover:bg-gray-100">
                Apply Now
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
