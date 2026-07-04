export type ReleaseRouteStatus = 'ship' | 'internal' | 'demo-only';

export type ReleaseRouteOwnershipEntry = {
  notes: string;
  path: string;
  status: ReleaseRouteStatus;
};

export type ReleaseNavItem = {
  icon: string;
  label: string;
  path: string;
};

export const RELEASE_OPERATOR_FALLBACK_PATH = '/expo-3d';

export const RELEASE_PRIMARY_NAV_ITEMS: ReleaseNavItem[] = [
  { icon: '3D', label: 'LIVE EXPO', path: '/expo-3d' },
  { icon: 'SP', label: 'SPONSORS', path: '/expo/sponsor-packages' },
  { icon: 'BT', label: 'BOOTHS', path: '/expo/booth-marketplace' },
  { icon: 'HM', label: 'GALA STUDIO', path: '/modular-homes/studio' },
  { icon: 'CALC', label: 'CALCULATORS', path: '/calculators' },
];

export const RELEASE_UTILITY_NAV_ITEMS: ReleaseNavItem[] = [
  { icon: 'SETUP', label: 'SPONSOR SETUP', path: '/expo/admin' },
  { icon: 'LEADS', label: 'LEAD INBOX', path: '/expo/sponsor-leads' },
];

export const RELEASE_ROUTE_OWNERSHIP: ReleaseRouteOwnershipEntry[] = [
  { notes: 'Public entry.', path: '/', status: 'ship' },
  { notes: 'Canonical Web3D expo route.', path: '/expo-3d', status: 'ship' },
  { notes: 'Redirects to /expo-3d.', path: '/expo', status: 'ship' },
  { notes: 'Sponsor/company admin flow.', path: '/expo/admin', status: 'ship' },
  { notes: 'City screen rental catalog.', path: '/expo/city-screens', status: 'ship' },
  { notes: 'Sponsor lead-generation package page.', path: '/expo/sponsor-packages', status: 'ship' },
  { notes: 'Sponsor lead inbox.', path: '/expo/sponsor-leads', status: 'ship' },
  { notes: 'Booth marketplace surface.', path: '/expo/booth-marketplace', status: 'ship' },
  { notes: 'GALA modular-home lead-generation studio.', path: '/modular-homes/studio', status: 'ship' },
  { notes: 'Calculators lead-generation hub.', path: '/calculators', status: 'ship' },
  { notes: 'Calculator lead inbox.', path: '/calculators/leads', status: 'internal' },
  { notes: 'Backoffice/platform dashboard.', path: '/platform/dashboard', status: 'internal' },
  { notes: 'Backoffice/platform lead ops.', path: '/platform/leads', status: 'internal' },
  { notes: 'Backoffice/platform marketplace.', path: '/platform/marketplace', status: 'internal' },
  { notes: 'Backoffice/platform expo dashboard.', path: '/platform/expo', status: 'internal' },
  { notes: 'Backoffice onboarding.', path: '/onboarding', status: 'internal' },
  { notes: 'Internal workflow builder.', path: '/workflows', status: 'internal' },
  { notes: 'Legacy dashboard route.', path: '/dashboard', status: 'internal' },
  { notes: 'Legacy city map route.', path: '/city-map', status: 'internal' },
  { notes: 'Legacy project builder route.', path: '/projects', status: 'internal' },
  { notes: 'Legacy client dashboard route.', path: '/clients', status: 'internal' },
  { notes: 'Legacy inventory manager route.', path: '/inventory', status: 'internal' },
  { notes: 'Legacy marketplace route.', path: '/marketplace', status: 'internal' },
  { notes: 'Legacy urgent services route.', path: '/urgent-services', status: 'internal' },
  { notes: 'Legacy events route.', path: '/events', status: 'internal' },
  { notes: 'Legacy ads network route.', path: '/ads-network', status: 'internal' },
  { notes: 'Legacy finance admin route.', path: '/finances', status: 'internal' },
  { notes: 'Legacy leaderboard route.', path: '/leaderboard', status: 'internal' },
  { notes: 'Legacy client portal route.', path: '/my-portal', status: 'internal' },
  { notes: 'Legacy finance studio route.', path: '/studio', status: 'internal' },
  { notes: 'Legacy YouTube manager route.', path: '/youtube', status: 'internal' },
  { notes: 'Legacy document hub route.', path: '/documents', status: 'internal' },
  { notes: 'Legacy settings route.', path: '/settings', status: 'internal' },
  { notes: 'Legacy sector detail route.', path: '/sector', status: 'internal' },
  { notes: 'Demo economy simulator route.', path: '/economy-simulator', status: 'demo-only' },
  { notes: 'Demo business fleet route.', path: '/business-fleet', status: 'demo-only' },
  { notes: 'Demo business economy route.', path: '/business-economy', status: 'demo-only' },
  { notes: 'Demo autonomous engine route.', path: '/autonomous-engine', status: 'demo-only' },
  { notes: 'Demo prototype route.', path: '/prototype', status: 'demo-only' },
  { notes: 'Demo platform agents route.', path: '/platform/agents', status: 'demo-only' },
  { notes: 'Demo AI generator route.', path: '/generator', status: 'demo-only' },
  { notes: 'Demo content generator route.', path: '/content-generator', status: 'demo-only' },
  { notes: 'Demo business accelerator route.', path: '/akcelerators', status: 'demo-only' },
  { notes: 'Demo AI agent route.', path: '/ai-agent', status: 'demo-only' },
  { notes: 'Demo AI matchmaker route.', path: '/ai-matchmaker', status: 'demo-only' },
];

const LOGIN_NEXT_ROUTES = [
  '/expo/admin',
  '/expo/sponsor-leads',
  '/modular-homes/quotes',
] as const;

export function buildReleaseLoginHref(pathname: string) {
  const normalizedPathname = pathname || '/';
  const matchedNextRoute = LOGIN_NEXT_ROUTES.find((path) => (
    normalizedPathname === path || normalizedPathname.startsWith(`${path}/`)
  ));

  return matchedNextRoute ? `/login?next=${matchedNextRoute}` : '/login';
}

export function getReleaseRouteOwnership(pathname: string) {
  const normalizedPathname = pathname || '/';
  return [...RELEASE_ROUTE_OWNERSHIP]
    .sort((left, right) => right.path.length - left.path.length)
    .find((entry) => (
      normalizedPathname === entry.path || normalizedPathname.startsWith(`${entry.path}/`)
    )) ?? null;
}

export function hasExplicitOperatorMode(search: string) {
  const normalizedSearch = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(normalizedSearch);
  return params.get('operator') === '1';
}

export function canOpenReleaseRoute(
  pathname: string,
  search = '',
  options: { demoRoutesEnabled?: boolean } = {},
) {
  const ownership = getReleaseRouteOwnership(pathname);
  if (!ownership || ownership.status === 'ship') {
    return true;
  }

  const operatorMode = hasExplicitOperatorMode(search);
  if (ownership.status === 'internal') {
    return operatorMode;
  }

  return Boolean(options.demoRoutesEnabled && operatorMode);
}
