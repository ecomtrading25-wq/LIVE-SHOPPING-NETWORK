import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Filter,
  Search,
} from "lucide-react";

/**
 * Customer Feedback & Reviews Management
 * Product reviews, ratings, photo uploads, verified purchase badges, sentiment analysis
 */

interface Review {
  id: string;
  productName: string;
  customerName: string;
  rating: number;
  title: string;
  content: string;
  verified: boolean;
  helpful: number;
  notHelpful: number;
  photos: string[];
  sentiment: "positive" | "neutral" | "negative";
  date: string;
  status: "approved" | "pending" | "flagged";
}

export default function CustomerFeedbackPage() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock reviews
  const reviews: Review[] = [
    {
      id: "REV-001",
      productName: "Wireless Headphones Pro",
      customerName: "Sarah M.",
      rating: 5,
      title: "Amazing sound quality!",
      content: "These headphones exceeded my expectations. The noise cancellation is incredible and the battery lasts all day. Highly recommend!",
      verified: true,
      helpful: 45,
      notHelpful: 2,
      photos: ["/placeholder-review1.jpg", "/placeholder-review2.jpg"],
      sentiment: "positive",
      date: "2025-12-25T00:00:00Z",
      status: "approved",
    },
    {
      id: "REV-002",
      productName: "Smart Watch Ultra",
      customerName: "John D.",
      rating: 4,
      title: "Great watch, minor issues",
      content: "Love the features and design. Battery life could be better, but overall a solid purchase.",
      verified: true,
      helpful: 28,
      notHelpful: 5,
      photos: [],
      sentiment: "positive",
      date: "2025-12-26T00:00:00Z",
      status: "approved",
    },
    {
      id: "REV-003",
      productName: "Portable Charger 20K",
      customerName: "Emily R.",
      rating: 2,
      title: "Disappointed with charging speed",
      content: "The charger is bulky and charges slower than advertised. Not worth the price.",
      verified: false,
      helpful: 12,
      notHelpful: 8,
      photos: [],
      sentiment: "negative",
      date: "2025-12-27T00:00:00Z",
      status: "flagged",
    },
  ];

  // Mock stats
  const stats = {
    totalReviews: 2340,
    averageRating: 4.5,
    positiveReviews: 1890,
    neutralReviews: 320,
    negativeReviews: 130,
    pendingReviews: 45,
    verifiedPurchases: 2100,
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-500/20 text-green-400";
      case "neutral":
        return "bg-yellow-500/20 text-yellow-400";
      case "negative":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/20 text-green-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "flagged":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Customer Feedback & Reviews</h1>
          <p className="text-muted-foreground">
            Manage product reviews, ratings, and customer sentiment
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Reviews</p>
            <MessageCircle className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.totalReviews.toLocaleString()}</p>
          <p className="text-xs text-green-500">+124 this week</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Average Rating</p>
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-3xl font-bold">{stats.averageRating}</p>
            <div className="flex">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(stats.averageRating)
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-gray-300"
                    }`}
                  />
                ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Across all products</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Verified Purchases</p>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.verifiedPurchases.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">
            {((stats.verifiedPurchases / stats.totalReviews) * 100).toFixed(1)}% of reviews
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Pending Review</p>
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.pendingReviews}</p>
          <p className="text-xs text-muted-foreground">Awaiting moderation</p>
        </Card>
      </div>

      {/* Sentiment Analysis */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Sentiment Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Positive</span>
              <span className="text-2xl font-bold text-green-500">
                {stats.positiveReviews.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{ width: `${(stats.positiveReviews / stats.totalReviews) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.positiveReviews / stats.totalReviews) * 100).toFixed(1)}% of reviews
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Neutral</span>
              <span className="text-2xl font-bold text-yellow-500">
                {stats.neutralReviews.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500"
                style={{ width: `${(stats.neutralReviews / stats.totalReviews) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.neutralReviews / stats.totalReviews) * 100).toFixed(1)}% of reviews
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Negative</span>
              <span className="text-2xl font-bold text-red-500">
                {stats.negativeReviews.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500"
                style={{ width: `${(stats.negativeReviews / stats.totalReviews) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.negativeReviews / stats.totalReviews) * 100).toFixed(1)}% of reviews
            </p>
          </div>
        </div>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Reviews ({stats.totalReviews})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pendingReviews})</TabsTrigger>
          <TabsTrigger value="flagged">Flagged</TabsTrigger>
          <TabsTrigger value="photos">With Photos</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <Card className="p-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reviews by product, customer, or content..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold">{review.customerName}</h3>
                        {review.verified && (
                          <Badge className="bg-green-500/20 text-green-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified Purchase
                          </Badge>
                        )}
                        <Badge className={getSentimentColor(review.sentiment)}>
                          {review.sentiment}
                        </Badge>
                        <Badge className={getStatusColor(review.status)}>{review.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{review.productName}</p>
                      <div className="flex items-center gap-1 mb-3">
                        {Array(5)
                          .fill(0)
                          .map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? "fill-yellow-500 text-yellow-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        <span className="text-sm text-muted-foreground ml-2">
                          {new Date(review.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h4 className="font-bold mb-2">{review.title}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{review.content}</p>

                  {review.photos.length > 0 && (
                    <div className="flex gap-2 mb-4">
                      {review.photos.map((photo, index) => (
                        <div key={index} className="w-20 h-20 bg-secondary rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                        <ThumbsUp className="w-4 h-4" />
                        <span>Helpful ({review.helpful})</span>
                      </button>
                      <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                        <ThumbsDown className="w-4 h-4" />
                        <span>Not Helpful ({review.notHelpful})</span>
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {review.status === "pending" && (
                        <>
                          <Button variant="outline" size="sm">
                            Approve
                          </Button>
                          <Button variant="destructive" size="sm">
                            Reject
                          </Button>
                        </>
                      )}
                      {review.status === "flagged" && (
                        <>
                          <Button variant="outline" size="sm">
                            Approve
                          </Button>
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
                        </>
                      )}
                      <Button variant="outline" size="sm">
                        Reply
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card className="p-6">
            <p className="text-center text-muted-foreground py-8">
              {stats.pendingReviews} reviews awaiting moderation
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="flagged">
          <Card className="p-6">
            <p className="text-center text-muted-foreground py-8">
              Flagged reviews will appear here
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <Card className="p-6">
            <p className="text-center text-muted-foreground py-8">
              Reviews with customer photos
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
