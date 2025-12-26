import { useState } from "react";
import { Link, Route, Switch, useLocation } from "wouter";
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
} from "lucide-react";

/**
 * Live Shopping Network - Admin Dashboard
 * Comprehensive operations command center
 */

export default function AdminDashboard() {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    { path: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location === path;
    }
    return location.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-zinc-900 border-r border-zinc-800 transition-all duration-300 z-50 ${
          sidebarOpen ? "w-64" : "w-0"
        } overflow-hidden`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold text-white">LSN Admin</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
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
                        ? "bg-purple-600 text-white"
                        : "text-gray-400 hover:bg-zinc-800 hover:text-white"
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
        <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4">
              <Badge className="bg-green-600">
                <span className="inline-block w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
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
      <h1 className="text-3xl font-bold text-white">Operations Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pending Orders</p>
              <p className="text-3xl font-bold text-white mt-1">
                {dashboard?.pendingOrders || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Open Disputes</p>
              <p className="text-3xl font-bold text-white mt-1">
                {dashboard?.openDisputes || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Open Tasks</p>
              <p className="text-3xl font-bold text-white mt-1">
                {dashboard?.openTasks || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Revenue</p>
              <p className="text-3xl font-bold text-white mt-1">
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
      <Card className="p-6 bg-zinc-900 border-zinc-800">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
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

// Placeholder components for other pages
function ChannelsPage() {
  return <div className="text-white">Channels Management - Coming Soon</div>;
}

function ProductsPage() {
  return <div className="text-white">Products Management - Coming Soon</div>;
}

function OrdersPage() {
  return <div className="text-white">Orders Management - Coming Soon</div>;
}

function FulfillmentPage() {
  return <div className="text-white">Fulfillment Management - Coming Soon</div>;
}

function LiveShoppingPage() {
  return <div className="text-white">Live Shopping Management - Coming Soon</div>;
}

function CreatorsPage() {
  return <div className="text-white">Creators Management - Coming Soon</div>;
}

function DisputesPage() {
  return <div className="text-white">Disputes Management - Coming Soon</div>;
}

function SettlementsPage() {
  return <div className="text-white">Settlements Management - Coming Soon</div>;
}

function SettingsPage() {
  return <div className="text-white">Settings - Coming Soon</div>;
}
