import React from "react";

export default function ClientTopbar({ collapsed, onToggleSidebar }) {
  let displayName = "Client";

  try {
    const raw = localStorage.getItem("user");
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed?.name) displayName = parsed.name;
  } catch {
    displayName = "Client";
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-slate-100 hover:bg-white/10"
      >
        {collapsed ? "Expand" : "Collapse"}
      </button>

      <div className="text-sm text-slate-100">
        <span className="opacity-70">Signed in as </span>
        <span className="font-semibold">{displayName}</span>
      </div>
    </div>
  );
}
