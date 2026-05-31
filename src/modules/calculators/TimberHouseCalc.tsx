import { useState } from 'react';
import { COUNTRIES, renderCountryOptions } from '../../core/constants';
import '../../components/calculator/styles/CalculatorPro.css';
import { CalculatorLeadCta } from './CalculatorLeadCta';

type TimberParams = {
  area: number;
  country: keyof typeof COUNTRIES;
  facadeType: keyof typeof FACADE_TYPES;
  foundationType: keyof typeof FOUNDATION_TYPES;
  includeDesignPackage: boolean;
  includeGutters: boolean;
  insulationLevel: keyof typeof INSULATION_LEVELS;
  interiorLevel: keyof typeof INTERIOR_LEVELS;
  openingsCount: number;
  packageLevel: keyof typeof PACKAGE_LEVELS;
  projectType: keyof typeof PROJECT_TYPES;
  roofType: keyof typeof ROOF_TYPES;
  siteAccess: keyof typeof SITE_ACCESS_TYPES;
  terraceArea: number;
};

type TimberResults = {
  designCost: number;
  facadeCost: number;
  foundationCost: number;
  grandTotal: number;
  gutterCost: number;
  insulationCost: number;
  interiorCost: number;
  logistics: number;
  openingsCost: number;
  pricePerSquareMeter: number;
  reserve: number;
  roofCost: number;
  structureCost: number;
  terraceCost: number;
  totalMaterials: number;
  totalWork: number;
};

const PROJECT_TYPES = {
  terrace_canopy: { logistics: 120, minimumTotal: 1800, multiplier: 0.72, name: 'Terase / nojume / pergola' },
  garden_room: { logistics: 180, minimumTotal: 3200, multiplier: 0.9, name: 'Dārza ēka / biroja namiņš' },
  sauna_house: { logistics: 240, minimumTotal: 5200, multiplier: 1.08, name: 'Pirts vai atpūtas māja' },
  frame_house: { logistics: 360, minimumTotal: 12000, multiplier: 1.18, name: 'Koka karkasa dzīvojamā māja' },
  commercial_pavilion: { logistics: 430, minimumTotal: 9500, multiplier: 1.26, name: 'Komerciāla paviljona konstrukcija' },
} as const;

const PACKAGE_LEVELS = {
  frame_only: { material: 92, name: 'Tikai nesošais karkass', work: 58 },
  weather_tight: { material: 165, name: 'Aizvērta čaula / vēja plēves', work: 92 },
  insulated_shell: { material: 255, name: 'Siltināta čaula', work: 138 },
  full_finish: { material: 520, name: 'Pilna ārējā un iekšējā apdare', work: 270 },
} as const;

const FOUNDATION_TYPES = {
  blocks: { material: 18, name: 'Betona bloki / viegla konstrukcija', work: 14 },
  screw_piles: { material: 36, name: 'Skrūvpāļi', work: 22 },
  strip: { material: 62, name: 'Lentveida pamati', work: 38 },
  slab: { material: 84, name: 'Siltināta betona plātne', work: 46 },
} as const;

const ROOF_TYPES = {
  flat_bitumen: { material: 44, name: 'Plakans jumts / bitumena segums', work: 28 },
  metal_gable: { material: 58, name: 'Divslīpju metāla jumts', work: 34 },
  tile_roof: { material: 82, name: 'Dakstiņu / premium jumts', work: 44 },
  terrace_roof: { material: 36, name: 'Nojumes jumts / polikarbonāts', work: 24 },
} as const;

const INSULATION_LEVELS = {
  none: { material: 0, name: 'Bez papildu siltinājuma', work: 0 },
  standard: { material: 42, name: 'Standarta vate 150 mm', work: 24 },
  warm: { material: 58, name: 'Energoefektīva vate 200 mm', work: 28 },
  premium: { material: 78, name: 'Premium siltinājums + tvaika mezgli', work: 36 },
} as const;

const FACADE_TYPES = {
  none: { material: 0, name: 'Bez fasādes apdares', work: 0 },
  timber_board: { material: 32, name: 'Koka dēļu fasāde', work: 24 },
  painted_panel: { material: 38, name: 'Krāsots panelis / lokšņu apdare', work: 26 },
  thermo_wood: { material: 58, name: 'Termokoks / premium fasāde', work: 34 },
  fiber_cement: { material: 64, name: 'Šķiedrcementa plāksnes', work: 38 },
} as const;

const INTERIOR_LEVELS = {
  none: { material: 0, name: 'Bez iekšdarbiem', work: 0 },
  rough: { material: 42, name: 'OSB / melnā apdare', work: 26 },
  basic: { material: 82, name: 'Sienas, griesti un grīdas sagatave', work: 48 },
  finished: { material: 145, name: 'Pilna iekšējā apdare', work: 82 },
} as const;

const SITE_ACCESS_TYPES = {
  easy: { logisticsMultiplier: 0.9, name: 'Viegla piekļuve tehnikai', workMultiplier: 0.94 },
  normal: { logisticsMultiplier: 1, name: 'Standarta objekts', workMultiplier: 1 },
  tight: { logisticsMultiplier: 1.22, name: 'Šaura piekļuve / pilsētas pagalms', workMultiplier: 1.18 },
  remote: { logisticsMultiplier: 1.35, name: 'Attāls objekts / sarežģīta loģistika', workMultiplier: 1.24 },
} as const;

const OPENING_MATERIAL_COST = 135;
const OPENING_WORK_COST = 72;

function formatEuro(value: number) {
  return `${Math.round(value).toLocaleString('lv-LV')} €`;
}

function clampNumber(value: number, min: number) {
  return Number.isFinite(value) ? Math.max(min, value) : min;
}

export default function TimberHouseCalc() {
  const [params, setParams] = useState<TimberParams>({
    area: 72,
    country: 'lv',
    facadeType: 'timber_board',
    foundationType: 'screw_piles',
    includeDesignPackage: true,
    includeGutters: true,
    insulationLevel: 'standard',
    interiorLevel: 'basic',
    openingsCount: 8,
    packageLevel: 'insulated_shell',
    projectType: 'garden_room',
    roofType: 'metal_gable',
    siteAccess: 'normal',
    terraceArea: 18,
  });
  const [results, setResults] = useState<TimberResults | null>(null);

  const updateParam = <Key extends keyof TimberParams>(key: Key, value: TimberParams[Key]) => {
    setParams((current) => ({ ...current, [key]: value }));
  };

  const handleCalculate = () => {
    const country = COUNTRIES[params.country];
    const project = PROJECT_TYPES[params.projectType];
    const packageLevel = PACKAGE_LEVELS[params.packageLevel];
    const foundation = FOUNDATION_TYPES[params.foundationType];
    const roof = ROOF_TYPES[params.roofType];
    const insulation = INSULATION_LEVELS[params.insulationLevel];
    const facade = FACADE_TYPES[params.facadeType];
    const interior = INTERIOR_LEVELS[params.interiorLevel];
    const access = SITE_ACCESS_TYPES[params.siteAccess];

    const area = clampNumber(params.area, 1);
    const terraceArea = clampNumber(params.terraceArea, 0);
    const openingsCount = clampNumber(params.openingsCount, 0);
    const roofArea = area * 1.14 + terraceArea * 0.55;
    const facadeArea = area * 1.75;

    const structureMaterials = area * packageLevel.material * project.multiplier * country.matMult;
    const structureWork = area * packageLevel.work * project.multiplier * access.workMultiplier * country.workMult;
    const foundationCost = area * (foundation.material * country.matMult + foundation.work * access.workMultiplier * country.workMult);
    const roofCost = roofArea * (roof.material * country.matMult + roof.work * access.workMultiplier * country.workMult);
    const insulationCost = area * (insulation.material * country.matMult + insulation.work * access.workMultiplier * country.workMult);
    const facadeCost = facadeArea * (facade.material * country.matMult + facade.work * access.workMultiplier * country.workMult);
    const interiorCost = area * (interior.material * country.matMult + interior.work * access.workMultiplier * country.workMult);
    const terraceCost = terraceArea * (42 * country.matMult + 34 * access.workMultiplier * country.workMult);
    const openingsCost = openingsCount * (OPENING_MATERIAL_COST * country.matMult + OPENING_WORK_COST * access.workMultiplier * country.workMult);
    const gutterCost = params.includeGutters ? roofArea * 8 * country.matMult + roofArea * 4 * country.workMult : 0;
    const designCost = params.includeDesignPackage ? Math.max(420 * country.workMult, area * 8 * country.workMult) : 0;
    const logistics = project.logistics * access.logisticsMultiplier * (area > 120 ? 1.25 : 1) * country.workMult;

    const totalMaterials =
      structureMaterials +
      area * foundation.material * country.matMult +
      roofArea * roof.material * country.matMult +
      area * insulation.material * country.matMult +
      facadeArea * facade.material * country.matMult +
      area * interior.material * country.matMult +
      terraceArea * 42 * country.matMult +
      openingsCount * OPENING_MATERIAL_COST * country.matMult +
      (params.includeGutters ? roofArea * 8 * country.matMult : 0);

    const totalWork =
      structureWork +
      area * foundation.work * access.workMultiplier * country.workMult +
      roofArea * roof.work * access.workMultiplier * country.workMult +
      area * insulation.work * access.workMultiplier * country.workMult +
      facadeArea * facade.work * access.workMultiplier * country.workMult +
      area * interior.work * access.workMultiplier * country.workMult +
      terraceArea * 34 * access.workMultiplier * country.workMult +
      openingsCount * OPENING_WORK_COST * access.workMultiplier * country.workMult +
      (params.includeGutters ? roofArea * 4 * country.workMult : 0) +
      designCost;

    const reserve = (totalMaterials + totalWork + logistics) * 0.08;
    const calculatedTotal = totalMaterials + totalWork + logistics + reserve;
    const grandTotal = Math.max(calculatedTotal, project.minimumTotal * country.workMult);

    setResults({
      designCost,
      facadeCost,
      foundationCost,
      grandTotal,
      gutterCost,
      insulationCost,
      interiorCost,
      logistics,
      openingsCost,
      pricePerSquareMeter: grandTotal / area,
      reserve,
      roofCost,
      structureCost: structureMaterials + structureWork,
      terraceCost,
      totalMaterials,
      totalWork,
    });
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO Koka Karkasa un Nojumes Tāme</h1>
        <p>Karkass, pamati, jumts, siltinājums, fasāde, iekšdarbi, terase/nojume un objekta piekļuve vienā aprēķinā.</p>
      </div>

      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>Būves tips un apjoms</h2>
            <div className="input-group">
              <label>
                Reģions
                <select value={params.country} onChange={(event) => updateParam('country', event.target.value as TimberParams['country'])}>
                  {renderCountryOptions()}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Projekta tips
                <select value={params.projectType} onChange={(event) => updateParam('projectType', event.target.value as TimberParams['projectType'])}>
                  {Object.entries(PROJECT_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Slēgtā platība (m²)
                <input min="10" onChange={(event) => updateParam('area', Number(event.target.value))} type="number" value={params.area} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Terase / nojume (m²)
                <input min="0" onChange={(event) => updateParam('terraceArea', Number(event.target.value))} type="number" value={params.terraceArea} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Paketes līmenis
                <select value={params.packageLevel} onChange={(event) => updateParam('packageLevel', event.target.value as TimberParams['packageLevel'])}>
                  {Object.entries(PACKAGE_LEVELS).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="calc-section">
            <h2>Konstrukcija un apdare</h2>
            <div className="input-group">
              <label>
                Pamatu risinājums
                <select value={params.foundationType} onChange={(event) => updateParam('foundationType', event.target.value as TimberParams['foundationType'])}>
                  {Object.entries(FOUNDATION_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Jumta tips
                <select value={params.roofType} onChange={(event) => updateParam('roofType', event.target.value as TimberParams['roofType'])}>
                  {Object.entries(ROOF_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Siltinājums
                <select value={params.insulationLevel} onChange={(event) => updateParam('insulationLevel', event.target.value as TimberParams['insulationLevel'])}>
                  {Object.entries(INSULATION_LEVELS).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Fasāde
                <select value={params.facadeType} onChange={(event) => updateParam('facadeType', event.target.value as TimberParams['facadeType'])}>
                  {Object.entries(FACADE_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Iekšdarbi
                <select value={params.interiorLevel} onChange={(event) => updateParam('interiorLevel', event.target.value as TimberParams['interiorLevel'])}>
                  {Object.entries(INTERIOR_LEVELS).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Logi / durvis / ailes
                <input min="0" onChange={(event) => updateParam('openingsCount', Number(event.target.value))} type="number" value={params.openingsCount} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Objekta piekļuve
                <select value={params.siteAccess} onChange={(event) => updateParam('siteAccess', event.target.value as TimberParams['siteAccess'])}>
                  {Object.entries(SITE_ACCESS_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ alignItems: 'center', display: 'flex', gap: '10px', marginTop: '20px' }}>
                <input checked={params.includeDesignPackage} onChange={(event) => updateParam('includeDesignPackage', event.target.checked)} type="checkbox" />
                Iekļaut skiču / mezglu sagatavošanu
              </label>

              <label style={{ alignItems: 'center', display: 'flex', gap: '10px', marginTop: '20px' }}>
                <input checked={params.includeGutters} onChange={(event) => updateParam('includeGutters', event.target.checked)} type="checkbox" />
                Iekļaut noteksistēmu
              </label>
            </div>
          </section>

          <button className="btn-primary" onClick={handleCalculate} style={{ width: '100%', padding: '18px' }}>
            APRĒĶINĀT KOKA BŪVES TĀMI
          </button>
        </div>

        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Koka būves specifikācija</h3>
            {!results ? (
              <div className="empty-state">Norādi platību, būves tipu un paketes līmeni.</div>
            ) : (
              <>
                <div className="grand-total-box">
                  <span className="gt-label">PROGNOZĒTĀ SUMMA</span>
                  <span className="gt-value">{formatEuro(results.grandTotal)}</span>
                </div>

                <div className="result-row"><span>Materiāli</span><b>{formatEuro(results.totalMaterials)}</b></div>
                <div className="result-row"><span>Darbs</span><b>{formatEuro(results.totalWork)}</b></div>
                <div className="result-row"><span>Karkass</span><b>{formatEuro(results.structureCost)}</b></div>
                <div className="result-row"><span>Pamati + jumts</span><b>{formatEuro(results.foundationCost + results.roofCost)}</b></div>
                <div className="result-row"><span>Siltinājums + fasāde</span><b>{formatEuro(results.insulationCost + results.facadeCost)}</b></div>
                <div className="result-row"><span>Iekšdarbi + terase</span><b>{formatEuro(results.interiorCost + results.terraceCost)}</b></div>
                <div className="result-row"><span>Loģistika / rezerve</span><b>{formatEuro(results.logistics + results.reserve)}</b></div>
                <div className="result-row"><span>Cena par m²</span><b>{formatEuro(results.pricePerSquareMeter)}</b></div>

                <CalculatorLeadCta
                  calculatorId="timber"
                  calculatorTitle="Koka karkasa un nojumes tāme"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Platība', value: `${params.area} m²` },
                    { label: 'Projekts', value: PROJECT_TYPES[params.projectType].name },
                    { label: 'Pakete', value: PACKAGE_LEVELS[params.packageLevel].name },
                    { label: 'Pamati', value: FOUNDATION_TYPES[params.foundationType].name },
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
