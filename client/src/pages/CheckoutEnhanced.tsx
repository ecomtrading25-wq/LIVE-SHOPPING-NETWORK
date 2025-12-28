import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, CreditCard, MapPin, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

export default function CheckoutEnhanced() {
  const { data: cart, isLoading } = trpc.cart.get.useQuery();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="container max-w-4xl">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="container max-w-2xl text-center">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <ShoppingBag className="h-24 w-24 text-slate-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-slate-600 mb-8">Add items to your cart before checking out</p>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const price = parseFloat(item.product.price);
    const quantity = item.cartItem.quantity;
    return sum + price * quantity;
  }, 0);

  const tax = subtotal * 0.1;
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = subtotal + tax + shipping;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      <div className="container max-w-6xl">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={shippingAddress.name}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, name: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="line1">Address Line 1</Label>
                  <Input
                    id="line1"
                    value={shippingAddress.line1}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, line1: e.target.value })
                    }
                    placeholder="123 Main St"
                  />
                </div>
                <div>
                  <Label htmlFor="line2">Address Line 2 (Optional)</Label>
                  <Input
                    id="line2"
                    value={shippingAddress.line2}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, line2: e.target.value })
                    }
                    placeholder="Apt 4B"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, city: e.target.value })
                      }
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, state: e.target.value })
                      }
                      placeholder="NY"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={shippingAddress.postalCode}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                      }
                      placeholder="10001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={shippingAddress.country}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, country: e.target.value })
                      }
                      placeholder="US"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            {clientSecret ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm orderId={orderId!} />
                  </Elements>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CreatePaymentButton
                    shippingAddress={shippingAddress}
                    onSuccess={(secret, orderId) => {
                      setClientSecret(secret);
                      setOrderId(orderId);
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item.cartItem.id} className="flex gap-3">
                      <div className="relative w-16 h-16 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden">
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ShoppingBag className="h-6 w-6" />
                          </div>
                        )}
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                          {item.cartItem.quantity}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-2">{item.product.name}</p>
                        <p className="text-sm text-slate-600">
                          ${parseFloat(item.product.price).toFixed(2)} × {item.cartItem.quantity}
                        </p>
                      </div>
                      <div className="font-medium">
                        ${(parseFloat(item.product.price) * item.cartItem.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tax (10%)</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? (
                        <Badge variant="secondary">FREE</Badge>
                      ) : (
                        `$${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-indigo-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreatePaymentButton({
  shippingAddress,
  onSuccess,
}: {
  shippingAddress: any;
  onSuccess: (clientSecret: string, orderId: string) => void;
}) {
  const { toast } = useToast();

  const createSession = trpc.checkout.createSession.useMutation({
    onSuccess: (data) => {
      onSuccess(data.clientSecret!, data.orderId);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateSession = () => {
    if (!shippingAddress.name || !shippingAddress.line1 || !shippingAddress.city) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required shipping address fields",
        variant: "destructive",
      });
      return;
    }

    createSession.mutate({
      channelId: "default-channel",
      shippingAddress,
    });
  };

  return (
    <Button
      size="lg"
      className="w-full"
      onClick={handleCreateSession}
      disabled={createSession.isPending}
    >
      {createSession.isPending ? "Creating Order..." : "Continue to Payment"}
    </Button>
  );
}

function CheckoutForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const confirmPayment = trpc.orders.confirmPayment.useMutation({
    onSuccess: () => {
      setLocation(`/order-confirmation-enhanced/${orderId}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation/${orderId}`,
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    } else {
      await confirmPayment.mutateAsync({ orderId });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        size="lg"
        className="w-full gap-2"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          "Processing..."
        ) : (
          <>
            <Check className="h-5 w-5" />
            Complete Order
          </>
        )}
      </Button>
    </form>
  );
}
