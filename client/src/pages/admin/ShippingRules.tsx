import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Play, Save, X } from "lucide-react";
import { toast } from "sonner";

interface ShippingRuleCondition {
  type: "order_value" | "weight" | "destination_country" | "destination_state" | "product_category" | "customer_tier";
  operator: ">" | "<" | "=" | ">=" | "<=" | "in" | "not_in";
  value: any;
}

interface ShippingRuleAction {
  type: "free_shipping" | "select_carrier" | "add_surcharge" | "require_signature" | "insurance";
  value: any;
}

interface ShippingRule {
  id: string;
  name: string;
  priority: number;
  conditions: ShippingRuleCondition[];
  actions: ShippingRuleAction[];
  enabled: boolean;
}

export default function ShippingRules() {
  const [rules, setRules] = useState<ShippingRule[]>([
    {
      id: "1",
      name: "Free Shipping Over $50",
      priority: 1,
      conditions: [{ type: "order_value", operator: ">=", value: 50 }],
      actions: [{ type: "free_shipping", value: true }],
      enabled: true,
    },
    {
      id: "2",
      name: "UPS Ground for Heavy Items",
      priority: 2,
      conditions: [{ type: "weight", operator: ">", value: 10 }],
      actions: [{ type: "select_carrier", value: "UPS Ground" }],
      enabled: true,
    },
    {
      id: "3",
      name: "DHL Express for International",
      priority: 3,
      conditions: [{ type: "destination_country", operator: "not_in", value: ["US", "CA"] }],
      actions: [{ type: "select_carrier", value: "DHL Express" }],
      enabled: true,
    },
  ]);

  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateRule = () => {
    setEditingRule({
      id: "",
      name: "",
      priority: rules.length + 1,
      conditions: [],
      actions: [],
      enabled: true,
    });
    setShowCreateForm(true);
  };

  const handleSaveRule = () => {
    if (!editingRule) return;

    if (editingRule.id) {
      // Update existing rule
      setRules(rules.map((r) => (r.id === editingRule.id ? editingRule : r)));
      toast.success("Rule updated successfully");
    } else {
      // Create new rule
      const newRule = { ...editingRule, id: Date.now().toString() };
      setRules([...rules, newRule]);
      toast.success("Rule created successfully");
    }

    setEditingRule(null);
    setShowCreateForm(false);
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
    toast.success("Rule deleted");
  };

  const handleToggleRule = (id: string) => {
    setRules(
      rules.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      )
    );
    toast.success("Rule status updated");
  };

  const handleTestRule = (rule: ShippingRule) => {
    toast.info(`Testing rule: ${rule.name}`, {
      description: "Sample order: $75, 5lbs, US",
    });
  };

  const addCondition = () => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      conditions: [
        ...editingRule.conditions,
        { type: "order_value", operator: ">=", value: 0 },
      ],
    });
  };

  const addAction = () => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      actions: [
        ...editingRule.actions,
        { type: "free_shipping", value: true },
      ],
    });
  };

  const removeCondition = (index: number) => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      conditions: editingRule.conditions.filter((_, i) => i !== index),
    });
  };

  const removeAction = (index: number) => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      actions: editingRule.actions.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Shipping Rules</h2>
          <p className="text-muted-foreground mt-1">
            Automate shipping decisions with conditional logic
          </p>
        </div>
        <Button onClick={handleCreateRule}>
          <Plus className="mr-2 h-4 w-4" />
          Create Rule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Active Rules</div>
          <div className="text-2xl font-bold">{rules.filter((r) => r.enabled).length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Savings</div>
          <div className="text-2xl font-bold">$15,420</div>
          <div className="text-xs text-green-600">↑ 23% from last month</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Free Shipping Orders</div>
          <div className="text-2xl font-bold">342</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Avg Savings/Order</div>
          <div className="text-2xl font-bold">$45.09</div>
        </Card>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingRule) && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingRule?.id ? "Edit Rule" : "Create New Rule"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingRule(null);
                  setShowCreateForm(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4">
              <div>
                <Label>Rule Name</Label>
                <Input
                  value={editingRule?.name || ""}
                  onChange={(e) =>
                    setEditingRule(
                      editingRule ? { ...editingRule, name: e.target.value } : null
                    )
                  }
                  placeholder="e.g., Free Shipping Over $50"
                />
              </div>

              <div>
                <Label>Priority (lower = higher priority)</Label>
                <Input
                  type="number"
                  value={editingRule?.priority || 0}
                  onChange={(e) =>
                    setEditingRule(
                      editingRule
                        ? { ...editingRule, priority: parseInt(e.target.value) }
                        : null
                    )
                  }
                />
              </div>

              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Conditions (ALL must match)</Label>
                  <Button size="sm" variant="outline" onClick={addCondition}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Condition
                  </Button>
                </div>
                <div className="space-y-2">
                  {editingRule?.conditions.map((condition, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        className="flex-1 border rounded px-2 py-1"
                        value={condition.type}
                        onChange={(e) => {
                          const newConditions = [...editingRule.conditions];
                          newConditions[index].type = e.target.value as any;
                          setEditingRule({ ...editingRule, conditions: newConditions });
                        }}
                      >
                        <option value="order_value">Order Value</option>
                        <option value="weight">Weight (lbs)</option>
                        <option value="destination_country">Destination Country</option>
                        <option value="destination_state">Destination State</option>
                        <option value="product_category">Product Category</option>
                        <option value="customer_tier">Customer Tier</option>
                      </select>
                      <select
                        className="border rounded px-2 py-1"
                        value={condition.operator}
                        onChange={(e) => {
                          const newConditions = [...editingRule.conditions];
                          newConditions[index].operator = e.target.value as any;
                          setEditingRule({ ...editingRule, conditions: newConditions });
                        }}
                      >
                        <option value=">">{">"}</option>
                        <option value="<">{"<"}</option>
                        <option value="=">=</option>
                        <option value=">=">{">="}</option>
                        <option value="<=">{"<="}</option>
                        <option value="in">in</option>
                        <option value="not_in">not in</option>
                      </select>
                      <Input
                        className="flex-1"
                        value={condition.value}
                        onChange={(e) => {
                          const newConditions = [...editingRule.conditions];
                          newConditions[index].value = e.target.value;
                          setEditingRule({ ...editingRule, conditions: newConditions });
                        }}
                        placeholder="Value"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCondition(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Actions (ALL will be applied)</Label>
                  <Button size="sm" variant="outline" onClick={addAction}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Action
                  </Button>
                </div>
                <div className="space-y-2">
                  {editingRule?.actions.map((action, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        className="flex-1 border rounded px-2 py-1"
                        value={action.type}
                        onChange={(e) => {
                          const newActions = [...editingRule.actions];
                          newActions[index].type = e.target.value as any;
                          setEditingRule({ ...editingRule, actions: newActions });
                        }}
                      >
                        <option value="free_shipping">Free Shipping</option>
                        <option value="select_carrier">Select Carrier</option>
                        <option value="add_surcharge">Add Surcharge</option>
                        <option value="require_signature">Require Signature</option>
                        <option value="insurance">Add Insurance</option>
                      </select>
                      {action.type !== "free_shipping" &&
                        action.type !== "require_signature" &&
                        action.type !== "insurance" && (
                          <Input
                            className="flex-1"
                            value={action.value}
                            onChange={(e) => {
                              const newActions = [...editingRule.actions];
                              newActions[index].value = e.target.value;
                              setEditingRule({ ...editingRule, actions: newActions });
                            }}
                            placeholder={
                              action.type === "select_carrier"
                                ? "e.g., UPS Ground"
                                : "e.g., 5.00"
                            }
                          />
                        )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeAction(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveRule}>
                <Save className="mr-2 h-4 w-4" />
                Save Rule
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingRule(null);
                  setShowCreateForm(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <Card key={rule.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{rule.name}</h3>
                  <Badge variant={rule.enabled ? "default" : "secondary"}>
                    {rule.enabled ? "Active" : "Disabled"}
                  </Badge>
                  <Badge variant="outline">Priority: {rule.priority}</Badge>
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  <div>
                    <strong>Conditions:</strong>{" "}
                    {rule.conditions.map((c, i) => (
                      <span key={i}>
                        {i > 0 && " AND "}
                        {c.type} {c.operator} {JSON.stringify(c.value)}
                      </span>
                    ))}
                  </div>
                  <div>
                    <strong>Actions:</strong>{" "}
                    {rule.actions.map((a, i) => (
                      <span key={i}>
                        {i > 0 && ", "}
                        {a.type}
                        {a.value && ` (${a.value})`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestRule(rule)}
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingRule(rule)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleRule(rule.id)}
                >
                  {rule.enabled ? "Disable" : "Enable"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteRule(rule.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Top Performing Rules */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Performing Rules</h3>
        <div className="space-y-3">
          {[
            { name: "Free Shipping Over $50", applied: 1250, savings: "$8,750" },
            { name: "UPS Ground for Heavy Items", applied: 420, savings: "$2,100" },
            { name: "DHL Express for International", applied: 180, savings: "$1,800" },
          ].map((stat, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{stat.name}</div>
                <div className="text-sm text-muted-foreground">
                  Applied {stat.applied} times
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-600">{stat.savings}</div>
                <div className="text-xs text-muted-foreground">Total Savings</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
