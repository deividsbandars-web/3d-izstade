import type { ExpoBoothPlacement } from '../../layout-engine';
import { getBoothArchitectureMetrics } from '../../components/BoothArchitectureKit';
import type { SponsorBoothTemplate } from '../../lib/sponsorBoothPresentation';

type BoothLike = {
  boothType?: string | null;
} | null | undefined;

type PresentationLike = {
  adTier: 'standard' | 'premium' | 'elite' | 'support';
  displayName: string;
  hasBrandAssets: boolean;
  template: SponsorBoothTemplate;
};

type DistrictVisualLike = {
  expressionMode: string;
};

export type BoothFeatureTier = 'standard' | 'premium' | 'elite' | 'hero';

export type BoothTierState = {
  distanceToPlayer: number;
  featureTier: BoothFeatureTier;
  frontApronDepth: number;
  frontApronWidth: number;
  infoBandHeight: number;
  infoBandWidth: number;
  isEliteBooth: boolean;
  isEliteFeature: boolean;
  isFeatureBooth: boolean;
  isHeroBooth: boolean;
  isHeroFeature: boolean;
  isHeroNode: boolean;
  isPremiumBooth: boolean;
  showBadge: boolean;
  showDetailedText: boolean;
  showFullBoothUi: boolean;
  showPremiumEyebrow: boolean;
  showTagline: boolean;
  stageScale: number;
};

export function buildBoothTierState({
  companySponsorTier,
  booth,
  districtVisual,
  nodeType,
  playerPosition,
  position,
  presentation,
  skylineDensityEnabled,
}: {
  booth: BoothLike;
  companySponsorTier?: string | null;
  districtVisual: DistrictVisualLike;
  nodeType: ExpoBoothPlacement['nodeType'];
  playerPosition: [number, number, number];
  position: ExpoBoothPlacement['position'];
  presentation: PresentationLike;
  skylineDensityEnabled: boolean;
}): BoothTierState {
  const metricsTitleMaxWidth = getBoothArchitectureMetrics(presentation.template).titleMaxWidth;
  const isHeroTemplate = presentation.template === 'hero_gallery' || presentation.template === 'hero_forum';
  const isHeroBooth = companySponsorTier === 'hero' || booth?.boothType === 'hero' || isHeroTemplate;
  const isEliteBooth = presentation.adTier === 'elite';
  const isPremiumBooth = presentation.adTier === 'premium';
  const isHeroNode = nodeType === 'hero_left' || nodeType === 'hero_right';
  const featureTier: BoothFeatureTier = (isHeroBooth || isHeroNode) ? 'hero' : isEliteBooth ? 'elite' : isPremiumBooth ? 'premium' : 'standard';
  const isFeatureBooth = featureTier !== 'standard';
  const isHeroFeature = featureTier === 'hero';
  const isEliteFeature = featureTier === 'elite';
  const stageScale = isHeroFeature ? 1.82 : isEliteFeature ? 1.56 : isPremiumBooth ? 1.3 : 1.08;
  const frontApronWidth = isHeroFeature ? 30 : isEliteFeature ? 25 : isPremiumBooth ? 20.5 : 0;
  const frontApronDepth = isHeroFeature ? 5.6 : isEliteFeature ? 4.6 : isPremiumBooth ? 3.5 : 0;
  const showTagline =
    (presentation.hasBrandAssets || isHeroFeature || isEliteBooth || isPremiumBooth) &&
    districtVisual.expressionMode === 'active-commercial' &&
    presentation.template !== 'standard_studio';
  const showBadge =
    (presentation.hasBrandAssets || isHeroFeature || isEliteBooth || isPremiumBooth) &&
    districtVisual.expressionMode === 'active-commercial';
  const showPremiumEyebrow = isHeroFeature || isEliteBooth || isPremiumBooth;
  const distanceToPlayer = Math.hypot(playerPosition[0] - position[0], playerPosition[2] - position[2]);
  const showDetailedText = skylineDensityEnabled || distanceToPlayer < 760;
  const showFullBoothUi = skylineDensityEnabled || distanceToPlayer < 540 || isHeroFeature || isEliteBooth || isPremiumBooth;
  const infoBandWidth = Math.max(10.2, metricsTitleMaxWidth + (isEliteBooth ? 6.1 : isPremiumBooth ? 4.5 : 2.8));
  const infoBandHeight = showTagline
    ? (isEliteBooth ? 4.36 : isPremiumBooth ? 3.72 : 2.86)
    : (isEliteBooth ? 3.08 : isPremiumBooth ? 2.52 : 1.92);

  return {
    distanceToPlayer,
    featureTier,
    frontApronDepth,
    frontApronWidth,
    infoBandHeight,
    infoBandWidth,
    isEliteBooth,
    isEliteFeature,
    isFeatureBooth,
    isHeroBooth,
    isHeroFeature,
    isHeroNode,
    isPremiumBooth,
    showBadge,
    showDetailedText,
    showFullBoothUi,
    showPremiumEyebrow,
    showTagline,
    stageScale,
  };
}
