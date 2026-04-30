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
  OpenBoothPavilion,
} from './index';
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
  const boothPresentationScreenUrl = presentation.posterUrl ?? null;
  const premiumLabel = tierState.isHeroBooth
    ? 'FLAGSHIP IMMERSIVE SHOWROOM'
    : tierState.isEliteBooth
      ? 'UNREAL-POWERED BUYER SUITE'
      : 'PREMIUM LIVE SHOWROOM';

  return (
    <>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={metrics.footprintSize} />
        <meshStandardMaterial
          color={tierState.districtVisual.groundAccent}
          transparent
          opacity={tierState.districtVisual.expressionMode === 'active-commercial' ? 0.16 : 0.11}
        />
      </mesh>
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
      {(presentation.template === 'hero_gallery' || presentation.template === 'hero_forum') && (
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
