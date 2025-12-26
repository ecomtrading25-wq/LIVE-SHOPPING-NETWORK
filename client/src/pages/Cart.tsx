import { Link } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CreditCard } from "lucide-react";
import { toast } from "sonner";

/**
 * Shopping Cart Page
 * View cart items and proceed to checkout
 */

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  
  const checkoutMutation = trpc.checkout.createSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Redirecting to checkout...");
        window.open(data.url, "_blank");
        // Clear cart after successful checkout creation
        setTimeout(() => clearCart(), 1000);
      }
    },
    onError: (error) => {
      toast.error(`Checkout failed: ${error.message}`);
    },
  });

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    
    checkoutMutation.mutate({
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="text-2xl font-bold text-white hover:text-purple-400 transition-colors">
                Live Shopping Network
              </a>
            </Link>
            <Link href="/products">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <Link href="/products">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-white">Shopping Cart</h1>
              <p className="text-gray-400">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </p>
            </div>

            {items.length === 0 ? (
              <Card className="p-12 bg-white/5 border-white/10 text-center">
                <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-6">Your cart is empty</p>
                <Link href="/products">
                  <Button>Start Shopping</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <Card
                    key={item.productId}
                    className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-6">
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="w-12 h-12 text-white/50" />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <Link href={`/products/${item.productId}`}>
                          <h3 className="text-lg font-bold text-white hover:text-purple-400 transition-colors mb-2">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="text-2xl font-bold text-white">${item.price}</p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 bg-white/10 rounded-lg p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="text-white hover:bg-white/10"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.productId, parseInt(e.target.value) || 1)
                          }
                          className="w-16 text-center bg-transparent border-none text-white font-bold"
                          min="1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="text-white hover:bg-white/10"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          removeItem(item.productId);
                          toast.success("Item removed from cart");
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="p-6 bg-white/5 border-white/10 sticky top-6">
              <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-gray-300">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="font-medium">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Shipping</span>
                  <span className="font-medium text-green-400">FREE</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Tax</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-white">Total</span>
                    <span className="text-3xl font-bold text-white">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg h-14 mb-4"
                onClick={handleCheckout}
                disabled={items.length === 0 || checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? (
                  "Processing..."
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-3" />
                    Proceed to Checkout
                  </>
                )}
              </Button>

              <p className="text-sm text-gray-400 text-center">
                Secure checkout powered by Stripe
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
