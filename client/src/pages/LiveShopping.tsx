/**
 * Live Shopping Page
 * Real-time live stream with pinned products, chat, price drops, and purchase flow
 */

import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';

export default function LiveShopping() {
  const params = useParams<{ showId?: string }>();
  const showId = params.showId || 'default-show-id';

  const [chatMessage, setChatMessage] = useState('');
  const [viewerCount, setViewerCount] = useState(2431);

  // Fetch current show state
  const { data: showState, refetch } = trpc.liveShows.getCurrentState.useQuery({ showId });

  // Simulate viewer count updates
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 20) - 10);
      refetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  const pinnedProducts = showState?.pinnedProducts || [];
  const activePriceDrops = showState?.activePriceDrops || [];
  const isLive = showState?.isLive || false;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <nav className="bg-card border-b border-border px-4 py-3 text-card-foreground">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-foreground font-bold text-xl">Live Shopping Network</h1>
            {isLive && (
              <Badge className="bg-red-600 text-foreground border-0 px-3 py-1 animate-pulse">
                🔴 LIVE
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-foreground text-sm">
              👁️ {viewerCount.toLocaleString()} watching
            </div>
            <Button variant="outline" className="border-purple-500 text-purple-300">
              Share
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Video + Pinned Products */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card className="bg-card border-border overflow-hidden text-card-foreground">
              <div className="aspect-video bg-gradient-to-br from-purple-900 to-pink-900 relative">
                {/* Video placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-background text-foreground/10 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-12 h-12 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <p className="text-foreground font-semibold text-lg">
                      {isLive ? 'Live Stream' : 'Stream Starting Soon'}
                    </p>
                  </div>
                </div>

                {/* Live controls overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 to-transparent p-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-foreground font-bold text-2xl mb-1">
                        {showState?.show?.title || 'Live Shopping Show'}
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Hosted by {showState?.show?.creator?.displayName || 'Host'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-white/30 text-foreground hover:bg-background/10">
                        🔊
                      </Button>
                      <Button size="sm" variant="outline" className="border-white/30 text-foreground hover:bg-background/10">
                        ⚙️
                      </Button>
                      <Button size="sm" variant="outline" className="border-white/30 text-foreground hover:bg-background/10">
                        ⛶
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Active Price Drops */}
            {activePriceDrops.length > 0 && (
              <Card className="bg-gradient-to-r from-red-900/50 to-orange-900/50 border-red-500/50 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className="bg-red-600 text-foreground border-0 mb-2 animate-bounce">
                      ⚡ FLASH PRICE DROP
                    </Badge>
                    <h3 className="text-foreground font-bold text-xl">
                      Limited Time Offer - Hurry!
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-foreground text-sm mb-1">Ends in</div>
                    <div className="text-3xl font-bold text-foreground">
                      12:34
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Pinned Products */}
            <div>
              <h3 className="text-foreground font-bold text-xl mb-4">Featured Products</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {pinnedProducts.length > 0 ? (
                  pinnedProducts.map((pin: any) => (
                    <Card key={pin.pinId} className="bg-card border-border hover:border-purple-500 transition-all text-card-foreground">
                      <div className="p-4 space-y-3">
                        <div className="aspect-square bg-gradient-to-br from-purple-900 to-pink-900 rounded-lg"></div>
                        <div>
                          <h4 className="text-foreground font-bold">{pin.product?.name || 'Product'}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-2xl font-bold text-purple-400">
                              ${(pin.displayPriceCents / 100).toFixed(2)}
                            </span>
                            {pin.displayPriceCents < pin.originalPriceCents && (
                              <>
                                <span className="text-sm text-gray-400 line-through">
                                  ${(pin.originalPriceCents / 100).toFixed(2)}
                                </span>
                                <Badge className="bg-green-600 text-foreground border-0">
                                  -{Math.round((1 - pin.displayPriceCents / pin.originalPriceCents) * 100)}%
                                </Badge>
                              </>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {pin.stockAvailable} left in stock
                          </div>
                        </div>
                        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground font-bold">
                          Add to Cart - ${(pin.displayPriceCents / 100).toFixed(2)}
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12 text-gray-400">
                    No products pinned yet
                  </div>
                )}
              </div>
            </div>

            {/* Show Info */}
            <Card className="bg-card border-border p-6 text-card-foreground">
              <h3 className="text-foreground font-bold text-lg mb-4">About This Show</h3>
              <p className="text-muted-foreground leading-relaxed">
                {showState?.show?.description || 
                  'Join us for an exciting live shopping experience with exclusive deals and limited-time offers!'}
              </p>
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    {showState?.show?.totalOrders || 0}
                  </div>
                  <div className="text-sm text-gray-400">Orders</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    ${((showState?.show?.totalRevenueCents || 0) / 100).toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-400">Revenue</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    {showState?.show?.peakViewerCount || 0}
                  </div>
                  <div className="text-sm text-gray-400">Peak Viewers</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar - Chat + Info */}
          <div className="space-y-6">
            {/* Live Chat */}
            <Card className="bg-card border-border flex flex-col h-[600px] text-card-foreground">
              <div className="p-4 border-b border-border">
                <h3 className="text-foreground font-bold">Live Chat</h3>
                <p className="text-gray-400 text-sm">Join the conversation</p>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {[
                  { user: 'Sarah M.', message: 'This is amazing! 🔥', time: '2m ago' },
                  { user: 'Mike J.', message: 'Just ordered 2! Great deal!', time: '3m ago' },
                  { user: 'Emma K.', message: 'When will the next price drop be?', time: '5m ago' },
                  { user: 'David L.', message: 'Love this show! ❤️', time: '7m ago' },
                  { user: 'Jessica R.', message: 'Shipping to Canada?', time: '9m ago' }
                ].map((msg, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-foreground text-xs font-bold">
                        {msg.user[0]}
                      </div>
                      <span className="text-foreground font-semibold text-sm">{msg.user}</span>
                      <span className="text-gray-500 text-xs">{msg.time}</span>
                    </div>
                    <p className="text-muted-foreground text-sm ml-8">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Chat input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="bg-gray-700 border-gray-600 text-foreground placeholder:text-gray-400"
                  />
                  <Button className="bg-purple-600 hover:bg-purple-700 text-foreground">
                    Send
                  </Button>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card border-border p-4 space-y-3 text-card-foreground">
              <h3 className="text-foreground font-bold text-sm uppercase tracking-wide">Quick Actions</h3>
              <Button variant="outline" className="w-full border-purple-500 text-purple-300 hover:bg-purple-500/10">
                🔔 Set Reminder
              </Button>
              <Button variant="outline" className="w-full border-purple-500 text-purple-300 hover:bg-purple-500/10">
                ❤️ Add to Favorites
              </Button>
              <Button variant="outline" className="w-full border-purple-500 text-purple-300 hover:bg-purple-500/10">
                📤 Share Show
              </Button>
            </Card>

            {/* Upcoming Shows */}
            <Card className="bg-card border-border p-4 text-card-foreground">
              <h3 className="text-foreground font-bold text-sm uppercase tracking-wide mb-3">
                Next Shows
              </h3>
              <div className="space-y-3">
                {[
                  { time: '5:00 PM', topic: 'Fashion Flash' },
                  { time: '8:00 PM', topic: 'Home & Living' }
                ].map((show, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div>
                      <div className="text-foreground font-semibold text-sm">{show.topic}</div>
                      <div className="text-gray-400 text-xs">{show.time}</div>
                    </div>
                    <Button size="sm" variant="outline" className="border-purple-500 text-purple-300 text-xs">
                      Notify Me
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
