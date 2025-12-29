import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface MobileQuickAddButtonProps {
  productId: string;
  productName: string;
  price: number;
  image: string;
  inStock: boolean;
}

/**
 * Mobile Quick Add to Cart Button
 * Floating action button that sticks to bottom of screen
 * Shows success animation and auto-hides after adding
 */
export default function MobileQuickAddButton({
  productId,
  productName,
  price,
  image,
  inStock,
}: MobileQuickAddButtonProps) {
  const { addItem } = useCart();
  const [isVisible, setIsVisible] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    // Show button when user scrolls down
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const shouldShow = scrollPosition > 300;
      setIsVisible(shouldShow);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAddToCart = () => {
    if (!inStock) return;

    addItem({
      id: productId,
      name: productName,
      price,
      quantity: 1,
      image,
    });

    // Show success state
    setIsAdded(true);

    // Reset after 2 seconds
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 md:hidden">
      <Button
        onClick={handleAddToCart}
        disabled={!inStock || isAdded}
        className={`
          w-14 h-14 rounded-full shadow-lg transition-all duration-300
          ${isAdded
            ? "bg-green-600 hover:bg-green-600 scale-110"
            : "bg-red-600 hover:bg-red-700"
          }
          ${!inStock ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {isAdded ? (
          <Check className="w-6 h-6 animate-bounce" />
        ) : (
          <ShoppingCart className="w-6 h-6" />
        )}
      </Button>

      {/* Ripple effect on add */}
      {isAdded && (
        <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
      )}
    </div>
  );
}
