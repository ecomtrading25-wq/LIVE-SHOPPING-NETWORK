import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  Video,
  Calendar,
  Users,
  DollarSign,
  MessageSquare,
  TrendingUp,
  Play,
  StopCircle,
  Edit,
  Trash2,
  Copy,
  Eye
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function HostDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newShow, setNewShow] = useState({
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
  });
  
  // Fetch host's shows
  const { data: shows, refetch } = trpc.liveStreaming.listLiveShows.useQuery(
    { limit: 50 },
    { refetchInterval: 10000 }
  );
  
  // Create show mutation
  const createShowMutation = trpc.liveStreaming.createShow.useMutation({
    onSuccess: () => {
      toast({
        title: 'Show created',
        description: 'Your live show has been scheduled',
      });
      setIsCreateDialogOpen(false);
      setNewShow({ title: '', description: '', scheduledDate: '', scheduledTime: '' });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Start show mutation
  const startShowMutation = trpc.liveStreaming.startShow.useMutation({
    onSuccess: () => {
      toast({
        title: 'Show started',
        description: 'Your live show is now broadcasting',
      });
      refetch();
    },
  });
  
  // End show mutation
  const endShowMutation = trpc.liveStreaming.endShow.useMutation({
    onSuccess: () => {
      toast({
        title: 'Show ended',
        description: 'Your live show has ended',
      });
      refetch();
    },
  });
  
  const handleCreateShow = () => {
    if (!newShow.title || !newShow.scheduledDate || !newShow.scheduledTime) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    const scheduledStartAt = new Date(`${newShow.scheduledDate}T${newShow.scheduledTime}`);
    
    createShowMutation.mutate({
      title: newShow.title,
      description: newShow.description,
      scheduledStartAt,
      settings: {
        allowChat: true,
        allowGifts: true,
        moderationEnabled: false,
        recordingEnabled: true,
      },
    });
  };
  
  const copyStreamKey = (streamKey: string) => {
    navigator.clipboard.writeText(streamKey);
    toast({
      title: 'Copied',
      description: 'Stream key copied to clipboard',
    });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'destructive';
      case 'scheduled':
        return 'default';
      case 'ended':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  
  // Filter shows by host
  const myShows = shows?.filter(show => show.hostId === user?.id) || [];
  const liveShows = myShows.filter(s => s.status === 'live');
  const scheduledShows = myShows.filter(s => s.status === 'scheduled');
  const pastShows = myShows.filter(s => s.status === 'ended');
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Host Dashboard</h1>
            <p className="text-muted-foreground">Manage your live shows and engage with your audience</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Create Show
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Live Show</DialogTitle>
                <DialogDescription>
                  Schedule a new live shopping show for your audience
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Show Title *</label>
                  <Input
                    placeholder="e.g., Summer Fashion Collection"
                    value={newShow.title}
                    onChange={(e) => setNewShow({ ...newShow, title: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    placeholder="Tell viewers what to expect..."
                    value={newShow.description}
                    onChange={(e) => setNewShow({ ...newShow, description: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Date *</label>
                    <Input
                      type="date"
                      value={newShow.scheduledDate}
                      onChange={(e) => setNewShow({ ...newShow, scheduledDate: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Time *</label>
                    <Input
                      type="time"
                      value={newShow.scheduledTime}
                      onChange={(e) => setNewShow({ ...newShow, scheduledTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateShow} disabled={createShowMutation.isPending}>
                  {createShowMutation.isPending ? 'Creating...' : 'Create Show'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Shows</p>
                <p className="text-3xl font-bold">{myShows.length}</p>
              </div>
              <Video className="w-10 h-10 text-primary opacity-20" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Viewers</p>
                <p className="text-3xl font-bold">
                  {myShows.reduce((sum, show) => sum + (show.totalViews || 0), 0)}
                </p>
              </div>
              <Users className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Live Now</p>
                <p className="text-3xl font-bold">{liveShows.length}</p>
              </div>
              <Play className="w-10 h-10 text-red-500 opacity-20" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-3xl font-bold">{scheduledShows.length}</p>
              </div>
              <Calendar className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </Card>
        </div>
        
        {/* Live Shows */}
        {liveShows.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              Live Now
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {liveShows.map((show) => (
                <Card key={show.id} className="p-6 border-red-500/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="destructive" className="animate-pulse">
                          <span className="w-2 h-2 bg-background text-foreground rounded-full mr-1"></span>
                          LIVE
                        </Badge>
                        <h3 className="text-xl font-bold">{show.title}</h3>
                      </div>
                      
                      {show.description && (
                        <p className="text-muted-foreground mb-4">{show.description}</p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm">
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {show.peakViewers || 0} viewers
                        </span>
                        <span className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          {show.totalMessages || 0} messages
                        </span>
                        <span className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          {show.totalViews || 0} total views
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        onClick={() => endShowMutation.mutate({ showId: show.id })}
                      >
                        <StopCircle className="w-4 h-4" />
                        End Show
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Scheduled Shows */}
        {scheduledShows.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Scheduled Shows</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scheduledShows.map((show) => (
                <Card key={show.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getStatusColor(show.status)}>
                          {show.status}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold mb-1">{show.title}</h3>
                      {show.description && (
                        <p className="text-sm text-muted-foreground mb-3">{show.description}</p>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {new Date(show.scheduledStartAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  {show.streamKey && (
                    <div className="bg-muted p-3 rounded mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">Stream Key</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyStreamKey(show.streamKey!)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <code className="text-xs font-mono">{show.streamKey}</code>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => startShowMutation.mutate({ showId: show.id })}
                    >
                      <Play className="w-4 h-4" />
                      Start Show
                    </Button>
                    <Button variant="outline" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Past Shows */}
        {pastShows.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Past Shows</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pastShows.slice(0, 6).map((show) => (
                <Card key={show.id} className="p-4">
                  <Badge variant="secondary" className="mb-2">Ended</Badge>
                  <h3 className="font-bold mb-2">{show.title}</h3>
                  
                  <div className="space-y-1 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center justify-between">
                      <span>Peak Viewers</span>
                      <span className="font-medium">{show.peakViewers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total Views</span>
                      <span className="font-medium">{show.totalViews || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Messages</span>
                      <span className="font-medium">{show.totalMessages || 0}</span>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <TrendingUp className="w-4 h-4" />
                    View Analytics
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {myShows.length === 0 && (
          <Card className="p-12 text-center">
            <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold mb-2">No Shows Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first live show to start engaging with your audience
            </p>
            <Button size="lg" className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-5 h-5" />
              Create Your First Show
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
