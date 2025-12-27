import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ShoppingCart, Star, TrendingUp, Zap, Heart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { ProductFilters } from "@/components/ProductFilters";
import { toast } from "sonner";

/**
 * Customer-Facing Products Catalog
 * Browse and search all available products
 */

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { totalItems } = useCart();

  const { data: products, isLoading } = trpc.products.list.useQuery({
    search: searchQuery || undefined,
    status: "active",
  });

  const { data: featuredProducts } = trpc.products.getFeatured.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="text-2xl font-bold text-white hover:text-purple-400 transition-colors">
                Live Shopping Network
              </a>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/cart">
                <Button variant="outline" className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-purple-600 rounded-full text-xs flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Shop Exclusive Deals
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Discover products featured in our live shows
          </p>

          {/* Search & Filters */}
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-lg"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 h-14 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Featured Products */}
        {featuredProducts && featuredProducts.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-yellow-500" />
              <h2 className="text-3xl font-bold text-white">Featured in Live Shows</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredProducts.slice(0, 3).map((product) => (
                <ProductCard key={product.id} product={product} featured />
              ))}
            </div>
          </div>
        )}

        {/* All Products */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <ProductFilters />
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white">All Products</h2>
            <p className="text-gray-400">
              {products?.length || 0} {products?.length === 1 ? "product" : "products"}
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="h-96 bg-white/5 border-white/10 animate-pulse" />
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <p className="text-gray-400 text-lg">No products found</p>
            </Card>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, featured = false }: { product: any; featured?: boolean }) {
  const { addItem } = useCart();
  const discount = product.compareAtPrice
    ? Math.round(((parseFloat(product.compareAtPrice) - parseFloat(product.price)) / parseFloat(product.compareAtPrice)) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      quantity: 1,
      image: product.imageUrl || "/placeholder.jpg",
    });
    toast.success("Added to cart!", {
      description: product.name,
    });
  };

  return (
    <Link href={`/products/${product.id}`}>
      <Card
        className={`group overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all cursor-pointer ${
          featured ? "ring-2 ring-yellow-500" : ""
        }`}
      >
        {/* Product Image */}
        <div className="aspect-square bg-gradient-to-br from-purple-600/20 to-pink-600/20 relative overflow-hidden">
          {featured && (
            <Badge className="absolute top-3 left-3 bg-yellow-500 text-black font-bold z-10">
              <Zap className="w-3 h-3 mr-1" />
              LIVE
            </Badge>
          )}
          {discount > 0 && (
            <Badge className="absolute top-3 right-3 bg-red-600 z-10">
              -{discount}%
            </Badge>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-16 h-16 text-white/50" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-bold text-white text-lg mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
            {product.name}
          </h3>
          
          {product.description && (
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">{product.description}</p>
          )}

          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              ))}
            </div>
            <span className="text-sm text-gray-400">(128)</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">${product.price}</p>
              {product.compareAtPrice && (
                <p className="text-sm text-gray-400 line-through">
                  ${product.compareAtPrice}
                </p>
              )}
            </div>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
