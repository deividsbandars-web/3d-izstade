import type { ReviewOperatorZone } from '../model/reviewOperatorSession';

export function ExpoOperatorZoneNav({
  activeZoneId,
  onSelectZone,
  zones,
}: {
  activeZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  zones: ReviewOperatorZone[];
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', maxHeight: '42vh', overflowY: 'auto', paddingRight: '4px' }}>
      {zones.map((zone) => (
        <button
          key={zone.id}
          onClick={() => onSelectZone(zone.id)}
          style={{
            background: activeZoneId === zone.id ? 'rgba(125, 211, 252, 0.22)' : 'rgba(15, 23, 42, 0.76)',
            border: '1px solid rgba(125, 211, 252, 0.28)',
            borderRadius: '12px',
            color: '#e2e8f0',
            cursor: 'pointer',
            fontSize: '0.68rem',
            fontWeight: 700,
            minHeight: '48px',
            padding: '8px 10px',
            textAlign: 'left',
          }}
          type="button"
        >
          <div>{zone.label}</div>
          <div style={{ fontSize: '0.58rem', opacity: 0.72, marginTop: '2px' }}>{zone.id}</div>
        </button>
      ))}
    </div>
  );
}
