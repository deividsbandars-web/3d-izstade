export function StreamingTrigger({ zone, onEnter }: any) {
  if (!zone || zone.type !== "pixelstream") return null;

  return (
    <div style={{
      position: "absolute",
      bottom: 40,
      left: "50%",
      transform: "translateX(-50%)",
      background: "#111",
      padding: "12px 20px",
      borderRadius: 10,
      color: "white",
      zIndex: 1000
    }}>
      <p style={{ margin: "0 0 10px 0" }}>🎬 Enter 4K Experience</p>
      <button 
        onClick={() => onEnter(zone.streamId)}
        style={{ width: "100%", padding: "8px", background: "#3b82f6", border: "none", color: "white", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
      >
        Enter
      </button>
    </div>
  );
}
