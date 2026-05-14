declare const __WARPALA_EXPO_BUILD_STAMP__: string | undefined;

export const EXPO_REVIEW_BUILD_STAMP =
  typeof __WARPALA_EXPO_BUILD_STAMP__ !== 'undefined' && __WARPALA_EXPO_BUILD_STAMP__
    ? __WARPALA_EXPO_BUILD_STAMP__
    : 'local-unbundled';
