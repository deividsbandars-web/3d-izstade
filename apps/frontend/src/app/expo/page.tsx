'use client';

import React, { useEffect, useState } from 'react';
import { PixelStreamingViewer } from '@/components/PixelStreamingViewer';

export default function ExpoPage() {
  const [matchId, setMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const matchmake = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/matchmake');
        if (!res.ok) throw new Error('Matchmaking failed');
        const data = await res.json();
        setMatchId(data.instanceId);
      } catch (err: any) {
        setError(err.message);
      }
    };

    matchmake();
  }, []);

  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!matchId) return <div className="p-8">Searching for available instance...</div>;

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 bg-gray-900 text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">Warpala 3D Expo</h1>
        <div className="text-sm">Instance: {matchId}</div>
      </header>
      <main className="flex-1 bg-black">
        <PixelStreamingViewer 
          signalingUrl="ws://localhost:8888" 
          initialStreamerId={matchId} 
        />
      </main>
    </div>
  );
}
