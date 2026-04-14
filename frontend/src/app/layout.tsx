"use client";

import "./globals.css";
import React, { useEffect } from "react";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import { Toaster } from "react-hot-toast";
import { initAuthStore } from "@/store/authStore";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Logic ya kutambua kurasa kwa ajili ya usimamizi wa hali ya juu
  const isDashboard = pathname.startsWith("/dashboard");
  
  // Nimehakikisha hapa forgot-password inatambulika vizuri
  const isAuthPage = 
    pathname.startsWith("/login") || 
    pathname.startsWith("/register") || 
    pathname.startsWith("/forgot-password"); 

  useEffect(() => {
    // Inapakia data za user (Zustand) kilingoni mwa app mara moja
    initAuthStore();
  }, []);

  return (
    <html lang="en">
      <head>
        <title>Kilicare+ | Explore Tanzania</title>
        {/* Meta tags za Pro Web: Kuzuia zoom kero na kurekebisha viewport mobile */}
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" 
        />
        {/* Import Montserrat: Font ya premium */}
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      
      {/* Nimeongeza 'min-height: 100dvh' kwenye body kuhakikisha background haikatiki */}
      <body className="antialiased scrollbar-hide" style={{ minHeight: '100dvh', position: 'relative' }}>
        <ReactQueryProvider>
          
          {/* MAIN WRAPPER:
              Hii inahakikisha layout inatii sheria za Liquid Design tulizoweka.
          */}
          <main id="main-content" className="app-main-wrapper">
            {children}
          </main>
          
          {/* Notification System - Premium Toaster Setup */}
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: 'pro-toast',
              duration: 4000,
              style: {
                borderRadius: '18px',
                background: '#1A3C34', /* Kilicare Deep Green */
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
                padding: '16px 24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                maxWidth: '400px',
                fontFamily: 'Montserrat, sans-serif',
                zIndex: 999999, // Inakaa juu ya kila kitu mpaka loader
              },
              success: {
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#fb7185', 
                  secondary: '#fff',
                },
                style: {
                  border: '1px solid rgba(251, 113, 133, 0.2)',
                }
              },
            }}
          />
        </ReactQueryProvider>
      </body>
    </html>
  );
}