import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tag,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Upload,
  Download,
  RefreshCw,
} from "lucide-react";

/**
 * AI-Powered Product Tagging
 * Automatic categorization, tag generation using LLM, bulk tagging, manual review
 */

interface ProductTag {
  id: string;
  productName: string;
  productImage: string;
  currentTags: string[];
  suggestedTags: string[];
  suggestedCategory: string;
  confidence: number;
  status: "pending" | "approved" | "rejected";
  processedDate: string;
}

interface TagSuggestion {
  tag: string;
  confidence: number;
  source: "ai" | "manual";
}

export default function ProductTaggingPage() {
  const [selectedTab, setSelectedTab] = useState("pending");
  const [processing, setProcessing] = useState(false);

  // Mock product tags
  const productTags: ProductTag[] = [
    {
      id: "TAG-001",
      productName: "Wireless Headphones Pro",
      productImage: "/placeholder-product.jpg",
      currentTags: ["electronics", "audio"],
      suggestedTags: ["wireless", "bluetooth", "noise-canceling", "over-ear", "premium"],
      suggestedCategory: "Electronics > Audio > Headphones",
      confidence: 0.95,
      status: "pending",
      processedDate: "2025-12-27T20:00:00Z",
    },
    {
      id: "TAG-002",
      productName: "Smart Watch Ultra",
      productImage: "/placeholder-product.jpg",
      currentTags: ["electronics"],
      suggestedTags: ["smartwatch", "fitness", "waterproof", "gps", "health-tracking"],
      suggestedCategory: "Electronics > Wearables > Smart Watches",
      confidence: 0.92,
      status: "pending",
      processedDate: "2025-12-27T19:00:00Z",
    },
    {
      id: "TAG-003",
      productName: "Portable Charger 20K",
      productImage: "/placeholder-product.jpg",
      currentTags: ["accessories"],
      suggestedTags: ["portable", "fast-charging", "usb-c", "power-bank", "travel"],
      suggestedCategory: "Electronics > Accessories > Power Banks",
      confidence: 0.89,
      status: "pending",
      processedDate: "2025-12-27T18:00:00Z",
    },
  ];

  // Mock stats
  const stats = {
    totalProducts: 1250,
    tagged: 890,
    pending: 234,
    needsReview: 126,
    avgConfidence: 0.91,
    processingTime: 2.3,
  };

  // Mock popular tags
  const popularTags = [
    { tag: "wireless", count: 234, trend: "+12%" },
    { tag: "bluetooth", count: 189, trend: "+8%" },
    { tag: "waterproof", count: 156, trend: "+15%" },
    { tag: "fast-charging", count: 145, trend: "+10%" },
    { tag: "portable", count: 134, trend: "+6%" },
  ];

  const handleBulkProcess = () => {
    setProcessing(true);
    setTimeout(() => setProcessing(false), 3000);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-500";
    if (confidence >= 0.7) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI-Powered Product Tagging</h1>
          <p className="text-muted-foreground">
            Automatic categorization and tag generation using machine learning
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleBulkProcess} disabled={processing}>
            {processing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Process All
              </>
            )}
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Products</p>
            <Tag className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.totalProducts.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">In catalog</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Tagged</p>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.tagged.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">
            {((stats.tagged / stats.totalProducts) * 100).toFixed(1)}% complete
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Pending</p>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.pending.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Awaiting review</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Needs Review</p>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.needsReview.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Low confidence</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Avg Confidence</p>
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{(stats.avgConfidence * 100).toFixed(0)}%</p>
          <p className="text-xs text-green-500">+2.3% improvement</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Processing Time</p>
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.processingTime}s</p>
          <p className="text-xs text-muted-foreground">Per product</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <Card className="p-6">
                <div className="space-y-4">
                  {productTags.map((product) => (
                    <Card key={product.id} className="p-6">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-secondary rounded-lg flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-bold mb-2">{product.productName}</h3>
                          
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground mb-1">Current Tags:</p>
                            <div className="flex flex-wrap gap-2">
                              {product.currentTags.map((tag, index) => (
                                <Badge key={index} variant="outline">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs text-muted-foreground">AI Suggested Tags:</p>
                              <Badge className={getConfidenceColor(product.confidence)}>
                                {(product.confidence * 100).toFixed(0)}% confidence
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {product.suggestedTags.map((tag, index) => (
                                <Badge key={index} className="bg-blue-500/20 text-blue-400">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-xs text-muted-foreground mb-1">Suggested Category:</p>
                            <Badge variant="outline">{product.suggestedCategory}</Badge>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve All
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              Edit & Approve
                            </Button>
                            <Button variant="outline" size="sm">
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="approved">
              <Card className="p-6">
                <p className="text-center text-muted-foreground py-8">
                  {stats.tagged} products have been tagged and approved
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="rejected">
              <Card className="p-6">
                <p className="text-center text-muted-foreground py-8">
                  Rejected suggestions will appear here
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Popular Tags */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Popular Tags</h2>
            <div className="space-y-3">
              {popularTags.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.tag}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.count} products
                    </p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400">{item.trend}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Model Info */}
          <Card className="p-6 bg-blue-500/10 border-blue-500/20">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-bold text-blue-500 mb-2">AI Model Performance</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 91% average confidence</li>
                  <li>• 2.3s processing time</li>
                  <li>• 95% accuracy on validation set</li>
                  <li>• Trained on 50K+ products</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Tag className="w-4 h-4 mr-2" />
                Manage Tag Library
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retrain Model
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
