import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, DollarSign, Users, TrendingUp, Copy, ExternalLink } from "lucide-react";

export default function Affiliates() {
  const affiliates = [
    { id: "1", name: "Sarah Johnson", code: "SARAH2024", tier: "platinum", rate: 0.20, sales: 125000, commissions: 25000, pending: 5000, clicks: 15000, conversions: 250 },
    { id: "2", name: "Mike Chen", code: "MIKE2024", tier: "gold", rate: 0.15, sales: 85000, commissions: 12750, pending: 2550, clicks: 10000, conversions: 170 },
    { id: "3", name: "Emma Davis", code: "EMMA2024", tier: "silver", rate: 0.10, sales: 45000, commissions: 4500, pending: 900, clicks: 6000, conversions: 90 },
    { id: "4", name: "Alex Rodriguez", code: "ALEX2024", tier: "bronze", rate: 0.05, sales: 12000, commissions: 600, pending: 120, clicks: 2000, conversions: 24 },
  ];

  const getTierColor = (tier: string) => {
    if (tier === "platinum") return "bg-purple-500";
    if (tier === "gold") return "bg-yellow-500";
    if (tier === "silver") return "bg-gray-400";
    return "bg-orange-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Affiliate Program</h1>
          <p className="text-muted-foreground mt-2">Manage affiliates, track performance, and process payouts</p>
        </div>
        <Button>
          <Users className="h-4 w-4 mr-2" />
          Invite Affiliate
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-background border-border text-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Affiliates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{affiliates.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-background border-border text-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${(affiliates.reduce((s, a) => s + a.sales, 0) / 1000).toFixed(0)}K</div>
          </CardContent>
        </Card>
        <Card className="bg-background border-border text-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Commissions Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${(affiliates.reduce((s, a) => s + a.commissions, 0) / 1000).toFixed(1)}K</div>
          </CardContent>
        </Card>
        <Card className="bg-background border-border text-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${(affiliates.reduce((s, a) => s + a.pending, 0) / 1000).toFixed(1)}K</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {affiliates.map((affiliate) => (
          <Card key={affiliate.id} className="bg-background border-border text-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-foreground">
                    {affiliate.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{affiliate.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getTierColor(affiliate.tier)}>{affiliate.tier.toUpperCase()}</Badge>
                      <span className="text-sm text-muted-foreground">{(affiliate.rate * 100)}% commission</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">${(affiliate.sales / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-muted-foreground">Sales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">${(affiliate.commissions / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-muted-foreground">Earned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{affiliate.conversions}</p>
                    <p className="text-xs text-muted-foreground">Conversions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{((affiliate.conversions / affiliate.clicks) * 100).toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Conv Rate</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button variant="outline" size="sm">
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
