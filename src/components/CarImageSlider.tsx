import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CarImageSliderProps = {
  images: string[];
  alt: string;
  fallbackImage?: string;
  className?: string;
};

export const CarImageSlider = ({ images, alt, fallbackImage, className }: CarImageSliderProps) => {
  const slides = images.length > 0 ? images : fallbackImage ? [fallbackImage] : [];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const goToPrevious = () => {
    setActiveIndex((index) => (index - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setActiveIndex((index) => (index + 1) % slides.length);
  };

  if (slides.length === 0) {
    return <div className={cn("aspect-[4/3] bg-secondary", className)} />;
  }

  return (
    <div className={cn("relative overflow-hidden bg-secondary", className)}>
      {slides.map((image, index) => (
        <img
          key={`${image.slice(0, 32)}-${index}`}
          src={image}
          alt={index === 0 ? alt : `${alt} ${index + 1}`}
          loading="lazy"
          width={800}
          height={600}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105",
            index === activeIndex ? "opacity-100" : "opacity-0",
          )}
          onError={(event) => {
            if (!fallbackImage) return;
            event.currentTarget.onerror = null;
            event.currentTarget.src = fallbackImage;
          }}
        />
      ))}

      {slides.length > 1 && (
        <>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-background/80 text-foreground shadow hover:bg-background"
            onClick={goToPrevious}
            aria-label="Image precedente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-background/80 text-foreground shadow hover:bg-background"
            onClick={goToNext}
            aria-label="Image suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                className={cn(
                  "h-2 w-2 rounded-full bg-background/70 transition-all",
                  index === activeIndex && "w-5 bg-primary",
                )}
                onClick={() => setActiveIndex(index)}
                aria-label={`Voir image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
