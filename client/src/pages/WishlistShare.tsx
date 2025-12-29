import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  Share2,
  Copy,
  Mail,
  Users,
  Gift,
  CheckCircle,
  Calendar,
  Link as LinkIcon,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";

/**
 * Customer Wishlist Sharing
 * Unique URLs, purchased item marking, collaborative wishlists, email reminders
 */

interface WishlistItem {
  id: string;
  productName: string;
  productImage: string;
  price: number;
  priority: "high" | "medium" | "low";
  purchased: boolean;
  purchasedBy?: string;
  addedDate: string;
}

interface Wishlist {
  id: string;
  name: string;
  description: string;
  type: "personal" | "collaborative";
  items: number;
  purchased: number;
  shareUrl: string;
  event?: string;
  eventDate?: string;
  collaborators?: string[];
  visibility: "private" | "friends" | "public";
}

export default function WishlistSharePage() {
  const [selectedTab, setSelectedTab] = useState("my-wishlists");
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Mock wishlists
  const wishlists: Wishlist[] = [
    {
      id: "WL-001",
      name: "Birthday Wishlist 2026",
      description: "Items I'd love for my 30th birthday!",
      type: "collaborative",
      items: 12,
      purchased: 4,
      shareUrl: "https://shop.example.com/wishlist/abc123",
      event: "Birthday",
      eventDate: "2026-03-15",
      collaborators: ["Sarah M.", "John D.", "Emily R."],
      visibility: "friends",
    },
    {
      id: "WL-002",
      name: "Home Office Upgrade",
      description: "Tech and furniture for my workspace",
      type: "personal",
      items: 8,
      purchased: 2,
      shareUrl: "https://shop.example.com/wishlist/def456",
      visibility: "private",
    },
    {
      id: "WL-003",
      name: "Wedding Registry",
      description: "Our dream items for our new home together",
      type: "collaborative",
      items: 45,
      purchased: 18,
      shareUrl: "https://shop.example.com/wishlist/ghi789",
      event: "Wedding",
      eventDate: "2026-06-20",
      collaborators: ["Alex P.", "Maria L."],
      visibility: "public",
    },
  ];

  // Mock wishlist items
  const wishlistItems: WishlistItem[] = [
    {
      id: "ITEM-001",
      productName: "Wireless Headphones Pro",
      productImage: "/placeholder-product.jpg",
      price: 299.99,
      priority: "high",
      purchased: true,
      purchasedBy: "Sarah M.",
      addedDate: "2025-12-01",
    },
    {
      id: "ITEM-002",
      productName: "Smart Watch Ultra",
      productImage: "/placeholder-product.jpg",
      price: 399.99,
      priority: "high",
      purchased: false,
      addedDate: "2025-12-05",
    },
    {
      id: "ITEM-003",
      productName: "Portable Charger 20K",
      productImage: "/placeholder-product.jpg",
      price: 49.99,
      priority: "medium",
      purchased: true,
      purchasedBy: "John D.",
      addedDate: "2025-12-10",
    },
    {
      id: "ITEM-004",
      productName: "Ergonomic Office Chair",
      productImage: "/placeholder-product.jpg",
      price: 599.99,
      priority: "high",
      purchased: false,
      addedDate: "2025-12-15",
    },
  ];

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    // Show toast notification
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400";
      case "low":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case "public":
        return "bg-green-500/20 text-green-400";
      case "friends":
        return "bg-blue-500/20 text-blue-400";
      case "private":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b bg-card text-card-foreground">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Wishlists</h1>
              <p className="text-muted-foreground">
                Create, share, and manage your wishlists
              </p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Wishlist
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="my-wishlists">
              <Heart className="w-4 h-4 mr-2" />
              My Wishlists
            </TabsTrigger>
            <TabsTrigger value="shared-with-me">
              <Users className="w-4 h-4 mr-2" />
              Shared With Me
            </TabsTrigger>
          </TabsList>

          {/* My Wishlists Tab */}
          <TabsContent value="my-wishlists" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlists.map((wishlist) => (
                <Card key={wishlist.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold">{wishlist.name}</h3>
                        {wishlist.type === "collaborative" && (
                          <Badge className="bg-blue-500/20 text-blue-400">
                            <Users className="w-3 h-3 mr-1" />
                            Collaborative
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {wishlist.description}
                      </p>
                    </div>
                  </div>

                  {wishlist.event && (
                    <div className="flex items-center gap-2 mb-3 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{wishlist.event}</span>
                      <span className="text-muted-foreground">
                        {new Date(wishlist.eventDate!).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div>
                      <p className="font-bold">{wishlist.items}</p>
                      <p className="text-muted-foreground">Items</p>
                    </div>
                    <div>
                      <p className="font-bold text-green-500">{wishlist.purchased}</p>
                      <p className="text-muted-foreground">Purchased</p>
                    </div>
                    <div className="flex-1">
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{
                            width: `${(wishlist.purchased / wishlist.items) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((wishlist.purchased / wishlist.items) * 100).toFixed(0)}% complete
                      </p>
                    </div>
                  </div>

                  {wishlist.collaborators && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">Collaborators:</p>
                      <div className="flex flex-wrap gap-1">
                        {wishlist.collaborators.map((collab, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {collab}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <Badge className={getVisibilityColor(wishlist.visibility)}>
                      {wishlist.visibility}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      View & Edit
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        size="sm"
                        onClick={() => handleCopyLink(wishlist.shareUrl)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Shared With Me Tab */}
          <TabsContent value="shared-with-me">
            <Card className="p-6">
              <p className="text-center text-muted-foreground py-8">
                Wishlists shared with you will appear here
              </p>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Example Wishlist Detail View */}
        <Card className="p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Birthday Wishlist 2026</h2>
              <p className="text-muted-foreground">Items I'd love for my 30th birthday!</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-secondary rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{item.productName}</h3>
                          <Badge className={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                          {item.purchased && (
                            <Badge className="bg-green-500/20 text-green-400">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Purchased
                            </Badge>
                          )}
                        </div>
                        <p className="text-xl font-bold mb-1">${item.price}</p>
                        {item.purchased && item.purchasedBy && (
                          <p className="text-sm text-muted-foreground">
                            Purchased by {item.purchasedBy}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!item.purchased && (
                          <Button size="sm">
                            <Gift className="w-4 h-4 mr-2" />
                            Buy This
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Share Options Card */}
        <Card className="p-6 mt-8 bg-blue-500/10 border-blue-500/20">
          <div className="flex items-start gap-3">
            <Share2 className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-blue-500 mb-2">Share Your Wishlist</p>
              <p className="text-sm text-muted-foreground mb-4">
                Share your wishlist via email, social media, or copy the unique link. Friends can
                mark items as purchased to prevent duplicates!
              </p>
              <div className="flex gap-2">
                <Input
                  value="https://shop.example.com/wishlist/abc123"
                  readOnly
                  className="flex-1"
                />
                <Button onClick={() => handleCopyLink("https://shop.example.com/wishlist/abc123")}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
