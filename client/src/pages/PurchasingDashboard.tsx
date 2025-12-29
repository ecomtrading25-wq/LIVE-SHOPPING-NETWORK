import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, TrendingUp, DollarSign, CheckCircle, AlertCircle, Plus, Calculator } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import AdminProtectedRoute from "@/components/AdminProtectedRoute";
export default function PurchasingDashboard() {
  return (
    <AdminProtectedRoute>
      <PurchasingDashboardContent />
    </AdminProtectedRoute>
  );
}

function PurchasingDashboardContent() {
  const [dateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  });

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    taxId: "",
    paymentTerms: "NET30",
    currency: "USD",
    leadTimeDays: 30,
    minimumOrderValue: 1000,
    shippingMethods: ["air", "sea"],
    certifications: [],
    productCategories: [],
  });

  const [landedCostCalc, setLandedCostCalc] = useState({
    productCost: 0,
    quantity: 0,
    shippingCost: 0,
    country: "US",
    hsCode: "",
  });

  const { data: analytics, isLoading: analyticsLoading } = trpc.lsnPurchasing.getPurchasingAnalytics.useQuery(dateRange);
  const { data: landedCost, refetch: calculateLandedCost } = trpc.lsnPurchasing.calculateLandedCost.useQuery(landedCostCalc, {
    enabled: false,
  });

  const onboardSupplierMutation = trpc.lsnPurchasing.onboardSupplier.useMutation();
  const runReorderMutation = trpc.lsnPurchasing.runAutomatedReorder.useMutation();

  const handleOnboardSupplier = async () => {
    try {
      await onboardSupplierMutation.mutateAsync(supplierForm);
      toast.success("Supplier onboarded successfully");
      setSupplierForm({
        name: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US",
        taxId: "",
        paymentTerms: "NET30",
        currency: "USD",
        leadTimeDays: 30,
        minimumOrderValue: 1000,
        shippingMethods: ["air", "sea"],
        certifications: [],
        productCategories: [],
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to onboard supplier");
    }
  };

  const handleRunReorder = async () => {
    try {
      const result = await runReorderMutation.mutateAsync();
      toast.success(`Generated ${result.ordersCreated} purchase orders`);
    } catch (error: any) {
      toast.error(error.message || "Failed to run reorder system");
    }
  };

  const handleCalculateLandedCost = () => {
    calculateLandedCost();
  };

  if (analyticsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Purchasing & Supplier OS</h1>
          <p className="text-muted-foreground">Manage suppliers, purchase orders, and quality control</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Onboard Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Onboard New Supplier</DialogTitle>
                <DialogDescription>Add a new supplier to your network</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name</Label>
                    <Input
                      id="name"
                      value={supplierForm.name}
                      onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input
                      id="contactName"
                      value={supplierForm.contactName}
                      onChange={(e) => setSupplierForm({ ...supplierForm, contactName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={supplierForm.contactEmail}
                      onChange={(e) => setSupplierForm({ ...supplierForm, contactEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={supplierForm.contactPhone}
                      onChange={(e) => setSupplierForm({ ...supplierForm, contactPhone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={supplierForm.address}
                    onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={supplierForm.city}
                      onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={supplierForm.state}
                      onChange={(e) => setSupplierForm({ ...supplierForm, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={supplierForm.zipCode}
                      onChange={(e) => setSupplierForm({ ...supplierForm, zipCode: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Select
                      value={supplierForm.paymentTerms}
                      onValueChange={(value) => setSupplierForm({ ...supplierForm, paymentTerms: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NET30">NET 30</SelectItem>
                        <SelectItem value="NET60">NET 60</SelectItem>
                        <SelectItem value="NET90">NET 90</SelectItem>
                        <SelectItem value="COD">Cash on Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leadTimeDays">Lead Time (Days)</Label>
                    <Input
                      id="leadTimeDays"
                      type="number"
                      value={supplierForm.leadTimeDays}
                      onChange={(e) => setSupplierForm({ ...supplierForm, leadTimeDays: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleOnboardSupplier} disabled={onboardSupplierMutation.isPending}>
                  Onboard Supplier
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleRunReorder} disabled={runReorderMutation.isPending}>
            Run Auto-Reorder
          </Button>
        </div>
      </div>

      {analytics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.totalSpend.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all suppliers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Purchase Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalPOs}</div>
              <p className="text-xs text-muted-foreground">
                Avg: ${analytics.avgPOValue.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activeSuppliers}</div>
              <p className="text-xs text-muted-foreground">
                Total: {analytics.totalSuppliers}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.avgQualityScore.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Pass rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="suppliers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="quality">Quality Control</TabsTrigger>
          <TabsTrigger value="calculator">Landed Cost</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle>Top Suppliers</CardTitle>
                <CardDescription>By spend volume</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Total Spend</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Quality Score</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.topSuppliers.map((supplier: any) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>${supplier.totalSpend.toLocaleString()}</TableCell>
                        <TableCell>{supplier.orderCount}</TableCell>
                        <TableCell>
                          <Badge variant={supplier.qualityScore >= 90 ? "default" : "secondary"}>
                            {supplier.qualityScore.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={supplier.status === "active" ? "default" : "secondary"}>
                            {supplier.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          {analytics && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.posByStatus.pending}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>In Transit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.posByStatus.in_transit}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Received</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analytics.posByStatus.received}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          {analytics && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quality Inspections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Inspections</span>
                      <span className="font-medium">{analytics.qualityInspections.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Passed</span>
                      <span className="font-medium text-green-500">{analytics.qualityInspections.passed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Failed</span>
                      <span className="font-medium text-red-500">{analytics.qualityInspections.failed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Pass Rate</span>
                      <span className="font-medium">{analytics.avgQualityScore.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Common Defects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.commonDefects.map((defect: any, i: number) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm">{defect.type}</span>
                        <Badge variant="outline">{defect.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Landed Cost Calculator</CardTitle>
              <CardDescription>Calculate total cost including duties and shipping</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productCost">Product Cost (per unit)</Label>
                  <Input
                    id="productCost"
                    type="number"
                    value={landedCostCalc.productCost}
                    onChange={(e) => setLandedCostCalc({ ...landedCostCalc, productCost: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={landedCostCalc.quantity}
                    onChange={(e) => setLandedCostCalc({ ...landedCostCalc, quantity: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shippingCost">Shipping Cost</Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    value={landedCostCalc.shippingCost}
                    onChange={(e) => setLandedCostCalc({ ...landedCostCalc, shippingCost: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hsCode">HS Code (Optional)</Label>
                  <Input
                    id="hsCode"
                    value={landedCostCalc.hsCode}
                    onChange={(e) => setLandedCostCalc({ ...landedCostCalc, hsCode: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleCalculateLandedCost}>
                <Calculator className="mr-2 h-4 w-4" />
                Calculate
              </Button>

              {landedCost && (
                <div className="mt-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Product Cost</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${landedCost.productCost.toFixed(2)}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Duties & Taxes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${landedCost.duties.toFixed(2)}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Landed Cost</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-500">${landedCost.totalLandedCost.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Per unit: ${landedCost.perUnitCost.toFixed(2)}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Cost Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Product Cost</span>
                          <span className="font-medium">${landedCost.productCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Shipping</span>
                          <span className="font-medium">${landedCost.shipping.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Customs Duties</span>
                          <span className="font-medium">${landedCost.duties.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Insurance</span>
                          <span className="font-medium">${landedCost.insurance.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-2">
                          <span>Total</span>
                          <span>${landedCost.totalLandedCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
