import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, ShoppingCart, Heart, Star } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function ProductsEnhanced() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const { data: products, isLoading } = trpc.products.list.useQuery({
    search: search || undefined,
    limit: 50,
  });

  const { data: featured } = trpc.products.featured.useQuery({ limit: 8 });
  const { data: trending } = trpc.products.trending.useQuery({ limit: 8 });

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart",
      });
    },
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = [...products];
    
    filtered = filtered.filter(p => {
      const price = parseFloat(p.price);
      return price >= priceRange[0] && price <= priceRange[1];
    });
    
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case "price-high":
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
      default:
        filtered.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
    
    return filtered;
  }, [products, priceRange, sortBy]);

  const handleAddToCart = (productId: string) => {
    addToCart.mutate({ productId, quantity: 1 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-foreground py-20">
        <div className="container">
          <h1 className="text-5xl font-bold mb-4">Discover Amazing Products</h1>
          <p className="text-xl text-indigo-100 mb-8">
            Shop from thousands of products with live shopping experiences
          </p>
          
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg bg-white text-slate-900 border-0 shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {featured && featured.length > 0 && (
        <div className="container py-16">
          <h2 className="text-3xl font-bold mb-8">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                featured
              />
            ))}
          </div>
        </div>
      )}

      <div className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">All Products</h2>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name: A to Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Price Range: ${priceRange[0]} - ${priceRange[1]}
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={1000}
                  step={10}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-48 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-slate-600">No products found</p>
            <p className="text-slate-500 mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: any;
  onAddToCart: (productId: string) => void;
  featured?: boolean;
  trending?: boolean;
}

function ProductCard({ product, onAddToCart, featured, trending }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {(featured || trending) && (
        <Badge
          className="absolute top-4 right-4 z-10"
          variant={featured ? "default" : "destructive"}
        >
          {featured ? "Featured" : "Trending"}
        </Badge>
      )}

      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <ShoppingCart className="h-16 w-16" />
            </div>
          )}
          
          {isHovered && (
            <div className="absolute inset-0 bg-background/40 flex items-center justify-center text-foreground">
              <Button variant="secondary" size="sm">
                Quick View
              </Button>
            </div>
          )}
        </div>
      </Link>

      <CardHeader>
        <CardTitle className="line-clamp-2 text-lg">{product.name}</CardTitle>
        {product.description && (
          <CardDescription className="line-clamp-2">
            {product.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-bold text-indigo-600">
            ${parseFloat(product.price).toFixed(2)}
          </span>
          {product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price) && (
            <>
              <span className="text-sm text-slate-500 line-through">
                ${parseFloat(product.compareAtPrice).toFixed(2)}
              </span>
              <Badge variant="destructive" className="ml-auto">
                {Math.round((1 - parseFloat(product.price) / parseFloat(product.compareAtPrice)) * 100)}% OFF
              </Badge>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < 4 ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
              }`}
            />
          ))}
          <span className="text-sm text-slate-600 ml-2">(4.0)</span>
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          onClick={() => onAddToCart(product.id)}
          className="flex-1 gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </Button>
        <Button variant="outline" size="icon">
          <Heart className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
