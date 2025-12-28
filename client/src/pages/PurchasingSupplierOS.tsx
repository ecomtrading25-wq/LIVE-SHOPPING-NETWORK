import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Package, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Clock,
  Truck, Globe, Star, Shield, Target, BarChart3, Search, Filter,
  Download, Upload, Plus, Edit, Eye, XCircle, RefreshCw, Zap,
  FileText, Image as ImageIcon, Calendar, Users, Award, TrendingDown
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

/**
 * LSN Purchasing & Supplier OS
 * Complete procurement and supplier management system
 * - Lot-based purchasing
 * - Landed cost calculations
 * - Supplier scorecards
 * - QC & defect tracking
 * - Automated reordering
 * - Multi-currency support
 */

export default function PurchasingSupplierOS() {
  const [selectedTab, setSelectedTab] = useState("lots");
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showCreateLotDialog, setShowCreateLotDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch lots
  const { data: lots, refetch: refetchLots } = trpc.lsn.purchasing.getLots.useQuery({
    status: filterStatus === "all" ? undefined : filterStatus,
    searchQuery: searchQuery || undefined,
  });

  // Fetch suppliers
  const { data: suppliers } = trpc.lsn.purchasing.getSuppliers.useQuery();

  // Fetch purchasing stats
  const { data: stats } = trpc.lsn.purchasing.getStats.useQuery();

  // Fetch lot details
  const { data: lotDetails } = trpc.lsn.purchasing.getLotDetails.useQuery(
    { lotId: selectedLot?.id },
    { enabled: !!selectedLot }
  );

  // Fetch supplier details
  const { data: supplierDetails } = trpc.lsn.purchasing.getSupplierDetails.useQuery(
    { supplierId: selectedSupplier?.id },
    { enabled: !!selectedSupplier }
  );

  // Mutations
  const createLotMutation = trpc.lsn.purchasing.createLot.useMutation({
    onSuccess: () => {
      toast.success("Lot created successfully");
      setShowCreateLotDialog(false);
      refetchLots();
    },
  });

  const approveLotMutation = trpc.lsn.purchasing.approveLot.useMutation({
    onSuccess: () => {
      toast.success("Lot approved");
      refetchLots();
    },
  });

  const receiveLotMutation = trpc.lsn.purchasing.receiveLot.useMutation({
    onSuccess: () => {
      toast.success("Lot received");
      refetchLots();
    },
  });

  const qcPassMutation = trpc.lsn.purchasing.qcPass.useMutation({
    onSuccess: () => {
      toast.success("QC passed");
      refetchLots();
    },
  });

  const qcFailMutation = trpc.lsn.purchasing.qcFail.useMutation({
    onSuccess: () => {
      toast.success("QC failed - lot flagged");
      refetchLots();
    },
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-600";
      case "approved": return "bg-blue-600";
      case "ordered": return "bg-purple-600";
      case "in_transit": return "bg-orange-600";
      case "received": return "bg-green-600";
      case "qc_passed": return "bg-emerald-600";
      case "qc_failed": return "bg-red-600";
      case "cancelled": return "bg-gray-600";
      default: return "bg-gray-600";
    }
  };

  // Get supplier rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-500";
    if (rating >= 3.5) return "text-blue-500";
    if (rating >= 2.5) return "text-yellow-500";
    return "text-red-500";
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Purchasing & Supplier OS</h1>
              <p className="text-gray-400">Complete procurement and supplier management</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCreateLotDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Lot
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchLots()}
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
                <Package className="w-8 h-8 text-blue-500" />
                <Badge variant="secondary">{stats?.activeLots || 0}</Badge>
              </div>
              <p className="text-gray-300 text-sm mb-1">Active Lots</p>
              <p className="text-white text-2xl font-bold">{stats?.totalLots || 0}</p>
            </Card>

            <Card className="p-4 bg-white/10 backdrop-blur border-white/20">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-green-500" />
                <Badge className="bg-green-600">
                  {stats?.costSavings && stats.costSavings > 0 ? "+" : ""}
                  {stats?.costSavings?.toFixed(1) || 0}%
                </Badge>
              </div>
              <p className="text-gray-300 text-sm mb-1">Total Spend</p>
              <p className="text-white text-2xl font-bold">${stats?.totalSpend?.toLocaleString() || "0"}</p>
            </Card>

            <Card className="p-4 bg-white/10 backdrop-blur border-white/20">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-purple-500" />
                <Badge className="bg-purple-600">{stats?.activeSuppliers || 0}</Badge>
              </div>
              <p className="text-gray-300 text-sm mb-1">Suppliers</p>
              <p className="text-white text-2xl font-bold">{stats?.totalSuppliers || 0}</p>
            </Card>

            <Card className="p-4 bg-white/10 backdrop-blur border-white/20">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-yellow-500" />
                <Badge className="bg-yellow-600">{stats?.avgLandedCost?.toFixed(2) || 0}</Badge>
              </div>
              <p className="text-gray-300 text-sm mb-1">Avg Landed Cost</p>
              <p className="text-white text-2xl font-bold">${stats?.totalLandedCost?.toLocaleString() || "0"}</p>
            </Card>

            <Card className="p-4 bg-white/10 backdrop-blur border-white/20">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
                <Badge className="bg-emerald-600">{stats?.qcPassRate?.toFixed(1) || 0}%</Badge>
              </div>
              <p className="text-gray-300 text-sm mb-1">QC Pass Rate</p>
              <p className="text-white text-2xl font-bold">{stats?.qcPassed || 0}</p>
              <p className="text-gray-400 text-xs mt-1">of {stats?.qcTotal || 0} inspected</p>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="bg-white/10 backdrop-blur border-white/20 mb-6">
            <TabsTrigger value="lots" className="data-[state=active]:bg-white/20">
              <Package className="w-4 h-4 mr-2" />
              Lots
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="data-[state=active]:bg-white/20">
              <Users className="w-4 h-4 mr-2" />
              Suppliers
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white/20">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Lots Tab */}
          <TabsContent value="lots" className="space-y-6">
            {/* Filters */}
            <Card className="p-4 bg-white/10 backdrop-blur border-white/20">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search lots..."
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="ordered">Ordered</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="qc_passed">QC Passed</SelectItem>
                    <SelectItem value="qc_failed">QC Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Lots List */}
            <div className="space-y-4">
              {lots?.map((lot) => (
                <Card key={lot.id} className="p-6 bg-white/10 backdrop-blur border-white/20">
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                      {lot.productImage ? (
                        <img src={lot.productImage} alt={lot.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-10 h-10 text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Lot Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-white font-bold text-lg">{lot.productName}</h3>
                            <Badge className={getStatusColor(lot.status)}>
                              {lot.status.toUpperCase().replace("_", " ")}
                            </Badge>
                            {lot.isUrgent && (
                              <Badge variant="destructive">URGENT</Badge>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">Lot #{lot.id} • {lot.supplierName}</p>
                        </div>

                        <div className="flex gap-2">
                          {lot.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => approveLotMutation.mutate({ lotId: lot.id })}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          )}
                          {lot.status === "in_transit" && (
                            <Button
                              size="sm"
                              onClick={() => receiveLotMutation.mutate({ lotId: lot.id })}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Truck className="w-4 h-4 mr-1" />
                              Mark Received
                            </Button>
                          )}
                          {lot.status === "received" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => qcPassMutation.mutate({ lotId: lot.id })}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                QC Pass
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => qcFailMutation.mutate({ lotId: lot.id })}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                QC Fail
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedLot(lot)}
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Quantity</p>
                          <p className="text-white font-bold text-lg">{lot.quantity?.toLocaleString()}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Unit Cost</p>
                          <p className="text-white font-bold text-lg">${lot.unitCost?.toFixed(2)}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Landed Cost</p>
                          <p className="text-green-500 font-bold text-lg">${lot.landedCost?.toFixed(2)}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Total Value</p>
                          <p className="text-white font-bold text-lg">${lot.totalValue?.toLocaleString()}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">ETA</p>
                          <p className="text-white font-bold text-lg">{lot.eta || "TBD"}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Lead Time</p>
                          <p className="text-white font-bold text-lg">{lot.leadTime || 0} days</p>
                        </div>
                      </div>

                      {/* Cost Breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Product Cost</p>
                          <p className="text-gray-300 text-sm">${lot.productCost?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Shipping</p>
                          <p className="text-gray-300 text-sm">${lot.shippingCost?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Duties</p>
                          <p className="text-gray-300 text-sm">${lot.dutiesCost?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Fees</p>
                          <p className="text-gray-300 text-sm">${lot.feesCost?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Other</p>
                          <p className="text-gray-300 text-sm">${lot.otherCosts?.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Alerts */}
                      {lot.alerts && lot.alerts.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {lot.alerts.map((alert: any, idx: number) => (
                            <div key={idx} className={`p-2 rounded-lg flex items-center gap-2 ${
                              alert.severity === "critical" ? "bg-red-500/20 border border-red-500/30" :
                              alert.severity === "warning" ? "bg-yellow-500/20 border border-yellow-500/30" :
                              "bg-blue-500/20 border border-blue-500/30"
                            }`}>
                              <AlertTriangle className={`w-4 h-4 ${
                                alert.severity === "critical" ? "text-red-500" :
                                alert.severity === "warning" ? "text-yellow-500" :
                                "text-blue-500"
                              }`} />
                              <p className="text-white text-sm">{alert.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {(!lots || lots.length === 0) && (
                <Card className="p-12 bg-white/10 backdrop-blur border-white/20 text-center">
                  <Package className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
                  <h3 className="text-2xl font-bold text-white mb-2">No Lots Found</h3>
                  <p className="text-gray-400 mb-4">Create your first purchase lot to get started.</p>
                  <Button onClick={() => setShowCreateLotDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Lot
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers?.map((supplier) => (
                <Card key={supplier.id} className="p-6 bg-white/10 backdrop-blur border-white/20">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1">{supplier.name}</h3>
                      <p className="text-gray-400 text-sm">{supplier.country}</p>
                    </div>
                    <Badge className={
                      supplier.tier === "platinum" ? "bg-purple-600" :
                      supplier.tier === "gold" ? "bg-yellow-600" :
                      supplier.tier === "silver" ? "bg-gray-400" :
                      "bg-gray-600"
                    }>
                      {supplier.tier.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(supplier.rating)
                              ? "text-yellow-500 fill-current"
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`font-bold ${getRatingColor(supplier.rating)}`}>
                      {supplier.rating?.toFixed(1)}
                    </span>
                    <span className="text-gray-400 text-sm">({supplier.reviews} reviews)</span>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Total Orders</span>
                      <span className="text-white font-bold">{supplier.totalOrders}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Total Spend</span>
                      <span className="text-white font-bold">${supplier.totalSpend?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">On-Time Rate</span>
                      <span className={`font-bold ${
                        supplier.onTimeRate >= 90 ? "text-green-500" :
                        supplier.onTimeRate >= 75 ? "text-yellow-500" :
                        "text-red-500"
                      }`}>
                        {supplier.onTimeRate?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">QC Pass Rate</span>
                      <span className={`font-bold ${
                        supplier.qcPassRate >= 95 ? "text-green-500" :
                        supplier.qcPassRate >= 85 ? "text-yellow-500" :
                        "text-red-500"
                      }`}>
                        {supplier.qcPassRate?.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedSupplier(supplier)}
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}

              {(!suppliers || suppliers.length === 0) && (
                <Card className="p-12 bg-white/10 backdrop-blur border-white/20 text-center col-span-full">
                  <Users className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
                  <h3 className="text-2xl font-bold text-white mb-2">No Suppliers Found</h3>
                  <p className="text-gray-400">Add suppliers to start managing your supply chain.</p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Spend Trend */}
            <Card className="p-6 bg-white/10 backdrop-blur border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Purchasing Spend Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats?.spendTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="date" stroke="#ffffff80" />
                  <YAxis stroke="#ffffff80" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#ffffff' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="spend" stroke="#10b981" strokeWidth={2} name="Spend ($)" />
                  <Line type="monotone" dataKey="landedCost" stroke="#3b82f6" strokeWidth={2} name="Landed Cost ($)" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Suppliers by Spend */}
              <Card className="p-6 bg-white/10 backdrop-blur border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Top Suppliers by Spend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats?.topSuppliers || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="name" stroke="#ffffff80" />
                    <YAxis stroke="#ffffff80" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#ffffff' }}
                    />
                    <Bar dataKey="spend" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Cost Breakdown */}
              <Card className="p-6 bg-white/10 backdrop-blur border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">Cost Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.costBreakdown || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(stats?.costBreakdown || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* QC Performance */}
            <Card className="p-6 bg-white/10 backdrop-blur border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">QC Performance by Supplier</h3>
              <div className="space-y-3">
                {stats?.qcBySupplier?.map((supplier: any) => (
                  <div key={supplier.id} className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">{supplier.name}</span>
                      <span className={`font-bold ${
                        supplier.passRate >= 95 ? "text-green-500" :
                        supplier.passRate >= 85 ? "text-yellow-500" :
                        "text-red-500"
                      }`}>
                        {supplier.passRate?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          supplier.passRate >= 95 ? "bg-green-500" :
                          supplier.passRate >= 85 ? "bg-yellow-500" :
                          "bg-red-500"
                        }`}
                        style={{ width: `${supplier.passRate}%` }}
                      />
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      {supplier.passed} passed / {supplier.total} inspected
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Lot Dialog */}
        <Dialog open={showCreateLotDialog} onOpenChange={setShowCreateLotDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Purchase Lot</DialogTitle>
              <DialogDescription>Create a new purchase order lot</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product1">Product 1</SelectItem>
                      <SelectItem value="product2">Product 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" placeholder="1000" />
                </div>
                <div className="space-y-2">
                  <Label>Unit Cost</Label>
                  <Input type="number" placeholder="5.00" step="0.01" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Shipping Cost</Label>
                  <Input type="number" placeholder="500.00" step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label>Duties & Fees</Label>
                  <Input type="number" placeholder="200.00" step="0.01" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Expected Delivery Date</Label>
                <Input type="date" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateLotDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => createLotMutation.mutate({})}>
                Create Lot
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
