import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchProjects,
  fetchManagerTasks,
  fetchManagerDevelopers,
  getProjectKey,
  getTaskProjectKey,
  getTaskProjectName,
} from "../../services/managerService";

export const managerKeys = {
  all: ["manager"],
  projects: () => [...managerKeys.all, "projects"],
  tasks: () => [...managerKeys.all, "tasks"],
  developers: () => [...managerKeys.all, "developers"],
  projectDetails: (projectId) => [...managerKeys.all, "projectDetails", projectId],
};

export function useManagerProjects(enabled = true) {
  return useQuery({
    queryKey: managerKeys.projects(),
    queryFn: fetchProjects,
    enabled,
    // Reduce polling to be less aggressive and avoid continuous UI refreshing
    refetchInterval: 120000,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}

export function useManagerTasks(enabled = true) {
  return useQuery({
    queryKey: managerKeys.tasks(),
    queryFn: fetchManagerTasks,
    enabled,
    refetchInterval: 120000,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}

export function useManagerDevelopers(enabled = true) {
  return useQuery({
    queryKey: managerKeys.developers(),
    queryFn: fetchManagerDevelopers,
    enabled,
    refetchInterval: 120000,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}

export function useProjectDetails(projectId, enabled = true) {
  const projectsQuery = useManagerProjects(enabled);
  const tasksQuery = useManagerTasks(enabled);

  const projectWithTasks = useMemo(() => {
    if (!projectId) {
      return null;
    }

    const projects = Array.isArray(projectsQuery.data) ? projectsQuery.data : [];
    const tasks = Array.isArray(tasksQuery.data) ? tasksQuery.data : [];

    const project = projects.find((p) => getProjectKey(p) === String(projectId));
    
    if (!project) {
      return null;
    }

    const projectName = String(project?.name ?? project?.projectName ?? "")
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
  }, [projectId, projectsQuery.data, tasksQuery.data]);

  return {
    data: projectWithTasks,
    isLoading: projectsQuery.isLoading || tasksQuery.isLoading,
    isError: projectsQuery.isError || tasksQuery.isError,
    error: projectsQuery.error || tasksQuery.error,
    refetch: async () => {
      await Promise.all([projectsQuery.refetch(), tasksQuery.refetch()]);
    },
  };
}

