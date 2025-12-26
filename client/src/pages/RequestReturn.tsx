import { useState } from "react";
import { useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { RotateCcw, Upload, CheckCircle, Package, AlertCircle } from "lucide-react";

/**
 * Customer Return Request Form
 * Allow customers to initiate return requests with photos and tracking
 */

export default function RequestReturnPage() {
  const [, params] = useRoute("/orders/:orderId/return");
  const orderId = params?.orderId;

  const [formData, setFormData] = useState({
    reason: "",
    reasonText: "",
    trackingNumber: "",
    photos: [] as File[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Mock order data - in production, fetch from tRPC
  const mockOrder = {
    id: orderId,
    orderNumber: "ORD-2024-001",
    items: [
      {
        id: "1",
        productName: "Wireless Headphones",
        sku: "WH-001",
        quantity: 1,
        price: 79.99,
        imageUrl: "/placeholder-product.jpg",
      },
    ],
    total: 79.99,
    orderDate: new Date("2024-01-10"),
  };

  const returnReasons = [
    { value: "defective", label: "Defective or Damaged" },
    { value: "wrong_item", label: "Wrong Item Received" },
    { value: "not_as_described", label: "Not As Described" },
    { value: "size_issue", label: "Size/Fit Issue" },
    { value: "changed_mind", label: "Changed Mind" },
    { value: "other", label: "Other" },
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData({ ...formData, photos: [...formData.photos, ...files] });
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    setFormData({ ...formData, photos: newPhotos });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason) {
      toast.error("Please select a return reason");
      return;
    }

    if (!formData.reasonText.trim()) {
      toast.error("Please provide details about your return");
      return;
    }

    setIsSubmitting(true);

    // In production, upload photos to S3 and call tRPC mutation
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success("Return request submitted successfully!");
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 py-12">
        <div className="container max-w-2xl">
          <Card className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
              Return Request Submitted
            </h1>

            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
              Your return request has been received and is being reviewed by our team.
              You'll receive an email confirmation shortly with next steps.
            </p>

            <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-lg mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Order Number:
                </span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {mockOrder.orderNumber}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Return Reason:
                </span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {returnReasons.find((r) => r.value === formData.reason)?.label}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <strong>What happens next?</strong>
              </p>
              <ol className="text-left space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center text-purple-600 font-medium">
                    1
                  </span>
                  <span>
                    Our team will review your request within 24 hours
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center text-purple-600 font-medium">
                    2
                  </span>
                  <span>
                    You'll receive a return shipping label via email if approved
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center text-purple-600 font-medium">
                    3
                  </span>
                  <span>
                    Ship the item back using the provided label
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center text-purple-600 font-medium">
                    4
                  </span>
                  <span>
                    Refund will be processed within 5-7 business days after we receive the item
                  </span>
                </li>
              </ol>
            </div>

            <div className="flex gap-4 mt-8">
              <Button
                onClick={() => (window.location.href = "/account")}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                View My Orders
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
                className="flex-1"
              >
                Back to Home
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 py-12">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            Request a Return
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Order #{mockOrder.orderNumber} • Placed on{" "}
            {mockOrder.orderDate.toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <h2 className="font-semibold text-zinc-900 dark:text-white mb-4">
                Order Items
              </h2>

              <div className="space-y-4">
                {mockOrder.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                      <Package className="w-8 h-8 text-zinc-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-zinc-900 dark:text-white text-sm">
                        {item.productName}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        SKU: {item.sku}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Qty: {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 mt-4 pt-4">
                <div className="flex justify-between">
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    Order Total
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    ${mockOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-300">
                    <p className="font-medium mb-1">Return Policy</p>
                    <p className="text-blue-700 dark:text-blue-400">
                      Items must be returned within 30 days of delivery in
                      original condition with tags attached.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Return Form */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Return Reason */}
                <div>
                  <Label className="text-base font-semibold text-zinc-900 dark:text-white mb-3 block">
                    Why are you returning this item? *
                  </Label>
                  <Select
                    value={formData.reason}
                    onValueChange={(value) =>
                      setFormData({ ...formData, reason: value })
                    }
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {returnReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Detailed Explanation */}
                <div>
                  <Label className="text-base font-semibold text-zinc-900 dark:text-white mb-3 block">
                    Please provide details *
                  </Label>
                  <Textarea
                    value={formData.reasonText}
                    onChange={(e) =>
                      setFormData({ ...formData, reasonText: e.target.value })
                    }
                    placeholder="Tell us more about why you're returning this item. The more details you provide, the faster we can process your request."
                    rows={5}
                    className="resize-none"
                  />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                    Minimum 20 characters ({formData.reasonText.length}/20)
                  </p>
                </div>

                {/* Photo Upload */}
                <div>
                  <Label className="text-base font-semibold text-zinc-900 dark:text-white mb-3 block">
                    Upload Photos (Optional)
                  </Label>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                    Photos help us process your return faster, especially for
                    defective or damaged items.
                  </p>

                  <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="photo-upload"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="w-12 h-12 text-zinc-400 mb-3" />
                      <p className="text-zinc-900 dark:text-white font-medium mb-1">
                        Click to upload photos
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        PNG, JPG up to 10MB each
                      </p>
                    </label>
                  </div>

                  {/* Photo Previews */}
                  {formData.photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-3 mt-4">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tracking Number (Optional) */}
                <div>
                  <Label className="text-base font-semibold text-zinc-900 dark:text-white mb-3 block">
                    Tracking Number (Optional)
                  </Label>
                  <Input
                    type="text"
                    value={formData.trackingNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, trackingNumber: e.target.value })
                    }
                    placeholder="Enter tracking number if you've already shipped"
                    className="h-12"
                  />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                    If you've already shipped the item back, provide the tracking
                    number here.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-12 bg-purple-600 hover:bg-purple-700 text-base"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-5 h-5 mr-2" />
                        Submit Return Request
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => (window.location.href = "/account")}
                    className="h-12"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
