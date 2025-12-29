import { useState } from "react";
import { Link } from "wouter";
import AdminNav from "./AdminNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import NotificationCenter from "@/components/NotificationCenter";
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

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">
                Live Shopping Network
              </span>
              <span className="text-xl font-bold text-white sm:hidden">LSN</span>
            </div>
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
                className="pl-12 bg-zinc-800 border-zinc-700 text-white h-10"
              />
            </div>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" asChild>
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
            </Button>

            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" asChild>
              <Link href="/products">
                <Package className="w-4 h-4 mr-2" />
                Products
              </Link>
            </Button>

            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" asChild>
              <Link href="/categories">
                <Package className="w-4 h-4 mr-2" />
                Categories
              </Link>
            </Button>

            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" asChild>
              <Link href="/rewards">
                <Trophy className="w-4 h-4 mr-2" />
                Rewards
              </Link>
            </Button>

            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" asChild>
              <Link href="/saved-searches">
                <Bookmark className="w-4 h-4 mr-2" />
                Saved
              </Link>
            </Button>

            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white" asChild>
              <Link href="/subscriptions">
                <Calendar className="w-4 h-4 mr-2" />
                Subscriptions
              </Link>
            </Button>

            <AdminNav />

            <div className="w-px h-6 bg-zinc-700 mx-2"></div>

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
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-purple-600 text-xs">
                    {cartCount > 9 ? "9+" : cartCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Account */}
            <Button variant="ghost" size="icon" asChild>
              <Link href="/account">
                <User className="w-5 h-5" />
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white"
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
              className="pl-12 bg-zinc-800 border-zinc-700 text-white h-10"
            />
          </div>
        </form>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-900">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white"
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
              className="w-full justify-start text-gray-300 hover:text-white"
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
              className="w-full justify-start text-gray-300 hover:text-white"
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
              className="w-full justify-start text-gray-300 hover:text-white"
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
              className="w-full justify-start text-gray-300 hover:text-white"
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
              className="w-full justify-start text-gray-300 hover:text-white"
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
              className="w-full justify-start text-gray-300 hover:text-white"
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
              className="w-full justify-start text-gray-300 hover:text-white"
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
              className="w-full justify-start text-gray-300 hover:text-white relative"
              onClick={() => setMobileMenuOpen(false)}
              asChild
            >
              <Link href="/cart">
                <ShoppingCart className="w-4 h-4 mr-3" />
                Cart
                {cartCount > 0 && (
                  <Badge className="ml-auto bg-purple-600">
                    {cartCount}
                  </Badge>
                )}
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
              asChild
            >
              <Link href="/account">
                <User className="w-4 h-4 mr-3" />
                Account
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
