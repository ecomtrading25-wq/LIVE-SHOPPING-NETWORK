import { useState, useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Heart,
  MessageCircle,
  Share2,
  ShoppingCart,
  Users,
  Send,
  Gift,
  MoreVertical,
  Volume2,
  VolumeX,
  Maximize,
  X
} from 'lucide-react';

export default function LiveShowViewer() {
  const { showId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [message, setMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [watchStartTime] = useState(Date.now());
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch show data
  const { data: show, isLoading: showLoading } = trpc.liveStreaming.getShow.useQuery(
    { showId: showId! },
    { enabled: !!showId, refetchInterval: 5000 }
  );
  
  // Fetch products
  const { data: products } = trpc.liveStreaming.getShowProducts.useQuery(
    { showId: showId! },
    { enabled: !!showId }
  );
  
  // Fetch chat messages
  const { data: messages, refetch: refetchMessages } = trpc.liveStreaming.getChatMessages.useQuery(
    { showId: showId!, limit: 50 },
    { enabled: !!showId, refetchInterval: 2000 }
  );
  
  // Join show
  const joinShowMutation = trpc.liveStreaming.joinShow.useMutation({
    onSuccess: (data) => {
      setViewerId(data.viewerId);
      toast({
        title: 'Joined show',
        description: 'You are now watching the live show',
      });
    },
  });
  
  // Leave show
  const leaveShowMutation = trpc.liveStreaming.leaveShow.useMutation();
  
  // Send message
  const sendMessageMutation = trpc.liveStreaming.sendMessage.useMutation({
    onSuccess: () => {
      setMessage('');
      refetchMessages();
      
      // Scroll to bottom
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    },
  });
  
  // Join show on mount
  useEffect(() => {
    if (showId && user && !viewerId) {
      joinShowMutation.mutate({ showId });
    }
  }, [showId, user]);
  
  // Leave show on unmount
  useEffect(() => {
    return () => {
      if (viewerId && showId) {
        const watchDuration = Math.floor((Date.now() - watchStartTime) / 1000);
        leaveShowMutation.mutate({ showId, viewerId, watchDuration });
      }
    };
  }, [viewerId, showId]);
  
  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSendMessage = () => {
    if (!message.trim() || !showId) return;
    
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login to chat',
        variant: 'destructive',
      });
      return;
    }
    
    sendMessageMutation.mutate({
      showId,
      message: message.trim(),
      messageType: 'text',
    });
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  if (showLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center text-foreground">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading show...</p>
        </div>
      </div>
    );
  }
  
  if (!show) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center text-foreground">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Show Not Found</h2>
          <p className="text-muted-foreground">This live show doesn't exist or has been removed.</p>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-background/50 backdrop-blur text-foreground">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <X className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">{show.title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Badge variant="destructive" className="animate-pulse">
                  <span className="w-2 h-2 bg-background text-foreground rounded-full mr-1"></span>
                  LIVE
                </Badge>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {show.peakViewers || 0} watching
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Video Player */}
          <div className="flex-1 relative bg-background rounded-lg overflow-hidden text-foreground">
            {show.playbackUrl ? (
              <video
                ref={videoRef}
                src={show.playbackUrl}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-lg">Connecting to stream...</p>
                </div>
              </div>
            )}
            
            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/30 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={toggleMute}>
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                </div>
                
                <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            {/* Product Overlay */}
            {selectedProduct && (
              <div className="absolute bottom-20 left-4 right-4">
                <Card className="p-4 bg-background/80 backdrop-blur border-primary text-foreground">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedProduct.imageUrl || 'https://via.placeholder.com/80'}
                      alt={selectedProduct.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold">{selectedProduct.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold text-primary">
                          ${selectedProduct.livePrice || selectedProduct.price}
                        </span>
                        {selectedProduct.discount && (
                          <Badge variant="destructive">-{selectedProduct.discount}%</Badge>
                        )}
                      </div>
                    </div>
                    <Button size="lg" className="gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Buy Now
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="w-96 flex flex-col gap-4">
            {/* Products */}
            <Card className="p-4 bg-background border-border text-foreground">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Featured Products
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {products?.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="w-full flex items-center gap-3 p-2 rounded hover:bg-card transition-colors text-left"
                  >
                    <img
                      src={product.imageUrl || 'https://via.placeholder.com/50'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{product.name}</p>
                      <p className="text-primary font-bold">
                        ${product.livePrice || product.price}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
            
            {/* Chat */}
            <Card className="flex-1 flex flex-col bg-background border-border overflow-hidden text-foreground">
              <div className="p-4 border-b border-border">
                <h3 className="font-bold flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Live Chat
                  <span className="text-sm text-gray-400">({messages?.length || 0})</span>
                </h3>
              </div>
              
              {/* Messages */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {messages?.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                      {msg.userId?.toString().slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">User {msg.userId}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm break-words">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={user ? "Say something..." : "Login to chat"}
                    disabled={!user}
                    className="flex-1 bg-card border-border text-card-foreground"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || !user}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Gift className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
