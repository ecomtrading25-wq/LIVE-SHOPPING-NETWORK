import { useState } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Tag,
  ArrowRight,
  Package,
} from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeItem } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = (subtotal - discount) * 0.08;
  const total = subtotal - discount + shipping + tax;

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === "SAVE10") {
      setPromoApplied(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container py-8">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold">Shopping Cart</h1>
              <p className="text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "items"} in your cart
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Add some products to get started
            </p>
            <Link href="/products">
              <Button size="lg">
                <Package className="w-5 h-5 mr-2" />
                Browse Products
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.image || "/placeholder.jpg"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Link href={`/products/${item.id}`}>
                            <h3 className="font-bold hover:text-primary cursor-pointer">
                              {item.name}
                            </h3>
                          </Link>
                          {item.variant && (
                            <p className="text-sm text-muted-foreground">
                              {item.variant}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(item.id, Math.max(1, item.quantity - 1))
                            }
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-12 text-center font-bold">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <p className="text-xl font-bold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <Card className="p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>

                  {promoApplied && (
                    <div className="flex justify-between text-green-500">
                      <span>Discount (10%)</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>

                  {shipping === 0 && (
                    <p className="text-xs text-green-500">
                      Free shipping on orders over $50
                    </p>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg">
                      <span className="font-bold">Total</span>
                      <span className="font-bold">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={promoApplied}
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyPromo}
                      disabled={promoApplied}
                    >
                      <Tag className="w-4 h-4 mr-2" />
                      Apply
                    </Button>
                  </div>
                  {promoApplied && (
                    <p className="text-xs text-green-500 mt-2">
                      Promo code applied successfully!
                    </p>
                  )}
                </div>

                <Link href="/checkout">
                  <Button className="w-full" size="lg">
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>

                <Link href="/products">
                  <Button variant="outline" className="w-full mt-2">
                    Continue Shopping
                  </Button>
                </Link>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3 text-sm">
                  <Package className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Free Shipping</p>
                    <p className="text-muted-foreground">On orders over $50</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
