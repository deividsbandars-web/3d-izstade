import { buildSponsorBoothPresentation } from '../../lib/sponsorBoothPresentation';
import type { ExpoBoothPlacement } from '../../layout-engine';

export function getNormalizedBooth(company: any) {
  const rawBooth = company?.booth ?? company?.booths ?? null;

  if (Array.isArray(rawBooth)) {
    return rawBooth[0] || null;
  }

  if (rawBooth && typeof rawBooth === 'object') {
    return rawBooth;
  }

  return null;
}

export function bindBoothPresentation(
  company: ExpoBoothPlacement['company'],
  placement: Pick<ExpoBoothPlacement, 'districtThemeId' | 'nodeType'>
) {
  const booth = getNormalizedBooth(company);
  const presentation = buildSponsorBoothPresentation(company, booth, placement.nodeType, {
    districtThemeId: placement.districtThemeId,
  });

  return { booth, presentation };
}
