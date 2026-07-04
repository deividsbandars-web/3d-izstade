import { Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Text, useVideoTexture } from '@react-three/drei';
import { companyAdminService } from '../../../modules/expo/services/companyAdminService';
import {
  applyMediaReviewAdminAction,
  getMediaReviewUploadAccept,
  getMediaReviewUploadLabel,
  getMediaReviewPromoteTargets,
  uploadMediaReviewFile,
} from '../../../app/expo/mediaReviewUploadService';
import {
  getSponsorAssetUploadAccept,
  getSponsorAssetUploadLabel,
  uploadSponsorAssetPackFile,
  type ExpoSponsorAssetUploadTarget,
} from '../../../app/expo/sponsorAssetUploadService';
import { EXPO_CANONICAL_DISTRICT_CATALOG } from '../../../services/expoService';
import {
  EXPO_SCREEN_CONTENT_IMAGE_EXTENSIONS,
  EXPO_SCREEN_CONTENT_VIDEO_EXTENSIONS,
  normalizeExpoScreenContentForSave,
  validateExpoScreenMediaUrl,
} from '../../../shared/expo/screenContentMedia';
import {
  EXPO_MEDIA_REVIEW_REFERENCE_POLICY_TEXT,
  normalizeExpoMediaReviewReferencesForSave,
  readExpoMediaReviewReferencesFromAssets,
} from '../../../shared/expo/mediaReviewReferences';
import {
  getExpoMediaReviewUploadStatusLabel,
  type ExpoMediaReviewUploadKind,
  type ExpoMediaReviewUploadPromoteTarget,
  type ExpoMediaReviewUploadRecord,
} from '../../../shared/expo/mediaReviewUpload';
import {
  EXPO_SPONSOR_ASSET_PACK_MEDIA_POLICY_TEXT,
  EXPO_SPONSOR_ASSET_PACK_PRODUCT_IMAGE_LIMIT,
  getExpoSponsorAssetPackReadiness,
  normalizeExpoSponsorAssetPackForSave,
  readExpoSponsorAssetPackFromAssets,
  type ExpoSponsorPackageTier,
} from '../../../shared/expo/sponsorAssetPack';
import {
  getAvailableExpoScreenSlots,
  getExpoScreenInventorySlots,
  getExpoScreenInventorySummary,
  getExpoScreenSlotById,
  getExpoScreenSlotsForBooth,
} from '../../../shared/expo/screenInventory';
import {
  canTransitionExpoBoothPublicationStatus,
  EXPO_BOOTH_PUBLICATION_STATUSES,
  getExpoBoothAllowedNextStatuses,
  getExpoBoothPublicationStatusLabel,
  isExpoBoothPublicSceneStatus,
  normalizeExpoBoothPublicationStatus,
  type ExpoBoothPublicationStatus,
} from '../../../shared/expo/boothPublicationStatus';
import {
  normalizeExpoCityScreenCampaign,
  type ExpoCityScreenCampaignStatus,
} from '../../../shared/expo/cityScreenCampaign';
import '../../../components/calculator/styles/CalculatorPro.css';
import {
  CompanyAdminAccessNotice,
  CompanyAdminLaunchFlow,
  CompanyAdminMessage,
  CompanyAdminPageHeader,
} from './CompanyAdminSections';
import {
  BoothQuickSetup,
  CityScreenQuickSetup,
  CompanyAdminWorkspaceTabs,
  type CompanyAdminWorkspaceMode,
} from './CompanyAdminQuickSetup';
import { useCompanyAdminState } from './useCompanyAdminState';

function VideoPreviewMaterial({ url }: { url: string }) {
  try {
    const texture = useVideoTexture(
      url,
      { crossOrigin: 'Anonymous', loop: true, muted: true },
    );
    return <meshBasicMaterial map={texture} toneMapped={false} />;
  } catch {
    return <meshStandardMaterial color="#111111" />;
  }
}

function SafeVideoPreview({ url }: { url: string | null }) {
  const validation = validateExpoScreenMediaUrl(url, 'video');

  if (!validation.ok || !validation.url) {
    return <meshStandardMaterial color="#111111" />;
  }

  return <VideoPreviewMaterial url={validation.url} />;
}

function BoothPreview({ company, color }: { company: { booth?: { video_url?: string }; name?: string }; color: string }) {
  return (
    <group position={[0, -5, 0]}>
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[22, 0.2, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 8, -7.5]} castShadow>
        <boxGeometry args={[22, 16, 1]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 16.5, -7]} castShadow>
        <boxGeometry args={[22, 3, 1.2]} />
        <meshStandardMaterial color={color || '#3b82f6'} />
      </mesh>
      <Text position={[0, 16.5, -6.3]} fontSize={1.5} color="#ffffff">
        {(company.name || 'COMPANY').toUpperCase()}
      </Text>
      <mesh position={[0, 8, -6.9]}>
        <planeGeometry args={[18, 10]} />
        <Suspense fallback={<meshStandardMaterial color="#000000" />}>
          <SafeVideoPreview url={company.booth?.video_url || null} />
        </Suspense>
      </mesh>
    </group>
  );
}

type AdminCompanyState = {
  booth: {
    video_url: string;
  };
  cityScreenContent: AdminScreenContentState;
  description: string;
  district: string;
  id: string;
  logo_url: string;
  mediaReview: AdminMediaReviewState;
  name: string;
  screenContent: AdminScreenContentState;
  sponsorAssetPack: AdminSponsorAssetPackState;
  status: ExpoBoothPublicationStatus;
};

type AdminScreenContentMode = 'generated-card' | 'image' | 'video' | 'video-placeholder';
type AdminScreenContentStatus = 'draft' | 'published';

type AdminScreenContentState = {
  campaignEndDate: string;
  campaignStartDate: string;
  campaignStatus: ExpoCityScreenCampaignStatus;
  ctaLabel: string;
  imageUrl: string;
  mode: AdminScreenContentMode;
  screenSlotId: string;
  status: AdminScreenContentStatus;
  subtitle: string;
  title: string;
  videoUrl: string;
};

type AdminSponsorAssetPackState = {
  brochureUrl: string;
  ctaPrimary: string;
  ctaSecondary: string;
  demoVideoUrl: string;
  headline: string;
  heroImageUrl: string;
  logoUrl: string;
  packageTier: ExpoSponsorPackageTier;
  productImageUrls: string;
  shortPitch: string;
  websiteUrl: string;
};

type AdminMediaReviewState = {
  bookingUrl: string;
  ctaLabel: string;
  heroImageUrl: string;
  heroVideoUrl: string;
  logoUrl: string;
  mediaNotes: string;
  posterUrl: string;
  tagline: string;
  uploads: ExpoMediaReviewUploadRecord[];
  websiteUrl: string;
};

type ManagedAnalytics = {
  interactions?: number;
  leads_generated?: number;
  visits?: number;
} | null;

type ManagedLead = {
  client_email?: string;
  client_name?: string;
  created_at?: string;
  follow_up_at?: string | null;
  id?: string;
  message?: string | null;
  ops_notes?: string | null;
  ops_updated_at?: string | null;
  service_name?: string | null;
  status?: string | null;
};

type AdminLaunchStepState = 'blocked' | 'ready' | 'review';

type AdminLaunchStep = {
  actionLabel?: string;
  body: string;
  label: string;
  onAction?: () => void;
  state: AdminLaunchStepState;
  status: string;
};

type SponsorReadinessCategory =
  | 'Ready for demo'
  | 'Needs media review'
  | 'Needs CTA/contact info'
  | 'Waiting for approval'
  | 'Published'
  | 'Archived';

type AdminAccessState =
  | 'checking-auth'
  | 'ready'
  | 'signed-out'
  | 'access-denied'
  | 'backend-unavailable'
  | 'unavailable';

const LEAD_STATUS_LABELS: Record<string, string> = {
  closed: 'Closed',
  contacted: 'Contacted',
  pending: 'Pending',
  rejected: 'Rejected',
};

const LEAD_STATUS_COLORS: Record<string, string> = {
  closed: '#34d399',
  contacted: '#93c5fd',
  pending: '#fbbf24',
  rejected: '#f87171',
};

const EXPO_SCREEN_TEST_IMAGE_PATH = '/expo/media/warpala-expo-camera-orbit-test.gif';
const DEFAULT_VISIBLE_SCENE_COMPANY_NAME = 'Warpala Platform';
const DEFAULT_SCREEN_TEST_TITLE = 'Warpala Expo Screen Test';
const DEFAULT_SCREEN_TEST_SUBTITLE = 'Camera orbit test loop for booth and city screen replacement.';
const DEFAULT_SCREEN_TEST_CTA = 'Open Booth';
const SCREEN_MEDIA_SETUP_GUIDE = [
  {
    label: 'Image',
    value: 'Upload an image or use a direct image file link ending .jpg, .jpeg, .png, .webp, or .gif.',
  },
  {
    label: 'Video',
    value: 'Upload a video or use a direct .mp4 or .webm file link. Sharing pages are reviewed separately.',
  },
  {
    label: 'Website / CTA',
    value: 'Use the CTA label for presentation text now. Website embeds, redirects, and forms are intentionally not enabled yet.',
  },
  {
    label: 'Visibility',
    value: 'This section controls the screen inside the booth. City advertising is configured separately in the City advertising tab.',
  },
] as const;

const ADMIN_LAUNCH_STEP_STYLE: Record<AdminLaunchStepState, { accent: string; background: string; border: string; label: string }> = {
  blocked: {
    accent: '#fca5a5',
    background: 'rgba(127, 29, 29, 0.24)',
    border: 'rgba(248, 113, 113, 0.32)',
    label: 'Needs work',
  },
  ready: {
    accent: '#86efac',
    background: 'rgba(6, 78, 59, 0.24)',
    border: 'rgba(52, 211, 153, 0.32)',
    label: 'Ready',
  },
  review: {
    accent: '#fde68a',
    background: 'rgba(120, 53, 15, 0.24)',
    border: 'rgba(251, 191, 36, 0.32)',
    label: 'Review',
  },
};

const SPONSOR_READINESS_STYLE: Record<SponsorReadinessCategory, { accent: string; background: string; border: string }> = {
  'Archived': {
    accent: '#94a3b8',
    background: 'rgba(51, 65, 85, 0.28)',
    border: 'rgba(148, 163, 184, 0.24)',
  },
  'Needs CTA/contact info': {
    accent: '#fbbf24',
    background: 'rgba(120, 53, 15, 0.28)',
    border: 'rgba(251, 191, 36, 0.24)',
  },
  'Needs media review': {
    accent: '#f97316',
    background: 'rgba(124, 45, 18, 0.28)',
    border: 'rgba(249, 115, 22, 0.24)',
  },
  'Published': {
    accent: '#34d399',
    background: 'rgba(6, 78, 59, 0.28)',
    border: 'rgba(52, 211, 153, 0.24)',
  },
  'Ready for demo': {
    accent: '#38bdf8',
    background: 'rgba(8, 47, 73, 0.28)',
    border: 'rgba(56, 189, 248, 0.24)',
  },
  'Waiting for approval': {
    accent: '#c084fc',
    background: 'rgba(88, 28, 135, 0.24)',
    border: 'rgba(192, 132, 252, 0.24)',
  },
};

const DEFAULT_SPONSOR_ASSET_PACK: AdminSponsorAssetPackState = {
  brochureUrl: '',
  ctaPrimary: 'Request Demo',
  ctaSecondary: 'View Package',
  demoVideoUrl: '',
  headline: '',
  heroImageUrl: '',
  logoUrl: '',
  packageTier: 'standard',
  productImageUrls: '',
  shortPitch: '',
  websiteUrl: '',
};

const DEFAULT_MEDIA_REVIEW: AdminMediaReviewState = {
  bookingUrl: '',
  ctaLabel: 'Request Demo',
  heroImageUrl: '',
  heroVideoUrl: '',
  logoUrl: '',
  mediaNotes: '',
  posterUrl: '',
  tagline: '',
  uploads: [],
  websiteUrl: '',
};

const DEFAULT_COMPANY: AdminCompanyState = {
  booth: { video_url: '' },
  cityScreenContent: {
    campaignEndDate: '',
    campaignStartDate: '',
    campaignStatus: 'draft',
    ctaLabel: '',
    imageUrl: '',
    mode: 'generated-card',
    screenSlotId: '',
    status: 'draft',
    subtitle: '',
    title: '',
    videoUrl: '',
  },
  description: '',
  district: EXPO_CANONICAL_DISTRICT_CATALOG[0]?.id ?? '',
  id: '',
  logo_url: '',
  mediaReview: DEFAULT_MEDIA_REVIEW,
  name: DEFAULT_VISIBLE_SCENE_COMPANY_NAME,
  screenContent: {
    campaignEndDate: '',
    campaignStartDate: '',
    campaignStatus: 'draft',
    ctaLabel: '',
    imageUrl: '',
    mode: 'generated-card',
    screenSlotId: '',
    status: 'draft',
    subtitle: '',
    title: '',
    videoUrl: '',
  },
  sponsorAssetPack: DEFAULT_SPONSOR_ASSET_PACK,
  status: 'draft',
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function normalizeScreenMode(value: unknown): AdminScreenContentMode {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'image') {
    return 'image';
  }

  if (normalized === 'video') {
    return 'video';
  }

  if (normalized === 'video-placeholder') {
    return 'video-placeholder';
  }

  return 'generated-card';
}

function normalizeScreenStatus(value: unknown): AdminScreenContentStatus {
  return String(value || '').trim().toLowerCase() === 'published' ? 'published' : 'draft';
}

function normalizeAdminLookupKey(value: unknown) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function resolveVisibleSceneCompanyName(value: string) {
  return normalizeAdminLookupKey(value) === 'warpala' ? DEFAULT_VISIBLE_SCENE_COMPANY_NAME : value;
}

function countTruthy(values: boolean[]) {
  return values.filter(Boolean).length;
}

function buildManagedBoothPreviewRoute(boothId: string) {
  const normalizedBoothId = boothId.trim();
  const params = new URLSearchParams({
    expoData: 'review',
    focus: normalizedBoothId,
    managedBoothPreview: normalizedBoothId,
    operator: '1',
    quality: 'high',
  });

  return `/expo-3d?${params.toString()}`;
}

function readAdminScreenContent(
  assets3d: unknown,
  assetKey: 'city_screen_content' | 'screen_content' = 'screen_content',
): AdminScreenContentState {
  const assets = asRecord(assets3d);
  const screenContent = asRecord(assets[assetKey]);

  return {
    campaignEndDate: String(screenContent.campaignEndDate || screenContent.campaign_end_date || ''),
    campaignStartDate: String(screenContent.campaignStartDate || screenContent.campaign_start_date || ''),
    campaignStatus: normalizeExpoCityScreenCampaign(screenContent).campaign.campaignStatus,
    ctaLabel: String(screenContent.ctaLabel || screenContent.cta_label || ''),
    imageUrl: String(screenContent.imageUrl || screenContent.image_url || screenContent.assetUrl || screenContent.asset_url || ''),
    mode: normalizeScreenMode(screenContent.mode || screenContent.mediaType || screenContent.media_type),
    screenSlotId: String(screenContent.screenSlotId || screenContent.screen_slot_id || ''),
    status: normalizeScreenStatus(screenContent.status),
    subtitle: String(screenContent.subtitle || screenContent.text || ''),
    title: String(screenContent.title || ''),
    videoUrl: String(screenContent.videoUrl || screenContent.video_url || assets.video_url || ''),
  };
}

function getDefaultCityScreenCampaignDates() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() + 7);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 29);

  return {
    campaignEndDate: end.toISOString().slice(0, 10),
    campaignStartDate: start.toISOString().slice(0, 10),
  };
}

function readAdminSponsorAssetPack(assets3d: unknown): AdminSponsorAssetPackState {
  const assetPack = readExpoSponsorAssetPackFromAssets(assets3d);

  return {
    brochureUrl: assetPack.brochureUrl,
    ctaPrimary: assetPack.ctaPrimary || DEFAULT_SPONSOR_ASSET_PACK.ctaPrimary,
    ctaSecondary: assetPack.ctaSecondary || DEFAULT_SPONSOR_ASSET_PACK.ctaSecondary,
    demoVideoUrl: assetPack.demoVideoUrl,
    headline: assetPack.headline,
    heroImageUrl: assetPack.heroImageUrl,
    logoUrl: assetPack.logoUrl,
    packageTier: assetPack.packageTier,
    productImageUrls: assetPack.productImageUrls.join('\n'),
    shortPitch: assetPack.shortPitch,
    websiteUrl: assetPack.websiteUrl,
  };
}

function readAdminMediaReview(
  assets3d: unknown,
  sponsorAssetPack: AdminSponsorAssetPackState,
  screenContent: AdminScreenContentState,
): AdminMediaReviewState {
  const mediaReview = readExpoMediaReviewReferencesFromAssets(assets3d);

  return {
    bookingUrl: mediaReview.bookingUrl,
    ctaLabel: mediaReview.ctaLabel || sponsorAssetPack.ctaPrimary || DEFAULT_MEDIA_REVIEW.ctaLabel,
    heroImageUrl: mediaReview.heroImageUrl || sponsorAssetPack.heroImageUrl,
    heroVideoUrl: mediaReview.heroVideoUrl || sponsorAssetPack.demoVideoUrl,
    logoUrl: mediaReview.logoUrl || sponsorAssetPack.logoUrl,
    mediaNotes: mediaReview.mediaNotes,
    posterUrl: mediaReview.posterUrl || screenContent.imageUrl,
    tagline: mediaReview.tagline || sponsorAssetPack.shortPitch,
    uploads: mediaReview.uploads,
    websiteUrl: mediaReview.websiteUrl || sponsorAssetPack.websiteUrl,
  };
}

function formatRequestError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function resolveAdminAccessStateFromError(errorText: string): Exclude<AdminAccessState, 'checking-auth' | 'ready'> {
  if (errorText.includes('SERVER_API_HTTP_401')) {
    return 'signed-out';
  }

  if (errorText.includes('SERVER_API_HTTP_403')) {
    return 'access-denied';
  }

  if (
    errorText.includes('SERVER_API_HTTP_500') ||
    errorText.includes('SERVER_API_HTTP_502') ||
    errorText.includes('SERVER_API_HTTP_503') ||
    errorText.includes('SERVER_API_HTTP_504') ||
    errorText.toLowerCase().includes('failed to fetch') ||
    errorText.toLowerCase().includes('networkerror') ||
    errorText.toLowerCase().includes('err_connection')
  ) {
    return 'backend-unavailable';
  }

  return 'unavailable';
}

function getAdminAccessNotice(accessState: AdminAccessState, technicalError: string | null) {
  if (accessState === 'signed-out') {
    return {
      actionLabel: 'Sign in to save',
      actionPath: '/login?next=/expo/admin',
      body: 'Sign in with your account to manage booth screens and sponsor content.',
      detail: 'No Expo API key is required here. Admin access uses your secure login session automatically.',
      title: 'Sign in required',
    };
  }

  if (accessState === 'access-denied') {
    return {
      actionLabel: 'Open sales demo',
      actionPath: '/expo-3d?salesDemo=1',
      body: 'This account is signed in, but it is not allowed to manage this booth.',
      detail: 'Use the sponsor owner account or an admin account before saving screen content.',
      title: 'Booth access required',
    };
  }

  if (accessState === 'backend-unavailable') {
    return {
      actionLabel: 'Open sales demo',
      actionPath: '/expo-3d?salesDemo=1',
      body: 'The admin page loaded, but the Expo service connection is not reachable right now.',
      detail: technicalError
        ? `This is not an API key requirement. Technical detail: ${technicalError}`
        : 'This is not an API key requirement. Check the backend service, then reload this page.',
      title: 'Admin service unavailable',
    };
  }

  if (accessState === 'unavailable') {
    return {
      actionLabel: 'Open sales demo',
      actionPath: '/expo-3d?salesDemo=1',
      body: 'Expo Admin could not load the booth management data.',
      detail: technicalError ? `Technical detail: ${technicalError}` : 'Retry after checking the backend and auth session.',
      title: 'Admin unavailable',
    };
  }

  return null;
}

const DEFAULT_ADMIN_DISTRICTS = [...EXPO_CANONICAL_DISTRICT_CATALOG.map((district) => district.id)];

function readAdminCompanyFromBoothPayload(payload: unknown, fallbackId = ''): AdminCompanyState {
  const booth = payload as {
    assets_3d?: Record<string, unknown>;
    company_name?: string;
    contact_info?: { description?: string };
    district?: string;
    id?: string;
    logo_url?: string;
    status?: string;
  };
  const screenContent = readAdminScreenContent(booth.assets_3d);
  const cityScreenContent = readAdminScreenContent(booth.assets_3d, 'city_screen_content');
  const sponsorAssetPack = readAdminSponsorAssetPack(booth.assets_3d);

  return {
    booth: {
      video_url: String(booth.assets_3d?.video_url || ''),
    },
    cityScreenContent,
    description: String(booth.contact_info?.description || ''),
    district: String(booth.district || EXPO_CANONICAL_DISTRICT_CATALOG[0]?.id || ''),
    id: String(booth.id || fallbackId),
    logo_url: String(booth.logo_url || ''),
    mediaReview: readAdminMediaReview(booth.assets_3d, sponsorAssetPack, screenContent),
    name: String(booth.company_name || 'Warpala'),
    screenContent,
    sponsorAssetPack,
    status: normalizeExpoBoothPublicationStatus(booth.status),
  };
}

function readManagedLeadInbox(payload: unknown) {
  return ((((payload as { leadInbox?: ManagedLead[] } | null)?.leadInbox) ?? []).map((entry) => entry));
}

function readManagedRoomRouteId(payload: unknown, fallbackId: string) {
  return String((payload as { reviewContext?: { roomRouteId?: string } } | null)?.reviewContext?.roomRouteId || fallbackId);
}

function getManagedLeadDraftKey(lead: ManagedLead) {
  return String(lead.id || '');
}

function getManagedLeadFollowUpAt(lead: ManagedLead) {
  return typeof lead.follow_up_at === 'string' && lead.follow_up_at ? lead.follow_up_at : null;
}

function getManagedLeadOpsNotes(lead: ManagedLead) {
  return String(lead.ops_notes || '');
}

export default function CompanyAdmin() {
  const nav = useNavigate();
  const [workspaceMode, setWorkspaceMode] = useState<CompanyAdminWorkspaceMode>(() => {
    if (typeof window === 'undefined') {
      return 'city-screen';
    }

    const requestedTask = new URLSearchParams(window.location.search).get('task');
    return requestedTask === 'advanced' || requestedTask === 'booth' ? requestedTask : 'city-screen';
  });
  const [cityScreenSlotSelection, setCityScreenSlotSelection] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return new URLSearchParams(window.location.search).get('screen') || '';
  });
  const {
    activeLeadAction,
    activeLeadOpsSave,
    activeMediaReviewAction,
    activeMediaReviewUpload,
    activeSponsorAssetUpload,
    adminAccessError,
    adminAccessState,
    analytics,
    company,
    districts,
    handleManagedBoothSelect,
    isOperatorAdmin,
    leadFilter,
    leadOpsDrafts,
    leads,
    loading,
    managedBooths,
    mediaReviewUploadStatus,
    message,
    roomRouteId,
    setActiveLeadAction,
    setActiveLeadOpsSave,
    setActiveMediaReviewAction,
    setActiveMediaReviewUpload,
    setActiveSponsorAssetUpload,
    setAdminAccessError,
    setAdminAccessState,
    setAnalytics,
    setCompany,
    setLeadFilter,
    setLeadOpsDrafts,
    setLeads,
    setLoading,
    setManagedBooths,
    setMediaReviewUploadStatus,
    setMessage,
    setRoomRouteId,
    setSponsorAssetUploadStatus,
    sponsorAssetUploadStatus,
  } = useCompanyAdminState<AdminCompanyState, ManagedAnalytics, ManagedLead>({
    defaultCompany: DEFAULT_COMPANY,
    defaultDistricts: DEFAULT_ADMIN_DISTRICTS,
    formatRequestError,
    getLeadDraftKey: getManagedLeadDraftKey,
    getLeadFollowUpAt: getManagedLeadFollowUpAt,
    getLeadOpsNotes: getManagedLeadOpsNotes,
    readCompanyFromBoothPayload: readAdminCompanyFromBoothPayload,
    readLeadInbox: readManagedLeadInbox,
    readRoomRouteId: readManagedRoomRouteId,
    resolveAccessStateFromError: resolveAdminAccessStateFromError,
  });

  useEffect(() => {
    if (loading || !cityScreenSlotSelection) {
      return;
    }

    setCompany((current) => {
      if (current.cityScreenContent.campaignStartDate || current.cityScreenContent.campaignEndDate) {
        return current;
      }

      return {
        ...current,
        cityScreenContent: {
          ...current.cityScreenContent,
          ...getDefaultCityScreenCampaignDates(),
          screenSlotId: cityScreenSlotSelection,
        },
      };
    });
  }, [cityScreenSlotSelection, loading, setCompany]);

  async function handleSave(
    nextStatus?: ExpoBoothPublicationStatus,
    companyOverride?: AdminCompanyState,
  ) {
    if (adminAccessState !== 'ready') {
      setMessage({ type: 'error', text: 'Sign in with a sponsor/admin account before saving booth screen content.' });
      return false;
    }

    const sourceCompany = companyOverride ?? company;

    if (nextStatus && !canTransitionExpoBoothPublicationStatus(sourceCompany.status, nextStatus)) {
      setMessage({
        type: 'error',
        text: `Invalid booth status transition from ${getExpoBoothPublicationStatusLabel(sourceCompany.status).toLowerCase()} to ${getExpoBoothPublicationStatusLabel(nextStatus).toLowerCase()}.`,
      });
      return false;
    }

    const companyForSave: AdminCompanyState = {
      ...sourceCompany,
      status: nextStatus ?? sourceCompany.status,
    };

    if (!companyForSave.name || !companyForSave.district) {
      setMessage({ type: 'error', text: 'Please provide a company name and district.' });
      return false;
    }

    const companyNameForSave = resolveVisibleSceneCompanyName(companyForSave.name.trim());
    setLoading(true);
    try {
      const result = await companyAdminService.saveManagedBooth({
        boothId: companyForSave.id || undefined,
        cityScreenContent: companyForSave.cityScreenContent,
        companyName: companyNameForSave,
        description: companyForSave.description,
        district: companyForSave.district,
        mediaReview: companyForSave.mediaReview,
        screenContent: companyForSave.screenContent,
        sponsorAssetPack: companyForSave.sponsorAssetPack,
        status: companyForSave.status,
        videoUrl: companyForSave.booth.video_url,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      const savedId = String((result.data as { id?: string } | null)?.id || company.id || '');
      setCompany((current) => ({
        ...current,
        ...companyForSave,
        id: savedId,
        name: companyNameForSave,
        status: companyForSave.status,
      }));
      if (savedId) {
        const [analyticsResult, reviewResult] = await Promise.all([
          companyAdminService.getBoothAnalytics(savedId),
          companyAdminService.getManagedBoothReview(savedId),
        ]);
        setAnalytics((analyticsResult.data as ManagedAnalytics) ?? null);
        setLeads((((reviewResult.data as { leadInbox?: ManagedLead[] } | null)?.leadInbox) ?? []).map((entry) => entry));
        setRoomRouteId(String((reviewResult.data as { reviewContext?: { roomRouteId?: string } } | null)?.reviewContext?.roomRouteId || savedId));
        const refreshedBooths = await companyAdminService.getManagedBooths();
        if (refreshedBooths.data) {
          setManagedBooths(refreshedBooths.data.map((entry) => ({
            company_name: entry.company_name,
            district: entry.district,
            id: entry.id,
          })));
        }
      }
      setMessage({
        type: 'success',
        text: nextStatus
          ? `Booth saved as ${getExpoBoothPublicationStatusLabel(nextStatus).toLowerCase()}.`
          : 'Booth sponsor settings saved.',
      });
      return true;
    } catch (error) {
      const errorText = formatRequestError(error);
      const accessState = resolveAdminAccessStateFromError(errorText);
      const isRequestValidationError = errorText.includes('SERVER_API_HTTP_400') || errorText.includes('SERVER_API_HTTP_409');
      if (errorText.includes('SERVER_API_HTTP_') && !isRequestValidationError) {
        setAdminAccessError(errorText);
        setAdminAccessState(accessState);
      }

      setMessage({
        type: 'error',
        text: isRequestValidationError
          ? errorText.replace(/^.*SERVER_API_HTTP_(?:400|409):\s*/, '')
          : accessState === 'signed-out'
          ? 'Your admin session is missing or expired. Sign in again, then save the booth screen.'
          : accessState === 'access-denied'
            ? 'This account is not allowed to save this booth.'
            : accessState === 'backend-unavailable'
              ? 'The Expo admin service is not reachable right now. This is not an API key issue; reload after the service is restored.'
              : 'Failed to save booth screen settings.',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleLeadStatusChange(leadId: string, nextStatus: 'pending' | 'contacted' | 'closed' | 'rejected') {
    if (!company.id || !leadId) {
      return;
    }

    setActiveLeadAction(`${leadId}:${nextStatus}`);
    setMessage(null);

    try {
      const result = await companyAdminService.updateManagedLeadStatus(company.id, leadId, nextStatus);
      if (result.error) {
        throw new Error(result.error);
      }

      setLeads((current) =>
        current.map((entry) => (String(entry.id || '') === leadId ? { ...entry, status: nextStatus } : entry)),
      );
      setMessage({ type: 'success', text: `Lead moved to ${LEAD_STATUS_LABELS[nextStatus].toLowerCase()}.` });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update lead status.' });
    } finally {
      setActiveLeadAction(null);
    }
  }

  async function handleLeadOpsSave(leadId: string) {
    if (!company.id || !leadId) {
      return;
    }

    const draft = leadOpsDrafts[leadId] ?? { followUpAt: '', opsNotes: '' };
    setActiveLeadOpsSave(leadId);
    setMessage(null);

    try {
      const result = await companyAdminService.updateManagedLeadOps(company.id, leadId, {
        followUpAt: draft.followUpAt ? new Date(draft.followUpAt).toISOString() : null,
        opsNotes: draft.opsNotes.trim() || null,
      });
      if (result.error) {
        throw new Error(result.error);
      }

      const saved = result.data as { follow_up_at?: string | null; ops_notes?: string | null; updated_at?: string | null } | null;
      setLeads((current) =>
        current.map((entry) =>
          String(entry.id || '') === leadId
            ? {
                ...entry,
                follow_up_at: saved?.follow_up_at ?? null,
                ops_notes: saved?.ops_notes ?? null,
                ops_updated_at: saved?.updated_at ?? null,
              }
            : entry,
        ),
      );
      setMessage({ type: 'success', text: 'Lead ops note saved.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save lead ops note.' });
    } finally {
      setActiveLeadOpsSave(null);
    }
  }

  function updateScreenContent(patch: Partial<AdminScreenContentState>) {
    setCompany((current) => ({
      ...current,
      screenContent: {
        ...current.screenContent,
        ...patch,
      },
    }));
  }

  function updateScreenImageUrl(imageUrl: string) {
    const normalizedUrl = imageUrl.trim();
    updateScreenContent({
      ctaLabel: normalizedUrl ? company.screenContent.ctaLabel || DEFAULT_SCREEN_TEST_CTA : company.screenContent.ctaLabel,
      imageUrl,
      mode: normalizedUrl ? 'image' : company.screenContent.mode,
      status: normalizedUrl ? 'published' : company.screenContent.status,
      subtitle: normalizedUrl ? company.screenContent.subtitle || DEFAULT_SCREEN_TEST_SUBTITLE : company.screenContent.subtitle,
      title: normalizedUrl ? company.screenContent.title || DEFAULT_SCREEN_TEST_TITLE : company.screenContent.title,
    });
  }

  function updateCityScreenContent(patch: Partial<AdminScreenContentState>) {
    setCompany((current) => ({
      ...current,
      cityScreenContent: {
        ...current.cityScreenContent,
        ...patch,
      },
    }));
  }

  function selectCityScreenSlot(screenSlotId: string) {
    setCityScreenSlotSelection(screenSlotId);
    updateCityScreenContent({
      screenSlotId,
      ...(!company.cityScreenContent.campaignStartDate && !company.cityScreenContent.campaignEndDate
        ? getDefaultCityScreenCampaignDates()
        : {}),
    });
  }

  async function handleCityScreenSave(action: 'approve' | 'draft' | 'publish' | 'reject' | 'review') {
    const selectedSlotId = cityScreenSlotSelection || company.cityScreenContent.screenSlotId;
    const selectedSlot = getExpoScreenSlotById(selectedSlotId);
    if (!selectedSlot || selectedSlot.scope !== 'city') {
      setMessage({ type: 'error', text: 'Choose a city advertising screen first.' });
      return;
    }

    if ((action === 'approve' || action === 'publish' || action === 'reject') && !isOperatorAdmin) {
      setMessage({ type: 'error', text: 'Submit the screen request for review. The Warpala team approves and publishes city advertising.' });
      return;
    }

    const cityScreenContent: AdminScreenContentState = {
      ...company.cityScreenContent,
      campaignStatus: action === 'publish'
        ? 'live'
        : action === 'approve'
          ? 'approved'
          : action === 'reject'
            ? 'rejected'
          : action === 'review'
            ? 'submitted'
            : 'draft',
      screenSlotId: selectedSlot.id,
      status: action === 'publish' ? 'published' : 'draft',
    };
    const validation = normalizeExpoScreenContentForSave(cityScreenContent);
    if (!validation.ok) {
      setMessage({
        type: 'error',
        text: validation.issues.map((issue) => issue.message).join(' '),
      });
      return;
    }
    const campaignValidation = normalizeExpoCityScreenCampaign(cityScreenContent, {
      requireSchedule: action !== 'draft',
      today: new Date().toISOString().slice(0, 10),
    });
    if (!campaignValidation.ok) {
      setMessage({
        type: 'error',
        text: campaignValidation.issues.map((issue) => issue.message).join(' '),
      });
      return;
    }

    const nextCompany: AdminCompanyState = {
      ...company,
      cityScreenContent,
    };
    setCompany(nextCompany);

    const nextStatus = action === 'review' && canTransitionExpoBoothPublicationStatus(company.status, 'review')
      ? 'review'
      : undefined;
    const saved = await handleSave(nextStatus, nextCompany);
    if (!saved) {
      return;
    }
    setMessage({
      type: 'success',
      text: action === 'publish'
        ? `${selectedSlot.label} is live for the selected campaign dates.`
        : action === 'approve'
          ? `${selectedSlot.label} campaign is approved and ready to publish.`
        : action === 'reject'
          ? `${selectedSlot.label} campaign was returned for changes.`
        : action === 'review'
          ? `${selectedSlot.label} request was submitted. The next step is Warpala review.`
          : `${selectedSlot.label} draft was saved.`,
    });
  }

  async function handleBoothQuickSave(action: 'draft' | 'review') {
    const fallbackImage = company.sponsorAssetPack.heroImageUrl.trim()
      || company.sponsorAssetPack.logoUrl.trim();
    const nextScreenContent: AdminScreenContentState = {
      ...company.screenContent,
      ctaLabel: company.screenContent.ctaLabel.trim()
        || company.sponsorAssetPack.ctaPrimary.trim()
        || 'Learn more',
      imageUrl: company.screenContent.mode === 'image' && !company.screenContent.imageUrl.trim()
        ? fallbackImage
        : company.screenContent.imageUrl,
      status: 'published',
      subtitle: company.screenContent.subtitle.trim()
        || company.sponsorAssetPack.shortPitch.trim(),
      title: company.screenContent.title.trim()
        || company.sponsorAssetPack.headline.trim()
        || company.name.trim(),
    };
    const screenValidation = normalizeExpoScreenContentForSave(nextScreenContent);
    const assetPackValidation = normalizeExpoSponsorAssetPackForSave(company.sponsorAssetPack);
    if (!screenValidation.ok || !assetPackValidation.ok) {
      setMessage({
        type: 'error',
        text: [
          ...screenValidation.issues.map((issue) => issue.message),
          ...assetPackValidation.issues.map((issue) => issue.message),
        ].join(' '),
      });
      return;
    }

    const nextCompany: AdminCompanyState = {
      ...company,
      description: company.description.trim() || company.sponsorAssetPack.shortPitch.trim(),
      screenContent: nextScreenContent,
    };
    setCompany(nextCompany);
    const nextStatus = action === 'review' && canTransitionExpoBoothPublicationStatus(company.status, 'review')
      ? 'review'
      : undefined;
    const saved = await handleSave(nextStatus, nextCompany);
    if (!saved) {
      return;
    }

    setMessage({
      type: 'success',
      text: action === 'review'
        ? 'Booth setup was submitted for review.'
        : 'Booth setup was saved. Open the 3D preview to check it.',
    });
  }

  function updateScreenVideoUrl(videoUrl: string) {
    const normalizedUrl = videoUrl.trim();
    updateScreenContent({
      ctaLabel: normalizedUrl ? company.screenContent.ctaLabel || DEFAULT_SCREEN_TEST_CTA : company.screenContent.ctaLabel,
      mode: normalizedUrl ? 'video' : company.screenContent.mode,
      status: normalizedUrl ? 'published' : company.screenContent.status,
      subtitle: normalizedUrl ? company.screenContent.subtitle || DEFAULT_SCREEN_TEST_SUBTITLE : company.screenContent.subtitle,
      title: normalizedUrl ? company.screenContent.title || DEFAULT_SCREEN_TEST_TITLE : company.screenContent.title,
      videoUrl,
    });
  }

  function copySponsorAssetImageToBoothScreen(imageUrl: string) {
    const normalizedUrl = imageUrl.trim();
    if (!normalizedUrl) {
      setMessage({ type: 'error', text: 'Add a logo, hero image, or product image before copying assets to the booth screen.' });
      return;
    }

    updateScreenContent({
      ctaLabel: company.sponsorAssetPack.ctaPrimary.trim() || company.screenContent.ctaLabel || DEFAULT_SCREEN_TEST_CTA,
      imageUrl: normalizedUrl,
      mode: 'image',
      status: 'published',
      subtitle: company.sponsorAssetPack.shortPitch.trim() || company.screenContent.subtitle || DEFAULT_SCREEN_TEST_SUBTITLE,
      title: company.sponsorAssetPack.headline.trim() || company.name.trim() || company.screenContent.title || DEFAULT_SCREEN_TEST_TITLE,
    });
    setMessage({ type: 'success', text: 'Sponsor image copied to Booth Screen Content. Save booth settings to publish it in 3D.' });
  }

  function copySponsorAssetVideoToBoothScreen(videoUrl: string) {
    const normalizedUrl = videoUrl.trim();
    if (!normalizedUrl) {
      setMessage({ type: 'error', text: 'Add a demo video URL before copying assets to the booth screen.' });
      return;
    }

    updateScreenContent({
      ctaLabel: company.sponsorAssetPack.ctaPrimary.trim() || company.screenContent.ctaLabel || DEFAULT_SCREEN_TEST_CTA,
      mode: 'video',
      status: 'published',
      subtitle: company.sponsorAssetPack.shortPitch.trim() || company.screenContent.subtitle || DEFAULT_SCREEN_TEST_SUBTITLE,
      title: company.sponsorAssetPack.headline.trim() || company.name.trim() || company.screenContent.title || DEFAULT_SCREEN_TEST_TITLE,
      videoUrl: normalizedUrl,
    });
    setMessage({ type: 'success', text: 'Sponsor video copied to Booth Screen Content. Save booth settings to publish it on the 3D screen.' });
  }

  function updateSponsorAssetPack(patch: Partial<AdminSponsorAssetPackState>) {
    setCompany((current) => ({
      ...current,
      sponsorAssetPack: {
        ...current.sponsorAssetPack,
        ...patch,
      },
    }));
  }

  function updateMediaReview(patch: Partial<AdminMediaReviewState>) {
    setCompany((current) => ({
      ...current,
      mediaReview: {
        ...current.mediaReview,
        ...patch,
      },
    }));
  }

  async function handleSponsorAssetUpload(target: ExpoSponsorAssetUploadTarget, files: FileList | null) {
    const file = files?.[0] ?? null;
    if (!file) {
      return;
    }

    if (adminAccessState !== 'ready') {
      setMessage({ type: 'error', text: 'Sign in with a sponsor/admin account before uploading sponsor assets.' });
      return;
    }

    const label = getSponsorAssetUploadLabel(target);
    const uploadBoothKey = company.id || company.name || 'new-booth';
    setActiveSponsorAssetUpload(target);
    setSponsorAssetUploadStatus((current) => ({ ...current, [target]: `Uploading ${label}...` }));
    setMessage(null);

    try {
      const result = await uploadSponsorAssetPackFile({
        boothId: uploadBoothKey,
        file,
        target,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      if (target === 'productImageUrls') {
        const currentUrls = company.sponsorAssetPack.productImageUrls
          .split(/\n+/)
          .map((entry) => entry.trim())
          .filter(Boolean);
        const nextUrls = currentUrls.includes(result.publicUrl)
          ? currentUrls
          : [...currentUrls, result.publicUrl].slice(0, EXPO_SPONSOR_ASSET_PACK_PRODUCT_IMAGE_LIMIT);
        updateSponsorAssetPack({ productImageUrls: nextUrls.join('\n') });
      } else {
        updateSponsorAssetPack({ [target]: result.publicUrl } as Partial<AdminSponsorAssetPackState>);
      }

      setSponsorAssetUploadStatus((current) => ({ ...current, [target]: `${label} uploaded. Save booth settings to keep it.` }));
      setMessage({ type: 'success', text: `${label} uploaded. Save booth settings to keep the asset pack.` });
    } catch (error) {
      const errorText = formatRequestError(error);
      setSponsorAssetUploadStatus((current) => ({ ...current, [target]: errorText }));
      setMessage({ type: 'error', text: errorText });
    } finally {
      setActiveSponsorAssetUpload(null);
    }
  }

  async function handleMediaReviewUpload(kind: ExpoMediaReviewUploadKind, files: FileList | null) {
    const file = files?.[0] ?? null;
    if (!file) {
      return;
    }

    if (adminAccessState !== 'ready' || !company.id) {
      setMessage({ type: 'error', text: 'Load a saved sponsor/admin booth before uploading review media.' });
      return;
    }

    const label = getMediaReviewUploadLabel(kind);
    setActiveMediaReviewUpload(kind);
    setMediaReviewUploadStatus((current) => ({ ...current, [kind]: `Uploading ${label} for review...` }));
    setMessage(null);

    try {
      const result = await uploadMediaReviewFile({
        boothId: company.id,
        file,
        kind,
      });

      if (result.error || !result.mediaReview) {
        throw new Error(result.error || 'Review upload failed.');
      }

      updateMediaReview({ uploads: result.mediaReview.uploads } as Partial<AdminMediaReviewState>);
      setMediaReviewUploadStatus((current) => ({ ...current, [kind]: `${label} uploaded for review. It is not public until approved.` }));
      setMessage({ type: 'success', text: `${label} uploaded for review. Uploaded media stays private until approved.` });
    } catch (error) {
      const errorText = formatRequestError(error);
      setMediaReviewUploadStatus((current) => ({ ...current, [kind]: errorText }));
      setMessage({ type: 'error', text: errorText });
    } finally {
      setActiveMediaReviewUpload(null);
    }
  }

  async function handleMediaReviewAdminAction(
    upload: ExpoMediaReviewUploadRecord,
    action: 'approve' | 'promote' | 'reject',
    promoteTarget?: ExpoMediaReviewUploadPromoteTarget,
  ) {
    if (!company.id) {
      setMessage({ type: 'error', text: 'Load a saved booth before changing review upload status.' });
      return;
    }

    if (!isOperatorAdmin) {
      setMessage({ type: 'error', text: 'Only admin reviewers can approve, reject, or promote sponsor review uploads.' });
      return;
    }

    const actionKey = `${upload.bucket}:${upload.path}:${action}:${promoteTarget || 'none'}`;
    setActiveMediaReviewAction(actionKey);
    setMessage(null);

    try {
      const result = await applyMediaReviewAdminAction({
        action,
        boothId: company.id,
        ...(promoteTarget ? { promoteTarget } : {}),
        upload,
      });

      if (result.error || !result.mediaReview) {
        throw new Error(result.error || 'Media review action failed.');
      }

      updateMediaReview({ uploads: result.mediaReview.uploads } as Partial<AdminMediaReviewState>);
      if (action === 'approve') {
        setMessage({ type: 'success', text: 'Review upload approved. It remains private until an admin promotes it to public media.' });
      } else if (action === 'reject') {
        setMessage({ type: 'success', text: 'Review upload rejected. It remains private and will not be used in public media.' });
      } else {
        setMessage({ type: 'success', text: `Approved review upload promoted to public ${promoteTarget || 'media'}. Public scene fields were updated explicitly.` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: formatRequestError(error) });
    } finally {
      setActiveMediaReviewAction(null);
    }
  }

  const selectedDistrictColor =
    EXPO_CANONICAL_DISTRICT_CATALOG.find((district) => district.id === company.district)?.color || '#3b82f6';
  const leadStatusCounts = leads.reduce<Record<string, number>>((acc, lead) => {
    const status = String(lead.status || 'pending').toLowerCase();
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});
  const sortedLeads = [...leads].sort((left, right) => String(right.created_at || '').localeCompare(String(left.created_at || '')));
  const leadsNeedingAction = sortedLeads.filter((lead) => {
    const status = String(lead.status || 'pending').toLowerCase();
    return status === 'pending' || status === 'contacted';
  });
  const visibleLeads = sortedLeads.filter((lead) => {
    const status = String(lead.status || 'pending').toLowerCase();
    if (leadFilter === 'all') {
      return true;
    }

    if (leadFilter === 'needs_action') {
      return status === 'pending' || status === 'contacted';
    }

    return status === leadFilter;
  });
  const latestLeadTimestamp = sortedLeads[0]?.created_at
    ? new Date(String(sortedLeads[0].created_at)).toLocaleString()
    : 'No inbound activity yet';
  const screenContentValidation = normalizeExpoScreenContentForSave(company.screenContent);
  const cityScreenContentValidation = normalizeExpoScreenContentForSave(company.cityScreenContent);
  const cityScreenCampaignValidation = normalizeExpoCityScreenCampaign(company.cityScreenContent);
  const cityScreenSubmissionValidation = normalizeExpoCityScreenCampaign(company.cityScreenContent, {
    requireSchedule: true,
    today: new Date().toISOString().slice(0, 10),
  });
  const boothVideoValidation = validateExpoScreenMediaUrl(company.booth.video_url, 'video');
  const sponsorAssetPackValidation = normalizeExpoSponsorAssetPackForSave(company.sponsorAssetPack);
  const sponsorAssetPackReadiness = getExpoSponsorAssetPackReadiness(company.sponsorAssetPack);
  const mediaReviewValidation = normalizeExpoMediaReviewReferencesForSave(company.mediaReview);
  const mediaPolicyText = `Images: ${EXPO_SCREEN_CONTENT_IMAGE_EXTENSIONS.join(', ')}. Videos: ${EXPO_SCREEN_CONTENT_VIDEO_EXTENSIONS.join(', ')}. Upload files or use direct media file links.`;
  const screenContentIssueText = [
    ...screenContentValidation.issues.map((issue) => issue.message),
    ...(boothVideoValidation.ok ? [] : [boothVideoValidation.reason]),
  ].filter(Boolean).join(' ');
  const cityScreenContentIssueText = cityScreenContentValidation.issues
    .map((issue) => issue.message)
    .filter(Boolean)
    .join(' ');
  const cityScreenCampaignIssueText = cityScreenCampaignValidation.issues
    .map((issue) => issue.message)
    .filter(Boolean)
    .join(' ');
  const sponsorAssetPackIssueText = sponsorAssetPackValidation.issues
    .map((issue) => issue.message)
    .filter(Boolean)
    .join(' ');
  const mediaReviewIssueText = mediaReviewValidation.issues
    .map((issue) => issue.message)
    .filter(Boolean)
    .join(' ');
  const firstSponsorAssetProductImageUrl = company.sponsorAssetPack.productImageUrls
    .split(/\n+/)
    .map((entry) => entry.trim())
    .filter(Boolean)[0] || '';
  const sponsorAssetPackScreenImageUrl =
    company.sponsorAssetPack.heroImageUrl.trim()
    || company.sponsorAssetPack.logoUrl.trim()
    || firstSponsorAssetProductImageUrl;
  const sponsorAssetPackScreenVideoUrl = company.sponsorAssetPack.demoVideoUrl.trim();
  const sampleScreenImageUrl = typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? `${window.location.origin}${EXPO_SCREEN_TEST_IMAGE_PATH}`
    : '';
  const companyNameForSave = resolveVisibleSceneCompanyName(company.name.trim());
  const willUseVisibleSceneCompanyAlias = Boolean(company.name.trim()) && companyNameForSave !== company.name.trim();
  const hasScreenImageUrl = company.screenContent.imageUrl.trim().length > 0;
  const isPublishedImageContent = company.screenContent.status === 'published'
    && company.screenContent.mode === 'image'
    && hasScreenImageUrl
    && screenContentValidation.ok;
  const hasScreenVideoUrl = company.screenContent.videoUrl.trim().length > 0;
  const isPublishedVideoContent = company.screenContent.status === 'published'
    && (company.screenContent.mode === 'video' || company.screenContent.mode === 'video-placeholder')
    && hasScreenVideoUrl
    && screenContentValidation.ok;
  const screenVisibilityHint = isPublishedImageContent || isPublishedVideoContent
    ? 'VISIBLE READY: published screen media is ready for the matched 3D booth screen.'
    : hasScreenImageUrl || hasScreenVideoUrl
      ? 'NOT VISIBLE YET: media URLs must be saved as PUBLISHED and matched to a visible 3D booth.'
      : 'No screen media URL saved yet.';
  const isPublishedGeneratedCard = company.screenContent.status === 'published'
    && company.screenContent.mode === 'generated-card'
    && screenContentValidation.ok;
  const hasVisibleScreenContent = isPublishedImageContent || isPublishedVideoContent || isPublishedGeneratedCard;
  const screenInventorySlots = getExpoScreenInventorySlots();
  const screenInventorySummary = getExpoScreenInventorySummary();
  const availableScreenSlots = getAvailableExpoScreenSlots();
  const boothScreenSlots = screenInventorySlots.filter((slot) => slot.scope === 'booth');
  const cityScreenSlots = screenInventorySlots.filter((slot) => slot.scope === 'city');
  const selectedScreenSlotCandidate = getExpoScreenSlotById(company.screenContent.screenSlotId);
  const selectedScreenSlot = selectedScreenSlotCandidate?.scope === 'booth'
    ? selectedScreenSlotCandidate
    : null;
  const selectedCityScreenSlotId = cityScreenSlotSelection || company.cityScreenContent.screenSlotId;
  const selectedCityScreenSlotCandidate = getExpoScreenSlotById(selectedCityScreenSlotId);
  const selectedCityScreenSlot = selectedCityScreenSlotCandidate?.scope === 'city'
    ? selectedCityScreenSlotCandidate
    : null;
  const ownedScreenSlots = getExpoScreenSlotsForBooth(company.id);
  const adminAccessNotice = getAdminAccessNotice(adminAccessState, adminAccessError);
  const canSaveBooth = adminAccessState === 'ready' && !loading;
  const saveButtonLabel = loading
    ? 'SAVING...'
    : adminAccessState === 'signed-out'
      ? 'SIGN IN TO SAVE'
      : adminAccessState === 'access-denied'
        ? 'NO BOOTH ACCESS'
        : adminAccessState === 'backend-unavailable'
          ? 'ADMIN SERVICE OFFLINE'
          : 'SAVE BOOTH SETTINGS';
  const sponsorAssetUploadDisabled = adminAccessState !== 'ready' || !isOperatorAdmin || Boolean(activeSponsorAssetUpload);
  const mediaReviewUploadDisabled = adminAccessState !== 'ready' || !company.id || Boolean(activeMediaReviewUpload);
  const sponsorPublicReleaseControlsDisabled = adminAccessState !== 'ready' || !isOperatorAdmin;
  const normalizedBoothStatus = normalizeExpoBoothPublicationStatus(company.status);
  const boothPublicationLabel = getExpoBoothPublicationStatusLabel(normalizedBoothStatus);
  const selectablePublicationStatuses = EXPO_BOOTH_PUBLICATION_STATUSES.filter((status) => {
    if (!canTransitionExpoBoothPublicationStatus(normalizedBoothStatus, status)) {
      return false;
    }

    if (isOperatorAdmin) {
      return true;
    }

    return status === 'draft' || status === 'review' || status === normalizedBoothStatus;
  });
  const allowedNextStatuses = getExpoBoothAllowedNextStatuses(normalizedBoothStatus);
  const publicationStatusHelp = isOperatorAdmin
    ? `Admin controls the next booth transition from ${boothPublicationLabel.toLowerCase()}. Allowed next statuses: ${allowedNextStatuses.map((status) => getExpoBoothPublicationStatusLabel(status)).join(', ')}. Only Published booths merge into the public 3D scene.`
    : 'Sponsor edits stay in Draft or Submitted status. Admin approval is required before public scene publishing.';
  const hasSavedBoothId = company.id.trim().length > 0;
  const canOpenManagedPreview = adminAccessState === 'ready' && hasSavedBoothId && hasVisibleScreenContent;
  const canSubmitForReview = adminAccessState === 'ready'
    && hasSavedBoothId
    && hasVisibleScreenContent
    && sponsorAssetPackValidation.ok
    && screenContentValidation.ok;
  const publicationAction = (() => {
    if (normalizedBoothStatus === 'draft') {
      return {
        label: 'Submit for review',
        nextStatus: 'review' as const,
      };
    }

    if (normalizedBoothStatus === 'rejected') {
      return {
        label: 'Return to draft',
        nextStatus: 'draft' as const,
      };
    }

    if (normalizedBoothStatus === 'review' && isOperatorAdmin) {
      return {
        label: 'Approve',
        nextStatus: 'approved' as const,
      };
    }

    if (normalizedBoothStatus === 'approved' && isOperatorAdmin) {
      return {
        label: 'Publish to public scene',
        nextStatus: 'active' as const,
      };
    }

    if (normalizedBoothStatus === 'active' && isOperatorAdmin) {
      return {
        label: 'Archive booth',
        nextStatus: 'archived' as const,
      };
    }

    return null;
  })();
  const publicationBody = isExpoBoothPublicSceneStatus(normalizedBoothStatus)
    ? 'This booth is published in the public scene. Future sponsor edits should go back through draft, review, approval and publish control.'
    : normalizedBoothStatus === 'approved'
      ? 'Approved booths are ready for public publishing.'
      : normalizedBoothStatus === 'review'
        ? 'Submitted booths stay out of the public scene until the team approves or requests changes.'
        : normalizedBoothStatus === 'rejected'
          ? 'Rejected booths must return to draft before the sponsor can resubmit them for review.'
          : 'Draft booths are preview-only. Submit for review when the sponsor package and booth screen are ready.';
  const publicationStepState: AdminLaunchStepState = isExpoBoothPublicSceneStatus(normalizedBoothStatus)
    ? 'ready'
    : canSubmitForReview || normalizedBoothStatus === 'review' || normalizedBoothStatus === 'approved'
      ? 'review'
      : 'blocked';
  const pendingReviewUploads = company.mediaReview.uploads.filter((upload) => upload.reviewStatus === 'pending_review');
  const approvedReviewUploads = company.mediaReview.uploads.filter((upload) => upload.reviewStatus === 'approved');
  const promotedReviewUploads = company.mediaReview.uploads.filter((upload) => upload.reviewStatus === 'promoted');
  const rejectedReviewUploads = company.mediaReview.uploads.filter((upload) => upload.reviewStatus === 'rejected');
  const hasPendingLogoUpload = pendingReviewUploads.some((upload) => upload.kind === 'logo');
  const hasPendingPosterUpload = pendingReviewUploads.some((upload) => upload.kind === 'poster');
  const hasPendingHeroUpload = pendingReviewUploads.some((upload) => upload.kind === 'hero' || upload.kind === 'reference');
  const hasApprovedLogoUpload = approvedReviewUploads.some((upload) => upload.kind === 'logo');
  const hasApprovedPosterUpload = approvedReviewUploads.some((upload) => upload.kind === 'poster');
  const hasApprovedHeroUpload = approvedReviewUploads.some((upload) => upload.kind === 'hero' || upload.kind === 'reference');
  const hasPromotedLogoUpload = promotedReviewUploads.some((upload) => upload.promotedTarget === 'logo');
  const hasPromotedPosterUpload = promotedReviewUploads.some((upload) => upload.promotedTarget === 'poster');
  const hasPromotedHeroUpload = promotedReviewUploads.some((upload) => upload.promotedTarget === 'hero');
  const hasReviewedLogo = company.mediaReview.logoUrl.trim().length > 0 || hasPendingLogoUpload || hasApprovedLogoUpload || hasPromotedLogoUpload;
  const hasReviewedPoster = company.mediaReview.posterUrl.trim().length > 0 || hasPendingPosterUpload || hasApprovedPosterUpload || hasPromotedPosterUpload;
  const hasReviewedHeroMedia = company.mediaReview.heroImageUrl.trim().length > 0 || company.mediaReview.heroVideoUrl.trim().length > 0 || hasPendingHeroUpload || hasApprovedHeroUpload || hasPromotedHeroUpload;
  const hasReviewedMediaNotes = company.mediaReview.mediaNotes.trim().length > 0;
  const hasReviewTagline = company.mediaReview.tagline.trim().length > 0 || company.description.trim().length > 0;
  const hasReviewCta = company.mediaReview.ctaLabel.trim().length > 0 || company.sponsorAssetPack.ctaPrimary.trim().length > 0;
  const hasReviewContactLink = company.mediaReview.websiteUrl.trim().length > 0 || company.mediaReview.bookingUrl.trim().length > 0;
  const mediaReviewComplete = mediaReviewValidation.ok
    && hasReviewedLogo
    && (hasReviewedPoster || hasReviewedHeroMedia)
    && hasReviewTagline;
  const publicMediaReady = Boolean(company.logo_url.trim())
    || hasPromotedLogoUpload
    || hasPromotedPosterUpload
    || hasPromotedHeroUpload;
  const ctaContactComplete = hasReviewCta && hasReviewContactLink;
  const readinessChecklistCount = countTruthy([
    sponsorAssetPackReadiness.clientFriendlyReady,
    hasVisibleScreenContent,
    mediaReviewComplete,
    ctaContactComplete,
    hasSavedBoothId,
  ]);
  const analyticsTracked = analytics !== null;
  const publicationSceneReadinessText = isExpoBoothPublicSceneStatus(normalizedBoothStatus)
    ? 'Published booth is currently eligible for the public 3D scene.'
    : normalizedBoothStatus === 'approved'
      ? 'Approved booth is ready to publish, but it is not live in the public scene yet.'
      : normalizedBoothStatus === 'review'
        ? 'Submitted booth is hidden from the public scene until team approval.'
        : normalizedBoothStatus === 'archived'
          ? 'Archived booth is intentionally not eligible for the public scene.'
          : normalizedBoothStatus === 'rejected'
            ? 'Rejected booth must return to draft before it can re-enter review.'
            : 'Draft booth can be previewed privately, but it is not public-scene eligible yet.';
  const sponsorReadinessCategory: SponsorReadinessCategory =
    normalizedBoothStatus === 'archived'
      ? 'Archived'
      : isExpoBoothPublicSceneStatus(normalizedBoothStatus)
        ? 'Published'
        : normalizedBoothStatus === 'review' || normalizedBoothStatus === 'approved'
          ? 'Waiting for approval'
          : !mediaReviewComplete
            ? 'Needs media review'
            : !ctaContactComplete
              ? 'Needs CTA/contact info'
              : 'Ready for demo';
  const sponsorReadinessStyle = SPONSOR_READINESS_STYLE[sponsorReadinessCategory];
  const readinessItems = [
    {
      detail: publicationSceneReadinessText,
      label: 'Public scene',
      status: isExpoBoothPublicSceneStatus(normalizedBoothStatus) ? 'Eligible now' : normalizedBoothStatus === 'approved' ? 'Approved, not live' : 'Not eligible yet',
      tone: isExpoBoothPublicSceneStatus(normalizedBoothStatus) ? '#34d399' : normalizedBoothStatus === 'approved' ? '#c084fc' : '#fbbf24',
    },
    {
      detail: publicMediaReady
        ? 'At least one approved review upload has been promoted into explicit public booth/company media fields.'
        : mediaReviewComplete
          ? 'Reviewed media references or review uploads cover logo, poster or hero media, and sponsor story copy.'
          : pendingReviewUploads.length > 0
            ? 'Review uploads are pending. Add any missing logo, poster, hero coverage or story copy before public review.'
            : rejectedReviewUploads.length > 0
              ? 'Some uploads were rejected. Replace or revise them before public review.'
              : 'Add reviewed logo, poster or hero media, and sponsor-facing notes before public review.',
      label: 'Media review',
      status: publicMediaReady
        ? `Public-ready / ${promotedReviewUploads.length} promoted`
        : mediaReviewComplete
          ? `${countTruthy([hasReviewedLogo, hasReviewedPoster || hasReviewedHeroMedia, hasReviewTagline, hasReviewedMediaNotes])}/4 checkpoints`
          : pendingReviewUploads.length > 0
            ? `${pendingReviewUploads.length} pending`
            : rejectedReviewUploads.length > 0
              ? `${rejectedReviewUploads.length} rejected`
              : `${countTruthy([hasReviewedLogo, hasReviewedPoster || hasReviewedHeroMedia, hasReviewTagline, hasReviewedMediaNotes])}/4 checkpoints`,
      tone: publicMediaReady ? '#38bdf8' : mediaReviewComplete ? '#34d399' : '#f97316',
    },
    {
      detail: pendingReviewUploads.length > 0
        ? `${pendingReviewUploads.length} upload${pendingReviewUploads.length === 1 ? '' : 's'} are waiting for admin review.`
        : approvedReviewUploads.length > 0
          ? `${approvedReviewUploads.length} upload${approvedReviewUploads.length === 1 ? '' : 's'} approved and ready for explicit public promotion.`
          : promotedReviewUploads.length > 0
            ? `${promotedReviewUploads.length} upload${promotedReviewUploads.length === 1 ? '' : 's'} have already been promoted to public booth media.`
            : rejectedReviewUploads.length > 0
              ? `${rejectedReviewUploads.length} upload${rejectedReviewUploads.length === 1 ? '' : 's'} were rejected and remain private.`
              : 'No private review uploads yet. Use references or upload private review media first.',
      label: 'Upload status',
      status: pendingReviewUploads.length > 0
        ? `${pendingReviewUploads.length} pending`
        : approvedReviewUploads.length > 0
          ? `${approvedReviewUploads.length} approved`
          : promotedReviewUploads.length > 0
            ? `${promotedReviewUploads.length} promoted`
            : rejectedReviewUploads.length > 0
              ? `${rejectedReviewUploads.length} rejected`
              : 'No uploads yet',
      tone: pendingReviewUploads.length > 0 ? '#fbbf24' : approvedReviewUploads.length > 0 ? '#c084fc' : promotedReviewUploads.length > 0 ? '#38bdf8' : '#94a3b8',
    },
    {
      detail: ctaContactComplete
        ? 'CTA copy and a website or booking path are present for review.'
        : 'Add CTA wording and a website or booking reference before sponsor handoff.',
      label: 'CTA / contact',
      status: `${countTruthy([hasReviewCta, hasReviewContactLink])}/2 ready`,
      tone: ctaContactComplete ? '#34d399' : '#fbbf24',
    },
    {
      detail: sponsorAssetPackReadiness.clientFriendlyReady
        ? `Package tier ${company.sponsorAssetPack.packageTier.toUpperCase()} has enough sponsor material for a guided demo.`
        : 'Sponsor package content is still incomplete for a client-facing walkthrough.',
      label: 'Package / tier',
      status: `${company.sponsorAssetPack.packageTier.toUpperCase()} / ${sponsorAssetPackReadiness.readyAssetCount} assets`,
      tone: sponsorAssetPackReadiness.clientFriendlyReady ? '#38bdf8' : '#fbbf24',
    },
    {
      detail: leads.length > 0
        ? `${leads.length} lead${leads.length === 1 ? '' : 's'} loaded from the existing protected sponsor lead flow.`
        : 'No sponsor leads are attached to this booth yet.',
      label: 'Lead inbox',
      status: leads.length > 0 ? `${leads.length} lead${leads.length === 1 ? '' : 's'}` : 'No leads yet',
      tone: leads.length > 0 ? '#34d399' : '#94a3b8',
    },
    {
      detail: analyticsTracked
        ? 'Existing booth analytics counters are available as read-only visits, interactions, and leads.'
        : 'Not tracked yet in the current booth analytics read path.',
      label: 'Analytics',
      status: analyticsTracked ? 'Read-only counters' : 'Not tracked yet',
      tone: analyticsTracked ? '#93c5fd' : '#94a3b8',
    },
  ] as const;
  const launchSteps: AdminLaunchStep[] = [
    {
      body: sponsorAssetPackReadiness.clientFriendlyReady
        ? `Tier ${sponsorAssetPackReadiness.packageTier.toUpperCase()} has enough sponsor material for a client preview.`
        : 'Add a headline, pitch, logo/hero image, and optional brochure or demo video.',
      label: 'Sponsor package',
      state: sponsorAssetPackValidation.ok && sponsorAssetPackReadiness.clientFriendlyReady ? 'ready' : 'blocked',
      status: sponsorAssetPackReadiness.clientFriendlyReady ? 'Client package ready' : 'Materials incomplete',
    },
    {
      body: hasVisibleScreenContent
        ? `${company.screenContent.mode.toUpperCase()} content is marked Published and can be used by the matched booth screen.`
        : 'Choose image, video placeholder, or generated-card content and set Status to Published.',
      label: 'Booth screen',
      state: hasVisibleScreenContent ? 'ready' : 'blocked',
      status: hasVisibleScreenContent ? 'Visible content ready' : 'Not visible yet',
    },
    {
      actionLabel: adminAccessState === 'ready' ? saveButtonLabel : undefined,
      body: adminAccessState === 'ready'
        ? 'Save after media or text changes. 3D preview uses the latest saved version.'
        : 'Sign in before saving sponsor content.',
      label: 'Save draft',
      onAction: adminAccessState === 'ready' ? () => void handleSave() : undefined,
      state: adminAccessState === 'ready' ? 'review' : 'blocked',
      status: adminAccessState === 'ready' ? 'Ready to save' : 'Save unavailable',
    },
    {
      actionLabel: canOpenManagedPreview ? 'Open 3D preview' : undefined,
      body: canOpenManagedPreview
        ? 'Review this booth in the 3D city without publishing it into the default public scene.'
        : hasSavedBoothId
          ? 'Publish screen content and save before opening the managed 3D preview.'
          : 'Save the booth once before opening the managed 3D preview.',
      label: '3D preview',
      onAction: canOpenManagedPreview ? () => nav(buildManagedBoothPreviewRoute(company.id)) : undefined,
      state: canOpenManagedPreview ? 'ready' : 'blocked',
      status: canOpenManagedPreview ? 'Preview available' : 'Preview blocked',
    },
    {
      actionLabel: publicationAction && (canSubmitForReview || isOperatorAdmin) ? publicationAction.label : undefined,
      body: publicationBody,
      label: 'Public release',
      onAction: publicationAction && (canSubmitForReview || isOperatorAdmin)
        ? () => void handleSave(publicationAction.nextStatus)
        : undefined,
      state: publicationStepState,
      status: boothPublicationLabel,
    },
  ];
  const unblockedLaunchStepCount = launchSteps.filter((step) => step.state !== 'blocked').length;
  const renderSponsorAssetUploadInput = (target: ExpoSponsorAssetUploadTarget) => {
    const label = getSponsorAssetUploadLabel(target);
    const isActive = activeSponsorAssetUpload === target;

    return (
      <div style={{ marginTop: '9px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <label
          style={{
            alignItems: 'center',
            cursor: sponsorAssetUploadDisabled ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            margin: 0,
            opacity: sponsorAssetUploadDisabled && !isActive ? 0.58 : 1,
          }}
        >
          <span className="btn-glass" style={{ padding: '7px 10px', fontSize: '0.72rem' }}>
            {isActive ? 'UPLOADING...' : isOperatorAdmin ? `UPLOAD ${label.toUpperCase()}` : `ADMIN-ONLY ${label.toUpperCase()} UPLOAD`}
          </span>
          <input
            type="file"
            accept={getSponsorAssetUploadAccept(target)}
            disabled={sponsorAssetUploadDisabled}
            onChange={(event) => {
              void handleSponsorAssetUpload(target, event.currentTarget.files);
              event.currentTarget.value = '';
            }}
            style={{ display: 'none' }}
          />
        </label>
        {sponsorAssetUploadStatus[target] && (
          <span style={{ color: sponsorAssetUploadStatus[target]?.toLowerCase().includes('failed') ? '#fca5a5' : '#94a3b8', fontSize: '0.72rem', lineHeight: 1.4 }}>
            {sponsorAssetUploadStatus[target]}
          </span>
        )}
        {!isOperatorAdmin && (
          <span style={{ color: '#94a3b8', fontSize: '0.72rem', lineHeight: 1.4 }}>
            Use Media Review uploads above for sponsor-submitted assets. Direct `expo_assets` uploads stay admin-only here.
          </span>
        )}
      </div>
    );
  };
  const renderMediaReviewUploadInput = (kind: ExpoMediaReviewUploadKind) => {
    const label = getMediaReviewUploadLabel(kind);
    const isActive = activeMediaReviewUpload === kind;

    return (
      <div style={{ marginTop: '9px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <label
          style={{
            alignItems: 'center',
            cursor: mediaReviewUploadDisabled ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            margin: 0,
            opacity: mediaReviewUploadDisabled && !isActive ? 0.58 : 1,
          }}
        >
          <span className="btn-glass" style={{ padding: '7px 10px', fontSize: '0.72rem' }}>
            {isActive ? 'UPLOADING...' : `UPLOAD ${label.toUpperCase()} FOR REVIEW`}
          </span>
          <input
            type="file"
            accept={getMediaReviewUploadAccept(kind)}
            disabled={mediaReviewUploadDisabled}
            onChange={(event) => {
              void handleMediaReviewUpload(kind, event.currentTarget.files);
              event.currentTarget.value = '';
            }}
            style={{ display: 'none' }}
          />
        </label>
        {mediaReviewUploadStatus[kind] && (
          <span style={{ color: mediaReviewUploadStatus[kind]?.toLowerCase().includes('http_') ? '#fca5a5' : '#94a3b8', fontSize: '0.72rem', lineHeight: 1.4 }}>
            {mediaReviewUploadStatus[kind]}
          </span>
        )}
      </div>
    );
  };
  const renderMediaReviewUploadActions = (upload: ExpoMediaReviewUploadRecord) => {
    const promoteTargets = getMediaReviewPromoteTargets(upload.kind);
    const statusLabel = getExpoMediaReviewUploadStatusLabel(upload.reviewStatus).toUpperCase();

    return (
      <div style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'baseline', flexWrap: 'wrap' }}>
          <div style={{ color: '#f8fafc', fontWeight: 800 }}>{upload.originalFilename}</div>
          <div style={{ color: upload.reviewStatus === 'rejected' ? '#fca5a5' : upload.reviewStatus === 'promoted' ? '#67e8f9' : upload.reviewStatus === 'approved' ? '#c4b5fd' : '#fbbf24', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {statusLabel}
          </div>
        </div>
        <div style={{ color: '#94a3b8', fontSize: '0.76rem', lineHeight: 1.5 }}>
          Kind: {upload.kind} / MIME: {upload.mimeType} / Size: {Math.max(1, Math.round(upload.size / 1024))} KB
          <br />
          Stored privately in {upload.bucket} at {new Date(upload.uploadedAt).toLocaleString()}.
          {upload.reviewedAt ? (
            <>
              <br />
              Reviewed at {new Date(upload.reviewedAt).toLocaleString()}.
            </>
          ) : null}
          {upload.promotedAt && upload.promotedTarget ? (
            <>
              <br />
              Promoted to public {upload.promotedTarget} at {new Date(upload.promotedAt).toLocaleString()}.
            </>
          ) : null}
        </div>
        {upload.reviewStatus === 'approved' && promoteTargets.length === 0 && (
          <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(30, 41, 59, 0.62)', border: '1px solid rgba(148, 163, 184, 0.14)', color: '#cbd5e1', fontSize: '0.74rem', lineHeight: 1.5 }}>
            This upload is approved for team review, but it is not assigned to a live public slot yet.
          </div>
        )}
        {upload.reviewStatus === 'promoted' && upload.publicUrl ? (
          <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(8, 47, 73, 0.24)', border: '1px solid rgba(103, 232, 249, 0.2)', color: '#bae6fd', fontSize: '0.74rem', lineHeight: 1.5 }}>
            Public release link created for approved publishing. The original review file remains saved for history.
          </div>
        ) : null}
        {isOperatorAdmin ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {upload.reviewStatus !== 'approved' && upload.reviewStatus !== 'promoted' ? (
              <button
                type="button"
                className="btn-glass"
                onClick={() => void handleMediaReviewAdminAction(upload, 'approve')}
                disabled={Boolean(activeMediaReviewAction)}
                style={{ padding: '7px 10px', fontSize: '0.72rem', opacity: activeMediaReviewAction ? 0.66 : 1 }}
              >
                {activeMediaReviewAction === `${upload.bucket}:${upload.path}:approve:none` ? 'APPROVING...' : 'APPROVE'}
              </button>
            ) : null}
            {upload.reviewStatus === 'pending_review' || upload.reviewStatus === 'approved' ? (
              <button
                type="button"
                className="btn-glass"
                onClick={() => void handleMediaReviewAdminAction(upload, 'reject')}
                disabled={Boolean(activeMediaReviewAction)}
                style={{ padding: '7px 10px', fontSize: '0.72rem', opacity: activeMediaReviewAction ? 0.66 : 1 }}
              >
                {activeMediaReviewAction === `${upload.bucket}:${upload.path}:reject:none` ? 'REJECTING...' : 'REJECT'}
              </button>
            ) : null}
            {upload.reviewStatus === 'approved' ? promoteTargets.map((target) => {
              const promoteActionKey = `${upload.bucket}:${upload.path}:promote:${target}`;
              return (
                <button
                  key={target}
                  type="button"
                  className="btn-glass"
                  onClick={() => void handleMediaReviewAdminAction(upload, 'promote', target)}
                  disabled={Boolean(activeMediaReviewAction)}
                  style={{ padding: '7px 10px', fontSize: '0.72rem', opacity: activeMediaReviewAction ? 0.66 : 1 }}
                >
                  {activeMediaReviewAction === promoteActionKey ? 'PROMOTING...' : `PROMOTE TO ${target.toUpperCase()}`}
                </button>
              );
            }) : null}
          </div>
        ) : (
          <div style={{ color: '#94a3b8', fontSize: '0.74rem', lineHeight: 1.5 }}>
            Admin review controls are hidden for sponsor accounts. Upload status is visible here, but public promotion requires explicit admin action.
          </div>
        )}
      </div>
    );
  };
  const renderLaunchStep = (step: AdminLaunchStep, index: number) => {
    const style = ADMIN_LAUNCH_STEP_STYLE[step.state];

    return (
      <div
        key={step.label}
        style={{
          background: style.background,
          border: `1px solid ${style.border}`,
          borderRadius: '18px',
          padding: '14px 15px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: style.accent, fontSize: '0.68rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Step {index + 1} / {style.label}
            </div>
            <div style={{ color: '#f8fafc', fontSize: '0.96rem', fontWeight: 900, marginTop: '5px' }}>
              {step.label}
            </div>
          </div>
          <div style={{ color: style.accent, fontSize: '0.7rem', fontWeight: 900, textAlign: 'right', textTransform: 'uppercase' }}>
            {step.status}
          </div>
        </div>
        <p style={{ color: '#cbd5e1', fontSize: '0.78rem', lineHeight: 1.5, margin: '10px 0 0' }}>
          {step.body}
        </p>
        {step.actionLabel && step.onAction && (
          <button
            type="button"
            className="btn-glass"
            onClick={step.onAction}
            disabled={loading}
            style={{ marginTop: '12px', padding: '7px 10px', fontSize: '0.72rem' }}
          >
            {loading && step.label === 'Save draft' ? 'SAVING...' : step.actionLabel}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="calculator-pro-wrapper" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', color: 'white' }}>
      <CompanyAdminPageHeader onNavigate={nav} showOperatorTools={workspaceMode === 'advanced'} />

      <div className="calc-header">
        <h1 className="text-accent" style={{ fontSize: '2.2rem' }}>SPONSOR WORKSPACE</h1>
        <p>Choose one task. City advertising and booth content are configured separately.</p>
      </div>

      <CompanyAdminMessage message={message} />
      <CompanyAdminAccessNotice notice={adminAccessNotice} onNavigate={nav} />
      <CompanyAdminWorkspaceTabs mode={workspaceMode} onChange={setWorkspaceMode} />

      {workspaceMode === 'city-screen' && (
        <CityScreenQuickSetup
          canUpload={adminAccessState === 'ready' && Boolean(company.id) && !activeMediaReviewUpload}
          canSave={canSaveBooth && Boolean(company.name.trim()) && Boolean(selectedCityScreenSlot) && cityScreenContentValidation.ok && cityScreenCampaignValidation.ok}
          canSubmit={canSaveBooth && Boolean(company.name.trim()) && Boolean(selectedCityScreenSlot) && cityScreenContentValidation.ok && cityScreenSubmissionValidation.ok}
          companyName={company.name}
          content={company.cityScreenContent}
          isOperatorAdmin={isOperatorAdmin}
          loading={loading}
          onChange={updateCityScreenContent}
          onChangeCompanyName={(name) => setCompany((current) => ({ ...current, name }))}
          onOpenBoothSetup={() => setWorkspaceMode('booth')}
          onOpenCatalog={() => nav('/expo/city-screens')}
          onOpenCity={() => nav('/expo-3d')}
          onApprove={() => void handleCityScreenSave('approve')}
          onPublish={() => void handleCityScreenSave('publish')}
          onRequestChanges={() => void handleCityScreenSave('reject')}
          onSaveDraft={() => void handleCityScreenSave('draft')}
          onSelectSlot={selectCityScreenSlot}
          onSubmitReview={() => void handleCityScreenSave('review')}
          onUploadMedia={(files) => void handleMediaReviewUpload('city-screen', files)}
          selectedSlot={selectedCityScreenSlot}
          slots={cityScreenSlots}
          uploadStatus={mediaReviewUploadStatus['city-screen'] || ''}
          uploading={activeMediaReviewUpload === 'city-screen'}
          validationIssue={cityScreenContentIssueText || cityScreenCampaignIssueText}
        />
      )}

      {workspaceMode === 'booth' && (
        <BoothQuickSetup
          boothMediaUploadStatus={mediaReviewUploadStatus['booth-screen'] || ''}
          canUpload={adminAccessState === 'ready' && Boolean(company.id) && !activeMediaReviewUpload}
          canOpenPreview={canOpenManagedPreview}
          canSave={canSaveBooth && Boolean(company.name.trim())}
          ctaPrimary={company.sponsorAssetPack.ctaPrimary}
          companyName={company.name}
          content={company.screenContent}
          headline={company.sponsorAssetPack.headline}
          heroImageUrl={company.sponsorAssetPack.heroImageUrl}
          loading={loading}
          logoUploadStatus={mediaReviewUploadStatus.logo || ''}
          logoUrl={company.sponsorAssetPack.logoUrl}
          onChangeAssetPack={updateSponsorAssetPack}
          onChangeCompanyName={(name) => setCompany((current) => ({ ...current, name }))}
          onChangeScreen={updateScreenContent}
          onOpenCityAdvertising={() => setWorkspaceMode('city-screen')}
          onOpenPreview={() => company.id && nav(buildManagedBoothPreviewRoute(company.id))}
          onSave={() => void handleBoothQuickSave('draft')}
          onSubmitReview={() => void handleBoothQuickSave('review')}
          onUploadBoothMedia={(files) => void handleMediaReviewUpload('booth-screen', files)}
          onUploadLogo={(files) => void handleMediaReviewUpload('logo', files)}
          packageTier={company.sponsorAssetPack.packageTier}
          shortPitch={company.sponsorAssetPack.shortPitch}
          validationIssue={screenContentIssueText || sponsorAssetPackIssueText}
          websiteUrl={company.sponsorAssetPack.websiteUrl}
          uploadingBoothMedia={activeMediaReviewUpload === 'booth-screen'}
          uploadingLogo={activeMediaReviewUpload === 'logo'}
        />
      )}

      {workspaceMode === 'advanced' && (
      <>
        <CompanyAdminLaunchFlow
          boothPublicationLabel={boothPublicationLabel}
          launchStepCount={launchSteps.length}
          unblockedLaunchStepCount={unblockedLaunchStepCount}
        >
          {launchSteps.map(renderLaunchStep)}
        </CompanyAdminLaunchFlow>

        <div className="calc-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="calc-form-column">
          <section className="calc-section" style={{ marginBottom: '25px' }}>
            <h2>Managed Booths</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {managedBooths.length === 0 ? (
                <div style={{ color: '#94a3b8' }}>
                  {adminAccessState === 'ready'
                    ? 'No saved booths loaded for this account yet. Fill the booth details below and save to create one.'
                    : 'Sign in to load and save managed booths. No API key is required.'}
                </div>
              ) : managedBooths.map((booth) => (
                <button
                  key={String(booth.id)}
                  type="button"
                  onClick={() => void handleManagedBoothSelect(String(booth.id || ''))}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '16px',
                    border: `1px solid ${company.id === String(booth.id || '') ? selectedDistrictColor : '#334155'}`,
                    background: company.id === String(booth.id || '') ? 'rgba(15, 23, 42, 0.86)' : 'rgba(2, 6, 23, 0.72)',
                    color: '#f8fafc',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{booth.company_name || 'Managed Booth'}</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{String(booth.district || 'unassigned').toUpperCase()}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="calc-section">
            <h2>Company Booth Profile</h2>
            <div className="input-group">
              <label>
                Company name
                <input
                  type="text"
                  placeholder={DEFAULT_VISIBLE_SCENE_COMPANY_NAME}
                  value={company.name}
                  onChange={(event) => setCompany({ ...company, name: event.target.value })}
                />
                {willUseVisibleSceneCompanyAlias && (
                  <span style={{ display: 'block', marginTop: '7px', color: '#bae6fd', fontSize: '0.76rem', lineHeight: 1.45 }}>
                    This saves as {companyNameForSave} so the screen content can match the visible 3D scene booth.
                  </span>
                )}
              </label>

              <label style={{ marginTop: '20px' }}>
                District
                <select
                  value={company.district}
                  onChange={(event) => setCompany({ ...company, district: event.target.value })}
                >
                  <option value="">-- Select district --</option>
                  {districts.map((districtId) => {
                    const district = EXPO_CANONICAL_DISTRICT_CATALOG.find((entry) => entry.id === districtId);
                    return (
                      <option key={districtId} value={districtId}>
                        {district?.name || districtId}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label style={{ marginTop: '20px' }}>
                Publication status
                <select
                  value={normalizedBoothStatus}
                  onChange={(event) =>
                    setCompany({
                      ...company,
                      status: normalizeExpoBoothPublicationStatus(event.target.value),
                    })}
                >
                  {selectablePublicationStatuses.map((status) => (
                    <option key={status} value={status}>
                      {getExpoBoothPublicationStatusLabel(status)}
                    </option>
                  ))}
                </select>
                <span style={{ display: 'block', marginTop: '7px', color: '#94a3b8', fontSize: '0.76rem', lineHeight: 1.45 }}>
                  {publicationStatusHelp}
                </span>
              </label>

              <label style={{ marginTop: '20px' }}>
                Description
                <textarea
                  placeholder="Short company message for the admin-managed booth."
                  value={company.description}
                  onChange={(event) => setCompany({ ...company, description: event.target.value })}
                  style={{ height: '120px' }}
                />
              </label>

              <div style={{ marginTop: '24px', paddingTop: '22px', borderTop: '1px solid rgba(148, 163, 184, 0.16)' }}>
                <h3 style={{ margin: '0 0 8px', color: '#f8fafc' }}>Media Review</h3>
                <p style={{ margin: '0 0 12px', color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  Submit lightweight sponsor media references for review before approval and public publish. Reviewed assets may be adjusted before they appear in the public booth or city scene.
                </p>
                <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '14px', background: 'rgba(30, 64, 175, 0.16)', border: '1px solid rgba(147, 197, 253, 0.22)', color: '#bfdbfe', fontSize: '0.76rem', lineHeight: 1.5 }}>
                  Sponsor guidance: public booths use reviewed media, not arbitrary direct uploads. Admin guidance: review these references before moving a booth to Approved or Published. Published booths are public scene eligible.
                  <br />
                  Reference safety: {EXPO_MEDIA_REVIEW_REFERENCE_POLICY_TEXT}. Localhost, private IPs, non-HTTPS URLs, SVG and embedded credentials are blocked.
                </div>
                <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '14px', background: 'rgba(8, 47, 73, 0.24)', border: '1px solid rgba(56, 189, 248, 0.24)', color: '#bae6fd', fontSize: '0.76rem', lineHeight: 1.5 }}>
                  Upload for review: files go through the protected backend route into private bucket storage. Uploads are not public until approved and do not overwrite public booth media automatically.
                </div>
                <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '14px', background: 'rgba(30, 41, 59, 0.62)', border: '1px solid rgba(148, 163, 184, 0.16)', color: '#cbd5e1', fontSize: '0.76rem', lineHeight: 1.5 }}>
                  Review path: approved media can be published to the booth or selected city screen only after a reviewer confirms it.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '6px' }}>
                  <div>{renderMediaReviewUploadInput('logo')}</div>
                  <div>{renderMediaReviewUploadInput('poster')}</div>
                  <div>{renderMediaReviewUploadInput('hero')}</div>
                  <div>{renderMediaReviewUploadInput('reference')}</div>
                </div>
                {company.mediaReview.uploads.length > 0 && (
                  <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                    {company.mediaReview.uploads.map((upload) => (
                      <div
                        key={`${upload.bucket}:${upload.path}`}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '14px',
                          background: 'rgba(15, 23, 42, 0.72)',
                          border: '1px solid rgba(148, 163, 184, 0.16)',
                        }}
                      >
                        {renderMediaReviewUploadActions(upload)}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <label>
                    Logo URL/reference
                    <input
                      type="url"
                      inputMode="url"
                      placeholder="https://cdn.example.com/logo.png"
                      value={company.mediaReview.logoUrl}
                      onChange={(event) => updateMediaReview({ logoUrl: event.target.value })}
                    />
                  </label>

                  <label>
                    Poster URL/reference
                    <input
                      type="url"
                      inputMode="url"
                      placeholder="https://cdn.example.com/poster.png"
                      value={company.mediaReview.posterUrl}
                      onChange={(event) => updateMediaReview({ posterUrl: event.target.value })}
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '16px' }}>
                  <label>
                    Hero image URL/reference
                    <input
                      type="url"
                      inputMode="url"
                      placeholder="https://cdn.example.com/hero.webp"
                      value={company.mediaReview.heroImageUrl}
                      onChange={(event) => updateMediaReview({ heroImageUrl: event.target.value })}
                    />
                  </label>

                  <label>
                    Hero video URL/reference
                    <input
                      type="url"
                      inputMode="url"
                      placeholder="https://cdn.example.com/hero.mp4"
                      value={company.mediaReview.heroVideoUrl}
                      onChange={(event) => updateMediaReview({ heroVideoUrl: event.target.value })}
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '16px' }}>
                  <label>
                    Desired CTA label
                    <input
                      type="text"
                      placeholder="Request Demo"
                      value={company.mediaReview.ctaLabel}
                      onChange={(event) => updateMediaReview({ ctaLabel: event.target.value })}
                    />
                  </label>

                  <label>
                    Website link
                    <input
                      type="url"
                      inputMode="url"
                      placeholder="https://example.com"
                      value={company.mediaReview.websiteUrl}
                      onChange={(event) => updateMediaReview({ websiteUrl: event.target.value })}
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '16px' }}>
                  <label>
                    Booking link
                    <input
                      type="url"
                      inputMode="url"
                      placeholder="https://example.com/book"
                      value={company.mediaReview.bookingUrl}
                      onChange={(event) => updateMediaReview({ bookingUrl: event.target.value })}
                    />
                  </label>

                  <label>
                    Tagline
                    <input
                      type="text"
                      placeholder="Short sponsor-facing media line"
                      value={company.mediaReview.tagline}
                      onChange={(event) => updateMediaReview({ tagline: event.target.value })}
                    />
                  </label>
                </div>

                <label style={{ marginTop: '16px' }}>
                  Short media notes
                  <textarea
                    placeholder="Explain what should be reviewed, adjusted or prioritised before public publish."
                    value={company.mediaReview.mediaNotes}
                    onChange={(event) => updateMediaReview({ mediaNotes: event.target.value })}
                    style={{ height: '92px' }}
                  />
                </label>

                <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '14px', background: mediaReviewValidation.ok ? 'rgba(6, 78, 59, 0.26)' : 'rgba(127, 29, 29, 0.28)', border: `1px solid ${mediaReviewValidation.ok ? 'rgba(52, 211, 153, 0.26)' : 'rgba(248, 113, 113, 0.32)'}`, color: mediaReviewValidation.ok ? '#bbf7d0' : '#fecaca', fontSize: '0.78rem', lineHeight: 1.5 }}>
                  Media review references: {mediaReviewValidation.ok ? 'READY TO SAVE FOR REVIEW' : 'FIX REFERENCES BEFORE SAVE'}
                  <br />
                  Review path: save these references first, then move the booth through Submitted, Approved and Published using the existing booth status workflow.
                  {!mediaReviewValidation.ok && mediaReviewIssueText ? (
                    <>
                      <br />
                      Validation: {mediaReviewIssueText}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="calc-section" style={{ marginTop: '25px' }}>
            <h2>Presentation Media</h2>
              <div className="input-group">
                <label>
                Presentation video URL
                <input
                  type="text"
                  placeholder="https://cdn.example.com/presentation.mp4"
                  value={company.booth.video_url}
                  onChange={(event) =>
                    setCompany({
                      ...company,
                      booth: { ...company.booth, video_url: event.target.value },
                    })}
                />
                <span style={{ display: 'block', marginTop: '7px', color: '#94a3b8', fontSize: '0.76rem', lineHeight: 1.45 }}>
                  Optional booth-room video preview. Use an uploaded file or a direct {EXPO_SCREEN_CONTENT_VIDEO_EXTENSIONS.join(' / ')} file link.
                </span>
                {!boothVideoValidation.ok && company.booth.video_url.trim() && (
                  <span style={{ display: 'block', marginTop: '7px', color: '#fca5a5', fontSize: '0.76rem', lineHeight: 1.45 }}>
                    {boothVideoValidation.reason}
                  </span>
                )}
              </label>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '22px', borderTop: '1px solid rgba(148, 163, 184, 0.16)' }}>
              <h3 style={{ margin: '0 0 8px', color: '#f8fafc' }}>Sponsor Asset Pack</h3>
              <p style={{ margin: '0 0 18px', color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5 }}>
                Client-friendly sponsor material kit. Sponsors can provide normal web assets now; 3D product model import stays optional for Warpala prep.
              </p>
              <div style={{ marginBottom: '16px', padding: '10px 12px', borderRadius: '14px', background: 'rgba(30, 64, 175, 0.16)', border: '1px solid rgba(147, 197, 253, 0.22)', color: '#bfdbfe', fontSize: '0.76rem', lineHeight: 1.5 }}>
                Asset safety: {EXPO_SPONSOR_ASSET_PACK_MEDIA_POLICY_TEXT}. Localhost, private IPs, non-HTTPS URLs, SVG and embedded credentials are blocked.
                <br />
                Uploads use the Supabase Storage bucket expo_assets. After upload, save booth settings to attach the asset pack to this booth.
                <br />
                Public-release guard: direct expo_assets uploads and booth-screen copy controls are admin-only here. Sponsor review media should use the Media Review section above.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <label>
                  Package tier
                  <select
                    value={company.sponsorAssetPack.packageTier}
                    onChange={(event) => updateSponsorAssetPack({ packageTier: event.target.value as ExpoSponsorPackageTier })}
                  >
                    <option value="standard">Standard Booth</option>
                    <option value="premium">Featured Booth</option>
                    <option value="landmarkZone">Landmark Zone Sponsor</option>
                  </select>
                </label>

                <label>
                  Headline
                  <input
                    type="text"
                    placeholder="AI workflow platform for sponsor teams"
                    value={company.sponsorAssetPack.headline}
                    onChange={(event) => updateSponsorAssetPack({ headline: event.target.value })}
                  />
                </label>
              </div>

              <label style={{ marginTop: '16px' }}>
                Short pitch
                <textarea
                  placeholder="One concise sales message for booth cards, screen copy, and package previews."
                  value={company.sponsorAssetPack.shortPitch}
                  onChange={(event) => updateSponsorAssetPack({ shortPitch: event.target.value })}
                  style={{ height: '82px' }}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '16px' }}>
                <label>
                  Logo image URL
                  <input
                    type="url"
                    inputMode="url"
                    placeholder="https://cdn.example.com/logo.png"
                      value={company.sponsorAssetPack.logoUrl}
                      onChange={(event) => updateSponsorAssetPack({ logoUrl: event.target.value })}
                  />
                  {isOperatorAdmin ? renderSponsorAssetUploadInput('logoUrl') : null}
                </label>

                <label>
                  Hero image URL
                  <input
                    type="url"
                    inputMode="url"
                    placeholder="https://cdn.example.com/hero.webp"
                      value={company.sponsorAssetPack.heroImageUrl}
                      onChange={(event) => updateSponsorAssetPack({ heroImageUrl: event.target.value })}
                  />
                  {isOperatorAdmin ? renderSponsorAssetUploadInput('heroImageUrl') : null}
                </label>
              </div>

              <label style={{ marginTop: '16px' }}>
                Product image URLs
                <textarea
                  placeholder={`One public image URL per line. Up to ${EXPO_SPONSOR_ASSET_PACK_PRODUCT_IMAGE_LIMIT}.`}
                  value={company.sponsorAssetPack.productImageUrls}
                  onChange={(event) => updateSponsorAssetPack({ productImageUrls: event.target.value })}
                  style={{ height: '104px' }}
                />
                {isOperatorAdmin ? renderSponsorAssetUploadInput('productImageUrls') : null}
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '16px' }}>
                <label>
                  Demo video URL
                  <input
                    type="url"
                    inputMode="url"
                    placeholder="https://cdn.example.com/demo.mp4"
                      value={company.sponsorAssetPack.demoVideoUrl}
                      onChange={(event) => updateSponsorAssetPack({ demoVideoUrl: event.target.value })}
                  />
                  {isOperatorAdmin ? renderSponsorAssetUploadInput('demoVideoUrl') : null}
                </label>

                <label>
                  Brochure PDF URL
                  <input
                    type="url"
                    inputMode="url"
                    placeholder="https://cdn.example.com/package.pdf"
                      value={company.sponsorAssetPack.brochureUrl}
                      onChange={(event) => updateSponsorAssetPack({ brochureUrl: event.target.value })}
                  />
                  {isOperatorAdmin ? renderSponsorAssetUploadInput('brochureUrl') : null}
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginTop: '16px' }}>
                <label>
                  Primary CTA label
                  <input
                    type="text"
                    placeholder="Request Demo"
                    value={company.sponsorAssetPack.ctaPrimary}
                    onChange={(event) => updateSponsorAssetPack({ ctaPrimary: event.target.value })}
                  />
                </label>

                <label>
                  Secondary CTA label
                  <input
                    type="text"
                    placeholder="View Package"
                    value={company.sponsorAssetPack.ctaSecondary}
                    onChange={(event) => updateSponsorAssetPack({ ctaSecondary: event.target.value })}
                  />
                </label>
              </div>

              <label style={{ marginTop: '16px' }}>
                Website URL
                <input
                  type="url"
                  inputMode="url"
                  placeholder="https://example.com"
                  value={company.sponsorAssetPack.websiteUrl}
                  onChange={(event) => updateSponsorAssetPack({ websiteUrl: event.target.value })}
                />
                <span style={{ display: 'block', marginTop: '7px', color: '#94a3b8', fontSize: '0.76rem', lineHeight: 1.45 }}>
                  Stored for sponsor readiness only. No external redirects, forms, or booking flows are enabled by this field.
                </span>
              </label>

              {isOperatorAdmin ? (
                <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.68)', border: '1px solid rgba(125, 211, 252, 0.18)' }}>
                  <div style={{ color: '#f8fafc', fontSize: '0.78rem', fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Send asset pack to booth screen
                  </div>
                  <div style={{ marginTop: '6px', color: '#94a3b8', fontSize: '0.76rem', lineHeight: 1.45 }}>
                    Copies sponsor pack media into Booth Screen Content and sets it to Published. Save booth settings to apply it in the 3D city.
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                    <button
                      type="button"
                      className="btn-glass"
                      disabled={!sponsorAssetPackScreenImageUrl || sponsorPublicReleaseControlsDisabled}
                      onClick={() => copySponsorAssetImageToBoothScreen(sponsorAssetPackScreenImageUrl)}
                      style={{ padding: '7px 10px', fontSize: '0.72rem', opacity: !sponsorAssetPackScreenImageUrl || sponsorPublicReleaseControlsDisabled ? 0.58 : 1 }}
                    >
                      USE IMAGE ON BOOTH SCREEN
                    </button>
                    <button
                      type="button"
                      className="btn-glass"
                      disabled={!sponsorAssetPackScreenVideoUrl || sponsorPublicReleaseControlsDisabled}
                      onClick={() => copySponsorAssetVideoToBoothScreen(sponsorAssetPackScreenVideoUrl)}
                      style={{ padding: '7px 10px', fontSize: '0.72rem', opacity: !sponsorAssetPackScreenVideoUrl || sponsorPublicReleaseControlsDisabled ? 0.58 : 1 }}
                    >
                      USE VIDEO SLOT ON BOOTH SCREEN
                    </button>
                    <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
                      Image source priority: hero, logo, then first product image. Video is saved as a safe placeholder until playback review is enabled.
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '14px', background: 'rgba(30, 41, 59, 0.62)', border: '1px solid rgba(148, 163, 184, 0.16)', color: '#cbd5e1', fontSize: '0.76rem', lineHeight: 1.5 }}>
                  Admin-only public-release controls are hidden from sponsor accounts here. Use the Media Review section above for sponsor-submitted assets.
                </div>
              )}

              <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '14px', background: sponsorAssetPackValidation.ok ? 'rgba(6, 78, 59, 0.26)' : 'rgba(127, 29, 29, 0.28)', border: `1px solid ${sponsorAssetPackValidation.ok ? 'rgba(52, 211, 153, 0.26)' : 'rgba(248, 113, 113, 0.32)'}`, color: sponsorAssetPackValidation.ok ? '#bbf7d0' : '#fecaca', fontSize: '0.78rem', lineHeight: 1.5 }}>
                Asset pack: {sponsorAssetPackReadiness.clientFriendlyReady ? 'CLIENT PACKAGE READY' : 'MATERIALS READINESS IN PROGRESS'}
                <br />
                Package: {sponsorAssetPackReadiness.packageTier.toUpperCase()} / assets {sponsorAssetPackReadiness.readyAssetCount} / product images {sponsorAssetPackReadiness.productImageCount}/{EXPO_SPONSOR_ASSET_PACK_PRODUCT_IMAGE_LIMIT}
                <br />
                Media: logo {sponsorAssetPackReadiness.hasLogo ? 'yes' : 'no'}, hero {sponsorAssetPackReadiness.hasHeroImage ? 'yes' : 'no'}, video {sponsorAssetPackReadiness.hasDemoVideo ? 'yes' : 'no'}, brochure {sponsorAssetPackReadiness.hasBrochure ? 'yes' : 'no'}
                <br />
                URL safety: {sponsorAssetPackValidation.ok ? 'READY TO SAVE' : sponsorAssetPackIssueText}
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '22px', borderTop: '1px solid rgba(148, 163, 184, 0.16)' }}>
              <h3 style={{ margin: '0 0 8px', color: '#f8fafc' }}>Booth Screen Content</h3>
              <p style={{ margin: '0 0 18px', color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5 }}>
                This content appears on the screen inside the sponsor booth. City advertising screens are configured separately in the City advertising tab.
              </p>
              <div style={{ marginBottom: '16px', padding: '10px 12px', borderRadius: '14px', background: 'rgba(14, 116, 144, 0.16)', border: '1px solid rgba(125, 211, 252, 0.22)', color: '#bae6fd', fontSize: '0.76rem', lineHeight: 1.5 }}>
                Media safety: {mediaPolicyText} Localhost, private IPs, non-HTTPS URLs, SVG and embedded credentials are blocked.
              </div>
              <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                {SCREEN_MEDIA_SETUP_GUIDE.map((entry) => (
                  <div key={entry.label} style={{ padding: '12px 13px', borderRadius: '14px', background: 'rgba(2, 6, 23, 0.58)', border: '1px solid rgba(148, 163, 184, 0.16)', color: '#cbd5e1', fontSize: '0.76rem', lineHeight: 1.45 }}>
                    <strong style={{ display: 'block', marginBottom: '4px', color: '#f8fafc', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {entry.label}
                    </strong>
                    {entry.value}
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
                <label>
                  Screen mode
                  <select
                    value={company.screenContent.mode}
                    onChange={(event) => updateScreenContent({ mode: event.target.value as AdminScreenContentMode })}
                  >
                    <option value="generated-card">Generated card</option>
                    <option value="image">Image</option>
                    <option value="video">Live video (.mp4/.webm)</option>
                  </select>
                </label>

                <label>
                  Status
                  <select
                    value={company.screenContent.status}
                    onChange={(event) => updateScreenContent({ status: event.target.value as AdminScreenContentStatus })}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
              </div>

              <label style={{ marginTop: '16px' }}>
                Screen title
                <input
                  type="text"
                  placeholder="Sponsor offer, demo title, or campaign headline"
                  value={company.screenContent.title}
                  onChange={(event) => updateScreenContent({ title: event.target.value })}
                />
              </label>

              <label style={{ marginTop: '16px' }}>
                Screen subtitle
                <textarea
                  placeholder="Short support copy for the booth screen."
                  value={company.screenContent.subtitle}
                  onChange={(event) => updateScreenContent({ subtitle: event.target.value })}
                  style={{ height: '86px' }}
                />
              </label>

              <label style={{ marginTop: '16px' }}>
                Booth screen
                <select
                  value={company.screenContent.screenSlotId}
                  onChange={(event) => updateScreenContent({ screenSlotId: event.target.value })}
                >
                  <option value="">Use the booth's default screen</option>
                  {boothScreenSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.label}
                    </option>
                  ))}
                </select>
                <span style={{ display: 'block', marginTop: '7px', color: '#94a3b8', fontSize: '0.76rem', lineHeight: 1.45 }}>
                  Optional. Most sponsors should keep the default booth screen.
                </span>
              </label>
              {selectedScreenSlot && (
                <div style={{ marginTop: '10px', padding: '12px 14px', borderRadius: '14px', background: 'rgba(2, 6, 23, 0.62)', border: '1px solid rgba(125, 211, 252, 0.18)', color: '#cbd5e1', fontSize: '0.78rem', lineHeight: 1.55 }}>
                  Selected screen: <strong style={{ color: '#f8fafc' }}>{selectedScreenSlot.label}</strong> / {selectedScreenSlot.sizeLabel}
                  <br />
                  {selectedScreenSlot.placementNotes}
                </div>
              )}

              <label style={{ marginTop: '16px' }}>
                Image URL
                <input
                  type="text"
                  placeholder="https://cdn.example.com/sponsor-screen.png"
                  value={company.screenContent.imageUrl}
                  onChange={(event) => updateScreenImageUrl(event.target.value)}
                />
                <span style={{ display: 'block', marginTop: '7px', color: '#94a3b8', fontSize: '0.76rem', lineHeight: 1.45 }}>
                  Pasting an image URL sets Screen mode to Image and Status to Published. Supported: {EXPO_SCREEN_CONTENT_IMAGE_EXTENSIONS.join(', ')}.
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '9px' }}>
                  <button
                    type="button"
                    className="btn-glass"
                    disabled={!sampleScreenImageUrl}
                    onClick={() => sampleScreenImageUrl && updateScreenContent({
                      ctaLabel: company.screenContent.ctaLabel || DEFAULT_SCREEN_TEST_CTA,
                      imageUrl: sampleScreenImageUrl,
                      mode: 'image',
                      status: 'published',
                      subtitle: company.screenContent.subtitle || DEFAULT_SCREEN_TEST_SUBTITLE,
                      title: company.screenContent.title || DEFAULT_SCREEN_TEST_TITLE,
                    })}
                    style={{ padding: '7px 10px', fontSize: '0.72rem' }}
                  >
                    USE TEST ORBIT IMAGE + PUBLISH
                  </button>
                  <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
                    {sampleScreenImageUrl || `Available after HTTPS deploy: ${EXPO_SCREEN_TEST_IMAGE_PATH}`}
                  </span>
                </div>
              </label>

              <label style={{ marginTop: '16px' }}>
                Video URL
                <input
                  type="url"
                  inputMode="url"
                  placeholder="https://cdn.example.com/demo.mp4"
                  value={company.screenContent.videoUrl}
                  onChange={(event) => updateScreenVideoUrl(event.target.value)}
                />
                <span style={{ display: 'block', marginTop: '7px', color: '#94a3b8', fontSize: '0.76rem', lineHeight: 1.45 }}>
                  Pasting a video URL sets Screen mode to Live video and Status to Published. Direct public media file only. Supported: {EXPO_SCREEN_CONTENT_VIDEO_EXTENSIONS.join(', ')}. Do not paste YouTube, Vimeo, Google Drive, localhost, or signed/private URLs.
                </span>
              </label>

              <label style={{ marginTop: '16px' }}>
                CTA label
                <input
                  type="text"
                  placeholder="Request Demo"
                  value={company.screenContent.ctaLabel}
                  onChange={(event) => updateScreenContent({ ctaLabel: event.target.value })}
                />
              </label>

              <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '14px', background: screenContentValidation.ok && boothVideoValidation.ok ? 'rgba(6, 78, 59, 0.26)' : 'rgba(127, 29, 29, 0.28)', border: `1px solid ${screenContentValidation.ok && boothVideoValidation.ok ? 'rgba(52, 211, 153, 0.26)' : 'rgba(248, 113, 113, 0.32)'}`, color: screenContentValidation.ok && boothVideoValidation.ok ? '#bbf7d0' : '#fecaca', fontSize: '0.78rem', lineHeight: 1.5 }}>
                Current screen content: {company.screenContent.status.toUpperCase()} / {company.screenContent.mode.toUpperCase()}
                <br />
                URL safety: {screenContentValidation.ok && boothVideoValidation.ok ? 'READY TO SAVE' : screenContentIssueText}
                <br />
                Screen visibility: {screenVisibilityHint}
              </div>
            </div>

            <div style={{ marginTop: '30px' }}>
              <button
                onClick={() => adminAccessState === 'signed-out' ? nav('/login?next=/expo/admin') : void handleSave()}
                className="btn-primary"
                disabled={!canSaveBooth && adminAccessState !== 'signed-out'}
                style={{ width: '100%', padding: '18px', fontSize: '1.1rem', opacity: canSaveBooth || adminAccessState === 'signed-out' ? 1 : 0.62 }}
              >
                {saveButtonLabel}
              </button>
            </div>
          </section>
        </div>

        <div className="calc-results-column">
          <section className="calc-section" style={{ marginBottom: '25px' }}>
            <h2>Sponsor Readiness</h2>
            <p style={{ marginTop: 0, color: '#94a3b8', fontSize: '0.86rem', lineHeight: 1.55 }}>
              Lightweight MVP readiness view only. It reuses the current booth status, sponsor package, media review, lead inbox and analytics data without adding new tracking or review tables.
            </p>
            <div
              style={{
                marginTop: '16px',
                padding: '18px',
                borderRadius: '20px',
                background: sponsorReadinessStyle.background,
                border: `1px solid ${sponsorReadinessStyle.border}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: sponsorReadinessStyle.accent, fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Readiness category
                  </div>
                  <div style={{ color: '#f8fafc', fontSize: '1.5rem', fontWeight: 900, marginTop: '6px' }}>
                    {sponsorReadinessCategory}
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.55, marginTop: '10px', maxWidth: '640px' }}>
                    {publicationSceneReadinessText}
                  </div>
                </div>
                <div style={{ minWidth: '180px', padding: '12px 14px', borderRadius: '16px', background: 'rgba(2, 6, 23, 0.3)', border: '1px solid rgba(148, 163, 184, 0.14)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Readiness checklist
                  </div>
                  <div style={{ color: '#f8fafc', fontSize: '1.35rem', fontWeight: 900, marginTop: '6px' }}>
                    {readinessChecklistCount}/5
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.76rem', lineHeight: 1.45, marginTop: '8px' }}>
                    Save path, package, visible screen content, media review, and CTA/contact coverage.
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '18px' }}>
                <div style={{ padding: '14px', borderRadius: '16px', background: 'rgba(2, 6, 23, 0.42)', border: '1px solid rgba(148, 163, 184, 0.14)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Publication status</div>
                  <div style={{ color: '#f8fafc', fontSize: '1.05rem', fontWeight: 900, marginTop: '6px' }}>{boothPublicationLabel}</div>
                </div>
                <div style={{ padding: '14px', borderRadius: '16px', background: 'rgba(2, 6, 23, 0.42)', border: '1px solid rgba(148, 163, 184, 0.14)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Scene presence</div>
                  <div style={{ color: '#f8fafc', fontSize: '1.05rem', fontWeight: 900, marginTop: '6px' }}>{isExpoBoothPublicSceneStatus(normalizedBoothStatus) ? 'Public now' : hasVisibleScreenContent ? 'Preview-ready' : 'Needs screen content'}</div>
                </div>
                <div style={{ padding: '14px', borderRadius: '16px', background: 'rgba(2, 6, 23, 0.42)', border: '1px solid rgba(148, 163, 184, 0.14)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Package tier</div>
                  <div style={{ color: '#f8fafc', fontSize: '1.05rem', fontWeight: 900, marginTop: '6px' }}>{company.sponsorAssetPack.packageTier.toUpperCase()}</div>
                </div>
                <div style={{ padding: '14px', borderRadius: '16px', background: 'rgba(2, 6, 23, 0.42)', border: '1px solid rgba(148, 163, 184, 0.14)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Lead count</div>
                  <div style={{ color: '#f8fafc', fontSize: '1.05rem', fontWeight: 900, marginTop: '6px' }}>{leads.length}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '18px' }}>
              {readinessItems.map((item) => (
                <div key={item.label} style={{ padding: '15px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.76)', border: '1px solid rgba(148, 163, 184, 0.16)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'baseline' }}>
                    <div style={{ color: '#f8fafc', fontSize: '0.86rem', fontWeight: 900 }}>{item.label}</div>
                    <div style={{ color: item.tone, fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'right' }}>
                      {item.status}
                    </div>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.5, marginTop: '9px' }}>
                    {item.detail}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="calc-section" style={{ marginBottom: '25px' }}>
            <h2>Operational Summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
              {[
                { label: 'Visits', value: analyticsTracked ? String(analytics?.visits ?? 0) : 'Not tracked', color: '#f8fafc' },
                { label: 'Interactions', value: analyticsTracked ? String(analytics?.interactions ?? 0) : 'Not tracked', color: '#93c5fd' },
                { label: 'Leads', value: analyticsTracked ? String(analytics?.leads_generated ?? 0) : 'Not tracked', color: '#34d399' },
              ].map((entry) => (
                <div key={entry.label} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(2, 6, 23, 0.68)', border: '1px solid rgba(148, 163, 184, 0.16)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{entry.label}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: entry.color }}>{entry.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
              <button type="button" onClick={() => roomRouteId && nav(`/expo/booth/${roomRouteId}`)} className="btn-glass" disabled={!roomRouteId}>
                OPEN BOOTH ROOM
              </button>
              <button type="button" onClick={() => company.id && nav(buildManagedBoothPreviewRoute(company.id))} className="btn-glass" disabled={!company.id}>
                PREVIEW BOOTH SCREEN IN 3D
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginTop: '18px' }}>
              {([
                { id: 'pending', label: 'Pending', color: LEAD_STATUS_COLORS.pending },
                { id: 'contacted', label: 'Contacted', color: LEAD_STATUS_COLORS.contacted },
                { id: 'closed', label: 'Closed', color: LEAD_STATUS_COLORS.closed },
                { id: 'rejected', label: 'Rejected', color: LEAD_STATUS_COLORS.rejected },
              ] as const).map((entry) => (
                <div key={entry.id} style={{ padding: '14px', borderRadius: '16px', background: 'rgba(2, 6, 23, 0.68)', border: '1px solid rgba(148, 163, 184, 0.16)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{entry.label}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: entry.color }}>{leadStatusCounts[entry.id] ?? 0}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '18px', padding: '16px', borderRadius: '16px', background: 'rgba(2, 6, 23, 0.68)', border: '1px solid rgba(148, 163, 184, 0.16)' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Lead Ops Queue</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 800, color: '#f8fafc' }}>{leadsNeedingAction.length} leads need action</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Latest inbound: {latestLeadTimestamp}</div>
              </div>
            </div>
          </section>

          <section className="calc-section" style={{ marginBottom: '25px' }}>
            <h2>Screen Inventory & Pricing</h2>
            <p style={{ marginTop: 0, color: '#94a3b8', fontSize: '0.86rem', lineHeight: 1.55 }}>
              First commercial inventory model: booth-owned screens, featured city screens and event surfaces have separate value tiers, price hints and availability.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px', marginBottom: '14px' }}>
              {[
                { label: 'Total', value: screenInventorySummary.totalCount },
                { label: 'Available', value: screenInventorySummary.availableCount },
                { label: 'Reserved', value: screenInventorySummary.reservedCount },
                { label: 'Preview', value: screenInventorySummary.previewOnlyCount },
              ].map((entry) => (
                <div key={entry.label} style={{ padding: '12px', borderRadius: '14px', background: 'rgba(2, 6, 23, 0.62)', border: '1px solid rgba(148, 163, 184, 0.14)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{entry.label}</div>
                  <div style={{ color: '#f8fafc', fontSize: '1.3rem', fontWeight: 900 }}>{entry.value}</div>
                </div>
              ))}
            </div>
            {ownedScreenSlots.length > 0 && (
              <div style={{ marginBottom: '12px', padding: '12px 14px', borderRadius: '14px', background: 'rgba(14, 116, 144, 0.14)', border: '1px solid rgba(125, 211, 252, 0.2)', color: '#bae6fd', fontSize: '0.78rem', lineHeight: 1.5 }}>
                This booth already has {ownedScreenSlots.length} reserved screen slot{ownedScreenSlots.length === 1 ? '' : 's'} in the inventory model.
              </div>
            )}
            <div style={{ display: 'grid', gap: '10px' }}>
              {availableScreenSlots.slice(0, 4).map((slot) => (
                <div key={slot.id} style={{ padding: '12px 14px', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.72)', border: '1px solid rgba(148, 163, 184, 0.14)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'start' }}>
                    <div>
                      <div style={{ color: '#f8fafc', fontWeight: 900 }}>{slot.label}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.76rem', marginTop: '4px' }}>{slot.sizeLabel}</div>
                    </div>
                    <div style={{ color: slot.valueTier === 'landmark' ? '#fbbf24' : slot.valueTier === 'hero' ? '#93c5fd' : '#cbd5e1', fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {slot.valueTier} / EUR {slot.monthlyPriceHintEur}
                    </div>
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.74rem', lineHeight: 1.45, marginTop: '7px' }}>{slot.placementNotes}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="calc-section" style={{ padding: 0, overflow: 'hidden', height: '400px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ padding: '25px', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>3D Booth Preview</h2>
            <div style={{ flex: 1, background: '#000', position: 'relative' }}>
              <Canvas camera={{ position: [0, 5, 30], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <Environment preset="city" />
                <BoothPreview company={company} color={selectedDistrictColor} />
                <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 2} />
              </Canvas>
              <div style={{ position: 'absolute', bottom: '15px', width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', pointerEvents: 'none' }}>
                Drag to inspect the managed booth composition.
              </div>
            </div>
          </section>

          <section className="calc-section" style={{ marginTop: '25px' }}>
            <h2>Incoming Leads</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {([
                { id: 'needs_action', label: 'Needs Action' },
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'contacted', label: 'Contacted' },
                { id: 'closed', label: 'Closed' },
                { id: 'rejected', label: 'Rejected' },
              ] as const).map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setLeadFilter(entry.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '999px',
                    border: `1px solid ${leadFilter === entry.id ? selectedDistrictColor : '#334155'}`,
                    background: leadFilter === entry.id ? `${selectedDistrictColor}22` : 'rgba(15, 23, 42, 0.92)',
                    color: leadFilter === entry.id ? '#f8fafc' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {entry.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {visibleLeads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>INBOX</div>
                  <p>{leads.length === 0 ? 'No managed sponsor leads found for this booth yet.' : 'No leads match the current lead ops filter.'}</p>
                </div>
              ) : visibleLeads.map((lead) => {
                const leadKey = String(lead.id || `${lead.client_email}:${lead.created_at}`);
                const draft = leadOpsDrafts[leadKey] ?? { followUpAt: '', opsNotes: '' };
                return (
                <div key={leadKey} style={{ padding: '16px', borderRadius: '16px', background: 'rgba(2, 6, 23, 0.72)', border: '1px solid rgba(148, 163, 184, 0.16)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 800, color: '#f8fafc' }}>{lead.client_name || 'Unnamed lead'}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{lead.created_at ? new Date(lead.created_at).toLocaleString() : ''}</div>
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 10px',
                      marginTop: '10px',
                      borderRadius: '999px',
                      background: `${LEAD_STATUS_COLORS[String(lead.status || 'pending').toLowerCase()] || '#fbbf24'}1a`,
                      border: `1px solid ${LEAD_STATUS_COLORS[String(lead.status || 'pending').toLowerCase()] || '#fbbf24'}55`,
                      color: LEAD_STATUS_COLORS[String(lead.status || 'pending').toLowerCase()] || '#fbbf24',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {LEAD_STATUS_LABELS[String(lead.status || 'pending').toLowerCase()] || 'Pending'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#93c5fd', marginTop: '4px' }}>{lead.client_email || 'No email provided'}</div>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '10px', lineHeight: 1.5 }}>{lead.message || 'No message provided.'}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {String(lead.service_name || 'expo_sponsor_lead')}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
                    {(['pending', 'contacted', 'closed', 'rejected'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={!lead.id || activeLeadAction === `${String(lead.id)}:${status}` || String(lead.status || 'pending').toLowerCase() === status}
                        onClick={() => lead.id && void handleLeadStatusChange(String(lead.id), status)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '999px',
                          border: `1px solid ${LEAD_STATUS_COLORS[status]}55`,
                          background: String(lead.status || 'pending').toLowerCase() === status ? `${LEAD_STATUS_COLORS[status]}22` : 'rgba(15, 23, 42, 0.92)',
                          color: LEAD_STATUS_COLORS[status],
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          opacity: !lead.id || activeLeadAction === `${String(lead.id)}:${status}` ? 0.6 : 1,
                        }}
                      >
                        {activeLeadAction === `${String(lead.id)}:${status}` ? 'Saving...' : LEAD_STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(148, 163, 184, 0.16)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                      Lead Ops Note
                    </div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8' }}>
                      Follow-up at
                      <input
                        type="datetime-local"
                        value={draft.followUpAt}
                        onChange={(event) =>
                          setLeadOpsDrafts((current) => ({
                            ...current,
                            [leadKey]: {
                              followUpAt: event.target.value,
                              opsNotes: current[leadKey]?.opsNotes ?? draft.opsNotes,
                            },
                          }))
                        }
                        style={{ marginTop: '8px' }}
                      />
                    </label>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginTop: '12px' }}>
                      Ops note
                      <textarea
                        value={draft.opsNotes}
                        onChange={(event) =>
                          setLeadOpsDrafts((current) => ({
                            ...current,
                            [leadKey]: {
                              followUpAt: current[leadKey]?.followUpAt ?? draft.followUpAt,
                              opsNotes: event.target.value,
                            },
                          }))
                        }
                        style={{ height: '90px', marginTop: '8px' }}
                        placeholder="Next step, outreach summary, objections, or follow-up context."
                      />
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Last ops update: {lead.ops_updated_at ? new Date(lead.ops_updated_at).toLocaleString() : 'none'}
                      </div>
                      <button
                        type="button"
                        onClick={() => lead.id && void handleLeadOpsSave(String(lead.id))}
                        disabled={!lead.id || activeLeadOpsSave === String(lead.id)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '999px',
                          border: `1px solid ${selectedDistrictColor}`,
                          background: `${selectedDistrictColor}22`,
                          color: '#f8fafc',
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          opacity: !lead.id || activeLeadOpsSave === String(lead.id) ? 0.6 : 1,
                        }}
                      >
                        {activeLeadOpsSave === String(lead.id) ? 'Saving...' : 'Save Ops'}
                      </button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </section>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
