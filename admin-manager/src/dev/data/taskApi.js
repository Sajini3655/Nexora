import { loadTasks, saveTasks } from "./taskStore";
import { API_BASE_URL } from "../../utils/constants";

const API_BASE = `${API_BASE_URL}/api`;

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

function titleCaseEnum(value) {
  if (!value) return "Medium";
  const text = String(value).replace("_", " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function mapBackendStatusToUi(status) {
  const value = String(status || "").toUpperCase();

  if (value === "DONE" || value === "COMPLETED") return "Completed";
  if (value === "IN_PROGRESS" || value === "INPROGRESS") return "In Progress";
  if (value === "BLOCKED") return "Blocked";

  return "Todo";
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function calculateProgress(completedPointValue, totalPointValue, fallbackProgress = 0) {
  const total = numberOrZero(totalPointValue);
  const completed = numberOrZero(completedPointValue);

  if (total <= 0) {
    return numberOrZero(fallbackProgress);
  }

  return Math.round((completed * 100) / total);
}

function mapBackendTaskToUi(taskDto, existingUiTask) {
  const id = String(taskDto.id);

  const projectId =
    taskDto.projectId ??
    taskDto.project_id ??
    taskDto.project?.id ??
    existingUiTask?.projectId ??
    null;

  const projectName =
    taskDto.projectName ??
    taskDto.project_name ??
    taskDto.project?.name ??
    existingUiTask?.projectName ??
    "";

  const totalStoryPoints = numberOrZero(
    taskDto.totalStoryPoints ??
      taskDto.storyPointCount ??
      taskDto.storyPointsCount ??
      existingUiTask?.totalStoryPoints
  );

  const completedStoryPoints = numberOrZero(
    taskDto.completedStoryPoints ??
      taskDto.doneStoryPoints ??
      existingUiTask?.completedStoryPoints
  );

  const totalPointValue = numberOrZero(
    taskDto.totalPointValue ??
      taskDto.totalPoints ??
      taskDto.estimatedPoints ??
      existingUiTask?.totalPointValue
  );

  const completedPointValue = numberOrZero(
    taskDto.completedPointValue ??
      taskDto.completedPoints ??
      existingUiTask?.completedPointValue
  );

  const progressPercentage = calculateProgress(
    completedPointValue,
    totalPointValue,
    taskDto.progressPercentage ?? existingUiTask?.progressPercentage
  );

  return {
    id,
    title: taskDto.title || "Untitled task",
    description: taskDto.description || "",
    status: mapBackendStatusToUi(taskDto.status),
    assignee: taskDto.assignedToName || taskDto.assigneeName || "You",
    assignedToName: taskDto.assignedToName || taskDto.assigneeName || "You",
    assignedToId: taskDto.assignedToId ?? taskDto.assigned_to_id ?? null,
    dueDate: taskDto.dueDate || taskDto.deadline || "-",
    priority: titleCaseEnum(taskDto.priority),
    projectId,
    projectName,
    createdAt: taskDto.createdAt ?? existingUiTask?.createdAt ?? null,
    updatedAt: taskDto.updatedAt ?? existingUiTask?.updatedAt ?? null,

    totalStoryPoints,
    completedStoryPoints,
    totalPointValue,
    completedPointValue,
    progressPercentage,

    storyPoints: totalStoryPoints,
    subtasks: Array.isArray(existingUiTask?.subtasks) ? existingUiTask.subtasks : [],
  };
}

export async function fetchAssignedTasksFromBackend() {
  const res = await apiFetch("/developer/tasks", { method: "GET" });
  return res.json();
}

export async function fetchAssignedTaskByIdFromBackend(taskId) {
  const res = await apiFetch(`/developer/tasks/${encodeURIComponent(taskId)}`, {
    method: "GET",
  });
  return res.json();
}

export async function fetchProjectTasksFromBackend(projectId) {
  const res = await apiFetch(`/developer/tasks/project/${encodeURIComponent(projectId)}`, {
    method: "GET",
  });

  const backendTasks = await res.json();
  const existing = loadTasks();
  const byId = new Map(existing.map((task) => [String(task.id), task]));

  const mappedFromBackend = Array.isArray(backendTasks)
    ? backendTasks.map((task) => mapBackendTaskToUi(task, byId.get(String(task.id))))
    : [];

  return mappedFromBackend;
}

export async function fetchTaskStoryPoints(taskId) {
  try {
    const res = await apiFetch(`/tasks/${encodeURIComponent(taskId)}/story-points`, {
      method: "GET",
    });
    return res.json();
  } catch (error) {
    const message = String(error?.message || "");
    if (message.includes("403") || message.includes("400")) {
      return [];
    }
    throw error;
  }
}

export async function fetchTaskProgress(taskId) {
  try {
    const res = await apiFetch(`/tasks/${encodeURIComponent(taskId)}/progress`, {
      method: "GET",
    });
    return res.json();
  } catch (error) {
    const message = String(error?.message || "");
    if (message.includes("403") || message.includes("400")) {
      return {
        totalStoryPoints: 0,
        completedStoryPoints: 0,
        totalPointValue: 0,
        completedPointValue: 0,
        progressPercentage: 0,
      };
    }
    throw error;
  }
}

export async function markStoryPointDone(storyPointId) {
  const res = await apiFetch(`/story-points/${encodeURIComponent(storyPointId)}/done`, {
    method: "PATCH",
  });
  return res.json();
}

export async function markStoryPointTodo(storyPointId) {
  const res = await apiFetch(`/story-points/${encodeURIComponent(storyPointId)}/todo`, {
    method: "PATCH",
  });
  return res.json();
}

export async function syncAssignedTasksToLocalStoreSafe() {
  try {
    const backendTasks = await fetchAssignedTasksFromBackend();
    const existing = loadTasks();
    const byId = new Map(existing.map((task) => [String(task.id), task]));

    const mappedFromBackend = Array.isArray(backendTasks)
      ? backendTasks.map((task) => mapBackendTaskToUi(task, byId.get(String(task.id))))
      : [];

    saveTasks(mappedFromBackend);
    return mappedFromBackend;
  } catch {
    return loadTasks();
  }
}

