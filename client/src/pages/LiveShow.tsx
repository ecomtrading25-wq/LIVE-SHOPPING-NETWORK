/**
 * Live Show Viewer
 * Real-time streaming with chat, products, and instant checkout
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, ShoppingCart, Users } from "lucide-react";

export default function LiveShow() {
  const [chatMessage, setChatMessage] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid lg:grid-cols-[1fr_400px] gap-4 p-4 h-screen">
        {/* Main Video Area */}
        <div className="space-y-4">
          <Card className="relative aspect-video bg-background rounded-lg overflow-hidden text-foreground">
            <div className="absolute inset-0 flex items-center justify-center text-foreground">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500 animate-pulse flex items-center justify-center">
                  <span className="text-2xl font-bold">LIVE</span>
                </div>
                <p className="text-xl">Fashion Friday Haul</p>
              </div>
            </div>

            {/* Live Overlay */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge className="bg-red-500 text-foreground">
                <span className="w-2 h-2 bg-background text-foreground rounded-full mr-2 animate-pulse"></span>
                LIVE
              </Badge>
              <Badge variant="secondary" className="bg-background/50 text-foreground">
                <Users className="w-3 h-3 mr-1" />
                1,245 watching
              </Badge>
            </div>

            <div className="absolute top-4 right-4 flex gap-2">
              <Button size="sm" variant="secondary" className="bg-background/50 hover:bg-background/70 text-foreground">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Creator Info */}
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500"></div>
                <div>
                  <h2 className="text-xl font-bold">StyleQueen</h2>
                  <p className="text-sm text-muted-foreground">Fashion & Lifestyle</p>
                  <p className="text-sm mt-2">12.5K followers</p>
                </div>
              </div>
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={() => setIsFollowing(!isFollowing)}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
          </Card>

          {/* Featured Products */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Featured Products</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ProductCard
                name="Wireless Headphones"
                price="$79.99"
                image="/products/headphones.jpg"
              />
              <ProductCard
                name="Smart Watch"
                price="$199.99"
                image="/products/watch.jpg"
              />
              <ProductCard
                name="Laptop Stand"
                price="$49.99"
                image="/products/stand.jpg"
              />
              <ProductCard
                name="USB-C Hub"
                price="$39.99"
                image="/products/hub.jpg"
              />
            </div>
          </Card>
        </div>

        {/* Chat Sidebar */}
        <div className="flex flex-col h-full">
          <Card className="flex-1 flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Live Chat</h3>
              <p className="text-sm text-muted-foreground">1,245 participants</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <ChatMessage
                user="Sarah"
                message="Love those headphones! 🎧"
                timestamp="2m ago"
              />
              <ChatMessage
                user="Mike"
                message="What's the battery life?"
                timestamp="1m ago"
              />
              <ChatMessage
                user="StyleQueen"
                message="Up to 30 hours! Amazing quality"
                timestamp="1m ago"
                isCreator
              />
              <ChatMessage
                user="Emma"
                message="Just ordered! Can't wait 🛍️"
                timestamp="30s ago"
              />
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                />
                <Button>Send</Button>
              </div>
            </div>
          </Card>

          {/* Virtual Gifts */}
          <Card className="mt-4 p-4">
            <h3 className="font-semibold mb-3">Send a Gift</h3>
            <div className="grid grid-cols-4 gap-2">
              <GiftButton emoji="❤️" price="$1" />
              <GiftButton emoji="🎁" price="$5" />
              <GiftButton emoji="💎" price="$10" />
              <GiftButton emoji="👑" price="$25" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ name, price, image }: any) {
  return (
    <Card className="p-3 cursor-pointer hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-muted rounded mb-2"></div>
      <p className="font-medium text-sm">{name}</p>
      <p className="text-lg font-bold">{price}</p>
      <Button size="sm" className="w-full mt-2">
        <ShoppingCart className="w-3 h-3 mr-1" />
        Add
      </Button>
    </Card>
  );
}

function ChatMessage({ user, message, timestamp, isCreator }: any) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className={`font-semibold text-sm ${isCreator ? 'text-red-500' : ''}`}>
          {user}
        </span>
        {isCreator && <Badge variant="secondary" className="text-xs">Creator</Badge>}
        <span className="text-xs text-muted-foreground">{timestamp}</span>
      </div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

function GiftButton({ emoji, price }: any) {
  return (
    <Button variant="outline" className="flex flex-col h-auto py-2">
      <span className="text-2xl mb-1">{emoji}</span>
      <span className="text-xs">{price}</span>
    </Button>
  );
}
