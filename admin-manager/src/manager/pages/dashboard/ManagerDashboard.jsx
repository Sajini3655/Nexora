import React, { useCallback, useMemo } from "react";
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
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
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
import { useManagerProjects, useManagerTasks } from "../../data/useManager";
import { useRecentEmailTickets } from "../../data/useManagerTickets";
import useLiveRefresh from "../../../hooks/useLiveRefresh";
import ManagerDeveloperProgress from "../../components/progress/ManagerDeveloperProgress";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import DashboardHero from "../../../components/ui/DashboardHero.jsx";

const sectionCardSx = {
  p: { xs: 1.6, md: 1.9 },
  borderRadius: 3,
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

function IconPill({ icon, color, bg }) {
  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: 2.2,
        display: "grid",
        placeItems: "center",
        color,
        background: bg,
        border: `1px solid ${bg.replace("0.14", "0.28").replace("0.16", "0.32").replace("0.18", "0.34")}`,
        boxShadow: `0 10px 26px ${bg}`,
        flex: "0 0 auto",
        "& svg": { fontSize: 20 },
      }}
    >
      {icon}
    </Box>
  );
}

function StatCard({ label, value, hint, icon, color, bg }) {
  return (
    <Paper
      sx={{
        p: 1.55,
        minHeight: 134,
        borderRadius: 3,
        border: "1px solid rgba(148,163,184,0.16)",
        background:
          "linear-gradient(145deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.62) 100%)",
        boxShadow: `0 14px 38px rgba(0,0,0,0.23), inset 0 1px 0 rgba(255,255,255,0.035)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 1.15,
        overflow: "hidden",
        position: "relative",
        transition: "all 180ms ease",
        "&::after": {
          content: '""',
          position: "absolute",
          width: 95,
          height: 95,
          right: -34,
          top: -34,
          borderRadius: "50%",
          background: bg,
          filter: "blur(6px)",
          opacity: 0.75,
        },
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "rgba(148,163,184,0.26)",
          boxShadow: "0 20px 48px rgba(0,0,0,0.32)",
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.2} sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              color: "#94a3b8",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: 0.55,
              fontSize: "0.7rem",
            }}
          >
            {label}
          </Typography>
          <Typography sx={{ mt: 0.75, fontSize: 32, lineHeight: 1, fontWeight: 950, color: "#f8fafc" }}>
            {value}
          </Typography>
        </Box>
        <IconPill icon={icon} color={color} bg={bg} />
      </Stack>

      <Typography variant="caption" sx={{ position: "relative", zIndex: 1, color: "#64748b", fontSize: "0.76rem" }}>
        {hint}
      </Typography>
    </Paper>
  );
}

function DashboardMetricCard({ label, value, hint, icon, color, bg }) {
  return (
    <Paper
      sx={{
        p: 1.25,
        minHeight: 98,
        borderRadius: 2.6,
        border: "1px solid rgba(148,163,184,0.13)",
        borderLeft: `4px solid ${color}`,
        background: "rgba(15,23,42,0.54)",
        transition: "all 160ms ease",
        "&:hover": {
          background: "rgba(20,29,52,0.72)",
          borderColor: "rgba(148,163,184,0.22)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.05}>
        <IconPill icon={icon} color={color} bg={bg} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 900, textTransform: "uppercase", fontSize: "0.69rem" }}>
            {label}
          </Typography>
          <Typography sx={{ mt: 0.25, fontSize: 22, lineHeight: 1.05, fontWeight: 950, color: "#f8fafc" }}>
            {value}
          </Typography>
          {hint ? (
            <Typography variant="caption" sx={{ display: "block", mt: 0.35, color: "#64748b", fontSize: "0.73rem" }}>
              {hint}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </Paper>
  );
}

function TicketMetricCard({ label, value, hint, icon, color, bg }) {
  return (
    <Paper
      sx={{
        p: 1.35,
        minHeight: 112,
        borderRadius: 2.7,
        border: "1px solid rgba(148,163,184,0.15)",
        background:
          "linear-gradient(180deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.58) 100%)",
        boxShadow: `0 12px 30px rgba(0,0,0,0.2), 0 0 0 1px ${bg}`,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box>
          <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.45, fontSize: "0.69rem" }}>
            {label}
          </Typography>
          <Typography sx={{ mt: 0.6, fontSize: 28, lineHeight: 1, fontWeight: 950, color: "#f8fafc" }}>
            {value}
          </Typography>
        </Box>
        <IconPill icon={icon} color={color} bg={bg} />
      </Stack>
      <Typography variant="caption" sx={{ mt: 0.85, display: "block", color: "#64748b", fontSize: "0.75rem" }}>
        {hint}
      </Typography>
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
  const projectsQuery = useManagerProjects();
  const tasksQuery = useManagerTasks();
  const emailTicketsQuery = useRecentEmailTickets();

  // Trigger a coordinated refresh when live updates arrive
  const loadDashboard = React.useCallback(async () => {
    try {
      await Promise.all([
        projectsQuery.refetch(),
        tasksQuery.refetch(),
        emailTicketsQuery.refetch(),
      ]);
    } catch (e) {
      // swallow — individual queries handle errors
    }
  }, [projectsQuery, tasksQuery, emailTicketsQuery]);

  const liveTopics = React.useMemo(() => ["/topic/manager.dashboard", "/topic/tasks", "/topic/tickets"], []);
  useLiveRefresh(liveTopics, loadDashboard, { debounceMs: 500 });

  const projects = Array.isArray(projectsQuery.data) ? projectsQuery.data : [];
  const tasks = Array.isArray(tasksQuery.data) ? tasksQuery.data : [];
  const tickets = normalizeTicketList(emailTicketsQuery.data);
  const loading = projectsQuery.isLoading || tasksQuery.isLoading || emailTicketsQuery.isLoading;
  const refreshing = projectsQuery.isFetching || tasksQuery.isFetching || emailTicketsQuery.isFetching;
  const error =
    projectsQuery.error?.message ||
    tasksQuery.error?.message ||
    emailTicketsQuery.error?.message ||
    "";

  const normalizeTaskStatus = (task) =>
    String(task?.status || task?.taskStatus || task?.state || "")
      .trim()
      .toLowerCase();

  const isCompletedTask = (task) => {
    const status = normalizeTaskStatus(task);
    return (
      status === "done" ||
      status === "completed" ||
      status === "complete" ||
      status === "closed" ||
      status === "resolved"
    );
  };

  const getTaskTitle = (task) => task?.title || task?.taskName || task?.name || "Untitled Task";

  const getTaskDate = (task) => task?.dueDate || task?.deadline || task?.targetDate || null;

  const getProjectId = (project) =>
    String(project?.id ?? project?.projectId ?? project?.project_id ?? "");

  const getProjectName = (project) =>
    String(project?.name ?? project?.projectName ?? project?.title ?? "Untitled Project");

  const getProjectDescription = (project) =>
    project?.description ?? project?.projectDescription ?? "No description available.";

  const tasksByProject = useMemo(() => {
    const grouped = new Map();

    tasks.forEach((task) => {
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
  }, [tasks]);

  const projectRows = useMemo(() => {
    return projects.map((project) => {
      const projectId = getProjectId(project);
      const projectTaskList = Array.isArray(project?.tasks)
        ? project.tasks
        : tasksByProject.get(projectId) || [];
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
    const totalPointValue = tasks.reduce(
      (sum, task) => sum + Number(task?.totalPointValue ?? task?.estimatedPoints ?? 0),
      0
    );
    const completedPointValue = tasks.reduce((sum, task) => {
      const taskTotal = Number(task?.totalPointValue ?? task?.estimatedPoints ?? 0);
      return sum + Number(task?.completedPointValue ?? (isCompletedTask(task) ? taskTotal : 0));
    }, 0);

    if (totalPointValue === 0) return 0;
    return Math.round((completedPointValue / totalPointValue) * 100);
  }, [tasks]);

  const totalWeighted = useMemo(
    () => tasks.reduce((sum, task) => sum + Number(task?.totalPointValue ?? task?.estimatedPoints ?? 0), 0),
    [tasks]
  );

  const doneWeighted = useMemo(
    () => tasks.reduce((sum, task) => {
      const taskTotal = Number(task?.totalPointValue ?? task?.estimatedPoints ?? 0);
      return sum + Number(task?.completedPointValue ?? (isCompletedTask(task) ? taskTotal : 0));
    }, 0),
    [tasks]
  );

  const openTasks = useMemo(() => tasks.filter((task) => !isCompletedTask(task)), [tasks]);

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
    return tasks
      .filter((task) => isCompletedTask(task))
      .sort((a, b) => {
        const firstDate = a?.completedAt || a?.updatedAt || a?.createdAt || 0;
        const secondDate = b?.completedAt || b?.updatedAt || b?.createdAt || 0;
        return new Date(secondDate) - new Date(firstDate);
      })
      .slice(0, 3);
  }, [tasks]);

  const visibleTickets = useMemo(() => {
    return [...tickets]
      .filter(isVisibleSnapshotTicket)
      .sort((a, b) => getTicketTimestamp(b) - getTicketTimestamp(a));
  }, [tickets]);

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

  const assignedTaskCount = useMemo(
    () => tasks.filter((task) => normalizeTaskStatus(task) === "assigned").length,
    [tasks]
  );

  const delayedTaskCount = useMemo(
    () => tasks.filter((task) => {
      const dateValue = getTaskDate(task);
      if (!dateValue) return false;
      const date = new Date(dateValue);
      return !isCompletedTask(task) && date.getTime() > 0 && date.getTime() < Date.now();
    }).length,
    [tasks]
  );

  const storyPointsLabel = `${doneWeighted}/${totalWeighted}`;
  const weightedPointsLabel = `${doneWeighted}/${totalWeighted}`;

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
        subtitle="Track project delivery, inbound tickets, team workload, and developer progress."
        actionLabel="View Projects"
        onAction={() => navigate("/manager/projects")}
      />

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Grid container spacing={1.6} sx={{ mb: 2.4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Total Projects"
            value={projectRows.length}
            hint={`${activeProjectCount} active projects`}
            icon={<FolderRoundedIcon />}
            color="#7dd3fc"
            bg="rgba(56,189,248,0.16)"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Total Tasks"
            value={tasks.length}
            hint={`${openTasks.length} open tasks`}
            icon={<AssignmentTurnedInRoundedIcon />}
            color="#c4b5fd"
            bg="rgba(124,92,255,0.16)"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Weighted Progress"
            value={`${completionRate}%`}
            hint={`${doneWeighted}/${totalWeighted} points completed`}
            icon={<TrendingUpRoundedIcon />}
            color="#a5b4fc"
            bg="rgba(99,102,241,0.16)"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Weighted Done"
            value={doneWeighted}
            hint="Point value completed"
            icon={<DoneAllRoundedIcon />}
            color="#86efac"
            bg="rgba(34,197,94,0.16)"
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
              Project health summary without duplicating the full project list.
            </Typography>
          </Box>
          <Button variant="outlined" size="small" onClick={() => navigate("/manager/projects")} sx={{ textTransform: "none" }}>
            View All Projects
          </Button>
        </Stack>

        <Grid container spacing={1.2}>
          <Grid item xs={12} sm={6} lg={3}>
            <DashboardMetricCard label="Active Projects" value={activeProjectCount} hint="Currently moving" icon={<BoltRoundedIcon />} color="#60a5fa" bg="rgba(96,165,250,0.14)" />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <DashboardMetricCard label="Planning Projects" value={planningProjectCount} hint="Waiting for tasks" icon={<ScheduleRoundedIcon />} color="#fbbf24" bg="rgba(251,191,36,0.14)" />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <DashboardMetricCard label="Completed Projects" value={completedProjectCount} hint="Fully delivered" icon={<CheckCircleRoundedIcon />} color="#86efac" bg="rgba(134,239,172,0.14)" />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <DashboardMetricCard label="At Risk Projects" value={atRiskProjectCount} hint="Low progress" icon={<PriorityHighRoundedIcon />} color="#fda4af" bg="rgba(253,164,175,0.14)" />
          </Grid>
        </Grid>
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
              <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mt: 0.35 }}>
                Compact inbound ticket overview. Full ticket details stay in the Tickets page.
              </Typography>
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
              <TicketMetricCard label="Open Tickets" value={openTicketCount} hint="Active inbound requests" icon={<ConfirmationNumberRoundedIcon />} color="#7dd3fc" bg="rgba(56,189,248,0.16)" />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <TicketMetricCard label="High Priority" value={highPriorityTicketCount} hint="Needs manager attention" icon={<PriorityHighRoundedIcon />} color="#fda4af" bg="rgba(244,63,94,0.16)" />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <TicketMetricCard label="Latest Tickets" value={latestTicketCount} hint="Recent snapshot items" icon={<FiberNewRoundedIcon />} color="#c4b5fd" bg="rgba(124,92,255,0.16)" />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <TicketMetricCard label="Status" value={latestTicketCount > 0 ? "Active" : "None"} hint="Inbound pipeline" icon={<RadarRoundedIcon />} color="#fdba74" bg="rgba(251,146,60,0.16)" />
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
            <SmallBadge color="#bfdbfe" glow="rgba(96,165,250,0.14)">ASSIGNED: {assignedTaskCount}</SmallBadge>
            <SmallBadge color="#ddd6fe" glow="rgba(124,92,255,0.14)">STORY: {storyPointsLabel}</SmallBadge>
            <SmallBadge color="#a7f3d0" glow="rgba(34,197,94,0.14)">WEIGHTED: {weightedPointsLabel}</SmallBadge>
            <SmallBadge color="#fed7aa" glow="rgba(251,146,60,0.14)">DELAYED: {delayedTaskCount}</SmallBadge>
          </Stack>
        </Stack>
        <ManagerDeveloperProgress />
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