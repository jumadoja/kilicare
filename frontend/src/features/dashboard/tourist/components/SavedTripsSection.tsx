"use client";
import { useFetchSavedTrips } from "@/features/dashboard/hooks/useFetchSavedTrips";

export default function SavedTripsSection() {
  const { data } = useFetchSavedTrips();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>Saved Trips 💼</h2>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700' }}>{data?.length || 0} items</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data?.map((trip: any) => (
          <div key={trip.id} style={{ display: 'flex', gap: '15px', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '25px', border: '1px solid #f1f5f9' }}>
            <div style={{ width: '60px', height: '60px', backgroundColor: '#e2e8f0', borderRadius: '18px' }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{trip.title}</h3>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{trip.description || 'No description.'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}