import { Link } from "wouter";
import { Package, Facebook, Twitter, Instagram, Youtube, Mail } from "lucide-react";

/**
 * Footer Component
 * Site-wide footer with links, social media, newsletter signup
 */

export default function Footer() {
  return (
    <footer className="bg-zinc-900 border-t border-zinc-800 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-8 h-8 text-purple-500" />
              <span className="text-xl font-bold text-white">Live Shopping Network</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Shop live, get exclusive deals, and interact with hosts in real-time.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors"
              >
                <Facebook className="w-5 h-5 text-white" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors"
              >
                <Twitter className="w-5 h-5 text-white" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors"
              >
                <Instagram className="w-5 h-5 text-white" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors"
              >
                <Youtube className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold text-white mb-4">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="text-gray-400 hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Live Shows
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-gray-400 hover:text-white transition-colors">
                  Search
                </Link>
              </li>
              <li>
                <Link href="/rewards" className="text-gray-400 hover:text-white transition-colors">
                  Rewards Program
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/account" className="text-gray-400 hover:text-white transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Track Order
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Returns & Refunds
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-white mb-4">Stay Updated</h3>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to get special offers and updates.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white text-sm focus:outline-none focus:border-purple-500"
              />
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors">
                <Mail className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <p>© 2024 Live Shopping Network. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
