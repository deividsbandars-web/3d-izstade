import { useEffect, useRef, useState } from 'react';
import { Config, PixelStreaming } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.7';

interface PixelStreamingViewerProps {
    initialSignalingServerUrl?: string;
    onClose?: () => void;
}

export default function PixelStreamingViewer({ 
    initialSignalingServerUrl = 'ws://127.0.0.1:80',
    onClose
}: PixelStreamingViewerProps) {
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [availableStreamers, setAvailableStreamers] = useState<string[]>([]);
    const [status, setStatus] = useState('Savienojas...');
    const psRef = useRef<PixelStreaming | null>(null);

    useEffect(() => {
        if (!videoContainerRef.current) return;

        // 1. Konfigurācija (UE 5.7+ Pixel Streaming 2)
        const config = new Config({
            initialSettings: {
                ss: initialSignalingServerUrl,
                AutoPlayVideo: true,
                AutoConnect: true,
                StartVideoMuted: true,
                HoveringMouse: true,
            } as any
        });

        // 2. Instance
        const ps = new PixelStreaming(config, {
            videoElementParent: videoContainerRef.current
        });
        psRef.current = ps;

        // 3. Notikumi
        ps.addEventListener('webRtcConnected', () => {
            console.log("WebRTC Savienots!");
            setIsConnected(true);
            setStatus('Pieslēgts!');
        });

        ps.addEventListener('webRtcDisconnected', () => {
            setIsConnected(false);
            setStatus('Atvienots.');
        });

        // Mēģinām abus eventus savietojamībai
        const onStreamerList = (event: any) => {
            const ids = event.streamers || (event.data && event.data.messageStreamerList && event.data.messageStreamerList.ids) || [];
            console.log("Saņemts saraksts:", ids);
            setAvailableStreamers(ids);
            if (ids.length > 0) {
                const target = ids.find((id: string) => id.includes('Default')) || ids[0];
                ps.config.setOptionSettingValue('StreamerId', target);
                ps.connect();
            }
        };

        // @ts-ignore - Dažām bibliotēkas versijām ir streamerListMessage, citām streamerListChanged
        ps.addEventListener('streamerListMessage', onStreamerList);
        
        try {
            // @ts-ignore
            ps.addEventListener('streamerListChanged', onStreamerList);
        } catch (e) {
            // Ignorējam ja neeksistē tips
        }

        // Drošības pēc - ja pēc 5 sekundēm nav saraksta, mēģinām parasto connect
        const timer = setTimeout(() => {
            if (!isConnected) {
                console.log("Mēģinu piespiedu savienojumu...");
                ps.connect();
            }
        }, 5000);

        return () => {
            clearTimeout(timer);
            ps.disconnect();
            psRef.current = null;
        };
    }, [initialSignalingServerUrl]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#000', overflow: 'hidden' }}>
            {/* Video konteineris */}
            <div ref={videoContainerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />

            {/* Overlays */}
            {!isConnected && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'rgba(0,0,0,0.8)', zIndex: 50 }}>
                    <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    
                    <h2 style={{ margin: '0 0 10px 0' }}>{status}</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Serveris: {initialSignalingServerUrl}</p>
                    
                    {availableStreamers.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <p style={{ marginBottom: '10px' }}>Izvēlies kanālu:</p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {availableStreamers.map(id => (
                                    <button key={id} onClick={() => {
                                        psRef.current?.config.setOptionSettingValue('StreamerId', id);
                                        psRef.current?.connect();
                                    }} style={{ padding: '10px 20px', background: '#3b82f6', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                                        {id}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={() => psRef.current?.connect()}
                        style={{ marginTop: '30px', padding: '12px 24px', background: 'transparent', border: '2px solid white', color: 'white', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        Mēģināt vēlreiz (Force Start)
                    </button>
                </div>
            )}

            {/* Aizvērt pogu mēs vienmēr rādām virspusē */}
            <button 
                onClick={onClose}
                style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 100, padding: '10px 20px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
            >
                ← ATPAKAĻ UZ IZVĒLNI
            </button>
        </div>
    );
}
