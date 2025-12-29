import { useState } from "react";
import { Link, Route, Switch, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Video,
  Users,
  DollarSign,
  AlertCircle,
  Settings,
  TrendingUp,
  Menu,
  X,
  Building2,
  BarChart3,
  Upload,
  RotateCcw,
  Activity,
  FileText,
  Zap,
  Bot,
  Globe,
  Headphones,
  TruckIcon,
  Mail,
  Shield,
  Users as UsersIcon,
  Target,
  MessageCircle,
  RefreshCw,
  Users as UsersIcon2,
  FileText as FileTextIcon,
  Brain as BrainIcon,
  Star,
} from "lucide-react";

/**
 * Live Shopping Network - Admin Dashboard
 * Comprehensive operations command center
 */

export default function AdminDashboard() {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <AdminProtectedRoute>
      <AdminDashboardContent location={location} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
    </AdminProtectedRoute>
  );
}

function AdminDashboardContent({ location, sidebarOpen, setSidebarOpen }: { location: string; sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }) {

  // Fetch dashboard metrics
  const { data: dashboard } = trpc.operations.dashboard.useQuery(undefined, {
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const navItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
    { path: "/admin/channels", icon: TrendingUp, label: "Channels" },
    { path: "/admin/products", icon: Package, label: "Products" },
    { path: "/admin/orders", icon: ShoppingCart, label: "Orders" },
    { path: "/admin/fulfillment", icon: Warehouse, label: "Fulfillment" },
    { path: "/admin/live", icon: Video, label: "Live Shopping" },
    { path: "/admin/creators", icon: Users, label: "Creators" },
    { path: "/admin/disputes", icon: AlertCircle, label: "Disputes" },
    { path: "/admin/settlements", icon: DollarSign, label: "Settlements" },
    { path: "/admin/warehouse", icon: Warehouse, label: "Warehouse" },
    { path: "/admin/suppliers", icon: Building2, label: "Suppliers" },
    { path: "/admin/inventory-forecasting", icon: TrendingUp, label: "Forecasting" },
    { path: "/admin/dynamic-pricing", icon: DollarSign, label: "Dynamic Pricing" },
    { path: "/admin/flash-sales", icon: Zap, label: "Flash Sales" },
    { path: "/admin/automation", icon: Bot, label: "Automation" },
    { path: "/admin/customer-segments", icon: Users, label: "Customer Segments" },
    { path: "/admin/campaigns", icon: TrendingUp, label: "Campaigns" },
    { path: "/admin/affiliates", icon: Users, label: "Affiliates" },
    { path: "/admin/dropshipping", icon: Package, label: "Dropshipping" },
    { path: "/admin/shipping-rules", icon: TrendingUp, label: "Shipping Rules" },
    { path: "/admin/advanced-orders", icon: ShoppingCart, label: "Advanced Orders" },
    { path: "/admin/live-scheduler", icon: Video, label: "Live Scheduler" },
    { path: "/admin/advanced-analytics", icon: BarChart3, label: "Advanced Analytics" },
    { path: "/admin/fulfillment-automation", icon: Warehouse, label: "Fulfillment Automation" },
    { path: "/admin/inventory-ai", icon: BrainIcon, label: "Inventory AI" },
    { path: "/admin/global-expansion", icon: Globe, label: "Global Expansion" },
    { path: "/admin/customer-service", icon: Headphones, label: "Customer Service" },
    { path: "/admin/supply-chain", icon: TruckIcon, label: "Supply Chain" },
    { path: "/admin/marketing-automation", icon: Mail, label: "Marketing Automation" },
    { path: "/admin/fraud-detection", icon: Shield, label: "Fraud Detection" },
    { path: "/admin/customer-360", icon: UsersIcon, label: "Customer 360" },
    { path: "/admin/competitive-intel", icon: Target, label: "Competitive Intel" },
    { path: "/admin/communications", icon: MessageCircle, label: "Communications" },
    { path: "/admin/returns-automation", icon: RefreshCw, label: "Returns Automation" },
    { path: "/admin/affiliate-program", icon: UsersIcon2, label: "Affiliate Program" },
    { path: "/admin/cms", icon: FileTextIcon, label: "CMS" },
    { path: "/admin/bi-suite", icon: BrainIcon, label: "BI Suite" },
    { path: "/admin/live-studio", icon: Video, label: "Live Studio" },
    { path: "/admin/customer-feedback", icon: Star, label: "Customer Feedback" },
    { path: "/admin/notification-system", icon: Bell, label: "Notifications" },
    { path: "/admin/product-tagging", icon: Tag, label: "Product Tagging" },
    { path: "/admin/abandoned-carts", icon: ShoppingCart, label: "Abandoned Carts" },
    { path: "/admin/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/admin/performance", icon: Activity, label: "Performance" },
    { path: "/admin/reports", icon: FileText, label: "Reports" },
    { path: "/admin/bulk-import", icon: Upload, label: "Bulk Import" },
    { path: "/admin/users", icon: Users, label: "Users" },
    { path: "/admin/returns", icon: RotateCcw, label: "Returns" },
    { path: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location === path;
    }
    return location.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-background text-foreground border-r border-border transition-all duration-300 z-50 ${
          sidebarOpen ? "w-64" : "w-0"
        } overflow-hidden`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold text-foreground">LSN Admin</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);

              return (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      active
                        ? "bg-red-600 text-foreground"
                        : "text-gray-400 hover:bg-card hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </a>
                </Link>
              );
            })}
          </nav>

          {/* Alert Badges */}
          {dashboard && (
            <div className="mt-8 space-y-3">
              {dashboard.openDisputes > 0 && (
                <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-400">Open Disputes</span>
                    <Badge className="bg-red-600">{dashboard.openDisputes}</Badge>
                  </div>
                </div>
              )}

              {dashboard.openIncidents > 0 && (
                <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-yellow-400">Incidents</span>
                    <Badge className="bg-yellow-600">{dashboard.openIncidents}</Badge>
                  </div>
                </div>
              )}

              {dashboard.openTasks > 0 && (
                <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-400">Open Tasks</span>
                    <Badge className="bg-blue-600">{dashboard.openTasks}</Badge>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "ml-0"
        }`}
      >
        {/* Top Bar */}
        <header className="bg-background border-b border-border px-6 py-4 text-foreground">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-foreground"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4">
              <Badge className="bg-green-600">
                <span className="inline-block w-2 h-2 bg-background text-foreground rounded-full mr-2 animate-pulse"></span>
                System Online
              </Badge>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Switch>
            <Route path="/admin" component={DashboardOverview} />
            <Route path="/admin/channels" component={ChannelsPage} />
            <Route path="/admin/products" component={ProductsPage} />
            <Route path="/admin/orders" component={OrdersPage} />
            <Route path="/admin/fulfillment" component={FulfillmentPage} />
            <Route path="/admin/live" component={LiveShoppingPage} />
            <Route path="/admin/creators" component={CreatorsPage} />
            <Route path="/admin/disputes" component={DisputesPage} />
            <Route path="/admin/settlements" component={SettlementsPage} />
            <Route path="/admin/warehouse" component={WarehousePage} />
            <Route path="/admin/suppliers" component={SuppliersPage} />
            <Route path="/admin/analytics" component={AnalyticsPage} />
            <Route path="/admin/performance" component={PerformancePage} />
            <Route path="/admin/reports" component={ReportsPage} />
            <Route path="/admin/inventory-forecasting" component={InventoryForecastingPage} />
            <Route path="/admin/dynamic-pricing" component={DynamicPricingPage} />
            <Route path="/admin/flash-sales" component={FlashSalesPage} />
            <Route path="/admin/automation" component={AutomationPage} />
            <Route path="/admin/customer-segments" component={CustomerSegmentsPage} />
            <Route path="/admin/campaigns" component={CampaignsPage} />
            <Route path="/admin/affiliates" component={AffiliatesPage} />
            <Route path="/admin/dropshipping" component={DropshippingPage} />
            <Route path="/admin/shipping-rules" component={ShippingRulesPage} />
            <Route path="/admin/advanced-orders" component={AdvancedOrdersPage} />
            <Route path="/admin/live-scheduler" component={LiveSchedulerPage} />
            <Route path="/admin/advanced-analytics" component={AdvancedAnalyticsPage} />
            <Route path="/admin/fulfillment-automation" component={FulfillmentAutomationPage} />
            <Route path="/admin/inventory-ai" component={InventoryAIPage} />
            <Route path="/admin/global-expansion" component={GlobalExpansionPage} />
            <Route path="/admin/customer-service" component={CustomerServicePage} />
            <Route path="/admin/supply-chain" component={SupplyChainPage} />
            <Route path="/admin/marketing-automation" component={MarketingAutomationPage} />
            <Route path="/admin/fraud-detection" component={FraudDetectionPage} />
            <Route path="/admin/customer-360" component={Customer360Page} />
            <Route path="/admin/competitive-intel" component={CompetitiveIntelPage} />
            <Route path="/admin/communications" component={CommunicationsPage} />
            <Route path="/admin/returns-automation" component={ReturnsAutomationPage} />
            <Route path="/admin/affiliate-program" component={AffiliateProgramPage} />
            <Route path="/admin/cms" component={CMSPage} />
            <Route path="/admin/bi-suite" component={BISuitePage} />
            <Route path="/admin/live-studio" component={LiveStudioPage} />
            <Route path="/admin/customer-feedback" component={CustomerFeedbackPage} />
            <Route path="/admin/notification-system" component={NotificationSystemPage} />
            <Route path="/admin/product-tagging" component={ProductTaggingPage} />
            <Route path="/admin/abandoned-carts" component={AbandonedCartsPage} />
            <Route path="/admin/bulk-import" component={BulkImportPage} />
            <Route path="/admin/users" component={UsersPage} />
            <Route path="/admin/returns" component={ReturnsPage} />
            <Route path="/admin/settings" component={SettingsPage} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

// Dashboard Overview Component
function DashboardOverview() {
  const { data: dashboard } = trpc.operations.dashboard.useQuery();
  const { data: analytics } = trpc.analytics.overview.useQuery({});

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Operations Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-background border-border text-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pending Orders</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {dashboard?.pendingOrders || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-background border-border text-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Open Disputes</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {dashboard?.openDisputes || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-background border-border text-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Open Tasks</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {dashboard?.openTasks || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-background border-border text-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Revenue</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                ${analytics?.totalRevenue || "0.00"}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-background border-border text-foreground">
        <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/live">
            <Button className="w-full" variant="outline">
              <Video className="w-4 h-4 mr-2" />
              Start Live Show
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button className="w-full" variant="outline">
              <Package className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button className="w-full" variant="outline">
              <ShoppingCart className="w-4 h-4 mr-2" />
              View Orders
            </Button>
          </Link>
          <Link href="/admin/disputes">
            <Button className="w-full" variant="outline">
              <AlertCircle className="w-4 h-4 mr-2" />
              Review Disputes
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

// Import actual Channels page
import ChannelsPageComponent from "./admin/Channels";

function ChannelsPage() {
  return <ChannelsPageComponent />;
}

import ProductsPageComponent from "./admin/Products";

function ProductsPage() {
  return <ProductsPageComponent />;
}

import OrdersPageComponent from "./admin/Orders";

function OrdersPage() {
  return <OrdersPageComponent />;
}

import FulfillmentPageComponent from "./admin/Fulfillment";

function FulfillmentPage() {
  return <FulfillmentPageComponent />;
}

import LiveShoppingPageComponent from "./admin/LiveShopping";

function LiveShoppingPage() {
  return <LiveShoppingPageComponent />;
}

import CreatorsPageComponent from "./admin/Creators";

function CreatorsPage() {
  return <CreatorsPageComponent />;
}

import DisputesPageComponent from "./admin/Disputes";

function DisputesPage() {
  return <DisputesPageComponent />;
}

import SettlementsPageComponent from "./admin/Settlements";
import WarehousePageComponent from "./admin/Warehouse";
import SuppliersPageComponent from "./admin/Suppliers";
import AnalyticsPageComponent from "./admin/Analytics";

function SettlementsPage() {
  return <SettlementsPageComponent />;
}

function WarehousePage() {
  return <WarehousePageComponent />;
}

function SuppliersPage() {
  return <SuppliersPageComponent />;
}

function AnalyticsPage() {
  return <AnalyticsPageComponent />;
}

import SettingsPageComponent from "./admin/Settings";
import BulkImportPageComponent from "./admin/BulkImport";
import UsersPageComponent from "./admin/Users";
import ReturnsPageComponent from "./admin/Returns";
import PerformancePageComponent from "./admin/Performance";
import ReportsPageComponent from "./admin/Reports";
import InventoryForecastingPageComponent from "./admin/InventoryForecasting";
import DynamicPricingPageComponent from "./admin/DynamicPricing";
import FlashSalesPageComponent from "./admin/FlashSales";
import AutomationPageComponent from "./admin/Automation";
import CustomerSegmentsPageComponent from "./admin/CustomerSegments";
import CampaignsPageComponent from "./admin/Campaigns";
import AffiliatesPageComponent from "./admin/Affiliates";
import DropshippingPageComponent from "./admin/Dropshipping";
import ShippingRulesPageComponent from "./admin/ShippingRules";

function BulkImportPage() {
  return <BulkImportPageComponent />;
}

function SettingsPage() {
  return <SettingsPageComponent />;
}

function UsersPage() {
  return <UsersPageComponent />;
}

function ReturnsPage() {
  return <ReturnsPageComponent />;
}

function PerformancePage() {
  return <PerformancePageComponent />;
}

function ReportsPage() {
  return <ReportsPageComponent />;
}

function InventoryForecastingPage() {
  return <InventoryForecastingPageComponent />;
}

function DynamicPricingPage() {
  return <DynamicPricingPageComponent />;
}

function FlashSalesPage() {
  return <FlashSalesPageComponent />;
}

function AutomationPage() {
  return <AutomationPageComponent />;
}

function CustomerSegmentsPage() {
  return <CustomerSegmentsPageComponent />;
}

function CampaignsPage() {
  return <CampaignsPageComponent />;
}

function AffiliatesPage() {
  return <AffiliatesPageComponent />;
}

function DropshippingPage() {
  return <DropshippingPageComponent />;
}

function ShippingRulesPage() {
  return <ShippingRulesPageComponent />;
}

import AdvancedOrdersPageComponent from "./admin/AdvancedOrders";

function AdvancedOrdersPage() {
  return <AdvancedOrdersPageComponent />;
}

import LiveSchedulerPageComponent from "./admin/LiveScheduler";

function LiveSchedulerPage() {
  return <LiveSchedulerPageComponent />;
}

import AdvancedAnalyticsPageComponent from "./admin/AdvancedAnalytics";

function AdvancedAnalyticsPage() {
  return <AdvancedAnalyticsPageComponent />;
}

import FulfillmentAutomationPageComponent from "./admin/FulfillmentAutomation";
import InventoryAIPageComponent from "./admin/InventoryAI";
import GlobalExpansionPageComponent from "./admin/GlobalExpansion";
import CustomerServicePageComponent from "./admin/CustomerService";
import SupplyChainPageComponent from "./admin/SupplyChain";
import MarketingAutomationPageComponent from "./admin/MarketingAutomation";
import FraudDetectionPageComponent from "./admin/FraudDetection";
import Customer360PageComponent from "./admin/Customer360";
import CompetitiveIntelPageComponent from "./admin/CompetitiveIntel";
import CommunicationsPageComponent from "./admin/Communications";
import ReturnsAutomationPageComponent from "./admin/ReturnsAutomation";
import AffiliateProgramPageComponent from "./admin/AffiliateProgram";
import CMSPageComponent from "./admin/CMS";
import BISuitePageComponent from "./admin/BISuite";
import LiveStudioPageComponent from "./admin/LiveStudio";
import CustomerFeedbackPageComponent from "./admin/CustomerFeedback";
import NotificationSystemPageComponent from "./admin/NotificationSystem";
import ProductTaggingPageComponent from "./admin/ProductTagging";
import AbandonedCartsPageComponent from "./admin/AbandonedCarts";

function FulfillmentAutomationPage() {
  return <FulfillmentAutomationPageComponent />;
}

function InventoryAIPage() {
  return <InventoryAIPageComponent />;
}

function GlobalExpansionPage() {
  return <GlobalExpansionPageComponent />;
}

function CustomerServicePage() {
  return <CustomerServicePageComponent />;
}

function SupplyChainPage() {
  return <SupplyChainPageComponent />;
}

function MarketingAutomationPage() {
  return <MarketingAutomationPageComponent />;
}

function FraudDetectionPage() {
  return <FraudDetectionPageComponent />;
}

function Customer360Page() {
  return <Customer360PageComponent />;
}

function CompetitiveIntelPage() {
  return <CompetitiveIntelPageComponent />;
}

function CommunicationsPage() {
  return <CommunicationsPageComponent />;
}

function ReturnsAutomationPage() {
  return <ReturnsAutomationPageComponent />;
}

function AffiliateProgramPage() {
  return <AffiliateProgramPageComponent />;
}

function CMSPage() {
  return <CMSPageComponent />;
}

function BISuitePage() {
  return <BISuitePageComponent />;
}

function LiveStudioPage() {
  return <LiveStudioPageComponent />;
}

function CustomerFeedbackPage() {
  return <CustomerFeedbackPageComponent />;
}

function NotificationSystemPage() {
  return <NotificationSystemPageComponent />;
}

function ProductTaggingPage() {
  return <ProductTaggingPageComponent />;
}

function AbandonedCartsPage() {
  return <AbandonedCartsPageComponent />;
}
