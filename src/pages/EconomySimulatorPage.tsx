import { useState, useEffect } from 'react';
import { economySimulator, type GlobalMarketState } from '../services/economySimulator';

export default function GlobalEconomySimulator() {
  const [market, setMarket] = useState<GlobalMarketState>(economySimulator.initializeGlobalMarket());
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyNiche, setNewCompanyNiche] = useState('AI Automation');
  const [selectedCity, setSelectedCity] = useState('city-riga');

  const handleNextCycle = () => {
    setMarket(prev => economySimulator.processCycle(prev));
  };

  const handleAddCompany = async () => {
    if (!newCompanyName) return;
    const newComp = await economySimulator.aiCreateCompany(newCompanyNiche, newCompanyName, selectedCity);
    setMarket(prev => ({
      ...prev,
      companies: [...prev.companies, newComp],
      logs: [...prev.logs, `[SYSTEM] New Company Registered: ${newComp.name} (HQ: ${economySimulator.getCityName(prev, selectedCity)})`]
    }));
    setNewCompanyName('');
  };

  useEffect(() => {
    let interval: any;
    if (isAutoProcessing) {
      interval = setInterval(() => {
        handleNextCycle();
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isAutoProcessing]);

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#fff', padding: '40px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '3rem', fontWeight: 950, margin: 0, background: 'linear-gradient(135deg, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              GLOBAL ECONOMY NETWORK
            </h1>
            <p style={{ color: '#94a3b8', marginTop: '5px', letterSpacing: '1px' }}>Autonomous AI Business Expansion across Expo Cities.</p>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={handleNextCycle} style={btnStyle}>SIMULATE CYCLE</button>
            <button 
              onClick={() => setIsAutoProcessing(!isAutoProcessing)} 
              style={{ ...btnStyle, background: isAutoProcessing ? '#ef4444' : '#10b981' }}
            >
              {isAutoProcessing ? 'STOP AUTO-TRADE' : 'ENABLE AUTO-TRADE'}
            </button>
          </div>
        </header>

        {/* Global Overview Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', marginBottom: '40px' }}>
          <StatCard label="MARKET CYCLE" value={`#${market.cycle}`} color="#3b82f6" />
          <StatCard label="TOTAL ENTITIES" value={market.companies.length.toString()} color="#8b5cf6" />
          <StatCard label="ACTIVE CITIES" value={market.cities.length.toString()} color="#10b981" />
          <StatCard label="GLOBAL LIQUIDITY" value={`€${market.companies.reduce((acc, c) => acc + c.cash, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color="#f59e0b" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px' }}>
          
          <main>
            {/* City Hubs Visualizer */}
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '20px', color: '#3b82f6' }}>🏙️ REGIONAL CITY HUBS</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
              {market.cities.map(city => (
                <div key={city.id} style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: '20px', border: '1px solid #1e293b', padding: '25px', backdropFilter: 'blur(10px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{city.name}</h3>
                    <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800 }}>STABILITY: {city.stability.toFixed(2)}x</span>
                  </div>
                  {Object.entries(city.nicheDemand).map(([niche, demand]: [string, any]) => (
                    <div key={niche} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8' }}>
                        <span>{niche}</span>
                        <span>€{demand.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div style={{ height: '3px', background: '#0f172a', marginTop: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (demand / 200000) * 100)}%`, height: '100%', background: '#3b82f6' }}></div>
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #1e293b', fontSize: '0.75rem', color: '#64748b' }}>
                    Presence: {market.companies.filter(c => c.branches.some(b => b.cityId === city.id)).length} Companies
                  </div>
                </div>
              ))}
            </div>

            {/* Global Company Ranks */}
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: '24px', border: '1px solid #1e293b', padding: '30px' }}>
              <h2 style={{ marginBottom: '25px', fontSize: '1.2rem', fontWeight: 900 }}>GLOBAL BUSINESS DIRECTORY</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #1e293b', color: '#64748b', fontSize: '0.75rem' }}>
                      <th style={{ padding: '15px' }}>COMPANY</th>
                      <th>HQ STATUS</th>
                      <th>GLOBAL REVENUE</th>
                      <th>NET PROFIT</th>
                      <th>CASH</th>
                      <th>CITY PRESENCE (MKT/SALES)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {market.companies.sort((a, b) => b.revenue - a.revenue).map(comp => (
                      <tr key={comp.id} style={{ borderBottom: '1px solid #1e293b', fontSize: '0.85rem' }}>
                        <td style={{ padding: '20px' }}>
                          <div style={{ fontWeight: 800, color: '#fff' }}>{comp.name}</div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{comp.niche} | HQ: {economySimulator.getCityName(market, comp.hqCityId)}</div>
                        </td>
                        <td>
                          <span style={{ 
                            padding: '4px 8px', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase',
                            background: comp.stage === 'sales' ? '#10b98122' : '#3b82f622',
                            color: comp.stage === 'sales' ? '#10b981' : '#3b82f6'
                          }}>{comp.stage}</span>
                        </td>
                        <td style={{ color: '#10b981', fontWeight: 800 }}>€{comp.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td style={{ color: '#f59e0b', fontWeight: 800 }}>€{comp.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td style={{ color: '#e2e8f0', fontWeight: 700 }}>€{comp.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {comp.branches.map(branch => {
                              const cityName = economySimulator.getCityName(market, branch.cityId);
                              return (
                                <div key={branch.cityId} style={{ 
                                  padding: '4px 8px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', fontSize: '0.6rem',
                                  display: 'flex', alignItems: 'center', gap: '5px'
                                }}>
                                  <span style={{ color: '#64748b' }}>{cityName.split(' ')[0]}</span>
                                  <div style={{ width: '20px', height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ width: `${branch.localMarketingPower * 100}%`, height: '100%', background: '#3b82f6' }}></div>
                                  </div>
                                  {branch.isSalesActive && <span style={{ color: '#10b981' }}>●</span>}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Expansion Terminal */}
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: '24px', border: '1px solid #1e293b', padding: '30px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 950, marginBottom: '20px', letterSpacing: '1px' }}>NEW MARKET ENTRY</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input 
                  type="text" 
                  value={newCompanyName} 
                  onChange={e => setNewCompanyName(e.target.value)} 
                  placeholder="Business Name..." 
                  style={inputStyle} 
                />
                <select 
                  value={newCompanyNiche} 
                  onChange={e => setNewCompanyNiche(e.target.value)} 
                  style={inputStyle}
                >
                  {Object.keys(market.cities[0].nicheDemand).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <select 
                  value={selectedCity} 
                  onChange={e => setSelectedCity(e.target.value)} 
                  style={inputStyle}
                >
                  {market.cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={handleAddCompany} style={{ ...btnStyle, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', width: '100%', marginTop: '10px' }}>LAUNCH GLOBAL ENTITY</button>
              </div>
            </div>

            {/* Trade Logs */}
            <div style={{ background: '#000', borderRadius: '24px', border: '1px solid #1e293b', padding: '30px', flex: 1, maxHeight: '600px', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#64748b', marginBottom: '20px', letterSpacing: '2px' }}>NETWORK ACTIVITY</h3>
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#10b981', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {market.logs.map((log, i) => (
                  <div key={i} style={{ lineHeight: '1.5', opacity: i === market.logs.length - 1 ? 1 : 0.6 }}>
                    <span style={{ color: '#334155' }}>&gt;</span> {log}
                  </div>
                ))}
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: '24px', border: '1px solid #1e293b', padding: '30px', textAlign: 'center' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#64748b', letterSpacing: '2px', marginBottom: '10px' }}>{label}</div>
      <div style={{ fontSize: '2.2rem', fontWeight: 950, color }}>{value}</div>
    </div>
  );
}

const btnStyle = {
  padding: '14px 28px',
  background: '#1e293b',
  border: 'none',
  borderRadius: '14px',
  color: '#fff',
  fontWeight: 900,
  fontSize: '0.85rem',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  letterSpacing: '1px'
};

const inputStyle = {
  padding: '15px',
  background: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '0.9rem',
  outline: 'none',
  fontWeight: 600
};
