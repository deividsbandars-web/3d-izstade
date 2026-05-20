export const GENERATED_BILLBOARD_PREFIX = 'generated-billboard:';

export type GeneratedBillboardPayload = {
  accentColor?: string;
  aspect?: number;
  chip?: string;
  label?: string;
  subtitle?: string;
  tier?: string;
  tierAccent?: string;
};

export function buildGeneratedBillboardTextureUrl(payload: GeneratedBillboardPayload) {
  return `${GENERATED_BILLBOARD_PREFIX}${encodeURIComponent(JSON.stringify(payload))}`;
}

export function isGeneratedBillboardTextureUrl(url: string) {
  return url.startsWith(GENERATED_BILLBOARD_PREFIX);
}

export function parseGeneratedBillboardPayload(url: string): GeneratedBillboardPayload | null {
  if (!isGeneratedBillboardTextureUrl(url)) {
    return null;
  }

  try {
    const rawPayload = decodeURIComponent(url.slice(GENERATED_BILLBOARD_PREFIX.length));
    return JSON.parse(rawPayload) as GeneratedBillboardPayload;
  } catch {
    return null;
  }
}
