import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Package, MapPin, CreditCard, Download } from "lucide-react";
import { Link, useRoute } from "wouter";

export default function OrderConfirmationEnhanced() {
  const [, params] = useRoute("/order-confirmation-enhanced/:orderId");
  const orderId = params?.orderId;

  const { data: order, isLoading } = trpc.orders.get.useQuery(
    { id: orderId! },
    { enabled: !!orderId }
  );

  useEffect(() => {
    if (order) {
      // Confetti or celebration animation can be added here
      console.log("Order confirmed:", order);
    }
  }, [order]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground py-12">
        <div className="container max-w-4xl">
          <Skeleton className="h-24 w-full mb-8" />
          <div className="space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background text-foreground py-12">
        <div className="container max-w-2xl text-center">
          <div className="bg-background text-foreground rounded-2xl shadow-lg p-12">
            <h1 className="text-3xl font-bold mb-4">Order not found</h1>
            <p className="text-slate-600 mb-8">
              We couldn't find the order you're looking for
            </p>
            <Link href="/">
              <Button size="lg">Go to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="container max-w-4xl">
        {/* Success Banner */}
        <Card className="mb-8 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="py-8">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-foreground" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-green-900 mb-2">
                  Order Confirmed!
                </h1>
                <p className="text-lg text-green-700">
                  Thank you for your purchase. Your order has been received and is being processed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-slate-600">Order Number</div>
                <div className="font-mono font-semibold text-lg">{order.orderNumber}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Order Date</div>
                <div className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Status</div>
                <Badge
                  variant={
                    order.status === "processing"
                      ? "default"
                      : order.status === "shipped"
                      ? "secondary"
                      : "outline"
                  }
                  className="mt-1"
                >
                  {order.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-slate-600">Payment Status</div>
                <Badge
                  variant={order.paymentStatus === "paid" ? "default" : "outline"}
                  className="mt-1"
                >
                  {order.paymentStatus.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.shippingAddress ? (
                <div className="space-y-1">
                  <div className="font-medium">{order.customerName}</div>
                  <div className="text-slate-600">
                    {(order.shippingAddress as any).line1}
                  </div>
                  {(order.shippingAddress as any).line2 && (
                    <div className="text-slate-600">
                      {(order.shippingAddress as any).line2}
                    </div>
                  )}
                  <div className="text-slate-600">
                    {(order.shippingAddress as any).city},{" "}
                    {(order.shippingAddress as any).state}{" "}
                    {(order.shippingAddress as any).postalCode}
                  </div>
                  <div className="text-slate-600">
                    {(order.shippingAddress as any).country}
                  </div>
                </div>
              ) : (
                <p className="text-slate-600">No shipping address provided</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                  <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Package className="h-8 w-8 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{item.name}</h3>
                    <p className="text-sm text-slate-600">SKU: {item.sku}</p>
                    <p className="text-sm text-slate-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ${parseFloat(item.subtotal || "0").toFixed(2)}
                    </div>
                    <div className="text-sm text-slate-600">
                      ${parseFloat(item.price).toFixed(2)} each
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t mt-6 pt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">${parseFloat(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tax</span>
                <span className="font-medium">${parseFloat(order.tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Shipping</span>
                <span className="font-medium">${parseFloat(order.shipping).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-green-600">${parseFloat(order.total).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={`/orders/${order.id}`} className="flex-1">
                <Button variant="outline" size="lg" className="w-full gap-2">
                  <Package className="h-5 w-5" />
                  Track Order
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="flex-1 gap-2">
                <Download className="h-5 w-5" />
                Download Receipt
              </Button>
              <Link href="/products-enhanced" className="flex-1">
                <Button size="lg" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Email Confirmation Notice */}
        <div className="mt-6 text-center text-slate-600">
          <p>
            A confirmation email has been sent to{" "}
            <span className="font-medium text-slate-900">{order.customerEmail}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
