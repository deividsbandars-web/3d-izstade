import { Text } from '@react-three/drei';
import { SponsorTextureSurface } from '../booths';

type CityScreenAssignment = {
  accentColor: string;
  companyId: string | null;
  id: string;
  imageUrl: string | null;
  label: string;
  socketId: string;
  subtitle: string;
  tier: 'elite' | 'hero' | 'premium';
};

type CityScreenSocket = {
  color: string;
  frameSize: [number, number];
  id: string;
  kind: 'hero_wall' | 'tower_crown' | 'tower_side' | 'wall';
  position: [number, number, number];
  rotation: [number, number, number];
  surfaceId: string;
};

function getWorldScreenSemantic(socketKind: CityScreenSocket['kind']) {
  switch (socketKind) {
    case 'hero_wall':
      return { chip: 'CITY LANDMARK', mode: 'landmark' as const };
    case 'tower_crown':
      return { chip: 'TOWER BEACON', mode: 'beacon' as const };
    case 'tower_side':
      return { chip: 'CITY SIGNAL', mode: 'signal' as const };
    default:
      return { chip: 'DISTRICT SCREEN', mode: 'wayfinding' as const };
  }
}

function getTierAccent(tier: CityScreenAssignment['tier']) {
  switch (tier) {
    case 'hero':
      return '#fbbf24';
    case 'elite':
      return '#67e8f9';
    default:
      return '#93c5fd';
  }
}

export function WorldCityScreenAssignments({
  assignments,
  playerPosition,
  sockets,
}: {
  assignments: CityScreenAssignment[];
  playerPosition: [number, number, number];
  sockets: CityScreenSocket[];
}) {
  const socketById = new Map(sockets.map((socket) => [socket.id, socket]));

  return (
    <group name="world-city-screen-assignments">
      {assignments.map((assignment) => {
        const socket = socketById.get(assignment.socketId);
        if (!socket) {
          return null;
        }

        const dx = socket.position[0] - playerPosition[0];
        const dz = socket.position[2] - playerPosition[2];
        const distanceSq = (dx * dx) + (dz * dz);
        const distance = Math.sqrt(distanceSq);
        const maxDistance = assignment.tier === 'hero' ? 1700 : assignment.tier === 'elite' ? 1350 : 980;
        if (distanceSq > maxDistance * maxDistance) {
          return null;
        }

        const tierAccent = getTierAccent(assignment.tier);
        const semantic = getWorldScreenSemantic(socket.kind);
        const frameWidth = socket.frameSize[0] * 0.8;
        const frameHeight = socket.frameSize[1] * 0.8;
        const hasVisualAsset = Boolean(assignment.imageUrl);
        const frameInset = assignment.tier === 'hero' ? 0.94 : assignment.tier === 'elite' ? 0.93 : 0.92;
        const frameBorderOpacity = assignment.tier === 'hero' ? 0.95 : assignment.tier === 'elite' ? 0.82 : 0.7;
        const frameGlowOpacity =
          semantic.mode === 'landmark'
            ? (assignment.tier === 'hero' ? 0.18 : assignment.tier === 'elite' ? 0.13 : 0.09)
            : semantic.mode === 'beacon'
              ? 0.12
              : 0.08;
        const subtitleY = hasVisualAsset ? -(frameHeight * 0.39) : -(frameHeight * 0.34);
        const tierBadgeY = hasVisualAsset ? frameHeight * 0.4 : frameHeight * 0.34;
        const signalStripWidth =
          semantic.mode === 'landmark'
            ? frameWidth * 0.76
            : semantic.mode === 'beacon'
              ? frameWidth * 0.62
              : semantic.mode === 'signal'
                ? frameWidth * 0.54
                : frameWidth * 0.46;
        const chipColor =
          semantic.mode === 'landmark'
            ? '#fde68a'
            : semantic.mode === 'beacon'
              ? '#a5f3fc'
              : semantic.mode === 'signal'
                ? '#bfdbfe'
                : '#cbd5e1';
        const detailDistance = assignment.tier === 'hero' ? 1100 : assignment.tier === 'elite' ? 900 : 700;
        const subtitleDistance = assignment.tier === 'hero' ? 760 : assignment.tier === 'elite' ? 620 : 480;
        const showTierMeta = distance <= detailDistance;
        const showSubtitle = distance <= subtitleDistance;
        const showCenterTitle = !hasVisualAsset && distance <= detailDistance;
        const overlayOpacity = distance <= subtitleDistance ? 0.56 : distance <= detailDistance ? 0.44 : 0.3;
        const chipStripOpacity = distance <= detailDistance ? 0.68 : 0.52;
        const borderOpacityFactor = distance <= detailDistance ? 0.08 : 0.05;
        const topSignalOpacity =
          semantic.mode === 'landmark'
            ? (distance <= detailDistance ? 0.22 : 0.14)
            : distance <= detailDistance
              ? 0.16
              : 0.1;

        return (
          <group key={assignment.id} name={`world-city-screen:${semantic.mode}:${assignment.id}`} position={socket.position} rotation={socket.rotation}>
            <mesh position={[0, 0, 0.04]}>
              <planeGeometry args={[frameWidth, frameHeight]} />
              <meshBasicMaterial color="#08111c" transparent opacity={0.84} />
            </mesh>
            <mesh position={[0, 0, 0.045]}>
              <planeGeometry args={[frameWidth * frameInset, frameHeight * frameInset]} />
              <meshBasicMaterial color={tierAccent} transparent opacity={frameGlowOpacity} />
            </mesh>
            <mesh position={[0, 0, 0.06]}>
              <planeGeometry args={[frameWidth * 0.92, frameHeight * 0.92]} />
              {assignment.imageUrl ? (
                <SponsorTextureSurface fallbackColor={assignment.accentColor} opacity={0.92} url={assignment.imageUrl} />
              ) : (
                <meshBasicMaterial color={assignment.accentColor} transparent opacity={0.18} />
              )}
            </mesh>
            <mesh position={[0, 0, 0.065]}>
              <planeGeometry args={[frameWidth * 0.92, frameHeight * 0.92]} />
              <meshBasicMaterial color={assignment.accentColor} transparent opacity={assignment.imageUrl ? 0.08 : 0.12} />
            </mesh>
            <mesh position={[0, tierBadgeY + Math.max(0.16, frameHeight * 0.03), 0.075]}>
              <planeGeometry args={[signalStripWidth, Math.max(0.34, frameHeight * 0.08)]} />
              <meshBasicMaterial color="#020617" transparent opacity={chipStripOpacity} />
            </mesh>
            <Text
              anchorX="center"
              anchorY="top"
              color={chipColor}
              fontSize={Math.max(0.34, frameHeight * 0.06)}
              maxWidth={frameWidth * 0.86}
              outlineBlur={0.18}
              outlineColor="#020617"
              outlineWidth={0.04}
              position={[0, tierBadgeY, 0.08]}
            >
              {semantic.chip}
            </Text>
            {showTierMeta && (
              <Text
                anchorX="center"
                anchorY="top"
                color={tierAccent}
                fontSize={Math.max(0.2, frameHeight * 0.036)}
                maxWidth={frameWidth * 0.82}
                outlineBlur={0.12}
                outlineColor="#020617"
                outlineWidth={0.03}
                position={[0, tierBadgeY - Math.max(0.36, frameHeight * 0.08), 0.08]}
              >
                {assignment.tier.toUpperCase()}
              </Text>
            )}
            {hasVisualAsset && showSubtitle && (
              <mesh position={[0, -frameHeight * 0.33, 0.07]}>
                <planeGeometry args={[frameWidth * 0.92, frameHeight * 0.22]} />
                <meshBasicMaterial color="#020617" transparent opacity={overlayOpacity} />
              </mesh>
            )}
            {semantic.mode !== 'wayfinding' && (
              <mesh position={[0, frameHeight * 0.46, 0.09]}>
                <planeGeometry args={[frameWidth * 0.96, Math.max(0.12, frameHeight * 0.02)]} />
                <meshBasicMaterial color={tierAccent} transparent opacity={topSignalOpacity} />
              </mesh>
            )}
            {showCenterTitle && !hasVisualAsset && (
              <Text
                anchorX="center"
                anchorY="middle"
                color="#f8fafc"
                fontSize={Math.max(0.46, frameHeight * 0.1)}
                maxWidth={frameWidth * 0.82}
                outlineBlur={0.2}
                outlineColor="#020617"
                outlineWidth={0.05}
                position={[0, 0.04, 0.08]}
              >
                {assignment.label}
              </Text>
            )}
            {showSubtitle && (
              <Text
                anchorX="center"
                anchorY={hasVisualAsset ? 'middle' : 'bottom'}
                color={hasVisualAsset ? '#f8fafc' : '#cbd5e1'}
                fontSize={Math.max(hasVisualAsset ? 0.28 : 0.24, frameHeight * (hasVisualAsset ? 0.054 : 0.048))}
                maxWidth={frameWidth * (hasVisualAsset ? 0.74 : 0.84)}
                outlineBlur={0.16}
                outlineColor="#020617"
                outlineWidth={0.04}
                position={[0, subtitleY, 0.08]}
              >
                {hasVisualAsset ? assignment.label : assignment.subtitle}
              </Text>
            )}
            {hasVisualAsset && showSubtitle && (
              <Text
                anchorX="center"
                anchorY="bottom"
                color="#cbd5e1"
                fontSize={Math.max(0.2, frameHeight * 0.038)}
                maxWidth={frameWidth * 0.8}
                outlineBlur={0.14}
                outlineColor="#020617"
                outlineWidth={0.04}
                position={[0, -frameHeight * 0.46, 0.08]}
              >
                {assignment.subtitle}
              </Text>
            )}
            <mesh position={[0, 0, 0.09]}>
              <planeGeometry args={[frameWidth * 1.02, frameHeight * 1.02]} />
              <meshBasicMaterial color={tierAccent} transparent opacity={frameBorderOpacity * borderOpacityFactor} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
