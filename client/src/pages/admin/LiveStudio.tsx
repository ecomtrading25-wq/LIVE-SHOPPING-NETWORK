import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Video,
  Play,
  Square,
  Pause,
  Users,
  MessageCircle,
  ShoppingBag,
  Eye,
  TrendingUp,
  Download,
  Settings,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Monitor,
  AlertCircle,
} from "lucide-react";

/**
 * Live Streaming Studio
 * OBS integration, real-time chat moderation, product spotlight, viewer analytics
 */

interface LiveStream {
  id: string;
  title: string;
  status: "live" | "scheduled" | "ended";
  viewers: number;
  peakViewers: number;
  duration: string;
  revenue: number;
  products: number;
  startTime: string;
  endTime?: string;
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
  flagged?: boolean;
}

interface ProductSpotlight {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  clicks: number;
  conversions: number;
}

export default function LiveStudioPage() {
  const [streamStatus, setStreamStatus] = useState<"offline" | "live" | "paused">("offline");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [selectedTab, setSelectedTab] = useState("stream");

  // Mock current stream
  const currentStream: LiveStream = {
    id: "LIVE-001",
    title: "Holiday Gift Guide - Live Shopping Event",
    status: "live",
    viewers: 1247,
    peakViewers: 1583,
    duration: "00:45:32",
    revenue: 28450,
    products: 12,
    startTime: "2025-12-27T20:00:00Z",
  };

  // Mock chat messages
  const chatMessages: ChatMessage[] = [
    {
      id: "MSG-001",
      user: "Sarah_M",
      message: "Love this product! Can you show the blue color?",
      timestamp: "20:45:12",
    },
    {
      id: "MSG-002",
      user: "John_D",
      message: "Just ordered! Thanks for the discount code!",
      timestamp: "20:45:18",
    },
    {
      id: "MSG-003",
      user: "Emily_R",
      message: "How long is shipping?",
      timestamp: "20:45:25",
    },
    {
      id: "MSG-004",
      user: "Spam_Bot",
      message: "Click here for free stuff!!!",
      timestamp: "20:45:30",
      flagged: true,
    },
  ];

  // Mock product spotlight
  const spotlightProducts: ProductSpotlight[] = [
    {
      id: "PROD-001",
      name: "Wireless Headphones Pro",
      price: 299.99,
      image: "/placeholder-product.jpg",
      stock: 45,
      clicks: 234,
      conversions: 18,
    },
    {
      id: "PROD-002",
      name: "Smart Watch Ultra",
      price: 399.99,
      image: "/placeholder-product.jpg",
      stock: 28,
      clicks: 189,
      conversions: 12,
    },
    {
      id: "PROD-003",
      name: "Portable Charger 20K",
      price: 49.99,
      image: "/placeholder-product.jpg",
      stock: 156,
      clicks: 145,
      conversions: 23,
    },
  ];

  // Mock viewer analytics
  const viewerStats = {
    current: 1247,
    peak: 1583,
    average: 1124,
    totalViews: 3456,
    newViewers: 892,
    returningViewers: 355,
  };

  const handleStartStream = () => {
    setStreamStatus("live");
  };

  const handlePauseStream = () => {
    setStreamStatus("paused");
  };

  const handleStopStream = () => {
    setStreamStatus("offline");
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Live Streaming Studio</h1>
          <p className="text-muted-foreground">
            Broadcast live shopping shows with real-time interaction
          </p>
        </div>
        <div className="flex items-center gap-3">
          {streamStatus === "offline" && (
            <Button onClick={handleStartStream} size="lg" className="bg-red-500 hover:bg-red-600">
              <Play className="w-5 h-5 mr-2" />
              Go Live
            </Button>
          )}
          {streamStatus === "live" && (
            <>
              <Button onClick={handlePauseStream} variant="outline" size="lg">
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
              <Button onClick={handleStopStream} variant="destructive" size="lg">
                <Square className="w-5 h-5 mr-2" />
                End Stream
              </Button>
            </>
          )}
          {streamStatus === "paused" && (
            <>
              <Button onClick={handleStartStream} size="lg">
                <Play className="w-5 h-5 mr-2" />
                Resume
              </Button>
              <Button onClick={handleStopStream} variant="destructive" size="lg">
                <Square className="w-5 h-5 mr-2" />
                End Stream
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stream Status */}
      {streamStatus !== "offline" && (
        <Card className="p-6 bg-gradient-to-r from-red-500/10 to-red-500/10 border-red-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-lg font-bold text-red-500">
                  {streamStatus === "live" ? "LIVE" : "PAUSED"}
                </span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{currentStream.viewers.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">viewers</span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="text-xl font-bold">{currentStream.duration}</span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-xl font-bold text-green-500">
                  ${currentStream.revenue.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={audioEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setAudioEnabled(!audioEnabled)}
              >
                {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
              <Button
                variant={videoEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setVideoEnabled(!videoEnabled)}
              >
                {videoEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stream Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Preview */}
          <Card className="p-6">
            <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center mb-4">
              {streamStatus === "offline" ? (
                <div className="text-center">
                  <Monitor className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-xl font-bold mb-2">Stream Offline</p>
                  <p className="text-muted-foreground">Click "Go Live" to start broadcasting</p>
                </div>
              ) : (
                <div className="text-center">
                  <Video className="w-16 h-16 text-primary mx-auto mb-4" />
                  <p className="text-xl font-bold mb-2">Live Preview</p>
                  <p className="text-muted-foreground">Your stream is broadcasting</p>
                </div>
              )}
            </div>

            {/* Stream Info */}
            {streamStatus !== "offline" && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Stream Title</label>
                  <Input value={currentStream.title} readOnly />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Peak Viewers</p>
                    <p className="text-2xl font-bold">{currentStream.peakViewers.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Products Featured</p>
                    <p className="text-2xl font-bold">{currentStream.products}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Product Spotlight */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Product Spotlight</h2>
              <Button variant="outline" size="sm">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

            <div className="space-y-3">
              {spotlightProducts.map((product) => (
                <Card key={product.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-secondary rounded-lg flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">{product.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>${product.price}</span>
                        <span>•</span>
                        <span>{product.stock} in stock</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-4 mb-1">
                        <div>
                          <p className="text-xs text-muted-foreground">Clicks</p>
                          <p className="font-bold">{product.clicks}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Sales</p>
                          <p className="font-bold text-green-500">{product.conversions}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {((product.conversions / product.clicks) * 100).toFixed(1)}% CVR
                      </p>
                    </div>
                    <Button size="sm">Spotlight</Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Viewer Stats */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Viewer Analytics</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Current</span>
                  <span className="font-bold">{viewerStats.current.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(viewerStats.current / viewerStats.peak) * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Peak</p>
                  <p className="text-xl font-bold">{viewerStats.peak.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Average</p>
                  <p className="text-xl font-bold">{viewerStats.average.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">New</p>
                  <p className="text-xl font-bold text-green-500">
                    {viewerStats.newViewers.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Returning</p>
                  <p className="text-xl font-bold text-blue-500">
                    {viewerStats.returningViewers.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Live Chat */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Live Chat</h2>
              <Badge>{chatMessages.length} messages</Badge>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {chatMessages.map((msg) => (
                <Card
                  key={msg.id}
                  className={`p-3 ${msg.flagged ? "border-red-500/50 bg-red-500/5" : ""}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-bold text-sm">{msg.user}</span>
                    <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                  {msg.flagged && (
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Approve
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1">
                        Ban User
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <div className="mt-4">
              <Input placeholder="Send a message to viewers..." />
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Download Recording
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Eye className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Stream Settings
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* OBS Integration Instructions */}
      {streamStatus === "offline" && (
        <Card className="p-6 bg-blue-500/10 border-blue-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-bold text-blue-500 mb-2">OBS Studio Integration</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Download and install OBS Studio from obsproject.com</li>
                <li>Copy your Stream Key from Settings → Stream Configuration</li>
                <li>In OBS, go to Settings → Stream and select "Custom"</li>
                <li>Paste Server URL: rtmp://live.example.com/app</li>
                <li>Paste your Stream Key and click "Start Streaming"</li>
              </ol>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Missing imports
import { Clock, DollarSign } from "lucide-react";
