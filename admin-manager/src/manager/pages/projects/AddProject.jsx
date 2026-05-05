import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { createProject, getErrorMessage, fetchManagerClients } from "../../../services/managerService";
import ErrorNotice from "/src/components/ui/ErrorNotice.jsx";
import { useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

const emptyTask = {
  title: "",
  description: "",
  priority: "MEDIUM",
  dueDate: "",
  storyPoints: [],
};

const emptyStoryPoint = {
  title: "",
  description: "",
  pointValue: 1,
};

export default function AddProject() {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [tasks, setTasks] = useState([{ ...emptyTask }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");

  const canCreate = useMemo(() => {
    if (!projectName.trim()) return false;
    if (!projectDescription.trim()) return false;
    if (tasks.length === 0) return false;
    return tasks.every((task) => task.title.trim() && task.priority);
  }, [projectDescription, projectName, tasks]);

  const handleAddTask = () => {
    setTasks((prev) => [...prev, { ...emptyTask }]);
  };

  const handleRemoveTask = (index) => {
    setTasks((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleTaskChange = (index, field, value) => {
    setTasks((prev) =>
      prev.map((task, i) => (i === index ? { ...task, [field]: value } : task))
    );
  };

  const handleAddStoryPoint = (taskIndex) => {
    setTasks((prev) =>
      prev.map((task, i) =>
        i === taskIndex
          ? { ...task, storyPoints: [...task.storyPoints, { ...emptyStoryPoint }] }
          : task
      )
    );
  };

  const handleRemoveStoryPoint = (taskIndex, spIndex) => {
    setTasks((prev) =>
      prev.map((task, i) =>
        i === taskIndex
          ? {
              ...task,
              storyPoints: task.storyPoints.filter((_, j) => j !== spIndex),
            }
          : task
      )
    );
  };

  const handleStoryPointChange = (taskIndex, spIndex, field, value) => {
    setTasks((prev) =>
      prev.map((task, i) =>
        i === taskIndex
          ? {
              ...task,
              storyPoints: task.storyPoints.map((sp, j) =>
                j === spIndex ? { ...sp, [field]: value } : sp
              ),
            }
          : task
      )
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!canCreate) {
      setError("Project name, description, and valid task titles are required.");
      return;
    }

    // Validate story points (only if any are added)
    for (const task of tasks) {
      for (const sp of task.storyPoints) {
        if (!sp.title.trim()) {
          setError("Story point title is required if story point is added.");
          return;
        }
        if (sp.pointValue < 1) {
          setError("Story point value must be at least 1.");
          return;
        }
      }
    }

    const payload = {
      name: projectName.trim(),
      description: projectDescription.trim(),
      tasks: tasks.map((task) => ({
        title: task.title.trim(),
        description: task.description.trim(),
        priority: task.priority,
        dueDate: task.dueDate || null,
        storyPoints:
          task.storyPoints.length > 0
            ? task.storyPoints.map((sp) => ({
                title: sp.title.trim(),
                description: sp.description.trim(),
                pointValue: Number(sp.pointValue),
              }))
            : null,
      })),
      clientId: selectedClientId ? Number(selectedClientId) : null,
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await fetchManagerClients();
        if (mounted) setClients(list);
      } catch (err) {
        // ignore client load errors here
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <Box component="form" onSubmit={handleSubmit} autoComplete="off" sx={{ p: { xs: 2, md: 3 } }}>
      <Paper
        sx={{
          mb: 2,
          p: 1.8,
          borderRadius: 2.5,
          border: "1px solid rgba(148,163,184,0.16)",
          background: "rgba(15,23,42,0.68)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}
      >
        <Typography variant="caption" sx={{ color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.4 }}>
          Manager / Projects
        </Typography>
        <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2, mt: 0.3 }}>
          Add Project
        </Typography>
        <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.35 }}>
          Create a project with tasks and optional story points. Developer assignment happens in Manage Project.
        </Typography>
      </Paper>

      {error ? <ErrorNotice message={error} severity="error" sx={{ mb: 2 }} dedupeKey="add-project-error" /> : null}
      {success ? <ErrorNotice message={success} severity="success" sx={{ mb: 2 }} dedupeKey="add-project-success" /> : null}

      <Stack spacing={2}>
        {/* PROJECT DETAILS SECTION */}
        <Paper sx={{ p: 1.6, borderRadius: 2.5, border: "1px solid rgba(148,163,184,0.16)", background: "rgba(15,23,42,0.68)" }}>
          <Typography sx={{ fontWeight: 900, mb: 1.2 }}>Project Details</Typography>
          <Stack spacing={1.2}>
            <TextField
              size="small"
              label="Project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              fullWidth
            />
            <TextField
              size="small"
              label="Project description"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
            <TextField
              select
              size="small"
              label="Assign Client (optional)"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              helperText={clients.length === 0 ? "No clients available" : "Select a client to assign"}
            >
              <MenuItem value="">No client</MenuItem>
              {clients.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>{c.name || c.email}</MenuItem>
              ))}
            </TextField>
          </Stack>
        </Paper>

        {/* TASKS SECTION */}
        <Paper sx={{ p: 1.6, borderRadius: 2.5, border: "1px solid rgba(148,163,184,0.16)", background: "rgba(15,23,42,0.68)" }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 1.5 }}>
            <Box>
              <Typography sx={{ fontWeight: 900 }}>Tasks</Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                Add tasks and optional story points for planning breakdown.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Plus size={16} />}
              onClick={handleAddTask}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Add Task
            </Button>
          </Stack>

          <Stack spacing={2}>
            {tasks.map((task, taskIndex) => (
              <Paper
                key={`task-${taskIndex}`}
                elevation={0}
                sx={{ p: 1.4, borderRadius: 2, border: "1px solid rgba(148,163,184,0.14)", background: "#0f1b2f" }}
              >
                {/* Task header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.2 }}>
                  <Typography sx={{ fontWeight: 700, color: "#cbd5e1" }}>
                    Task {taskIndex + 1}
                  </Typography>
                  <Button
                    color="error"
                    variant="outlined"
                    size="small"
                    disabled={tasks.length <= 1}
                    onClick={() => handleRemoveTask(taskIndex)}
                    startIcon={<Trash2 size={14} />}
                    sx={{ textTransform: "none" }}
                  >
                    Remove
                  </Button>
                </Box>

                {/* Task fields */}
                <Stack spacing={1} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr 0.8fr" }, gap: 1 }}>
                    <TextField
                      size="small"
                      label="Task title"
                      value={task.title}
                      onChange={(e) => handleTaskChange(taskIndex, "title", e.target.value)}
                      fullWidth
                    />
                    <TextField
                      select
                      size="small"
                      label="Priority"
                      value={task.priority}
                      onChange={(e) => handleTaskChange(taskIndex, "priority", e.target.value)}
                    >
                      <MenuItem value="LOW">Low</MenuItem>
                      <MenuItem value="MEDIUM">Medium</MenuItem>
                      <MenuItem value="HIGH">High</MenuItem>
                    </TextField>
                    <TextField
                      size="small"
                      type="date"
                      label="Due date (optional)"
                      value={task.dueDate}
                      onChange={(e) => handleTaskChange(taskIndex, "dueDate", e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>

                  <TextField
                    size="small"
                    label="Task description"
                    value={task.description}
                    onChange={(e) => handleTaskChange(taskIndex, "description", e.target.value)}
                    multiline
                    minRows={2}
                    fullWidth
                  />
                </Stack>

                {/* Story Points subsection */}
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid rgba(148,163,184,0.12)" }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 1 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#cbd5e1" }}>
                        Story Points (Optional)
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                        {task.storyPoints.length} point{task.storyPoints.length !== 1 ? "s" : ""} added
                      </Typography>
                    </Box>
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<Plus size={14} />}
                      onClick={() => handleAddStoryPoint(taskIndex)}
                      sx={{ textTransform: "none", fontWeight: 600, color: "#c4b5fd" }}
                    >
                      Add Story Point
                    </Button>
                  </Stack>

                  {task.storyPoints.length > 0 ? (
                    <Stack spacing={1}>
                      {task.storyPoints.map((sp, spIndex) => (
                        <Paper
                          key={`sp-${spIndex}`}
                          elevation={0}
                          sx={{ p: 1, borderRadius: 1.5, border: "1px solid rgba(124,92,255,0.16)", background: "rgba(124,92,255,0.08)" }}
                        >
                          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 1.2fr 0.4fr auto" }, gap: 0.8, alignItems: "center" }}>
                            <TextField
                              size="small"
                              label="Point title"
                              value={sp.title}
                              onChange={(e) => handleStoryPointChange(taskIndex, spIndex, "title", e.target.value)}
                              placeholder="e.g., Design UI"
                            />
                            <TextField
                              size="small"
                              label="Description"
                              value={sp.description}
                              onChange={(e) => handleStoryPointChange(taskIndex, spIndex, "description", e.target.value)}
                              placeholder="What needs to be done"
                            />
                            <TextField
                              size="small"
                              type="number"
                              label="Points"
                              value={sp.pointValue}
                              onChange={(e) => handleStoryPointChange(taskIndex, spIndex, "pointValue", Math.max(1, parseInt(e.target.value) || 1))}
                              inputProps={{ min: 1, max: 99 }}
                            />
                            <Button
                              color="error"
                              variant="text"
                              size="small"
                              onClick={() => handleRemoveStoryPoint(taskIndex, spIndex)}
                              sx={{ minWidth: "auto", p: 0.5 }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="caption" sx={{ color: "#64748b", fontStyle: "italic" }}>
                      No story points added yet. Story points are optional.
                    </Typography>
                  )}
                </Box>
              </Paper>
            ))}
          </Stack>
        </Paper>

        {/* ACTION BUTTONS */}
        <Stack direction="row" spacing={1}>
          <Button
            type="submit"
            variant="contained"
            disabled={!canCreate || loading}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              bgcolor: "rgba(124,92,255,0.24)",
              color: "#ddd6fe",
              border: "1px solid rgba(124,92,255,0.45)",
              "&:hover": { bgcolor: "rgba(124,92,255,0.32)" },
              "&:disabled": { opacity: 0.5 },
            }}
          >
            {loading ? "Creating..." : "Create Project"}
          </Button>
          <Button
            type="button"
            variant="outlined"
            onClick={() => navigate("/manager/project-management")}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

