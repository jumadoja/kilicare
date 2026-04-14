"use client";
import { useFetchExperiences } from "@/features/dashboard/hooks/useFetchExperiences";

export default function TodayNearMeSection() {
  const { data: events, isLoading } = useFetchExperiences();

  if (isLoading) return <div style={{ padding: '20px' }}>Inapakia safari...</div>;

  return (
    <div className="safari-grid-system">
      {events?.map((event: any) => (
        <div key={event.id} className="safari-item-card">
          <div className="safari-overlay"></div>
          
          {/* Price Tag Badge */}
          <div style={{
            position: 'absolute', top: '20px', left: '20px', zIndex: 12,
            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
            padding: '5px 15px', borderRadius: '15px', color: 'white', fontWeight: 'bold'
          }}>
            ${event.price || '450'}
          </div>

          {/* Info Area */}
          <div className="safari-card-details">
            <h3 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>{event.title}</h3>
            <p style={{ margin: '5px 0 0', fontSize: '12px', opacity: 0.8 }}>
              📍 {event.location || 'Arusha, Tanzania'}
            </p>
          </div>
          
          {/* Heart Button */}
          <button style={{
            position: 'absolute', top: '20px', right: '20px', zIndex: 12,
            width: '35px', height: '35px', borderRadius: '50%', border: 'none',
            background: 'white', cursor: 'pointer', fontSize: '16px'
          }}>
            ❤️
          </button>
        </div>
      ))}
    </div>
  );
}