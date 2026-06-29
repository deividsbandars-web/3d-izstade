import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type WebGLUnsupportedProps = {
  quotePanel?: ReactNode;
  reason?: string | null;
  routeLabel: string;
  variant?: 'expo' | 'modular-home';
};

export function WebGLUnsupported({
  quotePanel,
  reason,
  routeLabel,
  variant = 'expo',
}: WebGLUnsupportedProps) {
  const hasQuotePanel = Boolean(quotePanel);
  const quoteHref = hasQuotePanel ? '#fallback-quote' : '/modular-homes/studio?homeStudio=1#fallback-quote';

  return (
    <main
      aria-label={`${routeLabel} WebGL fallback`}
      data-webgl-unsupported="true"
      data-webgl-unsupported-route={variant}
      style={{
        background: 'radial-gradient(circle at 18% 12%, rgba(45, 212, 191, 0.2), transparent 30%), linear-gradient(160deg, #020617 0%, #082f49 58%, #020617 100%)',
        color: '#e2e8f0',
        minHeight: '100dvh',
        overflowY: 'auto',
        padding: 'clamp(18px, 4vw, 42px)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gap: '18px',
          margin: '0 auto',
          maxWidth: hasQuotePanel ? '980px' : '720px',
          width: '100%',
        }}
      >
        <section
          style={{
            background: 'rgba(15, 23, 42, 0.82)',
            border: '1px solid rgba(125, 211, 252, 0.24)',
            borderRadius: '18px',
            boxShadow: '0 24px 80px rgba(2, 6, 23, 0.46)',
            display: 'grid',
            gap: '14px',
            padding: 'clamp(18px, 4vw, 28px)',
          }}
        >
          <div style={{ color: '#7dd3fc', fontSize: '0.72rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {routeLabel}
          </div>
          <h1 style={{ color: '#f8fafc', fontSize: 'clamp(1.55rem, 4vw, 2.7rem)', lineHeight: 1.04, margin: 0 }}>
            3D preview is unavailable on this device.
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.55, margin: 0, maxWidth: '64ch' }}>
            {reason || 'The browser could not create a WebGL context.'} You can still request a modular home quote without loading the 3D scene.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <a
              data-webgl-unsupported-quote-cta="true"
              href={quoteHref}
              style={{
                background: 'linear-gradient(135deg, #facc15, #22c55e)',
                borderRadius: '999px',
                color: '#111827',
                fontSize: '0.9rem',
                fontWeight: 950,
                padding: '11px 15px',
                textDecoration: 'none',
              }}
            >
              Request a quote
            </a>
            <button
              type="button"
              data-webgl-unsupported-retry="true"
              onClick={() => window.location.reload()}
              style={{
                background: 'rgba(15, 23, 42, 0.68)',
                border: '1px solid rgba(125, 211, 252, 0.28)',
                borderRadius: '999px',
                color: '#bae6fd',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: '0.9rem',
                fontWeight: 900,
                padding: '10px 15px',
              }}
            >
              Retry 3D
            </button>
            <Link
              data-webgl-unsupported-home-cta="true"
              to="/"
              style={{
                background: 'rgba(15, 23, 42, 0.48)',
                border: '1px solid rgba(148, 163, 184, 0.22)',
                borderRadius: '999px',
                color: '#cbd5e1',
                fontSize: '0.9rem',
                fontWeight: 850,
                padding: '10px 15px',
                textDecoration: 'none',
              }}
            >
              Home
            </Link>
          </div>
        </section>

        {quotePanel ? (
          <section
            id="fallback-quote"
            data-webgl-unsupported-quote-panel="true"
            style={{
              background: 'rgba(2, 6, 23, 0.56)',
              border: '1px solid rgba(45, 212, 191, 0.22)',
              borderRadius: '18px',
              padding: 'clamp(12px, 3vw, 18px)',
            }}
          >
            {quotePanel}
          </section>
        ) : null}
      </div>
    </main>
  );
}
