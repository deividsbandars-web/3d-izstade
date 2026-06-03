import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import PixelStreamingViewer from '../../modules/expo/PixelStreamingViewer';
import { usePixelStreamingStatus } from '../../modules/expo/hooks/usePixelStreamingStatus';
import { loadExpoSceneForRelease } from '../../modules/expo/lib/sceneDataSource';
import { isPremiumStreamingTier } from '../../modules/expo/lib/sponsorBoothPresentation';
import { resolveSponsorRoomRecord, type SponsorRoomRecord } from '../../modules/expo/lib/sponsorRoom';
import { reservePixelStreamingSession, type PixelStreamingSessionReservationResponse } from '../../modules/expo/services/pixelStreamingConfig';
import { buildBoothStreamingLevel, withPreferredBoothSession } from '../../modules/expo/services/pixelStreamingBoothSession';

type StreamRoomState =
  | { status: 'loading' }
  | { status: 'ready'; record: SponsorRoomRecord }
  | { status: 'missing' };

type StreamLaunchPhase = 'loading_record' | 'launching' | 'pending' | 'reserved' | 'entering' | 'fallback';

const SESSION_RETRY_DELAY_MS = 3500;
const SESSION_MAX_ATTEMPTS = 4;
const RESERVED_TRANSITION_MS = 1200;
const EMPTY_PREFERRED_STREAMER_IDS: string[] = [];

export default function BoothStreamRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<StreamRoomState>({ status: 'loading' });
  const [sessionReservation, setSessionReservation] = useState<PixelStreamingSessionReservationResponse | null>(null);
  const [launchPhase, setLaunchPhase] = useState<StreamLaunchPhase>('loading_record');
  const [reservationAttempt, setReservationAttempt] = useState(0);
  const boothRecord = state.status === 'ready' ? state.record : null;
  const boothContextBoothId = boothRecord?.preferredStreamerIds[0] ?? boothRecord?.boothId ?? null;
  const boothContextSlugOrId = boothRecord?.slugOrId ?? null;
  const boothContextStreamingLevel = buildBoothStreamingLevel(boothContextBoothId) ?? boothRecord?.streamingLevel ?? null;
  const boothContext = useMemo(() => {
    if (boothContextBoothId === null || boothContextSlugOrId === null || boothContextStreamingLevel === null) {
      return undefined;
    }

    return {
      boothId: boothContextBoothId,
      slugOrId: boothContextSlugOrId,
      streamingLevel: boothContextStreamingLevel,
    };
  }, [boothContextBoothId, boothContextSlugOrId, boothContextStreamingLevel]);
  const { availability, config, runtimeStatus } = usePixelStreamingStatus({
    boothContext,
    shouldProbe: true,
  });
  const preferredStreamerIds = boothRecord?.preferredStreamerIds ?? EMPTY_PREFERRED_STREAMER_IDS;
  const reservedRuntimeStatus = sessionReservation?.runtimeStatus ?? runtimeStatus;
  const boothRuntimeStatus = useMemo(
    () => withPreferredBoothSession(reservedRuntimeStatus, preferredStreamerIds),
    [preferredStreamerIds, reservedRuntimeStatus],
  );

  useEffect(() => {
    let active = true;

    loadExpoSceneForRelease()
      .then((scene) => {
        const record = resolveSponsorRoomRecord(scene, id);
        if (!active) return;
        if (!record) {
          setState({ status: 'missing' });
          return;
        }
        setState({ status: 'ready', record });
        setLaunchPhase('launching');
        setReservationAttempt(0);
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

  useEffect(() => {
    let active = true;
    let retryTimer: number | null = null;
    let reservedTimer: number | null = null;

    if (state.status !== 'ready') {
      return () => {
        active = false;
      };
    }

    const reservationSessionId = `booth-stream-${boothContextBoothId || state.record.boothId || state.record.slugOrId}`;
    reservePixelStreamingSession(config, {
      boothId: boothContextBoothId,
      slug: boothContextSlugOrId,
      streamingLevel: boothContextStreamingLevel,
      sessionId: reservationSessionId,
      allowSharedFallback: true,
    })
      .then((reservation) => {
        if (!active) return;
        setSessionReservation(reservation);
        if (reservation.status === 'ready') {
          setLaunchPhase('reserved');
          reservedTimer = window.setTimeout(() => {
            if (!active) return;
            setLaunchPhase('entering');
          }, RESERVED_TRANSITION_MS);
          return;
        }

        if (reservationAttempt + 1 < SESSION_MAX_ATTEMPTS) {
          setLaunchPhase('pending');
          retryTimer = window.setTimeout(() => {
            if (!active) return;
            setLaunchPhase('launching');
            setReservationAttempt((current) => current + 1);
          }, SESSION_RETRY_DELAY_MS);
          return;
        }

        setLaunchPhase('fallback');
      })
      .catch(() => {
        if (!active) return;
        setSessionReservation(null);
        setLaunchPhase('fallback');
      });

    return () => {
      active = false;
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }
      if (reservedTimer !== null) {
        window.clearTimeout(reservedTimer);
      }
    };
  }, [boothContextBoothId, boothContextSlugOrId, boothContextStreamingLevel, config, reservationAttempt, state]);

  if (state.status === 'loading') {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#020617', color: '#f8fafc' }}>Launching premium room...</div>;
  }

  if (state.status === 'missing') {
    return <Navigate to="/expo-3d" replace />;
  }

  const { record } = state;
  const effectiveAvailability = sessionReservation?.status === 'ready' && availability === 'available' ? 'available' : 'degraded';

  if (!isPremiumStreamingTier(record.presentation.adTier)) {
    return <Navigate to={`/expo/booth/${record.slugOrId}`} replace />;
  }

  if (launchPhase !== 'entering' || effectiveAvailability !== 'available') {
    const statusCopy = launchPhase === 'launching'
      ? 'Launching premium room...'
      : launchPhase === 'pending'
        ? 'Premium slot pending. Retrying reservation...'
        : launchPhase === 'reserved'
          ? 'Premium slot reserved. Preparing stream...'
        : launchPhase === 'fallback'
          ? 'Premium slot unavailable right now.'
          : 'Preparing premium handoff...';
    const descriptionCopy = launchPhase === 'launching'
      ? 'We are requesting a dedicated Unreal stream for this booth.'
      : launchPhase === 'pending'
        ? 'This booth stream is not free yet. The broker is retrying automatically before falling back.'
        : launchPhase === 'reserved'
          ? 'Your dedicated Unreal slot is reserved. We are handing off into the premium stream now.'
        : 'Continue in the Web3D showroom now, then retry premium streaming when a slot is ready.';

    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#020617', color: '#f8fafc', padding: '32px' }}>
        <div style={{ maxWidth: '680px', width: '100%', borderRadius: '22px', border: '1px solid rgba(148,163,184,0.18)', background: 'linear-gradient(180deg, rgba(15,23,42,0.92), rgba(2,6,23,0.96))', padding: '26px' }}>
          <div style={{ color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: '0.78rem', fontWeight: 900 }}>Premium Unreal Handoff</div>
          <h1 style={{ margin: '10px 0 12px', fontSize: '2rem' }}>{record.company.name}</h1>
          <p style={{ margin: '0 0 18px', color: '#cbd5e1' }}>
            {descriptionCopy}
          </p>
          <div style={{ marginBottom: '18px', padding: '14px 16px', borderRadius: '16px', background: 'rgba(15, 118, 110, 0.14)', border: '1px solid rgba(45, 212, 191, 0.2)', color: '#ccfbf1', fontWeight: 800 }}>
            {statusCopy}
          </div>
          <div style={{ display: 'grid', gap: '8px', marginBottom: '20px', color: '#94a3b8', fontSize: '0.95rem' }}>
            <div>Availability: {effectiveAvailability}</div>
            <div>Signaling: {boothRuntimeStatus?.signaling ?? 'unknown'}</div>
            <div>Streamer: {boothRuntimeStatus?.streamer ?? 'unknown'}</div>
            <div>Session: {boothRuntimeStatus?.readiness ?? 'unknown'}</div>
            <div>Reservation: {launchPhase === 'reserved' || launchPhase === 'entering' ? 'reserved' : sessionReservation?.status ?? 'not requested yet'}</div>
            <div>Preferred stream: {preferredStreamerIds[0] ?? 'not mapped'}</div>
            <div>Reserved stream: {sessionReservation?.streamerId ?? 'not reserved'}</div>
            <div>Attempt: {reservationAttempt + 1} / {SESSION_MAX_ATTEMPTS}</div>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {launchPhase === 'fallback' && (
              <button
                type="button"
                onClick={() => {
                  setSessionReservation(null);
                  setReservationAttempt(0);
                  setLaunchPhase('launching');
                }}
                style={{ padding: '14px 18px', borderRadius: '999px', border: 'none', background: '#f59e0b', color: '#1f1302', fontWeight: 900, cursor: 'pointer' }}
              >
                Retry Premium Stream
              </button>
            )}
            <button type="button" onClick={() => navigate(`/expo/booth/${record.slugOrId}`)} style={{ padding: '14px 18px', borderRadius: '999px', border: 'none', background: '#38bdf8', color: '#08111c', fontWeight: 900, cursor: 'pointer' }}>
              Continue in Web3D Showroom
            </button>
            <Link to="/expo-3d" style={{ padding: '14px 18px', borderRadius: '999px', border: '1px solid rgba(148,163,184,0.24)', color: '#f8fafc', textDecoration: 'none', fontWeight: 800 }}>
              Back to boulevard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <PixelStreamingViewer
        availability={effectiveAvailability}
        config={config}
        preferredStreamerIds={preferredStreamerIds}
        runtimeStatus={boothRuntimeStatus}
        onClose={() => navigate(`/expo/booth/${record.slugOrId}`)}
      />
    </div>
  );
}
