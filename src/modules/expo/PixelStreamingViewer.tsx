import { useEffect, useRef, useState } from 'react';
import { Config, PixelStreaming } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.7';

interface PixelStreamingViewerProps {
    initialSignalingServerUrl?: string;
    onClose?: () => void;
}

export default function PixelStreamingViewer({ 
    initialSignalingServerUrl,
    onClose
}: PixelStreamingViewerProps) {
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [status, setStatus] = useState('Gatavojas savienojumam...');
    const [availableStreamers, setAvailableStreamers] = useState<string[]>([]);
    const psRef = useRef<PixelStreaming | null>(null);

    // Vienmēr izmantojam lokālo tīklu šim projektam
    // Pārlūkprogrammai (spēlētājam) ir jāslēdzas caur proxy (portu 80), nevis tieši pie streamer porta 8888
    const url = initialSignalingServerUrl || `ws://${window.location.host}/ws/`;

    useEffect(() => {
        if (!videoContainerRef.current) return;

        // 1. DROŠA KONFIGURĀCIJA
        const config = new Config({
            initialSettings: {
                ss: url,
                AutoPlayVideo: true,
                AutoConnect: true, // Ļaujam bibliotēkai pašai savienoties, tagad kad maršruts ir pareizs
                StartVideoMuted: true,
            } as any
        });

        // 2. Instance
        const ps = new PixelStreaming(config, {
            videoElementParent: videoContainerRef.current
        });
        psRef.current = ps;

        // 3. Notikumi
        ps.addEventListener('webRtcConnected', () => {
            setIsConnected(true);
            setStatus('Pieslēgts!');
        });

        ps.addEventListener('webRtcDisconnected', () => {
            setIsConnected(false);
            setStatus('Atvienots.');
        });

        // 4. KLAUSĀMIES SERVERI, LAI IZVĒLĒTOS STREAMER
        const onStreamerList = (event: any) => {
            const ids = event.streamers || (event.data && event.data.messageStreamerList && event.data.messageStreamerList.ids) || [];
            console.log("Saņemts saraksts:", ids);
            setAvailableStreamers(ids);
            if (ids.length > 0) {
                setStatus(`Atrasti ${ids.length} kanāli. Gaida tavu klikšķi!`);
            } else {
                setStatus('Gaidu Unreal Engine (Streamer nav atrasts)...');
            }
        };

        // Dažādām versijām ir dažādi notikumu nosaukumi
        // @ts-ignore
        ps.addEventListener('streamerListMessage', onStreamerList);
        try {
            // @ts-ignore
            ps.addEventListener('streamerListChanged', onStreamerList);
        } catch (e) {
            // ignore
        }

        return () => {
            ps.disconnect();
            psRef.current = null;
        };
    }, [url]);

    const handleConnect = (streamerId: string) => {
        if (!psRef.current) return;
        setStatus(`Pieslēdzos pie ${streamerId}...`);
        
        // Bibliotēkas 5.7 versijā "StreamerId" iestatīšana automātiski nosūta "subscribe" ziņu
        // serverim un sāk WebRTC rokasspiedienu. Mums nav jāsauc ne connect(), ne play().
        // @ts-ignore
        psRef.current.config.setOptionSettingValue('StreamerId', streamerId);
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#000', overflow: 'hidden' }}>
            <div ref={videoContainerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />

            {!isConnected && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'rgba(0,0,0,0.8)', zIndex: 50 }}>
                    <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <h2 style={{ margin: '0 0 10px 0' }}>{status}</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Serveris: {url}</p>
                    
                    {availableStreamers.length > 0 && (
                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            {availableStreamers.map(id => (
                                <button 
                                    key={id} 
                                    onClick={() => handleConnect(id)} 
                                    style={{ padding: '10px 20px', background: '#3b82f6', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    Palaist: {id}
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
