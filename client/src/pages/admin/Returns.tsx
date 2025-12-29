import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  RotateCcw,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

/**
 * Returns Management Portal
 * Handle return requests, refund processing, and restocking
 */

export default function ReturnsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);

  // Form state
  const [processData, setProcessData] = useState({
    decision: "approve" as "approve" | "reject",
    refundAmount: 0,
    restockQuantity: 0,
    notes: "",
  });

  const utils = trpc.useUtils();

  // Mock data - in production, replace with actual tRPC queries
  const mockReturns = [
    {
      id: "RET001",
      orderNumber: "ORD-2024-001",
      customerName: "John Doe",
      customerEmail: "john@example.com",
      productName: "Wireless Headphones",
      sku: "WH-001",
      quantity: 1,
      reason: "defective",
      reasonText: "Left speaker not working",
      status: "pending",
      requestedAt: new Date("2024-01-15"),
      refundAmount: 79.99,
    },
    {
      id: "RET002",
      orderNumber: "ORD-2024-002",
      customerName: "Jane Smith",
      customerEmail: "jane@example.com",
      productName: "Smart Watch",
      sku: "SW-002",
      quantity: 1,
      reason: "wrong_item",
      reasonText: "Ordered black but received white",
      status: "pending",
      requestedAt: new Date("2024-01-14"),
      refundAmount: 199.99,
    },
    {
      id: "RET003",
      orderNumber: "ORD-2024-003",
      customerName: "Bob Johnson",
      customerEmail: "bob@example.com",
      productName: "Laptop Stand",
      sku: "LS-003",
      quantity: 2,
      reason: "not_as_described",
      reasonText: "Material quality not as advertised",
      status: "approved",
      requestedAt: new Date("2024-01-13"),
      processedAt: new Date("2024-01-14"),
      refundAmount: 59.98,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-600">Pending Review</Badge>;
      case "approved":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-600">Rejected</Badge>;
      case "completed":
        return <Badge className="bg-blue-600">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      defective: "Defective/Damaged",
      wrong_item: "Wrong Item Received",
      not_as_described: "Not As Described",
      changed_mind: "Changed Mind",
      other: "Other",
    };
    return labels[reason] || reason;
  };

  const handleProcess = (returnItem: any) => {
    setSelectedReturn(returnItem);
    setProcessData({
      decision: "approve",
      refundAmount: returnItem.refundAmount,
      restockQuantity: returnItem.quantity,
      notes: "",
    });
    setIsProcessDialogOpen(true);
  };

  const handleSubmitDecision = () => {
    // In production, call tRPC mutation
    toast.success(
      `Return ${processData.decision === "approve" ? "approved" : "rejected"} successfully`
    );
    setIsProcessDialogOpen(false);
    setSelectedReturn(null);
  };

  // Filter returns
  const filteredReturns = mockReturns.filter((ret) => {
    const matchesSearch =
      ret.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || ret.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    pending: mockReturns.filter((r) => r.status === "pending").length,
    approved: mockReturns.filter((r) => r.status === "approved").length,
    rejected: mockReturns.filter((r) => r.status === "rejected").length,
    totalRefundAmount: mockReturns
      .filter((r) => r.status === "approved")
      .reduce((sum, r) => sum + r.refundAmount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-foreground">
          Returns Management
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          Process return requests and manage refunds
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-foreground">
                {stats.pending}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Pending Review
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-foreground">
                {stats.approved}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Approved</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-foreground">
                {stats.rejected}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Rejected</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-foreground">
                ${stats.totalRefundAmount.toFixed(2)}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Total Refunded
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by order, customer, or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Returns Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background dark:bg-background border-b border-zinc-200 dark:border-border text-foreground">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-foreground">
                  Return ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-foreground">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-foreground">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-foreground">
                  Reason
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-foreground">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900 dark:text-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-zinc-900 dark:text-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredReturns.map((returnItem) => (
                <tr
                  key={returnItem.id}
                  className="hover:bg-background dark:hover:bg-background/50 text-foreground"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-foreground">
                        {returnItem.id}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Order: {returnItem.orderNumber}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-foreground">
                        {returnItem.customerName}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {returnItem.customerEmail}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-foreground">
                        {returnItem.productName}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        SKU: {returnItem.sku} × {returnItem.quantity}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-foreground">
                        {getReasonLabel(returnItem.reason)}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {returnItem.reasonText}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-zinc-900 dark:text-foreground">
                      ${returnItem.refundAmount.toFixed(2)}
                    </p>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(returnItem.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {returnItem.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleProcess(returnItem)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Process
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredReturns.length === 0 && (
            <div className="text-center py-12">
              <RotateCcw className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
              <p className="text-zinc-600 dark:text-zinc-400">No returns found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Process Return Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Return Request</DialogTitle>
          </DialogHeader>

          {selectedReturn && (
            <div className="space-y-6">
              {/* Return Details */}
              <div className="bg-background dark:bg-background p-4 rounded-lg space-y-2 text-foreground">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Return ID:
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-foreground">
                    {selectedReturn.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Product:
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-foreground">
                    {selectedReturn.productName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Reason:
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-foreground">
                    {getReasonLabel(selectedReturn.reason)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Customer Note:
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-foreground">
                    {selectedReturn.reasonText}
                  </span>
                </div>
              </div>

              {/* Decision */}
              <div>
                <label className="text-sm font-medium text-zinc-900 dark:text-foreground mb-2 block">
                  Decision
                </label>
                <Select
                  value={processData.decision}
                  onValueChange={(value: any) =>
                    setProcessData({ ...processData, decision: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve Return</SelectItem>
                    <SelectItem value="reject">Reject Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {processData.decision === "approve" && (
                <>
                  {/* Refund Amount */}
                  <div>
                    <label className="text-sm font-medium text-zinc-900 dark:text-foreground mb-2 block">
                      Refund Amount
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={processData.refundAmount}
                      onChange={(e) =>
                        setProcessData({
                          ...processData,
                          refundAmount: parseFloat(e.target.value),
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>

                  {/* Restock Quantity */}
                  <div>
                    <label className="text-sm font-medium text-zinc-900 dark:text-foreground mb-2 block">
                      Restock Quantity
                    </label>
                    <Input
                      type="number"
                      value={processData.restockQuantity}
                      onChange={(e) =>
                        setProcessData({
                          ...processData,
                          restockQuantity: parseInt(e.target.value),
                        })
                      }
                      placeholder="0"
                    />
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      Set to 0 if item is defective and cannot be restocked
                    </p>
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-zinc-900 dark:text-foreground mb-2 block">
                  Internal Notes
                </label>
                <Textarea
                  value={processData.notes}
                  onChange={(e) =>
                    setProcessData({ ...processData, notes: e.target.value })
                  }
                  placeholder="Add any internal notes about this return..."
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSubmitDecision}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {processData.decision === "approve"
                    ? "Approve & Process Refund"
                    : "Reject Return"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsProcessDialogOpen(false);
                    setSelectedReturn(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
