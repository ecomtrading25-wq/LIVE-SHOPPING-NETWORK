import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  X,
  Home,
  Package,
  Trophy,
  ShoppingCart,
  User,
  Search,
  Gift,
  Bell,
  Settings,
} from "lucide-react";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Package, label: "Products", path: "/products" },
    { icon: Trophy, label: "Rewards", path: "/loyalty" },
    { icon: ShoppingCart, label: "Cart", path: "/cart", badge: 3 },
    { icon: Gift, label: "Gift Registry", path: "/registry" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: User, label: "Account", path: "/account" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="w-6 h-6" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-card border-r z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1 font-medium">{item.label}</span>
                {item.badge && (
                  <Badge className="bg-primary text-primary-foreground">
                    {item.badge}
                  </Badge>
                )}
              </a>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-card">
          <Button className="w-full" size="lg">
            Sign In
          </Button>
        </div>
      </div>
    </>
  );
}
