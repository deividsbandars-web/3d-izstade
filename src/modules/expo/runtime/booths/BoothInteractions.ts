import {
  trackExpoBookingClicked,
  trackExpoBoothClicked,
  trackExpoDemoRoomEntered,
  trackExpoWebsiteOpened,
} from '../../lib/expoAnalytics';
import {
  resolveSponsorCtaIntent,
  type SponsorBoothPresentation,
  type SponsorCta,
} from '../../lib/sponsorBoothPresentation';

type InteractionCompany = {
  id?: string | null;
  name?: string | null;
};

export function openShowcaseRoom({
  analyticsEnabled,
  boothId,
  company,
  navigate,
  presentation,
  sectorName,
}: {
  analyticsEnabled: boolean;
  boothId: string;
  company: InteractionCompany;
  navigate: (path: string) => void;
  presentation: Pick<SponsorBoothPresentation, 'demoRoomPath' | 'template'>;
  sectorName?: string | null;
}) {
  if (analyticsEnabled) {
    trackExpoDemoRoomEntered(company, {
      boothId,
      boothTemplate: presentation.template,
      sectorName: sectorName ?? undefined,
    });
  }

  navigate(presentation.demoRoomPath);
}

export function handleBoothAction({
  action,
  analyticsEnabled,
  boothId,
  company,
  navigate,
  openWindow,
  presentation,
  sectorName,
}: {
  action: SponsorCta;
  analyticsEnabled: boolean;
  boothId: string;
  company: InteractionCompany;
  navigate: (path: string) => void;
  openWindow?: (url: string, target?: string, features?: string) => void;
  presentation: Pick<SponsorBoothPresentation, 'demoRoomPath' | 'template'>;
  sectorName?: string | null;
}) {
  const intent = resolveSponsorCtaIntent(action, presentation);
  if (!intent) {
    return;
  }

  if (intent.type === 'navigate') {
    openShowcaseRoom({
      analyticsEnabled,
      boothId,
      company,
      navigate,
      presentation,
      sectorName,
    });
    return;
  }

  if (analyticsEnabled) {
    if (action.kind === 'website') {
      trackExpoWebsiteOpened(company, {
        boothId,
        boothTemplate: presentation.template,
        websiteUrl: intent.target,
      });
    } else if (action.kind === 'booking') {
      trackExpoBookingClicked(company, {
        boothId,
        boothTemplate: presentation.template,
        bookingUrl: intent.target,
      });
    }
  }

  (openWindow ?? window.open)?.(intent.target, '_blank', 'noopener,noreferrer');
}

export function trackBoothSelection({
  analyticsEnabled,
  boothId,
  company,
  nodeType,
  presentation,
  sectorName,
}: {
  analyticsEnabled: boolean;
  boothId: string;
  company: InteractionCompany;
  nodeType?: string | null;
  presentation: Pick<SponsorBoothPresentation, 'template'>;
  sectorName?: string | null;
}) {
  if (!analyticsEnabled) {
    return;
  }

  trackExpoBoothClicked(company, {
    boothId,
    boothTemplate: presentation.template,
    nodeType: nodeType ?? undefined,
    sectorName: sectorName ?? undefined,
  });
}
