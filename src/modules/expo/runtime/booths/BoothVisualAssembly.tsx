import type { RefObject } from 'react';
import type * as THREE from 'three';
import { getSponsorNameFontSize, type SponsorBoothPresentation, type SponsorCta } from '../../lib/sponsorBoothPresentation';
import type { BoothProductPreviewCard } from '../boothProduct';
import { EXPO_SPATIAL_DEBUG_FLAGS } from '../../state/expoRuntime';
import { getBoothArchitectureMetrics, getBoothColliderSegments } from '../../components/BoothArchitectureKit';
import {
  BoothColliderGroup,
  BoothDebugShellFallback,
  BoothFeatureApron,
  BoothFeatureHeader,
  BoothFeatureStage,
  BoothInfoBand,
  type BoothTierState,
  formatExpoDisplayName,
} from './index';
import { OpenBoothPavilion, resolveOpenBoothPavilionLayout } from './OpenBoothPavilion';
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
  metrics,
  tier,
}: {
  accentColor: string;
  metrics: ReturnType<typeof getBoothArchitectureMetrics>;
  tier: ReturnType<typeof resolveOpenBoothPavilionLayout>;
}) {
  const rearScreenZ = -((tier.depth * 0.5) - 0.56);
  const wallY = (tier.screenFrameHeight * 0.5) + 1.7;
  const wallZ = rearScreenZ - 0.04;
  const sideX = tier.screenFrameWidth * 0.55;
  const sidePanelHeight = tier.screenFrameHeight * 0.54;
  const bottomY = wallY - (tier.screenFrameHeight * 0.5) - 0.52;
  const bottomWidth = tier.screenFrameWidth * 0.58;
  const frontDeckZ = wallZ + Math.max(1.46, tier.depth * 0.3);
  const ctaTileWidth = Math.max(1.28, tier.screenFrameWidth * 0.13);
  const ctaTileDepth = 0.52;
  const ctaTileY = 0.62;

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
      <mesh position={[0, 0.28, frontDeckZ]} receiveShadow>
        <boxGeometry args={[tier.screenFrameWidth * 0.62, 0.08, 1.22]} />
        <meshStandardMaterial color="#f4f8fb" metalness={0.04} roughness={0.58} />
      </mesh>
      {[-1, 0, 1].map((slot) => (
        <mesh key={`standard-showcase-cta-tile-${slot}`} position={[slot * (ctaTileWidth * 1.18), ctaTileY, frontDeckZ + 0.18]} castShadow receiveShadow>
          <boxGeometry args={[ctaTileWidth, 0.28, ctaTileDepth]} />
          <meshStandardMaterial
            color={slot === 0 ? accentColor : '#172638'}
            emissive={accentColor}
            emissiveIntensity={slot === 0 ? 0.18 : 0.08}
            metalness={0.1}
            roughness={0.34}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.18, frontDeckZ + 0.9]} receiveShadow>
        <boxGeometry args={[Math.min(metrics.footprintSize[0] * 0.56, tier.screenFrameWidth * 0.72), 0.05, 0.12]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.22} roughness={0.24} />
      </mesh>
    </group>
  );
}

function BoothProductPremiumConversionLayer({
  accentColor,
  layout,
  metrics,
}: {
  accentColor: string;
  layout: ReturnType<typeof resolveOpenBoothPavilionLayout>;
  metrics: ReturnType<typeof getBoothArchitectureMetrics>;
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
  const deskZ = wallZ + Math.max(1.72, layout.depth * 0.34);
  const deskWidth = Math.min(metrics.footprintSize[0] * 0.62, layout.screenFrameWidth * 0.72);
  const statusTileWidth = Math.max(1.4, layout.screenFrameWidth * 0.135);
  const statusTileDepth = 0.58;

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
      <mesh position={[0, 0.28, deskZ]} receiveShadow>
        <boxGeometry args={[deskWidth, 0.1, 1.36]} />
        <meshStandardMaterial color="#f8fbfd" metalness={0.04} roughness={0.52} />
      </mesh>
      {[-1, 0, 1].map((slot) => (
        <mesh key={`premium-conversion-status-tile-${slot}`} position={[slot * (statusTileWidth * 1.2), 0.72, deskZ + 0.2]} castShadow receiveShadow>
          <boxGeometry args={[statusTileWidth, 0.34, statusTileDepth]} />
          <meshStandardMaterial
            color={slot === 0 ? accentColor : '#132235'}
            emissive={accentColor}
            emissiveIntensity={slot === 0 ? 0.22 : 0.1}
            metalness={0.12}
            roughness={0.3}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.2, deskZ + 1]} receiveShadow>
        <boxGeometry args={[deskWidth * 0.82, 0.06, 0.14]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.26} roughness={0.22} />
      </mesh>
    </group>
  );
}

function BoothProductLandmarkZoneFrame({
  accentColor,
  layout,
  metrics,
}: {
  accentColor: string;
  layout: ReturnType<typeof resolveOpenBoothPavilionLayout>;
  metrics: ReturnType<typeof getBoothArchitectureMetrics>;
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
  const zoneDeckZ = wallZ + Math.max(1.98, layout.depth * 0.42);
  const zoneDeckWidth = Math.min(metrics.footprintSize[0] * 0.7, layout.screenFrameWidth * 0.82);
  const eventRailY = wallY - (layout.screenFrameHeight * 0.5) - 0.62;
  const eventRailZ = wallZ + 0.78;
  const markerWidth = Math.max(1.26, layout.screenFrameWidth * 0.11);

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
      <mesh position={[0, 0.26, zoneDeckZ]} receiveShadow>
        <boxGeometry args={[zoneDeckWidth, 0.12, 1.66]} />
        <meshStandardMaterial color="#f8f3df" emissive={accentColor} emissiveIntensity={0.04} metalness={0.06} roughness={0.5} />
      </mesh>
      {[-1.5, -0.5, 0.5, 1.5].map((slot, index) => (
        <mesh key={`landmark-zone-marker-${index}`} position={[slot * (markerWidth * 0.82), 0.74, zoneDeckZ + 0.26]} castShadow receiveShadow>
          <boxGeometry args={[markerWidth, 0.38, 0.62]} />
          <meshStandardMaterial
            color={index === 1 || index === 2 ? accentColor : '#102033'}
            emissive={accentColor}
            emissiveIntensity={index === 1 || index === 2 ? 0.28 : 0.12}
            metalness={0.14}
            roughness={0.28}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.18, zoneDeckZ + 1.12]} receiveShadow>
        <boxGeometry args={[zoneDeckWidth * 0.86, 0.07, 0.16]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.32} roughness={0.18} />
      </mesh>
    </group>
  );
}

export function BoothVisualAssembly({
  accentColor,
  boothColliderRef,
  boothProductPreviewCard,
  fallbackMonogram,
  onAction,
  presentation,
  districtThemeId,
  tierState,
}: {
  accentColor: string;
  boothColliderRef: RefObject<THREE.Group | null>;
  boothProductPreviewCard?: BoothProductPreviewCard | null;
  districtThemeId?: DistrictThemeId | string | null;
  fallbackMonogram: string;
  onAction: (action: SponsorCta) => void;
  presentation: SponsorBoothPresentation;
  tierState: BoothTierState & {
    districtVisual: DistrictVisual;
  };
}) {
  const metrics = getBoothArchitectureMetrics(presentation.template);
  const colliderSegments = getBoothColliderSegments(presentation.template);
  const nameFontSize = getSponsorNameFontSize(presentation.displayName);
  const heroName = formatExpoDisplayName(presentation.displayName);
  const infoBandZ = metrics.titlePosition[2] - 0.24;
  const showInteractiveDressing = tierState.showFullBoothUi;
  const showHeroFloatingFeatureUi = showInteractiveDressing && tierState.isHeroFeature;
  const premiumLabel = tierState.isHeroBooth
    ? 'FLAGSHIP IMMERSIVE SHOWROOM'
    : tierState.isEliteBooth
      ? 'UNREAL-POWERED BUYER SUITE'
      : 'PREMIUM LIVE SHOWROOM';
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
  const boothPresentationScreenUrl = buildGeneratedBillboardTextureUrl({
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
            chip: managedScreenContent.mode === 'video-placeholder' ? 'VIDEO SLOT READY' : 'SPONSOR SCREEN',
            label: managedScreenContent.title,
            subtitle: managedScreenContent.mode === 'video-placeholder'
              ? `${managedScreenContent.subtitle || 'Owner-managed booth screen'} - video saved, playback off`
              : managedScreenContent.subtitle || 'Owner-managed booth screen',
            tier: managedScreenContent.ctaLabel || 'PUBLISHED',
          }
      : {
          chip: presentation.badgeLabel ?? premiumLabel,
          label: presentation.displayName,
          subtitle: presentation.tagline ?? premiumLabel,
          tier: tierState.contractTier.toUpperCase(),
        }),
    tierAccent: tierState.districtVisual.shellAccent,
  });

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
          screenUrl={managedScreenImageUrl ?? boothPresentationScreenUrl}
          tier={tierState.featureTier}
        />
      )}
      {showStandardProductShowcaseFrame && (
        <BoothProductShowcaseFrame
          accentColor={accentColor}
          metrics={metrics}
          tier={pavilionLayout}
        />
      )}
      {showPremiumProductConversionLayer && (
        <BoothProductPremiumConversionLayer
          accentColor={accentColor}
          layout={pavilionLayout}
          metrics={metrics}
        />
      )}
      {showLandmarkZoneSponsorFrame && (
        <BoothProductLandmarkZoneFrame
          accentColor={accentColor}
          layout={pavilionLayout}
          metrics={metrics}
        />
      )}
      {showInteractiveDressing && (
        <>
          {!pavilionLayout.isScreenFirstBooth && (
            <BoothFeatureApron
              accentColor={tierState.districtVisual.shellAccent}
              contractTier={tierState.contractTier}
              districtGlow={tierState.districtVisual.districtGlow}
              frontApronDepth={tierState.frontApronDepth}
              frontApronWidth={tierState.frontApronWidth}
              isFeatureBooth={tierState.isFeatureBooth}
            />
          )}
          <BoothFeatureStage
            accentColor={accentColor}
            fallbackMonogram={fallbackMonogram}
            isEliteFeature={tierState.isEliteFeature}
            isFeatureBooth={tierState.isFeatureBooth}
            isHeroFeature={tierState.isHeroFeature}
            mode={presentation.showcaseMode}
            screenFirst={pavilionLayout.isScreenFirstBooth}
            stageScale={tierState.stageScale}
          />
          {showHeroFloatingFeatureUi && (
            <>
              <BoothFeatureHeader
                accentColor={accentColor}
                contractTier={tierState.contractTier}
                fallbackMonogram={fallbackMonogram}
                heroName={heroName}
                isEliteFeature={tierState.isEliteFeature}
                isFeatureBooth={tierState.isFeatureBooth}
                isHeroFeature={tierState.isHeroFeature}
                logoUrl={presentation.logoUrl ?? null}
                metricsColliderHeight={metrics.colliderSize[1]}
              />
              <BoothInfoBand
                accentColor={accentColor}
                badgeLabel={presentation.badgeLabel}
                ctaActions={presentation.actions}
                fallbackPremiumLabel={premiumLabel}
                infoBandHeight={tierState.infoBandHeight}
                infoBandWidth={tierState.infoBandWidth}
                infoBandZ={infoBandZ}
                isEliteBooth={tierState.isEliteBooth}
                isHeroNode={tierState.isHeroNode}
                metrics={{
                  badgePosition: metrics.badgePosition,
                  ctaPosition: metrics.ctaPosition,
                  taglinePosition: metrics.taglinePosition,
                  titleMaxWidth: metrics.titleMaxWidth,
                  titlePosition: metrics.titlePosition,
                }}
                nameFontSize={nameFontSize}
                onAction={onAction}
                showBadge={tierState.showBadge}
                showDetailedText={tierState.showDetailedText}
                showFullBoothUi={tierState.showFullBoothUi}
                showPremiumEyebrow={tierState.showPremiumEyebrow}
                showTagline={tierState.showTagline}
                tagline={presentation.tagline ?? undefined}
                title={presentation.displayName}
              />
            </>
          )}
        </>
      )}
      {showInteractiveDressing && (presentation.template === 'hero_gallery' || presentation.template === 'hero_forum') && (
        <mesh position={[0, 0.4, 8.6]} receiveShadow>
          <boxGeometry args={[18, 0.12, 2]} />
          <meshStandardMaterial
            color={tierState.districtVisual.shellAccent}
            emissive={tierState.districtVisual.districtGlow}
            emissiveIntensity={tierState.districtVisual.expressionMode === 'active-commercial' ? 0.18 : 0.08}
          />
        </mesh>
      )}
    </>
  );
}
