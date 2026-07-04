import {
  resolveGalaFacadeVisual,
  resolveGalaInteriorVisual,
  type GalaHouseVisualConfig,
} from '../GalaHouseConfig';

const GALA_EXTERIOR_WALL_SKIN_DIMENSIONS = {
  boardDepthM: 0.028,
  boardToGapMinRatio: 8,
  boardWidthM: 0.18,
  gapMaxM: 0.025,
  gapTargetMaxM: 0.02,
  gapTargetMinM: 0.01,
  gapWidthM: 0.014,
  revealBackingDepthM: 0.006,
} as const;

const GALA_WALL_SKIN_PBR_MATERIALS = {
  exteriorBoard: {
    clearcoat: 0.08,
    clearcoatRoughness: 0.72,
    envMapIntensity: 0.72,
    metalness: 0,
    roughness: 0.82,
  },
  exteriorReveal: {
    clearcoat: 0,
    clearcoatRoughness: 1,
    envMapIntensity: 0.38,
    metalness: 0,
    roughness: 0.96,
  },
  interiorBoard: {
    clearcoat: 0.04,
    clearcoatRoughness: 0.78,
    envMapIntensity: 0.58,
    metalness: 0,
    roughness: 0.86,
  },
  interiorPanel: {
    clearcoat: 0.02,
    clearcoatRoughness: 0.9,
    envMapIntensity: 0.46,
    metalness: 0,
    roughness: 0.9,
  },
  trim: {
    clearcoat: 0.12,
    clearcoatRoughness: 0.62,
    envMapIntensity: 0.76,
    metalness: 0,
    roughness: 0.7,
  },
} as const;

export const GALA_WALL_SKIN_DIMENSIONS = {
  exterior: {
    ...GALA_EXTERIOR_WALL_SKIN_DIMENSIONS,
  },
  interior: {
    boardDepthM: 0.016,
    boardToGapMinRatio: GALA_EXTERIOR_WALL_SKIN_DIMENSIONS.boardToGapMinRatio,
    boardWidthM: GALA_EXTERIOR_WALL_SKIN_DIMENSIONS.boardWidthM,
    ceilingPanelSpacingM: 1.68,
    floorPlankSpacingM: 0.5,
    gapWidthM: GALA_EXTERIOR_WALL_SKIN_DIMENSIONS.gapWidthM,
    panelGrooveDepthM: 0.008,
    panelGrooveWidthM: 0.012,
    panelSpacingM: GALA_EXTERIOR_WALL_SKIN_DIMENSIONS.boardWidthM + GALA_EXTERIOR_WALL_SKIN_DIMENSIONS.gapWidthM,
  },
} as const;

export const GALA_WALL_SKIN_OWNERSHIP = {
  dimensionsOwner: 'src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts',
  materialOwner: 'src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts',
  rulesOwner: 'src/modules/expo/runtime/modularHome/construction/GalaWallSkinModel.ts',
  singleSourceRendererProven: false,
} as const;

export type GalaResolvedWallSkin = ReturnType<typeof resolveGalaWallSkin>;

function blendHexChannel(left: string, right: string, ratio: number) {
  return Math.round(Number.parseInt(left, 16) + ((Number.parseInt(right, 16) - Number.parseInt(left, 16)) * ratio))
    .toString(16)
    .padStart(2, '0');
}

function blendHexColor(left: string, right: string, ratio: number) {
  const leftValue = left.replace('#', '');
  const rightValue = right.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(leftValue) || !/^[0-9a-f]{6}$/i.test(rightValue)) {
    return left;
  }

  return `#${blendHexChannel(leftValue.slice(0, 2), rightValue.slice(0, 2), ratio)}${blendHexChannel(leftValue.slice(2, 4), rightValue.slice(2, 4), ratio)}${blendHexChannel(leftValue.slice(4, 6), rightValue.slice(4, 6), ratio)}`;
}

export function resolveGalaWallSkin(config?: GalaHouseVisualConfig) {
  const facade = resolveGalaFacadeVisual(config);
  const interior = resolveGalaInteriorVisual(config);
  const subtleBoardColor = blendHexColor(facade.wallColor, facade.wallLightColor, 0.45);
  const exteriorBoardPalette = [facade.wallColor, subtleBoardColor] as const;

  return {
    exterior: {
      ...GALA_WALL_SKIN_DIMENSIONS.exterior,
      backingWallColor: facade.wallColor,
      boardColor: facade.wallColor,
      boardPalette: exteriorBoardPalette,
      boardSubtleColor: subtleBoardColor,
      openingRevealColor: '#7c5638',
      materials: {
        board: GALA_WALL_SKIN_PBR_MATERIALS.exteriorBoard,
        reveal: GALA_WALL_SKIN_PBR_MATERIALS.exteriorReveal,
        trim: GALA_WALL_SKIN_PBR_MATERIALS.trim,
      },
      revealColor: facade.seamColor,
      thresholdColor: facade.trimColor,
      textureVariant: facade.textureVariant,
      trimColor: facade.trimColor,
    },
    interior: {
      ...GALA_WALL_SKIN_DIMENSIONS.interior,
      ceilingColor: interior.wallPanelColor,
      boardColor: facade.wallColor,
      boardPalette: exteriorBoardPalette,
      boardSubtleColor: subtleBoardColor,
      floorColor: interior.floorColor,
      floorSeamColor: interior.wallSeamColor,
      floorTextureVariant: interior.floorTextureVariant,
      panelRevealColor: facade.seamColor,
      partitionCoreColor: interior.wallSeamColor,
      materials: {
        board: GALA_WALL_SKIN_PBR_MATERIALS.interiorBoard,
        panel: GALA_WALL_SKIN_PBR_MATERIALS.interiorPanel,
        trim: GALA_WALL_SKIN_PBR_MATERIALS.trim,
      },
      wallPanelColor: interior.wallPanelColor,
      wallTextureVariant: interior.wallTextureVariant,
    },
    rules: {
      exteriorCladdingAppliesToVisibleExteriorWalls: true,
      interiorBoardModuleMatchesExterior: true,
      interiorUsesExactExteriorBoardModule: true,
      interiorUsesSameWoodTone: true,
      interiorUsesSameWallSkinSystem: true,
      noHorizontalDecorativeFacadeMarks: true,
      openingsMaskWallSkinInsteadOfCreatingPlainBays: true,
      partitionsUseInteriorPanelVariant: true,
      wallSkinConstantsSingleOwner: true,
    },
  } as const;
}

export function shouldApplyExteriorWallSkin(surface: { kind?: string }) {
  return surface.kind === 'exterior';
}

export function resolveGalaExteriorBoardColor(palette: readonly string[], boardIndex: number) {
  const baseColor = palette[0] ?? '#c5925c';
  const subtleColor = palette[1] ?? baseColor;

  return boardIndex % 3 === 1 ? subtleColor : baseColor;
}

export function resolveGalaInteriorBoardColor(palette: readonly string[], boardIndex: number) {
  const baseColor = palette[0] ?? '#c5925c';
  const subtleColor = palette[1] ?? baseColor;

  return boardIndex % 3 === 1 ? subtleColor : baseColor;
}
