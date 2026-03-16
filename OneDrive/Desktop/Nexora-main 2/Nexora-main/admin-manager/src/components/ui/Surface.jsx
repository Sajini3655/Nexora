export default function Surface({ title, subtitle, children, className = "" }) {
  return (
    <section
      className={`relative overflow-hidden rounded-[40px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(100,80,255,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(0,255,170,0.08),transparent_22%),linear-gradient(180deg,rgba(12,18,45,0.96),rgba(5,10,30,0.98))] p-5 md:p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[40px] border border-white/5" />

      {(title || subtitle) && (
        <div className="relative mb-6 border-b border-white/10 pb-5">
          {title ? (
            <h2 className="text-[28px] font-extrabold tracking-tight text-white md:text-[34px]">
              {title}
            </h2>
          ) : null}

          {subtitle ? (
            <p className="mt-2 text-base text-slate-300 md:text-lg">
              {subtitle}
            </p>
          ) : null}
        </div>
      )}

      <div className="relative">{children}</div>
    </section>
  );
}