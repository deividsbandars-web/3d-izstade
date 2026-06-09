import { useEffect, useMemo, useState } from 'react';
import { isHomeDemoEnabled } from './homeDemoFlags';
import {
  MODULAR_HOME_VIEW_MODE_OPTIONS,
  type ModularHomeConfiguratorState,
  useModularHomeConfigurator,
  useModularHomeViewMode,
} from './modularHomeConfigurator';
import { getModularHomeTemplate, type ModularHomeTemplateId } from './modularHomeConfig';
import {
  calculateModularHomeEstimate,
  formatHomeEstimateEur,
  getModularHomeEstimateConfidenceLabel,
  getModularHomeEstimatePriceSourceLabel,
  type ModularHomeEstimateConfidence,
  type ModularHomeEstimatePriceSource,
  type ModularHomeEstimateSectionLineItem,
} from './modularHomeEstimate';
import {
  calculateComponentBom,
  calculateManufacturingBomPreview,
  type ModularHomeComponentCategory,
  type ModularHomeComponentUnit,
} from './modularHomeComponents';
import {
  getDefaultHomeConfig,
  getInvalidConfigReasons,
  getModularHomeDimensionSummary,
  getModularHomeLayoutVariantForConfig,
  getModularHomeLayoutVariantsForProduct,
  getModularHomeOptionChoices,
  getModularHomeProductionConstraints,
  getModularHomeProductConfigSummary,
  getModularHomeProductForTemplate,
  getModularHomeProducts,
  getModularHomeRoomMeasurementSummary,
  type ModularHomeConstraintStatus,
  type ModularHomeOptionGroup,
  type ModularHomeProduct,
  type ModularHomeProductionConstraint,
  type ModularHomeProductionConstraintSeverity,
} from './modularHomeProducts';
import { ModularHomeProjectWorkspace } from './ModularHomeProjectWorkspace';
import { ModularHomeProjectSummary } from './ModularHomeProjectSummary';
import { ModularHomeProjectUploadPlaceholder } from './ModularHomeProjectUploadPlaceholder';
import { ModularHomeQuoteForm } from './ModularHomeQuoteForm';
import { decodeModularHomeConfigFromUrl } from './modularHomeShareUrl';
import { ModularHomeShareLinkPanel } from './ModularHomeShareLinkPanel';

type ModularHomeDemoOverlayProps = {
  isTouchDevice?: boolean;
};

const HOME_DEMO_BULLETS = [
  '3D house walkthrough',
  'Configurable modules',
  'Instant estimate preview',
  'Request a build quote',
] as const;

type ModularHomeDemoTabId = 'overview' | 'design' | 'estimate' | 'bom' | 'quote' | 'projects' | 'upload';

const HOME_DEMO_TABS = [
  { id: 'overview', label: 'Overview', helper: 'Model, scale and view mode' },
  { id: 'design', label: 'Design', helper: 'Template and option controls' },
  { id: 'estimate', label: 'Estimate', helper: 'Pre-quote pricing' },
  { id: 'bom', label: 'BOM', helper: 'Module and manufacturing summary' },
  { id: 'quote', label: 'Quote', helper: 'Local quote and print summary' },
  { id: 'projects', label: 'Projects', helper: 'Saved local configurations' },
  { id: 'upload', label: 'Upload', helper: 'Manual conversion workflow' },
] as const satisfies readonly {
  helper: string;
  id: ModularHomeDemoTabId;
  label: string;
}[];

type HomeConfigUiOption<Key extends keyof ModularHomeConfiguratorState = keyof ModularHomeConfiguratorState> = {
  constraintMessage: string;
  constraintStatus: ModularHomeConstraintStatus;
  disabledReason: string;
  isDisabled: boolean;
  key: ModularHomeConfiguratorState[Key];
  label: string;
  priceDelta: number;
  productionConstraintSeverity: ModularHomeProductionConstraintSeverity;
  productionNextStep: string;
};

type HomeConfigUiGroup<Key extends keyof ModularHomeConfiguratorState = keyof ModularHomeConfiguratorState> = {
  key: Key;
  label: string;
  options: readonly HomeConfigUiOption<Key>[];
};

const HOME_CONSTRAINT_STATUS_LABELS = {
  compatible: 'Compatible',
  notAvailable: 'Not available',
  requiresReview: 'Requires review',
} as const satisfies Record<ModularHomeConstraintStatus, string>;

const HOME_CONSTRAINT_STATUS_STYLES = {
  compatible: {
    background: 'rgba(34, 197, 94, 0.12)',
    border: '1px solid rgba(34, 197, 94, 0.24)',
    color: '#bbf7d0',
  },
  notAvailable: {
    background: 'rgba(100, 116, 139, 0.12)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    color: '#94a3b8',
  },
  requiresReview: {
    background: 'rgba(251, 191, 36, 0.12)',
    border: '1px solid rgba(251, 191, 36, 0.26)',
    color: '#fde68a',
  },
} as const satisfies Record<ModularHomeConstraintStatus, {
  background: string;
  border: string;
  color: string;
}>;

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

function setConfiguratorOption(
  setOption: ReturnType<typeof useModularHomeConfigurator>['setOption'],
  key: keyof ModularHomeConfiguratorState,
  value: ModularHomeConfiguratorState[keyof ModularHomeConfiguratorState],
) {
  setOption(key as never, value as never);
}

function formatOptionPriceDelta(amount: number): string {
  if (amount <= 0) {
    return '';
  }

  return ` +${formatHomeEstimateEur(amount)}`;
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

function createOptionGroup<Key extends keyof ModularHomeConfiguratorState>(
  product: ModularHomeProduct,
  config: ModularHomeConfiguratorState,
  key: Key,
  label: string,
  optionGroup: ModularHomeOptionGroup,
): HomeConfigUiGroup<Key> {
  return {
    key,
    label,
    options: getModularHomeOptionChoices(product.id, optionGroup, config).map((option) => ({
      constraintMessage: option.constraintMessage,
      constraintStatus: option.constraintStatus,
      disabledReason: option.disabledReason,
      isDisabled: !option.isCompatible,
      key: option.visualToken as ModularHomeConfiguratorState[Key],
      label: option.label,
      priceDelta: option.priceDelta,
      productionConstraintSeverity: option.productionConstraintSeverity,
      productionNextStep: option.productionNextStep,
    })),
  };
}

function createConfiguratorGroups(
  product: ModularHomeProduct,
  config: ModularHomeConfiguratorState,
): readonly HomeConfigUiGroup[] {
  const templateOptions = getModularHomeProducts().map((item) => ({
    constraintMessage: 'Compatible with Modular Home preview.',
    constraintStatus: 'compatible',
    disabledReason: '',
    isDisabled: false,
    key: item.defaultTemplateId,
    label: item.name,
    priceDelta: 0,
    productionConstraintSeverity: 'info',
    productionNextStep: 'Continue with the selected product preview; final production package still requires review.',
  })) satisfies readonly HomeConfigUiOption<'template'>[];
  const layoutOptions = getModularHomeLayoutVariantsForProduct(product.id).map((variant) => ({
    constraintMessage: variant.summaryNote,
    constraintStatus: 'compatible',
    disabledReason: '',
    isDisabled: false,
    key: variant.id,
    label: variant.label,
    priceDelta: 0,
    productionConstraintSeverity: 'info',
    productionNextStep: 'Use this controlled layout variant for preview only; production drawings require review.',
  })) satisfies readonly HomeConfigUiOption<'layoutVariant'>[];

  return [
    { key: 'template', label: 'Home product', options: templateOptions },
    { key: 'layoutVariant', label: 'Layout variant', options: layoutOptions },
    createOptionGroup(product, config, 'facade', 'Facade', 'facade'),
    createOptionGroup(product, config, 'roof', 'Roof', 'roof'),
    createOptionGroup(product, config, 'terrace', 'Terrace', 'terrace'),
    createOptionGroup(product, config, 'finishLevel', 'Finish level', 'finish'),
    createOptionGroup(product, config, 'furniturePackage', 'Furniture package', 'furniturePackage'),
    createOptionGroup(product, config, 'sofa', 'Sofa', 'sofa'),
    createOptionGroup(product, config, 'table', 'Table', 'table'),
    createOptionGroup(product, config, 'bed', 'Bed', 'bed'),
    createOptionGroup(product, config, 'kitchenLine', 'Kitchen line', 'kitchenLine'),
    createOptionGroup(product, config, 'wardrobePlaceholder', 'Wardrobe placeholder', 'wardrobePlaceholder'),
    createOptionGroup(product, config, 'interiorWallFinish', 'Interior wall finish', 'interiorWallFinish'),
    createOptionGroup(product, config, 'floorFinish', 'Floor finish', 'floorFinish'),
    createOptionGroup(product, config, 'windowPackage', 'Window package', 'windowPackage'),
    createOptionGroup(product, config, 'windowPlacement', 'Window placement', 'windowPlacement'),
    createOptionGroup(product, config, 'doorPackage', 'Door package', 'doorPackage'),
    createOptionGroup(product, config, 'doorPlacement', 'Door placement', 'doorPlacement'),
    createOptionGroup(product, config, 'facadeBoardOrientation', 'Facade board orientation', 'facadeBoardOrientation'),
    createOptionGroup(product, config, 'facadeBoardWidth', 'Facade board width', 'facadeBoardWidth'),
    createOptionGroup(product, config, 'facadeBoardProfile', 'Facade board profile', 'facadeBoardProfile'),
    createOptionGroup(product, config, 'facadeBoardSpacing', 'Facade board spacing', 'facadeBoardSpacing'),
    createOptionGroup(product, config, 'trimColor', 'Trim color', 'trimColor'),
    createOptionGroup(product, config, 'roofEdgeColor', 'Roof edge color', 'roofEdgeColor'),
    createOptionGroup(product, config, 'roofGutterStyle', 'Roof edge/gutter style', 'roofGutterStyle'),
    createOptionGroup(product, config, 'windowFrameColor', 'Window frame color', 'windowFrameColor'),
    createOptionGroup(product, config, 'windowFrameType', 'Window frame type', 'windowFrameType'),
    createOptionGroup(product, config, 'interiorFloorStyle', 'Interior floor style', 'interiorFloorStyle'),
    createOptionGroup(product, config, 'wallPanelStyle', 'Wall panel style', 'wallPanelStyle'),
  ];
}

function stopHomeDemoHudEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

export function ModularHomeDemoOverlay({ isTouchDevice = false }: ModularHomeDemoOverlayProps) {
  const { config, reset, setConfig, setOption } = useModularHomeConfigurator();
  const { setViewMode, viewMode } = useModularHomeViewMode();
  const [activeHomeDemoTab, setActiveHomeDemoTab] = useState<ModularHomeDemoTabId>('overview');
  const sharedConfigFromUrl = useMemo(() => decodeModularHomeConfigFromUrl(), []);
  const products = getModularHomeProducts();
  const product = getModularHomeProductForTemplate(config.template) ?? products[0];
  const template = getModularHomeTemplate(config.template);
  const configSummary = getModularHomeProductConfigSummary(config);
  const layoutVariant = getModularHomeLayoutVariantForConfig(config);
  const dimensionSummary = getModularHomeDimensionSummary(config);
  const roomMeasurementSummary = getModularHomeRoomMeasurementSummary(config);
  const configuratorGroups = createConfiguratorGroups(product, config);
  const estimate = calculateModularHomeEstimate(config);
  const componentBom = calculateComponentBom(config);
  const manufacturingBom = calculateManufacturingBomPreview(config);
  const invalidConfigReasons = getInvalidConfigReasons(config);
  const productionConstraints = getModularHomeProductionConstraints(config);
  const blockedProductionConstraints = productionConstraints.filter((constraint) => constraint.severity === 'blocked');
  const reviewConfigWarnings = productionConstraints.filter((constraint) => constraint.severity === 'requiresReview');
  const visibleProductionConstraints = productionConstraints.filter((constraint) => (
    constraint.severity !== 'info' || productionConstraints.length === 1
  ));
  const productionConstraintIds = productionConstraints.map((constraint) => constraint.id).join('|');
  const dimensionRows = [
    ['floor-area', 'Floor area', dimensionSummary.floorAreaLabel],
    ['footprint', 'Footprint', dimensionSummary.footprintLabel],
    ['ceiling-height', 'Ceiling', dimensionSummary.ceilingHeightLabel],
    ['module-count', 'Modules', dimensionSummary.moduleCountLabel],
    ['transport-modules', 'Transport', dimensionSummary.transportModuleCountLabel],
    ['build-category', 'Build note', dimensionSummary.buildCategoryNote],
  ] as const;
  const bomPackageRows = [
    ['Facade package', estimate.selectedOptions.facade],
    ['Layout variant', estimate.selectedOptions.layoutVariant],
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

  useEffect(() => {
    if (!sharedConfigFromUrl.isSharedConfig) {
      return;
    }

    setConfig(sharedConfigFromUrl.config);
    setViewMode(sharedConfigFromUrl.viewMode);
  }, [setConfig, setViewMode, sharedConfigFromUrl]);

  useEffect(() => {
    if (blockedProductionConstraints.length === 0) {
      return;
    }

    setConfig(getDefaultHomeConfig(product.id));
  }, [blockedProductionConstraints.length, product.id, productionConstraintIds, setConfig]);

  if (!isHomeDemoEnabled()) {
    return null;
  }

  return (
    <aside
      aria-label="Modular Home District preview"
      data-home-demo-overlay="true"
      data-home-production-blocked-count={blockedProductionConstraints.length}
      data-home-production-constraint-count={productionConstraints.length}
      data-home-production-requires-review-count={reviewConfigWarnings.length}
      onClick={stopHomeDemoHudEvent}
      onMouseDown={stopHomeDemoHudEvent}
      onPointerDown={stopHomeDemoHudEvent}
      onTouchStart={stopHomeDemoHudEvent}
      style={{
        position: 'absolute',
        left: isTouchDevice ? '12px' : '252px',
        right: isTouchDevice ? '12px' : 'auto',
        bottom: isTouchDevice ? 'max(104px, calc(env(safe-area-inset-bottom) + 96px))' : '22px',
        zIndex: 116,
        width: isTouchDevice ? 'auto' : '430px',
        maxHeight: isTouchDevice ? '54vh' : 'calc(100vh - 72px)',
        maxWidth: isTouchDevice ? 'calc(100vw - 24px)' : 'calc(100vw - 520px)',
        overflowY: 'auto',
        padding: isTouchDevice ? '14px 14px' : '18px 19px',
        border: '1px solid rgba(251, 191, 36, 0.42)',
        borderRadius: isTouchDevice ? '18px' : '22px',
        background:
          'radial-gradient(circle at 12% 0%, rgba(251, 191, 36, 0.24), transparent 34%), linear-gradient(180deg, rgba(21, 16, 8, 0.95), rgba(15, 23, 42, 0.88))',
        boxShadow: '0 22px 54px rgba(2, 6, 23, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        color: '#fff7ed',
        fontFamily: 'inherit',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start' }}>
        <div>
          <div
            style={{
              color: '#fbbf24',
              fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
              fontWeight: 950,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            Home vertical preview
          </div>
          <div style={{ fontSize: isTouchDevice ? '1rem' : '1.15rem', fontWeight: 950, letterSpacing: '-0.02em', lineHeight: 1.05, marginTop: '6px' }}>
            Modular Home District
          </div>
          <div style={{ marginTop: '7px', color: '#fed7aa', fontSize: isTouchDevice ? '0.72rem' : '0.78rem', fontWeight: 800, lineHeight: 1.32 }}>
            Walk through, configure and request a quote for timber modular homes.
          </div>
        </div>
        <div
          style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.38)',
            borderRadius: '999px',
            color: '#86efac',
            fontSize: '0.56rem',
            fontWeight: 950,
            letterSpacing: '0.12em',
            padding: '4px 7px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          Review only
        </div>
      </div>

      <nav
        aria-label="Modular Home Studio sections"
        data-home-demo-tabs="true"
        data-home-demo-active-tab={activeHomeDemoTab}
        style={{
          background: 'rgba(2, 6, 23, 0.28)',
          border: '1px solid rgba(251, 191, 36, 0.18)',
          borderRadius: isTouchDevice ? '14px' : '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: isTouchDevice ? '7px' : '8px',
          marginTop: isTouchDevice ? '10px' : '12px',
          padding: isTouchDevice ? '8px' : '9px',
        }}
      >
        {HOME_DEMO_TABS.map((tab) => {
          const selected = activeHomeDemoTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              aria-selected={selected}
              data-home-demo-tab={tab.id}
              data-home-demo-tab-active={selected ? 'true' : 'false'}
              title={tab.helper}
              onClick={(event) => {
                event.stopPropagation();
                setActiveHomeDemoTab(tab.id);
              }}
              style={{
                background: selected ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(34, 197, 94, 0.17))' : 'rgba(15, 23, 42, 0.56)',
                border: selected ? '1px solid rgba(251, 191, 36, 0.52)' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '999px',
                color: selected ? '#fff7ed' : '#cbd5e1',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: isTouchDevice ? '0.6rem' : '0.64rem',
                fontWeight: selected ? 950 : 850,
                lineHeight: 1.08,
                padding: isTouchDevice ? '8px 9px' : '9px 11px',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeHomeDemoTab === 'overview' ? (
        <>
      <section
        aria-label={`${product.name} home preview`}
        data-home-demo-info-card="true"
        data-home-demo-product-id={product.id}
        style={{
          background: 'rgba(15, 23, 42, 0.58)',
          border: '1px solid rgba(251, 191, 36, 0.22)',
          borderRadius: isTouchDevice ? '15px' : '17px',
          marginTop: isTouchDevice ? '10px' : '12px',
          padding: isTouchDevice ? '11px' : '13px',
        }}
      >
        <div
          style={{
            color: '#fef3c7',
            fontSize: isTouchDevice ? '0.94rem' : '1.02rem',
            fontWeight: 950,
            letterSpacing: '-0.02em',
            lineHeight: 1.06,
          }}
        >
          {product.name}
        </div>
        <div
          style={{
            color: '#fed7aa',
            fontSize: isTouchDevice ? '0.66rem' : '0.72rem',
            fontWeight: 800,
            lineHeight: 1.32,
            marginTop: '6px',
          }}
        >
          {product.shortDescription}
        </div>

        {layoutVariant ? (
          <div
            data-home-demo-layout-variant={layoutVariant.id}
            style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.22)',
              borderRadius: '12px',
              color: '#bbf7d0',
              fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
              fontWeight: 820,
              lineHeight: 1.3,
              marginTop: '8px',
              padding: isTouchDevice ? '7px 8px' : '8px 9px',
            }}
          >
            <span style={{ color: '#86efac', fontWeight: 950 }}>Layout: {layoutVariant.label}.</span> {layoutVariant.summaryNote}
          </div>
        ) : null}

        <div
          aria-label={`${product.name} facts`}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginTop: isTouchDevice ? '9px' : '10px',
          }}
        >
          {[
            product.bedrooms > 0 ? `${product.bedrooms} bedroom${product.bedrooms === 1 ? '' : 's'}` : 'sauna/guest module',
            `${product.bathrooms} bathroom${product.bathrooms === 1 ? '' : 's'}`,
            product.targetUseCase,
          ].map((fact) => (
            <span
              key={fact}
              data-home-demo-fact={fact}
              style={{
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.24)',
                borderRadius: '999px',
                color: '#ffedd5',
                fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
                fontWeight: 900,
                lineHeight: 1,
                padding: '6px 8px',
                whiteSpace: 'nowrap',
              }}
            >
              {fact}
            </span>
          ))}
        </div>

        <div
          aria-label={`${product.name} project scale`}
          data-home-demo-dimensions-card="true"
          data-home-demo-dimension-floor-area={dimensionSummary.floorAreaLabel}
          data-home-demo-dimension-footprint={dimensionSummary.footprintLabel}
          data-home-demo-dimension-ceiling={dimensionSummary.ceilingHeightLabel}
          data-home-demo-dimension-module-count={dimensionSummary.moduleCountLabel}
          data-home-demo-dimension-transport={dimensionSummary.transportModuleCountLabel}
          data-home-demo-dimension-build-note={dimensionSummary.buildCategoryNote}
          style={{
            background: 'rgba(251, 191, 36, 0.07)',
            border: '1px solid rgba(251, 191, 36, 0.18)',
            borderRadius: '13px',
            display: 'grid',
            gap: '7px',
            marginTop: isTouchDevice ? '10px' : '11px',
            padding: isTouchDevice ? '9px' : '10px',
          }}
        >
          <div
            style={{
              color: '#fde68a',
              fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
              fontWeight: 950,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Project scale
          </div>
          <div
            style={{
              display: 'grid',
              gap: isTouchDevice ? '7px' : '8px',
              gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))',
            }}
          >
            {dimensionRows.map(([key, label, value]) => (
              <div
                key={key}
                data-home-demo-dimension={key}
                data-home-demo-dimension-value={value}
                style={{
                  background: key === 'build-category' ? 'rgba(15, 23, 42, 0.42)' : 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  gridColumn: key === 'build-category' ? '1 / -1' : 'auto',
                  padding: isTouchDevice ? '6px 7px' : '7px 8px',
                }}
              >
                <div style={{ color: '#fbbf24', fontSize: '0.5rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {label}
                </div>
                <div style={{ color: '#fff7ed', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 880, lineHeight: 1.22, marginTop: '3px' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          aria-label={`${product.name} compact estimate total`}
          data-home-estimate-compact-total="true"
          data-home-estimate-compact-total-value={estimate.estimatedTotal}
          style={{
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.16), rgba(251, 191, 36, 0.1))',
            border: '1px solid rgba(96, 165, 250, 0.22)',
            borderRadius: '13px',
            display: 'grid',
            gap: '8px',
            gridTemplateColumns: '1fr auto',
            marginTop: isTouchDevice ? '9px' : '10px',
            padding: isTouchDevice ? '8px 9px' : '9px 10px',
          }}
        >
          <div>
            <div style={{ color: '#bfdbfe', fontSize: '0.52rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Structured estimate
            </div>
            <div style={{ color: '#dbeafe', fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 800, lineHeight: 1.25, marginTop: '3px' }}>
              Includes modules, selected options, transport, installation and VAT placeholder.
            </div>
          </div>
          <div style={{ color: '#fef9c3', fontSize: isTouchDevice ? '0.86rem' : '0.98rem', fontWeight: 980, letterSpacing: '-0.03em', textAlign: 'right' }}>
            {formatHomeEstimateEur(estimate.estimatedTotal)}
          </div>
        </div>

        <div
          aria-label={`${template.name} static hotspots`}
          style={{
            borderTop: '1px solid rgba(251, 191, 36, 0.16)',
            display: 'grid',
            gap: isTouchDevice ? '7px' : '8px',
            gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))',
            marginTop: isTouchDevice ? '10px' : '11px',
            paddingTop: isTouchDevice ? '9px' : '10px',
          }}
        >
          {(layoutVariant?.roomLabels ?? template.interiorLabels).map((hotspot) => (
            <div
              key={hotspot}
              data-home-demo-hotspot={hotspot}
              style={{
                alignItems: 'center',
                color: '#fff7ed',
                display: 'grid',
                fontSize: isTouchDevice ? '0.6rem' : '0.64rem',
                fontWeight: 880,
                gap: '6px',
                gridTemplateColumns: '7px 1fr',
                lineHeight: 1.15,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #22c55e)',
                  borderRadius: '999px',
                  display: 'block',
                  height: '7px',
                  width: '7px',
                }}
              />
              <span>{hotspot}</span>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-label={`${product.name} viewing modes`}
        data-home-view-mode-panel="true"
        data-home-view-mode={viewMode}
        style={{
          background: 'rgba(2, 6, 23, 0.36)',
          border: '1px solid rgba(96, 165, 250, 0.2)',
          borderRadius: isTouchDevice ? '15px' : '17px',
          marginTop: isTouchDevice ? '10px' : '12px',
          padding: isTouchDevice ? '10px' : '12px',
        }}
      >
        <div
          style={{
            color: '#bfdbfe',
            fontSize: '0.58rem',
            fontWeight: 950,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          View mode
        </div>
        <div
          style={{
            color: '#e0f2fe',
            fontSize: isTouchDevice ? '0.64rem' : '0.68rem',
            fontWeight: 780,
            lineHeight: 1.32,
            marginTop: '5px',
          }}
        >
          Switch between exterior, cutaway, interior and floorplan views to inspect the layout.
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: isTouchDevice ? '9px' : '10px' }}>
          {MODULAR_HOME_VIEW_MODE_OPTIONS.map((option) => {
            const selected = viewMode === option.key;

            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={selected}
                data-home-view-mode-option={option.key}
                data-home-view-mode-selected={selected ? 'true' : 'false'}
                title={option.note}
                onClick={(event) => {
                  event.stopPropagation();
                  setViewMode(option.key);
                }}
                style={{
                  background: selected ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.34), rgba(34, 197, 94, 0.18))' : 'rgba(15, 23, 42, 0.5)',
                  border: selected ? '1px solid rgba(147, 197, 253, 0.62)' : '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '999px',
                  color: selected ? '#eff6ff' : '#cbd5e1',
                  cursor: 'pointer',
                  display: 'inline-grid',
                  font: 'inherit',
                  fontSize: isTouchDevice ? '0.58rem' : '0.61rem',
                  fontWeight: selected ? 950 : 850,
                  gap: '4px',
                  lineHeight: 1.08,
                  padding: isTouchDevice ? '7px 8px' : '7px 10px',
                  textAlign: 'left',
                }}
              >
                <span>{option.label}</span>
                <span style={{ color: selected ? '#bfdbfe' : '#94a3b8', fontSize: isTouchDevice ? '0.48rem' : '0.5rem', fontWeight: 760 }}>
                  {option.note}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {viewMode === 'floorplan' ? (
        <section
          aria-label={`${product.name} floorplan measurements`}
          data-home-floorplan-measurement-panel="true"
          data-home-floorplan-measurement-product={roomMeasurementSummary.product?.id ?? product.id}
          data-home-floorplan-measurement-layout={roomMeasurementSummary.layoutVariant?.id ?? config.layoutVariant}
          data-home-floorplan-measurement-room-count={roomMeasurementSummary.rooms.length}
          data-home-floorplan-measurement-room-total={roomMeasurementSummary.roomAreaTotalM2}
          data-home-floorplan-measurement-floor-area={roomMeasurementSummary.floorAreaM2}
          data-home-floorplan-measurement-ceiling={roomMeasurementSummary.ceilingHeightM}
          style={{
            background: 'linear-gradient(180deg, rgba(8, 47, 73, 0.64), rgba(15, 23, 42, 0.72))',
            border: '1px solid rgba(56, 189, 248, 0.28)',
            borderRadius: isTouchDevice ? '15px' : '17px',
            marginTop: isTouchDevice ? '10px' : '12px',
            padding: isTouchDevice ? '10px' : '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'start' }}>
            <div>
              <div
                style={{
                  color: '#7dd3fc',
                  fontSize: '0.58rem',
                  fontWeight: 950,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Floorplan measurements
              </div>
              <div style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.68rem' : '0.72rem', fontWeight: 850, lineHeight: 1.28, marginTop: '5px' }}>
                {roomMeasurementSummary.layoutVariant?.label ?? configSummary.layoutVariant} room schedule for client discussion.
              </div>
            </div>
            <div style={{ color: '#fef9c3', fontSize: isTouchDevice ? '0.78rem' : '0.88rem', fontWeight: 980, textAlign: 'right', whiteSpace: 'nowrap' }}>
              {formatQuantityM2(roomMeasurementSummary.roomAreaTotalM2)}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '6px',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              marginTop: isTouchDevice ? '8px' : '9px',
            }}
          >
            {[
              ['Total m²', formatQuantityM2(roomMeasurementSummary.floorAreaM2)],
              ['Room sum', formatQuantityM2(roomMeasurementSummary.roomAreaTotalM2)],
              ['Ceiling', `${roomMeasurementSummary.ceilingHeightM} m`],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  background: 'rgba(15, 23, 42, 0.44)',
                  border: '1px solid rgba(125, 211, 252, 0.16)',
                  borderRadius: '10px',
                  padding: isTouchDevice ? '6px 7px' : '7px 8px',
                }}
              >
                <div style={{ color: '#7dd3fc', fontSize: '0.5rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {label}
                </div>
                <div style={{ color: '#fff7ed', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 900, marginTop: '3px' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gap: '6px',
              marginTop: isTouchDevice ? '9px' : '10px',
            }}
          >
            {roomMeasurementSummary.rooms.map((room) => (
              <div
                key={room.id}
                data-home-floorplan-room-measurement={room.id}
                data-home-floorplan-room-area={room.areaM2}
                data-home-floorplan-room-type={room.type}
                style={{
                  alignItems: 'center',
                  background: 'rgba(2, 6, 23, 0.38)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '11px',
                  display: 'grid',
                  gap: '8px',
                  gridTemplateColumns: '1fr auto',
                  padding: isTouchDevice ? '7px 8px' : '8px 9px',
                }}
              >
                <div>
                  <div style={{ color: '#f8fafc', fontSize: isTouchDevice ? '0.62rem' : '0.66rem', fontWeight: 920, lineHeight: 1.12 }}>
                    {room.label}
                  </div>
                  <div style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 760, lineHeight: 1.25, marginTop: '3px' }}>
                    {room.note}
                  </div>
                </div>
                <div style={{ color: '#fde68a', fontSize: isTouchDevice ? '0.62rem' : '0.68rem', fontWeight: 980, whiteSpace: 'nowrap' }}>
                  {formatQuantityM2(room.areaM2)}
                </div>
              </div>
            ))}
          </div>

          <div
            data-home-floorplan-measurement-disclaimer={roomMeasurementSummary.disclaimer}
            style={{
              borderTop: '1px solid rgba(125, 211, 252, 0.14)',
              color: '#bae6fd',
              fontSize: isTouchDevice ? '0.52rem' : '0.56rem',
              fontWeight: 800,
              lineHeight: 1.28,
              marginTop: isTouchDevice ? '9px' : '10px',
              paddingTop: isTouchDevice ? '8px' : '9px',
            }}
          >
            {roomMeasurementSummary.disclaimer}
          </div>
        </section>
      ) : null}

      <div style={{ display: 'grid', gap: '7px', marginTop: isTouchDevice ? '10px' : '12px' }}>
        {HOME_DEMO_BULLETS.map((bullet) => (
          <div
            key={bullet}
            data-home-demo-bullet={bullet}
            style={{
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.54)',
              border: '1px solid rgba(251, 191, 36, 0.18)',
              borderRadius: '12px',
              color: '#ffedd5',
              display: 'grid',
              fontSize: isTouchDevice ? '0.64rem' : '0.69rem',
              fontWeight: 850,
              gap: '9px',
              gridTemplateColumns: '8px 1fr',
              lineHeight: 1.2,
              padding: isTouchDevice ? '7px 9px' : '8px 10px',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #22c55e)',
                borderRadius: '999px',
                display: 'block',
                height: '8px',
                width: '8px',
              }}
            />
            <span>{bullet}</span>
          </div>
        ))}
      </div>
        </>
      ) : null}

      {activeHomeDemoTab === 'upload' ? (
        <ModularHomeProjectUploadPlaceholder isTouchDevice={isTouchDevice} />
      ) : null}

      {activeHomeDemoTab === 'design' ? (
        <>
      <section
        aria-label={`${product.name} configurator`}
        data-home-configurator-panel="true"
        data-home-config-product-id={product.id}
        style={{
          background: 'rgba(2, 6, 23, 0.34)',
          border: '1px solid rgba(34, 197, 94, 0.22)',
          borderRadius: isTouchDevice ? '15px' : '17px',
          marginTop: isTouchDevice ? '10px' : '12px',
          padding: isTouchDevice ? '10px' : '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#86efac', fontSize: '0.58rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Preview configurator
            </div>
            <div style={{ color: '#f0fdf4', fontSize: isTouchDevice ? '0.78rem' : '0.84rem', fontWeight: 900, marginTop: '4px' }}>
              Configure {product.name}
            </div>
          </div>
          <button
            type="button"
            data-home-config-reset="true"
            onClick={(event) => {
              event.stopPropagation();
              reset();
            }}
            style={{
              background: 'rgba(15, 23, 42, 0.58)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '999px',
              color: '#e2e8f0',
              cursor: 'pointer',
              font: 'inherit',
              fontSize: '0.55rem',
              fontWeight: 900,
              letterSpacing: '0.1em',
              padding: '5px 8px',
              textTransform: 'uppercase',
            }}
          >
            Reset
          </button>
        </div>

        <div style={{ display: 'grid', gap: isTouchDevice ? '11px' : '12px', marginTop: isTouchDevice ? '11px' : '12px' }}>
          {configuratorGroups.map((group) => (
            <div key={group.key} data-home-config-group={group.key}>
              <div
                style={{
                  color: '#fed7aa',
                  fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
                  fontWeight: 950,
                  letterSpacing: '0.1em',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}
              >
                {group.label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: isTouchDevice ? '7px' : '8px' }}>
                {group.options.map((option) => {
                  const selected = config[group.key] === option.key;
                  const isDisabled = option.isDisabled;
                  const statusStyle = HOME_CONSTRAINT_STATUS_STYLES[option.constraintStatus];
                  const statusLabel = HOME_CONSTRAINT_STATUS_LABELS[option.constraintStatus];

                  return (
                    <button
                      key={option.key}
                      type="button"
                      aria-disabled={isDisabled}
                      aria-pressed={selected}
                      data-home-config-option={`${group.key}:${option.key}`}
                      data-home-config-constraint-message={option.constraintMessage}
                      data-home-config-constraint-status={option.constraintStatus}
                      data-home-config-disabled={isDisabled ? 'true' : 'false'}
                      data-home-config-disabled-reason={option.disabledReason}
                      data-home-config-production-next-step={option.productionNextStep}
                      data-home-config-production-severity={option.productionConstraintSeverity}
                      data-home-config-selected={selected ? 'true' : 'false'}
                      disabled={isDisabled}
                      title={`${option.constraintMessage || option.label} Next step: ${option.productionNextStep}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (isDisabled) {
                          return;
                        }

                        if (group.key === 'template') {
                          const nextProduct = getModularHomeProductForTemplate(option.key as ModularHomeTemplateId);
                          if (nextProduct) {
                            setConfig(getDefaultHomeConfig(nextProduct.id));
                            return;
                          }
                        }

                        setConfiguratorOption(setOption, group.key, option.key);
                      }}
                      style={{
                        background: selected ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.28), rgba(34, 197, 94, 0.2))' : 'rgba(15, 23, 42, 0.5)',
                        border: selected ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid rgba(255, 255, 255, 0.14)',
                        borderRadius: '999px',
                        color: isDisabled ? '#64748b' : selected ? '#fff7ed' : '#cbd5e1',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        display: 'inline-grid',
                        font: 'inherit',
                        fontSize: isTouchDevice ? '0.61rem' : '0.64rem',
                        fontWeight: selected ? 950 : 850,
                        gap: '5px',
                        justifyItems: 'start',
                        lineHeight: 1.12,
                        opacity: isDisabled ? 0.52 : 1,
                        padding: isTouchDevice ? '8px 9px' : '8px 10px',
                        whiteSpace: 'normal',
                      }}
                    >
                      <span>{option.label}{formatOptionPriceDelta(option.priceDelta)}</span>
                      <span
                        data-home-config-constraint-label={`${group.key}:${option.key}:${option.constraintStatus}`}
                        style={{
                          ...statusStyle,
                          borderRadius: '999px',
                          fontSize: isTouchDevice ? '0.44rem' : '0.47rem',
                          fontWeight: 950,
                          letterSpacing: '0.08em',
                          lineHeight: 1,
                          padding: '3px 5px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {statusLabel}
                      </span>
                      {option.productionConstraintSeverity !== 'info' ? (
                        <span
                          data-home-config-production-label={`${group.key}:${option.key}:${option.productionConstraintSeverity}`}
                          style={{
                            ...HOME_PRODUCTION_CONSTRAINT_SEVERITY_STYLES[option.productionConstraintSeverity],
                            borderRadius: '999px',
                            fontSize: isTouchDevice ? '0.44rem' : '0.47rem',
                            fontWeight: 950,
                            letterSpacing: '0.08em',
                            lineHeight: 1,
                            padding: '3px 5px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {HOME_PRODUCTION_CONSTRAINT_SEVERITY_LABELS[option.productionConstraintSeverity]}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {group.options.some((option) => option.isDisabled) ? (
                <div
                  data-home-config-disabled-note={group.key}
                  style={{
                    color: '#94a3b8',
                    fontSize: isTouchDevice ? '0.54rem' : '0.58rem',
                    fontWeight: 760,
                    lineHeight: 1.3,
                    marginTop: '5px',
                  }}
                >
                  Muted options are unavailable for {product.name}.
                </div>
              ) : null}
              {group.options.some((option) => option.constraintStatus === 'requiresReview') ? (
                <div
                  data-home-config-review-note={group.key}
                  style={{
                    color: '#fde68a',
                    fontSize: isTouchDevice ? '0.54rem' : '0.58rem',
                    fontWeight: 760,
                    lineHeight: 1.3,
                    marginTop: '5px',
                  }}
                >
                  Review-marked options need production confirmation before final quote.
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div
          data-home-config-summary="true"
          style={{
            borderTop: '1px solid rgba(34, 197, 94, 0.18)',
            color: '#bbf7d0',
            fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
            fontWeight: 850,
            lineHeight: 1.45,
            marginTop: isTouchDevice ? '10px' : '11px',
            paddingTop: isTouchDevice ? '10px' : '11px',
          }}
        >
          Selected: {configSummary.product} / {configSummary.layoutVariant} / {configSummary.facade} / {configSummary.roof} / {configSummary.terrace} / {configSummary.finishLevel}
          <br />
          Details: {configSummary.facadeBoardProfile} / {configSummary.facadeBoardSpacing} / {configSummary.trimColor} / {configSummary.roofGutterStyle} / {configSummary.windowFrameType} / {configSummary.wallPanelStyle} / {configSummary.interiorFloorStyle}
          <br />
          Interior: {configSummary.furniturePackage} / sofa {configSummary.sofa} / table {configSummary.table} / bed {configSummary.bed} / kitchen {configSummary.kitchenLine} / wardrobe {configSummary.wardrobePlaceholder}
        </div>

        {visibleProductionConstraints.length > 0 ? (
          <div
            aria-label="Modular home production readiness constraints"
            data-home-config-production-constraints="true"
            data-home-config-production-constraint-count={visibleProductionConstraints.length}
            style={{
              background: 'rgba(2, 6, 23, 0.32)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              borderRadius: '13px',
              display: 'grid',
              gap: '6px',
              marginTop: isTouchDevice ? '8px' : '9px',
              padding: isTouchDevice ? '7px 8px' : '8px 9px',
            }}
          >
            <div style={{ color: '#fef3c7', fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Production readiness
            </div>
            {visibleProductionConstraints.map((constraint) => renderProductionConstraintCard(constraint, isTouchDevice))}
          </div>
        ) : null}

        {invalidConfigReasons.length > 0 ? (
          <div
            data-home-config-validation="invalid"
            style={{
              background: 'rgba(127, 29, 29, 0.24)',
              border: '1px solid rgba(248, 113, 113, 0.26)',
              borderRadius: '12px',
              color: '#fecaca',
              display: 'grid',
              gap: '4px',
              fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
              fontWeight: 800,
              lineHeight: 1.3,
              marginTop: isTouchDevice ? '8px' : '9px',
              padding: isTouchDevice ? '7px 8px' : '8px 9px',
            }}
          >
            {invalidConfigReasons.map((reason) => (
              <span key={reason}>{reason}</span>
            ))}
          </div>
        ) : null}
        {reviewConfigWarnings.length > 0 ? (
          <div
            data-home-config-validation="requires-review"
            style={{
              background: 'rgba(120, 53, 15, 0.24)',
              border: '1px solid rgba(251, 191, 36, 0.28)',
              borderRadius: '12px',
              color: '#fde68a',
              display: 'grid',
              gap: '4px',
              fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
              fontWeight: 800,
              lineHeight: 1.3,
              marginTop: isTouchDevice ? '8px' : '9px',
              padding: isTouchDevice ? '7px 8px' : '8px 9px',
            }}
          >
            <span style={{ color: '#fef3c7', fontWeight: 950 }}>Requires review before production quote:</span>
            {reviewConfigWarnings.map((warning) => (
              <span key={warning.id} data-home-config-review-warning={warning.id}>
                {warning.message}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <ModularHomeShareLinkPanel
        config={config}
        invalidShareKeys={sharedConfigFromUrl.invalidKeys}
        isTouchDevice={isTouchDevice}
        viewMode={viewMode}
      />
        </>
      ) : null}

      {activeHomeDemoTab === 'projects' ? (
        <ModularHomeProjectWorkspace
          config={config}
          estimate={estimate}
          isTouchDevice={isTouchDevice}
          onLoadProject={setConfig}
          productId={product.id}
        />
      ) : null}

      {activeHomeDemoTab === 'bom' ? (
        <section
          aria-label={`${template.name} module and manufacturing BOM`}
          data-home-bom-tab-panel="true"
          data-home-bom-tab-component-count={componentBom.componentCount}
          data-home-bom-tab-module-count={componentBom.moduleCount}
          data-home-bom-tab-manufacturing-assembly-count={manufacturingBom.assemblyGroups.length}
          data-home-bom-tab-manufacturing-component-code-count={manufacturingBom.componentCodes.length}
          data-home-bom-tab-manufacturing-panel-count={manufacturingBom.panelGroups.reduce((total, group) => total + group.panelCount, 0)}
          data-home-bom-tab-manufacturing-board-length-count={manufacturingBom.boardLengthGroups.reduce((total, group) => total + group.quantity, 0)}
          data-home-bom-tab-manufacturing-hardware-count={manufacturingBom.fastenerHardwarePlaceholders.reduce((total, item) => total + item.quantity, 0)}
          style={{
            background: 'linear-gradient(180deg, rgba(20, 83, 45, 0.42), rgba(2, 6, 23, 0.62))',
            border: '1px solid rgba(134, 239, 172, 0.24)',
            borderRadius: isTouchDevice ? '15px' : '17px',
            display: 'grid',
            gap: isTouchDevice ? '9px' : '10px',
            marginTop: isTouchDevice ? '10px' : '12px',
            padding: isTouchDevice ? '10px' : '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'start' }}>
            <div>
              <div style={{ color: '#86efac', fontSize: '0.58rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                BOM workspace
              </div>
              <div style={{ color: '#ecfdf5', fontSize: isTouchDevice ? '0.8rem' : '0.88rem', fontWeight: 950, lineHeight: 1.08, marginTop: '4px' }}>
                Module package and manufacturing preview
              </div>
            </div>
            <div style={{ color: '#fef3c7', fontSize: isTouchDevice ? '0.72rem' : '0.78rem', fontWeight: 950, textAlign: 'right', whiteSpace: 'nowrap' }}>
              {formatHomeEstimateEur(componentBom.subtotal)}
            </div>
          </div>

          <div style={{ color: '#bbf7d0', fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 800, lineHeight: 1.28 }}>
            {manufacturingBom.disclaimer}
          </div>

          <div style={{ display: 'grid', gap: isTouchDevice ? '7px' : '8px', gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
            {([
              ['Modules', componentBom.moduleCount.toString()],
              ['Components', componentBom.componentCount.toString()],
              ['Assembly groups', manufacturingBom.assemblyGroups.length.toString()],
              ['Component codes', manufacturingBom.componentCodes.length.toString()],
              ['Facade boards', formatQuantityLinearM(manufacturingBom.facadeBoardLinearM)],
              ['Roof cassettes', formatQuantityM2(manufacturingBom.roofCassetteAreaM2)],
              ['Floor cassettes', formatQuantityM2(manufacturingBom.floorCassetteAreaM2)],
              ['Waste factor', formatWasteFactor(manufacturingBom.totalWasteFactor)],
            ] as const).map(([label, value]) => (
              <div
                key={label}
                data-home-bom-tab-total={`${label}:${value}`}
                style={{
                  background: 'rgba(2, 6, 23, 0.26)',
                  border: '1px solid rgba(134, 239, 172, 0.14)',
                  borderRadius: '10px',
                  padding: isTouchDevice ? '8px 9px' : '8px 9px',
                }}
              >
                <div style={{ color: '#86efac', fontSize: '0.5rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ color: '#dcfce7', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 920, marginTop: '3px' }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '6px' }}>
            {componentBom.groups.map((group) => (
              <div
                key={group.category}
                data-home-bom-tab-component-group={`${group.category}:${group.quantity}:${group.subtotal}`}
                style={{
                  background: 'rgba(15, 23, 42, 0.42)',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                  borderRadius: '10px',
                  display: 'grid',
                  gap: '4px',
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
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '6px' }}>
            {manufacturingBom.panelGroups.slice(0, 5).map((group) => (
              <div
                key={group.id}
                data-home-bom-tab-panel-group={`${group.id}:${group.panelCount}:${group.areaM2}`}
                style={{
                  background: 'rgba(2, 6, 23, 0.24)',
                  border: '1px solid rgba(134, 239, 172, 0.12)',
                  borderRadius: '10px',
                  padding: isTouchDevice ? '6px 7px' : '7px 8px',
                }}
              >
                <div style={{ color: '#d1fae5', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 900 }}>
                  {group.label} · {group.panelCount} panels · {formatQuantityM2(group.areaM2)}
                </div>
                <div style={{ color: '#bbf7d0', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 760, lineHeight: 1.25, marginTop: '3px' }}>
                  {group.panelGroupId} / {group.componentCode} / {group.approximatePanelDimensions.join(' / ')}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '6px' }}>
            {manufacturingBom.panelSizeGroups.slice(0, 4).map((group) => (
              <div
                key={group.id}
                data-home-bom-tab-panel-size-group={`${group.id}:${group.panelCount}:${group.dimensions}:${group.areaM2}`}
                style={{
                  background: 'rgba(6, 78, 59, 0.22)',
                  border: '1px solid rgba(110, 231, 183, 0.13)',
                  borderRadius: '10px',
                  padding: isTouchDevice ? '6px 7px' : '7px 8px',
                }}
              >
                <div style={{ color: '#a7f3d0', fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 900 }}>
                  {group.label} - {group.panelCount} pcs - {group.dimensions}
                </div>
                <div style={{ color: '#bbf7d0', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 760, lineHeight: 1.25, marginTop: '3px' }}>
                  {formatQuantityM2(group.areaM2)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '5px' }}>
            {([
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
                data-home-bom-tab-cutlist-readiness={`${label}:${value}`}
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
        </section>
      ) : null}

      {activeHomeDemoTab === 'estimate' ? (
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
          data-home-estimate-bom-module-count={componentBom.moduleCount}
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

          <div
            style={{
              display: 'grid',
              gap: isTouchDevice ? '7px' : '8px',
              gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))',
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
      ) : null}

      {activeHomeDemoTab === 'quote' ? (
        <>
          <ModularHomeQuoteForm config={config} estimate={estimate} isTouchDevice={isTouchDevice} />

          <ModularHomeProjectSummary config={config} estimate={estimate} isTouchDevice={isTouchDevice} />
        </>
      ) : null}

      <div
        style={{
          borderTop: '1px solid rgba(251, 191, 36, 0.18)',
          color: '#fdba74',
          fontSize: isTouchDevice ? '0.62rem' : '0.66rem',
          fontWeight: 850,
          marginTop: isTouchDevice ? '11px' : '13px',
          paddingTop: isTouchDevice ? '9px' : '10px',
        }}
      >
        {'Preview model \u00b7 quote requests are saved locally only'}
      </div>
    </aside>
  );
}
