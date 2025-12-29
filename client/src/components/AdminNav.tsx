import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart3,
  Package,
  Mail,
  Truck,
  Activity,
  Users,
  Gift,
  Video,
  Brain,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  MessageSquare,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminNav() {
  const { user } = useAuth();

  // Only show admin nav for admin users
  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground hover:bg-white/10"
        >
          <Activity className="w-4 h-4 mr-2" />
          Admin
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background border-border text-foreground">
        <DropdownMenuLabel className="text-gray-400">Admin Tools</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-card text-card-foreground" />
        
        <Link href="/analytics">
          <DropdownMenuItem className="cursor-pointer text-muted-foreground hover:text-foreground hover:bg-white/10">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics Dashboard
          </DropdownMenuItem>
        </Link>
        
        <Link href="/inventory">
          <DropdownMenuItem className="cursor-pointer text-muted-foreground hover:text-foreground hover:bg-white/10">
            <Package className="w-4 h-4 mr-2" />
            Inventory Management
          </DropdownMenuItem>
        </Link>
        
        <Link href="/email-campaigns">
          <DropdownMenuItem className="cursor-pointer text-muted-foreground hover:text-foreground hover:bg-white/10">
            <Mail className="w-4 h-4 mr-2" />
            Email Campaigns
          </DropdownMenuItem>
        </Link>
        
        <Link href="/supplier-portal">
          <DropdownMenuItem className="cursor-pointer text-muted-foreground hover:text-foreground hover:bg-white/10">
            <Truck className="w-4 h-4 mr-2" />
            Supplier Portal
          </DropdownMenuItem>
        </Link>
        
        <Link href="/live-sessions">
          <DropdownMenuItem className="cursor-pointer text-muted-foreground hover:text-foreground hover:bg-white/10">
            <Video className="w-4 h-4 mr-2" />
            Live Sessions
          </DropdownMenuItem>
        </Link>
        
        <DropdownMenuSeparator className="bg-card text-card-foreground" />
        <DropdownMenuLabel className="text-gray-400">AI Analytics</DropdownMenuLabel>
        
        <Link href="/admin/demand-forecast">
          <DropdownMenuItem className="cursor-pointer text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
            <Brain className="w-4 h-4 mr-2" />
            Demand Forecast
          </DropdownMenuItem>
        </Link>
        
        <Link href="/admin/churn-risk">
          <DropdownMenuItem className="cursor-pointer text-orange-400 hover:text-orange-300 hover:bg-orange-500/10">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Churn Risk Analysis
          </DropdownMenuItem>
        </Link>
        
        <Link href="/admin/pricing-optimization">
          <DropdownMenuItem className="cursor-pointer text-green-400 hover:text-green-300 hover:bg-green-500/10">
            <DollarSign className="w-4 h-4 mr-2" />
            Pricing Optimization
          </DropdownMenuItem>
        </Link>
        
        <Link href="/admin/sentiment-analysis">
          <DropdownMenuItem className="cursor-pointer text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
            <MessageSquare className="w-4 h-4 mr-2" />
            Sentiment Analysis
          </DropdownMenuItem>
        </Link>
        
        <Link href="/admin/revenue-forecast">
          <DropdownMenuItem className="cursor-pointer text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
            <TrendingUp className="w-4 h-4 mr-2" />
            Revenue Forecast
          </DropdownMenuItem>
        </Link>
        
        <Link href="/admin/rfm-segmentation">
          <DropdownMenuItem className="cursor-pointer text-pink-400 hover:text-pink-300 hover:bg-pink-500/10">
            <PieChart className="w-4 h-4 mr-2" />
            RFM Segmentation
          </DropdownMenuItem>
        </Link>
        
        <DropdownMenuSeparator className="bg-card text-card-foreground" />
        
        <Link href="/operations-center">
          <DropdownMenuItem className="cursor-pointer text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
            <Activity className="w-4 h-4 mr-2" />
            Operations Center
          </DropdownMenuItem>
        </Link>
        
        <Link href="/referral-dashboard">
          <DropdownMenuItem className="cursor-pointer text-muted-foreground hover:text-foreground hover:bg-white/10">
            <Gift className="w-4 h-4 mr-2" />
            Referral Program
          </DropdownMenuItem>
        </Link>
        
        <Link href="/admin">
          <DropdownMenuItem className="cursor-pointer text-muted-foreground hover:text-foreground hover:bg-white/10">
            <Users className="w-4 h-4 mr-2" />
            User Management
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
