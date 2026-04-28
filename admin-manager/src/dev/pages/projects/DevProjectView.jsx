import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Card from "../../../components/ui/Card.jsx";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import ChatBox from "../chat/src/ChatBox";
import { loadTasks } from "../../data/taskStore";
import { syncAssignedTasksToLocalStoreSafe } from "../../data/taskApi";

function buildProjects(tasks) {
  const groups = new Map();
  tasks.forEach((task) => {
    const key = String(task.projectId || task.projectName || "project-unknown");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(task);
  });
  return [...groups.entries()].map(([key, list]) => {
    const total = list.length;
    const done = list.filter((task) => String(task.status).toLowerCase() === "completed" || String(task.status).toLowerCase() === "done").length;
    const totalPointValue = list.reduce((sum, task) => sum + Number(task.totalPointValue || 0), 0);
    const completedPointValue = list.reduce((sum, task) => sum + Number(task.completedPointValue || 0), 0);
    const progress = totalPointValue > 0 ? Math.round((completedPointValue * 100) / totalPointValue) : 0;
    return {
      id: String(list[0]?.projectId || key),
      name: list[0]?.projectName || `Project ${key}`,
      description: list[0]?.projectDescription || list[0]?.description || "Read-only project collaboration view.",
      progress,
      taskCount: total,
      status: progress === 100 ? "Completed" : progress > 0 ? "Active" : "Planning",
      tasks: list,
    };
  });
}

export default function DevProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState(() => loadTasks());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setError(err?.message || "Failed to load project.");
        setTasks(loadTasks());
      } finally {
        if (active) setLoading(false);
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, [id]);

  const project = useMemo(() => buildProjects(tasks).find((item) => String(item.id) === String(id)) || null, [tasks, id]);
  const currentUserId = String(user?.id || user?.email || "");
  const currentUserName = user?.name || user?.email || "Developer";

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 320 }}>
        <CircularProgress sx={{ color: "#6b51ff" }} />
      </Box>
    );
  }

  if (!project) {
    return (
      <>
        {error ? <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert> : null}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>Project not found</Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "rgba(231,233,238,0.72)" }}>
            No assigned project matches <strong>{id}</strong>.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Chip component={Link} clickable to="/dev/projects" label="Back to projects" />
          </Box>
        </Card>
      </>
    );
  }

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", flexWrap: "wrap", mb: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="overline" sx={{ color: "rgba(231,233,238,0.56)" }}>Assigned Project</Typography>
          <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.4 }}>{project.name}</Typography>
          <Typography variant="body2" sx={{ mt: 0.75, color: "rgba(231,233,238,0.72)" }}>
            {project.taskCount} tasks • {project.progress}% complete
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip component={Link} clickable to="/dev/projects" label="Back" />
          <Chip label="Read only" variant="outlined" sx={{ color: "#cbd5e1", borderColor: "rgba(148,163,184,0.25)" }} />
        </Stack>
      </Box>

      {error ? <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert> : null}

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={7}>
          <Card sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>Project Details</Typography>
            <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.76)" }}>
              Read-only project view for developers. Use the project chat below to discuss work, blockers, and coordination.
            </Typography>

            <Paper sx={{ mt: 2.5, p: 2.2, borderRadius: 3, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Stack spacing={1.25}>
                <InfoRow label="Project name" value={project.name} />
                <InfoRow label="Project id" value={project.id} />
                <InfoRow label="Status" value={project.status} />
                <InfoRow label="Task count" value={project.taskCount} />
                <InfoRow label="Progress" value={`${project.progress}%`} />
              </Stack>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.7 }}>
                  <Typography variant="caption">Progress</Typography>
                  <Typography variant="caption">{project.progress}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={project.progress}
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    bgcolor: "rgba(255,255,255,0.08)",
                    "& .MuiLinearProgress-bar": { bgcolor: "#6d5dfc" },
                  }}
                />
              </Box>
            </Paper>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>Tasks with assigned developers</Typography>
              <Stack spacing={1.5}>
                {project.tasks.map((task) => (
                  <Paper
                    key={task.id}
                    sx={{
                      p: 1.25,
                      borderRadius: 3,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 900 }}>{task.title}</Typography>
                          <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.64)", mt: 0.4 }}>
                            {task.description ? task.description : "No description."}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center">
                          <StatusBadge label={String(task.status || "Todo")} />
                          <Chip size="small" label={task.priority || "Medium"} />
                        </Stack>
                      </Stack>

                      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>Assigned</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{task.assignedToName || task.assignee || "Unassigned"}</Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)", textAlign: "right" }}>Task</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, textAlign: "right" }}>{task.id}</Typography>
                        </Box>
                      </Stack>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ width: '65%' }}>
                          <LinearProgress
                            variant="determinate"
                            value={task.progressPercentage || 0}
                            sx={{
                              height: 7,
                              borderRadius: 999,
                              bgcolor: "rgba(255,255,255,0.06)",
                              "& .MuiLinearProgress-bar": { bgcolor: "#38bdf8" },
                            }}
                          />
                        </Box>

                        <Box>
                          <Chip
                            component={Link}
                            clickable
                            to={`/dev/tasks/${task.id}`}
                            label="Open"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>Project Chat</Typography>
            <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.76)", mb: 2 }}>
              Chat is attached to this project page so developers can discuss work without using the sidebar.
            </Typography>

            {authLoading ? (
              <Box sx={{ display: "grid", placeItems: "center", minHeight: 260 }}>
                <CircularProgress sx={{ color: "#6b51ff" }} />
              </Box>
            ) : currentUserId ? (
              <Box sx={{ borderRadius: 3, overflow: "hidden" }}>
                <ChatBox
                  projectId={String(project.id)}
                  projectName={project.name}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  hideSidebar
                  onSummary={() => {}}
                />
              </Box>
            ) : (
              <Alert severity="info">Sign in to use the project chat.</Alert>
            )}
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

function InfoRow({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>{label}</Typography>
      <Typography variant="body2" sx={{ mt: 0.25, fontWeight: 800, wordBreak: "break-word" }}>{String(value ?? "-")}</Typography>
    </Box>
  );
}




