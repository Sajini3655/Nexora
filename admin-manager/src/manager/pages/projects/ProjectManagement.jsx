import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { fetchManagerTasks, fetchProjects } from "../../../services/managerService";
import useLiveRefresh from "../../../hooks/useLiveRefresh";

export default function ProjectManagement() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getProjectId = (project) =>
    String(project?.id ?? project?.projectId ?? project?.project_id ?? "");

  const normalizeTaskStatus = (task) =>
    String(task?.status || task?.taskStatus || task?.state || "")
      .trim()
      .toLowerCase();

  const isTaskDone = (task) => {
    const status = normalizeTaskStatus(task);
    return (
      status === "done" ||
      status === "complete" ||
      status === "completed" ||
      status === "closed" ||
      status === "resolved"
    );
  };

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [projectsData, tasksData] = await Promise.all([
        fetchProjects(),
        fetchManagerTasks(),
      ]);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to load project management data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const liveTopics = useMemo(
    () => ["/topic/manager.dashboard", "/topic/tasks", "/topic/projects"],
    []
  );
  useLiveRefresh(liveTopics, loadProjects, { debounceMs: 550 });

  const projectCards = useMemo(() => {
    const tasksByProject = new Map();

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

      if (!tasksByProject.has(projectKey)) {
        tasksByProject.set(projectKey, []);
      }

      tasksByProject.get(projectKey).push(task);
    });

    return projects.map((project) => {
      const projectId = getProjectId(project);
      const taskList = Array.isArray(project?.tasks)
        ? project.tasks
        : tasksByProject.get(projectId) || [];
      const totalTasks = taskList.length;
      const doneTasks = taskList.filter((task) => isTaskDone(task)).length;
      const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

      let status = "Planning";
      if (totalTasks > 0) {
        status = doneTasks === totalTasks ? "Completed" : "Active";
      }

      return {
        id: projectId,
        name: project?.name || project?.projectName || "Untitled Project",
        description: project?.description || project?.projectDescription || "No description provided.",
        status,
        progress,
        tasks: totalTasks,
      };
    });
  }, [projects, tasks]);

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
