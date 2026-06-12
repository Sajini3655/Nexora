export default function Surface({ title, subtitle, children, className = "" }) {
  return (
    <section
      className={`relative overflow-hidden rounded-[22px] border border-[var(--nx-border)] bg-[var(--nx-card)] p-5 md:p-6 shadow-[var(--nx-shadow)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[22px] border border-[var(--nx-border)]" />

      {title ? (
        <div className="relative mb-3 border-b border-[var(--nx-border)] pb-2.5">
          <h2 className="text-[28px] font-extrabold tracking-tight text-[var(--nx-text)] md:text-[34px]">{title}</h2>
          {}
        </div>
      ) : null}

      <div className="relative">{children}</div>
    </section>
  );
}

