// src/data/taskStore.js
// UI-only persistence for tasks (keeps subtasks/story points after navigation)

// NOTE: This store is only a *cache* for tasks pulled from the backend.
// We purposely do NOT seed mock tasks here because they can conflict with
// real backend task ids (and cause 404s when calling /api/developer/tasks/:id).
//
// Bump the storage key when changing behavior to avoid stale local data.
const STORAGE_KEY = "nexora_dev_tasks_v2";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function ensureSubtaskIds(tasks) {
  return tasks.map((t) => ({
    ...t,
    subtasks: (t.subtasks || []).map((s, idx) => ({
      // keep existing id if present; otherwise create a stable-ish one
      id: s.id || `${t.id}-ST-${idx + 1}`,
      title: s.title,
      points: s.points,
      done: !!s.done,
    })),
  }));
}

export function loadTasks() {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  const parsed = raw ? safeParse(raw) : null;
  const base = Array.isArray(parsed) ? parsed : [];
  return ensureSubtaskIds(base);
}

export function saveTasks(tasks) {
  if (typeof window === "undefined") return;
  const normalized = ensureSubtaskIds(tasks);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export function updateTask(taskId, updater) {
  const tasks = loadTasks();
  const next = tasks.map((t) => (t.id === taskId ? updater(t) : t));
  saveTasks(next);
  return next;
}
