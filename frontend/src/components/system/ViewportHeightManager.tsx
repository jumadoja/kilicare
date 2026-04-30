'use client';

import { useEffect } from 'react';

export default function ViewportHeightManager() {
  useEffect(() => {
    const updateAppHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--app-height', `${vh * 100}px`);
    };

    const handleKeyboardState = () => {
      if (window.visualViewport) {
        const viewport = window.visualViewport;
        const keyboardOpen = viewport.height < window.innerHeight * 0.85;
        
        if (keyboardOpen) {
          document.body.classList.add('keyboard-open');
        } else {
          document.body.classList.remove('keyboard-open');
        }
      }
    };

    updateAppHeight();
    handleKeyboardState();
    
    window.addEventListener('resize', updateAppHeight);
    window.addEventListener('orientationchange', updateAppHeight);

    // Handle mobile keyboard with visualViewport
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateAppHeight);
      window.visualViewport.addEventListener('resize', handleKeyboardState);
    }

    return () => {
      window.removeEventListener('resize', updateAppHeight);
      window.removeEventListener('orientationchange', updateAppHeight);
      document.body.classList.remove('keyboard-open');
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateAppHeight);
        window.visualViewport.removeEventListener('resize', handleKeyboardState);
      }
    };
  }, []);

  return null;
}
