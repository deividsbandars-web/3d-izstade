import { useState } from 'react';
import { COUNTRIES, renderCountryOptions } from '../../core/constants';
import '../../components/calculator/styles/CalculatorPro.css';
import { CalculatorLeadCta } from './CalculatorLeadCta';

type WindowsParams = {
  averageSize: keyof typeof WINDOW_SIZE_OPTIONS;
  balconyDoorCount: number;
  country: keyof typeof COUNTRIES;
  demolition: boolean;
  exteriorFlashing: boolean;
  glazingType: keyof typeof GLAZING_TYPES;
  insectScreenCount: number;
  installationScope: keyof typeof INSTALLATION_SCOPES;
  interiorFinishing: boolean;
  openingType: keyof typeof OPENING_TYPES;
  profileType: keyof typeof PROFILE_TYPES;
  revealMeters: number;
  sillMeters: number;
  windowCount: number;
};

type WindowsResults = {
  demolitionCost: number;
  finishingCost: number;
  grandTotal: number;
  installationWork: number;
  logistics: number;
  pricePerUnit: number;
  profileMaterials: number;
  reserve: number;
  sillAndFlashingCost: number;
  totalMaterials: number;
  totalUnits: number;
  totalWork: number;
  windowArea: number;
};

const PROFILE_TYPES = {
  pvc_standard: { materialPerSquareMeter: 155, name: 'PVC 2-stiklu standarta profils' },
  pvc_warm: { materialPerSquareMeter: 215, name: 'PVC 3-stiklu energoefektīvs profils' },
  wood: { materialPerSquareMeter: 335, name: 'Koka logi / līmētais koks' },
  aluminum: { materialPerSquareMeter: 430, name: 'Alumīnija konstrukcijas' },
  wood_aluminum: { materialPerSquareMeter: 520, name: 'Koks-alumīnijs premium risinājums' },
} as const;

const GLAZING_TYPES = {
  double: { multiplier: 1, name: '2-stiklu pakete' },
  triple: { multiplier: 1.18, name: '3-stiklu siltā pakete' },
  acoustic: { multiplier: 1.28, name: 'Akustiska / ielas trokšņa pakete' },
  solar: { multiplier: 1.34, name: 'Saules kontroles stiklojums' },
} as const;

const WINDOW_SIZE_OPTIONS = {
  small: { area: 1.2, name: 'Mazs logs ap 1.2 m²' },
  standard: { area: 2.1, name: 'Standarta logs ap 1.5 x 1.4 m' },
  large: { area: 3.2, name: 'Liels logs / vitrīna ap 3.2 m²' },
  mixed: { area: 2.45, name: 'Jaukts dzīvoklis / māja' },
} as const;

const OPENING_TYPES = {
  fixed: { hardwarePerUnit: 26, name: 'Fiksēti / neatverami', workMultiplier: 0.9 },
  tilt_turn: { hardwarePerUnit: 68, name: 'Verami-atgāžami', workMultiplier: 1 },
  sliding: { hardwarePerUnit: 210, name: 'Bīdāmās sistēmas', workMultiplier: 1.24 },
} as const;

const INSTALLATION_SCOPES = {
  delivery_only: { logistics: 90, name: 'Tikai piegāde / bez montāžas', workPerUnit: 0 },
  standard: { logistics: 150, name: 'Standarta montāža', workPerUnit: 72 },
  warm_tape: { logistics: 190, name: 'Siltais montāžas mezgls ar lentām', workPerUnit: 108 },
  renovation: { logistics: 260, name: 'Renovācija ar ailu pielabošanu', workPerUnit: 132 },
} as const;

const BALCONY_DOOR_AREA = 2.2;
const BALCONY_DOOR_HARDWARE = 165;
const MINIMUM_PROJECT_TOTAL = 680;

function formatEuro(value: number) {
  return `${Math.round(value).toLocaleString('lv-LV')} €`;
}

function clampNumber(value: number, min: number) {
  return Number.isFinite(value) ? Math.max(min, value) : min;
}

export default function WindowsCalc() {
  const [params, setParams] = useState<WindowsParams>({
    averageSize: 'standard',
    balconyDoorCount: 1,
    country: 'lv',
    demolition: true,
    exteriorFlashing: true,
    glazingType: 'triple',
    insectScreenCount: 2,
    installationScope: 'warm_tape',
    interiorFinishing: true,
    openingType: 'tilt_turn',
    profileType: 'pvc_warm',
    revealMeters: 18,
    sillMeters: 9,
    windowCount: 6,
  });
  const [results, setResults] = useState<WindowsResults | null>(null);

  const updateParam = <Key extends keyof WindowsParams>(key: Key, value: WindowsParams[Key]) => {
    setParams((current) => ({ ...current, [key]: value }));
  };

  const handleCalculate = () => {
    const country = COUNTRIES[params.country];
    const profile = PROFILE_TYPES[params.profileType];
    const glazing = GLAZING_TYPES[params.glazingType];
    const averageSize = WINDOW_SIZE_OPTIONS[params.averageSize];
    const opening = OPENING_TYPES[params.openingType];
    const installation = INSTALLATION_SCOPES[params.installationScope];

    const windowCount = clampNumber(params.windowCount, 0);
    const balconyDoorCount = clampNumber(params.balconyDoorCount, 0);
    const totalUnits = Math.max(windowCount + balconyDoorCount, 1);
    const windowArea = windowCount * averageSize.area + balconyDoorCount * BALCONY_DOOR_AREA;
    const sillMeters = clampNumber(params.sillMeters, 0);
    const revealMeters = clampNumber(params.revealMeters, 0);
    const insectScreenCount = clampNumber(params.insectScreenCount, 0);

    const profileMaterials = windowArea * profile.materialPerSquareMeter * glazing.multiplier * country.matMult;
    const hardwareCost = (windowCount * opening.hardwarePerUnit + balconyDoorCount * BALCONY_DOOR_HARDWARE) * country.matMult;
    const insectScreenCost = insectScreenCount * 42 * country.matMult;
    const installationWork = totalUnits * installation.workPerUnit * opening.workMultiplier * country.workMult;
    const demolitionCost = params.demolition ? totalUnits * 42 * country.workMult : 0;
    const sillAndFlashingCost = sillMeters * (22 * country.matMult + 13 * country.workMult) + (params.exteriorFlashing ? totalUnits * 38 * country.matMult : 0);
    const finishingCost = params.interiorFinishing ? revealMeters * (7 * country.matMult + 15 * country.workMult) : 0;
    const logistics = installation.logistics * (totalUnits > 10 ? 1.25 : 1) * country.workMult;

    const totalMaterials = profileMaterials + hardwareCost + insectScreenCost + sillMeters * 22 * country.matMult + (params.exteriorFlashing ? totalUnits * 38 * country.matMult : 0);
    const totalWork = installationWork + demolitionCost + sillMeters * 13 * country.workMult + finishingCost + (params.interiorFinishing ? 0 : revealMeters * 5 * country.workMult);
    const reserve = (totalMaterials + totalWork + logistics) * 0.07;
    const calculatedTotal = totalMaterials + totalWork + logistics + reserve;
    const grandTotal = Math.max(calculatedTotal, MINIMUM_PROJECT_TOTAL * country.workMult);

    setResults({
      demolitionCost,
      finishingCost,
      grandTotal,
      installationWork,
      logistics,
      pricePerUnit: grandTotal / totalUnits,
      profileMaterials,
      reserve,
      sillAndFlashingCost,
      totalMaterials,
      totalUnits,
      totalWork,
      windowArea,
    });
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO Logu un Durvju Tāme</h1>
        <p>Profils, stiklojums, logu izmērs, balkona durvis, montāžas mezgls, palodzes, ailes un demontāža vienā aprēķinā.</p>
      </div>

      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>Konstrukcijas</h2>
            <div className="input-group">
              <label>
                Reģions
                <select value={params.country} onChange={(event) => updateParam('country', event.target.value as WindowsParams['country'])}>
                  {renderCountryOptions()}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Logu skaits
                <input min="0" onChange={(event) => updateParam('windowCount', Number(event.target.value))} type="number" value={params.windowCount} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Balkona / terases durvis
                <input min="0" onChange={(event) => updateParam('balconyDoorCount', Number(event.target.value))} type="number" value={params.balconyDoorCount} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Vidējais loga izmērs
                <select value={params.averageSize} onChange={(event) => updateParam('averageSize', event.target.value as WindowsParams['averageSize'])}>
                  {Object.entries(WINDOW_SIZE_OPTIONS).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Profila tips
                <select value={params.profileType} onChange={(event) => updateParam('profileType', event.target.value as WindowsParams['profileType'])}>
                  {Object.entries(PROFILE_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="calc-section">
            <h2>Montāža un apdare</h2>
            <div className="input-group">
              <label>
                Stiklojums
                <select value={params.glazingType} onChange={(event) => updateParam('glazingType', event.target.value as WindowsParams['glazingType'])}>
                  {Object.entries(GLAZING_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Atvēruma tips
                <select value={params.openingType} onChange={(event) => updateParam('openingType', event.target.value as WindowsParams['openingType'])}>
                  {Object.entries(OPENING_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Montāžas līmenis
                <select value={params.installationScope} onChange={(event) => updateParam('installationScope', event.target.value as WindowsParams['installationScope'])}>
                  {Object.entries(INSTALLATION_SCOPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Palodzes (m)
                <input min="0" onChange={(event) => updateParam('sillMeters', Number(event.target.value))} type="number" value={params.sillMeters} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Ailu apdare (m)
                <input min="0" onChange={(event) => updateParam('revealMeters', Number(event.target.value))} type="number" value={params.revealMeters} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Moskītu sieti
                <input min="0" onChange={(event) => updateParam('insectScreenCount', Number(event.target.value))} type="number" value={params.insectScreenCount} />
              </label>

              <label style={{ alignItems: 'center', display: 'flex', gap: '10px', marginTop: '20px' }}>
                <input checked={params.demolition} onChange={(event) => updateParam('demolition', event.target.checked)} type="checkbox" />
                Iekļaut veco logu demontāžu un izvešanu
              </label>

              <label style={{ alignItems: 'center', display: 'flex', gap: '10px', marginTop: '20px' }}>
                <input checked={params.interiorFinishing} onChange={(event) => updateParam('interiorFinishing', event.target.checked)} type="checkbox" />
                Iekļaut iekšējo ailu apdari
              </label>

              <label style={{ alignItems: 'center', display: 'flex', gap: '10px', marginTop: '20px' }}>
                <input checked={params.exteriorFlashing} onChange={(event) => updateParam('exteriorFlashing', event.target.checked)} type="checkbox" />
                Iekļaut ārējās pieslēguma skārda detaļas
              </label>
            </div>
          </section>

          <button className="btn-primary" onClick={handleCalculate} style={{ width: '100%', padding: '18px' }}>
            APRĒĶINĀT LOGU TĀMI
          </button>
        </div>

        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Logu un durvju specifikācija</h3>
            {!results ? (
              <div className="empty-state">Norādi logu skaitu, profilu, stiklojumu un montāžas līmeni.</div>
            ) : (
              <>
                <div className="grand-total-box">
                  <span className="gt-label">PROGNOZĒTĀ SUMMA</span>
                  <span className="gt-value">{formatEuro(results.grandTotal)}</span>
                </div>

                <div className="result-row"><span>Konstrukcijas un stiklojums</span><b>{formatEuro(results.profileMaterials)}</b></div>
                <div className="result-row"><span>Montāža</span><b>{formatEuro(results.installationWork)}</b></div>
                <div className="result-row"><span>Demontāža</span><b>{formatEuro(results.demolitionCost)}</b></div>
                <div className="result-row"><span>Palodzes / skārds / ailes</span><b>{formatEuro(results.sillAndFlashingCost + results.finishingCost)}</b></div>
                <div className="result-row"><span>Loģistika / rezerve</span><b>{formatEuro(results.logistics + results.reserve)}</b></div>
                <div className="result-row"><span>Aptuvenā platība</span><b>{results.windowArea.toFixed(1)} m²</b></div>
                <div className="result-row"><span>Cena par vienību</span><b>{formatEuro(results.pricePerUnit)}</b></div>

                <CalculatorLeadCta
                  calculatorId="windows"
                  calculatorTitle="Logu un durvju tāme"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Vienības', value: `${results.totalUnits}` },
                    { label: 'Profils', value: PROFILE_TYPES[params.profileType].name },
                    { label: 'Stiklojums', value: GLAZING_TYPES[params.glazingType].name },
                    { label: 'Montāža', value: INSTALLATION_SCOPES[params.installationScope].name },
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
