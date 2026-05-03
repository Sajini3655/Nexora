import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import DeveloperTaskProgress from "../../components/tasks/DeveloperTaskProgress";
import { loadTasks } from "../../data/taskStore";
import { syncAssignedTasksToLocalStoreSafe } from "../../data/taskApi";
import useLiveRefresh from "../../../hooks/useLiveRefresh";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import DashboardHero from "../../../components/ui/DashboardHero.jsx";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";

function isCompletedTask(task) {
  const status = String(task?.status || "").toLowerCase();
  return status === "completed" || status === "done";
}

function isActiveTask(task) {
  const status = String(task?.status || "").toLowerCase();
  return (
    status === "assigned" ||
    status === "in progress" ||
    status === "todo" ||
    status === "in_progress"
  );
}

function getPointTotals(task) {
  const totalPointValue = Number(
    task?.totalPointValue ?? task?.estimatedPoints ?? task?.pointValue ?? 0
  );

  const completedPointValue = Number(
    task?.completedPointValue ?? task?.completedPoints ?? 0
  );

  const fallbackTotal = Number(task?.totalStoryPoints ?? 0);
  const fallbackCompleted = Number(task?.completedStoryPoints ?? 0);

  const total = totalPointValue > 0 ? totalPointValue : fallbackTotal;
  const completed =
    totalPointValue > 0 ? completedPointValue : fallbackCompleted;

  const progress =
    total > 0 ? Math.round((completed * 100) / total) : isCompletedTask(task) ? 100 : 0;

  return { total, completed, progress };
}

function getProjectKey(task) {
  return String(
    task?.projectId ||
      task?.project?.id ||
      task?.projectName ||
      task?.project?.name ||
      "project"
  );
}

function getProjectName(task) {
  return task?.projectName || task?.project?.name || "Assigned work";
}

function buildProjectSummaries(tasks) {
  const summaries = new Map();

  tasks.forEach((task) => {
    const key = getProjectKey(task);

    const current = summaries.get(key) || {
      key,
      id: task?.projectId || task?.project?.id || null,
      name: getProjectName(task),
      tasks: 0,
      active: 0,
      completed: 0,
      totalPoints: 0,
      completedPoints: 0,
      progress: 0,
    };

    const totals = getPointTotals(task);

    current.tasks += 1;
    current.active += isCompletedTask(task) ? 0 : 1;
    current.completed += isCompletedTask(task) ? 1 : 0;
    current.totalPoints += totals.total;
    current.completedPoints += totals.completed;

    current.progress =
      current.totalPoints > 0
        ? Math.round((current.completedPoints * 100) / current.totalPoints)
        : Math.round((current.completed * 100) / Math.max(current.tasks, 1));

    summaries.set(key, current);
  });

  return Array.from(summaries.values()).sort(
    (a, b) => b.completedPoints - a.completedPoints
  );
}

export default function DevDashboardHome() {
  const [tasks, setTasks] = useState(() => loadTasks());
  const [loading, setLoading] = useState(() => loadTasks().length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (options = {}) => {
    const isBackground = Boolean(options.background);

    try {
      if (isBackground) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const syncedTasks = await syncAssignedTasksToLocalStoreSafe();
      setTasks(Array.isArray(syncedTasks) ? syncedTasks : loadTasks());
    } catch (err) {
      setError(err?.message || "Failed to load developer dashboard data.");
      setTasks(loadTasks());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard({ background: tasks.length > 0 });
  }, [loadDashboard]);

  const liveTopics = useMemo(
    () => ["/topic/developer.dashboard", "/topic/tasks"],
    []
  );

  const refreshDashboard = useCallback(() => {
    loadDashboard({ background: true });
  }, [loadDashboard]);

  useLiveRefresh(liveTopics, refreshDashboard, { debounceMs: 900 });

  const activeTasks = useMemo(
    () => tasks.filter((task) => !isCompletedTask(task)),
    [tasks]
  );

  const completedTasks = useMemo(
    () => tasks.filter((task) => isCompletedTask(task)),
    [tasks]
  );

  const projectSummaries = useMemo(() => buildProjectSummaries(tasks), [tasks]);

  const totals = useMemo(() => {
    const aggregate = tasks.reduce(
      (acc, task) => {
        const pointTotals = getPointTotals(task);
        acc.totalPoints += pointTotals.total;
        acc.completedPoints += pointTotals.completed;
        return acc;
      },
      { totalPoints: 0, completedPoints: 0 }
    );

    const progress =
      aggregate.totalPoints > 0
        ? Math.round((aggregate.completedPoints * 100) / aggregate.totalPoints)
        : tasks.length > 0
          ? Math.round((completedTasks.length * 100) / tasks.length)
          : 0;

    return {
      tasks: tasks.length,
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      totalPoints: aggregate.totalPoints,
      completedPoints: aggregate.completedPoints,
      progress,
    };
  }, [tasks, activeTasks.length, completedTasks.length]);

  const topActiveTasks = activeTasks.slice(0, 4);
  const topProjects = projectSummaries.slice(0, 4);

  return (
    <Box
      sx={{
        maxWidth: 1320,
        mx: "auto",
        px: { xs: 2, md: 3 },
        pt: { xs: 1, md: 0.75 },
        pb: { xs: 2, md: 3 },
        "& .MuiTypography-caption": { fontSize: 13.5 },
        "& .MuiTypography-body2": { fontSize: 14.5 },
      }}
    >
      {/* Header */}
      <Box sx={{ mt: { xs: -1.5, md: -1.5 }, mb: { xs: 3, md: 6 } }}>
        <DashboardHero
          icon={<CodeRoundedIcon />}
          title="Developer Dashboard"
        />
      </Box>

      {error ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      {refreshing && !loading ? (
        <LinearProgress
          sx={{
            mb: 3,
            height: 4,
            borderRadius: 999,
            bgcolor: "rgba(255,255,255,0.08)",
            "& .MuiLinearProgress-bar": { bgcolor: "#6d5dfc" },
          }}
        />
      ) : null}

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 360, borderRadius: 3 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress sx={{ color: "#6d5dfc" }} />
            <Typography sx={{ color: "#94a3b8", fontSize: 14 }}>
              Loading your dashboard...
            </Typography>
          </Stack>
        </Box>
      ) : (
        <Stack spacing={4}>
          {/* Summary Stats */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 2.5,
            }}
          >
            <StatCard
              title="Assigned Tasks"
              value={totals.tasks}
              hint={`${totals.activeTasks} active`}
              icon="📋"
            />

            <StatCard
              title="Completed Tasks"
              value={totals.completedTasks}
              hint={`${totals.completedPoints} points done`}
              icon="✓"
            />

            <StatCard
              title="Weighted Progress"
              value={`${totals.progress}%`}
              hint={`${totals.completedPoints}/${totals.totalPoints} points`}
              icon="📊"
            />

            <StatCard
              title="Ticket Tasks"
              value={totals.tasks}
              hint="Converted to tasks"
              icon="🎫"
            />
          </Box>

          {/* Main Content Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
              gap: 3,
            }}
          >
            {/* Active Task List */}
            <ScrollPanel
              title="Active Task List"
              count={activeTasks.length}
              subtitle="Your current work in progress"
            >
              {activeTasks.length === 0 ? (
                <EmptyState icon="📭" message="No active tasks assigned yet." />
              ) : (
                <Stack spacing={0}>
                  {activeTasks.map((task) => {
                    const pointTotals = getPointTotals(task);
                    return (
                      <TaskRow
                        key={task.id}
                        task={task}
                        totalPoints={pointTotals.total}
                        completedPoints={pointTotals.completed}
                        progress={pointTotals.progress}
                      />
                    );
                  })}
                </Stack>
              )}
            </ScrollPanel>

            {/* My Projects */}
            <ScrollPanel
              title="My Projects"
              count={projectSummaries.length}
              subtitle="Your assigned project work"
            >
              {projectSummaries.length === 0 ? (
                <EmptyState icon="📁" message="No assigned projects yet." />
              ) : (
                <Stack spacing={0}>
                  {projectSummaries.map((project) => (
                    <ProjectProgressCard key={project.key} project={project} />
                  ))}
                </Stack>
              )}
            </ScrollPanel>
          </Box>

          {/* Task Progress Selector */}
          <DeveloperTaskProgress />
        </Stack>
      )}
    </Box>
  );
}

function StatCard({ title, value, hint, icon }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.6,
        borderRadius: 2,
        bgcolor: "#0f1b2f",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <Stack spacing={1.2}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
          <Typography
            sx={{
              color: "#94a3b8",
              fontWeight: 700,
              fontSize: "0.85rem",
            }}
          >
            {title}
          </Typography>
        </Box>

        <Box>
          <Typography
            sx={{
              fontWeight: 950,
              color: "#f8fafc",
              fontSize: "1.75rem",
              lineHeight: 1.1,
            }}
          >
            {value}
          </Typography>
        </Box>

        <Typography
          variant="caption"
          sx={{
            color: "#cbd5e1",
            fontSize: "0.8rem",
          }}
        >
          {hint}
        </Typography>
      </Stack>
    </Paper>
  );
}

function ScrollPanel({ title, subtitle, count, children }) {
  const scrollStyles = {
    maxHeight: 460,
    overflowY: "auto",
    overflowX: "hidden",
    pr: 1,
    "&::-webkit-scrollbar": { width: 8 },
    "&::-webkit-scrollbar-track": { backgroundColor: "rgba(15,23,42,0.35)" },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "rgba(148,163,184,0.28)",
      borderRadius: 999,
      "&:hover": { backgroundColor: "rgba(148,163,184,0.4)" },
    },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.035))",
        border: "1px solid rgba(148,163,184,0.14)",
        boxShadow: "0 20px 55px rgba(0,0,0,0.24)",
        display: "flex",
        flexDirection: "column",
        height: 540,
      }}
    >
      <Box sx={{ pb: 1.5, borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 0.4,
          }}
        >
          <Typography
            sx={{
              fontWeight: 950,
              fontSize: 18,
              color: "#f8fafc",
            }}
          >
            {title}
          </Typography>
          <Chip
            label={count}
            size="small"
            sx={{
              fontWeight: 900,
              fontSize: 11.5,
              height: 24,
              color: "#a78bfa",
              bgcolor: "rgba(124,92,255,0.15)",
              border: "1px solid rgba(124,92,255,0.32)",
            }}
          />
        </Box>

        {subtitle ? (
          <Typography
            variant="body2"
            sx={{
              color: "#94a3b8",
              fontSize: 12.5,
            }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Box>

      <Box sx={{ flex: 1, ...scrollStyles }}>{children}</Box>
    </Paper>
  );
}

function TaskRow({ task, totalPoints, completedPoints, progress }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        mb: 1,
        borderRadius: 2.5,
        bgcolor: "rgba(15,23,42,0.62)",
        border: "1px solid rgba(148,163,184,0.12)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          borderColor: "rgba(148,163,184,0.22)",
          bgcolor: "rgba(15,23,42,0.75)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        },
      }}
    >
      <Stack spacing={0.8}>
        {/* Header Row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: 14,
                color: "#f8fafc",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.3,
              }}
            >
              {task.title || "Untitled task"}
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                mt: 0.3,
                flexWrap: "wrap",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: "#94a3b8",
                  fontSize: 12,
                }}
              >
                {getProjectName(task)}
              </Typography>

              <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "#94a3b8" }} />

              <Chip
                label={task.priority || "Medium"}
                size="small"
                sx={{
                  height: 18,
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "#cbd5e1",
                  bgcolor: "rgba(148,163,184,0.1)",
                  border: "1px solid rgba(148,163,184,0.15)",
                }}
              />
            </Box>
          </Box>

          <StatusBadge label={task.status || "Assigned"} size="small" />
        </Box>

        {/* Progress Bar */}
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 0.4,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#94a3b8",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Progress
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "#a78bfa",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {progress}%
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 999,
              bgcolor: "rgba(255,255,255,0.08)",
              "& .MuiLinearProgress-bar": {
                bgcolor: "#6d5dfc",
                borderRadius: 999,
              },
            }}
          />
        </Box>

        {/* Story Points */}
        {totalPoints > 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              color: "#cbd5e1",
            }}
          >
            <span>Points</span>
            <span>
              <span style={{ color: "#a78bfa", fontWeight: 700 }}>
                {completedPoints}
              </span>
              <span style={{ color: "#94a3b8" }}>/{totalPoints}</span>
            </span>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

function ProjectProgressCard({ project }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        mb: 1,
        borderRadius: 2.5,
        bgcolor: "rgba(15,23,42,0.62)",
        border: "1px solid rgba(148,163,184,0.12)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          borderColor: "rgba(148,163,184,0.22)",
          bgcolor: "rgba(15,23,42,0.75)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        },
      }}
    >
      <Stack spacing={0.8}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 1,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: 14,
                color: "#f8fafc",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.3,
              }}
            >
              {project.name}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: "#94a3b8",
                mt: 0.2,
                fontSize: 12,
              }}
            >
              {project.tasks} task{project.tasks !== 1 ? "s" : ""} • {project.active} active • {project.completed} done
            </Typography>
          </Box>

          <Typography
            sx={{
              fontWeight: 950,
              color: "#a78bfa",
              fontSize: 17,
              whiteSpace: "nowrap",
            }}
          >
            {project.progress}%
          </Typography>
        </Box>

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={project.progress}
          sx={{
            height: 6,
            borderRadius: 999,
            bgcolor: "rgba(255,255,255,0.08)",
            "& .MuiLinearProgress-bar": {
              background: "linear-gradient(90deg, #a78bfa 0%, #c4b5fd 100%)",
              borderRadius: 999,
            },
          }}
        />
      </Stack>
    </Paper>
  );
}

function EmptyState({ icon, message }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 200,
        textAlign: "center",
        color: "#94a3b8",
      }}
    >
      <Box sx={{ fontSize: 48, mb: 1 }}>{icon}</Box>
      <Typography variant="body2" sx={{ fontSize: 14.5 }}>
        {message}
      </Typography>
    </Box>
  );
}


