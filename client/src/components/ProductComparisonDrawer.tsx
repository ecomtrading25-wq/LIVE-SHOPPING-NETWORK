import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Check, Minus, Star, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { useCart } from "@/contexts/CartContext";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  inStock: boolean;
  features: string[];
}

interface ProductComparisonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRemoveProduct: (productId: string) => void;
}

/**
 * Mobile Product Comparison Drawer
 * Side-by-side comparison with swipe navigation
 * Touch-optimized for easy browsing
 */
export default function ProductComparisonDrawer({
  isOpen,
  onClose,
  products,
  onRemoveProduct,
}: ProductComparisonDrawerProps) {
  const { addItem } = useCart();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen) return null;

  const currentProduct = products[currentIndex];
  const allFeatures = Array.from(
    new Set(products.flatMap((p) => p.features))
  );

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Comparison Drawer */}
      <div className="fixed inset-0 z-50 md:hidden bg-zinc-900 flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-800 bg-zinc-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Compare Products</h2>
              <p className="text-sm text-gray-400">
                {products.length} products • Swipe to navigate
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Product Navigation Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {products.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === index
                    ? "bg-purple-500 w-8"
                    : "bg-gray-700 w-2"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Current Product Card */}
          <div className="p-4">
            <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
              {/* Product Image */}
              <div className="relative aspect-square">
                <img
                  src={currentProduct.image}
                  alt={currentProduct.name}
                  className="w-full h-full object-cover"
                />
                {currentProduct.originalPrice && (
                  <Badge className="absolute top-4 right-4 bg-red-600">
                    {Math.round(
                      ((currentProduct.originalPrice - currentProduct.price) /
                        currentProduct.originalPrice) *
                        100
                    )}
                    % OFF
                  </Badge>
                )}
                <button
                  onClick={() => onRemoveProduct(currentProduct.id)}
                  className="absolute top-4 left-4 p-2 bg-black/60 rounded-full backdrop-blur-sm"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-6">
                <Link href={`/products/${currentProduct.id}`}>
                  <h3 className="text-xl font-bold text-white mb-2 hover:text-purple-400">
                    {currentProduct.name}
                  </h3>
                </Link>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(currentProduct.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">
                    {currentProduct.rating} ({currentProduct.reviewCount})
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-bold text-white">
                    ${currentProduct.price}
                  </span>
                  {currentProduct.originalPrice && (
                    <span className="text-lg text-gray-400 line-through">
                      ${currentProduct.originalPrice}
                    </span>
                  )}
                </div>

                {/* Stock Status */}
                <Badge
                  className={
                    currentProduct.inStock
                      ? "bg-green-500/20 text-green-400 mb-6"
                      : "bg-red-500/20 text-red-400 mb-6"
                  }
                >
                  {currentProduct.inStock ? "In Stock" : "Out of Stock"}
                </Badge>

                {/* Features Comparison */}
                <div className="space-y-3 mb-6">
                  <h4 className="text-sm font-semibold text-gray-400 uppercase">
                    Features
                  </h4>
                  {allFeatures.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center justify-between py-2 border-b border-gray-800"
                    >
                      <span className="text-gray-300 text-sm">{feature}</span>
                      {currentProduct.features.includes(feature) ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <Minus className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    onClick={() => handleAddToCart(currentProduct)}
                    disabled={!currentProduct.inStock}
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {currentProduct.inStock ? "Add to Cart" : "Out of Stock"}
                  </Button>
                  <Link href={`/products/${currentProduct.id}`}>
                    <Button
                      variant="outline"
                      className="w-full h-12 border-gray-700 text-gray-300"
                    >
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Comparison Table */}
          <div className="p-4">
            <h3 className="text-lg font-bold text-white mb-4">Quick Compare</h3>
            <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-3 text-sm text-gray-400">Product</th>
                    <th className="text-right p-3 text-sm text-gray-400">Price</th>
                    <th className="text-right p-3 text-sm text-gray-400">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr
                      key={product.id}
                      onClick={() => setCurrentIndex(index)}
                      className={`border-t border-gray-800 cursor-pointer transition-colors ${
                        currentIndex === index
                          ? "bg-purple-500/20"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <span className="text-white text-sm font-medium line-clamp-2">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-white font-bold">
                          ${product.price}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-white text-sm">
                            {product.rating}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
