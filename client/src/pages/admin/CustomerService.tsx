import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Bot,
  User,
  Send,
  Search,
  Filter,
  Star,
  ThumbsUp,
  ThumbsDown,
  Zap,
} from "lucide-react";

/**
 * Advanced Customer Service Hub
 * AI chatbot, ticket management, live agent handoff, sentiment analysis, CSAT tracking
 */

interface Ticket {
  id: string;
  customer: {
    name: string;
    email: string;
    avatar: string;
    tier: string;
  };
  subject: string;
  status: "open" | "in_progress" | "waiting" | "resolved";
  priority: "urgent" | "high" | "medium" | "low";
  category: string;
  assignedTo?: string;
  messages: Message[];
  sentiment: "positive" | "neutral" | "negative";
  createdAt: string;
  updatedAt: string;
  responseTime: number;
  resolutionTime?: number;
}

interface Message {
  id: string;
  sender: "customer" | "agent" | "bot";
  content: string;
  timestamp: string;
  sentiment?: "positive" | "neutral" | "negative";
}

interface CSATResponse {
  ticketId: string;
  rating: number;
  feedback: string;
  timestamp: string;
}

export default function CustomerServicePage() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | Ticket["status"]>("all");

  // Mock tickets
  const tickets: Ticket[] = [
    {
      id: "TKT-001",
      customer: {
        name: "Sarah Johnson",
        email: "sarah.j@email.com",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
        tier: "Gold",
      },
      subject: "Order not received after 2 weeks",
      status: "open",
      priority: "urgent",
      category: "Shipping",
      messages: [
        {
          id: "1",
          sender: "customer",
          content: "I ordered a product 2 weeks ago (Order #12345) but haven't received it yet. Can you help?",
          timestamp: "2025-12-27T08:30:00Z",
          sentiment: "negative",
        },
        {
          id: "2",
          sender: "bot",
          content: "I'm sorry to hear about the delay. Let me check your order status for you.",
          timestamp: "2025-12-27T08:30:15Z",
        },
      ],
      sentiment: "negative",
      createdAt: "2025-12-27T08:30:00Z",
      updatedAt: "2025-12-27T08:30:15Z",
      responseTime: 15,
    },
    {
      id: "TKT-002",
      customer: {
        name: "Michael Chen",
        email: "m.chen@email.com",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
        tier: "Platinum",
      },
      subject: "Product quality issue - requesting refund",
      status: "in_progress",
      priority: "high",
      category: "Returns",
      assignedTo: "Agent Sarah",
      messages: [
        {
          id: "1",
          sender: "customer",
          content: "The wireless earbuds I received have poor sound quality. I'd like a refund.",
          timestamp: "2025-12-26T14:20:00Z",
          sentiment: "negative",
        },
        {
          id: "2",
          sender: "agent",
          content: "I understand your frustration. I'll process your refund right away. Can you provide photos of the product?",
          timestamp: "2025-12-26T14:25:00Z",
        },
        {
          id: "3",
          sender: "customer",
          content: "Sure, I'll send them now. Thanks for the quick response!",
          timestamp: "2025-12-26T14:30:00Z",
          sentiment: "positive",
        },
      ],
      sentiment: "neutral",
      createdAt: "2025-12-26T14:20:00Z",
      updatedAt: "2025-12-26T14:30:00Z",
      responseTime: 300,
    },
    {
      id: "TKT-003",
      customer: {
        name: "Emily Rodriguez",
        email: "emily.r@email.com",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
        tier: "Silver",
      },
      subject: "How to use loyalty points?",
      status: "resolved",
      priority: "low",
      category: "Account",
      assignedTo: "Bot Assistant",
      messages: [
        {
          id: "1",
          sender: "customer",
          content: "I have 5000 loyalty points. How can I use them?",
          timestamp: "2025-12-25T10:00:00Z",
          sentiment: "neutral",
        },
        {
          id: "2",
          sender: "bot",
          content: "You can use your loyalty points at checkout! For every 100 points, you get $1 off. You currently have $50 in rewards.",
          timestamp: "2025-12-25T10:00:05Z",
        },
        {
          id: "3",
          sender: "customer",
          content: "Perfect, thank you!",
          timestamp: "2025-12-25T10:01:00Z",
          sentiment: "positive",
        },
      ],
      sentiment: "positive",
      createdAt: "2025-12-25T10:00:00Z",
      updatedAt: "2025-12-25T10:01:00Z",
      responseTime: 5,
      resolutionTime: 60,
    },
  ];

  // Mock CSAT data
  const csatData: CSATResponse[] = [
    {
      ticketId: "TKT-003",
      rating: 5,
      feedback: "Quick and helpful response!",
      timestamp: "2025-12-25T10:05:00Z",
    },
    {
      ticketId: "TKT-004",
      rating: 4,
      feedback: "Good service, but took a bit long",
      timestamp: "2025-12-24T16:30:00Z",
    },
  ];

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const openTickets = tickets.filter((t) => t.status === "open").length;
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress").length;
  const avgResponseTime = tickets.reduce((sum, t) => sum + t.responseTime, 0) / tickets.length;
  const avgCSAT = csatData.reduce((sum, c) => sum + c.rating, 0) / csatData.length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/20 text-red-400";
      case "high":
        return "bg-orange-500/20 text-orange-400";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400";
      case "low":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500/20 text-blue-400";
      case "in_progress":
        return "bg-red-500/20 text-red-400";
      case "waiting":
        return "bg-yellow-500/20 text-yellow-400";
      case "resolved":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <ThumbsUp className="w-4 h-4 text-green-400" />;
      case "negative":
        return <ThumbsDown className="w-4 h-4 text-red-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    // In production, send message via API
    setMessageInput("");
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Customer Service Hub</h1>
          <p className="text-muted-foreground">
            AI-powered support with live agent handoff and sentiment analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Bot className="w-4 h-4 mr-2" />
            AI Settings
          </Button>
          <Button>
            <Zap className="w-4 h-4 mr-2" />
            Create Ticket
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Open Tickets</p>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{openTickets}</p>
          <p className="text-xs text-red-500">Requires attention</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <Clock className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{inProgressTickets}</p>
          <p className="text-xs text-muted-foreground">Being handled</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Avg Response Time</p>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{Math.round(avgResponseTime)}s</p>
          <p className="text-xs text-green-500">-15% from last week</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">CSAT Score</p>
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{avgCSAT.toFixed(1)}/5</p>
          <p className="text-xs text-green-500">+0.3 from last month</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket List */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tickets..."
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => setFilterStatus("all")}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === "open" ? "default" : "outline"}
                  onClick={() => setFilterStatus("open")}
                >
                  Open
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === "in_progress" ? "default" : "outline"}
                  onClick={() => setFilterStatus("in_progress")}
                >
                  In Progress
                </Button>
                <Button
                  size="sm"
                  variant={filterStatus === "resolved" ? "default" : "outline"}
                  onClick={() => setFilterStatus("resolved")}
                >
                  Resolved
                </Button>
              </div>

              {/* Ticket List */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredTickets.map((ticket) => (
                  <Card
                    key={ticket.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedTicket?.id === ticket.id ? "border-primary" : ""
                    }`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <img
                        src={ticket.customer.avatar}
                        alt={ticket.customer.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm truncate">{ticket.customer.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {ticket.customer.tier}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{ticket.subject}</p>
                      </div>
                      {getSentimentIcon(ticket.sentiment)}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                      <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                      <Badge variant="outline" className="text-xs">
                        {ticket.category}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{ticket.id}</span>
                      <span>{new Date(ticket.updatedAt).toLocaleTimeString()}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Ticket Detail & Chat */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <Card className="p-6">
              {/* Ticket Header */}
              <div className="border-b pb-4 mb-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedTicket.subject}</h2>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(selectedTicket.status)}>
                        {selectedTicket.status}
                      </Badge>
                      <Badge className={getPriorityColor(selectedTicket.priority)}>
                        {selectedTicket.priority}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{selectedTicket.id}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Escalate
                    </Button>
                    <Button size="sm">Resolve</Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Customer</p>
                    <p className="font-medium">{selectedTicket.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Response Time</p>
                    <p className="font-medium">{selectedTicket.responseTime}s</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Sentiment</p>
                    <div className="flex items-center gap-2">
                      {getSentimentIcon(selectedTicket.sentiment)}
                      <span className="font-medium capitalize">{selectedTicket.sentiment}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
                {selectedTicket.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.sender === "customer" ? "" : "flex-row-reverse"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.sender === "customer"
                          ? "bg-blue-500"
                          : message.sender === "bot"
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                    >
                      {message.sender === "customer" ? (
                        <User className="w-4 h-4 text-foreground" />
                      ) : message.sender === "bot" ? (
                        <Bot className="w-4 h-4 text-foreground" />
                      ) : (
                        <Users className="w-4 h-4 text-foreground" />
                      )}
                    </div>
                    <div className={`flex-1 ${message.sender === "customer" ? "" : "text-right"}`}>
                      <div
                        className={`inline-block p-3 rounded-lg ${
                          message.sender === "customer"
                            ? "bg-muted"
                            : message.sender === "bot"
                            ? "bg-red-500/20"
                            : "bg-green-500/20"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                        {message.sentiment && (
                          <>
                            <span>•</span>
                            {getSentimentIcon(message.sentiment)}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="flex gap-3">
                <Textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your response..."
                  className="flex-1"
                  rows={3}
                />
                <div className="flex flex-col gap-2">
                  <Button onClick={handleSendMessage}>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                  <Button variant="outline">
                    <Bot className="w-4 h-4 mr-2" />
                    AI Suggest
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl font-semibold mb-2">No Ticket Selected</p>
              <p className="text-muted-foreground">Select a ticket from the list to view details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
