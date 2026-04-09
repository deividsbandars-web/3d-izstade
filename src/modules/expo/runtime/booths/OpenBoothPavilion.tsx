import { Suspense } from 'react';
import { Text } from '@react-three/drei';
import { getBoothArchitectureMetrics } from '../../components/BoothArchitectureKit';
import {
  EliteMonolithShell,
  EliteRoofCrown,
  HeroOrEliteHalo,
  PremiumOrEliteBlades,
  PremiumPortalShell,
} from './BoothTierShells';
import { SponsorTextureSurface } from './BoothTextureMaterials';

export function OpenBoothPavilion({
  accentColor,
  fallbackText,
  metrics,
  screenUrl,
  tier = 'standard',
}: {
  accentColor: string;
  fallbackText: string;
  metrics: ReturnType<typeof getBoothArchitectureMetrics>;
  screenUrl: string | null;
  tier?: 'standard' | 'premium' | 'elite' | 'hero';
}) {
  const isHero = tier === 'hero';
  const isElite = tier === 'elite';
  const isPremium = tier === 'premium';
  const width = metrics.footprintSize[0] * (isHero ? 0.82 : isElite ? 0.78 : isPremium ? 0.75 : 0.72);
  const depth = metrics.footprintSize[1] * (isHero ? 0.64 : isElite ? 0.61 : isPremium ? 0.6 : 0.58);
  const postHeight = Math.max(isHero ? 7.4 : isElite ? 6.9 : isPremium ? 6.5 : 6.2, metrics.colliderSize[1] * (isHero ? 0.64 : isElite ? 0.61 : isPremium ? 0.59 : 0.58));
  const postOffsetX = (width * 0.5) - 1.2;
  const postOffsetZ = (depth * 0.5) - 1;
  const rearScreenZ = -((depth * 0.5) - 0.56);
  const haloWidth = width + 4.8;
  const haloHeight = postHeight + 3.2;
  const haloZ = rearScreenZ - 0.78;
  const premiumPortalWidth = width + 3.8;
  const premiumPortalHeight = postHeight + 2.2;
  const eliteMonolithHeight = postHeight + 4.2;
  const eliteMonolithOffsetX = (width * 0.5) + 2.6;
  const eliteMonolithZ = rearScreenZ + 0.36;

  return (
    <group name="booth-open-pavilion">
      {(isHero || isElite) && (
        <HeroOrEliteHalo
          accentColor={accentColor}
          haloHeight={haloHeight}
          haloWidth={haloWidth}
          haloZ={haloZ}
          isHero={isHero}
        />
      )}
      <mesh position={[0, 0.12, 0.4]} receiveShadow>
        <boxGeometry args={[width, 0.24, depth]} />
        <meshStandardMaterial color="#e5edf4" metalness={0.04} roughness={0.74} />
      </mesh>
      {isPremium && !isElite && !isHero && (
        <PremiumPortalShell
          accentColor={accentColor}
          premiumPortalHeight={premiumPortalHeight}
          premiumPortalWidth={premiumPortalWidth}
        />
      )}
      {isElite && !isHero && (
        <EliteMonolithShell
          accentColor={accentColor}
          depth={depth}
          eliteMonolithHeight={eliteMonolithHeight}
          eliteMonolithOffsetX={eliteMonolithOffsetX}
          eliteMonolithZ={eliteMonolithZ}
          width={width}
        />
      )}
      {[
        [-postOffsetX, postHeight * 0.5, -postOffsetZ],
        [postOffsetX, postHeight * 0.5, -postOffsetZ],
        [-postOffsetX, postHeight * 0.5, postOffsetZ],
        [postOffsetX, postHeight * 0.5, postOffsetZ],
      ].map((position, index) => (
        <mesh key={`pavilion-post-${index}`} position={position as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={[0.42, postHeight, 0.42]} />
          <meshStandardMaterial color="#6c8190" metalness={0.18} roughness={0.58} />
        </mesh>
      ))}
      <mesh position={[0, postHeight + 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + (isHero ? 2.4 : isElite ? 2.1 : isPremium ? 1.8 : 1.4), isHero ? 0.38 : isElite ? 0.36 : 0.32, depth * (isHero ? 0.82 : isElite ? 0.8 : isPremium ? 0.78 : 0.74)]} />
        <meshStandardMaterial color="#c9d6df" metalness={0.1} roughness={0.46} />
      </mesh>
      {isElite && (
        <EliteRoofCrown accentColor={accentColor} depth={depth} postHeight={postHeight} width={width} />
      )}
      <mesh position={[0, postHeight + 0.42, (depth * 0.5) - 0.2]} castShadow>
        <boxGeometry args={[width * 0.82, 0.16, 0.22]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.1} roughness={0.42} metalness={0.16} />
      </mesh>
      {(isPremium || isElite) && (
        <PremiumOrEliteBlades
          accentColor={accentColor}
          isElite={isElite}
          postHeight={postHeight}
          postOffsetX={postOffsetX}
          postOffsetZ={postOffsetZ}
        />
      )}
      <group position={[0, postHeight * 0.56, rearScreenZ]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[width * (isHero ? 0.64 : isElite ? 0.61 : isPremium ? 0.6 : 0.58), isHero ? 5.42 : isElite ? 5.18 : isPremium ? 5.04 : 4.92, 0.24]} />
          <meshStandardMaterial color="#08111c" metalness={0.12} roughness={0.58} />
        </mesh>
        <mesh position={[0, 0, 0.16]}>
          <planeGeometry args={[width * (isHero ? 0.56 : isElite ? 0.54 : isPremium ? 0.52 : 0.5), isHero ? 4.56 : isElite ? 4.34 : isPremium ? 4.24 : 4.16]} />
          {screenUrl ? (
            <Suspense fallback={<meshStandardMaterial color="#0f172a" emissive={accentColor} emissiveIntensity={0.08} />}>
              <SponsorTextureSurface fallbackColor="#0f172a" url={screenUrl} />
            </Suspense>
          ) : (
            <meshStandardMaterial color="#0f172a" emissive={accentColor} emissiveIntensity={0.08} />
          )}
        </mesh>
        {!screenUrl && (
          <Text position={[0, -0.04, 0.24]} fontSize={0.68} color={accentColor} anchorX="center" anchorY="middle" maxWidth={2.8}>
            {fallbackText}
          </Text>
        )}
      </group>
    </group>
  );
}
