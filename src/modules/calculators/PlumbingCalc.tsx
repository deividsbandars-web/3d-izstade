import { useState } from 'react';
import { CalculatorLeadCta } from './CalculatorLeadCta';
import '../../components/calculator/styles/CalculatorPro.css';
import { COUNTRIES, renderCountryOptions } from '../../core/constants';

const PRICES = {
  units: {
    bathroom_full: { name: 'Pilns mezgls (WC + Izlietne + Duša)', mat: 450, work: 350 },
    wc_only: { name: 'WC un Izlietne', mat: 180, work: 120 },
    kitchen_sink: { name: 'Virtuves izvadi un pieslēgums', mat: 85, work: 95 },
    boiler_installation: { name: 'Boilera montāža (80-150L)', mat: 250, work: 150 },
  },
  pipes: {
    composite: { name: 'Daudzslāņu (Composite) caurules', price: 12 },
    copper: { name: 'Vara caurules (Lodējamās)', price: 28 },
    ppr: { name: 'Polipropilēna (Kausējamās)', price: 8 },
  }
};

export default function PlumbingCalc() {
  const [params, setParams] = useState({ country: 'lv', bathrooms: 1, pipeType: 'composite', kitchenPoints: 1 });
  const [results, setResults] = useState<any>(null);

  const handleCalculate = () => {
    const workMult = COUNTRIES[params.country as keyof typeof COUNTRIES].workMult;
    const matMult = COUNTRIES[params.country as keyof typeof COUNTRIES].matMult;
    
    const bathCost = (params.bathrooms * (PRICES.units.bathroom_full.mat + PRICES.units.bathroom_full.work)) * workMult;
    const kitchenCost = (params.kitchenPoints * (PRICES.units.kitchen_sink.mat + PRICES.units.kitchen_sink.work)) * workMult;
    const pipeCost = (PRICES.pipes[params.pipeType as keyof typeof PRICES.pipes].price * 50) * matMult; // Pieņemam vidēji 50m

    const grandTotal = bathCost + kitchenCost + pipeCost;
    setResults({ bathCost, kitchenCost, pipeCost, grandTotal });
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO Santehnikas Tāme</h1>
        <p>Ūdensvada un kanalizācijas mezglu izmaksu aprēķins.</p>
      </div>
      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>🌍 Parametri</h2>
            <div className="input-group">
              <label>Reģions
                <select name="country" value={params.country} onChange={(e) => setParams({...params, country: e.target.value})}>{renderCountryOptions()}</select>
              </label>
              <label style={{ marginTop: '20px' }}>Sanitāro mezglu skaits
                <input type="number" value={params.bathrooms} onChange={(e) => setParams({...params, bathrooms: parseInt(e.target.value)})} min="1" />
              </label>
              <label style={{ marginTop: '20px' }}>Cauruļvadu materiāls
                <select value={params.pipeType} onChange={(e) => setParams({...params, pipeType: e.target.value})}>
                  {Object.entries(PRICES.pipes).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                </select>
              </label>
            </div>
          </section>
          <button onClick={handleCalculate} className="btn-primary" style={{ width: '100%', padding: '18px' }}>ĢENERĒT TĀMI</button>
        </div>
        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Santehnikas Specifikācija</h3>
            {!results ? <div className="empty-state">🏘️ Norādiet mezglu skaitu</div> : (
              <>
                <div className="grand-total-box">
                  <span className="gt-label">KOPĒJĀ INVESTĪCIJA</span>
                  <span className="gt-value">{results.grandTotal.toFixed(0)} €</span>
                </div>
                <CalculatorLeadCta
                  calculatorId="plumbing"
                  calculatorTitle="Santehnikas tame"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Mezgli', value: String(params.bathrooms) },
                    { label: 'Virtuve', value: String(params.kitchenPoints) },
                    { label: 'Caurules', value: PRICES.pipes[params.pipeType as keyof typeof PRICES.pipes].name },
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
