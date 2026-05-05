import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAssignedTasksFromBackend,
  fetchAssignedTaskByIdFromBackend,
  fetchProjectTasksFromBackend,
  fetchTaskStoryPoints,
  fetchTaskProgress,
  markStoryPointDone,
  markStoryPointTodo,
} from "./taskApi";

/**
 * Query key factory for developer task queries
 */
export const devTaskKeys = {
  all: ["devTasks"] as const,
  assignedTasks: () => [...devTaskKeys.all, "assigned"] as const,
  assignedTask: (id: string) => [...devTaskKeys.assignedTasks(), id] as const,
  projectTasks: (projectId: string) => [...devTaskKeys.all, "project", projectId] as const,
  storyPoints: (taskId: string) => [...devTaskKeys.all, "storyPoints", taskId] as const,
  taskProgress: (taskId: string) => [...devTaskKeys.all, "progress", taskId] as const,
};

/**
 * Fetch all assigned tasks for developer with 30s refetch
 */
export function useAssignedTasks(enabled = true) {
  return useQuery({
    queryKey: devTaskKeys.assignedTasks(),
    queryFn: fetchAssignedTasksFromBackend,
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/**
 * Fetch single assigned task by ID
 */
export function useAssignedTask(taskId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: devTaskKeys.assignedTask(taskId || ""),
    queryFn: () => fetchAssignedTaskByIdFromBackend(taskId!),
    enabled: enabled && !!taskId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch all tasks for a project with 30s refetch
 */
export function useProjectTasks(projectId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: devTaskKeys.projectTasks(projectId || ""),
    queryFn: () => fetchProjectTasksFromBackend(projectId!),
    enabled: enabled && !!projectId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/**
 * Fetch task story points
 */
export function useTaskStoryPoints(taskId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: devTaskKeys.storyPoints(taskId || ""),
    queryFn: () => fetchTaskStoryPoints(taskId!),
    enabled: enabled && !!taskId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch task progress
 */
export function useTaskProgress(taskId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: devTaskKeys.taskProgress(taskId || ""),
    queryFn: () => fetchTaskProgress(taskId!),
    enabled: enabled && !!taskId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Mark story point as done
 */
export function useMarkStoryPointDone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markStoryPointDone,
    onSuccess: () => {
      // Invalidate all task queries
      queryClient.invalidateQueries({
        queryKey: devTaskKeys.assignedTasks(),
      });
    },
  });
}

/**
 * Mark story point as todo
 */
export function useMarkStoryPointTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markStoryPointTodo,
    onSuccess: () => {
      // Invalidate all task queries
      queryClient.invalidateQueries({
        queryKey: devTaskKeys.assignedTasks(),
      });
    },
  });
}

/**
 * Create a story point (for developers assigned to the task)
 */
export function useCreateStoryPoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }) =>
      // import is dynamic to avoid circular issues; taskApi exports createTaskStoryPoint
      import("./taskApi").then((m) => m.createTaskStoryPoint(taskId, data)),
    onSuccess: (_data, variables) => {
      const taskId = String(variables.taskId);
      queryClient.invalidateQueries({ queryKey: devTaskKeys.storyPoints(taskId) });
      queryClient.invalidateQueries({ queryKey: devTaskKeys.taskProgress(taskId) });
      queryClient.invalidateQueries({ queryKey: devTaskKeys.assignedTask(taskId) });
      queryClient.invalidateQueries({ queryKey: devTaskKeys.assignedTasks() });
    },
  });
}
