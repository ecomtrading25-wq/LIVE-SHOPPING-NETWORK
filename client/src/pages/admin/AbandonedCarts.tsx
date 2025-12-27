import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Mail,
  TrendingUp,
  DollarSign,
  Send,
} from "lucide-react";

export default function AbandonedCartsPage() {
  const stats = {
    totalAbandoned: 1247,
    recoveryRate: 18.5,
    revenueRecovered: 45890,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Abandoned Cart Recovery</h1>
        <p className="text-muted-foreground">
          Automated campaigns to recover lost sales
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Abandoned</p>
            <ShoppingCart className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold">{stats.totalAbandoned}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Recovery Rate</p>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold">{stats.recoveryRate}%</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Revenue Recovered</p>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold">${stats.revenueRecovered.toLocaleString()}</p>
        </Card>
      </div>
    </div>
  );
}
