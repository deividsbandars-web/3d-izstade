import { useMemo, useState } from 'react';
import type { ModularHomeConfiguratorState } from './modularHomeConfigurator';
import {
  calculateComponentBom,
  type ModularHomeComponentBom,
  type ModularHomeComponentCategory,
  type ModularHomeComponentUnit,
} from './modularHomeComponents';
import { formatHomeEstimateEur, type ModularHomeEstimate } from './modularHomeEstimate';
import {
  getModularHomeDimensionSummary,
  type ModularHomeDimensionSummary,
} from './modularHomeProducts';
import { MODULAR_HOME_QUOTE_PREVIEW_QUEUE_KEY } from './ModularHomeQuoteForm';

type ModularHomeProjectSummaryProps = {
  config: ModularHomeConfiguratorState;
  estimate: ModularHomeEstimate;
  isTouchDevice?: boolean;
};

type ProjectIdentity = {
  generatedAt: Date;
  projectId: string;
};

type QuoteQueueSummary = {
  count: number;
  latestCreatedAt: string | null;
  latestModel: string | null;
};

const PRINT_STYLE = `
@media print {
  @page {
    margin: 12mm;
    size: A4 portrait;
  }

  html,
  body,
  #root {
    background: #ffffff !important;
    color: #0f172a !important;
    height: auto !important;
    overflow: visible !important;
  }

  #root > div {
    background: #ffffff !important;
    height: auto !important;
    min-height: auto !important;
    overflow: visible !important;
    width: 100% !important;
  }

  #root > div > *:not([data-home-demo-overlay="true"]) {
    display: none !important;
  }

  canvas,
  [data-sales-demo-guide-overlay="true"] {
    display: none !important;
  }

  [data-home-demo-overlay="true"] {
    background: #ffffff !important;
    border: 0 !important;
    box-shadow: none !important;
    inset: auto !important;
    max-height: none !important;
    max-width: none !important;
    min-width: 0 !important;
    overflow: visible !important;
    padding: 0 !important;
    position: static !important;
    width: 100% !important;
  }

  [data-home-demo-overlay="true"] > *:not([data-home-project-summary="true"]) {
    display: none !important;
  }

  [data-home-project-summary="true"] {
    background: #ffffff !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    color: #0f172a !important;
    margin: 0 !important;
    max-height: none !important;
    max-width: none !important;
    overflow: visible !important;
    padding: 0 !important;
    position: static !important;
    width: 100% !important;
  }

  [data-home-project-summary="true"] * {
    box-shadow: none !important;
    color: #0f172a !important;
    text-shadow: none !important;
  }

  [data-home-project-summary-print-card="true"] {
    background: #ffffff !important;
    border-color: #cbd5e1 !important;
    color: #0f172a !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  [data-home-project-summary-total="true"] span:last-child,
  [data-home-project-summary-line-item] span:last-child {
    color: #92400e !important;
  }

  [data-home-project-summary-render-placeholder="true"] [aria-hidden="true"] {
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }

  [data-home-project-summary-print-grid="true"] {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }

  [data-home-project-summary-print-hidden="true"] {
    display: none !important;
  }

  [data-home-project-summary-copy-text="true"] {
    display: none !important;
  }
}
`;
const MIDDLE_DOT = String.fromCharCode(183);
const SQUARED_TWO = String.fromCharCode(178);

const COMPONENT_BOM_CATEGORY_LABELS = {
  wallPanel: 'Wall panels',
  floorCassette: 'Floor cassettes',
  roofCassette: 'Roof cassettes',
  facadeBoarding: 'Facade boarding',
  windowUnit: 'Window units',
  doorUnit: 'Door units',
  bathroomCore: 'Bathroom cores',
  kitchenLine: 'Kitchen lines',
  terraceDeck: 'Terrace decks',
  foundationPad: 'Foundation pads',
  interiorFinish: 'Interior finishes',
  furniturePackage: 'Furniture packages',
} as const satisfies Record<ModularHomeComponentCategory, string>;

function formatComponentBomUnit(unit: ModularHomeComponentUnit | 'mixed'): string {
  if (unit === 'm2') {
    return `m${SQUARED_TWO}`;
  }

  if (unit === 'linearM') {
    return 'linear m';
  }

  return unit;
}

function formatQuantityM2(value: number): string {
  return `${value.toLocaleString('en-IE', { maximumFractionDigits: 2 })} m${SQUARED_TWO}`;
}

function createProjectIdentity(): ProjectIdentity {
  const generatedAt = new Date();

  return {
    generatedAt,
    projectId: `home-preview-${generatedAt.getTime().toString(36)}`,
  };
}

function formatGeneratedAt(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatOptionalDate(value: string | null): string {
  if (!value) {
    return 'No local preview request saved yet';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Saved locally, date unavailable';
  }

  return formatGeneratedAt(date);
}

function normalizeSizeLabel(sizeLabel: string) {
  return sizeLabel
    .replace('m2', `m${SQUARED_TWO}`)
    .replace(/m.{1,2}$/u, `m${SQUARED_TWO}`);
}

function formatEstimateAmount(amount: number | null): string {
  if (amount === null) {
    return 'Requires review';
  }

  return amount === 0 ? 'Included' : formatHomeEstimateEur(amount);
}

function normalizeEstimateDisclaimer(disclaimer: string): string {
  const brokenMiddleDot = `${String.fromCharCode(194)}${MIDDLE_DOT}`;

  return disclaimer
    .replace(new RegExp(brokenMiddleDot, 'g'), MIDDLE_DOT)
    .replace(/\?{2}/g, MIDDLE_DOT);
}

function readQuoteQueueSummary(): QuoteQueueSummary {
  if (typeof window === 'undefined') {
    return { count: 0, latestCreatedAt: null, latestModel: null };
  }

  try {
    const raw = window.localStorage.getItem(MODULAR_HOME_QUOTE_PREVIEW_QUEUE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return { count: 0, latestCreatedAt: null, latestModel: null };
    }

    const records = parsed.filter((item): item is Record<string, unknown> => (
      typeof item === 'object' && item !== null && !Array.isArray(item)
    ));
    const latest = records[records.length - 1];

    return {
      count: records.length,
      latestCreatedAt: typeof latest?.createdAt === 'string' ? latest.createdAt : null,
      latestModel: typeof latest?.model === 'string' ? latest.model : null,
    };
  } catch {
    return { count: 0, latestCreatedAt: null, latestModel: null };
  }
}

function createSummaryText(
  identity: ProjectIdentity,
  estimate: ModularHomeEstimate,
  dimensions: ModularHomeDimensionSummary,
  quoteQueue: QuoteQueueSummary,
  componentBom: ModularHomeComponentBom,
) {
  const scopeLines = estimate.scopeOfSupply.flatMap((section) => [
    `${section.label}:`,
    ...section.items.map((item) => `- ${item}`),
  ]);
  const estimateSectionLines = estimate.sections.flatMap((section) => [
    `${section.label} (${section.confidence}, subtotal ${formatHomeEstimateEur(section.subtotal)}):`,
    ...section.lineItems.map((item) => (
      `- ${item.label}: quantity ${item.quantity}, unit ${item.unit}, unit cost ${formatEstimateAmount(item.unitCost)}, subtotal ${formatEstimateAmount(item.subtotal)}, confidence ${item.confidence}${item.note ? `; ${item.note}` : ''}`
    )),
  ]);

  return [
    'Modular Home Project Summary',
    `Project ID: ${identity.projectId}`,
    `Generated: ${formatGeneratedAt(identity.generatedAt)}`,
    'Pricing database:',
    `- Currency: ${estimate.pricing.currency}`,
    `- Cost region: ${estimate.pricing.costRegionLabel}`,
    `- Price date: ${estimate.pricing.priceDate}`,
    `- Confidence: ${estimate.pricing.confidenceLabel}`,
    `- ${estimate.pricing.disclaimer}`,
    `Model: ${estimate.baseModel}`,
    `Size: ${normalizeSizeLabel(estimate.sizeLabel)}`,
    `Footprint: ${dimensions.footprintLabel}`,
    `Ceiling height: ${dimensions.ceilingHeightLabel}`,
    `Modules: ${dimensions.moduleCountLabel}`,
    `Transport modules: ${dimensions.transportModuleCountLabel}`,
    `Build category: ${dimensions.buildCategoryNote}`,
    'Quantity takeoff:',
    `- ${estimate.quantities.disclaimer.replace(' · ', ` ${MIDDLE_DOT} `)}`,
    `- Gross floor area: ${formatQuantityM2(estimate.quantities.grossFloorAreaM2)}`,
    `- Exterior wall area: ${formatQuantityM2(estimate.quantities.exteriorWallAreaM2)}`,
    `- Interior partition estimate: ${formatQuantityM2(estimate.quantities.interiorPartitionEstimateM2)}`,
    `- Roof area: ${formatQuantityM2(estimate.quantities.roofAreaM2)}`,
    `- Facade area: ${formatQuantityM2(estimate.quantities.facadeAreaM2)}`,
    `- Terrace area: ${formatQuantityM2(estimate.quantities.terraceAreaM2)}`,
    `- Windows: ${estimate.quantities.windowCount}`,
    `- Doors: ${estimate.quantities.doorCount}`,
    `- Bathroom cores: ${estimate.quantities.bathroomCoreCount}`,
    `- Furniture packages: ${estimate.quantities.furniturePackageItemCount}`,
    `Facade: ${estimate.selectedOptions.facade}`,
    `Roof: ${estimate.selectedOptions.roof}`,
    `Terrace: ${estimate.selectedOptions.terrace}`,
    `Finish level: ${estimate.selectedOptions.finishLevel}`,
    `Window package: ${estimate.selectedOptions.windowPackage}`,
    `Door package: ${estimate.selectedOptions.doorPackage}`,
    'Component BOM v2:',
    `- ${componentBom.disclaimer.replace(' · ', ` ${MIDDLE_DOT} `)}`,
    `- Module count: ${componentBom.moduleCount}`,
    `- Material estimate: ${formatHomeEstimateEur(componentBom.materialCostEstimate)}`,
    `- Labor estimate: ${formatHomeEstimateEur(componentBom.laborCostEstimate)}`,
    `- Waste estimate: ${formatHomeEstimateEur(componentBom.wasteCostEstimate)}`,
    `- Component BOM subtotal: ${formatHomeEstimateEur(componentBom.subtotal)}`,
    ...componentBom.groups.map((group) => (
      `- ${COMPONENT_BOM_CATEGORY_LABELS[group.category]}: ${group.quantity} ${formatComponentBomUnit(group.unit)}, ${formatHomeEstimateEur(group.subtotal)}`
    )),
    `- Facade package: ${estimate.selectedOptions.facade}`,
    `- Roof package: ${estimate.selectedOptions.roof}`,
    `- Terrace package: ${estimate.selectedOptions.terrace}`,
    `- Finish package: ${estimate.selectedOptions.finishLevel}`,
    `- Window package: ${estimate.selectedOptions.windowPackage}`,
    `- Door package: ${estimate.selectedOptions.doorPackage}`,
    'Pricing category totals:',
    ...estimate.pricing.categoryTotals.map((item) => (
      `- ${item.label}: ${formatHomeEstimateEur(item.amount)}`
    )),
    'Structured pre-quote estimate:',
    ...estimateSectionLines,
    `Subtotal before site services: ${formatHomeEstimateEur(estimate.subtotal)}`,
    `Transport and installation placeholders: ${formatHomeEstimateEur(estimate.optionalServicesTotal)}`,
    `Estimated total: ${formatHomeEstimateEur(estimate.estimatedTotal)}`,
    'Scope of supply:',
    ...scopeLines,
    'Quote request info:',
    `- Local preview requests saved: ${quoteQueue.count}`,
    `- Latest local request: ${formatOptionalDate(quoteQueue.latestCreatedAt)}`,
    '- No live quote was submitted. Browser localStorage only.',
    normalizeEstimateDisclaimer(estimate.disclaimer),
  ].join('\n');
}

function stopSummaryEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

export function ModularHomeProjectSummary({ config, estimate, isTouchDevice = false }: ModularHomeProjectSummaryProps) {
  const [identity] = useState(createProjectIdentity);
  const [copyStatus, setCopyStatus] = useState('');
  const [quoteQueue] = useState(readQuoteQueueSummary);
  const dimensions = useMemo(() => getModularHomeDimensionSummary(config), [config]);
  const componentBom = useMemo(() => calculateComponentBom(config), [config]);
  const summaryText = useMemo(
    () => createSummaryText(identity, estimate, dimensions, quoteQueue, componentBom),
    [estimate, identity, dimensions, quoteQueue, componentBom],
  );
  const bomPackageRows = [
    ['Facade package', estimate.selectedOptions.facade],
    ['Roof package', estimate.selectedOptions.roof],
    ['Terrace package', estimate.selectedOptions.terrace],
    ['Finish package', estimate.selectedOptions.finishLevel],
    ['Window package', estimate.selectedOptions.windowPackage],
    ['Door package', estimate.selectedOptions.doorPackage],
  ] as const;
  const quantityRows = [
    ['gross-floor-area', 'Gross floor area', formatQuantityM2(estimate.quantities.grossFloorAreaM2)],
    ['exterior-wall-area', 'Exterior wall area', formatQuantityM2(estimate.quantities.exteriorWallAreaM2)],
    ['interior-partitions', 'Interior partitions', formatQuantityM2(estimate.quantities.interiorPartitionEstimateM2)],
    ['roof-area', 'Roof area', formatQuantityM2(estimate.quantities.roofAreaM2)],
    ['facade-area', 'Facade area', formatQuantityM2(estimate.quantities.facadeAreaM2)],
    ['terrace-area', 'Terrace area', formatQuantityM2(estimate.quantities.terraceAreaM2)],
    ['windows', 'Windows', `${estimate.quantities.windowCount}`],
    ['doors', 'Doors', `${estimate.quantities.doorCount}`],
    ['bathroom-cores', 'Bathroom cores', `${estimate.quantities.bathroomCoreCount}`],
    ['furniture-packages', 'Furniture packages', `${estimate.quantities.furniturePackageItemCount}`],
  ] as const;
  const summaryRows = [
    ['Model', estimate.baseModel],
    ['Floor area', dimensions.floorAreaLabel],
    ['Footprint', dimensions.footprintLabel],
    ['Ceiling', dimensions.ceilingHeightLabel],
    ['Modules', dimensions.moduleCountLabel],
    ['Transport', dimensions.transportModuleCountLabel],
    ['Build note', dimensions.buildCategoryNote],
    ['Facade', estimate.selectedOptions.facade],
    ['Roof', estimate.selectedOptions.roof],
    ['Terrace', estimate.selectedOptions.terrace],
    ['Finish', estimate.selectedOptions.finishLevel],
    ['Window package', estimate.selectedOptions.windowPackage],
    ['Door package', estimate.selectedOptions.doorPackage],
    ['Subtotal', formatHomeEstimateEur(estimate.subtotal)],
    ['Services', formatHomeEstimateEur(estimate.optionalServicesTotal)],
    ['VAT placeholder', formatHomeEstimateEur(estimate.vatEstimate.amount)],
  ] as const;

  const copySummary = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        setCopyStatus('Copy summary text manually from this panel.');
        return;
      }

      await navigator.clipboard.writeText(summaryText);
      setCopyStatus('Project summary copied locally.');
    } catch {
      setCopyStatus('Copy summary text manually from this panel.');
    }
  };

  const printSummary = () => {
    if (typeof window === 'undefined' || typeof window.print !== 'function') {
      return;
    }

    window.print();
  };

  return (
    <section
      aria-label={`${estimate.baseModel} printable project summary`}
      data-home-project-summary="true"
      data-home-project-summary-config={`${config.template}:${config.facade}:${config.roof}:${config.terrace}:${config.finishLevel}`}
      data-home-project-summary-id={identity.projectId}
      data-home-project-summary-print-ready="true"
      onClick={stopSummaryEvent}
      onMouseDown={stopSummaryEvent}
      onPointerDown={stopSummaryEvent}
      style={{
        background: 'linear-gradient(180deg, rgba(8, 47, 73, 0.58), rgba(2, 6, 23, 0.7))',
        border: '1px solid rgba(125, 211, 252, 0.28)',
        borderRadius: isTouchDevice ? '15px' : '17px',
        marginTop: isTouchDevice ? '10px' : '12px',
        padding: isTouchDevice ? '10px' : '12px',
      }}
    >
      <style data-home-project-summary-print-style="true">{PRINT_STYLE}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start' }}>
        <div>
          <div style={{ color: '#7dd3fc', fontSize: '0.58rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Client meeting document
          </div>
          <div style={{ color: '#f0f9ff', fontSize: isTouchDevice ? '0.82rem' : '0.94rem', fontWeight: 950, marginTop: '4px' }}>
            Print-ready {estimate.baseModel} summary
          </div>
        </div>
        <div
          data-home-project-summary-id-label="true"
          style={{
            background: 'rgba(15, 23, 42, 0.58)',
            border: '1px solid rgba(125, 211, 252, 0.24)',
            borderRadius: '999px',
            color: '#bae6fd',
            fontSize: '0.52rem',
            fontWeight: 900,
            padding: '5px 7px',
            whiteSpace: 'nowrap',
          }}
        >
          {identity.projectId}
        </div>
      </div>

      <div
        data-home-project-summary-generated="true"
        style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 800, marginTop: '7px' }}
      >
        Generated {formatGeneratedAt(identity.generatedAt)}
      </div>

      <div
        data-home-project-summary-print-grid="true"
        style={{
          display: 'grid',
          gap: isTouchDevice ? '8px' : '10px',
          gridTemplateColumns: isTouchDevice ? '1fr' : '0.9fr 1.1fr',
          marginTop: isTouchDevice ? '10px' : '12px',
        }}
      >
        <div
          data-home-project-summary-render-placeholder="true"
          data-home-project-summary-print-card="true"
          style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(251, 191, 36, 0.12))',
            border: '1px solid rgba(125, 211, 252, 0.22)',
            borderRadius: '14px',
            display: 'grid',
            minHeight: isTouchDevice ? '120px' : '150px',
            overflow: 'hidden',
            padding: isTouchDevice ? '10px' : '12px',
            position: 'relative',
          }}
        >
          <div style={{ alignSelf: 'start', color: '#bae6fd', fontSize: '0.54rem', fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Model preview placeholder
          </div>
          <div
            aria-hidden="true"
            style={{
              alignSelf: 'center',
              background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.88), rgba(120, 53, 15, 0.88))',
              border: '1px solid rgba(254, 243, 199, 0.38)',
              borderRadius: '10px 10px 5px 5px',
              boxShadow: '0 16px 28px rgba(0, 0, 0, 0.22)',
              height: isTouchDevice ? '46px' : '58px',
              justifySelf: 'center',
              marginTop: '10px',
              position: 'relative',
              width: isTouchDevice ? '120px' : '160px',
            }}
          >
            <span
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.96), rgba(71, 85, 105, 0.92))',
                clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
                display: 'block',
                height: isTouchDevice ? '32px' : '42px',
                left: '10%',
                position: 'absolute',
                top: isTouchDevice ? '-27px' : '-35px',
                width: '80%',
              }}
            />
            <span style={{ background: '#082f49', borderRadius: '3px', display: 'block', height: '28%', left: '16%', position: 'absolute', top: '30%', width: '18%' }} />
            <span style={{ background: '#082f49', borderRadius: '3px', display: 'block', height: '28%', position: 'absolute', right: '16%', top: '30%', width: '18%' }} />
            <span style={{ background: '#451a03', borderRadius: '3px 3px 0 0', bottom: 0, display: 'block', height: '45%', left: '45%', position: 'absolute', width: '14%' }} />
          </div>
          <div style={{ alignSelf: 'end', color: '#e0f2fe', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 830, lineHeight: 1.28, marginTop: '10px' }}>
            Use the current 3D view or browser screenshot as the model render for client follow-up.
          </div>
        </div>

        <div
          data-home-project-summary-meeting-meta="true"
          data-home-project-summary-print-card="true"
          style={{
            background: 'rgba(15, 23, 42, 0.52)',
            border: '1px solid rgba(148, 163, 184, 0.16)',
            borderRadius: '14px',
            display: 'grid',
            gap: '7px',
            padding: isTouchDevice ? '10px' : '12px',
          }}
        >
          <div style={{ color: '#7dd3fc', fontSize: '0.54rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Project identity
          </div>
          <div style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.64rem' : '0.7rem', fontWeight: 900, lineHeight: 1.28 }}>
            {estimate.baseModel} / {normalizeSizeLabel(estimate.sizeLabel)} / {dimensions.footprintLabel}
          </div>
          <div style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 800, lineHeight: 1.32 }}>
            Project ID: {identity.projectId}<br />
            Generated: {formatGeneratedAt(identity.generatedAt)}<br />
            Quote queue: {quoteQueue.count} local preview request{quoteQueue.count === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      <div
        aria-label="Project summary rows"
        data-home-project-summary-print-grid="true"
        style={{
          display: 'grid',
          gap: '6px',
          gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))',
          marginTop: isTouchDevice ? '9px' : '10px',
        }}
      >
        {summaryRows.map(([label, value]) => (
          <div
            key={label}
            data-home-project-summary-print-card="true"
            data-home-project-summary-row={`${label}:${value}`}
            style={{
              background: 'rgba(15, 23, 42, 0.52)',
              border: '1px solid rgba(148, 163, 184, 0.16)',
              borderRadius: '10px',
              padding: isTouchDevice ? '6px 7px' : '7px 8px',
            }}
          >
            <div style={{ color: '#7dd3fc', fontSize: '0.52rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 860, marginTop: '3px' }}>{value}</div>
          </div>
        ))}
      </div>

      <div
        aria-label="Project summary quantity takeoff"
        data-home-project-summary-quantity-takeoff="true"
        data-home-project-summary-quantity-disclaimer={estimate.quantities.disclaimer}
        data-home-project-summary-print-card="true"
        style={{
          background: 'rgba(15, 23, 42, 0.44)',
          border: '1px solid rgba(125, 211, 252, 0.18)',
          borderRadius: '13px',
          display: 'grid',
          gap: '7px',
          marginTop: isTouchDevice ? '9px' : '10px',
          padding: isTouchDevice ? '8px' : '10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'start' }}>
          <div style={{ color: '#7dd3fc', fontSize: '0.56rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Quantity takeoff
          </div>
          <div
            style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              borderRadius: '999px',
              color: '#fde68a',
              fontSize: isTouchDevice ? '0.48rem' : '0.5rem',
              fontWeight: 950,
              lineHeight: 1,
              padding: '5px 7px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Approximate
          </div>
        </div>
        <div
          data-home-project-summary-quantity-note="true"
          style={{
            color: '#bae6fd',
            fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
            fontWeight: 800,
            lineHeight: 1.28,
          }}
        >
          {estimate.quantities.disclaimer}
        </div>
        <div style={{ display: 'grid', gap: '5px', gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
          {quantityRows.map(([id, label, value]) => (
            <div
              key={id}
              data-home-project-summary-quantity={`${id}:${value}`}
              data-home-project-summary-print-card="true"
              style={{
                background: 'rgba(15, 23, 42, 0.46)',
                border: '1px solid rgba(125, 211, 252, 0.12)',
                borderRadius: '9px',
                padding: '6px 7px',
              }}
            >
              <div style={{ color: '#7dd3fc', fontSize: '0.5rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
              <div style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 920, marginTop: '3px' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        aria-label="Project summary component BOM"
        data-home-project-summary-bom="true"
        data-home-project-summary-bom-module-count={componentBom.moduleCount}
        data-home-project-summary-component-bom="true"
        data-home-project-summary-component-bom-quantity-disclaimer={componentBom.quantities.disclaimer}
        data-home-project-summary-component-bom-component-count={componentBom.componentCount}
        data-home-project-summary-component-bom-subtotal={componentBom.subtotal}
        data-home-project-summary-print-card="true"
        style={{
          background: 'rgba(15, 23, 42, 0.44)',
          border: '1px solid rgba(125, 211, 252, 0.18)',
          borderRadius: '13px',
          display: 'grid',
          gap: '7px',
          marginTop: isTouchDevice ? '9px' : '10px',
          padding: isTouchDevice ? '8px' : '10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'start' }}>
          <div style={{ color: '#7dd3fc', fontSize: '0.56rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Component BOM v2
          </div>
          <div
            data-home-project-summary-bom-status="true"
            data-home-project-summary-component-bom-status="true"
            style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              borderRadius: '999px',
              color: '#fde68a',
              fontSize: isTouchDevice ? '0.48rem' : '0.5rem',
              fontWeight: 950,
              lineHeight: 1,
              padding: '5px 7px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Preview component BOM
          </div>
        </div>

        <div
          data-home-project-summary-bom-note="true"
          data-home-project-summary-component-bom-note="true"
          style={{
            color: '#bae6fd',
            fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
            fontWeight: 800,
            lineHeight: 1.28,
          }}
        >
          {componentBom.disclaimer}
        </div>

        <div
          style={{
            display: 'grid',
            gap: '5px',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          }}
        >
          {([
            ['Modules', componentBom.moduleCount.toString()],
            ['Material', formatHomeEstimateEur(componentBom.materialCostEstimate)],
            ['Labor', formatHomeEstimateEur(componentBom.laborCostEstimate)],
            ['Waste', formatHomeEstimateEur(componentBom.wasteCostEstimate)],
          ] as const).map(([label, value]) => (
            <div
              key={label}
              data-home-project-summary-component-bom-total={`${label}:${value}`}
              style={{
                background: 'rgba(15, 23, 42, 0.46)',
                border: '1px solid rgba(125, 211, 252, 0.12)',
                borderRadius: '9px',
                padding: '6px 7px',
              }}
            >
              <div style={{ color: '#7dd3fc', fontSize: '0.5rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
              <div style={{ color: '#fef3c7', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 950, marginTop: '3px' }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gap: '6px' }}>
          {componentBom.groups.map((group) => (
            <div
              key={group.category}
              data-home-project-summary-component-bom-group={`${group.category}:${group.quantity}:${group.unit}:${group.materialCostEstimate}:${group.laborCostEstimate}:${group.wasteCostEstimate}:${group.subtotal}`}
              data-home-project-summary-print-card="true"
              style={{
                background: 'rgba(2, 6, 23, 0.2)',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                borderRadius: '10px',
                display: 'grid',
                gap: '5px',
                padding: isTouchDevice ? '6px 7px' : '7px 8px',
              }}
            >
              <div style={{ alignItems: 'start', display: 'grid', gap: '8px', gridTemplateColumns: '1fr auto' }}>
                <span style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 880, lineHeight: 1.25 }}>
                  {COMPONENT_BOM_CATEGORY_LABELS[group.category]} <span style={{ color: '#7dd3fc' }}>({group.quantity} {formatComponentBomUnit(group.unit)})</span>
                </span>
                <span style={{ color: '#fef3c7', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 950 }}>
                  {formatHomeEstimateEur(group.subtotal)}
                </span>
              </div>
              <div style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.52rem' : '0.56rem', fontWeight: 780, lineHeight: 1.25 }}>
                Material {formatHomeEstimateEur(group.materialCostEstimate)} / labor {formatHomeEstimateEur(group.laborCostEstimate)} / waste {formatHomeEstimateEur(group.wasteCostEstimate)}
              </div>
              <div style={{ color: '#7dd3fc', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 760, lineHeight: 1.25 }}>
                Modules: {group.moduleIds.join(', ')}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(125, 211, 252, 0.14)',
            display: 'grid',
            gap: '5px',
            paddingTop: '7px',
          }}
        >
          {bomPackageRows.map(([label, value]) => (
            <div
              key={label}
              data-home-project-summary-bom-package={`${label}:${value}`}
              style={{
                alignItems: 'center',
                display: 'grid',
                gap: '8px',
                gridTemplateColumns: '1fr auto',
              }}
            >
              <span style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 820 }}>{label}</span>
              <span style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 920 }}>{value}</span>
            </div>
          ))}
        </div>

        <div
          data-home-project-summary-component-bom-subtotal-label="true"
          style={{
            alignItems: 'center',
            borderTop: '1px solid rgba(125, 211, 252, 0.14)',
            display: 'grid',
            gap: '8px',
            gridTemplateColumns: '1fr auto',
            paddingTop: '7px',
          }}
        >
          <span style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 900 }}>Component BOM subtotal</span>
          <span style={{ color: '#fef3c7', fontSize: isTouchDevice ? '0.62rem' : '0.68rem', fontWeight: 980 }}>{formatHomeEstimateEur(componentBom.subtotal)}</span>
        </div>
      </div>

      <div
        aria-label="Project summary pricing database"
        data-home-project-summary-pricing-database="true"
        data-home-project-summary-pricing-confidence={estimate.pricing.confidenceLevel}
        data-home-project-summary-pricing-cost-region={estimate.pricing.costRegion}
        data-home-project-summary-pricing-currency={estimate.pricing.currency}
        data-home-project-summary-pricing-price-date={estimate.pricing.priceDate}
        data-home-project-summary-print-card="true"
        style={{
          background: 'rgba(14, 165, 233, 0.1)',
          border: '1px solid rgba(125, 211, 252, 0.18)',
          borderRadius: '13px',
          display: 'grid',
          gap: '6px',
          marginTop: isTouchDevice ? '9px' : '10px',
          padding: isTouchDevice ? '8px' : '10px',
        }}
      >
        <div style={{ color: '#7dd3fc', fontSize: '0.56rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Pricing DB v1
        </div>
        <div style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 820, lineHeight: 1.28 }}>
          {estimate.pricing.currency} / {estimate.pricing.costRegionLabel} / prices {estimate.pricing.priceDate} / {estimate.pricing.confidenceLabel}.
        </div>
        <div style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.54rem' : '0.58rem', fontWeight: 780, lineHeight: 1.28 }}>
          {estimate.pricing.disclaimer}
        </div>
        <div style={{ display: 'grid', gap: '5px', gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
          {estimate.pricing.categoryTotals.map((item) => (
            <div
              key={item.category}
              data-home-project-summary-pricing-category={`${item.category}:${item.amount}`}
              style={{
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.34)',
                border: '1px solid rgba(125, 211, 252, 0.12)',
                borderRadius: '9px',
                display: 'grid',
                gap: '8px',
                gridTemplateColumns: '1fr auto',
                padding: '6px 7px',
              }}
            >
              <span style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 820 }}>{item.label}</span>
              <span style={{ color: '#fef3c7', fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 950 }}>{formatHomeEstimateEur(item.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        aria-label="Project summary structured pre-quote estimate"
        data-home-project-summary-estimate-sections="true"
        data-home-project-summary-estimate-section-count={estimate.sections.length}
        data-home-project-summary-print-card="true"
        style={{
          background: 'rgba(15, 23, 42, 0.44)',
          border: '1px solid rgba(125, 211, 252, 0.18)',
          borderRadius: '13px',
          display: 'grid',
          gap: '8px',
          marginTop: isTouchDevice ? '9px' : '10px',
          padding: isTouchDevice ? '8px' : '10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'start' }}>
          <div>
            <div style={{ color: '#7dd3fc', fontSize: '0.56rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Structured pre-quote estimate
            </div>
            <div style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.54rem' : '0.58rem', fontWeight: 760, lineHeight: 1.28, marginTop: '3px' }}>
              Each section shows quantity, unit, unit cost, subtotal and confidence for buyer review.
            </div>
          </div>
          <div
            style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              borderRadius: '999px',
              color: '#fde68a',
              fontSize: isTouchDevice ? '0.48rem' : '0.5rem',
              fontWeight: 950,
              lineHeight: 1,
              padding: '5px 7px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Preview only
          </div>
        </div>

        {estimate.sections.map((section) => (
          <div
            key={section.id}
            data-home-project-summary-estimate-section={`${section.id}:${section.subtotal}:${section.confidence}`}
            style={{
              background: 'rgba(2, 6, 23, 0.22)',
              border: '1px solid rgba(148, 163, 184, 0.13)',
              borderRadius: '11px',
              display: 'grid',
              gap: '7px',
              padding: isTouchDevice ? '7px 8px' : '8px 9px',
            }}
          >
            <div style={{ alignItems: 'start', display: 'grid', gap: '8px', gridTemplateColumns: '1fr auto' }}>
              <div>
                <div style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.6rem' : '0.64rem', fontWeight: 940, lineHeight: 1.2 }}>
                  {section.label}
                </div>
                <div style={{ color: '#93c5fd', fontSize: isTouchDevice ? '0.52rem' : '0.56rem', fontWeight: 760, lineHeight: 1.25, marginTop: '2px' }}>
                  {section.description}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: section.subtotal === 0 ? '#93c5fd' : '#fef3c7', fontSize: isTouchDevice ? '0.6rem' : '0.64rem', fontWeight: 960 }}>
                  {formatHomeEstimateEur(section.subtotal)}
                </div>
                <div style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.48rem' : '0.5rem', fontWeight: 850, marginTop: '2px', textTransform: 'uppercase' }}>
                  {section.confidence}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '5px' }}>
              {section.lineItems.map((item) => (
                <div
                  key={item.id}
                  data-home-project-summary-estimate-section-line={`${section.id}:${item.id}:${item.quantity}:${item.unit}:${item.unitCost ?? 'review'}:${item.subtotal ?? 'review'}:${item.confidence}`}
                  style={{
                    background: item.isExcluded ? 'rgba(127, 29, 29, 0.14)' : item.isPlaceholder ? 'rgba(120, 53, 15, 0.14)' : 'rgba(15, 23, 42, 0.36)',
                    border: item.isExcluded ? '1px solid rgba(252, 165, 165, 0.18)' : '1px solid rgba(125, 211, 252, 0.1)',
                    borderRadius: '9px',
                    display: 'grid',
                    gap: '4px',
                    padding: '6px 7px',
                  }}
                >
                  <div style={{ alignItems: 'start', display: 'grid', gap: '8px', gridTemplateColumns: '1fr auto' }}>
                    <span style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 850, lineHeight: 1.24 }}>
                      {item.label}
                    </span>
                    <span style={{ color: item.subtotal === null ? '#fecaca' : item.subtotal === 0 ? '#93c5fd' : '#fef3c7', fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 950, whiteSpace: 'nowrap' }}>
                      {formatEstimateAmount(item.subtotal)}
                    </span>
                  </div>
                  <div style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 760, lineHeight: 1.28 }}>
                    Qty {item.quantity} / unit {item.unit} / unit cost {formatEstimateAmount(item.unitCost)} / confidence {item.confidence}
                  </div>
                  {item.note ? (
                    <div style={{ color: '#93c5fd', fontSize: isTouchDevice ? '0.48rem' : '0.52rem', fontWeight: 720, lineHeight: 1.25 }}>
                      {item.note}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        data-home-project-summary-total="true"
        data-home-project-summary-print-card="true"
        style={{
          alignItems: 'end',
          borderTop: '1px solid rgba(125, 211, 252, 0.22)',
          display: 'grid',
          gap: '10px',
          gridTemplateColumns: '1fr auto',
          marginTop: isTouchDevice ? '9px' : '10px',
          paddingTop: isTouchDevice ? '9px' : '10px',
        }}
      >
        <span style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.6rem' : '0.64rem', fontWeight: 900 }}>Estimated total for discussion</span>
        <span style={{ color: '#fef9c3', fontSize: isTouchDevice ? '1rem' : '1.1rem', fontWeight: 980 }}>{formatHomeEstimateEur(estimate.estimatedTotal)}</span>
      </div>

      <div
        aria-label="Project summary scope of supply"
        data-home-project-summary-scope="true"
        style={{
          borderTop: '1px solid rgba(125, 211, 252, 0.18)',
          display: 'grid',
          gap: '7px',
          marginTop: isTouchDevice ? '9px' : '10px',
          paddingTop: isTouchDevice ? '9px' : '10px',
        }}
      >
        <div style={{ color: '#7dd3fc', fontSize: '0.56rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Scope of supply
        </div>
        {estimate.scopeOfSupply.map((section) => (
          <div
            key={section.id}
            data-home-project-summary-print-card="true"
            data-home-project-summary-scope-section={section.id}
            style={{
              background: 'rgba(15, 23, 42, 0.44)',
              border: '1px solid rgba(148, 163, 184, 0.14)',
              borderRadius: '10px',
              padding: isTouchDevice ? '7px 8px' : '8px 9px',
            }}
          >
            <div
              style={{
                color: section.id === 'included' ? '#bbf7d0' : section.id === 'optional' ? '#fde68a' : '#fecaca',
                fontSize: '0.54rem',
                fontWeight: 950,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {section.label}
            </div>
            <div style={{ display: 'grid', gap: '4px', marginTop: '5px' }}>
              {section.items.map((item) => (
                <div
                  key={item}
                  data-home-project-summary-scope-item={`${section.id}:${item}`}
                  style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 800, lineHeight: 1.3 }}
                >
                  - {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        data-home-project-summary-quote-info="true"
        data-home-project-summary-print-card="true"
        style={{
          background: 'rgba(12, 74, 110, 0.28)',
          border: '1px solid rgba(125, 211, 252, 0.2)',
          borderRadius: '12px',
          color: '#e0f2fe',
          display: 'grid',
          fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
          fontWeight: 820,
          gap: '5px',
          lineHeight: 1.32,
          marginTop: isTouchDevice ? '9px' : '10px',
          padding: isTouchDevice ? '8px' : '9px',
        }}
      >
        <div style={{ color: '#7dd3fc', fontSize: '0.54rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Quote request info
        </div>
        <div data-home-project-summary-quote-count={quoteQueue.count}>
          Local preview requests saved: {quoteQueue.count}. Latest: {quoteQueue.latestModel ?? 'none'} / {formatOptionalDate(quoteQueue.latestCreatedAt)}.
        </div>
        <div>
          The current selected model, options and estimate are attached when the preview quote form is saved. No live quote is submitted yet.
        </div>
      </div>

      <div
        data-home-project-summary-disclaimer="true"
        data-home-project-summary-print-card="true"
        style={{
          color: '#bae6fd',
          fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
          fontWeight: 800,
          lineHeight: 1.28,
          marginTop: isTouchDevice ? '8px' : '9px',
        }}
      >
        {normalizeEstimateDisclaimer(estimate.disclaimer)}
      </div>

      <pre
        data-home-project-summary-copy-text="true"
        data-home-project-summary-print-hidden="true"
        style={{
          background: 'rgba(2, 6, 23, 0.48)',
          border: '1px solid rgba(125, 211, 252, 0.18)',
          borderRadius: '10px',
          color: '#e0f2fe',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          fontSize: isTouchDevice ? '0.54rem' : '0.58rem',
          lineHeight: 1.35,
          margin: isTouchDevice ? '9px 0 0' : '10px 0 0',
          maxHeight: isTouchDevice ? '110px' : '130px',
          overflow: 'auto',
          padding: '8px',
          whiteSpace: 'pre-wrap',
        }}
      >
        {summaryText}
      </pre>

      <div data-home-project-summary-print-hidden="true" style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginTop: isTouchDevice ? '9px' : '10px' }}>
        <button
          type="button"
          data-home-project-summary-copy="true"
          onClick={(event) => {
            event.stopPropagation();
            void copySummary();
          }}
          style={{
            background: 'rgba(14, 165, 233, 0.24)',
            border: '1px solid rgba(125, 211, 252, 0.36)',
            borderRadius: '999px',
            color: '#e0f2fe',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: '0.58rem',
            fontWeight: 920,
            letterSpacing: '0.08em',
            padding: '7px 9px',
            textTransform: 'uppercase',
          }}
        >
          Copy summary
        </button>
        <button
          type="button"
          data-home-project-summary-print="true"
          onClick={(event) => {
            event.stopPropagation();
            printSummary();
          }}
          style={{
            background: 'rgba(251, 191, 36, 0.18)',
            border: '1px solid rgba(251, 191, 36, 0.34)',
            borderRadius: '999px',
            color: '#fef3c7',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: '0.58rem',
            fontWeight: 920,
            letterSpacing: '0.08em',
            padding: '7px 9px',
            textTransform: 'uppercase',
          }}
        >
          Print from browser
        </button>
      </div>

      {copyStatus ? (
        <div data-home-project-summary-copy-status="true" data-home-project-summary-print-hidden="true" style={{ color: '#bbf7d0', fontSize: '0.6rem', fontWeight: 880, marginTop: '8px' }}>
          {copyStatus}
        </div>
      ) : null}
    </section>
  );
}
