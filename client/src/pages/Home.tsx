import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { LiveChatButton } from "@/components/LiveChat";
import { LiveActivityFeed } from "@/components/SocialProof";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Users, Play, Pause, Eye, Zap } from "lucide-react";
import { Link } from "wouter";
import ProductRecommendations from "@/components/ProductRecommendations";
import Hls from "hls.js";

/**
 * Live Shopping Network - Homepage
 * Features live video hero with Shop-the-Live overlay
 */

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Fetch current live session
  const { data: liveSession, isLoading: liveLoading } = trpc.live.currentLive.useQuery(undefined, {
    refetchInterval: 5000, // Refresh every 5 seconds
  });
  
  // Fetch pinned products for the live session
  const { data: pinnedProducts } = trpc.live.pinnedProducts.useQuery(
    { liveSessionId: liveSession?.id || "" },
    { enabled: !!liveSession?.id, refetchInterval: 3000 }
  );
  
  // Get the currently active pinned product
  const activeProduct = pinnedProducts?.find(p => p.isActive);
  
  // Fetch product details if we have an active product
  const { data: productDetails } = trpc.products.get.useQuery(
    { id: activeProduct?.productId || "" },
    { enabled: !!activeProduct?.productId }
  );

  // Initialize HLS.js video player
  useEffect(() => {
    if (!videoRef.current || !liveSession?.streamUrl) return;
    
    const video = videoRef.current;
    
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      
      hls.loadSource(liveSession.streamUrl);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isPlaying) {
          video.play().catch(err => console.log("Autoplay prevented:", err));
        }
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error("HLS fatal error:", data);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
      
      hlsRef.current = hls;
      
      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = liveSession.streamUrl;
      if (isPlaying) {
        video.play().catch(err => console.log("Autoplay prevented:", err));
      }
    }
  }, [liveSession?.streamUrl, isPlaying]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleBuyNow = () => {
    if (!productDetails) return;
    // TODO: Add to cart and navigate to checkout
    alert(`Adding ${productDetails.name} to cart!`);
  };

  if (liveLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading live stream...</div>
      </div>
    );
  }

  if (!liveSession || liveSession.status !== "live") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-6xl font-bold mb-6">Live Shopping Network</h1>
            <p className="text-2xl mb-8 text-gray-300">
              No live shows at the moment. Check back soon!
            </p>
            <Link href="/live">
              <Button size="lg" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold px-8 py-6 text-lg mb-12">
                <Play className="w-5 h-5 mr-2" />
                Explore Live Shows
              </Button>
            </Link>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Card className="p-6 bg-white/10 backdrop-blur border-white/20">
                <h3 className="text-xl font-bold mb-2">Shop Live</h3>
                <p className="text-gray-300">Watch live shows and shop exclusive deals in real-time</p>
              </Card>
              <Card className="p-6 bg-white/10 backdrop-blur border-white/20">
                <h3 className="text-xl font-bold mb-2">Instant Deals</h3>
                <p className="text-gray-300">Get special pricing only available during live shows</p>
              </Card>
              <Card className="p-6 bg-white/10 backdrop-blur border-white/20">
                <h3 className="text-xl font-bold mb-2">Interactive</h3>
                <p className="text-gray-300">Ask questions and interact with hosts in real-time</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Live Video Hero - 16:9 Aspect Ratio */}
      <div className="relative w-full bg-black">
        <div className="relative w-full" style={{ paddingTop: "56.25%" /* 16:9 aspect ratio */ }}>
          <video
            ref={videoRef}
            className="absolute top-0 left-0 w-full h-full object-cover"
            playsInline
            muted
          />
          
          {/* Live Badge */}
          <div className="absolute top-4 left-4 z-10">
            <Badge className="bg-red-600 text-white px-4 py-2 text-lg font-bold animate-pulse">
              <span className="inline-block w-2 h-2 bg-white rounded-full mr-2"></span>
              LIVE
            </Badge>
          </div>
          
          {/* Viewer Count */}
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 text-white">
              <Users className="w-5 h-5" />
              <span className="font-bold">{liveSession.viewerCount.toLocaleString()}</span>
            </div>
          </div>
          
          {/* Play/Pause Control */}
          <button
            onClick={togglePlay}
            className="absolute bottom-4 left-4 z-10 bg-black/60 backdrop-blur p-3 rounded-full hover:bg-black/80 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white" />
            )}
          </button>
          
          {/* Shop-the-Live Overlay */}
          {activeProduct && productDetails && (
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6">
              <div className="container mx-auto">
                <div className="max-w-2xl">
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    {productDetails.imageUrl && (
                      <div className="flex-shrink-0 w-24 h-24 bg-white rounded-lg overflow-hidden">
                        <img
                          src={productDetails.imageUrl}
                          alt={productDetails.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-xl font-bold mb-1 truncate">
                        {productDetails.name}
                      </h3>
                      
                      <div className="flex items-baseline gap-3 mb-3">
                        <span className="text-3xl font-bold text-green-400">
                          ${activeProduct.livePrice || productDetails.price}
                        </span>
                        {productDetails.compareAtPrice && (
                          <span className="text-lg text-gray-400 line-through">
                            ${productDetails.compareAtPrice}
                          </span>
                        )}
                      </div>
                      
                      <Button
                        onClick={handleBuyNow}
                        size="lg"
                        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold px-8 py-6 text-lg"
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Buy Now - Live Price!
                      </Button>
                    </div>
                  </div>
                  
                  {/* Live Show Title */}
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <h2 className="text-white text-lg font-semibold">
                      {liveSession.title}
                    </h2>
                    {liveSession.description && (
                      <p className="text-gray-300 text-sm mt-1">
                        {liveSession.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Live Chat (only show if there's an active session) */}
      <LiveChatButton sessionId={liveSession.id} />

      {/* Social Proof Notifications */}
      <div className="container mb-8">
        <LiveActivityFeed />
      </div>

      {/* Below the Fold - Additional Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Social Proof Stats */}
        <div className="mb-16">
          {/* Stats section removed - replaced with LiveActivityFeed above */}
        </div>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-white text-3xl font-bold mb-8">Why Shop Live?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-zinc-900 border-zinc-800">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Exclusive Deals</h3>
              <p className="text-gray-400">
                Get special pricing and offers only available during live shows. Limited quantities!
              </p>
            </Card>
            
            <Card className="p-6 bg-zinc-900 border-zinc-800">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Real-Time Interaction</h3>
              <p className="text-gray-400">
                Chat with hosts, ask questions, and see products demonstrated live before you buy.
              </p>
            </Card>
            
            <Card className="p-6 bg-zinc-900 border-zinc-800">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-4">
                <Play className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Instant Checkout</h3>
              <p className="text-gray-400">
                One-click buying during live shows. Secure checkout and fast shipping guaranteed.
              </p>
            </Card>
          </div>
        </div>

        {/* Product Recommendations */}
        <ProductRecommendations type="for-you" title="Recommended For You" limit={6} />
        <ProductRecommendations type="trending" title="Trending Products" limit={6} />
      </div>
    </div>
  );
}
