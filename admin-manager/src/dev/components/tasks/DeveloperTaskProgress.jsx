import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, FormControl, MenuItem, Stack, Typography } from "@mui/material";
import useLiveRefresh from "../../../hooks/useLiveRefresh";
import {
  fetchAssignedTasksFromBackend,
} from "../../data/taskApi";
import TaskProgressCard from "./TaskProgressCard";

function normalizeTaskList(data) {
  return Array.isArray(data) ? data : [];
}

function normalizeProgress(progress, fallbackTask) {
  const totalStoryPoints = Number(progress?.totalStoryPoints ?? fallbackTask?.totalStoryPoints ?? 0);
  const completedStoryPoints = Number(progress?.completedStoryPoints ?? fallbackTask?.completedStoryPoints ?? 0);
  const totalPointValue = Number(progress?.totalPointValue ?? fallbackTask?.totalPointValue ?? totalStoryPoints);
  const completedPointValue = Number(progress?.completedPointValue ?? fallbackTask?.completedPointValue ?? completedStoryPoints);
  const progressPercentage = totalPointValue > 0
    ? Math.round((completedPointValue * 100) / totalPointValue)
    : (totalStoryPoints > 0 ? Math.round((completedStoryPoints * 100) / totalStoryPoints) : 0);

  return {
    taskId: fallbackTask?.id,
    totalStoryPoints,
    completedStoryPoints,
    totalPointValue,
    completedPointValue,
    progressPercentage,
    status: progress?.status ?? fallbackTask?.status,
  };
}

export default function DeveloperTaskProgress() {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [progressByTask, setProgressByTask] = useState({});
  const [storyPointsByTask, setStoryPointsByTask] = useState({});
  const [loadingByTask, setLoadingByTask] = useState({});
  const [errorByTask, setErrorByTask] = useState({});
  const [togglingStoryPointId, setTogglingStoryPointId] = useState(null);
  const [error, setError] = useState("");

  const loadTaskProgress = useCallback(async (task) => {
    const taskId = task?.id;
    if (taskId == null) return;

    setLoadingByTask((prev) => ({ ...prev, [taskId]: true }));
    setErrorByTask((prev) => ({ ...prev, [taskId]: "" }));

    setProgressByTask((prev) => ({
      ...prev,
      [taskId]: normalizeProgress(null, task),
    }));

    setStoryPointsByTask((prev) => ({
      ...prev,
      [taskId]: [],
    }));

    setLoadingByTask((prev) => ({ ...prev, [taskId]: false }));
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setError("");
      const taskList = normalizeTaskList(await fetchAssignedTasksFromBackend());
      setTasks(taskList);
      if (!selectedTaskId && taskList.length > 0) {
        setSelectedTaskId(String(taskList[0].id));
      }
      await Promise.all(taskList.map((task) => loadTaskProgress(task)));
    } catch (err) {
      setError(err?.message || "Failed to load assigned tasks.");
      setTasks([]);
    }
  }, [loadTaskProgress, selectedTaskId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const liveTopics = useMemo(() => ["/topic/tasks", "/topic/developer.dashboard"], []);
  useLiveRefresh(liveTopics, loadAll, { debounceMs: 450 });

  const selectedTask = useMemo(
    () => tasks.find((task) => String(task.id) === String(selectedTaskId)) || null,
    [tasks, selectedTaskId]
  );

  const selectedProgress = selectedTask ? progressByTask[selectedTask.id] : null;
  const selectedStoryPoints = selectedTask ? storyPointsByTask[selectedTask.id] || [] : [];
  const selectedLoading = selectedTask ? Boolean(loadingByTask[selectedTask.id]) : false;
  const selectedError = selectedTask ? errorByTask[selectedTask.id] : "";

  const handleToggleStoryPoint = useCallback(
    async (storyPoint) => {
      if (!storyPoint?.id || !selectedTask?.id) return;
    },
    [selectedTask]
  );

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="h5" sx={{ mb: 0.8, fontWeight: 900 }}>
        My Task Progress
      </Typography>

      <Typography variant="body2" sx={{ mb: 2, color: "#94a3b8" }}>
        Select one open task to inspect its story points and live weighted progress.
      </Typography>

      {error ? <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert> : null}

      {tasks.length > 0 ? (
        <Stack spacing={2}>
          <FormControl size="small" sx={{ maxWidth: 420 }}>
            <Typography variant="caption" sx={{ color: "#94a3b8", mb: 0.5 }}>
              Selected task
            </Typography>
            <Box
              component="select"
              value={selectedTaskId}
              onChange={(event) => setSelectedTaskId(event.target.value)}
              style={{
                background: "#0f172a",
                color: "#f8fafc",
                border: "1px solid rgba(148,163,184,0.3)",
                borderRadius: 8,
                padding: "10px 12px",
              }}
            >
              {tasks.map((task) => (
                <option key={task.id} value={String(task.id)}>
                  {task.title} • {task.projectName || "Project"}
                </option>
              ))}
            </Box>
          </FormControl>

          {selectedTask ? (
            <TaskProgressCard
              task={selectedTask}
              progress={selectedProgress}
              storyPoints={selectedStoryPoints}
              loadingStoryPoints={selectedLoading}
              storyPointError={selectedError}
              togglingStoryPointId={togglingStoryPointId}
              onToggleStoryPoint={handleToggleStoryPoint}
            />
          ) : null}
        </Stack>
      ) : (
        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
          No assigned tasks available.
        </Typography>
      )}
    </Box>
  );
}

