import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Upload,
  Send,
  Eye,
  Filter,
  Search,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Package,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";

export default function DisputeManagementConsole() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDispute, setSelectedDispute] = useState<any>(null);

  // Fetch disputes
  const { data: disputes, isLoading, refetch } = trpc.disputes.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchQuery || undefined,
    limit: 50,
  });

  // Fetch dispute stats
  const { data: stats } = trpc.disputes.getStats.useQuery();

  // Mutations
  const submitEvidence = trpc.disputes.submitEvidence.useMutation({
    onSuccess: () => {
      toast.success("Evidence submitted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to submit evidence: ${error.message}`);
    },
  });

  const updateDisputeStatus = trpc.disputes.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Dispute status updated");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const addNote = trpc.disputes.addNote.useMutation({
    onSuccess: () => {
      toast.success("Note added");
      refetch();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "EVIDENCE_REQUIRED":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "EVIDENCE_BUILDING":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "EVIDENCE_READY":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "SUBMITTED":
        return "bg-indigo-500/20 text-indigo-400 border-indigo-500/50";
      case "WON":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "LOST":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "NEEDS_MANUAL":
        return "bg-pink-500/20 text-pink-400 border-pink-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getPriorityLevel = (dispute: any) => {
    const hoursUntilDeadline = dispute.evidenceDeadline
      ? (new Date(dispute.evidenceDeadline).getTime() - Date.now()) / (1000 * 60 * 60)
      : null;

    if (dispute.needsManual) return { level: "URGENT", color: "text-red-500" };
    if (hoursUntilDeadline && hoursUntilDeadline < 24) return { level: "HIGH", color: "text-orange-500" };
    if (hoursUntilDeadline && hoursUntilDeadline < 72) return { level: "MEDIUM", color: "text-yellow-500" };
    return { level: "LOW", color: "text-green-500" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <AlertCircle className="w-10 h-10 text-red-500" />
            Dispute Management Console
          </h1>
          <p className="text-gray-400">
            Monitor and manage all disputes with automated evidence building
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-500/30 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-400 text-sm font-medium">Open Disputes</span>
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats?.openCount || 0}
            </div>
            <div className="text-xs text-gray-400">
              {stats?.needsManualCount || 0} need manual review
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 border-yellow-500/30 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-400 text-sm font-medium">Evidence Required</span>
              <FileText className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats?.evidenceRequiredCount || 0}
            </div>
            <div className="text-xs text-gray-400">
              {stats?.urgentCount || 0} urgent (&lt; 24h)
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-500/30 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-400 text-sm font-medium">Win Rate</span>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats?.winRate ? `${(stats.winRate * 100).toFixed(1)}%` : "N/A"}
            </div>
            <div className="text-xs text-gray-400">
              {stats?.wonCount || 0} won / {stats?.lostCount || 0} lost
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-purple-500/30 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-400 text-sm font-medium">Total at Risk</span>
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              ${((stats?.totalAtRisk || 0) / 100).toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">
              Across {stats?.openCount || 0} open disputes
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white/5 border-white/10 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by order ID, case ID, or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-foreground"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-foreground">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="EVIDENCE_REQUIRED">Evidence Required</SelectItem>
                <SelectItem value="EVIDENCE_BUILDING">Building Evidence</SelectItem>
                <SelectItem value="EVIDENCE_READY">Evidence Ready</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="NEEDS_MANUAL">Needs Manual Review</SelectItem>
                <SelectItem value="WON">Won</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="border-white/20 text-foreground hover:bg-white/10"
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </div>
        </Card>

        {/* Disputes List */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-foreground">Loading disputes...</p>
          </div>
        ) : disputes && disputes.length > 0 ? (
          <div className="space-y-4">
            {disputes.map((dispute: any) => {
              const priority = getPriorityLevel(dispute);
              return (
                <Card
                  key={dispute.id}
                  className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors p-6"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: Main Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-foreground">
                              Case #{dispute.providerCaseId}
                            </h3>
                            <Badge className={getStatusColor(dispute.status)}>
                              {dispute.status.replace(/_/g, " ")}
                            </Badge>
                            {dispute.needsManual && (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                MANUAL REVIEW
                              </Badge>
                            )}
                            <Badge className={`${priority.color} bg-white/10`}>
                              {priority.level}
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-sm mb-2">
                            Order: <span className="text-foreground font-mono">{dispute.orderId}</span>
                          </p>
                          <p className="text-muted-foreground">
                            {dispute.reason || "No reason provided"}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-foreground mb-1">
                            ${(dispute.amountCents / 100).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {dispute.currency}
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                        <span>
                          Created: {new Date(dispute.createdAt).toLocaleDateString()}
                        </span>
                        {dispute.evidenceDeadline && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Deadline: {new Date(dispute.evidenceDeadline).toLocaleDateString()}
                            <span className={priority.color}>
                              ({Math.ceil((new Date(dispute.evidenceDeadline).getTime() - Date.now()) / (1000 * 60 * 60))}h left)
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Evidence Pack Status */}
                      {dispute.evidencePack && (
                        <div className="bg-white/5 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-foreground font-semibold flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Evidence Pack
                            </span>
                            <Badge className={getStatusColor(dispute.evidencePack.status)}>
                              {dispute.evidencePack.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-400">Tracking:</span>
                              <span className="text-foreground ml-2">
                                {dispute.evidencePack.trackingNumber || "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Attachments:</span>
                              <span className="text-foreground ml-2">
                                {dispute.evidencePack.attachments?.length || 0} files
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-foreground"
                              onClick={() => setSelectedDispute(dispute)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-background border-white/10 text-foreground">
                            <DialogHeader>
                              <DialogTitle className="text-foreground">
                                Dispute Details - Case #{dispute.providerCaseId}
                              </DialogTitle>
                              <DialogDescription className="text-gray-400">
                                Complete information and evidence for this dispute
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 mt-4">
                              {/* Dispute Info */}
                              <div>
                                <h4 className="text-foreground font-semibold mb-3">Dispute Information</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-400">Provider:</span>
                                    <span className="text-foreground ml-2">{dispute.provider}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Status:</span>
                                    <span className="text-foreground ml-2">{dispute.status}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Amount:</span>
                                    <span className="text-foreground ml-2">
                                      ${(dispute.amountCents / 100).toFixed(2)} {dispute.currency}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Order ID:</span>
                                    <span className="text-foreground ml-2 font-mono">{dispute.orderId}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Evidence Pack */}
                              {dispute.evidencePack && (
                                <div>
                                  <h4 className="text-foreground font-semibold mb-3">Evidence Pack</h4>
                                  <div className="bg-white/5 rounded-lg p-4 space-y-3">
                                    <div>
                                      <span className="text-gray-400 text-sm">Tracking Number:</span>
                                      <p className="text-foreground">{dispute.evidencePack.trackingNumber || "N/A"}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 text-sm">Product Description:</span>
                                      <p className="text-foreground">{dispute.evidencePack.productDescription || "N/A"}</p>
                                    </div>
                                    {dispute.evidencePack.attachments && dispute.evidencePack.attachments.length > 0 && (
                                      <div>
                                        <span className="text-gray-400 text-sm">Attachments:</span>
                                        <ul className="mt-2 space-y-1">
                                          {dispute.evidencePack.attachments.map((att: any, idx: number) => (
                                            <li key={idx} className="text-foreground text-sm flex items-center gap-2">
                                              <FileText className="w-4 h-4" />
                                              {att.name} ({att.type})
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Timeline */}
                              <div>
                                <h4 className="text-foreground font-semibold mb-3">Timeline</h4>
                                <div className="space-y-2">
                                  {dispute.timeline?.map((event: any) => (
                                    <div key={event.id} className="flex gap-3 text-sm">
                                      <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                                      <div className="flex-1">
                                        <p className="text-foreground">{event.message}</p>
                                        <p className="text-gray-400 text-xs">
                                          {new Date(event.createdAt).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-3">
                                {dispute.status === "EVIDENCE_READY" && (
                                  <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      submitEvidence.mutate({ disputeId: dispute.id });
                                    }}
                                  >
                                    <Send className="w-4 h-4 mr-2" />
                                    Submit Evidence
                                  </Button>
                                )}
                                {dispute.needsManual && (
                                  <Button
                                    className="bg-yellow-600 hover:bg-yellow-700"
                                    onClick={() => {
                                      updateDisputeStatus.mutate({
                                        disputeId: dispute.id,
                                        status: "EVIDENCE_BUILDING",
                                        needsManual: false,
                                      });
                                    }}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark as Reviewed
                                  </Button>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {dispute.status === "EVIDENCE_READY" && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-foreground"
                            onClick={() => {
                              submitEvidence.mutate({ disputeId: dispute.id });
                            }}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Submit Evidence
                          </Button>
                        )}

                        {dispute.needsManual && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                            onClick={() => {
                              updateDisputeStatus.mutate({
                                disputeId: dispute.id,
                                status: "EVIDENCE_BUILDING",
                                needsManual: false,
                              });
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark Reviewed
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Right: Quick Actions */}
                    <div className="lg:w-64 space-y-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-white/20 text-foreground hover:bg-white/10"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        View Order
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-white/20 text-foreground hover:bg-white/10"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Add Note
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-white/5 border-white/10 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">
              No disputes found
            </h3>
            <p className="text-gray-400">
              {statusFilter === "all"
                ? "Great! There are no disputes to review."
                : `No disputes with status "${statusFilter}"`}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
