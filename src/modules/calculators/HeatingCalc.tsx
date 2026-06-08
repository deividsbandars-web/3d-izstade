import { useState } from 'react';
import '../../components/calculator/styles/CalculatorPro.css';
import { COUNTRIES, renderCountryOptions } from '../../core/constants';
import { CalculatorLeadCta } from './CalculatorLeadCta';

const PRICES = {
  sources: {
    air_water: { name: 'Gaiss-ūdens siltumsūknis (Panasonic/Daikin)', mat: 6500, work: 1200 },
    ground_source: { name: 'Ģeotermālais zemes siltumsūknis', mat: 9500, work: 4500 },
    gas_boiler: { name: 'Gāzes kondensācijas katls', mat: 1800, work: 600 },
    pellet_boiler: { name: 'Automātiskais granulu katls', mat: 3800, work: 1200 },
  },
  distribution: {
    underfloor: { name: 'Siltās grīdas ar kolektoru', mat: 22, work: 18 },
    radiators: { name: 'Radiatoru sistēma', mat: 15, work: 12 },
    industrial: { name: 'Kaloriferi / gaisa sildītāji', mat: 8, work: 5 },
  },
  add_ons: {
    automation: { name: 'Viedā vadība (Smart Home / WiFi)', price: 850 },
    buffer_tank: { name: 'Akumulācijas tvertne (500-1000L)', price: 1200 },
    solar_ready: { name: 'Saules kolektoru sagatave', price: 450 },
  },
} as const;

function formatEuro(value: number) {
  return `${Math.round(value).toLocaleString('lv-LV')} €`;
}

export default function HeatingCalc() {
  const [params, setParams] = useState({
    area: 120,
    country: 'lv',
    distType: 'underfloor',
    floors: 1,
    imageUrl: '',
    includeAutomation: true,
    includeBuffer: false,
    includeSolar: false,
    sourceType: 'air_water',
  });

  const [results, setResults] = useState<any>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    setParams((current) => ({
      ...current,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleCalculate = () => {
    const country = COUNTRIES[params.country as keyof typeof COUNTRIES] ?? COUNTRIES.lv;
    const workMult = country.workMult;
    const matMult = country.matMult;

    const sourceRate = PRICES.sources[params.sourceType as keyof typeof PRICES.sources];
    const sourceCost = {
      mat: sourceRate.mat * matMult,
      work: sourceRate.work * workMult,
    };

    const distRate = PRICES.distribution[params.distType as keyof typeof PRICES.distribution];
    const distCost = {
      mat: (params.area * distRate.mat) * matMult,
      work: (params.area * distRate.work) * workMult,
    };

    let extrasCost = 0;
    if (params.includeAutomation) extrasCost += PRICES.add_ons.automation.price * matMult;
    if (params.includeBuffer) extrasCost += PRICES.add_ons.buffer_tank.price * matMult;
    if (params.includeSolar) extrasCost += PRICES.add_ons.solar_ready.price * matMult;

    const totalMat = sourceCost.mat + distCost.mat + extrasCost;
    const totalWork = sourceCost.work + distCost.work;
    const grandTotal = totalMat + totalWork;

    setResults({
      distCost,
      extrasCost,
      grandTotal,
      imageUrl: params.imageUrl,
      sourceCost,
      totalMat,
      totalWork,
    });
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO apkures sistēmas tāme</h1>
        <p>Siltumsūkņu, radiatoru, silto grīdu un automatizācijas sākotnējais budžeta aprēķins.</p>
      </div>

      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>Siltumtehnikas parametri</h2>
            <div className="input-group">
              <label>Reģions
                <select name="country" value={params.country} onChange={handleChange}>
                  {renderCountryOptions()}
                </select>
              </label>
              <div className="input-group-2" style={{ marginTop: '20px' }}>
                <label>Apkurināmā platība (m²)
                  <input type="number" name="area" value={params.area} onChange={handleChange} min="10" />
                </label>
                <label>Stāvu skaits
                  <input type="number" name="floors" value={params.floors} onChange={handleChange} min="1" />
                </label>
              </div>
            </div>
          </section>

          <section className="calc-section">
            <h2>Siltuma avots un sadale</h2>
            <div className="input-group">
              <label>Apkures iekārta
                <select name="sourceType" value={params.sourceType} onChange={handleChange}>
                  {Object.entries(PRICES.sources).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>
              <label style={{ marginTop: '20px' }}>Siltuma sadales veids
                <select name="distType" value={params.distType} onChange={handleChange}>
                  {Object.entries(PRICES.distribution).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="calc-section">
            <h2>Komforta un efektivitātes opcijas</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" name="includeAutomation" checked={params.includeAutomation} onChange={(event) => setParams({ ...params, includeAutomation: event.target.checked })} style={{ width: '20px', height: '20px', accentColor: '#3b82f6' }} />
                <span>Viedā telpu vadība un WiFi termostati</span>
              </label>
              <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" name="includeBuffer" checked={params.includeBuffer} onChange={(event) => setParams({ ...params, includeBuffer: event.target.checked })} style={{ width: '20px', height: '20px', accentColor: '#3b82f6' }} />
                <span>Akumulācijas tvertne sistēmai</span>
              </label>
              <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" name="includeSolar" checked={params.includeSolar} onChange={(event) => setParams({ ...params, includeSolar: event.target.checked })} style={{ width: '20px', height: '20px', accentColor: '#3b82f6' }} />
                <span>Saules kolektoru pieslēguma sagatave</span>
              </label>
            </div>
          </section>

          <section className="calc-section">
            <h2>Objekta vizualizācija</h2>
            <div className="input-group">
              <label>Pievienot ēkas plānu vai bildi (URL)
                <input type="text" name="imageUrl" value={params.imageUrl} onChange={handleChange} placeholder="https://..." />
              </label>
            </div>
          </section>

          <button onClick={handleCalculate} className="btn-primary" style={{ width: '100%', padding: '18px', fontSize: '1.1rem' }}>
            Aprēķināt apkures investīciju
          </button>
        </div>

        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Apkures tāmes detalizācija</h3>

            {!results ? (
              <div className="empty-state">
                <div className="empty-state-icon">⌁</div>
                <p>Izvēlies platību un siltuma avotu.</p>
              </div>
            ) : (
              <>
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '16px',
                  color: '#fff',
                  marginBottom: '25px',
                  padding: '20px',
                }}>
                  Platība: <strong>{params.area} m²</strong> | Avots: <strong>{PRICES.sources[params.sourceType as keyof typeof PRICES.sources].name}</strong>
                </div>

                {results.imageUrl && (
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', marginBottom: '25px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={results.imageUrl} style={{ width: '100%', display: 'block', transition: 'transform 0.3s' }} alt="Objekta plāns" />
                  </div>
                )}

                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Pozīcija</th>
                      <th>Materiāli</th>
                      <th>Darbs</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Siltuma avota mezgls</td>
                      <td>{formatEuro(results.sourceCost.mat)}</td>
                      <td>{formatEuro(results.sourceCost.work)}</td>
                    </tr>
                    <tr>
                      <td>Siltuma sadales tīkli</td>
                      <td>{formatEuro(results.distCost.mat)}</td>
                      <td>{formatEuro(results.distCost.work)}</td>
                    </tr>
                    <tr>
                      <td>Automātika un papildaprīkojums</td>
                      <td>{formatEuro(results.extrasCost)}</td>
                      <td>{formatEuro(0)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="grand-total-box">
                  <span className="gt-label">Apkures projekta investīcija</span>
                  <span className="gt-value">{formatEuro(results.grandTotal)}</span>
                  <span className="gt-subtext">Gala piedāvājumam jāprecizē siltuma zudumi, jaudas aprēķins un montāžas apstākļi.</span>
                </div>

                <CalculatorLeadCta
                  calculatorId="heating"
                  calculatorTitle="Apkures sistēmas tāme"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Platība', value: `${params.area} m²` },
                    { label: 'Siltuma avots', value: PRICES.sources[params.sourceType as keyof typeof PRICES.sources].name },
                    { label: 'Sadale', value: PRICES.distribution[params.distType as keyof typeof PRICES.distribution].name },
                    { label: 'Automātika', value: params.includeAutomation ? 'Iekļauta' : 'Nav iekļauta' },
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
