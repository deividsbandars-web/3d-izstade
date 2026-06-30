import { useState } from 'react';
import { COUNTRIES, renderCountryOptions } from '../../core/constants';
import '../../components/calculator/styles/CalculatorPro.css';
import { CalculatorLeadCta } from './CalculatorLeadCta';

type VisualsParams = {
  animationSeconds: number;
  commercialLicense: boolean;
  country: keyof typeof COUNTRIES;
  includeCopywriting: boolean;
  includeLandingPrototype: boolean;
  includeWeb3dPrototype: boolean;
  interactiveViewCount: number;
  projectType: keyof typeof PROJECT_TYPES;
  qualityLevel: keyof typeof QUALITY_LEVELS;
  renderCount: number;
  revisionRounds: number;
  sceneCount: number;
  sourceMaterial: keyof typeof SOURCE_MATERIAL_LEVELS;
  timeline: keyof typeof TIMELINE_LEVELS;
};

type VisualsResults = {
  animationCost: number;
  commercialLicenseCost: number;
  copywritingCost: number;
  deliveryCost: number;
  grandTotal: number;
  interactionCost: number;
  landingPrototypeCost: number;
  modelingCost: number;
  pricePerScene: number;
  productionCost: number;
  qaReserve: number;
  renderCost: number;
  revisionCost: number;
  strategyCost: number;
  timelineWeeks: string;
  web3dPrototypeCost: number;
};

const PROJECT_TYPES = {
  arch_stills: {
    baseStrategy: 280,
    modelPerScene: 360,
    name: 'Arhitektūras / interjera 3D vizualizācijas',
    renderUnit: 190,
    timeline: '1-3 nedēļas',
  },
  product_launch: {
    baseStrategy: 340,
    modelPerScene: 280,
    name: 'Produkta 3D vizuāļi un launch materiāli',
    renderUnit: 170,
    timeline: '1-2 nedēļas',
  },
  walkthrough_video: {
    baseStrategy: 520,
    modelPerScene: 430,
    name: '3D walkthrough / video animācija',
    renderUnit: 140,
    timeline: '2-5 nedēļas',
  },
  web3d_demo: {
    baseStrategy: 760,
    modelPerScene: 620,
    name: 'Interaktīvs Web3D demo prototips',
    renderUnit: 120,
    timeline: '3-6 nedēļas',
  },
  expo_booth: {
    baseStrategy: 640,
    modelPerScene: 520,
    name: 'Web3D expo stends / sponsor prezentācija',
    renderUnit: 130,
    timeline: '2-5 nedēļas',
  },
  configurator: {
    baseStrategy: 980,
    modelPerScene: 680,
    name: 'Produkta konfigurators / interaktīva pārdošana',
    renderUnit: 110,
    timeline: '4-8 nedēļas',
  },
} as const;

const QUALITY_LEVELS = {
  draft: { delivery: 120, multiplier: 0.78, name: 'Ātra koncepcija / draft kvalitāte' },
  marketing: { delivery: 220, multiplier: 1, name: 'Marketinga kvalitāte' },
  premium: { delivery: 360, multiplier: 1.32, name: 'Premium / investoru prezentācija' },
  cinematic: { delivery: 520, multiplier: 1.58, name: 'Kino / hero kampaņas kvalitāte' },
} as const;

const SOURCE_MATERIAL_LEVELS = {
  ready: { multiplier: 0.82, name: 'Ir gatavi CAD/3D faili un brendi' },
  partial: { multiplier: 1, name: 'Daļēji gatavi rasējumi/foto/moodboard' },
  concept: { multiplier: 1.24, name: 'Ir tikai ideja vai skice' },
  cleanup: { multiplier: 1.42, name: 'Jātīra faili, skani vai nekvalitatīvi materiāli' },
} as const;

const TIMELINE_LEVELS = {
  standard: { multiplier: 1, name: 'Standarta termiņš' },
  priority: { multiplier: 1.18, name: 'Prioritārs termiņš' },
  rush: { multiplier: 1.38, name: 'Steidzams launch / pasākums' },
} as const;

const ANIMATION_SECOND_RATE = 38;
const INTERACTIVE_VIEW_RATE = 180;
const REVISION_ROUND_RATE = 120;
const WEB3D_PROTOTYPE_BASE = 1450;
const LANDING_PROTOTYPE_BASE = 540;
const COPYWRITING_BASE = 260;
const COMMERCIAL_LICENSE_BASE = 240;

function formatEuro(value: number) {
  return `${Math.round(value).toLocaleString('lv-LV')} €`;
}

function clampNumber(value: number, min: number) {
  return Number.isFinite(value) ? Math.max(min, value) : min;
}

export default function VisualsCalc() {
  const [params, setParams] = useState<VisualsParams>({
    animationSeconds: 20,
    commercialLicense: true,
    country: 'lv',
    includeCopywriting: true,
    includeLandingPrototype: false,
    includeWeb3dPrototype: true,
    interactiveViewCount: 3,
    projectType: 'expo_booth',
    qualityLevel: 'marketing',
    renderCount: 6,
    revisionRounds: 2,
    sceneCount: 2,
    sourceMaterial: 'partial',
    timeline: 'standard',
  });
  const [results, setResults] = useState<VisualsResults | null>(null);

  const updateParam = <Key extends keyof VisualsParams>(key: Key, value: VisualsParams[Key]) => {
    setParams((current) => ({ ...current, [key]: value }));
  };

  const handleCalculate = () => {
    const country = COUNTRIES[params.country];
    const project = PROJECT_TYPES[params.projectType];
    const quality = QUALITY_LEVELS[params.qualityLevel];
    const sourceMaterial = SOURCE_MATERIAL_LEVELS[params.sourceMaterial];
    const timeline = TIMELINE_LEVELS[params.timeline];

    const sceneCount = clampNumber(params.sceneCount, 1);
    const renderCount = clampNumber(params.renderCount, 0);
    const animationSeconds = clampNumber(params.animationSeconds, 0);
    const interactiveViewCount = clampNumber(params.interactiveViewCount, 0);
    const revisionRounds = clampNumber(params.revisionRounds, 0);

    const complexityMultiplier = quality.multiplier * sourceMaterial.multiplier;
    const deliveryMultiplier = timeline.multiplier;

    const strategyCost = project.baseStrategy * country.workMult;
    const modelingCost = sceneCount * project.modelPerScene * complexityMultiplier * country.workMult;
    const renderCost = renderCount * project.renderUnit * complexityMultiplier * country.workMult;
    const animationCost = animationSeconds * ANIMATION_SECOND_RATE * complexityMultiplier * country.workMult;
    const interactionCost = interactiveViewCount * INTERACTIVE_VIEW_RATE * complexityMultiplier * country.workMult;
    const revisionCost = revisionRounds * REVISION_ROUND_RATE * quality.multiplier * country.workMult;
    const web3dPrototypeCost = params.includeWeb3dPrototype ? WEB3D_PROTOTYPE_BASE * complexityMultiplier * country.workMult : 0;
    const landingPrototypeCost = params.includeLandingPrototype ? LANDING_PROTOTYPE_BASE * country.workMult : 0;
    const copywritingCost = params.includeCopywriting ? COPYWRITING_BASE * country.workMult : 0;
    const commercialLicenseCost = params.commercialLicense ? COMMERCIAL_LICENSE_BASE * country.workMult : 0;
    const deliveryCost = quality.delivery * country.workMult;

    const productionCost =
      strategyCost +
      modelingCost +
      renderCost +
      animationCost +
      interactionCost +
      revisionCost +
      web3dPrototypeCost +
      landingPrototypeCost +
      copywritingCost +
      commercialLicenseCost +
      deliveryCost;

    const rushedProductionCost = productionCost * deliveryMultiplier;
    const qaReserve = rushedProductionCost * 0.07;
    const grandTotal = rushedProductionCost + qaReserve;

    setResults({
      animationCost,
      commercialLicenseCost,
      copywritingCost,
      deliveryCost,
      grandTotal,
      interactionCost,
      landingPrototypeCost,
      modelingCost,
      pricePerScene: grandTotal / sceneCount,
      productionCost,
      qaReserve,
      renderCost,
      revisionCost,
      strategyCost,
      timelineWeeks: project.timeline,
      web3dPrototypeCost,
    });
  };

  return (
    <div className="calculator-pro-wrapper">
      <div className="calc-header">
        <h1>PRO 3D un Web3D Prezentācijas Tāme</h1>
        <p>
          3D vizualizācijas, produkta demo, Web3D prototips vai expo stends ar skaidru darbu, piegādes un pārdošanas vērtības sadalījumu.
        </p>
      </div>

      <div className="calc-grid">
        <div className="calc-form-column">
          <section className="calc-section">
            <h2>Projekta virziens</h2>
            <div className="input-group">
              <label>
                Reģions
                <select value={params.country} onChange={(event) => updateParam('country', event.target.value as VisualsParams['country'])}>
                  {renderCountryOptions()}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Pakalpojuma tips
                <select value={params.projectType} onChange={(event) => updateParam('projectType', event.target.value as VisualsParams['projectType'])}>
                  {Object.entries(PROJECT_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Kvalitātes līmenis
                <select value={params.qualityLevel} onChange={(event) => updateParam('qualityLevel', event.target.value as VisualsParams['qualityLevel'])}>
                  {Object.entries(QUALITY_LEVELS).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Izejas materiāli
                <select value={params.sourceMaterial} onChange={(event) => updateParam('sourceMaterial', event.target.value as VisualsParams['sourceMaterial'])}>
                  {Object.entries(SOURCE_MATERIAL_LEVELS).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Termiņš
                <select value={params.timeline} onChange={(event) => updateParam('timeline', event.target.value as VisualsParams['timeline'])}>
                  {Object.entries(TIMELINE_LEVELS).map(([key, value]) => (
                    <option key={key} value={key}>{value.name}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="calc-section">
            <h2>Apjoms un deliverables</h2>
            <div className="input-group">
              <label>
                Ainu / telpu / produktu skaits
                <input min="1" onChange={(event) => updateParam('sceneCount', Number(event.target.value))} type="number" value={params.sceneCount} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Renderu skaits
                <input min="0" onChange={(event) => updateParam('renderCount', Number(event.target.value))} type="number" value={params.renderCount} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Video / walkthrough sekundes
                <input min="0" onChange={(event) => updateParam('animationSeconds', Number(event.target.value))} type="number" value={params.animationSeconds} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Interaktīvie skati / konfigurācijas
                <input min="0" onChange={(event) => updateParam('interactiveViewCount', Number(event.target.value))} type="number" value={params.interactiveViewCount} />
              </label>

              <label style={{ marginTop: '20px' }}>
                Revīziju kārtas
                <input min="0" onChange={(event) => updateParam('revisionRounds', Number(event.target.value))} type="number" value={params.revisionRounds} />
              </label>

              <label style={{ alignItems: 'center', display: 'flex', gap: '10px', marginTop: '20px' }}>
                <input checked={params.includeWeb3dPrototype} onChange={(event) => updateParam('includeWeb3dPrototype', event.target.checked)} type="checkbox" />
                Iekļaut Web3D demo prototipu
              </label>

              <label style={{ alignItems: 'center', display: 'flex', gap: '10px', marginTop: '20px' }}>
                <input checked={params.includeLandingPrototype} onChange={(event) => updateParam('includeLandingPrototype', event.target.checked)} type="checkbox" />
                Iekļaut landing/prezentācijas prototipu
              </label>

              <label style={{ alignItems: 'center', display: 'flex', gap: '10px', marginTop: '20px' }}>
                <input checked={params.includeCopywriting} onChange={(event) => updateParam('includeCopywriting', event.target.checked)} type="checkbox" />
                Iekļaut pārdošanas tekstu struktūru
              </label>

              <label style={{ alignItems: 'center', display: 'flex', gap: '10px', marginTop: '20px' }}>
                <input checked={params.commercialLicense} onChange={(event) => updateParam('commercialLicense', event.target.checked)} type="checkbox" />
                Komerciāla lietošana kampaņās
              </label>
            </div>
          </section>

          <button className="btn-primary" onClick={handleCalculate} style={{ width: '100%', padding: '18px' }}>
            APRĒĶINĀT 3D / WEB3D TĀMI
          </button>
        </div>

        <div className="calc-results-column">
          <div className="sticky-results">
            <h3 className="results-title">Prezentācijas specifikācija</h3>
            {!results ? (
              <div className="empty-state">Izvēlies projekta tipu, apjomu un kvalitātes līmeni.</div>
            ) : (
              <>
                <div className="grand-total-box">
                  <span className="gt-label">PROGNOZĒTĀ INVESTĪCIJA</span>
                  <span className="gt-value">{formatEuro(results.grandTotal)}</span>
                </div>

                <div className="result-row"><span>Stratēģija / art direction</span><b>{formatEuro(results.strategyCost)}</b></div>
                <div className="result-row"><span>3D modelēšana</span><b>{formatEuro(results.modelingCost)}</b></div>
                <div className="result-row"><span>Renderi / vizuāļi</span><b>{formatEuro(results.renderCost)}</b></div>
                <div className="result-row"><span>Animācija / walkthrough</span><b>{formatEuro(results.animationCost)}</b></div>
                <div className="result-row"><span>Interaktivitāte</span><b>{formatEuro(results.interactionCost + results.web3dPrototypeCost)}</b></div>
                <div className="result-row"><span>Teksti / licence / piegāde</span><b>{formatEuro(results.copywritingCost + results.commercialLicenseCost + results.deliveryCost)}</b></div>
                <div className="result-row"><span>Revīzijas + QA rezerve</span><b>{formatEuro(results.revisionCost + results.qaReserve)}</b></div>
                <div className="result-row"><span>Orientējošs termiņš</span><b>{results.timelineWeeks}</b></div>
                <div className="result-row"><span>Cena uz ainu</span><b>{formatEuro(results.pricePerScene)}</b></div>

                <CalculatorLeadCta
                  calculatorId="visuals"
                  calculatorTitle="3D un Web3D prezentācijas tāme"
                  estimateTotal={results.grandTotal}
                  summaryItems={[
                    { label: 'Projekts', value: PROJECT_TYPES[params.projectType].name },
                    { label: 'Kvalitāte', value: QUALITY_LEVELS[params.qualityLevel].name },
                    { label: 'Apjoms', value: `${params.sceneCount} ainas / ${params.renderCount} renderi` },
                    { label: 'Web3D', value: params.includeWeb3dPrototype ? 'Iekļauts' : 'Nav iekļauts' },
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
