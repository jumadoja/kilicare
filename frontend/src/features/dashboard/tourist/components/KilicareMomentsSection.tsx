"use client";
import { useMoments } from "@/features/dashboard/hooks/useFetchMoments";
import { likeMoment } from "@/services/api";

export default function KilicareMomentsSection() {
  const { data, refetch, isLoading } = useMoments();

  // FIX 1: Hakikisha tunapata orodha halisi ya Moments. 
  // Kama API inarudisha { results: [] }, tunachukua results. 
  // Kama inarudisha [] moja kwa moja, tunachukua data yenyewe.
  const momentsList = Array.isArray(data) ? data : data?.results || [];

  // FIX 2: Kama bado inaloadi, onyesha kitu kidogo badala ya ku-crash
  if (isLoading) return <div style={{ color: '#64748b', fontSize: '14px' }}>Loading moments...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
      {/* Tunatumia momentsList ambayo tuna uhakika ni Array */}
      {momentsList.slice(0, 4).map((m: any) => (
        <div key={m.id} style={{ position: 'relative', height: '280px', backgroundColor: '#e2e8f0', borderRadius: '35px', overflow: 'hidden', cursor: 'pointer' }}>
          
          {/* Background Image Fix: Nimeongeza img tag ili uone picha halisi */}
          <img 
            src={m.image || "/placeholder.jpg"} 
            alt="moment" 
            style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} 
          />

          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', zIndex: 1 }} />
          
          <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 2, display: 'flex', alignItems: 'center', gap: '8px' }}>
             <div style={{ width: '25px', height: '25px', borderRadius: '50%', backgroundColor: 'white', border: '2px solid #16a34a' }} />
             <span style={{ fontSize: '10px', fontWeight: '700', color: 'white' }}>@{m.user || 'local'}</span>
          </div>

          <div style={{ position: 'absolute', bottom: '20px', left: '15px', right: '15px', zIndex: 2 }}>
             <p style={{ fontSize: '11px', color: 'white', fontWeight: '500', marginBottom: '10px' }}>{m.content}</p>
             <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={async (e) => { 
                    e.stopPropagation(); 
                    try {
                      await likeMoment(m.id); 
                      refetch(); 
                    } catch (err) {
                      console.error("Like failed", err);
                    }
                  }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px', 
                    fontSize: '10px', 
                    color: 'white', 
                    background: 'rgba(255,255,255,0.2)', 
                    padding: '5px 12px', 
                    borderRadius: '15px', 
                    border: 'none',
                    backdropFilter: 'blur(5px)',
                    cursor: 'pointer'
                  }}
                >
                  ❤️ {m.likes_count || m.likes || 0}
                </button>
             </div>
          </div>
        </div>
      ))}

      {/* Kama hakuna data kabisa */}
      {momentsList.length === 0 && (
        <div style={{ gridColumn: '1/-1', color: '#94a3b8', fontSize: '14px' }}>
          No moments shared today.
        </div>
      )}
    </div>
  );
}