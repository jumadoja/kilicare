"use client";

import { useMoments } from "@/features/dashboard/hooks/useFetchMoments";
import { useFetchMe } from "@/features/dashboard/hooks/useFetchMe";
import { useState } from "react";

export default function MomentsPage() {
  const { data: momentsData, isLoading } = useMoments();
  const { data: userData } = useFetchMe();
  const [activeTab, setActiveTab] = useState("Trending");

  // Hapa tunahakikisha tunapata Array hata kama API imeweka Pagination (results)
  // Kama momentsData ni array, itachukua hiyo. Kama ina .results, itachukua hiyo.
  const moments = Array.isArray(momentsData) 
    ? momentsData 
    : (momentsData as any)?.results || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px", paddingBottom: "60px", width: "100%" }}>
      
      {/* 1. Header & Tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#1e293b", margin: 0 }}>Kilicare Moments 🎬</h1>
          <p style={{ color: "#64748b", fontWeight: "500" }}>
            See what {userData?.username || "others"} are sharing right now.
          </p>
        </div>
        
        <div style={{ display: "flex", backgroundColor: "#f1f5f9", padding: "6px", borderRadius: "20px", gap: "5px" }}>
          {["Trending", "Latest", "Following"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "10px 20px", borderRadius: "15px", border: "none",
                fontSize: "13px", fontWeight: "700", cursor: "pointer",
                backgroundColor: activeTab === tab ? "white" : "transparent",
                color: activeTab === tab ? "#16a34a" : "#64748b",
                boxShadow: activeTab === tab ? "0 4px 10px rgba(0,0,0,0.05)" : "none",
                transition: "all 0.3s ease"
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Moments Grid (Masonry Feel) */}
      <div style={{ 
        columns: "3 300px", 
        columnGap: "25px",
        width: "100%"
      }}>
        {isLoading ? (
          // Skeleton Loader
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ 
              height: i % 2 === 0 ? "300px" : "450px", 
              backgroundColor: "#f1f5f9", borderRadius: "30px", marginBottom: "25px",
              opacity: 0.6,
              animation: "pulse 1.5s infinite ease-in-out"
            }} />
          ))
        ) : moments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b", gridColumn: "1/-1" }}>
            <p>Bado hakuna Moments hapa...</p>
          </div>
        ) : (
          moments.map((moment: any) => (
            <div 
              key={moment.id} 
              style={{ 
                breakInside: "avoid", marginBottom: "25px", position: "relative",
                borderRadius: "30px", overflow: "hidden", backgroundColor: "white",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)", cursor: "pointer",
                transition: "transform 0.3s ease",
                border: "1px solid #f1f5f9"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {/* Image/Video Container */}
              <div style={{ position: "relative" }}>
                <img 
                  src={moment.image || moment.file || "/placeholder-moment.jpg"} 
                  alt={moment.caption || "Kilicare Moment"}
                  style={{ width: "100%", display: "block", objectFit: "cover", minHeight: "200px" }}
                />
                
                {/* User Info Overlay (Top) */}
                <div style={{ 
                  position: "absolute", top: "15px", left: "15px", display: "flex", 
                  alignItems: "center", gap: "8px", zIndex: 2 
                }}>
                  <img 
                    src={moment.user_avatar || `https://ui-avatars.com/api/?name=${moment.username || 'User'}`} 
                    style={{ width: "32px", height: "32px", borderRadius: "10px", border: "2px solid white" }}
                    alt="avatar"
                  />
                  <span style={{ color: "white", fontSize: "12px", fontWeight: "700", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                    @{moment.username || "anonymous"}
                  </span>
                </div>

                {/* Bottom Interaction Overlay */}
                <div style={{ 
                  position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px",
                  background: "linear-gradient(to top, rgba(0,0,0,0.9), transparent)",
                  color: "white", zIndex: 2
                }}>
                  <p style={{ fontSize: "13px", fontWeight: "500", margin: "0 0 10px 0", lineHeight: "1.4" }}>
                    {moment.caption}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "15px" }}>
                      <button style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                        ❤️ <span style={{ fontSize: "12px", fontWeight: "700" }}>{moment.likes_count || 0}</span>
                      </button>
                      <button style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                        💬 <span style={{ fontSize: "12px", fontWeight: "700" }}>{moment.comments_count || 0}</span>
                      </button>
                    </div>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.8)", fontWeight: "700" }}>
                      📍 {moment.location_name || "Tanzania"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Floating Action Button (Post New Moment) */}
      <button 
        style={{
          position: "fixed", bottom: "40px", right: "40px", width: "65px", height: "65px",
          borderRadius: "22px", backgroundColor: "#16a34a", color: "white", fontSize: "28px",
          border: "none", cursor: "pointer", boxShadow: "0 15px 35px rgba(22,163,74,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
          transition: "all 0.3s ease"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "rotate(90deg) scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "rotate(0deg) scale(1)")}
      >
        +
      </button>
    </div>
  );
}