import type { ExpoWorldVisualProfile } from '../../world-contract';
import type { CanonicalPrimitive, CityMass } from '../planning/types';
import type { StadiumReserve } from './WorldCitySkeletonLayout';

function tintHex(hex: string, ratio: number) {
  const normalized = hex.replace('#', '').padStart(6, '0').slice(0, 6);
  const channel = (index: number) => parseInt(normalized.slice(index, index + 2), 16);
  const mix = (value: number) => Math.max(0, Math.min(255, Math.round(value + ((255 - value) * ratio))));
  return `#${[mix(channel(0)), mix(channel(2)), mix(channel(4))].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

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
    ? mixHex(tintHex(fallbackColor, 0.24), globalHudAccent, 0.26)
    : mixHex(tintHex(fallbackColor, 0.13), globalHudAccent, 0.18);
  const color = emissiveIntensity > 0.018 ? tintHex(base, 0.1) : base;
  const materialEmissive = emissiveIntensity > 0 ? emissive : globalHudAccent;
  const materialEmissiveIntensity = emissiveIntensity > 0
    ? emissiveIntensity + (emissive === globalHudAccent ? 0.004 : 0)
    : 0.01;

  return (
    <meshStandardMaterial
      color={color}
      roughness={emissiveIntensity > 0.012 ? 0.6 : 0.66}
      metalness={0.08}
      emissive={materialEmissive}
      emissiveIntensity={materialEmissiveIntensity}
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
    const hasEmissive = (primitive.emissiveIntensity ?? 0) > 0;
    const color = mixHex(tintHex(primitive.color, hasEmissive ? 0.08 : 0.03), globalHudAccent, hasEmissive ? 0.18 : 0.12);
    const emissive = primitive.emissive ?? globalHudAccent;
    const emissiveIntensity = (primitive.emissiveIntensity ?? 0) + (primitive.emissive ? 0 : 0.006);

    return (
      <mesh key={key} name={key} position={primitive.position} rotation={primitive.rotation}>
        <cylinderGeometry args={[primitive.radiusTop, primitive.radiusBottom, primitive.height, primitive.radialSegments ?? 16]} />
        <meshStandardMaterial
          color={color}
          depthWrite={primitive.transparent ? false : true}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={primitive.metalness ?? 0.16}
          opacity={primitive.opacity}
          roughness={primitive.roughness ?? 0.34}
          transparent={primitive.transparent}
        />
      </mesh>
    );
  }

  if (primitive.kind === 'torus') {
    const hasEmissive = (primitive.emissiveIntensity ?? 0) > 0;
    const color = mixHex(tintHex(primitive.color, hasEmissive ? 0.08 : 0.03), globalHudAccent, hasEmissive ? 0.2 : 0.14);
    const emissive = primitive.emissive ?? globalHudAccent;
    const emissiveIntensity = (primitive.emissiveIntensity ?? 0) + (primitive.emissive ? 0 : 0.008);

    return (
      <mesh key={key} name={key} position={primitive.position} rotation={primitive.rotation}>
        <torusGeometry
          args={[
            primitive.radius,
            primitive.tube,
            primitive.radialSegments ?? 12,
            primitive.tubularSegments ?? 96,
            primitive.arc ?? Math.PI * 2,
          ]}
        />
        <meshStandardMaterial
          color={color}
          depthWrite={primitive.transparent ? false : true}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={primitive.metalness ?? 0.18}
          opacity={primitive.opacity}
          roughness={primitive.roughness ?? 0.34}
          transparent={primitive.transparent}
        />
      </mesh>
    );
  }

  if (primitive.kind === 'sphere') {
    const hasEmissive = (primitive.emissiveIntensity ?? 0) > 0;
    const color = mixHex(tintHex(primitive.color, hasEmissive ? 0.08 : 0.03), globalHudAccent, hasEmissive ? 0.2 : 0.14);
    const emissive = primitive.emissive ?? globalHudAccent;
    const emissiveIntensity = (primitive.emissiveIntensity ?? 0) + (primitive.emissive ? 0 : 0.008);

    return (
      <mesh key={key} name={key} position={primitive.position}>
        <sphereGeometry args={[primitive.radius, primitive.widthSegments ?? 32, primitive.heightSegments ?? 18]} />
        <meshStandardMaterial
          color={color}
          depthWrite={primitive.transparent ? false : true}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={primitive.metalness ?? 0.12}
          opacity={primitive.opacity}
          roughness={primitive.roughness ?? 0.28}
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
  meshNamePrefix = 'city-mass',
  stadiumReserve: _stadiumReserve,
  visualProfile,
}: {
  masses: CityMass[];
  meshNamePrefix?: string;
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
                name={`${meshNamePrefix}:${mass.id}`}
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
              name={`${meshNamePrefix}:${mass.id}`}
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
                  <meshStandardMaterial color="#b7a5e8" emissive="#c084fc" emissiveIntensity={0.012} roughness={0.52} metalness={0.16} />
                </mesh>
              )}
              {intent?.showSignatureBand && (
                <mesh position={[0, mass.size[1] * 0.28, mass.size[2] * 0.18]}>
                  <boxGeometry args={[Math.max(12, mass.size[0] * 0.28), Math.max(8, mass.size[1] * 0.08), Math.max(6, mass.size[2] * 0.1)]} />
                  <meshStandardMaterial color="#5f7fba" emissive="#22e7ff" emissiveIntensity={0.02} roughness={0.42} metalness={0.2} />
                </mesh>
              )}
              {intent?.showSideInset && (
                <>
                  <mesh position={[-mass.size[0] * 0.24, mass.size[1] * 0.54, 0]}>
                    <boxGeometry args={[Math.max(8, mass.size[0] * 0.1), Math.max(16, mass.size[1] * 0.24), Math.max(8, mass.size[2] * 0.16)]} />
                    <meshStandardMaterial color="#6f5d93" emissive="#c084fc" emissiveIntensity={0.012} roughness={0.42} metalness={0.2} />
                  </mesh>
                  <mesh position={[mass.size[0] * 0.24, mass.size[1] * 0.5, 0]}>
                    <boxGeometry args={[Math.max(8, mass.size[0] * 0.08), Math.max(14, mass.size[1] * 0.2), Math.max(8, mass.size[2] * 0.14)]} />
                    <meshStandardMaterial color="#6d88bd" emissive="#22e7ff" emissiveIntensity={0.018} roughness={0.44} metalness={0.18} />
                  </mesh>
                </>
              )}
              {intent?.showSignatureBand && mass.size[1] > 48 && (
                <mesh position={[0, mass.size[1] * 0.62, 0]}>
                  <boxGeometry args={[Math.max(8, mass.size[0] * 0.16), Math.max(18, mass.size[1] * 0.18), Math.max(8, mass.size[2] * 0.16)]} />
                  <meshStandardMaterial color="#8c6fc5" emissive="#c084fc" emissiveIntensity={0.018} roughness={0.44} metalness={0.18} />
                </mesh>
              )}
              {intent?.showRearSpine && (
                <mesh position={[0, mass.size[1] * 0.68, -mass.size[2] * 0.22]}>
                  <boxGeometry args={[Math.max(8, mass.size[0] * 0.12), Math.max(18, mass.size[1] * 0.18), Math.max(6, mass.size[2] * 0.1)]} />
                  <meshStandardMaterial color="#84643f" emissive="#ffb84d" emissiveIntensity={0.016} roughness={0.44} metalness={0.16} />
                </mesh>
              )}
              {intent?.showFrontWing && (
                <mesh position={[0, mass.size[1] * 0.34, mass.size[2] * 0.22]}>
                  <boxGeometry args={[Math.max(12, mass.size[0] * 0.26), Math.max(10, mass.size[1] * 0.12), Math.max(6, mass.size[2] * 0.1)]} />
                  <meshStandardMaterial color="#3f83a6" emissive="#22e7ff" emissiveIntensity={0.016} roughness={0.42} metalness={0.18} />
                </mesh>
              )}
              {floorBandYs.map((floorY) => (
                <mesh key={`${mass.id}:floor-band:${floorY}`} position={[0, floorY, mass.size[2] * 0.51]}>
                  <boxGeometry args={[Math.max(12, mass.size[0] * 0.86), 1.6, 2.2]} />
                  <meshStandardMaterial color="#9ad7ff" emissive="#22e7ff" emissiveIntensity={0.02} roughness={0.38} metalness={0.18} />
                </mesh>
              ))}
              {intent?.showSideFloorBands && floorBandYs.flatMap((floorY) => ([
                <mesh key={`${mass.id}:floor-band-left:${floorY}`} position={[-mass.size[0] * 0.51, floorY, 0]}>
                  <boxGeometry args={[2.2, 1.6, Math.max(12, mass.size[2] * 0.74)]} />
                  <meshStandardMaterial color="#d8b4fe" emissive="#c084fc" emissiveIntensity={0.018} roughness={0.38} metalness={0.18} />
                </mesh>,
                <mesh key={`${mass.id}:floor-band-right:${floorY}`} position={[mass.size[0] * 0.51, floorY, 0]}>
                  <boxGeometry args={[2.2, 1.6, Math.max(12, mass.size[2] * 0.74)]} />
                  <meshStandardMaterial color="#ffe0a3" emissive="#ffb84d" emissiveIntensity={0.016} roughness={0.4} metalness={0.18} />
                </mesh>,
              ]))}
              {intent?.showMegaVerticalSpines && (
                <>
                  {[
                    [-0.43, 0.515, '#22e7ff', 0.028],
                    [0.43, 0.515, '#ffb84d', 0.024],
                    [-0.49, -0.43, '#c084fc', 0.02],
                    [0.49, -0.43, '#2dd4bf', 0.02],
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
                    <meshStandardMaterial color="#ffe0a3" emissive="#ffb84d" emissiveIntensity={0.026} roughness={0.32} metalness={0.24} />
                  </mesh>
                  <mesh position={[0, mass.size[1] * 0.92, 0]}>
                    <boxGeometry args={[mass.size[0] * 0.72, Math.max(8, mass.size[1] * 0.014), mass.size[2] * 0.72]} />
                    <meshStandardMaterial color="#b7a5e8" emissive="#c084fc" emissiveIntensity={0.024} roughness={0.34} metalness={0.24} />
                  </mesh>
                </>
              )}
              {intent?.showCrownBeacon && (
                <>
                  <mesh position={[0, mass.size[1] + (crownMastHeight * 0.5), 0]}>
                    <cylinderGeometry args={[crownMastRadius * 0.68, crownMastRadius, crownMastHeight, 12]} />
                    <meshStandardMaterial color="#22e7ff" emissive="#22e7ff" emissiveIntensity={0.034} roughness={0.38} metalness={0.22} />
                  </mesh>
                  <mesh position={[0, mass.size[1] + crownMastHeight + 3.2, 0]}>
                    <boxGeometry args={[Math.max(12, mass.size[0] * 0.22), 3.2, Math.max(12, mass.size[2] * 0.22)]} />
                    <meshStandardMaterial color="#ffcf75" emissive="#ffb84d" emissiveIntensity={0.03} roughness={0.32} metalness={0.24} />
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
