import type {
  PixelStreamingAvailability,
  PixelStreamingRuntimeConfig,
  PixelStreamingRuntimeStatus,
} from './services/pixelStreamingConfig';

interface PixelStreamingViewerProps {
  availability: PixelStreamingAvailability;
  config: PixelStreamingRuntimeConfig;
  onClose?: () => void;
  preferredStreamerIds?: string[];
  runtimeStatus: PixelStreamingRuntimeStatus | null;
}

export default function PixelStreamingViewer({
  availability,
  config,
  onClose,
  preferredStreamerIds = [],
  runtimeStatus,
}: PixelStreamingViewerProps) {
  const signalingUrl = config.signalingUrl ?? 'Not configured';
  const activeStreamerId = runtimeStatus?.session.activeStreamerId ?? preferredStreamerIds[0] ?? null;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#020617', overflow: 'hidden' }}>
      <div
        style={{
          alignItems: 'center',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          height: '100%',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ margin: 0 }}>Legacy Pixel Streaming viewer unavailable</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0, maxWidth: '560px' }}>
          Pixel Streaming is no longer part of the baseline sponsor expo runtime. Use the browser Web3D expo or operator
          tooling for premium streaming workflows.
        </p>
        <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
          Status: {availability} / Signaling: {signalingUrl}
          {activeStreamerId ? ` / Streamer: ${activeStreamerId}` : ''}
        </div>
      </div>

      {onClose ? (
        <button
          onClick={onClose}
          style={{
            background: 'rgba(239, 68, 68, 0.9)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold',
            left: '20px',
            padding: '10px 20px',
            position: 'absolute',
            top: '20px',
            zIndex: 100,
          }}
        >
          Back
        </button>
      ) : null}
    </div>
  );
}
