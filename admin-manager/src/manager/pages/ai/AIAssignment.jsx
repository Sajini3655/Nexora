import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Chip,
  MenuItem,
  Divider,
  Stack,
  Paper,
} from "@mui/material";
import PageHeader from "../../../components/ui/PageHeader";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import {
  assignManagerTaskAssignee,
  fetchManagerDevelopers,
  fetchManagerTasks,
  getErrorMessage,
  suggestManagerTaskAssignment,
} from "../../../services/managerService";
import useLiveRefresh from "../../../hooks/useLiveRefresh";

function getProjectName(task) {
  return (
    task?.projectName ||
    task?.project_name ||
    task?.project?.name ||
    task?.projectTitle ||
    task?.project_title ||
    task?.project?.title ||
    "Project not provided"
  );
}

function getPriority(task) {
  return task?.priority || task?.taskPriority || "-";
}

function getStatus(task) {
  return task?.status || task?.taskStatus || "-";
}

function getAssignee(task) {
  return (
    task?.assignedToName ||
    task?.assigned_to_name ||
    task?.assignedTo?.name ||
    task?.assigneeName ||
    ""
  );
}

function getTaskLabel(task) {
  return `${task?.title || "Untitled Task"} — ${getProjectName(task)}`;
}

export default function AIAssignment() {
  const [developers, setDevelopers] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedDeveloperId, setSelectedDeveloperId] = useState("");

  const [suggestion, setSuggestion] = useState(null);
  const [loadingAssignManual, setLoadingAssignManual] = useState(false);
  const [loadingAssignAI, setLoadingAssignAI] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const [developersData, tasksData] = await Promise.all([
        fetchManagerDevelopers(),
        fetchManagerTasks(),
      ]);

      setDevelopers(Array.isArray(developersData) ? developersData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (e) {
      setMsg(getErrorMessage(e, "Failed to load developers or tasks."));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const liveTopics = useMemo(
    () => ["/topic/manager.dashboard", "/topic/tasks", "/topic/projects", "/topic/users"],
    []
  );
  useLiveRefresh(liveTopics, load, { debounceMs: 500 });

  const selectedTask = useMemo(
    () => tasks.find((t) => String(t?.id) === String(selectedTaskId)) || null,
    [tasks, selectedTaskId]
  );

  const canAssignManual = useMemo(
    () => Boolean(selectedTaskId && selectedDeveloperId),
    [selectedTaskId, selectedDeveloperId]
  );

  const canAssignAI = useMemo(
    () => Boolean(selectedTaskId && selectedTask?.title),
    [selectedTaskId, selectedTask]
  );

  const handleAssignManual = async () => {
    if (!canAssignManual) return;

    setMsg("");
    setSuggestion(null);
    setLoadingAssignManual(true);

    try {
      await assignManagerTaskAssignee(
        Number(selectedTaskId),
        Number(selectedDeveloperId)
      );

      const dev = developers.find(
        (d) => String(d?.id) === String(selectedDeveloperId)
      );

      setMsg(dev ? `Assigned to ${dev.name}.` : "Task assignment updated.");
      await load();
    } catch (e) {
      setMsg(getErrorMessage(e, "Manual assignment failed."));
    } finally {
      setLoadingAssignManual(false);
    }
  };

  const handleAssignWithAI = async () => {
    if (!canAssignAI || !selectedTask) return;

    setMsg("");
    setSuggestion(null);
    setLoadingAssignAI(true);

    try {
      const data = await suggestManagerTaskAssignment({
        title: selectedTask?.title || "",
        description: selectedTask?.description || "",
        estimatedPoints:
          selectedTask?.estimatedPoints != null
            ? Number(selectedTask.estimatedPoints)
            : null,
      });

      setSuggestion(data);

      const recommendedId = data?.recommendedDeveloper?.id;

      if (!recommendedId) {
        throw new Error("No AI recommendation available for this task.");
      }

      setSelectedDeveloperId(String(recommendedId));
      setMsg(`AI suggested: ${data.recommendedDeveloper.name}. Click \"Assign Manually\" to confirm.`);
    } catch (e) {
      setMsg(getErrorMessage(e, "AI assignment failed."));
    } finally {
      setLoadingAssignAI(false);
    }
  };

  const selectMenuProps = {
    PaperProps: {
      sx: {
        mt: 1,
        bgcolor: "#0f172a",
        color: "#e5e7eb",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 2,
        maxHeight: 320,
        boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
        "& .MuiMenuItem-root": {
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          py: 1.2,
        },
        "& .MuiMenuItem-root.Mui-selected": {
          bgcolor: "rgba(124,92,255,0.20)",
        },
        "& .MuiMenuItem-root:hover": {
          bgcolor: "rgba(124,92,255,0.14)",
        },
      },
    },
  };

  return (
    <Box sx={{ p: { xs: 0, md: 0.5 } }}>
      <PageHeader
        title="AI Task Assignment"
        subtitle="Assign developers to tasks using project context, priority, status, and backend recommendations."
        right={
          <Chip
            label={`Developers: ${developers.length}`}
            sx={{
              fontWeight: 700,
              color: "#a7f3d0",
              border: "1px solid rgba(16,185,129,0.28)",
              backgroundColor: "rgba(16,185,129,0.12)",
            }}
          />
        }
      />

      <Card
        sx={{
          p: 2.4,
          borderRadius: 3,
          border: "1px solid rgba(255,255,255,0.09)",
          background: "#0b1628",
          boxShadow: "none",
        }}
      >
        <Typography sx={{ fontWeight: 950, mb: 1.6, fontSize: 20 }}>
          Assign Developer
        </Typography>

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <Input
              select
              label="Task"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              SelectProps={{
                MenuProps: selectMenuProps,
                renderValue: (value) => {
                  if (!value) return "Select task";
                  const task = tasks.find((t) => String(t.id) === String(value));
                  return task ? getTaskLabel(task) : "Select task";
                },
              }}
            >
              <MenuItem value="">
                <Typography sx={{ color: "#94a3b8" }}>Select task</Typography>
              </MenuItem>

              {tasks.map((task) => (
                <MenuItem key={task.id} value={String(task.id)}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                      {task.title || "Untitled Task"}
                    </Typography>
                    <Typography sx={{ color: "#94a3b8", fontSize: 12, mt: 0.2 }}>
                      Project: {getProjectName(task)} • Priority: {getPriority(task)}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Input>
          </Grid>

          <Grid item xs={12} md={6}>
            <Input
              select
              label="Developer"
              value={selectedDeveloperId}
              onChange={(e) => setSelectedDeveloperId(e.target.value)}
              SelectProps={{
                MenuProps: selectMenuProps,
                renderValue: (value) => {
                  if (!value) return "Select developer";
                  const dev = developers.find((d) => String(d.id) === String(value));
                  return dev?.name || "Select developer";
                },
              }}
            >
              <MenuItem value="">
                <Typography sx={{ color: "#94a3b8" }}>Select developer</Typography>
              </MenuItem>

              {developers.map((dev) => (
                <MenuItem key={dev.id} value={String(dev.id)}>
                  <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                      {dev.name}
                    </Typography>
                    {dev.email ? (
                      <Typography sx={{ color: "#94a3b8", fontSize: 12, mt: 0.2 }}>
                        {dev.email}
                      </Typography>
                    ) : null}
                  </Box>
                </MenuItem>
              ))}
            </Input>
          </Grid>
        </Grid>

        {selectedTask ? (
          <Box
            sx={{
              mt: 1.5,
              p: 1.5,
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
              Selected Task
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              sx={{ mt: 1 }}
            >
              <InfoPill label="Task" value={selectedTask.title || "Untitled Task"} />
              <InfoPill label="Project" value={getProjectName(selectedTask)} />
              <InfoPill label="Priority" value={getPriority(selectedTask)} />
              <InfoPill label="Status" value={getStatus(selectedTask)} />
            </Stack>
          </Box>
        ) : null}

        <Box sx={{ display: "flex", gap: 1, mt: 1.8, flexWrap: "wrap" }}>
          <Button
            tone="soft"
            loading={loadingAssignAI}
            disabled={!canAssignAI}
            onClick={handleAssignWithAI}
            sx={{ minHeight: 42, px: 2.4, fontWeight: 800 }}
          >
            AI Suggest
          </Button>

          <Button
            loading={loadingAssignManual}
            disabled={!canAssignManual}
            onClick={handleAssignManual}
            sx={{ minHeight: 42, px: 2.4, fontWeight: 800 }}
          >
            Assign Manually
          </Button>
        </Box>

        {msg ? (
          <Box
            sx={{
              mt: 1.6,
              px: 1.4,
              py: 0.9,
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {msg}
            </Typography>
          </Box>
        ) : null}

        {suggestion?.recommendedDeveloper ? (
          <Box
            sx={{
              mt: 1.6,
              p: 1.4,
              borderRadius: 2,
              border: "1px solid rgba(59,130,246,0.3)",
              background: "rgba(59,130,246,0.1)",
            }}
          >
            <Typography sx={{ fontWeight: 900 }}>
              AI recommendation: {suggestion.recommendedDeveloper.name}
            </Typography>

            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.4 }}>
              Confidence {suggestion.confidence}% • {suggestion.explanation}
            </Typography>
          </Box>
        ) : null}

        <Divider sx={{ my: 2.2, borderColor: "rgba(255,255,255,0.08)" }} />

        <Typography sx={{ fontWeight: 900, mb: 1.2 }}>
          Task Queue
        </Typography>

        {tasks.length === 0 ? (
          <Typography variant="body2" sx={{ color: "#94a3b8" }}>
            No tasks available.
          </Typography>
        ) : (
          <Box
            sx={{
              maxHeight: 420,
              overflow: "auto",
              pr: 0.5,
              "&::-webkit-scrollbar": {
                width: 8,
              },
              "&::-webkit-scrollbar-track": {
                background: "rgba(255,255,255,0.04)",
                borderRadius: 999,
              },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(124,92,255,0.55)",
                borderRadius: 999,
              },
            }}
          >
            <Stack spacing={1}>
              {tasks.slice(0, 20).map((task) => {
                const assignee = getAssignee(task);

                return (
                  <Paper
                    key={task.id}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.035)",
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "1.3fr 1fr 0.7fr 0.7fr 1fr",
                        },
                        gap: 1.2,
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: 15 }}>
                          {task.title || "Untitled Task"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b" }}>
                          Task ID: {task.id}
                        </Typography>
                      </Box>

                      <Typography
                        variant="body2"
                        sx={{ color: "#cbd5e1", fontWeight: 800 }}
                      >
                        {getProjectName(task)}
                      </Typography>

                      <StatusChip label={getPriority(task)} type="priority" />

                      <StatusChip label={getStatus(task)} type="status" />

                      <Typography
                        variant="body2"
                        sx={{ color: assignee ? "#cbd5e1" : "#94a3b8" }}
                      >
                        {assignee ? `Assigned: ${assignee}` : "Unassigned"}
                      </Typography>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          </Box>
        )}
      </Card>
    </Box>
  );
}

function InfoPill({ label, value }) {
  return (
    <Box
      sx={{
        px: 1.2,
        py: 0.7,
        borderRadius: 999,
        bgcolor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Typography
        component="span"
        sx={{ color: "#94a3b8", fontSize: 12, fontWeight: 700 }}
      >
        {label}:{" "}
      </Typography>
      <Typography
        component="span"
        sx={{ color: "#e5e7eb", fontSize: 12, fontWeight: 900 }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function StatusChip({ label, type }) {
  const normalized = String(label || "").toUpperCase();

  let bgcolor = "rgba(124,92,255,0.14)";
  let color = "#e5e7eb";

  if (type === "priority" && normalized === "HIGH") {
    bgcolor = "rgba(239,68,68,0.14)";
    color = "#fecaca";
  }

  if (type === "priority" && normalized === "MEDIUM") {
    bgcolor = "rgba(245,158,11,0.14)";
    color = "#fde68a";
  }

  if (type === "priority" && normalized === "LOW") {
    bgcolor = "rgba(34,197,94,0.14)";
    color = "#bbf7d0";
  }

  if (type === "status" && (normalized === "DONE" || normalized === "COMPLETED")) {
    bgcolor = "rgba(34,197,94,0.14)";
    color = "#bbf7d0";
  }

  if (type === "status" && normalized.includes("PROGRESS")) {
    bgcolor = "rgba(59,130,246,0.14)";
    color = "#bfdbfe";
  }

  return (
    <Chip
      size="small"
      label={label || "-"}
      sx={{
        width: "fit-content",
        bgcolor,
        color,
        border: "1px solid rgba(255,255,255,0.08)",
        fontWeight: 800,
      }}
    />
  );
}
