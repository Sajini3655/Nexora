import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchClientTickets,
  fetchClientProjects,
  createClientTicket,
} from "./clientService";

/**
 * Query key factory for client-side queries
 */
export const clientDataKeys = {
  all: ["clientData"] as const,
  tickets: () => [...clientDataKeys.all, "tickets"] as const,
  projects: () => [...clientDataKeys.all, "projects"] as const,
};

/**
 * Fetch all client tickets with 30s refetch and staleTime=0 (always refetch in background)
 */
export function useClientTickets(enabled = true) {
  return useQuery({
    queryKey: clientDataKeys.tickets(),
    queryFn: fetchClientTickets,
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/**
 * Fetch all client projects with 30s refetch
 */
export function useClientProjects(enabled = true) {
  return useQuery({
    queryKey: clientDataKeys.projects(),
    queryFn: fetchClientProjects,
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/**
 * Create a new client ticket
 */
export function useCreateClientTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClientTicket,
    onSuccess: (newTicket) => {
      // Invalidate tickets list to refetch
      queryClient.invalidateQueries({
        queryKey: clientDataKeys.tickets(),
      });
      // Optimistically update: prepend new ticket to cache
      queryClient.setQueryData(clientDataKeys.tickets(), (old: any[]) => {
        if (!Array.isArray(old)) return [newTicket];
        return [newTicket, ...old];
      });
    },
  });
}
