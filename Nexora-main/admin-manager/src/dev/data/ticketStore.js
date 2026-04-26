// src/data/ticketStore.js
// UI-only ticket persistence (localStorage)

const STORAGE_KEY = "nexora_dev_tickets_v1";

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
  const n = Math.floor(100 + Math.random() * 900);
  return `TK-U${n}-${Date.now().toString().slice(-4)}`;
}

export function loadUserTickets() {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  const parsed = raw ? safeParse(raw) : null;
  return Array.isArray(parsed) ? parsed : [];
}

export function saveUserTickets(tickets) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

export function createUserTicket(payload) {
  const tickets = loadUserTickets();
  const ticket = {
    id: makeId(),
    title: payload.title,
    status: payload.status || "Open",
    severity: payload.severity || "Medium",
    createdVia: payload.createdVia || "CHAT_SUMMARY",
    createdAt: nowStamp(),
    description: payload.description,
    evidence: payload.evidence || null,
    detectedFrom: payload.detectedFrom || null,
    suggestedSubtasks: payload.suggestedSubtasks || [],
    client: payload.client || null,
  };
  const next = [ticket, ...tickets];
  saveUserTickets(next);
  return ticket;
}
