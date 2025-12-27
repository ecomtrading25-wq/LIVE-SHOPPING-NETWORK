import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  ShoppingCart,
  Heart,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  products?: ProductSuggestion[];
}

interface ProductSuggestion {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  url: string;
}

/**
 * AI-Powered Shopping Chatbot
 * Intelligent product recommendations and shopping assistance
 * Natural language understanding for customer queries
 */
export default function AIShoppingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your AI shopping assistant. I can help you find products, answer questions, and provide personalized recommendations. What are you looking for today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = async (userMessage: string): Promise<Message> => {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const lowerMessage = userMessage.toLowerCase();

    // Product recommendations based on keywords
    let response = "";
    let products: ProductSuggestion[] = [];

    if (lowerMessage.includes("headphone") || lowerMessage.includes("audio")) {
      response = "Great choice! I found some excellent headphones for you. These are our top-rated options based on customer reviews and sound quality:";
      products = [
        {
          id: "1",
          name: "Premium Wireless Headphones",
          price: 299.99,
          image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
          rating: 4.8,
          url: "/products/1",
        },
        {
          id: "2",
          name: "Noise-Cancelling Earbuds",
          price: 199.99,
          image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400",
          rating: 4.6,
          url: "/products/2",
        },
      ];
    } else if (lowerMessage.includes("watch") || lowerMessage.includes("smartwatch")) {
      response = "I've found some amazing smartwatches that might interest you. These models offer great features and value:";
      products = [
        {
          id: "3",
          name: "Smart Watch Ultra",
          price: 399.99,
          image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
          rating: 4.7,
          url: "/products/3",
        },
      ];
    } else if (lowerMessage.includes("budget") || lowerMessage.includes("cheap") || lowerMessage.includes("affordable")) {
      response = "I understand you're looking for budget-friendly options! Here are some great products with excellent value for money:";
      products = [
        {
          id: "4",
          name: "Wireless Charging Pad",
          price: 29.99,
          image: "https://images.unsplash.com/photo-1591290619762-c588f8e4e8e0?w=400",
          rating: 4.5,
          url: "/products/4",
        },
      ];
    } else if (lowerMessage.includes("gift") || lowerMessage.includes("present")) {
      response = "Looking for the perfect gift? Here are some popular items that make great presents:";
      products = [
        {
          id: "5",
          name: "Premium Leather Backpack",
          price: 89.99,
          image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
          rating: 4.9,
          url: "/products/5",
        },
      ];
    } else if (lowerMessage.includes("compare") || lowerMessage.includes("difference")) {
      response = "I can help you compare products! To give you the best comparison, could you tell me which specific products or categories you'd like to compare? For example, 'Compare wireless headphones under $200' or 'What's the difference between smartwatches?'";
    } else if (lowerMessage.includes("shipping") || lowerMessage.includes("delivery")) {
      response = "We offer several shipping options:\n\n• Standard Shipping (5-7 days): FREE on orders over $50\n• Express Shipping (2-3 days): $9.99\n• Next Day Delivery: $19.99\n\nAll orders are tracked and you'll receive email updates!";
    } else if (lowerMessage.includes("return") || lowerMessage.includes("refund")) {
      response = "Our return policy is customer-friendly:\n\n• 30-day return window\n• Free return shipping\n• Full refund or exchange\n• No restocking fees\n\nJust contact our support team to initiate a return!";
    } else if (lowerMessage.includes("discount") || lowerMessage.includes("coupon") || lowerMessage.includes("promo")) {
      response = "Great news! Here are our current promotions:\n\n🎉 NEW20 - 20% off your first order\n💰 SAVE50 - $50 off orders over $200\n🚚 FREESHIP - Free shipping on all orders\n\nCoupons are automatically applied at checkout!";
    } else {
      response = "I'd be happy to help you with that! Could you provide more details about what you're looking for? You can ask me about:\n\n• Product recommendations\n• Shipping and delivery\n• Returns and refunds\n• Current promotions\n• Product comparisons\n\nWhat would you like to know?";
    }

    return {
      id: Date.now().toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
      products: products.length > 0 ? products : undefined,
    };
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const aiResponse = await generateAIResponse(input);
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error generating response:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again or contact our support team for assistance.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    "Show me trending products",
    "Find gifts under $100",
    "What are your best deals?",
    "Help me find headphones",
  ];

  return (
    <>
      {/* Chatbot Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        title="AI Shopping Assistant"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-8rem)] flex flex-col bg-zinc-900 rounded-2xl shadow-2xl border border-purple-500/30">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-purple-600" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">AI Assistant</h3>
                <p className="text-xs text-white/80">Online • Ready to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === "user"
                      ? "bg-purple-600"
                      : "bg-blue-600"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>

                <div className="flex-1 max-w-[80%]">
                  <div
                    className={`p-3 rounded-2xl ${
                      message.role === "user"
                        ? "bg-purple-600 text-white ml-auto"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {/* Product Suggestions */}
                  {message.products && message.products.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.products.map((product) => (
                        <Link key={product.id} href={product.url}>
                          <Card className="p-3 bg-white/5 hover:bg-white/10 border-white/10 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white text-sm font-semibold line-clamp-2">
                                  {product.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-purple-400 font-bold">
                                    ${product.price}
                                  </span>
                                  <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                                    ⭐ {product.rating}
                                  </Badge>
                                </div>
                              </div>
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white/10 p-3 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-gray-400 mb-2">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInput(action);
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                    className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isTyping}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isTyping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Powered by AI • Press Enter to send
            </p>
          </div>
        </div>
      )}
    </>
  );
}
