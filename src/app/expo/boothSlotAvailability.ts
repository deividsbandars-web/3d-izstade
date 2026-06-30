import { serverApiGet, serverApiPost } from '../../services/serverApi.js';

export type BoothSlotBand = 'arrival' | 'showcase' | 'media' | 'discovery';
export type BoothSlotLane = 'left' | 'right' | 'center';
export type BoothSlotKind = 'hero' | 'endcap' | 'standard';
export type BoothSlotStatus = 'available' | 'held' | 'checkout_started' | 'assigned';

export type BoothSlotAvailabilityRecord = {
  band: BoothSlotBand;
  boothType: 'hero' | 'premium' | 'standard';
  heldUntil: string | null;
  kind: BoothSlotKind;
  lane: BoothSlotLane;
  nodeType: string;
  priceCents: number;
  priceLabel: string;
  reservationId: string | null;
  rotationY: number;
  screenClass: 'support' | 'presentation' | 'large-format' | 'landmark';
  slotId: string;
  sponsorTier: 'hero' | 'platinum' | 'gold' | 'silver' | 'standard';
  status: BoothSlotStatus;
  tier: 'common' | 'premium' | 'elite' | 'hero';
  xOffset: number;
  zOffset: number;
};

export type BoothSlotAvailabilityResponse = {
  generatedAt: string;
  slots: BoothSlotAvailabilityRecord[];
};

export type BoothSlotReservationPayload = {
  companyName: string;
  contactEmail?: string;
  metadata?: Record<string, unknown>;
  website?: string;
};

export type BoothSlotReservationResponse = {
  checkout: {
    publishableKey: string | null;
    session_id: string;
    url: string | null;
  };
  reservation: {
    amountCents: number;
    companyName: string;
    currency: string;
    expiresAt: string;
    id: string;
    slotId: string;
    status: string;
  };
  slot: BoothSlotAvailabilityRecord;
};

export async function getBoothSlotAvailability() {
  return serverApiGet<BoothSlotAvailabilityResponse>('/api/expo/booth-slots');
}

export async function reserveBoothSlot(slotId: string, payload: BoothSlotReservationPayload) {
  return serverApiPost<BoothSlotReservationResponse>(
    `/api/expo/booth-slots/${encodeURIComponent(slotId)}/reserve`,
    payload,
  );
}
