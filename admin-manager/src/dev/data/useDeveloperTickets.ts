import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDeveloperTicketsFromBackend,
  fetchDeveloperTicketByIdFromBackend,
  createDeveloperTicketOnBackend,
} from "./ticketApi";

/**
 * Query key factory for developer ticket queries
 */
export const devTicketKeys = {
  all: ["devTickets"] as const,
  list: () => [...devTicketKeys.all, "list"] as const,
  detail: (id: string) => [...devTicketKeys.all, "detail", id] as const,
};

/**
 * Fetch all developer tickets with 30s refetch and staleTime=0
 */
export function useDeveloperTickets(enabled = true) {
  return useQuery({
    queryKey: devTicketKeys.list(),
    queryFn: fetchDeveloperTicketsFromBackend,
    enabled,
    refetchInterval: 30000, // 30 seconds
    staleTime: 0, // Always stale, refetch in background
  });
}

/**
 * Fetch single developer ticket by ID
 */
export function useDeveloperTicket(ticketId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: devTicketKeys.detail(ticketId || ""),
    queryFn: () => fetchDeveloperTicketByIdFromBackend(ticketId!),
    enabled: enabled && !!ticketId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create a new developer ticket
 */
export function useCreateDeveloperTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeveloperTicketOnBackend,
    onSuccess: (newTicket) => {
      // Invalidate tickets list to refetch
      queryClient.invalidateQueries({
        queryKey: devTicketKeys.list(),
      });
      // Optimistically update: prepend new ticket to cache
      queryClient.setQueryData(devTicketKeys.list(), (old: any[]) => {
        if (!Array.isArray(old)) return [newTicket];
        return [newTicket, ...old];
      });
    },
  });
}
