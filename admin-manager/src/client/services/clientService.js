import { API_BASE_URL } from "../../utils/constants";

const API_BASE = `${API_BASE_URL}/api`;
const CLIENT_TICKET_CACHE_KEY = "client.tickets.cache.v1";
const CLIENT_TICKET_CACHE_TTL_MS = 60 * 1000;

let ticketMemoryCache = {
  timestamp: 0,
  data: null,
};
let ticketFetchPromise = null;

export const clientTicketCategories = [
  "Bug / Something not working",
  "Change Request",
  "New Feature Request",
  "Access / Login / Permissions",
  "Performance / Slow",
  "Billing / Invoice",
  "Other",
];

function readCurrentUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function titleCase(value, fallback = "Medium") {
  const text = String(value || fallback).toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res;
}

async function ticketFetch(path = "", options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/tickets${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res;
}

function parseTicketTitle(title) {
  const text = String(title || "").trim();
  const bracketMatch = text.match(/^\[(.+?)\]\s*(.*)$/);
  if (bracketMatch) {
    return {
      category: bracketMatch[1].trim(),
      title: (bracketMatch[2] || "").trim() || text,
    };
  }

  const colonMatch = text.match(/^(.+?):\s*(.*)$/);
  if (colonMatch) {
    return {
      category: colonMatch[1].trim(),
      title: (colonMatch[2] || "").trim() || text,
    };
  }

  return {
    category: "General Support",
    title: text || "Untitled ticket",
  };
}

function mapStatus(status) {
  const value = String(status || "").toUpperCase();
  if (value === "DONE" || value === "CLOSED" || value === "RESOLVED") return "Done";
  if (value === "IN_PROGRESS" || value === "INPROGRESS") return "In Progress";
  return "Open";
}

function getDateString(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
}

function toUiProject(row, idx) {
  const progress = Number(row?.progress ?? row?.completion ?? 0);
  return {
    id: String(row?.id ?? row?.project_id ?? `CP-${idx + 1}`),
    name: row?.name ?? row?.project_name ?? "Support Workstream",
    manager: row?.manager_name ?? row?.manager ?? "Client Support",
    progress: Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0,
    status: row?.status ?? row?.stage ?? "In Progress",
    eta: row?.eta ?? row?.due_date ?? "-",
    tickets: row?.tickets ?? [],
  };
}

function toUiTicket(row, idx) {
  const parsed = parseTicketTitle(row?.title);
  return {
    id: String(row?.id ?? row?.ticket_id ?? `CT-${9000 + idx}`),
    title: parsed.title,
    category: row?.category ?? parsed.category,
    priority: titleCase(row?.priority ?? row?.urgency, "Medium"),
    status: mapStatus(row?.status),
    updatedAt: getDateString(row?.updatedAt ?? row?.updated_at ?? row?.createdAt ?? row?.created_at),
    description: row?.description ?? "",
    createdBy: row?.createdBy?.name ?? row?.createdByName ?? null,
    assignedTo: row?.assignedTo?.name ?? row?.assignedToName ?? null,
  };
}

function toUiProfile(row, user) {
  return {
    name: row?.name ?? user?.name ?? "Client User",
    email: row?.email ?? user?.email ?? "-",
    company: row?.company ?? user?.company ?? "Client Account",
    timezone: row?.timezone ?? "-",
  };
}

function safeReadTicketCache() {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(CLIENT_TICKET_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.data)) return null;
    return {
      timestamp: Number(parsed?.timestamp || 0),
      data: parsed.data,
    };
  } catch {
    return null;
  }
}

function writeTicketCache(data) {
  const payload = {
    timestamp: Date.now(),
    data: Array.isArray(data) ? data : [],
  };

  ticketMemoryCache = payload;

  try {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(CLIENT_TICKET_CACHE_KEY, JSON.stringify(payload));
    }
  } catch {
    // Ignore storage write errors and keep in-memory cache.
  }
}

export function getCachedClientTickets() {
  if (Array.isArray(ticketMemoryCache.data)) {
    return ticketMemoryCache.data;
  }

  const persisted = safeReadTicketCache();
  if (persisted) {
    ticketMemoryCache = persisted;
    return persisted.data;
  }

  return [];
}

export async function fetchClientProjects() {
  const tickets = await fetchClientTickets();
  return buildProjectsFromTickets(tickets);
}

export function buildProjectsFromTickets(tickets) {
  const grouped = new Map();

  tickets.forEach((ticket) => {
    const key = ticket.category || "General Support";
    const existing = grouped.get(key) || {
      id: key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      name: key,
      manager: "Client Support",
      progress: 0,
      status: "Open",
      eta: "-",
      tickets: [],
    };

    existing.tickets.push(ticket);
    grouped.set(key, existing);
  });

  return Array.from(grouped.values()).map((project) => {
    const total = project.tickets.length;
    const done = project.tickets.filter((ticket) => ticket.status === "Done").length;
    const inProgress = project.tickets.filter((ticket) => ticket.status === "In Progress").length;
    const latest = project.tickets
      .map((ticket) => ticket.updatedAt)
      .find((date) => date && date !== "-") || "-";

    return {
      ...project,
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
      status:
        done === total && total > 0
          ? "Resolved"
          : inProgress > 0
            ? "In Progress"
            : "Open",
      eta: latest,
    };
  });
}

export async function fetchClientTickets(options = {}) {
  const forceRefresh = Boolean(options?.forceRefresh);

  const now = Date.now();
  const inMemoryFresh =
    Array.isArray(ticketMemoryCache.data) &&
    now - Number(ticketMemoryCache.timestamp || 0) < CLIENT_TICKET_CACHE_TTL_MS;

  if (!forceRefresh && inMemoryFresh) {
    return ticketMemoryCache.data;
  }

  if (!forceRefresh && !Array.isArray(ticketMemoryCache.data)) {
    const persisted = safeReadTicketCache();
    const persistedFresh =
      Array.isArray(persisted?.data) &&
      now - Number(persisted?.timestamp || 0) < CLIENT_TICKET_CACHE_TTL_MS;
    if (persistedFresh) {
      ticketMemoryCache = persisted;
      return persisted.data;
    }
  }

  if (!forceRefresh && ticketFetchPromise) {
    return ticketFetchPromise;
  }

  ticketFetchPromise = (async () => {
    try {
      const res = await ticketFetch("", { method: "GET" });
      const data = await res.json();
      const mapped = Array.isArray(data) ? data.map(toUiTicket) : [];
      writeTicketCache(mapped);
      return mapped;
    } catch (error) {
      const fallback = getCachedClientTickets();
      if (fallback.length > 0) {
        return fallback;
      }
      throw error;
    } finally {
      ticketFetchPromise = null;
    }
  })();

  return ticketFetchPromise;
}

export async function fetchClientProfile() {
  const user = readCurrentUser();

  try {
    const res = await apiFetch("/auth/me", { method: "GET" });
    const data = await res.json();
    return toUiProfile(data, user);
  } catch {
    return toUiProfile(null, user);
  }
}

export async function fetchClientSummary() {
  try {
    const [projects, tickets] = await Promise.all([
      fetchClientProjects(),
      fetchClientTickets(),
    ]);

    const openTickets = tickets.filter((t) => {
      return t.status === "Open" || t.status === "In Progress";
    }).length;

    const completedMilestones = tickets.filter((ticket) => ticket.status === "Done").length;

    const nextReview =
      projects
        .map((p) => p.eta)
        .find((eta) => eta && eta !== "-") ||
      tickets.map((ticket) => ticket.updatedAt).find((date) => date && date !== "-") ||
      "-";

    return {
      activeProjects: projects.length,
      openTickets,
      completedMilestones,
      nextReview,
    };
  } catch {
    return {
      activeProjects: 0,
      openTickets: 0,
      completedMilestones: 0,
      nextReview: "-",
    };
  }
}

export async function createClientTicket(payload) {
  const category = payload.category || "General Support";
  const cleanTitle = String(payload.title || "").trim();
  const prefixedTitle = cleanTitle.startsWith("[")
    ? cleanTitle
    : `[${category}] ${cleanTitle}`;

  const insertRow = {
    title: prefixedTitle,
    description: payload.description,
    priority: String(payload.urgency || "Medium").toUpperCase(),
    status: "OPEN",
  };

  console.log("[createClientTicket] Sending POST request with:", insertRow);

  try {
    const inserted = await ticketFetch("", {
      method: "POST",
      body: JSON.stringify(insertRow),
    });

    const data = await inserted.json();
    console.log("[createClientTicket] Response from server:", data);
    
    if (!data) {
      throw new Error("Empty response from server");
    }

    const uiTicket = toUiTicket(data, 0);
    console.log("[createClientTicket] Converted to UI format:", uiTicket);
    
    // Force refresh tickets from server
    writeTicketCache([uiTicket]);
    
    return uiTicket;
  } catch (error) {
    console.error("[createClientTicket] Error:", error);
    throw error;
  }
}

