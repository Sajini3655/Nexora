export default function Card({ title, subtitle, children }) {
  return (
    <div style={{
      border: "1px solid var(--border)",
      background: "var(--panel)",
      borderRadius: 16,
      padding: 16,
      maxWidth: 980
    }}>
      {(title || subtitle) && (
        <div style={{ marginBottom: 12 }}>
          {title && <div style={{ fontSize: 16, fontWeight: 900 }}>{title}</div>}
          {subtitle && <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{subtitle}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
