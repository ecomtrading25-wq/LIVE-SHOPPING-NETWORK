import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Send, X, MessageCircle, Users } from "lucide-react";
import { toast } from "sonner";

/**
 * Live Chat Component
 * Real-time chat overlay for live shopping sessions
 */

interface Message {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  isHost?: boolean;
  isPinned?: boolean;
}

interface LiveChatProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveChat({ sessionId, isOpen, onClose }: LiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Fetch initial messages
  const { data: initialMessages } = trpc.live.getChatMessages.useQuery(
    { sessionId },
    { enabled: isOpen }
  );

  // Send message mutation
  const sendMessageMutation = trpc.live.sendChatMessage.useMutation({
    onSuccess: (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      setInputMessage("");
      scrollToBottom();
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });

  // Simulate WebSocket connection (in production, use actual WebSocket)
  useEffect(() => {
    if (!isOpen) return;

    setIsConnected(true);

    // Load initial messages
    if (initialMessages) {
      setMessages(initialMessages);
      scrollToBottom();
    }

    // Simulate real-time message polling (replace with WebSocket in production)
    const interval = setInterval(() => {
      // In production, this would be handled by WebSocket events
      // For now, we'll just poll for new messages
    }, 2000);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [isOpen, initialMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    if (!user) {
      toast.error("Please sign in to chat");
      return;
    }

    sendMessageMutation.mutate({
      sessionId,
      message: inputMessage.trim(),
    });
  };

  const handlePinMessage = (messageId: string) => {
    // TODO: Implement pin message functionality
    toast.success("Message pinned!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className="bg-background border-border shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[80vh] text-foreground">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-foreground" />
            <div>
              <h3 className="font-bold text-foreground">Live Chat</h3>
              <div className="flex items-center gap-2 text-xs text-white/80">
                <Users className="w-3 h-3" />
                <span>{messages.length} messages</span>
                {isConnected && (
                  <Badge className="bg-green-500 text-foreground text-xs px-2 py-0">
                    LIVE
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-foreground hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                No messages yet. Be the first to chat!
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${
                  msg.isPinned ? "bg-red-900/20 p-2 rounded-lg border border-red-500" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold text-sm ${
                      msg.isHost
                        ? "text-yellow-400"
                        : user?.id === msg.userId
                        ? "text-red-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {msg.username}
                  </span>
                  {msg.isHost && (
                    <Badge className="bg-yellow-600 text-foreground text-xs px-2 py-0">
                      HOST
                    </Badge>
                  )}
                  {msg.isPinned && (
                    <Badge className="bg-red-600 text-foreground text-xs px-2 py-0">
                      PINNED
                    </Badge>
                  )}
                  <span className="text-xs text-gray-500 ml-auto">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-foreground text-sm break-words">{msg.message}</p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 bg-background border-t border-border text-foreground">
          {user ? (
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-card border-zinc-700 text-foreground"
                maxLength={200}
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-3">Sign in to join the chat</p>
              <Button className="w-full bg-red-600 hover:bg-red-700">
                Sign In
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}

// Floating chat button to open/close chat
export function LiveChatButton({ sessionId }: { sessionId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-40 w-14 h-14 bg-gradient-to-r from-red-600 to-orange-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
      >
        <MessageCircle className="w-6 h-6 text-foreground" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-600 text-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </button>

      <LiveChat sessionId={sessionId} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
