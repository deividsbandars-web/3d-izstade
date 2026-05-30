import { useState } from 'react';
import '../../components/calculator/styles/CalculatorPro.css';
import { COUNTRIES, renderCountryOptions } from '../../core/constants';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { CalculatorLeadCta } from './CalculatorLeadCta';

const PRICES = {
  materials: {
    metal: { name: 'Metāla dakstiņš (Ruukki)', matPrice: 15, workPrice: 12, overlapMult: 1.15 },
    bitumen: { name: 'Bitumena šindelis', matPrice: 12, workPrice: 15, overlapMult: 1.05 },
    clay: { name: 'Māla dakstiņš (Monier)', matPrice: 28, workPrice: 25, overlapMult: 1.05 },
    slate: { name: 'Bezazbesta šīferis (Eternit)', matPrice: 18, workPrice: 14, overlapMult: 1.15 },
    standing_seam: { name: 'Valcprofils (Classic)', matPrice: 22, workPrice: 20, overlapMult: 1.1 },
  },
  accessories: {
    wind_film: { name: 'Pretvēja izolācijas plēve', matPrice: 1.5, workPrice: 1 },
    fasteners_metal: { matPrice: 0.8 },
    fasteners_clay: { matPrice: 1.5 },
    ridge: { name: 'Kores elementi', matPrice: 12, workPrice: 5 },
    eaves: { name: 'Vējmalas / karnīzes', matPrice: 8, workPrice: 4 },
  },
  lumber: {
    rafters: { name: 'Spāres (50x200mm)', matPrice: 4.5, workPrice: 5 },
    battens: { name: 'Latojums (50x50mm)', matPrice: 1.2, workPrice: 1.5 },
    counter_battens: { name: 'Pretlatojums (25x50mm)', matPrice: 0.8, workPrice: 1 },
  },
  gutters: {
    pvc: { name: 'Plastmasas renes un notekas', matPrice: 9, workPrice: 6 },
    metal: { name: 'Cinkota metāla renes (Ruukki)', matPrice: 16, workPrice: 8 },
    hidden: { name: 'Iebūvēta sistēma (slēptā)', matPrice: 45, workPrice: 25 },
  },
} as const;

type RoofMaterialId = keyof typeof PRICES.materials;
type RoofType = 'flat' | 'gable' | 'hip';
type GutterMaterialId = keyof typeof PRICES.gutters;

type RoofParams = {
  country: string;
  gutterMaterial: GutterMaterialId;
  houseArea: number;
  includeGutters: boolean;
  includeTimber: boolean;
  material: RoofMaterialId;
  overhang: number;
  pitch: number;
  roofType: RoofType;
};

type RoofResults = {
  coverCost: { mat: number; work: number };
  geom: {
    battensLength: number;
    eavesLength: number;
    raftersLength: number;
    ridgeLength: number;
    roofAreaGross: number;
    roofAreaNet: number;
  };
  grandTotal: number;
  guttersCost: { mat: number; work: number };
  timberCost: { mat: number; work: number };
  totalMat: number;
  totalWork: number;
  trimsCost: { mat: number; work: number };
};

const INITIAL_ROOF_PARAMS: RoofParams = {
  country: 'lv',
  gutterMaterial: 'metal',
  houseArea: 100,
  includeGutters: true,
  includeTimber: true,
  material: 'metal',
  overhang: 0.6,
  pitch: 30,
  roofType: 'gable',
};

function formatEuro(value: number) {
  return `${Math.round(value).toLocaleString('lv-LV')} €`;
}

export default function RoofCalc() {
  const [params, setParams] = useLocalStorage<RoofParams>('calc_params_roof', INITIAL_ROOF_PARAMS);
  const [results, setResults] = useState<RoofResults | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    let finalValue: boolean | number | string = value;

    if (type === 'checkbox') {
      finalValue = (event.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      finalValue = parseFloat(value) || 0;
    }

    setParams((current) => ({ ...current, [name]: finalValue }));
  };

  const handleCalculate = () => {
    const country = COUNTRIES[params.country as keyof typeof COUNTRIES] ?? COUNTRIES.lv;
    const workMult = country.workMult;
    const matMult = country.matMult;

    const side = Math.sqrt(params.houseArea);
    const sideWithOverhang = side + (params.overhang * 2);
    const pitchRad = params.pitch * (Math.PI / 180);
    let roofAreaNet = 0;
    let ridgeLength = 0;
    let eavesLength = 0;
    let gableEndsLength = 0;

    if (params.roofType === 'gable') {
      roofAreaNet = (sideWithOverhang * sideWithOverhang) / Math.cos(pitchRad);
      ridgeLength = sideWithOverhang;
      eavesLength = sideWithOverhang * 2;
      gableEndsLength = (sideWithOverhang / Math.cos(pitchRad)) * 2;
    } else if (params.roofType === 'hip') {
      roofAreaNet = (sideWithOverhang * sideWithOverhang) / Math.cos(pitchRad);
      ridgeLength = sideWithOverhang * 0.4;
      eavesLength = sideWithOverhang * 4;
      gableEndsLength = 0;
    } else {
      roofAreaNet = sideWithOverhang * sideWithOverhang;
      ridgeLength = 0;
      eavesLength = sideWithOverhang * 4;
      gableEndsLength = 0;
    }

    const matData = PRICES.materials[params.material];
    const roofAreaGross = roofAreaNet * matData.overlapMult;

    let timberMat = 0;
    let timberWork = 0;
    let raftersLength = 0;
    let battensLength = 0;
    let counterBattensLength = 0;

    if (params.includeTimber) {
      raftersLength = (sideWithOverhang / 0.6) * (sideWithOverhang / Math.cos(pitchRad));
      battensLength = (sideWithOverhang / Math.cos(pitchRad) / 0.35) * sideWithOverhang * 2;
      counterBattensLength = raftersLength;

      timberMat = (
        (raftersLength * PRICES.lumber.rafters.matPrice)
        + (battensLength * PRICES.lumber.battens.matPrice)
        + (counterBattensLength * PRICES.lumber.counter_battens.matPrice)
      ) * matMult;

      timberWork = (
        (raftersLength * PRICES.lumber.rafters.workPrice)
        + (battensLength * PRICES.lumber.battens.workPrice)
        + (counterBattensLength * PRICES.lumber.counter_battens.workPrice)
      ) * workMult;
    }

    const coverMat = roofAreaGross * matData.matPrice * matMult;
    const coverWork = roofAreaNet * matData.workPrice * workMult;

    const filmMat = roofAreaGross * PRICES.accessories.wind_film.matPrice * matMult;
    const filmWork = roofAreaNet * PRICES.accessories.wind_film.workPrice * workMult;

    const fastMat = roofAreaGross * (params.material === 'clay'
      ? PRICES.accessories.fasteners_clay.matPrice
      : PRICES.accessories.fasteners_metal.matPrice) * matMult;

    const trimsMat = ((ridgeLength * PRICES.accessories.ridge.matPrice) + (gableEndsLength * PRICES.accessories.eaves.matPrice)) * matMult;
    const trimsWork = ((ridgeLength * PRICES.accessories.ridge.workPrice) + (gableEndsLength * PRICES.accessories.eaves.workPrice)) * workMult;

    let guttersMat = 0;
    let guttersWork = 0;
    if (params.includeGutters) {
      const gutterData = PRICES.gutters[params.gutterMaterial];
      guttersMat = eavesLength * gutterData.matPrice * matMult;
      guttersWork = eavesLength * gutterData.workPrice * workMult;
    }

    const totalMat = timberMat + coverMat + filmMat + fastMat + trimsMat + guttersMat;
    const totalWork = timberWork + coverWork + filmWork + trimsWork + guttersWork;

    setResults({
      coverCost: { mat: coverMat + filmMat + fastMat, work: coverWork + filmWork },
      geom: { roofAreaNet, roofAreaGross, ridgeLength, eavesLength, raftersLength, battensLength },
      grandTotal: totalMat + totalWork,
      guttersCost: { mat: guttersMat, work: guttersWork },
      timberCost: { mat: timberMat, work: timberWork },
      totalMat,
      totalWork,
      trimsCost: { mat: trimsMat, work: trimsWork },
    });
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO Jumta un noteksistēmu tāme</h1>
        <p>Detalizēts jumta seguma, koka konstrukciju, aksesuāru un noteksistēmu izmaksu aprēķins.</p>
      </div>

      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>Lokācija un reģions</h2>
            <div className="input-group">
              <select name="country" value={params.country} onChange={handleChange}>
                {renderCountryOptions()}
              </select>
            </div>
          </section>

          <section className="calc-section">
            <h2>1. Mājas un jumta ģeometrija</h2>
            <div className="input-group-2">
              <label>Mājas apbūves laukums (m²)
                <input type="number" name="houseArea" value={params.houseArea} onChange={handleChange} min="20" />
              </label>
              <label>Jumta tips
                <select name="roofType" value={params.roofType} onChange={handleChange}>
                  <option value="gable">Divslīpju jumts</option>
                  <option value="hip">Četrslīpju jumts</option>
                  <option value="flat">Plakanais jumts</option>
                </select>
              </label>
            </div>
            <div className="input-group-2" style={{ marginTop: '20px' }}>
              <label>Slīpums grādos
                <input type="number" name="pitch" value={params.pitch} onChange={handleChange} min="0" max="60" />
              </label>
              <label>Pārkare / karnīze (m)
                <input type="number" name="overhang" value={params.overhang} onChange={handleChange} min="0" step="0.1" />
              </label>
            </div>
          </section>

          <section className="calc-section">
            <h2>2. Koka konstrukcijas</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <input type="checkbox" name="includeTimber" checked={params.includeTimber} onChange={handleChange} style={{ width: '22px', height: '22px', accentColor: '#3b82f6' }} />
              <span style={{ fontSize: '1rem', fontWeight: 600 }}>Aprēķināt jaunas spāres, latojumu un pretlatojumu</span>
            </div>
            {params.includeTimber && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '15px' }}>
                Tiks aprēķināts 50x200 spāru, 50x50 latojuma un pretlatojuma apjoms pēc jumta laukuma.
              </p>
            )}
          </section>

          <section className="calc-section">
            <h2>3. Jumta segums un detaļas</h2>
            <div className="input-group">
              <label>Izvēlētais materiāls
                <select name="material" value={params.material} onChange={handleChange}>
                  {Object.entries(PRICES.materials).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}
                </select>
              </label>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '15px' }}>
              Seguma cenā tiek iekļauti materiālu pārlaiduma zudumi, pretvēja plēve un stiprinājumi.
            </p>
          </section>

          <section className="calc-section">
            <h2>4. Noteksistēmas</h2>
            <div className="input-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <input type="checkbox" name="includeGutters" checked={params.includeGutters} onChange={handleChange} style={{ width: '22px', height: '22px', accentColor: '#3b82f6' }} />
                <span style={{ fontSize: '1rem', fontWeight: 600 }}>Iekļaut lietusūdens noteksistēmu</span>
              </div>
              {params.includeGutters && (
                <label>Sistēmas materiāls
                  <select name="gutterMaterial" value={params.gutterMaterial} onChange={handleChange}>
                    {Object.entries(PRICES.gutters).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}
                  </select>
                </label>
              )}
            </div>
          </section>

          <button onClick={handleCalculate} className="btn-primary" style={{ width: '100%', padding: '18px', fontSize: '1.1rem' }}>
            Ģenerēt profesionālo tāmi
          </button>
        </div>

        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Būvniecības specifikācija</h3>

            {!results ? (
              <div className="empty-state">
                <div className="empty-state-icon">⌂</div>
                <p>Aizpildi ģeometriju un ģenerē jumta tāmi.</p>
              </div>
            ) : (
              <>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px',
                  marginBottom: '25px', padding: '20px', background: 'rgba(255,255,255,0.03)',
                  borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>Jumta platība tīrā</span>
                    <strong style={{ fontSize: '1.1rem' }}>{results.geom.roofAreaNet.toFixed(1)} m²</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>Materiāls ar zudumiem</span>
                    <strong style={{ fontSize: '1.1rem' }}>{results.geom.roofAreaGross.toFixed(1)} m²</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>Nepieciešamās spāres</span>
                    <strong style={{ fontSize: '1.1rem' }}>{results.geom.raftersLength.toFixed(0)} m</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block' }}>Latojuma brusas</span>
                    <strong style={{ fontSize: '1.1rem' }}>{results.geom.battensLength.toFixed(0)} m</strong>
                  </div>
                </div>

                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Pozīcija</th>
                      <th>Materiāli</th>
                      <th>Darbs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {params.includeTimber && (
                      <tr>
                        <td>Koka karkass, spāres un latojums</td>
                        <td>{formatEuro(results.timberCost.mat)}</td>
                        <td>{formatEuro(results.timberCost.work)}</td>
                      </tr>
                    )}
                    <tr>
                      <td>Segums, plēve un stiprinājumi</td>
                      <td>{formatEuro(results.coverCost.mat)}</td>
                      <td>{formatEuro(results.coverCost.work)}</td>
                    </tr>
                    <tr>
                      <td>Skārda detaļas, kores un vējmalas</td>
                      <td>{formatEuro(results.trimsCost.mat)}</td>
                      <td>{formatEuro(results.trimsCost.work)}</td>
                    </tr>
                    {params.includeGutters && (
                      <tr>
                        <td>Noteksistēmas ({results.geom.eavesLength.toFixed(0)} m)</td>
                        <td>{formatEuro(results.guttersCost.mat)}</td>
                        <td>{formatEuro(results.guttersCost.work)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="table-totals">
                    <tr>
                      <td>Kopā</td>
                      <td style={{ color: 'var(--accent-blue)' }}>{formatEuro(results.totalMat)}</td>
                      <td style={{ color: 'var(--accent-purple)' }}>{formatEuro(results.totalWork)}</td>
                    </tr>
                  </tfoot>
                </table>

                <div className="grand-total-box">
                  <span className="gt-label">Jumta izbūves projekts</span>
                  <span className="gt-value">{formatEuro(results.grandTotal)}</span>
                  <span className="gt-subtext">Summā nav iekļauts PVN. Gala piedāvājums jāprecizē pēc objekta apskates.</span>
                </div>

                <CalculatorLeadCta
                  calculatorId="roof"
                  calculatorTitle="Jumta tāme"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Jumta tips', value: params.roofType === 'gable' ? 'Divslīpju' : params.roofType === 'hip' ? 'Četrslīpju' : 'Plakanais' },
                    { label: 'Materiāls', value: PRICES.materials[params.material].name },
                    { label: 'Platība', value: `${results.geom.roofAreaGross.toFixed(1)} m²` },
                    { label: 'Noteksistēma', value: params.includeGutters ? PRICES.gutters[params.gutterMaterial].name : 'Nav iekļauta' },
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
