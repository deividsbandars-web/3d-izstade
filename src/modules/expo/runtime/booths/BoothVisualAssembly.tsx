import type { RefObject } from 'react';
import type * as THREE from 'three';
import type { SponsorBoothPresentation } from '../../lib/sponsorBoothPresentation';
import type { BoothProductPreviewCard } from '../boothProduct';
import { EXPO_SPATIAL_DEBUG_FLAGS } from '../../state/expoRuntime';
import { getBoothArchitectureMetrics, getBoothColliderSegments } from '../../components/BoothArchitectureKit';
import {
  BoothColliderGroup,
  BoothDebugShellFallback,
  type BoothTierState,
} from './index';
import { OpenBoothPavilion } from './OpenBoothPavilion';
import { resolveOpenBoothPavilionLayout } from './OpenBoothPavilionLayout';
import { buildGeneratedBillboardTextureUrl } from './generatedBillboardTextureUrl';
import type { DistrictThemeId } from '../../../../shared/expo/lib/districtTheme';

type DistrictVisual = {
  districtGlow: string;
  expressionMode: string;
  groundAccent: string;
  shellAccent: string;
};

function BoothProductShowcaseFrame({
  accentColor,
  tier,
}: {
  accentColor: string;
  tier: ReturnType<typeof resolveOpenBoothPavilionLayout>;
}) {
  const rearScreenZ = -((tier.depth * 0.5) - 0.56);
  const wallY = (tier.screenFrameHeight * 0.5) + 1.7;
  const wallZ = rearScreenZ - 0.04;
  const sideX = tier.screenFrameWidth * 0.55;
  const sidePanelHeight = tier.screenFrameHeight * 0.54;
  const bottomY = wallY - (tier.screenFrameHeight * 0.5) - 0.52;
  const bottomWidth = tier.screenFrameWidth * 0.58;

  return (
    <group name="booth-product-standard-showcase-frame">
      {[-1, 1].map((side) => (
        <group key={`standard-showcase-side-${side}`} position={[side * sideX, wallY, wallZ + 0.56]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.5, sidePanelHeight, 0.22]} />
            <meshStandardMaterial
              color="#dbe8ef"
              emissive={accentColor}
              emissiveIntensity={0.08}
              metalness={0.12}
              roughness={0.34}
            />
          </mesh>
          <mesh position={[0, 0, 0.16]}>
            <boxGeometry args={[0.16, sidePanelHeight * 0.78, 0.08]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={0.24}
              metalness={0.1}
              roughness={0.22}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[0, bottomY, wallZ + 0.58]} castShadow receiveShadow>
        <boxGeometry args={[bottomWidth, 0.34, 0.24]} />
        <meshStandardMaterial
          color="#eef5f8"
          emissive={accentColor}
          emissiveIntensity={0.06}
          metalness={0.08}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, bottomY + 0.03, wallZ + 0.76]}>
        <boxGeometry args={[bottomWidth * 0.72, 0.08, 0.08]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.28}
          metalness={0.08}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

function BoothProductPremiumConversionLayer({
  accentColor,
  layout,
}: {
  accentColor: string;
  layout: ReturnType<typeof resolveOpenBoothPavilionLayout>;
}) {
  const rearScreenZ = -((layout.depth * 0.5) - 0.56);
  const wallY = (layout.screenFrameHeight * 0.5) + 1.7;
  const wallZ = rearScreenZ - 0.04;
  const conversionPanelX = layout.screenFrameWidth * 0.6;
  const conversionPanelHeight = layout.screenFrameHeight * 0.68;
  const conversionPanelWidth = Math.max(0.86, layout.screenFrameWidth * 0.075);
  const conversionPanelZ = wallZ + 0.62;
  const meetingRailWidth = layout.screenFrameWidth * 0.68;
  const meetingRailY = wallY - (layout.screenFrameHeight * 0.5) - 0.58;
  const meetingRailZ = wallZ + 0.72;

  return (
    <group name="booth-product-premium-conversion-layer">
      <mesh position={[0, wallY + (layout.screenFrameHeight * 0.5) + 0.44, wallZ + 0.5]} castShadow receiveShadow>
        <boxGeometry args={[layout.screenFrameWidth * 0.78, 0.34, 0.28]} />
        <meshStandardMaterial
          color="#f4fbff"
          emissive={accentColor}
          emissiveIntensity={0.1}
          metalness={0.12}
          roughness={0.26}
        />
      </mesh>
      <mesh position={[0, wallY + (layout.screenFrameHeight * 0.5) + 0.64, wallZ + 0.68]}>
        <boxGeometry args={[layout.screenFrameWidth * 0.52, 0.08, 0.08]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.36}
          metalness={0.08}
          roughness={0.18}
        />
      </mesh>
      {[1, -1].map((side) => (
        <group key={`premium-conversion-side-${side}`} position={[side * conversionPanelX, wallY, conversionPanelZ]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[conversionPanelWidth, conversionPanelHeight, 0.28]} />
            <meshStandardMaterial
              color={side > 0 ? '#d9ecf7' : '#eaf4fa'}
              emissive={accentColor}
              emissiveIntensity={0.09}
              metalness={0.12}
              roughness={0.3}
            />
          </mesh>
          {Array.from({ length: 3 }, (_, index) => {
            const rowY = conversionPanelHeight * (0.28 - index * 0.24);
            return (
              <mesh key={`premium-conversion-row-${side}-${index}`} position={[0, rowY, 0.18]}>
                <boxGeometry args={[conversionPanelWidth * 0.48, conversionPanelHeight * 0.095, 0.08]} />
                <meshStandardMaterial
                  color={index === 0 ? accentColor : '#203349'}
                  emissive={accentColor}
                  emissiveIntensity={index === 0 ? 0.28 : 0.1}
                  metalness={0.08}
                  roughness={0.24}
                />
              </mesh>
            );
          })}
        </group>
      ))}
      <mesh position={[0, meetingRailY, meetingRailZ]} castShadow receiveShadow>
        <boxGeometry args={[meetingRailWidth, 0.42, 0.32]} />
        <meshStandardMaterial
          color="#eef7fb"
          emissive={accentColor}
          emissiveIntensity={0.08}
          metalness={0.08}
          roughness={0.28}
        />
      </mesh>
    </group>
  );
}

function BoothProductLandmarkZoneFrame({
  accentColor,
  layout,
}: {
  accentColor: string;
  layout: ReturnType<typeof resolveOpenBoothPavilionLayout>;
}) {
  const rearScreenZ = -((layout.depth * 0.5) - 0.56);
  const wallY = (layout.screenFrameHeight * 0.5) + 1.7;
  const wallZ = rearScreenZ - 0.04;
  const crownY = wallY + (layout.screenFrameHeight * 0.5) + 0.72;
  const crownZ = wallZ + 0.58;
  const crownWidth = layout.screenFrameWidth * 0.92;
  const pylonX = layout.screenFrameWidth * 0.61;
  const pylonHeight = layout.screenFrameHeight * 0.86;
  const pylonY = wallY + 0.08;
  const pylonZ = wallZ + 0.66;
  const eventRailY = wallY - (layout.screenFrameHeight * 0.5) - 0.62;
  const eventRailZ = wallZ + 0.78;

  return (
    <group name="booth-product-landmark-zone-sponsor-frame">
      <mesh position={[0, crownY, crownZ]} castShadow receiveShadow>
        <boxGeometry args={[crownWidth, 0.52, 0.34]} />
        <meshStandardMaterial
          color="#fff8df"
          emissive={accentColor}
          emissiveIntensity={0.16}
          metalness={0.18}
          roughness={0.24}
        />
      </mesh>
      <mesh position={[0, crownY + 0.36, crownZ + 0.18]}>
        <boxGeometry args={[crownWidth * 0.66, 0.12, 0.1]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.42}
          metalness={0.12}
          roughness={0.18}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={`landmark-zone-pylon-${side}`} position={[side * pylonX, pylonY, pylonZ]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.78, pylonHeight, 0.38]} />
            <meshStandardMaterial
              color="#16283a"
              emissive={accentColor}
              emissiveIntensity={0.12}
              metalness={0.16}
              roughness={0.28}
            />
          </mesh>
          <mesh position={[0, 0, 0.24]}>
            <boxGeometry args={[0.2, pylonHeight * 0.72, 0.08]} />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={0.38}
              metalness={0.08}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0, (pylonHeight * 0.5) + 0.34, 0.02]} castShadow>
            <boxGeometry args={[1.18, 0.42, 0.54]} />
            <meshStandardMaterial color="#fff8df" emissive={accentColor} emissiveIntensity={0.18} roughness={0.28} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, eventRailY, eventRailZ]} castShadow receiveShadow>
        <boxGeometry args={[layout.screenFrameWidth * 0.78, 0.46, 0.34]} />
        <meshStandardMaterial
          color="#fff7d2"
          emissive={accentColor}
          emissiveIntensity={0.1}
          metalness={0.1}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

function isManagedCameraPreviewImage(url: string | null) {
  return Boolean(url && /warpala-expo-city-camera-view\.(?:png|jpe?g|webp)$/i.test(url));
}

export function BoothVisualAssembly({
  accentColor,
  boothColliderRef,
  boothProductPreviewCard,
  fallbackMonogram,
  presentation,
  districtThemeId,
  tierState,
}: {
  accentColor: string;
  boothColliderRef: RefObject<THREE.Group | null>;
  boothProductPreviewCard?: BoothProductPreviewCard | null;
  districtThemeId?: DistrictThemeId | string | null;
  fallbackMonogram: string;
  presentation: SponsorBoothPresentation;
  tierState: BoothTierState & {
    districtVisual: DistrictVisual;
  };
}) {
  const metrics = getBoothArchitectureMetrics(presentation.template);
  const colliderSegments = getBoothColliderSegments(presentation.template);
  const pavilionLayout = resolveOpenBoothPavilionLayout(metrics, tierState.featureTier);
  const showStandardProductShowcaseFrame = Boolean(
    boothProductPreviewCard
    && boothProductPreviewCard.tierLabel.toUpperCase().includes('STANDARD')
    && pavilionLayout.isScreenFirstBooth
  );
  const showPremiumProductConversionLayer = Boolean(
    boothProductPreviewCard?.productProfileId === 'sponsor-concierge-premium-profile'
    && pavilionLayout.isScreenFirstBooth
  );
  const showLandmarkZoneSponsorFrame = Boolean(
    boothProductPreviewCard?.productProfileId === 'automation-arena-landmark-profile'
    && pavilionLayout.isScreenFirstBooth
  );
  const managedScreenContent = !boothProductPreviewCard && presentation.managedScreenContent?.status === 'published'
    ? presentation.managedScreenContent
    : null;
  const managedScreenImageUrl = managedScreenContent?.mode === 'image' && managedScreenContent.imageUrl
    ? managedScreenContent.imageUrl
    : null;
  const managedScreenVideoUrl = managedScreenContent?.mode === 'video-placeholder' && managedScreenContent.videoUrl
    ? managedScreenContent.videoUrl
    : null;
  const managedCameraPreviewImage = isManagedCameraPreviewImage(managedScreenImageUrl);
  const useCameraFeedLoop = !boothProductPreviewCard && !managedScreenImageUrl;
  const effectiveManagedScreenUrl = managedScreenVideoUrl ?? (managedCameraPreviewImage ? null : managedScreenImageUrl);
  const fallbackGeneratedScreenUrl = buildGeneratedBillboardTextureUrl({
    accentColor,
    aspect: pavilionLayout.screenSurfaceWidth / Math.max(1, pavilionLayout.screenSurfaceHeight),
    ...(boothProductPreviewCard
      ? {
          bullets: boothProductPreviewCard.bullets,
          chip: 'BOOTH PRODUCT PREVIEW',
          ctaLabels: boothProductPreviewCard.ctaLabels,
          label: boothProductPreviewCard.title,
          layout: 'booth-product-preview' as const,
          statusLabel: boothProductPreviewCard.statusLabel,
          subtitle: boothProductPreviewCard.subtitle,
          tier: boothProductPreviewCard.tierLabel,
        }
      : managedScreenContent
        ? {
            chip: managedScreenContent.mode === 'video-placeholder' ? 'SAVED VIDEO SLOT' : 'CITY CAMERA LOOP',
            label: managedScreenContent.title,
            layout: (useCameraFeedLoop || managedCameraPreviewImage) ? 'camera-feed-loop' as const : undefined,
            subtitle: managedScreenContent.mode === 'video-placeholder'
              ? `${managedScreenContent.subtitle || 'Owner-managed booth screen'} - playback review pending`
              : managedScreenContent.subtitle || 'Owner-managed booth screen',
            tier: managedScreenContent.ctaLabel || 'PUBLISHED',
          }
      : {
          chip: 'CITY CAMERA LOOP',
          label: presentation.displayName,
          layout: 'camera-feed-loop' as const,
          subtitle: presentation.tagline ?? 'Generated camera route across the Expo City',
          tier: tierState.contractTier.toUpperCase(),
        }),
    tierAccent: tierState.districtVisual.shellAccent,
  });
  const boothPresentationScreenUrl = presentation.posterUrl ?? fallbackGeneratedScreenUrl;

  return (
    <>
      <group ref={boothColliderRef}>
        <BoothColliderGroup colliderSegments={colliderSegments} debug={EXPO_SPATIAL_DEBUG_FLAGS.showBoothColliderBoxes} />
      </group>
      {EXPO_SPATIAL_DEBUG_FLAGS.disableBoothArchitectureKit ? (
        <BoothDebugShellFallback accentColor={accentColor} metrics={metrics} />
      ) : (
        <OpenBoothPavilion
          accentColor={tierState.districtVisual.shellAccent}
          districtThemeId={districtThemeId}
          fallbackText={fallbackMonogram}
          metrics={metrics}
          screenUrl={effectiveManagedScreenUrl ?? boothPresentationScreenUrl}
          tier={tierState.featureTier}
        />
      )}
      {showStandardProductShowcaseFrame && (
        <BoothProductShowcaseFrame
          accentColor={accentColor}
          tier={pavilionLayout}
        />
      )}
      {showPremiumProductConversionLayer && (
        <BoothProductPremiumConversionLayer
          accentColor={accentColor}
          layout={pavilionLayout}
        />
      )}
      {showLandmarkZoneSponsorFrame && (
        <BoothProductLandmarkZoneFrame
          accentColor={accentColor}
          layout={pavilionLayout}
        />
      )}
    </>
  );
}
