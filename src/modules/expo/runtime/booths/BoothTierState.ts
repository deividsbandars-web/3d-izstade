import type { ExpoBoothPlacement } from '../../layout-engine';
import {
  getBoothArchitectureContractBaseline,
  getBoothArchitectureMetrics,
} from '../../components/BoothArchitectureKit';
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

export type BoothCommercialTier = 'common' | 'premium' | 'elite' | 'hero';

export type BoothTierContractSpec = {
  ctaVerb: 'explore' | 'present' | 'host' | 'anchor';
  frontApronDepth: number;
  frontApronWidth: number;
  infoBandHeightWithTagline: number;
  infoBandHeightWithoutTagline: number;
  infoBandWidthPadding: number;
  landmarkCue: 'none' | 'portal' | 'monolith' | 'signature';
  opennessClass: 'compact' | 'open-front' | 'ceremonial' | 'anchor';
  requiredScreenClass: 'support' | 'presentation' | 'large-format' | 'landmark';
  stageScale: number;
};

export const BOOTH_TIER_CONTRACT: Record<BoothCommercialTier, BoothTierContractSpec> = {
  common: {
    ctaVerb: 'explore',
    frontApronDepth: 0,
    frontApronWidth: 0,
    infoBandHeightWithTagline: 2.86,
    infoBandHeightWithoutTagline: 1.92,
    infoBandWidthPadding: 2.8,
    landmarkCue: 'none',
    opennessClass: 'compact',
    requiredScreenClass: 'support',
    stageScale: 1.08,
  },
  premium: {
    ctaVerb: 'present',
    frontApronDepth: 3.5,
    frontApronWidth: 20.5,
    infoBandHeightWithTagline: 3.72,
    infoBandHeightWithoutTagline: 2.52,
    infoBandWidthPadding: 4.5,
    landmarkCue: 'portal',
    opennessClass: 'open-front',
    requiredScreenClass: 'presentation',
    stageScale: 1.3,
  },
  elite: {
    ctaVerb: 'host',
    frontApronDepth: 4.6,
    frontApronWidth: 25,
    infoBandHeightWithTagline: 4.36,
    infoBandHeightWithoutTagline: 3.08,
    infoBandWidthPadding: 6.1,
    landmarkCue: 'monolith',
    opennessClass: 'ceremonial',
    requiredScreenClass: 'large-format',
    stageScale: 1.56,
  },
  hero: {
    ctaVerb: 'anchor',
    frontApronDepth: 5.6,
    frontApronWidth: 30,
    infoBandHeightWithTagline: 4.36,
    infoBandHeightWithoutTagline: 3.08,
    infoBandWidthPadding: 6.8,
    landmarkCue: 'signature',
    opennessClass: 'anchor',
    requiredScreenClass: 'landmark',
    stageScale: 1.82,
  },
};

export type BoothTierState = {
  contractTier: BoothCommercialTier;
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

function resolveBoothCommercialTier({
  booth,
  companySponsorTier,
  nodeType,
  presentation,
}: {
  booth: BoothLike;
  companySponsorTier?: string | null;
  nodeType: ExpoBoothPlacement['nodeType'];
  presentation: PresentationLike;
}): BoothCommercialTier {
  const templateBaseline = getBoothArchitectureContractBaseline(presentation.template).baselineTier;
  const isHeroNode = nodeType === 'hero_left' || nodeType === 'hero_right';

  if (companySponsorTier === 'hero' || booth?.boothType === 'hero' || isHeroNode || templateBaseline === 'hero') {
    return 'hero';
  }

  if (presentation.adTier === 'elite') {
    return 'elite';
  }

  if (presentation.adTier === 'premium' || templateBaseline === 'premium') {
    return 'premium';
  }

  return 'common';
}

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
  const contractTier = resolveBoothCommercialTier({
    booth,
    companySponsorTier,
    nodeType,
    presentation,
  });
  const contractSpec = BOOTH_TIER_CONTRACT[contractTier];
  const isHeroBooth = contractTier === 'hero';
  const isEliteBooth = contractTier === 'elite';
  const isPremiumBooth = contractTier === 'premium';
  const isHeroNode = nodeType === 'hero_left' || nodeType === 'hero_right';
  const featureTier: BoothFeatureTier = contractTier === 'common' ? 'standard' : contractTier;
  const isFeatureBooth = featureTier !== 'standard';
  const isHeroFeature = featureTier === 'hero';
  const isEliteFeature = featureTier === 'elite';
  const stageScale = contractSpec.stageScale;
  const frontApronWidth = contractSpec.frontApronWidth;
  const frontApronDepth = contractSpec.frontApronDepth;
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
  const infoBandWidth = Math.max(10.2, metricsTitleMaxWidth + contractSpec.infoBandWidthPadding);
  const infoBandHeight = showTagline
    ? contractSpec.infoBandHeightWithTagline
    : contractSpec.infoBandHeightWithoutTagline;

  return {
    contractTier,
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
