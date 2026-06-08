import { useState } from 'react';
import { COUNTRIES, renderCountryOptions } from '../../core/constants';
import '../../components/calculator/styles/CalculatorPro.css';
import { CalculatorLeadCta } from './CalculatorLeadCta';

type FenceParams = {
  country: keyof typeof COUNTRIES;
  demolition: boolean;
  fenceType: keyof typeof FENCE_TYPES;
  gateType: keyof typeof GATE_TYPES;
  height: keyof typeof HEIGHT_OPTIONS;
  includeAutomation: boolean;
  includePlinth: boolean;
  lengthMeters: number;
  postFoundation: keyof typeof POST_FOUNDATIONS;
  terrain: keyof typeof TERRAIN_TYPES;
};

type FenceResults = {
  automationCost: number;
  demolitionCost: number;
  fenceMaterials: number;
  fenceWork: number;
  foundationCost: number;
  gateCost: number;
  grandTotal: number;
  logistics: number;
  postCount: number;
  pricePerMeter: number;
  reserve: number;
  totalMaterials: number;
  totalWork: number;
};

const FENCE_TYPES = {
  mesh: { materialPerMeter: 24, name: 'Metināta sieta žogs', workPerMeter: 16 },
  panel: { materialPerMeter: 42, name: 'Paneļu žogs', workPerMeter: 20 },
  wood: { materialPerMeter: 55, name: 'Koka dēļu žogs', workPerMeter: 27 },
  metal: { materialPerMeter: 78, name: 'Metāla profilu žogs', workPerMeter: 32 },
  concrete: { materialPerMeter: 96, name: 'Betona / moduļu žogs', workPerMeter: 38 },
  gabion: { materialPerMeter: 118, name: 'Gabionu žogs', workPerMeter: 44 },
} as const;

const HEIGHT_OPTIONS = {
  low: { materialMultiplier: 0.9, name: '1.2-1.5 m', workMultiplier: 0.95 },
  standard: { materialMultiplier: 1, name: '1.6-1.8 m', workMultiplier: 1 },
  high: { materialMultiplier: 1.18, name: '1.9-2.1 m', workMultiplier: 1.12 },
  security: { materialMultiplier: 1.34, name: '2.2+ m drošības žogs', workMultiplier: 1.22 },
} as const;

const POST_FOUNDATIONS = {
  driven: { name: 'Iedzīti / skrūvpāļi vieglam žogam', pricePerPost: 18, workPerPost: 12 },
  concrete: { name: 'Betonēti stabi', pricePerPost: 32, workPerPost: 22 },
  strip: { name: 'Stabi ar cokolu / lentveida pamatu', pricePerPost: 55, workPerPost: 34 },
} as const;

const TERRAIN_TYPES = {
  flat: { logistics: 90, multiplier: 0.95, name: 'Līdzens un viegli pieejams' },
  normal: { logistics: 150, multiplier: 1, name: 'Standarta pagalms' },
  sloped: { logistics: 260, multiplier: 1.18, name: 'Slīpums vai daudz līmeņu' },
  difficult: { logistics: 360, multiplier: 1.32, name: 'Sarežģīta piekļuve / šaura teritorija' },
} as const;

const GATE_TYPES = {
  none: { material: 0, name: 'Bez vārtiem', work: 0 },
  pedestrian: { material: 260, name: 'Gājēju vārtiņi', work: 120 },
  double: { material: 780, name: 'Divviru iebrauktuves vārti', work: 260 },
  sliding: { material: 1450, name: 'Bīdāmie vārti', work: 420 },
} as const;

const MINIMUM_PROJECT_TOTAL = 950;

function formatEuro(value: number) {
  return `${Math.round(value).toLocaleString('lv-LV')} €`;
}

function clampNumber(value: number, min: number) {
  return Number.isFinite(value) ? Math.max(min, value) : min;
}

export default function FenceCalc() {
  const [params, setParams] = useState<FenceParams>({
    country: 'lv',
    demolition: false,
    fenceType: 'panel',
    gateType: 'double',
    height: 'standard',
    includeAutomation: false,
    includePlinth: false,
    lengthMeters: 55,
    postFoundation: 'concrete',
    terrain: 'normal',
  });
  const [results, setResults] = useState<FenceResults | null>(null);

  const updateParam = <Key extends keyof FenceParams>(key: Key, value: FenceParams[Key]) => {
    setParams((current) => ({ ...current, [key]: value }));
  };

  const handleCalculate = () => {
    const country = COUNTRIES[params.country];
    const fence = FENCE_TYPES[params.fenceType];
    const height = HEIGHT_OPTIONS[params.height];
    const foundation = POST_FOUNDATIONS[params.postFoundation];
    const terrain = TERRAIN_TYPES[params.terrain];
    const gate = GATE_TYPES[params.gateType];

    const lengthMeters = clampNumber(params.lengthMeters, 1);
    const postCount = Math.ceil(lengthMeters / 2.5) + 1;
    const fenceMaterials = lengthMeters * fence.materialPerMeter * height.materialMultiplier * country.matMult;
    const fenceWork = lengthMeters * fence.workPerMeter * height.workMultiplier * terrain.multiplier * country.workMult;
    const foundationCost = postCount * (foundation.pricePerPost * country.matMult + foundation.workPerPost * terrain.multiplier * country.workMult);
    const plinthCost = params.includePlinth ? lengthMeters * (16 * country.matMult + 12 * terrain.multiplier * country.workMult) : 0;
    const gateCost = gate.material * country.matMult + gate.work * terrain.multiplier * country.workMult;
    const automationCost = params.includeAutomation && params.gateType !== 'none' ? 780 * country.matMult + 220 * country.workMult : 0;
    const demolitionCost = params.demolition ? lengthMeters * 9 * terrain.multiplier * country.workMult : 0;
    const logistics = terrain.logistics * (lengthMeters > 90 ? 1.25 : 1) * country.workMult;

    const totalMaterials = fenceMaterials + postCount * foundation.pricePerPost * country.matMult + plinthCost * 0.55 + gate.material * country.matMult + automationCost * 0.75;
    const totalWork = fenceWork + postCount * foundation.workPerPost * terrain.multiplier * country.workMult + plinthCost * 0.45 + gate.work * terrain.multiplier * country.workMult + demolitionCost + automationCost * 0.25;
    const reserve = (totalMaterials + totalWork + logistics) * 0.08;
    const calculatedTotal = totalMaterials + totalWork + logistics + reserve;
    const grandTotal = Math.max(calculatedTotal, MINIMUM_PROJECT_TOTAL * country.workMult);

    setResults({
      automationCost,
      demolitionCost,
      fenceMaterials,
      fenceWork,
      foundationCost: foundationCost + plinthCost,
      gateCost,
      grandTotal,
      logistics,
      postCount,
      pricePerMeter: grandTotal / lengthMeters,
      reserve,
      totalMaterials,
      totalWork,
    });
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO Žoga un Vārtu Tāme</h1>
        <p>Žoga garums, materiāls, augstums, stabi, pamati, reljefs, vārti un demontāža vienā sākotnējā aprēķinā.</p>
      </div>

      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>Žogs un apjoms</h2>
            <div className="input-group">
              <label>
                Reģions
                <select value={params.country} onChange={(event) => updateParam('country', event.target.value as FenceParams['country'])}>
                  {renderCountryOptions()}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Žoga garums (m)
                <input min="5" onChange={(event) => updateParam('lengthMeters', Number(event.target.value))} type="number" value={params.lengthMeters} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Žoga tips
                <select value={params.fenceType} onChange={(event) => updateParam('fenceType', event.target.value as FenceParams['fenceType'])}>
                  {Object.entries(FENCE_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Augstums
                <select value={params.height} onChange={(event) => updateParam('height', event.target.value as FenceParams['height'])}>
                  {Object.entries(HEIGHT_OPTIONS).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="calc-section">
            <h2>Pamati, reljefs un vārti</h2>
            <div className="input-group">
              <label>
                Stabu / pamatu risinājums
                <select value={params.postFoundation} onChange={(event) => updateParam('postFoundation', event.target.value as FenceParams['postFoundation'])}>
                  {Object.entries(POST_FOUNDATIONS).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Objekta reljefs
                <select value={params.terrain} onChange={(event) => updateParam('terrain', event.target.value as FenceParams['terrain'])}>
                  {Object.entries(TERRAIN_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Vārtu risinājums
                <select value={params.gateType} onChange={(event) => updateParam('gateType', event.target.value as FenceParams['gateType'])}>
                  {Object.entries(GATE_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ alignItems: 'center', display: 'flex', gap: '10px', marginTop: '20px' }}>
                <input checked={params.includePlinth} onChange={(event) => updateParam('includePlinth', event.target.checked)} type="checkbox" />
                Iekļaut cokolu / apakšējo lentu
              </label>

              <label style={{ alignItems: 'center', display: 'flex', gap: '10px', marginTop: '20px' }}>
                <input checked={params.includeAutomation} disabled={params.gateType === 'none'} onChange={(event) => updateParam('includeAutomation', event.target.checked)} type="checkbox" />
                Iekļaut vārtu automātiku
              </label>

              <label style={{ alignItems: 'center', display: 'flex', gap: '10px', marginTop: '20px' }}>
                <input checked={params.demolition} onChange={(event) => updateParam('demolition', event.target.checked)} type="checkbox" />
                Vajag vecā žoga demontāžu
              </label>
            </div>
          </section>

          <button className="btn-primary" onClick={handleCalculate} style={{ width: '100%', padding: '18px' }}>
            APRĒĶINĀT ŽOGA TĀMI
          </button>
        </div>

        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Žoga specifikācija</h3>
            {!results ? (
              <div className="empty-state">Norādi garumu, žoga tipu, pamatus un vārtu risinājumu.</div>
            ) : (
              <>
                <div className="grand-total-box">
                  <span className="gt-label">PROGNOZĒTĀ SUMMA</span>
                  <span className="gt-value">{formatEuro(results.grandTotal)}</span>
                </div>

                <div className="result-row"><span>Materiāli</span><b>{formatEuro(results.totalMaterials)}</b></div>
                <div className="result-row"><span>Darbs</span><b>{formatEuro(results.totalWork)}</b></div>
                <div className="result-row"><span>Stabi / pamati</span><b>{formatEuro(results.foundationCost)}</b></div>
                <div className="result-row"><span>Vārti un automātika</span><b>{formatEuro(results.gateCost + results.automationCost)}</b></div>
                <div className="result-row"><span>Loģistika / rezerve</span><b>{formatEuro(results.logistics + results.reserve)}</b></div>
                <div className="result-row"><span>Stabu skaits</span><b>{results.postCount}</b></div>
                <div className="result-row"><span>Cena par metru</span><b>{formatEuro(results.pricePerMeter)}</b></div>

                <CalculatorLeadCta
                  calculatorId="fence"
                  calculatorTitle="Žoga un vārtu tāme"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Garums', value: `${params.lengthMeters} m` },
                    { label: 'Žoga tips', value: FENCE_TYPES[params.fenceType].name },
                    { label: 'Pamati', value: POST_FOUNDATIONS[params.postFoundation].name },
                    { label: 'Vārti', value: GATE_TYPES[params.gateType].name },
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
