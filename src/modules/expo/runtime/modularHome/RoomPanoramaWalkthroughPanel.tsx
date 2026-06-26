import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  MODULAR_HOME_FLOOR_FINISH_OPTIONS,
  MODULAR_HOME_FURNITURE_MOOD_OPTIONS,
  MODULAR_HOME_INTERIOR_FLOOR_STYLE_OPTIONS,
  MODULAR_HOME_INTERIOR_ZONE_FOCUS_OPTIONS,
  MODULAR_HOME_KITCHEN_FINISH_OPTIONS,
  MODULAR_HOME_WALL_PANEL_STYLE_OPTIONS,
  type ModularHomeConfiguratorState,
  type ModularHomeInteriorZoneFocusOption,
  useModularHomeConfigurator,
} from './modularHomeConfigurator';

type RoomPanoramaWalkthroughPanelProps = {
  isTouchDevice?: boolean;
};

const WALKTHROUGH_PRESETS: readonly {
  description: string;
  focus: ModularHomeInteriorZoneFocusOption;
  helper: string;
  label: string;
}[] = [
  {
    focus: 'overview',
    label: 'Overview',
    description: 'See the complete interior and move between the room presets.',
    helper: 'Best starting point for first-time visitors.',
  },
  {
    focus: 'living',
    label: 'Living',
    description: 'Frame the social zone, sofa wall and daylight orientation.',
    helper: 'Use this to explain everyday family use.',
  },
  {
    focus: 'kitchen',
    label: 'Kitchen',
    description: 'Inspect the kitchenette, counter rhythm and finish tone.',
    helper: 'Kitchen finish changes cabinet warmth and contrast.',
  },
  {
    focus: 'sleeping',
    label: 'Sleeping',
    description: 'Move toward the sleep zone, bed placement and storage wall.',
    helper: 'Furniture mood changes the bed, wardrobe and accent palette.',
  },
  {
    focus: 'bathroom',
    label: 'Bathroom',
    description: 'Check the utility core, door edge and compact wet-room placeholder.',
    helper: 'Useful for explaining service-core realism.',
  },
] as const;

function setConfigOption<T extends keyof ModularHomeConfiguratorState>(
  setOption: ReturnType<typeof useModularHomeConfigurator>['setOption'],
  key: T,
  value: ModularHomeConfiguratorState[T],
) {
  setOption(key, value);
}

export function RoomPanoramaWalkthroughPanel({
  isTouchDevice = false,
}: RoomPanoramaWalkthroughPanelProps) {
  const { config, setOption } = useModularHomeConfigurator();
  const activePreset = useMemo(
    () => WALKTHROUGH_PRESETS.find((preset) => preset.focus === config.interiorZoneFocus) ?? WALKTHROUGH_PRESETS[0],
    [config.interiorZoneFocus],
  );

  return (
    <section
      aria-label="Interior focus controls"
      data-room-panorama-walkthrough-panel="true"
      data-room-panorama-active-room={activePreset.focus}
      style={{
        background: 'rgba(15, 23, 42, 0.56)',
        border: '1px solid rgba(125, 211, 252, 0.18)',
        borderRadius: isTouchDevice ? '14px' : '16px',
        display: 'grid',
        gap: isTouchDevice ? '9px' : '11px',
        maxWidth: isTouchDevice ? 'min(240px, calc(100vw - 16px))' : '248px',
        marginTop: isTouchDevice ? '9px' : '10px',
        padding: isTouchDevice ? '9px' : '11px',
      }}
    >
      <div style={{ display: 'grid', gap: '4px' }}>
        <div style={{ color: '#7dd3fc', fontSize: isTouchDevice ? '0.54rem' : '0.6rem', fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Interior room focus
        </div>
        <div style={{ color: '#f8fafc', fontSize: isTouchDevice ? '0.78rem' : '0.84rem', fontWeight: 900, lineHeight: 1.22 }}>
          Same house, different room focus. Use these presets while walking the shared modular-home scene.
        </div>
        <div style={{ color: '#cbd5e1', fontSize: isTouchDevice ? '0.57rem' : '0.62rem', fontWeight: 760, lineHeight: 1.3 }}>
          Presets only steer the room emphasis and do not swap the scene instance.
        </div>
      </div>

      <div
        aria-label="Walkthrough presets"
        style={{
          display: 'grid',
          gap: '7px',
          gridTemplateColumns: isTouchDevice ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))',
        }}
      >
        {WALKTHROUGH_PRESETS.map((preset) => {
          const selected = preset.focus === config.interiorZoneFocus;

          return (
            <button
              key={preset.focus}
              type="button"
              aria-pressed={selected}
              data-room-panorama-choice={preset.focus}
              onClick={() => {
                setConfigOption(setOption, 'interiorZoneFocus', preset.focus);
              }}
              style={{
                background: selected ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.24), rgba(250, 204, 21, 0.18))' : 'rgba(2, 6, 23, 0.42)',
                border: selected ? '1px solid rgba(125, 211, 252, 0.42)' : '1px solid rgba(148, 163, 184, 0.18)',
                borderRadius: '12px',
                color: selected ? '#f8fafc' : '#cbd5e1',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: isTouchDevice ? '0.58rem' : '0.62rem',
                fontWeight: selected ? 940 : 860,
                minHeight: isTouchDevice ? '48px' : '52px',
                padding: isTouchDevice ? '8px' : '9px',
                textAlign: 'left',
              }}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          background: 'rgba(8, 15, 31, 0.58)',
          border: '1px solid rgba(148, 163, 184, 0.16)',
          borderRadius: '14px',
          display: 'grid',
          gap: '5px',
          padding: isTouchDevice ? '10px' : '11px',
        }}
      >
        <div style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: 930, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {activePreset.label} preset
        </div>
        <div style={{ color: '#f8fafc', fontSize: isTouchDevice ? '0.74rem' : '0.78rem', fontWeight: 860, lineHeight: 1.3 }}>
          {activePreset.description}
        </div>
        <div style={{ color: '#94a3b8', fontSize: isTouchDevice ? '0.52rem' : '0.56rem', fontWeight: 760, lineHeight: 1.3 }}>
          {activePreset.helper}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gap: '7px',
          gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))',
        }}
      >
        <ControlGroup
          isTouchDevice={isTouchDevice}
          label="Floor finish"
          value={config.interiorFloorStyle}
          options={MODULAR_HOME_INTERIOR_FLOOR_STYLE_OPTIONS}
          onChange={(value) => setConfigOption(setOption, 'interiorFloorStyle', value)}
        />
        <ControlGroup
          isTouchDevice={isTouchDevice}
          label="Wall finish"
          value={config.wallPanelStyle}
          options={MODULAR_HOME_WALL_PANEL_STYLE_OPTIONS}
          onChange={(value) => setConfigOption(setOption, 'wallPanelStyle', value)}
        />
        <ControlGroup
          isTouchDevice={isTouchDevice}
          label="Kitchen finish"
          value={config.kitchenFinish}
          options={MODULAR_HOME_KITCHEN_FINISH_OPTIONS}
          onChange={(value) => setConfigOption(setOption, 'kitchenFinish', value)}
        />
        <ControlGroup
          isTouchDevice={isTouchDevice}
          label="Furniture mood"
          value={config.furnitureMood}
          options={MODULAR_HOME_FURNITURE_MOOD_OPTIONS}
          onChange={(value) => setConfigOption(setOption, 'furnitureMood', value)}
        />
      </div>

      <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
        <button
          type="button"
          data-room-panorama-start-outside="true"
          onClick={() => setConfigOption(setOption, 'interiorZoneFocus', 'overview')}
          style={actionButton('#38bdf8')}
        >
          Start outside
        </button>
        <Link
          to="/modular-homes/quotes"
          data-room-panorama-quote="true"
          style={actionButton('#fbbf24')}
        >
          Open quote review
        </Link>
      </div>

      <div style={{ display: 'grid', gap: '6px', gridTemplateColumns: isTouchDevice ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
        <ChipList label="Floor" items={MODULAR_HOME_FLOOR_FINISH_OPTIONS.map((option) => option.label)} />
        <ChipList label="Zone" items={MODULAR_HOME_INTERIOR_ZONE_FOCUS_OPTIONS.map((option) => option.label)} />
      </div>

      <div
        style={{
          color: '#99f6e4',
          fontSize: isTouchDevice ? '0.56rem' : '0.6rem',
          fontWeight: 800,
          lineHeight: 1.28,
        }}
      >
        Interior focus is active on the shared house scene.
        Quote requests keep the same browser-first flow and preserve the selected interior fields.
      </div>
    </section>
  );
}

function ControlGroup<T extends string>({
  isTouchDevice,
  label,
  onChange,
  options,
  value,
}: {
  isTouchDevice: boolean;
  label: string;
  onChange: (value: T) => void;
  options: readonly { key: T; label: string }[];
  value: T;
}) {
  return (
    <div
      style={{
        background: 'rgba(2, 6, 23, 0.38)',
        border: '1px solid rgba(148, 163, 184, 0.14)',
        borderRadius: '12px',
        display: 'grid',
        gap: '6px',
        padding: isTouchDevice ? '9px' : '10px',
      }}
    >
      <div style={{ color: '#e0f2fe', fontSize: isTouchDevice ? '0.54rem' : '0.58rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {options.map((option) => {
          const selected = option.key === value;

          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.key)}
              style={{
                background: selected ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.24), rgba(14, 165, 233, 0.16))' : 'rgba(15, 23, 42, 0.56)',
                border: selected ? '1px solid rgba(34, 197, 94, 0.38)' : '1px solid rgba(148, 163, 184, 0.14)',
                borderRadius: '999px',
                color: selected ? '#f8fafc' : '#cbd5e1',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: isTouchDevice ? '0.5rem' : '0.54rem',
                fontWeight: selected ? 920 : 800,
                padding: isTouchDevice ? '6px 8px' : '7px 9px',
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChipList({ items, label }: { items: readonly string[]; label: string }) {
  return (
    <div
      style={{
        background: 'rgba(2, 6, 23, 0.28)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: '12px',
        display: 'grid',
        gap: '6px',
        padding: '10px',
      }}
    >
      <div style={{ color: '#fef3c7', fontSize: '0.54rem', fontWeight: 950, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {items.map((item) => (
          <span
            key={item}
            style={{
              background: 'rgba(15, 23, 42, 0.42)',
              border: '1px solid rgba(125, 211, 252, 0.12)',
              borderRadius: '999px',
              color: '#dbeafe',
              fontSize: '0.5rem',
              fontWeight: 780,
              padding: '5px 7px',
              whiteSpace: 'nowrap',
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function actionButton(tone: string) {
  return {
    alignItems: 'center',
    display: 'inline-flex',
    justifyContent: 'center',
    background: `${tone}22`,
    border: `1px solid ${tone}66`,
    borderRadius: '999px',
    color: tone,
    cursor: 'pointer',
    font: 'inherit',
    fontSize: '0.74rem',
    fontWeight: 950,
    lineHeight: 1,
    letterSpacing: '0.04em',
    padding: '10px 14px',
    textTransform: 'uppercase',
    textDecoration: 'none',
  } as const;
}
