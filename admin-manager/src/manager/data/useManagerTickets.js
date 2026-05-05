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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
