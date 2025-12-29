import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Zap,
  Play,
  Pause,
  Settings,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Admin Automation Dashboard
 * Configure and monitor automated workflows
 */

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: string;
  action: string;
  lastRun?: Date;
  runCount: number;
  successRate: number;
}

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: "1",
      name: "Low Stock Alert",
      description: "Send email when product stock falls below threshold",
      enabled: true,
      trigger: "inventory < 10",
      action: "send_email_to_ops",
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
      runCount: 145,
      successRate: 98.6,
    },
    {
      id: "2",
      name: "Auto-Refund Disputes",
      description: "Automatically refund disputes under $20 with high confidence",
      enabled: true,
      trigger: "dispute_amount < 20 AND ai_confidence > 0.9",
      action: "issue_refund",
      lastRun: new Date(Date.now() - 5 * 60 * 60 * 1000),
      runCount: 89,
      successRate: 100,
    },
    {
      id: "3",
      name: "Abandoned Cart Recovery",
      description: "Send reminder email 24 hours after cart abandonment",
      enabled: true,
      trigger: "cart_age > 24h AND cart_value > 50",
      action: "send_reminder_email",
      lastRun: new Date(Date.now() - 1 * 60 * 60 * 1000),
      runCount: 234,
      successRate: 15.2,
    },
    {
      id: "4",
      name: "Dynamic Pricing Adjustment",
      description: "Adjust prices based on demand and competitor pricing",
      enabled: false,
      trigger: "hourly",
      action: "update_prices",
      lastRun: new Date(Date.now() - 12 * 60 * 60 * 1000),
      runCount: 56,
      successRate: 94.6,
    },
    {
      id: "5",
      name: "Reorder Point Alert",
      description: "Create purchase order when inventory hits reorder point",
      enabled: true,
      trigger: "inventory <= reorder_point",
      action: "create_purchase_order",
      lastRun: new Date(Date.now() - 3 * 60 * 60 * 1000),
      runCount: 67,
      successRate: 100,
    },
    {
      id: "6",
      name: "Fraud Detection",
      description: "Flag high-risk orders for manual review",
      enabled: true,
      trigger: "fraud_score > 0.7",
      action: "flag_for_review",
      lastRun: new Date(Date.now() - 30 * 60 * 1000),
      runCount: 12,
      successRate: 91.7,
    },
  ]);

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
    toast.success("Automation rule updated");
  };

  const runNow = (id: string) => {
    toast.success("Running automation...");
    // Simulate run
    setTimeout(() => {
      setRules((prev) =>
        prev.map((rule) =>
          rule.id === id
            ? {
                ...rule,
                lastRun: new Date(),
                runCount: rule.runCount + 1,
              }
            : rule
        )
      );
      toast.success("Automation completed successfully");
    }, 2000);
  };

  const totalRuns = rules.reduce((sum, rule) => sum + rule.runCount, 0);
  const avgSuccessRate =
    rules.reduce((sum, rule) => sum + rule.successRate, 0) / rules.length;
  const activeRules = rules.filter((r) => r.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Automation Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Configure and monitor automated workflows
          </p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
          <Zap className="w-4 h-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-background border-border text-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Rules</p>
                <p className="text-3xl font-bold text-foreground mt-1">{activeRules}</p>
                <p className="text-xs text-gray-500 mt-1">of {rules.length} total</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background border-border text-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Runs</p>
                <p className="text-3xl font-bold text-foreground mt-1">{totalRuns}</p>
                <p className="text-xs text-gray-500 mt-1">last 30 days</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background border-border text-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Success Rate</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {avgSuccessRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">average across all rules</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background border-border text-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Time Saved</p>
                <p className="text-3xl font-bold text-foreground mt-1">47h</p>
                <p className="text-xs text-gray-500 mt-1">this month</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Rules */}
      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id} className="bg-background border-border text-foreground">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-foreground">{rule.name}</h3>
                    <Badge
                      className={
                        rule.enabled
                          ? "bg-green-600"
                          : "bg-gray-600"
                      }
                    >
                      {rule.enabled ? "Active" : "Paused"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {rule.runCount} runs
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-400 mb-3">{rule.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Trigger</p>
                      <code className="text-purple-400 bg-card px-2 py-1 rounded text-xs">
                        {rule.trigger}
                      </code>
                    </div>
                    <div>
                      <p className="text-gray-500">Action</p>
                      <code className="text-pink-400 bg-card px-2 py-1 rounded text-xs">
                        {rule.action}
                      </code>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-4 text-sm">
                    <div>
                      <span className="text-gray-500">Last run:</span>{" "}
                      <span className="text-foreground">
                        {rule.lastRun
                          ? new Date(rule.lastRun).toLocaleString()
                          : "Never"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Success rate:</span>{" "}
                      <span className="text-green-500 font-bold">
                        {rule.successRate}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runNow(rule.id)}
                    disabled={!rule.enabled}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Run Now
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create New Rule */}
      <Card className="bg-background border-border text-foreground">
        <CardHeader>
          <CardTitle className="text-foreground">Create New Automation Rule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="ruleName">Rule Name</Label>
            <Input
              id="ruleName"
              placeholder="e.g., Auto-approve small refunds"
              className="bg-card border-zinc-700 text-card-foreground"
            />
          </div>

          <div>
            <Label htmlFor="trigger">Trigger Condition</Label>
            <Input
              id="trigger"
              placeholder="e.g., refund_amount < 50 AND reason = 'defective'"
              className="bg-card border-zinc-700 font-mono text-sm"
            />
          </div>

          <div>
            <Label htmlFor="action">Action</Label>
            <Input
              id="action"
              placeholder="e.g., approve_refund"
              className="bg-card border-zinc-700 font-mono text-sm"
            />
          </div>

          <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
            <Zap className="w-4 h-4 mr-2" />
            Create Automation Rule
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
