import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDeveloperTicketsFromBackend,
  fetchDeveloperTicketByIdFromBackend,
  createDeveloperTicketOnBackend,
} from "./ticketApi";


export const devTicketKeys = {
  all: ["devTickets"] as const,
  list: () => [...devTicketKeys.all, "list"] as const,
  detail: (id: string) => [...devTicketKeys.all, "detail", id] as const,
};


export function useDeveloperTickets(enabled = true) {
  return useQuery({
    queryKey: devTicketKeys.list(),
    queryFn: fetchDeveloperTicketsFromBackend,
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}


export function useDeveloperTicket(ticketId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: devTicketKeys.detail(ticketId || ""),
    queryFn: () => fetchDeveloperTicketByIdFromBackend(ticketId!),
    enabled: enabled && !!ticketId,
    staleTime: 5 * 60 * 1000,
  });
}


export function useCreateDeveloperTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeveloperTicketOnBackend,
    onSuccess: (newTicket) => {
      queryClient.invalidateQueries({
        queryKey: devTicketKeys.list(),
      });
      queryClient.setQueryData(devTicketKeys.list(), (old: any[]) => {
        if (!Array.isArray(old)) return [newTicket];
        return [newTicket, ...old];
      });
    },
  });
}

