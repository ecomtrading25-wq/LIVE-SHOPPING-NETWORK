import { useState } from "react";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Camera,
  CheckCircle,
  X,
} from "lucide-react";

interface Review {
  id: string;
  userName: string;
  rating: number;
  title: string;
  content: string;
  photos: string[];
  verifiedPurchase: boolean;
  helpfulCount: number;
  date: string;
}

export default function ProductReviewsPage() {
  const params = useParams();
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  const product = {
    name: "Wireless Headphones Pro",
    averageRating: 4.5,
    totalReviews: 234,
    ratingDistribution: { 5: 156, 4: 45, 3: 18, 2: 9, 1: 6 },
  };

  const reviews: Review[] = [
    {
      id: "REV-001",
      userName: "Sarah M.",
      rating: 5,
      title: "Amazing sound quality!",
      content: "These headphones exceeded my expectations. The noise cancellation is incredible.",
      photos: [],
      verifiedPurchase: true,
      helpfulCount: 45,
      date: "2025-12-20",
    },
  ];

  const renderStars = (r: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= (interactive ? hoverRating || r : r)
                ? "fill-yellow-500 text-yellow-500"
                : "text-gray-400"
            } ${interactive ? "cursor-pointer" : ""}`}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => interactive && setRating(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container py-6">
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <div className="flex items-center gap-4">
            {renderStars(Math.round(product.averageRating))}
            <span className="text-2xl font-bold">{product.averageRating}</span>
            <span className="text-muted-foreground">{product.totalReviews} reviews</span>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <Button onClick={() => setShowWriteReview(!showWriteReview)} size="lg" className="mb-6">
          <Star className="w-5 h-5 mr-2" />
          Write a Review
        </Button>

        {showWriteReview && (
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold mb-6">Write Your Review</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Your Rating *</label>
              {renderStars(rating, true)}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Review Title *</label>
              <Input
                placeholder="Summarize your experience"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Your Review *</label>
              <Textarea
                placeholder="Share your thoughts..."
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                maxLength={500}
                rows={6}
              />
            </div>
            <Button disabled={!rating || !reviewTitle || !reviewContent}>Submit Review</Button>
          </Card>
        )}

        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-secondary rounded-full" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{review.userName}</h3>
                    {review.verifiedPurchase && (
                      <Badge className="bg-green-500/20 text-green-400 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  {renderStars(review.rating)}
                </div>
              </div>
              <h4 className="font-bold text-lg mb-2">{review.title}</h4>
              <p className="text-muted-foreground mb-4">{review.content}</p>
              <div className="flex items-center gap-4 pt-4 border-t">
                <Button variant="outline" size="sm">
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Yes ({review.helpfulCount})
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
