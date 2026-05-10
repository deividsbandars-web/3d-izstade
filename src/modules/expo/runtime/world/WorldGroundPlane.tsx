import type { ExpoWorldVisualProfile } from '../../world-contract';
import {
  GLOBAL_GROUND_POSITION,
  GLOBAL_GROUND_SIZE,
  GROUND_DETAIL_RIBBONS,
  resolveGroundDetailOpacity,
} from './WorldGroundLayout';

function parseHex(hex: string) {
  const normalized = hex.replace('#', '').padStart(6, '0').slice(0, 6);
  return [0, 2, 4].map((index) => parseInt(normalized.slice(index, index + 2), 16));
}

function formatHex(channels: number[]) {
  return `#${channels.map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('')}`;
}

function blendHex(source: string, target: string, targetRatio: number) {
  const sourceChannels = parseHex(source);
  const targetChannels = parseHex(target);
  return formatHex(sourceChannels.map((value, index) => value + ((targetChannels[index] - value) * targetRatio)));
}

function resolveGroundDetailTone(color: string, groundBase: string) {
  return blendHex(color, groundBase, 0.82);
}

function GroundDetailRibbons({ groundBase }: { groundBase: string }) {
  return (
    <group name="world-ground:global-guide-ribbons">
      {GROUND_DETAIL_RIBBONS.map((ribbon) => {
        const opacity = resolveGroundDetailOpacity(ribbon);

        return (
          <mesh
            key={ribbon.id}
            name={`world-ground-guide:${ribbon.id}`}
            position={ribbon.position}
            receiveShadow={false}
            renderOrder={3}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={ribbon.size} />
            <meshStandardMaterial
              color={resolveGroundDetailTone(ribbon.color, groundBase)}
              depthWrite={false}
              metalness={0.01}
              opacity={opacity}
              roughness={0.94}
              transparent
            />
          </mesh>
        );
      })}
    </group>
  );
}

export function WorldGroundPlane({ visualProfile }: { visualProfile: ExpoWorldVisualProfile }) {
  return (
    <group name="world-ground:global">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={GLOBAL_GROUND_POSITION} receiveShadow={false} name="world-ground:global-base">
        <planeGeometry args={GLOBAL_GROUND_SIZE} />
        <meshStandardMaterial color={visualProfile.global.groundBase} roughness={0.98} metalness={0.01} />
      </mesh>
      <GroundDetailRibbons groundBase={visualProfile.global.groundBase} />
    </group>
  );
}
