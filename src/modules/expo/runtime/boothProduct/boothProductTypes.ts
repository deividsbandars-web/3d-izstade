export type BoothPackageTier = 'standard' | 'premium' | 'landmarkZone';

export type BoothCtaType =
  | 'learnMore'
  | 'bookMeeting'
  | 'requestDemo'
  | 'downloadPdf'
  | 'runDiagnostic'
  | 'talkToAiAgent'
  | 'visitWebsite'
  | 'joinEvent';

export type BoothProductCta = {
  analyticsId: string;
  enabledInPreview: boolean;
  enabledInProduction: boolean;
  id: string;
  label: string;
  notes?: string;
  shortLabel: string;
  targetUrl?: string;
  type: BoothCtaType;
};

export type BoothProductAssets = {
  brochureKey?: string;
  logoKey?: string;
  videoKey?: string;
};

export type BoothLeadCaptureConfig = {
  enabledInPreview: boolean;
  enabledInProduction: boolean;
  fields: readonly string[];
};

export type BoothAiAgentConfig = {
  enabledInPreview: boolean;
  enabledInProduction: boolean;
  personaLabel: string;
  promptIntent: string;
};

export type BoothDiagnosticConfig = {
  diagnosticId?: string;
  enabledInPreview: boolean;
  enabledInProduction: boolean;
};

export type BoothProductAnalyticsConfig = {
  ctaClickAnalyticsId: string;
  ctaVisibleAnalyticsId: string;
  profileViewAnalyticsId: string;
};

export type BoothProductProfile = {
  aiAgent: BoothAiAgentConfig;
  analytics: BoothProductAnalyticsConfig;
  assets: BoothProductAssets;
  boothId: string;
  category: string;
  ctas: readonly BoothProductCta[];
  diagnostics: BoothDiagnosticConfig;
  displayName: string;
  featureBullets: readonly string[];
  heroMessage: string;
  id: string;
  leadCapture: BoothLeadCaptureConfig;
  notes: string;
  packageTier: BoothPackageTier;
  shortPitch: string;
  sponsorId?: string;
  tagline: string;
};

export type BoothPackageDefinition = {
  futureUpsells: readonly string[];
  includedFeatures: readonly string[];
  label: string;
  priceHint?: string;
  sponsorValue: readonly string[];
  tier: BoothPackageTier;
};

export type BoothProductAnalyticsSummary = {
  backendEnabled: false;
  ctaCount: number;
  previewEnabledCtaCount: number;
  productionEnabledCtaCount: number;
  profileCount: number;
};

export type BoothProductReadinessSummary = {
  aiAgentPreviewEnabledCount: number;
  backendEnabled: false;
  diagnosticPreviewEnabledCount: number;
  landmarkZoneCount: number;
  leadCapturePreviewEnabledCount: number;
  packageTierCount: number;
  premiumBoothCount: number;
  productionEnabledAiAgentCount: number;
  productionEnabledDiagnosticCount: number;
  productionEnabledLeadCaptureCount: number;
  profileCount: number;
  rendered: false;
  standardBoothCount: number;
};

export type BoothProductMappingStatus = 'exact' | 'approximate' | 'missing' | 'deferred';

export type BoothProductPlacementMapping = {
  boothId: string;
  mappingStatus: BoothProductMappingStatus;
  notes: string;
  operatorZoneId?: string;
  packageTier: BoothPackageTier;
  productProfileId: string;
  runtimeBoothId?: string;
  runtimeSponsorId?: string;
  safeForDefault: boolean;
  safeForPreview: boolean;
  sponsorId?: string;
  zoneId?: string;
};

export type BoothProductMappingSummary = {
  approximateCount: number;
  defaultSafeCount: number;
  deferredCount: number;
  exactCount: number;
  mappedCount: number;
  missingCount: number;
  previewSafeCount: number;
  profileCount: number;
  rendered: false;
};

export type BoothProductDebugSummary = {
  defaultSafeCount: number;
  deferredMappingCount: number;
  exactMappingCount: number;
  firstPreviewSafeBoothId: string | null;
  firstPreviewSafeProfileId: string | null;
  firstPreviewSafeTier: BoothPackageTier | null;
  hasAiAgentUi: false;
  hasBackend: false;
  hasBookingUi: false;
  hasLeadCaptureUi: false;
  mappingCount: number;
  previewSafeCount: number;
  profileCount: number;
  rendered: false;
};
