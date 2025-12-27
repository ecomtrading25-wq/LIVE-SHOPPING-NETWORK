import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  X,
  ShoppingCart,
  Heart,
  Star,
  Minus,
  Plus,
  Eye,
} from "lucide-react";

interface ProductQuickViewProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductQuickView({ productId, isOpen, onClose }: ProductQuickViewProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState("Black");

  // Mock product data
  const product = {
    id: productId,
    name: "Wireless Headphones Pro",
    price: 299.99,
    originalPrice: 349.99,
    rating: 4.5,
    reviews: 234,
    inStock: true,
    images: ["/placeholder1.jpg", "/placeholder2.jpg", "/placeholder3.jpg"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "White", "Blue", "Red"],
    description: "Premium wireless headphones with active noise cancellation and 30-hour battery life.",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Product Quick View</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-secondary rounded-lg overflow-hidden">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {product.images.map((img, index) => (
                <div
                  key={index}
                  className="aspect-square bg-secondary rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary"
                >
                  <img
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">{product.name}</h2>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(product.rating)
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-gray-400"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating} ({product.reviews} reviews)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-4xl font-bold">${product.price}</p>
                {product.originalPrice && (
                  <p className="text-xl text-muted-foreground line-through">
                    ${product.originalPrice}
                  </p>
                )}
                {product.originalPrice && (
                  <Badge className="bg-red-500/20 text-red-400">
                    Save ${(product.originalPrice - product.price).toFixed(2)}
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-muted-foreground">{product.description}</p>

            {/* Size Selector */}
            <div>
              <p className="font-medium mb-2">Size</p>
              <div className="flex gap-2">
                {product.sizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div>
              <p className="font-medium mb-2">Color</p>
              <div className="flex gap-2">
                {product.colors.map((color) => (
                  <Button
                    key={color}
                    variant={selectedColor === color ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div>
              <p className="font-medium mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Stock Status */}
            {product.inStock ? (
              <Badge className="bg-green-500/20 text-green-400">In Stock</Badge>
            ) : (
              <Badge className="bg-red-500/20 text-red-400">Out of Stock</Badge>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button className="flex-1" size="lg" disabled={!product.inStock}>
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
              <Button variant="outline" size="lg">
                <Heart className="w-5 h-5" />
              </Button>
            </div>

            <Button variant="outline" className="w-full" onClick={onClose}>
              <Eye className="w-5 h-5 mr-2" />
              View Full Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function QuickViewButton({ productId }: { productId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        <Eye className="w-4 h-4 mr-2" />
        Quick View
      </Button>
      <ProductQuickView
        productId={productId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
