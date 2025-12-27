import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Globe,
  DollarSign,
  TrendingUp,
  MapPin,
  Package,
  Calculator,
  Search,
  Check,
  AlertCircle,
} from "lucide-react";

/**
 * Multi-Currency Global Expansion
 * 150+ currencies, real-time exchange rates, geo-based pricing, international shipping
 */

interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  enabled: boolean;
  region: string;
}

interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  carriers: string[];
  avgDeliveryDays: number;
  baseRate: number;
  enabled: boolean;
}

interface TaxRule {
  country: string;
  type: "VAT" | "GST" | "Sales Tax";
  rate: number;
  threshold: number;
}

interface RegionalPricing {
  region: string;
  countries: string[];
  discount: number;
  currency: string;
  enabled: boolean;
}

export default function GlobalExpansionPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [baseCurrency] = useState("USD");

  // Mock currencies (showing subset of 150+)
  const currencies: Currency[] = [
    { code: "USD", name: "US Dollar", symbol: "$", rate: 1.0, enabled: true, region: "North America" },
    { code: "EUR", name: "Euro", symbol: "€", rate: 0.92, enabled: true, region: "Europe" },
    { code: "GBP", name: "British Pound", symbol: "£", rate: 0.79, enabled: true, region: "Europe" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥", rate: 149.50, enabled: true, region: "Asia" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥", rate: 7.24, enabled: true, region: "Asia" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$", rate: 1.52, enabled: true, region: "Oceania" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$", rate: 1.35, enabled: true, region: "North America" },
    { code: "CHF", name: "Swiss Franc", symbol: "Fr", rate: 0.88, enabled: true, region: "Europe" },
    { code: "INR", name: "Indian Rupee", symbol: "₹", rate: 83.12, enabled: true, region: "Asia" },
    { code: "BRL", name: "Brazilian Real", symbol: "R$", rate: 4.98, enabled: true, region: "South America" },
    { code: "MXN", name: "Mexican Peso", symbol: "$", rate: 17.05, enabled: false, region: "North America" },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$", rate: 1.34, enabled: true, region: "Asia" },
    { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", rate: 7.82, enabled: true, region: "Asia" },
    { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", rate: 1.67, enabled: false, region: "Oceania" },
    { code: "SEK", name: "Swedish Krona", symbol: "kr", rate: 10.45, enabled: true, region: "Europe" },
  ];

  // Mock shipping zones
  const shippingZones: ShippingZone[] = [
    {
      id: "1",
      name: "North America",
      countries: ["USA", "Canada", "Mexico"],
      carriers: ["UPS", "FedEx", "USPS"],
      avgDeliveryDays: 3,
      baseRate: 9.99,
      enabled: true,
    },
    {
      id: "2",
      name: "Europe",
      countries: ["UK", "Germany", "France", "Italy", "Spain"],
      carriers: ["DHL", "UPS", "FedEx"],
      avgDeliveryDays: 5,
      baseRate: 14.99,
      enabled: true,
    },
    {
      id: "3",
      name: "Asia Pacific",
      countries: ["Japan", "China", "Singapore", "Australia", "Hong Kong"],
      carriers: ["DHL", "FedEx", "SF Express"],
      avgDeliveryDays: 7,
      baseRate: 19.99,
      enabled: true,
    },
    {
      id: "4",
      name: "Middle East",
      countries: ["UAE", "Saudi Arabia", "Qatar", "Kuwait"],
      carriers: ["Aramex", "DHL", "FedEx"],
      avgDeliveryDays: 6,
      baseRate: 24.99,
      enabled: false,
    },
  ];

  // Mock tax rules
  const taxRules: TaxRule[] = [
    { country: "UK", type: "VAT", rate: 20, threshold: 135 },
    { country: "Germany", type: "VAT", rate: 19, threshold: 150 },
    { country: "France", type: "VAT", rate: 20, threshold: 150 },
    { country: "Australia", type: "GST", rate: 10, threshold: 1000 },
    { country: "Canada", type: "GST", rate: 5, threshold: 20 },
    { country: "USA", type: "Sales Tax", rate: 8.5, threshold: 0 },
    { country: "Japan", type: "VAT", rate: 10, threshold: 16666 },
    { country: "Singapore", type: "GST", rate: 9, threshold: 400 },
  ];

  // Mock regional pricing
  const regionalPricing: RegionalPricing[] = [
    {
      region: "Emerging Markets",
      countries: ["India", "Brazil", "Mexico", "Indonesia"],
      discount: 15,
      currency: "Local",
      enabled: true,
    },
    {
      region: "Premium Markets",
      countries: ["Switzerland", "Norway", "UAE"],
      discount: -10,
      currency: "Local",
      enabled: true,
    },
    {
      region: "Asia Pacific",
      countries: ["China", "Japan", "Singapore", "Hong Kong"],
      discount: 5,
      currency: "Local",
      enabled: true,
    },
  ];

  const filteredCurrencies = currencies.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const enabledCurrencies = currencies.filter((c) => c.enabled);
  const totalRegions = [...new Set(currencies.map((c) => c.region))].length;
  const enabledZones = shippingZones.filter((z) => z.enabled).length;

  const convertPrice = (amount: number, toCurrency: string) => {
    const currency = currencies.find((c) => c.code === toCurrency);
    if (!currency) return amount;
    return (amount * currency.rate).toFixed(2);
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Global Expansion</h1>
          <p className="text-muted-foreground">
            Multi-currency support, international shipping, and localized pricing
          </p>
        </div>
        <Button>
          <Globe className="w-4 h-4 mr-2" />
          Add New Market
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Active Currencies</p>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{enabledCurrencies.length}</p>
          <p className="text-xs text-muted-foreground">of {currencies.length} supported</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Regions Covered</p>
            <Globe className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{totalRegions}</p>
          <p className="text-xs text-green-500">+2 this quarter</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Shipping Zones</p>
            <Package className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{enabledZones}</p>
          <p className="text-xs text-muted-foreground">of {shippingZones.length} configured</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">International Revenue</p>
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold mb-1">42%</p>
          <p className="text-xs text-green-500">+8.5% from last month</p>
        </Card>
      </div>

      <Tabs defaultValue="currencies" className="space-y-6">
        <TabsList>
          <TabsTrigger value="currencies">
            <DollarSign className="w-4 h-4 mr-2" />
            Currencies
          </TabsTrigger>
          <TabsTrigger value="shipping">
            <Package className="w-4 h-4 mr-2" />
            Shipping Zones
          </TabsTrigger>
          <TabsTrigger value="tax">
            <Calculator className="w-4 h-4 mr-2" />
            Tax Rules
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <MapPin className="w-4 h-4 mr-2" />
            Regional Pricing
          </TabsTrigger>
        </TabsList>

        {/* Currencies */}
        <TabsContent value="currencies" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Currency Management</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search currencies..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredCurrencies.map((currency) => (
                <Card key={currency.code} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xl font-bold">{currency.symbol}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{currency.code}</h3>
                          {currency.enabled && (
                            <Badge className="bg-green-500/20 text-green-500">
                              <Check className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{currency.name} • {currency.region}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Exchange Rate</p>
                        <p className="text-xl font-bold">
                          1 {baseCurrency} = {currency.rate} {currency.code}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Example: $100 USD</p>
                        <p className="text-xl font-bold text-primary">
                          {currency.symbol}{convertPrice(100, currency.code)}
                        </p>
                      </div>
                      <Button variant={currency.enabled ? "outline" : "default"} size="sm">
                        {currency.enabled ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Shipping Zones */}
        <TabsContent value="shipping">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">International Shipping Zones</h2>

            <div className="space-y-4">
              {shippingZones.map((zone) => (
                <Card key={zone.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">{zone.name}</h3>
                        {zone.enabled ? (
                          <Badge className="bg-green-500/20 text-green-500">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-500/20 text-gray-500">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {zone.countries.join(", ")}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Carriers</p>
                      <div className="flex gap-1">
                        {zone.carriers.map((carrier) => (
                          <Badge key={carrier} variant="outline" className="text-xs">
                            {carrier}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avg Delivery</p>
                      <p className="text-lg font-bold">{zone.avgDeliveryDays} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Base Rate</p>
                      <p className="text-lg font-bold">${zone.baseRate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Countries</p>
                      <p className="text-lg font-bold">{zone.countries.length}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Tax Rules */}
        <TabsContent value="tax">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Tax Calculation Rules</h2>

            <div className="space-y-3">
              {taxRules.map((rule, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Calculator className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{rule.country}</h3>
                        <p className="text-sm text-muted-foreground">{rule.type}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Tax Rate</p>
                        <p className="text-2xl font-bold text-primary">{rule.rate}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Threshold</p>
                        <p className="text-xl font-bold">${rule.threshold}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Example: $100</p>
                        <p className="text-xl font-bold text-green-500">
                          ${(100 * (1 + rule.rate / 100)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-4 mt-6 bg-blue-500/10 border-blue-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-bold mb-1">Automatic Tax Calculation</h3>
                  <p className="text-sm text-muted-foreground">
                    Taxes are automatically calculated at checkout based on customer location and order value.
                    Thresholds determine when tax collection begins.
                  </p>
                </div>
              </div>
            </Card>
          </Card>
        </TabsContent>

        {/* Regional Pricing */}
        <TabsContent value="pricing">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Geo-Based Pricing Strategy</h2>

            <div className="space-y-4">
              {regionalPricing.map((pricing, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">{pricing.region}</h3>
                        {pricing.enabled ? (
                          <Badge className="bg-green-500/20 text-green-500">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-500/20 text-gray-500">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {pricing.countries.join(", ")}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit Rules
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Price Adjustment</p>
                      <p className={`text-2xl font-bold ${pricing.discount > 0 ? "text-green-500" : "text-red-500"}`}>
                        {pricing.discount > 0 ? "-" : "+"}{Math.abs(pricing.discount)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Currency</p>
                      <p className="text-lg font-bold">{pricing.currency}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Example: $100 USD</p>
                      <p className="text-lg font-bold text-primary">
                        ${(100 * (1 - pricing.discount / 100)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-4 mt-6 bg-purple-500/10 border-purple-500/20">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <h3 className="font-bold mb-1">Dynamic Pricing Strategy</h3>
                  <p className="text-sm text-muted-foreground">
                    Prices are automatically adjusted based on customer location to account for purchasing power,
                    competition, and market conditions. Discounts encourage adoption in emerging markets while
                    premium pricing applies in high-income regions.
                  </p>
                </div>
              </div>
            </Card>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
