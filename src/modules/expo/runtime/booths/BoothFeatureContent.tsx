/* eslint-disable react-refresh/only-export-components */
import { Suspense, useRef } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SponsorCta } from '../../lib/sponsorBoothPresentation';
import { SponsorTextureSurface } from './BoothTextureMaterials';

export function formatExpoDisplayName(name: string) {
  const cleaned = (name || '').trim().toUpperCase();
  if (!cleaned) return { lines: ['EXPO'], fontScale: 1 };
  const words = cleaned.split(/\s+/);
  if (words.length === 1 || cleaned.length <= 14) {
    return { lines: [cleaned], fontScale: cleaned.length > 12 ? 0.92 : 1 };
  }
  const midpoint = Math.ceil(words.length / 2);
  const first = words.slice(0, midpoint).join(' ');
  const second = words.slice(midpoint).join(' ');
  const longest = Math.max(first.length, second.length);
  return { lines: [first, second], fontScale: longest > 14 ? 0.78 : longest > 10 ? 0.88 : 1 };
}

export function SponsorShowcaseObject({
  accentColor,
  fallbackMonogram,
  mode,
}: {
  accentColor: string;
  fallbackMonogram: string;
  mode: 'immersive' | 'hero-object' | 'product' | 'support';
}) {
  const turntableRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (turntableRef.current) turntableRef.current.rotation.y += delta * (mode === 'immersive' ? 0.36 : 0.28);
  });
  return (
    <group ref={turntableRef}>
      {mode === 'immersive' && <>
        <mesh castShadow><icosahedronGeometry args={[1.52, 0]} /><meshStandardMaterial color="#e9f1f7" metalness={0.28} roughness={0.22} emissive={accentColor} emissiveIntensity={0.08} /></mesh>
        <mesh position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.98, 0.12, 14, 42]} /><meshStandardMaterial color={accentColor} metalness={0.34} roughness={0.28} emissive={accentColor} emissiveIntensity={0.1} /></mesh>
      </>}
      {mode === 'hero-object' && <mesh castShadow><cylinderGeometry args={[1.28, 1.62, 3.6, 8]} /><meshStandardMaterial color="#ecf3f8" metalness={0.18} roughness={0.28} emissive={accentColor} emissiveIntensity={0.05} /></mesh>}
      {mode === 'product' && <mesh castShadow rotation={[0.12, 0.24, 0]}><boxGeometry args={[2.18, 2.18, 2.18]} /><meshStandardMaterial color="#eef4f8" metalness={0.12} roughness={0.32} emissive={accentColor} emissiveIntensity={0.04} /></mesh>}
      {mode === 'support' && <mesh castShadow rotation={[0, 0.4, 0]}><octahedronGeometry args={[1.42, 0]} /><meshStandardMaterial color="#dde7ee" metalness={0.1} roughness={0.42} emissive={accentColor} emissiveIntensity={0.03} /></mesh>}
      <Text position={[0, -2.08, 0.1]} fontSize={0.68} color={accentColor} anchorX="center" anchorY="middle">{fallbackMonogram}</Text>
    </group>
  );
}

function ScreenFirstEngagementPad({
  accentColor,
  isEliteFeature,
  isFeatureBooth,
  isHeroFeature,
  stageScale,
}: {
  accentColor: string;
  isEliteFeature: boolean;
  isFeatureBooth: boolean;
  isHeroFeature: boolean;
  stageScale: number;
}) {
  const scale = (isHeroFeature ? 1.18 : isEliteFeature ? 1.08 : isFeatureBooth ? 1 : 0.86) * stageScale;
  const padWidth = 7.6 * scale;
  const padDepth = 3.7 * scale;
  const lightStrips = [
    { id: 'left', x: -padWidth * 0.24, color: '#eef7fb' },
    { id: 'center', x: 0, color: accentColor },
    { id: 'right', x: padWidth * 0.24, color: '#c8f7ff' },
  ];

  return (
    <group position={[0, 0, 1.42]}>
      <mesh position={[0, 0.18, 0]} receiveShadow>
        <boxGeometry args={[padWidth, 0.22, padDepth]} />
        <meshStandardMaterial color="#16283a" emissive={accentColor} emissiveIntensity={0.035} metalness={0.12} roughness={0.58} />
      </mesh>
      <mesh position={[0, 0.34, -padDepth * 0.04]} receiveShadow>
        <boxGeometry args={[padWidth * 0.84, 0.1, padDepth * 0.54]} />
        <meshStandardMaterial color="#21364b" emissive={accentColor} emissiveIntensity={0.05} metalness={0.16} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.43, padDepth * 0.39]} receiveShadow>
        <boxGeometry args={[padWidth * 0.9, 0.08, 0.16 * scale]} />
        <meshStandardMaterial color="#f8fbfe" emissive={accentColor} emissiveIntensity={0.09} metalness={0.08} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.45, -padDepth * 0.34]} receiveShadow>
        <boxGeometry args={[padWidth * 0.46, 0.06, 0.14 * scale]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.18} metalness={0.1} roughness={0.24} />
      </mesh>
      {lightStrips.map((strip) => (
        <mesh key={`screen-first-pad-light-strip-${strip.id}`} position={[strip.x, 0.53, 0.12]} receiveShadow>
          <boxGeometry args={[padWidth * 0.18, 0.04, 0.92 * scale]} />
          <meshBasicMaterial color={strip.color} transparent opacity={strip.id === 'center' ? 0.68 : 0.42} toneMapped={false} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <group key={`screen-first-pad-side-bollard-${side}`} position={[side * padWidth * 0.46, 0.62, -padDepth * 0.2]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.16, 0.86 * Math.max(0.82, stageScale), 0.16]} />
            <meshStandardMaterial color="#d7e8f1" emissive={accentColor} emissiveIntensity={0.07} metalness={0.16} roughness={0.36} />
          </mesh>
          <mesh position={[0, 0.38 * Math.max(0.82, stageScale), 0.08]}>
            <boxGeometry args={[0.36, 0.16, 0.08]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.22} metalness={0.08} roughness={0.24} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.58, -padDepth * 0.24]} receiveShadow>
        <boxGeometry args={[padWidth * 0.34, 0.1, 0.12 * scale]} />
        <meshStandardMaterial color="#f8fbfe" emissive={accentColor} emissiveIntensity={0.08} metalness={0.08} roughness={0.32} />
      </mesh>
    </group>
  );
}

export function SponsorBadge({ accentColor, label, position }: { accentColor: string; label: string; position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow><boxGeometry args={[3.9, 0.84, 0.34]} /><meshStandardMaterial color="#18304a" emissive={accentColor} emissiveIntensity={0.035} metalness={0.1} roughness={0.52} /></mesh>
      <mesh position={[-1.36, 0, 0.1]} castShadow><boxGeometry args={[0.2, 0.84, 0.08]} /><meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.16} /></mesh>
      <Text position={[0.14, 0, 0.24]} fontSize={0.34} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={2.6}>{label}</Text>
    </group>
  );
}

export function SponsorCtaStrip({ actions, color, onAction }: { actions: SponsorCta[]; color: string; onAction: (action: SponsorCta) => void }) {
  const stripActions = actions.filter((action) => action.surface !== 'feature');
  const primaryIndex = stripActions.findIndex((action) => !action.disabled && action.kind === 'demo_room');
  const actionCount = Math.max(stripActions.length, 1);
  const spacing = actionCount >= 4 ? 2.78 : 3.5;
  const primaryWidth = actionCount >= 4 ? 2.86 : 3.64;
  const secondaryWidth = actionCount >= 4 ? 2.34 : 3.04;
  const primaryTextWidth = actionCount >= 4 ? 1.9 : 2.5;
  const secondaryTextWidth = actionCount >= 4 ? 1.45 : 1.9;
  return (
    <group>
      <mesh castShadow><boxGeometry args={[11.9, 0.92, 0.42]} /><meshStandardMaterial color="#17283a" emissive={color} emissiveIntensity={0.035} metalness={0.08} roughness={0.56} /></mesh>
      <mesh position={[0, -0.16, 0.08]} castShadow><boxGeometry args={[11.2, 0.1, 0.08]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.06} roughness={0.48} /></mesh>
      {stripActions.map((action, index) => {
        const x = (index - ((stripActions.length - 1) / 2)) * spacing;
        const isPrimary = index === primaryIndex;
        const buttonWidth = isPrimary ? primaryWidth : secondaryWidth;
        const dividerOffset = (buttonWidth * 0.5) + 0.14;
        return (
          <group key={`${action.kind}-${index}`} position={[x, 0.01, 0.13]}>
            <mesh onClick={(event) => { event.stopPropagation(); if (!action.disabled) onAction(action); }} onPointerOver={() => { document.body.style.cursor = action.disabled ? 'auto' : 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'auto'; }}>
              <boxGeometry args={[buttonWidth, 0.54, 0.18]} />
              <meshStandardMaterial color={action.disabled ? '#243246' : isPrimary ? color : '#203247'} emissive={action.disabled ? '#000000' : color} emissiveIntensity={isPrimary ? 0.08 : 0.035} metalness={0.06} roughness={0.62} />
            </mesh>
            {index < stripActions.length - 1 && <mesh position={[dividerOffset, 0, 0.03]}><boxGeometry args={[0.04, 0.4, 0.04]} /><meshStandardMaterial color="#1b2533" /></mesh>}
            <Text position={[0, 0, 0.16]} fontSize={isPrimary ? 0.22 : 0.2} color={action.disabled ? '#64748b' : '#f8fafc'} anchorX="center" anchorY="middle" maxWidth={isPrimary ? primaryTextWidth : secondaryTextWidth}>{action.label.toUpperCase()}</Text>
          </group>
        );
      })}
    </group>
  );
}

export function BoothCalculatorFeature({
  action,
  color,
  onAction,
}: {
  action: SponsorCta | null;
  color: string;
  onAction: (action: SponsorCta) => void;
}) {
  if (!action) {
    return null;
  }

  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[7.84, 1.12, 0.34]} />
        <meshStandardMaterial color="#16273a" emissive={color} emissiveIntensity={0.035} metalness={0.08} roughness={0.54} />
      </mesh>
      <mesh position={[-2.96, 0, 0.08]} castShadow>
        <boxGeometry args={[1.12, 1.12, 0.12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.12} roughness={0.26} metalness={0.12} />
      </mesh>
      <Text position={[-2.96, 0.02, 0.18]} fontSize={0.42} color="#f8fafc" anchorX="center" anchorY="middle">
        CALC
      </Text>
      <Text position={[0.38, 0.2, 0.18]} fontSize={0.22} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={4.2}>
        ESTIMATE PROJECT COSTS
      </Text>
      <Text position={[0.38, -0.12, 0.18]} fontSize={0.16} color="#94a3b8" anchorX="center" anchorY="middle" maxWidth={4.8}>
        OPEN THE CALCULATOR HUB DIRECTLY FROM THIS BOOTH
      </Text>
      <group position={[2.44, -0.02, 0.12]}>
        <mesh
          onClick={(event) => {
            event.stopPropagation();
            if (!action.disabled) {
              onAction(action);
            }
          }}
          onPointerOver={() => {
            document.body.style.cursor = action.disabled ? 'auto' : 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          <boxGeometry args={[1.82, 0.52, 0.18]} />
          <meshStandardMaterial color={action.disabled ? '#172030' : color} metalness={0.08} roughness={0.44} />
        </mesh>
        <Text position={[0, 0, 0.14]} fontSize={0.15} color={action.disabled ? '#64748b' : '#f8fafc'} anchorX="center" anchorY="middle" maxWidth={1.4}>
          {action.label.toUpperCase()}
        </Text>
      </group>
    </group>
  );
}

export function BoothAiFeature({
  action,
  color,
  onAction,
}: {
  action: SponsorCta | null;
  color: string;
  onAction: (action: SponsorCta) => void;
}) {
  if (!action) {
    return null;
  }

  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[7.84, 1.12, 0.34]} />
        <meshStandardMaterial color="#142a42" emissive={color} emissiveIntensity={0.04} metalness={0.08} roughness={0.5} />
      </mesh>
      <mesh position={[-2.96, 0, 0.08]} castShadow>
        <boxGeometry args={[1.12, 1.12, 0.12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.14} roughness={0.24} metalness={0.12} />
      </mesh>
      <Text position={[-2.96, 0.02, 0.18]} fontSize={0.42} color="#f8fafc" anchorX="center" anchorY="middle">
        AI
      </Text>
      <Text position={[0.32, 0.2, 0.18]} fontSize={0.22} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={4.4}>
        TALK TO THE CITY AI
      </Text>
      <Text position={[0.32, -0.12, 0.18]} fontSize={0.16} color="#94a3b8" anchorX="center" anchorY="middle" maxWidth={4.8}>
        OPEN LIVE AI GUIDANCE DIRECTLY FROM THIS BOOTH
      </Text>
      <group position={[2.44, -0.02, 0.12]}>
        <mesh
          onClick={(event) => {
            event.stopPropagation();
            if (!action.disabled) {
              onAction(action);
            }
          }}
          onPointerOver={() => {
            document.body.style.cursor = action.disabled ? 'auto' : 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          <boxGeometry args={[1.82, 0.52, 0.18]} />
          <meshStandardMaterial color={action.disabled ? '#172030' : color} metalness={0.08} roughness={0.44} />
        </mesh>
        <Text position={[0, 0, 0.14]} fontSize={0.15} color={action.disabled ? '#64748b' : '#f8fafc'} anchorX="center" anchorY="middle" maxWidth={1.4}>
          {action.label.toUpperCase()}
        </Text>
      </group>
    </group>
  );
}

export function BoothInfoStandFeature({
  action,
  color,
  onAction,
}: {
  action: SponsorCta | null;
  color: string;
  onAction: (action: SponsorCta) => void;
}) {
  if (!action) {
    return null;
  }

  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[7.84, 1.12, 0.34]} />
        <meshStandardMaterial color="#15283e" emissive={color} emissiveIntensity={0.035} metalness={0.08} roughness={0.52} />
      </mesh>
      <mesh position={[-2.96, 0, 0.08]} castShadow>
        <boxGeometry args={[1.12, 1.12, 0.12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.1} roughness={0.24} metalness={0.14} />
      </mesh>
      <Text position={[-2.96, 0.02, 0.18]} fontSize={0.32} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={0.9}>
        2D
      </Text>
      <Text position={[0.34, 0.2, 0.18]} fontSize={0.22} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={4.4}>
        PROJECT INFO STAND
      </Text>
      <Text position={[0.34, -0.12, 0.18]} fontSize={0.16} color="#94a3b8" anchorX="center" anchorY="middle" maxWidth={4.8}>
        OPEN THE BOOTH&apos;S DEDICATED 2D INFO SURFACE AND SHOWROOM
      </Text>
      <group position={[2.44, -0.02, 0.12]}>
        <mesh
          onClick={(event) => {
            event.stopPropagation();
            if (!action.disabled) {
              onAction(action);
            }
          }}
          onPointerOver={() => {
            document.body.style.cursor = action.disabled ? 'auto' : 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          <boxGeometry args={[1.82, 0.52, 0.18]} />
          <meshStandardMaterial color={action.disabled ? '#172030' : color} metalness={0.08} roughness={0.44} />
        </mesh>
        <Text position={[0, 0, 0.14]} fontSize={0.15} color={action.disabled ? '#64748b' : '#f8fafc'} anchorX="center" anchorY="middle" maxWidth={1.4}>
          {action.label.toUpperCase()}
        </Text>
      </group>
    </group>
  );
}

export function BoothFeatureApron({ accentColor, contractTier, districtGlow, frontApronDepth, frontApronWidth, isFeatureBooth }: { accentColor: string; contractTier: 'common' | 'premium' | 'elite' | 'hero'; districtGlow: string; frontApronDepth: number; frontApronWidth: number; isFeatureBooth: boolean }) {
  if (!isFeatureBooth) return null;
  const isHero = contractTier === 'hero';
  const isElite = contractTier === 'elite';
  const upperBandWidth = frontApronWidth * (isHero ? 0.84 : isElite ? 0.8 : 0.78);
  const upperBandDepth = frontApronDepth * (isHero ? 0.52 : isElite ? 0.48 : 0.44);
  return (
    <group position={[0, 0, 7.4]}>
      <mesh position={[0, 0.08, 0]} receiveShadow><boxGeometry args={[frontApronWidth, 0.16, frontApronDepth]} /><meshStandardMaterial color="#e4edf4" metalness={0.04} roughness={0.72} /></mesh>
      <mesh position={[0, 0.24, 0]} receiveShadow><boxGeometry args={[upperBandWidth, 0.08, upperBandDepth]} /><meshStandardMaterial color={accentColor} emissive={districtGlow} emissiveIntensity={isHero ? 0.12 : isElite ? 0.1 : 0.08} roughness={0.54} metalness={0.16} /></mesh>
      {(isElite || isHero) && (
        <>
          {[-1, 1].map((side) => (
            <mesh key={`apron-guide-${side}`} position={[side * ((frontApronWidth * 0.5) - 0.84), 0.26, 0]} receiveShadow>
              <boxGeometry args={[0.24, isHero ? 0.26 : isElite ? 0.22 : 0.18, frontApronDepth * (isHero ? 0.82 : isElite ? 0.72 : 0.62)]} />
              <meshStandardMaterial color={accentColor} emissive={districtGlow} emissiveIntensity={isHero ? 0.16 : isElite ? 0.12 : 0.08} roughness={0.28} metalness={0.12} />
            </mesh>
          ))}
        </>
      )}
      {(isHero || isElite) && (
        <mesh position={[0, 0.34, 0]} receiveShadow>
          <boxGeometry args={[frontApronWidth * (isHero ? 0.58 : 0.52), 0.05, frontApronDepth * (isHero ? 0.22 : 0.18)]} />
          <meshStandardMaterial color="#f8fbfe" emissive={accentColor} emissiveIntensity={isHero ? 0.1 : 0.06} roughness={0.32} metalness={0.12} />
        </mesh>
      )}
    </group>
  );
}

export function BoothFeatureStage({ accentColor, fallbackMonogram, isEliteFeature, isFeatureBooth, isHeroFeature, mode, screenFirst = false, stageScale }: { accentColor: string; fallbackMonogram: string; isEliteFeature: boolean; isFeatureBooth: boolean; isHeroFeature: boolean; mode: 'immersive' | 'hero-object' | 'product' | 'support'; screenFirst?: boolean; stageScale: number }) {
  if (screenFirst) {
    return (
      <ScreenFirstEngagementPad
        accentColor={accentColor}
        isEliteFeature={isEliteFeature}
        isFeatureBooth={isFeatureBooth}
        isHeroFeature={isHeroFeature}
        stageScale={stageScale}
      />
    );
  }

  return (
    <group position={[0, 0, 1.48]}>
      {isFeatureBooth && <>
        <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[(isHeroFeature ? 4.9 : isEliteFeature ? 4.5 : 4.2) * stageScale, (isHeroFeature ? 5.9 : isEliteFeature ? 5.45 : 5.1) * stageScale, 48]} /><meshBasicMaterial color={accentColor} depthWrite={false} transparent opacity={isHeroFeature ? 0.24 : isEliteFeature ? 0.2 : 0.16} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[(isHeroFeature ? 6.2 : isEliteFeature ? 5.8 : 5.4) * stageScale, (isHeroFeature ? 6.8 : isEliteFeature ? 6.3 : 5.9) * stageScale, 56]} /><meshBasicMaterial color="#dbeafe" depthWrite={false} transparent opacity={isHeroFeature ? 0.12 : isEliteFeature ? 0.1 : 0.08} side={THREE.DoubleSide} /></mesh>
        {[-1, 1].map((side) => (
          <mesh key={`stage-guide-${side}`} position={[side * (isHeroFeature ? 4.8 : isEliteFeature ? 4.2 : 3.7) * stageScale, 0.44, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.18, isHeroFeature ? 0.72 : isEliteFeature ? 0.58 : 0.46, 0.18]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={isHeroFeature ? 0.16 : isEliteFeature ? 0.12 : 0.08} roughness={0.22} metalness={0.12} />
          </mesh>
        ))}
      </>}
      <mesh position={[0, 0.32, 0]} receiveShadow><cylinderGeometry args={[3.9 * stageScale, 4.5 * stageScale, 0.46, 28]} /><meshStandardMaterial color="#18283a" emissive={accentColor} emissiveIntensity={0.035} metalness={0.1} roughness={0.62} /></mesh>
      <mesh position={[0, 0.56, 0]} receiveShadow><cylinderGeometry args={[3.52 * stageScale, 3.84 * stageScale, 0.12, 28]} /><meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.08} roughness={0.48} /></mesh>
      {isFeatureBooth && <mesh position={[0, 0.9, 0]} receiveShadow><cylinderGeometry args={[4.34 * stageScale, 4.64 * stageScale, 0.14, 28]} /><meshStandardMaterial color="#223449" emissive={accentColor} emissiveIntensity={0.04} metalness={0.16} roughness={0.48} /></mesh>}
      <group position={[0, 3.1, 0]}><SponsorShowcaseObject accentColor={accentColor} fallbackMonogram={fallbackMonogram} mode={mode} /></group>
    </group>
  );
}

export function BoothFeatureHeader({ accentColor, contractTier, fallbackMonogram, heroName, isEliteFeature, isFeatureBooth, isHeroFeature, logoUrl, metricsColliderHeight }: { accentColor: string; contractTier: 'common' | 'premium' | 'elite' | 'hero'; fallbackMonogram: string; heroName: { lines: string[]; fontScale: number }; isEliteFeature: boolean; isFeatureBooth: boolean; isHeroFeature: boolean; logoUrl: string | null; metricsColliderHeight: number }) {
  if (!isFeatureBooth) return null;
  const isHero = contractTier === 'hero';
  const isElite = contractTier === 'elite';
  const isPremium = contractTier === 'premium';
  return (
    <group position={[0, metricsColliderHeight + (isHeroFeature ? 4.8 : isEliteFeature ? 4.5 : 4.2), -0.22]}>
      <mesh castShadow><boxGeometry args={[isHeroFeature ? 12.8 : isEliteFeature ? 11.4 : 10.4, isHeroFeature ? 2.48 : isEliteFeature ? 2.16 : 1.94, 0.5]} /><meshStandardMaterial color="#142337" emissive={accentColor} emissiveIntensity={0.045} metalness={0.08} roughness={0.42} /></mesh>
      {(isPremium || isElite || isHero) && (
        <>
          {[-1, 1].map((side) => (
            <mesh key={`header-side-fin-${side}`} position={[side * (isHero ? 6.82 : isElite ? 6.08 : 5.56), 0, 0.08]} castShadow>
              <boxGeometry args={[0.26, isHero ? 1.92 : isElite ? 1.68 : 1.42, 0.18]} />
              <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={isHero ? 0.18 : isElite ? 0.14 : 0.1} roughness={0.22} metalness={0.12} />
            </mesh>
          ))}
        </>
      )}
      {(isPremium || isElite || isHero) && (
        <mesh position={[0, isHero ? 0.96 : isElite ? 0.84 : 0.72, 0.14]} castShadow>
          <boxGeometry args={[isHero ? 9.8 : isElite ? 8.8 : 7.8, 0.12, 0.12]} />
          <meshStandardMaterial color={isHero ? '#f3f8fd' : isElite ? '#edf4fa' : '#e7f0f8'} emissive={accentColor} emissiveIntensity={isHero ? 0.14 : isElite ? 0.1 : 0.08} roughness={0.26} metalness={0.12} />
        </mesh>
      )}
      <mesh position={[0, isHeroFeature ? -0.86 : isEliteFeature ? -0.76 : -0.66, 0.16]} castShadow><boxGeometry args={[isHeroFeature ? 10.6 : isEliteFeature ? 9.2 : 8.2, 0.14, 0.14]} /><meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.14} roughness={0.3} /></mesh>
      <Text position={[0, heroName.lines.length > 1 ? (isHeroFeature ? 0.18 : isEliteFeature ? 0.15 : 0.12) : (isHeroFeature ? 0.02 : isEliteFeature ? 0 : -0.02), 0.28]} fontSize={(isHeroFeature ? 0.7 : isEliteFeature ? 0.62 : 0.56) * heroName.fontScale} lineHeight={0.92} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={isHeroFeature ? 10.8 : isEliteFeature ? 9.3 : 8.4}>{heroName.lines.join('\n')}</Text>
      <group position={[0, isHeroFeature ? -2.92 : isEliteFeature ? -2.58 : -2.28, 0.04]}>
        <mesh castShadow><cylinderGeometry args={[isHeroFeature ? 1.54 : isEliteFeature ? 1.34 : 1.18, isHeroFeature ? 1.54 : isEliteFeature ? 1.34 : 1.18, 0.16, 40]} /><meshStandardMaterial color="#15283a" emissive={accentColor} emissiveIntensity={0.04} metalness={0.1} roughness={0.4} /></mesh>
        <mesh position={[0, 0, 0.09]}><cylinderGeometry args={[isHeroFeature ? 1.28 : isEliteFeature ? 1.12 : 0.96, isHeroFeature ? 1.28 : isEliteFeature ? 1.12 : 0.96, 0.08, 40]} /><meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.16} roughness={0.24} metalness={0.12} /></mesh>
        <mesh position={[0, 0, 0.14]}>
          <circleGeometry args={[isHeroFeature ? 1.08 : isEliteFeature ? 0.96 : 0.82, 40]} />
          {logoUrl ? <Suspense fallback={<meshStandardMaterial color="#1f4d6d" emissive={accentColor} emissiveIntensity={0.12} />}><SponsorTextureSurface fallbackColor="#1f4d6d" emissiveColor={accentColor} emissiveIntensity={0.12} url={logoUrl} /></Suspense> : <meshStandardMaterial color="#1f4d6d" emissive={accentColor} emissiveIntensity={0.12} />}
        </mesh>
        {!logoUrl && <Text position={[0, -0.04, 0.22]} fontSize={isHeroFeature ? 0.48 : isEliteFeature ? 0.42 : 0.38} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={isHeroFeature ? 1.5 : isEliteFeature ? 1.28 : 1.1}>{fallbackMonogram}</Text>}
      </group>
      {(isHero || isElite) && (
        <mesh position={[0, isHero ? -4.02 : -3.54, 0.02]} castShadow>
          <boxGeometry args={[isHero ? 8.8 : 7.4, 0.12, 0.16]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={isHero ? 0.14 : 0.1} roughness={0.24} metalness={0.12} />
        </mesh>
      )}
    </group>
  );
}

export function BoothInfoBand({ accentColor, badgeLabel, fallbackPremiumLabel, infoBandHeight, infoBandWidth, infoBandZ, isEliteBooth, isHeroNode, metrics, nameFontSize, showBadge, showDetailedText, showPremiumEyebrow, showTagline, tagline, title }: { accentColor: string; badgeLabel: string | null; fallbackPremiumLabel: string; infoBandHeight: number; infoBandWidth: number; infoBandZ: number; isEliteBooth: boolean; isHeroNode: boolean; metrics: { badgePosition: [number, number, number]; taglinePosition: [number, number, number]; titleMaxWidth: number; titlePosition: [number, number, number] }; nameFontSize: number; showBadge: boolean; showDetailedText: boolean; showPremiumEyebrow: boolean; showTagline: boolean; tagline?: string; title: string }) {
  if (!showDetailedText) {
    return null;
  }

  const isPremiumBand = showPremiumEyebrow;
  const edgeGlowColor = isEliteBooth ? '#99f6e4' : isHeroNode ? '#f3f8fd' : '#bae6fd';
  const backgroundHeight = infoBandHeight + 0.72;
  const backgroundCenterY = metrics.titlePosition[1] - 0.82;
  const sideRailCenterY = metrics.titlePosition[1] - 0.86;
  return (
    <>
      <mesh position={[0, backgroundCenterY, infoBandZ - 0.04]} castShadow><boxGeometry args={[infoBandWidth + 1.46, backgroundHeight, 0.48]} /><meshStandardMaterial color="#142337" emissive={accentColor} emissiveIntensity={0.045} metalness={0.06} roughness={0.52} /></mesh>
      <mesh position={[0, metrics.titlePosition[1] + 0.52, infoBandZ + 0.02]} castShadow><boxGeometry args={[Math.max(7.8, metrics.titleMaxWidth + (isEliteBooth ? 1.2 : isPremiumBand ? 0.8 : 0.4)), 0.18, 0.18]} /><meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={isEliteBooth ? 0.12 : isPremiumBand ? 0.1 : 0.08} /></mesh>
      {showPremiumEyebrow && showDetailedText && <Text position={[metrics.titlePosition[0], metrics.titlePosition[1] + 0.92, metrics.titlePosition[2] - 0.08]} fontSize={isEliteBooth ? 0.34 : isHeroNode ? 0.36 : 0.28} color={edgeGlowColor} anchorX="center" anchorY="middle" maxWidth={Math.max(8.2, metrics.titleMaxWidth)}>{fallbackPremiumLabel}</Text>}
      <mesh position={[-((infoBandWidth * 0.5) + 0.54), sideRailCenterY, infoBandZ + 0.02]} castShadow><boxGeometry args={[0.24, backgroundHeight - 0.3, 0.18]} /><meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.1} /></mesh>
      <mesh position={[(infoBandWidth * 0.5) + 0.54, sideRailCenterY, infoBandZ + 0.02]} castShadow><boxGeometry args={[0.24, backgroundHeight - 0.3, 0.18]} /><meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.06} /></mesh>
      {!isPremiumBand && (
        <mesh position={[0, metrics.titlePosition[1] - 1.46, infoBandZ + 0.02]} castShadow>
          <boxGeometry args={[Math.max(7.1, infoBandWidth - 2.8), 0.06, 0.12]} />
          <meshStandardMaterial color="#cfe0ee" emissive={accentColor} emissiveIntensity={0.04} roughness={0.28} metalness={0.1} />
        </mesh>
      )}
      {isPremiumBand && (
        <mesh position={[0, metrics.titlePosition[1] - 1.56, infoBandZ + 0.02]} castShadow>
          <boxGeometry args={[Math.max(8.8, infoBandWidth - (isEliteBooth ? 1.6 : 2.1)), 0.08, 0.12]} />
          <meshStandardMaterial color={edgeGlowColor} emissive={accentColor} emissiveIntensity={isEliteBooth ? 0.14 : isHeroNode ? 0.16 : 0.1} roughness={0.24} metalness={0.12} />
        </mesh>
      )}
      {showDetailedText && !isHeroNode && <Text position={metrics.titlePosition} fontSize={nameFontSize * 0.84} color="#f8fafc" anchorX="center" anchorY="middle" maxWidth={metrics.titleMaxWidth - 1.1}>{title.toUpperCase()}</Text>}
      {showTagline && showDetailedText && <Text position={metrics.taglinePosition} fontSize={metrics.titleMaxWidth <= 10 ? 0.36 : 0.42} color="#94a3b8" anchorX="center" anchorY="middle" maxWidth={Math.max(8.4, metrics.titleMaxWidth - 2.4)}>{(tagline || '').toUpperCase()}</Text>}
      {showBadge && showDetailedText && badgeLabel && <SponsorBadge accentColor={accentColor} label={badgeLabel} position={[metrics.badgePosition[0], metrics.badgePosition[1] + (showPremiumEyebrow ? 0.14 : 0), metrics.badgePosition[2] - 0.46]} />}
    </>
  );
}
