import { type ChangeEvent } from 'react';
import {
  getHomeUploadPreviewSummary,
  HOME_UPLOAD_PREVIEW_MAX_FILE_BYTES,
  isHomeUploadPreviewEnabled,
  isHomeUploadPreviewRequested,
} from './homeUploadPreviewFlags';
import {
  clearModularHomeUploadPreviewFile,
  formatHomeUploadPreviewBytes,
  setModularHomeUploadPreviewFile,
  useModularHomeUploadPreviewState,
} from './modularHomeUploadPreviewState';

type ModularHomeUploadPreviewPanelProps = {
  isTouchDevice?: boolean;
};

function stopUploadPreviewHudEvent(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

export function ModularHomeUploadPreviewPanel({ isTouchDevice = false }: ModularHomeUploadPreviewPanelProps) {
  const requested = isHomeUploadPreviewRequested();
  const enabled = isHomeUploadPreviewEnabled();
  const summary = getHomeUploadPreviewSummary();
  const uploadState = useModularHomeUploadPreviewState();

  if (!requested) {
    return null;
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setModularHomeUploadPreviewFile(file);
    event.target.value = '';
  };

  return (
    <aside
      aria-label="Local modular home model upload preview"
      data-home-upload-preview-panel="true"
      data-home-upload-preview-enabled={enabled ? 'true' : 'false'}
      data-home-upload-preview-state={uploadState.status}
      onClick={stopUploadPreviewHudEvent}
      onMouseDown={stopUploadPreviewHudEvent}
      onPointerDown={stopUploadPreviewHudEvent}
      onTouchStart={stopUploadPreviewHudEvent}
      style={{
        position: 'absolute',
        right: isTouchDevice ? '12px' : '24px',
        top: isTouchDevice ? '72px' : '84px',
        zIndex: 118,
        width: isTouchDevice ? 'calc(100vw - 24px)' : '360px',
        maxWidth: isTouchDevice ? 'calc(100vw - 24px)' : 'calc(100vw - 560px)',
        padding: isTouchDevice ? '12px 13px' : '15px 16px',
        border: enabled ? '1px solid rgba(45, 212, 191, 0.38)' : '1px solid rgba(248, 113, 113, 0.34)',
        borderRadius: isTouchDevice ? '17px' : '20px',
        background:
          'radial-gradient(circle at 18% 0%, rgba(45, 212, 191, 0.18), transparent 34%), linear-gradient(180deg, rgba(4, 19, 28, 0.94), rgba(15, 23, 42, 0.84))',
        boxShadow: '0 22px 54px rgba(2, 6, 23, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        color: '#ecfeff',
        fontFamily: 'inherit',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start' }}>
        <div>
          <div
            style={{
              color: enabled ? '#5eead4' : '#fca5a5',
              fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
              fontWeight: 950,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Local GLB preview
          </div>
          <div style={{ fontSize: isTouchDevice ? '0.96rem' : '1.06rem', fontWeight: 950, letterSpacing: '-0.02em', lineHeight: 1.05, marginTop: '5px' }}>
            Uploaded house model viewer
          </div>
          <div style={{ marginTop: '6px', color: '#bae6fd', fontSize: isTouchDevice ? '0.64rem' : '0.7rem', fontWeight: 800, lineHeight: 1.28 }}>
            Local browser preview only. No upload, storage, conversion or AI processing.
          </div>
        </div>
        <div
          style={{
            background: enabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(248, 113, 113, 0.1)',
            border: enabled ? '1px solid rgba(34, 197, 94, 0.34)' : '1px solid rgba(248, 113, 113, 0.34)',
            borderRadius: '999px',
            color: enabled ? '#86efac' : '#fecaca',
            fontSize: '0.54rem',
            fontWeight: 950,
            letterSpacing: '0.1em',
            padding: '4px 7px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {enabled ? 'Dev local' : 'Blocked'}
        </div>
      </div>

      {!enabled ? (
        <div
          data-home-upload-preview-blocker="true"
          style={{
            background: 'rgba(127, 29, 29, 0.18)',
            border: '1px solid rgba(248, 113, 113, 0.24)',
            borderRadius: '14px',
            color: '#fecaca',
            fontSize: isTouchDevice ? '0.62rem' : '0.66rem',
            fontWeight: 820,
            lineHeight: 1.32,
            marginTop: '10px',
            padding: '9px 10px',
          }}
        >
          `homeUploadPreview` is local-only and is blocked on non-local hosts. Use localhost/dev for upload preview testing.
        </div>
      ) : (
        <>
          <label
            style={{
              background: 'rgba(15, 23, 42, 0.56)',
              border: '1px dashed rgba(45, 212, 191, 0.38)',
              borderRadius: '15px',
              color: '#cffafe',
              cursor: 'pointer',
              display: 'grid',
              fontSize: isTouchDevice ? '0.64rem' : '0.68rem',
              fontWeight: 850,
              gap: '7px',
              lineHeight: 1.3,
              marginTop: '11px',
              padding: isTouchDevice ? '10px' : '11px',
            }}
          >
            Choose local `.glb` or self-contained `.gltf`
            <input
              accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
              data-home-upload-preview-input="true"
              onChange={onFileChange}
              type="file"
              style={{
                color: '#e0f2fe',
                font: 'inherit',
                fontSize: isTouchDevice ? '0.6rem' : '0.64rem',
              }}
            />
          </label>

          <div
            style={{
              color: '#7dd3fc',
              fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
              fontWeight: 800,
              lineHeight: 1.3,
              marginTop: '8px',
            }}
          >
            Max {Math.round(HOME_UPLOAD_PREVIEW_MAX_FILE_BYTES / 1024 / 1024)} MB. IFC, CAD and drawing conversion are intentionally not enabled in this round.
          </div>

          <div
            style={{
              background: 'rgba(2, 6, 23, 0.36)',
              border: '1px solid rgba(125, 211, 252, 0.18)',
              borderRadius: '14px',
              display: 'grid',
              gap: '5px',
              marginTop: '10px',
              padding: '9px 10px',
            }}
          >
            <div style={{ color: '#bae6fd', fontSize: '0.56rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Preview status
            </div>
            <div data-home-upload-preview-filename="true" style={{ color: '#f0fdfa', fontSize: isTouchDevice ? '0.66rem' : '0.7rem', fontWeight: 900 }}>
              {uploadState.fileName ?? 'No local model selected'}
            </div>
            <div style={{ color: '#99f6e4', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 800 }}>
              {uploadState.status === 'ready'
                ? `${formatHomeUploadPreviewBytes(uploadState.fileSize)} / rendered from browser object URL`
                : uploadState.status === 'error'
                  ? uploadState.error
                  : `Accepted: ${summary.acceptedFormats.join(', ')}`}
            </div>
          </div>

          {uploadState.status !== 'empty' ? (
            <button
              type="button"
              data-home-upload-preview-clear="true"
              onClick={(event) => {
                event.stopPropagation();
                clearModularHomeUploadPreviewFile();
              }}
              style={{
                background: 'rgba(15, 23, 42, 0.62)',
                border: '1px solid rgba(148, 163, 184, 0.24)',
                borderRadius: '999px',
                color: '#e2e8f0',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: '0.58rem',
                fontWeight: 920,
                letterSpacing: '0.08em',
                marginTop: '9px',
                padding: '7px 9px',
                textTransform: 'uppercase',
              }}
            >
              Clear local preview
            </button>
          ) : null}
        </>
      )}
    </aside>
  );
}
