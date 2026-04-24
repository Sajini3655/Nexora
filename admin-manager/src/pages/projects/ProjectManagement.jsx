import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  LinearProgress,
  CircularProgress
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { fetchProjects } from "../../services/managerService";

export default function ProjectManagement() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadProjects = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchProjects();
        if (!active) {
          return;
        }
        setProjects(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!active) {
          return;
        }
        setError(
          err?.response?.data?.message ||
            "Failed to load project management data."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      active = false;
    };
  }, []);

  const projectCards = useMemo(() => {
    return projects.map((project) => {
      const totalTasks = project.tasks?.length || 0;
      const doneTasks = (project.tasks || []).filter((task) => task.status === "DONE").length;
      const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

      let status = "Planning";
      if (totalTasks > 0) {
        status = doneTasks === totalTasks ? "Completed" : "Active";
      }

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status,
        progress,
        tasks: totalTasks,
      };
    });
  }, [projects]);

  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
        <CircularProgress size={24} />
        <Typography>Loading projects...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h4" sx={{ mb: 4 }}>
        Project Management
      </Typography>

      {error ? (
        <Box sx={{ mb: 3, p: 2, borderRadius: 2, border: "1px solid rgba(255,120,120,0.5)", backgroundColor: "rgba(255,120,120,0.08)" }}>
          <Typography>{error}</Typography>
        </Box>
      ) : null}

      {!error && projectCards.length === 0 ? (
        <Paper sx={{ p: 3, border: "1px solid rgba(255,255,255,0.08)" }}>
          <Typography>No projects found for this manager.</Typography>
        </Paper>
      ) : null}

      <Grid container spacing={3}>
        {projectCards.map((project) => (
          <Grid item xs={12} md={6} lg={4} key={project.id}>
            <Paper
              sx={{
                p: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "0.3s",
                border: "1px solid rgba(255,255,255,0.06)",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.4)"
                }
              }}
            >
              {/* Top Info */}
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {project.name}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ mb: 2, opacity: 0.8 }}
                >
                  {project.description}
                </Typography>

                <Chip
                  label={project.status}
                  color={
                    project.status === "Active"
                      ? "success"
                      : project.status === "Planning"
                      ? "warning"
                      : "default"
                  }
                  size="small"
                  sx={{ mb: 2 }}
                />

                <Typography variant="body2" sx={{ mb: 1 }}>
                  Tasks: {project.tasks}
                </Typography>

                <LinearProgress
                  variant="determinate"
                  value={project.progress}
                  sx={{ height: 8, borderRadius: 5 }}
                />

                <Typography
                  variant="caption"
                  sx={{ display: "block", mt: 1 }}
                >
                  {project.progress}% Complete
                </Typography>
              </Box>

              {/* Manage Button */}
              <Button
                variant="contained"
                sx={{ mt: 3 }}
                fullWidth
                onClick={() =>
                  navigate(
                    `/manager/project-management/${project.id}`
                  )
                }
              >
                Manage Project
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
