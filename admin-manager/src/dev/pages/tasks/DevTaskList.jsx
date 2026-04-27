import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  LinearProgress,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Card from "../../../components/ui/Card.jsx";
import { loadTasks } from "../../data/taskStore";
import { syncAssignedTasksToLocalStoreSafe } from "../../data/taskApi";
import useLiveRefresh from "../../../hooks/useLiveRefresh";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";

function isCompleted(task) {
  const status = String(task?.status || "").toLowerCase();
  return status === "completed" || status === "done";
}

function isActive(task) {
  return !isCompleted(task);
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getProgressData(task) {
  const totalPointValue = numberOrZero(task?.totalPointValue);
  const completedPointValue = numberOrZero(task?.completedPointValue);

  if (totalPointValue > 0) {
    return {
      totalPointValue,
      completedPointValue,
      progress: Math.round((completedPointValue * 100) / totalPointValue),
    };
  }

  return {
    totalPointValue: numberOrZero(task?.totalStoryPoints),
    completedPointValue: numberOrZero(task?.completedStoryPoints),
    progress: numberOrZero(task?.progressPercentage),
  };
}

export default function DevTaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState(() => loadTasks());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const synced = await syncAssignedTasksToLocalStoreSafe();
      setTasks(Array.isArray(synced) ? synced : loadTasks());
    } catch (err) {
      setError(err?.message || "Failed to load developer tasks.");
      setTasks(loadTasks());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useLiveRefresh(["/topic/tasks", "/topic/developer.dashboard"], loadData, {
    debounceMs: 400,
  });

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const text = `${task.id} ${task.title} ${task.description} ${task.projectName || ""}`.toLowerCase();
      return q === "" ? true : text.includes(q);
    });
  }, [tasks, search]);

  const stats = useMemo(() => {
    const completed = tasks.filter(isCompleted).length;
    const active = tasks.filter(isActive).length;

    const totalPoints = tasks.reduce((sum, task) => sum + numberOrZero(task.totalPointValue), 0);
    const completedPoints = tasks.reduce((sum, task) => sum + numberOrZero(task.completedPointValue), 0);
    const progress = totalPoints > 0 ? Math.round((completedPoints * 100) / totalPoints) : 0;

    return {
      total: tasks.length,
      completed,
      active,
      totalPoints,
      completedPoints,
      progress,
    };
  }, [tasks]);

  return (
    <>
      <Box
        sx={{
          mb: 3,
          p: { xs: 2.5, md: 3 },
          borderRadius: 4,
          border: "1px solid rgba(148,163,184,0.14)",
          background:
            "linear-gradient(135deg, rgba(124,92,255,0.18) 0%, rgba(11,22,40,0.94) 100%)",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: -0.5 }}>
          My Tasks
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)", mt: 0.75 }}>
          Tasks assigned to your developer account. Progress is calculated using weighted story points.
        </Typography>
      </Box>

      {error ? <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert> : null}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <StatCard label="Total Tasks" value={stats.total} />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard label="Active" value={stats.active} />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard label="Completed" value={stats.completed} />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard label="Weighted Progress" value={`${stats.progress}%`} hint={`${stats.completedPoints}/${stats.totalPoints} pts`} />
        </Grid>
      </Grid>

      <TextField
        fullWidth
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search tasks, project name, or id..."
        sx={{
          mb: 3,
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            bgcolor: "rgba(15,23,42,0.72)",
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 240 }}>
          <CircularProgress sx={{ color: "#6b51ff" }} />
        </Box>
      ) : (
        <Box sx={{ display: "grid", gap: 1.5 }}>
          {filteredTasks.map((task) => {
            const progressData = getProgressData(task);

            return (
              <Card
                key={task.id}
                sx={{ p: 2.5, cursor: "pointer" }}
                onClick={() => navigate(`/dev/tasks/${task.id}`)}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -0.3 }} noWrap>
                      {task.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)", mt: 0.5 }}>
                      Task ID: {task.id} • {task.projectName || "Backend Project"}
                    </Typography>

                    <Box sx={{ mt: 1.25, display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Chip size="small" label={task.status || "Todo"} />
                      <StatusBadge label={task.priority || "Medium"} />
                      <Chip size="small" label={`${progressData.completedPointValue}/${progressData.totalPointValue} pts`} variant="outlined" />
                    </Box>

                    <Box sx={{ mt: 1.4 }}>
                      <LinearProgress
                        variant="determinate"
                        value={progressData.progress}
                        sx={{
                          height: 7,
                          borderRadius: 999,
                          bgcolor: "rgba(255,255,255,0.08)",
                          "& .MuiLinearProgress-bar": { bgcolor: "#6d5dfc" },
                        }}
                      />
                    </Box>
                  </Box>

                  <Chip label={`${progressData.progress}%`} color={isCompleted(task) ? "success" : "default"} />
                </Box>
              </Card>
            );
          })}

          {filteredTasks.length === 0 ? (
            <Card sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body1">No assigned tasks found.</Typography>
            </Card>
          ) : null}
        </Box>
      )}
    </>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="caption" sx={{ opacity: 0.7 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          {hint}
        </Typography>
      ) : null}
    </Card>
  );
}





