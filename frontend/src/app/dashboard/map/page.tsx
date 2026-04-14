"use client";
import { useState, useMemo } from "react";
import { useTips } from "@/features/dashboard/hooks/useFetchTips"; // Hook yako ya ukweli
import { useFetchMe } from "@/features/dashboard/hooks/useFetchMe";

export default function LocalTipsMap() {
  const { data: userData } = useFetchMe();
  const { data: realTips, isLoading } = useTips();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Safety", "Food", "Hidden Gems", "Transport"];
  const userLocation = userData?.profile?.location || "Arusha";

  // Logic ya Filter data halisi kutoka Backend
  const filteredTips = useMemo(() => {
    if (!realTips) return [];
    if (selectedCategory === "All") return realTips;
    return realTips.filter((tip: any) => 
      tip.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [selectedCategory, realTips]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "25px", height: "100%", paddingBottom: "30px" }}>
      
      {/* 1. Header Area - Dynamic Greeting */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#1e293b", margin: 0, letterSpacing: "-1px" }}>
            Local Tips Map 🗺️
          </h1>
          <p style={{ color: "#64748b", fontSize: "15px", marginTop: "5px", fontWeight: "500" }}>
            Real-time advice for <span style={{ color: "#16a34a", fontWeight: "700" }}>{userLocation}</span> from the Kilicare community.
          </p>
        </div>
        <div style={{ 
          backgroundColor: "#f1f5f9", padding: "10px 20px", borderRadius: "15px", 
          fontSize: "12px", fontWeight: "800", color: "#475569", border: "1px solid #e2e8f0" 
        }}>
          LIVE UPDATES: {realTips?.length || 0} TIPS
        </div>
      </div>

      {/* 2. Main Content Split View */}
      <div style={{ display: "flex", gap: "30px", flex: 1, minHeight: "600px", flexDirection: window.innerWidth < 1024 ? "column" : "row" }}>
        
        {/* LEFT SIDE: The Real Map (Babukubwa UI) */}
        <div style={{ 
          flex: 2, 
          backgroundColor: "#f8fafc", 
          borderRadius: "45px", 
          position: "relative",
          overflow: "hidden", 
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 50px rgba(0,0,0,0.05)"
        }}>
          {/* Map Overlay Image - Dynamic based on user location */}
          <div style={{ 
            width: "100%", height: "100%", 
            backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/36.68,-3.37,13/1200x800?access_token=YOUR_MAPBOX_TOKEN')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "grayscale(20%) brightness(95%)"
          }}>
            {/* Real Interactive Markers from Backend */}
            {!isLoading && filteredTips.map((tip: any) => (
              <div 
                key={tip.id}
                style={{
                  position: "absolute",
                  top: `${Math.random() * 70 + 10}%`, // In real app, use tip.latitude/longitude
                  left: `${Math.random() * 70 + 10}%`,
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "transform 0.3s"
                }}
              >
                <div style={{ 
                  fontSize: "28px", 
                  filter: tip.type === "Danger" ? "hue-rotate(300deg)" : "none" 
                }}>📍</div>
                <div style={{ 
                  backgroundColor: "white", padding: "4px 10px", borderRadius: "10px", 
                  fontSize: "10px", fontWeight: "900", boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
                  border: `2px solid ${tip.type === "Danger" ? "#ef4444" : "#16a34a"}`
                }}>
                  {tip.title.substring(0, 15)}...
                </div>
              </div>
            ))}
          </div>

          {/* Map Legend Overlay */}
          <div style={{ 
            position: "absolute", bottom: "30px", left: "30px", 
            backgroundColor: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(10px)",
            padding: "20px", borderRadius: "25px", boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
            border: "1px solid rgba(255,255,255,0.5)"
          }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "900", color: "#1e293b" }}>MAP LEGEND</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11px", fontWeight: "700" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ef4444" }}></span> Danger/Alert Area
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#10b981" }}></span> Safe & Recommended
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Interactive Tips Feed */}
        <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Category Filter Pills */}
          <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "10px" }} className="scrollbar-hide">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "12px 22px", borderRadius: "18px", fontSize: "12px", fontWeight: "800",
                  backgroundColor: selectedCategory === cat ? "#1A3C34" : "#ffffff",
                  color: selectedCategory === cat ? "white" : "#64748b",
                  cursor: "pointer", transition: "all 0.3s ease",
                  border: selectedCategory === cat ? "none" : "1px solid #e2e8f0",
                  boxShadow: selectedCategory === cat ? "0 10px 20px rgba(26,60,52,0.2)" : "none",
                  whiteSpace: "nowrap"
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Real Tips List with Auto-Scroll */}
          <div style={{ 
            display: "flex", flexDirection: "column", gap: "15px", 
            overflowY: "auto", maxHeight: "650px", paddingRight: "10px" 
          }} className="scrollbar-custom">
            
            {isLoading ? (
              // Skeleton Loading
              [1, 2, 3].map(i => (
                <div key={i} style={{ height: "120px", backgroundColor: "#f1f5f9", borderRadius: "30px", opacity: 0.6 }} />
              ))
            ) : filteredTips.length > 0 ? (
              filteredTips.map((tip: any) => (
                <div key={tip.id} style={{ 
                  padding: "25px", borderRadius: "35px", backgroundColor: "white", 
                  border: "1px solid #f1f5f9", boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
                  transition: "all 0.3s ease", cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateX(10px)";
                  e.currentTarget.style.borderColor = "#16a34a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateX(0)";
                  e.currentTarget.style.borderColor = "#f1f5f9";
                }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ 
                      fontSize: "10px", fontWeight: "900", padding: "6px 12px", borderRadius: "12px",
                      backgroundColor: tip.type === "Danger" ? "#fee2e2" : "#dcfce7",
                      color: tip.type === "Danger" ? "#ef4444" : "#16a34a"
                    }}>
                      {tip.category?.toUpperCase()}
                    </span>
                    <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>📍 {tip.location}</span>
                  </div>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#1e293b", fontWeight: "900" }}>{tip.title}</h4>
                  <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: "1.6", fontWeight: "500" }}>{tip.desc}</p>
                  
                  {/* User Attribution */}
                  <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "24px", height: "24px", backgroundColor: "#1A3C34", borderRadius: "50%", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>👤</div>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Posted by a <b style={{ color: "#475569" }}>Local Guide</b></span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "50px" }}>
                <span style={{ fontSize: "40px" }}>🍃</span>
                <p style={{ color: "#64748b", marginTop: "10px" }}>No tips found for this category.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. Floating Action Button - To add real Tips */}
      <button style={{
        position: "fixed", bottom: "40px", right: "40px", backgroundColor: "#16a34a",
        color: "white", width: "60px", height: "60px", borderRadius: "20px", border: "none",
        fontSize: "24px", fontWeight: "900", cursor: "pointer", boxShadow: "0 15px 30px rgba(22,163,74,0.3)",
        zIndex: 100
      }}>
        +
      </button>
    </div>
  );
}