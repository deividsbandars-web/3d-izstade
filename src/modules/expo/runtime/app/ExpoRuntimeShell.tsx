import { ExpoLobby } from '../../components/ExpoLobby';
import { Expo3DLoader } from '../world';
import PixelStreamingViewer from '../../PixelStreamingViewer';
import type { ExpoMode } from '../../state/expoRuntime';
import GlobalChat from '../../../../components/chat/GlobalChat';

export function ExpoRuntimeShell({
  hudLayer,
  isLoading,
  mode,
  onBack,
  onSetMode,
  operatorLayer,
  pixelStreamingStatus,
  sceneLayer,
}: {
  hudLayer: React.ReactNode;
  isLoading: boolean;
  mode: ExpoMode;
  onBack: () => void;
  onSetMode: (mode: ExpoMode) => void;
  operatorLayer: React.ReactNode;
  pixelStreamingStatus: {
    availability: unknown;
    config: { signalingUrl?: string | null };
    isAvailable: boolean;
    runtimeStatus: unknown;
  };
  sceneLayer: React.ReactNode;
}) {
  if (isLoading) {
    return <Expo3DLoader />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
      {mode === 'menu' && (
        <ExpoLobby
          onSelectMode={(nextMode) => {
            if (nextMode === 'unreal' && !pixelStreamingStatus.isAvailable) {
              return;
            }

            onSetMode(nextMode);
          }}
          onBack={onBack}
          premiumAvailability={pixelStreamingStatus.availability as never}
          premiumSignalingUrl={pixelStreamingStatus.config.signalingUrl ?? null}
          premiumRuntimeStatus={pixelStreamingStatus.runtimeStatus as never}
        />
      )}

      {mode === 'unreal' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2000 }}>
          <PixelStreamingViewer
            availability={pixelStreamingStatus.availability as never}
            config={pixelStreamingStatus.config as never}
            runtimeStatus={pixelStreamingStatus.runtimeStatus as never}
            onClose={() => onSetMode('menu')}
          />
        </div>
      )}

      {mode !== 'menu' && mode !== 'unreal' && (
        <>
          {operatorLayer}
          {hudLayer}
          {sceneLayer}
          <GlobalChat />
        </>
      )}
    </div>
  );
}
