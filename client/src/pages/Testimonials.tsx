import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Quote, ThumbsUp, Video, Image as ImageIcon } from "lucide-react";

/**
 * Customer Testimonials Page
 * Showcase customer success stories and reviews
 */

export default function TestimonialsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<number>(0);

  // Mock testimonials data
  const testimonials = [
    {
      id: "1",
      customerName: "Sarah Johnson",
      location: "New York, NY",
      rating: 5,
      title: "Amazing Live Shopping Experience!",
      content:
        "I was skeptical at first, but the live shopping experience is incredible! I got to see the products in real-time, ask questions to the host, and scored amazing deals. The wireless headphones I bought during a live show are fantastic quality.",
      productPurchased: "Wireless Headphones Pro",
      purchaseDate: "2025-01-15",
      verified: true,
      helpful: 234,
      category: "electronics",
      avatar: "https://i.pravatar.cc/150?img=1",
      images: [],
      videoUrl: null,
    },
    {
      id: "2",
      customerName: "Michael Chen",
      location: "San Francisco, CA",
      rating: 5,
      title: "Best Prices & Fast Shipping",
      content:
        "I've been shopping here for 3 months now and haven't looked back. The live shows make shopping fun and interactive. Plus, the prices during flash sales are unbeatable. My order arrived in just 2 days!",
      productPurchased: "Smart Watch Ultra",
      purchaseDate: "2025-01-10",
      verified: true,
      helpful: 189,
      category: "electronics",
      avatar: "https://i.pravatar.cc/150?img=12",
      images: [],
      videoUrl: null,
    },
    {
      id: "3",
      customerName: "Emily Rodriguez",
      location: "Austin, TX",
      rating: 5,
      title: "Love the Creator Community!",
      content:
        "Following my favorite creators and shopping their recommendations has been so much fun. The products are always high quality and the hosts are super knowledgeable. I've discovered so many great products I wouldn't have found otherwise.",
      productPurchased: "Fitness Tracker Band",
      purchaseDate: "2025-01-08",
      verified: true,
      helpful: 156,
      category: "fitness",
      avatar: "https://i.pravatar.cc/150?img=5",
      images: ["/testimonials/emily-1.jpg", "/testimonials/emily-2.jpg"],
      videoUrl: null,
    },
    {
      id: "4",
      customerName: "David Kim",
      location: "Seattle, WA",
      rating: 5,
      title: "Customer Service is Outstanding",
      content:
        "Had an issue with my order and customer service resolved it within hours. They even gave me a discount code for my next purchase. The live chat during shows is also super responsive. Highly recommend!",
      productPurchased: "Bluetooth Speaker Mini",
      purchaseDate: "2025-01-05",
      verified: true,
      helpful: 142,
      category: "electronics",
      avatar: "https://i.pravatar.cc/150?img=8",
      images: [],
      videoUrl: null,
    },
    {
      id: "5",
      customerName: "Jessica Martinez",
      location: "Miami, FL",
      rating: 5,
      title: "Addicted to Live Shopping!",
      content:
        "I tune in to live shows almost every day now. It's like QVC but way better - more interactive, better products, and amazing deals. I've saved hundreds of dollars compared to buying from other retailers. The Shop-the-Live feature is genius!",
      productPurchased: "Multiple Products",
      purchaseDate: "2025-01-01",
      verified: true,
      helpful: 201,
      category: "general",
      avatar: "https://i.pravatar.cc/150?img=9",
      images: [],
      videoUrl: "/testimonials/jessica-review.mp4",
    },
    {
      id: "6",
      customerName: "Robert Taylor",
      location: "Chicago, IL",
      rating: 5,
      title: "Great for Discovering New Products",
      content:
        "I love browsing the live shows to discover new products. The hosts do a great job showcasing features and answering questions. I've found so many unique items I wouldn't have discovered through traditional online shopping.",
      productPurchased: "USB-C Cable 3-Pack",
      purchaseDate: "2024-12-28",
      verified: true,
      helpful: 98,
      category: "accessories",
      avatar: "https://i.pravatar.cc/150?img=15",
      images: [],
      videoUrl: null,
    },
  ];

  const categories = [
    { id: "all", label: "All Reviews", count: testimonials.length },
    { id: "electronics", label: "Electronics", count: 3 },
    { id: "fitness", label: "Fitness", count: 1 },
    { id: "accessories", label: "Accessories", count: 1 },
    { id: "general", label: "General", count: 1 },
  ];

  const filteredTestimonials = testimonials.filter((t) => {
    if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
    if (selectedRating > 0 && t.rating !== selectedRating) return false;
    return true;
  });

  const averageRating =
    testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Customer Testimonials
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            See what our customers are saying about their live shopping experience
          </p>

          {/* Rating Summary */}
          <Card className="inline-block bg-white/10 border-white/20 backdrop-blur-xl">
            <CardContent className="p-8">
              <div className="flex items-center gap-8">
                <div>
                  <div className="text-6xl font-bold text-white mb-2">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-6 h-6 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-gray-300">
                    Based on {testimonials.length} reviews
                  </p>
                </div>

                <div className="border-l border-white/20 pl-8">
                  <div className="text-4xl font-bold text-green-400 mb-2">
                    98%
                  </div>
                  <p className="text-gray-300">Customer Satisfaction</p>
                </div>

                <div className="border-l border-white/20 pl-8">
                  <div className="text-4xl font-bold text-purple-400 mb-2">
                    50K+
                  </div>
                  <p className="text-gray-300">Happy Customers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.id)}
                className={
                  selectedCategory === cat.id
                    ? "bg-purple-600"
                    : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                }
              >
                {cat.label} ({cat.count})
              </Button>
            ))}
          </div>

          <div className="flex gap-2 justify-center">
            <span className="text-white self-center">Filter by rating:</span>
            {[5, 4, 3, 2, 1].map((rating) => (
              <Button
                key={rating}
                variant="outline"
                size="sm"
                onClick={() =>
                  setSelectedRating(selectedRating === rating ? 0 : rating)
                }
                className={
                  selectedRating === rating
                    ? "bg-purple-600 border-purple-600"
                    : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                }
              >
                {rating} <Star className="w-4 h-4 ml-1 fill-yellow-400 text-yellow-400" />
              </Button>
            ))}
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="bg-white/5 border-white/10 hover:bg-white/10 transition-all backdrop-blur-xl"
            >
              <CardContent className="p-6">
                {/* Customer Info */}
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.customerName}
                    className="w-16 h-16 rounded-full border-2 border-purple-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white">
                        {testimonial.customerName}
                      </h3>
                      {testimonial.verified && (
                        <Badge className="bg-green-600 text-xs">
                          ✓ Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {testimonial.location}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < testimonial.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Review Title */}
                <h4 className="font-bold text-lg text-white mb-3">
                  <Quote className="inline w-5 h-5 mr-2 text-purple-400" />
                  {testimonial.title}
                </h4>

                {/* Review Content */}
                <p className="text-gray-300 mb-4 leading-relaxed">
                  {testimonial.content}
                </p>

                {/* Media */}
                {testimonial.images.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {testimonial.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="w-20 h-20 bg-white/10 rounded-lg flex items-center justify-center"
                      >
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}

                {testimonial.videoUrl && (
                  <div className="mb-4 bg-white/10 rounded-lg p-4 flex items-center gap-3">
                    <Video className="w-6 h-6 text-purple-400" />
                    <span className="text-white text-sm">Video Review</span>
                  </div>
                )}

                {/* Product Info */}
                <div className="border-t border-white/10 pt-4 mb-4">
                  <p className="text-sm text-gray-400 mb-1">Purchased:</p>
                  <p className="text-white font-medium">
                    {testimonial.productPurchased}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(testimonial.purchaseDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Helpful */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Helpful ({testimonial.helpful})
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Card className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 border-0">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Join Thousands of Happy Customers
              </h3>
              <p className="text-white/90 mb-6">
                Start your live shopping journey today and discover amazing deals
              </p>
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100"
              >
                Start Shopping Live
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
