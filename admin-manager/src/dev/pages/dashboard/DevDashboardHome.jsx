import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Box, Chip, CircularProgress, LinearProgress, Stack, Typography } from "@mui/material";
import DevLayout from "../../components/layout/DevLayout";
import Card from "../../../components/ui/Card.jsx";
import {
  deriveSingleProject,
  fetchDeveloperProfile,
  fetchDeveloperTasks,
  fetchDeveloperTickets,
  isCompletedTask,
} from "../../services/developerApi";

export default function DevDashboardHome() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [profileData, taskData, ticketData] = await Promise.all([
          fetchDeveloperProfile(),
          fetchDeveloperTasks(),
          fetchDeveloperTickets(),
        ]);

        if (!active) return;

        setProfile(profileData);
        setTasks(Array.isArray(taskData) ? taskData : []);
        setTickets(Array.isArray(ticketData) ? ticketData : []);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load developer dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const project = useMemo(() => deriveSingleProject(tasks), [tasks]);
  const openTasks = useMemo(() => tasks.filter((task) => !isCompletedTask(task)), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((task) => isCompletedTask(task)), [tasks]);
  const recentTasks = useMemo(() => tasks.slice(0, 4), [tasks]);
  const visibleTickets = useMemo(() => tickets.slice(0, 3), [tickets]);
  const hasAnyData = Boolean(project || tasks.length || tickets.length);

  if (loading) {
    return (
      <DevLayout>
        <Box sx={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress color="primary" />
            <Typography color="text.secondary">Loading developer dashboard...</Typography>
          </Stack>
        </Box>
      </DevLayout>
    );
  }

  if (error) {
    return (
      <DevLayout>
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      </DevLayout>
    );
  }

  return (
    <DevLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5, letterSpacing: -0.4 }}>
            Developer Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.66)", mt: 0.5 }}>
            Backend-backed view of your current project, tasks, tickets, and chat.
          </Typography>
        </Box>

        <Chip
          label={profile?.name || profile?.email || "Developer"}
          size="small"
          sx={{
            bgcolor: "rgba(124,92,255,0.16)",
            color: "#e7e9ee",
            border: "1px solid rgba(124,92,255,0.25)",
            fontWeight: 900,
            letterSpacing: 0.3,
          }}
        />
      </Box>

      {!hasAnyData ? (
        <Card sx={{ p: 3, maxWidth: 760 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 1, letterSpacing: -0.3 }}>
            Workspace not assigned yet
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)", mb: 2 }}>
            Your dashboard is connected, but there is no assigned project/task data for this account yet.
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip size="small" label="Ask for an assignment" sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "#e7e9ee" }} />
            <Chip size="small" label="Refresh after backend sync" sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "#e7e9ee" }} />
          </Box>
        </Card>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(12, 1fr)" },
          gap: 3,
          mt: hasAnyData ? 0 : 3,
        }}
      >
        <Card
          sx={{
            p: 2.5,
            gridColumn: { xs: "auto", lg: "span 4" },
            cursor: project ? "pointer" : "default",
            transition: "transform 180ms ease, border-color 180ms ease, background 180ms ease",
            "&:hover": project ? { transform: "translateY(-2px)", borderColor: "rgba(124,92,255,0.28)" } : {},
          }}
          onClick={() => project && navigate(`/dev/project/${project.id}`)}
        >
          <Typography variant="overline" sx={{ color: "rgba(231,233,238,0.56)", letterSpacing: "0.12em" }}>
            Current project
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 900, mt: 0.5, letterSpacing: -0.3 }} noWrap>
            {project?.name || "No project assigned"}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)", mt: 0.75 }}>
            {project ? `Project ID ${project.id}` : "Your assigned project will appear here once tasks are loaded."}
          </Typography>

          <LinearProgress
            variant="determinate"
            value={project?.progress || 0}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.1)",
              mt: 2,
              "& .MuiLinearProgress-bar": {
                background: "linear-gradient(135deg, rgba(139,92,246,0.95), rgba(99,102,241,0.9))",
              },
            }}
          />

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1.2, mt: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 3, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                Tasks
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {tasks.length}
              </Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: 3, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                Open
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {openTasks.length}
              </Typography>
            </Box>
            <Box sx={{ p: 1.5, borderRadius: 3, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.56)" }}>
                Done
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {completedTasks.length}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              component={Link}
              to={project ? `/dev/project/${project.id}` : "/dev"}
              clickable
              label="Open workspace"
              sx={{ bgcolor: "rgba(124,92,255,0.16)", color: "#e7e9ee", border: "1px solid rgba(124,92,255,0.25)" }}
            />
            <Chip
              component={Link}
              to={project ? `/dev/chat/${project.id}` : "/dev/chat"}
              clickable
              label="Open chat"
              sx={{ bgcolor: "rgba(124,92,255,0.16)", color: "#e7e9ee", border: "1px solid rgba(124,92,255,0.25)" }}
            />
          </Box>
        </Card>

        <Card sx={{ p: 2.5, gridColumn: { xs: "auto", lg: "span 5" } }}>
          <Typography variant="overline" sx={{ color: "rgba(231,233,238,0.56)", letterSpacing: "0.12em" }}>
            Recent tasks
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, letterSpacing: -0.3 }}>
            Backend work queue
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {recentTasks.map((task) => (
              <Box
                key={task.id}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800 }} noWrap>
                      {task.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.62)" }}>
                      {task.id} • {task.status} • Due {task.dueDate}
                    </Typography>
                  </Box>
                  <Chip size="small" label={task.priority} sx={{ bgcolor: "rgba(124,92,255,0.16)", color: "#e7e9ee" }} />
                </Box>
              </Box>
            ))}

            {recentTasks.length === 0 ? (
              <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)" }}>
                No backend tasks assigned yet.
              </Typography>
            ) : null}
          </Box>
        </Card>

        <Card sx={{ p: 2.5, gridColumn: { xs: "auto", lg: "span 3" } }}>
          <Typography variant="overline" sx={{ color: "rgba(231,233,238,0.56)", letterSpacing: "0.12em" }}>
            Tickets
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, letterSpacing: -0.3 }}>
            Visible items
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            {visibleTickets.map((ticket) => (
              <Box
                key={ticket.id}
                sx={{
                  p: 1.8,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Typography sx={{ fontWeight: 800 }} noWrap>
                  {ticket.title}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.62)" }}>
                  {ticket.id} • {ticket.status}
                </Typography>
              </Box>
            ))}

            {visibleTickets.length === 0 ? (
              <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)" }}>
                No backend tickets visible for your account.
              </Typography>
            ) : null}
          </Box>
        </Card>
      </Box>
    </DevLayout>
  );
}
