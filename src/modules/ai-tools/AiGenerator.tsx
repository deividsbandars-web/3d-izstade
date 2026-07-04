import { useState } from 'react';
import '../../components/calculator/styles/CalculatorPro.css';
import { openExternalUrl } from '../../utils/openExternalUrl';
import { generateAiResponse } from '../../services/aiService';

export default function AiGenerator() {
  const [activeMode, setActiveChannel] = useState('cosmic');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [step, setStep] = useState('input'); // input, generating, preview, checkout
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const MODES: any = {
    'music': { name: 'MUSIC VISUALS', icon: '🎵', color: '#8b5cf6', desc: 'Audio-reaktīvas formas un ritma vizualizācija.' },
    'cosmic': { name: 'COSMIC ART', icon: '🌌', color: '#0ea5e9', desc: 'Galaktikas, nebuļas un dziļā telpa 16K.' },
    'meditation': { name: 'MEDITATION', icon: '🧘', color: '#10b981', desc: 'Nomierinošas dabas ainavas un lēna plūsma.' },
    'club': { name: 'CLUB VJ LOOPS', icon: '⚡', color: '#ec4899', desc: 'Augsta kontrasta neona VJ cilpas LED sienām.' }
  };

  const generate = async () => {
    setStep('generating');
    try {
      const systemPrompt = `Tu esi 8K video inženieris. Mode: ${MODES[activeMode].name}. Lietotāja teksts: ${prompt}. Uzģenerē īsu, vizuāli aprakstošu video ainu.`;
      
      const responseText = await generateAiResponse(systemPrompt);
      
      setResult(responseText);
      // Simulējam video ielādi no krātuves
      setVideoUrl("https://vjs.zencdn.net/v/oceans.mp4");
      setStep('preview');
    } catch {
      setStep('input');
      alert("AI kļūda. Lūdzu mēģiniet vēlreiz.");
    }
  };

  const handlePayment = () => {
    setStep('checkout');
    // Simulējam Stripe maksājumu
    setTimeout(() => {
      alert("Maksājums veiksmīgs (2 €)! Lejupielāde sākas...");
      if (!openExternalUrl(videoUrl)) {
        alert("Video lejupielÄdes saite nav derÄ«ga.");
      }
      setStep('input');
      setPrompt('');
    }, 2000);
  };

  const current = MODES[activeMode];

  return (
    <div className="calculator-pro-wrapper" style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      <div className="calc-header">
        <h1 style={{ background: `linear-gradient(135deg, ${current.color}, #fff)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '3.5rem' }}>
          {current.name} ENGINE
        </h1>
        <p style={{ color: '#aaa', fontSize: '1.2rem' }}>Uzraksti vīziju ➔ AI uztaisīs video ➔ Samaksā 2€ ➔ Lejupielādē.</p>
      </div>

      {step === 'input' && (
        <>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '40px 0', flexWrap: 'wrap' }}>
            {Object.entries(MODES).map(([key, val]: any) => (
              <button key={key} onClick={() => setActiveChannel(key)} style={{ 
                padding: '12px 25px', borderRadius: '50px', border: `2px solid ${val.color}`,
                background: activeMode === key ? val.color : 'transparent', color: '#fff', fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s'
              }}>{val.icon} {val.name}</button>
            ))}
          </div>
          <div className="calc-grid">
            <div className="calc-form-column" style={{ margin: '0 auto', maxWidth: '800px' }}>
              <section className="calc-section" style={{ borderLeftColor: current.color, background: 'rgba(15, 23, 42, 0.5)' }}>
                <h2 style={{ color: '#fff' }}>Ko tu vēlies redzēt?</h2>
                <textarea 
                  value={prompt} onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Apraksti video ainu šeit (piemēram: mirdzošas neona daļiņas lēni plūst caur tumšu telpu)..."
                  style={{ width: '100%', height: '180px', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155', color: '#fff', padding: '20px', borderRadius: '12px', fontSize: '1.1rem', lineHeight: 1.6 }}
                />
                <button onClick={generate} disabled={!prompt} className="btn-pro" style={{ width: '100%', marginTop: '20px', background: current.color, fontSize: '1.5rem', boxShadow: `0 0 30px ${current.color}44` }}>
                  AI UZTAISĪT VIDEO
                </button>
              </section>
            </div>
          </div>
        </>
      )}

      {step === 'generating' && (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <div style={{ width: '80px', height: '80px', border: '8px solid rgba(255,255,255,0.1)', borderTopColor: current.color, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <h2 style={{ color: '#fff', marginTop: '40px', letterSpacing: '2px' }}>AI ĢENERĒ TAVU VIDEO...</h2>
          <p style={{ color: '#666' }}>Tas aizņems aptuveni 30 sekundes (RTX 4080 Power)</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {step === 'preview' && (
        <div className="calc-grid" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="calc-form-column">
            <section className="calc-section" style={{ borderColor: '#10b981', background: 'rgba(15, 23, 42, 0.8)' }}>
              <h2 style={{ color: '#10b981', marginBottom: '20px' }}>Video Priekšskatījums</h2>
              <div style={{ borderRadius: '12px', overflow: 'hidden', border: `2px solid ${current.color}`, boxShadow: `0 0 50px ${current.color}22` }}>
                <video src={videoUrl!} autoPlay loop muted playsInline style={{ width: '100%' }} />
              </div>
              <div style={{ marginTop: '25px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: '#ccc', fontSize: '0.9rem', fontStyle: 'italic' }}>
                "{result}"
              </div>
              
              <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
                <button onClick={() => setStep('input')} className="btn-pro" style={{ flex: 1, background: '#334155' }}>MĒĢINĀT VĒLREIZ</button>
                <button onClick={handlePayment} className="btn-pro" style={{ flex: 2, background: '#10b981', fontSize: '1.3rem', boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)' }}>MAKSĀT UN LEJUPIELĀDĒT (2 €)</button>
              </div>
            </section>
          </div>
        </div>
      )}

      {step === 'checkout' && (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <div style={{ fontSize: '6rem', animation: 'pulse 1.5s infinite' }}>💳</div>
          <h2 style={{ color: '#fff', marginTop: '30px', letterSpacing: '1px' }}>APSTRĀDĀ DROŠU MAKSĀJUMU...</h2>
          <style>{`@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }`}</style>
        </div>
      )}
    </div>
  );
}
