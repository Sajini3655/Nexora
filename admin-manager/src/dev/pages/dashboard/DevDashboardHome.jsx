import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
    <Stack
        spacing={3}
        sx={{
          pt: { xs: 0, md: 0 },
          "& .MuiTypography-caption": { fontSize: 13.5 },
          "& .MuiTypography-body2": { fontSize: 14.5 },
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
            Developer Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: "#94a3b8", fontSize: 15 }}>
            Overview of assigned tasks, progress, and active projects.
          </Typography>
        </Box>

        {error ? <Alert severity="warning">{error}</Alert> : null}

        {refreshing && !loading ? (
          <LinearProgress
            sx={{
              height: 4,
              borderRadius: 999,
              bgcolor: "rgba(255,255,255,0.08)",
              "& .MuiLinearProgress-bar": { bgcolor: "#6d5dfc" },
            }}
          />
        ) : null}

        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", minHeight: 260 }}>
            <CircularProgress sx={{ color: "#6d5dfc" }} />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(4, 1fr)",
                },
                gap: 2,
              }}
            >
              <StatCard
                title="Assigned Tasks"
                value={totals.tasks}
                hint={`${totals.activeTasks} active`}
                badge="Live"
                tone="blue"
              />

              <StatCard
                title="Completed Tasks"
                value={totals.completedTasks}
                hint={`${totals.completedPoints} points done`}
                badge="Done"
                tone="green"
              />

              <StatCard
                title="Weighted Progress"
                value={`${totals.progress}%`}
                hint={`${totals.completedPoints}/${totals.totalPoints} points`}
                badge="Story Points"
                tone="purple"
              />

              <StatCard
                title="Ticket Tasks"
                value={totals.tasks}
                hint="Converted tickets appear as tasks"
                badge="Backend"
                tone="cyan"
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                gap: 2,
              }}
            >
              <Panel title="Active Task List" subtitle="Compact list of your current work.">
                {topActiveTasks.length === 0 ? (
                  <EmptyText>No assigned tasks found.</EmptyText>
                ) : (
                  <Stack spacing={1.25}>
                    {topActiveTasks.map((task) => {
                      const pointTotals = getPointTotals(task);

                      return (
                        <TaskCard
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
              </Panel>

              <Panel title="My Projects" subtitle="Projects containing your assigned tasks.">
                {topProjects.length === 0 ? (
                  <EmptyText>No project data available yet.</EmptyText>
                ) : (
                  <Stack spacing={1.25}>
                    {topProjects.map((project) => (
                      <ProjectCard key={project.key} project={project} />
                    ))}
                  </Stack>
                )}
              </Panel>
            </Box>

            <DeveloperTaskProgress />
          </>
        )}
      </Stack>
  );
}

function StatCard({ title, value, hint, badge, tone = "purple" }) {
  const colors = {
    blue: {
      text: "#93c5fd",
      bg: "rgba(59,130,246,0.14)",
      border: "rgba(59,130,246,0.26)",
    },
    green: {
      text: "#86efac",
      bg: "rgba(34,197,94,0.12)",
      border: "rgba(34,197,94,0.24)",
    },
    purple: {
      text: "#c4b5fd",
      bg: "rgba(124,92,255,0.14)",
      border: "rgba(124,92,255,0.26)",
    },
    cyan: {
      text: "#67e8f9",
      bg: "rgba(6,182,212,0.12)",
      border: "rgba(6,182,212,0.24)",
    },
  };

  const color = colors[tone] || colors.purple;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.2,
        minHeight: 132,
        borderRadius: 3,
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.09), rgba(255,255,255,0.035))",
        border: "1px solid rgba(148,163,184,0.16)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.24)",
      }}
    >
      <Stack spacing={1.1}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography
            variant="body2"
            sx={{
              color: "#94a3b8",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              fontSize: 12.5,
            }}
          >
            {title}
          </Typography>

          {badge ? (
            <Chip
              size="small"
              label={badge}
              sx={{
                height: 22,
                color: color.text,
                bgcolor: color.bg,
                border: `1px solid ${color.border}`,
                fontWeight: 900,
                fontSize: 11.5,
              }}
            />
          ) : null}
        </Stack>

        <Typography sx={{ fontWeight: 950, color: "#f8fafc", fontSize: 30, lineHeight: 1.15 }}>
          {value}
        </Typography>

        <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: 14 }}>
          {hint}
        </Typography>
      </Stack>
    </Paper>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.035))",
        border: "1px solid rgba(148,163,184,0.14)",
        boxShadow: "0 20px 55px rgba(0,0,0,0.24)",
      }}
    >
      <Box sx={{ mb: 1.8 }}>
        <Typography sx={{ fontWeight: 950, fontSize: 19 }}>
          {title}
        </Typography>

        {subtitle ? (
          <Typography
            variant="body2"
            sx={{ color: "#94a3b8", display: "block", mt: 0.4, fontSize: 14 }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Box>

      {children}
    </Paper>
  );
}

function TaskCard({ task, totalPoints, completedPoints, progress }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.7,
        borderRadius: 2.5,
        bgcolor: "rgba(15,23,42,0.62)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <Stack spacing={1.1}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 15.5 }}>
              {task.title || "Untitled task"}
            </Typography>

            <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.25, fontSize: 14 }}>
              {getProjectName(task)} • {task.priority || "Medium"}
            </Typography>
          </Box>

          <StatusBadge label={task.status || "Assigned"} />
        </Stack>

        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.6 }}>
            <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: 13.5 }}>
              Weighted progress
            </Typography>

            <Typography variant="body2" sx={{ color: "#cbd5e1", fontSize: 13.5 }}>
              {progress}%
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 7,
              borderRadius: 999,
              bgcolor: "rgba(255,255,255,0.08)",
              "& .MuiLinearProgress-bar": { bgcolor: "#6d5dfc" },
            }}
          />
        </Box>

        <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: 13.5 }}>
          {completedPoints}/{totalPoints} point value completed
        </Typography>
      </Stack>
    </Paper>
  );
}

function ProjectCard({ project }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.7,
        borderRadius: 2.5,
        bgcolor: "rgba(15,23,42,0.62)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 15.5 }}>
              {project.name}
            </Typography>

            <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.25, fontSize: 14 }}>
              {project.tasks} tasks • {project.active} active • {project.completed} completed
            </Typography>
          </Box>

          <Typography sx={{ fontWeight: 950, color: "#c4b5fd", fontSize: 20 }}>
            {project.progress}%
          </Typography>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={project.progress}
          sx={{
            height: 7,
            borderRadius: 999,
            bgcolor: "rgba(255,255,255,0.08)",
            "& .MuiLinearProgress-bar": { bgcolor: "#a78bfa" },
          }}
        />
      </Stack>
    </Paper>
  );
}

function EmptyText({ children }) {
  return (
    <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: 14 }}>
      {children}
    </Typography>
  );
}

