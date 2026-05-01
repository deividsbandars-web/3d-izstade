import type { ExpoMode } from '../../../state/expoRuntime';
import type { ExpoOperatorSession, ReviewOperatorZone } from '../model/reviewOperatorSession';
import type { ZoneFixRoute } from '../model/zoneFixRouting';
import type { ZoneReviewValidation } from '../model/zoneReviewValidation';
import type { WorldObjectRegistryEntry } from '../../world/inspection/worldObjectRegistry';
import { ExpoOperatorZoneNav } from '../navigation/ExpoOperatorZoneNav';
import { ExpoOperatorDrawer } from '../panel/ExpoOperatorDrawer';
import type { ExpoZoneVisualDefect } from '../state/useExpoOperatorState';

type LayerKey = 'promenade' | 'city' | 'stadium' | 'booths' | 'skyline';
type SectionKey = 'arrival' | 'left' | 'middle' | 'right' | 'stadium';

export function ExpoOperatorOverlay({
  activeZoneId,
  buildStamp,
  centerStack,
  centerTargetEntry,
  centerTarget,
  clickStack,
  clickTargetEntry,
  clickTarget,
  companyCount,
  dataMode,
  debug,
  focusedName,
  focusedSlug,
  focusedTier,
  inspector,
  layerStates,
  markedPoint,
  mode,
  onAddClickStack,
  onAddClickTarget,
  onClearFocus,
  onClearTargetBasket,
  onFocusElite,
  onFocusHero,
  onFocusPremium,
  onSelectZone,
  onSetMark,
  onToggleDebug,
  onToggleLayer,
  onToggleSection,
  operatorZoneId,
  operatorZoneLabel,
  operatorZoneFixRoutes,
  operatorZoneValidation,
  operatorZoneVisualDefects,
  sceneVersion,
  sectionStates,
  session,
  targetBasket,
  zones,
}: {
  activeZoneId: string | null;
  buildStamp: string;
  centerStack: string[];
  centerTargetEntry: WorldObjectRegistryEntry | null;
  centerTarget: string | null;
  clickStack: string[];
  clickTargetEntry: WorldObjectRegistryEntry | null;
  clickTarget: string | null;
  companyCount: number;
  dataMode: string;
  debug: boolean;
  focusedName: string | null;
  focusedSlug: string | null;
  focusedTier: string | null;
  inspector: Array<{ distance: number; id: string; layer: string }>;
  layerStates: Record<string, boolean>;
  markedPoint: [number, number, number] | null;
  mode: ExpoMode;
  onAddClickStack: () => void;
  onAddClickTarget: () => void;
  onClearFocus: () => void;
  onClearTargetBasket: () => void;
  onFocusElite?: () => void;
  onFocusHero?: () => void;
  onFocusPremium?: () => void;
  onSelectZone: (zoneId: string) => void;
  onSetMark: () => void;
  onToggleDebug: () => void;
  onToggleLayer: (layer: LayerKey) => void;
  onToggleSection: (section: SectionKey) => void;
  operatorZoneId: string | null;
  operatorZoneLabel: string | null;
  operatorZoneFixRoutes: ZoneFixRoute[];
  operatorZoneValidation: ZoneReviewValidation | null;
  operatorZoneVisualDefects: ExpoZoneVisualDefect[];
  sceneVersion: string | null;
  sectionStates: Record<string, boolean>;
  session: ExpoOperatorSession;
  targetBasket: string[];
  zones: ReviewOperatorZone[];
}) {
  if (!session.enabled) {
    return null;
  }

  const operatorReason = session.reason === 'dev' ? 'DEV OPERATOR' : 'STAGING REVIEW';

  return (
    <div
      data-expo-operator-overlay="true"
      style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 2100, display: 'flex', gap: '14px', alignItems: 'flex-start', maxWidth: 'min(760px, calc(100vw - 28px))' }}
    >
      <div style={{ width: '360px', maxHeight: '72vh', background: 'rgba(7, 12, 18, 0.84)', border: '1px solid rgba(148, 163, 184, 0.24)', borderRadius: '16px', padding: '14px', backdropFilter: 'blur(12px)', color: '#e2e8f0', overflow: 'hidden' }}>
        <div style={{ fontSize: '0.72rem', letterSpacing: '0.16em', fontWeight: 900, color: '#7dd3fc', marginBottom: '10px' }}>EXPO OPERATOR SURFACE</div>
        <ExpoOperatorZoneNav
          activeZoneId={operatorZoneId}
          onSelectZone={onSelectZone}
          zones={zones}
        />
      </div>
      <ExpoOperatorDrawer
        activeZoneId={activeZoneId}
        buildStamp={buildStamp}
        centerStack={centerStack}
        centerTargetEntry={centerTargetEntry}
        centerTarget={centerTarget}
        clickStack={clickStack}
        clickTargetEntry={clickTargetEntry}
        clickTarget={clickTarget}
        companyCount={companyCount}
        dataMode={dataMode}
        debug={debug}
        focusedName={focusedName}
        focusedSlug={focusedSlug}
        focusedTier={focusedTier}
        inspector={inspector}
        layerStates={layerStates}
        markedPoint={markedPoint}
        mode={mode}
        onAddClickStack={onAddClickStack}
        onAddClickTarget={onAddClickTarget}
        onClearFocus={onClearFocus}
        onClearTargetBasket={onClearTargetBasket}
        onFocusElite={onFocusElite}
        onFocusHero={onFocusHero}
        onFocusPremium={onFocusPremium}
        onSetMark={onSetMark}
        onToggleDebug={onToggleDebug}
        onToggleLayer={onToggleLayer}
        onToggleSection={onToggleSection}
        operatorReason={operatorReason}
        operatorZoneLabel={operatorZoneLabel}
        operatorZoneFixRoutes={operatorZoneFixRoutes}
        operatorZoneValidation={operatorZoneValidation}
        operatorZoneVisualDefects={operatorZoneVisualDefects}
        sceneVersion={sceneVersion}
        sectionStates={sectionStates}
        targetBasket={targetBasket}
      />
    </div>
  );
}
