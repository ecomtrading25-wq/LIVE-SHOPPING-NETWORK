import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, TrendingUp, Users, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { Link } from "wouter";

interface RecommendationProps {
  productId?: string;
  userId?: string;
  type: "personalized" | "frequently-bought" | "trending" | "similar";
  limit?: number;
}

export default function PersonalizedRecommendations({
  productId,
  userId,
  type,
  limit = 6,
}: RecommendationProps) {
  const { addItem } = useCart();

  // Placeholder data - would come from tRPC endpoints
  const recommendations = [
    {
      productId: "rec-1",
      productName: "Wireless Charging Pad",
      price: 29.99,
      originalPrice: 39.99,
      image: "https://via.placeholder.com/200",
      rating: 4.5,
      reviewCount: 234,
      score: 95,
      reason: "Customers like you also bought this",
    },
    {
      productId: "rec-2",
      productName: "Phone Case Premium",
      price: 19.99,
      originalPrice: 24.99,
      image: "https://via.placeholder.com/200",
      rating: 4.7,
      reviewCount: 456,
      score: 88,
      reason: "Frequently bought together",
    },
    {
      productId: "rec-3",
      productName: "Screen Protector 2-Pack",
      price: 12.99,
      originalPrice: 15.99,
      image: "https://via.placeholder.com/200",
      rating: 4.3,
      reviewCount: 189,
      score: 82,
      reason: "Trending in live shows",
    },
    {
      productId: "rec-4",
      productName: "USB-C Cable 3-Pack",
      price: 24.99,
      originalPrice: 29.99,
      image: "https://via.placeholder.com/200",
      rating: 4.6,
      reviewCount: 567,
      score: 78,
      reason: "Best seller this month",
    },
    {
      productId: "rec-5",
      productName: "Car Mount Holder",
      price: 16.99,
      originalPrice: 21.99,
      image: "https://via.placeholder.com/200",
      rating: 4.4,
      reviewCount: 312,
      score: 75,
      reason: "Based on your browsing history",
    },
    {
      productId: "rec-6",
      productName: "Portable Power Bank",
      price: 34.99,
      originalPrice: 44.99,
      image: "https://via.placeholder.com/200",
      rating: 4.8,
      reviewCount: 891,
      score: 72,
      reason: "Popular with similar customers",
    },
  ];

  const getTitle = () => {
    switch (type) {
      case "personalized":
        return "Recommended For You";
      case "frequently-bought":
        return "Frequently Bought Together";
      case "trending":
        return "Trending Now";
      case "similar":
        return "Similar Products";
      default:
        return "You May Also Like";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "personalized":
        return <Sparkles className="h-5 w-5" />;
      case "frequently-bought":
        return <Users className="h-5 w-5" />;
      case "trending":
        return <TrendingUp className="h-5 w-5" />;
      case "similar":
        return <Star className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.productId,
      name: product.productName,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
    toast.success(`${product.productName} added to cart`);
  };

  const displayedRecommendations = recommendations.slice(0, limit);

  if (displayedRecommendations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getIcon()}
          {getTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedRecommendations.map((product) => (
            <div
              key={product.productId}
              className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Link href={`/products/${product.productId}`}>
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.productName}
                    className="w-full h-48 object-cover"
                  />
                  {product.originalPrice > product.price && (
                    <Badge className="absolute top-2 right-2 bg-red-500">
                      Save $
                      {(product.originalPrice - product.price).toFixed(2)}
                    </Badge>
                  )}
                </div>
              </Link>

              <div className="p-4 space-y-3">
                <Link href={`/products/${product.productId}`}>
                  <h3 className="font-medium line-clamp-2 hover:text-purple-600">
                    {product.productName}
                  </h3>
                </Link>

                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({product.reviewCount})
                  </span>
                </div>

                <div className="text-sm text-muted-foreground italic">
                  {product.reason}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold">
                      ${product.price.toFixed(2)}
                    </div>
                    {product.originalPrice > product.price && (
                      <div className="text-sm text-muted-foreground line-through">
                        ${product.originalPrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                    className="gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
