import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function CartEnhanced() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: cart, isLoading } = trpc.cart.get.useQuery();

  const updateQuantity = trpc.cart.update.useMutation({
    onMutate: async ({ cartItemId, quantity }) => {
      await utils.cart.get.cancel();
      const previousCart = utils.cart.get.getData();

      utils.cart.get.setData(undefined, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item) =>
            item.cartItem.id === cartItemId
              ? { ...item, cartItem: { ...item.cartItem, quantity } }
              : item
          ),
        };
      });

      return { previousCart };
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        utils.cart.get.setData(undefined, context.previousCart);
      }
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    },
    onSettled: () => {
      utils.cart.get.invalidate();
    },
  });

  const removeItem = trpc.cart.remove.useMutation({
    onMutate: async ({ cartItemId }) => {
      await utils.cart.get.cancel();
      const previousCart = utils.cart.get.getData();

      utils.cart.get.setData(undefined, (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.filter((item) => item.cartItem.id !== cartItemId),
        };
      });

      return { previousCart };
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        utils.cart.get.setData(undefined, context.previousCart);
      }
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart",
      });
    },
    onSettled: () => {
      utils.cart.get.invalidate();
    },
  });

  const handleQuantityChange = (cartItemId: string, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity < 1) return;
    updateQuantity.mutate({ cartItemId, quantity: newQuantity });
  };

  const handleRemove = (cartItemId: string) => {
    removeItem.mutate({ cartItemId });
  };

  const handleCheckout = () => {
    setLocation("/checkout-enhanced");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="container max-w-6xl">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="container max-w-2xl text-center">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <ShoppingBag className="h-24 w-24 text-slate-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-slate-600 mb-8">
              Start shopping to add items to your cart
            </p>
            <Link href="/products-enhanced">
              <Button size="lg" className="gap-2">
                <ShoppingBag className="h-5 w-5" />
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const price = parseFloat(item.product.price);
    const quantity = item.cartItem.quantity;
    return sum + price * quantity;
  }, 0);

  const tax = subtotal * 0.1;
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = subtotal + tax + shipping;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      <div className="container max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Shopping Cart</h1>
          <p className="text-slate-600">
            {cart.items.length} {cart.items.length === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <Card key={item.cartItem.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Product Image */}
                    <div className="relative w-32 h-32 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden">
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ShoppingBag className="h-12 w-12" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.product.id}`}>
                        <h3 className="text-lg font-semibold mb-1 hover:text-indigo-600 transition-colors">
                          {item.product.name}
                        </h3>
                      </Link>
                      {item.product.description && (
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                          {item.product.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{item.product.sku}</Badge>
                        {item.product.status === "active" && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            In Stock
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Price & Quantity */}
                    <div className="flex flex-col items-end gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-600">
                          ${(parseFloat(item.product.price) * item.cartItem.quantity).toFixed(2)}
                        </div>
                        <div className="text-sm text-slate-600">
                          ${parseFloat(item.product.price).toFixed(2)} each
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleQuantityChange(item.cartItem.id, item.cartItem.quantity, -1)
                          }
                          disabled={item.cartItem.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="w-12 text-center font-medium">
                          {item.cartItem.quantity}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleQuantityChange(item.cartItem.id, item.cartItem.quantity, 1)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemove(item.cartItem.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tax (10%)</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <Badge variant="secondary">FREE</Badge>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                {shipping > 0 && subtotal < 50 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    Add ${(50 - subtotal).toFixed(2)} more for free shipping!
                  </div>
                )}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-indigo-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Link href="/products-enhanced" className="w-full">
                  <Button variant="outline" size="lg" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
