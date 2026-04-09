import type { BoothType, ExpoSceneSector, SponsorTier } from '../types/scene';

export type ExpoPlacementNodeType =
  | 'arrival'
  | 'anchor_plaza'
  | 'connector_corridor'
  | 'side_lane_node'
  | 'hero_forecourt'
  | 'programmed_filler'
  | 'hero_left'
  | 'hero_right'
  | 'standard_left'
  | 'standard_right'
  | 'endcap'
  | 'sector_gateway';

export type ExpoDistrictProgramRole =
  | 'arrival_anchor'
  | 'connector_left'
  | 'connector_right'
  | 'side_lane_left'
  | 'side_lane_right'
  | 'hero_forecourt_left'
  | 'hero_forecourt_right'
  | 'info_pavilion'
  | 'networking_lounge'
  | 'demo_stage'
  | 'meeting_pod'
  | 'scenic_showcase';

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
  functionalRole?: ExpoDistrictProgramRole;
  id: string;
  nodeType: ExpoPlacementNodeType;
  position: [number, number, number];
  priority: number;
  rotation: [number, number, number];
  sectorId: string | null;
  sectorLabel: string;
  sponsorTier?: SponsorTier;
};

export type SponsorDistrictProgramQuota = {
  allocated: number;
  target: number;
  role: ExpoDistrictProgramRole;
};

export type ExpoDistrictSupportLevel =
  | 'empty'
  | 'single-booth'
  | 'supported'
  | 'hero-supported';

export type ExpoDistrictExpressionMode =
  | 'active-commercial'
  | 'calm-dwell'
  | 'scenic'
  | 'orientation'
  | 'satellite'
  | 'feature-court';

export type ExpoDistrictDowngradeReason =
  | 'empty-sector'
  | 'single-booth-no-active-floor'
  | 'insufficient-support-floor'
  | 'calm-program-suppression'
  | null;

export type SponsorBoulevardDistrict = {
  authoredMomentCount: number;
  clusterIndex: number;
  color: string;
  companyCounts: {
    hero: number;
    premium: number;
    standard: number;
    total: number;
  };
  depth: number;
  downgradeReason: ExpoDistrictDowngradeReason;
  expressionMode: ExpoDistrictExpressionMode;
  frontageIntensity: 0 | 1 | 2 | 3;
  frontagePackage: {
    hasGroundEngagement: boolean;
    hasPrimaryScreenPlane: boolean;
    hasSecondarySupport: boolean;
  };
  isCommerciallyEligible: boolean;
  programNodeIds: string[];
  programTargets: SponsorDistrictProgramQuota[];
  sectorId: string | null;
  sectorLabel: string;
  sponsorBackedFrontCount: number;
  supportLevel: ExpoDistrictSupportLevel;
  supportingNodeCount: number;
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
  districts: SponsorBoulevardDistrict[];
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
  arrivalZ: 20,
  anchorPlazaDepth: 84,
  clusterGapDepth: 212,
  connectorX: 214,
  connectorZOffset: 78,
  endcapX: 346,
  emptySectorDepth: 192,
  gatewayX: 548,
  gatewayZOffset: 34,
  heroX: 276,
  heroZOffset: 138,
  heroForecourtDepth: 54,
  programmedFillerX: 516,
  programmedFillerZOffset: 146,
  sectorPlazaWidthX: 468,
  laneMarginX: 428,
  playBoundsPaddingX: 320,
  playBoundsPaddingZ: 236,
  sectorClusterDepth: 592,
  sectorGatewayOnlyDepth: 132,
  sideLaneX: 334,
  sideLaneZOffset: 58,
  standardX: 286,
  standardZStartOffset: 318,
  standardZStep: 146,
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
  nodeType: Exclude<ExpoPlacementNodeType, 'arrival' | 'sector_gateway' | 'anchor_plaza' | 'connector_corridor' | 'side_lane_node' | 'hero_forecourt' | 'programmed_filler'>,
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

function createProgrammedNode({
  clusterIndex,
  color,
  functionalRole,
  id,
  nodeType,
  position,
  rotationY,
  sectorId,
  sectorLabel,
}: {
  clusterIndex: number;
  color: string;
  functionalRole: ExpoDistrictProgramRole;
  id: string;
  nodeType: Extract<ExpoPlacementNodeType, 'anchor_plaza' | 'connector_corridor' | 'side_lane_node' | 'hero_forecourt' | 'programmed_filler'>;
  position: [number, number, number];
  rotationY?: number;
  sectorId: string | null;
  sectorLabel: string;
}): SponsorBoulevardNode {
  return {
    clusterIndex,
    color,
    functionalRole,
    id,
    nodeType,
    position,
    priority: 0,
    rotation: [0, rotationY ?? 0, 0],
    sectorId,
    sectorLabel,
  };
}

function createProgramQuota(role: ExpoDistrictProgramRole, target: number): SponsorDistrictProgramQuota {
  return { allocated: 0, role, target };
}

function buildDistrictProgramTargets({
  heroCount,
  premiumCount,
  standardCount,
}: {
  heroCount: number;
  premiumCount: number;
  standardCount: number;
}) {
  const total = heroCount + premiumCount + standardCount;
  const targets: SponsorDistrictProgramQuota[] = [
    createProgramQuota('arrival_anchor', 1),
    createProgramQuota('connector_left', 1),
    createProgramQuota('connector_right', 1),
    createProgramQuota('side_lane_left', 1),
    createProgramQuota('side_lane_right', 1),
    createProgramQuota('info_pavilion', 1),
  ];

  if (heroCount > 0) {
    targets.push(createProgramQuota('hero_forecourt_left', Math.min(1, heroCount)));
    if (heroCount > 1) {
      targets.push(createProgramQuota('hero_forecourt_right', 1));
    }
  }

  if (heroCount + premiumCount > 0) {
    targets.push(createProgramQuota('demo_stage', 1));
  }

  if (standardCount > 0) {
    targets.push(createProgramQuota('meeting_pod', 1));
  }

  if (total <= 2) {
    targets.push(createProgramQuota('networking_lounge', 1));
  }

  targets.push(createProgramQuota('scenic_showcase', total === 0 ? 2 : 1));
  return targets;
}

function countSupportingNodes(targets: SponsorDistrictProgramQuota[]) {
  return targets.reduce((sum, target) => {
    if (target.role === 'info_pavilion' || target.role === 'networking_lounge' || target.role === 'meeting_pod' || target.role === 'demo_stage') {
      return sum + target.target;
    }
    return sum;
  }, 0);
}

function resolveDistrictSupportLevel(heroCount: number, total: number): ExpoDistrictSupportLevel {
  if (total === 0) {
    return 'empty';
  }

  if (total === 1) {
    return 'single-booth';
  }

  return heroCount > 0 ? 'hero-supported' : 'supported';
}

function resolveDistrictExpression({
  heroCount,
  premiumCount,
  standardCount,
  supportingNodeCount,
  targets,
}: {
  heroCount: number;
  premiumCount: number;
  standardCount: number;
  supportingNodeCount: number;
  targets: SponsorDistrictProgramQuota[];
}) {
  const sponsorBackedFrontCount = heroCount + premiumCount + standardCount;
  const hasDemo = targets.some((target) => target.role === 'demo_stage' && target.target > 0);
  const hasMeeting = targets.some((target) => target.role === 'meeting_pod' && target.target > 0);
  const hasNetworking = targets.some((target) => target.role === 'networking_lounge' && target.target > 0);
  const hasScenic = targets.some((target) => target.role === 'scenic_showcase' && target.target > 0);
  const hasOrientation = targets.some((target) => target.role === 'info_pavilion' && target.target > 0);
  const activeSupportFloorMet = sponsorBackedFrontCount >= 2 || (heroCount >= 1 && supportingNodeCount >= 1);
  const supportLevel = resolveDistrictSupportLevel(heroCount, sponsorBackedFrontCount);

  if (sponsorBackedFrontCount === 0) {
    return {
      authoredMomentCount: 2,
      downgradeReason: 'empty-sector' as const,
      expressionMode: hasScenic ? 'scenic' as const : 'orientation' as const,
      frontageIntensity: 0 as const,
      frontagePackage: {
        hasGroundEngagement: false,
        hasPrimaryScreenPlane: false,
        hasSecondarySupport: hasOrientation,
      },
      isCommerciallyEligible: false,
      sponsorBackedFrontCount,
      supportLevel,
      supportingNodeCount,
    };
  }

  if (sponsorBackedFrontCount === 1) {
    return {
      authoredMomentCount: heroCount > 0 ? 3 : 2,
      downgradeReason: 'single-booth-no-active-floor' as const,
      expressionMode: heroCount > 0 ? 'feature-court' as const : hasScenic ? 'scenic' as const : 'satellite' as const,
      frontageIntensity: heroCount > 0 ? 2 as const : 1 as const,
      frontagePackage: {
        hasGroundEngagement: true,
        hasPrimaryScreenPlane: heroCount > 0,
        hasSecondarySupport: true,
      },
      isCommerciallyEligible: false,
      sponsorBackedFrontCount,
      supportLevel,
      supportingNodeCount,
    };
  }

  if (!activeSupportFloorMet) {
    return {
      authoredMomentCount: hasScenic ? 2 : 1,
      downgradeReason: 'insufficient-support-floor' as const,
      expressionMode: hasScenic ? 'scenic' as const : 'satellite' as const,
      frontageIntensity: 1 as const,
      frontagePackage: {
        hasGroundEngagement: true,
        hasPrimaryScreenPlane: false,
        hasSecondarySupport: true,
      },
      isCommerciallyEligible: false,
      sponsorBackedFrontCount,
      supportLevel,
      supportingNodeCount,
    };
  }

  if (!hasDemo && (hasMeeting || hasNetworking)) {
    return {
      authoredMomentCount: 2,
      downgradeReason: 'calm-program-suppression' as const,
      expressionMode: 'calm-dwell' as const,
      frontageIntensity: 1 as const,
      frontagePackage: {
        hasGroundEngagement: true,
        hasPrimaryScreenPlane: false,
        hasSecondarySupport: true,
      },
      isCommerciallyEligible: false,
      sponsorBackedFrontCount,
      supportLevel,
      supportingNodeCount,
    };
  }

  return {
    authoredMomentCount: hasScenic ? 2 : 1,
    downgradeReason: null,
    expressionMode: 'active-commercial' as const,
    frontageIntensity: heroCount > 0 ? 3 as const : 2 as const,
    frontagePackage: {
      hasGroundEngagement: true,
      hasPrimaryScreenPlane: true,
      hasSecondarySupport: true,
    },
    isCommerciallyEligible: true,
    sponsorBackedFrontCount,
    supportLevel,
    supportingNodeCount,
  };
}

function buildProgrammedFillerNodes({
  center,
  clusterIndex,
  color,
  sectorId,
  sectorLabel,
  targets,
}: {
  center: { x: number; z: number; lane: 'left' | 'right' | 'center' };
  clusterIndex: number;
  color: string;
  sectorId: string | null;
  sectorLabel: string;
  targets: SponsorDistrictProgramQuota[];
}) {
  const nodes: SponsorBoulevardNode[] = [];

  const pushNode = (id: string, position: [number, number, number], rotationY: number | undefined, functionalRole: ExpoDistrictProgramRole) => {
    nodes.push(createProgrammedNode({
      clusterIndex,
      color,
      functionalRole,
      id,
      nodeType: functionalRole.includes('forecourt') ? 'hero_forecourt' : functionalRole === 'arrival_anchor' ? 'anchor_plaza' : functionalRole.includes('connector') ? 'connector_corridor' : functionalRole.includes('side_lane') ? 'side_lane_node' : 'programmed_filler',
      position,
      rotationY,
      sectorId,
      sectorLabel,
    }));
  };

  targets.forEach((target) => {
    if (target.target <= 0) {
      return;
    }

    switch (target.role) {
      case 'arrival_anchor':
        pushNode(`anchor-plaza-${sectorId ?? UNASSIGNED_SECTOR_ID}`, getProgrammedNodePosition(center, target.role).position, undefined, target.role);
        break;
      case 'connector_left':
        {
          const result = getProgrammedNodePosition(center, target.role);
          pushNode(`connector-left-${sectorId ?? UNASSIGNED_SECTOR_ID}`, result.position, result.rotationY, target.role);
        }
        break;
      case 'connector_right':
        {
          const result = getProgrammedNodePosition(center, target.role);
          pushNode(`connector-right-${sectorId ?? UNASSIGNED_SECTOR_ID}`, result.position, result.rotationY, target.role);
        }
        break;
      case 'side_lane_left':
        {
          const result = getProgrammedNodePosition(center, target.role);
          pushNode(`side-lane-left-${sectorId ?? UNASSIGNED_SECTOR_ID}`, result.position, result.rotationY, target.role);
        }
        break;
      case 'side_lane_right':
        {
          const result = getProgrammedNodePosition(center, target.role);
          pushNode(`side-lane-right-${sectorId ?? UNASSIGNED_SECTOR_ID}`, result.position, result.rotationY, target.role);
        }
        break;
      case 'hero_forecourt_left':
        {
          const result = getProgrammedNodePosition(center, target.role);
          pushNode(`hero-forecourt-left-${sectorId ?? UNASSIGNED_SECTOR_ID}`, result.position, result.rotationY, target.role);
        }
        break;
      case 'hero_forecourt_right':
        {
          const result = getProgrammedNodePosition(center, target.role);
          pushNode(`hero-forecourt-right-${sectorId ?? UNASSIGNED_SECTOR_ID}`, result.position, result.rotationY, target.role);
        }
        break;
      case 'info_pavilion':
        pushNode(`program-info-${sectorId ?? UNASSIGNED_SECTOR_ID}`, getProgrammedNodePosition(center, target.role).position, undefined, target.role);
        break;
      case 'networking_lounge':
        pushNode(`program-network-${sectorId ?? UNASSIGNED_SECTOR_ID}`, getProgrammedNodePosition(center, target.role).position, undefined, target.role);
        break;
      case 'demo_stage':
        {
          const result = getProgrammedNodePosition(center, target.role);
          pushNode(`program-demo-${sectorId ?? UNASSIGNED_SECTOR_ID}`, result.position, result.rotationY, target.role);
        }
        break;
      case 'meeting_pod':
        {
          const result = getProgrammedNodePosition(center, target.role);
          pushNode(`program-meeting-${sectorId ?? UNASSIGNED_SECTOR_ID}`, result.position, result.rotationY, target.role);
        }
        break;
      case 'scenic_showcase':
        for (let index = 0; index < target.target; index += 1) {
          const result = getProgrammedNodePosition(center, target.role, index);
          pushNode(
            `program-scenic-${sectorId ?? UNASSIGNED_SECTOR_ID}-${index}`,
            result.position,
            result.rotationY,
            target.role
          );
        }
        break;
    }
  });

  const allocatedCountByRole = nodes.reduce<Map<ExpoDistrictProgramRole, number>>((acc, node) => {
    if (node.functionalRole) {
      acc.set(node.functionalRole, (acc.get(node.functionalRole) ?? 0) + 1);
    }
    return acc;
  }, new Map());

  targets.forEach((target) => {
    target.allocated = allocatedCountByRole.get(target.role) ?? 0;
  });

  return nodes;
}

function getSectorClusterDepth(nodeOffsets: number[]) {
  const furthestContentOffset = nodeOffsets.length > 0 ? Math.max(...nodeOffsets) : EXPO_BOULEVARD_LAYOUT.anchorPlazaDepth;
  return Math.max(
    EXPO_BOULEVARD_LAYOUT.sectorGatewayOnlyDepth + EXPO_BOULEVARD_LAYOUT.clusterGapDepth + EXPO_BOULEVARD_LAYOUT.anchorPlazaDepth,
    furthestContentOffset + EXPO_BOULEVARD_LAYOUT.clusterGapDepth + 18,
  );
}

function getDistrictNodeCenter(clusterIndex: number, totalDistrictCount: number): { x: number; z: number; lane: 'left' | 'right' | 'center' } {
  const baseZ = -220 - (clusterIndex * 446);
  if (totalDistrictCount >= 3 && clusterIndex === totalDistrictCount - 1) {
    return {
      x: 0,
      z: baseZ - 168,
      lane: 'center',
    };
  }

  const isLeft = clusterIndex % 2 === 0;
  return {
    x: isLeft ? -404 : 404,
    z: baseZ - (isLeft ? 12 : 108),
    lane: isLeft ? 'left' : 'right',
  };
}

function classifyDistrictTierBand(
  clusterIndex: number,
  totalDistrictCount: number
): 'arrival' | 'showcase' | 'media' | 'discovery' {
  if (clusterIndex === 0) {
    return 'arrival';
  }

  if (totalDistrictCount >= 3 && clusterIndex === totalDistrictCount - 1) {
    return 'discovery';
  }

  if (clusterIndex === 1) {
    return 'showcase';
  }

  return 'media';
}

function getDistrictGatewayPositions(center: { x: number; z: number; lane: 'left' | 'right' | 'center' }) {
  if (center.lane === 'center') {
    return {
      left: [-244, 0, center.z + 112] as [number, number, number],
      right: [244, 0, center.z + 112] as [number, number, number],
    };
  }

  return {
    left: [-188, 0, center.z + 108] as [number, number, number],
    right: [188, 0, center.z + 108] as [number, number, number],
  };
}

function getProgrammedNodePosition(
  center: { x: number; z: number; lane: 'left' | 'right' | 'center' },
  role: ExpoDistrictProgramRole,
  scenicIndex = 0
): { position: [number, number, number]; rotationY?: number } {
  switch (role) {
    case 'arrival_anchor':
      return { position: [center.x, 0, center.z + 148] };
    case 'connector_left':
      return { position: [center.x - 136, 0, center.z + 48], rotationY: Math.PI / 2 };
    case 'connector_right':
      return { position: [center.x + 136, 0, center.z + 48], rotationY: -Math.PI / 2 };
    case 'side_lane_left':
      return { position: [center.x - (center.lane === 'center' ? 286 : 212), 0, center.z - 12], rotationY: Math.PI / 2 };
    case 'side_lane_right':
      return { position: [center.x + (center.lane === 'center' ? 286 : 212), 0, center.z - 12], rotationY: -Math.PI / 2 };
    case 'hero_forecourt_left':
      return { position: [center.x - (center.lane === 'center' ? 184 : 104), 0, center.z + 42], rotationY: Math.PI / 2 };
    case 'hero_forecourt_right':
      return { position: [center.x + (center.lane === 'center' ? 184 : 104), 0, center.z + 42], rotationY: -Math.PI / 2 };
    case 'info_pavilion':
      return { position: [center.x, 0, center.z - 128] };
    case 'networking_lounge':
      return { position: [center.x, 0, center.z - 186] };
    case 'demo_stage':
      return { position: [center.x + (center.lane === 'center' ? 322 : 248), 0, center.z - 126], rotationY: -Math.PI / 2 };
    case 'meeting_pod':
      return { position: [center.x - (center.lane === 'center' ? 322 : 248), 0, center.z - 126], rotationY: Math.PI / 2 };
    case 'scenic_showcase': {
      const side = scenicIndex % 2 === 0 ? -1 : 1;
      const xOffset = center.lane === 'center' ? 364 : 284;
      return {
        position: [center.x + side * xOffset, 0, center.z - 176 - (Math.floor(scenicIndex / 2) * 28)],
        rotationY: side < 0 ? Math.PI / 2 : -Math.PI / 2,
      };
    }
  }
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
  const districts: SponsorBoulevardDistrict[] = [];
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

  let clusterBaseZ = -42;

  orderedSectorKeys.forEach((sectorKey, sectorIndex) => {
    const group = sectorGroups.get(sectorKey) ?? [];
    const districtCenter = getDistrictNodeCenter(sectorIndex, orderedSectorKeys.length);
    const districtTierBand = classifyDistrictTierBand(sectorIndex, orderedSectorKeys.length);
    const sectorLabel = sectorKey === UNASSIGNED_SECTOR_ID
      ? UNASSIGNED_SECTOR_LABEL
      : (sectorLabelById.get(sectorKey) ?? group[0]?.sectorLabel ?? UNASSIGNED_SECTOR_LABEL);
    const color = sectorColorById.get(sectorKey) || '#3b82f6';

    const gatewayPositions = getDistrictGatewayPositions(districtCenter);
    const leftGateway = createGatewayNode(
      sectorKey === UNASSIGNED_SECTOR_ID ? null : sectorKey,
      sectorLabel,
      color,
      'left',
      gatewayPositions.left[2]
    );
    leftGateway.clusterIndex = sectorIndex;
    leftGateway.position = gatewayPositions.left;
    const rightGateway = createGatewayNode(
      sectorKey === UNASSIGNED_SECTOR_ID ? null : sectorKey,
      sectorLabel,
      color,
      'right',
      gatewayPositions.right[2]
    );
    rightGateway.clusterIndex = sectorIndex;
    rightGateway.position = gatewayPositions.right;
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
    const districtTargets = buildDistrictProgramTargets({
      heroCount: heroPrimary.length,
      premiumCount: premiumCompanies.length,
      standardCount: standardCompanies.length,
    });
    const supportingNodeCount = countSupportingNodes(districtTargets);
    const districtExpression = resolveDistrictExpression({
      heroCount: heroPrimary.length,
      premiumCount: premiumCompanies.length,
      standardCount: standardCompanies.length,
      supportingNodeCount,
      targets: districtTargets,
    });
    const sectorId = sectorKey === UNASSIGNED_SECTOR_ID ? null : sectorKey;
    const programmedNodes = buildProgrammedFillerNodes({
      center: districtCenter,
      clusterIndex: sectorIndex,
      color,
      sectorId,
      sectorLabel,
      targets: districtTargets,
    });
    nodes.push(...programmedNodes);

    const heroLeft = heroPrimary[0];
    const heroRight = heroPrimary[1];
    if (heroLeft) {
      const heroOffset = districtTierBand === 'showcase' ? 236 : districtTierBand === 'discovery' ? 224 : districtCenter.lane === 'center' ? 208 : 132;
      nodes.push(createCompanyNode(
        heroLeft,
        'hero_left',
        color,
        districtCenter.x - heroOffset,
        districtCenter.z + (districtTierBand === 'showcase' ? 12 : districtTierBand === 'discovery' ? -28 : -12),
        Math.PI / 2
      ));
      nodes[nodes.length - 1].clusterIndex = sectorIndex;
    }
    if (heroRight) {
      const heroOffset = districtTierBand === 'showcase' ? 236 : districtTierBand === 'discovery' ? 224 : districtCenter.lane === 'center' ? 208 : 132;
      nodes.push(createCompanyNode(
        heroRight,
        'hero_right',
        color,
        districtCenter.x + heroOffset,
        districtCenter.z + (districtTierBand === 'showcase' ? 12 : districtTierBand === 'discovery' ? -28 : -12),
        -Math.PI / 2
      ));
      nodes[nodes.length - 1].clusterIndex = sectorIndex;
    }

    premiumCompanies.forEach((company, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      const row = Math.floor(index / 2);
      const premiumRadius =
        districtTierBand === 'discovery' ? (districtCenter.lane === 'center' ? 452 : 348)
        : districtTierBand === 'showcase' ? (districtCenter.lane === 'center' ? 408 : 324)
        : districtCenter.lane === 'center' ? 384 : 298;
      const premiumBaseZ =
        districtTierBand === 'arrival' ? districtCenter.z - 26
        : districtTierBand === 'showcase' ? districtCenter.z - 24
        : districtTierBand === 'discovery' ? districtCenter.z - 76
        : districtCenter.z - 44;
      const premiumStep = districtTierBand === 'discovery' ? 142 : 128;
      nodes.push(createCompanyNode(
        company,
        'endcap',
        color,
        districtCenter.x + side * premiumRadius,
        premiumBaseZ - row * premiumStep,
        side < 0 ? Math.PI / 2 : -Math.PI / 2
      ));
      nodes[nodes.length - 1].clusterIndex = sectorIndex;
    });

    standardCompanies.forEach((company, index) => {
      const isLeft = index % 2 === 0;
      const row = Math.floor(index / 2);
      const standardOffset =
        districtTierBand === 'arrival' ? 166
        : districtTierBand === 'showcase' ? 224
        : districtTierBand === 'discovery' ? 246
        : 198;
      const standardBaseZ =
        districtTierBand === 'arrival' ? districtCenter.z - 122
        : districtTierBand === 'showcase' ? districtCenter.z - 182
        : districtTierBand === 'discovery' ? districtCenter.z - 224
        : districtCenter.z - 164;
      const standardStep = districtTierBand === 'discovery' ? 132 : 118;
      nodes.push(createCompanyNode(
        company,
        isLeft ? 'standard_left' : 'standard_right',
        color,
        districtCenter.x + (isLeft ? -standardOffset : standardOffset),
        standardBaseZ - row * standardStep,
        isLeft ? Math.PI / 2 : -Math.PI / 2
      ));
      nodes[nodes.length - 1].clusterIndex = sectorIndex;
    });

    const sectorNodeOffsets = [
      ...programmedNodes.map((node) => Math.abs(clusterBaseZ - node.position[2])),
      ...nodes
        .filter((node) => node.clusterIndex === sectorIndex && node.companyId)
        .map((node) => Math.abs(clusterBaseZ - node.position[2])),
    ];
    const districtDepth = getSectorClusterDepth(sectorNodeOffsets);
    districts.push({
      authoredMomentCount: districtExpression.authoredMomentCount,
      clusterIndex: sectorIndex,
      color,
      companyCounts: {
        hero: heroPrimary.length,
        premium: premiumCompanies.length,
        standard: standardCompanies.length,
        total: group.length,
      },
      depth: districtDepth,
      downgradeReason: districtExpression.downgradeReason,
      expressionMode: districtExpression.expressionMode,
      frontageIntensity: districtExpression.frontageIntensity,
      frontagePackage: districtExpression.frontagePackage,
      isCommerciallyEligible: districtExpression.isCommerciallyEligible,
      programNodeIds: programmedNodes.map((node) => node.id),
      programTargets: districtTargets,
      sectorId,
      sectorLabel,
      sponsorBackedFrontCount: districtExpression.sponsorBackedFrontCount,
      supportLevel: districtExpression.supportLevel,
      supportingNodeCount: districtExpression.supportingNodeCount,
    });

    clusterBaseZ -= districtDepth;
  });

  const footprintXs = nodes.map((node) => node.position[0]);
  const footprintZs = nodes.map((node) => node.position[2]);

  return {
    arrivalNode,
    companyOrder: rankedCompanies,
    districts,
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
