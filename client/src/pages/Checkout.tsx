import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import {
  CreditCard,
  MapPin,
  Package,
  Check,
  ChevronRight,
  Lock,
} from "lucide-react";

export default function CheckoutPage() {
  const { items } = useCart();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleContinueToPayment = () => {
    setStep(2);
  };

  const handlePlaceOrder = () => {
    setLocation("/order-confirmation");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">Checkout</h1>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1 ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}
              >
                {step > 1 ? <Check className="w-5 h-5" /> : "1"}
              </div>
              <span className="font-medium">Shipping</span>
            </div>

            <ChevronRight className="w-5 h-5 text-muted-foreground" />

            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2 ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}
              >
                {step > 2 ? <Check className="w-5 h-5" /> : "2"}
              </div>
              <span className="font-medium">Payment</span>
            </div>

            <ChevronRight className="w-5 h-5 text-muted-foreground" />

            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 3 ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}
              >
                3
              </div>
              <span className="font-medium">Review</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 1 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <h2 className="text-xl font-bold">Shipping Information</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Full Name
                      </label>
                      <Input
                        value={shippingInfo.fullName}
                        onChange={(e) =>
                          setShippingInfo({ ...shippingInfo, fullName: e.target.value })
                        }
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Email</label>
                      <Input
                        type="email"
                        value={shippingInfo.email}
                        onChange={(e) =>
                          setShippingInfo({ ...shippingInfo, email: e.target.value })
                        }
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Address</label>
                    <Input
                      value={shippingInfo.address}
                      onChange={(e) =>
                        setShippingInfo({ ...shippingInfo, address: e.target.value })
                      }
                      placeholder="123 Main St"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">City</label>
                      <Input
                        value={shippingInfo.city}
                        onChange={(e) =>
                          setShippingInfo({ ...shippingInfo, city: e.target.value })
                        }
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">State</label>
                      <Input
                        value={shippingInfo.state}
                        onChange={(e) =>
                          setShippingInfo({ ...shippingInfo, state: e.target.value })
                        }
                        placeholder="NY"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        ZIP Code
                      </label>
                      <Input
                        value={shippingInfo.zipCode}
                        onChange={(e) =>
                          setShippingInfo({ ...shippingInfo, zipCode: e.target.value })
                        }
                        placeholder="10001"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Phone</label>
                    <Input
                      type="tel"
                      value={shippingInfo.phone}
                      onChange={(e) =>
                        setShippingInfo({ ...shippingInfo, phone: e.target.value })
                      }
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleContinueToPayment}
                  >
                    Continue to Payment
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </Card>
            )}

            {step === 2 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="w-5 h-5 text-green-500" />
                  <h2 className="text-xl font-bold">Payment Information</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Card Number
                    </label>
                    <Input placeholder="1234 5678 9012 3456" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Expiry Date
                      </label>
                      <Input placeholder="MM/YY" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">CVV</label>
                      <Input placeholder="123" type="password" maxLength={3} />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Cardholder Name
                    </label>
                    <Input placeholder="John Doe" />
                  </div>

                  <div className="flex items-center gap-2 p-4 bg-secondary rounded-lg">
                    <Lock className="w-5 h-5 text-green-500" />
                    <p className="text-sm">
                      Your payment information is encrypted and secure
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button className="flex-1" size="lg" onClick={handlePlaceOrder}>
                      Place Order ${total.toFixed(2)}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div>
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-secondary rounded overflow-hidden flex-shrink-0">
                      <img
                        src={item.image || "/placeholder.jpg"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      <p className="text-sm font-bold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
