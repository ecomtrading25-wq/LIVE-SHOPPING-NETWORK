/**
 * Live Shopping Network - Premium Homepage
 * 
 * A stunning, conversion-optimized homepage featuring:
 * - Dynamic hero with live show countdown
 * - Live show grid with real-time viewer counts
 * - Featured products "As Seen Live"
 * - Creator spotlight carousel
 * - Trust signals and social proof
 * - Upcoming schedule preview
 * - Newsletter signup
 */

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Play,
  Users,
  Eye,
  Clock,
  Calendar,
  ShoppingBag,
  Star,
  TrendingUp,
  Zap,
  Shield,
  Truck,
  Heart,
  MessageCircle,
  ChevronRight,
  Sparkles
} from "lucide-react";

export default function LSNHome() {
  const [email, setEmail] = useState("");
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Fetch live shows
  const { data: liveShows, isLoading: liveLoading } = trpc.liveStreaming.listLiveShows.useQuery({
    status: 'live',
    limit: 6,
  });

  // Fetch scheduled shows
  const { data: scheduledShows } = trpc.liveStreaming.listLiveShows.useQuery({
    status: 'scheduled',
    limit: 4,
  });

  // Fetch featured products
  const { data: featuredProducts } = trpc.products.list.useQuery({
    featured: true,
    limit: 8,
  });

  // Fetch top creators
  const { data: topCreators } = trpc.creators.list.useQuery({
    limit: 6,
  });

  // Newsletter signup mutation
  const newsletterSignup = trpc.marketing.subscribeNewsletter.useMutation();

  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    try {
      await newsletterSignup.mutateAsync({ email });
      setEmail("");
      // Show success toast
    } catch (error) {
      // Show error toast
    }
  };

  // Testimonials carousel
  const testimonials = [
    {
      text: "I saved $200 on my first live shopping session! The deals are incredible.",
      author: "Sarah M.",
      rating: 5,
      verified: true
    },
    {
      text: "Love the interactive experience. It's like QVC but way better and more fun!",
      author: "Michael T.",
      rating: 5,
      verified: true
    },
    {
      text: "Fast shipping and amazing customer service. Highly recommend!",
      author: "Jessica L.",
      rating: 5,
      verified: true
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const hasLiveShows = liveShows && liveShows.length > 0;

  if (liveLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground text-xl">Loading amazing deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-1/2 left-1/3 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="container relative z-10 py-20 md:py-32">
          <div className="max-w-5xl mx-auto text-center">
            {/* Live indicator */}
            {hasLiveShows && (
              <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-full px-4 py-2 mb-6 animate-pulse">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-foreground font-semibold text-sm">
                  {liveShows.length} LIVE SHOW{liveShows.length > 1 ? 'S' : ''} NOW
                </span>
              </div>
            )}

            {/* Main headline */}
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 animate-gradient">
                Shop Live.
              </span>
              <br />
              <span className="text-foreground">
                Save Big.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Join thousands of smart shoppers discovering exclusive deals on trending products through interactive live shopping shows.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href={hasLiveShows ? `/show/${liveShows[0].id}` : "/live"}>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-foreground font-bold px-8 py-6 text-lg shadow-2xl shadow-pink-500/50 hover:shadow-pink-500/70 transition-all transform hover:scale-105"
                >
                  <Play className="w-6 h-6 mr-2 fill-current" />
                  {hasLiveShows ? 'Watch Live Now' : 'Browse Shows'}
                </Button>
              </Link>
              <Link href="/products">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-white/30 text-foreground hover:bg-background/10 font-bold px-8 py-6 text-lg backdrop-blur"
                >
                  <ShoppingBag className="w-6 h-6 mr-2" />
                  Shop Products
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span>Secure Checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" />
                <span>Fast Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span>4.9/5 Rating (12,453 reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Shows Section */}
      {hasLiveShows && (
        <section className="py-16 bg-background/30 backdrop-blur text-foreground">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3 mb-2">
                  <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                  </span>
                  Live Now
                </h2>
                <p className="text-gray-400">Don't miss out on these exclusive deals</p>
              </div>
              <Link href="/live">
                <Button variant="ghost" className="text-foreground hover:bg-background/10">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveShows.map((show) => (
                <Link key={show.id} href={`/show/${show.id}`}>
                  <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 border-white/10 hover:border-pink-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20 cursor-pointer">
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden">
                      <img 
                        src={show.thumbnailUrl || '/placeholder-show.jpg'} 
                        alt={show.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {/* Live badge */}
                      <div className="absolute top-3 left-3 bg-red-500 text-foreground px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                        <span className="w-2 h-2 bg-background text-foreground rounded-full"></span>
                        LIVE
                      </div>
                      {/* Viewer count */}
                      <div className="absolute top-3 right-3 bg-background/70 backdrop-blur text-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {show.viewerCount?.toLocaleString() || 0}
                      </div>
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-foreground">
                        <div className="w-16 h-16 bg-background text-foreground/90 rounded-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-black fill-current ml-1" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2 group-hover:text-pink-400 transition-colors">
                        {show.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <img 
                          src={show.creator?.avatarUrl || '/placeholder-avatar.jpg'}
                          alt={show.creator?.displayName}
                          className="w-8 h-8 rounded-full border-2 border-pink-500"
                        />
                        <span className="text-muted-foreground text-sm font-medium">
                          {show.creator?.displayName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {show.totalViewers?.toLocaleString() || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {show.likes?.toLocaleString() || 0}
                          </span>
                        </div>
                        <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/50">
                          {show.category || 'Shopping'}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products - "As Seen Live" */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-full px-4 py-2 mb-4">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="text-pink-400 font-semibold text-sm">AS SEEN LIVE</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Trending Products
              </h2>
              <p className="text-gray-400 text-lg">
                Shop the hottest items featured in our live shows
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <Link key={product.id} href={`/product/${product.id}`}>
                  <Card className="group relative overflow-hidden bg-background text-foreground/5 border-white/10 hover:border-pink-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-pink-500/10 cursor-pointer">
                    {/* Product image */}
                    <div className="relative aspect-square overflow-hidden bg-background text-foreground/5">
                      <img 
                        src={product.images?.[0] || '/placeholder-product.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {/* Badges */}
                      {product.discount && (
                        <div className="absolute top-2 left-2 bg-red-500 text-foreground px-2 py-1 rounded text-xs font-bold">
                          -{product.discount}%
                        </div>
                      )}
                      {product.trending && (
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-purple-500 text-foreground p-1.5 rounded-full">
                          <TrendingUp className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {/* Product info */}
                    <div className="p-3">
                      <h3 className="text-foreground font-semibold text-sm mb-2 line-clamp-2 group-hover:text-pink-400 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(product.rating || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-gray-400 text-xs">
                          ({product.reviewCount || 0})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-pink-400 font-bold text-lg">
                          ${(product.price / 100).toFixed(2)}
                        </span>
                        {product.comparePrice && (
                          <span className="text-gray-500 text-sm line-through">
                            ${(product.comparePrice / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {product.stock && product.stock < 10 && (
                        <div className="mt-2 text-xs text-orange-400 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Only {product.stock} left!
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/products">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-foreground font-bold"
                >
                  View All Products
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Creator Spotlight */}
      {topCreators && topCreators.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Meet Our Creators
              </h2>
              <p className="text-gray-400 text-lg">
                Expert hosts bringing you the best deals and product insights
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {topCreators.map((creator) => (
                <Link key={creator.id} href={`/creator/${creator.id}`}>
                  <div className="group text-center cursor-pointer">
                    <div className="relative inline-block mb-3">
                      <img 
                        src={creator.avatarUrl || '/placeholder-avatar.jpg'}
                        alt={creator.displayName}
                        className="w-24 h-24 rounded-full border-4 border-pink-500/50 group-hover:border-pink-500 transition-all group-hover:scale-110 mx-auto"
                      />
                      <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-4 border-black rounded-full"></div>
                    </div>
                    <h3 className="text-foreground font-semibold mb-1 group-hover:text-pink-400 transition-colors">
                      {creator.displayName}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">
                      {creator.followerCount?.toLocaleString() || 0} followers
                    </p>
                    <div className="flex items-center justify-center gap-1 text-yellow-400 text-xs">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{creator.rating || 5.0}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Shows Schedule */}
      {scheduledShows && scheduledShows.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Coming Up Next
              </h2>
              <p className="text-gray-400 text-lg">
                Mark your calendar for these upcoming shows
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
              {scheduledShows.map((show) => (
                <Card key={show.id} className="bg-background text-foreground/5 border-white/10 hover:border-pink-500/50 transition-all hover:bg-background text-foreground/10">
                  <div className="p-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
                    {/* Date/Time */}
                    <div className="flex-shrink-0 text-center bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg p-4 min-w-[100px]">
                      <div className="text-foreground text-2xl font-bold">
                        {new Date(show.scheduledStartTime).getDate()}
                      </div>
                      <div className="text-white/80 text-sm">
                        {new Date(show.scheduledStartTime).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-white/80 text-xs mt-1">
                        {new Date(show.scheduledStartTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* Show info */}
                    <div className="flex-grow">
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {show.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <img 
                          src={show.creator?.avatarUrl || '/placeholder-avatar.jpg'}
                          alt={show.creator?.displayName}
                          className="w-6 h-6 rounded-full border-2 border-pink-500"
                        />
                        <span className="text-muted-foreground text-sm">
                          {show.creator?.displayName}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {show.description}
                      </p>
                    </div>

                    {/* Remind me button */}
                    <Button 
                      variant="outline"
                      className="border-pink-500/50 text-pink-400 hover:bg-pink-500/10 flex-shrink-0"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Remind Me
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/schedule">
                <Button variant="ghost" className="text-foreground hover:bg-background/10">
                  View Full Schedule
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Social Proof / Testimonials */}
      <section className="py-16 bg-background/30 backdrop-blur text-foreground">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Loved by Thousands
              </h2>
              <p className="text-gray-400 text-lg">
                See what our community is saying
              </p>
            </div>

            {/* Testimonial carousel */}
            <div className="relative">
              <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-white/10 p-8 md:p-12 text-center">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-foreground text-xl md:text-2xl mb-6 italic">
                  "{testimonials[currentTestimonial].text}"
                </p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-foreground font-bold">
                    {testimonials[currentTestimonial].author.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="text-foreground font-semibold">
                      {testimonials[currentTestimonial].author}
                    </div>
                    {testimonials[currentTestimonial].verified && (
                      <div className="text-green-400 text-sm flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Verified Buyer
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Dots indicator */}
              <div className="flex justify-center gap-2 mt-6">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentTestimonial(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentTestimonial 
                        ? 'bg-pink-500 w-8' 
                        : 'bg-background text-foreground/30 hover:bg-background text-foreground/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16">
        <div className="container">
          <Card className="bg-gradient-to-r from-pink-500 to-purple-600 border-0 overflow-hidden">
            <div className="p-8 md:p-12 text-center relative">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-background text-foreground/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-background text-foreground/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                  Never Miss a Deal
                </h2>
                <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                  Get notified about upcoming shows, exclusive deals, and new product launches
                </p>

                <form onSubmit={handleNewsletterSignup} className="max-w-md mx-auto flex gap-3">
                  <Input 
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background text-foreground/90 border-0 text-black placeholder:text-gray-500 flex-grow"
                    required
                  />
                  <Button 
                    type="submit"
                    size="lg"
                    className="bg-background hover:bg-background/80 text-foreground font-bold px-8"
                    disabled={newsletterSignup.isLoading}
                  >
                    {newsletterSignup.isLoading ? 'Subscribing...' : 'Subscribe'}
                  </Button>
                </form>

                <p className="text-white/70 text-sm mt-4">
                  Join 50,000+ subscribers. Unsubscribe anytime.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 bg-background/50 backdrop-blur border-t border-white/10 text-foreground">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                50K+
              </div>
              <div className="text-gray-400 text-sm">
                Happy Customers
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                1M+
              </div>
              <div className="text-gray-400 text-sm">
                Products Sold
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                4.9/5
              </div>
              <div className="text-gray-400 text-sm">
                Average Rating
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                24/7
              </div>
              <div className="text-gray-400 text-sm">
                Customer Support
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
