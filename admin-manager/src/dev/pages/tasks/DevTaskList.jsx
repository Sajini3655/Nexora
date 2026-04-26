import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Chip, CircularProgress, Grid, InputAdornment, TextField, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DevLayout from "../../components/layout/DevLayout";
import Card from "../../../components/ui/Card.jsx";
import { loadTasks } from "../../data/taskStore";
import { syncAssignedTasksToLocalStoreSafe } from "../../data/taskApi";
import useLiveRefresh from "../../../hooks/useLiveRefresh";

function getProgress(task) {
  const subtasks = Array.isArray(task?.subtasks) ? task.subtasks : [];
  const total = subtasks.reduce((sum, subtask) => sum + Number(subtask.points || 0), 0);
  const done = subtasks.filter((subtask) => subtask.done).reduce((sum, subtask) => sum + Number(subtask.points || 0), 0);
  return total === 0 ? 0 : Math.round((done / total) * 100);
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

  const liveTopics = useMemo(() => ["/topic/tasks"], []);
  useLiveRefresh(liveTopics, loadData, { debounceMs: 400 });

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const text = `${task.id} ${task.title} ${task.description} ${task.projectName || ""}`.toLowerCase();
      return q === "" ? true : text.includes(q);
    });
  }, [tasks, search]);

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => String(task.status).toLowerCase() === "completed" || String(task.status).toLowerCase() === "done").length;
    const active = tasks.filter((task) => String(task.status).toLowerCase() === "assigned" || String(task.status).toLowerCase() === "in progress").length;
    return { total: tasks.length, completed, active };
  }, [tasks]);

  return (
    <DevLayout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.4 }}>Tasks</Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.66)", mt: 0.5 }}>
          Live tasks assigned to your account from the backend.
        </Typography>
      </Box>

      {error ? <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert> : null}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}><Card sx={{ p: 2.5 }}><Typography variant="caption" sx={{ opacity: 0.7 }}>Total</Typography><Typography variant="h4" sx={{ fontWeight: 900 }}>{stats.total}</Typography></Card></Grid>
        <Grid item xs={12} md={4}><Card sx={{ p: 2.5 }}><Typography variant="caption" sx={{ opacity: 0.7 }}>Active</Typography><Typography variant="h4" sx={{ fontWeight: 900 }}>{stats.active}</Typography></Card></Grid>
        <Grid item xs={12} md={4}><Card sx={{ p: 2.5 }}><Typography variant="caption" sx={{ opacity: 0.7 }}>Completed</Typography><Typography variant="h4" sx={{ fontWeight: 900 }}>{stats.completed}</Typography></Card></Grid>
      </Grid>

      <TextField
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search tasks, project name, or id..."
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><SearchIcon /></InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 240 }}><CircularProgress sx={{ color: "#6b51ff" }} /></Box>
      ) : (
        <Box sx={{ display: "grid", gap: 1.5 }}>
          {filteredTasks.map((task) => (
            <Card key={task.id} sx={{ p: 2.5, cursor: "pointer", transition: "transform 180ms ease", "&:hover": { transform: "translateY(-2px)" } }} onClick={() => navigate(`/dev/tasks/${task.id}`)}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, letterSpacing: -0.3 }} noWrap>
                    {task.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)", mt: 0.5 }}>
                    {task.id} • {task.projectName || "Backend Project"}
                  </Typography>
                  <Box sx={{ mt: 1.25, display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Chip size="small" label={task.status || "Assigned"} />
                    <Chip size="small" label={task.priority || "Medium"} variant="outlined" />
                  </Box>
                </Box>

                <Chip label={`${getProgress(task)}%`} color={String(task.status).toLowerCase() === "completed" || String(task.status).toLowerCase() === "done" ? "success" : "default"} />
              </Box>
            </Card>
          ))}

          {filteredTasks.length === 0 ? (
            <Card sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body1">No backend tasks found.</Typography>
            </Card>
          ) : null}
        </Box>
      )}
    </DevLayout>
  );
}