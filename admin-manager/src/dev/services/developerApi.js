const API_BASE = "http://localhost:8081/api";

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

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response;
}

export function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.tasks)) return value.tasks;
  if (Array.isArray(value?.projects)) return value.projects;
  if (Array.isArray(value?.tickets)) return value.tickets;
  return [];
}

export function formatDateTime(value) {
  if (!value) return "-";
  const text = String(value).replace("T", " ");
  return text.length > 16 ? text.slice(0, 16) : text;
}

export function formatLabel(value) {
  if (!value) return "-";
  const text = String(value)
    .replace(/_/g, " ")
    .toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function isCompletedTask(task) {
  const status = String(task?.status || "").toUpperCase();
  return status === "DONE" || status === "COMPLETED" || status === "CLOSED";
}

export function formatTaskStatus(task) {
  const status = String(task?.status || "").toUpperCase();
  if (status === "DONE" || status === "COMPLETED" || status === "CLOSED") return "Completed";
  if (status === "IN_PROGRESS" || status === "INPROGRESS") return "In Progress";
  return "Assigned";
}

export function formatTicketStatus(ticket) {
  const status = String(ticket?.status || "").toUpperCase();
  if (status === "DONE" || status === "CLOSED" || status === "RESOLVED") return "Done";
  if (status === "IN_PROGRESS" || status === "INPROGRESS") return "In Progress";
  return "Open";
}

export function formatPriority(value) {
  return formatLabel(value || "MEDIUM");
}

export function deriveSingleProject(tasks) {
  const grouped = new Map();

  tasks.forEach((task) => {
    const key = String(task?.projectId ?? "");
    if (!key) return;

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        name: task?.projectName || `Project ${key}`,
        tasks: [],
      });
    }

    grouped.get(key).tasks.push(task);
  });

  const projects = [...grouped.values()].map((project) => {
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(isCompletedTask).length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      ...project,
      totalTasks,
      completedTasks,
      openTasks: totalTasks - completedTasks,
      progress,
    };
  });

  return projects[0] || null;
}

export function mapTask(task) {
  return {
    id: String(task?.id ?? ""),
    title: task?.title || "Untitled task",
    description: task?.description || "",
    status: formatTaskStatus(task),
    priority: formatPriority(task?.priority),
    dueDate: task?.dueDate || "-",
    estimatedPoints: task?.estimatedPoints ?? 0,
    createdAt: formatDateTime(task?.createdAt),
    projectId: task?.projectId != null ? String(task.projectId) : "",
    projectName: task?.projectName || "",
    assignedToName: task?.assignedToName || "You",
    raw: task,
  };
}

export function mapTicket(ticket) {
  const createdByName = ticket?.createdBy?.name || ticket?.createdByName || "You";
  const assignedToName = ticket?.assignedTo?.name || ticket?.assignedToName || "";

  return {
    id: String(ticket?.id ?? ""),
    title: ticket?.title || "Untitled ticket",
    description: ticket?.description || "",
    status: formatTicketStatus(ticket),
    priority: formatPriority(ticket?.priority),
    createdAt: formatDateTime(ticket?.createdAt),
    updatedAt: formatDateTime(ticket?.updatedAt),
    createdByName,
    assignedToName,
    raw: ticket,
  };
}

export async function fetchDeveloperProfile() {
  const response = await apiFetch("/developer/profile");
  return response.json();
}

export async function saveDeveloperProfile(profile) {
  const response = await apiFetch("/developer/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
  return response.json();
}

export async function fetchDeveloperTasks() {
  const response = await apiFetch("/developer/tasks");
  const data = await response.json();
  return normalizeArray(data).map(mapTask);
}

export async function fetchDeveloperTaskById(taskId) {
  const response = await apiFetch(`/developer/tasks/${encodeURIComponent(taskId)}`);
  const data = await response.json();
  return data ? mapTask(data) : null;
}

export async function fetchDeveloperTickets() {
  const response = await apiFetch("/tickets");
  const data = await response.json();
  return normalizeArray(data).map(mapTicket);
}

export async function fetchDeveloperTicketById(ticketId) {
  const response = await apiFetch(`/tickets/${encodeURIComponent(ticketId)}`);
  const data = await response.json();
  return data ? mapTicket(data) : null;
}

export async function createDeveloperTicket(payload) {
  const response = await apiFetch("/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return mapTicket(data);
}

export async function startProjectChat(projectId) {
  const response = await apiFetch(`/chat/start/${encodeURIComponent(projectId)}`, {
    method: "POST",
  });
  return response.json();
}

export async function fetchProjectChatMessages(sessionId) {
  const response = await apiFetch(`/chat/messages/${encodeURIComponent(sessionId)}`);
  return response.json();
}

export async function changeMyPassword(currentPassword, newPassword) {
  const response = await apiFetch("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return response.json();
}
