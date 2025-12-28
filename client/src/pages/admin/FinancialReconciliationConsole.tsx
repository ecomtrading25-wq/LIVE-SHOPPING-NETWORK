import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Filter,
  Search,
  Eye,
  Link as LinkIcon,
  Calendar,
  ArrowUpDown
} from "lucide-react";
import { toast } from "sonner";

export default function FinancialReconciliationConsole() {
  const [dateRange, setDateRange] = useState("7d");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // Fetch reconciliation stats
  const { data: stats } = trpc.financial.getReconciliationStats.useQuery({
    dateRange,
  });

  // Fetch unmatched transactions
  const { data: unmatchedTransactions, refetch } = trpc.financial.getUnmatchedTransactions.useQuery({
    limit: 50,
    search: searchQuery || undefined,
  });

  // Fetch recent reconciliations
  const { data: recentReconciliations } = trpc.financial.getRecentReconciliations.useQuery({
    limit: 20,
  });

  // Fetch ledger entries
  const { data: ledgerEntries } = trpc.financial.getLedgerEntries.useQuery({
    dateRange,
    limit: 100,
  });

  // Mutations
  const manualMatch = trpc.financial.manualMatch.useMutation({
    onSuccess: () => {
      toast.success("Transactions matched successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to match: ${error.message}`);
    },
  });

  const runReconciliation = trpc.financial.runReconciliation.useMutation({
    onSuccess: (result) => {
      toast.success(`Reconciliation complete: ${result.matchedCount} matched`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Reconciliation failed: ${error.message}`);
    },
  });

  const exportLedger = trpc.financial.exportLedger.useMutation({
    onSuccess: (data) => {
      // Download CSV
      const blob = new Blob([data.csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ledger-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      toast.success("Ledger exported successfully");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "MATCHED":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "UNMATCHED":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "DISCREPANCY":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "PENDING":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <DollarSign className="w-10 h-10 text-green-500" />
                Financial Reconciliation Console
              </h1>
              <p className="text-gray-400">
                Monitor transactions, match payments, and maintain ledger accuracy
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => runReconciliation.mutate({ dateRange })}
                disabled={runReconciliation.isLoading}
              >
                {runReconciliation.isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Run Reconciliation
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => exportLedger.mutate({ dateRange })}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Ledger
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-500/30 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-400 text-sm font-medium">Matched</span>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats?.matchedCount || 0}
            </div>
            <div className="text-xs text-gray-400">
              ${((stats?.matchedAmount || 0) / 100).toLocaleString()}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 border-yellow-500/30 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-400 text-sm font-medium">Unmatched</span>
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats?.unmatchedCount || 0}
            </div>
            <div className="text-xs text-gray-400">
              ${((stats?.unmatchedAmount || 0) / 100).toLocaleString()}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-900/30 to-red-800/30 border-red-500/30 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-400 text-sm font-medium">Discrepancies</span>
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats?.discrepancyCount || 0}
            </div>
            <div className="text-xs text-gray-400">
              ${((stats?.discrepancyAmount || 0) / 100).toLocaleString()}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-500/30 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-400 text-sm font-medium">Match Rate</span>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats?.matchRate ? `${(stats.matchRate * 100).toFixed(1)}%` : "N/A"}
            </div>
            <div className="text-xs text-gray-400">
              Last {dateRange === "7d" ? "7 days" : dateRange === "30d" ? "30 days" : "90 days"}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/5 border-white/10 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by transaction ID, order ID, or amount..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="MATCHED">Matched</SelectItem>
                <SelectItem value="UNMATCHED">Unmatched</SelectItem>
                <SelectItem value="DISCREPANCY">Discrepancy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Unmatched Transactions */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
              Unmatched Transactions
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 ml-2">
                {unmatchedTransactions?.length || 0}
              </Badge>
            </h2>
            <p className="text-gray-400 mt-1">
              Review and manually match these transactions
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-gray-400">Transaction ID</TableHead>
                  <TableHead className="text-gray-400">Provider</TableHead>
                  <TableHead className="text-gray-400">Amount</TableHead>
                  <TableHead className="text-gray-400">Date</TableHead>
                  <TableHead className="text-gray-400">Type</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unmatchedTransactions && unmatchedTransactions.length > 0 ? (
                  unmatchedTransactions.map((txn: any) => (
                    <TableRow key={txn.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-mono text-white text-sm">
                        {txn.providerTransactionId}
                      </TableCell>
                      <TableCell className="text-white">
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                          {txn.provider}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white font-semibold">
                        ${(txn.amountCents / 100).toFixed(2)} {txn.currency}
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {new Date(txn.transactionDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={txn.type === "CREDIT" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                          {txn.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(txn.status)}>
                          {txn.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-white/20 text-white hover:bg-white/10"
                                onClick={() => setSelectedTransaction(txn)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-gray-900 border-white/10">
                              <DialogHeader>
                                <DialogTitle className="text-white">
                                  Transaction Details
                                </DialogTitle>
                                <DialogDescription className="text-gray-400">
                                  Review and manually match this transaction
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-400">Transaction ID:</span>
                                    <p className="text-white font-mono">{txn.providerTransactionId}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Provider:</span>
                                    <p className="text-white">{txn.provider}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Amount:</span>
                                    <p className="text-white font-semibold">
                                      ${(txn.amountCents / 100).toFixed(2)} {txn.currency}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Type:</span>
                                    <p className="text-white">{txn.type}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Date:</span>
                                    <p className="text-white">
                                      {new Date(txn.transactionDate).toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Status:</span>
                                    <p className="text-white">{txn.status}</p>
                                  </div>
                                </div>

                                {txn.metadata && (
                                  <div>
                                    <span className="text-gray-400 text-sm">Metadata:</span>
                                    <pre className="mt-2 bg-white/5 rounded p-3 text-white text-xs overflow-auto">
                                      {JSON.stringify(txn.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                <div className="flex gap-3">
                                  <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      // Manual match logic
                                      toast.info("Manual match interface coming soon");
                                    }}
                                  >
                                    <LinkIcon className="w-4 h-4 mr-2" />
                                    Manual Match
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                            onClick={() => {
                              toast.info("Auto-match interface coming soon");
                            }}
                          >
                            <LinkIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-white font-semibold">All transactions matched!</p>
                      <p className="text-gray-400 text-sm">No unmatched transactions found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Ledger Entries */}
        <Card className="bg-white/5 border-white/10">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-500" />
              Ledger Entries
            </h2>
            <p className="text-gray-400 mt-1">
              Complete transaction history and ledger records
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-gray-400">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      Date <ArrowUpDown className="w-3 h-3 ml-1" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-gray-400">Entry Type</TableHead>
                  <TableHead className="text-gray-400">Description</TableHead>
                  <TableHead className="text-gray-400">Debit</TableHead>
                  <TableHead className="text-gray-400">Credit</TableHead>
                  <TableHead className="text-gray-400">Balance</TableHead>
                  <TableHead className="text-gray-400">Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerEntries && ledgerEntries.length > 0 ? (
                  ledgerEntries.map((entry: any) => (
                    <TableRow key={entry.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-gray-400 text-sm">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                          {entry.entryType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white text-sm max-w-xs truncate">
                        {entry.description}
                      </TableCell>
                      <TableCell className="text-red-400 font-semibold">
                        {entry.debitCents ? `$${(entry.debitCents / 100).toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-green-400 font-semibold">
                        {entry.creditCents ? `$${(entry.creditCents / 100).toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-white font-semibold">
                        ${(entry.balanceCents / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm font-mono">
                        {entry.referenceId || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <p className="text-gray-400">No ledger entries found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
