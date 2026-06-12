import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchClientTickets,
  fetchClientProjects,
  createClientTicket,
} from "./clientService";


export const clientDataKeys = {
  all: ["clientData"] as const,
  tickets: () => [...clientDataKeys.all, "tickets"] as const,
  projects: () => [...clientDataKeys.all, "projects"] as const,
};


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


export function useCreateClientTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClientTicket,
    onSuccess: (newTicket) => {
      queryClient.invalidateQueries({
        queryKey: clientDataKeys.tickets(),
      });
      queryClient.setQueryData(clientDataKeys.tickets(), (old: any[]) => {
        if (!Array.isArray(old)) return [newTicket];
        return [newTicket, ...old];
      });
    },
  });
}

