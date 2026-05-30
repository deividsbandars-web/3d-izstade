import { useState } from 'react';
import { CalculatorLeadCta } from './CalculatorLeadCta';
import '../../components/calculator/styles/CalculatorPro.css';

const RATES = {
  general: { name: 'Ģenerālā uzkopšana', price: 2.50 },
  after_const: { name: 'Pēc-būvniecības uzkopšana', price: 4.80 },
  windows: { name: 'Logu mazgāšana (m2)', price: 3.50 },
  industrial: { name: 'Noliktavu / Ražotņu uzkopšana', price: 1.20 },
};

export default function CleaningCalc() {
  const [params, setParams] = useState({ type: 'general', area: 50, frequency: 'once' });
  const [results, setResults] = useState<any>(null);

  const handleCalculate = () => {
    const base = RATES[params.type as keyof typeof RATES].price * params.area;
    const mult = params.frequency === 'weekly' ? 0.8 : 1.0;
    const grandTotal = base * mult;
    setResults({ grandTotal });
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO Uzkopšanas Servisa Tāme</h1>
        <p>Profesionālā telpu un teritoriju uzkopšana.</p>
      </div>
      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>🧹 Objekta parametri</h2>
            <div className="input-group">
              <label>Uzkopšanas veids
                <select value={params.type} onChange={(e) => setParams({...params, type: e.target.value})}>
                  {Object.entries(RATES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                </select>
              </label>
              <label style={{ marginTop: '20px' }}>Platība (m²)
                <input type="number" value={params.area} onChange={(e) => setParams({...params, area: parseInt(e.target.value)})} min="10" />
              </label>
            </div>
          </section>
          <button onClick={handleCalculate} className="btn-primary" style={{ width: '100%', padding: '18px' }}>ĢENERĒT TĀMI</button>
        </div>
        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Uzkopšanas Specifikācija</h3>
            {!results ? <div className="empty-state">🧹 Norādiet platību</div> : (
              <>
                <div className="grand-total-box">
                  <span className="gt-label">KOPĒJĀS IZMAKSAS</span>
                  <span className="gt-value">{results.grandTotal.toFixed(0)} €</span>
                </div>
                <CalculatorLeadCta
                  calculatorId="cleaning"
                  calculatorTitle="Uzkopsanas tame"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Veids', value: RATES[params.type as keyof typeof RATES].name },
                    { label: 'Platiba', value: String(params.area) + ' m2' },
                    { label: 'Biezums', value: params.frequency },
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
