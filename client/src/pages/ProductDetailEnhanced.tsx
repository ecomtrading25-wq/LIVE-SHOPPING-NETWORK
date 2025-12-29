import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import RecentlyViewed from "@/components/RecentlyViewed";
import SizeGuide from "@/components/SizeGuide";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  ZoomIn,
  X,
  ThumbsUp,
  MessageSquare,
  Send,
} from "lucide-react";

export default function ProductDetailEnhancedPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState("Black");
  const [quantity, setQuantity] = useState(1);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showQAForm, setShowQAForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Track recently viewed products
  useEffect(() => {
    const addToRecentlyViewed = () => {
      const recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
      const productData = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        timestamp: Date.now(),
      };
      
      // Remove if already exists
      const filtered = recentlyViewed.filter((p: any) => p.id !== product.id);
      // Add to beginning
      filtered.unshift(productData);
      // Keep only last 10
      const updated = filtered.slice(0, 10);
      localStorage.setItem("recentlyViewed", JSON.stringify(updated));
    };
    
    addToRecentlyViewed();
  }, [product.id]);

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
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800",
      "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=800",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800",
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
        "Great headphones overall. Battery life is as advertised.",
      helpful: 32,
    },
  ];

  const qas = [
    {
      id: "1",
      question: "Are these compatible with iPhone?",
      author: "Mike R.",
      date: "2024-01-20",
      answer: "Yes! These headphones work perfectly with all iPhone models via Bluetooth 5.0.",
      answeredBy: "Customer Support",
      answerDate: "2024-01-20",
      verified: true,
      helpful: 23,
    },
    {
      id: "2",
      question: "How long does shipping take?",
      author: "Emma L.",
      date: "2024-01-18",
      answer: "Standard shipping takes 3-5 business days. Express shipping is available for 1-2 day delivery.",
      answeredBy: "Customer Support",
      answerDate: "2024-01-18",
      verified: true,
      helpful: 15,
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

  const handleSubmitQuestion = () => {
    // TODO: Submit question to backend
    console.log("Submitting question:", newQuestion);
    setNewQuestion("");
    setShowQAForm(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container py-8">
        <Link href="/products">
          <Button variant="ghost" className="mb-4 text-foreground hover:bg-background/10">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery with Zoom */}
          <div>
            <div
              className="aspect-square bg-background text-foreground/10 backdrop-blur-xl rounded-lg overflow-hidden mb-4 relative group cursor-zoom-in"
              onClick={() => setShowLightbox(true)}
            >
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center text-foreground">
                <ZoomIn className="w-12 h-12 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Thumbnail Navigation */}
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? "border-purple-500 scale-105"
                      : "border-white/20 hover:border-white/40"
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

          {/* Product Info */}
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-4">{product.name}</h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-600"
                    }`}
                  />
                ))}
              </div>
              <span className="text-muted-foreground">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl font-bold text-foreground">${product.price}</span>
              {product.originalPrice && (
                <span className="text-2xl text-gray-400 line-through">
                  ${product.originalPrice}
                </span>
              )}
              {product.originalPrice && (
                <Badge className="bg-red-600">
                  Save ${(product.originalPrice - product.price).toFixed(2)}
                </Badge>
              )}
            </div>

            <p className="text-muted-foreground mb-6">{product.description}</p>

            {/* Size Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  Size
                </label>
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Size Guide
                </button>
              </div>
              <div className="flex gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      selectedSize === size
                        ? "border-purple-500 bg-purple-500/20 text-foreground"
                        : "border-border text-gray-400 hover:border-gray-600"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div className="mb-6">
              <h3 className="text-foreground font-semibold mb-3">Color</h3>
              <div className="flex gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      selectedColor === color
                        ? "border-purple-500 bg-purple-500/20 text-foreground"
                        : "border-white/20 text-muted-foreground hover:border-white/40"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-foreground font-semibold mb-3">Quantity</h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="border-white/20 text-foreground hover:bg-background/10"
                >
                  -
                </Button>
                <span className="text-foreground text-xl font-semibold w-12 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="border-white/20 text-foreground hover:bg-background/10"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex gap-3 mb-6">
              <Button
                onClick={handleAddToCart}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-lg py-6"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="border-white/20 text-foreground hover:bg-background/10 h-auto"
              >
                <Heart className="w-5 h-5" />
              </Button>
            </div>

            {/* Features */}
            <Card className="p-4 bg-background text-foreground/10 backdrop-blur-xl border-white/20">
              <h3 className="text-foreground font-semibold mb-3">Key Features</h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        {/* Customer Q&A Section */}
        <Card className="p-6 bg-background text-foreground/10 backdrop-blur-xl border-white/20 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Customer Questions & Answers</h2>
            <Button
              onClick={() => setShowQAForm(!showQAForm)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Ask a Question
            </Button>
          </div>

          {showQAForm && (
            <Card className="p-4 bg-background text-foreground/5 border-white/10 mb-6">
              <Textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="What would you like to know about this product?"
                className="mb-3 bg-background/10 border-white/20 text-foreground placeholder:text-gray-400"
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitQuestion}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Question
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowQAForm(false)}
                  className="border-white/20 text-foreground hover:bg-background/10"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          <div className="space-y-6">
            {qas.map((qa) => (
              <div key={qa.id} className="border-b border-white/10 pb-6 last:border-0">
                <div className="mb-3">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-purple-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-foreground font-semibold mb-1">{qa.question}</p>
                      <p className="text-gray-400 text-sm">
                        Asked by {qa.author} on {qa.date}
                      </p>
                    </div>
                  </div>
                </div>

                {qa.answer && (
                  <div className="ml-8 p-4 bg-background text-foreground/5 rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                      {qa.verified && (
                        <Badge className="bg-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          Verified Answer
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-2">{qa.answer}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-400 text-sm">
                        Answered by {qa.answeredBy} on {qa.answerDate}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-foreground"
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        Helpful ({qa.helpful})
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Reviews Section */}
        <Card className="p-6 bg-background text-foreground/10 backdrop-blur-xl border-white/20">
          <h2 className="text-2xl font-bold text-foreground mb-6">Customer Reviews</h2>
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-white/10 pb-6 last:border-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-foreground font-semibold">{review.author}</span>
                      {review.verified && (
                        <Badge className="bg-green-600 text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Verified Purchase
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm">{review.date}</span>
                </div>
                <p className="text-muted-foreground mb-3">{review.content}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-foreground"
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  Helpful ({review.helpful})
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recently Viewed Products */}
      <div className="container mx-auto px-4 py-8">
        <RecentlyViewed currentProductId={product.id} />
      </div>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <SizeGuide onClose={() => setShowSizeGuide(false)} />
      )}

      {/* Lightbox Modal */}
      {showLightbox && (
        <div className="fixed inset-0 bg-background/90 z-50 flex items-center justify-center p-4 text-foreground">
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 text-foreground hover:text-muted-foreground"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            onClick={() =>
              setSelectedImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))
            }
            className="absolute left-4 text-foreground hover:text-muted-foreground"
          >
            <ChevronLeft className="w-12 h-12" />
          </button>

          <img
            src={product.images[selectedImage]}
            alt={product.name}
            className="max-w-full max-h-full object-contain"
          />

          <button
            onClick={() =>
              setSelectedImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))
            }
            className="absolute right-4 text-foreground hover:text-muted-foreground"
          >
            <ChevronRight className="w-12 h-12" />
          </button>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {product.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  selectedImage === index ? "bg-background text-foreground w-8" : "bg-background text-foreground/50"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
