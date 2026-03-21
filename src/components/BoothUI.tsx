/**
 * BoothUI
 * Informācijas panelis, kas parādās, kad lietotājs atrodas pie stenda.
 */
export function BoothUI({ visible, zoneName }: { visible: boolean, zoneName?: string }) {
  if (!visible) return null;

  return (
    <div style={{
      position: "absolute",
      top: 30,
      left: 30,
      background: "rgba(15, 23, 42, 0.9)",
      padding: "20px 30px",
      borderRadius: 15,
      border: "1px solid rgba(59, 130, 246, 0.5)",
      color: "white",
      backdropFilter: "blur(10px)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      zIndex: 1000
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
        <div style={{ width: 8, height: 8, background: "#10b981", borderRadius: "50%" }}></div>
        <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, letterSpacing: "1px" }}>
          {zoneName || "EXPO BOOTH"}
        </h3>
      </div>
      <p style={{ margin: 0, opacity: 0.6, fontSize: "0.8rem", fontWeight: "bold", textTransform: "uppercase" }}>
        Interactive 3D Experience
      </p>
    </div>
  );
}
