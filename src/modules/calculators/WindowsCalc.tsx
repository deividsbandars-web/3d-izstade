import { useState } from 'react';
import { CalculatorLeadCta } from './CalculatorLeadCta';
import '../../components/calculator/styles/CalculatorPro.css';
import { COUNTRIES, renderCountryOptions } from '../../core/constants';

const PRICES = {
  types: {
    pvc_3layer: { name: 'PVC 3-stiklu (A-Klase)', price: 280 },
    pvc_2layer: { name: 'PVC 2-stiklu (Standarta)', price: 190 },
    wood_premium: { name: 'Koka logi (Līmētais koks)', price: 450 },
    aluminum: { name: 'Alumīnija konstrukcijas', price: 650 },
  },
  extras: {
    installation: { name: 'Montāža + Palodzes', price: 85 },
    disposal: { name: 'Demontāža + Izvešana', price: 45 },
  }
};

export default function WindowsCalc() {
  const [params, setParams] = useState({ country: 'lv', windowCount: 5, type: 'pvc_3layer', includeInstallation: true });
  const [results, setResults] = useState<any>(null);

  const handleCalculate = () => {
    const workMult = COUNTRIES[params.country as keyof typeof COUNTRIES].workMult;
    const matMult = COUNTRIES[params.country as keyof typeof COUNTRIES].matMult;
    
    const basePrice = (params.windowCount * PRICES.types[params.type as keyof typeof PRICES.types].price) * matMult;
    const installPrice = params.includeInstallation ? (params.windowCount * PRICES.extras.installation.price) * workMult : 0;

    const grandTotal = basePrice + installPrice;
    setResults({ basePrice, installPrice, grandTotal });
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO Logu un Durvju Tāme</h1>
        <p>PVC, koka un alumīnija konstrukciju aprēķins.</p>
      </div>
      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>🪟 Logu parametri</h2>
            <div className="input-group">
              <label>Reģions
                <select value={params.country} onChange={(e) => setParams({...params, country: e.target.value})}>{renderCountryOptions()}</select>
              </label>
              <label style={{ marginTop: '20px' }}>Logu skaits (Vidēji 1.5x1.5m)
                <input type="number" value={params.windowCount} onChange={(e) => setParams({...params, windowCount: parseInt(e.target.value)})} min="1" />
              </label>
              <label style={{ marginTop: '20px' }}>Profila tips
                <select value={params.type} onChange={(e) => setParams({...params, type: e.target.value})}>
                  {Object.entries(PRICES.types).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                </select>
              </label>
            </div>
          </section>
          <button onClick={handleCalculate} className="btn-primary" style={{ width: '100%', padding: '18px' }}>ĢENERĒT TĀMI</button>
        </div>
        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Konstrukciju Tāme</h3>
            {!results ? <div className="empty-state">🪟 Norādiet logu skaitu</div> : (
              <>
                <div className="grand-total-box">
                  <span className="gt-label">KOPĒJĀ SUMMA</span>
                  <span className="gt-value">{results.grandTotal.toFixed(0)} €</span>
                </div>
                <CalculatorLeadCta
                  calculatorId="windows"
                  calculatorTitle="Logi un durvis"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Logi', value: String(params.windowCount) },
                    { label: 'Profils', value: PRICES.types[params.type as keyof typeof PRICES.types].name },
                    { label: 'Montāža', value: params.includeInstallation ? 'Iekļauta' : 'Bez montāžas' },
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
