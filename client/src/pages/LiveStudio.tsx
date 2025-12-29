/**
 * LIVE STREAMING STUDIO
 * Complete live broadcasting interface with Agora WebRTC integration,
 * stream controls, viewer analytics, and product showcasing
 */

import { useState, useEffect, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Settings,
  Users,
  Eye,
  MessageCircle,
  ShoppingBag,
  Activity,
  Signal,
  AlertCircle,
  Play,
  Square,
} from 'lucide-react';

export default function LiveStudio() {
  const [isLive, setIsLive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamQuality, setStreamQuality] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA'>('HIGH');
  const [streamHealth, setStreamHealth] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent');
  
  const videoRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);

  // Mock stream stats
  const [streamStats, setStreamStats] = useState({
    bitrate: 1500,
    frameRate: 30,
    resolution: '1280x720',
    droppedFrames: 0,
    latency: 120,
    duration: 0,
  });

  // Mock viewer analytics
  const [analytics, setAnalytics] = useState({
    peakViewers: 0,
    totalViews: 0,
    averageWatchTime: 0,
    chatMessages: 0,
    productsShown: 0,
    conversions: 0,
  });

  // Mock chat messages
  const [chatMessages, setChatMessages] = useState([
    { id: '1', user: 'Sarah', message: 'This looks amazing!', timestamp: new Date() },
    { id: '2', user: 'Mike', message: 'How much is the headphones?', timestamp: new Date() },
    { id: '3', user: 'Emma', message: 'Just ordered! 🎉', timestamp: new Date() },
  ]);

  // Mock featured products
  const [featuredProducts, setFeaturedProducts] = useState([
    {
      id: 'prod_1',
      name: 'Wireless Headphones Pro',
      price: 299.99,
      image: '/placeholder.jpg',
      stock: 45,
      isPinned: true,
    },
    {
      id: 'prod_2',
      name: 'Smart Watch Ultra',
      price: 399.99,
      image: '/placeholder.jpg',
      stock: 32,
      isPinned: false,
    },
  ]);

  useEffect(() => {
    // Initialize Agora client
    clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

    return () => {
      // Cleanup on unmount
      if (clientRef.current) {
        clientRef.current.leave();
      }
    };
  }, []);

  const startBroadcast = async () => {
    try {
      // In production, get token from backend
      const appId = 'YOUR_AGORA_APP_ID';
      const channel = `show_${Date.now()}`;
      const token = null; // Get from backend

      if (!clientRef.current) return;

      // Join channel
      await clientRef.current.join(appId, channel, token, null);

      // Create and publish video track
      videoTrackRef.current = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: {
          width: 1280,
          height: 720,
          frameRate: 30,
          bitrateMin: 1000,
          bitrateMax: 2000,
        },
      });

      // Create and publish audio track
      audioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();

      // Play local video
      if (videoRef.current && videoTrackRef.current) {
        videoTrackRef.current.play(videoRef.current);
      }

      // Publish tracks
      await clientRef.current.publish([videoTrackRef.current, audioTrackRef.current]);

      setIsLive(true);

      // Start monitoring stream health
      startHealthMonitoring();
    } catch (error) {
      console.error('Failed to start broadcast:', error);
    }
  };

  const stopBroadcast = async () => {
    try {
      if (videoTrackRef.current) {
        videoTrackRef.current.stop();
        videoTrackRef.current.close();
      }

      if (audioTrackRef.current) {
        audioTrackRef.current.stop();
        audioTrackRef.current.close();
      }

      if (clientRef.current) {
        await clientRef.current.leave();
      }

      setIsLive(false);
    } catch (error) {
      console.error('Failed to stop broadcast:', error);
    }
  };

  const toggleVideo = async () => {
    if (videoTrackRef.current) {
      await videoTrackRef.current.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = async () => {
    if (audioTrackRef.current) {
      await audioTrackRef.current.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleScreenShare = async () => {
    // Implement screen sharing logic
    setIsScreenSharing(!isScreenSharing);
  };

  const startHealthMonitoring = () => {
    // Monitor stream health every 5 seconds
    const interval = setInterval(() => {
      if (!isLive) {
        clearInterval(interval);
        return;
      }

      // Update stats (would get from Agora in production)
      setStreamStats(prev => ({
        ...prev,
        duration: prev.duration + 5,
        droppedFrames: prev.droppedFrames + Math.floor(Math.random() * 3),
      }));

      // Simulate viewer count changes
      setViewerCount(prev => Math.max(0, prev + Math.floor(Math.random() * 10) - 5));
    }, 5000);
  };

  const pinProduct = (productId: string) => {
    setFeaturedProducts(products =>
      products.map(p =>
        p.id === productId ? { ...p, isPinned: !p.isPinned } : { ...p, isPinned: false }
      )
    );
  };

  const getHealthColor = () => {
    switch (streamHealth) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
    }
  };

  const getHealthIcon = () => {
    switch (streamHealth) {
      case 'excellent': return <Signal className="w-5 h-5 text-green-500" />;
      case 'good': return <Signal className="w-5 h-5 text-blue-500" />;
      case 'fair': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'poor': return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Live Studio</h1>
            <p className="text-gray-400">Professional broadcasting tools</p>
          </div>
          <div className="flex items-center gap-4">
            {isLive && (
              <Badge className="bg-red-500 animate-pulse px-4 py-2 text-lg">
                <div className="w-3 h-3 bg-background text-foreground rounded-full mr-2" />
                LIVE
              </Badge>
            )}
            <div className="flex items-center gap-2 text-gray-400">
              <Users className="w-5 h-5" />
              <span className="text-2xl font-bold text-foreground">{viewerCount}</span>
              <span className="text-sm">viewers</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Preview */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-card border-border overflow-hidden text-card-foreground">
              <div className="relative aspect-video bg-background text-foreground">
                <div ref={videoRef} className="w-full h-full" />
                
                {!isLive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 text-foreground">
                    <div className="text-center">
                      <Video className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                      <p className="text-gray-400 mb-4">Ready to go live</p>
                      <Button
                        size="lg"
                        onClick={startBroadcast}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Start Broadcasting
                      </Button>
                    </div>
                  </div>
                )}

                {/* Stream Info Overlay */}
                {isLive && (
                  <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                    <div className="space-y-2">
                      <Badge className="bg-background/60 backdrop-blur text-foreground">
                        {streamStats.resolution} • {streamStats.frameRate}fps
                      </Badge>
                      <div className="flex items-center gap-2 bg-background/60 backdrop-blur px-3 py-1 rounded-full text-foreground">
                        {getHealthIcon()}
                        <span className="text-sm capitalize">{streamHealth}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="bg-background text-foreground/60 backdrop-blur px-3 py-1 rounded-full text-sm">
                        {Math.floor(streamStats.duration / 60)}:{(streamStats.duration % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="bg-background text-foreground/60 backdrop-blur px-3 py-1 rounded-full text-sm">
                        {streamStats.bitrate} kbps
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="p-4 bg-card border-t border-border text-card-foreground">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isVideoEnabled ? 'default' : 'destructive'}
                      size="lg"
                      onClick={toggleVideo}
                      disabled={!isLive}
                    >
                      {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant={isAudioEnabled ? 'default' : 'destructive'}
                      size="lg"
                      onClick={toggleAudio}
                      disabled={!isLive}
                    >
                      {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant={isScreenSharing ? 'default' : 'outline'}
                      size="lg"
                      onClick={toggleScreenShare}
                      disabled={!isLive}
                    >
                      {isScreenSharing ? <Monitor className="w-5 h-5" /> : <MonitorOff className="w-5 h-5" />}
                    </Button>
                    <Button variant="outline" size="lg" disabled={!isLive}>
                      <Settings className="w-5 h-5" />
                    </Button>
                  </div>

                  {isLive && (
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={stopBroadcast}
                    >
                      <Square className="w-5 h-5 mr-2" />
                      End Stream
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Stream Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-card border-border p-4 text-card-foreground">
                <p className="text-sm text-gray-400 mb-1">Bitrate</p>
                <p className="text-2xl font-bold">{streamStats.bitrate}</p>
                <p className="text-xs text-gray-500">kbps</p>
              </Card>
              <Card className="bg-card border-border p-4 text-card-foreground">
                <p className="text-sm text-gray-400 mb-1">Frame Rate</p>
                <p className="text-2xl font-bold">{streamStats.frameRate}</p>
                <p className="text-xs text-gray-500">fps</p>
              </Card>
              <Card className="bg-card border-border p-4 text-card-foreground">
                <p className="text-sm text-gray-400 mb-1">Latency</p>
                <p className="text-2xl font-bold">{streamStats.latency}</p>
                <p className="text-xs text-gray-500">ms</p>
              </Card>
              <Card className="bg-card border-border p-4 text-card-foreground">
                <p className="text-sm text-gray-400 mb-1">Dropped</p>
                <p className="text-2xl font-bold">{streamStats.droppedFrames}</p>
                <p className="text-xs text-gray-500">frames</p>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chat">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="products">
                  <ShoppingBag className="w-4 h-4 mr-1" />
                  Products
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <Activity className="w-4 h-4 mr-1" />
                  Stats
                </TabsTrigger>
              </TabsList>

              {/* Chat Tab */}
              <TabsContent value="chat" className="mt-4">
                <Card className="bg-card border-border h-[600px] flex flex-col text-card-foreground">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.map(msg => (
                      <div key={msg.id} className="bg-gray-700/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{msg.user}</span>
                          <span className="text-xs text-gray-500">
                            {msg.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-border">
                    <input
                      type="text"
                      placeholder="Send a message..."
                      className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={!isLive}
                    />
                  </div>
                </Card>
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products" className="mt-4">
                <Card className="bg-card border-border p-4 h-[600px] overflow-y-auto text-card-foreground">
                  <div className="space-y-3">
                    {featuredProducts.map(product => (
                      <div
                        key={product.id}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          product.isPinned
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-border bg-gray-700/50'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="w-16 h-16 bg-gray-600 rounded-lg flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1 truncate">
                              {product.name}
                            </h4>
                            <p className="text-lg font-bold text-red-400">
                              ${product.price}
                            </p>
                            <p className="text-xs text-gray-400">
                              {product.stock} in stock
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={product.isPinned ? 'default' : 'outline'}
                          className="w-full mt-3"
                          onClick={() => pinProduct(product.id)}
                          disabled={!isLive}
                        >
                          {product.isPinned ? 'Unpin' : 'Pin to Stream'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="mt-4">
                <Card className="bg-card border-border p-4 space-y-4 text-card-foreground">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Peak Viewers</span>
                      <Eye className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-3xl font-bold">{analytics.peakViewers}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Total Views</span>
                      <Users className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-3xl font-bold">{analytics.totalViews}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Chat Messages</span>
                      <MessageCircle className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-3xl font-bold">{analytics.chatMessages}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Conversions</span>
                      <ShoppingBag className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-3xl font-bold">{analytics.conversions}</p>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
