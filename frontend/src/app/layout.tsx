'use client';

import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import { ReactQueryProvider } from '@/providers/ReactQueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import './globals.css';
import { useEffect } from 'react';

// Dynamic viewport height for mobile keyboard handling
function ViewportHeightManager() {
  useEffect(() => {
    const updateAppHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--app-height', `${vh * 100}px`);
    };

    updateAppHeight();
    window.addEventListener('resize', updateAppHeight);
    window.addEventListener('orientationchange', updateAppHeight);

    return () => {
      window.removeEventListener('resize', updateAppHeight);
      window.removeEventListener('orientationchange', updateAppHeight);
    };
  }, []);

  return null;
}

export const metadata: Metadata = {
  title: 'Kilicare+ | Tanzania Tourism Super-App',
  description: 'Discover Tanzania like never before. AI-powered travel companion for East Africa.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kilicare+',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="bg-dark-bg text-text-primary font-body antialiased min-h-[var(--app-height)]">
        <ViewportHeightManager />
        <ReactQueryProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: '#1C1C27',
                  color: '#F8F8FF',
                  border: '1px solid #2A2A3A',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                },
              }}
            />
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}