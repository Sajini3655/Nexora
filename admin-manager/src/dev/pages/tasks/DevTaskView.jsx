import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, Box, Chip, CircularProgress, Grid, Typography } from "@mui/material";
import Card from "../../../components/ui/Card.jsx";
import ProgressBar from "../../components/tasks/ProgressBar";
import StoryPointChecklist from "../../components/tasks/StoryPointChecklist";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import { loadTasks } from "../../data/taskStore";
import {
  fetchTaskProgress,
  fetchTaskStoryPoints,
  markStoryPointDone,
  markStoryPointTodo,
  syncAssignedTasksToLocalStoreSafe,
} from "../../data/taskApi";
import { useAssignedTask, useTaskProgress, useTaskStoryPoints } from "../../data/useDevTasks";

function getTaskStatus(task) {
  return String(task?.status || "Assigned");
}

function statusChipColor(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed" || normalized === "done") return "success";
  if (normalized === "in progress") return "warning";
  return "default";
}

export default function DevTaskView() {
  const { id } = useParams();
  const [togglingStoryPointId, setTogglingStoryPointId] = useState(null);
  const [storyPointError, setStoryPointError] = useState("");

  // React Query hooks
  const { data: task, isLoading: taskLoading, error: taskError } = useAssignedTask(id, !!id);
  const { data: progressData, isLoading: progressLoading, error: progressError } = useTaskProgress(id, !!id);
  const { data: storyPoints = [], isLoading: storyPointsLoading, error: storyPointsError } = useTaskStoryPoints(id, !!id);

  const loading = taskLoading || progressLoading || storyPointsLoading;
  const error = taskError?.message || progressError?.message || storyPointsError?.message || "";

  const progress = useMemo(() => Number(progressData?.progressPercentage || 0), [progressData]);

  const handleToggleStoryPoint = async (storyPoint) => {
    if (!storyPoint?.id || !task?.id) return;

    setStoryPointError("");
    setTogglingStoryPointId(storyPoint.id);

    try {
      const done = String(storyPoint?.status || "").toUpperCase() === "DONE";
      if (done) {
        await markStoryPointTodo(storyPoint.id);
      } else {
        await markStoryPointDone(storyPoint.id);
      }

      await loadStoryPointData(task.id, task);
    } catch (err) {
      setStoryPointError(err?.message || "Failed to update story point.");
    } finally {
      setTogglingStoryPointId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 320 }}>
        <CircularProgress sx={{ color: "#6b51ff" }} />
      </Box>
    );
  }

  if (!task) {
    return (
      <>
        {error ? <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert> : null}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>Task not found</Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "rgba(231,233,238,0.72)" }}>
            The backend did not return task <strong>{id}</strong> for the current developer.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Chip component={Link} clickable to="/dev/tasks" label="Back to tasks" />
          </Box>
        </Card>
      </>
    );
  }

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap", mb: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" sx={{ color: "rgba(231,233,238,0.56)" }}>
            {task.projectName || "Backend Task"}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.4 }}>
            {task.title}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.75, color: "rgba(231,233,238,0.72)" }}>
            ID {task.id} • Due {task.dueDate || "-"} • Assignee {task.assignedToName || task.assignee || "You"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <StatusBadge label={getTaskStatus(task)} />
          <StatusBadge label={task.priority || "Medium"} />
          <Chip component={Link} clickable to="/dev/tasks" label="Back" />
        </Box>
      </Box>

      {error ? <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert> : null}

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
              Description
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.82)", whiteSpace: "pre-wrap" }}>
              {task.description || "No description provided by the backend."}
            </Typography>

            <Box sx={{ mt: 3, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
              <Metric label="Progress" value={`${progress}%`} />
              <Metric label="Created" value={task.createdAt || "-"} />
              <Metric label="Project" value={task.projectName || "-"} />
            </Box>

            <Box sx={{ mt: 2 }}>
              <ProgressBar value={progress} />
              <Typography variant="caption" sx={{ color: "#94a3b8", mt: 0.6, display: "block" }}>
                Completed Story Points: {progressData?.completedStoryPoints || 0} / {progressData?.totalStoryPoints || 0}
              </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>
                  Weighted Points: {progressData?.completedPointValue || 0} / {progressData?.totalPointValue || 0}
                </Typography>
            </Box>

            <Box sx={{ mt: 2.2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Story Points
              </Typography>
              <StoryPointChecklist
                storyPoints={storyPoints}
                loading={false}
                error={storyPointError}
                togglingId={togglingStoryPointId}
                onToggle={handleToggleStoryPoint}
              />
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
              Backend Task Info
            </Typography>
            <StackedInfo label="Assigned to" value={task.assignedToName || task.assignee || "You"} />
            <StackedInfo label="Assigned to id" value={task.assignedToId || "-"} />
            <StackedInfo label="Project id" value={task.projectId || "-"} />
            <StackedInfo label="Priority" value={task.priority || "Medium"} />
            <StackedInfo label="Status" value={getTaskStatus(task)} />
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

function Metric({ label, value }) {
  return (
    <Box sx={{ p: 2, borderRadius: 3, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>{label}</Typography>
      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 800 }}>{value}</Typography>
    </Box>
  );
}

function StackedInfo({ label, value }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>{label}</Typography>
      <Typography variant="body2" sx={{ mt: 0.25, fontWeight: 700 }}>{String(value)}</Typography>
    </Box>
  );
}



