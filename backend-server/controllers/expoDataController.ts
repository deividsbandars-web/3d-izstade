import { Request, Response } from 'express';
import { expoService } from '../../src/backend/expo/expoService.js';
import { cityMapService } from '../../src/backend/expo/city/cityMapService.js';
import { expoSceneService } from '../../src/backend/expo/scenes/expoSceneService.js';
import { boothAnalytics } from '../../src/backend/expo/analytics/boothAnalytics.js';
import { buildExpoWorldContract } from '../../src/modules/expo/world-contract.js';
import { buildExpoLayoutEngine } from '../../src/modules/expo/layout-engine.js';
import { getExpoBoothById, listExpoBooths, type ExpoBoothRecord } from '../../src/backend/expo/data/expoBoothStore.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { getSupabase } from '../services/supabase.js';

function getIdParam(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
}

function getBoothCompanyId(booth: ExpoBoothRecord) {
  const raw = (booth as unknown as { company_id?: unknown }).company_id;
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : '';
}

function mergeOwnedBoothPayload(payload: Record<string, unknown>, req: AuthRequest) {
  const contactInfo =
    payload.contact_info && typeof payload.contact_info === 'object'
      ? payload.contact_info as Record<string, unknown>
      : {};

  return {
    ...payload,
    contact_info: {
      ...contactInfo,
      owner_email: req.user?.email ?? contactInfo.owner_email ?? null,
      owner_user_id: req.user?.id ?? contactInfo.owner_user_id ?? null,
    },
    org_id: req.user?.id ?? payload.org_id ?? null,
  };
}

function boothBelongsToUser(booth: ExpoBoothRecord, req: AuthRequest) {
  const userId = String(req.user?.id || '').trim();
  const userEmail = String(req.user?.email || '').trim().toLowerCase();
  const contactInfo = booth.contact_info && typeof booth.contact_info === 'object'
    ? booth.contact_info as Record<string, unknown>
    : {};
  const ownerUserId = String(contactInfo.owner_user_id || '').trim();
  const ownerEmail = String(contactInfo.owner_email || '').trim().toLowerCase();
  const orgId = String(booth.org_id || '').trim();

  if (!userId && !userEmail) {
    return false;
  }

  if (userId && (ownerUserId === userId || orgId === userId)) {
    return true;
  }

  if (userEmail && ownerEmail === userEmail) {
    return true;
  }

  return false;
}

async function getExpoLeadInbox(companyId: string | null, companySlug: string | null) {
  const supabase = getSupabase();
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

  const supabase = getSupabase();
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

async function getManagedExpoBoothForLeadUpdate(boothId: string, req: AuthRequest) {
  const boothResult = await getExpoBoothById(boothId);
  if (boothResult.error || !boothResult.data) {
    return { booth: null, error: boothResult.error || `Booth ${boothId} not found`, status: 404 as const };
  }

  if (req.user?.role !== 'admin' && !boothBelongsToUser(boothResult.data, req)) {
    return { booth: null, error: 'Booth ownership mismatch', status: 403 as const };
  }

  return { booth: boothResult.data, error: null, status: 200 as const };
}

function summarizeTierCounts(boothPlacements: Array<{ sponsorTier?: string; boothType?: string }>) {
  return boothPlacements.reduce<Record<string, number>>((acc, placement) => {
    const key = String(placement.sponsorTier || placement.boothType || 'unknown').toLowerCase();
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function buildReviewCameraZones() {
  return [
    { id: 'arrival', focus: [0, 42, 256], eye: [0, 128, 468], intent: 'arrival-gateway-hierarchy' },
    { id: 'left', focus: [-654, 122, -286], eye: [-968, 214, 86], intent: 'left-skyline-balance' },
    { id: 'middle', focus: [0, 112, -214], eye: [0, 188, 152], intent: 'core-civic-reading' },
    { id: 'right', focus: [628, 128, -248], eye: [954, 216, 74], intent: 'right-signal-cluster' },
    { id: 'rear', focus: [0, 136, -3312], eye: [0, 248, -2636], intent: 'stadium-campus-continuity' },
  ] as const;
}

async function buildExpoReviewSnapshot() {
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
    sceneResult.data.sectors
  );
  const placementDiagnostics = layout.placementDiagnostics;
  const tierCounts = summarizeTierCounts(worldContract.boothPlacements);
  const districtSummaries = worldContract.districtPrograms.map((district, index) => {
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
  });

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
      placementDiagnostics,
      tierCounts,
    },
    world: {
      boothCount: worldContract.boothPlacements.length,
      districtCount: worldContract.districtPrograms.length,
      districtSummaries,
      globalVisual: worldContract.visualProfile.global,
      playBounds: worldContract.playBounds,
      qualityProfileInputs: worldContract.qualityProfileInputs,
      startView: worldContract.startView,
      walkRegionCount: worldContract.walkRegions.length,
    },
  };
}

export const createBooth = async (req: AuthRequest, res: Response) => {
  const payload = req.body && typeof req.body === 'object' ? req.body : null;
  if (!payload) {
    return res.status(400).json({ error: 'booth payload is required' });
  }

  const result = await expoService.createBooth(mergeOwnedBoothPayload(payload as Record<string, unknown>, req) as any);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.status(201).json(result.data);
};

export const updateBooth = async (req: AuthRequest, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  if (!boothId) {
    return res.status(400).json({ error: 'boothId is required' });
  }

  const payload = req.body && typeof req.body === 'object' ? req.body : null;
  if (!payload) {
    return res.status(400).json({ error: 'update payload is required' });
  }

  const existingBooth = await getExpoBoothById(boothId);
  if (existingBooth.error || !existingBooth.data) {
    return res.status(404).json({ error: existingBooth.error || `Booth ${boothId} not found` });
  }

  if (req.user?.role !== 'admin' && !boothBelongsToUser(existingBooth.data, req)) {
    return res.status(403).json({ error: 'Booth ownership mismatch' });
  }

  const result = await expoService.updateBooth(boothId, mergeOwnedBoothPayload(payload as Record<string, unknown>, req) as any);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const getBooth = async (req: Request, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  if (!boothId) {
    return res.status(400).json({ error: 'boothId is required' });
  }

  const result = await expoService.getBoothById(boothId);
  if (result.error) {
    return res.status(404).json({ error: result.error });
  }

  res.json(result.data);
};

export const getBooths = async (_req: Request, res: Response) => {
  const result = await expoService.getBooths();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const getManagedBooths = async (req: AuthRequest, res: Response) => {
  const result = await listExpoBooths();
  if (result.error || !result.data) {
    return res.status(500).json({ error: String(result.error || 'Managed booths unavailable') });
  }

  if (req.user?.role === 'admin') {
    return res.json(result.data);
  }

  const managedBooths = result.data.filter((booth) => boothBelongsToUser(booth, req));
  res.json(managedBooths);
};

export const getBoothAnalytics = async (req: Request, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  if (!boothId) {
    return res.status(400).json({ error: 'boothId is required' });
  }

  const result = await boothAnalytics.getBoothStats(boothId);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const getExpoCity = async (_req: Request, res: Response) => {
  const result = await cityMapService.getCityMap();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const getDistricts = async (_req: Request, res: Response) => {
  const result = await cityMapService.getDistricts();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const assignBoothToDistrict = async (req: Request, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  const districtName =
    typeof req.body?.districtName === 'string' && req.body.districtName.trim().length > 0
      ? req.body.districtName.trim()
      : '';

  if (!boothId || !districtName) {
    return res.status(400).json({ error: 'boothId and districtName are required' });
  }

  const result = await cityMapService.assignBoothToDistrict(boothId, districtName);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const getBoothScene = async (req: Request, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  if (!boothId) {
    return res.status(400).json({ error: 'boothId is required' });
  }

  const result = await expoSceneService.getBoothScene(boothId);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const getCityScene = async (_req: Request, res: Response) => {
  const result = await expoSceneService.getCityScene();
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const getExpoReviewSnapshot = async (_req: Request, res: Response) => {
  try {
    const snapshot = await buildExpoReviewSnapshot();
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const getExpoReviewBooth = async (req: Request, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  if (!boothId) {
    return res.status(400).json({ error: 'boothId is required' });
  }

  try {
    const sceneDataResult = await expoSceneService.getSceneData();
    if (sceneDataResult.error || !sceneDataResult.data) {
      return res.status(500).json({ error: sceneDataResult.error || 'Expo scene data unavailable' });
    }

    const worldContract = buildExpoWorldContract(sceneDataResult.data);
    const [snapshot, boothResult, sceneResult, analyticsResult] = await Promise.all([
      buildExpoReviewSnapshot(),
      getExpoBoothById(boothId),
      expoSceneService.getBoothScene(boothId),
      boothAnalytics.getBoothStats(boothId),
    ]);

    if (boothResult.error || !boothResult.data) {
      return res.status(404).json({ error: boothResult.error || `Booth ${boothId} not found` });
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

    res.json({
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
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const updateExpoReviewLeadStatus = async (req: AuthRequest, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  const leadId = getIdParam(req.params.leadId);
  const nextStatus = typeof req.body?.status === 'string' ? req.body.status.trim().toLowerCase() : '';

  if (!boothId || !leadId) {
    return res.status(400).json({ error: 'boothId and leadId are required' });
  }

  if (!['pending', 'contacted', 'closed', 'rejected'].includes(nextStatus)) {
    return res.status(400).json({ error: 'Unsupported expo lead status' });
  }

  const boothAccess = await getManagedExpoBoothForLeadUpdate(boothId, req);
  if (boothAccess.error || !boothAccess.booth) {
    return res.status(boothAccess.status).json({ error: boothAccess.error });
  }

  try {
    const supabase = getSupabase();
    const { data: leadRecord, error: leadError } = await supabase
      .from('service_requests')
      .select('id, company_id, service_name, status')
      .eq('id', leadId)
      .single();

    if (leadError || !leadRecord) {
      return res.status(404).json({ error: leadError?.message || `Lead ${leadId} not found` });
    }

    const companyId = String(leadRecord.company_id || '').trim();
    const boothCompanyId = getBoothCompanyId(boothAccess.booth);
    if (companyId && boothCompanyId && companyId !== boothCompanyId) {
      return res.status(403).json({ error: 'Lead does not belong to this booth company' });
    }

    const { data, error } = await supabase
      .from('service_requests')
      .update({ status: nextStatus })
      .eq('id', leadId)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const updateExpoReviewLeadOps = async (req: AuthRequest, res: Response) => {
  const boothId = getIdParam(req.params.boothId);
  const leadId = getIdParam(req.params.leadId);
  const opsNotes =
    typeof req.body?.opsNotes === 'string' && req.body.opsNotes.trim().length > 0
      ? req.body.opsNotes.trim()
      : null;
  const followUpAt =
    typeof req.body?.followUpAt === 'string' && req.body.followUpAt.trim().length > 0
      ? req.body.followUpAt.trim()
      : null;

  if (!boothId || !leadId) {
    return res.status(400).json({ error: 'boothId and leadId are required' });
  }

  if (followUpAt && Number.isNaN(Date.parse(followUpAt))) {
    return res.status(400).json({ error: 'followUpAt must be a valid datetime' });
  }

  const boothAccess = await getManagedExpoBoothForLeadUpdate(boothId, req);
  if (boothAccess.error || !boothAccess.booth) {
    return res.status(boothAccess.status).json({ error: boothAccess.error });
  }

  try {
    const supabase = getSupabase();
    const { data: leadRecord, error: leadError } = await supabase
      .from('service_requests')
      .select('id, company_id')
      .eq('id', leadId)
      .single();

    if (leadError || !leadRecord) {
      return res.status(404).json({ error: leadError?.message || `Lead ${leadId} not found` });
    }

    const companyId = String(leadRecord.company_id || '').trim();
    const boothCompanyId = getBoothCompanyId(boothAccess.booth);
    if (companyId && boothCompanyId && companyId !== boothCompanyId) {
      return res.status(403).json({ error: 'Lead does not belong to this booth company' });
    }

    const payload = {
      follow_up_at: followUpAt,
      ops_notes: opsNotes,
      service_request_id: leadId,
      updated_at: new Date().toISOString(),
      updated_by_user_id: req.user?.id ?? null,
    };

    const { data, error } = await supabase
      .from('expo_lead_ops')
      .upsert(payload, { onConflict: 'service_request_id' })
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};
