import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GitCompare,
  Star,
  ShoppingCart,
  TrendingUp,
  Check,
  X,
  Plus,
} from "lucide-react";

export default function ProductComparePage() {
  const products = [
    {
      id: "PROD-001",
      name: "Wireless Headphones Pro",
      price: 299.99,
      rating: 4.5,
      reviews: 234,
      features: {
        "Battery Life": "30 hours",
        "Noise Cancellation": "Active",
        "Bluetooth": "5.2",
        "Weight": "250g",
        "Water Resistance": "IPX4",
        "Warranty": "2 years",
      },
      priceHistory: [299, 289, 299, 279, 299],
    },
    {
      id: "PROD-002",
      name: "Smart Watch Ultra",
      price: 399.99,
      rating: 4.7,
      reviews: 456,
      features: {
        "Battery Life": "48 hours",
        "Noise Cancellation": "None",
        "Bluetooth": "5.3",
        "Weight": "45g",
        "Water Resistance": "IP68",
        "Warranty": "1 year",
      },
      priceHistory: [399, 389, 399, 379, 399],
    },
    {
      id: "PROD-003",
      name: "Bluetooth Speaker",
      price: 79.99,
      rating: 4.3,
      reviews: 189,
      features: {
        "Battery Life": "12 hours",
        "Noise Cancellation": "None",
        "Bluetooth": "5.0",
        "Weight": "500g",
        "Water Resistance": "IPX7",
        "Warranty": "1 year",
      },
      priceHistory: [79, 69, 79, 74, 79],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b bg-card text-card-foreground">
        <div className="container py-6">
          <div className="flex items-center gap-3 mb-2">
            <GitCompare className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold">Product Comparison</h1>
          </div>
          <p className="text-muted-foreground">
            Compare features, prices, and reviews side-by-side
          </p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="p-6">
              {/* Product Header */}
              <div className="mb-6">
                <div className="w-full h-48 bg-secondary rounded-lg mb-4" />
                <h3 className="font-bold text-xl mb-2">{product.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(product.rating)
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-gray-400"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>
                <p className="text-3xl font-bold text-primary">${product.price}</p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {Object.entries(product.features).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>

              {/* Price History Mini Chart */}
              <div className="mb-6">
                <p className="text-sm font-medium mb-2">30-Day Price Trend</p>
                <div className="flex items-end gap-1 h-16">
                  {product.priceHistory.map((price, index) => {
                    const maxPrice = Math.max(...product.priceHistory);
                    const height = (price / maxPrice) * 100;
                    return (
                      <div
                        key={index}
                        className="flex-1 bg-blue-500 rounded-t"
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <Button className="w-full" size="lg">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
            </Card>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <Card className="p-6 mt-8">
          <h2 className="text-2xl font-bold mb-6">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-bold">Feature</th>
                  {products.map((product) => (
                    <th key={product.id} className="text-center p-4 font-bold">
                      {product.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(products[0].features).map((feature) => (
                  <tr key={feature} className="border-b">
                    <td className="p-4 font-medium text-muted-foreground">{feature}</td>
                    {products.map((product) => (
                      <td key={product.id} className="text-center p-4">
                        {product.features[feature as keyof typeof product.features]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
