import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Card from "../../../components/ui/Card.jsx";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import { loadTasks } from "../../data/taskStore";
import { syncAssignedTasksToLocalStoreSafe } from "../../data/taskApi";

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function isDone(task) {
  const status = String(task?.status || "").toLowerCase();
  return status === "completed" || status === "done";
}

function getTaskProjectKey(task) {
  return String(task.projectId || task.projectName || "project-unknown");
}

function getTaskProjectName(task) {
  return task.projectName || `Project ${task.projectId || "Unknown"}`;
}

function buildProjects(tasks) {
  const groups = new Map();

  tasks.forEach((task) => {
    const key = getTaskProjectKey(task);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(task);
  });

  return [...groups.entries()].map(([key, list]) => {
    const taskCount = list.length;
    const completedTasks = list.filter(isDone).length;

    const totalPointValue = list.reduce((sum, task) => sum + numberOrZero(task.totalPointValue), 0);
    const completedPointValue = list.reduce((sum, task) => sum + numberOrZero(task.completedPointValue), 0);

    const progress =
      totalPointValue > 0
        ? Math.round((completedPointValue * 100) / totalPointValue)
        : taskCount > 0
          ? Math.round((completedTasks * 100) / taskCount)
          : 0;

    return {
      id: String(list[0]?.projectId || key),
      name: getTaskProjectName(list[0]),
      progress,
      taskCount,
      completedTasks,
      totalPointValue,
      completedPointValue,
      status: progress === 100 ? "Completed" : progress > 0 ? "Active" : "Planning",
      description: "",
    };
  });
}

export default function DevProjectList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState(() => loadTasks());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const synced = await syncAssignedTasksToLocalStoreSafe();
        if (!active) return;
        setTasks(Array.isArray(synced) ? synced : loadTasks());
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load projects.");
        setTasks(loadTasks());
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const projects = useMemo(() => buildProjects(tasks), [tasks]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((project) =>
      `${project.name} ${project.id}`.toLowerCase().includes(q)
    );
  }, [projects, search]);

  return (
    <>
      <Box
        sx={{
          mb: 3,
          p: { xs: 2.5, md: 3 },
          borderRadius: 4,
          border: "1px solid var(--nx-border)",
          background: "var(--nx-panel-2)",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: -0.5 }}>
          My Projects
        </Typography>
      </Box>

      {error ? <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert> : null}

      <TextField
        fullWidth
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search projects or ids..."
        sx={{
          mb: 3,
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            bgcolor: "var(--nx-input)",
          },
        }}
        InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, opacity: 0.7, color: "var(--nx-muted)" }} /> }}
      />

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 240 }}>
          <CircularProgress sx={{ color: "var(--nx-purple)" }} />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredProjects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card
                sx={{ p: 2.5, height: "100%", cursor: "pointer" }}
                onClick={() => navigate(`/dev/projects/${project.id}`)}
              >
                <StatusBadge label={project.status} sx={{ mb: 1.5 }} />

                <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -0.3 }}>
                  {project.name}
                </Typography>

                <Typography variant="body2" sx={{ mt: 1, color: "var(--nx-muted)" }}>
                  {project.description}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.7 }}>
                    <Typography variant="caption">Tasks: {project.taskCount}</Typography>
                    <Typography variant="caption">{project.progress}%</Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={project.progress}
                    sx={{
                      height: 7,
                      borderRadius: 999,
                      bgcolor: "var(--nx-input)",
                      "& .MuiLinearProgress-bar": { bgcolor: "var(--nx-purple)" },
                    }}
                  />

                  <Typography variant="caption" sx={{ display: "block", mt: 0.8, color: "var(--nx-muted)" }}>
                    Weighted Points: {project.completedPointValue} / {project.totalPointValue}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}

          {filteredProjects.length === 0 ? (
            <Grid item xs={12}>
              <Card sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body1">No assigned project work found.</Typography>
              </Card>
            </Grid>
          ) : null}
        </Grid>
      )}
    </>
  );
}




