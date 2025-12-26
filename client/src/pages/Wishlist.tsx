import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { Heart, ShoppingCart, Trash2, Star, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

/**
 * Customer Wishlist
 * Save products for later and quick add-to-cart
 */

export default function WishlistPage() {
  const { addItem } = useCart();
  const { data: wishlistItems, refetch } = trpc.wishlist.list.useQuery();

  const removeFromWishlistMutation = trpc.wishlist.remove.useMutation({
    onSuccess: () => {
      toast.success("Removed from wishlist");
      refetch();
    },
  });

  const handleAddToCart = (item: any) => {
    addItem({
      id: item.productId,
      name: item.productName,
      price: parseFloat(item.price),
      quantity: 1,
      image: item.imageUrl,
    });
    toast.success(`${item.productName} added to cart`);
  };

  const handleRemove = (id: string) => {
    removeFromWishlistMutation.mutate({ id });
  };

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-zinc-900 to-black py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-8">My Wishlist</h1>
          <Card className="p-12 bg-zinc-900/50 border-zinc-800 text-center">
            <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-400 mb-6">
              Save your favorite products to buy them later
            </p>
            <Link href="/products">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Browse Products
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-zinc-900 to-black py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">My Wishlist</h1>
            <p className="text-gray-400 mt-2">
              {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"}{" "}
              saved
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              wishlistItems.forEach((item) => handleAddToCart(item));
            }}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add All to Cart
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <Card
              key={item.id}
              className="bg-zinc-900/50 border-zinc-800 overflow-hidden hover:border-purple-500 transition-all group"
            >
              <div className="relative">
                <img
                  src={item.imageUrl || "/placeholder-product.jpg"}
                  alt={item.productName}
                  className="w-full h-64 object-cover"
                />
                {item.compareAtPrice && (
                  <Badge className="absolute top-3 left-3 bg-red-600">
                    {Math.round(
                      ((parseFloat(item.compareAtPrice) - parseFloat(item.price)) /
                        parseFloat(item.compareAtPrice)) *
                        100
                    )}
                    % OFF
                  </Badge>
                )}
                <button
                  onClick={() => handleRemove(item.id)}
                  className="absolute top-3 right-3 w-10 h-10 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-6">
                <Link href={`/products/${item.productId}`}>
                  <h3 className="text-lg font-semibold text-white mb-2 hover:text-purple-400 transition-colors line-clamp-2">
                    {item.productName}
                  </h3>
                </Link>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">(4.8)</span>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-bold text-white">
                    ${parseFloat(item.price).toFixed(2)}
                  </span>
                  {item.compareAtPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      ${parseFloat(item.compareAtPrice).toFixed(2)}
                    </span>
                  )}
                </div>

                {item.stock && item.stock < 10 && (
                  <div className="flex items-center gap-2 mb-4 text-sm text-orange-400">
                    <TrendingDown className="w-4 h-4" />
                    <span>Only {item.stock} left in stock</span>
                  </div>
                )}

                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => handleAddToCart(item)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>

                <p className="text-xs text-gray-500 mt-3">
                  Added {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
