'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

// Invisible Background Infrastructure - Ultra-light, Zero-lag
const backgroundImages = [
  { src: "/A.webp", alt: "Environment 1" },
  { src: "/B.webp", alt: "Environment 2" },
  { src: "/C.webp", alt: "Environment 3" },
  { src: "/D.webp", alt: "Environment 4" },
  { src: "/G.webp", alt: "Environment 5" },
  { src: "/H.webp", alt: "Environment 6" },
];

export function TravelVisualLayer() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Calm rhythm - 9 seconds interval, 2 second fade
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      
      {/* Minimal gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/30" />

      {/* INVISIBLE BACKGROUND - CSS opacity transition only */}
      <div className="absolute inset-0">
        {backgroundImages.map((img, index) => (
          <div
            key={img.src}
            className="absolute inset-0 transition-opacity duration-2000 ease-in-out"
            style={{
              opacity: currentIndex === index ? 1 : 0,
            }}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover"
              priority={index === 0}
              loading={index === 0 ? "eager" : "lazy"}
              sizes="100vw"
              quality={85}
            />
          </div>
        ))}
      </div>

    </div>
  );
}