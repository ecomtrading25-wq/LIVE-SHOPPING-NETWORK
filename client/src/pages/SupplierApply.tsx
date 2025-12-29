import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Package, TrendingUp, Shield, Clock } from "lucide-react";
import { toast } from "sonner";

export default function SupplierApply() {
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    productCategories: "",
    avgShippingDays: "",
    minOrderValue: "",
    returnPolicy: "",
    certifications: "",
    why: "",
    agreeToTerms: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeToTerms) {
      toast({
        title: "Error",
        description: "Please agree to the terms and conditions",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Application Submitted!",
      description: "We'll review your application and contact you within 3-5 business days.",
    });
  };

  const requirements = [
    "Minimum 95% order fulfillment rate",
    "Average shipping time under 5 business days",
    "Product defect rate below 2%",
    "Responsive customer support (reply within 24 hours)",
    "Quality product images and descriptions",
    "Competitive wholesale pricing with minimum 40% margins",
    "Ability to handle 100+ orders per month",
    "Valid business license and tax documentation",
  ];

  const benefits = [
    "Access to 50,000+ active customers",
    "Zero upfront costs or listing fees",
    "Automated order routing and fulfillment tracking",
    "Real-time inventory sync across all channels",
    "Fast bi-weekly payouts via ACH or wire transfer",
    "Dedicated supplier success manager",
    "Marketing support and product promotion",
    "Performance analytics and sales insights",
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Become a Supplier Partner</h1>
            <p className="text-xl text-muted-foreground">
              Join our network and reach thousands of customers through live shopping
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Package className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">200+</p>
                  <p className="text-sm text-muted-foreground">Supplier Partners</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">$5M+</p>
                  <p className="text-sm text-muted-foreground">Monthly GMV</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">98%</p>
                  <p className="text-sm text-muted-foreground">Avg Trust Score</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">3.5d</p>
                  <p className="text-sm text-muted-foreground">Avg Shipping Time</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requirements.map((req, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{req}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Partnership Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{benefit}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Application Form */}
          <Card>
            <CardHeader>
              <CardTitle>Supplier Application</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        required
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="ABC Wholesale Inc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Person *</Label>
                      <Input
                        id="contactName"
                        required
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@abc-wholesale.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://www.abc-wholesale.com"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Business Address</h3>
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="New York"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="NY"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP Code *</Label>
                      <Input
                        id="zip"
                        required
                        value={formData.zip}
                        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                        placeholder="10001"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="United States"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Product & Logistics Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="productCategories">Product Categories *</Label>
                    <Input
                      id="productCategories"
                      required
                      value={formData.productCategories}
                      onChange={(e) => setFormData({ ...formData, productCategories: e.target.value })}
                      placeholder="Electronics, Fashion, Home & Garden, etc."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="avgShippingDays">Avg Shipping Days *</Label>
                      <Input
                        id="avgShippingDays"
                        type="number"
                        required
                        value={formData.avgShippingDays}
                        onChange={(e) => setFormData({ ...formData, avgShippingDays: e.target.value })}
                        placeholder="3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minOrderValue">Min Order Value (USD)</Label>
                      <Input
                        id="minOrderValue"
                        type="number"
                        value={formData.minOrderValue}
                        onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="returnPolicy">Return Policy *</Label>
                    <Textarea
                      id="returnPolicy"
                      required
                      value={formData.returnPolicy}
                      onChange={(e) => setFormData({ ...formData, returnPolicy: e.target.value })}
                      placeholder="Describe your return policy (e.g., 30-day returns, restocking fees, etc.)"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certifications">Certifications & Licenses</Label>
                    <Input
                      id="certifications"
                      value={formData.certifications}
                      onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                      placeholder="ISO, CE, FDA, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="why">Why do you want to partner with us? *</Label>
                  <Textarea
                    id="why"
                    required
                    value={formData.why}
                    onChange={(e) => setFormData({ ...formData, why: e.target.value })}
                    placeholder="Tell us about your business, product quality, and how you can contribute to our platform..."
                    rows={5}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, agreeToTerms: checked as boolean })
                    }
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the Supplier Terms and Conditions *
                  </label>
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Submit Application
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
