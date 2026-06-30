const truthyFeatureFlagValues = new Set(['1', 'true', 'yes', 'on']);

export function isFeatureFlagEnabled(value: string | undefined | null) {
  return truthyFeatureFlagValues.has(value?.trim().toLowerCase() ?? '');
}

export const ENABLE_DEMO_ROUTES = __WARPALA_ENABLE_DEMO_ROUTES__;
