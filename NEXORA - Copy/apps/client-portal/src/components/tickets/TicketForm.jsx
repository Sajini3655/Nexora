export default function TicketForm({ form, setForm, onNext, onBack }) {
  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <label>Name</label>
          <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div>
          <label>Company</label>
          <input className="input" value={form.company} onChange={(e) => update("company", e.target.value)} />
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <label>Email</label>
          <input className="input" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </div>
        <div>
          <label>Project</label>
          <input className="input" value={form.project} onChange={(e) => update("project", e.target.value)} placeholder="Eg: Website Revamp" />
        </div>
      </div>

      <div>
        <label>Urgency</label>
        <select className="input" value={form.urgency} onChange={(e) => update("urgency", e.target.value)}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </div>

      <div>
        <label>Description (required)</label>
        <textarea className="input" value={form.description} onChange={(e) => update("description", e.target.value)} rows={5} />
      </div>

      <div>
        <label>Steps to reproduce (optional)</label>
        <textarea className="input" value={form.steps} onChange={(e) => update("steps", e.target.value)} rows={3} />
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <label>Expected (optional)</label>
          <textarea className="input" value={form.expected} onChange={(e) => update("expected", e.target.value)} rows={3} />
        </div>
        <div>
          <label>Actual (optional)</label>
          <textarea className="input" value={form.actual} onChange={(e) => update("actual", e.target.value)} rows={3} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn" onClick={onBack}>Back</button>
        <button
          className="btn btnPrimary"
          onClick={onNext}
          disabled={!form.name || !form.company || !form.email || !form.project || !form.description}
        >
          Generate Summary
        </button>
      </div>
    </div>
  );
}
