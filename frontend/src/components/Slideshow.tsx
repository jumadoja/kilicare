"use client";

import { useEffect, useState } from "react";

interface SlideshowProps {
  images: string[];
  interval?: number; // milliseconds
}

export default function Slideshow({ images, interval = 6000 }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images, interval]);

  return (
    <div className="slideshow-root">
      {/* 1. MASHINE YA PICHA (Slides) */}
      {images.map((img, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={index}
            /* Tumia template literal badala ya inline opacity. 
               Hii inaruhusu CSS transition ifanye kazi kwa ulaini zaidi.
            */
            className={`slide-wrapper ${isActive ? "opacity-100 z-10" : "opacity-0 z-0"}`}
            style={{ 
              opacity: isActive ? 1 : 0,
              transition: 'opacity 1.8s cubic-bezier(0.4, 0, 0.2, 1)' 
            }}
          >
            <div 
              className="slide-img" 
              style={{ backgroundImage: `url(${img})` }} 
              aria-label={`Slide ${index + 1}`}
            />
          </div>
        );
      })}

      {/* 2. OVERLAY: Inaleta ile feeling ya giza/gradient ili maandishi yaonekane */}
      <div className="slide-overlay" />

      {/* 3. PILL INDICATORS: Doti za kisasa (Dots) */}
      <div className="slide-dots">
        {images.map((_, i) => (
          <button 
            key={i} 
            type="button"
            className={`dot ${i === currentIndex ? "active" : ""}`} 
            onClick={() => setCurrentIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}