import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import {
  EXPO_COMMUNITY_LIMITS,
  isExpoCommunityItemVisible,
  type ExpoCommunityAuditAction,
  type ExpoCommunityAuditEvent,
  type ExpoCommunityEntry,
  type ExpoCommunityEntryStatus,
  type ExpoCommunityGraffiti,
  type ExpoCommunityItemType,
  type ExpoCommunityReportReason,
} from '../../src/shared/expo/communityContent.js';
import { getSupabase } from './supabase.js';

type CommunityAudio = {
  buffer: Buffer;
  contentType: string;
  status: ExpoCommunityEntryStatus;
};

type CreateEntryInput = ExpoCommunityEntry & {
  authorUserId?: string;
};

type CreateGraffitiInput = ExpoCommunityGraffiti & {
  authorUserId?: string;
};

type ReportInput = {
  detail: string;
  reason: ExpoCommunityReportReason;
  reporterLabel: string;
  reporterUserId?: string;
};

export type ExpoCommunityModerationList = {
  audit: ExpoCommunityAuditEvent[];
  entries: ExpoCommunityEntry[];
  graffiti: ExpoCommunityGraffiti[];
};

export type ExpoCommunityStore = {
  createEntry(entry: CreateEntryInput, audio?: { buffer: Buffer; contentType: string }): Promise<ExpoCommunityEntry>;
  createGraffiti(graffiti: CreateGraffitiInput): Promise<ExpoCommunityGraffiti>;
  getAudio(id: string): Promise<CommunityAudio | null>;
  listApproved(): Promise<{ entries: ExpoCommunityEntry[]; graffiti: ExpoCommunityGraffiti[] }>;
  listModeration(): Promise<ExpoCommunityModerationList>;
  moderate(id: string, status: ExpoCommunityEntryStatus, moderatorUserId?: string, note?: string): Promise<ExpoCommunityEntry | ExpoCommunityGraffiti | null>;
  persistence: 'process-memory' | 'supabase';
  report(id: string, report: ReportInput): Promise<ExpoCommunityEntry | ExpoCommunityGraffiti | null>;
  resetForTests(): void;
};

const ENTRY_TABLE = 'expo_community_entries';
const GRAFFITI_TABLE = 'expo_community_graffiti';
const REPORT_TABLE = 'expo_community_reports';
const AUDIT_TABLE = 'expo_community_audit_events';

const seedEntry: ExpoCommunityEntry = {
  authorLabel: 'City host',
  body: 'Share a short message, a small advert, or a voice note with expo visitors.',
  createdAt: new Date(0).toISOString(),
  id: 'community-welcome',
  kind: 'message',
  status: 'approved',
  title: 'Welcome to the city board',
};

const memoryEntries: ExpoCommunityEntry[] = [{ ...seedEntry }];
const memoryGraffiti: ExpoCommunityGraffiti[] = [];
const memoryAudio = new Map<string, { buffer: Buffer; contentType: string }>();
const memoryAudit: ExpoCommunityAuditEvent[] = [];

function trimMemoryStore() {
  while (memoryEntries.length > 100) {
    const removed = memoryEntries.shift();
    if (removed?.kind === 'voice') memoryAudio.delete(removed.id);
  }
  if (memoryGraffiti.length > 48) memoryGraffiti.splice(0, memoryGraffiti.length - 48);
  if (memoryAudit.length > 250) memoryAudit.splice(0, memoryAudit.length - 250);
}

function cloneEntry(entry: ExpoCommunityEntry): ExpoCommunityEntry {
  return { ...entry };
}

function cloneGraffiti(graffiti: ExpoCommunityGraffiti): ExpoCommunityGraffiti {
  return { ...graffiti };
}

function cloneAudit(event: ExpoCommunityAuditEvent): ExpoCommunityAuditEvent {
  return { ...event };
}

function findMemoryItem(id: string) {
  const entry = memoryEntries.find((candidate) => candidate.id === id);
  if (entry) return { item: entry, itemType: 'entry' as ExpoCommunityItemType };
  const graffiti = memoryGraffiti.find((candidate) => candidate.id === id);
  if (graffiti) return { item: graffiti, itemType: 'graffiti' as ExpoCommunityItemType };
  return null;
}

function appendMemoryAudit(itemId: string, itemType: ExpoCommunityItemType, action: ExpoCommunityAuditAction, actorLabel: string, note?: string) {
  memoryAudit.push({
    action,
    actorLabel,
    createdAt: new Date().toISOString(),
    id: randomUUID(),
    itemId,
    itemType,
    note: note || undefined,
  });
  trimMemoryStore();
}

function publicEntries() {
  return memoryEntries
    .filter((entry) => isExpoCommunityItemVisible(entry.status, entry.expiresAt))
    .slice(-30)
    .reverse()
    .map(cloneEntry);
}

function publicGraffiti() {
  return memoryGraffiti
    .filter((entry) => isExpoCommunityItemVisible(entry.status, entry.expiresAt))
    .slice(-12)
    .map(cloneGraffiti);
}

const memoryStore: ExpoCommunityStore = {
  async createEntry(entry, audio) {
    const stored = cloneEntry(entry);
    stored.reportCount = 0;
    memoryEntries.push(stored);
    if (audio) memoryAudio.set(stored.id, audio);
    appendMemoryAudit(stored.id, 'entry', 'created', stored.authorLabel);
    trimMemoryStore();
    return cloneEntry(stored);
  },
  async createGraffiti(graffiti) {
    const stored = cloneGraffiti(graffiti);
    stored.reportCount = 0;
    stored.wallSlot = memoryGraffiti.length % 12;
    memoryGraffiti.push(stored);
    appendMemoryAudit(stored.id, 'graffiti', 'created', stored.authorLabel);
    trimMemoryStore();
    return cloneGraffiti(stored);
  },
  async getAudio(id) {
    const entry = memoryEntries.find((candidate) => candidate.id === id && candidate.kind === 'voice');
    const stored = entry ? memoryAudio.get(id) : null;
    return stored && entry ? { ...stored, status: entry.status } : null;
  },
  async listApproved() {
    return { entries: publicEntries(), graffiti: publicGraffiti() };
  },
  async listModeration() {
    return {
      audit: [...memoryAudit].reverse().slice(0, 80).map(cloneAudit),
      entries: [...memoryEntries].reverse().map(cloneEntry),
      graffiti: [...memoryGraffiti].reverse().map(cloneGraffiti),
    };
  },
  async moderate(id, status, moderatorUserId, note) {
    const found = findMemoryItem(id);
    if (!found) return null;
    found.item.status = status;
    if (status === 'removed') found.item.removalReason = note || 'Removed by operator';
    if (status === 'approved') {
      found.item.reportCount = 0;
      found.item.reportedAt = undefined;
      found.item.removalReason = undefined;
    }
    const action: ExpoCommunityAuditAction = status === 'approved' || status === 'rejected' || status === 'removed'
      ? status
      : 'rejected';
    appendMemoryAudit(id, found.itemType, action, moderatorUserId ? `Operator ${moderatorUserId.slice(0, 4)}` : 'Operator', note);
    return { ...found.item };
  },
  persistence: 'process-memory',
  async report(id, report) {
    const found = findMemoryItem(id);
    if (!found || found.item.status === 'removed') return null;
    found.item.reportCount = (found.item.reportCount || 0) + 1;
    found.item.reportedAt = new Date().toISOString();
    if (found.item.status === 'approved' && found.item.reportCount >= EXPO_COMMUNITY_LIMITS.autoReviewReports) {
      found.item.status = 'pending';
    }
    appendMemoryAudit(
      id,
      found.itemType,
      'reported',
      report.reporterLabel,
      [report.reason, report.detail].filter(Boolean).join(': '),
    );
    return { ...found.item };
  },
  resetForTests() {
    memoryEntries.splice(0, memoryEntries.length, { ...seedEntry });
    memoryGraffiti.splice(0);
    memoryAudio.clear();
    memoryAudit.splice(0);
  },
};

function optionalUuid(value?: string) {
  const normalized = String(value || '').trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)
    ? normalized
    : null;
}

function normalizeStatus(value: unknown): ExpoCommunityEntryStatus {
  return value === 'approved' || value === 'rejected' || value === 'removed' ? value : 'pending';
}

function selectEntryColumns() {
  return 'id, kind, status, title, body, author_label, created_at, expires_at, report_count, reported_at, removal_reason';
}

function selectGraffitiColumns() {
  return 'id, status, mark_text, color, logo_url, author_label, wall_slot, placement_x, placement_y, placement_z, placement_rotation_y, placement_normal_x, placement_normal_y, placement_normal_z, placement_host_id, placement_surface_label, created_at, expires_at, report_count, reported_at, removal_reason';
}

function mapEntryRow(row: any): ExpoCommunityEntry {
  return {
    audioUrl: row.kind === 'voice' ? `/api/expo/community/audio/${row.id}` : undefined,
    authorLabel: String(row.author_label || 'Expo visitor'),
    body: String(row.body || ''),
    createdAt: new Date(row.created_at || Date.now()).toISOString(),
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : undefined,
    id: String(row.id),
    kind: row.kind === 'advert' || row.kind === 'voice' ? row.kind : 'message',
    removalReason: row.removal_reason ? String(row.removal_reason) : undefined,
    reportCount: Number.isFinite(Number(row.report_count)) ? Number(row.report_count) : 0,
    reportedAt: row.reported_at ? new Date(row.reported_at).toISOString() : undefined,
    status: normalizeStatus(row.status),
    title: String(row.title || 'Community note'),
  };
}

function mapGraffitiRow(row: any): ExpoCommunityGraffiti {
  return {
    authorLabel: String(row.author_label || 'Expo visitor'),
    color: /^#[0-9a-f]{6}$/i.test(String(row.color || '')) ? String(row.color).toLowerCase() : '#22d3ee',
    createdAt: new Date(row.created_at || Date.now()).toISOString(),
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : undefined,
    id: String(row.id),
    logoUrl: row.logo_url ? String(row.logo_url) : undefined,
    markText: String(row.mark_text || '').slice(0, 12),
    removalReason: row.removal_reason ? String(row.removal_reason) : undefined,
    reportCount: Number.isFinite(Number(row.report_count)) ? Number(row.report_count) : 0,
    reportedAt: row.reported_at ? new Date(row.reported_at).toISOString() : undefined,
    status: normalizeStatus(row.status),
    wallSlot: Number.isFinite(Number(row.wall_slot)) ? Number(row.wall_slot) : 0,
    placement: Number.isFinite(Number(row.placement_x)) && Number.isFinite(Number(row.placement_z))
      ? {
        hostId: row.placement_host_id ? String(row.placement_host_id).slice(0, 80) : undefined,
        normalX: Number.isFinite(Number(row.placement_normal_x)) ? Number(row.placement_normal_x) : undefined,
        normalY: Number.isFinite(Number(row.placement_normal_y)) ? Number(row.placement_normal_y) : undefined,
        normalZ: Number.isFinite(Number(row.placement_normal_z)) ? Number(row.placement_normal_z) : undefined,
        rotationY: Number.isFinite(Number(row.placement_rotation_y)) ? Number(row.placement_rotation_y) : 0,
        surfaceLabel: String(row.placement_surface_label || 'City spot').slice(0, 32),
        x: Number(row.placement_x),
        y: Number.isFinite(Number(row.placement_y)) ? Number(row.placement_y) : 2.6,
        z: Number(row.placement_z),
      }
      : undefined,
  };
}

function mapAuditRow(row: any): ExpoCommunityAuditEvent {
  return {
    action: ['approved', 'created', 'rejected', 'removed', 'reported'].includes(String(row.action))
      ? row.action
      : 'created',
    actorLabel: String(row.actor_label || 'Operator'),
    createdAt: new Date(row.created_at || Date.now()).toISOString(),
    id: String(row.id),
    itemId: String(row.item_id),
    itemType: row.item_type === 'graffiti' ? 'graffiti' : 'entry',
    note: row.note ? String(row.note) : undefined,
  };
}

function assertNoSupabaseError(error: unknown, action: string) {
  if (!error) return;
  const message = error instanceof Error ? error.message : JSON.stringify(error);
  throw new Error(`EXPO_COMMUNITY_STORAGE_${action}_FAILED:${message}`);
}

async function insertSupabaseAudit(
  itemId: string,
  itemType: ExpoCommunityItemType,
  action: ExpoCommunityAuditAction,
  actorLabel: string,
  note?: string,
) {
  const supabase = getSupabase() as any;
  const { error } = await supabase.from(AUDIT_TABLE).insert({
    action,
    actor_label: actorLabel,
    item_id: itemId,
    item_type: itemType,
    note: note || null,
  });
  assertNoSupabaseError(error, 'AUDIT');
}

async function updateSupabaseStatus(
  table: string,
  id: string,
  status: ExpoCommunityEntryStatus,
  moderatorUserId?: string,
  note?: string,
) {
  const supabase = getSupabase() as any;
  const patch = {
    moderated_at: new Date().toISOString(),
    moderated_by: optionalUuid(moderatorUserId),
    removal_reason: status === 'removed' ? note || 'Removed by operator' : null,
    report_count: status === 'approved' ? 0 : undefined,
    reported_at: status === 'approved' ? null : undefined,
    status,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from(table)
    .update(patch)
    .eq('id', id)
    .select(table === ENTRY_TABLE ? selectEntryColumns() : selectGraffitiColumns())
    .maybeSingle();
  assertNoSupabaseError(error, `MODERATE_${table}`);
  return data;
}

async function findSupabaseItem(id: string) {
  const supabase = getSupabase() as any;
  const entryResult = await supabase
    .from(ENTRY_TABLE)
    .select(selectEntryColumns())
    .eq('id', id)
    .maybeSingle();
  assertNoSupabaseError(entryResult.error, 'FIND_ENTRY');
  if (entryResult.data) return { item: mapEntryRow(entryResult.data), itemType: 'entry' as ExpoCommunityItemType, table: ENTRY_TABLE };

  const graffitiResult = await supabase
    .from(GRAFFITI_TABLE)
    .select(selectGraffitiColumns())
    .eq('id', id)
    .maybeSingle();
  assertNoSupabaseError(graffitiResult.error, 'FIND_GRAFFITI');
  if (graffitiResult.data) return { item: mapGraffitiRow(graffitiResult.data), itemType: 'graffiti' as ExpoCommunityItemType, table: GRAFFITI_TABLE };
  return null;
}

const supabaseStore: ExpoCommunityStore = {
  async createEntry(entry, audio) {
    const supabase = getSupabase() as any;
    const { data, error } = await supabase
      .from(ENTRY_TABLE)
      .insert({
        audio_bytes_base64: audio ? audio.buffer.toString('base64') : null,
        audio_content_type: audio?.contentType ?? null,
        author_label: entry.authorLabel,
        body: entry.body,
        created_at: entry.createdAt,
        created_by: optionalUuid(entry.authorUserId),
        expires_at: entry.expiresAt ?? null,
        id: entry.id,
        kind: entry.kind,
        report_count: 0,
        status: entry.status,
        title: entry.title,
      })
      .select(selectEntryColumns())
      .single();
    assertNoSupabaseError(error, 'CREATE_ENTRY');
    await insertSupabaseAudit(entry.id, 'entry', 'created', entry.authorLabel);
    return mapEntryRow(data);
  },
  async createGraffiti(graffiti) {
    const supabase = getSupabase() as any;
    const countResult = await supabase
      .from(GRAFFITI_TABLE)
      .select('id', { count: 'exact', head: true });
    assertNoSupabaseError(countResult.error, 'COUNT_GRAFFITI');
    const wallSlot = (countResult.count ?? 0) % 12;
    const { data, error } = await supabase
      .from(GRAFFITI_TABLE)
      .insert({
        author_label: graffiti.authorLabel,
        color: graffiti.color,
        created_at: graffiti.createdAt,
        created_by: optionalUuid(graffiti.authorUserId),
        expires_at: graffiti.expiresAt ?? null,
        id: graffiti.id,
        logo_url: graffiti.logoUrl ?? null,
        mark_text: graffiti.markText,
        placement_host_id: graffiti.placement?.hostId ?? null,
        placement_normal_x: graffiti.placement?.normalX ?? null,
        placement_normal_y: graffiti.placement?.normalY ?? null,
        placement_normal_z: graffiti.placement?.normalZ ?? null,
        placement_rotation_y: graffiti.placement?.rotationY ?? null,
        placement_surface_label: graffiti.placement?.surfaceLabel ?? null,
        placement_x: graffiti.placement?.x ?? null,
        placement_y: graffiti.placement?.y ?? null,
        placement_z: graffiti.placement?.z ?? null,
        report_count: 0,
        status: graffiti.status,
        wall_slot: wallSlot,
      })
      .select(selectGraffitiColumns())
      .single();
    assertNoSupabaseError(error, 'CREATE_GRAFFITI');
    await insertSupabaseAudit(graffiti.id, 'graffiti', 'created', graffiti.authorLabel);
    return mapGraffitiRow(data);
  },
  async getAudio(id) {
    const supabase = getSupabase() as any;
    const { data, error } = await supabase
      .from(ENTRY_TABLE)
      .select('id, status, kind, audio_content_type, audio_bytes_base64')
      .eq('id', id)
      .eq('kind', 'voice')
      .maybeSingle();
    assertNoSupabaseError(error, 'GET_AUDIO');
    if (!data?.audio_bytes_base64 || !data?.audio_content_type) return null;
    return {
      buffer: Buffer.from(String(data.audio_bytes_base64), 'base64'),
      contentType: String(data.audio_content_type),
      status: normalizeStatus(data.status),
    };
  },
  async listApproved() {
    const supabase = getSupabase() as any;
    const now = new Date().toISOString();
    const entriesResult = await supabase
      .from(ENTRY_TABLE)
      .select(selectEntryColumns())
      .eq('status', 'approved')
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false })
      .limit(30);
    assertNoSupabaseError(entriesResult.error, 'LIST_ENTRIES');
    const graffitiResult = await supabase
      .from(GRAFFITI_TABLE)
      .select(selectGraffitiColumns())
      .eq('status', 'approved')
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false })
      .limit(12);
    assertNoSupabaseError(graffitiResult.error, 'LIST_GRAFFITI');
    return {
      entries: (entriesResult.data || []).map(mapEntryRow),
      graffiti: (graffitiResult.data || []).map(mapGraffitiRow).reverse(),
    };
  },
  async listModeration() {
    const supabase = getSupabase() as any;
    const entriesResult = await supabase
      .from(ENTRY_TABLE)
      .select(selectEntryColumns())
      .order('created_at', { ascending: false })
      .limit(120);
    assertNoSupabaseError(entriesResult.error, 'MODERATION_ENTRIES');
    const graffitiResult = await supabase
      .from(GRAFFITI_TABLE)
      .select(selectGraffitiColumns())
      .order('created_at', { ascending: false })
      .limit(80);
    assertNoSupabaseError(graffitiResult.error, 'MODERATION_GRAFFITI');
    const auditResult = await supabase
      .from(AUDIT_TABLE)
      .select('id, item_id, item_type, action, actor_label, note, created_at')
      .order('created_at', { ascending: false })
      .limit(80);
    assertNoSupabaseError(auditResult.error, 'MODERATION_AUDIT');
    return {
      audit: (auditResult.data || []).map(mapAuditRow),
      entries: (entriesResult.data || []).map(mapEntryRow),
      graffiti: (graffitiResult.data || []).map(mapGraffitiRow),
    };
  },
  async moderate(id, status, moderatorUserId, note) {
    const entryData = await updateSupabaseStatus(ENTRY_TABLE, id, status, moderatorUserId, note);
    if (entryData) {
      await insertSupabaseAudit(id, 'entry', status as ExpoCommunityAuditAction, moderatorUserId ? `Operator ${moderatorUserId.slice(0, 4)}` : 'Operator', note);
      return mapEntryRow(entryData);
    }
    const graffitiData = await updateSupabaseStatus(GRAFFITI_TABLE, id, status, moderatorUserId, note);
    if (graffitiData) {
      await insertSupabaseAudit(id, 'graffiti', status as ExpoCommunityAuditAction, moderatorUserId ? `Operator ${moderatorUserId.slice(0, 4)}` : 'Operator', note);
      return mapGraffitiRow(graffitiData);
    }
    return null;
  },
  persistence: 'supabase',
  async report(id, report) {
    const found = await findSupabaseItem(id);
    if (!found || found.item.status === 'removed') return null;
    const supabase = getSupabase() as any;
    const { error: reportError } = await supabase.from(REPORT_TABLE).insert({
      detail: report.detail || null,
      item_id: id,
      item_type: found.itemType,
      reason: report.reason,
      reporter_id: optionalUuid(report.reporterUserId),
      reporter_label: report.reporterLabel,
    });
    assertNoSupabaseError(reportError, 'REPORT_INSERT');
    const reportCount = (found.item.reportCount || 0) + 1;
    const nextStatus = found.item.status === 'approved' && reportCount >= EXPO_COMMUNITY_LIMITS.autoReviewReports
      ? 'pending'
      : found.item.status;
    const { data, error } = await supabase
      .from(found.table)
      .update({
        report_count: reportCount,
        reported_at: new Date().toISOString(),
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(found.table === ENTRY_TABLE ? selectEntryColumns() : selectGraffitiColumns())
      .single();
    assertNoSupabaseError(error, 'REPORT_UPDATE');
    await insertSupabaseAudit(id, found.itemType, 'reported', report.reporterLabel, [report.reason, report.detail].filter(Boolean).join(': '));
    return found.itemType === 'entry' ? mapEntryRow(data) : mapGraffitiRow(data);
  },
  resetForTests() {
    memoryStore.resetForTests();
  },
};

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production'
    || process.env.APP_ENV === 'production'
    || process.env.VERCEL_ENV === 'production';
}

export function getExpoCommunityStore(): ExpoCommunityStore {
  const mode = String(process.env.EXPO_COMMUNITY_STORAGE || '').trim().toLowerCase();
  if (mode === 'memory') return memoryStore;
  if (mode === 'supabase' || isProductionRuntime()) return supabaseStore;
  return memoryStore;
}

export function resetExpoCommunityStoreForTests() {
  memoryStore.resetForTests();
}
