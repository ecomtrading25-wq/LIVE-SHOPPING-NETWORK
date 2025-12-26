import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  DollarSign,
  TrendingUp,
  Mail,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Supplier Management System
 * Manage suppliers, purchase orders, and procurement
 */

export default function SuppliersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [newSupplierOpen, setNewSupplierOpen] = useState(false);
  const [newPOOpen, setNewPOOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");

  const { data: suppliers, refetch: refetchSuppliers} =
    trpc.suppliers.list.useQuery({ search: searchQuery || undefined });
  const { data: purchaseOrders, refetch: refetchPOs } =
    trpc.suppliers.purchaseOrders.useQuery({
      supplierId: selectedSupplier || undefined,
    });

  const createSupplierMutation = trpc.suppliers.create.useMutation({
    onSuccess: () => {
      toast.success("Supplier created successfully");
      refetchSuppliers();
      setNewSupplierOpen(false);
    },
  });

  const createPOMutation = trpc.suppliers.createPurchaseOrder.useMutation({
    onSuccess: () => {
      toast.success("Purchase order created successfully");
      refetchPOs();
      setNewPOOpen(false);
    },
  });

  const handleCreateSupplier = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createSupplierMutation.mutate({
      name: formData.get("name") as string,
      contactName: formData.get("contactName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      paymentTerms: formData.get("paymentTerms") as string,
      currency: formData.get("currency") as string,
    });
  };

  const handleCreatePO = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createPOMutation.mutate({
      supplierId: formData.get("supplierId") as string,
      expectedDelivery: new Date(formData.get("expectedDelivery") as string),
      notes: formData.get("notes") as string,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Supplier Management</h1>
          <p className="text-gray-400 mt-1">Manage suppliers and purchase orders</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={newPOOpen} onOpenChange={setNewPOOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Package className="w-4 h-4 mr-2" />
                New PO
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-white">Create Purchase Order</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePO} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Supplier</label>
                  <select
                    name="supplierId"
                    required
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
                  >
                    {suppliers?.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Expected Delivery
                  </label>
                  <Input
                    name="expectedDelivery"
                    type="date"
                    required
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Notes</label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create Purchase Order
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={newSupplierOpen} onOpenChange={setNewSupplierOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                New Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-white">Create Supplier</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSupplier} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Company Name
                  </label>
                  <Input
                    name="name"
                    required
                    placeholder="Acme Corp"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Contact Name
                  </label>
                  <Input
                    name="contactName"
                    required
                    placeholder="John Doe"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Email</label>
                    <Input
                      name="email"
                      type="email"
                      required
                      placeholder="contact@acme.com"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Phone</label>
                    <Input
                      name="phone"
                      placeholder="+1 555-0000"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Address</label>
                  <Input
                    name="address"
                    placeholder="123 Main St, City, State"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Payment Terms
                    </label>
                    <Input
                      name="paymentTerms"
                      placeholder="Net 30"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Currency</label>
                    <select
                      name="currency"
                      required
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="AUD">AUD</option>
                      <option value="CAD">CAD</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Create Supplier
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Suppliers</p>
              <p className="text-3xl font-bold text-white mt-1">
                {suppliers?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active POs</p>
              <p className="text-3xl font-bold text-white mt-1">
                {purchaseOrders?.filter((po) => po.status === "pending").length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Spend</p>
              <p className="text-3xl font-bold text-white mt-1">
                $
                {purchaseOrders
                  ?.reduce((sum, po) => sum + parseFloat(po.totalAmount || "0"), 0)
                  .toLocaleString() || "0"}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Lead Time</p>
              <p className="text-3xl font-bold text-white mt-1">14d</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Suppliers List */}
      <Card className="p-6 bg-zinc-900 border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Suppliers</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-800 border-zinc-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers?.map((supplier) => (
            <Card
              key={supplier.id}
              className={`p-6 cursor-pointer transition-all ${
                selectedSupplier === supplier.id
                  ? "bg-purple-600 border-purple-500"
                  : "bg-zinc-800 border-zinc-700 hover:bg-zinc-750"
              }`}
              onClick={() => setSelectedSupplier(supplier.id)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    selectedSupplier === supplier.id
                      ? "bg-white/20"
                      : "bg-purple-500/20"
                  }`}
                >
                  <Building2
                    className={`w-6 h-6 ${
                      selectedSupplier === supplier.id
                        ? "text-white"
                        : "text-purple-400"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{supplier.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {supplier.contactName}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Mail className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">{supplier.email}</span>
                  </div>
                  {supplier.phone && (
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">{supplier.phone}</span>
                    </div>
                  )}
                  <div className="mt-3">
                    <Badge
                      variant={supplier.status === "active" ? "default" : "secondary"}
                    >
                      {supplier.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Purchase Orders */}
      {selectedSupplier && (
        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <h2 className="text-xl font-bold text-white mb-6">Purchase Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    PO Number
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Expected Delivery
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders?.map((po) => (
                  <tr key={po.id} className="border-b border-zinc-800">
                    <td className="py-3 px-4">
                      <span className="font-mono text-white">{po.poNumber}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {new Date(po.expectedDelivery).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      ${parseFloat(po.totalAmount || "0").toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          po.status === "received"
                            ? "default"
                            : po.status === "pending"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {po.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
