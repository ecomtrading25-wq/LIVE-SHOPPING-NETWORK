import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Video,
  Users,
  ShoppingCart,
  Heart,
  Send,
  Zap,
  Eye,
  MessageCircle,
} from "lucide-react";

export default function LiveShowsPage() {
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, user: "Sarah M.", message: "This headphone looks amazing!", time: "2m ago" },
    { id: 2, user: "John D.", message: "What's the battery life?", time: "1m ago" },
    { id: 3, user: "Host", message: "Up to 30 hours! 🎧", time: "30s ago", isHost: true },
  ]);

  const featuredProduct = {
    id: 1,
    name: "Premium Wireless Headphones",
    price: 299.99,
    compareAtPrice: 399.99,
    image: "/placeholder.jpg",
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    setMessages([
      ...messages,
      {
        id: messages.length + 1,
        user: "You",
        message: chatMessage,
        time: "Just now",
      },
    ]);
    setChatMessage("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-white/10 bg-background/30 backdrop-blur-xl text-foreground">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="text-2xl font-bold text-foreground hover:text-red-400 transition-colors">
                Live Shopping Network
              </a>
            </Link>
            <div className="flex items-center gap-4">
              <Badge className="bg-red-600 animate-pulse">
                <div className="w-2 h-2 bg-background text-foreground rounded-full mr-2" />
                LIVE
              </Badge>
              <div className="flex items-center gap-2 text-foreground">
                <Eye className="w-5 h-5" />
                <span className="font-bold">1,247</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Stream */}
          <div className="lg:col-span-2">
            <Card className="bg-background border-white/10 overflow-hidden text-foreground">
              {/* Video Player */}
              <div className="aspect-video bg-gradient-to-br from-red-600/20 to-pink-600/20 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Video className="w-24 h-24 text-white/50 mx-auto mb-4" />
                    <p className="text-white/70 text-lg">Live Stream Active</p>
                  </div>
                </div>

                {/* Live Indicator */}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-600 text-foreground font-bold px-4 py-2">
                    <div className="w-2 h-2 bg-background text-foreground rounded-full mr-2 animate-pulse" />
                    LIVE
                  </Badge>
                </div>

                {/* Viewer Count */}
                <div className="absolute top-4 right-4 bg-background/60 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 text-foreground">
                  <Users className="w-4 h-4 text-foreground" />
                  <span className="text-foreground font-bold">1,247</span>
                </div>
              </div>

              {/* Stream Info */}
              <div className="p-6">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  🎧 Tech Tuesday: Premium Audio Deals
                </h1>
                <p className="text-gray-400 mb-4">
                  Join us for exclusive deals on premium headphones, speakers, and audio
                  accessories. Limited quantities available!
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                      <span className="text-foreground font-bold">JD</span>
                    </div>
                    <div>
                      <p className="text-foreground font-medium">John Davis</p>
                      <p className="text-sm text-gray-400">Host</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Featured Product Spotlight */}
            <Card className="mt-6 bg-background text-foreground/5 border-white/10 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-bold text-foreground">Featured Product</h2>
              </div>

              <div className="flex gap-6">
                <div className="w-32 h-32 bg-gradient-to-br from-red-600/20 to-pink-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-16 h-16 text-white/50" />
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {featuredProduct.name}
                  </h3>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl font-bold text-foreground">
                      ${featuredProduct.price}
                    </span>
                    <span className="text-lg text-gray-400 line-through">
                      ${featuredProduct.compareAtPrice}
                    </span>
                    <Badge className="bg-red-600">
                      -
                      {Math.round(
                        ((featuredProduct.compareAtPrice - featuredProduct.price) /
                          featuredProduct.compareAtPrice) *
                          100
                      )}
                      %
                    </Badge>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1 bg-red-600 hover:bg-red-700">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Button variant="outline" size="icon">
                      <Heart className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Live Chat Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-background text-foreground/5 border-white/10 h-[calc(100vh-12rem)] flex flex-col">
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-red-400" />
                  <h2 className="text-lg font-bold text-foreground">Live Chat</h2>
                  <Badge className="ml-auto bg-red-600">234 online</Badge>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold text-sm ${
                          msg.isHost ? "text-yellow-500" : "text-red-400"
                        }`}
                      >
                        {msg.user}
                        {msg.isHost && (
                          <Badge className="ml-2 bg-yellow-500 text-black text-xs">
                            HOST
                          </Badge>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">{msg.time}</span>
                    </div>
                    <p className="text-foreground text-sm">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message..."
                    className="bg-background/10 border-white/20 text-foreground placeholder:text-gray-400"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Send className="w-4 h-4" />
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
