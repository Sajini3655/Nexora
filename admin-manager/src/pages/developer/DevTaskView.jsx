import React, { useEffect, useMemo, useState } from "react";
import { Box, Checkbox, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";

import { currentProject } from "../../dev/data/devWorkspaceMock";
import { loadTasks, updateTask } from "../../dev/data/taskStore";
import { syncAssignedTasksToLocalStoreSafe } from "../../dev/data/taskApi";

function calcPoints(subtasks) {
  const total = subtasks.reduce((s, x) => s + Number(x.points || 0), 0);
  const done = subtasks.filter((x) => x.done).reduce((s, x) => s + Number(x.points || 0), 0);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}

function makeId(taskId, prefix = "ST") {
  const rnd =
    (typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID()) ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${taskId}-${prefix}-${rnd}`;
}

export default function DevTaskView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(() => loadTasks().find((t) => String(t.id) === String(id)) || null);
  const [subtasks, setSubtasks] = useState(() => (task?.subtasks ? task.subtasks : []));
  const [newTitle, setNewTitle] = useState("");
  const [newPoints, setNewPoints] = useState("");

  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (task) return;
      await syncAssignedTasksToLocalStoreSafe();
      const found = loadTasks().find((t) => String(t.id) === String(id)) || null;
      if (alive) setTask(found);
    };
    run();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (task) setSubtasks(Array.isArray(task.subtasks) ? task.subtasks : []);
  }, [task?.id]);

  const progress = useMemo(() => calcPoints(subtasks), [subtasks]);

  if (!task) {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 950, mb: 1 }}>
          Task not found
        </Typography>
        <Button variant="outlined" onClick={() => navigate(`/developer/project/${currentProject.id}`)}>
          Back to Workspace
        </Button>
      </Box>
    );
  }

  const addSubtask = () => {
    const title = newTitle.trim();
    const pts = Number(newPoints);
    if (!title) return;
    if (!Number.isFinite(pts) || pts <= 0) return;

    const st = { id: makeId(task.id, "ST"), title, points: pts, done: false };

    setSubtasks((prev) => {
      const next = [...prev, st];
      updateTask(task.id, (t) => ({ ...t, subtasks: next }));
      return next;
    });
    setNewTitle("");
    setNewPoints("");
  };

  const toggleDone = (subId) => {
    setSubtasks((prev) => {
      const next = prev.map((s) => (s.id === subId ? { ...s, done: !s.done } : s));
      updateTask(task.id, (t) => ({ ...t, subtasks: next }));
      return next;
    });
  };

  const removeSubtask = (subId) => {
    setSubtasks((prev) => {
      const next = prev.filter((s) => s.id !== subId);
      updateTask(task.id, (t) => ({ ...t, subtasks: next }));
      return next;
    });
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 2.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Task Details
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 950 }} noWrap>
            {task.title}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.2, flexWrap: "wrap" }}>
            <Chip size="small" label={task.id} variant="outlined" />
            <Chip size="small" label={`Status: ${task.status}`} variant="outlined" />
            <Chip size="small" label={`Assignee: ${task.assignee}`} variant="outlined" />
            <Chip size="small" label={`Due: ${task.dueDate}`} variant="outlined" />
            <Chip size="small" label={`Priority: ${task.priority}`} />
          </Stack>
          {task.description ? (
            <Typography variant="body2" sx={{ opacity: 0.86, mt: 1.8 }}>
              {task.description}
            </Typography>
          ) : null}
          <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: "block" }}>
            Subtasks and story points are saved in your browser (UI demo).
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>

      <Card>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 950 }}>
            Progress (Story Points)
          </Typography>
          <Typography sx={{ fontWeight: 950 }}>
            {progress.pct}% ({progress.done}/{progress.total})
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress.pct}
          sx={{ mt: 1.2, height: 8, borderRadius: 999 }}
        />
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 2.5, mt: 2.5 }}>
        <Card>
          <Typography variant="h6" sx={{ fontWeight: 950, mb: 1.5 }}>
            Subtasks
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            {subtasks.map((s) => (
              <Card key={s.id} sx={{ p: 1.8 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
                  <Box sx={{ display: "flex", gap: 1.2, alignItems: "flex-start", minWidth: 0 }}>
                    <Checkbox checked={!!s.done} onChange={() => toggleDone(s.id)} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                        {s.title}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {s.points} story points
                      </Typography>
                    </Box>
                  </Box>

                  <Button variant="outlined" onClick={() => removeSubtask(s.id)}>
                    Remove
                  </Button>
                </Box>
              </Card>
            ))}
            {subtasks.length === 0 ? (
              <Typography variant="body2" sx={{ opacity: 0.75 }}>
                No subtasks yet. Add one on the right.
              </Typography>
            ) : null}
          </Box>
        </Card>

        <Card>
          <Typography variant="h6" sx={{ fontWeight: 950, mb: 1.5 }}>
            Create Subtask
          </Typography>

          <Input
            label="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g., Create API endpoint"
            sx={{ mb: 1.5 }}
          />

          <Input
            label="Story Points"
            value={newPoints}
            onChange={(e) => setNewPoints(e.target.value)}
            placeholder="e.g., 3"
            inputMode="numeric"
          />

          <Button fullWidth sx={{ mt: 1.5 }} onClick={addSubtask}>
            Add Subtask
          </Button>

          <Typography variant="caption" sx={{ opacity: 0.7, mt: 1.2, display: "block" }}>
            Story points are used to calculate task progress.
          </Typography>
        </Card>
      </Box>
    </Box>
  );
}
