import { Suspense, lazy, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Expo3D = lazy(() => import('../../modules/expo/Expo3D'));

function buildStudioSearch(search: string) {
  const params = new URLSearchParams(search);
  params.set('homeStudio', '1');

  if (!params.has('homeDemo') && params.get('demo') !== 'homes') {
    params.set('homeDemo', '1');
  }

  return `?${params.toString()}`;
}

export default function ModularHomeStudioPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const targetSearch = useMemo(() => buildStudioSearch(location.search), [location.search]);
  const isReady = location.search === targetSearch;

  useEffect(() => {
    if (isReady) {
      return;
    }

    navigate(
      {
        pathname: location.pathname,
        search: targetSearch,
      },
      { replace: true },
    );
  }, [isReady, location.pathname, navigate, targetSearch]);

  if (!isReady) {
    return null;
  }

  return (
    <div style={{ background: '#020617', height: '100vh', overflow: 'hidden', position: 'relative', width: '100%' }}>
      <div
        style={{
          display: 'grid',
          gap: '8px',
          left: '16px',
          maxWidth: 'min(360px, calc(100vw - 32px))',
          position: 'fixed',
          top: '16px',
          zIndex: 2200,
        }}
      >
        <div
          style={{
            backdropFilter: 'blur(14px)',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.78))',
            border: '1px solid rgba(125, 211, 252, 0.18)',
            borderRadius: '18px',
            boxShadow: '0 18px 48px rgba(2, 6, 23, 0.44)',
            color: '#e2e8f0',
            display: 'grid',
            gap: '8px',
            padding: '14px 15px',
          }}
        >
          <div style={{ color: '#7dd3fc', fontSize: '0.66rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Modular Home Studio
          </div>
          <div style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 900, lineHeight: 1.15 }}>
            Dedicated modular home presentation shell
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.4 }}>
            Direct home configurator view with the Expo HUD stripped back. Existing <code>?homeDemo=1</code> preview still works unchanged.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <Link
              to="/expo-3d?homeDemo=1"
              style={{
                background: 'rgba(125, 211, 252, 0.12)',
                border: '1px solid rgba(125, 211, 252, 0.22)',
                borderRadius: '999px',
                color: '#bae6fd',
                fontSize: '0.72rem',
                fontWeight: 850,
                padding: '8px 11px',
                textDecoration: 'none',
              }}
            >
              Open Expo View
            </Link>
            <Link
              to="/modular-homes/quotes"
              style={{
                background: 'rgba(251, 191, 36, 0.12)',
                border: '1px solid rgba(251, 191, 36, 0.22)',
                borderRadius: '999px',
                color: '#fde68a',
                fontSize: '0.72rem',
                fontWeight: 850,
                padding: '8px 11px',
                textDecoration: 'none',
              }}
            >
              Quote Review
            </Link>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <Expo3D />
      </Suspense>
    </div>
  );
}
