import { getSalesDemoStep, isSalesDemoEnabled, type SalesDemoStep } from './salesDemoFlags';

type SalesDemoGuideOverlayProps = {
  isTouchDevice?: boolean;
};

const GUIDE_ITEMS = [
  {
    body: 'Zone naming + hero sponsor presence',
    label: 'Landmark Zone Sponsor',
    step: 'landmark',
  },
  {
    body: 'Meetings, diagnostics and lead reports',
    label: 'Premium Booth',
    step: 'premium',
  },
  {
    body: 'Product profile and sponsor interest',
    label: 'Standard Booth',
    step: 'standard',
  },
  {
    body: 'Monthly demo battles and sponsor inventory',
    label: 'Demo Arena',
    step: 'arena',
  },
] as const satisfies ReadonlyArray<{
  body: string;
  label: string;
  step: Exclude<SalesDemoStep, 'none'>;
}>;

export function SalesDemoGuideOverlay({ isTouchDevice = false }: SalesDemoGuideOverlayProps) {
  if (!isSalesDemoEnabled()) {
    return null;
  }

  const activeStep = getSalesDemoStep();

  return (
    <aside
      aria-label="Sales Demo Guide"
      data-sales-demo-active-step={activeStep}
      data-sales-demo-guide-overlay="true"
      style={{
        position: 'absolute',
        left: isTouchDevice ? '12px' : '252px',
        right: isTouchDevice ? '12px' : 'auto',
        bottom: isTouchDevice ? 'max(116px, calc(env(safe-area-inset-bottom) + 112px))' : '26px',
        zIndex: 115,
        width: isTouchDevice ? 'auto' : '306px',
        maxWidth: isTouchDevice ? 'calc(100vw - 24px)' : 'calc(100vw - 560px)',
        padding: isTouchDevice ? '10px 12px' : '13px 15px',
        border: '1px solid rgba(125, 211, 252, 0.34)',
        borderRadius: isTouchDevice ? '16px' : '18px',
        background: 'linear-gradient(180deg, rgba(8, 13, 25, 0.86), rgba(15, 23, 42, 0.72))',
        boxShadow: '0 18px 44px rgba(2, 6, 23, 0.34)',
        color: '#f8fafc',
        fontFamily: 'inherit',
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: isTouchDevice ? '0.82rem' : '0.92rem', fontWeight: 950, letterSpacing: '0.04em' }}>
            Sales Demo
          </div>
          <div style={{ marginTop: '2px', color: '#bae6fd', fontSize: isTouchDevice ? '0.64rem' : '0.7rem', fontWeight: 800 }}>
            Web3D Expo monetization preview
          </div>
        </div>
        <div
          style={{
            border: '1px solid rgba(34, 197, 94, 0.36)',
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
          Preview
        </div>
      </div>

      <div style={{ display: 'grid', gap: isTouchDevice ? '6px' : '7px', marginTop: isTouchDevice ? '9px' : '11px' }}>
        {GUIDE_ITEMS.map((item, index) => {
          const isActive = activeStep === item.step;

          return (
            <div
              key={item.label}
              data-sales-demo-guide-step={item.step}
              data-sales-demo-guide-step-active={isActive ? 'true' : 'false'}
              style={{
                alignItems: 'start',
                background: isActive ? 'rgba(14, 165, 233, 0.16)' : 'transparent',
                border: isActive ? '1px solid rgba(125, 211, 252, 0.36)' : '1px solid transparent',
                borderRadius: '13px',
                display: 'grid',
                gap: '8px',
                gridTemplateColumns: '22px 1fr',
                margin: isActive ? '-3px -5px' : '0',
                padding: isActive ? '3px 5px' : '0',
              }}
            >
              <div
                style={{
                  alignItems: 'center',
                  background: isActive ? 'rgba(34, 211, 238, 0.24)' : 'rgba(14, 165, 233, 0.16)',
                  border: isActive ? '1px solid rgba(103, 232, 249, 0.5)' : '1px solid rgba(125, 211, 252, 0.24)',
                  borderRadius: '999px',
                  color: isActive ? '#ecfeff' : '#bae6fd',
                  display: 'flex',
                  fontSize: '0.62rem',
                  fontWeight: 950,
                  height: '22px',
                  justifyContent: 'center',
                  lineHeight: 1,
                  width: '22px',
                }}
              >
                {index + 1}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    alignItems: 'center',
                    color: isActive ? '#ecfeff' : '#f8fafc',
                    display: 'flex',
                    fontSize: isTouchDevice ? '0.7rem' : '0.76rem',
                    fontWeight: 900,
                    gap: '6px',
                  }}
                >
                  {item.label}
                  {isActive ? (
                    <span
                      style={{
                        border: '1px solid rgba(103, 232, 249, 0.38)',
                        borderRadius: '999px',
                        color: '#67e8f9',
                        fontSize: '0.49rem',
                        fontWeight: 950,
                        letterSpacing: '0.1em',
                        padding: '2px 5px',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Active
                    </span>
                  ) : null}
                </div>
                <div style={{ color: isActive ? '#dff8ff' : '#cbd5e1', fontSize: isTouchDevice ? '0.62rem' : '0.66rem', fontWeight: 650, lineHeight: 1.28 }}>
                  {item.body}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: isTouchDevice ? '8px' : '10px', color: '#94a3b8', fontSize: '0.6rem', fontWeight: 800 }}>
        Preview mode - no live payments or lead capture yet
      </div>
    </aside>
  );
}
