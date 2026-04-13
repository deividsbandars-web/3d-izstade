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
  const width = metrics.footprintSize[0] * (isHero ? 0.98 : isElite ? 0.92 : isPremium ? 0.84 : 0.78);
  const depth = metrics.footprintSize[1] * (isHero ? 0.76 : isElite ? 0.72 : isPremium ? 0.68 : 0.62);
  const postHeight = Math.max(isHero ? 9.4 : isElite ? 8.4 : isPremium ? 7.3 : 6.7, metrics.colliderSize[1] * (isHero ? 0.78 : isElite ? 0.72 : isPremium ? 0.66 : 0.61));
  const postOffsetX = (width * 0.5) - (isHero ? 1.52 : isElite ? 1.36 : isPremium ? 1.24 : 1.1);
  const postOffsetZ = (depth * 0.5) - (isHero ? 1.26 : isElite ? 1.16 : isPremium ? 1.06 : 0.94);
  const rearScreenZ = -((depth * 0.5) - 0.56);
  const haloWidth = width + (isHero ? 8.4 : 7.2);
  const haloHeight = postHeight + (isHero ? 4.8 : 4.2);
  const haloZ = rearScreenZ - 0.78;
  const premiumPortalWidth = width + 5.4;
  const premiumPortalHeight = postHeight + 3.2;
  const eliteMonolithHeight = postHeight + 5.8;
  const eliteMonolithOffsetX = (width * 0.5) + 3.6;
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
        <boxGeometry args={[width, 0.28, depth]} />
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
          <boxGeometry args={[isHero ? 0.56 : isElite ? 0.52 : isPremium ? 0.48 : 0.44, postHeight, isHero ? 0.56 : isElite ? 0.52 : isPremium ? 0.48 : 0.44]} />
          <meshStandardMaterial color="#6c8190" metalness={0.18} roughness={0.58} />
        </mesh>
      ))}
      <mesh position={[0, postHeight + 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + (isHero ? 4.4 : isElite ? 3.8 : isPremium ? 2.8 : 1.8), isHero ? 0.52 : isElite ? 0.48 : isPremium ? 0.4 : 0.34, depth * (isHero ? 0.92 : isElite ? 0.88 : isPremium ? 0.84 : 0.78)]} />
        <meshStandardMaterial color="#c9d6df" metalness={0.1} roughness={0.46} />
      </mesh>
      {isElite && (
        <EliteRoofCrown accentColor={accentColor} depth={depth} postHeight={postHeight} width={width} />
      )}
      <mesh position={[0, postHeight + 0.42, (depth * 0.5) - 0.2]} castShadow>
        <boxGeometry args={[width * (isHero ? 0.92 : isElite ? 0.88 : isPremium ? 0.86 : 0.82), 0.16, 0.22]} />
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
          <boxGeometry args={[width * (isHero ? 0.72 : isElite ? 0.68 : isPremium ? 0.64 : 0.6), isHero ? 6.3 : isElite ? 5.96 : isPremium ? 5.5 : 5.1, 0.24]} />
          <meshStandardMaterial color="#08111c" metalness={0.12} roughness={0.58} />
        </mesh>
        <mesh position={[0, 0, 0.16]}>
          <planeGeometry args={[width * (isHero ? 0.64 : isElite ? 0.6 : isPremium ? 0.56 : 0.52), isHero ? 5.42 : isElite ? 5.02 : isPremium ? 4.68 : 4.32]} />
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
