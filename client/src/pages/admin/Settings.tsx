import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Settings as SettingsIcon,
  Globe,
  Bell,
  Lock,
  CreditCard,
  Users,
  Mail,
  Smartphone,
  Save,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Admin Settings
 * Platform configuration and preferences
 */

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const { data: settings, refetch } = trpc.settings.get.useQuery();

  const updateSettingsMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully");
      refetch();
    },
  });

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "team", label: "Team", icon: Users },
  ];

  const handleSaveGeneral = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateSettingsMutation.mutate({
      category: "general",
      data: {
        siteName: formData.get("siteName") as string,
        siteUrl: formData.get("siteUrl") as string,
        supportEmail: formData.get("supportEmail") as string,
        supportPhone: formData.get("supportPhone") as string,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage platform configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="p-4 bg-zinc-900 border-zinc-800 h-fit">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === "general" && (
            <Card className="p-8 bg-zinc-900 border-zinc-800">
              <h2 className="text-2xl font-bold text-white mb-6">
                General Settings
              </h2>
              <form onSubmit={handleSaveGeneral} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Site Name
                  </label>
                  <Input
                    name="siteName"
                    defaultValue={settings?.siteName || "Live Shopping Network"}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Site URL
                  </label>
                  <Input
                    name="siteUrl"
                    defaultValue={settings?.siteUrl || "https://example.com"}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Support Email
                    </label>
                    <Input
                      name="supportEmail"
                      type="email"
                      defaultValue={settings?.supportEmail || "support@example.com"}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Smartphone className="w-4 h-4 inline mr-2" />
                      Support Phone
                    </label>
                    <Input
                      name="supportPhone"
                      defaultValue={settings?.supportPhone || "+1 555-0000"}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                </div>

                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </form>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="p-8 bg-zinc-900 border-zinc-800">
              <h2 className="text-2xl font-bold text-white mb-6">
                Notification Settings
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                  <div>
                    <p className="font-medium text-white">Order Notifications</p>
                    <p className="text-sm text-gray-400">
                      Get notified when new orders are placed
                    </p>
                  </div>
                  <Badge className="bg-green-600">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                  <div>
                    <p className="font-medium text-white">Dispute Alerts</p>
                    <p className="text-sm text-gray-400">
                      Receive alerts for new disputes
                    </p>
                  </div>
                  <Badge className="bg-green-600">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                  <div>
                    <p className="font-medium text-white">Low Stock Warnings</p>
                    <p className="text-sm text-gray-400">
                      Alert when inventory is low
                    </p>
                  </div>
                  <Badge className="bg-green-600">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                  <div>
                    <p className="font-medium text-white">Task Assignments</p>
                    <p className="text-sm text-gray-400">
                      Notify when tasks are assigned
                    </p>
                  </div>
                  <Badge className="bg-green-600">Enabled</Badge>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="p-8 bg-zinc-900 border-zinc-800">
              <h2 className="text-2xl font-bold text-white mb-6">
                Security Settings
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Change Password
                  </label>
                  <Input
                    type="password"
                    placeholder="New password"
                    className="bg-zinc-800 border-zinc-700 mb-3"
                  />
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="p-4 bg-zinc-800 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-white">
                        Two-Factor Authentication
                      </p>
                      <p className="text-sm text-gray-400">
                        Add an extra layer of security
                      </p>
                    </div>
                    <Badge variant="secondary">Disabled</Badge>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable 2FA
                  </Button>
                </div>

                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Save className="w-4 h-4 mr-2" />
                  Update Security
                </Button>
              </div>
            </Card>
          )}

          {activeTab === "payments" && (
            <Card className="p-8 bg-zinc-900 border-zinc-800">
              <h2 className="text-2xl font-bold text-white mb-6">
                Payment Settings
              </h2>
              <div className="space-y-6">
                <div className="p-4 bg-zinc-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Stripe</p>
                      <p className="text-sm text-gray-400">
                        Credit card processing
                      </p>
                    </div>
                    <Badge className="bg-green-600">Connected</Badge>
                  </div>
                </div>

                <div className="p-4 bg-zinc-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">PayPal</p>
                      <p className="text-sm text-gray-400">
                        Alternative payment method
                      </p>
                    </div>
                    <Badge variant="secondary">Not Connected</Badge>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Currency
                  </label>
                  <select className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white">
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "team" && (
            <Card className="p-8 bg-zinc-900 border-zinc-800">
              <h2 className="text-2xl font-bold text-white mb-6">Team Management</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <span className="text-purple-400 font-semibold">JD</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">John Doe</p>
                      <p className="text-sm text-gray-400">john@example.com</p>
                    </div>
                  </div>
                  <Badge className="bg-purple-600">Admin</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <span className="text-blue-400 font-semibold">JS</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">Jane Smith</p>
                      <p className="text-sm text-gray-400">jane@example.com</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Operator</Badge>
                </div>

                <Button className="w-full bg-purple-600 hover:bg-purple-700 mt-4">
                  <Users className="w-4 h-4 mr-2" />
                  Invite Team Member
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
