import React, { useMemo } from "react";
import { Box, Chip, Paper, Stack, Typography, Button } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useManagerDevelopers, useManagerTasks } from "../../data/useManager";
import { fetchDeveloperProgressSummary, getErrorMessage } from "../../../services/managerService";
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
    task?.assignedTo?.name ||
    task?.assignee?.name ||
    task?.assignedUser?.name ||
    task?.assignedTo?.fullName ||
    task?.assignee?.fullName ||
    task?.assignedUser?.fullName ||
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
      getNestedAssigneeId(task?.assignedTo) ??
      getNestedAssigneeId(task?.assignee) ??
      getNestedAssigneeId(task?.assignedUser) ??
      getNestedAssigneeId(task?.assigned) ??
      getNestedAssigneeId(task?.developer) ??
      getNestedAssigneeId(task?.user) ??
      findAssigneeField(task);

    return candidate == null || candidate === "" ? "" : String(candidate);
  };

  console.log("🔍 buildSummariesFromTasks DEBUG:", { 
    developerCount: Array.isArray(developers) ? developers.length : 0,
    taskCount: Array.isArray(tasks) ? tasks.length : 0,
    firstTask: Array.isArray(tasks) ? tasks[0] : null,
    firstDev: Array.isArray(developers) ? developers[0] : null,
  });

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

    console.log(`  Task: ${task?.title || task?.name || "N/A"} | Raw assignee fields:`, {
      assignedToId: task?.assignedToId,
      assigneeId: task?.assigneeId,
      assigned_to_id: task?.assigned_to_id,
      assignedTo: task?.assignedTo,
      assignee: task?.assignee,
      assignedUser: task?.assignedUser,
      assignedToName: task?.assignedToName,
      assigneeName: task?.assigneeName,
      assigned_to_name: task?.assigned_to_name,
      candidateId: key,
      allKeys: Object.keys(task || {}).filter((k) => /assigned|assignee|developer|user/i.test(k)),
    });

    if (!key) {
      const assigneeName = normalizeName(getTaskAssigneeName(task));
      if (assigneeName && developerNameToId.has(assigneeName)) {
        key = developerNameToId.get(assigneeName);
        console.log(`  Found assignee by name: "${assigneeName}" -> key: "${key}"`);
      } else {
        console.log(`  No assignee found for task: ${task?.title || task?.name || "N/A"}`);
      }
    } else {
      console.log(`  Found assignee by ID: "${key}"`);
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

    console.log(`  Task: ${task?.title || "N/A"} | Assignee: ${summary.developerName} | Points: ${totalPointValue} | Completed: ${completedPointValue}`);

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

    console.log(`  FINAL: ${summary.developerName} | Assigned: ${summary.assignedTasks} | Total Points: ${summary.totalPointValue} | Completed: ${summary.completedPointValue} | Progress: ${averageProgress}%`);

    return {
      ...summary,
      averageProgress,
    };
  });

  console.log("📊 Final rows:", results);
  return results;
}

export default function ManagerDeveloperProgress({
  hideSummary = false,
  hideHeader = false,
  developersData,
  tasksData,
  loadingOverride,
  errorOverride,
  onRetry,
}) {
  // Only create queries if external data NOT provided - avoids query overhead
  const hasExternalData = Array.isArray(developersData) && Array.isArray(tasksData);
  const developersQuery = hasExternalData ? null : useManagerDevelopers();
  const tasksQuery = hasExternalData ? null : useManagerTasks();

  const loading = hasExternalData
    ? Boolean(loadingOverride)
    : (developersQuery?.isLoading || tasksQuery?.isLoading);
  const rawError = hasExternalData
    ? (errorOverride || null)
    : (developersQuery?.error || tasksQuery?.error || null);

  const developers = hasExternalData
    ? developersData
    : (Array.isArray(developersQuery?.data) ? developersQuery.data : []);
  const tasks = hasExternalData
    ? tasksData
    : (Array.isArray(tasksQuery?.data) ? tasksQuery.data : []);

  const developerIds = useMemo(
    () => (Array.isArray(developers) ? developers.map((developer) => String(developer?.id ?? "")).filter(Boolean) : []),
    [developers]
  );

  const backendProgressQuery = useQuery({
    queryKey: ["manager", "developerProgress", developerIds.join(",")],
    enabled: developerIds.length > 0,
    retry: false,
    queryFn: async () => {
      const requests = await Promise.allSettled(
        developers.map((developer) => fetchDeveloperProgressSummary(developer.id))
      );

      const rows = requests.map((result, index) => {
        const developer = developers[index] || {};

        if (result.status === "fulfilled" && result.value) {
          return result.value;
        }

        return {
          developerId: developer.id,
          developerName: developer.name || "Developer",
          assignedTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          totalStoryPoints: 0,
          completedStoryPoints: 0,
          totalPointValue: 0,
          completedPointValue: 0,
          averageProgress: 0,
        };
      });

      const allFailed = requests.length > 0 && requests.every((result) => result.status === "rejected");
      if (allFailed) {
        const firstError = requests.find((result) => result.status === "rejected");
        throw firstError?.reason || new Error("Failed to load developer progress");
      }

      return rows;
    },
  });

  const hasAnyData = (Array.isArray(developers) && developers.length > 0) || (Array.isArray(tasks) && tasks.length > 0);
  const effectiveLoading = (loading || backendProgressQuery.isLoading || backendProgressQuery.isFetching) && !hasAnyData;

  const rows = useMemo(() => {
    if (Array.isArray(backendProgressQuery.data) && backendProgressQuery.data.length > 0) {
      return backendProgressQuery.data;
    }
    return buildSummariesFromTasks(developers, tasks);
  }, [backendProgressQuery.data, developers, tasks]);

  const delayedTaskCount = useMemo(() => {
    return tasks.filter(isDelayedTask).length;
  }, [tasks]);

  const effectiveError = rawError || backendProgressQuery.error || null;
  const effectiveForbidden = effectiveError?.response?.status === 403;
  const effectiveErrorText = effectiveError
    ? effectiveForbidden
      ? "You don't have permission to view developer progress. Switch to a Manager account or ask an admin to grant Manager access."
      : getErrorMessage(effectiveError, effectiveError.message || "Failed to load developer progress")
    : "";

  const totals = useMemo(() => {
    const assignedTasks = rows.reduce((sum, row) => sum + Number(row.assignedTasks || 0), 0);
    const completedPoints = rows.reduce((sum, row) => sum + Number(row.completedStoryPoints || 0), 0);
    const totalPoints = rows.reduce((sum, row) => sum + Number(row.totalStoryPoints || 0), 0);
    const completedPointValue = rows.reduce((sum, row) => sum + Number(row.completedPointValue || 0), 0);
    const totalPointValue = rows.reduce((sum, row) => sum + Number(row.totalPointValue || 0), 0);

    return { assignedTasks, completedPoints, totalPoints, completedPointValue, totalPointValue };
  }, [rows]);

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

      {effectiveLoading ? <Typography variant="body2" sx={{ color: "#94a3b8" }}>Loading developer progress...</Typography> : null}
      {effectiveErrorText ? (
        <Box sx={{ mb: 1.2 }}>
          <ErrorNotice message={effectiveErrorText} severity={effectiveForbidden ? "info" : "warning"} sx={{ mb: 1 }} dedupeKey="manager-developer-progress-error" />
          {!effectiveForbidden ? (
            <Button size="small" variant="outlined" onClick={() => {
              if (typeof onRetry === "function") {
                onRetry();
              } else if (developersQuery && tasksQuery) {
                developersQuery.refetch();
                tasksQuery.refetch();
              }
              backendProgressQuery.refetch();
            }}>
              Retry
            </Button>
          ) : null}
        </Box>
      ) : null}
      {!effectiveLoading ? <DeveloperProgressTable rows={rows} /> : null}
    </Paper>
  );
}

