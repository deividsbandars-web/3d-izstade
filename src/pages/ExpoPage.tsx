import { useEffect, useState } from 'react';
import { expoDashboardService } from '../app/expo/expoDashboardService';
import { BoothCard } from '../components/ui/BoothCard';

export default function ExpoPage() {
  const [booths, setBooths] = useState<any[]>([]);
  const [analyticsMap, setAnalyticsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const USER_ID = '00000000-0000-0000-0000-000000000000';

  useEffect(() => {
    async function loadData() {
      const boothsRes = await expoDashboardService.getManagedBooths(USER_ID);
      
      if (boothsRes.data) {
        setBooths(boothsRes.data);
        
        // Fetch analytics for each booth
        const map: Record<string, any> = {};
        await Promise.all(boothsRes.data.map(async (booth: any) => {
          const stats = await expoDashboardService.getBoothAnalytics(booth.id);
          if (stats.data) map[booth.id] = stats.data;
        }));
        setAnalyticsMap(map);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Expo Manager</h1>
          <p style={{ color: '#94a3b8', margin: '10px 0 0 0' }}>Manage your virtual 3D booths and track visitor engagement.</p>
        </div>
        <button style={{ background: '#fff', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
          + CREATE NEW BOOTH
        </button>
      </div>

      {loading ? <p>Loading booths...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
          {booths.length === 0 ? <p style={{ color: '#64748b' }}>You have no active booths.</p> : null}
          {booths.map(booth => (
            <BoothCard 
              key={booth.id} 
              booth={booth} 
              analytics={analyticsMap[booth.id]} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
