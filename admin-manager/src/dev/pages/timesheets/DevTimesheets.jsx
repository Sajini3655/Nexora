import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PublishRoundedIcon from "@mui/icons-material/PublishRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import Card from "../../../components/ui/Card.jsx";
import Input from "../../../components/ui/Input.jsx";
import { formatDate } from "../../../utils/formatDate.js";
import {
  createTimesheet,
  deleteTimesheet,
  fetchMyTimesheetSummary,
  fetchMyTimesheets,
  fetchTimesheetOptions,
  submitTimesheet,
  updateTimesheet,
} from "../../../services/timesheetService.js";

const emptyForm = {
  projectId: "",
  taskId: "",
  workDate: "",
  hours: "",
  workLocation: "WORK_FROM_HOME",
  description: "",
};

const WORK_LOCATION_LABELS = {
  WORK_FROM_HOME: "Work From Home",
  WORK_FROM_OFFICE: "Work From Office",
  OTHER: "Other",
};

export default function DevTimesheets() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [options, setOptions] = useState({ projects: [], taskGroups: [] });
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [timesheets, timesheetSummary, timesheetOptions] = await Promise.all([
        fetchMyTimesheets(),
        fetchMyTimesheetSummary(),
        fetchTimesheetOptions(),
      ]);

      setItems(Array.isArray(timesheets) ? timesheets : []);
      setSummary(timesheetSummary ?? null);
      setOptions({
        projects: Array.isArray(timesheetOptions?.projects) ? timesheetOptions.projects : [],
        taskGroups: Array.isArray(timesheetOptions?.taskGroups) ? timesheetOptions.taskGroups : [],
      });
    } catch (err) {
      setError(err?.message || "Failed to load timesheets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const projectGroups = useMemo(() => {
    const map = new Map();
    options.taskGroups.forEach((group) => {
      if (group?.projectId != null) {
        map.set(String(group.projectId), group.tasks || []);
      }
    });
    return map;
  }, [options.taskGroups]);

  const selectedProjectTasks = useMemo(() => {
    if (!form.projectId) return [];
    return projectGroups.get(String(form.projectId)) || [];
  }, [form.projectId, projectGroups]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      projectId: item.projectId ? String(item.projectId) : "",
      taskId: item.taskId ? String(item.taskId) : "",
      workDate: item.workDate || "",
      hours: item.hours ?? "",
      workLocation: item.workLocation || "WORK_FROM_HOME",
      description: item.description || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    try {
      setSavingKey("save");
      setError("");
      setMessage("");

      const payload = {
        projectId: Number(form.projectId),
        taskId: form.taskId ? Number(form.taskId) : null,
        workDate: form.workDate,
        hours: Number(form.hours),
        description: form.description,
        workLocation: form.workLocation,
        saveAsDraft: true,
      };

      if (editingId) {
        await updateTimesheet(editingId, payload);
        setMessage("Draft timesheet updated.");
      } else {
        await createTimesheet(payload);
        setMessage("Draft timesheet created.");
      }

      closeDialog();
      await loadData();
    } catch (err) {
      setError(err?.message || "Unable to save timesheet.");
    } finally {
      setSavingKey("");
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm("Delete this draft timesheet?")) return;

    try {
      setSavingKey(`delete-${item.id}`);
      setError("");
      setMessage("");
      await deleteTimesheet(item.id);
      setMessage("Draft timesheet deleted.");
      await loadData();
    } catch (err) {
      setError(err?.message || "Unable to delete timesheet.");
    } finally {
      setSavingKey("");
    }
  };

  const handleSubmit = async (item) => {
    try {
      setSavingKey(`submit-${item.id}`);
      setError("");
      setMessage("");
      await submitTimesheet(item.id);
      setMessage("Timesheet submitted for review.");
      await loadData();
    } catch (err) {
      setError(err?.message || "Unable to submit timesheet.");
    } finally {
      setSavingKey("");
    }
  };

  const counts = {
    draft: summary?.draftCount ?? 0,
    submitted: summary?.submittedCount ?? 0,
    approved: summary?.approvedCount ?? 0,
    rejected: summary?.rejectedCount ?? 0,
    totalHours: formatHours(summary?.totalHours),
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.15 }}>
            My Timesheets
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.75 }}>
            Track your own work. Drafts can be edited or deleted; submitted items become read-only.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ alignSelf: { xs: "stretch", md: "auto" } }} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
            Add Draft
          </Button>
          <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={loadData}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error" sx={{ whiteSpace: "pre-line" }}>{error}</Alert> : null}
      {message ? <Alert severity="success">{message}</Alert> : null}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={2.4}>
          <SummaryCard label="Drafts" value={counts.draft} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <SummaryCard label="Submitted" value={counts.submitted} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <SummaryCard label="Approved" value={counts.approved} />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <SummaryCard label="Rejected" value={counts.rejected} />
        </Grid>
        <Grid item xs={12} sm={12} md={2.4}>
          <SummaryCard label="Total Hours" value={counts.totalHours} />
        </Grid>
      </Grid>

      {loading ? (
        <Card sx={{ p: 3 }}>
          <Typography sx={{ color: "#cbd5e1" }}>Loading timesheets...</Typography>
        </Card>
      ) : items.length === 0 ? (
        <Card sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            No timesheets yet.
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
            Create a draft to start tracking work hours.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {items.map((item) => (
            <Card key={item.id} sx={{ p: 2.5 }}>
              <Stack spacing={1.5}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      {item.projectName || "Project"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                      {item.taskTitle || "No task linked"} • {formatDate(item.workDate)}
                    </Typography>
                  </Box>
                  <Chip label={item.status} color={chipColor(item.status)} size="small" />
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`${item.hours} hrs`} variant="outlined" />
                  <Chip label={WORK_LOCATION_LABELS[item.workLocation] || item.workLocation} variant="outlined" />
                  {item.description ? <Chip label={item.description} variant="outlined" /> : null}
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }}>
                  <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                    Updated {item.updatedAt ? formatDate(item.updatedAt) : formatDate(item.createdAt)}
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {item.status === "DRAFT" ? (
                      <>
                        <Button size="small" variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => openEdit(item)}>
                          Edit
                        </Button>
                        <Button size="small" variant="outlined" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => handleDelete(item)} disabled={savingKey === `delete-${item.id}`}>
                          Delete
                        </Button>
                        <Button size="small" variant="contained" startIcon={<PublishRoundedIcon />} onClick={() => handleSubmit(item)} disabled={savingKey === `submit-${item.id}`}>
                          Submit
                        </Button>
                      </>
                    ) : (
                      <Button size="small" variant="outlined" disabled>
                        View only
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle>{editingId ? "Edit Draft Timesheet" : "Add Draft Timesheet"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Input
              select
              label="Project"
              value={form.projectId}
              onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value, taskId: "" }))}
            >
              <MenuItem value="">Select project</MenuItem>
              {options.projects.map((project) => (
                <MenuItem key={project.id} value={String(project.id)}>
                  {project.name}
                </MenuItem>
              ))}
            </Input>

            <Input
              select
              label="Task"
              value={form.taskId}
              onChange={(event) => setForm((current) => ({ ...current, taskId: event.target.value }))}
              disabled={!form.projectId}
            >
              <MenuItem value="">No task</MenuItem>
              {selectedProjectTasks.map((task) => (
                <MenuItem key={task.id} value={String(task.id)}>
                  {task.title}
                </MenuItem>
              ))}
            </Input>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Input
                  type="date"
                  label="Date"
                  value={form.workDate}
                  onChange={(event) => setForm((current) => ({ ...current, workDate: event.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Input
                  type="number"
                  label="Hours"
                  inputProps={{ step: "0.25", min: "0" }}
                  value={form.hours}
                  onChange={(event) => setForm((current) => ({ ...current, hours: event.target.value }))}
                />
              </Grid>
            </Grid>

            <Input
              select
              label="Work location"
              value={form.workLocation}
              onChange={(event) => setForm((current) => ({ ...current, workLocation: event.target.value }))}
            >
              {Object.entries(WORK_LOCATION_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Input>

            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.2,
                  backgroundColor: "rgba(255,255,255,0.05)",
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={savingKey === "save"}>
            {editingId ? "Update Draft" : "Save Draft"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function SummaryCard({ label, value }) {
  return (
    <Card sx={{ p: 2.5, height: "100%" }}>
      <Typography variant="caption" sx={{ color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>
        {value}
      </Typography>
    </Card>
  );
}

function formatHours(value) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) {
    return "0.00";
  }
  return number.toFixed(2);
}

function chipColor(status) {
  switch (status) {
    case "DRAFT":
      return "default";
    case "SUBMITTED":
      return "warning";
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "error";
    default:
      return "default";
  }
}
