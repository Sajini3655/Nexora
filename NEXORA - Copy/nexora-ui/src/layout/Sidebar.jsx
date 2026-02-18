export default function Sidebar() {
  return (
    <aside style={{
      width: 270,
      padding: 18,
      borderRight: "1px solid var(--border)",
      background: "rgba(255,255,255,0.03)"
    }}>
      <div style={{ fontWeight: 900, letterSpacing: 0.5, fontSize: 18 }}>
        Nexora <span style={{ color: "var(--muted)", fontWeight: 700 }}>Manager</span>
      </div>

      <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
        <div style={{
          padding: 12,
          borderRadius: 14,
          border: "1px solid var(--border)",
          background: "rgba(124,92,255,0.18)"
        }}>
          <div style={{ fontWeight: 800 }}>All Tickets</div>
          <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>Email + Client</div>
        </div>

        <div style={{
          padding: 12,
          borderRadius: 14,
          border: "1px solid var(--border)",
          background: "rgba(255,255,255,0.04)"
        }}>
          <div style={{ fontWeight: 800 }}>Chatbot Tickets</div>
          <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>Coming soon</div>
        </div>
      </div>

      <div style={{ marginTop: 18, color: "var(--muted)", fontSize: 12, lineHeight: 1.4 }}>
        Tip: Use tabs to filter by ticket source.
      </div>
    </aside>
  );
}
