import React, { useMemo, useState } from "react";
import { Box, Button, Chip, Divider, MenuItem, Paper, Stack, Typography } from "@mui/material";
import PageHeader from "../../../components/ui/PageHeader";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import { assignManagerTaskAssignee, getErrorMessage, suggestManagerTaskAssignment } from "../../../services/managerService";
import { useManagerDevelopers, useManagerTasks } from "../../data/useManager";
import StatusBadge from "../../../components/ui/StatusBadge.jsx";

function getProjectName(task) {
  return task?.projectName || task?.project_name || task?.project?.name || task?.projectTitle || task?.project_title || task?.project?.title || "Project not provided";
}

function getPriority(task) {
  return task?.priority || task?.taskPriority || "-";
}

function getStatus(task) {
  return task?.status || task?.taskStatus || "-";
}

function getAssignee(task) {
  return task?.assignedToName || task?.assigned_to_name || task?.assignedTo?.name || task?.assigneeName || "";
}

function isAssignedTask(task) {
  return Boolean(getAssignee(task) || task?.assignedToId || task?.assigned_to_id || task?.assignedTo);
}

function getTaskLabel(task) {
  return `${task?.title || "Untitled Task"} — ${getProjectName(task)}`;
}

export default function AIAssignment() {
  const developersQuery = useManagerDevelopers();
  const tasksQuery = useManagerTasks();
  
  const developers = Array.isArray(developersQuery.data) ? developersQuery.data : [];
  const tasks = Array.isArray(tasksQuery.data) ? tasksQuery.data : [];
  const queryError = developersQuery.error?.message || tasksQuery.error?.message || "";

  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedDeveloperId, setSelectedDeveloperId] = useState("");
  const [suggestion, setSuggestion] = useState(null);
  const [loadingAssignManual, setLoadingAssignManual] = useState(false);
  const [loadingAssignAI, setLoadingAssignAI] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const unassignedTasks = useMemo(() => tasks.filter((task) => !isAssignedTask(task)), [tasks]);
  const assignedTasks = useMemo(() => tasks.filter((task) => isAssignedTask(task)), [tasks]);

  useEffect(() => {
    if (selectedTaskId && !unassignedTasks.some((task) => String(task.id) === String(selectedTaskId))) {
      setSelectedTaskId("");
      setSelectedDeveloperId("");
      setSuggestion(null);
    }
  }, [selectedTaskId, unassignedTasks]);

  const selectedTask = useMemo(
    () => unassignedTasks.find((task) => String(task.id) === String(selectedTaskId)) || null,
    [unassignedTasks, selectedTaskId]
  );

  const canAssignManual = useMemo(() => Boolean(selectedTaskId && selectedDeveloperId), [selectedTaskId, selectedDeveloperId]);
  const canAssignAI = useMemo(() => Boolean(selectedTaskId && selectedTask?.title), [selectedTaskId, selectedTask]);

  const handleAssignManual = async () => {
    if (!canAssignManual) return;

    setActionMsg("");
    setSuggestion(null);
    setLoadingAssignManual(true);

    try {
      await assignManagerTaskAssignee(Number(selectedTaskId), Number(selectedDeveloperId));
      const dev = developers.find((d) => String(d?.id) === String(selectedDeveloperId));
      setActionMsg(dev ? `Assigned to ${dev.name}.` : "Task assignment updated.");
      setSelectedTaskId("");
      setSelectedDeveloperId("");
      await Promise.all([developersQuery.refetch(), tasksQuery.refetch()]);
    } catch (e) {
      setActionMsg(getErrorMessage(e, "Manual assignment failed."));
    } finally {
      setLoadingAssignManual(false);
    }
  };

  const handleAssignWithAI = async () => {
    if (!canAssignAI || !selectedTask) return;

    setActionMsg("");
    setSuggestion(null);
    setLoadingAssignAI(true);

    try {
      const data = await suggestManagerTaskAssignment({
        title: selectedTask?.title || "",
        description: selectedTask?.description || "",
        estimatedPoints: selectedTask?.estimatedPoints != null ? Number(selectedTask.estimatedPoints) : null,
      });

      setSuggestion(data);
      const recommendedId = data?.recommendedDeveloper?.id;

      if (!recommendedId) {
        throw new Error("No AI recommendation available for this task.");
      }

      setSelectedDeveloperId(String(recommendedId));
      setActionMsg(`AI suggested: ${data.recommendedDeveloper.name}. Click \"Assign Manually\" to confirm.`);
    } catch (e) {
      setActionMsg(getErrorMessage(e, "AI assignment failed."));
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
        "& .MuiMenuItem-root.Mui-selected": { bgcolor: "rgba(124,92,255,0.20)" },
        "& .MuiMenuItem-root:hover": { bgcolor: "rgba(124,92,255,0.14)" },
      },
    },
  };

  return (
    <Box sx={{ p: { xs: 0, md: 0.5 } }}>
      <PageHeader
        title="AI Task Assignment"
        subtitle="Work only with unassigned tasks. Assigned work stays in the queue below for review."
        right={<Chip label={`Unassigned: ${unassignedTasks.length}`} sx={{ fontWeight: 700, color: "#a7f3d0", border: "1px solid rgba(16,185,129,0.28)", backgroundColor: "rgba(16,185,129,0.12)" }} />}
      />

      <Card sx={{ p: 2.4, borderRadius: 3, border: "1px solid rgba(255,255,255,0.09)", background: "#0b1628", boxShadow: "none" }}>
        <Typography sx={{ fontWeight: 950, mb: 1.6, fontSize: 20 }}>Assign Unassigned Task</Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
          <Input
            select
            label="Task"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            SelectProps={{
              MenuProps: selectMenuProps,
              renderValue: (value) => {
                if (!value) return "Select unassigned task";
                const task = unassignedTasks.find((t) => String(t.id) === String(value));
                return task ? getTaskLabel(task) : "Select unassigned task";
              },
            }}
          >
            <MenuItem value=""><Typography sx={{ color: "#94a3b8" }}>Select unassigned task</Typography></MenuItem>
            {unassignedTasks.map((task) => (
              <MenuItem key={task.id} value={String(task.id)}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: 14 }}>{task.title || "Untitled Task"}</Typography>
                  <Typography sx={{ color: "#94a3b8", fontSize: 12, mt: 0.2 }}>
                    Project: {getProjectName(task)} • Priority: {getPriority(task)}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Input>

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
            <MenuItem value=""><Typography sx={{ color: "#94a3b8" }}>Select developer</Typography></MenuItem>
            {developers.map((dev) => (
              <MenuItem key={dev.id} value={String(dev.id)}>
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: 14 }}>{dev.name}</Typography>
                  {dev.email ? <Typography sx={{ color: "#94a3b8", fontSize: 12, mt: 0.2 }}>{dev.email}</Typography> : null}
                </Box>
              </MenuItem>
            ))}
          </Input>
        </Box>

        {selectedTask ? (
          <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, border: "1px solid rgba(255,255,255,0.08)", background: "#0f1b2f" }}>
            <Typography sx={{ fontWeight: 900, fontSize: 14 }}>Selected Task</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
              <InfoPill label="Task" value={selectedTask.title || "Untitled Task"} />
              <InfoPill label="Project" value={getProjectName(selectedTask)} />
              <InfoPill label="Priority" value={getPriority(selectedTask)} />
              <InfoPill label="Status" value={getStatus(selectedTask)} />
            </Stack>
          </Box>
        ) : null}

        <Box sx={{ display: "flex", gap: 1, mt: 1.8, flexWrap: "wrap" }}>
          <Button disabled={!canAssignAI || loadingAssignAI} onClick={handleAssignWithAI} sx={{ minHeight: 42, px: 2.4, fontWeight: 800 }}>
            AI Suggest
          </Button>
          <Button disabled={!canAssignManual || loadingAssignManual} onClick={handleAssignManual} sx={{ minHeight: 42, px: 2.4, fontWeight: 800 }}>
            Assign Manually
          </Button>
        </Box>

        {queryError ? (
          <Box sx={{ mt: 1.6, px: 1.4, py: 0.9, borderRadius: 2, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)" }}>
            <Typography variant="body2" sx={{ color: "#ef5350" }}>{queryError}</Typography>
          </Box>
        ) : null}

        {actionMsg ? (
          <Box sx={{ mt: 1.6, px: 1.4, py: 0.9, borderRadius: 2, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>{actionMsg}</Typography>
          </Box>
        ) : null}

        {suggestion?.recommendedDeveloper ? (
          <Box sx={{ mt: 1.6, p: 1.4, borderRadius: 2, border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.1)" }}>
            <Typography sx={{ fontWeight: 900 }}>AI recommendation: {suggestion.recommendedDeveloper.name}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.4 }}>Confidence {suggestion.confidence}% • {suggestion.explanation}</Typography>
          </Box>
        ) : null}

        <Divider sx={{ my: 2.2, borderColor: "rgba(255,255,255,0.08)" }} />

        <Typography sx={{ fontWeight: 900, mb: 1.2 }}>Task Queue</Typography>

        <Stack spacing={2}>
          <QueueSection title="Unassigned" tasks={unassignedTasks} accent="rgba(34,197,94,0.14)" />
          <QueueSection title="Assigned" tasks={assignedTasks} accent="rgba(124,92,255,0.14)" />
        </Stack>
      </Card>
    </Box>
  );
}

function QueueSection({ title, tasks, accent }) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
        <StatusBadge label={tasks.length} variant="neutral" />
      </Stack>
      <Stack spacing={1}>
        {tasks.length === 0 ? (
          <Typography variant="body2" sx={{ color: "#94a3b8" }}>No tasks in this section.</Typography>
        ) : tasks.slice(0, 12).map((task) => (
          <Paper key={task.id} elevation={0} sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.035)" }}>
            <Typography sx={{ fontWeight: 900, fontSize: 15 }}>{task.title || "Untitled Task"}</Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.25 }}>
              {task.projectName || "No project"} • {task.status || "Unknown"} • {task.priority || "Medium"}
              {task.assignedToName ? ` • Assigned: ${task.assignedToName}` : ""}
            </Typography>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}

function InfoPill({ label, value }) {
  return (
    <Box sx={{ px: 1.2, py: 0.7, borderRadius: 999, bgcolor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <Typography component="span" sx={{ color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>{label}: </Typography>
      <Typography component="span" sx={{ color: "#e5e7eb", fontSize: 12, fontWeight: 900 }}>{value}</Typography>
    </Box>
  );
}



