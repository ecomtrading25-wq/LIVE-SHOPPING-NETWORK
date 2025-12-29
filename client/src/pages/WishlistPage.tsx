import { useState } from 'react';
import { Heart, Share2, ShoppingCart, Trash2, Bell, BellOff, TrendingDown, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function WishlistPage() {
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [priceAlertThreshold, setPriceAlertThreshold] = useState<number | null>(null);
  const [showPriceAlert, setShowPriceAlert] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  // Fetch wishlists
  const { data: wishlists, refetch } = trpc.wishlist.getUserWishlists.useQuery();

  // Fetch items for selected list
  const { data: items } = trpc.wishlist.getWishlistItems.useQuery(
    { wishlistId: selectedList || '' },
    { enabled: !!selectedList }
  );

  // Mutations
  const createList = trpc.wishlist.createWishlist.useMutation({
    onSuccess: () => {
      toast({ title: 'Wishlist created!' });
      setShowCreateList(false);
      setNewListName('');
      refetch();
    },
  });

  const removeItem = trpc.wishlist.removeFromWishlist.useMutation({
    onSuccess: () => {
      toast({ title: 'Removed from wishlist' });
      refetch();
    },
  });

  const setPriceAlert = trpc.wishlist.setPriceAlert.useMutation({
    onSuccess: () => {
      toast({ title: 'Price alert set!' });
      setShowPriceAlert(false);
      refetch();
    },
  });

  const shareWishlist = trpc.wishlist.shareWishlist.useMutation({
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.shareUrl);
      toast({ title: 'Share link copied to clipboard!' });
    },
  });

  const handleAddToCart = (productId: string, productName: string) => {
    addToCart({
      id: productId,
      name: productName,
      price: 0, // Will be fetched from product data
      quantity: 1,
      image: '',
    });
    toast({ title: `${productName} added to cart!` });
  };

  const handleSetPriceAlert = () => {
    if (!selectedProduct || !priceAlertThreshold) return;

    setPriceAlert.mutate({
      productId: selectedProduct,
      targetPrice: priceAlertThreshold,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Wishlists</h1>
          <p className="text-muted-foreground">Save your favorite items and get notified of price drops</p>
        </div>

        {/* Wishlist Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <Button
            variant={selectedList === null ? 'default' : 'outline'}
            onClick={() => setSelectedList(null)}
            className="whitespace-nowrap"
          >
            All Items
          </Button>
          {wishlists?.map((list) => (
            <Button
              key={list.id}
              variant={selectedList === list.id ? 'default' : 'outline'}
              onClick={() => setSelectedList(list.id)}
              className="whitespace-nowrap"
            >
              {list.name} ({list.itemCount || 0})
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={() => setShowCreateList(true)}
            className="whitespace-nowrap"
          >
            + New List
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-background text-foreground/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Items</p>
                  <p className="text-3xl font-bold text-foreground">
                    {items?.length || 0}
                  </p>
                </div>
                <Heart className="w-8 h-8 text-pink-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background text-foreground/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Price Drops</p>
                  <p className="text-3xl font-bold text-green-400">
                    {items?.filter((item) => item.priceDropPercentage && item.priceDropPercentage > 0).length || 0}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background text-foreground/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">In Stock</p>
                  <p className="text-3xl font-bold text-foreground">
                    {items?.filter((item) => item.inStock).length || 0}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background text-foreground/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Active Alerts</p>
                  <p className="text-3xl font-bold text-foreground">
                    {items?.filter((item) => item.priceAlertEnabled).length || 0}
                  </p>
                </div>
                <Bell className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wishlist Items Grid */}
        {items && items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="bg-background text-foreground/10 backdrop-blur border-white/20 overflow-hidden group">
                <div className="relative">
                  <img
                    src={item.productImage || '/placeholder.jpg'}
                    alt={item.productName}
                    className="w-full h-48 object-cover"
                  />
                  {item.priceDropPercentage && item.priceDropPercentage > 0 && (
                    <Badge className="absolute top-2 left-2 bg-green-500">
                      {item.priceDropPercentage}% OFF
                    </Badge>
                  )}
                  {!item.inStock && (
                    <Badge className="absolute top-2 right-2 bg-red-500">
                      Out of Stock
                    </Badge>
                  )}
                </div>

                <CardContent className="p-4 space-y-3">
                  <h3 className="text-foreground font-semibold line-clamp-2 h-12">
                    {item.productName}
                  </h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        ${item.currentPrice?.toFixed(2)}
                      </p>
                      {item.originalPrice && item.originalPrice > item.currentPrice && (
                        <p className="text-sm text-gray-400 line-through">
                          ${item.originalPrice.toFixed(2)}
                        </p>
                      )}
                    </div>
                    {item.inStock ? (
                      <Badge className="bg-green-500/20 text-green-400">In Stock</Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400">Out of Stock</Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={!item.inStock}
                      onClick={() => handleAddToCart(item.productId, item.productName)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedProduct(item.productId);
                        setPriceAlertThreshold(item.currentPrice);
                        setShowPriceAlert(true);
                      }}
                    >
                      {item.priceAlertEnabled ? (
                        <Bell className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <BellOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeItem.mutate({ wishlistItemId: item.id })}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>

                  {item.priceAlertEnabled && item.targetPrice && (
                    <p className="text-xs text-gray-400">
                      Alert when price drops below ${item.targetPrice.toFixed(2)}
                    </p>
                  )}

                  <p className="text-xs text-gray-500">
                    Added {new Date(item.addedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-background text-foreground/10 backdrop-blur border-white/20">
            <CardContent className="py-12 text-center">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Your wishlist is empty</h3>
              <p className="text-gray-400 mb-4">
                Start adding products you love to keep track of them
              </p>
              <Button>Browse Products</Button>
            </CardContent>
          </Card>
        )}

        {/* Share Button */}
        {selectedList && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => shareWishlist.mutate({ wishlistId: selectedList })}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share This Wishlist
            </Button>
          </div>
        )}
      </div>

      {/* Create List Dialog */}
      <Dialog open={showCreateList} onOpenChange={setShowCreateList}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Wishlist</DialogTitle>
            <DialogDescription>
              Organize your favorite items into different lists
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="list-name">List Name</Label>
              <Input
                id="list-name"
                placeholder="e.g., Birthday Wishlist"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
            </div>
            <Button
              onClick={() => createList.mutate({ name: newListName, isPublic: false })}
              disabled={!newListName || createList.isPending}
              className="w-full"
            >
              Create Wishlist
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Price Alert Dialog */}
      <Dialog open={showPriceAlert} onOpenChange={setShowPriceAlert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Price Alert</DialogTitle>
            <DialogDescription>
              Get notified when the price drops below your target
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="target-price">Target Price ($)</Label>
              <Input
                id="target-price"
                type="number"
                step="0.01"
                value={priceAlertThreshold || ''}
                onChange={(e) => setPriceAlertThreshold(parseFloat(e.target.value))}
              />
            </div>
            <Button
              onClick={handleSetPriceAlert}
              disabled={!priceAlertThreshold || setPriceAlert.isPending}
              className="w-full"
            >
              Set Alert
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
