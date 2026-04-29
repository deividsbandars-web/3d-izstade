import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useZoneSystem } from '../../../../hooks/useZoneSystem';
import { ExpoWorldHud } from './ExpoWorldHud';
import { useExpoPresence } from '../../hooks/useExpoPresence';
import { useExpoSceneData } from '../../hooks/useExpoSceneData';
import { usePixelStreamingStatus } from '../../hooks/usePixelStreamingStatus';
import { buildExpoWorldContract } from '../../world-contract';
import { useExpoOperatorLayer } from '../operator';
import { ExpoRuntimeShell } from './ExpoRuntimeShell';
import { ExpoSceneShell } from './ExpoSceneShell';
import { useExpoRuntimeErrorBridge } from './useExpoRuntimeErrorBridge';
import { useExpoRuntimeSession } from './useExpoRuntimeSession';
import { WorldInspectionProvider } from '../world/inspection/worldInspectionState';

export default function Expo3D() {
  const runtimeSession = useExpoRuntimeSession();
  const { data, isLoading } = useExpoSceneData();

  return (
    <WorldInspectionProvider>
      <ExpoRuntimeExperience
        data={data}
        isLoading={isLoading}
        runtimeSession={runtimeSession}
      />
    </WorldInspectionProvider>
  );
}

function ExpoRuntimeExperience({
  data,
  isLoading,
  runtimeSession,
}: {
  data: ReturnType<typeof useExpoSceneData>['data'];
  isLoading: boolean;
  runtimeSession: ReturnType<typeof useExpoRuntimeSession>;
}) {
  const nav = useNavigate();
  const worldContract = useMemo(() => buildExpoWorldContract(data), [data]);
  const inspectionEnabled = import.meta.env.DEV || runtimeSession.operatorSession.enabled;
  const pixelStreamingStatus = usePixelStreamingStatus();
  const { guests, playerPos, isMicOn, isSpeaking, setIsMicOn, handlePlayerMove } = useExpoPresence(runtimeSession.mode);
  const { activeZone, zoneSystem } = useZoneSystem(playerPos as any);
  const operatorSceneLayer = useExpoOperatorLayer({
    activeZoneId: activeZone?.id ? String(activeZone.id) : null,
    initialUrlFocus: runtimeSession.initialUrlFocus,
    mode: runtimeSession.mode,
    playerPos,
    sceneVersion: data?.sceneVersion ? String(data.sceneVersion) : null,
    setMode: runtimeSession.setMode,
    worldContract,
  });

  useExpoRuntimeErrorBridge(import.meta.env.DEV || operatorSceneLayer.session.enabled);

  return (
    <ExpoRuntimeShell
      hudLayer={(
        <ExpoWorldHud
          guests={guests}
          isMicOn={isMicOn}
          isSpeaking={isSpeaking}
          isTouchDevice={runtimeSession.isTouchDevice}
          onMoveTouch={runtimeSession.setMobileMoveIntent}
          playerPos={playerPos}
          sectorMarkers={worldContract.sectorMarkers}
          visualProfile={worldContract.visualProfile}
          onToggleMic={() => setIsMicOn((value) => !value)}
          onExit={() => {
            document.exitPointerLock();
            runtimeSession.setMode('menu');
          }}
        />
      )}
      isLoading={isLoading}
      mode={runtimeSession.mode}
      onBack={() => nav('/')}
      onSetMode={runtimeSession.setMode}
      operatorLayer={operatorSceneLayer.layer}
      pixelStreamingStatus={pixelStreamingStatus}
      sceneLayer={(
        <ExpoSceneShell
          activeZone={activeZone}
          debug={operatorSceneLayer.debug}
          guests={guests}
          mobileMoveIntent={runtimeSession.mobileMoveIntent}
          mode={runtimeSession.mode}
          onMove={handlePlayerMove}
          inspectionEnabled={inspectionEnabled}
          runtimeLayerToggles={(import.meta.env.DEV || operatorSceneLayer.session.enabled) ? operatorSceneLayer.runtimeLayerToggles : undefined}
          runtimeSectionToggles={(import.meta.env.DEV || operatorSceneLayer.session.enabled) ? operatorSceneLayer.runtimeSectionToggles : undefined}
          sceneVersion={data?.sceneVersion ? String(data.sceneVersion) : null}
          startViewOverride={operatorSceneLayer.effectiveStartViewOverride}
          worldContract={worldContract}
          zoneSystem={zoneSystem}
        />
      )}
    />
  );
}
