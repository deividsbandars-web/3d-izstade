import { useCallback, useEffect, useRef, useState } from 'react';
import { Config, PixelStreaming } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.7';
import { reportExpoDevError } from './lib/devErrorReporter';
import { EXPO_MODE_COPY } from './state/expoRuntime';
import type { PixelStreamingAvailability, PixelStreamingRuntimeConfig, PixelStreamingRuntimeStatus } from './services/pixelStreamingConfig';

interface PixelStreamingViewerProps {
    config: PixelStreamingRuntimeConfig;
    availability: PixelStreamingAvailability;
    preferredStreamerIds?: string[];
    runtimeStatus: PixelStreamingRuntimeStatus | null;
    onClose?: () => void;
}

function normalizeStreamerId(value: string) {
    return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function PixelStreamingViewer({ 
    config,
    availability,
    preferredStreamerIds = [],
    runtimeStatus,
    onClose
}: PixelStreamingViewerProps) {
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [status, setStatus] = useState<string>(EXPO_MODE_COPY.premiumViewerConnecting);
    const [availableStreamers, setAvailableStreamers] = useState<string[]>([]);
    const psRef = useRef<PixelStreaming | null>(null);
    const requestedStreamerIdRef = useRef<string | null>(null);
    const signalingUrl = config.signalingUrl ?? 'Not configured';
    const activeStreamerId = runtimeStatus?.session.activeStreamerId ?? null;
    const runtimeSignaling = runtimeStatus?.signaling ?? null;

    const handleConnect = useCallback((streamerId: string) => {
        if (!psRef.current) return;
        const normalizedStreamerId = normalizeStreamerId(streamerId);
        if (!normalizedStreamerId || requestedStreamerIdRef.current === normalizedStreamerId) return;
        requestedStreamerIdRef.current = normalizedStreamerId;
        setStatus(EXPO_MODE_COPY.premiumViewerConnectTo.replace('{streamerId}', streamerId));
        psRef.current.config.setOptionSettingValue('StreamerId', streamerId);
    }, []);

    useEffect(() => {
        let isActive = true;

        if (!videoContainerRef.current || availability !== 'available') {
            queueMicrotask(() => {
                if (!isActive) return;
                setIsConnected(false);
                setAvailableStreamers([]);
                setStatus(
                    availability === 'unavailable'
                        ? EXPO_MODE_COPY.premiumViewerUnavailable
                        : availability === 'degraded'
                            ? EXPO_MODE_COPY.premiumViewerDegraded
                        : EXPO_MODE_COPY.premiumViewerConnecting
                );
            });
            return () => {
                isActive = false;
            };
        }

        requestedStreamerIdRef.current = activeStreamerId ? normalizeStreamerId(activeStreamerId) : null;

        const pixelStreamingConfig = new Config({
            initialSettings: {
                ss: signalingUrl,
                AutoPlayVideo: true,
                AutoConnect: true,
                StartVideoMuted: true,
                IceServers: config.iceServers,
                StreamerId: activeStreamerId || undefined,
            } as any
        });

        const ps = new PixelStreaming(pixelStreamingConfig, {
            videoElementParent: videoContainerRef.current
        });
        psRef.current = ps;
        queueMicrotask(() => {
            if (!isActive) return;
            setStatus(EXPO_MODE_COPY.premiumViewerDiscovering);
        });

        ps.addEventListener('webRtcConnected', () => {
            setIsConnected(true);
            setStatus(EXPO_MODE_COPY.premiumViewerConnected);
        });

        ps.addEventListener('webRtcDisconnected', () => {
            setIsConnected(false);
            setStatus(EXPO_MODE_COPY.premiumViewerDisconnected);
        });

        const onStreamerList = (event: any) => {
            const rawIds = event.streamers || (event.data && event.data.messageStreamerList && event.data.messageStreamerList.ids) || [];
            const ids = Array.isArray(rawIds) ? rawIds.filter((value): value is string => typeof value === 'string') : [];
            console.log("Saņemts saraksts:", ids);
            setAvailableStreamers(ids);
            if (ids.length > 0) {
                setStatus(EXPO_MODE_COPY.premiumViewerSelectStreamer.replace('{count}', String(ids.length)));
                const normalizedIds = new Map(ids.map((id) => [normalizeStreamerId(id), id] as const));
                const preferredId = preferredStreamerIds
                    .map((id) => normalizedIds.get(normalizeStreamerId(id)) || null)
                    .find((id) => Boolean(id));

                if (preferredId) {
                    handleConnect(preferredId);
                } else if (activeStreamerId && ids.includes(activeStreamerId)) {
                    handleConnect(activeStreamerId);
                }
            } else {
                setStatus(
                    runtimeSignaling === 'signaling_up'
                        ? EXPO_MODE_COPY.premiumViewerGatewayOnly
                        : EXPO_MODE_COPY.premiumViewerDiscovering
                );
            }
        };

        ps.addEventListener('streamerListMessage', onStreamerList);
        try {
            // @ts-expect-error library event map is narrower than runtime events we receive from signaling
            ps.addEventListener('streamerListChanged', onStreamerList);
        } catch (error) {
            reportExpoDevError('PixelStreamingViewer.streamerListChanged', error, {
                signalingUrl,
            });
        }

        return () => {
            isActive = false;
            ps.disconnect();
            psRef.current = null;
            requestedStreamerIdRef.current = null;
        };
    }, [availability, signalingUrl, config.iceServers, preferredStreamerIds, activeStreamerId, runtimeSignaling, handleConnect]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#000', overflow: 'hidden' }}>
            <div ref={videoContainerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />

            {!isConnected && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'rgba(0,0,0,0.8)', zIndex: 50 }}>
                    <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <h2 style={{ margin: '0 0 10px 0' }}>{status}</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Serveris: {signalingUrl}</p>
                    {activeStreamerId && (
                        <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                            Active streamer: {activeStreamerId}
                        </p>
                    )}
                    {(availability === 'unavailable' || availability === 'degraded') && (
                        <p style={{ color: '#fca5a5', fontSize: '0.95rem', maxWidth: '520px', textAlign: 'center' }}>
                            {availability === 'degraded'
                                ? EXPO_MODE_COPY.premiumViewerDegraded
                                : runtimeSignaling === 'signaling_up' && runtimeStatus?.streamer !== 'streamer_available'
                                ? EXPO_MODE_COPY.premiumViewerGatewayOnly
                                : EXPO_MODE_COPY.premiumViewerFallback}
                        </p>
                    )}
                    
                    {availability === 'available' && availableStreamers.length > 0 && (
                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            {availableStreamers.map(id => (
                                <button 
                                    key={id} 
                                    onClick={() => handleConnect(id)} 
                                    style={{ padding: '10px 20px', background: '#3b82f6', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    {EXPO_MODE_COPY.premiumViewerLaunch.replace('{streamerId}', id)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <button onClick={onClose} style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 100, padding: '10px 20px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                ← ATPAKAĻ
            </button>
        </div>
    );
}
