import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, TrendingUp, Users, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * Social Proof Widgets
 * Recent purchases, trending products, live activity feed
 */

interface RecentPurchase {
  id: string;
  customerName: string;
  location: string;
  productName: string;
  timeAgo: string;
  amount: number;
}

// Mock recent purchases (in production, fetch from API)
const mockRecentPurchases: RecentPurchase[] = [
  {
    id: "1",
    customerName: "Sarah M.",
    location: "New York, NY",
    productName: "Wireless Earbuds Pro",
    timeAgo: "2 minutes ago",
    amount: 89.99,
  },
  {
    id: "2",
    customerName: "Michael K.",
    location: "Los Angeles, CA",
    productName: "Smart Watch Series 5",
    timeAgo: "5 minutes ago",
    amount: 299.99,
  },
  {
    id: "3",
    customerName: "Emma L.",
    location: "Chicago, IL",
    productName: "Portable Charger 20000mAh",
    timeAgo: "8 minutes ago",
    amount: 45.99,
  },
];

/**
 * Recent Purchase Notification Toast
 * Shows at bottom-left corner
 */
export function RecentPurchaseNotifications() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % mockRecentPurchases.length);
        setIsVisible(true);
      }, 500);
    }, 8000); // Rotate every 8 seconds

    return () => clearInterval(interval);
  }, []);

  const purchase = mockRecentPurchases[currentIndex];

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <Card className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-bold text-sm text-zinc-900 dark:text-white">
                {purchase.customerName}
              </p>
              <Badge variant="secondary" className="text-xs">
                Verified
              </Badge>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
              just purchased <span className="font-semibold">{purchase.productName}</span>
            </p>
            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {purchase.location}
              </span>
              <span>{purchase.timeAgo}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Live Activity Counter
 * Shows current viewers and recent activity
 */
export function LiveActivityCounter() {
  const [viewers, setViewers] = useState(1247);
  const [purchases, setPurchases] = useState(89);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate live viewer count changes
      setViewers((prev) => prev + Math.floor(Math.random() * 10 - 4));
      
      // Occasionally increment purchases
      if (Math.random() > 0.7) {
        setPurchases((prev) => prev + 1);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <Users className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        <span className="font-bold text-lg text-zinc-900 dark:text-white">
          {viewers.toLocaleString()}
        </span>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">watching now</span>
      </div>

      <div className="h-6 w-px bg-zinc-300 dark:bg-zinc-700"></div>

      <div className="flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-purple-600" />
        <span className="font-bold text-lg text-zinc-900 dark:text-white">
          {purchases}
        </span>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">sold today</span>
      </div>
    </div>
  );
}

/**
 * Trending Products Widget
 * Shows hot products with live indicators
 */
export function TrendingProducts() {
  const { data: products } = trpc.products.list.useQuery({
    limit: 3,
    sortBy: "featured",
  });

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-orange-500" />
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
          Trending Now
        </h3>
        <Badge className="bg-orange-500 text-white">🔥 Hot</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {products.slice(0, 3).map((product, index) => (
          <Card
            key={product.id}
            className="p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-purple-500 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <ShoppingBag className="w-8 h-8 text-purple-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-orange-500 text-white text-xs">
                    #{index + 1}
                  </Badge>
                  <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                    {product.name}
                  </p>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                  {Math.floor(Math.random() * 500 + 100)} people viewing
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-purple-600">
                    ${product.price}
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-sm text-zinc-500 line-through">
                      ${product.compareAtPrice}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Social Proof Stats Bar
 * Shows trust indicators
 */
export function SocialProofStats() {
  const stats = [
    {
      icon: Users,
      value: "50K+",
      label: "Happy Customers",
      color: "text-blue-600",
    },
    {
      icon: ShoppingBag,
      value: "100K+",
      label: "Orders Delivered",
      color: "text-purple-600",
    },
    {
      icon: TrendingUp,
      value: "4.8/5",
      label: "Average Rating",
      color: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="p-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-center"
        >
          <div
            className={`w-12 h-12 ${stat.color} bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3`}
          >
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
            {stat.value}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{stat.label}</p>
        </Card>
      ))}
    </div>
  );
}

/**
 * Live Viewer Activity Feed
 * Shows real-time anonymous activity
 */
export function LiveViewerFeed() {
  const [activities, setActivities] = useState<string[]>([
    "Someone in New York added Wireless Earbuds to cart",
    "Someone in California just made a purchase",
    "Someone in Texas is viewing Smart Watch",
    "Someone in Florida added 2 items to wishlist",
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const locations = ["New York", "California", "Texas", "Florida", "Illinois", "Washington"];
      const actions = [
        "added Wireless Earbuds to cart",
        "just made a purchase",
        "is viewing Smart Watch",
        "added items to wishlist",
        "started checkout",
        "joined the live show",
      ];

      const newActivity = `Someone in ${
        locations[Math.floor(Math.random() * locations.length)]
      } ${actions[Math.floor(Math.random() * actions.length)]}`;

      setActivities((prev) => [newActivity, ...prev.slice(0, 3)]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
          Live Activity
        </h3>
      </div>

      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 transition-all duration-500 ${
              index === 0 ? "opacity-100" : "opacity-60"
            }`}
          >
            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{activity}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
