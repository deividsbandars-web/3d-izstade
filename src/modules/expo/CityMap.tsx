import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../components/calculator/styles/CalculatorPro.css';
import { EXPO_CANONICAL_DISTRICT_CATALOG } from '../../services/expoService';

export default function CityMap() {
  const nav = useNavigate();
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  return (
    <div className="calculator-pro-wrapper" style={{ maxWidth: '1600px' }}>
      <div className="calc-header" style={{ marginBottom: '40px' }}>
        <h1 style={{ background: 'linear-gradient(135deg, #fff, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '3.5rem', fontWeight: 950 }}>
          WARPALA EXPO CITY
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#cbd5e1' }}>
          {EXPO_CANONICAL_DISTRICT_CATALOG.length} canonical districts | unified 2D and 3D scene contract
        </p>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => nav('/marketplace')} className="btn-pro" style={{ background: '#3b82f6', padding: '10px 20px', fontSize: '0.8rem' }}>MARKETPLACE</button>
          <button onClick={() => nav('/urgent-services')} className="btn-pro" style={{ background: '#ef4444', padding: '10px 20px', fontSize: '0.8rem' }}>URGENT</button>
          <button onClick={() => nav('/events')} className="btn-pro" style={{ background: '#8b5cf6', padding: '10px 20px', fontSize: '0.8rem' }}>EVENTS</button>
          <button onClick={() => nav('/ads-network')} className="btn-pro" style={{ background: '#10b981', padding: '10px 20px', fontSize: '0.8rem' }}>ADS</button>
          <button onClick={() => nav('/expo-3d')} className="btn-pro" style={{ background: '#fff', color: '#000', padding: '10px 20px', fontSize: '0.8rem' }}>ENTER 3D</button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '15px',
          padding: '20px',
          background: 'rgba(15, 23, 42, 0.3)',
          borderRadius: '24px',
          border: '1px solid #1e293b'
        }}
      >
        {EXPO_CANONICAL_DISTRICT_CATALOG.map((district, index) => (
          <div
            key={district.id}
            onMouseEnter={() => setHoveredDistrict(district.id)}
            onMouseLeave={() => setHoveredDistrict(null)}
            onClick={() => nav('/expo-3d')}
            style={{
              background: hoveredDistrict === district.id ? `linear-gradient(135deg, ${district.color}22, ${district.color}11)` : 'rgba(255,255,255,0.02)',
              border: `1px solid ${hoveredDistrict === district.id ? district.color : '#1e293b'}`,
              borderRadius: '16px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ fontSize: '2rem' }}>{district.icon}</div>
              <h3 style={{ color: district.color, fontWeight: 900, fontSize: '1rem', margin: 0 }}>
                {index + 1}. {district.name}
              </h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
              {district.description}
            </p>
            <p style={{ fontSize: '0.72rem', color: district.color, margin: 0, opacity: 0.9 }}>
              Calculators: {district.calculatorCategories.join(', ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
