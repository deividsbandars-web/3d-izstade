import { useState } from 'react';
import { CalculatorLeadCta } from './CalculatorLeadCta';
import '../../components/calculator/styles/CalculatorPro.css';

const SERVICES = {
  electric: { name: 'Elektriķis (Izsaukums + 1h)', price: 45 },
  plumbing: { name: 'Santehniķis (Noplūdes novēršana)', price: 55 },
  locks: { name: 'Atslēgu serviss / Durvju remonts', price: 65 },
  furniture: { name: 'Mēbeļu montāža (h)', price: 25 },
};

export default function QuickFixCalc() {
  const [params, setParams] = useState({ service: 'electric', hours: 1 });
  const [results, setResults] = useState<any>(null);

  const handleCalculate = () => {
    const base = SERVICES[params.service as keyof typeof SERVICES].price;
    const grandTotal = base + (params.hours > 1 ? (params.hours - 1) * 25 : 0);
    setResults({ grandTotal });
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO Saimnieka Palīgs</h1>
        <p>Sīkie remontdarbi un steidzamie izsaukumi.</p>
      </div>
      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>🛠️ Nepieciešamā palīdzība</h2>
            <div className="input-group">
              <label>Pakalpojums
                <select value={params.service} onChange={(e) => setParams({...params, service: e.target.value})}>
                  {Object.entries(SERVICES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                </select>
              </label>
              <label style={{ marginTop: '20px' }}>Plānotais laiks (stundās)
                <input type="number" value={params.hours} onChange={(e) => setParams({...params, hours: parseInt(e.target.value)})} min="1" />
              </label>
            </div>
          </section>
          <button onClick={handleCalculate} className="btn-primary" style={{ width: '100%', padding: '18px' }}>APRĒĶINĀT IZMAKSAS</button>
        </div>
        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Izsaukuma Tāme</h3>
            {!results ? <div className="empty-state">🛠️ Izvēlieties speciālistu</div> : (
              <>
                <div className="grand-total-box">
                  <span className="gt-label">FIKSĒTĀ SUMMA</span>
                  <span className="gt-value">{results.grandTotal.toFixed(0)} €</span>
                </div>
                <CalculatorLeadCta
                  calculatorId="quick-fix"
                  calculatorTitle="Saimnieka palīga tāme"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Pakalpojums', value: SERVICES[params.service as keyof typeof SERVICES].name },
                    { label: 'Stundas', value: String(params.hours) },
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
