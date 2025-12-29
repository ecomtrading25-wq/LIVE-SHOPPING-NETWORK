import { useState } from "react";
import { Play, Users, ShoppingBag, Clock, TrendingUp, Star, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LiveShowsBrowse() {
  const [filter, setFilter] = useState<"all" | "live" | "upcoming" | "past">("live");
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("viewers");

  // Mock data - will wire to real API
  const liveShows = [
    {
      id: "1",
      title: "Beauty Essentials Flash Sale - 50% Off Everything!",
      creator: {
        name: "Sarah Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
        followers: 45200,
        rating: 4.8
      },
      thumbnail: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=450&fit=crop",
      status: "live" as const,
      viewers: 1247,
      products: 12,
      startedAt: new Date(Date.now() - 1000 * 60 * 23),
      category: "Beauty",
      totalSales: 45600,
      avgPrice: 34.99
    },
    {
      id: "2",
      title: "Tech Gadgets Unboxing & Reviews",
      creator: {
        name: "Mike Johnson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
        followers: 89300,
        rating: 4.9
      },
      thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=450&fit=crop",
      status: "live" as const,
      viewers: 3421,
      products: 8,
      startedAt: new Date(Date.now() - 1000 * 60 * 45),
      category: "Electronics",
      totalSales: 128900,
      avgPrice: 89.99
    },
    {
      id: "3",
      title: "Fashion Friday: Summer Collection 2024",
      creator: {
        name: "Emma Davis",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
        followers: 67800,
        rating: 4.7
      },
      thumbnail: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=450&fit=crop",
      status: "live" as const,
      viewers: 2156,
      products: 24,
      startedAt: new Date(Date.now() - 1000 * 60 * 12),
      category: "Fashion",
      totalSales: 67800,
      avgPrice: 49.99
    },
    {
      id: "4",
      title: "Home Decor Deals - Transform Your Space",
      creator: {
        name: "Alex Martinez",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
        followers: 34500,
        rating: 4.6
      },
      thumbnail: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&h=450&fit=crop",
      status: "live" as const,
      viewers: 892,
      products: 15,
      startedAt: new Date(Date.now() - 1000 * 60 * 8),
      category: "Home",
      totalSales: 34200,
      avgPrice: 39.99
    },
    {
      id: "5",
      title: "Fitness Equipment Showcase - Get Fit!",
      creator: {
        name: "Jordan Lee",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan",
        followers: 52100,
        rating: 4.8
      },
      thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=450&fit=crop",
      status: "live" as const,
      viewers: 1678,
      products: 10,
      startedAt: new Date(Date.now() - 1000 * 60 * 34),
      category: "Fitness",
      totalSales: 56700,
      avgPrice: 79.99
    }
  ];

  const upcomingShows = [
    {
      id: "6",
      title: "Kitchen Essentials Mega Sale",
      creator: {
        name: "Chef Maria",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria",
        followers: 78900,
        rating: 4.9
      },
      thumbnail: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=450&fit=crop",
      status: "upcoming" as const,
      scheduledFor: new Date(Date.now() + 1000 * 60 * 30),
      products: 18,
      category: "Kitchen"
    },
    {
      id: "7",
      title: "Gaming Gear Extravaganza",
      creator: {
        name: "Pro Gamer Dan",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=dan",
        followers: 125000,
        rating: 5.0
      },
      thumbnail: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=450&fit=crop",
      status: "upcoming" as const,
      scheduledFor: new Date(Date.now() + 1000 * 60 * 90),
      products: 22,
      category: "Gaming"
    },
    {
      id: "8",
      title: "Pet Supplies & Accessories",
      creator: {
        name: "Pet Lover Amy",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=amy",
        followers: 41200,
        rating: 4.7
      },
      thumbnail: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&h=450&fit=crop",
      status: "upcoming" as const,
      scheduledFor: new Date(Date.now() + 1000 * 60 * 150),
      products: 14,
      category: "Pets"
    }
  ];

  const categories = ["all", "Beauty", "Electronics", "Fashion", "Home", "Fitness", "Kitchen", "Gaming", "Pets"];

  let filteredShows = filter === "live" ? liveShows : filter === "upcoming" ? upcomingShows : [...liveShows, ...upcomingShows];
  
  if (category !== "all") {
    filteredShows = filteredShows.filter(show => show.category === category);
  }

  // Sort
  if (sortBy === "viewers" && filter === "live") {
    filteredShows = [...filteredShows].sort((a, b) => (b.viewers || 0) - (a.viewers || 0));
  } else if (sortBy === "followers") {
    filteredShows = [...filteredShows].sort((a, b) => b.creator.followers - a.creator.followers);
  } else if (sortBy === "recent") {
    filteredShows = [...filteredShows].sort((a, b) => {
      const aTime = a.status === "live" ? a.startedAt.getTime() : a.scheduledFor!.getTime();
      const bTime = b.status === "live" ? b.startedAt.getTime() : b.scheduledFor!.getTime();
      return bTime - aTime;
    });
  }

  const formatDuration = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const formatUpcoming = (date: Date) => {
    const minutes = Math.floor((date.getTime() - Date.now()) / 1000 / 60);
    if (minutes < 60) return `in ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `in ${hours}h`;
    const days = Math.floor(hours / 24);
    return `in ${days}d`;
  };

  const totalViewers = liveShows.reduce((acc, show) => acc + show.viewers, 0);
  const totalProducts = liveShows.reduce((acc, show) => acc + show.products, 0);
  const totalSales = liveShows.reduce((acc, show) => acc + show.totalSales, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="container py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-foreground mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-300 to-red-300">
            Live Shopping Shows
          </h1>
          <p className="text-xl text-red-200 mb-8">
            Watch, shop, and interact with creators in real-time
          </p>

          {/* Stats Bar */}
          <div className="flex flex-wrap justify-center gap-8 text-white/90 mb-8">
            <div className="flex items-center gap-2 bg-background text-foreground/10 backdrop-blur-sm px-6 py-3 rounded-full">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="font-semibold">{liveShows.length} Live Now</span>
            </div>
            <div className="flex items-center gap-2 bg-background text-foreground/10 backdrop-blur-sm px-6 py-3 rounded-full">
              <Users className="w-5 h-5" />
              <span className="font-semibold">{totalViewers.toLocaleString()} watching</span>
            </div>
            <div className="flex items-center gap-2 bg-background text-foreground/10 backdrop-blur-sm px-6 py-3 rounded-full">
              <ShoppingBag className="w-5 h-5" />
              <span className="font-semibold">{totalProducts} products</span>
            </div>
            <div className="flex items-center gap-2 bg-background text-foreground/10 backdrop-blur-sm px-6 py-3 rounded-full">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">${(totalSales / 1000).toFixed(1)}K sold today</span>
            </div>
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
                className={filter === "all" ? "bg-pink-500 hover:bg-pink-600 text-foreground" : "bg-background/10 hover:bg-background/20 border-white/20 text-foreground"}
              >
                All Shows
              </Button>
              <Button
                variant={filter === "live" ? "default" : "outline"}
                onClick={() => setFilter("live")}
                className={filter === "live" ? "bg-pink-500 hover:bg-pink-600 text-foreground" : "bg-background/10 hover:bg-background/20 border-white/20 text-foreground"}
              >
                <span className="w-2 h-2 bg-background text-foreground rounded-full mr-2 animate-pulse" />
                Live ({liveShows.length})
              </Button>
              <Button
                variant={filter === "upcoming" ? "default" : "outline"}
                onClick={() => setFilter("upcoming")}
                className={filter === "upcoming" ? "bg-pink-500 hover:bg-pink-600 text-foreground" : "bg-background/10 hover:bg-background/20 border-white/20 text-foreground"}
              >
                <Clock className="w-4 h-4 mr-2" />
                Upcoming ({upcomingShows.length})
              </Button>
            </div>

            {/* Category Filter */}
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px] bg-background/10 border-white/20 text-foreground">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-background/10 border-white/20 text-foreground">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewers">Most Viewers</SelectItem>
                <SelectItem value="followers">Top Creators</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Shows Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShows.map((show) => (
            <Link key={show.id} href={`/live/${show.id}`}>
              <Card className="group cursor-pointer overflow-hidden bg-background text-foreground/10 backdrop-blur-sm border-white/20 hover:bg-background text-foreground/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={show.thumbnail}
                    alt={show.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Live Badge */}
                  {show.status === "live" && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-red-500 text-foreground border-0 animate-pulse font-bold px-3 py-1">
                        <span className="w-2 h-2 bg-background text-foreground rounded-full mr-2 animate-pulse" />
                        LIVE
                      </Badge>
                    </div>
                  )}

                  {/* Upcoming Badge */}
                  {show.status === "upcoming" && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-red-500 text-foreground border-0 font-bold px-3 py-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatUpcoming(show.scheduledFor!)}
                      </Badge>
                    </div>
                  )}

                  {/* Viewers Count (for live) */}
                  {show.status === "live" && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-background/70 text-foreground border-0 backdrop-blur-sm font-bold px-3 py-1">
                        <Users className="w-3 h-3 mr-1" />
                        {show.viewers.toLocaleString()}
                      </Badge>
                    </div>
                  )}

                  {/* Duration (for live) */}
                  {show.status === "live" && (
                    <div className="absolute bottom-3 left-3">
                      <Badge className="bg-background/70 text-foreground border-0 backdrop-blur-sm px-3 py-1">
                        {formatDuration(show.startedAt)}
                      </Badge>
                    </div>
                  )}

                  {/* Products Count */}
                  <div className="absolute bottom-3 right-3">
                    <Badge className="bg-pink-500 text-foreground border-0 font-bold px-3 py-1">
                      <ShoppingBag className="w-3 h-3 mr-1" />
                      {show.products}
                    </Badge>
                  </div>

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-foreground">
                    <div className="w-20 h-20 rounded-full bg-background text-foreground/90 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                      <Play className="w-10 h-10 text-red-600 ml-1" fill="currentColor" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Category */}
                  <Badge variant="outline" className="mb-3 border-white/30 text-white/90 text-xs">
                    {show.category}
                  </Badge>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-2 group-hover:text-pink-300 transition-colors">
                    {show.title}
                  </h3>

                  {/* Creator Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={show.creator.avatar}
                      alt={show.creator.name}
                      className="w-12 h-12 rounded-full border-2 border-white/30 group-hover:border-pink-400 transition-colors"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {show.creator.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-red-200">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{show.creator.rating}</span>
                        <span>•</span>
                        <span>{(show.creator.followers / 1000).toFixed(1)}K followers</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats (for live shows) */}
                  {show.status === "live" && (
                    <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-red-200">
                      <span>${(show.totalSales / 1000).toFixed(1)}K sales</span>
                      <span>Avg ${show.avgPrice}</span>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredShows.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-background text-foreground/10 flex items-center justify-center mx-auto mb-6">
              <Play className="w-12 h-12 text-white/50" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">
              No {filter} shows in {category === "all" ? "any category" : category}
            </h3>
            <p className="text-red-200 mb-6">
              Try adjusting your filters or check back soon!
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setCategory("all")}
                className="bg-background/10 hover:bg-background/20 text-foreground"
              >
                Clear Filters
              </Button>
              <Button
                onClick={() => setFilter("all")}
                className="bg-pink-500 hover:bg-pink-600 text-foreground"
              >
                View All Shows
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
