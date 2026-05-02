import React, { useMemo } from "react";
import { Alert, Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { useManagerDevelopers, useManagerTasks } from "../../data/useManager";
import DeveloperProgressTable from "./DeveloperProgressTable";

function isDelayedTask(task) {
  const due = task?.dueDate;
  if (!due) return false;

  const dueDate = new Date(due);
  if (Number.isNaN(dueDate.getTime())) return false;

  const status = String(task?.status || "").toUpperCase();
  const completed = status === "DONE" || status === "COMPLETED";
  return !completed && dueDate < new Date();
}

function taskIsCompleted(task) {
  const status = String(task?.status || "").toUpperCase();
  return status === "DONE" || status === "COMPLETED";
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function buildSummariesFromTasks(developers, tasks) {
  const byId = new Map();

  (Array.isArray(developers) ? developers : []).forEach((developer) => {
    const key = String(developer?.id ?? "");
    if (!key) return;

    byId.set(key, {
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
    });
  });

  (Array.isArray(tasks) ? tasks : []).forEach((task) => {
    const key = String(task?.assignedToId ?? task?.assigneeId ?? task?.assigned_to_id ?? "");
    if (!key || !byId.has(key)) return;

    const summary = byId.get(key);
    const totalStoryPoints = numberOrZero(task?.totalStoryPoints);
    const completedStoryPoints = numberOrZero(task?.completedStoryPoints);
    const totalPointValue = numberOrZero(task?.totalPointValue ?? task?.estimatedPoints);
    const completedPointValue = numberOrZero(
      task?.completedPointValue ?? (taskIsCompleted(task) ? totalPointValue : 0)
    );

    summary.assignedTasks += 1;
    summary.completedTasks += taskIsCompleted(task) ? 1 : 0;
    summary.inProgressTasks += taskIsCompleted(task) ? 0 : 1;
    summary.totalStoryPoints += totalStoryPoints;
    summary.completedStoryPoints += completedStoryPoints;
    summary.totalPointValue += totalPointValue;
    summary.completedPointValue += completedPointValue;
  });

  return Array.from(byId.values()).map((summary) => {
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
}

export default function ManagerDeveloperProgress() {
  const developersQuery = useManagerDevelopers();
  const tasksQuery = useManagerTasks();

  const loading = developersQuery.isLoading || tasksQuery.isLoading;
  const error = developersQuery.error?.message || tasksQuery.error?.message || "";

  const developers = Array.isArray(developersQuery.data) ? developersQuery.data : [];
  const tasks = Array.isArray(tasksQuery.data) ? tasksQuery.data : [];

  const rows = useMemo(() => {
    return buildSummariesFromTasks(developers, tasks);
  }, [developers, tasks]);

  const delayedTaskCount = useMemo(() => {
    return tasks.filter(isDelayedTask).length;
  }, [tasks]);

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
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={1.2}
        sx={{ mb: 1.8 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 850 }}>
            Developer Work Progress
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
            Team-level story point completion and workload summary.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Chip size="small" label={`Assigned Tasks: ${totals.assignedTasks}`} />
          <Chip size="small" label={`Story Points: ${totals.completedPoints} / ${totals.totalPoints}`} />
          <Chip size="small" label={`Weighted Points: ${totals.completedPointValue} / ${totals.totalPointValue}`} />
          <Chip size="small" color={delayedTaskCount > 0 ? "warning" : "default"} label={`Delayed Tasks: ${delayedTaskCount}`} />
        </Stack>
      </Stack>

      {loading ? <Typography variant="body2" sx={{ color: "#94a3b8" }}>Loading developer progress...</Typography> : null}
      {error ? <Alert severity="warning" sx={{ mb: 1.2 }}>{error}</Alert> : null}
      {!loading ? <DeveloperProgressTable rows={rows} /> : null}
    </Paper>
  );
}

