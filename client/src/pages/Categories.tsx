import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Laptop,
  Shirt,
  Sparkles,
  Home,
  Dumbbell,
  Book,
  Baby,
  Utensils,
  ArrowRight,
} from "lucide-react";

export default function CategoriesPage() {
  const categories = [
    {
      id: "electronics",
      name: "Electronics",
      icon: Laptop,
      productCount: 1234,
      description: "Latest gadgets, computers, and tech accessories",
      color: "from-blue-500 to-cyan-500",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400",
    },
    {
      id: "fashion",
      name: "Fashion",
      icon: Shirt,
      productCount: 2567,
      description: "Trending clothing, shoes, and accessories",
      color: "from-pink-500 to-rose-500",
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400",
    },
    {
      id: "beauty",
      name: "Beauty & Personal Care",
      icon: Sparkles,
      productCount: 892,
      description: "Skincare, makeup, and wellness products",
      color: "from-red-500 to-orange-500",
      image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400",
    },
    {
      id: "home",
      name: "Home & Garden",
      icon: Home,
      productCount: 1456,
      description: "Furniture, decor, and outdoor essentials",
      color: "from-green-500 to-emerald-500",
      image: "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=400",
    },
    {
      id: "sports",
      name: "Sports & Fitness",
      icon: Dumbbell,
      productCount: 678,
      description: "Equipment, apparel, and nutrition",
      color: "from-orange-500 to-red-500",
      image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400",
    },
    {
      id: "books",
      name: "Books & Media",
      icon: Book,
      productCount: 3421,
      description: "Books, movies, music, and games",
      color: "from-indigo-500 to-red-500",
      image: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400",
    },
    {
      id: "baby",
      name: "Baby & Kids",
      icon: Baby,
      productCount: 945,
      description: "Toys, clothing, and essentials for children",
      color: "from-yellow-500 to-orange-500",
      image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400",
    },
    {
      id: "food",
      name: "Food & Beverages",
      icon: Utensils,
      productCount: 1123,
      description: "Gourmet foods, snacks, and drinks",
      color: "from-red-500 to-pink-500",
      image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">Shop by Category</h1>
          <p className="text-xl text-muted-foreground">
            Explore our wide range of products across different categories
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.id} href={`/products?category=${category.id}`}>
                <Card className="group bg-background text-foreground/10 backdrop-blur-xl border-white/20 hover:border-red-500/50 transition-all duration-300 overflow-hidden cursor-pointer h-full">
                  {/* Category Image */}
                  <div className="relative h-48 overflow-hidden">
                    <div
                      className="absolute inset-0 bg-cover bg-center transform group-hover:scale-110 transition-transform duration-500"
                      style={{ backgroundImage: `url(${category.image})` }}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-60`} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 bg-background text-foreground/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Icon className="w-10 h-10 text-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Category Info */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-red-400 transition-colors">
                        {category.name}
                      </h3>
                      <Badge className="bg-red-600">{category.productCount}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">{category.description}</p>
                    <Button
                      variant="ghost"
                      className="w-full border-white/20 text-foreground hover:bg-background/10 group-hover:bg-red-600 group-hover:border-red-600 transition-colors"
                    >
                      Browse
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Featured Categories Banner */}
        <div className="mt-16">
          <Card className="p-8 bg-gradient-to-r from-red-600 to-orange-600 border-0 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Can't find what you're looking for?
            </h2>
            <p className="text-white/90 mb-6">
              Use our advanced search to find exactly what you need
            </p>
            <Link href="/products">
              <Button className="bg-background text-foreground text-red-600 hover:bg-gray-100">
                Browse All Products
              </Button>
            </Link>
          </Card>
        </div>

        {/* Popular Categories */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            Popular This Week
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 4).map((category) => {
              const Icon = category.icon;
              return (
                <Link key={category.id} href={`/products?category=${category.id}`}>
                  <Card className="p-6 bg-background text-foreground/10 backdrop-blur-xl border-white/20 hover:border-red-500/50 transition-all cursor-pointer text-center">
                    <div className={`w-16 h-16 bg-gradient-to-br ${category.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="w-8 h-8 text-foreground" />
                    </div>
                    <h3 className="text-foreground font-bold">{category.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      {category.productCount} products
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
