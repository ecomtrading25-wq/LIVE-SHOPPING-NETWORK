import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, TrendingUp, ShoppingCart, Star, Users } from "lucide-react";

export function LiveActivityFeed() {
  const activities = [
    { user: "Sarah", location: "New York", product: "Wireless Headphones", time: "2 min ago" },
    { user: "Michael", location: "Los Angeles", product: "Smart Watch", time: "5 min ago" },
    { user: "Emma", location: "Chicago", product: "Bluetooth Speaker", time: "8 min ago" },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const activity = activities[currentIndex];

  return (
    <Card className="p-4 bg-green-500/10 border-green-500/20 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <ShoppingCart className="w-5 h-5 text-green-500" />
        <p className="text-sm">
          <span className="font-bold">{activity.user}</span> from{" "}
          <span className="font-medium">{activity.location}</span> just purchased{" "}
          <span className="font-medium">{activity.product}</span>
        </p>
      </div>
      <p className="text-xs text-muted-foreground mt-1 ml-8">{activity.time}</p>
    </Card>
  );
}

export function ViewerCounter({ count = 23 }: { count?: number }) {
  return (
    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/20">
      <Eye className="w-3 h-3 mr-1" />
      {count} people viewing now
    </Badge>
  );
}

export function TrendingBadge({ category }: { category: string }) {
  return (
    <Badge className="bg-red-500/20 text-red-400 border-red-500/20">
      <TrendingUp className="w-3 h-3 mr-1" />
      Trending in {category}
    </Badge>
  );
}

export function RecentReviews() {
  const reviews = [
    { user: "Alex T.", rating: 5, comment: "Amazing quality! Highly recommend.", time: "1 day ago" },
    { user: "Jamie L.", rating: 4, comment: "Great product, fast shipping.", time: "2 days ago" },
    { user: "Chris M.", rating: 5, comment: "Exceeded my expectations!", time: "3 days ago" },
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg">Recent Reviews</h3>
      {reviews.map((review, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-medium">{review.user}</p>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-400"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-auto">{review.time}</span>
          </div>
          <p className="text-sm text-muted-foreground">{review.comment}</p>
        </Card>
      ))}
    </div>
  );
}

export function CustomersAlsoBought() {
  const products = [
    { name: "Phone Case", price: 19.99, purchases: 234 },
    { name: "Screen Protector", price: 9.99, purchases: 189 },
    { name: "Charging Cable", price: 14.99, purchases: 156 },
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <Users className="w-5 h-5 text-blue-500" />
        Customers Also Bought
      </h3>
      {products.map((product, index) => (
        <Card key={index} className="p-4 hover:bg-accent cursor-pointer transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">{product.purchases} purchases</p>
            </div>
            <p className="font-bold">${product.price}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default {
  LiveActivityFeed,
  ViewerCounter,
  TrendingBadge,
  RecentReviews,
  CustomersAlsoBought,
};
