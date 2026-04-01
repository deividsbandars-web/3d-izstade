import { useEffect, useRef, useState } from 'react';
import { Config, PixelStreaming } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.7';
import { reportExpoDevError } from './lib/devErrorReporter';
import { EXPO_MODE_COPY } from './state/expoRuntime';
import type { PixelStreamingAvailability, PixelStreamingRuntimeConfig, PixelStreamingRuntimeStatus } from './services/pixelStreamingConfig';

interface PixelStreamingViewerProps {
    config: PixelStreamingRuntimeConfig;
    availability: PixelStreamingAvailability;
    runtimeStatus: PixelStreamingRuntimeStatus | null;
    onClose?: () => void;
}

export default function PixelStreamingViewer({ 
    config,
    availability,
    runtimeStatus,
    onClose
}: PixelStreamingViewerProps) {
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [status, setStatus] = useState<string>(EXPO_MODE_COPY.premiumViewerConnecting);
    const [availableStreamers, setAvailableStreamers] = useState<string[]>([]);
    const psRef = useRef<PixelStreaming | null>(null);
    const signalingUrl = config.signalingUrl ?? 'Not configured';

    function handleConnect(streamerId: string) {
        if (!psRef.current) return;
        setStatus(EXPO_MODE_COPY.premiumViewerConnectTo.replace('{streamerId}', streamerId));
        psRef.current.config.setOptionSettingValue('StreamerId', streamerId);
    }

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

        const pixelStreamingConfig = new Config({
            initialSettings: {
                ss: signalingUrl,
                AutoPlayVideo: true,
                AutoConnect: true,
                StartVideoMuted: true,
                IceServers: config.iceServers,
                StreamerId: runtimeStatus?.session.activeStreamerId || undefined,
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
            const ids = event.streamers || (event.data && event.data.messageStreamerList && event.data.messageStreamerList.ids) || [];
            console.log("Saņemts saraksts:", ids);
            setAvailableStreamers(ids);
            if (ids.length > 0) {
                setStatus(EXPO_MODE_COPY.premiumViewerSelectStreamer.replace('{count}', String(ids.length)));
                if (runtimeStatus?.session.activeStreamerId && ids.includes(runtimeStatus.session.activeStreamerId)) {
                    handleConnect(runtimeStatus.session.activeStreamerId);
                }
            } else {
                setStatus(
                    runtimeStatus?.signaling === 'signaling_up'
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
        };
    }, [availability, signalingUrl, config.iceServers, runtimeStatus]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#000', overflow: 'hidden' }}>
            <div ref={videoContainerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />

            {!isConnected && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'rgba(0,0,0,0.8)', zIndex: 50 }}>
                    <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <h2 style={{ margin: '0 0 10px 0' }}>{status}</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Serveris: {signalingUrl}</p>
                    {runtimeStatus?.session.activeStreamerId && (
                        <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                            Active streamer: {runtimeStatus.session.activeStreamerId}
                        </p>
                    )}
                    {(availability === 'unavailable' || availability === 'degraded') && (
                        <p style={{ color: '#fca5a5', fontSize: '0.95rem', maxWidth: '520px', textAlign: 'center' }}>
                            {availability === 'degraded'
                                ? EXPO_MODE_COPY.premiumViewerDegraded
                                : runtimeStatus?.signaling === 'signaling_up' && runtimeStatus?.streamer !== 'streamer_available'
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
