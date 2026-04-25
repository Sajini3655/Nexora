// src/data/chatStore.js
// Multi-thread chat (issue-based) stored in localStorage for UI demo.
// Note: Now uses backend for primary chat data. localStorage as fallback.

const STORAGE_KEY = "nexora_dev_chat_threads_v1";

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function nowTime() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
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

function makeId(prefix) {
  const rnd =
    (typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID()) ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${rnd}`;
}

function seedThreads() {
  // Return empty array - chat threads come from backend now
  return [];
}

export function loadChatThreads() {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  const parsed = raw ? safeParse(raw) : null;
  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  const seeded = seedThreads();
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

export function saveChatThreads(threads) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}

export function createChatThread(title, createdBy = "You") {
  const threads = loadChatThreads();
  const thread = {
    id: makeId("CHAT"),
    title: title.trim() || "New Issue",
    status: "Open",
    createdAt: nowStamp(),
    createdBy,
    messages: [],
  };
  const next = [thread, ...threads];
  saveChatThreads(next);
  return { threads: next, thread };
}

export function addChatMessage(threadId, { sender, role, text }) {
  const threads = loadChatThreads();
  const next = threads.map((t) => {
    if (t.id !== threadId) return t;
    const msg = {
      id: makeId("MSG"),
      sender,
      role,
      text,
      ts: nowTime(),
    };
    return { ...t, messages: [...(t.messages || []), msg] };
  });
  saveChatThreads(next);
  return next;
}

export function closeChatThread(threadId) {
  const threads = loadChatThreads();
  const next = threads.map((t) => (t.id === threadId ? { ...t, status: "Closed" } : t));
  saveChatThreads(next);
  return next;
}

export function getChatThread(threadId) {
  return loadChatThreads().find((t) => t.id === threadId) || null;
}
