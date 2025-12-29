import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import {
  Search as SearchIcon,
  SlidersHorizontal,
  Star,
  ShoppingCart,
  X,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Advanced Search Page
 * Faceted filtering, sort options, search suggestions
 */

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"relevance" | "price_asc" | "price_desc" | "newest" | "rating">("relevance");
  const [showFilters, setShowFilters] = useState(true);
  const { addItem } = useCart();

  const { data: searchResults, isLoading } = trpc.products.advancedSearch.useQuery({
    query: searchQuery,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    categories: selectedCategories,
    minRating,
    inStockOnly,
    sortBy,
  });

  const { data: categories } = trpc.products.getCategories.useQuery();

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
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

  const clearFilters = () => {
    setPriceRange([0, 1000]);
    setSelectedCategories([]);
    setMinRating(0);
    setInStockOnly(false);
    setSortBy("relevance");
  };

  const activeFilterCount =
    selectedCategories.length +
    (priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  return (
    <div className="min-h-screen bg-background text-foreground py-8">
      <div className="container mx-auto px-4">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Search Products</h1>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 h-14 bg-card border-zinc-700 text-foreground text-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className={`lg:col-span-1 ${showFilters ? "block" : "hidden lg:block"}`}>
            <Card className="p-6 bg-background/50 border-border sticky top-4 text-foreground">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  Filters
                </h2>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-3">Price Range</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                      className="bg-card border-zinc-700 text-foreground"
                    />
                    <span className="text-gray-400">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000])}
                      className="bg-card border-zinc-700 text-foreground"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="10"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories?.map((category) => (
                    <label
                      key={category}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="w-4 h-4 rounded border-zinc-700"
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-3">Minimum Rating</h3>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(rating)}
                      className={`flex items-center gap-2 w-full p-2 rounded-lg transition-colors ${
                        minRating === rating
                          ? "bg-red-600 text-foreground"
                          : "text-muted-foreground hover:bg-card"
                      }`}
                    >
                      {[...Array(rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-sm">& Up</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* In Stock Only */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <p className="text-muted-foreground">
                  {searchResults?.length || 0} results
                  {searchQuery && ` for "${searchQuery}"`}
                </p>
                {activeFilterCount > 0 && (
                  <Badge className="bg-red-600">
                    {activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"} active
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Mobile Filter Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                </Button>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 bg-card border border-zinc-700 rounded-md text-foreground text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="newest">Newest</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedCategories.map((category) => (
                  <Badge
                    key={category}
                    className="bg-red-600 pr-1 flex items-center gap-2"
                  >
                    {category}
                    <button
                      onClick={() => handleCategoryToggle(category)}
                      className="hover:bg-red-700 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {(priceRange[0] > 0 || priceRange[1] < 1000) && (
                  <Badge className="bg-red-600 pr-1 flex items-center gap-2">
                    ${priceRange[0]} - ${priceRange[1]}
                    <button
                      onClick={() => setPriceRange([0, 1000])}
                      className="hover:bg-red-700 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {minRating > 0 && (
                  <Badge className="bg-red-600 pr-1 flex items-center gap-2">
                    {minRating}+ stars
                    <button
                      onClick={() => setMinRating(0)}
                      className="hover:bg-red-700 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {inStockOnly && (
                  <Badge className="bg-red-600 pr-1 flex items-center gap-2">
                    In Stock
                    <button
                      onClick={() => setInStockOnly(false)}
                      className="hover:bg-red-700 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {/* Product Grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Loading results...</p>
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((product: any) => (
                  <Card
                    key={product.id}
                    className="bg-background/50 border-border overflow-hidden hover:border-red-500 transition-colors text-foreground"
                  >
                    <Link href={`/products/${product.id}`}>
                      <div className="aspect-square bg-card relative cursor-pointer text-card-foreground">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="w-16 h-16 text-gray-600" />
                          </div>
                        )}
                        {product.status !== "active" && (
                          <Badge className="absolute top-2 right-2 bg-red-600">
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                    </Link>

                    <div className="p-4">
                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-semibold text-foreground mb-2 hover:text-red-400 transition-colors cursor-pointer line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="w-4 h-4 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                        <span className="text-sm text-gray-400 ml-1">(4.8)</span>
                      </div>

                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-bold text-foreground">
                          ${parseFloat(product.price).toFixed(2)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-sm text-gray-400 line-through">
                            ${parseFloat(product.compareAtPrice).toFixed(2)}
                          </span>
                        )}
                      </div>

                      <Button
                        className="w-full bg-red-600 hover:bg-red-700"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.status !== "active"}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 bg-background text-foreground/50 border-border text-center">
                <SearchIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  No results found
                </h3>
                <p className="text-gray-400 mb-6">
                  Try adjusting your filters or search query
                </p>
                <Button
                  onClick={clearFilters}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Clear All Filters
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
