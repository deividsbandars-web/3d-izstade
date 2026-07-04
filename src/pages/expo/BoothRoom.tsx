import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { loadExpoSceneForRelease } from '../../modules/expo/lib/sceneDataSource';
import { buildSponsorRoomActions, resolveSponsorRoomRecord, type SponsorRoomRecord } from '../../modules/expo/lib/sponsorRoom';
import type { ExpoSceneData } from '../../modules/expo/types/scene';

type RoomState =
  | { status: 'loading' }
  | { status: 'ready'; record: SponsorRoomRecord; scene: ExpoSceneData }
  | { status: 'missing' };

type BoothProfileTier = 'elite' | 'premium' | 'standard' | 'support';

const TIER_LABELS: Record<BoothProfileTier, string> = {
  elite: 'FEATURED SPONSOR',
  premium: 'PREMIUM BOOTH',
  standard: 'SPONSOR BOOTH',
  support: 'SPONSOR PROFILE',
};

const TIER_COLOR: Record<BoothProfileTier, string> = {
  elite: '#f59e0b',
  premium: '#38bdf8',
  standard: '#22c55e',
  support: '#94a3b8',
};

const TIER_POINTS: Record<BoothProfileTier, string[]> = {
  elite: ['High-visibility sponsor presence', 'Public booth profile', 'Sponsor contact path'],
  premium: ['Premium sponsor presence', 'Contact sponsor', 'Media-ready screen'],
  standard: ['Sponsor offer', 'Contact team', 'Request info'],
  support: ['Public profile', 'Contact team', 'Return to expo'],
};

function normalizeTier(value: SponsorRoomRecord['presentation']['adTier']): BoothProfileTier {
  return value === 'elite' || value === 'premium' || value === 'standard' ? value : 'support';
}

function useSponsorRoomState(id: string | undefined) {
  const [state, setState] = useState<RoomState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    loadExpoSceneForRelease()
      .then((scene) => {
        const record = resolveSponsorRoomRecord(scene, id);
        if (!active) return;
        setState(record ? { status: 'ready', record, scene } : { status: 'missing' });
      })
      .catch(() => {
        if (active) {
          setState({ status: 'missing' });
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  return state;
}

function BoothScene({ accent, record, tier }: { accent: string; record: SponsorRoomRecord; tier: BoothProfileTier }) {
  const displayTitle = record.company.name || record.presentation.displayName || 'Sponsor Booth';
  const subtitle = record.presentation.tagline || 'Open the booth profile to view sponsor information and the current public-facing materials.';

  return (
    <Canvas
      camera={{ fov: 42, position: [0, 6.8, 18] }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ height: '100%', minHeight: 420 }}
    >
      <color attach="background" args={['#050b14']} />
      <ambientLight intensity={0.72} />
      <directionalLight intensity={1.2} position={[6, 9, 8]} />
      <pointLight color={accent} intensity={24} position={[0, 4, 4]} />

      <group position={[0, -0.8, 0]}>
        <mesh position={[0, 0, 0]} receiveShadow>
          <boxGeometry args={[14, 0.22, 8]} />
          <meshStandardMaterial color="#101827" emissive={accent} emissiveIntensity={0.035} metalness={0.14} roughness={0.58} />
        </mesh>
        <mesh position={[0, 0.16, 2.7]}>
          <boxGeometry args={[8.4, 0.08, 0.42]} />
          <meshBasicMaterial color={accent} toneMapped={false} />
        </mesh>
        <mesh position={[0, 4.15, -2.1]} castShadow>
          <boxGeometry args={[11.6, 6.4, 0.42]} />
          <meshStandardMaterial color="#0c1b2e" emissive={accent} emissiveIntensity={0.08} metalness={0.16} roughness={0.42} />
        </mesh>
        <mesh position={[0, 4.15, -1.84]}>
          <planeGeometry args={[10.4, 5.46]} />
          <meshBasicMaterial color="#07111f" />
        </mesh>
        <Text position={[0, 5.62, -1.62]} fontSize={0.54} color={accent} anchorX="center" anchorY="middle" maxWidth={8.6}>
          {TIER_LABELS[tier]}
        </Text>
        <Text position={[0, 4.56, -1.6]} fontSize={0.82} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={8.8}>
          {displayTitle.toUpperCase()}
        </Text>
        <Text position={[0, 3.48, -1.58]} fontSize={0.34} color="#cbd5e1" anchorX="center" anchorY="middle" maxWidth={8.2} lineHeight={1.12}>
          {subtitle}
        </Text>
        <Text position={[0, 2.36, -1.56]} fontSize={0.28} color="#94a3b8" anchorX="center" anchorY="middle" maxWidth={8.2} lineHeight={1.36}>
          {TIER_POINTS[tier].map((value) => `* ${value}`).join('\n')}
        </Text>
      </group>
    </Canvas>
  );
}

function StaticPill({ children }: { children: string }) {
  return (
    <span style={{ border: '1px solid rgba(148, 163, 184, 0.24)', borderRadius: 999, color: '#e2e8f0', display: 'inline-flex', fontSize: '0.78rem', fontWeight: 900, letterSpacing: '0.08em', padding: '9px 12px', textTransform: 'uppercase' }}>
      {children}
    </span>
  );
}

function BoothActionLinks({ record }: { record: SponsorRoomRecord }) {
  const { brochureAction, primaryActions } = buildSponsorRoomActions(record);
  const navigate = useNavigate();

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {brochureAction ? (
        <a
          href={brochureAction.intent?.type === 'external' ? brochureAction.intent.target : '#'}
          target={brochureAction.intent?.type === 'external' ? '_blank' : undefined}
          rel={brochureAction.intent?.type === 'external' ? 'noreferrer' : undefined}
          style={{ ...buttonStyle('#38bdf8'), textDecoration: 'none' }}
        >
          View sponsor profile
        </a>
      ) : null}

      {primaryActions.map(({ action, intent }) => {
        if (intent?.type === 'external') {
          return (
            <a
              key={`${action.kind}-${action.label}`}
              href={intent.target}
              target="_blank"
              rel="noreferrer"
              style={{ ...buttonStyle('#0ea5e9'), textDecoration: 'none' }}
            >
              {action.label}
            </a>
          );
        }

        if (intent?.type === 'navigate') {
          return (
            <Link
              key={`${action.kind}-${action.label}`}
              to={intent.target}
              style={{ ...buttonStyle('#0f172a'), textDecoration: 'none', color: '#e2e8f0' }}
            >
              {action.label}
            </Link>
          );
        }

        if (intent?.type === 'local' && intent.target === 'global_chat') {
          return (
            <button key={`${action.kind}-${action.label}`} type="button" onClick={() => navigate('/expo-3d?salesDemo=1')} style={buttonStyle('#0f172a')}>
              {action.label}
            </button>
          );
        }

        return null;
      })}

      <Link to="/expo/sponsor-packages" style={{ ...buttonStyle('#111827'), textDecoration: 'none', color: '#e2e8f0' }}>
        Buy / rent booth
      </Link>
      <Link to="/expo-3d" style={{ ...buttonStyle('#111827'), textDecoration: 'none', color: '#e2e8f0' }}>
        Walk expo city
      </Link>
    </div>
  );
}

function buttonStyle(background: string) {
  return {
    alignItems: 'center',
    background,
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: 14,
    color: '#f8fafc',
    cursor: 'pointer',
    display: 'inline-flex',
    fontSize: '0.92rem',
    fontWeight: 900,
    justifyContent: 'center',
    letterSpacing: '0.02em',
    minHeight: 46,
    padding: '12px 16px',
    textTransform: 'uppercase' as const,
  };
}

function LoadingRoom() {
  return (
    <div style={{ alignItems: 'center', background: '#050b14', color: '#f8fafc', display: 'flex', justifyContent: 'center', minHeight: '100vh' }}>
      Loading booth profile...
    </div>
  );
}

export default function BoothRoom() {
  const { id } = useParams<{ id: string }>();
  const state = useSponsorRoomState(id);

  const roomModel = useMemo(() => {
    if (state.status !== 'ready') {
      return null;
    }

    const tier = normalizeTier(state.record.presentation.adTier);
    return {
      accent: TIER_COLOR[tier],
      tier,
    };
  }, [state]);

  if (state.status === 'loading') {
    return <LoadingRoom />;
  }

  if (state.status === 'missing' || !roomModel) {
    return <Navigate to="/expo-3d" replace />;
  }

  const { record } = state;
  const displayTitle = record.company.name || record.presentation.displayName || 'Sponsor Booth';
  const roomSummary = record.presentation.tagline || 'Open the booth profile to view the sponsor summary and current public details.';
  const hasInteractiveRoom = Boolean(record.presentation.managedScreenContent || record.presentation.videoUrl || record.presentation.customInsertUrl);
  const roomStatus = hasInteractiveRoom
    ? 'This booth has sponsor media and contact actions attached.'
    : 'This sponsor profile is ready for contact. Richer media can be added from the sponsor setup flow.';

  return (
    <main style={{ background: 'radial-gradient(circle at 20% 8%, rgba(56, 189, 248, 0.16), transparent 32%), linear-gradient(135deg, #050b14 0%, #07111f 50%, #020617 100%)', color: '#f8fafc', minHeight: '100vh' }}>
      <section style={{ display: 'grid', gap: 0, gridTemplateColumns: 'minmax(0, 1.25fr) minmax(320px, 0.75fr)', minHeight: '100vh' }}>
        <div style={{ borderRight: '1px solid rgba(148, 163, 184, 0.12)', minHeight: 520 }}>
          <BoothScene accent={roomModel.accent} record={record} tier={roomModel.tier} />
        </div>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center', padding: 'clamp(22px, 4vw, 46px)' }}>
          <div>
            <div style={{ color: roomModel.accent, fontSize: '0.75rem', fontWeight: 950, letterSpacing: '0.16em', marginBottom: 10, textTransform: 'uppercase' }}>
              {TIER_LABELS[roomModel.tier]}
            </div>
            <h1 style={{ fontSize: 'clamp(2.1rem, 5vw, 4.6rem)', letterSpacing: '-0.06em', lineHeight: 0.92, margin: 0 }}>
              {displayTitle}
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.6, margin: '18px 0 0', maxWidth: 520 }}>
              {roomSummary}
            </p>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ color: roomModel.accent, fontSize: '0.74rem', fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Contact options
            </div>
            <BoothActionLinks record={record} />
          </div>

          <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(148, 163, 184, 0.14)', borderRadius: 22, padding: 18 }}>
            <div style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 900, letterSpacing: '0.12em', marginBottom: 12, textTransform: 'uppercase' }}>
              Sponsor content
            </div>
            <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.55, margin: 0 }}>
              {roomStatus}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              <StaticPill>Sponsor profile</StaticPill>
              <StaticPill>Contact sponsor</StaticPill>
              <StaticPill>Package setup</StaticPill>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ color: roomModel.accent, fontSize: '0.74rem', fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Available surfaces
            </div>
            {record.presentation.actions.map((action) => (
              <div key={`${action.kind}-${action.label}`} style={{ alignItems: 'center', background: 'rgba(15, 23, 42, 0.68)', border: '1px solid rgba(148, 163, 184, 0.14)', borderRadius: 16, display: 'flex', gap: 12, padding: '13px 14px' }}>
                <span style={{ background: roomModel.accent, borderRadius: 999, boxShadow: `0 0 18px ${roomModel.accent}55`, height: 9, width: 9 }} />
                <span style={{ color: '#e2e8f0', fontWeight: 800 }}>{action.label}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
