import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Advanced Order Management Page
 * Bulk actions, order notes, refund processing, and timeline tracking
 */

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  date: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  total: number;
  items: number;
  paymentMethod: string;
  shippingAddress: string;
  trackingNumber?: string;
  notes: string[];
  timeline: TimelineEvent[];
}

interface TimelineEvent {
  id: string;
  type: "order_placed" | "payment_confirmed" | "processing" | "shipped" | "delivered" | "note_added" | "refunded";
  title: string;
  description: string;
  timestamp: string;
  user?: string;
}

export default function AdvancedOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [newNote, setNewNote] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  // Mock orders data
  const orders: Order[] = [
    {
      id: "1",
      orderNumber: "ORD-2025-001",
      customerName: "John Doe",
      customerEmail: "john@example.com",
      date: "2025-12-27",
      status: "processing",
      total: 299.99,
      items: 3,
      paymentMethod: "Credit Card",
      shippingAddress: "123 Main St, Los Angeles, CA 90210",
      notes: ["Customer requested gift wrapping", "Priority shipping"],
      timeline: [
        {
          id: "1",
          type: "order_placed",
          title: "Order Placed",
          description: "Order was placed successfully",
          timestamp: "2025-12-27T10:30:00Z",
        },
        {
          id: "2",
          type: "payment_confirmed",
          title: "Payment Confirmed",
          description: "Payment of $299.99 confirmed via Stripe",
          timestamp: "2025-12-27T10:31:00Z",
        },
        {
          id: "3",
          type: "processing",
          title: "Processing",
          description: "Order is being prepared for shipment",
          timestamp: "2025-12-27T11:00:00Z",
          user: "Warehouse Team",
        },
      ],
    },
    {
      id: "2",
      orderNumber: "ORD-2025-002",
      customerName: "Jane Smith",
      customerEmail: "jane@example.com",
      date: "2025-12-26",
      status: "shipped",
      total: 149.99,
      items: 2,
      paymentMethod: "PayPal",
      shippingAddress: "456 Oak Ave, San Francisco, CA 94102",
      trackingNumber: "1Z999AA10123456784",
      notes: [],
      timeline: [
        {
          id: "1",
          type: "order_placed",
          title: "Order Placed",
          description: "Order was placed successfully",
          timestamp: "2025-12-26T14:20:00Z",
        },
        {
          id: "2",
          type: "payment_confirmed",
          title: "Payment Confirmed",
          description: "Payment of $149.99 confirmed via PayPal",
          timestamp: "2025-12-26T14:21:00Z",
        },
        {
          id: "3",
          type: "processing",
          title: "Processing",
          description: "Order is being prepared for shipment",
          timestamp: "2025-12-26T15:00:00Z",
          user: "Warehouse Team",
        },
        {
          id: "4",
          type: "shipped",
          title: "Shipped",
          description: "Order shipped via UPS - Tracking: 1Z999AA10123456784",
          timestamp: "2025-12-27T09:00:00Z",
          user: "Shipping Dept",
        },
      ],
    },
  ];

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((o) => o.id));
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleBulkAction = (action: string) => {
    toast.success(`${action} applied to ${selectedOrders.length} orders`);
    setSelectedOrders([]);
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !viewingOrder) return;

    const noteEvent: TimelineEvent = {
      id: Date.now().toString(),
      type: "note_added",
      title: "Note Added",
      description: newNote,
      timestamp: new Date().toISOString(),
      user: "Admin",
    };

    viewingOrder.timeline.push(noteEvent);
    viewingOrder.notes.push(newNote);
    setNewNote("");
    toast.success("Note added successfully");
  };

  const handleRefund = () => {
    if (!refundAmount || !refundReason || !viewingOrder) return;

    const refundEvent: TimelineEvent = {
      id: Date.now().toString(),
      type: "refunded",
      title: "Refund Processed",
      description: `Refunded $${refundAmount} - Reason: ${refundReason}`,
      timestamp: new Date().toISOString(),
      user: "Admin",
    };

    viewingOrder.timeline.push(refundEvent);
    viewingOrder.status = "refunded";
    setRefundAmount("");
    setRefundReason("");
    toast.success("Refund processed successfully");
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      shipped: "bg-red-500/20 text-red-400 border-red-500/30",
      delivered: "bg-green-500/20 text-green-400 border-green-500/30",
      cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      refunded: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "processing":
        return <Package className="w-4 h-4" />;
      case "shipped":
        return <Truck className="w-4 h-4" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
      case "refunded":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case "order_placed":
        return <Package className="w-5 h-5 text-blue-400" />;
      case "payment_confirmed":
        return <DollarSign className="w-5 h-5 text-green-400" />;
      case "processing":
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case "shipped":
        return <Truck className="w-5 h-5 text-red-400" />;
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "note_added":
        return <MessageSquare className="w-5 h-5 text-gray-400" />;
      case "refunded":
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Advanced Order Management</h1>
          <p className="text-gray-400 mt-2">Bulk actions, notes, refunds, and timeline tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Orders
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: "Pending", count: orders.filter((o) => o.status === "pending").length, color: "yellow" },
          { label: "Processing", count: orders.filter((o) => o.status === "processing").length, color: "blue" },
          { label: "Shipped", count: orders.filter((o) => o.status === "shipped").length, color: "red" },
          { label: "Delivered", count: orders.filter((o) => o.status === "delivered").length, color: "green" },
          { label: "Refunded", count: orders.filter((o) => o.status === "refunded").length, color: "red" },
        ].map((stat) => (
          <Card key={stat.label} className="p-4 bg-background text-foreground/5 border-white/10">
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.count}</p>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card className="p-6 bg-background text-foreground/5 border-white/10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by order number, customer name, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <Card className="p-4 bg-red-500/10 border-red-500/30">
          <div className="flex items-center justify-between">
            <p className="text-foreground font-medium">{selectedOrders.length} orders selected</p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("Mark as Processing")}>
                Mark as Processing
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("Mark as Shipped")}>
                Mark as Shipped
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction("Export Selected")}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Orders Table */}
      <Card className="bg-background text-foreground/5 border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4">
                  <Checkbox
                    checked={selectedOrders.length === filteredOrders.length}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="text-left p-4 text-gray-400 font-medium">Order</th>
                <th className="text-left p-4 text-gray-400 font-medium">Customer</th>
                <th className="text-left p-4 text-gray-400 font-medium">Date</th>
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                <th className="text-left p-4 text-gray-400 font-medium">Items</th>
                <th className="text-left p-4 text-gray-400 font-medium">Total</th>
                <th className="text-left p-4 text-gray-400 font-medium">Notes</th>
                <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-white/5 hover:bg-background text-foreground/5">
                  <td className="p-4">
                    <Checkbox
                      checked={selectedOrders.includes(order.id)}
                      onCheckedChange={() => handleSelectOrder(order.id)}
                    />
                  </td>
                  <td className="p-4">
                    <p className="text-foreground font-medium">{order.orderNumber}</p>
                    <p className="text-gray-400 text-sm">{order.paymentMethod}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-foreground font-medium">{order.customerName}</p>
                    <p className="text-gray-400 text-sm">{order.customerEmail}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-foreground">{order.date}</p>
                  </td>
                  <td className="p-4">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-foreground">{order.items}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-foreground font-medium">${order.total.toFixed(2)}</p>
                  </td>
                  <td className="p-4">
                    {order.notes.length > 0 && (
                      <div className="flex items-center gap-1 text-red-400">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm">{order.notes.length}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <Button size="sm" variant="outline" onClick={() => setViewingOrder(order)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {viewingOrder?.orderNumber}</DialogTitle>
          </DialogHeader>

          {viewingOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-background text-foreground/5 border-white/10">
                  <p className="text-gray-400 text-sm mb-1">Customer</p>
                  <p className="text-foreground font-medium">{viewingOrder.customerName}</p>
                  <p className="text-gray-400 text-sm">{viewingOrder.customerEmail}</p>
                </Card>
                <Card className="p-4 bg-background text-foreground/5 border-white/10">
                  <p className="text-gray-400 text-sm mb-1">Shipping Address</p>
                  <p className="text-foreground text-sm">{viewingOrder.shippingAddress}</p>
                </Card>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Order Timeline</h3>
                <div className="space-y-4">
                  {viewingOrder.timeline.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="p-2 bg-background text-foreground/10 rounded-full">{getTimelineIcon(event.type)}</div>
                        {index < viewingOrder.timeline.length - 1 && (
                          <div className="w-0.5 h-full bg-background text-foreground/10 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="text-foreground font-medium">{event.title}</p>
                        <p className="text-gray-400 text-sm">{event.description}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                          {event.user && ` • ${event.user}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Note */}
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Add Note</h3>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Enter order note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAddNote}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Add Note
                  </Button>
                </div>
              </div>

              {/* Refund Section */}
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Process Refund</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Refund amount"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                  />
                  <Input
                    placeholder="Refund reason"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                  />
                </div>
                <Button onClick={handleRefund} variant="destructive" className="mt-4">
                  Process Refund
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
