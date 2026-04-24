import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress
} from "@mui/material";
import { useParams } from "react-router-dom";
import { fetchProjects } from "../../services/managerService";

export default function ProjectManagementDetails() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadProject = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchProjects();
        if (!active) {
          return;
        }

        const selected = (Array.isArray(data) ? data : []).find(
          (item) => String(item.id) === String(projectId)
        );

        if (!selected) {
          setError("Project not found or not accessible for this manager.");
          setProject(null);
          return;
        }

        setProject(selected);
      } catch (err) {
        if (!active) {
          return;
        }
        setError(
          err?.response?.data?.message ||
            "Failed to load project details."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProject();

    return () => {
      active = false;
    };
  }, [projectId]);

  const totalTasks = project?.tasks?.length || 0;
  const doneTasks = useMemo(
    () => (project?.tasks || []).filter((task) => task.status === "DONE").length,
    [project]
  );
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1000, mx: "auto", mt: 4, display: "flex", alignItems: "center", gap: 1.5 }}>
        <CircularProgress size={24} />
        <Typography>Loading project details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 1000, mx: "auto", mt: 4 }}>
        <Paper sx={{ p: 3, border: "1px solid rgba(255,120,120,0.5)", backgroundColor: "rgba(255,120,120,0.08)" }}>
          <Typography>{error}</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Manage: {project.name}
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Project Overview
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, opacity: 0.85 }}>
          {project.description || "No description provided."}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Chip label={`Tasks: ${totalTasks}`} />
          <Chip color={doneTasks === totalTasks && totalTasks > 0 ? "success" : "primary"} label={`Done: ${doneTasks}`} />
          <Chip variant="outlined" label={`Progress: ${progress}%`} />
        </Box>
      </Paper>

      <Typography variant="h6" sx={{ mb: 2 }}>Tasks</Typography>

      {(project.tasks || []).length === 0 ? (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography>No tasks found in this project.</Typography>
        </Paper>
      ) : (project.tasks || []).map((task) => (
        <Paper key={task.id} sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 700 }}>
            {task.title}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={`Status: ${task.status || "-"}`}
              color={task.status === "DONE" ? "success" : "primary"}
              size="small"
            />
            <Chip label={`Priority: ${task.priority || "-"}`} variant="outlined" size="small" />
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
