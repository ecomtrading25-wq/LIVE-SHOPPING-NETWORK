import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Bell,
  Mail,
  MessageSquare,
  ShoppingCart,
  Package,
  AlertCircle,
  TrendingUp,
  Heart,
  DollarSign,
} from "lucide-react";

/**
 * Notification Preferences Page
 * Allow users to control email and push notification settings
 */

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState({
    // Order notifications
    orderConfirmation: { email: true, push: true },
    orderShipped: { email: true, push: true },
    orderDelivered: { email: true, push: false },
    orderCancelled: { email: true, push: true },

    // Product notifications
    backInStock: { email: true, push: true },
    priceDrops: { email: true, push: false },
    newArrivals: { email: false, push: false },

    // Live shopping notifications
    liveShowStarting: { email: true, push: true },
    productPinned: { email: false, push: true },
    exclusiveDeals: { email: true, push: true },

    // Account notifications
    passwordChanged: { email: true, push: true },
    loginFromNewDevice: { email: true, push: true },
    accountActivity: { email: false, push: false },

    // Marketing notifications
    promotions: { email: true, push: false },
    newsletter: { email: true, push: false },
    recommendations: { email: false, push: false },

    // Wishlist notifications
    wishlistPriceDrops: { email: true, push: true },
    wishlistBackInStock: { email: true, push: true },

    // Returns & refunds
    returnApproved: { email: true, push: true },
    refundProcessed: { email: true, push: true },
  });

  const [isSaving, setIsSaving] = useState(false);

  const togglePreference = (key: string, type: "email" | "push") => {
    setPreferences({
      ...preferences,
      [key]: {
        ...preferences[key as keyof typeof preferences],
        [type]: !preferences[key as keyof typeof preferences][type],
      },
    });
  };

  const handleSave = async () => {
    setIsSaving(true);

    // In production, call tRPC mutation to save preferences
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Notification preferences saved successfully!");
    }, 1000);
  };

  const notificationCategories = [
    {
      title: "Order Updates",
      description: "Stay informed about your order status",
      icon: ShoppingCart,
      items: [
        {
          key: "orderConfirmation",
          label: "Order Confirmation",
          description: "Receive confirmation when you place an order",
        },
        {
          key: "orderShipped",
          label: "Order Shipped",
          description: "Get notified when your order ships",
        },
        {
          key: "orderDelivered",
          label: "Order Delivered",
          description: "Know when your order is delivered",
        },
        {
          key: "orderCancelled",
          label: "Order Cancelled",
          description: "Be informed if an order is cancelled",
        },
      ],
    },
    {
      title: "Product Alerts",
      description: "Never miss out on products you love",
      icon: Package,
      items: [
        {
          key: "backInStock",
          label: "Back in Stock",
          description: "Get notified when out-of-stock items are available",
        },
        {
          key: "priceDrops",
          label: "Price Drops",
          description: "Know when prices drop on products you viewed",
        },
        {
          key: "newArrivals",
          label: "New Arrivals",
          description: "Be the first to know about new products",
        },
      ],
    },
    {
      title: "Live Shopping",
      description: "Join live shows and exclusive deals",
      icon: TrendingUp,
      items: [
        {
          key: "liveShowStarting",
          label: "Live Show Starting",
          description: "Get notified when a live show is about to start",
        },
        {
          key: "productPinned",
          label: "Product Pinned",
          description: "Know when a product is featured during live shows",
        },
        {
          key: "exclusiveDeals",
          label: "Exclusive Deals",
          description: "Receive alerts for live-only special offers",
        },
      ],
    },
    {
      title: "Wishlist",
      description: "Track items you're interested in",
      icon: Heart,
      items: [
        {
          key: "wishlistPriceDrops",
          label: "Wishlist Price Drops",
          description: "Get notified when wishlist items go on sale",
        },
        {
          key: "wishlistBackInStock",
          label: "Wishlist Back in Stock",
          description: "Know when wishlist items are available again",
        },
      ],
    },
    {
      title: "Returns & Refunds",
      description: "Stay updated on return requests",
      icon: DollarSign,
      items: [
        {
          key: "returnApproved",
          label: "Return Approved",
          description: "Get notified when your return is approved",
        },
        {
          key: "refundProcessed",
          label: "Refund Processed",
          description: "Know when your refund has been issued",
        },
      ],
    },
    {
      title: "Account Security",
      description: "Important account activity alerts",
      icon: AlertCircle,
      items: [
        {
          key: "passwordChanged",
          label: "Password Changed",
          description: "Be notified of password changes",
        },
        {
          key: "loginFromNewDevice",
          label: "Login from New Device",
          description: "Get alerts for logins from unrecognized devices",
        },
        {
          key: "accountActivity",
          label: "Account Activity",
          description: "Receive updates about account changes",
        },
      ],
    },
    {
      title: "Marketing & Promotions",
      description: "Special offers and recommendations",
      icon: Mail,
      items: [
        {
          key: "promotions",
          label: "Promotions",
          description: "Receive promotional offers and discounts",
        },
        {
          key: "newsletter",
          label: "Newsletter",
          description: "Get our weekly newsletter with tips and trends",
        },
        {
          key: "recommendations",
          label: "Personalized Recommendations",
          description: "Receive product suggestions based on your interests",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 py-12">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            Notification Preferences
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Choose how you want to receive notifications from us
          </p>
        </div>

        {/* Notification Categories */}
        <div className="space-y-6">
          {notificationCategories.map((category) => {
            const Icon = category.icon;

            return (
              <Card key={category.title} className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                      {category.title}
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      {category.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {category.items.map((item) => {
                    const pref = preferences[item.key as keyof typeof preferences];

                    return (
                      <div
                        key={item.key}
                        className="flex items-start justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800 last:border-0 last:pb-0"
                      >
                        <div className="flex-1">
                          <Label className="text-base font-medium text-zinc-900 dark:text-white">
                            {item.label}
                          </Label>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-zinc-400" />
                            <Switch
                              checked={pref.email}
                              onCheckedChange={() =>
                                togglePreference(item.key, "email")
                              }
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-zinc-400" />
                            <Switch
                              checked={pref.push}
                              onCheckedChange={() =>
                                togglePreference(item.key, "push")
                              }
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Legend */}
        <Card className="p-6 mt-6 bg-zinc-50 dark:bg-zinc-900">
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Email Notifications
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Push Notifications
              </span>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex gap-4 mt-8">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 h-12 bg-purple-600 hover:bg-purple-700 text-base"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              "Save Preferences"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/account")}
            className="h-12"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
