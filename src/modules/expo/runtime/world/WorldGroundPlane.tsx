import type { ExpoWorldVisualProfile } from '../../world-contract';
import {
  ARRIVAL_GATE_FLOOR_ANCHOR,
  CENTER_SPINE_FLOOR_GUIDE,
  GROUND_DETAIL_RIBBONS,
  GLOBAL_GROUND_POSITION,
  GLOBAL_GROUND_SIZE,
  GROUND_SEAM_TRANSITION_PLATE,
  SPONSOR_BOULEVARD_RIGHT_FLOOR_ANCHOR,
  resolveGroundDetailOpacity,
} from './WorldGroundLayout';
import type { GroundDetailRibbon } from './WorldGroundLayout';
import { FLOOR_LAYER_ORDER, FLOOR_MATERIAL_INTENTS } from './floor/FloorVisualLanguage';
import { GalaConstructionBox } from '../modularHome/construction/GalaConstructionPrimitives';
import { useGalaConstructionPbrTextures } from '../modularHome/construction/GalaConstructionPbrTextures';

const GROUND_BASE_POLYGON_OFFSET = {
  factor: 1,
  units: 1,
} as const;

const GROUND_POLISH_POLYGON_OFFSET = {
  factor: -4,
  units: -4,
} as const;

const GROUND_DETAIL_POLYGON_OFFSET = {
  factor: -8,
  units: -8,
} as const;

function mixHex(hex: string, targetHex: string, ratio: number) {
  const normalized = hex.replace('#', '').padStart(6, '0').slice(0, 6);
  const target = targetHex.replace('#', '').padStart(6, '0').slice(0, 6);
  const channel = (value: string, index: number) => parseInt(value.slice(index, index + 2), 16);
  const mix = (value: number, targetValue: number) => Math.max(0, Math.min(255, Math.round(value + ((targetValue - value) * ratio))));
  return `#${[
    mix(channel(normalized, 0), channel(target, 0)),
    mix(channel(normalized, 2), channel(target, 2)),
    mix(channel(normalized, 4), channel(target, 4)),
  ].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function resolveGroundRibbonVisual(ribbon: GroundDetailRibbon) {
  if (ribbon.id === 'arrival-to-seam-spine') {
    return { color: '#90a4aa', emissive: '#7dd3fc', emissiveIntensity: 0.016 };
  }

  if (ribbon.id.includes('arrival-clear-lane')) {
    return { color: '#b8e4e8', emissive: '#7dd3fc', emissiveIntensity: 0.022 };
  }

  if (ribbon.id.includes('arrival-commercial-apron')) {
    return { color: ribbon.color, emissive: '#7dd3fc', emissiveIntensity: 0.016 };
  }

  if (ribbon.id.includes('sponsor')) {
    return { color: '#4f9e91', emissive: '#2dd4bf', emissiveIntensity: 0.009 };
  }

  if (ribbon.id.includes('stadium-transition') || ribbon.groundOwner === 'transition') {
    return { color: '#927b56', emissive: '#fbbf24', emissiveIntensity: 0.007 };
  }

  if (ribbon.groundOwner === 'stadium') {
    return { color: '#716f91', emissive: '#a78bfa', emissiveIntensity: 0.006 };
  }

  if (ribbon.id.includes('left-edge') || ribbon.id.includes('right-edge')) {
    return { color: '#5c7185', emissive: '#93c5fd', emissiveIntensity: 0.005 };
  }

  return { color: '#617986', emissive: '#38bdf8', emissiveIntensity: 0.006 };
}

function resolveGroundRibbonOpacity(ribbon: GroundDetailRibbon) {
  if (ribbon.id === 'arrival-to-seam-spine') {
    return 0.22;
  }

  if (ribbon.id.includes('arrival-to-seam') || ribbon.id === 'arrival-forecourt-wide-band') {
    return 0.155;
  }

  if (ribbon.id.includes('arrival-clear-lane')) {
    return Math.min(ribbon.opacity ?? 0.28, 0.3);
  }

  if (ribbon.id === 'arrival-commercial-apron') {
    return Math.min(ribbon.opacity ?? 0.2, 0.22);
  }

  if (ribbon.id.includes('arrival-commercial-apron')) {
    return Math.min(ribbon.opacity ?? 0.22, 0.26);
  }

  if (ribbon.id.includes('sponsor-left') || ribbon.id.includes('sponsor-right')) {
    return 0.11;
  }

  if (ribbon.groundOwner === 'transition') {
    return Math.min(resolveGroundDetailOpacity(ribbon) * 1.05, 0.13);
  }

  return Math.min(resolveGroundDetailOpacity(ribbon) * 1.35, 0.105);
}

function HomeStudioGroundPlane({
  color,
  position,
}: {
  color: string;
  position: [number, number, number];
}) {
  const groundPbrTextures = useGalaConstructionPbrTextures('ground');
  const groundThicknessM = 0.04;

  return (
    <GalaConstructionBox
      {...groundPbrTextures}
      castShadow={false}
      color={color}
      name="world-ground:global-base"
      position={[position[0], position[1] - groundThicknessM * 0.5, position[2]]}
      receiveShadow={false}
      roughness={0.92}
      size={[GLOBAL_GROUND_SIZE[0], groundThicknessM, GLOBAL_GROUND_SIZE[1]]}
      userData={{
        homeStudioGroundPbrMaterialApplied: true,
        worldGroundMaskedFromInterior: true,
      }}
    />
  );
}

export function WorldGroundPlane({
  homeStudioMode = false,
  lowDetail = false,
  visualProfile,
}: {
  homeStudioMode?: boolean;
  lowDetail?: boolean;
  visualProfile: ExpoWorldVisualProfile;
}) {
  const globalBaseMaterial = FLOOR_MATERIAL_INTENTS.globalBase;
  const globalGroundPosition: [number, number, number] = homeStudioMode
    ? [GLOBAL_GROUND_POSITION[0], -0.34, GLOBAL_GROUND_POSITION[2]]
    : GLOBAL_GROUND_POSITION;
  const globalGroundColor = homeStudioMode ? '#4f5f57' : mixHex(visualProfile.global.groundBase, '#9cacad', 0.5);
  const visibleGroundDetailRibbons = lowDetail
    ? GROUND_DETAIL_RIBBONS.filter((ribbon) => (
        ribbon.id === 'arrival-forecourt-wide-band'
        || ribbon.id === 'arrival-to-seam-spine'
        || ribbon.id.includes('arrival-commercial-apron')
        || ribbon.id.includes('sponsor-left')
        || ribbon.id.includes('sponsor-right')
      ))
    : GROUND_DETAIL_RIBBONS;

  return (
    <group
      name="world-ground:global"
      userData={{
        homeStudioGroundDetailDisabled: homeStudioMode,
        worldGroundMaskedFromInterior: homeStudioMode,
      }}
    >
      {homeStudioMode ? (
        <HomeStudioGroundPlane color={globalGroundColor} position={globalGroundPosition} />
      ) : (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={globalGroundPosition} receiveShadow={false} name="world-ground:global-base">
        <planeGeometry args={GLOBAL_GROUND_SIZE} />
        <meshStandardMaterial
          color={globalGroundColor}
          emissive={globalBaseMaterial.emissive}
          emissiveIntensity={globalBaseMaterial.emissiveIntensity}
          metalness={globalBaseMaterial.metalness}
          polygonOffset
          polygonOffsetFactor={GROUND_BASE_POLYGON_OFFSET.factor}
          polygonOffsetUnits={GROUND_BASE_POLYGON_OFFSET.units}
          roughness={globalBaseMaterial.roughness}
        />
      </mesh>
      )}
      {!homeStudioMode && visibleGroundDetailRibbons.map((ribbon) => {
        const ribbonVisual = resolveGroundRibbonVisual(ribbon);
        const ribbonOpacity = resolveGroundRibbonOpacity(ribbon);
        const useUnlitArrivalMarker = ribbon.id.includes('arrival-commercial-apron') || ribbon.id.includes('arrival-clear-lane');

        return (
          <mesh
            key={ribbon.id}
            name={`world-ground-detail:${ribbon.id}`}
            position={ribbon.position}
            raycast={() => undefined}
            receiveShadow={false}
            renderOrder={FLOOR_LAYER_ORDER.surfaceMarker}
            rotation={[-Math.PI / 2, 0, 0]}
            userData={{
              expoGroundDetailRole: 'premium-floor-detail-ribbon',
              expoGroundOwner: ribbon.groundOwner,
              expoInspectionTransparent: true,
              expoRaycastDisabled: true,
            }}
          >
            <planeGeometry args={ribbon.size} />
            {useUnlitArrivalMarker ? (
              <meshBasicMaterial
                color={ribbonVisual.color}
                depthWrite={false}
                opacity={ribbonOpacity}
                polygonOffset
                polygonOffsetFactor={GROUND_DETAIL_POLYGON_OFFSET.factor}
                polygonOffsetUnits={GROUND_DETAIL_POLYGON_OFFSET.units}
                toneMapped={false}
                transparent
              />
            ) : (
              <meshStandardMaterial
                color={ribbonVisual.color}
                depthWrite={false}
                emissive={ribbonVisual.emissive}
                emissiveIntensity={ribbonVisual.emissiveIntensity}
                metalness={0.018}
                opacity={ribbonOpacity}
                polygonOffset
                polygonOffsetFactor={GROUND_DETAIL_POLYGON_OFFSET.factor}
                polygonOffsetUnits={GROUND_DETAIL_POLYGON_OFFSET.units}
                roughness={0.84}
                transparent
              />
            )}
          </mesh>
        );
      })}
      {!homeStudioMode && !lowDetail ? (
      <mesh
        name={`world-ground:${GROUND_SEAM_TRANSITION_PLATE.id}`}
        position={GROUND_SEAM_TRANSITION_PLATE.position}
        raycast={() => undefined}
        receiveShadow={false}
        renderOrder={FLOOR_LAYER_ORDER.polishAnchor}
        rotation={[-Math.PI / 2, 0, 0]}
        userData={{
          expoGroundDetailRole: 'city-stadium-transition-polish',
          expoGroundFloorLanguageToken: GROUND_SEAM_TRANSITION_PLATE.floorLanguageToken,
          expoGroundIntent: GROUND_SEAM_TRANSITION_PLATE.intent,
          expoInspectionTransparent: true,
          expoRaycastDisabled: true,
        }}
      >
        <planeGeometry args={GROUND_SEAM_TRANSITION_PLATE.size} />
        <meshStandardMaterial
          color={GROUND_SEAM_TRANSITION_PLATE.color}
          depthWrite={false}
          emissive={globalBaseMaterial.emissive}
          emissiveIntensity={globalBaseMaterial.emissiveIntensity}
          metalness={globalBaseMaterial.metalness}
          polygonOffset
          polygonOffsetFactor={GROUND_POLISH_POLYGON_OFFSET.factor}
          polygonOffsetUnits={GROUND_POLISH_POLYGON_OFFSET.units}
          roughness={globalBaseMaterial.roughness}
        />
      </mesh>
      ) : null}
      {!homeStudioMode ? (
      <mesh
        name={`world-ground:${SPONSOR_BOULEVARD_RIGHT_FLOOR_ANCHOR.id}`}
        position={SPONSOR_BOULEVARD_RIGHT_FLOOR_ANCHOR.position}
        raycast={() => undefined}
        receiveShadow={false}
        renderOrder={FLOOR_LAYER_ORDER.polishAnchor}
        rotation={[-Math.PI / 2, 0, 0]}
        userData={{
          expoGroundDetailRole: 'sponsor-boulevard-right-floor-anchor',
          expoGroundFloorLanguageToken: SPONSOR_BOULEVARD_RIGHT_FLOOR_ANCHOR.floorLanguageToken,
          expoGroundIntent: SPONSOR_BOULEVARD_RIGHT_FLOOR_ANCHOR.intent,
          expoInspectionTransparent: true,
          expoRaycastDisabled: true,
        }}
      >
        <planeGeometry args={SPONSOR_BOULEVARD_RIGHT_FLOOR_ANCHOR.size} />
        <meshStandardMaterial
          color={SPONSOR_BOULEVARD_RIGHT_FLOOR_ANCHOR.color}
          depthWrite={false}
          emissive={globalBaseMaterial.emissive}
          emissiveIntensity={globalBaseMaterial.emissiveIntensity}
          metalness={globalBaseMaterial.metalness}
          polygonOffset
          polygonOffsetFactor={GROUND_POLISH_POLYGON_OFFSET.factor}
          polygonOffsetUnits={GROUND_POLISH_POLYGON_OFFSET.units}
          roughness={globalBaseMaterial.roughness}
        />
      </mesh>
      ) : null}
      {!homeStudioMode ? (
      <mesh
        name={`world-ground:${ARRIVAL_GATE_FLOOR_ANCHOR.id}`}
        position={ARRIVAL_GATE_FLOOR_ANCHOR.position}
        raycast={() => undefined}
        receiveShadow={false}
        renderOrder={FLOOR_LAYER_ORDER.polishAnchor}
        rotation={[-Math.PI / 2, 0, 0]}
        userData={{
          expoGroundDetailRole: 'arrival-gate-floor-anchor',
          expoGroundFloorLanguageToken: ARRIVAL_GATE_FLOOR_ANCHOR.floorLanguageToken,
          expoGroundIntent: ARRIVAL_GATE_FLOOR_ANCHOR.intent,
          expoInspectionTransparent: true,
          expoRaycastDisabled: true,
        }}
      >
        <planeGeometry args={ARRIVAL_GATE_FLOOR_ANCHOR.size} />
        <meshStandardMaterial
          color={ARRIVAL_GATE_FLOOR_ANCHOR.color}
          depthWrite={false}
          emissive={globalBaseMaterial.emissive}
          emissiveIntensity={globalBaseMaterial.emissiveIntensity}
          metalness={globalBaseMaterial.metalness}
          polygonOffset
          polygonOffsetFactor={GROUND_POLISH_POLYGON_OFFSET.factor}
          polygonOffsetUnits={GROUND_POLISH_POLYGON_OFFSET.units}
          roughness={globalBaseMaterial.roughness}
        />
      </mesh>
      ) : null}
      {!homeStudioMode ? (
      <mesh
        name={`world-ground:${CENTER_SPINE_FLOOR_GUIDE.id}`}
        position={CENTER_SPINE_FLOOR_GUIDE.position}
        raycast={() => undefined}
        receiveShadow={false}
        renderOrder={FLOOR_LAYER_ORDER.polishAnchor}
        rotation={[-Math.PI / 2, 0, 0]}
        userData={{
          expoGroundDetailRole: 'center-spine-floor-guide',
          expoGroundFloorLanguageToken: CENTER_SPINE_FLOOR_GUIDE.floorLanguageToken,
          expoGroundIntent: CENTER_SPINE_FLOOR_GUIDE.intent,
          expoInspectionTransparent: true,
          expoRaycastDisabled: true,
        }}
      >
        <planeGeometry args={CENTER_SPINE_FLOOR_GUIDE.size} />
        <meshStandardMaterial
          color={CENTER_SPINE_FLOOR_GUIDE.color}
          depthWrite={false}
          emissive={globalBaseMaterial.emissive}
          emissiveIntensity={globalBaseMaterial.emissiveIntensity}
          metalness={globalBaseMaterial.metalness}
          polygonOffset
          polygonOffsetFactor={GROUND_POLISH_POLYGON_OFFSET.factor}
          polygonOffsetUnits={GROUND_POLISH_POLYGON_OFFSET.units}
          roughness={globalBaseMaterial.roughness}
        />
      </mesh>
      ) : null}
    </group>
  );
}
