import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Users, Heart, Share2, 
  ShoppingCart, MessageCircle, Send, Gift, Star, TrendingUp, Clock,
  Eye, Zap, Package, DollarSign, AlertCircle, CheckCircle, X
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { toast } from "sonner";

/**
 * LSN Live Shopping Experience
 * Full-featured live commerce interface with:
 * - Live video streaming
 * - Real-time chat
 * - Product pinning with live stock
 * - Price drops & urgency timers
 * - Interactive engagement (gifts, reactions)
 * - Instant checkout
 */

interface LiveShowExperienceProps {
  showId: string;
}

export default function LiveShoppingExperience({ showId }: LiveShowExperienceProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Video controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Chat state
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Engagement state
  const [viewerCount, setViewerCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // Product state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [cartItems, setCartItems] = useState<Map<string, number>>(new Map());

  // Fetch show data
  const { data: show, isLoading } = trpc.lsn.liveShow.getShow.useQuery({ showId });
  
  // Fetch pinned products
  const { data: pinnedProducts } = trpc.lsn.liveShow.getPinnedProducts.useQuery({ showId });

  // Fetch live stock
  const { data: liveStock } = trpc.lsn.liveShow.getLiveStock.useQuery({ showId }, {
    refetchInterval: 2000, // Update every 2 seconds
  });

  // Fetch chat messages
  const { data: chatData } = trpc.lsn.liveShow.getChatMessages.useQuery({ 
    showId, 
    limit: 100 
  }, {
    refetchInterval: 1000, // Update every second
  });

  // Mutations
  const sendChatMutation = trpc.lsn.liveShow.sendChatMessage.useMutation({
    onSuccess: () => {
      setChatMessage("");
    },
  });

  const addToCartMutation = trpc.cart.addItem.useMutation({
    onSuccess: () => {
      toast.success("Added to cart!");
    },
  });

  const sendGiftMutation = trpc.lsn.liveShow.sendGift.useMutation({
    onSuccess: () => {
      toast.success("Gift sent!");
    },
  });

  const toggleLikeMutation = trpc.lsn.liveShow.toggleLike.useMutation({
    onSuccess: (data) => {
      setHasLiked(data.liked);
      setLikeCount(data.totalLikes);
    },
  });

  // Update messages when chat data changes
  useEffect(() => {
    if (chatData?.messages) {
      setMessages(chatData.messages);
      // Auto-scroll to bottom
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }
  }, [chatData]);

  // Update viewer count
  useEffect(() => {
    if (show?.viewerCount) {
      setViewerCount(show.viewerCount);
    }
  }, [show]);

  // Video controls
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
    if (containerRef.current) {
      if (!isFullscreen) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  // Chat handlers
  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    if (!user) {
      toast.error("Please sign in to chat");
      return;
    }

    sendChatMutation.mutate({
      showId,
      message: chatMessage,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Add to cart handler
  const handleAddToCart = (product: any, variantId?: string) => {
    if (!user) {
      toast.error("Please sign in to shop");
      navigate("/login");
      return;
    }

    const currentQty = cartItems.get(variantId || product.id) || 0;
    setCartItems(new Map(cartItems.set(variantId || product.id, currentQty + 1)));

    addToCartMutation.mutate({
      productId: product.id,
      variantId,
      quantity: 1,
    });
  };

  // Gift handler
  const handleSendGift = (giftType: string, amount: number) => {
    if (!user) {
      toast.error("Please sign in to send gifts");
      return;
    }

    sendGiftMutation.mutate({
      showId,
      giftType,
      amount,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading show...</div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-center mb-2">Show Not Found</h2>
          <p className="text-center text-gray-600 mb-4">
            This show may have ended or is no longer available.
          </p>
          <Button onClick={() => navigate("/")} className="w-full">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-black">
      <div className="h-screen flex flex-col lg:flex-row">
        {/* Main Video Area - Left Side */}
        <div className="flex-1 relative bg-black">
          {/* Video Player */}
          <div className="relative w-full h-full">
            {show.streamUrl ? (
              <video
                ref={videoRef}
                src={show.streamUrl}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900">
                <div className="text-center text-white">
                  <Play className="w-24 h-24 mx-auto mb-4 opacity-50" />
                  <p className="text-2xl font-bold mb-2">Stream Starting Soon</p>
                  <p className="text-gray-300">The host will begin shortly</p>
                </div>
              </div>
            )}

            {/* Video Overlay - Top */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge className="bg-red-600 text-white px-3 py-1 text-sm font-bold animate-pulse">
                    ● LIVE
                  </Badge>
                  <div className="flex items-center gap-2 text-white">
                    <Eye className="w-5 h-5" />
                    <span className="font-bold">{viewerCount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/")}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Host Info */}
              <div className="mt-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                  {show.hostName?.charAt(0) || "H"}
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">{show.hostName}</h2>
                  <p className="text-gray-300 text-sm">{show.title}</p>
                </div>
              </div>
            </div>

            {/* Video Controls - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlay}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="w-6 h-6" />
                </Button>
              </div>
            </div>

            {/* Floating Engagement Buttons */}
            <div className="absolute right-4 bottom-24 flex flex-col gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleLikeMutation.mutate({ showId })}
                className={`rounded-full w-14 h-14 ${hasLiked ? "bg-red-500 text-white" : "bg-white/20 text-white"} hover:bg-red-600`}
              >
                <div className="flex flex-col items-center">
                  <Heart className={`w-6 h-6 ${hasLiked ? "fill-current" : ""}`} />
                  <span className="text-xs font-bold">{likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}</span>
                </div>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full w-14 h-14 bg-white/20 text-white hover:bg-white/30"
                onClick={() => {
                  navigator.share?.({
                    title: show.title,
                    text: `Watch ${show.hostName} live!`,
                    url: window.location.href,
                  });
                }}
              >
                <Share2 className="w-6 h-6" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full w-14 h-14 bg-white/20 text-white hover:bg-white/30"
                onClick={() => handleSendGift("star", 100)}
              >
                <Gift className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Products & Chat */}
        <div className="w-full lg:w-96 xl:w-[28rem] bg-gray-900 flex flex-col">
          {/* Pinned Products Section */}
          <div className="border-b border-gray-800">
            <div className="p-4 bg-gradient-to-r from-pink-600 to-purple-600">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Featured Products
              </h3>
            </div>

            <ScrollArea className="h-64">
              <div className="p-4 space-y-3">
                {pinnedProducts?.map((item) => {
                  const product = item.product;
                  const stock = liveStock?.find(s => s.productId === product.id);
                  const isLowStock = (stock?.available || 0) < 10;
                  const isOutOfStock = (stock?.available || 0) === 0;

                  return (
                    <Card 
                      key={product.id}
                      className={`p-3 cursor-pointer transition-all hover:shadow-lg ${
                        selectedProduct?.id === product.id ? "ring-2 ring-pink-500" : ""
                      } ${isOutOfStock ? "opacity-50" : ""}`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="flex gap-3">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-600" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold text-sm mb-1 truncate">
                            {product.name}
                          </h4>
                          
                          {/* Price */}
                          <div className="flex items-center gap-2 mb-2">
                            {item.livePriceDropActive && (
                              <>
                                <span className="text-gray-400 line-through text-sm">
                                  ${product.price}
                                </span>
                                <span className="text-pink-500 font-bold text-lg">
                                  ${item.livePrice}
                                </span>
                                <Badge className="bg-red-600 text-white text-xs">
                                  {Math.round((1 - item.livePrice / product.price) * 100)}% OFF
                                </Badge>
                              </>
                            )}
                            {!item.livePriceDropActive && (
                              <span className="text-white font-bold text-lg">
                                ${product.price}
                              </span>
                            )}
                          </div>

                          {/* Stock Status */}
                          <div className="flex items-center justify-between">
                            {isOutOfStock ? (
                              <Badge variant="destructive" className="text-xs">
                                SOLD OUT
                              </Badge>
                            ) : isLowStock ? (
                              <Badge variant="secondary" className="text-xs bg-yellow-600 text-white">
                                Only {stock?.available} left!
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs bg-green-600 text-white">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                In Stock
                              </Badge>
                            )}

                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(product);
                              }}
                              disabled={isOutOfStock}
                              className="bg-pink-600 hover:bg-pink-700 text-white"
                            >
                              <ShoppingCart className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>

                          {/* Urgency Timer */}
                          {item.livePriceDropActive && item.priceDropEndsAt && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-yellow-400">
                              <Clock className="w-3 h-3" />
                              <span className="font-semibold">
                                Ends in {Math.floor((new Date(item.priceDropEndsAt).getTime() - Date.now()) / 60000)}m
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {(!pinnedProducts || pinnedProducts.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No products featured yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Section */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-800 bg-gray-800">
              <h3 className="text-white font-bold flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Live Chat
                <Badge variant="secondary" className="ml-auto">
                  {messages.length}
                </Badge>
              </h3>
            </div>

            {/* Messages */}
            <ScrollArea ref={chatScrollRef} className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((msg, idx) => (
                  <div key={idx} className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {msg.userName?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold text-sm">
                          {msg.userName || "Anonymous"}
                        </span>
                        {msg.isHost && (
                          <Badge className="bg-pink-600 text-white text-xs">HOST</Badge>
                        )}
                        {msg.isVIP && (
                          <Badge className="bg-yellow-600 text-white text-xs">VIP</Badge>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm break-words">{msg.message}</p>
                    </div>
                  </div>
                ))}

                {messages.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm mt-1">Be the first to say hello!</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-800 bg-gray-800">
              {user ? (
                <div className="flex gap-2">
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Say something..."
                    className="flex-1 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim() || sendChatMutation.isLoading}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full bg-pink-600 hover:bg-pink-700"
                >
                  Sign in to Chat
                </Button>
              )}
            </div>
          </div>

          {/* Cart Summary */}
          {cartItems.size > 0 && (
            <div className="p-4 border-t border-gray-800 bg-gradient-to-r from-pink-600 to-purple-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-bold">
                  {Array.from(cartItems.values()).reduce((a, b) => a + b, 0)} items in cart
                </span>
                <Button
                  onClick={() => navigate("/cart")}
                  className="bg-white text-pink-600 hover:bg-gray-100 font-bold"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Checkout
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
