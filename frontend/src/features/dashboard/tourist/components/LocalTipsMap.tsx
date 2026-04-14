"use client";
import { useTips } from "@/features/dashboard/hooks/useFetchTips";

export default function LocalTipsMap() {
  const { data } = useTips();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🗺️</span> Local Secrets
      </h2>
      <div style={{ position: 'relative', height: '180px', borderRadius: '35px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
         <div style={{ position: 'absolute', inset: 0, backgroundColor: '#f1f5f9', backgroundImage: "url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/39.2, -6.1,9,0/400x300?access_token=YOUR_TOKEN')", backgroundSize: 'cover' }} />
         <div style={{ position: 'absolute', bottom: '15px', left: '15px', right: '15px', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', padding: '12px', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '9px', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase' }}>Tip of the day</p>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>Best Mshikaki spot in Dodoma!</h4>
         </div>
      </div>
      <button style={{ width: '100%', padding: '15px', fontSize: '13px', fontWeight: '700', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '20px', background: 'transparent', cursor: 'pointer' }}>
          + Add your own tip
      </button>
    </div>
  );
}