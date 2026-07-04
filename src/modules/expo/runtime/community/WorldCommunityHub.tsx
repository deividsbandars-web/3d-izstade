import { Text } from '@react-three/drei';
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { expoCommunityService, type ExpoCommunityResponse } from '../../../../app/expo/expoCommunityService';
import type { ExpoCommunityEntry, ExpoCommunityGraffiti } from '../../../../shared/expo/communityContent';

export const EXPO_COMMUNITY_HUB_POSITION = [-24, 0, -29] as const;

const CITY_SPRAY_PLACEMENTS = [
  { label: 'Boulevard wall', position: [-18, 2.6, -42] as [number, number, number], rotationY: -0.18 },
  { label: 'Sponsor lane', position: [18, 2.4, -58] as [number, number, number], rotationY: 0.22 },
  { label: 'Left district', position: [-76, 2.8, -96] as [number, number, number], rotationY: 0.42 },
  { label: 'Right district', position: [76, 2.8, -92] as [number, number, number], rotationY: -0.42 },
  { label: 'Community kiosk', position: [-42, 2.3, -28] as [number, number, number], rotationY: 0.62 },
  { label: 'Arrival marker', position: [0, 2.5, -24] as [number, number, number], rotationY: 0 },
] as const;

function openBoard(event: { stopPropagation: () => void }) {
  event.stopPropagation();
  window.dispatchEvent(new Event('expo:open-community-board'));
}

function shortLine(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

function getEntryAccent(entry: ExpoCommunityEntry) {
  if (entry.kind === 'advert') return '#f59e0b';
  if (entry.kind === 'voice') return '#a78bfa';
  return '#22d3ee';
}

function getEntryLabel(entry: ExpoCommunityEntry) {
  if (entry.kind === 'advert') return 'SMALL AD';
  if (entry.kind === 'voice') return 'VOICE NOTE';
  return 'MESSAGE';
}

function BoardEntryCard({ entry, index }: { entry: ExpoCommunityEntry; index: number }) {
  const accent = getEntryAccent(entry);

  return (
    <group position={[-4.85, 4.68 - (index * 1.58), 0.34]}>
      <mesh>
        <boxGeometry args={[6.15, 1.24, 0.16]} />
        <meshStandardMaterial color="#13283a" emissive="#06111d" emissiveIntensity={0.28} roughness={0.72} metalness={0.1} />
      </mesh>
      <mesh position={[-2.92, 0, 0.12]}>
        <boxGeometry args={[0.12, 1.02, 0.08]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.42} />
      </mesh>
      <Text anchorX="left" color={accent} fontSize={0.2} fontWeight={900} maxWidth={5.4} position={[-2.68, 0.35, 0.18]}>
        {getEntryLabel(entry)}
      </Text>
      <Text anchorX="left" color="#f8fafc" fontSize={0.35} fontWeight={900} maxWidth={5.4} position={[-2.68, 0.01, 0.18]}>
        {shortLine(entry.title, 34)}
      </Text>
      <Text anchorX="left" anchorY="top" color="#cbd5e1" fontSize={0.21} lineHeight={1.12} maxWidth={5.25} position={[-2.68, -0.31, 0.18]}>
        {shortLine(entry.body, 82)}
      </Text>
    </group>
  );
}

function BoardFeatureCard({
  accent,
  detail,
  label,
  position,
}: {
  accent: string;
  detail: string;
  label: string;
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[4.45, 1.08, 0.15]} />
        <meshStandardMaterial color="#172337" emissive="#070f1d" emissiveIntensity={0.24} roughness={0.78} metalness={0.08} />
      </mesh>
      <mesh position={[-2.02, 0, 0.11]}>
        <boxGeometry args={[0.1, 0.82, 0.08]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} />
      </mesh>
      <Text anchorX="left" color="#f8fafc" fontSize={0.31} fontWeight={900} maxWidth={3.65} position={[-1.82, 0.2, 0.17]}>
        {label}
      </Text>
      <Text anchorX="left" color="#94a3b8" fontSize={0.17} lineHeight={1.12} maxWidth={3.65} position={[-1.82, -0.24, 0.17]}>
        {detail}
      </Text>
    </group>
  );
}

function GraffitiWallMark({
  mark,
  position,
  rotationZ,
}: {
  mark: ExpoCommunityGraffiti;
  position: [number, number, number];
  rotationZ: number;
}) {
  const [textureState, setTextureState] = useState<{ texture: THREE.Texture; url: string } | null>(null);
  const texture = textureState && textureState.url === mark.logoUrl ? textureState.texture : null;

  useEffect(() => {
    let disposed = false;
    let loadedTexture: THREE.Texture | null = null;

    if (!mark.logoUrl) {
      return () => {};
    }

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      mark.logoUrl,
      (nextTexture) => {
        if (disposed) {
          nextTexture.dispose();
          return;
        }

        nextTexture.colorSpace = THREE.SRGBColorSpace;
        nextTexture.anisotropy = 2;
        loadedTexture = nextTexture;
        setTextureState({ texture: nextTexture, url: mark.logoUrl || '' });
      },
      undefined,
      () => {
        if (!disposed) loadedTexture = null;
      },
    );

    return () => {
      disposed = true;
      loadedTexture?.dispose();
    };
  }, [mark.logoUrl]);

  if (texture) {
    return (
      <group position={position} rotation={[0, 0, rotationZ]}>
        <mesh>
          <planeGeometry args={[1.82, 1]} />
          <meshBasicMaterial color="#0f172a" transparent opacity={0.84} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[1.56, 0.72]} />
          <meshBasicMaterial map={texture} transparent toneMapped={false} />
        </mesh>
        {mark.markText && (
          <Text anchorX="center" color={mark.color} fontSize={0.18} maxWidth={1.7} outlineColor="#020617" outlineWidth={0.018} position={[0, -0.54, 0.05]}>
            {mark.markText}
          </Text>
        )}
      </group>
    );
  }

  return (
    <Text anchorX="center" color={mark.color} fontSize={mark.logoUrl ? 0.34 : 0.5} maxWidth={2.1} outlineColor="#020617" outlineWidth={0.025} position={position} rotation={[0, 0, rotationZ]}>
      {mark.markText || 'LOGO'}
    </Text>
  );
}

function CitySprayMark({ mark }: { mark: ExpoCommunityGraffiti }) {
  const fallbackPlacement = CITY_SPRAY_PLACEMENTS[mark.wallSlot % CITY_SPRAY_PLACEMENTS.length];
  const placement = mark.placement
    ? {
      label: mark.placement.surfaceLabel,
      normal: new THREE.Vector3(mark.placement.normalX ?? 0, mark.placement.normalY ?? 0, mark.placement.normalZ ?? 1),
      position: [mark.placement.x, mark.placement.y, mark.placement.z] as [number, number, number],
      rotationY: mark.placement.rotationY,
    }
    : { ...fallbackPlacement, normal: null };
  const sprayQuaternion = useMemo(() => {
    if (!placement.normal || placement.normal.lengthSq() < 0.001) {
      return new THREE.Quaternion().setFromEuler(new THREE.Euler(0, placement.rotationY, 0));
    }

    return new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      placement.normal.clone().normalize(),
    );
  }, [placement.normal, placement.rotationY]);

  return (
    <group position={placement.position} quaternion={sprayQuaternion}>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[3.4, 1.55]} />
        <meshBasicMaterial color="#03111f" transparent opacity={0.7} toneMapped={false} />
      </mesh>
      <GraffitiWallMark mark={mark} position={[0, 0, 0.04]} rotationZ={(mark.wallSlot % 2 ? -1 : 1) * 0.05} />
      <Text anchorX="center" color="#bae6fd" fontSize={0.2} maxWidth={3.2} outlineColor="#020617" outlineWidth={0.018} position={[0, -1.08, 0.08]}>
        {placement.label} / temporary spray
      </Text>
    </group>
  );
}

export function WorldCommunityHub() {
  const [data, setData] = useState<ExpoCommunityResponse | null>(null);

  useEffect(() => {
    const refresh = () => expoCommunityService.getPublic().then(setData).catch(() => undefined);
    void refresh();
    window.addEventListener('expo:community-updated', refresh);
    return () => window.removeEventListener('expo:community-updated', refresh);
  }, []);

  const entries = (data?.entries || []).slice(0, 3);
  const marks = (data?.graffiti || []).slice(0, 12);
  const boardStats = [
    { accent: '#22d3ee', label: `${data?.entries?.filter((entry) => entry.kind === 'message').length || 0} messages` },
    { accent: '#a78bfa', label: `${data?.entries?.filter((entry) => entry.kind === 'voice').length || 0} voice` },
    { accent: '#f59e0b', label: `${data?.entries?.filter((entry) => entry.kind === 'advert').length || 0} ads` },
    { accent: '#34d399', label: `${marks.length} sprays` },
  ];

  return (
    <>
    <group name="expo-community-hub" position={EXPO_COMMUNITY_HUB_POSITION} rotation={[0, 0.2, 0]} scale={[1.18, 1.18, 1.18]}>
      <mesh position={[0, 3.46, 0]} onClick={openBoard} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'auto'; }}>
        <boxGeometry args={[14.4, 8.35, 0.5]} />
        <meshStandardMaterial color="#10283a" emissive="#061623" emissiveIntensity={0.22} roughness={0.7} metalness={0.18} />
      </mesh>
      <mesh position={[0, 7.85, 0.08]}>
        <boxGeometry args={[14.95, 1.02, 0.56]} />
        <meshStandardMaterial color="#0e7490" emissive="#083344" emissiveIntensity={0.58} />
      </mesh>
      <Text anchorX="left" color="#ecfeff" fontSize={0.44} fontWeight={900} maxWidth={8.8} position={[-6.82, 8.08, 0.4]}>
        CITY BOARD
      </Text>
      <Text anchorX="left" color="#bae6fd" fontSize={0.18} fontWeight={800} maxWidth={7.6} position={[-6.82, 7.63, 0.4]}>
        Messages, small ads, voice notes and temporary sprays
      </Text>
      <mesh position={[5.92, 7.86, 0.42]}>
        <boxGeometry args={[1.74, 0.48, 0.12]} />
        <meshStandardMaterial color="#14532d" emissive="#16a34a" emissiveIntensity={0.42} />
      </mesh>
      <Text anchorX="center" color="#dcfce7" fontSize={0.2} fontWeight={900} position={[5.92, 7.87, 0.53]}>
        LIVE
      </Text>

      {boardStats.map((item, index) => (
        <group key={item.label} position={[-5.65 + (index * 2.34), 6.8, 0.36]}>
          <mesh>
            <boxGeometry args={[2.04, 0.46, 0.1]} />
            <meshStandardMaterial color="#172337" emissive="#06111d" emissiveIntensity={0.2} roughness={0.72} />
          </mesh>
          <mesh position={[-0.85, 0, 0.08]}>
            <boxGeometry args={[0.08, 0.3, 0.06]} />
            <meshStandardMaterial color={item.accent} emissive={item.accent} emissiveIntensity={0.38} />
          </mesh>
          <Text anchorX="left" color="#e2e8f0" fontSize={0.17} fontWeight={850} maxWidth={1.58} position={[-0.72, 0, 0.15]}>
            {item.label}
          </Text>
        </group>
      ))}

      <mesh position={[0, 0.82, 0.3]} onClick={openBoard}>
        <boxGeometry args={[6.25, 0.72, 0.2]} />
        <meshStandardMaterial color="#0e7490" emissive="#0891b2" emissiveIntensity={0.5} />
      </mesh>
      <Text anchorX="center" color="#ecfeff" fontSize={0.29} fontWeight={900} position={[0, 0.84, 0.45]}>
        OPEN BOARD
      </Text>
      <Text anchorX="center" color="#94a3b8" fontSize={0.17} maxWidth={8.6} position={[0, 0.2, 0.36]}>
        Tap to write a note, record voice, post a small ad, or choose a spray spot in the city
      </Text>
      <mesh position={[0, 8.95, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 4.4, 8]} />
        <meshStandardMaterial color="#67e8f9" emissive="#0e7490" emissiveIntensity={0.72} />
      </mesh>
      <mesh position={[0, 11.15, 0]}>
        <boxGeometry args={[4.8, 1.15, 0.34]} />
        <meshStandardMaterial color="#083344" emissive="#0e7490" emissiveIntensity={0.66} />
      </mesh>
      <Text anchorX="center" color="#ecfeff" fontSize={0.38} position={[0, 11.15, 0.2]}>
        COMMUNITY
      </Text>
      {entries.length ? entries.map((entry, index) => (
        <BoardEntryCard key={entry.id} entry={entry} index={index} />
      )) : (
        <group position={[-4.85, 3.7, 0.34]}>
          <mesh>
            <boxGeometry args={[6.15, 2.2, 0.16]} />
            <meshStandardMaterial color="#13283a" emissive="#06111d" emissiveIntensity={0.28} roughness={0.72} metalness={0.1} />
          </mesh>
          <Text anchorX="center" color="#e0f2fe" fontSize={0.36} fontWeight={900} maxWidth={5.3} position={[0, 0.42, 0.18]} textAlign="center">
            Leave the first city post
          </Text>
          <Text anchorX="center" color="#94a3b8" fontSize={0.2} lineHeight={1.15} maxWidth={5.2} position={[0, -0.16, 0.18]} textAlign="center">
            Messages, voice notes, small ads and sprays appear here after review
          </Text>
        </group>
      )}

      <BoardFeatureCard accent="#a78bfa" detail="Visitors press play. No autoplay." label="Voice notes" position={[4.56, 4.8, 0.34]} />
      <BoardFeatureCard accent="#f59e0b" detail="Small city promos after review." label="Small ads" position={[4.56, 3.45, 0.34]} />
      <BoardFeatureCard accent="#34d399" detail="Pick a real spot. Fades in 10 min." label="City sprays" position={[4.56, 2.1, 0.34]} />

      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[13.5, 0.24, 2.6]} />
        <meshStandardMaterial color="#263444" roughness={0.9} />
      </mesh>

      <group position={[-13.7, 0, 1.16]} rotation={[0, 0.08, 0]}>
        <mesh position={[0, 2.5, 0]} onClick={openBoard}>
          <boxGeometry args={[8.8, 4.75, 0.5]} />
          <meshStandardMaterial color="#1b2d41" emissive="#0b1320" emissiveIntensity={0.22} roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, 5.08, 0.04]}>
          <boxGeometry args={[9.15, 0.66, 0.28]} />
          <meshStandardMaterial color="#4c1d95" emissive="#7c3aed" emissiveIntensity={0.3} />
        </mesh>
        <Text anchorX="center" color="#f8fafc" fontSize={0.32} fontWeight={900} position={[0, 5.1, 0.25]}>
          TEMPORARY SPRAYS
        </Text>
        <Text anchorX="center" color="#c4b5fd" fontSize={0.18} maxWidth={7.5} position={[0, 4.6, 0.28]}>
          Approved marks fade after about 10 minutes
        </Text>
        {marks.map((mark) => {
          const column = mark.wallSlot % 4;
          const row = Math.floor(mark.wallSlot / 4);
          return (
            <GraffitiWallMark
              key={mark.id}
              mark={mark}
              position={[-3.15 + (column * 2.1), 3.78 - (row * 1.25), 0.3]}
              rotationZ={(column % 2 ? -1 : 1) * 0.04}
            />
          );
        })}
        {!marks.length && (
          <Text anchorX="center" color="#94a3b8" fontSize={0.28} maxWidth={6.8} position={[0, 2.45, 0.3]} textAlign="center">
            Pick a nearby city surface, add a mark, and send it for review
          </Text>
        )}
      </group>
    </group>
    <group name="expo-city-temporary-sprays">
      {marks.map((mark) => <CitySprayMark key={`city-spray-${mark.id}`} mark={mark} />)}
    </group>
    </>
  );
}
