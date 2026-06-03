import { Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Text, useVideoTexture } from '@react-three/drei';
import { expoDashboardService } from '../../app/expo/expoDashboardService';
import {
  getSponsorAssetUploadAccept,
  getSponsorAssetUploadLabel,
  uploadSponsorAssetPackFile,
  type ExpoSponsorAssetUploadTarget,
} from '../../app/expo/sponsorAssetUploadService';
import { supabaseClient } from '../../lib/supabaseClient';
import { EXPO_CANONICAL_DISTRICT_CATALOG } from '../../services/expoService';
import {
  EXPO_SCREEN_CONTENT_IMAGE_EXTENSIONS,
  EXPO_SCREEN_CONTENT_VIDEO_EXTENSIONS,
  normalizeExpoScreenContentForSave,
  validateExpoScreenMediaUrl,
} from '../../shared/expo/screenContentMedia';
import {
  EXPO_SPONSOR_ASSET_PACK_MEDIA_POLICY_TEXT,
  EXPO_SPONSOR_ASSET_PACK_PRODUCT_IMAGE_LIMIT,
  getExpoSponsorAssetPackReadiness,
  normalizeExpoSponsorAssetPackForSave,
  readExpoSponsorAssetPackFromAssets,
  type ExpoSponsorPackageTier,
} from '../../shared/expo/sponsorAssetPack';
import {
  getAvailableExpoScreenSlots,
  getExpoScreenInventorySlots,
  getExpoScreenInventorySummary,
  getExpoScreenSlotById,
  getExpoScreenSlotsForBooth,
} from '../../shared/expo/screenInventory';
import '../../components/calculator/styles/CalculatorPro.css';
import WarpalaLogo from '../../shared/Logo';

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
  description: string;
  district: string;
  id: string;
  logo_url: string;
  name: string;
  screenContent: AdminScreenContentState;
  sponsorAssetPack: AdminSponsorAssetPackState;
  status: string;
};

type AdminScreenContentMode = 'generated-card' | 'image' | 'video-placeholder';
type AdminScreenContentStatus = 'draft' | 'published';

type AdminScreenContentState = {
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

type ManagedLeadOpsDraft = {
  followUpAt: string;
  opsNotes: string;
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
    value: 'Direct public HTTPS image file ending .jpg, .jpeg, .png, .webp, or .gif.',
  },
  {
    label: 'Video',
    value: 'Direct public HTTPS video file ending .mp4 or .webm. Sharing pages from YouTube, Drive, or Vimeo are not direct media files.',
  },
  {
    label: 'Website / CTA',
    value: 'Use the CTA label for presentation text now. Website embeds, redirects, and forms are intentionally not enabled yet.',
  },
  {
    label: 'Visibility',
    value: 'Matched booth screens can show saved published media now. Paid city screen slots are stored as inventory metadata until the city-screen render integration is wired.',
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

const DEFAULT_COMPANY: AdminCompanyState = {
  booth: { video_url: '' },
  description: '',
  district: EXPO_CANONICAL_DISTRICT_CATALOG[0]?.id ?? '',
  id: '',
  logo_url: '',
  name: DEFAULT_VISIBLE_SCENE_COMPANY_NAME,
  screenContent: {
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
  status: 'active',
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

  if (normalized === 'video' || normalized === 'video-placeholder') {
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

function readAdminScreenContent(assets3d: unknown): AdminScreenContentState {
  const assets = asRecord(assets3d);
  const screenContent = asRecord(assets.screen_content);

  return {
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

export default function CompanyAdmin() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [adminAccessState, setAdminAccessState] = useState<AdminAccessState>('checking-auth');
  const [adminAccessError, setAdminAccessError] = useState<string | null>(null);
  const [districts, setDistricts] = useState<string[]>([...EXPO_CANONICAL_DISTRICT_CATALOG.map((district) => district.id)]);
  const [managedBooths, setManagedBooths] = useState<Array<{ company_name?: string | null; district?: string | null; id?: string }>>([]);
  const [analytics, setAnalytics] = useState<ManagedAnalytics>(null);
  const [leads, setLeads] = useState<ManagedLead[]>([]);
  const [activeLeadAction, setActiveLeadAction] = useState<string | null>(null);
  const [leadFilter, setLeadFilter] = useState<'all' | 'needs_action' | 'pending' | 'contacted' | 'closed' | 'rejected'>('needs_action');
  const [leadOpsDrafts, setLeadOpsDrafts] = useState<Record<string, ManagedLeadOpsDraft>>({});
  const [activeLeadOpsSave, setActiveLeadOpsSave] = useState<string | null>(null);
  const [roomRouteId, setRoomRouteId] = useState('');
  const [company, setCompany] = useState<AdminCompanyState>(DEFAULT_COMPANY);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeSponsorAssetUpload, setActiveSponsorAssetUpload] = useState<ExpoSponsorAssetUploadTarget | null>(null);
  const [sponsorAssetUploadStatus, setSponsorAssetUploadStatus] = useState<Partial<Record<ExpoSponsorAssetUploadTarget, string>>>({});

  useEffect(() => {
    async function init() {
      try {
        setAdminAccessState('checking-auth');
        setAdminAccessError(null);
        const { data: sessionData } = await supabaseClient.auth.getSession();
        if (!sessionData.session?.access_token) {
          setAdminAccessState('signed-out');
          return;
        }

        const [districtResult, boothsResult] = await Promise.all([
          expoDashboardService.getDistricts(),
          expoDashboardService.getManagedBooths(),
        ]);

        setAdminAccessState('ready');

        if (Array.isArray(districtResult.data) && districtResult.data.length > 0) {
          setDistricts(districtResult.data.map((entry) => String(entry)));
        }

        if (boothsResult.data && boothsResult.data.length > 0) {
          setManagedBooths(boothsResult.data.map((entry) => ({
            company_name: entry.company_name,
            district: entry.district,
            id: entry.id,
          })));
          const first = boothsResult.data[0] as {
            assets_3d?: Record<string, unknown>;
            company_name?: string;
            contact_info?: { description?: string };
            district?: string;
            id?: string;
            logo_url?: string;
            status?: string;
          };
          setCompany({
            booth: {
              video_url: String(first.assets_3d?.video_url || ''),
            },
            description: String(first.contact_info?.description || ''),
            district: String(first.district || EXPO_CANONICAL_DISTRICT_CATALOG[0]?.id || ''),
            id: String(first.id || ''),
            logo_url: String(first.logo_url || ''),
            name: String(first.company_name || 'Warpala'),
            screenContent: readAdminScreenContent(first.assets_3d),
            sponsorAssetPack: readAdminSponsorAssetPack(first.assets_3d),
            status: String(first.status || 'active'),
          });
          if (first.id) {
            const [analyticsResult, reviewResult] = await Promise.all([
              expoDashboardService.getBoothAnalytics(String(first.id)),
              expoDashboardService.getManagedBoothReview(String(first.id)),
            ]);
            setAnalytics((analyticsResult.data as ManagedAnalytics) ?? null);
            setLeads((((reviewResult.data as { leadInbox?: ManagedLead[] } | null)?.leadInbox) ?? []).map((entry) => entry));
            setRoomRouteId(String((reviewResult.data as { reviewContext?: { roomRouteId?: string } } | null)?.reviewContext?.roomRouteId || first.id || ''));
          }
        }
      } catch (error) {
        const errorText = formatRequestError(error);
        setAdminAccessError(errorText);
        setAdminAccessState(resolveAdminAccessStateFromError(errorText));
        console.warn('EXPO_ADMIN_INIT_UNAVAILABLE', error);
      } finally {
        setLoading(false);
      }
    }

    void init();
  }, []);

  useEffect(() => {
    setLeadOpsDrafts((current) => {
      const next = { ...current };
      leads.forEach((lead) => {
        const key = String(lead.id || '');
        if (!key || next[key]) {
          return;
        }

        next[key] = {
          followUpAt: typeof lead.follow_up_at === 'string' && lead.follow_up_at
            ? new Date(lead.follow_up_at).toISOString().slice(0, 16)
            : '',
          opsNotes: String(lead.ops_notes || ''),
        };
      });
      return next;
    });
  }, [leads]);

  async function handleManagedBoothSelect(boothId: string) {
    setLoading(true);
    try {
      const [boothResult, analyticsResult] = await Promise.all([
        expoDashboardService.getManagedBoothReview(boothId),
        expoDashboardService.getBoothAnalytics(boothId),
      ]);

      const booth = (boothResult.data as {
        booth?: {
          assets_3d?: Record<string, unknown>;
          company_name?: string;
          contact_info?: { description?: string };
          district?: string;
          id?: string;
          logo_url?: string;
          status?: string;
        };
      } | null)?.booth;

      if (booth) {
        setCompany({
          booth: {
            video_url: String(booth.assets_3d?.video_url || ''),
          },
          description: String(booth.contact_info?.description || ''),
          district: String(booth.district || EXPO_CANONICAL_DISTRICT_CATALOG[0]?.id || ''),
          id: String(booth.id || boothId),
          logo_url: String(booth.logo_url || ''),
          name: String(booth.company_name || 'Warpala'),
          screenContent: readAdminScreenContent(booth.assets_3d),
          sponsorAssetPack: readAdminSponsorAssetPack(booth.assets_3d),
          status: String(booth.status || 'active'),
        });
      }

      setAnalytics((analyticsResult.data as ManagedAnalytics) ?? null);
      setLeads((((boothResult.data as { leadInbox?: ManagedLead[] } | null)?.leadInbox) ?? []).map((entry) => entry));
      setRoomRouteId(String((boothResult.data as { reviewContext?: { roomRouteId?: string } } | null)?.reviewContext?.roomRouteId || boothId));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (adminAccessState !== 'ready') {
      setMessage({ type: 'error', text: 'Sign in with a sponsor/admin account before saving booth screen content.' });
      return;
    }

    if (!company.name || !company.district) {
      setMessage({ type: 'error', text: 'Please provide a company name and district.' });
      return;
    }

    const companyNameForSave = resolveVisibleSceneCompanyName(company.name.trim());
    setLoading(true);
    try {
      const result = await expoDashboardService.saveManagedBooth({
        boothId: company.id || undefined,
        companyName: companyNameForSave,
        description: company.description,
        district: company.district,
        screenContent: company.screenContent,
        sponsorAssetPack: company.sponsorAssetPack,
        status: company.status || 'active',
        videoUrl: company.booth.video_url,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      const savedId = String((result.data as { id?: string } | null)?.id || company.id || '');
      setCompany((current) => ({
        ...current,
        id: savedId,
        name: companyNameForSave,
      }));
      if (savedId) {
        const [analyticsResult, reviewResult] = await Promise.all([
          expoDashboardService.getBoothAnalytics(savedId),
          expoDashboardService.getManagedBoothReview(savedId),
        ]);
        setAnalytics((analyticsResult.data as ManagedAnalytics) ?? null);
        setLeads((((reviewResult.data as { leadInbox?: ManagedLead[] } | null)?.leadInbox) ?? []).map((entry) => entry));
        setRoomRouteId(String((reviewResult.data as { reviewContext?: { roomRouteId?: string } } | null)?.reviewContext?.roomRouteId || savedId));
        const refreshedBooths = await expoDashboardService.getManagedBooths();
        if (refreshedBooths.data) {
          setManagedBooths(refreshedBooths.data.map((entry) => ({
            company_name: entry.company_name,
            district: entry.district,
            id: entry.id,
          })));
        }
      }
      setMessage({ type: 'success', text: 'Booth sponsor settings saved.' });
    } catch (error) {
      const errorText = formatRequestError(error);
      const accessState = resolveAdminAccessStateFromError(errorText);
      if (errorText.includes('SERVER_API_HTTP_')) {
        setAdminAccessError(errorText);
        setAdminAccessState(accessState);
      }

      setMessage({
        type: 'error',
        text: accessState === 'signed-out'
          ? 'Your admin session is missing or expired. Sign in again, then save the booth screen.'
          : accessState === 'access-denied'
            ? 'This account is not allowed to save this booth.'
            : accessState === 'backend-unavailable'
              ? 'The Expo admin service is not reachable right now. This is not an API key issue; reload after the service is restored.'
              : 'Failed to save booth screen settings.',
      });
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
      const result = await expoDashboardService.updateManagedLeadStatus(company.id, leadId, nextStatus);
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
      const result = await expoDashboardService.updateManagedLeadOps(company.id, leadId, {
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
      mode: 'video-placeholder',
      status: 'published',
      subtitle: company.sponsorAssetPack.shortPitch.trim() || company.screenContent.subtitle || DEFAULT_SCREEN_TEST_SUBTITLE,
      title: company.sponsorAssetPack.headline.trim() || company.name.trim() || company.screenContent.title || DEFAULT_SCREEN_TEST_TITLE,
      videoUrl: normalizedUrl,
    });
    setMessage({ type: 'success', text: 'Sponsor video slot copied to Booth Screen Content. Save booth settings to publish the video placeholder in 3D.' });
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
  const boothVideoValidation = validateExpoScreenMediaUrl(company.booth.video_url, 'video');
  const sponsorAssetPackValidation = normalizeExpoSponsorAssetPackForSave(company.sponsorAssetPack);
  const sponsorAssetPackReadiness = getExpoSponsorAssetPackReadiness(company.sponsorAssetPack);
  const mediaPolicyText = `Images: ${EXPO_SCREEN_CONTENT_IMAGE_EXTENSIONS.join(', ')}. Videos: ${EXPO_SCREEN_CONTENT_VIDEO_EXTENSIONS.join(', ')}. Direct public HTTPS files only.`;
  const screenContentIssueText = [
    ...screenContentValidation.issues.map((issue) => issue.message),
    ...(boothVideoValidation.ok ? [] : [boothVideoValidation.reason]),
  ].filter(Boolean).join(' ');
  const sponsorAssetPackIssueText = sponsorAssetPackValidation.issues
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
    && company.screenContent.mode === 'video-placeholder'
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
  const selectedScreenSlot = getExpoScreenSlotById(company.screenContent.screenSlotId);
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
  const sponsorAssetUploadDisabled = adminAccessState !== 'ready' || Boolean(activeSponsorAssetUpload);
  const normalizedBoothStatus = String(company.status || 'active').trim().toLowerCase();
  const boothPublicationLabel = normalizedBoothStatus === 'active'
    ? 'Active candidate'
    : normalizedBoothStatus === 'draft'
      ? 'Draft/admin preview'
      : normalizedBoothStatus || 'active';
  const hasSavedBoothId = company.id.trim().length > 0;
  const canOpenManagedPreview = adminAccessState === 'ready' && hasSavedBoothId && hasVisibleScreenContent;
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
        ? 'Save after media or copy changes. 3D preview uses the last saved backend version.'
        : 'Sign in and restore Expo admin service before saving sponsor content.',
      label: 'Save to backend',
      onAction: adminAccessState === 'ready' ? () => void handleSave() : undefined,
      state: adminAccessState === 'ready' ? 'review' : 'blocked',
      status: adminAccessState === 'ready' ? 'Manual save required' : 'Save unavailable',
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
      body: normalizedBoothStatus === 'active'
        ? 'This booth can be treated as a public-release candidate. Final live-scene release still stays operator-controlled.'
        : 'Keep draft booths in admin preview until sponsor material and placement are approved.',
      label: 'Public release',
      state: 'review',
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
            {isActive ? 'UPLOADING...' : `UPLOAD ${label.toUpperCase()}`}
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
            {loading && step.label === 'Save to backend' ? 'SAVING...' : step.actionLabel}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="calculator-pro-wrapper" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', alignItems: 'center' }}>
        <WarpalaLogo size={50} />
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => nav('/expo/sponsor-leads?sponsor=sponsor-concierge')} className="btn-glass">SPONSOR LEADS</button>
          <button onClick={() => nav('/expo-3d?operator=1')} className="btn-glass">OPEN 3D OPERATOR</button>
          <button onClick={() => nav('/dashboard')} className="btn-glass">DASHBOARD</button>
        </div>
      </div>

      <div className="calc-header">
        <h1 className="text-accent" style={{ fontSize: '3rem' }}>EXPO ADMIN</h1>
        <p>Manage booth identity, paid screen placement, and published sponsor screen content.</p>
      </div>

      {message && (
        <div
          className="glass-card"
          style={{
            padding: '15px',
            borderRadius: '12px',
            marginBottom: '30px',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
            border: `1px solid ${message.type === 'success' ? '#10b981' : '#f43f5e'}`,
            textAlign: 'center',
            fontWeight: 700,
          }}
        >
          {message.text}
        </div>
      )}

      {adminAccessNotice && (
        <div
          className="glass-card"
          style={{
            padding: '20px',
            borderRadius: '18px',
            marginBottom: '30px',
            background: 'rgba(15, 23, 42, 0.82)',
            border: '1px solid rgba(251, 191, 36, 0.42)',
          }}
        >
          <div style={{ color: '#fbbf24', fontSize: '0.74rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {adminAccessNotice.title}
          </div>
          <div style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 800, marginTop: '8px' }}>
            {adminAccessNotice.body}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5, marginTop: '8px' }}>
            {adminAccessNotice.detail}
          </div>
          <button
            type="button"
            className="btn-glass"
            onClick={() => nav(adminAccessNotice.actionPath)}
            style={{ marginTop: '14px' }}
          >
            {adminAccessNotice.actionLabel}
          </button>
        </div>
      )}

      <section
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, rgba(8, 13, 30, 0.92), rgba(14, 45, 64, 0.72))',
          border: '1px solid rgba(125, 211, 252, 0.2)',
          borderRadius: '24px',
          marginBottom: '30px',
          padding: '22px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: '#67e8f9', fontSize: '0.72rem', fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Sponsor launch flow
            </div>
            <h2 style={{ color: '#f8fafc', margin: '8px 0 6px', fontSize: '1.55rem' }}>
              From uploaded media to 3D booth preview
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.55, margin: 0, maxWidth: '720px' }}>
              Use this checklist before sending a sponsor preview. It separates admin-managed preview from public scene release, so draft sponsor work does not leak into the default city.
            </p>
          </div>
          <div style={{ minWidth: '190px', padding: '14px 16px', borderRadius: '18px', background: 'rgba(2, 6, 23, 0.62)', border: '1px solid rgba(148, 163, 184, 0.16)' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Unblocked
            </div>
            <div style={{ color: '#f8fafc', fontSize: '1.75rem', fontWeight: 950, marginTop: '4px' }}>
              {unblockedLaunchStepCount}/{launchSteps.length}
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '0.76rem', lineHeight: 1.45 }}>
              Booth status: {boothPublicationLabel}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginTop: '18px' }}>
          {launchSteps.map(renderLaunchStep)}
        </div>
      </section>

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
                Description
                <textarea
                  placeholder="Short company message for the admin-managed booth."
                  value={company.description}
                  onChange={(event) => setCompany({ ...company, description: event.target.value })}
                  style={{ height: '120px' }}
                />
              </label>
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
                  Optional booth-room video preview. {EXPO_SCREEN_CONTENT_VIDEO_EXTENSIONS.join(' / ')} over public HTTPS only.
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
                Client-friendly sponsor material kit. Sponsors can provide normal web assets now; 3D product model import stays optional for operator prep.
              </p>
              <div style={{ marginBottom: '16px', padding: '10px 12px', borderRadius: '14px', background: 'rgba(30, 64, 175, 0.16)', border: '1px solid rgba(147, 197, 253, 0.22)', color: '#bfdbfe', fontSize: '0.76rem', lineHeight: 1.5 }}>
                Asset safety: {EXPO_SPONSOR_ASSET_PACK_MEDIA_POLICY_TEXT}. Localhost, private IPs, non-HTTPS URLs, SVG and embedded credentials are blocked.
                <br />
                Uploads use the Supabase Storage bucket expo_assets. After upload, save booth settings to attach the asset pack to this booth.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <label>
                  Package tier
                  <select
                    value={company.sponsorAssetPack.packageTier}
                    onChange={(event) => updateSponsorAssetPack({ packageTier: event.target.value as ExpoSponsorPackageTier })}
                  >
                    <option value="standard">Standard Booth</option>
                    <option value="premium">Premium Booth</option>
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
                  {renderSponsorAssetUploadInput('logoUrl')}
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
                  {renderSponsorAssetUploadInput('heroImageUrl')}
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
                {renderSponsorAssetUploadInput('productImageUrls')}
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
                  {renderSponsorAssetUploadInput('demoVideoUrl')}
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
                  {renderSponsorAssetUploadInput('brochureUrl')}
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
                    disabled={!sponsorAssetPackScreenImageUrl}
                    onClick={() => copySponsorAssetImageToBoothScreen(sponsorAssetPackScreenImageUrl)}
                    style={{ padding: '7px 10px', fontSize: '0.72rem' }}
                  >
                    USE IMAGE ON BOOTH SCREEN
                  </button>
                  <button
                    type="button"
                    className="btn-glass"
                    disabled={!sponsorAssetPackScreenVideoUrl}
                    onClick={() => copySponsorAssetVideoToBoothScreen(sponsorAssetPackScreenVideoUrl)}
                    style={{ padding: '7px 10px', fontSize: '0.72rem' }}
                  >
                    USE VIDEO SLOT ON BOOTH SCREEN
                  </button>
                  <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
                    Image source priority: hero, logo, then first product image. Video is saved as a safe placeholder until playback review is enabled.
                  </span>
                </div>
              </div>

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
                Published image or video content can replace the generated booth screen card in the 3D city. Use direct public media URLs; city-wide paid screen slots are tracked as inventory until the next screen-slot render integration.
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
                    <option value="video-placeholder">Video (.mp4/.webm)</option>
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
                Screen placement slot
                <select
                  value={company.screenContent.screenSlotId}
                  onChange={(event) => updateScreenContent({ screenSlotId: event.target.value })}
                >
                  <option value="">No paid screen slot selected</option>
                  {screenInventorySlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.label} - {slot.valueTier.toUpperCase()} - EUR {slot.monthlyPriceHintEur}/mo - {slot.status}
                    </option>
                  ))}
                </select>
                <span style={{ display: 'block', marginTop: '7px', color: '#94a3b8', fontSize: '0.76rem', lineHeight: 1.45 }}>
                  Slot selection is stored as inventory metadata first. Booth screen media works now; city-wide screen rendering is the next integration step.
                </span>
              </label>
              {selectedScreenSlot && (
                <div style={{ marginTop: '10px', padding: '12px 14px', borderRadius: '14px', background: 'rgba(2, 6, 23, 0.62)', border: '1px solid rgba(125, 211, 252, 0.18)', color: '#cbd5e1', fontSize: '0.78rem', lineHeight: 1.55 }}>
                  Selected slot: <strong style={{ color: '#f8fafc' }}>{selectedScreenSlot.valueTier.toUpperCase()}</strong> / score {selectedScreenSlot.valueScore} / {selectedScreenSlot.sizeLabel} / {selectedScreenSlot.operatorZoneId}
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
                  onChange={(event) => updateScreenContent({ videoUrl: event.target.value })}
                />
                <span style={{ display: 'block', marginTop: '7px', color: '#94a3b8', fontSize: '0.76rem', lineHeight: 1.45 }}>
                  Direct public media file only. Supported: {EXPO_SCREEN_CONTENT_VIDEO_EXTENSIONS.join(', ')}. Do not paste YouTube, Vimeo, Google Drive, localhost, or signed/private URLs.
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
            <h2>Operational Summary</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
              {[
                { label: 'Visits', value: analytics?.visits ?? 0, color: '#f8fafc' },
                { label: 'Interactions', value: analytics?.interactions ?? 0, color: '#93c5fd' },
                { label: 'Leads', value: analytics?.leads_generated ?? 0, color: '#34d399' },
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
              First commercial inventory model: booth-owned screens, premium city screens and event surfaces have separate value tiers, price hints and availability.
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
                      <div style={{ color: '#94a3b8', fontSize: '0.76rem', marginTop: '4px' }}>{slot.sizeLabel} / {slot.operatorZoneId}</div>
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
    </div>
  );
}
