import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import {
  Search,
  Bell,
  BellOff,
  Trash2,
  Edit2,
  TrendingUp,
  Package,
  DollarSign,
  Check,
  X,
} from "lucide-react";

interface SavedSearch {
  id: string;
  query: string;
  filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
  };
  notifications: boolean;
  createdAt: string;
  lastChecked: string;
  newResults: number;
}

/**
 * Saved Searches Management Page
 * Save search queries with filters and get notified of new matches
 */
export default function SavedSearchesPage() {
  const { data: searchesData = [], isLoading, refetch } = trpc.savedSearches.list.useQuery();
  const deleteMutation = trpc.savedSearches.delete.useMutation({
    onSuccess: () => refetch(),
  });

  // Transform tRPC data to component format
  const searches: SavedSearch[] = searchesData.map((s: any) => ({
    id: s.id,
    query: s.query,
    filters: s.filters || {},
    notifications: s.notifyOnMatch,
    createdAt: s.createdAt?.toString() || new Date().toISOString(),
    lastChecked: s.lastNotifiedAt?.toString() || s.createdAt?.toString() || new Date().toISOString(),
    newResults: 0,
  }));

  const [, setSearches] = useState<SavedSearch[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuery, setEditQuery] = useState("");

  const handleToggleNotifications = (searchId: string) => {
    setSearches(
      searches.map((search) =>
        search.id === searchId
          ? { ...search, notifications: !search.notifications }
          : search
      )
    );
  };

  const handleDeleteSearch = (searchId: string) => {
    if (confirm("Are you sure you want to delete this saved search?")) {
      deleteMutation.mutate({ id: searchId });
    }
  };

  const handleStartEdit = (search: SavedSearch) => {
    setEditingId(search.id);
    setEditQuery(search.query);
  };

  const handleSaveEdit = (searchId: string) => {
    setSearches(
      searches.map((search) =>
        search.id === searchId ? { ...search, query: editQuery } : search
      )
    );
    setEditingId(null);
    setEditQuery("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditQuery("");
  };

  const activeSearches = searches.filter((s) => s.notifications);
  const totalNewResults = searches.reduce((sum, s) => sum + s.newResults, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <Search className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Saved Searches</h1>
              <p className="text-gray-400 mt-1">
                Track your favorite searches and get notified of new products
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-background text-foreground/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Search className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {searches.length}
                  </p>
                  <p className="text-sm text-gray-400">Total Searches</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-background text-foreground/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Bell className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {activeSearches.length}
                  </p>
                  <p className="text-sm text-gray-400">Active Alerts</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-background text-foreground/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {totalNewResults}
                  </p>
                  <p className="text-sm text-gray-400">New Results</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Searches List */}
        {searches.length > 0 ? (
          <div className="space-y-4">
            {searches.map((search) => (
              <Card
                key={search.id}
                className="p-6 bg-background text-foreground/5 border-white/10 hover:bg-background text-foreground/10 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-500/20 rounded-lg">
                    <Search className="w-6 h-6 text-red-400" />
                  </div>

                  <div className="flex-1">
                    {/* Search Query */}
                    {editingId === search.id ? (
                      <div className="flex items-center gap-2 mb-3">
                        <Input
                          value={editQuery}
                          onChange={(e) => setEditQuery(e.target.value)}
                          className="bg-background/10 border-white/20 text-foreground"
                          autoFocus
                        />
                        <Button
                          onClick={() => handleSaveEdit(search.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          size="sm"
                          variant="outline"
                          className="border-border"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-foreground mb-2">
                            "{search.query}"
                          </h3>
                          {search.newResults > 0 && (
                            <Badge className="bg-green-500/20 text-green-400 mb-2">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {search.newResults} new result
                              {search.newResults !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleStartEdit(search)}
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-foreground"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() =>
                              handleToggleNotifications(search.id)
                            }
                            size="sm"
                            variant="ghost"
                            className={
                              search.notifications
                                ? "text-green-400 hover:text-green-300"
                                : "text-gray-400 hover:text-foreground"
                            }
                          >
                            {search.notifications ? (
                              <Bell className="w-4 h-4" />
                            ) : (
                              <BellOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            onClick={() => handleDeleteSearch(search.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {search.filters.category && (
                        <Badge className="bg-blue-500/20 text-blue-400">
                          <Package className="w-3 h-3 mr-1" />
                          {search.filters.category}
                        </Badge>
                      )}
                      {(search.filters.minPrice || search.filters.maxPrice) && (
                        <Badge className="bg-red-500/20 text-red-400">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {search.filters.minPrice && `$${search.filters.minPrice}`}
                          {search.filters.minPrice && search.filters.maxPrice && " - "}
                          {search.filters.maxPrice && `$${search.filters.maxPrice}`}
                        </Badge>
                      )}
                      {search.filters.inStockOnly && (
                        <Badge className="bg-green-500/20 text-green-400">
                          In Stock Only
                        </Badge>
                      )}
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <span>
                        Created {new Date(search.createdAt).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>
                        Last checked{" "}
                        {new Date(search.lastChecked).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/search?q=${encodeURIComponent(search.query)}`}
                      >
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Search className="w-4 h-4 mr-2" />
                          View Results
                        </Button>
                      </Link>
                      {search.newResults > 0 && (
                        <Link
                          href={`/search?q=${encodeURIComponent(
                            search.query
                          )}&new=true`}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500/30 text-green-400 hover:bg-green-500/20"
                          >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            View New Results
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 bg-background text-foreground/5 border-white/10 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-6 bg-card rounded-full text-card-foreground">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                No Saved Searches
              </h3>
              <p className="text-gray-400 max-w-md">
                Save your favorite searches and get notified when new products
                match your criteria!
              </p>
              <Link href="/search">
                <Button className="bg-red-600 hover:bg-red-700 mt-4">
                  <Search className="w-4 h-4 mr-2" />
                  Start Searching
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
