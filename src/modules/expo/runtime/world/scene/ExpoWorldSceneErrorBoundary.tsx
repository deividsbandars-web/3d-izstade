import type { ReactNode } from 'react';
import React from 'react';

type ExpoWorldSceneErrorBoundaryState = {
  error: Error | null;
};

export class ExpoWorldSceneErrorBoundary extends React.Component<
  { children: ReactNode; label?: string },
  ExpoWorldSceneErrorBoundaryState
> {
  state: ExpoWorldSceneErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const message = this.state.error?.message ?? 'Unknown error';

    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 1900, display: 'grid', placeItems: 'center', padding: '28px', background: 'radial-gradient(circle at 30% 20%, rgba(148, 163, 184, 0.16), rgba(0,0,0,0.92))', color: '#e2e8f0' }}>
        <div style={{ maxWidth: '720px', width: '100%', borderRadius: '18px', border: '1px solid rgba(248, 113, 113, 0.32)', background: 'rgba(15, 23, 42, 0.72)', padding: '18px 20px', boxShadow: '0 18px 52px rgba(2, 6, 23, 0.55)' }}>
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.18em', fontWeight: 900, color: '#fda4af' }}>
            WEB3D SCENE ERROR{this.props.label ? `: ${this.props.label}` : ''}
          </div>
          <div style={{ marginTop: '10px', fontWeight: 800, fontSize: '1.05rem' }}>
            Scene failed to render.
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.9rem', lineHeight: 1.5, color: '#cbd5e1' }}>
            {message}
          </div>
          <div style={{ marginTop: '14px', fontSize: '0.86rem', lineHeight: 1.5, color: '#94a3b8' }}>
            Try: reload the page, enable browser hardware acceleration, or switch browser/device. If this persists, open DevTools Console and look for <span style={{ color: '#e2e8f0', fontWeight: 800 }}>[ExpoDevError]</span>.
          </div>
        </div>
      </div>
    );
  }
}

