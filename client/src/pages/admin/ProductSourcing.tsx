import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, TrendingUp, Calculator, Package, ExternalLink, DollarSign, ShoppingCart, Truck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  supplier: string;
  platform: '1688' | 'alibaba' | 'dhgate' | 'made_in_china';
  price: number;
  moq: number;
  imageUrl?: string;
  url: string;
  rating?: number;
  verified?: boolean;
}

interface MarginCalculation {
  productCost: number;
  quantity: number;
  shippingCost: number;
  duties: number;
  gst: number;
  totalLanded: number;
  perUnit: number;
  sellingPrice: number;
  grossProfit: number;
  grossMargin: number;
  netProfit: number;
  netMargin: number;
  breakEvenPrice: number;
}

export default function ProductSourcing() {
  const [selectedTab, setSelectedTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Margin calculator state
  const [productCost, setProductCost] = useState<number>(5);
  const [quantity, setQuantity] = useState<number>(500);
  const [weight, setWeight] = useState<number>(0.3);
  const [shippingMethod, setShippingMethod] = useState<'sea' | 'air' | 'express'>('sea');
  const [sellingPrice, setSellingPrice] = useState<number>(29.99);
  const [platformFees, setPlatformFees] = useState<number>(15);
  const [marginResult, setMarginResult] = useState<MarginCalculation | null>(null);

  // Platform URLs for manual search
  const platformUrls = {
    '1688': (query: string) => `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(query)}`,
    'alibaba': (query: string) => `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(query)}`,
    'made_in_china': (query: string) => `https://www.made-in-china.com/productdirectory.do?word=${encodeURIComponent(query)}`,
    'dhgate': (query: string) => `https://www.dhgate.com/wholesale/search.do?searchkey=${encodeURIComponent(query)}`,
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    
    // Simulate search results (in production, this would call the backend API)
    setTimeout(() => {
      const mockResults: Product[] = [
        {
          id: '1',
          name: searchQuery,
          supplier: 'Shenzhen Electronics Co.',
          platform: '1688',
          price: 4.50,
          moq: 100,
          url: platformUrls['1688'](searchQuery),
          rating: 4.8,
          verified: true,
        },
        {
          id: '2',
          name: searchQuery,
          supplier: 'Guangzhou Trading Ltd.',
          platform: 'alibaba',
          price: 6.20,
          moq: 50,
          url: platformUrls['alibaba'](searchQuery),
          rating: 4.5,
          verified: true,
        },
        {
          id: '3',
          name: searchQuery,
          supplier: 'Yiwu Wholesale Market',
          platform: 'dhgate',
          price: 8.00,
          moq: 10,
          url: platformUrls['dhgate'](searchQuery),
          rating: 4.2,
          verified: false,
        },
      ];
      
      setSearchResults(mockResults);
      setIsSearching(false);
      toast.success(`Found ${mockResults.length} products`);
    }, 1500);
  };

  const calculateMargins = () => {
    // Shipping cost calculation (simplified)
    const shippingRates = {
      sea: 0.9,   // $0.90 per kg
      air: 4.5,   // $4.50 per kg
      express: 12, // $12 per kg
    };
    
    const totalWeight = weight * quantity;
    const shippingCost = totalWeight * shippingRates[shippingMethod];
    
    // Duties and taxes (simplified - 5% duty + 10% GST)
    const productTotal = productCost * quantity;
    const duties = (productTotal + shippingCost) * 0.05;
    const gst = (productTotal + shippingCost + duties) * 0.10;
    
    const totalLanded = productTotal + shippingCost + duties + gst;
    const perUnit = totalLanded / quantity;
    
    // Margin calculations
    const grossProfit = sellingPrice - perUnit;
    const grossMargin = (grossProfit / sellingPrice) * 100;
    
    const platformFeeAmount = sellingPrice * (platformFees / 100);
    const netProfit = grossProfit - platformFeeAmount;
    const netMargin = (netProfit / sellingPrice) * 100;
    
    const breakEvenPrice = perUnit / (1 - platformFees / 100);
    
    const result: MarginCalculation = {
      productCost,
      quantity,
      shippingCost,
      duties,
      gst,
      totalLanded,
      perUnit,
      sellingPrice,
      grossProfit,
      grossMargin,
      netProfit,
      netMargin,
      breakEvenPrice,
    };
    
    setMarginResult(result);
    toast.success('Margin calculated successfully');
  };

  const openPlatformSearch = (platform: keyof typeof platformUrls) => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query first');
      return;
    }
    window.open(platformUrls[platform](searchQuery), '_blank');
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Product Sourcing</h1>
        <p className="text-muted-foreground">Find and source products from global suppliers</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="search">Product Search</TabsTrigger>
          <TabsTrigger value="calculator">Margin Calculator</TabsTrigger>
          <TabsTrigger value="trending">Trending Products</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Directory</TabsTrigger>
        </TabsList>

        {/* Product Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Products Across Platforms</CardTitle>
              <CardDescription>
                Search 1688, Alibaba, DHgate, and Made-in-China simultaneously
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Product Name or Keywords</Label>
                  <Input
                    id="search"
                    placeholder="e.g., LED sunset lamp, wireless earbuds"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="w-48">
                  <Label htmlFor="platform">Platform</Label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger id="platform">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Platforms</SelectItem>
                      <SelectItem value="1688">1688.com</SelectItem>
                      <SelectItem value="alibaba">Alibaba</SelectItem>
                      <SelectItem value="dhgate">DHgate</SelectItem>
                      <SelectItem value="made_in_china">Made-in-China</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch} disabled={isSearching}>
                    <Search className="h-4 w-4 mr-2" />
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>

              {/* Quick Platform Links */}
              <div className="flex gap-2 flex-wrap">
                <p className="text-sm text-muted-foreground w-full">Quick search on:</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openPlatformSearch('1688')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  1688.com
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openPlatformSearch('alibaba')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Alibaba
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openPlatformSearch('dhgate')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  DHgate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openPlatformSearch('made_in_china')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Made-in-China
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className="font-semibold">Search Results ({searchResults.length})</h3>
                  {searchResults.map((product) => (
                    <Card key={product.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{product.name}</h4>
                              {product.verified && (
                                <Badge variant="default" className="bg-green-500">Verified</Badge>
                              )}
                              <Badge variant="outline">{product.platform}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{product.supplier}</p>
                            <div className="flex gap-4 mt-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Unit Price</p>
                                <p className="font-semibold text-lg">${product.price.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">MOQ</p>
                                <p className="font-semibold text-lg">{product.moq} units</p>
                              </div>
                              {product.rating && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Rating</p>
                                  <p className="font-semibold text-lg">⭐ {product.rating}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setProductCost(product.price);
                                setQuantity(product.moq);
                                setSelectedTab('calculator');
                                toast.success('Product loaded into calculator');
                              }}
                            >
                              <Calculator className="h-4 w-4 mr-1" />
                              Calculate
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => window.open(product.url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Margin Calculator Tab */}
        <TabsContent value="calculator" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Product & Shipping Details</CardTitle>
                <CardDescription>Enter your product and shipping information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="productCost">Product Cost (USD per unit)</Label>
                  <Input
                    id="productCost"
                    type="number"
                    step="0.01"
                    value={productCost}
                    onChange={(e) => setProductCost(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Order Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight per Unit (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="shippingMethod">Shipping Method</Label>
                  <Select value={shippingMethod} onValueChange={(v: any) => setShippingMethod(v)}>
                    <SelectTrigger id="shippingMethod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sea">Sea Freight (Slowest, Cheapest)</SelectItem>
                      <SelectItem value="air">Air Freight (Medium)</SelectItem>
                      <SelectItem value="express">Express (Fastest, Most Expensive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sellingPrice">Target Selling Price (USD)</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="platformFees">Platform Fees (%)</Label>
                  <Input
                    id="platformFees"
                    type="number"
                    step="0.1"
                    value={platformFees}
                    onChange={(e) => setPlatformFees(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <Button onClick={calculateMargins} className="w-full">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Margins
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Margin Analysis</CardTitle>
                <CardDescription>Profitability breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {marginResult ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <h4 className="font-semibold text-sm">Landed Cost Breakdown</h4>
                      <div className="flex justify-between text-sm">
                        <span>Product Cost:</span>
                        <span className="font-semibold">${(marginResult.productCost * marginResult.quantity).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping:</span>
                        <span className="font-semibold">${marginResult.shippingCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Duties (5%):</span>
                        <span className="font-semibold">${marginResult.duties.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>GST (10%):</span>
                        <span className="font-semibold">${marginResult.gst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t pt-2">
                        <span>Total Landed:</span>
                        <span>${marginResult.totalLanded.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-primary">
                        <span>Cost Per Unit:</span>
                        <span>${marginResult.perUnit.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-primary/10 rounded-lg space-y-2">
                      <h4 className="font-semibold text-sm">Profitability</h4>
                      <div className="flex justify-between text-sm">
                        <span>Selling Price:</span>
                        <span className="font-semibold">${marginResult.sellingPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Gross Profit:</span>
                        <span className="font-semibold text-green-600">${marginResult.grossProfit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Gross Margin:</span>
                        <span className="font-semibold text-green-600">{marginResult.grossMargin.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span>Net Profit (after fees):</span>
                        <span className="font-semibold text-green-600">${marginResult.netProfit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span>Net Margin:</span>
                        <span className="text-green-600">{marginResult.netMargin.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm">Break-Even Price</p>
                          <p className="text-2xl font-bold text-yellow-600">
                            ${marginResult.breakEvenPrice.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Minimum price to cover all costs including platform fees
                          </p>
                        </div>
                      </div>
                    </div>

                    {marginResult.netMargin < 20 && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600">
                        ⚠️ Warning: Net margin below 20% may not be sustainable for long-term profitability
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter product details and click Calculate to see margin analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trending Products Tab */}
        <TabsContent value="trending">
          <Card>
            <CardHeader>
              <CardTitle>Trending Products</CardTitle>
              <CardDescription>Popular products on TikTok and Amazon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Trending product discovery coming soon</p>
                <p className="text-sm mt-2">This will automatically track TikTok and Amazon best sellers</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supplier Directory Tab */}
        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Directory</CardTitle>
              <CardDescription>Manage your supplier relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Sourcing Platforms</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open('https://www.1688.com', '_blank')}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        1688.com (Best Prices)
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open('https://www.alibaba.com', '_blank')}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Alibaba (Trade Assurance)
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open('https://www.dhgate.com', '_blank')}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        DHgate (Small Orders)
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open('https://www.made-in-china.com', '_blank')}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Made-in-China
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Sourcing Agents</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open('https://supplyia.com', '_blank')}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Supplyia (3-5% fee)
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open('https://jingsourcing.com', '_blank')}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Jingsourcing
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open('https://sourcingnova.com', '_blank')}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Sourcing Nova
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open('https://leelinesourcing.com', '_blank')}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Leeline Sourcing
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-base">💡 Sourcing Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>• <strong>1688.com</strong> offers 30-50% lower prices than Alibaba but requires a sourcing agent</p>
                    <p>• Always order <strong>samples</strong> before placing bulk orders</p>
                    <p>• Look for <strong>verified suppliers</strong> with trade assurance</p>
                    <p>• Calculate <strong>landed cost</strong> including shipping, duties, and GST</p>
                    <p>• Target <strong>40%+ net margin</strong> for sustainable profitability</p>
                    <p>• Consider attending <strong>Canton Fair</strong> (April & October) for direct supplier relationships</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
