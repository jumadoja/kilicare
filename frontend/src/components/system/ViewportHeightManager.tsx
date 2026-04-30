'use client';

import { useEffect } from 'react';

export default function ViewportHeightManager() {
  useEffect(() => {
    const updateAppHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--app-height', `${vh * 100}px`);
    };

    updateAppHeight();
    window.addEventListener('resize', updateAppHeight);
    window.addEventListener('orientationchange', updateAppHeight);

    // Optional: Handle mobile keyboard with visualViewport
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateAppHeight);
    }

    return () => {
      window.removeEventListener('resize', updateAppHeight);
      window.removeEventListener('orientationchange', updateAppHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateAppHeight);
      }
    };
  }, []);

  return null;
}
