'use client';

import React from 'react';
import { PixelStreamingViewer } from '@/components/PixelStreamingViewer';

export default function ExpoPage() {
  const signalingUrl =
    process.env.NEXT_PUBLIC_SIGNALING_URL ||
    `${typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws'}://${typeof window !== 'undefined' ? window.location.host : 'localhost'}/ws/`;

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 bg-gray-900 text-white flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Warpala 3D Expo Demo</h1>
          <p className="text-xs text-gray-400">Secondary flow. Canonical expo runtime lives in the root Vite SPA.</p>
          <p className="text-xs text-gray-500">This demo now relies on streamer discovery instead of a separate matchmaking endpoint.</p>
        </div>
        <div className="text-sm">Mode: Discovery</div>
      </header>
      <main className="flex-1 bg-black">
        <PixelStreamingViewer 
          signalingUrl={signalingUrl}
        />
      </main>
    </div>
  );
}
