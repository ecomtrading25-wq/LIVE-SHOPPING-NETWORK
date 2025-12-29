import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, TrendingUp, Users, DollarSign, Star } from "lucide-react";
import { toast } from "sonner";

export default function AffiliateApply() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    followers: "",
    niche: "",
    why: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Application Submitted!",
      description: "We'll review your application and get back to you within 2-3 business days.",
    });
  };

  const tiers = [
    { name: "Bronze", rate: 5, sales: "0-10K", color: "bg-orange-600", icon: Star },
    { name: "Silver", rate: 10, sales: "10K-50K", color: "bg-gray-400", icon: Star },
    { name: "Gold", rate: 15, sales: "50K-100K", color: "bg-yellow-500", icon: Star },
    { name: "Platinum", rate: 20, sales: "100K+", color: "bg-red-500", icon: Star },
  ];

  const benefits = [
    "Exclusive product access before public launch",
    "Personalized affiliate dashboard with real-time analytics",
    "Dedicated affiliate manager for top performers",
    "Monthly performance bonuses and incentives",
    "Custom discount codes for your audience",
    "Marketing materials and product photos",
    "Fast bi-weekly payouts via PayPal or bank transfer",
    "Lifetime cookie tracking (90 days attribution window)",
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Join Our Affiliate Program</h1>
            <p className="text-xl text-muted-foreground">
              Earn up to 20% commission promoting products you love
            </p>
          </div>

          {/* Commission Tiers */}
          <Card>
            <CardHeader>
              <CardTitle>Commission Tiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {tiers.map((tier) => {
                  const Icon = tier.icon;
                  return (
                    <div key={tier.name} className="text-center p-6 border rounded-lg">
                      <Badge className={`${tier.color} mb-4`}>{tier.name}</Badge>
                      <div className="text-3xl font-bold mb-2">{tier.rate}%</div>
                      <p className="text-sm text-muted-foreground">Monthly Sales</p>
                      <p className="text-sm font-medium">${tier.sales}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-center">
                  <strong>Commission Calculator:</strong> If you generate $10,000 in sales at Bronze tier (5%), you earn <strong>$500</strong>. 
                  At Platinum tier (20%), the same sales earn you <strong>$2,000</strong>!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{benefit}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Application Form */}
          <Card>
            <CardHeader>
              <CardTitle>Apply Now</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website/Blog</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://yourblog.com"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Social Media Profiles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        placeholder="@yourusername"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiktok">TikTok</Label>
                      <Input
                        id="tiktok"
                        value={formData.tiktok}
                        onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                        placeholder="@yourusername"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtube">YouTube</Label>
                      <Input
                        id="youtube"
                        value={formData.youtube}
                        onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                        placeholder="Channel Name"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="followers">Total Followers/Subscribers *</Label>
                    <Input
                      id="followers"
                      type="number"
                      required
                      value={formData.followers}
                      onChange={(e) => setFormData({ ...formData, followers: e.target.value })}
                      placeholder="10000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="niche">Your Niche *</Label>
                    <Input
                      id="niche"
                      required
                      value={formData.niche}
                      onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                      placeholder="Fashion, Tech, Lifestyle, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="why">Why do you want to join our affiliate program? *</Label>
                  <Textarea
                    id="why"
                    required
                    value={formData.why}
                    onChange={(e) => setFormData({ ...formData, why: e.target.value })}
                    placeholder="Tell us about your audience and how you plan to promote our products..."
                    rows={5}
                  />
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Submit Application
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">500+</p>
                    <p className="text-sm text-muted-foreground">Active Affiliates</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">$2.5M+</p>
                    <p className="text-sm text-muted-foreground">Paid in Commissions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">15%</p>
                    <p className="text-sm text-muted-foreground">Avg Commission Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
