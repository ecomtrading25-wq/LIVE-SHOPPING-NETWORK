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
          className="text-gray-300 hover:text-white hover:bg-white/10"
        >
          <Activity className="w-4 h-4 mr-2" />
          Admin
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800">
        <DropdownMenuLabel className="text-gray-400">Admin Tools</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-800" />
        
        <Link href="/analytics">
          <DropdownMenuItem className="cursor-pointer text-gray-300 hover:text-white hover:bg-white/10">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics Dashboard
          </DropdownMenuItem>
        </Link>
        
        <Link href="/inventory">
          <DropdownMenuItem className="cursor-pointer text-gray-300 hover:text-white hover:bg-white/10">
            <Package className="w-4 h-4 mr-2" />
            Inventory Management
          </DropdownMenuItem>
        </Link>
        
        <Link href="/email-campaigns">
          <DropdownMenuItem className="cursor-pointer text-gray-300 hover:text-white hover:bg-white/10">
            <Mail className="w-4 h-4 mr-2" />
            Email Campaigns
          </DropdownMenuItem>
        </Link>
        
        <Link href="/supplier-portal">
          <DropdownMenuItem className="cursor-pointer text-gray-300 hover:text-white hover:bg-white/10">
            <Truck className="w-4 h-4 mr-2" />
            Supplier Portal
          </DropdownMenuItem>
        </Link>
        
        <Link href="/live-sessions">
          <DropdownMenuItem className="cursor-pointer text-gray-300 hover:text-white hover:bg-white/10">
            <Video className="w-4 h-4 mr-2" />
            Live Sessions
          </DropdownMenuItem>
        </Link>
        
        <DropdownMenuSeparator className="bg-gray-800" />
        
        <Link href="/operations-center">
          <DropdownMenuItem className="cursor-pointer text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
            <Activity className="w-4 h-4 mr-2" />
            Operations Center
          </DropdownMenuItem>
        </Link>
        
        <Link href="/referral-dashboard">
          <DropdownMenuItem className="cursor-pointer text-gray-300 hover:text-white hover:bg-white/10">
            <Gift className="w-4 h-4 mr-2" />
            Referral Program
          </DropdownMenuItem>
        </Link>
        
        <Link href="/admin">
          <DropdownMenuItem className="cursor-pointer text-gray-300 hover:text-white hover:bg-white/10">
            <Users className="w-4 h-4 mr-2" />
            User Management
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
