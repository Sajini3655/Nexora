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
  borderRadius: 'var(--nx-radius-section)',
  overflow: "hidden",
  border: "1px solid var(--nx-border)",
  background: "var(--nx-card)",
  color: "var(--nx-text)",
  boxShadow: "var(--nx-shadow)",
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

function SmallBadge({ children, color = "var(--nx-text)", glow = "var(--nx-panel-2)" }) {
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
        border: `1px solid var(--nx-border)`,
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
        borderRadius: 'var(--nx-radius-inner)',
        border: "1px solid var(--nx-border)",
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
            bgcolor: "var(--nx-panel-2)",
            color: "var(--nx-purple)",
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{ color: "var(--nx-muted)", fontWeight: 700 }}
          >
            {label}
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {value}
          </Typography>
        </Box>
      </Box>

      {hint ? (
        <Typography variant="caption" sx={{ color: "var(--nx-muted)", fontSize: "0.76rem", display: "block", mt: 0.8 }}>
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
        bgcolor: "var(--nx-card)",
        border: "1px solid var(--nx-border)",
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
            bgcolor: "var(--nx-panel-2)",
            color: "var(--nx-purple)",
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{ color: "var(--nx-muted)", fontWeight: 700 }}
          >
            {label}
          </Typography>

          <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
            {value}
          </Typography>
        </Box>
      </Box>

      {hint ? (
        <Typography variant="caption" sx={{ color: "var(--nx-muted)", fontSize: "0.76rem", display: "block", mt: 0.8 }}>
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
        bgcolor: "var(--nx-card)",
        border: "1px solid var(--nx-border)",
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
            bgcolor: "var(--nx-panel-2)",
            color: "var(--nx-purple)",
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{ color: "var(--nx-muted)", fontWeight: 700 }}
          >
            {label}
          </Typography>

          <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
            {value}
          </Typography>
        </Box>
      </Box>

      {hint ? (
        <Typography variant="caption" sx={{ color: "var(--nx-muted)", fontSize: "0.76rem", display: "block", mt: 0.8 }}>
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
        background: "var(--nx-panel-2)",
        border: "1px dashed var(--nx-border)",
        textAlign: "center",
      }}
    >
      <Typography sx={{ color: "var(--nx-text)", fontWeight: 800, fontSize: 13 }}>{title}</Typography>
      <Typography variant="caption" sx={{ color: "var(--nx-muted)", display: "block", mt: 0.35 }}>
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
        border: "1px solid var(--nx-border)",
        background: "var(--nx-panel-2)",
        transition: "border-color 150ms ease, background-color 150ms ease",
        "&:hover": {
          borderColor: isDone ? "var(--nx-green)" : "var(--nx-blue)",
          background: "var(--nx-card)",
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
            color: isDone ? "var(--nx-green)" : "var(--nx-blue)",
            background: isDone ? "color-mix(in srgb, var(--nx-green) 12%, transparent)" : "color-mix(in srgb, var(--nx-blue) 12%, transparent)",
            flex: "0 0 auto",
            "& svg": { fontSize: 17 },
          }}
        >
          {isDone ? <CheckCircleRoundedIcon /> : <ScheduleRoundedIcon />}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 850, color: "var(--nx-text)" }} noWrap>
            {getTaskTitle(task)}
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--nx-muted)", fontSize: "0.72rem" }}>
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
  const projectsQuery = useManagerProjects(!authLoading);
  const tasksQuery = useManagerTasks(!authLoading);
  const developersQuery = useManagerDevelopers(!authLoading);
  const shouldLoadTickets =
    !authLoading &&
    (projectsQuery.isSuccess || tasksQuery.isSuccess);
  const emailTicketsQuery = useRecentEmailTickets(shouldLoadTickets);
  const { refetch: refetchProjects } = projectsQuery;
  const { refetch: refetchTasks } = tasksQuery;
  const { refetch: refetchDevelopers } = developersQuery;
  const { refetch: refetchEmailTickets } = emailTicketsQuery;

  const queryClient = useQueryClient();
  const managerScope = React.useMemo(() => String(user?.id ?? user?.email ?? ""), [user?.id, user?.email]);

  const loadDashboard = React.useCallback(() => {
    try {
      queryClient.invalidateQueries({ queryKey: managerKeys.projects(managerScope) });
      queryClient.invalidateQueries({ queryKey: managerKeys.tasks(managerScope) });
      queryClient.invalidateQueries({ queryKey: managerKeys.developers(managerScope) });
    } catch (e) {
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
  useLiveRefresh(liveTopics, loadDashboard, { debounceMs: 2500 });

  React.useEffect(() => {
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
  const initialLoading =
    authLoading ||
    (projectsQuery.isLoading && !projectsQuery.data) ||
    (tasksQuery.isLoading && !tasksQuery.data);
  const progressLoading = developersQuery.isLoading || tasksQuery.isLoading;
  const ticketLoading = emailTicketsQuery.isLoading && !emailTicketsQuery.data;
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

    const totalPointValue = Number(task?.totalPointValue ?? task?.totalStoryPoints ?? 0);
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

    if (hasTaskAssignee(existingTask) && !hasTaskAssignee(merged)) {
      return existingTask;
    }

    return merged;
  };

  const tasks = useMemo(() => {
    const taskMap = new Map();

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
        taskMap.set(`_no_id_${taskMap.size}`, task);
      } else {
        taskMap.set(idKey, task);
      }
    });

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
          taskMap.set(`_no_id_${taskMap.size}`, task);
        } else if (taskMap.has(idKey)) {
          const existing = taskMap.get(idKey);
          taskMap.set(idKey, mergeTaskObjects(existing, task));
        } else {
          taskMap.set(idKey, task);
        }
      });
    });

    return Array.from(taskMap.values());
  }, [managerTasks, projects]);

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
        (sum, task) => sum + Number(task?.totalPointValue ?? 0),
        0
      );
      const completedPointValue = projectTaskList.reduce(
        (sum, task) => {
          const taskTotal = Number(task?.totalPointValue ?? 0);
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
      (sum, task) => sum + Number(task?.totalPointValue ?? task?.totalStoryPoints ?? 0),
      0
    );
    const completedPointValue = dashboardTasks.reduce((sum, task) => {
      const taskTotal = Number(task?.totalPointValue ?? task?.totalStoryPoints ?? 0);
      return sum + Number(task?.completedPointValue ?? task?.completedStoryPoints ?? (isCompletedTask(task) ? taskTotal : 0));
    }, 0);

    if (totalPointValue === 0) return 0;
    return Math.round((completedPointValue / totalPointValue) * 100);
  }, [dashboardTasks]);

  const totalWeighted = useMemo(
    () => dashboardTasks.reduce((sum, task) => sum + Number(task?.totalPointValue ?? 0), 0),
    [dashboardTasks]
  );

  const doneWeighted = useMemo(
    () => dashboardTasks.reduce((sum, task) => {
      const taskTotal = Number(task?.totalPointValue ?? task?.totalStoryPoints ?? 0);
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
    const projectIds = new Set(projects.map((p) => getProjectId(p)).filter(Boolean));
    
    return [...tickets]
      .filter((ticket) => {
        const ticketProjectId = String(
          ticket?.projectId ??
          ticket?.project_id ??
          ticket?.project?.id ??
          ticket?.projectDetails?.id ??
          ""
        ).trim();
        
        if (!ticketProjectId) return isVisibleSnapshotTicket(ticket);
        
        if (projectIds.has(ticketProjectId)) return isVisibleSnapshotTicket(ticket);
        
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

  if (initialLoading) {
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
            bgcolor: "var(--nx-panel-2)",
            "& .MuiLinearProgress-bar": { bgcolor: "var(--nx-purple)" },
          }}
        />
      ) : null}

      <DashboardHero
        icon={<DashboardRoundedIcon />}
        title="Manager Dashboard"
      />

      {}

      {initialLoading ? (
        <Grid container spacing={1.6} sx={{ mb: 2.4 }}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} lg={3} key={i}>
              <Paper
                sx={{
                  p: 1.6,
                  borderRadius: 2,
                  bgcolor: "var(--nx-card)",
                  border: "1px solid var(--nx-border)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 2,
                      bgcolor: "var(--nx-panel-2)",
                      animation: "pulse 2s infinite",
                      "@keyframes pulse": {
                        "0%, 100%": { opacity: 0.5 },
                        "50%": { opacity: 1 },
                      },
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        height: 16,
                        borderRadius: 1,
                        bgcolor: "var(--nx-panel-2)",
                        mb: 0.8,
                        animation: "pulse 2s infinite",
                        "@keyframes pulse": {
                          "0%, 100%": { opacity: 0.5 },
                          "50%": { opacity: 1 },
                        },
                      }}
                    />
                    <Box
                      sx={{
                        height: 24,
                        borderRadius: 1,
                        bgcolor: "var(--nx-panel-2)",
                        animation: "pulse 2s infinite",
                        "@keyframes pulse": {
                          "0%, 100%": { opacity: 0.5 },
                          "50%": { opacity: 1 },
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
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
      )}

      <Paper sx={{ ...sectionCardSx, mb: 2.35, p: { xs: 2.6, md: 3 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.2} sx={{ mb: 1.35 }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography sx={{ fontWeight: 950, fontSize: "1rem", color: "var(--nx-text)" }}>Projects Overview</Typography>
              <SmallBadge color="var(--nx-blue)" glow="var(--nx-panel-2)">ACTIVE: {activeProjectCount}</SmallBadge>
            </Stack>
          </Box>
        </Stack>

        <Grid container spacing={1.2}>
        </Grid>

        <Box sx={{ mt: 1.8 }}>
          {projectRows.length === 0 ? (
            <EmptyMiniState title="No projects found." text="All projects will appear here once they are loaded." />
          ) : (
            <>
            <Grid container spacing={1.6} sx={{ mt: 1 }}>
              {(expandProjects ? projectRows : projectRows.slice(0, 3)).map((project) => {
                const progressTone = project.progress >= 80 ? "var(--nx-green)" : project.progress >= 40 ? "var(--nx-blue)" : "var(--nx-red)";
                const statusTone = project.status === "Active" ? "var(--nx-green)" : project.status === "Completed" ? "var(--nx-blue)" : "var(--nx-red)";
                const statusBg = project.status === "Active" ? "var(--nx-panel-2)" : project.status === "Completed" ? "var(--nx-panel-2)" : "var(--nx-panel-2)";

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
                        p: 2,
                        minHeight: 84,
                        borderRadius: 2.4,
                        border: "1px solid var(--nx-border)",
                        background: "var(--nx-panel-2)",
                        cursor: "pointer",
                        transition: "border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease",
                        outline: "none",
                        "&:hover": {
                          borderColor: "var(--nx-border-strong)",
                          background: "var(--nx-card)",
                          boxShadow: "var(--nx-shadow)",
                        },
                        "&:focus-visible": {
                          boxShadow: "0 0 0 3px color-mix(in srgb, var(--nx-blue) 22%, transparent)",
                        },
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 0.3 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 800, color: "var(--nx-text)", fontSize: "0.94rem" }} noWrap>
                            {project.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "var(--nx-muted)",
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

                      <Typography variant="caption" sx={{ color: "var(--nx-text-soft)", display: "block", mb: 0.15, fontSize: "0.72rem" }}>
                        {project.doneTasks}/{project.totalTasks} tasks complete · {project.completedPointValue}/{project.totalPointValue} points
                      </Typography>

                      <LinearProgress
                        variant="determinate"
                        value={project.progress}
                        sx={{
                          height: 6,
                          borderRadius: 999,
                          bgcolor: "var(--nx-panel)",
                          mb: 0.45,
                          "& .MuiLinearProgress-bar": { bgcolor: progressTone },
                        }}
                      />

                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mt: 0.3 }}>
                        <SmallBadge color="var(--nx-blue)" glow="var(--nx-panel-2)">
                          {project.totalTasks} TASKS
                        </SmallBadge>
                        <SmallBadge color="var(--nx-purple)" glow="var(--nx-panel-2)">
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
                    color: "var(--nx-blue)",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    "&:hover": { color: "var(--nx-purple)" },
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
          p: { xs: 2.4, md: 2.6 },
        }}
      >
        <Box>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.2} sx={{ mb: 1.45 }}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography sx={{ fontWeight: 950, fontSize: "1rem", color: "var(--nx-text)" }}>Ticket Snapshot</Typography>
                <SmallBadge color="var(--nx-blue)" glow="var(--nx-panel-2)">OPEN: {openTicketCount}</SmallBadge>
              </Stack>
                {ticketLoading ? (
                  <Typography variant="caption" sx={{ color: "var(--nx-muted)", mt: 0.75 }}>
                    Loading ticket snapshot...
                  </Typography>
                ) : null}

                {emailTicketsQuery.error ? (
                  <ErrorNotice message={emailTicketsQuery.error.message || String(emailTicketsQuery.error)} severity="error" sx={{ mt: 1, mb: 1.2 }} dedupeKey="manager-email-tickets-error" />
                ) : null}
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/manager/tickets")}
              sx={{ textTransform: "none", borderColor: "var(--nx-border)", color: "var(--nx-text)" }}
            >
              View All
            </Button>
          </Stack>

          <Grid container spacing={1.6} sx={{ mt: 1 }}>
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

      <Paper sx={{ ...sectionCardSx, mb: 2.35, p: { xs: 2.4, md: 2.6 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.2} sx={{ mb: 1.45 }}>
          <Box>
            <Typography sx={{ fontWeight: 950, fontSize: "1rem", color: "var(--nx-text)" }}>Developer Progress</Typography>
          </Box>
          <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
            <SmallBadge color="var(--nx-blue)" glow="var(--nx-panel-2)">ASSIGNED: {developerProgressBadgeStats.assignedTaskCount}</SmallBadge>
            <SmallBadge color="var(--nx-purple)" glow="var(--nx-panel-2)">STORY: {developerProgressBadgeStats.storyPointsLabel}</SmallBadge>
            <SmallBadge color="var(--nx-green)" glow="var(--nx-panel-2)">WEIGHTED: {developerProgressBadgeStats.weightedPointsLabel}</SmallBadge>
            <SmallBadge color="var(--nx-yellow)" glow="var(--nx-panel-2)">DELAYED: {developerProgressBadgeStats.delayedTaskCount}</SmallBadge>
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
                borderColor: "var(--nx-border)",
                color: "var(--nx-text)",
              }}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>
        <Box sx={{ mt: 0.9, px: { xs: 0.5, md: 0 }, '& .MuiTableCell-root': { py: 0.6, px: 1 } }}>
          <ManagerDeveloperProgress
            hideSummary
            hideHeader
            projectsData={projects}
            developersData={developers}
            tasksData={dashboardTasks}
            loadingOverride={progressLoading}
            errorOverride={developersQuery.error || tasksQuery.error || null}
            onRetry={() => Promise.all([developersQuery.refetch(), tasksQuery.refetch()])}
            onTotalsChange={handleDeveloperProgressTotalsChange}
          />
        </Box>
      </Paper>

      <Paper sx={sectionCardSx}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.2} sx={{ mb: 1.3 }}>
          <Box>
            <Typography sx={{ fontWeight: 950, fontSize: "1rem", color: "var(--nx-text)" }}>Task Focus</Typography>
          </Box>
          <Stack direction="row" spacing={0.8}>
            <StatusBadge label={`OPEN ${openTasks.length}`} variant="info" />
            <StatusBadge label={`DONE ${recentCompletedTasks.length}`} variant="success" />
          </Stack>
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.6 }}>
            <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.85 }}>
              <Stack direction="row" alignItems="center" spacing={0.9}>
                  <ScheduleRoundedIcon sx={{ color: "var(--nx-blue)", fontSize: 18 }} />
                  <Typography variant="caption" sx={{ color: "var(--nx-muted)", textTransform: "uppercase", fontWeight: 900, fontSize: "0.72rem" }}>
                  Upcoming Open Tasks
                </Typography>
              </Stack>
                <SmallBadge color="var(--nx-blue)" glow="var(--nx-panel-2)">{upcomingTasks.length}</SmallBadge>
            </Stack>
            {upcomingTasks.length === 0 ? (
              <EmptyMiniState title="No open tasks." text="Upcoming work will appear here." />
            ) : (
              <Stack spacing={0.9}>
                {upcomingTasks.map((task, index) => (
                  <TaskFocusRow key={task?.id || `open-${index}`} task={task} type="open" getTaskTitle={getTaskTitle} getTaskDate={getTaskDate} />
                ))}
              </Stack>
            )}
          </Box>

          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.85 }}>
              <Stack direction="row" alignItems="center" spacing={0.9}>
                  <CheckCircleRoundedIcon sx={{ color: "var(--nx-green)", fontSize: 18 }} />
                  <Typography variant="caption" sx={{ color: "var(--nx-muted)", textTransform: "uppercase", fontWeight: 900, fontSize: "0.72rem" }}>
                  Recently Completed
                </Typography>
              </Stack>
                <SmallBadge color="var(--nx-green)" glow="var(--nx-panel-2)">{recentCompletedTasks.length}</SmallBadge>
            </Stack>
            {recentCompletedTasks.length === 0 ? (
              <EmptyMiniState title="No completed tasks yet." text="Completed work will appear here." />
            ) : (
              <Stack spacing={0.9}>
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


