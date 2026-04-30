'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const travelImages = [
  {
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
    alt: "Zanzibar beach",
  },
  {
    src: "https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=800&auto=format&fit=crop",
    alt: "Serengeti safari",
  },
  {
    src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop",
    alt: "Mount Kilimanjaro",
  },
  {
    src: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=800&auto=format&fit=crop",
    alt: "African culture",
  },
];

export function TravelVisualLayer() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number; background: string; left: string; top: string; duration: number; delay: number; yMove: number; xMove: number}>>([]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const particleCount = isMobile ? 16 : 30;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      background: `rgba(245,166,35,${0.15 + Math.random() * 0.2})`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: isMobile ? 8 + Math.random() * 4 : 6 + Math.random() * 5,
      delay: Math.random() * 2,
      yMove: isMobile ? -15 - Math.random() * 20 : -25 - Math.random() * 35,
      xMove: (Math.random() - 0.5) * (isMobile ? 15 : 30),
    }));
    setParticles(newParticles);
  }, [isMobile]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % travelImages.length);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleError = () => {
    setImageError(true);
  };

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">

      {/* BASE BACKGROUND - Cinematic dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0F]/90 via-[#0C0C12]/85 to-[#0A0A0F]/90" />

      {/* TRAVEL IMAGES ROTATION - Cinematic blurred background */}
      {!imageError && (
        <AnimatePresence mode="wait">
          {travelImages.map((img, index) =>
            currentIndex === index && (
              <motion.div
                key={img.alt}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: isMobile ? 1.3 : 1.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.5, ease: [0.4, 0, 0.2, 1] }}
              >
                <motion.div
                  className="absolute inset-0"
                  animate={{ scale: [1.02, 1.05, 1.02] }}
                  transition={{ duration: isMobile ? 20 : 16, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover"
                    style={{ filter: isMobile ? 'blur(2px) brightness(1.05)' : 'blur(3px) brightness(1.05)' }}
                    onError={handleError}
                    priority={index === 0}
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="100vw"
                    quality={75}
                  />
                  <div className="absolute inset-0 bg-black/10 mix-blend-multiply" />
                </motion.div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      )}

      {/* AMBIENT GLOW ORBS - Cinematic atmosphere - Responsive sizes */}
      <motion.div
        className={`absolute top-0 right-0 rounded-full ${isMobile ? 'w-[200px] h-[200px]' : 'w-[400px] h-[400px]'}`}
        style={{
          background: 'radial-gradient(circle at center, rgba(0,229,160,0.15) 0%, transparent 70%)',
          zIndex: 1,
        }}
        animate={{ 
          scale: [1, 1.1, 1],
          x: isMobile ? [0, 15, 0] : [0, 30, 0],
          y: isMobile ? [0, -10, 0] : [0, -20, 0],
        }}
        transition={{ duration: isMobile ? 10 : 8, repeat: Infinity }}
      />

      <motion.div
        className={`absolute bottom-0 left-0 rounded-full ${isMobile ? 'w-[150px] h-[150px]' : 'w-[300px] h-[300px]'}`}
        style={{
          background: 'radial-gradient(circle, rgba(245,166,35,0.15) 0%, transparent 70%)',
          zIndex: 1,
        }}
        animate={{ 
          scale: [1, 1.15, 1],
          x: isMobile ? [0, -10, 0] : [0, -20, 0],
          y: isMobile ? [0, 15, 0] : [0, 30, 0],
        }}
        transition={{ duration: isMobile ? 8 : 6, repeat: Infinity, delay: 2 }}
      />

      <motion.div
        className={`absolute top-1/2 left-1/2 rounded-full ${isMobile ? 'w-[120px] h-[120px]' : 'w-[250px] h-[250px]'}`}
        style={{
          background: 'radial-gradient(circle, rgba(74,158,255,0.1) 0%, transparent 70%)',
          zIndex: 1,
        }}
        animate={{ 
          scale: [1, 1.2, 1],
          x: isMobile ? [0, 20, -20, 0] : [0, 40, -40, 0],
          y: isMobile ? [0, -15, 15, 0] : [0, -30, 30, 0],
        }}
        transition={{ duration: isMobile ? 12 : 10, repeat: Infinity, delay: 1 }}
      />

      {/* Floating particles - Reduced count on mobile for performance */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'}`}
          style={{
            background: particle.background,
            boxShadow: '0 0 6px rgba(245,166,35,0.3)',
            left: particle.left,
            top: particle.top,
            zIndex: 2,
          }}
          animate={{
            y: [0, particle.yMove, 0],
            x: [0, particle.xMove, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* LOCAL FALLBACK IMAGE - Shows if Unsplash images fail */}
      {imageError && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: isMobile ? 1.3 : 1.8 }}
          transition={{ duration: 2.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.div
            className="absolute inset-0"
            animate={{ scale: [1.02, 1.05, 1.02] }}
            transition={{ duration: isMobile ? 20 : 16, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Image
              src="/fallback.jpg"
              alt="Tanzania travel background"
              fill
              className="object-cover"
              style={{ filter: isMobile ? 'blur(2px) brightness(1.05)' : 'blur(3px) brightness(1.05)' }}
              priority
              loading="eager"
              sizes="100vw"
              quality={75}
            />
            <div className="absolute inset-0 bg-black/10 mix-blend-multiply" />
          </motion.div>
        </motion.div>
      )}

    </div>
  );
}