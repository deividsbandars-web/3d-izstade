export function PixelStreamOverlay({ streamId, onClose }: any) {
  if (!streamId) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "black",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <button
        onClick={onClose}
        style={{ 
          position: "absolute", 
          top: 20, 
          right: 20,
          padding: "10px 20px",
          background: "#ef4444",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        EXIT
      </button>

      {/* TAGAD FAKE, vēlāk būs WebRTC stream */}
      <div style={{ color: "white", textAlign: "center" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "20px" }}>Streaming: {streamId}</h2>
        <div style={{ width: "80vw", height: "45vw", background: "#222", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #333" }}>
          <p style={{ color: "#555", fontSize: "1.5rem" }}>Pixel Streaming Content Placeholder</p>
        </div>
      </div>
    </div>
  );
}
