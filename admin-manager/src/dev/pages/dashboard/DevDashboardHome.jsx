import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import DevLayout from "../../components/layout/DevLayout";
import TicketWidget from "../../components/tickets/TicketWidget";
import Card from "../../../components/ui/Card.jsx";
import { loadTasks } from "../../data/taskStore";
import { loadProfileFromBackendSafe } from "../../data/profileStore";
import { syncAssignedTasksToLocalStoreSafe } from "../../data/taskApi";
import { loadDeveloperTicketsFromBackendSafe } from "../../data/ticketApi";

function isCompletedTask(task) {
  const status = String(task?.status || "").toLowerCase();
  return status === "completed" || status === "done";
}

function buildProjectSnapshot(tasks) {
  const firstTask = tasks[0] || {};
  const projectId = Number(firstTask.projectId);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => isCompletedTask(task)).length;
  const inProgressTasks = tasks.filter((task) => !isCompletedTask(task) && String(task?.status || "").toLowerCase() !== "").length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    id: Number.isFinite(projectId) ? projectId : null,
    name: firstTask.projectName || "Developer Project",
    code: Number.isFinite(projectId) ? `#${projectId}` : "Backend sync pending",
    dueDate: firstTask.dueDate || "-",
    progress,
    totalTasks,
    completedTasks,
    inProgressTasks,
  };
}

export default function DevDashboardHome() {
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState(() => loadTasks());
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [syncedTasks, syncedProfile, syncedTickets] = await Promise.all([
          syncAssignedTasksToLocalStoreSafe(),
          loadProfileFromBackendSafe(),
          loadDeveloperTicketsFromBackendSafe(),
        ]);

        if (!active) {
          return;
        }

        setTasks(Array.isArray(syncedTasks) ? syncedTasks : loadTasks());
        setProfile(syncedProfile);
        setTickets(Array.isArray(syncedTickets) ? syncedTickets : []);
      } catch (err) {
        if (!active) {
          return;
        }

        setError(err?.message || "Failed to load developer dashboard data.");
        setTasks(loadTasks());
        setProfile(null);
        setTickets([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();
    const interval = setInterval(loadDashboard, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const project = useMemo(() => buildProjectSnapshot(tasks), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((task) => isCompletedTask(task)), [tasks]);
  const completionRate = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((completedTasks.length / tasks.length) * 100);
  }, [completedTasks.length, tasks.length]);
  const chatProjectId = project.id ? String(project.id) : "";

  return (
    <DevLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5, letterSpacing: -0.4 }}>
            Developer Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.66)", mt: 0.5 }}>
            Live overview of your backend-assigned work, profile sync, and chat blockers.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip
            label={profile?.name ? `Signed in as ${profile.name}` : "Developer workspace"}
            size="small"
            sx={{
              bgcolor: "rgba(124,92,255,0.16)",
              color: "#e7e9ee",
              border: "1px solid rgba(124,92,255,0.25)",
              fontWeight: 900,
              letterSpacing: 0.3,
            }}
          />
          <Chip
            label={`${project.progress}% synced`}
            size="small"
            sx={{
              bgcolor: "rgba(16,185,129,0.16)",
              color: "#e7e9ee",
              border: "1px solid rgba(16,185,129,0.25)",
              fontWeight: 900,
              letterSpacing: 0.3,
            }}
          />
        </Stack>
      </Box>

      {error ? <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert> : null}

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 240 }}>
          <CircularProgress sx={{ color: "#6b51ff" }} />
        </Box>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(3, 1fr)" }, gap: 3 }}>
          <Box sx={{ gridColumn: { lg: "span 1" } }}>
            <Card sx={{ p: 2.5, height: "100%" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                    Current Project
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, mt: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: -0.3 }}>
                    {project.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)", mt: 0.5 }}>
                    ID: <strong>{project.code}</strong> • Due: <strong>{project.dueDate}</strong>
                  </Typography>
                </Box>

                <Box sx={{ textAlign: "right", minWidth: "100px" }}>
                  <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                    Progress
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5, letterSpacing: -0.3 }}>
                    {project.progress}%
                  </Typography>
                </Box>
              </Box>

              <LinearProgress
                variant="determinate"
                value={project.progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.1)",
                  "& .MuiLinearProgress-bar": {
                    background: "linear-gradient(135deg, rgba(139,92,246,0.95), rgba(99,102,241,0.9))",
                  },
                }}
              />

              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)", mt: 1, display: "block" }}>
                {project.totalTasks} assigned tasks • {project.completedTasks} completed • {project.inProgressTasks} in progress
              </Typography>

              <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button component={Link} to="/dev/tasks" variant="contained" sx={{ borderRadius: 999, fontWeight: 800 }}>
                  Open tasks
                </Button>
                <Button
                  component={Link}
                  to={chatProjectId ? `/dev/chat/${chatProjectId}` : "/dev/chat"}
                  variant="outlined"
                  sx={{ borderRadius: 999, fontWeight: 800, color: "#e7e9ee", borderColor: "rgba(255,255,255,0.16)" }}
                >
                  Open chat
                </Button>
              </Box>
            </Card>
          </Box>

          <Box sx={{ gridColumn: { lg: "span 2" }, display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
              <Card sx={{ p: 2.25 }}>
                <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>Assigned tasks</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>{tasks.length}</Typography>
              </Card>
              <Card sx={{ p: 2.25 }}>
                <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>Completed tasks</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>{completedTasks.length}</Typography>
              </Card>
              <Card sx={{ p: 2.25 }}>
                <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>Completion rate</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>{completionRate}%</Typography>
              </Card>
            </Box>

            <TicketWidget
              title="Live Backend Tickets"
              hint="Pulled from the shared backend for your account"
              tickets={tickets}
            />

            {tickets.length > 0 ? (
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                Tip: these are the backend-visible tickets for the current developer session.
              </Typography>
            ) : null}
          </Box>
        </Box>
      )}
    </DevLayout>
  );
}
