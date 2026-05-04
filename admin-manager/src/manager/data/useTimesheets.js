import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  fetchTeamTimesheets,
  fetchTeamTimesheetSummary,
} from "../../services/timesheetService";
import { getManagerQueryScope } from "./useManager";

export const timesheetKeys = {
  all: (scope) => ["timesheets", scope],
  team: (scope) => [...timesheetKeys.all(scope), "team"],
  teamWithStatus: (scope, status) => [...timesheetKeys.team(scope), status],
  teamSummary: (scope) => [...timesheetKeys.all(scope), "teamSummary"],
};

async function fetchTeamTimesheetsWithStatus(status) {
  const filters = status && status !== "ALL" ? { status } : {};
  return fetchTeamTimesheets(filters);
}

export function useTeamTimesheets(status = "ALL", enabled = true) {
  const { user } = useAuth() || {};
  const scope = getManagerQueryScope(user);

  return useQuery({
    queryKey: timesheetKeys.teamWithStatus(scope, status),
    queryFn: () => fetchTeamTimesheetsWithStatus(status),
    enabled,
    refetchInterval: 30000,
    staleTime: 0,
  });
}

export function useTeamTimesheetsSummary(enabled = true) {
  const { user } = useAuth() || {};
  const scope = getManagerQueryScope(user);

  return useQuery({
    queryKey: timesheetKeys.teamSummary(scope),
    queryFn: fetchTeamTimesheetSummary,
    enabled,
    refetchInterval: 30000,
    staleTime: 0,
  });
}
