import { boothAnalytics } from '../analytics/boothAnalytics.js';
import { getManagedExpoBoothForUser, getBoothCompanyId, type ExpoBackendUserContext } from '../booths/expoBoothManagementService.js';
import { getExpoBoothById } from '../data/expoBoothStore.js';
import { expoSceneService } from '../scenes/expoSceneService.js';
import { buildExpoWorldContract } from '../../../shared/expo/worldContract.js';
import { buildExpoLayoutEngine } from '../../../shared/expo/layoutEngine.js';
import { getSupabaseAdminClient } from '../../lib/supabaseAdmin.js';

function summarizeTierCounts(boothPlacements: Array<{ sponsorTier?: string; boothType?: string }>) {
  return boothPlacements.reduce<Record<string, number>>((acc, placement) => {
    const key = String(placement.sponsorTier || placement.boothType || 'unknown').toLowerCase();
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function buildReviewCameraZones() {
  return [
    { id: 'arrival-gate', focus: [0, 42, 256], eye: [0, 128, 468], intent: 'arrival-gateway-hierarchy' },
    { id: 'left-marquee', focus: [-482, 142, -300], eye: [-768, 178, -42], intent: 'left-screen-marquee-review' },
    { id: 'center-spine', focus: [0, 96, -232], eye: [0, 164, 92], intent: 'center-civic-spine-review' },
    { id: 'right-marquee', focus: [486, 136, -330], eye: [782, 184, -60], intent: 'right-screen-marquee-review' },
    { id: 'tower-cluster', focus: [548, 122, -562], eye: [812, 196, -208], intent: 'tower-cluster-screen-review' },
    { id: 'array-band', focus: [0, 88, -214], eye: [0, 152, 76], intent: 'array-band-cross-city-review' },
    { id: 'sponsor-boulevard-left', focus: [-182, 12, -248], eye: [-318, 24, -42], intent: 'left-sponsor-boulevard-frontage-review' },
    { id: 'sponsor-boulevard-right', focus: [182, 12, -248], eye: [318, 24, -42], intent: 'right-sponsor-boulevard-frontage-review' },
    { id: 'rear-campus-center', focus: [0, 136, -3312], eye: [0, 248, -2636], intent: 'rear-campus-center-review' },
    { id: 'stadium-feed-axis', focus: [0, 98, -2820], eye: [0, 156, -2408], intent: 'rear-campus-feed-axis-review' },
  ] as const;
}

async function getExpoLeadInbox(companyId: string | null, companySlug: string | null) {
  const supabase = getSupabaseAdminClient();
  const buckets: Array<Array<Record<string, unknown>>> = [];

  if (companyId) {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      buckets.push(data as Array<Record<string, unknown>>);
    }
  }

  if (companySlug) {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('service_name', `expo_sponsor_lead:${companySlug}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      buckets.push(data as Array<Record<string, unknown>>);
    }
  }

  const deduped = new Map<string, Record<string, unknown>>();
  buckets.flat().forEach((entry) => {
    deduped.set(String(entry.id || `${entry.client_email || 'lead'}:${entry.created_at || ''}`), entry);
  });

  return Array.from(deduped.values())
    .sort((left, right) => String(right.created_at || '').localeCompare(String(left.created_at || '')));
}

async function getExpoLeadOpsMap(leadIds: string[]) {
  if (leadIds.length === 0) {
    return new Map<string, Record<string, unknown>>();
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('expo_lead_ops')
    .select('*')
    .in('service_request_id', leadIds);

  if (error || !data) {
    return new Map<string, Record<string, unknown>>();
  }

  return new Map(
    (data as Array<Record<string, unknown>>).map((entry) => [String(entry.service_request_id || ''), entry]),
  );
}

export async function buildExpoReviewSnapshot() {
  const sceneResult = await expoSceneService.getSceneData();
  if (sceneResult.error || !sceneResult.data) {
    throw new Error(sceneResult.error || 'Expo scene data unavailable');
  }

  const worldContract = buildExpoWorldContract(sceneResult.data);
  const layout = buildExpoLayoutEngine(
    sceneResult.data.companies.map((company) => ({
      ...company,
      booth: (company as any).booth ?? {},
    })),
    sceneResult.data.sectors,
  );
  const tierCounts = summarizeTierCounts(worldContract.boothPlacements);

  return {
    scene: {
      companyCount: sceneResult.data.companies.length,
      generatedAt: sceneResult.data.generatedAt,
      releaseMode: sceneResult.data.releaseMode,
      sceneVersion: sceneResult.data.sceneVersion,
      sectorCount: sceneResult.data.sectors.length,
    },
    review: {
      cameraZones: buildReviewCameraZones(),
      placementDiagnostics: layout.placementDiagnostics,
      tierCounts,
    },
    world: {
      boothCount: worldContract.boothPlacements.length,
      districtCount: worldContract.districtPrograms.length,
      districtSummaries: worldContract.districtPrograms.map((district, index) => {
        const visual = worldContract.visualProfile.districts[index];
        return {
          authoredMomentCount: district.authoredMomentCount,
          clusterIndex: district.clusterIndex,
          expressionMode: district.expressionMode,
          frontageIntensity: district.frontageIntensity,
          programNodeCount: district.programNodeCount,
          sectorId: district.sectorId,
          sectorLabel: district.sectorLabel,
          sponsorBackedFrontCount: district.sponsorBackedFrontCount,
          supportLevel: district.supportLevel,
          visual: visual
            ? {
                districtGlow: visual.districtGlow,
                groundAccent: visual.groundAccent,
                groundBase: visual.groundBase,
                shellAccent: visual.shellAccent,
                shellBase: visual.shellBase,
                skylineOpacity: visual.skylineOpacity,
                skylineScale: visual.skylineScale,
              }
            : null,
        };
      }),
      globalVisual: worldContract.visualProfile.global,
      playBounds: worldContract.playBounds,
      qualityProfileInputs: worldContract.qualityProfileInputs,
      startView: worldContract.startView,
      walkRegionCount: worldContract.walkRegions.length,
    },
  };
}

export async function buildExpoReviewBooth(boothId: string) {
  const sceneDataResult = await expoSceneService.getSceneData();
  if (sceneDataResult.error || !sceneDataResult.data) {
    return { data: null, error: sceneDataResult.error || 'Expo scene data unavailable', status: 500 as const };
  }

  const worldContract = buildExpoWorldContract(sceneDataResult.data);
  const [snapshot, boothResult, sceneResult, analyticsResult] = await Promise.all([
    buildExpoReviewSnapshot(),
    getExpoBoothById(boothId),
    expoSceneService.getBoothScene(boothId),
    boothAnalytics.getBoothStats(boothId),
  ]);

  if (boothResult.error || !boothResult.data) {
    return { data: null, error: boothResult.error || `Booth ${boothId} not found`, status: 404 as const };
  }

  const placement = worldContract.boothPlacements.find((entry) => {
    const placementId = String(entry.id || '');
    const placementBoothId =
      entry.company?.booth && typeof entry.company.booth === 'object'
        ? String(entry.company.booth.id || '')
        : '';
    return placementId === boothId || placementBoothId === boothId;
  });
  const placementCompany = placement?.company
    ? {
        id: String(placement.company.id || ''),
        name: String(placement.company.name || ''),
        slug: String(placement.company.slug || ''),
        sponsorTier: String(placement.company.sponsorTier || ''),
      }
    : null;
  const rawLeadInbox = await getExpoLeadInbox(placementCompany?.id || null, placementCompany?.slug || null);
  const leadOpsMap = await getExpoLeadOpsMap(rawLeadInbox.map((entry) => String(entry.id || '')).filter(Boolean));
  const leadInbox = rawLeadInbox.map((entry) => {
    const opsEntry = leadOpsMap.get(String(entry.id || ''));
    return {
      ...entry,
      follow_up_at: opsEntry?.follow_up_at ?? null,
      ops_notes: opsEntry?.ops_notes ?? null,
      ops_updated_at: opsEntry?.updated_at ?? null,
    };
  });
  const roomRouteId = placementCompany?.slug || placementCompany?.id || boothId;

  return {
    data: {
      analytics: analyticsResult.error ? null : analyticsResult.data,
      booth: boothResult.data,
      boothScene: sceneResult.error ? null : sceneResult.data,
      leadInbox,
      placement: placement
        ? {
            boothType: placement.boothType,
            clusterIndex: placement.clusterIndex,
            color: placement.color,
            company: placementCompany,
            districtThemeId: placement.districtThemeId,
            nodeType: placement.nodeType,
            position: placement.position,
            rotation: placement.rotation,
            sectorId: placement.sectorId,
            sponsorTier: placement.sponsorTier,
          }
        : null,
      reviewContext: {
        globalVisual: snapshot.world.globalVisual,
        roomRouteId,
        tierCounts: snapshot.review.tierCounts,
      },
    },
    error: null,
    status: 200 as const,
  };
}

export async function updateExpoReviewLeadStatus(
  boothId: string,
  leadId: string,
  nextStatus: string,
  user: ExpoBackendUserContext,
) {
  const boothAccess = await getManagedExpoBoothForUser(boothId, user);
  if (boothAccess.error || !boothAccess.booth) {
    return { data: null, error: boothAccess.error, status: boothAccess.status };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data: leadRecord, error: leadError } = await supabase
      .from('service_requests')
      .select('id, company_id, service_name, status')
      .eq('id', leadId)
      .single();

    if (leadError || !leadRecord) {
      return { data: null, error: leadError?.message || `Lead ${leadId} not found`, status: 404 as const };
    }

    const companyId = String(leadRecord.company_id || '').trim();
    const boothCompanyId = getBoothCompanyId(boothAccess.booth);
    if (companyId && boothCompanyId && companyId !== boothCompanyId) {
      return { data: null, error: 'Lead does not belong to this booth company', status: 403 as const };
    }

    const { data, error } = await supabase
      .from('service_requests')
      .update({ status: nextStatus })
      .eq('id', leadId)
      .select('*')
      .single();

    if (error) {
      return { data: null, error: error.message, status: 500 as const };
    }

    return { data, error: null, status: 200 as const };
  } catch (error) {
    return { data: null, error: String(error), status: 500 as const };
  }
}

export async function updateExpoReviewLeadOps(
  boothId: string,
  leadId: string,
  opsNotes: string | null,
  followUpAt: string | null,
  user: ExpoBackendUserContext,
) {
  const boothAccess = await getManagedExpoBoothForUser(boothId, user);
  if (boothAccess.error || !boothAccess.booth) {
    return { data: null, error: boothAccess.error, status: boothAccess.status };
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data: leadRecord, error: leadError } = await supabase
      .from('service_requests')
      .select('id, company_id')
      .eq('id', leadId)
      .single();

    if (leadError || !leadRecord) {
      return { data: null, error: leadError?.message || `Lead ${leadId} not found`, status: 404 as const };
    }

    const companyId = String(leadRecord.company_id || '').trim();
    const boothCompanyId = getBoothCompanyId(boothAccess.booth);
    if (companyId && boothCompanyId && companyId !== boothCompanyId) {
      return { data: null, error: 'Lead does not belong to this booth company', status: 403 as const };
    }

    const payload = {
      follow_up_at: followUpAt,
      ops_notes: opsNotes,
      service_request_id: leadId,
      updated_at: new Date().toISOString(),
      updated_by_user_id: user.id ?? null,
    };

    const { data, error } = await supabase
      .from('expo_lead_ops')
      .upsert(payload, { onConflict: 'service_request_id' })
      .select('*')
      .single();

    if (error) {
      return { data: null, error: error.message, status: 500 as const };
    }

    return { data, error: null, status: 200 as const };
  } catch (error) {
    return { data: null, error: String(error), status: 500 as const };
  }
}
