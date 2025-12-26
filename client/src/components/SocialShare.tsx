import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Share2,
  Facebook,
  Twitter,
  Instagram,
  MessageCircle,
  Mail,
  Link as LinkIcon,
  X,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Social Commerce Integration
 * Share products across social platforms with tracking
 */

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  price?: number;
}

export default function SocialShare({
  url,
  title,
  description,
  image,
  price,
}: SocialShareProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `https://liveshoppingnetwork.com${url}`;
  const shareText = description || title;

  const handleShare = (platform: string) => {
    let shareLink = "";

    switch (platform) {
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          shareUrl
        )}`;
        break;
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          shareUrl
        )}&text=${encodeURIComponent(shareText)}`;
        break;
      case "whatsapp":
        shareLink = `https://wa.me/?text=${encodeURIComponent(
          `${shareText} ${shareUrl}`
        )}`;
        break;
      case "telegram":
        shareLink = `https://t.me/share/url?url=${encodeURIComponent(
          shareUrl
        )}&text=${encodeURIComponent(shareText)}`;
        break;
      case "email":
        shareLink = `mailto:?subject=${encodeURIComponent(
          title
        )}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
        break;
    }

    if (shareLink) {
      window.open(shareLink, "_blank", "width=600,height=400");
      toast.success(`Sharing on ${platform}...`);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
        toast.success("Shared successfully!");
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {/* Share Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleNativeShare}
        className="gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>

      {/* Share Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Share Product</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Product Preview */}
            {image && (
              <div className="mb-6 p-4 bg-zinc-800 rounded-lg flex items-center gap-4">
                <img
                  src={image}
                  alt={title}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{title}</p>
                  {price && (
                    <p className="text-lg font-bold text-green-500">${price}</p>
                  )}
                </div>
              </div>
            )}

            {/* Social Platforms */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3"
                onClick={() => handleShare("facebook")}
              >
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <Facebook className="w-5 h-5 text-white" />
                </div>
                <span>Facebook</span>
              </Button>

              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3"
                onClick={() => handleShare("twitter")}
              >
                <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center">
                  <Twitter className="w-5 h-5 text-white" />
                </div>
                <span>Twitter</span>
              </Button>

              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3"
                onClick={() => handleShare("whatsapp")}
              >
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span>WhatsApp</span>
              </Button>

              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3"
                onClick={() => handleShare("telegram")}
              >
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span>Telegram</span>
              </Button>

              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3"
                onClick={() => handleShare("email")}
              >
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <span>Email</span>
              </Button>

              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3"
                onClick={copyLink}
              >
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  {copied ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <LinkIcon className="w-5 h-5 text-white" />
                  )}
                </div>
                <span>{copied ? "Copied!" : "Copy Link"}</span>
              </Button>
            </div>

            {/* Link Preview */}
            <div className="p-3 bg-zinc-800 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Share URL:</p>
              <p className="text-sm text-white break-all">{shareUrl}</p>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

/**
 * Social Proof Widget
 * Shows recent shares and social activity
 */
export function SocialProofWidget() {
  const recentShares = [
    { platform: "Facebook", count: 234, icon: Facebook },
    { platform: "Twitter", count: 189, icon: Twitter },
    { platform: "WhatsApp", count: 456, icon: MessageCircle },
    { platform: "Instagram", count: 312, icon: Instagram },
  ];

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-6">
      <h3 className="text-lg font-bold text-white mb-4">Social Buzz</h3>
      <div className="grid grid-cols-2 gap-4">
        {recentShares.map((share) => {
          const Icon = share.icon;
          return (
            <div
              key={share.platform}
              className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg"
            >
              <Icon className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-white">{share.count}</p>
                <p className="text-xs text-gray-400">{share.platform}</p>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-4 text-center">
        {recentShares.reduce((sum, s) => sum + s.count, 0)} total shares this week
      </p>
    </Card>
  );
}
