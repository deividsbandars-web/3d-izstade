import {
  formatHomeEstimateEur,
  getModularHomeEstimateConfidenceLabel,
  getModularHomeEstimatePriceSourceLabel,
  getModularHomeEstimateSourceTypeLabel,
  type ModularHomeEstimate,
  type ModularHomeEstimateConfidence,
  type ModularHomeEstimatePriceSource,
  type ModularHomeEstimateSectionLineItem,
} from './modularHomeEstimate';
import type { ModularHomePreviewConfig } from './modularHomeConfig';
import type {
  ModularHomeComponentBom,
  ModularHomeComponentCategory,
  ModularHomeComponentUnit,
  ModularHomeManufacturingBom,
} from './modularHomeComponents';
import type { ModularHomeMaterialTakeoff } from './modularHomeMaterialTakeoff';
import type {
  ModularHomeDimensionPreset,
  ModularHomeLayoutVariant,
  ModularHomeProductionConstraint,
  ModularHomeProductionConstraintSeverity,
  ModularHomeRoomUseProfile,
} from './modularHomeProducts';
import {
  MODULAR_HOME_DEFAULT_SUPPLIER_COST_MAP,
  MODULAR_HOME_SUPPLIER_COST_DATASET_NOTE,
} from './modularHomeSupplierCosts';

const HOME_PRODUCTION_CONSTRAINT_SEVERITY_LABELS = {
  blocked: 'Blocked',
  info: 'Info',
  requiresReview: 'Requires review',
  warning: 'Warning',
} as const satisfies Record<ModularHomeProductionConstraintSeverity, string>;

const HOME_PRODUCTION_CONSTRAINT_SEVERITY_STYLES = {
  blocked: {
    background: 'rgba(127, 29, 29, 0.28)',
    border: '1px solid rgba(248, 113, 113, 0.32)',
    color: '#fecaca',
  },
  info: {
    background: 'rgba(14, 165, 233, 0.12)',
    border: '1px solid rgba(125, 211, 252, 0.2)',
    color: '#bae6fd',
  },
  requiresReview: {
    background: 'rgba(251, 191, 36, 0.14)',
    border: '1px solid rgba(251, 191, 36, 0.28)',
    color: '#fde68a',
  },
  warning: {
    background: 'rgba(251, 146, 60, 0.14)',
    border: '1px solid rgba(253, 186, 116, 0.26)',
    color: '#fed7aa',
  },
} as const satisfies Record<ModularHomeProductionConstraintSeverity, {
  background: string;
  border: string;
  color: string;
}>;

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
    return `m${String.fromCharCode(178)}`;
  }

  if (unit === 'linearM') {
    return 'linear m';
  }

  return unit;
}

function formatQuantityM2(value: number): string {
  return `${value.toLocaleString('en-IE', { maximumFractionDigits: 2 })} m${String.fromCharCode(178)}`;
}

function formatQuantityLinearM(value: number): string {
  return `${value.toLocaleString('en-IE', { maximumFractionDigits: 1 })} lm`;
}

function formatWasteFactor(value: number): string {
  return `${(value * 100).toLocaleString('en-IE', { maximumFractionDigits: 1 })}%`;
}

function formatOpeningTypeLabel(value: 'window' | 'exteriorDoor' | 'terraceDoor' | 'interiorDoorPlaceholder'): string {
  switch (value) {
    case 'window':
      return 'Window';
    case 'exteriorDoor':
      return 'Exterior door';
    case 'terraceDoor':
      return 'Terrace door';
    case 'interiorDoorPlaceholder':
      return 'Interior door placeholder';
    default:
      return value;
  }
}

function formatEstimateAmount(amount: number | null): string {
  return amount === null ? 'Requires review' : formatHomeEstimateEur(amount);
}

const ESTIMATE_CONFIDENCE_BADGE_STYLES = {
  estimated: {
    background: 'rgba(59, 130, 246, 0.14)',
    border: '1px solid rgba(96, 165, 250, 0.24)',
    color: '#bfdbfe',
  },
  packageFixed: {
    background: 'rgba(34, 197, 94, 0.13)',
    border: '1px solid rgba(74, 222, 128, 0.24)',
    color: '#bbf7d0',
  },
  requiresEngineering: {
    background: 'rgba(248, 113, 113, 0.14)',
    border: '1px solid rgba(252, 165, 165, 0.24)',
    color: '#fecaca',
  },
  siteDependent: {
    background: 'rgba(251, 146, 60, 0.14)',
    border: '1px solid rgba(253, 186, 116, 0.24)',
    color: '#fed7aa',
  },
} as const satisfies Record<ModularHomeEstimateConfidence, { background: string; border: string; color: string }>;

const ESTIMATE_PRICE_SOURCE_BADGE_STYLES = {
  internalPreview: {
    background: 'rgba(14, 165, 233, 0.12)',
    border: '1px solid rgba(125, 211, 252, 0.22)',
    color: '#bae6fd',
  },
  manualReviewRequired: {
    background: 'rgba(244, 63, 94, 0.12)',
    border: '1px solid rgba(251, 113, 133, 0.22)',
    color: '#fecdd3',
  },
  supplierPlaceholder: {
    background: 'rgba(234, 179, 8, 0.12)',
    border: '1px solid rgba(253, 224, 71, 0.22)',
    color: '#fef08a',
  },
} as const satisfies Record<ModularHomeEstimatePriceSource, { background: string; border: string; color: string }>;

function createEstimateBadgeStyle(
  style: { background: string; border: string; color: string },
  isTouchDevice: boolean,
) {
  return {
    ...style,
    borderRadius: '999px',
    fontSize: isTouchDevice ? '0.46rem' : '0.5rem',
    fontWeight: 950,
    letterSpacing: '0.06em',
    lineHeight: 1,
    padding: '4px 6px',
    textTransform: 'uppercase' as const,
    whiteSpace: 'nowrap' as const,
  };
}

function renderEstimateReliabilityBadges(
  item: Pick<ModularHomeEstimateSectionLineItem, 'confidence' | 'lastUpdated' | 'priceSource'>,
  isTouchDevice: boolean,
) {
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '5px',
      }}
    >
      <span style={createEstimateBadgeStyle(ESTIMATE_CONFIDENCE_BADGE_STYLES[item.confidence], isTouchDevice)}>
        {getModularHomeEstimateConfidenceLabel(item.confidence)}
      </span>
      <span style={createEstimateBadgeStyle(ESTIMATE_PRICE_SOURCE_BADGE_STYLES[item.priceSource], isTouchDevice)}>
        {getModularHomeEstimatePriceSourceLabel(item.priceSource)}
      </span>
      <span
        style={{
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(148, 163, 184, 0.14)',
          borderRadius: '999px',
          color: '#cbd5e1',
          fontSize: isTouchDevice ? '0.46rem' : '0.5rem',
          fontWeight: 850,
          lineHeight: 1,
          padding: '4px 6px',
          whiteSpace: 'nowrap',
        }}
      >
        Updated {item.lastUpdated}
      </span>
    </div>
  );
}

function renderProductionConstraintCard(
  constraint: ModularHomeProductionConstraint,
  isTouchDevice: boolean,
) {
  const style = HOME_PRODUCTION_CONSTRAINT_SEVERITY_STYLES[constraint.severity];

  return (
    <div
      key={constraint.id}
      data-home-production-constraint={constraint.id}
      data-home-production-constraint-affected={constraint.affectedOptions.join(',')}
      data-home-production-constraint-next-step={constraint.nextStep}
      data-home-production-constraint-severity={constraint.severity}
      style={{
        ...style,
        borderRadius: '11px',
        display: 'grid',
        gap: '4px',
        padding: isTouchDevice ? '7px 8px' : '8px 9px',
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        <span
          style={{
            background: 'rgba(2, 6, 23, 0.26)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '999px',
            fontSize: isTouchDevice ? '0.47rem' : '0.5rem',
            fontWeight: 950,
            letterSpacing: '0.08em',
            lineHeight: 1,
            padding: '4px 6px',
            textTransform: 'uppercase',
          }}
        >
          {HOME_PRODUCTION_CONSTRAINT_SEVERITY_LABELS[constraint.severity]}
        </span>
        <span style={{ fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 920, lineHeight: 1.2 }}>
          {constraint.message}
        </span>
      </div>
      <div style={{ color: 'inherit', fontSize: isTouchDevice ? '0.52rem' : '0.56rem', fontWeight: 760, lineHeight: 1.28, opacity: 0.92 }}>
        Affects: {constraint.affectedOptions.length > 0 ? constraint.affectedOptions.join(', ') : 'current configuration'}
      </div>
      <div style={{ color: 'inherit', fontSize: isTouchDevice ? '0.52rem' : '0.56rem', fontWeight: 820, lineHeight: 1.28 }}>
        Next step: {constraint.nextStep}
      </div>
    </div>
  );
}

type ModularHomeEstimatePanelProps = {
  componentBom: ModularHomeComponentBom;
  dimensionPreset: ModularHomeDimensionPreset | null;
  estimate: ModularHomeEstimate;
  isTouchDevice: boolean;
  layoutVariant: ModularHomeLayoutVariant | null;
  manufacturingBom: ModularHomeManufacturingBom;
  materialTakeoff: ModularHomeMaterialTakeoff;
  roomUseProfile: ModularHomeRoomUseProfile | null;
  template: ModularHomePreviewConfig;
  visibleProductionConstraints: readonly ModularHomeProductionConstraint[];
};

export function ModularHomeEstimatePanel({
  componentBom,
  dimensionPreset,
  estimate,
  isTouchDevice,
  layoutVariant,
  manufacturingBom,
  materialTakeoff,
  roomUseProfile,
  template,
  visibleProductionConstraints,
}: ModularHomeEstimatePanelProps) {
  const supplierCostItemCount = MODULAR_HOME_DEFAULT_SUPPLIER_COST_MAP.validItems.length;
  const bomPackageRows = [
    ['Facade package', estimate.selectedOptions.facade],
    ['Layout variant', estimate.selectedOptions.layoutVariant],
    ['Dimension preset', estimate.selectedOptions.dimensionPreset],
    ['Room use', estimate.selectedOptions.roomUseProfile],
    ['Roof package', estimate.selectedOptions.roof],
    ['Roof edge color', estimate.selectedOptions.roofEdgeColor],
    ['Terrace package', estimate.selectedOptions.terrace],
    ['Finish package', estimate.selectedOptions.finishLevel],
    ['Furniture package', estimate.selectedOptions.furniturePackage],
    ['Sofa', estimate.selectedOptions.sofa],
    ['Table', estimate.selectedOptions.table],
    ['Bed', estimate.selectedOptions.bed],
    ['Kitchen line', estimate.selectedOptions.kitchenLine],
    ['Wardrobe placeholder', estimate.selectedOptions.wardrobePlaceholder],
    ['Interior wall finish', estimate.selectedOptions.interiorWallFinish],
    ['Floor finish', estimate.selectedOptions.floorFinish],
    ['Window package', estimate.selectedOptions.windowPackage],
    ['Window placement', estimate.selectedOptions.windowPlacement],
    ['Window frame color', estimate.selectedOptions.windowFrameColor],
    ['Window frame type', estimate.selectedOptions.windowFrameType],
    ['Door package', estimate.selectedOptions.doorPackage],
    ['Door placement', estimate.selectedOptions.doorPlacement],
    ['Facade board orientation', estimate.selectedOptions.facadeBoardOrientation],
    ['Facade board width', estimate.selectedOptions.facadeBoardWidth],
    ['Facade board profile', estimate.selectedOptions.facadeBoardProfile],
    ['Facade board spacing', estimate.selectedOptions.facadeBoardSpacing],
    ['Trim color', estimate.selectedOptions.trimColor],
    ['Roof edge/gutter style', estimate.selectedOptions.roofGutterStyle],
    ['Interior floor style', estimate.selectedOptions.interiorFloorStyle],
    ['Wall panel style', estimate.selectedOptions.wallPanelStyle],
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

  return (
          <section
            aria-label={`${template.name} preview estimate`}
            data-home-estimate-panel="true"
            data-home-estimate-total={estimate.estimatedTotal}
            style={{
              background: 'linear-gradient(180deg, rgba(12, 20, 36, 0.82), rgba(2, 6, 23, 0.62))',
              border: '1px solid rgba(96, 165, 250, 0.26)',
              borderRadius: isTouchDevice ? '15px' : '17px',
              marginTop: isTouchDevice ? '10px' : '12px',
              padding: isTouchDevice ? '10px' : '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start' }}>
              <div>
                <div style={{ color: '#93c5fd', fontSize: '0.58rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Preview estimate
                </div>
                <div
                  data-home-estimate-base-model="true"
                  style={{
                    color: '#eff6ff',
                    fontSize: isTouchDevice ? '0.8rem' : '0.88rem',
                    fontWeight: 950,
                    lineHeight: 1.08,
                    marginTop: '4px',
                  }}
                >
                  {estimate.baseModel}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#bfdbfe', fontSize: '0.56rem', fontWeight: 850 }}>{estimate.basePriceLabel}</div>
                <div data-home-estimate-base-price="true" style={{ color: '#f8fafc', fontSize: isTouchDevice ? '0.8rem' : '0.9rem', fontWeight: 950 }}>
                  {formatHomeEstimateEur(estimate.basePrice)}
                </div>
              </div>
            </div>
    
            {layoutVariant ? (
              <div
                data-home-estimate-layout-note={layoutVariant.id}
                style={{
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.16)',
                  borderRadius: '11px',
                  color: '#bbf7d0',
                  fontSize: isTouchDevice ? '0.55rem' : '0.6rem',
                  fontWeight: 800,
                  lineHeight: 1.28,
                  marginTop: isTouchDevice ? '8px' : '9px',
                  padding: isTouchDevice ? '7px 8px' : '8px 9px',
                }}
              >
                {layoutVariant.estimateNote}
              </div>
            ) : null}
    
            {dimensionPreset ? (
              <div
                data-home-estimate-dimension-preset-note={dimensionPreset.id}
                style={{
                  background: 'rgba(14, 165, 233, 0.1)',
                  border: '1px solid rgba(125, 211, 252, 0.2)',
                  borderRadius: '11px',
                  color: '#bae6fd',
                  fontSize: isTouchDevice ? '0.55rem' : '0.6rem',
                  fontWeight: 780,
                  lineHeight: 1.28,
                  marginTop: isTouchDevice ? '8px' : '9px',
                  padding: isTouchDevice ? '7px 8px' : '8px 9px',
                }}
              >
                <strong style={{ color: '#7dd3fc' }}>Dimension preset:</strong> {dimensionPreset.estimateNote}
              </div>
            ) : null}
    
            {roomUseProfile ? (
              <div
                data-home-estimate-room-use-note={roomUseProfile.id}
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(96, 165, 250, 0.2)',
                  borderRadius: '11px',
                  color: '#dbeafe',
                  fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
                  fontWeight: 780,
                  lineHeight: 1.28,
                  marginTop: isTouchDevice ? '8px' : '9px',
                  padding: isTouchDevice ? '7px 8px' : '8px 9px',
                }}
              >
                <strong style={{ color: '#93c5fd' }}>Room-use note:</strong> {roomUseProfile.estimateNote}
              </div>
            ) : null}
    
            <div
              aria-label="Pricing database metadata"
              data-home-pricing-database="true"
              data-home-pricing-confidence={estimate.pricing.confidenceLevel}
              data-home-pricing-cost-region={estimate.pricing.costRegion}
              data-home-pricing-currency={estimate.pricing.currency}
              data-home-pricing-price-date={estimate.pricing.priceDate}
              style={{
                background: 'rgba(14, 165, 233, 0.1)',
                border: '1px solid rgba(125, 211, 252, 0.18)',
                borderRadius: '999px',
                color: '#bae6fd',
                fontSize: isTouchDevice ? '0.52rem' : '0.56rem',
                fontWeight: 880,
                lineHeight: 1.3,
                marginTop: isTouchDevice ? '8px' : '9px',
                padding: isTouchDevice ? '6px 8px' : '7px 10px',
              }}
            >
              Pricing DB v1 / {estimate.pricing.currency} / {estimate.pricing.costRegionLabel} / prices {estimate.pricing.priceDate} / {estimate.pricing.confidenceLabel}
            </div>
    
            <div
              data-home-estimate-supplier-pricing-note="true"
              data-home-estimate-supplier-pricing-item-count={supplierCostItemCount}
              style={{
                background: 'rgba(14, 165, 233, 0.08)',
                border: '1px solid rgba(125, 211, 252, 0.14)',
                borderRadius: '10px',
                color: '#bae6fd',
                fontSize: isTouchDevice ? '0.52rem' : '0.56rem',
                fontWeight: 820,
                lineHeight: 1.3,
                marginTop: isTouchDevice ? '7px' : '8px',
                padding: isTouchDevice ? '7px 8px' : '8px 9px',
              }}
            >
              {MODULAR_HOME_SUPPLIER_COST_DATASET_NOTE} Imported preview items: {supplierCostItemCount}. Invalid supplier rows are rejected and estimate pricing falls back to the internal preview database.
            </div>
    
            <div
              aria-label="Estimate scenarios and price confidence v5"
              data-home-estimate-scenarios="true"
              data-home-estimate-scenario-count={estimate.scenarios.length}
              data-home-estimate-price-confidence-version={estimate.priceConfidenceVersion}
              style={{
                background: 'rgba(15, 23, 42, 0.46)',
                border: '1px solid rgba(96, 165, 250, 0.2)',
                borderRadius: '13px',
                display: 'grid',
                gap: '8px',
                marginTop: isTouchDevice ? '9px' : '10px',
                padding: isTouchDevice ? '8px' : '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'start' }}>
                <div>
                  <div style={{ color: '#bfdbfe', fontSize: '0.56rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Estimate scenarios
                  </div>
                  <div style={{ color: '#93c5fd', fontSize: isTouchDevice ? '0.54rem' : '0.58rem', fontWeight: 760, lineHeight: 1.28, marginTop: '3px' }}>
                    Price confidence {estimate.priceConfidenceVersion}: base, expected, premium and site-dependent extras for commercial discussion.
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
                  Final quote required
                </div>
              </div>
    
              <div style={{ display: 'grid', gap: isTouchDevice ? '7px' : '8px', gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
                {estimate.scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    data-home-estimate-scenario={`${scenario.id}:${scenario.amount}:${scenario.confidence}:${scenario.priceSource}`}
                    style={{
                      background: scenario.id === 'expected'
                        ? 'rgba(34, 197, 94, 0.09)'
                        : scenario.id === 'premium'
                          ? 'rgba(251, 191, 36, 0.08)'
                          : 'rgba(2, 6, 23, 0.24)',
                      border: scenario.id === 'expected'
                        ? '1px solid rgba(34, 197, 94, 0.2)'
                        : scenario.id === 'premium'
                          ? '1px solid rgba(251, 191, 36, 0.18)'
                          : '1px solid rgba(148, 163, 184, 0.12)',
                      borderRadius: '11px',
                      display: 'grid',
                      gap: '6px',
                      padding: isTouchDevice ? '7px 8px' : '8px 9px',
                    }}
                  >
                    <div style={{ alignItems: 'start', display: 'grid', gap: '8px', gridTemplateColumns: '1fr auto' }}>
                      <div>
                        <div style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.62rem' : '0.66rem', fontWeight: 940, lineHeight: 1.18 }}>
                          {scenario.label}
                        </div>
                        <div style={{ color: '#93c5fd', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 760, lineHeight: 1.26, marginTop: '3px' }}>
                          {scenario.description}
                        </div>
                      </div>
                      <div style={{ color: '#fef3c7', fontSize: isTouchDevice ? '0.66rem' : '0.72rem', fontWeight: 980, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {scenario.isAdditiveAllowance ? '+' : ''}{formatHomeEstimateEur(scenario.amount)}
                      </div>
                    </div>
                    {renderEstimateReliabilityBadges(scenario, isTouchDevice)}
                    <div style={{ color: '#dbeafe', fontSize: isTouchDevice ? '0.52rem' : '0.56rem', fontWeight: 780, lineHeight: 1.28 }}>
                      <strong style={{ color: '#bfdbfe' }}>Includes:</strong> {scenario.included.slice(0, 3).join(' / ')}
                    </div>
                    <div style={{ color: '#fde68a', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 780, lineHeight: 1.28 }}>
                      <strong>Excludes:</strong> {scenario.exclusions.slice(0, 3).join(' / ')}
                    </div>
                    <div style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 740, lineHeight: 1.28 }}>
                      {scenario.vatMarginNote}
                    </div>
                    <div style={{ color: '#fecaca', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 820, lineHeight: 1.28 }}>
                      {scenario.finalQuoteRequirement}
                    </div>
                  </div>
                ))}
              </div>
            </div>
    
            {visibleProductionConstraints.length > 0 ? (
              <div
                aria-label="Estimate production readiness constraints"
                data-home-estimate-production-constraints="true"
                data-home-estimate-production-constraint-count={visibleProductionConstraints.length}
                style={{
                  background: 'rgba(15, 23, 42, 0.44)',
                  border: '1px solid rgba(251, 191, 36, 0.18)',
                  borderRadius: '13px',
                  display: 'grid',
                  gap: '6px',
                  marginTop: isTouchDevice ? '8px' : '9px',
                  padding: isTouchDevice ? '8px' : '10px',
                }}
              >
                <div style={{ color: '#fef3c7', fontSize: '0.56rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Estimate readiness
                </div>
                {visibleProductionConstraints.map((constraint) => renderProductionConstraintCard(constraint, isTouchDevice))}
              </div>
            ) : null}
    
            <div
              aria-label="Selected estimate options"
              style={{
                display: 'grid',
                gap: isTouchDevice ? '7px' : '8px',
                gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                marginTop: isTouchDevice ? '9px' : '10px',
              }}
            >
              {([
                ['Layout', estimate.selectedOptions.layoutVariant],
                ['Dimension preset', estimate.selectedOptions.dimensionPreset],
                ['Room use', estimate.selectedOptions.roomUseProfile],
                ['Facade', estimate.selectedOptions.facade],
                ['Roof', estimate.selectedOptions.roof],
                ['Terrace', estimate.selectedOptions.terrace],
                ['Finish', estimate.selectedOptions.finishLevel],
                ['Windows', estimate.selectedOptions.windowPackage],
                ['Window placement', estimate.selectedOptions.windowPlacement],
                ['Doors', estimate.selectedOptions.doorPackage],
                ['Door placement', estimate.selectedOptions.doorPlacement],
              ] as const).map(([label, value]) => (
                <div
                  key={label}
                  data-home-estimate-selected-option={`${label}:${value}`}
                  style={{
                    background: 'rgba(15, 23, 42, 0.52)',
                    border: '1px solid rgba(148, 163, 184, 0.16)',
                    borderRadius: '10px',
                    padding: isTouchDevice ? '8px 9px' : '8px 9px',
                  }}
                >
                  <div style={{ color: '#93c5fd', fontSize: '0.52rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 850, marginTop: '3px' }}>{value}</div>
                </div>
              ))}
            </div>
    
            <div
              aria-label="Approximate modular home quantity takeoff"
              data-home-estimate-quantity-takeoff="true"
              data-home-estimate-quantity-disclaimer={estimate.quantities.disclaimer}
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
                data-home-estimate-quantity-note="true"
                style={{
                  color: '#bfdbfe',
                  fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
                  fontWeight: 800,
                  lineHeight: 1.28,
                }}
              >
                {estimate.quantities.disclaimer}
              </div>
              <div style={{ display: 'grid', gap: isTouchDevice ? '7px' : '8px', gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
                {quantityRows.map(([id, label, value]) => (
                  <div
                    key={id}
                    data-home-estimate-quantity={`${id}:${value}`}
                    style={{
                      background: 'rgba(15, 23, 42, 0.46)',
                      border: '1px solid rgba(125, 211, 252, 0.12)',
                      borderRadius: '9px',
                      padding: isTouchDevice ? '8px 9px' : '7px 8px',
                    }}
                  >
                    <div style={{ color: '#93c5fd', fontSize: '0.5rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
                    <div style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 920, marginTop: '3px' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
    
            <div
              aria-label="Preview component BOM"
              data-home-estimate-bom-summary="true"
              data-home-estimate-bom-module-count={estimate.quantities.moduleCount}
              data-home-estimate-component-bom="true"
              data-home-estimate-component-bom-quantity-disclaimer={componentBom.quantities.disclaimer}
              data-home-estimate-component-bom-component-count={componentBom.componentCount}
              data-home-estimate-component-bom-subtotal={componentBom.subtotal}
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
                  data-home-estimate-bom-status="true"
                  data-home-estimate-component-bom-status="true"
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
                data-home-estimate-bom-note="true"
                data-home-estimate-component-bom-note="true"
                style={{
                  color: '#bfdbfe',
                  fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
                  fontWeight: 800,
                  lineHeight: 1.28,
                }}
              >
                {componentBom.disclaimer}
              </div>
    
              {layoutVariant ? (
                <div
                  data-home-estimate-component-bom-layout-note={layoutVariant.id}
                  style={{
                    color: '#bae6fd',
                    fontSize: isTouchDevice ? '0.54rem' : '0.58rem',
                    fontWeight: 760,
                    lineHeight: 1.3,
                  }}
                >
                  Layout note: {layoutVariant.bomNote}
                </div>
              ) : null}
    
              {dimensionPreset ? (
                <div
                  data-home-estimate-component-bom-dimension-preset-note={dimensionPreset.id}
                  style={{
                    color: '#bae6fd',
                    fontSize: isTouchDevice ? '0.54rem' : '0.58rem',
                    fontWeight: 760,
                    lineHeight: 1.3,
                  }}
                >
                  Dimension preset note: {dimensionPreset.bomNote}
                </div>
              ) : null}
    
              {roomUseProfile ? (
                <div
                  data-home-estimate-component-bom-room-use-note={roomUseProfile.id}
                  style={{
                    color: '#bfdbfe',
                    fontSize: isTouchDevice ? '0.54rem' : '0.58rem',
                    fontWeight: 780,
                    lineHeight: 1.28,
                  }}
                >
                  Room-use note: {roomUseProfile.bomNote}
                </div>
              ) : null}
    
              <div
                style={{
                  display: 'grid',
                  gap: isTouchDevice ? '7px' : '8px',
                  gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                }}
              >
                {([
                  ['Modules', estimate.quantities.moduleCount.toString()],
                  ['Material', formatHomeEstimateEur(componentBom.materialCostEstimate)],
                  ['Labor', formatHomeEstimateEur(componentBom.laborCostEstimate)],
                  ['Waste', formatHomeEstimateEur(componentBom.wasteCostEstimate)],
                ] as const).map(([label, value]) => (
                  <div
                    key={label}
                    data-home-estimate-component-bom-total={`${label}:${value}`}
                    style={{
                      background: 'rgba(15, 23, 42, 0.46)',
                      border: '1px solid rgba(125, 211, 252, 0.12)',
                      borderRadius: '9px',
                      padding: isTouchDevice ? '8px 9px' : '7px 8px',
                    }}
                  >
                    <div style={{ color: '#93c5fd', fontSize: '0.5rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
                    <div style={{ color: '#fef3c7', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 950, marginTop: '3px' }}>{value}</div>
                  </div>
                ))}
              </div>
    
              <div style={{ display: 'grid', gap: '6px' }}>
                {componentBom.groups.map((group) => (
                  <div
                    key={group.category}
                    data-home-estimate-component-bom-group={`${group.category}:${group.quantity}:${group.unit}:${group.materialCostEstimate}:${group.laborCostEstimate}:${group.wasteCostEstimate}:${group.subtotal}`}
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
                      <span style={{ color: '#dbeafe', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 880, lineHeight: 1.25 }}>
                        {COMPONENT_BOM_CATEGORY_LABELS[group.category]} <span style={{ color: '#93c5fd' }}>({group.quantity} {formatComponentBomUnit(group.unit)})</span>
                      </span>
                      <span style={{ color: '#fef3c7', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 950 }}>
                        {formatHomeEstimateEur(group.subtotal)}
                      </span>
                    </div>
                    <div style={{ color: '#bfdbfe', fontSize: isTouchDevice ? '0.52rem' : '0.56rem', fontWeight: 780, lineHeight: 1.25 }}>
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
                    data-home-estimate-bom-package={`${label}:${value}`}
                    style={{
                      alignItems: 'center',
                      display: 'grid',
                      gap: '8px',
                      gridTemplateColumns: '1fr auto',
                    }}
                  >
                    <span style={{ color: '#bfdbfe', fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 820 }}>{label}</span>
                    <span style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 920 }}>{value}</span>
                  </div>
                ))}
              </div>
    
              <div
                data-home-estimate-component-bom-subtotal-label="true"
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
              aria-label="Manufacturing BOM preview"
              data-home-estimate-manufacturing-bom="true"
              data-home-estimate-manufacturing-bom-disclaimer={manufacturingBom.disclaimer}
              data-home-estimate-manufacturing-bom-assembly-count={manufacturingBom.assemblyGroups.length}
              data-home-estimate-manufacturing-bom-component-code-count={manufacturingBom.componentCodes.length}
              data-home-estimate-manufacturing-bom-panel-count={manufacturingBom.panelGroups.reduce((total, group) => total + group.panelCount, 0)}
              data-home-estimate-manufacturing-bom-window-count={manufacturingBom.windowSchedule.reduce((total, item) => total + item.quantity, 0)}
              data-home-estimate-manufacturing-bom-door-count={manufacturingBom.doorSchedule.reduce((total, item) => total + item.quantity, 0)}
              data-home-estimate-manufacturing-bom-board-count={manufacturingBom.boardLengthGroups.reduce((total, group) => total + group.quantity, 0)}
              data-home-estimate-manufacturing-bom-hardware-count={manufacturingBom.fastenerHardwarePlaceholders.reduce((total, item) => total + item.quantity, 0)}
              style={{
                background: 'rgba(20, 83, 45, 0.18)',
                border: '1px solid rgba(134, 239, 172, 0.18)',
                borderRadius: '13px',
                display: 'grid',
                gap: '7px',
                marginTop: isTouchDevice ? '9px' : '10px',
                padding: isTouchDevice ? '8px' : '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'start' }}>
                <div style={{ color: '#86efac', fontSize: '0.56rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Manufacturing BOM preview
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
                  Not a cut list
                </div>
              </div>
    
              <div
                data-home-estimate-manufacturing-bom-note="true"
                style={{
                  color: '#bbf7d0',
                  fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
                  fontWeight: 800,
                  lineHeight: 1.28,
                }}
              >
                {manufacturingBom.disclaimer}
              </div>
    
              <div style={{ display: 'grid', gap: isTouchDevice ? '7px' : '8px', gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
                {([
                  ['Panel groups', manufacturingBom.panelGroups.length.toString()],
                  ['Assembly groups', manufacturingBom.assemblyGroups.length.toString()],
                  ['Component codes', manufacturingBom.componentCodes.length.toString()],
                  ['Openings', manufacturingBom.openingScheduleSummary.totalQuantity.toString()],
                  ['Material takeoff', `${formatQuantityM2(materialTakeoff.grossFloorAreaM2)} floor`],
                  ['Facade boards', formatQuantityLinearM(manufacturingBom.facadeBoardLinearM)],
                  ['Roof cassettes', formatQuantityM2(manufacturingBom.roofCassetteAreaM2)],
                  ['Floor cassettes', formatQuantityM2(manufacturingBom.floorCassetteAreaM2)],
                  ['Board groups', manufacturingBom.boardLengthGroups.length.toString()],
                  ['Hardware sets', manufacturingBom.fastenerHardwarePlaceholders.length.toString()],
                  ['Waste factor', formatWasteFactor(manufacturingBom.totalWasteFactor)],
                ] as const).map(([label, value]) => (
                  <div
                    key={label}
                    data-home-estimate-manufacturing-bom-total={`${label}:${value}`}
                    style={{
                      background: 'rgba(2, 6, 23, 0.24)',
                      border: '1px solid rgba(134, 239, 172, 0.12)',
                      borderRadius: '9px',
                      padding: isTouchDevice ? '8px 9px' : '7px 8px',
                    }}
                  >
                    <div style={{ color: '#86efac', fontSize: '0.5rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
                    <div style={{ color: '#dcfce7', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 920, marginTop: '3px' }}>{value}</div>
                  </div>
                ))}
              </div>
    
              <div
                data-home-estimate-opening-schedule="true"
                data-home-estimate-opening-count={manufacturingBom.openingScheduleSummary.totalQuantity}
                data-home-estimate-opening-review-count={manufacturingBom.openingScheduleSummary.reviewRequiredCount}
                style={{
                  background: 'rgba(2, 6, 23, 0.22)',
                  border: '1px solid rgba(134, 239, 172, 0.12)',
                  borderRadius: '10px',
                  display: 'grid',
                  gap: '5px',
                  padding: isTouchDevice ? '7px 8px' : '8px 9px',
                }}
              >
                <div style={{ color: '#86efac', fontSize: '0.5rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Opening schedule v1
                </div>
                <div style={{ color: '#dcfce7', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 860, lineHeight: 1.25 }}>
                  {manufacturingBom.openingScheduleSummary.windowCount} windows · {manufacturingBom.openingScheduleSummary.doorCount} external doors · {manufacturingBom.openingScheduleSummary.reviewRequiredCount} review-required openings · estimate impact {formatHomeEstimateEur(manufacturingBom.openingScheduleSummary.totalEstimateImpact)}
                </div>
                <div style={{ color: '#bbf7d0', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 760, lineHeight: 1.25 }}>
                  Controlled opening presets only. Widths/heights are preview schedule values and still require production verification.
                </div>
              </div>
    
              <div
                data-home-estimate-material-takeoff="true"
                data-home-estimate-material-window-area={materialTakeoff.totalWindowAreaM2}
                data-home-estimate-material-door-count={materialTakeoff.doorCount}
                style={{
                  background: 'rgba(14, 165, 233, 0.1)',
                  border: '1px solid rgba(125, 211, 252, 0.18)',
                  borderRadius: '10px',
                  display: 'grid',
                  gap: '5px',
                  padding: isTouchDevice ? '7px 8px' : '8px 9px',
                }}
              >
                <div style={{ color: '#7dd3fc', fontSize: '0.5rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Material takeoff v1
                </div>
                <div style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 860, lineHeight: 1.25 }}>
                  {formatQuantityM2(materialTakeoff.grossFloorAreaM2)} floor · {formatQuantityM2(materialTakeoff.facadeAreaM2)} facade · {formatQuantityM2(materialTakeoff.roofAreaM2)} roof · {formatQuantityM2(materialTakeoff.totalWindowAreaM2)} glazing · {materialTakeoff.doorCount} doors
                </div>
                <div style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 760, lineHeight: 1.24 }}>
                  {materialTakeoff.disclaimer}
                </div>
              </div>
    
              <div style={{ display: 'grid', gap: '6px' }}>
                {manufacturingBom.panelGroups.slice(0, 4).map((group) => (
                  <div
                    key={group.id}
                    data-home-estimate-manufacturing-panel-group={`${group.id}:${group.panelCount}:${group.areaM2}:${group.wasteFactor}`}
                    style={{
                      background: 'rgba(2, 6, 23, 0.2)',
                      border: '1px solid rgba(134, 239, 172, 0.12)',
                      borderRadius: '10px',
                      display: 'grid',
                      gap: '4px',
                      padding: isTouchDevice ? '6px 7px' : '7px 8px',
                    }}
                  >
                    <div style={{ color: '#d1fae5', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 900 }}>
                      {group.label} · {group.panelCount} panels · {formatQuantityM2(group.areaM2)}
                    </div>
                    <div style={{ color: '#bbf7d0', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 760, lineHeight: 1.25 }}>
                      {group.panelGroupId} / {group.componentCode} / {group.approximatePanelDimensions.join(' / ')}
                    </div>
                  </div>
                ))}
              </div>
    
              <div style={{ display: 'grid', gap: '5px' }}>
                {([
                  ['Window schedule', manufacturingBom.windowSchedule.map((item) => `${item.label}: ${item.quantity}`).join(' / ') || 'No windows'],
                  ['Door schedule', manufacturingBom.doorSchedule.map((item) => `${item.label}: ${item.quantity}`).join(' / ') || 'No doors'],
                  ['Opening schedule', manufacturingBom.openingSchedule.map((item) => `${item.openingId} ${formatOpeningTypeLabel(item.type)} ${item.wallSide} ${item.widthMm}x${item.heightMm}mm x${item.quantity}`).join(' / ') || 'No openings'],
                  ['Material takeoff', `floor ${formatQuantityM2(materialTakeoff.grossFloorAreaM2)} / facade ${formatQuantityM2(materialTakeoff.facadeAreaM2)} / boards ${formatQuantityLinearM(materialTakeoff.facadeBoardLinearM)} / glazing ${formatQuantityM2(materialTakeoff.totalWindowAreaM2)} / doors ${materialTakeoff.doorCount}`],
                  ['Terrace deck schedule', manufacturingBom.terraceDeckSchedule.map((item) => `${item.label}: ${formatQuantityM2(item.areaM2 ?? item.quantity)}`).join(' / ') || 'No terrace deck'],
                  ['Interior finish areas', manufacturingBom.interiorFinishAreas.map((item) => `${item.label}: ${formatQuantityM2(item.areaM2 ?? item.quantity)}`).join(' / ') || 'No interior finish'],
                  ['Panel size groups', manufacturingBom.panelSizeGroups.slice(0, 4).map((group) => `${group.label}: ${group.panelCount} pcs ${group.dimensions}`).join(' / ')],
                  ['Board length groups', manufacturingBom.boardLengthGroups.map((group) => `${group.label}: ${group.quantity} pcs x ${group.lengthM}m`).join(' / ')],
                  ['Assembly groups', manufacturingBom.assemblyGroups.map((group) => `${group.assemblyGroupId}: ${group.quantity} ${group.unit}`).join(' / ')],
                  ['Component codes', manufacturingBom.componentCodes.slice(0, 10).join(' / ')],
                  ['Panel group IDs', manufacturingBom.panelGroups.map((group) => group.panelGroupId).join(' / ')],
                  ['Board categories', manufacturingBom.boardLengthGroups.map((group) => `${group.boardLengthCategory}: ${group.quantity}`).join(' / ')],
                  ['Hardware groups', manufacturingBom.fastenerHardwarePlaceholders.map((item) => `${item.hardwareGroupId}: ${item.quantity} ${item.unit}`).join(' / ')],
                  ['Waste categories', manufacturingBom.wasteFactorsByMaterial.map((item) => `${item.materialCategory}: ${formatWasteFactor(item.wasteFactor)}`).join(' / ')],
                  ['Production batch notes', manufacturingBom.productionBatchNotes.slice(0, 2).join(' / ')],
                  ['Transport package notes', manufacturingBom.transportPackageNotes.slice(0, 2).join(' / ')],
                ] as const).map(([label, value]) => (
                  <div
                    key={label}
                    data-home-estimate-manufacturing-bom-schedule={`${label}:${value}`}
                    style={{
                      borderTop: '1px solid rgba(134, 239, 172, 0.12)',
                      color: '#bbf7d0',
                      fontSize: isTouchDevice ? '0.52rem' : '0.56rem',
                      fontWeight: 780,
                      lineHeight: 1.25,
                      paddingTop: '5px',
                    }}
                  >
                    <strong style={{ color: '#dcfce7' }}>{label}:</strong> {value}
                  </div>
                ))}
              </div>
    
              <div style={{ display: 'grid', gap: '6px' }}>
                {manufacturingBom.openingSchedule.map((item) => (
                  <div
                    key={item.id}
                    data-home-opening-schedule-item={`${item.openingId}:${item.type}:${item.wallSide}:${item.widthMm}:${item.heightMm}:${item.quantity}:${item.estimateImpact}`}
                    style={{
                      background: 'rgba(2, 6, 23, 0.2)',
                      border: '1px solid rgba(134, 239, 172, 0.12)',
                      borderRadius: '10px',
                      display: 'grid',
                      gap: '4px',
                      padding: isTouchDevice ? '6px 7px' : '7px 8px',
                    }}
                  >
                    <div style={{ color: '#d1fae5', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 900 }}>
                      {item.openingId} · {formatOpeningTypeLabel(item.type)} · {item.wallSide} · {item.widthMm} x {item.heightMm} mm · qty {item.quantity}
                    </div>
                    <div style={{ color: '#bbf7d0', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 760, lineHeight: 1.25 }}>
                      {item.unitCodePlaceholder} / {item.frameType} / {item.glazingType} / estimate impact {formatHomeEstimateEur(item.estimateImpact)}
                    </div>
                    <div style={{ color: item.reviewRequirement ? '#fde68a' : '#86efac', fontSize: isTouchDevice ? '0.48rem' : '0.52rem', fontWeight: 760, lineHeight: 1.22 }}>
                      {item.reviewRequirement ?? item.notes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
    
            <div
              aria-label="Pricing category totals"
              data-home-estimate-pricing-categories="true"
              data-home-estimate-pricing-category-count={estimate.pricing.categoryTotals.length}
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
                  Pricing categories
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
                  Preview pricing
                </div>
              </div>
              <div
                style={{
                  color: '#bfdbfe',
                  fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
                  fontWeight: 800,
                  lineHeight: 1.28,
                }}
              >
                {estimate.pricing.disclaimer}
              </div>
              <div style={{ display: 'grid', gap: isTouchDevice ? '7px' : '8px', gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
                {estimate.pricing.categoryTotals.map((item) => (
                  <div
                    key={item.category}
                    data-home-estimate-pricing-category={`${item.category}:${item.amount}`}
                    style={{
                      background: 'rgba(15, 23, 42, 0.46)',
                      border: '1px solid rgba(125, 211, 252, 0.12)',
                      borderRadius: '9px',
                      padding: isTouchDevice ? '8px 9px' : '7px 8px',
                    }}
                  >
                    <div style={{ color: '#93c5fd', fontSize: '0.5rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.label}</div>
                    <div style={{ color: '#fef3c7', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 950, marginTop: '3px' }}>{formatHomeEstimateEur(item.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
    
            <div
              aria-label="Structured pre-quote estimate sections"
              data-home-estimate-sections="true"
              data-home-estimate-section-count={estimate.sections.length}
              style={{
                borderTop: '1px solid rgba(96, 165, 250, 0.18)',
                display: 'grid',
                gap: '8px',
                marginTop: isTouchDevice ? '9px' : '10px',
                paddingTop: isTouchDevice ? '9px' : '10px',
              }}
            >
              <div style={{ color: '#93c5fd', fontSize: '0.56rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Structured pre-quote
              </div>
              {estimate.sections.map((section) => (
                <div
                  key={section.id}
                  data-home-estimate-section={`${section.id}:${section.subtotal}`}
                  style={{
                    background: 'rgba(15, 23, 42, 0.44)',
                    border: '1px solid rgba(125, 211, 252, 0.16)',
                    borderRadius: '13px',
                    display: 'grid',
                    gap: '7px',
                    padding: isTouchDevice ? '8px' : '10px',
                  }}
                >
                  <div style={{ alignItems: 'start', display: 'grid', gap: isTouchDevice ? '6px' : '8px', gridTemplateColumns: isTouchDevice ? '1fr' : '1fr auto' }}>
                    <div>
                      <div style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.62rem' : '0.68rem', fontWeight: 940, lineHeight: 1.18 }}>
                        {section.label}
                      </div>
                      <div style={{ color: '#93c5fd', fontSize: isTouchDevice ? '0.52rem' : '0.56rem', fontWeight: 760, lineHeight: 1.25, marginTop: '3px' }}>
                        {section.description}
                      </div>
                    </div>
                    <div style={{ textAlign: isTouchDevice ? 'left' : 'right' }}>
                      <div style={{ color: '#bfdbfe', fontSize: isTouchDevice ? '0.48rem' : '0.5rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {getModularHomeEstimateConfidenceLabel(section.confidence)}
                      </div>
                      <div style={{ color: section.subtotal === 0 ? '#93c5fd' : '#fef3c7', fontSize: isTouchDevice ? '0.6rem' : '0.66rem', fontWeight: 960, marginTop: '3px' }}>
                        {section.subtotal === 0 ? 'Review' : formatHomeEstimateEur(section.subtotal)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {section.lineItems.map((item) => (
                      <div
                        key={item.id}
                        data-home-estimate-section-line={`${section.id}:${item.id}:${item.quantity}:${item.unit}:${item.unitCost ?? 'review'}:${item.subtotal ?? 'review'}:${item.confidence}`}
                        data-home-estimate-confidence={item.confidence}
                        data-home-estimate-last-updated={item.lastUpdated}
                        data-home-estimate-price-source={item.priceSource}
                        data-home-estimate-pricing-region={item.region}
                        data-home-estimate-pricing-currency={item.currency}
                        data-home-estimate-source-type={item.sourceType}
                        data-home-estimate-supplier-placeholder={item.supplierPlaceholder}
                        style={{
                          background: item.isExcluded ? 'rgba(71, 85, 105, 0.2)' : 'rgba(2, 6, 23, 0.22)',
                          border: item.isExcluded ? '1px solid rgba(251, 191, 36, 0.16)' : '1px solid rgba(148, 163, 184, 0.12)',
                          borderRadius: '10px',
                          display: 'grid',
                          gap: isTouchDevice ? '6px' : '5px',
                          padding: isTouchDevice ? '8px 9px' : '8px 9px',
                        }}
                      >
                        <div style={{ alignItems: 'start', display: 'grid', gap: isTouchDevice ? '5px' : '8px', gridTemplateColumns: isTouchDevice ? '1fr' : '1fr auto' }}>
                          <span style={{ color: '#dbeafe', fontSize: isTouchDevice ? '0.61rem' : '0.64rem', fontWeight: 860, lineHeight: 1.3 }}>
                            {item.label}{item.isPlaceholder ? ' (placeholder)' : ''}
                          </span>
                          <span style={{ color: item.subtotal === null || item.subtotal === 0 ? '#93c5fd' : '#fef3c7', fontSize: isTouchDevice ? '0.61rem' : '0.64rem', fontWeight: 950 }}>
                            {formatEstimateAmount(item.subtotal)}
                          </span>
                        </div>
                        <div style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.54rem' : '0.56rem', fontWeight: 760, lineHeight: 1.35 }}>
                          Qty {item.quantity} / unit {item.unit} / unit cost {formatEstimateAmount(item.unitCost)}
                        </div>
                        {renderEstimateReliabilityBadges(item, isTouchDevice)}
                        <div style={{ color: '#cbd5e1', fontSize: isTouchDevice ? '0.47rem' : '0.5rem', fontWeight: 740, lineHeight: 1.26 }}>
                          Source {getModularHomeEstimateSourceTypeLabel(item.sourceType)} · {item.supplierPlaceholder} · {item.region} / {item.currency}
                        </div>
                        <div style={{ color: '#a7f3d0', fontSize: isTouchDevice ? '0.47rem' : '0.5rem', fontWeight: 720, lineHeight: 1.26 }}>
                          Margin: {item.pricingAssumptions.marginAssumption} · Waste: {item.pricingAssumptions.wasteAssumption}
                        </div>
                        {item.note ? (
                          <div style={{ color: '#7dd3fc', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 740, lineHeight: 1.25 }}>
                            {item.note}
                          </div>
                        ) : null}
                        {item.notes.length > 0 ? (
                          <div style={{ color: '#c4b5fd', fontSize: isTouchDevice ? '0.48rem' : '0.52rem', fontWeight: 720, lineHeight: 1.28 }}>
                            {item.notes.slice(0, 2).join(' ')}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
    
            <div
              style={{
                alignItems: 'end',
                borderTop: '1px solid rgba(96, 165, 250, 0.22)',
                display: 'grid',
                gap: '10px',
                gridTemplateColumns: isTouchDevice ? '1fr' : '1fr auto',
                marginTop: isTouchDevice ? '9px' : '10px',
                paddingTop: isTouchDevice ? '9px' : '10px',
              }}
            >
              <div style={{ color: '#bfdbfe', fontSize: isTouchDevice ? '0.6rem' : '0.64rem', fontWeight: 900 }}>
                Estimated total
              </div>
              <div data-home-estimate-total-label="true" style={{ color: '#fef9c3', fontSize: isTouchDevice ? '1rem' : '1.12rem', fontWeight: 980, letterSpacing: '-0.03em' }}>
                {formatHomeEstimateEur(estimate.estimatedTotal)}
              </div>
            </div>
    
            <div
              aria-label="Scope of supply"
              data-home-estimate-scope="true"
              style={{
                borderTop: '1px solid rgba(96, 165, 250, 0.18)',
                display: 'grid',
                gap: '8px',
                marginTop: isTouchDevice ? '9px' : '10px',
                paddingTop: isTouchDevice ? '9px' : '10px',
              }}
            >
              <div style={{ color: '#bfdbfe', fontSize: '0.56rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Scope of supply
              </div>
              {estimate.scopeOfSupply.map((section) => (
                <div
                  key={section.id}
                  data-home-estimate-scope-section={section.id}
                  style={{
                    background: section.id === 'included'
                      ? 'rgba(34, 197, 94, 0.08)'
                      : section.id === 'optional'
                        ? 'rgba(251, 191, 36, 0.07)'
                        : 'rgba(248, 113, 113, 0.06)',
                    border: section.id === 'included'
                      ? '1px solid rgba(34, 197, 94, 0.2)'
                      : section.id === 'optional'
                        ? '1px solid rgba(251, 191, 36, 0.18)'
                        : '1px solid rgba(248, 113, 113, 0.18)',
                    borderRadius: '11px',
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
                  <div style={{ display: 'grid', gap: '4px', marginTop: '6px' }}>
                    {section.items.map((item) => (
                      <div
                        key={item}
                        data-home-estimate-scope-item={`${section.id}:${item}`}
                        style={{
                          alignItems: 'start',
                          color: '#dbeafe',
                          display: 'grid',
                          fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
                          fontWeight: 800,
                          gap: '6px',
                          gridTemplateColumns: '6px 1fr',
                          lineHeight: 1.24,
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            background: section.id === 'included' ? '#22c55e' : section.id === 'optional' ? '#fbbf24' : '#f87171',
                            borderRadius: '999px',
                            display: 'block',
                            height: '6px',
                            marginTop: '0.32em',
                            width: '6px',
                          }}
                        />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
    
            <div
              data-home-estimate-disclaimer="true"
              style={{
                color: '#93c5fd',
                fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
                fontWeight: 800,
                lineHeight: 1.28,
                marginTop: isTouchDevice ? '8px' : '9px',
              }}
            >
              {estimate.disclaimer}
            </div>
          </section>
  );
}
