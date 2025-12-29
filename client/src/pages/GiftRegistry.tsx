import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Gift,
  Share2,
  Star,
  Users,
  Lock,
  Globe,
  Heart,
  CheckCircle,
} from "lucide-react";

export default function GiftRegistryPage() {
  const [showCreate, setShowCreate] = useState(false);

  const registries = [
    {
      id: "REG-001",
      name: "Sarah & Michael's Wedding",
      type: "Wedding",
      date: "2026-06-15",
      privacy: "public",
      items: 24,
      purchased: 18,
      totalValue: 4567,
    },
    {
      id: "REG-002",
      name: "Baby Shower for Emma",
      type: "Baby Shower",
      date: "2026-03-20",
      privacy: "private",
      items: 15,
      purchased: 8,
      totalValue: 1234,
    },
  ];

  const registryItems = [
    {
      id: "ITEM-001",
      name: "KitchenAid Stand Mixer",
      price: 399.99,
      priority: "must-have",
      quantity: 1,
      purchased: 1,
      groupGift: false,
    },
    {
      id: "ITEM-002",
      name: "Dining Table Set",
      price: 1299.99,
      priority: "must-have",
      quantity: 1,
      purchased: 0,
      groupGift: true,
      contributors: 3,
      amountRaised: 450,
    },
    {
      id: "ITEM-003",
      name: "Coffee Maker",
      price: 149.99,
      priority: "nice-to-have",
      quantity: 1,
      purchased: 0,
      groupGift: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b bg-card text-card-foreground">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Gift className="w-8 h-8 text-pink-500" />
                <h1 className="text-3xl font-bold">Gift Registries</h1>
              </div>
              <p className="text-muted-foreground">
                Create and manage gift registries for special occasions
              </p>
            </div>
            <Button onClick={() => setShowCreate(!showCreate)} size="lg">
              <Gift className="w-5 h-5 mr-2" />
              Create Registry
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {showCreate && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">Create New Registry</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Registry Name *</label>
                <Input placeholder="e.g., Sarah & Michael's Wedding" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Event Type *</label>
                <select className="w-full p-2 border rounded-lg bg-background text-foreground">
                  <option value="wedding">Wedding</option>
                  <option value="baby">Baby Shower</option>
                  <option value="birthday">Birthday</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Event Date</label>
                <Input type="date" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Privacy</label>
                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1">
                    <Globe className="w-4 h-4 mr-2" />
                    Public
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Lock className="w-4 h-4 mr-2" />
                    Private
                  </Button>
                </div>
              </div>
              <Button>Create Registry</Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {registries.map((registry) => (
            <Card key={registry.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">{registry.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-pink-500/20 text-pink-400">{registry.type}</Badge>
                    <Badge
                      className={
                        registry.privacy === "public"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-orange-500/20 text-orange-400"
                      }
                    >
                      {registry.privacy === "public" ? (
                        <Globe className="w-3 h-3 mr-1" />
                      ) : (
                        <Lock className="w-3 h-3 mr-1" />
                      )}
                      {registry.privacy}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {registry.purchased}/{registry.items} items purchased
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-500"
                    style={{ width: `${(registry.purchased / registry.items) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Event: {new Date(registry.date).toLocaleDateString()}
                </span>
                <span className="font-bold">${registry.totalValue.toLocaleString()}</span>
              </div>

              <Button className="w-full mt-4">View Registry</Button>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Registry Items</h2>
          <div className="space-y-4">
            {registryItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <Badge
                        className={
                          item.priority === "must-have"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-blue-500/20 text-blue-400"
                        }
                      >
                        <Star className="w-3 h-3 mr-1" />
                        {item.priority}
                      </Badge>
                      {item.purchased === item.quantity && (
                        <Badge className="bg-green-500/20 text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Purchased
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold mb-2">${item.price}</p>
                    {item.groupGift && (
                      <div className="mb-2">
                        <div className="flex items-center gap-2 text-sm mb-1">
                          <Users className="w-4 h-4 text-red-500" />
                          <span className="text-muted-foreground">
                            Group Gift: {item.contributors} contributors
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500"
                            style={{ width: `${(item.amountRaised! / item.price) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          ${item.amountRaised} raised of ${item.price}
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.purchased}/{item.quantity}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {item.purchased < item.quantity && (
                      <>
                        <Button size="sm">Purchase</Button>
                        {item.groupGift && (
                          <Button variant="outline" size="sm">
                            <Users className="w-4 h-4 mr-2" />
                            Contribute
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
