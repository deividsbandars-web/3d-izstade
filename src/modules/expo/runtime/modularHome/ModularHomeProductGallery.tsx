import {
  MODULAR_HOME_VIEW_MODE_OPTIONS,
  type ModularHomeConfiguratorState,
  type ModularHomeViewModeOption,
} from './modularHomeConfigurator';
import { type ModularHomePreviewConfig } from './modularHomeConfig';
import {
  formatHomeEstimateEur,
  type ModularHomeEstimate,
} from './modularHomeEstimate';
import {
  type ModularHomeDimensionPreset,
  type ModularHomeDimensionSummary,
  type ModularHomeLayoutVariant,
  type ModularHomeProduct,
  type ModularHomeProductConfigSummary,
  type ModularHomeRoomMeasurementSummary,
  type ModularHomeRoomUseProfile,
} from './modularHomeProducts';

const HOME_DEMO_BULLETS = [
  'Preset-based home walkthrough',
  'Facade, roof and trim controls',
  'Estimate preview',
  'Request a build quote',
] as const;

type ModularHomeProductGalleryProps = {
  config: ModularHomeConfiguratorState;
  configSummary: ModularHomeProductConfigSummary;
  dimensionPreset: ModularHomeDimensionPreset | null;
  dimensionSummary: ModularHomeDimensionSummary;
  estimate: ModularHomeEstimate;
  isTouchDevice?: boolean;
  layoutVariant: ModularHomeLayoutVariant | null;
  product: ModularHomeProduct;
  roomMeasurementSummary: ModularHomeRoomMeasurementSummary;
  roomUseProfile: ModularHomeRoomUseProfile | null;
  setViewMode: (viewMode: ModularHomeViewModeOption) => void;
  template: ModularHomePreviewConfig;
  viewMode: ModularHomeViewModeOption;
};

function formatQuantityM2(value: number): string {
  return `${value.toLocaleString('en-IE', { maximumFractionDigits: 2 })} m${String.fromCharCode(178)}`;
}

export function ModularHomeProductGallery({
  config,
  configSummary,
  dimensionPreset,
  dimensionSummary,
  estimate,
  isTouchDevice = false,
  layoutVariant,
  product,
  roomMeasurementSummary,
  roomUseProfile,
  setViewMode,
  template,
  viewMode,
}: ModularHomeProductGalleryProps) {
  const dimensionRows = [
    ['dimension-preset', 'Preset', dimensionSummary.dimensionPresetLabel],
    ['floor-area', 'Floor area', dimensionSummary.floorAreaLabel],
    ['footprint', 'Footprint', dimensionSummary.footprintLabel],
    ['ceiling-height', 'Ceiling', dimensionSummary.ceilingHeightLabel],
    ['module-count', 'Modules', dimensionSummary.moduleCountLabel],
    ['transport-modules', 'Transport', dimensionSummary.transportModuleCountLabel],
    ['build-category', 'Build note', dimensionSummary.buildCategoryNote],
  ] as const;

  return (
        <>
      <section
        aria-label={`${product.name} home preview`}
        data-home-demo-info-card="true"
        data-home-demo-product-id={product.id}
        style={{
          background: 'rgba(15, 23, 42, 0.58)',
          border: '1px solid rgba(251, 191, 36, 0.22)',
          borderRadius: isTouchDevice ? '15px' : '17px',
          marginTop: isTouchDevice ? '10px' : '12px',
          padding: isTouchDevice ? '11px' : '13px',
        }}
      >
        <div
          style={{
            color: '#fef3c7',
            fontSize: isTouchDevice ? '0.94rem' : '1.02rem',
            fontWeight: 950,
            letterSpacing: '-0.02em',
            lineHeight: 1.06,
          }}
        >
          {product.name}
        </div>
        <div
          style={{
            color: '#fed7aa',
            fontSize: isTouchDevice ? '0.66rem' : '0.72rem',
            fontWeight: 800,
            lineHeight: 1.32,
            marginTop: '6px',
          }}
        >
          {product.shortDescription}
        </div>

        {layoutVariant ? (
          <div
            data-home-demo-layout-variant={layoutVariant.id}
            style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.22)',
              borderRadius: '12px',
              color: '#bbf7d0',
              fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
              fontWeight: 820,
              lineHeight: 1.3,
              marginTop: '8px',
              padding: isTouchDevice ? '7px 8px' : '8px 9px',
            }}
          >
            <span style={{ color: '#86efac', fontWeight: 950 }}>Layout: {layoutVariant.label}.</span> {layoutVariant.summaryNote}
          </div>
        ) : null}

        {roomUseProfile ? (
          <div
            data-home-demo-room-use-profile={roomUseProfile.id}
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(96, 165, 250, 0.24)',
              borderRadius: '12px',
              color: '#bfdbfe',
              fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
              fontWeight: 820,
              lineHeight: 1.3,
              marginTop: '8px',
              padding: isTouchDevice ? '7px 8px' : '8px 9px',
            }}
          >
            <span style={{ color: '#93c5fd', fontWeight: 950 }}>Room use: {roomUseProfile.label}.</span> {roomUseProfile.summaryNote}
          </div>
        ) : null}

        <div
          aria-label={`${product.name} facts`}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginTop: isTouchDevice ? '9px' : '10px',
          }}
        >
          {[
            product.bedrooms > 0 ? `${product.bedrooms} bedroom${product.bedrooms === 1 ? '' : 's'}` : 'sauna/guest module',
            `${product.bathrooms} bathroom${product.bathrooms === 1 ? '' : 's'}`,
            product.targetUseCase,
          ].map((fact) => (
            <span
              key={fact}
              data-home-demo-fact={fact}
              style={{
                background: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.24)',
                borderRadius: '999px',
                color: '#ffedd5',
                fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
                fontWeight: 900,
                lineHeight: 1,
                padding: '6px 8px',
                whiteSpace: 'nowrap',
              }}
            >
              {fact}
            </span>
          ))}
        </div>

        <div
          aria-label={`${product.name} project scale`}
          data-home-demo-dimensions-card="true"
          data-home-demo-dimension-floor-area={dimensionSummary.floorAreaLabel}
          data-home-demo-dimension-footprint={dimensionSummary.footprintLabel}
          data-home-demo-dimension-ceiling={dimensionSummary.ceilingHeightLabel}
          data-home-demo-dimension-module-count={dimensionSummary.moduleCountLabel}
          data-home-demo-dimension-transport={dimensionSummary.transportModuleCountLabel}
          data-home-demo-dimension-build-note={dimensionSummary.buildCategoryNote}
          style={{
            background: 'rgba(251, 191, 36, 0.07)',
            border: '1px solid rgba(251, 191, 36, 0.18)',
            borderRadius: '13px',
            display: 'grid',
            gap: '7px',
            marginTop: isTouchDevice ? '10px' : '11px',
            padding: isTouchDevice ? '9px' : '10px',
          }}
        >
          <div
            style={{
              color: '#fde68a',
              fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
              fontWeight: 950,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Project scale
          </div>
          <div
            style={{
              display: 'grid',
              gap: isTouchDevice ? '7px' : '8px',
              gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))',
            }}
          >
            {dimensionRows.map(([key, label, value]) => (
              <div
                key={key}
                data-home-demo-dimension={key}
                data-home-demo-dimension-value={value}
                style={{
                  background: key === 'build-category' ? 'rgba(15, 23, 42, 0.42)' : 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  gridColumn: key === 'build-category' ? '1 / -1' : 'auto',
                  padding: isTouchDevice ? '6px 7px' : '7px 8px',
                }}
              >
                <div style={{ color: '#fbbf24', fontSize: '0.5rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {label}
                </div>
                <div style={{ color: '#fff7ed', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 880, lineHeight: 1.22, marginTop: '3px' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          aria-label={`${product.name} compact estimate total`}
          data-home-estimate-compact-total="true"
          data-home-estimate-compact-total-value={estimate.estimatedTotal}
          style={{
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.16), rgba(251, 191, 36, 0.1))',
            border: '1px solid rgba(96, 165, 250, 0.22)',
            borderRadius: '13px',
            display: 'grid',
            gap: '8px',
            gridTemplateColumns: '1fr auto',
            marginTop: isTouchDevice ? '9px' : '10px',
            padding: isTouchDevice ? '8px 9px' : '9px 10px',
          }}
        >
          <div>
            <div style={{ color: '#bfdbfe', fontSize: '0.52rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Structured estimate
            </div>
            <div style={{ color: '#dbeafe', fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 800, lineHeight: 1.25, marginTop: '3px' }}>
              Includes modules, selected options, transport, installation and VAT placeholder.
            </div>
          </div>
          <div style={{ color: '#fef9c3', fontSize: isTouchDevice ? '0.86rem' : '0.98rem', fontWeight: 980, letterSpacing: '-0.03em', textAlign: 'right' }}>
            {formatHomeEstimateEur(estimate.estimatedTotal)}
          </div>
        </div>

        <div
          aria-label={`${template.name} static hotspots`}
          style={{
            borderTop: '1px solid rgba(251, 191, 36, 0.16)',
            display: 'grid',
            gap: isTouchDevice ? '7px' : '8px',
            gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))',
            marginTop: isTouchDevice ? '10px' : '11px',
            paddingTop: isTouchDevice ? '9px' : '10px',
          }}
        >
          {(roomMeasurementSummary.rooms.length > 0
            ? roomMeasurementSummary.rooms.map((room) => room.label).slice(0, 5)
            : (layoutVariant?.roomLabels ?? template.interiorLabels)).map((hotspot) => (
            <div
              key={hotspot}
              data-home-demo-hotspot={hotspot}
              style={{
                alignItems: 'center',
                color: '#fff7ed',
                display: 'grid',
                fontSize: isTouchDevice ? '0.6rem' : '0.64rem',
                fontWeight: 880,
                gap: '6px',
                gridTemplateColumns: '7px 1fr',
                lineHeight: 1.15,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #22c55e)',
                  borderRadius: '999px',
                  display: 'block',
                  height: '7px',
                  width: '7px',
                }}
              />
              <span>{hotspot}</span>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-label={`${product.name} viewing modes`}
        data-home-view-mode-panel="true"
        data-home-view-mode={viewMode}
        style={{
          background: 'rgba(2, 6, 23, 0.36)',
          border: '1px solid rgba(96, 165, 250, 0.2)',
          borderRadius: isTouchDevice ? '15px' : '17px',
          marginTop: isTouchDevice ? '10px' : '12px',
          padding: isTouchDevice ? '10px' : '12px',
        }}
      >
        <div
          style={{
            color: '#bfdbfe',
            fontSize: '0.58rem',
            fontWeight: 950,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          View mode
        </div>
        <div
          style={{
            color: '#e0f2fe',
            fontSize: isTouchDevice ? '0.64rem' : '0.68rem',
            fontWeight: 780,
            lineHeight: 1.32,
            marginTop: '5px',
          }}
        >
          Switch between exterior, cutaway, interior and floorplan views to inspect the layout.
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: isTouchDevice ? '9px' : '10px' }}>
          {MODULAR_HOME_VIEW_MODE_OPTIONS.map((option) => {
            const selected = viewMode === option.key;

            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={selected}
                data-home-view-mode-option={option.key}
                data-home-view-mode-selected={selected ? 'true' : 'false'}
                title={option.note}
                onClick={(event) => {
                  event.stopPropagation();
                  setViewMode(option.key);
                }}
                style={{
                  background: selected ? 'linear-gradient(135deg, rgba(96, 165, 250, 0.34), rgba(34, 197, 94, 0.18))' : 'rgba(15, 23, 42, 0.5)',
                  border: selected ? '1px solid rgba(147, 197, 253, 0.62)' : '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '999px',
                  color: selected ? '#eff6ff' : '#cbd5e1',
                  cursor: 'pointer',
                  display: 'inline-grid',
                  font: 'inherit',
                  fontSize: isTouchDevice ? '0.58rem' : '0.61rem',
                  fontWeight: selected ? 950 : 850,
                  gap: '4px',
                  lineHeight: 1.08,
                  padding: isTouchDevice ? '7px 8px' : '7px 10px',
                  textAlign: 'left',
                }}
              >
                <span>{option.label}</span>
                <span style={{ color: selected ? '#bfdbfe' : '#94a3b8', fontSize: isTouchDevice ? '0.48rem' : '0.5rem', fontWeight: 760 }}>
                  {option.note}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {viewMode === 'floorplan' ? (
        <section
          aria-label={`${product.name} floorplan measurements`}
          data-home-floorplan-measurement-panel="true"
          data-home-floorplan-measurement-product={roomMeasurementSummary.product?.id ?? product.id}
          data-home-floorplan-measurement-layout={roomMeasurementSummary.layoutVariant?.id ?? config.layoutVariant}
          data-home-floorplan-measurement-room-count={roomMeasurementSummary.rooms.length}
          data-home-floorplan-measurement-room-total={roomMeasurementSummary.roomAreaTotalM2}
          data-home-floorplan-measurement-floor-area={roomMeasurementSummary.floorAreaM2}
          data-home-floorplan-measurement-ceiling={roomMeasurementSummary.ceilingHeightM}
          style={{
            background: 'linear-gradient(180deg, rgba(8, 47, 73, 0.64), rgba(15, 23, 42, 0.72))',
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
                Floorplan measurements
              </div>
              <div style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.68rem' : '0.72rem', fontWeight: 850, lineHeight: 1.28, marginTop: '5px' }}>
                {roomMeasurementSummary.layoutVariant?.label ?? configSummary.layoutVariant} room schedule for client discussion.
                {dimensionPreset ? ` ${dimensionPreset.floorplanNote}` : ''}
                {roomUseProfile ? ` ${roomUseProfile.label} profile keeps the room naming and interior package note aligned.` : ''}
              </div>
            </div>
            <div style={{ color: '#fef9c3', fontSize: isTouchDevice ? '0.78rem' : '0.88rem', fontWeight: 980, textAlign: 'right', whiteSpace: 'nowrap' }}>
              {formatQuantityM2(roomMeasurementSummary.roomAreaTotalM2)}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '6px',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              marginTop: isTouchDevice ? '8px' : '9px',
            }}
          >
            {[
              ['Total m²', formatQuantityM2(roomMeasurementSummary.floorAreaM2)],
              ['Room sum', formatQuantityM2(roomMeasurementSummary.roomAreaTotalM2)],
              ['Ceiling', `${roomMeasurementSummary.ceilingHeightM} m`],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  background: 'rgba(15, 23, 42, 0.44)',
                  border: '1px solid rgba(125, 211, 252, 0.16)',
                  borderRadius: '10px',
                  padding: isTouchDevice ? '6px 7px' : '7px 8px',
                }}
              >
                <div style={{ color: '#7dd3fc', fontSize: '0.5rem', fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {label}
                </div>
                <div style={{ color: '#fff7ed', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 900, marginTop: '3px' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gap: '6px',
              marginTop: isTouchDevice ? '9px' : '10px',
            }}
          >
            {roomMeasurementSummary.rooms.map((room) => (
              <div
                key={room.id}
                data-home-floorplan-room-measurement={room.id}
                data-home-floorplan-room-area={room.areaM2}
                data-home-floorplan-room-type={room.type}
                style={{
                  alignItems: 'center',
                  background: 'rgba(2, 6, 23, 0.38)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '11px',
                  display: 'grid',
                  gap: '8px',
                  gridTemplateColumns: '1fr auto',
                  padding: isTouchDevice ? '7px 8px' : '8px 9px',
                }}
              >
                <div>
                  <div style={{ color: '#f8fafc', fontSize: isTouchDevice ? '0.62rem' : '0.66rem', fontWeight: 920, lineHeight: 1.12 }}>
                    {room.label}
                  </div>
                  <div style={{ color: '#bae6fd', fontSize: isTouchDevice ? '0.5rem' : '0.54rem', fontWeight: 760, lineHeight: 1.25, marginTop: '3px' }}>
                    {room.note}
                  </div>
                </div>
                <div style={{ color: '#fde68a', fontSize: isTouchDevice ? '0.62rem' : '0.68rem', fontWeight: 980, whiteSpace: 'nowrap' }}>
                  {formatQuantityM2(room.areaM2)}
                </div>
              </div>
            ))}
          </div>

          <div
            data-home-floorplan-measurement-disclaimer={roomMeasurementSummary.disclaimer}
            style={{
              borderTop: '1px solid rgba(125, 211, 252, 0.14)',
              color: '#bae6fd',
              fontSize: isTouchDevice ? '0.52rem' : '0.56rem',
              fontWeight: 800,
              lineHeight: 1.28,
              marginTop: isTouchDevice ? '9px' : '10px',
              paddingTop: isTouchDevice ? '8px' : '9px',
            }}
          >
            {roomMeasurementSummary.disclaimer}
          </div>
        </section>
      ) : null}

      <div style={{ display: 'grid', gap: '7px', marginTop: isTouchDevice ? '10px' : '12px' }}>
        {HOME_DEMO_BULLETS.map((bullet) => (
          <div
            key={bullet}
            data-home-demo-bullet={bullet}
            style={{
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.54)',
              border: '1px solid rgba(251, 191, 36, 0.18)',
              borderRadius: '12px',
              color: '#ffedd5',
              display: 'grid',
              fontSize: isTouchDevice ? '0.64rem' : '0.69rem',
              fontWeight: 850,
              gap: '9px',
              gridTemplateColumns: '8px 1fr',
              lineHeight: 1.2,
              padding: isTouchDevice ? '7px 9px' : '8px 10px',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #22c55e)',
                borderRadius: '999px',
                display: 'block',
                height: '8px',
                width: '8px',
              }}
            />
            <span>{bullet}</span>
          </div>
        ))}
      </div>
        </>
  );
}
