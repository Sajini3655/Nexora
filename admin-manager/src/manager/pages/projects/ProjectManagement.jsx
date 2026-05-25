import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  MenuItem,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { getErrorMessage, fetchManagerClients } from "../../../services/managerService";
import api from "../../../services/api";
import { useManagerProjects, useManagerTasks } from "../../data/useManager";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import ErrorNotice from "/src/components/ui/ErrorNotice.jsx";

function isCompletedTask(task) {
  const status = String(task?.status || task?.taskStatus || "").toLowerCase();
  return status === "done" || status === "completed" || status === "complete" || status === "closed" || status === "resolved";
}

function getProjectId(project) {
  return String(project?.id ?? project?.projectId ?? project?.project_id ?? "");
}

function getProjectName(project) {
  return String(project?.name ?? project?.projectName ?? project?.title ?? "Untitled Project");
}

function getProjectDescription(project) {
  return project?.description ?? project?.projectDescription ?? "No description available.";
}

export default function ProjectManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const projectsQuery = useManagerProjects();
  const tasksQuery = useManagerTasks();

  const projects = Array.isArray(projectsQuery.data) ? projectsQuery.data : [];
  const tasks = Array.isArray(tasksQuery.data) ? tasksQuery.data : [];
  const loading = projectsQuery.isLoading || tasksQuery.isLoading;
  const queryError =
    projectsQuery.error?.message ||
    tasksQuery.error?.message ||
    "";
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");

  const [newProjectForm, setNewProjectForm] = useState({ name: "", description: "" });
  const [creatingProject, setCreatingProject] = useState(false);

  const q = useMemo(() => {
    const params = new URLSearchParams(location.search || "");
    return String(params.get("q") || "").trim().toLowerCase();
  }, [location.search]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await fetchManagerClients();
        if (mounted) setClients(list);
      } catch (err) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const projectRows = useMemo(() => {
    const tasksByProject = new Map();

    tasks.forEach((task) => {
      const projectKey = String(task?.projectId ?? task?.project_id ?? task?.project?.id ?? task?.project?.projectId ?? "");
      if (!projectKey) return;
      if (!tasksByProject.has(projectKey)) tasksByProject.set(projectKey, []);
      tasksByProject.get(projectKey).push(task);
    });

    return projects.map((project) => {
      const projectId = getProjectId(project);
      const projectTasks = Array.isArray(project?.tasks) ? project.tasks : tasksByProject.get(projectId) || [];
      const taskCount = projectTasks.length;
      const completedTaskCount = projectTasks.filter((task) => isCompletedTask(task)).length;
      const totalPointValue = projectTasks.reduce((sum, task) => sum + Number(task?.totalPointValue ?? 0), 0);
      const completedPointValue = projectTasks.reduce((sum, task) => {
        const taskTotal = Number(task?.totalPointValue ?? 0);
        return sum + Number(task?.completedPointValue ?? (isCompletedTask(task) ? taskTotal : 0));
      }, 0);
      const weightedProgress = totalPointValue > 0
        ? Math.round((completedPointValue * 100) / totalPointValue)
        : (taskCount > 0 ? Math.round((completedTaskCount * 100) / taskCount) : 0);
      const status = taskCount === 0 ? "Planning" : completedTaskCount === taskCount ? "Completed" : "Active";

      return {
        id: projectId,
        name: getProjectName(project),
        description: getProjectDescription(project),
        clientName: project?.clientName || project?.client?.name || "",
        clientEmail: project?.clientEmail || project?.client?.email || "",
        status,
        taskCount,
        completedTaskCount,
        totalPointValue,
        completedPointValue,
        weightedProgress,
      };
    });
  }, [projects, tasks]);

  const visibleProjectRows = useMemo(() => {
    if (!q) return projectRows;
    return projectRows.filter((project) => {
      const text = `${project?.name || ""} ${project?.description || ""} ${project?.clientName || ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [projectRows, q]);

  const handleCreateNewProject = async () => {
    if (!newProjectForm.name.trim()) {
      setError("Project name is required.");
      return;
    }

    setCreatingProject(true);
    setError("");
    setSuccess("");

    try {
      const created = await api.post("/manager/projects", {
        name: newProjectForm.name.trim(),
        description: newProjectForm.description.trim() || null,
        clientId: selectedClientId ? Number(selectedClientId) : null,
      });

      setSuccess("New project created successfully!");
      setNewProjectForm({ name: "", description: "" });
      setSelectedClientId("");

      projectsQuery.refetch();

      // Navigate to the new project after a short delay
      setTimeout(() => {
        navigate(`/manager/project-management/${created.id}`);
      }, 500);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create project."));
    } finally {
      setCreatingProject(false);
    }
  };
  const getStatusChipStyle = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "completed") {
      return {
        bgcolor: "color-mix(in srgb, var(--nx-green) 18%, transparent)",
        color: "var(--nx-green)",
      };
    }
    if (normalized === "planning") {
      return {
        bgcolor: "color-mix(in srgb, var(--nx-yellow) 18%, transparent)",
        color: "var(--nx-yellow)",
      };
    }
    return {
      bgcolor: "color-mix(in srgb, var(--nx-blue) 18%, transparent)",
      color: "var(--nx-blue)",
    };
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
        <CircularProgress size={24} sx={{ color: "var(--nx-purple)" }} />
        <Typography sx={{ color: "var(--nx-text)" }}>Loading projects...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Paper
        sx={{
          mb: 2,
          p: { xs: 1.5, sm: 1.8 },
          borderRadius: 2.5,
          border: "1px solid var(--nx-border)",
          background: "var(--nx-panel)",
          boxShadow: "var(--nx-shadow)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={1.2}>
          <Box>
            <Typography variant="caption" sx={{ color: "var(--nx-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.4 }}>
              Manager / Projects
            </Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2, mt: 0.3, color: "var(--nx-text)" }}>
              Project Management
            </Typography>
            {/* Subtitle removed per request */}
          </Box>
        </Stack>
      </Paper>

      {error ? <ErrorNotice message={error} severity="error" sx={{ mb: 2 }} dedupeKey="project-management-error" /> : null}
      {success ? <ErrorNotice message={success} severity="success" sx={{ mb: 2 }} dedupeKey="project-management-success" /> : null}

      {/* Create New Project widget removed per request */}

      <Paper sx={{ p: { xs: 1.25, sm: 1.5 }, borderRadius: 2.5, border: "1px solid var(--nx-border)", background: "var(--nx-panel)", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 340px)" }}>
        <Typography sx={{ fontWeight: 900, mb: 1.2, color: "var(--nx-text)" }}>Your Projects</Typography>
        {visibleProjectRows.length === 0 ? (
          <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
            {q ? `No projects match “${q}”.` : "No projects found for this manager."}
          </Typography>
        ) : (
          <Box sx={{ overflow: "auto", flex: 1, minHeight: 0 }}>
            <Box sx={{ minWidth: 860 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1.45fr 0.7fr 0.65fr 0.75fr 0.75fr 0.7fr", gap: 1, py: 0.8, borderBottom: "1px solid var(--nx-border)", position: "sticky", top: 0, zIndex: 1, background: "var(--nx-panel)" }}>
                {["Project", "Status", "Tasks", "Completed", "Weighted", "Progress"].map((header) => (
                  <Typography key={header} variant="caption" sx={{ color: "var(--nx-muted)", textTransform: "uppercase", fontWeight: 800 }}>
                    {header}
                  </Typography>
                ))}
              </Box>

              {visibleProjectRows.map((project) => (
                <Box key={project.id} sx={{ display: "grid", gridTemplateColumns: "1.45fr 0.7fr 0.65fr 0.75fr 0.75fr 0.7fr", gap: 1, py: 1, borderBottom: "1px solid var(--nx-border)" }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 14, color: "var(--nx-text)" }} noWrap>
                      {project.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--nx-muted)" }} noWrap>
                      {project.description}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "var(--nx-muted)", display: "block", mt: 0.4 }} noWrap>
                      Client: {project.clientName || "No client assigned"}
                    </Typography>
                    <Box sx={{ mt: 0.7 }}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        disabled={!project.id}
                        onClick={() => {
                          if (project.id) navigate(`/manager/project-management/${project.id}`);
                        }} 
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          color: "var(--nx-text)",
                          borderColor: "var(--nx-border)",
                          '&:hover': { backgroundColor: "var(--nx-panel-2)" },
                          width: { xs: "100%", sm: "auto" },
                        }}
                      >
                        Manage Project
                      </Button>
                    </Box>
                  </Box>

                  <Chip size="small" label={project.status} sx={{ width: "fit-content", fontWeight: 800, ...getStatusChipStyle(project.status) }} />

                  <Typography variant="body2" sx={{ color: "var(--nx-text-soft)" }}>{project.taskCount}</Typography>
                  <Typography variant="body2" sx={{ color: "var(--nx-text-soft)" }}>{project.completedTaskCount}</Typography>
                  <Typography variant="body2" sx={{ color: "var(--nx-text-soft)" }}>{project.completedPointValue}/{project.totalPointValue}</Typography>

                  <Box>
                    <Typography variant="caption" sx={{ color: "var(--nx-text-soft)" }}>{project.weightedProgress}%</Typography>
                    <LinearProgress variant="determinate" value={project.weightedProgress} sx={{ mt: 0.4, height: 6, borderRadius: 999, bgcolor: "var(--nx-panel-2)", '& .MuiLinearProgress-bar': { bgcolor: "var(--nx-purple)" } }} />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}




