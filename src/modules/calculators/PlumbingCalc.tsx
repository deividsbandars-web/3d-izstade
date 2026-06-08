import { useState } from 'react';
import { COUNTRIES, renderCountryOptions } from '../../core/constants';
import '../../components/calculator/styles/CalculatorPro.css';
import { CalculatorLeadCta } from './CalculatorLeadCta';

type PlumbingParams = {
  appliancePoints: number;
  bathroomPoints: number;
  boilerCount: number;
  country: keyof typeof COUNTRIES;
  demolition: boolean;
  drainageMeters: number;
  kitchenPoints: number;
  pipeMeters: number;
  pipeType: keyof typeof PIPE_TYPES;
  projectType: keyof typeof PROJECT_TYPES;
  wallAccess: keyof typeof WALL_ACCESS_TYPES;
  wcPoints: number;
};

type PlumbingResults = {
  applianceCost: number;
  boilerCost: number;
  demolitionCost: number;
  drainageCost: number;
  fixtureCost: number;
  grandTotal: number;
  logistics: number;
  pipeCost: number;
  pricePerPoint: number;
  reserve: number;
  totalMaterials: number;
  totalPoints: number;
  totalWork: number;
};

const PROJECT_TYPES = {
  apartment_refresh: { logistics: 90, name: 'Dzīvokļa santehnikas atjaunošana', multiplier: 0.95 },
  bathroom_renovation: { logistics: 150, name: 'Vannas istabas renovācija', multiplier: 1 },
  full_house: { logistics: 260, name: 'Privātmājas ūdensvads un kanalizācija', multiplier: 1.18 },
  commercial: { logistics: 340, name: 'Birojs / komerctelpa', multiplier: 1.24 },
} as const;

const PIPE_TYPES = {
  ppr: { materialPerMeter: 7, name: 'PPR polipropilēna caurules', workPerMeter: 7 },
  composite: { materialPerMeter: 12, name: 'Daudzslāņu kompozīta caurules', workPerMeter: 8 },
  copper: { materialPerMeter: 25, name: 'Vara caurules', workPerMeter: 14 },
  press: { materialPerMeter: 19, name: 'Presējamā sistēma renovācijai', workPerMeter: 10 },
} as const;

const WALL_ACCESS_TYPES = {
  open: { name: 'Atvērtas sienas / viegla piekļuve', multiplier: 0.88, prepPerPoint: 12 },
  normal: { name: 'Standarta piekļuve', multiplier: 1, prepPerPoint: 22 },
  chase: { name: 'Štrobes betonā / mūrī', multiplier: 1.24, prepPerPoint: 42 },
  difficult: { name: 'Sarežģīta renovācija / šauras vietas', multiplier: 1.38, prepPerPoint: 58 },
} as const;

const FIXTURE_PRICES = {
  appliance: { material: 36, work: 42 },
  bathroom: { material: 145, work: 132 },
  boiler: { material: 210, work: 150 },
  kitchen: { material: 92, work: 84 },
  wc: { material: 118, work: 96 },
} as const;

const MINIMUM_PROJECT_TOTAL = 620;

function formatEuro(value: number) {
  return `${Math.round(value).toLocaleString('lv-LV')} €`;
}

function clampNumber(value: number, min: number) {
  return Number.isFinite(value) ? Math.max(min, value) : min;
}

export default function PlumbingCalc() {
  const [params, setParams] = useState<PlumbingParams>({
    appliancePoints: 2,
    bathroomPoints: 3,
    boilerCount: 1,
    country: 'lv',
    demolition: true,
    drainageMeters: 16,
    kitchenPoints: 1,
    pipeMeters: 42,
    pipeType: 'composite',
    projectType: 'bathroom_renovation',
    wallAccess: 'normal',
    wcPoints: 1,
  });
  const [results, setResults] = useState<PlumbingResults | null>(null);

  const updateParam = <Key extends keyof PlumbingParams>(key: Key, value: PlumbingParams[Key]) => {
    setParams((current) => ({ ...current, [key]: value }));
  };

  const handleCalculate = () => {
    const country = COUNTRIES[params.country];
    const pipe = PIPE_TYPES[params.pipeType];
    const project = PROJECT_TYPES[params.projectType];
    const wallAccess = WALL_ACCESS_TYPES[params.wallAccess];

    const bathroomPoints = clampNumber(params.bathroomPoints, 0);
    const wcPoints = clampNumber(params.wcPoints, 0);
    const kitchenPoints = clampNumber(params.kitchenPoints, 0);
    const appliancePoints = clampNumber(params.appliancePoints, 0);
    const boilerCount = clampNumber(params.boilerCount, 0);
    const pipeMeters = clampNumber(params.pipeMeters, 0);
    const drainageMeters = clampNumber(params.drainageMeters, 0);
    const totalPoints = Math.max(bathroomPoints + wcPoints + kitchenPoints + appliancePoints + boilerCount, 1);

    const fixtureMaterial =
      bathroomPoints * FIXTURE_PRICES.bathroom.material +
      wcPoints * FIXTURE_PRICES.wc.material +
      kitchenPoints * FIXTURE_PRICES.kitchen.material +
      appliancePoints * FIXTURE_PRICES.appliance.material +
      boilerCount * FIXTURE_PRICES.boiler.material;

    const fixtureWork =
      bathroomPoints * FIXTURE_PRICES.bathroom.work +
      wcPoints * FIXTURE_PRICES.wc.work +
      kitchenPoints * FIXTURE_PRICES.kitchen.work +
      appliancePoints * FIXTURE_PRICES.appliance.work +
      boilerCount * FIXTURE_PRICES.boiler.work;

    const pipeCost = pipeMeters * (pipe.materialPerMeter * country.matMult + pipe.workPerMeter * wallAccess.multiplier * country.workMult);
    const drainageCost = drainageMeters * (11 * country.matMult + 13 * wallAccess.multiplier * country.workMult);
    const fixtureCost = fixtureMaterial * country.matMult + fixtureWork * wallAccess.multiplier * country.workMult;
    const applianceCost = appliancePoints * 42 * country.workMult;
    const boilerCost = boilerCount * 65 * country.workMult;
    const prepCost = totalPoints * wallAccess.prepPerPoint * country.workMult;
    const demolitionCost = params.demolition ? totalPoints * 38 * wallAccess.multiplier * country.workMult : 0;
    const logistics = project.logistics * (totalPoints > 8 ? 1.25 : 1) * country.workMult;

    const totalMaterials = fixtureMaterial * country.matMult + pipeMeters * pipe.materialPerMeter * country.matMult + drainageMeters * 11 * country.matMult;
    const totalWork = (fixtureWork + pipeMeters * pipe.workPerMeter + drainageMeters * 13) * wallAccess.multiplier * project.multiplier * country.workMult + applianceCost + boilerCost + prepCost + demolitionCost;
    const reserve = (totalMaterials + totalWork + logistics) * 0.08;
    const calculatedTotal = totalMaterials + totalWork + logistics + reserve;
    const grandTotal = Math.max(calculatedTotal, MINIMUM_PROJECT_TOTAL * country.workMult);

    setResults({
      applianceCost,
      boilerCost,
      demolitionCost,
      drainageCost,
      fixtureCost,
      grandTotal,
      logistics,
      pipeCost,
      pricePerPoint: grandTotal / totalPoints,
      reserve,
      totalMaterials,
      totalPoints,
      totalWork,
    });
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO Santehnikas Tāme</h1>
        <p>Sanitārie punkti, virtuves pieslēgumi, boileris, ūdensvada un kanalizācijas metri, sienu piekļuve un demontāža vienā aprēķinā.</p>
      </div>

      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>Objekts un punkti</h2>
            <div className="input-group">
              <label>
                Reģions
                <select value={params.country} onChange={(event) => updateParam('country', event.target.value as PlumbingParams['country'])}>
                  {renderCountryOptions()}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Projekta tips
                <select value={params.projectType} onChange={(event) => updateParam('projectType', event.target.value as PlumbingParams['projectType'])}>
                  {Object.entries(PROJECT_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Vannas/dušas punkti
                <input min="0" onChange={(event) => updateParam('bathroomPoints', Number(event.target.value))} type="number" value={params.bathroomPoints} />
              </label>

              <label style={{ marginTop: '20px' }}>
                WC / izlietnes punkti
                <input min="0" onChange={(event) => updateParam('wcPoints', Number(event.target.value))} type="number" value={params.wcPoints} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Virtuves pieslēgumi
                <input min="0" onChange={(event) => updateParam('kitchenPoints', Number(event.target.value))} type="number" value={params.kitchenPoints} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Ierīču pieslēgumi
                <input min="0" onChange={(event) => updateParam('appliancePoints', Number(event.target.value))} type="number" value={params.appliancePoints} />
              </label>
            </div>
          </section>

          <section className="calc-section">
            <h2>Caurules un sarežģītība</h2>
            <div className="input-group">
              <label>
                Cauruļvadu materiāls
                <select value={params.pipeType} onChange={(event) => updateParam('pipeType', event.target.value as PlumbingParams['pipeType'])}>
                  {Object.entries(PIPE_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Ūdensvada metri
                <input min="0" onChange={(event) => updateParam('pipeMeters', Number(event.target.value))} type="number" value={params.pipeMeters} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Kanalizācijas metri
                <input min="0" onChange={(event) => updateParam('drainageMeters', Number(event.target.value))} type="number" value={params.drainageMeters} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Boileru skaits
                <input min="0" onChange={(event) => updateParam('boilerCount', Number(event.target.value))} type="number" value={params.boilerCount} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Sienu / piekļuves sarežģītība
                <select value={params.wallAccess} onChange={(event) => updateParam('wallAccess', event.target.value as PlumbingParams['wallAccess'])}>
                  {Object.entries(WALL_ACCESS_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ alignItems: 'center', display: 'flex', gap: '10px', marginTop: '20px' }}>
                <input checked={params.demolition} onChange={(event) => updateParam('demolition', event.target.checked)} type="checkbox" />
                Iekļaut veco pieslēgumu demontāžu
              </label>
            </div>
          </section>

          <button className="btn-primary" onClick={handleCalculate} style={{ width: '100%', padding: '18px' }}>
            APRĒĶINĀT SANTEHNIKAS TĀMI
          </button>
        </div>

        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Santehnikas specifikācija</h3>
            {!results ? (
              <div className="empty-state">Norādi punktus, cauruļvadu metrus un sienu sarežģītību.</div>
            ) : (
              <>
                <div className="grand-total-box">
                  <span className="gt-label">PROGNOZĒTĀ SUMMA</span>
                  <span className="gt-value">{formatEuro(results.grandTotal)}</span>
                </div>

                <div className="result-row"><span>Materiāli</span><b>{formatEuro(results.totalMaterials)}</b></div>
                <div className="result-row"><span>Darbs</span><b>{formatEuro(results.totalWork)}</b></div>
                <div className="result-row"><span>Sanitārie punkti</span><b>{formatEuro(results.fixtureCost)}</b></div>
                <div className="result-row"><span>Caurules / kanalizācija</span><b>{formatEuro(results.pipeCost + results.drainageCost)}</b></div>
                <div className="result-row"><span>Demontāža</span><b>{formatEuro(results.demolitionCost)}</b></div>
                <div className="result-row"><span>Loģistika / rezerve</span><b>{formatEuro(results.logistics + results.reserve)}</b></div>
                <div className="result-row"><span>Cena par punktu</span><b>{formatEuro(results.pricePerPoint)}</b></div>

                <CalculatorLeadCta
                  calculatorId="plumbing"
                  calculatorTitle="Santehnikas tāme"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Punkti', value: `${results.totalPoints}` },
                    { label: 'Projekts', value: PROJECT_TYPES[params.projectType].name },
                    { label: 'Caurules', value: PIPE_TYPES[params.pipeType].name },
                    { label: 'Piekļuve', value: WALL_ACCESS_TYPES[params.wallAccess].name },
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
