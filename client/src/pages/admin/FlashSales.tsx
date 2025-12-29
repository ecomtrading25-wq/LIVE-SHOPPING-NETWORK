import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Clock, TrendingUp, Users, DollarSign, Zap, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Flash Sales Admin Management Page
 * Create, manage, and monitor time-limited sales
 */

export default function FlashSalesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Mock flash sales data
  const flashSales = [
    {
      id: "fs_001",
      name: "Black Friday Blitz",
      description: "Massive discounts on top products",
      status: "active",
      startTime: new Date(Date.now() - 1000 * 60 * 60),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 2),
      totalStock: 150,
      soldCount: 105,
      revenue: 12450,
      viewCount: 3420,
      conversionRate: 3.07,
      products: 2,
    },
    {
      id: "fs_002",
      name: "Weekend Warrior Sale",
      description: "Fitness gear at unbeatable prices",
      status: "scheduled",
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 48),
      totalStock: 200,
      soldCount: 0,
      revenue: 0,
      viewCount: 0,
      conversionRate: 0,
      products: 5,
    },
    {
      id: "fs_003",
      name: "Tech Tuesday",
      description: "Electronics flash sale",
      status: "ended",
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 72),
      endTime: new Date(Date.now() - 1000 * 60 * 60 * 48),
      totalStock: 100,
      soldCount: 100,
      revenue: 8900,
      viewCount: 2150,
      conversionRate: 4.65,
      products: 3,
    },
  ];

  const getTimeRemaining = (endTime: Date) => {
    const total = endTime.getTime() - Date.now();
    if (total <= 0) return "Ended";

    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((total / (1000 * 60)) % 60);

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const handleCreateFlashSale = () => {
    toast.success("Flash sale created successfully!");
    setIsCreateDialogOpen(false);
  };

  const handleDeleteFlashSale = (id: string, name: string) => {
    toast.success(`Flash sale "${name}" deleted`);
  };

  const activeSales = flashSales.filter((s) => s.status === "active");
  const totalRevenue = flashSales.reduce((sum, s) => sum + s.revenue, 0);
  const totalSold = flashSales.reduce((sum, s) => sum + s.soldCount, 0);
  const avgConversion =
    flashSales.reduce((sum, s) => sum + s.conversionRate, 0) / flashSales.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flash Sales</h1>
          <p className="text-muted-foreground">
            Create and manage time-limited sales campaigns
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Flash Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Flash Sale</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Sale Name *</Label>
                <Input placeholder="e.g., Black Friday Blitz" />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the flash sale..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date & Time *</Label>
                  <Input type="datetime-local" />
                </div>
                <div>
                  <Label>End Date & Time *</Label>
                  <Input type="datetime-local" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max Quantity Per Customer</Label>
                  <Input type="number" placeholder="5" defaultValue="5" />
                </div>
                <div>
                  <Label>Requires Authentication</Label>
                  <Select defaultValue="yes">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Products</Label>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                    <div className="col-span-4">Product</div>
                    <div className="col-span-2">Original Price</div>
                    <div className="col-span-2">Flash Price</div>
                    <div className="col-span-2">Stock</div>
                    <div className="col-span-2">Max/Customer</div>
                  </div>

                  {/* Product rows would be dynamically added */}
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Wireless Headphones Pro</SelectItem>
                          <SelectItem value="2">Smart Watch Ultra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input type="number" placeholder="79.99" />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" placeholder="49.99" />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" placeholder="100" />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" placeholder="2" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateFlashSale}>Create Flash Sale</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Sales</p>
                <p className="text-3xl font-bold">{activeSales.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Items Sold</p>
                <p className="text-3xl font-bold">{totalSold}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Conversion</p>
                <p className="text-3xl font-bold">{avgConversion.toFixed(2)}%</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flash Sales List */}
      <Card>
        <CardHeader>
          <CardTitle>All Flash Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {flashSales.map((sale) => (
              <div
                key={sale.id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{sale.name}</h3>
                      <Badge
                        variant={
                          sale.status === "active"
                            ? "default"
                            : sale.status === "scheduled"
                            ? "secondary"
                            : "outline"
                        }
                        className={
                          sale.status === "active"
                            ? "bg-green-600 animate-pulse"
                            : ""
                        }
                      >
                        {sale.status.toUpperCase()}
                      </Badge>
                      {sale.status === "active" && (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeRemaining(sale.endTime)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {sale.description}
                    </p>
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Products:</span>{" "}
                        <span className="font-medium">{sale.products}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Stock:</span>{" "}
                        <span className="font-medium">
                          {sale.soldCount}/{sale.totalStock}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Revenue:</span>{" "}
                        <span className="font-medium text-green-600">
                          ${sale.revenue.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Views:</span>{" "}
                        <span className="font-medium">{sale.viewCount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Conversion:</span>{" "}
                        <span className="font-medium">{sale.conversionRate}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFlashSale(sale.id, sale.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>
                      {Math.round((sale.soldCount / sale.totalStock) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{
                        width: `${(sale.soldCount / sale.totalStock) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Time Info */}
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <div>
                    <span>Start:</span>{" "}
                    {sale.startTime.toLocaleString()}
                  </div>
                  <div>
                    <span>End:</span>{" "}
                    {sale.endTime.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
