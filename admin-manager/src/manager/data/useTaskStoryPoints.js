import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api";
import { getManagerQueryScope } from "./useManager";

export const storyPointsKeys = {
  all: (scope) => ["storyPoints", scope],
  byTask: (scope, taskId) => [...storyPointsKeys.all(scope), "task", taskId],
};

async function fetchTaskStoryPoints(taskId) {
  if (!taskId) {
    return [];
  }
  const response = await api.get(`/tasks/${taskId}/story-points`);
  return Array.isArray(response.data) ? response.data : [];
}

export function useTaskStoryPoints(taskId, enabled = true) {
  const { user } = useAuth() || {};
  const scope = getManagerQueryScope(user);

  return useQuery({
    queryKey: storyPointsKeys.byTask(scope, taskId),
    queryFn: () => fetchTaskStoryPoints(taskId),
    enabled: enabled && Boolean(taskId),
    staleTime: 30000,
    gcTime: 10 * 60 * 1000,
  });
}
