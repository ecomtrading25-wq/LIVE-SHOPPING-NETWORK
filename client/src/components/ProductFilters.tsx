import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Filter,
  X,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export function ProductFilters() {
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    brand: true,
    rating: true,
  });

  const categories = [
    { id: "electronics", name: "Electronics", count: 234 },
    { id: "fashion", name: "Fashion", count: 189 },
    { id: "home", name: "Home & Garden", count: 156 },
    { id: "beauty", name: "Beauty", count: 98 },
    { id: "sports", name: "Sports & Outdoors", count: 145 },
  ];

  const brands = [
    { id: "techpro", name: "TechPro", count: 45 },
    { id: "fashionista", name: "Fashionista", count: 38 },
    { id: "homeessentials", name: "Home Essentials", count: 29 },
    { id: "beautybrand", name: "Beauty Brand", count: 22 },
  ];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          <h2 className="text-xl font-bold">Filters</h2>
        </div>
        <Button variant="ghost" size="sm">
          <X className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </div>

      <div className="space-y-6">
        {/* Category Filter */}
        <div>
          <button
            onClick={() => toggleSection("category")}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="font-bold">Category</h3>
            {expandedSections.category ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {expandedSections.category && (
            <div className="space-y-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded"
                >
                  <Checkbox />
                  <span className="flex-1">{category.name}</span>
                  <Badge variant="secondary">{category.count}</Badge>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="border-t" />

        {/* Price Range Filter */}
        <div>
          <button
            onClick={() => toggleSection("price")}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="font-bold">Price Range</h3>
            {expandedSections.price ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {expandedSections.price && (
            <div className="space-y-4">
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={1000}
                step={10}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t" />

        {/* Brand Filter */}
        <div>
          <button
            onClick={() => toggleSection("brand")}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="font-bold">Brand</h3>
            {expandedSections.brand ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {expandedSections.brand && (
            <div className="space-y-2">
              {brands.map((brand) => (
                <label
                  key={brand.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded"
                >
                  <Checkbox />
                  <span className="flex-1">{brand.name}</span>
                  <Badge variant="secondary">{brand.count}</Badge>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="border-t" />

        {/* Rating Filter */}
        <div>
          <button
            onClick={() => toggleSection("rating")}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="font-bold">Rating</h3>
            {expandedSections.rating ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {expandedSections.rating && (
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <label
                  key={rating}
                  className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded"
                >
                  <Checkbox />
                  <div className="flex items-center gap-1">
                    {Array.from({ length: rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-500 text-yellow-500"
                      />
                    ))}
                    {Array.from({ length: 5 - rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-gray-400"
                      />
                    ))}
                  </div>
                  <span className="text-sm">& Up</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button className="w-full mt-6">Apply Filters</Button>
    </Card>
  );
}
