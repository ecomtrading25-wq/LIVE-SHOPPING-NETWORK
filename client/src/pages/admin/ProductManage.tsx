import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  DollarSign,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

export default function ProductManagePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: products, isLoading, refetch } = trpc.products.list.useQuery({
    search: searchQuery || undefined,
    status: statusFilter === "all" ? undefined : (statusFilter as "active" | "draft"),
  });

  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Product deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground">
            Manage your product catalog and inventory
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <AddProductForm onSuccess={() => {
              setIsAddDialogOpen(false);
              refetch();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : products && products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-secondary rounded overflow-hidden flex-shrink-0">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-bold">${product.price}</p>
                      {product.compareAtPrice && (
                        <p className="text-sm text-muted-foreground line-through">
                          ${product.compareAtPrice}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.stock > 10 ? "default" : "destructive"}>
                      {product.stock} units
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.status === "active" ? "default" : "secondary"}
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id, product.name)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No products found</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function AddProductForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    compareAtPrice: "",
    stock: "",
    category: "",
    imageUrl: "",
    status: "draft" as "active" | "draft",
  });

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully");
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Failed to create product: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      price: formData.price,
      compareAtPrice: formData.compareAtPrice || undefined,
      stock: parseInt(formData.stock),
      category: formData.category,
      imageUrl: formData.imageUrl || undefined,
      status: formData.status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Product Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Premium Wireless Headphones"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Description</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="High-quality audio with noise cancellation"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Price</label>
          <Input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="299.99"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Compare At Price</label>
          <Input
            type="number"
            step="0.01"
            value={formData.compareAtPrice}
            onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
            placeholder="399.99"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Stock</label>
          <Input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            placeholder="100"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <Input
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="Electronics"
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Image URL</label>
        <Input
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Status</label>
        <Select
          value={formData.status}
          onValueChange={(value) =>
            setFormData({ ...formData, status: value as "active" | "draft" })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Creating..." : "Create Product"}
      </Button>
    </form>
  );
}
