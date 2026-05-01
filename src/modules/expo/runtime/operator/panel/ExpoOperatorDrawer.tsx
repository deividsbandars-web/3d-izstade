import type { ExpoMode } from '../../../state/expoRuntime';
import type { WorldObjectRegistryEntry } from '../../world/inspection/worldObjectRegistry';
import { ExpoOperatorInspectionSummary } from '../inspection/ExpoOperatorInspectionSummary';
import type { ZoneFixRoute } from '../model/zoneFixRouting';
import type { ZoneReviewValidation } from '../model/zoneReviewValidation';
import type { ExpoZoneVisualDefect } from '../state/useExpoOperatorState';

type LayerKey = 'promenade' | 'city' | 'stadium' | 'booths' | 'skyline';
type SectionKey = 'arrival' | 'left' | 'middle' | 'right' | 'stadium';

function OwnershipCard({
  entry,
  title,
}: {
  entry: WorldObjectRegistryEntry | null;
  title: string;
}) {
  return (
    <div style={{ border: '1px solid rgba(148, 163, 184, 0.16)', borderRadius: '12px', padding: '10px', background: 'rgba(15, 23, 42, 0.36)' }}>
      <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', fontWeight: 900, color: '#93c5fd', marginBottom: '6px' }}>{title}</div>
      {!entry ? (
        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>No registry entry</div>
      ) : (
        <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.45 }}>
          <div>ID: {entry.id}</div>
          <div>LAYER: {entry.layer}</div>
          <div>KIND: {entry.sourceKind}</div>
          <div>OWNER: {entry.interactionOwner || 'none'}</div>
          <div>SOURCE: {entry.sourceFile}</div>
          <div>SAFE SEAM: {entry.safeEditSeam}</div>
          <div>ZONE: {entry.planningZone || 'none'}</div>
          <div>DIAGNOSTICS: {entry.diagnosticOwners.length > 0 ? entry.diagnosticOwners.join(' | ') : 'none'}</div>
        </div>
      )}
    </div>
  );
}

function ValidationCard({
  title,
  validation,
}: {
  title: string;
  validation: ZoneReviewValidation | null;
}) {
  const status = validation?.status ?? 'warning';
  const tone = status === 'ok'
    ? {
        background: 'rgba(34, 197, 94, 0.12)',
        border: '1px solid rgba(34, 197, 94, 0.28)',
        color: '#bbf7d0',
      }
    : {
        background: 'rgba(248, 113, 113, 0.12)',
        border: '1px solid rgba(248, 113, 113, 0.28)',
        color: '#fecaca',
      };

  return (
    <div style={{ borderRadius: '12px', padding: '10px', ...tone }}>
      <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', fontWeight: 900, marginBottom: '6px' }}>{title}</div>
      {!validation ? (
        <div style={{ fontSize: '0.72rem' }}>No active zone validation</div>
      ) : (
        <div style={{ fontSize: '0.72rem', lineHeight: 1.45 }}>
          <div>STATUS: {validation.status.toUpperCase()}</div>
          <div>MISSING IDS: {validation.missingExpectedObjectIds.length > 0 ? validation.missingExpectedObjectIds.join(' | ') : 'none'}</div>
          <div>MISSING LAYERS: {validation.missingExpectedLayers.length > 0 ? validation.missingExpectedLayers.join(' | ') : 'none'}</div>
          <div>UNKNOWN IDS: {validation.unknownExpectedObjectIds.length > 0 ? validation.unknownExpectedObjectIds.join(' | ') : 'none'}</div>
          <div>FORBIDDEN IDS: {validation.forbiddenObjectIdsPresent.length > 0 ? validation.forbiddenObjectIdsPresent.join(' | ') : 'none'}</div>
          <div>FORBIDDEN LAYERS: {validation.forbiddenExpectedLayersPresent.length > 0 ? validation.forbiddenExpectedLayersPresent.join(' | ') : 'none'}</div>
          <div>EXTRA LAYERS: {validation.extraVisibleLayers.length > 0 ? validation.extraVisibleLayers.join(' | ') : 'none'}</div>
        </div>
      )}
    </div>
  );
}

function FixRoutingCard({
  routes,
  title,
}: {
  routes: ZoneFixRoute[];
  title: string;
}) {
  return (
    <div style={{ border: '1px solid rgba(148, 163, 184, 0.16)', borderRadius: '12px', padding: '10px', background: 'rgba(15, 23, 42, 0.36)' }}>
      <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', fontWeight: 900, color: '#fcd34d', marginBottom: '6px' }}>{title}</div>
      {routes.length === 0 ? (
        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>No active fix routes</div>
      ) : (
        <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.45 }}>
          {routes.slice(0, 4).map((route) => (
            <div key={`${route.issue}:${route.target}`}>
              <div>{route.issue.toUpperCase()}: {route.target}</div>
              <div style={{ opacity: 0.8 }}>SEAM: {route.safeEditSeam}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VisualDefectsCard({
  defects,
  title,
}: {
  defects: ExpoZoneVisualDefect[];
  title: string;
}) {
  return (
    <div style={{ border: '1px solid rgba(148, 163, 184, 0.16)', borderRadius: '12px', padding: '10px', background: 'rgba(15, 23, 42, 0.36)' }}>
      <div style={{ fontSize: '0.62rem', letterSpacing: '0.12em', fontWeight: 900, color: '#fca5a5', marginBottom: '6px' }}>{title}</div>
      {defects.length === 0 ? (
        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>No active visual defects</div>
      ) : (
        <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.45 }}>
          {defects.slice(0, 6).map((defect) => (
            <div key={`${defect.family}:${defect.id}`}>
              <div>{defect.family.toUpperCase()}: {defect.id}</div>
              <div style={{ opacity: 0.8 }}>{defect.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ExpoOperatorDrawer({
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
  onSetMark,
  onToggleDebug,
  onToggleLayer,
  onToggleSection,
  operatorReason,
  operatorZoneLabel,
  operatorZoneFixRoutes,
  operatorZoneValidation,
  operatorZoneVisualDefects,
  sceneVersion,
  sectionStates,
  targetBasket,
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
  onSetMark: () => void;
  onToggleDebug: () => void;
  onToggleLayer: (layer: LayerKey) => void;
  onToggleSection: (section: SectionKey) => void;
  operatorReason: string;
  operatorZoneLabel: string | null;
  operatorZoneFixRoutes: ZoneFixRoute[];
  operatorZoneValidation: ZoneReviewValidation | null;
  operatorZoneVisualDefects: ExpoZoneVisualDefect[];
  sceneVersion: string | null;
  sectionStates: Record<string, boolean>;
  targetBasket: string[];
}) {
  const panelStyle = {
    backdropFilter: 'blur(14px)',
    background: 'linear-gradient(180deg, rgba(13, 20, 31, 0.92), rgba(8, 14, 24, 0.84))',
    border: '1px solid rgba(248, 113, 113, 0.28)',
    borderRadius: '16px',
    boxShadow: '0 18px 48px rgba(2, 6, 23, 0.4)',
    color: '#f8fafc',
  } as const;

  return (
    <div style={{ ...panelStyle, width: '340px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.18em', fontWeight: 900, color: '#fda4af' }}>OPERATOR</div>
          <div style={{ fontSize: '0.86rem', fontWeight: 800 }}>{operatorReason}</div>
        </div>
        <div style={{ padding: '6px 10px', borderRadius: '999px', background: 'rgba(248, 113, 113, 0.14)', color: '#fecdd3', fontWeight: 800, fontSize: '0.68rem', letterSpacing: '0.08em' }}>
          {sceneVersion || 'no-scene-version'}
        </div>
      </div>

      <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700, lineHeight: 1.45 }}>
        <div>MODE: {mode}</div>
        <div>ACTIVE ZONE: {activeZoneId || 'none'}</div>
        <div>FOCUS: {focusedSlug || 'none'}</div>
        <div>NAME: {focusedName || 'free roam'}</div>
        <div>TIER: {(focusedTier || 'none').toUpperCase()}</div>
        <div>DATA: {dataMode.toUpperCase()} / {companyCount} COMPANIES</div>
        <div>REVIEW ZONE: {operatorZoneLabel || 'none'}</div>
        <div>BUILD: {buildStamp}</div>
        <div>CLICK: {clickTarget || 'none'}</div>
        <div>CENTER: {centerTarget || 'none'}</div>
        <div>
          MARK: {markedPoint ? `${Math.round(markedPoint[0])}, ${Math.round(markedPoint[1])}, ${Math.round(markedPoint[2])}` : 'none'}
        </div>
      </div>

      <ExpoOperatorInspectionSummary inspector={inspector} />

      <ValidationCard
        title="ZONE VALIDATION"
        validation={operatorZoneValidation}
      />

      <FixRoutingCard
        title="FIX ROUTING"
        routes={operatorZoneFixRoutes}
      />

      <VisualDefectsCard
        title="VISUAL DEFECTS"
        defects={operatorZoneVisualDefects}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
        <OwnershipCard entry={centerTargetEntry} title="CENTER OWNER" />
        <OwnershipCard entry={clickTargetEntry} title="CLICK OWNER" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
        <button onClick={onFocusHero} style={{ ...panelStyle, padding: '9px 12px', fontWeight: 800, cursor: 'pointer' }}>HERO</button>
        <button onClick={onFocusPremium} style={{ ...panelStyle, padding: '9px 12px', fontWeight: 800, cursor: 'pointer' }}>PREMIUM</button>
        <button onClick={onFocusElite} style={{ ...panelStyle, padding: '9px 12px', fontWeight: 800, cursor: 'pointer' }}>ELITE</button>
        <button onClick={onClearFocus} style={{ ...panelStyle, padding: '9px 12px', fontWeight: 800, cursor: 'pointer' }}>CLEAR FOCUS</button>
        <button onClick={onSetMark} style={{ ...panelStyle, padding: '9px 12px', fontWeight: 800, cursor: 'pointer' }}>SET MARK</button>
        <button onClick={onToggleDebug} style={{ ...panelStyle, padding: '9px 12px', fontWeight: 800, cursor: 'pointer', background: debug ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.82), rgba(153, 27, 27, 0.76))' : panelStyle.background }}>DEBUG {debug ? 'ON' : 'OFF'}</button>
        <button onClick={onAddClickTarget} style={{ ...panelStyle, padding: '9px 12px', fontWeight: 800, cursor: 'pointer' }}>ADD 1</button>
        <button onClick={onAddClickStack} style={{ ...panelStyle, padding: '9px 12px', fontWeight: 800, cursor: 'pointer' }}>ADD STACK</button>
        <button onClick={onClearTargetBasket} style={{ ...panelStyle, padding: '9px 12px', fontWeight: 800, cursor: 'pointer', gridColumn: 'span 2' }}>CLEAR TARGETS ({targetBasket.length})</button>
      </div>

      {centerStack.length > 0 && (
        <div style={{ fontSize: '0.68rem', color: '#cbd5e1', lineHeight: 1.4 }}>
          CENTER STACK: {centerStack.join(' | ')}
        </div>
      )}
      {clickStack.length > 0 && (
        <div style={{ fontSize: '0.68rem', color: '#cbd5e1', lineHeight: 1.4 }}>
          CLICK STACK: {clickStack.join(' | ')}
        </div>
      )}

      <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.45 }}>
        <div>LAYERS: {Object.entries(layerStates).map(([key, value]) => `${key.toUpperCase()}:${value ? 'ON' : 'OFF'}`).join('  ')}</div>
        <div>SECTIONS: {Object.entries(sectionStates).map(([key, value]) => `${key.toUpperCase()}:${value ? 'ON' : 'OFF'}`).join('  ')}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
        <button onClick={() => onToggleLayer('promenade')} style={{ ...panelStyle, padding: '8px 10px', fontWeight: 800, cursor: 'pointer' }}>PROM</button>
        <button onClick={() => onToggleLayer('city')} style={{ ...panelStyle, padding: '8px 10px', fontWeight: 800, cursor: 'pointer' }}>CITY</button>
        <button onClick={() => onToggleLayer('stadium')} style={{ ...panelStyle, padding: '8px 10px', fontWeight: 800, cursor: 'pointer' }}>STADIUM</button>
        <button onClick={() => onToggleLayer('booths')} style={{ ...panelStyle, padding: '8px 10px', fontWeight: 800, cursor: 'pointer' }}>BOOTHS</button>
        <button onClick={() => onToggleLayer('skyline')} style={{ ...panelStyle, padding: '8px 10px', fontWeight: 800, cursor: 'pointer', gridColumn: 'span 2' }}>SKYLINE</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
        <button onClick={() => onToggleSection('arrival')} style={{ ...panelStyle, padding: '8px 10px', fontWeight: 800, cursor: 'pointer' }}>ARR</button>
        <button onClick={() => onToggleSection('left')} style={{ ...panelStyle, padding: '8px 10px', fontWeight: 800, cursor: 'pointer' }}>LEFT</button>
        <button onClick={() => onToggleSection('middle')} style={{ ...panelStyle, padding: '8px 10px', fontWeight: 800, cursor: 'pointer' }}>MID</button>
        <button onClick={() => onToggleSection('right')} style={{ ...panelStyle, padding: '8px 10px', fontWeight: 800, cursor: 'pointer' }}>RIGHT</button>
        <button onClick={() => onToggleSection('stadium')} style={{ ...panelStyle, padding: '8px 10px', fontWeight: 800, cursor: 'pointer', gridColumn: 'span 2' }}>STADIUM</button>
      </div>
    </div>
  );
}
