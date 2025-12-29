import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Bell, Check, Mail } from "lucide-react";

interface ProductWaitlistProps {
  productId: string;
  productName: string;
  productImage: string;
}

/**
 * Product Waitlist Component
 * Allows customers to join waitlist for out-of-stock products
 * Sends email notification when product is back in stock
 */
export default function ProductWaitlist({
  productId,
  productName,
  productImage,
}: ProductWaitlistProps) {
  const [email, setEmail] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // In production, this would call an API endpoint
      // await trpc.products.joinWaitlist.mutate({ productId, email });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store in localStorage for demo
      const waitlist = JSON.parse(localStorage.getItem("productWaitlist") || "{}");
      if (!waitlist[productId]) {
        waitlist[productId] = [];
      }
      if (!waitlist[productId].includes(email)) {
        waitlist[productId].push(email);
        localStorage.setItem("productWaitlist", JSON.stringify(waitlist));
      }

      setIsJoined(true);
    } catch (err) {
      setError("Failed to join waitlist. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isJoined) {
    return (
      <Card className="p-6 bg-green-500/10 border-green-500/30">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-500/20 rounded-full">
            <Check className="w-6 h-6 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              You're on the waitlist!
            </h3>
            <p className="text-muted-foreground mb-4">
              We'll send you an email at <strong>{email}</strong> as soon as{" "}
              <strong>{productName}</strong> is back in stock.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Mail className="w-4 h-4" />
              <span>Check your inbox for confirmation</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <div className="flex items-start gap-4 mb-4">
        <img
          src={productImage}
          alt={productName}
          className="w-20 h-20 object-cover rounded-lg"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-foreground">
              Join Waitlist
            </h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Get notified when <strong>{productName}</strong> is back in stock
          </p>
        </div>
      </div>

      <form onSubmit={handleJoinWaitlist} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/10 border-white/20 text-foreground placeholder-gray-400"
            required
          />
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-red-600 hover:bg-red-700"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Joining...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notify Me
            </span>
          )}
        </Button>

        <p className="text-xs text-gray-400 text-center">
          We'll only email you about this product. No spam, promise! 🎉
        </p>
      </form>
    </Card>
  );
}
