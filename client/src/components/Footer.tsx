import { Link } from "wouter";
import { Package, Facebook, Twitter, Instagram, Youtube, Mail } from "lucide-react";

/**
 * Footer Component
 * Site-wide footer with links, social media, newsletter signup
 */

export default function Footer() {
  return (
    <footer className="bg-white border-t-2 border-black mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Live Selling Network" className="h-24 w-auto" />

            </div>
            <p className="text-gray-700 text-sm mb-4">
              Shop live, get exclusive deals, and interact with hosts in real-time.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center hover:bg-[#E42313] hover:border-[#E42313] transition-colors"
              >
                <Facebook className="w-5 h-5 text-black" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center hover:bg-[#E42313] hover:border-[#E42313] transition-colors"
              >
                <Twitter className="w-5 h-5 text-black" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center hover:bg-[#E42313] hover:border-[#E42313] transition-colors"
              >
                <Instagram className="w-5 h-5 text-black" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center hover:bg-[#E42313] hover:border-[#E42313] transition-colors"
              >
                <Youtube className="w-5 h-5 text-black" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold text-black mb-4">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="text-gray-700 hover:text-[#E42313] transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-700 hover:text-[#E42313] transition-colors">
                  Live Shows
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-gray-700 hover:text-[#E42313] transition-colors">
                  Search
                </Link>
              </li>
              <li>
                <Link href="/rewards" className="text-gray-700 hover:text-[#E42313] transition-colors">
                  Rewards Program
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-black mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/account" className="text-gray-700 hover:text-[#E42313] transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-[#E42313] transition-colors">
                  Track Order
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-[#E42313] transition-colors">
                  Returns & Refunds
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-[#E42313] transition-colors">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-[#E42313] transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-black mb-4">Stay Updated</h3>
            <p className="text-gray-700 text-sm mb-4">
              Subscribe to get special offers and updates.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2 bg-white border-2 border-black rounded-md text-black text-sm focus:outline-none focus:ring-2 focus:ring-[#E42313]"
              />
              <button className="px-4 py-2 bg-[#E42313] hover:bg-[#C01F10] rounded-md transition-colors">
                <Mail className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t-2 border-black">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-700">
            <p>© 2024 Live Shopping Network. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-[#E42313] transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-[#E42313] transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-[#E42313] transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
