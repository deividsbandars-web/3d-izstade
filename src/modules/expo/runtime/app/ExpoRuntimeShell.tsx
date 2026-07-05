import { ExpoLobby } from '../../components/ExpoLobby';
import { Expo3DLoader } from '../world';
import type { ExpoMode } from '../../state/expoRuntime';
import GlobalChat from '../../../../components/chat/GlobalChat';

export function ExpoRuntimeShell({
  hudLayer,
  isTouchDevice = false,
  isLoading,
  mode,
  onBack,
  onOpenModularHomes,
  onSetMode,
  operatorLayer,
  sceneLayer,
}: {
  hudLayer: React.ReactNode;
  isTouchDevice?: boolean;
  isLoading: boolean;
  mode: ExpoMode;
  onBack: () => void;
  onOpenModularHomes: () => void;
  onSetMode: (mode: ExpoMode) => void;
  operatorLayer: React.ReactNode;
  sceneLayer: React.ReactNode;
}) {
  if (isLoading) {
    return <Expo3DLoader />;
  }

  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        height: '100dvh',
        background: '#000',
        position: 'relative',
        touchAction: isTouchDevice && mode !== 'menu' ? 'none' : 'auto',
        overscrollBehavior: isTouchDevice && mode !== 'menu' ? 'none' : 'auto',
      }}
    >
      {mode === 'menu' && (
        <ExpoLobby
          isTouchDevice={isTouchDevice}
          onOpenModularHomes={onOpenModularHomes}
          onSelectMode={onSetMode}
          onBack={onBack}
        />
      )}

      {mode !== 'menu' && (
        <>
          <div style={{ inset: 0, position: 'absolute', zIndex: 0 }}>
            {sceneLayer}
          </div>
          <div style={{ inset: 0, pointerEvents: 'none', position: 'absolute', zIndex: 10 }}>
            {operatorLayer}
          </div>
          {hudLayer}
          <GlobalChat expoMobileCompact={isTouchDevice} />
        </>
      )}
    </div>
  );
}
