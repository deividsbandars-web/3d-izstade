import type { ReactNode } from 'react';

export type HomeDesignInstanceSectionId =
  | 'cityPreview'
  | 'exteriorDesign'
  | 'floorplan'
  | 'interiorRooms'
  | 'quote';

type HomeDesignInstanceShellProps = {
  activeSection: HomeDesignInstanceSectionId;
  interiorRoomsPanel?: ReactNode;
  isTouchDevice?: boolean;
  showCityPreview?: boolean;
  onSelectSection: (section: HomeDesignInstanceSectionId) => void;
};

const HOME_DESIGN_INSTANCE_SECTIONS: readonly {
  detail: string;
  id: HomeDesignInstanceSectionId;
  label: string;
}[] = [
  {
    id: 'cityPreview',
    label: 'City Preview',
    detail: 'Compact expo shell in the city',
  },
  {
    id: 'exteriorDesign',
    label: 'Exterior Design',
    detail: 'Preset facade and roof controls',
  },
  {
    id: 'floorplan',
    label: 'Floorplan',
    detail: 'Browser floorplan review',
  },
  {
    id: 'interiorRooms',
    label: 'Interior Rooms',
    detail: 'Shared house scene and room presets',
  },
  {
    id: 'quote',
    label: 'Quote',
    detail: 'Quote follow-through flow',
  },
] as const;

export function HomeDesignInstanceShell({
  activeSection,
  interiorRoomsPanel,
  isTouchDevice = false,
  showCityPreview = false,
  onSelectSection,
}: HomeDesignInstanceShellProps) {
  const sections = showCityPreview
    ? HOME_DESIGN_INSTANCE_SECTIONS
    : HOME_DESIGN_INSTANCE_SECTIONS.filter((section) => section.id !== 'cityPreview');
  const sectionSummary = (() => {
    switch (activeSection) {
      case 'interiorRooms':
        return 'Interior room focus stays in this rail. Use room presets and finish choices on the shared house scene.';
      case 'floorplan':
        return 'Floorplan keeps layout and room measurements readable without replacing the interior scene.';
      case 'quote':
        return 'Quote keeps the browser quote-preparation flow and follow-through path unchanged.';
      case 'exteriorDesign':
        return 'Exterior design stays in this rail. The house remains the hero object behind it.';
      default:
        return 'The compact expo shell stays secondary to the house preview.';
    }
  })();

  return (
    <section
      aria-label="Home Design Instance shell"
      data-home-design-instance-shell="true"
      data-home-design-instance-active-section={activeSection}
      style={{
        background: 'rgba(2, 6, 23, 0.32)',
        border: '1px solid rgba(125, 211, 252, 0.18)',
        borderRadius: isTouchDevice ? '15px' : '17px',
        display: 'grid',
        gap: isTouchDevice ? '8px' : '10px',
        marginTop: isTouchDevice ? '10px' : '12px',
        padding: isTouchDevice ? '10px' : '12px',
      }}
    >
      <div style={{ display: 'grid', gap: '5px' }}>
        <div style={{ color: '#7dd3fc', fontSize: isTouchDevice ? '0.56rem' : '0.6rem', fontWeight: 950, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Modular Home Studio
        </div>
        <div style={{ color: '#f8fafc', fontSize: isTouchDevice ? '0.84rem' : '0.92rem', fontWeight: 920, lineHeight: 1.18 }}>
          {sectionSummary}
        </div>
      </div>

      <nav
        aria-label="Home Design Instance sections"
        style={{
          display: 'grid',
          gap: '7px',
          gridTemplateColumns: isTouchDevice ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))',
        }}
      >
        {sections.map((section) => {
          const selected = section.id === activeSection;

          return (
            <button
              key={section.id}
              type="button"
              aria-pressed={selected}
              data-home-design-instance-section={section.id}
              onClick={(event) => {
                event.stopPropagation();
                onSelectSection(section.id);
              }}
              style={{
                background: selected ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.24), rgba(34, 197, 94, 0.16))' : 'rgba(15, 23, 42, 0.5)',
                border: selected ? '1px solid rgba(125, 211, 252, 0.42)' : '1px solid rgba(148, 163, 184, 0.16)',
                borderRadius: '13px',
                color: selected ? '#f8fafc' : '#cbd5e1',
                cursor: 'pointer',
                display: 'grid',
                font: 'inherit',
                gap: '4px',
                minHeight: isTouchDevice ? '54px' : '62px',
                padding: isTouchDevice ? '8px' : '9px',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: isTouchDevice ? '0.58rem' : '0.62rem', fontWeight: selected ? 950 : 900, lineHeight: 1.1 }}>
                {section.label}
              </span>
              <span style={{ color: selected ? '#dbeafe' : '#94a3b8', fontSize: isTouchDevice ? '0.48rem' : '0.52rem', fontWeight: 760, lineHeight: 1.18 }}>
                {section.detail}
              </span>
            </button>
          );
        })}
      </nav>

      {activeSection === 'interiorRooms' && interiorRoomsPanel ? interiorRoomsPanel : null}
    </section>
  );
}
