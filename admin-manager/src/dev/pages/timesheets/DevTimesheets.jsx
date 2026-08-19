import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PublishRoundedIcon from "@mui/icons-material/PublishRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import Card from "../../../components/ui/Card.jsx";
import Input from "../../../components/ui/Input.jsx";
import { formatDate } from "../../../utils/formatDate.js";
import { getLocalDateInputValue, isAfterDate } from "../../../utils/dateInput";
import { closeWithBlur } from "../../../utils/focus";
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

const neutralChipSx = {
  bgcolor: "var(--nx-panel-2)",
  color: "var(--nx-text-soft)",
  borderColor: "var(--nx-border)",
  fontWeight: 700,
};

const disabledChipSx = {
  bgcolor: "var(--nx-panel-2)",
  color: "var(--nx-muted)",
  borderColor: "var(--nx-border)",
  opacity: 0.85,
  fontWeight: 700,
};

const disabledButtonSx = {
  "&.Mui-disabled": {
    color: "var(--nx-muted)",
    borderColor: "var(--nx-border)",
    backgroundColor: "var(--nx-panel-2)",
    opacity: 0.85,
  },
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
  const dateInputRef = useRef(null);
  const hoursInputRef = useRef(null);
  const workLocationInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const todayDate = getLocalDateInputValue();

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
    closeWithBlur(() => {
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    });
  };

  const handleSave = async () => {
    try {
      setSavingKey("save");
      setError("");
      setMessage("");

      const parsedHours = Number(form.hours);
      if (!Number.isFinite(parsedHours) || parsedHours <= 0 || parsedHours >= 24) {
        alert("Hours must be greater than 0 and less than 24.");
        return;
      }

      if (!form.workDate) {
        alert("Date is required for draft timesheets.");
        return;
      }

      if (form.description.trim().length < 50) {
        alert("Description must contain at least 50 characters.");
        return;
      }

      if (form.workDate && isAfterDate(form.workDate, todayDate)) {
        alert("Timesheet date cannot be in the future.");
        return;
      }

      const payload = {
        projectId: Number(form.projectId),
        taskId: form.taskId ? Number(form.taskId) : null,
        workDate: form.workDate,
        hours: parsedHours,
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
          <Typography sx={{ color: "var(--nx-text-soft)" }}>Loading timesheets...</Typography>
        </Card>
      ) : items.length === 0 ? (
        <Card sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            No timesheets yet.
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--nx-muted)", mt: 0.5 }}>
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
                    <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
                      {item.taskTitle || "No task linked"} • {formatDate(item.workDate)}
                    </Typography>
                  </Box>
                  <Chip label={item.status} color={chipColor(item.status)} size="small" />
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`${item.hours} hrs`} variant="outlined" sx={neutralChipSx} />
                  <Chip label={WORK_LOCATION_LABELS[item.workLocation] || item.workLocation} variant="outlined" sx={neutralChipSx} />
                  {item.description ? <Chip label={item.description} variant="outlined" sx={neutralChipSx} /> : null}
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }}>
                  <Typography variant="body2" sx={{ color: "var(--nx-muted)" }}>
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
                        <Button size="small" variant="outlined" disabled sx={disabledButtonSx}>
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

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            backgroundColor: "var(--nx-card)",
            color: "var(--nx-text)",
            backgroundImage: "none",
          },
        }}
      >
        <DialogTitle sx={{ color: "var(--nx-text)" }}>{editingId ? "Edit Draft Timesheet" : "Add Draft Timesheet"}</DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: "var(--nx-card)", color: "var(--nx-text)", borderTopColor: "var(--nx-border)", borderBottomColor: "var(--nx-border)" }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Input
              select
              label="Project"
              value={form.projectId}
              onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value, taskId: "" }))}
              sx={{
                "& .MuiSelect-select": {
                  color: form.projectId ? "var(--nx-text)" : "var(--nx-muted)",
                  fontWeight: form.projectId ? 800 : 400,
                },
              }}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      backgroundColor: "var(--nx-card)",
                      color: "var(--nx-text)",
                      "& .MuiMenuItem-root.Mui-selected": {
                        backgroundColor: "color-mix(in srgb, var(--nx-purple) 24%, transparent)",
                        color: "var(--nx-text)",
                        fontWeight: 800,
                      },
                      "& .MuiMenuItem-root.Mui-selected:hover": {
                        backgroundColor: "color-mix(in srgb, var(--nx-purple) 32%, transparent)",
                      },
                    },
                  },
                },
              }}
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
              sx={{
                "& .MuiSelect-select": {
                  color: form.taskId ? "var(--nx-text)" : "var(--nx-muted)",
                  fontWeight: form.taskId ? 800 : 400,
                },
              }}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      backgroundColor: "var(--nx-card)",
                      color: "var(--nx-text)",
                      "& .MuiMenuItem-root.Mui-selected": {
                        backgroundColor: "color-mix(in srgb, var(--nx-purple) 24%, transparent)",
                        color: "var(--nx-text)",
                        fontWeight: 800,
                      },
                      "& .MuiMenuItem-root.Mui-selected:hover": {
                        backgroundColor: "color-mix(in srgb, var(--nx-purple) 32%, transparent)",
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="">No task</MenuItem>
              {selectedProjectTasks.map((task) => (
                <MenuItem key={task.id} value={String(task.id)}>
                  {task.title}
                </MenuItem>
              ))}
            </Input>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6} sx={{ minWidth: 0, display: "flex" }}>
                <Box sx={{ position: "relative", width: "100%", minWidth: 0, m: 0 }}>
                  <Typography variant="body2" sx={{ mb: 0.75, color: "var(--nx-muted)", fontWeight: 700 }}>
                    Date
                  </Typography>
                  <Box
                    onKeyDownCapture={(event) => {
                      if (event.key !== "Tab" || event.shiftKey) return;

                      event.preventDefault();
                      hoursInputRef.current?.focus();
                    }}
                    onClick={() => {
                      dateInputRef.current?.showPicker?.();
                      dateInputRef.current?.focus();
                    }}
                    sx={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                      px: 2,
                      boxSizing: "border-box",
                      width: "100%",
                      minHeight: 56,
                      borderRadius: 2.2,
                      border: "1px solid var(--nx-border)",
                      backgroundColor: "var(--nx-input)",
                      color: "var(--nx-text)",
                      cursor: "pointer",
                      transition: "all 160ms ease",
                      '&:hover': {
                        backgroundColor: "rgba(255,255,255,0.04)",
                      },
                      '&:focus-within': {
                        borderColor: "var(--nx-purple)",
                      },
                    }}
                  >
                    <Typography sx={{ color: form.workDate ? "var(--nx-text)" : "var(--nx-muted)" }}>
                      {form.workDate ? formatDisplayDate(form.workDate) : "Select date"}
                    </Typography>
                    <CalendarTodayOutlinedIcon sx={{ color: "var(--nx-text-soft)" }} />
                    <TextField
                      type="date"
                      value={form.workDate}
                      onChange={(event) => setForm((current) => ({ ...current, workDate: event.target.value }))}
                      inputRef={dateInputRef}
                      inputProps={{
                        max: todayDate,
                        sx: {
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          opacity: 0,
                          cursor: "pointer",
                          pointerEvents: "auto",
                          '&::-webkit-calendar-picker-indicator': {
                            display: "none",
                          },
                          '&::-webkit-clear-button': {
                            display: "none",
                          },
                        },
                      }}
                      sx={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        opacity: 0,
                        pointerEvents: "auto",
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6} sx={{ minWidth: 0, display: "flex" }}>
                <Box sx={{ width: "100%", minWidth: 0, m: 0 }}>
                  <Typography variant="body2" sx={{ mb: 0.75, color: "var(--nx-muted)", fontWeight: 700 }}>
                    Hours
                  </Typography>
                  <Input
                    type="number"
                    inputProps={{ step: "0.25", min: "0", max: "23.75" }}
                    value={form.hours}
                    onChange={(event) => setForm((current) => ({ ...current, hours: event.target.value }))}
                    onKeyDownCapture={(event) => {
                      if (event.key !== "Tab" || event.shiftKey) return;

                      event.preventDefault();
                      workLocationInputRef.current?.focus();
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        minHeight: 56,
                        borderRadius: 2.2,
                        overflow: "hidden",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderRadius: 2.2,
                      },
                    }}
                  />
                </Box>
              </Grid>
            </Grid>

            <Input
              select
              label="Work location"
              value={form.workLocation}
              onChange={(event) => setForm((current) => ({ ...current, workLocation: event.target.value }))}
              inputRef={workLocationInputRef}
              onKeyDownCapture={(event) => {
                if (event.key !== "Tab" || event.shiftKey) return;

                event.preventDefault();
                descriptionInputRef.current?.focus();
              }}
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
              inputRef={descriptionInputRef}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.2,
                  backgroundColor: "var(--nx-input)",
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "var(--nx-card)", color: "var(--nx-text)" }}>
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
      <Typography variant="caption" sx={{ color: "var(--nx-muted)", textTransform: "uppercase", letterSpacing: 1 }}>
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

function formatDisplayDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
