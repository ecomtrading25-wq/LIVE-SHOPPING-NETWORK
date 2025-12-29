import { useState } from "react";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Search,
  AlertTriangle,
  TrendingDown,
  Plus,
  Edit2,
  Download,
  Filter,
} from "lucide-react";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  reorderPoint: number;
  price: number;
  supplier: string;
  lastRestocked: string;
  status: "in-stock" | "low-stock" | "out-of-stock";
}

export default function InventoryManagement() {
  return (
    <AdminProtectedRoute>
      <InventoryManagementContent />
    </AdminProtectedRoute>
  );
}

function InventoryManagementContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [inventory] = useState<InventoryItem[]>([
    {
      id: "1",
      sku: "WH-001",
      name: "Wireless Headphones",
      category: "Electronics",
      stock: 45,
      reorderPoint: 20,
      price: 299.99,
      supplier: "TechSupply Co.",
      lastRestocked: "2024-01-15",
      status: "in-stock",
    },
    {
      id: "2",
      sku: "SW-002",
      name: "Smart Watch",
      category: "Electronics",
      stock: 12,
      reorderPoint: 15,
      price: 399.99,
      supplier: "Gadget Wholesale",
      lastRestocked: "2024-01-10",
      status: "low-stock",
    },
    {
      id: "3",
      sku: "LS-003",
      name: "Laptop Stand",
      category: "Accessories",
      stock: 0,
      reorderPoint: 10,
      price: 79.99,
      supplier: "Office Plus",
      lastRestocked: "2023-12-20",
      status: "out-of-stock",
    },
  ]);

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = inventory.reduce((sum, item) => sum + item.stock, 0);
  const lowStockItems = inventory.filter((item) => item.status === "low-stock").length;
  const outOfStockItems = inventory.filter((item) => item.status === "out-of-stock").length;
  const totalValue = inventory.reduce((sum, item) => sum + item.stock * item.price, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-stock":
        return "bg-green-500/20 text-green-400";
      case "low-stock":
        return "bg-yellow-500/20 text-yellow-400";
      case "out-of-stock":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Inventory Management</h1>
              <p className="text-gray-400 mt-1">Track and manage product stock</p>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
              <Button variant="outline" className="border-border">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-background text-foreground/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalItems}</p>
                  <p className="text-sm text-gray-400">Total Units</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-background text-foreground/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{lowStockItems}</p>
                  <p className="text-sm text-gray-400">Low Stock</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-background text-foreground/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{outOfStockItems}</p>
                  <p className="text-sm text-gray-400">Out of Stock</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-background text-foreground/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Package className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    ${totalValue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400">Total Value</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Card className="p-6 bg-background text-foreground/5 border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or SKU..."
                className="pl-10 bg-background/10 border-white/20 text-foreground"
              />
            </div>
            <Button variant="outline" className="border-border">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-sm text-gray-400 font-medium">SKU</th>
                  <th className="text-left p-3 text-sm text-gray-400 font-medium">Product</th>
                  <th className="text-left p-3 text-sm text-gray-400 font-medium">Category</th>
                  <th className="text-left p-3 text-sm text-gray-400 font-medium">Stock</th>
                  <th className="text-left p-3 text-sm text-gray-400 font-medium">Status</th>
                  <th className="text-left p-3 text-sm text-gray-400 font-medium">Supplier</th>
                  <th className="text-left p-3 text-sm text-gray-400 font-medium">Last Restocked</th>
                  <th className="text-left p-3 text-sm text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-background text-foreground/5">
                    <td className="p-3">
                      <span className="text-foreground font-mono text-sm">{item.sku}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-foreground font-medium">{item.name}</span>
                    </td>
                    <td className="p-3">
                      <Badge className="bg-red-500/20 text-red-400">
                        {item.category}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div>
                        <span className="text-foreground font-bold">{item.stock}</span>
                        <span className="text-gray-400 text-sm ml-2">
                          (Min: {item.reorderPoint})
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace("-", " ")}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-muted-foreground text-sm">{item.supplier}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-muted-foreground text-sm">
                        {new Date(item.lastRestocked).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-3">
                      <Button size="sm" variant="ghost" className="text-red-400">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
