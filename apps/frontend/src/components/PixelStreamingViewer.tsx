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

  async function trackEvent(type: string, sponsorId: string) {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'anonymous', // Should be from auth
        payload: { type, sponsorId }
      })
    });
  }

  useEffect(() => {
    const videoContainer = videoContainerRef.current;
    if (!videoContainer) return;

    const config = new Config({
      initialSettings: {
        SignallingServerUrl: signalingUrl,
        StreamerId: initialStreamerId,
        WebRTCFPS: 60,
        IceServers: JSON.parse(
          process.env.NEXT_PUBLIC_ICE_SERVERS || '[]'
        ),
      } as any
    } as any);

    const ps = new PixelStreaming(config);
    psRef.current = ps;
    const psAny = ps as any;

    videoContainer.appendChild(psAny.videoElement);

    // Listen for streamer list changes
    psAny.addEventListener('streamerListChanged', (event: any) => {
      console.log('Streamer list changed:', event.detail.streamerList);
      if (event.detail.streamerList.length > 0) {
        setStreamerId((current) => current ?? event.detail.streamerList[0]);
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
      if (psAny.videoElement && videoContainer.contains(psAny.videoElement)) {
        videoContainer.removeChild(psAny.videoElement);
      }
    };
  }, [signalingUrl, initialStreamerId]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <div ref={videoContainerRef} className="w-full h-full" />
      {!streamerId && (
        <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50">
          Waiting for streamer on secondary demo flow...
        </div>
      )}
    </div>
  );
};
