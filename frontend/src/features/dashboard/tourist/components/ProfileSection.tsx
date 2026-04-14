"use client";
import { useAuthStore } from "@/store/authStore";

export default function ProfileSection() {
  const user = useAuthStore(s => s.user);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ position: 'relative', width: '100px', height: '100px' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '4px solid white', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
           <span style={{ fontSize: '32px', fontWeight: '800', color: '#16a34a' }}>
             {user?.username?.charAt(0).toUpperCase() || 'U'}
           </span>
        </div>
        <div style={{ position: 'absolute', bottom: '5px', right: '5px', width: '22px', height: '22px', backgroundColor: '#16a34a', border: '3px solid white', borderRadius: '50%' }} />
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#1e293b', letterSpacing: '-0.5px' }}>
          {user?.username || 'Traveler'}
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', marginTop: '4px' }}>
          {user?.role?.toLowerCase() === 'tourist' ? '🌍 Traveling Lover' : '🌟 Local Guide'}
        </p>
      </div>

      <div style={{ marginTop: '15px', backgroundColor: '#f0fdf4', padding: '6px 15px', borderRadius: '20px', border: '1px solid #dcfce7' }}>
         <span style={{ fontSize: '10px', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase' }}>Verified Explorer</span>
      </div>
    </div>
  );
}