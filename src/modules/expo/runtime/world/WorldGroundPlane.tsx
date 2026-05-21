import type { ExpoWorldVisualProfile } from '../../world-contract';
import {
  ARRIVAL_GATE_FLOOR_ANCHOR,
  CENTER_SPINE_FLOOR_GUIDE,
  GLOBAL_GROUND_POSITION,
  GLOBAL_GROUND_SIZE,
  GROUND_SEAM_TRANSITION_PLATE,
  SPONSOR_BOULEVARD_RIGHT_FLOOR_ANCHOR,
} from './WorldGroundLayout';
import { FLOOR_MATERIAL_INTENTS } from './floor/FloorVisualLanguage';

export function WorldGroundPlane({ visualProfile }: { visualProfile: ExpoWorldVisualProfile }) {
  const arrivalAnchorMaterial = FLOOR_MATERIAL_INTENTS[ARRIVAL_GATE_FLOOR_ANCHOR.materialIntent];
  const centerSpineGuideMaterial = FLOOR_MATERIAL_INTENTS[CENTER_SPINE_FLOOR_GUIDE.materialIntent];
  const globalBaseMaterial = FLOOR_MATERIAL_INTENTS.globalBase;
  const seamTransitionMaterial = FLOOR_MATERIAL_INTENTS[GROUND_SEAM_TRANSITION_PLATE.materialIntent];
  const sponsorAnchorMaterial = FLOOR_MATERIAL_INTENTS[SPONSOR_BOULEVARD_RIGHT_FLOOR_ANCHOR.materialIntent];

  return (
    <group name="world-ground:global">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={GLOBAL_GROUND_POSITION} receiveShadow={false} name="world-ground:global-base">
        <planeGeometry args={GLOBAL_GROUND_SIZE} />
        <meshStandardMaterial
          color={visualProfile.global.groundBase}
          emissive={globalBaseMaterial.emissive}
          emissiveIntensity={globalBaseMaterial.emissiveIntensity}
          metalness={globalBaseMaterial.metalness}
          roughness={globalBaseMaterial.roughness}
        />
      </mesh>
      <mesh
        name={`world-ground:${GROUND_SEAM_TRANSITION_PLATE.id}`}
        position={GROUND_SEAM_TRANSITION_PLATE.position}
        raycast={() => undefined}
        receiveShadow={false}
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
          emissive={seamTransitionMaterial.emissive}
          emissiveIntensity={seamTransitionMaterial.emissiveIntensity}
          metalness={seamTransitionMaterial.metalness}
          roughness={seamTransitionMaterial.roughness}
        />
      </mesh>
      <mesh
        name={`world-ground:${SPONSOR_BOULEVARD_RIGHT_FLOOR_ANCHOR.id}`}
        position={SPONSOR_BOULEVARD_RIGHT_FLOOR_ANCHOR.position}
        raycast={() => undefined}
        receiveShadow={false}
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
          emissive={sponsorAnchorMaterial.emissive}
          emissiveIntensity={sponsorAnchorMaterial.emissiveIntensity}
          metalness={sponsorAnchorMaterial.metalness}
          roughness={sponsorAnchorMaterial.roughness}
        />
      </mesh>
      <mesh
        name={`world-ground:${ARRIVAL_GATE_FLOOR_ANCHOR.id}`}
        position={ARRIVAL_GATE_FLOOR_ANCHOR.position}
        raycast={() => undefined}
        receiveShadow={false}
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
          emissive={arrivalAnchorMaterial.emissive}
          emissiveIntensity={arrivalAnchorMaterial.emissiveIntensity}
          metalness={arrivalAnchorMaterial.metalness}
          roughness={arrivalAnchorMaterial.roughness}
        />
      </mesh>
      <mesh
        name={`world-ground:${CENTER_SPINE_FLOOR_GUIDE.id}`}
        position={CENTER_SPINE_FLOOR_GUIDE.position}
        raycast={() => undefined}
        receiveShadow={false}
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
          emissive={centerSpineGuideMaterial.emissive}
          emissiveIntensity={centerSpineGuideMaterial.emissiveIntensity}
          metalness={centerSpineGuideMaterial.metalness}
          roughness={centerSpineGuideMaterial.roughness}
        />
      </mesh>
    </group>
  );
}
