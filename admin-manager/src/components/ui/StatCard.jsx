export default function StatCard({ title, value, subtitle, icon, badge }) {
  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(15,23,42,0.78)] px-5 py-5 shadow-[0_10px_28px_rgba(0,0,0,0.18)] transition duration-300 hover:border-white/15 hover:shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_40%)] opacity-80" />

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200">
            {icon}
          </div>

          <div className="min-w-0">
            <div className="text-[15px] font-semibold text-slate-200">
              {title}
            </div>
            {subtitle ? (
              <div className="mt-1 text-[13px] text-slate-400">{subtitle}</div>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[34px] font-extrabold leading-none tracking-tight text-white">
            {value}
          </div>

          {badge ? (
            <div className="mt-2.5 inline-flex rounded-full border border-white/10 bg-white/4 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
              {badge}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
