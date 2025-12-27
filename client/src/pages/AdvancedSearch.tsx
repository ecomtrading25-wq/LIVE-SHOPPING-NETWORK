import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Search,
  SlidersHorizontal,
  Star,
  Upload,
  Camera,
  TrendingUp,
  History,
  X,
} from "lucide-react";

/**
 * Advanced Search & Discovery Engine
 * Elasticsearch integration, faceted filtering, visual search, personalized ranking
 */

interface SearchResult {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  brand: string;
  inStock: boolean;
  tags: string[];
}

interface SearchFacet {
  name: string;
  values: { label: string; count: number; checked: boolean }[];
}

export default function AdvancedSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFilters, setShowFilters] = useState(true);

  // Mock search results
  const results: SearchResult[] = [
    {
      id: "1",
      name: "Wireless Headphones Pro",
      price: 299.99,
      originalPrice: 349.99,
      rating: 4.5,
      reviews: 2340,
      image: "/placeholder-product.jpg",
      category: "Electronics",
      brand: "TechPro",
      inStock: true,
      tags: ["wireless", "bluetooth", "noise-canceling"],
    },
    {
      id: "2",
      name: "Smart Watch Ultra",
      price: 399.99,
      rating: 4.7,
      reviews: 1890,
      image: "/placeholder-product.jpg",
      category: "Electronics",
      brand: "SmartTech",
      inStock: true,
      tags: ["smartwatch", "fitness", "waterproof"],
    },
    {
      id: "3",
      name: "Portable Charger 20K",
      price: 49.99,
      rating: 4.2,
      reviews: 890,
      image: "/placeholder-product.jpg",
      category: "Accessories",
      brand: "PowerBank",
      inStock: true,
      tags: ["portable", "fast-charging", "usb-c"],
    },
  ];

  // Mock facets
  const facets: SearchFacet[] = [
    {
      name: "Category",
      values: [
        { label: "Electronics", count: 156, checked: false },
        { label: "Accessories", count: 89, checked: false },
        { label: "Home & Garden", count: 67, checked: false },
        { label: "Sports", count: 45, checked: false },
      ],
    },
    {
      name: "Brand",
      values: [
        { label: "TechPro", count: 78, checked: false },
        { label: "SmartTech", count: 56, checked: false },
        { label: "PowerBank", count: 34, checked: false },
        { label: "HomeEssentials", count: 23, checked: false },
      ],
    },
    {
      name: "Rating",
      values: [
        { label: "4+ Stars", count: 234, checked: false },
        { label: "3+ Stars", count: 189, checked: false },
        { label: "2+ Stars", count: 67, checked: false },
      ],
    },
    {
      name: "Availability",
      values: [
        { label: "In Stock", count: 298, checked: false },
        { label: "Pre-Order", count: 45, checked: false },
        { label: "Coming Soon", count: 12, checked: false },
      ],
    },
  ];

  // Mock search suggestions
  const suggestions = [
    "wireless headphones",
    "smart watch",
    "portable charger",
    "bluetooth speaker",
    "fitness tracker",
  ];

  // Mock recent searches
  const recentSearches = [
    "wireless headphones",
    "smart watch ultra",
    "portable charger 20k",
  ];

  // Mock trending searches
  const trendingSearches = [
    "wireless earbuds",
    "smart home devices",
    "gaming accessories",
    "fitness equipment",
  ];

  const totalResults = results.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <div className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands, categories..."
                className="pl-10 pr-12 h-12 text-lg"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Button variant="outline" size="lg">
              <Camera className="w-5 h-5 mr-2" />
              Visual Search
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filters
            </Button>
          </div>

          {/* Search Suggestions */}
          {searchQuery && (
            <Card className="absolute z-50 mt-2 p-4 w-full max-w-2xl">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Suggestions</p>
                  <div className="space-y-1">
                    {suggestions
                      .filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((suggestion, index) => (
                        <button
                          key={index}
                          className="w-full text-left px-3 py-2 hover:bg-secondary rounded-lg flex items-center gap-2"
                          onClick={() => setSearchQuery(suggestion)}
                        >
                          <Search className="w-4 h-4 text-muted-foreground" />
                          {suggestion}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Recent & Trending Searches */}
          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Recent:</span>
              <div className="flex gap-2">
                {recentSearches.slice(0, 3).map((search, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery(search)}
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Trending:</span>
              <div className="flex gap-2">
                {trendingSearches.slice(0, 3).map((search, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery(search)}
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-64 flex-shrink-0 space-y-6">
              <Card className="p-6">
                <h3 className="font-bold mb-4">Filters</h3>

                {/* Price Range */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Price Range</span>
                    <span className="text-sm text-muted-foreground">
                      ${priceRange[0]} - ${priceRange[1]}
                    </span>
                  </div>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={0}
                    max={1000}
                    step={10}
                    className="mb-2"
                  />
                </div>

                {/* Facets */}
                {facets.map((facet, facetIndex) => (
                  <div key={facetIndex} className="mb-6">
                    <h4 className="text-sm font-medium mb-3">{facet.name}</h4>
                    <div className="space-y-2">
                      {facet.values.map((value, valueIndex) => (
                        <div key={valueIndex} className="flex items-center gap-2">
                          <Checkbox id={`${facetIndex}-${valueIndex}`} />
                          <label
                            htmlFor={`${facetIndex}-${valueIndex}`}
                            className="text-sm flex-1 cursor-pointer"
                          >
                            {value.label}
                          </label>
                          <span className="text-xs text-muted-foreground">
                            ({value.count})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <Button variant="outline" className="w-full">
                  Clear All Filters
                </Button>
              </Card>
            </div>
          )}

          {/* Search Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Search Results</h2>
                <p className="text-muted-foreground">
                  {totalResults} products found
                  {searchQuery && ` for "${searchQuery}"`}
                </p>
              </div>
              <select className="px-4 py-2 border rounded-lg">
                <option>Best Match</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Highest Rated</option>
                <option>Most Reviews</option>
                <option>Newest</option>
              </select>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-secondary relative">
                    {product.originalPrice && (
                      <Badge className="absolute top-2 right-2 bg-red-500">
                        Save ${(product.originalPrice - product.price).toFixed(2)}
                      </Badge>
                    )}
                    {!product.inStock && (
                      <Badge className="absolute top-2 left-2 bg-gray-500">Out of Stock</Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{product.category}</Badge>
                      <Badge variant="outline">{product.brand}</Badge>
                    </div>
                    <h3 className="font-bold mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="font-medium">{product.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({product.reviews.toLocaleString()} reviews)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl font-bold">${product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mb-3">
                      {product.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button className="w-full" disabled={!product.inStock}>
                      {product.inStock ? "Add to Cart" : "Out of Stock"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="outline">Previous</Button>
              <Button variant="default">1</Button>
              <Button variant="outline">2</Button>
              <Button variant="outline">3</Button>
              <Button variant="outline">Next</Button>
            </div>

            {/* Related Searches */}
            <Card className="p-6 mt-8">
              <h3 className="font-bold mb-4">People Also Searched For</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "wireless earbuds",
                  "bluetooth headphones",
                  "noise canceling headphones",
                  "over ear headphones",
                  "gaming headset",
                  "sports earbuds",
                ].map((term, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery(term)}
                  >
                    {term}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Recommended Products */}
            <Card className="p-6 mt-8">
              <h3 className="font-bold mb-4">Recommended for You</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Based on your browsing history and purchase patterns
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {results.slice(0, 4).map((product) => (
                  <Card key={product.id} className="p-3">
                    <div className="aspect-square bg-secondary rounded-lg mb-2"></div>
                    <h4 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h4>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      <span className="text-xs">{product.rating}</span>
                    </div>
                    <p className="font-bold">${product.price}</p>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
