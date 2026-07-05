import assert from 'node:assert/strict';
import {
  calculateModularHomeEstimate,
  getDefaultHomeConfig,
  type ModularHomeProductId,
} from '../runtime/modularHome/index.js';

type EstimateParitySnapshot = {
  estimatedTotal: number;
  lineItems: readonly {
    amount: number;
    category: string;
    id: string;
  }[];
  totalPrice: number;
};

const ESTIMATE_PARITY_SNAPSHOTS: Record<ModularHomeProductId, EstimateParitySnapshot> = {
  'compact-timber-40': {
    estimatedTotal: 93950,
    totalPrice: 93950,
    lineItems: [
      { id: 'compact-timber-40-base-modules', category: 'baseProduct', amount: 29800 },
      { id: 'compact-timber-40-bathroom-core', category: 'bathroomCore', amount: 8200 },
      { id: 'option-facade-natural-timber', category: 'facade', amount: 0 },
      { id: 'option-roof-pitched', category: 'roof', amount: 0 },
      { id: 'option-terrace-front-deck', category: 'terrace', amount: 4500 },
      { id: 'option-finish-standard', category: 'finish', amount: 12000 },
      { id: 'option-window-package-standard', category: 'windowPackage', amount: 0 },
      { id: 'option-door-package-standard-entry', category: 'doorPackage', amount: 0 },
      { id: 'option-window-placement-balanced', category: 'windowPlacement', amount: 0 },
      { id: 'option-door-placement-front-entry', category: 'doorPlacement', amount: 0 },
      { id: 'option-facade-board-orientation-vertical', category: 'facadeBoardOrientation', amount: 650 },
      { id: 'option-facade-board-width-standard', category: 'facadeBoardWidth', amount: 0 },
      { id: 'option-facade-board-profile-square-edge', category: 'facadeBoardProfile', amount: 0 },
      { id: 'option-facade-board-spacing-standard', category: 'facadeBoardSpacing', amount: 0 },
      { id: 'option-trim-color-timber', category: 'trimColor', amount: 0 },
      { id: 'option-roof-edge-graphite', category: 'roofEdgeColor', amount: 0 },
      { id: 'option-roof-gutter-minimal-edge', category: 'roofGutterStyle', amount: 0 },
      { id: 'option-window-frame-timber', category: 'windowFrameColor', amount: 0 },
      { id: 'option-window-frame-type-standard', category: 'windowFrameType', amount: 0 },
      { id: 'option-interior-wall-plywood', category: 'interiorWallFinish', amount: 0 },
      { id: 'option-floor-finish-plywood', category: 'floorFinish', amount: 0 },
      { id: 'option-interior-floor-style-utility-plywood', category: 'interiorFloorStyle', amount: 0 },
      { id: 'option-wall-panel-style-plain', category: 'wallPanelStyle', amount: 0 },
      { id: 'option-kitchen-finish-wood', category: 'facade', amount: 600 },
      { id: 'option-furniture-mood-warm', category: 'facade', amount: 650 },
      { id: 'option-interior-zone-focus-living', category: 'facade', amount: 0 },
      { id: 'option-furniture-package-standard', category: 'furniturePackage', amount: 4200 },
      { id: 'option-furniture-sofa-enabled', category: 'sofa', amount: 850 },
      { id: 'option-furniture-table-enabled', category: 'table', amount: 450 },
      { id: 'option-furniture-bed-enabled', category: 'bed', amount: 950 },
      { id: 'option-furniture-kitchen-line-enabled', category: 'kitchenLine', amount: 2400 },
      { id: 'option-furniture-wardrobe-enabled', category: 'wardrobePlaceholder', amount: 700 },
    ],
  },
  'family-timber-80': {
    estimatedTotal: 171050,
    totalPrice: 171050,
    lineItems: [
      { id: 'family-timber-80-base-modules', category: 'baseProduct', amount: 63800 },
      { id: 'family-timber-80-bathroom-core', category: 'bathroomCore', amount: 8200 },
      { id: 'option-facade-natural-timber', category: 'facade', amount: 0 },
      { id: 'option-roof-pitched', category: 'roof', amount: 0 },
      { id: 'option-terrace-extended', category: 'terrace', amount: 8000 },
      { id: 'option-finish-standard', category: 'finish', amount: 12000 },
      { id: 'option-window-package-panoramic', category: 'windowPackage', amount: 7800 },
      { id: 'option-door-package-terrace-slider', category: 'doorPackage', amount: 4200 },
      { id: 'option-window-placement-front-panoramic', category: 'windowPlacement', amount: 2400 },
      { id: 'option-door-placement-terrace-facing', category: 'doorPlacement', amount: 2800 },
      { id: 'option-facade-board-orientation-vertical', category: 'facadeBoardOrientation', amount: 650 },
      { id: 'option-facade-board-width-standard', category: 'facadeBoardWidth', amount: 0 },
      { id: 'option-facade-board-profile-square-edge', category: 'facadeBoardProfile', amount: 0 },
      { id: 'option-facade-board-spacing-standard', category: 'facadeBoardSpacing', amount: 0 },
      { id: 'option-trim-color-timber', category: 'trimColor', amount: 0 },
      { id: 'option-roof-edge-graphite', category: 'roofEdgeColor', amount: 0 },
      { id: 'option-roof-gutter-minimal-edge', category: 'roofGutterStyle', amount: 0 },
      { id: 'option-window-frame-timber', category: 'windowFrameColor', amount: 0 },
      { id: 'option-window-frame-type-standard', category: 'windowFrameType', amount: 0 },
      { id: 'option-interior-wall-plywood', category: 'interiorWallFinish', amount: 0 },
      { id: 'option-floor-finish-plywood', category: 'floorFinish', amount: 0 },
      { id: 'option-interior-floor-style-utility-plywood', category: 'interiorFloorStyle', amount: 0 },
      { id: 'option-wall-panel-style-plain', category: 'wallPanelStyle', amount: 0 },
      { id: 'option-kitchen-finish-wood', category: 'facade', amount: 600 },
      { id: 'option-furniture-mood-warm', category: 'facade', amount: 650 },
      { id: 'option-interior-zone-focus-living', category: 'facade', amount: 0 },
      { id: 'option-furniture-package-standard', category: 'furniturePackage', amount: 4200 },
      { id: 'option-furniture-sofa-enabled', category: 'sofa', amount: 850 },
      { id: 'option-furniture-table-enabled', category: 'table', amount: 450 },
      { id: 'option-furniture-bed-enabled', category: 'bed', amount: 950 },
      { id: 'option-furniture-kitchen-line-enabled', category: 'kitchenLine', amount: 2400 },
      { id: 'option-furniture-wardrobe-enabled', category: 'wardrobePlaceholder', amount: 700 },
    ],
  },
  'sauna-cabin-25': {
    estimatedTotal: 74300,
    totalPrice: 74300,
    lineItems: [
      { id: 'sauna-cabin-25-base-modules', category: 'baseProduct', amount: 17800 },
      { id: 'sauna-cabin-25-bathroom-core', category: 'bathroomCore', amount: 8200 },
      { id: 'option-facade-dark-thermo', category: 'facade', amount: 3200 },
      { id: 'option-roof-flat', category: 'roof', amount: 0 },
      { id: 'option-terrace-front-deck', category: 'terrace', amount: 4500 },
      { id: 'option-finish-standard', category: 'finish', amount: 12000 },
      { id: 'option-window-package-compact-privacy', category: 'windowPackage', amount: 1800 },
      { id: 'option-door-package-standard-entry', category: 'doorPackage', amount: 0 },
      { id: 'option-window-placement-side-privacy', category: 'windowPlacement', amount: 900 },
      { id: 'option-door-placement-front-entry', category: 'doorPlacement', amount: 0 },
      { id: 'option-facade-board-orientation-vertical', category: 'facadeBoardOrientation', amount: 650 },
      { id: 'option-facade-board-width-standard', category: 'facadeBoardWidth', amount: 0 },
      { id: 'option-facade-board-profile-square-edge', category: 'facadeBoardProfile', amount: 0 },
      { id: 'option-facade-board-spacing-standard', category: 'facadeBoardSpacing', amount: 0 },
      { id: 'option-trim-color-timber', category: 'trimColor', amount: 0 },
      { id: 'option-roof-edge-graphite', category: 'roofEdgeColor', amount: 0 },
      { id: 'option-roof-gutter-minimal-edge', category: 'roofGutterStyle', amount: 0 },
      { id: 'option-window-frame-timber', category: 'windowFrameColor', amount: 0 },
      { id: 'option-window-frame-type-standard', category: 'windowFrameType', amount: 0 },
      { id: 'option-interior-wall-plywood', category: 'interiorWallFinish', amount: 0 },
      { id: 'option-floor-finish-plywood', category: 'floorFinish', amount: 0 },
      { id: 'option-interior-floor-style-utility-plywood', category: 'interiorFloorStyle', amount: 0 },
      { id: 'option-wall-panel-style-plain', category: 'wallPanelStyle', amount: 0 },
      { id: 'option-kitchen-finish-dark', category: 'facade', amount: 900 },
      { id: 'option-furniture-mood-minimal', category: 'facade', amount: 0 },
      { id: 'option-interior-zone-focus-overview', category: 'facade', amount: 0 },
      { id: 'option-furniture-package-sauna', category: 'furniturePackage', amount: 3800 },
      { id: 'option-furniture-sofa-disabled', category: 'sofa', amount: 0 },
      { id: 'option-furniture-table-enabled', category: 'table', amount: 450 },
      { id: 'option-furniture-bed-disabled', category: 'bed', amount: 0 },
      { id: 'option-furniture-kitchen-line-disabled', category: 'kitchenLine', amount: 0 },
      { id: 'option-furniture-wardrobe-disabled', category: 'wardrobePlaceholder', amount: 0 },
    ],
  },
};

for (const [productId, expected] of Object.entries(ESTIMATE_PARITY_SNAPSHOTS) as [ModularHomeProductId, EstimateParitySnapshot][]) {
  const estimate = calculateModularHomeEstimate(getDefaultHomeConfig(productId));
  const actual: EstimateParitySnapshot = {
    estimatedTotal: estimate.estimatedTotal,
    totalPrice: estimate.totalPrice,
    lineItems: estimate.lineItems.map((item) => ({
      amount: item.amount,
      category: item.category,
      id: item.id,
    })),
  };

  assert.deepEqual(actual, expected, `${productId} estimate output changed`);
}
