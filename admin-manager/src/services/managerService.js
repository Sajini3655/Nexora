import api from "./api";

export const createProject = async (payload) => {
  const response = await api.post("/manager/projects", payload);
  return response.data;
};

export const fetchProjects = async () => {
  const response = await api.get("/manager/projects/mine");
  return response.data;
};

export const getMyProjects = fetchProjects;

export const fetchManagerTasks = async () => {
  const response = await api.get("/manager/tasks");
  return response.data;
};

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.projects)) return value.projects;
  if (Array.isArray(value?.tasks)) return value.tasks;
  if (Array.isArray(value?.content)) return value.content;
  return [];
};

const getProjectKey = (project) =>
  String(project?.id ?? project?.projectId ?? project?.project_id ?? "");

const getTaskProjectKey = (task) =>
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

const getTaskProjectName = (task) =>
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

  console.log("MATCHED PROJECT:", project);
  console.log("MATCHED TASKS:", projectTasks);
  console.log("ALL TASKS:", tasks);

  tasks.forEach((task, index) => {
    console.log(`TASK ${index + 1}:`, JSON.stringify(task, null, 2));
  });

  return {
    ...project,
    tasks: projectTasks,
  };
};