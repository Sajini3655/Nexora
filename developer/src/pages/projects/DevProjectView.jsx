import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DevLayout from "../../components/layout/DevLayout";

const mockProjects = [
  {
    id: "p-101",
    name: "Developer Dashboard UI",
    manager: "Nimal Perera",
    progress: 72,
    devTaskCount: 8,
    status: "Active",
    description:
      "Build the Developer Dashboard UI with modern layout, routing, and consistent design system components (UI only).",
  },
  {
    id: "p-102",
    name: "Auth + Roles (UI Prep)",
    manager: "Kasun Silva",
    progress: 35,
    devTaskCount: 4,
    status: "Active",
    description:
      "Prepare UI screens and flows for authentication + role-based access (UI only).",
  },
  {
    id: "p-103",
    name: "Notifications + Chat UX",
    manager: "Amaya Fernando",
    progress: 10,
    devTaskCount: 3,
    status: "Planning",
    description:
      "Design notification list + chat experience between Developer and Manager (UI only).",
  },
];

const statusBadge = (status) => {
  const base = "px-3 py-1 rounded-full text-xs font-medium border";
  if (status === "Active")
    return `${base} bg-green-50 text-green-700 border-green-200`;
  if (status === "On Hold")
    return `${base} bg-amber-50 text-amber-700 border-amber-200`;
  return `${base} bg-gray-50 text-gray-700 border-gray-200`;
};

const DevProjectView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const project = useMemo(
    () => mockProjects.find((p) => p.id === id),
    [id]
  );

  return (
    <DevLayout>
      <div>
        {/* baseline header style */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Project</h2>
          <button
            type="button"
            className="text-blue-600"
            onClick={() => navigate("/projects")}
          >
            ← Back
          </button>
        </div>

        {!project ? (
          <div className="p-3 bg-white rounded shadow">
            <div className="font-medium">Project not found</div>
            <div className="text-sm text-gray-500">
              Invalid project id: <span className="font-medium">{id}</span>
            </div>
          </div>
        ) : (
          <>
            {/* top info card */}
            <div className="p-3 bg-white rounded shadow mb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{project.name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Manager: <span className="font-medium text-gray-700">{project.manager}</span> •{" "}
                    {project.devTaskCount} tasks
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-xs font-medium tabular-nums px-2 py-1 rounded border border-gray-200 bg-gray-50 text-gray-700">
                    {project.progress}%
                  </div>
                  <div className={statusBadge(project.status)}>{project.status}</div>
                </div>
              </div>

              <div className="text-sm text-gray-600 mt-3">
                {project.description}
              </div>
            </div>

            {/* sections (UI only placeholders) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded shadow">
                <div className="font-medium">Your Tasks (UI)</div>
                <div className="text-sm text-gray-500 mt-1">
                  Next step: list tasks for this project (cards like Tasks page)
                </div>
              </div>

              <div className="p-3 bg-white rounded shadow">
                <div className="font-medium">Activity (UI)</div>
                <div className="text-sm text-gray-500 mt-1">
                  Next step: show recent activity timeline (UI only)
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DevLayout>
  );
};

export default DevProjectView;
