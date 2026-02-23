// src/data/taskApi.js
// Sync tasks assigned to the current developer from the shared backend.
// This enables: Manager assigns a task -> Developer sees it in their dashboard.

import { loadTasks, saveTasks } from "./taskStore";

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
  if (token) headers.Authorization = `Bearer ${token}`;

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

function titleCaseEnum(v) {
  if (!v) return "Medium";
  const s = String(v).toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function mapBackendStatusToUi(status) {
  const s = String(status || "").toUpperCase();
  if (s === "DONE") return "Completed";
  return "Assigned"; // TODO / IN_PROGRESS
}

function mapBackendTaskToUi(taskDto, existingUiTask) {
  const id = String(taskDto.id);
  return {
    id,
    title: taskDto.title,
    description: taskDto.description || "",
    status: mapBackendStatusToUi(taskDto.status),
    assignee: taskDto.assignedToName || "You",
    dueDate: taskDto.dueDate || "-",
    priority: titleCaseEnum(taskDto.priority),
    storyPoints: taskDto.estimatedPoints ?? 1,
    // Keep existing subtasks (UI-only) so progress stays.
    subtasks: Array.isArray(existingUiTask?.subtasks) ? existingUiTask.subtasks : [],
  };
}

export async function fetchAssignedTasksFromBackend() {
  const res = await apiFetch("/developer/tasks", { method: "GET" });
  return res.json();
}

export async function fetchAssignedTaskByIdFromBackend(taskId) {
  const res = await apiFetch(`/developer/tasks/${encodeURIComponent(taskId)}`, { method: "GET" });
  return res.json();
}

/**
 * Pull backend tasks and merge into local taskStore (keeps subtasks).
 */
export async function syncAssignedTasksToLocalStoreSafe() {
  try {
    const backendTasks = await fetchAssignedTasksFromBackend();
    const existing = loadTasks();
    const byId = new Map(existing.map((t) => [String(t.id), t]));

    const mappedFromBackend = Array.isArray(backendTasks)
      ? backendTasks.map((t) => mapBackendTaskToUi(t, byId.get(String(t.id))))
      : [];

    const backendIds = new Set(mappedFromBackend.map((t) => String(t.id)));
    const localOnly = existing.filter((t) => !backendIds.has(String(t.id)));

    const merged = [...mappedFromBackend, ...localOnly];
    saveTasks(merged);
    return merged;
  } catch {
    return loadTasks();
  }
}
