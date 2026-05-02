import { useQuery } from "@tanstack/react-query";
import {
  fetchTeamTimesheets,
  fetchTeamTimesheetSummary,
} from "../../services/timesheetService";

export const timesheetKeys = {
  all: ["timesheets"],
  team: () => [...timesheetKeys.all, "team"],
  teamWithStatus: (status) => [...timesheetKeys.team(), status],
  teamSummary: () => [...timesheetKeys.all, "teamSummary"],
};

async function fetchTeamTimesheetsWithStatus(status) {
  const filters = status && status !== "ALL" ? { status } : {};
  return fetchTeamTimesheets(filters);
}

export function useTeamTimesheets(status = "ALL", enabled = true) {
  return useQuery({
    queryKey: timesheetKeys.teamWithStatus(status),
    queryFn: () => fetchTeamTimesheetsWithStatus(status),
    enabled,
    refetchInterval: 30000,
    staleTime: 0,
  });
}

export function useTeamTimesheetsSummary(enabled = true) {
  return useQuery({
    queryKey: timesheetKeys.teamSummary(),
    queryFn: fetchTeamTimesheetSummary,
    enabled,
    refetchInterval: 30000,
    staleTime: 0,
  });
}
