import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import {
  createManagerTask,
  fetchProjectDetails,
  getErrorMessage,
} from "../../../services/managerService";

const emptyTask = {
  title: "",
  priority: "MEDIUM",
};

function getProjectName(project) {
  return project?.name || project?.projectName || "Untitled Project";
}

function getProjectDescription(project) {
  return project?.description || project?.projectDescription || "No description provided.";
}

function getProjectId(project, routeProjectId) {
  return String(project?.id ?? project?.projectId ?? project?.project_id ?? routeProjectId ?? "");
}

function getTaskId(task, index) {
  return String(task?.id ?? task?.taskId ?? task?.task_id ?? `task-${index}`);
}

function getTaskTitle(task) {
  return task?.title || task?.taskName || task?.name || "Untitled Task";
}

function getTaskPriority(task) {
  return task?.priority || task?.taskPriority || "-";
}

function getTaskStatus(task) {
  return task?.status || task?.taskStatus || task?.state || "-";
}

function getTaskAssignee(task) {
  return (
    task?.assignedToName ||
    task?.assigned_to_name ||
    task?.assignedTo?.name ||
    task?.assigneeName ||
    ""
  );
}

function isTaskDone(task) {
  const status = String(getTaskStatus(task)).trim().toLowerCase();

  return (
    status === "done" ||
    status === "complete" ||
    status === "completed" ||
    status === "closed" ||
    status === "resolved"
  );
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProjectManagementDetails() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [newTask, setNewTask] = useState(emptyTask);
  const [files, setFiles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingProject, setSavingProject] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProject = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await fetchProjectDetails(projectId);

      if (!data) {
        setError("Project not found or not accessible for this manager.");
        setProject(null);
        return;
      }

      setProject(data);
      setEditName(getProjectName(data));
      setEditDescription(getProjectDescription(data));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load project details."));
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const tasks = Array.isArray(project?.tasks) ? project.tasks : [];

  const totalTasks = tasks.length;

  const doneTasks = useMemo(() => {
    return tasks.filter((task) => isTaskDone(task)).length;
  }, [tasks]);

  const progress =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const canSaveProject =
    editName.trim() &&
    editDescription.trim() &&
    (
      editName.trim() !== getProjectName(project) ||
      editDescription.trim() !== getProjectDescription(project)
    );

  const canAddTask = Boolean(newTask.title.trim() && newTask.priority);

  const handleSaveProject = async () => {
    if (!project) return;

    setSavingProject(true);
    setError("");
    setSuccess("");

    try {
      // Frontend update for now.
      // Backend update endpoint is not available in your current managerService.js.
      setProject((prev) => ({
        ...prev,
        name: editName.trim(),
        projectName: editName.trim(),
        description: editDescription.trim(),
        projectDescription: editDescription.trim(),
      }));

      setSuccess(
        "Project details updated on this page. To save permanently, backend update API is needed."
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update project."));
    } finally {
      setSavingProject(false);
    }
  };

  const handleAddTask = async () => {
    if (!canAddTask || !project) return;

    setAddingTask(true);
    setError("");
    setSuccess("");

    try {
      const currentProjectId = getProjectId(project, projectId);

      const payload = {
        projectId: Number(currentProjectId),
        title: newTask.title.trim(),
        priority: newTask.priority,
        status: "TODO",
      };

      await createManagerTask(payload);

      setNewTask(emptyTask);
      setSuccess("Task added successfully.");
      await loadProject();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to add task."));
    } finally {
      setAddingTask(false);
    }
  };

  const handleAddFiles = (event) => {
    const selected = Array.from(event.target.files || []);

    if (selected.length === 0) return;

    const mapped = selected.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type || "Unknown",
      addedAt: new Date().toLocaleString(),
    }));

    setFiles((prev) => [...mapped, ...prev]);
    setSuccess("Files added to this page. Backend file upload API is needed to save them permanently.");
    event.target.value = "";
  };

  const handleRemoveFile = (fileId) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1200, mx: "auto", mt: 4, display: "flex", alignItems: "center", gap: 1.5 }}>
        <CircularProgress size={24} />
        <Typography>Loading project details...</Typography>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ maxWidth: 1200, mx: "auto", mt: 4 }}>
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: "#0b1628",
            border: "1px solid rgba(255,120,120,0.35)",
            boxShadow: "none",
          }}
        >
          <Typography sx={{ fontWeight: 900, mb: 1 }}>
            Project not found
          </Typography>
          <Typography sx={{ color: "#94a3b8" }}>
            {error || "This project is not accessible."}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 3, pb: 5 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Manage: {getProjectName(project)}
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8" }}>
            Edit project details, add tasks, and attach project files.
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {success ? <Alert severity="success">{success}</Alert> : null}

        <Paper
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: "#0b1628",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "none",
          }}
        >
          <Typography sx={{ fontWeight: 900, mb: 2 }}>
            Project Overview
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "1fr 1fr 1fr",
              },
              gap: 1.5,
              mb: 2.2,
            }}
          >
            <SummaryCard label="Tasks" value={totalTasks} />
            <SummaryCard label="Done" value={doneTasks} />
            <SummaryCard label="Progress" value={`${progress}%`} />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 1.5,
            }}
          >
            <TextField
              label="Project name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              size="small"
              fullWidth
            />

            <TextField
              label="Project status"
              value={progress === 100 && totalTasks > 0 ? "Completed" : totalTasks > 0 ? "Active" : "Planning"}
              size="small"
              fullWidth
              InputProps={{ readOnly: true }}
            />

            <TextField
              label="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              size="small"
              multiline
              minRows={3}
              fullWidth
              sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}
            />
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              variant="contained"
              disabled={!canSaveProject || savingProject}
              onClick={handleSaveProject}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                bgcolor: "#6d5dfc",
                "&:hover": { bgcolor: "#5b4ee6" },
              }}
            >
              {savingProject ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: "#0b1628",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "none",
          }}
        >
          <Typography sx={{ fontWeight: 900, mb: 2 }}>
            Add New Task
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 180px auto" },
              gap: 1.5,
              alignItems: "center",
            }}
          >
            <TextField
              label="Task title"
              value={newTask.title}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, title: e.target.value }))
              }
              size="small"
              fullWidth
            />

            <TextField
              select
              label="Priority"
              value={newTask.priority}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, priority: e.target.value }))
              }
              size="small"
              fullWidth
            >
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
            </TextField>

            <Button
              variant="contained"
              disabled={!canAddTask || addingTask}
              onClick={handleAddTask}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                bgcolor: "#6d5dfc",
                "&:hover": { bgcolor: "#5b4ee6" },
                minHeight: 40,
              }}
            >
              {addingTask ? "Adding..." : "Add Task"}
            </Button>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: "#0b1628",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "none",
          }}
        >
          <Typography sx={{ fontWeight: 900, mb: 2 }}>
            Tasks
          </Typography>

          {tasks.length === 0 ? (
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              No tasks found in this project.
            </Typography>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 760 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 0.8fr 0.8fr 1fr",
                    gap: 1.5,
                    pb: 1,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {["Task", "Priority", "Status", "Assigned To"].map((heading) => (
                    <Typography
                      key={heading}
                      variant="caption"
                      sx={{
                        color: "#64748b",
                        fontWeight: 900,
                        textTransform: "uppercase",
                      }}
                    >
                      {heading}
                    </Typography>
                  ))}
                </Box>

                {tasks.map((task, index) => {
                  const assignee = getTaskAssignee(task);

                  return (
                    <Box
                      key={getTaskId(task, index)}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1.4fr 0.8fr 0.8fr 1fr",
                        gap: 1.5,
                        alignItems: "center",
                        py: 1.35,
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                        {getTaskTitle(task)}
                      </Typography>

                      <Chip
                        size="small"
                        label={getTaskPriority(task)}
                        sx={{
                          width: "fit-content",
                          bgcolor: "rgba(124,92,255,0.14)",
                          color: "#e5e7eb",
                          border: "1px solid rgba(255,255,255,0.08)",
                          fontWeight: 700,
                        }}
                      />

                      <Chip
                        size="small"
                        label={getTaskStatus(task)}
                        sx={{
                          width: "fit-content",
                          bgcolor: isTaskDone(task)
                            ? "rgba(34,197,94,0.15)"
                            : "rgba(245,158,11,0.12)",
                          color: "#e5e7eb",
                          border: "1px solid rgba(255,255,255,0.08)",
                          fontWeight: 700,
                        }}
                      />

                      <Typography sx={{ color: assignee ? "#cbd5e1" : "#94a3b8", fontSize: 13 }}>
                        {assignee || "Unassigned"}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Paper>

        <Paper
          sx={{
            p: 2.5,
            borderRadius: 3,
            bgcolor: "#0b1628",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "none",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
              mb: 2,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 900 }}>
                Project Files
              </Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.3 }}>
                Add design files, documents, screenshots, or notes for this project.
              </Typography>
            </Box>

            <Button
              component="label"
              variant="outlined"
              sx={{
                textTransform: "none",
                fontWeight: 800,
                color: "#e5e7eb",
                borderColor: "rgba(255,255,255,0.18)",
              }}
            >
              Add Files
              <input
                type="file"
                hidden
                multiple
                onChange={handleAddFiles}
              />
            </Button>
          </Box>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />

          {files.length === 0 ? (
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              No files added yet.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {files.map((file) => (
                <Box
                  key={file.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "1.5fr 0.8fr 0.8fr auto",
                    },
                    gap: 1.5,
                    alignItems: "center",
                    p: 1.4,
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                    {file.name}
                  </Typography>

                  <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
                    {formatFileSize(file.size)}
                  </Typography>

                  <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
                    {file.addedAt}
                  </Typography>

                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRemoveFile(file.id)}
                    sx={{ textTransform: "none", fontWeight: 800 }}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      </Stack>
    </Box>
  );
}

function SummaryCard({ label, value }) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 900, fontSize: 22, mt: 0.3 }}>
        {value}
      </Typography>
    </Box>
  );
}
