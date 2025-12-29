import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Package, Home } from "lucide-react";

/**
 * Checkout Success Page
 * Displayed after successful Stripe payment
 */

export default function CheckoutSuccessPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // Clear cart from localStorage after successful checkout
    if (typeof window !== "undefined") {
      localStorage.removeItem("cart");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-12 bg-white/5 border-white/10 text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-16 h-16 text-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Payment Successful!</h1>
          <p className="text-xl text-muted-foreground mb-2">
            Thank you for your purchase
          </p>
          {sessionId && (
            <p className="text-sm text-gray-400">
              Order ID: {sessionId.slice(-12)}
            </p>
          )}
        </div>

        <div className="bg-white/10 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <Package className="w-6 h-6" />
            <div className="text-left">
              <p className="font-medium text-foreground">What's Next?</p>
              <p className="text-sm">
                You'll receive an email confirmation shortly with your order details and tracking information.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/products">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Continue Shopping
            </Button>
          </Link>
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <p className="text-sm text-gray-400 mt-8">
          Need help? Contact our support team at support@liveshopping.network
        </p>
      </Card>
    </div>
  );
}
