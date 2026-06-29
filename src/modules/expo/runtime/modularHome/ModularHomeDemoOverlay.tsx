import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isHomeDemoEnabled, isHomeStudioEnabled } from './homeDemoFlags';
import { HomeDesignInstanceShell, type HomeDesignInstanceSectionId } from './HomeDesignInstanceShell';
import { RoomPanoramaWalkthroughPanel } from './RoomPanoramaWalkthroughPanel';
import {
  type ModularHomeViewModeOption,
  useModularHomeConfigurator,
  useModularHomeViewMode,
} from './modularHomeConfigurator';
import { getModularHomeTemplate } from './modularHomeConfig';
import { calculateModularHomeEstimate, formatHomeEstimateEur } from './modularHomeEstimate';
import {
  calculateComponentBom,
  calculateManufacturingBomPreview,
} from './modularHomeComponents';
import { calculateMaterialTakeoff } from './modularHomeMaterialTakeoff';
import {
  getDefaultHomeConfig,
  getInvalidConfigReasons,
  getModularHomeDimensionSummary,
  getModularHomeDimensionPresetForConfig,
  getModularHomeLayoutVariantForConfig,
  getModularHomeProductionConstraints,
  getModularHomeProductConfigSummary,
  getModularHomeProductForTemplate,
  getModularHomeProducts,
  getModularHomeRoomMeasurementSummary,
  getModularHomeRoomUseProfileForConfig,
} from './modularHomeProducts';
import { ModularHomeProjectWorkspace } from './ModularHomeProjectWorkspace';
import { ModularHomeProjectSummary } from './ModularHomeProjectSummary';
import { ModularHomeProjectUploadPlaceholder } from './ModularHomeProjectUploadPlaceholder';
import { ModularHomeQuoteForm } from './ModularHomeQuoteForm';
import { ConfiguratorOptionsPanel } from './ConfiguratorOptionsPanel';
import { ModularHomeBomPanel } from './ModularHomeBomPanel';
import { ModularHomeProductGallery } from './ModularHomeProductGallery';
import { ModularHomeEstimatePanel } from './ModularHomeEstimatePanel';
import { decodeModularHomeConfigFromUrl } from './modularHomeShareUrl';
import { buildCanonicalModularHomeStudioSearchParams } from './modularHomeShareUrl';

type ModularHomeDemoOverlayProps = {
  isTouchDevice?: boolean;
};


type ModularHomeDemoTabId = 'overview' | 'design' | 'estimate' | 'bom' | 'quote' | 'projects' | 'upload';

const HOME_DEMO_TABS = [
  { id: 'design', label: 'Design', helper: 'Choose visible home options' },
  { id: 'estimate', label: 'Cena / Estimate', helper: 'Live price overview' },
  { id: 'quote', label: 'Pieprasīt piedāvājumu / Quote', helper: 'Request a quote' },
] as const satisfies readonly {
  helper: string;
  id: ModularHomeDemoTabId;
  label: string;
}[];

const HOME_DEMO_ADVANCED_TABS = [
  { id: 'overview', label: 'Overview', helper: 'Model, scale and view mode' },
  { id: 'bom', label: 'BOM', helper: 'Module and manufacturing summary' },
  { id: 'projects', label: 'Projects', helper: 'Saved local configurations' },
  { id: 'upload', label: 'Upload', helper: 'Manual conversion workflow' },
] as const satisfies readonly {
  helper: string;
  id: ModularHomeDemoTabId;
  label: string;
}[];

const HOME_DEMO_ADVANCED_TAB_IDS = new Set<ModularHomeDemoTabId>(
  HOME_DEMO_ADVANCED_TABS.map((tab) => tab.id),
);

const QUOTE_NUDGE_INTERACTION_THRESHOLD = 4;

function stopHomeDemoHudEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

function ModularHomeQuoteNudge({
  isTouchDevice,
  onDismiss,
  onRequestQuote,
}: {
  isTouchDevice: boolean;
  onDismiss: () => void;
  onRequestQuote: () => void;
}) {
  return (
    <section
      aria-label="Quote request nudge"
      data-home-quote-nudge="true"
      style={{
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.24), rgba(34, 197, 94, 0.18))',
        border: '1px solid rgba(125, 211, 252, 0.28)',
        borderRadius: isTouchDevice ? '14px' : '16px',
        display: 'grid',
        gap: '8px',
        marginTop: isTouchDevice ? '9px' : '10px',
        padding: isTouchDevice ? '9px' : '10px',
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
        <button
          type="button"
          data-home-quote-nudge-cta="true"
          onClick={(event) => {
            event.stopPropagation();
            onRequestQuote();
          }}
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.94), rgba(34, 197, 94, 0.86))',
            border: '1px solid rgba(254, 243, 199, 0.42)',
            borderRadius: '999px',
            color: '#111827',
            cursor: 'pointer',
            flex: '1 1 auto',
            font: 'inherit',
            fontSize: isTouchDevice ? '0.66rem' : '0.7rem',
            fontWeight: 980,
            lineHeight: 1.1,
            padding: isTouchDevice ? '9px 10px' : '10px 11px',
            textAlign: 'center',
          }}
        >
          Patīk? Saņem precīzu cenu →
        </button>
        <button
          type="button"
          aria-label="Dismiss quote nudge"
          data-home-quote-nudge-dismiss="true"
          onClick={(event) => {
            event.stopPropagation();
            onDismiss();
          }}
          style={{
            background: 'rgba(15, 23, 42, 0.58)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: '999px',
            color: '#cbd5e1',
            cursor: 'pointer',
            flex: '0 0 auto',
            font: 'inherit',
            fontSize: isTouchDevice ? '0.62rem' : '0.66rem',
            fontWeight: 950,
            height: '30px',
            lineHeight: 1,
            width: '30px',
          }}
        >
          ×
        </button>
      </div>
    </section>
  );
}

function ModularHomeLivePriceBanner({
  basePrice,
  isTouchDevice,
  onRequestPrice,
  totalPrice,
}: {
  basePrice: number;
  isTouchDevice: boolean;
  onRequestPrice: () => void;
  totalPrice: number;
}) {
  return (
    <section
      aria-label="Live modular home price"
      data-home-live-price-banner="true"
      data-home-live-price-base={basePrice}
      data-home-live-price-total={totalPrice}
      style={{
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.94), rgba(34, 197, 94, 0.88))',
        border: '1px solid rgba(255, 247, 237, 0.42)',
        borderRadius: isTouchDevice ? '14px' : '16px',
        bottom: isTouchDevice ? 'max(96px, calc(env(safe-area-inset-bottom) + 88px))' : '16px',
        boxShadow: '0 -10px 26px rgba(2, 6, 23, 0.34), 0 12px 32px rgba(2, 6, 23, 0.28)',
        color: '#111827',
        display: 'grid',
        gap: isTouchDevice ? '8px' : '9px',
        left: isTouchDevice ? '12px' : 'auto',
        marginTop: isTouchDevice ? '11px' : '13px',
        maxWidth: isTouchDevice ? 'calc(100vw - 24px)' : 'calc(100vw - 24px)',
        padding: isTouchDevice ? '9px' : '10px',
        position: 'fixed',
        right: isTouchDevice ? '10px' : '12px',
        width: isTouchDevice ? 'auto' : 'clamp(248px, 18vw, 286px)',
        zIndex: 117,
      }}
    >
      <div style={{ alignItems: 'end', display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: 'rgba(17, 24, 39, 0.72)', fontSize: isTouchDevice ? '0.55rem' : '0.58rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Bāze no {formatHomeEstimateEur(basePrice)}
          </div>
          <div style={{ color: '#0f172a', fontSize: isTouchDevice ? '1rem' : '1.08rem', fontWeight: 980, lineHeight: 1.05, marginTop: '3px' }}>
            {formatHomeEstimateEur(totalPrice)}
          </div>
        </div>
        <button
          type="button"
          data-home-live-price-cta="true"
          onClick={(event) => {
            event.stopPropagation();
            onRequestPrice();
          }}
          style={{
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.28)',
            borderRadius: '999px',
            color: '#fef3c7',
            cursor: 'pointer',
            flex: '0 0 auto',
            font: 'inherit',
            fontSize: isTouchDevice ? '0.62rem' : '0.66rem',
            fontWeight: 950,
            lineHeight: 1.08,
            padding: isTouchDevice ? '9px 11px' : '10px 12px',
            whiteSpace: 'nowrap',
          }}
        >
          Saņemt cenu
        </button>
      </div>
    </section>
  );
}

export function ModularHomeDemoOverlay({ isTouchDevice = false }: ModularHomeDemoOverlayProps) {
  const { config, reset, setConfig, setOption } = useModularHomeConfigurator();
  const { setViewMode, viewMode } = useModularHomeViewMode();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeHomeDemoTab, setActiveHomeDemoTab] = useState<ModularHomeDemoTabId>('design');
  const [homeConfigInteractionCount, setHomeConfigInteractionCount] = useState(0);
  const [quoteNudgeDismissed, setQuoteNudgeDismissed] = useState(false);
  const [quoteNudgeTriggeredByInterior, setQuoteNudgeTriggeredByInterior] = useState(false);
  const [showAdvancedHomeDemoTabs, setShowAdvancedHomeDemoTabs] = useState(false);
  const homeStudioEnabled = useMemo(() => isHomeStudioEnabled(), []);
  const sharedConfigFromUrl = useMemo(() => decodeModularHomeConfigFromUrl(), []);
  const products = getModularHomeProducts();
  const product = getModularHomeProductForTemplate(config.template) ?? products[0];
  const template = getModularHomeTemplate(config.template);
  const configSummary = getModularHomeProductConfigSummary(config);
  const layoutVariant = getModularHomeLayoutVariantForConfig(config);
  const dimensionPreset = getModularHomeDimensionPresetForConfig(config);
  const roomUseProfile = getModularHomeRoomUseProfileForConfig(config);
  const dimensionSummary = getModularHomeDimensionSummary(config);
  const roomMeasurementSummary = getModularHomeRoomMeasurementSummary(config);
  const estimate = calculateModularHomeEstimate(config);
  const componentBom = calculateComponentBom(config);
  const manufacturingBom = calculateManufacturingBomPreview(config);
  const materialTakeoff = calculateMaterialTakeoff(config);
  const invalidConfigReasons = getInvalidConfigReasons(config);
  const productionConstraints = getModularHomeProductionConstraints(config);
  const blockedProductionConstraints = productionConstraints.filter((constraint) => constraint.severity === 'blocked');
  const reviewConfigWarnings = productionConstraints.filter((constraint) => constraint.severity === 'requiresReview');
  const visibleProductionConstraints = productionConstraints.filter((constraint) => (
    constraint.severity !== 'info' || productionConstraints.length === 1
  ));
  const productionConstraintIds = productionConstraints.map((constraint) => constraint.id).join('|');
  const visibleHomeDemoTabs = showAdvancedHomeDemoTabs
    ? [...HOME_DEMO_TABS, ...HOME_DEMO_ADVANCED_TABS]
    : HOME_DEMO_TABS;
  const showQuoteNudge = !quoteNudgeDismissed
    && activeHomeDemoTab !== 'quote'
    && (homeConfigInteractionCount >= QUOTE_NUDGE_INTERACTION_THRESHOLD || quoteNudgeTriggeredByInterior);
  const trackHomeConfigInteraction = useCallback(() => {
    setHomeConfigInteractionCount((current) => current + 1);
  }, []);
  const updateStudioViewMode = useCallback((nextViewMode: ModularHomeViewModeOption) => {
    setViewMode(nextViewMode);

    if (typeof window === 'undefined') {
      return;
    }

    const nextParams = buildCanonicalModularHomeStudioSearchParams(nextViewMode);
    navigate(
      {
        pathname: location.pathname,
        search: `?${nextParams.toString()}`,
    },
      { replace: true },
    );
  }, [location.pathname, navigate, setViewMode]);
  const startInsideWithQuoteNudge = useCallback(() => {
    updateStudioViewMode('interior');
    setQuoteNudgeTriggeredByInterior(true);
  }, [updateStudioViewMode]);
  const requestQuoteFromNudge = useCallback(() => {
    setQuoteNudgeDismissed(true);
    setActiveHomeDemoTab('quote');
  }, []);

  useEffect(() => {
    const nextViewMode = new URLSearchParams(location.search).get('view');
    if (nextViewMode !== 'interior' && nextViewMode !== 'floorplan' && nextViewMode !== 'cutaway') {
      if (viewMode !== 'exterior') {
        setViewMode('exterior');
      }
      return;
    }

    if (viewMode !== nextViewMode) {
      setViewMode(nextViewMode as ModularHomeViewModeOption);
    }
  }, [location.search, setViewMode, viewMode]);

  const activeHomeDesignSection: HomeDesignInstanceSectionId = activeHomeDemoTab === 'quote'
    ? 'quote'
    : viewMode === 'interior'
      ? 'interiorRooms'
      : viewMode === 'floorplan'
        ? 'floorplan'
        : 'exteriorDesign';
  const instanceTitle = 'Unified modular-home showroom';
  const instanceSubtitle = viewMode === 'interior'
    ? 'The interior start position is active, but the scene remains the same walkable house.'
    : 'The exterior start position is active, and the same house scene stays available for walking.';

  const selectHomeDesignSection = (section: HomeDesignInstanceSectionId) => {
    switch (section) {
      case 'exteriorDesign':
        setActiveHomeDemoTab('design');
        updateStudioViewMode('exterior');
        break;
      case 'floorplan':
        setShowAdvancedHomeDemoTabs(true);
        setActiveHomeDemoTab('overview');
        updateStudioViewMode('floorplan');
        break;
      case 'interiorRooms':
        setActiveHomeDemoTab('design');
        startInsideWithQuoteNudge();
        break;
      case 'quote':
        setActiveHomeDemoTab('quote');
        break;
      case 'cityPreview':
        setShowAdvancedHomeDemoTabs(true);
        setActiveHomeDemoTab('overview');
        updateStudioViewMode('exterior');
        break;
    }
  };

  useEffect(() => {
    if (!sharedConfigFromUrl.isSharedConfig) {
      return;
    }

    setConfig(sharedConfigFromUrl.config);
    updateStudioViewMode(sharedConfigFromUrl.viewMode);
  }, [setConfig, sharedConfigFromUrl, updateStudioViewMode]);

  useEffect(() => {
    if (blockedProductionConstraints.length === 0) {
      return;
    }

    setConfig(getDefaultHomeConfig(product.id));
  }, [blockedProductionConstraints.length, product.id, productionConstraintIds, setConfig]);

  if (!isHomeDemoEnabled()) {
    return null;
  }

  return (
    <aside
      aria-label="Modular Home District preview"
      data-home-demo-overlay="true"
      data-home-production-blocked-count={blockedProductionConstraints.length}
      data-home-production-constraint-count={productionConstraints.length}
      data-home-production-requires-review-count={reviewConfigWarnings.length}
      onClick={stopHomeDemoHudEvent}
      onMouseDown={stopHomeDemoHudEvent}
      onPointerDown={stopHomeDemoHudEvent}
      onTouchStart={stopHomeDemoHudEvent}
      style={{
        position: 'absolute',
        left: 'auto',
        right: isTouchDevice ? '10px' : '12px',
        top: isTouchDevice ? '10px' : '12px',
        bottom: isTouchDevice ? 'max(96px, calc(env(safe-area-inset-bottom) + 88px))' : '16px',
        zIndex: 116,
        width: isTouchDevice ? 'auto' : 'clamp(248px, 18vw, 286px)',
        maxHeight: isTouchDevice ? '54vh' : 'calc(100vh - 26px)',
        maxWidth: isTouchDevice ? 'calc(100vw - 24px)' : 'calc(100vw - 24px)',
        overflowY: 'auto',
        padding: isTouchDevice ? '12px 12px' : '10px 11px',
        paddingBottom: isTouchDevice ? '92px' : '90px',
        border: '1px solid rgba(251, 191, 36, 0.42)',
        borderRadius: isTouchDevice ? '18px' : '20px',
        background:
          'radial-gradient(circle at 12% 0%, rgba(251, 191, 36, 0.24), transparent 34%), linear-gradient(180deg, rgba(21, 16, 8, 0.95), rgba(15, 23, 42, 0.88))',
        boxShadow: '0 22px 54px rgba(2, 6, 23, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        color: '#fff7ed',
        fontFamily: 'inherit',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'start' }}>
        <div>
          <div
            style={{
              color: '#fbbf24',
              fontSize: isTouchDevice ? '0.56rem' : '0.58rem',
              fontWeight: 950,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Modular home preview
          </div>
          <div style={{ fontSize: isTouchDevice ? '0.96rem' : '1.06rem', fontWeight: 950, letterSpacing: '-0.02em', lineHeight: 1.05, marginTop: '5px' }}>
            {instanceTitle}
          </div>
          <div style={{ marginTop: '6px', color: '#fed7aa', fontSize: isTouchDevice ? '0.68rem' : '0.72rem', fontWeight: 800, lineHeight: 1.3 }}>
            {instanceSubtitle}
          </div>
        </div>
        <div style={{ display: 'grid', justifyItems: 'end', gap: '6px' }}>
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.38)',
              borderRadius: '999px',
              color: '#86efac',
              fontSize: '0.56rem',
              fontWeight: 950,
              letterSpacing: '0.12em',
              padding: '4px 7px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            Preset studio
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (viewMode === 'interior') {
                updateStudioViewMode('exterior');
              } else {
                startInsideWithQuoteNudge();
              }
            }}
            style={{
              alignSelf: 'end',
              background: viewMode === 'interior' ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.24), rgba(14, 165, 233, 0.16))' : 'linear-gradient(135deg, rgba(34, 197, 94, 0.28), rgba(14, 165, 233, 0.14))',
              border: viewMode === 'interior' ? '1px solid rgba(34, 197, 94, 0.42)' : '1px solid rgba(125, 211, 252, 0.34)',
              borderRadius: '999px',
              color: '#f8fafc',
              cursor: 'pointer',
              font: 'inherit',
              fontSize: '0.6rem',
              fontWeight: 950,
              letterSpacing: '0.08em',
              padding: '7px 10px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {viewMode === 'interior' ? 'Start outside' : 'Start inside'}
          </button>
        </div>
      </div>

      {showQuoteNudge ? (
        <ModularHomeQuoteNudge
          isTouchDevice={isTouchDevice}
          onDismiss={() => setQuoteNudgeDismissed(true)}
          onRequestQuote={requestQuoteFromNudge}
        />
      ) : null}

      {homeStudioEnabled ? (
        <>
          <HomeDesignInstanceShell
            activeSection={activeHomeDesignSection}
            interiorRoomsPanel={activeHomeDesignSection === 'interiorRooms' ? (
              <RoomPanoramaWalkthroughPanel isTouchDevice={isTouchDevice} />
            ) : undefined}
            isTouchDevice={isTouchDevice}
            showCityPreview={false}
            onSelectSection={selectHomeDesignSection}
          />

          <section
            aria-label="Home Design Instance guidance"
            data-home-design-instance-guidance={activeHomeDesignSection}
            style={{
              background: 'rgba(15, 23, 42, 0.52)',
              border: '1px solid rgba(125, 211, 252, 0.16)',
              borderRadius: isTouchDevice ? '14px' : '16px',
              display: 'grid',
              gap: '6px',
              marginTop: isTouchDevice ? '9px' : '10px',
              padding: isTouchDevice ? '9px' : '10px',
            }}
          >
            <div style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.6rem' : '0.64rem', fontWeight: 920, lineHeight: 1.18 }}>
              {activeHomeDesignSection === 'exteriorDesign'
                ? 'Exterior controls keep the house centered while the rail handles facade, roof, trim and entry edits.'
                : activeHomeDesignSection === 'floorplan'
                  ? 'Floorplan keeps the controlled review view for layout and room measurements.'
                  : activeHomeDesignSection === 'interiorRooms'
                    ? 'Interior room focus uses the shared house scene with room presets, finish choices and the same walkable shell.'
                    : 'Quote keeps the current browser quote-preparation flow, estimate review and manual follow-up path unchanged.'}
            </div>
            <div style={{ color: '#94a3b8', fontSize: isTouchDevice ? '0.52rem' : '0.56rem', fontWeight: 780, lineHeight: 1.26 }}>
              {activeHomeDesignSection === 'interiorRooms'
                ? 'Use this section to frame room-by-room focus and interior finish choices without changing configurator, pricing, save or backend behavior in this step.'
                : activeHomeDesignSection === 'quote'
                  ? 'Existing quote logic, pricing and project save behavior remain intact.'
                  : 'The modular-home studio remains browser-based and reuses the existing configurator state and overlay systems.'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  updateStudioViewMode('exterior');
                }}
                style={{
                  background: viewMode === 'exterior' ? 'linear-gradient(135deg, rgba(125, 211, 252, 0.28), rgba(34, 197, 94, 0.18))' : 'rgba(15, 23, 42, 0.56)',
                  border: viewMode === 'exterior' ? '1px solid rgba(125, 211, 252, 0.42)' : '1px solid rgba(148, 163, 184, 0.16)',
                  borderRadius: '999px',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  font: 'inherit',
                  fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
                  fontWeight: 900,
                  padding: '8px 10px',
                }}
              >
                Start outside
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  startInsideWithQuoteNudge();
                }}
                style={{
                  background: viewMode === 'interior' ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.24), rgba(14, 165, 233, 0.16))' : 'rgba(15, 23, 42, 0.56)',
                  border: viewMode === 'interior' ? '1px solid rgba(34, 197, 94, 0.38)' : '1px solid rgba(148, 163, 184, 0.16)',
                  borderRadius: '999px',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  font: 'inherit',
                  fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
                  fontWeight: 900,
                  padding: '8px 10px',
                }}
              >
                Start inside
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setActiveHomeDemoTab('quote');
                }}
                style={{
                  background: activeHomeDemoTab === 'quote' ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.28), rgba(245, 158, 11, 0.18))' : 'rgba(15, 23, 42, 0.56)',
                  border: activeHomeDemoTab === 'quote' ? '1px solid rgba(251, 191, 36, 0.42)' : '1px solid rgba(148, 163, 184, 0.16)',
                  borderRadius: '999px',
                  color: '#fef3c7',
                  cursor: 'pointer',
                  font: 'inherit',
                  fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
                  fontWeight: 900,
                  padding: '8px 10px',
                }}
              >
                Request quote
              </button>
            </div>
          </section>
        </>
      ) : null}

      <nav
        aria-label="Modular Home Studio sections"
        data-home-demo-tabs="true"
        data-home-demo-active-tab={activeHomeDemoTab}
        style={{
          background: 'rgba(2, 6, 23, 0.28)',
          border: '1px solid rgba(251, 191, 36, 0.18)',
          borderRadius: isTouchDevice ? '14px' : '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: isTouchDevice ? '7px' : '8px',
          marginTop: isTouchDevice ? '10px' : '12px',
          padding: isTouchDevice ? '8px' : '9px',
        }}
      >
        {visibleHomeDemoTabs.map((tab) => {
          const selected = activeHomeDemoTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              aria-selected={selected}
              data-home-demo-tab={tab.id}
              data-home-demo-tab-active={selected ? 'true' : 'false'}
              title={tab.helper}
              onClick={(event) => {
                event.stopPropagation();
                setActiveHomeDemoTab(tab.id);
              }}
              style={{
                background: selected ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(34, 197, 94, 0.17))' : 'rgba(15, 23, 42, 0.56)',
                border: selected ? '1px solid rgba(251, 191, 36, 0.52)' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '999px',
                color: selected ? '#fff7ed' : '#cbd5e1',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: isTouchDevice ? '0.6rem' : '0.64rem',
                fontWeight: selected ? 950 : 850,
                lineHeight: 1.08,
                padding: isTouchDevice ? '8px 9px' : '9px 11px',
                minHeight: isTouchDevice ? '34px' : '36px',
                whiteSpace: 'normal',
              }}
            >
              {tab.label}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={showAdvancedHomeDemoTabs}
          data-home-demo-advanced-toggle="true"
          data-home-demo-advanced-visible={showAdvancedHomeDemoTabs ? 'true' : 'false'}
          title="Advanced"
          onClick={(event) => {
            event.stopPropagation();
            setShowAdvancedHomeDemoTabs((current) => {
              const next = !current;
              if (!next && HOME_DEMO_ADVANCED_TAB_IDS.has(activeHomeDemoTab)) {
                setActiveHomeDemoTab('design');
              }
              return next;
            });
          }}
          style={{
            background: showAdvancedHomeDemoTabs ? 'rgba(125, 211, 252, 0.18)' : 'rgba(15, 23, 42, 0.38)',
            border: showAdvancedHomeDemoTabs ? '1px solid rgba(125, 211, 252, 0.34)' : '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '999px',
            color: showAdvancedHomeDemoTabs ? '#bae6fd' : '#94a3b8',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
            fontWeight: 920,
            lineHeight: 1.08,
            minHeight: isTouchDevice ? '34px' : '36px',
            padding: isTouchDevice ? '8px 9px' : '9px 11px',
            whiteSpace: 'nowrap',
          }}
        >
          Pro skats
        </button>
      </nav>

      {activeHomeDemoTab === 'overview' ? (
        <ModularHomeProductGallery
          config={config}
          configSummary={configSummary}
          dimensionPreset={dimensionPreset}
          dimensionSummary={dimensionSummary}
          estimate={estimate}
          isTouchDevice={isTouchDevice}
          layoutVariant={layoutVariant}
          product={product}
          roomMeasurementSummary={roomMeasurementSummary}
          roomUseProfile={roomUseProfile}
          setViewMode={setViewMode}
          template={template}
          viewMode={viewMode}
        />
      ) : null}

      {activeHomeDemoTab === 'upload' ? (
        <ModularHomeProjectUploadPlaceholder isTouchDevice={isTouchDevice} />
      ) : null}

      {activeHomeDemoTab === 'design' ? (
        <ConfiguratorOptionsPanel
          config={config}
          configSummary={configSummary}
          invalidConfigReasons={invalidConfigReasons}
          invalidShareKeys={sharedConfigFromUrl.invalidKeys}
          isTouchDevice={isTouchDevice}
          onConfigInteraction={trackHomeConfigInteraction}
          onStartInside={startInsideWithQuoteNudge}
          product={product}
          reset={reset}
          reviewConfigWarnings={reviewConfigWarnings}
          setActiveHomeDemoTab={setActiveHomeDemoTab}
          setConfig={setConfig}
          setOption={setOption}
          updateStudioViewMode={updateStudioViewMode}
          viewMode={viewMode}
          visibleProductionConstraints={visibleProductionConstraints}
        />
      ) : null}

      {activeHomeDemoTab === 'projects' ? (
        <ModularHomeProjectWorkspace
          config={config}
          estimate={estimate}
          isTouchDevice={isTouchDevice}
          onLoadProject={setConfig}
          productId={product.id}
        />
      ) : null}

      {activeHomeDemoTab === 'bom' ? (
        <ModularHomeBomPanel
          componentBom={componentBom}
          estimate={estimate}
          isTouchDevice={isTouchDevice}
          manufacturingBom={manufacturingBom}
          materialTakeoff={materialTakeoff}
          template={template}
        />
      ) : null}

      {activeHomeDemoTab === 'estimate' ? (
        <ModularHomeEstimatePanel
          componentBom={componentBom}
          dimensionPreset={dimensionPreset}
          estimate={estimate}
          isTouchDevice={isTouchDevice}
          layoutVariant={layoutVariant}
          manufacturingBom={manufacturingBom}
          materialTakeoff={materialTakeoff}
          roomUseProfile={roomUseProfile}
          template={template}
          visibleProductionConstraints={visibleProductionConstraints}
        />
      ) : null}

      {activeHomeDemoTab === 'quote' ? (
        <>
          <ModularHomeQuoteForm config={config} estimate={estimate} isTouchDevice={isTouchDevice} />

          <ModularHomeProjectSummary config={config} estimate={estimate} isTouchDevice={isTouchDevice} />
        </>
      ) : null}

      <ModularHomeLivePriceBanner
        basePrice={estimate.basePrice}
        isTouchDevice={isTouchDevice}
        onRequestPrice={() => setActiveHomeDemoTab('quote')}
        totalPrice={estimate.totalPrice}
      />

      <div
        style={{
          borderTop: '1px solid rgba(251, 191, 36, 0.18)',
          color: '#fdba74',
          fontSize: isTouchDevice ? '0.62rem' : '0.66rem',
          fontWeight: 850,
          marginTop: isTouchDevice ? '11px' : '13px',
          paddingTop: isTouchDevice ? '9px' : '10px',
        }}
      >
        {'Preview model \u00b7 quote requests are saved locally only'}
      </div>
    </aside>
  );
}
