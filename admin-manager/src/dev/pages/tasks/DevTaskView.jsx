import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, Box, Chip, CircularProgress, Grid, Typography } from "@mui/material";
import DevLayout from "../../components/layout/DevLayout";
import Card from "../../../components/ui/Card.jsx";
import { loadTasks } from "../../data/taskStore";
import { fetchAssignedTaskByIdFromBackend, syncAssignedTasksToLocalStoreSafe } from "../../data/taskApi";

function getTaskStatus(task) {
  return String(task?.status || "Assigned");
}

function getProgress(task) {
  const subtasks = Array.isArray(task?.subtasks) ? task.subtasks : [];
  const total = subtasks.reduce((sum, subtask) => sum + Number(subtask.points || 0), 0);
  const done = subtasks.filter((subtask) => subtask.done).reduce((sum, subtask) => sum + Number(subtask.points || 0), 0);
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function statusChipColor(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "completed" || normalized === "done") return "success";
  if (normalized === "in progress") return "warning";
  return "default";
}

export default function DevTaskView() {
  const { id } = useParams();
  const [task, setTask] = useState(() => loadTasks().find((item) => String(item.id) === String(id)) || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadTask = async () => {
      try {
        setLoading(true);
        setError("");

        const backendTask = await fetchAssignedTaskByIdFromBackend(id);
        if (!active) return;
        setTask(backendTask);
      } catch {
        try {
          await syncAssignedTasksToLocalStoreSafe();
          const found = loadTasks().find((item) => String(item.id) === String(id)) || null;
          if (!active) return;
          setTask(found);
        } catch (err) {
          if (!active) return;
          setError(err?.message || "Failed to load task details.");
          setTask(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTask();
    return () => {
      active = false;
    };
  }, [id]);

  const progress = useMemo(() => getProgress(task), [task]);

  if (loading) {
    return (
      <DevLayout>
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 320 }}>
          <CircularProgress sx={{ color: "#6b51ff" }} />
        </Box>
      </DevLayout>
    );
  }

  if (!task) {
    return (
      <DevLayout>
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
      </DevLayout>
    );
  }

  return (
    <DevLayout>
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
          <Chip label={getTaskStatus(task)} color={statusChipColor(task.status)} />
          <Chip label={task.priority || "Medium"} variant="outlined" />
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
    </DevLayout>
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