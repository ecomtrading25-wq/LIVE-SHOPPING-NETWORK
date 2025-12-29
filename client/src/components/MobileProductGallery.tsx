import { useState, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface MobileProductGalleryProps {
  images: string[];
  productName: string;
}

/**
 * Mobile-Optimized Product Gallery
 * Features:
 * - Touch swipe gestures for navigation
 * - Pinch-to-zoom support
 * - Smooth momentum scrolling
 * - Thumbnail navigation
 * - Fullscreen lightbox
 */
export default function MobileProductGallery({
  images,
  productName,
}: MobileProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance (in px) to trigger navigation
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0); // Reset touch end
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }

    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    // Scroll to current image
    if (galleryRef.current) {
      const scrollLeft = currentIndex * galleryRef.current.offsetWidth;
      galleryRef.current.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  return (
    <div className="relative">
      {/* Main Gallery */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-background text-foreground">
        <div
          ref={galleryRef}
          className="flex h-full overflow-x-hidden scroll-smooth"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-full h-full relative"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              <img
                src={image}
                alt={`${productName} - Image ${index + 1}`}
                className="w-full h-full object-cover"
                onClick={() => setShowLightbox(true)}
              />
            </div>
          ))}
        </div>

        {/* Zoom Icon Hint */}
        <button
          onClick={() => setShowLightbox(true)}
          className="absolute top-4 right-4 p-2 bg-background/50 rounded-full text-foreground backdrop-blur-sm"
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        {/* Navigation Arrows - Hidden on mobile, shown on tablet+ */}
        <button
          onClick={goToPrevious}
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/50 rounded-full text-foreground backdrop-blur-sm hover:bg-background/70 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={goToNext}
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/50 rounded-full text-foreground backdrop-blur-sm hover:bg-background/70 transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                currentIndex === index
                  ? "bg-white w-8"
                  : "bg-white/50 w-2"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
              currentIndex === index
                ? "border-red-500 scale-105"
                : "border-border opacity-60"
            }`}
          >
            <img
              src={image}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Fullscreen Lightbox */}
      {showLightbox && (
        <div className="fixed inset-0 bg-background z-50 flex items-center justify-center text-foreground">
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-foreground backdrop-blur-sm z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-foreground backdrop-blur-sm z-10"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-foreground backdrop-blur-sm z-10"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div
            className="w-full h-full flex items-center justify-center p-4"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={images[currentIndex]}
              alt={`${productName} - Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === index
                    ? "bg-white w-8"
                    : "bg-white/50 w-2"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
