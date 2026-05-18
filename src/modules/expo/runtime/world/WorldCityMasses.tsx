import type { ExpoWorldVisualProfile } from '../../world-contract';
import type { CanonicalPrimitive, CityMass } from '../planning/types';
import type { StadiumReserve } from './WorldCitySkeletonLayout';

function tintHex(hex: string, ratio: number) {
  const normalized = hex.replace('#', '').padStart(6, '0').slice(0, 6);
  const channel = (index: number) => parseInt(normalized.slice(index, index + 2), 16);
  const mix = (value: number) => Math.max(0, Math.min(255, Math.round(value + ((255 - value) * ratio))));
  return `#${[mix(channel(0)), mix(channel(2)), mix(channel(4))].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function WorldArchitecturalMassMaterial({
  fallbackColor,
  globalHudAccent,
  emissive = '#000000',
  emissiveIntensity = 0,
}: {
  fallbackColor: string;
  globalHudAccent: string;
  emissive?: string;
  emissiveIntensity?: number;
}) {
  const base = emissiveIntensity > 0.012
    ? tintHex(fallbackColor, 0.18)
    : tintHex(fallbackColor, 0.08);
  const color = emissiveIntensity > 0.018 ? tintHex(base, 0.08) : base;

  return (
    <meshStandardMaterial
      color={color}
      roughness={emissiveIntensity > 0.012 ? 0.64 : 0.7}
      metalness={0.06}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity + (emissiveIntensity > 0 && emissive === globalHudAccent ? 0.004 : 0)}
    />
  );
}

function renderCityMassPrimitive(
  primitive: CanonicalPrimitive,
  key: string,
  globalHudAccent: string,
) {
  if (primitive.kind === 'box') {
    return (
      <mesh key={key} name={key} position={primitive.position} rotation={primitive.rotation} receiveShadow>
        <boxGeometry args={primitive.size} />
        <WorldArchitecturalMassMaterial
          fallbackColor={primitive.color}
          globalHudAccent={globalHudAccent}
          emissive={primitive.emissive}
          emissiveIntensity={primitive.emissiveIntensity}
        />
      </mesh>
    );
  }

  if (primitive.kind === 'cylinder') {
    return (
      <mesh key={key} name={key} position={primitive.position} rotation={primitive.rotation}>
        <cylinderGeometry args={[primitive.radiusTop, primitive.radiusBottom, primitive.height, primitive.radialSegments ?? 16]} />
        <meshStandardMaterial
          color={primitive.color}
          depthWrite={primitive.transparent ? false : true}
          emissive={primitive.emissive}
          emissiveIntensity={primitive.emissiveIntensity ?? 0}
          metalness={primitive.metalness ?? 0.16}
          opacity={primitive.opacity}
          roughness={primitive.roughness ?? 0.34}
          transparent={primitive.transparent}
        />
      </mesh>
    );
  }

  if (primitive.kind === 'plane') {
    return (
      <mesh key={key} name={key} position={primitive.position} rotation={primitive.rotation} renderOrder={2}>
        <planeGeometry args={primitive.size} />
        <meshStandardMaterial
          color={primitive.color}
          depthWrite={primitive.transparent ? false : true}
          opacity={primitive.opacity}
          polygonOffset={primitive.transparent}
          polygonOffsetFactor={primitive.transparent ? -2 : 0}
          polygonOffsetUnits={primitive.transparent ? -2 : 0}
          roughness={0.42}
          transparent={primitive.transparent}
        />
      </mesh>
    );
  }

  return null;
}

export function WorldCityMasses({
  masses,
  stadiumReserve: _stadiumReserve,
  visualProfile,
}: {
  masses: CityMass[];
  stadiumReserve: StadiumReserve;
  visualProfile: ExpoWorldVisualProfile;
}) {
  void _stadiumReserve;

  return (
    <>
      {masses.map((mass) => {
          const intent = mass.renderIntent;
          const primitives = intent?.primitives ?? [];
          const verticalBaseY = mass.vertical?.baseY ?? 0;
          const floorBandYs = mass.vertical && mass.vertical.floorCount > 1
            ? Array.from({ length: mass.vertical.floorCount - 1 }, (_, index) => (index + 1) * mass.vertical!.floorHeight)
                .filter((floorY) => floorY > 4 && floorY < mass.size[1] - 4)
            : [];
          const crownMastHeight = Math.max(26, Math.min(180, mass.size[1] * 0.08));
          const crownMastRadius = Math.max(2.2, Math.min(7.5, Math.min(mass.size[0], mass.size[2]) * 0.07));
          const megaSpineHeight = mass.size[1] * 0.88;
          const megaSpineWidth = Math.max(3.2, Math.min(7, Math.min(mass.size[0], mass.size[2]) * 0.055));

          if (intent?.skipBase && primitives.length === 0) {
            return null;
          }

          if (intent?.skipBase) {
            return (
              <group
                key={mass.id}
                name={`city-mass:${mass.id}`}
                position={[mass.position[0], verticalBaseY, mass.position[2]]}
                rotation={mass.rotation ?? [0, 0, 0]}
              >
                {primitives.map((primitive, index) =>
                  renderCityMassPrimitive(primitive, `${mass.id}:${primitive.kind}:${index}`, visualProfile.global.hudAccent),
                )}
              </group>
            );
          }

          return (
            <group
              key={mass.id}
              name={`city-mass:${mass.id}`}
              position={[mass.position[0], verticalBaseY, mass.position[2]]}
              rotation={mass.rotation ?? [0, 0, 0]}
            >
              <mesh receiveShadow position={[0, mass.size[1] * 0.5, 0]}>
                <boxGeometry args={mass.size} />
                <WorldArchitecturalMassMaterial
                  fallbackColor={mass.color}
                  globalHudAccent={visualProfile.global.hudAccent}
                  emissive={intent?.emissive ?? '#000000'}
                  emissiveIntensity={intent?.emissiveIntensity ?? 0}
                />
              </mesh>
              {intent?.showHorizontalCap && (
                <mesh position={[0, mass.size[1] + 0.4, 0]}>
                  <boxGeometry args={[mass.size[0] * 0.78, 0.9, mass.size[2] * 0.78]} />
                  <meshStandardMaterial color="#96a5b0" roughness={0.58} metalness={0.14} />
                </mesh>
              )}
              {intent?.showSignatureBand && (
                <mesh position={[0, mass.size[1] * 0.28, mass.size[2] * 0.18]}>
                  <boxGeometry args={[Math.max(12, mass.size[0] * 0.28), Math.max(8, mass.size[1] * 0.08), Math.max(6, mass.size[2] * 0.1)]} />
                  <meshStandardMaterial color="#8f9ea9" emissive="#bdd7e6" emissiveIntensity={0.012} roughness={0.46} metalness={0.18} />
                </mesh>
              )}
              {intent?.showSideInset && (
                <>
                  <mesh position={[-mass.size[0] * 0.24, mass.size[1] * 0.54, 0]}>
                    <boxGeometry args={[Math.max(8, mass.size[0] * 0.1), Math.max(16, mass.size[1] * 0.24), Math.max(8, mass.size[2] * 0.16)]} />
                    <meshStandardMaterial color="#90a0ab" roughness={0.46} metalness={0.18} />
                  </mesh>
                  <mesh position={[mass.size[0] * 0.24, mass.size[1] * 0.5, 0]}>
                    <boxGeometry args={[Math.max(8, mass.size[0] * 0.08), Math.max(14, mass.size[1] * 0.2), Math.max(8, mass.size[2] * 0.14)]} />
                    <meshStandardMaterial color="#8a99a4" emissive="#b5cfde" emissiveIntensity={0.012} roughness={0.48} metalness={0.16} />
                  </mesh>
                </>
              )}
              {intent?.showSignatureBand && mass.size[1] > 48 && (
                <mesh position={[0, mass.size[1] * 0.62, 0]}>
                  <boxGeometry args={[Math.max(8, mass.size[0] * 0.16), Math.max(18, mass.size[1] * 0.18), Math.max(8, mass.size[2] * 0.16)]} />
                  <meshStandardMaterial color="#93a2ac" emissive="#b9d4e3" emissiveIntensity={0.012} roughness={0.48} metalness={0.16} />
                </mesh>
              )}
              {intent?.showRearSpine && (
                <mesh position={[0, mass.size[1] * 0.68, -mass.size[2] * 0.22]}>
                  <boxGeometry args={[Math.max(8, mass.size[0] * 0.12), Math.max(18, mass.size[1] * 0.18), Math.max(6, mass.size[2] * 0.1)]} />
                  <meshStandardMaterial color="#8897a2" emissive="#b5cfde" emissiveIntensity={0.01} roughness={0.48} metalness={0.14} />
                </mesh>
              )}
              {intent?.showFrontWing && (
                <mesh position={[0, mass.size[1] * 0.34, mass.size[2] * 0.22]}>
                  <boxGeometry args={[Math.max(12, mass.size[0] * 0.26), Math.max(10, mass.size[1] * 0.12), Math.max(6, mass.size[2] * 0.1)]} />
                  <meshStandardMaterial color="#91a0ab" emissive="#bdd7e6" emissiveIntensity={0.01} roughness={0.46} metalness={0.16} />
                </mesh>
              )}
              {floorBandYs.map((floorY) => (
                <mesh key={`${mass.id}:floor-band:${floorY}`} position={[0, floorY, mass.size[2] * 0.51]}>
                  <boxGeometry args={[Math.max(12, mass.size[0] * 0.86), 1.6, 2.2]} />
                  <meshStandardMaterial color="#c8d8e2" emissive="#bfe8ff" emissiveIntensity={0.014} roughness={0.42} metalness={0.16} />
                </mesh>
              ))}
              {intent?.showSideFloorBands && floorBandYs.flatMap((floorY) => ([
                <mesh key={`${mass.id}:floor-band-left:${floorY}`} position={[-mass.size[0] * 0.51, floorY, 0]}>
                  <boxGeometry args={[2.2, 1.6, Math.max(12, mass.size[2] * 0.74)]} />
                  <meshStandardMaterial color="#bfd0da" emissive="#bfe8ff" emissiveIntensity={0.012} roughness={0.42} metalness={0.16} />
                </mesh>,
                <mesh key={`${mass.id}:floor-band-right:${floorY}`} position={[mass.size[0] * 0.51, floorY, 0]}>
                  <boxGeometry args={[2.2, 1.6, Math.max(12, mass.size[2] * 0.74)]} />
                  <meshStandardMaterial color="#b3c4cf" emissive="#bfe8ff" emissiveIntensity={0.01} roughness={0.44} metalness={0.16} />
                </mesh>,
              ]))}
              {intent?.showMegaVerticalSpines && (
                <>
                  {[
                    [-0.43, 0.515, '#8ee8ff', 0.026],
                    [0.43, 0.515, '#8ee8ff', 0.026],
                    [-0.49, -0.43, '#b6e4f8', 0.018],
                    [0.49, -0.43, '#b6e4f8', 0.018],
                  ].map(([xRatio, zRatio, color, intensity]) => (
                    <mesh
                      key={`${mass.id}:mega-spine:${xRatio}:${zRatio}`}
                      position={[mass.size[0] * Number(xRatio), mass.size[1] * 0.5, mass.size[2] * Number(zRatio)]}
                    >
                      <boxGeometry args={[megaSpineWidth, megaSpineHeight, megaSpineWidth]} />
                      <meshStandardMaterial
                        color={String(color)}
                        emissive={String(color)}
                        emissiveIntensity={Number(intensity)}
                        roughness={0.34}
                        metalness={0.26}
                      />
                    </mesh>
                  ))}
                  <mesh position={[0, mass.size[1] * 0.78, mass.size[2] * 0.515]}>
                    <boxGeometry args={[mass.size[0] * 1.08, Math.max(8, mass.size[1] * 0.018), 4.2]} />
                    <meshStandardMaterial color="#c7e4f0" emissive="#9fe8ff" emissiveIntensity={0.024} roughness={0.36} metalness={0.22} />
                  </mesh>
                  <mesh position={[0, mass.size[1] * 0.92, 0]}>
                    <boxGeometry args={[mass.size[0] * 0.72, Math.max(8, mass.size[1] * 0.014), mass.size[2] * 0.72]} />
                    <meshStandardMaterial color="#a9c3cf" emissive="#93e1ff" emissiveIntensity={0.018} roughness={0.38} metalness={0.24} />
                  </mesh>
                </>
              )}
              {intent?.showCrownBeacon && (
                <>
                  <mesh position={[0, mass.size[1] + (crownMastHeight * 0.5), 0]}>
                    <cylinderGeometry args={[crownMastRadius * 0.68, crownMastRadius, crownMastHeight, 12]} />
                    <meshStandardMaterial color="#7ed5f4" emissive="#7ed5f4" emissiveIntensity={0.036} roughness={0.38} metalness={0.22} />
                  </mesh>
                  <mesh position={[0, mass.size[1] + crownMastHeight + 3.2, 0]}>
                    <boxGeometry args={[Math.max(12, mass.size[0] * 0.22), 3.2, Math.max(12, mass.size[2] * 0.22)]} />
                    <meshStandardMaterial color="#a8d9eb" emissive="#7ed5f4" emissiveIntensity={0.024} roughness={0.36} metalness={0.24} />
                  </mesh>
                </>
              )}
              {primitives.map((primitive, index) =>
                renderCityMassPrimitive(primitive, `${mass.id}:${primitive.kind}:${index}`, visualProfile.global.hudAccent),
              )}
            </group>
          );
        })}
    </>
  );
}
