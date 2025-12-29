import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  User,
  TrendingUp,
  Video,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";

/**
 * Blog Page
 * Articles about live shopping, tips, and news
 */

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorAvatar: string;
  publishedAt: string;
  readTime: string;
  category: string;
  imageUrl: string;
  featured: boolean;
}

const mockPosts: BlogPost[] = [
  {
    id: "1",
    title: "The Future of Live Shopping: Trends to Watch in 2025",
    excerpt:
      "Discover how live shopping is revolutionizing e-commerce and what trends are shaping the industry this year.",
    content: "",
    author: "Sarah Johnson",
    authorAvatar: "",
    publishedAt: "2025-01-15",
    readTime: "5 min read",
    category: "Industry Trends",
    imageUrl: "",
    featured: true,
  },
  {
    id: "2",
    title: "10 Tips for Getting the Best Deals During Live Shows",
    excerpt:
      "Learn insider strategies to maximize savings and never miss exclusive live-only pricing.",
    content: "",
    author: "Michael Chen",
    authorAvatar: "",
    publishedAt: "2025-01-12",
    readTime: "7 min read",
    category: "Shopping Tips",
    imageUrl: "",
    featured: true,
  },
  {
    id: "3",
    title: "Behind the Scenes: How We Curate Products for Live Shows",
    excerpt:
      "Get an exclusive look at our product selection process and what makes a product perfect for live shopping.",
    content: "",
    author: "Emma Rodriguez",
    authorAvatar: "",
    publishedAt: "2025-01-10",
    readTime: "6 min read",
    category: "Behind the Scenes",
    imageUrl: "",
    featured: false,
  },
  {
    id: "4",
    title: "How to Become a Live Shopping Host: A Complete Guide",
    excerpt:
      "Interested in becoming a creator? Here's everything you need to know about hosting live shopping shows.",
    content: "",
    author: "David Kim",
    authorAvatar: "",
    publishedAt: "2025-01-08",
    readTime: "10 min read",
    category: "Creator Tips",
    imageUrl: "",
    featured: false,
  },
  {
    id: "5",
    title: "The Psychology of Live Shopping: Why It Works",
    excerpt:
      "Explore the behavioral science behind why live shopping creates such engaging and effective shopping experiences.",
    content: "",
    author: "Dr. Lisa Martinez",
    authorAvatar: "",
    publishedAt: "2025-01-05",
    readTime: "8 min read",
    category: "Psychology",
    imageUrl: "",
    featured: false,
  },
  {
    id: "6",
    title: "Success Story: How One Creator Earned $50K in a Month",
    excerpt:
      "Meet Jessica, a top-performing creator who shares her journey and strategies for success on our platform.",
    content: "",
    author: "Marketing Team",
    authorAvatar: "",
    publishedAt: "2025-01-03",
    readTime: "12 min read",
    category: "Success Stories",
    imageUrl: "",
    featured: false,
  },
];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    "All",
    "Industry Trends",
    "Shopping Tips",
    "Behind the Scenes",
    "Creator Tips",
    "Success Stories",
  ];

  const featuredPosts = mockPosts.filter((post) => post.featured);
  const regularPosts = mockPosts.filter((post) => !post.featured);

  const filteredPosts =
    selectedCategory === "All"
      ? regularPosts
      : regularPosts.filter((post) => post.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background text-foreground dark:bg-background">
      {/* Hero Section */}
      <div className="bg-background text-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="bg-background/20 text-foreground mb-4">
            <TrendingUp className="w-4 h-4 mr-2" />
            Live Shopping Blog
          </Badge>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Stories, Tips & Insights
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Stay updated with the latest trends, tips, and success stories from the
            world of live shopping
          </p>
        </div>
      </div>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-1 h-8 bg-red-600 rounded-full"></div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-foreground">
              Featured Articles
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredPosts.map((post) => (
              <Card
                key={post.id}
                className="overflow-hidden bg-background dark:bg-background border-zinc-200 dark:border-border hover:border-red-500 transition-all group cursor-pointer text-foreground"
              >
                <div className="aspect-video bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/20 dark:to-pink-900/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600/50 to-orange-600/50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="w-16 h-16 text-foreground" />
                  </div>
                  <Badge className="absolute top-4 left-4 bg-red-600 text-foreground">
                    Featured
                  </Badge>
                </div>

                <div className="p-6">
                  <Badge className="mb-3">{post.category}</Badge>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-foreground mb-3 group-hover:text-red-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.publishedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {post.readTime}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                    >
                      Read More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-200 dark:border-border">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-foreground" />
                    </div>
                    <span className="text-sm font-medium text-zinc-900 dark:text-foreground">
                      {post.author}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="container mx-auto px-4 pb-8">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={
                selectedCategory === category
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Regular Posts Grid */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <Card
              key={post.id}
              className="overflow-hidden bg-background dark:bg-background border-zinc-200 dark:border-border hover:border-red-500 transition-all group cursor-pointer text-foreground"
            >
              <div className="aspect-video bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/30 to-pink-600/30 group-hover:opacity-75 transition-opacity"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShoppingBag className="w-12 h-12 text-white/60" />
                </div>
              </div>

              <div className="p-6">
                <Badge className="mb-3" variant="secondary">
                  {post.category}
                </Badge>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-foreground mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>

                <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.readTime}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-foreground" />
                    </div>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {post.author}
                    </span>
                  </div>

                  <Button variant="ghost" size="sm" className="text-red-600">
                    Read
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Newsletter CTA */}
      <div className="container mx-auto px-4 pb-16">
        <Card className="p-12 bg-gradient-to-br from-red-600 to-orange-600 border-0 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Never Miss an Update
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and get the latest articles, tips, and
            exclusive deals delivered to your inbox
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg bg-background text-foreground text-zinc-900 placeholder:text-zinc-500"
            />
            <Button size="lg" className="bg-background hover:bg-card text-foreground">
              Subscribe
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
