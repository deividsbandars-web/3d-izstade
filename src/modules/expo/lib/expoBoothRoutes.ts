function normalizeRouteToken(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function pickExpoBoothRouteToken(companyId: string | null | undefined, companySlug?: string | null) {
  return normalizeRouteToken(companySlug) ?? normalizeRouteToken(companyId);
}

export function buildExpoBoothRoute(args: {
  companyId: string | null | undefined;
  companySlug?: string | null;
  stream?: boolean;
}) {
  const token = pickExpoBoothRouteToken(args.companyId, args.companySlug);
  if (!token) {
    return null;
  }

  return args.stream
    ? `/expo/booth/${token}/stream`
    : `/expo/booth/${token}`;
}

export function buildExpoBoothWeb3DRoomRoute(route: string) {
  return route.replace(/\/stream$/, '');
}
