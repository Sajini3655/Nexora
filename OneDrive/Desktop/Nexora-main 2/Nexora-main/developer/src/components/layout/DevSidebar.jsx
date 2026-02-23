import React from "react";
import { NavLink } from "react-router-dom";
import { FiHome, FiUser, FiMessageCircle } from "react-icons/fi";

export default function DevSidebar({ collapsed }) {
  const menuItems = [
    { name: "Dashboard", icon: <FiHome />, path: "/" },
    { name: "Profile", icon: <FiUser />, path: "/profile" },
    { name: "Chat", icon: <FiMessageCircle />, path: "/chat" }, // ✅ Added Chat
  ];

  return (
    <aside
      className={
        "p-4 pr-0 hidden md:block" +
        (collapsed ? " w-[88px]" : " w-[280px]")
      }
    >
      <div className="glass-panel rounded-3xl h-[calc(100vh-2rem)] p-4 flex flex-col">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
            <span
              className="w-3 h-3 rounded-full"
              style={{ background: "rgb(168, 85, 247)" }}
            />
          </div>
          {!collapsed && (
            <div>
              <p className="font-bold leading-5">Nexora</p>
              <p className="text-[11px] text-slate-400">Developer</p>
            </div>
          )}
        </div>

        <div className="divider my-4" />

        {/* Nav */}
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-3 py-2 rounded-2xl border transition",
                  "border-white/0 hover:border-white/10 hover:bg-white/5",
                  isActive ? "bg-white/10 border-white/10" : "",
                ].join(" ")
              }
              title={collapsed ? item.name : undefined}
            >
              <span className="text-slate-200 text-lg">{item.icon}</span>
              {!collapsed && <span className="text-sm">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="divider my-4" />
          <div className="px-2">
            {!collapsed ? (
              <p className="text-xs text-slate-400">
                UI demo • localStorage persistence
              </p>
            ) : (
              <p className="text-xs text-slate-500 text-center">•</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}