export function ExpoOperatorInspectionSummary({
  inspector,
}: {
  inspector: Array<{
    distance: number;
    id: string;
    layer: string;
  }>;
}) {
  if (inspector.length === 0) {
    return <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>No nearby inspect targets</div>;
  }

  return (
    <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.45 }}>
      {inspector.map((entry) => (
        <div key={`${entry.layer}:${entry.id}`}>
          {entry.layer}:{entry.id} ({entry.distance}u)
        </div>
      ))}
    </div>
  );
}
