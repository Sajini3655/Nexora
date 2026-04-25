import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import DevLayout from "../../components/layout/DevLayout";
import TicketWidget from "../../components/tickets/TicketWidget";
import { loadTasks } from "../../data/taskStore";
import { syncAssignedTasksToLocalStoreSafe } from "../../data/taskApi";
import { loadDeveloperTicketsFromBackendSafe } from "../../data/ticketApi";
import useLiveRefresh from "../../../hooks/useLiveRefresh";

function isCompletedTask(task) {
  const status = String(task?.status || "").toLowerCase();
  return status === "completed" || status === "done";
}

function isActiveTask(task) {
  const status = String(task?.status || "").toLowerCase();
  return status === "assigned" || status === "in progress";
}

function buildProjectSnapshot(tasks) {
  const firstTask = tasks[0] || {};
  const projectId = Number(firstTask.projectId);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => isCompletedTask(task)).length;
  const activeTasks = tasks.filter((task) => !isCompletedTask(task)).length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    id: Number.isFinite(projectId) ? projectId : null,
    name: firstTask.projectName || "Assigned Work",
    code: Number.isFinite(projectId) ? `#${projectId}` : "Not provided",
    dueDate: firstTask.dueDate || "-",
    progress,
    totalTasks,
    completedTasks,
    activeTasks,
  };
}

export default function DevDashboardHome() {
  const [tasks, setTasks] = useState(() => loadTasks());
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [syncedTasks, syncedTickets] = await Promise.all([
        syncAssignedTasksToLocalStoreSafe(),
        loadDeveloperTicketsFromBackendSafe(),
      ]);

      setTasks(Array.isArray(syncedTasks) ? syncedTasks : loadTasks());
      setTickets(Array.isArray(syncedTickets) ? syncedTickets : []);
    } catch (err) {
      setError(err?.message || "Failed to load developer dashboard data.");
      setTasks(loadTasks());
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const liveTopics = useMemo(
    () => ["/topic/developer.dashboard", "/topic/tasks", "/topic/tickets"],
    []
  );

  useLiveRefresh(liveTopics, loadDashboard, { debounceMs: 500 });

  const project = useMemo(() => buildProjectSnapshot(tasks), [tasks]);

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => isCompletedTask(task)).length;
    const active = tasks.filter((task) => isActiveTask(task)).length;
    const rate = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

    return [
      { title: "Assigned Tasks", value: tasks.length },
      { title: "Active Tasks", value: active },
      { title: "Completed", value: completed },
      { title: "Tickets", value: tickets.length },
      { title: "Completion", value: `${rate}%` },
    ];
  }, [tasks, tickets.length]);

  const recentTasks = tasks.slice(0, 5);

  return (
    <DevLayout>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
            Overview of your assigned tasks, tickets, and current work.
          </Typography>
        </Box>

        {error ? <Alert severity="warning">{error}</Alert> : null}

        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", minHeight: 260 }}>
            <CircularProgress sx={{ color: "#6d5dfc" }} />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(5, 1fr)",
                },
                gap: 2,
              }}
            >
              {stats.map((stat) => (
                <StatCard key={stat.title} title={stat.title} value={stat.value} />
              ))}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "0.8fr 1.2fr" },
                gap: 2,
              }}
            >
              <Panel title="Current Work">
                <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                  {project.name}
                </Typography>

                <Typography sx={{ color: "#94a3b8", fontSize: 13, mt: 0.5 }}>
                  ID: {project.code} • Due: {project.dueDate}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.8,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                      Progress
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#cbd5e1" }}>
                      {project.progress}%
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={project.progress}
                    sx={{
                      height: 7,
                      borderRadius: 999,
                      bgcolor: "rgba(255,255,255,0.08)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: "#6d5dfc",
                      },
                    }}
                  />
                </Box>

                <Typography variant="caption" sx={{ color: "#94a3b8", mt: 1.2, display: "block" }}>
                  {project.totalTasks} tasks • {project.completedTasks} completed • {project.activeTasks} active
                </Typography>
              </Panel>

              <Panel title="Recent Tasks">
                {recentTasks.length === 0 ? (
                  <EmptyText>No assigned tasks found.</EmptyText>
                ) : (
                  <Box sx={{ overflowX: "auto" }}>
                    <Box sx={{ minWidth: 650 }}>
                      <TableHeader />

                      {recentTasks.map((task) => (
                        <Box
                          key={task.id}
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "1.3fr 1fr 0.8fr 0.8fr",
                            gap: 1.5,
                            alignItems: "center",
                            py: 1.35,
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                            {task.title}
                          </Typography>

                          <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
                            {task.projectName || "Backend Project"}
                          </Typography>

                          <StatusChip status={task.status || "Assigned"} />

                          <Typography sx={{ color: "#cbd5e1", fontSize: 13 }}>
                            {task.priority || "Medium"}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Panel>
            </Box>

            <TicketWidget
              title="Tickets"
              hint="Backend-visible tickets for this developer session"
              tickets={tickets}
            />
          </>
        )}
      </Stack>
    </DevLayout>
  );
}

function StatCard({ title, value }) {
  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: "#0b1628",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "none",
      }}
    >
      <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.8, color: "#f8fafc" }}>
        {value}
      </Typography>
    </Paper>
  );
}

function Panel({ title, children }) {
  return (
    <Paper
      sx={{
        p: 2.2,
        borderRadius: 3,
        bgcolor: "#0b1628",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "none",
      }}
    >
      <Box sx={{ mb: 1.5 }}>
        <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
      </Box>

      {children}
    </Paper>
  );
}

function TableHeader() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1.3fr 1fr 0.8fr 0.8fr",
        gap: 1.5,
        pb: 1,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {["Task", "Project", "Status", "Priority"].map((heading) => (
        <Typography
          key={heading}
          variant="caption"
          sx={{ color: "#64748b", fontWeight: 900, textTransform: "uppercase" }}
        >
          {heading}
        </Typography>
      ))}
    </Box>
  );
}

function StatusChip({ status }) {
  const normalized = String(status || "").toLowerCase();

  const color =
    normalized === "completed" || normalized === "done"
      ? "rgba(34,197,94,0.15)"
      : normalized === "in progress"
        ? "rgba(245,158,11,0.15)"
        : "rgba(124,92,255,0.16)";

  return (
    <Chip
      size="small"
      label={status}
      sx={{
        bgcolor: color,
        color: "#e5e7eb",
        border: "1px solid rgba(255,255,255,0.08)",
        fontWeight: 700,
        width: "fit-content",
      }}
    />
  );
}

function EmptyText({ children }) {
  return (
    <Typography variant="body2" sx={{ color: "#94a3b8" }}>
      {children}
    </Typography>
  );
}
