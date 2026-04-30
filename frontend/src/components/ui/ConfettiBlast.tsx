'use client';
import { useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';

export function useConfetti() {
  const ref = useRef<confetti.CreateTypes | null>(null);

  const fire = useCallback((options?: confetti.Options) => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F5A623', '#E84545', '#00E5A0', '#4A9EFF', '#FFB84D'],
      ...options,
    });
  }, []);

  const celebratePoints = useCallback((points: number) => {
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.5, x: 0.5 },
      colors: ['#F5A623', '#FFB84D', '#D4891A'],
      scalar: 0.8,
    });
  }, []);

  const badgeUnlock = useCallback(() => {
    const count = 3;
    const defaults = {
      origin: { y: 0.4 },
      colors: ['#F5A623', '#E84545', '#A855F7', '#00E5A0'],
    };

    const shoot = () => {
      confetti({ ...defaults, particleCount: 40, spread: 80, angle: 60 });
      confetti({ ...defaults, particleCount: 40, spread: 80, angle: 120 });
    };

    shoot();
    setTimeout(shoot, 200);
    setTimeout(shoot, 400);
  }, []);

  const burst = useCallback((x: number, y: number) => {
    if (typeof window === 'undefined') return;
    
    confetti({
      particleCount: 30,
      spread: 40,
      origin: {
        x: x / window.innerWidth,
        y: y / window.innerHeight,
      },
      colors: ['#E84545', '#FF6B6B', '#FFB84D'],
      scalar: 0.7,
    });
  }, []);

  return { fire, celebratePoints, badgeUnlock, burst };
}