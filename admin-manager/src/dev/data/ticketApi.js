import { API_BASE_URL } from "../../utils/constants";

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

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res;
}

function titleCase(value) {
  const text = String(value || "MEDIUM").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function mapStatus(status) {
  const value = String(status || "").toUpperCase();
  if (value === "DONE" || value === "CLOSED" || value === "RESOLVED") return "Done";
  if (value === "IN_PROGRESS" || value === "INPROGRESS") return "In Progress";
  return "Open";
}

export function mapBackendTicketToUi(ticket) {
  return {
    id: String(ticket.id),
    title: ticket.title || "Untitled ticket",
    status: mapStatus(ticket.status),
    severity: titleCase(ticket.priority),
    createdVia: "BACKEND",
    createdAt: ticket.createdAt || "-",
    description: ticket.description || "",
    client: ticket.createdBy?.name ? { name: ticket.createdBy.name } : null,
    detectedFrom: null,
    suggestedSubtasks: [],
  };
}

export function mapUiTicketStatusToBackend(status) {
  const value = String(status || "").toLowerCase();
  if (value === "done" || value === "closed" || value === "resolved") return "DONE";
  if (value === "in progress") return "IN_PROGRESS";
  return "OPEN";
}

export function mapUiSeverityToPriority(severity) {
  const value = String(severity || "Medium").toLowerCase();
  if (value === "high") return "HIGH";
  if (value === "low") return "LOW";
  return "MEDIUM";
}

export async function fetchDeveloperTicketsFromBackend() {
  const res = await apiFetch("/tickets", { method: "GET" });
  const data = await res.json();
  return Array.isArray(data) ? data.map(mapBackendTicketToUi) : [];
}

export async function fetchDeveloperTicketByIdFromBackend(ticketId) {
  const res = await apiFetch(`/tickets/${encodeURIComponent(ticketId)}`, { method: "GET" });
  return mapBackendTicketToUi(await res.json());
}

export async function createDeveloperTicketOnBackend(payload) {
  const res = await apiFetch("/tickets", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      status: mapUiTicketStatusToBackend(payload.status),
      priority: mapUiSeverityToPriority(payload.severity),
    }),
  });

  return mapBackendTicketToUi(await res.json());
}

export async function loadDeveloperTicketsFromBackendSafe() {
  try {
    return await fetchDeveloperTicketsFromBackend();
  } catch {
    return [];
  }
}

export async function loadDeveloperTicketByIdFromBackendSafe(ticketId) {
  try {
    return await fetchDeveloperTicketByIdFromBackend(ticketId);
  } catch {
    return null;
  }
}

export async function createDeveloperTicketOnBackendSafe(payload) {
  try {
    return await createDeveloperTicketOnBackend(payload);
  } catch {
    return null;
  }
}
