import { Suspense } from 'react';
import { Text } from '@react-three/drei';
import type { DistrictThemeId } from '../../../../shared/expo/lib/districtTheme';
import {
  EliteMonolithShell,
  EliteRoofCrown,
  HeroOrEliteHalo,
  PremiumOrEliteBlades,
  PremiumPortalShell,
  TierScreenFrame,
} from './BoothTierShells';
import { SponsorTextureSurface } from './BoothTextureMaterials';
import { resolveOpenBoothPavilionLayout, type OpenBoothPavilionMetrics, type OpenBoothPavilionTier } from './OpenBoothPavilionLayout';

export function OpenBoothPavilion({
  accentColor,
  districtThemeId,
  fallbackText,
  metrics,
  screenUrl,
  tier = 'standard',
}: {
  accentColor: string;
  districtThemeId?: DistrictThemeId | string | null;
  fallbackText: string;
  metrics: OpenBoothPavilionMetrics;
  screenUrl: string | null;
  tier?: OpenBoothPavilionTier;
}) {
  const {
    depth,
    isElite,
    isHero,
    isPremium,
    isScreenFirstBooth,
    lowerMediaShelfWidth,
    mediaSurfaceCount,
    postHeight,
    screenFrameHeight,
    screenFrameWidth,
    screenSurfaceHeight,
    screenSurfaceWidth,
    showFrontThreshold,
    showFrontageCanopy,
    showFrontageFins,
    showFullRoof,
    showPremiumOrEliteBlades,
    showPremiumPortalShell,
    showScreenTrimOverlays,
    showSignalTowers,
    showTierSideBanners,
    signalTowerHeight,
    signalTowerOffsetX,
    width,
  } = resolveOpenBoothPavilionLayout(metrics, tier);
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
  const heroBladeHeight = postHeight + 2.6;
  const heroBladeOffsetX = (width * 0.5) + 4.5;
  const lowerMediaShelfDepth = isHero ? 0.3 : isElite ? 0.26 : isPremium ? 0.22 : 0.18;
  const lowerMediaShelfY = -(screenFrameHeight * 0.5) - (isHero ? 0.26 : isElite ? 0.22 : 0.16);
  const sideBannerDepth = isHero ? 0.46 : isElite ? 0.42 : isPremium ? 0.36 : 0.28;
  const sideBannerWidth = isHero ? 1.48 : isElite ? 1.22 : isPremium ? 0.94 : 0.72;
  const sideBannerHeight = isHero ? 7.4 : isElite ? 6.2 : isPremium ? 5.2 : 4.4;
  const standardFrontTrimWidth = width * 0.7;
  const screenHeaderY = (screenFrameHeight * 0.5) - (isHero ? 0.46 : isElite ? 0.4 : isPremium ? 0.34 : 0.3);
  const screenFooterY = -(screenFrameHeight * 0.5) + (isHero ? 0.42 : isElite ? 0.36 : isPremium ? 0.3 : 0.26);
  const frontageCanopyWidth = width * (isHero ? 0.9 : isElite ? 0.82 : isPremium ? 0.78 : 0.68);
  const frontageCanopyDepth = isHero ? 2.4 : isElite ? 2.08 : isPremium ? 1.84 : 1.42;
  const frontageCanopyY = postHeight * (isHero ? 0.66 : isElite ? 0.62 : isPremium ? 0.58 : 0.54);
  const frontageCanopyZ = (depth * 0.5) - (isHero ? 0.92 : isElite ? 0.84 : isPremium ? 0.78 : 0.68);
  const frontageFinHeight = isHero ? 5.8 : isElite ? 5.1 : isPremium ? 4.5 : 0;
  const frontageFinOffsetX = (width * 0.5) - (isHero ? 2.4 : isElite ? 2.16 : 1.96);
  const frontageFinZ = (depth * 0.5) - (isHero ? 1.04 : isElite ? 0.96 : 0.9);
  const frontThresholdWidth = width * (isHero ? 0.74 : isElite ? 0.7 : isPremium ? 0.66 : 0.56);
  const frontThresholdDepth = isHero ? 1.42 : isElite ? 1.2 : isPremium ? 1.04 : 0.74;
  const isForumPortal = districtThemeId === 'meetings_forum' && isElite && !isHero && !isScreenFirstBooth;
  const forumSignWidth = width * 0.74;
  const forumGuideWidth = width * 0.44;
  const forumBeaconHeight = isElite ? 6.4 : 5.9;
  const forumDeskWidth = width * 0.56;
  const forumDeskDepth = 1.9;
  const forumDeskWingWidth = width * 0.22;
  const forumDeskWingDepth = 1.18;
  const forumLoungeRadius = isElite ? 1.06 : 0.94;
  const forumBackWallWidth = width * 0.34;
  const forumBackWallHeight = isElite ? 5.2 : 4.8;
  const mediaFrameColor = isHero ? '#113d61' : isElite ? '#123652' : isPremium ? '#153149' : '#18344b';
  const mediaFallbackColor = isHero ? '#0ea5e9' : isElite ? '#0891c9' : isPremium ? '#0878ad' : '#0f5f89';
  const mediaTrimColor = isHero ? '#a8f3ff' : isElite ? '#99ecff' : isPremium ? '#8be2fb' : '#7bd4ee';
  const mediaEmissiveIntensity = isHero ? 0.23 : isElite ? 0.18 : isPremium ? 0.15 : 0.12;
  const mediaGlowOpacity = isHero ? 0.28 : isElite ? 0.24 : isPremium ? 0.2 : 0.18;
  const mediaFaceZ = 0.32;
  const mediaGlowZ = 0.36;
  const mediaTrimZ = 0.42;

  if (isScreenFirstBooth) {
    const wallY = (screenFrameHeight * 0.5) + (isElite ? 1.82 : 1.7);
    const wallZ = rearScreenZ - 0.04;
    const wallWidth = screenFrameWidth * 1.035;
    const wallHeight = screenFrameHeight * 1.04;
    const baseWidth = Math.max(screenFrameWidth * 0.72, width * 0.64);
    const baseDepth = Math.max(2.2, depth * 0.42);
    const sideRailHeight = wallHeight + 0.24;
    const sideRailOffsetX = wallWidth * 0.5 + 0.14;
    const mediaPanelZ = wallZ + 0.28;
    const screenFirstFrameColor = isElite ? '#0d2c43' : '#12324a';
    const screenFirstBackColor = isElite ? '#071827' : '#0a1d2c';
    const screenFirstEdgeColor = isElite ? '#9af3ff' : '#8ce8ff';
    const signalTowerWidth = isHero ? 0.72 : isElite ? 0.62 : isPremium ? 0.54 : 0.42;
    const signalTowerDepth = isHero ? 0.86 : isElite ? 0.74 : isPremium ? 0.66 : 0.54;
    const signalTowerZ = wallZ + 0.48;
    const signalTowerAccentHeight = signalTowerHeight * (isHero ? 0.54 : isElite ? 0.5 : isPremium ? 0.46 : 0.4);
    const signalTowerAccentY = 0.72 + signalTowerHeight * 0.56;
    const signalTowerBaseWidth = signalTowerWidth * (isHero ? 3.35 : isElite ? 3.05 : isPremium ? 2.8 : 2.4);
    const signalTowerBaseDepth = signalTowerDepth * 1.85;
    const perimeterWingX = (wallWidth * 0.5) + (isHero ? 1.42 : isElite ? 1.24 : isPremium ? 1.08 : 0.92);
    const perimeterWingHeight = wallHeight * (isHero ? 0.82 : isElite ? 0.78 : isPremium ? 0.72 : 0.64);
    const perimeterWingDepth = isHero ? 1.36 : isElite ? 1.22 : isPremium ? 1.08 : 0.92;
    const perimeterWingWidth = isHero ? 0.64 : isElite ? 0.58 : isPremium ? 0.52 : 0.46;
    const perimeterWingY = wallY - (wallHeight * 0.02);
    const perimeterWingZ = wallZ + 0.02;
    const crownWidth = wallWidth * (isHero ? 1.04 : isElite ? 0.98 : isPremium ? 0.92 : 0.86);
    const crownDepth = isHero ? 0.82 : isElite ? 0.74 : isPremium ? 0.66 : 0.56;
    const lowerRailWidth = wallWidth * (isHero ? 0.82 : isElite ? 0.76 : isPremium ? 0.7 : 0.64);

    return (
      <group name="booth-open-pavilion booth-media-wall">
        <mesh position={[0, 0.09, wallZ + 0.62]} receiveShadow>
          <boxGeometry args={[baseWidth, 0.16, baseDepth]} />
          <meshStandardMaterial color="#e7f6ff" metalness={0.06} roughness={0.68} />
        </mesh>
        <mesh position={[0, 0.22, wallZ + 0.62]} receiveShadow>
          <boxGeometry args={[baseWidth * 0.86, 0.06, baseDepth * 0.34]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.08} metalness={0.08} roughness={0.42} />
        </mesh>
        <group position={[0, wallY, wallZ]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[wallWidth, wallHeight, 0.32]} />
            <meshStandardMaterial color={screenFirstFrameColor} emissive={accentColor} emissiveIntensity={0.035} metalness={0.12} roughness={0.54} />
          </mesh>
          <mesh position={[0, 0, -0.22]} castShadow receiveShadow>
            <boxGeometry args={[wallWidth * 1.055, wallHeight * 1.05, 0.16]} />
            <meshStandardMaterial color={screenFirstBackColor} emissive={accentColor} emissiveIntensity={0.025} metalness={0.08} roughness={0.62} />
          </mesh>
          <mesh position={[0, wallHeight * 0.5 + 0.09, 0.08]} castShadow receiveShadow>
            <boxGeometry args={[wallWidth * 0.82, 0.12, 0.14]} />
            <meshStandardMaterial color={screenFirstEdgeColor} emissive={accentColor} emissiveIntensity={0.1} metalness={0.16} roughness={0.34} />
          </mesh>
          <mesh position={[0, -(wallHeight * 0.5 + 0.08), 0.08]} castShadow receiveShadow>
            <boxGeometry args={[wallWidth * 0.62, 0.1, 0.14]} />
            <meshStandardMaterial color="#0b1320" emissive={accentColor} emissiveIntensity={0.045} metalness={0.12} roughness={0.48} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={`media-wall-side-rail-${side}`} position={[side * sideRailOffsetX, 0, -0.02]} castShadow receiveShadow>
              <boxGeometry args={[0.18, sideRailHeight, 0.22]} />
              <meshStandardMaterial color={screenFirstEdgeColor} emissive={accentColor} emissiveIntensity={0.075} metalness={0.18} roughness={0.36} />
            </mesh>
          ))}
          {[-1, 1].map((side) => (
            <mesh key={`media-wall-rear-brace-${side}`} position={[side * (wallWidth * 0.43), -(wallHeight * 0.5) - 0.86, -0.28]} castShadow receiveShadow>
              <boxGeometry args={[0.22, 1.72, 0.24]} />
              <meshStandardMaterial color="#527890" metalness={0.14} roughness={0.54} />
            </mesh>
          ))}
          <mesh position={[0, wallHeight * 0.5 + 0.34, 0.02]} castShadow receiveShadow>
            <boxGeometry args={[crownWidth, 0.28, crownDepth]} />
            <meshStandardMaterial color="#13283d" emissive={accentColor} emissiveIntensity={0.075} metalness={0.16} roughness={0.36} />
          </mesh>
          <mesh position={[0, wallHeight * 0.5 + 0.52, 0.34]}>
            <boxGeometry args={[crownWidth * 0.58, 0.08, 0.08]} />
            <meshBasicMaterial color={accentColor} toneMapped={false} />
          </mesh>
          <mesh position={[0, -(wallHeight * 0.5) - 0.38, 0.08]} castShadow receiveShadow>
            <boxGeometry args={[lowerRailWidth, 0.24, 0.46]} />
            <meshStandardMaterial color="#101e30" emissive={accentColor} emissiveIntensity={0.055} metalness={0.12} roughness={0.42} />
          </mesh>
        </group>
        {[-1, 1].map((side) => (
          <group key={`media-wall-perimeter-wing-${side}`} name={`booth-perimeter-wing-${side}`} position={[side * perimeterWingX, perimeterWingY, perimeterWingZ]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[perimeterWingWidth, perimeterWingHeight, perimeterWingDepth]} />
              <meshStandardMaterial color="#12273a" emissive={accentColor} emissiveIntensity={0.06} metalness={0.16} roughness={0.38} />
            </mesh>
            {[-1, 1].map((face) => (
              <mesh key={`perimeter-wing-face-strip-${side}-${face}`} position={[0, 0, face * ((perimeterWingDepth * 0.5) + 0.035)]}>
                <boxGeometry args={[perimeterWingWidth * 0.34, perimeterWingHeight * 0.74, 0.07]} />
                <meshBasicMaterial color={accentColor} toneMapped={false} />
              </mesh>
            ))}
            <mesh position={[0, perimeterWingHeight * 0.5 + 0.18, 0]} castShadow receiveShadow>
              <boxGeometry args={[perimeterWingWidth * 1.55, 0.34, perimeterWingDepth * 0.72]} />
              <meshStandardMaterial color="#e4f5ff" emissive={accentColor} emissiveIntensity={0.08} metalness={0.1} roughness={0.3} />
            </mesh>
          </group>
        ))}
        {showSignalTowers && [-1, 1].map((side) => (
          <group key={`media-wall-signal-tower-${side}`} name={`booth-signal-tower-${side}`} position={[side * signalTowerOffsetX, 0, signalTowerZ]}>
            <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
              <boxGeometry args={[signalTowerBaseWidth, 0.42, signalTowerBaseDepth]} />
              <meshStandardMaterial color="#e4f5ff" emissive={accentColor} emissiveIntensity={0.035} metalness={0.08} roughness={0.58} />
            </mesh>
            <mesh position={[0, (signalTowerHeight * 0.5) + 0.42, 0]} castShadow receiveShadow>
              <boxGeometry args={[signalTowerWidth, signalTowerHeight, signalTowerDepth]} />
              <meshStandardMaterial color="#0f2c43" emissive={accentColor} emissiveIntensity={0.06} metalness={0.14} roughness={0.42} />
            </mesh>
            <mesh position={[0, signalTowerAccentY, (signalTowerDepth * 0.5) + 0.035]}>
              <boxGeometry args={[signalTowerWidth * 0.46, signalTowerAccentHeight, 0.07]} />
              <meshBasicMaterial color={accentColor} toneMapped={false} />
            </mesh>
            <mesh position={[0, signalTowerHeight + 0.8, 0]} castShadow>
              <cylinderGeometry args={[signalTowerWidth * 0.82, signalTowerWidth * 0.58, 0.58, 10]} />
              <meshStandardMaterial color="#e8fbff" emissive={accentColor} emissiveIntensity={0.22} metalness={0.12} roughness={0.26} />
            </mesh>
            <mesh position={[0, signalTowerHeight + 1.28, 0]}>
              <sphereGeometry args={[signalTowerWidth * 0.54, 12, 12]} />
              <meshBasicMaterial color={accentColor} toneMapped={false} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, wallY, mediaPanelZ]}>
          <planeGeometry args={[screenSurfaceWidth, screenSurfaceHeight]} />
          {screenUrl ? (
            <Suspense fallback={<meshStandardMaterial color={mediaFallbackColor} emissive={accentColor} emissiveIntensity={mediaEmissiveIntensity} />}>
              <SponsorTextureSurface
                doubleSided
                fallbackColor={mediaFallbackColor}
                emissiveColor={accentColor}
                emissiveIntensity={mediaEmissiveIntensity}
                url={screenUrl}
              />
            </Suspense>
          ) : (
            <meshStandardMaterial color={mediaFallbackColor} emissive={accentColor} emissiveIntensity={mediaEmissiveIntensity} />
          )}
        </mesh>
        <mesh position={[0, wallY, wallZ - 0.34]} scale={[-1, 1, 1]}>
          <planeGeometry args={[screenSurfaceWidth, screenSurfaceHeight]} />
          {screenUrl ? (
            <Suspense fallback={<meshStandardMaterial color={mediaFallbackColor} emissive={accentColor} emissiveIntensity={mediaEmissiveIntensity} />}>
              <SponsorTextureSurface
                doubleSided
                fallbackColor={mediaFallbackColor}
                emissiveColor={accentColor}
                emissiveIntensity={mediaEmissiveIntensity}
                url={screenUrl}
              />
            </Suspense>
          ) : (
            <meshStandardMaterial color={mediaFallbackColor} emissive={accentColor} emissiveIntensity={mediaEmissiveIntensity} />
          )}
        </mesh>
        {!screenUrl && (
          <Text
            position={[0, wallY - 0.04, mediaPanelZ + 0.16]}
            fontSize={isElite ? 0.82 : 0.76}
            color={accentColor}
            anchorX="center"
            anchorY="middle"
            maxWidth={screenSurfaceWidth * 0.46}
          >
            {fallbackText}
          </Text>
        )}
      </group>
    );
  }

  const mediaSurfaceZs = mediaSurfaceCount === 2 ? [mediaFaceZ, -mediaFaceZ] : [mediaFaceZ];
  const pavilionPostPositions = isScreenFirstBooth
    ? [
        [-(screenFrameWidth * 0.54), postHeight * 0.5, rearScreenZ + 0.08],
        [screenFrameWidth * 0.54, postHeight * 0.5, rearScreenZ + 0.08],
      ]
    : [
        [-postOffsetX, postHeight * 0.5, -postOffsetZ],
        [postOffsetX, postHeight * 0.5, -postOffsetZ],
        [-postOffsetX, postHeight * 0.5, postOffsetZ],
        [postOffsetX, postHeight * 0.5, postOffsetZ],
      ];
  const pavilionPostSize: [number, number, number] = isScreenFirstBooth
    ? [0.34, postHeight, 0.34]
    : [isHero ? 0.56 : isElite ? 0.52 : isPremium ? 0.48 : 0.44, postHeight, isHero ? 0.56 : isElite ? 0.52 : isPremium ? 0.48 : 0.44];

  return (
    <group name="booth-open-pavilion">
      {(isHero || (isElite && !isScreenFirstBooth)) && (
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
        <meshStandardMaterial color="#e9f6ff" metalness={0.04} roughness={0.68} />
      </mesh>
      {!isPremium && !isElite && !isHero && (
        <>
          <mesh position={[0, 0.42, (depth * 0.5) - 0.28]} castShadow receiveShadow>
            <boxGeometry args={[standardFrontTrimWidth, 0.12, 0.16]} />
            <meshStandardMaterial color="#f0fbff" metalness={0.12} roughness={0.3} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={`standard-side-post-${side}`} position={[side * ((width * 0.5) - 0.58), postHeight * 0.44, 1.18]} castShadow receiveShadow>
              <boxGeometry args={[0.18, postHeight * 0.5, 0.18]} />
              <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.08} roughness={0.26} metalness={0.12} />
            </mesh>
          ))}
        </>
      )}
      {showPremiumPortalShell && (
        <PremiumPortalShell
          accentColor={accentColor}
          premiumPortalHeight={premiumPortalHeight}
          premiumPortalWidth={premiumPortalWidth}
        />
      )}
      {isElite && !isHero && !isScreenFirstBooth && (
        <EliteMonolithShell
          accentColor={accentColor}
          depth={depth}
          eliteMonolithHeight={eliteMonolithHeight}
          eliteMonolithOffsetX={eliteMonolithOffsetX}
          eliteMonolithZ={eliteMonolithZ}
          width={width}
        />
      )}
      {pavilionPostPositions.map((position, index) => (
        <mesh key={`pavilion-post-${index}`} position={position as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={pavilionPostSize} />
          <meshStandardMaterial color="#557a91" metalness={0.18} roughness={0.52} />
        </mesh>
      ))}
      {showFullRoof && (
        <mesh position={[0, postHeight + 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[width + (isHero ? 4.4 : isElite ? 3.8 : isPremium ? 2.8 : 1.8), isHero ? 0.52 : isElite ? 0.48 : isPremium ? 0.4 : 0.34, depth * (isHero ? 0.92 : isElite ? 0.88 : isPremium ? 0.84 : 0.78)]} />
          <meshStandardMaterial color="#c6e2f0" metalness={0.1} roughness={0.42} />
        </mesh>
      )}
      {showTierSideBanners && (
        <>
          {[-1, 1].map((side) => (
            <group key={`tier-side-banner-${side}`} position={[side * ((width * 0.5) + sideBannerWidth * 0.55), sideBannerHeight * 0.5, 1.62]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[sideBannerWidth, sideBannerHeight, sideBannerDepth]} />
                <meshStandardMaterial color={isHero ? '#e6f8ff' : isElite ? '#ddf2fb' : '#d4eaf5'} metalness={0.16} roughness={0.28} />
              </mesh>
              <mesh position={[0, 0, sideBannerDepth * 0.26]}>
                <boxGeometry args={[sideBannerWidth * 0.26, sideBannerHeight - 1, sideBannerDepth * 0.2]} />
                <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={isHero ? 0.22 : isElite ? 0.18 : 0.14} roughness={0.18} metalness={0.12} />
              </mesh>
            </group>
          ))}
        </>
      )}
      {isElite && !isScreenFirstBooth && (
        <EliteRoofCrown accentColor={accentColor} depth={depth} postHeight={postHeight} width={width} />
      )}
      {isHero && (
        <>
          {[-1, 1].map((side) => (
            <group key={`hero-spine-blade-${side}`} position={[side * heroBladeOffsetX, heroBladeHeight * 0.5, rearScreenZ + 0.28]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[1.14, heroBladeHeight, depth * 0.28]} />
                <meshStandardMaterial color="#e6f8ff" metalness={0.18} roughness={0.26} />
              </mesh>
              <mesh position={[0, 0.1, 0.12]}>
                <boxGeometry args={[0.2, heroBladeHeight - 0.8, depth * 0.12]} />
                <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.24} roughness={0.18} metalness={0.12} />
              </mesh>
            </group>
          ))}
        </>
      )}
      {showFullRoof && (
        <mesh position={[0, postHeight + 0.42, (depth * 0.5) - 0.2]} castShadow>
          <boxGeometry args={[width * (isHero ? 0.92 : isElite ? 0.88 : isPremium ? 0.86 : 0.82), 0.16, 0.22]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.1} roughness={0.42} metalness={0.16} />
        </mesh>
      )}
      {showFrontageCanopy && (
        <group position={[0, frontageCanopyY, frontageCanopyZ]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[frontageCanopyWidth, 0.22, frontageCanopyDepth]} />
            <meshStandardMaterial color="#f0fbff" metalness={0.12} roughness={0.26} />
          </mesh>
          <mesh position={[0, -0.12, frontageCanopyDepth * 0.18]} castShadow receiveShadow>
            <boxGeometry args={[frontageCanopyWidth * 0.88, 0.08, frontageCanopyDepth * 0.18]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={isHero ? 0.2 : isElite ? 0.16 : 0.12} roughness={0.18} metalness={0.12} />
          </mesh>
        </group>
      )}
      {isForumPortal && (
        <group position={[0, 0, (depth * 0.5) + 0.18]}>
          <mesh position={[0.12, 3.16, 0.72]} castShadow receiveShadow>
            <boxGeometry args={[forumSignWidth, 0.34, 0.32]} />
            <meshStandardMaterial color="#f4fcff" metalness={0.08} roughness={0.22} />
          </mesh>
          <mesh position={[0.12, 3, 0.98]} castShadow receiveShadow>
            <boxGeometry args={[forumGuideWidth, 0.12, 0.16]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.26} roughness={0.16} metalness={0.12} />
          </mesh>
          <group position={[width * 0.28, forumBeaconHeight * 0.5 - 0.2, 0.36]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.96, forumBeaconHeight, 0.66]} />
              <meshStandardMaterial color="#e1f5ff" metalness={0.14} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.18, 0.2]}>
              <boxGeometry args={[0.26, forumBeaconHeight - 0.72, 0.22]} />
              <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.28} roughness={0.14} metalness={0.12} />
            </mesh>
            <mesh position={[0, (forumBeaconHeight * 0.5) - 0.66, 0.24]} castShadow receiveShadow>
              <boxGeometry args={[0.62, 0.28, 0.18]} />
              <meshStandardMaterial color="#f4fcff" metalness={0.1} roughness={0.2} />
            </mesh>
          </group>
          <group position={[-width * 0.1, 1.34, 0.84]} rotation={[0, -0.08, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[forumDeskWidth, 0.42, forumDeskDepth]} />
              <meshStandardMaterial color="#f1fbff" metalness={0.1} roughness={0.22} />
            </mesh>
            <mesh position={[0, -0.5, 0.02]} castShadow receiveShadow>
              <boxGeometry args={[forumDeskWidth * 0.92, 0.86, forumDeskDepth * 0.54]} />
              <meshStandardMaterial color="#17283b" emissive={accentColor} emissiveIntensity={0.035} metalness={0.1} roughness={0.42} />
            </mesh>
            <mesh position={[forumDeskWidth * 0.18, 0.12, forumDeskDepth * 0.14]} castShadow receiveShadow>
              <boxGeometry args={[forumDeskWingWidth, 0.22, forumDeskWingDepth]} />
              <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.14} roughness={0.18} metalness={0.12} />
            </mesh>
            <mesh position={[0, -0.06, forumDeskDepth * 0.44]} castShadow receiveShadow>
              <boxGeometry args={[forumDeskWidth * 0.82, 0.08, 0.14]} />
              <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.18} roughness={0.18} metalness={0.12} />
            </mesh>
          </group>
          <mesh position={[-width * 0.32, 2.38, 0.16]} castShadow receiveShadow rotation={[0, 0.06, 0]}>
            <boxGeometry args={[forumBackWallWidth, forumBackWallHeight, 0.36]} />
            <meshStandardMaterial color="#dff3ff" metalness={0.12} roughness={0.22} />
          </mesh>
          <mesh position={[-width * 0.32, 2.42, 0.34]} castShadow receiveShadow rotation={[0, 0.06, 0]}>
            <boxGeometry args={[forumBackWallWidth * 0.18, forumBackWallHeight - 0.72, 0.12]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.26} roughness={0.16} metalness={0.12} />
          </mesh>
          <mesh position={[-width * 0.1, 0.24, 1.08]} receiveShadow>
            <boxGeometry args={[forumDeskWidth + 1.96, 0.08, 2.42]} />
            <meshStandardMaterial color="#f4fcff" metalness={0.06} roughness={0.38} />
          </mesh>
          <mesh position={[-width * 0.02, 0.32, 1.22]} receiveShadow>
            <cylinderGeometry args={[forumLoungeRadius, forumLoungeRadius, 0.12, 24]} />
            <meshStandardMaterial color="#18293b" emissive={accentColor} emissiveIntensity={0.035} metalness={0.08} roughness={0.44} />
          </mesh>
          <mesh position={[-width * 0.02, 0.38, 1.22]} receiveShadow>
            <cylinderGeometry args={[forumLoungeRadius * 0.72, forumLoungeRadius * 0.72, 0.04, 24]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.14} roughness={0.22} metalness={0.12} />
          </mesh>
        </group>
      )}
      {showFrontageFins && (
        <>
          {[-1, 1].map((side) => (
            <group key={`frontage-fin-${side}`} position={[side * frontageFinOffsetX, frontageFinHeight * 0.5, frontageFinZ]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[0.46, frontageFinHeight, isHero ? 1.12 : isElite ? 0.98 : 0.84]} />
                <meshStandardMaterial color="#e5f7ff" metalness={0.16} roughness={0.26} />
              </mesh>
              <mesh position={[0, 0.02, 0.14]}>
                <boxGeometry args={[0.12, frontageFinHeight - 0.72, isHero ? 0.32 : isElite ? 0.28 : 0.24]} />
                <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={isHero ? 0.18 : isElite ? 0.14 : 0.1} roughness={0.18} metalness={0.12} />
              </mesh>
            </group>
          ))}
        </>
      )}
      {(isHero || (isElite && !isScreenFirstBooth)) && (
        <mesh position={[0, postHeight + (isHero ? 1.08 : 0.82), (depth * 0.5) - 0.08]} castShadow>
          <boxGeometry args={[width * (isHero ? 0.76 : 0.68), isHero ? 0.16 : 0.12, 0.14]} />
          <meshStandardMaterial color="#f0fbff" emissive={accentColor} emissiveIntensity={isHero ? 0.2 : 0.14} roughness={0.22} metalness={0.14} />
        </mesh>
      )}
      {showPremiumOrEliteBlades && (
        <PremiumOrEliteBlades
          accentColor={accentColor}
          isElite={isElite}
          postHeight={postHeight}
          postOffsetX={postOffsetX}
          postOffsetZ={postOffsetZ}
        />
      )}
      <group position={[0, postHeight * 0.56, rearScreenZ]}>
        <TierScreenFrame
          accentColor={accentColor}
          screenFirst={isScreenFirstBooth}
          screenHeight={screenFrameHeight}
          screenWidth={screenFrameWidth}
          tier={tier}
        />
        <mesh castShadow receiveShadow>
          <boxGeometry args={[screenFrameWidth, screenFrameHeight, 0.24]} />
          <meshStandardMaterial color={mediaFrameColor} emissive={accentColor} emissiveIntensity={0.045} metalness={0.1} roughness={0.5} />
        </mesh>
        {mediaSurfaceZs.map((mediaSurfaceZ) => (
          <mesh key={`booth-media-surface-${mediaSurfaceZ}`} position={[0, 0, mediaSurfaceZ]}>
            <planeGeometry args={[screenSurfaceWidth, screenSurfaceHeight]} />
            {screenUrl ? (
              <Suspense fallback={<meshStandardMaterial color={mediaFallbackColor} emissive={accentColor} emissiveIntensity={mediaEmissiveIntensity} />}>
                <SponsorTextureSurface
                  doubleSided
                  fallbackColor={mediaFallbackColor}
                  emissiveColor={accentColor}
                  emissiveIntensity={mediaEmissiveIntensity}
                  url={screenUrl}
                />
              </Suspense>
            ) : (
              <meshStandardMaterial color={mediaFallbackColor} emissive={accentColor} emissiveIntensity={mediaEmissiveIntensity} />
            )}
          </mesh>
        ))}
        {showScreenTrimOverlays && (
          <>
            <mesh position={[0, 0, mediaGlowZ]}>
              <planeGeometry args={[screenSurfaceWidth * 0.94, screenSurfaceHeight * 0.86]} />
              <meshBasicMaterial color={accentColor} depthWrite={false} transparent opacity={mediaGlowOpacity * 0.48} toneMapped={false} />
            </mesh>
            <mesh position={[0, screenHeaderY, mediaTrimZ]} castShadow receiveShadow>
              <boxGeometry args={[screenSurfaceWidth * (isHero ? 0.86 : isElite ? 0.82 : isPremium ? 0.76 : 0.68), 0.12, 0.12]} />
              <meshStandardMaterial color={mediaTrimColor} emissive={accentColor} emissiveIntensity={isHero ? 0.18 : isElite ? 0.14 : isPremium ? 0.11 : 0.08} roughness={0.18} metalness={0.1} />
            </mesh>
            <mesh position={[0, screenFooterY, mediaTrimZ]} castShadow receiveShadow>
              <boxGeometry args={[screenSurfaceWidth * (isHero ? 0.72 : isElite ? 0.66 : isPremium ? 0.6 : 0.52), 0.08, 0.12]} />
              <meshStandardMaterial color={mediaTrimColor} emissive={accentColor} emissiveIntensity={isHero ? 0.16 : isElite ? 0.12 : isPremium ? 0.09 : 0.07} roughness={0.2} metalness={0.1} />
            </mesh>
            <mesh position={[0, lowerMediaShelfY, 0.22]} castShadow receiveShadow>
              <boxGeometry args={[lowerMediaShelfWidth, 0.12, lowerMediaShelfDepth]} />
              <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={isHero ? 0.14 : isElite ? 0.1 : 0.06} roughness={0.24} metalness={0.12} />
            </mesh>
          </>
        )}
        {(isHero || (isElite && !isScreenFirstBooth)) && (
          <mesh position={[0, (screenFrameHeight * 0.5) + (isHero ? 0.44 : 0.34), mediaTrimZ]} castShadow receiveShadow>
            <boxGeometry args={[screenFrameWidth * (isHero ? 0.7 : 0.62), 0.12, 0.12]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={isHero ? 0.22 : 0.14} roughness={0.2} metalness={0.12} />
          </mesh>
        )}
        {!screenUrl && (
          <Text
            position={[0, -0.04, 0.48]}
            fontSize={isHero ? 0.84 : isElite ? 0.76 : isPremium ? 0.7 : 0.62}
            color={accentColor}
            anchorX="center"
            anchorY="middle"
            maxWidth={isHero ? 4.2 : isElite ? 3.8 : isPremium ? 3.2 : 2.6}
          >
            {fallbackText}
          </Text>
        )}
      </group>
      {showFrontThreshold && (
        <mesh position={[0, 0.18, (depth * 0.5) - 0.34]} receiveShadow>
          <boxGeometry args={[width * (isHero ? 0.92 : isElite ? 0.84 : 0.74), 0.06, 0.12]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={isHero ? 0.12 : isElite ? 0.1 : 0.08} roughness={0.24} metalness={0.12} />
        </mesh>
      )}
      {showFrontThreshold && (
        <group position={[0, 0.16, (depth * 0.5) + 0.24]}>
          <mesh receiveShadow>
            <boxGeometry args={[frontThresholdWidth, 0.08, frontThresholdDepth]} />
            <meshStandardMaterial color="#f2fbff" metalness={0.08} roughness={0.42} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[frontThresholdWidth * 0.72, 0.04, frontThresholdDepth * 0.42]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={isHero ? 0.12 : isElite ? 0.09 : 0.06} roughness={0.3} metalness={0.12} />
          </mesh>
        </group>
      )}
    </group>
  );
}
