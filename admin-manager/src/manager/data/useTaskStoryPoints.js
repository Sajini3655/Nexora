import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";

export const storyPointsKeys = {
  all: ["storyPoints"],
  byTask: (taskId) => [...storyPointsKeys.all, "task", taskId],
};

async function fetchTaskStoryPoints(taskId) {
  if (!taskId) {
    return [];
  }
  const response = await api.get(`/tasks/${taskId}/story-points`);
  return Array.isArray(response.data) ? response.data : [];
}

export function useTaskStoryPoints(taskId, enabled = true) {
  return useQuery({
    queryKey: storyPointsKeys.byTask(taskId),
    queryFn: () => fetchTaskStoryPoints(taskId),
    enabled: enabled && Boolean(taskId),
    staleTime: 30000,
    gcTime: 10 * 60 * 1000,
  });
}
