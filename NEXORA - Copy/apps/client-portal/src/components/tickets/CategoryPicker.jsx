const categories = [
  "Bug / Something not working",
  "Change Request",
  "New Feature Request",
  "Access / Login / Permissions",
  "Performance / Slow",
  "Billing / Invoice",
  "Other",
];

export default function CategoryPicker({ value, onSelect }) {
  return (
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
      {categories.map((c) => {
        const selected = value === c;
        return (
          <button
            key={c}
            onClick={() => onSelect(c)}
            style={{
              padding: 16,
              borderRadius: 14,
              border: selected ? "2px solid #ffffff" : "1px solid rgba(255,255,255,0.25)",
              background: selected ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
              cursor: "pointer",
              textAlign: "left",
              fontWeight: 700,
              color: "#ffffff",       // IMPORTANT: force visible text
              minHeight: 56,
            }}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
