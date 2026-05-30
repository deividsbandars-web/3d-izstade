import { useState } from 'react';
import { CalculatorLeadCta } from './CalculatorLeadCta';
import '../../components/calculator/styles/CalculatorPro.css';

const SERVICES = {
  maintenance: { name: 'Eļļas un filtru maiņa (Full Service)', price: 120 },
  brakes: { name: 'Bremžu disku un kluču maiņa (Ass)', price: 180 },
  suspension: { name: 'Ritošās daļas remonts (Sarežģīts)', price: 250 },
  diagnostics: { name: 'Datoru diagnostika un kļūdu dzēšana', price: 45 },
};

export default function AutoserviceCalc() {
  const [params, setParams] = useState({ service: 'maintenance', carAge: '2015-2020', urgency: 'normal' });
  const [results, setResults] = useState<any>(null);

  const handleCalculate = () => {
    const base = SERVICES[params.service as keyof typeof SERVICES].price;
    const mult = params.urgency === 'express' ? 1.5 : 1.0;
    const grandTotal = base * mult;
    setResults({ grandTotal });
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO Auto Servisa Kalkulators</h1>
        <p>Remonta darbu un apkopes izmaksu tāme.</p>
      </div>
      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>🚗 Pakalpojuma izvēle</h2>
            <div className="input-group">
              <label>Izvēlieties darbu
                <select value={params.service} onChange={(e) => setParams({...params, service: e.target.value})}>
                  {Object.entries(SERVICES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                </select>
              </label>
              <label style={{ marginTop: '20px' }}>Steidzamība
                <select value={params.urgency} onChange={(e) => setParams({...params, urgency: e.target.value})}>
                  <option value="normal">Standarta (1-3 dienas)</option>
                  <option value="express">Ekspress (Šodien) +50%</option>
                </select>
              </label>
            </div>
          </section>
          <button onClick={handleCalculate} className="btn-primary" style={{ width: '100%', padding: '18px' }}>APRĒĶINĀT REMONTU</button>
        </div>
        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Servisa Tāme</h3>
            {!results ? <div className="empty-state">🚗 Izvēlieties pakalpojumu</div> : (
              <>
                <div className="grand-total-box">
                  <span className="gt-label">PROGNOZĒTĀ SUMMA</span>
                  <span className="gt-value">{results.grandTotal.toFixed(0)} €</span>
                </div>
                <CalculatorLeadCta
                  calculatorId="autoservice"
                  calculatorTitle="Auto servisa tame"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Darbs', value: SERVICES[params.service as keyof typeof SERVICES].name },
                    { label: 'Steidzamiba', value: params.urgency },
                    { label: 'Auto gads', value: params.carAge },
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
