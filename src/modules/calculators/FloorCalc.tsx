import { useState } from 'react';
import { COUNTRIES, renderCountryOptions } from '../../core/constants';
import '../../components/calculator/styles/CalculatorPro.css';
import { CalculatorLeadCta } from './CalculatorLeadCta';

type FloorParams = {
  area: number;
  country: keyof typeof COUNTRIES;
  demolition: boolean;
  doorTransitionCount: number;
  floorType: keyof typeof FLOOR_TYPES;
  furnitureMove: boolean;
  pattern: keyof typeof PATTERN_TYPES;
  skirtingMeters: number;
  subfloor: keyof typeof SUBFLOOR_TYPES;
  underlay: keyof typeof UNDERLAY_TYPES;
};

type FloorResults = {
  demolitionCost: number;
  floorMaterials: number;
  installationWork: number;
  logistics: number;
  prepCost: number;
  pricePerSquareMeter: number;
  reserve: number;
  skirtingCost: number;
  transitionCost: number;
  underlayCost: number;
  grandTotal: number;
  totalMaterials: number;
  totalWork: number;
};

const FLOOR_TYPES = {
  laminate: { material: 18, name: 'Lamināts / standarta dzīvojamā zona', waste: 1.07, work: 13 },
  vinyl: { material: 28, name: 'LVT vinils / mitrumizturīgs segums', waste: 1.06, work: 17 },
  engineered_wood: { material: 54, name: 'Trīsslāņu parkets / koka grīda', waste: 1.08, work: 24 },
  parquet: { material: 72, name: 'Parkets ar slīpēšanu / premium apdari', waste: 1.1, work: 32 },
  tile: { material: 34, name: 'Flīzes grīdai', waste: 1.09, work: 31 },
  microcement: { material: 46, name: 'Mikrocements / bezšuvju apdare', waste: 1.04, work: 36 },
} as const;

const SUBFLOOR_TYPES = {
  ready: { logistics: 90, name: 'Pamatne gatava ieklāšanai', prep: 3, workMultiplier: 0.94 },
  minor_leveling: { logistics: 140, name: 'Neliela līdzināšana līdz 5 mm', prep: 8, workMultiplier: 1 },
  self_leveling: { logistics: 220, name: 'Pašizlīdzinošais slānis', prep: 16, workMultiplier: 1.14 },
  damaged: { logistics: 310, name: 'Bojāta pamatne / lokāli remonti', prep: 24, workMultiplier: 1.24 },
} as const;

const UNDERLAY_TYPES = {
  none: { material: 0, name: 'Bez apakšklāja / nav vajadzīgs', work: 0 },
  standard: { material: 3.2, name: 'Standarta apakšklājs', work: 1.2 },
  acoustic: { material: 6.5, name: 'Akustiskais apakšklājs', work: 1.6 },
  moisture: { material: 7.8, name: 'Mitruma barjera / plēve', work: 1.8 },
  heatedFloor: { material: 9.5, name: 'Saderīgs ar siltajām grīdām', work: 2.2 },
} as const;

const PATTERN_TYPES = {
  straight: { multiplier: 1, name: 'Taisna ieklāšana' },
  diagonal: { multiplier: 1.12, name: 'Diagonāla ieklāšana' },
  herringbone: { multiplier: 1.26, name: 'Skujiņa / dekoratīvs raksts' },
} as const;

const MINIMUM_PROJECT_TOTAL = 780;

function formatEuro(value: number) {
  return `${Math.round(value).toLocaleString('lv-LV')} €`;
}

function clampNumber(value: number, min: number) {
  return Number.isFinite(value) ? Math.max(min, value) : min;
}

export default function FloorCalc() {
  const [params, setParams] = useState<FloorParams>({
    area: 64,
    country: 'lv',
    demolition: true,
    doorTransitionCount: 4,
    floorType: 'vinyl',
    furnitureMove: false,
    pattern: 'straight',
    skirtingMeters: 38,
    subfloor: 'minor_leveling',
    underlay: 'acoustic',
  });
  const [results, setResults] = useState<FloorResults | null>(null);

  const updateParam = <Key extends keyof FloorParams>(key: Key, value: FloorParams[Key]) => {
    setParams((current) => ({ ...current, [key]: value }));
  };

  const handleCalculate = () => {
    const country = COUNTRIES[params.country];
    const floor = FLOOR_TYPES[params.floorType];
    const subfloor = SUBFLOOR_TYPES[params.subfloor];
    const underlay = UNDERLAY_TYPES[params.underlay];
    const pattern = PATTERN_TYPES[params.pattern];

    const area = clampNumber(params.area, 1);
    const skirtingMeters = clampNumber(params.skirtingMeters, 0);
    const doorTransitionCount = clampNumber(params.doorTransitionCount, 0);
    const furnitureMultiplier = params.furnitureMove ? 1.08 : 1;

    const floorMaterials = area * floor.material * floor.waste * country.matMult;
    const underlayCost = area * (underlay.material * country.matMult + underlay.work * country.workMult);
    const prepCost = area * subfloor.prep * country.workMult;
    const installationWork = area * floor.work * pattern.multiplier * subfloor.workMultiplier * furnitureMultiplier * country.workMult;
    const demolitionCost = params.demolition ? area * 6.5 * country.workMult : 0;
    const skirtingCost = skirtingMeters * (4.5 * country.matMult + 5.5 * country.workMult);
    const transitionCost = doorTransitionCount * (18 * country.matMult + 16 * country.workMult);
    const logistics = subfloor.logistics * (area > 120 ? 1.3 : 1) * country.workMult;

    const totalMaterials = floorMaterials + underlayCost * 0.7 + skirtingMeters * 4.5 * country.matMult + doorTransitionCount * 18 * country.matMult;
    const totalWork = installationWork + prepCost + demolitionCost + underlayCost * 0.3 + skirtingMeters * 5.5 * country.workMult + doorTransitionCount * 16 * country.workMult;
    const reserve = (totalMaterials + totalWork + logistics) * 0.07;
    const calculatedTotal = totalMaterials + totalWork + logistics + reserve;
    const grandTotal = Math.max(calculatedTotal, MINIMUM_PROJECT_TOTAL * country.workMult);

    setResults({
      demolitionCost,
      floorMaterials,
      installationWork,
      logistics,
      prepCost,
      pricePerSquareMeter: grandTotal / area,
      reserve,
      skirtingCost,
      transitionCost,
      underlayCost,
      grandTotal,
      totalMaterials,
      totalWork,
    });
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO Grīdas Segumu Tāme</h1>
        <p>Seguma tips, pamatnes sagatavošana, apakšklājs, līstes, pārejas, demontāža un ieklāšanas raksts vienā aprēķinā.</p>
      </div>

      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>Segums un platība</h2>
            <div className="input-group">
              <label>
                Reģions
                <select value={params.country} onChange={(event) => updateParam('country', event.target.value as FloorParams['country'])}>
                  {renderCountryOptions()}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Platība (m²)
                <input min="5" onChange={(event) => updateParam('area', Number(event.target.value))} type="number" value={params.area} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Grīdas segums
                <select value={params.floorType} onChange={(event) => updateParam('floorType', event.target.value as FloorParams['floorType'])}>
                  {Object.entries(FLOOR_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Ieklāšanas raksts
                <select value={params.pattern} onChange={(event) => updateParam('pattern', event.target.value as FloorParams['pattern'])}>
                  {Object.entries(PATTERN_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="calc-section">
            <h2>Pamatne un detaļas</h2>
            <div className="input-group">
              <label>
                Pamatnes stāvoklis
                <select value={params.subfloor} onChange={(event) => updateParam('subfloor', event.target.value as FloorParams['subfloor'])}>
                  {Object.entries(SUBFLOOR_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Apakšklājs / mitruma slānis
                <select value={params.underlay} onChange={(event) => updateParam('underlay', event.target.value as FloorParams['underlay'])}>
                  {Object.entries(UNDERLAY_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Līstes (m)
                <input min="0" onChange={(event) => updateParam('skirtingMeters', Number(event.target.value))} type="number" value={params.skirtingMeters} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Durvju pārejas / profili
                <input min="0" onChange={(event) => updateParam('doorTransitionCount', Number(event.target.value))} type="number" value={params.doorTransitionCount} />
              </label>

              <label style={{ alignItems: 'center', display: 'flex', gap: '10px', marginTop: '20px' }}>
                <input checked={params.demolition} onChange={(event) => updateParam('demolition', event.target.checked)} type="checkbox" />
                Vajag vecā seguma demontāžu
              </label>

              <label style={{ alignItems: 'center', display: 'flex', gap: '10px', marginTop: '20px' }}>
                <input checked={params.furnitureMove} onChange={(event) => updateParam('furnitureMove', event.target.checked)} type="checkbox" />
                Darbs ar mēbeļu pārvietošanu
              </label>
            </div>
          </section>

          <button className="btn-primary" onClick={handleCalculate} style={{ width: '100%', padding: '18px' }}>
            APRĒĶINĀT GRĪDAS TĀMI
          </button>
        </div>

        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Grīdas specifikācija</h3>
            {!results ? (
              <div className="empty-state">Norādi platību, segumu un pamatnes stāvokli.</div>
            ) : (
              <>
                <div className="grand-total-box">
                  <span className="gt-label">PROGNOZĒTĀ SUMMA</span>
                  <span className="gt-value">{formatEuro(results.grandTotal)}</span>
                </div>

                <div className="result-row"><span>Materiāli</span><b>{formatEuro(results.totalMaterials)}</b></div>
                <div className="result-row"><span>Darbs</span><b>{formatEuro(results.totalWork)}</b></div>
                <div className="result-row"><span>Pamatnes sagatavošana</span><b>{formatEuro(results.prepCost)}</b></div>
                <div className="result-row"><span>Līstes un pārejas</span><b>{formatEuro(results.skirtingCost + results.transitionCost)}</b></div>
                <div className="result-row"><span>Loģistika / rezerve</span><b>{formatEuro(results.logistics + results.reserve)}</b></div>
                <div className="result-row"><span>Cena par m²</span><b>{formatEuro(results.pricePerSquareMeter)}</b></div>

                <CalculatorLeadCta
                  calculatorId="floor"
                  calculatorTitle="Grīdas segumu tāme"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Platība', value: `${params.area} m²` },
                    { label: 'Segums', value: FLOOR_TYPES[params.floorType].name },
                    { label: 'Pamatne', value: SUBFLOOR_TYPES[params.subfloor].name },
                    { label: 'Raksts', value: PATTERN_TYPES[params.pattern].name },
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
