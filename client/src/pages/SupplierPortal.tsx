import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Truck,
  Star,
  FileText,
  Plus,
  Search,
} from "lucide-react";

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: string;
  items: number;
  total: number;
  status: "pending" | "approved" | "shipped" | "delivered";
  createdAt: string;
  expectedDelivery: string;
}

interface Supplier {
  id: string;
  name: string;
  rating: number;
  totalOrders: number;
  onTimeDelivery: number;
  qualityScore: number;
  totalSpend: number;
  status: "active" | "pending" | "inactive";
}

export default function SupplierPortal() {
  return (
    <AdminProtectedRoute>
      <SupplierPortalContent />
    </AdminProtectedRoute>
  );
}

function SupplierPortalContent() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const [suppliers] = useState<Supplier[]>([
    {
      id: "1",
      name: "TechSupply Co.",
      rating: 4.8,
      totalOrders: 145,
      onTimeDelivery: 96,
      qualityScore: 4.7,
      totalSpend: 234500,
      status: "active",
    },
    {
      id: "2",
      name: "Gadget Wholesale",
      rating: 4.5,
      totalOrders: 89,
      onTimeDelivery: 92,
      qualityScore: 4.4,
      totalSpend: 156780,
      status: "active",
    },
    {
      id: "3",
      name: "Office Plus",
      rating: 4.2,
      totalOrders: 67,
      onTimeDelivery: 88,
      qualityScore: 4.1,
      totalSpend: 98450,
      status: "active",
    },
  ]);

  const [purchaseOrders] = useState<PurchaseOrder[]>([
    {
      id: "1",
      orderNumber: "PO-2024-001",
      supplier: "TechSupply Co.",
      items: 50,
      total: 15000,
      status: "approved",
      createdAt: "2024-01-20",
      expectedDelivery: "2024-01-27",
    },
    {
      id: "2",
      orderNumber: "PO-2024-002",
      supplier: "Gadget Wholesale",
      items: 30,
      total: 9000,
      status: "shipped",
      createdAt: "2024-01-18",
      expectedDelivery: "2024-01-25",
    },
    {
      id: "3",
      orderNumber: "PO-2024-003",
      supplier: "Office Plus",
      items: 20,
      total: 4000,
      status: "pending",
      createdAt: "2024-01-21",
      expectedDelivery: "2024-01-28",
    },
  ]);

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "approved":
      case "delivered":
        return "bg-green-500/20 text-green-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "shipped":
        return "bg-blue-500/20 text-blue-400";
      case "inactive":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.status === "active").length;
  const totalSpend = suppliers.reduce((sum, s) => sum + s.totalSpend, 0);
  const avgOnTimeDelivery = (
    suppliers.reduce((sum, s) => sum + s.onTimeDelivery, 0) / suppliers.length
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Supplier Portal</h1>
              <p className="text-gray-400 mt-1">Manage suppliers and purchase orders</p>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <FileText className="w-4 h-4 mr-2" />
                New PO
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalSuppliers}</p>
                  <p className="text-sm text-gray-400">Total Suppliers</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{activeSuppliers}</p>
                  <p className="text-sm text-gray-400">Active Suppliers</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    ${(totalSpend / 1000).toFixed(0)}K
                  </p>
                  <p className="text-sm text-gray-400">Total Spend</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Truck className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{avgOnTimeDelivery}%</p>
                  <p className="text-sm text-gray-400">On-Time Delivery</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Purchase Orders */}
        <Card className="p-6 bg-white/5 border-white/10 mb-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Recent Purchase Orders</h3>
          <div className="space-y-3">
            {purchaseOrders.map((po) => (
              <div
                key={po.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold">{po.orderNumber}</p>
                    <p className="text-sm text-gray-400">{po.supplier}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-foreground font-semibold">{po.items} items</p>
                    <p className="text-sm text-gray-400">
                      ${po.total.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Expected</p>
                    <p className="text-foreground font-medium">
                      {new Date(po.expectedDelivery).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={getStatusColor(po.status)}>
                    {po.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Suppliers */}
        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground">Suppliers</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search suppliers..."
                className="pl-10 bg-white/10 border-white/20 text-foreground"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="p-5 bg-white/5 border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-foreground">{supplier.name}</h4>
                      <Badge className={getStatusColor(supplier.status)}>
                        {supplier.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-foreground font-medium">{supplier.rating}</span>
                      <span>• {supplier.totalOrders} orders</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="border-purple-500/30">
                    View Details
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Truck className="w-4 h-4 text-blue-400" />
                      <p className="text-xs text-gray-400">On-Time Delivery</p>
                    </div>
                    <p className="text-xl font-bold text-foreground">{supplier.onTimeDelivery}%</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <p className="text-xs text-gray-400">Quality Score</p>
                    </div>
                    <p className="text-xl font-bold text-foreground">{supplier.qualityScore}</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <p className="text-xs text-gray-400">Total Spend</p>
                    </div>
                    <p className="text-xl font-bold text-foreground">
                      ${(supplier.totalSpend / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
