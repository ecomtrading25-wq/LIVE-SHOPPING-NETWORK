import { useState } from "react";
import { Link, useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import {
  Heart,
  ShoppingCart,
  Star,
  ChevronLeft,
  ChevronRight,
  Truck,
  Shield,
  RotateCcw,
  Check,
} from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState("Black");
  const [quantity, setQuantity] = useState(1);

  const product = {
    id: id || "1",
    name: "Premium Wireless Headphones",
    price: 299.99,
    originalPrice: 349.99,
    rating: 4.5,
    reviewCount: 234,
    inStock: true,
    description:
      "Experience premium sound quality with our flagship wireless headphones. Featuring active noise cancellation, 30-hour battery life, and premium comfort padding.",
    images: [
      "/placeholder1.jpg",
      "/placeholder2.jpg",
      "/placeholder3.jpg",
      "/placeholder4.jpg",
    ],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "White", "Blue", "Red"],
    features: [
      "Active Noise Cancellation",
      "30-Hour Battery Life",
      "Premium Comfort Padding",
      "Bluetooth 5.0",
      "Foldable Design",
    ],
  };

  const reviews = [
    {
      id: "1",
      author: "John D.",
      rating: 5,
      date: "2024-01-15",
      verified: true,
      content:
        "Amazing sound quality! The noise cancellation works perfectly on my daily commute.",
      helpful: 45,
    },
    {
      id: "2",
      author: "Sarah M.",
      rating: 4,
      date: "2024-01-10",
      verified: true,
      content:
        "Great headphones overall. Battery life is as advertised. Only minor issue is the fit could be slightly better.",
      helpful: 32,
    },
  ];

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images[0],
      variant: `${selectedSize} / ${selectedColor}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Link href="/products">
          <Button variant="ghost" className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div>
            <div className="aspect-square bg-secondary rounded-lg overflow-hidden mb-4">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-secondary rounded-lg overflow-hidden border-2 ${
                    selectedImage === index
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating)
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-gray-400"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.rating} ({product.reviewCount} reviews)
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Heart className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <p className="text-4xl font-bold">${product.price}</p>
              {product.originalPrice > product.price && (
                <>
                  <p className="text-xl text-muted-foreground line-through">
                    ${product.originalPrice}
                  </p>
                  <Badge className="bg-green-500">
                    Save ${(product.originalPrice - product.price).toFixed(2)}
                  </Badge>
                </>
              )}
            </div>

            <p className="text-muted-foreground mb-6">{product.description}</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Size</label>
                <div className="flex gap-2">
                  {product.sizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <Button
                      key={color}
                      variant={selectedColor === color ? "default" : "outline"}
                      onClick={() => setSelectedColor(color)}
                    >
                      {color}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Quantity</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-bold">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <Button className="flex-1" size="lg" onClick={handleAddToCart}>
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
              <Button variant="outline" size="lg">
                Buy Now
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <Truck className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <p className="text-xs font-medium">Free Shipping</p>
              </Card>
              <Card className="p-4 text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <p className="text-xs font-medium">2 Year Warranty</p>
              </Card>
              <Card className="p-4 text-center">
                <RotateCcw className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                <p className="text-xs font-medium">30 Day Returns</p>
              </Card>
            </div>
          </div>
        </div>

        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {product.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{review.author}</span>
                    {review.verified && (
                      <Badge variant="secondary" className="text-xs">
                        Verified Purchase
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(review.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-gray-400"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-2">{review.content}</p>
                <p className="text-sm text-muted-foreground">
                  {review.helpful} people found this helpful
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
