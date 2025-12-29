import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, Users, Zap, Heart } from "lucide-react";
import { Link } from "wouter";

/**
 * Product Recommendations Component
 * Collaborative filtering and personalized suggestions
 */

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  discount?: number;
}

interface ProductRecommendationsProps {
  type: "for-you" | "trending" | "frequently-bought" | "similar" | "recently-viewed";
  productId?: string;
  title?: string;
  subtitle?: string;
  limit?: number;
}

export default function ProductRecommendations({
  type,
  productId,
  title,
  subtitle,
  limit = 6,
}: ProductRecommendationsProps) {
  // Mock recommendations - in production, fetch from personalization engine
  const mockProducts: Product[] = [
    {
      id: "1",
      name: "Wireless Noise-Cancelling Headphones",
      price: 199.99,
      originalPrice: 299.99,
      rating: 4.8,
      reviews: 2341,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
      badge: "Bestseller",
      discount: 33,
    },
    {
      id: "2",
      name: "Smart Fitness Watch",
      price: 149.99,
      originalPrice: 199.99,
      rating: 4.6,
      reviews: 1823,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
      badge: "Trending",
      discount: 25,
    },
    {
      id: "3",
      name: "Premium Leather Backpack",
      price: 89.99,
      rating: 4.9,
      reviews: 987,
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
      badge: "New",
    },
    {
      id: "4",
      name: "Portable Bluetooth Speaker",
      price: 79.99,
      originalPrice: 129.99,
      rating: 4.7,
      reviews: 1456,
      image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
      discount: 38,
    },
    {
      id: "5",
      name: "Wireless Charging Pad",
      price: 29.99,
      originalPrice: 49.99,
      rating: 4.5,
      reviews: 743,
      image: "https://images.unsplash.com/photo-1591290619762-c588f8e4e8e0?w=400",
      badge: "Hot Deal",
      discount: 40,
    },
    {
      id: "6",
      name: "USB-C Hub Adapter",
      price: 39.99,
      rating: 4.4,
      reviews: 521,
      image: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400",
    },
  ];

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case "for-you":
        return "Recommended For You";
      case "trending":
        return "Trending Now";
      case "frequently-bought":
        return "Frequently Bought Together";
      case "similar":
        return "Similar Products";
      case "recently-viewed":
        return "Recently Viewed";
      default:
        return "You May Also Like";
    }
  };

  const getSubtitle = () => {
    if (subtitle) return subtitle;
    switch (type) {
      case "for-you":
        return "Based on your browsing history and preferences";
      case "trending":
        return "Popular products right now";
      case "frequently-bought":
        return "Customers who bought this also bought";
      case "similar":
        return "Products similar to what you're viewing";
      case "recently-viewed":
        return "Continue where you left off";
      default:
        return "";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "for-you":
        return <Star className="w-5 h-5 text-purple-400" />;
      case "trending":
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case "frequently-bought":
        return <Users className="w-5 h-5 text-blue-400" />;
      case "similar":
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case "recently-viewed":
        return <Heart className="w-5 h-5 text-pink-400" />;
      default:
        return null;
    }
  };

  const products = mockProducts.slice(0, limit);

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          {getIcon()}
          <div>
            <h2 className="text-3xl font-bold text-foreground">{getTitle()}</h2>
            {getSubtitle() && (
              <p className="text-gray-400 mt-1">{getSubtitle()}</p>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="group cursor-pointer overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105">
                {/* Image */}
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {product.badge && (
                    <Badge className="absolute top-3 left-3 bg-purple-600 text-foreground">
                      {product.badge}
                    </Badge>
                  )}
                  {product.discount && (
                    <Badge className="absolute top-3 right-3 bg-red-600 text-foreground">
                      -{product.discount}%
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-foreground font-semibold mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                    {product.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-foreground text-sm font-medium">
                        {product.rating}
                      </span>
                    </div>
                    <span className="text-gray-400 text-sm">
                      ({product.reviews.toLocaleString()})
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-foreground text-xl font-bold">
                      ${product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-gray-400 text-sm line-through">
                        ${product.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    Add to Cart
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* View More */}
        {type === "for-you" && (
          <div className="text-center mt-8">
            <Link href="/products">
              <Button variant="outline" size="lg">
                View All Products
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Frequently Bought Together Component
 * Shows bundle suggestions with total price
 */
interface FrequentlyBoughtTogetherProps {
  mainProduct: Product;
  suggestedProducts: Product[];
}

export function FrequentlyBoughtTogether({
  mainProduct,
  suggestedProducts,
}: FrequentlyBoughtTogetherProps) {
  const totalPrice = [mainProduct, ...suggestedProducts].reduce(
    (sum, p) => sum + p.price,
    0
  );
  const totalOriginalPrice = [mainProduct, ...suggestedProducts].reduce(
    (sum, p) => sum + (p.originalPrice || p.price),
    0
  );
  const savings = totalOriginalPrice - totalPrice;

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <h3 className="text-2xl font-bold text-foreground mb-6">Frequently Bought Together</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Main Product */}
        <Card className="p-4 bg-white/5 border-white/10">
          <img
            src={mainProduct.image}
            alt={mainProduct.name}
            className="w-full aspect-square object-cover rounded-lg mb-3"
          />
          <h4 className="text-foreground font-semibold mb-2 line-clamp-2">
            {mainProduct.name}
          </h4>
          <p className="text-purple-400 font-bold">${mainProduct.price}</p>
        </Card>

        {/* Plus Sign */}
        <div className="flex items-center justify-center">
          <div className="text-4xl text-gray-400 font-bold">+</div>
        </div>

        {/* Suggested Products */}
        <div className="space-y-4">
          {suggestedProducts.map((product) => (
            <Card key={product.id} className="p-3 bg-white/5 border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h5 className="text-foreground text-sm font-medium line-clamp-1">
                    {product.name}
                  </h5>
                  <p className="text-purple-400 font-bold">${product.price}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Bundle Summary */}
      <div className="border-t border-white/10 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-400 text-sm">Total Bundle Price</p>
            <div className="flex items-center gap-3">
              <p className="text-foreground text-3xl font-bold">${totalPrice.toFixed(2)}</p>
              {savings > 0 && (
                <>
                  <span className="text-gray-400 text-lg line-through">
                    ${totalOriginalPrice.toFixed(2)}
                  </span>
                  <Badge className="bg-green-500/20 text-green-400">
                    Save ${savings.toFixed(2)}
                  </Badge>
                </>
              )}
            </div>
          </div>
          <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
            Add Bundle to Cart
          </Button>
        </div>
      </div>
    </Card>
  );
}
