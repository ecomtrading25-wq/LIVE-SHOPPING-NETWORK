import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Home,
  ArrowLeft,
} from "lucide-react";

/**
 * Order Tracking Page
 * Track order and shipment status
 */

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;

  const { data: order, isLoading } = trpc.orders.get.useQuery({ id: orderId });
  const { data: items } = trpc.orders.items.useQuery({ orderId });

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      pending: Clock,
      processing: Package,
      shipped: Truck,
      delivered: CheckCircle,
      cancelled: Package,
    };
    return icons[status] || Package;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "text-yellow-600 bg-yellow-100",
      processing: "text-blue-600 bg-blue-100",
      shipped: "text-purple-600 bg-purple-100",
      delivered: "text-green-600 bg-green-100",
      cancelled: "text-red-600 bg-red-100",
    };
    return colors[status] || "text-gray-600 bg-gray-100";
  };

  const trackingSteps = [
    { id: "pending", label: "Order Placed", icon: CheckCircle },
    { id: "processing", label: "Processing", icon: Package },
    { id: "shipped", label: "Shipped", icon: Truck },
    { id: "delivered", label: "Delivered", icon: CheckCircle },
  ];

  const getCurrentStep = (status: string) => {
    const stepMap: Record<string, number> = {
      pending: 0,
      processing: 1,
      shipped: 2,
      delivered: 3,
      cancelled: -1,
    };
    return stepMap[status] ?? 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-foreground text-xl">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 bg-white/5 border-white/10 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-4">Order Not Found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't find the order you're looking for
          </p>
          <Link href="/account">
            <Button className="bg-purple-600 hover:bg-purple-700">
              View All Orders
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const currentStep = getCurrentStep(order.status);
  const StatusIcon = getStatusIcon(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      {/* Header */}
      <header className="bg-background/30 border-b border-white/10 backdrop-blur-sm sticky top-0 z-10 text-foreground">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="text-2xl font-bold text-foreground hover:text-purple-400 transition-colors">
                Live Shopping Network
              </a>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/account">
                <Button variant="outline">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Orders
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline">
                  <Home className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Order Header */}
          <Card className="p-6 bg-white/5 border-white/10 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Order #{order.orderNumber}
                </h1>
                <p className="text-gray-400">
                  Placed on {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <Badge className={getStatusColor(order.status)}>
                <StatusIcon className="w-4 h-4 mr-2" />
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-sm text-gray-400">Subtotal</p>
                <p className="text-lg font-semibold text-foreground">
                  ${parseFloat(order.subtotal).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Shipping</p>
                <p className="text-lg font-semibold text-foreground">
                  ${parseFloat(order.shipping || "0").toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-lg font-semibold text-foreground">
                  ${parseFloat(order.total).toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          {/* Tracking Timeline */}
          {order.status !== "cancelled" && (
            <Card className="p-6 bg-white/5 border-white/10 mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">Order Status</h2>
              <div className="relative">
                <div className="absolute top-6 left-0 right-0 h-1 bg-white/10"></div>
                <div
                  className="absolute top-6 left-0 h-1 bg-purple-600 transition-all duration-500"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                ></div>

                <div className="relative flex justify-between">
                  {trackingSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;

                    return (
                      <div key={step.id} className="flex flex-col items-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                            isCompleted
                              ? "bg-purple-600 text-foreground"
                              : "bg-white/10 text-gray-400"
                          } ${isCurrent ? "ring-4 ring-purple-400" : ""}`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <p className={`text-sm ${isCompleted ? "text-foreground" : "text-gray-400"}`}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* Shipping Address */}
          <Card className="p-6 bg-white/5 border-white/10 mb-6">
            <div className="flex items-start gap-4">
              <MapPin className="w-6 h-6 text-purple-400 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Shipping Address</h3>
                <div className="text-muted-foreground">
                  {order.shippingAddress && typeof order.shippingAddress === "object" ? (
                    <>
                      <p>{(order.shippingAddress as any).name}</p>
                      <p>{(order.shippingAddress as any).street}</p>
                      <p>
                        {(order.shippingAddress as any).city},{" "}
                        {(order.shippingAddress as any).state}{" "}
                        {(order.shippingAddress as any).zip}
                      </p>
                      <p>{(order.shippingAddress as any).country}</p>
                    </>
                  ) : (
                    <p className="text-gray-400">Address not available</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Order Items */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="text-lg font-semibold text-foreground mb-4">Order Items</h3>
            <div className="space-y-4">
              {items && items.length > 0 ? (
                items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-4 border-b border-white/10 last:border-0">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-sm text-gray-400">SKU: {item.sku}</p>
                      <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        ${parseFloat(item.total).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-400">
                        ${parseFloat(item.price).toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No items found</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
