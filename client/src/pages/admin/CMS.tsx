import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Image,
  Globe,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Plus,
  Upload,
  Search,
  Clock,
  CheckCircle,
} from "lucide-react";

/**
 * Content Management System (CMS)
 * WYSIWYG editor, media library, SEO optimization, multi-language support
 */

interface ContentPage {
  id: string;
  title: string;
  slug: string;
  status: "published" | "draft" | "scheduled";
  author: string;
  createdDate: string;
  publishedDate?: string;
  scheduledDate?: string;
  views: number;
  language: string;
  seoScore: number;
}

interface MediaAsset {
  id: string;
  name: string;
  type: "image" | "video" | "document";
  size: string;
  uploadDate: string;
  url: string;
  usedIn: number;
}

interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  canonicalUrl: string;
}

export default function CMSPage() {
  const [selectedTab, setSelectedTab] = useState("pages");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock content pages
  const pages: ContentPage[] = [
    {
      id: "PAGE-001",
      title: "Black Friday Sale 2025",
      slug: "black-friday-sale-2025",
      status: "published",
      author: "Marketing Team",
      createdDate: "2025-11-15T00:00:00Z",
      publishedDate: "2025-11-20T00:00:00Z",
      views: 15680,
      language: "en",
      seoScore: 92,
    },
    {
      id: "PAGE-002",
      title: "Holiday Gift Guide",
      slug: "holiday-gift-guide",
      status: "draft",
      author: "Content Team",
      createdDate: "2025-12-01T00:00:00Z",
      views: 0,
      language: "en",
      seoScore: 78,
    },
    {
      id: "PAGE-003",
      title: "New Year Deals",
      slug: "new-year-deals",
      status: "scheduled",
      author: "Marketing Team",
      createdDate: "2025-12-15T00:00:00Z",
      scheduledDate: "2026-01-01T00:00:00Z",
      views: 0,
      language: "en",
      seoScore: 85,
    },
  ];

  // Mock media assets
  const mediaAssets: MediaAsset[] = [
    {
      id: "MEDIA-001",
      name: "hero-banner-black-friday.jpg",
      type: "image",
      size: "2.4 MB",
      uploadDate: "2025-11-15T00:00:00Z",
      url: "/uploads/hero-banner-black-friday.jpg",
      usedIn: 3,
    },
    {
      id: "MEDIA-002",
      name: "product-showcase-video.mp4",
      type: "video",
      size: "45.8 MB",
      uploadDate: "2025-11-20T00:00:00Z",
      url: "/uploads/product-showcase-video.mp4",
      usedIn: 1,
    },
    {
      id: "MEDIA-003",
      name: "holiday-gift-guide.pdf",
      type: "document",
      size: "1.2 MB",
      uploadDate: "2025-12-01T00:00:00Z",
      url: "/uploads/holiday-gift-guide.pdf",
      usedIn: 2,
    },
  ];

  // Mock languages
  const languages = [
    { code: "en", name: "English", pages: 156 },
    { code: "es", name: "Spanish", pages: 89 },
    { code: "fr", name: "French", pages: 67 },
    { code: "de", name: "German", pages: 45 },
    { code: "zh", name: "Chinese", pages: 34 },
  ];

  const totalPages = pages.length;
  const publishedPages = pages.filter((p) => p.status === "published").length;
  const draftPages = pages.filter((p) => p.status === "draft").length;
  const scheduledPages = pages.filter((p) => p.status === "scheduled").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-500/20 text-green-400";
      case "draft":
        return "bg-yellow-500/20 text-yellow-400";
      case "scheduled":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="w-5 h-5 text-blue-500" />;
      case "video":
        return <FileText className="w-5 h-5 text-red-500" />;
      case "document":
        return <FileText className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Content Management System</h1>
          <p className="text-muted-foreground">
            Create, manage, and publish content across your platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import Content
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Page
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Pages</p>
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{totalPages}</p>
          <p className="text-xs text-muted-foreground">Across all languages</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Published</p>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{publishedPages}</p>
          <p className="text-xs text-green-500">Live on site</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Drafts</p>
            <Edit className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{draftPages}</p>
          <p className="text-xs text-muted-foreground">In progress</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Scheduled</p>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{scheduledPages}</p>
          <p className="text-xs text-muted-foreground">Upcoming</p>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="pages">
            <FileText className="w-4 h-4 mr-2" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="media">
            <Image className="w-4 h-4 mr-2" />
            Media Library
          </TabsTrigger>
          <TabsTrigger value="languages">
            <Globe className="w-4 h-4 mr-2" />
            Languages
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Search className="w-4 h-4 mr-2" />
            SEO Tools
          </TabsTrigger>
        </TabsList>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-6">
          <Card className="p-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages by title or slug..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-4">
              {pages.map((page) => (
                <Card key={page.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold">{page.title}</h3>
                        <Badge className={getStatusColor(page.status)}>{page.status}</Badge>
                        {page.seoScore >= 80 && (
                          <Badge className="bg-green-500/20 text-green-400">
                            SEO: {page.seoScore}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">/{page.slug}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>By {page.author}</span>
                        <span>•</span>
                        <span>
                          Created: {new Date(page.createdDate).toLocaleDateString()}
                        </span>
                        {page.publishedDate && (
                          <>
                            <span>•</span>
                            <span>
                              Published: {new Date(page.publishedDate).toLocaleDateString()}
                            </span>
                          </>
                        )}
                        {page.scheduledDate && (
                          <>
                            <span>•</span>
                            <span className="text-blue-500">
                              Scheduled: {new Date(page.scheduledDate).toLocaleDateString()}
                            </span>
                          </>
                        )}
                        {page.views > 0 && (
                          <>
                            <span>•</span>
                            <span>{page.views.toLocaleString()} views</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Media Library Tab */}
        <TabsContent value="media">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Media Library</h2>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {mediaAssets.map((asset) => (
                <Card key={asset.id} className="p-4">
                  <div className="aspect-square bg-secondary rounded-lg mb-3 flex items-center justify-center">
                    {getMediaTypeIcon(asset.type)}
                  </div>
                  <h4 className="font-medium text-sm mb-2 line-clamp-2">{asset.name}</h4>
                  <div className="space-y-1 text-xs text-muted-foreground mb-3">
                    <p>Size: {asset.size}</p>
                    <p>Uploaded: {new Date(asset.uploadDate).toLocaleDateString()}</p>
                    <p>Used in: {asset.usedIn} pages</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-4 mt-6 bg-secondary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Storage Usage</p>
                  <p className="text-sm text-muted-foreground">49.4 MB of 10 GB used</p>
                </div>
                <div className="w-64 h-2 bg-background rounded-full overflow-hidden text-foreground">
                  <div className="h-full bg-primary" style={{ width: "0.5%" }} />
                </div>
              </div>
            </Card>
          </Card>
        </TabsContent>

        {/* Languages Tab */}
        <TabsContent value="languages">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Multi-Language Support</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Language
              </Button>
            </div>

            <div className="space-y-4">
              {languages.map((lang, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Globe className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold">{lang.name}</h3>
                        <p className="text-sm text-muted-foreground">Code: {lang.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold">{lang.pages}</p>
                        <p className="text-xs text-muted-foreground">Pages</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* SEO Tools Tab */}
        <TabsContent value="seo">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">SEO Optimization Tools</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-4">
                <h3 className="font-bold mb-4">Average SEO Score</h3>
                <div className="text-center">
                  <p className="text-5xl font-bold text-green-500 mb-2">85</p>
                  <p className="text-sm text-muted-foreground">Across all pages</p>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-bold mb-4">Pages Needing Attention</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-500">Score &lt; 60</span>
                    <span className="font-bold">3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-500">Score 60-79</span>
                    <span className="font-bold">12</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-500">Score 80+</span>
                    <span className="font-bold">141</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-bold mb-4">SEO Features</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Auto-generated sitemaps
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Meta tag optimization
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Keyword suggestions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Open Graph tags
                  </li>
                </ul>
              </Card>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
