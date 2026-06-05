import { Html } from '@react-three/drei';
import type { Vector3Tuple } from 'three';
import { isHomeDemoEnabled } from './homeDemoFlags';
import {
  getModularHomeConfigSummary,
  MODULAR_HOME_FACADE_VISUALS,
  MODULAR_HOME_ROOF_VISUALS,
  MODULAR_HOME_TERRACE_VISUALS,
  useModularHomeConfigurator,
} from './modularHomeConfigurator';
import { getModularHomeTemplate } from './modularHomeConfig';

const GLASS_COLOR = '#7dd3fc';
const DECK_COLOR = '#8b5a2b';
const INTERIOR_FLOOR_COLOR = '#d6b98b';
const INTERIOR_WALL_COLOR = '#e8d7bd';

function TimberSlat({ color, position, scale }: { color: string; position: Vector3Tuple; scale: Vector3Tuple }) {
  return (
    <mesh position={position} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.76} metalness={0.02} />
    </mesh>
  );
}

function Window({ position, scale, trimColor }: { position: Vector3Tuple; scale: Vector3Tuple; trimColor: string }) {
  return (
    <group position={position}>
      <mesh scale={scale}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={GLASS_COLOR} emissive={GLASS_COLOR} emissiveIntensity={0.13} roughness={0.24} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0, 0.035]} scale={[scale[0] + 0.08, 0.035, 0.018]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={trimColor} roughness={0.68} />
      </mesh>
      <mesh position={[0, 0, 0.038]} scale={[0.032, scale[1] + 0.09, 0.018]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={trimColor} roughness={0.68} />
      </mesh>
    </group>
  );
}

function InteriorZoneLabel({
  label,
  position,
  tone,
}: {
  label: string;
  position: Vector3Tuple;
  tone: string;
}) {
  return (
    <Html position={position} center distanceFactor={50} occlude={false} pointerEvents="none">
      <div
        data-home-demo-interior-label={label}
        style={{
          background: 'rgba(15, 23, 42, 0.72)',
          border: `1px solid ${tone}`,
          borderRadius: '999px',
          color: '#fff7ed',
          fontFamily: 'inherit',
          fontSize: '0.56rem',
          fontWeight: 900,
          letterSpacing: '0.08em',
          padding: '4px 7px',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </Html>
  );
}

function HomeHotspotLabel({
  label,
  position,
  tone,
}: {
  label: string;
  position: Vector3Tuple;
  tone: string;
}) {
  return (
    <Html position={position} center distanceFactor={54} occlude={false} pointerEvents="none">
      <div
        data-home-demo-hotspot-label={label}
        style={{
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.78)',
          border: `1px solid ${tone}`,
          borderRadius: '999px',
          boxShadow: '0 10px 24px rgba(2, 6, 23, 0.3)',
          color: '#fff7ed',
          display: 'flex',
          fontFamily: 'inherit',
          fontSize: '0.52rem',
          fontWeight: 900,
          gap: '5px',
          letterSpacing: '0.05em',
          padding: '4px 7px',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            background: tone,
            borderRadius: '999px',
            boxShadow: `0 0 12px ${tone}`,
            display: 'block',
            height: '7px',
            width: '7px',
          }}
        />
        {label}
      </div>
    </Html>
  );
}

export function ModularHomeModel() {
  const { config: homeConfig } = useModularHomeConfigurator();

  if (!isHomeDemoEnabled()) {
    return null;
  }

  const config = getModularHomeTemplate(homeConfig.template);
  const facadeVisual = MODULAR_HOME_FACADE_VISUALS[homeConfig.facade];
  const roofVisual = MODULAR_HOME_ROOF_VISUALS[homeConfig.roof];
  const terraceVisual = MODULAR_HOME_TERRACE_VISUALS[homeConfig.terrace];
  const configSummary = getModularHomeConfigSummary(homeConfig);
  const [
    primaryHotspot = 'Living area',
    secondaryHotspot = 'Bedroom module',
    serviceHotspot = 'Bathroom core',
    terraceHotspot = 'Terrace option',
  ] = config.interiorLabels;
  const flatRoof = homeConfig.roof !== 'pitched';
  const terraceCenterZ = 18.8 + (terraceVisual.deckDepth / 2);
  const terraceFrontZ = 18.8 + terraceVisual.deckDepth;
  const terraceRailXs = homeConfig.terrace === 'extendedTerrace'
    ? [-38, -26, -14, -2, 10, 22, 34]
    : [-24, -12, 0, 12, 24];

  return (
    <group
      name="modular-home-preview-district"
      position={config.position}
      rotation={[0, config.rotationY, 0]}
      userData={{
        homeDemoConfig: homeConfig,
        homeDemoPreview: true,
        modularHomeId: config.id,
        modularHomeName: config.name,
        source: 'src/modules/expo/runtime/modularHome/ModularHomeModel.tsx',
      }}
    >
      <group name={`${config.id}-model`} scale={config.moduleScale}>
        <mesh position={[0, 0.12, 0]} scale={[92, 0.24, 62]} receiveShadow={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#3d2d1f" roughness={0.86} metalness={0.02} />
        </mesh>

        <mesh position={[0, 0.54, 0]} scale={[66, 0.26, 32]} name="compact-timber-40-interior-floor">
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={INTERIOR_FLOOR_COLOR} roughness={0.8} metalness={0.02} />
        </mesh>

        <mesh position={[0, 2.82, -18]} scale={[70, 5.2, 0.8]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={facadeVisual.wallColor} roughness={0.82} metalness={0.02} />
        </mesh>
        <mesh position={[-35.3, 2.82, 0]} scale={[0.8, 5.25, 36.4]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={facadeVisual.sideColor} roughness={0.86} metalness={0.02} />
        </mesh>
        <mesh position={[35.3, 2.82, 0]} scale={[0.8, 5.25, 36.4]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={facadeVisual.sideColor} roughness={0.86} metalness={0.02} />
        </mesh>
        <mesh position={[-23, 2.82, 18.2]} scale={[24, 5.2, 0.8]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={facadeVisual.wallColor} roughness={0.82} metalness={0.02} />
        </mesh>
        <mesh position={[25, 2.82, 18.2]} scale={[20, 5.2, 0.8]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={facadeVisual.wallColor} roughness={0.82} metalness={0.02} />
        </mesh>
        <mesh position={[1, 5.52, 18.2]} scale={[15, 0.76, 0.8]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={facadeVisual.wallColor} roughness={0.82} metalness={0.02} />
        </mesh>

        <mesh position={[-14, 0.73, 7]} scale={[28, 0.06, 16]} name="compact-timber-40-living-zone-floor">
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#8eead2" emissive="#0f766e" emissiveIntensity={0.04} roughness={0.74} />
        </mesh>
        <mesh position={[-16, 0.77, -10.5]} scale={[27, 0.06, 12]} name="compact-timber-40-bedroom-zone-floor">
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#fde68a" emissive="#92400e" emissiveIntensity={0.035} roughness={0.78} />
        </mesh>
        <mesh position={[22, 0.81, -10.5]} scale={[16, 0.06, 12]} name="compact-timber-40-service-zone-floor">
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#bfdbfe" emissive="#1d4ed8" emissiveIntensity={0.035} roughness={0.76} />
        </mesh>

        <mesh position={[-22, 2.55, -3.2]} scale={[18, 3.45, 0.5]} name="compact-timber-40-bedroom-partition">
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={INTERIOR_WALL_COLOR} roughness={0.8} metalness={0.02} />
        </mesh>
        <mesh position={[19, 2.55, -3.2]} scale={[24, 3.45, 0.5]} name="compact-timber-40-service-partition">
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={INTERIOR_WALL_COLOR} roughness={0.8} metalness={0.02} />
        </mesh>
        <mesh position={[12, 2.5, -10.5]} scale={[0.55, 3.3, 14]} name="compact-timber-40-bath-service-wall">
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={INTERIOR_WALL_COLOR} roughness={0.8} metalness={0.02} />
        </mesh>

        {flatRoof ? (
          <>
            <mesh position={[0, 6.65, 0]} scale={[76, 0.92, 40]} name={`compact-timber-40-roof-${homeConfig.roof}`}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={roofVisual.roofColor} roughness={0.72} metalness={0.04} />
            </mesh>
            {roofVisual.isGreenRoof && (
              <mesh position={[0, 7.18, 0]} scale={[70, 0.18, 34]} name="compact-timber-40-green-roof-placeholder">
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={roofVisual.accentColor} emissive="#3f6212" emissiveIntensity={0.05} roughness={0.86} />
              </mesh>
            )}
          </>
        ) : (
          <>
            <mesh position={[0, 6.75, -9.8]} rotation={[0.37, 0, 0]} scale={[75, 1.1, 24]} name="compact-timber-40-pitched-roof-back">
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={roofVisual.roofColor} roughness={0.72} metalness={0.04} />
            </mesh>
            <mesh position={[0, 6.55, 15.2]} rotation={[-0.22, 0, 0]} scale={[75, 0.64, 5.2]} name="compact-timber-40-pitched-roof-front">
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={roofVisual.roofColor} roughness={0.72} metalness={0.04} />
            </mesh>
            <mesh position={[0, 8.4, 0]} scale={[78, 0.52, 2.4]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={roofVisual.accentColor} roughness={0.7} />
            </mesh>
          </>
        )}

        {terraceVisual.enabled && (
          <>
            <mesh position={[0, 0.7, terraceCenterZ]} scale={[terraceVisual.deckWidth, 1.05, terraceVisual.deckDepth]} name={`compact-timber-40-terrace-${homeConfig.terrace}`}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={DECK_COLOR} roughness={0.82} metalness={0.01} />
            </mesh>
            {terraceRailXs.map((x) => (
              <TimberSlat key={x} color={facadeVisual.trimColor} position={[x, 1.38, terraceFrontZ]} scale={[1.8, 2.2, 1.8]} />
            ))}
            <mesh position={[0, 2.58, terraceFrontZ]} scale={[terraceVisual.deckWidth - 10, 1.2, 1.4]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={facadeVisual.trimColor} roughness={0.7} />
            </mesh>
          </>
        )}

        <Window position={[-19, 3.45, 18.24]} scale={[14, 2.25, 0.08]} trimColor={facadeVisual.trimColor} />
        <Window position={[18, 3.45, 18.24]} scale={[14, 2.25, 0.08]} trimColor={facadeVisual.trimColor} />
        <Window position={[-35.75, 3.25, -6]} scale={[0.08, 2.1, 10]} trimColor={facadeVisual.trimColor} />
        <Window position={[35.75, 3.25, -6]} scale={[0.08, 2.1, 10]} trimColor={facadeVisual.trimColor} />

        <mesh position={[-4.9, 2.58, 18.55]} scale={[0.6, 4.2, 0.32]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={facadeVisual.trimColor} roughness={0.68} metalness={0.05} />
        </mesh>
        <mesh position={[5.5, 2.58, 18.55]} scale={[0.6, 4.2, 0.32]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={facadeVisual.trimColor} roughness={0.68} metalness={0.05} />
        </mesh>
        <mesh position={[0.3, 4.72, 18.55]} scale={[11.4, 0.56, 0.32]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={facadeVisual.trimColor} roughness={0.68} metalness={0.05} />
        </mesh>
        <mesh position={[0, 1.15, 21.2]} scale={[11.5, 0.36, 4.4]} name="compact-timber-40-open-entry-threshold">
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#5a371d" roughness={0.82} metalness={0.02} />
        </mesh>
        <mesh position={[2.9, 2.2, 18.48]} scale={[0.42, 0.42, 0.18]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.12} roughness={0.45} />
        </mesh>

        {[-28, -14, 0, 14, 28].map((x) => (
          <TimberSlat key={`front-slat-${x}`} color={facadeVisual.trimColor} position={[x, 5.55, 18.46]} scale={[1.2, 0.8, 0.36]} />
        ))}
        {[-13, -6.5, 0, 6.5, 13].map((z) => (
          <TimberSlat key={`side-slat-${z}`} color={facadeVisual.trimColor} position={[-35.85, 5.45, z]} scale={[0.36, 0.7, 1.1]} />
        ))}

        <mesh position={[0, 0.16, 48.5]} scale={[40, 0.2, 14]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#6b4a2c" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.28, 57]} scale={[46, 0.16, 1.2]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.12} roughness={0.76} />
        </mesh>

        <InteriorZoneLabel label={config.livingLabel} position={[-14, 2.0, 7]} tone="rgba(142, 234, 210, 0.72)" />
        <InteriorZoneLabel label={config.bedroomLabel} position={[-16, 2.0, -10.5]} tone="rgba(253, 230, 138, 0.72)" />
        <InteriorZoneLabel label={config.bathroomLabel} position={[22, 2.0, -10.5]} tone="rgba(191, 219, 254, 0.72)" />
        <HomeHotspotLabel label={primaryHotspot} position={[-14, 2.72, 8.5]} tone="rgba(45, 212, 191, 0.82)" />
        <HomeHotspotLabel label={secondaryHotspot} position={[-16, 2.72, -12.3]} tone="rgba(251, 191, 36, 0.86)" />
        <HomeHotspotLabel label={serviceHotspot} position={[22, 2.72, -12.2]} tone="rgba(96, 165, 250, 0.86)" />
        <HomeHotspotLabel label={terraceHotspot} position={[0, 2.52, terraceVisual.enabled ? terraceFrontZ - 4 : 25]} tone="rgba(34, 197, 94, 0.86)" />
      </group>

      <Html position={[0, 14, 0]} center distanceFactor={58} occlude={false} pointerEvents="none">
        <div
          data-home-demo-model-label="true"
          data-home-config-model-summary={`${homeConfig.template}:${homeConfig.facade}:${homeConfig.roof}:${homeConfig.terrace}:${homeConfig.finishLevel}`}
          data-home-demo-model-template={config.templateId}
          style={{
            background: 'rgba(15, 23, 42, 0.84)',
            border: '1px solid rgba(251, 191, 36, 0.38)',
            borderRadius: '14px',
            boxShadow: '0 12px 34px rgba(2, 6, 23, 0.35)',
            color: '#fff7ed',
            fontFamily: 'inherit',
            lineHeight: 1.1,
            padding: '8px 10px',
            textAlign: 'center',
            transform: 'translateY(-10px)',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ color: '#fbbf24', fontSize: '0.58rem', fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {config.sizeLabel} preview
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 950, marginTop: '3px' }}>{config.name}</div>
          <div style={{ color: '#bbf7d0', fontSize: '0.54rem', fontWeight: 850, marginTop: '4px' }}>
            {configSummary.facade} / {configSummary.terrace}
          </div>
        </div>
      </Html>
    </group>
  );
}
