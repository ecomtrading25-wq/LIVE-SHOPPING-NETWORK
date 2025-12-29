import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Streamdown } from "streamdown";
import {
  Bot,
  Send,
  Sparkles,
  ShoppingBag,
  Package,
  TrendingUp,
  MessageSquare,
  User,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Link } from "wouter";

/**
 * AI Virtual Shopping Assistant
 * Conversation history, product search, order tracking, personalized recommendations
 */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  products?: ProductSuggestion[];
  orders?: OrderInfo[];
}

interface ProductSuggestion {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  inStock: boolean;
}

interface OrderInfo {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  estimatedDelivery: string;
}

export default function ShoppingAssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `👋 Hi${user ? ` ${user.name}` : ""}! I'm your AI shopping assistant. I can help you:

- 🔍 Find products based on your preferences
- 📦 Track your orders and shipments
- 💡 Get personalized recommendations
- 🎁 Discover deals and promotions
- ❓ Answer questions about products

What can I help you with today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMutation = trpc.ai.chat.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickActions = [
    { icon: ShoppingBag, label: "Find products", query: "Show me trending products" },
    { icon: Package, label: "Track orders", query: "Where are my orders?" },
    { icon: TrendingUp, label: "Best deals", query: "What are the best deals today?" },
    { icon: Sparkles, label: "Recommendations", query: "Recommend products for me" },
  ];

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatMutation.mutateAsync({
        message: input,
        conversationHistory: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
        products: response.products,
        orders: response.orders,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (query: string) => {
    setInput(query);
    setTimeout(() => handleSend(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearConversation = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `👋 Hi${user ? ` ${user.name}` : ""}! I'm your AI shopping assistant. How can I help you today?`,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
              <Bot className="w-8 h-8 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">AI Shopping Assistant</h1>
              <p className="text-gray-400 mt-1">Your personal shopping companion</p>
            </div>
          </div>
          <Button variant="outline" onClick={clearConversation}>
            <RefreshCw className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="bg-background text-foreground/5 border-white/10 overflow-hidden flex flex-col" style={{ height: "calc(100vh - 250px)" }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        message.role === "user"
                          ? "bg-purple-600"
                          : "bg-gradient-to-br from-purple-500 to-pink-500"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="w-5 h-5 text-foreground" />
                      ) : (
                        <Bot className="w-5 h-5 text-foreground" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className={`flex-1 ${message.role === "user" ? "text-right" : ""}`}>
                      <div
                        className={`inline-block max-w-3xl p-4 rounded-2xl ${
                          message.role === "user"
                            ? "bg-purple-600 text-foreground"
                            : "bg-background/10 text-foreground"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <Streamdown>{message.content}</Streamdown>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>

                      {/* Product Suggestions */}
                      {message.products && message.products.length > 0 && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {message.products.map((product) => (
                            <Link key={product.id} href={`/products/${product.id}`}>
                              <Card className="p-4 bg-background text-foreground/10 border-white/20 hover:bg-background text-foreground/20 transition-colors cursor-pointer">
                                <div className="flex gap-3">
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-20 h-20 object-cover rounded-lg"
                                  />
                                  <div className="flex-1">
                                    <h4 className="text-foreground font-semibold mb-1 line-clamp-2">
                                      {product.name}
                                    </h4>
                                    <p className="text-green-400 font-bold mb-1">${product.price}</p>
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center">
                                        <span className="text-yellow-400 text-sm">★</span>
                                        <span className="text-foreground text-sm ml-1">{product.rating}</span>
                                      </div>
                                      {product.inStock ? (
                                        <Badge className="bg-green-500/20 text-green-400 text-xs">
                                          In Stock
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-red-500/20 text-red-400 text-xs">
                                          Out of Stock
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Order Information */}
                      {message.orders && message.orders.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {message.orders.map((order) => (
                            <Link key={order.id} href={`/orders/${order.id}`}>
                              <Card className="p-4 bg-background text-foreground/10 border-white/20 hover:bg-background text-foreground/20 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-foreground font-semibold">Order #{order.orderNumber}</p>
                                    <p className="text-gray-400 text-sm mt-1">
                                      Estimated delivery: {order.estimatedDelivery}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <Badge className="bg-blue-500/20 text-blue-400 mb-2">
                                      {order.status}
                                    </Badge>
                                    <p className="text-foreground font-bold">${order.total}</p>
                                  </div>
                                </div>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      )}

                      <p className="text-gray-500 text-xs mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="inline-block p-4 rounded-2xl bg-background text-foreground/10">
                        <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-white/10 p-4">
                <div className="flex gap-3">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about products, orders, or recommendations..."
                    className="flex-1 bg-background/10 border-white/20 text-foreground placeholder:text-gray-400"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6 bg-background text-foreground/5 border-white/10">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Quick Actions
              </h2>
              <div className="space-y-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.label}
                      variant="outline"
                      className="w-full justify-start text-left"
                      onClick={() => handleQuickAction(action.query)}
                      disabled={isLoading}
                    >
                      <Icon className="w-4 h-4 mr-3 text-purple-400" />
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            </Card>

            {/* Tips */}
            <Card className="p-6 bg-background text-foreground/5 border-white/10">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                Tips
              </h2>
              <ul className="space-y-3 text-muted-foreground text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Ask about specific product categories or features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Request personalized recommendations based on your history</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Track multiple orders at once</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Compare products and get buying advice</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  <span>Ask about return policies and warranties</span>
                </li>
              </ul>
            </Card>

            {/* Stats */}
            {user && (
              <Card className="p-6 bg-background text-foreground/5 border-white/10">
                <h2 className="text-xl font-bold text-foreground mb-4">Your Activity</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm">Conversations</p>
                    <p className="text-foreground text-2xl font-bold">24</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Products Found</p>
                    <p className="text-foreground text-2xl font-bold">156</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Recommendations</p>
                    <p className="text-foreground text-2xl font-bold">89</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
