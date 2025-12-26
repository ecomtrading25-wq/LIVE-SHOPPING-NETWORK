import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Search, Package, Edit, Trash2, Image as ImageIcon } from "lucide-react";

/**
 * Products Management Page
 * Manage product catalog with variants and inventory
 */

export default function ProductsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: products, refetch } = trpc.products.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: searchQuery || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Products</h1>
          <p className="text-gray-400 mt-1">Manage your product catalog and inventory</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Product</DialogTitle>
              <DialogDescription className="text-gray-400">
                Create a new product in your catalog
              </DialogDescription>
            </DialogHeader>
            <AddProductForm
              onSuccess={() => {
                setDialogOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-zinc-900 border-zinc-800">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search products by name, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-zinc-800 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="bg-zinc-900 border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
              <TableHead className="text-gray-400">Product</TableHead>
              <TableHead className="text-gray-400">SKU</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400">Price</TableHead>
              <TableHead className="text-gray-400">Inventory</TableHead>
              <TableHead className="text-gray-400">Variants</TableHead>
              <TableHead className="text-gray-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((product) => (
              <TableRow key={product.id} className="border-zinc-800 hover:bg-zinc-800/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-sm text-gray-400 line-clamp-1">{product.description}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-300 font-mono text-sm">{product.sku}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      product.status === "active"
                        ? "bg-green-600"
                        : product.status === "draft"
                          ? "bg-yellow-600"
                          : "bg-gray-600"
                    }
                  >
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-white font-medium">${product.price}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">{product.stockLevel || 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className="bg-purple-600">{product.variantCount || 0}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {!products || products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                  No products found. Add your first product to get started.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active Products</p>
              <p className="text-2xl font-bold text-white">
                {products?.filter((p) => p.status === "active").length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Draft Products</p>
              <p className="text-2xl font-bold text-white">
                {products?.filter((p) => p.status === "draft").length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Low Stock</p>
              <p className="text-2xl font-bold text-white">
                {products?.filter((p) => (p.stockLevel || 0) < 10).length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Variants</p>
              <p className="text-2xl font-bold text-white">
                {products?.reduce((sum, p) => sum + (p.variantCount || 0), 0) || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AddProductForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [status, setStatus] = useState("draft");

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      sku,
      description,
      price,
      compareAtPrice: compareAtPrice || undefined,
      status: status as any,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name" className="text-white">
            Product Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Wireless Headphones"
            className="bg-zinc-800 border-zinc-700 text-white"
            required
          />
        </div>

        <div>
          <Label htmlFor="sku" className="text-white">
            SKU
          </Label>
          <Input
            id="sku"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="WH-001"
            className="bg-zinc-800 border-zinc-700 text-white"
            required
          />
        </div>

        <div>
          <Label htmlFor="status" className="text-white">
            Status
          </Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Label htmlFor="description" className="text-white">
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Product description..."
            className="bg-zinc-800 border-zinc-700 text-white"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="price" className="text-white">
            Price
          </Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="29.99"
            className="bg-zinc-800 border-zinc-700 text-white"
            required
          />
        </div>

        <div>
          <Label htmlFor="compareAtPrice" className="text-white">
            Compare at Price (Optional)
          </Label>
          <Input
            id="compareAtPrice"
            type="number"
            step="0.01"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
            placeholder="39.99"
            className="bg-zinc-800 border-zinc-700 text-white"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Creating..." : "Create Product"}
      </Button>

      {createMutation.error && (
        <p className="text-sm text-red-500">{createMutation.error.message}</p>
      )}
    </form>
  );
}
