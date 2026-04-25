const items = [
  { label: "Dashboard", hint: "Overview" },
  { label: "Projects", hint: "Your work" },
  { label: "Tickets", hint: "Support" },
];

export default function Sidebar() {
  return (
    <aside style={{
      width: 270,
      padding: 18,
      borderRight: "1px solid var(--border)",
      background: "rgba(255,255,255,0.03)"
    }}>
      <div style={{ fontWeight: 900, letterSpacing: 0.5, fontSize: 18 }}>
        Nexora <span style={{ color: "var(--muted)", fontWeight: 700 }}>Client</span>
      </div>

      <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
        {items.map((it) => (
          <div key={it.label} style={{
            padding: 12,
            borderRadius: 14,
            border: "1px solid var(--border)",
            background: it.label === "Tickets" ? "rgba(124,92,255,0.18)" : "rgba(255,255,255,0.04)"
          }}>
            <div style={{ fontWeight: 800 }}>{it.label}</div>
            <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>{it.hint}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, color: "var(--muted)", fontSize: 12, lineHeight: 1.4 }}>
        Tip: Clients can create tickets and track status. Internal developer comments stay private.
      </div>
    </aside>
  );
}
