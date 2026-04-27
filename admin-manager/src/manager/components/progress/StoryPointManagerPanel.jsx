import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import api from "../../../services/api";

const emptyForm = {
  title: "",
  description: "",
  pointValue: 1,
};

function getTaskLabel(task) {
  return task?.title || `Task ${task?.id}`;
}

export default function StoryPointManagerPanel({ tasks = [] }) {
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [storyPoints, setStoryPoints] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingStoryPointId, setEditingStoryPointId] = useState(null);

  const selectedTask = useMemo(
    () => tasks.find((task) => String(task?.id) === String(selectedTaskId)) || null,
    [tasks, selectedTaskId]
  );

  const canCreate = useMemo(
    () => Boolean(selectedTaskId && form.title.trim() && Number(form.pointValue) > 0),
    [form.pointValue, form.title, selectedTaskId]
  );

  const loadStoryPoints = async (taskId) => {
    if (!taskId) {
      setStoryPoints([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get(`/tasks/${taskId}/story-points`);
      setStoryPoints(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load story points.");
      setStoryPoints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tasks.length) {
      setSelectedTaskId("");
      setStoryPoints([]);
      return;
    }

    if (!selectedTaskId || !tasks.some((task) => String(task?.id) === String(selectedTaskId))) {
      setSelectedTaskId(String(tasks[0]?.id));
    }
  }, [tasks, selectedTaskId]);

  useEffect(() => {
    if (selectedTaskId) {
      loadStoryPoints(selectedTaskId);
    }
  }, [selectedTaskId]);

  const handleCreate = async () => {
    if (!canCreate) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.post(`/tasks/${selectedTaskId}/story-points`, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        pointValue: Number(form.pointValue),
      });

      setForm(emptyForm);
      setSuccess("Story point created.");
      await loadStoryPoints(selectedTaskId);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to create story point.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (storyPointId) => {
    setError("");
    setSuccess("");

    try {
      await api.delete(`/story-points/${storyPointId}`);
      setSuccess("Story point deleted.");
      await loadStoryPoints(selectedTaskId);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to delete story point.");
    }
  };

  const handleStartEdit = (storyPoint) => {
    setEditingStoryPointId(storyPoint.id);
    setForm({
      title: storyPoint.title || "",
      description: storyPoint.description || "",
      pointValue: Number(storyPoint.pointValue || 1),
    });
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    setEditingStoryPointId(null);
    setForm(emptyForm);
  };

  const handleSaveEdit = async () => {
    if (!editingStoryPointId || !canCreate) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.put(`/story-points/${editingStoryPointId}`, {
        title: form.title.trim(),
        description: form.description.trim() || null,
        pointValue: Number(form.pointValue),
      });

      setEditingStoryPointId(null);
      setForm(emptyForm);
      setSuccess("Story point updated.");
      await loadStoryPoints(selectedTaskId);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to update story point.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography sx={{ fontWeight: 900, mb: 1.5 }}>
        Story Point Management
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ mb: 1.5 }}>
        <TextField
          select
          size="small"
          label="Task"
          value={selectedTaskId}
          onChange={(event) => setSelectedTaskId(event.target.value)}
          sx={{ minWidth: 260 }}
        >
          {tasks.map((task) => (
            <MenuItem key={task.id} value={String(task.id)}>
              {getTaskLabel(task)}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          label="Title"
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          fullWidth
        />
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ mb: 1.5 }}>
        <TextField
          size="small"
          label="Description"
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          fullWidth
        />

        <TextField
          size="small"
          label="Point Value"
          type="number"
          inputProps={{ min: 1 }}
          value={form.pointValue}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, pointValue: Math.max(1, Number(event.target.value) || 1) }))
          }
          sx={{ width: 160 }}
        />

        {editingStoryPointId ? (
          <Stack direction="row" spacing={1}>
            <Button variant="contained" disabled={!canCreate || saving} onClick={handleSaveEdit}>
              Save
            </Button>
            <Button variant="outlined" onClick={handleCancelEdit}>
              Cancel
            </Button>
          </Stack>
        ) : (
          <Button variant="contained" disabled={!canCreate || saving} onClick={handleCreate}>
            Add Story Point
          </Button>
        )}
      </Stack>

      {error ? <Alert severity="error" sx={{ mb: 1.2 }}>{error}</Alert> : null}
      {success ? <Alert severity="success" sx={{ mb: 1.2 }}>{success}</Alert> : null}

      {selectedTask ? (
        <Typography variant="body2" sx={{ color: "#94a3b8", mb: 1.2 }}>
          Managing story points for: {selectedTask.title}
        </Typography>
      ) : null}

      {loading ? (
        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
          Loading story points...
        </Typography>
      ) : null}

      {!loading && storyPoints.length === 0 ? (
        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
          No story points yet.
        </Typography>
      ) : null}

      <Stack spacing={1}>
        {storyPoints.map((storyPoint) => (
          <Box
            key={storyPoint.id}
            sx={{
              p: 1.2,
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "#0f1b2f",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 800 }}>{storyPoint.title}</Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                {storyPoint.status || "TODO"} • {storyPoint.pointValue || 1} pt
              </Typography>
            </Box>

            <Stack direction="row" spacing={0.5}>
              <IconButton size="small" onClick={() => handleStartEdit(storyPoint)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleSaveEdit} sx={{ display: "none" }}>
                <SaveOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleCancelEdit} sx={{ display: "none" }}>
                <CancelOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleDelete(storyPoint.id)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

