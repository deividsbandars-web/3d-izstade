import { useState } from 'react';
import { CalculatorLeadCta } from './CalculatorLeadCta';
import '../../components/calculator/styles/CalculatorPro.css';

const SERVICES = {
  arch_ext: { name: 'Arhitektūras eksterjera vizualizācija', price: 450 },
  interior: { name: 'Interjera 3D vizualizācija (viena telpa)', price: 250 },
  product: { name: 'Produkta 3D modelēšana un renderēšana', price: 180 },
  walkthrough: { name: '3D Video animācija / Pastaiga', price: 1200 },
};

export default function VisualsCalc() {
  const [params, setParams] = useState({ service: 'arch_ext', count: 1 });
  const [results, setResults] = useState<any>(null);

  const handleCalculate = () => {
    const base = SERVICES[params.service as keyof typeof SERVICES].price * params.count;
    setResults({ grandTotal: base });
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO 3D Vizuāļu Kalkulators</h1>
        <p>Arhitektūras un produktu vizualizāciju aprēķins.</p>
      </div>
      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>📸 Projekta izvēle</h2>
            <div className="input-group">
              <label>Pakalpojums
                <select value={params.service} onChange={(e) => setParams({...params, service: e.target.value})}>
                  {Object.entries(SERVICES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                </select>
              </label>
              <label style={{ marginTop: '20px' }}>Skaits / Apjoms
                <input type="number" value={params.count} onChange={(e) => setParams({...params, count: parseInt(e.target.value)})} min="1" />
              </label>
            </div>
          </section>
          <button onClick={handleCalculate} className="btn-primary" style={{ width: '100%', padding: '18px' }}>APRĒĶINĀT PROJEKTU</button>
        </div>
        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Vizuāļu Tāme</h3>
            {!results ? <div className="empty-state">📸 Izvēlieties pakalpojumu</div> : (
              <>
                <div className="grand-total-box">
                  <span className="gt-label">INVESTĪCIJA DIZAINĀ</span>
                  <span className="gt-value">{results.grandTotal.toFixed(0)} €</span>
                </div>
                <CalculatorLeadCta
                  calculatorId="visuals"
                  calculatorTitle="3D vizuāļu tāme"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Pakalpojums', value: SERVICES[params.service as keyof typeof SERVICES].name },
                    { label: 'Apjoms', value: String(params.count) },
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
