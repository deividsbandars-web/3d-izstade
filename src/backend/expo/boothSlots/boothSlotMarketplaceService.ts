import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { getSupabaseAdminClient } from '../../lib/supabaseAdmin.js';

export type BoothSlotBand = 'arrival' | 'showcase' | 'media' | 'discovery';
export type BoothSlotLane = 'left' | 'right' | 'center';
export type BoothSlotKind = 'hero' | 'endcap' | 'standard';
export type BoothSlotCommercialTier = 'common' | 'premium' | 'elite' | 'hero';
export type BoothSlotScreenClass = 'support' | 'presentation' | 'large-format' | 'landmark';
export type BoothSlotStatus = 'available' | 'held' | 'checkout_started' | 'assigned';

export type BoothSlotRecord = {
  band: BoothSlotBand;
  boothType: 'hero' | 'premium' | 'standard';
  kind: BoothSlotKind;
  lane: BoothSlotLane;
  nodeType: string;
  priceCents: number;
  priceLabel: string;
  rotationY: number;
  screenClass: BoothSlotScreenClass;
  slotId: string;
  sponsorTier: 'hero' | 'platinum' | 'gold' | 'silver' | 'standard';
  tier: BoothSlotCommercialTier;
  xOffset: number;
  zOffset: number;
};

export type BoothSlotAvailabilityRecord = BoothSlotRecord & {
  heldUntil: string | null;
  reservationId: string | null;
  status: BoothSlotStatus;
};

export type BoothSlotReservationInput = {
  companyName: unknown;
  contactEmail?: unknown;
  metadata?: Record<string, unknown>;
  slotId: string;
  userEmail?: unknown;
  userId: string;
  website?: unknown;
};

export type BoothSlotCheckoutProduct = {
  amountCents: number;
  currency: string;
  metadata: Record<string, string>;
  mode: 'payment';
  name: string;
  productId: string;
};

type SupabaseStorageClient = {
  from(table: string): any;
};

type ReservationRow = {
  amount_cents: number;
  booth_id?: string | null;
  booth_type: BoothSlotRecord['boothType'];
  commercial_tier: BoothSlotCommercialTier;
  company_id?: string | null;
  company_name: string;
  contact_email?: string | null;
  currency: string;
  expires_at: string;
  id: string;
  screen_class: BoothSlotScreenClass;
  slot_id: string;
  sponsor_tier: BoothSlotRecord['sponsorTier'];
  status: BoothSlotStatus | 'expired' | 'cancelled' | 'payment_failed';
  stripe_session_id?: string | null;
  user_email?: string | null;
  user_id?: string | null;
  website?: string | null;
};

const DEFAULT_CURRENCY = 'eur';
const HOLD_MINUTES = 15;
const ACTIVE_RESERVATION_STATUSES = ['held', 'checkout_started', 'assigned'] as const;
const CHECKOUT_ACTIVE_STATUSES = ['held', 'checkout_started'] as const;
const SLOT_BANK_CANDIDATE_PATHS = [
  path.resolve(process.cwd(), 'docs', 'booth-slot-bank.json'),
  path.resolve(process.cwd(), '..', 'docs', 'booth-slot-bank.json'),
];

let cachedSlotBank: BoothSlotRecord[] | null = null;

export class BoothSlotMarketplaceError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function normalizeOptionalString(value: unknown) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized.length > 0 ? normalized : null;
}

function normalizeRequiredString(value: unknown, code: string, label: string) {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    throw new BoothSlotMarketplaceError(code, `${label} is required.`, 400);
  }

  return normalized;
}

function normalizeEmail(value: unknown) {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    return null;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new BoothSlotMarketplaceError('BOOTH_SLOT_EMAIL_INVALID', 'A valid contact email is required.', 400);
  }

  return normalized;
}

function normalizeWebsite(value: unknown) {
  const normalized = normalizeOptionalString(value);
  if (!normalized) {
    return null;
  }

  try {
    const parsed = new URL(normalized.startsWith('http') ? normalized : `https://${normalized}`);
    return parsed.toString();
  } catch {
    throw new BoothSlotMarketplaceError('BOOTH_SLOT_WEBSITE_INVALID', 'Website must be a valid URL.', 400);
  }
}

function createSlug(value: string, fallback: string) {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
}

function formatPriceLabel(amountCents: number) {
  return new Intl.NumberFormat('lv-LV', {
    currency: 'EUR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amountCents / 100);
}

export function resolveBoothSlotCommercialProfile(
  band: BoothSlotBand,
  kind: BoothSlotKind,
): Pick<BoothSlotRecord, 'boothType' | 'priceCents' | 'priceLabel' | 'screenClass' | 'sponsorTier' | 'tier'> {
  if (kind === 'hero') {
    return {
      boothType: 'hero',
      priceCents: 5_000_000,
      priceLabel: formatPriceLabel(5_000_000),
      screenClass: 'landmark',
      sponsorTier: 'hero',
      tier: 'hero',
    };
  }

  if (kind === 'endcap') {
    return {
      boothType: 'premium',
      priceCents: 1_500_000,
      priceLabel: formatPriceLabel(1_500_000),
      screenClass: 'large-format',
      sponsorTier: 'platinum',
      tier: 'elite',
    };
  }

  if (band === 'arrival') {
    return {
      boothType: 'standard',
      priceCents: 250_000,
      priceLabel: formatPriceLabel(250_000),
      screenClass: 'support',
      sponsorTier: 'standard',
      tier: 'common',
    };
  }

  return {
    boothType: 'premium',
    priceCents: 900_000,
    priceLabel: formatPriceLabel(900_000),
    screenClass: 'presentation',
    sponsorTier: 'gold',
    tier: 'premium',
  };
}

export function flattenBoothSlotBank(rawSlotBank: any): BoothSlotRecord[] {
  const bands = rawSlotBank?.bands && typeof rawSlotBank.bands === 'object' ? rawSlotBank.bands : {};
  const slots: BoothSlotRecord[] = [];

  (Object.keys(bands) as BoothSlotBand[]).forEach((band) => {
    const lanes = bands[band] && typeof bands[band] === 'object' ? bands[band] : {};
    (Object.keys(lanes) as BoothSlotLane[]).forEach((lane) => {
      const kinds = lanes[lane] && typeof lanes[lane] === 'object' ? lanes[lane] : {};
      (Object.keys(kinds) as BoothSlotKind[]).forEach((kind) => {
        const profile = resolveBoothSlotCommercialProfile(band, kind);
        const entries = Array.isArray(kinds[kind]) ? kinds[kind] : [];
        entries.forEach((entry: any) => {
          const slotId = normalizeOptionalString(entry?.slotId);
          if (!slotId) {
            return;
          }

          slots.push({
            band,
            kind,
            lane,
            nodeType: String(entry.nodeType || kind),
            rotationY: Number(entry.rotationY) || 0,
            slotId,
            xOffset: Number(entry.xOffset) || 0,
            zOffset: Number(entry.zOffset) || 0,
            ...profile,
          });
        });
      });
    });
  });

  return slots.sort((left, right) => left.slotId.localeCompare(right.slotId));
}

function readSlotBankFile() {
  const candidatePath = SLOT_BANK_CANDIDATE_PATHS.find((entry) => {
    try {
      readFileSync(entry, 'utf8');
      return true;
    } catch {
      return false;
    }
  });

  if (!candidatePath) {
    throw new BoothSlotMarketplaceError(
      'BOOTH_SLOT_BANK_MISSING',
      'The booth slot bank file is missing from docs/booth-slot-bank.json.',
      500,
    );
  }

  return JSON.parse(readFileSync(candidatePath, 'utf8'));
}

export function listStaticBoothSlots() {
  if (!cachedSlotBank) {
    cachedSlotBank = flattenBoothSlotBank(readSlotBankFile());
  }

  return cachedSlotBank;
}

function getStorageClient(storage?: SupabaseStorageClient) {
  return storage ?? getSupabaseAdminClient();
}

async function expireStaleReservations(storage: SupabaseStorageClient) {
  const { error } = await storage
    .from('booth_slot_reservations')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .in('status', [...CHECKOUT_ACTIVE_STATUSES])
    .lt('expires_at', new Date().toISOString());

  if (error) {
    throw new BoothSlotMarketplaceError('BOOTH_SLOT_EXPIRE_FAILED', error.message || String(error), 500);
  }
}

async function getActiveReservations(storage: SupabaseStorageClient) {
  const { data, error } = await storage
    .from('booth_slot_reservations')
    .select('id,slot_id,status,expires_at,company_name,amount_cents')
    .in('status', [...ACTIVE_RESERVATION_STATUSES]);

  if (error) {
    throw new BoothSlotMarketplaceError('BOOTH_SLOT_RESERVATIONS_LOAD_FAILED', error.message || String(error), 500);
  }

  return (data ?? []) as ReservationRow[];
}

export async function listBoothSlotAvailability(options: { storage?: SupabaseStorageClient } = {}) {
  const storage = getStorageClient(options.storage);
  await expireStaleReservations(storage);
  const activeReservationsBySlot = new Map<string, ReservationRow>();
  (await getActiveReservations(storage)).forEach((reservation) => {
    activeReservationsBySlot.set(String(reservation.slot_id), reservation);
  });

  return listStaticBoothSlots().map<BoothSlotAvailabilityRecord>((slot) => {
    const reservation = activeReservationsBySlot.get(slot.slotId) ?? null;
    return {
      ...slot,
      heldUntil: reservation?.expires_at ?? null,
      reservationId: reservation?.id ?? null,
      status: (reservation?.status as BoothSlotStatus | undefined) ?? 'available',
    };
  });
}

function getSlotById(slotId: string) {
  const normalized = normalizeRequiredString(slotId, 'BOOTH_SLOT_ID_REQUIRED', 'slotId');
  const slot = listStaticBoothSlots().find((entry) => entry.slotId === normalized);
  if (!slot) {
    throw new BoothSlotMarketplaceError('BOOTH_SLOT_NOT_FOUND', 'Requested booth slot was not found.', 404);
  }

  return slot;
}

async function getReservation(storage: SupabaseStorageClient, reservationId: string) {
  const { data, error } = await storage
    .from('booth_slot_reservations')
    .select('*')
    .eq('id', reservationId)
    .maybeSingle();

  if (error) {
    throw new BoothSlotMarketplaceError('BOOTH_SLOT_RESERVATION_LOAD_FAILED', error.message || String(error), 500);
  }
  if (!data) {
    throw new BoothSlotMarketplaceError('BOOTH_SLOT_RESERVATION_NOT_FOUND', 'Booth slot reservation was not found.', 404);
  }

  return data as ReservationRow;
}

export async function createBoothSlotReservation(input: BoothSlotReservationInput, options: { storage?: SupabaseStorageClient } = {}) {
  const storage = getStorageClient(options.storage);
  const slot = getSlotById(input.slotId);
  const companyName = normalizeRequiredString(input.companyName, 'BOOTH_SLOT_COMPANY_REQUIRED', 'Company name');
  const contactEmail = normalizeEmail(input.contactEmail ?? input.userEmail);
  const website = normalizeWebsite(input.website);
  const userId = normalizeRequiredString(input.userId, 'BOOTH_SLOT_USER_REQUIRED', 'Authenticated user id');

  await expireStaleReservations(storage);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000).toISOString();
  const { data, error } = await storage
    .from('booth_slot_reservations')
    .insert({
      amount_cents: slot.priceCents,
      booth_type: slot.boothType,
      commercial_tier: slot.tier,
      company_name: companyName,
      contact_email: contactEmail,
      currency: DEFAULT_CURRENCY,
      expires_at: expiresAt,
      metadata: input.metadata ?? {},
      screen_class: slot.screenClass,
      slot_id: slot.slotId,
      sponsor_tier: slot.sponsorTier,
      status: 'held',
      user_email: normalizeEmail(input.userEmail),
      user_id: userId,
      website,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new BoothSlotMarketplaceError('BOOTH_SLOT_UNAVAILABLE', 'This booth slot is already reserved.', 409);
    }
    throw new BoothSlotMarketplaceError('BOOTH_SLOT_RESERVATION_CREATE_FAILED', error.message || String(error), 500);
  }

  return {
    reservation: data as ReservationRow,
    slot,
  };
}

export async function cancelBoothSlotReservation(reservationId: string, options: { storage?: SupabaseStorageClient } = {}) {
  const storage = getStorageClient(options.storage);
  const { error } = await storage
    .from('booth_slot_reservations')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', reservationId)
    .in('status', [...CHECKOUT_ACTIVE_STATUSES]);

  if (error) {
    throw new BoothSlotMarketplaceError('BOOTH_SLOT_CANCEL_FAILED', error.message || String(error), 500);
  }
}

export async function getBoothSlotCheckoutProduct(
  reservationId: string,
  options: { storage?: SupabaseStorageClient } = {},
): Promise<BoothSlotCheckoutProduct> {
  const storage = getStorageClient(options.storage);
  await expireStaleReservations(storage);
  const reservation = await getReservation(storage, reservationId);
  if (!CHECKOUT_ACTIVE_STATUSES.includes(reservation.status as (typeof CHECKOUT_ACTIVE_STATUSES)[number])) {
    throw new BoothSlotMarketplaceError('BOOTH_SLOT_RESERVATION_INACTIVE', 'This booth slot reservation is no longer active.', 409);
  }

  return {
    amountCents: reservation.amount_cents,
    currency: reservation.currency || DEFAULT_CURRENCY,
    metadata: {
      booth_slot_id: reservation.slot_id,
      booth_slot_reservation_id: reservation.id,
      commercial_tier: reservation.commercial_tier,
      company_name: reservation.company_name,
      screen_class: reservation.screen_class,
    },
    mode: 'payment',
    name: `Web3D Expo ${reservation.commercial_tier} booth slot`,
    productId: reservation.id,
  };
}

export async function markBoothSlotCheckoutStarted(
  reservationId: string,
  stripeSessionId: string,
  options: { storage?: SupabaseStorageClient } = {},
) {
  const storage = getStorageClient(options.storage);
  const { error } = await storage
    .from('booth_slot_reservations')
    .update({
      status: 'checkout_started',
      stripe_session_id: stripeSessionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .in('status', [...CHECKOUT_ACTIVE_STATUSES]);

  if (error) {
    throw new BoothSlotMarketplaceError('BOOTH_SLOT_CHECKOUT_MARK_FAILED', error.message || String(error), 500);
  }
}

function pickSectorIdForSlot(slotId: string) {
  const band = slotId.split('-')[0];
  const indexByBand: Record<string, number> = {
    arrival: 0,
    showcase: 1,
    media: 2,
    discovery: 3,
  };

  return indexByBand[band] ?? 0;
}

async function resolveSectorIdForReservation(storage: SupabaseStorageClient, reservation: ReservationRow) {
  const { data, error } = await storage
    .from('sectors')
    .select('id,name')
    .order('created_at', { ascending: true });

  if (error) {
    throw new BoothSlotMarketplaceError('BOOTH_SLOT_SECTOR_LOAD_FAILED', error.message || String(error), 500);
  }

  const sectors = (data ?? []) as Array<{ id: string; name?: string | null }>;
  if (sectors.length === 0) {
    return null;
  }

  return sectors[Math.min(pickSectorIdForSlot(reservation.slot_id), sectors.length - 1)]?.id ?? sectors[0].id;
}

async function insertPaidCompany(storage: SupabaseStorageClient, reservation: ReservationRow) {
  const slug = `${createSlug(reservation.company_name, 'sponsor')}-${reservation.id.slice(0, 8)}`;
  const sectorId = await resolveSectorIdForReservation(storage, reservation);
  const { data, error } = await storage
    .from('companies')
    .insert({
      booking_url: reservation.website ?? null,
      booth_type: reservation.booth_type,
      contact_email: reservation.contact_email ?? reservation.user_email ?? null,
      description: `Self-serve sponsor booth reserved for ${reservation.slot_id}.`,
      is_active: true,
      name: reservation.company_name,
      priority: reservation.sponsor_tier === 'hero' ? 100 : reservation.sponsor_tier === 'platinum' ? 85 : reservation.sponsor_tier === 'gold' ? 70 : 45,
      sector_id: sectorId,
      slug,
      sponsor_tier: reservation.sponsor_tier,
      tagline: `Reserved ${reservation.commercial_tier} Web3D expo booth.`,
      tier: reservation.commercial_tier,
      website: reservation.website ?? null,
    })
    .select('*')
    .single();

  if (error) {
    throw new BoothSlotMarketplaceError('BOOTH_SLOT_COMPANY_CREATE_FAILED', error.message || String(error), 500);
  }

  return data as { id: string; slug?: string | null };
}

async function insertPaidBooth(storage: SupabaseStorageClient, reservation: ReservationRow, companyId: string) {
  const { data, error } = await storage
    .from('booths')
    .insert({
      booth_type: reservation.booth_type,
      company_id: companyId,
      cta_label: 'Book meeting',
      images: [],
      marketplace_reservation_id: reservation.id,
      products: [],
      services: [],
      slot_id: reservation.slot_id,
    })
    .select('*')
    .single();

  if (error) {
    throw new BoothSlotMarketplaceError('BOOTH_SLOT_BOOTH_CREATE_FAILED', error.message || String(error), 500);
  }

  return data as { id: string };
}

export async function finalizePaidBoothSlotReservation(
  payload: {
    amountCents: number | null;
    currency: string | null;
    reservationId: string;
    stripeSessionId: string;
  },
  options: { storage?: SupabaseStorageClient } = {},
) {
  const storage = getStorageClient(options.storage);
  const reservation = await getReservation(storage, payload.reservationId);

  if (reservation.status === 'assigned' && reservation.company_id && reservation.booth_id) {
    return reservation;
  }

  if (!CHECKOUT_ACTIVE_STATUSES.includes(reservation.status as (typeof CHECKOUT_ACTIVE_STATUSES)[number])) {
    throw new BoothSlotMarketplaceError('BOOTH_SLOT_RESERVATION_INACTIVE', 'This booth slot reservation is no longer active.', 409);
  }

  const company = reservation.company_id
    ? { id: reservation.company_id }
    : await insertPaidCompany(storage, reservation);
  const booth = reservation.booth_id
    ? { id: reservation.booth_id }
    : await insertPaidBooth(storage, reservation, company.id);

  const { data, error } = await storage
    .from('booth_slot_reservations')
    .update({
      amount_cents: payload.amountCents ?? reservation.amount_cents,
      assigned_at: new Date().toISOString(),
      booth_id: booth.id,
      company_id: company.id,
      currency: payload.currency ?? reservation.currency ?? DEFAULT_CURRENCY,
      paid_at: new Date().toISOString(),
      status: 'assigned',
      stripe_session_id: payload.stripeSessionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservation.id)
    .select('*')
    .single();

  if (error) {
    throw new BoothSlotMarketplaceError('BOOTH_SLOT_ASSIGNMENT_FAILED', error.message || String(error), 500);
  }

  return data as ReservationRow;
}
