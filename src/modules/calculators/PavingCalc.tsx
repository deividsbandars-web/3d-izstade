import { useState } from 'react';
import { COUNTRIES, renderCountryOptions } from '../../core/constants';
import '../../components/calculator/styles/CalculatorPro.css';
import { CalculatorLeadCta } from './CalculatorLeadCta';

type PavingParams = {
  area: number;
  baseType: keyof typeof BASE_TYPES;
  condition: keyof typeof SITE_CONDITIONS;
  country: keyof typeof COUNTRIES;
  drainageMeters: number;
  edgeMeters: number;
  includeGeotextile: boolean;
  pattern: keyof typeof PATTERN_TYPES;
  stepsCount: number;
  surfaceType: keyof typeof SURFACE_TYPES;
};

type PavingResults = {
  baseMaterials: number;
  baseWork: number;
  drainageCost: number;
  edgeCost: number;
  geotextileCost: number;
  grandTotal: number;
  pricePerSquareMeter: number;
  reserve: number;
  siteLogistics: number;
  surfaceMaterials: number;
  surfaceWork: number;
  totalMaterials: number;
  totalWork: number;
};

const SURFACE_TYPES = {
  concrete_6cm: { material: 23, name: 'Betona bruģis 6 cm', waste: 1.05, work: 18 },
  concrete_8cm: { material: 29, name: 'Betona bruģis 8 cm iebrauktuvei', waste: 1.06, work: 21 },
  premium_slab: { material: 42, name: 'Premium plāksnes / dizaina segums', waste: 1.08, work: 26 },
  granite: { material: 68, name: 'Granīta bruģis', waste: 1.1, work: 34 },
} as const;

const BASE_TYPES = {
  walkway: { material: 9, name: 'Gājēju zona 15-20 cm', work: 8 },
  driveway: { material: 16, name: 'Auto iebrauktuve 25-35 cm', work: 13 },
  heavy: { material: 23, name: 'Smagā slodze / komercteritorija', work: 18 },
  repair_existing: { material: 6, name: 'Esošas pamatnes labošanas darbi', work: 9 },
} as const;

const SITE_CONDITIONS = {
  prepared: { logistics: 90, multiplier: 0.92, name: 'Pamatne sagatavota' },
  normal: { logistics: 150, multiplier: 1, name: 'Standarta objekts' },
  excavation: { logistics: 260, multiplier: 1.18, name: 'Vajag norakšanu / izvešanu' },
  difficult_access: { logistics: 340, multiplier: 1.28, name: 'Sarežģīta piekļuve tehnikai' },
} as const;

const PATTERN_TYPES = {
  standard: { multiplier: 1, name: 'Standarta raksts' },
  diagonal: { multiplier: 1.1, name: 'Diagonāls / dekoratīvs raksts' },
  radius: { multiplier: 1.18, name: 'Rādiusi, līkumi un sarežģītas malas' },
} as const;

const MINIMUM_PROJECT_TOTAL = 850;

function formatEuro(value: number) {
  return `${Math.round(value).toLocaleString('lv-LV')} €`;
}

function clampNumber(value: number, min: number) {
  return Number.isFinite(value) ? Math.max(min, value) : min;
}

export default function PavingCalc() {
  const [params, setParams] = useState<PavingParams>({
    area: 80,
    baseType: 'driveway',
    condition: 'normal',
    country: 'lv',
    drainageMeters: 0,
    edgeMeters: 28,
    includeGeotextile: true,
    pattern: 'standard',
    stepsCount: 0,
    surfaceType: 'concrete_6cm',
  });
  const [results, setResults] = useState<PavingResults | null>(null);

  const updateParam = <Key extends keyof PavingParams>(key: Key, value: PavingParams[Key]) => {
    setParams((current) => ({ ...current, [key]: value }));
  };

  const handleCalculate = () => {
    const country = COUNTRIES[params.country];
    const surface = SURFACE_TYPES[params.surfaceType];
    const base = BASE_TYPES[params.baseType];
    const condition = SITE_CONDITIONS[params.condition];
    const pattern = PATTERN_TYPES[params.pattern];

    const area = clampNumber(params.area, 1);
    const edgeMeters = clampNumber(params.edgeMeters, 0);
    const drainageMeters = clampNumber(params.drainageMeters, 0);
    const stepsCount = clampNumber(params.stepsCount, 0);

    const surfaceMaterials = area * surface.material * surface.waste * country.matMult;
    const baseMaterials = area * base.material * country.matMult;
    const geotextileCost = params.includeGeotextile ? area * 1.2 * country.matMult : 0;
    const edgeCost = edgeMeters * 13 * country.matMult;
    const drainageCost = drainageMeters * 32 * country.matMult;

    const surfaceWork = area * surface.work * pattern.multiplier * condition.multiplier * country.workMult;
    const baseWork = area * base.work * condition.multiplier * country.workMult;
    const edgeWork = edgeMeters * 7 * country.workMult;
    const drainageWork = drainageMeters * 14 * country.workMult;
    const stepsWork = stepsCount * 95 * country.workMult;

    const totalMaterials = surfaceMaterials + baseMaterials + geotextileCost + edgeCost + drainageCost;
    const totalWork = surfaceWork + baseWork + edgeWork + drainageWork + stepsWork;
    const siteLogistics = condition.logistics * (area > 150 ? 1.35 : 1) * country.workMult;
    const reserve = (totalMaterials + totalWork + siteLogistics) * 0.08;
    const calculatedTotal = totalMaterials + totalWork + siteLogistics + reserve;
    const grandTotal = Math.max(calculatedTotal, MINIMUM_PROJECT_TOTAL * country.workMult);

    setResults({
      baseMaterials,
      baseWork,
      drainageCost: drainageCost + drainageWork,
      edgeCost: edgeCost + edgeWork,
      geotextileCost,
      grandTotal,
      pricePerSquareMeter: grandTotal / area,
      reserve,
      siteLogistics,
      surfaceMaterials,
      surfaceWork,
      totalMaterials,
      totalWork,
    });
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO Bruģa un Pagalma Seguma Tāme</h1>
        <p>Bruģis, pamatne, apmales, drenāža un objekta piekļuve vienā sākotnējā aprēķinā.</p>
      </div>

      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>Segums un apjoms</h2>
            <div className="input-group">
              <label>
                Reģions
                <select value={params.country} onChange={(event) => updateParam('country', event.target.value as PavingParams['country'])}>
                  {renderCountryOptions()}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Platība (m²)
                <input
                  min="5"
                  onChange={(event) => updateParam('area', Number(event.target.value))}
                  type="number"
                  value={params.area}
                />
              </label>

              <label style={{ marginTop: '20px' }}>
                Seguma tips
                <select value={params.surfaceType} onChange={(event) => updateParam('surfaceType', event.target.value as PavingParams['surfaceType'])}>
                  {Object.entries(SURFACE_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Pamatnes slodze
                <select value={params.baseType} onChange={(event) => updateParam('baseType', event.target.value as PavingParams['baseType'])}>
                  {Object.entries(BASE_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="calc-section">
            <h2>Objekta sarežģītība</h2>
            <div className="input-group">
              <label>
                Esošie apstākļi
                <select value={params.condition} onChange={(event) => updateParam('condition', event.target.value as PavingParams['condition'])}>
                  {Object.entries(SITE_CONDITIONS).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Raksts / griezumi
                <select value={params.pattern} onChange={(event) => updateParam('pattern', event.target.value as PavingParams['pattern'])}>
                  {Object.entries(PATTERN_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Apmales (m)
                <input
                  min="0"
                  onChange={(event) => updateParam('edgeMeters', Number(event.target.value))}
                  type="number"
                  value={params.edgeMeters}
                />
              </label>

              <label style={{ marginTop: '20px' }}>
                Drenāža / notekrenes (m)
                <input
                  min="0"
                  onChange={(event) => updateParam('drainageMeters', Number(event.target.value))}
                  type="number"
                  value={params.drainageMeters}
                />
              </label>

              <label style={{ marginTop: '20px' }}>
                Pakāpieni / līmeņu pārejas
                <input
                  min="0"
                  onChange={(event) => updateParam('stepsCount', Number(event.target.value))}
                  type="number"
                  value={params.stepsCount}
                />
              </label>

              <label style={{ alignItems: 'center', display: 'flex', gap: '10px', marginTop: '20px' }}>
                <input
                  checked={params.includeGeotextile}
                  onChange={(event) => updateParam('includeGeotextile', event.target.checked)}
                  type="checkbox"
                />
                Iekļaut ģeotekstilu
              </label>
            </div>
          </section>

          <button className="btn-primary" onClick={handleCalculate} style={{ width: '100%', padding: '18px' }}>
            APRĒĶINĀT BRUĢA TĀMI
          </button>
        </div>

        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Bruģēšanas specifikācija</h3>
            {!results ? (
              <div className="empty-state">Norādi platību, segumu un objekta apstākļus.</div>
            ) : (
              <>
                <div className="grand-total-box">
                  <span className="gt-label">PROGNOZĒTĀ SUMMA</span>
                  <span className="gt-value">{formatEuro(results.grandTotal)}</span>
                </div>

                <div className="result-row"><span>Materiāli</span><b>{formatEuro(results.totalMaterials)}</b></div>
                <div className="result-row"><span>Darbs</span><b>{formatEuro(results.totalWork)}</b></div>
                <div className="result-row"><span>Loģistika / tehnika</span><b>{formatEuro(results.siteLogistics)}</b></div>
                <div className="result-row"><span>Rezerve un griezumi</span><b>{formatEuro(results.reserve)}</b></div>
                <div className="result-row"><span>Cena par m²</span><b>{formatEuro(results.pricePerSquareMeter)}</b></div>

                <CalculatorLeadCta
                  calculatorId="paving"
                  calculatorTitle="Bruģa un pagalma seguma tāme"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Platība', value: `${params.area} m²` },
                    { label: 'Segums', value: SURFACE_TYPES[params.surfaceType].name },
                    { label: 'Pamatne', value: BASE_TYPES[params.baseType].name },
                    { label: 'Apstākļi', value: SITE_CONDITIONS[params.condition].name },
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
