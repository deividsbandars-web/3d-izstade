import React, { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

type RouteErrorBoundaryProps = {
  children: ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
  label: string;
};

type RouteErrorBoundaryState = {
  error: Error | null;
};

type RouteErrorBoundaryInnerProps = RouteErrorBoundaryProps & {
  resetKey: string;
};

class RouteErrorBoundaryInner extends React.Component<RouteErrorBoundaryInnerProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(previousProps: RouteErrorBoundaryInnerProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const message = this.state.error.message || 'The page could not load.';

    return (
      <main
        aria-label={`${this.props.label} recovery`}
        data-route-error-boundary="true"
        data-route-error-boundary-label={this.props.label}
        style={{
          alignItems: 'center',
          background: 'radial-gradient(circle at 28% 18%, rgba(14, 165, 233, 0.18), transparent 34%), #020617',
          color: '#e2e8f0',
          display: 'grid',
          minHeight: '100dvh',
          padding: '24px',
        }}
      >
        <section
          style={{
            background: 'rgba(15, 23, 42, 0.82)',
            border: '1px solid rgba(125, 211, 252, 0.22)',
            borderRadius: '18px',
            boxShadow: '0 24px 80px rgba(2, 6, 23, 0.48)',
            display: 'grid',
            gap: '14px',
            margin: '0 auto',
            maxWidth: '680px',
            padding: '22px',
            width: 'min(100%, 680px)',
          }}
        >
          <div style={{ color: '#7dd3fc', fontSize: '0.72rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            {this.props.label}
          </div>
          <h1 style={{ color: '#f8fafc', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', lineHeight: 1.05, margin: 0 }}>
            This page did not load cleanly.
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.55, margin: 0 }}>
            Reload the page. If it keeps failing, continue with the quote path and we can follow up without the 3D view.
          </p>
          <p
            data-route-error-boundary-message="true"
            style={{
              background: 'rgba(127, 29, 29, 0.28)',
              border: '1px solid rgba(248, 113, 113, 0.24)',
              borderRadius: '12px',
              color: '#fecaca',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.78rem',
              lineHeight: 1.45,
              margin: 0,
              overflowWrap: 'anywhere',
              padding: '10px 11px',
            }}
          >
            {message}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button
              type="button"
              data-route-error-boundary-reload="true"
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #facc15, #22c55e)',
                border: 'none',
                borderRadius: '999px',
                color: '#111827',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: '0.86rem',
                fontWeight: 950,
                padding: '10px 14px',
              }}
            >
              Reload
            </button>
            {this.props.ctaHref && this.props.ctaLabel ? (
              <Link
                data-route-error-boundary-cta="true"
                to={this.props.ctaHref}
                style={{
                  background: 'rgba(15, 23, 42, 0.72)',
                  border: '1px solid rgba(125, 211, 252, 0.28)',
                  borderRadius: '999px',
                  color: '#bae6fd',
                  fontSize: '0.86rem',
                  fontWeight: 900,
                  padding: '10px 14px',
                  textDecoration: 'none',
                }}
              >
                {this.props.ctaLabel}
              </Link>
            ) : null}
          </div>
        </section>
      </main>
    );
  }
}

export function RouteLoadingFallback({ label = 'Loading' }: { label?: string }) {
  return (
    <main
      aria-label={label}
      data-route-loading-fallback="true"
      style={{
        alignItems: 'center',
        background: '#020617',
        color: '#e2e8f0',
        display: 'grid',
        minHeight: '100dvh',
        padding: '24px',
        placeItems: 'center',
      }}
    >
      <div style={{ color: '#7dd3fc', fontSize: '0.78rem', fontWeight: 950, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        {label}
      </div>
    </main>
  );
}

export function RouteErrorBoundary(props: RouteErrorBoundaryProps) {
  const location = useLocation();
  const resetKey = `${location.pathname}${location.search}${location.hash}`;

  return <RouteErrorBoundaryInner {...props} resetKey={resetKey} />;
}
