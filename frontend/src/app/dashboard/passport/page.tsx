"use client";
import { useFetchPassport } from "@/features/dashboard/hooks/useFetchPassport";
import { useFetchMe } from "@/features/dashboard/hooks/useFetchMe";

export default function PassportPage() {
  const { data: passport, isLoading: loadingPassport } = useFetchPassport();
  const { data: user } = useFetchMe();

  if (loadingPassport) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
        <p>Verifying your travel credentials... 🛂</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "40px", paddingBottom: "60px" }}>
      
      {/* 1. Header Section */}
      <div>
        <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#1e293b", margin: 0 }}>Kilicare Passport<span style={{ color: "#16a34a" }}>™</span></h1>
        <p style={{ color: "#64748b", fontWeight: "500" }}>Your official digital identity for exploring Tanzania.</p>
      </div>

      {/* 2. The Main Passport Card (Modern UI) */}
      <div style={{ 
        position: "relative", height: "300px", borderRadius: "40px", 
        background: "linear-gradient(135deg, #1A3C34 0%, #33438a 100%)",
        padding: "40px", color: "white", boxShadow: "0 25px 50px rgba(26,60,52,0.3)",
        overflow: "hidden", display: "flex", justifyContent: "space-between"
      }}>
        {/* Background Decorative Elements */}
        <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: "20px", left: "40%", fontSize: "150px", opacity: 0.05 }}>🐘</div>

        {/* Left Side: User Info */}
        <div style={{ zIndex: 2, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.6)", marginBottom: "5px" }}>
              Official Traveler
            </p>
            <h2 style={{ fontSize: "28px", fontWeight: "900", margin: 0 }}>{user?.username}</h2>
            <div style={{ marginTop: "10px", backgroundColor: "#22c55e", display: "inline-block", padding: "5px 15px", borderRadius: "10px", fontSize: "12px", fontWeight: "800" }}>
               LEVEL {passport?.level || 1} EXPLORER
            </div>
          </div>
          
          <div>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", margin: 0 }}>PASSPORT ID</p>
            <p style={{ fontSize: "16px", fontWeight: "700", fontFamily: "monospace" }}>KC-{user?.id?.toString().padStart(6, '0')}</p>
          </div>
        </div>

        {/* Right Side: Avatar & Verification */}
        <div style={{ zIndex: 2, textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between" }}>
           <img 
            src={user?.profile?.avatar || "https://ui-avatars.com/api/?name=" + user?.username} 
            alt="Avatar" 
            style={{ width: "100px", height: "100px", borderRadius: "25px", border: "4px solid rgba(255,255,255,0.2)", objectFit: "cover" }}
          />
          {passport?.is_verified && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#22c55e", fontWeight: "900", fontSize: "14px" }}>
              <span>VERIFIED</span> ✅
            </div>
          )}
        </div>
      </div>

      {/* 3. Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
        {[
          { label: "Trust Score", value: `${passport?.trust_score || 0}%`, icon: "🛡️" },
          { label: "Travel Points", value: passport?.points || 0, icon: "💎" },
          { label: "Places Visited", value: passport?.visits_count || 0, icon: "🏔️" },
          { label: "Contributions", value: passport?.tips_count || 0, icon: "✍️" },
        ].map((stat, i) => (
          <div key={i} style={{ backgroundColor: "white", padding: "25px", borderRadius: "30px", border: "1px solid #f1f5f9", textAlign: "center", boxShadow: "0 10px 20px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: "30px", marginBottom: "10px" }}>{stat.icon}</div>
            <h3 style={{ fontSize: "24px", fontWeight: "900", color: "#1e293b", margin: 0 }}>{stat.value}</h3>
            <p style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 4. Badges Section */}
      <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "40px", border: "1px solid #f1f5f9" }}>
        <h3 style={{ fontSize: "20px", fontWeight: "900", marginBottom: "25px" }}>Unlocked Badges 🎖️</h3>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {passport?.badges?.length > 0 ? (
            passport.badges.map((badge: any, idx: number) => (
              <div key={idx} style={{ textAlign: "center", width: "100px" }}>
                <div style={{ width: "80px", height: "80px", backgroundColor: "#f8fafc", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "35px", margin: "0 auto 10px", border: "2px solid #e2e8f0" }}>
                  {badge.icon || "🏅"}
                </div>
                <p style={{ fontSize: "11px", fontWeight: "800", color: "#1e293b" }}>{badge.name}</p>
              </div>
            ))
          ) : (
            <p style={{ color: "#94a3b8", fontSize: "14px", fontWeight: "500" }}>Start your first trip to unlock badges!</p>
          )}
        </div>
      </div>

      {/* 5. Trust Progress Bar Detail */}
      <div style={{ backgroundColor: "#F8FAFC", padding: "30px", borderRadius: "30px", border: "1px dashed #cbd5e1" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
          <span style={{ fontWeight: "800", fontSize: "14px" }}>Next Level Progress</span>
          <span style={{ color: "#16a34a", fontWeight: "900" }}>{passport?.trust_score}%</span>
        </div>
        <div style={{ width: "100%", height: "12px", backgroundColor: "#e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ 
            width: `${passport?.trust_score || 0}%`, 
            height: "100%", 
            backgroundColor: "#16a34a", 
            transition: "width 1s ease-in-out",
            boxShadow: "0 0 10px rgba(22,163,74,0.4)"
          }} />
        </div>
        <p style={{ fontSize: "12px", color: "#64748b", marginTop: "15px" }}>
          💡 Tip: Contribute more "Local Tips" and share "Moments" to increase your trust score and unlock more rewards.
        </p>
      </div>
    </div>
  );
}