import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Users, Eye, Clock, Calendar } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

/**
 * Live Shopping Network - Homepage
 * Displays live, scheduled, and past shows
 */
export default function Home() {
  // Fetch live shows
  const { data: liveShows, isLoading: liveLoading } = trpc.liveStreaming.listLiveShows.useQuery({
    status: 'live',
    limit: 10,
  });

  // Fetch scheduled shows
  const { data: scheduledShows } = trpc.liveStreaming.listLiveShows.useQuery({
    status: 'scheduled',
    limit: 6,
  });

  // Fetch ended shows
  const { data: endedShows } = trpc.liveStreaming.listLiveShows.useQuery({
    status: 'ended',
    limit: 6,
  });

  if (liveLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-900 text-2xl">Loading live shows...</div>
      </div>
    );
  }

  const hasLiveShows = liveShows && liveShows.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 text-black">
            Live Shopping Network
          </h1>
          <p className="text-2xl mb-8 text-gray-800">
            {hasLiveShows 
              ? `${liveShows.length} live show${liveShows.length > 1 ? 's' : ''} happening now!`
              : 'No live shows at the moment. Check back soon!'}
          </p>
          <Link href="/live">
            <Button size="lg" className="bg-[#E42313] hover:bg-[#C01F10] text-white font-bold px-8 py-6 text-lg mb-12">
              <Play className="w-5 h-5 mr-2" />
              Explore All Shows
            </Button>
          </Link>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Card className="p-6 bg-white border-2 border-black hover:border-[#E42313] hover:shadow-lg transition-all">
              <div className="text-4xl mb-4">🛍️</div>
              <h3 className="text-xl font-bold mb-2">Shop Live</h3>
              <p className="text-gray-600">Watch live shows and shop exclusive deals in real-time</p>
            </Card>
            <Card className="p-6 bg-white border-2 border-black hover:border-[#E42313] hover:shadow-lg transition-all">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2">Instant Deals</h3>
              <p className="text-gray-600">Get special pricing only available during live shows</p>
            </Card>
            <Card className="p-6 bg-white border-2 border-black hover:border-[#E42313] hover:shadow-lg transition-all">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-bold mb-2">Interactive</h3>
              <p className="text-gray-600">Ask questions and interact with hosts in real-time</p>
            </Card>
          </div>
        </div>

        {/* Live Shows Section */}
        {hasLiveShows && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                Live Now
              </h2>
              <Link href="/live">
                <Button variant="outline" className="border-gray-300 hover:bg-gray-100">
                  View All
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveShows.map((show) => (
                <Link key={show.id} href={`/show/${show.id}`}>
                  <Card className="group cursor-pointer overflow-hidden bg-white border-2 border-black hover:border-[#E42313] hover:shadow-xl transition-all hover:scale-105">
                    <div className="relative aspect-video bg-[#E42313] flex items-center justify-center">
                      <Play className="w-16 h-16 text-white opacity-80" />
                      <Badge className="absolute top-3 left-3 bg-red-500 text-white border-0 animate-pulse">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-white rounded-full"></span>
                          LIVE
                        </span>
                      </Badge>
                      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur px-2 py-1 rounded flex items-center gap-1 text-white text-sm">
                        <Eye className="w-4 h-4" />
                        {show.peakViewers || 0}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-black mb-2 line-clamp-2 group-hover:text-[#E42313] transition-colors">
                        {show.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {show.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Users className="w-4 h-4" />
                          {show.totalViews || 0} views
                        </div>
                        <Button size="sm" className="bg-[#E42313] hover:bg-[#C01F10] text-white">
                          Watch Now
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Scheduled Shows Section */}
        {scheduledShows && scheduledShows.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-8 h-8 text-purple-400" />
                Coming Soon
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scheduledShows.map((show) => (
                <Card key={show.id} className="overflow-hidden bg-white border-2 border-black hover:border-[#E42313] hover:shadow-lg transition-all">
                  <div className="relative aspect-video bg-black flex items-center justify-center">
                    <Clock className="w-16 h-16 text-white opacity-60" />
                    <Badge className="absolute top-3 left-3 bg-[#E42313] text-white border-0">
                      SCHEDULED
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                      {show.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                      {show.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-[#E42313] font-medium">
                        {new Date(show.scheduledStartAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                      <Button size="sm" variant="outline" className="border-gray-300 hover:bg-gray-100">
                        Set Reminder
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Past Shows Section */}
        {endedShows && endedShows.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                Watch Replays
              </h2>
              <Link href="/live">
                <Button variant="outline" className="border-gray-300 hover:bg-gray-100">
                  View All
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {endedShows.slice(0, 6).map((show) => (
                <Link key={show.id} href={`/show/${show.id}`}>
                  <Card className="group cursor-pointer overflow-hidden bg-white border-2 border-black hover:border-[#E42313] hover:shadow-lg transition-all">
                    <div className="relative aspect-video bg-black flex items-center justify-center">
                      <Play className="w-12 h-12 text-white opacity-60" />
                      <Badge className="absolute top-3 left-3 bg-gray-600 text-white border-0">
                        REPLAY
                      </Badge>
                      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur px-2 py-1 rounded text-white text-xs">
                        {show.totalViews || 0} views
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-black mb-2 line-clamp-2 group-hover:text-[#E42313] transition-colors">
                        {show.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {show.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-600 text-xs">
                          {show.actualStartAt && new Date(show.actualStartAt).toLocaleDateString()}
                        </div>
                        <Button size="sm" variant="outline" className="border-gray-300 hover:bg-gray-100">
                          Watch Replay
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="p-12 bg-[#E42313] border-2 border-black">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Start Shopping Live?
            </h2>
            <p className="text-xl text-white mb-8">
              Join thousands of shoppers discovering amazing deals in real-time
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/live">
                <Button size="lg" className="bg-black hover:bg-gray-800 text-white font-bold px-8 py-6 text-lg">
                  <Play className="w-5 h-5 mr-2" />
                  Browse Live Shows
                </Button>
              </Link>
              <Link href="/host">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-[#E42313] px-8 py-6 text-lg">
                  Become a Host
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
