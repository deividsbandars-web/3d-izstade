import { Text } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { getBoothArchitectureMetrics } from '../../components/BoothArchitectureKit';
import type { SponsorCta } from '../../lib/sponsorBoothPresentation';
import { EXPO_FEATURE_FLAGS } from '../../state/expoRuntime';
import type { ExpoBoothPlacement } from '../../layout-engine';
import { getBoothProductPreviewCardForBooth } from '../boothProduct';
import { usePlayerColliderRegistration } from '../world';
import {
  bindBoothPresentation,
  buildBoothTierState,
  BoothVisualAssembly,
  handleBoothAction,
  openShowcaseRoom,
  trackBoothSelection,
} from './index';

function getBoothEntryActionLabel(action: SponsorCta) {
  if (action.kind === 'demo_room') {
    return 'OPEN ROOM';
  }
  if (action.kind === 'calculators') {
    return 'CALCULATORS';
  }
  if (action.kind === 'ai_chat') {
    return 'ASK AI';
  }

  return action.label.toUpperCase();
}

export function DistrictBooth({
  districtVisual,
  placement,
  playerPosition,
}: {
  districtVisual: {
    districtGlow: string;
    expressionMode: string;
    groundAccent: string;
    shellAccent: string;
  };
  placement: ExpoBoothPlacement;
  playerPosition: [number, number, number];
}) {
  const nav = useNavigate();
  const company = placement.company;
  const { booth, presentation } = useMemo(
    () => bindBoothPresentation(company, placement),
    [company, placement]
  );
  const boothColliderRef = useRef<THREE.Group>(null);
  usePlayerColliderRegistration(boothColliderRef, `district-booth-${String(company?.id || company?.name || 'unknown')}`);

  const tierState = buildBoothTierState({
    booth,
    companySponsorTier: company?.sponsorTier,
    districtVisual,
    nodeType: placement.nodeType,
    playerPosition,
    position: placement.position,
    presentation,
    skylineDensityEnabled: EXPO_FEATURE_FLAGS.enableShowcaseSkylineDensity,
  });
  const boothId = String(booth?.id ?? placement.id);
  const boothActionMetrics = useMemo(
    () => getBoothArchitectureMetrics(presentation.template),
    [presentation.template]
  );
  const boothActionPosition: [number, number, number] = [
    0,
    Math.max(2.15, boothActionMetrics.ctaPosition[1] + 0.72),
    Math.max(boothActionMetrics.ctaPosition[2] + 0.58, 3.2),
  ];
  const boothEntryActions = useMemo(
    () => ['demo_room', 'calculators', 'ai_chat']
      .map((kind) => presentation.actions.find((action) => action.kind === kind && !action.disabled))
      .filter((action): action is SponsorCta => Boolean(action)),
    [presentation.actions]
  );
  const boothProductPreviewCard = getBoothProductPreviewCardForBooth({
    boothId,
    companyId: company?.id,
    placementId: placement.id,
    runtimeBoothId: booth?.id,
  });
  const openRoom = () => openShowcaseRoom({
    analyticsEnabled: EXPO_FEATURE_FLAGS.enableAnalytics,
    boothId,
    company,
    navigate: nav,
    presentation,
    sectorName: placement.sectorName,
  });

  const onAction = (action: SponsorCta) => {
    handleBoothAction({
      action,
      analyticsEnabled: EXPO_FEATURE_FLAGS.enableAnalytics,
      boothId,
      company,
      navigate: nav,
      presentation,
      sectorName: placement.sectorName,
    });
  };
  const selectBoothAndOpenRoom = () => {
    trackBoothSelection({
      analyticsEnabled: EXPO_FEATURE_FLAGS.enableAnalytics,
      boothId,
      company,
      nodeType: placement.nodeType,
      presentation,
      sectorName: placement.sectorName,
    });
    openRoom();
  };

  return (
    <group
      name={`booth:${placement.id}`}
      position={placement.position}
      rotation={placement.rotation}
      onClick={(event) => {
        event.stopPropagation();
        selectBoothAndOpenRoom();
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <group name="booth-entry-actions" position={boothActionPosition}>
        <mesh castShadow receiveShadow onClick={(event) => { event.stopPropagation(); selectBoothAndOpenRoom(); }}>
          <boxGeometry args={[8.15, 1.64, 0.24]} />
          <meshStandardMaterial color="#0b1624" emissive={placement.color} emissiveIntensity={0.08} metalness={0.08} roughness={0.42} />
        </mesh>
        <mesh position={[0, 0, 0.13]}>
          <boxGeometry args={[7.36, 0.1, 0.05]} />
          <meshBasicMaterial color={placement.color} toneMapped={false} />
        </mesh>
        <Text
          anchorX="center"
          anchorY="middle"
          color="#f4fbff"
          fontSize={0.28}
          fontWeight={800}
          letterSpacing={0.08}
          position={[0, 0.46, 0.19]}
        >
          BOOTH ACTIONS
        </Text>
        <Text
          anchorX="center"
          anchorY="middle"
          color="#bfeeff"
          fontSize={0.14}
          fontWeight={700}
          letterSpacing={0.12}
          position={[0, 0.14, 0.2]}
        >
          CLICK / TAP A BUTTON
        </Text>
        <group position={[0, -0.42, 0.18]}>
          {boothEntryActions.map((action, index) => {
            const buttonWidth = 2.35;
            const spacing = 2.58;
            const x = (index - ((boothEntryActions.length - 1) / 2)) * spacing;
            const isPrimary = action.kind === 'demo_room';

            return (
              <group key={action.kind} position={[x, 0, 0]}>
                <mesh
                  castShadow
                  onClick={(event) => {
                    event.stopPropagation();
                    onAction(action);
                  }}
                  onPointerOver={() => {
                    document.body.style.cursor = 'pointer';
                  }}
                  onPointerOut={() => {
                    document.body.style.cursor = 'auto';
                  }}
                >
                  <boxGeometry args={[buttonWidth, 0.42, 0.18]} />
                  <meshStandardMaterial
                    color={isPrimary ? placement.color : '#1d2d44'}
                    emissive={placement.color}
                    emissiveIntensity={isPrimary ? 0.12 : 0.045}
                    metalness={0.08}
                    roughness={0.44}
                  />
                </mesh>
                <Text
                  anchorX="center"
                  anchorY="middle"
                  color="#f8fafc"
                  fontSize={0.135}
                  fontWeight={900}
                  letterSpacing={0.08}
                  maxWidth={buttonWidth - 0.24}
                  position={[0, 0, 0.14]}
                >
                  {getBoothEntryActionLabel(action)}
                </Text>
              </group>
            );
          })}
        </group>
      </group>
      <BoothVisualAssembly
        accentColor={placement.color}
        boothColliderRef={boothColliderRef}
        boothProductPreviewCard={boothProductPreviewCard}
        districtThemeId={placement.districtThemeId}
        fallbackMonogram={presentation.fallbackIdentity.monogram}
        onAction={onAction}
        presentation={presentation}
        tierState={{ ...tierState, districtVisual }}
      />
    </group>
  );
}
