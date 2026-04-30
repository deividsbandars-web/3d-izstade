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

export function TargetBasketHighlighter({
  hardIsolateNonTargets = false,
  isolateNonTargets = false,
  targets,
}: {
  hardIsolateNonTargets?: boolean;
  isolateNonTargets?: boolean;
  targets: string[];
}) {
  const { scene } = useThree();

  useEffect(() => {
    const GHOSTABLE_PREFIXES = [
      'city-mass:',
      'city-tower:',
      'mega-landmark:',
      'stadium-structure:',
      'stadium-pavilion:',
    ];
    const matchesTargetName = (name: string, target: string) => (
      name === target ||
      name.endsWith(`:${target}`)
    );
    const isGhostableName = (name: string) => GHOSTABLE_PREFIXES.some((prefix) => name.startsWith(prefix));
    const targetList = [...targets];
    const originals = new Map<THREE.Material, {
      color?: THREE.Color;
      depthTest?: boolean;
      depthWrite?: boolean;
      emissive?: THREE.Color;
      emissiveIntensity?: number;
      opacity?: number;
      transparent?: boolean;
    }>();
    const originalRenderOrder = new Map<THREE.Object3D, number>();
    const originalVisibility = new Map<THREE.Object3D, boolean>();
    const activeTargets = new Set(targetList);
    const GHOST_OPACITY = 0.16;

    const preserveTargetVisuals = isolateNonTargets;

    const highlightMaterial = (material: THREE.Material) => {
      if (!originals.has(material)) {
        originals.set(material, {
          color: 'color' in material ? (material as THREE.MeshBasicMaterial).color?.clone?.() : undefined,
          depthTest: material.depthTest,
          depthWrite: material.depthWrite,
          emissive: 'emissive' in material ? (material as THREE.MeshStandardMaterial).emissive?.clone?.() : undefined,
          emissiveIntensity: 'emissiveIntensity' in material ? (material as THREE.MeshStandardMaterial).emissiveIntensity : undefined,
          opacity: material.opacity,
          transparent: material.transparent,
        });
      }

      material.depthTest = false;
      material.depthWrite = false;
      material.transparent = true;
      material.opacity = Math.max(material.opacity, 0.98);

      if ('emissive' in material) {
        const emissiveMaterial = material as THREE.MeshStandardMaterial;
        if (preserveTargetVisuals) {
          emissiveMaterial.emissiveIntensity = Math.max(emissiveMaterial.emissiveIntensity || 0, 0.45);
        } else {
          emissiveMaterial.emissive = new THREE.Color('#ff3b30');
          emissiveMaterial.emissiveIntensity = Math.max(emissiveMaterial.emissiveIntensity || 0, 1.8);
        }
      } else if ('color' in material && !preserveTargetVisuals) {
        (material as THREE.MeshBasicMaterial).color = new THREE.Color('#ff4d67');
      }
    };

    const ghostMaterial = (material: THREE.Material) => {
      if (!originals.has(material)) {
        originals.set(material, {
          color: 'color' in material ? (material as THREE.MeshBasicMaterial).color?.clone?.() : undefined,
          depthTest: material.depthTest,
          depthWrite: material.depthWrite,
          emissive: 'emissive' in material ? (material as THREE.MeshStandardMaterial).emissive?.clone?.() : undefined,
          emissiveIntensity: 'emissiveIntensity' in material ? (material as THREE.MeshStandardMaterial).emissiveIntensity : undefined,
          opacity: material.opacity,
          transparent: material.transparent,
        });
      }

      material.transparent = true;
      material.opacity = Math.min(material.opacity, GHOST_OPACITY);
      material.depthWrite = false;
    };

    scene.traverse((object) => {
      let current: THREE.Object3D | null = object;
      let matched = false;
      let ghostable = false;
      while (current) {
        const currentName = current.name;
        if (currentName && targetList.some((target) => matchesTargetName(currentName, target))) {
          matched = true;
          break;
        }
        if (!ghostable && currentName && isGhostableName(currentName)) {
          ghostable = true;
        }
        current = current.parent;
      }

      const mesh = object as THREE.Mesh;
      if (!mesh.material) {
        return;
      }
      if (!originalRenderOrder.has(mesh)) {
        originalRenderOrder.set(mesh, mesh.renderOrder);
      }
      if (!originalVisibility.has(mesh)) {
        originalVisibility.set(mesh, mesh.visible);
      }
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      if (matched) {
        mesh.renderOrder = 999;
        materials.forEach(highlightMaterial);
        return;
      }

      if (isolateNonTargets && activeTargets.size > 0 && ghostable) {
        if (hardIsolateNonTargets) {
          mesh.visible = false;
          return;
        }
        mesh.renderOrder = 0;
        materials.forEach(ghostMaterial);
      }
    });

    return () => {
      originals.forEach((value, material) => {
        if ('color' in material && value.color) {
          (material as THREE.MeshBasicMaterial).color.copy(value.color);
        }
        material.depthTest = value.depthTest ?? true;
        material.depthWrite = value.depthWrite ?? true;
        material.opacity = value.opacity ?? 1;
        material.transparent = value.transparent ?? false;
        const emissiveMaterial = material as THREE.MeshStandardMaterial;
        if ('emissive' in emissiveMaterial && value.emissive) {
          emissiveMaterial.emissive.copy(value.emissive);
        }
        if ('emissiveIntensity' in emissiveMaterial && typeof value.emissiveIntensity === 'number') {
          emissiveMaterial.emissiveIntensity = value.emissiveIntensity;
        }
      });
      originalRenderOrder.forEach((value, object) => {
        object.renderOrder = value;
      });
      originalVisibility.forEach((value, object) => {
        object.visible = value;
      });
    };
  }, [hardIsolateNonTargets, isolateNonTargets, scene, targets]);

  return null;
}
