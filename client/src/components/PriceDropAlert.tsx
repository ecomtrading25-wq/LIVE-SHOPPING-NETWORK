import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Bell, Check, DollarSign } from "lucide-react";

interface PriceDropAlertProps {
  productId: string;
  productName: string;
  currentPrice: number;
  productImage: string;
}

/**
 * Price Drop Alert Component
 * Allows customers to set price alerts for wishlisted products
 * Notifies when product price drops below target
 */
export default function PriceDropAlert({
  productId,
  productName,
  currentPrice,
  productImage,
}: PriceDropAlertProps) {
  const [targetPrice, setTargetPrice] = useState("");
  const [email, setEmail] = useState("");
  const [isSet, setIsSet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSetAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const price = parseFloat(targetPrice);

    // Validate target price
    if (isNaN(price) || price <= 0) {
      setError("Please enter a valid price");
      return;
    }

    if (price >= currentPrice) {
      setError(`Target price must be lower than current price ($${currentPrice})`);
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // In production, this would call an API endpoint
      // await trpc.products.setPriceAlert.mutate({ productId, targetPrice: price, email });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store in localStorage for demo
      const alerts = JSON.parse(localStorage.getItem("priceAlerts") || "{}");
      alerts[productId] = {
        targetPrice: price,
        email,
        currentPrice,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("priceAlerts", JSON.stringify(alerts));

      setIsSet(true);
    } catch (err) {
      setError("Failed to set price alert. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const savingsPercent = targetPrice
    ? Math.round(((currentPrice - parseFloat(targetPrice)) / currentPrice) * 100)
    : 0;

  if (isSet) {
    return (
      <Card className="p-6 bg-green-500/10 border-green-500/30">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-500/20 rounded-full">
            <Check className="w-6 h-6 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">
              Price Alert Set! 🎉
            </h3>
            <p className="text-gray-300 mb-4">
              We'll email you at <strong>{email}</strong> when{" "}
              <strong>{productName}</strong> drops to <strong>${targetPrice}</strong> or lower.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Badge className="bg-purple-500/20 text-purple-400">
                <DollarSign className="w-3 h-3 mr-1" />
                Current: ${currentPrice}
              </Badge>
              <Badge className="bg-green-500/20 text-green-400">
                <TrendingDown className="w-3 h-3 mr-1" />
                Target: ${targetPrice}
              </Badge>
              {savingsPercent > 0 && (
                <Badge className="bg-blue-500/20 text-blue-400">
                  Save {savingsPercent}%
                </Badge>
              )}
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
            <TrendingDown className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">
              Set Price Alert
            </h3>
          </div>
          <p className="text-gray-300 text-sm mb-2">
            Get notified when <strong>{productName}</strong> drops to your target price
          </p>
          <Badge className="bg-purple-500/20 text-purple-400">
            <DollarSign className="w-3 h-3 mr-1" />
            Current Price: ${currentPrice}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSetAlert} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Target Price
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="number"
              step="0.01"
              placeholder="Enter target price"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
              required
            />
          </div>
          {targetPrice && parseFloat(targetPrice) < currentPrice && (
            <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              You'll save ${(currentPrice - parseFloat(targetPrice)).toFixed(2)} ({savingsPercent}%)
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder-gray-400"
            required
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Setting Alert...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Set Price Alert
            </span>
          )}
        </Button>

        <p className="text-xs text-gray-400 text-center">
          We'll monitor the price and notify you immediately when it drops! 📉
        </p>
      </form>
    </Card>
  );
}
