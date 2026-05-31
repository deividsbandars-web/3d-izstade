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
          screenUrl={boothPresentationScreenUrl}
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
