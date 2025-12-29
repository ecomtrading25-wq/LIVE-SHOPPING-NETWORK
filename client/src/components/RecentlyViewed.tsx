import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  viewedAt: number;
}

export function RecentlyViewed() {
  const [products, setProducts] = useState<Product[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    // Load recently viewed products from localStorage
    const stored = localStorage.getItem("recentlyViewed");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProducts(parsed.slice(0, 10)); // Keep only last 10
      } catch (e) {
        console.error("Failed to parse recently viewed products", e);
      }
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("recently-viewed-container");
    if (container) {
      const scrollAmount = 300;
      const newPosition =
        direction === "left"
          ? scrollPosition - scrollAmount
          : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: "smooth" });
      setScrollPosition(newPosition);
    }
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Eye className="w-6 h-6 text-red-400" />
          Recently Viewed
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("left")}
            className="border-white/20 text-foreground hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
            className="border-white/20 text-foreground hover:bg-white/10"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div
        id="recently-viewed-container"
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.id}`}>
            <Card className="min-w-[200px] bg-white/10 backdrop-blur-xl border-white/20 hover:border-red-500/50 transition-all overflow-hidden cursor-pointer group">
              <div className="relative h-40 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-3">
                <h3 className="text-foreground font-semibold text-sm mb-2 line-clamp-2 group-hover:text-red-400 transition-colors">
                  {product.name}
                </h3>
                <p className="text-lg font-bold text-foreground">${product.price}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Helper function to add product to recently viewed
export function addToRecentlyViewed(product: Omit<Product, "viewedAt">) {
  try {
    const stored = localStorage.getItem("recentlyViewed");
    let products: Product[] = stored ? JSON.parse(stored) : [];

    // Remove if already exists
    products = products.filter((p) => p.id !== product.id);

    // Add to beginning with timestamp
    products.unshift({
      ...product,
      viewedAt: Date.now(),
    });

    // Keep only last 10
    products = products.slice(0, 10);

    localStorage.setItem("recentlyViewed", JSON.stringify(products));
  } catch (e) {
    console.error("Failed to save recently viewed product", e);
  }
}
