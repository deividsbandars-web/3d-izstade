import type { StadiumReserve } from '../planning/types';

export type CityPerimeterConnector = {
  accent: 'cap' | 'wall';
  id: string;
  position: [number, number, number];
  size: [number, number, number];
};

export function buildCityPerimeterConnectors(stadiumReserve: StadiumReserve): CityPerimeterConnector[] {
  const outerHalfWidth = 1720;
  const wallThickness = 20;
  const wallHeight = 32;
  const cornerCapFootprint = 46;
  const cornerCapHeight = 70;
  const frontOuterZ = 780;
  const frontWallCenterZ = frontOuterZ - (wallThickness * 0.5);
  const wallCenterX = outerHalfWidth - (wallThickness * 0.5);
  const frontWallWidth = (wallCenterX - (cornerCapFootprint * 0.5)) * 2;
  const sideWallFrontZ = frontOuterZ - wallThickness;
  const stadiumFrontEdgeZ = stadiumReserve.centerZ + 2440;
  const sideWallRearZ = stadiumFrontEdgeZ + 24;
  const sideWallDepth = sideWallFrontZ - sideWallRearZ;
  const sideWallCenterZ = (sideWallFrontZ + sideWallRearZ) * 0.5;

  return [
    {
      accent: 'wall',
      id: 'city-perimeter-front-wall',
      position: [0, wallHeight * 0.5, frontWallCenterZ],
      size: [frontWallWidth, wallHeight, wallThickness],
    },
    {
      accent: 'cap',
      id: 'city-perimeter-left-front-corner',
      position: [-wallCenterX, cornerCapHeight * 0.5, frontWallCenterZ],
      size: [cornerCapFootprint, cornerCapHeight, cornerCapFootprint],
    },
    {
      accent: 'cap',
      id: 'city-perimeter-right-front-corner',
      position: [wallCenterX, cornerCapHeight * 0.5, frontWallCenterZ],
      size: [cornerCapFootprint, cornerCapHeight, cornerCapFootprint],
    },
    {
      accent: 'wall',
      id: 'city-perimeter-left-wall',
      position: [-wallCenterX, wallHeight * 0.5, sideWallCenterZ],
      size: [wallThickness, wallHeight, sideWallDepth],
    },
    {
      accent: 'wall',
      id: 'city-perimeter-right-wall',
      position: [wallCenterX, wallHeight * 0.5, sideWallCenterZ],
      size: [wallThickness, wallHeight, sideWallDepth],
    },
    {
      accent: 'cap',
      id: 'city-perimeter-left-stadium-terminus',
      position: [-wallCenterX, cornerCapHeight * 0.5, sideWallRearZ],
      size: [cornerCapFootprint, cornerCapHeight, cornerCapFootprint],
    },
    {
      accent: 'cap',
      id: 'city-perimeter-right-stadium-terminus',
      position: [wallCenterX, cornerCapHeight * 0.5, sideWallRearZ],
      size: [cornerCapFootprint, cornerCapHeight, cornerCapFootprint],
    },
  ];
}
