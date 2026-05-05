import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import PriorityHighRoundedIcon from "@mui/icons-material/PriorityHighRounded";
import FiberNewRoundedIcon from "@mui/icons-material/FiberNewRounded";
import RadarRoundedIcon from "@mui/icons-material/RadarRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useManagerProjects, useManagerTasks, useManagerDevelopers, managerKeys } from "../../data/useManager";
import { useRecentEmailTickets } from "../../data/useManagerTickets";
import useLiveRefresh from "../../../hooks/useLiveRefresh";
import ManagerDeveloperProgress from "../../components/progress/ManagerDeveloperProgress";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import DashboardHero from "../../../components/ui/DashboardHero.jsx";
import ErrorNotice from "../../../components/ui/ErrorNotice.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";

const sectionCardSx = {
  p: { xs: 1.6, md: 1.9 },
  borderRadius: 3,
  overflow: "hidden",
  border: "1px solid rgba(148,163,184,0.16)",
  background:
    "linear-gradient(180deg, rgba(15,23,42,0.78) 0%, rgba(15,23,42,0.62) 100%)",
  boxShadow: "0 18px 46px rgba(0,0,0,0.22)",
  backdropFilter: "blur(18px)",
};

function normalizeTicketList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.tickets)) return data.tickets;
  return [];
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function normalizeTicketStatus(ticket) {
  return normalizeText(ticket?.status || ticket?.ticketStatus || ticket?.state || ticket?.workflowStatus)
    .replace(/[\s_-]+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeTicketPriority(ticket) {
  return normalizeText(ticket?.priority || ticket?.severity || ticket?.level || ticket?.importance)
    .replace(/[\s_-]+/g, " ")
    .trim()
    .toLowerCase();
}

function getTicketTimestamp(ticket) {
  const value =
    ticket?.updatedAt ||
    ticket?.createdAt ||
    ticket?.submittedAt ||
    ticket?.receivedAt ||
    ticket?.lastUpdatedAt ||
    ticket?.created_on ||
    ticket?.updated_on ||
    0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function isClosedTicket(ticket) {
  const status = normalizeTicketStatus(ticket);
  return ["done", "completed", "complete", "closed", "resolved", "cancelled", "canceled", "rejected"].includes(status);
}

function isVisibleSnapshotTicket(ticket) {
  const status = normalizeTicketStatus(ticket);
  if (!status) return true;

  return [
    "open",
    "new",
    "todo",
    "to do",
    "in progress",
    "inprogress",
    "pending",
    "assigned",
    "review",
    "triage",
    "escalated",
  ].includes(status) || !isClosedTicket(ticket);
}

function SmallBadge({ children, color = "#cbd5e1", glow = "rgba(148,163,184,0.12)" }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.55,
        px: 1.1,
        py: 0.42,
        borderRadius: 999,
        fontSize: "0.72rem",
        lineHeight: 1,
        fontWeight: 900,
        letterSpacing: 0.35,
        color,
        background: glow,
        border: `1px solid ${glow.replace("0.12", "0.26").replace("0.14", "0.28")}`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Box>
  );
}

function StatCard({ label, value, hint, icon, color, bg }) {
  return (
    <Paper
      sx={{
        p: 1.6,
        borderRadius: 2,
        bgcolor: "#0f1b2f",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(124,92,255,0.14)",
            color: "#c4b5fd",
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{ color: "#94a3b8", fontWeight: 700 }}
          >
            {label}
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {value}
          </Typography>
        </Box>
      </Box>

      {hint ? (
        <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.76rem", display: "block", mt: 0.8 }}>
          {hint}
        </Typography>
      ) : null}
    </Paper>
  );
}

function DashboardMetricCard({ label, value, hint, icon }) {
  return (
    <Paper
      sx={{
        p: 1.6,
        borderRadius: 2,
        bgcolor: "#0f1b2f",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(124,92,255,0.14)",
            color: "#c4b5fd",
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{ color: "#94a3b8", fontWeight: 700 }}
          >
            {label}
          </Typography>

          <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
            {value}
          </Typography>
        </Box>
      </Box>

      {hint ? (
        <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.76rem", display: "block", mt: 0.8 }}>
          {hint}
        </Typography>
      ) : null}
    </Paper>
  );
}

function TicketMetricCard({ label, value, hint, icon, color, bg }) {
  return (
    <Paper
      sx={{
        p: 1.6,
        borderRadius: 2,
        bgcolor: "#0f1b2f",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(124,92,255,0.14)",
            color: "#c4b5fd",
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{ color: "#94a3b8", fontWeight: 700 }}
          >
            {label}
          </Typography>

          <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
            {value}
          </Typography>
        </Box>
      </Box>

      {hint ? (
        <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.76rem", display: "block", mt: 0.8 }}>
          {hint}
        </Typography>
      ) : null}
    </Paper>
  );
}

function EmptyMiniState({ title, text }) {
  return (
    <Paper
      sx={{
        p: 1.4,
        borderRadius: 2,
        background: "rgba(15,23,42,0.42)",
        border: "1px dashed rgba(148,163,184,0.14)",
        textAlign: "center",
      }}
    >
      <Typography sx={{ color: "#cbd5e1", fontWeight: 800, fontSize: 13 }}>{title}</Typography>
      <Typography variant="caption" sx={{ color: "#64748b", display: "block", mt: 0.35 }}>
        {text}
      </Typography>
    </Paper>
  );
}

function TaskFocusRow({ task, type, getTaskTitle, getTaskDate }) {
  const isDone = type === "done";
  return (
    <Box
      sx={{
        p: 1,
        borderRadius: 2,
        border: "1px solid rgba(148,163,184,0.12)",
        background: "rgba(15,23,42,0.48)",
        transition: "all 150ms ease",
        "&:hover": {
          borderColor: isDone ? "rgba(34,197,94,0.28)" : "rgba(56,189,248,0.3)",
          background: "rgba(20,29,52,0.66)",
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.9}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1.6,
            display: "grid",
            placeItems: "center",
            color: isDone ? "#86efac" : "#7dd3fc",
            background: isDone ? "rgba(34,197,94,0.13)" : "rgba(56,189,248,0.13)",
            flex: "0 0 auto",
            "& svg": { fontSize: 17 },
          }}
        >
          {isDone ? <CheckCircleRoundedIcon /> : <ScheduleRoundedIcon />}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 850, color: "#f1f5f9" }} noWrap>
            {getTaskTitle(task)}
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.72rem" }}>
            {isDone
              ? `Updated: ${formatDate(task?.completedAt || task?.updatedAt || task?.createdAt)}`
              : `Due: ${formatDate(getTaskDate(task))}`}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth() || {};
  const [expandProjects, setExpandProjects] = useState(false);
  const [developerProgressTotals, setDeveloperProgressTotals] = useState({
    assignedTasks: 0,
    completedStoryPoints: 0,
    totalStoryPoints: 0,
    completedPointValue: 0,
    totalPointValue: 0,
    delayedTaskCount: 0,
  });
  // Wait for auth to load before enabling queries to avoid race conditions
  const projectsQuery = useManagerProjects(!authLoading);
  const tasksQuery = useManagerTasks(!authLoading);
  const developersQuery = useManagerDevelopers(!authLoading);
  const emailTicketsQuery = useRecentEmailTickets(!authLoading);
  const { refetch: refetchProjects } = projectsQuery;
  const { refetch: refetchTasks } = tasksQuery;
  const { refetch: refetchDevelopers } = developersQuery;
  const { refetch: refetchEmailTickets } = emailTicketsQuery;

  const queryClient = useQueryClient();
  const managerScope = React.useMemo(() => String(user?.id ?? user?.email ?? ""), [user?.id, user?.email]);

  // Trigger lightweight invalidation when live updates arrive
  const loadDashboard = React.useCallback(() => {
    try {
      // Invalidate relevant caches instead of forcing individual refetches.
      // This lets react-query decide whether to refetch based on staleness.
      queryClient.invalidateQueries({ queryKey: managerKeys.projects(managerScope) });
      queryClient.invalidateQueries({ queryKey: managerKeys.tasks(managerScope) });
      queryClient.invalidateQueries({ queryKey: managerKeys.developers(managerScope) });
      queryClient.invalidateQueries({ queryKey: ["managerTickets", managerScope, "recent"] });
    } catch (e) {
      // swallow — individual queries handle errors
    }
  }, [managerScope, queryClient]);

  const liveTopics = React.useMemo(
    () => [
      "/topic/manager.dashboard",
      "/topic/tasks",
      "/topic/developers",
    ],
    []
  );
  useLiveRefresh(liveTopics, loadDashboard, { debounceMs: 1000 });

  React.useEffect(() => {
    // Only refresh if tab becomes visible after being hidden (page resume)
    const refreshWhenResumed = () => {
      if (document.visibilityState === "visible") {
        loadDashboard();
      }
    };

    document.addEventListener("visibilitychange", refreshWhenResumed);

    return () => {
      document.removeEventListener("visibilitychange", refreshWhenResumed);
    };
  }, [loadDashboard]);
  const projects = Array.isArray(projectsQuery.data) ? projectsQuery.data : [];
  const managerTasks = Array.isArray(tasksQuery.data) ? tasksQuery.data : [];
  const developers = Array.isArray(developersQuery.data) ? developersQuery.data : [];
  const tickets = normalizeTicketList(emailTicketsQuery.data);
  const loading = authLoading || projectsQuery.isLoading || tasksQuery.isLoading || developersQuery.isLoading || emailTicketsQuery.isLoading;
  const refreshing = projectsQuery.isFetching || tasksQuery.isFetching || developersQuery.isFetching || emailTicketsQuery.isFetching;
  const error =
    projectsQuery.error?.message ||
    tasksQuery.error?.message ||
    developersQuery.error?.message ||
    emailTicketsQuery.error?.message ||
    "";

  const normalizeTaskStatus = (task) =>
    String(task?.status || task?.taskStatus || task?.state || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, " ");

  const toNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  };

  const isDoneStatus = (status) => {
    const value = String(status || "").toLowerCase();
    return ["done", "completed", "closed", "finished"].some((word) => value.includes(word));
  };

  const isCompletedTask = (task) => {
    const status = normalizeTaskStatus(task);
    const completedByStatus = (
      status === "done" ||
      status === "completed" ||
      status === "complete" ||
      status === "closed" ||
      status === "resolved" ||
      status === "finished"
    );

    if (completedByStatus) return true;

    const totalPointValue = Number(task?.totalPointValue ?? task?.estimatedPoints ?? task?.totalStoryPoints ?? 0);
    const completedPointValue = Number(task?.completedPointValue ?? task?.completedStoryPoints ?? 0);
    return totalPointValue > 0 && completedPointValue >= totalPointValue;
  };

  const getTaskTitle = (task) => task?.title || task?.taskName || task?.name || "Untitled Task";

  const getTaskDate = (task) => task?.dueDate || task?.deadline || task?.targetDate || task?.plannedEndDate || task?.due_on || null;

  const getProjectId = (project) =>
    String(project?.id ?? project?.projectId ?? project?.project_id ?? "");

  const getProjectName = (project) =>
    String(project?.name ?? project?.projectName ?? project?.title ?? "Untitled Project");

  const getProjectDescription = (project) =>
    project?.description ?? project?.projectDescription ?? "No description available.";

  // Helper: Extract assignee ID from a task object
  const getTaskAssigneeId = (task) => {
    if (!task || typeof task !== "object") return "";
    return String(
      task?.assignedToId ??
      task?.assigneeId ??
      task?.assigned_to_id ??
      task?.assignedDeveloperId ??
      task?.developerId ??
      task?.assignedUserId ??
      task?.userId ??
      task?.assignedTo?.id ??
      task?.assignee?.id ??
      task?.assignedUser?.id ??
      task?.assignedDeveloper?.id ??
      task?.developer?.id ??
      task?.user?.id ??
      ""
    ).trim();
  };

  // Helper: Extract assignee name from a task object
  const getTaskAssigneeName = (task) => {
    if (!task || typeof task !== "object") return "";
    return String(
      task?.assignedToName ??
      task?.assigneeName ??
      task?.assigned_to_name ??
      task?.assignedDeveloperName ??
      task?.developerName ??
      task?.assignedUserName ??
      task?.userName ??
      task?.assignedTo?.name ??
      task?.assignee?.name ??
      task?.assignedUser?.name ??
      task?.assignedDeveloper?.name ??
      task?.developer?.name ??
      task?.user?.name ??
      ""
    ).trim();
  };

  // Helper: Check if task has an assignee (by ID or name)
  const hasTaskAssignee = (task) => {
    const assigneeId = getTaskAssigneeId(task);
    const assigneeName = getTaskAssigneeName(task);
    return assigneeId !== "" || assigneeName !== "";
  };

  const isFilled = (value) => {
    if (value == null) return false;
    if (typeof value === "string") return value.trim() !== "";
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  };

  const numericFillKeys = new Set([
    "totalStoryPoints",
    "completedStoryPoints",
    "storyPoints",
    "estimatedPoints",
    "points",
    "totalPointValue",
    "completedPointValue",
    "weightedPointsTotal",
    "weightedPointsDone",
    "totalWeightedPoints",
    "completedWeightedPoints",
    "doneWeightedPoints",
    "weight",
    "progress",
  ]);

  const assigneeKeys = new Set([
    "assignedToId",
    "assigneeId",
    "assignedDeveloperId",
    "developerId",
    "assigned_to_id",
    "assignedUserId",
    "userId",
    "assignedToName",
    "assigneeName",
    "assignedDeveloperName",
    "developerName",
    "assignedUserName",
    "userName",
    "assignedTo",
    "assignee",
    "assignedUser",
    "assignedDeveloper",
    "developer",
    "user",
  ]);

  const shouldUseIncomingValue = (key, existingValue, incomingValue) => {
    if (!isFilled(incomingValue)) return false;

    if (!isFilled(existingValue)) return true;

    if (numericFillKeys.has(key)) {
      const existingNumber = Number(existingValue);
      const incomingNumber = Number(incomingValue);

      if (Number.isFinite(existingNumber) && Number.isFinite(incomingNumber)) {
        return existingNumber <= 0 && incomingNumber > 0;
      }
    }

    return false;
  };

  // Merge nested objects while preserving non-empty existing values,
  // but allowing metric fields to be filled when existing numeric values are zero.
  const mergeObjectsPreferExisting = (existingObj, incomingObj) => {
    const merged = { ...existingObj };

    Object.entries(incomingObj || {}).forEach(([key, incomingValue]) => {
      const existingValue = merged[key];

      if (
        typeof existingValue === "object" &&
        existingValue !== null &&
        !Array.isArray(existingValue) &&
        typeof incomingValue === "object" &&
        incomingValue !== null &&
        !Array.isArray(incomingValue)
      ) {
        merged[key] = mergeObjectsPreferExisting(existingValue, incomingValue);
        return;
      }

      if (shouldUseIncomingValue(key, existingValue, incomingValue)) {
        merged[key] = incomingValue;
      }
    });

    return merged;
  };

  // Helper: Merge duplicate task objects where manager-task assignee identity wins,
  // and project-task metrics fill missing/zero values.
  const mergeTaskObjects = (existingTask, newTask) => {
    if (!newTask || typeof newTask !== "object") return existingTask;
    if (!existingTask || typeof existingTask !== "object") return newTask;

    const merged = { ...existingTask };
    Object.entries(newTask).forEach(([key, incomingValue]) => {
      const existingValue = merged[key];

      if (
        typeof existingValue === "object" &&
        existingValue !== null &&
        !Array.isArray(existingValue) &&
        typeof incomingValue === "object" &&
        incomingValue !== null &&
        !Array.isArray(incomingValue)
      ) {
        merged[key] = mergeObjectsPreferExisting(existingValue, incomingValue);
        return;
      }

      if (assigneeKeys.has(key)) {
        if (!isFilled(existingValue) && isFilled(incomingValue)) {
          merged[key] = incomingValue;
        }
        return;
      }

      if (shouldUseIncomingValue(key, existingValue, incomingValue)) {
        merged[key] = incomingValue;
      }
    });

    // Never allow project-task merge to clear assignee identity once present.
    if (hasTaskAssignee(existingTask) && !hasTaskAssignee(merged)) {
      return existingTask;
    }

    return merged;
  };

  const tasks = useMemo(() => {
    const taskMap = new Map();

    // Add manager tasks first (these have the most complete assignee data)
    managerTasks.forEach((task) => {
      if (!task || typeof task !== "object") return;

      const idKey = String(
        task?.id ??
        task?.taskId ??
        task?.task_id ??
        task?.uuid ??
        ""
      ).trim();

      if (!idKey) {
        // If no ID, add as-is (edge case)
        taskMap.set(`_no_id_${taskMap.size}`, task);
      } else {
        taskMap.set(idKey, task);
      }
    });

    // Add or merge project tasks
    projects.forEach((project) => {
      const projectTasks = Array.isArray(project?.tasks) ? project.tasks : [];
      projectTasks.forEach((task) => {
        if (!task || typeof task !== "object") return;

        const idKey = String(
          task?.id ??
          task?.taskId ??
          task?.task_id ??
          task?.uuid ??
          ""
        ).trim();

        if (!idKey) {
          // If no ID, add as-is
          taskMap.set(`_no_id_${taskMap.size}`, task);
        } else if (taskMap.has(idKey)) {
          // Merge with existing, preserving assignee data from manager task
          const existing = taskMap.get(idKey);
          taskMap.set(idKey, mergeTaskObjects(existing, task));
        } else {
          // New task from project
          taskMap.set(idKey, task);
        }
      });
    });

    return Array.from(taskMap.values());
  }, [managerTasks, projects]);

  // Use the merged manager-scoped task list for progress metrics.
  const dashboardTasks = tasks;

  const tasksByProject = useMemo(() => {
    const grouped = new Map();

    dashboardTasks.forEach((task) => {
      const projectKey = String(
        task?.projectId ??
          task?.project_id ??
          task?.project?.id ??
          task?.project?.projectId ??
          ""
      );

      if (!projectKey) return;
      if (!grouped.has(projectKey)) grouped.set(projectKey, []);
      grouped.get(projectKey).push(task);
    });

    return grouped;
  }, [dashboardTasks]);

  const projectRows = useMemo(() => {
    return projects.map((project) => {
      const projectId = getProjectId(project);
      const projectTaskList = (tasksByProject.get(projectId) || []).length > 0
        ? tasksByProject.get(projectId)
        : (Array.isArray(project?.tasks) ? project.tasks : []);
      const totalTasks = projectTaskList.length;
      const doneTasks = projectTaskList.filter((task) => isCompletedTask(task)).length;
      const totalPointValue = projectTaskList.reduce(
        (sum, task) => sum + Number(task?.totalPointValue ?? task?.estimatedPoints ?? 0),
        0
      );
      const completedPointValue = projectTaskList.reduce(
        (sum, task) => {
          const taskTotal = Number(task?.totalPointValue ?? task?.estimatedPoints ?? 0);
          const taskCompleted = Number(task?.completedPointValue ?? (isCompletedTask(task) ? taskTotal : 0));
          return sum + taskCompleted;
        },
        0
      );
      const progress = totalPointValue > 0
        ? Math.round((completedPointValue * 100) / totalPointValue)
        : (totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0);
      const status =
        totalTasks === 0 ? "Planning" : doneTasks === totalTasks ? "Completed" : "Active";

      return {
        id: projectId,
        name: getProjectName(project),
        description: getProjectDescription(project),
        totalTasks,
        doneTasks,
        totalPointValue,
        completedPointValue,
        progress,
        status,
      };
    });
  }, [projects, tasksByProject]);

  const activeProjectCount = useMemo(
    () => projectRows.filter((project) => project.status === "Active").length,
    [projectRows]
  );

  const planningProjectCount = useMemo(
    () => projectRows.filter((project) => project.status === "Planning").length,
    [projectRows]
  );

  const completedProjectCount = useMemo(
    () => projectRows.filter((project) => project.status === "Completed").length,
    [projectRows]
  );

  const atRiskProjectCount = useMemo(
    () => projectRows.filter((project) => project.status === "Active" && Number(project.progress || 0) < 25).length,
    [projectRows]
  );

  const completionRate = useMemo(() => {
    const totalPointValue = dashboardTasks.reduce(
      (sum, task) => sum + Number(task?.totalPointValue ?? task?.estimatedPoints ?? task?.totalStoryPoints ?? 0),
      0
    );
    const completedPointValue = dashboardTasks.reduce((sum, task) => {
      const taskTotal = Number(task?.totalPointValue ?? task?.estimatedPoints ?? task?.totalStoryPoints ?? 0);
      return sum + Number(task?.completedPointValue ?? task?.completedStoryPoints ?? (isCompletedTask(task) ? taskTotal : 0));
    }, 0);

    if (totalPointValue === 0) return 0;
    return Math.round((completedPointValue / totalPointValue) * 100);
  }, [dashboardTasks]);

  const totalWeighted = useMemo(
    () => dashboardTasks.reduce((sum, task) => sum + Number(task?.totalPointValue ?? task?.estimatedPoints ?? task?.totalStoryPoints ?? 0), 0),
    [dashboardTasks]
  );

  const doneWeighted = useMemo(
    () => dashboardTasks.reduce((sum, task) => {
      const taskTotal = Number(task?.totalPointValue ?? task?.estimatedPoints ?? task?.totalStoryPoints ?? 0);
      return sum + Number(task?.completedPointValue ?? task?.completedStoryPoints ?? (isCompletedTask(task) ? taskTotal : 0));
    }, 0),
    [dashboardTasks]
  );

  const openTasks = useMemo(() => dashboardTasks.filter((task) => !isCompletedTask(task)), [dashboardTasks]);

  const upcomingTasks = useMemo(() => {
    return [...openTasks]
      .sort((a, b) => {
        const firstDate = getTaskDate(a);
        const secondDate = getTaskDate(b);
        if (!firstDate && !secondDate) return 0;
        if (!firstDate) return 1;
        if (!secondDate) return -1;
        return new Date(firstDate) - new Date(secondDate);
      })
      .slice(0, 3);
  }, [openTasks]);

  const recentCompletedTasks = useMemo(() => {
    return dashboardTasks
      .filter((task) => isCompletedTask(task))
      .sort((a, b) => {
        const firstDate = a?.completedAt || a?.updatedAt || a?.createdAt || 0;
        const secondDate = b?.completedAt || b?.updatedAt || b?.createdAt || 0;
        return new Date(secondDate) - new Date(firstDate);
      })
      .slice(0, 3);
  }, [dashboardTasks]);

  const visibleTickets = useMemo(() => {
    // Filter tickets to only show those related to current manager's projects
    const projectIds = new Set(projects.map((p) => getProjectId(p)).filter(Boolean));
    
    return [...tickets]
      .filter((ticket) => {
        // Only include tickets that belong to current manager's projects
        // or tickets without projectId (show them as a fallback)
        const ticketProjectId = String(
          ticket?.projectId ??
          ticket?.project_id ??
          ticket?.project?.id ??
          ticket?.projectDetails?.id ??
          ""
        ).trim();
        
        // If ticket has no project ID, include it (fallback)
        if (!ticketProjectId) return isVisibleSnapshotTicket(ticket);
        
        // If ticket belongs to a current manager project, include it
        if (projectIds.has(ticketProjectId)) return isVisibleSnapshotTicket(ticket);
        
        // Otherwise exclude the ticket (belongs to another manager's project)
        return false;
      })
      .sort((a, b) => getTicketTimestamp(b) - getTicketTimestamp(a));
  }, [tickets, projects]);

  const openTicketCount = useMemo(
    () => visibleTickets.filter((ticket) => {
      const status = normalizeTicketStatus(ticket);
      return ["open", "new", "todo", "to do", "in progress", "inprogress", "pending", "assigned", "review", "triage", "escalated"].includes(status) || !status;
    }).length,
    [visibleTickets]
  );

  const highPriorityTicketCount = useMemo(
    () => visibleTickets.filter((ticket) => ["high", "critical", "urgent", "blocker", "blocked"].includes(normalizeTicketPriority(ticket))).length,
    [visibleTickets]
  );

  const latestTicketCount = visibleTickets.length;
  const averageProjectProgress = projectRows.length
    ? Math.round(projectRows.reduce((sum, project) => sum + project.progress, 0) / projectRows.length)
    : 0;

  const developerProgressBadgeStats = useMemo(() => {
    const sourceTasks = Array.isArray(dashboardTasks) ? dashboardTasks : [];
    const assignedTasks = sourceTasks.filter(hasTaskAssignee);

    let storyDone = 0;
    let storyTotal = 0;
    let weightedDone = 0;
    let weightedTotal = 0;
    let delayed = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    assignedTasks.forEach((task) => {
      const done = isDoneStatus(task?.status ?? task?.taskStatus ?? task?.state);

      const story =
        toNumber(task?.totalStoryPoints) ||
        toNumber(task?.storyPoints) ||
        toNumber(task?.estimatedPoints) ||
        toNumber(task?.points) ||
        toNumber(task?.totalPointValue) ||
        0;

      const weighted =
        toNumber(task?.totalPointValue) ||
        toNumber(task?.weightedPointsTotal) ||
        toNumber(task?.totalWeightedPoints) ||
        toNumber(task?.weight) ||
        story ||
        0;

      const completedStory =
        toNumber(task?.completedStoryPoints) ||
        toNumber(task?.storyPointsDone) ||
        toNumber(task?.completedPoints) ||
        toNumber(task?.completedPointValue) ||
        (done ? story : 0);

      const completedWeighted =
        toNumber(task?.completedPointValue) ||
        toNumber(task?.weightedPointsDone) ||
        toNumber(task?.completedWeightedPoints) ||
        toNumber(task?.doneWeightedPoints) ||
        (done ? weighted : 0);

      storyTotal += story;
      weightedTotal += weighted;

      storyDone += completedStory;
      weightedDone += completedWeighted;

      if (!done && (task?.dueDate || task?.deadline)) {
        const due = new Date(task?.dueDate || task?.deadline);
        due.setHours(0, 0, 0, 0);
        if (!Number.isNaN(due.getTime()) && due < today) {
          delayed += 1;
        }
      }
    });

    return {
      assignedTaskCount: assignedTasks.length,
      storyPointsLabel: `${storyDone}/${storyTotal}`,
      weightedPointsLabel: `${weightedDone}/${weightedTotal}`,
      delayedTaskCount: delayed,
    };
  }, [dashboardTasks]);

  const handleDeveloperProgressTotalsChange = (totals) => {
    setDeveloperProgressTotals(totals || {
      assignedTasks: 0,
      completedStoryPoints: 0,
      totalStoryPoints: 0,
      completedPointValue: 0,
      totalPointValue: 0,
      delayedTaskCount: 0,
    });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, minHeight: "52vh", display: "grid", placeItems: "center" }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <CircularProgress size={24} />
          <Typography>Loading manager data...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: { xs: 2, md: 3 } }}>
      {refreshing ? (
        <LinearProgress
          sx={{
            mb: 1.2,
            height: 4,
            borderRadius: 999,
            bgcolor: "rgba(255,255,255,0.08)",
            "& .MuiLinearProgress-bar": { bgcolor: "#6d5dfc" },
          }}
        />
      ) : null}

      <DashboardHero
        icon={<DashboardRoundedIcon />}
        title="Manager Dashboard"
      />

      {/* Show errors inline inside their relevant widgets instead of a global banner */}

      <Grid container spacing={1.6} sx={{ mb: 2.4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Total Projects"
            value={projectRows.length}
            hint={`${activeProjectCount} active projects`}
            icon={<FolderRoundedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="At Risk Projects"
            value={atRiskProjectCount}
            hint="Low progress"
            icon={<PriorityHighRoundedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Weighted Progress"
            value={`${completionRate}%`}
            hint={`${doneWeighted}/${totalWeighted} points completed`}
            icon={<TrendingUpRoundedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Weighted Done"
            value={doneWeighted}
            hint="Point value completed"
            icon={<DoneAllRoundedIcon />}
          />
        </Grid>
      </Grid>

      <Paper sx={{ ...sectionCardSx, mb: 2.35 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.2} sx={{ mb: 1.35 }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography sx={{ fontWeight: 950, fontSize: "1rem", color: "#f8fafc" }}>Projects Overview</Typography>
              <SmallBadge color="#7dd3fc" glow="rgba(56,189,248,0.14)">ACTIVE: {activeProjectCount}</SmallBadge>
            </Stack>
            <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mt: 0.35 }}>
              Full project list with delivery progress, task counts, and weighted completion.
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={1.2}>
        </Grid>

        <Box sx={{ mt: 1.8 }}>
          {projectRows.length === 0 ? (
            <EmptyMiniState title="No projects found." text="All projects will appear here once they are loaded." />
          ) : (
            <>
            <Grid container spacing={1.2}>
              {(expandProjects ? projectRows : projectRows.slice(0, 3)).map((project) => {
                const progressTone = project.progress >= 80 ? "#86efac" : project.progress >= 40 ? "#7dd3fc" : "#fda4af";
                const progressBg = project.progress >= 80 ? "rgba(34,197,94,0.14)" : project.progress >= 40 ? "rgba(56,189,248,0.14)" : "rgba(244,63,94,0.14)";
                const statusTone = project.status === "Active" ? "#86efac" : project.status === "Completed" ? "#7dd3fc" : "#fda4af";
                const statusBg = project.status === "Active" ? "rgba(34,197,94,0.14)" : project.status === "Completed" ? "rgba(56,189,248,0.14)" : "rgba(244,63,94,0.14)";

                return (
                  <Grid item xs={12} sm={6} md={4} xl={3} key={project.id || project.name}>
                    <Paper
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/manager/projects/${getProjectId(project)}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/manager/projects/${getProjectId(project)}`);
                        }
                      }}
                      sx={{
                        p: 1,
                        minHeight: 84,
                        borderRadius: 2.4,
                        border: "1px solid rgba(148,163,184,0.14)",
                        background: "rgba(15,23,42,0.58)",
                        cursor: "pointer",
                        transition: "transform 160ms ease, border-color 160ms ease, background 160ms ease",
                        outline: "none",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          borderColor: "rgba(125,211,252,0.35)",
                          background: "rgba(15,23,42,0.72)",
                        },
                        "&:focus-visible": {
                          boxShadow: "0 0 0 3px rgba(125,211,252,0.22)",
                        },
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 0.3 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 800, color: "#f8fafc", fontSize: "0.94rem" }} noWrap>
                            {project.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#94a3b8",
                              mt: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                              wordBreak: "break-word",
                            }}
                          >
                            {project.description}
                          </Typography>
                        </Box>
                        <SmallBadge color={statusTone} glow={statusBg}>
                          {project.status}
                        </SmallBadge>
                      </Stack>

                      <Typography variant="caption" sx={{ color: "#cbd5e1", display: "block", mb: 0.15, fontSize: "0.72rem" }}>
                        {project.doneTasks}/{project.totalTasks} tasks complete · {project.completedPointValue}/{project.totalPointValue} points
                      </Typography>

                      <LinearProgress
                        variant="determinate"
                        value={project.progress}
                        sx={{
                          height: 6,
                          borderRadius: 999,
                          bgcolor: "rgba(255,255,255,0.08)",
                          mb: 0.45,
                          "& .MuiLinearProgress-bar": { bgcolor: progressTone },
                        }}
                      />

                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mt: 0.3 }}>
                        <SmallBadge color="#bfdbfe" glow="rgba(96,165,250,0.14)">
                          {project.totalTasks} TASKS
                        </SmallBadge>
                        <SmallBadge color="#ddd6fe" glow="rgba(124,92,255,0.14)">
                          {project.progress}%
                        </SmallBadge>
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
            {projectRows.length > 3 && (
              <Box sx={{ mt: 1.4, textAlign: "center" }}>
                <Button
                  onClick={() => setExpandProjects(!expandProjects)}
                  sx={{
                    textTransform: "none",
                    color: "#a5b4fc",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    "&:hover": { color: "#c4b5fd" },
                  }}
                >
                  {expandProjects ? "Show fewer projects ↑" : `View all ${projectRows.length} projects ↓`}
                </Button>
              </Box>
            )}
            </>
          )}
        </Box>
      </Paper>

      <Paper
        sx={{
          ...sectionCardSx,
          mb: 2.35,
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top right, rgba(124,92,255,0.18), transparent 38%), radial-gradient(circle at left, rgba(56,189,248,0.11), transparent 35%)",
            pointerEvents: "none",
          },
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.2} sx={{ mb: 1.45 }}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography sx={{ fontWeight: 950, fontSize: "1rem", color: "#f8fafc" }}>Ticket Snapshot</Typography>
                <SmallBadge color="#7dd3fc" glow="rgba(56,189,248,0.14)">OPEN: {openTicketCount}</SmallBadge>
              </Stack>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#94a3b8",
                    mt: 0.35,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  Compact inbound ticket overview. Full ticket details stay in the Tickets page.
                </Typography>

                {emailTicketsQuery.error ? (
                  <ErrorNotice message={emailTicketsQuery.error.message || String(emailTicketsQuery.error)} severity="error" sx={{ mt: 1, mb: 1.2 }} dedupeKey="manager-email-tickets-error" />
                ) : null}
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/manager/tickets")}
              sx={{ textTransform: "none", borderColor: "rgba(124,92,255,0.45)", color: "#ddd6fe" }}
            >
              View All
            </Button>
          </Stack>

          <Grid container spacing={1.2}>
            <Grid item xs={12} sm={6} lg={3}>
              <TicketMetricCard label="Open Tickets" value={openTicketCount} hint="Active inbound requests" icon={<ConfirmationNumberRoundedIcon />} />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <TicketMetricCard label="High Priority" value={highPriorityTicketCount} hint="Needs manager attention" icon={<PriorityHighRoundedIcon />} />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <TicketMetricCard label="Latest Tickets" value={latestTicketCount} hint="Recent snapshot items" icon={<FiberNewRoundedIcon />} />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <TicketMetricCard label="Status" value={latestTicketCount > 0 ? "Active" : "None"} hint="Inbound pipeline" icon={<RadarRoundedIcon />} />
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Paper sx={{ ...sectionCardSx, mb: 2.35 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.2} sx={{ mb: 1.35 }}>
          <Box>
            <Typography sx={{ fontWeight: 950, fontSize: "1rem", color: "#f8fafc" }}>Developer Progress</Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mt: 0.35 }}>
              Progress by developer, task weight, and delivery contribution.
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
            <SmallBadge color="#bfdbfe" glow="rgba(96,165,250,0.14)">ASSIGNED: {developerProgressBadgeStats.assignedTaskCount}</SmallBadge>
            <SmallBadge color="#ddd6fe" glow="rgba(124,92,255,0.14)">STORY: {developerProgressBadgeStats.storyPointsLabel}</SmallBadge>
            <SmallBadge color="#a7f3d0" glow="rgba(34,197,94,0.14)">WEIGHTED: {developerProgressBadgeStats.weightedPointsLabel}</SmallBadge>
            <SmallBadge color="#fed7aa" glow="rgba(251,146,60,0.14)">DELAYED: {developerProgressBadgeStats.delayedTaskCount}</SmallBadge>
            <Button
              size="small"
              variant="outlined"
              onClick={() => Promise.all([developersQuery.refetch(), tasksQuery.refetch()])}
              sx={{
                minWidth: "auto",
                px: 1.1,
                py: 0.25,
                lineHeight: 1,
                borderRadius: 999,
                textTransform: "none",
                borderColor: "rgba(148,163,184,0.32)",
                color: "#cbd5e1",
              }}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>
        <ManagerDeveloperProgress
          hideSummary
          hideHeader
          projectsData={projects}
          developersData={developers}
          tasksData={dashboardTasks}
          loadingOverride={loading || refreshing}
          errorOverride={developersQuery.error || tasksQuery.error || null}
          onRetry={() => Promise.all([developersQuery.refetch(), tasksQuery.refetch()])}
          onTotalsChange={handleDeveloperProgressTotalsChange}
        />
      </Paper>

      <Paper sx={sectionCardSx}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.2} sx={{ mb: 1.3 }}>
          <Box>
            <Typography sx={{ fontWeight: 950, fontSize: "1rem", color: "#f8fafc" }}>Task Focus</Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mt: 0.35 }}>
              Compact focus list for upcoming and recently completed work.
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.8}>
            <StatusBadge label={`OPEN ${openTasks.length}`} variant="info" />
            <StatusBadge label={`DONE ${recentCompletedTasks.length}`} variant="success" />
          </Stack>
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.4 }}>
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <ScheduleRoundedIcon sx={{ color: "#7dd3fc", fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: "#94a3b8", textTransform: "uppercase", fontWeight: 900, fontSize: "0.72rem" }}>
                  Upcoming Open Tasks
                </Typography>
              </Stack>
              <SmallBadge color="#7dd3fc" glow="rgba(56,189,248,0.14)">{upcomingTasks.length}</SmallBadge>
            </Stack>
            {upcomingTasks.length === 0 ? (
              <EmptyMiniState title="No open tasks." text="Upcoming work will appear here." />
            ) : (
              <Stack spacing={0.75}>
                {upcomingTasks.map((task, index) => (
                  <TaskFocusRow key={task?.id || `open-${index}`} task={task} type="open" getTaskTitle={getTaskTitle} getTaskDate={getTaskDate} />
                ))}
              </Stack>
            )}
          </Box>

          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <CheckCircleRoundedIcon sx={{ color: "#86efac", fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: "#94a3b8", textTransform: "uppercase", fontWeight: 900, fontSize: "0.72rem" }}>
                  Recently Completed
                </Typography>
              </Stack>
              <SmallBadge color="#86efac" glow="rgba(34,197,94,0.14)">{recentCompletedTasks.length}</SmallBadge>
            </Stack>
            {recentCompletedTasks.length === 0 ? (
              <EmptyMiniState title="No completed tasks yet." text="Completed work will appear here." />
            ) : (
              <Stack spacing={0.75}>
                {recentCompletedTasks.map((task, index) => (
                  <TaskFocusRow key={task?.id || `done-${index}`} task={task} type="done" getTaskTitle={getTaskTitle} getTaskDate={getTaskDate} />
                ))}
              </Stack>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

