import type {
  BoothPackageDefinition,
  BoothPackageTier,
  BoothProductAnalyticsSummary,
  BoothProductCta,
  BoothProductProfile,
  BoothProductReadinessSummary,
} from './boothProductTypes';

const NO_BACKEND_INTEGRATION = false;
const NO_RUNTIME_RENDERING = false;

const STANDARD_CTA_SET: readonly BoothProductCta[] = [
  {
    analyticsId: 'booth_product_cta_learn_more_visible',
    enabledInPreview: true,
    enabledInProduction: false,
    id: 'standard-learn-more',
    label: 'Learn More',
    shortLabel: 'Learn',
    type: 'learnMore',
  },
  {
    analyticsId: 'booth_product_cta_request_demo_visible',
    enabledInPreview: true,
    enabledInProduction: false,
    id: 'standard-request-demo',
    label: 'Request Demo',
    shortLabel: 'Demo',
    type: 'requestDemo',
  },
  {
    analyticsId: 'booth_product_cta_download_pdf_visible',
    enabledInPreview: false,
    enabledInProduction: false,
    id: 'standard-download-pdf',
    label: 'Download PDF',
    notes: 'Placeholder only; no brochure UI or file delivery exists in Round 24.',
    shortLabel: 'PDF',
    type: 'downloadPdf',
  },
];

const PREMIUM_CTA_SET: readonly BoothProductCta[] = [
  {
    analyticsId: 'booth_product_cta_book_meeting_visible',
    enabledInPreview: true,
    enabledInProduction: false,
    id: 'premium-book-meeting',
    label: 'Book Meeting',
    notes: 'Metadata only; no meeting booking flow exists in Round 24.',
    shortLabel: 'Meet',
    type: 'bookMeeting',
  },
  {
    analyticsId: 'booth_product_cta_run_diagnostic_visible',
    enabledInPreview: true,
    enabledInProduction: false,
    id: 'premium-run-diagnostic',
    label: 'Run Diagnostic',
    notes: 'Metadata only; diagnostic UI is intentionally deferred.',
    shortLabel: 'Diagnostic',
    type: 'runDiagnostic',
  },
  {
    analyticsId: 'booth_product_cta_ai_agent_visible',
    enabledInPreview: false,
    enabledInProduction: false,
    id: 'premium-talk-to-ai-agent',
    label: 'Talk to AI Agent',
    notes: 'Placeholder only; AI booth agents are not implemented in Round 24.',
    shortLabel: 'AI Agent',
    type: 'talkToAiAgent',
  },
];

const SPONSOR_CONCIERGE_PREMIUM_CTA_SET: readonly BoothProductCta[] = [
  {
    analyticsId: 'sponsor_concierge_request_demo_visible_placeholder',
    enabledInPreview: true,
    enabledInProduction: false,
    id: 'sponsor-concierge-request-demo',
    label: 'Request Demo',
    notes: 'Metadata only; no request-demo UI or routing is wired in Round 26.',
    shortLabel: 'Demo',
    type: 'requestDemo',
  },
  {
    analyticsId: 'sponsor_concierge_book_meeting_visible_placeholder',
    enabledInPreview: true,
    enabledInProduction: false,
    id: 'sponsor-concierge-book-meeting',
    label: 'Book Meeting',
    notes: 'Metadata only; existing booth booking behavior is not changed in Round 26.',
    shortLabel: 'Meet',
    type: 'bookMeeting',
  },
  {
    analyticsId: 'sponsor_concierge_run_diagnostic_visible_placeholder',
    enabledInPreview: false,
    enabledInProduction: false,
    id: 'sponsor-concierge-run-diagnostic',
    label: 'Run Diagnostic',
    notes: 'Placeholder only; no diagnostic UI exists in Round 26.',
    shortLabel: 'Diagnostic',
    type: 'runDiagnostic',
  },
  {
    analyticsId: 'sponsor_concierge_download_pdf_visible_placeholder',
    enabledInPreview: false,
    enabledInProduction: false,
    id: 'sponsor-concierge-download-pdf',
    label: 'Download PDF',
    notes: 'Placeholder only; no brochure UI or file delivery exists in Round 26.',
    shortLabel: 'PDF',
    type: 'downloadPdf',
  },
];

const IMMERSIVE_FABRIC_LABS_STANDARD_CTA_SET: readonly BoothProductCta[] = [
  {
    analyticsId: 'immersive_fabric_labs_view_demo_visible_placeholder',
    enabledInPreview: true,
    enabledInProduction: false,
    id: 'immersive-fabric-labs-view-demo',
    label: 'View Demo',
    notes: 'Metadata only; no demo route, modal, video or click behavior is wired in Round 30.',
    shortLabel: 'Demo',
    type: 'learnMore',
  },
  {
    analyticsId: 'immersive_fabric_labs_request_info_visible_placeholder',
    enabledInPreview: true,
    enabledInProduction: false,
    id: 'immersive-fabric-labs-request-info',
    label: 'Request Info',
    notes: 'Metadata only; no info request form, redirect or backend call is wired in Round 31.',
    shortLabel: 'Info',
    type: 'learnMore',
  },
  {
    analyticsId: 'immersive_fabric_labs_get_package_visible_placeholder',
    enabledInPreview: true,
    enabledInProduction: false,
    id: 'immersive-fabric-labs-get-package',
    label: 'Get Package',
    notes: 'Metadata only; no lead capture, package form or backend call is wired in Round 31.',
    shortLabel: 'Package',
    type: 'learnMore',
  },
];

const LANDMARK_CTA_SET: readonly BoothProductCta[] = [
  {
    analyticsId: 'ai_district_landmark_sponsor_zone_visible_placeholder',
    enabledInPreview: true,
    enabledInProduction: false,
    id: 'ai-district-sponsor-zone',
    label: 'Sponsor Zone',
    notes: 'Metadata only; no sponsor zone CTA UI or routing exists in Round 32.',
    shortLabel: 'Sponsor',
    type: 'learnMore',
  },
  {
    analyticsId: 'ai_district_landmark_view_package_visible_placeholder',
    enabledInPreview: true,
    enabledInProduction: false,
    id: 'ai-district-view-package',
    label: 'View Package',
    notes: 'Metadata only; no package page, modal or backend call exists in Round 32.',
    shortLabel: 'Package',
    type: 'learnMore',
  },
  {
    analyticsId: 'ai_district_landmark_reserve_slot_visible_placeholder',
    enabledInPreview: true,
    enabledInProduction: false,
    id: 'ai-district-reserve-slot',
    label: 'Reserve Slot',
    notes: 'Metadata only; no booking, reservation UI or redirect exists in Round 32.',
    shortLabel: 'Slot',
    type: 'joinEvent',
  },
];

export const BOOTH_PACKAGE_DEFINITIONS = [
  {
    futureUpsells: ['Lead capture form', 'meeting scheduler', 'sponsor dashboard reporting'],
    includedFeatures: ['Logo presence', 'short pitch', 'CTA placeholders', 'brochure placeholder'],
    label: 'Standard Booth',
    priceHint: 'Entry sponsor package placeholder',
    sponsorValue: ['Basic sponsor discovery', 'product-card readiness', 'future CTA analytics readiness'],
    tier: 'standard',
  },
  {
    futureUpsells: ['AI diagnostic', 'lead scoring', 'meeting booking', 'AI booth agent'],
    includedFeatures: ['Premium product profile', 'diagnostic placeholder', 'meeting CTA placeholder', 'lead scoring placeholder'],
    label: 'Premium AI Diagnostic Booth',
    priceHint: 'Premium sponsor package placeholder',
    sponsorValue: ['Higher-intent lead capture readiness', 'diagnostic differentiation', 'future AI-assisted selling'],
    tier: 'premium',
  },
  {
    futureUpsells: ['Zone analytics report', 'event sponsorship bundle', 'landmark hero creative'],
    includedFeatures: ['Zone naming concept', 'hero screen concept', 'event slot placeholder', 'report sponsor placeholder'],
    label: 'Landmark Zone Sponsor',
    priceHint: 'Landmark sponsor package placeholder',
    sponsorValue: ['Owns a named city moment', 'ties booth package to Demo Arena/event inventory', 'supports premium sponsorship storytelling'],
    tier: 'landmarkZone',
  },
] as const satisfies readonly BoothPackageDefinition[];

export const BOOTH_PRODUCT_PROFILES = [
  {
    aiAgent: {
      enabledInPreview: false,
      enabledInProduction: false,
      personaLabel: 'Sponsor concierge placeholder',
      promptIntent: 'Future AI-guided qualification for sponsor meetings and lead routing.',
    },
    analytics: {
      ctaClickAnalyticsId: 'sponsor_concierge_cta_click_placeholder',
      ctaVisibleAnalyticsId: 'sponsor_concierge_cta_visible_placeholder',
      profileViewAnalyticsId: 'sponsor_concierge_profile_view_placeholder',
    },
    assets: {
      brochureKey: 'sponsor-concierge-premium-brief-placeholder',
      logoKey: 'sponsor-concierge-logo-placeholder',
    },
    boothId: 'sponsor-concierge',
    category: 'Sponsor Operations / Event Partnerships',
    ctas: SPONSOR_CONCIERGE_PREMIUM_CTA_SET,
    diagnostics: {
      diagnosticId: 'sponsor-concierge-qualification-placeholder',
      enabledInPreview: false,
      enabledInProduction: false,
    },
    displayName: 'Sponsor Concierge',
    featureBullets: [
      'Meeting-oriented premium sponsor package readiness',
      'CTA metadata for demo requests and future qualification',
      'Future lead scoring and AI-guided sponsor follow-up placeholders',
    ],
    heroMessage: 'Premium sponsor booth for meetings, demo requests and future AI-guided qualification.',
    id: 'sponsor-concierge-premium-profile',
    leadCapture: {
      enabledInPreview: false,
      enabledInProduction: false,
      fields: ['name', 'email', 'company', 'sponsor_interest'],
    },
    notes: 'Exact preview-safe mapping only; no rendering integration, lead UI, AI agent UI or click behavior is added in Round 26.',
    packageTier: 'premium',
    shortPitch: 'A premium booth package concept focused on sponsor conversion, CTA readiness and future lead scoring.',
    sponsorId: 'sponsor-concierge',
    tagline: 'Helps partners turn expo presence into meetings and measurable leads.',
  },
  {
    aiAgent: {
      enabledInPreview: false,
      enabledInProduction: false,
      personaLabel: 'Immersive demo guide placeholder',
      promptIntent: 'Future AI-guided qualification for immersive product demo interest.',
    },
    analytics: {
      ctaClickAnalyticsId: 'immersive_fabric_labs_cta_click_placeholder',
      ctaVisibleAnalyticsId: 'immersive_fabric_labs_cta_visible_placeholder',
      profileViewAnalyticsId: 'immersive_fabric_labs_profile_view_placeholder',
    },
    assets: {
      brochureKey: 'immersive-fabric-labs-standard-brief-placeholder',
      logoKey: 'immersive-fabric-labs-logo-placeholder',
    },
    boothId: 'immersive-fabric-labs',
    category: 'XR / Web3D Product Showcases',
    ctas: IMMERSIVE_FABRIC_LABS_STANDARD_CTA_SET,
    diagnostics: {
      enabledInPreview: false,
      enabledInProduction: false,
    },
    displayName: 'Immersive Fabric Labs',
    featureBullets: [
      'Product profile and short pitch readiness',
      'Demo showcase screen placeholder',
      'Sponsor package request metadata',
    ],
    heroMessage: 'Standard booth package for immersive product storytelling and sponsor interest.',
    id: 'immersive-fabric-labs-standard-profile',
    leadCapture: {
      enabledInPreview: false,
      enabledInProduction: false,
      fields: ['name', 'email', 'company', 'demo_interest'],
    },
    notes: 'Exact preview-safe Standard Booth mapping only; no rendering beyond the review-only boothProduct preview card, lead UI, AI agent UI or click behavior is added in Round 31.',
    packageTier: 'standard',
    shortPitch: 'A standard booth package concept for product showcase, short pitch and sponsor package requests.',
    sponsorId: 'immersive-fabric-labs',
    tagline: 'Immersive product showcase readiness',
  },
  {
    aiAgent: {
      enabledInPreview: false,
      enabledInProduction: false,
      personaLabel: 'Product concierge placeholder',
      promptIntent: 'Explain product value and route qualified visitors to sponsor CTAs later.',
    },
    analytics: {
      ctaClickAnalyticsId: 'flowforge_cta_click_placeholder',
      ctaVisibleAnalyticsId: 'flowforge_cta_visible_placeholder',
      profileViewAnalyticsId: 'flowforge_profile_view_placeholder',
    },
    assets: {
      brochureKey: 'flowforge-brochure-placeholder',
      logoKey: 'flowforge-logo-placeholder',
    },
    boothId: 'standard-booth-flowforge-ai',
    category: 'Automation',
    ctas: STANDARD_CTA_SET,
    diagnostics: {
      enabledInPreview: false,
      enabledInProduction: false,
    },
    displayName: 'FlowForge AI',
    featureBullets: ['Workflow automation audit', 'No-code operations templates', 'Team handoff recommendations'],
    heroMessage: 'Automate repeatable operations without losing human control.',
    id: 'flowforge-ai-standard-profile',
    leadCapture: {
      enabledInPreview: false,
      enabledInProduction: false,
      fields: ['name', 'email', 'company'],
    },
    notes: 'Mock Standard Booth profile for product-package structure only.',
    packageTier: 'standard',
    shortPitch: 'A compact product profile for teams evaluating automation workflows.',
    sponsorId: 'mock-flowforge-ai',
    tagline: 'Ops automation readiness',
  },
  {
    aiAgent: {
      enabledInPreview: false,
      enabledInProduction: false,
      personaLabel: 'Prompt advisor placeholder',
      promptIntent: 'Answer common sponsor-product questions after AI agents are approved.',
    },
    analytics: {
      ctaClickAnalyticsId: 'promptgrid_cta_click_placeholder',
      ctaVisibleAnalyticsId: 'promptgrid_cta_visible_placeholder',
      profileViewAnalyticsId: 'promptgrid_profile_view_placeholder',
    },
    assets: {
      brochureKey: 'promptgrid-brochure-placeholder',
      logoKey: 'promptgrid-logo-placeholder',
    },
    boothId: 'standard-booth-promptgrid',
    category: 'AI Enablement',
    ctas: STANDARD_CTA_SET,
    diagnostics: {
      enabledInPreview: false,
      enabledInProduction: false,
    },
    displayName: 'PromptGrid',
    featureBullets: ['Prompt library governance', 'Role-based rollout templates', 'Usage policy checklist'],
    heroMessage: 'Launch internal AI workspaces with governance built in.',
    id: 'promptgrid-standard-profile',
    leadCapture: {
      enabledInPreview: false,
      enabledInProduction: false,
      fields: ['name', 'email', 'role'],
    },
    notes: 'Mock Standard Booth profile for package comparison.',
    packageTier: 'standard',
    shortPitch: 'A standard sponsor booth profile for AI adoption teams.',
    sponsorId: 'mock-promptgrid',
    tagline: 'Governed AI adoption',
  },
  {
    aiAgent: {
      enabledInPreview: false,
      enabledInProduction: false,
      personaLabel: 'Diagnostic consultant placeholder',
      promptIntent: 'Guide visitors through a future AI diagnostic once that system exists.',
    },
    analytics: {
      ctaClickAnalyticsId: 'metricmesh_cta_click_placeholder',
      ctaVisibleAnalyticsId: 'metricmesh_cta_visible_placeholder',
      profileViewAnalyticsId: 'metricmesh_profile_view_placeholder',
    },
    assets: {
      brochureKey: 'metricmesh-premium-brief-placeholder',
      logoKey: 'metricmesh-logo-placeholder',
      videoKey: 'metricmesh-video-placeholder',
    },
    boothId: 'premium-booth-metricmesh',
    category: 'Revenue Intelligence',
    ctas: PREMIUM_CTA_SET,
    diagnostics: {
      diagnosticId: 'metricmesh-revenue-readiness-placeholder',
      enabledInPreview: true,
      enabledInProduction: false,
    },
    displayName: 'MetricMesh',
    featureBullets: ['Revenue operations diagnostic placeholder', 'Meeting CTA readiness', 'Future lead scoring placeholder'],
    heroMessage: 'Find the fastest revenue workflow gaps before the first sales call.',
    id: 'metricmesh-premium-profile',
    leadCapture: {
      enabledInPreview: true,
      enabledInProduction: false,
      fields: ['name', 'email', 'company', 'team_size'],
    },
    notes: 'Mock Premium Booth profile; diagnostic and lead capture are metadata-only.',
    packageTier: 'premium',
    shortPitch: 'A premium sponsor profile prepared for future diagnostic and meeting workflows.',
    sponsorId: 'mock-metricmesh',
    tagline: 'Revenue workflow diagnostic',
  },
  {
    aiAgent: {
      enabledInPreview: false,
      enabledInProduction: false,
      personaLabel: 'Zone host placeholder',
      promptIntent: 'Introduce the zone sponsor and route visitors to future sponsored events.',
    },
    analytics: {
      ctaClickAnalyticsId: 'ai_district_landmark_cta_click_placeholder',
      ctaVisibleAnalyticsId: 'ai_district_landmark_cta_visible_placeholder',
      profileViewAnalyticsId: 'ai_district_landmark_profile_view_placeholder',
    },
    assets: {
      brochureKey: 'ai-district-landmark-zone-brief-placeholder',
      logoKey: 'ai-district-landmark-logo-placeholder',
    },
    boothId: 'warpala-platform',
    category: 'Landmark Sponsorship',
    ctas: LANDMARK_CTA_SET,
    diagnostics: {
      enabledInPreview: false,
      enabledInProduction: false,
    },
    displayName: 'AI District Sponsor',
    featureBullets: ['Zone naming rights', 'Hero screen placement', 'Demo Arena sponsor slot', 'Monthly sponsor report'],
    heroMessage: 'Own the highest-visibility zone across demos, booths and event traffic.',
    id: 'automation-arena-landmark-profile',
    leadCapture: {
      enabledInPreview: false,
      enabledInProduction: false,
      fields: ['name', 'email', 'company', 'sponsor_interest'],
    },
    notes: 'Preview-only Landmark Zone Sponsor concept mapped to the verified Warpala Platform hero booth surface; no default rendering, screen ownership, click behavior or backend flow is added in Round 32.',
    packageTier: 'landmarkZone',
    shortPitch: 'A landmark sponsor package concept tying zone naming, hero presence, Demo Arena inventory and reporting.',
    sponsorId: 'warpala-platform',
    tagline: 'Highest-visibility zone sponsorship concept',
  },
] as const satisfies readonly BoothProductProfile[];

export function getBoothProductProfile(boothId: string) {
  const normalizedBoothId = boothId.trim();
  return BOOTH_PRODUCT_PROFILES.find((profile) => (
    profile.boothId === normalizedBoothId || profile.id === normalizedBoothId
  )) ?? null;
}

export function getBoothProductProfilesByTier(tier: BoothPackageTier) {
  return BOOTH_PRODUCT_PROFILES.filter((profile) => profile.packageTier === tier);
}

export function getBoothPackageDefinition(tier: BoothPackageTier) {
  return BOOTH_PACKAGE_DEFINITIONS.find((definition) => definition.tier === tier) ?? null;
}

export function getBoothProductCtas(boothId: string) {
  return getBoothProductProfile(boothId)?.ctas ?? [];
}

export function getBoothProductAnalyticsSummary(): BoothProductAnalyticsSummary {
  const ctas = BOOTH_PRODUCT_PROFILES.flatMap((profile) => profile.ctas);

  return {
    backendEnabled: NO_BACKEND_INTEGRATION,
    ctaCount: ctas.length,
    previewEnabledCtaCount: ctas.filter((cta) => cta.enabledInPreview).length,
    productionEnabledCtaCount: ctas.filter((cta) => cta.enabledInProduction).length,
    profileCount: BOOTH_PRODUCT_PROFILES.length,
  };
}

export function getBoothProductReadinessSummary(): BoothProductReadinessSummary {
  return {
    aiAgentPreviewEnabledCount: BOOTH_PRODUCT_PROFILES.filter((profile) => profile.aiAgent.enabledInPreview).length,
    backendEnabled: NO_BACKEND_INTEGRATION,
    diagnosticPreviewEnabledCount: BOOTH_PRODUCT_PROFILES.filter((profile) => profile.diagnostics.enabledInPreview).length,
    landmarkZoneCount: getBoothProductProfilesByTier('landmarkZone').length,
    leadCapturePreviewEnabledCount: BOOTH_PRODUCT_PROFILES.filter((profile) => profile.leadCapture.enabledInPreview).length,
    packageTierCount: BOOTH_PACKAGE_DEFINITIONS.length,
    premiumBoothCount: getBoothProductProfilesByTier('premium').length,
    productionEnabledAiAgentCount: BOOTH_PRODUCT_PROFILES.filter((profile) => profile.aiAgent.enabledInProduction).length,
    productionEnabledDiagnosticCount: BOOTH_PRODUCT_PROFILES.filter((profile) => profile.diagnostics.enabledInProduction).length,
    productionEnabledLeadCaptureCount: BOOTH_PRODUCT_PROFILES.filter((profile) => profile.leadCapture.enabledInProduction).length,
    profileCount: BOOTH_PRODUCT_PROFILES.length,
    rendered: NO_RUNTIME_RENDERING,
    standardBoothCount: getBoothProductProfilesByTier('standard').length,
  };
}
