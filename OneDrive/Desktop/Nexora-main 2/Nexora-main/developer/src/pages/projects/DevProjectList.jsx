import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DevLayout from "../../components/layout/DevLayout";

const mockProjects = [
  {
    id: "p-101",
    name: "Developer Dashboard UI",
    manager: "Nimal Perera",
    progress: 72,
    devTaskCount: 8,
    status: "Active",
  },
  {
    id: "p-102",
    name: "Auth + Roles (UI Prep)",
    manager: "Kasun Silva",
    progress: 35,
    devTaskCount: 4,
    status: "Active",
  },
  {
    id: "p-103",
    name: "Notifications + Chat UX",
    manager: "Amaya Fernando",
    progress: 10,
    devTaskCount: 3,
    status: "Planning",
  },
];

const cycleStatus = (s) => {
  const order = ["Active", "Planning", "On Hold"];
  const i = order.indexOf(s);
  return order[(i + 1) % order.length];
};

const pillClasses = (status) => {
  const base =
    "cursor-pointer select-none px-3 py-1 rounded-full text-xs font-medium border transition";
  if (status === "Active")
    return `${base} bg-green-50 text-green-700 border-green-200 hover:bg-green-100`;
  if (status === "On Hold")
    return `${base} bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100`;
  return `${base} bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100`;
};

// Professional progress: ring + badge (no bars)
const ProgressRing = ({ value = 0 }) => {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const r = 8;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c;

  return (
    <div className="flex items-center gap-2" title={`Progress: ${v}%`}>
      <svg width="18" height="18" viewBox="0 0 20 20" className="shrink-0 text-gray-900">
        <circle cx="10" cy="10" r={r} fill="none" stroke="rgb(229 231 235)" strokeWidth="2" />
        <circle
          cx="10"
          cy="10"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform="rotate(-90 10 10)"
        />
      </svg>

      <div className="text-xs font-medium tabular-nums px-2 py-1 rounded border border-gray-200 bg-gray-50 text-gray-700">
        {v}%
      </div>
    </div>
  );
};

const DevProjectList = () => {
  const [projects, setProjects] = useState(mockProjects);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filteredProjects = useMemo(() => {
    const q = search.toLowerCase();
    return projects.filter(
      (p) => p.name.toLowerCase().includes(q) || p.manager.toLowerCase().includes(q)
    );
  }, [projects, search]);

  const toggleStatus = (id) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: cycleStatus(p.status) } : p))
    );
  };

  return (
    <DevLayout>
      <div>
        {/* EXACT same baseline as Tasks */}
        <h2 className="text-2xl font-bold mb-4">Projects</h2>

        <input
          className="mb-4 p-2 border rounded w-full"
          placeholder="Search projects or manager..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <ul className="space-y-2">
          {filteredProjects.map((p) => (
            <li
              key={p.id}
              className="p-3 bg-white rounded shadow flex justify-between items-center"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-sm text-gray-500">
                  {p.manager} • {p.devTaskCount} tasks
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <ProgressRing value={p.progress} />

                <div
                  role="button"
                  tabIndex={0}
                  className={pillClasses(p.status)}
                  onClick={() => toggleStatus(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") toggleStatus(p.id);
                  }}
                  title="Click to change status (UI only)"
                >
                  {p.status}
                </div>

                <button
                  type="button"
                  className="text-blue-600"
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  View
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </DevLayout>
  );
};

export default DevProjectList;
