import { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  ShoppingBag,
  Package,
  CreditCard,
  HelpCircle,
  User,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Streamdown } from 'streamdown';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  products?: ProductSuggestion[];
  actions?: ActionButton[];
  feedback?: 'positive' | 'negative';
}

interface ProductSuggestion {
  id: string;
  name: string;
  price: number;
  image: string;
  url: string;
}

interface ActionButton {
  label: string;
  action: string;
  variant?: 'default' | 'outline' | 'ghost';
}

interface ChatbotProps {
  position?: 'bottom-right' | 'bottom-left';
  theme?: 'light' | 'dark';
  welcomeMessage?: string;
  suggestedQuestions?: string[];
}

export default function AIChatbot({
  position = 'bottom-right',
  theme = 'dark',
  welcomeMessage = "Hi! I'm your AI shopping assistant. How can I help you today?",
  suggestedQuestions = [
    'Track my order',
    'Find products',
    'Return policy',
    'Payment options',
  ],
}: ChatbotProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize conversation
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMsg: Message = {
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
        suggestions: suggestedQuestions,
      };
      setMessages([welcomeMsg]);
      
      // Generate conversation ID
      setConversationId(`conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Send message mutation
  const sendMessage = trpc.chatbot.sendMessage.useMutation({
    onSuccess: (response) => {
      const assistantMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        suggestions: response.suggestions,
        products: response.products,
        actions: response.actions,
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      setIsTyping(false);
    },
  });

  // Submit feedback mutation
  const submitFeedback = trpc.chatbot.submitFeedback.useMutation({
    onSuccess: () => {
      toast({ title: 'Thanks for your feedback!' });
    },
  });

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Send to AI
    sendMessage.mutate({
      conversationId,
      message: input.trim(),
      userId: user?.id,
      context: {
        previousMessages: messages.slice(-5),
        userInfo: user ? { id: user.id, name: user.name } : undefined,
      },
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleSend();
  };

  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    );

    submitFeedback.mutate({
      conversationId,
      messageId,
      feedback,
    });
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copied to clipboard!' });
  };

  const handleReset = () => {
    setMessages([]);
    setConversationId(`conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    const welcomeMsg: Message = {
      id: 'welcome',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date(),
      suggestions: suggestedQuestions,
    };
    setMessages([welcomeMsg]);
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const themeClasses = {
    light: 'bg-white text-gray-900',
    dark: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white',
  };

  if (!isOpen) {
    return (
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <Button
          size="lg"
          className="rounded-full w-16 h-16 shadow-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 relative group"
          onClick={() => setIsOpen(true)}
        >
          <Bot className="w-8 h-8 text-white" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          
          {/* Tooltip */}
          <div className="absolute bottom-full mb-2 right-0 bg-black/80 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Chat with AI Assistant
          </div>
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <Card
        className={`${themeClasses[theme]} border-white/20 shadow-2xl overflow-hidden transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-10 h-10 bg-white">
                <AvatarFallback>
                  <Bot className="w-6 h-6 text-purple-600" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                AI Assistant
                <Sparkles className="w-4 h-4" />
              </h3>
              <p className="text-xs text-white/80">Always here to help</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? (
                <Maximize2 className="w-5 h-5" />
              ) : (
                <Minimize2 className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 p-4 h-[440px]">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500">
                        <AvatarFallback>
                          <Bot className="w-5 h-5 text-white" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    {message.role === 'user' && (
                      <Avatar className="w-8 h-8 bg-white/10">
                        <AvatarFallback>
                          <User className="w-5 h-5 text-white" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className="flex-1 space-y-2">
                      {/* Message Content */}
                      <div
                        className={`p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-purple-600 text-white ml-auto max-w-[80%]'
                            : 'bg-white/10 backdrop-blur text-white'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <Streamdown>{message.content}</Streamdown>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>

                      {/* Product Suggestions */}
                      {message.products && message.products.length > 0 && (
                        <div className="space-y-2">
                          {message.products.map((product) => (
                            <Card
                              key={product.id}
                              className="bg-white/10 backdrop-blur border-white/20 p-3 hover:bg-white/20 transition-colors cursor-pointer"
                              onClick={() => window.open(product.url, '_blank')}
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                                <div className="flex-1">
                                  <p className="text-white font-semibold text-sm">
                                    {product.name}
                                  </p>
                                  <p className="text-purple-300 font-bold">
                                    ${product.price.toFixed(2)}
                                  </p>
                                </div>
                                <ShoppingBag className="w-5 h-5 text-white/60" />
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      {message.actions && message.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {message.actions.map((action, idx) => (
                            <Button
                              key={idx}
                              variant={action.variant || 'outline'}
                              size="sm"
                              onClick={() => handleSuggestionClick(action.action)}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {message.suggestions.map((suggestion, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Message Actions */}
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-white/60 hover:text-white"
                            onClick={() => handleCopyMessage(message.content)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>

                          {!message.feedback && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-white/60 hover:text-green-400"
                                onClick={() => handleFeedback(message.id, 'positive')}
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-white/60 hover:text-red-400"
                                onClick={() => handleFeedback(message.id, 'negative')}
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </Button>
                            </>
                          )}

                          {message.feedback === 'positive' && (
                            <Badge className="bg-green-500/20 text-green-400 text-xs">
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              Helpful
                            </Badge>
                          )}

                          {message.feedback === 'negative' && (
                            <Badge className="bg-red-500/20 text-red-400 text-xs">
                              <ThumbsDown className="w-3 h-3 mr-1" />
                              Not helpful
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Timestamp */}
                      <p className="text-xs text-white/40">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500">
                      <AvatarFallback>
                        <Bot className="w-5 h-5 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white/10 backdrop-blur p-3 rounded-lg">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-100" />
                        <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quick Actions */}
            <div className="px-4 py-2 border-t border-white/10">
              <div className="flex gap-2 overflow-x-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white"
                  onClick={() => handleSuggestionClick('Track my order')}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Track Order
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white"
                  onClick={() => handleSuggestionClick('Show me deals')}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Deals
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white"
                  onClick={() => handleSuggestionClick('Payment help')}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payment
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

// Chatbot Context Types
export interface ChatbotIntent {
  type:
    | 'order_tracking'
    | 'product_search'
    | 'return_policy'
    | 'payment_help'
    | 'account_help'
    | 'general_inquiry'
    | 'complaint'
    | 'compliment';
  confidence: number;
  entities: Record<string, any>;
}

// Intent Detection (would be done on server with AI)
export function detectIntent(message: string): ChatbotIntent {
  const lowerMessage = message.toLowerCase();

  // Order tracking
  if (
    lowerMessage.includes('track') ||
    lowerMessage.includes('order') ||
    lowerMessage.includes('shipping') ||
    lowerMessage.includes('delivery')
  ) {
    return {
      type: 'order_tracking',
      confidence: 0.9,
      entities: {},
    };
  }

  // Product search
  if (
    lowerMessage.includes('find') ||
    lowerMessage.includes('search') ||
    lowerMessage.includes('looking for') ||
    lowerMessage.includes('show me')
  ) {
    return {
      type: 'product_search',
      confidence: 0.85,
      entities: {},
    };
  }

  // Return policy
  if (
    lowerMessage.includes('return') ||
    lowerMessage.includes('refund') ||
    lowerMessage.includes('exchange')
  ) {
    return {
      type: 'return_policy',
      confidence: 0.9,
      entities: {},
    };
  }

  // Payment help
  if (
    lowerMessage.includes('payment') ||
    lowerMessage.includes('pay') ||
    lowerMessage.includes('card') ||
    lowerMessage.includes('checkout')
  ) {
    return {
      type: 'payment_help',
      confidence: 0.85,
      entities: {},
    };
  }

  return {
    type: 'general_inquiry',
    confidence: 0.5,
    entities: {},
  };
}

// Predefined Responses
export const chatbotResponses = {
  order_tracking: {
    message:
      "I can help you track your order! Please provide your order number, and I'll get the latest status for you.",
    actions: [
      { label: 'View My Orders', action: 'show my orders', variant: 'default' as const },
    ],
  },
  product_search: {
    message:
      "I'd be happy to help you find products! What are you looking for? You can describe the product, category, or specific features you need.",
    suggestions: [
      'Electronics',
      'Fashion',
      'Home & Garden',
      'Beauty Products',
    ],
  },
  return_policy: {
    message:
      'Our return policy allows returns within 30 days of purchase. Items must be unused and in original packaging. Would you like to start a return?',
    actions: [
      { label: 'Start Return', action: 'start return process', variant: 'default' as const },
      { label: 'View Full Policy', action: 'show return policy', variant: 'outline' as const },
    ],
  },
  payment_help: {
    message:
      'We accept all major credit cards, PayPal, and digital wallets. What specific payment question do you have?',
    suggestions: [
      'Payment methods',
      'Payment failed',
      'Refund status',
      'Update payment info',
    ],
  },
  general_inquiry: {
    message:
      "I'm here to help! You can ask me about orders, products, returns, payments, or any other questions you have.",
    suggestions: [
      'Track my order',
      'Find products',
      'Return policy',
      'Payment options',
    ],
  },
};
