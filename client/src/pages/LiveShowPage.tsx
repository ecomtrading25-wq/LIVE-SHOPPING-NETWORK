import { useParams, useLocation } from 'wouter';
import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, 
  Share2, 
  Gift, 
  Users, 
  ShoppingCart, 
  Send, 
  Eye,
  Star,
  MessageCircle,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Maximize,
  X
} from 'lucide-react';

export default function LiveShowPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // State management
  const [message, setMessage] = useState('');
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);

  // tRPC queries
  const { data: show, isLoading: showLoading } = trpc.liveStreaming.getShow.useQuery(
    { showId: id || '' },
    { enabled: !!id, refetchInterval: 5000 }
  );

  const { data: messages = [], refetch: refetchMessages } = trpc.liveStreaming.getChatMessages.useQuery(
    { showId: id || '', limit: 100 },
    { enabled: !!id, refetchInterval: 2000 }
  );

  const { data: products = [] } = trpc.liveStreaming.getShowProducts.useQuery(
    { showId: id || '' },
    { enabled: !!id }
  );

  const { data: gifts = [] } = trpc.liveStreaming.listGifts.useQuery();

  const { data: viewerCount = 0 } = trpc.liveStreaming.getViewerCount.useQuery(
    { showId: id || '' },
    { enabled: !!id, refetchInterval: 3000 }
  );

  // Mutations
  const joinShow = trpc.liveStreaming.joinShow.useMutation();
  const leaveShow = trpc.liveStreaming.leaveShow.useMutation();
  const sendMessage = trpc.liveStreaming.sendChatMessage.useMutation({
    onSuccess: () => {
      setMessage('');
      refetchMessages();
    }
  });
  const sendGift = trpc.liveStreaming.sendGift.useMutation({
    onSuccess: () => {
      toast({
        title: '🎁 Gift Sent!',
        description: 'Your gift has been sent to the host',
      });
      setShowGiftModal(false);
      setSelectedGift(null);
    }
  });

  // Auto-join show on mount
  useEffect(() => {
    if (id) {
      joinShow.mutate({ showId: id });
      return () => {
        leaveShow.mutate({ showId: id });
      };
    }
  }, [id]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle like
  const handleLike = () => {
    if (!hasLiked) {
      setLikes(prev => prev + 1);
      setHasLiked(true);
      toast({ title: '❤️ Liked!', duration: 1000 });
    }
  };

  // Handle follow
  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast({
      title: isFollowing ? 'Unfollowed' : '✨ Following!',
      description: isFollowing ? 'You unfollowed this host' : 'You will be notified of new shows',
    });
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!message.trim() || !id) return;
    sendMessage.mutate({
      showId: id,
      message: message.trim()
    });
  };

  // Handle send gift
  const handleSendGift = (giftId: string) => {
    if (!id) return;
    sendGift.mutate({ showId: id, giftId });
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-pink-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading live show...</p>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-pink-900">
        <Card className="bg-black/50 border-pink-500/20">
          <CardContent className="p-8 text-center">
            <p className="text-white text-xl mb-4">Show not found</p>
            <Button onClick={() => setLocation('/')} variant="outline">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Player */}
            <Card className="bg-black border-pink-500/20 overflow-hidden">
              <div className="relative aspect-video bg-black">
                {/* Placeholder video player - replace with actual streaming */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  poster="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=675&fit=crop"
                  muted={isMuted}
                  autoPlay
                  loop
                >
                  <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
                </video>

                {/* LIVE Badge */}
                {show.status === 'LIVE' && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-red-500 text-white animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full mr-2 animate-ping"></div>
                      LIVE
                    </Badge>
                  </div>
                )}

                {/* Viewer Count */}
                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
                  <Eye className="w-4 h-4 text-pink-400" />
                  <span className="text-white font-semibold">{viewerCount.toLocaleString()}</span>
                </div>

                {/* Video Controls */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="bg-black/70 backdrop-blur-sm hover:bg-black/90"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="bg-black/70 backdrop-blur-sm hover:bg-black/90"
                    onClick={toggleFullscreen}
                  >
                    <Maximize className="w-4 h-4" />
                  </Button>
                </div>

                {/* Floating Like Animation */}
                {hasLiked && (
                  <div className="absolute bottom-20 right-8 animate-float-up">
                    <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                  </div>
                )}
              </div>
            </Card>

            {/* Host Info */}
            <Card className="bg-black/50 border-pink-500/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                      {show.title.charAt(0)}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white mb-1">{show.title}</h1>
                      <p className="text-gray-400">{show.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {viewerCount} watching
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {likes} likes
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={isFollowing ? "secondary" : "default"}
                      onClick={handleFollow}
                      className={isFollowing ? "" : "bg-gradient-to-r from-pink-500 to-purple-500"}
                    >
                      {isFollowing ? (
                        <>
                          <BellOff className="w-4 h-4 mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <Bell className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="icon">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Featured Products */}
            {products.length > 0 && (
              <Card className="bg-black/50 border-pink-500/20">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-pink-400" />
                    Featured Products
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <Card key={product.id} className="bg-white/5 border-pink-500/10 hover:border-pink-500/30 transition-all cursor-pointer group">
                        <CardContent className="p-4">
                          <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg mb-3 flex items-center justify-center">
                            <ShoppingCart className="w-12 h-12 text-pink-400 group-hover:scale-110 transition-transform" />
                          </div>
                          <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">
                            Product {product.productId}
                          </h3>
                          <div className="flex items-center justify-between">
                            <span className="text-pink-400 font-bold">$99.99</span>
                            <Button size="sm" className="bg-gradient-to-r from-pink-500 to-purple-500">
                              Buy
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chat & Interaction Sidebar */}
          <div className="space-y-4">
            {/* Interaction Buttons */}
            <Card className="bg-black/50 border-pink-500/20">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    className={`flex flex-col items-center gap-2 h-auto py-4 ${hasLiked ? 'bg-red-500/20 border-red-500' : ''}`}
                    onClick={handleLike}
                  >
                    <Heart className={`w-6 h-6 ${hasLiked ? 'text-red-500 fill-red-500' : 'text-pink-400'}`} />
                    <span className="text-xs">{likes}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => setShowGiftModal(true)}
                  >
                    <Gift className="w-6 h-6 text-purple-400" />
                    <span className="text-xs">Gift</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <Share2 className="w-6 h-6 text-blue-400" />
                    <span className="text-xs">Share</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Chat Section */}
            <Card className="bg-black/50 border-pink-500/20 h-[600px] flex flex-col">
              <div className="p-4 border-b border-pink-500/20">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-pink-400" />
                  Live Chat
                  <Badge variant="secondary" className="ml-auto">{messages.length}</Badge>
                </h3>
              </div>
              
              <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {msg.userId.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white">User {msg.userId.slice(-4)}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 break-words">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-pink-500/20">
                <div className="flex gap-2">
                  <Input
                    placeholder="Say something..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="bg-white/5 border-pink-500/20 text-white placeholder:text-gray-500"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="bg-gradient-to-r from-pink-500 to-purple-500"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Gift Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="bg-gradient-to-br from-purple-900 to-black border-pink-500/20 max-w-2xl w-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Gift className="w-6 h-6 text-pink-400" />
                  Send a Gift
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowGiftModal(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {gifts.map((gift) => (
                  <Card
                    key={gift.id}
                    className={`bg-white/5 border-2 cursor-pointer hover:border-pink-500 transition-all ${
                      selectedGift === gift.id ? 'border-pink-500 bg-pink-500/10' : 'border-pink-500/10'
                    }`}
                    onClick={() => setSelectedGift(gift.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-4xl mb-2">{gift.icon}</div>
                      <h3 className="font-semibold text-white text-sm mb-1">{gift.name}</h3>
                      <p className="text-pink-400 font-bold">${gift.price}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                onClick={() => selectedGift && handleSendGift(selectedGift)}
                disabled={!selectedGift}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-lg py-6"
              >
                Send Gift
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
