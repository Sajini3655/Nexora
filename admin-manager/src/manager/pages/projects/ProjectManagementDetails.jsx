import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useParams } from "react-router-dom";
import useLiveRefresh from "../../../hooks/useLiveRefresh";
import api from "../../../services/api";
import {
  assignManagerTaskAssignee,
  createManagerTask,
  fetchManagerDevelopers,
  fetchProjectDetails,
  getErrorMessage,
  suggestManagerTaskAssignment,
  updateProject,
  updateManagerTask,
} from "../../../services/managerService";

const emptyTaskForm = {
  title: "",
  description: "",
  priority: "MEDIUM",
  dueDate: "",
  assignedToId: "",
};

const emptyStoryPointForm = {
  title: "",
  description: "",
  pointValue: 1,
};

function toNormalizedStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function isTaskDone(task) {
  const status = toNormalizedStatus(task?.status || task?.taskStatus || task?.state);
  return status === "done" || status === "complete" || status === "completed" || status === "closed" || status === "resolved";
}

function getTaskTitle(task) {
  return task?.title || task?.taskName || task?.name || "Untitled Task";
}

function getTaskDescription(task) {
  return task?.description || task?.taskDescription || "";
}

function getTaskPriority(task) {
  return String(task?.priority || task?.taskPriority || "MEDIUM").toUpperCase();
}

function getTaskStatus(task) {
  return String(task?.status || task?.taskStatus || task?.state || "TODO").toUpperCase();
}

function getTaskAssignee(task) {
  return task?.assignedToName || task?.assigned_to_name || task?.assignedTo?.name || task?.assigneeName || "";
}

function getTaskPointTotals(task) {
  const totalPointValue = Number(task?.totalPointValue ?? task?.estimatedPoints ?? 0);
  const completedPointValue = Number(task?.completedPointValue ?? 0);
  const totalStoryPoints = Number(task?.totalStoryPoints ?? 0);
  const completedStoryPoints = Number(task?.completedStoryPoints ?? 0);

  const safeTotal = totalPointValue > 0 ? totalPointValue : totalStoryPoints;
  const safeCompleted = totalPointValue > 0 ? completedPointValue : completedStoryPoints;
  const progressPercentage = safeTotal > 0 ? Math.round((safeCompleted * 100) / safeTotal) : (isTaskDone(task) ? 100 : 0);

  return {
    totalPointValue,
    completedPointValue,
    totalStoryPoints,
    completedStoryPoints,
    progressPercentage,
  };
}

function getProjectName(project) {
  return project?.name || project?.projectName || "Untitled Project";
}

function getProjectDescription(project) {
  return project?.description || project?.projectDescription || "No description provided.";
}

function getStoryPointLabel(storyPoint) {
  return `${storyPoint?.title || "Untitled"} - ${Number(storyPoint?.pointValue || 0)} pt`;
}

export default function ProjectManagementDetails() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [developers, setDevelopers] = useState([]);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [newTask, setNewTask] = useState(emptyTaskForm);

  const [loading, setLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [savingProjectDetails, setSavingProjectDetails] = useState(false);
  const [addingTask, setAddingTask] = useState(false);

  const [newProjectForm, setNewProjectForm] = useState({ name: "", description: "" });
  const [creatingProject, setCreatingProject] = useState(false);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDraft, setTaskDraft] = useState(null);
  const [selectedDeveloperId, setSelectedDeveloperId] = useState("");
  const [suggestion, setSuggestion] = useState(null);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [savingTaskDetails, setSavingTaskDetails] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestingAddTask, setSuggestingAddTask] = useState(false);
  const [addTaskSuggestion, setAddTaskSuggestion] = useState(null);

  const [storyPoints, setStoryPoints] = useState([]);
  const [storyPointForm, setStoryPointForm] = useState(emptyStoryPointForm);
  const [editingStoryPointId, setEditingStoryPointId] = useState(null);
  const [loadingStoryPoints, setLoadingStoryPoints] = useState(false);
  const [savingStoryPoint, setSavingStoryPoint] = useState(false);
  const [savingAllChanges, setSavingAllChanges] = useState(false);

  const [originalTaskDraft, setOriginalTaskDraft] = useState(null);
  const [originalDeveloperId, setOriginalDeveloperId] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProject = async (background = false) => {
    try {
      if (background) {
        setBackgroundLoading(true);
      } else {
        setLoading(true);
      }
      setError("");

      const [projectData, developersData] = await Promise.all([
        fetchProjectDetails(projectId),
        fetchManagerDevelopers(),
      ]);

      if (!projectData) {
        setProject(null);
        setError("Project not found or not accessible for this manager.");
        return;
      }

      setProject(projectData);
      setDevelopers(Array.isArray(developersData) ? developersData : []);
      setEditProjectName(getProjectName(projectData));
      setEditProjectDescription(getProjectDescription(projectData));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load project details."));
      setProject(null);
    } finally {
      if (background) {
        setBackgroundLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const liveTopics = useMemo(
    () => ["/topic/manager.dashboard", "/topic/tasks", "/topic/projects"],
    []
  );
  useLiveRefresh(liveTopics, () => loadProject(true), { debounceMs: 650 });

  const tasks = useMemo(() => (Array.isArray(project?.tasks) ? project.tasks : []), [project]);

  const projectTotals = useMemo(() => {
    let taskCount = 0;
    let completedTaskCount = 0;
    let totalPointValue = 0;
    let completedPointValue = 0;

    tasks.forEach((task) => {
      const totals = getTaskPointTotals(task);
      taskCount += 1;
      completedTaskCount += isTaskDone(task) ? 1 : 0;
      totalPointValue += totals.totalPointValue;
      completedPointValue += totals.completedPointValue;
    });

    const weightedProgress = totalPointValue > 0
      ? Math.round((completedPointValue * 100) / totalPointValue)
      : (taskCount > 0 ? Math.round((completedTaskCount * 100) / taskCount) : 0);

    const status = taskCount === 0 ? "Planning" : weightedProgress === 100 ? "Completed" : "Active";

    return {
      taskCount,
      completedTaskCount,
      totalPointValue,
      completedPointValue,
      weightedProgress,
      status,
    };
  }, [tasks]);

  const canAddTask = Boolean(newTask.title.trim() && newTask.priority);

  const canSaveStoryPoint = Boolean(
    selectedTask?.id &&
      storyPointForm.title.trim() &&
      Number(storyPointForm.pointValue) > 0
  );

  const openTaskModal = async (task) => {
    setTaskModalOpen(true);
    setSelectedTask(task);
    const newTaskDraft = {
      title: getTaskTitle(task),
      description: getTaskDescription(task),
      priority: getTaskPriority(task),
      dueDate: task?.dueDate || "",
      status: getTaskStatus(task),
    };
    setTaskDraft(newTaskDraft);
    setOriginalTaskDraft(JSON.parse(JSON.stringify(newTaskDraft)));
    const devId = String(task?.assignedToId || "");
    setSelectedDeveloperId(devId);
    setOriginalDeveloperId(devId);
    setSuggestion(null);
    setStoryPointForm(emptyStoryPointForm);
    setEditingStoryPointId(null);
    await loadStoryPoints(task.id);
  };

  const closeTaskModal = () => {
    if (savingAssignment || savingStoryPoint || savingAllChanges) return;
    setTaskModalOpen(false);
    setSelectedTask(null);
    setTaskDraft(null);
    setOriginalTaskDraft(null);
    setSelectedDeveloperId("");
    setOriginalDeveloperId("");
    setSuggestion(null);
    setStoryPoints([]);
    setStoryPointForm(emptyStoryPointForm);
    setEditingStoryPointId(null);
    // Reload project to ensure developer dashboard reflects latest changes
    loadProject();
  };

  const hasUnsavedChanges = () => {
    if (!selectedTask || !originalTaskDraft) return false;
    
    const taskDetailsChanged = 
      taskDraft?.title !== originalTaskDraft.title ||
      taskDraft?.description !== originalTaskDraft.description ||
      taskDraft?.priority !== originalTaskDraft.priority ||
      taskDraft?.dueDate !== originalTaskDraft.dueDate ||
      taskDraft?.status !== originalTaskDraft.status;
    
    const developerChanged = selectedDeveloperId !== originalDeveloperId;
    
    return taskDetailsChanged || developerChanged;
  };

  const handleSaveAllChanges = async () => {
    if (!selectedTask || !selectedTask.id || savingAllChanges) return;

    setSavingAllChanges(true);
    setError("");
    setSuccess("");

    try {
      const savePromises = [];

      // Save task details if changed
      const taskDetailsChanged = 
        taskDraft?.title !== originalTaskDraft?.title ||
        taskDraft?.description !== originalTaskDraft?.description ||
        taskDraft?.priority !== originalTaskDraft?.priority ||
        taskDraft?.dueDate !== originalTaskDraft?.dueDate ||
        taskDraft?.status !== originalTaskDraft?.status;

      if (taskDetailsChanged) {
        savePromises.push(
          updateManagerTask(Number(selectedTask.id), {
            title: (taskDraft?.title || "").trim(),
            description: taskDraft?.description || "",
            priority: (taskDraft?.priority || "MEDIUM").toUpperCase(),
            dueDate: taskDraft?.dueDate || null,
            status: (taskDraft?.status || "TODO").toUpperCase(),
          })
        );
      }

      // Save developer assignment if changed
      const developerChanged = selectedDeveloperId !== originalDeveloperId;
      if (developerChanged && selectedDeveloperId) {
        savePromises.push(
          assignManagerTaskAssignee(Number(selectedTask.id), Number(selectedDeveloperId))
        );
      }

      // Wait for all saves to complete
      if (savePromises.length > 0) {
        await Promise.all(savePromises);
      }

      setSuccess("All changes saved successfully.");
      setOriginalTaskDraft(JSON.parse(JSON.stringify(taskDraft)));
      setOriginalDeveloperId(selectedDeveloperId);
      
      // Single reload after all saves are done
      await loadProject();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save changes."));
    } finally {
      setSavingAllChanges(false);
    }
  };

  const loadStoryPoints = async (taskId) => {
    if (!taskId) {
      setStoryPoints([]);
      return;
    }

    setLoadingStoryPoints(true);
    try {
      const response = await api.get(`/tasks/${taskId}/story-points`);
      setStoryPoints(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load story points."));
      setStoryPoints([]);
    } finally {
      setLoadingStoryPoints(false);
    }
  };

  const handleSaveProjectDetails = async () => {
    setSavingProjectDetails(true);
    setError("");
    setSuccess("");

    try {
      const updated = await updateProject(Number(projectId), {
        name: editProjectName.trim(),
        description: editProjectDescription.trim(),
      });

      setProject((prev) => ({
        ...prev,
        name: updated.name,
        projectName: updated.name,
        description: updated.description,
        projectDescription: updated.description,
      }));

      setEditProjectName(updated.name);
      setEditProjectDescription(updated.description);
      setSuccess("Project details updated successfully.");
      setNewProjectForm({ name: "", description: "" });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save project details."));
    } finally {
      setSavingProjectDetails(false);
    }
  };

  const handleCreateNewProject = async () => {
    if (!newProjectForm.name.trim()) {
      setError("Project name is required.");
      return;
    }

    setCreatingProject(true);
    setError("");
    setSuccess("");

    try {
      const created = await api.post("/projects", {
        name: newProjectForm.name.trim(),
        description: newProjectForm.description.trim() || null,
      });

      setSuccess("New project created successfully!");
      setNewProjectForm({ name: "", description: "" });
      
      // Navigate to the new project after a short delay
      setTimeout(() => {
        window.location.href = `/admin/projects/${created.id}`;
      }, 800);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create project."));
    } finally {
      setCreatingProject(false);
    }
  };

  const handleAddTask = async () => {
    if (!project || !canAddTask) return;

    setAddingTask(true);
    setError("");
    setSuccess("");

    try {
      await createManagerTask({
        projectId: Number(projectId),
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        priority: newTask.priority,
        dueDate: newTask.dueDate || null,
        assignedToId: newTask.assignedToId ? Number(newTask.assignedToId) : null,
        status: "TODO",
      });

      setNewTask(emptyTaskForm);
      setAddTaskSuggestion(null);
      setSuccess("Task added successfully.");
      await loadProject();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to add task."));
    } finally {
      setAddingTask(false);
    }
  };

  const handleSuggestAssigneeForAddTask = async () => {
    if (!newTask.title.trim()) {
      setError("Enter a task title before getting AI suggestion.");
      return;
    }

    setSuggestingAddTask(true);
    setError("");
    setAddTaskSuggestion(null);

    try {
      const result = await suggestManagerTaskAssignment({
        title: newTask.title.trim(),
        description: newTask.description.trim() || "",
        estimatedPoints: 0, // No story points yet for new tasks
      });

      setAddTaskSuggestion(result || null);
      const recommendedId = result?.recommendedDeveloper?.id;
      if (recommendedId) {
        setNewTask((prev) => ({ ...prev, assignedToId: String(recommendedId) }));
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to get AI suggestion."));
    } finally {
      setSuggestingAddTask(false);
    }
  };

  const handleSuggestAssignee = async () => {
    if (!selectedTask) return;

    setSuggesting(true);
    setError("");
    setSuggestion(null);

    try {
      const totalFromStoryPoints = storyPoints.reduce((sum, row) => sum + Number(row?.pointValue || 0), 0);
      const result = await suggestManagerTaskAssignment({
        title: taskDraft?.title || getTaskTitle(selectedTask),
        description: taskDraft?.description || getTaskDescription(selectedTask),
        estimatedPoints: totalFromStoryPoints > 0 ? totalFromStoryPoints : Number(selectedTask?.estimatedPoints || 0),
      });

      setSuggestion(result || null);
      const recommendedId = result?.recommendedDeveloper?.id;
      if (recommendedId) {
        setSelectedDeveloperId(String(recommendedId));
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to get AI suggestion."));
    } finally {
      setSuggesting(false);
    }
  };

  const handleSaveAssignment = async () => {
    if (!selectedTask || !selectedDeveloperId) {
      setError("Select a developer before saving assignment.");
      return;
    }

    setSavingAssignment(true);
    setError("");
    setSuccess("");

    try {
      await assignManagerTaskAssignee(Number(selectedTask.id), Number(selectedDeveloperId));
      setSuccess("Task assignment updated.");
      await loadProject();
      const refreshedTask = (Array.isArray(project?.tasks) ? project.tasks : []).find((task) => String(task.id) === String(selectedTask.id));
      if (refreshedTask) {
        setSelectedTask(refreshedTask);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save assignment."));
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleSaveTaskDetails = async () => {
    if (!selectedTask || !selectedTask.id) return;

    setError("");
    setSuccess("");
    setSavingTaskDetails(true);

    try {
      const taskTitle = (taskDraft?.title || getTaskTitle(selectedTask) || "").trim();
      const taskDescription = taskDraft?.description || getTaskDescription(selectedTask) || "";
      const taskPriority = (taskDraft?.priority || getTaskPriority(selectedTask) || "MEDIUM").toUpperCase();
      const taskDueDate = taskDraft?.dueDate || selectedTask?.dueDate || null;
      const taskStatus = (taskDraft?.status || getTaskStatus(selectedTask) || "TODO").toUpperCase();

      const updated = await updateManagerTask(Number(selectedTask.id), {
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        dueDate: taskDueDate,
        status: taskStatus,
      });

      setTaskDraft({});
      setSuccess("Task details updated successfully.");
      await loadProject();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save task details."));
    } finally {
      setSavingTaskDetails(false);
    }
  };

  const handleCreateStoryPoint = async () => {
    if (!canSaveStoryPoint || !selectedTask) return;

    setSavingStoryPoint(true);
    setError("");
    setSuccess("");

    try {
      await api.post(`/tasks/${selectedTask.id}/story-points`, {
        title: storyPointForm.title.trim(),
        description: storyPointForm.description.trim() || null,
        pointValue: Number(storyPointForm.pointValue),
      });

      setStoryPointForm(emptyStoryPointForm);
      setSuccess("Story point added.");
      await loadStoryPoints(selectedTask.id);
      // Don't reload project here - let user save all changes at once
    } catch (err) {
      setError(getErrorMessage(err, "Failed to add story point."));
    } finally {
      setSavingStoryPoint(false);
    }
  };

  const handleStartEditStoryPoint = (storyPoint) => {
    setEditingStoryPointId(storyPoint.id);
    setStoryPointForm({
      title: storyPoint.title || "",
      description: storyPoint.description || "",
      pointValue: Number(storyPoint.pointValue || 1),
    });
  };

  const handleSaveEditedStoryPoint = async () => {
    if (!editingStoryPointId || !canSaveStoryPoint || !selectedTask) return;

    setSavingStoryPoint(true);
    setError("");
    setSuccess("");

    try {
      await api.put(`/story-points/${editingStoryPointId}`, {
        title: storyPointForm.title.trim(),
        description: storyPointForm.description.trim() || null,
        pointValue: Number(storyPointForm.pointValue),
      });

      setEditingStoryPointId(null);
      setStoryPointForm(emptyStoryPointForm);
      setSuccess("Story point updated.");
      await loadStoryPoints(selectedTask.id);
      // Don't reload project here - let user save all changes at once
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update story point."));
    } finally {
      setSavingStoryPoint(false);
    }
  };

  const handleDeleteStoryPoint = async (storyPointId) => {
    if (!selectedTask) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/story-points/${storyPointId}`);
      setSuccess("Story point deleted.");
      await loadStoryPoints(selectedTask.id);
      // Don't reload project here - let user save all changes at once
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete story point."));
    }
  };

  const handleCancelStoryPointEdit = () => {
    setEditingStoryPointId(null);
    setStoryPointForm(emptyStoryPointForm);
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
        <Alert severity="error">{error || "Project not found."}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Paper sx={{ mb: 2, p: 1.8, borderRadius: 2.5, border: "1px solid rgba(148,163,184,0.16)", background: "rgba(15,23,42,0.68)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
        <Typography variant="caption" sx={{ color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.4 }}>
          Manager / Projects
        </Typography>
        <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2, mt: 0.3 }}>
          Manage Project
        </Typography>
        <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.35 }}>
          Main workflow for task management, story points, and developer assignment.
        </Typography>
      </Paper>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {success ? <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert> : null}

      <Stack spacing={2}>
        <Paper sx={{ p: 1.6, borderRadius: 2.5, border: "1px solid rgba(148,163,184,0.16)", background: "rgba(15,23,42,0.68)" }}>
          <Typography sx={{ fontWeight: 900, mb: 1.2 }}>Project Overview</Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 1, mb: 1.2 }}>
            <Metric label="Project" value={getProjectName(project)} />
            <Metric label="Status" value={projectTotals.status} />
            <Metric label="Weighted Progress" value={`${projectTotals.weightedProgress}%`} />
            <Metric label="Tasks" value={`${projectTotals.completedTaskCount}/${projectTotals.taskCount}`} />
            <Metric label="Weighted Points" value={`${projectTotals.completedPointValue}/${projectTotals.totalPointValue}`} />
            <Metric label="Description" value={getProjectDescription(project)} />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" }, gap: 1, alignItems: "center" }}>
            <TextField size="small" label="Project name" value={editProjectName} onChange={(e) => setEditProjectName(e.target.value)} />
            <TextField size="small" label="Project description" value={editProjectDescription} onChange={(e) => setEditProjectDescription(e.target.value)} />
            <Button variant="outlined" disabled={savingProjectDetails} onClick={handleSaveProjectDetails}>
              {savingProjectDetails ? "Saving..." : "Save Project Details"}
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 1.6, borderRadius: 2.5, border: "1px solid rgba(148,163,184,0.16)", background: "rgba(15,23,42,0.68)" }}>
          <Typography sx={{ fontWeight: 900, mb: 1.2 }}>Add New Task</Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.05fr 1.2fr 0.55fr 0.7fr 0.9fr auto" }, gap: 1, alignItems: "center", mb: 1.2 }}>
            <TextField size="small" label="Task title" value={newTask.title} onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))} />
            <TextField size="small" label="Task description" value={newTask.description} onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))} />
            <TextField select size="small" label="Priority" value={newTask.priority} onChange={(e) => setNewTask((prev) => ({ ...prev, priority: e.target.value }))}>
              <MenuItem value="LOW">Low</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HIGH">High</MenuItem>
            </TextField>
            <TextField
              size="small"
              label="Due date"
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              size="small"
              label="Optional developer"
              value={newTask.assignedToId}
              onChange={(e) => setNewTask((prev) => ({ ...prev, assignedToId: e.target.value }))}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {developers.map((dev) => (
                <MenuItem key={dev.id} value={String(dev.id)}>{dev.name || dev.email || `Developer ${dev.id}`}</MenuItem>
              ))}
            </TextField>

            <Button variant="contained" disabled={!canAddTask || addingTask} onClick={handleAddTask}>
              {addingTask ? "Adding..." : "Add Task"}
            </Button>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "auto auto auto" }, gap: 1, alignItems: "center" }}>
            <Button variant="outlined" size="small" onClick={handleSuggestAssigneeForAddTask} disabled={suggestingAddTask || !newTask.title.trim()}>
              {suggestingAddTask ? "Suggesting..." : "AI Suggest Developer"}
            </Button>
          </Box>

          {addTaskSuggestion?.recommendedDeveloper ? (
            <Box sx={{ mt: 1.2, p: 1, borderRadius: 1.5, border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.1)" }}>
              <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
                Suggested: {addTaskSuggestion.recommendedDeveloper.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "#cbd5e1" }}>
                Confidence: {addTaskSuggestion.confidence ?? "-"}% {addTaskSuggestion.explanation ? `- ${addTaskSuggestion.explanation}` : ""}
              </Typography>
            </Box>
          ) : null}
        </Paper>

        <Paper sx={{ p: 1.6, borderRadius: 2.5, border: "1px solid rgba(148,163,184,0.16)", background: "rgba(15,23,42,0.68)" }}>
          <Typography sx={{ fontWeight: 900, mb: 1.2 }}>Task List</Typography>

          {tasks.length === 0 ? (
            <Typography variant="body2" sx={{ color: "#94a3b8" }}>
              No tasks found in this project.
            </Typography>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 960 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1.2fr 1.15fr 0.55fr 0.55fr 0.85fr 0.7fr 0.85fr 0.65fr 0.7fr", gap: 1, py: 0.8, borderBottom: "1px solid rgba(148,163,184,0.16)" }}>
                  {["Task", "Description", "Priority", "Status", "Assigned", "Story Points", "Weighted", "Progress", "Action"].map((header) => (
                    <Typography key={header} variant="caption" sx={{ color: "#64748b", textTransform: "uppercase", fontWeight: 800 }}>
                      {header}
                    </Typography>
                  ))}
                </Box>

                {tasks.map((task) => {
                  const totals = getTaskPointTotals(task);
                  return (
                    <Box key={task.id} sx={{ display: "grid", gridTemplateColumns: "1.2fr 1.15fr 0.55fr 0.55fr 0.85fr 0.7fr 0.85fr 0.65fr 0.7fr", gap: 1, py: 1, borderBottom: "1px solid rgba(148,163,184,0.12)", alignItems: "center" }}>
                      <Typography sx={{ fontWeight: 800, fontSize: 14 }} noWrap>{getTaskTitle(task)}</Typography>
                      <Typography variant="caption" sx={{ color: "#94a3b8" }} noWrap>{getTaskDescription(task) || "-"}</Typography>
                      <Typography variant="body2" sx={{ color: "#cbd5e1" }}>{getTaskPriority(task)}</Typography>
                      <Typography variant="body2" sx={{ color: "#cbd5e1" }}>{getTaskStatus(task)}</Typography>
                      <Typography variant="body2" sx={{ color: "#cbd5e1" }}>{getTaskAssignee(task) || "Unassigned"}</Typography>
                      <Typography variant="body2" sx={{ color: "#cbd5e1" }}>{totals.completedStoryPoints}/{totals.totalStoryPoints}</Typography>
                      <Typography variant="body2" sx={{ color: "#cbd5e1" }}>{totals.completedPointValue}/{totals.totalPointValue}</Typography>
                      <Box>
                        <Typography variant="caption" sx={{ color: "#cbd5e1" }}>{totals.progressPercentage}%</Typography>
                        <LinearProgress variant="determinate" value={totals.progressPercentage} sx={{ mt: 0.35, height: 6, borderRadius: 999, bgcolor: "rgba(255,255,255,0.08)" }} />
                      </Box>
                      <Button size="small" variant="outlined" onClick={() => openTaskModal(task)}>
                        Manage Task
                      </Button>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 1.6, borderRadius: 2.5, border: "1px solid rgba(148,163,184,0.16)", background: "rgba(15,23,42,0.68)" }}>
          <Typography sx={{ fontWeight: 900, mb: 1.2 }}>Create New Project</Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mb: 1.2 }}>
            After managing this project, you can quickly create another one below.
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1.5fr auto" }, gap: 1, alignItems: "center" }}>
            <TextField
              size="small"
              label="Project name"
              value={newProjectForm.name}
              onChange={(e) => setNewProjectForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Mobile App Redesign"
            />
            <TextField
              size="small"
              label="Project description"
              value={newProjectForm.description}
              onChange={(e) => setNewProjectForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
            />
            <Button
              variant="contained"
              disabled={creatingProject || !newProjectForm.name.trim()}
              onClick={handleCreateNewProject}
              sx={{ height: "40px" }}
            >
              {creatingProject ? "Creating..." : "Create Project"}
            </Button>
          </Box>
        </Paper>
      </Stack>

      {backgroundLoading && (
        <Box sx={{ position: "fixed", top: 16, right: 16, display: "flex", alignItems: "center", gap: 1, bgcolor: "rgba(15,23,42,0.9)", p: 1, borderRadius: 1, border: "1px solid rgba(148,163,184,0.16)" }}>
          <CircularProgress size={16} />
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>Updating...</Typography>
        </Box>
      )}

      <Dialog open={taskModalOpen} onClose={closeTaskModal} fullWidth maxWidth="lg">
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
              Manage Task: {taskDraft?.title || "Task"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              Task details, developer assignment, and story points
            </Typography>
          </Box>
          <IconButton onClick={closeTaskModal}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <Paper sx={{ p: 1.4, borderRadius: 2, border: "1px solid rgba(148,163,184,0.16)", background: "rgba(15,23,42,0.64)" }}>
              <Typography sx={{ fontWeight: 900, mb: 1 }}>Task Details</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1 }}>
                <TextField size="small" label="Title" value={taskDraft?.title || ""} onChange={(e) => setTaskDraft((prev) => ({ ...prev, title: e.target.value }))} />
                <TextField size="small" label="Due date" type="date" InputLabelProps={{ shrink: true }} value={taskDraft?.dueDate || ""} onChange={(e) => setTaskDraft((prev) => ({ ...prev, dueDate: e.target.value }))} />
                <TextField size="small" select label="Priority" value={taskDraft?.priority || "MEDIUM"} onChange={(e) => setTaskDraft((prev) => ({ ...prev, priority: e.target.value }))}>
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                </TextField>
                <TextField size="small" select label="Status" value={taskDraft?.status || "TODO"} onChange={(e) => setTaskDraft((prev) => ({ ...prev, status: e.target.value }))}>
                  <MenuItem value="TODO">TODO</MenuItem>
                  <MenuItem value="IN_PROGRESS">IN_PROGRESS</MenuItem>
                  <MenuItem value="COMPLETED">COMPLETED</MenuItem>
                </TextField>
                <TextField size="small" label="Description" value={taskDraft?.description || ""} onChange={(e) => setTaskDraft((prev) => ({ ...prev, description: e.target.value }))} multiline minRows={2} sx={{ gridColumn: { xs: "1", md: "1 / -1" } }} />
              </Box>

              <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
                <Button variant="outlined" onClick={handleSaveTaskDetails}>Save Task Details</Button>
              </Box>
            </Paper>

            <Paper sx={{ p: 1.4, borderRadius: 2, border: "1px solid rgba(148,163,184,0.16)", background: "rgba(15,23,42,0.64)" }}>
              <Typography sx={{ fontWeight: 900, mb: 1 }}>Developer Assignment</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr auto auto" }, gap: 1, alignItems: "center" }}>
                <TextField
                  size="small"
                  select
                  label="Assigned developer"
                  value={selectedDeveloperId}
                  onChange={(e) => setSelectedDeveloperId(e.target.value)}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {developers.map((dev) => (
                    <MenuItem key={dev.id} value={String(dev.id)}>{dev.name || dev.email || `Developer ${dev.id}`}</MenuItem>
                  ))}
                </TextField>

                <Button variant="outlined" onClick={handleSuggestAssignee} disabled={suggesting}>
                  {suggesting ? "Suggesting..." : "AI Suggest Best Developer"}
                </Button>

                <Button variant="contained" onClick={handleSaveAssignment} disabled={savingAssignment}>
                  {savingAssignment ? "Saving..." : "Save Assignment"}
                </Button>
              </Box>

              {suggestion?.recommendedDeveloper ? (
                <Box sx={{ mt: 1.2, p: 1, borderRadius: 1.5, border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.1)" }}>
                  <Typography sx={{ fontWeight: 800 }}>
                    Suggested: {suggestion.recommendedDeveloper.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#cbd5e1" }}>
                    Confidence: {suggestion.confidence ?? "-"}% {suggestion.explanation ? `- ${suggestion.explanation}` : ""}
                  </Typography>
                </Box>
              ) : null}
            </Paper>

            <Paper sx={{ p: 1.4, borderRadius: 2, border: "1px solid rgba(148,163,184,0.16)", background: "rgba(15,23,42,0.64)" }}>
              <Typography sx={{ fontWeight: 900, mb: 1 }}>Story Points</Typography>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1.2fr 0.4fr auto" }, gap: 1, alignItems: "center", mb: 1 }}>
                <TextField size="small" label="Title" value={storyPointForm.title} onChange={(e) => setStoryPointForm((prev) => ({ ...prev, title: e.target.value }))} />
                <TextField size="small" label="Description" value={storyPointForm.description} onChange={(e) => setStoryPointForm((prev) => ({ ...prev, description: e.target.value }))} />
                <TextField
                  size="small"
                  type="number"
                  inputProps={{ min: 1 }}
                  label="Point"
                  value={storyPointForm.pointValue}
                  onChange={(e) => setStoryPointForm((prev) => ({ ...prev, pointValue: Math.max(1, Number(e.target.value) || 1) }))}
                />

                {editingStoryPointId ? (
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" onClick={handleSaveEditedStoryPoint} disabled={!canSaveStoryPoint || savingStoryPoint}>Save</Button>
                    <Button variant="outlined" onClick={handleCancelStoryPointEdit}>Cancel</Button>
                  </Stack>
                ) : (
                  <Button variant="contained" onClick={handleCreateStoryPoint} disabled={!canSaveStoryPoint || savingStoryPoint}>Add Story Point</Button>
                )}
              </Box>

              <Divider sx={{ my: 1 }} />

              {loadingStoryPoints ? (
                <Typography variant="body2" sx={{ color: "#94a3b8" }}>Loading story points...</Typography>
              ) : storyPoints.length === 0 ? (
                <Typography variant="body2" sx={{ color: "#94a3b8" }}>No story points yet.</Typography>
              ) : (
                <Stack spacing={0.8}>
                  {storyPoints.map((row) => (
                    <Box key={row.id} sx={{ p: 1, borderRadius: 1.5, border: "1px solid rgba(148,163,184,0.14)", background: "#0f1b2f", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{getStoryPointLabel(row)}</Typography>
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                          {row.description || "No description"} - {String(row.status || "TODO").toUpperCase()}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={() => handleStartEditStoryPoint(row)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteStoryPoint(row.id)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeTaskModal} disabled={hasUnsavedChanges() || savingAllChanges}>
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSaveAllChanges} 
            disabled={!hasUnsavedChanges() || savingAllChanges}
          >
            {savingAllChanges ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function Metric({ label, value }) {
  return (
    <Box sx={{ p: 1, borderRadius: 1.5, border: "1px solid rgba(148,163,184,0.14)", background: "#0f1b2f" }}>
      <Typography variant="caption" sx={{ color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.3, fontWeight: 800, color: "#e5e7eb" }}>
        {value}
      </Typography>
    </Box>
  );
}





