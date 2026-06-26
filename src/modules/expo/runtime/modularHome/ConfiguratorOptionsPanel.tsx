import type { Dispatch, SetStateAction } from 'react';
import { ModularHomeShareLinkPanel } from './ModularHomeShareLinkPanel';
import type { ModularHomeTemplateId } from './modularHomeConfig';
import {
  type ModularHomeConfiguratorState,
  type ModularHomeViewModeOption,
  type useModularHomeConfigurator,
} from './modularHomeConfigurator';
import { formatHomeEstimateEur } from './modularHomeEstimate';
import {
  getDefaultDimensionPresetForProduct,
  getDefaultHomeConfig,
  getModularHomeDimensionPresetsForProduct,
  getModularHomeLayoutVariantsForProduct,
  getModularHomeOptionChoices,
  getModularHomeProductForTemplate,
  getModularHomeProducts,
  getModularHomeRoomUseChoices,
  type ModularHomeConstraintStatus,
  type ModularHomeOptionGroup,
  type ModularHomeProduct,
  type ModularHomeProductConfigSummary,
  type ModularHomeProductionConstraint,
  type ModularHomeProductionConstraintSeverity,
} from './modularHomeProducts';

type ModularHomeDemoTabId = 'overview' | 'design' | 'estimate' | 'bom' | 'quote' | 'projects' | 'upload';

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
  const dimensionPresetOptions = getModularHomeDimensionPresetsForProduct(product.id).map((preset) => ({
    constraintMessage: preset.summaryNote,
    constraintStatus: 'compatible',
    disabledReason: '',
    isDisabled: false,
    key: preset.id,
    label: preset.label,
    priceDelta: 0,
    productionConstraintSeverity: preset.id === getDefaultDimensionPresetForProduct(product.id) ? 'info' : 'requiresReview',
    productionNextStep: preset.moduleDimensionNote,
  })) satisfies readonly HomeConfigUiOption<'dimensionPreset'>[];
  const roomUseOptions = getModularHomeRoomUseChoices(product.id, config.layoutVariant).map((profile) => ({
    constraintMessage: profile.summaryNote,
    constraintStatus: 'compatible',
    disabledReason: '',
    isDisabled: false,
    key: profile.id,
    label: profile.label,
    priceDelta: 0,
    productionConstraintSeverity: 'info',
    productionNextStep: profile.interiorPackageNote,
  })) satisfies readonly HomeConfigUiOption<'roomUseProfile'>[];

  return [
    { key: 'template', label: 'Home product', options: templateOptions },
    { key: 'layoutVariant', label: 'Layout variant', options: layoutOptions },
    { key: 'dimensionPreset', label: 'Dimension preset', options: dimensionPresetOptions },
    { key: 'roomUseProfile', label: 'Room use', options: roomUseOptions },
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

type ConfiguratorOptionsPanelProps = {
  config: ModularHomeConfiguratorState;
  configSummary: ModularHomeProductConfigSummary;
  invalidConfigReasons: readonly string[];
  invalidShareKeys: readonly string[];
  isTouchDevice: boolean;
  product: ModularHomeProduct;
  reset: () => void;
  reviewConfigWarnings: readonly ModularHomeProductionConstraint[];
  setActiveHomeDemoTab: Dispatch<SetStateAction<ModularHomeDemoTabId>>;
  setConfig: ReturnType<typeof useModularHomeConfigurator>['setConfig'];
  setOption: ReturnType<typeof useModularHomeConfigurator>['setOption'];
  updateStudioViewMode: (nextViewMode: ModularHomeViewModeOption) => void;
  viewMode: ModularHomeViewModeOption;
  visibleProductionConstraints: readonly ModularHomeProductionConstraint[];
};

export function ConfiguratorOptionsPanel({
  config,
  configSummary,
  invalidConfigReasons,
  invalidShareKeys,
  isTouchDevice,
  product,
  reset,
  reviewConfigWarnings,
  setActiveHomeDemoTab,
  setConfig,
  setOption,
  updateStudioViewMode,
  viewMode,
  visibleProductionConstraints,
}: ConfiguratorOptionsPanelProps) {
  const configuratorGroups = createConfiguratorGroups(product, config);
  const sharedConfigFromUrl = { invalidKeys: invalidShareKeys };

  return (
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
                <div
                  style={{
                    background: 'rgba(2, 6, 23, 0.28)',
                    border: '1px solid rgba(125, 211, 252, 0.18)',
                    borderRadius: '13px',
                    display: 'grid',
                    gap: '7px',
                    padding: isTouchDevice ? '9px 10px' : '10px 11px',
                  }}
                >
                  <div style={{ color: '#7dd3fc', fontSize: isTouchDevice ? '0.54rem' : '0.58rem', fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Instance actions
                  </div>
                  <div style={{ color: '#e2e8f0', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 800, lineHeight: 1.28 }}>
                    {viewMode === 'interior'
                      ? 'You are inside the same modular home scene.'
                      : 'You are outside the same modular home scene.'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        updateStudioViewMode('exterior');
                      }}
                      style={{
                        background: 'rgba(15, 23, 42, 0.56)',
                        border: '1px solid rgba(125, 211, 252, 0.18)',
                        borderRadius: '999px',
                        color: '#bae6fd',
                        cursor: 'pointer',
                        font: 'inherit',
                        fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
                        fontWeight: 900,
                        padding: '8px 10px',
                      }}
                    >
                      Start outside
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        updateStudioViewMode('interior');
                      }}
                      style={{
                        background: 'rgba(15, 23, 42, 0.56)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        borderRadius: '999px',
                        color: '#bbf7d0',
                        cursor: 'pointer',
                        font: 'inherit',
                        fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
                        fontWeight: 900,
                        padding: '8px 10px',
                      }}
                    >
                      Start inside
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveHomeDemoTab('quote');
                      }}
                      style={{
                        background: 'rgba(15, 23, 42, 0.56)',
                        border: '1px solid rgba(251, 191, 36, 0.2)',
                        borderRadius: '999px',
                        color: '#fde68a',
                        cursor: 'pointer',
                        font: 'inherit',
                        fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
                        fontWeight: 900,
                        padding: '8px 10px',
                      }}
                    >
                      Request quote
                    </button>
                  </div>
                </div>
      
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
                Selected: {configSummary.product} / {configSummary.layoutVariant} / {configSummary.roomUseProfile} / {configSummary.facade} / {configSummary.roof} / {configSummary.terrace} / {configSummary.finishLevel}
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
  );
}
