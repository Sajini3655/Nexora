import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiBell, FiChevronDown, FiMenu } from "react-icons/fi";
import { loadProfile } from "../../data/profileStore";
import {
  loadNotifications,
  markAllRead,
  markRead,
} from "../../data/notificationStore";

function useOutsideClick(ref, handler) {
  useEffect(() => {
    function onDown(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) handler();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, handler]);
}

export default function DevTopbar({ onToggleSidebar }) {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(() => loadProfile());
  const initials = (profile.name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const [notifs, setNotifs] = useState(() => loadNotifications());
  const unread = notifs.filter((n) => !n.read).length;

  const [openNotifs, setOpenNotifs] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);

  const notifRef = useRef(null);
  const profRef = useRef(null);
  useOutsideClick(notifRef, () => setOpenNotifs(false));
  useOutsideClick(profRef, () => setOpenProfile(false));

  // keep notifications/profile fresh
  useEffect(() => {
    const id = setInterval(() => {
      setNotifs(loadNotifications());
      setProfile(loadProfile());
    }, 1200);
    return () => clearInterval(id);
  }, []);

  const onMarkAll = () => setNotifs(markAllRead());
  const onOpenNotif = (id) => setNotifs(markRead(id));

  return (
    <div className="flex items-center justify-between gap-3">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="btn-ghost px-3 py-2 rounded-2xl"
          aria-label="Toggle sidebar"
        >
          <FiMenu className="text-lg" />
        </button>

        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
            <span className="w-3 h-3 rounded-full" style={{ background: "rgb(168, 85, 247)" }} />
          </div>
          <div className="min-w-0">
            <p className="font-bold leading-5 truncate">Nexora</p>
            <p className="text-[11px] text-slate-400 truncate">Developer Workspace</p>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <span className="chip hidden sm:inline-flex">DEVELOPER</span>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setOpenNotifs((v) => !v);
              setOpenProfile(false);
            }}
            className="btn-ghost px-3 py-2 rounded-2xl relative"
            aria-label="Notifications"
          >
            <FiBell className="text-lg" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 text-[10px] bg-violet-500 text-white rounded-full px-1.5 py-0.5 border border-white/10">
                {unread}
              </span>
            )}
          </button>

          {openNotifs && (
            <div className="absolute right-0 mt-2 w-96 glass-card overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <p className="font-semibold">Notifications</p>
                <button type="button" onClick={onMarkAll} className="btn-outline px-3 py-1.5 text-xs">
                  Mark all read
                </button>
              </div>

              <div className="max-h-80 overflow-auto">
                {notifs.slice(0, 10).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => onOpenNotif(n.id)}
                    className={
                      "w-full text-left px-4 py-3 border-b border-white/10 hover:bg-white/5 " +
                      (n.read ? "" : "bg-white/5")
                    }
                  >
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="text-xs text-slate-300 mt-1">{n.body}</p>
                    <p className="text-[11px] text-slate-400 mt-2">{n.createdAt}</p>
                  </button>
                ))}
                {notifs.length === 0 && (
                  <p className="text-sm text-slate-300 px-4 py-6">No notifications.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profRef}>
          <button
            type="button"
            onClick={() => {
              setOpenProfile((v) => !v);
              setOpenNotifs(false);
            }}
            className="btn-outline px-3 py-2 rounded-2xl"
            aria-label="Profile menu"
          >
            <span className="w-9 h-9 rounded-full bg-white/10 border border-white/10 text-white flex items-center justify-center text-sm font-bold">
              {initials || "U"}
            </span>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold leading-4 truncate max-w-[160px]">{profile.name}</p>
              <p className="text-xs text-slate-400">{profile.email}</p>
            </div>
            <FiChevronDown className="text-slate-300" />
          </button>

          {openProfile && (
            <div className="absolute right-0 mt-2 w-56 glass-card overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-semibold">{profile.name}</p>
                <p className="text-xs text-slate-400">{profile.email}</p>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setOpenProfile(false)}
                  className="block px-4 py-2 text-sm hover:bg-white/5"
                >
                  Profile
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setOpenProfile(false);
                    navigate("/");
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-white/5"
                >
                  Dashboard
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpenProfile(false);
                    window.alert("Logged out (UI demo)");
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-white/5"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
