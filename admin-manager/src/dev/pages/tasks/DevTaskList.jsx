import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  LinearProgress,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Card from "../../../components/ui/Card.jsx";
import { loadTasks } from "../../data/taskStore";
import { syncAssignedTasksToLocalStoreSafe } from "../../data/taskApi";
import useLiveRefresh from "../../../hooks/useLiveRefresh";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";
import {
  getTaskSourceLabel,
  getTicketTaskCategoryLabel,
  isProjectTask,
  isTicketTask,
} from "../../utils/taskSource";

function isCompleted(task) {
  const status = String(task?.status || "").toLowerCase();
  return status === "completed" || status === "done";
}

function isActive(task) {
  return !isCompleted(task);
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getTaskSearchText(task) {
  return `${task.id} ${task.title} ${task.description} ${task.projectName || ""} ${getTaskSourceLabel(task)}`.toLowerCase();
}

function getProgressBadgeColor(progress) {
  if (progress >= 80) return "success";
  if (progress >= 40) return "info";
  return "default";
}

function getProgressData(task) {
  const totalPointValue = numberOrZero(task?.totalPointValue);
  const completedPointValue = numberOrZero(task?.completedPointValue);

  if (totalPointValue > 0) {
    return {
      totalPointValue,
      completedPointValue,
      progress: Math.round((completedPointValue * 100) / totalPointValue),
    };
  }

  return {
    totalPointValue: numberOrZero(task?.totalStoryPoints),
    completedPointValue: numberOrZero(task?.completedStoryPoints),
    progress: numberOrZero(task?.progressPercentage),
  };
}

export default function DevTaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState(() => loadTasks());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const synced = await syncAssignedTasksToLocalStoreSafe();
      setTasks(Array.isArray(synced) ? synced : loadTasks());
    } catch (err) {
      setError(err?.message || "Failed to load developer tasks.");
      setTasks(loadTasks());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useLiveRefresh(["/topic/tasks", "/topic/developer.dashboard"], loadData, {
    debounceMs: 400,
  });

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const text = getTaskSearchText(task);
      return q === "" ? true : text.includes(q);
    });
  }, [tasks, search]);

  const projectTasksAll = useMemo(
    () => tasks.filter(isProjectTask),
    [tasks]
  );

  const ticketTasksAll = useMemo(
    () => tasks.filter(isTicketTask),
    [tasks]
  );

  const projectTasks = useMemo(
    () => filteredTasks.filter(isProjectTask),
    [filteredTasks]
  );

  const ticketTasks = useMemo(
    () => filteredTasks.filter(isTicketTask),
    [filteredTasks]
  );

  const ticketCategoryCounts = useMemo(
    () => ticketTasks.reduce(
      (acc, task) => {
        const label = getTicketTaskCategoryLabel(task);
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      },
      { Chat: 0, Email: 0, "Client Portal": 0, Manager: 0, Ticket: 0 }
    ),
    [ticketTasks]
  );

  const stats = useMemo(() => {
    const completed = tasks.filter(isCompleted).length;

    const totalPoints = tasks.reduce((sum, task) => sum + numberOrZero(task.totalPointValue), 0);
    const completedPoints = tasks.reduce((sum, task) => sum + numberOrZero(task.completedPointValue), 0);
    const progress = totalPoints > 0 ? Math.round((completedPoints * 100) / totalPoints) : 0;

    return {
      projectTasks: projectTasksAll.length,
      ticketTasks: ticketTasksAll.length,
      completed,
      totalPoints,
      completedPoints,
      progress,
    };
  }, [tasks, projectTasksAll.length, ticketTasksAll.length]);

  return (
    <>
      <Box
        sx={{
          mb: 3,
          p: { xs: 2.5, md: 3 },
          borderRadius: 4,
          border: "1px solid rgba(148,163,184,0.14)",
          background:
            "linear-gradient(135deg, rgba(124,92,255,0.18) 0%, rgba(11,22,40,0.94) 100%)",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: -0.5 }}>
          My Tasks
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)", mt: 0.75 }}>
          Tasks assigned to your developer account. Progress is calculated using weighted story points.
        </Typography>
      </Box>

      {error ? <Alert severity="warning" sx={{ mb: 3 }}>{error}</Alert> : null}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <StatCard label="Project Tasks" value={stats.projectTasks} />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard label="Ticket Tasks" value={stats.ticketTasks} hint="Converted from tickets" />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard label="Completed" value={stats.completed} />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard label="Weighted Progress" value={`${stats.progress}%`} hint={`${stats.completedPoints}/${stats.totalPoints} pts`} />
        </Grid>
      </Grid>

      <TextField
        fullWidth
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search tasks, project name, or id..."
        sx={{
          mb: 3,
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            bgcolor: "rgba(15,23,42,0.72)",
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 240 }}>
          <CircularProgress sx={{ color: "#6b51ff" }} />
        </Box>
      ) : (
        <Box sx={{ display: "grid", gap: 2.5 }}>
          <TaskTableSection
            title="Project Tasks"
            subtitle="Normal project work assigned to you"
            count={projectTasks.length}
            rows={projectTasks}
            emptyMessage="No project tasks assigned yet."
            showSource={false}
            onOpenTask={(task) => navigate(`/dev/tasks/${task.id}`)}
          />

          <TaskTableSection
            title="Ticket Tasks"
            subtitle="Tasks converted from chat, email, and client portal tickets"
            count={ticketTasks.length}
            rows={ticketTasks}
            emptyMessage="No ticket tasks assigned yet."
            showSource
            sourceSummary={ticketCategoryCounts}
            onOpenTask={(task) => navigate(`/dev/tasks/${task.id}`)}
          />
        </Box>
      )}
    </>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="caption" sx={{ opacity: 0.7 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          {hint}
        </Typography>
      ) : null}
    </Card>
  );
}

function TaskTableSection({
  title,
  subtitle,
  count,
  rows,
  emptyMessage,
  showSource = false,
  sourceSummary = null,
  onOpenTask,
}) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "flex-start", mb: 1.5 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 950, letterSpacing: -0.25 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.72)", mt: 0.4 }}>
            {subtitle}
          </Typography>
        </Box>

        <Chip label={count} size="small" sx={{ fontWeight: 900 }} />
      </Box>

      {showSource && sourceSummary ? (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
          <Chip size="small" variant="outlined" label={`Chat: ${sourceSummary.Chat || 0}`} />
          <Chip size="small" variant="outlined" label={`Email: ${sourceSummary.Email || 0}`} />
          <Chip size="small" variant="outlined" label={`Client Portal: ${sourceSummary["Client Portal"] || 0}`} />
        </Box>
      ) : null}

      {rows.length === 0 ? (
        <Card sx={{ p: 3, textAlign: "center", bgcolor: "rgba(15,23,42,0.55)" }}>
          <Typography variant="body1">{emptyMessage}</Typography>
        </Card>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Box
            component="table"
            sx={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              minWidth: 760,
            }}
          >
            <Box component="thead">
              <Box component="tr">
                <TableHeadCell>Task</TableHeadCell>
                {showSource ? <TableHeadCell>Source</TableHeadCell> : null}
                <TableHeadCell>Project</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Progress</TableHeadCell>
                <TableHeadCell align="right">Points</TableHeadCell>
              </Box>
            </Box>

            <Box component="tbody">
              {rows.map((task) => {
                const progressData = getProgressData(task);

                return (
                  <Box
                    component="tr"
                    key={task.id}
                    onClick={() => onOpenTask?.(task)}
                    sx={{
                      cursor: "pointer",
                      transition: "background-color 140ms ease",
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.03)" },
                    }}
                  >
                    <TableBodyCell>
                      <Typography sx={{ fontWeight: 850 }} noWrap>
                        {task.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.62)" }}>
                        {task.id}
                      </Typography>
                    </TableBodyCell>

                    {showSource ? (
                      <TableBodyCell>
                        <Chip size="small" label={getTaskSourceLabel(task)} variant="outlined" />
                      </TableBodyCell>
                    ) : null}

                    <TableBodyCell>
                      <Typography variant="body2" sx={{ color: "rgba(231,233,238,0.8)" }} noWrap>
                        {task.projectName || "Backend Project"}
                      </Typography>
                    </TableBodyCell>

                    <TableBodyCell>
                      <StatusBadge label={task.status || "Todo"} />
                    </TableBodyCell>

                    <TableBodyCell>
                      <Box sx={{ minWidth: 150 }}>
                        <LinearProgress
                          variant="determinate"
                          value={progressData.progress}
                          sx={{
                            height: 7,
                            borderRadius: 999,
                            bgcolor: "rgba(255,255,255,0.08)",
                            "& .MuiLinearProgress-bar": {
                              bgcolor: progressData.progress >= 80 ? "#22c55e" : "#6d5dfc",
                            },
                          }}
                        />
                        <Typography variant="caption" sx={{ color: "rgba(231,233,238,0.62)", mt: 0.35, display: "block" }}>
                          {progressData.progress}%
                        </Typography>
                      </Box>
                    </TableBodyCell>

                    <TableBodyCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {progressData.completedPointValue}/{progressData.totalPointValue} pts
                      </Typography>
                    </TableBodyCell>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      )}
    </Card>
  );
}

function TableHeadCell({ children, align = "left" }) {
  return (
    <Box
      component="th"
      sx={{
        textAlign: align,
        px: 1.5,
        py: 1.1,
        color: "rgba(255,255,255,0.7)",
        fontSize: 12,
        fontWeight: 800,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </Box>
  );
}

function TableBodyCell({ children, align = "left" }) {
  return (
    <Box
      component="td"
      sx={{
        px: 1.5,
        py: 1.1,
        verticalAlign: "middle",
        textAlign: align,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {children}
    </Box>
  );
}





