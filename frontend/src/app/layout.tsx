import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { ReactQueryProvider } from '@/providers/ReactQueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import './globals.css';
import ViewportHeightManager from '@/components/system/ViewportHeightManager';
import { ErrorBoundary } from '@/components/ui/ErrorBoundaryWrapper';

const fontDisplay = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const fontBody = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

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
  const fontVars = `${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`;

  return (
    <html lang="en" data-scroll-behavior="smooth" className={fontVars}>
      <body className="bg-dark-bg text-text-primary font-body antialiased min-h-[var(--app-height)]">
        <ViewportHeightManager />
        <ErrorBoundary>
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
                    fontFamily: 'var(--font-body), system-ui, sans-serif',
                  },
                }}
              />
            </AuthProvider>
          </ReactQueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}