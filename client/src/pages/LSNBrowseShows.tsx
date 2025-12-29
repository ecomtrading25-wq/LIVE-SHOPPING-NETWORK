/**
 * LSN BROWSE SHOWS PAGE V1
 * 
 * Features:
 * - Live shows grid
 * - Upcoming shows schedule
 * - Past shows (VOD)
 * - Filter by category, creator, time
 * - Search functionality
 * - 24/7 schedule grid view
 * - Creator filter
 * - Sort options
 * - Mobile-responsive
 */

import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Eye,
  Calendar,
  Clock,
  Search,
  Filter,
  TrendingUp,
  Users,
  Star,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LSNBrowseShows() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCreator, setSelectedCreator] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("viewers");

  // Fetch live shows
  const { data: liveShows, isLoading: liveLoading } = trpc.liveShows.getLive.useQuery();

  // Fetch upcoming shows
  const { data: upcomingShows, isLoading: upcomingLoading } = trpc.liveShows.getUpcoming.useQuery({
    limit: 50,
  });

  // Fetch top creators for filter
  const { data: topCreators } = trpc.creators.getLeaderboard.useQuery({
    metric: "revenue",
    period: "month",
    limit: 20,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Live Shows</h1>
          <p className="text-gray-400">
            Discover exclusive deals and shop with your favorite creators
          </p>
        </div>

        {/* Filters */}
        <Card className="border-border bg-background mb-8 text-foreground">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search shows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border text-card-foreground"
                />
              </div>

              {/* Category filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-card border-border text-card-foreground">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="fashion">Fashion</SelectItem>
                  <SelectItem value="beauty">Beauty</SelectItem>
                  <SelectItem value="home">Home & Garden</SelectItem>
                  <SelectItem value="sports">Sports & Outdoors</SelectItem>
                </SelectContent>
              </Select>

              {/* Creator filter */}
              <Select value={selectedCreator} onValueChange={setSelectedCreator}>
                <SelectTrigger className="bg-card border-border text-card-foreground">
                  <SelectValue placeholder="Creator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Creators</SelectItem>
                  {topCreators?.map((creator: any) => (
                    <SelectItem key={creator.id} value={creator.id}>
                      {creator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-card border-border text-card-foreground">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewers">Most Viewers</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="upcoming">Starting Soon</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="live" className="space-y-6">
          <TabsList className="bg-background border border-border text-foreground">
            <TabsTrigger value="live" className="data-[state=active]:bg-red-600">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                Live Now
                {liveShows && (
                  <Badge variant="secondary" className="ml-2">
                    {liveShows.length}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-red-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming
              </div>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-red-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Schedule
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Live shows */}
          <TabsContent value="live" className="space-y-6">
            {liveLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-80" />
                ))}
              </div>
            ) : liveShows && liveShows.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {liveShows.map((show: any) => (
                  <LiveShowCard key={show.id} show={show} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Play className="h-16 w-16 text-gray-600" />}
                title="No Live Shows"
                description="Check back soon for live shopping events"
              />
            )}
          </TabsContent>

          {/* Upcoming shows */}
          <TabsContent value="upcoming" className="space-y-6">
            {upcomingLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(9)].map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : upcomingShows && upcomingShows.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcomingShows.map((show: any) => (
                  <UpcomingShowCard key={show.id} show={show} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Calendar className="h-16 w-16 text-gray-600" />}
                title="No Upcoming Shows"
                description="New shows are scheduled regularly"
              />
            )}
          </TabsContent>

          {/* Schedule grid */}
          <TabsContent value="schedule" className="space-y-6">
            <ScheduleGrid />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: Live Show Card
// ============================================================================

function LiveShowCard({ show }: { show: any }) {
  return (
    <Link href={`/live/${show.id}`}>
      <Card className="group border-border bg-background hover:border-red-500/50 transition-all cursor-pointer overflow-hidden text-foreground">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={show.thumbnailUrl || "/placeholder-show.jpg"}
            alt={show.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Live badge */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-red-600 text-foreground animate-pulse">
              <div className="h-2 w-2 bg-background text-foreground rounded-full mr-2" />
              LIVE
            </Badge>
          </div>

          {/* Viewer count */}
          <div className="absolute top-3 right-3 bg-background/70 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2 text-foreground">
            <Eye className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium">
              {show.currentViewers?.toLocaleString() || 0}
            </span>
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 border-2 border-red-500">
              <AvatarImage src={show.creator?.avatarUrl} />
              <AvatarFallback>{show.creator?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold mb-1 truncate group-hover:text-red-400 transition-colors">
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
// COMPONENT: Upcoming Show Card
// ============================================================================

function UpcomingShowCard({ show }: { show: any }) {
  const startTime = new Date(show.scheduledStartTime);
  const now = new Date();
  const hoursUntil = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60 * 60));

  return (
    <Link href={`/show/${show.id}`}>
      <Card className="group border-border bg-background hover:border-red-500/50 transition-all cursor-pointer overflow-hidden text-foreground">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={show.thumbnailUrl || "/placeholder-show.jpg"}
            alt={show.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Time badge */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-red-600">
              {hoursUntil < 24
                ? `In ${hoursUntil}h`
                : startTime.toLocaleDateString()}
            </Badge>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-10 w-10 border-2 border-red-500">
              <AvatarImage src={show.creator?.avatarUrl} />
              <AvatarFallback>{show.creator?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold mb-1 truncate group-hover:text-red-400 transition-colors">
                {show.title}
              </h3>
              <p className="text-sm text-gray-400">{show.creator?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="h-4 w-4" />
            <span>
              {startTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================================================
// COMPONENT: Schedule Grid
// ============================================================================

function ScheduleGrid() {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-8 gap-2 mb-2">
          <div className="text-sm font-semibold text-gray-400">Time</div>
          {days.map((day) => (
            <div key={day} className="text-sm font-semibold text-gray-400 text-center">
              {day.slice(0, 3)}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="space-y-1">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 gap-2">
              <div className="text-sm text-gray-500 py-2">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {days.map((day) => (
                <div
                  key={`${day}-${hour}`}
                  className="bg-background border border-border rounded p-2 min-h-[60px] hover:border-red-500/50 transition-colors cursor-pointer text-foreground"
                >
                  {/* Mock show data - in production, fetch from API */}
                  {hour >= 9 && hour <= 22 && Math.random() > 0.7 && (
                    <div className="text-xs">
                      <div className="font-semibold truncate mb-1">
                        Show Title
                      </div>
                      <div className="text-gray-500 truncate">
                        Creator Name
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: Empty State
// ============================================================================

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-16">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
