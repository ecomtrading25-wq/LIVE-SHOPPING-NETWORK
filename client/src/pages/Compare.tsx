import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import {
  X,
  Star,
  ShoppingCart,
  Search,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

/**
 * Product Comparison Tool
 * Compare up to 4 products side-by-side
 */

export default function ComparePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const { addItem } = useCart();

  const { data: searchResults } = trpc.products.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 2 }
  );

  const { data: comparisonProducts } = trpc.products.compare.useQuery(
    { productIds: selectedProducts },
    { enabled: selectedProducts.length > 0 }
  );

  const handleAddProduct = (productId: string) => {
    if (selectedProducts.length >= 4) {
      toast.error("Maximum 4 products can be compared");
      return;
    }
    if (selectedProducts.includes(productId)) {
      toast.error("Product already added");
      return;
    }
    setSelectedProducts([...selectedProducts, productId]);
    setSearchQuery("");
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((id) => id !== productId));
  };

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      quantity: 1,
      image: product.imageUrl,
    });
    toast.success(`${product.name} added to cart`);
  };

  const renderValue = (value: any) => {
    if (typeof value === "boolean") {
      return value ? (
        <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
      ) : (
        <XCircle className="w-5 h-5 text-red-400 mx-auto" />
      );
    }
    return value || "—";
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Compare Products</h1>
          <p className="text-gray-400">
            Select up to 4 products to compare side-by-side
          </p>
        </div>

        {/* Search Bar */}
        <Card className="p-6 bg-background/50 border-border mb-8 text-foreground">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search products to compare..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-card border-zinc-700 text-foreground h-12"
            />
          </div>

          {/* Search Results */}
          {searchResults && searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-card rounded-lg hover:bg-zinc-750 cursor-pointer text-card-foreground"
                  onClick={() => handleAddProduct(product.id)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={product.imageUrl || "/placeholder-product.jpg"}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-gray-400">
                        ${parseFloat(product.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Add to Compare
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Comparison Table */}
        {comparisonProducts && comparisonProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-4 text-left bg-background text-foreground/50 border border-border text-gray-400 font-medium">
                    Feature
                  </th>
                  {comparisonProducts.map((product) => (
                    <th
                      key={product.id}
                      className="p-4 bg-background/50 border border-border relative text-foreground"
                    >
                      <button
                        onClick={() => handleRemoveProduct(product.id)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-foreground" />
                      </button>
                      <img
                        src={product.imageUrl || "/placeholder-product.jpg"}
                        alt={product.name}
                        className="w-32 h-32 object-cover rounded-lg mx-auto mb-3"
                      />
                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-semibold text-foreground hover:text-red-400 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Price */}
                <tr>
                  <td className="p-4 bg-background text-foreground/30 border border-border text-muted-foreground font-medium">
                    Price
                  </td>
                  {comparisonProducts.map((product) => (
                    <td
                      key={product.id}
                      className="p-4 bg-background text-foreground/30 border border-border text-center"
                    >
                      <div>
                        <span className="text-2xl font-bold text-foreground">
                          ${parseFloat(product.price).toFixed(2)}
                        </span>
                        {product.compareAtPrice && (
                          <div className="text-sm text-gray-400 line-through mt-1">
                            ${parseFloat(product.compareAtPrice).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Rating */}
                <tr>
                  <td className="p-4 bg-background text-foreground/30 border border-border text-muted-foreground font-medium">
                    Rating
                  </td>
                  {comparisonProducts.map((product) => (
                    <td
                      key={product.id}
                      className="p-4 bg-background text-foreground/30 border border-border text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="w-4 h-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                        <span className="text-sm text-gray-400 ml-2">(4.8)</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Stock Status */}
                <tr>
                  <td className="p-4 bg-background text-foreground/30 border border-border text-muted-foreground font-medium">
                    Availability
                  </td>
                  {comparisonProducts.map((product) => (
                    <td
                      key={product.id}
                      className="p-4 bg-background text-foreground/30 border border-border text-center"
                    >
                      <Badge
                        variant={product.status === "active" ? "default" : "secondary"}
                      >
                        {product.status === "active" ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </td>
                  ))}
                </tr>

                {/* Description */}
                <tr>
                  <td className="p-4 bg-background text-foreground/30 border border-border text-muted-foreground font-medium">
                    Description
                  </td>
                  {comparisonProducts.map((product) => (
                    <td
                      key={product.id}
                      className="p-4 bg-background text-foreground/30 border border-border text-muted-foreground text-sm"
                    >
                      {product.description || "No description available"}
                    </td>
                  ))}
                </tr>

                {/* SKU */}
                <tr>
                  <td className="p-4 bg-background text-foreground/30 border border-border text-muted-foreground font-medium">
                    SKU
                  </td>
                  {comparisonProducts.map((product) => (
                    <td
                      key={product.id}
                      className="p-4 bg-background text-foreground/30 border border-border text-center text-muted-foreground font-mono text-sm"
                    >
                      {product.sku || "—"}
                    </td>
                  ))}
                </tr>

                {/* Add to Cart */}
                <tr>
                  <td className="p-4 bg-background/30 border border-border text-foreground"></td>
                  {comparisonProducts.map((product) => (
                    <td
                      key={product.id}
                      className="p-4 bg-background text-foreground/30 border border-border text-center"
                    >
                      <Button
                        className="w-full bg-red-600 hover:bg-red-700"
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <Card className="p-12 bg-background text-foreground/50 border-border text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                No products selected
              </h2>
              <p className="text-gray-400 mb-6">
                Search and add products above to start comparing
              </p>
              <Link href="/products">
                <Button className="bg-red-600 hover:bg-red-700">
                  Browse All Products
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
