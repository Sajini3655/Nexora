import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  fetchProjects,
  fetchManagerTasks,
  fetchManagerDevelopers,
  getProjectKey,
  getTaskProjectKey,
  getTaskProjectName,
} from "../../services/managerService";

export function getManagerQueryScope(user) {
  return String(user?.id ?? user?.email ?? user?.role ?? "anonymous");
}

export const managerKeys = {
  all: (scope) => ["manager", scope],
  projects: (scope) => [...managerKeys.all(scope), "projects"],
  tasks: (scope) => [...managerKeys.all(scope), "tasks"],
  developers: (scope) => [...managerKeys.all(scope), "developers"],
  projectDetails: (scope, projectId) => [...managerKeys.all(scope), "projectDetails", projectId],
};

export function useManagerProjects(enabled = true) {
  const { user } = useAuth() || {};
  const scope = getManagerQueryScope(user);

  return useQuery({
    queryKey: managerKeys.projects(scope),
    queryFn: fetchProjects,
    enabled,
    retry: false,
    // Disable polling - live refresh handles updates, polling adds unnecessary overhead
    refetchInterval: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useManagerTasks(enabled = true) {
  const { user } = useAuth() || {};
  const scope = getManagerQueryScope(user);

  return useQuery({
    queryKey: managerKeys.tasks(scope),
    queryFn: fetchManagerTasks,
    enabled,
    retry: false,
    refetchInterval: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useManagerDevelopers(enabled = true) {
  const { user } = useAuth() || {};
  const scope = getManagerQueryScope(user);

  return useQuery({
    queryKey: managerKeys.developers(scope),
    queryFn: fetchManagerDevelopers,
    enabled,
    retry: false,
    refetchInterval: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
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

