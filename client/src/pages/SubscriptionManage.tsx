import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Package,
  Calendar,
  CreditCard,
  Edit,
  Pause,
  Play,
  X,
  Check,
  Gift,
  TrendingUp,
  Clock,
  DollarSign,
  Settings,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Subscription Box Management
 * Customization, delivery scheduling, skip/pause, billing management
 */

interface Subscription {
  id: string;
  name: string;
  description: string;
  price: number;
  frequency: "weekly" | "biweekly" | "monthly";
  status: "active" | "paused" | "cancelled";
  nextDelivery: string;
  itemsPerBox: number;
  totalDeliveries: number;
  savedAmount: number;
  preferences: SubscriptionPreferences;
}

interface SubscriptionPreferences {
  categories: string[];
  excludedItems: string[];
  priceRange: { min: number; max: number };
  brands: string[];
}

interface UpcomingDelivery {
  id: string;
  date: string;
  items: DeliveryItem[];
  total: number;
  status: "scheduled" | "processing" | "shipped" | "skipped";
  canSkip: boolean;
  canModify: boolean;
}

interface DeliveryItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

export default function SubscriptionManagePage() {
  // Mock subscription data
  const [subscription, setSubscription] = useState<Subscription>({
    id: "sub_001",
    name: "Premium Beauty Box",
    description: "Curated selection of premium beauty products delivered monthly",
    price: 49.99,
    frequency: "monthly",
    status: "active",
    nextDelivery: "2026-01-15",
    itemsPerBox: 5,
    totalDeliveries: 8,
    savedAmount: 156.42,
    preferences: {
      categories: ["Skincare", "Makeup", "Haircare"],
      excludedItems: ["Fragrance", "Nail Polish"],
      priceRange: { min: 10, max: 30 },
      brands: ["Premium Brand A", "Luxury Brand B"],
    },
  });

  const [upcomingDeliveries, setUpcomingDeliveries] = useState<UpcomingDelivery[]>([
    {
      id: "del_001",
      date: "2026-01-15",
      items: [
        {
          id: "1",
          name: "Hydrating Face Serum",
          price: 28.99,
          image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200",
          category: "Skincare",
        },
        {
          id: "2",
          name: "Luxury Lipstick Set",
          price: 34.99,
          image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=200",
          category: "Makeup",
        },
        {
          id: "3",
          name: "Nourishing Hair Mask",
          price: 22.99,
          image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=200",
          category: "Haircare",
        },
        {
          id: "4",
          name: "Vitamin C Moisturizer",
          price: 26.99,
          image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200",
          category: "Skincare",
        },
        {
          id: "5",
          name: "Eye Shadow Palette",
          price: 31.99,
          image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=200",
          category: "Makeup",
        },
      ],
      total: 145.95,
      status: "scheduled",
      canSkip: true,
      canModify: true,
    },
    {
      id: "del_002",
      date: "2026-02-15",
      items: [],
      total: 0,
      status: "scheduled",
      canSkip: true,
      canModify: false,
    },
  ]);

  const [isEditingPreferences, setIsEditingPreferences] = useState(false);

  const availableCategories = [
    "Skincare",
    "Makeup",
    "Haircare",
    "Fragrance",
    "Nail Polish",
    "Body Care",
    "Tools & Accessories",
  ];

  const handlePauseSubscription = () => {
    setSubscription({ ...subscription, status: "paused" });
    toast.success("Subscription paused successfully");
  };

  const handleResumeSubscription = () => {
    setSubscription({ ...subscription, status: "active" });
    toast.success("Subscription resumed successfully");
  };

  const handleCancelSubscription = () => {
    setSubscription({ ...subscription, status: "cancelled" });
    toast.success("Subscription cancelled. You'll receive deliveries until the end of your billing period.");
  };

  const handleSkipDelivery = (deliveryId: string) => {
    setUpcomingDeliveries(
      upcomingDeliveries.map((delivery) =>
        delivery.id === deliveryId ? { ...delivery, status: "skipped" } : delivery
      )
    );
    toast.success("Delivery skipped successfully");
  };

  const handleSwapItem = (deliveryId: string, itemId: string) => {
    toast.info("Item swap feature - Select a replacement product");
  };

  const handleUpdateFrequency = (frequency: "weekly" | "biweekly" | "monthly") => {
    setSubscription({ ...subscription, frequency });
    toast.success(`Delivery frequency updated to ${frequency}`);
  };

  const handleToggleCategory = (category: string) => {
    const categories = subscription.preferences.categories.includes(category)
      ? subscription.preferences.categories.filter((c) => c !== category)
      : [...subscription.preferences.categories, category];

    setSubscription({
      ...subscription,
      preferences: { ...subscription.preferences, categories },
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-500/20 text-green-400 border-green-500/30",
      paused: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
      scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      processing: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      shipped: "bg-green-500/20 text-green-400 border-green-500/30",
      skipped: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return styles[status as keyof typeof styles] || styles.scheduled;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Manage Subscription</h1>
          <p className="text-muted-foreground text-lg">Customize your box, manage deliveries, and update preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Overview */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">{subscription.name}</h2>
                  <p className="text-gray-400">{subscription.description}</p>
                </div>
                <Badge className={`border ${getStatusBadge(subscription.status)}`}>
                  {subscription.status.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Price</p>
                  <p className="text-foreground text-xl font-bold">${subscription.price}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Frequency</p>
                  <p className="text-foreground text-xl font-bold capitalize">{subscription.frequency}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Next Delivery</p>
                  <p className="text-foreground text-xl font-bold">
                    {new Date(subscription.nextDelivery).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Saved</p>
                  <p className="text-green-400 text-xl font-bold">${subscription.savedAmount}</p>
                </div>
              </div>

              <div className="flex gap-3">
                {subscription.status === "active" ? (
                  <Button variant="outline" onClick={handlePauseSubscription}>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Subscription
                  </Button>
                ) : subscription.status === "paused" ? (
                  <Button onClick={handleResumeSubscription} className="bg-green-600 hover:bg-green-700">
                    <Play className="w-4 h-4 mr-2" />
                    Resume Subscription
                  </Button>
                ) : null}

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Calendar className="w-4 h-4 mr-2" />
                      Change Frequency
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Delivery Frequency</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleUpdateFrequency("weekly")}
                      >
                        Weekly - Every 7 days
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleUpdateFrequency("biweekly")}
                      >
                        Bi-weekly - Every 14 days
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleUpdateFrequency("monthly")}
                      >
                        Monthly - Every 30 days
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {subscription.status !== "cancelled" && (
                  <Button variant="outline" onClick={handleCancelSubscription} className="text-red-400 hover:text-red-300">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </Card>

            {/* Upcoming Deliveries */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h2 className="text-2xl font-bold text-foreground mb-6">Upcoming Deliveries</h2>
              <div className="space-y-6">
                {upcomingDeliveries.map((delivery) => (
                  <Card key={delivery.id} className="p-6 bg-white/5 border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-foreground font-bold text-lg">
                          {new Date(delivery.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {delivery.items.length} items • ${delivery.total.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`border ${getStatusBadge(delivery.status)}`}>
                          {delivery.status}
                        </Badge>
                        {delivery.canSkip && delivery.status === "scheduled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSkipDelivery(delivery.id)}
                          >
                            Skip
                          </Button>
                        )}
                      </div>
                    </div>

                    {delivery.items.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {delivery.items.map((item) => (
                          <div key={item.id} className="relative group">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full aspect-square object-cover rounded-lg"
                            />
                            <div className="mt-2">
                              <p className="text-foreground text-sm font-medium line-clamp-2">{item.name}</p>
                              <p className="text-purple-400 text-sm font-bold">${item.price}</p>
                            </div>
                            {delivery.canModify && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleSwapItem(delivery.id, item.id)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </Card>

            {/* Preferences */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Preferences</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingPreferences(!isEditingPreferences)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {isEditingPreferences ? "Save" : "Edit"}
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-foreground mb-3 block">Product Categories</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map((category) => (
                      <Badge
                        key={category}
                        className={`cursor-pointer ${
                          subscription.preferences.categories.includes(category)
                            ? "bg-purple-500/30 text-purple-400 border-purple-500/50"
                            : "bg-white/10 text-gray-400 border-white/20"
                        }`}
                        onClick={() => isEditingPreferences && handleToggleCategory(category)}
                      >
                        {subscription.preferences.categories.includes(category) && (
                          <Check className="w-3 h-3 mr-1" />
                        )}
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-foreground mb-3 block">Price Range per Item</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        type="number"
                        value={subscription.preferences.priceRange.min}
                        disabled={!isEditingPreferences}
                        className="bg-white/10 border-white/20 text-foreground"
                      />
                    </div>
                    <span className="text-gray-400">to</span>
                    <div className="flex-1">
                      <Input
                        type="number"
                        value={subscription.preferences.priceRange.max}
                        disabled={!isEditingPreferences}
                        className="bg-white/10 border-white/20 text-foreground"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-foreground mb-3 block">Excluded Items</Label>
                  <div className="flex flex-wrap gap-2">
                    {subscription.preferences.excludedItems.map((item) => (
                      <Badge key={item} className="bg-red-500/20 text-red-400 border-red-500/30">
                        {item}
                        {isEditingPreferences && <X className="w-3 h-3 ml-1 cursor-pointer" />}
                      </Badge>
                    ))}
                    {isEditingPreferences && (
                      <Badge className="bg-white/10 text-gray-400 border-white/20 cursor-pointer">
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-xl font-bold text-foreground mb-4">Subscription Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Package className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Total Deliveries</p>
                      <p className="text-foreground text-xl font-bold">{subscription.totalDeliveries}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <DollarSign className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Total Saved</p>
                      <p className="text-foreground text-xl font-bold">${subscription.savedAmount}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Gift className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Items Received</p>
                      <p className="text-foreground text-xl font-bold">{subscription.totalDeliveries * subscription.itemsPerBox}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Method */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-xl font-bold text-foreground mb-4">Payment Method</h3>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-lg">
                    <CreditCard className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">•••• 4242</p>
                    <p className="text-gray-400 text-sm">Expires 12/26</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-gray-400 text-sm">
                Next billing date: {new Date(subscription.nextDelivery).toLocaleDateString()}
              </p>
            </Card>

            {/* Benefits */}
            <Card className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Subscriber Benefits
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-foreground text-sm">
                  <Check className="w-4 h-4 text-green-400 mt-0.5" />
                  <span>15% savings on every box</span>
                </li>
                <li className="flex items-start gap-2 text-foreground text-sm">
                  <Check className="w-4 h-4 text-green-400 mt-0.5" />
                  <span>Free shipping on all deliveries</span>
                </li>
                <li className="flex items-start gap-2 text-foreground text-sm">
                  <Check className="w-4 h-4 text-green-400 mt-0.5" />
                  <span>Exclusive subscriber-only products</span>
                </li>
                <li className="flex items-start gap-2 text-foreground text-sm">
                  <Check className="w-4 h-4 text-green-400 mt-0.5" />
                  <span>Skip or pause anytime</span>
                </li>
                <li className="flex items-start gap-2 text-foreground text-sm">
                  <Check className="w-4 h-4 text-green-400 mt-0.5" />
                  <span>Personalized product curation</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
