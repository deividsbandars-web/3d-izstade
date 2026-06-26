import { Suspense, lazy, useLayoutEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { buildCanonicalModularHomeStudioSearchParams } from '../../modules/expo/runtime/modularHome/modularHomeShareUrl';

const Expo3D = lazy(() => import('../../modules/expo/Expo3D'));

function buildStudioSearch(search: string) {
  const params = new URLSearchParams(search);
  const view = params.get('view') === 'interior' ? 'interior' : 'exterior';
  const canonicalParams = buildCanonicalModularHomeStudioSearchParams(view);

  if (params.get('qa3d') === '1') {
    canonicalParams.set('qa3d', '1');
  }

  return `?${canonicalParams.toString()}`;
}

export default function ModularHomeStudioPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentViewMode = useMemo(() => new URLSearchParams(location.search).get('view'), [location.search]);
  const targetSearch = useMemo(() => buildStudioSearch(location.search), [location.search]);
  const isReady = location.search === targetSearch;

  useLayoutEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(location.search).get('qa3d') === '1') {
      window.sessionStorage.setItem('warpala:qa3d', '1');
    }

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
  }, [isReady, location.pathname, location.search, navigate, targetSearch]);

  if (!isReady) {
    return null;
  }

  return (
    <div style={{ background: '#020617', height: '100vh', overflow: 'hidden', position: 'relative', width: '100%' }}>
      <div
        style={{
          display: 'grid',
          gap: '5px',
          left: '14px',
          maxWidth: 'min(256px, calc(100vw - 20px))',
          position: 'fixed',
          top: '14px',
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
            gap: '5px',
            padding: '10px 11px',
          }}
        >
          <div style={{ color: '#7dd3fc', fontSize: '0.56rem', fontWeight: 950, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Modular Home Studio
          </div>
          <div style={{ color: '#f8fafc', fontSize: '0.8rem', fontWeight: 900, lineHeight: 1.12 }}>
            {currentViewMode === 'interior' ? 'Modular home walk-in start' : 'Unified modular home showroom'}
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '0.6rem', fontWeight: 700, lineHeight: 1.3 }}>
            {currentViewMode === 'interior'
              ? 'This route only seeds an interior start position. The house scene is shared.'
              : 'This route opens the same walkable house scene with an exterior start position.'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <Link
              to="/expo-3d"
              style={{
                background: 'rgba(125, 211, 252, 0.12)',
                border: '1px solid rgba(125, 211, 252, 0.22)',
                borderRadius: '999px',
                color: '#bae6fd',
                fontSize: '0.68rem',
                fontWeight: 850,
                padding: '7px 10px',
                textDecoration: 'none',
              }}
            >
              Return to expo
            </Link>
            <Link
              to="/modular-homes/quotes"
              style={{
                background: 'rgba(251, 191, 36, 0.12)',
                border: '1px solid rgba(251, 191, 36, 0.22)',
                borderRadius: '999px',
                color: '#fde68a',
                fontSize: '0.68rem',
                fontWeight: 850,
                padding: '7px 10px',
                textDecoration: 'none',
              }}
            >
              Quote Review
            </Link>
            <Link
              to={currentViewMode === 'interior' ? '/modular-homes/studio?view=exterior' : '/modular-homes/studio?view=interior'}
              style={{
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.22)',
                borderRadius: '999px',
                color: '#bbf7d0',
                fontSize: '0.68rem',
                fontWeight: 850,
                padding: '7px 10px',
                textDecoration: 'none',
              }}
            >
              {currentViewMode === 'interior' ? 'Start outside' : 'Start inside'}
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
