import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, AlertCircle, CheckCircle, Plus } from "lucide-react";

export default function Dropshipping() {
  const suppliers = [
    { id: "1", name: "Global Wholesale Co", products: 450, trustScore: 98, avgShippingDays: 3, defectRate: 0.5, activeOrders: 25 },
    { id: "2", name: "Direct Factory Supply", products: 320, trustScore: 95, avgShippingDays: 5, defectRate: 1.2, activeOrders: 18 },
    { id: "3", name: "Premium Goods Inc", products: 180, trustScore: 92, avgShippingDays: 4, defectRate: 0.8, activeOrders: 12 },
  ];

  const recentOrders = [
    { id: "DS-001", supplier: "Global Wholesale Co", product: "Wireless Earbuds Pro", cost: 15.50, salePrice: 49.99, profit: 34.49, status: "shipped" },
    { id: "DS-002", supplier: "Direct Factory Supply", product: "Smart Watch Ultra", cost: 45.00, salePrice: 149.99, profit: 104.99, status: "processing" },
    { id: "DS-003", supplier: "Premium Goods Inc", product: "Portable Charger 20K", cost: 12.00, salePrice: 39.99, profit: 27.99, status: "shipped" },
    { id: "DS-004", supplier: "Global Wholesale Co", product: "Bluetooth Speaker", cost: 18.50, salePrice: 59.99, profit: 41.49, status: "pending" },
  ];

  const getStatusColor = (status: string) => {
    if (status === "shipped") return "bg-green-500";
    if (status === "processing") return "bg-blue-500";
    return "bg-yellow-500";
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 95) return "text-green-500";
    if (score >= 90) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dropshipping Management</h1>
          <p className="text-muted-foreground mt-2">Manage suppliers, track orders, and monitor performance</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{suppliers.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{suppliers.reduce((s, sup) => s + sup.products, 0)}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{suppliers.reduce((s, sup) => s + sup.activeOrders, 0)}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">68.5%</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{supplier.name}</h3>
                    <p className="text-sm text-muted-foreground">{supplier.products} products</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${getTrustScoreColor(supplier.trustScore)}`}>{supplier.trustScore}%</p>
                    <p className="text-xs text-muted-foreground">Trust Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{supplier.avgShippingDays}d</p>
                    <p className="text-xs text-muted-foreground">Avg Shipping</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{supplier.defectRate}%</p>
                    <p className="text-xs text-muted-foreground">Defect Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{supplier.activeOrders}</p>
                    <p className="text-xs text-muted-foreground">Active Orders</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{order.id}</h3>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{order.product}</p>
                  <p className="text-xs text-muted-foreground">{order.supplier}</p>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">${order.cost.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Cost</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">${order.salePrice.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Sale Price</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-500">${order.profit.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Profit ({((order.profit / order.salePrice) * 100).toFixed(0)}%)</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
