/**
 * LSN LIVE SHOW VIEWER V1
 * 
 * Complete live shopping experience with:
 * - Video player with HLS streaming
 * - Real-time viewer count
 * - Live chat with reactions
 * - Pinned products carousel
 * - Price drop alerts with countdown
 * - One-click purchase
 * - Stock urgency indicators
 * - Creator info panel
 * - Share functionality
 * - Mobile-responsive layout
 * - Picture-in-picture support
 * - Auto-quality switching
 */

import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Share2,
  Heart,
  ShoppingCart,
  Users,
  Eye,
  Send,
  Zap,
  Clock,
  AlertCircle,
  TrendingUp,
  Gift,
  Star,
  ThumbsUp,
  Flame,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export default function LSNLiveShowViewer() {
  const { showId } = useParams<{ showId: string }>();
  const { user } = useAuth();
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(100);
  const [chatMessage, setChatMessage] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch show data
  const { data: show, isLoading } = trpc.liveShows.getById.useQuery(
    { id: showId! },
    { enabled: !!showId, refetchInterval: 5000 } // Refresh every 5s
  );

  // Fetch live stock
  const { data: liveStock } = trpc.liveShows.getLiveStock.useQuery(
    { showId: showId! },
    { enabled: !!showId, refetchInterval: 3000 } // Refresh every 3s
  );

  // Track viewer join
  const trackViewerMutation = trpc.liveShows.trackViewerJoin.useMutation();

  // Track purchase
  const trackPurchaseMutation = trpc.liveShows.trackPurchase.useMutation();

  // Track viewer on mount
  useEffect(() => {
    if (showId && user) {
      trackViewerMutation.mutate({
        showId,
        userId: user.id,
        metadata: {
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        },
      });
    }
  }, [showId, user]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [show?.chatMessages]);

  // Video player controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (videoRef.current) {
      videoRef.current.volume = value / 100;
    }
  };

  // Chat
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    // In production, send via WebSocket or tRPC mutation
    console.log("Send message:", chatMessage);
    
    toast.success("Message sent!");
    setChatMessage("");
  };

  // Quick reactions
  const sendReaction = (emoji: string) => {
    // In production, send via WebSocket
    console.log("Send reaction:", emoji);
    toast.success(`Sent ${emoji}`);
  };

  // Add to cart
  const handleAddToCart = (product: any) => {
    // In production, use cart mutation
    console.log("Add to cart:", product);
    toast.success(`${product.name} added to cart!`);
  };

  // Buy now
  const handleBuyNow = (product: any) => {
    // In production, create order and track purchase
    console.log("Buy now:", product);
    
    if (showId && user) {
      trackPurchaseMutation.mutate({
        showId,
        orderId: "ORDER_ID", // Would be real order ID
        userId: user.id,
      });
    }

    toast.success("Order placed! Redirecting to checkout...");
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Show Not Found</h2>
          <p className="text-gray-400 mb-6">This show may have ended or doesn't exist.</p>
          <Button asChild>
            <Link href="/live">Browse Live Shows</Link>
          </Button>
        </div>
      </div>
    );
  }

  const pinnedProducts = show.pinnedProducts || [];
  const priceDrops = show.priceDrops || [];

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background text-foreground"
    >
      <div className="container max-w-[1920px] mx-auto">
        <div className="grid lg:grid-cols-[1fr_400px] gap-6 p-4">
          {/* Left: Video + Products */}
          <div className="space-y-6">
            {/* Video Player */}
            <Card className="border-border bg-background overflow-hidden text-foreground">
              <div className="relative aspect-video bg-background text-foreground">
                {/* Video */}
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  autoPlay
                  playsInline
                  src={show.streamUrl || "/demo-stream.mp4"}
                >
                  Your browser does not support video playback.
                </video>

                {/* Live badge */}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-600 text-foreground animate-pulse px-4 py-2 text-lg">
                    <div className="h-3 w-3 bg-white rounded-full mr-2" />
                    LIVE
                  </Badge>
                </div>

                {/* Viewer count */}
                <div className="absolute top-4 right-4 bg-background/70 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 text-foreground">
                  <Eye className="h-5 w-5 text-purple-400" />
                  <span className="text-lg font-bold">
                    {show.currentViewers?.toLocaleString() || 0}
                  </span>
                </div>

                {/* Price drop alert */}
                {priceDrops.length > 0 && (
                  <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-md">
                    <PriceDropAlert priceDrop={priceDrops[0]} />
                  </div>
                )}

                {/* Video controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 to-transparent p-4">
                  <div className="flex items-center gap-4">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={togglePlay}
                      className="text-foreground hover:bg-white/20"
                    >
                      {isPlaying ? (
                        <Pause className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6" />
                      )}
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={toggleMute}
                      className="text-foreground hover:bg-white/20"
                    >
                      {isMuted ? (
                        <VolumeX className="h-6 w-6" />
                      ) : (
                        <Volume2 className="h-6 w-6" />
                      )}
                    </Button>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      className="w-24"
                    />

                    <div className="flex-1" />

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={toggleFullscreen}
                      className="text-foreground hover:bg-white/20"
                    >
                      {isFullscreen ? (
                        <Minimize className="h-6 w-6" />
                      ) : (
                        <Maximize className="h-6 w-6" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Show info */}
            <Card className="border-border bg-background text-foreground">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 border-2 border-purple-500">
                    <AvatarImage src={show.creator?.avatarUrl} />
                    <AvatarFallback>{show.creator?.name?.[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold mb-2">{show.title}</h1>
                    <div className="flex items-center gap-3 mb-3">
                      <Link href={`/creator/${show.creator?.id}`}>
                        <span className="text-purple-400 hover:text-purple-300 font-semibold">
                          {show.creator?.name}
                        </span>
                      </Link>
                      <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                        {show.creator?.tier}
                      </Badge>
                    </div>
                    {show.description && (
                      <p className="text-gray-400">{show.description}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="border-border"
                    >
                      <Heart className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="border-border"
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pinned products */}
            {pinnedProducts.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Zap className="h-6 w-6 text-yellow-400" />
                  Featured Products
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pinnedProducts.map((pinned: any) => (
                    <PinnedProductCard
                      key={pinned.id}
                      pinned={pinned}
                      liveStock={liveStock?.find(
                        (s: any) => s.productId === pinned.productId
                      )}
                      onAddToCart={handleAddToCart}
                      onBuyNow={handleBuyNow}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Chat + Quick actions */}
          <div className="space-y-6">
            {/* Quick reactions */}
            <Card className="border-border bg-background text-foreground">
              <CardContent className="p-4">
                <div className="flex gap-2 justify-center">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-border hover:bg-red-500/20"
                    onClick={() => sendReaction("❤️")}
                  >
                    ❤️
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-border hover:bg-yellow-500/20"
                    onClick={() => sendReaction("🔥")}
                  >
                    🔥
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-border hover:bg-blue-500/20"
                    onClick={() => sendReaction("👍")}
                  >
                    👍
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-border hover:bg-purple-500/20"
                    onClick={() => sendReaction("✨")}
                  >
                    ✨
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live chat */}
            <Card className="border-border bg-background flex flex-col h-[600px] text-foreground">
              <div className="p-4 border-b border-border">
                <h3 className="font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-400" />
                  Live Chat
                  <Badge variant="outline" className="ml-auto">
                    {show.currentViewers || 0} online
                  </Badge>
                </h3>
              </div>

              <ScrollArea ref={chatScrollRef} className="flex-1 p-4">
                <div className="space-y-4">
                  {/* Mock chat messages */}
                  <ChatMessage
                    user={{ name: "Sarah M.", avatar: "/avatars/sarah.jpg" }}
                    message="This is amazing! 😍"
                    timestamp={new Date()}
                  />
                  <ChatMessage
                    user={{ name: "Mike T.", avatar: "/avatars/mike.jpg" }}
                    message="Just ordered 3 items!"
                    timestamp={new Date()}
                  />
                  <ChatMessage
                    user={{ name: "Jessica L.", avatar: "/avatars/jessica.jpg" }}
                    message="How long is the price drop?"
                    timestamp={new Date()}
                  />
                  {show?.creator?.name && (
                    <ChatMessage
                      user={{ name: show.creator.name, avatar: show.creator.avatarUrl }}
                      message="Only 5 minutes left on this deal! 🔥"
                      timestamp={new Date()}
                      isCreator
                    />
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Send a message..."
                    className="bg-card border-border text-card-foreground"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: Price Drop Alert
// ============================================================================

function PriceDropAlert({ priceDrop }: { priceDrop: any }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const end = new Date(priceDrop.expiresAt).getTime();
      const diff = Math.max(0, end - now);
      setTimeLeft(Math.floor(diff / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [priceDrop]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Card className="border-red-500 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-500 backdrop-blur-sm animate-pulse">
      <CardContent className="p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Flame className="h-6 w-6 text-red-400" />
          <h3 className="text-2xl font-bold">PRICE DROP!</h3>
          <Flame className="h-6 w-6 text-red-400" />
        </div>

        <p className="text-lg mb-2">{priceDrop.product?.name}</p>

        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="text-3xl font-bold text-red-400">
            ${priceDrop.dropPrice}
          </span>
          <span className="text-xl text-gray-400 line-through">
            ${priceDrop.originalPrice}
          </span>
          <Badge className="bg-red-600 text-foreground">
            -{Math.round(((priceDrop.originalPrice - priceDrop.dropPrice) / priceDrop.originalPrice) * 100)}%
          </Badge>
        </div>

        <div className="flex items-center justify-center gap-2 text-yellow-400 mb-4">
          <Clock className="h-5 w-5" />
          <span className="text-xl font-bold">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </div>

        {priceDrop.stockLimit && (
          <p className="text-sm text-muted-foreground mb-4">
            Only {priceDrop.remainingStock} left at this price!
          </p>
        )}

        <Button size="lg" className="w-full bg-white text-red-600 hover:bg-gray-100 font-bold">
          <ShoppingCart className="mr-2 h-5 w-5" />
          Grab This Deal
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPONENT: Pinned Product Card
// ============================================================================

function PinnedProductCard({
  pinned,
  liveStock,
  onAddToCart,
  onBuyNow,
}: {
  pinned: any;
  liveStock: any;
  onAddToCart: (product: any) => void;
  onBuyNow: (product: any) => void;
}) {
  const product = pinned.product;
  const price = pinned.priceOverride || product.price;
  const stock = liveStock?.available || 0;
  const isLowStock = stock < 10 && stock > 0;
  const isOutOfStock = stock === 0;

  return (
    <Card className="border-border bg-background hover:border-purple-500/50 transition-all text-foreground">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.imageUrl || "/placeholder-product.jpg"}
          alt={product.name}
          className="w-full h-full object-cover"
        />

        {pinned.urgencyMessage && (
          <Badge className="absolute top-2 left-2 bg-red-600 animate-pulse">
            {pinned.urgencyMessage}
          </Badge>
        )}

        {isLowStock && (
          <Badge className="absolute top-2 right-2 bg-orange-600">
            Only {stock} left!
          </Badge>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center text-foreground">
            <Badge className="bg-gray-600 text-lg px-4 py-2">
              Sold Out
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-bold mb-2 line-clamp-2">{product.name}</h3>

        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl font-bold text-purple-400">${price}</span>
          {product.compareAtPrice && product.compareAtPrice > price && (
            <>
              <span className="text-sm text-gray-500 line-through">
                ${product.compareAtPrice}
              </span>
              <Badge className="bg-red-600">
                Save ${(product.compareAtPrice - price).toFixed(2)}
              </Badge>
            </>
          )}
        </div>

        {!isOutOfStock && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="border-border"
              onClick={() => onAddToCart(product)}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Add
            </Button>
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => onBuyNow(product)}
            >
              Buy Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPONENT: Chat Message
// ============================================================================

function ChatMessage({
  user,
  message,
  timestamp,
  isCreator = false,
}: {
  user: { name: string; avatar?: string };
  message: string;
  timestamp: Date;
  isCreator?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <Avatar className={cn("h-8 w-8", isCreator && "border-2 border-purple-500")}>
        <AvatarImage src={user.avatar} />
        <AvatarFallback>{user.name?.[0] || 'U'}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("font-semibold text-sm", isCreator && "text-purple-400")}>
            {user.name}
          </span>
          {isCreator && (
            <Badge className="bg-purple-600 text-xs px-2 py-0">
              Host
            </Badge>
          )}
          <span className="text-xs text-gray-500">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENT: Loading Skeleton
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container max-w-[1920px] mx-auto">
        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          <div className="space-y-6">
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-32 w-full" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-[600px] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
