import React from "react";
import ClientLayout from "../../components/layout/ClientLayout";

export default function ClientSettings() {
  return (
    <ClientLayout>
      <h2 className="text-2xl font-bold mb-4">Client Settings</h2>
      <div className="rounded-2xl border border-white/15 bg-white/5 p-5 text-slate-200">
        Client settings scaffold is ready. We can connect notification preferences,
        branding options, and report delivery settings next.
      </div>
    </ClientLayout>
  );
}
