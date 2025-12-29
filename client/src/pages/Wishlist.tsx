import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  ShoppingCart,
  X,
  TrendingDown,
  Bell,
  Share2,
  Filter,
} from "lucide-react";

export default function WishlistPage() {
  const [sortBy, setSortBy] = useState("recent");

  const wishlistItems = [
    {
      id: "1",
      name: "Wireless Headphones Pro",
      price: 299.99,
      originalPrice: 349.99,
      image: "/placeholder1.jpg",
      inStock: true,
      priceDropped: true,
      dropAmount: 50,
      addedDate: "2024-01-15",
    },
    {
      id: "2",
      name: "Smart Watch Series 5",
      price: 399.99,
      originalPrice: 399.99,
      image: "/placeholder2.jpg",
      inStock: true,
      priceDropped: false,
      dropAmount: 0,
      addedDate: "2024-01-10",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b bg-card text-card-foreground">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500 fill-red-500" />
              <div>
                <h1 className="text-3xl font-bold">My Wishlist</h1>
                <p className="text-muted-foreground">
                  {wishlistItems.length} items saved
                </p>
              </div>
            </div>
            <Button variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share Wishlist
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Price Drops</p>
                  <p className="text-2xl font-bold">
                    {wishlistItems.filter((item) => item.priceDropped).length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">In Stock</p>
                  <p className="text-2xl font-bold">
                    {wishlistItems.filter((item) => item.inStock).length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Alerts Active</p>
                  <p className="text-2xl font-bold">{wishlistItems.length}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <Card key={item.id} className="group relative overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>

              {item.priceDropped && (
                <Badge className="absolute top-2 left-2 z-10 bg-green-500/20 text-green-400">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  ${item.dropAmount} off
                </Badge>
              )}

              <Link href={`/products/${item.id}`}>
                <div className="aspect-square bg-secondary overflow-hidden cursor-pointer">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              </Link>

              <div className="p-4">
                <Link href={`/products/${item.id}`}>
                  <h3 className="font-bold mb-2 hover:text-primary cursor-pointer line-clamp-2">
                    {item.name}
                  </h3>
                </Link>

                <div className="flex items-center gap-2 mb-3">
                  <p className="text-2xl font-bold">${item.price}</p>
                  {item.originalPrice > item.price && (
                    <p className="text-sm text-muted-foreground line-through">
                      ${item.originalPrice}
                    </p>
                  )}
                </div>

                {item.inStock ? (
                  <Badge className="bg-green-500/20 text-green-400 mb-3">
                    In Stock
                  </Badge>
                ) : (
                  <Badge className="bg-red-500/20 text-red-400 mb-3">
                    Out of Stock
                  </Badge>
                )}

                <Button
                  className="w-full"
                  size="sm"
                  disabled={!item.inStock}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>

                <p className="text-xs text-muted-foreground mt-3">
                  Added {new Date(item.addedDate).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
