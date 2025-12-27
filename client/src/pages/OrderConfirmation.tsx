import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Package,
  Truck,
  Mail,
  ArrowRight,
  Download,
} from "lucide-react";

export default function OrderConfirmationPage() {
  const order = {
    id: "ORD-2024-001234",
    date: new Date().toLocaleDateString(),
    total: 329.97,
    estimatedDelivery: "Jan 25-27, 2024",
    trackingNumber: "1Z999AA10123456784",
    items: [
      {
        id: "1",
        name: "Premium Wireless Headphones",
        quantity: 1,
        price: 299.99,
        image: "/placeholder1.jpg",
      },
    ],
    shippingAddress: {
      name: "John Doe",
      address: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          <Card className="p-8 text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for your purchase. Your order has been confirmed and will be
              shipped soon.
            </p>
            <div className="flex items-center justify-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="text-xl font-bold">{order.id}</p>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div>
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="text-xl font-bold">{order.date}</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-6 text-center">
              <Mail className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-bold mb-1">Confirmation Email Sent</h3>
              <p className="text-sm text-muted-foreground">
                Check your inbox for order details
              </p>
            </Card>

            <Card className="p-6 text-center">
              <Package className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <h3 className="font-bold mb-1">Processing Order</h3>
              <p className="text-sm text-muted-foreground">
                We're preparing your items
              </p>
            </Card>

            <Card className="p-6 text-center">
              <Truck className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-bold mb-1">Estimated Delivery</h3>
              <p className="text-sm text-muted-foreground">
                {order.estimatedDelivery}
              </p>
            </Card>
          </div>

          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Order Details</h2>

            <div className="space-y-4 mb-6">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-20 h-20 bg-secondary rounded overflow-hidden flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity}
                    </p>
                    <p className="font-bold">${item.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">$299.99</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">$9.99</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">$19.99</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-bold">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
            <p className="font-medium">{order.shippingAddress.name}</p>
            <p className="text-muted-foreground">{order.shippingAddress.address}</p>
            <p className="text-muted-foreground">
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.zipCode}
            </p>
          </Card>

          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">Tracking Number</h2>
                <p className="text-muted-foreground font-mono">
                  {order.trackingNumber}
                </p>
              </div>
              <Badge className="bg-blue-500">In Transit</Badge>
            </div>
          </Card>

          <div className="flex gap-3">
            <Link href="/orders" className="flex-1">
              <Button variant="outline" className="w-full">
                View All Orders
              </Button>
            </Link>
            <Button className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
          </div>

          <div className="text-center mt-8">
            <Link href="/">
              <Button variant="link">
                Continue Shopping
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
