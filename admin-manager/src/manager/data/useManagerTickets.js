import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api";
import { getManagerQueryScope } from "./useManager";

export const managerTicketKeys = {
  all: (scope) => ["managerTickets", scope],
  recent: (scope) => [...managerTicketKeys.all(scope), "recent"],
};

async function fetchRecentEmailTickets() {
  const response = await api.get("/tickets/email/recent");
  return response.data;
}

export function useRecentEmailTickets(enabled = true) {
  const { user } = useAuth() || {};
  const scope = getManagerQueryScope(user);

  return useQuery({
    queryKey: managerTicketKeys.recent(scope),
    queryFn: fetchRecentEmailTickets,
    enabled,
    retry: false,
    // Reduce ticket polling frequency to avoid frequent UI refreshing
    refetchInterval: 120000,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}
