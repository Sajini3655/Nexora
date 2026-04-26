export default function StatCard({ title, value, subtitle, icon, badge }) {
  return (
    <div className="group relative overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(91,66,243,0.16),transparent_35%),linear-gradient(180deg,rgba(10,14,40,0.95),rgba(5,10,30,0.98))] px-6 py-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition duration-300 hover:border-white/20 hover:shadow-[0_16px_50px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,255,180,0.08),transparent_28%)] opacity-90" />

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-violet-500/15 text-violet-200 shadow-inner shadow-violet-500/10">
            {icon}
          </div>

          <div className="min-w-0">
            <div className="text-[16px] font-semibold text-slate-200">
              {title}
            </div>
            {subtitle ? (
              <div className="mt-1 text-sm text-slate-400">{subtitle}</div>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[40px] font-extrabold leading-none tracking-tight text-white">
            {value}
          </div>

          {badge ? (
            <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
              {badge}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}