import {
  trackExpoBookingClicked,
  trackExpoBoothClicked,
  trackExpoDemoRoomEntered,
  trackExpoWebsiteOpened,
} from '../../lib/expoAnalytics';
import {
  isSupportedExpoInternalRoute,
  resolveSponsorCtaIntent,
  type SponsorBoothPresentation,
  type SponsorCta,
} from '../../lib/sponsorBoothPresentation';
import type { ExpoAnalyticsTarget } from '../../lib/expoAnalytics';
import { dispatchOpenGlobalChat } from '../../../../components/chat/globalChatEvents';

type InteractionCompany = {
  id?: string | null;
  name?: string | null;
};

export function openShowcaseRoom({
  analyticsEnabled,
  analyticsTarget,
  boothId,
  company,
  navigate,
  presentation,
  sectorName,
}: {
  analyticsEnabled: boolean;
  analyticsTarget?: ExpoAnalyticsTarget | null;
  boothId: string;
  company: InteractionCompany;
  navigate: (path: string) => void;
  presentation: Pick<SponsorBoothPresentation, 'demoRoomPath' | 'template'>;
  sectorName?: string | null;
}) {
  if (!isSupportedExpoInternalRoute(presentation.demoRoomPath)) {
    return false;
  }

  if (analyticsEnabled) {
    trackExpoDemoRoomEntered(company, {
      boothId,
      boothTemplate: presentation.template,
      sectorName: sectorName ?? undefined,
    }, analyticsTarget);
  }

  navigate(presentation.demoRoomPath);
  return true;
}

export function handleBoothAction({
  action,
  analyticsEnabled,
  analyticsTarget,
  boothId,
  company,
  navigate,
  openWindow,
  presentation,
  sectorName,
}: {
  action: SponsorCta;
  analyticsEnabled: boolean;
  analyticsTarget?: ExpoAnalyticsTarget | null;
  boothId: string;
  company: InteractionCompany;
  navigate: (path: string) => void;
  openWindow?: (url: string, target?: string, features?: string) => void;
  presentation: Pick<SponsorBoothPresentation, 'demoRoomPath' | 'template'>;
  sectorName?: string | null;
}) {
  const intent = resolveSponsorCtaIntent(action, presentation);
  if (!intent) {
    return false;
  }

  if (intent.type === 'local') {
    if (intent.target === 'global_chat') {
      dispatchOpenGlobalChat({ focusInput: true });
    }
    return true;
  }

  if (intent.type === 'navigate') {
    if (!isSupportedExpoInternalRoute(intent.target)) {
      return false;
    }

    if (action.kind === 'demo_room') {
      return openShowcaseRoom({
        analyticsEnabled,
        analyticsTarget,
        boothId,
        company,
        navigate,
        presentation,
        sectorName,
      });
    }

    navigate(intent.target);
    return true;
  }

  if (analyticsEnabled) {
    if (action.kind === 'website') {
      trackExpoWebsiteOpened(company, {
        boothId,
        boothTemplate: presentation.template,
        ctaKind: action.kind,
        websiteUrl: intent.target,
      }, analyticsTarget);
    } else if (action.kind === 'booking') {
      trackExpoBookingClicked(company, {
        boothId,
        boothTemplate: presentation.template,
        bookingUrl: intent.target,
        ctaKind: action.kind,
      }, analyticsTarget);
    }
  }

  (openWindow ?? window.open)?.(intent.target, '_blank', 'noopener,noreferrer');
  return true;
}

export function trackBoothSelection({
  analyticsEnabled,
  analyticsTarget,
  boothId,
  company,
  nodeType,
  presentation,
  sectorName,
}: {
  analyticsEnabled: boolean;
  analyticsTarget?: ExpoAnalyticsTarget | null;
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
  }, analyticsTarget);
}
