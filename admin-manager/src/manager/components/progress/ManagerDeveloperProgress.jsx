import React, { useEffect, useMemo, useRef } from "react";
import { Box, Chip, Paper, Stack, Typography, Button } from "@mui/material";
import { useManagerDevelopers, useManagerTasks } from "../../data/useManager";
import { getErrorMessage } from "../../../services/managerService";
import ErrorNotice from "/src/components/ui/ErrorNotice.jsx";
import DeveloperProgressTable from "./DeveloperProgressTable";

function isDelayedTask(task) {
  const due = task?.dueDate;
  if (!due) return false;

  const dueDate = new Date(due);
  if (Number.isNaN(dueDate.getTime())) return false;

  return !taskIsCompleted(task) && dueDate < new Date();
}

function taskIsCompleted(task) {
  const status = String(task?.status || task?.taskStatus || task?.state || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");

  if (["done", "completed", "complete", "closed", "resolved", "finished"].includes(status)) {
    return true;
  }

  const totalPointValue = Number(task?.totalPointValue ?? task?.estimatedPoints ?? task?.totalStoryPoints ?? 0);
  const completedPointValue = Number(task?.completedPointValue ?? task?.completedStoryPoints ?? 0);
  return totalPointValue > 0 && completedPointValue >= totalPointValue;
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function buildSummariesFromTasks(developers, tasks) {
  const byId = new Map();
  const developerNameToId = new Map();

  const normalizeName = (value) => String(value || "").trim().toLowerCase();

  const getTaskAssigneeName = (task) =>
    task?.assignedToName ||
    task?.assigneeName ||
    task?.assigned_to_name ||
    task?.assignedDeveloperName ||
    task?.developerName ||
    task?.assignedUserName ||
    task?.userName ||
    task?.assignedTo?.name ||
    task?.assignee?.name ||
    task?.assignedUser?.name ||
    task?.developer?.name ||
    task?.user?.name ||
    task?.assignedTo?.fullName ||
    task?.assignee?.fullName ||
    task?.assignedUser?.fullName ||
    task?.developer?.fullName ||
    task?.user?.fullName ||
    "";

  const getNestedAssigneeId = (value) => {
    if (!value || typeof value !== "object") {
      return undefined;
    }
    return (
      value.id ??
      value.userId ??
      value.developerId ??
      value.assignedToId ??
      value.assigned_to_id ??
      value.assigneeId ??
      value.assignee_id ??
      undefined
    );
  };

  const findAssigneeField = (task) => {
    if (!task || typeof task !== "object") {
      return undefined;
    }

    const assigneeIdKey = Object.keys(task).find((key) =>
      /(?:assigned|assignee|developer|user).*(?:id|_id)$/i.test(key)
    );
    if (assigneeIdKey) {
      return task[assigneeIdKey];
    }

    return undefined;
  };

  const getTaskAssigneeId = (task) => {
    const candidate =
      task?.assignedToId ??
      task?.assigneeId ??
      task?.assigned_to_id ??
      task?.assignedDeveloperId ??
      task?.developerId ??
      task?.assignedUserId ??
      task?.userId ??
      getNestedAssigneeId(task?.assignedTo) ??
      getNestedAssigneeId(task?.assignee) ??
      getNestedAssigneeId(task?.assignedUser) ??
      getNestedAssigneeId(task?.assigned) ??
      getNestedAssigneeId(task?.developer) ??
      getNestedAssigneeId(task?.user) ??
      findAssigneeField(task);

    return candidate == null || candidate === "" ? "" : String(candidate);
  };

  (Array.isArray(developers) ? developers : []).forEach((developer) => {
    const key = String(developer?.id ?? "");
    const devName = developer?.name || "Developer";
    const normalizedName = normalizeName(devName);

    if (normalizedName && key) {
      developerNameToId.set(normalizedName, key);
    }
    if (!key) return;

    byId.set(key, {
      developerId: developer.id,
      developerName: devName,
      assignedTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      totalStoryPoints: 0,
      completedStoryPoints: 0,
      totalPointValue: 0,
      completedPointValue: 0,
      averageProgress: 0,
    });
  });

  (Array.isArray(tasks) ? tasks : []).forEach((task) => {
    let key = getTaskAssigneeId(task);

    if (!key) {
      const assigneeName = normalizeName(getTaskAssigneeName(task));
      if (assigneeName && developerNameToId.has(assigneeName)) {
        key = developerNameToId.get(assigneeName);
      } else {
      }
    } else {
    }

    if (!key) return;

    if (!byId.has(key)) {
      const fallbackName = getTaskAssigneeName(task) || "Developer";
      byId.set(key, {
        developerId: key,
        developerName: fallbackName,
        assignedTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        totalStoryPoints: 0,
        completedStoryPoints: 0,
        totalPointValue: 0,
        completedPointValue: 0,
        averageProgress: 0,
      });
    }

    const summary = byId.get(key);
    // Keep story point math aligned with weighted point math when story-point fields are absent.
    const totalStoryPoints = numberOrZero(task?.totalStoryPoints ?? task?.totalPointValue ?? task?.estimatedPoints);
    const completedStoryPoints = numberOrZero(
      task?.completedStoryPoints ?? task?.completedPointValue ?? (taskIsCompleted(task) ? totalStoryPoints : 0)
    );
    const totalPointValue = numberOrZero(
      task?.totalPointValue ?? task?.estimatedPoints ?? totalStoryPoints
    );
    const completedPointValue = numberOrZero(
      task?.completedPointValue ?? completedStoryPoints ?? (taskIsCompleted(task) ? totalPointValue : 0)
    );

    summary.assignedTasks += 1;
    summary.completedTasks += taskIsCompleted(task) ? 1 : 0;
    summary.inProgressTasks += taskIsCompleted(task) ? 0 : 1;
    summary.totalStoryPoints += totalStoryPoints;
    summary.completedStoryPoints += completedStoryPoints;
    summary.totalPointValue += totalPointValue;
    summary.completedPointValue += completedPointValue;
  });

  const results = Array.from(byId.values()).map((summary) => {
    const averageProgress =
      summary.totalPointValue > 0
        ? Math.round((summary.completedPointValue * 100) / summary.totalPointValue)
        : summary.assignedTasks > 0
          ? Math.round((summary.completedTasks * 100) / summary.assignedTasks)
          : 0;

    return {
      ...summary,
      averageProgress,
    };
  });
  return results;
}

export default function ManagerDeveloperProgress({
  hideSummary = false,
  hideHeader = false,
  developersData,
  tasksData,
  projectsData,
  loadingOverride,
  errorOverride,
  onRetry,
  onTotalsChange,
}) {
  // Always call hooks in the same order, regardless of branch
  const developersQuery = useManagerDevelopers();
  const tasksQuery = useManagerTasks();

  // Determine if external data is provided
  const hasExternalData = Array.isArray(developersData) && Array.isArray(tasksData);

  // Resolve effective data sources
  const developers = hasExternalData ? developersData : (Array.isArray(developersQuery?.data) ? developersQuery.data : []);
  const tasks = hasExternalData ? tasksData : (Array.isArray(tasksQuery?.data) ? tasksQuery.data : []);

  // Resolve effective loading and error states
  const loading = hasExternalData ? Boolean(loadingOverride) : (developersQuery?.isLoading || tasksQuery?.isLoading);
  const rawError = hasExternalData ? (errorOverride || null) : (developersQuery?.error || tasksQuery?.error || null);

  // Build rows from provided/fetched data
  const rows = useMemo(() => {
    return buildSummariesFromTasks(developers, tasks);
  }, [developers, tasks]);

  // Filter visible rows (those with assignedTasks > 0)
  const visibleRows = useMemo(() => {
    return (Array.isArray(rows) ? rows : []).filter((row) => Number(row.assignedTasks ?? 0) > 0);
  }, [rows]);

  // Calculate totals from visible rows only
  const totals = useMemo(() => {
    const assignedTasks = visibleRows.reduce((sum, row) => sum + Number(row.assignedTasks || 0), 0);
    const completedPoints = visibleRows.reduce((sum, row) => sum + Number(row.completedStoryPoints || 0), 0);
    const totalPoints = visibleRows.reduce((sum, row) => sum + Number(row.totalStoryPoints || 0), 0);
    const completedPointValue = visibleRows.reduce((sum, row) => sum + Number(row.completedPointValue || 0), 0);
    const totalPointValue = visibleRows.reduce((sum, row) => sum + Number(row.totalPointValue || 0), 0);

    return { assignedTasks, completedPoints, totalPoints, completedPointValue, totalPointValue };
  }, [visibleRows]);

  // Count delayed tasks from tasks array
  const delayedTaskCount = useMemo(() => {
    return (Array.isArray(tasks) ? tasks.filter(isDelayedTask).length : 0);
  }, [tasks]);

  // Determine error state - only show error if no usable data
  const hasUsableData = visibleRows.length > 0;
  const effectiveError = hasUsableData ? null : rawError;
  const effectiveForbidden = effectiveError?.response?.status === 403;
  const effectiveErrorText = effectiveError
    ? effectiveForbidden
      ? "You don't have permission to view developer progress. Switch to a Manager account or ask an admin to grant Manager access."
      : getErrorMessage(effectiveError, effectiveError?.message || "Failed to load developer progress")
    : "";

  // Track and emit totals changes
  const lastEmittedTotalsRef = useRef(null);

  useEffect(() => {
    if (typeof onTotalsChange !== "function") return;

    const nextTotals = {
      assignedTasks: totals.assignedTasks,
      completedStoryPoints: totals.completedPoints,
      totalStoryPoints: totals.totalPoints,
      completedPointValue: totals.completedPointValue,
      totalPointValue: totals.totalPointValue,
      delayedTasks: delayedTaskCount,
    };

    const prevTotals = lastEmittedTotalsRef.current;
    const isSameAsPrevious =
      prevTotals &&
      prevTotals.assignedTasks === nextTotals.assignedTasks &&
      prevTotals.completedStoryPoints === nextTotals.completedStoryPoints &&
      prevTotals.totalStoryPoints === nextTotals.totalStoryPoints &&
      prevTotals.completedPointValue === nextTotals.completedPointValue &&
      prevTotals.totalPointValue === nextTotals.totalPointValue &&
      prevTotals.delayedTasks === nextTotals.delayedTasks;

    if (isSameAsPrevious) return;

    lastEmittedTotalsRef.current = nextTotals;
    onTotalsChange(nextTotals);
  }, [onTotalsChange, totals, delayedTaskCount]);

  // Render component
  return (
    <Paper
      sx={{
        mt: 4,
        p: 2.5,
        borderRadius: 3,
        bgcolor: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.11)",
        overflow: "hidden",
      }}
    >
      {!hideHeader || !hideSummary ? (
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={1.2}
          sx={{ mb: 1.8 }}
        >
          {!hideHeader ? (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 850 }}>
                Developer Work Progress
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
                Team-level story point completion and workload summary.
              </Typography>
            </Box>
          ) : <Box />}

          {!hideSummary ? (
            <Stack direction="row" spacing={1}>
              <Chip size="small" label={`Assigned Tasks: ${totals.assignedTasks}`} />
              <Chip size="small" label={`Story Points: ${totals.completedPoints} / ${totals.totalPoints}`} />
              <Chip size="small" label={`Weighted Points: ${totals.completedPointValue} / ${totals.totalPointValue}`} />
              <Chip size="small" color={delayedTaskCount > 0 ? "warning" : "default"} label={`Delayed Tasks: ${delayedTaskCount}`} />
            </Stack>
          ) : null}
        </Stack>
      ) : null}

      {loading ? <Typography variant="body2" sx={{ color: "#94a3b8" }}>Loading developer progress...</Typography> : null}
      {effectiveErrorText ? (
        <Box sx={{ mb: 1.2 }}>
          <ErrorNotice message={effectiveErrorText} severity={effectiveForbidden ? "info" : "warning"} sx={{ mb: 1 }} dedupeKey="manager-developer-progress-error" />
          {!effectiveForbidden ? (
            <Button size="small" variant="outlined" onClick={() => {
              if (typeof onRetry === "function") {
                onRetry();
              } else {
                developersQuery.refetch?.();
                tasksQuery.refetch?.();
              }
            }}>
              Retry
            </Button>
          ) : null}
        </Box>
      ) : null}
      {!loading ? <DeveloperProgressTable rows={visibleRows} /> : null}
    </Paper>
  );
}




