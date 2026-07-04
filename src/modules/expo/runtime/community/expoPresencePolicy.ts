export type ExpoPresenceGuest = {
  color: string;
  id: string;
  isSpeaking: boolean;
  position: [number, number, number];
};

const SAFE_COLOR = /^#[0-9a-f]{6}$/i;

function clamp(value: unknown, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : 0;
}

export function normalizeExpoPresenceGuest(value: unknown): ExpoPresenceGuest | null {
  const record = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const position = Array.isArray(record.position) ? record.position : [];
  const id = String(record.id || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 40);
  if (!id || position.length < 3) return null;

  return {
    color: SAFE_COLOR.test(String(record.color || '')) ? String(record.color).toLowerCase() : '#38bdf8',
    id,
    isSpeaking: record.isSpeaking === true,
    position: [
      clamp(position[0], -1600, 1600),
      clamp(position[1], -10, 500),
      clamp(position[2], -1600, 1600),
    ],
  };
}

export function normalizeExpoPresenceGuests(values: unknown[], limit = 24) {
  const unique = new Map<string, ExpoPresenceGuest>();
  values.forEach((value) => {
    const guest = normalizeExpoPresenceGuest(value);
    if (guest && !unique.has(guest.id) && unique.size < limit) unique.set(guest.id, guest);
  });
  return [...unique.values()];
}

export function getExpoVisibleGuestLimit(quality: 'high' | 'low' | 'medium') {
  if (quality === 'high') return 20;
  if (quality === 'medium') return 12;
  return 6;
}
