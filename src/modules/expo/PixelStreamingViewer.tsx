import { useEffect, useRef, useState } from 'react';
import { Config, PixelStreaming } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.5';

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

    useEffect(() => {
        if (!videoContainerRef.current) return;

        // 1. Konfigurējam savienojumu (Signaling Server URL)
        const config = new Config({
            initialSettings: {
                ss: 'ws://127.0.0.1:80',
                AutoPlayVideo: true,
                AutoConnect: true,
                StartVideoMuted: true,
                HoveringMouse: true,
                WebRTCFPS: 60,
            } as any
        });

        // 2. Izveidojam Pixel Streaming instanci
        const ps = new PixelStreaming(config, {
            videoElementParent: videoContainerRef.current
        });
        
        // Klausāmies notikumus
        ps.addEventListener('webRtcConnected', () => setIsConnected(true));
        ps.addEventListener('webRtcDisconnected', () => setIsConnected(false));

        return () => {
            ps.disconnect();
        };
    }, [initialSignalingServerUrl]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#000' }}>
            {/* Šeit iekšā Epic Games spraudnis ievietos <video> tagu ar spēli */}
            <div ref={videoContainerRef} style={{ width: '100%', height: '100%' }} />

            {/* UI Pārklājums (Overlays) */}
            {!isConnected && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', textAlign: 'center' }}>
                    <div className="spinner" style={{ marginBottom: '20px' }}></div>
                    <h2>Savienojas ar Warpala Unreal Engine Serveri...</h2>
                    <p style={{ color: '#94a3b8' }}>Pārliecinies, ka Unreal Engine ir ieslēgts "Pixel Streaming" režīmā un Signaling Serveris darbojas uz {initialSignalingServerUrl}</p>
                </div>
            )}

            {/* Izejas poga */}
            <button 
                onClick={onClose}
                style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 100, padding: '10px 20px', background: 'rgba(239, 68, 68, 0.8)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
                ← Aizvērt Unreal Straumi
            </button>
        </div>
    );
}