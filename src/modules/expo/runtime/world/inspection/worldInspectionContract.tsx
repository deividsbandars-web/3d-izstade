import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldInspectionPublisher } from './worldInspectionState';

export function WorldSceneBridge({
  sceneKey,
  startViewKey,
  startView,
  setSceneUserData,
}: {
  sceneKey: string;
  startViewKey: string;
  startView: unknown;
  setSceneUserData: (scene: THREE.Scene, key: string, value: unknown) => void;
}) {
  const { scene } = useThree();
  const inspection = useWorldInspectionPublisher();

  useEffect(() => {
    setSceneUserData(scene, startViewKey, startView);
    setSceneUserData(scene, 'expoCollisionPolicy', {
      containment: 'walk-regions + intentional booth blockers',
      gameplayCritical: ['district-booth-collider'],
      scenicNonColliding: ['realistic_city.glb', 'curated-skyline-ring', 'expo-landmark-layer', 'district-anchor-nodes'],
    });
    inspection.setSceneRef(scene);

    return () => {
      inspection.setSceneRef(null);
    };
  }, [inspection, scene, sceneKey, setSceneUserData, startView, startViewKey]);

  return null;
}

export function CenterScreenInspector({ inspectionEnabled }: { inspectionEnabled: boolean }) {
  const { camera, scene } = useThree();
  const inspection = useWorldInspectionPublisher();
  const raycasterRef = useRef(new THREE.Raycaster());
  const directionRef = useRef(new THREE.Vector2(0, 0));
  const frameRef = useRef(0);

  useFrame(() => {
    if (!inspectionEnabled) {
      return;
    }

    frameRef.current += 1;
    if (frameRef.current % 8 !== 0) {
      return;
    }

    raycasterRef.current.setFromCamera(directionRef.current, camera);
    const intersections = raycasterRef.current.intersectObjects(scene.children, true);
    const hit = intersections.find((entry) => {
      let current: THREE.Object3D | null = entry.object;
      while (current) {
        if (current.name && current.name.includes(':')) {
          return true;
        }
        current = current.parent;
      }
      return false;
    });

    if (!hit) {
      inspection.setCenterSelection(null, []);
      return;
    }

    const centerStack = intersections
      .map((entry) => {
        let current: THREE.Object3D | null = entry.object;
        while (current) {
          if (current.name && current.name.includes(':')) {
            return current.name;
          }
          current = current.parent;
        }
        return null;
      })
      .filter((value): value is string => Boolean(value))
      .filter((value, index, array) => array.indexOf(value) === index)
      .slice(0, 5);

    inspection.setCenterSelection(centerStack[0] ?? null, centerStack);
  });

  return null;
}

export function ClickInspector({ clickInspectionEnabled }: { clickInspectionEnabled: boolean }) {
  const { camera, gl, scene } = useThree();
  const inspection = useWorldInspectionPublisher();
  const raycasterRef = useRef(new THREE.Raycaster());

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!clickInspectionEnabled) {
        return;
      }

      const rect = gl.domElement.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        return;
      }

      const ndc = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -(((event.clientY - rect.top) / rect.height) * 2 - 1),
      );

      raycasterRef.current.setFromCamera(ndc, camera);
      const intersections = raycasterRef.current.intersectObjects(scene.children, true);
      const clickStack = intersections
        .map((entry) => {
          let current: THREE.Object3D | null = entry.object;
          while (current) {
            if (current.name && current.name.includes(':')) {
              return current.name;
            }
            current = current.parent;
          }
          return null;
        })
        .filter((value): value is string => Boolean(value))
        .filter((value, index, array) => array.indexOf(value) === index)
        .slice(0, 5);

      if (clickStack.length === 0) {
        inspection.setClickSelection(null, []);
        return;
      }
      inspection.setClickSelection(clickStack[0] ?? null, clickStack);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [camera, clickInspectionEnabled, gl, inspection, scene]);

  return null;
}

export function TargetBasketHighlighter({ targets }: { targets: string[] }) {
  const { scene } = useThree();

  useEffect(() => {
    const originals = new Map<THREE.Material, { emissive?: THREE.Color; emissiveIntensity?: number }>();
    const activeTargets = new Set(targets);

    const highlightMaterial = (material: THREE.Material) => {
      const emissiveMaterial = material as THREE.MeshStandardMaterial;
      if (!('emissive' in emissiveMaterial)) {
        return;
      }
      if (!originals.has(material)) {
        originals.set(material, {
          emissive: emissiveMaterial.emissive?.clone?.(),
          emissiveIntensity: emissiveMaterial.emissiveIntensity,
        });
      }
      emissiveMaterial.emissive = new THREE.Color('#ff3b30');
      emissiveMaterial.emissiveIntensity = Math.max(emissiveMaterial.emissiveIntensity || 0, 0.8);
    };

    scene.traverse((object) => {
      let current: THREE.Object3D | null = object;
      let matched = false;
      while (current) {
        if (current.name && activeTargets.has(current.name)) {
          matched = true;
          break;
        }
        current = current.parent;
      }

      if (!matched) {
        return;
      }

      const mesh = object as THREE.Mesh;
      if (!mesh.material) {
        return;
      }

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(highlightMaterial);
      } else {
        highlightMaterial(mesh.material);
      }
    });

    return () => {
      originals.forEach((value, material) => {
        const emissiveMaterial = material as THREE.MeshStandardMaterial;
        if ('emissive' in emissiveMaterial && value.emissive) {
          emissiveMaterial.emissive.copy(value.emissive);
        }
        if ('emissiveIntensity' in emissiveMaterial && typeof value.emissiveIntensity === 'number') {
          emissiveMaterial.emissiveIntensity = value.emissiveIntensity;
        }
      });
    };
  }, [scene, targets]);

  return null;
}
