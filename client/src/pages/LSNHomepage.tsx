/**
 * LSN HOMEPAGE V1 - Premium Dark Theme
 * 
 * Features:
 * - Hero section with live show countdown
 * - Featured live shows grid
 * - Upcoming schedule
 * - Top creators showcase
 * - Trending products "as seen live"
 * - Social proof and testimonials
 * - Trust badges and guarantees
 * - Newsletter signup
 * - Mobile-responsive design
 * - Real-time viewer counts
 * - Live status indicators
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Play,
  Users,
  Calendar,
  TrendingUp,
  Star,
  ShoppingBag,
  Clock,
  CheckCircle,
  Zap,
  Gift,
  Shield,
  Truck,
  RefreshCw,
  Heart,
  Eye,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LSNHomepage() {
  const [email, setEmail] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live shows
  const { data: liveShows, isLoading: liveLoading } = trpc.liveShows.getLive.useQuery();
  
  // Fetch upcoming shows
  const { data: upcomingShows, isLoading: upcomingLoading } = trpc.liveShows.getUpcoming.useQuery({
    limit: 6,
  });

  // Fetch top creators
  const { data: topCreators, isLoading: creatorsLoading } = trpc.creators.getLeaderboard.useQuery({
    metric: "revenue",
    period: "month",
    limit: 6,
  });

  // Fetch trending products
  const { data: trendingProducts, isLoading: productsLoading } = trpc.products.getTrending.useQuery({
    limit: 8,
  });

  // Newsletter signup
  const newsletterMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setEmail("");
      alert("Thanks for subscribing!");
    },
  });

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      newsletterMutation.mutate({ email });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="container relative z-10 py-20 md:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left: Hero content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-300">
                  Live Shopping Revolution
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                Shop Live.
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Save Big.
                </span>
              </h1>

              <p className="text-xl text-gray-300 leading-relaxed">
                Join thousands of shoppers discovering exclusive deals through live shopping shows.
                Real products, real people, real savings.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/live">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Live Now
                  </Button>
                </Link>
                <Link href="/browse-shows">
                  <Button size="lg" variant="outline" className="border-gray-700 hover:bg-gray-800">
                    Browse Shows
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-800">
                <div>
                  <div className="text-3xl font-bold text-purple-400">50K+</div>
                  <div className="text-sm text-gray-400">Active Viewers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-pink-400">200+</div>
                  <div className="text-sm text-gray-400">Live Shows Daily</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-400">$2M+</div>
                  <div className="text-sm text-gray-400">Saved This Month</div>
                </div>
              </div>
            </div>

            {/* Right: Featured live show or countdown */}
            <div className="relative">
              {liveLoading ? (
                <Skeleton className="h-[500px] w-full rounded-2xl" />
              ) : liveShows && liveShows.length > 0 ? (
                <LiveShowCard show={liveShows[0]} featured />
              ) : upcomingShows && upcomingShows.length > 0 ? (
                <NextShowCountdown show={upcomingShows[0]} currentTime={currentTime} />
              ) : (
                <div className="h-[500px] flex items-center justify-center bg-gray-900 rounded-2xl border border-gray-800">
                  <div className="text-center space-y-4">
                    <Calendar className="h-16 w-16 mx-auto text-gray-600" />
                    <p className="text-gray-400">No upcoming shows scheduled</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Live Now Section */}
      {liveShows && liveShows.length > 0 && (
        <section className="py-16 bg-gray-950/50">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">🔴 Live Now</h2>
                <p className="text-gray-400">Join the excitement - shop exclusive deals</p>
              </div>
              <Link href="/live">
                <Button variant="ghost" className="text-purple-400 hover:text-purple-300">
                  View All
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {liveShows.slice(0, 3).map((show: any) => (
                <LiveShowCard key={show.id} show={show} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Shows Section */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">📅 Upcoming Shows</h2>
              <p className="text-gray-400">Mark your calendar for these exclusive events</p>
            </div>
            <Link href="/browse-shows">
              <Button variant="ghost" className="text-purple-400 hover:text-purple-300">
                Full Schedule
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {upcomingLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingShows?.slice(0, 6).map((show: any) => (
                <UpcomingShowCard key={show.id} show={show} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Creators Section */}
      <section className="py-16 bg-gray-950/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">⭐ Top Creators</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Meet our star hosts bringing you the best deals and entertainment
            </p>
          </div>

          {creatorsLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {topCreators?.map((creator: any) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trending Products Section */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">🔥 As Seen Live</h2>
              <p className="text-gray-400">Trending products from recent shows</p>
            </div>
            <Link href="/products">
              <Button variant="ghost" className="text-purple-400 hover:text-purple-300">
                Shop All
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {trendingProducts?.slice(0, 8).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-gradient-to-br from-purple-950/30 to-pink-950/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Shop With Us?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Your satisfaction is our priority
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <TrustCard
              icon={<Shield className="h-8 w-8 text-purple-400" />}
              title="Secure Payments"
              description="100% secure checkout with buyer protection"
            />
            <TrustCard
              icon={<Truck className="h-8 w-8 text-blue-400" />}
              title="Fast Shipping"
              description="Free shipping on orders over $50"
            />
            <TrustCard
              icon={<RefreshCw className="h-8 w-8 text-green-400" />}
              title="Easy Returns"
              description="30-day hassle-free return policy"
            />
            <TrustCard
              icon={<CheckCircle className="h-8 w-8 text-pink-400" />}
              title="Quality Guaranteed"
              description="Authentic products, verified quality"
            />
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-2xl p-12">
              <Gift className="h-12 w-12 mx-auto mb-6 text-purple-400" />
              <h2 className="text-3xl font-bold mb-4">Never Miss a Deal</h2>
              <p className="text-gray-300 mb-8">
                Get exclusive show alerts, early access, and special discounts delivered to your inbox
              </p>

              <form onSubmit={handleNewsletterSubmit} className="flex gap-4 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                  required
                />
                <Button
                  type="submit"
                  disabled={newsletterMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {newsletterMutation.isPending ? "Subscribing..." : "Subscribe"}
                </Button>
              </form>

              <p className="text-xs text-gray-500 mt-4">
                By subscribing, you agree to our Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-gray-950/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Shoppers Say</h2>
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-current" />
              ))}
              <span className="ml-2 text-gray-300">4.9 out of 5 (12,450 reviews)</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <TestimonialCard
              name="Sarah M."
              avatar="/avatars/sarah.jpg"
              rating={5}
              text="I've saved over $500 in the past month! The live shows are so fun and the deals are incredible."
            />
            <TestimonialCard
              name="Mike T."
              avatar="/avatars/mike.jpg"
              rating={5}
              text="Best shopping experience ever. The hosts are knowledgeable and the products are top quality."
            />
            <TestimonialCard
              name="Jessica L."
              avatar="/avatars/jessica.jpg"
              rating={5}
              text="I'm addicted! Every show has something amazing. Fast shipping and great customer service too."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// COMPONENT: Live Show Card
// ============================================================================

function LiveShowCard({ show, featured = false }: { show: any; featured?: boolean }) {
  return (
    <Link href={`/live/${show.id}`}>
      <Card className={cn(
        "group relative overflow-hidden border-gray-800 bg-gray-900 hover:border-purple-500/50 transition-all duration-300 cursor-pointer",
        featured && "h-[500px]"
      )}>
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={show.thumbnailUrl || "/placeholder-show.jpg"}
            alt={show.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Live badge */}
          <div className="absolute top-4 left-4">
            <Badge className="bg-red-600 text-white animate-pulse">
              <div className="h-2 w-2 bg-white rounded-full mr-2" />
              LIVE
            </Badge>
          </div>

          {/* Viewer count */}
          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
            <Eye className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium">{show.viewerCount?.toLocaleString() || 0}</span>
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
        </div>

        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="h-12 w-12 border-2 border-purple-500">
              <AvatarImage src={show.creator?.avatarUrl} />
              <AvatarFallback>{show.creator?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg mb-1 truncate group-hover:text-purple-400 transition-colors">
                {show.title}
              </h3>
              <p className="text-sm text-gray-400">{show.creator?.name}</p>
            </div>
          </div>

          {featured && show.description && (
            <p className="text-gray-400 mb-4 line-clamp-2">{show.description}</p>
          )}

          {/* Pinned products */}
          {show.pinnedProducts && show.pinnedProducts.length > 0 && (
            <div className="flex gap-2 mb-4">
              {show.pinnedProducts.slice(0, 3).map((product: any) => (
                <div key={product.id} className="flex-1 bg-gray-800 rounded-lg p-2">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full aspect-square object-cover rounded mb-2"
                  />
                  <p className="text-xs truncate">{product.name}</p>
                  <p className="text-sm font-bold text-purple-400">${product.price}</p>
                </div>
              ))}
            </div>
          )}

          <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Play className="mr-2 h-4 w-4" />
            Watch Now
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================================================
// COMPONENT: Next Show Countdown
// ============================================================================

function NextShowCountdown({ show, currentTime }: { show: any; currentTime: Date }) {
  const startTime = new Date(show.scheduledStartTime);
  const diff = startTime.getTime() - currentTime.getTime();
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return (
    <Card className="h-[500px] border-gray-800 bg-gradient-to-br from-purple-950/50 to-pink-950/50 overflow-hidden">
      <CardContent className="p-8 h-full flex flex-col justify-center items-center text-center">
        <Clock className="h-16 w-16 text-purple-400 mb-6" />
        
        <h3 className="text-2xl font-bold mb-2">Next Show Starting Soon</h3>
        <p className="text-gray-400 mb-8">{show.title}</p>

        {/* Countdown */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="text-4xl font-bold text-purple-400">{days}</div>
            <div className="text-xs text-gray-500 uppercase">Days</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="text-4xl font-bold text-pink-400">{hours}</div>
            <div className="text-xs text-gray-500 uppercase">Hours</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="text-4xl font-bold text-blue-400">{minutes}</div>
            <div className="text-xs text-gray-500 uppercase">Minutes</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="text-4xl font-bold text-green-400">{seconds}</div>
            <div className="text-xs text-gray-500 uppercase">Seconds</div>
          </div>
        </div>

        {/* Creator */}
        <div className="flex items-center gap-3 mb-6">
          <Avatar className="h-12 w-12 border-2 border-purple-500">
            <AvatarImage src={show.creator?.avatarUrl} />
            <AvatarFallback>{show.creator?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-sm text-gray-400">Hosted by</p>
            <p className="font-semibold">{show.creator?.name}</p>
          </div>
        </div>

        <Link href={`/show/${show.id}`}>
          <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Calendar className="mr-2 h-5 w-5" />
            Set Reminder
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPONENT: Upcoming Show Card
// ============================================================================

function UpcomingShowCard({ show }: { show: any }) {
  const startTime = new Date(show.scheduledStartTime);

  return (
    <Link href={`/show/${show.id}`}>
      <Card className="group border-gray-800 bg-gray-900 hover:border-purple-500/50 transition-all duration-300 cursor-pointer overflow-hidden">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={show.thumbnailUrl || "/placeholder-show.jpg"}
            alt={show.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
          
          <div className="absolute bottom-4 left-4 right-4">
            <Badge className="bg-purple-600 mb-2">
              {startTime.toLocaleDateString()} at {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 border-2 border-purple-500">
              <AvatarImage src={show.creator?.avatarUrl} />
              <AvatarFallback>{show.creator?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold mb-1 truncate group-hover:text-purple-400 transition-colors">
                {show.title}
              </h3>
              <p className="text-sm text-gray-400">{show.creator?.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================================================
// COMPONENT: Creator Card
// ============================================================================

function CreatorCard({ creator }: { creator: any }) {
  return (
    <Link href={`/creator/${creator.id}`}>
      <Card className="group border-gray-800 bg-gray-900 hover:border-purple-500/50 transition-all duration-300 cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-purple-500">
              <AvatarImage src={creator.avatarUrl} />
              <AvatarFallback>{creator.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold truncate group-hover:text-purple-400 transition-colors">
                  {creator.name}
                </h3>
                {creator.verified && (
                  <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                )}
              </div>
              <Badge variant="outline" className="border-purple-500/50 text-purple-400 mb-3">
                {creator.tier}
              </Badge>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Total Shows</div>
                  <div className="font-semibold">{creator.totalShows}</div>
                </div>
                <div>
                  <div className="text-gray-400">Avg Viewers</div>
                  <div className="font-semibold">{creator.avgViewers?.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================================================
// COMPONENT: Product Card
// ============================================================================

function ProductCard({ product }: { product: any }) {
  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group border-gray-800 bg-gray-900 hover:border-purple-500/50 transition-all duration-300 cursor-pointer overflow-hidden">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={product.imageUrl || "/placeholder-product.jpg"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {product.discount && (
            <Badge className="absolute top-2 right-2 bg-red-600">
              -{product.discount}%
            </Badge>
          )}

          {product.seenLive && (
            <Badge className="absolute top-2 left-2 bg-purple-600">
              <Zap className="h-3 w-3 mr-1" />
              As Seen Live
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
            {product.name}
          </h3>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center text-yellow-400">
              <Star className="h-4 w-4 fill-current" />
              <span className="ml-1 text-sm">{product.rating}</span>
            </div>
            <span className="text-xs text-gray-500">({product.reviewCount})</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-purple-400">${product.price}</span>
              {product.compareAtPrice && (
                <span className="ml-2 text-sm text-gray-500 line-through">
                  ${product.compareAtPrice}
                </span>
              )}
            </div>
            <Button size="sm" variant="ghost" className="text-pink-400 hover:text-pink-300">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================================================
// COMPONENT: Trust Card
// ============================================================================

function TrustCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border-gray-800 bg-gray-900/50 text-center">
      <CardContent className="p-6">
        <div className="mb-4 flex justify-center">{icon}</div>
        <h3 className="font-bold mb-2">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPONENT: Testimonial Card
// ============================================================================

function TestimonialCard({ name, avatar, rating, text }: { name: string; avatar: string; rating: number; text: string }) {
  return (
    <Card className="border-gray-800 bg-gray-900">
      <CardContent className="p-6">
        <div className="flex items-center gap-1 text-yellow-400 mb-4">
          {[...Array(rating)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-current" />
          ))}
        </div>
        
        <p className="text-gray-300 mb-4">"{text}"</p>
        
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={avatar} />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-xs text-gray-500">Verified Buyer</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
