import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { FiBell, FiChevronDown, FiMenu } from "react-icons/fi";

import { loadProfile } from "../../data/profileStore";
import { loadNotifications, markAllRead } from "../../data/notificationStore";

function Portal({ children }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

Portal.propTypes = {
  children: PropTypes.node,
};

function useAnchorPosition(isOpen, anchorRef) {
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const update = () => {
      const el = anchorRef.current;
      if (!el) return;

      const r = el.getBoundingClientRect();
      const vw =
        typeof globalThis !== "undefined" && typeof globalThis.innerWidth === "number"
          ? globalThis.innerWidth
          : 0;

      setPos({
        top: Math.round(r.bottom + 8),
        right: Math.round(vw - r.right),
        width: Math.round(r.width),
      });
    };

    update();
    globalThis?.addEventListener?.("resize", update);
    globalThis?.addEventListener?.("scroll", update, true);

    return () => {
      globalThis?.removeEventListener?.("resize", update);
      globalThis?.removeEventListener?.("scroll", update, true);
    };
  }, [isOpen, anchorRef]);

  return pos;
}

export default function DevTopbar({ onToggleSidebar }) {
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifBtnRef = useRef(null);
  const profileBtnRef = useRef(null);

  const notifPos = useAnchorPosition(notifOpen, notifBtnRef);
  const profilePos = useAnchorPosition(profileOpen, profileBtnRef);

  const profile = useMemo(() => loadProfile(), []);
  const notifications = useMemo(() => loadNotifications(), []);
  const unread = notifications.filter((n) => !n.read).length;

  const closeAll = () => {
    setNotifOpen(false);
    setProfileOpen(false);
  };

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") closeAll();
    };

    globalThis?.addEventListener?.("keydown", onEsc);
    return () => globalThis?.removeEventListener?.("keydown", onEsc);
  }, []);

  return (
    <>
      <div className="sticky top-0" style={{ zIndex: 60 }}>
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onToggleSidebar}
                className="h-10 w-10 grid place-items-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                aria-label="Toggle sidebar"
              >
                <FiMenu />
              </button>

              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm font-semibold">Nexora</span>
                <span className="text-xs px-2 py-1 rounded-full border border-white/10 bg-white/5 text-white/70">
                  DEVELOPER
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button
                ref={notifBtnRef}
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  setNotifOpen((v) => !v);
                }}
                className="relative h-10 w-10 grid place-items-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                aria-label="Notifications"
              >
                <FiBell />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 grid place-items-center text-[11px] rounded-full bg-violet-500 text-white">
                    {unread}
                  </span>
                )}
              </button>

              {/* Profile */}
              <button
                ref={profileBtnRef}
                type="button"
                onClick={() => {
                  setNotifOpen(false);
                  setProfileOpen((v) => !v);
                }}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2"
                aria-label="Profile menu"
              >
                <div className="h-9 w-9 rounded-full bg-white/10 border border-white/10 grid place-items-center font-semibold">
                  {(profile?.name || "Developer User")
                    .split(" ")
                    .map((x) => x[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-semibold leading-4">
                    {profile?.name || "Developer User"}
                  </div>
                  <div className="text-xs text-white/60">
                    {profile?.email || "dev@nexora.com"}
                  </div>
                </div>
                <FiChevronDown className="hidden sm:block opacity-80" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PORTAL MENUS (always on top) */}
      <Portal>
        {(notifOpen || profileOpen) && (
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={closeAll}
            aria-hidden="true"
          />
        )}

        {notifOpen && notifPos && (
          <div
            className="fixed max-w-[92vw] rounded-2xl border border-white/10 bg-[#0b1220]/80 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)] p-3"
            style={{
              top: notifPos.top,
              right: notifPos.right,
              width: 340,
              zIndex: 9999,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Notifications</div>
              <button
                type="button"
                onClick={() => {
                  markAllRead();
                  closeAll();
                }}
                className="text-xs px-2 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
              >
                Mark all read
              </button>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-auto pr-1">
              {notifications.length === 0 && (
                <div className="text-sm text-white/60">No notifications</div>
              )}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="text-sm font-semibold">{n.title}</div>
                  <div className="text-xs text-white/60 mt-1">{n.text}</div>
                  <div className="text-[11px] text-white/40 mt-2">{n.ts}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {profileOpen && profilePos && (
          <div
            className="fixed rounded-2xl border border-white/10 bg-[#0b1220]/80 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.55)] p-2"
            style={{
              top: profilePos.top,
              right: profilePos.right,
              width: 260,
              zIndex: 9999,
            }}
          >
            <button
              type="button"
              onClick={() => {
                closeAll();
                navigate("/");
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => {
                closeAll();
                navigate("/profile");
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10"
            >
              Profile
            </button>
            <div className="my-2 border-t border-white/10" />
            <button
              type="button"
              onClick={() => {
                closeAll();
                localStorage.removeItem("token");
                navigate("/login");
              }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-red-300"
            >
              Logout
            </button>
          </div>
        )}
      </Portal>
    </>
  );
}

DevTopbar.propTypes = {
  onToggleSidebar: PropTypes.func,
};

DevTopbar.defaultProps = {
  onToggleSidebar: () => {},
};
