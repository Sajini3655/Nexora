// src/pages/dashboard/ManagerDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { fetchManagerTasks, fetchProjects } from "../../services/managerService";

export default function ManagerDashboard() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const projectCards = useMemo(() => {
    return projects.map((project) => {
      const totalTasks = project.tasks?.length || 0;
      const doneTasks = (project.tasks || []).filter((task) => task.status === "DONE").length;
      const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
      const status = totalTasks > 0 && doneTasks === totalTasks ? "Completed" : "Active";

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        totalTasks,
        doneTasks,
        progress,
        status,
      };
    });
  }, [projects]);

  const activeProjectCount = useMemo(
    () => projectCards.filter((project) => project.status !== "Completed").length,
    [projectCards]
  );

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== "DONE"),
    [tasks]
  );

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === "DONE"),
    [tasks]
  );

  const glassBoxStyle = {
    p: 2,
    borderRadius: 2,
    bgcolor: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(5px)",
    border: "1px solid rgba(255,255,255,0.1)",
    cursor: "pointer",
    "&:hover": { transform: "scale(1.02)", boxShadow: "0 8px 30px rgba(0,0,0,0.2)" },
  };

  const statBoxStyle = {
    p: 2,
    borderRadius: 2,
    bgcolor: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(5px)",
    border: "1px solid rgba(255,255,255,0.1)",
    textAlign: "center",
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "#1976d2";
      case "Pending": return "#ff9800";
      case "Completed": return "#4caf50";
      default: return "#1976d2";
    }
  };

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
      <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
        <CircularProgress size={24} />
        <Typography>Loading manager data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Manager Dashboard</Typography>

      {error ? (
        <Box sx={{ mb: 3, p: 2, borderRadius: 2, border: "1px solid rgba(255,120,120,0.5)", backgroundColor: "rgba(255,120,120,0.08)" }}>
          <Typography>{error}</Typography>
        </Box>
      ) : null}

      {/* Key Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}><Box sx={statBoxStyle}><Typography variant="h6">Total Projects</Typography><Typography variant="h5">{projectCards.length}</Typography></Box></Grid>
        <Grid item xs={12} md={4}><Box sx={statBoxStyle}><Typography variant="h6">Active Projects</Typography><Typography variant="h5">{activeProjectCount}</Typography></Box></Grid>
        <Grid item xs={12} md={4}><Box sx={statBoxStyle}><Typography variant="h6">My Created Tasks</Typography><Typography variant="h5">{tasks.length}</Typography></Box></Grid>
      </Grid>

      {/* Projects */}
      <Typography variant="h5" sx={{ mb: 2 }}>Projects</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {projectCards.map((proj) => (
          <Grid item xs={12} md={4} key={proj.id}>
            <Box sx={glassBoxStyle} onClick={() => navigate(`/manager/projects/${proj.id}`)}>
              <Chip label={proj.status} size="small" sx={{ mb: 1, bgcolor: getStatusColor(proj.status), color:"#fff" }}/>
              <Typography variant="h6">{proj.name}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                {proj.totalTasks} tasks • {proj.doneTasks} done
              </Typography>
              <LinearProgress variant="determinate" value={proj.progress} sx={{ mt:1, mb:1, height:8, borderRadius:5, backgroundColor:"rgba(255,255,255,0.1)", "& .MuiLinearProgress-bar":{backgroundColor:getStatusColor(proj.status)}}}/>
              <Typography variant="body2">{proj.progress}% complete</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Tasks */}
      <Typography variant="h5" sx={{ mb: 2 }}>My Tasks</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb:1 }}>Open Tasks</Typography>
          {openTasks.length === 0 ? (
            <Typography variant="body2" sx={{ opacity: 0.7 }}>No open tasks.</Typography>
          ) : openTasks.map((task) => (
            <Box key={task.id} sx={glassBoxStyle}>
              <Typography variant="body1">{task.title}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.75 }}>
                Priority: {task.priority || "-"} • Due: {formatDate(task.dueDate)}
              </Typography>
            </Box>
          ))}
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb:1 }}>Completed Tasks</Typography>
          {completedTasks.length === 0 ? (
            <Typography variant="body2" sx={{ opacity: 0.7 }}>No completed tasks yet.</Typography>
          ) : completedTasks.map((task) => (
            <Box key={task.id} sx={glassBoxStyle}>
              <Typography variant="body1">{task.title}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.75 }}>
                Completed • Created: {formatDate(task.createdAt)}
              </Typography>
            </Box>
          ))}
        </Grid>
      </Grid>
    </Box>
  );
}
