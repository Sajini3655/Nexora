import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { createProject, fetchManagerDevelopers, getErrorMessage } from "../../../services/managerService";

const initialTask = {
  title: "",
  description: "",
  priority: "MEDIUM",
  dueDate: "",
  assignedToId: "",
};

export default function AddProject() {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectStatus, setProjectStatus] = useState("Planning");
  const [developers, setDevelopers] = useState([]);
  const [tasks, setTasks] = useState([{ ...initialTask }]);
  const [loading, setLoading] = useState(false);
  const [loadingDevelopers, setLoadingDevelopers] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadDevelopers() {
      try {
        setLoadingDevelopers(true);
        const data = await fetchManagerDevelopers();
        setDevelopers(Array.isArray(data) ? data : []);
      } catch {
        setDevelopers([]);
      } finally {
        setLoadingDevelopers(false);
      }
    }

    loadDevelopers();
  }, []);

  const canCreate = useMemo(() => {
    if (!projectName.trim()) return false;
    if (!projectDescription.trim()) return false;
    if (tasks.length === 0) return false;
    return tasks.every((task) => task.title.trim() && task.priority);
  }, [projectDescription, projectName, tasks]);

  const handleAddTask = () => {
    setTasks((prev) => [...prev, { ...initialTask }]);
  };

  const handleRemoveTask = (index) => {
    setTasks((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleTaskChange = (index, field, value) => {
    setTasks((prev) => prev.map((task, i) => (i === index ? { ...task, [field]: value } : task)));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!canCreate) {
      setError("Project name, description, and valid initial task titles are required.");
      return;
    }

    const payload = {
      name: projectName.trim(),
      description: projectDescription.trim(),
      tasks: tasks.map((task) => ({
        title: task.title.trim(),
        priority: task.priority,
      })),
    };

    try {
      setLoading(true);
      const createdProject = await createProject(payload);
      const createdProjectId = createdProject?.id || createdProject?.projectId;

      setSuccess("Project created successfully.");

      if (createdProjectId) {
        navigate(`/manager/project-management/${createdProjectId}`);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create project."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} autoComplete="off" sx={{ p: { xs: 2, md: 3 } }}>
      <Paper sx={{ mb: 2, p: 1.8, borderRadius: 2.5, border: "1px solid rgba(148,163,184,0.16)", background: "rgba(15,23,42,0.68)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
        <Typography variant="caption" sx={{ color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.4 }}>
          Manager / Projects
        </Typography>
        <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2, mt: 0.3 }}>
          Add Project
        </Typography>
        <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.35 }}>
          Create a project and optional initial tasks. Detailed story points are handled later in Manage Project.
        </Typography>
      </Paper>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {success ? <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert> : null}

      <Alert severity="info" sx={{ mb: 2 }}>
        Initial project creation currently persists task title and priority. Task description, due date, and optional assignee can be finalized in Manage Project.
      </Alert>

      <Stack spacing={2}>
        <Paper sx={{ p: 1.6, borderRadius: 2.5, border: "1px solid rgba(148,163,184,0.16)", background: "rgba(15,23,42,0.68)" }}>
          <Typography sx={{ fontWeight: 900, mb: 1.2 }}>Project Details</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 180px" }, gap: 1.2, mb: 1.2 }}>
            <TextField size="small" label="Project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} fullWidth />
            <TextField size="small" label="Project status" value={projectStatus} onChange={(e) => setProjectStatus(e.target.value)} fullWidth disabled helperText="Shown for planning; backend may not persist this field yet." />
          </Box>
          <TextField size="small" label="Project description" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} multiline minRows={3} fullWidth />
        </Paper>

        <Paper sx={{ p: 1.6, borderRadius: 2.5, border: "1px solid rgba(148,163,184,0.16)", background: "rgba(15,23,42,0.68)" }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 1.2 }}>
            <Box>
              <Typography sx={{ fontWeight: 900 }}>Initial Tasks</Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                Add initial tasks now. Story points are created later in Manage Project.
              </Typography>
            </Box>
            <Button variant="outlined" onClick={handleAddTask}>Add Task</Button>
          </Stack>

          <Stack spacing={1.2}>
            {tasks.map((task, index) => (
              <Paper key={`task-row-${index}`} elevation={0} sx={{ p: 1.2, borderRadius: 2, border: "1px solid rgba(148,163,184,0.14)", background: "#0f1b2f" }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 1.4fr 0.5fr 0.7fr 0.9fr auto" }, gap: 1, alignItems: "center" }}>
                  <TextField size="small" label="Task title" value={task.title} onChange={(e) => handleTaskChange(index, "title", e.target.value)} />
                  <TextField size="small" label="Task description" value={task.description} onChange={(e) => handleTaskChange(index, "description", e.target.value)} />
                  <TextField select size="small" label="Priority" value={task.priority} onChange={(e) => handleTaskChange(index, "priority", e.target.value)}>
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                  </TextField>
                  <TextField
                    size="small"
                    type="date"
                    label="Due date"
                    value={task.dueDate}
                    onChange={(e) => handleTaskChange(index, "dueDate", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    select
                    size="small"
                    label="Optional developer"
                    value={task.assignedToId}
                    onChange={(e) => handleTaskChange(index, "assignedToId", e.target.value)}
                    disabled={loadingDevelopers || developers.length === 0}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {developers.map((dev) => (
                      <MenuItem key={dev.id} value={String(dev.id)}>{dev.name || dev.email || `Developer ${dev.id}`}</MenuItem>
                    ))}
                  </TextField>

                  <Button color="error" variant="outlined" disabled={tasks.length <= 1} onClick={() => handleRemoveTask(index)}>
                    Remove
                  </Button>
                </Box>
              </Paper>
            ))}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Button type="submit" variant="contained" disabled={!canCreate || loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
            <Button type="button" variant="outlined" onClick={() => navigate("/manager/project-management")}>Go to Project Management</Button>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}

