import api from "./api";

export const createProject = async (payload) => {
  const response = await api.post("/manager/projects", payload);
  return response.data;
};

export const normalizeArray = (value) => {
  const visited = new Set();

  const tryExtract = (node, depth = 0) => {
    if (depth > 4) return [];
    if (Array.isArray(node)) return node;
    if (!node || typeof node !== "object") return [];
    if (visited.has(node)) return [];
    visited.add(node);

    const directKeys = [
      "data",
      "projects",
      "tasks",
      "developers",
      "content",
      "items",
      "rows",
      "results",
      "list",
      "payload",
      "result",
      "value",
    ];

    for (const key of directKeys) {
      if (Array.isArray(node?.[key])) {
        return node[key];
      }
    }

    for (const key of directKeys) {
      const nested = node?.[key];
      if (nested && typeof nested === "object") {
        const extracted = tryExtract(nested, depth + 1);
        if (Array.isArray(extracted) && extracted.length >= 0 && (extracted.length > 0 || key === "content" || key === "items" || key === "tasks" || key === "projects" || key === "developers")) {
          return extracted;
        }
      }
    }

    const objectValues = Object.values(node);
    for (const entry of objectValues) {
      if (Array.isArray(entry)) {
        return entry;
      }
    }

    for (const entry of objectValues) {
      if (entry && typeof entry === "object") {
        const extracted = tryExtract(entry, depth + 1);
        if (Array.isArray(extracted) && extracted.length > 0) {
          return extracted;
        }
      }
    }

    return [];
  };

  return tryExtract(value);
};

export const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

export const fetchProjects = async () => {
  const response = await api.get("/manager/projects/mine");
  return normalizeArray(response.data);
};

export const fetchManagerClients = async () => {
  const response = await api.get("/manager/clients");
  return normalizeArray(response.data);
};

export const fetchManagerTasks = async () => {
  const response = await api.get("/manager/tasks");
  return normalizeArray(response.data);
};

export const fetchManagerDevelopers = async () => {
  const response = await api.get("/manager/developers");
  return normalizeArray(response.data);
};

export const suggestManagerTaskAssignment = async (payload) => {
  const response = await api.post("/manager/tasks/suggest", payload);
  return response.data;
};

export const createManagerTask = async (payload) => {
  const response = await api.post("/manager/tasks", payload);
  return response.data;
};

export const assignManagerTaskAssignee = async (taskId, assignedToId) => {
  const response = await api.patch(`/manager/tasks/${taskId}/assignee`, {
    assignedToId,
  });
  return response.data;
};

export const updateProject = async (projectId, payload) => {
  const response = await api.put(`/manager/projects/${projectId}`, payload);
  return response.data;
};

export const updateManagerTask = async (taskId, payload) => {
  const response = await api.put(`/manager/tasks/${taskId}`, payload);
  return response.data;
};

export const fetchDeveloperProgressSummary = async (developerId) => {
  const response = await api.get(`/developers/${developerId}/progress`);
  return response.data;
};

export const getProjectKey = (project) =>
  String(project?.id ?? project?.projectId ?? project?.project_id ?? "");

export const getTaskProjectKey = (task) =>
  String(
    task?.projectId ??
      task?.project_id ??
      task?.project?.id ??
      task?.project?.projectId ??
      task?.projectDetails?.id ??
      task?.projectDetails?.projectId ??
      task?.projectDTO?.id ??
      task?.projectDTO?.projectId ??
      ""
  );

export const getTaskProjectName = (task) =>
  String(
    task?.projectName ??
      task?.project?.name ??
      task?.project?.projectName ??
      task?.projectDetails?.name ??
      task?.projectDetails?.projectName ??
      task?.projectDTO?.name ??
      task?.projectDTO?.projectName ??
      ""
  )
    .trim()
    .toLowerCase();

export const fetchProjectDetails = async (projectId) => {
  const [projectsRes, tasksRes] = await Promise.all([
    fetchProjects(),
    fetchManagerTasks(),
  ]);

  const projects = normalizeArray(projectsRes);
  const tasks = normalizeArray(tasksRes);

  const project = projects.find(
    (p) => getProjectKey(p) === String(projectId)
  );

  if (!project) {
    return null;
  }

  const projectName = String(
    project?.name ?? project?.projectName ?? ""
  )
    .trim()
    .toLowerCase();

  const projectTasks = tasks.filter((task) => {
    const taskProjectId = getTaskProjectKey(task);
    const taskProjectName = getTaskProjectName(task);

    return (
      taskProjectId === String(projectId) ||
      (projectName && taskProjectName === projectName)
    );
  });

  return {
    ...project,
    tasks: projectTasks,
  };
};
