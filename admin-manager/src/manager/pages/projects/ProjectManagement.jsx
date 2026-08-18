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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { getErrorMessage, fetchManagerClients, deleteProject } from "../../../services/managerService";
import api from "../../../services/api";
import { useManagerProjects, useManagerTasks } from "../../data/useManager";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import ErrorNotice from "/src/components/ui/ErrorNotice.jsx";
import { formatDate } from "../../../utils/formatDate.js";

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

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deletingProject, setDeletingProject] = useState(false);

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
        createdAt: project?.createdAt || project?.created_at || project?.created || "",
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

      setTimeout(() => {
        navigate(`/manager/project-management/${created.id}`);
      }, 500);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create project."));
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDeleteProject = (project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    setDeletingProject(true);
    setError("");
    setSuccess("");

    try {
      await deleteProject(projectToDelete.id);
      setSuccess("Project deleted successfully.");
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      await projectsQuery.refetch();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete project."));
    } finally {
      setDeletingProject(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    if (!deletingProject) {
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
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
            {}
          </Box>
        </Stack>
      </Paper>

      {error ? <ErrorNotice message={error} severity="error" sx={{ mb: 2 }} dedupeKey="project-management-error" /> : null}
      {success ? <ErrorNotice message={success} severity="success" sx={{ mb: 2 }} dedupeKey="project-management-success" /> : null}

      {}

      <Paper sx={{ p: { xs: 1.25, sm: 1.5 }, borderRadius: 2.5, border: "1px solid var(--nx-border)", background: "var(--nx-panel)", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 340px)" }}>
        <Typography sx={{ fontWeight: 900, mb: 1.2, color: "var(--nx-text)" }}>Your Projects</Typography>
        {visibleProjectRows.length === 0 ? (
          <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
            {q ? `No projects match “${q}”.` : "No projects found for this manager."}
          </Typography>
        ) : (
          <Box sx={{ overflow: "auto", flex: 1, minHeight: 0 }}>
            <Box sx={{ minWidth: 860 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1.45fr 0.9fr 0.7fr 0.65fr 0.75fr 0.75fr 0.7fr 0.7fr", gap: 1, py: 0.8, borderBottom: "1px solid var(--nx-border)", position: "sticky", top: 0, zIndex: 1, background: "var(--nx-panel)" }}>
                {["Project", "Date Created", "Status", "Tasks", "Completed", "Weighted", "Progress", "Actions"].map((header) => (
                  <Typography key={header} variant="caption" sx={{ color: "var(--nx-muted)", textTransform: "uppercase", fontWeight: 800 }}>
                    {header}
                  </Typography>
                ))}
              </Box>

              {visibleProjectRows.map((project) => (
                <Box key={project.id} sx={{ display: "grid", gridTemplateColumns: "1.45fr 0.9fr 0.7fr 0.65fr 0.75fr 0.75fr 0.7fr 0.7fr", gap: 1, py: 1, borderBottom: "1px solid var(--nx-border)" }}>
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
                  </Box>

                  <Typography variant="body2" sx={{ color: "var(--nx-text-soft)", alignSelf: "center" }}>
                    {formatDate(project.createdAt)}
                  </Typography>

                  <Chip size="small" label={project.status} sx={{ width: "fit-content", alignSelf: "center", fontWeight: 800, ...getStatusChipStyle(project.status) }} />

                  <Typography variant="body2" sx={{ color: "var(--nx-text-soft)", alignSelf: "center" }}>{project.taskCount}</Typography>
                  <Typography variant="body2" sx={{ color: "var(--nx-text-soft)", alignSelf: "center" }}>{project.completedTaskCount}</Typography>
                  <Typography variant="body2" sx={{ color: "var(--nx-text-soft)", alignSelf: "center" }}>{project.completedPointValue}/{project.totalPointValue}</Typography>

                  <Box sx={{ alignSelf: "center" }}>
                    <Typography variant="caption" sx={{ color: "var(--nx-text-soft)" }}>{project.weightedProgress}%</Typography>
                    <LinearProgress variant="determinate" value={project.weightedProgress} sx={{ mt: 0.4, height: 6, borderRadius: 999, bgcolor: "var(--nx-panel-2)", '& .MuiLinearProgress-bar': { bgcolor: "var(--nx-purple)" } }} />
                  </Box>

                  <Box sx={{ alignSelf: "center", display: "flex", gap: 0.5 }}>
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
                        flex: 1,
                      }}
                    >
                      Manage
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!project.id || deletingProject}
                      onClick={() => handleDeleteProject(project)}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        color: "#ef4444",
                        borderColor: "#ef4444",
                        '&:hover': { backgroundColor: "rgba(239,68,68,0.1)" },
                        '&:disabled': { opacity: 0.5 },
                      }}
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, color: "var(--nx-text)" }}>
          Delete Project
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ color: "var(--nx-text)" }}>
            Are you sure you want to delete <strong>{projectToDelete?.name}</strong>? This action will:
          </Typography>
          <Box component="ul" sx={{ mt: 1.5, mb: 1.5, color: "var(--nx-text-soft)" }}>
            <Typography component="li">Remove all tasks and story points</Typography>
            <Typography component="li">Remove all timesheet entries</Typography>
            <Typography component="li">Remove all project activities and chats</Typography>
            <Typography component="li">Remove all project files</Typography>
          </Box>
          <Typography sx={{ color: "var(--nx-text-soft)", fontWeight: 600 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseDeleteDialog}
            disabled={deletingProject}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              color: "var(--nx-text)",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={deletingProject}
            loading={deletingProject}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              backgroundColor: "#ef4444",
              color: "white",
              '&:hover': { backgroundColor: "#dc2626" },
              '&:disabled': { opacity: 0.5 },
            }}
          >
            {deletingProject ? "Deleting..." : "Delete Project"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}





