import React, { useEffect, useState } from "react";
import ClientLayout from "../../components/layout/ClientLayout";
import { fetchClientProjects } from "../../services/clientService";

export default function ClientProjectList() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchClientProjects().then(setProjects);
  }, []);

  return (
    <ClientLayout>
      <h2 className="text-2xl font-bold mb-4">Client Projects</h2>

      <div className="space-y-3">
        {projects.map((p) => (
          <div key={p.id} className="rounded-2xl border border-white/15 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="text-sm text-slate-300">Manager: {p.manager}</p>
              </div>
              <span className="text-xs rounded-full px-3 py-1 bg-white/10 border border-white/20">
                {p.status}
              </span>
            </div>

            <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${p.progress}%`,
                  background:
                    "linear-gradient(90deg, rgba(34,197,94,0.95), rgba(59,130,246,0.95))",
                }}
              />
            </div>
            <p className="mt-2 text-sm text-slate-300">{p.progress}% complete • ETA {p.eta}</p>
          </div>
        ))}
      </div>
    </ClientLayout>
  );
}
