import { useState } from 'react';
import '../../components/calculator/styles/CalculatorPro.css';
import { renderCountryOptions } from '../../core/constants';
import {
  HEATING_ADD_ONS,
  HEATING_DISTRIBUTION_TYPES,
  HEATING_SOURCES,
  type HeatingCalculatorInput,
  type HeatingCalculatorResult,
  calculateHeatingEstimate
} from '../../services/calculators/heating';

type HeatingCalculatorFormState = HeatingCalculatorInput & {
  imageUrl: string;
};

const INITIAL_STATE: HeatingCalculatorFormState = {
  country: 'lv',
  area: 120,
  sourceType: 'air_water',
  distType: 'underfloor',
  includeAutomation: true,
  includeBuffer: false,
  includeSolar: false,
  floors: 1,
  imageUrl: ''
};

export default function HeatingCalc() {
  const [params, setParams] = useState<HeatingCalculatorFormState>(INITIAL_STATE);
  const [results, setResults] = useState<HeatingCalculatorResult | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCalculate = () => {
    const { imageUrl: _imageUrl, ...input } = params;
    setResults(calculateHeatingEstimate(input));
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO Apkures Sistemu Tame</h1>
        <p>Pilns energioefektivitates aprekiņs siltumsukniem, siltajam gridam un automatizacijai.</p>
      </div>

      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>Siltumtehnikas parametri</h2>
            <div className="input-group">
              <label>Regions
                <select name="country" value={params.country} onChange={handleChange}>
                  {renderCountryOptions()}
                </select>
              </label>
              <div className="input-group-2" style={{ marginTop: '20px' }}>
                <label>Apkurinama platiba (m2)
                  <input type="number" name="area" value={params.area} onChange={handleChange} min="10" />
                </label>
                <label>Stavu skaits
                  <input type="number" name="floors" value={params.floors} onChange={handleChange} min="1" />
                </label>
              </div>
            </div>
          </section>

          <section className="calc-section">
            <h2>Siltuma avots un sadale</h2>
            <div className="input-group">
              <label>Apkures iekarta
                <select name="sourceType" value={params.sourceType} onChange={handleChange}>
                  {Object.entries(HEATING_SOURCES).map(([key, option]) => (
                    <option key={key} value={key}>{option.name}</option>
                  ))}
                </select>
              </label>
              <label style={{ marginTop: '20px' }}>Siltuma sadales veids
                <select name="distType" value={params.distType} onChange={handleChange}>
                  {Object.entries(HEATING_DISTRIBUTION_TYPES).map(([key, option]) => (
                    <option key={key} value={key}>{option.name}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="calc-section">
            <h2>Komforta un efektivitates opcijas</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" name="includeAutomation" checked={params.includeAutomation} onChange={(e) => setParams({ ...params, includeAutomation: e.target.checked })} style={{ width: '20px', height: '20px', accentColor: '#3b82f6' }} />
                <span>{HEATING_ADD_ONS.automation.name}</span>
              </label>
              <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" name="includeBuffer" checked={params.includeBuffer} onChange={(e) => setParams({ ...params, includeBuffer: e.target.checked })} style={{ width: '20px', height: '20px', accentColor: '#3b82f6' }} />
                <span>{HEATING_ADD_ONS.buffer_tank.name}</span>
              </label>
              <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" name="includeSolar" checked={params.includeSolar} onChange={(e) => setParams({ ...params, includeSolar: e.target.checked })} style={{ width: '20px', height: '20px', accentColor: '#3b82f6' }} />
                <span>{HEATING_ADD_ONS.solar_ready.name}</span>
              </label>
            </div>
          </section>

          <section className="calc-section">
            <h2>Objekta vizualizacija</h2>
            <div className="input-group">
              <label>Pievienot ekas planu vai bildi (URL)
                <input type="text" name="imageUrl" value={params.imageUrl} onChange={handleChange} placeholder="https://images.unsplash.com/photo-1518005020480-309a9a0b232c" />
              </label>
            </div>
          </section>

          <button onClick={handleCalculate} className="btn-primary" style={{ width: '100%', padding: '18px', fontSize: '1.1rem' }}>
            Aprekinat sistemas investiciju
          </button>
        </div>

        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Apkures tames detalizacija</h3>

            {!results ? (
              <div className="empty-state">
                <div className="empty-state-icon">S</div>
                <p>Izvelieties platibu un siltuma avotu</p>
              </div>
            ) : (
              <>
                <div style={{
                  marginBottom: '25px', padding: '20px', background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#fff'
                }}>
                  Platiba: <strong>{params.area} m2</strong> | Avots: <strong>{HEATING_SOURCES[params.sourceType].name}</strong>
                </div>

                {params.imageUrl && (
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', marginBottom: '25px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={params.imageUrl} style={{ width: '100%', display: 'block', transition: 'transform 0.3s' }} alt="Plans" />
                  </div>
                )}

                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Pozicija</th>
                      <th>Mat.</th>
                      <th>Darbs</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Siltuma avota mezgls</td>
                      <td>{results.sourceCost.materials.toFixed(0)} EUR</td>
                      <td>{results.sourceCost.labor.toFixed(0)} EUR</td>
                    </tr>
                    <tr>
                      <td>Siltuma sadales tikli</td>
                      <td>{results.distributionCost.materials.toFixed(0)} EUR</td>
                      <td>{results.distributionCost.labor.toFixed(0)} EUR</td>
                    </tr>
                    <tr>
                      <td>Papildopcijas</td>
                      <td>{results.extrasCost.toFixed(0)} EUR</td>
                      <td>0 EUR</td>
                    </tr>
                  </tbody>
                </table>

                <div className="grand-total-box">
                  <span className="gt-label">Apkures projekta investicija</span>
                  <span className="gt-value">{results.grandTotal.toFixed(0)} EUR</span>
                  <span className="gt-subtext">Summa ieklauta palaisana, regulesana un garantija.</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '25px' }}>
                  <button className="btn-glass" style={{ justifyContent: 'center' }}>PDF Eksports</button>
                  <button className="btn-glass" style={{ justifyContent: 'center', borderColor: 'var(--accent-blue)' }}>Konsultacija</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
