import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import api from "../../../services/api";
import { useAuth } from "../../../context/AuthContext.jsx";
import ChatBox from "../../../dev/pages/chat/src/ChatBox";
import { getProjectSessions } from "../../../dev/pages/chat/src/api";
import {
  assignManagerTaskAssignee,
  createManagerTask,
  getErrorMessage,
  suggestManagerTaskAssignment,
  updateProject,
  updateManagerTask,
  fetchManagerClients,
} from "../../../services/managerService";
import {
  getManagerQueryScope,
  managerKeys,
  useProjectDetails,
  useManagerDevelopers,
} from "../../data/useManager";
import ErrorNotice from "/src/components/ui/ErrorNotice.jsx";
import useLiveRefresh from "../../../hooks/useLiveRefresh";

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

function formatChatTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSessionSortTime(session) {
  const value = session?.endedAt || session?.createdAt || session?.startedAt || 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function buildSummaryPreview(session) {
  const summary = String(session?.summary || session?.lastMessagePreview || "").trim();
  if (!summary) return "No summary available yet.";
  return summary.length > 160 ? `${summary.substring(0, 160)}...` : summary;
}

export default function ProjectManagementDetails() {
  const { projectId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const managerScope = getManagerQueryScope(user);
  const currentUserId = user?.id != null ? String(user.id) : "";
  const currentUserName = user?.name || user?.email || "Manager";

  const projectDetailsQuery = useProjectDetails(projectId, !authLoading);
  const developersQuery = useManagerDevelopers();

  const project = projectDetailsQuery.data;
  const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
  const developers = Array.isArray(developersQuery.data) ? developersQuery.data : [];
  const loading = projectDetailsQuery.isLoading || developersQuery.isLoading;
  const queryError = projectDetailsQuery.error?.message || developersQuery.error?.message || "";

  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [newTask, setNewTask] = useState(emptyTaskForm);
  const [actionError, setActionError] = useState("");

  const [savingProjectDetails, setSavingProjectDetails] = useState(false);
  const [addingTask, setAddingTask] = useState(false);

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

  const [success, setSuccess] = useState("");

  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [chatListLoading, setChatListLoading] = useState(false);
  const [chatListError, setChatListError] = useState("");
  const [sessions, setSessions] = useState([]);

  const backgroundLoading =
    savingProjectDetails ||
    addingTask ||
    savingAssignment ||
    savingTaskDetails ||
    savingStoryPoint ||
    savingAllChanges ||
    loadingStoryPoints ||
    chatListLoading;

  useEffect(() => {
    if (project && !editProjectName) {
      setEditProjectName(getProjectName(project));
      setEditProjectDescription(getProjectDescription(project));
      setSelectedClientId(project?.clientId ? String(project.clientId) : "");
    }
  }, [project, editProjectName]);

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

  const loadProjectSessions = useCallback(async () => {
    if (!projectId || authLoading) return;

    try {
      setChatListLoading(true);
      setChatListError("");

      const allSessions = await getProjectSessions(String(projectId));
      setSessions(Array.isArray(allSessions) ? allSessions : []);
    } catch (err) {
      const aborted =
        err?.name === "AbortError" ||
        String(err?.message || "").toLowerCase().includes("aborted");

      if (!aborted) {
        setChatListError(err?.message || "Failed to load chat sessions.");
      }
    } finally {
      setChatListLoading(false);
    }
  }, [projectId, authLoading]);

  useEffect(() => {
    loadProjectSessions();
  }, [loadProjectSessions]);

  const liveTopics = useMemo(
    () => ["/topic/projects", projectId ? `/topic/projects/${projectId}/sessions` : null].filter(Boolean),
    [projectId]
  );
  useLiveRefresh(liveTopics, loadProjectSessions, { debounceMs: 800 });

  const activeSessions = useMemo(
    () => sessions.filter((session) => !session.ended),
    [sessions]
  );

  const endedSessions = useMemo(
    () => sessions.filter((session) => Boolean(session.ended)),
    [sessions]
  );

  const recentSummaries = useMemo(() => {
    return sessions
      .filter((session) => Boolean(session.ended) && Boolean(session.summary))
      .sort((a, b) => getSessionSortTime(b) - getSessionSortTime(a))
      .slice(0, 5);
  }, [sessions]);

  const releaseFocusedElement = () => {
    const activeElement = document.activeElement;
    if (activeElement && typeof activeElement.blur === "function") {
      activeElement.blur();
    }
  };

  const handleOpenSession = (sessionId) => {
    releaseFocusedElement();
    setSelectedSessionId(String(sessionId));
    setChatDrawerOpen(true);
  };

  const handleOpenNewChat = () => {
    releaseFocusedElement();
    setSelectedSessionId(null);
    setChatDrawerOpen(true);
  };

  const handleChatEnd = useCallback(() => {
    setSelectedSessionId(null);
    loadProjectSessions();
  }, [loadProjectSessions]);

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
    projectDetailsQuery.refetch();
    developersQuery.refetch();
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
    setActionError("");
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
      projectDetailsQuery.refetch();
      developersQuery.refetch();
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to save changes."));
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
      setActionError(getErrorMessage(err, "Failed to load story points."));
      setStoryPoints([]);
    } finally {
      setLoadingStoryPoints(false);
    }
  };

  const handleSaveProjectDetails = async () => {
    setSavingProjectDetails(true);
    setActionError("");
    setSuccess("");

    try {
      const updated = await updateProject(Number(projectId), {
        name: editProjectName.trim(),
        description: editProjectDescription.trim(),
        clientId: selectedClientId ? Number(selectedClientId) : null,
      });

      setEditProjectName(updated.name);
      setEditProjectDescription(updated.description);
      setSuccess("Project details updated successfully.");
      await projectDetailsQuery.refetch();
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to save project details."));
    } finally {
      setSavingProjectDetails(false);
    }
  };

  const handleAddTask = async () => {
    if (!project || !canAddTask) return;

    const numericProjectId = Number(project?.id ?? project?.projectId ?? projectId);
    if (!Number.isFinite(numericProjectId) || numericProjectId <= 0) {
      setActionError("Invalid project id. Reload this page from Project Management and try again.");
      return;
    }

    setAddingTask(true);
    setActionError("");
    setSuccess("");

    try {
      const createdTask = await createManagerTask({
        projectId: numericProjectId,
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

      if (managerScope) {
        const tasksKey = managerKeys.tasks(managerScope);
        queryClient.setQueryData(tasksKey, (prev) => {
          const existing = Array.isArray(prev) ? prev : [];

          if (!createdTask || createdTask?.id == null) {
            return existing;
          }

          const createdTaskId = String(createdTask.id);
          const alreadyExists = existing.some((task) => String(task?.id) === createdTaskId);
          if (alreadyExists) {
            return existing;
          }

          return [
            {
              ...createdTask,
              projectId: createdTask.projectId ?? numericProjectId,
              projectName: createdTask.projectName ?? getProjectName(project),
            },
            ...existing,
          ];
        });

        await queryClient.invalidateQueries({ queryKey: tasksKey, exact: true });
      }

      await Promise.all([
        projectDetailsQuery.refetch(),
        developersQuery.refetch(),
      ]);
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to add task."));
    } finally {
      setAddingTask(false);
    }
  };

  const handleSuggestAssigneeForAddTask = async () => {
    if (!newTask.title.trim()) {
      setActionError("Enter a task title before getting AI suggestion.");
      return;
    }

    setSuggestingAddTask(true);
    setActionError("");
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
      setActionError(getErrorMessage(err, "Failed to get AI suggestion."));
    } finally {
      setSuggestingAddTask(false);
    }
  };

  const handleSuggestAssignee = async () => {
    if (!selectedTask) return;

    setSuggesting(true);
    setActionError("");
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
      setActionError(getErrorMessage(err, "Failed to get AI suggestion."));
    } finally {
      setSuggesting(false);
    }
  };

  const handleSaveAssignment = async () => {
    if (!selectedTask || !selectedDeveloperId) {
      setActionError("Select a developer before saving assignment.");
      return;
    }

    setSavingAssignment(true);
    setActionError("");
    setSuccess("");

    try {
      await assignManagerTaskAssignee(Number(selectedTask.id), Number(selectedDeveloperId));
      setSuccess("Task assignment updated.");
      await projectDetailsQuery.refetch();
      const refreshedTask = (Array.isArray(project?.tasks) ? project.tasks : []).find((task) => String(task.id) === String(selectedTask.id));
      if (refreshedTask) {
        setSelectedTask(refreshedTask);
      }
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to save assignment."));
    } finally {
      setSavingAssignment(false);
    }
  };

  const handleSaveTaskDetails = async () => {
    if (!selectedTask || !selectedTask.id) return;

    setActionError("");
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
      projectDetailsQuery.refetch();
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to save task details."));
    } finally {
      setSavingTaskDetails(false);
    }
  };

  const handleCreateStoryPoint = async () => {
    if (!canSaveStoryPoint || !selectedTask) return;

    setSavingStoryPoint(true);
    setActionError("");
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
      setActionError(getErrorMessage(err, "Failed to add story point."));
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
    setActionError("");
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
      setActionError(getErrorMessage(err, "Failed to update story point."));
    } finally {
      setSavingStoryPoint(false);
    }
  };

  const handleDeleteStoryPoint = async (storyPointId) => {
    if (!selectedTask) return;

    setActionError("");
    setSuccess("");

    try {
      await api.delete(`/story-points/${storyPointId}`);
      setSuccess("Story point deleted.");
      await loadStoryPoints(selectedTask.id);
      // Don't reload project here - let user save all changes at once
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to delete story point."));
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
        <ErrorNotice message={queryError || "Project not found."} severity="error" dedupeKey="project-not-found-error" />
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

      {(actionError || queryError) ? <ErrorNotice message={actionError || queryError} severity="error" sx={{ mb: 2 }} dedupeKey="project-management-action-error" /> : null}
      {success ? <ErrorNotice message={success} severity="success" sx={{ mb: 2 }} dedupeKey="project-management-success" /> : null}

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

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr auto" }, gap: 1, alignItems: "center" }}>
            <TextField size="small" label="Project name" value={editProjectName} onChange={(e) => setEditProjectName(e.target.value)} />
            <TextField size="small" label="Project description" value={editProjectDescription} onChange={(e) => setEditProjectDescription(e.target.value)} />
            <TextField
              select
              size="small"
              label="Assign Client (optional)"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <MenuItem value="">No client</MenuItem>
              {clients.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>{c.name || c.email}</MenuItem>
              ))}
            </TextField>
            <Button variant="outlined" disabled={savingProjectDetails} onClick={handleSaveProjectDetails}>
              {savingProjectDetails ? "Saving..." : "Save Project Details"}
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 1.6, borderRadius: 2.5, border: "1px solid rgba(148,163,184,0.16)", background: "rgba(15,23,42,0.68)" }}>
          <Typography sx={{ fontWeight: 900, mb: 1.2 }}>Add New Task</Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.05fr 1.2fr 0.55fr 0.7fr auto" }, gap: 1, alignItems: "center", mb: 1.2 }}>
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

            <Button variant="contained" disabled={!canAddTask || addingTask} onClick={handleAddTask}>
              {addingTask ? "Adding..." : "Add Task"}
            </Button>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 1.8,
            borderRadius: 2.5,
            border: "1px solid rgba(148,163,184,0.16)",
            background: "rgba(15,23,42,0.68)",
          }}
        >
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={1.2}
            >
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                  Team Chat
                </Typography>
                <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.35 }}>
                  {activeSessions.length > 0
                    ? `${activeSessions.length} active thread${activeSessions.length !== 1 ? "s" : ""}`
                    : "No active chat threads."}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  icon={<ChatBubbleRoundedIcon />}
                  label={`Active: ${activeSessions.length}`}
                  sx={{
                    bgcolor:
                      activeSessions.length > 0
                        ? "rgba(59,130,246,0.16)"
                        : "rgba(148,163,184,0.12)",
                    color: activeSessions.length > 0 ? "#bfdbfe" : "#cbd5e1",
                    fontWeight: 900,
                  }}
                />

                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon />}
                  onClick={handleOpenNewChat}
                  disabled={!currentUserId || authLoading}
                  sx={{ fontWeight: 900, textTransform: "none" }}
                >
                  New Chat
                </Button>
              </Stack>
            </Stack>

            {chatListLoading && sessions.length === 0 ? (
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <CircularProgress size={18} sx={{ color: "#6b51ff" }} />
                  <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                    Loading chat sessions...
                  </Typography>
                </Stack>
              </Paper>
            ) : chatListError ? (
              <ErrorNotice message={chatListError} severity="warning" dedupeKey="project-chatlist-error" />
            ) : activeSessions.length === 0 && endedSessions.length === 0 ? (
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background:
                    "linear-gradient(180deg, rgba(18,31,54,0.88), rgba(10,18,34,0.96))",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Typography sx={{ fontWeight: 900, color: "#f8fafc", mb: 0.5 }}>
                  No chat threads yet.
                </Typography>
                <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                  Start a project discussion with assigned developers.
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={2}>
                {activeSessions.length > 0 ? (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#93c5fd",
                        fontWeight: 900,
                        textTransform: "uppercase",
                      }}
                    >
                      Active Threads
                    </Typography>

                    <Stack spacing={1.2} sx={{ mt: 1 }}>
                      {activeSessions.map((session) => (
                        <ManagerChatThreadCard
                          key={session.id}
                          session={session}
                          onClick={() => handleOpenSession(session.id)}
                          currentUserId={currentUserId}
                        />
                      ))}
                    </Stack>
                  </Box>
                ) : null}
              </Stack>
            )}

            <Paper
              sx={{
                p: 2,
                borderRadius: 3,
                background:
                  "linear-gradient(180deg, rgba(18,31,54,0.88), rgba(10,18,34,0.96))",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Stack spacing={1.4}>
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: 17 }}>
                    Recent Chat Summaries
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.35 }}>
                    Last five ended chats for this project.
                  </Typography>
                </Box>

                {recentSummaries.length > 0 ? (
                  <Stack spacing={1.2}>
                    {recentSummaries.map((session) => (
                      <Paper
                        key={session.id}
                        onClick={() => handleOpenSession(session.id)}
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          cursor: "pointer",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          transition: "all 180ms ease",
                          "&:hover": {
                            background: "rgba(255,255,255,0.07)",
                            borderColor: "rgba(96,165,250,0.28)",
                          },
                        }}
                      >
                        <Stack spacing={1}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            spacing={1}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 900, color: "#f8fafc" }}>
                                {session.startedByName || "Unknown"}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "rgba(231,233,238,0.58)" }}
                              >
                                {formatChatTime(session.endedAt || session.startedAt)}
                              </Typography>
                            </Box>

                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<OpenInNewRoundedIcon />}
                              sx={{ whiteSpace: "nowrap", fontWeight: 900 }}
                            >
                              View
                            </Button>
                          </Stack>

                          <Typography variant="body2" sx={{ color: "#cbd5e1" }}>
                            {buildSummaryPreview(session)}
                          </Typography>

                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip
                              size="small"
                              label={`${session.messageCount || 0} messages`}
                              sx={{
                                bgcolor: "rgba(59,130,246,0.16)",
                                color: "#bfdbfe",
                                fontWeight: 800,
                              }}
                            />
                            <Chip
                              size="small"
                              label="Ended"
                              sx={{
                                bgcolor: "rgba(107,114,128,0.16)",
                                color: "#d1d5db",
                                fontWeight: 800,
                              }}
                            />
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Paper
                    sx={{
                      p: 1.5,
                      borderRadius: 3,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                      No ended chat summaries yet.
                    </Typography>
                  </Paper>
                )}
              </Stack>
            </Paper>
          </Stack>
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
      </Stack>

      {backgroundLoading && (
        <Box sx={{ position: "fixed", top: 16, right: 16, display: "flex", alignItems: "center", gap: 1, bgcolor: "rgba(15,23,42,0.9)", p: 1, borderRadius: 1, border: "1px solid rgba(148,163,184,0.16)" }}>
          <CircularProgress size={16} />
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>Updating...</Typography>
        </Box>
      )}

      <Dialog
        open={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: "94vw", sm: "94vw", md: "760px", lg: "820px" },
            maxHeight: "82vh",
            maxWidth: "none",
            background:
              "linear-gradient(180deg, rgba(8,15,28,0.98), rgba(6,11,21,0.99))",
            border: "1px solid rgba(148,163,184,0.14)",
            backdropFilter: "blur(18px)",
            borderRadius: 4,
            display: "flex",
            flexDirection: "column",
          },
        }}
        BackdropProps={{
          sx: {
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0,
            background: "#0b1628",
            borderRadius: 4,
          }}
        >
          {currentUserId ? (
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <ChatBox
                projectId={String(projectId)}
                projectName={getProjectName(project)}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                selectedSessionId={selectedSessionId}
                hideSidebar
                hideNewChatButton
                onSummary={handleChatEnd}
                onClose={() => {
                  setChatDrawerOpen(false);
                  loadProjectSessions();
                }}
              />
            </Box>
          ) : (
            <ErrorNotice message={"Sign in to use the project chat."} severity="info" sx={{ m: 2 }} dedupeKey="project-chat-signin-info" />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={taskModalOpen} onClose={closeTaskModal} fullWidth maxWidth="lg">
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
              Manage Task: {taskDraft?.title || "Task"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              Task details and story points
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
      <Typography
        variant="body2"
        sx={{
          mt: 0.3,
          fontWeight: 800,
          color: "#e5e7eb",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}






function ManagerChatThreadCard({ session, onClick, currentUserId }) {
  const isStarter = String(session.startedById) === String(currentUserId);

  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 1.5,
        borderRadius: 3,
        background:
          "linear-gradient(135deg, rgba(30,58,138,0.24), rgba(15,23,42,0.28))",
        border: "1px solid rgba(59,130,246,0.2)",
        cursor: "pointer",
        transition: "all 200ms ease",
        "&:hover": {
          background:
            "linear-gradient(135deg, rgba(30,58,138,0.32), rgba(15,23,42,0.36))",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        },
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                label="Active"
                sx={{
                  bgcolor: "rgba(34,197,94,0.24)",
                  color: "#86efac",
                  fontWeight: 900,
                }}
              />

              {isStarter ? (
                <Chip
                  size="small"
                  label="You started"
                  sx={{
                    bgcolor: "rgba(139,92,246,0.16)",
                    color: "#d8b4fe",
                    fontWeight: 700,
                  }}
                />
              ) : null}
            </Stack>
          </Box>

          <Button
            size="small"
            variant="outlined"
            startIcon={<OpenInNewRoundedIcon />}
            sx={{ whiteSpace: "nowrap", fontWeight: 900 }}
          >
            Open
          </Button>
        </Stack>

        <Stack spacing={0.6} sx={{ py: 0.5 }}>
          <ManagerChatRow label="Started by" value={session.startedByName || "Unknown"} />
          <ManagerChatRow label="Started" value={formatChatTime(session.startedAt) || "Recently"} />

          {session.lastMessagePreview ? (
            <ManagerChatRow
              label="Last message"
              value={
                session.lastMessagePreview.length > 60
                  ? `${session.lastMessagePreview.substring(0, 60)}...`
                  : session.lastMessagePreview
              }
            />
          ) : null}

          <ManagerChatRow label="Messages" value={String(session.messageCount || 0)} />
        </Stack>
      </Stack>
    </Paper>
  );
}

function ManagerChatRow({ label, value }) {
  return (
    <Stack direction="row" spacing={0.6} justifyContent="space-between" alignItems="flex-start">
      <Typography
        variant="caption"
        sx={{
          color: "rgba(231,233,238,0.52)",
          fontWeight: 700,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          color: "#e2e8f0",
          fontWeight: 700,
          textAlign: "right",
          wordBreak: "break-word",
          maxWidth: "65%",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
