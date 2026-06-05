import { isHomeDemoEnabled } from './homeDemoFlags';
import {
  MODULAR_HOME_CONFIGURATOR_GROUPS,
  type ModularHomeConfiguratorState,
  useModularHomeConfigurator,
} from './modularHomeConfigurator';
import { getModularHomeTemplate } from './modularHomeConfig';
import { calculateHomeEstimate, formatHomeEstimateEur } from './modularHomeEstimate';
import { ModularHomeProjectSummary } from './ModularHomeProjectSummary';
import { ModularHomeProjectUploadPlaceholder } from './ModularHomeProjectUploadPlaceholder';
import { ModularHomeQuoteForm } from './ModularHomeQuoteForm';

type ModularHomeDemoOverlayProps = {
  isTouchDevice?: boolean;
};

const HOME_DEMO_BULLETS = [
  '3D house walkthrough',
  'Configurable modules',
  'Instant estimate preview',
  'Request a build quote',
] as const;

function setConfiguratorOption(
  setOption: ReturnType<typeof useModularHomeConfigurator>['setOption'],
  key: keyof ModularHomeConfiguratorState,
  value: ModularHomeConfiguratorState[keyof ModularHomeConfiguratorState],
) {
  setOption(key as never, value as never);
}

function stopHomeDemoHudEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

export function ModularHomeDemoOverlay({ isTouchDevice = false }: ModularHomeDemoOverlayProps) {
  const { config, reset, setOption, summary } = useModularHomeConfigurator();
  const template = getModularHomeTemplate(config.template);
  const estimate = calculateHomeEstimate(config);

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
        aria-label={`${template.name} home preview`}
        data-home-demo-info-card="true"
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
          {template.name}
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
          {template.description}
        </div>

        <div
          aria-label={`${template.name} facts`}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginTop: isTouchDevice ? '9px' : '10px',
          }}
        >
          {template.facts.map((fact) => (
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
        aria-label={`${template.name} configurator`}
        data-home-configurator-panel="true"
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
              Try finish and module options
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
          {MODULAR_HOME_CONFIGURATOR_GROUPS.map((group) => (
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

                  return (
                    <button
                      key={option.key}
                      type="button"
                      aria-pressed={selected}
                      data-home-config-option={`${group.key}:${option.key}`}
                      data-home-config-selected={selected ? 'true' : 'false'}
                      onClick={(event) => {
                        event.stopPropagation();
                        setConfiguratorOption(setOption, group.key, option.key);
                      }}
                      style={{
                        background: selected ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.28), rgba(34, 197, 94, 0.2))' : 'rgba(15, 23, 42, 0.5)',
                        border: selected ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid rgba(255, 255, 255, 0.14)',
                        borderRadius: '999px',
                        color: selected ? '#fff7ed' : '#cbd5e1',
                        cursor: 'pointer',
                        font: 'inherit',
                        fontSize: isTouchDevice ? '0.58rem' : '0.61rem',
                        fontWeight: selected ? 950 : 850,
                        lineHeight: 1,
                        padding: isTouchDevice ? '7px 8px' : '7px 9px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
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
          Selected: {summary.template} / {summary.facade} / {summary.roof} / {summary.terrace} / {summary.finishLevel}
        </div>
      </section>

      <section
        aria-label={`${template.name} preview estimate`}
        data-home-estimate-panel="true"
        data-home-estimate-total={estimate.totalPrice}
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
          aria-label="Estimate line items"
          style={{
            borderTop: '1px solid rgba(96, 165, 250, 0.18)',
            display: 'grid',
            gap: '6px',
            marginTop: isTouchDevice ? '9px' : '10px',
            paddingTop: isTouchDevice ? '9px' : '10px',
          }}
        >
          {estimate.adjustments.length === 0 ? (
            <div style={{ color: '#bfdbfe', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 820 }}>
              No paid upgrades selected.
            </div>
          ) : estimate.adjustments.map((item) => (
            <div
              key={item.id}
              data-home-estimate-adjustment={`${item.id}:${item.amount}`}
              style={{
                alignItems: 'center',
                display: 'grid',
                gap: '8px',
                gridTemplateColumns: '1fr auto',
              }}
            >
              <span style={{ color: '#dbeafe', fontSize: isTouchDevice ? '0.6rem' : '0.64rem', fontWeight: 820 }}>{item.label}</span>
              <span style={{ color: '#fef3c7', fontSize: isTouchDevice ? '0.6rem' : '0.64rem', fontWeight: 950 }}>+{formatHomeEstimateEur(item.amount)}</span>
            </div>
          ))}
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
            {formatHomeEstimateEur(estimate.totalPrice)}
          </div>
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
