import { useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ShoppingCart,
  Star,
  Truck,
  Shield,
  RefreshCw,
  Zap,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";

/**
 * Product Detail Page
 * Full product information with add to cart
 */

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const [quantity, setQuantity] = useState(1);
  const { addItem, totalItems } = useCart();

  const { data: product, isLoading } = trpc.products.getById.useQuery({ id: productId });
  const { data: relatedProducts } = trpc.products.getRelated.useQuery({ id: productId });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Product not found</p>
          <Link href="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const discount = product.compareAtPrice
    ? Math.round(
        ((parseFloat(product.compareAtPrice) - parseFloat(product.price)) /
          parseFloat(product.compareAtPrice)) *
          100
      )
    : 0;

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
    });
    toast.success(`Added ${quantity}x ${product.name} to cart!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="text-2xl font-bold text-white hover:text-purple-400 transition-colors">
                Live Shopping Network
              </a>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/cart">
                <Button variant="outline" className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-purple-600 rounded-full text-xs flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/products">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </Link>

        {/* Product Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Image */}
          <div>
            <Card className="overflow-hidden bg-white/5 border-white/10 relative">
              {product.isFeatured && (
                <Badge className="absolute top-4 left-4 bg-yellow-500 text-black font-bold z-10">
                  <Zap className="w-3 h-3 mr-1" />
                  LIVE NOW
                </Badge>
              )}
              {discount > 0 && (
                <Badge className="absolute top-4 right-4 bg-red-600 z-10 text-lg px-3 py-1">
                  -{discount}% OFF
                </Badge>
              )}
              <div className="aspect-square bg-gradient-to-br from-purple-600/20 to-pink-600/20 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 bg-white/10 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-32 h-32 text-white/50" />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-white mb-4">{product.name}</h1>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <span className="text-gray-400">(128 reviews)</span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <p className="text-5xl font-bold text-white">${product.price}</p>
                {product.compareAtPrice && (
                  <div>
                    <p className="text-2xl text-gray-400 line-through">
                      ${product.compareAtPrice}
                    </p>
                    <p className="text-green-400 font-medium">Save ${(parseFloat(product.compareAtPrice) - parseFloat(product.price)).toFixed(2)}</p>
                  </div>
                )}
              </div>

              {product.description && (
                <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="text-white font-medium mb-3 block">Quantity</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-white/10 rounded-lg p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-white hover:bg-white/10"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-white font-bold text-xl w-12 text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    className="text-white hover:bg-white/10"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Badge className="bg-green-600 text-lg px-4 py-2">In Stock</Badge>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              size="lg"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg h-14 mb-6"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-5 h-5 mr-3" />
              Add to Cart - ${(parseFloat(product.price) * quantity).toFixed(2)}
            </Button>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-white/5 border-white/10 text-center">
                <Truck className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">Free Shipping</p>
              </Card>
              <Card className="p-4 bg-white/5 border-white/10 text-center">
                <Shield className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">Buyer Protection</p>
              </Card>
              <Card className="p-4 bg-white/5 border-white/10 text-center">
                <RefreshCw className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">30-Day Returns</p>
              </Card>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link key={relatedProduct.id} href={`/products/${relatedProduct.id}`}>
                  <Card className="group overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all cursor-pointer">
                    <div className="aspect-square bg-gradient-to-br from-purple-600/20 to-pink-600/20 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                          <ShoppingCart className="w-12 h-12 text-white/50" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                        {relatedProduct.name}
                      </h3>
                      <p className="text-xl font-bold text-white">${relatedProduct.price}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
