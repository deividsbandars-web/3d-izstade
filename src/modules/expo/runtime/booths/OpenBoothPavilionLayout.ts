import { getBoothArchitectureMetrics } from '../../components/BoothArchitectureKit';

export type OpenBoothPavilionTier = 'standard' | 'premium' | 'elite' | 'hero';
export type OpenBoothPavilionMetrics = ReturnType<typeof getBoothArchitectureMetrics>;

export function resolveOpenBoothPavilionLayout(
  metrics: OpenBoothPavilionMetrics,
  tier: OpenBoothPavilionTier = 'standard'
) {
  const isHero = tier === 'hero';
  const isElite = tier === 'elite';
  const isPremium = tier === 'premium';
  const isStandard = tier === 'standard';
  const isScreenFirstPremium = isPremium && !isElite && !isHero;
  const isScreenFirstBooth = isHero || isElite || isPremium;
  const width = metrics.footprintSize[0] * (isHero ? 0.92 : isElite ? 0.94 : isPremium ? 0.9 : 0.82);
  const depth = metrics.footprintSize[1] * (isHero ? 0.44 : isElite || isPremium ? 0.42 : 0.46);
  const postHeight = Math.max(isHero ? 9.4 : isElite ? 8.4 : isPremium ? 7.3 : 6.7, metrics.colliderSize[1] * (isHero ? 0.78 : isScreenFirstBooth ? 0.7 : isElite ? 0.72 : isPremium ? 0.66 : 0.61));
  const screenFrameWidth = width * (isStandard ? 0.96 : 0.98);
  const screenFrameHeight = isHero ? 16.2 : isElite ? 14.4 : isPremium ? 13.2 : 8.8;
  const screenSurfaceWidth = isScreenFirstBooth
    ? screenFrameWidth * 0.995
    : width * (isHero ? 0.74 : isElite ? 0.68 : isPremium ? 0.62 : 0.52);
  const screenSurfaceHeight = isScreenFirstBooth
    ? screenFrameHeight * 0.982
    : isHero ? 6.16 : isElite ? 5.46 : isPremium ? 4.82 : 4.18;
  const signalTowerHeight = screenFrameHeight + (isHero ? 6.2 : isElite ? 4.8 : isPremium ? 3.8 : 2.6);
  const signalTowerOffsetX = (screenFrameWidth * 0.5) + (isHero ? 1.65 : isElite ? 1.38 : isPremium ? 1.18 : 0.92);

  return {
    depth,
    isElite,
    isHero,
    isPremium,
    isScreenFirstBooth,
    isScreenFirstPremium,
    lowerMediaShelfWidth: isScreenFirstBooth ? screenFrameWidth * 0.48 : width * (isHero ? 0.64 : isElite ? 0.58 : isPremium ? 0.52 : 0.44),
    mediaSurfaceCount: 1,
    postHeight,
    screenFrameHeight,
    screenFrameWidth,
    screenSurfaceHeight,
    screenSurfaceWidth,
    showSignalTowers: isScreenFirstBooth,
    showFrontThreshold: !isScreenFirstBooth,
    showFrontageCanopy: !isScreenFirstBooth,
    showFrontageFins: !isScreenFirstBooth && (isPremium || isElite || isHero),
    showFullRoof: !isScreenFirstBooth,
    showPremiumOrEliteBlades: false,
    showPremiumPortalShell: isPremium && !isElite && !isHero && !isScreenFirstBooth,
    showScreenTrimOverlays: !isScreenFirstBooth,
    showTierSideBanners: !isScreenFirstBooth && !isStandard,
    signalTowerHeight,
    signalTowerOffsetX,
    width,
  };
}
