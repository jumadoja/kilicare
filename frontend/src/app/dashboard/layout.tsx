"use client";

import Sidebar from "@/components/Sidebar";
import { useState, useEffect } from "react";
import { Montserrat } from 'next/font/google';
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'] 
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const pathname = usePathname();

  // 1. Kutambua kurasa maalum (AI na Messaging)
  const isSpecialPage = pathname?.includes("/ai") || 
                        pathname?.includes("/messages") || 
                        pathname?.includes("/chat");

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      // Kama ni mobile, default iwe collapsed (sidebar imefichwa)
      if (mobile) setIsCollapsed(true);
      else setIsCollapsed(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  if (!mounted) return null;

  return (
    <div className={`${montserrat.className} layout-wrapper`}>
      
      {/* 1. MOBILE OVERLAY (Kwa kurasa za kawaida pekee) */}
      {isMobile && !isCollapsed && !isSpecialPage && (
        <div 
          className="mobile-overlay animate-fade-in" 
          onClick={toggleSidebar} 
        />
      )}

      {/* 2. SIDEBAR - Inatokea tu kama siyo Messaging/AI Page */}
      {!isSpecialPage && (
        <aside className={`sidebar-container ${isCollapsed ? "collapsed" : "expanded"}`}>
          <Sidebar isCollapsed={isCollapsed} />
          
          {/* Toggle Button for Desktop & Mobile Dashboard */}
          <button 
            onClick={toggleSidebar}
            className="toggle-btn"
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? <Menu size={18} strokeWidth={2.5} /> : <X size={18} strokeWidth={2.5} />}
          </button>
        </aside>
      )}

      {/* 3. MAIN CONTENT AREA */}
      <main className={`main-content ${isSpecialPage ? 'full-bleed' : ''}`}>
        <div className={`content-viewport ${isSpecialPage ? 'special-mode' : 'dashboard-mode'}`}>
          {children}
        </div>
      </main>

      <style jsx>{`
        .layout-wrapper {
          display: flex;
          height: 100vh;
          width: 100vw;
          background: ${isSpecialPage ? '#ffffff' : '#f4f7fe'};
          overflow: hidden;
          position: relative;
        }

        /* SIDEBAR STYLING */
        .sidebar-container {
          height: 100%;
          flex-shrink: 0;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 100;
          background: #1A3C34; 
          box-shadow: 4px 0 24px rgba(0,0,0,0.05);
        }

        .expanded { width: 280px; }
        .collapsed { width: 100px; }

        .toggle-btn {
          position: absolute;
          top: 30px;
          right: -15px;
          z-index: 110;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: #16a34a;
          color: white;
          border: 4px solid #f4f7fe;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 4px 10px rgba(22, 163, 74, 0.3);
        }

        .toggle-btn:hover {
          transform: scale(1.1);
          background: #15803d;
        }

        /* MAIN CONTENT STYLING */
        .main-content {
          flex: 1;
          height: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.4s ease;
          position: relative;
        }

        .content-viewport {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          transition: all 0.5s ease;
        }

        /* Dashboard Mode: Ina nafasi (padding) na muonekano wa Card */
        .dashboard-mode {
          padding: 24px;
          background: transparent;
        }

        .dashboard-mode :global(> div) {
          background: #ffffff;
          border-radius: 32px;
          height: 100%;
          width: 100%;
          box-shadow: 0 10px 40px rgba(0,0,0,0.03);
          border: 1px solid rgba(255,255,255,0.8);
          overflow: hidden;
        }

        /* Special Mode: Edge-to-Edge (AI & Chat) */
        .special-mode {
          padding: 0;
          background: #fff;
        }

        /* RESPONSIVE DESIGN */
        @media (max-width: 1024px) {
          .sidebar-container {
            position: fixed;
            left: 0;
            width: 280px !important;
            transform: ${isCollapsed ? 'translateX(-110%)' : 'translateX(0)'};
          }

          .dashboard-mode {
            padding: 16px;
            padding-top: 80px; /* Space for mobile menu button */
          }

          .toggle-btn {
            display: ${isSpecialPage ? 'none' : 'flex'};
            position: fixed;
            left: ${isCollapsed ? '16px' : '230px'};
            top: 16px;
            border-color: #fff;
          }

          .special-mode {
            padding-top: 0; /* Chat ianzie juu kabisa kwenye mobile */
          }
        }

        .mobile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
          z-index: 90;
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <style jsx global>{`
        /* Reset mambo ya kijinga yanayoweza kuharibu layout */
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #f4f7fe;
        }

        /* Scrollbar Safi kwa ajili ya kurasa zote */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}