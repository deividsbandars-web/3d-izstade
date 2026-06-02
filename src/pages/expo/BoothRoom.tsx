import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Link, Navigate, useParams } from 'react-router-dom';
import { loadExpoSceneForRelease } from '../../modules/expo/lib/sceneDataSource';
import { resolveSponsorRoomRecord, type SponsorRoomRecord } from '../../modules/expo/lib/sponsorRoom';
import { isPremiumStreamingTier } from '../../modules/expo/lib/sponsorBoothPresentation';
import type { ExpoSceneData } from '../../modules/expo/types/scene';

type RoomState =
  | { status: 'loading' }
  | { status: 'ready'; record: SponsorRoomRecord; scene: ExpoSceneData }
  | { status: 'missing' };

type ShowroomTier = 'elite' | 'premium' | 'standard' | 'support';

const TIER_LABELS: Record<ShowroomTier, string> = {
  elite: 'LANDMARK SPONSOR ROOM',
  premium: 'PREMIUM BOOTH SHOWROOM',
  standard: 'STANDARD BOOTH SHOWROOM',
  support: 'SPONSOR SHOWROOM',
};

const TIER_COPY: Record<ShowroomTier, { summary: string; values: string[] }> = {
  elite: {
    summary: 'High-visibility sponsor room for landmark packages, event inventory and sponsor reporting.',
    values: ['Hero sponsor presence', 'Demo Arena inventory', 'Monthly sponsor report'],
  },
  premium: {
    summary: 'Premium sponsor room focused on meetings, qualified leads and future AI-assisted diagnostics.',
    values: ['Meeting-ready package', 'Qualification preview', 'Lead report package'],
  },
  standard: {
    summary: 'Standard booth room for product profile, short pitch and sponsor interest collection.',
    values: ['Product story', 'Demo-ready screen', 'Package request'],
  },
  support: {
    summary: 'Compact sponsor room for product context and next-step package discovery.',
    values: ['Sponsor profile', 'Content screen', 'Contact-ready package'],
  },
};

function normalizeTier(value: SponsorRoomRecord['presentation']['adTier']): ShowroomTier {
  return value === 'elite' || value === 'premium' || value === 'standard' ? value : 'support';
}

function resolveAccent(tier: ShowroomTier) {
  if (tier === 'elite') return '#f59e0b';
  if (tier === 'premium') return '#38bdf8';
  if (tier === 'standard') return '#22c55e';
  return '#94a3b8';
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

function ShowroomScene({ accent, record, tier }: { accent: string; record: SponsorRoomRecord; tier: ShowroomTier }) {
  const tierLabel = TIER_LABELS[tier];
  const displayTitle = record.company.name || record.presentation.displayName || 'Sponsor Booth';
  const subtitle = record.presentation.tagline || TIER_COPY[tier].summary;

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
      <pointLight color={accent} intensity={26} position={[0, 4, 4]} />

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
          {tierLabel}
        </Text>
        <Text position={[0, 4.56, -1.6]} fontSize={0.82} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={8.8}>
          {displayTitle.toUpperCase()}
        </Text>
        <Text position={[0, 3.48, -1.58]} fontSize={0.34} color="#cbd5e1" anchorX="center" anchorY="middle" maxWidth={8.2} lineHeight={1.12}>
          {subtitle}
        </Text>
        <Text position={[0, 2.36, -1.56]} fontSize={0.28} color="#94a3b8" anchorX="center" anchorY="middle" maxWidth={8.2} lineHeight={1.36}>
          {TIER_COPY[tier].values.map((value) => `* ${value}`).join('\n')}
        </Text>
        {[-1, 1].map((side) => (
          <group key={`showroom-side-${side}`} position={[side * 6.6, 2.7, -0.7]}>
            <mesh castShadow>
              <boxGeometry args={[0.42, 5.2, 1.1]} />
              <meshStandardMaterial color="#102338" emissive={accent} emissiveIntensity={0.1} metalness={0.2} roughness={0.36} />
            </mesh>
            <mesh position={[0, 0, 0.6]}>
              <boxGeometry args={[0.14, 3.6, 0.08]} />
              <meshBasicMaterial color={accent} toneMapped={false} />
            </mesh>
          </group>
        ))}
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

function HighResUnrealViewerPanel({ accent, streamPath }: { accent: string; streamPath: string }) {
  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.13), rgba(15, 23, 42, 0.76))', border: `1px solid ${accent}66`, borderRadius: 22, boxShadow: `0 18px 48px ${accent}22`, padding: 18 }}>
      <div style={{ color: accent, fontSize: '0.74rem', fontWeight: 950, letterSpacing: '0.14em', marginBottom: 10, textTransform: 'uppercase' }}>
        Unreal product viewer
      </div>
      <h2 style={{ color: '#f8fafc', fontSize: '1.28rem', letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0 }}>
        High-res product statue mode
      </h2>
      <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.5, margin: '10px 0 14px' }}>
        Launch a premium Unreal stream for a detailed product pedestal view when a dedicated slot is available.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        <StaticPill>Pixel stream</StaticPill>
        <StaticPill>Product statue</StaticPill>
        <StaticPill>Premium slot</StaticPill>
      </div>
      <Link to={streamPath} style={{ background: accent, borderRadius: 999, color: '#06111d', display: 'inline-flex', fontSize: '0.88rem', fontWeight: 950, letterSpacing: '0.04em', padding: '12px 15px', textDecoration: 'none', textTransform: 'uppercase' }}>
        Open Unreal Viewer
      </Link>
      <p style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.45, margin: '12px 0 0' }}>
        If the stream is unavailable, this Web3D showroom remains the safe fallback.
      </p>
    </div>
  );
}

function LoadingRoom() {
  return (
    <div style={{ alignItems: 'center', background: '#050b14', color: '#f8fafc', display: 'flex', justifyContent: 'center', minHeight: '100vh' }}>
      Loading sponsor showroom...
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
      accent: resolveAccent(tier),
      copy: TIER_COPY[tier],
      tier,
      tierLabel: TIER_LABELS[tier],
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
  const roomSummary = record.presentation.tagline || roomModel.copy.summary;
  const canOpenHighResViewer = isPremiumStreamingTier(record.presentation.adTier);
  const highResViewerPath = record.presentation.demoRoomPath.endsWith('/stream')
    ? record.presentation.demoRoomPath
    : `${record.presentation.demoRoomPath.replace(/\/$/, '')}/stream`;
  const packageStatus = record.presentation.managedScreenContent?.status === 'published'
    ? 'Owner-managed screen content is published.'
    : 'Preview showroom - owner-managed content can be attached later.';

  return (
    <main style={{ background: 'radial-gradient(circle at 20% 8%, rgba(56, 189, 248, 0.16), transparent 32%), linear-gradient(135deg, #050b14 0%, #07111f 50%, #020617 100%)', color: '#f8fafc', minHeight: '100vh' }}>
      <section style={{ display: 'grid', gap: 0, gridTemplateColumns: 'minmax(0, 1.25fr) minmax(320px, 0.75fr)', minHeight: '100vh' }}>
        <div style={{ borderRight: '1px solid rgba(148, 163, 184, 0.12)', minHeight: 520 }}>
          <ShowroomScene accent={roomModel.accent} record={record} tier={roomModel.tier} />
        </div>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center', padding: 'clamp(22px, 4vw, 46px)' }}>
          <div>
            <div style={{ color: roomModel.accent, fontSize: '0.75rem', fontWeight: 950, letterSpacing: '0.16em', marginBottom: 10, textTransform: 'uppercase' }}>
              {roomModel.tierLabel}
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
              Sponsor value
            </div>
            {roomModel.copy.values.map((value) => (
              <div key={value} style={{ alignItems: 'center', background: 'rgba(15, 23, 42, 0.68)', border: '1px solid rgba(148, 163, 184, 0.14)', borderRadius: 16, display: 'flex', gap: 12, padding: '13px 14px' }}>
                <span style={{ background: roomModel.accent, borderRadius: 999, boxShadow: `0 0 18px ${roomModel.accent}55`, height: 9, width: 9 }} />
                <span style={{ color: '#e2e8f0', fontWeight: 800 }}>{value}</span>
              </div>
            ))}
          </div>

          {canOpenHighResViewer ? (
            <HighResUnrealViewerPanel accent={roomModel.accent} streamPath={highResViewerPath} />
          ) : null}

          <div style={{ background: 'rgba(2, 6, 23, 0.6)', border: '1px solid rgba(148, 163, 184, 0.14)', borderRadius: 22, padding: 18 }}>
            <div style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 900, letterSpacing: '0.12em', marginBottom: 12, textTransform: 'uppercase' }}>
              Next-step labels
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <StaticPill>Request demo</StaticPill>
              <StaticPill>View package</StaticPill>
              <StaticPill>Meet sponsor</StaticPill>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.86rem', lineHeight: 1.5, margin: '14px 0 0' }}>
              {packageStatus} No live forms, booking flow, AI agent or backend lead capture is active here.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link to="/expo-3d" style={{ background: roomModel.accent, borderRadius: 999, color: '#06111d', fontWeight: 950, padding: '13px 17px', textDecoration: 'none' }}>
              Back to Expo City
            </Link>
            <Link to="/expo-3d?salesDemo=1" style={{ border: '1px solid rgba(148, 163, 184, 0.28)', borderRadius: 999, color: '#f8fafc', fontWeight: 850, padding: '13px 17px', textDecoration: 'none' }}>
              Open Sales Demo
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
