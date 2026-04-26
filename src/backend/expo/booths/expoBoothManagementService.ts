import { getExpoBoothById, listExpoBooths, type ExpoBoothRecord } from '../data/expoBoothStore.js';

export type ExpoBackendUserContext = {
  email?: string | null;
  id?: string | null;
  role?: string | null;
};

export function mergeOwnedBoothPayload(
  payload: Record<string, unknown>,
  user: ExpoBackendUserContext,
) {
  const contactInfo =
    payload.contact_info && typeof payload.contact_info === 'object'
      ? payload.contact_info as Record<string, unknown>
      : {};

  return {
    ...payload,
    contact_info: {
      ...contactInfo,
      owner_email: user.email ?? contactInfo.owner_email ?? null,
      owner_user_id: user.id ?? contactInfo.owner_user_id ?? null,
    },
    org_id: user.id ?? payload.org_id ?? null,
  };
}

export function getBoothCompanyId(booth: ExpoBoothRecord) {
  const raw = (booth as unknown as { company_id?: unknown }).company_id;
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : '';
}

export function boothBelongsToUser(booth: ExpoBoothRecord, user: ExpoBackendUserContext) {
  const userId = String(user.id || '').trim();
  const userEmail = String(user.email || '').trim().toLowerCase();
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

export async function getManagedExpoBoothForUser(
  boothId: string,
  user: ExpoBackendUserContext,
) {
  const boothResult = await getExpoBoothById(boothId);
  if (boothResult.error || !boothResult.data) {
    return { booth: null, error: boothResult.error || `Booth ${boothId} not found`, status: 404 as const };
  }

  if (user.role !== 'admin' && !boothBelongsToUser(boothResult.data, user)) {
    return { booth: null, error: 'Booth ownership mismatch', status: 403 as const };
  }

  return { booth: boothResult.data, error: null, status: 200 as const };
}

export async function listManagedExpoBoothsForUser(user: ExpoBackendUserContext) {
  const result = await listExpoBooths();
  if (result.error || !result.data) {
    return { data: null, error: String(result.error || 'Managed booths unavailable') };
  }

  if (user.role === 'admin') {
    return { data: result.data, error: null };
  }

  return {
    data: result.data.filter((booth) => boothBelongsToUser(booth, user)),
    error: null,
  };
}
