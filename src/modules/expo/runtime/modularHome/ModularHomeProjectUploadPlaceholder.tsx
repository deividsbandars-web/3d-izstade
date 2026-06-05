import { useMemo, useState } from 'react';

type ModularHomeProjectUploadPlaceholderProps = {
  isTouchDevice?: boolean;
};

const MANUAL_CONVERSION_SERVICES = [
  {
    detail: 'Convert an existing plan or model into a Web3D walkthrough concept.',
    id: '3d-visualization',
    label: '3D visualization',
  },
  {
    detail: 'Review how a plan can be adapted into timber modular sections.',
    id: 'modular-adaptation',
    label: 'Modular adaptation',
  },
  {
    detail: 'Use drawings as the basis for a manual scope and estimate review.',
    id: 'quote-from-existing-plan',
    label: 'Quote from existing plan',
  },
  {
    detail: 'Start with site notes, sketches or goals before a full model exists.',
    id: 'design-consultation',
    label: 'Design consultation',
  },
] as const;

const PROJECT_UPLOAD_FLOW_STEPS = [
  {
    label: 'Choose review service',
    detail: 'Select whether the plan is for visualization, modular adaptation, quote review or design advice.',
  },
  {
    label: 'Prepare plan package',
    detail: 'Future manual review can accept drawings, BIM files or existing 3D models.',
  },
  {
    label: 'Manual conversion review',
    detail: 'A human review defines scope, missing details and the safest conversion path.',
  },
  {
    label: '3D preview or quote path',
    detail: 'A Web3D preview, modular adaptation note or quote discussion can be prepared after review.',
  },
] as const;

const FUTURE_PROJECT_UPLOAD_FORMATS = ['PDF', 'DWG', 'IFC', 'GLB/GLTF'] as const;

const PROJECT_UPLOAD_PREPARE_ITEMS = [
  'Plan files or 3D model if available',
  'Site/country and target build timeline',
  'Preferred service and expected output',
  'Known constraints: budget, transport, permits or utilities',
] as const;

export function ModularHomeProjectUploadPlaceholder({ isTouchDevice = false }: ModularHomeProjectUploadPlaceholderProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<(typeof MANUAL_CONVERSION_SERVICES)[number]['id']>('3d-visualization');
  const selectedService = useMemo(
    () => MANUAL_CONVERSION_SERVICES.find((service) => service.id === selectedServiceId) ?? MANUAL_CONVERSION_SERVICES[0],
    [selectedServiceId],
  );

  return (
    <section
      aria-label="Manual project plan conversion workflow"
      data-home-project-upload-placeholder="true"
      data-home-project-upload-service={selectedService.id}
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
            Manual plan review
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
            Upload your plan
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
          Local preview
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
        Supported future review formats: PDF, DWG, IFC and GLB/GLTF. This preview explains the manual workflow only;
        no file is uploaded, stored, converted or processed by AI.
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
        aria-label="Manual conversion service choices"
        style={{
          borderTop: '1px solid rgba(125, 211, 252, 0.18)',
          display: 'grid',
          gap: '7px',
          marginTop: isTouchDevice ? '9px' : '10px',
          paddingTop: isTouchDevice ? '9px' : '10px',
        }}
      >
        <div
          style={{
            color: '#e0f2fe',
            fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
            fontWeight: 950,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Choose service
        </div>
        <div style={{ display: 'grid', gap: '6px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          {MANUAL_CONVERSION_SERVICES.map((service) => {
            const selected = service.id === selectedService.id;

            return (
              <button
                aria-pressed={selected}
                data-home-project-upload-service-option={service.id}
                key={service.id}
                onClick={() => setSelectedServiceId(service.id)}
                style={{
                  background: selected ? 'rgba(251, 191, 36, 0.18)' : 'rgba(2, 6, 23, 0.34)',
                  border: selected ? '1px solid rgba(251, 191, 36, 0.48)' : '1px solid rgba(125, 211, 252, 0.18)',
                  borderRadius: '12px',
                  color: selected ? '#fef3c7' : '#dbeafe',
                  cursor: 'pointer',
                  font: 'inherit',
                  fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
                  fontWeight: 920,
                  lineHeight: 1.12,
                  minHeight: isTouchDevice ? '42px' : '46px',
                  padding: '8px',
                  textAlign: 'left',
                }}
                type="button"
              >
                {service.label}
              </button>
            );
          })}
        </div>
        <div
          data-home-project-upload-selected-service="true"
          style={{
            background: 'rgba(2, 6, 23, 0.36)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
            borderRadius: '13px',
            color: '#fde68a',
            fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
            fontWeight: 820,
            lineHeight: 1.32,
            padding: '8px 9px',
          }}
        >
          <strong style={{ color: '#fef3c7', display: 'block', fontWeight: 950, marginBottom: '3px' }}>
            {selectedService.label}
          </strong>
          {selectedService.detail}
        </div>
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
        aria-label="Manual review preparation checklist"
        style={{
          background: 'rgba(2, 6, 23, 0.28)',
          border: '1px solid rgba(125, 211, 252, 0.14)',
          borderRadius: '13px',
          marginTop: isTouchDevice ? '9px' : '10px',
          padding: '8px 9px',
        }}
      >
        <div
          style={{
            color: '#e0f2fe',
            fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
            fontWeight: 950,
            letterSpacing: '0.08em',
            marginBottom: '6px',
            textTransform: 'uppercase',
          }}
        >
          What to prepare
        </div>
        <div style={{ display: 'grid', gap: '5px' }}>
          {PROJECT_UPLOAD_PREPARE_ITEMS.map((item) => (
            <div
              data-home-project-upload-prepare-item={item}
              key={item}
              style={{
                color: '#bae6fd',
                display: 'grid',
                fontSize: isTouchDevice ? '0.55rem' : '0.59rem',
                fontWeight: 760,
                gap: '6px',
                gridTemplateColumns: '6px 1fr',
                lineHeight: 1.18,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  background: '#38bdf8',
                  borderRadius: '999px',
                  display: 'block',
                  height: '6px',
                  marginTop: '4px',
                  width: '6px',
                }}
              />
              <span>{item}</span>
            </div>
          ))}
        </div>
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
        Manual conversion workflow placeholder only. Real upload, storage, conversion review and quote handoff are not
        enabled until the backend and privacy flow are approved.
      </div>
    </section>
  );
}
