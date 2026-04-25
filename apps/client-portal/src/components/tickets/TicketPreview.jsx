export default function TicketPreview({ ai, onBack, onCreate, creating }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 14, background: "rgba(0,0,0,0.18)" }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>{ai.title}</div>
        <div style={{ marginTop: 8, color: "var(--text)" }}>{ai.summary}</div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span className="pill">Category: <b style={{ color: "var(--text)" }}>{ai.internal_category}</b></span>
          <span className="pill">Priority: <b style={{ color: "var(--text)" }}>{ai.priority}</b></span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn" onClick={onBack}>Back</button>
        <button className="btn btnPrimary" onClick={onCreate} disabled={creating}>
          {creating ? "Creating..." : "Create Ticket"}
        </button>
      </div>
    </div>
  );
}
