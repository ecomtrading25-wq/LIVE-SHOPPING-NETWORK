import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Bell, Play, Pause, BarChart3, Plus } from "lucide-react";

export default function Campaigns() {
  const campaigns = [
    { id: "1", name: "Welcome Series", type: "email", status: "active", sent: 12500, opened: 6250, clicked: 1875, conversions: 312, revenue: 15600 },
    { id: "2", name: "Abandoned Cart Recovery", type: "email", status: "active", sent: 8200, opened: 4920, clicked: 1968, conversions: 492, revenue: 24600 },
    { id: "3", name: "Flash Sale Alert", type: "sms", status: "completed", sent: 25000, opened: 22500, clicked: 5625, conversions: 1125, revenue: 67500 },
    { id: "4", name: "Win-Back Campaign", type: "email", status: "scheduled", sent: 0, opened: 0, clicked: 0, conversions: 0, revenue: 0 },
  ];

  const getTypeIcon = (type: string) => {
    if (type === "email") return <Mail className="h-4 w-4" />;
    if (type === "sms") return <MessageSquare className="h-4 w-4" />;
    return <Bell className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "active") return "bg-green-500";
    if (status === "scheduled") return "bg-blue-500";
    if (status === "paused") return "bg-yellow-500";
    return "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing Campaigns</h1>
          <p className="text-muted-foreground mt-2">Create and manage email, SMS, and push campaigns</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.reduce((s, c) => s + c.sent, 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">52.3%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18.7%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(campaigns.reduce((s, c) => s + c.revenue, 0) / 1000).toFixed(1)}K</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {getTypeIcon(campaign.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{campaign.type.toUpperCase()}</Badge>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(campaign.status)}`} />
                        <span className="text-sm text-muted-foreground capitalize">{campaign.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{campaign.sent.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{campaign.opened > 0 ? ((campaign.opened / campaign.sent) * 100).toFixed(1) : 0}%</p>
                    <p className="text-xs text-muted-foreground">Opened</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{campaign.clicked > 0 ? ((campaign.clicked / campaign.sent) * 100).toFixed(1) : 0}%</p>
                    <p className="text-xs text-muted-foreground">Clicked</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">${(campaign.revenue / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      {campaign.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
