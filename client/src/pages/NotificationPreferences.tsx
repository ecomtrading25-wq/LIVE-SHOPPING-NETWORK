import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Mail,
  Smartphone,
  Clock,
  Settings,
  CheckCircle,
} from "lucide-react";

export default function NotificationPreferencesPage() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  const notificationTypes = [
    {
      id: "order_updates",
      name: "Order Updates",
      description: "Shipping confirmations, delivery updates, and order status changes",
      email: true,
      sms: true,
      push: true,
    },
    {
      id: "price_drops",
      name: "Price Drop Alerts",
      description: "Notifications when wishlist items go on sale",
      email: true,
      sms: false,
      push: true,
    },
    {
      id: "new_arrivals",
      name: "New Arrivals",
      description: "Updates about new products in your favorite categories",
      email: true,
      sms: false,
      push: false,
    },
    {
      id: "live_shows",
      name: "Live Show Alerts",
      description: "Notifications when live shopping shows start",
      email: false,
      sms: true,
      push: true,
    },
    {
      id: "promotions",
      name: "Promotions & Deals",
      description: "Exclusive offers, flash sales, and special discounts",
      email: true,
      sms: false,
      push: true,
    },
  ];

  const frequencies = [
    { id: "instant", name: "Instant", description: "Receive notifications immediately" },
    { id: "daily", name: "Daily Digest", description: "One summary email per day at 9 AM" },
    { id: "weekly", name: "Weekly Summary", description: "Weekly roundup every Monday" },
  ];

  const [selectedFrequency, setSelectedFrequency] = useState("instant");
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("08:00");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b bg-card text-card-foreground">
        <div className="container py-6">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold">Notification Preferences</h1>
          </div>
          <p className="text-muted-foreground">
            Customize how and when you receive notifications
          </p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Channels */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Notification Channels</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-xs text-muted-foreground">user@example.com</p>
                    </div>
                  </div>
                  <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">SMS</p>
                      <p className="text-xs text-muted-foreground">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-xs text-muted-foreground">Browser & Mobile</p>
                    </div>
                  </div>
                  <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Quiet Hours
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Enable Quiet Hours</p>
                  <Switch checked={quietHoursEnabled} onCheckedChange={setQuietHoursEnabled} />
                </div>
                {quietHoursEnabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Time</label>
                      <input
                        type="time"
                        value={quietStart}
                        onChange={(e) => setQuietStart(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">End Time</label>
                      <input
                        type="time"
                        value={quietEnd}
                        onChange={(e) => setQuietEnd(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-background text-foreground"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      No notifications will be sent during quiet hours
                    </p>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Frequency */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Email Frequency</h2>
              <div className="space-y-3">
                {frequencies.map((freq) => (
                  <Card
                    key={freq.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedFrequency === freq.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => setSelectedFrequency(freq.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold">{freq.name}</p>
                        <p className="text-sm text-muted-foreground">{freq.description}</p>
                      </div>
                      {selectedFrequency === freq.id && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Notification Types */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Notification Types</h2>
              <div className="space-y-4">
                {notificationTypes.map((type) => (
                  <Card key={type.id} className="p-4">
                    <div className="mb-4">
                      <h3 className="font-bold text-lg mb-1">{type.name}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <Switch checked={type.email && emailEnabled} />
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Email</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={type.sms && smsEnabled} />
                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">SMS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={type.push && pushEnabled} />
                        <Bell className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Push</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            <Button size="lg" className="w-full">
              <Settings className="w-5 h-5 mr-2" />
              Save Preferences
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
