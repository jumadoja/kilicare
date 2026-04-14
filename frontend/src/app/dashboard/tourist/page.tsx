"use client";
import { useAuthStore } from "@/store/authStore";
import ProfileSection from "@/features/dashboard/tourist/components/ProfileSection";
import AIPreviewSection from "@/features/dashboard/tourist/components/AIPreviewSection";
import KilicareMomentsSection from "@/features/dashboard/tourist/components/KilicareMomentsSection";
import KilicarePassportSection from "@/features/dashboard/tourist/components/KilicarePassportSection";
import LocalTipsMap from "@/features/dashboard/tourist/components/LocalTipsMap";
import MessagingSection from "@/features/dashboard/tourist/components/MessagingSection";
import SavedTripsSection from "@/features/dashboard/tourist/components/SavedTripsSection";
import TodayNearMeSection from "@/features/dashboard/tourist/components/TodayNearMeSection";

export default function Page() {
  const user = useAuthStore(s => s.user);

  return (
    <div className="animate-fade-up">
      <div className="dashboard-grid-layout">
        
        {/* Safu ya Kati (Main Content) */}
        <div className="main-column">
          
          {/* Header Card */}
          <div className="white-section-card">
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1A3C34' }}>
              Hello, {user?.username || 'Traveler'}! 👋
            </h1>
            <p style={{ color: '#94a3b8', marginTop: '5px', fontWeight: '500' }}>Welcome back and explore the world</p>
            
            <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
              <input 
                type="text" 
                placeholder="Search Destinations..." 
                className="input-focus-effect"
                style={{ flex: 1, padding: '18px 25px', borderRadius: '20px', border: 'none', background: '#F3F5F7', outline: 'none' }}
              />
              <button className="btn-primary" style={{ padding: '0 35px' }}>Search</button>
            </div>
          </div>

          {/* Discover Section */}
          <div className="white-section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
              <h2 style={{ fontWeight: '800' }}>Discover World 🌍</h2>
              <span style={{ color: '#16a34a', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>View all →</span>
            </div>
            <TodayNearMeSection />
          </div>

          {/* Moments Section */}
          <div className="white-section-card">
            <h2 style={{ fontWeight: '800', marginBottom: '20px' }}>Kilicare Moments ✨</h2>
            <KilicareMomentsSection />
          </div>

          {/* Bottom Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
            <div style={{ background: '#1e293b', padding: '35px', borderRadius: '40px', color: 'white' }}>
              <AIPreviewSection />
            </div>
            <div className="white-section-card">
              <SavedTripsSection />
            </div>
          </div>
        </div>

        {/* Safu ya Kulia (Profile Sidebar) */}
        <div className="right-column" style={{ position: 'sticky', top: '40px' }}>
          <div className="white-section-card" style={{ textAlign: 'center', padding: '0 0 35px 0', overflow: 'hidden' }}>
            <div style={{ height: '120px', background: 'linear-gradient(to bottom right, #1A3C34, #16a34a)' }}></div>
            <div style={{ marginTop: '-50px' }}>
              <ProfileSection />
            </div>
            <div style={{ padding: '0 30px', marginTop: '25px' }}>
              <KilicarePassportSection />
            </div>
          </div>

          <div className="white-section-card" style={{ padding: '10px' }}>
            <LocalTipsMap />
          </div>

          <div className="white-section-card" style={{ padding: '10px' }}>
            <MessagingSection />
          </div>
        </div>

      </div>
    </div>
  );
}