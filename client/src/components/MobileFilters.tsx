import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { X, SlidersHorizontal, Check } from "lucide-react";

interface FilterOptions {
  categories: string[];
  priceRange: [number, number];
  brands: string[];
  ratings: number[];
  inStockOnly: boolean;
}

interface MobileFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
}

/**
 * Mobile-Optimized Filters Component
 * Touch-friendly filter drawer with large tap targets
 * Smooth animations and intuitive gestures
 */
export default function MobileFilters({
  isOpen,
  onClose,
  filters: initialFilters,
  onApplyFilters,
}: MobileFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [touchStart, setTouchStart] = useState(0);

  const categories = ["Electronics", "Fashion", "Home", "Sports", "Beauty", "Books"];
  const brands = ["Apple", "Samsung", "Nike", "Adidas", "Sony", "LG"];
  const ratings = [5, 4, 3, 2, 1];

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientY;
    const distance = touchEnd - touchStart;

    // Swipe down to close (minimum 100px)
    if (distance > 100) {
      onClose();
    }
  };

  const toggleCategory = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const toggleBrand = (brand: string) => {
    setFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand],
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      categories: [],
      priceRange: [0, 1000],
      brands: [],
      ratings: [],
      inStockOnly: false,
    };
    setFilters(resetFilters);
  };

  const activeFilterCount =
    filters.categories.length +
    filters.brands.length +
    filters.ratings.length +
    (filters.inStockOnly ? 1 : 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Filter Drawer */}
      <div className="fixed inset-x-0 bottom-0 z-50 md:hidden max-h-[85vh] flex flex-col bg-zinc-900 rounded-t-3xl shadow-2xl animate-slide-up">
        {/* Drag Handle */}
        <div
          className="py-4 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Filters</h2>
              {activeFilterCount > 0 && (
                <Badge className="bg-purple-600">{activeFilterCount}</Badge>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`
                    p-4 rounded-xl border-2 transition-all text-left
                    ${filters.categories.includes(category)
                      ? "border-purple-500 bg-purple-500/20 text-white"
                      : "border-gray-700 text-gray-400 active:scale-95"
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{category}</span>
                    {filters.categories.includes(category) && (
                      <Check className="w-5 h-5 text-purple-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Price Range
            </h3>
            <div className="space-y-4">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, priceRange: value as [number, number] }))
                }
                min={0}
                max={1000}
                step={10}
                className="touch-manipulation"
              />
              <div className="flex items-center justify-between text-white">
                <span className="text-lg font-bold">${filters.priceRange[0]}</span>
                <span className="text-gray-400">to</span>
                <span className="text-lg font-bold">${filters.priceRange[1]}</span>
              </div>
            </div>
          </div>

          {/* Brands */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Brands</h3>
            <div className="flex flex-wrap gap-3">
              {brands.map((brand) => (
                <button
                  key={brand}
                  onClick={() => toggleBrand(brand)}
                  className={`
                    px-6 py-3 rounded-full border-2 transition-all
                    ${filters.brands.includes(brand)
                      ? "border-purple-500 bg-purple-500/20 text-white"
                      : "border-gray-700 text-gray-400 active:scale-95"
                    }
                  `}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Minimum Rating</h3>
            <div className="space-y-3">
              {ratings.map((rating) => (
                <button
                  key={rating}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      ratings: prev.ratings.includes(rating)
                        ? prev.ratings.filter((r) => r !== rating)
                        : [...prev.ratings, rating],
                    }))
                  }
                  className={`
                    w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between
                    ${filters.ratings.includes(rating)
                      ? "border-purple-500 bg-purple-500/20"
                      : "border-gray-700 active:scale-95"
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{"⭐".repeat(rating)}</span>
                    <span className="text-white font-medium">& Up</span>
                  </div>
                  {filters.ratings.includes(rating) && (
                    <Check className="w-5 h-5 text-purple-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* In Stock Only */}
          <div>
            <button
              onClick={() =>
                setFilters((prev) => ({ ...prev, inStockOnly: !prev.inStockOnly }))
              }
              className={`
                w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between
                ${filters.inStockOnly
                  ? "border-purple-500 bg-purple-500/20"
                  : "border-gray-700 active:scale-95"
                }
              `}
            >
              <span className="text-white font-medium">In Stock Only</span>
              {filters.inStockOnly && (
                <Check className="w-5 h-5 text-purple-400" />
              )}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-800 bg-zinc-900">
          <div className="flex gap-3">
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1 h-14 text-lg border-gray-700 text-gray-400"
            >
              Reset
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 h-14 text-lg bg-purple-600 hover:bg-purple-700"
            >
              Apply Filters
              {activeFilterCount > 0 && ` (${activeFilterCount})`}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
