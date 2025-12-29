/**
 * Product Catalog
 * Browse and filter products with advanced search
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Star, ShoppingCart, Heart } from "lucide-react";

export default function ProductCatalog() {
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Product Catalog</h1>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10"
            />
          </div>
          <Select defaultValue="relevance">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Most Relevant</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        {/* Filters Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4" />
              <h3 className="font-semibold">Filters</h3>
            </div>

            <div className="space-y-6">
              {/* Categories */}
              <div>
                <h4 className="font-medium mb-3">Categories</h4>
                <div className="space-y-2">
                  <FilterCheckbox label="Electronics" count={245} />
                  <FilterCheckbox label="Fashion" count={189} />
                  <FilterCheckbox label="Home & Garden" count={156} />
                  <FilterCheckbox label="Beauty" count={134} />
                  <FilterCheckbox label="Sports" count={98} />
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="font-medium mb-3">Price Range</h4>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={1000}
                  step={10}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>

              {/* Rating */}
              <div>
                <h4 className="font-medium mb-3">Rating</h4>
                <div className="space-y-2">
                  <RatingFilter stars={5} count={89} />
                  <RatingFilter stars={4} count={156} />
                  <RatingFilter stars={3} count={67} />
                </div>
              </div>

              {/* Availability */}
              <div>
                <h4 className="font-medium mb-3">Availability</h4>
                <div className="space-y-2">
                  <FilterCheckbox label="In Stock" count={456} />
                  <FilterCheckbox label="On Sale" count={89} />
                  <FilterCheckbox label="Free Shipping" count={234} />
                </div>
              </div>

              <Button className="w-full" variant="outline">
                Clear All Filters
              </Button>
            </div>
          </Card>
        </div>

        {/* Product Grid */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">Showing 1-24 of 456 products</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Grid</Button>
              <Button variant="ghost" size="sm">List</Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProductCard
              name="Wireless Headphones"
              price={79.99}
              originalPrice={99.99}
              rating={4.5}
              reviews={234}
              image="/products/headphones.jpg"
              badge="Sale"
            />
            <ProductCard
              name="Smart Watch Pro"
              price={199.99}
              rating={4.8}
              reviews={567}
              image="/products/watch.jpg"
              badge="Trending"
            />
            <ProductCard
              name="Laptop Stand"
              price={49.99}
              rating={4.3}
              reviews={123}
              image="/products/stand.jpg"
            />
            <ProductCard
              name="USB-C Hub"
              price={39.99}
              rating={4.6}
              reviews={89}
              image="/products/hub.jpg"
            />
            <ProductCard
              name="Mechanical Keyboard"
              price={129.99}
              originalPrice={159.99}
              rating={4.7}
              reviews={345}
              image="/products/keyboard.jpg"
              badge="Sale"
            />
            <ProductCard
              name="Wireless Mouse"
              price={59.99}
              rating={4.4}
              reviews={178}
              image="/products/mouse.jpg"
            />
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-8">
            <Button variant="outline">Previous</Button>
            <Button variant="outline">1</Button>
            <Button>2</Button>
            <Button variant="outline">3</Button>
            <Button variant="outline">4</Button>
            <Button variant="outline">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterCheckbox({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Checkbox id={label} />
        <label htmlFor={label} className="text-sm cursor-pointer">
          {label}
        </label>
      </div>
      <span className="text-sm text-muted-foreground">({count})</span>
    </div>
  );
}

function RatingFilter({ stars, count }: { stars: number; count: number }) {
  return (
    <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-1 rounded">
      <div className="flex items-center gap-1">
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        <span className="text-sm ml-1">& up</span>
      </div>
      <span className="text-sm text-muted-foreground">({count})</span>
    </div>
  );
}

function ProductCard({ name, price, originalPrice, rating, reviews, image, badge }: any) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  return (
    <Card className="group overflow-hidden">
      <div className="relative aspect-square bg-muted">
        {badge && (
          <Badge className="absolute top-2 left-2 z-10">
            {badge}
          </Badge>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 z-10 bg-background text-foreground/80 hover:bg-background text-foreground"
          onClick={() => setIsWishlisted(!isWishlisted)}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="p-4">
        <h3 className="font-semibold mb-2 line-clamp-2">{name}</h3>

        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.floor(rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          ))}
          <span className="text-sm text-muted-foreground ml-1">
            ({reviews})
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl font-bold">${price}</span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${originalPrice}
            </span>
          )}
        </div>

        <Button className="w-full">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </Button>
      </div>
    </Card>
  );
}
