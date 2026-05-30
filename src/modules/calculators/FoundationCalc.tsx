import { useState } from 'react';
import '../../components/calculator/styles/CalculatorPro.css';
import { COUNTRIES, renderCountryOptions } from '../../core/constants';
import { CalculatorLeadCta } from './CalculatorLeadCta';

const PRICES = {
  types: {
    strip: { name: 'Lentveida pamati', mat: 85, work: 120 },
    slab: { name: 'Siltinātā zviedru plātne', mat: 110, work: 95 },
    pile: { name: 'Pāļu pamati', mat: 145, work: 180 },
    block: { name: 'Fibo / betonbloku pamati', mat: 65, work: 85 },
  },
  earthworks: {
    excavation: { name: 'Tranšeju rakšana / bedres izstrāde', price: 15 },
    sand_fill: { name: 'Smilts / šķembu spilvens ar blīvēšanu', price: 28 },
    soil_removal: { name: 'Grunts izvešana', price: 12 },
  },
  insulation: {
    eps_100: { name: 'EPS 100 siltinājums (100mm)', price: 18 },
    xps: { name: 'XPS ekstrudētais putuplasts (100mm)', price: 28 },
    membrane: { name: 'Hidroizolācijas membrāna / bitumens', price: 12 },
  },
  concrete_m3: { name: 'Betons C25/30 ar sūkni', price: 135 },
  reinforcement_t: { name: 'Armatūra Ø10-12mm', price: 1250 },
} as const;

function formatEuro(value: number) {
  return `${Math.round(value).toLocaleString('lv-LV')} €`;
}

export default function FoundationCalc() {
  const [params, setParams] = useState({
    area: 100,
    country: 'lv',
    depth: 1.2,
    imageUrl: '',
    includeExcavation: true,
    includeInsulation: true,
    insulationType: 'xps',
    perimeter: 45,
    soilType: 'sand',
    type: 'slab',
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

    const typeRate = PRICES.types[params.type as keyof typeof PRICES.types];
    const unitValue = params.type === 'slab' ? params.area : params.perimeter;

    const structureCost = {
      mat: (unitValue * typeRate.mat) * matMult,
      work: (unitValue * typeRate.work) * workMult,
    };

    let earthworkCost = 0;
    if (params.includeExcavation) {
      const volume = params.perimeter * 0.6 * params.depth;
      earthworkCost = (volume * (PRICES.earthworks.excavation.price + PRICES.earthworks.sand_fill.price)) * workMult;
    }

    let insulationCost = 0;
    if (params.includeInsulation) {
      const insulationRate = PRICES.insulation[params.insulationType as keyof typeof PRICES.insulation];
      insulationCost = (params.area * insulationRate.price) * matMult;
    }

    const totalMat = structureCost.mat + insulationCost;
    const totalWork = structureCost.work + earthworkCost;
    const grandTotal = totalMat + totalWork;

    setResults({
      earthworkCost,
      grandTotal,
      imageUrl: params.imageUrl,
      insulationCost,
      structureCost,
      totalMat,
      totalWork,
    });
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO pamatu izbūves tāme</h1>
        <p>Nulles cikla aprēķins: zemes darbi, pamatu konstrukcija, siltināšana un hidroizolācija.</p>
      </div>

      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>Objekta ģeometrija</h2>
            <div className="input-group">
              <label>Reģions
                <select name="country" value={params.country} onChange={handleChange}>
                  {renderCountryOptions()}
                </select>
              </label>
              <div className="input-group-2" style={{ marginTop: '20px' }}>
                <label>Pamatnes platība (m²)
                  <input type="number" name="area" value={params.area} onChange={handleChange} min="10" />
                </label>
                <label>Perimetrs (m)
                  <input type="number" name="perimeter" value={params.perimeter} onChange={handleChange} min="10" />
                </label>
              </div>
            </div>
          </section>

          <section className="calc-section">
            <h2>Pamatu tips un dziļums</h2>
            <div className="input-group">
              <label>Konstrukcijas veids
                <select name="type" value={params.type} onChange={handleChange}>
                  {Object.entries(PRICES.types).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>
              <label style={{ marginTop: '20px' }}>Pamatu dziļums (m)
                <input type="number" name="depth" value={params.depth} onChange={handleChange} step="0.1" min="0.4" />
              </label>
            </div>
          </section>

          <section className="calc-section">
            <h2>Papildu darbi un siltināšana</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" name="includeExcavation" checked={params.includeExcavation} onChange={(event) => setParams({ ...params, includeExcavation: event.target.checked })} style={{ width: '20px', height: '20px', accentColor: '#3b82f6' }} />
                <span>Iekļaut zemes darbus un smilts/šķembu spilvenu</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="checkbox" name="includeInsulation" checked={params.includeInsulation} onChange={(event) => setParams({ ...params, includeInsulation: event.target.checked })} style={{ width: '20px', height: '20px', accentColor: '#3b82f6' }} />
                <span>Iekļaut pamatu siltināšanu</span>
              </label>
              {params.includeInsulation && (
                <div style={{ paddingLeft: '32px' }}>
                  <select name="insulationType" value={params.insulationType} onChange={handleChange}>
                    {Object.entries(PRICES.insulation).map(([key, value]) => (
                      <option key={key} value={key}>{value.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </section>

          <section className="calc-section">
            <h2>Grunts plāns / foto</h2>
            <div className="input-group">
              <label>Objekta foto vai ģeodēzija (URL)
                <input type="text" name="imageUrl" value={params.imageUrl} onChange={handleChange} placeholder="https://..." />
              </label>
            </div>
          </section>

          <button onClick={handleCalculate} className="btn-primary" style={{ width: '100%', padding: '18px', fontSize: '1.1rem' }}>
            Ģenerēt pamatu tāmi
          </button>
        </div>

        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Nulles cikla specifikācija</h3>

            {!results ? (
              <div className="empty-state">
                <div className="empty-state-icon">▰</div>
                <p>Norādi ēkas perimetru, platību un pamatu tipu.</p>
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
                  Tips: <strong>{PRICES.types[params.type as keyof typeof PRICES.types].name}</strong><br />
                  Platība: <strong>{params.area} m²</strong> | Dziļums: <strong>{params.depth} m</strong>
                </div>

                {results.imageUrl && (
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', marginBottom: '25px' }}>
                    <img src={results.imageUrl} style={{ width: '100%', display: 'block' }} alt="Grunts plāns" />
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
                      <td>Pamatu konstrukcija</td>
                      <td>{formatEuro(results.structureCost.mat)}</td>
                      <td>{formatEuro(results.structureCost.work)}</td>
                    </tr>
                    {params.includeExcavation && (
                      <tr>
                        <td>Zemes darbi un spilvens</td>
                        <td>{formatEuro(0)}</td>
                        <td>{formatEuro(results.earthworkCost)}</td>
                      </tr>
                    )}
                    {params.includeInsulation && (
                      <tr>
                        <td>Siltināšana ({params.insulationType.toUpperCase()})</td>
                        <td>{formatEuro(results.insulationCost)}</td>
                        <td>{formatEuro(0)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="grand-total-box">
                  <span className="gt-label">Pamatu izbūves investīcija</span>
                  <span className="gt-value">{formatEuro(results.grandTotal)}</span>
                  <span className="gt-subtext">Gala piedāvājumam vajag grunts apstākļu un projekta mezglu pārbaudi.</span>
                </div>

                <CalculatorLeadCta
                  calculatorId="foundation"
                  calculatorTitle="Pamatu izbūves tāme"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Pamatu tips', value: PRICES.types[params.type as keyof typeof PRICES.types].name },
                    { label: 'Platība', value: `${params.area} m²` },
                    { label: 'Perimetrs', value: `${params.perimeter} m` },
                    { label: 'Siltināšana', value: params.includeInsulation ? PRICES.insulation[params.insulationType as keyof typeof PRICES.insulation].name : 'Nav iekļauta' },
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
