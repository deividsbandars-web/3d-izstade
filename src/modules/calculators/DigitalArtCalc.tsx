import { useState } from 'react';
import { CalculatorLeadCta } from './CalculatorLeadCta';
import '../../components/calculator/styles/CalculatorPro.css';

const SERVICES = {
  logo: { name: 'Logo izstrāde un brendings', price: 350 },
  web_design: { name: 'UI/UX Web dizains (Figma)', price: 850 },
  illustration: { name: 'Digitālā ilustrācija / Māksla', price: 150 },
  ad_banner: { name: 'Reklāmas baneru komplekts', price: 120 },
};

export default function DigitalArtCalc() {
  const [params, setParams] = useState({ service: 'logo', complexity: 'standard' });
  const [results, setResults] = useState<any>(null);

  const handleCalculate = () => {
    const base = SERVICES[params.service as keyof typeof SERVICES].price;
    const mult = params.complexity === 'premium' ? 1.8 : 1.0;
    setResults({ grandTotal: base * mult });
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO Digitālās Mākslas Tāme</h1>
        <p>Grafiskā dizaina un brendinga izmaksu kalkulators.</p>
      </div>
      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>🎨 Radošais uzdevums</h2>
            <div className="input-group">
              <label>Pakalpojums
                <select value={params.service} onChange={(e) => setParams({...params, service: e.target.value})}>
                  {Object.entries(SERVICES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                </select>
              </label>
              <label style={{ marginTop: '20px' }}>Sarežģītības līmenis
                <select value={params.complexity} onChange={(e) => setParams({...params, complexity: e.target.value})}>
                  <option value="standard">Standarta (1-2 versijas)</option>
                  <option value="premium">Premium (Padziļināts + vairākas versijas)</option>
                </select>
              </label>
            </div>
          </section>
          <button onClick={handleCalculate} className="btn-primary" style={{ width: '100%', padding: '18px' }}>ĢENERĒT TĀMI</button>
        </div>
        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Dizaina Investīcija</h3>
            {!results ? <div className="empty-state">🎨 Izvēlieties pakalpojumu</div> : (
              <>
                <div className="grand-total-box">
                  <span className="gt-label">KOPĒJĀ SUMMA</span>
                  <span className="gt-value">{results.grandTotal.toFixed(0)} €</span>
                </div>
                <CalculatorLeadCta
                  calculatorId="digital-art"
                  calculatorTitle="Digitālā dizaina tāme"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Pakalpojums', value: SERVICES[params.service as keyof typeof SERVICES].name },
                    { label: 'Līmenis', value: params.complexity === 'premium' ? 'Premium' : 'Standarta' },
                  ]}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
