import { useState } from 'react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Users,
  Calendar,
  Search,
  TrendingUp,
  Clock,
  Eye
} from 'lucide-react';

export default function BrowseShows() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'scheduled' | 'ended'>('all');
  
  // Fetch all shows
  const { data: allShows, isLoading } = trpc.liveStreaming.listLiveShows.useQuery(
    { limit: 100 },
    { refetchInterval: 5000 }
  );
  
  // Filter shows
  const filteredShows = allShows?.filter(show => {
    const matchesSearch = show.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         show.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || show.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];
  
  const liveShows = filteredShows.filter(s => s.status === 'live');
  const scheduledShows = filteredShows.filter(s => s.status === 'scheduled');
  const pastShows = filteredShows.filter(s => s.status === 'ended');
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center text-foreground">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading shows...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Live Shopping Shows</h1>
          <p className="text-muted-foreground">
            Watch live shows, discover products, and shop exclusive deals in real-time
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shows</SelectItem>
              <SelectItem value="live">Live Now</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="ended">Past Shows</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Live Shows */}
        {liveShows.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              <h2 className="text-2xl font-bold">Live Now</h2>
              <Badge variant="destructive">{liveShows.length}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveShows.map((show) => (
                <Link key={show.id} href={`/live/${show.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-red-500/50">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gradient-to-br from-red-500 to-orange-500">
                      {show.thumbnailUrl ? (
                        <img
                          src={show.thumbnailUrl}
                          alt={show.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-16 h-16 text-foreground opacity-50" />
                        </div>
                      )}
                      
                      {/* Live Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge variant="destructive" className="animate-pulse">
                          <span className="w-2 h-2 bg-background text-foreground rounded-full mr-1"></span>
                          LIVE
                        </Badge>
                      </div>
                      
                      {/* Viewer Count */}
                      <div className="absolute top-3 right-3 bg-background/70 backdrop-blur px-2 py-1 rounded flex items-center gap-1 text-foreground text-sm">
                        <Users className="w-4 h-4" />
                        {show.peakViewers || 0}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{show.title}</h3>
                      {show.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {show.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {show.totalViews || 0} views
                        </span>
                        <Button size="sm" className="gap-2">
                          <Play className="w-4 h-4" />
                          Watch Now
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Scheduled Shows */}
        {scheduledShows.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Coming Soon</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {scheduledShows.map((show) => (
                <Card key={show.id} className="p-4 hover:shadow-md transition-shadow">
                  <Badge variant="default" className="mb-3">Scheduled</Badge>
                  
                  <h3 className="font-bold mb-2 line-clamp-2">{show.title}</h3>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Clock className="w-4 h-4" />
                    {new Date(show.scheduledStartAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full">
                    Set Reminder
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Past Shows */}
        {pastShows.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Past Shows</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pastShows.slice(0, 8).map((show) => (
                <Card key={show.id} className="p-4 hover:shadow-md transition-shadow">
                  <Badge variant="secondary" className="mb-3">Replay</Badge>
                  
                  <h3 className="font-bold mb-2 line-clamp-2">{show.title}</h3>
                  
                  <div className="space-y-1 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center justify-between">
                      <span>Views</span>
                      <span className="font-medium">{show.totalViews || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Peak</span>
                      <span className="font-medium">{show.peakViewers || 0}</span>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Play className="w-4 h-4" />
                    Watch Replay
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {filteredShows.length === 0 && (
          <Card className="p-12 text-center">
            <Play className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold mb-2">No Shows Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No live shows at the moment. Check back soon!'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
