"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; 
import { useFetchExperiences } from "@/features/dashboard/hooks/useFetchExperiences";
import { useFetchMe } from "@/features/dashboard/hooks/useFetchMe";

export default function DiscoverPage() {
  const router = useRouter(); 
  const { data: userData } = useFetchMe();
  const { data: experiences, isLoading } = useFetchExperiences();
  
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [greeting, setGreeting] = useState("Jambo");
  const [bgIndex, setBgIndex] = useState(0);
  const [activeMediaIndex, setActiveMediaIndex] = useState<{ [key: string]: number }>({});
  const [showEmptyMsg, setShowEmptyMsg] = useState<{ [key: string]: boolean }>({});
  const [isMuted, setIsMuted] = useState(true);

  // Modal States
  const [selectedExp, setSelectedExp] = useState<any>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const placeholders = [
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957",
    "https://images.unsplash.com/photo-1516483642775-82098d4e0220",
    "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    "https://images.unsplash.com/photo-1533105079780-92b9be482077"
  ];

  const playMusic = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/audio/nature-bg.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.4;
    }
    audioRef.current.play().catch(() => console.log("Music waiting for interaction"));
  };

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenKilicareWelcome");
    if (!hasSeenWelcome) {
      setShowWelcome(true);
      // playMusic(); // Un-comment kama unataka mziki uanze automatic
    }
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const openWelcome = () => {
    setShowWelcome(true);
    playMusic();
  };

  const closeWelcome = () => {
    localStorage.setItem("hasSeenKilicareWelcome", "true");
    setShowWelcome(false);
    audioRef.current?.pause(); 
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Habari za asubuhi");
    else if (hour < 16) setGreeting("Habari za mchana");
    else setGreeting("Habari za jioni");
  }, []);

  const userLocation = useMemo(() => {
    return userData?.profile?.location || userData?.location || "Tanzania";
  }, [userData]);

  const filters = ["All", "Safari", "Local Food", "Culture", "Night Life"];

  const filteredExperiences = useMemo(() => {
    const momentsList = Array.isArray(experiences) ? experiences : (experiences as any)?.results || [];
    let result = [...momentsList];
    if (activeFilter !== "All") {
      result = result.filter((item: any) => item.category?.toLowerCase() === activeFilter.toLowerCase());
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item: any) => 
        item.title?.toLowerCase().includes(query) || item.location?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [activeFilter, experiences, searchQuery]);

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: "35px", 
      padding: "20px", 
      fontFamily: "'Montserrat', sans-serif", 
      position: "relative",
      height: "85vh", // Inakaa ndani ya dashboard layout bila kufanya scroll ya ajabu
      overflowY: "auto",
      scrollbarWidth: "none",
      msOverflowStyle: "none"
    }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
        <div>
          <p style={{ color: "#16a34a", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px" }}>
            📍 Exploring {userLocation} • Live Vibes 
          </p>
          <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#1e293b", margin: 0 }}>
            {greeting}, {userData?.username || "Traveler"}!
          </h1>
        </div>
        
        <div style={{ backgroundColor: "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)", padding: "12px 20px", borderRadius: "30px", display: "flex", gap: "10px", border: "1px solid rgba(241,245,249,0.5)", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
            🔍 <input 
                placeholder="Search spots..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: "none", outline: "none", fontSize: "14px", width: "180px", background: "transparent" }} 
              />
        </div>
      </div>

      {/* FILTER CHIPS */}
      <div className="no-scrollbar" style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "10px", flexShrink: 0 }}>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              padding: "10px 24px", borderRadius: "50px", border: "none",
              backgroundColor: activeFilter === f ? "#1A3C34" : "rgba(255,255,255,0.7)",
              backdropFilter: "blur(5px)",
              color: activeFilter === f ? "white" : "#64748b",
              fontWeight: "700", cursor: "pointer", transition: "all 0.3s ease",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              whiteSpace: "nowrap"
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* EXPERIENCES GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "35px", paddingBottom: "100px" }}>
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card" style={{ height: "550px", borderRadius: "45px", backgroundColor: "#e2e8f0", animation: "pulse 1.5s infinite" }} />
          ))
        ) : filteredExperiences.length > 0 ? (
          filteredExperiences.map((item: any) => {
            const experienceMedia = item.media_files || []; 
            const currentIdx = activeMediaIndex[item.id] ?? -1; 
            const isShowingEmpty = showEmptyMsg[item.id];
            const isVideo = currentIdx !== -1 && experienceMedia[currentIdx]?.media_type === 'video';

            return (
              <div 
                key={item.id} 
                onClick={() => setSelectedExp(item)}
                className="vibe-card-hover"
                style={{ position: "relative", height: "550px", borderRadius: "45px", overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,0.1)", backgroundColor: "#000", cursor: "pointer" }}
              >
                {/* LIVE BADGE */}
                <div style={{ position: "absolute", top: "25px", left: "25px", zIndex: 30, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", padding: "6px 14px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                   <span className="live-pulse" style={{ width: "8px", height: "8px", backgroundColor: "#ff4b4b", borderRadius: "50%" }}></span>
                   <span style={{ color: "white", fontSize: "11px", fontWeight: "900", letterSpacing: "1px" }}>LIVE VIBE</span>
                </div>

                {/* PROGRESS BARS */}
                {currentIdx !== -1 && experienceMedia.length > 1 && (
                  <div style={{ position: "absolute", top: "15px", left: "20px", right: "20px", zIndex: 40, display: "flex", gap: "4px" }}>
                    {experienceMedia.map((_: any, i: number) => (
                      <div key={i} style={{ flex: 1, height: "3px", backgroundColor: i <= currentIdx ? "white" : "rgba(255,255,255,0.3)", borderRadius: "2px", transition: "0.3s" }} />
                    ))}
                  </div>
                )}

                {/* MEDIA DISPLAY */}
                <div style={{ position: "absolute", inset: 0, transition: "0.8s ease-in-out", zIndex: 1 }}>
                  {currentIdx === -1 ? (
                    <img src={placeholders[bgIndex]} alt="Vibe" style={{ width: "100%", height: "100%", objectFit: "cover", filter: isShowingEmpty ? "blur(25px) brightness(0.3)" : "brightness(0.65)" }} />
                  ) : (
                    isVideo ? (
                      <video key={experienceMedia[currentIdx].file} src={experienceMedia[currentIdx].file} autoPlay muted={isMuted} loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <img src={experienceMedia[currentIdx].file} alt="Media" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )
                  )}
                </div>

                {isVideo && (
                  <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} style={{ position: "absolute", top: "80px", right: "25px", zIndex: 25, backgroundColor: "rgba(0,0,0,0.5)", border: "none", color: "white", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", backdropFilter: "blur(10px)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    {isMuted ? "🔇" : "🔊"}
                  </button>
                )}

                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.98) 0%, transparent 65%)", zIndex: 2, pointerEvents: "none" }} />

                {/* CENTER EXPLORE BUTTON */}
                <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", paddingBottom: "60px" }}>
                  {isShowingEmpty ? (
                    <div style={{ width: "80%", padding: "35px 20px", borderRadius: "35px", backgroundColor: "rgba(255, 255, 255, 0.12)", backdropFilter: "blur(30px)", border: "1px solid rgba(255, 255, 255, 0.2)", textAlign: "center" }}>
                      <p style={{ color: "white", fontSize: "17px", fontWeight: "800", marginBottom: "25px" }}>Bado hakuna moments zilizoshare-iwa.</p>
                      <button onClick={(e) => { e.stopPropagation(); setShowEmptyMsg({ ...showEmptyMsg, [item.id]: false }); }} style={{ backgroundColor: "white", color: "#1A3C34", border: "none", padding: "12px 30px", borderRadius: "25px", fontWeight: "900", cursor: "pointer" }}>BACK</button>
                    </div>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); experienceMedia.length > 0 ? setActiveMediaIndex({ ...activeMediaIndex, [item.id]: (currentIdx + 1) % experienceMedia.length }) : setShowEmptyMsg({ ...showEmptyMsg, [item.id]: true }); }} className="center-play-btn" style={{ width: "90px", height: "90px", borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.6)", backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px)", color: "white", cursor: "pointer", transition: "all 0.3s ease" }}>
                      <span style={{ fontSize: "30px" }}>{currentIdx === -1 ? "🌍" : (isVideo ? "▶️" : "📸")}</span>
                    </button>
                  )}
                </div>

                {/* FOOTER INFO */}
                <div style={{ position: "absolute", bottom: "0", left: "0", right: "0", zIndex: 20, padding: "30px 25px", background: "rgba(0,0,0,0.3)", backdropFilter: "blur(10px)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ color: "#22c55e", fontSize: "11px", fontWeight: "900", textTransform: "uppercase" }}>{item.category}</div>
                  <h3 style={{ color: "white", fontSize: "26px", fontWeight: "900", margin: "5px 0" }}>{item.title}</h3>
                  <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); window.open(`http://googleusercontent.com/maps.google.com/?q=${encodeURIComponent(item.location)}`, '_blank'); }} 
                      className="btn-direction"
                      style={{ flex: 1, backgroundColor: "white", color: "#1A3C34", border: "none", padding: "14px", borderRadius: "18px", fontWeight: "800", cursor: "pointer", transition: "all 0.3s ease" }}
                    >📍 Direction</button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/messages?userId=${item.user?.id}`); }} 
                      className="btn-chat"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white", border: "none", padding: "14px", borderRadius: "18px", fontWeight: "800", backdropFilter: "blur(10px)", cursor: "pointer", transition: "all 0.3s ease" }}
                    >💬 Chat</button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "80px 20px" }}><h3>Bado hakuna vibes...</h3></div>
        )}
      </div>

      {/* FLOAT ACTION BUTTON */}
      <button 
        onClick={openWelcome}
        style={{
          position: "fixed", bottom: "30px", right: "30px", zIndex: 100,
          backgroundColor: "#1A3C34", color: "white", width: "55px", height: "55px",
          borderRadius: "50%", border: "none", cursor: "pointer",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)", display: "flex",
          justifyContent: "center", alignItems: "center", fontSize: "22px",
          transition: "all 0.3s ease"
        }}
        className="floating-info-btn"
      >
        ❓
      </button>

 {/* WELCOME MODAL */}
      {showWelcome && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(15px)", zIndex: 3000, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
          <div style={{ backgroundColor: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", width: "100%", maxWidth: "550px", borderRadius: "40px", padding: "40px", position: "relative", boxShadow: "0 25px 60px rgba(0,0,0,0.4)", animation: "popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)", border: "1px solid rgba(255,255,255,0.3)" }}>
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <span style={{ fontSize: "50px" }}>🦁</span>
              <h2 style={{ fontSize: "28px", fontWeight: "900", color: "#1A3C34", margin: "10px 0 5px 0" }}>Karibu Tanzania!</h2>
              <p style={{ color: "#64748b", fontSize: "14px", fontWeight: "600" }}>Jinsi ya kutumia app:</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "25px", marginBottom: "35px" }}>
              {[
                { icon: "🌍", title: "Just Tap \"Explore\" (🌍):", desc: "In the middle of each card is a large button. Tap it to start seeing photos (📸) and videos (▶️) of that location. It is like an Instagram story, but smarter!" },
                { icon: "🔊", title: "Hear the Vibe (🔊):", desc: "If a video is playing, you will see a speaker button in the top right. Tap it to hear the natural sound of the area—whether it's lions, club music, or market sounds." },
                { icon: "📍", title: "Get Directions (📍):", desc: "Love a spot? Tap \"Get Direction\". It will open Google Maps directly and lead you right to the doorstep. You won't get lost!" },
                { icon: "💬", title: "Chat with the Host (💬):", desc: "Have a question? Tap \"Chat\" to talk to the person who posted that \"Vibe\". You can ask extra questions or even request a discount." },
                { icon: "🔍", title: "Filter What You Want:", desc: "Use the top buttons (Safari, Local Food, Culture) to find exactly what you're in the mood for." }
              ].map((item, index) => (
                <div key={index} style={{ display: "flex", gap: "15px" }}>
                  <span style={{ fontSize: "24px" }}>{item.icon}</span>
                  <div>
                    <strong style={{ display : "block", color: "#1A3C34", fontWeight: "800" }}>{item.title}</strong>
                    <span style={{ fontSize: "14px", color: "#1e293b" }}>{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={closeWelcome} style={{ width: "100%", backgroundColor: "#1A3C34", color: "white", border: "none", padding: "18px", borderRadius: "20px", fontWeight: "900", cursor: "pointer", boxShadow: "0 10px 20px rgba(26,60,52,0.3)" }}>
              ASANTE, TWENDE KAZI! 🚀
            </button>
          </div>
        </div>
      )}


      {/* BOTTOM SHEET */}
      {selectedExp && (
        <div onClick={() => setSelectedExp(null)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", zIndex: 1000, display: "flex", alignItems: "flex-end" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderTopLeftRadius: "40px", borderTopRightRadius: "40px", padding: "30px", animation: "slideUp 0.4s ease-out", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ width: "40px", height: "4px", backgroundColor: "#e2e8f0", borderRadius: "2px", margin: "0 auto 20px auto" }} />
            <h2 style={{ fontSize: "28px", fontWeight: "900", margin: "10px 0 5px 0" }}>{selectedExp.title}</h2>
            <p style={{ color: "#64748b", fontWeight: "600" }}>📍 {selectedExp.location}</p>
            <div style={{ margin: "25px 0", padding: "20px", backgroundColor: "rgba(0,0,0,0.03)", borderRadius: "25px", border: "1px solid rgba(0,0,0,0.05)" }}>
                <p style={{ margin: 0, color: "#475569", lineHeight: "1.6" }}>{selectedExp.description || "Hakuna maelezo ya ziada kwa sasa."}</p>
            </div>
            <button onClick={() => router.push(`/dashboard/booking/${selectedExp.id}`)} style={{ width: "100%", backgroundColor: "#1A3C34", color: "white", border: "none", borderRadius: "20px", padding: "18px", fontWeight: "800", cursor: "pointer" }}>Book Now</button>
          </div>
        </div>
      )}

      <style jsx>{`
        div::-webkit-scrollbar { display: none; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes popIn { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
        @keyframes livePulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
        .live-pulse { animation: livePulse 2s infinite ease-in-out; }
        .btn-direction:hover { background-color: #f1f5f9 !important; transform: translateY(-2px); }
        .btn-chat:hover { background-color: rgba(255,255,255,0.3) !important; transform: translateY(-2px); }
        .center-play-btn:hover { transform: scale(1.1); background-color: rgba(255,255,255,0.25) !important; }
        .floating-info-btn:hover { transform: scale(1.1); background-color: #14302a !important; }
      `}</style>
    </div>
  );
}