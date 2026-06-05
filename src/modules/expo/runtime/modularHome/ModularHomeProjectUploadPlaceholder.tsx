type ModularHomeProjectUploadPlaceholderProps = {
  isTouchDevice?: boolean;
};

const PROJECT_UPLOAD_FLOW_STEPS = [
  {
    label: 'Upload plan / drawing',
    detail: 'PDF, DWG and IFC support is planned.',
  },
  {
    label: 'Manual review / conversion',
    detail: 'We review the source files before creating a 3D preview.',
  },
  {
    label: '3D preview created',
    detail: 'A walkable project preview is prepared for review.',
  },
  {
    label: 'Quote generated',
    detail: 'A build estimate can be prepared after scope review.',
  },
] as const;

const FUTURE_PROJECT_UPLOAD_FORMATS = ['PDF', 'DWG', 'IFC'] as const;

export function ModularHomeProjectUploadPlaceholder({ isTouchDevice = false }: ModularHomeProjectUploadPlaceholderProps) {
  return (
    <section
      aria-label="Project plan upload placeholder workflow"
      data-home-project-upload-placeholder="true"
      style={{
        background: 'linear-gradient(180deg, rgba(8, 47, 73, 0.78), rgba(15, 23, 42, 0.66))',
        border: '1px solid rgba(56, 189, 248, 0.28)',
        borderRadius: isTouchDevice ? '15px' : '17px',
        marginTop: isTouchDevice ? '10px' : '12px',
        padding: isTouchDevice ? '10px' : '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'start' }}>
        <div>
          <div
            style={{
              color: '#7dd3fc',
              fontSize: '0.58rem',
              fontWeight: 950,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Project plan review
          </div>
          <div
            style={{
              color: '#f0f9ff',
              fontSize: isTouchDevice ? '0.86rem' : '0.94rem',
              fontWeight: 950,
              lineHeight: 1.08,
              marginTop: '5px',
            }}
          >
            Upload your project plan
          </div>
        </div>
        <span
          data-home-project-upload-status="placeholder"
          style={{
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.32)',
            borderRadius: '999px',
            color: '#fde68a',
            fontSize: '0.54rem',
            fontWeight: 950,
            letterSpacing: '0.1em',
            padding: '4px 7px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          Coming soon
        </span>
      </div>

      <div
        style={{
          color: '#bae6fd',
          fontSize: isTouchDevice ? '0.62rem' : '0.66rem',
          fontWeight: 820,
          lineHeight: 1.34,
          marginTop: '7px',
        }}
      >
        PDF/DWG/IFC support coming soon. For now, request a manual 3D conversion review.
      </div>

      <div
        aria-label="Future project upload formats"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginTop: isTouchDevice ? '8px' : '9px',
        }}
      >
        {FUTURE_PROJECT_UPLOAD_FORMATS.map((format) => (
          <span
            key={format}
            data-home-project-upload-format={format}
            style={{
              background: 'rgba(14, 165, 233, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.28)',
              borderRadius: '999px',
              color: '#e0f2fe',
              fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
              fontWeight: 920,
              lineHeight: 1,
              padding: '6px 8px',
            }}
          >
            {format}
          </span>
        ))}
      </div>

      <div
        aria-label="Future project conversion workflow"
        style={{
          borderTop: '1px solid rgba(125, 211, 252, 0.18)',
          display: 'grid',
          gap: '7px',
          marginTop: isTouchDevice ? '9px' : '10px',
          paddingTop: isTouchDevice ? '9px' : '10px',
        }}
      >
        {PROJECT_UPLOAD_FLOW_STEPS.map((step, index) => (
          <div
            key={step.label}
            data-home-project-upload-step={step.label}
            style={{
              display: 'grid',
              gap: '8px',
              gridTemplateColumns: '22px 1fr',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                alignItems: 'center',
                background: 'rgba(56, 189, 248, 0.16)',
                border: '1px solid rgba(125, 211, 252, 0.28)',
                borderRadius: '999px',
                color: '#e0f2fe',
                display: 'inline-flex',
                fontSize: '0.56rem',
                fontWeight: 950,
                height: '22px',
                justifyContent: 'center',
                lineHeight: 1,
                width: '22px',
              }}
            >
              {index + 1}
            </span>
            <span>
              <span
                style={{
                  color: '#f0f9ff',
                  display: 'block',
                  fontSize: isTouchDevice ? '0.62rem' : '0.66rem',
                  fontWeight: 920,
                  lineHeight: 1.14,
                }}
              >
                {step.label}
              </span>
              <span
                style={{
                  color: '#bae6fd',
                  display: 'block',
                  fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
                  fontWeight: 760,
                  lineHeight: 1.22,
                  marginTop: '2px',
                }}
              >
                {step.detail}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div
        data-home-project-upload-cta="manual-review-placeholder"
        style={{
          background: 'rgba(2, 6, 23, 0.36)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          borderRadius: '13px',
          color: '#cffafe',
          fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
          fontWeight: 880,
          lineHeight: 1.32,
          marginTop: isTouchDevice ? '9px' : '10px',
          padding: '8px 9px',
        }}
      >
        Manual review request placeholder only. No file is uploaded, stored or converted in this preview.
      </div>
    </section>
  );
}
