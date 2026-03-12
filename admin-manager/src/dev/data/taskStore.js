// admin-manager/src/dev/data/taskStore.js
// UI-only persistence for developer tasks (keeps subtasks/story points after navigation)

import { tasks as seedTasks } from "./devWorkspaceMock";

const STORAGE_KEY = "nexora_dev_tasks_v1";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function ensureSubtaskIds(list) {
  return list.map((task) => ({
    ...task,
    subtasks: (task.subtasks || []).map((sub, idx) => ({
      id: sub.id || `${task.id}-ST-${idx + 1}`,
      title: sub.title,
      points: sub.points,
      done: !!sub.done,
    })),
  }));
}

export function loadTasks() {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  const parsed = raw ? safeParse(raw) : null;
  const base = Array.isArray(parsed) ? parsed : seedTasks;
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
