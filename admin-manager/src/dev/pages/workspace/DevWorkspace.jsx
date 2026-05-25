import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress, Grid, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/ui/Card.jsx";
import { loadTasks } from "../../data/taskStore";
import { syncAssignedTasksToLocalStoreSafe } from "../../data/taskApi";
import useLiveRefresh from "../../../hooks/useLiveRefresh";

export default function DevWorkspace() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState(() => loadTasks());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const synced = await syncAssignedTasksToLocalStoreSafe();
      setTasks(Array.isArray(synced) ? synced : loadTasks());
    } catch (err) {
      setError(err?.message || "Failed to load backend tasks.");
      setTasks(loadTasks());
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync backend tasks on mount, then refresh from live backend events.
  useEffect(() => {
    loadData();
  }, [loadData]);

  const liveTopics = useMemo(
    () => ["/topic/developer.workspace", "/topic/tasks"],
    []
  );

  useLiveRefresh(liveTopics, loadData, { debounceMs: 450 });

  const projectSnapshot = useMemo(() => {
    const firstTask = tasks[0] || {};
    const completed = tasks.filter((t) => String(t?.status || "").toLowerCase() === "completed" || String(t?.status || "").toLowerCase() === "done").length;
    const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    return {
      name: firstTask.projectName || "Developer Project",
      id: firstTask.projectId || "Backend",
      progress,
      myOpen: tasks.filter((t) => String(t?.status || "").toLowerCase() !== "completed" && String(t?.status || "").toLowerCase() !== "done").length,
    };
  }, [tasks]);

  const assignedTasks = useMemo(
    () => tasks.filter((t) => String(t?.status || "").toLowerCase() === "assigned"),
    [tasks]
  );

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 320 }}>
        <CircularProgress sx={{ color: "var(--nx-purple)" }} />
      </Box>
    );
  }

  return (
    <>
      {error ? <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert> : null}

      <Box
        sx={{
          mb: 3,
          p: { xs: 2.5, md: 3 },
          borderRadius: 4,
          border: "1px solid var(--nx-border)",
          background: "var(--nx-panel-2)",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, lg: { alignItems: "center", justifyContent: "space-between" }, gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: -0.5 }}>
              {projectSnapshot.name}
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--nx-muted)", mt: 0.75 }}>
              Backend ID: <strong>{projectSnapshot.id}</strong> • Progress: <strong>{projectSnapshot.progress}%</strong>
            </Typography>
          </Box>

          <Card sx={{ p: 2.5, background: "var(--nx-surface)", border: "1px solid var(--nx-border)" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center" }}>
              <Box>
                <Typography variant="caption" sx={{ color: "var(--nx-muted)" }}>Project Progress</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>{projectSnapshot.progress}%</Typography>
                <Typography variant="caption" sx={{ color: "var(--nx-muted)", display: "block", mt: 0.5 }}>
                  Open tasks: {projectSnapshot.myOpen}
                </Typography>
              </Box>
              <Box sx={{ width: 32, height: 32 }}>
                <CircularProgress variant="determinate" value={projectSnapshot.progress} sx={{ color: "var(--nx-purple)" }} />
              </Box>
            </Box>
          </Card>
        </Box>
      </Box>

      {/* Tasks Grid */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Assigned Tasks</Typography>
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {assignedTasks.map((task) => (
                <Card key={task.id} sx={{ p: 2, background: "var(--nx-surface)", cursor: "pointer", border: "1px solid var(--nx-border)" }} onClick={() => navigate(`/dev/tasks/${task.id}`)}>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{task.title}</Typography>
                  <Typography variant="caption" sx={{ color: "var(--nx-muted)", display: "block", mt: 0.5 }}>
                    {task.id} • {task.projectName} • {task.priority} priority
                  </Typography>
                </Card>
              ))}
              {assignedTasks.length === 0 ? (
                <Typography variant="body2" sx={{ color: "var(--nx-muted)", textAlign: "center", py: 2 }}>
                  No assigned tasks. Sync from dashboard.
                </Typography>
              ) : null}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Task Stats</Typography>
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <Box sx={{ p: 1.5, background: "var(--nx-surface)", borderRadius: 2, border: "1px solid var(--nx-border)" }}>
                <Typography variant="caption" sx={{ color: "var(--nx-muted)" }}>Total Tasks</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>{tasks.length}</Typography>
              </Box>
              <Box sx={{ p: 1.5, background: "var(--nx-surface)", borderRadius: 2, border: "1px solid var(--nx-border)" }}>
                <Typography variant="caption" sx={{ color: "var(--nx-muted)" }}>Assigned</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>{assignedTasks.length}</Typography>
              </Box>
              <Box sx={{ p: 1.5, background: "var(--nx-surface)", borderRadius: 2, border: "1px solid var(--nx-border)" }}>
                <Typography variant="caption" sx={{ color: "var(--nx-muted)" }}>Open</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>{projectSnapshot.myOpen}</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

