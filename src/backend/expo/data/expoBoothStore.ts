import { supabaseClient } from '../../../lib/supabaseClient';
import { EXPO_SCENE_CANONICAL_DISTRICTS } from '../../../shared/expo/sceneContract.js';

type SupabaseLikeError = {
  code?: string;
  message?: string;
};

export type ExpoBoothRecord = {
  id: string;
  company_name: string;
  district: string | null;
  contact_info?: Record<string, unknown> | null;
  assets_3d?: Record<string, unknown> | null;
  created_at?: string | null;
  logo?: string | null;
  org_id?: string | null;
  plan_type?: string | null;
  side?: string | null;
  title?: string | null;
  updated_at?: string | null;
  ['3d_model_url']?: string | null;
};

function isMissingTableError(error: unknown) {
  const candidate = error as SupabaseLikeError | null;
  return candidate?.code === 'PGRST205';
}

function coerceLegacyDistrict(side: unknown) {
  if (typeof side !== 'string') {
    return null;
  }

  if (side === 'left') {
    return EXPO_SCENE_CANONICAL_DISTRICTS[0] ?? null;
  }

  if (side === 'right') {
    return EXPO_SCENE_CANONICAL_DISTRICTS[EXPO_SCENE_CANONICAL_DISTRICTS.length - 1] ?? null;
  }

  return null;
}

function normalizePluralBooth(record: Record<string, any>): ExpoBoothRecord {
  return {
    id: String(record.id),
    ...record,
    company_name: record.company_name ?? record.title ?? `Booth ${record.id}`,
    district:
      typeof record.district === 'string' && record.district.trim().length > 0
        ? record.district.trim()
        : null,
  };
}

function normalizeLegacyBooth(record: Record<string, any>): ExpoBoothRecord {
  const organizationOwnerId =
    record.organization && typeof record.organization === 'object'
      ? String((record.organization as Record<string, unknown>).owner_id || '').trim()
      : '';
  const contactInfo =
    record.contact_info && typeof record.contact_info === 'object'
      ? record.contact_info as Record<string, unknown>
      : {};

  return {
    id: String(record.id),
    ...record,
    company_name: record.company_name ?? record.title ?? `Booth ${record.id}`,
    contact_info: {
      ...contactInfo,
      owner_user_id: contactInfo.owner_user_id ?? (organizationOwnerId || null),
    },
    district:
      typeof record.district === 'string' && record.district.trim().length > 0
        ? record.district.trim()
        : coerceLegacyDistrict(record.side),
    logo: record.logo ?? record.logo_url ?? null,
    ['3d_model_url']: record['3d_model_url'] ?? record.model_url ?? null,
  };
}

export async function listExpoBooths() {
  const pluralResult = await supabaseClient
    .from('expo_booths')
    .select('*')
    .order('created_at', { ascending: false });

  if (!pluralResult.error) {
    return {
      data: (pluralResult.data ?? []).map((record) => normalizePluralBooth(record)),
      error: null,
      table: 'expo_booths' as const,
    };
  }

  if (!isMissingTableError(pluralResult.error)) {
    return { data: null, error: pluralResult.error, table: 'expo_booths' as const };
  }

  const legacyResult = await supabaseClient
    .from('expo_booth')
    .select('*, organization(owner_id)')
    .order('id', { ascending: true });

  if (legacyResult.error) {
    return { data: null, error: legacyResult.error, table: 'expo_booth' as const };
  }

  return {
    data: (legacyResult.data ?? []).map((record) => normalizeLegacyBooth(record)),
    error: null,
    table: 'expo_booth' as const,
  };
}

export async function getExpoBoothById(id: string) {
  const pluralResult = await supabaseClient
    .from('expo_booths')
    .select('*')
    .eq('id', id)
    .single();

  if (!pluralResult.error) {
    return {
      data: normalizePluralBooth(pluralResult.data),
      error: null,
      table: 'expo_booths' as const,
    };
  }

  if (!isMissingTableError(pluralResult.error)) {
    return { data: null, error: pluralResult.error, table: 'expo_booths' as const };
  }

  const legacyResult = await supabaseClient
    .from('expo_booth')
    .select('*, organization(owner_id)')
    .eq('id', id)
    .single();

  if (legacyResult.error) {
    return { data: null, error: legacyResult.error, table: 'expo_booth' as const };
  }

  return {
    data: normalizeLegacyBooth(legacyResult.data),
    error: null,
    table: 'expo_booth' as const,
  };
}
