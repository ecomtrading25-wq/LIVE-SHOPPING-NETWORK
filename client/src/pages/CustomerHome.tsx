/**
 * Customer-Facing Home Page
 * Premium dark theme with live shopping features, featured products, and schedule
 */

import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export default function CustomerHome() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section with Live Stream */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container relative z-10 px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Content */}
            <div className="space-y-8">
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-foreground border-0 px-4 py-2 text-sm font-semibold">
                🔴 LIVE NOW
              </Badge>
              
              <h1 className="text-6xl lg:text-7xl font-black text-foreground leading-tight">
                Shop Live.
                <br />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Save Big.
                </span>
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                Experience the future of shopping. Watch live shows, grab exclusive deals, 
                and shop trending products with real-time price drops.
              </p>

              <div className="flex gap-4">
                <Link href="/live">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground font-bold px-8 py-6 text-lg rounded-xl shadow-2xl hover:shadow-purple-500/50 transition-all">
                    Watch Live Now
                  </Button>
                </Link>
                <Link href="/products">
                  <Button size="lg" variant="outline" className="border-2 border-purple-500 text-purple-300 hover:bg-purple-500/10 font-bold px-8 py-6 text-lg rounded-xl">
                    Browse Products
                  </Button>
                </Link>
              </div>

              {/* Live Stats */}
              <div className="flex gap-8 pt-8">
                <div>
                  <div className="text-3xl font-bold text-foreground">2.4K+</div>
                  <div className="text-sm text-gray-400">Watching Now</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">$1.2M+</div>
                  <div className="text-sm text-gray-400">Sold Today</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">500+</div>
                  <div className="text-sm text-gray-400">Products</div>
                </div>
              </div>
            </div>

            {/* Right: Live Stream Preview */}
            <div className="relative">
              <Card className="bg-card/50 backdrop-blur-xl border-purple-500/30 overflow-hidden rounded-2xl shadow-2xl text-card-foreground">
                {/* Video placeholder */}
                <div className="aspect-video bg-gradient-to-br from-purple-900 to-pink-900 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-background text-foreground/10 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-10 h-10 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <p className="text-foreground font-semibold">Live Show Starting Soon</p>
                    </div>
                  </div>

                  {/* Live badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-red-600 text-foreground border-0 px-3 py-1 animate-pulse">
                      🔴 LIVE
                    </Badge>
                  </div>

                  {/* Viewer count */}
                  <div className="absolute top-4 right-4 bg-background/50 backdrop-blur-sm rounded-full px-3 py-1 text-foreground text-sm font-semibold">
                    👁️ 2,431 watching
                  </div>
                </div>

                {/* Pinned Products */}
                <div className="p-4 space-y-3">
                  <h3 className="text-foreground font-bold text-sm uppercase tracking-wide">Featured Products</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="bg-gray-700/50 border-gray-600 p-3 hover:border-purple-500 transition-all cursor-pointer">
                        <div className="aspect-square bg-gray-600 rounded-lg mb-2"></div>
                        <div className="text-xs text-muted-foreground truncate">Product {i}</div>
                        <div className="text-sm font-bold text-foreground">$29.99</div>
                        <Badge className="bg-green-600 text-foreground border-0 text-xs mt-1">-40%</Badge>
                      </Card>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Price Drop Alert Section */}
      <section className="py-20 bg-gradient-to-r from-red-900/20 to-orange-900/20 border-y border-red-500/30">
        <div className="container px-4">
          <div className="text-center space-y-6">
            <Badge className="bg-red-600 text-foreground border-0 px-4 py-2 text-lg font-bold animate-bounce">
              ⚡ FLASH PRICE DROP
            </Badge>
            <h2 className="text-4xl font-black text-foreground">
              Limited Time Only - Grab It Before It's Gone!
            </h2>
            <div className="flex justify-center gap-4 text-foreground">
              <div className="bg-background/50 backdrop-blur-sm rounded-xl px-6 py-4 text-foreground">
                <div className="text-3xl font-bold">12</div>
                <div className="text-sm text-gray-400">Minutes</div>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-xl px-6 py-4 text-foreground">
                <div className="text-3xl font-bold">34</div>
                <div className="text-sm text-gray-400">Seconds</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="py-20">
        <div className="container px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-black text-foreground mb-2">Trending Now</h2>
              <p className="text-gray-400">Hot products flying off the shelves</p>
            </div>
            <Link href="/products">
              <Button variant="outline" className="border-purple-500 text-purple-300 hover:bg-purple-500/10">
                View All →
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-card/50 backdrop-blur-xl border-border hover:border-purple-500 transition-all cursor-pointer group overflow-hidden text-card-foreground">
                <div className="aspect-square bg-gradient-to-br from-purple-900 to-pink-900 relative overflow-hidden">
                  <div className="absolute inset-0 bg-background/20 group-hover:bg-background/0 transition-all text-foreground"></div>
                  {i === 1 && (
                    <Badge className="absolute top-3 left-3 bg-yellow-600 text-foreground border-0">
                      ⭐ Best Seller
                    </Badge>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="text-foreground font-bold group-hover:text-purple-400 transition-colors">
                    Premium Product {i}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">$49.99</span>
                    <span className="text-sm text-gray-400 line-through">$89.99</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-400">(234)</span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground font-bold">
                    Add to Cart
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Live Schedule */}
      <section className="py-20 bg-background/50 text-foreground">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-foreground mb-2">Upcoming Live Shows</h2>
            <p className="text-gray-400">Mark your calendar for exclusive deals</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { time: '2:00 PM', host: 'Sarah Chen', topic: 'Tech Gadgets Bonanza', viewers: '1.2K' },
              { time: '5:00 PM', host: 'Mike Johnson', topic: 'Fashion Flash Sale', viewers: '890' },
              { time: '8:00 PM', host: 'Emma Davis', topic: 'Home & Living Deals', viewers: '2.1K' }
            ].map((show, i) => (
              <Card key={i} className="bg-card/50 backdrop-blur-xl border-border hover:border-purple-500 transition-all p-6 space-y-4 text-card-foreground">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-3xl font-bold text-purple-400">{show.time}</div>
                    <div className="text-sm text-gray-400">Today</div>
                  </div>
                  <Badge className="bg-purple-600 text-foreground border-0">
                    {show.viewers} interested
                  </Badge>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">{show.topic}</h3>
                  <p className="text-gray-400 text-sm">with {show.host}</p>
                </div>
                <Button variant="outline" className="w-full border-purple-500 text-purple-300 hover:bg-purple-500/10">
                  Set Reminder
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-foreground mb-2">Loved by Thousands</h2>
            <p className="text-gray-400">See what our customers are saying</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Jessica M.', review: 'Best shopping experience ever! Got amazing deals during the live show.', rating: 5 },
              { name: 'David L.', review: 'The price drops are insane! Saved over $200 on my last purchase.', rating: 5 },
              { name: 'Amanda K.', review: 'Love the live interaction. Makes shopping so much more fun!', rating: 5 }
            ].map((testimonial, i) => (
              <Card key={i} className="bg-card/50 backdrop-blur-xl border-border p-6 space-y-4 text-card-foreground">
                <div className="flex text-yellow-400">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-muted-foreground italic">"{testimonial.review}"</p>
                <div className="text-foreground font-semibold">- {testimonial.name}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900 to-pink-900">
        <div className="container px-4 text-center">
          <h2 className="text-5xl font-black text-foreground mb-6">
            Ready to Start Shopping?
          </h2>
          <p className="text-xl text-purple-200 mb-8 max-w-2xl mx-auto">
            Join thousands of happy shoppers and never miss a deal again
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/live">
              <Button size="lg" className="bg-background text-foreground text-purple-900 hover:bg-gray-100 font-bold px-8 py-6 text-lg rounded-xl shadow-2xl">
                Watch Live Now
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="border-2 border-white text-foreground hover:bg-background/10 font-bold px-8 py-6 text-lg rounded-xl">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12 text-foreground">
        <div className="container px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-foreground font-bold text-xl mb-4">Live Shopping Network</h3>
              <p className="text-gray-400 text-sm">
                The future of online shopping. Live, interactive, and always exciting.
              </p>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/live" className="hover:text-purple-400">Live Shows</Link></li>
                <li><Link href="/products" className="hover:text-purple-400">All Products</Link></li>
                <li><Link href="/deals" className="hover:text-purple-400">Deals</Link></li>
                <li><Link href="/schedule" className="hover:text-purple-400">Schedule</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/help" className="hover:text-purple-400">Help Center</Link></li>
                <li><Link href="/shipping" className="hover:text-purple-400">Shipping</Link></li>
                <li><Link href="/returns" className="hover:text-purple-400">Returns</Link></li>
                <li><Link href="/contact" className="hover:text-purple-400">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/about" className="hover:text-purple-400">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-purple-400">Careers</Link></li>
                <li><Link href="/press" className="hover:text-purple-400">Press</Link></li>
                <li><Link href="/terms" className="hover:text-purple-400">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-gray-400 text-sm">
            © 2025 Live Shopping Network. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
