import React, { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { sanitizeExpoBackdropCityScene, type ExpoBackdropStrategy } from '../../../lib/backdropSanitization';
import { EXPO_FEATURE_FLAGS } from '../../../state/expoRuntime';
import { usePlayerColliderRegistration } from '../WorldSceneSupport';
import { setWorldSceneUserData } from '../scene/worldSceneUserData';

class SceneErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) {
      console.error('Expo world asset loading failed. Falling back to safe city scaffold.', error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function FallbackCityScaffold({ label }: { label: string }) {
  const fallbackRef = useRef<THREE.Group>(null);
  const fallbackBlocks = useMemo(() => (
    Array.from({ length: 14 }, (_, index) => {
      const column = index % 4;
      const row = Math.floor(index / 4);
      const x = (column - 1.5) * 26;
      const z = -40 - row * 28;
      const height = 8 + ((index % 5) * 4);

      return {
        id: `fallback-block-${index}`,
        position: [x, height / 2, z] as [number, number, number],
        size: [10, height, 10] as [number, number, number],
      };
    })
  ), []);
  usePlayerColliderRegistration(fallbackRef, 'fallback-city');

  return (
    <group ref={fallbackRef}>
      {fallbackBlocks.map((block) => (
        <mesh key={block.id} position={block.position} castShadow>
          <boxGeometry args={block.size} />
          <meshStandardMaterial color="#1e293b" metalness={0.15} roughness={0.8} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -70]}>
        <planeGeometry args={[180, 180]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <Text position={[0, 14, 20]} fontSize={3} color="#38bdf8" anchorX="center" anchorY="middle">
        WEB3D FALLBACK CITY
      </Text>
      <Text position={[0, 10, 20]} maxWidth={60} fontSize={1.1} color="#e2e8f0" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  );
}

const DISABLE_PLAYER_COLLISION_FLAG = 'disablePlayerCollision';

function markScenicNonColliding(root: THREE.Object3D) {
  root.userData.sceneLayerRole = 'scenic-non-colliding';
  root.traverse((child) => {
    child.userData.sceneLayerRole = 'scenic-non-colliding';
    child.userData[DISABLE_PLAYER_COLLISION_FLAG] = true;
  });
}

export function PrimitiveCityModel({
  debug = false,
  strategy,
}: {
  debug?: boolean;
  strategy: ExpoBackdropStrategy;
}) {
  const { scene } = useThree();
  const { scene: loadedCityScene } = useGLTF('/models/realistic_city.glb');
  const cityRoot = useMemo(() => {
    const clone = loadedCityScene.clone(true);
    markScenicNonColliding(clone);
    const sanitized = sanitizeExpoBackdropCityScene(clone, strategy);
    clone.userData.expoBackdropStrategy = strategy;
    clone.userData.expoBackdropBounds = sanitized;

    return clone;
  }, [loadedCityScene, strategy]);

  useEffect(() => {
    if (debug && EXPO_FEATURE_FLAGS.enableSceneGlobalsDebug) {
      (window as { scene?: THREE.Scene }).scene = scene;
      return () => {
        if ((window as { scene?: THREE.Scene }).scene === scene) {
          delete (window as { scene?: THREE.Scene }).scene;
        }
      };
    }

    if ((window as { scene?: THREE.Scene }).scene === scene) {
      delete (window as { scene?: THREE.Scene }).scene;
    }
  }, [debug, scene]);

  useEffect(() => {
    if (!cityRoot) {
      return;
    }

    const bounds = new THREE.Box3().setFromObject(cityRoot);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    setWorldSceneUserData(scene, 'cityAssetPipeline', {
      mode: 'sanitized-city-shell',
      source: '/models/realistic_city.glb',
      bounds: {
        center: center.toArray(),
        size: size.toArray(),
      },
      strategy: {
        cityShellOffsetY: strategy.cityShellOffsetY,
        cityShellOffsetZ: strategy.cityShellOffsetZ,
        cityShellOpacity: strategy.cityShellOpacity,
        cityShellTargetSpan: strategy.cityShellTargetSpan,
        skylineDensity: strategy.skylineDensity,
      },
    });
  }, [cityRoot, scene, strategy]);

  return (
    <>
      {debug && (
        <>
          <gridHelper args={[500, 50, '#ff0000', '#444444']} position={[0, 0.05, 0]} />
          <axesHelper args={[100]} position={[0, 0.1, 0]} />
        </>
      )}

      <SceneErrorBoundary fallback={<FallbackCityScaffold label="Static city failed to load. Switched to safe fallback city mode." />}>
        <primitive object={cityRoot} />
      </SceneErrorBoundary>
    </>
  );
}
