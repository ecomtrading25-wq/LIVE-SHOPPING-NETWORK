import { useState, useEffect } from "react";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  PlayCircle,
  StopCircle,
  Pause,
  Video,
  Mic,
  Users,
  MessageSquare,
  Heart,
  Share2,
  ShoppingCart,
  DollarSign,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Scissors,
  Target,
  Zap,
  Settings,
  FileText,
  Package,
  TrendingUp,
  BarChart3,
  Calendar,
  Shield,
  Radio,
} from "lucide-react";

/**
 * Live Show Management System
 * 
 * Complete live streaming control center:
 * - Real-time show monitoring
 * - Run-of-show execution (6-8 min loop)
 * - Host script display
 * - Moderator playbook & macros
 * - Live metrics dashboard
 * - Segment timestamp logging
 * - Product pinning controls
 * - Viewer engagement tracking
 * - Post-live clip extraction
 * - Host handoff management
 * - Go-live readiness gating
 */

export default function LiveShowManagement() {
  return (
    <AdminProtectedRoute>
      <LiveShowManagementContent />
    </AdminProtectedRoute>
  );
}

function LiveShowManagementContent() {
  const [channelId] = useState("default-channel");
  const [selectedTab, setSelectedTab] = useState("upcoming");
  
  return (
    <div className="container mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Live Show Management</h1>
          <p className="text-muted-foreground mt-2">
            Control center for live streaming operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <PlayCircle className="h-4 w-4 mr-2" />
            Go Live
          </Button>
        </div>
      </div>
      
      {/* Main Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="live">Live Now</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="handoffs">Handoffs</TabsTrigger>
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="space-y-6">
          <UpcomingShowsSection channelId={channelId} />
        </TabsContent>
        
        <TabsContent value="live" className="space-y-6">
          <LiveShowsSection channelId={channelId} />
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-6">
          <CompletedShowsSection channelId={channelId} />
        </TabsContent>
        
        <TabsContent value="handoffs" className="space-y-6">
          <HandoffsSection channelId={channelId} />
        </TabsContent>
        
        <TabsContent value="readiness" className="space-y-6">
          <ReadinessSection channelId={channelId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// UPCOMING SHOWS SECTION
// ============================================================================

function UpcomingShowsSection({ channelId }: { channelId: string }) {
  // In production, this would fetch scheduled shows
  const upcomingShows = [
    {
      id: "show-1",
      title: "Viral Kitchen Gadget Launch",
      scheduledStartAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      hostName: "Sarah Chen",
      platform: "TIKTOK",
      status: "SCHEDULED",
    },
    {
      id: "show-2",
      title: "Beauty Product Demo",
      scheduledStartAt: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
      hostName: "Mike Rodriguez",
      platform: "YOUTUBE",
      status: "SCHEDULED",
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Upcoming Shows</h2>
          <p className="text-muted-foreground">Scheduled live streams</p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Show
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {upcomingShows.map((show) => (
          <Card key={show.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{show.title}</CardTitle>
                  <CardDescription>
                    {show.scheduledStartAt.toLocaleString()} · {show.platform}
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  {Math.round((show.scheduledStartAt.getTime() - Date.now()) / (1000 * 60 * 60))}h
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Host: {show.hostName}</span>
              </div>
              
              <Separator />
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  View Script
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Shield className="h-4 w-4 mr-2" />
                  Check Readiness
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// LIVE SHOWS SECTION
// ============================================================================

function LiveShowsSection({ channelId }: { channelId: string }) {
  const [selectedShow, setSelectedShow] = useState<string | null>(null);
  
  // Mock live show data
  const liveShows = [
    {
      id: "live-1",
      title: "Viral Kitchen Gadget Launch",
      platform: "TIKTOK",
      hostName: "Sarah Chen",
      currentViewers: 1247,
      peakViewers: 1589,
      totalViews: 3421,
      likes: 892,
      comments: 234,
      shares: 67,
      purchases: 45,
      revenueCents: 134550,
      actualStartAt: new Date(Date.now() - 23 * 60 * 1000), // Started 23 mins ago
    },
  ];
  
  if (liveShows.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Live Shows</h3>
            <p className="text-muted-foreground mb-4">
              No shows are currently streaming
            </p>
            <Button>
              <PlayCircle className="h-4 w-4 mr-2" />
              Start Live Show
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {liveShows.map((show) => (
        <LiveShowControl key={show.id} show={show} channelId={channelId} />
      ))}
    </div>
  );
}

function LiveShowControl({ show, channelId }: { show: any; channelId: string }) {
  const [currentSegment, setCurrentSegment] = useState("DEMO");
  const [segmentNumber, setSegmentNumber] = useState(1);
  
  // Calculate show duration
  const durationMinutes = Math.floor((Date.now() - show.actualStartAt.getTime()) / (1000 * 60));
  
  // Run-of-show segments
  const runOfShow = [
    { segment: "DEMO", duration: 1.5, script: "Show the product in action. Proof-first approach." },
    { segment: "OBJECTION", duration: 1, script: "Address common concerns proactively." },
    { segment: "TRUST", duration: 1.5, script: "Best for / Not for transparency. Build credibility." },
    { segment: "OFFER", duration: 1.5, script: "Clear call-to-action. Emphasize value." },
    { segment: "QA", duration: 1.5, script: "Answer viewer questions. Engage with chat." },
  ];
  
  return (
    <div className="space-y-6">
      {/* Live Status Banner */}
      <Card className="border-red-500 border-2">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                  <Radio className="h-6 w-6 text-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-ping"></div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{show.title}</h2>
                <p className="text-muted-foreground">
                  Live for {durationMinutes} minutes · {show.platform} · Host: {show.hostName}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button variant="destructive" size="sm">
                <StopCircle className="h-4 w-4 mr-2" />
                End Show
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metrics & Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Real-time Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Live Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">Current Viewers</span>
                  </div>
                  <p className="text-2xl font-bold">{show.currentViewers.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Peak: {show.peakViewers.toLocaleString()}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">Engagement</span>
                  </div>
                  <p className="text-2xl font-bold">{show.likes + show.comments + show.shares}</p>
                  <p className="text-xs text-muted-foreground">
                    {show.likes} likes · {show.comments} comments
                  </p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="text-sm">Purchases</span>
                  </div>
                  <p className="text-2xl font-bold">{show.purchases}</p>
                  <p className="text-xs text-muted-foreground">
                    {((show.purchases / show.totalViews) * 100).toFixed(2)}% conversion
                  </p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Revenue</span>
                  </div>
                  <p className="text-2xl font-bold">${(show.revenueCents / 100).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    ${(show.revenueCents / show.purchases / 100).toFixed(2)} AOV
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Run-of-Show Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Run-of-Show (Loop #{segmentNumber})</CardTitle>
              <CardDescription>6-8 minute segment structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {runOfShow.map((segment, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={currentSegment === segment.segment ? "default" : "outline"}
                      >
                        {segment.segment}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {segment.duration} min
                      </span>
                    </div>
                    {currentSegment === segment.segment && (
                      <Badge variant="default">
                        <Radio className="h-3 w-3 mr-1 animate-pulse" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{segment.script}</p>
                  {index < runOfShow.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    const currentIndex = runOfShow.findIndex(s => s.segment === currentSegment);
                    const nextIndex = (currentIndex + 1) % runOfShow.length;
                    setCurrentSegment(runOfShow[nextIndex].segment);
                    if (nextIndex === 0) setSegmentNumber(segmentNumber + 1);
                  }}
                >
                  Next Segment
                </Button>
                <Button variant="outline" size="sm">
                  <Target className="h-4 w-4 mr-2" />
                  Mark Highlight
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Product Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Product Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Viral Kitchen Gadget</p>
                    <p className="text-sm text-muted-foreground">$29.99 · In stock</p>
                  </div>
                </div>
                <Badge variant="default">Pinned</Badge>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Zap className="h-4 w-4 mr-2" />
                  Flash Sale
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Urgency Timer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column: Host Script & Moderator Tools */}
        <div className="space-y-6">
          {/* Host Script */}
          <Card>
            <CardHeader>
              <CardTitle>Host Script</CardTitle>
              <CardDescription>Current segment: {currentSegment}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-4 pr-4">
                  <div>
                    <h4 className="font-semibold mb-2">DEMO Segment (1.5 min)</h4>
                    <p className="text-sm text-muted-foreground">
                      "Hey everyone! Let me show you why this kitchen gadget is going VIRAL right now. 
                      Watch this - I'm going to chop these vegetables in literally 10 seconds. 
                      Ready? Here we go... [DEMO] See that? That's what I'm talking about! 
                      This is the proof - it actually works as advertised."
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-semibold mb-2">OBJECTION Segment (1 min)</h4>
                    <p className="text-sm text-muted-foreground">
                      "I know what you're thinking - 'Is this just another gimmick?' Let me address that. 
                      This is NOT like those cheap choppers that break after one use. 
                      The blades are stainless steel, dishwasher safe, and we've tested this with 
                      over 1000 uses. Here's the proof..."
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-semibold mb-2">TRUST Segment (1.5 min)</h4>
                    <p className="text-sm text-muted-foreground">
                      "Let me be transparent - this is BEST FOR people who cook at home regularly 
                      and want to save time. It's NOT FOR you if you rarely cook or prefer traditional 
                      knives. I want to be honest because I only recommend products I actually use myself."
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          {/* Moderator Macros */}
          <Card>
            <CardHeader>
              <CardTitle>Moderator Macros</CardTitle>
              <CardDescription>Quick responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start text-left">
                  <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-xs">Link is in pinned comment! 👆</span>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-left">
                  <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-xs">Yes, ships worldwide! 🌍</span>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-left">
                  <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-xs">30-day money back guarantee ✅</span>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-left">
                  <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-xs">In stock! Limited quantity 🔥</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Pinned Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Pinned Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium mb-1">1️⃣ How to buy:</p>
                  <p className="text-muted-foreground">Click the link below 👇</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium mb-1">2️⃣ Best for / Not for:</p>
                  <p className="text-muted-foreground">
                    ✅ Home cooks who want speed<br />
                    ❌ Professional chefs with knife skills
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium mb-1">3️⃣ Transparency:</p>
                  <p className="text-muted-foreground">
                    This is a sponsored live. We earn commission on sales. #ad
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPLETED SHOWS SECTION
// ============================================================================

function CompletedShowsSection({ channelId }: { channelId: string }) {
  const completedShows = [
    {
      id: "completed-1",
      title: "Beauty Product Demo",
      platform: "YOUTUBE",
      hostName: "Mike Rodriguez",
      actualStartAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      actualEndAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      peakViewers: 2341,
      totalViews: 5678,
      purchases: 89,
      revenueCents: 267000,
      clipsExtracted: 5,
    },
    {
      id: "completed-2",
      title: "Fitness Gear Launch",
      platform: "TIKTOK",
      hostName: "Sarah Chen",
      actualStartAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      actualEndAt: new Date(Date.now() - 47 * 60 * 60 * 1000),
      peakViewers: 1823,
      totalViews: 4234,
      purchases: 67,
      revenueCents: 201000,
      clipsExtracted: 5,
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Completed Shows</h2>
          <p className="text-muted-foreground">Past live streams & performance</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {completedShows.map((show) => (
          <Card key={show.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{show.title}</CardTitle>
                  <CardDescription>
                    {show.actualStartAt.toLocaleDateString()} · {show.platform} · {show.hostName}
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Peak Viewers</p>
                  <p className="text-xl font-bold">{show.peakViewers.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-xl font-bold">{show.totalViews.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Purchases</p>
                  <p className="text-xl font-bold">{show.purchases}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-xl font-bold">${(show.revenueCents / 100).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clips</p>
                  <p className="text-xl font-bold">{show.clipsExtracted}/5</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Button variant="outline" size="sm">
                  <Scissors className="h-4 w-4 mr-2" />
                  Manage Clips
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download Recording
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// HANDOFFS SECTION
// ============================================================================

function HandoffsSection({ channelId }: { channelId: string }) {
  const handoffs = [
    {
      id: "handoff-1",
      launchName: "Viral Kitchen Gadget Launch",
      hostName: "Sarah Chen",
      hostConfirmed: true,
      preLiveProgress: 8,
      preLiveTotal: 8,
      duringLiveProgress: 0,
      duringLiveTotal: 6,
      postLiveProgress: 0,
      postLiveTotal: 5,
    },
    {
      id: "handoff-2",
      launchName: "Beauty Product Demo",
      hostName: "Mike Rodriguez",
      hostConfirmed: false,
      preLiveProgress: 3,
      preLiveTotal: 8,
      duringLiveProgress: 0,
      duringLiveTotal: 6,
      postLiveProgress: 0,
      postLiveTotal: 5,
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Host Handoffs</h2>
          <p className="text-muted-foreground">VA/host handoff packs & checklists</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Generate Handoff
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {handoffs.map((handoff) => (
          <Card key={handoff.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{handoff.launchName}</CardTitle>
                  <CardDescription>Host: {handoff.hostName}</CardDescription>
                </div>
                {handoff.hostConfirmed ? (
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Confirmed
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Pre-Live Checklist</span>
                    <span className="text-sm text-muted-foreground">
                      {handoff.preLiveProgress}/{handoff.preLiveTotal}
                    </span>
                  </div>
                  <Progress
                    value={(handoff.preLiveProgress / handoff.preLiveTotal) * 100}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">During-Live Checklist</span>
                    <span className="text-sm text-muted-foreground">
                      {handoff.duringLiveProgress}/{handoff.duringLiveTotal}
                    </span>
                  </div>
                  <Progress
                    value={(handoff.duringLiveProgress / handoff.duringLiveTotal) * 100}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Post-Live Checklist</span>
                    <span className="text-sm text-muted-foreground">
                      {handoff.postLiveProgress}/{handoff.postLiveTotal}
                    </span>
                  </div>
                  <Progress
                    value={(handoff.postLiveProgress / handoff.postLiveTotal) * 100}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  View Pack
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download ZIP
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// READINESS SECTION
// ============================================================================

function ReadinessSection({ channelId }: { channelId: string }) {
  const readinessChecks = [
    {
      id: "readiness-1",
      launchName: "Viral Kitchen Gadget Launch",
      overallReadiness: 100,
      isReady: true,
      guardStatus: "ARMED",
      riskLevel: "LOW",
      checks: {
        testStreamsPass: true,
        testStreamsExpired: false,
        assetsComplete: true,
        hostHandoffConfirmed: true,
        inventoryAvailable: true,
        paymentGatewayHealthy: true,
        complianceApproved: true,
        platformAccountActive: true,
      },
    },
    {
      id: "readiness-2",
      launchName: "Beauty Product Demo",
      overallReadiness: 71,
      isReady: false,
      guardStatus: "DISARMED",
      riskLevel: "MEDIUM",
      checks: {
        testStreamsPass: true,
        testStreamsExpired: false,
        assetsComplete: true,
        hostHandoffConfirmed: false,
        inventoryAvailable: true,
        paymentGatewayHealthy: true,
        complianceApproved: true,
        platformAccountActive: true,
      },
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Go-Live Readiness</h2>
          <p className="text-muted-foreground">Multi-factor gating & risk assessment</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {readinessChecks.map((readiness) => (
          <Card key={readiness.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{readiness.launchName}</CardTitle>
                  <CardDescription>
                    Overall Readiness: {readiness.overallReadiness}%
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <RiskBadge level={readiness.riskLevel} />
                  <GuardBadge status={readiness.guardStatus} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div>
                <Progress value={readiness.overallReadiness} className="h-3" />
              </div>
              
              {/* Readiness Checks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CheckItem
                  label="Test Streams"
                  passed={readiness.checks.testStreamsPass && !readiness.checks.testStreamsExpired}
                  detail={
                    readiness.checks.testStreamsExpired
                      ? "Expired (>2h old)"
                      : "Valid & passed"
                  }
                />
                <CheckItem
                  label="Assets Complete"
                  passed={readiness.checks.assetsComplete}
                  detail="All platforms ready"
                />
                <CheckItem
                  label="Host Handoff"
                  passed={readiness.checks.hostHandoffConfirmed}
                  detail={
                    readiness.checks.hostHandoffConfirmed
                      ? "Confirmed by host"
                      : "Awaiting confirmation"
                  }
                />
                <CheckItem
                  label="Inventory"
                  passed={readiness.checks.inventoryAvailable}
                  detail="In stock"
                />
                <CheckItem
                  label="Payment Gateway"
                  passed={readiness.checks.paymentGatewayHealthy}
                  detail="Healthy"
                />
                <CheckItem
                  label="Compliance"
                  passed={readiness.checks.complianceApproved}
                  detail="Approved"
                />
                <CheckItem
                  label="Platform Account"
                  passed={readiness.checks.platformAccountActive}
                  detail="Active"
                />
              </div>
              
              <Separator />
              
              {/* Actions */}
              <div className="flex gap-2">
                {readiness.isReady ? (
                  <>
                    {readiness.guardStatus === "ARMED" ? (
                      <Button className="flex-1">
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Go Live
                      </Button>
                    ) : (
                      <Button className="flex-1">
                        <Shield className="h-4 w-4 mr-2" />
                        Arm Guard
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="flex-1">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Fix Issues
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Shield className="h-4 w-4 mr-2" />
                      Override
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

function CheckItem({
  label,
  passed,
  detail,
}: {
  label: string;
  passed: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {passed ? (
        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
      ) : (
        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    LOW: "bg-green-100 text-green-800 border-green-200",
    MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
    HIGH: "bg-orange-100 text-orange-800 border-orange-200",
    CRITICAL: "bg-red-100 text-red-800 border-red-200",
  };
  
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
        colors[level] || colors.LOW
      }`}
    >
      {level} Risk
    </span>
  );
}

function GuardBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DISARMED: "bg-gray-100 text-gray-800 border-gray-200",
    ARMED: "bg-green-100 text-green-800 border-green-200",
    TRIGGERED: "bg-blue-100 text-blue-800 border-blue-200",
    OVERRIDDEN: "bg-orange-100 text-orange-800 border-orange-200",
  };
  
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
        colors[status] || colors.DISARMED
      }`}
    >
      <Shield className="h-3 w-3 mr-1" />
      {status}
    </span>
  );
}
