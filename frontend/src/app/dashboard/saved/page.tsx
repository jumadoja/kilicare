"use client";
import { useState } from "react";

export default function SavedTripsPage() {
  // Dummy data ya Itineraries zilizohifadhiwa
  const [savedTrips, setSavedTrips] = useState([
    {
      id: 1,
      title: "3-Day Arusha Adventure",
      days: 3,
      budget: "$450",
      image: "🏔️", // Hapa tutaweka picha halisi baadaye
      spots: ["Mount Meru", "Cultural Heritage", "Meserani Snake Park"],
      date: "Saved on March 12, 2026"
    },
    {
      id: 2,
      title: "Serengeti Great Migration",
      days: 5,
      budget: "$1,200",
      image: "🦁",
      spots: ["Central Serengeti", "Mara River", "Ngorongoro Crater"],
      date: "Saved on Feb 28, 2026"
    }
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      
      {/* 1. Header Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "900", color: "#1e293b", margin: 0 }}>Saved Trips 💼</h1>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "5px" }}>Your personal AI-generated itineraries.</p>
        </div>
        <button style={{ 
          padding: "12px 20px", backgroundColor: "#16a34a", color: "white", 
          border: "none", borderRadius: "15px", fontWeight: "700", cursor: "pointer",
          boxShadow: "0 10px 20px rgba(22,163,74,0.2)"
        }}>
          + Create New Trip
        </button>
      </div>

      {/* 2. Itinerary Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", 
        gap: "25px" 
      }}>
        {savedTrips.map((trip) => (
          <div 
            key={trip.id}
            style={{
              backgroundColor: "white",
              borderRadius: "35px",
              padding: "25px",
              border: "1px solid #f1f5f9",
              boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
              transition: "all 0.3s ease",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: "15px"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#16a34a")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#f1f5f9")}
          >
            {/* Trip Icon & Info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ 
                width: "60px", height: "60px", backgroundColor: "#f1f5f9", 
                borderRadius: "20px", display: "flex", alignItems: "center", 
                justifyContent: "center", fontSize: "30px" 
              }}>
                {trip.image}
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ display: "block", fontSize: "18px", fontWeight: "900", color: "#1A3C34" }}>{trip.budget}</span>
                <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>Est. Budget</span>
              </div>
            </div>

            {/* Content */}
            <div>
              <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b", margin: "0 0 5px 0" }}>{trip.title}</h3>
              <p style={{ fontSize: "12px", color: "#16a34a", fontWeight: "700", textTransform: "uppercase" }}>{trip.days} Days Itinerary</p>
            </div>

            {/* Spots Preview */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {trip.spots.map((spot, i) => (
                <span key={i} style={{ 
                  padding: "6px 12px", backgroundColor: "#f8fafc", 
                  borderRadius: "10px", fontSize: "11px", color: "#64748b", fontWeight: "600",
                  border: "1px solid #f1f5f9"
                }}>
                  📍 {spot}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div style={{ 
              marginTop: "10px", paddingTop: "15px", borderTop: "1px solid #f1f5f9",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <span style={{ fontSize: "11px", color: "#cbd5e1", fontWeight: "600" }}>{trip.date}</span>
              <button style={{ 
                background: "transparent", border: "none", color: "#16a34a", 
                fontWeight: "800", fontSize: "13px", cursor: "pointer" 
              }}>
                View Full Plan →
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}