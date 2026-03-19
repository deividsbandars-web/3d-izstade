'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Config, PixelStreaming } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.7';

interface Props {
  initialStreamerId?: string;
  signalingUrl: string;
}

export const PixelStreamingViewer: React.FC<Props> = ({ initialStreamerId, signalingUrl }) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const psRef = useRef<PixelStreaming | null>(null);
  const [streamerId, setStreamerId] = useState(initialStreamerId);

  useEffect(() => {
    if (!videoContainerRef.current) return;

    const config = new Config({
      useFrontendSignallingServer: true,
      initialSettings: {
        SignallingServerUrl: signalingUrl,
        StreamerId: initialStreamerId,
        WebRTCFPS: 60,
        IceServers: JSON.parse(
          process.env.NEXT_PUBLIC_ICE_SERVERS || '[]'
        ),
      } as any
    });

    const ps = new PixelStreaming(config);
    psRef.current = ps;

    videoContainerRef.current.appendChild(ps.videoElement);

    // Listen for streamer list changes
    ps.addEventListener('streamerListChanged', (event: any) => {
      console.log('Streamer list changed:', event.detail.streamerList);
      if (!streamerId && event.detail.streamerList.length > 0) {
        setStreamerId(event.detail.streamerList[0]);
      }
    });

    // Handle UI Interactions (e.g. BOOTH_ENTER)
    ps.addResponseEventListener('handle_responses', (data: string) => {
        try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'BOOTH_ENTER') {
                trackEvent('BOOTH_ENTER', parsed.sponsorId);
            }
        } catch (e) {
            console.error('Failed to parse UE interaction', e);
        }
    });

    ps.connect();

    return () => {
      ps.disconnect();
      if (videoContainerRef.current && ps.videoElement) {
        videoContainerRef.current.removeChild(ps.videoElement);
      }
    };
  }, [signalingUrl, initialStreamerId]);

  const trackEvent = async (type: string, sponsorId: string) => {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'anonymous', // Should be from auth
        payload: { type, sponsorId }
      })
    });
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <div ref={videoContainerRef} className="w-full h-full" />
      {!streamerId && (
        <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50">
          Waiting for streamer...
        </div>
      )}
    </div>
  );
};
