import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Truck, Plane, Ship, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ShippingRate {
  carrier: "USPS" | "UPS" | "FedEx" | "DHL";
  service: string;
  rate: number;
  estimatedDays: number;
  estimatedDelivery: string;
  features: string[];
}

interface ShippingRateComparisonProps {
  items: Array<{
    productId: string;
    quantity: number;
    weight: number;
  }>;
  destination: {
    country: string;
    state: string;
    zipCode: string;
  };
  onSelectRate: (rate: ShippingRate) => void;
  selectedRate?: ShippingRate;
}

export default function ShippingRateComparison({
  items,
  destination,
  onSelectRate,
  selectedRate,
}: ShippingRateComparisonProps) {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock shipping rates - in production, this would call actual carrier APIs
  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const totalWeight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0);
      const isInternational = destination.country !== "US";

      const mockRates: ShippingRate[] = [];

      // USPS rates
      if (!isInternational) {
        mockRates.push({
          carrier: "USPS",
          service: "Priority Mail",
          rate: 8.95 + totalWeight * 0.5,
          estimatedDays: 3,
          estimatedDelivery: getEstimatedDelivery(3),
          features: ["Tracking included", "Free insurance up to $50"],
        });
        mockRates.push({
          carrier: "USPS",
          service: "Priority Mail Express",
          rate: 24.95 + totalWeight * 0.8,
          estimatedDays: 1,
          estimatedDelivery: getEstimatedDelivery(1),
          features: ["Overnight delivery", "Tracking included", "Insurance up to $100"],
        });
      }

      // UPS rates
      mockRates.push({
        carrier: "UPS",
        service: "UPS Ground",
        rate: 12.50 + totalWeight * 0.6,
        estimatedDays: 5,
        estimatedDelivery: getEstimatedDelivery(5),
        features: ["Tracking included", "Signature on delivery"],
      });
      mockRates.push({
        carrier: "UPS",
        service: "UPS 2nd Day Air",
        rate: 28.00 + totalWeight * 1.2,
        estimatedDays: 2,
        estimatedDelivery: getEstimatedDelivery(2),
        features: ["2-day delivery", "Tracking included", "Insurance up to $100"],
      });
      mockRates.push({
        carrier: "UPS",
        service: "UPS Next Day Air",
        rate: 45.00 + totalWeight * 2.0,
        estimatedDays: 1,
        estimatedDelivery: getEstimatedDelivery(1),
        features: ["Next-day delivery", "Tracking included", "Insurance up to $100"],
      });

      // FedEx rates
      mockRates.push({
        carrier: "FedEx",
        service: "FedEx Ground",
        rate: 11.95 + totalWeight * 0.55,
        estimatedDays: 5,
        estimatedDelivery: getEstimatedDelivery(5),
        features: ["Tracking included", "Money-back guarantee"],
      });
      mockRates.push({
        carrier: "FedEx",
        service: "FedEx 2Day",
        rate: 27.50 + totalWeight * 1.1,
        estimatedDays: 2,
        estimatedDelivery: getEstimatedDelivery(2),
        features: ["2-day delivery", "Tracking included", "Insurance included"],
      });
      mockRates.push({
        carrier: "FedEx",
        service: "FedEx Priority Overnight",
        rate: 48.00 + totalWeight * 2.2,
        estimatedDays: 1,
        estimatedDelivery: getEstimatedDelivery(1),
        features: ["Next-day by 10:30 AM", "Tracking included", "Insurance included"],
      });

      // DHL rates (international)
      if (isInternational) {
        mockRates.push({
          carrier: "DHL",
          service: "DHL Express Worldwide",
          rate: 65.00 + totalWeight * 3.5,
          estimatedDays: 3,
          estimatedDelivery: getEstimatedDelivery(3),
          features: ["International shipping", "Customs clearance", "Tracking included"],
        });
        mockRates.push({
          carrier: "DHL",
          service: "DHL Express 12:00",
          rate: 95.00 + totalWeight * 5.0,
          estimatedDays: 2,
          estimatedDelivery: getEstimatedDelivery(2),
          features: ["Delivery by noon", "Customs clearance", "Priority handling"],
        });
      }

      // Sort by price (lowest first)
      mockRates.sort((a, b) => a.rate - b.rate);

      setRates(mockRates);
      setLoading(false);

      // Auto-select cheapest option
      if (mockRates.length > 0 && !selectedRate) {
        onSelectRate(mockRates[0]);
      }
    };

    fetchRates();
  }, [items, destination]);

  const getEstimatedDelivery = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const getCarrierIcon = (carrier: string) => {
    switch (carrier) {
      case "USPS":
        return <Package className="w-5 h-5" />;
      case "UPS":
        return <Truck className="w-5 h-5" />;
      case "FedEx":
        return <Plane className="w-5 h-5" />;
      case "DHL":
        return <Ship className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getCarrierColor = (carrier: string) => {
    switch (carrier) {
      case "USPS":
        return "bg-blue-500";
      case "UPS":
        return "bg-yellow-600";
      case "FedEx":
        return "bg-purple-600";
      case "DHL":
        return "bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Shipping Options</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="ml-3 text-muted-foreground">
            Comparing rates from 4 carriers...
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Shipping Options</h3>
        <Badge variant="outline">{rates.length} options available</Badge>
      </div>

      <div className="space-y-3">
        {rates.map((rate, index) => {
          const isSelected =
            selectedRate?.carrier === rate.carrier &&
            selectedRate?.service === rate.service;
          const isCheapest = index === 0;
          const isFastest = rate.estimatedDays === Math.min(...rates.map((r) => r.estimatedDays));

          return (
            <div
              key={`${rate.carrier}-${rate.service}`}
              onClick={() => onSelectRate(rate)}
              className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                isSelected
                  ? "border-purple-600 bg-purple-50 dark:bg-purple-950/20"
                  : "border-gray-200 hover:border-purple-300 dark:border-border dark:hover:border-purple-700"
              }`}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-foreground" />
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                {/* Carrier icon */}
                <div className={`w-12 h-12 ${getCarrierColor(rate.carrier)} rounded-lg flex items-center justify-center text-foreground flex-shrink-0`}>
                  {getCarrierIcon(rate.carrier)}
                </div>

                {/* Rate details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{rate.carrier}</h4>
                        {isCheapest && (
                          <Badge className="bg-green-600 text-xs">Cheapest</Badge>
                        )}
                        {isFastest && (
                          <Badge className="bg-blue-600 text-xs">Fastest</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{rate.service}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">${rate.rate.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <span>Estimated delivery:</span>
                    <span className="font-medium text-foreground">
                      {rate.estimatedDelivery} ({rate.estimatedDays} {rate.estimatedDays === 1 ? "day" : "days"})
                    </span>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {rate.features.map((feature, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Savings indicator */}
      {rates.length > 1 && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-400">
            💰 Save ${(rates[rates.length - 1].rate - rates[0].rate).toFixed(2)} by choosing the cheapest option
          </p>
        </div>
      )}
    </Card>
  );
}
