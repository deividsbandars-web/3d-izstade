import { useEffect, useMemo } from 'react';
import { isHomeDemoEnabled } from './homeDemoFlags';
import {
  type ModularHomeConfiguratorState,
  useModularHomeConfigurator,
} from './modularHomeConfigurator';
import { getModularHomeTemplate, type ModularHomeTemplateId } from './modularHomeConfig';
import { calculateModularHomeEstimate, formatHomeEstimateEur } from './modularHomeEstimate';
import {
  getDefaultHomeConfig,
  getBomModuleSummary,
  getInvalidConfigReasons,
  getModularHomeConfigurationWarnings,
  getModularHomeDimensionSummary,
  getModularHomeOptionChoices,
  getModularHomeProductConfigSummary,
  getModularHomeProductForTemplate,
  getModularHomeProducts,
  type ModularHomeConstraintStatus,
  type ModularHomeOptionGroup,
  type ModularHomeProduct,
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

// TODO: split this dense preview HUD into tabs: Overview, Configure, Estimate, Quote, Summary, Projects and Upload.
type HomeConfigUiOption<Key extends keyof ModularHomeConfiguratorState = keyof ModularHomeConfiguratorState> = {
  constraintMessage: string;
  constraintStatus: ModularHomeConstraintStatus;
  disabledReason: string;
  isDisabled: boolean;
  key: ModularHomeConfiguratorState[Key];
  label: string;
  priceDelta: number;
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
  })) satisfies readonly HomeConfigUiOption<'template'>[];

  return [
    { key: 'template', label: 'Home product', options: templateOptions },
    createOptionGroup(product, config, 'facade', 'Facade', 'facade'),
    createOptionGroup(product, config, 'roof', 'Roof', 'roof'),
    createOptionGroup(product, config, 'terrace', 'Terrace', 'terrace'),
    createOptionGroup(product, config, 'finishLevel', 'Finish level', 'finish'),
  ];
}

function stopHomeDemoHudEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

export function ModularHomeDemoOverlay({ isTouchDevice = false }: ModularHomeDemoOverlayProps) {
  const { config, reset, setConfig, setOption } = useModularHomeConfigurator();
  const sharedConfigFromUrl = useMemo(() => decodeModularHomeConfigFromUrl(), []);
  const products = getModularHomeProducts();
  const product = getModularHomeProductForTemplate(config.template) ?? products[0];
  const template = getModularHomeTemplate(config.template);
  const configSummary = getModularHomeProductConfigSummary(config);
  const dimensionSummary = getModularHomeDimensionSummary(config);
  const configuratorGroups = createConfiguratorGroups(product, config);
  const estimate = calculateModularHomeEstimate(config);
  const bomSummary = getBomModuleSummary(product.id);
  const bomModuleCount = bomSummary.reduce((total, item) => total + item.quantity, 0);
  const invalidConfigReasons = getInvalidConfigReasons(config);
  const reviewConfigWarnings = getModularHomeConfigurationWarnings(config)
    .filter((warning) => warning.status === 'requiresReview');
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
    ['Roof package', estimate.selectedOptions.roof],
    ['Terrace package', estimate.selectedOptions.terrace],
    ['Finish package', estimate.selectedOptions.finishLevel],
  ] as const;

  useEffect(() => {
    if (!sharedConfigFromUrl.isSharedConfig) {
      return;
    }

    setConfig(sharedConfigFromUrl.config);
  }, [setConfig, sharedConfigFromUrl]);

  if (!isHomeDemoEnabled()) {
    return null;
  }

  return (
    <aside
      aria-label="Modular Home District preview"
      data-home-demo-overlay="true"
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
        width: isTouchDevice ? 'auto' : '390px',
        maxHeight: isTouchDevice ? '48vh' : 'calc(100vh - 90px)',
        maxWidth: isTouchDevice ? 'calc(100vw - 24px)' : 'calc(100vw - 560px)',
        overflowY: 'auto',
        padding: isTouchDevice ? '12px 13px' : '16px 17px',
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

      <section
        aria-label={`${product.name} home preview`}
        data-home-demo-info-card="true"
        data-home-demo-product-id={product.id}
        style={{
          background: 'rgba(15, 23, 42, 0.58)',
          border: '1px solid rgba(251, 191, 36, 0.22)',
          borderRadius: isTouchDevice ? '15px' : '17px',
          marginTop: isTouchDevice ? '10px' : '12px',
          padding: isTouchDevice ? '10px' : '12px',
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
              gap: '6px',
              gridTemplateColumns: isTouchDevice ? '1fr 1fr' : 'repeat(2, minmax(0, 1fr))',
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
            gap: '6px',
            gridTemplateColumns: isTouchDevice ? '1fr 1fr' : 'repeat(2, minmax(0, 1fr))',
            marginTop: isTouchDevice ? '10px' : '11px',
            paddingTop: isTouchDevice ? '9px' : '10px',
          }}
        >
          {template.interiorLabels.map((hotspot) => (
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

      <ModularHomeProjectUploadPlaceholder isTouchDevice={isTouchDevice} />

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

        <div style={{ display: 'grid', gap: isTouchDevice ? '8px' : '9px', marginTop: isTouchDevice ? '10px' : '11px' }}>
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
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
                      data-home-config-selected={selected ? 'true' : 'false'}
                      disabled={isDisabled}
                      title={option.constraintMessage || option.label}
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
                        fontSize: isTouchDevice ? '0.58rem' : '0.61rem',
                        fontWeight: selected ? 950 : 850,
                        gap: '4px',
                        justifyItems: 'start',
                        lineHeight: 1.05,
                        opacity: isDisabled ? 0.52 : 1,
                        padding: isTouchDevice ? '7px 8px' : '7px 9px',
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
            lineHeight: 1.35,
            marginTop: isTouchDevice ? '10px' : '11px',
            paddingTop: isTouchDevice ? '9px' : '10px',
          }}
        >
          Selected: {configSummary.product} / {configSummary.facade} / {configSummary.roof} / {configSummary.terrace} / {configSummary.finishLevel}
        </div>

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
      />

      <ModularHomeProjectWorkspace
        config={config}
        estimate={estimate}
        isTouchDevice={isTouchDevice}
        onLoadProject={setConfig}
        productId={product.id}
      />

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

        <div
          aria-label="Selected estimate options"
          style={{
            display: 'grid',
            gap: '5px',
            gridTemplateColumns: isTouchDevice ? '1fr 1fr' : 'repeat(2, minmax(0, 1fr))',
            marginTop: isTouchDevice ? '9px' : '10px',
          }}
        >
          {([
            ['Facade', estimate.selectedOptions.facade],
            ['Roof', estimate.selectedOptions.roof],
            ['Terrace', estimate.selectedOptions.terrace],
            ['Finish', estimate.selectedOptions.finishLevel],
          ] as const).map(([label, value]) => (
            <div
              key={label}
              data-home-estimate-selected-option={`${label}:${value}`}
              style={{
                background: 'rgba(15, 23, 42, 0.52)',
                border: '1px solid rgba(148, 163, 184, 0.16)',
                borderRadius: '10px',
                padding: isTouchDevice ? '6px 7px' : '7px 8px',
              }}
            >
              <div style={{ color: '#93c5fd', fontSize: '0.52rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
              <div style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 850, marginTop: '3px' }}>{value}</div>
            </div>
          ))}
        </div>

        <div
          aria-label="Module package summary"
          data-home-estimate-bom-summary="true"
          data-home-estimate-bom-module-count={bomModuleCount}
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
              Module package summary
            </div>
            <div
              data-home-estimate-bom-status="true"
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
              {'Preview BOM \u00b7 verify'}
            </div>
          </div>

          <div
            data-home-estimate-bom-note="true"
            style={{
              color: '#bfdbfe',
              fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
              fontWeight: 800,
              lineHeight: 1.28,
            }}
          >
            {'Preview BOM \u00b7 production verification required'}
          </div>

          <div style={{ display: 'grid', gap: '5px' }}>
            {bomSummary.map((item) => (
              <div
                key={item.moduleId}
                data-home-estimate-bom-item={`${item.moduleId}:${item.moduleType}:${item.quantity}:${item.totalPrice}`}
                style={{
                  alignItems: 'start',
                  display: 'grid',
                  gap: '8px',
                  gridTemplateColumns: '1fr auto',
                }}
              >
                <span style={{ color: '#dbeafe', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 820, lineHeight: 1.28 }}>
                  {item.roles.join(', ')} <span style={{ color: '#93c5fd' }}>({item.moduleType})</span> x{item.quantity}
                </span>
                <span style={{ color: '#fef3c7', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 950 }}>
                  {formatHomeEstimateEur(item.totalPrice)}
                </span>
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
        </div>

        <div
          aria-label="Estimate line items"
          style={{
            borderTop: '1px solid rgba(96, 165, 250, 0.18)',
            display: 'grid',
            gap: '6px',
            marginTop: isTouchDevice ? '9px' : '10px',
            paddingTop: isTouchDevice ? '9px' : '10px',
          }}
        >
          {estimate.lineItems.map((item) => (
            <div
              key={item.id}
              data-home-estimate-line-item={`${item.id}:${item.amount}`}
              style={{
                alignItems: 'center',
                display: 'grid',
                gap: '8px',
                gridTemplateColumns: '1fr auto',
              }}
            >
              <span style={{ color: '#dbeafe', fontSize: isTouchDevice ? '0.6rem' : '0.64rem', fontWeight: 820 }}>
                {item.label}
              </span>
              <span style={{ color: item.amount === 0 ? '#93c5fd' : '#fef3c7', fontSize: isTouchDevice ? '0.6rem' : '0.64rem', fontWeight: 950 }}>
                {item.amount === 0 ? 'Included' : formatHomeEstimateEur(item.amount)}
              </span>
            </div>
          ))}
          <div
            data-home-estimate-subtotal={estimate.subtotal}
            style={{
              alignItems: 'center',
              borderTop: '1px solid rgba(96, 165, 250, 0.14)',
              display: 'grid',
              gap: '8px',
              gridTemplateColumns: '1fr auto',
              paddingTop: '7px',
            }}
          >
            <span style={{ color: '#bfdbfe', fontSize: isTouchDevice ? '0.6rem' : '0.64rem', fontWeight: 900 }}>Subtotal before site services</span>
            <span style={{ color: '#f8fafc', fontSize: isTouchDevice ? '0.62rem' : '0.66rem', fontWeight: 960 }}>{formatHomeEstimateEur(estimate.subtotal)}</span>
          </div>
        </div>

        <div
          aria-label="Estimate optional services"
          style={{
            borderTop: '1px solid rgba(96, 165, 250, 0.18)',
            display: 'grid',
            gap: '6px',
            marginTop: isTouchDevice ? '9px' : '10px',
            paddingTop: isTouchDevice ? '9px' : '10px',
          }}
        >
          <div style={{ color: '#93c5fd', fontSize: '0.56rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Optional service placeholders
          </div>
          {estimate.optionalServices.map((item) => (
            <div
              key={item.id}
              data-home-estimate-optional-service={`${item.id}:${item.amount}`}
              style={{
                alignItems: 'center',
                display: 'grid',
                gap: '8px',
                gridTemplateColumns: '1fr auto',
              }}
            >
              <span style={{ color: '#dbeafe', fontSize: isTouchDevice ? '0.6rem' : '0.64rem', fontWeight: 820 }}>{item.label}</span>
              <span style={{ color: '#fef3c7', fontSize: isTouchDevice ? '0.6rem' : '0.64rem', fontWeight: 950 }}>{formatHomeEstimateEur(item.amount)}</span>
            </div>
          ))}
          <div
            data-home-estimate-vat={`${estimate.vatEstimate.id}:${estimate.vatEstimate.amount}`}
            style={{
              alignItems: 'center',
              display: 'grid',
              gap: '8px',
              gridTemplateColumns: '1fr auto',
            }}
          >
            <span style={{ color: '#dbeafe', fontSize: isTouchDevice ? '0.6rem' : '0.64rem', fontWeight: 820 }}>{estimate.vatEstimate.label}</span>
            <span style={{ color: '#fef3c7', fontSize: isTouchDevice ? '0.6rem' : '0.64rem', fontWeight: 950 }}>{formatHomeEstimateEur(estimate.vatEstimate.amount)}</span>
          </div>
        </div>

        <div
          style={{
            alignItems: 'end',
            borderTop: '1px solid rgba(96, 165, 250, 0.22)',
            display: 'grid',
            gap: '10px',
            gridTemplateColumns: '1fr auto',
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

      <ModularHomeQuoteForm config={config} estimate={estimate} isTouchDevice={isTouchDevice} />

      <ModularHomeProjectSummary config={config} estimate={estimate} isTouchDevice={isTouchDevice} />

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
