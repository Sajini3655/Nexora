// src/data/subtaskApi.js
// Backend persistence for developer subtasks (story points + done state).
// Used to compute real task progress in the backend.

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

export async function fetchSubtasks(taskId) {
  const res = await apiFetch(`/developer/tasks/${encodeURIComponent(taskId)}/subtasks`, {
    method: "GET",
  });
  return res.json();
}

export async function createSubtask(taskId, { title, points }) {
  const res = await apiFetch(`/developer/tasks/${encodeURIComponent(taskId)}/subtasks`, {
    method: "POST",
    body: JSON.stringify({ title, points }),
  });
  return res.json();
}

export async function updateSubtask(taskId, subtaskId, patch) {
  const res = await apiFetch(
    `/developer/tasks/${encodeURIComponent(taskId)}/subtasks/${encodeURIComponent(subtaskId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(patch),
    }
  );
  return res.json();
}

export async function deleteSubtask(taskId, subtaskId) {
  await apiFetch(
    `/developer/tasks/${encodeURIComponent(taskId)}/subtasks/${encodeURIComponent(subtaskId)}`,
    {
      method: "DELETE",
    }
  );
}
