import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  SlidersHorizontal,
  Heart,
  ShoppingCart,
  Star,
  Package,
} from "lucide-react";

export default function SearchResultsPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const query = searchParams.get("q") || searchParams.get("search") || "";
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [sortBy, setSortBy] = useState("relevance");
  const [showFilters, setShowFilters] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);

  // Mock products data
  const allProducts = [
    {
      id: 1,
      name: "Wireless Bluetooth Headphones",
      price: 79.99,
      originalPrice: 99.99,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
      rating: 4.5,
      reviews: 234,
      category: "electronics",
      brand: "TechPro",
      inStock: true,
    },
    {
      id: 2,
      name: "Smart Fitness Watch",
      price: 149.99,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
      rating: 4.8,
      reviews: 567,
      category: "electronics",
      brand: "FitTech",
      inStock: true,
    },
  ];

  const filteredProducts = allProducts.filter((product) => {
    const matchesQuery = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    const matchesRating = product.rating >= minRating;
    
    return matchesQuery && matchesCategory && matchesPrice && matchesBrand && matchesRating;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const categories = ["electronics", "fashion", "beauty", "sports"];
  const brands = ["TechPro", "FitTech"];

  return (
    <div className="min-h-screen bg-background text-foreground py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="pl-10 bg-background/10 border-white/20 text-foreground placeholder:text-gray-400"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-white/20 text-foreground hover:bg-background/10"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {filteredProducts.length} results for <span className="text-foreground font-semibold">"{searchQuery}"</span>
            </p>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-background/10 border border-white/20 text-foreground rounded px-3 py-1 text-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {showFilters && (
            <div className="lg:col-span-1">
              <Card className="p-6 bg-background text-foreground/10 backdrop-blur-xl border-white/20 sticky top-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-foreground">Filters</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategories([]);
                      setSelectedBrands([]);
                      setMinRating(0);
                      setPriceRange([0, 1000]);
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    Clear All
                  </Button>
                </div>

                <div className="mb-6">
                  <h4 className="text-foreground font-semibold mb-3">Categories</h4>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label key={category} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategories([...selectedCategories, category]);
                            } else {
                              setSelectedCategories(selectedCategories.filter((c) => c !== category));
                            }
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-background text-foreground/10"
                        />
                        <span className="text-muted-foreground capitalize">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-foreground font-semibold mb-3">Price Range</h4>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                      className="w-full"
                    />
                    <p className="text-muted-foreground text-sm">
                      ${priceRange[0]} - ${priceRange[1]}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-foreground font-semibold mb-3">Minimum Rating</h4>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                      <label key={rating} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="rating"
                          checked={minRating === rating}
                          onChange={() => setMinRating(rating)}
                          className="w-4 h-4"
                        />
                        <div className="flex items-center gap-1">
                          {Array.from({ length: rating }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                          <span className="text-muted-foreground ml-1">& Up</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}

          <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
            {sortedProducts.length === 0 ? (
              <Card className="p-12 bg-background text-foreground/10 backdrop-blur-xl border-white/20 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">No Results Found</h2>
                <p className="text-muted-foreground mb-6">
                  We couldn't find any products matching your search.
                </p>
                <Link href="/products">
                  <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-pink-600 hover:to-red-700">
                    Browse All Products
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="group bg-background text-foreground/10 backdrop-blur-xl border-white/20 hover:border-red-500/50 transition-all overflow-hidden"
                  >
                    <Link href={`/products/${product.id}`}>
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        />
                        {product.originalPrice && (
                          <Badge className="absolute top-3 left-3 bg-red-600">
                            Save ${(product.originalPrice - product.price).toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    </Link>

                    <div className="p-4">
                      <Link href={`/products/${product.id}`}>
                        <h3 className="text-lg font-bold text-foreground group-hover:text-red-400 transition-colors mb-2">
                          {product.name}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(product.rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-gray-400 text-sm">({product.reviews})</span>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl font-bold text-foreground">${product.price}</span>
                        {product.originalPrice && (
                          <span className="text-gray-400 line-through text-sm">
                            ${product.originalPrice}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-pink-600 hover:to-red-700">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-white/20 text-foreground hover:bg-background/10"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
