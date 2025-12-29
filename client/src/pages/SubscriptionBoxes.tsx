import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, Check, X, Calendar, DollarSign, Gift } from "lucide-react";
import { toast } from "sonner";

/**
 * Subscription Boxes Customer Page
 * Browse and subscribe to curated product boxes
 */

export default function SubscriptionBoxesPage() {
  const [selectedBox, setSelectedBox] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<string>("monthly");
  const [isSubscribeDialogOpen, setIsSubscribeDialogOpen] = useState(false);

  const boxes = [
    {
      id: "tech-essentials",
      name: "Tech Essentials Box",
      description: "Monthly curated tech accessories and gadgets",
      price: { monthly: 49.99, quarterly: 44.99, annual: 39.99 },
      category: "electronics",
      features: [
        "3-5 tech products monthly",
        "Total value $80-$120",
        "Free shipping",
        "Cancel anytime",
      ],
      productsPerBox: 4,
      customizable: true,
      imageUrl: "/boxes/tech-essentials.jpg",
      savings: { quarterly: 10, annual: 20 },
    },
    {
      id: "fitness-boost",
      name: "Fitness Boost Box",
      description: "Quarterly fitness gear and supplements",
      price: { monthly: 89.99, quarterly: 79.99, annual: 69.99 },
      category: "fitness",
      features: [
        "5-7 fitness products",
        "Workout guides included",
        "Nutrition supplements",
        "Total value $150+",
      ],
      productsPerBox: 6,
      customizable: true,
      imageUrl: "/boxes/fitness-boost.jpg",
      savings: { quarterly: 11, annual: 22 },
    },
    {
      id: "home-living",
      name: "Home & Living Box",
      description: "Monthly home essentials and decor",
      price: { monthly: 39.99, quarterly: 35.99, annual: 31.99 },
      category: "home",
      features: [
        "4-6 home products",
        "Seasonal themes",
        "Eco-friendly options",
        "Total value $70+",
      ],
      productsPerBox: 5,
      customizable: false,
      imageUrl: "/boxes/home-living.jpg",
      savings: { quarterly: 10, annual: 20 },
    },
    {
      id: "beauty-essentials",
      name: "Beauty Essentials Box",
      description: "Monthly beauty and skincare products",
      price: { monthly: 59.99, quarterly: 53.99, annual: 47.99 },
      category: "beauty",
      features: [
        "5-7 beauty products",
        "Full-size and deluxe samples",
        "Cruelty-free brands",
        "Total value $100+",
      ],
      productsPerBox: 6,
      customizable: true,
      imageUrl: "/boxes/beauty-essentials.jpg",
      savings: { quarterly: 10, annual: 20 },
    },
  ];

  const handleSubscribe = () => {
    if (!selectedBox) return;
    const box = boxes.find((b) => b.id === selectedBox);
    toast.success(`Subscribed to ${box?.name}!`);
    setIsSubscribeDialogOpen(false);
  };

  const getPriceForCycle = (box: typeof boxes[0], cycle: string) => {
    if (cycle === "monthly") return box.price.monthly;
    if (cycle === "quarterly") return box.price.quarterly;
    return box.price.annual;
  };

  const getSavingsForCycle = (box: typeof boxes[0], cycle: string) => {
    if (cycle === "quarterly") return box.savings.quarterly;
    if (cycle === "annual") return box.savings.annual;
    return 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-red-900 to-pink-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            <Package className="inline w-12 h-12 mr-4" />
            Subscription Boxes
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get curated products delivered to your door every month. Discover new favorites and save money!
          </p>
        </div>

        {/* How It Works */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto">
          {[
            {
              step: 1,
              title: "Choose Your Box",
              description: "Select from our curated subscription boxes",
            },
            {
              step: 2,
              title: "Customize Preferences",
              description: "Tell us what you love and what to avoid",
            },
            {
              step: 3,
              title: "Get Monthly Surprises",
              description: "Receive hand-picked products every month",
            },
          ].map((item) => (
            <Card key={item.step} className="bg-background text-foreground/10 border-white/20 backdrop-blur-xl">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-foreground text-2xl font-bold">{item.step}</span>
                </div>
                <h3 className="text-foreground font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Subscription Boxes */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {boxes.map((box) => (
            <Card key={box.id} className="bg-background text-foreground/10 border-white/20 backdrop-blur-xl overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
                <Package className="w-24 h-24 text-white/80" />
              </div>

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-foreground text-2xl mb-2">{box.name}</CardTitle>
                    <p className="text-muted-foreground">{box.description}</p>
                  </div>
                  {box.customizable && (
                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
                      Customizable
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features */}
                <div className="space-y-2">
                  {box.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="border-t border-white/20 pt-4">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: "Monthly", value: "monthly" },
                      { label: "Quarterly", value: "quarterly", save: box.savings.quarterly },
                      { label: "Annual", value: "annual", save: box.savings.annual },
                    ].map((cycle) => (
                      <button
                        key={cycle.value}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedCycle === cycle.value && selectedBox === box.id
                            ? "border-red-500 bg-red-500/20"
                            : "border-white/20 bg-background text-foreground/5 hover:bg-background text-foreground/10"
                        }`}
                        onClick={() => {
                          setSelectedBox(box.id);
                          setSelectedCycle(cycle.value);
                        }}
                      >
                        <p className="text-foreground font-medium text-sm">{cycle.label}</p>
                        <p className="text-foreground text-lg font-bold">
                          ${getPriceForCycle(box, cycle.value)}
                        </p>
                        {cycle.save && (
                          <Badge className="mt-1 bg-green-500/20 text-green-300 text-xs">
                            Save {cycle.save}%
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>

                  <Dialog open={isSubscribeDialogOpen && selectedBox === box.id} onOpenChange={setIsSubscribeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-pink-700"
                        onClick={() => setSelectedBox(box.id)}
                      >
                        Subscribe Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Customize Your Subscription</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-6">
                        {/* Selected Plan */}
                        <div className="bg-accent rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-lg">{box.name}</p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {selectedCycle} billing
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">
                                ${getPriceForCycle(box, selectedCycle)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                per {selectedCycle === "monthly" ? "month" : selectedCycle === "quarterly" ? "quarter" : "year"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Customization Options */}
                        {box.customizable && (
                          <div className="space-y-4">
                            <div>
                              <Label className="text-base mb-3 block">Product Preferences</Label>
                              <div className="space-y-2">
                                {[
                                  "Latest tech gadgets",
                                  "Smart home devices",
                                  "Mobile accessories",
                                  "Audio equipment",
                                  "Charging solutions",
                                ].map((pref) => (
                                  <div key={pref} className="flex items-center gap-2">
                                    <Checkbox id={pref} />
                                    <Label htmlFor={pref} className="cursor-pointer">
                                      {pref}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <Label className="text-base mb-2 block">Exclude Products</Label>
                              <Textarea
                                placeholder="Tell us what you don't want to receive..."
                                rows={3}
                              />
                            </div>

                            <div>
                              <Label className="text-base mb-2 block">Special Notes</Label>
                              <Textarea
                                placeholder="Any special requests or preferences..."
                                rows={2}
                              />
                            </div>
                          </div>
                        )}

                        {/* Subscription Benefits */}
                        <div className="border rounded-lg p-4 space-y-2">
                          <p className="font-medium mb-2">Subscription Benefits:</p>
                          {[
                            "Free shipping on all boxes",
                            "Cancel or pause anytime",
                            "Skip a month if needed",
                            "Exclusive subscriber discounts",
                            "Early access to new products",
                          ].map((benefit) => (
                            <div key={benefit} className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-600" />
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setIsSubscribeDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="flex-1 bg-gradient-to-r from-red-600 to-orange-600"
                            onClick={handleSubscribe}
                          >
                            Confirm Subscription
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-8">
            Subscription FAQ
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Can I cancel my subscription anytime?",
                a: "Yes! You can cancel or pause your subscription at any time with no penalties or fees.",
              },
              {
                q: "When will I be charged?",
                a: "Your card will be charged on the same day each billing cycle. You'll receive an email notification before each charge.",
              },
              {
                q: "Can I skip a month?",
                a: "Absolutely! You can skip any month by updating your preferences at least 5 days before your next billing date.",
              },
              {
                q: "What if I don't like a product?",
                a: "We offer a satisfaction guarantee. Contact us within 14 days and we'll make it right with a refund or replacement.",
              },
            ].map((faq, idx) => (
              <Card key={idx} className="bg-background text-foreground/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4">
                  <p className="text-foreground font-medium mb-2">{faq.q}</p>
                  <p className="text-gray-400 text-sm">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
