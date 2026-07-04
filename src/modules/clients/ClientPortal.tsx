import { useState } from 'react';
import '../../components/calculator/styles/CalculatorPro.css';
import { stripeService } from '../../services/stripeService';
import { openExternalUrl } from '../../utils/openExternalUrl';

export default function ClientPortal() {
  const [isPaying, setIsPaying] = useState(false);
  const [activeProject] = useState({
    id: 'PRJ-2026-042',
    name: 'Jumta un Fasādes pārbūve',
    status: 'In Progress',
    progress: 65,
    nextStep: 'Logu montāža (12. marts)',
    contractor: 'BuildMaster SIA'
  });

  const handlePayment = async () => {
    setIsPaying(true);
    try {
      const { url } = await stripeService.createCheckoutSession(3950, 'Project Payment: ' + activeProject.name);
      if (!openExternalUrl(url)) {
        throw new Error('Invalid checkout URL');
      }
    } catch {
      alert("Maksājuma kļūda. Lūdzu, mēģiniet vēlreiz.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1 className="text-accent">Mans Portāls</h1>
        <p>Sveicināti atpakaļ! Sekojiet līdzi sava projekta gaitai.</p>
      </div>

      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Aktīvais Projekts: {activeProject.name}</h2>
              <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '5px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 900 }}>{activeProject.status.toUpperCase()}</span>
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Progresa statuss:</span>
                <span style={{ fontWeight: 800 }}>{activeProject.progress}%</span>
              </div>
              <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${activeProject.progress}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #10b981)' }}></div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '5px' }}>NĀKAMAIS SOLIS:</div>
              <div style={{ fontWeight: 700 }}>{activeProject.nextStep}</div>
            </div>
          </section>

          <section className="calc-section">
            <h2>Pēdējie dokumenti</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                <span>📄 Parakstīts Līgums.pdf</span>
                <button className="btn-glass" style={{ padding: '5px 15px', fontSize: '0.7rem' }}>SKATĪT</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                <span>💰 Rēķins #2026-004.pdf</span>
                <button 
                  onClick={handlePayment}
                  disabled={isPaying}
                  className="btn-primary" 
                  style={{ padding: '5px 15px', fontSize: '0.7rem', background: '#10b981' }}
                >
                  {isPaying ? 'SAVIENO...' : 'APMAKSĀT'}
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Mana Tāme</h3>
            <div className="grand-total-box">
              <span className="gt-label">KOPĒJĀ LĪGUMA SUMMA</span>
              <span className="gt-value">12,450 €</span>
            </div>
            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Apmaksāts:</span>
                <strong style={{ color: '#10b981' }}>8,500 €</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Atlikums:</span>
                <strong style={{ color: '#f59e0b' }}>3,950 €</strong>
              </div>
            </div>
            <button className="btn-primary" style={{ width: '100%', marginTop: '30px' }}>SAZINĀTIES AR VADĪTĀJU</button>
          </div>
        </div>
      </div>
    </div>
  );
}
