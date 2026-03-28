import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { ExpoQualityPreset } from '../state/expoRuntime';

declare global {
  interface Window {
    __WARPALA_EXPO_EVIDENCE__?: {
      activeZoneId: string | null;
      averageFps: number;
      frameSamples: number;
      fps1Low: number;
      heapLimitBytes: number | null;
      heapUsedBytes: number | null;
      mode: string;
      playerPosition: [number, number, number];
      qualityPreset: ExpoQualityPreset;
      sceneVersion: string | null;
      sectorCount: number;
      sponsorCount: number;
      timestamp: string;
      uptimeMs: number;
    };
  }

  interface Performance {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  }
}

function percentile(values: number[], ratio: number) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.min(sorted.length - 1, Math.floor(sorted.length * ratio)));
  return sorted[index];
}

export function ExpoEvidenceProbe({
  activeZoneId,
  mode,
  playerPosition,
  qualityPreset,
  sceneVersion,
  sectorCount,
  sponsorCount,
}: {
  activeZoneId: string | null;
  mode: string;
  playerPosition: [number, number, number];
  qualityPreset: ExpoQualityPreset;
  sceneVersion: string | null;
  sectorCount: number;
  sponsorCount: number;
}) {
  const startedAt = useRef(performance.now());
  const fpsSamplesRef = useRef<number[]>([]);
  const frameCountRef = useRef(0);

  useFrame((_, delta) => {
    const fps = delta > 0 ? 1 / delta : 0;
    if (fps > 0 && Number.isFinite(fps)) {
      fpsSamplesRef.current.push(fps);
      if (fpsSamplesRef.current.length > 240) {
        fpsSamplesRef.current.shift();
      }
      frameCountRef.current += 1;
    }

    const samples = fpsSamplesRef.current;
    const averageFps = samples.length > 0
      ? samples.reduce((sum, value) => sum + value, 0) / samples.length
      : 0;
    const fps1Low = percentile(samples, 0.01);
    const memory = performance.memory;

    window.__WARPALA_EXPO_EVIDENCE__ = {
      activeZoneId,
      averageFps: Number(averageFps.toFixed(2)),
      frameSamples: frameCountRef.current,
      fps1Low: Number(fps1Low.toFixed(2)),
      heapLimitBytes: memory?.jsHeapSizeLimit ?? null,
      heapUsedBytes: memory?.usedJSHeapSize ?? null,
      mode,
      playerPosition,
      qualityPreset,
      sceneVersion,
      sectorCount,
      sponsorCount,
      timestamp: new Date().toISOString(),
      uptimeMs: Number((performance.now() - startedAt.current).toFixed(0)),
    };
  });

  useEffect(() => {
    return () => {
      delete window.__WARPALA_EXPO_EVIDENCE__;
    };
  }, []);

  return null;
}
