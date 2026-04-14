"use client";

export default function KilicarePassportSection() {
  const stats = [
    { title: "Mt. Kilimanjaro", date: "14 March 2026", icon: "🏔️" },
    { title: "Zanzibar Beaches", date: "21 March 2026", icon: "🏖️" },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h3 style={{ fontWeight: '800', color: '#1e293b', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🛂</span> Kilicare Passport™
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {stats.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', backgroundColor: '#F8FAFC', borderRadius: '25px', border: '1px solid #f1f5f9' }}>
            <div style={{ width: '50px', height: '50px', backgroundColor: 'white', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
               {item.icon}
            </div>
            <div style={{ flex: 1 }}>
               <h4 style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px', margin: 0 }}>{item.title}</h4>
               <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>{item.date}</p>
            </div>
            <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '4px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '800' }}>STAMPED</div>
          </div>
        ))}
      </div>
    </div>
  );
}