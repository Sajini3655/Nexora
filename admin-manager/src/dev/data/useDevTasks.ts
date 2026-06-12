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


export const devTaskKeys = {
  all: ["devTasks"] as const,
  assignedTasks: () => [...devTaskKeys.all, "assigned"] as const,
  assignedTask: (id: string) => [...devTaskKeys.assignedTasks(), id] as const,
  projectTasks: (projectId: string) => [...devTaskKeys.all, "project", projectId] as const,
  storyPoints: (taskId: string) => [...devTaskKeys.all, "storyPoints", taskId] as const,
  taskProgress: (taskId: string) => [...devTaskKeys.all, "progress", taskId] as const,
};


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


export function useAssignedTask(taskId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: devTaskKeys.assignedTask(taskId || ""),
    queryFn: () => fetchAssignedTaskByIdFromBackend(taskId!),
    enabled: enabled && !!taskId,
    staleTime: 5 * 60 * 1000,
  });
}


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


export function useTaskStoryPoints(taskId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: devTaskKeys.storyPoints(taskId || ""),
    queryFn: () => fetchTaskStoryPoints(taskId!),
    enabled: enabled && !!taskId,
    staleTime: 5 * 60 * 1000,
  });
}


export function useTaskProgress(taskId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: devTaskKeys.taskProgress(taskId || ""),
    queryFn: () => fetchTaskProgress(taskId!),
    enabled: enabled && !!taskId,
    staleTime: 5 * 60 * 1000,
  });
}


export function useMarkStoryPointDone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markStoryPointDone,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: devTaskKeys.assignedTasks(),
      });
    },
  });
}


export function useMarkStoryPointTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markStoryPointTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: devTaskKeys.assignedTasks(),
      });
    },
  });
}


export function useCreateStoryPoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }) =>
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

