import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * AI-Powered Customer Service Chatbot
 * Handles FAQs, order tracking, returns, and escalation
 */

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  actions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
}

export default function CustomerServiceChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your AI shopping assistant. I can help you with:\n\n• Order tracking and updates\n• Product recommendations\n• Returns and refunds\n• Account questions\n• Live shopping schedules\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (in production, call tRPC endpoint)
    setTimeout(() => {
      const response = generateAIResponse(input);
      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
        actions: response.actions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (query: string): { content: string; actions?: any[] } => {
    const lowerQuery = query.toLowerCase();

    // Order tracking
    if (lowerQuery.includes("order") || lowerQuery.includes("track")) {
      return {
        content: "I can help you track your order! Please provide your order number (e.g., ORD-12345) or email address, and I'll look it up for you.",
        actions: [
          {
            label: "View My Orders",
            action: "navigate",
            data: { path: "/account" },
          },
        ],
      };
    }

    // Returns
    if (lowerQuery.includes("return") || lowerQuery.includes("refund")) {
      return {
        content: "I can help you with returns! Our return policy allows returns within 30 days of delivery. Would you like to:\n\n1. Start a return request\n2. Check return status\n3. Learn about our return policy",
        actions: [
          {
            label: "Start Return",
            action: "navigate",
            data: { path: "/orders/123/return" },
          },
          {
            label: "Return Policy",
            action: "navigate",
            data: { path: "/faq" },
          },
        ],
      };
    }

    // Live shopping
    if (lowerQuery.includes("live") || lowerQuery.includes("show")) {
      return {
        content: "Check out our live shopping sessions! We have hosts showcasing products 24/7 with exclusive deals. The next live show starts in 2 hours featuring tech gadgets.",
        actions: [
          {
            label: "Watch Live Now",
            action: "navigate",
            data: { path: "/" },
          },
          {
            label: "View Schedule",
            action: "navigate",
            data: { path: "/creator" },
          },
        ],
      };
    }

    // Products
    if (lowerQuery.includes("product") || lowerQuery.includes("recommend")) {
      return {
        content: "I'd love to help you find the perfect product! What are you looking for? We have:\n\n• Electronics & Tech\n• Fitness & Health\n• Home & Living\n• Beauty & Personal Care\n\nTell me more about what you need!",
        actions: [
          {
            label: "Browse Products",
            action: "navigate",
            data: { path: "/products" },
          },
          {
            label: "Search",
            action: "navigate",
            data: { path: "/search" },
          },
        ],
      };
    }

    // Shipping
    if (lowerQuery.includes("ship") || lowerQuery.includes("delivery")) {
      return {
        content: "We offer free shipping on orders over $50! Standard shipping takes 3-5 business days, and express shipping is available for 1-2 day delivery. All orders include tracking.",
      };
    }

    // Payment
    if (lowerQuery.includes("payment") || lowerQuery.includes("pay")) {
      return {
        content: "We accept all major credit cards, PayPal, and gift cards. All payments are securely processed through Stripe. You can also save payment methods in your account for faster checkout.",
        actions: [
          {
            label: "Buy Gift Card",
            action: "navigate",
            data: { path: "/gift-cards" },
          },
        ],
      };
    }

    // Subscription boxes
    if (lowerQuery.includes("subscription") || lowerQuery.includes("box")) {
      return {
        content: "Our subscription boxes are a great way to discover new products! We offer:\n\n• Tech Essentials Box - $49.99/month\n• Fitness Boost Box - $89.99/quarter\n• Home & Living Box - $39.99/month\n• Beauty Essentials Box - $59.99/month\n\nAll subscriptions can be paused or cancelled anytime!",
        actions: [
          {
            label: "View Subscription Boxes",
            action: "navigate",
            data: { path: "/subscription-boxes" },
          },
        ],
      };
    }

    // Rewards
    if (lowerQuery.includes("reward") || lowerQuery.includes("points") || lowerQuery.includes("loyalty")) {
      return {
        content: "Our loyalty rewards program has 4 tiers:\n\n• Bronze: 1 point per $1 spent\n• Silver: 1.5 points per $1 (500+ points)\n• Gold: 2 points per $1 (2,000+ points)\n• Platinum: 3 points per $1 (5,000+ points)\n\nRedeem 100 points for $1 off your next purchase!",
        actions: [
          {
            label: "View My Rewards",
            action: "navigate",
            data: { path: "/rewards" },
          },
        ],
      };
    }

    // Default response
    return {
      content: "I'm here to help! I can assist with orders, returns, product recommendations, live shopping, and more. Could you please provide more details about what you need help with?",
      actions: [
        {
          label: "View FAQ",
          action: "navigate",
          data: { path: "/faq" },
        },
        {
          label: "Contact Support",
          action: "escalate",
          data: { email: "support@liveshoppingnetwork.com" },
        },
      ],
    };
  };

  const handleAction = (action: any) => {
    if (action.action === "navigate") {
      window.location.href = action.data.path;
    } else if (action.action === "escalate") {
      toast.success("Connecting you to a human agent...");
    }
  };

  const quickActions = [
    { label: "Track Order", query: "track my order" },
    { label: "Start Return", query: "I want to return an item" },
    { label: "Live Shows", query: "when is the next live show?" },
    { label: "Rewards", query: "tell me about rewards" },
  ];

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 animate-bounce"
        >
          <MessageCircle className="w-8 h-8 text-foreground" />
          <Badge className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-600 flex items-center justify-center p-0">
            <span className="text-xs">AI</span>
          </Badge>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-foreground rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6" />
                <div>
                  <CardTitle className="text-lg">AI Shopping Assistant</CardTitle>
                  <p className="text-xs text-white/80">Online • Instant replies</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-foreground hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-foreground" />
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-purple-600 text-foreground"
                        : "bg-gray-100 dark:bg-card"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.actions.map((action, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleAction(action)}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}

                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {message.role === "user" && (
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="bg-gray-100 dark:bg-card rounded-lg p-3 text-card-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        setInput(action.query);
                        handleSend();
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type your message..."
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Powered by AI • Instant responses
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
