import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";

export const managerTicketKeys = {
  all: ["managerTickets"],
  recent: () => [...managerTicketKeys.all, "recent"],
};

async function fetchRecentEmailTickets() {
  const response = await api.get("/tickets/email/recent");
  return response.data;
}

export function useRecentEmailTickets(enabled = true) {
  return useQuery({
    queryKey: managerTicketKeys.recent(),
    queryFn: fetchRecentEmailTickets,
    enabled,
    refetchInterval: 30000,
    staleTime: 0,
  });
}
