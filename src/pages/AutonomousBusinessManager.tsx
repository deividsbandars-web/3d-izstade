import { useState, useEffect } from 'react';

interface AutoBusiness {
  id: string;
  niche: string;
  status: 'initializing' | 'operating' | 'optimizing';
  revenue: number;
  leadsFound: number;
  conversionRate: number;
  uptime: string;
  logs: string[];
}

export default function AutonomousBusinessManager() {
  const [businesses, setBusinesses] = useState<AutoBusiness[]>([]);
  const [newNiche, setNewNiche] = useState('');
  const [isLaunching, setIsLaunching] = useState(false);

  const launchBusiness = async () => {
    if (!newNiche) return;
    setIsLaunching(true);
    
    const id = `biz_${Date.now()}`;
    const newBiz: AutoBusiness = {
      id,
      niche: newNiche,
      status: 'initializing',
      revenue: 0,
      leadsFound: 0,
      conversionRate: 0,
      uptime: '0m',
      logs: [`[SYSTEM] Launching autonomous engine for ${newNiche}`]
    };

    setBusinesses(prev => [newBiz, ...prev]);
    setNewNiche('');

    // Simulate the background process
    setTimeout(() => {
      updateBiz(id, { status: 'operating', logs: [...newBiz.logs, '[AGENT: Architect] Business model finalized.', '[AGENT: Marketing] Campaigns live on LinkedIn/Meta.'] });
    }, 3000);

    setIsLaunching(false);
  };

  const updateBiz = (id: string, updates: Partial<AutoBusiness>) => {
    setBusinesses(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  // Simulate live updates for revenue and leads
  useEffect(() => {
    const interval = setInterval(() => {
      setBusinesses(prev => prev.map(b => {
        if (b.status === 'initializing') return b;
        
        const newLeads = b.leadsFound + (Math.random() > 0.7 ? 1 : 0);
        const newRevenue = b.revenue + (Math.random() > 0.9 ? Math.floor(Math.random() * 500) + 100 : 0);
        const newLog = Math.random() > 0.95 ? `[AGENT: Sales] New lead closed for €${(newRevenue - b.revenue).toFixed(2)}` : null;
        
        return {
          ...b,
          leadsFound: newLeads,
          revenue: newRevenue,
          conversionRate: newLeads > 0 ? (newRevenue / (newLeads * 500)) * 100 : 0, // Mock calculation
          logs: newLog ? [...b.logs.slice(-10), newLog] : b.logs
        };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#fff', padding: '60px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 950, background: 'linear-gradient(135deg, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AUTONOMOUS BUSINESS FLEET
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginTop: '10px' }}>
            Monitor and scale multiple AI-operated business units simultaneously.
          </p>
        </div>

        {/* Launch Control */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: '24px', padding: '30px', marginBottom: '50px', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '10px', color: '#cbd5e1', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '1px' }}>TARGET NICHE</label>
            <input 
              type="text" 
              value={newNiche} 
              onChange={e => setNewNiche(e.target.value)} 
              placeholder="e.g. AI Content Agency, 3D Print Farm..." 
              style={{ width: '100%', padding: '15px 20px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff', fontSize: '1.1rem', outline: 'none' }}
            />
          </div>
          <button 
            onClick={launchBusiness} 
            disabled={!newNiche || isLaunching}
            style={{ padding: '18px 40px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 950, cursor: 'pointer', transition: 'transform 0.2s', marginTop: '25px' }}
          >
            {isLaunching ? 'INITIALIZING...' : 'DEPLOY NEW BUSINESS'}
          </button>
        </div>

        {/* Fleet Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(550px, 1fr))', gap: '30px' }}>
          {businesses.map(biz => (
            <div key={biz.id} style={{ background: '#0f172a', borderRadius: '24px', border: '1px solid #1e293b', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              
              {/* Header */}
              <div style={{ padding: '25px', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>{biz.niche.toUpperCase()}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: biz.status === 'initializing' ? '#f59e0b' : '#10b981' }}></div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>{biz.status}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800 }}>ID: {biz.id}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800 }}>UPTIME: {biz.uptime}</div>
                </div>
              </div>

              {/* Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '25px', gap: '15px', borderBottom: '1px solid #1e293b' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800 }}>REVENUE</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 950, color: '#10b981', marginTop: '5px' }}>€{biz.revenue.toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800 }}>LEADS</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 950, color: '#3b82f6', marginTop: '5px' }}>{biz.leadsFound}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800 }}>CONV. RATE</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 950, color: '#ec4899', marginTop: '5px' }}>{biz.conversionRate.toFixed(1)}%</div>
                </div>
              </div>

              {/* Logs */}
              <div style={{ padding: '20px', flex: 1, maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                {biz.logs.map((log, i) => (
                  <div key={i} style={{ marginBottom: '8px', color: log.includes('SYSTEM') ? '#3b82f6' : log.includes('New lead') ? '#10b981' : '#cbd5e1' }}>
                    <span style={{ color: '#64748b', marginRight: '10px' }}>[{new Date().toLocaleTimeString()}]</span>
                    {log}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ padding: '20px', background: '#1e293b', display: 'flex', gap: '15px' }}>
                <button style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>ADJUST STRATEGY</button>
                <button style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>TERMINATE UNIT</button>
              </div>

            </div>
          ))}

          {businesses.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', opacity: 0.3 }}>
              <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🚢</div>
              <h2 style={{ fontWeight: 900 }}>NO ACTIVE BUSINESS UNITS</h2>
              <p>Deploy your first autonomous business to start generating revenue.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
