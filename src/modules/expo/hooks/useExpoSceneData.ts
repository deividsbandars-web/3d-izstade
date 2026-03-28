import { useEffect, useState } from 'react';
import { loadExpoSceneForRelease } from '../lib/sceneDataSource';
import type { ExpoSceneData } from '../types/scene';

export function useExpoSceneData() {
  const [data, setData] = useState<ExpoSceneData>({
    authPolicy: undefined,
    cityInfo: null,
    companies: [],
    generatedAt: null,
    releaseMode: 'sponsor-boulevard',
    sceneVersion: 'expo-scene-backend-unavailable',
    sectors: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadData() {
      try {
        const scene = await loadExpoSceneForRelease();
        if (isActive) {
          setData(scene);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isActive = false;
    };
  }, []);

  return {
    data,
    isLoading,
  };
}
