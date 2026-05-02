import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchProjects,
  fetchManagerTasks,
  fetchManagerDevelopers,
} from "../../services/managerService";

export const managerKeys = {
  all: ["manager"],
  projects: () => [...managerKeys.all, "projects"],
  tasks: () => [...managerKeys.all, "tasks"],
  developers: () => [...managerKeys.all, "developers"],
};

export function useManagerProjects(enabled = true) {
  return useQuery({
    queryKey: managerKeys.projects(),
    queryFn: fetchProjects,
    enabled,
    refetchInterval: 30000,
    staleTime: 0,
  });
}

export function useManagerTasks(enabled = true) {
  return useQuery({
    queryKey: managerKeys.tasks(),
    queryFn: fetchManagerTasks,
    enabled,
    refetchInterval: 30000,
    staleTime: 0,
  });
}

export function useManagerDevelopers(enabled = true) {
  return useQuery({
    queryKey: managerKeys.developers(),
    queryFn: fetchManagerDevelopers,
    enabled,
    refetchInterval: 30000,
    staleTime: 0,
  });
}
