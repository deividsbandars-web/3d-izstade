import type { RefObject } from 'react';
import type * as THREE from 'three';
import { getSponsorNameFontSize, type SponsorBoothPresentation, type SponsorCta } from '../../lib/sponsorBoothPresentation';
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
import { buildGeneratedBillboardTextureUrl } from './BoothTextureMaterials';
import type { DistrictThemeId } from '../../../../shared/expo/lib/districtTheme';

type DistrictVisual = {
  districtGlow: string;
  expressionMode: string;
  groundAccent: string;
  shellAccent: string;
};

export function BoothVisualAssembly({
  accentColor,
  boothColliderRef,
  fallbackMonogram,
  onAction,
  presentation,
  districtThemeId,
  tierState,
}: {
  accentColor: string;
  boothColliderRef: RefObject<THREE.Group | null>;
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
  const boothPresentationScreenUrl = buildGeneratedBillboardTextureUrl({
    accentColor,
    aspect: pavilionLayout.screenSurfaceWidth / Math.max(1, pavilionLayout.screenSurfaceHeight),
    chip: presentation.badgeLabel ?? premiumLabel,
    label: presentation.displayName,
    subtitle: presentation.tagline ?? premiumLabel,
    tier: tierState.contractTier.toUpperCase(),
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
      {showInteractiveDressing && (
        <>
          <BoothFeatureApron
            accentColor={tierState.districtVisual.shellAccent}
            contractTier={tierState.contractTier}
            districtGlow={tierState.districtVisual.districtGlow}
            frontApronDepth={tierState.frontApronDepth}
            frontApronWidth={tierState.frontApronWidth}
            isFeatureBooth={tierState.isFeatureBooth}
          />
          <BoothFeatureStage
            accentColor={accentColor}
            fallbackMonogram={fallbackMonogram}
            isEliteFeature={tierState.isEliteFeature}
            isFeatureBooth={tierState.isFeatureBooth}
            isHeroFeature={tierState.isHeroFeature}
            mode={presentation.showcaseMode}
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
