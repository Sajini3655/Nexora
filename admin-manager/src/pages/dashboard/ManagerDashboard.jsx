// src/pages/dashboard/ManagerDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { fetchManagerTasks, fetchProjects } from "../../services/managerService";

export default function ManagerDashboard() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const getTaskPriority = (task) =>
    String(task?.priority || task?.taskPriority || "MEDIUM").toUpperCase();

  const getTaskDate = (task) =>
    task?.dueDate || task?.deadline || task?.targetDate || null;

  const getProjectId = (project) =>
    String(project?.id ?? project?.projectId ?? project?.project_id ?? "");

  const getProjectName = (project) =>
    String(project?.name ?? project?.projectName ?? project?.title ?? "Untitled Project");

  const getProjectDescription = (project) =>
    project?.description ?? project?.projectDescription ?? "No description available.";

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const [projectData, taskData] = await Promise.all([
          fetchProjects(),
          fetchManagerTasks(),
        ]);

        if (!active) {
          return;
        }

        setProjects(Array.isArray(projectData) ? projectData : []);
        setTasks(Array.isArray(taskData) ? taskData : []);
      } catch (err) {
        if (!active) {
          return;
        }

        setError(
          err?.response?.data?.message ||
            "Failed to load manager dashboard data."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

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

  const projectCards = useMemo(() => {
    return projects.map((project) => {
      const projectId = getProjectId(project);
      const projectTaskList = Array.isArray(project?.tasks)
        ? project.tasks
        : tasksByProject.get(projectId) || [];
      const totalTasks = projectTaskList.length;
      const doneTasks = projectTaskList.filter((task) => isCompletedTask(task)).length;
      const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
      const status =
        totalTasks === 0 ? "Planning" : doneTasks === totalTasks ? "Completed" : "Active";

      return {
        id: projectId,
        name: getProjectName(project),
        description: getProjectDescription(project),
        totalTasks,
        doneTasks,
        progress,
        status,
      };
    });
  }, [projects, tasksByProject]);

  const activeProjectCount = useMemo(
    () => projectCards.filter((project) => project.status === "Active").length,
    [projectCards]
  );

  const openTasks = useMemo(
    () => tasks.filter((task) => !isCompletedTask(task)),
    [tasks]
  );

  const completedTasks = useMemo(
    () => tasks.filter((task) => isCompletedTask(task)),
    [tasks]
  );

  const completionRate = useMemo(() => {
    if (tasks.length === 0) {
      return 0;
    }
    return Math.round((completedTasks.length / tasks.length) * 100);
  }, [completedTasks.length, tasks.length]);

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
    return [...completedTasks]
      .sort((a, b) => {
        const firstDate = a?.completedAt || a?.updatedAt || a?.createdAt || 0;
        const secondDate = b?.completedAt || b?.updatedAt || b?.createdAt || 0;
        return new Date(secondDate) - new Date(firstDate);
      })
      .slice(0, 5);
  }, [completedTasks]);

  const glassBoxStyle = {
    p: 2.2,
    borderRadius: 3,
    bgcolor: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.11)",
    boxShadow: "0 16px 45px rgba(0,0,0,0.22)",
    cursor: "pointer",
    transition: "all 180ms ease",
    "&:hover": {
      transform: "translateY(-3px)",
      boxShadow: "0 20px 45px rgba(0,0,0,0.28)",
      borderColor: "rgba(255,255,255,0.2)",
    },
  };

  const statBoxStyle = {
    p: 2.4,
    borderRadius: 3,
    bgcolor: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.11)",
    boxShadow: "0 14px 36px rgba(0,0,0,0.2)",
    textAlign: "center",
  };

  const taskBoxStyle = {
    ...glassBoxStyle,
    cursor: "default",
    "&:hover": {
      transform: "none",
      boxShadow: "none",
    },
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "#1976d2";
      case "Planning": return "#f59e0b";
      case "Pending": return "#ff9800";
      case "Completed": return "#4caf50";
      default: return "#1976d2";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
      case "CRITICAL":
        return "#ef5350";
      case "MEDIUM":
        return "#ffb300";
      case "LOW":
        return "#66bb6a";
      default:
        return "#90caf9";
    }
  };

  const getTaskTitle = (task) => task?.title || task?.taskName || task?.name || "Untitled Task";

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString();
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
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Paper
        sx={{
          mb: 3,
          p: { xs: 2.2, md: 2.8 },
          borderRadius: 3,
          border: "1px solid rgba(255,255,255,0.1)",
          background:
            "radial-gradient(1200px 220px at -5% -60%, rgba(16,185,129,0.16), transparent 55%), radial-gradient(1100px 280px at 110% -80%, rgba(59,130,246,0.18), transparent 60%), rgba(255,255,255,0.03)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.6, fontWeight: 900, letterSpacing: "-0.02em" }}>Manager Dashboard</Typography>
            <Typography sx={{ opacity: 0.78 }}>
              Track project delivery and monitor workload.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null}

      {/* Key Stats */}
      <Grid container spacing={2.2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}><Box sx={statBoxStyle}><Typography variant="h6">Total Projects</Typography><Typography variant="h5">{projectCards.length}</Typography></Box></Grid>
        <Grid item xs={12} md={3}><Box sx={statBoxStyle}><Typography variant="h6">Active Projects</Typography><Typography variant="h5">{activeProjectCount}</Typography></Box></Grid>
        <Grid item xs={12} md={3}><Box sx={statBoxStyle}><Typography variant="h6">Total Tasks</Typography><Typography variant="h5">{tasks.length}</Typography></Box></Grid>
        <Grid item xs={12} md={3}><Box sx={statBoxStyle}><Typography variant="h6">Completion Rate</Typography><Typography variant="h5">{completionRate}%</Typography></Box></Grid>
      </Grid>

      {/* Projects */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 850 }}>Projects</Typography>
      {projectCards.length === 0 ? (
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}>
          <Typography>No projects available yet.</Typography>
          <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.75 }}>
            Use the sidebar Add Project page to create a new project.
          </Typography>
        </Paper>
      ) : null}
      <Grid container spacing={2.2} sx={{ mb: 4 }}>
        {projectCards.map((proj) => (
          <Grid item xs={12} md={4} key={proj.id}>
            <Box sx={glassBoxStyle} onClick={() => navigate(`/manager/projects/${proj.id}`)}>
              <Chip label={proj.status} size="small" sx={{ mb: 1, bgcolor: getStatusColor(proj.status), color:"#fff" }}/>
              <Typography variant="h6">{proj.name}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                {proj.totalTasks} tasks • {proj.doneTasks} done
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.75, mb: 1 }}>
                {proj.description}
              </Typography>
              <LinearProgress variant="determinate" value={proj.progress} sx={{ mt:1, mb:1, height:8, borderRadius:5, backgroundColor:"rgba(255,255,255,0.1)", "& .MuiLinearProgress-bar":{backgroundColor:getStatusColor(proj.status)}}}/>
              <Typography variant="body2">{proj.progress}% complete</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Tasks */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 850 }}>Task Focus</Typography>
      <Grid container spacing={2.2}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb:1.2, fontWeight: 800 }}>Upcoming Open Tasks</Typography>
          {upcomingTasks.length === 0 ? (
            <Typography variant="body2" sx={{ opacity: 0.7 }}>No open tasks.</Typography>
          ) : upcomingTasks.map((task, index) => (
            <Box key={task?.id || task?.taskId || `open-${index}`} sx={taskBoxStyle}>
              <Typography variant="body1">{getTaskTitle(task)}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.75 }}>
                Priority: <span style={{ color: getPriorityColor(getTaskPriority(task)) }}>{getTaskPriority(task)}</span> • Due: {formatDate(getTaskDate(task))}
              </Typography>
            </Box>
          ))}
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb:1.2, fontWeight: 800 }}>Recently Completed</Typography>
          {recentCompletedTasks.length === 0 ? (
            <Typography variant="body2" sx={{ opacity: 0.7 }}>No completed tasks yet.</Typography>
          ) : recentCompletedTasks.map((task, index) => (
            <Box key={task?.id || task?.taskId || `done-${index}`} sx={taskBoxStyle}>
              <Typography variant="body1">{getTaskTitle(task)}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.75 }}>
                Completed • Updated: {formatDate(task.completedAt || task.updatedAt || task.createdAt)}
              </Typography>
            </Box>
          ))}
        </Grid>
      </Grid>
    </Box>
  );
}
