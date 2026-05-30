import { useState } from 'react';
import { CalculatorLeadCta } from './CalculatorLeadCta';
import '../../components/calculator/styles/CalculatorPro.css';
import { COUNTRIES, renderCountryOptions } from '../../core/constants';

const RATES = {
  frame_only: { name: 'Tikai karkass (Sagatavots)', price: 180 },
  insulated: { name: 'Siltināts karkass (Vate + Plēves)', price: 320 },
  full_finish: { name: 'Pilna apdare (Fasāde + Iekšdarbi)', price: 850 },
};

export default function TimberHouseCalc() {
  const [params, setParams] = useState({ country: 'lv', area: 80, type: 'insulated' });
  const [results, setResults] = useState<any>(null);

  const handleCalculate = () => {
    const matMult = COUNTRIES[params.country as keyof typeof COUNTRIES].matMult;
    const base = (params.area * RATES[params.type as keyof typeof RATES].price) * matMult;
    setResults({ grandTotal: base });
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO Koka Karkasa Mājas</h1>
        <p>Materiālu un konstrukciju aprēķins koka mājām.</p>
      </div>
      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>🌲 Mājas parametri</h2>
            <div className="input-group">
              <label>Reģions
                <select value={params.country} onChange={(e) => setParams({...params, country: e.target.value})}>{renderCountryOptions()}</select>
              </label>
              <label style={{ marginTop: '20px' }}>Kopējā platība (m²)
                <input type="number" value={params.area} onChange={(e) => setParams({...params, area: parseInt(e.target.value)})} min="20" />
              </label>
              <label style={{ marginTop: '20px' }}>Konstrukcijas tips
                <select value={params.type} onChange={(e) => setParams({...params, type: e.target.value})}>
                  {Object.entries(RATES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                </select>
              </label>
            </div>
          </section>
          <button onClick={handleCalculate} className="btn-primary" style={{ width: '100%', padding: '18px' }}>APRĒĶINĀT KONSTRUKCIJU</button>
        </div>
        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Būvniecības Tāme</h3>
            {!results ? <div className="empty-state">🌲 Norādiet platību</div> : (
              <>
                <div className="grand-total-box">
                  <span className="gt-label">PROGNOZĒTĀS IZMAKSAS</span>
                  <span className="gt-value">{results.grandTotal.toFixed(0)} €</span>
                </div>
                <CalculatorLeadCta
                  calculatorId="timber"
                  calculatorTitle="Koka karkasa tāme"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Platība', value: String(params.area) + ' m²' },
                    { label: 'Tips', value: RATES[params.type as keyof typeof RATES].name },
                    { label: 'Reģions', value: params.country.toUpperCase() },
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
