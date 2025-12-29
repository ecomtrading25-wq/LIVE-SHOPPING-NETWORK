import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  FileText,
  MessageSquare,
} from "lucide-react";

/**
 * Disputes Management Page
 * Handle chargebacks and disputes with AI-powered resolution
 */

export default function DisputesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);

  const { data: disputes, refetch } = trpc.disputes.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchQuery || undefined,
  });

  const { data: stats } = trpc.disputes.getStats.useQuery();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "under_review":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "won":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "lost":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-yellow-600";
      case "under_review":
        return "bg-blue-600";
      case "won":
        return "bg-green-600";
      case "lost":
        return "bg-red-600";
      case "closed":
        return "bg-gray-600";
      default:
        return "bg-gray-600";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600";
      case "high":
        return "bg-orange-600";
      case "medium":
        return "bg-yellow-600";
      case "low":
        return "bg-green-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Disputes</h1>
          <p className="text-gray-400 mt-1">Manage chargebacks and payment disputes</p>
        </div>

        <Button variant="outline">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Bulk Review
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-background border-border text-foreground">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Open Disputes</p>
              <p className="text-2xl font-bold text-foreground">{stats?.openDisputes || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-background border-border text-foreground">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Win Rate</p>
              <p className="text-2xl font-bold text-foreground">{stats?.winRate || 0}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-background border-border text-foreground">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Amount at Risk</p>
              <p className="text-2xl font-bold text-foreground">
                ${stats?.amountAtRisk?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-background border-border text-foreground">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">AI Resolved</p>
              <p className="text-2xl font-bold text-foreground">{stats?.aiResolved || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-background border-border text-foreground">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by order number, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-zinc-700 text-foreground"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-card border-zinc-700 text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-zinc-700 text-card-foreground">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Disputes Table */}
      <Card className="bg-background border-border text-foreground">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-card/50 text-card-foreground">
              <TableHead className="text-gray-400">Dispute ID</TableHead>
              <TableHead className="text-gray-400">Order</TableHead>
              <TableHead className="text-gray-400">Customer</TableHead>
              <TableHead className="text-gray-400">Amount</TableHead>
              <TableHead className="text-gray-400">Reason</TableHead>
              <TableHead className="text-gray-400">Severity</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Deadline</TableHead>
              <TableHead className="text-gray-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {disputes?.map((dispute) => (
              <TableRow key={dispute.id} className="border-border hover:bg-card/50 text-card-foreground">
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {dispute.id.substring(0, 8)}
                </TableCell>
                <TableCell className="text-foreground font-medium">#{dispute.orderId}</TableCell>
                <TableCell className="text-muted-foreground">{dispute.customerName}</TableCell>
                <TableCell className="text-red-400 font-medium">${dispute.amount}</TableCell>
                <TableCell>
                  <Badge className="bg-purple-600">{dispute.reason}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getSeverityColor(dispute.severity)}>{dispute.severity}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(dispute.status)}
                    <Badge className={getStatusColor(dispute.status)}>{dispute.status}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-gray-400">
                  {dispute.deadline
                    ? new Date(dispute.deadline).toLocaleDateString()
                    : "No deadline"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDispute(dispute.id)}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          AI Resolve
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-background border-border max-w-2xl text-foreground">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">AI Dispute Resolution</DialogTitle>
                          <DialogDescription className="text-gray-400">
                            Review AI-generated resolution for dispute #{dispute.id.substring(0, 8)}
                          </DialogDescription>
                        </DialogHeader>
                        <AIResolutionPanel disputeId={dispute.id} onSuccess={refetch} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {!disputes || disputes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                  No disputes found
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function AIResolutionPanel({
  disputeId,
  onSuccess,
}: {
  disputeId: string;
  onSuccess: () => void;
}) {
  const { data: resolution, isLoading } = trpc.disputes.getAIResolution.useQuery({ disputeId });
  const resolveMutation = trpc.disputes.resolve.useMutation({ onSuccess });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
          <p className="text-gray-400">AI analyzing dispute...</p>
        </div>
      </div>
    );
  }

  if (!resolution) {
    return (
      <div className="text-center py-12 text-gray-400">Failed to generate AI resolution</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Analysis */}
      <Card className="p-4 bg-card border-zinc-700 text-card-foreground">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="font-bold text-foreground">AI Analysis</h3>
          <Badge className="bg-purple-600 ml-auto">
            {resolution.confidence}% Confidence
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">{resolution.analysis}</p>
      </Card>

      {/* Recommended Action */}
      <Card className="p-4 bg-card border-zinc-700 text-card-foreground">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <h3 className="font-bold text-foreground">Recommended Action</h3>
          <Badge
            className={
              resolution.action === "refund"
                ? "bg-red-600"
                : resolution.action === "replacement"
                  ? "bg-yellow-600"
                  : "bg-blue-600"
            }
          >
            {resolution.action}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">{resolution.reasoning}</p>
      </Card>

      {/* Evidence Requirements */}
      {resolution.evidenceRequired && resolution.evidenceRequired.length > 0 && (
        <Card className="p-4 bg-card border-zinc-700 text-card-foreground">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-foreground">Evidence Required</h3>
          </div>
          <ul className="space-y-2">
            {resolution.evidenceRequired.map((item, idx) => (
              <li key={idx} className="text-muted-foreground text-sm flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Generated Response */}
      <Card className="p-4 bg-card border-zinc-700 text-card-foreground">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-green-500" />
          <h3 className="font-bold text-foreground">Generated Response</h3>
        </div>
        <Textarea
          value={resolution.responseTemplate}
          readOnly
          className="bg-background border-zinc-700 text-foreground min-h-32"
        />
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          className="flex-1"
          onClick={() =>
            resolveMutation.mutate({
              disputeId,
              action: resolution.action,
              response: resolution.responseTemplate,
            })
          }
          disabled={resolveMutation.isPending}
        >
          {resolveMutation.isPending ? "Applying..." : "Apply AI Resolution"}
        </Button>
        <Button variant="outline" className="flex-1">
          Manual Review
        </Button>
      </div>
    </div>
  );
}
