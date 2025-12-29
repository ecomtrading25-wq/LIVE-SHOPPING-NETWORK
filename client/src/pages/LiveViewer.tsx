import { useState, useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Heart,
  MessageCircle,
  Share2,
  ShoppingCart,
  Users,
  Gift,
  Send,
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Settings,
  ThumbsUp,
  Star,
  Sparkles,
  Flame,
  Crown,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Live Viewer Interface
 * Complete viewer experience for live shopping shows
 * - HLS video player with controls
 * - Real-time chat with emoji reactions
 * - Product showcase carousel
 * - One-click purchase flow
 * - Virtual gifts and engagement
 * - Social sharing
 */

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: Date;
  isHost?: boolean;
  isPinned?: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  stock: number;
  isPinned: boolean;
}

interface VirtualGift {
  id: string;
  name: string;
  icon: string;
  price: number;
  animation: string;
}

export default function LiveViewer() {
  const params = useParams();
  const { user } = useAuth();
  const showId = params.showId || 'default';
  
  // Video player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  
  // Show data
  const [viewerCount, setViewerCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [pinnedProduct, setPinnedProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Gifts state
  const [showGifts, setShowGifts] = useState(false);
  const [giftAnimations, setGiftAnimations] = useState<Array<{ id: string; gift: VirtualGift }>>([]);
  
  // Virtual gifts catalog
  const virtualGifts: VirtualGift[] = [
    { id: 'heart', name: 'Heart', icon: '❤️', price: 1, animation: 'bounce' },
    { id: 'star', name: 'Star', icon: '⭐', price: 2, animation: 'spin' },
    { id: 'fire', name: 'Fire', icon: '🔥', price: 3, animation: 'pulse' },
    { id: 'gem', name: 'Gem', icon: '💎', price: 5, animation: 'sparkle' },
    { id: 'crown', name: 'Crown', icon: '👑', price: 10, animation: 'float' },
    { id: 'rocket', name: 'Rocket', icon: '🚀', price: 20, animation: 'fly' },
  ];
  
  // Fetch show data
  useEffect(() => {
    // TODO: Replace with actual tRPC call
    // const { data: show } = trpc.streaming.getShowStatus.useQuery({ showId });
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 10) - 5);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [showId]);
  
  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  // Load mock data
  useEffect(() => {
    // Mock products
    setProducts([
      {
        id: '1',
        name: 'Premium Wireless Headphones',
        price: 79.99,
        originalPrice: 129.99,
        image: 'https://via.placeholder.com/400x400?text=Headphones',
        description: 'High-quality sound with active noise cancellation',
        stock: 15,
        isPinned: true,
      },
      {
        id: '2',
        name: 'Smart Watch Pro',
        price: 199.99,
        image: 'https://via.placeholder.com/400x400?text=Watch',
        description: 'Track your fitness and stay connected',
        stock: 8,
        isPinned: false,
      },
      {
        id: '3',
        name: 'Portable Bluetooth Speaker',
        price: 49.99,
        originalPrice: 79.99,
        image: 'https://via.placeholder.com/400x400?text=Speaker',
        description: 'Powerful sound in a compact design',
        stock: 25,
        isPinned: false,
      },
    ]);
    
    setPinnedProduct({
      id: '1',
      name: 'Premium Wireless Headphones',
      price: 79.99,
      originalPrice: 129.99,
      image: 'https://via.placeholder.com/400x400?text=Headphones',
      description: 'High-quality sound with active noise cancellation',
      stock: 15,
      isPinned: true,
    });
    
    // Mock chat messages
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        userId: 'host',
        userName: 'Host',
        message: 'Welcome to the show! 🎉',
        timestamp: new Date(),
        isHost: true,
      },
      {
        id: '2',
        userId: 'user1',
        userName: 'Sarah',
        message: 'These headphones look amazing!',
        timestamp: new Date(),
      },
      {
        id: '3',
        userId: 'user2',
        userName: 'Mike',
        message: 'What colors are available?',
        timestamp: new Date(),
      },
    ];
    setChatMessages(mockMessages);
  }, []);
  
  const handleSendMessage = () => {
    if (!chatInput.trim() || !user) {
      if (!user) {
        toast.error('Please login to chat');
      }
      return;
    }
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: user.id.toString(),
      userName: user.name || 'Anonymous',
      message: chatInput,
      timestamp: new Date(),
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');
    
    // TODO: Send via tRPC
    // trpc.streaming.sendChatMessage.mutate({ showId, message: chatInput });
  };
  
  const handleLike = () => {
    if (!user) {
      toast.error('Please login to like');
      return;
    }
    
    setHasLiked(!hasLiked);
    setLikeCount(prev => hasLiked ? prev - 1 : prev + 1);
    
    // TODO: Send via tRPC
    // trpc.streaming.likeShow.mutate({ showId });
  };
  
  const handleSendGift = (gift: VirtualGift) => {
    if (!user) {
      toast.error('Please login to send gifts');
      return;
    }
    
    // Add gift animation
    const animationId = Date.now().toString();
    setGiftAnimations(prev => [...prev, { id: animationId, gift }]);
    
    // Remove animation after 3 seconds
    setTimeout(() => {
      setGiftAnimations(prev => prev.filter(a => a.id !== animationId));
    }, 3000);
    
    toast.success(`Sent ${gift.name} ${gift.icon}`);
    setShowGifts(false);
    
    // TODO: Send via tRPC
    // trpc.streaming.sendGift.mutate({ showId, giftId: gift.id });
  };
  
  const handleBuyNow = (product: Product) => {
    if (!user) {
      toast.error('Please login to purchase');
      return;
    }
    
    setSelectedProduct(product);
    toast.success(`Added ${product.name} to cart`);
    
    // TODO: Implement checkout flow
    // trpc.orders.createOrder.mutate({ productId: product.id, showId });
  };
  
  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
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
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  const formatViewerCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative h-screen flex flex-col lg:flex-row">
        {/* Video Player Section */}
        <div className="flex-1 relative bg-background text-foreground">
          {/* Video Player */}
          <div className="absolute inset-0 flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              autoPlay
              muted={isMuted}
              playsInline
            >
              <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
            </video>
            
            {/* Overlay Controls */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none" />
            
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-3">
                <Badge variant="destructive" className="animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full mr-2" />
                  LIVE
                </Badge>
                <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-foreground">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{formatViewerCount(viewerCount)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="bg-background/50 backdrop-blur-sm hover:bg-background/70 text-foreground"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="bg-background/50 backdrop-blur-sm hover:bg-background/70 text-foreground"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            {/* Pinned Product Overlay */}
            {pinnedProduct && (
              <div className="absolute bottom-20 left-4 right-4 lg:left-4 lg:right-auto lg:w-96 pointer-events-auto">
                <Card className="bg-background/80 backdrop-blur-md border-purple-500/50 text-foreground">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <img
                        src={pinnedProduct.image}
                        alt={pinnedProduct.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm mb-1 truncate">{pinnedProduct.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {pinnedProduct.description}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-bold text-purple-400">
                            {formatCurrency(pinnedProduct.price)}
                          </span>
                          {pinnedProduct.originalPrice && (
                            <span className="text-sm text-gray-400 line-through">
                              {formatCurrency(pinnedProduct.originalPrice)}
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          onClick={() => handleBuyNow(pinnedProduct)}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Buy Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
            
            {/* Bottom Controls */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="bg-background/50 backdrop-blur-sm hover:bg-background/70 text-foreground"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className={`bg-background/50 backdrop-blur-sm hover:bg-background/70 ${hasLiked ? 'text-red-500' : ''}`}
                  onClick={handleLike}
                >
                  <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
                </Button>
                <span className="text-sm font-medium bg-background/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  {likeCount}
                </span>
              </div>
            </div>
            
            {/* Gift Animations */}
            {giftAnimations.map(({ id, gift }) => (
              <div
                key={id}
                className="absolute bottom-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl animate-bounce pointer-events-none"
                style={{ animation: `${gift.animation} 3s ease-out` }}
              >
                {gift.icon}
              </div>
            ))}
          </div>
        </div>

        {/* Chat & Products Sidebar */}
        <div className="w-full lg:w-96 bg-background flex flex-col text-foreground">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              className={`flex-1 px-4 py-3 font-medium transition-colors ${
                isChatExpanded ? 'bg-card text-foreground' : 'text-gray-400 hover:text-foreground'
              }`}
              onClick={() => setIsChatExpanded(true)}
            >
              <MessageCircle className="w-4 h-4 inline mr-2" />
              Chat
            </button>
            <button
              className={`flex-1 px-4 py-3 font-medium transition-colors ${
                !isChatExpanded ? 'bg-card text-foreground' : 'text-gray-400 hover:text-foreground'
              }`}
              onClick={() => setIsChatExpanded(false)}
            >
              <ShoppingCart className="w-4 h-4 inline mr-2" />
              Products
            </button>
          </div>

          {/* Chat Section */}
          {isChatExpanded ? (
            <div className="flex-1 flex flex-col">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
                <div className="space-y-3">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={msg.userAvatar} />
                        <AvatarFallback>{msg.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-medium ${msg.isHost ? 'text-purple-400' : 'text-muted-foreground'}`}>
                            {msg.userName}
                          </span>
                          {msg.isHost && <Crown className="w-3 h-3 text-yellow-500" />}
                        </div>
                        <p className="text-sm text-foreground break-words">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                    onClick={() => setShowGifts(!showGifts)}
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Send Gift
                  </Button>
                </div>

                {/* Gift Selector */}
                {showGifts && (
                  <div className="grid grid-cols-3 gap-2 mb-3 p-3 bg-card rounded-lg text-card-foreground">
                    {virtualGifts.map((gift) => (
                      <button
                        key={gift.id}
                        className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-700 transition-colors"
                        onClick={() => handleSendGift(gift)}
                      >
                        <span className="text-2xl">{gift.icon}</span>
                        <span className="text-xs text-gray-400">${gift.price}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Input
                    placeholder={user ? "Send a message..." : "Login to chat"}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={!user}
                    className="bg-card border-border text-foreground placeholder:text-gray-500"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!user || !chatInput.trim()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Products Section */
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {products.map((product) => (
                  <Card key={product.id} className="bg-card border-border overflow-hidden text-card-foreground">
                    <div className="relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                      {product.isPinned && (
                        <Badge className="absolute top-2 right-2 bg-purple-600">
                          Pinned
                        </Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl font-bold text-purple-400">
                          {formatCurrency(product.price)}
                        </span>
                        {product.originalPrice && (
                          <>
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrency(product.originalPrice)}
                            </span>
                            <Badge variant="destructive" className="ml-auto">
                              {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                            </Badge>
                          </>
                        )}
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant={product.stock > 10 ? "default" : "destructive"}>
                          {product.stock} left
                        </Badge>
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        onClick={() => handleBuyNow(product)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy Now
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
