import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  TrendingDown,
  Activity,
  Search,
  Settings,
  BarChart3,
  Clock,
} from "lucide-react";

/**
 * Fraud Detection System
 * ML-powered risk scoring, transaction monitoring, pattern recognition, automated blocking
 */

interface Transaction {
  id: string;
  orderId: string;
  customer: {
    name: string;
    email: string;
    accountAge: number;
  };
  amount: number;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  flags: string[];
  status: "pending" | "approved" | "blocked" | "review";
  timestamp: string;
  ipAddress: string;
  deviceFingerprint: string;
  billingAddress: string;
  shippingAddress: string;
}

interface FraudPattern {
  id: string;
  type: string;
  description: string;
  occurrences: number;
  lastDetected: string;
  severity: "low" | "medium" | "high";
}

interface BlockRule {
  id: string;
  name: string;
  condition: string;
  action: "block" | "review" | "flag";
  enabled: boolean;
  triggeredCount: number;
}

export default function FraudDetectionPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRisk, setFilterRisk] = useState<"all" | Transaction["riskLevel"]>("all");

  // Mock transactions
  const transactions: Transaction[] = [
    {
      id: "TXN-001",
      orderId: "ORD-12345",
      customer: {
        name: "John Suspicious",
        email: "john@temp-mail.com",
        accountAge: 2,
      },
      amount: 2499.99,
      riskScore: 85,
      riskLevel: "critical",
      flags: [
        "High transaction velocity",
        "Temporary email",
        "Billing/shipping mismatch",
        "Multiple failed payments",
      ],
      status: "blocked",
      timestamp: "2025-12-27T14:30:00Z",
      ipAddress: "192.168.1.100",
      deviceFingerprint: "abc123def456",
      billingAddress: "123 Main St, New York, NY",
      shippingAddress: "456 Oak Ave, Los Angeles, CA",
    },
    {
      id: "TXN-002",
      orderId: "ORD-12346",
      customer: {
        name: "Sarah Questionable",
        email: "sarah@example.com",
        accountAge: 5,
      },
      amount: 899.99,
      riskScore: 62,
      riskLevel: "high",
      flags: ["Unusual order quantity", "Geolocation mismatch"],
      status: "review",
      timestamp: "2025-12-27T15:00:00Z",
      ipAddress: "10.0.0.50",
      deviceFingerprint: "xyz789ghi012",
      billingAddress: "789 Elm St, Chicago, IL",
      shippingAddress: "789 Elm St, Chicago, IL",
    },
    {
      id: "TXN-003",
      orderId: "ORD-12347",
      customer: {
        name: "Michael Normal",
        email: "michael@gmail.com",
        accountAge: 365,
      },
      amount: 149.99,
      riskScore: 28,
      riskLevel: "low",
      flags: [],
      status: "approved",
      timestamp: "2025-12-27T15:30:00Z",
      ipAddress: "172.16.0.20",
      deviceFingerprint: "mno345pqr678",
      billingAddress: "321 Pine St, Seattle, WA",
      shippingAddress: "321 Pine St, Seattle, WA",
    },
  ];

  // Mock fraud patterns
  const patterns: FraudPattern[] = [
    {
      id: "PAT-001",
      type: "Card Testing",
      description: "Multiple small transactions from same IP",
      occurrences: 45,
      lastDetected: "2025-12-27T14:00:00Z",
      severity: "high",
    },
    {
      id: "PAT-002",
      type: "Account Takeover",
      description: "Login from unusual location after password change",
      occurrences: 12,
      lastDetected: "2025-12-27T12:30:00Z",
      severity: "critical",
    },
    {
      id: "PAT-003",
      type: "Velocity Abuse",
      description: "Rapid succession of orders from same account",
      occurrences: 28,
      lastDetected: "2025-12-27T16:00:00Z",
      severity: "medium",
    },
  ];

  // Mock block rules
  const blockRules: BlockRule[] = [
    {
      id: "RULE-001",
      name: "High-Value New Account",
      condition: "Order > $1000 AND Account age < 7 days",
      action: "review",
      enabled: true,
      triggeredCount: 156,
    },
    {
      id: "RULE-002",
      name: "Multiple Failed Payments",
      condition: "Failed payments > 3 in 24 hours",
      action: "block",
      enabled: true,
      triggeredCount: 89,
    },
    {
      id: "RULE-003",
      name: "Temporary Email Domain",
      condition: "Email domain in blacklist",
      action: "flag",
      enabled: true,
      triggeredCount: 234,
    },
    {
      id: "RULE-004",
      name: "Billing/Shipping Mismatch",
      condition: "Billing and shipping addresses in different states",
      action: "review",
      enabled: true,
      triggeredCount: 412,
    },
  ];

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      searchQuery === "" ||
      t.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = filterRisk === "all" || t.riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const totalTransactions = transactions.length;
  const blockedCount = transactions.filter((t) => t.status === "blocked").length;
  const reviewCount = transactions.filter((t) => t.status === "review").length;
  const avgRiskScore = transactions.reduce((sum, t) => sum + t.riskScore, 0) / transactions.length;

  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-500/20 text-red-400";
      case "high":
        return "bg-orange-500/20 text-orange-400";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400";
      case "low":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "blocked":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "review":
        return <Eye className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-400";
      case "high":
        return "text-orange-400";
      case "medium":
        return "text-yellow-400";
      default:
        return "text-green-400";
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Fraud Detection</h1>
          <p className="text-muted-foreground">
            ML-powered risk scoring and real-time transaction monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configure Rules
          </Button>
          <Button>
            <BarChart3 className="w-4 h-4 mr-2" />
            View Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Transactions Today</p>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{totalTransactions}</p>
          <p className="text-xs text-muted-foreground">Real-time monitoring</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Blocked</p>
            <Ban className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{blockedCount}</p>
          <p className="text-xs text-red-500">
            {((blockedCount / totalTransactions) * 100).toFixed(1)}% of total
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Under Review</p>
            <Eye className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{reviewCount}</p>
          <p className="text-xs text-yellow-500">Requires manual review</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Avg Risk Score</p>
            <Shield className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{avgRiskScore.toFixed(0)}</p>
          <p className="text-xs text-green-500">-12% from last week</p>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="transactions">
            <Activity className="w-4 h-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="patterns">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Fraud Patterns
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Settings className="w-4 h-4 mr-2" />
            Block Rules
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by order ID, customer name, or email..."
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={filterRisk === "all" ? "default" : "outline"}
                  onClick={() => setFilterRisk("all")}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={filterRisk === "critical" ? "default" : "outline"}
                  onClick={() => setFilterRisk("critical")}
                >
                  Critical
                </Button>
                <Button
                  size="sm"
                  variant={filterRisk === "high" ? "default" : "outline"}
                  onClick={() => setFilterRisk("high")}
                >
                  High
                </Button>
                <Button
                  size="sm"
                  variant={filterRisk === "medium" ? "default" : "outline"}
                  onClick={() => setFilterRisk("medium")}
                >
                  Medium
                </Button>
                <Button
                  size="sm"
                  variant={filterRisk === "low" ? "default" : "outline"}
                  onClick={() => setFilterRisk("low")}
                >
                  Low
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <Card key={transaction.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(transaction.status)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold">{transaction.orderId}</h3>
                          <Badge className={getRiskColor(transaction.riskLevel)}>
                            {transaction.riskLevel} risk
                          </Badge>
                          <Badge variant="outline">{transaction.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {transaction.customer.name} • {transaction.customer.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${transaction.amount}</p>
                      <p className="text-sm text-muted-foreground">
                        Risk Score: {transaction.riskScore}/100
                      </p>
                    </div>
                  </div>

                  {/* Risk Score Bar */}
                  <div className="mb-4">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          transaction.riskScore >= 75
                            ? "bg-red-500"
                            : transaction.riskScore >= 50
                            ? "bg-orange-500"
                            : transaction.riskScore >= 25
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${transaction.riskScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Risk Flags */}
                  {transaction.flags.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        Risk Factors:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {transaction.flags.map((flag, index) => (
                          <Badge key={index} className="bg-red-500/20 text-red-400">
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transaction Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
                    <div>
                      <p className="text-muted-foreground mb-1">Account Age</p>
                      <p className="font-medium">{transaction.customer.accountAge} days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">IP Address</p>
                      <p className="font-medium">{transaction.ipAddress}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Billing Address</p>
                      <p className="font-medium">{transaction.billingAddress}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Shipping Address</p>
                      <p className="font-medium">{transaction.shippingAddress}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  {transaction.status === "review" && (
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button size="sm" variant="default">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive">
                        <XCircle className="w-4 h-4 mr-2" />
                        Block
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Fraud Patterns Tab */}
        <TabsContent value="patterns">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Detected Fraud Patterns</h2>

            <div className="space-y-4">
              {patterns.map((pattern) => (
                <Card key={pattern.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`w-6 h-6 ${getSeverityColor(pattern.severity)}`} />
                      <div>
                        <h3 className="text-lg font-bold">{pattern.type}</h3>
                        <p className="text-sm text-muted-foreground">{pattern.description}</p>
                      </div>
                    </div>
                    <Badge className={getRiskColor(pattern.severity === "critical" ? "critical" : pattern.severity)}>
                      {pattern.severity}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Occurrences</p>
                      <p className="text-2xl font-bold">{pattern.occurrences}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Last Detected</p>
                      <p className="font-medium">{new Date(pattern.lastDetected).toLocaleString()}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Block Rules Tab */}
        <TabsContent value="rules">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Automated Block Rules</h2>
              <Button>
                <Settings className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </div>

            <div className="space-y-4">
              {blockRules.map((rule) => (
                <Card key={rule.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold">{rule.name}</h3>
                        {rule.enabled ? (
                          <Badge className="bg-green-500/20 text-green-400">Enabled</Badge>
                        ) : (
                          <Badge className="bg-gray-500/20 text-gray-400">Disabled</Badge>
                        )}
                        <Badge variant="outline">{rule.action}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{rule.condition}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Triggered {rule.triggeredCount} times
                    </span>
                    <Button size="sm" variant={rule.enabled ? "outline" : "default"}>
                      {rule.enabled ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
