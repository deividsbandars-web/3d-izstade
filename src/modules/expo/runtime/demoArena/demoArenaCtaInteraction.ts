import { getActiveDemoArenaEvent } from './demoArenaConfig';
import type { DemoArenaCtaDefinition, DemoArenaEvent } from './demoArenaTypes';

export type DemoArenaCtaInteractionPolicy = {
  analyticsDispatchEnabled: false;
  clickUiEnabled: false;
  ctaClickableCount: 0;
  ctaVisibleCount: number;
  enabledCtaIds: string[];
  hasBackend: false;
  modalEnabled: false;
  navigationEnabled: false;
  previewEnabled: boolean;
  reason: string;
  safeToAttachClickHandlers: false;
  screenCtaMap: Record<string, string[]>;
  totalCtaCount: number;
};

export type DemoArenaCtaInteractionPreview = {
  ctaIds: string[];
  ctaVisibleCount: number;
  screenTargetId: string;
  wouldBeClickable: false;
};


const ROUND_23_CTA_INTERACTION_REASON = 'metadata-only readiness; click behavior intentionally disabled for Round 23';

function getPreviewEnabledCtas(event: DemoArenaEvent | null): DemoArenaCtaDefinition[] {
  return (event?.ctaDefinitions ?? []).filter((cta) => cta.enabledInPreview);
}

function buildScreenCtaMap(ctas: DemoArenaCtaDefinition[]): Record<string, string[]> {
  return ctas.reduce<Record<string, string[]>>((accumulator, cta) => {
    if (!cta.screenTargetId) {
      return accumulator;
    }

    accumulator[cta.screenTargetId] = [...(accumulator[cta.screenTargetId] ?? []), cta.id];
    return accumulator;
  }, {});
}

export function getDemoArenaCtaInteractionPolicy(
  event: DemoArenaEvent | null = getActiveDemoArenaEvent(),
  previewEnabled = false,
): DemoArenaCtaInteractionPolicy {
  const visibleCtas = previewEnabled ? getPreviewEnabledCtas(event) : [];

  return {
    analyticsDispatchEnabled: false,
    clickUiEnabled: false,
    ctaClickableCount: 0,
    ctaVisibleCount: visibleCtas.length,
    enabledCtaIds: visibleCtas.map((cta) => cta.id),
    hasBackend: false,
    modalEnabled: false,
    navigationEnabled: false,
    previewEnabled,
    reason: ROUND_23_CTA_INTERACTION_REASON,
    safeToAttachClickHandlers: false,
    screenCtaMap: buildScreenCtaMap(visibleCtas),
    totalCtaCount: event?.ctaDefinitions.length ?? 0,
  };
}

export function getDemoArenaCtaForScreenTarget(
  event: DemoArenaEvent | null,
  screenTargetId: string,
  previewEnabled = false,
): DemoArenaCtaDefinition[] {
  if (!previewEnabled || !event) {
    return [];
  }

  return event.ctaDefinitions.filter((cta) => cta.enabledInPreview && cta.screenTargetId === screenTargetId);
}

export function buildDemoArenaCtaInteractionPreview(
  event: DemoArenaEvent | null,
  screenTargetId: string,
  previewEnabled = false,
): DemoArenaCtaInteractionPreview {
  const ctas = getDemoArenaCtaForScreenTarget(event, screenTargetId, previewEnabled);

  return {
    ctaIds: ctas.map((cta) => cta.id),
    ctaVisibleCount: ctas.length,
    screenTargetId,
    wouldBeClickable: false,
  };
}

export function getDemoArenaCtaInteractionSummary(
  event: DemoArenaEvent | null = getActiveDemoArenaEvent(),
  previewEnabled = false,
): DemoArenaCtaInteractionPolicy {
  return getDemoArenaCtaInteractionPolicy(event, previewEnabled);
}

export function isDemoArenaCtaInteractionEnabled(
  policy: DemoArenaCtaInteractionPolicy = getDemoArenaCtaInteractionPolicy(),
): boolean {
  void policy;
  return false;
}
