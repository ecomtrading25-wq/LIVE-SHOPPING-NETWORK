import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Truck,
  DollarSign,
  Clock,
  Search,
  Filter,
} from "lucide-react";

/**
 * Returns & Refunds Automation
 * Smart routing, instant approvals, restocking workflows, fraud detection
 */

interface ReturnRequest {
  id: string;
  orderId: string;
  customer: string;
  product: string;
  sku: string;
  reason: "defective" | "wrong_item" | "not_as_described" | "change_of_mind" | "damaged";
  status: "pending" | "approved" | "rejected" | "processing" | "completed";
  requestDate: string;
  amount: number;
  route: "quality_control" | "restocking" | "disposal";
  autoApproved: boolean;
  fraudScore: number;
  refundStatus: "pending" | "processing" | "completed" | "failed";
}

interface AutoApprovalRule {
  id: string;
  name: string;
  conditions: string[];
  action: string;
  enabled: boolean;
  triggeredCount: number;
  avgProcessingTime: string;
}

interface RestockingTask {
  id: string;
  returnId: string;
  product: string;
  sku: string;
  condition: "new" | "like_new" | "damaged" | "defective";
  location: string;
  status: "pending" | "in_progress" | "completed";
  assignedTo?: string;
  completedAt?: string;
}

export default function ReturnsAutomationPage() {
  const [selectedTab, setSelectedTab] = useState("requests");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock return requests
  const returns: ReturnRequest[] = [
    {
      id: "RET-001",
      orderId: "ORD-8901",
      customer: "Sarah Johnson",
      product: "Wireless Headphones Pro",
      sku: "WHP-001",
      reason: "defective",
      status: "approved",
      requestDate: "2025-12-27T14:00:00Z",
      amount: 299.99,
      route: "quality_control",
      autoApproved: false,
      fraudScore: 15,
      refundStatus: "processing",
    },
    {
      id: "RET-002",
      orderId: "ORD-8902",
      customer: "Michael Chen",
      product: "Portable Charger 20K",
      sku: "PC20-001",
      reason: "change_of_mind",
      status: "approved",
      requestDate: "2025-12-27T15:30:00Z",
      amount: 49.99,
      route: "restocking",
      autoApproved: true,
      fraudScore: 8,
      refundStatus: "completed",
    },
    {
      id: "RET-003",
      orderId: "ORD-8903",
      customer: "Emily Rodriguez",
      product: "Smart Watch Ultra",
      sku: "SWU-001",
      reason: "not_as_described",
      status: "pending",
      requestDate: "2025-12-27T16:00:00Z",
      amount: 399.99,
      route: "quality_control",
      autoApproved: false,
      fraudScore: 62,
      refundStatus: "pending",
    },
  ];

  // Mock auto-approval rules
  const autoApprovalRules: AutoApprovalRule[] = [
    {
      id: "RULE-001",
      name: "Low Value Auto-Approve",
      conditions: ["Order value < $50", "No fraud flags"],
      action: "Auto-approve and process refund",
      enabled: true,
      triggeredCount: 234,
      avgProcessingTime: "2 hours",
    },
    {
      id: "RULE-002",
      name: "Trusted Customer Fast Track",
      conditions: ["Customer orders > 5", "No previous returns"],
      action: "Auto-approve and expedite refund",
      enabled: true,
      triggeredCount: 156,
      avgProcessingTime: "4 hours",
    },
    {
      id: "RULE-003",
      name: "Defective Item Priority",
      conditions: ["Reason: Defective", "Within 30 days"],
      action: "Route to QC and auto-approve refund",
      enabled: true,
      triggeredCount: 89,
      avgProcessingTime: "6 hours",
    },
  ];

  // Mock restocking tasks
  const restockingTasks: RestockingTask[] = [
    {
      id: "TASK-001",
      returnId: "RET-002",
      product: "Portable Charger 20K",
      sku: "PC20-001",
      condition: "like_new",
      location: "Warehouse A - Aisle 3",
      status: "completed",
      assignedTo: "John Smith",
      completedAt: "2025-12-27T17:00:00Z",
    },
    {
      id: "TASK-002",
      returnId: "RET-004",
      product: "Wireless Headphones Pro",
      sku: "WHP-001",
      condition: "new",
      location: "Warehouse B - Aisle 7",
      status: "in_progress",
      assignedTo: "Jane Doe",
    },
    {
      id: "TASK-003",
      returnId: "RET-005",
      product: "Smart Watch Ultra",
      sku: "SWU-001",
      condition: "damaged",
      location: "Warehouse A - Damaged Goods",
      status: "pending",
    },
  ];

  const totalReturns = returns.length;
  const autoApprovedCount = returns.filter((r) => r.autoApproved).length;
  const avgProcessingTime = "3.5 hours";
  const returnRate = 2.8;

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case "defective":
        return "bg-red-500/20 text-red-400";
      case "wrong_item":
        return "bg-orange-500/20 text-orange-400";
      case "not_as_described":
        return "bg-yellow-500/20 text-yellow-400";
      case "change_of_mind":
        return "bg-blue-500/20 text-blue-400";
      case "damaged":
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/20 text-green-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "rejected":
        return "bg-red-500/20 text-red-400";
      case "processing":
        return "bg-blue-500/20 text-blue-400";
      case "completed":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "new":
        return "bg-green-500/20 text-green-400";
      case "like_new":
        return "bg-blue-500/20 text-blue-400";
      case "damaged":
        return "bg-orange-500/20 text-orange-400";
      case "defective":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Returns & Refunds Automation</h1>
          <p className="text-muted-foreground">
            Smart routing, instant approvals, and fraud detection
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button>
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Returns
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Returns</p>
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{totalReturns}</p>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Auto-Approved</p>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{autoApprovedCount}</p>
          <p className="text-xs text-green-500">
            {((autoApprovedCount / totalReturns) * 100).toFixed(0)}% of total
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Avg Processing Time</p>
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{avgProcessingTime}</p>
          <p className="text-xs text-green-500">-45% from last month</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Return Rate</p>
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{returnRate}%</p>
          <p className="text-xs text-red-500">+0.3% from last month</p>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="requests">
            <Package className="w-4 h-4 mr-2" />
            Return Requests
          </TabsTrigger>
          <TabsTrigger value="rules">
            <CheckCircle className="w-4 h-4 mr-2" />
            Auto-Approval Rules
          </TabsTrigger>
          <TabsTrigger value="restocking">
            <Truck className="w-4 h-4 mr-2" />
            Restocking Queue
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Return Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          <Card className="p-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by order ID, customer, or product..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-4">
              {returns.map((returnReq) => (
                <Card key={returnReq.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold">{returnReq.id}</h3>
                        <Badge className={getStatusColor(returnReq.status)}>{returnReq.status}</Badge>
                        {returnReq.autoApproved && (
                          <Badge className="bg-blue-500/20 text-blue-400">Auto-Approved</Badge>
                        )}
                        {returnReq.fraudScore > 50 && (
                          <Badge className="bg-red-500/20 text-red-400">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            High Fraud Risk
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Order: {returnReq.orderId} • Customer: {returnReq.customer}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {returnReq.status === "pending" && (
                        <>
                          <Button size="sm">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button variant="outline" size="sm">
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      {returnReq.status === "approved" && (
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Product</p>
                      <p className="font-medium">{returnReq.product}</p>
                      <p className="text-xs text-muted-foreground">SKU: {returnReq.sku}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Reason</p>
                      <Badge className={getReasonColor(returnReq.reason)}>
                        {returnReq.reason.replace("_", " ")}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Amount</p>
                      <p className="text-xl font-bold text-green-500">${returnReq.amount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Route</p>
                      <p className="font-medium">{returnReq.route.replace("_", " ")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Refund Status</p>
                      <Badge className={getStatusColor(returnReq.refundStatus)}>
                        {returnReq.refundStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t text-sm">
                    <span className="text-muted-foreground">
                      Requested: {new Date(returnReq.requestDate).toLocaleString()}
                    </span>
                    {returnReq.fraudScore > 0 && (
                      <span className="text-muted-foreground">
                        Fraud Score: <span className={returnReq.fraudScore > 50 ? "text-red-500 font-bold" : "text-green-500"}>{returnReq.fraudScore}/100</span>
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Auto-Approval Rules Tab */}
        <TabsContent value="rules">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Auto-Approval Rules</h2>
              <Button>
                <CheckCircle className="w-4 h-4 mr-2" />
                New Rule
              </Button>
            </div>

            <div className="space-y-4">
              {autoApprovalRules.map((rule) => (
                <Card key={rule.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold">{rule.name}</h3>
                        {rule.enabled ? (
                          <Badge className="bg-green-500/20 text-green-400">Enabled</Badge>
                        ) : (
                          <Badge className="bg-gray-500/20 text-gray-400">Disabled</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Triggered {rule.triggeredCount} times • Avg: {rule.avgProcessingTime}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit Rule
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Conditions</p>
                      <ul className="space-y-1">
                        {rule.conditions.map((condition, index) => (
                          <li key={index} className="text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Action</p>
                      <p className="text-sm font-medium">{rule.action}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Restocking Queue Tab */}
        <TabsContent value="restocking">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Restocking Queue</h2>

            <div className="space-y-4">
              {restockingTasks.map((task) => (
                <Card key={task.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold mb-1">{task.product}</h3>
                      <p className="text-sm text-muted-foreground">
                        Return: {task.returnId} • SKU: {task.sku}
                      </p>
                    </div>
                    <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Condition</p>
                      <Badge className={getConditionColor(task.condition)}>{task.condition}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Location</p>
                      <p className="font-medium">{task.location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                      <p className="font-medium">{task.assignedTo || "Unassigned"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Completed</p>
                      <p className="font-medium">
                        {task.completedAt
                          ? new Date(task.completedAt).toLocaleString()
                          : "Pending"}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Return Analytics</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-4">
                <h3 className="font-bold mb-4">Top Return Reasons</h3>
                <div className="space-y-3">
                  {[
                    { reason: "Defective", count: 45, percent: 35 },
                    { reason: "Change of Mind", count: 38, percent: 30 },
                    { reason: "Not as Described", count: 25, percent: 20 },
                    { reason: "Wrong Item", count: 19, percent: 15 },
                  ].map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.reason}</span>
                        <span className="font-bold">{item.count}</span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-bold mb-4">Return Rate by Category</h3>
                <div className="space-y-3">
                  {[
                    { category: "Electronics", rate: 4.2 },
                    { category: "Clothing", rate: 8.5 },
                    { category: "Home & Garden", rate: 2.1 },
                    { category: "Sports", rate: 3.8 },
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-sm">{item.category}</span>
                      <span className="font-bold text-orange-500">{item.rate}%</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-bold mb-4">Processing Metrics</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Avg Approval Time</p>
                    <p className="text-2xl font-bold">2.5 hours</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Avg Refund Time</p>
                    <p className="text-2xl font-bold">18 hours</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Fraud Detection Rate</p>
                    <p className="text-2xl font-bold text-green-500">98.5%</p>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
