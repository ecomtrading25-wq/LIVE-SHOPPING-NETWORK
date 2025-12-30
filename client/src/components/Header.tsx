import { useState } from "react";
import { Link } from "wouter";
import AdminNav from "./AdminNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import NotificationCenter from "@/components/NotificationCenter";
import { useAuth } from "@/contexts/AuthContext";
import { getLoginUrl } from "@/const";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  Trophy,
  Home,
  Package,
  Bookmark,
  Calendar,
  Bell,
  BarChart3,
} from "lucide-react";

/**
 * Unified Navigation Header
 * Logo, search, cart, notifications, wishlist, rewards, account
 */

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { items } = useCart();
  const { user } = useAuth();

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white backdrop-blur-sm border-b-2 border-black">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <img 
              src="/logo.png" 
              alt="Live Shopping Network" 
              className="h-12 w-auto cursor-pointer" 
            />
          </Link>

          {/* Search Bar - Desktop */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl mx-8"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-white border-2 border-black text-black h-10"
              />
            </div>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-black hover:text-[#E42313]" asChild>
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
            </Button>

            <Button variant="ghost" size="sm" className="text-black hover:text-[#E42313]" asChild>
              <Link href="/products">
                <Package className="w-4 h-4 mr-2" />
                Products
              </Link>
            </Button>

            <Button variant="ghost" size="sm" className="text-black hover:text-[#E42313]" asChild>
              <Link href="/categories">
                <Package className="w-4 h-4 mr-2" />
                Categories
              </Link>
            </Button>

            <Button variant="ghost" size="sm" className="text-black hover:text-[#E42313]" asChild>
              <Link href="/rewards">
                <Trophy className="w-4 h-4 mr-2" />
                Rewards
              </Link>
            </Button>

            <Button variant="ghost" size="sm" className="text-black hover:text-[#E42313]" asChild>
              <Link href="/saved-searches">
                <Bookmark className="w-4 h-4 mr-2" />
                Saved
              </Link>
            </Button>

            <Button variant="ghost" size="sm" className="text-black hover:text-[#E42313]" asChild>
              <Link href="/subscriptions">
                <Calendar className="w-4 h-4 mr-2" />
                Subscriptions
              </Link>
            </Button>

            <AdminNav />

            <div className="w-px h-6 bg-background mx-2 text-foreground"></div>

            {/* Notification Bell */}
            <NotificationCenter />

            {/* Wishlist */}
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link href="/wishlist">
                <Heart className="w-5 h-5" />
              </Link>
            </Button>

            {/* Cart */}
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link href="/cart">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-[#E42313] text-foreground text-xs">
                    {cartCount > 9 ? "9+" : cartCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Account / Login */}
            {user ? (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/account">
                  <User className="w-5 h-5" />
                </Link>
              </Button>
            ) : (
              <Button 
                size="sm" 
                className="bg-[#E42313] hover:bg-[#C01F10] text-white font-bold"
                onClick={() => window.location.href = getLoginUrl()}
              >
                <User className="w-4 h-4 mr-2" />
                Login
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-foreground"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-card border-zinc-700 text-foreground h-10"
            />
          </div>
        </form>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background text-foreground">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
              asChild
            >
              <Link href="/">
                <Home className="w-4 h-4 mr-3" />
                Home
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
              asChild
            >
              <Link href="/products">
                <Package className="w-4 h-4 mr-3" />
                Products
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
              asChild
            >
              <Link href="/rewards">
                <Trophy className="w-4 h-4 mr-3" />
                Rewards
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
              asChild
            >
              <Link href="/saved-searches">
                <Bookmark className="w-4 h-4 mr-3" />
                Saved Searches
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
              asChild
            >
              <Link href="/subscriptions">
                <Calendar className="w-4 h-4 mr-3" />
                Subscriptions
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
              asChild
            >
              <Link href="/alerts">
                <Bell className="w-4 h-4 mr-3" />
                Stock Alerts
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
              asChild
            >
              <Link href="/analytics">
                <BarChart3 className="w-4 h-4 mr-3" />
                Analytics
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
              asChild
            >
              <Link href="/wishlist">
                <Heart className="w-4 h-4 mr-3" />
                Wishlist
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground relative"
              onClick={() => setMobileMenuOpen(false)}
              asChild
            >
              <Link href="/cart">
                <ShoppingCart className="w-4 h-4 mr-3" />
                Cart
                {cartCount > 0 && (
                  <Badge className="ml-auto bg-red-600">
                    {cartCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {user ? (
              <Button
                variant="ghost"
                className="w-full justify-start text-black hover:text-[#E42313]"
                asChild
              >
                <Link href="/account">
                  <User className="w-4 h-4 mr-3" />
                  Account
                </Link>
              </Button>
            ) : (
              <Button
                className="w-full bg-[#E42313] hover:bg-[#C01F10] text-white font-bold"
                onClick={() => window.location.href = getLoginUrl()}
              >
                <User className="w-4 h-4 mr-3" />
                Login
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
