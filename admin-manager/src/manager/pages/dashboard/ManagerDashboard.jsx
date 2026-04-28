import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { fetchManagerTasks, fetchProjects } from "../../../services/managerService";
import useLiveRefresh from "../../../hooks/useLiveRefresh";
import RecentEmailTickets from "../../components/RecentEmailTickets";
import ManagerDeveloperProgress from "../../components/progress/ManagerDeveloperProgress";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";

const MANAGER_DASHBOARD_CACHE_KEY = "manager.dashboard.cache.v1";

function readManagerDashboardCache() {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(MANAGER_DASHBOARD_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const projects = Array.isArray(parsed?.projects) ? parsed.projects : [];
    const tasks = Array.isArray(parsed?.tasks) ? parsed.tasks : [];

    return { projects, tasks };
  } catch {
    return null;
  }
}

function writeManagerDashboardCache(projects, tasks) {
  try {
    if (typeof window === "undefined") return;
    const payload = {
      projects: Array.isArray(projects) ? projects : [],
      tasks: Array.isArray(tasks) ? tasks : [],
      timestamp: Date.now(),
    };
    window.sessionStorage.setItem(MANAGER_DASHBOARD_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore cache write errors.
  }
}

function StatCard({ label, value, hint }) {
  return (
    <Paper
      sx={{
        p: 1.5,
        minHeight: 102,
        borderRadius: 2,
        border: "1px solid rgba(148,163,184,0.16)",
        background: "rgba(15,23,42,0.72)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      }}
    >
      <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </Typography>
      <Typography sx={{ mt: 0.6, fontSize: 24, lineHeight: 1.1, fontWeight: 900, color: "#f8fafc" }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ mt: 0.45, display: "block", color: "#64748b" }}>
        {hint}
      </Typography>
    </Paper>
  );
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const cachedDashboard = useMemo(() => readManagerDashboardCache(), []);

  const [projects, setProjects] = useState(cachedDashboard?.projects || []);
  const [tasks, setTasks] = useState(cachedDashboard?.tasks || []);
  const [loading, setLoading] = useState(!cachedDashboard);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const normalizeTaskStatus = (task) =>
    String(task?.status || task?.taskStatus || task?.state || "")
      .trim()
      .toLowerCase();

  const isCompletedTask = (task) => {
    const status = normalizeTaskStatus(task);
    return (
      status === "done" ||
      status === "completed" ||
      status === "complete" ||
      status === "closed" ||
      status === "resolved"
    );
  };

  const getTaskTitle = (task) => task?.title || task?.taskName || task?.name || "Untitled Task";

  const getTaskDate = (task) => task?.dueDate || task?.deadline || task?.targetDate || null;

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString();
  };

  const getProjectId = (project) =>
    String(project?.id ?? project?.projectId ?? project?.project_id ?? "");

  const getProjectName = (project) =>
    String(project?.name ?? project?.projectName ?? project?.title ?? "Untitled Project");

  const getProjectDescription = (project) =>
    project?.description ?? project?.projectDescription ?? "No description available.";

  const loadDashboard = useCallback(async (options = {}) => {
    const isBackground = Boolean(options.background);

    try {
      if (isBackground) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      const [projectData, taskData] = await Promise.all([
        fetchProjects(),
        fetchManagerTasks(),
      ]);

      const normalizedProjects = Array.isArray(projectData) ? projectData : [];
      const normalizedTasks = Array.isArray(taskData) ? taskData : [];

      setProjects(normalizedProjects);
      setTasks(normalizedTasks);
      writeManagerDashboardCache(normalizedProjects, normalizedTasks);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to load manager dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard({ background: Boolean(cachedDashboard) });
  }, [loadDashboard]);

  const liveTopics = useMemo(
    () => ["/topic/manager.dashboard", "/topic/tasks", "/topic/projects"],
    []
  );
  const refreshDashboard = useCallback(() => {
    loadDashboard({ background: true });
  }, [loadDashboard]);

  useLiveRefresh(liveTopics, refreshDashboard, { debounceMs: 900 });

  const tasksByProject = useMemo(() => {
    const grouped = new Map();

    tasks.forEach((task) => {
      const projectKey = String(
        task?.projectId ??
          task?.project_id ??
          task?.project?.id ??
          task?.project?.projectId ??
          ""
      );

      if (!projectKey) {
        return;
      }

      if (!grouped.has(projectKey)) {
        grouped.set(projectKey, []);
      }

      grouped.get(projectKey).push(task);
    });

    return grouped;
  }, [tasks]);

  const projectRows = useMemo(() => {
    return projects.map((project) => {
      const projectId = getProjectId(project);
      const projectTaskList = Array.isArray(project?.tasks)
        ? project.tasks
        : tasksByProject.get(projectId) || [];
      const totalTasks = projectTaskList.length;
      const doneTasks = projectTaskList.filter((task) => isCompletedTask(task)).length;
      const totalPointValue = projectTaskList.reduce(
        (sum, task) => sum + Number(task?.totalPointValue ?? task?.estimatedPoints ?? 0),
        0
      );
      const completedPointValue = projectTaskList.reduce(
        (sum, task) => {
          const taskTotal = Number(task?.totalPointValue ?? task?.estimatedPoints ?? 0);
          const taskCompleted = Number(task?.completedPointValue ?? (isCompletedTask(task) ? taskTotal : 0));
          return sum + taskCompleted;
        },
        0
      );
      const progress = totalPointValue > 0
        ? Math.round((completedPointValue * 100) / totalPointValue)
        : 0;
      const status =
        totalTasks === 0 ? "Planning" : doneTasks === totalTasks ? "Completed" : "Active";

      return {
        id: projectId,
        name: getProjectName(project),
        description: getProjectDescription(project),
        totalTasks,
        doneTasks,
        totalPointValue,
        completedPointValue,
        progress,
        status,
      };
    });
  }, [projects, tasksByProject]);

  const activeProjectCount = useMemo(
    () => projectRows.filter((project) => project.status === "Active").length,
    [projectRows]
  );

  const completionRate = useMemo(() => {
    const totalPointValue = tasks.reduce(
      (sum, task) => sum + Number(task?.totalPointValue ?? task?.estimatedPoints ?? 0),
      0
    );
    const completedPointValue = tasks.reduce((sum, task) => {
      const taskTotal = Number(task?.totalPointValue ?? task?.estimatedPoints ?? 0);
      return sum + Number(task?.completedPointValue ?? (isCompletedTask(task) ? taskTotal : 0));
    }, 0);

    if (totalPointValue === 0) {
      return 0;
    }

    return Math.round((completedPointValue / totalPointValue) * 100);
  }, [tasks]);

  const totalWeighted = useMemo(
    () => tasks.reduce((sum, task) => sum + Number(task?.totalPointValue ?? task?.estimatedPoints ?? 0), 0),
    [tasks]
  );

  const doneWeighted = useMemo(
    () => tasks.reduce((sum, task) => {
      const taskTotal = Number(task?.totalPointValue ?? task?.estimatedPoints ?? 0);
      return sum + Number(task?.completedPointValue ?? (isCompletedTask(task) ? taskTotal : 0));
    }, 0),
    [tasks]
  );

  const openTasks = useMemo(() => tasks.filter((task) => !isCompletedTask(task)), [tasks]);

  const upcomingTasks = useMemo(() => {
    return [...openTasks]
      .sort((a, b) => {
        const firstDate = getTaskDate(a);
        const secondDate = getTaskDate(b);
        if (!firstDate && !secondDate) return 0;
        if (!firstDate) return 1;
        if (!secondDate) return -1;
        return new Date(firstDate) - new Date(secondDate);
      })
      .slice(0, 5);
  }, [openTasks]);

  const recentCompletedTasks = useMemo(() => {
    return tasks
      .filter((task) => isCompletedTask(task))
      .sort((a, b) => {
        const firstDate = a?.completedAt || a?.updatedAt || a?.createdAt || 0;
        const secondDate = b?.completedAt || b?.updatedAt || b?.createdAt || 0;
        return new Date(secondDate) - new Date(firstDate);
      })
      .slice(0, 5);
  }, [tasks]);

  const getStatusChipStyle = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "completed") {
      return { bgcolor: "rgba(34,197,94,0.16)", color: "#86efac" };
    }
    if (normalized === "planning") {
      return { bgcolor: "rgba(245,158,11,0.16)", color: "#fcd34d" };
    }
    return { bgcolor: "rgba(59,130,246,0.18)", color: "#93c5fd" };
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, minHeight: "52vh", display: "grid", placeItems: "center" }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <CircularProgress size={24} />
          <Typography>Loading manager data...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: { xs: 2, md: 3 } }}>
      {refreshing ? (
        <LinearProgress
          sx={{
            mb: 1.2,
            height: 4,
            borderRadius: 999,
            bgcolor: "rgba(255,255,255,0.08)",
            "& .MuiLinearProgress-bar": { bgcolor: "#6d5dfc" },
          }}
        />
      ) : null}

      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={1.2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
            Manager Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8" }}>
            Track delivery health, inbound tickets, and developer progress.
          </Typography>
        </Box>

        <Button variant="outlined" onClick={() => navigate("/manager/projects")}>View Projects</Button>
      </Stack>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard label="Total Projects" value={projectRows.length} hint={`${activeProjectCount} active`} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard label="Total Tasks" value={tasks.length} hint={`${tasks.length - (projectRows.reduce((sum, p) => sum + p.doneTasks, 0))} open`} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard label="Weighted Progress" value={`${completionRate}%`} hint={`${doneWeighted}/${totalWeighted} points`} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard label="Weighted Done" value={doneWeighted} hint="Point value completed" />
        </Grid>
      </Grid>

      <Paper
        sx={{
          mb: 2,
          p: 1.8,
          borderRadius: 2.5,
          border: "1px solid rgba(148,163,184,0.16)",
          background: "rgba(15,23,42,0.68)",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.1 }}>
          <Box>
            <Typography sx={{ fontWeight: 900 }}>Projects Overview</Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              {projectRows.length} total projects • {activeProjectCount} active
            </Typography>
          </Box>
          <Button variant="outlined" size="small" onClick={() => navigate("/manager/projects")}>
            View All Projects
          </Button>
        </Stack>

        <Typography variant="body2" sx={{ color: "#94a3b8", mt: 1 }}>
          Go to Project Management for detailed list, editing, and task tracking. Click "View All Projects" to manage projects and tasks.
        </Typography>
      </Paper>

      <RecentEmailTickets />

      <Paper
        sx={{
          p: 1.6,
          mb: 2,
          borderRadius: 2.5,
          border: "1px solid rgba(148,163,184,0.16)",
          background: "rgba(15,23,42,0.68)",
        }}
      >
        <Typography sx={{ fontWeight: 900, mb: 1 }}>Developer Progress</Typography>
        <ManagerDeveloperProgress />
      </Paper>

      <Paper
        sx={{
          p: 1.6,
          borderRadius: 2.5,
          border: "1px solid rgba(148,163,184,0.16)",
          background: "rgba(15,23,42,0.68)",
        }}
      >
        <Typography sx={{ fontWeight: 900, mb: 1 }}>Task Focus</Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: "#94a3b8", textTransform: "uppercase", fontWeight: 800 }}>
              Upcoming Open Tasks
            </Typography>
            <Stack spacing={0.8} sx={{ mt: 0.7 }}>
              {upcomingTasks.length === 0 ? (
                <Typography variant="body2" sx={{ color: "#94a3b8" }}>No open tasks.</Typography>
              ) : upcomingTasks.map((task, index) => (
                <Box key={task?.id || `open-${index}`} sx={{ p: 1, borderRadius: 1.5, border: "1px solid rgba(148,163,184,0.14)", background: "#0f1b2f" }}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 800 }} noWrap>{getTaskTitle(task)}</Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                    Due: {formatDate(getTaskDate(task))}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: "#94a3b8", textTransform: "uppercase", fontWeight: 800 }}>
              Recently Completed
            </Typography>
            <Stack spacing={0.8} sx={{ mt: 0.7 }}>
              {recentCompletedTasks.length === 0 ? (
                <Typography variant="body2" sx={{ color: "#94a3b8" }}>No completed tasks yet.</Typography>
              ) : recentCompletedTasks.map((task, index) => (
                <Box key={task?.id || `done-${index}`} sx={{ p: 1, borderRadius: 1.5, border: "1px solid rgba(148,163,184,0.14)", background: "#0f1b2f" }}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 800 }} noWrap>{getTaskTitle(task)}</Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                    Updated: {formatDate(task?.completedAt || task?.updatedAt || task?.createdAt)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}





