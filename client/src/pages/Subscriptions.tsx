import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Package,
  Calendar,
  Pause,
  Play,
  Edit2,
  Trash2,
  Plus,
  TrendingUp,
  DollarSign,
  Check,
} from "lucide-react";

interface Subscription {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  frequency: string;
  nextDelivery: string;
  status: string;
  savings: number;
  quantity: number;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    {
      id: "sub-1",
      productId: "1",
      productName: "Premium Coffee Beans",
      productImage: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400",
      price: 24.99,
      frequency: "monthly",
      nextDelivery: "2024-02-15",
      status: "active",
      savings: 5.00,
      quantity: 2,
    },
  ]);

  const handlePauseResume = (subId: string) => {
    setSubscriptions(
      subscriptions.map((sub) =>
        sub.id === subId
          ? { ...sub, status: sub.status === "active" ? "paused" : "active" }
          : sub
      )
    );
  };

  const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
  const totalMonthlySavings = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.savings, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Package className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">My Subscriptions</h1>
                <p className="text-gray-400 mt-1">Manage recurring deliveries</p>
              </div>
            </div>
            <Link href="/products">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Subscription
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {activeSubscriptions.length}
                  </p>
                  <p className="text-sm text-gray-400">Active</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    ${totalMonthlySavings.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-400">Monthly Savings</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">20%</p>
                  <p className="text-sm text-gray-400">Average Discount</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id} className="p-6 bg-white/5 border-white/10">
              <div className="flex items-start gap-4">
                <img
                  src={subscription.productImage}
                  alt={subscription.productName}
                  className="w-24 h-24 object-cover rounded-lg"
                />

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {subscription.productName}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Quantity: {subscription.quantity}
                      </p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="text-sm text-gray-400">Price</p>
                        <p className="text-foreground font-bold">${subscription.price}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-sm text-gray-400">Frequency</p>
                        <p className="text-foreground font-medium">Monthly</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-green-400" />
                      <div>
                        <p className="text-sm text-gray-400">Next Delivery</p>
                        <p className="text-foreground font-medium">
                          {new Date(subscription.nextDelivery).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handlePauseResume(subscription.id)}
                      size="sm"
                      variant="outline"
                      className="border-border text-muted-foreground"
                    >
                      {subscription.status === "active" ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border text-muted-foreground"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
