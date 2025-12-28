import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, Shield, CheckCircle, XCircle, Clock, FileText, Image,
  MessageSquare, TrendingUp, TrendingDown, DollarSign, Package, User,
  Calendar, Filter, Search, Download, Upload, Eye, Play, Pause, Zap,
  Target, BarChart3, AlertCircle, RefreshCw, Send, Paperclip
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

/**
 * LSN Dispute Management Console
 * Autonomous dispute resolution with evidence packs
 * - Auto-escalation state machine
 * - Evidence pack generation
 * - Win rate optimization
 * - Dispute timeline tracking
 * - Policy-based automation
 */

export default function DisputeManagementConsole() {
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");

  // Fetch disputes
  const { data: disputes, refetch } = trpc.lsn.dispute.getDisputes.useQuery({
    status: filterStatus === "all" ? undefined : filterStatus,
    priority: filterPriority === "all" ? undefined : filterPriority,
    searchQuery: searchQuery || undefined,
  });

  // Fetch dispute stats
  const { data: stats } = trpc.lsn.dispute.getStats.useQuery();

  // Fetch selected dispute details
  const { data: disputeDetails } = trpc.lsn.dispute.getDisputeDetails.useQuery(
    { disputeId: selectedDispute?.id },
    { enabled: !!selectedDispute }
  );

  // Fetch evidence pack
  const { data: evidencePack } = trpc.lsn.dispute.getEvidencePack.useQuery(
    { disputeId: selectedDispute?.id },
    { enabled: !!selectedDispute }
  );

  // Mutations
  const escalateMutation = trpc.lsn.dispute.escalate.useMutation({
    onSuccess: () => {
      toast.success("Dispute escalated");
      refetch();
    },
  });

  const respondMutation = trpc.lsn.dispute.respond.useMutation({
    onSuccess: () => {
      toast.success("Response submitted");
      setResponseMessage("");
      refetch();
    },
  });

  const acceptMutation = trpc.lsn.dispute.accept.useMutation({
    onSuccess: () => {
      toast.success("Dispute accepted");
      refetch();
    },
  });

  const rejectMutation = trpc.lsn.dispute.reject.useMutation({
    onSuccess: () => {
      toast.success("Dispute rejected");
      refetch();
    },
  });

  const generateEvidencePackMutation = trpc.lsn.dispute.generateEvidencePack.useMutation({
    onSuccess: () => {
      toast.success("Evidence pack generated");
      refetch();
    },
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-600";
      case "investigating": return "bg-yellow-600";
      case "escalated": return "bg-orange-600";
      case "resolved": return "bg-green-600";
      case "closed": return "bg-gray-600";
      default: return "bg-gray-600";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-600";
      case "high": return "bg-orange-600";
      case "medium": return "bg-yellow-600";
      case "low": return "bg-blue-600";
      default: return "bg-gray-600";
    }
  };

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Dispute Management Console</h1>
              <p className="text-gray-400">Autonomous resolution with evidence automation</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="p-4 bg-white/10 backdrop-blur border-white/20">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
                <Badge variant="secondary">{stats?.openDisputes || 0}</Badge>
              </div>
              <p className="text-gray-300 text-sm mb-1">Open Disputes</p>
              <p className="text-white text-2xl font-bold">{stats?.totalDisputes || 0}</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <Badge className="bg-green-600">{stats?.winRate?.toFixed(1) || 0}%</Badge>
              </div>
              <p className="text-gray-300 text-sm mb-1">Win Rate</p>
              <p className="text-white text-2xl font-bold">{stats?.won || 0}</p>
              <p className="text-gray-400 text-xs mt-1">disputes won</p>
            </Card>

            <Card className="p-4 bg-white/10 backdrop-blur border-white/20">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-blue-500" />
                <Badge variant="secondary">{stats?.avgResolutionTime || 0}h</Badge>
              </div>
              <p className="text-gray-300 text-sm mb-1">Avg Resolution</p>
              <p className="text-white text-2xl font-bold">{stats?.autoResolved || 0}</p>
              <p className="text-gray-400 text-xs mt-1">auto-resolved</p>
            </Card>

            <Card className="p-4 bg-white/10 backdrop-blur border-white/20">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-red-500" />
                <Badge variant="destructive">${stats?.atRisk?.toLocaleString() || 0}</Badge>
              </div>
              <p className="text-gray-300 text-sm mb-1">Amount at Risk</p>
              <p className="text-white text-2xl font-bold">${stats?.totalAmount?.toLocaleString() || 0}</p>
            </Card>

            <Card className="p-4 bg-white/10 backdrop-blur border-white/20">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-8 h-8 text-purple-500" />
                <Badge className="bg-purple-600">{stats?.automationRate?.toFixed(1) || 0}%</Badge>
              </div>
              <p className="text-gray-300 text-sm mb-1">Automation Rate</p>
              <p className="text-white text-2xl font-bold">{stats?.evidencePacksGenerated || 0}</p>
              <p className="text-gray-400 text-xs mt-1">evidence packs</p>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 bg-white/10 backdrop-blur border-white/20 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search disputes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] bg-white/5 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[160px] bg-white/5 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Disputes List */}
          <div className="lg:col-span-1">
            <Card className="p-4 bg-white/10 backdrop-blur border-white/20">
              <h3 className="text-lg font-bold text-white mb-4">Active Disputes</h3>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {disputes?.map((dispute) => (
                    <Card
                      key={dispute.id}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedDispute?.id === dispute.id
                          ? "bg-white/20 border-white/40"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                      onClick={() => setSelectedDispute(dispute)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(dispute.status)}>
                            {dispute.status.toUpperCase()}
                          </Badge>
                          <Badge className={getPriorityColor(dispute.priority)}>
                            {dispute.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-gray-400 text-xs">#{dispute.id}</span>
                      </div>

                      <h4 className="text-white font-semibold mb-2">{dispute.reason}</h4>

                      <div className="space-y-1 text-sm text-gray-400 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3" />
                          <span>{dispute.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-3 h-3" />
                          <span>Order #{dispute.orderId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3 h-3" />
                          <span className="font-bold text-white">${dispute.amount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{dispute.timeElapsed}</span>
                        </div>
                      </div>

                      {dispute.hasEvidencePack && (
                        <Badge variant="outline" className="text-green-400 border-green-400 text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Evidence Ready
                        </Badge>
                      )}
                    </Card>
                  ))}

                  {(!disputes || disputes.length === 0) && (
                    <div className="text-center py-12 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No disputes found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* Dispute Details */}
          <div className="lg:col-span-2">
            {selectedDispute ? (
              <div className="space-y-6">
                {/* Dispute Header */}
                <Card className="p-6 bg-white/10 backdrop-blur border-white/20">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-white">{disputeDetails?.reason || selectedDispute.reason}</h2>
                        <Badge className={getStatusColor(disputeDetails?.status || selectedDispute.status)}>
                          {(disputeDetails?.status || selectedDispute.status).toUpperCase()}
                        </Badge>
                        <Badge className={getPriorityColor(disputeDetails?.priority || selectedDispute.priority)}>
                          {(disputeDetails?.priority || selectedDispute.priority).toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-gray-400">Dispute #{disputeDetails?.id || selectedDispute.id}</p>
                    </div>

                    <div className="flex gap-2">
                      {disputeDetails?.status === "open" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => escalateMutation.mutate({ disputeId: selectedDispute.id })}
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            <Zap className="w-4 h-4 mr-1" />
                            Escalate
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => acceptMutation.mutate({ disputeId: selectedDispute.id })}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectMutation.mutate({ disputeId: selectedDispute.id })}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Customer</p>
                      <p className="text-white font-semibold">{disputeDetails?.customerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Order</p>
                      <p className="text-white font-semibold">#{disputeDetails?.orderId}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Amount</p>
                      <p className="text-white font-semibold text-lg">${disputeDetails?.amount}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Opened</p>
                      <p className="text-white font-semibold">{disputeDetails?.openedAt}</p>
                    </div>
                  </div>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="details" className="space-y-6">
                  <TabsList className="bg-white/10 backdrop-blur border-white/20">
                    <TabsTrigger value="details" className="data-[state=active]:bg-white/20">
                      <FileText className="w-4 h-4 mr-2" />
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="data-[state=active]:bg-white/20">
                      <Clock className="w-4 h-4 mr-2" />
                      Timeline
                    </TabsTrigger>
                    <TabsTrigger value="evidence" className="data-[state=active]:bg-white/20">
                      <Shield className="w-4 h-4 mr-2" />
                      Evidence Pack
                    </TabsTrigger>
                    <TabsTrigger value="communication" className="data-[state=active]:bg-white/20">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Communication
                    </TabsTrigger>
                  </TabsList>

                  {/* Details Tab */}
                  <TabsContent value="details" className="space-y-6">
                    <Card className="p-6 bg-white/10 backdrop-blur border-white/20">
                      <h3 className="text-lg font-bold text-white mb-4">Dispute Description</h3>
                      <p className="text-gray-300 mb-4">{disputeDetails?.description}</p>

                      <h4 className="text-md font-semibold text-white mb-2">Customer Claim</h4>
                      <p className="text-gray-300 mb-4">{disputeDetails?.customerClaim}</p>

                      {disputeDetails?.customerEvidence && disputeDetails.customerEvidence.length > 0 && (
                        <>
                          <h4 className="text-md font-semibold text-white mb-2">Customer Evidence</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {disputeDetails.customerEvidence.map((evidence: any, idx: number) => (
                              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-800">
                                <img src={evidence.url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </Card>

                    <Card className="p-6 bg-white/10 backdrop-blur border-white/20">
                      <h3 className="text-lg font-bold text-white mb-4">Order Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Order Date</p>
                          <p className="text-white">{disputeDetails?.orderDate}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Delivery Date</p>
                          <p className="text-white">{disputeDetails?.deliveryDate || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Tracking Number</p>
                          <p className="text-white">{disputeDetails?.trackingNumber || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Payment Method</p>
                          <p className="text-white">{disputeDetails?.paymentMethod}</p>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>

                  {/* Timeline Tab */}
                  <TabsContent value="timeline" className="space-y-6">
                    <Card className="p-6 bg-white/10 backdrop-blur border-white/20">
                      <h3 className="text-lg font-bold text-white mb-4">Dispute Timeline</h3>
                      <div className="space-y-4">
                        {disputeDetails?.timeline?.map((event: any, idx: number) => (
                          <div key={idx} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                event.type === "opened" ? "bg-blue-500/20" :
                                event.type === "escalated" ? "bg-orange-500/20" :
                                event.type === "resolved" ? "bg-green-500/20" :
                                "bg-gray-500/20"
                              }`}>
                                {event.type === "opened" && <AlertTriangle className="w-5 h-5 text-blue-500" />}
                                {event.type === "escalated" && <Zap className="w-5 h-5 text-orange-500" />}
                                {event.type === "resolved" && <CheckCircle className="w-5 h-5 text-green-500" />}
                                {event.type === "message" && <MessageSquare className="w-5 h-5 text-gray-500" />}
                              </div>
                              {idx < (disputeDetails?.timeline?.length || 0) - 1 && (
                                <div className="w-0.5 h-full bg-white/20 mt-2" />
                              )}
                            </div>
                            <div className="flex-1 pb-6">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-white font-semibold">{event.title}</p>
                                <span className="text-gray-400 text-sm">{event.timestamp}</span>
                              </div>
                              <p className="text-gray-400 text-sm">{event.description}</p>
                              {event.actor && (
                                <p className="text-gray-500 text-xs mt-1">by {event.actor}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </TabsContent>

                  {/* Evidence Pack Tab */}
                  <TabsContent value="evidence" className="space-y-6">
                    <Card className="p-6 bg-white/10 backdrop-blur border-white/20">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Evidence Pack</h3>
                        {!evidencePack && (
                          <Button
                            size="sm"
                            onClick={() => generateEvidencePackMutation.mutate({ disputeId: selectedDispute.id })}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Zap className="w-4 h-4 mr-1" />
                            Generate Pack
                          </Button>
                        )}
                        {evidencePack && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>

                      {evidencePack ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="text-white font-semibold">Evidence Pack Ready</span>
                            </div>
                            <p className="text-gray-300 text-sm">
                              Win probability: <span className="font-bold text-green-400">{evidencePack.winProbability}%</span>
                            </p>
                          </div>

                          <div>
                            <h4 className="text-white font-semibold mb-2">Included Evidence</h4>
                            <div className="space-y-2">
                              {evidencePack.items?.map((item: any, idx: number) => (
                                <div key={idx} className="p-3 bg-white/5 rounded-lg flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {item.type === "image" && <Image className="w-5 h-5 text-blue-500" />}
                                    {item.type === "document" && <FileText className="w-5 h-5 text-purple-500" />}
                                    {item.type === "tracking" && <Package className="w-5 h-5 text-green-500" />}
                                    <div>
                                      <p className="text-white font-medium">{item.name}</p>
                                      <p className="text-gray-400 text-xs">{item.description}</p>
                                    </div>
                                  </div>
                                  <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-white font-semibold mb-2">Recommended Response</h4>
                            <div className="p-4 bg-white/5 rounded-lg">
                              <p className="text-gray-300 text-sm whitespace-pre-wrap">{evidencePack.recommendedResponse}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="mb-2">No evidence pack generated yet</p>
                          <p className="text-sm">Click "Generate Pack" to create an automated evidence collection</p>
                        </div>
                      )}
                    </Card>
                  </TabsContent>

                  {/* Communication Tab */}
                  <TabsContent value="communication" className="space-y-6">
                    <Card className="p-6 bg-white/10 backdrop-blur border-white/20">
                      <h3 className="text-lg font-bold text-white mb-4">Communication History</h3>
                      <ScrollArea className="h-[400px] mb-4">
                        <div className="space-y-4">
                          {disputeDetails?.messages?.map((message: any, idx: number) => (
                            <div
                              key={idx}
                              className={`p-4 rounded-lg ${
                                message.sender === "customer"
                                  ? "bg-blue-500/20 ml-8"
                                  : "bg-purple-500/20 mr-8"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-semibold">{message.senderName}</span>
                                <span className="text-gray-400 text-xs">{message.timestamp}</span>
                              </div>
                              <p className="text-gray-300 text-sm">{message.content}</p>
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 flex gap-2">
                                  {message.attachments.map((att: any, attIdx: number) => (
                                    <Badge key={attIdx} variant="outline" className="text-xs">
                                      <Paperclip className="w-3 h-3 mr-1" />
                                      {att.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      <div className="space-y-3">
                        <Textarea
                          placeholder="Type your response..."
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          rows={4}
                          className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                        />
                        <div className="flex items-center justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            <Paperclip className="w-4 h-4 mr-1" />
                            Attach File
                          </Button>
                          <Button
                            onClick={() => respondMutation.mutate({
                              disputeId: selectedDispute.id,
                              message: responseMessage,
                            })}
                            disabled={!responseMessage.trim() || respondMutation.isLoading}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Send Response
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card className="p-12 bg-white/10 backdrop-blur border-white/20 text-center h-full flex items-center justify-center">
                <div>
                  <AlertTriangle className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
                  <h3 className="text-2xl font-bold text-white mb-2">No Dispute Selected</h3>
                  <p className="text-gray-400">Select a dispute from the list to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
