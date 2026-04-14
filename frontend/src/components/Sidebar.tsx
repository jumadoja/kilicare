"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useFetchMe } from "@/features/dashboard/hooks/useFetchMe";

interface SidebarProps {
  isCollapsed?: boolean;
}

/* --- 1. MINI SLIDESHOW (INTERNAL) --- */
function SidebarSlideshow({ images, interval = 5000 }: { images: string[], interval?: number }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images, interval]);

  return (
    <div className="sidebar-slideshow-container h-full w-full relative">
      {images.map((img, index) => (
        <div 
          key={index} 
          className={`sidebar-slide-img absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${img})` }} 
        />
      ))}
      <div className="sidebar-slide-overlay" />
    </div>
  );
}

/* --- 2. MAIN SIDEBAR --- */
export default function Sidebar({ isCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data: userData } = useFetchMe();

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    { name: "Dashboard", icon: "📊", path: "/dashboard/tourist" },
    { name: "Today Near Me", icon: "📍", path: "/dashboard/discover" },
    { name: "Ask Kilicare", icon: "🤖", path: "/dashboard/ai-chat" },
    { name: "Local Tips Map", icon: "🗺️", path: "/dashboard/map" },
    { name: "Saved Trips", icon: "💼", path: "/dashboard/saved" },
    { name: "KilicareMoments", icon: "🎬", path: "/dashboard/moments" },
    { name: "Kilicare Passport™", icon: "🛂", path: "/dashboard/passport" },
    { name: "Messaging", icon: "💬", path: "/dashboard/messages" },
    { name: "Profile", icon: "👤", path: "/dashboard/profile" },
  ];

  const adsImages = [
    "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=500",
    "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=500",
    "https://images.unsplash.com/photo-1516422213484-21437362dee7?q=80&w=500",
  ];

  if (!mounted) return null;

  return (
    <aside 
      className={`sidebar-root flex flex-col transition-all duration-400 ease-in-out ${
        isCollapsed ? "w-[80px] px-3" : "w-[280px] px-5"
      }`}
      style={{ paddingBlock: "25px" }}
    >
      {/* 1. Brand Logo Area */}
      <div className={`mb-9 flex items-center ${isCollapsed ? "justify-center" : "justify-start gap-3"}`}>
        <div className="w-10 h-10 bg-[#16a34a] rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 text-lg">
          🌿
        </div>
        {!isCollapsed && (
          <span className="text-[22px] font-black tracking-tighter text-white">
            Kilicare<span className="text-[#4ade80]">+</span>
          </span>
        )}
      </div>

      {/* 2. User Card (Silently Dynamic) */}
      {!isCollapsed && userData && (
        <div className="user-card animate-fade-up">
          <img 
            src={userData.profile?.avatar || "/default-avatar.png"} 
            alt="Profile" 
            className="w-[42px] h-[42px] rounded-xl object-cover border-2 border-[#16a34a]" 
          />
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate m-0">{userData.username}</p>
            <p className="text-[10px] text-[#4ade80] font-extrabold uppercase tracking-wider m-0 opacity-90">
              {userData.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
      )}

      {/* 3. Navigation Hub */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.name} 
              href={item.path}
              className={`nav-link group ${isActive ? "active" : ""} ${isCollapsed ? "justify-center px-0" : "px-4"}`}
            >
              <span className={`text-xl transition-transform duration-200 group-hover:scale-125`}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className={`text-sm ${isActive ? "font-bold" : "font-medium"}`}>
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 4. Mini Promo Slideshow */}
      {!isCollapsed && (
        <div className="h-40 w-full mt-5 relative rounded-2xl overflow-hidden group">
          <SidebarSlideshow images={adsImages} />
          <div className="absolute bottom-3 left-3 z-10">
            <span className="text-[9px] font-black text-white bg-[#16a34a] px-2 py-0.5 rounded uppercase">
              Special
            </span>
            <p className="text-sm font-bold text-white mt-1 shadow-sm">Visit Serengeti</p>
          </div>
        </div>
      )}

      {/* 5. Logout Section */}
      <div className="mt-5 border-t border-white/5 pt-4">
        <button 
          className={`logout-btn group ${isCollapsed ? "justify-center" : "justify-start"}`}
          onClick={() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            router.push("/login");
          }}
        >
          <span className="text-lg transition-transform group-hover:rotate-12">🚪</span>
          {!isCollapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
}