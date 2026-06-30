import React, { useMemo } from 'react';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { normalizeModel } from '../../../../utils/threeUtils';
import { isHomeUploadPreviewEnabled } from './homeUploadPreviewFlags';
import { useModularHomeUploadPreviewState } from './modularHomeUploadPreviewState';

type LocalModelErrorBoundaryProps = {
  children: React.ReactNode;
  fallback: React.ReactNode;
};

type LocalModelErrorBoundaryState = {
  hasError: boolean;
};

class LocalModelErrorBoundary extends React.Component<LocalModelErrorBoundaryProps, LocalModelErrorBoundaryState> {
  constructor(props: LocalModelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function cloneUploadedModel(source: THREE.Object3D) {
  const clone = source.clone(true);
  normalizeModel(clone, {
    assetType: 'modular-home-upload-preview',
    groundOffsetY: 0,
    scaleMultiplier: 1,
    targetSize: 34,
  });
  clone.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      mesh.userData.homeUploadPreview = true;
    }
  });
  clone.userData.homeUploadPreview = true;
  clone.updateMatrixWorld(true);
  return clone;
}

function UploadedModelPrimitive({ fileName, objectUrl }: { fileName: string; objectUrl: string }) {
  const { scene } = useGLTF(objectUrl);
  const model = useMemo(() => cloneUploadedModel(scene), [scene]);

  return (
    <group
      name="modular-home-uploaded-model-preview"
      userData={{
        homeUploadPreview: true,
        source: 'local-object-url',
      }}
    >
      <primitive object={model} />
      <Html position={[0, 26, 0]} center distanceFactor={58} occlude={false} pointerEvents="none">
        <div
          data-home-upload-model-label="true"
          data-home-upload-model-file={fileName}
          style={{
            background: 'rgba(15, 23, 42, 0.84)',
            border: '1px solid rgba(45, 212, 191, 0.42)',
            borderRadius: '14px',
            boxShadow: '0 12px 34px rgba(2, 6, 23, 0.35)',
            color: '#ecfeff',
            fontFamily: 'inherit',
            lineHeight: 1.1,
            padding: '8px 10px',
            textAlign: 'center',
            transform: 'translateY(-10px)',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ color: '#5eead4', fontSize: '0.58rem', fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Local GLB preview
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 950, marginTop: '3px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {fileName}
          </div>
        </div>
      </Html>
    </group>
  );
}

function UploadPreviewLoadFallback() {
  return (
    <Html position={[0, 14, 0]} center distanceFactor={58} occlude={false} pointerEvents="none">
      <div
        data-home-upload-model-error="true"
        style={{
          background: 'rgba(127, 29, 29, 0.84)',
          border: '1px solid rgba(248, 113, 113, 0.46)',
          borderRadius: '14px',
          color: '#fee2e2',
          fontFamily: 'inherit',
          fontSize: '0.68rem',
          fontWeight: 900,
          padding: '8px 10px',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        Could not render this local model preview.
      </div>
    </Html>
  );
}

export function ModularHomeUploadedModelPreview() {
  const uploadState = useModularHomeUploadPreviewState();

  if (!isHomeUploadPreviewEnabled() || uploadState.status !== 'ready' || !uploadState.objectUrl || !uploadState.fileName) {
    return null;
  }

  return (
    <group
      name="modular-home-upload-preview-district"
      position={[132, 0, 64]}
      rotation={[0, -0.08, 0]}
      userData={{
        homeUploadPreview: true,
        localOnly: true,
        source: 'src/modules/expo/runtime/modularHome/ModularHomeUploadedModelPreview.tsx',
      }}
    >
      <mesh position={[0, 0.08, 0]} scale={[48, 0.16, 48]} receiveShadow={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0f766e" emissive="#14b8a6" emissiveIntensity={0.05} roughness={0.86} metalness={0.02} />
      </mesh>
      <LocalModelErrorBoundary fallback={<UploadPreviewLoadFallback />} key={uploadState.objectUrl}>
        <UploadedModelPrimitive fileName={uploadState.fileName} objectUrl={uploadState.objectUrl} />
      </LocalModelErrorBoundary>
    </group>
  );
}
