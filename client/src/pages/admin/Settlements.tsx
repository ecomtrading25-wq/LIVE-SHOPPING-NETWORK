import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DollarSign,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileText,
  Download,
} from "lucide-react";

/**
 * Settlements Management Page
 * Track platform payouts and reconciliation
 */

export default function SettlementsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");

  const { data: settlements, refetch } = trpc.settlements.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    platform: platformFilter === "all" ? undefined : platformFilter,
    search: searchQuery || undefined,
  });

  const { data: stats } = trpc.settlements.getStats.useQuery();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "reconciled":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "discrepancy":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reconciled":
        return "bg-green-600";
      case "discrepancy":
        return "bg-yellow-600";
      case "pending":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settlements</h1>
          <p className="text-gray-400 mt-1">Track platform payouts and reconciliation</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                Import Settlement
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-border text-foreground">
              <DialogHeader>
                <DialogTitle className="text-foreground">Import Settlement</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Upload settlement file from payment platform
                </DialogDescription>
              </DialogHeader>
              <ImportSettlementForm onSuccess={refetch} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-background border-border text-foreground">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Settled</p>
              <p className="text-2xl font-bold text-foreground">
                ${stats?.totalSettled?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-background border-border text-foreground">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-foreground">
                ${stats?.pendingAmount?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-background border-border text-foreground">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Discrepancies</p>
              <p className="text-2xl font-bold text-foreground">{stats?.discrepancyCount || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-background border-border text-foreground">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Reconciliation Rate</p>
              <p className="text-2xl font-bold text-foreground">{stats?.reconciliationRate || 0}%</p>
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
              placeholder="Search by settlement ID, platform..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-zinc-700 text-foreground"
            />
          </div>

          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-48 bg-card border-zinc-700 text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-zinc-700 text-card-foreground">
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="shopify">Shopify</SelectItem>
              <SelectItem value="tiktok_shop">TikTok Shop</SelectItem>
              <SelectItem value="amazon">Amazon</SelectItem>
              <SelectItem value="paypal">PayPal</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-card border-zinc-700 text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-zinc-700 text-card-foreground">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reconciled">Reconciled</SelectItem>
              <SelectItem value="discrepancy">Discrepancy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Settlements Table */}
      <Card className="bg-background border-border text-foreground">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-card/50 text-card-foreground">
              <TableHead className="text-gray-400">Settlement ID</TableHead>
              <TableHead className="text-gray-400">Platform</TableHead>
              <TableHead className="text-gray-400">Period</TableHead>
              <TableHead className="text-gray-400">Expected</TableHead>
              <TableHead className="text-gray-400">Actual</TableHead>
              <TableHead className="text-gray-400">Difference</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Date</TableHead>
              <TableHead className="text-gray-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settlements?.map((settlement) => (
              <TableRow key={settlement.id} className="border-border hover:bg-card/50 text-card-foreground">
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {settlement.id.substring(0, 8)}
                </TableCell>
                <TableCell>
                  <Badge className="bg-purple-600">{settlement.platform}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{settlement.period}</TableCell>
                <TableCell className="text-foreground font-medium">
                  ${settlement.expectedAmount}
                </TableCell>
                <TableCell className="text-foreground font-medium">
                  ${settlement.actualAmount}
                </TableCell>
                <TableCell>
                  {settlement.difference !== 0 ? (
                    <span
                      className={
                        settlement.difference > 0 ? "text-green-400" : "text-red-400"
                      }
                    >
                      {settlement.difference > 0 ? "+" : ""}${settlement.difference.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-500">$0.00</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(settlement.status)}
                    <Badge className={getStatusColor(settlement.status)}>{settlement.status}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-gray-400">
                  {new Date(settlement.settledAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {!settlements || settlements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                  No settlements found
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>

      {/* Recent Discrepancies */}
      {stats?.recentDiscrepancies && stats.recentDiscrepancies.length > 0 && (
        <Card className="p-6 bg-background border-border text-foreground">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-bold text-foreground">Recent Discrepancies</h2>
          </div>
          <div className="space-y-3">
            {stats.recentDiscrepancies.map((disc: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-card rounded-lg text-card-foreground">
                <div>
                  <p className="text-foreground font-medium">{disc.description}</p>
                  <p className="text-sm text-gray-400">{disc.platform} • {disc.date}</p>
                </div>
                <Badge className="bg-yellow-600">${disc.amount}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ImportSettlementForm({ onSuccess }: { onSuccess: () => void }) {
  const [platform, setPlatform] = useState("shopify");
  const [period, setPeriod] = useState("");
  const [amount, setAmount] = useState("");

  const importMutation = trpc.settlements.import.useMutation({
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    importMutation.mutate({
      platform,
      period,
      amount: parseFloat(amount),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-gray-400 mb-2 block">Platform</label>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="bg-card border-zinc-700 text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-zinc-700 text-card-foreground">
            <SelectItem value="shopify">Shopify</SelectItem>
            <SelectItem value="tiktok_shop">TikTok Shop</SelectItem>
            <SelectItem value="amazon">Amazon</SelectItem>
            <SelectItem value="paypal">PayPal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm text-gray-400 mb-2 block">Settlement Period</label>
        <Input
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          placeholder="2024-01-01 to 2024-01-31"
          className="bg-card border-zinc-700 text-foreground"
          required
        />
      </div>

      <div>
        <label className="text-sm text-gray-400 mb-2 block">Settlement Amount</label>
        <Input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1234.56"
          className="bg-card border-zinc-700 text-foreground"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={importMutation.isPending}>
        {importMutation.isPending ? "Importing..." : "Import & Reconcile"}
      </Button>

      {importMutation.error && (
        <p className="text-sm text-red-500">{importMutation.error.message}</p>
      )}
    </form>
  );
}
