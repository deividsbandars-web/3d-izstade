import { useGLTF } from '@react-three/drei';

const RELEASE_FALLBACK_MODEL_URL = '/models/construction_assets.glb';

export function useModelLoader(url: string | null | undefined) {
  // Always call the hook unconditionally to satisfy React Rules of Hooks
  const safeUrl = url || RELEASE_FALLBACK_MODEL_URL;
  const gltf = useGLTF(safeUrl);
  
  // If no URL was provided, return null to signal the component to use primitive fallbacks
  if (!url) return { scene: null };
  
  return gltf;
}
