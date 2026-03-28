import type { BoothType, ExpoSceneSector, SponsorTier } from '../types/scene';

export type ExpoPlacementNodeType =
  | 'arrival'
  | 'hero_left'
  | 'hero_right'
  | 'standard_left'
  | 'standard_right'
  | 'endcap'
  | 'sector_gateway';

export type BoulevardCompany = {
  boothType?: BoothType | null;
  id: string;
  name?: string | null;
  priority?: number | null;
  sectorId?: string | null;
  sector_id?: string | null;
  sponsorTier?: SponsorTier | null;
};

export type BoulevardSector = Pick<ExpoSceneSector, 'color_theme' | 'id' | 'name'>;

export type SponsorBoulevardNode = {
  clusterIndex: number;
  color: string;
  companyId?: string;
  id: string;
  nodeType: ExpoPlacementNodeType;
  position: [number, number, number];
  priority: number;
  rotation: [number, number, number];
  sectorId: string | null;
  sectorLabel: string;
  sponsorTier?: SponsorTier;
};

export type RankedBoulevardCompany = {
  boothType: BoothType;
  company: BoulevardCompany;
  id: string;
  indexWithinSector: number;
  name: string;
  priority: number;
  sectorId: string | null;
  sectorLabel: string;
  sectorOrder: number;
  sponsorTier: SponsorTier;
};

export type SponsorBoulevardPlan = {
  arrivalNode: SponsorBoulevardNode;
  companyOrder: RankedBoulevardCompany[];
  footprint: {
    maxX: number;
    maxZ: number;
    minX: number;
    minZ: number;
  };
  nodes: SponsorBoulevardNode[];
  sectorGateways: SponsorBoulevardNode[];
};

export const EXPO_BOULEVARD_LAYOUT = {
  arrivalZ: 8,
  endcapX: 66,
  gatewayX: 92,
  gatewayZOffset: 10,
  heroX: 46,
  heroZOffset: 26,
  laneMarginX: 36,
  playBoundsPaddingX: 30,
  playBoundsPaddingZ: 34,
  sectorClusterDepth: 138,
  standardX: 32,
  standardZStartOffset: 58,
  standardZStep: 30,
} as const;

const SPONSOR_TIER_WEIGHT: Record<SponsorTier, number> = {
  hero: 6,
  platinum: 5,
  gold: 4,
  silver: 3,
  bronze: 2,
  standard: 1,
};

export const UNASSIGNED_SECTOR_ID = '__unassigned__';
export const UNASSIGNED_SECTOR_LABEL = 'Unassigned Sponsors';

function normalizePriority(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeSponsorTier(value: unknown): SponsorTier {
  switch (String(value || '').trim().toLowerCase()) {
    case 'hero':
    case 'platinum':
    case 'gold':
    case 'silver':
    case 'bronze':
      return String(value).trim().toLowerCase() as SponsorTier;
    default:
      return 'standard';
  }
}

export function normalizeBoothType(value: unknown, sponsorTier: SponsorTier): BoothType {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'hero' || normalized === 'premium' || normalized === 'standard' || normalized === 'poster') {
    return normalized as BoothType;
  }

  if (sponsorTier === 'hero') {
    return 'hero';
  }

  if (sponsorTier === 'platinum' || sponsorTier === 'gold') {
    return 'premium';
  }

  return 'standard';
}

export function compareRankedCompanies(left: RankedBoulevardCompany, right: RankedBoulevardCompany) {
  const byPriority = right.priority - left.priority;
  if (byPriority !== 0) {
    return byPriority;
  }

  const byTier = SPONSOR_TIER_WEIGHT[right.sponsorTier] - SPONSOR_TIER_WEIGHT[left.sponsorTier];
  if (byTier !== 0) {
    return byTier;
  }

  const bySector = left.sectorOrder - right.sectorOrder;
  if (bySector !== 0) {
    return bySector;
  }

  return left.name.localeCompare(right.name);
}

export function rankCompaniesForBoulevard(
  companies: BoulevardCompany[],
  sectors: BoulevardSector[]
): RankedBoulevardCompany[] {
  const sectorOrder = new Map<string, number>();
  sectors.forEach((sector, index) => {
    sectorOrder.set(String(sector.id), index);
  });

  const ranked = companies.map((company) => {
    const sponsorTier = normalizeSponsorTier(company.sponsorTier);
    const boothType = normalizeBoothType(company.boothType, sponsorTier);
    const rawSectorId = company.sector_id ?? company.sectorId ?? null;
    const sectorId = rawSectorId ? String(rawSectorId) : null;
    const sector = sectorId ? sectors.find((entry) => String(entry.id) === sectorId) : undefined;

    return {
      boothType,
      company,
      id: String(company.id),
      indexWithinSector: 0,
      name: String(company.name || ''),
      priority: normalizePriority(company.priority),
      sectorId: sector?.id ? String(sector.id) : sectorId ?? UNASSIGNED_SECTOR_ID,
      sectorLabel: sector?.name ? String(sector.name) : UNASSIGNED_SECTOR_LABEL,
      sectorOrder: sector ? (sectorOrder.get(String(sector.id)) ?? Number.MAX_SAFE_INTEGER - 1) : Number.MAX_SAFE_INTEGER,
      sponsorTier,
    };
  }).sort(compareRankedCompanies);

  const bySectorIndex = new Map<string, number>();
  return ranked.map((entry) => {
    const key = entry.sectorId ?? UNASSIGNED_SECTOR_ID;
    const indexWithinSector = bySectorIndex.get(key) ?? 0;
    bySectorIndex.set(key, indexWithinSector + 1);
    return {
      ...entry,
      indexWithinSector,
    };
  });
}

function createGatewayNode(sectorId: string | null, sectorLabel: string, color: string, side: 'left' | 'right', z: number): SponsorBoulevardNode {
  return {
    clusterIndex: -1,
    color,
    id: `gateway-${sectorId || UNASSIGNED_SECTOR_ID}-${side}`,
    nodeType: 'sector_gateway',
    position: [side === 'left' ? -EXPO_BOULEVARD_LAYOUT.gatewayX : EXPO_BOULEVARD_LAYOUT.gatewayX, 0, z],
    priority: 0,
    rotation: [0, side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0],
    sectorId,
    sectorLabel,
  };
}

function createCompanyNode(
  company: RankedBoulevardCompany,
  nodeType: Exclude<ExpoPlacementNodeType, 'arrival' | 'sector_gateway'>,
  color: string,
  x: number,
  z: number,
  rotationY: number
): SponsorBoulevardNode {
  return {
    clusterIndex: 0,
    color,
    companyId: company.id,
    id: `${nodeType}-${company.id}`,
    nodeType,
    position: [x, 0, z],
    priority: company.priority,
    rotation: [0, rotationY, 0],
    sectorId: company.sectorId,
    sectorLabel: company.sectorLabel,
    sponsorTier: company.sponsorTier,
  };
}

export function buildSponsorBoulevardPlan(
  companies: BoulevardCompany[],
  sectors: BoulevardSector[]
): SponsorBoulevardPlan {
  const rankedCompanies = rankCompaniesForBoulevard(companies, sectors);
  const sectorColorById = new Map<string, string>();
  const sectorLabelById = new Map<string, string>();
  sectors.forEach((sector) => {
    sectorColorById.set(String(sector.id), sector.color_theme || '#3b82f6');
    sectorLabelById.set(String(sector.id), String(sector.name || UNASSIGNED_SECTOR_LABEL));
  });

  const sectorGroups = new Map<string, RankedBoulevardCompany[]>();
  rankedCompanies.forEach((company) => {
    const key = company.sectorId ?? UNASSIGNED_SECTOR_ID;
    const group = sectorGroups.get(key) ?? [];
    group.push(company);
    sectorGroups.set(key, group);
  });

  const orderedSectorKeys = [
    ...sectors.map((sector) => String(sector.id)),
    ...(sectorGroups.has(UNASSIGNED_SECTOR_ID) ? [UNASSIGNED_SECTOR_ID] : []),
  ];

  const nodes: SponsorBoulevardNode[] = [];
  const sectorGateways: SponsorBoulevardNode[] = [];
  const arrivalNode: SponsorBoulevardNode = {
    clusterIndex: -1,
    color: '#38bdf8',
    id: 'arrival-main',
    nodeType: 'arrival',
    position: [0, 0, EXPO_BOULEVARD_LAYOUT.arrivalZ],
    priority: 0,
    rotation: [0, 0, 0],
    sectorId: null,
    sectorLabel: 'Arrival Plaza',
  };

  nodes.push(arrivalNode);

  orderedSectorKeys.forEach((sectorKey, sectorIndex) => {
    const group = sectorGroups.get(sectorKey) ?? [];
    const sectorLabel = sectorKey === UNASSIGNED_SECTOR_ID
      ? UNASSIGNED_SECTOR_LABEL
      : (sectorLabelById.get(sectorKey) ?? group[0]?.sectorLabel ?? UNASSIGNED_SECTOR_LABEL);
    const color = sectorColorById.get(sectorKey) || '#3b82f6';
    const clusterBaseZ = -18 - sectorIndex * EXPO_BOULEVARD_LAYOUT.sectorClusterDepth;

    const leftGateway = createGatewayNode(
      sectorKey === UNASSIGNED_SECTOR_ID ? null : sectorKey,
      sectorLabel,
      color,
      'left',
      clusterBaseZ - EXPO_BOULEVARD_LAYOUT.gatewayZOffset
    );
    leftGateway.clusterIndex = sectorIndex;
    const rightGateway = createGatewayNode(
      sectorKey === UNASSIGNED_SECTOR_ID ? null : sectorKey,
      sectorLabel,
      color,
      'right',
      clusterBaseZ - EXPO_BOULEVARD_LAYOUT.gatewayZOffset
    );
    rightGateway.clusterIndex = sectorIndex;
    nodes.push(leftGateway, rightGateway);
    sectorGateways.push(leftGateway, rightGateway);

    const heroCompanies = group.filter((company) => company.sponsorTier === 'hero' || company.boothType === 'hero');
    const heroPrimary = heroCompanies.slice(0, 2);
    const heroOverflow = heroCompanies.slice(2);
    const premiumCompanies = [
      ...heroOverflow,
      ...group.filter((company) => !heroCompanies.includes(company) && (company.boothType === 'premium' || company.sponsorTier === 'platinum' || company.sponsorTier === 'gold')),
    ];
    const standardCompanies = group.filter((company) => !heroCompanies.includes(company) && !premiumCompanies.includes(company));

    const heroLeft = heroPrimary[0];
    const heroRight = heroPrimary[1];
    if (heroLeft) {
      nodes.push(createCompanyNode(
        heroLeft,
        'hero_left',
        color,
        -EXPO_BOULEVARD_LAYOUT.heroX,
        clusterBaseZ - EXPO_BOULEVARD_LAYOUT.heroZOffset,
        Math.PI / 2
      ));
      nodes[nodes.length - 1].clusterIndex = sectorIndex;
    }
    if (heroRight) {
      nodes.push(createCompanyNode(
        heroRight,
        'hero_right',
        color,
        EXPO_BOULEVARD_LAYOUT.heroX,
        clusterBaseZ - EXPO_BOULEVARD_LAYOUT.heroZOffset,
        -Math.PI / 2
      ));
      nodes[nodes.length - 1].clusterIndex = sectorIndex;
    }

    premiumCompanies.forEach((company, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      const row = Math.floor(index / 2);
      nodes.push(createCompanyNode(
        company,
        'endcap',
        color,
        side * EXPO_BOULEVARD_LAYOUT.endcapX,
        clusterBaseZ - 44 - row * EXPO_BOULEVARD_LAYOUT.standardZStep,
        side < 0 ? Math.PI / 2 : -Math.PI / 2
      ));
      nodes[nodes.length - 1].clusterIndex = sectorIndex;
    });

    standardCompanies.forEach((company, index) => {
      const isLeft = index % 2 === 0;
      const row = Math.floor(index / 2);
      nodes.push(createCompanyNode(
        company,
        isLeft ? 'standard_left' : 'standard_right',
        color,
        isLeft ? -EXPO_BOULEVARD_LAYOUT.standardX : EXPO_BOULEVARD_LAYOUT.standardX,
        clusterBaseZ - EXPO_BOULEVARD_LAYOUT.standardZStartOffset - row * EXPO_BOULEVARD_LAYOUT.standardZStep,
        isLeft ? Math.PI / 2 : -Math.PI / 2
      ));
      nodes[nodes.length - 1].clusterIndex = sectorIndex;
    });
  });

  const footprintXs = nodes.map((node) => node.position[0]);
  const footprintZs = nodes.map((node) => node.position[2]);

  return {
    arrivalNode,
    companyOrder: rankedCompanies,
    footprint: {
      maxX: Math.max(...footprintXs) + EXPO_BOULEVARD_LAYOUT.laneMarginX,
      maxZ: Math.max(...footprintZs) + EXPO_BOULEVARD_LAYOUT.playBoundsPaddingZ,
      minX: Math.min(...footprintXs) - EXPO_BOULEVARD_LAYOUT.laneMarginX,
      minZ: Math.min(...footprintZs) - EXPO_BOULEVARD_LAYOUT.playBoundsPaddingZ,
    },
    nodes,
    sectorGateways,
  };
}
