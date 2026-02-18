export default function Topbar() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 18px",
      borderBottom: "1px solid var(--border)",
      background: "rgba(255,255,255,0.03)"
    }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 900 }}>Tickets</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>Create a ticket with AI summary</div>
      </div>

      <div className="pill">
        <span style={{ width: 10, height: 10, borderRadius: 99, background: "var(--accent2)" }} />
        Client Session
      </div>
    </div>
  );
}
