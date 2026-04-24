import React from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/client", label: "Dashboard" },
  { to: "/client/projects", label: "Projects" },
  { to: "/client/tickets", label: "Tickets" },
  { to: "/client/profile", label: "Profile" },
  { to: "/client/settings", label: "Settings" },
];

export default function ClientSidebar({ collapsed }) {
  return (
    <aside
      className="glass-panel m-4 rounded-3xl p-3"
      style={{ width: collapsed ? 88 : 248, transition: "width 180ms ease" }}
    >
      <div className="px-2 py-3 text-sm font-bold tracking-wide text-slate-100">
        {collapsed ? "CL" : "Client Space"}
      </div>

      <nav className="mt-3 flex flex-col gap-1.5">
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/client"}
            className={({ isActive }) =>
              [
                "rounded-xl px-3 py-2 text-sm transition",
                isActive
                  ? "bg-white/20 text-white"
                  : "text-slate-200 hover:bg-white/10 hover:text-white",
              ].join(" ")
            }
            title={item.label}
          >
            {collapsed ? item.label.slice(0, 2).toUpperCase() : item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
