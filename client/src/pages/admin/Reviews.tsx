import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Star,
  Search,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Reviews & Ratings Management
 * Moderate customer reviews, respond to feedback, and manage ratings
 */

export default function ReviewsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: reviews, refetch } = trpc.reviews.list.useQuery({
    search: searchQuery || undefined,
    status: statusFilter === "all" ? undefined : (statusFilter as any),
  });

  const approveReviewMutation = trpc.reviews.approve.useMutation({
    onSuccess: () => {
      toast.success("Review approved");
      refetch();
    },
  });

  const rejectReviewMutation = trpc.reviews.reject.useMutation({
    onSuccess: () => {
      toast.success("Review rejected");
      refetch();
    },
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-600"
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-600">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-600">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reviews & Ratings</h1>
          <p className="text-gray-400 mt-1">Moderate customer feedback</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-background border-border text-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Reviews</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {reviews?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-background border-border text-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pending</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {reviews?.filter((r) => r.status === "pending").length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-background border-border text-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Rating</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {reviews && reviews.length > 0
                  ? (
                      reviews.reduce((sum, r) => sum + r.rating, 0) /
                      reviews.length
                    ).toFixed(1)
                  : "0.0"}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-background border-border text-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Approval Rate</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {reviews && reviews.length > 0
                  ? (
                      (reviews.filter((r) => r.status === "approved").length /
                        reviews.length) *
                      100
                    ).toFixed(0)
                  : "0"}
                %
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 bg-background border-border text-foreground">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-zinc-700 text-card-foreground"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              onClick={() => setStatusFilter("pending")}
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === "approved" ? "default" : "outline"}
              onClick={() => setStatusFilter("approved")}
            >
              Approved
            </Button>
            <Button
              variant={statusFilter === "rejected" ? "default" : "outline"}
              onClick={() => setStatusFilter("rejected")}
            >
              Rejected
            </Button>
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews?.map((review) => (
          <Card key={review.id} className="p-6 bg-background border-border text-foreground">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <span className="text-red-400 font-semibold">
                      {review.userName?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-foreground">
                        {review.userName || "Anonymous"}
                      </span>
                      {renderStars(review.rating)}
                      {getStatusBadge(review.status)}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(review.createdAt).toLocaleDateString()} •{" "}
                      {review.productName}
                    </p>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4">{review.comment}</p>

                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {review.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Review"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{review.helpfulCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsDown className="w-4 h-4" />
                    <span>{review.notHelpfulCount || 0}</span>
                  </div>
                  {review.verifiedPurchase && (
                    <Badge variant="secondary" className="text-xs">
                      Verified Purchase
                    </Badge>
                  )}
                </div>
              </div>

              {review.status === "pending" && (
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => approveReviewMutation.mutate({ id: review.id })}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-600/10"
                    onClick={() => rejectReviewMutation.mutate({ id: review.id })}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
