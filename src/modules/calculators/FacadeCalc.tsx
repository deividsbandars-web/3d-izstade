import { useState } from 'react';
import { COUNTRIES, renderCountryOptions } from '../../core/constants';
import '../../components/calculator/styles/CalculatorPro.css';
import { CalculatorLeadCta } from './CalculatorLeadCta';

type FacadeParams = {
  area: number;
  condition: keyof typeof WALL_CONDITIONS;
  country: keyof typeof COUNTRIES;
  demolition: boolean;
  finishType: keyof typeof FINISH_TYPES;
  floors: keyof typeof SCAFFOLDING_LEVELS;
  insulationType: keyof typeof INSULATION_SYSTEMS;
  revealMeters: number;
  socleMeters: number;
};

type FacadeResults = {
  demolitionCost: number;
  finishMaterials: number;
  finishWork: number;
  grandTotal: number;
  insulationMaterials: number;
  insulationWork: number;
  pricePerSquareMeter: number;
  reserve: number;
  revealCost: number;
  scaffoldingCost: number;
  socleCost: number;
  substratePrep: number;
  totalMaterials: number;
  totalWork: number;
};

const INSULATION_SYSTEMS = {
  eps_150: { material: 22, name: 'EPS 150 mm siltināšanas sistēma', work: 24 },
  wool_150: { material: 32, name: 'Akmens vate 150 mm', work: 29 },
  eps_200: { material: 29, name: 'EPS 200 mm energoefektivitātei', work: 27 },
  repaint: { material: 8, name: 'Bez siltināšanas - fasādes atjaunošana', work: 13 },
} as const;

const FINISH_TYPES = {
  silicone_plaster: { material: 9, name: 'Silikona dekoratīvais apmetums', work: 9 },
  mineral_plaster: { material: 6, name: 'Minerālais apmetums + krāsošana', work: 8 },
  clinker_tiles: { material: 34, name: 'Klinkera flīzes / premium zona', work: 28 },
  timber_cladding: { material: 38, name: 'Koka apšuvuma akcents', work: 24 },
} as const;

const WALL_CONDITIONS = {
  clean: { multiplier: 0.92, name: 'Tīra un taisna siena', prep: 3 },
  normal: { multiplier: 1, name: 'Standarta sagatavošana', prep: 6 },
  cracked: { multiplier: 1.14, name: 'Plaisas / līdzināšana', prep: 11 },
  old_facade: { multiplier: 1.25, name: 'Veca fasāde ar bojājumiem', prep: 16 },
} as const;

const SCAFFOLDING_LEVELS = {
  one: { name: '1 stāvs', price: 4 },
  two: { name: '2 stāvi', price: 7 },
  three: { name: '3+ stāvi / sarežģīta piekļuve', price: 11 },
} as const;

const MINIMUM_PROJECT_TOTAL = 1800;

function formatEuro(value: number) {
  return `${Math.round(value).toLocaleString('lv-LV')} €`;
}

function clampNumber(value: number, min: number) {
  return Number.isFinite(value) ? Math.max(min, value) : min;
}

export default function FacadeCalc() {
  const [params, setParams] = useState<FacadeParams>({
    area: 180,
    condition: 'normal',
    country: 'lv',
    demolition: false,
    finishType: 'silicone_plaster',
    floors: 'two',
    insulationType: 'eps_150',
    revealMeters: 42,
    socleMeters: 28,
  });
  const [results, setResults] = useState<FacadeResults | null>(null);

  const updateParam = <Key extends keyof FacadeParams>(key: Key, value: FacadeParams[Key]) => {
    setParams((current) => ({ ...current, [key]: value }));
  };

  const handleCalculate = () => {
    const country = COUNTRIES[params.country];
    const insulation = INSULATION_SYSTEMS[params.insulationType];
    const finish = FINISH_TYPES[params.finishType];
    const condition = WALL_CONDITIONS[params.condition];
    const scaffolding = SCAFFOLDING_LEVELS[params.floors];

    const area = clampNumber(params.area, 1);
    const revealMeters = clampNumber(params.revealMeters, 0);
    const socleMeters = clampNumber(params.socleMeters, 0);

    const insulationMaterials = area * insulation.material * country.matMult;
    const finishMaterials = area * finish.material * country.matMult;
    const substratePrep = area * condition.prep * condition.multiplier * country.workMult;
    const insulationWork = area * insulation.work * condition.multiplier * country.workMult;
    const finishWork = area * finish.work * country.workMult;
    const scaffoldingCost = area * scaffolding.price * country.workMult;
    const revealCost = revealMeters * 18 * country.workMult;
    const socleCost = socleMeters * 34 * country.matMult + socleMeters * 18 * country.workMult;
    const demolitionCost = params.demolition ? area * 8 * country.workMult : 0;

    const totalMaterials = insulationMaterials + finishMaterials + socleMeters * 34 * country.matMult;
    const totalWork = substratePrep + insulationWork + finishWork + revealCost + socleMeters * 18 * country.workMult + demolitionCost;
    const reserve = (totalMaterials + totalWork + scaffoldingCost) * 0.07;
    const calculatedTotal = totalMaterials + totalWork + scaffoldingCost + reserve;
    const grandTotal = Math.max(calculatedTotal, MINIMUM_PROJECT_TOTAL * country.workMult);

    setResults({
      demolitionCost,
      finishMaterials,
      finishWork,
      grandTotal,
      insulationMaterials,
      insulationWork,
      pricePerSquareMeter: grandTotal / area,
      reserve,
      revealCost,
      scaffoldingCost,
      socleCost,
      substratePrep,
      totalMaterials,
      totalWork,
    });
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO Fasādes un Siltināšanas Tāme</h1>
        <p>Siltinājums, sienas sagatavošana, dekoratīvā apdare, sastatnes, ailes un cokols vienā aprēķinā.</p>
      </div>

      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>Fasādes apjoms</h2>
            <div className="input-group">
              <label>
                Reģions
                <select value={params.country} onChange={(event) => updateParam('country', event.target.value as FacadeParams['country'])}>
                  {renderCountryOptions()}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Fasādes platība (m²)
                <input min="20" onChange={(event) => updateParam('area', Number(event.target.value))} type="number" value={params.area} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Siltinājuma sistēma
                <select value={params.insulationType} onChange={(event) => updateParam('insulationType', event.target.value as FacadeParams['insulationType'])}>
                  {Object.entries(INSULATION_SYSTEMS).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Apdares tips
                <select value={params.finishType} onChange={(event) => updateParam('finishType', event.target.value as FacadeParams['finishType'])}>
                  {Object.entries(FINISH_TYPES).map(([key, value]) => (
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
                Sienas stāvoklis
                <select value={params.condition} onChange={(event) => updateParam('condition', event.target.value as FacadeParams['condition'])}>
                  {Object.entries(WALL_CONDITIONS).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Sastatnes / augstums
                <select value={params.floors} onChange={(event) => updateParam('floors', event.target.value as FacadeParams['floors'])}>
                  {Object.entries(SCAFFOLDING_LEVELS).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Logu/durvju ailes (m)
                <input min="0" onChange={(event) => updateParam('revealMeters', Number(event.target.value))} type="number" value={params.revealMeters} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Cokola zona (m)
                <input min="0" onChange={(event) => updateParam('socleMeters', Number(event.target.value))} type="number" value={params.socleMeters} />
              </label>

              <label style={{ alignItems: 'center', display: 'flex', gap: '10px', marginTop: '20px' }}>
                <input checked={params.demolition} onChange={(event) => updateParam('demolition', event.target.checked)} type="checkbox" />
                Vajag vecās apdares demontāžu
              </label>
            </div>
          </section>

          <button className="btn-primary" onClick={handleCalculate} style={{ width: '100%', padding: '18px' }}>
            APRĒĶINĀT FASĀDES TĀMI
          </button>
        </div>

        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Fasādes specifikācija</h3>
            {!results ? (
              <div className="empty-state">Norādi fasādes platību, sistēmu un sienas stāvokli.</div>
            ) : (
              <>
                <div className="grand-total-box">
                  <span className="gt-label">PROGNOZĒTĀ SUMMA</span>
                  <span className="gt-value">{formatEuro(results.grandTotal)}</span>
                </div>

                <div className="result-row"><span>Materiāli</span><b>{formatEuro(results.totalMaterials)}</b></div>
                <div className="result-row"><span>Darbs</span><b>{formatEuro(results.totalWork)}</b></div>
                <div className="result-row"><span>Sastatnes / piekļuve</span><b>{formatEuro(results.scaffoldingCost)}</b></div>
                <div className="result-row"><span>Ailes un cokols</span><b>{formatEuro(results.revealCost + results.socleCost)}</b></div>
                <div className="result-row"><span>Rezerve</span><b>{formatEuro(results.reserve)}</b></div>
                <div className="result-row"><span>Cena par m²</span><b>{formatEuro(results.pricePerSquareMeter)}</b></div>

                <CalculatorLeadCta
                  calculatorId="facade"
                  calculatorTitle="Fasādes un siltināšanas tāme"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Platība', value: `${params.area} m²` },
                    { label: 'Siltinājums', value: INSULATION_SYSTEMS[params.insulationType].name },
                    { label: 'Apdare', value: FINISH_TYPES[params.finishType].name },
                    { label: 'Stāvoklis', value: WALL_CONDITIONS[params.condition].name },
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
