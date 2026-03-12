// admin-manager/src/dev/data/notificationStore.js
// UI-only notifications for developer topbar

const STORAGE_KEY = "nexora_dev_notifications_v1";

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function nowStamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function makeId() {
  return `NT-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function seed() {
  return [
    {
      id: makeId(),
      title: "Workspace updated",
      body: "Assigned-only task board is live. Click a task to open details.",
      createdAt: nowStamp(),
      read: false,
    },
  ];
}

export function loadNotifications() {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  const parsed = raw ? safeParse(raw) : null;
  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  const seeded = seed();
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

export function saveNotifications(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function pushNotification({ title, body }) {
  const list = loadNotifications();
  const next = [
    {
      id: makeId(),
      title,
      body,
      createdAt: nowStamp(),
      read: false,
    },
    ...list,
  ];
  saveNotifications(next);
  return next;
}

export function markAllRead() {
  const list = loadNotifications();
  const next = list.map((n) => ({ ...n, read: true }));
  saveNotifications(next);
  return next;
}

export function markRead(id) {
  const list = loadNotifications();
  const next = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(next);
  return next;
}
