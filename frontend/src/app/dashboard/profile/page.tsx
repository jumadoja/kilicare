"use client";
import { useRef } from "react";
import { useFetchMe } from "@/features/dashboard/hooks/useFetchMe";
import { useUpdateAvatar } from "@/features/dashboard/hooks/useUpdateAvatar"; // Hook tuliyotengeneza mwanzo
import { toast } from "react-hot-toast";

export default function ProfilePage() {
  // 1. Vuta data halisi ya Juma kutoka Backend
  const { data: user, isLoading } = useFetchMe();
  const { mutate: uploadAvatar, isPending: isUploading } = useUpdateAvatar();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) return <div style={{ padding: "40px", textAlign: "center", fontWeight: "800" }}>Loading Profile... 🐘</div>;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      
      {/* 1. Profile Header with Banner */}
      <div style={{ position: "relative", marginBottom: "60px" }}>
        <div style={{ height: "180px", background: "linear-gradient(to right, #1A3C34, #16a34a)", borderRadius: "35px" }} />
        <div style={{ 
          position: "absolute", bottom: "-50px", left: "40px", display: "flex", alignItems: "flex-end", gap: "20px" 
        }}>
          {/* Profile Picture Slot */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              width: "120px", height: "120px", borderRadius: "35px", backgroundColor: "#f1f5f9", 
              border: "6px solid white", display: "flex", alignItems: "center", justifyContent: "center", 
              fontSize: "50px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", cursor: "pointer",
              overflow: "hidden", position: "relative"
            }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              "👤"
            )}
            {isUploading && (
              <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "white" }}>
                ⏳
              </div>
            )}
            <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="image/*" />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "900", color: "#1e293b", margin: 0 }}>{user?.full_name || "Traveler"}</h2>
            <p style={{ color: "#16a34a", fontWeight: "700", fontSize: "14px", margin: 0 }}>
              Verified Explorer • {user?.location || "Tanzania"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px" }}>
        
        {/* Left Side: Account Settings */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "35px", border: "1px solid #f1f5f9" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "20px" }}>Personal Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#94a3b8" }}>Full Name</label>
                <input 
                  style={{ padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", fontWeight: "600" }} 
                  defaultValue={user?.full_name} 
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#94a3b8" }}>Email Address</label>
                <input 
                  style={{ padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "14px", fontWeight: "600" }} 
                  defaultValue={user?.email} 
                  disabled 
                />
              </div>
            </div>
            <button 
              onClick={() => toast.success("Safi! Tunahifadhi mabadiliko...")}
              style={{ marginTop: "25px", padding: "12px 25px", backgroundColor: "#1A3C34", color: "white", border: "none", borderRadius: "15px", fontWeight: "700", cursor: "pointer" }}
            >
              Save Changes
            </button>
          </div>

          <div style={{ backgroundColor: "#fee2e2", padding: "25px", borderRadius: "30px", border: "1px solid #fecaca" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#991b1b", margin: "0 0 10px 0" }}>Danger Zone</h3>
            <p style={{ fontSize: "13px", color: "#b91c1c", marginBottom: "15px" }}>Delete your account and all associated data. This action is irreversible.</p>
            <button style={{ padding: "10px 20px", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}>Delete Account</button>
          </div>
        </div>

        {/* Right Side: Trust & Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ backgroundColor: "#16a34a", padding: "30px", borderRadius: "35px", color: "white" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "800", margin: "0 0 15px 0" }}>Kilicare Trust Score</h3>
            <div style={{ fontSize: "40px", fontWeight: "900", marginBottom: "5px" }}>{user?.trust_score || "98"}%</div>
            <p style={{ fontSize: "12px", opacity: 0.8 }}>Excellent! You are among the top 5% of trusted travelers in Tanzania.</p>
            <div style={{ height: "8px", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "10px", marginTop: "20px" }}>
              <div style={{ width: `${user?.trust_score || 98}%`, height: "100%", backgroundColor: "white", borderRadius: "10px" }} />
            </div>
          </div>

          <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "30px", border: "1px solid #f1f5f9" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "800", marginBottom: "15px" }}>Security</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "15px", borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: "13px", fontWeight: "600" }}>2FA Authentication</span>
              <span style={{ color: user?.is_2fa_enabled ? "#22c55e" : "#ef4444", fontWeight: "800", fontSize: "12px" }}>
                {user?.is_2fa_enabled ? "ON" : "OFF"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "15px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600" }}>Last Login</span>
              <span style={{ color: "#64748b", fontWeight: "600", fontSize: "12px" }}>Recently</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}